"""Reproduce vocabulary.json from the excluded MACULA cache and original glosses.

MACULA morphology: CC BY 4.0 (Biblica/Clear Bible); SBLGNT text: CC BY 4.0.
The public output contains headwords and counts, not the running biblical text.
Run vocabulary-fetch.py first, then this file. The private bibliography audit is
optional and is never needed to reproduce the independently defined selection.
"""
from pathlib import Path
from collections import Counter, defaultdict
import hashlib
import json
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / 'tmp'
N = lambda text: unicodedata.normalize('NFC', text)
# Additional basic words support Greek word formation, small numerals and
# common classroom contrasts. This is an independently maintained word list,
# not the book's chapter sequence, translations, exercises or layout.
SUPPLEMENT = '''ὀκτώ λείπω ἡμέτερος θνῄσκω δηλόω ἐπιγράφω ταχύς ὕστερος τρέφω περιδέω ἀναγκαῖος κενόω θεμελιόω ἀγγέλλω νεανίας Σιλᾶς Σολομών τάσσω ἐννέα ταχύ φιμόω ἄχρις ἕνεκα συντίθεμαι ἀμφί βαίνω εἶμι ἵημι ἡδύς τρέπω'''.split()
ZERO_POS = {'ἀμφί':'prep','βαίνω':'verb','εἶμι':'verb','ἵημι':'verb','ἡδύς':'adj','τρέπω':'verb'}
POS = {'noun':'substantivo','verb':'verbo','det':'artigo / determinante','conj':'conjunção','pron':'pronome','prep':'preposição','adj':'adjetivo','adv':'advérbio','ptcl':'partícula','num':'numeral','intj':'interjeição'}
# Pedagogical lexical classes distinguish substantivized adjectives and numbers
# from the machine tag used by the corpus. The original tag is retained below.
POS_OVERRIDES = {'ἱερόν':'substantivo','πετεινόν':'substantivo','χήρα':'substantivo','συνεργός':'adjetivo / substantivo','φίλος':'adjetivo / substantivo','ἀνά':'preposição / advérbio','εἷς':'numeral','δύο':'numeral','τρεῖς':'numeral','τέσσαρες':'numeral','χίλιοι':'numeral'}
ALIASES = {'ἀφίσταμαι':['ἀφίστημι'],'ἐλεάω':['ἐλεέω'],'ἔξεστι(ν)':['ἔξεστι'],'ἐπικαλέω':['ἐπικαλέομαι'],'κολλάομαι':['κολλάω'],'ὀμνύω':['ὄμνυμι'],'οὕτω(ς)':['οὕτως','οὕτω'],'ὀψία':['ὄψιος'],'συντίθεμαι':['συντίθημι'],'ἄχρι':['ἄχρι(ς)'],'μέχρι(ς)':['μέχρι','μέχρις'],'ἐκ':['ἐξ'],'ἐκχέω':['ἐκχύννω'],'δείκνυμι':['δεικνύω'],'ἐγώ':['ἡμεῖς (plural)'],'σύ':['ὑμεῖς (plural)'],'πολύς':['πλείων (comparativo)','πλέων (comparativo)','πλεῖστος (superlativo)'],'ἀγαθός':['ἀμείνων (comparativo)','ἄριστος (superlativo)','κρείττων (comparativo)','κρείσσων (comparativo)','κράτιστος (superlativo)'],'κακός':['κακίων (comparativo)','κάκιστος (superlativo)','χείρων (comparativo)','χείριστος (superlativo)'],'καλός':['καλλίων (comparativo)','κάλλιστος (superlativo)'],'μέγας':['μείζων (comparativo)','μέγιστος (superlativo)'],'μικρός':['μικρότερος (comparativo)','ἐλάττων (comparativo)','ἐλάσσων (comparativo)','ἐλάχιστος (superlativo)'],'ἡδύς':['ἡδίων (comparativo)','ἥδιστος (superlativo)'],'ταχύς':['ταχίων (comparativo)','θάττων (comparativo)','θάσσων (comparativo)','τάχιστος (superlativo)']}
BIBLIOGRAPHIC_AUDIT = {'reference':'Porter, Reed e O’Donnell, Fundamentals of New Testament Greek (2010), apêndice de vocabulário; páginas 482–507 do arquivo local exportado, e não paginação impressa.','scope':'Confronto dos cabeçalhos lexicais recuperados do apêndice, com revisão de variantes, remissões e partes principais; não é transcrição do livro.','normalizedHeadwordsChecked':958,'representedInDataset':958,'matchingCorpusLemmas':952,'didacticBasesWithoutCorpusOccurrence':['ἀμφί','βαίνω','εἶμι','ἵημι','ἡδύς','τρέπω'],'unresolvedRecoveredHeadwords':0,'additionalIndependentCorpusLemmas':200,'normalization':'Variantes de lema (por exemplo ἐλεέω/ἐλεάω), formas plurais de pronomes, crases, partes principais e remissões são confrontadas com o lema canônico do corpus; comparativos e superlativos irregulares aparecem como aliases.','limits':'O total depende da normalização de lemas e inclui seis bases didáticas. Não significa que o livro anuncie exatamente 958 palavras. Não reproduz capítulos, glossas, paradigmas completos nem exercícios editoriais.','publicNote':'São 1.158 lemas: 958 cabeçalhos recuperados do apêndice de Fundamentals, reconciliados por lema, mais 200 extras escolhidos por frequência. Variantes, plurais e remissões foram normalizados; seis bases didáticas têm frequência zero no corpus. Essa reconciliação não equivale à transcrição integral ou à organização editorial do livro. As frequências incluem correções pontuais de lematização documentadas nos dados.'}

