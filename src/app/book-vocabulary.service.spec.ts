import {afterEach,describe,it,expect,vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {readFileSync} from 'node:fs';
import {BookVocabularyService,orderBookWords,validateBookVocabulary} from './book-vocabulary.service';
import {ContentService} from './content.service';

describe('Vocabulário por livro',()=>{
  afterEach(()=>{vi.unstubAllGlobals();TestBed.resetTestingModule();});
  it('atualiza um repertório antigo ao carregar os livros',async()=>{
    const vocabulary=JSON.parse(readFileSync(`${process.cwd()}/data/vocabulary.json`,'utf8'));
    const raw=JSON.parse(readFileSync(`${process.cwd()}/data/reading/vocabulary-books.json`,'utf8'));
    const content={vocabulary:{entries:[] as {id:string}[]},refreshVocabulary:vi.fn(async()=>{content.vocabulary=vocabulary;})};
    TestBed.configureTestingModule({providers:[{provide:ContentService,useValue:content}]});
    const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>raw});vi.stubGlobal('fetch',fetcher);
    const service=TestBed.inject(BookVocabularyService);await service.load();
    expect(service.error()).toBe('');expect(service.books()).toHaveLength(27);
    expect(content.refreshVocabulary).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1]).toEqual({cache:'no-cache'});
  });
  it('orders by frequency within the book, with first appearance as a stable tie-break',()=>{
    const book={id:'MAT',name:'Mateus',words:[{id:'a',frequency:1,first:1},{id:'b',frequency:8,first:3},{id:'c',frequency:8,first:2}]};
    expect(orderBookWords(book,'frequency').map(w=>w.id)).toEqual(['c','b','a']);
    expect(orderBookWords(book,'appearance').map(w=>w.id)).toEqual(['a','c','b']);
    expect(book.words.map(w=>w.id)).toEqual(['a','b','c']);
  });
  it('accounts for all actual NT occurrences including proper names, once per lemma per book',()=>{
    const vocabulary=JSON.parse(readFileSync(`${process.cwd()}/data/vocabulary.json`,'utf8'));
    const raw=JSON.parse(readFileSync(`${process.cwd()}/data/reading/vocabulary-books.json`,'utf8'));
    const ids=new Set<string>(vocabulary.entries.map((w:{id:string})=>w.id));
    const books=validateBookVocabulary(raw,ids);
    const counts=new Map<string,number>();
    for(const b of books)for(const w of b.words)counts.set(w.id,(counts.get(w.id)||0)+w.frequency);
    expect([...counts.values()].reduce((a,b)=>a+b,0)).toBe(137741);
    for(const word of vocabulary.entries)expect(counts.get(word.id)||0).toBe(word.frequency);
    const jesus=vocabulary.entries.find((w:{lemma:string})=>w.lemma==='Ἰησοῦς');
    expect(books[0].words.some(w=>w.id===jesus.id)).toBe(true);
    raw.books[0].words[0].id='unknown';
    expect(()=>validateBookVocabulary(raw,ids)).toThrow();
  });
});
