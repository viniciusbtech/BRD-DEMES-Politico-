-- Q9 v2.2 - Correlacionar partido x proposta
-- Uma linha por votacao e partido, com votos Sim/Nao/Abstencao/Obstrucao/Outros.

WITH objetos AS (
    SELECT DISTINCT ON (ano_dados, id_votacao)
        ano_dados,
        id_votacao,
        COALESCE(titulo_proposicao, '(sem proposicao vinculada)') AS proposicao
    FROM votacoes_objetos
    ORDER BY ano_dados, id_votacao, id_votacao_objeto
)
SELECT
    vv.ano_dados AS ano,
    vv.id_votacao,
    COALESCE(o.proposicao, '(sem proposicao vinculada)') AS proposicao,
    vv.sigla_partido AS partido,
    COALESCE(pi.ideologia, 'nao classificado') AS ideologia,
    COUNT(*) FILTER (WHERE vv.voto = 'Sim') AS sim,
    COUNT(*) FILTER (WHERE vv.voto = 'Nao') AS nao,
    COUNT(*) FILTER (WHERE vv.voto = 'Abstencao') AS abstencao,
    COUNT(*) FILTER (WHERE vv.voto = 'Obstrucao') AS obstrucao,
    COUNT(*) FILTER (WHERE vv.voto NOT IN ('Sim', 'Nao', 'Abstencao', 'Obstrucao')) AS outros,
    COUNT(*) AS total,
    ROUND(COUNT(*) FILTER (WHERE vv.voto = 'Sim') * 100.0 / NULLIF(COUNT(*), 0), 1) AS pct_sim
FROM votacoes_votos vv
LEFT JOIN partidos_ideologia pi
    ON pi.sigla_partido = vv.sigla_partido
LEFT JOIN objetos o
    ON o.ano_dados = vv.ano_dados
   AND o.id_votacao = vv.id_votacao
WHERE vv.sigla_partido IS NOT NULL
GROUP BY vv.ano_dados, vv.id_votacao, o.proposicao, vv.sigla_partido, pi.ideologia
ORDER BY vv.ano_dados DESC, vv.id_votacao, vv.sigla_partido;
