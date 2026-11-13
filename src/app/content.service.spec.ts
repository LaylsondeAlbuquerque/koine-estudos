import {TestBed} from '@angular/core/testing';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {ContentService} from './content.service';
import {AREA_KEYS,Article,Lesson,Word} from './models';

describe('ContentService area integration',()=>{
 afterEach(()=>{vi.unstubAllGlobals();TestBed.resetTestingModule();});
 it('loads all four formations and indexes semantic lessons and their deeper articles',async()=>{
  const sources:Record<string,unknown>={vocabulary:{meta:{},entries:[]}};
  for(const [index,area] of AREA_KEYS.entries()){
   const lesson:Lesson={id:`${area}-lesson`,area,level:0,order:index,title:`Aula ${area}`,summary:'Uma explicação.',minutes:5,objectives:['Investigar'],references:[],sections:[{heading:'Contexto',body:'Investigar o sentido da ocorrência.'}],questions:[]};
   const article:Article={id:`${area}-article`,lessonId:lesson.id,area,level:0,order:index,title:`Artigo ${area}`,summary:'Discussão aprofundada.',minutes:5,references:[],sections:[{heading:'Método',body:'Compare a evidência.'}]};
   sources[area==='vocabulary'?'vocabulary-lessons':area]=[lesson];
   sources[`articles-${area}`]=[article];
  }
  const fetcher=vi.fn(async(url:URL,_options?:RequestInit)=>{
   const name=url.pathname.split('/').at(-1)!.replace('.json','');
   return {ok:name in sources,json:async()=>sources[name]};
  });
  vi.stubGlobal('fetch',fetcher);
  const content=TestBed.inject(ContentService);
  await content.load();await content.load();
  expect(content.ready()).toBe(true);expect(content.error()).toBe('');
  expect(fetcher).toHaveBeenCalledTimes(9);
  for(const call of fetcher.mock.calls)expect(call[1]).toEqual({cache:'no-cache'});
  for(const area of AREA_KEYS){
   expect(content.lessonsFor(area)).toHaveLength(1);
   expect(content.articlesFor(area)[0].lessonId).toBe(`${area}-lesson`);
  }
  expect(content.catalog.searchReadings('Aula semantics')[0].area).toBe('semantics');
  expect(content.catalog.articlesForLesson('semantics-lesson')[0].id).toBe('semantics-article');
 });
 it('refreshes an outdated vocabulary once for concurrent readers without changing saved progress',async()=>{
  const content=TestBed.inject(ContentService);
  const old={id:'v-a',lemma:'λόγος',meaning:'palavra'} as Word;
  const added={id:'v-b',lemma:'θεός',meaning:'Deus'} as Word;
  content.vocabulary={meta:{},entries:[old]};
  localStorage.setItem('koine-study-test',JSON.stringify({learned:['v-a']}));
  const saved=localStorage.getItem('koine-study-test');
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({meta:{},entries:[old,added]})});
  vi.stubGlobal('fetch',fetcher);
  await Promise.all([content.refreshVocabulary(),content.refreshVocabulary()]);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][1]).toEqual({cache:'no-cache'});
  expect(content.catalog.wordById.get('v-a')).toEqual(old);
  expect(content.catalog.wordById.get('v-b')).toEqual(added);
  expect(localStorage.getItem('koine-study-test')).toBe(saved);
  localStorage.removeItem('koine-study-test');
 });
 it('keeps the existing vocabulary when a refresh returns invalid entries',async()=>{
  const content=TestBed.inject(ContentService);
  const original=content.vocabulary;
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({entries:[{id:'broken'}]})}));
  await expect(content.refreshVocabulary()).rejects.toThrow('Repertório inválido');
  expect(content.vocabulary).toBe(original);
 });
});
