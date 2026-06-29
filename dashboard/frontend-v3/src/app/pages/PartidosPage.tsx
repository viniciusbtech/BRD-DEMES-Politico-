import { useEffect, useMemo, useState } from "react";
import { fetchMeta, fetchQuestion } from "../api";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import type { FilterChoice, QuestionPayload, TableSpec } from "../types";
import { useTheme } from "../../contexts/ThemeContext";

type PartidosPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
  onNavigateRecorte: (path: string) => void;
};

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


type AnnualPartySnapshot = {
  year: string;
  votes: number;
  proposals: number;
  spending: number;
  expenses: number;
};

type PartyExpenseCategory = {
  rank: number;
  category: string;
  spending: number;
  percent: number;
  launches: number;
  deputies: number;
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const sectionTitleStyle = { fontFamily: SERIF, color: "var(--foreground)" };
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


type MetodoItem = {
  id: string;
  titulo: string;
  origem: string;
  formula: string;
  passos: string[];
  interpretacao: string;
};

const METODOS: MetodoItem[] = [
  {
    id: "freq",
    titulo: "Frequencia nas Votacoes",
    origem: "Q11.a — Frequencia dos Partidos",
    formula: "Votacoes participadas = numero de votacoes distintas em que a bancada do partido registrou voto",
    passos: [
      "1. Cada vez que um deputado vota em um projeto, esse voto fica registrado junto com a sigla do partido dele.",
      "2. Para cada partido, contamos em quantas votacoes diferentes a bancada apareceu (votacoes distintas).",
      "3. Tambem somamos o total de votos individuais registrados pela bancada inteira.",
      "4. Ordenamos do partido mais presente para o menos presente nas votacoes.",
    ],
    interpretacao: "Partidos com bancadas grandes tendem a registrar mais votos no total. Por isso a pagina destaca a media de votos por votacao, que ajuda a comparar partidos de tamanhos diferentes.",
  },
  {
    id: "prop",
    titulo: "Proposicoes por Partido",
    origem: "Q11.b — Proposicoes de Projetos",
    formula: "Total = numero de proposicoes distintas em que algum deputado do partido e autor",
    passos: [
      "1. Cada projeto de lei (proposicao) tem um ou mais deputados como autores, e cada autor pertence a um partido.",
      "2. Para cada partido, contamos quantos projetos distintos tem pelo menos um autor da legenda.",
      "3. Cada proposicao e contada uma unica vez por partido, mesmo que varios deputados da legenda a assinem (COUNT DISTINCT).",
      "4. Ordenamos do partido que mais propos para o que menos propos.",
    ],
    interpretacao: "Quantidade nao e qualidade: muitos projetos nao significam que foram aprovados. O numero mostra o volume de iniciativa legislativa, nao o impacto de cada proposta.",
  },
  {
    id: "gastos",
    titulo: "Gastos do Partido (CEAP)",
    origem: "Q11.c — Gastos por Partido",
    formula: "Gasto total = soma do valor liquido de todas as despesas dos deputados do partido",
    passos: [
      "1. Toda despesa reembolsada pela cota parlamentar (CEAP) esta ligada ao deputado e, por ele, ao partido.",
      "2. Somamos o valor liquido de todas as despesas dos deputados de cada partido.",
      "3. Dividimos pelo numero de deputados da legenda para obter o gasto medio por deputado.",
      "4. Ordenamos do partido que mais gastou para o que menos gastou e mostramos a evolucao por ano.",
    ],
    interpretacao: "O gasto total de um partido cresce com o tamanho da bancada. O gasto medio por deputado e a forma mais justa de comparar legendas grandes e pequenas.",
  },
  {
    id: "nuvem",
    titulo: "Nuvem de Temas",
    origem: "Q11 (extra) — Temas das Proposicoes",
    formula: "Quantas proposicoes distintas o partido apresentou em cada tema legislativo",
    passos: [
      "1. Lendo o tema de cada proposicao apresentada pelo partido, agrupamos os projetos por assunto legislativo.",
      "2. Contamos quantas proposicoes distintas o partido tem em cada tema (COUNT DISTINCT).",
      "3. Os temas com mais proposicoes aparecem maiores na nuvem de palavras.",
      "4. Clicar em um tema filtra a lista para mostrar apenas as proposicoes daquele assunto.",
    ],
    interpretacao: "A nuvem revela as prioridades tematicas do partido — em que assuntos ele concentra suas propostas. Temas maiores indicam mais iniciativa naquela area, nao necessariamente mais aprovacoes.",
  },
];

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

function compactExpenseCategory(value: string) {
  return value
    .replace("DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.", "Divulgacao parlamentar")
    .replace("PASSAGEM AÉREA - SIGEPA", "Passagem aerea")
    .replace("PASSAGEM AÉREA - RPA", "Passagem aerea")
    .replace("PASSAGEM AÉREA - REEMBOLSO", "Passagem aerea")
    .replace("LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES", "Locacao de veiculos")
    .replace("LOCAÇÃO OU FRETAMENTO DE AERONAVES", "Locacao de aeronaves")
    .replace("LOCAÇÃO OU FRETAMENTO DE EMBARCAÇÕES", "Locacao de embarcacoes")
    .replace("MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR", "Manutencao de escritorio")
    .replace("COMBUSTÍVEIS E LUBRIFICANTES.", "Combustiveis")
    .replace("HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL.", "Hospedagem")
    .replace("FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR", "Alimentacao")
    .replace("SERVIÇO DE TÁXI, PEDÁGIO E ESTACIONAMENTO", "Taxi, pedagio e estacionamento")
    .replace("TELEFONIA", "Telefonia")
    .trim();
}

function partyExpenseCategories(payload: QuestionPayload | null, partyId: string, year: string): PartyExpenseCategory[] {
  if (!payload || !partyId) return [];
  const targetTable =
    findTable(payload, (table) => {
      const title = table.title.toLowerCase();
      return title.includes("categorias de gasto por partido") && (year ? title.includes("por ano") : !title.includes("por ano"));
    }) ??
    findTable(payload, (table) => table.title.toLowerCase().includes("categorias de gasto por partido"));

  const rows = (targetTable?.rows ?? []) as Array<Record<string, unknown>>;
  return rows
    .filter((row) => text(row, "sigla_partido") === partyId)
    .filter((row) => !year || String(row.ano_dados ?? "") === year)
    .map((row) => ({
      rank: raw(row, "posicao_categoria"),
      category: compactExpenseCategory(text(row, "descricao_despesa")),
      spending: raw(row, "gasto_total"),
      percent: raw(row, "pct_gasto_partido"),
      launches: raw(row, "qtd_lancamentos"),
      deputies: raw(row, "qtd_deputados"),
    }))
    .sort((a, b) => a.rank - b.rank || b.spending - a.spending)
    .slice(0, 10);
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

  const seen = new Set<string>();
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
    .filter((party) => {
      if (!party.id || seen.has(party.id)) return false;
      seen.add(party.id);
      return true;
    });
}

function buildParties(payload: QuestionPayload | null, metaParties: FilterChoice[]): Party[] {
  const presenceRows = tableRows(payload, "presence");
  const proposalRows = tableRows(payload, "proposals");
  const spendingRows = tableRows(payload, "spending");
  const scoreRows = payload?.chart_spec.options?.scores as Array<Record<string, unknown>> | undefined;
  return normalizePartyOptions([...presenceRows, ...proposalRows, ...spendingRows, ...(scoreRows ?? [])], metaParties);
}


function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="border border-border px-6 py-12 text-center text-sm text-muted-foreground" style={{ background: "var(--card)", fontFamily: MONO }}>
      {message}
    </div>
  );
}


