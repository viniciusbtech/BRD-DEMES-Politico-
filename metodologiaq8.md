Crie um documento PDF sobre  Q8 - Metodologia
  A Questão 8 mede influência legislativa em duas camadas:

  1. Um ranking de influência por proposições aprovadas.
  2. Uma análise complementar de comunidades de voto, usando similaridade política entre deputados.

  A ideia é combinar uma medida de produção legislativa com uma medida de comportamento em votações nominais.

  1. Ranking De Influência Legislativa
  A primeira parte da Q8 calcula quanto cada deputado contribuiu para o conjunto total de proposições aprovadas.

  A base usada é composta por:

  - proposicoes
  - proposicoes_autores
  - deputados

  A consulta identifica quais proposições têm situação considerada aprovada. Para isso, ela verifica se a descrição da situação contém termos como:

  - aprov
  - sancao
  - norma juridica
  - promulg

  Quando uma proposição se encaixa nesses critérios, ela é classificada como aprovada.

  Depois, para cada deputado, o sistema conta:

  - quantas proposições ele assinou como autor;
  - quantas dessas proposições foram aprovadas.

  Em seguida, calcula-se a participação percentual do deputado no total global de proposições aprovadas:

  pct_aprovadas =
  100 * proposicoes_aprovadas_do_deputado / total_global_de_proposicoes_aprovadas

  Assim, o ranking principal da Q8 responde:

  Entre todas as proposições aprovadas, qual fração veio da autoria de cada deputado?

  Essa medida favorece deputados com maior produção aprovada em relação ao total da Câmara.

  2. Complemento: Comunidades De Voto
  A segunda parte da Q8 cria uma rede de deputados com base no comportamento em votações nominais.

  Aqui o objetivo não é medir autoria de proposições, mas descobrir quais deputados votam de forma parecida.

  Essa parte usa o arquivo:

  dados_padronizados/votacoes_votos.csv

  E gera o complemento:

  questoes/q8/respostas/q8_influencia_por_voto_extra.txt

  O script responsável é:

  questoes/q8/scripts/gerar_comunidades_leiden.py

  3. Seleção Dos Votos Considerados
  A metodologia considera somente votos binários:

  Sim
  Nao

  Votos como:

  Abstencao
  Obstrucao
  Ausencia
  Artigo 17

  não entram nessa primeira rede.

  O motivo é metodológico: duas abstenções não significam necessariamente a mesma concordância política que dois votos Sim ou dois votos Nao.

  Por exemplo:

  Deputado A: Sim
  Deputado B: Sim

  é uma concordância direta.

  Mas:

  Deputado A: Abstencao
  Deputado B: Abstencao

  pode significar várias coisas: estratégia, ausência de posicionamento, acordo tático, disciplina partidária ou simplesmente não participação substantiva.

  Por isso, a rede principal da Q8 usa apenas votos claros de posição: Sim e Nao.

  4. Peso Das Votações Divisivas
  Nem toda votação tem o mesmo valor informativo.

  Uma votação em que 99% votam Sim não ajuda muito a diferenciar blocos políticos. Quase todos concordaram.

  Já uma votação em que 50% votam Sim e 50% votam Nao é muito mais útil para revelar alinhamentos.

  Por isso, cada votação recebe um peso:

  peso = 4 * p * (1 - p)

  Em que:

  p = proporção de votos Sim

  Exemplos:

  50% Sim  -> peso 1.00
  70% Sim  -> peso 0.84
  80% Sim  -> peso 0.64
  90% Sim  -> peso 0.36
  95% Sim  -> peso 0.19
  100% Sim -> peso 0.00

  Assim, votações mais divididas pesam mais na comparação entre deputados.

  Isso evita que votações consensuais dominem artificialmente a análise.

  5. Matriz Deputado X Votação
  Depois da seleção dos votos, o script monta uma matriz:

  deputado x votação

  Cada célula contém:

  Sim = 1
  Nao = -1

  Exemplo simplificado:

                Votacao 1   Votacao 2   Votacao 3
  Deputado A        Sim         Nao         Sim
  Deputado B        Sim         Nao         Nao
  Deputado C        Nao         Nao         Sim

  Na codificação:

                Votacao 1   Votacao 2   Votacao 3
  Deputado A         1          -1           1
  Deputado B         1          -1          -1
  Deputado C        -1          -1           1

  Só entram deputados com pelo menos:

  100 votos válidos

  Isso reduz ruído de deputados com poucas observações.

  6. Comparação Entre Pares De Deputados
  Depois, o script compara todos os pares de deputados.

  Para cada par, ele verifica:

  - quantas votações os dois têm em comum;
  - em quantas votaram igual;
  - qual o peso informativo dessas votações;
  - qual a concordância observada;
  - qual a concordância esperada por acaso;
  - qual o Kappa de Cohen ponderado.

  Só entram pares com pelo menos:

  100 votações em comum

  E com cobertura mínima:

  50%

  A cobertura é calculada assim:

  votações em comum / menor quantidade de votos válidos entre os dois deputados

  Isso evita comparar deputados que quase nunca participaram das mesmas votações.

  7. Por Que Usar Kappa De Cohen
  A concordância bruta seria:

  votos iguais / votações em comum

  Mas ela tem um problema: se dois deputados votam Sim em quase tudo, eles podem parecer muito parecidos mesmo que isso ocorra apenas porque quase todas as
  votações foram consensuais.

  O Kappa de Cohen corrige isso.

  A fórmula é:

  kappa =
  (concordância observada - concordância esperada)
  /
  (1 - concordância esperada)

  A interpretação geral é:

  kappa < 0       -> discordância
  0.00 a 0.20     -> muito fraca
  0.20 a 0.40     -> fraca
  0.40 a 0.60     -> moderada
  0.60 a 0.80     -> forte
  acima de 0.80   -> muito forte

  Na Q8, o grafo usa inicialmente:

  kappa >= 0.40

  Ou seja, entram relações com pelo menos concordância moderada depois de descontar a concordância esperada por acaso.

  8. Kappa Ponderado
  O Kappa da Q8 não trata todas as votações igualmente.

  Ele usa o peso:

  4 * p * (1 - p)

  Então, se dois deputados concordam numa votação muito divisiva, essa concordância conta mais.

  Se concordam numa votação quase unânime, conta menos.

  Na prática, isso dá mais importância para votações que realmente separam posições políticas.

  9. Construção Do Grafo
  Depois de calcular o Kappa entre pares, o script monta um grafo.

  Nesse grafo:

  nó = deputado
  aresta = relação entre dois deputados
  peso da aresta = Kappa ponderado

  Uma aresta só é criada se o par passar pelos filtros:

  votações em comum >= 100
  cobertura >= 0.50
  kappa ponderado >= 0.40

  Quanto maior o Kappa, mais forte é a conexão entre os deputados.

  10. Detecção De Comunidades Com Leiden
  Com o grafo pronto, a Q8 aplica o algoritmo Leiden.

  O Leiden é usado para detectar comunidades em redes.

  No contexto da Q8, uma comunidade representa um grupo de deputados que votam de forma parecida entre si.

  O algoritmo recebe:

  nós = deputados
  arestas = conexões por Kappa
  pesos = força do Kappa ponderado

  E retorna grupos como:

  Comunidade 1
  Comunidade 2
  Comunidade 3
  ...

  Essas comunidades podem revelar blocos de comportamento legislativo que nem sempre coincidem perfeitamente com partidos formais.

  11. Saídas Geradas
  O complemento da Q8 gera três blocos principais.

  Primeiro, o resumo executivo:

  deputados_com_votos_validos
  votacoes_informativas
  votacoes_na_matriz
  votos_validos_codificados
  arestas_grafo
  comunidades_detectadas
  limiar_kappa
  algoritmo_comunidades

  Depois, a tabela de comunidades:

  comunidade
  qtd_deputados
  kappa_medio_interno
  similaridade_media_interna
  grau_ponderado_medio
  media_votacoes_validas
  partidos_presentes
  deputados_exemplo

  E, por fim, as arestas do grafo:

  id_deputado_a
  id_deputado_b
  votacoes_em_comum
  cobertura
  votos_iguais
  concordancia_ponderada
  concordancia_esperada
  kappa_ponderado
  peso

  Resumo Didático Passo A Passo

  1. A Q8 primeiro identifica quais proposições foram aprovadas.
  2. Depois conta, para cada deputado, quantas proposições ele apresentou e quantas foram aprovadas.
  3. Com isso, calcula o percentual de participação do deputado no total global de proposições aprovadas.
  4. Esse percentual forma o ranking principal de influência legislativa.
  5. Em paralelo, a Q8 analisa os votos nominais dos deputados.
  6. Para essa rede, usa apenas votos Sim e Nao.
  7. Abstenções, obstruções, ausências e Artigo 17 ficam fora porque não representam concordância direta.
  8. Cada votação recebe um peso maior quando é mais divisiva.
  9. A fórmula do peso é 4*p*(1-p), onde p é a proporção de votos Sim.
  10. O sistema monta uma matriz de deputados por votação.
  11. Cada par de deputados é comparado somente se tiver pelo menos 100 votações em comum.
  12. A concordância entre deputados é medida com Kappa de Cohen ponderado.
  13. O Kappa desconta a concordância que poderia acontecer por acaso.
  14. Só viram conexões no grafo os pares com kappa >= 0.40.
  15. Cada deputado vira um nó.
  16. Cada relação forte entre dois deputados vira uma aresta.
  17. O peso da aresta é o Kappa ponderado.
  18. O algoritmo Leiden detecta comunidades de deputados que votam parecido.
  19. O dashboard mostra essas comunidades em forma de grafo.
  20. Assim, a Q8 combina duas ideias: influência por proposições aprovadas e alinhamento político por comportamento de voto. 



