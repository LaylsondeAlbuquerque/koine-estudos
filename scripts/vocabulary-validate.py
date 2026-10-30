"""Validate the authored vocabulary and, when present, its source token counts."""
from pathlib import Path
from collections import Counter
import importlib.util
import json
import sys
import unicodedata

sys.dont_write_bytecode=True

ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'data/vocabulary.json').read_text(encoding='utf-8'))
entries=data['entries']; meta=data['meta']
assert len(entries)==meta['entryCount']==1158
assert meta['bibliographicAudit']['normalizedHeadwordsChecked']==958
assert meta['bibliographicAudit']['representedInDataset']==958
assert meta['bibliographicAudit']['additionalIndependentCorpusLemmas']==len(entries)-958
assert isinstance(meta['bibliographicAudit']['publicNote'],str)
assert len({e['id'] for e in entries})==len(entries)
assert len({e['lemma'] for e in entries})==len(entries)
assert [e['rank'] for e in entries]==list(range(1,len(entries)+1))
assert sum(e['core300'] for e in entries)==300
assert sum(e['frequency'] for e in entries[:300])==meta['core300']['tokens']
assert entries==sorted(entries,key=lambda e:(-e['frequency'],e['lemma']))
for e in entries:
    assert e['meaning'].strip() and e['pos'].strip(),e
    assert e['lemma']==unicodedata.normalize('NFC',e['lemma']),e
    assert isinstance(e['frequency'],int) and e['frequency']>=0,e
    assert isinstance(e['level'],int) and 0<=e['level']<=3,e
    assert not any('LATIN' in unicodedata.name(c,'') for c in e['lemma']),e
    assert not any(c in e['meaning'] for c in ('�','□')),e
    assert not any(s in e['meaning'].lower() for s in ('placeholder','to be translated','meaning pending')),e
assert {e['lemma'] for e in entries if e['frequency']==0}==set(meta['bibliographicAudit']['didacticBasesWithoutCorpusOccurrence'])
cache=ROOT/'tmp/macula-vocabulary-source.json'
if cache.exists():
    source=json.loads(cache.read_text(encoding='utf-8'))
    spec=importlib.util.spec_from_file_location('vocabulary_build',ROOT/'scripts/vocabulary-build.py')
    builder=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    corrected,notes=builder.corrected_rows(source['rows'])
    counts=Counter(unicodedata.normalize('NFC',r['lemma']) for r in corrected)
    assert len(source['rows'])==meta['frequency']['tokens']
    assert len(corrected)==len(source['rows'])==137741
    assert notes==meta['frequency']['corrections']
    assert sum(note['tokens'] for note in notes)==meta['frequency']['correctedTokens']==105
    assert sum(counts.values())==meta['frequency']['tokens']
    assert {lemma:counts[lemma] for lemma in ['δέω','δεῖ','δέομαι','ῥέω','λέγω']}=={'δέω':43,'δεῖ':101,'δέομαι':22,'ῥέω':1,'λέγω':2352}
    assert all(e['frequency']==counts[e['lemma']] for e in entries)
    assert all(lemma in {e['lemma'] for e in entries} for lemma,count in counts.items() if count>=10)
    audit_path=ROOT/'tmp/vocabulary-porter-private-audit.json'
    if audit_path.exists():
        recovered={unicodedata.normalize('NFC',lemma) for lemma in json.loads(audit_path.read_text(encoding='utf-8'))['normalized']}
        assert len(recovered)==958
        assert recovered<={e['lemma'] for e in entries}
        assert len({e['lemma'] for e in entries}-recovered)==200
        print('All 958 privately recovered headwords remain represented; 200 independent additions.')
    print('Corrected source counts, 105 token corrections and all frequency>=10 headwords verified.')
print(f'{len(entries)} entries verified; core 300 covers {meta["coverage300"]}% of {meta["frequency"]["tokens"]} tokens.')
