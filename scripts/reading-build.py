"""Generate licensed reading assets from local sources; never fetch or infer text.

Run from the project root: python scripts/reading-build.py
Inputs can be overridden with --text-dir, --tsv and --vocab.
"""
import argparse
import collections
import csv
import gzip
import hashlib
import json
import re
import time
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS = list(zip(
    'Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split(),
    'MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(),
    ['Mateus','Marcos','Lucas','João','Atos','Romanos','1 Coríntios','2 Coríntios','Gálatas','Efésios','Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses','1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus','Tiago','1 Pedro','2 Pedro','1 João','2 João','3 João','Judas','Apocalipse']))
PIN = '7f71504fdee8659bdd9f85342e4103d645864c2851b8205915bb298f0c004cc5'
ACCENTS = {'\u0300', '\u0301', '\u0342'}
# Surface spelling only: NEVER use this key for dictionary lemmas or progress IDs.
# Breathing, diaeresis and iota subscript remain significant.
def surface_key(value):
    return ''.join(c for c in unicodedata.normalize('NFD', core(value)).lower()
                   if c not in ACCENTS).replace('ς', 'σ')

def same_surface(source, row):
    if surface_key(source) == surface_key(row['text']):
        return True
    # Documented variant of Moses, accepted only at the reviewed occurrence.
    return (row['ref'] == 'JHN 8:5!5' and nfc(source) == 'Μωσῆς'
            and core(row['text']) == 'Μωϋσῆς' and nfc(row['lemma']) == 'Μωϋσῆς')

DISPLAY_CORRECTIONS = {
    ('JHN', 8, 9, 2): ('δέ', 'δὲ', 'Conjunction before an accented word; Smyth 154.'),
    ('JHN', 10, 29, 8): ('μεῖζων', 'μείζων', 'Long ultima -ων requires acute on accented penult; Porter, alphabet/accent notes; Smyth 164, 166.')
}

def display_text(text, book, chapter, verse, changes):
    position = 0
    def replace(match):
        nonlocal position
        token = match[0]
        word = core(token)
        if not word:
            return token
        position += 1
        rule = DISPLAY_CORRECTIONS.get((book, chapter, verse, position))
        if rule:
            before, after, reason = rule
            if nfc(word) != before:
                raise ValueError(f'Display correction input changed: {book} {chapter}:{verse}!{position}')
            changes.append({'ref': f'{book} {chapter}:{verse}!{position}', 'from': before, 'to': after, 'reason': reason})
            return token.replace(word, after, 1)
        return token
    return re.sub(r'\S+', replace, text)

def nfc(value):
    return unicodedata.normalize('NFC', value)

def core(value):
    # Edge punctuation and elision signs do not constitute lexical tokens.
    value = nfc(value)
    while value and (unicodedata.category(value[0])[0] in 'PS' or value[0] in "ʼ’'"):
        value = value[1:]
    while value and (unicodedata.category(value[-1])[0] in 'PS' or value[-1] in "ʼ’'"):
        value = value[:-1]
    return value

