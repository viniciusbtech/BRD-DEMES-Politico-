\o /respostas/q9_vies_deputado.txt
\qecho Q9 - Vies ideologico dos deputados (direita / esquerda / centro)

-- =======================================================================
-- Q9.1 - Classificacao dos partidos por ideologia
-- =======================================================================
\qecho
\qecho Q9.1 - Catalogo de partidos por ideologia

SELECT
    ideologia,
    string_agg(sigla_partido, ', ' ORDER BY sigla_partido) AS partidos,
    COUNT(*) AS qtd_partidos
FROM partidos_ideologia
GROUP BY ideologia
ORDER BY ideologia;

\qecho
\qecho Q9.1 - Lista completa partidos x ideologia

SELECT
    sigla_partido,
    ideologia
FROM partidos_ideologia
ORDER BY ideologia, sigla_partido;

-- =======================================================================
-- Q9.2 - Correlacao Partido x Proposta
-- Para cada votacao, percentual de votos "Sim" por campo ideologico.
-- Revela qual orientacao ideologica favorece cada proposicao.
-- =======================================================================
\qecho
\qecho Q9.2 - Correlacao ideologia x proposicao (pct de Sim por campo)

WITH votos_classif AS (
    SELECT
        vv.ano_dados,
        vv.id_votacao,
        pi.ideologia,
        COUNT(*) FILTER (WHERE vv.voto = 'Sim') AS votos_sim,
        COUNT(*) FILTER (WHERE vv.voto = 'Nao') AS votos_nao,
        COUNT(*) FILTER (WHERE vv.voto NOT IN ('Sim', 'Nao')) AS outros,
        COUNT(*) AS total_votos
    FROM votacoes_votos vv
    JOIN partidos_ideologia pi ON pi.sigla_partido = vv.sigla_partido
    GROUP BY vv.ano_dados, vv.id_votacao, pi.ideologia
),
objetos AS (
    SELECT DISTINCT ON (ano_dados, id_votacao)
        ano_dados,
        id_votacao,
        titulo_proposicao,
        ementa_proposicao
    FROM votacoes_objetos
    ORDER BY ano_dados, id_votacao, id_votacao_objeto
)
SELECT
    vc.ano_dados,
    vc.id_votacao,
    COALESCE(ob.titulo_proposicao, '(sem proposicao vinculada)') AS titulo_proposicao,
    vc.ideologia,
    vc.votos_sim,
    vc.votos_nao,
    vc.outros,
    vc.total_votos,
    ROUND(vc.votos_sim * 100.0 / NULLIF(vc.total_votos, 0), 1) AS pct_sim
FROM votos_classif vc
LEFT JOIN objetos ob
    ON ob.ano_dados = vc.ano_dados
   AND ob.id_votacao = vc.id_votacao
ORDER BY vc.ano_dados, vc.id_votacao, vc.ideologia;

-- =======================================================================
-- Q9.3 - Resumo consolidado de votos e aderencia por deputado
-- =======================================================================
\qecho
\qecho Q9.3 - Resumo consolidado de votos e aderencia por deputado

WITH voto_detalhado AS (
    SELECT
        vv.ano_dados,
        vv.id_votacao,
        vv.id_deputado,
        vv.nome_deputado,
        vv.sigla_partido,
        pi.ideologia,
        vv.voto,
        vo.orientacao                                          AS orientacao_bancada,
        CASE
            WHEN vo.orientacao IS NULL
                THEN 'Sem orientacao registrada'
            WHEN vo.orientacao IN ('Liberado', 'Abstencao', 'Obstrucao')
                THEN 'Liberado/Abstencao'
            WHEN vv.voto = vo.orientacao
                THEN 'Seguiu'
            ELSE 'Contrariou'
        END                                                    AS aderiu_orientacao
    FROM votacoes_votos vv
    JOIN partidos_ideologia pi
        ON pi.sigla_partido = vv.sigla_partido
    LEFT JOIN votacoes_orientacoes vo
        ON vo.ano_dados   = vv.ano_dados
       AND vo.id_votacao  = vv.id_votacao
       AND vo.sigla_bancada = vv.sigla_partido
)
SELECT
    sigla_partido,
    id_deputado,
    nome_deputado,
    ideologia,
    COUNT(*) AS total_votos,
    COUNT(*) FILTER (WHERE voto = 'Sim') AS votos_sim,
    COUNT(*) FILTER (WHERE voto = 'Nao') AS votos_nao,
    COUNT(*) FILTER (WHERE voto NOT IN ('Sim', 'Nao')) AS outros_votos,
    COUNT(*) FILTER (WHERE aderiu_orientacao = 'Seguiu') AS seguiu_orientacao,
    COUNT(*) FILTER (WHERE aderiu_orientacao = 'Contrariou') AS contrariou_orientacao,
    ROUND(COUNT(*) FILTER (WHERE aderiu_orientacao = 'Seguiu') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE aderiu_orientacao IN ('Seguiu', 'Contrariou')), 0), 1) AS pct_aderencia_partido
