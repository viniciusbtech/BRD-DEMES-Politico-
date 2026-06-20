\o /questoes/q11_extra/respostas/q11_extra_temas.txt
\qecho Q11_extra - Nuvem de palavras por partido: temas das proposicoes

-- =======================================================================
-- Q11_extra - Frequencia de temas por partido (consolidado, todos os anos)
-- Une proposicoes_temas com proposicoes_autores via uri_proposicao
-- para obter os temas legislativos mais frequentes de cada partido.
-- =======================================================================
\qecho
\qecho Q11_extra - Frequencia de temas por partido (todos os anos)

SELECT
    pa.sigla_partido,
    pt.tema,
    COUNT(DISTINCT pt.uri_proposicao)  AS frequencia
FROM proposicoes_temas pt
JOIN proposicoes_autores pa
    ON  pt.uri_proposicao = pa.uri_proposicao
    AND pt.ano_dados       = pa.ano_dados
WHERE pa.sigla_partido IS NOT NULL
  AND pa.sigla_partido != ''
  AND pt.tema IS NOT NULL
  AND pt.tema != ''
GROUP BY pa.sigla_partido, pt.tema
ORDER BY pa.sigla_partido, frequencia DESC;

-- -----------------------------------------------------------------------
-- Q11_extra - Por ano
-- -----------------------------------------------------------------------
\qecho
\qecho Q11_extra - Frequencia de temas por partido por ano

SELECT
    pa.ano_dados,
    pa.sigla_partido,
    pt.tema,
    COUNT(DISTINCT pt.uri_proposicao)  AS frequencia
FROM proposicoes_temas pt
JOIN proposicoes_autores pa
    ON  pt.uri_proposicao = pa.uri_proposicao
    AND pt.ano_dados       = pa.ano_dados
WHERE pa.sigla_partido IS NOT NULL
  AND pa.sigla_partido != ''
  AND pt.tema IS NOT NULL
  AND pt.tema != ''
GROUP BY pa.ano_dados, pa.sigla_partido, pt.tema
ORDER BY pa.ano_dados, pa.sigla_partido, frequencia DESC;
