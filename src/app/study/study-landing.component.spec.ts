import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {StudyLandingComponent} from './study-landing.component';
import {StudySessionService} from './study-session.service';
import {BookVocabularyService} from '../book-vocabulary.service';

describe('Seleção dos conjuntos de vocabulário', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('combines the frequency group and learning state independently from size and selected level', () => {
    const level = signal(0), start = vi.fn();
    TestBed.configureTestingModule({providers: [
      {provide: ContentService, useValue: {lessonsFor: () => [], catalog: {wordsForLevel: () => []}}},
      {provide: ProgressService, useValue: {level: () => level()}},
      {provide: StudySessionService, useValue: {start}}
    ]});
    const fixture = TestBed.createComponent(StudyLandingComponent);
    fixture.componentRef.setInput('area', 'vocabulary');
    fixture.componentRef.setInput('mode', 'flashcards');
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const filter = page.querySelector<HTMLSelectElement>('#session-filter')!;
    expect(filter.value).toBe('all');
    expect(Array.from(filter.options,option=>option.value)).toEqual(['all','book','frequent','level']);
    expect(page.querySelector('#session-frequency')).toBeNull();
    filter.value = 'frequent';
    filter.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const frequency=page.querySelector<HTMLSelectElement>('#session-frequency')!;
    expect(Array.from(frequency.options,option=>Number(option.value))).toEqual([10,50,100,200,300]);
    frequency.value='100';frequency.dispatchEvent(new Event('change'));
    const wordState = page.querySelector<HTMLSelectElement>('#session-state')!;
    expect(Array.from(wordState.options, option => option.value)).toEqual(['all','unlearned','mastered','marked','due','new']);
    wordState.value = 'marked';
    wordState.dispatchEvent(new Event('change'));
    const size = page.querySelector<HTMLSelectElement>('#session-size')!;
    size.value = '5';
    size.dispatchEvent(new Event('change'));
    level.set(3); fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('button')!.click();
    expect(start).toHaveBeenCalledWith({area: 'vocabulary', mode: 'flashcards', limit: 5, filter: 'top-100', wordState: 'marked', lessonId: undefined});
    expect(page.querySelector('.study-selection-note')?.textContent).toContain('quantos cartões');
    expect(filter.value).toBe('frequent');
    expect(wordState.value).toBe('marked');
  });

  it('shows distinct missing words per book, reacts to progress and sends the chosen order',()=>{
    const learned=signal(new Set(['w1'])),start=vi.fn();
    TestBed.configureTestingModule({providers:[
      {provide:ContentService,useValue:{lessonsFor:()=>[],catalog:{wordsForLevel:()=>[]}}},
      {provide:ProgressService,useValue:{level:()=>0,wordLearned:(id:string)=>learned().has(id)}},
      {provide:StudySessionService,useValue:{start}},
      {provide:BookVocabularyService,useValue:{books:signal([{id:'MAT',name:'Mateus',words:[{id:'w1',frequency:20,first:1},{id:'w2',frequency:1,first:2}]}]),loading:signal(false),error:signal(''),load:vi.fn()}}
    ]});
    const fixture=TestBed.createComponent(StudyLandingComponent);
    fixture.componentRef.setInput('area','vocabulary');fixture.componentRef.setInput('mode','flashcards');
    fixture.componentInstance.filter.set('book');fixture.detectChanges();
    const page:HTMLElement=fixture.nativeElement;
    expect(page.querySelector('#session-book')?.textContent).toContain('Mateus · faltam 1 de 2');
    learned.set(new Set(['w1','w2']));fixture.detectChanges();
    expect(page.querySelector('.book-vocabulary-progress')?.textContent).toContain('faltam 0 vocábulos');
    fixture.componentInstance.bookOrder.set('appearance');fixture.componentInstance.wordState.set('unlearned');fixture.componentInstance.start();
    expect(start).toHaveBeenCalledWith(expect.objectContaining({bookId:'MAT',bookOrder:'appearance',wordState:'unlearned',filter:'all'}));
  });

  it.each(['flashcards', 'practice'] as const)('presents session sizes in ascending order for %s', mode => {
    TestBed.configureTestingModule({providers: [
      {provide: ContentService, useValue: {lessonsFor: () => [], catalog: {wordsForLevel: () => []}}},
      {provide: ProgressService, useValue: {level: () => 0}},
      {provide: StudySessionService, useValue: {start: vi.fn()}}
    ]});
    const fixture = TestBed.createComponent(StudyLandingComponent);
    fixture.componentRef.setInput('area', 'vocabulary');
    fixture.componentRef.setInput('mode', mode);fixture.detectChanges();
    const size = fixture.nativeElement.querySelector('#session-size') as HTMLSelectElement;
    expect(Array.from(size.options, option => Number(option.value))).toEqual([5, 10, 20]);
    expect(size.value).toBe('10');
  });

  it('keeps frequency groups exclusive to vocabulary and preserves subject selection elsewhere', () => {
    TestBed.configureTestingModule({providers: [
      {provide: ContentService, useValue: {lessonsFor: () => []}},
      {provide: ProgressService, useValue: {level: () => 0}},
      {provide: StudySessionService, useValue: {start: vi.fn()}}
    ]});
    const fixture = TestBed.createComponent(StudyLandingComponent);
    fixture.componentRef.setInput('area', 'morphology');
    fixture.componentRef.setInput('mode', 'flashcards'); fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('#session-filter')).toBeNull();
    expect(page.querySelector('#session-state')).toBeNull();
    expect(page.querySelector('#session-lesson')).not.toBeNull();
    expect(page.querySelector('.study-selection-note')).toBeNull();
  });
});