FROM voto_detalhado
GROUP BY sigla_partido, id_deputado, nome_deputado, ideologia
ORDER BY sigla_partido, nome_deputado;

-- =======================================================================
-- Q9.4 - Votacoes polarizadas (divergencia esquerda x direita >= 30 pp)
-- =======================================================================
\qecho
\qecho Q9.4 - votacoes polarizadas (divergencia esquerda vs direita)

WITH votos_por_campo AS (
    SELECT
        vv.ano_dados,
        vv.id_votacao,
        pi.ideologia,
        COUNT(*) FILTER (WHERE vv.voto = 'Sim')                              AS votos_sim,
        COUNT(*) FILTER (WHERE vv.voto = 'Nao')                              AS votos_nao,
        COUNT(*) FILTER (WHERE vv.voto IN ('Sim', 'Nao'))                    AS total_binario,
        ROUND(
            COUNT(*) FILTER (WHERE vv.voto = 'Sim') * 100.0
            / NULLIF(COUNT(*) FILTER (WHERE vv.voto IN ('Sim', 'Nao')), 0), 1
        )                                                                      AS pct_sim
    FROM votacoes_votos vv
    JOIN partidos_ideologia pi ON pi.sigla_partido = vv.sigla_partido
    WHERE vv.voto IN ('Sim', 'Nao')
    GROUP BY vv.ano_dados, vv.id_votacao, pi.ideologia
),
pivotado AS (
    SELECT
        ano_dados,
        id_votacao,
        MAX(pct_sim)     FILTER (WHERE ideologia = 'esquerda') AS pct_sim_esquerda,
        MAX(pct_sim)     FILTER (WHERE ideologia = 'centro')   AS pct_sim_centro,
        MAX(pct_sim)     FILTER (WHERE ideologia = 'direita')  AS pct_sim_direita,
        SUM(total_binario)                                      AS total_votos
    FROM votos_por_campo
    GROUP BY ano_dados, id_votacao
    HAVING MAX(pct_sim) FILTER (WHERE ideologia = 'esquerda') IS NOT NULL
       AND MAX(pct_sim) FILTER (WHERE ideologia = 'direita')  IS NOT NULL
),
objetos AS (
    SELECT DISTINCT ON (ano_dados, id_votacao)
        ano_dados, id_votacao, titulo_proposicao
    FROM votacoes_objetos
    ORDER BY ano_dados, id_votacao, id_votacao_objeto
)
SELECT
    p.ano_dados,
    p.id_votacao,
    COALESCE(ob.titulo_proposicao, '(sem proposicao vinculada)') AS titulo_proposicao,
    p.pct_sim_esquerda,
    p.pct_sim_centro,
    p.pct_sim_direita,
    p.total_votos,
    ABS(p.pct_sim_esquerda - p.pct_sim_direita)                  AS divergencia_esq_dir,
    CASE
        WHEN p.pct_sim_esquerda > p.pct_sim_direita THEN 'esquerda favoravel'
        ELSE 'direita favoravel'
    END                                                           AS campo_favoravel
FROM pivotado p
LEFT JOIN objetos ob
    ON ob.ano_dados  = p.ano_dados
   AND ob.id_votacao = p.id_votacao
WHERE ABS(p.pct_sim_esquerda - p.pct_sim_direita) >= 30
ORDER BY divergencia_esq_dir DESC, p.ano_dados, p.id_votacao;

