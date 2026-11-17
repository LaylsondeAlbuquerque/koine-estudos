# Como editar o visual do Koiné

## Onde procurar

| Alteração | Arquivo |
| --- | --- |
| Cores, fontes, margens compartilhadas e temas | `src/styles/tokens.css` |
| Ordem das folhas e integração do Tailwind | `src/styles.css` |
| Reset, títulos, parágrafos, fontes locais e tabelas | `src/styles/base.css` |
| Botões, campos, indicadores, busca e avisos | `src/styles/components.css` |
| Cabeçalho, menu superior, margens e rodapé | `src/styles/layout.css` |
| Página inicial e formações | `src/styles/home.css` |
| Percurso, níveis, aulas e artigos | `src/styles/learning.css` |
| Flashcards, prática e resultados | `src/styles/study.css` |
| Repertório, filtros, cartões e selo dos 300 | `src/styles/vocabulary.css` |
| Progresso e cópia de segurança | `src/styles/progress.css` |
| Toolbar lateral | `src/app/pages/area.component.css` |
| Seletor de aprendizado | `src/app/words/word-learning-toggle.component.css` |
| Ficha de flexões de uma palavra | `src/app/words/word-details.component.css` |
| Leitura do Novo Testamento | `src/app/pages/nt-reading.component.css` |

## Cores e temas

As variáveis ficam em `tokens.css`. `:root` define os valores do tema claro; `html[data-theme=dark]` redefine apenas as diferenças. Trocar de tema não depende de preferências do sistema: o atributo no HTML acompanha a escolha feita no site.

Principais variáveis:

- `--paper`: fundo da página; `--white`: fundo de campos e cartões.
- `--ink`: texto principal; `--muted`: texto secundário; `--line`: divisórias.
- `--blue`, `--green`, `--purple`, `--orange`, `--red`, `--yellow`: paleta.
- `--sans`, `--display`, `--greek`: texto, títulos e grego.
- `--site-gutter`, `--site-frame-width`: margens e largura centralizada.
- `--state-unlearned`, `--state-review`, `--state-learned`: estados do vocabulário.

O vermelho claro é `#E7000B`; o noturno é `#DF5B62`. Para mudar qualquer um, edite `--red` na seção correspondente. Bordas e controles que usam esse vermelho acompanham a mudança.

O atributo `data-learning-state` recebe `unlearned`, `review` ou `learned`. O mapa no fim de `tokens.css` define `--learning-color`; tanto o seletor quanto `.core-badge` usam essa variável. Não acrescente cores específicas ao selo, nem use `.pill.amber` para ele.

## Tamanho do seletor e do texto

Em `word-learning-toggle.component.css`:

- `width` do `input[type=range]`: comprimento do percurso.
- `height` das regras de `track`: espessura do trilho.
- `width` e `height` das regras de `thumb`: tamanho da bolinha.
- `.word-learning-label`: fonte e peso do rótulo; a escolha atual usa `tw:text-xl` e `tw:font-semibold`.
- A consulta `@container` organiza o texto acima do controle nos cartões estreitos.

Os rótulos em minúsculas ficam no array `labels`, em `word-learning-toggle.component.ts`. Alterar o texto não altera o estado salvo do aluno.

## Uma regra de organização

O HTML usa classes com significado, como `.learning-toggle` e `.study-rail-icon`. Os estilos ficam na folha do componente. Tailwind funciona como ferramenta de compilação de `@apply`, e as regras que precisam de CSS — pseudoelementos do slider, estados, animações e consultas responsivas — ficam no mesmo arquivo.

Exemplo:

```css
@reference "../../styles.css";

.learning-toggle {
  @apply tw:flex tw:items-center tw:justify-between tw:gap-3;
}
```

O caminho de `@reference` depende da pasta do componente. Ele permite usar o tema do Tailwind sem importar novamente o CSS global no componente.

Para editar um elemento, procure sua classe no arquivo indicado na tabela. Modifique o bloco existente, em vez de acrescentar outra regra no fim de uma folha para desfazer a anterior. Use variáveis da paleta para cores compartilhadas. Estados como hover/foco e regras responsivas devem acompanhar o componente. Evite `style` no HTML e novos `!important`.

As regras globais ficam na camada `components`, mantendo uma ordem explícita em `src/styles.css`. Os estilos locais do Angular são encapsulados no componente. Não resta uma folha com o nome do projeto que serviu de referência visual; a atribuição histórica continua em `THIRD_PARTY_NOTICES.md`.

## Conferir a alteração

```sh
npm run check
```

Confira também o elemento nos dois temas e em uma largura de celular. Testes automatizados verificam os estados e as interações; a conferência visual detecta problemas de espaçamento e contraste.
