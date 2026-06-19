\o

-- Q8 complementar - grafo ponderado para comunidades por similaridade de votos
-- Pipeline:
--   votos individuais -> matriz deputado x votacao -> similaridade entre pares
--   -> grafo ponderado -> deteccao de comunidades por Leiden.
--
-- Esta consulta monta a matriz e o grafo com os filtros metodologicos usados
-- pela Q8 complementar. A deteccao Leiden e aplicada no gerador Python
-- questoes/q8/scripts/gerar_comunidades_leiden.py, porque Leiden e um algoritmo de grafo
-- externo ao SQL padrao.
--
-- Codificacao da matriz:
--   Sim       =  1
--   Nao       = -1
--   Abstencao =  0
--   Obstrucao, Artigo 17 e outros votos nao entram na comparacao.
--
-- Filtros principais:
--   - minimo de 100 votos validos por deputado;
--   - minimo de 100 votacoes compartilhadas por par;
--   - cobertura >= 0.50 em relacao ao deputado com menos votos validos;
--   - votacoes informativas: pelo menos 50 votos Sim/Nao e proporcao de Sim
--     entre 0.10 e 0.90;
--   - arestas com similaridade >= 0.75.

CREATE OR REPLACE TEMP VIEW resposta_q8_votacoes_informativas AS
WITH estatisticas AS (
    SELECT
        ano_dados,
        id_votacao,
        COUNT(*) FILTER (WHERE voto IN ('Sim', 'Nao')) AS total_binario,
        COUNT(*) FILTER (WHERE voto = 'Sim')::numeric
        / NULLIF(COUNT(*) FILTER (WHERE voto IN ('Sim', 'Nao')), 0) AS proporcao_sim
    FROM votacoes_votos
    GROUP BY ano_dados, id_votacao
)
SELECT
    ano_dados,
    id_votacao,
    total_binario,
    ROUND(proporcao_sim, 4) AS proporcao_sim
FROM estatisticas
WHERE total_binario >= 50
  AND proporcao_sim BETWEEN 0.10 AND 0.90;

CREATE OR REPLACE TEMP VIEW resposta_q8_votos_codificados AS
SELECT
    vv.ano_dados,
    vv.id_votacao,
    vv.id_deputado,
    vv.nome_deputado AS nome,
    vv.sigla_partido,
    vv.sigla_uf,
    CASE
        WHEN vv.voto = 'Sim' THEN 1
        WHEN vv.voto = 'Nao' THEN -1
        WHEN vv.voto = 'Abstencao' THEN 0
        ELSE NULL
    END AS voto_codificado
FROM votacoes_votos vv
JOIN resposta_q8_votacoes_informativas vi
  ON vi.ano_dados = vv.ano_dados
 AND vi.id_votacao = vv.id_votacao
WHERE vv.voto IN ('Sim', 'Nao', 'Abstencao');

CREATE OR REPLACE TEMP VIEW resposta_q8_deputados_voto AS
SELECT
    id_deputado,
    MAX(nome) AS nome,
    MAX(sigla_partido) AS sigla_partido,
    MAX(sigla_uf) AS sigla_uf,
    COUNT(*) AS votacoes_validas
FROM resposta_q8_votos_codificados
WHERE voto_codificado IS NOT NULL
GROUP BY id_deputado
HAVING COUNT(*) >= 100;

CREATE OR REPLACE TEMP VIEW resposta_q8_similaridade_pares AS
SELECT
    a.id_deputado AS id_deputado_a,
    MAX(a.nome) AS nome_a,
    MAX(a.sigla_partido) AS sigla_partido_a,
    MAX(a.sigla_uf) AS sigla_uf_a,
    da.votacoes_validas AS votacoes_validas_a,
    b.id_deputado AS id_deputado_b,
    MAX(b.nome) AS nome_b,
    MAX(b.sigla_partido) AS sigla_partido_b,
    MAX(b.sigla_uf) AS sigla_uf_b,
    db.votacoes_validas AS votacoes_validas_b,
    COUNT(*) AS votacoes_em_comum,
    ROUND(
        COUNT(*)::numeric / NULLIF(LEAST(da.votacoes_validas, db.votacoes_validas), 0),
        4
    ) AS cobertura,
    COUNT(*) FILTER (WHERE a.voto_codificado = b.voto_codificado) AS votos_iguais,
    ROUND(
        COUNT(*) FILTER (WHERE a.voto_codificado = b.voto_codificado)::numeric
        / NULLIF(COUNT(*), 0),
        4
    ) AS similaridade
