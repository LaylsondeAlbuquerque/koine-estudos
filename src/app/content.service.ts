import {Injectable,signal} from '@angular/core';
import {createCatalog,Catalog} from '../../catalog.js';
import {Area,Lesson,Article,Word} from './models';

export class VocabularyMismatchError extends Error {
  constructor(){super('O índice e o repertório pertencem a versões diferentes.');this.name='VocabularyMismatchError';}
}

@Injectable({providedIn:'root'})
export class ContentService {
  readonly ready=signal(false);
  readonly error=signal('');
  lessons:Lesson[]=[];
  articles:Article[]=[];
  vocabulary:{meta:any;entries:Word[]}={meta:{},entries:[]};
  catalog:Catalog=createCatalog([],[],[]);
  private loading?:Promise<void>;
  private vocabularyRefresh?:Promise<void>;
  load():Promise<void> {
    return this.loading??=this.fetchContent();
  }
  private async fetchContent():Promise<void> {
    try {
      const names=['morphology','syntax','vocabulary-lessons','vocabulary','articles-morphology','articles-syntax','articles-vocabulary','semantics','articles-semantics'];
      const [m,s,v,words,am,as,av,sem,asem]=await Promise.all(names.map(async name=>{
        const response=await fetch(new URL(`data/${name}.json`,document.baseURI),{cache:'no-cache'});
        if(!response.ok)throw Error(`Não foi possível carregar ${name}.`);
        return response.json();
      }));
      this.lessons=[...m,...s,...v,...sem];this.articles=[...am,...as,...av,...asem];this.vocabulary=words;
      this.catalog=createCatalog(this.lessons,this.articles,this.vocabulary.entries);
      this.ready.set(true);
    }catch(error){this.error.set(error instanceof Error?error.message:'Não foi possível carregar o conteúdo.');}
  }
  refreshVocabulary():Promise<void>{
    return this.vocabularyRefresh??=this.fetchVocabulary().finally(()=>{this.vocabularyRefresh=undefined;});
  }
  private async fetchVocabulary(){
    const response=await fetch(new URL('data/vocabulary.json',document.baseURI),{cache:'no-cache'});
    if(!response.ok)throw Error('Não foi possível atualizar o repertório.');
    const words=await response.json();
    if(!Array.isArray(words?.entries)||!words.entries.length||words.entries.some((w:Word)=>!w||typeof w.id!=='string'||typeof w.lemma!=='string'||typeof w.meaning!=='string')||new Set(words.entries.map((w:Word)=>w.id)).size!==words.entries.length)throw Error('Repertório inválido.');
    const catalog=createCatalog(this.lessons,this.articles,words.entries);
    this.vocabulary=words;this.catalog=catalog;
  }
  lessonsFor(area:Area,level:number|null=null){return this.catalog.lessonsFor(area,level);}
  articlesFor(area:Area,level:number|null=null){return this.catalog.articlesFor(area,level);}
  tokenCount(){return this.vocabulary.meta.frequency?.tokens||0;}
}
