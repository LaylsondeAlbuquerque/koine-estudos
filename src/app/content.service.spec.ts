import {TestBed} from '@angular/core/testing';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {ContentService} from './content.service';
import {AREA_KEYS,Article,Lesson} from './models';

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
  const fetcher=vi.fn(async(url:URL)=>{
   const name=url.pathname.split('/').at(-1)!.replace('.json','');
   return {ok:name in sources,json:async()=>sources[name]};
  });
  vi.stubGlobal('fetch',fetcher);
  const content=TestBed.inject(ContentService);
  await content.load();await content.load();
  expect(content.ready()).toBe(true);expect(content.error()).toBe('');
  expect(fetcher).toHaveBeenCalledTimes(9);
  for(const area of AREA_KEYS){
   expect(content.lessonsFor(area)).toHaveLength(1);
   expect(content.articlesFor(area)[0].lessonId).toBe(`${area}-lesson`);
  }
  expect(content.catalog.searchReadings('Aula semantics')[0].area).toBe('semantics');
  expect(content.catalog.articlesForLesson('semantics-lesson')[0].id).toBe('semantics-article');
 });
});
