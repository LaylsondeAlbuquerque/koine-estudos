# Contrato de conteúdo

Aplicação estática em português, sem dependências de execução, compatível com GitHub Pages em subdiretório. As bases protegidas ficam fora do repositório. Artigos e exercícios têm redação original; referências bibliográficas não significam reprodução nem endosso.

Cada arquivo data/morphology.json, data/syntax.json e data/vocabulary-lessons.json contém uma lista de lições:

```json
{"id":"m-alphabet","area":"morphology","level":0,"order":1,"title":"Alfabeto grego","summary":"Descrição breve.","minutes":8,"objectives":["Objetivo"],"sections":[{"heading":"Título","body":"Texto em português. Parágrafos separados por \\n\\n.","table":{"headers":["Forma","Análise"],"rows":[["λόγος","nominativo singular"]]}}],"examples":[{"greek":"ὁ λόγος","translation":"a palavra","note":"Comentário próprio; exemplo didático."}],"questions":[{"id":"m-alphabet-1","kind":"choice","prompt":"Qual é a resposta?","greek":"λόγος","options":["Alternativa correta","Outra","Outra ainda"],"answer":0,"explanation":"Explicação didática do gabarito."}],"references":["Porter, Reed e O’Donnell, Fundamentals of New Testament Greek: seção sobre o assunto (síntese didática original)."]}
```

Níveis: 0 = Fundamentos; 1 = Essencial; 2 = Aprofundamento; 3 = Avançado. Áreas: morphology, syntax, vocabulary.

Outras questões suportadas:

* `kind: "match"`, `pairs: [{"left":"λόγος","right":"palavra"}, ...]`, `prompt`, `explanation`.
* `kind: "order"`, `tokens: ["A","palavra","permanece"], answer: ["A","palavra","permanece"]`, `prompt`, `greek`, `explanation`. Evitar repetições idênticas de tokens.
* `kind: "parse"`, `greek: "λόγον"`, `prompt`, `fields: [{"label":"Caso","options":["Nominativo","Genitivo","Dativo","Acusativo"],"answer":"Acusativo"}, ...]`, `explanation`.

Cada lição deve conter conteúdo substantivo, exemplos conferidos e 3–5 questões com respostas verificáveis. Não inventar paginação nem atribuir a Porter uma posição que não foi conferida. Na sintaxe, tratar o contexto e permitir observações sobre análises alternativas. Paradigmas linguísticos e análises de exemplos didáticos devem ser independentes da diagramação dos livros.
