import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewAnswer,isMastered,validProgress,vocabularyQuestion,selectWords,meaningsOverlap,coverage,selectStudyQuestions} from '../core.js';
const words=JSON.parse(readFileSync(new URL('../data/vocabulary.json',import.meta.url))).entries;
const blank=()=>({version:1,levels:{morphology:0,syntax:0,vocabulary:0},lessons:{},vocab:{},answers:{},sessions:0});
test('memorization requires three distinct days and mistakes return the word to review',()=>{
 let entry=reviewAnswer(undefined,true,'2026-10-30');
 for(let i=0;i<10;i++)entry=reviewAnswer(entry,true,'2026-10-30');
 assert.equal(entry.dates.length,1);assert.equal(isMastered(entry),false);
 entry=reviewAnswer(entry,true,'2026-10-31');assert.equal(isMastered(entry),false);
 entry=reviewAnswer(entry,true,'2026-11-03');assert.equal(isMastered(entry),true);assert.equal(entry.nextReview,'2026-11-10');
 entry=reviewAnswer(entry,false,'2026-11-10');assert.equal(isMastered(entry),false);assert.deepEqual(entry.dates,[]);assert.equal(entry.nextReview,'2026-11-11');
});
test('backup validation rejects corrupted history instead of granting false mastery',()=>{
 const value=blank();assert.equal(validProgress(value),true);
 value.vocab.a=reviewAnswer(undefined,true,'2026-10-30');assert.equal(validProgress(value),true);
 value.vocab.a.dates=['2026-10-30','2026-10-30','2026-10-30'];value.vocab.a.mastered=true;assert.equal(validProgress(value),false);assert.equal(isMastered(value.vocab.a),false);
 for(const invalid of [{...blank(),answers:null},{...blank(),sessions:-1},{...blank(),levels:{morphology:9,syntax:0,vocabulary:0}}])assert.equal(validProgress(invalid),false);
});
test('review selection prioritizes due words, never duplicates and respects core filter',()=>{
 const example=words.slice(0,6),review={[example[1].id]:reviewAnswer(undefined,true,'2026-10-20')};
 const selected=selectWords(example,review,{limit:4,day:'2026-10-30',random:()=>.5});
 assert.equal(selected[0].id,example[1].id);assert.equal(new Set(selected.map(w=>w.id)).size,4);
 assert.equal(selectWords(example,review,{filter:'due',day:'2026-10-30'}).length,1);
 assert.equal(selectWords(words,{}, {filter:'core',limit:2000}).length,300);
});
test('negation gloss qualifiers cannot become a second valid answer',()=>{
 const word={id:'a',lemma:'οὐ',meaning:'não',pos:'advérbio'};
 const other=[{id:'b',meaning:'não (negação não assertiva)'},{id:'c',meaning:'pedra'},{id:'d',meaning:'céu'},{id:'e',meaning:'escrever'}];
 const q=vocabularyQuestion(word,[word,...other]);assert.equal(q.options.length,4);assert.equal(q.options.includes(other[0].meaning),false);
 assert.equal(meaningsOverlap('palavra; discurso','palavra; dito'),true);
});
test('all lexical flashcards have unique alternatives and exclude overlapping glosses',()=>{
 for(const word of words){const q=vocabularyQuestion(word,words,()=>.5);assert.equal(q.options[q.answer],word.meaning);assert.equal(new Set(q.options).size,4);for(const [i,option] of q.options.entries())if(i!==q.answer)assert.equal(meaningsOverlap(word.meaning,option),false,word.lemma);}
});
test('lexical coverage counts occurrences only for mastered words',()=>{
 const example=words.slice(0,2),review={};review[example[0].id]={mastered:true,dates:['2026-10-20','2026-10-23','2026-10-30']};
 assert.equal(coverage(example,review,100000),example[0].frequency/100000*100);
});

test('study sessions prefer unseen questions and do not repeat a recent session',()=>{
 const pool=Array.from({length:30},(_,i)=>({id:`q${i}`,lessonId:`lesson${i%5}`,kind:['choice','parse','match'][i%3]}));
 const first=selectStudyQuestions(pool,{}, {limit:10,random:()=>.5});
 const recent=first.map(q=>q.id),answers=Object.fromEntries(recent.map(id=>[id,{correct:true}]));
 const second=selectStudyQuestions(pool,answers,{limit:10,recent,random:()=>.5});
 assert.equal(second.some(q=>recent.includes(q.id)),false);
 assert.equal(selectStudyQuestions(pool,{}, {limit:10,recent,random:()=>.5}).some(q=>recent.includes(q.id)),false);
 assert.equal(new Set(second.map(q=>q.id)).size,10);
 assert.ok(second.every((q,i)=>!i||q.lessonId!==second[i-1].lessonId));
 const small=selectStudyQuestions([pool[0],pool[0],pool[1]],{}, {limit:10});
 assert.equal(small.length,2);assert.equal(new Set(small.map(q=>q.id)).size,2);
});
test('vocabulary sessions avoid recently presented words when others are available',()=>{
 const pool=words.slice(0,15),first=selectWords(pool,{}, {limit:5,random:()=>.5});
 const second=selectWords(pool,{}, {limit:5,recent:first.map(w=>w.id),random:()=>.5});
 assert.equal(second.some(w=>first.some(other=>other.id===w.id)),false);
 const reviews={[pool[0].id]:reviewAnswer(undefined,true,'2026-10-20')};
 assert.equal(selectWords(pool,reviews,{limit:1,recent:[pool[0].id],day:'2026-10-31'})[0].id,pool[0].id);
});
test('reverse lexical challenges have one Greek answer and distinct alternatives',()=>{
 for(const word of words.filter((_,i)=>i%19===0)){
  const q=vocabularyQuestion(word,words,()=>.5,true);
  assert.equal(q.options[q.answer],word.lemma);assert.equal(q.stimulus,word.meaning);
  assert.equal(new Set(q.options).size,4);assert.equal(q.greek,null);
 }
});
test('older backups remain valid and recent history is bounded',()=>{
 assert.equal(validProgress(blank()),true);
 assert.equal(validProgress({...blank(),recentQuestions:['q1'],recentWords:['w1']}),true);
 assert.equal(validProgress({...blank(),recentQuestions:Array(201).fill('q1')}),false);
 assert.equal(validProgress({...blank(),recentWords:[null]}),false);
});
