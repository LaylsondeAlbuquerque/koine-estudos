import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {AREAS, AREA_KEYS} from '../models';
import {IconComponent} from '../shared/icon.component';
import {ProgressBarComponent} from '../shared/progress-bar.component';

@Component({
  selector: 'koine-progress-page',
  standalone: true,
  imports: [IconComponent, ProgressBarComponent],
  templateUrl: './progress.component.html',
  styles: ':host {display: contents}',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressComponent {
  readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);
  readonly areas = AREAS;
  readonly areaKeys = AREA_KEYS;
  readonly completedLessons = computed(() => this.content.lessons.filter(lesson => this.progress.state().lessons[lesson.id]).length);
  readonly readArticles = computed(() => this.content.articles.filter(article => this.progress.state().articles[article.id]).length);
  private readonly percentFormat = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 1});
  percent(value: number): string { return this.percentFormat.format(value); }

  async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try { await this.progress.importProgress(file); }
    catch (error) { this.progress.toast(error instanceof Error ? error.message : 'Não foi possível importar o arquivo.'); }
    finally { input.value = ''; }
  }
}
