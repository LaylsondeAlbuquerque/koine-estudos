import {ChangeDetectionStrategy,Component,computed,effect,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ContentService,VocabularyMismatchError} from '../content.service';
import {ProgressService} from '../progress.service';
import {eligible,NtReadingService,ReadingIndex,VerseText} from '../nt-reading.service';

@Component({selector:'koine-nt-reading',standalone:true,imports:[RouterLink],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./nt-reading.component.html',styleUrl:'./nt-reading.component.css'})
export class NtReadingComponent {
  private readonly source=inject(NtReadingService);
  readonly content=inject(ContentService);
  readonly progress=inject(ProgressService);
  readonly index=signal<ReadingIndex|null>(null);
  readonly error=signal('');readonly loading=signal(true);
  readonly bookId=signal('');readonly chapter=signal(0);readonly page=signal(0);
  readonly text=signal(new Map<string,VerseText>());readonly textError=signal('');readonly textLoading=signal(false);
  readonly font=signal(28);readonly pageSize=30;
  private request=0;
  private readonly fontKey='koine-reading-font-v1';
  readonly available=computed(()=>{
    this.progress.state();
    const valid=new Set(this.content.vocabulary.entries.map(w=>w.id));
    const learned=new Set([...valid].filter(id=>this.progress.wordLearned(id)));
    return (this.index()?.books||[]).map(book=>({...book,eligible:book.verses.filter(v=>eligible(v,learned,valid))})).filter(b=>b.eligible.length);
  });
  readonly chapters=computed(()=>[...new Set(this.available().find(b=>b.id===this.bookId())?.eligible.map(v=>v.chapter)||[])]);
  readonly filtered=computed(()=>this.available().filter(b=>!this.bookId()||b.id===this.bookId()).flatMap(b=>b.eligible.filter(v=>!this.chapter()||v.chapter===this.chapter()).map(v=>({book:b.id,name:b.name,...v}))));
  readonly pages=computed(()=>Math.ceil(this.filtered().length/this.pageSize));
  readonly visible=computed(()=>this.filtered().slice(this.page()*this.pageSize,(this.page()+1)*this.pageSize).map(v=>{
    const all=this.index()!.books.find(b=>b.id===v.book)!.verses.filter(r=>r.chapter===v.chapter);
    const i=all.findIndex(r=>r.verse===v.verse);
    const earlier=this.filtered().filter(r=>r.book===v.book&&r.chapter===v.chapter&&r.verse<v.verse).at(-1);
    const omitted=all.slice(earlier?all.findIndex(r=>r.verse===earlier.verse)+1:0,i);
    return {...v,key:`${v.book}:${v.chapter}:${v.verse}`,hidden:omitted.filter(r=>r.aligned).length,excluded:omitted.filter(r=>!r.aligned).length};
  }));
  constructor(){
    try{const saved=Number(localStorage.getItem(this.fontKey));if(saved>=22&&saved<=44)this.font.set(saved);}catch{}
    effect(()=>{
      if(this.bookId()&&!this.available().some(b=>b.id===this.bookId())){this.bookId.set('');this.chapter.set(0);this.page.set(0);}
      if(this.chapter()&&!this.chapters().includes(this.chapter())){this.chapter.set(0);this.page.set(0);}
      if(this.page()>=this.pages()&&this.page())this.page.set(0);
    });
    effect(()=>{const rows=this.visible();const token=++this.request;this.text.set(new Map());this.textError.set('');this.textLoading.set(!!rows.length);
      void Promise.all([...new Set(rows.map(r=>r.book))].map(id=>this.source.book(this.index()!.books.find(b=>b.id===id)!).then(verses=>({id,verses})))).then(books=>{
        if(token!==this.request)return;
        this.text.set(new Map(books.flatMap(b=>b.verses.map(v=>[`${b.id}:${v.chapter}:${v.verse}`,v] as const))));this.textLoading.set(false);
      }).catch(()=>{if(token===this.request){this.textError.set('Não foi possível abrir o texto. Confira a conexão e tente novamente.');this.textLoading.set(false);}});
    });
    void this.load();
  }
  async load(){
    this.error.set('');this.loading.set(true);
    const valid=()=>new Set(this.content.vocabulary.entries.map(w=>w.id));
    try{
      let index:ReadingIndex;
      try{index=await this.source.load(valid());}
      catch(error){
        if(!(error instanceof VocabularyMismatchError))throw error;
        await this.content.refreshVocabulary();
        index=await this.source.load(valid());
      }
      this.index.set(index);
    }catch(error){
      this.error.set(error instanceof VocabularyMismatchError
        ?'O conteúdo do site foi atualizado. Recarregue a página para abrir a leitura; seu progresso será preservado.'
        :'Não foi possível carregar o índice da leitura. Confira sua conexão ou tente novamente.');
    }finally{this.loading.set(false);}
  }
  selectBook(value:string){this.bookId.set(value);this.chapter.set(0);this.page.set(0);}
  selectChapter(value:string){this.chapter.set(Number(value));this.page.set(0);}
  resize(delta:number){this.font.update(v=>Math.max(22,Math.min(44,v+delta)));try{localStorage.setItem(this.fontKey,String(this.font()));}catch{}}
  retryText(){this.index.update(value=>value?{...value}:null);}
  turn(delta:number){this.page.update(p=>Math.max(0,Math.min(this.pages()-1,p+delta)));document.getElementById('reading-results')?.focus();}
}
