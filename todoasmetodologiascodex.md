# Metodologias atualizadas das questoes

Este documento consolida as metodologias atuais das questoes usadas no projeto. A verificacao foi feita a partir dos arquivos em `questoes/q*/consultas`, `questoes/q*/respostas`, `questoes/q9_v2`, `questoes/q11_extra`, `dashboard/backend/app/question_registry.json` e scripts auxiliares de Q8/Q9.

## Visao geral do fluxo

O backend FastAPI nao executa as consultas SQL a cada requisicao. Ele funciona como camada de leitura, parse e adaptacao das respostas ja exportadas.

Fluxo geral:

1. As consultas SQL leem as tabelas padronizadas do projeto, principalmente `deputados`, `gastos`, `proposicoes`, `proposicoes_autores`, `proposicoes_temas`, `votacoes_votos`, `votacoes_orientacoes`, `votacoes_objetos`, `eventos`, `eventos_presenca_deputados` e `partidos_ideologia`.
2. Os resultados sao exportados para arquivos em `questoes/<questao>/respostas`.
3. `dashboard/backend/app/question_registry.json` informa titulo, grupo, arquivos de resposta, SQL fonte, colunas esperadas, filtros e tipo de grafico.
4. O backend carrega as respostas textuais ou CSV, interpreta tabelas no formato `psql`, aplica filtros e transforma os dados em cards, graficos, tabelas e painel SQL.
5. Algumas questoes possuem artefatos ou scripts auxiliares, especialmente Q2, Q3, Q8 e Q9 v2.

## Q1 - Gastos por deputado

Fonte atual:

- SQL: `questoes/q1/consultas/q1.sql`
- Resposta: `questoes/q1/respostas/q1_gastos_deputados.txt`
- Dashboard: id `q1`

Objetivo: ranquear deputados pelo gasto total.

Metodologia:

1. Agrega `gastos` por `id_deputado`.
2. Soma `valor_liquido` para calcular `gasto_total`.
3. Determina partido e UF a partir dos registros de gastos.
4. Junta o resultado com `deputados`.
5. Usa `nome_civil` quando disponivel; caso contrario usa `nome`.
6. Ordena do maior para o menor gasto.

Saida principal: `id_deputado`, `nome`, `sigla_uf`, `sigla_partido`, `gasto_total`.

No dashboard, a Q1 usa grafico de barras horizontais e filtros de partido, UF e deputado.

## Q2 - Eixos tematicos e nuvem de palavras

Fonte atual:

- SQL: `questoes/q2/consultas/q2.sql`
- Respostas: `q2_eixos_nuvem_palavras.txt`, `q2_eixo_nuvens_complemento.txt`
- Artefatos: `questoes/q2/artifacts/eixos_consolidado.json`, `questoes/q2/artifacts/eixos_counts_by_year.json`
- Dashboard: id `q2`

Objetivo: consolidar a producao legislativa por deputado, ano e tema/eixo, alem de alimentar nuvens de palavras anuais.

Metodologia:

1. Seleciona proposicoes no periodo coberto pelos dados do projeto, com foco em 2023-2026.
2. Relaciona proposicoes a autores por `proposicoes_autores`.
3. Cruza proposicoes com temas por `proposicoes_temas`.
4. Agrupa por `ano_dados`, deputado e tema.
5. Conta `qtd_proposicoes`.
6. Conta `proposicoes_aprovadas` a partir da situacao textual da proposicao.
7. Gera tabela analitica por deputado-tema.
8. Gera complemento consolidado de eixos.
9. Gera artefatos de nuvem de palavras por ano.

Saida principal: `ano_dados`, `id_deputado`, `nome`, `nome_civil`, `sigla_partido`, `sigla_uf`, `tema`, `qtd_proposicoes`, `proposicoes_aprovadas`.

No dashboard, a Q2 usa visualizacao de nuvens de palavras e filtros de eixo, deputado e ano.

## Q3 - Votos por eixo principal da votacao

Fonte atual:

