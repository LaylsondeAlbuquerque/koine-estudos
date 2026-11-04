import {ChangeDetectionStrategy, Component, computed, effect, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Area, AREAS, AREA_KEYS, LEVELS, Lesson, Article} from '../models';
import {IconComponent} from '../shared/icon.component';
import {ReadingBodyComponent, ReadingReferencesComponent} from '../shared/reading-body.component';
import {StudySessionService} from '../study/study-session.service';

@Component({
  selector: 'koine-reading',
  standalone: true,
  imports: [RouterLink, IconComponent, ReadingBodyComponent, ReadingReferencesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:contents}'],
  templateUrl: './reading.component.html'
})
export class ReadingComponent {
  readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);
  readonly study = inject(StudySessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {initialValue: this.route.snapshot.paramMap});
  private readonly data = toSignal(this.route.data, {initialValue: this.route.snapshot.data});
  readonly areas = AREAS;
  readonly levels = LEVELS;
  readonly view = computed(() => {
    const rawArea = this.params().get('area') as Area;
    const area: Area = AREA_KEYS.includes(rawArea) ? rawArea : 'morphology';
    const id = this.params().get('id') || '';
    const requestedArticle = this.data()['kind'] === 'article';
    const foundArticle = this.content.catalog.articleById.get(id) as Article | undefined;
    const article = requestedArticle && foundArticle?.area === area ? foundArticle : undefined;
    const foundLesson = this.content.catalog.lessonById.get(article?.lessonId || id) as Lesson | undefined;
    const lesson = foundLesson?.area === area ? foundLesson : undefined;
    // Old /article/<lesson-id> bookmarks continue opening their original lesson.
    const reading = article || lesson;
    const collection = article ? this.content.articlesFor(area, article.level) : this.content.lessonsFor(area);
    const index = reading ? collection.findIndex(item => item.id === reading.id) : -1;
    return {area, requestedArticle, article, lesson, reading, next: index >= 0 ? collection[index + 1] : undefined, related: lesson ? this.content.catalog.articlesForLesson(lesson.id) as Article[] : []};
  });

  constructor() {
    effect(() => {
      const view = this.view();
      if (view.reading && this.progress.level(view.area) !== view.reading.level) this.progress.setLevel(view.area, view.reading.level);
    });
  }
}
