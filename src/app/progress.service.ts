import {Injectable,computed,inject,signal} from '@angular/core';
import {coverage,isMastered,isDue,localDate,validProgress} from '../../core.js';
import {Area,Progress,blankProgress} from './models';
import {ContentService} from './content.service';

@Injectable({providedIn:'root'})
export class ProgressService {
  private readonly content=inject(ContentService);
  // Preserve the pre-Angular key and base path, including GitHub Pages subfolders.
  readonly storageKey=`koine-study-v1:${new URL('.',document.baseURI).pathname}`;
  readonly state=signal<Progress>(blankProgress());
  readonly storageAvailable=signal(true);
  readonly message=signal('');
  private toastTimer?:ReturnType<typeof setTimeout>;
  constructor(){
    try {const stored=JSON.parse(localStorage.getItem(this.storageKey)||'null');if(validProgress(stored))this.state.set({...blankProgress(),...stored});}
    catch {this.storageAvailable.set(false);}
  }
  mutate(update:(state:Progress)=>void){
    const next=structuredClone(this.state());update(next);this.state.set(next);this.save();
  }
  private save(){
    try{localStorage.setItem(this.storageKey,JSON.stringify(this.state()));}
    catch{if(this.storageAvailable())this.toast('O navegador não permitiu salvar. Exporte seu progresso para preservá-lo.');this.storageAvailable.set(false);}
  }
  level(area:Area){return this.state().levels[area];}
  setLevel(area:Area,level:number){if(Number.isInteger(level)&&level>=0&&level<=3)this.mutate(state=>state.levels[area]=level);}
  toggleLesson(id:string){this.mutate(state=>state.lessons[id]=!state.lessons[id]);this.toast(this.state().lessons[id]?'Aula concluída. Pratique para aplicar o conceito.':'A aula voltou a ficar em aberto.');}
  toggleArticle(id:string){this.mutate(state=>state.articles[id]=!state.articles[id]);}
  completed(area:Area){const state=this.state();return this.content.lessonsFor(area).filter(lesson=>state.lessons[lesson.id]).length;}
  masteredCount(){const state=this.state();return this.content.vocabulary.entries.filter(word=>isMastered(state.vocab[word.id])).length;}
  coreMastered(){const state=this.state();return this.content.vocabulary.entries.filter(word=>word.core300&&isMastered(state.vocab[word.id])).length;}
  coverage(){return coverage(this.content.vocabulary.entries,this.state().vocab,this.content.tokenCount());}
  dueCount(){const state=this.state();return this.content.vocabulary.entries.filter(word=>isDue(state.vocab[word.id])).length;}
  toast(message:string){clearTimeout(this.toastTimer);this.message.set(message);this.toastTimer=setTimeout(()=>this.message.set(''),5500);}
  exportProgress(){
    const blob=new Blob([JSON.stringify(this.state(),null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`koine-progresso-${localDate()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async importProgress(file:File){
    try{
      if(file.size>4_000_000)throw Error('Arquivo muito grande.');
      const value:unknown=JSON.parse(await file.text());
      if(!validProgress(value))throw Error('Este arquivo não contém um histórico válido do Koiné.');
      if(!confirm('Importar este arquivo substituirá o progresso salvo neste navegador. Continuar?'))return;
      this.state.set({...blankProgress(),...value});this.save();this.toast('Seu histórico foi importado.');
    }catch(error){this.toast(error instanceof Error?error.message:'Não foi possível importar o arquivo.');}
  }
}