- SQL: `questoes/q3/consultas/q3.sql`
- Resposta textual: `questoes/q3/respostas/q3_voto_deputado_tema.txt`
- Artefatos normalizados: `q3_resumos_agregados.csv`, `q3_votos_min.csv`, `q3_classificacao_votacoes.csv`, `q3_manifest.json`
- Dashboard: id `q3`

Objetivo: mostrar como deputados votaram em votacoes classificadas por eixo tematico principal.

Metodologia:

1. Trabalha com votos nominais de `votacoes_votos`.
2. Classifica cada votacao em um eixo principal antes da carga do dashboard.
3. Usa textos e associacoes de proposicoes para inferir eixo principal.
4. Mantem eixos secundarios apenas como contexto.
5. Gera uma linha por voto nominal unico.
6. Agrega votos por ano, deputado e eixo quando necessario.
7. Conta `Sim`, `Nao`, `Abstencao`, `Outro` e total.

Saida principal agregada: `ano_dados`, `eixo_principal`, `voto_sim`, `voto_nao`, `voto_abstencao`, `voto_outro`, `votos_total`.

No dashboard, a Q3 usa `Q3NormalizedAdapter`. Sem deputado filtrado, evita carregar detalhe excessivo; com deputado selecionado, mostra votos individuais e distribuicao por tipo de voto.

## Q4 - Escolaridade da 57a legislatura

Fonte atual:

- SQL: `questoes/q4/consultas/q4.sql`
- Respostas: `q4_escolaridade.txt`, `q4_escolaridade_complementar.txt`
- Dashboard: id `q4`

Objetivo: distribuir os deputados da 57a legislatura por escolaridade.

Metodologia:

1. Seleciona deputados unicos da 57a legislatura.
2. Normaliza escolaridade ausente para categoria equivalente a nao informado.
3. Agrupa por escolaridade.
4. Conta deputados por grupo.
5. Gera complemento nominal com deputados, partido e dados de perfil quando disponiveis.

Saida principal: `escolaridade`, `qtd_deputados`.

No dashboard, a Q4 usa barras verticais e filtros de partido e escolaridade.

## Q5 - Fornecedores com maior total pago

Fonte atual:

- SQL: `questoes/q5/consultas/q5.sql`
- Respostas: `q5_fornecedores.txt`, `q5_fornecedores_complemento.txt`
- Dashboard: id `q5`

Objetivo: ranquear fornecedores por valor recebido nas despesas parlamentares.

Metodologia:

1. Usa `gastos` como base.
2. Mantem fornecedores validos e valores positivos.
3. Normaliza nomes de fornecedores para evitar quebra do separador textual.
4. Agrupa por ano e fornecedor.
5. Conta lancamentos.
6. Soma `valor_liquido` como `total_pago`.
7. Calcula participacao percentual do fornecedor no total.
8. Gera ranking anual e consolidado.
9. No complemento, detalha fornecedores por categoria de despesa.

Saida principal: `posicao`, `fornecedor`, `qtd_lancamentos`, `total_pago`, `pct_total`.

No dashboard, a Q5 usa barras horizontais e filtro de ano.

## Q6 - Correlacoes por escolaridade

Fonte atual:

- SQL: `questoes/q6/consultas/q6.sql`
- Complemento SQL: `questoes/q6/consultas/q6_complementar.sql`
- Respostas: `q6_escolaridade_correlacoes.txt`, `q6a_escolaridade_gastos.txt`, `q6b_escolaridade_fidelidade.txt`, `q6c_escolaridade_proposicoes.txt`, `q6d_escolaridade_presenca_eventos.txt`, `q6e_escolaridade_presenca_plenario.txt`, `q6_eta_complementar.txt`
- Dashboard: id `q6`

Objetivo: comparar medias de indicadores parlamentares por escolaridade.

Metodologia:

