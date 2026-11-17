import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createCatalog} from '../../../catalog.js';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Word} from '../models';
import {StudySessionService} from '../study/study-session.service';
import {WordRepertoryComponent, RepertoryViewState} from './word-repertory.component';
import {BookVocabularyService} from '../book-vocabulary.service';

describe('WordRepertoryComponent', () => {
  let content: ContentService;
  let progress: ProgressService;
  let books:BookVocabularyService;
  const start = vi.fn();
  const words: Word[] = Array.from({length: 60}, (_, index) => ({
    id: `word-${index}`, lemma: index === 0 ? 'λόγος' : `λέμμα${index}`,
    meaning: index === 0 ? 'palavra; mensagem' : `sentido ${index}`,
    pos: index % 2 ? 'verbo' : 'substantivo', rank: index + 1,
    frequency: 100 - index, level: 0, core300: index < 20
  }));

  beforeEach(() => {
    localStorage.clear();
    start.mockReset();
    TestBed.configureTestingModule({
      imports: [WordRepertoryComponent],
      providers: [ContentService, ProgressService, {provide: StudySessionService, useValue: {start}}]
    });
    content = TestBed.inject(ContentService);
    content.vocabulary = {meta: {core300: {coveragePercent: 79.4}}, entries: words};
    content.catalog = createCatalog([], [], words);
    content.ready.set(true);
    progress = TestBed.inject(ProgressService);
    books=TestBed.inject(BookVocabularyService);
    vi.spyOn(books,'load').mockResolvedValue();
  });

  afterEach(() => { vi.restoreAllMocks(); TestBed.resetTestingModule(); });

  const change = (value: string) => ({target: {value}} as unknown as Event);

  const setBooks=()=>books.books.set([
    {id:'MAT',name:'Mateus',words:[{id:'word-5',frequency:8,first:3},{id:'word-0',frequency:2,first:1},{id:'word-2',frequency:1,first:2}]},
    {id:'JHN',name:'João',words:[{id:'word-0',frequency:9,first:1},{id:'word-3',frequency:1,first:2}]}
  ]);

  it('persists book and ordering across a fresh view state, including all books',()=>{
    const fixture=TestBed.createComponent(WordRepertoryComponent);
    fixture.componentInstance.changeBook(change('JHN'));
    fixture.componentInstance.changeBookOrder(change('appearance'));
    const restored=new RepertoryViewState();
    expect(restored.bookId()).toBe('JHN');expect(restored.bookOrder()).toBe('appearance');
    fixture.componentInstance.changeBook(change(''));
    expect(new RepertoryViewState().bookId()).toBe('');
  });

  it('selects the saved book after its options load asynchronously',()=>{
    const saved=new RepertoryViewState();saved.bookId.set('JHN');saved.saveBookSelection();
    const fixture=TestBed.createComponent(WordRepertoryComponent);fixture.detectChanges();
    expect(fixture.componentInstance.bookId()).toBe('JHN');
    expect(fixture.nativeElement.querySelector('#vocab-book').options.length).toBe(1);
    setBooks();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#vocab-book').value).toBe('JHN');
    expect(fixture.componentInstance.filtered().map(w=>w.id)).toEqual(['word-0','word-3']);
  });

  it('filters by book and its own frequency or first appearance, preserves selection and restores the whole repertoire',()=>{
    setBooks();let fixture=TestBed.createComponent(WordRepertoryComponent);fixture.detectChanges();
    let component=fixture.componentInstance;component.page.set(1);
    const selector=fixture.nativeElement.querySelector('#vocab-book') as HTMLSelectElement;
    selector.value='MAT';selector.dispatchEvent(new Event('change'));fixture.detectChanges();
    expect(component.page()).toBe(0);
    expect(component.filtered().map(w=>w.id)).toEqual(['word-5','word-0','word-2']);
    expect(fixture.nativeElement.querySelector('.word-bottom')?.textContent).toContain('8 neste livro');
    const order=fixture.nativeElement.querySelector('#vocab-book-order') as HTMLSelectElement;
    order.value='appearance';order.dispatchEvent(new Event('change'));fixture.detectChanges();
    expect(component.filtered().map(w=>w.id)).toEqual(['word-0','word-2','word-5']);
    fixture.destroy();fixture=TestBed.createComponent(WordRepertoryComponent);component=fixture.componentInstance;
    expect(component.bookId()).toBe('MAT');expect(component.bookOrder()).toBe('appearance');
    component.changeBook(change(''));
    expect(component.filtered()).toHaveLength(60);
  });

  it('combines book, search, class and learning state and shares learned counts across books',()=>{
    setBooks();const fixture=TestBed.createComponent(WordRepertoryComponent),component=fixture.componentInstance;
    component.changeBook(change('MAT'));progress.setWordState('word-0','learned');
    component.changeFilter(change('unlearned'));component.changeClass(change('verbo'));component.changeQuery(change('sentido'));
    fixture.detectChanges();
    expect(component.filtered().map(w=>w.id)).toEqual(['word-5']);
    expect(component.selectedBook()?.remaining).toBe(2);
    expect(fixture.nativeElement.querySelector('#vocab-book').textContent).toContain('João · faltam 1 de 2');
    component.markWord(words[5],'review');component.changeFilter(change('marked'));
    expect(component.filtered().map(w=>w.id)).toEqual(['word-5']);
    component.markWord(words[5],'learned');fixture.detectChanges();
    expect(component.filtered()).toEqual([]);expect(component.selectedBook()?.remaining).toBe(1);
    component.changeQuery(change('λογος'));component.changeClass(change('all'));component.changeFilter(change('mastered'));
    expect(component.filtered().map(w=>w.id)).toEqual(['word-0']);
  });

  it('shows loading and retry states without replacing a selected book with the whole NT',()=>{
    const fixture=TestBed.createComponent(WordRepertoryComponent),component=fixture.componentInstance;
    component.changeBook(change('MAT'));books.loading.set(true);fixture.detectChanges();
    expect(component.filtered()).toEqual([]);
    expect(fixture.nativeElement.querySelector('[role=status]')?.textContent).toContain('Carregando');
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeNull();
    books.loading.set(false);books.error.set('Falha de conexão');fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')?.textContent).toContain('Falha de conexão');
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeNull();
    fixture.nativeElement.querySelector('[role=alert] button').click();
    expect(books.load).toHaveBeenCalledTimes(2);
  });

  it('combines accent-insensitive text, class and review filters and resets pagination', () => {
    const fixture = TestBed.createComponent(WordRepertoryComponent), component = fixture.componentInstance;
    component.page.set(1);
    component.changeQuery(change('λογος'));
    expect(component.currentPage()).toBe(0);
    expect(component.filtered().map(word => word.id)).toEqual(['word-0']);
    component.changeClass(change('verbo'));
    expect(component.filtered()).toEqual([]);
    component.changeClass(change('substantivo'));
    component.changeFilter(change('new'));
    expect(component.filtered().map(word => word.id)).toEqual(['word-0']);
    progress.mutate(state => state.vocab['word-0'] = {
      attempts: 3, correct: 3, dates: ['2000-01-01', '2000-01-02', '2000-01-03'],
      box: 3, nextReview: '2000-01-10', mastered: true
    });
    expect(component.filtered()).toEqual([]);
    component.changeFilter(change('mastered'));
    expect(component.filtered().map(word => word.id)).toEqual(['word-0']);
    expect(component.successfulDays(words[0])).toBe(3);
    component.changeFilter(change('due'));
    expect(component.filtered().map(word => word.id)).toEqual(['word-0']);
  });

  it('renders 48 cards per page and keeps query, class and page across component recreation', () => {
    let fixture = TestBed.createComponent(WordRepertoryComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.querySelectorAll('.word-card')).toHaveLength(48);
    const toolbar = fixture.nativeElement.querySelector('.vocab-toolbar') as HTMLElement;
    toolbar.scrollIntoView = vi.fn();
    component.changePage(1);
    fixture.detectChanges();
    expect(component.visibleWords()).toHaveLength(12);
    expect(component.visibleWords()[0].id).toBe('word-48');
    component.query.set('sentido');
    component.wordClass.set('all');
    fixture.destroy();
    fixture = TestBed.createComponent(WordRepertoryComponent);
    expect(fixture.componentInstance.query()).toBe('sentido');
    expect(fixture.componentInstance.wordClass()).toBe('all');
    expect(fixture.componentInstance.currentPage()).toBe(1);
    expect(fixture.componentInstance.visibleWords()).toHaveLength(11);
  });

  it('opens the selected word and the core deck with explicit vocabulary session options', () => {
    const component = TestBed.createComponent(WordRepertoryComponent).componentInstance;
    component.studyWord(words[0]);
    expect(start).toHaveBeenLastCalledWith({area: 'vocabulary', mode: 'flashcards', wordId: 'word-0'});
    component.studyCore();
    expect(start).toHaveBeenLastCalledWith({area: 'vocabulary', mode: 'flashcards', filter: 'core', limit: 10});
  });

  it('clamps a stale page when a changed review removes the final matching word', () => {
    const component = TestBed.createComponent(WordRepertoryComponent).componentInstance;
    component.filter.set('new');
    component.page.set(1);
    progress.mutate(state => {
      for (const word of words.slice(48)) state.vocab[word.id] = {
        attempts: 1, correct: 1, dates: ['2000-01-01'], box: 1,
        nextReview: '2000-01-02', mastered: false
      };
    });
    expect(component.pages()).toBe(1);
    expect(component.currentPage()).toBe(0);
    expect(component.visibleWords()).toHaveLength(48);
  });

  it('marks words from separate controls without opening a card or fabricating successful days', () => {
    const fixture = TestBed.createComponent(WordRepertoryComponent), component = fixture.componentInstance;
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const word = () => root.querySelector('[data-word-id="word-0"]') as HTMLElement;
    expect(word().querySelector('button button')).toBeNull();
    const choose = (value: number) => { const input = word().querySelector('input[type=range]') as HTMLInputElement; input.value = String(value); input.dispatchEvent(new Event('change')); };
    choose(2);
    fixture.detectChanges();
    expect(start).not.toHaveBeenCalled();
    expect(progress.wordLearned('word-0')).toBe(true);
    expect(word().querySelector('.word-learning-label')!.textContent).toContain('Já estudei');
    expect((word().querySelector('input[type=range]') as HTMLInputElement).value).toBe('2');
    expect(word().querySelectorAll('.word-state .filled')).toHaveLength(0);
    expect(progress.state().vocab['word-0'].attempts).toBe(0);
    expect(JSON.parse(localStorage.getItem(progress.storageKey)!).vocab['word-0'].manualState).toBe('learned');
    expect(root.querySelector('.core-count')!.textContent).toContain('1');

    component.changeFilter(change('mastered'));
    fixture.detectChanges();
    expect(component.filtered().map(word => word.id)).toEqual(['word-0']);
    choose(1);
    fixture.detectChanges();
    expect(progress.wordLearned('word-0')).toBe(false);
    expect(root.querySelectorAll('.word-entry')).toHaveLength(0);
    expect(root.querySelector('.empty-state')!.textContent).toContain('Nenhum vocábulo');
    component.changeFilter(change('marked'));
    fixture.detectChanges();
    expect(component.filtered().map(word => word.id)).toEqual(['word-0']);
    expect((word().querySelector('input[type=range]') as HTMLInputElement).value).toBe('1');
    expect(word().querySelector('.word-learning-label')!.textContent).toContain('Revisar');
    choose(0);
    fixture.detectChanges();
    expect(progress.wordState('word-0')).toBe('unlearned');
    expect(component.filtered()).toEqual([]);
    expect(start).not.toHaveBeenCalled();
  });

  it('selects learned and unlearned groups through the repertoire filter, including manual and automatic knowledge', () => {
    const fixture = TestBed.createComponent(WordRepertoryComponent);
    progress.setWordState('word-0', 'review');
    progress.setWordState('word-1', 'learned');
    progress.mutate(state => state.vocab['word-2'] = {
      attempts: 3, correct: 3, dates: ['2000-01-01', '2000-01-02', '2000-01-03'],
      box: 3, nextReview: '2000-01-10', mastered: true
    });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const filter = root.querySelector('#vocab-filter') as HTMLSelectElement;
    const select = (value: string) => {filter.value = value; filter.dispatchEvent(new Event('change')); fixture.detectChanges();};
    const ids = () => fixture.componentInstance.filtered().map(word => word.id);
    select('mastered');
    expect(ids()).toEqual(['word-1', 'word-2']);
    select('unlearned');
    expect(ids()).toContain('word-0');
    expect(ids()).toContain('word-3');
    expect(ids()).not.toContain('word-1');
    expect(ids()).not.toContain('word-2');
    select('marked');
    expect(ids()).toEqual(['word-0']);
    select('all');
    expect(ids()).toHaveLength(words.length);
    expect(Array.from(filter.options).map(option => option.value)).toEqual(expect.arrayContaining(['all', 'marked', 'mastered', 'unlearned']));
  });
});
