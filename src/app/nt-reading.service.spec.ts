import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {eligible,validateIndex,validateBook,VerseIndex} from './nt-reading.service';
import {VocabularyMismatchError} from './content.service';

const verse:VerseIndex={chapter:1,verse:1,tokens:1,requires:['v-a'],external:[],aligned:true};
describe('Leitura conservadora do NT',()=>{
  it('exige todas as dependências aprendidas e cadastradas',()=>{
    expect(eligible(verse,new Set(['v-a']),new Set(['v-a']))).toBe(true);
    expect(eligible(verse,new Set(),new Set(['v-a']))).toBe(false);
    expect(eligible(verse,new Set(['v-a']),new Set())).toBe(false);
    expect(eligible({...verse,requires:['v-a','v-b']},new Set(['v-a']),new Set(['v-a','v-b']))).toBe(false);
  });
  it('bloqueia alinhamentos pendentes e lemas fora do repertório',()=>{
    expect(eligible({...verse,tokens:0,requires:[]},new Set(),new Set())).toBe(false);
    expect(eligible({...verse,aligned:false},new Set(['v-a']),new Set(['v-a']))).toBe(false);
    expect(eligible({...verse,external:['lemma:γαστήρ']},new Set(['v-a']),new Set(['v-a']))).toBe(false);
  });
  it('valida os 27 livros gerados contra os IDs do vocabulário real',()=>{
    const root=process.cwd();
    const vocab=JSON.parse(readFileSync(`${root}/data/vocabulary.json`,'utf8'));
    const valid=new Set<string>(vocab.entries.map((w:{id:string})=>w.id));
    const raw=JSON.parse(readFileSync(`${root}/data/reading/index.json`,'utf8'));
    const index=validateIndex(raw,valid);
    expect(index.books.flatMap(b=>b.verses)).toHaveLength(7939);
    expect(index.books.flatMap(b=>b.verses).filter(v=>!v.aligned)).toHaveLength(0);
    for(const book of index.books){
      const text=JSON.parse(readFileSync(`${root}/data/reading/${book.id}.json`,'utf8'));
      expect(validateBook(text,book)).toHaveLength(book.verses.length);
      if(book.id==='JHN'){
        expect(text.verses.find((v:{chapter:number;verse:number})=>v.chapter===7&&v.verse===34).text).toContain('ζητήσετέ με καὶ οὐχ εὑρήσετε');
        expect(text.verses.find((v:{chapter:number;verse:number})=>v.chapter===8&&v.verse===9).text).toContain('οἱ δὲ');
        expect(text.verses.find((v:{chapter:number;verse:number})=>v.chapter===10&&v.verse===29).text).toContain('μείζων ἐστίν');
      }
      if(book.id==='LUK')expect(text.verses.find((v:{chapter:number;verse:number})=>v.chapter===8&&v.verse===20).text).toContain('σε θέλοντες');
    }
    expect(index.books.flatMap(b=>b.verses).filter(v=>eligible(v,valid,valid))).toHaveLength(7939);
    expect(index.books.flatMap(b=>b.verses).every(v=>!v.external.length)).toBe(true);
    raw.books[0].verses[0].requires.push('nonexistent');
    expect(()=>validateIndex(raw,valid)).toThrow();
  });
  it('rejeita texto vazio, referências trocadas e livro de outra versão',()=>{
    const book={id:'MAT',name:'Mateus',verses:[verse]};
    const data={version:1,id:'MAT',verses:[{chapter:1,verse:1,text:'λόγος'}]};
    expect(validateBook(data,book)).toHaveLength(1);
    expect(()=>validateBook({...data,id:'MRK'},book)).toThrow();
    expect(()=>validateBook({...data,verses:[{chapter:1,verse:2,text:'λόγος'}]},book)).toThrow();
    expect(()=>validateBook({...data,verses:[{chapter:1,verse:1,text:''}]},book)).toThrow();
  });
  it('identifica o repertório antigo como incompatível, sem liberar dependências desconhecidas',()=>{
    const vocab=JSON.parse(readFileSync(`${process.cwd()}/data/vocabulary.json`,'utf8'));
    const raw=JSON.parse(readFileSync(`${process.cwd()}/data/reading/index.json`,'utf8'));
    const old=new Set<string>(vocab.entries.filter((w:{glossStatus?:string})=>!w.glossStatus).map((w:{id:string})=>w.id));
    expect(old.size).toBeLessThan(vocab.entries.length);
    expect(()=>validateIndex(raw,old)).toThrow(VocabularyMismatchError);
    const current=new Set<string>(vocab.entries.map((w:{id:string})=>w.id));
    expect(validateIndex(raw,current).books).toHaveLength(27);
    raw.books[0].verses[0].requires.push('missing-after-refresh');
    expect(()=>validateIndex(raw,current)).toThrow(VocabularyMismatchError);
  });
});
