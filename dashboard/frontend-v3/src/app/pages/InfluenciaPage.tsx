import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import * as echarts from "echarts";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { fetchMeta, fetchQuestion } from "../api";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import type { FilterChoice, QuestionPayload } from "../types";
import { useTheme } from "../../contexts/ThemeContext";

type InfluenciaPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
  onNavigateRecorte: (path: string) => void;
};

type Row = Record<string, unknown>;
type RawGraphNode = {
  id?: string;
  nome?: string;
  name?: string;
  community?: string;
  partido?: string;
  sigla_partido?: string;
  uf?: string;
  sigla_uf?: string;
  grau_ponderado?: number;
  qtd_conexoes?: number;
  symbolSize?: number;
};
type RawGraphLink = {
  source?: string;
  target?: string;
  value?: number;
  peso?: number;
  kappa_ponderado?: number;
  concordancia_ponderada?: number;
  concordancia_esperada?: number;
  votacoes_em_comum?: number;
};
type VoteCommunityGraph = {
  communities?: Array<Record<string, unknown>>;
  nodes?: RawGraphNode[];
  links?: RawGraphLink[];
  top_options?: number[];
  default_top?: number;
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const RED = "#c41230";
const COLORS = ["#c41230", "#7c1a2e", "#d6a84f", "#4a7c59", "#4f6fad", "#8b5a3c"];
const IDEOLOGY_COLORS: Record<string, string> = {
  "esquerda": "#c41230",
  "centro": "#d6a84f",
  "direita": "#2b5490",
  "nao classificado": "#555",
};

const ROBUST_MIN_VOTES = 500;
const ROBUST_MIN_DEPS  = 5;

const TRANSVERSAL_PARTIES = ["PL", "PP", "PSD", "PSDB", "MDB", "UNIÃO", "REPUBLICANOS", "PODE", "AVANTE", "CIDADANIA"];
const LEFT_PARTIES = ["PT", "PSOL", "PCdoB", "PV", "REDE"];
const LEIDEN_FINDINGS: { n: string; title: string; body: string; chips: string[]; chipsLabel: string }[] = [
  {
    n: "01",
    title: "Mesmos partidos, blocos diferentes.",
    body: "Dez partidos aparecem simultaneamente nos três blocos de comportamento. O voto não respeita a fronteira partidária: legendas inteiras se dividem entre grupos que votam de formas distintas.",
    chips: TRANSVERSAL_PARTIES,
    chipsLabel: "PRESENTES NOS 3 BLOCOS",
  },
  {
    n: "02",
    title: "A esquerda é o bloco mais coeso.",
    body: "PT, PSOL, PCdoB, PV e REDE estão concentrados quase só no Bloco 3 — o de maior kappa (0,772). Mais coesão significa votos mais previsíveis e uniformes dentro do grupo.",
    chips: LEFT_PARTIES,
    chipsLabel: "CONCENTRADOS NO BLOCO 3",
  },
  {
    n: "03",
    title: "O Bloco 2 é o mais frouxo.",
    body: "Com densidade de 86,5 — cerca da metade dos outros dois blocos —, o Bloco 2 existe como agrupamento, mas tem laços internos bem mais fracos: seus deputados votam juntos com menos regularidade.",
    chips: [],
    chipsLabel: "",
  },
];

const raw = (row: Row | undefined, key: string) => Number(row?.[key] ?? 0);
const text = (row: Row | undefined, key: string) => String(row?.[key] ?? "");
const fmtNum = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtPct = (value: number) => `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

// foto do deputado — mesmo padrão dos recortes 01 e 02
const depPhoto = (id: string | number) =>
  `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`;
// normaliza texto para busca (minúsculas, sem acentos)
const normalizeText = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function SectionHeader({ tag, n, title, desc }: { tag: string; n: string; title: string; desc: string }) {
  return (
    <div className="mb-10">
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
      <h2 className="mb-3 text-3xl font-black leading-tight md:text-5xl" style={{ fontFamily: SERIF, color: "var(--influence-heading-color, var(--foreground))" }}>{title}</h2>
      <p
        className="max-w-[980px] text-[13px] font-bold uppercase leading-relaxed tracking-[0.18em] md:text-sm"
        style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.82 }}
      >
        {desc}
      </p>
    </div>
  );
}

function StatCard({ label, value, sub, unit }: { label: string; value: string; sub?: string; unit?: string }) {
  return (
    <div className="bg-background px-6 py-6">
      <p className="mb-2 text-[13px] font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>{label}</p>
      <p className="text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>{value}{unit ? <span className="ml-1 text-lg">{unit}</span> : null}</p>
      {sub ? <p className="mt-1 text-[13px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>{sub}</p> : null}
    </div>
  );
}

function EmptyPanel({ text: message }: { text: string }) {
  return (
    <div className="border border-border px-6 py-12 text-center" style={{ background: "var(--influence-panel-bg, #111)" }}>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{message}</p>
    </div>
  );
}

function SimpleTable({ rows, columns, empty }: { rows: Row[]; columns: string[]; empty: string }) {
  if (!rows.length) return <EmptyPanel text={empty} />;
  return (
    <div className="overflow-x-auto border border-border" style={{ background: "var(--influence-panel-bg, #111)" }}>
      <table className="min-w-full text-left text-sm">
        <thead style={{ background: "var(--influence-table-head-bg, #0a0a0a)" }}>
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-4 py-3 text-[13px] font-bold uppercase" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>
                {column.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-border">
              {columns.map((column) => (
                <td key={column} className="whitespace-nowrap px-4 py-3 text-foreground">
                  {typeof row[column] === "number" ? Number(row[column]).toLocaleString("pt-BR") : String(row[column] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Caixa de busca reutilizável
function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full max-w-xl">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
        ⌕
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-border py-3 pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary"
        style={{ fontFamily: MONO, color: "var(--influence-input-color, #f0ece4)", background: "var(--influence-input-bg, #111)" }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none text-muted-foreground transition-colors hover:text-primary"
          aria-label="Limpar busca"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

// Bloco colapsável (tabela inicialmente escondida, com botão mostrar/ocultar)
function CollapsibleSection({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="border border-border" style={{ background: "var(--influence-collapsible-bg, #0a0a0a)" }}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="text-[13px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>{title}</span>
        <span className="ml-6 shrink-0 text-[13px] font-bold" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>{open ? "▲ OCULTAR" : "▼ MOSTRAR"}</span>
      </button>
      {open ? <div className="border-t border-border p-4">{children}</div> : null}
    </div>
  );
}

async function fetchAllQ8Pages() {
  return fetchQuestion("q8", {}, { page: 1, pageSize: 3000 });
}

function getVoteCommunityGraph(q8: QuestionPayload | null): VoteCommunityGraph | null {
  const graph = q8?.chart_spec.options.vote_community_graph;
  if (!graph || typeof graph !== "object") return null;
  return graph as VoteCommunityGraph;
}

function formatDecimal(value: unknown, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function LeidenGraph({
  nodes,
  links,
  selectedDeputy,
  onSelectDeputy,
  isDark,
}: {
  nodes: RawGraphNode[];
  links: RawGraphLink[];
  selectedDeputy?: RawGraphNode | null;
  onSelectDeputy: (node: RawGraphNode | null) => void;
  isDark: boolean;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    const colorByCommunity = new Map<string, string>();
    nodes.forEach((node) => {
      const community = String(node.community ?? "");
      if (!colorByCommunity.has(community)) {
        colorByCommunity.set(community, COLORS[colorByCommunity.size % COLORS.length]);
      }
    });

    const option: echarts.EChartsOption = {
      backgroundColor: isDark ? "#080808" : "#ffffff",
      animationDuration: 900,
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: "#141414",
        borderColor: isDark ? "rgba(240,236,228,0.16)" : "rgba(0,127,255,0.22)",
        textStyle: { color: isDark ? "#f0ece4" : "#315f37", fontFamily: "JetBrains Mono", fontSize: 11 },
        formatter: (params) => {
          const data = params.data as Record<string, unknown>;
          if (params.dataType === "edge") {
            return [
              `<strong>${data.source ?? ""} -> ${data.target ?? ""}</strong>`,
              `Kappa: ${formatDecimal(data.kappa_ponderado ?? data.value)}`,
              `Concordancia ponderada: ${formatDecimal(data.concordancia_ponderada)}`,
              `Votacoes em comum: ${fmtNum(Number(data.votacoes_em_comum ?? 0))}`,
            ].join("<br/>");
          }
          return [
            `<strong>${data.nome ?? data.name ?? ""}</strong>`,
            `${data.partido ?? ""}${data.uf ? `-${data.uf}` : ""}`,
            `Comunidade: ${data.community ?? ""}`,
            `Grau ponderado: ${formatDecimal(data.grau_ponderado, 1)}`,
            `Conexoes: ${fmtNum(Number(data.qtd_conexoes ?? 0))}`,
          ].join("<br/>");
        },
      },
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          draggable: true,
          focusNodeAdjacency: true,
          edgeSymbol: ["none", "none"],
          emphasis: {
            focus: "adjacency",
            label: { show: true },
            lineStyle: { opacity: 0.72, width: 2.5 },
          },
          force: {
            repulsion: Math.max(180, Math.min(720, nodes.length * 8)),
            edgeLength: [42, 118],
            gravity: 0.08,
            friction: 0.62,
          },
          label: {
            show: nodes.length <= 45,
            color: isDark ? "#f0ece4" : "#315f37",
            fontSize: 10,
            formatter: "{b}",
          },
          edgeLabel: { show: false },
          lineStyle: {
            color: "source",
            curveness: 0.08,
            opacity: 0.2,
          },
          data: nodes.map((node) => {
            const community = String(node.community ?? "");
            const color = colorByCommunity.get(community) ?? RED;
            const isSelected = selectedDeputy?.id && selectedDeputy.id === node.id;
            return {
              ...node,
              id: String(node.id ?? ""),
              name: String(node.nome ?? node.name ?? node.id ?? ""),
              value: Number(node.grau_ponderado ?? node.qtd_conexoes ?? 0),
              symbolSize: isSelected ? Math.max(28, Number(node.symbolSize ?? 18) + 10) : Number(node.symbolSize ?? Math.max(12, Math.min(38, 10 + Number(node.grau_ponderado ?? 0) / 20))),
              itemStyle: {
                color,
                borderColor: isSelected ? (isDark ? "#f0ece4" : "#007fff") : isDark ? "rgba(240,236,228,0.28)" : "rgba(0,127,255,0.28)",
                borderWidth: isSelected ? 3 : 1,
              },
              label: { show: isSelected || nodes.length <= 45 },
            };
          }),
          links: links.map((link) => ({
            ...link,
            source: String(link.source ?? ""),
            target: String(link.target ?? ""),
            value: Number(link.value ?? link.kappa_ponderado ?? link.peso ?? 0),
            lineStyle: {
              width: Math.max(0.6, Math.min(4, Number(link.value ?? link.kappa_ponderado ?? link.peso ?? 0) * 3.2)),
            },
          })),
        },
      ],
    };

    chart.setOption(option);
    chart.on("click", (params) => {
      if (params.dataType === "node") {
        onSelectDeputy(params.data as RawGraphNode);
      }
    });
    const resize = () => chart.resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    };
  }, [isDark, links, nodes, onSelectDeputy, selectedDeputy]);

  return (
    <div className="border border-border" style={{ background: "var(--q8-graph-bg, #080808)" }}>
      <div ref={chartRef} className="h-[620px] w-full" />
    </div>
  );
}

export default function InfluenciaPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado, onNavigateRecorte }: InfluenciaPageProps) {
  const { theme } = useTheme();
  const [q8, setQ8] = useState<QuestionPayload | null>(null);
  const [q10, setQ10] = useState<QuestionPayload | null>(null);
  const [years, setYears] = useState<FilterChoice[]>([]);
  const [q10Year, setQ10Year] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q8RowsShown, setQ8RowsShown] = useState(12);
  const [q8SelectedCommunity, setQ8SelectedCommunity] = useState("");
  const [methQ8Open, setMethQ8Open] = useState(false);
  const [methQ10Open, setMethQ10Open] = useState(false);
  const [q8GraphTopLimit, setQ8GraphTopLimit] = useState(80);
  const [selectedDeputy, setSelectedDeputy] = useState<RawGraphNode | null>(null);
  // filtros de busca e visibilidade das tabelas
  const [q8DepSearch, setQ8DepSearch] = useState("");
  const [q10PartySearch, setQ10PartySearch] = useState("");
  const [q8TableOpen, setQ8TableOpen] = useState(false);
  const [q10TableOpen, setQ10TableOpen] = useState(false);
  const [q10AnnualOpen, setQ10AnnualOpen] = useState(false);
  const [q10RobustMode, setQ10RobustMode] = useState(false);
  const isDark = theme === "dark";
  const q8LightVars = (!isDark
    ? {
        "--muted-foreground": "#0069ff",
        "--foreground": "#315f37",
        "--primary": "#007fff",
        "--primary-rgb": "0, 127, 255",
        "--border": "#d9e4f2",
        "--q8-graph-bg": "#ffffff",
        "--influence-heading-color": "#315f37",
        "--influence-input-color": "#315f37",
        "--influence-input-bg": "#ffffff",
        "--influence-collapsible-bg": "#ffffff",
        "--influence-panel-bg": "#ffffff",
        "--influence-table-head-bg": "#eef6ff",
      }
    : {}) as CSSProperties;
  const q8PanelStyle = {
    background: isDark
      ? "#111"
      : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,249,255,0.96) 100%)",
    borderColor: isDark ? undefined : "#d9e4f2",
    boxShadow: isDark ? undefined : "0 18px 48px rgba(15, 23, 42, 0.08)",
  } as CSSProperties;
  const q8SoftGridStyle = {
    background: isDark ? "rgba(240,236,228,0.06)" : "rgba(0, 127, 255, 0.08)",
    borderColor: isDark ? undefined : "#d9e4f2",
  } as CSSProperties;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetchMeta(),
      fetchAllQ8Pages(),
      fetchQuestion("q10", {}, { page: 1, pageSize: 100, sortBy: "pct_alinhamento" }),
    ])
      .then(([meta, q8Payload, q10Payload]) => {
        if (!mounted) return;
        setYears(meta.available_filters.anos ?? []);
        setQ8(q8Payload);
        setQ10(q10Payload);
      })
      .catch(() => {
        if (mounted) setError("Nao foi possivel carregar os dados do backend.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const q8Summary = q8?.summary_cards ?? [];
  const q8FullRanking = useMemo(() => {
    const complete = q8?.complement_tables.find((table) => table.title.toLowerCase().includes("ranking completo"));
    return ((complete?.rows?.length ? complete.rows : q8?.table_spec.rows) ?? []) as Row[];
  }, [q8]);
  const q8Communities = useMemo(() => (
    (q8?.complement_tables.find((table) => table.title.toLowerCase().includes("comunidades de comportamento"))?.rows ?? []) as Row[]
  ), [q8]);
  const voteGraph = useMemo(() => getVoteCommunityGraph(q8), [q8]);

  const q10AnnualRows = useMemo(() => (
    ((q10?.complement_tables.find((table) => table.title.toLowerCase().includes("por ano"))?.rows ?? []) as Row[])
      .filter((row) => !q10Year || text(row, "ano_dados") === q10Year)
  ), [q10, q10Year]);
  const q10Rows = useMemo(() => {
    if (!q10Year) return (q10?.table_spec.rows ?? []) as Row[];
    return q10AnnualRows.map((row, index) => ({ posicao: index + 1, ...row }));
  }, [q10, q10AnnualRows, q10Year]);
  const q10Top = q10Rows.slice(0, 12);
  const q10VoteTotalKey = q10Year ? "total_votos" : "total_votos_com_diretriz";
  const q10Columns = q10Year
    ? ["posicao", "ano_dados", "sigla_partido", "ideologia", "total_votos", "votos_alinhados", "pct_alinhamento"]
    : ["posicao", "sigla_partido", "ideologia", "qtd_deputados", "total_votos_com_diretriz", "votos_alinhados", "votos_contrarios", "pct_alinhamento"];

  // ── Seção 8: ranking com posição + busca por deputado ──
  const q8Ranked = useMemo(() => q8FullRanking.map((row, index) => ({ row, rank: index + 1 })), [q8FullRanking]);
  const q8FilteredRanked = useMemo(() => {
    const q = normalizeText(q8DepSearch);
    if (!q) return q8Ranked;
    return q8Ranked.filter(({ row }) => normalizeText(text(row, "nome")).includes(q));
  }, [q8Ranked, q8DepSearch]);
  const q8SearchActive = q8DepSearch.trim() !== "";
  const q8VisibleRanked = q8SearchActive ? q8FilteredRanked : q8FilteredRanked.slice(0, q8RowsShown);

  // ── Seção 10: filtragem robusta e scatter ──
  const q10RobustRows = useMemo(() =>
    q10Rows.filter((row) => {
      const votes = raw(row, q10VoteTotalKey);
      const deps  = raw(row, "qtd_deputados");
      return votes >= ROBUST_MIN_VOTES && (q10Year ? true : deps >= ROBUST_MIN_DEPS);
    })
  , [q10Rows, q10VoteTotalKey, q10Year]);

  const q10ActiveRows = q10RobustMode ? q10RobustRows : q10Rows;

  const q10PartyActive = q10PartySearch.trim() !== "";
  const q10FilteredRows = useMemo(() => {
    const q = normalizeText(q10PartySearch);
    if (!q) return q10ActiveRows;
    return q10ActiveRows.filter((row) => normalizeText(text(row, "sigla_partido")).includes(q));
  }, [q10ActiveRows, q10PartySearch]);
  const q10AnnualFiltered = useMemo(() => {
    const q = normalizeText(q10PartySearch);
    if (!q) return q10AnnualRows.slice(0, 40);
    return q10AnnualRows.filter((row) => normalizeText(text(row, "sigla_partido")).includes(q));
  }, [q10AnnualRows, q10PartySearch]);

  type Q10Point = { x: number; yLog: number; y: number; sigla: string; ideologia: string; pct: number; votos: number; deps: number; alinhados: number; contrarios: number };
  const q10ScatterData = useMemo((): Q10Point[] =>
    q10ActiveRows.map((row) => ({
      x:         raw(row, "pct_alinhamento"),
      yLog:      Math.log10(Math.max(raw(row, q10VoteTotalKey), 1)),
      y:         raw(row, q10VoteTotalKey),
      sigla:     text(row, "sigla_partido"),
      ideologia: text(row, "ideologia") || "nao classificado",
      pct:       raw(row, "pct_alinhamento"),
      votos:     raw(row, q10VoteTotalKey),
      deps:      raw(row, "qtd_deputados"),
      alinhados: raw(row, "votos_alinhados"),
      contrarios:raw(row, "votos_contrarios"),
    }))
  , [q10ActiveRows, q10VoteTotalKey]);

  const q10ByIdeology = useMemo((): Record<string, Q10Point[]> => {
    const groups: Record<string, Q10Point[]> = {};
    for (const d of q10ScatterData) {
      if (!groups[d.ideologia]) groups[d.ideologia] = [];
      groups[d.ideologia].push(d);
    }
    return groups;
  }, [q10ScatterData]);

  const communityNodes = useMemo(() => q8Communities.map((row, index) => ({
    id: text(row, "comunidade"),
    name: `Grupo ${text(row, "comunidade")}`,
    color: COLORS[index % COLORS.length],
    deputies: raw(row, "qtd_deputados"),
    kappa: raw(row, "kappa_medio_interno") || raw(row, "similaridade_media_interna"),
    degree: raw(row, "grau_ponderado_medio"),
    parties: text(row, "partidos_presentes"),
    examples: text(row, "deputados_exemplo"),
  })), [q8Communities]);

  const graphCommunities = useMemo(() => {
    if (communityNodes.length) return communityNodes;
    return (voteGraph?.communities ?? []).map((community, index) => ({
      id: String(community.id ?? community.comunidade ?? ""),
      name: String(community.label ?? `Grupo ${community.id ?? community.comunidade ?? ""}`),
      color: COLORS[index % COLORS.length],
      deputies: Number(community.qtd_deputados ?? 0),
      kappa: Number(community.kappa_medio_interno ?? community.similaridade_media_interna ?? 0),
      degree: Number(community.grau_ponderado_medio ?? 0),
      parties: "",
      examples: "",
    })).filter((community) => community.id);
  }, [communityNodes, voteGraph]);

  useEffect(() => {
    if (!q8SelectedCommunity && graphCommunities.length) {
      setQ8SelectedCommunity(graphCommunities[0].id);
    }
  }, [graphCommunities, q8SelectedCommunity]);

  useEffect(() => {
    if (voteGraph?.default_top) {
      setQ8GraphTopLimit(Number(voteGraph.default_top));
    }
  }, [voteGraph]);

  const q8GraphTopOptions = useMemo(() => {
    const options = voteGraph?.top_options?.length ? voteGraph.top_options : [40, 80, 120];
    return Array.from(new Set(options.map((option) => Number(option)).filter(Boolean))).sort((a, b) => a - b);
  }, [voteGraph]);

  const selectedCommunityMeta = graphCommunities.find((community) => community.id === q8SelectedCommunity) ?? graphCommunities[0];
  const visibleLeidenNodes = useMemo(() => {
    const nodes = voteGraph?.nodes ?? [];
    return nodes
      .filter((node) => String(node.community ?? "") === (q8SelectedCommunity || selectedCommunityMeta?.id))
      .sort((a, b) => Number(b.grau_ponderado ?? 0) - Number(a.grau_ponderado ?? 0))
      .slice(0, q8GraphTopLimit);
  }, [q8GraphTopLimit, q8SelectedCommunity, selectedCommunityMeta, voteGraph]);

  const visibleLeidenLinks = useMemo(() => {
    const visibleIds = new Set(visibleLeidenNodes.map((node) => String(node.id ?? "")));
    return (voteGraph?.links ?? [])
      .filter((link) => visibleIds.has(String(link.source ?? "")) && visibleIds.has(String(link.target ?? "")))
      .sort((a, b) => Number(b.value ?? b.kappa_ponderado ?? b.peso ?? 0) - Number(a.value ?? a.kappa_ponderado ?? a.peso ?? 0));
  }, [visibleLeidenNodes, voteGraph]);

  const leidenSynthesis = useMemo(() => {
    const nodes = voteGraph?.nodes ?? [];
    const blocks = graphCommunities.map((community) => {
      const members = nodes
        .filter((node) => String(node.community ?? "") === community.id)
        .sort((a, b) => Number(b.grau_ponderado ?? 0) - Number(a.grau_ponderado ?? 0));
      const anchors = members.slice(0, 3).map((node) => ({
        nome: String(node.nome ?? node.name ?? node.id ?? ""),
        partido: String(node.partido ?? node.sigla_partido ?? ""),
        uf: String(node.uf ?? node.sigla_uf ?? ""),
      }));
      const partyCount = community.parties
        ? community.parties.split(",").map((part) => part.trim()).filter(Boolean).length
        : 0;
      return { ...community, anchors, partyCount };
    });

    const totalDeputies = blocks.reduce((sum, block) => sum + block.deputies, 0);
    if (!blocks.length) return { blocks: [] as Array<(typeof blocks)[number] & { selo: string; pct: number }>, totalDeputies: 0 };

    const maxDeputies = Math.max(...blocks.map((block) => block.deputies));
    const maxKappa = Math.max(...blocks.map((block) => block.kappa));
    const minDegree = Math.min(...blocks.map((block) => block.degree));

    return {
      totalDeputies,
      blocks: blocks.map((block) => {
        let selo = "";
        if (block.kappa === maxKappa) selo = "O MAIS UNIDO";
        else if (block.degree === minDegree) selo = "O MAIS SOLTO";
        else if (block.deputies === maxDeputies) selo = "O MAIOR";
        return {
          ...block,
          selo,
          pct: totalDeputies ? Math.round((block.deputies / totalDeputies) * 100) : 0,
        };
      }),
    };
  }, [graphCommunities, voteGraph]);

  const q8BridgeDeputies = useMemo(() => {
    return (voteGraph?.nodes ?? [])
      .map((node) => ({
        id: String(node.id ?? node.id_deputado ?? node.nome ?? node.name ?? ""),
        nome: String(node.nome ?? node.name ?? node.id ?? ""),
        partido: String(node.partido ?? node.sigla_partido ?? ""),
        uf: String(node.uf ?? node.sigla_uf ?? ""),
        community: String(node.community ?? ""),
        grau: Number(node.grau_ponderado ?? 0),
        conexoes: Number(node.qtd_conexoes ?? 0),
      }))
      .filter((node) => node.id && node.nome)
      .sort((a, b) => b.grau - a.grau)
      .slice(0, 15);
  }, [voteGraph]);

  const q8MostMixedBlocks = useMemo(() => {
    return leidenSynthesis.blocks
      .filter((block) => block.partyCount > 0)
      .sort((a, b) => b.partyCount - a.partyCount)
      .slice(0, 3);
  }, [leidenSynthesis]);

  type InfluenciaSection = "influencia" | "voto-revelou" | "ranking" | "disciplina" | "metodologia";
  const [activeSection, setActiveSection] = useState<InfluenciaSection>("influencia");
  const RED = "#e00836";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateRecorte={onNavigateRecorte} />
        <div className="flex h-[60vh] items-center justify-center text-xs text-muted-foreground" style={{ fontFamily: MONO }}>CARREGANDO DADOS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateRecorte={onNavigateRecorte} />

      <PageHero
        n="6"
        tag="INFLUENCIA"
        title="Influencia"
        titleRed="grupos e partidos"
        desc="Comunidades de comportamento de voto da Q8 e disciplina partidaria da Q10 em uma leitura integrada: quem vota junto, quais grupos emergem e qual partido consegue alinhar melhor sua bancada."
        imgId="/fundorecortes/recorte6/questao6.png"
      />

      {error ? (
        <section className="px-6 py-10 md:px-14">
          <EmptyPanel text={error} />
        </section>
      ) : null}

      {/* ── NAV DE SEÇÕES ── */}
      <div
        className="sticky top-[56px] z-30 flex flex-wrap gap-3 border-b px-6 py-3 md:px-14"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        <button type="button" onClick={() => setActiveSection("influencia")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "influencia" ? RED : "transparent", color: activeSection === "influencia" ? "#fff" : "var(--foreground)", borderColor: activeSection === "influencia" ? RED : "var(--border)" }}>
          Influência
        </button>
        <button type="button" onClick={() => setActiveSection("voto-revelou")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "voto-revelou" ? RED : "transparent", color: activeSection === "voto-revelou" ? "#fff" : "var(--foreground)", borderColor: activeSection === "voto-revelou" ? RED : "var(--border)" }}>
          O que o voto revelou
        </button>
        <button type="button" onClick={() => setActiveSection("ranking")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "ranking" ? RED : "transparent", color: activeSection === "ranking" ? "#fff" : "var(--foreground)", borderColor: activeSection === "ranking" ? RED : "var(--border)" }}>
          Ranking
        </button>
        <button type="button" onClick={() => setActiveSection("disciplina")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "disciplina" ? RED : "transparent", color: activeSection === "disciplina" ? "#fff" : "var(--foreground)", borderColor: activeSection === "disciplina" ? RED : "var(--border)" }}>
          Disciplina
        </button>
        <button type="button" onClick={() => setActiveSection("metodologia")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "metodologia" ? RED : "transparent", color: activeSection === "metodologia" ? "#fff" : "var(--foreground)", borderColor: activeSection === "metodologia" ? RED : "var(--border)" }}>
          Metodologia
        </button>
      </div>

      {activeSection === "influencia" && (
      <section
        className="border-b border-border px-6 py-14 md:px-14"
        style={{
          ...q8LightVars,
          background: isDark
            ? undefined
            : "linear-gradient(180deg, #ffffff 0%, #f7fbff 46%, #ffffff 100%)",
        }}
      >
        <SectionHeader
          n="06A"
          tag="COMUNIDADES"
          title="Como os grupos se influenciam?"
          desc="A Q8 complementar detecta comunidades de comportamento a partir de votos comparaveis. Cada grupo abaixo representa deputados com padrao de voto parecido."
        />

        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-4" style={q8SoftGridStyle}>
          {q8Summary.slice(0, 4).map((card) => (
            <StatCard key={card.id} label={card.label.toUpperCase()} value={card.value} unit={card.unit ?? undefined} />
          ))}
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: "var(--foreground)" }}>GRAFO LEIDEN INTERATIVO</p>
              <div className="flex flex-wrap gap-2">
                {q8GraphTopOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setQ8GraphTopLimit(option);
                      setSelectedDeputy(null);
                    }}
                    className="border px-3 py-1.5 text-xs font-bold"
                    style={{
                      fontFamily: MONO,
                      borderColor: q8GraphTopLimit === option ? (isDark ? RED : "#007fff") : isDark ? "rgba(240,236,228,0.12)" : "#d9e4f2",
                      color: q8GraphTopLimit === option ? (isDark ? RED : "#007fff") : "var(--muted-foreground)",
                      background: q8GraphTopLimit === option && !isDark ? "rgba(0,127,255,0.08)" : "transparent",
                    }}
                  >
                    TOP {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {graphCommunities.map((community) => (
                <button
                  key={community.id}
                  type="button"
                  onClick={() => {
                    setQ8SelectedCommunity(community.id);
                    setSelectedDeputy(null);
                  }}
                  className="border px-3 py-2 text-left text-xs font-bold"
                  style={{
                    fontFamily: MONO,
                    borderColor: q8SelectedCommunity === community.id ? community.color : isDark ? "rgba(240,236,228,0.12)" : "#d9e4f2",
                    color: q8SelectedCommunity === community.id ? community.color : "var(--muted-foreground)",
                    background: q8SelectedCommunity === community.id ? `${community.color}18` : isDark ? "transparent" : "#ffffff",
                  }}
                >
                  {community.name.toUpperCase()} · {fmtNum(community.deputies)}
                </button>
              ))}
            </div>

            {visibleLeidenNodes.length ? (
              <LeidenGraph
                nodes={visibleLeidenNodes}
                links={visibleLeidenLinks}
                selectedDeputy={selectedDeputy}
                onSelectDeputy={setSelectedDeputy}
                isDark={isDark}
              />
            ) : (
              <EmptyPanel text="Sem nos para a comunidade selecionada." />
            )}
          </div>

          <div className="grid content-start gap-3">
            {selectedCommunityMeta ? (
              <div className="border border-border p-5" style={{ ...q8PanelStyle, borderLeft: `3px solid ${selectedCommunityMeta.color}` }}>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black" style={{ fontFamily: SERIF, color: isDark ? "#f0ece4" : "#315f37" }}>{selectedCommunityMeta.name}</h3>
                    <p className="mt-1 text-[13px] font-semibold" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>
                      kappa medio {selectedCommunityMeta.kappa.toFixed(3)} · grau ponderado {selectedCommunityMeta.degree.toFixed(1)}
                    </p>
                  </div>
                  <span className="text-2xl font-black" style={{ fontFamily: SERIF, color: selectedCommunityMeta.color }}>{fmtNum(selectedCommunityMeta.deputies)}</span>
                </div>
                <div className="grid grid-cols-2 gap-px border border-border" style={q8SoftGridStyle}>
                  <StatCard label="NOS VISIVEIS" value={fmtNum(visibleLeidenNodes.length)} />
                  <StatCard label="ARESTAS" value={fmtNum(visibleLeidenLinks.length)} />
                </div>
                {selectedCommunityMeta.parties ? (
                  <>
                    <p className="mb-2 mt-4 text-[13px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>PARTIDOS PRESENTES</p>
                    <p className="text-xs leading-relaxed text-foreground">{selectedCommunityMeta.parties}</p>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="border border-border p-5" style={q8PanelStyle}>
              <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: "var(--foreground)" }}>DEPUTADO SELECIONADO</p>
              {selectedDeputy ? (
                <div>
                  <h3 className="text-2xl font-black" style={{ fontFamily: SERIF, color: isDark ? "#f0ece4" : "#315f37" }}>
                    {String(selectedDeputy.nome ?? selectedDeputy.name ?? selectedDeputy.id)}
                  </h3>
                  <p className="mt-1 text-[13px] font-semibold" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>
                    {String(selectedDeputy.partido ?? selectedDeputy.sigla_partido ?? "")}
                    {selectedDeputy.uf || selectedDeputy.sigla_uf ? `-${String(selectedDeputy.uf ?? selectedDeputy.sigla_uf)}` : ""}
                    {" · "}
                    comunidade {String(selectedDeputy.community ?? "")}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-px border border-border" style={q8SoftGridStyle}>
                    <StatCard label="GRAU" value={formatDecimal(selectedDeputy.grau_ponderado, 1)} />
                    <StatCard label="CONEXOES" value={fmtNum(Number(selectedDeputy.qtd_conexoes ?? 0))} />
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Clique em um ponto do grafo ou passe o mouse sobre ele para ver o nome do deputado, partido, UF e grau ponderado.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid gap-5">
            <div className="border border-border p-6" style={{ ...q8PanelStyle, borderLeft: `4px solid ${RED}` }}>
              <p className="mb-3 text-[13px] font-black uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: RED }}>RESUMO DO MAPA</p>
              <h3 className="text-2xl font-black leading-tight md:text-3xl" style={{ fontFamily: SERIF, color: isDark ? "#f0ece4" : "#315f37" }}>
                {fmtNum(leidenSynthesis.totalDeputies || (voteGraph?.nodes?.length ?? 0))} deputados em {fmtNum(leidenSynthesis.blocks.length || graphCommunities.length)} blocos de voto.
              </h3>
              <p className="mt-4 text-sm font-medium leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.9 }}>
                Esses grupos nao foram montados por partido, UF ou ideologia declarada. Eles aparecem quando deputados votam de forma parecida em votacoes que realmente dividiram o plenario.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-px border border-border" style={q8SoftGridStyle}>
                <StatCard label="NOS DO GRAFO" value={fmtNum(voteGraph?.nodes?.length ?? 0)} />
                <StatCard label="ARESTAS FORTES" value={fmtNum(voteGraph?.links?.length ?? 0)} />
              </div>
            </div>

            <div className="border border-border p-6" style={q8PanelStyle}>
              <p className="mb-3 text-[13px] font-black uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: RED }}>PARTIDO FORMAL X VOTO REAL</p>
              <p className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.9 }}>
                O partido mostra a organizacao formal da Camara. O grafo mostra o comportamento real em votacao. Quando uma comunidade mistura muitos partidos, ela indica uma coalizao pratica que atravessa legendas; quando mistura poucos, sugere um bloco mais fechado ou disciplinado.
              </p>
              {q8MostMixedBlocks.length ? (
                <div className="mt-5 space-y-3">
                  {q8MostMixedBlocks.map((block) => (
                    <div key={block.id} className="border border-border p-4" style={{ background: isDark ? "#0d0d0d" : "#ffffff", borderLeft: `3px solid ${block.color}` }}>
                      <div className="flex items-center justify-between gap-4">
                        <strong className="text-sm font-black" style={{ fontFamily: SERIF, color: isDark ? "#f0ece4" : "#315f37" }}>{block.name}</strong>
                        <span className="text-xs font-black" style={{ fontFamily: MONO, color: block.color }}>{fmtNum(block.partyCount)} partidos</span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-relaxed" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.94 }}>
                        {block.parties}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border border-border p-6" style={q8PanelStyle}>
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-[13px] font-black uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: RED }}>DEPUTADOS-PONTE</p>
                <h3 className="text-2xl font-black leading-tight" style={{ fontFamily: SERIF, color: isDark ? "#f0ece4" : "#315f37" }}>
                  15 maiores graus ponderados
                </h3>
              </div>
              <p className="max-w-md text-sm font-semibold leading-relaxed" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.95 }}>
                Grau ponderado alto indica muitas conexoes fortes no padrao de voto. Nao e cargo formal: e centralidade comportamental no grafo.
              </p>
            </div>

            {q8BridgeDeputies.length ? (
              <div className="overflow-x-auto border border-border">
                <table className="min-w-full text-left text-xs" style={{ fontFamily: MONO }}>
                  <thead style={{ background: isDark ? "#0a0a0a" : "#eef6ff" }}>
                    <tr>
                      {["#", "Deputado", "Comunidade", "Grau", "Conexoes"].map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 font-black uppercase tracking-[0.12em]" style={{ color: "var(--foreground)" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {q8BridgeDeputies.map((dep, index) => (
                      <tr key={dep.id} className="border-t border-border">
                        <td className="px-4 py-3 font-black" style={{ color: RED }}>{String(index + 1).padStart(2, "0")}</td>
                        <td className="px-4 py-3">
                          <strong className="block text-sm" style={{ color: "var(--foreground)", fontFamily: SERIF }}>{dep.nome}</strong>
                          <span className="text-[11px] font-bold uppercase" style={{ color: "var(--foreground)", opacity: 0.68 }}>
                            {dep.partido}{dep.uf ? `-${dep.uf}` : ""}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-bold" style={{ color: "var(--foreground)", opacity: 0.82 }}>{dep.community}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-black" style={{ color: RED }}>{formatDecimal(dep.grau, 1)}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-bold" style={{ color: "var(--foreground)", opacity: 0.88 }}>{fmtNum(dep.conexoes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyPanel text="Sem dados de centralidade para listar deputados-ponte." />
            )}
          </div>
        </div>
      </section>
      )}

      {activeSection === "voto-revelou" && (
      <section
        className="border-b border-border px-6 py-16 md:px-14"
        style={{
          ...q8LightVars,
          background: isDark
            ? "radial-gradient(circle at 12% 0%, rgba(196,18,48,0.12), transparent 46%), #0b0a0c"
            : "radial-gradient(circle at 12% 0%, rgba(0,127,255,0.10), transparent 42%), linear-gradient(180deg, #ffffff 0%, #f7fbff 48%, #ffffff 100%)",
        }}
      >
        <SectionHeader
          n="06B"
          tag="SINTESE · DESCOBERTAS"
          title="O que o voto revelou"
          desc="Resumo das principais descobertas do algoritmo Leiden: como os deputados se dividem em blocos de comportamento e o que esses grupos dizem sobre a relacao entre voto e partido."
        />

        {leidenSynthesis.blocks.length ? (
          <>
            <p
              className="mb-10 max-w-4xl text-2xl font-black leading-tight md:text-3xl"
              style={{ fontFamily: SERIF, color: isDark ? "#f0ece4" : "#315f37" }}
            >
              {fmtNum(leidenSynthesis.totalDeputies)} deputados se dividiram em{" "}
              <span style={{ color: isDark ? RED : "#007fff" }}>{leidenSynthesis.blocks.length} blocos de comportamento</span>
              {" "}— e eles ignoram a fronteira partidaria.
            </p>

            <div className="mb-12 grid gap-px border border-border lg:grid-cols-3" style={q8SoftGridStyle}>
              {leidenSynthesis.blocks.map((block) => (
                <div key={block.id} className="p-6" style={{ ...q8PanelStyle, borderTop: `3px solid ${block.color}` }}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black" style={{ fontFamily: SERIF, color: isDark ? "#f0ece4" : "#315f37" }}>{block.name}</h3>
                      {block.selo ? (
                        <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-bold tracking-[0.18em]" style={{ fontFamily: MONO, color: block.color, background: `${block.color}1f` }}>
                          {block.selo}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black leading-none" style={{ fontFamily: SERIF, color: block.color }}>{fmtNum(block.deputies)}</p>
                      <p className="text-[11px] text-muted-foreground" style={{ fontFamily: MONO }}>{block.pct}% DO TOTAL</p>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-px border border-border" style={q8SoftGridStyle}>
                    <div className="bg-background px-4 py-3">
                      <p className="text-[10px] tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>COESAO (κ)</p>
                      <p className="text-lg font-black text-primary" style={{ fontFamily: SERIF }}>{block.kappa.toFixed(3)}</p>
                    </div>
                    <div className="bg-background px-4 py-3">
                      <p className="text-[10px] tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>DENSIDADE</p>
                      <p className="text-lg font-black text-primary" style={{ fontFamily: SERIF }}>{block.degree.toFixed(1)}</p>
                    </div>
                  </div>

                  {block.anchors.length ? (
                    <>
                      <p className="mb-2 text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: isDark ? "rgba(240,236,228,0.9)" : "#222" }}>DEPUTADOS-ANCORA</p>
                      <ul className="space-y-1.5">
                        {block.anchors.map((anchor) => (
                          <li key={anchor.nome} className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                            {anchor.nome}
                            {anchor.partido ? <span className="font-medium" style={{ color: isDark ? "rgba(240,236,228,0.78)" : "#444" }}> · {anchor.partido}{anchor.uf ? `-${anchor.uf}` : ""}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {block.partyCount ? (
                    <p className="mt-4 text-sm font-bold" style={{ fontFamily: MONO, color: isDark ? "rgba(240,236,228,0.88)" : "#222" }}>{block.partyCount} PARTIDOS PRESENTES</p>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="grid gap-px border border-border lg:grid-cols-3" style={q8SoftGridStyle}>
          {LEIDEN_FINDINGS.map((finding) => (
            <div key={finding.n} className="flex flex-col bg-background p-6" style={isDark ? undefined : q8PanelStyle}>
              <span className="mb-3 text-3xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.3)" }}>{finding.n}</span>
              <h4 className="mb-3 text-lg font-black leading-tight" style={{ fontFamily: SERIF, color: isDark ? "#f0ece4" : "#315f37" }}>{finding.title}</h4>
              <p className="text-sm font-medium leading-relaxed" style={{ color: isDark ? "rgba(240,236,228,0.9)" : "#222" }}>{finding.body}</p>
              {finding.chips.length ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: isDark ? "rgba(240,236,228,0.82)" : "#444" }}>{finding.chipsLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {finding.chips.map((chip) => (
                      <span key={chip} className="border px-2 py-0.5 text-[10px] font-bold" style={{ fontFamily: MONO, borderColor: isDark ? "rgba(196,18,48,0.35)" : "rgba(0,127,255,0.35)", color: isDark ? "#f0ece4" : "#007fff" }}>{chip}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
      )}

      {activeSection === "ranking" && (
      <section
        className="border-b border-border px-6 py-14 md:px-14"
        style={{
          ...q8LightVars,
          background: isDark ? undefined : "linear-gradient(180deg, #ffffff 0%, #f7fbff 48%, #ffffff 100%)",
        }}
      >
        <SectionHeader
          n="06C"
          tag="RANKING ORIGINAL"
          title="Deputados com maior participacao nas proposicoes aprovadas"
          desc="Tabela baseada na resposta original da Q8. Ela mostra autoria, aprovacao e participacao no total global aprovado."
        />

        <div className="mb-6" style={{ height: Math.max(420, q8FullRanking.slice(0, 15).length * 38) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={q8FullRanking.slice(0, 15)}
              layout="vertical"
              margin={{ left: 8, right: 64, top: 4, bottom: 4 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="nome"
                width={148}
                tick={{ fill: isDark ? "#e8e4dc" : "#111111", fontSize: 13, fontFamily: MONO, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={false}
                contentStyle={{ background: isDark ? "#141414" : "#fff", border: `1px solid ${isDark ? "rgba(240,236,228,0.12)" : "#d9e4f2"}`, fontFamily: MONO, fontSize: 11 }}
                formatter={(value: number, _name: string, props: { payload: Row }) => [
                  `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%  ·  ${fmtNum(raw(props.payload, "proposicoes_aprovadas"))} aprovadas de ${fmtNum(raw(props.payload, "proposicoes_autoria"))} autorais`,
                  "% aprovadas",
                ]}
              />
              <Bar
                dataKey="pct_aprovadas"
                maxBarSize={3}
                shape={(props: { x?: number; y?: number; width?: number; height?: number; value?: number; index?: number }) => {
                  const { x = 0, y = 0, width = 0, height = 0, value = 0, index = 0 } = props;
                  const cy = y + height / 2;
                  const x1 = x;
                  const x2 = x + width;
                  const isTop3 = index < 3;
                  const dotR = isTop3 ? 7 : 5;
                  const lineColor = index === 0 ? RED : isDark ? "rgba(240,236,228,0.35)" : "rgba(0,0,0,0.18)";
                  const dotColor = index === 0 ? RED : isDark ? "rgba(240,236,228,0.7)" : "#444";
                  const labelColor = isDark ? "#e8e4dc" : "#111";
                  return (
                    <g>
                      <line x1={x1} y1={cy} x2={x2 - dotR} y2={cy} stroke={lineColor} strokeWidth={isTop3 ? 2 : 1.5} />
                      <circle cx={x2} cy={cy} r={dotR} fill={dotColor} />
                      <text x={x2 + dotR + 5} y={cy + 4} fontSize={isTop3 ? 11 : 10} fontFamily={MONO} fontWeight={isTop3 ? "700" : "400"} fill={labelColor} style={{ userSelect: "none" }}>
                        {value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </text>
                    </g>
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filtro: pesquisar deputado pelo nome */}
        <div className="mb-4">
          <SearchInput value={q8DepSearch} onChange={setQ8DepSearch} placeholder="Pesquisar deputado pelo nome..." />
        </div>

        {/* Tabela de deputados — inicialmente escondida (abre ao mostrar ou ao pesquisar) */}
        <CollapsibleSection
          title={`TABELA DE DEPUTADOS · ${fmtNum(q8FilteredRanked.length)} ${q8SearchActive ? "ENCONTRADOS" : "NO RANKING"}`}
          open={q8TableOpen || q8SearchActive}
          onToggle={() => setQ8TableOpen((v) => !v)}
        >
          <div className="overflow-x-auto" style={{ maxHeight: 520, overflowY: "auto" }}>
            <table className="min-w-full text-left text-sm">
              <thead style={{ background: isDark ? "#0a0a0a" : "#eef6ff", position: "sticky", top: 0, zIndex: 1 }}>
                <tr>
                  {["#", "Foto", "Deputado", "Autoria", "Aprovadas", "% Aprovadas"].map((col) => (
                    <th key={col} className="whitespace-nowrap px-4 py-3 text-[13px] font-bold uppercase" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q8VisibleRanked.map(({ row, rank }) => {
                  const id = text(row, "id_deputado");
                  const isFirst = rank === 1;
                  return (
                    <tr key={id || rank} className="border-t border-border hover:bg-white/[0.03]">
                      <td className="px-4 py-2 font-bold" style={{ fontFamily: SERIF, color: isFirst ? (isDark ? RED : "#007fff") : isDark ? "rgba(240,236,228,0.4)" : "#0069ff" }}>
                        {String(rank).padStart(2, "0")}
                      </td>
                      <td className="px-2 py-1">
                        <img
                          src={depPhoto(id)}
                          alt=""
                          className="h-10 w-8 object-cover object-top"
                          style={{ filter: "grayscale(40%) contrast(1.05)" }}
                          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium" style={{ color: isDark ? "#f0ece4" : "#315f37", fontFamily: SERIF }}>{text(row, "nome")}</td>
                      <td className="px-4 py-2 text-muted-foreground">{fmtNum(raw(row, "proposicoes_autoria"))}</td>
                      <td className="px-4 py-2 text-muted-foreground">{fmtNum(raw(row, "proposicoes_aprovadas"))}</td>
                      <td className="px-4 py-2 font-bold" style={{ color: isFirst ? (isDark ? RED : "#007fff") : isDark ? "#f0ece4" : "#315f37" }}>{fmtPct(raw(row, "pct_aprovadas"))}</td>
                    </tr>
                  );
                })}
                {q8VisibleRanked.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {q8SearchActive ? `NENHUM DEPUTADO ENCONTRADO PARA "${q8DepSearch.trim().toUpperCase()}".` : "Sem linhas da Q8."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {!q8SearchActive && q8RowsShown < q8FullRanking.length ? (
            <button
              type="button"
              onClick={() => setQ8RowsShown((value) => value + 20)}
              className="mt-4 border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              style={{ fontFamily: MONO }}
            >
              CARREGAR MAIS LINHAS
            </button>
          ) : null}
        </CollapsibleSection>

      </section>
      )}

      {activeSection === "disciplina" && (
      <section
        className="px-6 py-14 md:px-14"
        style={{
          ...q8LightVars,
          background: isDark
            ? "#0e0e0e"
            : "linear-gradient(180deg, #ffffff 0%, #f7fbff 50%, #ffffff 100%)",
        }}
      >
        <SectionHeader
          n="06D"
          tag="DISCIPLINA PARTIDARIA"
          title="Qual partido mantém sua bancada mais alinhada?"
          desc="Alinhamento = votos seguindo a orientação do partido ÷ total de votos com diretriz registrada. Atenção: mede obediência ao partido, não causalidade."
        />

        {/* ── Caixa de explicação das mudanças ── */}
        <div className="mb-10 border-l-4 border-primary" style={{ borderColor: RED }}>
          <div className="px-5 py-5" style={{ background: isDark ? "rgba(196,18,48,0.07)" : "rgba(196,18,48,0.04)" }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em]" style={{ fontFamily: MONO, color: RED }}>O QUE MEDIMOS E O QUE MUDOU NESTA SEÇÃO</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.7 }}>O QUE O DADO MEDE</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.88 }}>
                  O percentual de alinhamento mostra com que frequência os deputados de um partido votaram de acordo com a orientação oficial da bancada. <strong>Não é prova de persuasão ou convencimento</strong> — pode ser disciplina interna, pressão partidária, acordo político ou simples coincidência ideológica.
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.7 }}>POR QUE O RANKING BRUTO ENGANA</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.88 }}>
                  Um partido com 1 deputado e 49 votos pode atingir 100% facilmente. Um partido com 50 mil votos dificilmente passa de 99%. Comparar os dois diretamente é injusto. O modo <strong>Amostra Robusta</strong> abaixo resolve isso filtrando apenas partidos com ≥ {ROBUST_MIN_VOTES} votos com diretriz {!q10Year ? `e ≥ ${ROBUST_MIN_DEPS} deputados` : ""}.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="border px-3 py-2.5" style={{ borderColor: "rgba(196,18,48,0.25)", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: RED }}>① NOVO GRÁFICO</p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.96 }}>Diagrama de dispersão: eixo X = alinhamento (%), eixo Y = volume da amostra. Você vê confiabilidade e disciplina ao mesmo tempo.</p>
              </div>
              <div className="border px-3 py-2.5" style={{ borderColor: "rgba(196,18,48,0.25)", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: RED }}>② MODO ROBUSTO</p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.96 }}>Toggle abaixo filtra apenas partidos com amostra suficiente, tornando o topo do ranking comparável e estatisticamente confiável.</p>
              </div>
              <div className="border px-3 py-2.5" style={{ borderColor: "rgba(196,18,48,0.25)", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: RED }}>③ LEITURA DOS PONTOS</p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.96 }}>Ponto canto superior-direito = alta disciplina + amostra grande = resultado confiável. Canto inferior-direito = alta disciplina mas amostra pequena = suspeito.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro por ANO */}
        <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>FILTRAR POR ANO</p>
        <div className="mb-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setQ10Year("")} className="border px-3 py-1.5 text-xs font-bold"
            style={{ fontFamily: MONO, borderColor: !q10Year ? (isDark ? RED : "#007fff") : isDark ? "rgba(240,236,228,0.12)" : "#d9e4f2", color: !q10Year ? (isDark ? RED : "#007fff") : "var(--muted-foreground)", background: !q10Year && !isDark ? "rgba(0,127,255,0.08)" : "transparent" }}>
            TODOS
          </button>
          {years.map((year) => (
            <button key={year.value} type="button" onClick={() => setQ10Year(year.value)} className="border px-3 py-1.5 text-xs font-bold"
              style={{ fontFamily: MONO, borderColor: q10Year === year.value ? (isDark ? RED : "#007fff") : isDark ? "rgba(240,236,228,0.12)" : "#d9e4f2", color: q10Year === year.value ? (isDark ? RED : "#007fff") : "var(--muted-foreground)", background: q10Year === year.value && !isDark ? "rgba(0,127,255,0.08)" : "transparent" }}>
              {year.label}
            </button>
          ))}
        </div>

        {/* Toggle Amostra Robusta */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <p className="text-[13px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>MODO DE EXIBIÇÃO</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setQ10RobustMode(false)}
              className="border px-3 py-1.5 text-xs font-bold transition-colors"
              style={{ fontFamily: MONO, borderColor: !q10RobustMode ? RED : "var(--border)", background: !q10RobustMode ? `${RED}18` : "transparent", color: !q10RobustMode ? RED : "var(--muted-foreground)" }}>
              TODOS OS PARTIDOS ({fmtNum(q10Rows.length)})
            </button>
            <button type="button" onClick={() => setQ10RobustMode(true)}
              className="border px-3 py-1.5 text-xs font-bold transition-colors"
              style={{ fontFamily: MONO, borderColor: q10RobustMode ? RED : "var(--border)", background: q10RobustMode ? `${RED}18` : "transparent", color: q10RobustMode ? RED : "var(--muted-foreground)" }}>
              AMOSTRA ROBUSTA ≥{ROBUST_MIN_VOTES} votos ({fmtNum(q10RobustRows.length)})
            </button>
          </div>
          {q10RobustMode && (
            <span className="text-xs" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.55 }}>
              Critérios: ≥ {ROBUST_MIN_VOTES} votos com diretriz{!q10Year ? ` · ≥ ${ROBUST_MIN_DEPS} deputados` : ""}
            </span>
          )}
        </div>

        {/* Filtro por PARTIDO */}
        <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>FILTRAR POR PARTIDO</p>
        <div className="mb-6">
          <SearchInput value={q10PartySearch} onChange={setQ10PartySearch} placeholder="Pesquisar partido (ex: PT, PL, MDB)..." />
        </div>

        {/* Cards de resumo */}
        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-4" style={q8SoftGridStyle}>
          <StatCard
            label={q10RobustMode ? "MAIS ALINHADO (ROBUSTO)" : "PARTIDO MAIS ALINHADO"}
            value={text(q10ActiveRows[0], "sigla_partido") || "-"}
            sub={q10ActiveRows[0] ? `${fmtPct(raw(q10ActiveRows[0], "pct_alinhamento"))} · ${fmtNum(raw(q10ActiveRows[0], q10VoteTotalKey))} votos` : undefined}
          />
          <StatCard label="VOTOS COM DIRETRIZ" value={fmtNum(q10ActiveRows.reduce((s, r) => s + raw(r, q10VoteTotalKey), 0))} />
          <StatCard label="PARTIDOS EXIBIDOS" value={fmtNum(q10ActiveRows.length)} sub={q10RobustMode ? `de ${fmtNum(q10Rows.length)} totais` : undefined} />
          <StatCard
            label="MEDIANA ALINHAMENTO"
            value={(() => {
              const sorted = [...q10ActiveRows].sort((a, b) => raw(a, "pct_alinhamento") - raw(b, "pct_alinhamento"));
              const mid = Math.floor(sorted.length / 2);
              return sorted.length ? fmtPct(raw(sorted[mid], "pct_alinhamento")) : "-";
            })()}
          />
        </div>

        {/* Legenda de ideologia */}
        <div className="mb-3 flex flex-wrap items-center gap-4">
          {(["esquerda", "centro", "direita", "nao classificado"] as const).map((label) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: IDEOLOGY_COLORS[label] }} />
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{label.toUpperCase()}</span>
            </div>
          ))}
          <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO, opacity: 0.6 }}>· ponto grande = amostra robusta (≥{ROBUST_MIN_VOTES} votos)</span>
        </div>

        {/* ── SCATTER CHART: alinhamento × volume da amostra ── */}
        <div className="mb-4 border border-border" style={{ height: 560, background: isDark ? "#080808" : "#fafafa" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 24, bottom: 52, left: 64 }}>
              <XAxis
                type="number"
                dataKey="x"
                domain={[
                  Math.max(50, Math.floor((q10ScatterData.length ? Math.min(...q10ScatterData.map((d) => d.x)) : 80) - 3)),
                  100.5,
                ]}
                tick={{ fill: isDark ? "#c8c4bc" : "#333", fontSize: 12, fontFamily: MONO, fontWeight: 600 }}
                axisLine={{ stroke: isDark ? "rgba(240,236,228,0.08)" : "rgba(0,0,0,0.08)" }}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
                label={{ value: "% ALINHAMENTO À ORIENTAÇÃO PARTIDÁRIA", position: "insideBottom", offset: -36, fill: isDark ? "#aaa8a0" : "#444", fontSize: 12, fontFamily: MONO, fontWeight: 600 }}
              />
              <YAxis
                type="number"
                dataKey="yLog"
                domain={[0, "auto"]}
                tick={{ fill: isDark ? "#c8c4bc" : "#333", fontSize: 12, fontFamily: MONO, fontWeight: 600 }}
                axisLine={{ stroke: isDark ? "rgba(240,236,228,0.08)" : "rgba(0,0,0,0.08)" }}
                tickLine={false}
                tickFormatter={(v: number) => fmtNum(Math.round(Math.pow(10, v)))}
                label={{ value: "VOTOS COM DIRETRIZ (log)", angle: -90, position: "insideLeft", offset: 12, fill: isDark ? "#aaa8a0" : "#444", fontSize: 12, fontFamily: MONO, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: isDark ? "rgba(240,236,228,0.2)" : "rgba(0,0,0,0.1)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload as Q10Point | undefined;
                  if (!d) return null;
                  const isRobust = d.votos >= ROBUST_MIN_VOTES;
                  return (
                    <div style={{ background: isDark ? "#141414" : "#fff", border: `1px solid ${IDEOLOGY_COLORS[d.ideologia] ?? "#555"}`, padding: "10px 14px", fontFamily: MONO, fontSize: 11, minWidth: 200 }}>
                      <p style={{ fontWeight: "bold", color: IDEOLOGY_COLORS[d.ideologia] ?? "#555", marginBottom: 6 }}>{d.sigla} · {d.ideologia.toUpperCase()}</p>
                      <p style={{ color: "var(--foreground)" }}>Alinhamento: <strong>{d.pct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</strong></p>
                      <p style={{ color: "var(--foreground)" }}>Votos com diretriz: {fmtNum(d.votos)}</p>
                      {d.alinhados > 0 && <p style={{ color: "var(--foreground)" }}>Votos alinhados: {fmtNum(d.alinhados)}</p>}
                      {d.contrarios > 0 && <p style={{ color: "var(--foreground)" }}>Votos contrários: {fmtNum(d.contrarios)}</p>}
                      {d.deps > 0 && <p style={{ color: "var(--foreground)" }}>Deputados: {d.deps}</p>}
                      <p style={{ color: isRobust ? "#4a7c59" : "#c4813a", marginTop: 4, fontWeight: "bold" }}>
                        {isRobust ? "✓ AMOSTRA ROBUSTA" : "⚠ AMOSTRA PEQUENA"}
                      </p>
                    </div>
                  );
                }}
              />
              {/* Linha de referência: amostra robusta (500 votos) */}
              <ReferenceLine
                y={Math.log10(ROBUST_MIN_VOTES + 1)}
                stroke={isDark ? "rgba(196,18,48,0.3)" : "rgba(196,18,48,0.2)"}
                strokeDasharray="5 4"
                label={{ value: `≥ ${ROBUST_MIN_VOTES} votos → AMOSTRA ROBUSTA`, position: "insideTopRight", fontSize: 11, fontFamily: MONO, fontWeight: 700, fill: isDark ? "rgba(196,18,48,0.9)" : RED }}
              />
              {/* Linha de referência: alta disciplina (95%) */}
              <ReferenceLine
                x={95}
                stroke={isDark ? "rgba(240,236,228,0.12)" : "rgba(0,0,0,0.1)"}
                strokeDasharray="5 4"
                label={{ value: "95%", position: "insideTopLeft", fontSize: 11, fontFamily: MONO, fontWeight: 700, fill: isDark ? "rgba(240,236,228,0.7)" : "#555" }}
              />
              {/* Um Scatter por ideologia para colorir corretamente */}
              {Object.entries(q10ByIdeology).map(([ideo, data]) => (
                <Scatter
                  key={ideo}
                  data={data}
                  shape={(props: { cx?: number; cy?: number; payload?: Q10Point }) => {
                    const { cx = 0, cy = 0, payload } = props;
                    if (!payload) return <g />;
                    const searchQ   = normalizeText(q10PartySearch);
                    const isMatch   = !q10PartyActive || normalizeText(payload.sigla).includes(searchQ);
                    const color     = IDEOLOGY_COLORS[payload.ideologia] ?? "#555";
                    const isRobust  = payload.votos >= ROBUST_MIN_VOTES;
                    const r         = isMatch ? (isRobust ? 7 : 4) : (isRobust ? 4 : 2.5);
                    const dotOpacity = !q10PartyActive
                      ? (isRobust ? 0.92 : 0.48)
                      : (isMatch ? 1 : 0.1);
                    const textFill   = isDark ? "#e8e4dc" : "#111111";
                    const shadowFill = isDark ? "#000000" : "#ffffff";
                    const showLabel  = isMatch;
                    return (
                      <g>
                        {/* anel de destaque ao buscar */}
                        {q10PartyActive && isMatch && (
                          <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={color} strokeWidth={1.5} opacity={0.5} />
                        )}
                        <circle cx={cx} cy={cy} r={r} fill={color} opacity={dotOpacity} stroke={isRobust && isMatch ? (isDark ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.8)") : "none"} strokeWidth={1} />
                        {showLabel && (
                          <>
                            <text x={cx + r + 5} y={cy + 4} fontSize={isRobust ? 10 : 9} fontFamily={MONO} fontWeight={isRobust ? "700" : "500"} fill={shadowFill} stroke={shadowFill} strokeWidth={3} strokeLinejoin="round" style={{ pointerEvents: "none", userSelect: "none" }}>
                              {payload.sigla}
                            </text>
                            <text x={cx + r + 5} y={cy + 4} fontSize={isRobust ? 10 : 9} fontFamily={MONO} fontWeight={isRobust ? "700" : "500"} fill={textFill} style={{ pointerEvents: "none", userSelect: "none" }}>
                              {payload.sigla}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  }}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Nota do gráfico */}
        <p className="mb-10 text-sm font-medium" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>
          Passe o mouse sobre cada ponto para ver os detalhes. Pontos maiores e opacos = amostra robusta (≥{ROBUST_MIN_VOTES} votos, com rótulo). Pontos menores e semi-transparentes = amostra pequena. A linha tracejada vermelha marca o limiar de amostra robusta. Escala do eixo Y é logarítmica.
        </p>

        {/* Tabela principal — inicialmente escondida (abre ao mostrar ou ao pesquisar partido) */}
        <CollapsibleSection
          title={`RANKING DE PARTIDOS${q10RobustMode ? " · AMOSTRA ROBUSTA" : ""} · ${fmtNum(q10FilteredRows.length)} ${q10PartyActive ? "ENCONTRADOS" : "PARTIDOS"}`}
          open={q10TableOpen || q10PartyActive}
          onToggle={() => setQ10TableOpen((v) => !v)}
        >
          <SimpleTable
            rows={q10FilteredRows}
            columns={q10Columns}
            empty={q10PartyActive ? `Nenhum partido encontrado para "${q10PartySearch.trim().toUpperCase()}".` : "Sem linhas da Q10."}
          />
        </CollapsibleSection>

        {!q10Year && q10AnnualRows.length ? (
          <div className="mt-10">
            <SectionHeader
              n="06D"
              tag="SERIE ANUAL"
              title="Alinhamento interno por ano"
              desc="Tabela complementar da Q10 para comparar a disciplina partidaria ano a ano."
            />
            <CollapsibleSection
              title={`ALINHAMENTO POR ANO · ${fmtNum(q10AnnualFiltered.length)} ${q10PartyActive ? "ENCONTRADAS" : "LINHAS"}`}
              open={q10AnnualOpen || q10PartyActive}
              onToggle={() => setQ10AnnualOpen((v) => !v)}
            >
              <SimpleTable
                rows={q10AnnualFiltered}
                columns={["ano_dados", "sigla_partido", "ideologia", "total_votos", "votos_alinhados", "pct_alinhamento"]}
                empty={q10PartyActive ? `Nenhum partido encontrado para "${q10PartySearch.trim().toUpperCase()}".` : "Sem linhas anuais da Q10."}
              />
            </CollapsibleSection>
          </div>
        ) : null}
      </section>
      )}

      {activeSection === "metodologia" && (
      <section
        className="border-b border-border px-6 py-14 md:px-14"
        style={{
          ...q8LightVars,
          background: "var(--card)",
        }}
      >
        <p className="sr-only">METODOLOGIA</p>

        <SectionHeader
          n="06E"
          tag="METODOLOGIA"
          title="Como chegamos aqui?"
          desc="Transparencia analitica - Como medimos influencia, comunidades de comportamento e disciplina partidaria."
        />

        {/* Q8 Collapsible */}
        <div className="mb-3 border border-border">
          <button
            type="button"
            onClick={() => setMethQ8Open((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-white/[0.03] md:px-6"
            style={{ background: "var(--card)" }}
          >
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black" style={{ fontFamily: SERIF, color: RED }}>8</span>
              <div>
                <p className="text-base font-black leading-tight md:text-lg" style={{ fontFamily: MONO, color: "var(--foreground)" }}>INFLUENCIA LEGISLATIVA & COMUNIDADES DE COMPORTAMENTO</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] md:text-[13px]" style={{ fontFamily: MONO, color: RED }}>Como medimos quem mais influenciou e como agrupamos deputados por padrao de voto</p>
              </div>
            </div>
            <span className="ml-4 shrink-0 text-sm font-black md:text-base" style={{ fontFamily: MONO, color: RED }}>{methQ8Open ? "▲ RECOLHER" : "▼ EXPANDIR"}</span>
          </button>

          {methQ8Open && (
            <div className="border-t border-border px-5 py-6 md:px-6" style={{ background: "var(--card)" }}>
              <div className="grid gap-10 lg:grid-cols-2">

                <div>
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: RED }}>PARTE 1 — INFLUENCIA LEGISLATIVA (RANKING)</p>
                  <p className="mb-5 text-sm font-medium leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.88 }}>Objetivo: medir a participacao de cada deputado no conjunto de proposicoes aprovadas da legislatura. A ideia nao e dizer que um deputado aprovou tudo sozinho, mas estimar quanto da producao aprovada teve autoria ligada a ele.</p>
                  <ol className="space-y-4">
                    {[
                      { n: "01", title: "Base analisada", body: "Partimos das proposicoes da legislatura e das relacoes de autoria. O foco e autoria parlamentar: cada deputado ligado a uma proposicao entra como participante daquela iniciativa, inclusive quando a autoria e compartilhada." },
                      { n: "02", title: "Identificar proposicoes aprovadas", body: "A situacao de cada proposicao e lida para separar casos aprovados dos demais. Entram como aprovadas as proposicoes cuja situacao indica aprovacao, sancao, promulgacao ou transformacao em norma juridica. Proposicoes em tramitacao, arquivadas ou rejeitadas ficam fora do numerador." },
                      { n: "03", title: "Contar producao por autor", body: "Para cada deputado, contamos duas coisas: quantas proposicoes ele assinou como autor e quantas dessas proposicoes chegaram a uma situacao de aprovacao. Isso separa volume bruto de autoria e resultado efetivo." },
                      { n: "04", title: "Calcular a fatia de influencia", body: "O indicador principal divide as proposicoes aprovadas vinculadas ao deputado pelo total de proposicoes aprovadas no recorte. O resultado e uma porcentagem: qual fatia da producao aprovada teve aquele deputado como autor." },
                      { n: "05", title: "Interpretar o ranking", body: "Um deputado no topo nao necessariamente foi o unico responsavel por todas as aprovacoes; ele aparece porque esteve associado a muitas proposicoes que avancaram. O ranking mede presenca em proposicoes aprovadas, nao causalidade politica individual." },
                      { n: "06", title: "Ordenacao e empates", body: "Os deputados sao ordenados pela maior participacao percentual. Quando ha valores iguais, o volume de proposicoes e o nome ajudam a manter uma exibicao estavel e comparavel na tabela." },
                    ].map((step) => (
                      <li key={step.n} className="flex gap-4">
                        <span className="mt-0.5 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color: RED }}>{step.n}</span>
                        <div>
                          <p className="mb-1 text-sm font-bold leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{step.title}</p>
                          <p className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.88 }}>{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: RED }}>PARTE 2 — COMUNIDADES DE COMPORTAMENTO (GRAFO LEIDEN)</p>
                  <p className="mb-5 text-sm font-medium leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.88 }}>Objetivo: descobrir blocos de comportamento a partir do voto real. O agrupamento nao usa partido, UF ou ideologia como entrada; ele olha primeiro para quem vota parecido e so depois permite interpretar a composicao politica dos grupos.</p>
                  <ol className="space-y-4">
                    {[
                      { n: "01", title: "Selecionar votacoes que diferenciam comportamento", body: "Votacoes unanimes ou quase unanimes dizem pouco sobre alinhamentos internos. Por isso entram apenas votacoes com quantidade minima de votos Sim/Nao e com divisao real no plenario, evitando casos em que todo mundo votou igual." },
                      { n: "02", title: "Padronizar o voto", body: "Cada voto e convertido para uma escala simples: Sim representa apoio, Nao representa rejeicao e Abstencao representa ausencia de posicao clara no merito. Registros como obstrucao ou Artigo 17 sao tratados com cuidado porque podem refletir estrategia regimental, nao concordancia com a materia." },
                      { n: "03", title: "Garantir base minima por deputado", body: "Deputados com poucos votos validos podem parecer parecidos por acaso. Por isso o grafo considera apenas parlamentares com quantidade suficiente de votacoes comparaveis, deixando a similaridade mais confiavel." },
                      { n: "04", title: "Comparar deputado contra deputado", body: "Para cada par de deputados, a metodologia verifica em quantas votacoes os dois participaram e em quantas votaram da mesma forma. A similaridade e a proporcao de coincidencias entre votacoes compartilhadas." },
                      { n: "05", title: "Descartar comparacoes fracas", body: "Pares com poucas votacoes em comum ou baixa cobertura sao removidos. Isso evita criar conexoes fortes entre deputados que quase nunca estiveram presentes nas mesmas votacoes." },
                      { n: "06", title: "Transformar similaridade em grafo", body: "Cada deputado vira um no. Quando dois deputados possuem similaridade alta o suficiente, uma aresta liga os dois. O peso da aresta representa a forca dessa semelhanca: quanto maior, mais consistente foi o voto parecido." },
                      { n: "07", title: "Detectar comunidades com Leiden", body: "O algoritmo Leiden procura grupos com muitas conexoes fortes internamente e poucas conexoes fortes com outros grupos. O resultado sao comunidades de comportamento parlamentar, que podem confirmar fronteiras partidarias ou revelar coalizoes transversais." },
                      { n: "08", title: "Ler o resultado com cautela", body: "A comunidade mostra padrao de voto, nao identidade ideologica definitiva. Um deputado pode estar em determinado bloco por comportamento em votacoes selecionadas, por acordo de governo, oposicao, pauta regional ou estrategia partidaria." },
                    ].map((step) => (
                      <li key={step.n} className="flex gap-4">
                        <span className="mt-0.5 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color: RED }}>{step.n}</span>
                        <div>
                          <p className="mb-1 text-sm font-bold leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{step.title}</p>
                          <p className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.88 }}>{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Q10 Collapsible */}
        <div className="border border-border">
          <button
            type="button"
            onClick={() => setMethQ10Open((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-white/[0.03] md:px-6"
            style={{ background: "var(--card)" }}
          >
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black" style={{ fontFamily: SERIF, color: RED }}>10</span>
              <div>
                <p className="text-base font-black leading-tight md:text-lg" style={{ fontFamily: MONO, color: "var(--foreground)" }}>DISCIPLINA PARTIDARIA — ALINHAMENTO INTERNO</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] md:text-[13px]" style={{ fontFamily: MONO, color: RED }}>Como medimos o quanto cada partido consegue alinhar seus deputados</p>
              </div>
            </div>
            <span className="ml-4 shrink-0 text-sm font-black md:text-base" style={{ fontFamily: MONO, color: RED }}>{methQ10Open ? "▲ RECOLHER" : "▼ EXPANDIR"}</span>
          </button>

          {methQ10Open && (
            <div className="border-t border-border px-5 py-6 md:px-6" style={{ background: "var(--card)" }}>
              <p className="mb-6 max-w-3xl text-sm font-medium leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.88 }}>Objetivo: medir o quanto cada partido consegue transformar sua orientacao oficial em voto efetivo da bancada. A pergunta central e simples: quando o partido orienta Sim ou Nao, seus deputados acompanham essa diretriz?</p>
              <ol className="grid gap-5 lg:grid-cols-2">
                {[
                  { n: "01", title: "Selecionar votacoes com orientacao clara", body: "A metodologia considera apenas votacoes em que houve uma orientacao partidaria objetiva, normalmente Sim ou Nao. Casos em que o partido liberou a bancada ou adotou posicoes sem diretriz clara nao entram no calculo, porque nao existe uma linha oficial para comparar." },
                  { n: "02", title: "Relacionar deputado, partido e voto", body: "Para cada voto nominal, identificamos o deputado, seu partido na votacao, o voto registrado e a orientacao emitida por aquele partido. Essa amarracao e importante porque disciplina partidaria depende da relacao entre bancada e direcao partidaria no momento da votacao." },
                  { n: "03", title: "Comparar voto com orientacao", body: "Cada voto e classificado como alinhado quando o deputado vota igual a orientacao do partido. Quando o partido orienta Sim e o deputado vota Nao, ou o contrario, o voto conta como desalinhado." },
                  { n: "04", title: "Tratar votos que nao medem obediencia direta", body: "Registros como abstencao, obstrucao ou ausencia podem ter significados diferentes dependendo do contexto. A metodologia privilegia comparacoes em que voto e orientacao sao diretamente comparaveis, reduzindo ruido na leitura de disciplina." },
                  { n: "05", title: "Agregar por partido", body: "Depois da classificacao voto a voto, somamos por partido: total de votos com diretriz e total de votos alinhados. Um partido grande pode acumular muitos registros porque possui muitos deputados votando em muitas sessoes." },
                  { n: "06", title: "Calcular o percentual de alinhamento", body: "O indice e calculado como votos alinhados divididos pelo total de votos com diretriz, multiplicado por 100. Um valor proximo de 100% indica bancada muito obediente; um valor mais baixo sugere dissidencia, racha interno ou orientacao menos efetiva." },
                  { n: "07", title: "Comparar anos e legislatura completa", body: "O painel permite olhar o periodo inteiro ou filtrar por ano. Isso ajuda a perceber se a disciplina foi constante ou se mudou em momentos politicos especificos, como troca de governo, reformas importantes ou conflitos internos." },
                  { n: "08", title: "Cruzar com ideologia sem confundir conceitos", body: "A ideologia do partido aparece como camada interpretativa, nao como criterio do calculo. O indicador mede obediencia a orientacao partidaria; depois cruzamos com esquerda, centro ou direita para observar padroes entre campos politicos." },
                  { n: "09", title: "Como interpretar o ranking", body: "Partidos no topo nao sao necessariamente mais ideologicos ou melhores; eles apenas tiveram maior proporcao de deputados seguindo a orientacao. Partidos abaixo podem ser mais heterogeneos, ter bancadas regionais fortes ou liberar conflitos internos com mais frequencia." },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span className="mt-0.5 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color: RED }}>{step.n}</span>
                    <div>
                      <p className="mb-1 text-sm font-bold leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{step.title}</p>
                      <p className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.88 }}>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

      </section>
      )}

    </div>
  );
}
