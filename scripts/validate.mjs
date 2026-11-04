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
for(const path of ['index.html','styles.css','app.js','core.js','assets/EncodeSans.ttf','assets/GFSDidot.ttf','assets/EncodeSans-OFL.txt','assets/GFSDidot-OFL.txt','LICENSE','CONTENT-LICENSE.md','THIRD_PARTY_NOTICES.md','.nojekyll'])assert(existsSync(new URL(path,root)),path);
// Follow actual runtime links so a newly imported module, stylesheet or font
// cannot pass checks while missing from the site. Queries are cache versions.
const checkedFiles=new Set();
function checkRuntimeFile(file){
 const key=file.href;if(checkedFiles.has(key))return;checkedFiles.add(key);
 assert(existsSync(file),`Missing runtime file: ${file.pathname}`);
 const path=file.pathname;
 if(!/\.(?:html|css|js)$/u.test(path))return;
 const text=readFileSync(file,'utf8');
 const patterns=path.endsWith('.html')?[/\b(?:src|href)\s*=\s*["']([^"'<>]+)["']/gu]:path.endsWith('.css')?[/url\(\s*["']?([^"')\s]+)["']?\s*\)/gu]:[/^\s*(?:import|export)\s+[^\n]*?\bfrom\s*["']([^"']+)["']/gmu,/^\s*import\s*["']([^"']+)["']/gmu,/\bimport\(\s*["']([^"']+)["']\s*\)/gu];
 for(const pattern of patterns)for(const match of text.matchAll(pattern)){
  const ref=match[1];if(ref.startsWith('#')||/^[a-z][a-z\d+.-]*:/iu.test(ref))continue;
  const target=new URL(ref,file);target.search='';target.hash='';
  assert(target.href.startsWith(root.href),`Runtime path outside site: ${ref}`);
  checkRuntimeFile(target);
 }
}
checkRuntimeFile(new URL('index.html',root));
console.log(JSON.stringify(Object.fromEntries(Object.entries(counts).map(([a,c])=>[a,{lessons:c.lessons,questions:c.questions}]))));
console.log(`${lessons.length} lessons and ${qids.size} questions validated.`);
const articles=['articles-morphology','articles-syntax','articles-vocabulary'].flatMap(name=>JSON.parse(readFileSync(new URL(`data/${name}.json`,root),'utf8')));
const covered=new Set();
for(const article of articles){
 assert(!ids.has(article.id),`Duplicate reading ${article.id}`);ids.add(article.id);
 const lesson=lessons.find(l=>l.id===article.lessonId);assert(lesson,`Unknown lesson for ${article.id}`);
 assert(article.area===lesson.area&&article.level===lesson.level,`Wrong level/area for ${article.id}`);
 assert(article.title&&article.title!==lesson.title&&article.summary&&article.minutes>0,article.id);
 assert(article.sections?.length>=3&&article.references?.length>0,article.id);
 assert(article.sections.every(s=>s.heading&&s.body),article.id);
 if(article.discussionQuestions!==undefined)assert(Array.isArray(article.discussionQuestions)&&article.discussionQuestions.every(q=>typeof q==='string'&&q.trim().length>0),article.id);
 const body=article.sections.map(s=>s.body).join(' ');assert(body.trim().split(/\s+/u).length>=280,`Article too short: ${article.id}`);
 assert(body!==lesson.sections.map(s=>s.body).join(' '),`Article duplicates lesson: ${article.id}`);
 for(const ref of article.references){assert(typeof ref==='string'||typeof ref.title==='string',article.id);if(ref.url)assert(/^https?:\/\//.test(ref.url),article.id);}
 covered.add(article.lessonId);
}
assert.equal(covered.size,lessons.length,'Every lesson needs a separate deeper article');
console.log(`${articles.length} distinct deeper articles cover all ${covered.size} lessons.`);
