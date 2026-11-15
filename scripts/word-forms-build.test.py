import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('forms', ROOT / 'scripts/word-forms-build.py')
forms = importlib.util.module_from_spec(spec)
spec.loader.exec_module(forms)

class WordFormsTests(unittest.TestCase):
    def test_neuter_alternatives_do_not_invent_vocative_articles(self):
        noun = ['noun', '', 'singular', 'neuter', 'accusative', '', '', '', '']
        self.assertEqual({a[4] for a in forms.possible_analyses(noun)}, {'nominative','accusative','vocative'})
        article = ['det', '', 'singular', 'neuter', 'nominative', '', '', '', '']
        self.assertEqual({a[4] for a in forms.possible_analyses(article)}, {'nominative','accusative'})
        masculine = ['noun', '', 'singular', 'masculine', 'accusative', '', '', '', '']
        self.assertEqual(forms.possible_analyses(masculine), [masculine])

    def test_all_generated_lemmas_and_occurrence_totals_match_the_repertoire(self):
        words = json.loads((ROOT / 'data/vocabulary.json').read_text(encoding='utf8'))['entries']
        entries = {}
        for index in range(64):
            chunk = json.loads((ROOT / f'data/word-forms/{index}.json').read_text(encoding='utf8'))
            self.assertEqual(chunk['maculaSha256'], forms.reading.PIN)
            for word_id, entry in chunk['words'].items():
                self.assertNotIn(word_id, entries)
                self.assertEqual(forms.bucket(word_id), index)
                entries[word_id] = entry
                for form in entry['forms']:
                    self.assertTrue(form['spellings'])
                    self.assertEqual(sum(a['count'] for a in form['analyses']), form['count'])
                    self.assertEqual(len({tuple(a['features']) for a in form['analyses']}),len(form['analyses']))
        self.assertEqual(set(entries), {w['id'] for w in words})
        for word in words:
            entry = entries[word['id']]
            self.assertEqual(entry['lemma'], word['lemma'])
            self.assertEqual(sum(f['count'] for f in entry['forms']), word['frequency'])
        gift = next(entries[w['id']] for w in words if w['lemma']=='δῶρον')
        singular = next(f for f in gift['forms'] if 'δῶρον' in f['spellings'])
        self.assertEqual({a['features'][4] for a in singular['analyses']}, {'nominative','accusative','vocative'})

if __name__ == '__main__':
    unittest.main()
