# Metodologias das Consultas Q1 a Q13

Este documento descreve a metodologia usada no backend e nas consultas SQL das questoes Q1 a Q13. A analise foi feita a partir dos arquivos em `dashboard/backend/app`, `Banco/init.sql`, `questoes/q*/consultas/*.sql`, `questoes/q*/respostas/*` e `dashboard/backend/app/question_registry.json`.

## Como o backend trabalha

O backend FastAPI nao recalcula as consultas SQL a cada requisicao. Ele atua como adaptador de respostas ja exportadas.

Fluxo geral:

1. As consultas SQL leem as tabelas do schema `grupo4`.
2. Os resultados sao gravados em arquivos de resposta, normalmente em formato textual de saida do `psql` ou CSV.
3. O backend le `question_registry.json` para saber quais arquivos pertencem a cada questao.
4. `DashboardService` carrega os arquivos de resposta, o SQL original e os metadados da questao.
5. `parser.py` converte saidas `psql` e CSV em tabelas estruturadas.
6. `FilterEngine` aplica filtros por ano, eixo, partido, UF, deputado, escolaridade, busca textual, ordenacao e paginacao.
7. Os adapters de `dashboard/backend/app/adapters/questions.py` transformam as tabelas em payloads com cards, grafico, tabela principal, tabelas complementares e painel SQL.

Entidades centrais do banco:

- `deputados`: cadastro parlamentar, legislatura, nome civil e escolaridade.
- `gastos`: despesas parlamentares, valor liquido, fornecedor, categoria, partido e UF.
- `proposicoes`: proposicoes legislativas e situacao.
- `proposicoes_autores`: relacao entre proposicoes e autores.
- `proposicoes_temas`: temas das proposicoes.
- `votacoes`: votacoes nominais.
- `votacoes_votos`: votos individuais dos deputados.
- `votacoes_orientacoes`: orientacao oficial das bancadas.
- `votacoes_objetos`: proposicoes associadas a votacoes.
- `eventos` e `eventos_presenca_deputados`: presenca em eventos e plenario.
- `partidos_ideologia`: classificacao ideologica dos partidos.

## Q1 - Gastos por deputado

Objetivo: gerar um ranking global de gastos por deputado.

Entidades relacionadas:

- `gastos`
- `deputados`

Passo a passo da consulta:

1. Agrupa a tabela `gastos` por `id_deputado`.
2. Soma `valor_liquido` para obter `gasto_total`.
3. Calcula o perfil dominante de partido e UF de cada deputado a partir das ocorrencias em `gastos`.
4. Em caso de empate no perfil, prioriza mais ocorrencias, maior gasto no partido, UF e partido.
5. Junta o total de gastos com `deputados`.
6. Usa `nome_civil` quando existe; caso contrario usa `nome`.
7. Ordena por `gasto_total` decrescente.

Resposta gerada:

- Arquivo: `questoes/q1/respostas/q1_gastos_deputados.txt`
- Colunas principais: `id_deputado`, `nome`, `sigla_uf`, `sigla_partido`, `gasto_total`.
- Resultado observado: ranking global de todos os anos, liderado por deputados com gasto total acima de R$ 2 milhoes.

Solucao no backend:

O adapter da Q1 monta cards de gasto total geral, media por deputado, maior gasto individual e total de deputados analisados. O grafico e uma barra horizontal com os 15 maiores gastos.

## Q2 - Eixos tematicos e nuvem de palavras

Objetivo: medir a atuacao parlamentar por tema/eixo e gerar insumos para nuvens de palavras.

Entidades relacionadas:

- `proposicoes`
- `proposicoes_autores`
- `deputados`
- `proposicoes_temas`
- Views/tabelas auxiliares de resposta, como `resposta_temas_eixos`, `resposta_proposicoes_situacoes` e `resposta_tokens_validos_proposicoes`.

Passo a passo da consulta:

1. Seleciona proposicoes entre 2023 e 2026.
2. Relaciona cada proposicao ao deputado autor por `proposicoes_autores`.
3. Relaciona cada proposicao ao seu tema/eixo.
4. Classifica proposicoes aprovadas por situacao.
5. Remove duplicidades com `DISTINCT`.
6. Conta proposicoes por deputado e tema.
7. Conta proposicoes aprovadas por deputado e tema.
8. Identifica, para cada deputado, o tema de maior atuacao.
9. Gera uma tabela de tokens por ano para nuvens de palavras, limitada aos 200 termos mais frequentes por ano.

