\o

CREATE OR REPLACE TEMP VIEW resposta_gastos_deputado AS
SELECT
    ano_dados,
    id_deputado,
    SUM(valor_liquido) AS gasto_total
FROM gastos
GROUP BY ano_dados, id_deputado;

CREATE OR REPLACE TEMP VIEW resposta_proposicoes_deputado AS
WITH autoria_base AS (
    SELECT
        pa.ano_dados,
        pa.id_deputado,
        pa.id_proposicao,
        MIN(NULLIF(pa.ordem_assinatura, 0)) AS ordem_assinatura,
        MAX(COALESCE(pa.peso_autoria, 0)) AS peso_autoria,
        MAX(p.sigla_tipo) AS sigla_tipo,
        MAX(p.descricao_situacao) AS descricao_situacao,
        MAX(COALESCE(p.ementa, '') || ' ' || COALESCE(p.ementa_detalhada, '') || ' ' || COALESCE(p.keywords, '')) AS texto_proposicao
    FROM proposicoes_autores pa
    LEFT JOIN proposicoes p
        ON p.ano_dados = pa.ano_dados
       AND p.id_proposicao = pa.id_proposicao
    WHERE pa.id_deputado IS NOT NULL
    GROUP BY pa.ano_dados, pa.id_deputado, pa.id_proposicao
),
proposicoes_pontuadas AS (
    SELECT
        ano_dados,
        id_deputado,
        id_proposicao,
        descricao_situacao,
        (
            CASE
                WHEN UPPER(COALESCE(sigla_tipo, '')) = 'PEC' THEN 12.0
                WHEN UPPER(COALESCE(sigla_tipo, '')) = 'PLP' THEN 10.0
                WHEN UPPER(COALESCE(sigla_tipo, '')) IN ('MPV', 'MSC') THEN 9.0
                WHEN UPPER(COALESCE(sigla_tipo, '')) = 'PL' THEN 7.0
                WHEN UPPER(COALESCE(sigla_tipo, '')) IN ('PDL', 'PDC', 'PRC') THEN 5.0
                WHEN UPPER(COALESCE(sigla_tipo, '')) IN ('REQ', 'RIC', 'INC', 'RQS') THEN 1.5
                ELSE 3.0
            END
            +
            CASE
                WHEN COALESCE(descricao_situacao, '') ILIKE '%aprov%'
                  OR COALESCE(descricao_situacao, '') ILIKE '%sancao%'
                  OR COALESCE(descricao_situacao, '') ILIKE '%norma juridica%'
                  OR COALESCE(descricao_situacao, '') ILIKE '%promulg%' THEN 24.0
                WHEN COALESCE(descricao_situacao, '') ILIKE '%parecer%'
                  OR COALESCE(descricao_situacao, '') ILIKE '%tramit%'
                  OR COALESCE(descricao_situacao, '') ILIKE '%pronta%'
                  OR COALESCE(descricao_situacao, '') ILIKE '%pauta%' THEN 6.0
                WHEN COALESCE(descricao_situacao, '') ILIKE '%arquiv%'
                  OR COALESCE(descricao_situacao, '') ILIKE '%retir%'
                  OR COALESCE(descricao_situacao, '') ILIKE '%devolv%'
                  OR COALESCE(descricao_situacao, '') ILIKE '%prejudic%' THEN 0.0
                ELSE 2.0
            END
        )
        *
        CASE
            WHEN texto_proposicao ILIKE '%homenag%'
              OR texto_proposicao ILIKE '%data comemorativa%'
              OR texto_proposicao ILIKE '%dia nacional%'
              OR texto_proposicao ILIKE '%semana nacional%'
              OR texto_proposicao ILIKE '%sessao solene%'
              OR texto_proposicao ILIKE '%titulo%'
              OR texto_proposicao ILIKE '%denomina%'
              OR texto_proposicao ILIKE '%concede%' THEN 0.45
            ELSE 1.0
        END
        *
        CASE
            WHEN peso_autoria > 0 THEN LEAST(peso_autoria, 1.0)
            WHEN ordem_assinatura = 1 THEN 1.0
            WHEN ordem_assinatura BETWEEN 2 AND 5 THEN 0.55
            ELSE 0.25
        END AS qualidade_ponderada
    FROM autoria_base
)
SELECT
    ano_dados,
    id_deputado,
    COUNT(DISTINCT id_proposicao) AS qtd_proposicoes,
    COUNT(DISTINCT id_proposicao) FILTER (
        WHERE COALESCE(descricao_situacao, '') ILIKE '%aprov%'
           OR COALESCE(descricao_situacao, '') ILIKE '%sancao%'
           OR COALESCE(descricao_situacao, '') ILIKE '%norma juridica%'
           OR COALESCE(descricao_situacao, '') ILIKE '%promulg%'
    ) AS proposicoes_aprovadas,
    ROUND(SUM(qualidade_ponderada)::numeric, 2) AS qualidade_proposicoes