1. Define deputados ativos a partir de presenca em gastos, votos, proposicoes ou eventos.
2. Soma gastos por deputado e ano.
3. Calcula fidelidade partidaria comparando voto individual com orientacao da bancada.
4. Conta proposicoes por deputado e ano.
5. Conta presencas em eventos.
6. Conta presencas em plenario.
7. Junta os indicadores ao cadastro de deputados e escolaridade.
8. Agrupa por `ano_dados` e `escolaridade`.
9. Calcula medias de gasto, fidelidade, proposicoes, presenca em eventos e presenca em plenario.
10. Exporta arquivos especificos Q6A a Q6E para cada indicador.
11. A consulta complementar calcula eta quadrado para medir forca de associacao entre escolaridade e indicadores numericos.

Saida principal: `escolaridade`, `qtd_deputados`, `media_gasto`, `media_fidelidade`, `media_proposicoes`, `media_presenca_eventos`, `media_presenca_plenario`.

Observacao metodologica: a Q6 e descritiva. Eta quadrado indica associacao estatistica, nao causalidade.

## Q7 - Indice de custo-beneficio

Fonte atual:

- SQL: `questoes/q7/consultas/q7.sql`
- Respostas: `q7_custo_beneficio.txt`, `q7_custo_beneficio_complemento.txt`
- Dashboard: id `q7`

Objetivo: comparar beneficio legislativo qualificado com gasto parlamentar.

Metodologia atualizada:

1. Soma `valor_liquido` por deputado e ano em `resposta_gastos_deputado`.
2. Monta base de autoria de proposicoes com `proposicoes_autores` e `proposicoes`.
3. Para cada proposicao, calcula pontuacao por tipo:
   - PEC: 12.0
   - PLP: 10.0
   - MPV ou MSC: 9.0
   - PL: 7.0
   - PDL, PDC ou PRC: 5.0
   - REQ, RIC, INC ou RQS: 1.5
   - demais tipos: 3.0
4. Soma bonus por situacao:
   - aprovada, sancao, norma juridica ou promulgada: 24.0
   - parecer, tramitacao, pronta ou pauta: 6.0
   - arquivada, retirada, devolvida ou prejudicada: 0.0
   - demais situacoes: 2.0
5. Aplica redutor de 0.45 para proposicoes de baixo impacto textual, como homenagem, data comemorativa, dia nacional, semana nacional, sessao solene, titulo, denominacao ou concessao.
6. Aplica peso de autoria:
   - `peso_autoria` quando existe, limitado a 1.0
   - primeira assinatura: 1.0
   - assinatura entre segunda e quinta posicao: 0.55
   - demais assinaturas: 0.25
7. Soma a pontuacao como `qualidade_proposicoes`.
8. Conta `qtd_proposicoes` e `proposicoes_aprovadas`.
9. Conta presencas em `eventos_presenca_deputados`.
10. Define partido e UF dominantes por deputado e ano a partir dos gastos.
11. Mantem apenas deputados com `gasto_total > 40000` e `qualidade_proposicoes > 0`.
12. Calcula penalidade por faixa de gasto:
   - gasto acima de 400000: fator 1.45
   - gasto acima de 250000: fator 1.25
   - gasto acima de 100000: fator 1.10
   - demais: fator 1.00
13. Calcula `beneficio = qualidade_proposicoes + presenca_total * 0.1`.
14. Calcula `custo_beneficio = beneficio / (gasto_total * fator_penalidade_gasto)`.
15. Exporta top 30 por ano, ranking global e complemento completo.

Saida principal: `id_deputado`, `nome`, `gasto_total`, `qtd_proposicoes`, `proposicoes_aprovadas`, `qualidade_proposicoes`, `presenca_total`, `fator_penalidade_gasto`, `beneficio`, `custo_beneficio`.

No dashboard, a Q7 usa grafico de dispersao entre gasto e beneficio, com filtros de ano, partido, UF e deputado.

## Q8 - Influencia legislativa

Fonte atual:

- SQL: `questoes/q8/consultas/q8.sql`
- Complemento SQL: `questoes/q8/consultas/q8_complementar.sql`
- Script complementar: `questoes/q8/scripts/gerar_comunidades_leiden.py`
- Respostas: `q8_influencia.txt`, `q8_influencia_complemento.txt`, `q8_influencia_por_voto_extra.txt`
- Dashboard: id `q8`

