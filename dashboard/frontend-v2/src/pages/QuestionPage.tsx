import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { fetchQuestion } from '../api'
import { ChartPanel } from '../components/ChartPanel'
import { DataTablePanel } from '../components/DataTablePanel'
import { DeputyAvatar } from '../components/DeputyAvatar'
import { ExecutiveCards } from '../components/ExecutiveCards'
import { NoDataState } from '../components/NoDataState'
import { QueryDrawer } from '../components/QueryDrawer'
import { WarningBanner } from '../components/WarningBanner'
import { WordCloudGrid } from '../components/WordCloudGrid'
import type { FilterState, MetaResponse, QuestionPayload, TableState } from '../types'
import { isQuestionEnabled, isQuestionHidden } from '../utils/questionAvailability'
import { formatCellValue } from '../utils/format'

interface QuestionPageProps {
  meta: MetaResponse
  filters: FilterState
  onFiltersChange?: (next: FilterState) => void
}

const DEFAULT_TABLE_STATE: TableState = {
  page: 1,
  pageSize: 50,
  sortDir: 'desc',
}

const Q7_TOP_OPTIONS = [10, 15, 20]

function sortYears(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const numA = Number(a)
    const numB = Number(b)
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return numA - numB
    }
    return a.localeCompare(b)
  })
}

