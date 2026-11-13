# Grafia e alinhamento da leitura — revisão de 13/11/2026

O gerador passou a ignorar caixa e acentos agudo, grave e circunflexo somente na comparação das **formas na mesma posição do mesmo versículo**. Conserva espíritos, diérese, iota subscrito, letras, quantidade e ordem dos tokens. Lemas continuam sendo comparados por NFC exato: τίς/τις, ἄρα/ἆρα e εἰμί/εἶμι não são fundidos no vocabulário nem no progresso.

As 25 diferenças anteriormente bloqueantes correspondem a 23 versículos: seis diferenças de caixa, 14 de agudo/grave, três de acento adicional, uma de presença de acento e uma variante do nome Moisés. As formas originais de ambas as fontes são conservadas em `tmp/reading-audit/report.json`, em `acceptedVariants`. As duas intervenções na grafia exibida são registradas em `displayCorrections` no relatório e nos metadados públicos do índice. Nenhuma fonte local foi sobrescrita.

## Critério acadêmico

Dois acentos não constituem, por si, erro. Uma proparoxítona ou properispômena pode receber um agudo adicional antes de enclítica (Smyth §183; Goodell §21). Por isso, não se elimina automaticamente o segundo acento do corpus. Por exemplo, em João 7:34 e 7:36, `ζητήσετέ με` é mantido. O mesmo vale para `οἶκός ἐσμεν` em Hebreus 3:6.

| Ocorrência | Decisão para o texto exibido | Fundamento |
|---|---|---|
| João 7:34 e 7:36, εὑρήσετε/εὑρήσετέ | Manter εὑρήσετε do SBLGNT local | Não há με depois do verbo no texto-base selecionado. Um segundo agudo não é justificado por uma enclítica subsequente. Trata-se de aplicação da regra ao contexto local; algumas outras tradições textuais incluem με. |
| Lucas 8:20, θέλοντες/θέλοντές | Manter σε θέλοντες do SBLGNT local | Nesta ordem, σε precede o particípio. θέλοντές σε é uma sequência gramaticalmente possível e correta com outra ordem textual; não é a sequência deste snapshot. |
| João 10:29, ἐστίν/ἐστιν | Manter ἐστίν | Enclítica dissilábica após paroxítona pode conservar agudo na última sílaba (Smyth §§183d, 187e). A forma anterior é corrigida para μείζων, conforme abaixo. |
| João 8:5, Μωσῆς/Μωϋσῆς | Exibir Μωσῆς e vincular ao lema Μωϋσῆς | Mounce documenta as duas grafias do mesmo nome. A equivalência está limitada à posição `JHN 8:5!5` e exige o lema esperado. Não se apaga υ ou diérese genericamente. |
| João 8:9, δέ/δὲ | Corrigir o texto exibido para δὲ | A conjunção precede ἀκούσαντες, sem pausa nem enclítica entre elas; a regra geral pede grave (Smyth §154). |
| João 10:29, μεῖζων (compartilhado pelos dois snapshots) | Corrigir para μείζων | A última sílaba -ων é longa. A penúltima acentuada exige agudo, não circunflexo (Smyth §§164, 166; Porter, regras gerais de acentuação). É correção ortográfica, sem trocar ω por ο nem escolher outra leitura textual. |
| Demais diferenças de caixa e agudo/grave | Manter a grafia SBLGNT local | Caixa é editorial; a alternância de agudo/grave depende do contexto. Smyth §154 observa variação antes de vírgula. Não se atribui erro a toda diferença entre as edições. |

As conclusões contextuais acima são aplicações das regras gramaticais; não são afirmações de que a gramática examinou esses versículos específicos. A confirmação de 100% de alinhamento refere-se aos arquivos fixados, não à revisão acadêmica de todos os lemas, glosas e sinais do Novo Testamento. Não se faz normalização universal da grafia exibida.

## Fontes consultadas

- Porter, Reed e O’Donnell, *Fundamentals of New Testament Greek*, trecho local `Fundamentals, alphabeth - texto de consulta.md`, seção “General Rules of Accentuation”, regras 3–5. Foi consultado apenas como referência, sem redistribuir o trecho.
- [Smyth, Greek Grammar, §§149–188](https://ccel.org/s/smyth/grammar/html/smyth_1f_uni.htm): quantidade da última sílaba, alternância agudo/grave e enclíticas.
- [Goodell, Proclitics and Enclitics, §§19–21](https://dcc.dickinson.edu/grammar/goodell/proclitics-and-enclitics): acento adicional e formas enclíticas.
- [Mounce, Μωϋσῆς](https://www.billmounce.com/greek-dictionary/moyses): grafias Μωϋσῆς e Μωσῆς.
- [SBLGNT, fontes oficiais](https://sblgnt.com/download/): procedência da edição; a implementação usa os arquivos locais cujos hashes são registrados pelo gerador.

## Resultado

7.939 versículos alinhados de 7.939; nenhuma dependência lexical externa com o repertório integral. Todos podem ficar disponíveis segundo as regras de aprendizagem. Isso não certifica compreensão de sintaxe, semântica ou contexto.
