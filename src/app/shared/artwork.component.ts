import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {Area} from '../models';

@Component({
  selector: 'koine-artwork',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:contents}'],
  template: `
    <svg viewBox="0 0 360 158" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" [attr.data-area]="area()">
      @switch (area()) {
        @case ('morphology') {
          <path d="M32 113h296M32 45h296" stroke="var(--art-accent)"/>
          <rect x="34" y="55" width="108" height="52" rx="0" stroke="var(--art-accent)" stroke-width="2"/>
          <rect x="165" y="55" width="64" height="52" rx="0" stroke="var(--art-accent)" stroke-width="2"/>
          <rect x="252" y="55" width="64" height="52" rx="0" stroke="var(--art-accent)" stroke-width="2"/>
          <g fill="var(--art-ink)" font-family="DidotGreek,Georgia,serif" letter-spacing="0" text-anchor="middle" font-size="32">
            <text x="88" y="90">λογ</text><text x="197" y="90">ο</text><text x="284" y="90">ς</text>
          </g>
          <g fill="var(--art-muted)" font-family="BeVietnam,Arial,sans-serif" font-size="10" text-anchor="middle">
            <text x="88" y="133">RADICAL</text><text x="197" y="133">VOGAL</text><text x="284" y="133">TERMINAÇÃO</text>
          </g>
          <g stroke="var(--art-accent)"><path d="M148 81h11m-5-5v11M235 81h11m-5-5v11"/></g>
        }
        @case ('syntax') {
          <path d="M48 37h264M48 120h264" stroke="var(--art-accent)"/>
          <g fill="var(--art-ink)" font-family="DidotGreek,Georgia,serif" letter-spacing="0" font-size="29">
            <text x="53" y="78">ὁ μαθητὴς</text><text x="228" y="78">γράφει</text>
          </g>
          <path d="M53 91h139m36 0h81M122 92v13h145V92" stroke="var(--art-accent)" stroke-width="2"/>
          <g fill="var(--art-muted)" font-family="BeVietnam,Arial,sans-serif" font-size="10"><text x="100" y="136">SUJEITO</text><text x="250" y="136">VERBO</text></g>
        }
        @case ('semantics') {
          <path d="M22 36h316M22 123h316" stroke="var(--art-accent)"/>
          <g stroke="var(--art-accent)"><rect x="18" y="50" width="94" height="49"/><rect x="133" y="50" width="94" height="49"/><rect x="248" y="50" width="94" height="49"/><path d="M115 74h14m-5-5 5 5-5 5M230 74h14m-5-5 5 5-5 5"/></g>
          <text x="65" y="83" text-anchor="middle" fill="var(--art-ink)" font-family="DidotGreek,Georgia,serif" letter-spacing="0" font-size="26">λόγος</text>
          <g fill="var(--art-ink)" font-family="BeVietnam,Arial,sans-serif" font-size="12" text-anchor="middle"><text x="180" y="80">contexto</text><text x="295" y="80">sentido</text></g>
          <text x="180" y="144" text-anchor="middle" fill="var(--art-muted)" font-family="BeVietnam,Arial,sans-serif" font-size="10">EVIDÊNCIA · HIPÓTESE · TRADUÇÃO</text>
        }
        @default {
          <rect x="47" y="29" width="266" height="102" rx="0" stroke="var(--art-accent)"/>
          <path d="M47 91h266" stroke="var(--art-accent)"/>
          <text x="180" y="73" text-anchor="middle" fill="var(--art-ink)" font-family="DidotGreek,Georgia,serif" letter-spacing="0" font-size="35">λόγος</text>
          <text x="180" y="116" text-anchor="middle" fill="var(--art-muted)" font-family="BeVietnam,Arial,sans-serif" font-size="12">palavra · mensagem · discurso</text>
          <path d="M35 44V17h29m261 99v27h-29" stroke="var(--art-accent)"/>
        }
      }
    </svg>
  `
})
export class ArtworkComponent {
  readonly area = input.required<Area>();
}