export default function PartidosPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado, onNavigateRecorte }: PartidosPageProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [payload, setPayload] = useState<QuestionPayload | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<QuestionPayload | null>(null);
  const [annualPayloads, setAnnualPayloads] = useState<Record<string, QuestionPayload>>({});
  const [metaParties, setMetaParties] = useState<FilterChoice[]>([]);
  const [years, setYears] = useState<FilterChoice[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [partyQuery, setPartyQuery] = useState("");
  const [showPartyDrop, setShowPartyDrop] = useState(false);
  const [selectedPartyLogo, setSelectedPartyLogo] = useState<string | null>(null);
  const [partyThemes, setPartyThemes] = useState<Array<{ tema: string; frequencia: number }>>([]);
  const [selectedTema, setSelectedTema] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metodoOpen, setMetodoOpen] = useState<Record<string, boolean>>({});
  const toggleMetodo = (id: string) => setMetodoOpen((state) => ({ ...state, [id]: !state[id] }));

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

  useEffect(() => {
    if (!selectedPartyId) { setSelectedPartyLogo(null); return; }
    fetch(`https://dadosabertos.camara.leg.br/api/v2/partidos?sigla=${selectedPartyId}&itens=1`)
      .then((res) => res.json())
      .then((data: { dados: Array<{ urlLogo: string }> }) => {
        setSelectedPartyLogo(data.dados[0]?.urlLogo ?? null);
      })
      .catch(() => setSelectedPartyLogo(null));
  }, [selectedPartyId]);

  useEffect(() => {
    if (!selectedPartyId) { setPartyThemes([]); return; }
    let mounted = true;
    fetchQuestion(
      "q11_extra",
      { partidos: [selectedPartyId], anos: selectedYear ? [selectedYear] : [] },
      { page: 1, pageSize: 200 },
    )
      .then((payload) => {
        if (!mounted) return;
        const rows = payload.table_spec.rows as Array<Record<string, unknown>>;
        setPartyThemes(
          rows
            .filter((r) => r.tema && r.frequencia)
            .map((r) => ({ tema: String(r.tema), frequencia: Number(r.frequencia) }))
            .sort((a, b) => b.frequencia - a.frequencia)
            .slice(0, 40),
        );
      })
      .catch(() => { if (mounted) setPartyThemes([]); });
    return () => { mounted = false; };
  }, [selectedPartyId, selectedYear]);

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
  const selectedExpenseCategories = useMemo(
    () => partyExpenseCategories(selectedPayload ?? payload, selectedPartyId, selectedYear),
    [payload, selectedPayload, selectedPartyId, selectedYear],
  );
  const presenceRank = selected ? sortedParties.findIndex((party) => party.id === selected.id) + 1 : 0;

  type PartidosSection = "frequencia" | "proposicoes" | "gastos" | "nuvem" | "metodologia";
  const [activeSection, setActiveSection] = useState<PartidosSection>("frequencia");
  const RED = "#e00836";
  const sectionMetaStyle = { fontFamily: MONO, color: "var(--foreground)", opacity: 0.82 };
  const contrastMutedStyle = { fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 };
  const SectionHeader = ({ n, tag, title, sub }: { n: string; tag: string; title: string; sub?: string }) => (
    <div className="mb-10">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span
          className="text-5xl font-black leading-none md:text-6xl"
          style={{ fontFamily: SERIF, color: RED, textShadow: "0 0 18px rgba(224,8,54,0.22)" }}
        >
          {n}
        </span>
        <span
          className="text-sm font-black uppercase tracking-[0.3em] md:text-base"
          style={{ fontFamily: MONO, color: "var(--foreground)" }}
        >
          {tag}
        </span>
      </div>
      <h3 className="mb-3 text-3xl font-black leading-tight md:text-5xl" style={sectionTitleStyle}>
        {title}
      </h3>
      {sub ? (
        <p className="max-w-[980px] text-[13px] font-bold uppercase leading-relaxed tracking-[0.18em] md:text-sm" style={sectionMetaStyle}>
          {tag === "METODOLOGIA" ? "Transparencia analitica - Clique em cada metodo para expandir" : sub}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateRecorte={onNavigateRecorte} />

      <PageHero
        n="3"
        tag="AGREMIACOES"
        title="Partidos"
        desc="Selecione um partido para ver presenca, gastos, proposicoes, nuvem de palavras e ranking de influencia."
        imgId="/fundorecortes/recorte3/fundo-recorte3.jpg"
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
                <div className="absolute left-0 right-0 top-full z-50 max-h-80 overflow-y-auto border border-border" style={{ background: "var(--card)" }}>
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
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-black" style={{ background: party.color, fontFamily: SERIF, color: "var(--primary-foreground)" }}>
                          {party.name === "REPUBLICANOS" ? "RP" : party.name === "SOLIDARIEDADE" ? "SD" : party.name}
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
                borderColor: selectedYear ? "var(--border)" : "var(--primary)",
                background: selectedYear ? "transparent" : "var(--primary)",
                color: selectedYear ? "var(--muted-foreground)" : "var(--primary-foreground)",
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
                  borderColor: selectedYear === year.value ? "var(--primary)" : "var(--border)",
                  background: selectedYear === year.value ? "var(--primary)" : "transparent",
                  color: selectedYear === year.value ? "var(--primary-foreground)" : "var(--muted-foreground)",
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
          <div className="flex items-center gap-6 border-b border-border px-6 py-8 md:px-14" style={{ borderLeft: `4px solid ${selected.color}`, background: "var(--card)" }}>
            {selectedPartyLogo ? (
              <img
                src={selectedPartyLogo}
                alt={selected.name}
                className="h-20 w-20 shrink-0 object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center text-xl font-black" style={{ background: selected.color, color: "var(--primary-foreground)", fontFamily: SERIF }}>
                {selected.name === "REPUBLICANOS" ? "RP" : selected.name === "SOLIDARIEDADE" ? "SD" : selected.name}
              </div>
            )}
            <div>
              <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: SERIF }}>
                {selected.full}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {selected.seats || "-"} DEPUTADOS FEDERAIS · {selected.ideology.toUpperCase()}
              </p>
            </div>
          </div>

          {/* ── NAV DE SEÇÕES ── */}
          <div
            className="sticky top-[56px] z-30 flex flex-wrap gap-3 border-b px-6 py-3 md:px-14"
            style={{ background: "var(--background)", borderColor: "var(--border)" }}
          >
            <button type="button" onClick={() => setActiveSection("frequencia")}
              className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{ fontFamily: MONO, background: activeSection === "frequencia" ? RED : "transparent", color: activeSection === "frequencia" ? "#fff" : "var(--foreground)", borderColor: activeSection === "frequencia" ? RED : "var(--border)" }}>
              Frequência
            </button>
            <button type="button" onClick={() => setActiveSection("proposicoes")}
              className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{ fontFamily: MONO, background: activeSection === "proposicoes" ? RED : "transparent", color: activeSection === "proposicoes" ? "#fff" : "var(--foreground)", borderColor: activeSection === "proposicoes" ? RED : "var(--border)" }}>
              Proposições
            </button>
            <button type="button" onClick={() => setActiveSection("gastos")}
              className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{ fontFamily: MONO, background: activeSection === "gastos" ? RED : "transparent", color: activeSection === "gastos" ? "#fff" : "var(--foreground)", borderColor: activeSection === "gastos" ? RED : "var(--border)" }}>
              Gastos
            </button>
            <button type="button" onClick={() => setActiveSection("nuvem")}
              className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{ fontFamily: MONO, background: activeSection === "nuvem" ? RED : "transparent", color: activeSection === "nuvem" ? "#fff" : "var(--foreground)", borderColor: activeSection === "nuvem" ? RED : "var(--border)" }}>
              Nuvem
            </button>
            <button type="button" onClick={() => setActiveSection("metodologia")}
              className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{ fontFamily: MONO, background: activeSection === "metodologia" ? RED : "transparent", color: activeSection === "metodologia" ? "#fff" : "var(--foreground)", borderColor: activeSection === "metodologia" ? RED : "var(--border)" }}>
              Metodologia
            </button>
          </div>

          {activeSection === "frequencia" && (
          <section className="border-b border-border px-6 py-14 md:px-14">
            <SectionHeader n="03A" tag="FREQUENCIA" title="Frequencia do partido nas votacoes" />

            <div className="grid grid-cols-1 gap-px border border-border md:grid-cols-3" style={{ background: "var(--secondary)" }}>
              {[
                { label: "MEDIA DE VOTOS POR VOTACAO", value: selected.averageVotesPerSession.toFixed(1), note: "votos registrados por votacao participada" },
                { label: "VOTACOES PARTICIPADAS", value: formatNumber(selected.votes), note: selectedYear ? `em ${selectedYear}` : "todos os anos" },
                { label: "TOTAL DE VOTOS", value: formatNumber(selected.totalVotes), note: "votos registrados pela bancada" },
              ].map((item) => (
                <div key={item.label} className="bg-background px-8 py-8">
                  <p className="mb-2 text-[13px] font-bold uppercase tracking-widest" style={contrastMutedStyle}>
                    {item.label}
                  </p>
                  <p className="mb-1 text-4xl font-black text-primary" style={{ fontFamily: SERIF }}>
                    {item.value}
                  </p>
                  <p className="text-[13px]" style={contrastMutedStyle}>
                    {item.note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 max-w-2xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-bold uppercase tracking-widest" style={contrastMutedStyle}>MENOR MEDIA</span>
                <span className="text-[13px] font-bold uppercase tracking-widest" style={contrastMutedStyle}>MAIOR MEDIA</span>
              </div>
              <div className="h-4 overflow-hidden" style={{ background: "var(--secondary)" }}>
                <div style={{ width: `${selected.presence}%`, background: selected.color, height: "100%" }} />
              </div>
              <p className="mt-2 text-[13px] font-semibold" style={contrastMutedStyle}>
                {presenceRank}o lugar em media de votos por votacao entre os partidos listados
              </p>
            </div>

            <div className="mt-10">
              <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.18em]" style={contrastMutedStyle}>
                COMPARATIVO DE MEDIA DE VOTOS POR VOTACAO
              </p>
              <div className="flex flex-col gap-2">
                {(() => {
                  const maxVal = Math.max(...sortedParties.map((p) => p.averageVotesPerSession), 1);
                  return sortedParties.map((party, index) => {
                    const pct = (party.averageVotesPerSession / maxVal) * 100;
                    const isSelected = party.id === selected.id;
                    const rankColor =
                      index === 0
                        ? "#c41230"
                        : index === 1
                          ? "#9a5a00"
                          : index === 2
                            ? "#7c2d12"
                            : index < 6
                              ? "#9f1239"
                              : "#003366";
                    const barColor = isSelected ? selected.color : isDark ? "rgba(240,236,228,0.22)" : rankColor;
                    return (
                      <div key={party.id} className="flex items-center gap-3">
                        <span
                          className="w-28 shrink-0 text-right text-xs"
                          style={{
                            fontFamily: MONO,
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? selected.color : "var(--muted-foreground)",
                          }}
                        >
                          {party.name}
                        </span>
                        <div
                          className="relative flex-1"
                          style={{
                            background: isDark ? "rgba(240,236,228,0.06)" : "rgba(15,23,42,0.08)",
                            height: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: barColor,
                            }}
                          />
                        </div>
                        <span
                          className="w-10 shrink-0 text-xs"
                          style={{
                            fontFamily: MONO,
                            color: isSelected ? selected.color : "var(--muted-foreground)",
                          }}
                        >
                          {party.averageVotesPerSession.toFixed(1)}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </section>
          )}

          {activeSection === "proposicoes" && (
          <section className="border-b border-border px-6 py-14 md:px-14">
            <SectionHeader n="03B" tag="PROPOSICOES" title="Numero de proposicoes desse partido" />

            <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
              <div className="border border-border bg-background px-8 py-8">
                <p className="mb-2 text-[13px] font-bold uppercase tracking-widest" style={contrastMutedStyle}>
                  TOTAL DE PROPOSICOES
                </p>
                <p className="text-5xl font-black text-primary" style={{ fontFamily: SERIF }}>
                  {formatNumber(selected.proposals)}
                </p>
                <p className="mt-3 text-[13px] font-semibold" style={contrastMutedStyle}>
                  Ranking #{selected.proposalRank || "-"} {selectedYear ? `em ${selectedYear}` : "no periodo consolidado"}
                </p>
              </div>

              <div>
                <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.18em]" style={contrastMutedStyle}>
                  COMPARATIVO DE PROPOSICOES - PARTIDOS
                </p>
                <div className="flex flex-col gap-2">
                  {(() => {
                    const maxVal = Math.max(...proposalRankParties.map((p) => p.proposals), 1);
                    return proposalRankParties.map((party, index) => {
                      const pct = (party.proposals / maxVal) * 100;
                      const isSel = party.id === selected.id;
                      const rankColor =
                        index === 0
                          ? "#c41230"
                        : index === 1
                            ? "#9a5a00"
                            : index === 2
                              ? "#7c2d12"
                              : index < 6
                                ? "#9f1239"
                                : "#003366";
                      const barColor = isSel ? selected.color : isDark ? "rgba(240,236,228,0.22)" : rankColor;
                      return (
                        <div key={party.id} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 text-right text-xs" style={{ fontFamily: MONO, fontWeight: isSel ? 700 : 500, color: isSel ? selected.color : "var(--muted-foreground)" }}>
                            {party.name}
                          </span>
                          <div
                            className="relative flex-1"
                            style={{
                              background: isDark ? "rgba(240,236,228,0.06)" : "rgba(15,23,42,0.08)",
                              height: "12px",
                            }}
                          >
                            <div style={{ width: `${pct}%`, height: "100%", background: barColor }} />
                          </div>
                          <span className="w-20 shrink-0 text-right text-xs" style={{ fontFamily: MONO, color: isSel ? selected.color : "var(--muted-foreground)" }}>
                            {formatNumber(party.proposals)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

          </section>
          )}

          {activeSection === "gastos" && (
          <section className="border-b border-border px-6 py-14 md:px-14">
            <SectionHeader n="03C" tag="GASTOS" title="Como esse partido gastou?" />

            {selected.spending > 0 ? (
              <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div>
                  <div className="mb-6 grid grid-cols-1 gap-px border border-border sm:grid-cols-2" style={{ background: "var(--secondary)" }}>
                    {[
                      { label: "TOTAL GASTO", value: formatCurrency(selected.spending), note: selectedYear ? `em ${selectedYear}` : "todos os anos" },
                      { label: "GASTO MEDIO POR DEPUTADO", value: formatCurrency(selected.averageSpending || (selected.seats ? selected.spending / selected.seats : 0)), note: "Q11.c" },
                      { label: "DESPESAS REGISTRADAS", value: formatNumber(selected.expenses), note: "quantidade de despesas" },
                      { label: "DEPUTADOS NO PARTIDO", value: formatNumber(selected.seats), note: "deputados com gastos" },
                    ].map((item) => (
                      <div key={item.label} className="bg-background px-6 py-6">
                        <p className="mb-2 text-[13px] font-bold uppercase tracking-widest" style={contrastMutedStyle}>
                          {item.label}
                        </p>
                        <p className="mb-1 text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                          {item.value}
                        </p>
                        <p className="text-[13px]" style={contrastMutedStyle}>
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[13px] font-semibold leading-relaxed" style={contrastMutedStyle}>
                    Ranking de gastos: #{selected.spendingRank || "-"} entre os partidos listados na Q11.c. Use os anos no topo para alternar entre todos os anos e um ano especifico.
                  </p>

                  <div className="mt-8 border border-border p-5" style={{ background: "var(--card)" }}>
                    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[13px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--foreground)", fontFamily: MONO }}>
                          PRINCIPAIS CATEGORIAS DE GASTO
                        </p>
                        <p className="mt-1 text-[12px] font-semibold" style={contrastMutedStyle}>
                          Q11.e - ordenado do maior gasto para o menor {selectedYear ? `em ${selectedYear}` : "no periodo consolidado"}
                        </p>
                      </div>
                    </div>

                    {selectedExpenseCategories.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {(() => {
                          const maxVal = Math.max(...selectedExpenseCategories.map((item) => item.spending), 1);
                          return selectedExpenseCategories.map((item) => {
                            const pct = (item.spending / maxVal) * 100;
                            return (
                              <div key={`${item.rank}-${item.category}`} className="grid gap-2">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-sm font-black leading-snug" style={{ color: "var(--foreground)", fontFamily: MONO }}>
                                      {String(item.rank).padStart(2, "0")} · {item.category}
                                    </p>
                                    <p className="mt-0.5 text-[11px] font-semibold" style={contrastMutedStyle}>
                                      {item.launches.toLocaleString("pt-BR")} lancamentos · {item.deputies.toLocaleString("pt-BR")} deputados · {item.percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do partido
                                    </p>
                                  </div>
                                  <p className="shrink-0 text-right text-sm font-black tabular-nums" style={{ color: selected.color, fontFamily: MONO }}>
                                    {formatCurrency(item.spending)}
                                  </p>
                                </div>
                                <div className="h-2.5 overflow-hidden" style={{ background: isDark ? "rgba(240,236,228,0.08)" : "rgba(15,23,42,0.08)" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: selected.color }} />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold" style={contrastMutedStyle}>
                        Sem categorias de gasto detalhadas para este partido no filtro atual.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div>
                    <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.18em]" style={contrastMutedStyle}>
                      GASTO DO PARTIDO POR ANO
                    </p>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const maxVal = Math.max(...annualSnapshots.map((s) => s.spending), 1);
                        return annualSnapshots.map((snap) => (
                          <div key={snap.year} className="flex items-center gap-3">
                            <span className="w-12 shrink-0 text-right text-xs" style={{ fontFamily: MONO, fontWeight: 600, color: "var(--muted-foreground)" }}>
                              {snap.year}
                            </span>
                            <div className="relative flex-1" style={{ background: "rgba(240,236,228,0.06)", height: "12px" }}>
                              <div style={{ width: `${(snap.spending / maxVal) * 100}%`, height: "100%", background: selected.color }} />
                            </div>
                            <span className="w-28 shrink-0 text-xs" style={{ fontFamily: MONO, color: "var(--muted-foreground)" }}>
                              {formatCurrency(snap.spending)}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.18em]" style={contrastMutedStyle}>
                      COMPARATIVO DE GASTO TOTAL - PARTIDOS
                    </p>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const maxVal = Math.max(...spendingRankParties.map((p) => p.spending), 1);
                        return spendingRankParties.map((party) => {
                          const pct = (party.spending / maxVal) * 100;
                          const isSel = party.id === selected.id;
                          return (
                            <div key={party.id} className="flex items-center gap-3">
                              <span className="w-28 shrink-0 text-right text-xs" style={{ fontFamily: MONO, fontWeight: isSel ? 700 : 500, color: isSel ? selected.color : "var(--muted-foreground)" }}>
                                {party.name}
                              </span>
                              <div className="relative flex-1" style={{ background: "rgba(240,236,228,0.06)", height: "12px" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: isSel ? selected.color : "rgba(240,236,228,0.22)" }} />
                              </div>
                              <span className="w-28 shrink-0 text-xs" style={{ fontFamily: MONO, color: isSel ? selected.color : "var(--muted-foreground)" }}>
                                {formatCurrency(party.spending)}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyPanel message="Sem gastos para este partido e ano." />
            )}
          </section>
          )}

          {activeSection === "nuvem" && (
          <section className="border-b border-border px-6 py-14 md:px-14">
            <SectionHeader
              n="03D"
              tag="NUVEM"
              title="Temas mais atuantes do partido"
              sub="Temas legislativos com mais proposicoes de autoria deste partido. Cada proposicao e contada uma unica vez (COUNT DISTINCT). Tamanho proporcional ao numero de proposicoes registradas."
            />

            {partyThemes.length > 0 ? (
              <>
                {/* Filtro de tema */}
                <div className="mb-6">
                  <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.22em]" style={contrastMutedStyle}>
                    FILTRAR TEMA
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTema(null)}
                      className="rounded-full border px-3 py-1 text-xs transition-colors"
                      style={{
                        fontFamily: MONO,
                        borderColor: selectedTema === null ? selected.color : "var(--border)",
                        background: selectedTema === null ? selected.color : "transparent",
                        color: selectedTema === null ? "#111" : "var(--muted-foreground)",
                      }}
                    >
                      TODOS
                    </button>
                    {partyThemes.map((item, idx) => {
                      const PALETTE = ["#e8d5a3","#a3c4e8","#a3e8b5","#e8a3b5","#c4a3e8","#e8c4a3","#a3e8e0","#e8e0a3","#e8b8a3","#b8e8a3"];
                      const color = PALETTE[idx % PALETTE.length];
                      const isActive = selectedTema === item.tema;
                      return (
                        <button
                          key={item.tema}
                          onClick={() => setSelectedTema(isActive ? null : item.tema)}
                          className="rounded-full border px-3 py-1 text-xs transition-all"
                          style={{
                            fontFamily: MONO,
                            borderColor: isActive ? color : "var(--border)",
                            background: isActive ? color : "transparent",
                            color: isActive ? "#111" : "var(--muted-foreground)",
                          }}
                        >
                          {item.tema}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nuvem de palavras */}
                <div
                  className="flex min-h-[280px] flex-wrap items-center justify-center gap-x-8 gap-y-5 border border-border p-10"
                  style={{ background: "var(--card)" }}
                >
                  {(() => {
                    const PALETTE = ["#e8d5a3","#a3c4e8","#a3e8b5","#e8a3b5","#c4a3e8","#e8c4a3","#a3e8e0","#e8e0a3","#e8b8a3","#b8e8a3"];
                    const maxFreq = partyThemes[0]?.frequencia ?? 1;
                    const minFreq = partyThemes[partyThemes.length - 1]?.frequencia ?? 1;
                    const range = Math.max(maxFreq - minFreq, 1);
                    const visibleThemes = selectedTema ? partyThemes.filter((t) => t.tema === selectedTema) : partyThemes;
                    return visibleThemes.map((item, idx) => {
                      const norm = (item.frequencia - minFreq) / range;
                      const size = selectedTema ? 3.2 : 0.85 + norm * 1.8;
                      const weight = norm > 0.6 ? 800 : norm > 0.3 ? 600 : 500;
                      const color = PALETTE[partyThemes.indexOf(item) % PALETTE.length];
                      return (
                        <span
                          key={item.tema}
                          title={`${item.frequencia} proposicoes`}
                          onClick={() => setSelectedTema(selectedTema === item.tema ? null : item.tema)}
                          className="cursor-pointer select-none transition-all hover:scale-110"
                          style={{
                            fontFamily: SERIF,
                            fontWeight: weight,
                            fontSize: `${size}rem`,
                            color,
                            opacity: selectedTema && selectedTema !== item.tema ? 0.15 : 1,
                            lineHeight: 1.2,
                          }}
                        >
                          {item.tema}
                        </span>
                      );
                    });
                  })()}
                </div>

                {/* Ranking de barras */}
                <div className="mt-8 flex flex-col gap-2">
                  <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.22em]" style={contrastMutedStyle}>
                    {selectedTema ? `TEMA SELECIONADO — ${selectedTema.toUpperCase()}` : "TOP TEMAS — PROPOSICOES DISTINTAS"}
                  </p>
                  {(() => {
                    const PALETTE = ["#e8d5a3","#a3c4e8","#a3e8b5","#e8a3b5","#c4a3e8","#e8c4a3","#a3e8e0","#e8e0a3","#e8b8a3","#b8e8a3"];
                    const list = selectedTema ? partyThemes : partyThemes.slice(0, 12);
                    const maxFreq = list[0]?.frequencia ?? 1;
                    return list.map((item, idx) => {
                      const globalIdx = partyThemes.indexOf(item);
                      const color = PALETTE[globalIdx % PALETTE.length];
                      const isActive = !selectedTema || selectedTema === item.tema;
                      return (
                        <div
                          key={item.tema}
                          className="flex cursor-pointer items-center gap-3"
                          onClick={() => setSelectedTema(selectedTema === item.tema ? null : item.tema)}
                        >
                          <span
                            className="w-64 shrink-0 text-right text-xs"
                            style={{ fontFamily: MONO, color: isActive ? "var(--foreground)" : "var(--muted-foreground)", fontWeight: isActive ? 600 : 400 }}
                          >
                            {item.tema}
                          </span>
                          <div className="relative flex-1" style={{ background: "var(--secondary)", height: "10px" }}>
                            <div
                              style={{
                                width: `${(item.frequencia / maxFreq) * 100}%`,
                                height: "100%",
                                background: isActive ? color : "var(--secondary)",
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                          <span className="w-12 shrink-0 text-xs" style={{ fontFamily: MONO, color: isActive ? color : "#444" }}>
                            {formatNumber(item.frequencia)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            ) : (
              <EmptyPanel message="Carregando temas do partido..." />
            )}
          </section>
          )}

          {/* ════════════════════════════════════════════════════════
              METODOLOGIA — colapsavel, mesmo estilo dos recortes 1 e 2
          ════════════════════════════════════════════════════════ */}
          {activeSection === "metodologia" && (
          <section className="border-b border-border px-6 py-14 md:px-14">
            <SectionHeader
              n="03E"
              tag="METODOLOGIA"
              title="Como os indicadores foram calculados?"
              sub="Transparencia analitica - Clique em cada metodo para expandir"
            />
            <div className="sr-only">
            <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              5. METODOLOGIA
            </p>
            <h3 className="mb-3 text-3xl font-black" style={sectionTitleStyle}>
              Como os indicadores foram calculados?
            </h3>
            <p className="mb-10 text-xs uppercase tracking-[0.24em] text-muted-foreground" style={{ fontFamily: MONO }}>
              Transparencia analitica · Clique em cada metodo para expandir
            </p>
            </div>

            {METODOS.map((m) => (
              <div key={m.id} className="mb-3 border border-border" style={{ background: "var(--card)" }}>
                <button
                  type="button"
                  onClick={() => toggleMetodo(m.id)}
                  className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-white/[0.03] md:px-6"
                >
                  <div>
                    <p className="text-base font-black leading-tight md:text-lg" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.titulo}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] md:text-[13px]" style={{ color: RED, fontFamily: MONO }}>{m.origem}</p>
                  </div>
                  <span className="ml-4 shrink-0 text-sm font-black md:text-base" style={{ color: RED, fontFamily: MONO }}>
                    {metodoOpen[m.id] ? "▲" : "▼"}
                  </span>
                </button>

                {metodoOpen[m.id] && (
                  <div className="border-t border-border px-5 py-6 md:px-6" style={{ background: "var(--card)" }}>
                    {/* Formula */}
                    <div className="mb-4 border-l-2 py-2 pl-4" style={{ borderColor: "var(--primary)" }}>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: RED, fontFamily: MONO }}>Formula</p>
                      <p className="mt-1 text-base font-bold leading-relaxed" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.formula}</p>
                    </div>
                    {/* Passos */}
                    <div className="mb-5 flex flex-col gap-3">
                      {m.passos.map((p, pi) => (
                        <p key={pi} className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ color: "var(--foreground)", opacity: 0.88, fontFamily: MONO }}>{p}</p>
                      ))}
                    </div>
                    {/* Interpretacao */}
                    <div className="border border-border p-4" style={{ background: "rgba(196,18,48,0.08)" }}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: RED, fontFamily: MONO }}>Como interpretar</p>
                      <p className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ color: "var(--foreground)", opacity: 0.9, fontFamily: MONO }}>{m.interpretacao}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
          )}

        </>
      )}
    </div>
  );
}
