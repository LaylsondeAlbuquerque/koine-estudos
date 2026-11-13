import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Area, LEVELS} from '../models';
import {IconComponent} from '../shared/icon.component';
import {StudyMode, StudySessionService} from './study-session.service';
import {BookVocabularyService,BookWordOrder} from '../book-vocabulary.service';

@Component({
  selector: 'koine-study-landing',
  imports: [IconComponent],
  templateUrl: './study-landing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {style: 'display: contents'}
})
export class StudyLandingComponent {
  readonly area = input.required<Area>();
  readonly mode = input.required<StudyMode>();
  readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);
  private readonly study = inject(StudySessionService);
  readonly bookVocabulary = inject(BookVocabularyService);
  readonly levels = LEVELS;
  readonly frequencyGroups = [10, 50, 100, 200, 300];
  readonly size = signal(10);
  readonly filter = signal('all');
  readonly topAmount = signal(300);
  readonly bookId = signal('MAT');
  readonly bookOrder = signal<BookWordOrder>('frequency');
  readonly bookStats = computed(() => this.bookVocabulary.books().map(book=>{
    const learned=book.words.filter(word=>this.progress.wordLearned(word.id)).length;
    return {...book,total:book.words.length,learned,remaining:book.words.length-learned};
  }));
  readonly selectedBook = computed(()=>this.bookStats().find(book=>book.id===this.bookId()));
  readonly wordState = signal('all');
  readonly lessonId = signal('');
  readonly flash = computed(() => this.mode() === 'flashcards');
  readonly vocabulary = computed(() => this.area() === 'vocabulary');
  readonly lessons = computed(() => this.content.lessonsFor(this.area(), this.progress.level(this.area())));
  readonly count = computed(() => this.vocabulary()
    ? this.content.catalog.wordsForLevel(this.progress.level(this.area())).length
    : this.lessons().reduce((sum, lesson) => sum + lesson.questions.filter(question => !this.flash() || ['choice', 'parse'].includes(question.kind)).length, 0));
  readonly title = computed(() => this.flash() ? 'Flashcards' : this.vocabulary() ? 'Prática de vocabulário' : this.area() === 'morphology' ? 'Prática de morfologia' : this.area() === 'semantics' ? 'Prática de semântica' : 'Prática de sintaxe');
  readonly description = computed(() => this.flash()
    ? 'Um conceito por cartão. Selecione a resposta para revelar o verso com a explicação; depois avance no seu ritmo.'
    : this.vocabulary() ? 'Associe palavras a seus sentidos e reconheça o vocábulo grego a partir do português. Cada desafio recebe uma explicação.'
    : this.area() === 'morphology' ? 'Identifique as características gramaticais das palavras, como caso, gênero e número. Selecione as respostas para fazer a análise morfológica.'
    : this.area() === 'semantics' ? 'Compare hipóteses com os dados da passagem, relacione conceitos e avalie argumentos exegéticos. Cada resposta mostra qual evidência sustenta a análise.'
    : 'Identifique funções, relacione conceitos e organize traduções didáticas. O contexto e a explicação acompanham cada resposta.');
  readonly tips = computed(() => [
    {title: this.flash() ? 'Pense antes de selecionar' : 'Observe antes de responder', text: this.flash() ? 'Tente recordar o sentido ou a análise antes de olhar as alternativas.' : this.area() === 'semantics' ? 'Distinga o que o texto informa, o que a construção favorece e o que seria apenas uma suposição.' : 'Leia o trecho inteiro. A mesma forma pode ter possibilidades diferentes.'},
    {title: 'Use a explicação', text: 'Um erro é uma pista: volte ao padrão ou conceito que ainda precisa de atenção.'},
    {title: this.vocabulary() ? 'Acompanhe sua aprendizagem' : 'Conecte teoria e prática', text: this.vocabulary() ? 'Acertos em três dias diferentes registram a aprendizagem automaticamente. Você também pode marcar a palavra como já aprendida ou para revisar.' : 'Reveja a aula quando precisar. O percurso permanece aberto para você retornar.'}
  ]);
  constructor(){effect(()=>{if(this.vocabulary())void this.bookVocabulary.load();});}
  value(event: Event): string { return (event.target as HTMLSelectElement).value; }
  selectBook(event:Event):void{
    const id=this.value(event);
    if(id)this.bookId.set(id);
    this.filter.set(id?'book':'all');
  }
  start(): void {
    // An input may remain mounted while the selected level changes. Ignore a
    // previous level's lesson instead of leaking that filter into this session.
    const selected = this.lessons().some(lesson => lesson.id === this.lessonId()) ? this.lessonId() : undefined;
    this.study.start({area: this.area(), mode: this.mode(), limit: this.size(), filter: this.filter()==='frequent'?`top-${this.topAmount()}`:this.filter()==='book'?'all':this.filter(), ...(this.vocabulary() ? {wordState: this.wordState(), ...(this.filter()==='book'?{bookId:this.bookId(),bookOrder:this.bookOrder()}: {})} : {}), lessonId: this.vocabulary() ? undefined : selected});
  }
}