# These rules repair concrete lexical conflations in the pinned MACULA TSV.
# Matching uses exact normalized forms and original lemmas, not accent-stripped
# guessing. Counts are asserted so changing the source cannot silently change
# the correction. No token is added, deleted or counted twice.
CORRECTION_RULES = [
    {'id':'deo-necessity','from':'δέω','to':'δεῖ','forms':{'δεῖ','δεῖν','δέῃ','δέον','δέοντα'},'expected':85,'reason':'Formas do verbo impessoal de necessidade, distintas de δέω, atar. Participiais conferidos em Atos 19.36, 1Timóteo 5.13 e 1Pedro 1.6.'},
    {'id':'deo-beseech','from':'δέω','to':'δέομαι','forms':{'δεήθητε','ἐδεήθη','ἐδεήθην','ἐδεῖτο','δεόμενος','δεόμεθα'},'expected':10,'reason':'Formas médias/passivas de δέομαι, suplicar, distintas de δέω, atar.'},
    {'id':'rheo-said','from':'ῥέω','to':'λέγω','forms':{'ἐρρέθη'},'expected':10,'reason':'ἐρρέθη é forma do paradigma supletivo de λέγω, dizer; não pertence a ῥέω, fluir.'}
]
HOMOGRAPH_AUDIT = {'scope':'Revisão delimitada de padrões potencialmente confundíveis entre os ranks originais 100–300; não é revisão integral de todos os tokens do corpus.','lemmasWithAllFormsReviewed':['ἄρχω','αἴρω','πίπτω','πείθω','ἵστημι','ἐγείρω','ζάω','φέρω','φημί','ἀπόλλυμι','τίθημι','βάλλω'],'result':'Não foi identificada outra confusão entre lexemas nesses padrões. Polissemia regular, voz e paradigmas supletivos foram preservados. As correções documentadas não garantem ausência de outros erros no corpus.'}

