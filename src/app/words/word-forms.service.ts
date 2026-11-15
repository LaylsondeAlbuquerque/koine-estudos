import {Injectable} from '@angular/core';
import {Word} from '../models';

export interface FormAnalysis {features: string[]; count: number}
export interface WordForm {spellings: string[]; count: number; analyses: FormAnalysis[]}
export interface WordForms {lemma: string; forms: WordForm[]}
const labels: Record<string,string> = {
  noun:'Substantivo',adj:'Adjetivo',adv:'Advérbio',conj:'Conjunção',det:'Determinante',intj:'Interjeição',num:'Numeral',prep:'Preposição',pron:'Pronome',ptcl:'Partícula',verb:'Verbo',
  first:'1ª pessoa',second:'2ª pessoa',third:'3ª pessoa',singular:'singular',plural:'plural',feminine:'feminino',masculine:'masculino',neuter:'neutro',
  accusative:'acusativo',dative:'dativo',genitive:'genitivo',nominative:'nominativo',vocative:'vocativo',
  aorist:'aoristo',future:'futuro',imperfect:'imperfeito',perfect:'perfeito',pluperfect:'mais-que-perfeito',present:'presente',
  active:'voz ativa',middle:'voz média',passive:'voz passiva',imperative:'imperativo',indicative:'indicativo',infinitive:'infinitivo',optative:'optativo',participle:'particípio',subjunctive:'subjuntivo',comparative:'comparativo',superlative:'superlativo'
};
export function morphologyLabel(features: string[]): string {
  return [0,7,5,6,1,4,2,3,8].map(i=>features[i]).filter(Boolean).map(value=>labels[value] || value).join(' · ');
}
@Injectable({providedIn:'root'})
export class WordFormsService {
  private readonly cache = new Map<number, Promise<Record<string,WordForms>>>();
  async load(word: Word): Promise<WordForms> {
    const bucket = [...word.id].reduce((sum,char)=>sum+char.charCodeAt(0),0)%64;
    let request = this.cache.get(bucket);
    if (!request) {
      request = this.fetchChunk(bucket);
      this.cache.set(bucket,request);
      void request.catch(()=>this.cache.delete(bucket));
    }
    const entry = (await request)[word.id];
    if (!entry || entry.lemma !== word.lemma || !Array.isArray(entry.forms)) throw Error('Ficha não disponível.');
    return entry;
  }
  private async fetchChunk(bucket: number): Promise<Record<string,WordForms>> {
    const response = await fetch(new URL(`data/word-forms/${bucket}.json`,document.baseURI));
    if (!response.ok) throw Error('Falha ao carregar a ficha.');
    const data = await response.json();
    if(data.version!==1 || !data.words || typeof data.words!=='object') throw Error('Ficha inválida.');
    return data.words;
  }
}
