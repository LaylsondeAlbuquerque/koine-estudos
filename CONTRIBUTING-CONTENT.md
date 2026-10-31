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

Cada lição deve conter conteúdo substantivo, exemplos conferidos e questões variadas com respostas verificáveis. Não inventar paginação nem atribuir a Porter uma posição que não foi conferida. Na sintaxe, tratar o contexto e permitir observações sobre análises alternativas. Paradigmas linguísticos e análises de exemplos didáticos devem ser independentes da diagramação dos livros.

O enunciado deve funcionar fora do artigo: apresente a forma ou oração necessária e nomeie o que deve ser identificado (caso, gênero, função, sentido ou comparação teórica). Evite referências como “no primeiro exemplo” sem incluir esse exemplo. Em formas sincréticas, forneça contexto ou preserve as análises possíveis. Nas ordenações, explicite a sequência solicitada; não apresente uma ordem didática como a única tradução natural. Alternativas e pares devem ter uma única correspondência correta.

Os artigos atuais mostram “Texto produzido por IA”. O campo opcional `author`, com o nome do autor, deve ser usado quando um texto de autoria humana for fornecido e identificado pelo responsável do projeto. Ele muda apenas a assinatura daquele artigo; não atribua textos gerados ao responsável pelo site.

## Aulas e aprofundamentos

Os arquivos `morphology.json`, `syntax.json` e `vocabulary-lessons.json` guardam as aulas do Percurso e os exercícios avaliados. Seus IDs continuam vinculados ao progresso anterior. A rota principal de uma aula é `#/area/lesson/id`; os antigos links `#/area/article/id-da-aula` continuam abrindo a aula.

Os arquivos `articles-morphology.json`, `articles-syntax.json` e `articles-vocabulary.json` guardam os aprofundamentos da aba Artigos. Cada registro tem `id` próprio, `area`, `level`, `lessonId`, `order`, `title`, `summary`, `minutes`, `sections`, `references` e `discussionQuestions`. O `lessonId` deve apontar para uma aula da mesma área e nível. O texto precisa desenvolver uma discussão diferente da explicação básica; não copie o corpo da aula. As perguntas de reflexão não geram nota ou tentativas no histórico de exercícios.

As referências de aprofundamentos aceitam `{ "title": "Título da fonte", "url": "https://..." }`; a URL é opcional para referências bibliográficas impressas. Atribuições de posições a autores precisam de fonte identificável. Marcar um artigo como lido não conclui a aula correspondente. O aviso de IA fica no fim dos artigos de aprofundamento.
