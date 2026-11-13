"""Prepare Portuguese draft glosses for all missing MACULA lemmas.

Network is used only with --translate. Published builds use the checked-in
gloss file, never a translation service. Existing authored glosses are preserved.
"""
import collections
import csv
import hashlib
import importlib.util
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'tmp/vocabulary-expansion'
N=lambda s:unicodedata.normalize('NFC',s)

def prepare():
    spec=importlib.util.spec_from_file_location('builder',ROOT/'scripts/vocabulary-build.py')
    builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
    source=json.loads((ROOT/'tmp/macula-vocabulary-source.json').read_text(encoding='utf-8'))
    corrected,_=builder.corrected_rows(source['rows'])
    vocabulary=json.loads((ROOT/'data/vocabulary.json').read_text(encoding='utf-8'))
    existing={N(e['lemma']) for e in vocabulary['entries'] if not e.get('glossStatus')}
    rows=collections.defaultdict(list)
    with (ROOT/'fontes-locais/macula-greek/SBLGNT/tsv/macula-greek-SBLGNT.tsv').open(encoding='utf-8',newline='') as stream:
        original=list(csv.DictReader(stream,delimiter='\t'))
    if len(original)!=len(corrected):raise ValueError('Corpus lengths differ')
    for row,corr in zip(original,corrected):rows[N(corr['lemma'])].append(row)
    with (TMP/'dodson.csv').open(encoding='utf-8',newline='') as stream:
        dodson={str(int(row["Strong's"])):row['English Definition (brief)'] for row in csv.DictReader(stream,delimiter='\t')}
    pending={}
    for lemma,tokens in sorted(rows.items()):
        if lemma in existing:continue
        strong=collections.Counter(t['strong'] for t in tokens).most_common(1)[0][0]
        english=dodson.get(strong)
        origin='Dodson'
        if not english:
            english=collections.Counter(t['english'] for t in tokens if t['english'].strip()).most_common(1)[0][0]
            origin='Cherith / MACULA'
        pending[lemma]={'english':english,'source':origin,'strong':strong}
    return pending

def main():
    TMP.mkdir(parents=True,exist_ok=True)
    pending=prepare()
    cache=TMP/'translations.json'
    translated=json.loads(cache.read_text(encoding='utf-8')) if cache.exists() else {}
    english=sorted({v['english'] for v in pending.values()}-set(translated))
    if '--translate' in sys.argv:
        batches=[];batch=[];length=0
        for value in english:
            if length+len(value)>2400 or len(batch)>=40:
                batches.append(batch);batch=[];length=0
            batch.append(value);length+=len(value)+8
        if batch:batches.append(batch)
        for b,values in enumerate(batches):
            text='\n'.join(f'{i+1}. {v}' for i,v in enumerate(values))
            url='https://translate.googleapis.com/translate_a/single?'+urllib.parse.urlencode({'client':'gtx','sl':'en','tl':'pt','dt':'t','q':text})
            for attempt in range(4):
                try:
                    result=json.load(urllib.request.urlopen(url,timeout=45))
                    output=''.join(s[0] for s in result[0] if s[0])
                    parts=re.split(r'(?:^|\n)\s*(\d+)\.\s*',output)
                    mapped={int(parts[i]):parts[i+1].strip() for i in range(1,len(parts),2)}
                    if set(mapped)!=set(range(1,len(values)+1)):raise ValueError('Translation lost item boundaries')
                    for i,value in enumerate(values):
                        if not mapped[i+1]:raise ValueError('Empty translation')
                        translated[value]=mapped[i+1]
                    cache.write_text(json.dumps(translated,ensure_ascii=False,indent=2),encoding='utf-8')
                    print(f'Batch {b+1}/{len(batches)}; {len(translated)} glosses cached',flush=True)
                    break
                except Exception:
                    if attempt==3:
                        # Never guess alignment when translation merges numbered lines.
                        # Translate each short gloss independently instead.
                        for value in values:
                            single='https://translate.googleapis.com/translate_a/single?'+urllib.parse.urlencode({'client':'gtx','sl':'en','tl':'pt','dt':'t','q':value})
                            result=json.load(urllib.request.urlopen(single,timeout=45))
                            gloss=''.join(s[0] for s in result[0] if s[0]).strip()
                            if not gloss:raise ValueError('Empty single-gloss translation')
                            translated[value]=gloss
                            cache.write_text(json.dumps(translated,ensure_ascii=False,indent=2),encoding='utf-8')
                        print(f'Batch {b+1}/{len(batches)} translated individually',flush=True)
                        break
                    time.sleep(2**attempt)
    missing={v['english'] for v in pending.values()}-set(translated)
    if missing:raise ValueError(f'{len(missing)} untranslated glosses; use --translate')
    glosses={lemma:translated[v['english']] for lemma,v in pending.items()}
    (ROOT/'scripts/vocabulary-glosses-full.json').write_text(json.dumps(glosses,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    provenance={'source':json.loads((TMP/'source.json').read_text()),'dodsonSha256':hashlib.sha256((TMP/'dodson.csv').read_bytes()).hexdigest(),
        'method':'Brief Dodson glosses by modal MACULA Strong; fallback to modal Cherith English gloss by corrected lemma. English-to-Portuguese automatic translation followed by bounded corrections. New glosses are drafts requiring lexical review.',
        'entries':pending}
    (ROOT/'scripts/vocabulary-expansion-sources.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'{len(glosses)} new lemma glosses prepared.')

if __name__=='__main__':main()
