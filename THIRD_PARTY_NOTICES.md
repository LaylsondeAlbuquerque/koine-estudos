# Fontes e atribuições

## Texto grego subjacente: SBLGNT

Michael W. Holmes, editor. *The Greek New Testament: SBL Edition*. © 2010 Society of Biblical Literature e Logos Bible Software.

- Fonte: https://github.com/Faithlife/SBLGNT
- Licença vigente informada pelo titular: https://www.sblgnt.com/license/
- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/

O repertório utiliza lemas e contagens do corpus MACULA baseado no SBLGNT. A área Leitura redistribui o texto em `data/reading/`, derivado dos 27 arquivos locais SBLGNT v1.2, incluindo João 7.53–8.11. Removem-se os marcadores do aparato e seus dígitos; numeração e colchetes editoriais são preservados. Duas intervenções ortográficas são aplicadas: João 8:9, δέ → δὲ; João 10:29, μεῖζων → μείζων. As justificativas e referências acadêmicas estão em `docs/reading-orthography.md`; os metadados públicos do índice identificam as alterações. As demais grafias exibidas seguem o texto-base, inclusive acentos adicionais válidos antes de enclíticas. Os checksums individuais das fontes, variantes aceitas e medições são registrados localmente por `scripts/reading-build.py` em `tmp/reading-audit/report.json`. Nas aulas, recortes bíblicos curtos são identificados por referência; exemplos didáticos são identificados como tais. As traduções portuguesas e as tabelas de análise foram redigidas para o projeto.

## MACULA Greek Linguistic Datasets

As fichas do repertório em `data/word-forms/` também derivam as formas e análises morfológicas do snapshot MACULA SBLGNT revisado. Transformações: associação aos IDs do repertório com as correções já documentadas; agrupamento por lema e grafia sem distinção de maiúsculas/acentos; contagem de ocorrências; rótulos em português na interface. Alternativas de caso decorrentes do sincretismo neutro são acrescentadas com contagem zero e identificadas na interface. Não se importam glossas contextuais ou campos MARBLE nessas fichas. Dados derivados sob CC BY 4.0; código do projeto conserva sua licença própria.

“MACULA Greek Linguistic Datasets, available at https://github.com/Clear-Bible/macula-greek/”. © 2022–2024 Biblica, Inc.; Clear Bible, Inc.

- Licença: https://github.com/Clear-Bible/macula-greek/blob/main/LICENSE.md
- Dados utilizados: lemas e classes gramaticais sob CC BY 4.0.
- A Leitura usa também referências e a classificação de nomes próprios; o alinhamento compara as formas na mesma posição do mesmo versículo, ignorando caixa e acentos agudo/grave/circunflexo, preservando espíritos, diérese, iota subscrito, letras e ordem. A variante Μωσῆς/Μωϋσῆς é aceita especificamente em João 8:5. A junção dos lemas com o vocabulário permanece NFC exata, sem fundir homógrafos. Não publica glossas nem campos MARBLE na leitura. O índice mantém IDs existentes do vocabulário, correções documentadas e dependências externas bloqueantes. Nomes próprios são dispensados por convenção didática, por ocorrência, não por grafia.
- O índice `data/reading/vocabulary-books.json` deriva contagens por lema dentro de cada livro e a posição da primeira ocorrência, após as mesmas correções documentadas de lematização. Inclui nomes próprios. Não acrescenta glossas ou dados MARBLE e mantém CC BY 4.0 e as atribuições acima.
- Commit consultado: `8423afe47b9e8f24b7772e808af45c7159a6fe7e`.
- SHA-256 do TSV de origem: `7f71504fdee8659bdd9f85342e4103d645864c2851b8205915bb298f0c004cc5`.

Transformações: contagens por lema, normalização NFC, correções linguísticas explicitadas nos metadados, seleção independente por frequência com suplemento didático, classificação por níveis e redação de glossas próprias em português. Não se reutilizam glossas editoriais, árvores sintáticas nem campos MARBLE `ln`/`domain`. O arquivo público de vocabulário registra os critérios, os ajustes e os limites da comparação bibliográfica.

## Fontes tipográficas

**Momo Trust Display** — Copyright 2024 The MoMo Trust Display Project Authors. Distribuída sob SIL OFL 1.1. Fonte regular local em `assets/MomoTrustDisplay-Regular.ttf`; licença em `assets/MomoTrustDisplay-OFL.txt`.

- Fonte: https://github.com/google/fonts/tree/main/ofl/momotrustdisplay

**Be Vietnam Pro** — Copyright 2021 The Be Vietnam Pro Project Authors. Distribuída sob SIL OFL 1.1. Fontes regular e semibold locais em `assets/BeVietnamPro-Regular.ttf` e `assets/BeVietnamPro-SemiBold.ttf`; licença em `assets/BeVietnamPro-OFL.txt`.

- Fonte: https://github.com/google/fonts/tree/main/ofl/bevietnampro

**Encode Sans** — Copyright 2020 The Encode Project Authors, com nome reservado Encode Sans. Distribuída sob SIL Open Font License 1.1. Arquivo original e aviso em `assets/EncodeSans.ttf` e `assets/EncodeSans-OFL.txt`.

- Fonte: https://github.com/google/fonts/tree/main/ofl/encodesans


**Manrope** — projeto Manrope, distribuído pelo repositório Google Fonts sob SIL Open Font License 1.1. Arquivo original e aviso em `assets/Manrope.ttf` e `assets/Manrope-OFL.txt`.

- Fonte: https://github.com/google/fonts/tree/main/ofl/manrope

