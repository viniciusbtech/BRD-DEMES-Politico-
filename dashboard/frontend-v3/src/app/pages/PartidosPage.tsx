import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchMeta, fetchQuestion } from "../api";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import type { FilterChoice, QuestionPayload, TableSpec } from "../types";

type PartidosPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
};

type TooltipValue = string | number | Array<string | number>;

type Party = {
  id: string;
  name: string;
  full: string;
  seats: number;
  color: string;
  presence: number;
  ideology: string;
  votes: number;
  totalVotes: number;
  averageVotesPerSession: number;
  voteRank: number;
  proposals: number;
  proposalRank: number;
  spending: number;
  spendingRank: number;
  averageSpending: number;
  expenses: number;
  influence: number;
  scoreTotal: number;
  normVotes: number;
  normProposals: number;
  normSpending: number;
};

type ProposalSummary = {
  id: string;
  title: string;
  author: string;
  status: string;
  date: string;
};

type WordCloudItem = {
  word: string;
  size: number;
  weight: number;
};

type AnnualPartySnapshot = {
  year: string;
  votes: number;
  proposals: number;
  spending: number;
  expenses: number;
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const sectionTitleStyle = { fontFamily: SERIF, color: "#f0ece4" };
const PARTY_COLORS = ["#1a3a7c", "#d4841a", "#c41230", "#2e5fa3", "#4a7c59", "#7b3fa0", "#c8970a", "#888880"];

const PARTY_NAMES: Record<string, string> = {
  PL: "Partido Liberal",
  UNIAO: "Uniao Brasil",
  PT: "Partido dos Trabalhadores",
  REPUBLICANOS: "Republicanos",
  PP: "Progressistas",
  PSD: "Partido Social Democratico",
  MDB: "Movimento Democratico Brasileiro",
  PODE: "Podemos",
  PSB: "Partido Socialista Brasileiro",
  PSDB: "Partido da Social Democracia Brasileira",
  PSOL: "Partido Socialismo e Liberdade",
  PDT: "Partido Democratico Trabalhista",
  PCDOB: "Partido Comunista do Brasil",
  PV: "Partido Verde",
  AVANTE: "Avante",
  SOLIDARIEDADE: "Solidariedade",
  NOVO: "Novo",
  PRD: "Partido Renovacao Democratica",
  REDE: "Rede Sustentabilidade",
  CIDADANIA: "Cidadania",
};

const statusColor: Record<string, string> = {
  "Mais ativo": "#4a7c59",
  "Acima da media": "#d4841a",
  "Abaixo da media": "#c41230",
};

const formatCurrency = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatNumber = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const raw = (row: Record<string, unknown> | undefined, key: string) => Number(row?.[key] || 0);
const text = (row: Record<string, unknown> | undefined, key: string) => String(row?.[key] || "");

function findTable(payload: QuestionPayload | null, predicate: (table: TableSpec) => boolean): TableSpec | null {
  if (!payload) return null;
  const tables = [payload.table_spec, ...payload.complement_tables];
  return tables.find(predicate) ?? null;
}

function tableRows(payload: QuestionPayload | null, kind: "presence" | "proposals" | "spending") {
  const table = findTable(payload, (candidate) => {
    const title = candidate.title.toLowerCase();
    if (kind === "presence") return title.includes("frequencia") || title.includes("frequ");
    if (kind === "proposals") return title.includes("proposicoes") || title.includes("proposi");
    return title.includes("gastos");
  });
  return table?.rows ?? [];
}

function normalizePartyOptions(rows: Array<Record<string, unknown>>, metaParties: FilterChoice[]): Party[] {
  const presenceRows = rows;
  const proposalRowsByParty = new Map<string, Record<string, unknown>>();
  const spendingRowsByParty = new Map<string, Record<string, unknown>>();
  const scoreRowsByParty = new Map<string, Record<string, unknown>>();

  rows.forEach((row) => {
    const party = text(row, "sigla_partido") || text(row, "termo");
    if (!party) return;
    if ("total_proposicoes" in row) proposalRowsByParty.set(party, row);
    if ("gasto_total" in row) spendingRowsByParty.set(party, row);
    if ("score_total" in row || "frequencia" in row) scoreRowsByParty.set(party, row);
  });

  const maxAverageVotes = Math.max(
    ...presenceRows.map((row) => {
      const participated = raw(row, "votacoes_participadas");
      return participated ? raw(row, "total_votos_registrados") / participated : 0;
    }),
    1,
  );
  const metaLabels = new Map(metaParties.map((party) => [party.value, party.label]));

  return presenceRows
    .map((row, index) => {
      const id = text(row, "sigla_partido");
      const proposal = proposalRowsByParty.get(id);
      const spending = spendingRowsByParty.get(id);
      const score = scoreRowsByParty.get(id);
      const votes = raw(row, "votacoes_participadas");
      const totalVotes = raw(row, "total_votos_registrados");
      const averageVotesPerSession = votes ? totalVotes / votes : 0;
      return {
        id,
        name: id,
        full: PARTY_NAMES[id] ?? metaLabels.get(id) ?? id,
        color: PARTY_COLORS[index % PARTY_COLORS.length],
        ideology: text(row, "ideologia") || text(proposal, "ideologia") || text(spending, "ideologia") || "nao classificado",
        presence: Math.round((averageVotesPerSession / maxAverageVotes) * 100),
        votes,
        totalVotes,
        averageVotesPerSession,
        voteRank: raw(row, "posicao"),
        proposals: raw(proposal, "total_proposicoes"),
        proposalRank: raw(proposal, "posicao"),
        spending: raw(spending, "gasto_total"),
        spendingRank: raw(spending, "posicao"),
        averageSpending: raw(spending, "gasto_medio_por_deputado"),
        expenses: raw(spending, "qtd_despesas"),
        seats: raw(spending, "qtd_deputados"),
        influence: raw(score, "frequencia") || Math.round((averageVotesPerSession / maxAverageVotes) * 100),
        scoreTotal: raw(score, "score_total"),
        normVotes: raw(score, "norm_votacoes"),
        normProposals: raw(score, "norm_proposicoes"),
        normSpending: raw(score, "norm_gastos"),
      };
    })
    .filter((party) => party.id);
}

function buildParties(payload: QuestionPayload | null, metaParties: FilterChoice[]): Party[] {
  const presenceRows = tableRows(payload, "presence");
  const proposalRows = tableRows(payload, "proposals");
  const spendingRows = tableRows(payload, "spending");
  const scoreRows = payload?.chart_spec.options?.scores as Array<Record<string, unknown>> | undefined;
  return normalizePartyOptions([...presenceRows, ...proposalRows, ...spendingRows, ...(scoreRows ?? [])], metaParties);
}

function buildProposalRows(party: Party | null, selectedYear: string): ProposalSummary[] {
  if (!party) return [];
  return [
    {
      id: party.proposalRank ? `#${party.proposalRank}` : "-",
      title: `${formatNumber(party.proposals)} proposicoes registradas${selectedYear ? ` em ${selectedYear}` : " no periodo"}`,
      author: party.name,
      status: party.proposalRank <= 5 ? "Mais ativo" : party.proposalRank <= 12 ? "Acima da media" : "Abaixo da media",
      date: selectedYear || "Todos",
    },
  ];
}

function buildWords(party: Party | null): WordCloudItem[] {
  if (!party) return [];
  return [
    { word: party.name, size: 2.4, weight: 900 },
    { word: party.ideology, size: 1.8, weight: 700 },
    { word: `score ${formatNumber(party.scoreTotal)}`, size: 1.55, weight: 700 },
    { word: `${formatNumber(party.votes)} votacoes`, size: 1.5, weight: 600 },
    { word: `${formatNumber(party.proposals)} proposicoes`, size: 1.35, weight: 500 },
    { word: formatCurrency(party.spending), size: 1.15, weight: 500 },
  ];
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="border border-border px-6 py-12 text-center text-sm text-muted-foreground" style={{ background: "#111111", fontFamily: MONO }}>
      {message}
    </div>
  );
}

