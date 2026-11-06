import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCatalog} from '../catalog.js';
import {normalize, reviewAnswer, isDue, isMastered} from '../core.js';

const read = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url)));
const lessons = ['morphology', 'syntax', 'vocabulary-lessons'].flatMap(read);
const articles = ['articles-morphology', 'articles-syntax', 'articles-vocabulary'].flatMap(read);
const words = read('vocabulary').entries;
const catalog = createCatalog(lessons, articles, words);

test('indexed searches retain full-body matches, accent-insensitive results and their ordering', () => {
  const original = lessons.flatMap(lesson => [{...lesson, readingType: 'lesson'},
    ...articles.filter(article => article.lessonId === lesson.id).map(article => ({...article, readingType: 'article'}))]);
  for (const query of ['pronúncia', 'λογος', 'GENITIVO', 'referência temporal', 'χθές', 'não existe xyz']) {
    const term = normalize(query);
    const expected = original.filter(item => normalize(`${item.title} ${item.summary} ${item.sections.map(section => section.body).join(' ')}`).includes(term));
    const complete = catalog.searchReadings(query, Infinity);
    const existingMatches = new Set(expected.map(item => item.id));
    assert.deepEqual(complete.filter(item => existingMatches.has(item.id)), expected);
    assert.deepEqual(catalog.searchReadings(query), complete.slice(0, 12));
    assert.deepEqual(catalog.searchWords(query), words.filter(word => normalize(`${word.lemma} ${word.meaning} ${(word.aliases || []).join(' ')}`).includes(term)).slice(0, 8));
  }
  assert.deepEqual(catalog.searchReadings(''), []);
  assert.deepEqual(catalog.searchWords('λόγος', 0), []);
});

test('reading search includes worked examples, analysis and tables with the correct reading types', () => {
  const lesson = {id: 'lesson-example', area: 'syntax', level: 1, order: 2, title: 'Aula', summary: 'Introdução', sections: [{
    heading: 'Aposição', body: 'Uma explicação básica.',
    example: {greek: 'δῶρον', translation: 'Dádiva', reference: 'Trecho-modelo'},
    table: {headers: ['Flexão', 'Relação'], rows: [['φωτί', 'associativa']]},
    analysis: 'Uma retomada anafórica. Termo comum.'
  }]};
  const nextLesson = {id: 'lesson-next', area: 'syntax', level: 1, order: 1, title: 'Outra aula', summary: 'Continuação', sections: [{heading: 'Revisão', body: 'Termo comum.'}]};
  const article = {id: 'article-example', lessonId: lesson.id, area: 'syntax', level: 1, order: 2, title: 'Artigo', summary: 'Discussão', sections: [{
    heading: 'Comparação', body: 'Outra explicação.',
    example: {greek: 'δῶρον', translation: 'Oferta'},
    analysis: 'Leitura aprofundada. Termo comum.'
  }]};
  const readings = createCatalog([lesson, nextLesson], [article], []);
  const result = query => readings.searchReadings(query).map(item => [item.id, item.readingType]);
  const lessonResult = [[lesson.id, 'lesson']];
  for (const query of ['aposicao', 'dadiva', 'trecho-modelo', 'anaforica', 'flexao', 'φωτι', 'associativa']) {
    assert.deepEqual(result(query), lessonResult, query);
  }
  assert.deepEqual(result('δωρον'), [[lesson.id, 'lesson'], [article.id, 'article']]);
  assert.deepEqual(result('aprofundada'), [[article.id, 'article']]);
  assert.deepEqual(result('termo comum'), [[lesson.id, 'lesson'], [article.id, 'article'], [nextLesson.id, 'lesson']]);
  assert.deepEqual(readings.searchReadings('termo comum', 2).map(item => item.id), [lesson.id, article.id]);
  assert.deepEqual(readings.searchReadings('termo comum', 0), []);
});

test('catalog relationships preserve every area, level and legacy ID without changing source order', () => {
  const before = lessons.map(lesson => lesson.id);
  for (const area of ['morphology', 'syntax', 'vocabulary']) {
    for (const level of [null, 0, 1, 2, 3]) {
      const expected = items => items.filter(item => item.area === area && (level === null || item.level === level)).sort((a, b) => a.order - b.order);
      assert.deepEqual(catalog.lessonsFor(area, level), expected(lessons));
      assert.deepEqual(catalog.articlesFor(area, level), expected(articles));
    }
  }
  for (const lesson of lessons) {
    assert.equal(catalog.lessonById.get(lesson.id), lesson);
    assert.deepEqual(catalog.articlesForLesson(lesson.id), articles.filter(article => article.lessonId === lesson.id));
  }
  assert.deepEqual(lessons.map(lesson => lesson.id), before);
});

test('indexed repertoire combines current reviews with text and class filters', () => {
  const day = '2026-11-03', reviews = {[words[0].id]: reviewAnswer(undefined, true, '2026-10-20')};
  reviews[words[1].id] = {mastered: true, dates: ['2026-10-20', '2026-10-23', '2026-10-30']};
  for (const filter of ['all', 'core', 'new', 'due', 'mastered']) {
    for (const query of ['', 'palavra', 'θεος']) {
      const expected = words.filter(word => (!query || normalize(`${word.lemma} ${word.meaning} ${(word.aliases || []).join(' ')}`).includes(normalize(query))) &&
        (filter !== 'core' || word.core300) && (filter !== 'new' || !reviews[word.id]) &&
        (filter !== 'due' || isDue(reviews[word.id], day)) && (filter !== 'mastered' || isMastered(reviews[word.id])));
      assert.deepEqual(catalog.filterWords({query, filter, reviews, day}), expected);
    }
  }
  const pos = words[0].pos;
  assert.deepEqual(catalog.filterWords({pos}), words.filter(word => word.pos === pos));
  for (const level of [0, 1, 2, 3]) assert.deepEqual(catalog.wordsForLevel(level), words.filter(word => word.level === level));
});
