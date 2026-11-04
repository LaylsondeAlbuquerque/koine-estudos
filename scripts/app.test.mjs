import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as core from '../core.js';
import {createCatalog} from '../catalog.js';

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');

// Exercise the actual application handlers without a browser or extra runtime
// dependencies. Only the DOM surfaces touched by these flows are stubbed.
async function application() {
  const events = {}, storage = new Map();
  let renders = 0;
  const app = {set innerHTML(value) { this.html = value; renders++; }};
  const exercise = {innerHTML: ''}, verify = {disabled: true}, count = {textContent: ''}, lessonSelect = {value: ''};
  const node = () => ({focus() {}, scrollIntoView() {}, remove() {}, setAttribute() {}, click() {}, classList: {contains() {return false;}}});
  const document = {
    baseURI: 'http://localhost:4173/', title: '', activeElement: {tagName: 'BODY'},
    body: {append() {}},
    querySelector(selector) {
      if (selector === '#app') return app;
      if (selector === '#session-lesson') return lessonSelect;
      if (selector === '.practice-exercise') return exercise;
      if (selector === '[data-action="check-choice"], [data-action="check-order"]') return verify;
      if (selector === '.practice-controls>span') return count;
      if (selector.includes('data-action') || selector === '.menu-toggle') return node();
      return null;
    },
    querySelectorAll() {return [];},
    createElement: node,
    addEventListener(type, handler) {events[type] = handler;}
  };
  const context = vm.createContext({
    ...core, createCatalog, document, URL, Intl, Blob, console,
    getTheme: () => 'dark', toggleTheme: () => 'light', mountHomeMotion() {},
    localStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)},
    location: {hash: '#/home'}, confirm: () => true,
    window: {addEventListener(type, handler) {events[type] = handler;}, scrollTo() {}},
    setTimeout: () => 1, clearTimeout() {},
    fetch: async url => ({ok: true, json: async () => JSON.parse(readFileSync(new URL(`../${url.split('?')[0]}`, import.meta.url), 'utf8'))})
  });
  const api = await new vm.Script(`(async()=>{${source}\nreturn {
    getState:()=>state, getSession:()=>session, routeTo:hash=>{location.hash=hash;},
    setSession:value=>{session=value;}, setMenu:value=>{menuOpen=value;},
    start:dataset=>startSession({dataset}), render, validState:()=>validProgress(state)
  };})()`).runInContext(context);
  const click = (dataset, properties = {}) => events.click({
    button: 0, ...properties,
    target: {classList: {contains: () => false}, closest: selector => selector === '[data-action]' ? {dataset} : null}
  });
  return {...api, click, events, document, exercise, verify, count, storage, lessonSelect, renders: () => renders,
    clickLink(href, properties = {}) {
      let prevented = false;
      events.click({button: 0, ...properties, preventDefault() {prevented = true;}, target: {
        classList: {contains: () => false},
        closest: selector => (selector === 'a[href^="#/"]' && href.startsWith('#/')) || (selector === 'a[href="#main"]' && href === '#main') ? {target: '', getAttribute: () => href} : null
      }});
      return prevented;
    }
  };
}

test('same-route navigation exits a session and renders instead of leaving stale exercise controls', async () => {
  const app = await application();
  app.routeTo('#/morphology/lesson/m-alfabeto');
  app.start({area: 'morphology', mode: 'practice', lesson: 'm-alfabeto'});
  assert.ok(app.getSession());
  const before = app.renders();
  assert.equal(app.clickLink('#/morphology/lesson/m-alfabeto'), true);
  assert.equal(app.getSession(), null);
  assert.equal(app.renders(), before + 1);
  app.start({area: 'morphology', mode: 'practice', lesson: 'm-alfabeto'});
  const current = app.getSession();
  app.clickLink('#/syntax/path', {ctrlKey: true});
  assert.equal(app.getSession(), current, 'opening a link in another tab keeps the current session');
});

