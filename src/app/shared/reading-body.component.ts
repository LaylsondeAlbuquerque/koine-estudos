import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {Section} from '../models';
type Reference = string | {title: string; url?: string};

@Component({
  selector: 'koine-reading-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:contents}'],
  templateUrl: './reading-body.component.html'
})
export class ReadingBodyComponent {
  readonly sections = input.required<Section[]>();
  readonly analysisHeading = input('Leitura sintática');
  paragraphs(body: string): string[] { return body.split(/\n\s*\n/).filter(Boolean); }
  greek(cell: string): boolean { return /[\u0370-\u03ff\u1f00-\u1fff]/.test(cell) && !/[a-zA-ZÀ-ÿ]/.test(cell); }
}

@Component({
  selector: 'koine-reading-references',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:contents}'],
  template: `
    <div class="references">
      <h3>Referências e abordagem</h3>
      <ul>
        @for (reference of normalized(); track $index) {
          <li>
            @if (reference.url) {
              <a [href]="reference.url" target="_blank" rel="noopener">{{ reference.title }}</a>
            } @else { {{ reference.title }} }
          </li>
        }
      </ul>
      <p>Redação didática própria; as referências identificam fontes e perspectivas.</p>
    </div>
  `
})
export class ReadingReferencesComponent {
  readonly references = input.required<Reference[]>();
  readonly normalized = computed(() => this.references().map(reference => {
    if (typeof reference === 'string') return {title: reference, url: undefined};
    return {title: reference.title, url: reference.url && /^https?:\/\//.test(reference.url) ? reference.url : undefined};
  }));
}