**GFS Didot** — Greek Font Society, distribuída pelo repositório Google Fonts sob SIL Open Font License 1.1. Arquivo original e aviso em `assets/GFSDidot.ttf` e `assets/GFSDidot-OFL.txt`.

- Fonte: https://github.com/google/fonts/tree/main/ofl/gfsdidot

Os arquivos de fontes não foram modificados. Os ícones, a marca tipográfica e os diagramas decorativos da interface foram desenhados em SVG/CSS para o projeto.

## Bibliografia consultada, sem redistribuição das obras

- Porter, Stanley E.; Reed, Jeffrey T.; O’Donnell, Matthew Brook. *Fundamentals of New Testament Greek*. Eerdmans, 2010.
- Porter, Stanley E. *Idioms of the Greek New Testament*. Sheffield Academic Press, 2ª edição.
- Wallace, Daniel B. *Greek Grammar Beyond the Basics*; edição portuguesa de sintaxe exegética consultada quando identificada nas lições.
- Mateos, Juan. *Método de análisis semántico aplicado al griego del Nuevo Testamento*. El Almendro, 1989.
- Peláez, Jesús. *Significado, traducción y definición de las palabras en el Diccionario Griego-Español del Nuevo Testamento (DGENT)*.
- Porter, Stanley E. *Linguistic Analysis of the Greek New Testament*, especialmente os trechos sobre semântica, lexicografia e contexto disponibilizados para consulta.
- Carson, D. A. *Falacias exegéticas*. Edição espanhola CLIE, 2013, tradução de Beatriz Fernández; especialmente o capítulo sobre estudos de palavras.

As obras protegidas são referências para explicações e atividades próprias. PDFs, extrações, traduções integrais, páginas escaneadas e exercícios dos livros não integram o site nem o repositório. A referência não representa licença para redistribuição de uma obra, vínculo institucional ou endosso de seus autores.

## Ampliação integral do repertório

O repertório inclui todos os lemas do snapshot MACULA SBLGNT fixado (mais seis bases didáticas sem ocorrência). As glosas anteriores foram preservadas. Para as novas entradas, usaram-se glosas inglesas breves do **Jeffrey Dodson Greek Lexicon**, convertido por Ulrik Sandborg-Petersen e disponibilizado pelo Biblical Humanities sob **CC0 1.0** (domínio público): https://github.com/biblicalhumanities/Dodson-Greek-Lexicon/tree/74f70358d4acfaf2f980bf2feb58ab7115cbbcbc . SHA-256 de `dodson.csv`: `46951bf82c40ed35caa8557db190a828b744e305e9619d9451ea5690a90d7101`.

A associação parte do número Strong mais frequente por lema no MACULA; esse vínculo não constitui desambiguação lexical independente. Na ausência de entrada Dodson, usam-se glosas **Cherith Glosses for the Greek New Testament**, Andi Wu, © 2023 Cherith Analytics, **CC BY 4.0**, presentes no campo `english` do MACULA. Cada origem inglesa é registrada por lema em `scripts/vocabulary-expansion-sources.json`. Não se utilizam campos MARBLE.

As novas glosas foram traduzidas automaticamente do inglês para o português, com correções delimitadas registradas em `scripts/vocabulary-expansion-overrides.json`. São identificadas como **glosas em revisão**, inclusive nos cartões, e não equivalem a verbetes lexicográficos nem a uma revisão acadêmica integral. A geração normal usa os arquivos locais versionados e não consulta serviços de tradução. As adaptações portuguesas e os derivados MACULA são distribuídos sob CC BY 4.0, com as atribuições acima; as restrições do código não limitam as permissões desses dados.

## Gravações

Esta versão não distribui gravações de terceiros. Futuras gravações exigem autorização ou licença de redistribuição compatível; seus autores e condições devem ser registrados aqui. A existência de acesso gratuito a uma gravação não é tratada como permissão de cópia.

## Dependências Angular

A aplicação usa Angular (MIT), RxJS (Apache-2.0) e tslib (0BSD). O build de produção inclui os avisos extraídos das dependências em `3rdpartylicenses.txt`, junto ao site compilado. As dependências de desenvolvimento e suas versões estão registradas em `package-lock.json`.

## Identidade visual Our Forms

A adaptação visual em `ourforms.css` usa como referência os layouts e estilos de [Our Forms](https://github.com/LaylsondeAlbuquerque/our-forms), de Laylson de Albuquerque, no commit `b8a5c922f5f1dffd5722b08502e0f5f0f6f79b38`. O tema claro conserva sua paleta e linguagem de bordas e tipografia; a versão escura foi elaborada para o Koiné. A animação de grego permanece própria do projeto Koiné.

Código de referência sob MIT, copyright 2025 Laylson de Albuquerque. Aviso integral em `assets/OurForms-MIT.txt`.

## Excerto grego de Nestle 1904

Alguns exemplos de Semântica identificam expressamente a edição de Eberhard Nestle (1904), em transcrição de Diego Renato dos Santos, disponibilizada no diretório `xhtml` do projeto Biblical Humanities. O aviso desse componente informa domínio público; não se presume a mesma condição para outras camadas do repositório. Usam-se apenas trechos do texto, sem importar morfologia, glossas ou anotações de outras camadas. As traduções portuguesas são próprias.

- Texto e créditos: https://github.com/biblicalhumanities/Nestle1904/tree/master/xhtml
- Condições do componente consultado: https://github.com/biblicalhumanities/Nestle1904/blob/master/xhtml/README.md