Objetivo: medir influencia por participacao em proposicoes aprovadas e complementar com comunidades de comportamento de voto.

Metodologia principal:

1. Relaciona proposicoes a autores.
2. Conta proposicoes de autoria por deputado.
3. Classifica como aprovadas proposicoes cuja situacao contenha termos como aprovado, sancao, norma juridica ou promulgado.
4. Conta proposicoes aprovadas por deputado.
5. Calcula o total global de proposicoes aprovadas.
6. Calcula `pct_aprovadas = 100 * proposicoes_aprovadas_do_deputado / total_global_aprovadas`.
7. Ordena deputados por percentual, quantidade aprovada e identificadores.
8. Exporta ranking principal e complemento.

Metodologia complementar de votos:

1. Usa `votacoes_votos.csv` dos dados padronizados.
2. Mantem apenas votos binarios `Sim` e `Nao`.
3. Codifica `Sim = 1` e `Nao = -1`.
4. Considera votacoes informativas com pelo menos 50 votos binarios.
5. Pondera votacoes por `4*p*(1-p)`, onde `p` e a proporcao de votos `Sim`; votacoes mais divididas pesam mais.
6. Mantem deputados com pelo menos 100 votos validos.
7. Compara pares de deputados com pelo menos 100 votacoes em comum.
8. Exige cobertura minima de 0.50.
9. Calcula concordancia ponderada, concordancia esperada e Kappa de Cohen ponderado.
10. Mantem arestas com `kappa_ponderado >= 0.40`.
11. Constroi grafo ponderado e detecta comunidades com algoritmo Leiden, usando seed 42.
12. Exporta resumo, comunidades, deputados por comunidade e arestas principais.

Saida principal: `id_deputado`, `nome`, `proposicoes_autoria`, `proposicoes_aprovadas`, `pct_aprovadas`.

No dashboard, a Q8 usa barras horizontais por `pct_aprovadas` e filtro de deputado.

## Q9 - Vies ideologico e partidario

Fonte atual:

- Legado ainda registrado: `questoes/q9/consultas/q9.sql`, `q9_vies_deputado.txt`, `q9_votos_por_votacao.txt`
- Versao atual desmembrada: `questoes/q9_v2`
- Script gerador atual: `questoes/q9_v2/scripts/gerar_q9_v2.py`
- Dashboard: ids `q9`, `q9_1_classificar_partidos`, `q9_v2_partidos`, `q9_v2_correlacao`, `q9_v2_votacoes`, `q9_v2_votos`, `q9_v2_deputado`, `q9_vies_final`

Objetivo: classificar partidos e deputados por comportamento ideologico observado nas votacoes.

### Q9 legado

A Q9 original:

1. Usa `partidos_ideologia` como catalogo de ideologia.
2. Cruza votos e orientacoes de bancada.
3. Calcula comportamento por votacao, partido e deputado.
4. Detecta votacoes polarizadas por divergencia entre esquerda e direita.
5. Calcula score de vies individual em escala 0 a 100.

Ela ainda existe para compatibilidade, mas a metodologia atual do dashboard foi expandida em Q9 v2.

### Q9 v2.1 - Classificacao dos partidos

Fonte:

- SQL: `questoes/q9_v2/consultas/q9_1_classificar_partidos.sql`
- Respostas: `q9_v2_partidos.txt`, `q9_1_classificar_partidos.txt`

Metodologia:

1. Usa `partidos_ideologia.csv` como classificacao declarada/historica/programatica.
2. Calcula tambem classificacao comportamental a partir do score medio dos deputados do partido em votacoes polarizadas.
3. Considera apenas deputados com pelo menos 10 votos em votacoes polarizadas para o score comportamental.
4. Classifica score medio:
   - `score <= 40`: esquerda
   - `40 < score < 60`: centro
   - `score >= 60`: direita
