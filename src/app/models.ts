export type Area = 'morphology' | 'syntax' | 'vocabulary';
export const AREA_KEYS: Area[] = ['morphology', 'syntax', 'vocabulary'];
export const AREAS = {
  morphology: {name:'Morfologia',symbol:'λ',number:'01',description:'Reconheça as formas. Aprenda os padrões que dão estrutura a cada palavra.',focus:'Padrões e análise morfológica',short:'Formas que fazem sentido'},
  syntax: {name:'Sintaxe',symbol:'σ',number:'02',description:'Conecte as palavras. Entenda como cada termo participa da construção do sentido.',focus:'Conceitos, relações e contexto',short:'Das palavras ao sentido'},
  vocabulary: {name:'Vocabulário',symbol:'ω',number:'03',description:'Amplie seu repertório. Memorize os vocábulos e encontre-os de novo no texto.',focus:'Memorização com revisão espaçada',short:'Um repertório para ler'}
};
export const LEVELS = ['Fundamentos','Essencial','Aprofundamento','Avançado'];
export const LEVEL_DESCRIPTIONS = ['Seu primeiro contato, com conceitos e exemplos guiados.','Consolide os padrões e relações mais frequentes.','Reconheça construções mais complexas e amplie sua autonomia.','Compare análises, enfrente ambiguidades e leia criticamente.'];
export interface Table {headers:string[];rows:string[][];}
export interface Section {heading:string;body:string;table?:Table;}
export type Reference = string | {title:string;url?:string};
export interface Question {
  id:string;kind:'choice'|'parse'|'match'|'order';prompt:string;explanation:string;
  // Each exercise kind has its own data and prepared display fields.
  [key:string]:any;
}
export interface Lesson {id:string;area:Area;level:number;order:number;title:string;summary:string;minutes:number;objectives:string[];sections:Section[];examples?:{greek:string;translation:string;note:string}[];questions:Question[];references:Reference[];author?:string;}
export interface Article {id:string;area:Area;level:number;order:number;lessonId:string;title:string;summary:string;minutes:number;sections:Section[];discussionQuestions?:string[];references:Reference[];author?:string;}
export interface Word {id:string;lemma:string;meaning:string;pos:string;rank:number;frequency:number;level:number;core300:boolean;aliases?:string[];audio?:string;}
export interface Review {attempts:number;correct:number;dates:string[];box:number;nextReview:string;mastered:boolean;lastSeen?:string;}
export interface Progress {version:1;levels:Record<Area,number>;lessons:Record<string,boolean>;articles:Record<string,boolean>;vocab:Record<string,Review>;answers:Record<string,{correct:boolean;day:string;attempts:number}>;sessions:number;recentQuestions:string[];recentWords:string[];}
export const blankProgress = ():Progress => ({version:1,levels:{morphology:0,syntax:0,vocabulary:0},lessons:{},articles:{},vocab:{},answers:{},sessions:0,recentQuestions:[],recentWords:[]});
