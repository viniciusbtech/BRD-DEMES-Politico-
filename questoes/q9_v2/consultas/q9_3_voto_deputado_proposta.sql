-- Q9 v2.3 - Observar o voto de cada deputado em uma proposta/votacao
-- Tabela detalhada para filtro por id_votacao.

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
    vv.id_deputado,
    vv.nome_deputado AS nome,
    vv.sigla_partido AS partido,
    COALESCE(pi.ideologia, 'nao classificado') AS ideologia_partido,
    vv.sigla_uf,
    vv.voto
FROM votacoes_votos vv
LEFT JOIN partidos_ideologia pi
    ON pi.sigla_partido = vv.sigla_partido
LEFT JOIN objetos o
    ON o.ano_dados = vv.ano_dados
   AND o.id_votacao = vv.id_votacao
ORDER BY vv.ano_dados DESC, vv.id_votacao, vv.sigla_partido, vv.nome_deputado;