-- =======================================================================
-- Q9.5 - Score de vies ideologico individual dos deputados
--         0 = puro esquerda, 100 = puro direita
--         baseado apenas em votacoes polarizadas (divergencia >= 30 pp)
-- =======================================================================
\qecho
\qecho Q9.5 - score vies ideologico individual dos deputados

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
        pi.ideologia                                       AS ideologia_partido,
        CASE
            -- esquerda favorece (pct_esq > pct_dir): Sim = com esquerda
            WHEN vp.pct_esq > vp.pct_dir AND vv.voto = 'Sim' THEN 'esquerda'
            WHEN vp.pct_esq > vp.pct_dir AND vv.voto = 'Nao' THEN 'direita'
            -- direita favorece: Sim = com direita
            WHEN vp.pct_dir > vp.pct_esq AND vv.voto = 'Sim' THEN 'direita'
            WHEN vp.pct_dir > vp.pct_esq AND vv.voto = 'Nao' THEN 'esquerda'
            ELSE NULL
        END                                                AS votou_com
    FROM votacoes_votos vv
    JOIN votacoes_polarizadas vp
        ON vp.ano_dados  = vv.ano_dados
       AND vp.id_votacao = vv.id_votacao
    JOIN partidos_ideologia pi ON pi.sigla_partido = vv.sigla_partido
    WHERE vv.voto IN ('Sim', 'Nao')
)
SELECT
    sigla_partido,
    id_deputado,
    nome_deputado,
    ideologia_partido,
    COUNT(*)                                                              AS votos_em_polarizadas,
    COUNT(*) FILTER (WHERE votou_com = 'esquerda')                       AS votos_com_esquerda,
    COUNT(*) FILTER (WHERE votou_com = 'direita')                        AS votos_com_direita,
    ROUND(
        COUNT(*) FILTER (WHERE votou_com = 'esquerda') * 100.0
        / NULLIF(COUNT(*) FILTER (WHERE votou_com IS NOT NULL), 0), 1
    )                                                                     AS pct_com_esquerda,
    ROUND(
        COUNT(*) FILTER (WHERE votou_com = 'direita') * 100.0
        / NULLIF(COUNT(*) FILTER (WHERE votou_com IS NOT NULL), 0), 1
    )                                                                     AS pct_com_direita,
    ROUND(
        COUNT(*) FILTER (WHERE votou_com = 'direita') * 100.0
        / NULLIF(COUNT(*) FILTER (WHERE votou_com IS NOT NULL), 0), 1
    )                                                                     AS score_vies
FROM voto_lado
GROUP BY sigla_partido, id_deputado, nome_deputado, ideologia_partido
HAVING COUNT(*) FILTER (WHERE votou_com IS NOT NULL) >= 10
ORDER BY score_vies ASC, nome_deputado;

-- =======================================================================
-- Q9.3 - Voto de cada deputado por proposicao (Detalhe para Auditoria)
-- =======================================================================
\o /respostas/q9_vies_deputado_detalhe.csv
\pset format csv

WITH voto_detalhado AS (
    SELECT
        vv.ano_dados,
        vv.id_votacao,
        vv.id_deputado,
        vv.nome_deputado,
        vv.sigla_partido,
        pi.ideologia,
        vv.voto,
        vo.orientacao                                          AS orientacao_bancada,
        CASE
            WHEN vo.orientacao IS NULL
                THEN 'Sem orientacao registrada'
            WHEN vo.orientacao IN ('Liberado', 'Abstencao', 'Obstrucao')
                THEN 'Liberado/Abstencao'
            WHEN vv.voto = vo.orientacao
                THEN 'Seguiu'
            ELSE 'Contrariou'
        END                                                    AS aderiu_orientacao
    FROM votacoes_votos vv
    JOIN partidos_ideologia pi
        ON pi.sigla_partido = vv.sigla_partido
    LEFT JOIN votacoes_orientacoes vo
        ON vo.ano_dados   = vv.ano_dados
       AND vo.id_votacao  = vv.id_votacao
       AND vo.sigla_bancada = vv.sigla_partido
),
objetos AS (
    SELECT DISTINCT ON (ano_dados, id_votacao)
        ano_dados,
        id_votacao,
        titulo_proposicao,
        ementa_proposicao
    FROM votacoes_objetos
    ORDER BY ano_dados, id_votacao, id_votacao_objeto
)
SELECT
    vd.ano_dados,
    vd.id_votacao,
    COALESCE(ob.titulo_proposicao, '(sem proposicao vinculada)') AS titulo_proposicao,
    vd.id_deputado,
    vd.nome_deputado,
    vd.sigla_partido,
    vd.ideologia,
    vd.voto,
    COALESCE(vd.orientacao_bancada, '-')                       AS orientacao_bancada,
    vd.aderiu_orientacao
FROM voto_detalhado vd
LEFT JOIN objetos ob
    ON ob.ano_dados  = vd.ano_dados
   AND ob.id_votacao = vd.id_votacao
ORDER BY
    vd.ano_dados,
    vd.id_votacao,
    vd.ideologia,
    vd.sigla_partido,
    vd.nome_deputado;