FROM proposicoes_pontuadas
GROUP BY ano_dados, id_deputado;

CREATE OR REPLACE TEMP VIEW resposta_presenca_deputado AS
SELECT
    ano_dados,
    id_deputado,
    COUNT(*) AS presenca_total
FROM eventos_presenca_deputados
GROUP BY ano_dados, id_deputado;

CREATE OR REPLACE TEMP VIEW resposta_perfil_deputado_ano_q7 AS
WITH base AS (
    SELECT
        ano_dados,
        id_deputado,
        sigla_uf,
        sigla_partido,
        COUNT(*) AS ocorrencias
    FROM gastos
    GROUP BY ano_dados, id_deputado, sigla_uf, sigla_partido
),
ranked AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY ano_dados, id_deputado
            ORDER BY ocorrencias DESC, sigla_uf, sigla_partido
        ) AS posicao
    FROM base
)
SELECT
    ano_dados,
    id_deputado,
    sigla_uf,
    sigla_partido
FROM ranked
WHERE posicao = 1;

CREATE OR REPLACE TEMP VIEW resposta_perfil_deputado_global_q7 AS
WITH base AS (
    SELECT
        id_deputado,
        sigla_uf,
        sigla_partido,
        COUNT(*) AS ocorrencias
    FROM gastos
    GROUP BY id_deputado, sigla_uf, sigla_partido
),
ranked AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY id_deputado
            ORDER BY ocorrencias DESC, sigla_uf, sigla_partido
        ) AS posicao
    FROM base
)
SELECT
    id_deputado,
    sigla_uf,
    sigla_partido
FROM ranked
WHERE posicao = 1;

CREATE OR REPLACE TEMP VIEW resposta_custo_beneficio AS
SELECT
    g.ano_dados,
    d.id_deputado,
    d.nome,
    perfil.sigla_uf,
    perfil.sigla_partido,
    g.gasto_total,
    COALESCE(p.qtd_proposicoes, 0) AS qtd_proposicoes,
    COALESCE(p.proposicoes_aprovadas, 0) AS proposicoes_aprovadas,
    COALESCE(p.qualidade_proposicoes, 0) AS qualidade_proposicoes,
    COALESCE(pr.presenca_total, 0) AS presenca_total,
    CASE
        WHEN g.gasto_total > 400000 THEN 1.45
        WHEN g.gasto_total > 250000 THEN 1.25
        WHEN g.gasto_total > 100000 THEN 1.10
        ELSE 1.00
    END AS fator_penalidade_gasto,
    (
        COALESCE(p.qualidade_proposicoes, 0) +
        COALESCE(pr.presenca_total, 0) * 0.1
    ) AS beneficio,
    (
        COALESCE(p.qualidade_proposicoes, 0) +
        COALESCE(pr.presenca_total, 0) * 0.1
    ) / NULLIF(
        g.gasto_total *
        CASE
            WHEN g.gasto_total > 400000 THEN 1.45
            WHEN g.gasto_total > 250000 THEN 1.25
            WHEN g.gasto_total > 100000 THEN 1.10
            ELSE 1.00
        END,
        0
    ) AS custo_beneficio
FROM deputados d
JOIN resposta_gastos_deputado g ON g.id_deputado = d.id_deputado
LEFT JOIN resposta_perfil_deputado_ano_q7 perfil
    ON perfil.ano_dados = g.ano_dados
   AND perfil.id_deputado = d.id_deputado
LEFT JOIN resposta_proposicoes_deputado p
    ON p.ano_dados = g.ano_dados
 AND p.id_deputado = d.id_deputado
LEFT JOIN resposta_presenca_deputado pr
    ON pr.ano_dados = g.ano_dados
 AND pr.id_deputado = d.id_deputado
WHERE g.gasto_total > 40000
  AND COALESCE(p.qualidade_proposicoes, 0) > 0;

\o /respostas/q7_custo_beneficio.txt
\qecho Q7 - ranking de custo-beneficio por deputado
\qecho Resumo executivo
SELECT
    ano_dados,
    COUNT(*) AS deputados_com_gasto,
    ROUND(AVG(beneficio), 2) AS media_beneficio,
    ROUND(MAX(beneficio), 2) AS maior_beneficio
FROM resposta_custo_beneficio
GROUP BY ano_dados
ORDER BY ano_dados;

