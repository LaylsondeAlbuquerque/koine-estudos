# Koiné

[**Acessar a demonstração**](https://laylsondealbuquerque.github.io/koine-estudos/) · [Ver o pipeline de publicação](.github/workflows/pages.yml)

Aplicação **Angular 21 + TypeScript** para estudar grego do Novo Testamento. O projeto organiza aulas, artigos, exercícios e revisão de vocabulário em um único ambiente, com busca em grego e português e acompanhamento do estudo no navegador.

**Código proprietário:** a reutilização do código original publicado sob os termos atuais exige autorização prévia e por escrito de Laylson de Albuquerque, observadas as permissões e ressalvas em [LICENSE](LICENSE). O acesso ao site para estudar é gratuito.

O acervo atual reúne **132 aulas, 132 artigos, 837 questões e 5.474 entradas de vocabulário**. O repertório cobre todos os 5.468 lemas do corpus MACULA SBLGNT fixado, mais seis bases didáticas. As 4.316 novas glosas portuguesas são identificadas como glosas em revisão. Para experimentar, escolha uma área, abra uma aula, pratique os exercícios e consulte Meu progresso.

Projeto idealizado e conduzido por **Laylson de Albuquerque** ([GitHub](https://github.com/LaylsondeAlbuquerque)), com assistência de IA na implementação e na redação didática. As revisões e os ajustes foram realizados de forma iterativa, conforme solicitações do responsável.

## Funcionalidades

- **Morfologia:** padrões, paradigmas e análise morfológica com respostas selecionadas.
- **Sintaxe:** compreensão de conceitos e relações nas orações; no Essencial, uma aula por caso seguindo os grupos de Porter, com trechos traduzidos, análise palavra por palavra e comentários sintáticos. As leituras aplicadas retomam construções e ambiguidades; o nível avançado compara abordagens.
- **Vocabulário:** repertório integral do corpus MACULA SBLGNT, flashcards, associações e um núcleo prioritário de 300 palavras. Os IDs e glosas das 1.158 entradas anteriores foram preservados.
- **Semântica:** 48 aulas em 12 módulos, com pesquisa lexical, espécies e componentes semânticos, hipóteses contextuais, falácias e tradução comentada. Mateos dialoga com Peláez, Porter e Carson em exemplos aplicados à exegese do Novo Testamento.
- Cada área tem percurso, artigos, flashcards e prática, distribuídos em Fundamentos, Essencial, Aprofundamento e Avançado.
- **Percurso:** aulas progressivas com explicações básicas, exemplos e exercícios. **Artigos:** textos independentes de aprofundamento, ligados a cada assunto e nível, com discussão, fontes e perguntas de reflexão. Cada espaço tem sua própria marcação de leitura.
- Os flashcards e a prática de vocabulário oferecem os recortes globais dos 10, 50, 100, 200 e 300 lemas mais frequentes. O conjunto de vocábulos e o tamanho da sessão (5, 10 ou 20 itens) são selecionados separadamente.
- No repertório e nos flashcards de vocabulário, marque palavras como **Revisar** ou **Já aprendida**. Os filtros incluem todos os vocábulos, marcados para revisão, já aprendidos e ainda não aprendidos; nos flashcards, o grupo pode ser combinado com o nível ou o recorte de frequência. Selecione novamente uma marcação ativa para removê-la.
- O repertório é pesquisável em grego ou português, inclusive sem acentos, com filtros e paginação. A busca global também distingue aulas do percurso e artigos de aprofundamento.
- **Vocabulário por livro:** prática, flashcards e repertório permitem escolher um dos 27 livros, ver quantos lemas faltam aprender e ordenar pela frequência naquele livro ou pela primeira ocorrência. No repertório, o livro combina com busca, classe e estado de aprendizado; as marcações são compartilhadas entre todos os livros.
- Identidade visual do Our Forms no tema claro, com fundo creme, cabeçalho amarelo, bordas retas e acentos coloridos; tema escuro com fundo preto puro, marca monocromática e preferência salva no navegador. A navegação reproduz o sublinhado ativo e a expansão de 300 ms do Our Forms. A home tem uma animação de letras e palavras gregas, com pausa e respeito à preferência de movimento reduzido.
- Os flashcards revelam o verso ao selecionar a resposta; a prática combina desafios de escolha com confirmação, associação de pares, análise morfológica e ordenação de blocos. As sessões priorizam perguntas ainda não vistas e alternam assuntos e atividades; um filtro pequeno termina sem duplicar questões para completar a quantidade solicitada.

O progresso é salvo **somente no navegador**. Sem marcação manual, um vocábulo é considerado aprendido depois de acertos em três dias diferentes; repetições no mesmo dia não aceleram esse marcador. A marcação **Já aprendida** também entra nas contagens, sem inventar acertos ou datas. **Revisar** mantém a palavra nesse grupo até você alterar ou remover a marcação; um erro em uma palavra marcada como já aprendida a devolve para revisão. Os pontos do repertório mostram apenas dias reais com acertos. É possível exportar/importar o histórico, incluindo as marcações, em Meu progresso. Leituras concluídas não equivalem a uma certificação de domínio.

O percentual do núcleo dos 300 é calculado das ocorrências no corpus identificado nos metadados. Trata-se de cobertura lexical por lema, não de compreensão de passagens. Consulte [data/vocabulary.json](data/vocabulary.json) para os números, a seleção independente e a conferência com o repertório bibliográfico.

Os artigos atuais exibem “Texto produzido por IA”. Para futuros artigos de autoria humana, o campo opcional `author` identifica o autor no mesmo espaço. Os textos e análises podem ser revisados conforme novas fontes forem conferidas.

## Arquitetura e decisões técnicas

No repertório, clicar no vocábulo abre uma ficha com o significado lexical básico e as formas encontradas no NT. A ficha reúne as análises morfológicas registradas no MACULA e explicita a coincidência de nominativo/acusativo neutros (também vocativo para substantivos e adjetivos), identificando alternativas não atestadas. Não constitui um paradigma exaustivo. O botão “Praticar palavra” continua disponível na ficha.

Os dados são carregados sob demanda de `data/word-forms/`, em 64 blocos. Para regenerá-los a partir da fonte local revisada, execute `npm run forms:build`. O gerador reaproveita as correções de lemas do repertório e confere todas as frequências. Os testes verificam cobertura, contagens e as alternativas morfológicas acrescentadas. Não se geram traduções por flexão; usa-se o significado português já existente no repertório.

| Decisão | Aplicação no projeto |
| --- | --- |
| Angular com componentes standalone, signals e OnPush | Templates e eventos Angular organizam as telas; rotas carregadas sob demanda dividem as páginas da aplicação. |
| Regras independentes da interface | [core.js](core.js) concentra revisão e seleção de exercícios; [catalog.js](catalog.js) indexa relações e buscas. Ambos têm declarações TypeScript e testes próprios. |
| Conteúdo em JSON e hospedagem estática | Os serviços carregam os arquivos públicos, e o build é servido pelo GitHub Pages. O projeto funciona sem backend, banco de dados, chave de API, assinatura ou cadastro de alunos. O conteúdo e a hospedagem continuam gratuitos. |
| Progresso local com backup | O histórico fica em localStorage, com exportação/importação JSON e validação antes da substituição. A chave de armazenamento e as rotas antigas de aulas foram preservadas na migração para Angular. |
| Ciclo de vida da animação | A animação em canvas é montada na home e libera listeners e observers ao sair. Também considera pausa, visibilidade da aba e preferência de movimento reduzido. |

O TypeScript e os templates Angular usam verificações estritas. A interface inclui foco visível, link para o conteúdo principal, rótulos de controles e gestão de foco na busca.

Os JSON públicos são revalidados no servidor antes da reutilização do cache. Se o índice de leitura ou o filtro por livro encontrar IDs ausentes no repertório carregado, a aplicação atualiza o repertório uma vez e valida novamente. Essa recuperação não altera o histórico local nem dispensa a validação das dependências.

## Qualidade e verificações

O comando `npm run check` valida o conteúdo, executa os testes de lógica em Node e os testes Angular com Vitest/jsdom, e gera o build de produção para Pages. A suíte cobre comportamentos como:

- Revisão lexical em três dias distintos, seleção sem duplicatas e alternativas sem sobreposição de sentidos.
- Busca sem acentos, combinação de filtros e paginação do repertório.
- Importação de históricos antigos, rejeição de backups corrompidos e preservação do progresso quando o armazenamento falha.
- Compatibilidade de links antigos, marcações independentes de aulas/artigos e interação com os templates reais de exercícios.

O validador confere IDs, níveis, relações entre aulas e artigos, estrutura dos exercícios e arquivos necessários em tempo de execução. No [workflow de Pages](.github/workflows/pages.yml), a publicação depende da aprovação dessas verificações. A suíte também foi conferida localmente e no [GitHub Actions](https://github.com/LaylsondeAlbuquerque/koine-estudos/actions/runs/41895501704).

## Desenvolver

Use uma versão de Node compatível: 20.19+, 22.12+ ou 24.x. O lockfile fixa as dependências.

```sh
npm ci
npm start
```

Abra [http://127.0.0.1:4200](http://127.0.0.1:4200). Angular CLI compila e atualiza a prévia durante o desenvolvimento.

```sh
npm run check
```

Não é necessário instalar Angular CLI globalmente.

Para conferir exatamente o build publicado, com Python 3.9 ou posterior:

```sh
npm run build:pages
npm run preview
```

Abra [http://127.0.0.1:4181/koine-estudos/](http://127.0.0.1:4181/koine-estudos/). Essa prévia serve somente o diretório compilado.

## Estrutura

- [src/main.ts](src/main.ts): bootstrap do Angular e roteador por hash.
- `src/app/app.component.*`: navegação, busca global, tema e layout.
- [src/app/pages/](src/app/pages/): início, percursos, aulas, artigos, progresso e apresentação.
- [src/app/study/](src/app/study/): serviço de sessões e componentes de flashcards/prática.
- [src/app/words/](src/app/words/): repertório com busca, filtros e paginação.
- [content.service.ts](src/app/content.service.ts) e [progress.service.ts](src/app/progress.service.ts): conteúdo e persistência.
- [src/app/models.ts](src/app/models.ts): tipos e definições do curso.
- [core.js](core.js) e [catalog.js](catalog.js): lógica pura de revisão, seleção e indexação, com declarações TypeScript.
- [appearance.js](appearance.js): canvas com ciclo de vida integrado ao componente de início.
- [ourforms.css](ourforms.css): identidade visual, tipografia e adaptação dos temas claro/escuro, com fontes locais.
- [angular.json](angular.json): build, estilos e lista explícita dos arquivos públicos.
- [src/index.html](src/index.html): documento de entrada; a saída compilada fica em `dist/koine/browser/`.

## Publicar no GitHub Pages

O [workflow de Pages](.github/workflows/pages.yml) instala pelo lockfile, executa `npm run check` e publica **somente `dist/koine/browser`**. Em Settings → Pages, a origem é **GitHub Actions**. Pushes para `main` e execuções manuais pelo Actions publicam a aplicação após as verificações.

O build usa `--base-href /koine-estudos/`. Se o repositório mudar de nome, ajuste `build:pages` no package.json. As rotas por hash preservam os endereços anteriores, inclusive os links antigos de aulas, sem exigir regras de servidor. A chave do localStorage continua vinculada ao mesmo caminho, preservando o progresso anterior no mesmo navegador/origem.

Não envie `tmp/`, a biblioteca de PDFs, `node_modules/`, caches Angular ou arquivos pessoais. Esses diretórios não integram os assets do build nem o artefato publicado. Os arquivos compilados não precisam ser adicionados ao Git.

## Editar o conteúdo

- [data/morphology.json](data/morphology.json): aulas e exercícios de morfologia.
- [data/syntax.json](data/syntax.json): aulas e exercícios de sintaxe.
- [data/vocabulary-lessons.json](data/vocabulary-lessons.json): aulas e exercícios de vocabulário.
- [data/semantics.json](data/semantics.json): 48 aulas e exercícios de semântica, agrupados em 12 módulos.
- `data/articles-morphology.json`, `data/articles-syntax.json`, `data/articles-vocabulary.json` e `data/articles-semantics.json`: artigos de aprofundamento.
- [data/vocabulary.json](data/vocabulary.json): lemas, glossas, frequências e metadados.
- [CONTRIBUTING-CONTENT.md](CONTRIBUTING-CONTENT.md): formato das lições e questões.

IDs estáveis preservam o vínculo com o histórico local. Campos `kind` suportados: `choice`, `parse`, `match` e `order`. As respostas sempre são escolhidas pela interface. Após editar conteúdo, execute as verificações e publique o novo build. O workflow faz isso automaticamente nos pushes para main.

Os scripts [vocabulary-fetch.py](scripts/vocabulary-fetch.py) e [vocabulary-build.py](scripts/vocabulary-build.py) reproduzem a seleção independente usando dados abertos fixados por commit e checksum. A comparação bibliográfica privada não é requisito para executar o site ou reproduzir a seleção. A pasta `tmp/` é excluída do Git; ali ficam caches e materiais de conferência que **não devem ser publicados**.

### Áudio erasmiano

O reprodutor aceita um campo opcional, por exemplo `"audio": "./assets/audio/logos.mp3"`, em uma entrada do repertório. A reprodução aparece no flashcard daquele vocábulo. Hospedar gravações próprias no GitHub Pages não exige uma API de áudio paga. Esta versão não inclui uma coleção gravada: só devem ser adicionados arquivos próprios ou com licença de redistribuição verificada. Registre os créditos em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Não se usa voz moderna do navegador como substituto da pronúncia erasmiana.

## Referências e licenças

Porter, Reed e O’Donnell orientam a morfologia; *Idioms*, de Porter, orienta a sintaxe. Wallace é identificado como complemento/comparação. Os artigos e exercícios têm redação produzida para este projeto com assistência de IA, exemplos didáticos próprios e referências específicas.

- Código original publicado sob os termos atuais: **direitos reservados; reutilização mediante autorização**, em [LICENSE](LICENSE).
- Materiais didáticos originais e dados identificados: **CC BY 4.0**, em [CONTENT-LICENSE.md](CONTENT-LICENSE.md).
- Fontes: **SIL OFL 1.1**.
- Dados MACULA e texto SBLGNT subjacente: **CC BY 4.0**, com atribuições e transformações em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Enquanto o repositório for público, os [Termos de Serviço do GitHub](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#5-license-grant-to-other-users) permitem visualizar e fazer fork dentro da plataforma. A reserva de direitos não bloqueia essa funcionalidade nem concede, por si, autorização para reutilizar o código em outros projetos ou publicar cópias do site.

A mudança não revoga as permissões validamente concedidas às versões anteriores sob MIT, nem as licenças próprias dos conteúdos e componentes identificados. Essas permissões continuam aplicáveis ao material assim licenciado, inclusive quando reutilizado posteriormente. A última versão antes da mudança está no commit [e8fd843](https://github.com/LaylsondeAlbuquerque/koine-estudos/tree/e8fd84392a5ae7182336a48f6d66b8997612e4b5).

As gramáticas e os léxicos consultados não são redistribuídos. Não há PDFs, extrações dos livros, exercícios editoriais, segredos ou dados de alunos no projeto público. Os textos e análises podem ser revisados conforme novas fontes forem conferidas.
# Leitura do Novo Testamento

A rota `#/reading` filtra versículos do SBLGNT por todos os lemas aprendidos no progresso existente. O índice é carregado ao abrir a aba; textos são carregados por livro, com páginas de até 30 versículos. Revisão manual bloqueia a palavra conforme a regra existente. Não há alteração de progresso ao ler.

Os flashcards e a prática de vocabulário também oferecem seleção por livro. O seletor mostra quantos lemas distintos faltam aprender em cada livro, incluindo nomes próprios, conforme o progresso real. A ordem pode seguir frequência dentro do livro (desempate por primeira aparição) ou primeira aparição no texto. O estado de aprendizado é aplicado depois da seleção do livro; a sessão usa a ordem escolhida. O conjunto principal tem apenas quatro opções: NT completo, livro, mais frequentes e nível selecionado. Revisões agendadas e palavras nunca praticadas ficam no seletor de estado, sem duplicar opções de conjunto. Os dados `data/reading/vocabulary-books.json` são gerados junto com a leitura e carregados somente quando o aluno escolhe estudar por livro. Frequências são de ocorrências; progresso conta lemas únicos, sem contar cada flexão separadamente.

Para regenerar os dados: `npm run reading:build`. O script aceita `--text-dir`, `--tsv`, `--vocab`, `--out` e `--audit` quando executado diretamente com Python. As fontes padrão ficam em `fontes-locais/sblgnt/sblgnt-text-fonte/data/sblgnt/text` e `fontes-locais/macula-greek/SBLGNT/tsv/macula-greek-SBLGNT.tsv`. São arquivos locais, não distribuídos no build. O TSV deve coincidir com o checksum fixado no vocabulário. O site publicado utiliza somente os derivados `data/reading/*.json`, gerados previamente; não requer Python nem acesso às fontes originais durante a navegação.

O relatório local `tmp/reading-audit/report.json` contém checksums dos 27 livros e vocabulário, variantes aceitas, amostras e medições. Nesta versão: 7.939 versículos, 137.741 palavras, nenhum versículo excluído por alinhamento e teto de 7.939 versículos (100%) com o repertório completo aprendido. A comparação de formas ignora caixa e acentos, mas mantém os lemas exatos e registra a variante pontual de Moisés. Duas correções ortográficas na exibição e a pesquisa das divergências estão em `docs/reading-orthography.md`. Não se eliminam segundos acentos corretos antes de enclíticas. Não há dependências lexicais externas após a ampliação. Nomes próprios classificados por ocorrência são dispensados; numerais seguem o aprendizado. Isso mede vocabulário, não compreensão. Colchetes editoriais são preservados na exibição.

Para regenerar o repertório, execute `python scripts/vocabulary-build.py` e `python scripts/vocabulary-validate.py`, usando o cache MACULA fixado em `tmp/`. As glosas ampliadas e as correções delimitadas estão versionadas em `scripts/vocabulary-glosses-full.json` e `scripts/vocabulary-expansion-overrides.json`; a procedência inglesa está em `scripts/vocabulary-expansion-sources.json`. A geração normal é local. `vocabulary-expand.py --translate` é uma preparação opcional das glosas, exige rede e os arquivos Dodson fixados em `tmp/vocabulary-expansion`, e não faz parte do build publicado.

Os dados SBLGNT e MACULA mantêm CC BY 4.0 e atribuições em `THIRD_PARTY_NOTICES.md`, independentemente das restrições do código da aplicação. A geração mantém a forma SBLGNT; não importa glossas nem domínios MARBLE. Para verificar: `npm run check` (inclui testes de dados reais, filtros reativos e integridade do artefato).
