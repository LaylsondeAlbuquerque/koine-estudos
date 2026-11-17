import {ChangeDetectionStrategy, Component, computed, effect, input, output, signal} from '@angular/core';
import {ManualWordState} from '../models';

@Component({
  selector: 'koine-word-learning-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label [attr.data-learning-state]="states[position()]" class="learning-toggle">
      <span class="word-learning-label">{{ labels[position()] }}</span>
      <input type="range" min="0" max="2" step="1" [value]="position()"
        [attr.aria-label]="'Estado de estudo de ' + lemma()" [attr.aria-valuetext]="labels[position()]"
        (input)="preview.set(index($event))" (change)="commit($event)">
    </label>`,
  styleUrl: './word-learning-toggle.component.css'
})
export class WordLearningToggleComponent {
  readonly lemma = input.required<string>();
  readonly state = input.required<ManualWordState>();
  readonly stateChange = output<ManualWordState>();
  readonly states = ['unlearned', 'review', 'learned'] as const;
  readonly labels = ['não estudei', 'revisar', 'já estudei'] as const;
  readonly preview = signal<number|null>(null);
  readonly position = computed(() => this.preview() ?? this.states.indexOf(this.state()));
  constructor() { effect(() => { this.state(); this.preview.set(null); }); }
  index(event: Event): number { return Number((event.target as HTMLInputElement).value); }
  commit(event: Event): void {
    const index = this.index(event);
    if (Number.isInteger(index) && index >= 0 && index <= 2) this.stateChange.emit(this.states[index]);
    this.preview.set(null);
  }
}
