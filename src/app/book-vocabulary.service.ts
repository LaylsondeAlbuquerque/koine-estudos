import {Injectable,inject,signal} from '@angular/core';
import {ContentService} from './content.service';
import {Word} from './models';

export type BookWordOrder='frequency'|'appearance';
export interface BookWord {id:string;frequency:number;first:number}
export interface VocabularyBook {id:string;name:string;words:BookWord[]}
export function orderBookWords(book:VocabularyBook,order:BookWordOrder):BookWord[]{
  return [...book.words].sort(order==='appearance'?(a,b)=>a.first-b.first:(a,b)=>b.frequency-a.frequency||a.first-b.first);
}
export function validateBookVocabulary(value:unknown,valid:ReadonlySet<string>):VocabularyBook[]{
  const data=value as {version:number;books:VocabularyBook[]};
  if(data?.version!==1||!Array.isArray(data.books)||data.books.length!==27)throw Error('Índice de vocabulário por livro inválido.');
  const codes=new Set<string>();
  for(const book of data.books){
    if(!/^[A-Z0-9]{3}$/.test(book.id)||codes.has(book.id)||typeof book.name!=='string'||!book.name||!Array.isArray(book.words)||!book.words.length)throw Error('Livro inválido.');
    codes.add(book.id);const ids=new Set<string>(),positions=new Set<number>();
    for(const word of book.words){
      if(!valid.has(word.id)||ids.has(word.id)||!Number.isSafeInteger(word.frequency)||word.frequency<1||!Number.isSafeInteger(word.first)||word.first<1||positions.has(word.first))throw Error('Vocábulo inválido no livro.');
      ids.add(word.id);positions.add(word.first);
    }
  }
  return data.books;
}
@Injectable({providedIn:'root'})
export class BookVocabularyService {
  private readonly content=inject(ContentService);
  readonly books=signal<VocabularyBook[]>([]);
  readonly loading=signal(false);
  readonly error=signal('');
  private request?:Promise<void>;
  load():Promise<void>{
    if(this.books().length)return Promise.resolve();
    return this.request??=this.fetchBooks();
  }
  private async fetchBooks(){
    this.loading.set(true);this.error.set('');
    try{
      const response=await fetch(new URL('data/reading/vocabulary-books.json',document.baseURI));
      if(!response.ok)throw Error('Falha ao carregar os livros.');
      this.books.set(validateBookVocabulary(await response.json(),new Set(this.content.vocabulary.entries.map(w=>w.id))));
    }catch{this.error.set('Não foi possível carregar o vocabulário por livro. Confira a conexão e tente novamente.');}
    finally{this.loading.set(false);this.request=undefined;}
  }
  words(bookId:string,order:BookWordOrder):Word[]{
    const book=this.books().find(b=>b.id===bookId);
    return book?orderBookWords(book,order).map(w=>this.content.catalog.wordById.get(w.id)!).filter(Boolean):[];
  }
}
