import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createCatalog} from '../../../catalog.js';
import {isMastered, validProgress} from '../../../core.js';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Area, blankProgress, Lesson, Progress, Question, Word} from '../models';
import {StudySessionService} from './study-session.service';
import {StudySessionComponent} from './study-session.component';

const lesson = (id: string, questions: Question[]): Lesson => ({
  id, area: 'morphology', level: 0, order: 1, title: id, summary: 'Uma aula.', minutes: 5,
  objectives: ['Praticar'], sections: [], references: [], questions
});
const choice = (id: string): Question => ({id, kind: 'choice', prompt: 'Escolha a primeira letra.', options: ['alfa', 'beta', 'gama'], answer: 0, explanation: 'Alfa é a primeira letra.'});
const parse: Question = {id: 'parse', kind: 'parse', prompt: 'Analise a forma.', fields: [
  {label: 'Caso', options: ['Nominativo', 'Acusativo'], answer: 'Nominativo'},
  {label: 'Número', options: ['Singular', 'Plural'], answer: 'Singular'}
], explanation: 'Nominativo singular.'};
const match: Question = {id: 'match', kind: 'match', prompt: 'Relacione.', pairs: [{left: 'α', right: 'alfa'}, {left: 'β', right: 'beta'}], explanation: 'Cada letra tem um nome.'};
const order: Question = {id: 'order', kind: 'order', prompt: 'Organize.', tokens: ['A', 'palavra', 'permanece'], answer: ['A', 'palavra', 'permanece'], explanation: 'Sujeito seguido do verbo.'};

class MockProgress {
  readonly state = signal<Progress>(blankProgress());
  readonly toast = vi.fn();
  level(area: Area) { return this.state().levels[area]; }
  mutate(update: (state: Progress) => void) { const next = structuredClone(this.state()); update(next); this.state.set(next); }
}

