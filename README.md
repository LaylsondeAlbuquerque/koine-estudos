# Koiné

Um espaço aberto de estudo do grego do Novo Testamento, de **Laylson de Albuquerque** ([GitHub](https://github.com/LaylsondeAlbuquerque)).

Aplicação estática em português, preparada para GitHub Pages. Não requer servidor de aplicação, banco de dados, chave de API, assinatura ou cadastro de alunos. Não há dependências de execução nem etapa de build.

## Estudar

- **Morfologia:** padrões, paradigmas e parsing com respostas selecionadas.
- **Sintaxe:** compreensão de conceitos e relações nas orações; comparação de abordagens no nível avançado.
- **Vocabulário:** repertório superior a 950 lemas, flashcards, associações e um núcleo prioritário de 300 palavras.
- Cada área tem percurso, artigos, flashcards e prática, distribuídos em Fundamentos, Essencial, Aprofundamento e Avançado.
- O repertório é pesquisável em grego ou português, inclusive sem acentos. Os artigos também têm busca.
- Tema noturno inicial com alternância para o claro e preferência salva no navegador. A home tem uma animação original de letras e palavras gregas, com pausa e respeito à preferência de movimento reduzido.
- Os flashcards revelam o verso ao selecionar a resposta; a prática combina desafios de escolha com confirmação, associação de pares, parsing e ordenação de blocos. As sessões priorizam perguntas ainda não vistas e alternam assuntos e atividades; um filtro pequeno termina sem duplicar questões para completar a quantidade solicitada.
- Os artigos atuais exibem discretamente “Texto produzido por IA”. Para futuros artigos de autoria humana, o campo opcional `author` identifica o autor no mesmo espaço.

O progresso é salvo **somente no navegador**. Um vocábulo é registrado como memorizado depois de acertos em três dias diferentes; um erro o devolve à revisão. Repetições no mesmo dia não aceleram esse marcador. É possível exportar/importar o histórico em Meu progresso. Leituras concluídas não equivalem a uma certificação de domínio.

O percentual do núcleo dos 300 é calculado das ocorrências no corpus identificado nos metadados. Trata-se de cobertura lexical por lema, não de compreensão de passagens. Consulte `data/vocabulary.json` para os números, a seleção independente e a conferência com o repertório bibliográfico.

## Executar localmente

Com Python 3 instalado, na pasta deste projeto:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Abra http://127.0.0.1:4173. Abrir `index.html` diretamente por `file://` não fornece o contexto HTTP necessário ao carregamento dos JSONs.

Com Node.js instalado, valide os dados e a lógica de revisão:

```sh
npm run check
python scripts/vocabulary-validate.py
```

Nenhuma instalação de pacotes é necessária. Os comandos de desenvolvimento não são necessários para visitar o site publicado.

## Publicar no GitHub Pages

1. Coloque os arquivos públicos deste projeto em um repositório. **Não envie `tmp/`**, a biblioteca de PDFs nem outros arquivos pessoais.
2. Em **Settings → Pages → Build and deployment**, escolha **Deploy from a branch**.
3. Selecione **main / (root)** e salve. O arquivo `.nojekyll` acompanha a aplicação.
4. Aguarde a implantação informada pelo GitHub. A aplicação usa caminhos relativos e rotas por hash, funcionando também em `https://usuario.github.io/nome-do-repositorio/`.

GitHub Pages atende a aplicação estática sem serviços adicionais pagos. O navegador precisa conseguir baixar inicialmente os arquivos do site; não há implementação de cache offline completo nesta versão.

## Editar o conteúdo

- `data/morphology.json`: morfologia.
- `data/syntax.json`: sintaxe.
- `data/vocabulary-lessons.json`: artigos de vocabulário.
- `data/vocabulary.json`: lemas, glossas, frequências e metadados.
- `CONTRIBUTING-CONTENT.md`: formato das lições e questões.

IDs estáveis preservam o vínculo com o histórico local. Campos `kind` suportados: `choice`, `parse`, `match` e `order`. As respostas sempre são escolhidas pela interface. Conteúdo novo não exige reconstruir o aplicativo.

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
