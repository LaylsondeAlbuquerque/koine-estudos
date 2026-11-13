import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
test('full vocabulary accounts for every corpus token with stable lemma IDs',()=>{
 const {meta,entries}=read('../data/vocabulary.json');
 assert.equal(entries.length,5474);
 assert.equal(meta.entryCount,entries.length);
 assert.equal(new Set(entries.map(w=>w.id)).size,entries.length);
 assert.equal(entries.reduce((n,w)=>n+w.frequency,0),137741);
 assert.equal(meta.coverageAll.percent,100);
 assert.equal(entries.filter(w=>w.core300).length,300);
 assert.equal(entries.filter(w=>w.glossStatus==='draft').length,4316);
 for(const w of entries){assert.equal(w.id,'v-'+createHash('sha256').update(w.lemma).digest('hex').slice(0,12));assert(w.meaning.trim());}
 const index=read('../data/reading/index.json');
 assert(index.books.flatMap(b=>b.verses).every(v=>v.external.length===0));
 assert.equal(index.meta.totals.potentiallyReadable,7939);
});
