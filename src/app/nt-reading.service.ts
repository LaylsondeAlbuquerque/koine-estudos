import {Injectable} from '@angular/core';
import {VocabularyMismatchError} from './content.service';

export interface VerseIndex {chapter:number; verse:number; tokens:number; requires:string[]; external:string[]; aligned:boolean}
export interface ReadingBook {id:string; name:string; verses:VerseIndex[]}
export interface ReadingIndex {version:number; meta:{edition:string; totals:Record<string,number>}; books:ReadingBook[]}
export interface VerseText {chapter:number; verse:number; text:string}
export function eligible(verse:VerseIndex, learned:ReadonlySet<string>, valid:ReadonlySet<string>):boolean {
  return verse.tokens>0 && verse.aligned && !verse.external.length && verse.requires.every(id=>valid.has(id)&&learned.has(id));
}
const positive = (n:unknown):n is number => Number.isInteger(n) && Number(n)>0;
export function validateIndex(value:unknown, valid:ReadonlySet<string>):ReadingIndex {
  const data=value as ReadingIndex;
  if(data?.version!==1 || data.meta?.edition!=='SBLGNT' || !Array.isArray(data.books) || data.books.length!==27) throw Error('Índice de leitura inválido.');
  const books=new Set<string>();
  for(const book of data.books){
    if(!/^[A-Z0-9]{3}$/.test(book.id)||books.has(book.id)||typeof book.name!=='string'||!Array.isArray(book.verses)||!book.verses.length) throw Error('Livro inválido no índice.');
    books.add(book.id);
    let previous=0;
    for(const v of book.verses){
      const order=v.chapter*1000+v.verse;
      if(!positive(v.tokens)||!positive(v.chapter)||!positive(v.verse)||v.verse>=1000||order<=previous||typeof v.aligned!=='boolean'||!Array.isArray(v.requires)||!Array.isArray(v.external)||v.requires.some(id=>typeof id!=='string')||v.external.some(id=>typeof id!=='string'||!id.startsWith('lemma:'))) throw Error('Dependências inválidas no índice.');
      if(v.requires.some(id=>!valid.has(id)))throw new VocabularyMismatchError();
      previous=order;
    }
  }
  return data;
}
export function validateBook(value:unknown, book:ReadingBook):VerseText[]{
  const data=value as {version:number; id:string; verses:VerseText[]};
  if(data?.version!==1||data.id!==book.id||!Array.isArray(data.verses)||data.verses.length!==book.verses.length) throw Error('Texto do livro incompatível com o índice.');
  data.verses.forEach((v,i)=>{const ref=book.verses[i];if(v.chapter!==ref.chapter||v.verse!==ref.verse||typeof v.text!=='string'||!v.text.trim()) throw Error('Versículo inválido no livro.');});
  return data.verses;
}
@Injectable({providedIn:'root'})
export class NtReadingService {
  private readonly cache=new Map<string,Promise<VerseText[]>>();
  private async json(file:string):Promise<unknown>{
    const response=await fetch(new URL(`data/reading/${file}.json`,document.baseURI),{cache:'no-cache'});
    if(!response.ok) throw Error('Não foi possível carregar a leitura. Confira sua conexão e tente novamente.');
    return response.json();
  }
  async load(valid:ReadonlySet<string>){return validateIndex(await this.json('index'),valid);}
  book(book:ReadingBook){
    let request=this.cache.get(book.id);
    if(!request){request=this.json(book.id).then(value=>validateBook(value,book)).catch(error=>{this.cache.delete(book.id);throw error;});this.cache.set(book.id,request);}
    return request;
  }
}