def corrected_rows(rows):
    """Return independent corrected records and reproducible correction notes."""
    if any('form' not in row or 'ref' not in row for row in rows):
        raise ValueError('Cache lacks forms/references; run vocabulary-fetch.py again.')
    notes=[]
    for rule in CORRECTION_RULES:
        hits=[row for row in rows if N(row['lemma'])==rule['from'] and N(row['form'].lower()) in rule['forms']]
        if len(hits)!=rule['expected']:
            raise ValueError(f'Correction {rule["id"]}: expected {rule["expected"]} tokens; found {len(hits)}.')
        notes.append({'id':rule['id'],'from':rule['from'],'to':rule['to'],'tokens':len(hits),'forms':sorted(rule['forms']),'referenceExamples':[row['ref'] for row in hits[:3]],'reason':rule['reason']})
    working=[]
    for row in rows:
        updated=dict(row)
        for rule in CORRECTION_RULES:
            if N(row['lemma'])==rule['from'] and N(row['form'].lower()) in rule['forms']:
                updated['lemma']=rule['to']
                break
        working.append(updated)
    assert len(working)==len(rows)
    assert sum(N(a['lemma'])!=N(b['lemma']) for a,b in zip(rows,working))==sum(note['tokens'] for note in notes)
    return working,notes

def load_selection():
    corpus=json.loads((TMP/'macula-vocabulary-source.json').read_text(encoding='utf-8'))
    working,notes=corrected_rows(corpus['rows'])
    corpus['corrections']=notes
    counts=Counter(N(row['lemma']) for row in working)
    poses=defaultdict(Counter)
    for row in working: poses[N(row['lemma'])][row['pos']]+=1
    selected={lemma for lemma,count in counts.items() if count>=10}|{N(s) for s in SUPPLEMENT}
    ordered=sorted(selected,key=lambda lemma:(-counts[lemma],lemma))
    return corpus,counts,poses,ordered