Resposta gerada:

- Arquivos: `q2_eixos_nuvem_palavras.txt` e `q2_eixo_nuvens_complemento.txt`.
- O resumo observado indica 626 deputados, 32 temas, 37.125 registros deputado-tema, 157.415 proposicoes e 1.604 proposicoes aprovadas no periodo 2023-2026.

Solucao no backend:

O adapter da Q2 agrega os dados quando nao ha filtro de ano, gera grafico do tipo `wordcloud_images` e adiciona tabela complementar com ranking consolidado de eixos.

## Q3 - Votos por eixo principal da votacao

Objetivo: mostrar como deputados votaram em votacoes classificadas por eixo tematico.

Entidades relacionadas:

- `votacoes_votos`
- `deputados`
- `proposicoes_temas`

Passo a passo da consulta:

1. Define uma tabela interna `temas_eixos`, mapeando codigos de tema para eixos maiores.
2. Extrai votos nominais de 2023 a 2026.
3. Restringe a deputados da 57a legislatura.
4. Extrai `id_proposicao` a partir de `id_votacao`.
5. Tenta resolver o eixo via `proposicoes_temas`.
6. Usa um mapeamento manual de fallback para proposicoes sem eixo resolvido.
7. Agrupa por `ano_dados`, deputado e eixo.
8. Conta votos `Sim`, votos `Nao`, abstencoes e total.

Resposta gerada:

- Arquivo textual: `questoes/q3/respostas/q3_voto_deputado_tema.txt`.
- Artefatos normalizados: `q3_resumos_agregados.csv`, `q3_votos_min.csv`, `q3_classificacao_votacoes.csv`.
- A resposta traz linhas por deputado, ano e eixo, com totais de voto.

Solucao no backend:

O backend usa `Q3NormalizedAdapter`. Sem deputado selecionado, a tela retorna estado vazio para evitar carregar detalhe excessivo. Com deputado filtrado, mostra votos individuais, resumo por tipo de voto e grafico de distribuicao.

## Q4 - Escolaridade da 57a legislatura

Objetivo: distribuir os deputados da 57a legislatura por escolaridade.

Entidades relacionadas:

- `deputados`
- Q1 como fonte auxiliar de partido e UF no adapter.

Passo a passo da consulta:

1. Seleciona deputados distintos com `id_legislatura_final = 57`.
2. Usa `nome_civil` quando disponivel.
3. Normaliza escolaridade vazia ou nula para `Nao informado`.
4. Agrupa por escolaridade.
5. Conta deputados por grupo.
6. Gera tambem arquivo complementar com lista nominal.

Resposta gerada:

- Arquivos: `q4_escolaridade.txt` e `q4_escolaridade_complementar.txt`.
- Resultado observado: `Superior` concentra 352 deputados; depois aparecem `Pos-Graduacao`, `Mestrado`, `Superior Incompleto` e `Nao informado`.

Solucao no backend:

O adapter da Q4 usa a tabela complementar para montar distribuicao e lista nominal. Ele tambem enriquece deputados com partido e UF a partir da resposta da Q1 para permitir filtros.

## Q5 - Fornecedores com maior total pago

Objetivo: ranquear fornecedores por valor recebido da cota parlamentar.

Entidades relacionadas:

- `gastos`
- `deputados`

Passo a passo da consulta:

1. Filtra deputados da 57a legislatura.
2. Mantem apenas fornecedores nao nulos.
3. Mantem apenas `valor_liquido > 0`.
4. Normaliza caracteres problemáticos no nome do fornecedor, como `|`.
5. Agrupa por ano e fornecedor.
6. Conta lancamentos e soma `valor_liquido`.
7. Calcula ranking anual pelo total pago.
8. Calcula percentual de participacao do fornecedor no total anual.
9. Gera ranking global consolidado.
10. No complemento, calcula top fornecedores por categoria de gasto.

Resposta gerada:

- Arquivos: `q5_fornecedores.txt` e `q5_fornecedores_complemento.txt`.
- Resultado observado: companhias aereas aparecem com alta concentracao nos anos cheios; em 2023 o top 30 concentrou 30,88% do total.

Solucao no backend:

A Q5 usa tabela principal, resumo executivo e complemento. O grafico e de barras horizontais por `total_pago`.

