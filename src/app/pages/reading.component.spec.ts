import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {Article, Lesson} from '../models';
import {StudySessionService} from '../study/study-session.service';
import {ReadingComponent} from './reading.component';

describe('Percurso e artigos após a migração', () => {
  let lesson: Lesson;
  let article: Article;

  beforeEach(() => {
    localStorage.clear();
    lesson = {
      id: 'm-route-test', area: 'morphology', level: 0, order: 1,
      title: 'Aula básica', summary: 'Uma explicação do percurso.', minutes: 5,
      objectives: ['Reconhecer uma forma'], questions: [],
      sections: [{heading: 'Primeiro contato', body: 'Explicação básica de teste.'}],
      references: ['Referência didática de teste']
    };
    article = {
      id: 'am-route-test', area: 'morphology', level: 0, order: 1, lessonId: lesson.id,
      title: 'Discussão de aprofundamento', summary: 'Uma análise além da aula.', minutes: 8,
      sections: [{heading: 'Comparar análises', body: 'Discussão aprofundada de teste.'}],
      references: ['Referência de aprofundamento de teste'],
      discussionQuestions: ['Qual evidência sustenta a análise?']
    };
    const content = {
      lessons: [lesson], articles: [article], vocabulary: {meta: {}, entries: []},
      lessonsFor: () => [lesson], articlesFor: () => [article], tokenCount: () => 0,
      catalog: {
        lessonById: new Map([[lesson.id, lesson]]),
        articleById: new Map([[article.id, article]]),
        articlesForLesson: (id: string) => id === lesson.id ? [article] : []
      }
    };
    TestBed.configureTestingModule({providers: [
      provideRouter([
        {path: ':area/article/:id', component: ReadingComponent, data: {kind: 'article'}},
        {path: ':area/lesson/:id', component: ReadingComponent, data: {kind: 'lesson'}}
      ]),
      {provide: ContentService, useValue: content},
      {provide: StudySessionService, useValue: {start: vi.fn()}}
    ]});
  });

  it('preserva bookmarks antigos de aulas em /article/<id-da-aula>', async () => {
    const harness = await RouterTestingHarness.create(`/morphology/article/${lesson.id}`);
    const page = harness.routeNativeElement!;
    expect(page.querySelector('h1')?.textContent).toBe(lesson.title);
    expect(page.querySelector('.article-head .eyebrow')?.textContent).toContain('AULA DO PERCURSO');
    expect(page.querySelector('.lesson-deeper')?.textContent).toContain(article.title);
    expect(page.querySelector('.article-authorship')).toBeNull();
  });

  it('marca um artigo como lido sem concluir a aula correspondente', async () => {
    const harness = await RouterTestingHarness.create(`/morphology/article/${article.id}`);
    const button = Array.from(harness.routeNativeElement!.querySelectorAll('button'))
      .find(item => item.textContent?.includes('Marcar artigo como lido'))!;
    button.click();
    harness.detectChanges();
    const state = TestBed.inject(ProgressService).state();
    expect(state.articles[article.id]).toBe(true);
    expect(state.lessons[lesson.id]).toBeUndefined();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('exibe o aviso de IA somente no aprofundamento e aceita futura autoria humana', async () => {
    const harness = await RouterTestingHarness.create(`/morphology/lesson/${lesson.id}`);
    expect(harness.routeNativeElement!.textContent).not.toContain('Texto produzido por IA.');
    await harness.navigateByUrl(`/morphology/article/${article.id}`);
    expect(harness.routeNativeElement!.querySelector('.article-authorship')?.textContent?.trim()).toBe('Texto produzido por IA.');
    article.author = 'Autoria de teste';
    await harness.navigateByUrl(`/morphology/lesson/${lesson.id}`);
    await harness.navigateByUrl(`/morphology/article/${article.id}`);
    expect(harness.routeNativeElement!.querySelector('.article-authorship')?.textContent?.trim()).toBe('Texto de Autoria de teste.');
  });
});
