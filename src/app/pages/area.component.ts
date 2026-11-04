import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Area, AREAS, AREA_KEYS, LEVELS, LEVEL_DESCRIPTIONS} from '../models';
import {IconComponent} from '../shared/icon.component';
import {StudyLandingComponent} from '../study/study-landing.component';
import {StudySessionService} from '../study/study-session.service';
import {WordRepertoryComponent} from '../words/word-repertory.component';

@Component({
  selector: 'koine-area',
  standalone: true,
  imports: [RouterLink, IconComponent, StudyLandingComponent, WordRepertoryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:contents}'],
  templateUrl: './area.component.html'
})
export class AreaComponent {
  readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);
  readonly study = inject(StudySessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {initialValue: this.route.snapshot.paramMap});
  readonly areas = AREAS;
  readonly levels = LEVELS;
  readonly levelDescriptions = LEVEL_DESCRIPTIONS;
  readonly number = new Intl.NumberFormat('pt-BR');
  readonly area = computed<Area>(() => {
    const area = this.params().get('area') as Area;
    return AREA_KEYS.includes(area) ? area : 'morphology';
  });
  readonly tab = computed(() => {
    const tab = this.params().get('tab') || 'path';
    return ['path', 'articles', 'flashcards', 'practice', 'words'].includes(tab) ? tab : 'path';
  });
  readonly mode = computed<'practice' | 'flashcards'>(() => this.tab() === 'flashcards' ? 'flashcards' : 'practice');
  readonly level = computed(() => this.progress.level(this.area()));
  readonly allLessons = computed(() => this.content.lessonsFor(this.area()));
  readonly current = computed(() => this.content.lessonsFor(this.area(), this.level()));
  readonly deeper = computed(() => this.content.articlesFor(this.area(), this.level()));
  readonly questionCount = computed(() => this.allLessons().reduce((count, lesson) => count + lesson.questions.length, 0));
  readonly tabs = computed(() => [
    {key: 'path', title: 'Percurso', icon: 'path'}, {key: 'articles', title: 'Artigos', icon: 'book'},
    {key: 'flashcards', title: 'Flashcards', icon: 'cards'}, {key: 'practice', title: 'Prática', icon: 'practice'},
    ...(this.area() === 'vocabulary' ? [{key: 'words', title: 'Repertório', icon: 'vocabulary'}] : [])
  ]);
  articleFor(lessonId: string) { return this.content.catalog.articlesForLesson(lessonId)[0]; }
  lessonTitle(lessonId: string): string { return this.content.catalog.lessonById.get(lessonId)?.title || ''; }
  step(index: number): string { return String(index + 1).padStart(2, '0'); }
}