## Q6 - Correlacoes por escolaridade

Objetivo: comparar indicadores medios de atividade parlamentar por escolaridade.

Entidades relacionadas:

- `deputados`
- `gastos`
- `votacoes_votos`
- `votacoes_orientacoes`
- `proposicoes_autores`
- `eventos`
- `eventos_presenca_deputados`

Passo a passo da consulta:

1. Monta `resposta_deputados_ativos` com deputados que aparecem em gastos, votos, proposicoes ou presencas.
2. Soma gastos por deputado e ano.
3. Calcula fidelidade partidaria comparando `votacoes_votos.voto` com `votacoes_orientacoes.orientacao`.
4. Conta proposicoes distintas por deputado e ano.
5. Conta presencas em eventos e presencas em plenario.
6. Junta tudo ao cadastro de deputados e escolaridade.
7. Agrupa por `ano_dados` e `escolaridade`.
8. Calcula medias de gasto, fidelidade, proposicoes, presenca em eventos e presenca em plenario.
9. Gera arquivos especificos Q6A a Q6E para cada indicador.
10. A consulta complementar calcula eta quadrado para medir forca de associacao entre escolaridade e indicadores numericos.

Resposta gerada:

- Arquivos: `q6_escolaridade_correlacoes.txt`, `q6a` a `q6e` e `q6_eta_complementar.txt`.
- Resultado observado: a tabela principal tem 53 linhas por ano/escolaridade e apresenta medias numericas por indicador.

Solucao no backend:

O adapter da Q6 combina os multiplos arquivos em graficos/tabelas de comparacao. A analise e descritiva; o eta quadrado e tratado como complemento de associacao, nao causalidade.

## Q7 - Indice de custo-beneficio

Objetivo: estimar um indicador de beneficio legislativo em relacao ao gasto parlamentar.

Entidades relacionadas:

- `gastos`
- `deputados`
- `proposicoes`
- `proposicoes_autores`
- `eventos_presenca_deputados`

Passo a passo da consulta:

1. Soma gastos por deputado e ano.
2. Conta proposicoes por deputado e ano.
3. Conta proposicoes aprovadas por situacao textual da proposicao.
4. Conta presencas por deputado e ano.
5. Define perfil dominante de UF e partido por ano e no global.
6. Calcula `beneficio` com a formula:

   `qtd_proposicoes * 1.5 + proposicoes_aprovadas * 36.0 + presenca_total * 0.1`

7. Calcula `custo_beneficio = beneficio / gasto_total`.
8. Gera ranking anual top 30 por beneficio.
9. Gera ranking global consolidado.
10. Gera complemento com ranking completo.

Resposta gerada:

- Arquivos: `q7_custo_beneficio.txt` e `q7_custo_beneficio_complemento.txt`.
- Resultado observado: em 2023 a media de beneficio foi 455,69 e o maior beneficio foi 4.712,50; nos anos seguintes os valores mudam bastante por diferencas na contagem de proposicoes e presencas.

Solucao no backend:

O grafico e `scatter`, cruzando `gasto_total` e `beneficio`. A interpretacao deve considerar que o indice bruto pode favorecer deputados com gasto muito baixo.

## Q8 - Influencia legislativa

Objetivo: medir influencia por participacao em proposicoes aprovadas e complementar com similaridade de voto.

Entidades relacionadas:

- `proposicoes`
- `proposicoes_autores`
- `deputados`
- `votacoes_votos`

Passo a passo da consulta principal:

1. Classifica proposicoes como aprovadas quando `descricao_situacao` contem termos como `aprov`, `sancao`, `norma juridica` ou `promulg`.
2. Conta proposicoes de autoria por deputado.
3. Conta proposicoes aprovadas por deputado.
4. Calcula o total global de proposicoes aprovadas.
5. Calcula `pct_aprovadas = 100 * proposicoes_aprovadas_do_deputado / total_global_aprovadas`.
6. Ordena o ranking por `pct_aprovadas`, quantidade aprovada, nome e id.
7. Gera complemento com ranking completo.

Passo a passo do complemento por voto:

1. Seleciona votacoes informativas, com pelo menos 50 votos binarios e proporcao de `Sim` entre 0,10 e 0,90.
2. Codifica votos: `Sim = 1`, `Nao = -1`, `Abstencao = 0`.
3. Remove votos sem codificacao.
4. Mantem deputados com pelo menos 100 votos validos.
5. Compara pares de deputados em votacoes comuns.
6. Exige pelo menos 100 votacoes comuns e cobertura minima de 0,50.
7. Calcula votos iguais e similaridade.
8. Mantem arestas com similaridade minima de 0,75.
9. O SQL gera o grafo ponderado; o script Python de Leiden aplica comunidades quando usado.

Resposta gerada:

- Arquivos: `q8_influencia.txt`, `q8_influencia_complemento.txt`, `q8_influencia_por_voto_extra.txt`.
- Resultado observado: 600 deputados com autoria, 183.103 proposicoes de autoria, 402 proposicoes aprovadas globais e 304 deputados com proposicoes aprovadas.

Solucao no backend:

O adapter exibe ranking de influencia em barras horizontais por `pct_aprovadas` e tabelas complementares.

## Q9 - Vies ideologico e partidario

Objetivo: classificar partidos por ideologia, medir comportamento por votacao e calcular score de vies dos deputados.

Entidades relacionadas:

- `partidos_ideologia`
- `votacoes_votos`
- `votacoes_orientacoes`
- `votacoes_objetos`

Passo a passo da consulta:

1. Lista partidos por ideologia.
2. Gera catalogo completo partido x ideologia.
3. Para cada votacao e ideologia, conta votos `Sim`, `Nao`, outros e total.
4. Calcula percentual de `Sim` por campo ideologico.
5. Agrega por partido para calcular media de percentual de `Sim`.
6. Compara maioria do partido com orientacao oficial da bancada.
7. Gera detalhe por votacao e partido com orientacao.
8. Calcula resumo por deputado: total de votos, votos `Sim`, `Nao`, outros, seguiu/contrariou orientacao e percentual de aderencia.
9. Identifica votacoes polarizadas quando a diferenca entre esquerda e direita e maior ou igual a 30 pontos percentuais.
10. Calcula score de vies individual: 0 indica alinhamento com esquerda; 100 indica alinhamento com direita, usando apenas votacoes polarizadas.
11. Exporta detalhe completo para auditoria em CSV.

Resposta gerada:

- Arquivos: `q9_vies_deputado.txt`, `q9_vies_deputado_detalhe.csv` e `q9_votos_por_votacao.txt`.
- Resultado observado: o catalogo possui 21 partidos classificados em centro, direita e esquerda. O arquivo tambem contem tabelas volumosas por votacao.

Solucao no backend:

O backend evita carregar `q9_votos_por_votacao.txt` sem filtro de busca para nao pesar a pagina. O grafico principal e do tipo `sankey`, relacionando ideologia e partido.

## Q10 - Alinhamento interno dos partidos

Objetivo: medir a disciplina dos partidos em relacao a orientacao oficial da bancada.

Entidades relacionadas:

- `votacoes_votos`
- `votacoes_orientacoes`
- `partidos_ideologia`

Passo a passo da consulta:

1. Junta votos individuais com orientacoes de bancada.
2. Aceita correspondencia exata da bancada ou bancada/federacao que contenha a sigla do partido.
3. Exclui orientacoes sem diretriz clara: `Liberado`, `Abstencao`, `Obstrucao`.
4. Exclui votos tecnicos ou ausencias: `Abstencao`, `Artigo 17`, `Obstrucao`.
5. Compara voto do deputado com orientacao do partido.
6. Conta votos alinhados e contrarios por partido.
7. Calcula `pct_alinhamento`.
8. Repete a analise por ano.
9. Gera disciplina individual por deputado.

Resposta gerada:

- Arquivo: `q10_alinhamento_partidos.txt`.
- Resultado observado: o ranking consolidado mostra `MISSAO` com 100% em base pequena, `NOVO` com 99,53%, `PSOL` com 98,76% e `PT` com 98,50%.

Solucao no backend:

A Q10 usa barras verticais de percentual de alinhamento e filtros por partido.

## Q11 - Rankings partidarios

Objetivo: ordenar partidos por frequencia em votacoes, proposicoes, gastos e gerar score composto para nuvem.

Entidades relacionadas:

- `votacoes_votos`
- `proposicoes_autores`
- `gastos`
- `partidos_ideologia`

Passo a passo da consulta:

1. Q11.a: conta votacoes distintas e votos registrados por partido.
2. Q11.a anual: repete a contagem por ano.
3. Q11.b: conta proposicoes distintas por partido autor.
4. Q11.b anual: repete por ano.
5. Q11.c: soma `valor_liquido` por partido e calcula gasto medio por deputado.
6. Q11.c anual: repete por ano.
7. Q11.d: une partidos que aparecem em votacoes, proposicoes ou gastos.
8. Normaliza cada dimensao em escala 0-100 por min-max.
9. Soma as dimensoes normalizadas para `score_total`.
10. Calcula `frequencia = score_total / 3` para nuvem de palavras.

Resposta gerada:

- Arquivo: `q11_ranking_partidos.txt`.
- Resultado observado: PL lidera o ranking consolidado de frequencia nas votacoes, com 1.541 votacoes participadas e 85.540 votos registrados; UNIAO e PT aparecem logo depois.

Solucao no backend:

A Q11 e registrada como `wordcloud_images`, mas o arquivo contem varias tabelas de ranking que alimentam a visualizacao e a analise partidaria.

## Q12 - Deputado x fornecedor

Objetivo: identificar os pares deputado-fornecedor com maior total pago.

Entidades relacionadas:

- `gastos`
- `deputados`

Passo a passo da consulta:

1. Cria perfil dominante de UF e partido por deputado e ano.
2. Cria perfil dominante global.
3. Junta gastos com deputados.
4. Normaliza fornecedor substituindo `|` por `/`.
5. Agrupa por ano, deputado, UF, partido e fornecedor.
6. Conta lancamentos e soma `valor_liquido`.
7. Gera resumo anual com numero de pares, deputados, fornecedores, lancamentos e total pago.
8. Ranqueia os top 30 pares por total pago em cada ano.
9. Calcula percentual do par no total anual.
10. Gera ranking global consolidado.
11. Gera complemento com ranking completo.

Resposta gerada:

- Arquivos: `q12_deputado_fornecedor.txt` e `q12_deputado_fornecedor_complemento.txt`.
- Resultado observado: 2023 teve 46.109 pares deputado-fornecedor, 562 deputados, 21.868 fornecedores e R$ 236.151.266,00 pagos.

Solucao no backend:

O grafico e barra horizontal por fornecedor/total pago, com filtros de ano, partido, UF e deputado.

## Q13 - Categorias de gasto por deputado

Objetivo: analisar categorias de despesa por deputado.

Entidades relacionadas:

- `gastos`
- `deputados`

Passo a passo da consulta:

1. Junta `gastos` com `deputados`.
2. Filtra deputados da 57a legislatura.
3. Mantem apenas `valor_liquido > 0`.
4. Usa `nome_civil` quando disponivel.
5. Agrupa por ano, deputado, UF, partido e `descricao_despesa`.
6. Conta lancamentos e soma gasto total.
7. Gera resumo anual com deputados, lancamentos, gasto total e media por deputado.
8. Gera ranking anual de deputado x categoria.
9. Calcula percentual do par no total anual.
10. Gera ranking global consolidado.
11. No complemento, consolida gastos por categoria por ano e no global.

Resposta gerada:

- Arquivos: `q13_categorias_gasto_deputado.txt` e `q13_categorias_gasto_deputado_complemento.txt`.
- Resultado observado: em 2023 foram 561 deputados, 213.240 lancamentos, R$ 245.280.034,40 de gasto total e media de R$ 437.219,31 por deputado.

Solucao no backend:

O grafico e `treemap`, usando `descricao_despesa` como categoria e `gasto_total` como valor. O adapter remove card de `ano_dados` e limita complementos para manter a resposta mais manejavel.

## Observacoes gerais

1. As consultas de gastos usam principalmente `valor_liquido`, que representa o valor efetivamente considerado apos glosas/ajustes.
2. Algumas questoes usam filtros da 57a legislatura explicitamente; outras trabalham sobre o periodo 2023-2026 conforme a disponibilidade dos dados.
3. As respostas textuais contêm alguns problemas de codificacao em caracteres acentuados, mas o backend tenta leitura com `utf-8` e `latin-1`.
4. A API e orientada a visualizacao: cada query vira uma combinacao de resumo, grafico, tabela, complemento e painel SQL.
5. A Q3 e a Q9 recebem tratamento especial para evitar carregar arquivos grandes sem necessidade.
6. Q2, Q3 e Q8 possuem artefatos/etapas auxiliares alem do SQL principal.
