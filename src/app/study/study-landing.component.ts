import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Area, LEVELS} from '../models';
import {IconComponent} from '../shared/icon.component';
import {StudyMode, StudySessionService} from './study-session.service';

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
  readonly levels = LEVELS;
  readonly size = signal(10);
  readonly filter = signal('level');
  readonly lessonId = signal('');
  readonly flash = computed(() => this.mode() === 'flashcards');
  readonly vocabulary = computed(() => this.area() === 'vocabulary');
  readonly lessons = computed(() => this.content.lessonsFor(this.area(), this.progress.level(this.area())));
  readonly count = computed(() => this.vocabulary()
    ? this.content.catalog.wordsForLevel(this.progress.level(this.area())).length
    : this.lessons().reduce((sum, lesson) => sum + lesson.questions.filter(question => !this.flash() || ['choice', 'parse'].includes(question.kind)).length, 0));
  readonly title = computed(() => this.flash() ? 'Flashcards' : this.vocabulary() ? 'Prática de vocabulário' : this.area() === 'morphology' ? 'Prática de morfologia' : 'Prática de sintaxe');
  readonly description = computed(() => this.flash()
    ? 'Um conceito por cartão. Selecione a resposta para revelar o verso com a explicação; depois avance no seu ritmo.'
    : this.vocabulary() ? 'Associe palavras a seus sentidos e reconheça o vocábulo grego a partir do português. Cada desafio recebe uma explicação.'
    : this.area() === 'morphology' ? 'Identifique as características gramaticais das palavras, como caso, gênero e número. Selecione as respostas para fazer a análise morfológica.'
    : 'Identifique funções, relacione conceitos e organize traduções didáticas. O contexto e a explicação acompanham cada resposta.');
  readonly tips = computed(() => [
    {title: this.flash() ? 'Pense antes de selecionar' : 'Observe antes de responder', text: this.flash() ? 'Tente recordar o sentido ou a análise antes de olhar as alternativas.' : 'Leia o trecho inteiro. A mesma forma pode ter possibilidades diferentes.'},
    {title: 'Use a explicação', text: 'Um erro é uma pista: volte ao padrão ou conceito que ainda precisa de atenção.'},
    {title: this.vocabulary() ? 'Volte em dias diferentes' : 'Conecte teoria e prática', text: this.vocabulary() ? 'A memorização é registrada após acertos em três dias diferentes. Erros devolvem o vocábulo à revisão.' : 'Reveja a aula quando precisar. O percurso permanece aberto para você retornar.'}
  ]);
  value(event: Event): string { return (event.target as HTMLSelectElement).value; }
  start(): void {
    // An input may remain mounted while the selected level changes. Ignore a
    // previous level's lesson instead of leaking that filter into this session.
    const selected = this.lessons().some(lesson => lesson.id === this.lessonId()) ? this.lessonId() : undefined;
    this.study.start({area: this.area(), mode: this.mode(), limit: this.size(), filter: this.filter(), lessonId: this.vocabulary() ? undefined : selected});
  }
}
