import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ContentService} from '../content.service';

@Component({
  selector: 'koine-about',
  standalone: true,
  templateUrl: './about.component.html',
  styles: ':host {display: contents}',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {
  readonly content = inject(ContentService);
  private readonly numberFormat = new Intl.NumberFormat('pt-BR');
  format(value: number): string { return this.numberFormat.format(value); }
  methodology(): string {
    const meta = this.content.vocabulary.meta;
    return meta.bibliographicAudit?.publicNote || meta.methodology || 'Formas variantes e diferenças de lematização entre fontes são registradas nos metadados do repertório. O critério de frequência é independente da organização editorial do livro.';
  }
}
