-- Q9.1 v2 - Classificacao Dupla dos Partidos: Declarada + Comportamental
--
-- DIMENSAO 1 - ideologia_declarada
--   Fonte: tabela partidos_ideologia (catalogo historico/programatico do projeto)
--   Criterio: posicionamento declarado do partido, documentos programaticos e
--             comportamento observado nas principais votacoes da 57a Legislatura.
--   Limitacao: nao reflete dinamicas de coalizeao — partidos de direita que
--              integraram o governo Lula (REPUBLICANOS, PP) continuam classificados
--              como 'direita' mesmo atuando como aliados do executivo de esquerda.
--
-- DIMENSAO 2 - ideologia_comportamental
--   Fonte: score_vies individual calculado em Q9.4 (q9_vies_final.sql)
--   Criterio: score medio por partido considerando apenas deputados com >= 10 votos
--             em votacoes polarizadas (|pct_esq - pct_dir| >= 30pp)
--   Classificacao: score <= 40 => esquerda | 40 < score < 60 => centro | score >= 60 => direita
--   Limitacao: reflete o governo atual — um partido que migrou para a base
--              governista tem score deslocado para esquerda mesmo sendo historicamente direita.
--
-- DISSIDENTE: partidos onde ideologia_declarada != ideologia_comportamental.
--   Esses casos revelam o realinhamento real de bancadas na 57a Legislatura.

WITH votos_por_campo AS (
    SELECT
        vv.ano_dados,
        vv.id_votacao,
        pi.ideologia,
        ROUND(
            COUNT(*) FILTER (WHERE vv.voto = 'Sim') * 100.0
            / NULLIF(COUNT(*) FILTER (WHERE vv.voto IN ('Sim', 'Nao')), 0), 1
        ) AS pct_sim
    FROM votacoes_votos vv
    JOIN partidos_ideologia pi ON pi.sigla_partido = vv.sigla_partido
    WHERE vv.voto IN ('Sim', 'Nao')
    GROUP BY vv.ano_dados, vv.id_votacao, pi.ideologia
),
votacoes_polarizadas AS (
    SELECT
        ano_dados,
        id_votacao,
        MAX(pct_sim) FILTER (WHERE ideologia = 'esquerda') AS pct_esq,
        MAX(pct_sim) FILTER (WHERE ideologia = 'direita')  AS pct_dir
    FROM votos_por_campo
    GROUP BY ano_dados, id_votacao
    HAVING MAX(pct_sim) FILTER (WHERE ideologia = 'esquerda') IS NOT NULL
       AND MAX(pct_sim) FILTER (WHERE ideologia = 'direita')  IS NOT NULL
       AND ABS(
               MAX(pct_sim) FILTER (WHERE ideologia = 'esquerda')
             - MAX(pct_sim) FILTER (WHERE ideologia = 'direita')
           ) >= 30
),
voto_lado AS (
    SELECT
        vv.id_deputado,
        vv.sigla_partido,
        CASE
            WHEN vp.pct_esq > vp.pct_dir AND vv.voto = 'Sim' THEN 'esquerda'
            WHEN vp.pct_esq > vp.pct_dir AND vv.voto = 'Nao' THEN 'direita'
            WHEN vp.pct_dir > vp.pct_esq AND vv.voto = 'Sim' THEN 'direita'
            WHEN vp.pct_dir > vp.pct_esq AND vv.voto = 'Nao' THEN 'esquerda'
            ELSE NULL
        END AS votou_com
    FROM votacoes_votos vv
    JOIN votacoes_polarizadas vp
        ON vp.ano_dados  = vv.ano_dados
       AND vp.id_votacao = vv.id_votacao
    WHERE vv.voto IN ('Sim', 'Nao')
),
score_por_deputado AS (
    SELECT
        sigla_partido,
        id_deputado,
        COUNT(*) FILTER (WHERE votou_com IS NOT NULL)  AS votos_em_polarizadas,
        ROUND(
            COUNT(*) FILTER (WHERE votou_com = 'direita') * 100.0
            / NULLIF(COUNT(*) FILTER (WHERE votou_com IS NOT NULL), 0), 1
        ) AS score_vies
    FROM voto_lado
    GROUP BY sigla_partido, id_deputado
    HAVING COUNT(*) FILTER (WHERE votou_com IS NOT NULL) >= 10
),
score_medio_partido AS (
    SELECT
        sigla_partido,
        ROUND(AVG(score_vies), 1)  AS score_medio,
        COUNT(*)                    AS deps_com_score
    FROM score_por_deputado
    GROUP BY sigla_partido
),
classificacao AS (
    SELECT
        pi.sigla_partido,
        pi.ideologia                                              AS ideologia_declarada,
        CASE
            WHEN smp.score_medio IS NULL  THEN 'sem dados'
            WHEN smp.score_medio <= 40    THEN 'esquerda'
            WHEN smp.score_medio >= 60    THEN 'direita'
            ELSE 'centro'
        END                                                       AS ideologia_comportamental,
        COALESCE(CAST(smp.score_medio AS TEXT), '-')              AS score_medio,
        CASE
            WHEN smp.score_medio IS NULL THEN '-'
            WHEN pi.ideologia != CASE
                WHEN smp.score_medio <= 40 THEN 'esquerda'
                WHEN smp.score_medio >= 60 THEN 'direita'
                ELSE 'centro'
            END THEN 'SIM'
            ELSE '-'
        END                                                       AS dissidente
    FROM partidos_ideologia pi
    LEFT JOIN score_medio_partido smp ON smp.sigla_partido = pi.sigla_partido
)
SELECT
    c.sigla_partido,
    c.ideologia_declarada,
    c.ideologia_comportamental,
    c.score_medio,
    c.dissidente,
    COUNT(DISTINCT vv.id_deputado)  AS deputados_com_voto,
    COUNT(*)                         AS votos_registrados
FROM classificacao c
LEFT JOIN votacoes_votos vv ON vv.sigla_partido = c.sigla_partido
GROUP BY
    c.sigla_partido, c.ideologia_declarada, c.ideologia_comportamental,
    c.score_medio, c.dissidente
ORDER BY
    CASE c.ideologia_declarada
        WHEN 'esquerda' THEN 1
        WHEN 'centro'   THEN 2
        WHEN 'direita'  THEN 3
        ELSE 4
    END,
    c.sigla_partido;