5. Marca como dissidente o partido cuja ideologia declarada diverge da ideologia comportamental.
6. Exporta volume de deputados com voto e votos registrados.

Saida: `sigla_partido`, `ideologia_declarada`, `ideologia_comportamental`, `score_medio`, `dissidente`, `deputados_com_voto`, `votos_registrados`.

### Q9 v2.2 - Correlacao partido x proposta

Fonte:

- SQL: `questoes/q9_v2/consultas/q9_2_correlacao_partido_proposta.sql`
- Resposta: `q9_v2_correlacao.txt`

Metodologia:

1. Agrupa votos reais por ano, votacao/proposta e partido.
2. Junta ideologia do partido como camada interpretativa.
3. Conta votos `Sim`, `Nao`, `Abstencao`, `Obstrucao` e outros.
4. Calcula `pct_sim` por partido em cada votacao.

Saida: `ano`, `id_votacao`, `proposicao`, `partido`, `ideologia`, `sim`, `nao`, `abstencao`, `obstrucao`, `outros`, `total`, `pct_sim`.

### Q9 v2.3 - Votacoes e voto individual

Fonte:

- SQL: `questoes/q9_v2/consultas/q9_3_voto_deputado_proposta.sql`
- Respostas: `q9_v2_votacoes.txt`, `q9_v2_votos.txt`

Metodologia:

1. Lista votacoes/propostas com pelo menos 50 votos registrados para alimentar seletores e evitar votacoes muito pequenas.
2. Para cada votacao, soma `Sim`, `Nao`, outros e total.
3. Exporta tabela detalhada com o voto de cada deputado por proposta.
4. Junta partido, ideologia do partido e UF do deputado.

Saida de votacoes: `ano`, `id_votacao`, `proposicao`, `sim`, `nao`, `outros`, `total`.

Saida de votos: `ano`, `id_votacao`, `proposicao`, `id_deputado`, `nome`, `partido`, `ideologia_partido`, `sigla_uf`, `voto`.

### Q9 v2.4 - Tendencia de voto do deputado

Fonte:

- SQL: `questoes/q9_v2/consultas/q9_vies_deputado.sql`
- Resposta: `q9_v2_deputados.txt`

Metodologia:

1. Considera apenas votos binarios `Sim` e `Nao`.
2. Para cada votacao, identifica o voto majoritario dos blocos esquerda, centro e direita.
3. Para cada deputado, mede em quantas votacoes seu voto coincidiu com cada bloco.
4. Calcula percentuais de alinhamento com esquerda, centro e direita.
5. Exige pelo menos 20 votos validos para estimar tendencia; abaixo disso, marca amostra insuficiente.
6. Define `vies_estimado` pelo bloco com maior alinhamento.

Saida: `id_deputado`, `nome`, `partido`, `ideologia_partido`, `votos_validos`, `alinhamento_esquerda`, `alinhamento_centro`, `alinhamento_direita`, `vies_estimado`.

### Q9 vies final - Score individual por votos divisivos

Fonte:

- SQL: `questoes/q9_v2/consultas/q9_vies_final.sql`
- Resposta: `q9_vies_final.txt`

Metodologia:

1. Calcula `pct_sim` por campo ideologico em cada votacao.
2. Isola votacoes polarizadas onde esquerda e direita existem na votacao e a diferenca entre seus percentuais de `Sim` e pelo menos 30 pontos percentuais.
3. Para cada voto binario do deputado nessas votacoes, identifica se o voto ficou do lado da esquerda ou da direita.
4. Conta `votos_com_esquerda` e `votos_com_direita`.
5. Calcula `score_vies = pct_com_direita`, em escala de 0 a 100.
6. Para deputados com pelo menos 10 votos em polarizadas, classifica:
   - `score_vies >= 60`: direita
   - `pct_com_esquerda >= 60`: esquerda
   - demais: centro
7. Para deputados com menos de 10 votos em polarizadas, usa a ideologia do partido como fallback.
8. Marca o metodo como `comportamento` ou `partido`.

