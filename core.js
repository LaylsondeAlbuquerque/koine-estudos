export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ς/g, 'σ');
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function shufflePairOrder(count, random = Math.random) {
  if (!Number.isInteger(count) || count < 0) throw new RangeError('Pair count must be a non-negative integer.');
  const order = Array.from({length: count}, (_, index) => index);
  // Sattolo's shuffle forms one cycle: for two or more pairs, no answer can
  // remain beside its matching item. It always takes count - 1 draws, even
  // with a constant random source; no rejection loop or retry is needed.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
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
  if (!correct) { entry.dates=[]; entry.box=0; entry.nextReview=addDays(day,1); entry.mastered=false; if(entry.manualState==='learned')entry.manualState='review'; return entry; }
  entry.correct++;
  if (!entry.dates.includes(day)) { entry.dates=[...entry.dates,day]; entry.box=Math.min(entry.box+1,5); }
  entry.mastered=entry.dates.length>=3;
  entry.nextReview=addDays(day,[1,1,3,7,14,30][entry.box]);
  return entry;
}
export const isMastered = review => review?.manualState==='learned' || (review?.manualState!=='review' && Boolean(review?.mastered && new Set(review?.dates||[]).size>=3));
export const isDue = (review, day = localDate()) => review?.manualState==='review' || (review?.manualState!=='learned' && Boolean(review && review.nextReview <= day));
export function matchesWordState(review, state='all') {
  if(state==='all')return true;
  if(state==='marked')return review?.manualState==='review';
  if(state==='mastered')return isMastered(review);
  if(state==='unlearned')return !isMastered(review);
  return false;
}
const senseCache = new Map();
function meaningSenses(value) {
  const key=String(value ?? '');
  if(senseCache.has(key))return senseCache.get(key);
  const senses=normalize(key).replace(/\([^)]*\)/g,'').split(/[;,/]/).map(x=>x.trim().replace(/^(?:ato de |e |ser |estar |ter )/, '')).filter(Boolean);
  // Keep the cache bounded if the repertoire is replaced during a long session.
  if(senseCache.size>=4096)senseCache.clear();
  senseCache.set(key,senses);
  return senses;
}
export function meaningsOverlap(first, second) {
  const otherSenses=meaningSenses(second);
  return meaningSenses(first).some(term=>otherSenses.some(other=>term===other || (Math.min(term.length,other.length)>3 && (term.startsWith(`${other} `)||other.startsWith(`${term} `)))));
}
export function vocabularyQuestion(word, entries, random = Math.random, reverse = false) {
  // Draw without replacement until three valid alternatives are found. A card
  // normally inspects only a few words instead of parsing the entire repertoire.
  const candidates=[...entries],distractors=[],labels=new Set();
  while(candidates.length&&distractors.length<3){
    const index=Math.floor(random()*candidates.length),candidate=candidates[index];
    candidates[index]=candidates[candidates.length-1];candidates.pop();
    const label=reverse?candidate.lemma:candidate.meaning;
    if(candidate.id===word.id||(reverse&&candidate.lemma===word.lemma)||labels.has(label)||meaningsOverlap(word.meaning,candidate.meaning))continue;
    labels.add(label);distractors.push(candidate);
  }
  const correct=reverse?word.lemma:word.meaning;
  const options=shuffle([correct,...distractors.slice(0,3).map(x=>reverse?x.lemma:x.meaning)],random);
  return { id:`${reverse?'reverse':'word'}-${word.id}`,kind:'choice',wordId:word.id,greek:reverse?null:word.lemma,stimulus:reverse?word.meaning:null,optionsLang:reverse?'grc':null,audio:word.audio||null,prompt:reverse?'Qual palavra grega corresponde ao sentido apresentado em português?':'Qual alternativa apresenta um sentido em português para esta palavra grega?',options,answer:options.indexOf(correct),explanation:`${word.lemma}: ${word.meaning}. Classe: ${word.pos}. Estes são sentidos de referência para memorizar; a tradução de uma passagem depende do contexto.`,label:word.core300?'Núcleo dos 300':'Vocabulário',wordIds:[word.id] };
}
export function selectWords(entries, reviews, {limit=10, filter='all',state='all',level=null,day=localDate(),random=Math.random,recent=[]}={}) {
  const frequencyGroup=/^top-(10|50|100|200|300)$/.exec(filter);
  const maxRank=frequencyGroup?Number(frequencyGroup[1]):null;
  const pool=entries.filter(word => (level===null || word.level===level) && (maxRank===null || (Number.isInteger(word.rank)&&word.rank>0&&word.rank<=maxRank)) && (filter!=='core' || word.core300) && matchesWordState(reviews[word.id],state) && (!['mastered','marked','unlearned'].includes(filter) || matchesWordState(reviews[word.id],filter)) && (filter!=='due' || isDue(reviews[word.id],day)) && (filter!=='new' || !reviews[word.id] || reviews[word.id].attempts===0));
  const due=shuffle(pool.filter(w=>isDue(reviews[w.id],day)),random);
  const fresh=shuffle(pool.filter(w=>!isDue(reviews[w.id],day)&&!isMastered(reviews[w.id])&&(!reviews[w.id]||reviews[w.id].attempts===0)),random);
  const remaining=shuffle(pool.filter(w=>reviews[w.id]&&!isDue(reviews[w.id],day)&&(reviews[w.id].attempts!==0||isMastered(reviews[w.id]))),random);
  const seen=new Set(recent),byRecency=group=>[...group.filter(w=>!seen.has(w.id)),...group.filter(w=>seen.has(w.id))];
  return [...byRecency(due),...byRecency(fresh),...byRecency(remaining)].slice(0,limit);
}
// Prefer unseen material, then older reviews; alternate lessons and activities.
export function selectStudyQuestions(questions, answers={}, {limit=10,recent=[],random=Math.random}={}) {
  const seen=new Map(recent.map((id,i)=>[id,i]));
  const unique=[...new Map(questions.map(q=>[q.id,q])).values()];
  const pool=shuffle(unique,random),selected=[];
  const rank=q=>seen.has(q.id)?3:!answers[q.id]?0:answers[q.id].correct?2:1;
  while(pool.length&&selected.length<limit){
    const previous=selected.at(-1),penultimate=selected.at(-2);
    const score=q=>rank(q)*100000+(seen.has(q.id)?seen.get(q.id)*4:0)+(q.lessonId&&q.lessonId===previous?.lessonId?400:0)+(q.lessonId&&q.lessonId===penultimate?.lessonId?100:0)+(q.kind===previous?.kind?50:0);
    let best=0;for(let i=1;i<pool.length;i++)if(score(pool[i])<score(pool[best]))best=i;
    selected.push(pool.splice(best,1)[0]);
  }
  return selected;
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
  if(value.articles!==undefined&&(!object(value.articles)||!Object.values(value.articles).every(x=>typeof x==='boolean')))return false;
  if(value.recentQuestions!==undefined&&(!Array.isArray(value.recentQuestions)||value.recentQuestions.length>200||!value.recentQuestions.every(id=>typeof id==='string'&&id.length<=500)))return false;
  if(value.recentWords!==undefined&&(!Array.isArray(value.recentWords)||value.recentWords.length>200||!value.recentWords.every(id=>typeof id==='string'&&id.length<=500)))return false;
  if(!['morphology','syntax','vocabulary'].every(area=>integer(value.levels[area],3)))return false;
  if(value.levels.semantics!==undefined&&!integer(value.levels.semantics,3))return false;
  if(!Object.values(value.lessons).every(x=>typeof x==='boolean'))return false;
  if(!Object.values(value.answers).every(x=>object(x)&&typeof x.correct==='boolean'&&date(x.day)&&integer(x.attempts)))return false;
  return Object.values(value.vocab).every(x=>object(x)&&(x.manualState===undefined||['review','learned'].includes(x.manualState))&&Array.isArray(x.dates)&&x.dates.every(date)&&new Set(x.dates).size===x.dates.length&&integer(x.attempts)&&integer(x.correct,x.attempts)&&x.correct>=x.dates.length&&integer(x.box,5)&&x.box<=x.dates.length&&date(x.nextReview)&&typeof x.mastered==='boolean'&&x.mastered===(x.dates.length>=3));
}
