import {ChangeDetectionStrategy, Component, Injectable, computed, inject, input, signal} from '@angular/core';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Area, Word} from '../models';
import {IconComponent} from '../shared/icon.component';
import {StudySessionService} from '../study/study-session.service';

// Keep the repertoire's position while a card or a different tab is opened.
@Injectable({providedIn: 'root'})
class RepertoryViewState {
  readonly query = signal('');
  readonly filter = signal('all');
  readonly wordClass = signal('all');
  readonly page = signal(0);
}

@Component({
  selector: 'koine-word-repertory',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './word-repertory.component.html',
  styles: ':host {display: contents}',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WordRepertoryComponent {
  readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);
  readonly study = inject(StudySessionService);
  readonly area = input<Area>('vocabulary');
  private readonly view = inject(RepertoryViewState);
  readonly query = this.view.query;
  readonly filter = this.view.filter;
  readonly wordClass = this.view.wordClass;
  readonly page = this.view.page;
  readonly filters = [
    ['all', 'Todos os vocábulos'], ['marked', 'Marcadas para revisar'],
    ['mastered', 'Já aprendidas'], ['unlearned', 'Ainda não aprendidas'],
    ['core', 'Núcleo dos 300'], ['due', 'Revisões de hoje'], ['new', 'Ainda não estudadas']
  ] as const;
  readonly days = [0, 1, 2];
  readonly filtered = computed<Word[]>(() => this.content.catalog.filterWords({
    query: this.query(), pos: this.wordClass(), filter: this.filter(), reviews: this.progress.state().vocab
  }));
  readonly pages = computed(() => Math.ceil(this.filtered().length / 48));
  readonly currentPage = computed(() => Math.min(this.page(), Math.max(0, this.pages() - 1)));
  readonly visibleWords = computed(() => this.filtered().slice(this.currentPage() * 48, (this.currentPage() + 1) * 48));
  private readonly numberFormat = new Intl.NumberFormat('pt-BR');
  private readonly percentFormat = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 1});

  format(value: number): string { return this.numberFormat.format(value); }
  percent(value: number): string { return this.percentFormat.format(value); }
  rank(word: Word): string { return String(word.rank).padStart(3, '0'); }
  successfulDays(word: Word): number { return Math.min(this.progress.state().vocab[word.id]?.dates?.length || 0, 3); }
  learningLabel(word: Word): string {
    if (this.progress.wordState(word.id) === 'review') return 'Marcada para revisar';
    if (this.progress.wordLearned(word.id)) return 'Já aprendida';
    return 'Ainda não aprendida';
  }
  markWord(word: Word, state: 'review' | 'learned'): void {
    this.progress.setWordState(word.id, this.progress.wordState(word.id) === state ? null : state);
  }

  changeQuery(event: Event): void { this.query.set((event.target as HTMLInputElement).value); this.page.set(0); }
  changeFilter(event: Event): void { this.filter.set((event.target as HTMLSelectElement).value); this.page.set(0); }
  changeClass(event: Event): void { this.wordClass.set((event.target as HTMLSelectElement).value); this.page.set(0); }
  changePage(value: number): void {
    this.page.set(Math.max(0, Math.min(value, this.pages() - 1)));
    document.querySelector('.vocab-toolbar')?.scrollIntoView({block: 'start'});
  }
  studyCore(): void { this.study.start({area: 'vocabulary', mode: 'flashcards', filter: 'core', limit: 10}); }
  studyWord(word: Word): void { this.study.start({area: 'vocabulary', mode: 'flashcards', wordId: word.id}); }
}
