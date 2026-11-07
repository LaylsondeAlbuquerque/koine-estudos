import {afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {mountHomeMotion, unmountHomeMotion} from '../../../appearance.js';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Area, AREAS, AREA_KEYS, LEVELS} from '../models';
import {IconComponent} from '../shared/icon.component';
import {ProgressBarComponent} from '../shared/progress-bar.component';
import {ArtworkComponent} from '../shared/artwork.component';

@Component({
  selector: 'koine-home',
  standalone: true,
  imports: [RouterLink, IconComponent, ProgressBarComponent, ArtworkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:contents}'],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);
  readonly areas = AREAS;
  readonly areaKeys = AREA_KEYS;
  readonly levels = LEVELS;
  readonly descriptions: Record<Area, string> = {
    morphology: 'Alfabeto, declinações, pronomes e sistema verbal. Aprenda a reconhecer e analisar as formas.',
    syntax: 'Casos, funções e construções. Entenda as relações da oração e compare abordagens.',
    vocabulary: 'Estude os lemas por frequência, pratique as traduções e organize suas revisões.',
    semantics: 'Investigue palavras e expressões no contexto. Aprenda a justificar interpretações e traduções do Novo Testamento.'
  };
  readonly number = new Intl.NumberFormat('pt-BR');
  readonly percent = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 1});
  readonly completed = computed(() => this.content.lessons.filter(lesson => this.progress.state().lessons[lesson.id]).length);
  readonly first = computed(() => this.content.lessons.find(lesson => lesson.area === 'morphology' && !this.progress.state().lessons[lesson.id]) || this.content.lessonsFor('morphology')[0]);
  readonly exerciseCount = computed(() => this.content.lessons.reduce((count, lesson) => count + lesson.questions.length, 0));
  readonly picks = computed(() => [this.content.articlesFor('morphology', 0)[0], this.content.articlesFor('syntax', 0)[0], this.content.articlesFor('vocabulary', 0)[1], this.content.articlesFor('semantics', 0)[0]].filter(Boolean));

  constructor() {
    afterNextRender(() => mountHomeMotion());
    inject(DestroyRef).onDestroy(() => unmountHomeMotion());
  }
  total(area: Area): number { return area === 'vocabulary' ? this.content.vocabulary.entries.length : this.content.lessonsFor(area).length; }
  count(area: Area): number { return area === 'vocabulary' ? this.progress.masteredCount() : this.progress.completed(area); }
  percentage(area: Area): number { return this.total(area) ? Math.round(this.count(area) / this.total(area) * 100) : 0; }
  explore(): void {
    document.getElementById('formacoes')?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
  }
}
