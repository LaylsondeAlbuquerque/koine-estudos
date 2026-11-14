import {describe, expect, it, vi, afterEach} from 'vitest';
import {StudySettingsService} from './study-settings.service';

describe('Study preferences storage', () => {
  afterEach(() => {vi.restoreAllMocks(); localStorage.clear();});
  it('validates stored preferences and survives invalid JSON and unavailable storage', () => {
    const service = new StudySettingsService();
    const defaults = service.load('vocabulary', 'flashcards');
    service.save('vocabulary', 'flashcards', {...defaults, size: 20});
    expect(new StudySettingsService().load('vocabulary', 'flashcards').size).toBe(20);
    const key = Object.keys(localStorage).find(key => key.startsWith('koine-study-settings-v1:'))!;
    localStorage.setItem(key, JSON.stringify({size: -5, filter: 'invalid', topAmount: 999, bookId: 12, wordState: 'invalid'}));
    expect(service.load('vocabulary', 'flashcards')).toEqual(defaults);
    localStorage.setItem(key, '{');
    expect(service.load('vocabulary', 'flashcards')).toEqual(defaults);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {throw Error('blocked');});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {throw Error('blocked');});
    expect(service.load('vocabulary', 'flashcards')).toEqual(defaults);
    expect(() => service.save('vocabulary', 'flashcards', defaults)).not.toThrow();
  });
});