Saida: `id_deputado`, `nome`, `partido`, `ideologia_partido`, `votos_em_polarizadas`, `pct_com_esquerda`, `pct_com_direita`, `score_vies`, `vies_final`, `metodo`.

## Q10 - Alinhamento interno dos partidos

Fonte atual:

- SQL: `questoes/q10/consultas/q10.sql`
- Resposta: `q10_alinhamento_partidos.txt`
- Dashboard: id `q10`

Objetivo: medir disciplina partidaria, ou seja, quanto os deputados votam conforme a orientacao oficial do partido.

Metodologia:

1. Junta votos individuais com orientacoes de bancada.
2. Aceita orientacao da bancada quando ha correspondencia com a sigla do partido.
3. Remove orientacoes sem diretriz clara, como liberado, abstencao e obstrucao.
4. Remove votos tecnicos ou nao comparaveis quando necessario.
5. Compara voto individual com orientacao do partido.
6. Conta votos alinhados e contrarios.
7. Calcula `pct_alinhamento`.
8. Gera ranking consolidado, analise por ano e disciplina individual.

Saida principal: `posicao`, `sigla_partido`, `ideologia`, `qtd_deputados`, `total_votos_com_diretriz`, `votos_alinhados`, `votos_contrarios`, `pct_alinhamento`.

No dashboard, a Q10 usa barras verticais e filtro de partido.

## Q11 - Rankings partidarios

Fonte atual:

- SQL: `questoes/q11/consultas/q11.sql`
- Resposta: `q11_ranking_partidos.txt`
- Dashboard: id `q11`

Objetivo: ordenar partidos por frequencia em votacoes, proposicoes, gastos, categorias de gasto e score composto para nuvem de palavras.

Metodologia:

1. Q11.a: conta votacoes distintas participadas por partido e total de votos registrados.
2. Q11.a anual: repete a contagem por `ano_dados`.
3. Q11.b: conta proposicoes distintas de autoria por partido.
4. Q11.b anual: repete por ano.
5. Q11.c: soma `valor_liquido` por partido, conta despesas e deputados, e calcula gasto medio por deputado.
6. Q11.c anual: repete por ano.
7. Q11.d: une partidos presentes em votacoes, proposicoes ou gastos.
8. Normaliza votacoes, proposicoes e gastos em escala 0-100 por min-max.
9. Calcula `score_total = norm_votacoes + norm_proposicoes + norm_gastos`.
10. Calcula `frequencia = score_total / 3` para a nuvem de palavras.
11. Q11.e: calcula categorias de gasto por partido.
12. Q11.e anual: repete categorias de gasto por partido e ano.
13. Em categorias, mantem valores positivos, partido e descricao de despesa validos, calcula `pct_gasto_partido` e limita as 10 maiores categorias por partido.

Saidas principais:

- Votacoes: `posicao`, `sigla_partido`, `ideologia`, `votacoes_participadas`, `total_votos_registrados`.
- Proposicoes: `posicao`, `sigla_partido`, `ideologia`, `total_proposicoes`.
- Gastos: `posicao`, `sigla_partido`, `ideologia`, `qtd_deputados`, `qtd_despesas`, `gasto_total`, `gasto_medio_por_deputado`.
- Nuvem: `termo`, `ideologia`, valores brutos, normalizados, `score_total`, `frequencia`.
- Categorias: `sigla_partido`, `descricao_despesa`, `qtd_lancamentos`, `qtd_deputados`, `gasto_total`, `pct_gasto_partido`.

No dashboard, a Q11 usa visualizacao de nuvem e filtros de ano e partido.

## Q11 extra - Temas das proposicoes por partido

Fonte atual:

- SQL: `questoes/q11_extra/consultas/q11_extra.sql`
- Resposta: `questoes/q11_extra/respostas/q11_extra_temas.txt`
- Dashboard: id `q11_extra`

Objetivo: gerar nuvem de palavras tematica por partido com base nos temas das proposicoes apresentadas.

Metodologia:

