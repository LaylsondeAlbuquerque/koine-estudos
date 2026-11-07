import type {Area,Lesson,Article,Word,Review} from './src/app/models';
export interface Catalog {
 lessonById:Map<string,Lesson>;articleById:Map<string,Article>;wordById:Map<string,Word>;
 lessonsFor(area:Area,level?:number|null):Lesson[];articlesFor(area:Area,level?:number|null):Article[];
 articlesForLesson(id:string):Article[];wordsForLevel(level:number):Word[];wordClasses:string[];
 searchReadings(query:string,limit?:number):((Lesson|Article)&{readingType:'lesson'|'article'})[];
 searchWords(query:string,limit?:number):Word[];
 filterWords(options?:{query?:string;pos?:string;filter?:string;state?:string;reviews?:Record<string,Review>;day?:string}):Word[];
}
export function createCatalog(lessons:Lesson[],articles:Article[],words:Word[]):Catalog;
