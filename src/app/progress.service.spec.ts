import {TestBed} from '@angular/core/testing';
import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {ProgressService} from './progress.service';
import {ContentService} from './content.service';
import {blankProgress, Word} from './models';
import {createCatalog} from '../../catalog.js';
import {reviewAnswer, validProgress} from '../../core.js';

const words:Word[]=[
 {id:'word-a',lemma:'λόγος',meaning:'palavra',pos:'substantivo',rank:1,frequency:20,level:0,core300:true},
 {id:'word-b',lemma:'θεός',meaning:'Deus',pos:'substantivo',rank:2,frequency:10,level:0,core300:true}
];

describe('ProgressService compatibility',()=>{
 beforeEach(()=>{
  localStorage.clear();TestBed.configureTestingModule({providers:[ProgressService,ContentService]});
  const content=TestBed.inject(ContentService);content.vocabulary={meta:{frequency:{tokens:100}},entries:words};
  content.catalog=createCatalog([],[],words);
 });
 afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();TestBed.resetTestingModule();});
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
 it('marks untouched words without recording fictitious answers and persists each manual choice',()=>{
  const progress=TestBed.inject(ProgressService);
  progress.setWordState('word-a','learned');
  expect(progress.wordState('word-a')).toBe('learned');expect(progress.wordLearned('word-a')).toBe(true);
  expect(progress.state().vocab['word-a']).toMatchObject({attempts:0,correct:0,dates:[],box:0,mastered:false,manualState:'learned'});
  expect(progress.masteredCount()).toBe(1);expect(progress.coreMastered()).toBe(1);expect(progress.coverage()).toBe(20);
  expect(progress.state().answers).toEqual({});expect(progress.state().sessions).toBe(0);
  expect(validProgress(progress.state())).toBe(true);
  expect(JSON.parse(localStorage.getItem(progress.storageKey)!).vocab['word-a'].manualState).toBe('learned');
  progress.setWordState('word-a','review');
  expect(progress.wordState('word-a')).toBe('review');expect(progress.wordLearned('word-a')).toBe(false);
  expect(progress.dueCount()).toBe(1);expect(progress.masteredCount()).toBe(0);
  expect(progress.state().vocab['word-a'].dates).toEqual([]);
  progress.setWordState('word-a',null);
  expect(progress.wordState('word-a')).toBeNull();expect(progress.wordLearned('word-a')).toBe(false);
  expect(progress.state().vocab['word-a'].manualState).toBeUndefined();expect(validProgress(progress.state())).toBe(true);
  const saved=progress.state();progress.setWordState('missing-word','learned');expect(progress.state()).toBe(saved);
 });
 it('manual review preserves real successful days and clearing it restores automatic mastery',()=>{
  const progress=TestBed.inject(ProgressService);
  const automatic=reviewAnswer(reviewAnswer(reviewAnswer(undefined,true,'2026-10-20'),true,'2026-10-23'),true,'2026-10-30');
  progress.mutate(state=>state.vocab['word-a']=automatic);
  progress.setWordState('word-a','review');
  const {manualState,...retained}=progress.state().vocab['word-a'];
  expect(manualState).toBe('review');expect(retained).toEqual(automatic);
  expect(progress.wordLearned('word-a')).toBe(false);expect(progress.masteredCount()).toBe(0);
  progress.setWordState('word-a',null);
  expect(progress.state().vocab['word-a']).toEqual(automatic);expect(progress.wordLearned('word-a')).toBe(true);
  expect(progress.masteredCount()).toBe(1);
 });
 it('reloads saved manual choices together with existing lesson history',()=>{
  const progress=TestBed.inject(ProgressService);
  progress.setWordState('word-a','learned');progress.setWordState('word-b','review');
  progress.toggleLesson('m-alfabeto');
  TestBed.resetTestingModule();TestBed.configureTestingModule({providers:[ProgressService,ContentService]});
  const restored=TestBed.inject(ProgressService);
  expect(restored.wordState('word-a')).toBe('learned');expect(restored.wordState('word-b')).toBe('review');
  expect(restored.wordLearned('word-a')).toBe(true);expect(restored.state().lessons['m-alfabeto']).toBe(true);
  expect(restored.state().vocab['word-a'].attempts).toBe(0);expect(validProgress(restored.state())).toBe(true);
 });
 it('exports and imports manual choices and rejects an invalid state without replacing progress',async()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
  const progress=TestBed.inject(ProgressService);
  progress.setWordState('word-a','learned');progress.setWordState('word-b','review');
  let exported:Blob|undefined;
  const create=vi.fn((blob:Blob|MediaSource)=>{
   if(!(blob instanceof Blob))throw Error('Expected a JSON backup blob.');
   exported=blob;return 'blob:koine-backup';
  });
  const originalURL=URL;
  vi.stubGlobal('URL',class extends originalURL{
   static override createObjectURL=create;
   static override revokeObjectURL=vi.fn();
  });
  const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  progress.exportProgress();expect(create).toHaveBeenCalledOnce();expect(click).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(1000);
  const serialized=await new Promise<string>((resolve,reject)=>{
   const reader=new FileReader();reader.onload=()=>resolve(reader.result as string);reader.onerror=()=>reject(reader.error);
   reader.readAsText(exported!);
  });
  expect(validProgress(JSON.parse(serialized))).toBe(true);
  vi.spyOn(window,'confirm').mockReturnValue(true);
  progress.setWordState('word-a',null);progress.setWordState('word-b',null);
  await progress.importProgress({size:serialized.length,text:async()=>serialized} as File);
  expect(progress.wordState('word-a')).toBe('learned');expect(progress.wordState('word-b')).toBe('review');
  expect(progress.state().vocab['word-a'].dates).toEqual([]);
  const saved=progress.state(),invalid=JSON.parse(serialized);invalid.vocab['word-a'].manualState='invalid';
  await progress.importProgress({size:100,text:async()=>JSON.stringify(invalid)} as File);
  expect(progress.state()).toBe(saved);
 });
});
