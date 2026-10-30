import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const lessons=['morphology','syntax','vocabulary-lessons'].flatMap(name=>JSON.parse(readFileSync(new URL(`data/${name}.json`,root),'utf8')));
const ids=new Set(),qids=new Set(),counts={};
for(const lesson of lessons){
 assert(!ids.has(lesson.id),`Duplicate lesson ${lesson.id}`);ids.add(lesson.id);
 assert(['morphology','syntax','vocabulary'].includes(lesson.area));assert(Number.isInteger(lesson.level)&&lesson.level>=0&&lesson.level<=3);
 assert(lesson.title&&lesson.summary&&lesson.objectives?.length&&lesson.references?.length,lesson.id);
 assert(lesson.sections?.length>=3&&lesson.questions?.length>=3,lesson.id);
 for(const section of lesson.sections){assert(section.heading&&section.body,lesson.id);if(section.table){assert(section.table.headers.length>0);for(const row of section.table.rows)assert(row.length===section.table.headers.length,`${lesson.id}: uneven table`);}}
 for(const q of lesson.questions){
  assert(!qids.has(q.id),q.id);qids.add(q.id);assert(q.prompt&&q.explanation,q.id);
  if(q.kind==='choice'){assert(q.options.length>=3&&new Set(q.options).size===q.options.length,q.id);assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,q.id);}
  else if(q.kind==='parse'){assert(q.fields.length>0,q.id);for(const f of q.fields)assert(f.label&&f.options.includes(f.answer)&&new Set(f.options).size===f.options.length,q.id);}
  else if(q.kind==='match'){assert(q.pairs.length>=2,q.id);assert(new Set(q.pairs.map(p=>p.left)).size===q.pairs.length,q.id);assert(new Set(q.pairs.map(p=>p.right)).size===q.pairs.length,q.id);}
  else if(q.kind==='order'){assert.deepEqual([...q.tokens].sort(),[...q.answer].sort(),q.id);}
  else assert.fail(`Unknown question kind ${q.kind}`);
 }
 counts[lesson.area]??={lessons:0,questions:0,levels:new Set()};counts[lesson.area].lessons++;counts[lesson.area].questions+=lesson.questions.length;counts[lesson.area].levels.add(lesson.level);
}
for(const c of Object.values(counts))assert.equal(c.levels.size,4);
for(const path of ['index.html','styles.css','app.js','core.js','assets/Manrope.ttf','assets/GFSDidot.ttf','assets/Manrope-OFL.txt','assets/GFSDidot-OFL.txt','LICENSE','CONTENT-LICENSE.md','THIRD_PARTY_NOTICES.md','.nojekyll'])assert(existsSync(new URL(path,root)),path);
console.log(JSON.stringify(Object.fromEntries(Object.entries(counts).map(([a,c])=>[a,{lessons:c.lessons,questions:c.questions}]))));
console.log(`${lessons.length} lessons and ${qids.size} questions validated.`);
