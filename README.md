# Koiné

Plataforma de estudo do grego do Novo Testamento, de **Laylson de Albuquerque** ([GitHub](https://github.com/LaylsondeAlbuquerque)).

Projeto **Angular 21 + TypeScript**, com componentes standalone, signals, detecção de mudanças OnPush e rotas carregadas sob demanda. As telas usam templates e eventos Angular. A lógica de revisão e busca permanece em módulos puros testáveis.

O resultado da compilação é um site estático para GitHub Pages: não há backend, banco de dados, chave de API, assinatura ou cadastro de alunos. O conteúdo e a hospedagem continuam gratuitos.

## Estudar

- **Morfologia:** padrões, paradigmas e parsing com respostas selecionadas.
- **Sintaxe:** compreensão de conceitos e relações nas orações; comparação de abordagens no nível avançado.
- **Vocabulário:** repertório superior a 950 lemas, flashcards, associações e um núcleo prioritário de 300 palavras.
- Cada área tem percurso, artigos, flashcards e prática, distribuídos em Fundamentos, Essencial, Aprofundamento e Avançado.
- **Percurso:** aulas progressivas com explicações básicas, exemplos e exercícios. **Artigos:** textos independentes de aprofundamento, ligados a cada assunto e nível, com discussão, fontes e perguntas de reflexão. Cada espaço tem sua própria marcação de leitura.
- O repertório é pesquisável em grego ou português, inclusive sem acentos. A busca também distingue aulas do percurso e artigos de aprofundamento.
- Tema noturno inicial com alternância para o claro e preferência salva no navegador. A home tem uma animação original de letras e palavras gregas, com pausa e respeito à preferência de movimento reduzido.
- Os flashcards revelam o verso ao selecionar a resposta; a prática combina desafios de escolha com confirmação, associação de pares, parsing e ordenação de blocos. As sessões priorizam perguntas ainda não vistas e alternam assuntos e atividades; um filtro pequeno termina sem duplicar questões para completar a quantidade solicitada.
- Os artigos atuais exibem discretamente “Texto produzido por IA”. Para futuros artigos de autoria humana, o campo opcional `author` identifica o autor no mesmo espaço.

O progresso é salvo **somente no navegador**. Um vocábulo é registrado como memorizado depois de acertos em três dias diferentes; um erro o devolve à revisão. Repetições no mesmo dia não aceleram esse marcador. É possível exportar/importar o histórico em Meu progresso. Leituras concluídas não equivalem a uma certificação de domínio.

O percentual do núcleo dos 300 é calculado das ocorrências no corpus identificado nos metadados. Trata-se de cobertura lexical por lema, não de compreensão de passagens. Consulte `data/vocabulary.json` para os números, a seleção independente e a conferência com o repertório bibliográfico.

## Desenvolver

Use uma versão de Node compatível: 20.19+, 22.12+ ou 24.x. O lockfile fixa as dependências.

```sh
npm ci
npm start
```

Abra http://127.0.0.1:4200. Angular CLI compila e atualiza a prévia durante o desenvolvimento.

```sh
npm run check
```

Esse comando valida o conteúdo, executa os testes de lógica e os testes Angular com Vitest/jsdom, e gera o build de produção para Pages. Não exige instalação global de Angular CLI.

Para conferir exatamente o build publicado, com Python 3.9 ou posterior:

```sh
npm run build:pages
npm run preview
```

Abra http://127.0.0.1:4181/koine-estudos/. Essa prévia serve somente o diretório compilado.

## Estrutura

- `src/main.ts`: bootstrap do Angular e roteador por hash.
- `src/app/app.component.*`: navegação, busca global, tema e layout.
- `src/app/pages/`: início, percursos, aulas, artigos, progresso e apresentação.
- `src/app/study/`: serviço de sessões e componentes de flashcards/prática.
- `src/app/words/`: repertório com busca, filtros e paginação.
- `src/app/content.service.ts` e `progress.service.ts`: conteúdo e persistência.
- `src/app/models.ts`: tipos e definições do curso.
- `core.js` e `catalog.js`: lógica pura de revisão, seleção e indexação, com declarações TypeScript.
- `appearance.js`: canvas com ciclo de vida integrado ao componente de início.
- `angular.json`: build, estilos e lista explícita dos arquivos públicos.
- `src/index.html`: documento de entrada; a saída compilada fica em `dist/koine/browser/`.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` instala pelo lockfile, executa `npm run check` e publica **somente `dist/koine/browser`**. Em Settings → Pages, a origem é **GitHub Actions**. Pushes para `main` e execuções manuais pelo Actions publicam a aplicação após as verificações.

O build usa `--base-href /koine-estudos/`. Se o repositório mudar de nome, ajuste `build:pages` no package.json. As rotas por hash preservam os endereços anteriores, inclusive os links antigos de aulas, sem exigir regras de servidor. A chave do localStorage continua vinculada ao mesmo caminho, preservando o progresso anterior no mesmo navegador/origem.

Não envie `tmp/`, a biblioteca de PDFs, `node_modules/`, caches Angular ou arquivos pessoais. Esses diretórios não integram os assets do build nem o artefato publicado. Os arquivos compilados não precisam ser adicionados ao Git.

## Editar o conteúdo

- `data/morphology.json`: aulas e exercícios de morfologia.
- `data/syntax.json`: aulas e exercícios de sintaxe.
- `data/vocabulary-lessons.json`: aulas e exercícios de vocabulário.
- `data/articles-morphology.json`, `data/articles-syntax.json` e `data/articles-vocabulary.json`: artigos de aprofundamento.
- `data/vocabulary.json`: lemas, glossas, frequências e metadados.
- `CONTRIBUTING-CONTENT.md`: formato das lições e questões.

IDs estáveis preservam o vínculo com o histórico local. Campos `kind` suportados: `choice`, `parse`, `match` e `order`. As respostas sempre são escolhidas pela interface. Após editar conteúdo, execute as verificações e publique o novo build. O workflow faz isso automaticamente nos pushes para main.

Os scripts `vocabulary-fetch.py` e `vocabulary-build.py` reproduzem a seleção independente usando dados abertos fixados por commit e checksum. A comparação bibliográfica privada não é requisito para executar o site ou reproduzir a seleção. A pasta `tmp/` é excluída do Git; ali ficam caches e materiais de conferência que **não devem ser publicados**.

### Áudio erasmiano

O reprodutor aceita um campo opcional, por exemplo `"audio": "./assets/audio/logos.mp3"`, em uma entrada do repertório. A reprodução aparece no flashcard daquele vocábulo. Hospedar gravações próprias no GitHub Pages não exige uma API de áudio paga. Esta versão não inclui uma coleção gravada: só devem ser adicionados arquivos próprios ou com licença de redistribuição verificada. Registre os créditos em `THIRD_PARTY_NOTICES.md`. Não se usa voz moderna do navegador como substituto da pronúncia erasmiana.

## Referências e licenças

Porter, Reed e O’Donnell orientam a morfologia; *Idioms*, de Porter, orienta a sintaxe. Wallace é identificado como complemento/comparação. Os artigos e exercícios têm redação própria, exemplos didáticos próprios e referências específicas.

- Código original: **MIT**, em `LICENSE`.
- Materiais didáticos originais e dados identificados: **CC BY 4.0**, em `CONTENT-LICENSE.md`.
- Fontes: **SIL OFL 1.1**.
- Dados MACULA e texto SBLGNT subjacente: **CC BY 4.0**, com atribuições e transformações em `THIRD_PARTY_NOTICES.md`.

As gramáticas e os léxicos consultados não são redistribuídos. Não há PDFs, extrações dos livros, exercícios editoriais, segredos ou dados de alunos no projeto público. Os textos e análises podem ser revisados conforme novas fontes forem conferidas.
