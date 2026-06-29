-- Q9 v2.4 - Tendencia de voto observada do deputado
-- Compara o voto de cada deputado com o voto majoritario dos blocos ideologicos.

WITH votos_validos AS (
    SELECT
        vv.ano_dados,
        vv.id_votacao,
        vv.id_deputado,
        vv.nome_deputado,
        vv.sigla_partido,
        COALESCE(pi.ideologia, 'nao classificado') AS ideologia_partido,
        vv.voto
    FROM votacoes_votos vv
    LEFT JOIN partidos_ideologia pi
        ON pi.sigla_partido = vv.sigla_partido
    WHERE vv.voto IN ('Sim', 'Nao')
),
blocos AS (
    SELECT
        vv.ano_dados,
        vv.id_votacao,
        pi.ideologia,
        COUNT(*) FILTER (WHERE vv.voto = 'Sim') AS sim,
        COUNT(*) FILTER (WHERE vv.voto = 'Nao') AS nao,
        CASE
            WHEN COUNT(*) FILTER (WHERE vv.voto = 'Sim') >= COUNT(*) FILTER (WHERE vv.voto = 'Nao') THEN 'Sim'
            ELSE 'Nao'
        END AS voto_majoritario
    FROM votacoes_votos vv
    JOIN partidos_ideologia pi
        ON pi.sigla_partido = vv.sigla_partido
    WHERE vv.voto IN ('Sim', 'Nao')
      AND pi.ideologia IN ('esquerda', 'centro', 'direita')
    GROUP BY vv.ano_dados, vv.id_votacao, pi.ideologia
),
alinhamentos AS (
    SELECT
        v.id_deputado,
        v.nome_deputado AS nome,
        v.sigla_partido AS partido,
        v.ideologia_partido,
        COUNT(*) AS votos_validos,
        COUNT(*) FILTER (WHERE be.voto_majoritario = v.voto) AS com_esquerda,
        COUNT(*) FILTER (WHERE bc.voto_majoritario = v.voto) AS com_centro,
        COUNT(*) FILTER (WHERE bd.voto_majoritario = v.voto) AS com_direita
    FROM votos_validos v
    LEFT JOIN blocos be
        ON be.ano_dados = v.ano_dados
       AND be.id_votacao = v.id_votacao
       AND be.ideologia = 'esquerda'
    LEFT JOIN blocos bc
        ON bc.ano_dados = v.ano_dados
       AND bc.id_votacao = v.id_votacao
       AND bc.ideologia = 'centro'
    LEFT JOIN blocos bd
        ON bd.ano_dados = v.ano_dados
       AND bd.id_votacao = v.id_votacao
       AND bd.ideologia = 'direita'
    GROUP BY v.id_deputado, v.nome_deputado, v.sigla_partido, v.ideologia_partido
)
SELECT
    id_deputado,
    nome,
    partido,
    ideologia_partido,
    votos_validos,
    ROUND(com_esquerda * 100.0 / NULLIF(votos_validos, 0), 1) AS alinhamento_esquerda,
    ROUND(com_centro * 100.0 / NULLIF(votos_validos, 0), 1) AS alinhamento_centro,
    ROUND(com_direita * 100.0 / NULLIF(votos_validos, 0), 1) AS alinhamento_direita,
    CASE
        WHEN votos_validos < 20 THEN 'amostra insuficiente'
        WHEN com_esquerda >= com_centro AND com_esquerda >= com_direita THEN 'esquerda'
        WHEN com_direita >= com_esquerda AND com_direita >= com_centro THEN 'direita'
        ELSE 'centro'
    END AS vies_estimado
FROM alinhamentos
ORDER BY votos_validos DESC, nome;