Metodologia 6

  Você ainda pode ter tabelas como:

  - Top maiores custo-benefício
  - Top menores custo-benefício
  - Ranking completo
  - Posição do deputado selecionado
  - Nota geral baseada no percentil

  A diferença é só a escala exibida.

  Hoje o índice bruto é:

  custo_beneficio = beneficio / gasto_total
  nota = custo_beneficio * 10000

  Problema: se alguém gastou muito pouco, a nota explode.

  Com percentil:

  ranking por custo_beneficio DESC
  posição = lugar do deputado no ranking
  nota = posição convertida para escala 0-10

  Uma fórmula possível:

  nota = 10 * (1 - (posicao - 1) / (total_deputados - 1))

  Exemplo com 500 deputados:

  1º de 500   -> 10.0
  50º de 500  -> 9.0
  250º de 500 -> 5.0
  450º de 500 -> 1.0
  500º de 500 -> 0.0

  Para tabela, você poderia ter:

  posicao | deputado | beneficio | gasto_total | custo_beneficio | nota_percentil
  1       | Fulano   | 1385.40   | 12966.50    | 0.1068          | 10.0
  2       | Ciclano  | 4548.70   | 117305.28   | 0.0387          | 9.9
  ...
  250     | Deputado | 120.00    | 300000.00   | 0.0004          | 5.0

  Mas eu colocaria uma regra junto:

  Só entra no ranking de custo-benefício quem tem gasto_total mínimo relevante.

  Por exemplo:

  gasto_total >= 50000

  Senão, deputados com gasto baixíssimo ficam no topo por efeito matemático, não por desempenho real.

  Então o modelo mais defensável seria:

  1. Calcula beneficio.
  2. Calcula custo_beneficio = beneficio / gasto_total.
  3. Remove ou separa casos com gasto_total muito baixo.
  4. Ordena por custo_beneficio DESC.
  5. Calcula posição no ranking.
  6. Converte posição em nota 0-10.