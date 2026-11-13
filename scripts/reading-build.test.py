"""Regression checks for accent tolerance without merging lexical identities."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('reading', Path(__file__).with_name('reading-build.py'))
reading = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reading)

class ReadingAlignmentTest(unittest.TestCase):
    def test_surface_case_and_accents(self):
        for left, right in [('Καὶ','καί'), ('Ἰδὼν','ἰδὼν'), ('εὑρήσετε','εὑρήσετέ'), ('θέλοντες','θέλοντές'), ('ἐστίν','ἐστιν')]:
            self.assertEqual(reading.surface_key(left), reading.surface_key(right))
        for left, right in [('ὁ','ὀ'), ('ὅς','ὄς'), ('Μωσῆς','Μωϋσῆς'), ('ᾧ','ὧ'), ('ἀπολέγω','λέγω')]:
            self.assertNotEqual(reading.surface_key(left), reading.surface_key(right))

    def test_lemma_and_progress_keys_remain_accent_sensitive(self):
        self.assertNotEqual(reading.nfc('τίς'), reading.nfc('τις'))
        self.assertNotEqual(reading.nfc('ἄρα'), reading.nfc('ἆρα'))
        self.assertNotEqual(reading.nfc('εἰμί'), reading.nfc('εἶμι'))

    def test_moses_is_a_scoped_variant(self):
        row={'ref':'JHN 8:5!5', 'text':'Μωϋσῆς', 'lemma':'Μωϋσῆς'}
        self.assertTrue(reading.same_surface('Μωσῆς',row))
        self.assertFalse(reading.same_surface('Μωσῆς',{**row,'ref':'JHN 8:5!6'}))
        self.assertFalse(reading.same_surface('Μωσῆς',{**row,'lemma':'λόγος'}))

    def test_correct_double_accents_are_preserved(self):
        changes=[]
        text='ζητήσετέ με καὶ οὐχ εὑρήσετε,'
        self.assertEqual(reading.display_text(text,'JHN',7,34,changes),text)
        self.assertEqual(changes,[])

    def test_display_corrections_check_the_original(self):
        changes=[]
        self.assertEqual(reading.display_text('οἱ δέ ἀκούσαντες','JHN',8,9,changes),'οἱ δὲ ἀκούσαντες')
        self.assertEqual(len(changes),1)
        with self.assertRaises(ValueError):reading.display_text('οἱ καὶ ἀκούσαντες','JHN',8,9,[])

if __name__=='__main__':unittest.main()
