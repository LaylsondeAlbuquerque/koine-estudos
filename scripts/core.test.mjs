import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewAnswer,isMastered,validProgress,vocabularyQuestion,selectWords,meaningsOverlap,coverage} from '../core.js';
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
