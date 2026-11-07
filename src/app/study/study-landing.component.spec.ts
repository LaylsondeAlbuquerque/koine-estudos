import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {StudyLandingComponent} from './study-landing.component';
import {StudySessionService} from './study-session.service';

describe('Seleção dos conjuntos de vocabulário', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('separates the frequency group from the number of cards and retains it after changing level', () => {
    const level = signal(0), start = vi.fn();
    TestBed.configureTestingModule({providers: [
      {provide: ContentService, useValue: {lessonsFor: () => [], catalog: {wordsForLevel: () => []}}},
      {provide: ProgressService, useValue: {level: () => level()}},
      {provide: StudySessionService, useValue: {start}}
    ]});
    const fixture = TestBed.createComponent(StudyLandingComponent);
    fixture.componentRef.setInput('area', 'vocabulary');
    fixture.componentRef.setInput('mode', 'flashcards');
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const filter = page.querySelector<HTMLSelectElement>('#session-filter')!;
    for (const amount of [10, 50, 100, 200, 300]) {
      expect(filter.querySelector(`option[value="top-${amount}"]`)?.textContent).toContain(`${amount} mais frequentes`);
    }
    filter.value = 'top-100';
    filter.dispatchEvent(new Event('change'));
    const size = page.querySelector<HTMLSelectElement>('#session-size')!;
    size.value = '5';
    size.dispatchEvent(new Event('change'));
    level.set(3); fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('button')!.click();
    expect(start).toHaveBeenCalledWith({area: 'vocabulary', mode: 'flashcards', limit: 5, filter: 'top-100', lessonId: undefined});
    expect(page.querySelector('.study-selection-note')?.textContent).toContain('quantos cartões');
    expect(filter.value).toBe('top-100');
  });

  it('keeps frequency groups exclusive to vocabulary and preserves subject selection elsewhere', () => {
    TestBed.configureTestingModule({providers: [
      {provide: ContentService, useValue: {lessonsFor: () => []}},
      {provide: ProgressService, useValue: {level: () => 0}},
      {provide: StudySessionService, useValue: {start: vi.fn()}}
    ]});
    const fixture = TestBed.createComponent(StudyLandingComponent);
    fixture.componentRef.setInput('area', 'morphology');
    fixture.componentRef.setInput('mode', 'flashcards'); fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('#session-filter')).toBeNull();
    expect(page.querySelector('#session-lesson')).not.toBeNull();
    expect(page.querySelector('.study-selection-note')).toBeNull();
  });
});
