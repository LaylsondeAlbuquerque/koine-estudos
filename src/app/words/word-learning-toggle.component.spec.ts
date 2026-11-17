import {TestBed} from '@angular/core/testing';
import {describe, expect, it} from 'vitest';
import {WordLearningToggleComponent} from './word-learning-toggle.component';

describe('WordLearningToggleComponent', () => {
  it('previews a drag without saving intermediate states, then commits on release', () => {
    const fixture = TestBed.createComponent(WordLearningToggleComponent);
    fixture.componentRef.setInput('lemma', 'λόγος');
    fixture.componentRef.setInput('state', 'unlearned');
    fixture.detectChanges();
    const values: string[] = [];
    fixture.componentInstance.stateChange.subscribe(value => values.push(value));
    const slider = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    slider.value = '1'; slider.dispatchEvent(new Event('input')); fixture.detectChanges();
    expect(slider.getAttribute('aria-valuetext')).toBe('Revisar');
    expect(values).toEqual([]);
    slider.value = '2'; slider.dispatchEvent(new Event('input')); fixture.detectChanges();
    expect(slider.getAttribute('aria-valuetext')).toBe('Já estudei');
    slider.dispatchEvent(new Event('change'));
    expect(values).toEqual(['learned']);
    fixture.componentRef.setInput('state', 'learned'); fixture.detectChanges();
    expect(slider.value).toBe('2');
    slider.value = '0'; slider.dispatchEvent(new Event('change'));
    expect(values).toEqual(['learned', 'unlearned']);
  });
});
