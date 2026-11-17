import {describe, expect, it, vi, afterEach} from 'vitest';
import {StudySettingsService} from './study-settings.service';

describe('Study preferences storage', () => {
  afterEach(() => {vi.restoreAllMocks(); localStorage.clear();});
  it.each([30,40,0])('restores flashcard size %s including all cards',size=>{
    const service=new StudySettingsService();
    service.save('vocabulary','flashcards',{...service.load('vocabulary','flashcards'),size});
    expect(new StudySettingsService().load('vocabulary','flashcards').size).toBe(size);
    expect(service.load('vocabulary','practice').size).toBe(10);
  });
  it('replaces a retired level filter with all words while keeping other preferences', () => {
    const service = new StudySettingsService();
    service.save('vocabulary', 'flashcards', {...service.load('vocabulary', 'flashcards'), filter: 'level', size: 30, bookId: 'JHN'});
    expect(service.load('vocabulary', 'flashcards')).toMatchObject({filter: 'all', size: 30, bookId: 'JHN'});
  });
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
