"""Build small on-demand lemma form indexes from the reviewed local MACULA TSV."""
import collections
import csv
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('reading_build', ROOT / 'scripts/reading-build.py')
reading = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reading)
FIELDS = ['class', 'person', 'number', 'gender', 'case', 'tense', 'voice', 'mood', 'degree']

def bucket(word_id):
    assert word_id.isascii()
    return sum(map(ord, word_id)) % 64

def possible_analyses(analysis):
    """Only add certain neuter syncretism, never guess a whole paradigm."""
    result = [analysis]
    if analysis[3] == 'neuter' and analysis[4] in ('nominative', 'accusative', 'vocative'):
        cases = ['nominative', 'accusative']
        if analysis[0] in ('noun', 'adj'):
            cases.append('vocative')
        for case in cases:
            other = list(analysis)
            other[4] = case
            if other not in result:
                result.append(other)
    return result

def generate():
    vocab = json.loads((ROOT / 'data/vocabulary.json').read_text(encoding='utf-8'))
    tsv = ROOT / 'fontes-locais/macula-greek/SBLGNT/tsv/macula-greek-SBLGNT.tsv'
    if reading.digest(tsv) != reading.PIN:
        raise ValueError('Unreviewed MACULA source.')
    lookup = {reading.nfc(w['lemma']): w for w in vocab['entries']}
    corrections = {(reading.nfc(c['from']), reading.nfc(f).casefold()): reading.nfc(c['to'])
                   for c in vocab['meta']['frequency']['corrections'] for f in c['forms']}
    words = {}
    count = 0
    with tsv.open(encoding='utf-8-sig', newline='') as stream:
        for row in csv.DictReader(stream, delimiter='\t'):
            lemma = corrections.get((reading.nfc(row['lemma']), reading.nfc(row['text']).casefold()), reading.nfc(row['lemma']))
            if lemma not in lookup:
                raise ValueError('Unmapped lemma: ' + lemma)
            word = lookup[lemma]
            entry = words.setdefault(word['id'], {'lemma': word['lemma'], 'forms': {}})
            surface = reading.core(row['text'])
            form = entry['forms'].setdefault(reading.surface_key(surface), {'spellings': [], 'count': 0, 'analyses': {}})
            if surface not in form['spellings']:
                form['spellings'].append(surface)
            form['count'] += 1
            analysis = tuple(row[field] for field in FIELDS)
            data = form['analyses'].setdefault(analysis, {'features': list(analysis), 'count': 0})
            data['count'] += 1
            count += 1
    chunks = [dict() for _ in range(64)]
    for word_id, entry in words.items():
        forms = []
        for form in entry['forms'].values():
            analyses = form['analyses']
            for analysis in list(analyses):
                for possible in possible_analyses(list(analysis)):
                    analyses.setdefault(tuple(possible), {'features': possible, 'count': 0})
            form['analyses'] = list(analyses.values())
            forms.append(form)
        entry['forms'] = sorted(forms, key=lambda f: -f['count'])
        chunks[bucket(word_id)][word_id] = entry
        if sum(f['count'] for f in forms) != lookup[entry['lemma']]['frequency']:
            raise ValueError('Frequency mismatch: ' + entry['lemma'])
    for word in vocab['entries']:
        if word['id'] not in words:
            if word['frequency'] != 0:
                raise ValueError('Missing vocabulary entry: ' + word['id'])
            words[word['id']] = {'lemma': word['lemma'], 'forms': []}
            chunks[bucket(word['id'])][word['id']] = words[word['id']]
    out = ROOT / 'data/word-forms'
    out.mkdir(exist_ok=True)
    for index, entries in enumerate(chunks):
        (out / f'{index}.json').write_text(json.dumps({'version': 1, 'maculaSha256': reading.PIN, 'words': entries}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(words)} lemmas, {count} occurrences, 64 chunks; {sum(p.stat().st_size for p in out.glob("*.json"))} bytes.')

if __name__ == '__main__':
    generate()
