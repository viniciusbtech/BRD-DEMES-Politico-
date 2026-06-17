import { Link } from 'react-router-dom'

import type { MetaResponse } from '../types'
import { isQuestionEnabled, isQuestionHidden } from '../utils/questionAvailability'

interface HomePageProps {
  meta: MetaResponse
}

const IMAGE_BASE = 'https://images.unsplash.com/'
const img = (id: string, w = 800, h = 600) => `${IMAGE_BASE}${id}?w=${w}&h=${h}&fit=crop&auto=format`

const heroStats = [
  { value: '513', label: 'Deputados Federais', sub: 'na 57a Legislatura' },
  { value: 'R$ 1,48 bi', label: 'Gastos Totais', sub: 'CEAP acumulada 2023-2026' },
  { value: '34.712', label: 'Proposicoes', sub: 'apresentadas no periodo' },
]

const impactImages = [
  '/intro/problemas/problema-01.jpg',
  '/intro/problemas/problema-02.jpg',
  '/intro/problemas/problema-03.jpg',
  '/intro/problemas/problema-04.jpg',
  '/intro/problemas/problema-05.jpg',
  '/intro/problemas/problema-06.jpg',
  '/intro/problemas/problema-07.jpg',
  '/intro/problemas/problema-08.jpg',
  '/intro/problemas/problema-09.jpg',
  '/intro/problemas/problema-10.jpg',
]