export function QuestionPage({ meta, filters, onFiltersChange }: QuestionPageProps) {
  const { questionId } = useParams()
  const questionMeta = useMemo(
    () => meta.questions.find((question) => question.id === questionId),
    [meta.questions, questionId],
  )
  const isHiddenQuestion = Boolean(questionMeta && isQuestionHidden(questionMeta.id))
  const isEnabledQuestion = isQuestionEnabled(questionMeta?.id)
  const isUnderDevelopment = Boolean(questionMeta && !isEnabledQuestion)

  const [tableState, setTableState] = useState<TableState>(DEFAULT_TABLE_STATE)
  const [payload, setPayload] = useState<QuestionPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetailedData, setShowDetailedData] = useState(false)
  const [q7TopLimit, setQ7TopLimit] = useState(10)
  const [q7RankingYear, setQ7RankingYear] = useState('')
  const [q8GraphCommunity, setQ8GraphCommunity] = useState('')
  const [q8GraphTopLimit, setQ8GraphTopLimit] = useState(80)
  const supportedFiltersForFetch = useMemo(() => {
    if (questionMeta?.id.toLowerCase() !== 'q6') return questionMeta?.supported_filters
    return Array.from(new Set([...(questionMeta.supported_filters ?? []), 'escolaridade']))
  }, [questionMeta])

  useEffect(() => {
    setTableState(DEFAULT_TABLE_STATE)
    setShowDetailedData(false)
    setQ7TopLimit(10)
    setQ7RankingYear('')
    setQ8GraphCommunity('')
    setQ8GraphTopLimit(80)
  }, [questionId])

  useEffect(() => {
    if (!questionMeta || isHiddenQuestion || isUnderDevelopment) {
      setPayload(null)
      setLoading(false)
      setError(null)
      return
    }
    let mounted = true
    setLoading(true)
    setError(null)
    fetchQuestion(questionMeta.id, filters, tableState, supportedFiltersForFetch)
      .then((result) => {
        if (!mounted) return
        setPayload(result)
      })
      .catch((cause: Error) => {
        if (!mounted) return
        setError(cause.message)
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [questionMeta, isHiddenQuestion, isUnderDevelopment, filters, tableState, supportedFiltersForFetch])

  const yearLegend = useMemo(() => {
    if (!questionMeta || questionMeta.id.toLowerCase() !== 'q3') return []
    const fromSpec = payload?.chart_spec?.options?.year_order
    if (Array.isArray(fromSpec) && fromSpec.length > 0) {
      return fromSpec.map((value) => String(value))
    }
    const selectedYears = filters.anos.length
      ? filters.anos
      : meta.available_filters.anos.map((item) => item.value)
    const normalized = selectedYears.map((value) => value.trim()).filter(Boolean)
    return sortYears(normalized)
  }, [filters.anos, meta.available_filters.anos, payload, questionMeta])

  if (!questionMeta) {
    return (
      <main className="question-page">
        <NoDataState message="Pergunta nao encontrada no registro." />
      </main>
    )
  }

  if (isHiddenQuestion) {
    return (
      <main className="question-page">
        <NoDataState message="Pergunta nao encontrada no registro." />
      </main>
    )
  }

  if (isUnderDevelopment) {
    return (
      <main className="question-page">
        <section className="question-intro stagger-item">
          <h1>
            {questionMeta.id.toUpperCase()} - {questionMeta.title}
          </h1>
          <p>{questionMeta.description}</p>
        </section>

        <section className="maintenance-state stagger-item" aria-live="polite">
          <p className="maintenance-mark">X</p>
          <p className="maintenance-text">Esta questao ainda esta em desenvolvimento.</p>
        </section>
      </main>
    )
  }

  if (loading && !payload) {
    return (
      <main className="question-page">
        <p className="loading">Carregando dados...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="question-page">
        <NoDataState message={`Falha ao carregar dados: ${error}`} />
      </main>
    )
  }

  if (!payload) {
    return (
      <main className="question-page">
        <NoDataState message="Nenhum payload recebido da API." />
      </main>
    )
  }

  const isQ8 = questionMeta.id.toLowerCase() === 'q8'
  const isQ2 = questionMeta.id.toLowerCase() === 'q2'
  const isQ11 = questionMeta.id.toLowerCase() === 'q11'
  const isQ3 = questionMeta.id.toLowerCase() === 'q3'
  const isQ6 = questionMeta.id.toLowerCase() === 'q6'
  const isQ7 = questionMeta.id.toLowerCase() === 'q7'
  const showDeputyPhotos = ['q7', 'q8', 'q12', 'q13'].includes(questionMeta.id.toLowerCase())
  const hasWordClouds = isQ2 || isQ11
  const shouldShowChart = !hasWordClouds
  const tableStateView = isQ8 ? { ...tableState, pageSize: 50 } : tableState
  const mainTable = isQ8 ? { ...payload.table_spec, title: 'Tabela principal' } : payload.table_spec
  const complementTables = payload.complement_tables
  const q6ExtraCharts = isQ6 && Array.isArray(payload.chart_spec.options?.extra_charts)
    ? payload.chart_spec.options.extra_charts
    : []
  const q7RankingPayload = isQ7 ? payload.chart_spec.options?.beneficio_rankings as any : null
  const q7RankingYears: string[] = Array.isArray(q7RankingPayload?.years) ? q7RankingPayload.years.map(String) : []
  const q7SelectedYear = q7RankingYears.includes(q7RankingYear) ? q7RankingYear : q7RankingYears[0]
  const q7RankingRows = q7SelectedYear && q7RankingPayload?.rankings?.[q7SelectedYear]
    ? q7RankingPayload.rankings[q7SelectedYear].slice(0, q7TopLimit)
    : []
  const q7BenefitRankingChart = q7RankingRows.length > 0
    ? {
        type: 'bar_horizontal',
        title: `Ranking horizontal por beneficio - ${q7SelectedYear}`,
        description: `Top ${q7TopLimit} deputados por beneficio, ordenado do maior para o menor.`,
        x_field: 'beneficio',
        y_fields: ['beneficio'],
        categories: q7RankingRows.map((row: any) => String(row.nome ?? '')).reverse(),
        series: [
          {
            name: 'Beneficio',
            data: q7RankingRows.map((row: any) => Number(row.beneficio ?? 0)).reverse(),
          },
        ],
        options: { orientation: 'horizontal', compact_bars: true },
      }
    : null
  const q8GraphPayload = isQ8 ? payload.chart_spec.options?.vote_community_graph as any : null
  const q8GraphCommunities = Array.isArray(q8GraphPayload?.communities) ? q8GraphPayload.communities : []
  const q8GraphTopOptions = Array.isArray(q8GraphPayload?.top_options) ? q8GraphPayload.top_options : [40, 80, 120]
  const q8GraphMethodology = q8GraphPayload?.methodology ?? {}
  const q8GraphAlgorithm = q8GraphPayload?.algorithm ?? 'Leiden'
  const q8SelectedCommunity = q8GraphCommunities.some((item: any) => String(item.id) === q8GraphCommunity)
    ? q8GraphCommunity
    : String(q8GraphCommunities[0]?.id ?? '')
  const q8GraphNodes = Array.isArray(q8GraphPayload?.nodes)
    ? q8GraphPayload.nodes
        .filter((node: any) => String(node.community) === q8SelectedCommunity)
        .sort((a: any, b: any) => Number(b.grau_ponderado ?? 0) - Number(a.grau_ponderado ?? 0))
        .slice(0, q8GraphTopLimit)
    : []
  const q8NodeIds = new Set(q8GraphNodes.map((node: any) => String(node.id)))
  const q8GraphLinks = Array.isArray(q8GraphPayload?.links)
    ? q8GraphPayload.links.filter((link: any) => q8NodeIds.has(String(link.source)) && q8NodeIds.has(String(link.target)))
    : []
  const q8CommunityLabel = q8GraphCommunities.find((item: any) => String(item.id) === q8SelectedCommunity)?.label ?? 'Comunidade'
  const q8CommunityGraphChart = q8GraphNodes.length > 0
    ? {
        type: 'network_graph',
        title: 'Grafo Leiden por Kappa ponderado de votos',
        description: 'Nos rotulados por ID do deputado; arestas ponderadas pelo Kappa de Cohen em votos Sim/Nao, com votacoes divisivas recebendo maior peso.',
        y_fields: [],
        categories: [],
        series: [
          {
            name: 'Grafo',
            nodes: q8GraphNodes.map((node: any) => ({
              ...node,
              category: 0,
            })),
            links: q8GraphLinks,
            categories: [{ name: q8CommunityLabel }],
          },
        ],
        options: {
          repulsion: q8GraphTopLimit <= 40 ? 160 : 100,
          edge_length: q8GraphTopLimit <= 40 ? 70 : 50,
        },
      }
    : null
  const handleTableChange = (next: TableState) => {
    if (isQ8) {
      setTableState({ ...next, pageSize: 50 })
      return
    }
    setTableState(next)
  }
  const renderDetailedCell = (row: Record<string, unknown>, columnKey: string) => {
    if (showDeputyPhotos && columnKey === 'id_deputado') {
      return (
        <DeputyAvatar
          id={String(row.id_deputado ?? '')}
          nome={String(row.nome ?? row.nome_parlamentar ?? 'Deputado')}
          size={40}
        />
      )
    }
    return formatCellValue(row[columnKey])
  }
  return (
    <main className="question-page">
      <section className="question-intro stagger-item">
        <h1>
          {questionMeta.id.toUpperCase()} - {questionMeta.title}
        </h1>
        <p>{questionMeta.description}</p>
      </section>

      <WarningBanner warnings={payload.warnings} />
      {!hasWordClouds && !isQ3 ? (
        <ExecutiveCards
          cards={
            questionMeta.id.toLowerCase() === 'q4'
              ? payload.summary_cards.filter((c) => c.unit !== 'contagem')
              : payload.summary_cards
          }
        />
      ) : null}

      {isQ2 && filters.eixos.length > 0 && (
        <div className="active-filter-banner stagger-item">
          <span>
            Filtrado por Tema: <strong>{filters.eixos[0]}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              if (onFiltersChange) {
                onFiltersChange({ ...filters, eixos: [] })
              }
            }}
          >
            Limpar Filtro
          </button>
        </div>
      )}

      {payload.empty_state.is_empty ? (
        <NoDataState message={payload.empty_state.message} />
      ) : isQ3 ? (
        <>
          <section className="q3-methodology stagger-item">
            <p>
              Os eixos tematicos sao inferidos a partir dos textos das proposicoes e objetos
              associados a votacao. Cada voto nominal e contado uma unica vez.
            </p>
          </section>
          {shouldShowChart ? (
            <ChartPanel
              spec={payload.chart_spec}
              activeFilters={undefined}
              onBarClick={undefined}
            />
          ) : null}
        </>
      ) : (
        <>
          {isQ2 ? (
            <WordCloudGrid 
              spec={payload.chart_spec} 
              selectedTheme={filters.eixos[0] || null}
              onWordClick={(word) => {
                if (onFiltersChange) {
                  onFiltersChange({ ...filters, eixos: [word] })
                }
              }}
            />
          ) : null}
          {shouldShowChart ? (
            <>
              <ChartPanel
                spec={payload.chart_spec}
                yearLabels={yearLegend}
                activeFilters={undefined}
                onBarClick={undefined}
              />
              {payload.chart_spec.options?.second_chart && (
                <ChartPanel
                  spec={payload.chart_spec.options.second_chart as any}
                  yearLabels={yearLegend}
                  activeFilters={filters}
                  onBarClick={
                    questionMeta.id.toLowerCase() === 'q4'
                      ? (category) => {
                          if (!onFiltersChange) return
                          const current = filters.partidos || []
                          const next = current.includes(category)
                            ? current.filter((item) => item !== category)
                            : [...current, category]
                          onFiltersChange({
                            ...filters,
                            partidos: next,
                          })
                        }
                    : undefined
                  }
                />
              )}
              {q6ExtraCharts.map((chart, index) => (
                <ChartPanel
                  key={`q6-extra-chart-${index}`}
                  spec={chart as any}
                  activeFilters={undefined}
                />
              ))}
              {q7BenefitRankingChart ? (
                <>
                  <section className="stagger-item q7-ranking-controls">
                    <h2>Ranking horizontal por beneficio</h2>
                    <p>Selecione o ano e o tamanho do ranking para comparar os deputados por beneficio.</p>
                    <div className="filter-grid">
                      <label>
                        Ano
                        <select value={q7SelectedYear ?? ''} onChange={(event) => setQ7RankingYear(event.target.value)}>
                          {q7RankingYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Top
                        <select value={q7TopLimit} onChange={(event) => setQ7TopLimit(Number(event.target.value))}>
                          {Q7_TOP_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              Top {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </section>
                  <ChartPanel spec={q7BenefitRankingChart as any} />
                </>
              ) : null}
              {q8CommunityGraphChart ? (
                <>
                  <section className="stagger-item q8-graph-controls">
                    <h2>Grafo de comunidades de voto</h2>
                    <p>
                      Comunidades por {q8GraphAlgorithm}, com deputados filtrados por votos validos,
                      cobertura minima entre pares e Kappa de Cohen ponderado por votacoes divisivas.
                    </p>
                    <p>
                      Minimos: {q8GraphMethodology.min_valid_votes_per_deputy ?? 100} votos por deputado,
                      {' '}{q8GraphMethodology.min_shared_votes_per_pair ?? 100} votacoes em comum,
                      cobertura {(Number(q8GraphMethodology.min_coverage ?? 0.5) * 100).toLocaleString('pt-BR')}%,
                      Kappa {Number(q8GraphMethodology.min_kappa ?? 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}+,
                      peso {q8GraphMethodology.vote_weight_formula ?? '4*p*(1-p)'}.
                    </p>
                    <div className="filter-grid">
                      <label>
                        Comunidade
                        <select value={q8SelectedCommunity} onChange={(event) => setQ8GraphCommunity(event.target.value)}>
                          {q8GraphCommunities.map((community: any) => (
                            <option key={String(community.id)} value={String(community.id)}>
                              {community.label} ({community.qtd_deputados} deputados)
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Deputados
                        <select value={q8GraphTopLimit} onChange={(event) => setQ8GraphTopLimit(Number(event.target.value))}>
                          {q8GraphTopOptions.map((option: number) => (
                            <option key={option} value={option}>
                              Top {option} conectados
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </section>
                  <ChartPanel spec={q8CommunityGraphChart as any} />
                </>
              ) : null}
            </>
          ) : null}
          {isQ2 && (
            filters.eixos.length > 0 ? (
              <section className="deputies-grid-section stagger-item">
                <h2>Atuação no Eixo: {filters.eixos[0]}</h2>
                <div className="deputies-card-grid" data-testid="deputies-cards-grid">
                  {payload.table_spec.rows.map((row: any) => (
                    <article className="deputy-card" key={`${row.id_deputado}-${row.tema}-${row.sigla_partido}-${row.ano_dados || ''}`} data-testid="deputy-card">
                      <div className="deputy-card-header">
                        <h3>{row.nome}</h3>
                        <p className="deputy-civil-name">{row.nome_civil}</p>
                        <span className="deputy-badge">
                          {row.sigla_partido} / {row.sigla_uf}
                        </span>
                      </div>
                      <div className="deputy-card-body">
                        <div className="deputy-metric">
                          <span className="metric-label">Proposições:</span>
                          <span className="metric-value">{row.qtd_proposicoes}</span>
                        </div>
                        <div className="deputy-specialization">
                          <span className="specialization-label">Principal Eixo:</span>
                          <span className="specialization-value">{row.tema_mais_atuante_deputado}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <div className="q2-empty-selection stagger-item">
                <p>Selecione um tema na nuvem de palavras ou no painel de filtros para visualizar a atuação dos deputados.</p>
              </div>
            )
          )}
        </>
      )}

      {isQ11 ? (
        <WordCloudGrid 
          spec={payload.chart_spec} 
          selectedTheme={null}
          onWordClick={() => {}}
        />
      ) : null}

      {/* Seção recolhível de Dados Detalhados */}
      {!payload.empty_state.is_empty && ((!isQ2 && mainTable) || complementTables.length > 0) ? (
        <section className="stagger-item detailed-data-section">
          <button
            type="button"
            className="toggle-detailed-data-btn"
            onClick={() => setShowDetailedData(!showDetailedData)}
          >
            {showDetailedData ? '▲ Ocultar Dados Detalhados' : '▼ Visualizar Dados Detalhados (Tabelas)'}
          </button>
          
          <div className={`detailed-data-content stagger-item${showDetailedData ? '' : ' hidden'}`}>
              {!isQ2 && (
                <DataTablePanel
                  table={mainTable}
                  state={tableStateView}
                  onChange={handleTableChange}
                  lockPageSize={isQ8}
                  compact={isQ3}
                  showDeputyPhotos={showDeputyPhotos}
                />
              )}
              
              {complementTables
                .filter((table) => !table.title.toLowerCase().includes('complementar'))
                .map((table) => (
                  table.title.toLowerCase().includes('ranking global') ? (
                    <DataTablePanel
                      key={table.title}
                      table={table}
                      state={tableStateView}
                      onChange={handleTableChange}
                      showDeputyPhotos={showDeputyPhotos}
                    />
                  ) : (
                    <section key={table.title} className="complement-section">
                      <h2>{table.title}</h2>
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              {table.columns.map((column) => (
                                <th key={column.key}>{column.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.slice(0, 30).map((row, rowIndex) => (
                              <tr key={`${table.title}-${rowIndex}`}>
                                {table.columns.map((column) => (
                                  <td key={`${column.key}-${rowIndex}`}>{renderDetailedCell(row, column.key)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )
                ))}
            </div>
        </section>
      ) : null}

      <QueryDrawer panel={payload.query_panel} />
    </main>
  )
}
