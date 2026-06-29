-- Q9 Vies Final - Score ideologico individual por votos divisivos + fallback partido
-- Metodo C (principal): voto em proposicoes polarizadas (|pct_esq - pct_dir| >= 30pp)
-- Metodo A (fallback): para deputados com < 10 votos em polarizadas, herda ideologia do partido
-- Score: 0 = puro esquerda, 100 = puro direita

\o questoes/q9_v2/respostas/q9_vies_final.txt
\qecho Q9 Vies Final - Score ideologico por votos divisivos

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
        vv.nome_deputado,
        vv.sigla_partido,
        COALESCE(pi.ideologia, 'nao classificado') AS ideologia_partido,
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
    LEFT JOIN partidos_ideologia pi ON pi.sigla_partido = vv.sigla_partido
    WHERE vv.voto IN ('Sim', 'Nao')
),
alinhamento AS (
    SELECT
        id_deputado,
        nome_deputado                                          AS nome,
        sigla_partido                                          AS partido,
        ideologia_partido,
        COUNT(*) FILTER (WHERE votou_com IS NOT NULL)          AS votos_em_polarizadas,
        COUNT(*) FILTER (WHERE votou_com = 'esquerda')         AS votos_com_esquerda,
        COUNT(*) FILTER (WHERE votou_com = 'direita')          AS votos_com_direita
    FROM voto_lado
    GROUP BY id_deputado, nome_deputado, sigla_partido, ideologia_partido
)
SELECT
    id_deputado,
    nome,
    partido,
    ideologia_partido,
    votos_em_polarizadas,
    votos_com_esquerda,
    votos_com_direita,
    ROUND(votos_com_esquerda * 100.0 / NULLIF(votos_em_polarizadas, 0), 1)  AS pct_com_esquerda,
    ROUND(votos_com_direita  * 100.0 / NULLIF(votos_em_polarizadas, 0), 1)  AS pct_com_direita,
    ROUND(votos_com_direita  * 100.0 / NULLIF(votos_em_polarizadas, 0), 1)  AS score_vies,
    CASE
        WHEN votos_em_polarizadas >= 10 THEN
            CASE
                WHEN ROUND(votos_com_direita  * 100.0 / NULLIF(votos_em_polarizadas, 0), 1) >= 60 THEN 'direita'
                WHEN ROUND(votos_com_esquerda * 100.0 / NULLIF(votos_em_polarizadas, 0), 1) >= 60 THEN 'esquerda'
                ELSE 'centro'
            END
        ELSE ideologia_partido
    END AS vies_final,
    CASE
        WHEN votos_em_polarizadas >= 10 THEN 'comportamento'
        ELSE 'partido'
    END AS metodo
FROM alinhamento
ORDER BY score_vies ASC NULLS LAST, nome;