\qecho
\qecho Tabela principal - top 30 por custo-beneficio
WITH ranked AS (
    SELECT
        *,
        RANK() OVER (
            PARTITION BY ano_dados
            ORDER BY custo_beneficio DESC NULLS LAST
        ) AS posicao
    FROM resposta_custo_beneficio
)
SELECT
    ano_dados,
    id_deputado,
    nome,
    sigla_uf,
    sigla_partido,
    gasto_total,
    qtd_proposicoes,
    proposicoes_aprovadas,
    qualidade_proposicoes,
    presenca_total,
    fator_penalidade_gasto,
    beneficio,
    custo_beneficio
FROM ranked
WHERE posicao <= 30
ORDER BY ano_dados, custo_beneficio DESC NULLS LAST;

\qecho
\qecho Ranking global - todos os anos
WITH global_gastos AS (
    SELECT
        id_deputado,
        SUM(gasto_total) AS gasto_total
    FROM resposta_gastos_deputado
    GROUP BY id_deputado
    HAVING SUM(gasto_total) > 40000
),
global_proposicoes AS (
    SELECT
        id_deputado,
        SUM(qtd_proposicoes) AS qtd_proposicoes,
        SUM(proposicoes_aprovadas) AS proposicoes_aprovadas,
        SUM(qualidade_proposicoes) AS qualidade_proposicoes
    FROM resposta_proposicoes_deputado
    GROUP BY id_deputado
),
global_presencas AS (
    SELECT
        id_deputado,
        SUM(presenca_total) AS presenca_total
    FROM resposta_presenca_deputado
    GROUP BY id_deputado
),
deputado_labels AS (
    SELECT
        id_deputado,
        MAX(nome) AS nome
    FROM deputados
    GROUP BY id_deputado
),
global_metricas AS (
    SELECT
        'GLOBAL' AS ano_dados,
        g.id_deputado,
        d.nome,
        perfil.sigla_uf,
        perfil.sigla_partido,
        g.gasto_total,
        COALESCE(p.qtd_proposicoes, 0) AS qtd_proposicoes,
        COALESCE(p.proposicoes_aprovadas, 0) AS proposicoes_aprovadas,
        COALESCE(p.qualidade_proposicoes, 0) AS qualidade_proposicoes,
        COALESCE(pr.presenca_total, 0) AS presenca_total,
        CASE
            WHEN g.gasto_total > 400000 THEN 1.45
            WHEN g.gasto_total > 250000 THEN 1.25
            WHEN g.gasto_total > 100000 THEN 1.10
            ELSE 1.00
        END AS fator_penalidade_gasto,
        (
            COALESCE(p.qualidade_proposicoes, 0) +
            COALESCE(pr.presenca_total, 0) * 0.1
        ) AS beneficio,
        (
            COALESCE(p.qualidade_proposicoes, 0) +
            COALESCE(pr.presenca_total, 0) * 0.1
        ) / NULLIF(
            g.gasto_total *
            CASE
                WHEN g.gasto_total > 400000 THEN 1.45
                WHEN g.gasto_total > 250000 THEN 1.25
                WHEN g.gasto_total > 100000 THEN 1.10
                ELSE 1.00
            END,
            0
        ) AS custo_beneficio
    FROM global_gastos g
    LEFT JOIN global_proposicoes p ON p.id_deputado = g.id_deputado
    LEFT JOIN global_presencas pr ON pr.id_deputado = g.id_deputado
    LEFT JOIN deputado_labels d ON d.id_deputado = g.id_deputado
    LEFT JOIN resposta_perfil_deputado_global_q7 perfil
        ON perfil.id_deputado = g.id_deputado
    WHERE COALESCE(p.qualidade_proposicoes, 0) > 0
)
SELECT
    ano_dados,
    id_deputado,
    nome,
    sigla_uf,
    sigla_partido,
    gasto_total,
    qtd_proposicoes,
    proposicoes_aprovadas,
    qualidade_proposicoes,
    presenca_total,
    fator_penalidade_gasto,
    beneficio,
    custo_beneficio
FROM global_metricas
ORDER BY custo_beneficio DESC NULLS LAST;

\qecho
\qecho Complemento detalhado: q7_custo_beneficio_complemento.txt contem o ranking completo por custo-beneficio.

\o /respostas/q7_custo_beneficio_complemento.txt
\qecho Q7 complemento - ranking completo por custo-beneficio
SELECT
    ano_dados,
    id_deputado,
    nome,
    gasto_total,
    qtd_proposicoes,
    proposicoes_aprovadas,
    qualidade_proposicoes,
    presenca_total,
    fator_penalidade_gasto,
    beneficio,
    custo_beneficio
FROM resposta_custo_beneficio
ORDER BY ano_dados, custo_beneficio DESC NULLS LAST;