test('practice selections and matching counters update without rebuilding the page', async () => {
  const app = await application();
  app.start({area: 'morphology', mode: 'practice', lesson: 'm-alfabeto'});
  const session = app.getSession();
  session.questions = [{id: 'choice-test', kind: 'choice', options: ['a', 'b', 'c'], answer: 1}];
  const before = app.renders();
  app.click({action: 'answer', index: '1'});
  assert.equal(session.draftAnswer, 1);
  assert.equal(session.answered, false);
  assert.equal(app.verify.disabled, false);
  assert.equal(app.renders(), before);
  session.questions = [{id: 'match-test', kind: 'match', pairs: [{left: 'α', right: 'alfa'}, {left: 'β', right: 'beta'}], rightOrder: [1, 0]}];
  app.click({action: 'match-left', index: '0'});
  app.click({action: 'match-right', index: '1'});
  assert.equal(session.mistakes, 1);
  assert.equal(session.matched.length, 0);
  app.click({action: 'match-right', index: '0'});
  assert.equal(session.matched.length, 1);
  assert.equal(app.count.textContent, '1 de 2 pares completos');
  assert.equal(app.renders(), before);
});

test('ordering blocks can be removed and verification enables only for a full sequence', async () => {
  const app = await application();
  app.start({area: 'syntax', mode: 'practice', lesson: 's-subject-predicate'});
  const session = app.getSession();
  session.questions = [{id: 'order-test', kind: 'order', tokens: ['o', 'aluno'], answer: ['o', 'aluno'], tokenOrder: [1, 0]}];
  app.click({action: 'order-add', index: '1'});
  assert.equal(app.verify.disabled, true);
  app.click({action: 'order-add', index: '0'});
  assert.equal(app.verify.disabled, false);
  app.click({action: 'order-remove', index: '0'});
  assert.equal(app.verify.disabled, true);
  assert.deepEqual(Array.from(session.order), [0]);
});

test('lexical practice records reviews without accumulating random matching IDs in answer history', async () => {
  const app = await application();
  app.start({area: 'vocabulary', mode: 'flashcards'});
  const session = app.getSession(), question = session.questions[0];
  app.click({action: 'answer', index: String(question.answer)});
  const state = app.getState();
  assert.equal(session.answered, true);
  assert.equal(state.vocab[question.wordId].correct, 1);
  assert.equal(state.answers[question.id], undefined);
  assert.equal(app.validState(), true);
});

test('import restores older progress with separate article defaults', async () => {
  const app = await application();
  const backup = {version: 1, levels: {morphology: 1, syntax: 2, vocabulary: 0}, lessons: {'m-alfabeto': true}, vocab: {}, answers: {}, sessions: 3};
  const input = {id: 'import-progress', value: 'backup.json', matches: () => false, files: [{size: 1000, text: async () => JSON.stringify(backup)}]};
  await app.events.change({target: input});
  assert.equal(app.getState().lessons['m-alfabeto'], true);
  assert.equal(app.getState().levels.syntax, 2);
  assert.equal(Object.keys(app.getState().articles).length, 0);
  assert.equal(app.getState().sessions, 3);
  assert.equal(input.value, '', 'the same file can be selected again');
});

test('a vocabulary search result ignores the lesson filter from another area', async () => {
  const app = await application();
  app.routeTo('#/morphology/practice');
  app.lessonSelect.value = 'm-alfabeto';
  const word = JSON.parse(readFileSync(new URL('../data/vocabulary.json', import.meta.url))).entries[0];
  app.click({action: 'search-word', word: word.id});
  assert.equal(app.getSession()?.area, 'vocabulary');
  assert.equal(app.getSession()?.questions[0].wordId, word.id);
});

test('skip-to-content preserves the active practice session and current route', async () => {
  const app = await application();
  app.routeTo('#/syntax/practice');
  app.start({area: 'syntax', mode: 'practice', lesson: 's-subject-predicate'});
  const session = app.getSession(), before = app.renders();
  assert.equal(app.clickLink('#main'), true);
  assert.equal(app.getSession(), session);
  assert.equal(app.renders(), before);
});

test('invalid imports leave progress untouched and allow retrying the same file', async () => {
  const app = await application(), previous = app.getState();
  const input = {id: 'import-progress', value: 'backup.json', matches: () => false, files: [{size: 100, text: async () => '{bad-json'}]};
  await app.events.change({target: input});
  assert.equal(app.getState(), previous);
  assert.equal(input.value, '');
});
