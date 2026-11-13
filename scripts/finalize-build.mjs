import {copyFileSync,existsSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const output=new URL('../dist/koine/',import.meta.url);
const browser=new URL('browser/',output);
assert(existsSync(new URL('index.html',browser)),'Angular build is missing');
copyFileSync(new URL('3rdpartylicenses.txt',output),new URL('3rdpartylicenses.txt',browser));
const html=readFileSync(new URL('index.html',browser),'utf8');
assert(html.includes('koine-app'),'Build does not bootstrap the Angular component');
assert(!html.includes('./app.js'),'Build still references the legacy renderer');
console.log('Angular production artifact and dependency licenses verified.');
const reading=JSON.parse(readFileSync(new URL('data/reading/index.json',browser),'utf8'));
assert.equal(reading.books.length,27,'Reading index must contain 27 books');
const bookVocabulary=JSON.parse(readFileSync(new URL('data/reading/vocabulary-books.json',browser),'utf8'));
assert.equal(bookVocabulary.books.length,27,'Book vocabulary asset must contain 27 books');
for(const book of reading.books){
 const data=JSON.parse(readFileSync(new URL(`data/reading/${book.id}.json`,browser),'utf8'));
 assert.equal(data.id,book.id);
 assert.equal(data.verses.length,book.verses.length);
}
assert(!existsSync(new URL('fontes-locais/',browser)),'Private local sources must not be published');
assert(!existsSync(new URL('tmp/',browser)),'Audit reports must not be published');
console.log('Reading assets verified; local sources and audit reports excluded.');