FROM resposta_q8_votos_codificados a
JOIN resposta_q8_deputados_voto da
  ON da.id_deputado = a.id_deputado
JOIN resposta_q8_votos_codificados b
  ON b.ano_dados = a.ano_dados
 AND b.id_votacao = a.id_votacao
 AND b.id_deputado > a.id_deputado
JOIN resposta_q8_deputados_voto db
  ON db.id_deputado = b.id_deputado
WHERE a.voto_codificado IS NOT NULL
  AND b.voto_codificado IS NOT NULL
GROUP BY a.id_deputado, da.votacoes_validas, b.id_deputado, db.votacoes_validas
HAVING COUNT(*) >= 100
   AND COUNT(*)::numeric / NULLIF(LEAST(da.votacoes_validas, db.votacoes_validas), 0) >= 0.50;

CREATE OR REPLACE TEMP VIEW resposta_q8_grafo_ponderado AS
SELECT
    id_deputado_a,
    nome_a,
    sigla_partido_a,
    sigla_uf_a,
    votacoes_validas_a,
    id_deputado_b,
    nome_b,
    sigla_partido_b,
    sigla_uf_b,
    votacoes_validas_b,
    votacoes_em_comum,
    cobertura,
    votos_iguais,
    similaridade,
    similaridade AS peso
FROM resposta_q8_similaridade_pares
WHERE similaridade >= 0.75;

\o /respostas/q8_influencia_por_voto_extra.txt
\qecho Q8 complementar - grafo ponderado para comunidades por similaridade de votos individuais
\qecho Pipeline: votos individuais -> matriz deputado x votacao -> similaridade entre pares -> grafo ponderado -> Leiden.
\qecho Codificacao: Sim = 1, Nao = -1, Abstencao = 0; Obstrucao e Artigo 17 foram ignorados.
\qecho Filtros: deputado >= 100 votos validos; par >= 100 votacoes em comum; cobertura >= 0.50; votacoes informativas com proporcao majoritaria <= 0.90.
\qecho Observacao: este SQL gera o grafo filtrado. Execute questoes/q8/scripts/gerar_comunidades_leiden.py para aplicar Leiden e gravar as comunidades finais.
\qecho
\qecho Resumo executivo
SELECT
    (SELECT COUNT(*) FROM resposta_q8_deputados_voto) AS deputados_com_votos_validos,
    (SELECT COUNT(DISTINCT (ano_dados, id_votacao)) FROM resposta_q8_votacoes_informativas) AS votacoes_informativas,
    (SELECT COUNT(DISTINCT (ano_dados, id_votacao)) FROM resposta_q8_votos_codificados) AS votacoes_na_matriz,
    (SELECT COUNT(*) FROM resposta_q8_votos_codificados) AS votos_validos_codificados,
    (SELECT COUNT(*) FROM resposta_q8_similaridade_pares) AS pares_comparaveis,
    (SELECT COUNT(*) FROM resposta_q8_grafo_ponderado) AS arestas_grafo,
    100 AS minimo_votos_validos_deputado,
    100 AS minimo_votacoes_comuns,
    0.50 AS cobertura_minima,
    0.90 AS proporcao_majoritaria_maxima,
    0.75 AS limiar_similaridade;

\qecho
\qecho Tabela extra - arestas do grafo ponderado
SELECT
    id_deputado_a,
    nome_a,
    sigla_partido_a,
    sigla_uf_a,
    votacoes_validas_a,
    id_deputado_b,
    nome_b,
    sigla_partido_b,
    sigla_uf_b,
    votacoes_validas_b,
    votacoes_em_comum,
    cobertura,
    votos_iguais,
    similaridade,
    peso
FROM resposta_q8_grafo_ponderado
ORDER BY peso DESC, votacoes_em_comum DESC, nome_a, nome_b
LIMIT 3000;

\o
