# Revisão de código — 3 de novembro de 2026

> Registro da versão anterior à migração para Angular. As medições abaixo são daquela implementação; consulte README.md para a estrutura e os comandos atuais.

A revisão abrangeu os módulos JavaScript, as seis folhas de estilo, o HTML e os scripts de manutenção. Os textos didáticos, IDs das aulas, questões e vocábulos foram preservados.

## Correções

- A busca global abre um vocábulo mesmo quando outra área tem uma aula selecionada no filtro de prática.
- “Ir para o conteúdo” foca o conteúdo sem encerrar a atividade ou navegar para a home.
- Um link para a rota atual encerra a sessão e mostra a aula corretamente. Abrir links em outra aba mantém a sessão atual.
- É possível selecionar novamente o mesmo arquivo de progresso após falha ou cancelamento da importação.
- Backups com domínio ou caixa de revisão incompatíveis com a quantidade de acertos/dias são rejeitados.
- O feedback respeita a preferência de movimento reduzido.
- O gerador antigo de aulas de vocabulário foi desativado, pois sobrescreveria perguntas já revisadas.
- A prévia local serve uma lista explícita de arquivos públicos, sem listagem de diretórios, caches ou metadados Git.

## Trabalho repetido removido

- Relações entre aulas/artigos/níveis e textos de busca são indexados uma vez. A busca preserva corpo completo, acentos opcionais e ordem dos resultados.
- Flashcards selecionam apenas os distratores necessários, com cache limitado dos sentidos usados para evitar respostas ambíguas.
- As sessões preparam apenas as perguntas selecionadas, sem clonar todo o banco com JSON.
- Selecionar alternativas, associar pares ou ordenar blocos atualiza apenas a área do exercício, preservando o restante da página.
- Revisões lexicais usam o histórico de cada vocábulo; novas combinações aleatórias de pares não ampliam indefinidamente o mapa de respostas das aulas.
- A animação reutiliza pontos e caixas de colisão, mede cada glifo no início/carregamento da fonte e processa o ponteiro no ritmo dos quadros.

## Medições locais

| Rotina | Antes | Depois | Condição |
| --- | ---: | ---: | --- |
| Busca, 100 consultas | 434,84 ms | 19,74 ms | Mediana de cinco amostras; funções reais, português/grego, resultados HTML idênticos; índice já preparado |
| Primeira consulta | 7,35 ms | 4,95 ms | Índice inicialmente vazio; construção das relações medida separadamente em 0,35 ms |
| Alternativas de 250 cartões | 714,49 ms | 1,10 ms | Mediana de cinco amostras; repertório de 1.158 vocábulos e gerador aleatório determinístico |
| Medições de glifos, desktop | 5.490 chamadas | 88 chamadas | Canvas simulado, 240 ticks e 122 desenhos |

Esses números medem rotinas isoladas em Node e um harness de canvas. Não representam uma aceleração equivalente do site inteiro, tempo de rede, métricas de carregamento ou desempenho medido em celulares físicos.

## Conferência funcional

`npm run check` passou com 23 testes: regressões de navegação/importação/prática, equivalência das buscas e filtros, seleção de exercícios, alternativas lexicais e revisão espaçada. O validador conferiu 84 aulas, 506 questões, 84 artigos e as dependências reais de HTML/CSS/JavaScript. A validação de vocabulário conferiu as 1.158 entradas e suas frequências.

A prévia no navegador foi conferida em desktop e em 390×844 e 360×650: busca, abertura de flashcard a partir de outra área, frente/verso, seleção com confirmação, associação e contagem de pares, retorno à aula, atalho de conteúdo e filtros do repertório. Não houve erros registrados no console durante essa conferência.

No mobile, as letras da home ficam em faixas ao redor do texto, com espaço reservado também em telas baixas. Pausa, retomada e temas claro/escuro foram conferidos. O harness também verificou aba oculta, preferência de movimento reduzido e remoção de observers/listeners ao sair da home.
