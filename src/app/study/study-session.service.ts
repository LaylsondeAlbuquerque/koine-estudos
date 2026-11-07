import {afterNextRender, computed, inject, Injectable, Injector, signal} from '@angular/core';
import {Router} from '@angular/router';
import {localDate, meaningsOverlap, reviewAnswer, selectStudyQuestions, selectWords, shuffle, shufflePairOrder, vocabularyQuestion} from '../../../core.js';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Area, Lesson, Word} from '../models';

export type StudyMode = 'practice' | 'flashcards';
export interface StartSessionOptions {
  area: Area;
  mode: StudyMode;
  lessonId?: string;
  wordId?: string;
  filter?: string;
  wordState?: string;
  limit?: number;
}

export interface StudyQuestion {
  id: string;
  kind: 'choice' | 'parse' | 'match' | 'order';
  prompt: string;
  explanation: string;
  greek?: string | null;
  stimulus?: string | null;
  options?: string[];
  answer?: number | string[];
  optionsLang?: string | null;
  fields?: {label: string; options: string[]; answer: string}[];
  pairs?: {left: string; right: string}[];
  tokens?: string[];
  rightOrder?: number[];
  tokenOrder?: number[];
  lessonId?: string;
  lessonTitle?: string;
  label?: string;
  audio?: string | null;
  wordId?: string;
  wordIds?: string[];
}

export interface StudyResult {
  id: string;
  correct: boolean;
  explanation: string;
  lessonTitle?: string;
}

export interface StudySession {
  area: Area;
  mode: StudyMode;
  originLessonId?: string;
  questions: StudyQuestion[];
  index: number;
  correct: number;
  results: StudyResult[];
  answered: boolean;
  lastCorrect: boolean;
  selected: number | null;
  draftAnswer: number | null;
  cardFront: boolean;
  lastPresentedId: string | null;
  parseValues: string[];
  matched: number[];
  matchErrors: number[];
  matchLeft: number | null;
  matchHint: string;
  order: number[];
  mistakes: number;
}

const resetQuestion = () => ({
  answered: false, lastCorrect: false, selected: null, draftAnswer: null,
  cardFront: false, parseValues: [], matched: [], matchErrors: [],
  matchLeft: null, matchHint: '', order: [], mistakes: 0
});

