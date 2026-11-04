import {Injectable,signal} from '@angular/core';
import {createCatalog,Catalog} from '../../catalog.js';
import {Area,Lesson,Article,Word} from './models';

@Injectable({providedIn:'root'})
export class ContentService {
  readonly ready=signal(false);
  readonly error=signal('');
  lessons:Lesson[]=[];
  articles:Article[]=[];
  vocabulary:{meta:any;entries:Word[]}={meta:{},entries:[]};
  catalog:Catalog=createCatalog([],[],[]);
  private loading?:Promise<void>;
  load():Promise<void> {
    return this.loading??=this.fetchContent();
  }
  private async fetchContent():Promise<void> {
    try {
      const names=['morphology','syntax','vocabulary-lessons','vocabulary','articles-morphology','articles-syntax','articles-vocabulary'];
      const [m,s,v,words,am,as,av]=await Promise.all(names.map(async name=>{
        const response=await fetch(new URL(`data/${name}.json`,document.baseURI));
        if(!response.ok)throw Error(`Não foi possível carregar ${name}.`);
        return response.json();
      }));
      this.lessons=[...m,...s,...v];this.articles=[...am,...as,...av];this.vocabulary=words;
      this.catalog=createCatalog(this.lessons,this.articles,this.vocabulary.entries);
      this.ready.set(true);
    }catch(error){this.error.set(error instanceof Error?error.message:'Não foi possível carregar o conteúdo.');}
  }
  lessonsFor(area:Area,level:number|null=null){return this.catalog.lessonsFor(area,level);}
  articlesFor(area:Area,level:number|null=null){return this.catalog.articlesFor(area,level);}
  tokenCount(){return this.vocabulary.meta.frequency?.tokens||0;}
}
