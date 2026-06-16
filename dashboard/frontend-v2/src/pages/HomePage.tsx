import { Link } from 'react-router-dom'

import type { MetaResponse } from '../types'
import { isQuestionEnabled, isQuestionHidden } from '../utils/questionAvailability'

interface HomePageProps {
  meta: MetaResponse
}

export function HomePage({ meta }: HomePageProps) {
  const questions = meta.questions || []
  const visibleQuestions = questions.filter((question) => !isQuestionHidden(question.id))

  return (
    <main className="home-page">
      <section className="hero-card home-hero stagger-item">
        <h1>MEMORIA  RASURADA</h1>
        <img
          className="home-hero-image"
          src="/memoria-rasurada.png"
          alt="Memoria Rasurada"
        />
        <p className="home-hero-subtitle">
          Visualize dados legislativos, gastos parlamentares e indicadores de desempenho que eles nao querem que voce perceba.
        </p>
        <p className="home-hero-description">
          Um trabalho de organizacao, cruzamento e analise de dados publicos da Camara dos Deputados para transformar registros dispersos em leituras claras sobre atuacao parlamentar.
        </p>
      </section>

      <section className="home-primary-cta stagger-item">
        <div className="home-cta-content">
          <h2>Painel Consolidado de Gastos</h2>
          <p>Analise detalhada de despesas parlamentares com rankings, anomalias e filtros interativos.</p>
        </div>
        <Link to="/grupos/gastos" className="home-cta-btn">
          Acessar Painel
        </Link>
      </section>

      <section className="home-questions-section stagger-item">
        <div className="home-section-heading">
          <span className="eyebrow">Solucoes por pergunta</span>
          <h2>Questoes analisadas</h2>
        </div>

        <div className="home-questions-grid">
          {visibleQuestions.map((question) => {
            const enabled = isQuestionEnabled(question.id)
            const content = (
              <>
                <span className="home-question-id">{question.id.toUpperCase()}</span>
                <span className="home-question-title">{question.title}</span>
              </>
            )

            return enabled ? (
              <Link key={question.id} to={`/q/${question.id}`} className="home-question-card">
                {content}
              </Link>
            ) : (
              <div key={question.id} className="home-question-card home-question-card-disabled" aria-disabled="true">
                {content}
                <span className="home-question-status">Em desenvolvimento</span>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
