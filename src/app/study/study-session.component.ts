import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {RouterLink} from '@angular/router';
import {AREAS, Area, LEVELS} from '../models';
import {ProgressService} from '../progress.service';
import {ContentService} from '../content.service';
import {IconComponent} from '../shared/icon.component';
import {ProgressBarComponent} from '../shared/progress-bar.component';
import {StudyQuestion, StudySessionService} from './study-session.service';

@Component({
  selector: 'koine-study-session',
  imports: [NgTemplateOutlet, RouterLink, IconComponent, ProgressBarComponent],
  templateUrl: './study-session.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {style: 'display: contents'}
})
export class StudySessionComponent {
  readonly study = inject(StudySessionService);
  readonly areas = AREAS;
  readonly levels = LEVELS;
  readonly progress = inject(ProgressService);
  private readonly content = inject(ContentService);
  readonly back = computed(() => !!this.study.session()?.answered && !this.study.session()?.cardFront);
  readonly currentWord = computed(() => {
    const question = this.study.current();
    return this.study.session()?.area === 'vocabulary' && question?.wordId ? this.content.catalog.wordById.get(question.wordId) ?? null : null;
  });
  readonly types = {
    choice: ['Reconhecer', 'Selecione uma alternativa e confirme em “Verificar”.'],
    parse: ['Analisar', 'Selecione a análise solicitada em cada campo.'],
    match: ['Relacionar', 'Complete os pares. Cada associação recebe uma confirmação imediata.'],
    order: ['Organizar', 'Selecione os blocos na ordem pedida pelo enunciado.']
  };
  letter(index: number): string { return String.fromCharCode(65 + index); }
  progressLevel(area: Area): number { return this.progress.level(area); }
  hasGreek(value: string): boolean { return /[\u0370-\u03ff\u1f00-\u1fff]/.test(value); }
  isGreek(value: string): boolean { return this.hasGreek(value) && !/[a-zA-ZÀ-ÿ]/.test(value); }
  answerText(question: StudyQuestion): string { return question.options?.[question.answer as number] || ''; }
  shortOptions(question: StudyQuestion): boolean { return question.options?.every(option => option.length < 40) ?? false; }
  alphabetMatch(question: StudyQuestion): boolean {
    return question.pairs?.every(pair => /^[\u0370-\u03ff\u1f00-\u1fff]$/u.test(pair.left.normalize('NFC')) && /^[A-Za-zÀ-ÿ -]{1,20}$/.test(pair.right)) ?? false;
  }
  selectValue(event: Event): string { return (event.target as HTMLSelectElement).value; }
  markWord(wordId: string, state: 'review' | 'learned'): void {
    this.progress.setWordState(wordId, this.progress.wordState(wordId) === state ? null : state);
  }
  wordStateLabel(wordId: string): string {
    const manual = this.progress.wordState(wordId);
    return manual === 'review' ? 'Marcada para revisar' : manual === 'learned' ? 'Já aprendida · marcada por você' : this.progress.wordLearned(wordId) ? 'Já aprendida · pelos acertos' : 'Ainda não aprendida';
  }
  audioSource(question: StudyQuestion): string | null {
    const source = question.audio;
    return source && !source.includes('..') && /^(?:\.\/)?assets\/audio\/[a-zA-Z0-9_./-]+\.(?:mp3|ogg|wav)$/i.test(source) ? source : null;
  }
  nextText(): string {
    const session = this.study.session();
    return session?.index === (session?.questions.length || 0) - 1 ? 'Ver resultado' : session?.mode === 'flashcards' ? 'Próximo cartão' : 'Continuar';
  }
}