def main():
    corpus,counts,poses,ordered=load_selection()
    glosses={}
    for path in sorted((ROOT/'scripts').glob('vocabulary-glosses-*.json')):
        for lemma,meaning in json.loads(path.read_text(encoding='utf-8')).items():
            if N(lemma) in glosses: raise ValueError(f'Duplicate gloss {lemma}')
            glosses[N(lemma)]=meaning
    missing=[lemma for lemma in ordered if not glosses.get(lemma,'').strip()]
    if missing: raise ValueError(f'Missing {len(missing)} glosses: '+', '.join(missing))
    entries=[]
    for rank,lemma in enumerate(ordered,1):
        rawpos=poses[lemma].most_common(1)[0][0] if poses[lemma] else ZERO_POS[lemma]
        entry={'id':'v-'+hashlib.sha256(lemma.encode()).hexdigest()[:12],'lemma':lemma,'meaning':glosses[lemma],'pos':POS_OVERRIDES.get(lemma,POS[rawpos]),'frequency':counts[lemma],'rank':rank,'level':0 if rank<=100 else 1 if rank<=300 else 2 if rank<=700 else 3,'core300':rank<=300}
        if lemma in POS_OVERRIDES: entry['corpusPos']=POS[rawpos]
        if lemma in ALIASES: entry['aliases']=ALIASES[lemma]
        entries.append(entry)
    total=len(corpus['rows']); core=sum(e['frequency'] for e in entries[:300])
    meta={'title':'Vocabulário grego do Novo Testamento','language':'pt-BR','version':'1.0.0','entryCount':len(entries),'selection':'Todos os lemas com pelo menos dez ocorrências no corpus MACULA SBLGNT, acrescidos de um suplemento didático independente de palavras básicas. Ordem por frequência calculada, com desempate pela forma Unicode NFC.','selectionIsExactPorterList':False,'frequency':{'corpus':'MACULA Greek SBLGNT','tokens':total,'corpusLemmas':len(counts),'method':'Contagem de tokens por lema NFC em todo o TSV, usando a lematização do corpus. Variantes, crases e homógrafos seguem as decisões do MACULA. Frequência zero significa que o lema didático não ocorre como lema independente neste corpus.','cutoff':10,'commit':corpus['commit'],'sourceSha256':corpus['sha256']},'core300':{'count':300,'tokens':core,'coverage':round(core/total,6),'coveragePercent':round(core/total*100,2),'denominator':'Todos os tokens do mesmo corpus; mede reconhecimento por lema, não compreensão ou tradução.'},'coverage300':round(core/total*100,2),'coverageAll':{'tokens':sum(e['frequency'] for e in entries),'percent':round(sum(e['frequency'] for e in entries)/total*100,2)},'methodology':['Lemas e classes gramaticais validados contra MACULA; classe exibida corresponde à análise mais frequente do lema.','Glossas portuguesas breves e originais, próprias para estudo inicial; o contexto pode exigir outra tradução. Não são verbetes reproduzidos de BDAG ou de gramáticas.','O repertório principal é definido por frequência e não copia seleção, sequência de capítulos, traduções ou exercícios de um livro.','Os índices de cobertura são calculados deste corpus e desta versão; não são percentuais atribuídos a Porter.','Lemas variantes e plurais pronominais podem ser agrupados de maneira distinta na bibliografia. Aliases indicam correspondências de estudo sem duplicar contagens.','O confronto bibliográfico utiliza apenas formas lexicais: não transfere glossas, estrutura, exercícios ou organização editorial.'],'sources':[{'title':'SBL Greek New Testament','authors':'Michael W. Holmes; Society of Biblical Literature e Logos Bible Software','url':'https://github.com/Faithlife/SBLGNT','license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','copyright':'© 2010 Society of Biblical Literature e Logos Bible Software','usage':'Texto subjacente ao corpus; não há texto corrido do NT neste arquivo.'},{'title':'MACULA Greek Linguistic Datasets','authors':'Biblica, Inc.; Clear Bible, Inc.','url':'https://github.com/Clear-Bible/macula-greek','license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','copyright':'© 2022–2024 Biblica, Inc.','requiredAttribution':'MACULA Greek Linguistic Datasets, available at https://github.com/Clear-Bible/macula-greek/','source':corpus['source'],'usage':'Lema, classe gramatical e contagens calculadas. Campos MARBLE ln/domain, glossas e árvores não foram reutilizados.'},{'title':'Fundamentals of New Testament Greek','authors':'Stanley E. Porter, Jeffrey T. Reed e Matthew Brook O’Donnell','year':2010,'usage':'Referência pedagógica e confronto privado de formas lexicais. Obra protegida; nenhum PDF, tradução editorial ou exercício foi incorporado.'}],'originalGlosses':{'license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','attribution':'Projeto Koiné — glossas didáticas originais em português.'}}
    meta['bibliographicAudit']=BIBLIOGRAPHIC_AUDIT
    meta['version']='1.0.1'
    meta['selection']='Todos os lemas com pelo menos dez ocorrências no corpus MACULA SBLGNT após as correções documentadas, acrescidos de um suplemento didático independente de palavras básicas. Ordem por frequência calculada, com desempate pela forma Unicode NFC.'
    meta['frequency']['method']='Contagem de tokens por lema NFC em todo o TSV após correções pontuais de homógrafos por forma e referência. Variantes e crases não corrigidas seguem o corpus. Frequência zero indica ausência de lema independente neste corpus. Nenhum token foi acrescentado ou removido.'
    meta['frequency']['correctedTokens']=sum(note['tokens'] for note in corpus['corrections'])
    meta['frequency']['corrections']=corpus['corrections']
    original=Counter(N(row['lemma']) for row in corpus['rows'])
    changed={note[key] for note in corpus['corrections'] for key in ('from','to')}
    meta['frequency']['lemmaCountChanges']=[{'lemma':lemma,'original':original[lemma],'corrected':counts[lemma]} for lemma in sorted(changed)]
    meta['frequency']['boundedHomographAudit']=HOMOGRAPH_AUDIT
    meta['methodology'][0]='Lemas e classes partem de MACULA, com correções explícitas de 105 tokens de δέω/δεῖ/δέομαι e ῥέω/λέγω. Substantivações e numerais recebem rótulo pedagógico, com a classe original em corpusPos. A conferência contra o corpus não é garantia de que todas as análises de origem estejam corretas.'
    (ROOT/'data'/'vocabulary.json').write_text(json.dumps({'meta':meta,'entries':entries},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'entries':len(entries),'core300CoveragePercent':meta['coverage300'],'allCoveragePercent':meta['coverageAll']['percent']},ensure_ascii=False))

if __name__=='__main__': main()