const analyses = [
  {
    n: 1,
    tag: 'COTA PARLAMENTAR',
    title: 'Quem gasta mais?',
    summary:
      'A Cota para o Exercicio da Atividade Parlamentar permite ate R$ 45.600 por mes por deputado para passagens, refeicoes, combustivel e servicos de apoio. Mapeamos quem ultrapassa o razoavel, o que compram e de quem.',
    highlight: 'Top 10% gastam 3x a media',
    imgId: 'photo-1526304640581-d334cdbbf45e',
  },
  {
    n: 2,
    tag: 'FREQUENCIA',
    title: 'Presente ou ausente?',
    summary:
      'Mandato e presenca. Cruzamos os registros de votacoes nominais com as ausencias de cada parlamentar, separando quem justificou, quem simplesmente nao apareceu e quem so vota quando as cameras estao ligadas.',
    highlight: '68% de presenca media nas votacoes',
    imgId: 'photo-1540910419892-4a36d2c3266c',
  },
  {
    n: 3,
    tag: 'ALINHAMENTO',
    title: 'Qual e o lado?',
    summary:
      'Calculamos o indice de governismo de cada deputado: com que frequencia votou ao lado do Executivo federal, independente do discurso publico. Os resultados revelam contradicoes entre fala e voto.',
    highlight: '41% votam diferente do que declaram',
    imgId: 'photo-1529107386315-e1a2ed48a620',
  },
  {
    n: 4,
    tag: 'PRODUCAO LEGISLATIVA',
    title: 'Quem propoe o que?',
    summary:
      'Analisamos todas as proposicoes por deputado: volume, tema, taxa de aprovacao e impacto real. Separamos quem legisla de quem apenas protocola para aparecer nos relatorios de fim de mandato.',
    highlight: '62% das proposicoes nunca sairam da mesa',
    imgId: 'photo-1504711434969-e33886168f5c',
  },
  {
    n: 5,
    tag: 'FINANCIAMENTO',
    title: 'De onde vem o dinheiro?',
    summary:
      'Rastreamos doadores, setores economicos e conexoes entre financiamento eleitoral e votacoes subsequentes, especialmente em pautas regulatorias.',
    highlight: 'Media de 7 financiadores por candidato',
    imgId: 'photo-1553729459-efe14ef6055d',
  },
  {
    n: 6,
    tag: 'PATRIMONIO',
    title: 'O que declararam ter?',
    summary:
      'Comparamos declaracoes de bens entregues ao TSE em 2022 com mandatos anteriores. Quem enriqueceu durante o exercicio do mandato? Quais ativos chamam atencao?',
    highlight: 'Patrimonio medio: R$ 2,3 mi',
    imgId: 'photo-1551288049-bebda4e38f71',
  },
  {
    n: 7,
    tag: 'IDEOLOGIA',
    title: 'Esquerda, centro ou direita?',
    summary:
      'Usando modelos de posicionamento com base em votacoes nominais, construimos um espectro ideologico objetivo, independente da autodesignacao dos partidos ou dos proprios parlamentares.',
    highlight: 'Centro declarado nao e centro votado em 54% dos casos',
    imgId: 'photo-1519085360753-af0119f7cbe7',
  },
  {
    n: 8,
    tag: 'REDES',
    title: 'Quem vota com quem?',
    summary:
      'Mapeamos as redes de coesao de voto entre deputados e partidos. Os grafos revelam blocos informais que transcendem legenda, aliancas reais que aparecem nos dados.',
    highlight: '23 blocos de coesao identificados',
    imgId: 'photo-1666875753105-c63a6f3bdc86',
  },
  {
    n: 9,
    tag: 'DISCURSO VS ACAO',
    title: 'Falaram muito, fizeram pouco?',
    summary:
      'Analisamos o tempo de tribuna de cada parlamentar versus sua taxa de entrega legislativa. Identificamos oradores prolificos sem resultado e silenciosos com impacto real.',
    highlight: 'Mais tempo de fala nao significa mais leis aprovadas',
    imgId: 'photo-1495020689067-958852a7765e',
  },
  {
    n: 10,
    tag: 'COMISSOES',
    title: 'Quem fiscaliza o que?',
    summary:
      'As comissoes permanentes sao onde as leis nascem e morrem. Investigamos quem preside, quem participa de fato e como a composicao beneficia setores especificos da economia.',
    highlight: 'Setores organizados lideram presidencias de comissao',
    imgId: 'photo-1637102134162-7dc2c4995c22',
  },
  {
    n: 11,
    tag: 'GABINETE',
    title: 'Quanto custa o gabinete?',
    summary:
      'Cada deputado pode contratar assessores. Cruzamos contratacoes com vinculos familiares, politicos e partidarios, mapeando nepotismo e uso estrategico da folha.',
    highlight: '18% tem familiares nos quadros',
    imgId: 'photo-1593672715438-d88a70629abe',
  },
  {
    n: 12,
    tag: 'VIAGENS',
    title: 'Onde estao quando nao estao?',
    summary:
      'Misses internacionais, visitas de trabalho e eventos oficiais foram analisados para avaliar viagens custeadas com verba publica e resultados mensuraveis.',
    highlight: 'R$ 23 mi em passagens internacionais',
    imgId: 'photo-1760872645513-63b6846ce3c9',
  },
  {
    n: 13,
    tag: 'BALANCO DO MANDATO',
    title: 'O que mudou em 4 anos?',
    summary:
      'A analise final cruza todas as variaveis anteriores para retratar cada deputado em sua integralidade: o que foi prometido, o que foi feito e o que foi gasto.',
    highlight: 'Analise integrada de 513 perfis',
    imgId: 'photo-1526628953301-3e589a6a8b74',
  },
]

