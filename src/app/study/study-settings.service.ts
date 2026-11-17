import {Injectable} from '@angular/core';
import {Area} from '../models';
import {BookWordOrder} from '../book-vocabulary.service';
import {StudyMode} from './study-session.service';

export interface StudySettings {
  size: number;
  filter: string;
  topAmount: number;
  bookId: string;
  bookOrder: BookWordOrder;
  wordState: string;
  lessonId: string;
}

const defaults = (): StudySettings => ({size: 10, filter: 'all', topAmount: 300,
  bookId: 'MAT', bookOrder: 'frequency', wordState: 'all', lessonId: ''});

@Injectable({providedIn: 'root'})
export class StudySettingsService {
  private key(area: Area, mode: StudyMode): string {
    return `koine-study-settings-v1:${new URL('.', document.baseURI).pathname}:${area}:${mode}`;
  }

  load(area: Area, mode: StudyMode): StudySettings {
    const settings = defaults();
    try {
      const saved = JSON.parse(localStorage.getItem(this.key(area, mode)) || 'null');
      if (!saved || typeof saved !== 'object') return settings;
      if ((mode === 'flashcards' ? [5, 10, 20, 30, 40, 0] : [5, 10, 20]).includes(saved.size)) settings.size = saved.size;
      if (['all', 'book', 'frequent'].includes(saved.filter)) settings.filter = saved.filter;
      if ([10, 50, 100, 200, 300].includes(saved.topAmount)) settings.topAmount = saved.topAmount;
      if (typeof saved.bookId === 'string' && /^[A-Z0-9]{3}$/.test(saved.bookId)) settings.bookId = saved.bookId;
      if (['frequency', 'appearance'].includes(saved.bookOrder)) settings.bookOrder = saved.bookOrder;
      if (['all', 'unlearned', 'mastered', 'marked', 'due', 'new'].includes(saved.wordState)) settings.wordState = saved.wordState;
      if (typeof saved.lessonId === 'string') settings.lessonId = saved.lessonId;
    } catch { /* Storage may be unavailable; studying still works. */ }
    return settings;
  }

  save(area: Area, mode: StudyMode, settings: StudySettings): void {
    try { localStorage.setItem(this.key(area, mode), JSON.stringify(settings)); }
    catch { /* Preferences must never prevent starting a session. */ }
  }
}