export default function PartidosPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado }: PartidosPageProps) {
  const [payload, setPayload] = useState<QuestionPayload | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<QuestionPayload | null>(null);
  const [annualPayloads, setAnnualPayloads] = useState<Record<string, QuestionPayload>>({});
  const [metaParties, setMetaParties] = useState<FilterChoice[]>([]);
  const [years, setYears] = useState<FilterChoice[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [partyQuery, setPartyQuery] = useState("");
  const [showPartyDrop, setShowPartyDrop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchMeta(),
      fetchQuestion("q11", { anos: selectedYear ? [selectedYear] : [] }, { page: 1, pageSize: 200 }),
    ])
      .then(([meta, q11]) => {
        if (!mounted) return;
        setMetaParties(meta.available_filters.partidos);
        setYears(meta.available_filters.anos);
        setPayload(q11);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Erro ao carregar dados dos partidos.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedPartyId) {
      setSelectedPayload(null);
      return;
    }

    let mounted = true;
    fetchQuestion(
      "q11",
      {
        anos: selectedYear ? [selectedYear] : [],
        partidos: [selectedPartyId],
      },
      { page: 1, pageSize: 200 },
    )
      .then((q11) => {
        if (mounted) setSelectedPayload(q11);
      })
      .catch(() => {
        if (mounted) setSelectedPayload(null);
      });

    return () => {
      mounted = false;
    };
  }, [selectedPartyId, selectedYear]);

  useEffect(() => {
    if (!selectedPartyId || years.length === 0) {
      setAnnualPayloads({});
      return;
    }

    let mounted = true;
    Promise.all(
      years.map((year) =>
        fetchQuestion(
          "q11",
          {
            anos: [year.value],
            partidos: [selectedPartyId],
          },
          { page: 1, pageSize: 200 },
        ),
      ),
    )
      .then((results) => {
        if (!mounted) return;
        setAnnualPayloads(Object.fromEntries(years.map((year, index) => [year.value, results[index]])));
      })
      .catch(() => {
        if (mounted) setAnnualPayloads({});
      });

    return () => {
      mounted = false;
    };
  }, [selectedPartyId, years]);

  const parties = useMemo(() => buildParties(payload, metaParties), [payload, metaParties]);
  const selectedParties = useMemo(() => buildParties(selectedPayload, metaParties), [selectedPayload, metaParties]);
  const selectedFromBackend = selectedParties.find((party) => party.id === selectedPartyId);
  const selectedBase = parties.find((party) => party.id === selectedPartyId) ?? parties[0] ?? null;
  const selected =
    selectedFromBackend && selectedBase
      ? {
          ...selectedBase,
          proposals: selectedFromBackend.proposals,
          proposalRank: selectedFromBackend.proposalRank,
          spending: selectedFromBackend.spending,
          spendingRank: selectedFromBackend.spendingRank,
          averageSpending: selectedFromBackend.averageSpending,
          expenses: selectedFromBackend.expenses,
          seats: selectedFromBackend.seats,
          ideology: selectedFromBackend.ideology,
          influence: selectedFromBackend.influence,
          scoreTotal: selectedFromBackend.scoreTotal,
          normVotes: selectedFromBackend.normVotes,
          normProposals: selectedFromBackend.normProposals,
          normSpending: selectedFromBackend.normSpending,
        }
      : selectedBase ?? selectedFromBackend ?? null;

  useEffect(() => {
    if (!selectedPartyId && parties[0]) {
      setSelectedPartyId(parties[0].id);
      setPartyQuery(parties[0].full);
    } else if (selectedPartyId && selected && !partyQuery) {
      setPartyQuery(selected.full);
    }
  }, [parties, partyQuery, selected, selectedPartyId]);

  const filteredParties = useMemo(() => {
    const query = partyQuery.trim().toLowerCase();
    if (!query || selected?.full === partyQuery) return parties;
    return parties.filter((party) => `${party.full} ${party.name}`.toLowerCase().includes(query));
  }, [parties, partyQuery, selected?.full]);

  const words = useMemo(() => buildWords(selected), [selected]);
  const proposals = useMemo(() => buildProposalRows(selected, selectedYear), [selected, selectedYear]);
  const sortedParties = useMemo(
    () => [...parties].sort((a, b) => b.averageVotesPerSession - a.averageVotesPerSession || a.name.localeCompare(b.name)),
    [parties],
  );
  const spendingRankParties = useMemo(
    () => [...parties].filter((party) => party.spending > 0).sort((a, b) => b.spending - a.spending || a.name.localeCompare(b.name)).slice(0, 12),
    [parties],
  );
  const proposalRankParties = useMemo(
    () => [...parties].filter((party) => party.proposals > 0).sort((a, b) => b.proposals - a.proposals || a.name.localeCompare(b.name)).slice(0, 12),
    [parties],
  );
  const annualSnapshots: AnnualPartySnapshot[] = useMemo(
    () =>
      years.map((year) => {
        const party = buildParties(annualPayloads[year.value] ?? null, metaParties).find((item) => item.id === selectedPartyId);
        return {
          year: year.value,
          votes: party?.votes ?? 0,
          proposals: party?.proposals ?? 0,
          spending: party?.spending ?? 0,
          expenses: party?.expenses ?? 0,
        };
      }),
    [annualPayloads, metaParties, selectedPartyId, years],
  );
  const presenceRank = selected ? sortedParties.findIndex((party) => party.id === selected.id) + 1 : 0;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateDeputado={onNavigateDeputado} />

      <PageHero
        n="3"
        tag="AGREMIACOES"
        title="Partidos"
        desc="Selecione um partido para ver presenca, gastos, proposicoes, nuvem de palavras e ranking de influencia."
        imgId="photo-1699112204356-532841a77e07"
        stripImgs={[
          { id: "photo-1741030766598-d4810a5a7563", alt: "Manifestacao com megafone" },
          { id: "photo-1567965142886-f347ae9b829b", alt: "Bandeira politica" },
          { id: "photo-1561489396-888724a1543d", alt: "Reuniao de lideres" },
        ]}
      />

      <div className="border-b border-border px-6 py-8 md:px-14">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-4 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              SELECIONE UM PARTIDO
            </p>
            <div className="relative max-w-xl">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                ?
              </span>
              <input
                value={partyQuery}
                onChange={(event) => {
                  setPartyQuery(event.target.value);
                  setShowPartyDrop(true);
                }}
                onFocus={() => setShowPartyDrop(true)}
                placeholder="Nome ou sigla do partido..."
                className="w-full border border-border bg-card py-3.5 pl-10 pr-12 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {partyQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setPartyQuery("");
                    setShowPartyDrop(true);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  x
                </button>
              ) : null}

              {showPartyDrop ? (
                <div className="absolute left-0 right-0 top-full z-20 max-h-80 overflow-y-auto border border-border" style={{ background: "#141414" }}>
                  {filteredParties.length ? (
                    filteredParties.map((party) => (
                      <button
                        key={party.id}
                        type="button"
                        onClick={() => {
                          setSelectedPartyId(party.id);
                          setPartyQuery(party.full);
                          setShowPartyDrop(false);
                        }}
                        className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-black" style={{ background: party.color, fontFamily: SERIF, color: "#f0ece4" }}>
                          {party.name}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                            {party.full}
                          </span>
                        <span className="block text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                            {party.seats || "-"} deputados · media {party.averageVotesPerSession.toFixed(1)} votos/votacao
                          </span>
                        </span>
                        {selected?.id === party.id ? (
                          <span className="shrink-0 text-xs text-primary" style={{ fontFamily: MONO }}>
                            SELECIONADO
                          </span>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      Nenhum partido encontrado.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedYear("")}
              className="border px-4 py-2 text-xs font-bold uppercase transition-colors"
              style={{
                borderColor: selectedYear ? "rgba(240,236,228,0.14)" : "var(--primary)",
                background: selectedYear ? "transparent" : "var(--primary)",
                color: selectedYear ? "var(--muted-foreground)" : "#fff",
                fontFamily: MONO,
              }}
            >
              Todos
            </button>
            {years.map((year) => (
              <button
                key={year.value}
                type="button"
                onClick={() => setSelectedYear(year.value)}
                className="border px-4 py-2 text-xs font-bold uppercase transition-colors"
                style={{
                  borderColor: selectedYear === year.value ? "var(--primary)" : "rgba(240,236,228,0.14)",
                  background: selectedYear === year.value ? "var(--primary)" : "transparent",
                  color: selectedYear === year.value ? "#fff" : "var(--muted-foreground)",
                  fontFamily: MONO,
                }}
              >
                {year.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <section className="px-6 py-14 md:px-14">
          <EmptyPanel message="Carregando dados reais da Q11..." />
        </section>
      ) : error ? (
        <section className="px-6 py-14 md:px-14">
          <EmptyPanel message={error} />
        </section>
      ) : !selected ? (
        <section className="px-6 py-14 md:px-14">
          <EmptyPanel message="Sem dados para os filtros selecionados." />
        </section>
      ) : (
        <>
          <div className="flex items-center gap-5 border-b border-border px-6 py-8 md:px-14" style={{ borderLeft: `4px solid ${selected.color}`, background: "#111111" }}>
            <div>
              <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: SERIF }}>
                {selected.full}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {selected.seats || "-"} DEPUTADOS FEDERAIS · {selected.ideology.toUpperCase()}
              </p>
            </div>
          </div>

          <section className="border-b border-border px-6 py-14 md:px-14">
            <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              1. FREQUENCIA
            </p>
            <h3 className="mb-10 text-3xl font-black" style={sectionTitleStyle}>
              Frequencia do partido nas votacoes
            </h3>

            <div className="grid grid-cols-1 gap-px border border-border md:grid-cols-3" style={{ background: "rgba(240,236,228,0.07)" }}>
              {[
                { label: "MEDIA DE VOTOS POR VOTACAO", value: selected.averageVotesPerSession.toFixed(1), note: "votos registrados por votacao participada" },
                { label: "VOTACOES PARTICIPADAS", value: formatNumber(selected.votes), note: selectedYear ? `em ${selectedYear}` : "todos os anos" },
                { label: "TOTAL DE VOTOS", value: formatNumber(selected.totalVotes), note: "votos registrados pela bancada" },
              ].map((item) => (
                <div key={item.label} className="bg-background px-8 py-8">
                  <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                    {item.label}
                  </p>
                  <p className="mb-1 text-4xl font-black text-primary" style={{ fontFamily: SERIF }}>
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {item.note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 max-w-2xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>MENOR MEDIA</span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>MAIOR MEDIA</span>
              </div>
              <div className="h-4 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                <div style={{ width: `${selected.presence}%`, background: selected.color, height: "100%" }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {presenceRank}o lugar em media de votos por votacao entre os partidos listados
              </p>
            </div>

            <div className="mt-10 h-52">
              <p className="mb-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                COMPARATIVO DE MEDIA DE VOTOS POR VOTACAO
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedParties}>
                  <XAxis dataKey="name" tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }} formatter={(value: TooltipValue) => [Number(value).toFixed(1), "Votos por votacao"]} />
                  <Bar dataKey="averageVotesPerSession" radius={[2, 2, 0, 0]} maxBarSize={48}>
                    {sortedParties.map((party) => (
                      <Cell key={party.id} fill={party.id === selected.id ? selected.color : "rgba(240,236,228,0.12)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="border-b border-border px-6 py-14 md:px-14">
            <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              2. PROPOSICOES
            </p>
            <h3 className="mb-10 text-3xl font-black" style={sectionTitleStyle}>
              Numero de proposicoes desse partido
            </h3>

            <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
              <div className="border border-border bg-background px-8 py-8">
                <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                  TOTAL DE PROPOSICOES
                </p>
                <p className="text-5xl font-black text-primary" style={{ fontFamily: SERIF }}>
                  {formatNumber(selected.proposals)}
                </p>
                <p className="mt-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  Ranking #{selected.proposalRank || "-"} {selectedYear ? `em ${selectedYear}` : "no periodo consolidado"}
                </p>
              </div>

              <div className="h-72">
                <p className="mb-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  COMPARATIVO DE PROPOSICOES - PARTIDOS
                </p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={proposalRankParties} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                    <XAxis type="number" tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={92} tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                      formatter={(value: TooltipValue) => [formatNumber(Number(value)), "Proposicoes"]}
                    />
                    <Bar dataKey="proposals" radius={[0, 2, 2, 0]} maxBarSize={18}>
                      {proposalRankParties.map((party) => (
                        <Cell key={party.id} fill={party.id === selected.id ? selected.color : "rgba(240,236,228,0.16)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-px overflow-x-auto border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
              {proposals.map((proposal) => (
                <div key={proposal.id} className="grid min-w-[760px] items-center gap-4 bg-background px-6 py-4 transition-colors hover:bg-card" style={{ gridTemplateColumns: "120px 1fr 150px 110px" }}>
                  <div>
                    <p className="text-xs font-bold text-primary" style={{ fontFamily: MONO }}>{proposal.id}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{proposal.date}</p>
                  </div>
                  <p className="text-sm leading-snug text-foreground">{proposal.title}</p>
                  <p className="truncate text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{proposal.author}</p>
                  <span className="px-2 py-1 text-center text-xs" style={{ fontFamily: MONO, color: statusColor[proposal.status], background: `${statusColor[proposal.status]}18` }}>
                    {proposal.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="border-b border-border px-6 py-14 md:px-14">
            <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              3. GASTOS
            </p>
            <h3 className="mb-10 text-3xl font-black" style={sectionTitleStyle}>
              Como esse partido gastou?
            </h3>

            {selected.spending > 0 ? (
              <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div>
                  <div className="mb-6 grid grid-cols-1 gap-px border border-border sm:grid-cols-2" style={{ background: "rgba(240,236,228,0.07)" }}>
                    {[
                      { label: "TOTAL GASTO", value: formatCurrency(selected.spending), note: selectedYear ? `em ${selectedYear}` : "todos os anos" },
                      { label: "GASTO MEDIO POR DEPUTADO", value: formatCurrency(selected.averageSpending || (selected.seats ? selected.spending / selected.seats : 0)), note: "Q11.c" },
                      { label: "DESPESAS REGISTRADAS", value: formatNumber(selected.expenses), note: "quantidade de despesas" },
                      { label: "DEPUTADOS NO PARTIDO", value: formatNumber(selected.seats), note: "deputados com gastos" },
                    ].map((item) => (
                      <div key={item.label} className="bg-background px-6 py-6">
                        <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                          {item.label}
                        </p>
                        <p className="mb-1 text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                          {item.value}
                        </p>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    Ranking de gastos: #{selected.spendingRank || "-"} entre os partidos listados na Q11.c. Use os anos no topo para alternar entre todos os anos e um ano especifico.
                  </p>
                </div>

                <div>
                  <div className="h-56">
                    <p className="mb-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      GASTO DO PARTIDO POR ANO
                    </p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={annualSnapshots} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                        <XAxis dataKey="year" tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value: number) => `R$${Math.round(value / 1000000)}M`}
                        />
                        <Tooltip
                          contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                          formatter={(value: TooltipValue) => [formatCurrency(Number(value)), "Gasto"]}
                        />
                        <Bar dataKey="spending" radius={[2, 2, 0, 0]} maxBarSize={42} fill={selected.color} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-8 h-56">
                    <p className="mb-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      COMPARATIVO DE GASTO TOTAL - PARTIDOS
                    </p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spendingRankParties} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                        <XAxis
                          type="number"
                          tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value: number) => `R$${Math.round(value / 1000000)}M`}
                        />
                        <YAxis dataKey="name" type="category" width={92} tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                          formatter={(value: TooltipValue) => [formatCurrency(Number(value)), "Gasto total"]}
                        />
                        <Bar dataKey="spending" radius={[0, 2, 2, 0]} maxBarSize={16}>
                          {spendingRankParties.map((party) => (
                            <Cell key={party.id} fill={party.id === selected.id ? selected.color : "rgba(240,236,228,0.16)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyPanel message="Sem gastos para este partido e ano." />
            )}
          </section>

          <section className="border-b border-border px-6 py-14 md:px-14">
            <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              4. NUVEM
            </p>
            <h3 className="mb-4 text-3xl font-black" style={sectionTitleStyle}>
              Nuvem de palavras e score composto
            </h3>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              A Q11.d calcula uma nuvem em que cada termo e um partido, ponderado por frequencia nas votacoes, proposicoes e gastos. Ela ainda nao traz palavras tematicas especificas de cada partido.
            </p>
            <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-4" style={{ background: "rgba(240,236,228,0.07)" }}>
              {[
                { label: "SCORE TOTAL", value: formatNumber(selected.scoreTotal || selected.influence), note: "Q11.d" },
                { label: "NORM. VOTACOES", value: `${formatNumber(selected.normVotes)}%`, note: "peso da frequencia" },
                { label: "NORM. PROPOSICOES", value: `${formatNumber(selected.normProposals)}%`, note: "peso da producao" },
                { label: "NORM. GASTOS", value: `${formatNumber(selected.normSpending)}%`, note: "peso dos gastos" },
              ].map((item) => (
                <div key={item.label} className="bg-background px-6 py-6">
                  <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                    {item.label}
                  </p>
                  <p className="text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-x-6 gap-y-4 border border-border p-10" style={{ background: "#111111" }}>
              {words.map((word) => (
                <span key={word.word} className="select-none transition-opacity hover:opacity-100" style={{ fontFamily: SERIF, fontWeight: word.weight, fontSize: `${word.size}rem`, color: selected.color, opacity: 0.3 + word.size * 0.25 }}>
                  {word.word}
                </span>
              ))}
            </div>
          </section>

        </>
      )}
    </div>
  );
}