1. Junta `proposicoes_temas` com `proposicoes_autores` por `uri_proposicao` e `ano_dados`.
2. Remove partido e tema vazios.
3. Conta proposicoes distintas por partido e tema.
4. Exporta consolidado de todos os anos.
5. Exporta tambem versao por ano.

Saida consolidada: `sigla_partido`, `tema`, `frequencia`.

Saida anual: `ano_dados`, `sigla_partido`, `tema`, `frequencia`.

No dashboard, a Q11 extra usa `wordcloud_party` e filtros de partido e ano.

## Q12 - Deputado x fornecedor

Fonte atual:

- SQL: `questoes/q12/consultas/q12.sql`
- Respostas: `q12_deputado_fornecedor.txt`, `q12_deputado_fornecedor_complemento.txt`
- Dashboard: id `q12`

Objetivo: identificar os pares deputado-fornecedor com maior total pago.

Metodologia:

1. Usa `gastos` como base.
2. Define perfil dominante de UF e partido por deputado e ano.
3. Define perfil dominante global para rankings consolidados.
4. Junta gastos ao cadastro de deputados.
5. Normaliza fornecedor, substituindo caracteres que quebram o formato textual.
6. Agrupa por ano, deputado, UF, partido e fornecedor.
7. Conta lancamentos.
8. Soma `valor_liquido` como `total_pago`.
9. Calcula participacao percentual do par no total do periodo ou ano.
10. Exporta resumo executivo, top 30 por ano, ranking global e complemento completo.

Saida principal: `id_deputado`, `nome`, `fornecedor`, `qtd_lancamentos`, `total_pago`, `pct_total`.

No dashboard, a Q12 usa barras horizontais e filtros de ano, partido, UF e deputado.

## Q13 - Categorias de gasto por deputado

Fonte atual:

- SQL: `questoes/q13/consultas/q13.sql`
- Respostas: `q13_categorias_gasto_deputado.txt`, `q13_categorias_gasto_deputado_complemento.txt`
- Dashboard: id `q13`

Objetivo: analisar categorias de despesa por deputado.

Metodologia:

1. Junta `gastos` com `deputados`.
2. Filtra deputados da 57a legislatura quando definido no SQL.
3. Mantem `valor_liquido > 0`.
4. Usa `nome_civil` quando disponivel.
5. Agrupa por ano, deputado, UF, partido e `descricao_despesa`.
6. Conta lancamentos.
7. Soma gasto total.
8. Gera resumo anual com deputados, lancamentos, gasto total e media por deputado.
9. Gera ranking anual de deputado x categoria.
10. Calcula percentual do par no total.
11. Gera ranking global consolidado.
12. No complemento, consolida gastos por categoria por ano e no global.

Saida principal: `id_deputado`, `nome`, `descricao_despesa`, `qtd_lancamentos`, `gasto_total`, `pct_total`.

No dashboard, a Q13 usa treemap, com `descricao_despesa` como categoria e `gasto_total` como valor.

## Observacoes de validacao

1. O documento anterior foi atualizado para refletir a separacao atual de Q9 em multiplos endpoints/arquivos `q9_v2`.
2. A metodologia da Q7 foi atualizada: o beneficio nao e mais uma formula simples de quantidade de proposicoes, aprovadas e presenca; agora usa qualidade ponderada da proposicao, peso de autoria, redutor por baixo impacto textual e penalidade por faixa de gasto.
3. A Q8 complementar foi atualizada para registrar o uso de Kappa ponderado e comunidades Leiden.
4. A Q11 foi atualizada com a etapa Q11.e de categorias de gasto por partido.
5. A Q11 extra foi adicionada, pois esta registrada no dashboard e possui SQL/resposta proprios.
6. As respostas textuais continuam sendo a fonte consumida pelo dashboard; o SQL e os scripts explicam como esses arquivos foram produzidos.
7. Algumas copias antigas existem em `Banco` e `questoes/legado`, mas a fonte atual usada para esta revisao foi a pasta `questoes` sem `legado` e o `question_registry.json`.
