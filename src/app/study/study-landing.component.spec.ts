import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {StudyLandingComponent} from './study-landing.component';
import {StudySessionService} from './study-session.service';
import {BookVocabularyService} from '../book-vocabulary.service';

describe('Seleção dos conjuntos de vocabulário', () => {
  beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({providers:[{provide:BookVocabularyService,useValue:{books:signal([]),loading:signal(false),error:signal(''),load:vi.fn()}}]});});
  afterEach(() => TestBed.resetTestingModule());

  it.each(['flashcards','practice'] as const)('restores the book selector after asynchronous options load in %s',mode=>{
    TestBed.configureTestingModule({providers:[
      {provide:ContentService,useValue:{lessonsFor:()=>[],catalog:{wordsForLevel:()=>[]}}},
      {provide:ProgressService,useValue:{level:()=>0,wordLearned:()=>false}},
      {provide:StudySessionService,useValue:{start:vi.fn()}}
    ]});
    let fixture=TestBed.createComponent(StudyLandingComponent);
    fixture.componentRef.setInput('area','vocabulary');fixture.componentRef.setInput('mode',mode);fixture.detectChanges();
    fixture.componentInstance.filter.set('book');fixture.componentInstance.bookId.set('JHN');fixture.detectChanges();fixture.destroy();
    fixture=TestBed.createComponent(StudyLandingComponent);
    fixture.componentRef.setInput('area','vocabulary');fixture.componentRef.setInput('mode',mode);fixture.detectChanges();
    expect(fixture.componentInstance.bookId()).toBe('JHN');
    TestBed.inject(BookVocabularyService).books.set([{id:'JHN',name:'João',words:[]}]);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#session-book').value).toBe('JHN');
    expect(fixture.componentInstance.filter()).toBe('book');
  });

  it('restores settings after remounting and keeps areas and modes independent', () => {
    TestBed.configureTestingModule({providers: [
      {provide: ContentService, useValue: {lessonsFor: () => [], catalog: {wordsForLevel: () => []}}},
      {provide: ProgressService, useValue: {level: () => 0}},
      {provide: StudySessionService, useValue: {start: vi.fn()}}
    ]});
    const mount = () => {
      const fixture = TestBed.createComponent(StudyLandingComponent);
      fixture.componentRef.setInput('area', 'vocabulary');
      fixture.componentRef.setInput('mode', 'flashcards'); fixture.detectChanges();
      return fixture;
    };
    const first = mount();
    const component = first.componentInstance;
    component.size.set(20); component.filter.set('book'); component.bookId.set('JHN');
    component.bookOrder.set('appearance'); component.wordState.set('unlearned'); component.topAmount.set(50);
    first.detectChanges(); first.destroy();
    const second = mount(), restored = second.componentInstance;
    expect([restored.size(), restored.filter(), restored.bookId(), restored.bookOrder(), restored.wordState(), restored.topAmount()])
      .toEqual([20, 'book', 'JHN', 'appearance', 'unlearned', 50]);
    second.componentRef.setInput('mode', 'practice'); second.detectChanges();
    expect(restored.size()).toBe(10); expect(restored.filter()).toBe('all');
    restored.size.set(5); second.detectChanges();
    second.componentRef.setInput('mode', 'flashcards'); second.detectChanges();
    expect(restored.size()).toBe(20); expect(restored.bookId()).toBe('JHN');
    second.componentRef.setInput('area', 'syntax'); second.detectChanges();
    expect(restored.size()).toBe(10);
    restored.lessonId.set('syntax-lesson'); second.detectChanges();
    second.componentRef.setInput('area', 'vocabulary'); second.detectChanges();
    expect(restored.lessonId()).toBe(''); expect(restored.size()).toBe(20);
    second.componentRef.setInput('area', 'syntax'); second.detectChanges();
    expect(restored.lessonId()).toBe('syntax-lesson');
  });

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

  it.each(['flashcards','practice'] as const)('shows a direct book selector, remaining words and chosen order in %s',mode=>{
    const learned=signal(new Set(['w1'])),start=vi.fn();
    TestBed.configureTestingModule({providers:[
      {provide:ContentService,useValue:{lessonsFor:()=>[],catalog:{wordsForLevel:()=>[]}}},
      {provide:ProgressService,useValue:{level:()=>0,wordLearned:(id:string)=>learned().has(id)}},
      {provide:StudySessionService,useValue:{start}},
      {provide:BookVocabularyService,useValue:{books:signal([{id:'MAT',name:'Mateus',words:[{id:'w1',frequency:20,first:1},{id:'w2',frequency:1,first:2}]}]),loading:signal(false),error:signal(''),load:vi.fn()}}
    ]});
    const fixture=TestBed.createComponent(StudyLandingComponent);
    fixture.componentRef.setInput('area','vocabulary');fixture.componentRef.setInput('mode',mode);fixture.detectChanges();
    const page:HTMLElement=fixture.nativeElement;
    const selector=page.querySelector<HTMLSelectElement>('#session-book')!;
    expect(selector.value).toBe('');
    selector.value='MAT';selector.dispatchEvent(new Event('change'));fixture.detectChanges();
    expect(fixture.componentInstance.filter()).toBe('book');
    expect(page.querySelector('#session-book')?.textContent).toContain('Mateus · faltam 1 de 2');
    learned.set(new Set(['w1','w2']));fixture.detectChanges();
    expect(page.querySelector('.book-vocabulary-progress')?.textContent).toContain('faltam 0 vocábulos');
    fixture.componentInstance.bookOrder.set('appearance');fixture.componentInstance.wordState.set('unlearned');fixture.componentInstance.start();
    expect(start).toHaveBeenCalledWith(expect.objectContaining({mode,bookId:'MAT',bookOrder:'appearance',wordState:'unlearned',filter:'all'}));
    selector.value='';selector.dispatchEvent(new Event('change'));fixture.detectChanges();
    fixture.componentInstance.start();
    expect(start).toHaveBeenLastCalledWith(expect.not.objectContaining({bookId:expect.anything()}));
    expect(page.querySelector('#session-book-order')).toBeNull();
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
    expect(Array.from(size.options, option => Number(option.value))).toEqual(mode === 'flashcards' ? [5, 10, 20, 30, 40, 0] : [5, 10, 20]);
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
    expect(page.querySelector('.study-selection-note')?.textContent).toContain('embaralhados');
  });
});
