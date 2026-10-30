export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ς/g, 'σ');
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function addDays(day, amount) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month-1, date+amount)).toISOString().slice(0,10);
}
export function reviewAnswer(previous, correct, day = localDate()) {
  const entry = { attempts:0, correct:0, dates:[], box:0, nextReview:day, ...previous };
  entry.attempts++;
  entry.lastSeen = day;
  if (!correct) { entry.dates=[]; entry.box=0; entry.nextReview=addDays(day,1); entry.mastered=false; return entry; }
  entry.correct++;
  if (!entry.dates.includes(day)) { entry.dates=[...entry.dates,day]; entry.box=Math.min(entry.box+1,5); }
  entry.mastered=entry.dates.length>=3;
  entry.nextReview=addDays(day,[1,1,3,7,14,30][entry.box]);
  return entry;
}
export const isMastered = review => Boolean(review?.mastered && new Set(review?.dates||[]).size>=3);
export const isDue = (review, day = localDate()) => Boolean(review && review.nextReview <= day);
export function meaningsOverlap(first, second) {
  const senses=value=>normalize(value).replace(/\([^)]*\)/g,'').split(/[;,/]/).map(x=>x.trim().replace(/^(?:ato de |e |ser |estar |ter )/, '')).filter(Boolean);
  return senses(first).some(term=>senses(second).some(other=>term===other || (Math.min(term.length,other.length)>3 && (term.startsWith(`${other} `)||other.startsWith(`${term} `)))));
}
export function vocabularyQuestion(word, entries, random = Math.random) {
  const candidates = entries.filter(x=>x.id!==word.id && !meaningsOverlap(word.meaning,x.meaning));
  const distinct = [...new Map(shuffle(candidates,random).map(x=>[x.meaning,x])).values()];
  const options=shuffle([word.meaning,...distinct.slice(0,3).map(x=>x.meaning)],random);
  return { id:`word-${word.id}`,kind:'choice',wordId:word.id,greek:word.lemma,audio:word.audio||null,prompt:'Qual é uma glossa deste vocábulo?',options,answer:options.indexOf(word.meaning),explanation:`${word.lemma}: ${word.meaning}. Classe: ${word.pos}. Uma glossa é uma pista de sentido; a tradução final depende do contexto.`,label:word.core300?'Núcleo dos 300':'Vocabulário',wordIds:[word.id] };
}
export function selectWords(entries, reviews, {limit=10, filter='all',level=null,day=localDate(),random=Math.random}={}) {
  let pool=entries.filter(word => (level===null || word.level===level) && (filter!=='core' || word.core300) && (filter!=='mastered' || isMastered(reviews[word.id])) && (filter!=='due' || isDue(reviews[word.id],day)) && (filter!=='new' || !reviews[word.id]));
  const due=shuffle(pool.filter(w=>isDue(reviews[w.id],day)),random);
  const fresh=shuffle(pool.filter(w=>!reviews[w.id]),random);
  const remaining=shuffle(pool.filter(w=>reviews[w.id]&&!isDue(reviews[w.id],day)),random);
  return [...due,...fresh,...remaining].slice(0,limit);
}
export function coverage(words, reviews, tokenCount) {
  if (!tokenCount) return 0;
  return words.filter(w=>isMastered(reviews[w.id])).reduce((sum,w)=>sum+w.frequency,0)/tokenCount*100;
}
export function validProgress(value) {
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const integer=(x,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
  const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
  if (!object(value)||value.version!==1||!object(value.vocab)||!object(value.lessons)||!object(value.levels)||!object(value.answers)||!integer(value.sessions))return false;
  if(!['morphology','syntax','vocabulary'].every(area=>integer(value.levels[area],3)))return false;
  if(!Object.values(value.lessons).every(x=>typeof x==='boolean'))return false;
  if(!Object.values(value.answers).every(x=>object(x)&&typeof x.correct==='boolean'&&date(x.day)&&integer(x.attempts)))return false;
  return Object.values(value.vocab).every(x=>object(x)&&Array.isArray(x.dates)&&x.dates.every(date)&&new Set(x.dates).size===x.dates.length&&integer(x.attempts)&&integer(x.correct,x.attempts)&&integer(x.box,5)&&date(x.nextReview)&&typeof x.mastered==='boolean'&&x.mastered===(x.dates.length>=3));
}