export function HomePage({ meta }: HomePageProps) {
  const visibleQuestions = (meta.questions || []).filter((question) => !isQuestionHidden(question.id))

  const scrollToCard = (n: number) => {
    const el = document.getElementById(`analise-${n}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const getQuestion = (n: number) => visibleQuestions.find((question) => question.id.toLowerCase() === `q${n}`)

  return (
    <main className="home-page home-investigation">
      <section className="home-investigation-hero">
        <p className="home-kicker">ANALISE DE DADOS LEGISLATIVOS - BRASIL 2023-2026</p>
        <h1>
          QUEM
          <span>GOVERNA?</span>
        </h1>
        <p className="home-investigation-lead">
          Uma analise de dados legislativos para revelar contradicoes entre gastos, votos, proposicoes, ideologia e
          comportamento parlamentar.
        </p>
        <p className="home-research-note">
          Pesquisa restrita a Deputados Federais. Nao abrange senadores, vereadores ou governadores.
        </p>

        <div className="home-stats-grid">
          {heroStats.map((stat) => (
            <div key={stat.label} className="home-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <small>{stat.sub}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="home-impact-section" aria-label="Problemas sociais do Brasil">
        <div className="home-impact-slideshow" aria-hidden="true">
          {impactImages.map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>
        <div className="home-impact-copy">
          <p className="home-kicker">O CONTEXTO QUE COBRA RESPOSTA</p>
          <h2>Antes dos numeros, existe o pais que eles atravessam.</h2>
          <p>
            Fome, saude publica, violencia, abandono urbano e vulnerabilidade social compoem o pano de fundo real das
            decisoes tomadas em Brasilia. Cada voto, gasto e ausencia tem consequencia fora do plenario.
          </p>
        </div>
        <div className="home-impact-gallery" aria-label="Retratos de problemas sociais usados na introducao">
          {impactImages.map((src, index) => (
            <figure key={`impact-${src}`} className={index % 3 === 0 ? 'wide' : undefined}>
              <img src={src} alt="" />
            </figure>
          ))}
        </div>
      </section>

      <section className="home-analyses-shell">
        <div className="home-section-heading">
          <div>
            <p className="home-kicker">AS 13 ANALISES</p>
            <h2>O que esta em jogo</h2>
          </div>
          <span>CLIQUE EM UM CARD PARA EXPLORAR</span>
        </div>

        <div className="home-analysis-grid">
          {analyses.map((analysis) => (
            <button
              key={analysis.n}
              type="button"
              className="home-analysis-card"
              onClick={() => scrollToCard(analysis.n)}
            >
              <img src={img(analysis.imgId, 800, 600)} alt="" />
              <span className="home-analysis-number">{String(analysis.n).padStart(2, '0')}</span>
              <span className="home-analysis-content">
                <small>{analysis.tag}</small>
                <strong>{analysis.title}</strong>
                <em>{analysis.highlight}</em>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="home-analysis-sections">
        {analyses.map((analysis, index) => {
          const alignRight = index % 2 !== 0
          const question = getQuestion(analysis.n)
          const enabled = question ? isQuestionEnabled(question.id) : false

          return (
            <section
              key={analysis.n}
              id={`analise-${analysis.n}`}
              className={`home-analysis-detail${alignRight ? ' align-right' : ''}`}
            >
              <img src={img(analysis.imgId, 1600, 900)} alt="" />
              <span className="home-watermark">{String(analysis.n).padStart(2, '0')}</span>
              <div className="home-analysis-copy">
                <div className="home-index-line">
                  <span>{String(analysis.n).padStart(2, '0')}</span>
                  <i />
                  <small>{analysis.tag}</small>
                </div>
                <h2>{analysis.title}</h2>
                <p>{analysis.summary}</p>
                <div className="home-highlight">
                  <span />
                  {analysis.highlight}
                </div>
                {enabled && question ? (
                  <Link to={`/q/${question.id}`} className="home-explore-link">
                    EXPLORAR {String(analysis.n).padStart(2, '0')} -&gt;
                  </Link>
                ) : (
                  <span className="home-explore-link disabled">EM DESENVOLVIMENTO</span>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <section className="home-data-footer">
        <div>
          <strong>
            QUEM<span>GOVERNA</span>
          </strong>
          <p>Dados extraidos de fontes publicas: Camara dos Deputados, TSE, Portal da Transparencia e SIAFI.</p>
        </div>
        <Link to="/grupos/gastos" className="home-explore-link">
          PAINEL DE GASTOS -&gt;
        </Link>
      </section>
    </main>
  )
}
