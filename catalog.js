import {normalize, isMastered, isDue, localDate} from './core.js';

// Content is immutable during a visit. Build relationships once; normalize the
// larger search texts only when the student first uses each search.
export function createCatalog(lessons, articles, words) {
  const lessonById = new Map(lessons.map(item => [item.id, item]));
  const articleById = new Map(articles.map(item => [item.id, item]));
  const wordById = new Map(words.map(item => [item.id, item]));
  const related = new Map();
  for (const article of articles) {
    if (!related.has(article.lessonId)) related.set(article.lessonId, []);
    related.get(article.lessonId).push(article);
  }
  const group = items => {
    const groups = new Map();
    for (const item of [...items].sort((a, b) => a.order - b.order)) {
      for (const key of [item.area, `${item.area}:${item.level}`]) {
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
      }
    }
    return groups;
  };
  const lessonGroups = group(lessons), articleGroups = group(articles);
  const wordLevels = new Map([0, 1, 2, 3].map(level => [level, words.filter(word => word.level === level)]));
  const getGroup = (groups, area, level) => groups.get(level == null ? area : `${area}:${level}`) || [];
  let readingIndex, wordIndex;
  const search = (index, query, limit) => {
    const found = [];
    for (const item of index) {
      if (item.text.includes(query)) found.push(item.value);
      if (found.length >= limit) break;
    }
    return found;
  };
  const getWordIndex = () => wordIndex ??= words.map(word => ({
    value: word, text: normalize(`${word.lemma} ${word.meaning} ${(word.aliases || []).join(' ')}`)
  }));
  return {
    lessonById, articleById, wordById,
    lessonsFor: (area, level = null) => getGroup(lessonGroups, area, level),
    articlesFor: (area, level = null) => getGroup(articleGroups, area, level),
    articlesForLesson: id => related.get(id) || [],
    wordsForLevel: level => wordLevels.get(level) || [],
    wordClasses: [...new Set(words.map(word => word.pos))].sort(),
    searchReadings(query, limit = 12) {
      const term = normalize(query.trim());
      if (!term || limit <= 0) return [];
      readingIndex ??= lessons.flatMap(lesson => [
        {item: lesson, type: 'lesson'},
        ...(related.get(lesson.id) || []).map(item => ({item, type: 'article'}))
      ]).map(({item, type}) => ({
        value: {...item, readingType: type},
        text: normalize([item.title, item.summary, ...item.sections.flatMap(section => [
          section.heading, section.body,
          section.example?.greek, section.example?.translation, section.example?.reference,
          ...(section.table?.headers || []), ...(section.table?.rows.flat() || []),
          section.analysis
        ])].filter(Boolean).join(' '))
      }));
      return search(readingIndex, term, limit);
    },
    searchWords(query, limit = 8) {
      const term = normalize(query.trim());
      return term && limit > 0 ? search(getWordIndex(), term, limit) : [];
    },
    filterWords({query = '', pos = 'all', filter = 'all', reviews = {}, day = localDate()} = {}) {
      const term = normalize(query);
      return getWordIndex().filter(({value: word, text}) =>
        (!term || text.includes(term)) && (pos === 'all' || word.pos === pos) &&
        (filter !== 'core' || word.core300) &&
        (filter !== 'mastered' || isMastered(reviews[word.id])) &&
        (filter !== 'due' || isDue(reviews[word.id], day)) &&
        (filter !== 'new' || !reviews[word.id])
      ).map(item => item.value);
    }
  };
}