@Injectable({providedIn: 'root'})
export class StudySessionService {
  private readonly content = inject(ContentService);
  private readonly progress = inject(ProgressService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  readonly session = signal<StudySession | null>(null);
  readonly current = computed(() => {
    const session = this.session();
    return session?.questions[session.index] ?? null;
  });
  readonly finished = computed(() => {
    const session = this.session();
    return !!session && session.index >= session.questions.length;
  });
  readonly errors = computed(() => this.session()?.results.filter(result => !result.correct) ?? []);
  readonly originLesson = computed(() => {
    const session = this.session();
    if (session?.mode !== 'practice' || !session.originLessonId) return null;
    const lesson = this.content.catalog.lessonById.get(session.originLessonId);
    return lesson?.area === session.area ? lesson : null;
  });
  readonly nextLesson = computed(() => {
    const lesson = this.originLesson();
    if (!lesson) return null;
    const lessons = this.content.lessonsFor(lesson.area);
    const index = lessons.findIndex(item => item.id === lesson.id);
    return index >= 0 ? lessons[index + 1] ?? null : null;
  });
  readonly canVerify = computed(() => {
    const session = this.session(), question = this.current();
    if (!session || !question || session.answered) return false;
    if (question.kind === 'choice') return session.draftAnswer !== null;
    if (question.kind === 'parse') return question.fields!.every((_field, index) => !!session.parseValues[index]);
    if (question.kind === 'order') return session.order.length === question.tokens!.length;
    return false;
  });

  start(options: StartSessionOptions): void {
    const {area, mode, lessonId, wordId} = options;
    const limit = Number.isInteger(options.limit) && options.limit! > 0 ? Math.min(options.limit!, 20) : 10;
    const state = this.progress.state();
    let questions: StudyQuestion[] = [];
    if (area === 'vocabulary' && !lessonId) {
      const filter = options.filter || 'level';
      let words: Word[] = selectWords(this.content.vocabulary.entries, state.vocab, {
        limit: mode === 'practice' ? limit * 3 : limit,
        filter: filter === 'level' ? 'all' : filter,
        state: options.wordState || 'all',
        level: filter === 'level' ? this.progress.level(area) : null,
        recent: state.recentWords || []
      });
      if (wordId) {
        const word = this.content.catalog.wordById.get(wordId);
        words = word ? [word] : [];
      }
      if (mode === 'practice' && words.length >= 4) {
        for (let index = 0; index < Math.min(words.length, limit * 3); index += 3) {
          const group = words.slice(index, index + 3);
          const overlaps = group.some((word, i) => group.some((other, j) => i !== j && meaningsOverlap(word.meaning, other.meaning)));
          if (group.length < 3 || overlaps) {
            questions.push(...group.map(word => vocabularyQuestion(word, this.content.vocabulary.entries) as StudyQuestion));
          } else if (index % 6 === 3) {
            questions.push(vocabularyQuestion(group[0], this.content.vocabulary.entries, Math.random, true) as StudyQuestion);
          } else {
            questions.push(this.prepare({
              id: `match-${group.map(word => word.id).join('-')}`, kind: 'match',
              prompt: 'Relacione cada palavra grega ao seu sentido em português.',
              pairs: group.map(word => ({left: word.lemma, right: word.meaning})),
              wordIds: group.map(word => word.id),
              explanation: group.map(word => `${word.lemma}: ${word.meaning}`).join(' · '), label: 'Vocabulário'
            }));
          }
        }
        questions = questions.slice(0, limit);
      } else {
        questions = words.map(word => vocabularyQuestion(word, this.content.vocabulary.entries) as StudyQuestion);
      }
    } else {
      const lesson = lessonId ? this.content.catalog.lessonById.get(lessonId) as Lesson | undefined : undefined;
      const sources: Lesson[] = lessonId ? (lesson?.area === area ? [lesson] : []) : this.content.lessonsFor(area, this.progress.level(area));
      const pool = sources.flatMap(source => source.questions
        .filter((question: any) => mode !== 'flashcards' || ['choice', 'parse'].includes(question.kind))
        .map((question: any) => ({...question, lessonId: source.id, kind: mode === 'flashcards' && question.kind === 'parse' ? 'choice' : question.kind})));
      questions = selectStudyQuestions(pool, state.answers, {limit, recent: state.recentQuestions || []})
        .map((question: any) => {
          const source = this.content.catalog.lessonById.get(question.lessonId) as Lesson;
          const original = source.questions.find((item: any) => item.id === question.id)!;
          return mode === 'flashcards' && original.kind === 'parse' ? this.parsingCard(original, source) : this.prepare(original, source);
        });
      if (questions.length && questions.length < limit) {
        this.progress.toast(`Este filtro tem ${questions.length} exercícios únicos. A sessão termina sem repeti-los.`);
      }
    }
    if (!questions.length) {
      this.progress.toast('Não há exercícios neste filtro. Escolha outro assunto ou repertório.');
      return;
    }
    const origin = mode === 'practice' && lessonId ? this.content.catalog.lessonById.get(lessonId) : undefined;
    this.session.set({area, mode, originLessonId: origin?.area === area ? origin.id : undefined,
      questions, index: 0, correct: 0, results: [], lastPresentedId: null, ...resetQuestion()});
    this.present();
    this.afterRender(() => window.scrollTo(0, 0));
  }

  clear(): void { this.session.set(null); }

  exit(): void {
    const previous = this.session();
    this.clear();
    if (previous) void this.router.navigate(['/', previous.area, previous.mode]);
  }

  returnToLesson(): void {
    const lesson = this.originLesson();
    if (!this.finished() || !lesson) return;
    this.clear();
    void this.router.navigate(['/', lesson.area, 'lesson', lesson.id]);
  }

  completeLessonAndContinue(): void {
    const lesson = this.originLesson();
    if (!this.finished() || !lesson) return;
    const next = this.nextLesson();
    this.progress.mutate(state => state.lessons[lesson.id] = true);
    this.clear();
    void this.router.navigate(next ? ['/', next.area, 'lesson', next.id] : ['/', lesson.area, 'path']);
  }

  choose(index: number): void {
    const session = this.session(), question = this.current();
    if (!session || !question || session.answered || question.kind !== 'choice' || !question.options?.[index]) return;
    if (session.mode === 'flashcards') this.finish(index === question.answer, index);
    else this.session.set({...session, draftAnswer: index});
  }

  flip(): void {
    const session = this.session();
    if (session?.answered) this.session.set({...session, cardFront: !session.cardFront});
  }

  setParse(index: number, value: string): void {
    const session = this.session(), question = this.current();
    if (!session || session.answered || question?.kind !== 'parse' || !question.fields?.[index]) return;
    const parseValues = [...session.parseValues];
    parseValues[index] = value;
    this.session.set({...session, parseValues});
  }

  selectLeft(index: number): void {
    const session = this.session(), question = this.current();
    if (!session || session.answered || question?.kind !== 'match' || !question.pairs?.[index] || session.matched.includes(index)) return;
    this.session.set({...session, matchLeft: index, matchHint: 'Agora selecione o par correspondente à direita.'});
  }

  selectRight(index: number): void {
    const session = this.session(), question = this.current();
    if (!session || session.answered || question?.kind !== 'match' || !question.pairs?.[index] || session.matched.includes(index)) return;
    if (session.matchLeft === null) {
      this.progress.toast('Selecione primeiro um item à esquerda.');
      return;
    }
    if (index === session.matchLeft) {
      const matched = [...session.matched, index], complete = matched.length === question.pairs.length;
      this.session.set({...session, matched, matchLeft: null, matchHint: complete ? 'Todos os pares foram concluídos.' : 'Par correto. Continue com os demais.'});
      if (complete) this.finish(session.mistakes === 0);
    } else {
      this.session.set({...session, mistakes: session.mistakes + 1,
        matchErrors: [...new Set([...session.matchErrors, session.matchLeft])],
        matchHint: 'Esse par não corresponde. Observe as pistas e tente novamente.'});
    }
  }

  addToken(index: number): void {
    const session = this.session(), question = this.current();
    if (!session || session.answered || question?.kind !== 'order' || question.tokens?.[index] === undefined || session.order.includes(index)) return;
    this.session.set({...session, order: [...session.order, index]});
  }

  removeToken(position: number): void {
    const session = this.session();
    if (!session || session.answered || position < 0 || position >= session.order.length) return;
    this.session.set({...session, order: session.order.filter((_index, i) => i !== position)});
  }

  verify(): void {
    const session = this.session(), question = this.current();
    if (!session || !question || !this.canVerify()) return;
    if (question.kind === 'choice') this.finish(session.draftAnswer === question.answer, session.draftAnswer);
    if (question.kind === 'parse') this.finish(question.fields!.every((field, index) => session.parseValues[index] === field.answer));
    if (question.kind === 'order') this.finish(session.order.map(index => question.tokens![index]).join('\u0001') === (question.answer as string[]).join('\u0001'));
  }

  next(): void {
    const session = this.session();
    if (!session?.answered || this.finished()) return;
    const index = session.index + 1;
    this.session.set({...session, index, ...resetQuestion()});
    if (index === session.questions.length) this.progress.mutate(state => state.sessions++);
    else this.present();
    this.afterRender(() => window.scrollTo(0, 0));
  }

  retryErrors(): void {
    const session = this.session();
    if (!session || !this.finished()) return;
    const failures = new Set(this.errors().map(result => result.id));
    const questions = session.questions.filter(question => failures.has(question.id));
    if (!questions.length) return;
    this.session.set({...session, questions, index: 0, correct: 0, results: [], lastPresentedId: null, ...resetQuestion()});
    this.present();
    this.afterRender(() => window.scrollTo(0, 0));
  }

  private finish(correct: boolean, selected: number | null = null): void {
    const session = this.session(), question = this.current();
    if (!session || !question || session.answered) return;
    this.session.set({...session, answered: true, lastCorrect: correct, selected,
      correct: session.correct + Number(correct),
      results: [...session.results, {id: question.id, correct, explanation: question.explanation, lessonTitle: question.lessonTitle}]});
    this.progress.mutate(state => {
      if (!question.wordIds) state.answers[question.id] = {correct, day: localDate(), attempts: (state.answers[question.id]?.attempts || 0) + 1};
      for (const [index, id] of (question.wordIds || []).entries()) {
        state.vocab[id] = reviewAnswer(state.vocab[id], question.kind === 'match' ? !session.matchErrors.includes(index) : correct);
      }
    });
    this.afterRender(() => {
      document.querySelector('.feedback')?.scrollIntoView({block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
      document.querySelector<HTMLElement>('[data-action="next"]')?.focus({preventScroll: true});
    });
  }

  private present(): void {
    const session = this.session(), question = this.current();
    if (!session || !question || session.lastPresentedId === question.id) return;
    this.session.set({...session, lastPresentedId: question.id});
    this.progress.mutate(state => {
      state.recentQuestions = [...(state.recentQuestions || []).filter(id => id !== question.id), question.id].slice(-200);
      if (question.wordIds) state.recentWords = [...(state.recentWords || []).filter(id => !question.wordIds!.includes(id)), ...question.wordIds].slice(-200);
    });
  }

  private prepare(question: any, lesson?: Lesson): StudyQuestion {
    const prepared: StudyQuestion = {...question, lessonId: lesson?.id, lessonTitle: lesson?.title};
    if (prepared.kind === 'choice') {
      const options = shuffle(prepared.options!.map((text, index) => ({text, index})));
      prepared.options = options.map((option: {text: string}) => option.text);
      prepared.answer = options.findIndex((option: {index: number}) => option.index === question.answer);
    }
    if (prepared.kind === 'match') prepared.rightOrder = shufflePairOrder(prepared.pairs!.length);
    if (prepared.kind === 'order') prepared.tokenOrder = shuffle(prepared.tokens!.map((_token, index) => index));
    return prepared;
  }

  private parsingCard(question: any, lesson: Lesson): StudyQuestion {
    const good = question.fields.map((field: any) => `${field.label}: ${field.answer}`).join(' · ');
    const variants: string[] = question.fields.map((field: any, i: number) => {
      const alternative = field.options.find((value: string) => value !== field.answer);
      return alternative ? question.fields.map((other: any, j: number) => `${other.label}: ${j === i ? alternative : other.answer}`).join(' · ') : null;
    }).filter(Boolean);
    const options: string[] = shuffle([good, ...shuffle(variants).slice(0, 3)]);
    return {...question, kind: 'choice', options, answer: options.indexOf(good), fields: undefined, lessonId: lesson.id, lessonTitle: lesson.title};
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, {injector: this.injector});
  }
}