describe('Angular study sessions', () => {
  let study: StudySessionService, progress: MockProgress, content: any, navigate: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    progress = new MockProgress();
    const lessons = [lesson('choice', [choice('choice')]), lesson('parse', [parse]), lesson('match', [match]), lesson('order', [order]), lesson('many', Array.from({length: 15}, (_, index) => choice(`many-${index}`)))];
    const words: Word[] = Array.from({length: 15}, (_, index) => ({
      id: `word-${index}`, lemma: `λέξις${index}`, meaning: `significado ${index}`, pos: 'substantivo', rank: index + 1,
      frequency: 100 - index, level: index % 4, core300: index < 8
    }));
    const catalog = createCatalog(lessons, [], words);
    content = {lessons, articles: [], vocabulary: {meta: {}, entries: words}, catalog, lessonsFor: (area: Area, level: number) => catalog.lessonsFor(area, level)};
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({providers: [StudySessionService,
      {provide: ContentService, useValue: content}, {provide: ProgressService, useValue: progress},
      {provide: Router, useValue: {navigate}}
    ]});
    study = TestBed.inject(StudySessionService);
  });
  afterEach(() => { vi.useRealTimers(); TestBed.resetTestingModule(); });

  it('waits for confirmation, records an error, then retries only the failed question', () => {
    study.start({area: 'morphology', mode: 'practice', lessonId: 'choice'});
    const question = study.current()!;
    const correct = question.answer as number, wrong = (correct + 1) % question.options!.length;
    expect(study.canVerify()).toBe(false);
    study.choose(wrong);
    expect(study.session()!.answered).toBe(false);
    expect(progress.state().answers['choice']).toBeUndefined();
    study.verify();
    expect(study.session()!.lastCorrect).toBe(false);
    expect(progress.state().answers['choice'].attempts).toBe(1);
    study.next();
    expect(study.finished()).toBe(true);
    expect(progress.state().sessions).toBe(1);
    study.retryErrors();
    expect(study.session()!.questions.map(item => item.id)).toEqual(['choice']);
    expect(study.session()!.answered).toBe(false);
    study.choose(study.current()!.answer as number); study.verify(); study.next();
    expect(study.errors()).toEqual([]);
    expect(progress.state().answers['choice'].attempts).toBe(2);
    expect(progress.state().sessions).toBe(2);
  });

  it('turns parsing into a flashcard and preserves front/back review after answering', () => {
    study.start({area: 'morphology', mode: 'flashcards', lessonId: 'parse'});
    const question = study.current()!;
    expect(question.kind).toBe('choice');
    expect(question.options![question.answer as number]).toBe('Caso: Nominativo · Número: Singular');
    study.choose(question.answer as number);
    expect(study.session()!.answered).toBe(true);
    expect(study.session()!.cardFront).toBe(false);
    study.flip(); expect(study.session()!.cardFront).toBe(true);
    study.flip(); expect(study.session()!.cardFront).toBe(false);
    study.next(); expect(study.finished()).toBe(true);
  });

  it('requires every parsing field, even if the last field is selected first', () => {
    study.start({area: 'morphology', mode: 'practice', lessonId: 'parse'});
    study.setParse(1, 'Singular');
    expect(study.canVerify()).toBe(false);
    study.verify(); expect(study.session()!.answered).toBe(false);
    study.setParse(0, 'Nominativo');
    expect(study.canVerify()).toBe(true);
    study.verify();
    expect(study.session()!.lastCorrect).toBe(true);
    expect(study.session()!.parseValues).toEqual(['Nominativo', 'Singular']);
  });

  it('tracks matching mistakes without counting an incomplete exercise as finished', () => {
    study.start({area: 'morphology', mode: 'practice', lessonId: 'match'});
    study.selectRight(0);
    expect(progress.toast).toHaveBeenCalledWith('Selecione primeiro um item à esquerda.');
    study.selectLeft(0); study.selectRight(1);
    expect(study.session()!.mistakes).toBe(1);
    expect(study.session()!.matched).toEqual([]);
    study.selectRight(0);
    expect(study.session()!.matched).toEqual([0]);
    expect(study.session()!.answered).toBe(false);
    study.selectLeft(1); study.selectRight(1);
    expect(study.session()!.answered).toBe(true);
    expect(study.session()!.lastCorrect).toBe(false);
    expect(progress.state().answers['match'].correct).toBe(false);
  });

  it('updates each lexical review according to that word’s matching attempts', () => {
    study.start({area: 'vocabulary', mode: 'practice', filter: 'all', limit: 5});
    const question = study.current()!;
    expect(question.kind).toBe('match');
    study.selectLeft(0); study.selectRight(1); study.selectRight(0);
    study.selectLeft(1); study.selectRight(1);
    study.selectLeft(2); study.selectRight(2);
    const ids = question.wordIds!;
    expect(progress.state().vocab[ids[0]].correct).toBe(0);
    expect(progress.state().vocab[ids[1]].correct).toBe(1);
    expect(progress.state().vocab[ids[2]].correct).toBe(1);
    expect(progress.state().answers[question.id]).toBeUndefined();
    expect(validProgress(progress.state())).toBe(true);
  });

  it('orders unique token positions and allows removing a token before verification', () => {
    study.start({area: 'morphology', mode: 'practice', lessonId: 'order'});
    study.addToken(0); study.addToken(0); study.addToken(2);
    expect(study.session()!.order).toEqual([0, 2]);
    expect(study.canVerify()).toBe(false);
    study.removeToken(1); study.addToken(1); study.addToken(2);
    expect(study.canVerify()).toBe(true);
    study.verify();
    expect(study.session()!.lastCorrect).toBe(true);
  });

  it('avoids duplicates and recently completed questions without mutating authored data', () => {
    const original = JSON.stringify(content.lessons);
    study.start({area: 'morphology', mode: 'practice', lessonId: 'many', limit: 5});
    const first = study.session()!.questions.map(question => question.id);
    expect(new Set(first).size).toBe(5);
    for (let index = 0; index < 5; index++) { study.choose(study.current()!.answer as number); study.verify(); study.next(); }
    study.start({area: 'morphology', mode: 'practice', lessonId: 'many', limit: 5});
    expect(study.session()!.questions.some(question => first.includes(question.id))).toBe(false);
    expect(JSON.stringify(content.lessons)).toBe(original);
  });

  it('supports all-level core filtering and an explicit word without DOM filter leakage', () => {
    study.start({area: 'vocabulary', mode: 'flashcards', filter: 'core', limit: 20});
    expect(study.session()!.questions.length).toBe(8);
    expect(study.session()!.questions.every(question => content.catalog.wordById.get(question.wordId).core300)).toBe(true);
    study.start({area: 'vocabulary', mode: 'flashcards', wordId: 'word-14', filter: 'core'});
    expect(study.session()!.questions.map(question => question.wordId)).toEqual(['word-14']);
  });

  it('requires successful lexical reviews on three distinct days for mastery', () => {
    vi.useFakeTimers({toFake: ['Date']});
    const review = (day: string) => {
      vi.setSystemTime(new Date(`${day}T12:00:00`));
      study.start({area: 'vocabulary', mode: 'flashcards', wordId: 'word-0'});
      study.choose(study.current()!.answer as number);
    };
    review('2026-10-30'); review('2026-10-30'); review('2026-10-30');
    expect(isMastered(progress.state().vocab['word-0'])).toBe(false);
    review('2026-10-31'); expect(isMastered(progress.state().vocab['word-0'])).toBe(false);
    review('2026-11-03'); expect(isMastered(progress.state().vocab['word-0'])).toBe(true);
    expect(validProgress(progress.state())).toBe(true);
  });

  it('handles empty filters and exits to the matching study mode', () => {
    study.start({area: 'vocabulary', mode: 'flashcards', filter: 'due'});
    expect(study.session()).toBeNull();
    expect(progress.toast).toHaveBeenCalledWith('Não há exercícios neste filtro. Escolha outro assunto ou repertório.');
    study.start({area: 'morphology', mode: 'practice', lessonId: 'choice'});
    study.exit();
    expect(study.session()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/', 'morphology', 'practice']);
  });

  it('renders the real Angular exercise template and enables its confirmation binding', () => {
    study.start({area: 'morphology', mode: 'practice', lessonId: 'choice'});
    const fixture = TestBed.createComponent(StudySessionComponent);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const verify = host.querySelector<HTMLButtonElement>('.practice-controls button')!;
    expect(host.querySelector('#practice-prompt')?.textContent).toContain('Escolha a primeira letra.');
    expect(verify.disabled).toBe(true);
    host.querySelectorAll<HTMLButtonElement>('.answer')[study.current()!.answer as number].click();
    fixture.detectChanges();
    expect(verify.disabled).toBe(false);
    expect(host.querySelector('.answer.chosen')).not.toBeNull();
  });
});
