import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {Area} from '../models';

@Component({
  selector: 'koine-artwork',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:contents}'],
  template: `
    <svg viewBox="0 0 360 158" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      @switch (area()) {
        @case ('morphology') {
          <path d="M32 113h296M32 45h296" stroke="#235b61"/>
          <rect x="34" y="55" width="108" height="52" rx="3" stroke="#59ddba" stroke-width="2"/>
          <rect x="165" y="55" width="64" height="52" rx="3" stroke="#59ddba" stroke-width="2"/>
          <rect x="252" y="55" width="64" height="52" rx="3" stroke="#59ddba" stroke-width="2"/>
          <g fill="#d5fff1" font-family="DidotGreek,Georgia,serif" letter-spacing="0" text-anchor="middle" font-size="32">
            <text x="88" y="90">λογ</text><text x="197" y="90">ο</text><text x="284" y="90">ς</text>
          </g>
          <g fill="#8ebeb2" font-family="Arial,sans-serif" font-size="10" text-anchor="middle">
            <text x="88" y="133">RADICAL</text><text x="197" y="133">VOGAL</text><text x="284" y="133">TERMINAÇÃO</text>
          </g>
          <g stroke="#59ddba"><path d="M148 81h11m-5-5v11M235 81h11m-5-5v11"/></g>
        }
        @case ('syntax') {
          <path d="M48 37h264M48 120h264" stroke="#244e7e"/>
          <g fill="#dbeaff" font-family="DidotGreek,Georgia,serif" letter-spacing="0" font-size="29">
            <text x="53" y="78">ὁ μαθητὴς</text><text x="228" y="78">γράφει</text>
          </g>
          <path d="M53 91h139m36 0h81M122 92v13h145V92" stroke="#63adff" stroke-width="2"/>
          <g fill="#89b8f2" font-family="Arial,sans-serif" font-size="10"><text x="100" y="136">SUJEITO</text><text x="250" y="136">VERBO</text></g>
        }
        @default {
          <rect x="47" y="29" width="266" height="102" rx="3" stroke="#dfab65"/>
          <path d="M47 91h266" stroke="#715937"/>
          <text x="180" y="73" text-anchor="middle" fill="#fff2dc" font-family="DidotGreek,Georgia,serif" letter-spacing="0" font-size="35">λόγος</text>
          <text x="180" y="116" text-anchor="middle" fill="#e6c292" font-family="Arial,sans-serif" font-size="12">palavra · mensagem · discurso</text>
          <path d="M35 44V17h29m261 99v27h-29" stroke="#c29253"/>
        }
      }
    </svg>
  `
})
export class ArtworkComponent {
  readonly area = input.required<Area>();
}
