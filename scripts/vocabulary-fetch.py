"""Fetch a pinned, open MACULA corpus into excluded tmp/ for vocabulary QA.

Only lemma, POS, reference, morphology and normalized token form are retained
in excluded tmp/ to reproduce documented homograph corrections. Glosses,
MARBLE domains and syntax are not copied. Run with Python 3; internet access
is needed on the first run. No running corpus is included in the public JSON.
"""
from pathlib import Path
import csv
import hashlib
import io
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / 'tmp'
TMP.mkdir(exist_ok=True)

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Koine-learning-content-build'})
    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read()

commit = '8423afe47b9e8f24b7772e808af45c7159a6fe7e'
expected_sha256 = '7f71504fdee8659bdd9f85342e4103d645864c2851b8205915bb298f0c004cc5'
url = f'https://raw.githubusercontent.com/Clear-Bible/macula-greek/{commit}/SBLGNT/tsv/macula-greek-SBLGNT.tsv'
blob = fetch(url)
if hashlib.sha256(blob).hexdigest() != expected_sha256:
    raise ValueError('Source checksum mismatch; do not rebuild with unreviewed data.')
rows = list(csv.DictReader(io.StringIO(blob.decode('utf-8-sig')), delimiter='\t'))
print('columns:', ', '.join(rows[0]))
safe = [{'lemma': row['lemma'], 'pos': row['class'], 'ref': row['ref'],
         'form': row['normalized'], 'morph': row['morph']} for row in rows]
payload = {'source': url, 'commit': commit, 'sha256': hashlib.sha256(blob).hexdigest(), 'rows': safe}
(TMP / 'macula-vocabulary-source.json').write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
print(f'Saved {len(safe)} word tokens; commit {commit}; raw sha256 {payload["sha256"]}')