def clean(text):
    # Keep editorial brackets in the display; strip only apparatus markers/digits.
    return ''.join(c for c in text if c not in '⸀⸁⸂⸃⸄⸅' and not c.isdigit()).strip()

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def generate(text_dir, tsv, vocab_path, out, audit):
    started = time.perf_counter()
    vocab = json.loads(vocab_path.read_text(encoding='utf-8'))
    if digest(tsv) != PIN or vocab['meta']['frequency']['sourceSha256'] != PIN:
        raise ValueError('MACULA checksum differs from the reviewed vocabulary source.')
    words = vocab['entries']
    lookup = {nfc(w['lemma']): w['id'] for w in words}
    if len(lookup) != len(words) or len({w['id'] for w in words}) != len(words):
        raise ValueError('Duplicate vocabulary lemma or ID.')
    corrections = {(nfc(c['from']), nfc(f).casefold()): nfc(c['to'])
                   for c in vocab['meta']['frequency']['corrections'] for f in c['forms']}
    corpus = collections.defaultdict(list)
    xmlids = set()
    with tsv.open(encoding='utf-8-sig', newline='') as stream:
        for row in csv.DictReader(stream, delimiter='\t'):
            match = re.fullmatch(r'(\w+) (\d+):(\d+)!(\d+)', row['ref'])
            if not match or row['xml:id'] in xmlids or not row['lemma']:
                raise ValueError('Invalid reference, duplicate ID or missing lemma.')
            xmlids.add(row['xml:id'])
            book, chapter, verse, position = match.groups()
            corpus[(book, int(chapter), int(verse))].append((int(position), row))
    out.mkdir(parents=True, exist_ok=True)
    audit.mkdir(parents=True, exist_ok=True)
    index = {'version': 1, 'meta': {'edition': 'SBLGNT', 'license': 'CC BY 4.0',
        'maculaSha256': PIN, 'vocabularySha256': digest(vocab_path),
        'policy': 'positional surface alignment ignores case and accent; lemma keys remain exact NFC; reviewed Moses variant; two documented display corrections; proper names exempt; aliases excluded'}, 'books': []}
    issues, samples, totals, input_hashes = [], [], collections.Counter({'alignmentExcluded': 0, 'vocabularyExcluded': 0}), {}
    accepted_variants, display_changes = [], []
    seen = set()
    external = collections.Counter()
    book_vocabulary = []
    for filename, code, name in BOOKS:
        path = text_dir / (filename + '.txt')
        input_hashes[path.name] = digest(path)
        verses, texts = [], []
        book_counts, first_seen, token_position = collections.Counter(), {}, 0
        previous = (0, 0)
        for line in path.read_text(encoding='utf-8-sig').splitlines()[1:]:
            if not line.strip():
                continue
            match = re.fullmatch(r'(\S+) (\d+):(\d+)\t(.*)', line)
            if not match or match[1] != filename:
                raise ValueError(f'Unexpected SBLGNT line in {path.name}')
            chapter, verse = int(match[2]), int(match[3])
            if (chapter, verse) <= previous:
                raise ValueError(f'Duplicate or unordered verse in {path.name}')
            previous = chapter, verse
            key = code, chapter, verse
            seen.add(key)
            text = clean(match[4])
            forms = [core(t) for t in text.split() if core(t)]
            rows = sorted(corpus.get(key, []), key=lambda t: t[0])
            aligned = bool(forms) and len(forms) == len(rows) and all(
                pos == i + 1 and same_surface(forms[i], row) for i, (pos, row) in enumerate(rows))
            if aligned:
                for i, (_, row) in enumerate(rows):
                    if core(row['text']) != forms[i]:
                        accepted_variants.append({'ref': row['ref'], 'sblgnt': forms[i], 'macula': core(row['text']), 'lemma': row['lemma']})
            text = display_text(text, code, chapter, verse, display_changes)
            deps, unknown, proper = set(), set(), 0
            for _, row in rows:
                token_position += 1
                lemma = corrections.get((nfc(row['lemma']), nfc(row['text']).casefold()), nfc(row['lemma']))
                if lemma in lookup:
                    word_id = lookup[lemma]
                    book_counts[word_id] += 1
                    first_seen.setdefault(word_id, token_position)
                if row['class'] in ('noun', 'adj') and row['type'] == 'proper':
                    proper += 1
                    continue
                if lemma in lookup:
                    deps.add(lookup[lemma])
                else:
                    unknown.add('lemma:' + lemma)
                    external[lemma] += 1
            reason = 'alignment' if not aligned else 'vocabulary' if unknown else ''
            verses.append({'chapter': chapter, 'verse': verse, 'tokens': len(forms), 'requires': sorted(deps),
                           'external': sorted(unknown), 'aligned': aligned})
            texts.append({'chapter': chapter, 'verse': verse, 'text': text})
            totals['verses'] += 1
            totals['tokens'] += len(forms)
            totals['aligned' if aligned else 'alignmentExcluded'] += 1
            totals['potentiallyReadable'] += int(not reason)
            totals['vocabularyExcluded'] += int(aligned and bool(unknown))
            if reason:
                issues.append({'ref': f'{code} {chapter}:{verse}', 'reason': reason, 'external': sorted(unknown)})
            if len(samples) < 27:
                samples.append({'ref': f'{code} {chapter}:{verse}', 'sblgnt': forms[:8],
                                'macula': [core(r['text']) for _, r in rows[:8]], 'aligned': aligned})
            per_book_first = verse == 1 and chapter == 1
            if per_book_first and not any(s['ref'] == f'{code} 1:1' for s in samples):
                samples.append({'ref': f'{code} 1:1', 'sblgnt': forms[:8],
                               'macula': [core(r['text']) for _, r in rows[:8]], 'aligned': aligned})
        index['books'].append({'id': code, 'name': name, 'verses': verses})
        book_vocabulary.append({'id': code, 'name': name, 'words': [
            {'id': word_id, 'frequency': book_counts[word_id], 'first': first_seen[word_id]}
            for word_id in sorted(book_counts, key=first_seen.get)]})
        (out / f'{code}.json').write_text(json.dumps({'version': 1, 'id': code, 'verses': texts}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    if seen != set(corpus):
        raise ValueError('References differ between sources.')
    index['meta']['totals'] = dict(totals)
    index['meta']['displayCorrections'] = display_changes
    (out / 'index.json').write_text(json.dumps(index, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (out / 'vocabulary-books.json').write_text(json.dumps({'version': 1, 'maculaSha256': PIN, 'books': book_vocabulary}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    report = {'totals': dict(totals), 'seconds': round(time.perf_counter() - started, 3),
              'textSha256': input_hashes, 'vocabularySha256': digest(vocab_path),
              'issues': issues, 'acceptedVariants': accepted_variants, 'displayCorrections': display_changes,
              'externalLemmaFrequency': dict(external), 'samples': samples,
              'bytes': sum(p.stat().st_size for p in out.glob('*.json')),
              'indexGzipBytes': len(gzip.compress((out / 'index.json').read_bytes()))}
    (audit / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k not in ('issues', 'samples', 'acceptedVariants', 'displayCorrections', 'externalLemmaFrequency', 'textSha256')}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(__doc__)
    parser.add_argument('--text-dir', type=Path, default=ROOT / 'fontes-locais/sblgnt/sblgnt-text-fonte/data/sblgnt/text')
    parser.add_argument('--tsv', type=Path, default=ROOT / 'fontes-locais/macula-greek/SBLGNT/tsv/macula-greek-SBLGNT.tsv')
    parser.add_argument('--vocab', type=Path, default=ROOT / 'data/vocabulary.json')
    parser.add_argument('--out', type=Path, default=ROOT / 'data/reading')
    parser.add_argument('--audit', type=Path, default=ROOT / 'tmp/reading-audit')
    args = parser.parse_args()
    generate(args.text_dir, args.tsv, args.vocab, args.out, args.audit)
