import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, Treemap, XAxis, YAxis } from "recharts";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import { fetchQuestion } from "../api";
import type { QuestionPayload, TableSpec } from "../types";
import { useTheme } from "../../contexts/ThemeContext";

type PanoramaPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
  onNavigateRecorte: (path: string) => void;
};

type SectionProps = {
  n: string;
  tag: string;
  title: string;
  sub?: string;
  children: ReactNode;
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const RED = "#c41230";

type Row = Record<string, unknown>;

const depPhoto = (id: string | number) =>
  `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`;

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const raw = (row: Row, key: string) => Number(row?.[key] ?? 0);
const str = (row: Row, key: string) => String(row?.[key] ?? "");
// removido: normalizedCb — substituído por percentil calculado no componente

// Normaliza texto para busca (minúsculas, sem acentos)
const normalizeText = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

const getGlobalCbRows = (payload: QuestionPayload) => {
  const globalTable = getGlobalCbTable(payload);

  const rows = ((globalTable?.rows ?? []) as Row[]).filter((row) => str(row, "ano_dados").toUpperCase() === "GLOBAL");
  const sourceRows = rows.length > 0 ? rows : ((globalTable?.rows ?? []) as Row[]);
  return [...sourceRows];
};

const isGlobalCbTable = (table: TableSpec) => {
  const title = table.title.toLowerCase();
  return title.includes("ranking global") && title.includes("todos os anos");
};

const getGlobalCbTable = (payload: QuestionPayload) =>
  [payload.table_spec, ...payload.complement_tables].find(isGlobalCbTable) ?? payload.complement_tables[0];

const dedupeRows = (rows: Row[]) => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${str(row, "ano_dados")}:${str(row, "id_deputado")}:${str(row, "nome")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchGlobalCbRanking = async () => {
  const pageSize = 200;
  const firstPayload = await fetchQuestion("q7", {}, { page: 1, pageSize });
  const firstTable = getGlobalCbTable(firstPayload);
  const total = firstTable?.total ?? 0;
  const effectivePageSize = firstTable?.page_size ?? pageSize;
  const pages = Math.ceil(total / effectivePageSize);

  const nextPayloads =
    pages > 1
      ? await Promise.all(
          Array.from({ length: pages - 1 }, (_, index) =>
            fetchQuestion("q7", {}, { page: index + 2, pageSize }),
          ),
        )
      : [];

  return dedupeRows([firstPayload, ...nextPayloads].flatMap(getGlobalCbRows));
};

// Busca o ranking COMPLETO de gastos (todas as páginas) para localizar posições
const fetchAllGastosRanking = async () => {
  const pageSize = 200;
  const first = await fetchQuestion("q1", {}, { page: 1, pageSize });
  const total = first.table_spec.total ?? 0;
  const effectivePageSize = first.table_spec.page_size ?? pageSize;
  const pages = Math.ceil(total / effectivePageSize);

  const rest =
    pages > 1
      ? await Promise.all(
          Array.from({ length: pages - 1 }, (_, index) =>
            fetchQuestion("q1", {}, { page: index + 2, pageSize }),
          ),
        )
      : [];

  const allRows = [first, ...rest].flatMap((payload) => (payload.table_spec.rows ?? []) as Row[]);
  return [...allRows].sort((a, b) => raw(b, "gasto_total") - raw(a, "gasto_total"));
};

// ── Filtro de posição: pesquisa um deputado e mostra sua colocação no ranking ──
type PosicaoFinderProps = {
  rows: Row[];
  query: string;
  onQuery: (value: string) => void;
  metricLabel: string;
  metric: (row: Row) => string;
  rounded?: boolean;
};

function PosicaoFinder({ rows, query, onQuery, metricLabel, metric, rounded }: PosicaoFinderProps) {
  const q = normalizeText(query);
  const matches = q
    ? rows
        .map((row, idx) => ({ row, rank: idx + 1 }))
        .filter(({ row }) => normalizeText(str(row, "nome")).includes(q))
        .slice(0, 25)
    : [];

  return (
    <div className="mb-8">
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-4 text-sm text-muted-foreground" style={{ fontFamily: MONO }}>
          ⌕
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="DIGITE O NOME DO DEPUTADO PARA VER A POSIÇÃO NO RANKING"
          className="w-full border border-border bg-card text-foreground py-3 pl-10 pr-10 text-sm outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          style={{ fontFamily: MONO }}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery("")}
            className="absolute right-3 text-lg leading-none text-muted-foreground transition-colors hover:text-primary"
            style={{ fontFamily: MONO }}
            aria-label="Limpar busca"
          >
            ×
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="mt-3 flex flex-col gap-2">
          {rows.length === 0 ? (
            <div
              className="flex h-16 items-center justify-center border border-border text-xs text-muted-foreground"
              style={{ fontFamily: MONO, background: "var(--card)" }}
            >
              CARREGANDO RANKING COMPLETO...
            </div>
          ) : matches.length === 0 ? (
            <div
              className="flex h-16 items-center justify-center border border-border text-xs text-muted-foreground"
              style={{ fontFamily: MONO, background: "var(--card)" }}
            >
              NENHUM DEPUTADO ENCONTRADO PARA "{query.trim().toUpperCase()}"
            </div>
          ) : (
            matches.map(({ row, rank }) => {
              const id = str(row, "id_deputado");
              const isTop = rank === 1;
              const color = isTop ? RED : rank <= 3 ? "#d4841a" : "var(--foreground)";
              return (
                <div
                  key={`${id}-${rank}`}
                  className="flex items-center gap-4 border px-5 py-3"
                  style={{ background: "var(--card)", borderColor: rank <= 3 ? `${color}55` : "var(--border)" }}
                >
                  {/* Posição */}
                  <div className="flex shrink-0 flex-col items-center" style={{ minWidth: 64 }}>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                      posição
                    </span>
                    <span className="text-2xl font-black leading-none" style={{ fontFamily: SERIF, color }}>
                      {rank}º
                    </span>
                    <span className="text-[10px] text-muted-foreground" style={{ fontFamily: MONO }}>
                      de {rows.length}
                    </span>
                  </div>
                  {/* Foto */}
                  <img
                    src={depPhoto(id)}
                    alt=""
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    className={`h-12 w-12 shrink-0 object-cover object-top ${rounded ? "rounded-full" : ""}`}
                    style={{ border: `2px solid ${color}` }}
                  />
                  {/* Nome + partido */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>
                      {str(row, "nome")}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 text-[11px] font-bold"
                        style={{ fontFamily: MONO, background: "var(--secondary)", color: "var(--foreground)" }}
                      >
                        {str(row, "sigla_partido")}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground" style={{ fontFamily: MONO }}>
                        {str(row, "sigla_uf")}
                      </span>
                    </div>
                  </div>
                  {/* Métrica */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black" style={{ fontFamily: MONO, color }}>
                      {metric(row)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground" style={{ fontFamily: MONO }}>
                      {metricLabel}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function Section({ n, tag, title, sub, children }: SectionProps) {
  return (
    <section className="border-b border-border px-6 py-16 md:px-14">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span
          className="text-5xl font-black leading-none md:text-6xl"
          style={{ fontFamily: SERIF, color: RED, textShadow: "0 0 18px rgba(196,18,48,0.22)" }}
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
      <h2 className="mb-3 text-3xl font-black leading-tight md:text-5xl" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>
        {title}
      </h2>
      {sub ? (
        <p
          className="mb-10 max-w-[980px] text-[13px] font-bold uppercase leading-relaxed tracking-[0.18em] md:text-sm"
          style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.82 }}
        >
          {sub}
        </p>
      ) : (
        <div className="mb-10" />
      )}
      {children}
    </section>
  );
}

const PAGE_SIZE = 15;

// Abrevia nomes longos de categorias para o gráfico
const abrevCat = (s: string) =>
  s
    .replace("DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.", "Divulgação Parlamentar")
    .replace("PASSAGEM AÉREA - SIGEPA", "Passagem Aérea (SIGEPA)")
    .replace("PASSAGEM AÉREA - RPA", "Passagem Aérea (RPA)")
    .replace("PASSAGEM AÉREA - REEMBOLSO", "Passagem Aérea (Reimb.)")
    .replace("LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES", "Locação de Veículos")
    .replace("LOCAÇÃO OU FRETAMENTO DE AERONAVES", "Locação de Aeronaves")
    .replace("LOCAÇÃO OU FRETAMENTO DE EMBARCAÇÕES", "Locação de Embarcações")
    .replace("MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR", "Manutenção de Escritório")
    .replace("COMBUSTÍVEIS E LUBRIFICANTES.", "Combustíveis")
    .replace("HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL.", "Hospedagem")
    .replace("SERVIÇO DE SEGURANÇA PRESTADO POR EMPRESA ESPECIALIZADA.", "Segurança")
    .replace("SERVIÇO DE TÁXI, PEDÁGIO E ESTACIONAMENTO", "Táxi/Pedágio/Estacionamento")
    .replace("FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR", "Alimentação")
    .replace("PASSAGENS TERRESTRES, MARÍTIMAS OU FLUVIAIS", "Passagens Terrestres/Aquát.")
    .replace("ASSINATURA DE PUBLICAÇÕES", "Assinaturas")
    .replace("PARTICIPAÇÃO EM CURSO, PALESTRA OU EVENTO SIMILAR", "Cursos e Eventos")
    .replace("AQUISIÇÃO DE TOKENS E CERTIFICADOS DIGITAIS", "Certificados Digitais")
    .replace("SERVIÇOS POSTAIS", "Serviços Postais")
    .replace("CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS.", "Consultorias")
    .trim();

type PanoramaSection = "deputados" | "categorias" | "eixos" | "custo-beneficio" | "metodologia";

export default function PanoramaPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado, onNavigateRecorte }: PanoramaPageProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeSection, setActiveSection] = useState<PanoramaSection>("deputados");

  // Seção 01 — Top deputados
  const [top10, setTop10] = useState<Row[]>([]);
  const [gastoAllRows, setGastoAllRows] = useState<Row[]>([]); // ranking completo p/ busca de posição
  const [gastoQuery, setGastoQuery] = useState("");
  const [tableOpen, setTableOpen] = useState(false);
  const [tableRows, setTableRows] = useState<Row[]>([]);
  const [tablePage, setTablePage] = useState(1);
  const [tableTotal, setTableTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  // Filtros da seção 01
  const [partidoFilter, setPartidoFilter] = useState("");
  const [ufFilter, setUfFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"mais" | "menos">("mais");
  const [filterTablePage, setFilterTablePage] = useState(1);

  const filteredGasto = useMemo(() => {
    if (!gastoAllRows.length) return [];
    let rows = [...gastoAllRows];
    if (partidoFilter) rows = rows.filter((r) => str(r, "sigla_partido") === partidoFilter);
    if (ufFilter) rows = rows.filter((r) => str(r, "sigla_uf") === ufFilter);
    if (sortOrder === "menos") rows.reverse();
    return rows;
  }, [gastoAllRows, partidoFilter, ufFilter, sortOrder]);

  const hasGastoFilter = !!(partidoFilter || ufFilter || sortOrder === "menos");
  const displayTop10 = filteredGasto.length > 0 ? filteredGasto.slice(0, 10) : top10;

  const partidoOptions = useMemo(() => {
    const set = new Set<string>();
    gastoAllRows.forEach((r) => { const v = str(r, "sigla_partido"); if (v) set.add(v); });
    return Array.from(set).sort();
  }, [gastoAllRows]);

  const ufOptions = useMemo(() => {
    const set = new Set<string>();
    gastoAllRows.forEach((r) => { const v = str(r, "sigla_uf"); if (v) set.add(v); });
    return Array.from(set).sort();
  }, [gastoAllRows]);

  // Seção 01B — Categorias globais de gasto
  const CAT_PAGE_SIZE = 10;
  const [catTop10, setCatTop10] = useState<Row[]>([]);
  const [catAllRows, setCatAllRows] = useState<Row[]>([]);
  const [catTableOpen, setCatTableOpen] = useState(false);
  const [catTablePage, setCatTablePage] = useState(1);
  const catTableRef = useRef<HTMLDivElement>(null);
  const [catSearch, setCatSearch] = useState("");
  const [catSearchPage, setCatSearchPage] = useState(1);

  const catOptions = useMemo(() => catAllRows.map((r) => str(r, "descricao_despesa")).filter(Boolean), [catAllRows]);

  const catFilteredRows = useMemo(() => {
    if (!catSearch) return catAllRows;
    return catAllRows.filter((r) => str(r, "descricao_despesa") === catSearch);
  }, [catAllRows, catSearch]);

  useEffect(() => { setCatSearchPage(1); }, [catSearch]);

  // Seção 01C — Eixos de atuação (temas legislativos)
  const EIXO_PAGE_SIZE = 10;
  const [eixoTop10, setEixoTop10] = useState<Row[]>([]);
  const [eixoAllRows, setEixoAllRows] = useState<Row[]>([]);
  const [eixoTableOpen, setEixoTableOpen] = useState(false);
  const [eixoTablePage, setEixoTablePage] = useState(1);
  const eixoTableRef = useRef<HTMLDivElement>(null);
  const [eixoSearch, setEixoSearch] = useState("");
  const [eixoSearchPage, setEixoSearchPage] = useState(1);

  const eixoOptions = useMemo(() => eixoAllRows.map((r) => str(r, "tema")).filter(Boolean), [eixoAllRows]);

  const eixoFilteredRows = useMemo(() => {
    if (!eixoSearch) return eixoAllRows;
    return eixoAllRows.filter((r) => str(r, "tema") === eixoSearch);
  }, [eixoAllRows, eixoSearch]);

  useEffect(() => { setEixoSearchPage(1); }, [eixoSearch]);

  // Seção 01D — Custo-benefício
  const CB_PAGE_SIZE = 15;
  const [cbTop10, setCbTop10] = useState<Row[]>([]);
  const [cbAllRows, setCbAllRows] = useState<Row[]>([]);
  const [cbTableOpen, setCbTableOpen] = useState(false);
  const [cbTableRows, setCbTableRows] = useState<Row[]>([]);
  const [cbTablePage, setCbTablePage] = useState(1);
  const [cbTableTotal, setCbTableTotal] = useState(0);
  const [cbTableLoading, setCbTableLoading] = useState(false);
  const [cbQuery, setCbQuery] = useState("");
  const cbTableRef = useRef<HTMLDivElement>(null);

  // Filtros da seção 01D
  const [cbPartidoFilter, setCbPartidoFilter] = useState("");
  const [cbUfFilter, setCbUfFilter] = useState("");
  const [cbSortOrder, setCbSortOrder] = useState<"mais" | "menos">("mais");
  const [cbFilterPage, setCbFilterPage] = useState(1);

  const filteredCbRows = useMemo(() => {
    if (!cbAllRows.length) return [];
    let rows = [...cbAllRows];
    if (cbPartidoFilter) rows = rows.filter((r) => str(r, "sigla_partido") === cbPartidoFilter);
    if (cbUfFilter) rows = rows.filter((r) => str(r, "sigla_uf") === cbUfFilter);
    if (cbSortOrder === "menos") rows.reverse();
    return rows;
  }, [cbAllRows, cbPartidoFilter, cbUfFilter, cbSortOrder]);

  const hasCbFilter = !!(cbPartidoFilter || cbUfFilter || cbSortOrder === "menos");
  const displayCbTop10 = hasCbFilter ? filteredCbRows.slice(0, 10) : cbTop10;

  useEffect(() => { setCbFilterPage(1); }, [cbPartidoFilter, cbUfFilter, cbSortOrder]);

  // Percentil de cada row no ranking global (cbAllRows já vem ordenado DESC por custo_beneficio)
  const cbPercentileMap = useMemo(() => {
    const n = cbAllRows.length;
    const map = new Map<string, number>();
    cbAllRows.forEach((r, i) => {
      map.set(`${str(r, "ano_dados")}_${raw(r, "id_deputado")}`, ((n - i) / n) * 100);
    });
    return map;
  }, [cbAllRows]);

  const getCbPercentile = (r: Row) =>
    cbPercentileMap.get(`${str(r, "ano_dados")}_${raw(r, "id_deputado")}`) ?? 0;

  // Abre/fecha tabela CB e carrega primeira página
  const handleToggleCbTable = () => {
    if (!cbTableOpen && cbTableRows.length === 0) fetchCbTablePage(1);
    setCbTableOpen((v) => !v);
  };

  const fetchCbTablePage = (page: number) => {
    const applyLocalPage = (rows: Row[]) => {
      setCbTableRows(rows.slice((page - 1) * CB_PAGE_SIZE, page * CB_PAGE_SIZE));
      setCbTableTotal(rows.length);
      setCbTablePage(page);
    };

    if (cbAllRows.length > 0) {
      applyLocalPage(cbAllRows);
      return;
    }

    setCbTableLoading(true);
    fetchGlobalCbRanking()
      .then((globalRows) => {
        setCbAllRows(globalRows);
        applyLocalPage(globalRows);
      })
      .catch(() => {})
      .finally(() => setCbTableLoading(false));
  };

  // Estado de metodologia
  const [metodoOpen, setMetodoOpen] = useState<Record<string, boolean>>({});
  const toggleMetodo = (id: string) => setMetodoOpen((s) => ({ ...s, [id]: !s[id] }));

  // Carrega dados na montagem
  useEffect(() => {
    fetchQuestion("q1", {}, { page: 1, pageSize: 10, sort_by: "gasto_total", sort_dir: "desc" })
      .then((payload) => {
        setTop10((payload.table_spec.rows ?? []) as Row[]);
        setTableTotal(payload.table_spec.total ?? 0);
      })
      .catch(() => {});

    // Carrega o ranking completo de gastos (em background) p/ busca de posição
    fetchAllGastosRanking()
      .then(setGastoAllRows)
      .catch(() => {});

    // Carrega categorias globais (complement_tables[2] do Q13)
    fetchQuestion("q13", {}, { page: 1, pageSize: 25 })
      .then((payload) => {
        const globalCat = (payload.complement_tables[2]?.rows ?? []) as Row[];
        const sorted = [...globalCat].sort((a, b) => raw(b, "total_gasto") - raw(a, "total_gasto"));
        setCatAllRows(sorted);
        setCatTop10(sorted.slice(0, 10));
      })
      .catch(() => {});

    // Carrega eixos temáticos agregados (complement_tables[0] do Q2)
    fetchQuestion("q2", {}, { page: 1, pageSize: 5 })
      .then((payload) => {
        const eixos = (payload.complement_tables[0]?.rows ?? []) as Row[];
        setEixoAllRows(eixos);
        setEixoTop10(eixos.slice(0, 10));
      })
      .catch(() => {});

    // Carrega top 10 por custo-benefício global (complement_tables[0] do Q7)
    fetchGlobalCbRanking()
      .then((global) => {
        setCbAllRows(global);
        setCbTop10(global.slice(0, 10));
        setCbTableTotal(global.length);
      })
      .catch(() => {});
  }, []);

  // Busca uma página da tabela
  const fetchTablePage = (page: number) => {
    setTableLoading(true);
    fetchQuestion("q1", {}, { page, pageSize: PAGE_SIZE, sort_by: "gasto_total", sort_dir: "desc" })
      .then((payload) => {
        setTableRows((payload.table_spec.rows ?? []) as Row[]);
        setTableTotal(payload.table_spec.total ?? 0);
        setTablePage(page);
      })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  };

  // Abre a tabela na primeira vez
  const handleToggleTable = () => {
    if (!tableOpen && tableRows.length === 0) fetchTablePage(1);
    setTableOpen((v) => !v);
  };

  // Dados do gráfico de barras
  const barData = top10.map((r) => ({
    name: str(r, "nome").split(" ").slice(0, 2).join(" "),
    total: raw(r, "gasto_total"),
  }));

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateRecorte={onNavigateRecorte} />

      <PageHero
        n="1"
        tag="VISÃO GERAL"
        title="Panorama"
        titleRed="Geral"
        desc="Uma visão estática e abrangente dos padrões de gasto, fornecedores dominantes e grupos de influência na 57ª Legislatura."
        imgId="/fundorecortes/recorte1/fundo-recorte1.png"
        hideStrip
        stripImgs={[
          { id: "photo-1561489396-888724a1543d", alt: "Reunião parlamentar" },
          { id: "photo-1567965606933-c46e07393d91", alt: "Manifestação política" },
          { id: "photo-1529107386315-e1a2ed48a620", alt: "Congresso" },
        ]}
      />

      {/* ── Navegação entre seções ────────────────────────── */}
      <div
        className="sticky top-[56px] z-30 flex flex-wrap gap-2 border-b px-6 py-3 md:px-14"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        {(
          [
            ["deputados",      "Deputados"],
            ["categorias",     "Categorias"],
            ["eixos",          "Eixos de atuação"],
            ["custo-beneficio","Custo-benefício"],
            ["metodologia",    "Metodologia"],
          ] as [PanoramaSection, string][]
        ).map(([key, label]) => {
          const active = activeSection === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{
                fontFamily: MONO,
                background: active ? RED : "transparent",
                color: active ? "#fff" : "var(--foreground)",
                borderColor: active ? RED : "var(--border)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Seção 01 — Deputados ─────────────────────────── */}
      {activeSection === "deputados" && (
      <Section n="01" tag="DEPUTADOS" title="Top 10 que mais gastam" sub="CEAP ACUMULADA 2023-2026 · TODOS OS DEPUTADOS FEDERAIS">

        {/* ── Filtro: pesquisar posição de um deputado no ranking de gastos ── */}
        <PosicaoFinder
          rows={gastoAllRows}
          query={gastoQuery}
          onQuery={setGastoQuery}
          metricLabel="Gasto total"
          metric={(r) => fmtCurrency(raw(r, "gasto_total"))}
        />

        {/* ── Filtros: partido, UF, ordem ── */}
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Partido</label>
            <select
              value={partidoFilter}
              onChange={(e) => { setPartidoFilter(e.target.value); setFilterTablePage(1); }}
              className="h-9 border bg-transparent px-3 text-[13px] outline-none"
              style={{ fontFamily: MONO, borderColor: partidoFilter ? RED : "var(--border)", color: partidoFilter ? "var(--foreground)" : "var(--muted-foreground)", background: "var(--card)", minWidth: 130 }}
            >
              <option value="">Todos</option>
              {partidoOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Estado (UF)</label>
            <select
              value={ufFilter}
              onChange={(e) => { setUfFilter(e.target.value); setFilterTablePage(1); }}
              className="h-9 border bg-transparent px-3 text-[13px] outline-none"
              style={{ fontFamily: MONO, borderColor: ufFilter ? RED : "var(--border)", color: ufFilter ? "var(--foreground)" : "var(--muted-foreground)", background: "var(--card)", minWidth: 130 }}
            >
              <option value="">Todos</option>
              {ufOptions.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Ordem</label>
            <div className="flex h-9">
              <button
                type="button"
                onClick={() => { setSortOrder("mais"); setFilterTablePage(1); }}
                className="border px-4 text-[12px] font-bold uppercase transition-colors"
                style={{ fontFamily: MONO, background: sortOrder === "mais" ? RED : "transparent", color: sortOrder === "mais" ? "#fff" : "var(--foreground)", borderColor: sortOrder === "mais" ? RED : "var(--border)" }}
              >
                Mais gastam
              </button>
              <button
                type="button"
                onClick={() => { setSortOrder("menos"); setFilterTablePage(1); }}
                className="border-y border-r px-4 text-[12px] font-bold uppercase transition-colors"
                style={{ fontFamily: MONO, background: sortOrder === "menos" ? RED : "transparent", color: sortOrder === "menos" ? "#fff" : "var(--foreground)", borderColor: sortOrder === "menos" ? RED : "var(--border)" }}
              >
                Menos gastam
              </button>
            </div>
          </div>
          {hasGastoFilter && (
            <button
              type="button"
              onClick={() => { setPartidoFilter(""); setUfFilter(""); setSortOrder("mais"); setFilterTablePage(1); }}
              className="h-9 border px-4 text-[12px] font-bold uppercase transition-colors"
              style={{ fontFamily: MONO, borderColor: "var(--border)", color: "var(--muted-foreground)", background: "transparent" }}
            >
              ✕ Limpar
            </button>
          )}
          {hasGastoFilter && (
            <span className="text-[11px] text-muted-foreground" style={{ fontFamily: MONO }}>
              {filteredGasto.length} deputados encontrados
            </span>
          )}
        </div>

        {/* ── Ranking com fotos ── */}
        <div className="mb-10 flex flex-col gap-0 border border-border" style={{ background: "var(--card)" }}>
          {displayTop10.map((dep, idx) => {
            const id = str(dep, "id_deputado");
            const nome = str(dep, "nome");
            const partido = str(dep, "sigla_partido");
            const uf = str(dep, "sigla_uf");
            const total = raw(dep, "gasto_total");
            const isFirst = idx === 0;
            const rankColor = isDark ? (isFirst ? RED : idx < 3 ? "#d4841a" : "rgba(240,236,228,0.18)") : RED;
            const barPct = displayTop10[0] ? (total / raw(displayTop10[0], "gasto_total")) * 100 : 0;

            return (
              <div
                key={id}
                className="flex items-stretch border-b border-border transition-colors last:border-0 hover:bg-white/[0.03]"
                style={{ borderLeft: isFirst ? `3px solid ${RED}` : "3px solid transparent" }}
              >
                {/* Rank */}
                <div className="flex w-16 shrink-0 items-center justify-center py-5">
                  <span className="text-3xl font-black leading-none" style={{ fontFamily: SERIF, color: rankColor }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Foto */}
                <div className="relative flex w-20 shrink-0 items-center overflow-hidden py-2.5">
                  <img
                    src={depPhoto(id)}
                    alt={nome}
                    className="h-[72px] w-[58px] object-cover object-top"
                    style={{ filter: "grayscale(40%) contrast(1.05)" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                {/* Nome + partido */}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-5">
                  <p className="truncate text-xl font-bold leading-tight" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>
                    {nome}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="border px-2 py-1 text-xs font-bold uppercase"
                      style={{
                        minWidth: "2.4rem",
                        textAlign: "center",
                        fontFamily: MONO,
                        borderColor: isDark ? `${rankColor}55` : RED,
                        color: isDark ? rankColor : "#ffffff",
                        background: isDark ? `${rankColor}11` : RED,
                      }}
                    >
                      {partido || "-"}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground" style={{ fontFamily: MONO }}>{uf}</span>
                  </div>
                  {/* Barra de proporção */}
                  <div className="mt-2 h-0.5 overflow-hidden rounded-full" style={{ background: "var(--secondary)", width: "100%" }}>
                    <div
                      style={{
                        width: `${barPct}%`,
                        background: isDark ? (isFirst ? RED : idx < 3 ? "#d4841a" : "rgba(196,18,48,0.4)") : RED,
                        height: "100%",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="flex shrink-0 items-center px-6 py-5">
                  <span className="text-base font-black tabular-nums" style={{ fontFamily: MONO, color: isFirst ? RED : "var(--foreground)" }}>
                    {fmtCurrency(total)}
                  </span>
                </div>
              </div>
            );
          })}

          {displayTop10.length === 0 && (
            <div className="flex h-24 items-center justify-center text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              {hasGastoFilter ? "NENHUM DEPUTADO ENCONTRADO" : "CARREGANDO..."}
            </div>
          )}
        </div>

        {/* ── Tabela colapsável com paginação ── */}
        <div className="border border-border" style={{ background: "var(--card)" }}>
          <button
            type="button"
            onClick={handleToggleTable}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="text-xs tracking-[0.24em] text-muted-foreground" style={{ fontFamily: MONO }}>
              TABELA COMPLETA{hasGastoFilter ? ` · ${filteredGasto.length} DEPUTADOS` : tableTotal > 0 ? ` · ${tableTotal} DEPUTADOS` : ""}
            </span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              {tableOpen ? "▲ FECHAR" : "▼ EXPANDIR"}
            </span>
          </button>

          <div
            ref={tableRef}
            style={{ maxHeight: tableOpen ? 560 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}
          >
            <div className="border-t border-border">
              <div className="overflow-x-auto" style={{ maxHeight: 440, overflowY: "auto" }}>
                <table className="min-w-full text-left text-xs" style={{ fontFamily: MONO }}>
                  <thead style={{ background: "var(--secondary)", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      {["#", "Foto", "Deputado", "Partido", "UF", "Total Gasto"].map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 font-normal uppercase text-muted-foreground"
                          style={col === "#" && !isDark ? { color: RED } : undefined}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hasGastoFilter ? (
                      filteredGasto.slice((filterTablePage - 1) * PAGE_SIZE, filterTablePage * PAGE_SIZE).map((dep, idx) => {
                        const id = str(dep, "id_deputado");
                        const globalIdx = (filterTablePage - 1) * PAGE_SIZE + idx;
                        const isFirst = globalIdx === 0;
                        return (
                          <tr key={id} className="border-t border-border hover:bg-white/[0.03]">
                            <td className="px-4 py-2 font-bold" style={{ color: isDark ? (isFirst ? RED : "rgba(240,236,228,0.35)") : RED, fontFamily: SERIF }}>
                              {String(globalIdx + 1).padStart(2, "0")}
                            </td>
                            <td className="px-2 py-1">
                              <img src={depPhoto(id)} alt="" className="h-9 w-7 object-cover object-top" style={{ filter: "grayscale(50%)" }} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 font-medium" style={{ color: "var(--foreground)", fontFamily: SERIF }}>{str(dep, "nome")}</td>
                            <td className="px-4 py-2 text-muted-foreground">{str(dep, "sigla_partido")}</td>
                            <td className="px-4 py-2 text-muted-foreground">{str(dep, "sigla_uf")}</td>
                            <td className="px-4 py-2 text-right font-bold" style={{ color: isFirst ? RED : "var(--foreground)" }}>{fmtCurrency(raw(dep, "gasto_total"))}</td>
                          </tr>
                        );
                      })
                    ) : tableLoading ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">CARREGANDO...</td></tr>
                    ) : tableRows.map((dep, idx) => {
                      const id = str(dep, "id_deputado");
                      const globalIdx = (tablePage - 1) * PAGE_SIZE + idx;
                      const isFirst = globalIdx === 0;
                      return (
                        <tr key={id} className="border-t border-border hover:bg-white/[0.03]">
                          <td className="px-4 py-2 font-bold" style={{ color: isDark ? (isFirst ? RED : "rgba(240,236,228,0.35)") : RED, fontFamily: SERIF }}>
                            {String(globalIdx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-2 py-1">
                            <img src={depPhoto(id)} alt="" className="h-9 w-7 object-cover object-top" style={{ filter: "grayscale(50%)" }} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-medium" style={{ color: "var(--foreground)", fontFamily: SERIF }}>{str(dep, "nome")}</td>
                          <td className="px-4 py-2 text-muted-foreground">{str(dep, "sigla_partido")}</td>
                          <td className="px-4 py-2 text-muted-foreground">{str(dep, "sigla_uf")}</td>
                          <td className="px-4 py-2 text-right font-bold" style={{ color: isFirst ? RED : "var(--foreground)" }}>{fmtCurrency(raw(dep, "gasto_total"))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {hasGastoFilter ? (
                filteredGasto.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <button type="button" disabled={filterTablePage <= 1} onClick={() => setFilterTablePage((p) => Math.max(1, p - 1))}
                      className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                      style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                      ← ANTERIOR
                    </button>
                    <span className="text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                      {(filterTablePage - 1) * PAGE_SIZE + 1}–{Math.min(filterTablePage * PAGE_SIZE, filteredGasto.length)}&nbsp;&nbsp;/&nbsp;&nbsp;{filteredGasto.length} DEPUTADOS
                    </span>
                    <button type="button" disabled={filterTablePage * PAGE_SIZE >= filteredGasto.length} onClick={() => setFilterTablePage((p) => p + 1)}
                      className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                      style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                      PRÓXIMA →
                    </button>
                  </div>
                )
              ) : (
                tableTotal > PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <button type="button" disabled={tablePage <= 1 || tableLoading} onClick={() => fetchTablePage(tablePage - 1)}
                      className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                      style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                      ← ANTERIOR
                    </button>
                    <span className="text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                      {(tablePage - 1) * PAGE_SIZE + 1}–{Math.min(tablePage * PAGE_SIZE, tableTotal)}&nbsp;&nbsp;/&nbsp;&nbsp;{tableTotal} DEPUTADOS
                    </span>
                    <button type="button" disabled={tablePage * PAGE_SIZE >= tableTotal || tableLoading} onClick={() => fetchTablePage(tablePage + 1)}
                      className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                      style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                      PRÓXIMA →
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </Section>
      )}

      {/* ── Seção 01B — Categorias ───────────────────────── */}
      {activeSection === "categorias" && (
      <Section n="01B" tag="CATEGORIAS" title="No geral, onde os deputados mais gastam?" sub="CEAP CONSOLIDADA 2023-2026 · TODAS AS CATEGORIAS DE DESPESA · TOP 10">

        {/* Treemap de categorias */}
        {catTop10.length > 0 ? (() => {
          const TREE_COLORS = [
            RED,
            "#a81828",
            "#c84a10",
            "#a03808",
            "#8c5820",
            "#7c4830",
            "#6c3828",
            "#5c3020",
            "#4c2818",
            "#3c2010",
          ];
          const treeData = catTop10.map((r, i) => ({
            name: abrevCat(str(r, "descricao_despesa")),
            fullName: str(r, "descricao_despesa"),
            size: raw(r, "total_gasto"),
            pct: raw(r, "pct_total"),
            total: raw(r, "total_gasto"),
            rank: i + 1,
            color: TREE_COLORS[i] ?? "#3c2010",
          }));

          const TreeCell = (props: {
            x?: number; y?: number; width?: number; height?: number;
            name?: string; pct?: number; total?: number; rank?: number; color?: string;
          }) => {
            const { x = 0, y = 0, width = 0, height = 0, name = "", pct = 0, total = 0, rank = 1, color = RED } = props;
            if (width < 10 || height < 10) return null;
            const tooNarrow  = width  < 72;
            const tooShort   = height < 48;
            const showLabel  = !tooNarrow && !tooShort;
            const showPct    = !tooNarrow && height >= 32;
            const pad = 8;
            const maxChars = Math.floor((width - pad * 2) / 7);
            const label = name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name;
            return (
              <g>
                <rect x={x} y={y} width={width} height={height} fill={color} stroke="#000" strokeWidth={1.5} strokeOpacity={0.35} rx={2} />
                {/* overlay escuro suave para contraste do texto */}
                <rect x={x} y={y} width={width} height={height} fill="rgba(0,0,0,0.18)" rx={2} />
                {showLabel && (
                  <text
                    x={x + pad}
                    y={y + pad + 11}
                    fontSize={11}
                    fontFamily={MONO}
                    fontWeight="600"
                    fill="rgba(255,255,255,0.88)"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {label}
                  </text>
                )}
                {showPct && (
                  <text
                    x={x + pad}
                    y={showLabel ? y + height - pad - 2 : y + height / 2 + 6}
                    fontSize={showLabel ? 18 : 13}
                    fontFamily={MONO}
                    fontWeight="800"
                    fill="#ffffff"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {pct.toFixed(1)}%
                  </text>
                )}
                {/* número do ranking no canto superior direito */}
                {width >= 28 && height >= 28 && (
                  <text
                    x={x + width - pad}
                    y={y + pad + 10}
                    fontSize={10}
                    fontFamily={MONO}
                    fontWeight="700"
                    fill="rgba(255,255,255,0.45)"
                    textAnchor="end"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    #{rank}
                  </text>
                )}
              </g>
            );
          };

          return (
            <div className="mb-10">
              <div className="mb-2 border border-border" style={{ height: 380, background: "#080808" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treeData}
                    dataKey="size"
                    aspectRatio={16 / 9}
                    stroke="transparent"
                    content={<TreeCell />}
                  >
                    <Tooltip
                      contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", color: "var(--chart-tooltip-text)", fontFamily: MONO, fontSize: 12 }}
                      formatter={(_v: unknown, _n: string, e: { payload?: { fullName?: string; pct?: number; total?: number } }) => [
                        `${fmtCurrency(e.payload?.total ?? 0)}  ·  ${(e.payload?.pct ?? 0).toFixed(2)}% do total`,
                        e.payload?.fullName ?? "",
                      ]}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
              <p className="mb-4 text-[10px] text-muted-foreground" style={{ fontFamily: MONO }}>
                Área proporcional ao gasto total · passe o mouse para ver detalhes · #1 = maior gasto
              </p>

              {/* Mini legenda com % */}
              <div className="grid grid-cols-2 gap-px border border-border sm:grid-cols-5" style={{ background: "rgba(240,236,228,0.06)" }}>
                {catTop10.slice(0, 5).map((r, i) => (
                  <div key={i} className="bg-background px-4 py-3">
                    <p className="mb-1 text-base font-black" style={{ fontFamily: MONO, color: TREE_COLORS[i] ?? RED }}>
                      {raw(r, "pct_total").toFixed(1)}%
                    </p>
                    <p className="text-xs font-semibold leading-snug text-muted-foreground" style={{ fontFamily: MONO }}>
                      {abrevCat(str(r, "descricao_despesa"))}
                    </p>
                    <div className="mt-2 h-0.5" style={{ background: `linear-gradient(to right, ${TREE_COLORS[i] ?? RED} ${(raw(r, "pct_total") / raw(catTop10[0], "pct_total")) * 100}%, transparent 0%)` }} />
                  </div>
                ))}
              </div>
            </div>
          );
        })() : (
          <div className="mb-10 flex h-24 items-center justify-center border border-border text-xs text-muted-foreground" style={{ fontFamily: MONO, background: "var(--card)" }}>
            CARREGANDO...
          </div>
        )}

        {/* Filtro de categorias */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Filtrar categoria</label>
            <select
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              className="h-9 border px-3 text-[13px] outline-none"
              style={{ fontFamily: MONO, borderColor: catSearch ? RED : "var(--border)", color: catSearch ? "var(--foreground)" : "var(--muted-foreground)", background: "var(--card)", minWidth: 320 }}
            >
              <option value="">Todas as categorias</option>
              {catOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {catSearch && (
            <button type="button" onClick={() => setCatSearch("")}
              className="h-9 border px-4 text-[12px] font-bold uppercase transition-colors"
              style={{ fontFamily: MONO, borderColor: "var(--border)", color: "var(--muted-foreground)", background: "transparent" }}>
              ✕ Limpar
            </button>
          )}
        </div>

        {/* Tabela colapsável — todas as categorias */}
        <div className="border border-border" style={{ background: "var(--card)" }}>
          <button
            type="button"
            onClick={() => setCatTableOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="text-xs tracking-[0.24em] text-muted-foreground" style={{ fontFamily: MONO }}>
              {catSearch ? `CATEGORIAS FILTRADAS (${catFilteredRows.length})` : `TODAS AS CATEGORIAS (${catAllRows.length} no total)`}
            </span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              {catTableOpen ? "▲ FECHAR" : "▼ EXPANDIR"}
            </span>
          </button>

          <div
            ref={catTableRef}
            style={{ maxHeight: catTableOpen ? 560 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}
          >
            <div className="border-t border-border">
              <div className="overflow-x-auto" style={{ maxHeight: 440, overflowY: "auto" }}>
                <table className="min-w-full text-left text-xs" style={{ fontFamily: MONO }}>
                  <thead style={{ background: "var(--secondary)", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      {["#", "Categoria", "Total Gasto", "Lançamentos", "% Total"].map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 font-normal uppercase text-muted-foreground"
                          style={col === "#" && !isDark ? { color: RED } : undefined}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catFilteredRows.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">NENHUMA CATEGORIA ENCONTRADA</td></tr>
                    ) : catFilteredRows
                        .slice((catSearchPage - 1) * CAT_PAGE_SIZE, catSearchPage * CAT_PAGE_SIZE)
                        .map((r, localIdx) => {
                          const globalIdx = catSearch ? localIdx + (catSearchPage - 1) * CAT_PAGE_SIZE : catAllRows.indexOf(r);
                          const isTop = globalIdx === 0;
                          const nome = str(r, "descricao_despesa");
                          const total = raw(r, "total_gasto");
                          const pct = raw(r, "pct_total");
                          const lances = raw(r, "qtd_lancamentos");
                          return (
                            <tr key={globalIdx} className="border-t border-border hover:bg-white/[0.03]">
                              <td className="px-4 py-2.5 font-bold"
                                style={{ color: isDark ? (isTop ? RED : globalIdx < 3 ? "#d4841a" : "rgba(240,236,228,0.3)") : RED, fontFamily: SERIF }}>
                                {String(globalIdx + 1).padStart(2, "0")}
                              </td>
                              <td className="px-4 py-2.5" style={{ color: "var(--foreground)", maxWidth: 360 }}>
                                <span className="block leading-tight">{abrevCat(nome)}</span>
                                <span className="mt-0.5 block text-[10px] text-muted-foreground">{nome}</span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold" style={{ color: isTop ? RED : "var(--foreground)" }}>
                                {fmtCurrency(total)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">
                                {lances.toLocaleString("pt-BR")}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 flex-1 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)", maxWidth: 80 }}>
                                    <div style={{ width: `${Math.min(pct, 100)}%`, background: isTop ? RED : globalIdx < 3 ? "#d4841a" : "rgba(196,18,48,0.4)", height: "100%" }} />
                                  </div>
                                  <span style={{ color: isTop ? RED : "var(--foreground)", minWidth: 40 }}>{pct.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              {catFilteredRows.length > CAT_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <button type="button" disabled={catSearchPage === 1} onClick={() => setCatSearchPage((p) => Math.max(1, p - 1))}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                    ← ANTERIOR
                  </button>
                  <span className="text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                    {(catSearchPage - 1) * CAT_PAGE_SIZE + 1}–{Math.min(catSearchPage * CAT_PAGE_SIZE, catFilteredRows.length)}&nbsp;&nbsp;/&nbsp;&nbsp;{catFilteredRows.length} CATEGORIAS
                  </span>
                  <button type="button" disabled={catSearchPage * CAT_PAGE_SIZE >= catFilteredRows.length} onClick={() => setCatSearchPage((p) => p + 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                    PRÓXIMA →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>
      )}

      {/* ── Seção 01C — Eixos de atuação ─────────────────── */}
      {activeSection === "eixos" && (
      <Section n="01C" tag="EIXOS DE ATUAÇÃO" title="Quais os principais temas de atuação dos deputados?" sub="PRODUÇÃO LEGISLATIVA 2023-2026 · TODOS OS DEPUTADOS E PARTIDOS · TOP 10 EIXOS">

        {/* Gráfico de barras horizontal */}
        {eixoTop10.length > 0 ? (() => {
          const maxVal = raw(eixoTop10[0], "qtd_proposicoes") || 1;
          const barData = eixoTop10.map((r, i) => ({
            name: str(r, "tema"),
            total: raw(r, "qtd_proposicoes"),
            aprovadas: raw(r, "proposicoes_aprovadas"),
            pct: raw(r, "pct_total"),
            fill: i === 0 ? RED : i < 3 ? "#d4841a" : "rgba(196,18,48,0.40)",
          }));

          return (
            <div className="mb-10">
              <div className="mb-2 h-[360px] border border-border p-4" style={{ background: "var(--card)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ left: 0, right: 80, top: 8, bottom: 8 }}
                    barCategoryGap="28%"
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: "var(--chart-axis-fill)", fontSize: 11, fontFamily: MONO }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => v.toLocaleString("pt-BR")}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={260}
                      tick={{ fill: "var(--chart-axis-fill)", fontSize: 13, fontFamily: MONO, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", color: "var(--chart-tooltip-text)", fontFamily: MONO, fontSize: 12 }}
                      itemStyle={{ color: "var(--chart-tooltip-text)" }}
                      labelStyle={{ color: "var(--chart-tooltip-text)" }}
                      formatter={(v: number, _: string, e: { payload?: { aprovadas?: number; pct?: number } }) => [
                        `${v.toLocaleString("pt-BR")} proposições  ·  ${(e.payload?.pct ?? 0).toFixed(1)}% do total  ·  ${(e.payload?.aprovadas ?? 0).toLocaleString("pt-BR")} aprovadas`,
                        "Total",
                      ]}
                    />
                    <Bar dataKey="total" radius={[0, 2, 2, 0]} maxBarSize={18}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mini cards top 10 — 5 por linha */}
              <div className="grid grid-cols-2 gap-px border border-border sm:grid-cols-5" style={{ background: "rgba(240,236,228,0.06)" }}>
                {eixoTop10.map((r, i) => (
                  <div key={i} className="bg-background px-4 py-3">
                    <p className="mb-1 text-base font-black" style={{ fontFamily: MONO, color: i === 0 ? RED : i < 3 ? "#d4841a" : "var(--foreground)" }}>
                      {raw(r, "qtd_proposicoes").toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs font-semibold leading-snug text-muted-foreground" style={{ fontFamily: MONO }}>
                      {str(r, "tema")}
                    </p>
                    <div
                      className="mt-2 h-0.5"
                      style={{
                        background: `linear-gradient(to right, ${i === 0 ? RED : i < 3 ? "#d4841a" : "rgba(196,18,48,0.4)"} ${(raw(r, "qtd_proposicoes") / maxVal) * 100}%, transparent 0%)`,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Barra proporcional */}
              <div className="mt-3 flex h-3 overflow-hidden border border-border">
                {eixoTop10.map((r, i) => (
                  <div
                    key={i}
                    title={`${str(r, "tema")}: ${raw(r, "pct_total").toFixed(1)}%`}
                    style={{
                      width: `${raw(r, "pct_total")}%`,
                      background: i === 0 ? RED : i === 1 ? "#b05010" : i === 2 ? "#a04828" : i < 5 ? "rgba(196,18,48,0.5)" : "rgba(196,18,48,0.2)",
                      transition: "width 0.6s ease",
                    }}
                  />
                ))}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground" style={{ fontFamily: MONO }}>
                Barra proporcional ao % do total · hover para ver tema
              </p>
            </div>
          );
        })() : (
          <div className="mb-10 flex h-24 items-center justify-center border border-border text-xs text-muted-foreground" style={{ fontFamily: MONO, background: "var(--card)" }}>
            CARREGANDO...
          </div>
        )}

        {/* Filtro de eixos */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Filtrar eixo temático</label>
            <select
              value={eixoSearch}
              onChange={(e) => setEixoSearch(e.target.value)}
              className="h-9 border px-3 text-[13px] outline-none"
              style={{ fontFamily: MONO, borderColor: eixoSearch ? RED : "var(--border)", color: eixoSearch ? "var(--foreground)" : "var(--muted-foreground)", background: "var(--card)", minWidth: 320 }}
            >
              <option value="">Todos os eixos</option>
              {eixoOptions.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          {eixoSearch && (
            <button type="button" onClick={() => setEixoSearch("")}
              className="h-9 border px-4 text-[12px] font-bold uppercase transition-colors"
              style={{ fontFamily: MONO, borderColor: "var(--border)", color: "var(--muted-foreground)", background: "transparent" }}>
              ✕ Limpar
            </button>
          )}
        </div>

        {/* Tabela colapsável — todos os eixos */}
        <div className="border border-border" style={{ background: "var(--card)" }}>
          <button
            type="button"
            onClick={() => setEixoTableOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="text-xs tracking-[0.24em] text-muted-foreground" style={{ fontFamily: MONO }}>
              {eixoSearch ? `EIXOS FILTRADOS (${eixoFilteredRows.length})` : `TODOS OS EIXOS (${eixoAllRows.length} no total)`}
            </span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              {eixoTableOpen ? "▲ FECHAR" : "▼ EXPANDIR"}
            </span>
          </button>

          <div
            ref={eixoTableRef}
            style={{ maxHeight: eixoTableOpen ? 560 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}
          >
            <div className="border-t border-border">
              <div className="overflow-x-auto" style={{ maxHeight: 440, overflowY: "auto" }}>
                <table className="min-w-full text-left text-xs" style={{ fontFamily: MONO }}>
                  <thead style={{ background: "var(--secondary)", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      {["#", "Eixo Temático", "Proposições", "Aprovadas", "% Total"].map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 font-normal uppercase text-muted-foreground"
                          style={col === "#" && !isDark ? { color: RED } : undefined}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eixoFilteredRows.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">NENHUM EIXO ENCONTRADO</td></tr>
                    ) : eixoFilteredRows
                        .slice((eixoSearchPage - 1) * EIXO_PAGE_SIZE, eixoSearchPage * EIXO_PAGE_SIZE)
                        .map((r, localIdx) => {
                          const gi = eixoSearch ? localIdx + (eixoSearchPage - 1) * EIXO_PAGE_SIZE : eixoAllRows.indexOf(r);
                          const isTop = gi === 0;
                          const total = raw(r, "qtd_proposicoes");
                          const aprov = raw(r, "proposicoes_aprovadas");
                          const pct = raw(r, "pct_total");
                          return (
                            <tr key={gi} className="border-t border-border hover:bg-white/[0.03]">
                              <td className="px-4 py-2.5 font-bold"
                                style={{ color: isDark ? (isTop ? RED : gi < 3 ? "#d4841a" : "rgba(240,236,228,0.3)") : RED, fontFamily: SERIF }}>
                                {String(gi + 1).padStart(2, "0")}
                              </td>
                              <td className="px-4 py-2.5 font-medium" style={{ color: "var(--foreground)" }}>
                                {str(r, "tema")}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold" style={{ color: isTop ? RED : "var(--foreground)" }}>
                                {total.toLocaleString("pt-BR")}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">
                                {aprov.toLocaleString("pt-BR")}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 flex-1 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)", maxWidth: 80 }}>
                                    <div style={{ width: `${Math.min(pct / (raw(eixoAllRows[0], "pct_total") || 1) * 100, 100)}%`, background: isTop ? RED : gi < 3 ? "#d4841a" : "rgba(196,18,48,0.4)", height: "100%" }} />
                                  </div>
                                  <span style={{ color: isTop ? RED : "var(--foreground)", minWidth: 40 }}>{pct.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              {eixoFilteredRows.length > EIXO_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <button type="button" disabled={eixoSearchPage === 1} onClick={() => setEixoSearchPage((p) => Math.max(1, p - 1))}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                    ← ANTERIOR
                  </button>
                  <span className="text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                    {(eixoSearchPage - 1) * EIXO_PAGE_SIZE + 1}–{Math.min(eixoSearchPage * EIXO_PAGE_SIZE, eixoFilteredRows.length)}&nbsp;&nbsp;/&nbsp;&nbsp;{eixoFilteredRows.length} EIXOS
                  </span>
                  <button type="button" disabled={eixoSearchPage * EIXO_PAGE_SIZE >= eixoFilteredRows.length} onClick={() => setEixoSearchPage((p) => p + 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                    PRÓXIMA →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>
      )}

      {/* ── Seção 01D — Custo-benefício ──────────────────── */}
      {activeSection === "custo-beneficio" && (
      <Section n="01D" tag="CUSTO-BENEFÍCIO" title="Quem entrega mais por menos?" sub="RANKING GLOBAL 2023-2026 · BENEFÍCIO ÷ GASTO TOTAL · TOP 10 DEPUTADOS">

        {/* ── Filtros da seção 01D ── */}
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Partido</label>
            <select
              value={cbPartidoFilter}
              onChange={(e) => setCbPartidoFilter(e.target.value)}
              className="h-9 border bg-transparent px-3 text-[13px] outline-none"
              style={{ fontFamily: MONO, borderColor: cbPartidoFilter ? RED : "var(--border)", color: cbPartidoFilter ? "var(--foreground)" : "var(--muted-foreground)", background: "var(--card)", minWidth: 130 }}
            >
              <option value="">Todos</option>
              {partidoOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Estado (UF)</label>
            <select
              value={cbUfFilter}
              onChange={(e) => setCbUfFilter(e.target.value)}
              className="h-9 border bg-transparent px-3 text-[13px] outline-none"
              style={{ fontFamily: MONO, borderColor: cbUfFilter ? RED : "var(--border)", color: cbUfFilter ? "var(--foreground)" : "var(--muted-foreground)", background: "var(--card)", minWidth: 130 }}
            >
              <option value="">Todos</option>
              {ufOptions.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Ordem</label>
            <div className="flex h-9">
              <button
                type="button"
                onClick={() => setCbSortOrder("mais")}
                className="border px-4 text-[12px] font-bold uppercase transition-colors"
                style={{ fontFamily: MONO, background: cbSortOrder === "mais" ? RED : "transparent", color: cbSortOrder === "mais" ? "#fff" : "var(--foreground)", borderColor: cbSortOrder === "mais" ? RED : "var(--border)" }}
              >
                Melhores
              </button>
              <button
                type="button"
                onClick={() => setCbSortOrder("menos")}
                className="border-y border-r px-4 text-[12px] font-bold uppercase transition-colors"
                style={{ fontFamily: MONO, background: cbSortOrder === "menos" ? RED : "transparent", color: cbSortOrder === "menos" ? "#fff" : "var(--foreground)", borderColor: cbSortOrder === "menos" ? RED : "var(--border)" }}
              >
                Piores
              </button>
            </div>
          </div>
          {hasCbFilter && (
            <button
              type="button"
              onClick={() => { setCbPartidoFilter(""); setCbUfFilter(""); setCbSortOrder("mais"); }}
              className="h-9 border px-4 text-[12px] font-bold uppercase tracking-widest transition-colors hover:border-primary hover:text-primary"
              style={{ fontFamily: MONO, borderColor: "var(--border)", color: "var(--muted-foreground)" }}
            >
              Limpar filtros
            </button>
          )}
          {hasCbFilter && (
            <span className="text-[11px] text-muted-foreground" style={{ fontFamily: MONO }}>
              {filteredCbRows.length} deputado{filteredCbRows.length !== 1 ? "s" : ""} encontrado{filteredCbRows.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Filtro: pesquisar posição de um deputado no ranking de custo-benefício ── */}
        <PosicaoFinder
          rows={cbAllRows}
          query={cbQuery}
          onQuery={setCbQuery}
          metricLabel="Score CB"
          metric={(r) => getCbPercentile(r).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          rounded
        />

        {/* Ranking top 10 */}
        <div className="mb-10 flex flex-col gap-3">
          {displayCbTop10.length === 0 && (
            <div className="flex h-24 items-center justify-center border border-border text-xs text-muted-foreground" style={{ fontFamily: MONO, background: "var(--card)" }}>
              {hasCbFilter ? "NENHUM DEPUTADO ENCONTRADO" : "CARREGANDO..."}
            </div>
          )}
          {displayCbTop10.map((r, i) => {
            const id = raw(r, "id_deputado");
            const nome = str(r, "nome");
            const partido = str(r, "sigla_partido");
            const uf = str(r, "sigla_uf");
            const gasto = raw(r, "gasto_total");
            const scoreCb = getCbPercentile(r);
            const maxCb = getCbPercentile(displayCbTop10[0]) || 1;
            const barW = Math.min((scoreCb / maxCb) * 100, 100);
            const color = i === 0 ? RED : i < 3 ? "#d4841a" : "rgba(196,18,48,0.55)";
            return (
              <div key={i} className="flex items-center gap-5 border border-border px-6 py-4" style={{ background: "var(--card)" }}>
                {/* Rank */}
                <span className="w-9 shrink-0 text-2xl font-black" style={{ fontFamily: SERIF, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* Foto */}
                <img
                  src={depPhoto(id)}
                  alt={nome}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  className="h-16 w-16 shrink-0 rounded-full object-cover object-top"
                  style={{ border: `3px solid ${color}` }}
                />
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-black" style={{ color: "var(--foreground)", fontFamily: MONO }}>
                    {nome}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-bold" style={{ background: "var(--secondary)", color: "var(--foreground)", fontFamily: MONO }}>
                      {partido}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground" style={{ fontFamily: MONO }}>{uf}</span>
                  </div>
                  {/* Barra proporcional ao score CB */}
                  <div className="mt-3 h-1.5" style={{ background: "rgba(240,236,228,0.07)" }}>
                    <div style={{ width: `${barW}%`, background: color, height: "100%", transition: "width 0.6s ease" }} />
                  </div>
                </div>
                {/* Métricas */}
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-black tabular-nums" style={{ fontFamily: MONO, color }}>
                    {scoreCb.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>score CB</p>
                  <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    gasto {fmtCurrency(gasto)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabela colapsável — todos por custo-benefício */}
        <div className="border border-border" style={{ background: "var(--card)" }}>
          <button
            type="button"
            onClick={handleToggleCbTable}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="text-xs tracking-[0.24em] text-muted-foreground" style={{ fontFamily: MONO }}>
              TABELA COMPLETA{hasCbFilter ? ` · ${filteredCbRows.length} REGISTROS` : cbTableTotal > 0 ? ` · ${cbTableTotal} REGISTROS` : ""}
            </span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              {cbTableOpen ? "▲ FECHAR" : "▼ EXPANDIR"}
            </span>
          </button>

          <div
            ref={cbTableRef}
            style={{ maxHeight: cbTableOpen ? 560 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}
          >
            <div className="border-t border-border">
              <div className="overflow-x-auto" style={{ maxHeight: 440, overflowY: "auto" }}>
                <table className="min-w-full text-left text-xs" style={{ fontFamily: MONO }}>
                  <thead style={{ background: "var(--secondary)", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      {["#", "Foto", "Deputado", "Partido", "UF", "Ano", "Score CB", "Gasto"].map((col) => (
                        <th
                          key={col}
                          className="whitespace-nowrap px-4 py-3 font-normal uppercase text-muted-foreground"
                          style={col === "#" && !isDark ? { color: RED } : col === "Score CB" ? { color: RED } : undefined}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hasCbFilter ? (
                      filteredCbRows.slice((cbFilterPage - 1) * CB_PAGE_SIZE, cbFilterPage * CB_PAGE_SIZE).map((r, i) => {
                        const rank = (cbFilterPage - 1) * CB_PAGE_SIZE + i + 1;
                        const id = raw(r, "id_deputado");
                        const isTop = rank === 1;
                        const color = isDark ? (isTop ? RED : rank <= 3 ? "#d4841a" : "rgba(240,236,228,0.3)") : RED;
                        const scoreCbRow = getCbPercentile(r);
                        return (
                          <tr key={i} className="border-t border-border hover:bg-white/[0.03]">
                            <td className="px-4 py-2.5 font-bold" style={{ color, fontFamily: SERIF }}>{String(rank).padStart(2, "0")}</td>
                            <td className="px-4 py-2.5">
                              <img src={depPhoto(id)} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                className="h-7 w-7 rounded-full object-cover" style={{ border: `1px solid ${color}` }} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 font-medium" style={{ color: "var(--foreground)" }}>{str(r, "nome")}</td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{str(r, "sigla_partido")}</td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{str(r, "sigla_uf")}</td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{str(r, "ano_dados")}</td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold tabular-nums" style={{ color: isTop ? RED : "var(--foreground)" }}>
                              {scoreCbRow.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">{fmtCurrency(raw(r, "gasto_total"))}</td>
                          </tr>
                        );
                      })
                    ) : cbTableLoading ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">CARREGANDO...</td></tr>
                    ) : cbTableRows.map((r, i) => {
                      const globalRank = (cbTablePage - 1) * CB_PAGE_SIZE + i + 1;
                      const id = raw(r, "id_deputado");
                      const isTop = globalRank === 1;
                      const color = isDark ? (isTop ? RED : globalRank <= 3 ? "#d4841a" : "rgba(240,236,228,0.3)") : RED;
                      const scoreCbRow = getCbPercentile(r);
                      return (
                        <tr key={i} className="border-t border-border hover:bg-white/[0.03]">
                          <td className="px-4 py-2.5 font-bold" style={{ color, fontFamily: SERIF }}>
                            {String(globalRank).padStart(2, "0")}
                          </td>
                          <td className="px-4 py-2.5">
                            <img src={depPhoto(id)} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              className="h-7 w-7 rounded-full object-cover" style={{ border: `1px solid ${color}` }} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 font-medium" style={{ color: "var(--foreground)" }}>{str(r, "nome")}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{str(r, "sigla_partido")}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{str(r, "sigla_uf")}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{str(r, "ano_dados")}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold tabular-nums" style={{ color: isTop ? RED : "var(--foreground)" }}>
                            {scoreCbRow.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">
                            {fmtCurrency(raw(r, "gasto_total"))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasCbFilter ? (
                filteredCbRows.length > CB_PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <button type="button" disabled={cbFilterPage <= 1} onClick={() => setCbFilterPage((p) => Math.max(1, p - 1))}
                      className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                      style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                      ← ANTERIOR
                    </button>
                    <span className="text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                      {(cbFilterPage - 1) * CB_PAGE_SIZE + 1}–{Math.min(cbFilterPage * CB_PAGE_SIZE, filteredCbRows.length)}&nbsp;&nbsp;/&nbsp;&nbsp;{filteredCbRows.length} REGISTROS
                    </span>
                    <button type="button" disabled={cbFilterPage * CB_PAGE_SIZE >= filteredCbRows.length} onClick={() => setCbFilterPage((p) => p + 1)}
                      className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                      style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
                      PRÓXIMA →
                    </button>
                  </div>
                )
              ) : (
                cbTableTotal > CB_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <button
                    type="button"
                    disabled={cbTablePage <= 1 || cbTableLoading}
                    onClick={() => fetchCbTablePage(cbTablePage - 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}
                  >
                    ← ANTERIOR
                  </button>
                  <span className="text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                    {(cbTablePage - 1) * CB_PAGE_SIZE + 1}–{Math.min(cbTablePage * CB_PAGE_SIZE, cbTableTotal)}&nbsp;&nbsp;/&nbsp;&nbsp;{cbTableTotal} REGISTROS
                  </span>
                  <button
                    type="button"
                    disabled={cbTablePage * CB_PAGE_SIZE >= cbTableTotal || cbTableLoading}
                    onClick={() => fetchCbTablePage(cbTablePage + 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}
                  >
                    PRÓXIMA →
                  </button>
                </div>
                )
              )}
            </div>
          </div>
        </div>
      </Section>
      )}

      {/* ── Seção Metodologia ────────────────────────────── */}
      {activeSection === "metodologia" && (
      <Section n="MET" tag="METODOLOGIA" title="Como os indicadores foram calculados?" sub="TRANSPARÊNCIA ANALÍTICA · CLIQUE EM CADA MÉTODO PARA EXPANDIR">
        {([
          {
            id: "gastos_dep",
            titulo: "Ranking de Gastos por Deputado",
            origem: "Q1 — Cota Parlamentar (CEAP) · 57ª Legislatura (2023-2026)",
            formula: "Gasto total = soma de valor_liquido de todos os registros de reembolso do deputado entre 2023 e 2026",
            passos: [
              "FONTE DOS DADOS: A Câmara dos Deputados disponibiliza publicamente todos os pedidos de reembolso feitos pelos parlamentares por meio da Cota para o Exercício da Atividade Parlamentar (CEAP). Cada linha representa uma despesa individual com seu valor líquido (após eventuais deduções e glosas). Esses dados são importados diretamente da API oficial da Câmara.",
              "AGREGAÇÃO: Para cada deputado, somamos o campo valor_liquido de todos os registros presentes na base, cobrindo integralmente a 57ª legislatura. O resultado é o gasto total acumulado no mandato — não há ponderação por tempo de mandato ou por meses ativos.",
              "PARTIDO E ESTADO (perfil dominante): O partido e a UF exibidos no ranking não são os dados cadastrais atuais do deputado. São derivados de qual combinação partido + UF aparece com maior frequência nos próprios registros de gastos. Isso captura mudanças de partido ao longo da legislatura de forma orgânica: um deputado que trocou de partido terá o partido pelo qual mais registrou despesas. Em caso de empate na frequência, o critério de desempate é o maior volume de gasto naquele partido, e depois ordem alfabética da sigla.",
              "NOME: Usamos o nome civil do deputado quando disponível na base (campo nome_civil). Caso esteja em branco, usamos o nome parlamentar. Isso evita que o mesmo deputado apareça com variações de nome em anos diferentes.",
              "ORDENAÇÃO: O resultado final é ordenado do maior para o menor gasto total acumulado. A tabela completa exibe todos os deputados que registraram ao menos um gasto no período; o top 10 do ranking visual mostra apenas os primeiros.",
            ],
            interpretacao: "O teto da cota varia por estado de origem (deputados do Amazonas e Roraima têm cotasuperfior por causa das distâncias até Brasília). Comparar um deputado de SP com um do AM sem considerar esse teto é uma comparação injusta. Gastar próximo ao limite não é irregularidade — o CEAP existe exatamente para isso. A análise mais reveladora é comparar deputados do mesmo estado ou cruzar os gastos com a produção legislativa usando o índice de custo-benefício (Q7).",
          },
          {
            id: "eixos",
            titulo: "Eixos Temáticos de Atuação Legislativa",
            origem: "Q2 — Classificação Temática das Proposições · 57ª Legislatura (2023-2026)",
            formula: "Total de proposições distintas em cada eixo = COUNT DISTINCT (ano_dados, id_proposicao) por tema, somando todos os deputados",
            passos: [
              "CLASSIFICAÇÃO TEMÁTICA: Cada proposição legislativa (PL, PEC, REQ, etc.) passou por um processo de classificação em que seu título, ementa e palavras-chave foram analisados para identificar a qual dos 32 grandes eixos temáticos pertence. Essa classificação está pré-processada na tabela resposta_temas_eixos. Os eixos representam grandes áreas como Saúde, Educação, Segurança Pública, Infraestrutura, Meio Ambiente, entre outros.",
              "DUPLA CONTAGEM: Uma proposição pode ter múltiplos autores deputados. Para não contar a mesma proposição várias vezes ao agregar por eixo, usamos DISTINCT na combinação (ano_dados, id_proposicao, id_deputado, eixo_maior) — cada par deputado-proposição é contado uma única vez por eixo.",
              "PROPOSIÇÕES APROVADAS: A situação de cada proposição é verificada na tabela resposta_proposicoes_situacoes. Se a descrição contém termos como 'aprov', 'sancao', 'norma juridica' ou 'promulg', a proposição é marcada como aprovada. Isso permite separar os projetos que apenas tramitaram dos que efetivamente viraram lei ou norma.",
              "NUVEM DE PALAVRAS: Os títulos e ementas das proposições foram tokenizados por um pipeline de NLP (processamento de linguagem natural) que removeu stopwords, termos genéricos e ruídos. Os 200 tokens mais frequentes por ano alimentam as nuvens de palavras exibidas no painel, dando uma leitura intuitiva sobre os assuntos mais recorrentes em cada período.",
              "EIXO MAIS ATUANTE DO DEPUTADO: Para identificar em qual tema cada deputado se concentra mais, ranqueamos os eixos pela quantidade de proposições e pegamos o de maior peso (posição 1). Quando há empate entre dois eixos, ambos são listados juntos — o deputado atuou igualmente nos dois temas.",
            ],
            interpretacao: "Quantidade de proposições não equivale a impacto. Alguns temas geram naturalmente mais projetos por serem mais fáceis de legislar ou populares eleitoralmente (homenagens, datas comemorativas). Um deputado com 5 PECs sobre Previdência pode ter impacto estrutural muito maior do que outro com 200 requerimentos de informação sobre assuntos diversos. Para calibrar qualidade versus quantidade, o índice Q7 já desconta proposições simbólicas.",
          },
          {
            id: "cb",
            titulo: "Índice de Custo-Benefício Parlamentar",
            origem: "Q7 — Eficiência do Mandato · 57ª Legislatura (2023-2026) · Metodologia revisada",
            formula: "Custo-Benefício = Benefício ÷ Gasto^1.08 · onde Benefício = qualidade_proposicoes + (presença_total × 0.1)",
            passos: [
              "PONTUAÇÃO DE QUALIDADE DAS PROPOSIÇÕES: Cada proposição recebe uma pontuação baseada em três fatores multiplicados entre si. (1) Tipo da proposição: PEC vale 12 pontos, PLP vale 10, MPV e MSC valem 9, PL vale 7, decretos legislativos e similares valem 5, requerimentos e indicações valem 1,5, e demais tipos valem 3. (2) Situação atual: proposições aprovadas/sancionadas/promulgadas ganham +24 pontos, as que estão tramitando ativamente ou prontas para votação ganham +6, as arquivadas e retiradas ganham 0, e as demais ganham +2. Os dois fatores são somados antes da multiplicação.",
              "PENALIDADE PARA PROPOSIÇÕES SIMBÓLICAS: Se a ementa ou título contiver termos como 'homenagem', 'data comemorativa', 'dia nacional', 'semana nacional', 'sessão solene', 'título honorífico' ou 'denomina', a pontuação total é multiplicada por 0,45. Isso penaliza projetos com baixo impacto substantivo que historicamente inflariam rankings de produtividade.",
              "PESO DE AUTORIA: Ser o autor principal (primeiro assinante ou único autor) vale peso 1,0. Ser o 2º ao 5º assinante vale peso 0,55. Demais co-autores valem 0,25. Esse peso é o fator final de multiplicação. A soma de todos esses scores por deputado por ano gera o campo qualidade_proposicoes.",
              "PRESENÇA EM EVENTOS: Contamos o total de eventos parlamentares em que o deputado compareceu (sessões plenárias, comissões, etc.) na tabela eventos_presenca_deputados. A presença entra na fórmula do benefício com peso de apenas 10% (×0,1) em relação às proposições — é um sinal positivo, mas não domina o score.",
              "DENOMINADOR COM PENALIZAÇÃO EXPONENCIAL: O denominador usa gasto_total elevado à potência 1,08, e não o gasto simples. Isso cria uma curva levemente convexa: um deputado que gasta o dobro não divide por 2×, mas por 2^1,08 ≈ 2,11×. Quem gasta muito tem um denominador crescendo mais rápido que os gastos, penalizando alto consumo de forma progressiva.",
              "CRITÉRIOS DE ELEGIBILIDADE: São excluídos do índice deputados com gasto_total ≤ R$40.000 no período (evita outliers de quem mal usou a cota) e deputados com qualidade_proposicoes = 0 (não produziram nenhuma proposição pontuável). Isso garante que o ranking reflita deputados efetivamente ativos.",
              "NORMALIZAÇÃO PARA EXIBIÇÃO (Score CB): O valor bruto de custo_beneficio é um número muito pequeno e de difícil leitura direta (ex: 0,096 ou 0,0048). Para torná-lo inteligível, aplicamos uma normalização por percentil: o Score CB exibido nos cards e na tabela representa a posição relativa do deputado no ranking geral. O cálculo é feito inteiramente no front-end, sobre todos os registros carregados (cbAllRows, ordenados DESC por custo_beneficio). Fórmula: Score CB = ((total de registros − posição no ranking) ÷ total de registros) × 100. O 1º colocado geral recebe um score próximo de 100 e o último próximo de 0. Por exemplo, um Score CB de 97,3 significa que aquele deputado supera 97,3% de todos os demais no índice. Essa escala não altera o ranking — apenas transforma a unidade bruta em um percentil intuitivo.",
            ],
            interpretacao: "O índice não mede a qualidade de um mandato no sentido político ou ético — ele mede eficiência de custo dentro das métricas disponíveis nos dados públicos. Um score alto pode resultar de gastar pouco (denominador pequeno), de produzir muitos projetos relevantes, ou da combinação dos dois. Os primeiros colocados merecem leitura cuidadosa: compare sempre o volume absoluto de gasto e de proposições, não só o score. Deputados com gastos muito abaixo da média tendem a dominar o topo por efeito matemático do denominador pequeno.",
          },
          {
            id: "gastos_cat",
            titulo: "Categorias de Gasto da Cota Parlamentar",
            origem: "Q13 — Distribuição por Tipo de Despesa · 57ª Legislatura (2023-2026)",
            formula: "Total por categoria = soma de valor_liquido agrupada por descricao_despesa, considerando apenas lançamentos positivos de deputados da 57ª legislatura",
            passos: [
              "CATEGORIAS OFICIAIS: A CEAP define um conjunto fechado de tipos de despesa reembolsável. Esses tipos vêm diretamente do campo descricao_despesa nos registros enviados pela Câmara, sem reclassificação. As principais categorias incluem: Divulgação da Atividade Parlamentar, Passagens Aéreas, Combustíveis e Lubrificantes, Serviços Postais, Locação de Veículos, Hospedagem, Alimentação, Telefonia, Consultorias e Assessorias Técnicas, entre outras.",
              "FILTROS APLICADOS: Consideramos apenas deputados registrados com id_legislatura_final = 57 (garante que excluímos deputados de legislaturas anteriores que possam ter algum gasto residual no sistema). Também filtramos apenas lançamentos com valor_liquido > 0 — isso elimina estornos, glosas e correções negativas que existem na base bruta e que distorceriam as somas.",
              "DUPLA VISÃO (ANUAL E GLOBAL): A análise produz dois recortes. O anual mostra o total por categoria em cada ano de 2023 a 2026 separadamente. O global consolida todos os anos, usando um CROSS JOIN sobre o total geral para calcular o percentual de cada categoria em relação ao gasto total absoluto de toda a 57ª legislatura.",
              "PERCENTUAL DO TOTAL: O campo pct_total mostra o quanto aquela categoria representa do gasto total de todos os deputados no período (não é per capita, nem relativo à cota disponível). Isso permite ver a fatia de cada tipo de despesa no bolo total do CEAP.",
              "QUANTIDADE DE LANÇAMENTOS: Além do valor, registramos o qtd_lancamentos — o número de pedidos de reembolso individuais naquela categoria. Um deputado pode ter poucos lançamentos de alto valor (ex: passagens internacionais) ou muitos de baixo valor (ex: combustível local). A combinação valor + quantidade dá uma visão mais completa do comportamento de gasto.",
            ],
            interpretacao: "A categoria 'Divulgação da Atividade Parlamentar' historicamente ocupa ~35-40% do total do CEAP porque abrange desde publicidade em rádio local e jornal impresso até impulsionamento de publicações em redes sociais. Por ser a categoria mais ampla e subjetiva nos critérios de elegibilidade, é também a mais auditada por entidades de transparência. Atenção: categorias com maior número de lançamentos (como Combustíveis) não são necessariamente as de maior valor total — a relação depende do perfil geográfico e de deslocamento de cada deputado.",
          },
        ] as Array<{ id: string; titulo: string; origem: string; formula: string; passos: string[]; interpretacao: string }>).map((m) => (
          <div key={m.id} className="mb-2 border border-border" style={{ background: "var(--card)" }}>
            <button
              type="button"
              onClick={() => toggleMetodo(m.id)}
              className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-white/[0.03]"
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
              <div className="border-t border-border px-5 py-5" style={{ background: "var(--card)" }}>
                {/* Fórmula */}
                <div className="mb-4 border-l-2 py-2 pl-4" style={{ borderColor: RED }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: RED, fontFamily: MONO }}>Fórmula</p>
                  <p className="mt-1 text-base font-bold leading-relaxed" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.formula}</p>
                </div>
                {/* Passos */}
                <div className="mb-5 flex flex-col gap-3">
                  {m.passos.map((p, pi) => {
                    const colonIdx = p.indexOf(":");
                    const hasLabel = colonIdx > 0 && colonIdx < 40 && p.slice(0, colonIdx) === p.slice(0, colonIdx).toUpperCase();
                    const label = hasLabel ? p.slice(0, colonIdx) : null;
                    const body = hasLabel ? p.slice(colonIdx + 1).trim() : p;
                    return (
                      <div key={pi} className="border-l border-border pl-3">
                        {label && (
                          <p className="mb-0.5 text-xs font-bold uppercase tracking-widest" style={{ color: RED, fontFamily: MONO }}>{label}</p>
                        )}
                        <p className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ color: "var(--foreground)", opacity: 0.88, fontFamily: MONO }}>{body}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Interpretação */}
                <div className="border border-border p-4" style={{ background: "rgba(196,18,48,0.08)" }}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: RED, fontFamily: MONO }}>Como interpretar</p>
                  <p className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ color: "var(--foreground)", opacity: 0.9, fontFamily: MONO }}>{m.interpretacao}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </Section>
      )}
    </div>
  );
}
