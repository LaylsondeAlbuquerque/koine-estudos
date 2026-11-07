import {TestBed} from '@angular/core/testing';
import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {ProgressService} from './progress.service';
import {ContentService} from './content.service';
import {blankProgress} from './models';

describe('ProgressService compatibility',()=>{
 beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({providers:[ProgressService,ContentService]});});
 afterEach(()=>{vi.restoreAllMocks();TestBed.resetTestingModule();});
 it('loads pre-Angular progress with the same base-path key and new optional defaults',()=>{
  const {articles,recentQuestions,recentWords,...base}=blankProgress();
  const {semantics,...levels}=base.levels;
  const old={...base,levels};old.lessons['m-alfabeto']=true;old.levels.syntax=2;
  const key=`koine-study-v1:${new URL('.',document.baseURI).pathname}`;
  localStorage.setItem(key,JSON.stringify(old));
  const progress=TestBed.inject(ProgressService);
  expect(progress.storageKey).toBe(key);expect(progress.state().lessons['m-alfabeto']).toBe(true);expect(progress.level('syntax')).toBe(2);
  expect(progress.state().articles).toEqual({});expect(progress.state().recentQuestions).toEqual([]);
  expect(progress.level('semantics')).toBe(0);
  progress.setLevel('semantics',2);
  expect(progress.level('syntax')).toBe(2);expect(progress.state().lessons['m-alfabeto']).toBe(true);
  expect(JSON.parse(localStorage.getItem(key)!).levels.semantics).toBe(2);
 });
 it('keeps article and lesson reading markers independent and persists mutations',()=>{
  const progress=TestBed.inject(ProgressService);
  progress.toggleArticle('am-m-alfabeto');expect(progress.state().lessons['m-alfabeto']).toBeUndefined();
  progress.toggleLesson('m-alfabeto');expect(progress.state().articles['am-m-alfabeto']).toBe(true);
  expect(JSON.parse(localStorage.getItem(progress.storageKey)!)).toEqual(progress.state());
 });
 it('imports old backups and rejects corrupt backups without replacing progress',async()=>{
  vi.spyOn(window,'confirm').mockReturnValue(true);
  const progress=TestBed.inject(ProgressService),old=blankProgress();old.sessions=7;old.lessons['s-aspect']=true;
  const {semantics,...levels}=old.levels;
  await progress.importProgress({size:100,text:async()=>JSON.stringify({...old,levels})} as File);expect(progress.state().sessions).toBe(7);
  expect(progress.level('semantics')).toBe(0);
  const saved=progress.state();await progress.importProgress({size:100,text:async()=>'{bad-json'} as File);
  expect(progress.state()).toBe(saved);expect(progress.state().lessons['s-aspect']).toBe(true);
 });
 it('preserves in-memory progress and exposes a notice when localStorage is unavailable',()=>{
  const progress=TestBed.inject(ProgressService);
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});
  progress.setLevel('morphology',1);
  expect(progress.level('morphology')).toBe(1);expect(progress.storageAvailable()).toBe(false);expect(progress.message()).toContain('Exporte');
 });
});
