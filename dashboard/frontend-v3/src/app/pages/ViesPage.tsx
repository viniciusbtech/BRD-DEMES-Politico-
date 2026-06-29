import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchQuestion } from "../api";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import type { QuestionPayload } from "../types";

type ViesPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
  onNavigateRecorte: (path: string) => void;
};

type Row = Record<string, unknown>;

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const RED = "#e00836";
const ANOS_LEGISLATURA = ["2023", "2024", "2025", "2026"];

const IDEOLOGY_COLORS: Record<string, string> = {
  esquerda: "#c41230",
  centro: "#d6a84f",
  direita: "#2b5490",
  "nao classificado": "#555",
};

const IDEOLOGY_LABELS: Record<string, string> = {
  esquerda: "ESQUERDA",
  centro: "CENTRO",
  direita: "DIREITA",
  "nao classificado": "NAO CLASSIFICADO",
};

const raw = (row: Row | undefined, key: string) => Number(row?.[key] ?? 0);
const text = (row: Row | undefined, key: string) => String(row?.[key] ?? "");
const fmtNum = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtPct = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/** Score 0–100 → interpolate red→gold→blue */
function scoreColor(score: number): string {
  if (score <= 50) {
    const t = score / 50;
    const r = Math.round(196 + (214 - 196) * t);
    const g = Math.round(18 + (168 - 18) * t);
    const b = Math.round(48 + (79 - 48) * t);
    return `rgb(${r},${g},${b})`;
  }
  const t = (score - 50) / 50;
  const r = Math.round(214 + (43 - 214) * t);
  const g = Math.round(168 + (84 - 168) * t);
  const b = Math.round(79 + (144 - 79) * t);
  return `rgb(${r},${g},${b})`;
}

function ScoreBar({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div className="relative mt-1.5">
      <div
        className="h-2 w-full rounded-sm"
        style={{
          background:
            "linear-gradient(to right, #c41230 0%, #d6a84f 50%, #2b5490 100%)",
          opacity: 0.18,
        }}
      />
      <div
        className="absolute top-0 h-2 w-3 rounded-sm -translate-x-1/2"
        style={{ left: `${score}%`, background: color, boxShadow: `0 0 6px ${color}` }}
      />
    </div>
  );
}

function SectionHeader({ tag, n, title, desc }: { tag: string; n: string; title: string; desc: string }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-baseline gap-4">
        <span className="text-5xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.22)" }}>{n}</span>
        <span className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>{tag}</span>
      </div>
      <h2 className="mb-2 text-3xl font-black leading-tight md:text-4xl" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>{title}</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-background px-6 py-6">
      <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>{label}</p>
      <p className="text-3xl font-black" style={{ fontFamily: SERIF, color: color ?? RED }}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{sub}</p> : null}
    </div>
  );
}

function EmptyPanel({ text: msg }: { text: string }) {
  return (
    <div className="border border-border px-6 py-12 text-center" style={{ background: "var(--card)" }}>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{msg}</p>
    </div>
  );
}

function SimpleTable({ rows, columns, empty }: { rows: Row[]; columns: string[]; empty: string }) {
  if (!rows.length) return <EmptyPanel text={empty} />;
  return (
    <div className="overflow-x-auto border border-border" style={{ background: "var(--card)" }}>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-background">
          <tr>
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-3 text-xs font-normal uppercase text-muted-foreground" style={{ fontFamily: MONO }}>
                {col.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {columns.map((col) => (
                <td key={col} className="whitespace-nowrap px-4 py-3 text-foreground">
                  {typeof row[col] === "number" ? Number(row[col]).toLocaleString("pt-BR") : String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IdeologyBadge({ ideology }: { ideology: string }) {
  const color = IDEOLOGY_COLORS[ideology] ?? "#555";
  return (
    <span className="inline-block rounded-sm px-2 py-0.5 text-xs font-bold uppercase" style={{ background: `${color}22`, color, fontFamily: MONO }}>
      {IDEOLOGY_LABELS[ideology] ?? ideology}
    </span>
  );
}

function CollapsibleMethod({ n, title, sub, open, onToggle, children }: {
  n: string; title: string; sub: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="mb-3 border border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-white/[0.03] md:px-6"
        style={{ background: "var(--card)" }}
      >
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black" style={{ fontFamily: SERIF, color: RED }}>{n}</span>
          <div>
            <p className="text-base font-black leading-tight md:text-lg" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{title}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] md:text-[13px]" style={{ fontFamily: MONO, color: RED }}>{sub}</p>
          </div>
        </div>
        <span className="ml-4 shrink-0 text-sm font-black md:text-base" style={{ fontFamily: MONO, color: RED }}>
          {open ? "▲ RECOLHER" : "▼ EXPANDIR"}
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-6 md:px-6" style={{ background: "var(--card)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MethodSteps({ steps }: { steps: { n: string; title: string; body: string }[] }) {
  return (
    <ol className="max-w-3xl space-y-4">
      {steps.map((step) => (
        <li key={step.n} className="flex gap-4">
          <span className="mt-0.5 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color: RED }}>{step.n}</span>
          <div>
            <p className="mb-1 text-sm font-bold leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{step.title}</p>
            <p className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.88 }}>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ViesPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado, onNavigateRecorte }: ViesPageProps) {
  const [q9, setQ9] = useState<QuestionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q93RowsShown, setQ93RowsShown] = useState(20);
  const [q94RowsShown, setQ94RowsShown] = useState(20);
  const [q95Shown, setQ95Shown] = useState(40);
  const [search, setSearch] = useState("");
  const [selectedPartido, setSelectedPartido] = useState("");
  const [partidoVotos, setPartidoVotos] = useState<Row[]>([]);
  const [partidoVotosLoading, setPartidoVotosLoading] = useState(false);
  const [detShown, setDetShown] = useState(60);
  const [detSearch, setDetSearch] = useState("");
  const [detYear, setDetYear] = useState("");
  // Secao 9.6 — observar uma proposta -> voto de cada deputado
  const [votacaoQuery, setVotacaoQuery] = useState("");
  const [selectedVotacao, setSelectedVotacao] = useState<Row | null>(null);
  const [votacaoVotos, setVotacaoVotos] = useState<Row[]>([]);
  const [votacaoVotosLoading, setVotacaoVotosLoading] = useState(false);
  const [vvShown, setVvShown] = useState(60);
  const [vvVoto, setVvVoto] = useState("todos");
  const [vvDepSearch, setVvDepSearch] = useState("");
  const [vies1Query, setVies1Query] = useState("");
  const [bancadaCampo, setBancadaCampo] = useState<"todos" | "esquerda" | "direita">("todos");
  const [depVotos, setDepVotos] = useState<Row[]>([]);
  const [depVotosLoading, setDepVotosLoading] = useState(false);
  const [methQ91Open, setMethQ91Open] = useState(false);
  const [methQ92Open, setMethQ92Open] = useState(false);
  const [methQ93Open, setMethQ93Open] = useState(false);
  const [methQ94Open, setMethQ94Open] = useState(false);
  const [methQ95Open, setMethQ95Open] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    fetchQuestion("q9", {}, { page: 1, pageSize: 1000 })
      .then((payload) => { if (mounted) setQ9(payload); })
      .catch(() => { if (mounted) setError("Nao foi possivel carregar os dados do backend."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Q9.1
  const q91Rows = useMemo(() => (q9?.table_spec.rows ?? []) as Row[], [q9]);

  const ideologiaGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const row of q91Rows) {
      const ideo = text(row, "ideologia") || "nao classificado";
      const partido = text(row, "sigla_partido");
      if (!map.has(ideo)) map.set(ideo, []);
      if (partido) map.get(ideo)!.push(partido);
    }
    return Array.from(map.entries())
      .map(([ideologia, partidos]) => ({ ideologia, partidos, qtd: partidos.length }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [q91Rows]);

  const pieData = ideologiaGroups.map((g) => ({
    name: IDEOLOGY_LABELS[g.ideologia] ?? g.ideologia,
    value: g.qtd,
    ideologia: g.ideologia,
  }));

  // Q9.2
  const q92Rows = useMemo(() => {
    const t = q9?.complement_tables.find((t) => t.title.toLowerCase().includes("correlacao"));
    return (t?.rows ?? []) as Row[];
  }, [q9]);

  const q92Summary = useMemo(() => {
    const acc = new Map<string, { sum: number; count: number }>();
    for (const row of q92Rows) {
      const ideo = text(row, "ideologia") || "nao classificado";
      const pct = raw(row, "pct_sim");
      if (!acc.has(ideo)) acc.set(ideo, { sum: 0, count: 0 });
      const e = acc.get(ideo)!;
      e.sum += pct;
      e.count += 1;
    }
    return Array.from(acc.entries())
      .map(([ideologia, { sum, count }]) => ({ ideologia, media_pct_sim: count > 0 ? Math.round((sum / count) * 10) / 10 : 0, total: count }))
      .sort((a, b) => b.media_pct_sim - a.media_pct_sim);
  }, [q92Rows]);

  // Q9.2 — partido x proposta (agregado por partido)
  const q92PartidoResumo = useMemo(() => {
    const t = q9?.complement_tables.find((t) => t.title.toLowerCase().includes("resumo partido x proposta"));
    return ((t?.rows ?? []) as Row[]).slice().sort((a, b) => raw(b, "media_pct_sim") - raw(a, "media_pct_sim"));
  }, [q9]);

  // Q9.2b — partido x proposta (granular, amostra)
  const q92PartidoDetalhe = useMemo(() => {
    const t = q9?.complement_tables.find((t) => t.title.toLowerCase().includes("correlacao partido x proposta"));
    return (t?.rows ?? []) as Row[];
  }, [q9]);
  const partidoOptions = useMemo(
    () => q92PartidoResumo.map((r) => text(r, "sigla_partido")).filter(Boolean),
    [q92PartidoResumo]
  );
  // Ao escolher um partido, busca o granular COMPLETO daquele partido (server-side).
  // Sem partido selecionado, usa a amostra ja carregada (q92PartidoDetalhe).
  useEffect(() => {
    if (!selectedPartido) { setPartidoVotos([]); return; }
    let mounted = true;
    setPartidoVotosLoading(true);
    fetchQuestion("q9", { partidos: [selectedPartido] }, { page: 1, pageSize: 1000 })
      .then((p) => {
        if (!mounted) return;
        const t = p.complement_tables.find((t) => t.title.toLowerCase().includes("correlacao partido x proposta"));
        setPartidoVotos((t?.rows ?? []) as Row[]);
      })
      .catch(() => { if (mounted) setPartidoVotos([]); })
      .finally(() => { if (mounted) setPartidoVotosLoading(false); });
    return () => { mounted = false; };
  }, [selectedPartido]);

  // Reinicia a paginacao quando muda o partido, a busca ou o ano
  useEffect(() => { setDetShown(60); }, [selectedPartido, detSearch, detYear]);

  const detalheSearched = useMemo(() => {
    const base = selectedPartido ? partidoVotos : q92PartidoDetalhe;
    const q = detSearch.trim().toLowerCase();
    return base.filter((r) => {
      if (detYear && text(r, "ano_dados") !== detYear) return false;
      if (q && !(text(r, "titulo_proposicao").toLowerCase().includes(q) || text(r, "id_votacao").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [selectedPartido, partidoVotos, q92PartidoDetalhe, detSearch, detYear]);

  // Q9.5 — score viés individual (definido antes da Secao 1, que o consome)
  const q95Rows = useMemo(() => {
    const t = q9?.complement_tables.find((t) => t.title.toLowerCase().includes("score vies"));
    return (t?.rows ?? []) as Row[];
  }, [q9]);

  // ── Secao 1: vies do deputado por nome ──
  const classifyVies = (score: number) => (score < 35 ? "esquerda" : score <= 65 ? "centro" : "direita");

  const vies1Term = vies1Query.trim().toLowerCase();
  const vies1Matches = useMemo(() => {
    if (!vies1Term) return [];
    return q95Rows
      .filter((r) =>
        text(r, "nome_deputado").toLowerCase().includes(vies1Term) ||
        text(r, "sigla_partido").toLowerCase().includes(vies1Term))
      .sort((a, b) => raw(b, "votos_em_polarizadas") - raw(a, "votos_em_polarizadas"));
  }, [q95Rows, vies1Term]);
  const found1 = vies1Matches[0] ?? null;

  // voto REAL do deputado por proposta polarizada (Q9.3 voto-a-voto), buscado sob demanda
  const found1Id = found1 ? text(found1, "id_deputado") : "";
  useEffect(() => {
    if (!found1Id) { setDepVotos([]); return; }
    let mounted = true;
    setDepVotosLoading(true);
    fetchQuestion("q9", { deputados: [found1Id] }, { page: 1, pageSize: 1000 })
      .then((p) => {
        if (!mounted) return;
        const t = p.complement_tables.find((t) => t.title.toLowerCase().includes("voto do deputado por proposta"));
        setDepVotos((t?.rows ?? []) as Row[]);
      })
      .catch(() => { if (mounted) setDepVotos([]); })
      .finally(() => { if (mounted) setDepVotosLoading(false); });
    return () => { mounted = false; };
  }, [found1Id]);

  const depVotosRows = useMemo(() => depVotos.map((r) => ({
    ano: text(r, "ano_dados"),
    id_votacao: text(r, "id_votacao"),
    titulo: text(r, "titulo_proposicao"),
    campo: text(r, "campo_favoravel").startsWith("esquerda") ? "esquerda" : "direita",
    voto: text(r, "voto"),
    votou_com: text(r, "votou_com"),
  })), [depVotos]);

  const depVotosFiltered = useMemo(
    () => (bancadaCampo === "todos" ? depVotosRows : depVotosRows.filter((p) => p.campo === bancadaCampo)),
    [depVotosRows, bancadaCampo]
  );

  // ── Secao 9.6: observar uma proposta -> voto de cada deputado ──
  const q96Lista = useMemo(() => {
    const t = q9?.complement_tables.find((t) => t.title.toLowerCase().includes("lista de votacoes"));
    return (t?.rows ?? []) as Row[];
  }, [q9]);

  const votacaoMatches = useMemo(() => {
    const q = votacaoQuery.trim().toLowerCase();
    if (!q) return q96Lista.slice(0, 15);
    return q96Lista
      .filter((r) => text(r, "titulo_proposicao").toLowerCase().includes(q) || text(r, "id_votacao").toLowerCase().includes(q))
      .slice(0, 40);
  }, [q96Lista, votacaoQuery]);

  const selectedVotacaoId = selectedVotacao ? text(selectedVotacao, "id_votacao") : "";
  useEffect(() => {
    if (!selectedVotacaoId) { setVotacaoVotos([]); return; }
    let mounted = true;
    setVotacaoVotosLoading(true);
    fetchQuestion("q9", { search: selectedVotacaoId }, { page: 1, pageSize: 1000 })
      .then((p) => {
        if (!mounted) return;
        const t = p.complement_tables.find((t) => t.title.toLowerCase().includes("votos por votacao"));
        setVotacaoVotos((t?.rows ?? []) as Row[]);
      })
      .catch(() => { if (mounted) setVotacaoVotos([]); })
      .finally(() => { if (mounted) setVotacaoVotosLoading(false); });
    return () => { mounted = false; };
  }, [selectedVotacaoId]);

  useEffect(() => { setVvShown(60); }, [selectedVotacaoId, vvVoto, vvDepSearch]);

  const vvCounts = useMemo(() => {
    let sim = 0, nao = 0, out = 0;
    for (const r of votacaoVotos) {
      const v = text(r, "voto");
      if (v === "Sim") sim++; else if (v === "Nao") nao++; else out++;
    }
    return { sim, nao, out, total: votacaoVotos.length };
  }, [votacaoVotos]);

  const vvFiltered = useMemo(() => {
    const q = vvDepSearch.trim().toLowerCase();
    return votacaoVotos.filter((r) => {
      const v = text(r, "voto");
      if (vvVoto === "Sim" && v !== "Sim") return false;
      if (vvVoto === "Nao" && v !== "Nao") return false;
      if (vvVoto === "outros" && (v === "Sim" || v === "Nao")) return false;
      if (q && !(text(r, "nome_deputado").toLowerCase().includes(q) || text(r, "sigla_partido").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [votacaoVotos, vvVoto, vvDepSearch]);

  // Q9.3
  const q93Rows = useMemo(() => {
    const t = q9?.complement_tables.find((t) => t.title.toLowerCase().includes("resumo consolidado") || t.title.toLowerCase().includes("aderencia"));
    return ((t?.rows ?? []) as Row[]).sort((a, b) => raw(b, "pct_aderencia_partido") - raw(a, "pct_aderencia_partido"));
  }, [q9]);

  // Q9.4 — polarizadas
  const q94Rows = useMemo(() => {
    const t = q9?.complement_tables.find((t) => t.title.toLowerCase().includes("polarizadas"));
    return ((t?.rows ?? []) as Row[]).sort((a, b) => raw(b, "divergencia_esq_dir") - raw(a, "divergencia_esq_dir"));
  }, [q9]);

  // Pool de busca: Q9.5 quando disponível, senão Q9.3 (ambos têm nome_deputado e sigla_partido)
  const hasScoreData = q95Rows.length > 0;
  const searchPool = useMemo(() => hasScoreData ? q95Rows : q93Rows, [hasScoreData, q95Rows, q93Rows]);

  const searchTerm = search.trim().toLowerCase();
  const searchFiltered = useMemo(() => {
    if (!searchTerm) return [];
    return searchPool.filter(
      (row) =>
        text(row, "nome_deputado").toLowerCase().includes(searchTerm) ||
        text(row, "sigla_partido").toLowerCase().includes(searchTerm)
    );
  }, [searchPool, searchTerm]);

  const q95Sorted = useMemo(
    () => [...q95Rows].sort((a, b) => raw(a, "score_vies") - raw(b, "score_vies")),
    [q95Rows]
  );

  // deputado encontrado na busca
  const foundDeputy = searchTerm && searchFiltered.length >= 1 ? searchFiltered[0] : null;

  // stats
  const totalPartidos = q91Rows.length;
  const totalDeputados = new Set(q93Rows.map((r) => text(r, "id_deputado"))).size;
  const totalVotacoes = new Set(q92Rows.map((r) => `${text(r, "ano_dados")}_${text(r, "id_votacao")}`)).size;
  const totalPolarizadas = q94Rows.length;

  const tooltipStyle = {
    contentStyle: { background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", fontFamily: MONO, fontSize: 11, color: "var(--chart-tooltip-text)" },
    itemStyle: { color: "var(--chart-tooltip-text)" },
    labelStyle: { color: "var(--chart-tooltip-text)" },
  };

  type ViesSection = "classificacao" | "correlacao" | "votacoes-polarizadas" | "vies-deputado" | "voto-cada" | "observar-proposta" | "metodologia";
  const [activeSection, setActiveSection] = useState<ViesSection>("classificacao");
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
        n="7"
        tag="VIES IDEOLOGICO"
        title="Ideologia"
        titleRed="e voto"
        desc="Onde cada partido se posiciona no espectro politico, como cada campo ideologico reage a cada proposicao, quais votacoes realmente dividem esquerda e direita — e onde cada deputado se posiciona de verdade."
        imgId="/fundorecortes/recorte7/questao7.png"
      />

      {error ? <section className="px-6 py-10 md:px-14"><EmptyPanel text={error} /></section> : null}

      {/* ── NAV DE SEÇÕES ── */}
      <div
        className="sticky top-[56px] z-30 flex flex-wrap gap-3 border-b px-6 py-3 md:px-14"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        <button type="button" onClick={() => setActiveSection("classificacao")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "classificacao" ? RED : "transparent", color: activeSection === "classificacao" ? "#fff" : "var(--foreground)", borderColor: activeSection === "classificacao" ? RED : "var(--border)" }}>
          Classificação
        </button>
        <button type="button" onClick={() => setActiveSection("correlacao")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "correlacao" ? RED : "transparent", color: activeSection === "correlacao" ? "#fff" : "var(--foreground)", borderColor: activeSection === "correlacao" ? RED : "var(--border)" }}>
          Correlação
        </button>
        <button type="button" onClick={() => setActiveSection("votacoes-polarizadas")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "votacoes-polarizadas" ? RED : "transparent", color: activeSection === "votacoes-polarizadas" ? "#fff" : "var(--foreground)", borderColor: activeSection === "votacoes-polarizadas" ? RED : "var(--border)" }}>
          Votações Polarizadas
        </button>
        <button type="button" onClick={() => setActiveSection("vies-deputado")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "vies-deputado" ? RED : "transparent", color: activeSection === "vies-deputado" ? "#fff" : "var(--foreground)", borderColor: activeSection === "vies-deputado" ? RED : "var(--border)" }}>
          Viés do Deputado
        </button>
        <button type="button" onClick={() => setActiveSection("voto-cada")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "voto-cada" ? RED : "transparent", color: activeSection === "voto-cada" ? "#fff" : "var(--foreground)", borderColor: activeSection === "voto-cada" ? RED : "var(--border)" }}>
          Voto de Cada
        </button>
        <button type="button" onClick={() => setActiveSection("observar-proposta")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "observar-proposta" ? RED : "transparent", color: activeSection === "observar-proposta" ? "#fff" : "var(--foreground)", borderColor: activeSection === "observar-proposta" ? RED : "var(--border)" }}>
          Observar Proposta
        </button>
        <button type="button" onClick={() => setActiveSection("metodologia")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "metodologia" ? RED : "transparent", color: activeSection === "metodologia" ? "#fff" : "var(--foreground)", borderColor: activeSection === "metodologia" ? RED : "var(--border)" }}>
          Metodologia
        </button>
      </div>

      {/* ── SEÇÃO 1: VIÉS DO DEPUTADO (pergunta principal) ── */}
      {activeSection === "vies-deputado" && (
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader
          n="9"
          tag="VIES DO DEPUTADO"
          title="Qual o vies do deputado?"
          desc="Pesquise um deputado pelo nome e veja onde ele se posiciona de verdade — esquerda, centro ou direita — a partir do voto real em votacoes polarizadas (score 0 = esquerda, 100 = direita)."
        />

        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              value={vies1Query}
              onChange={(e) => setVies1Query(e.target.value)}
              placeholder="Ex.: Kim Kataguiri, Erika Hilton..."
              className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              style={{ fontFamily: MONO }}
            />
            {vies1Query ? (
              <button type="button" onClick={() => setVies1Query("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground" style={{ fontFamily: MONO }}>✕</button>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>EXEMPLOS:</span>
            {["Kim Kataguiri", "Erika Hilton"].map((n) => (
              <button key={n} type="button" onClick={() => setVies1Query(n)} className="border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary" style={{ fontFamily: MONO }}>{n}</button>
            ))}
          </div>
        </div>

        {!q95Rows.length ? (
          <EmptyPanel text="Score de vies ainda nao disponivel." />
        ) : !vies1Term ? (
          <EmptyPanel text="Digite o nome de um deputado (ou clique em um exemplo) para ver o vies." />
        ) : !found1 ? (
          <EmptyPanel text={`Nenhum deputado encontrado para "${vies1Query}".`} />
        ) : (() => {
          const score = raw(found1, "score_vies");
          const vies = classifyVies(score);
          const color = scoreColor(score);
          return (
            <>
              <div className="border border-border p-6" style={{ background: "var(--card)", borderLeft: `4px solid ${color}` }}>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-black" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>{text(found1, "nome_deputado")}</h3>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      <span>{text(found1, "sigla_partido")}</span>
                      <span>· partido rotulado:</span>
                      <IdeologyBadge ideology={text(found1, "ideologia_partido")} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>VIES PELO VOTO REAL</p>
                    <p className="text-3xl font-black" style={{ fontFamily: SERIF, color }}>{IDEOLOGY_LABELS[vies]}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>SCORE {score.toFixed(1)} / 100</p>
                  </div>
                </div>
                <ScoreBar score={score} />
                <div className="mb-4 mt-1 flex justify-between text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  <span style={{ color: RED }}>← ESQUERDA (0)</span>
                  <span>CENTRO (50)</span>
                  <span style={{ color: "#2b5490" }}>DIREITA (100) →</span>
                </div>
                <div className="grid grid-cols-2 gap-px border border-border md:grid-cols-4" style={{ background: "var(--secondary)" }}>
                  <StatCard label="VOTOS EM POLARIZADAS" value={fmtNum(raw(found1, "votos_em_polarizadas"))} />
                  <StatCard label="COM ESQUERDA" value={fmtNum(raw(found1, "votos_com_esquerda"))} color={RED} />
                  <StatCard label="COM DIREITA" value={fmtNum(raw(found1, "votos_com_direita"))} color="#2b5490" />
                  <StatCard label="% COM DIREITA" value={fmtPct(raw(found1, "pct_com_direita"))} color={color} />
                </div>
                {vies1Matches.length > 1 ? (
                  <p className="mt-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    + {vies1Matches.length - 1} outro(s) registro(s) para esta busca (ex.: troca de partido). Exibindo o de maior base de votos.
                  </p>
                ) : null}
              </div>

              {/* ── 9.3 OBSERVAR O VOTO DE PROPOSTA (voto real do deputado) ── */}
              <div className="mt-10">
                <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>9.3 — OBSERVAR O VOTO DE PROPOSTA</p>
                <h3 className="mb-2 text-2xl font-black md:text-3xl" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>Como {text(found1, "nome_deputado")} votou em cada proposta</h3>
                <p className="mb-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Voto real do deputado nas propostas que dividem esquerda e direita. A coluna "votou com" indica de qual campo o voto se aproximou em cada proposta. Use o filtro para separar as propostas do campo da esquerda e da direita.
                </p>
                <p className="mb-5 max-w-3xl text-xs leading-relaxed text-muted-foreground" style={{ fontFamily: MONO }}>
                  Exibe ate as 50 votacoes mais polarizadas do deputado (maior divergencia esquerda x direita).
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {(["todos", "esquerda", "direita"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBancadaCampo(c)}
                      className="border px-3 py-1.5 text-xs font-bold"
                      style={{ fontFamily: MONO, borderColor: bancadaCampo === c ? RED : "var(--border)", color: bancadaCampo === c ? RED : "var(--muted-foreground)" }}
                    >
                      {c === "todos" ? `TODAS (${depVotosRows.length})` : c === "esquerda" ? "CAMPO ESQUERDA" : "CAMPO DIREITA"}
                    </button>
                  ))}
                </div>

                {depVotosLoading ? (
                  <EmptyPanel text="CARREGANDO VOTOS DO DEPUTADO..." />
                ) : depVotosFiltered.length ? (
                  <div className="overflow-x-auto border border-border" style={{ background: "var(--card)" }}>
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-background">
                        <tr>
                          {["ano", "votacao", "proposta", "campo", "voto", "votou com"].map((h) => (
                            <th key={h} className="whitespace-nowrap px-4 py-3 text-xs font-normal uppercase text-muted-foreground" style={{ fontFamily: MONO }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {depVotosFiltered.slice(0, 80).map((p, i) => (
                          <tr key={`${p.id_votacao}-${i}`} className="border-t border-border">
                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground" style={{ fontFamily: MONO }}>{p.ano}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground" style={{ fontFamily: MONO }}>{p.id_votacao}</td>
                            <td className="px-4 py-3 text-foreground">{p.titulo}</td>
                            <td className="px-4 py-3"><IdeologyBadge ideology={p.campo} /></td>
                            <td className="whitespace-nowrap px-4 py-3 font-bold" style={{ fontFamily: MONO, color: p.voto === "Sim" ? "#4a7c59" : RED }}>{p.voto}</td>
                            <td className="px-4 py-3"><IdeologyBadge ideology={p.votou_com} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyPanel text="Sem votos em propostas polarizadas para este deputado." />
                )}
              </div>
            </>
          );
        })()}
      </section>
      )}

      {/* ── Q9.1 CLASSIFICAÇÃO ── */}
      {activeSection === "classificacao" && (
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader n="9.1" tag="CLASSIFICACAO DOS PARTIDOS" title="Qual o vies de cada partido?" desc="Cada partido foi classificado por espectro ideologico. O grafico mostra a distribuicao dos partidos por campo politico e lista os integrantes de cada grupo." />

        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-4" style={{ background: "var(--secondary)" }}>
          <StatCard label="PARTIDOS MAPEADOS" value={fmtNum(totalPartidos)} />
          <StatCard label="CAMPOS IDEOLOGICOS" value={fmtNum(ideologiaGroups.length)} />
          <StatCard label="DEPUTADOS ANALISADOS" value={fmtNum(totalDeputados)} color="#d6a84f" />
          <StatCard label="VOTACOES COM DADOS" value={fmtNum(totalVotacoes)} color="#4f6fad" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>DISTRIBUICAO POR CAMPO POLITICO</p>
            {pieData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="52%" outerRadius="76%" paddingAngle={3}
                      label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                      {pieData.map((entry) => <Cell key={entry.ideologia} fill={IDEOLOGY_COLORS[entry.ideologia] ?? "#555"} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(value, name) => [`${value} partidos`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyPanel text="Sem dados de ideologia." />}
          </div>

          <div className="space-y-3">
            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>PARTIDOS POR CAMPO</p>
            {ideologiaGroups.map((group) => {
              const color = IDEOLOGY_COLORS[group.ideologia] ?? "#555";
              return (
                <div key={group.ideologia} className="border border-border p-4" style={{ background: "var(--card)", borderLeft: `3px solid ${color}` }}>
                  <div className="mb-2 flex items-center justify-between">
                    <IdeologyBadge ideology={group.ideologia} />
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{group.qtd} partido{group.qtd !== 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">{group.partidos.join(", ")}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <SimpleTable rows={q91Rows} columns={["sigla_partido", "ideologia"]} empty="Sem dados de classificacao." />
        </div>
      </section>
      )}

      {/* ── Q9.2 CORRELAÇÃO ── */}
      {activeSection === "correlacao" && (
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader n="9.2" tag="CORRELACAO PARTIDO X PROPOSTA" title="Qual campo vota mais Sim?" desc="Para cada votacao, calculamos o percentual de votos Sim por campo ideologico. O resumo exibe a media de apoio de cada campo ao longo de todo o periodo." />

        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-2" style={{ background: "var(--secondary)" }}>
          <StatCard label="VOTACOES ANALISADAS" value={fmtNum(totalVotacoes)} />
          <StatCard label="REGISTROS IDEOLOGIA X VOTACAO" value={fmtNum(q92Rows.length)} color="#d6a84f" />
        </div>

        {q92Summary.length ? (
          <>
            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>MEDIA DE APOIO (% SIM) POR CAMPO</p>
            <div className="mb-8 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q92Summary} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="ideologia" width={110} tick={{ fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v: string) => IDEOLOGY_LABELS[v] ?? v} />
                  <Tooltip {...tooltipStyle} formatter={(value, _n, props) => [`${value}%`, `${IDEOLOGY_LABELS[props.payload.ideologia] ?? props.payload.ideologia} · ${fmtNum(props.payload.total)} registros`]} />
                  <Bar dataKey="media_pct_sim" maxBarSize={28} label={{ position: "right", fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO, formatter: (v: number) => fmtPct(v) }}>
                    {q92Summary.map((e) => <Cell key={e.ideologia} fill={IDEOLOGY_COLORS[e.ideologia] ?? "#555"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}

        <p className="mb-3 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>DETALHE IDEOLOGIA — PRIMEIRAS VOTACOES</p>
        <SimpleTable rows={q92Rows.slice(0, 50)} columns={["ano_dados", "id_votacao", "titulo_proposicao", "ideologia", "votos_sim", "votos_nao", "pct_sim"]} empty="Sem dados de correlacao." />

        {/* ── Q9.2 visão por partido (partido x proposta) ── */}
        {q92PartidoResumo.length ? (
          <div className="mt-12 border-t border-border pt-10">
            <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>VISAO POR PARTIDO</p>
            <h3 className="mb-3 text-2xl font-black md:text-3xl" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>Cada partido votou mais Sim ou Nao?</h3>
            <p className="mb-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Agora descendo do campo ideologico para o partido: a media de % Sim de cada legenda, se a maioria votou Sim ou Nao no periodo, e o quanto o voto da bancada bateu com a orientacao oficial do partido.
            </p>

            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>MEDIA DE % SIM POR PARTIDO</p>
            <div className="mb-8" style={{ height: Math.max(360, q92PartidoResumo.length * 26) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q92PartidoResumo} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="sigla_partido" width={90} tick={{ fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(value, _n, props) => [`${value}% Sim`, `${props.payload.sigla_partido} · ${IDEOLOGY_LABELS[props.payload.ideologia] ?? props.payload.ideologia} · ${fmtNum(props.payload.votacoes)} votacoes`]} />
                  <Bar dataKey="media_pct_sim" maxBarSize={20} label={{ position: "right", fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO, formatter: (v: number) => fmtPct(v) }}>
                    {q92PartidoResumo.map((row) => <Cell key={text(row, "sigla_partido")} fill={IDEOLOGY_COLORS[text(row, "ideologia")] ?? "#555"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="mb-3 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>RESUMO POR PARTIDO</p>
            <SimpleTable
              rows={q92PartidoResumo}
              columns={["sigla_partido", "ideologia", "votacoes", "media_pct_sim", "orientacoes", "pct_orientacao_seguida", "votou_mais"]}
              empty="Sem dados por partido."
            />

            {q92PartidoDetalhe.length ? (
              <div className="mt-10">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <p className="text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>DETALHE — VOTO DO PARTIDO POR PROPOSTA</p>
                  <select
                    value={selectedPartido}
                    onChange={(e) => setSelectedPartido(e.target.value)}
                    className="border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                    style={{ fontFamily: MONO }}
                  >
                    <option value="">TODOS (amostra)</option>
                    {partidoOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="relative">
                    <input
                      value={detSearch}
                      onChange={(e) => setDetSearch(e.target.value)}
                      placeholder="Pesquisar proposta ou id..."
                      className="w-60 border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                      style={{ fontFamily: MONO }}
                    />
                    {detSearch ? (
                      <button type="button" onClick={() => setDetSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground" style={{ fontFamily: MONO }}>✕</button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>ANO:</span>
                    <button
                      type="button"
                      onClick={() => setDetYear("")}
                      className="border px-2.5 py-1 text-xs font-bold"
                      style={{ fontFamily: MONO, borderColor: !detYear ? RED : "var(--border)", color: !detYear ? RED : "var(--muted-foreground)" }}
                    >
                      TODOS
                    </button>
                    {ANOS_LEGISLATURA.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setDetYear(y)}
                        className="border px-2.5 py-1 text-xs font-bold"
                        style={{ fontFamily: MONO, borderColor: detYear === y ? RED : "var(--border)", color: detYear === y ? RED : "var(--muted-foreground)" }}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {partidoVotosLoading ? (
                  <EmptyPanel text="CARREGANDO PROPOSTAS DO PARTIDO..." />
                ) : (
                  <>
                    <SimpleTable
                      rows={detalheSearched.slice(0, detShown)}
                      columns={["ano_dados", "id_votacao", "titulo_proposicao", "sigla_partido", "votos_sim", "votos_nao", "pct_sim", "orientacao_partido"]}
                      empty={selectedPartido ? "Nenhuma proposta encontrada para este partido." : "Nenhuma proposta encontrada."}
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      {detShown < detalheSearched.length ? (
                        <button
                          type="button"
                          onClick={() => setDetShown((v) => v + 60)}
                          className="border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                          style={{ fontFamily: MONO }}
                        >
                          MOSTRAR MAIS 60
                        </button>
                      ) : null}
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        Exibindo {fmtNum(Math.min(detShown, detalheSearched.length))} de {fmtNum(detalheSearched.length)}
                        {selectedPartido ? ` (${selectedPartido})` : " (amostra de 200)"}
                        {detSearch ? " · filtrado" : ""}.
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
      )}

      {/* ── Q9.4 VOTAÇÕES POLARIZADAS ── */}
      {activeSection === "votacoes-polarizadas" && (
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader
          n="9.4"
          tag="VOTACOES POLARIZADAS"
          title="Onde esquerda e direita divergiram de verdade?"
          desc="Filtramos as votacoes em que a diferenca entre o % Sim da esquerda e da direita foi de 30 pontos percentuais ou mais. Essas sao as votacoes que realmente revelam posicionamento ideologico."
        />

        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-3" style={{ background: "var(--secondary)" }}>
          <StatCard label="VOTACOES POLARIZADAS" value={fmtNum(totalPolarizadas)} sub="divergencia >= 30pp entre esq e dir" />
          <StatCard label="MAIOR DIVERGENCIA" value={q94Rows[0] ? fmtPct(raw(q94Rows[0], "divergencia_esq_dir")) : "-"} sub={q94Rows[0] ? text(q94Rows[0], "titulo_proposicao").slice(0, 40) + "…" : ""} color="#d6a84f" />
          <StatCard label="FAVORAVEIS A ESQUERDA" value={fmtNum(q94Rows.filter((r) => text(r, "campo_favoravel") === "esquerda favoravel").length)} color={RED} />
        </div>

        {q94Rows.length ? (
          <>
            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>TOP 15 MAIS POLARIZADAS</p>
            <div className="mb-8 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q94Rows.slice(0, 15)} layout="vertical" margin={{ left: 0, right: 50, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="id_votacao" width={72} tick={{ fill: "var(--chart-axis-fill)", fontSize: 9, fontFamily: MONO }} axisLine={false} tickLine={false} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value, name, props) => {
                      const r = props.payload;
                      return [`Esq ${fmtPct(raw(r, "pct_sim_esquerda"))} / Dir ${fmtPct(raw(r, "pct_sim_direita"))} / Ctr ${fmtPct(raw(r, "pct_sim_centro"))}`, text(r, "titulo_proposicao").slice(0, 60)];
                    }}
                  />
                  <Bar dataKey="divergencia_esq_dir" maxBarSize={22} label={{ position: "right", fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO, formatter: (v: number) => fmtPct(v) }}>
                    {q94Rows.slice(0, 15).map((row) => (
                      <Cell key={text(row, "id_votacao")} fill={text(row, "campo_favoravel") === "esquerda favoravel" ? RED : "#2b5490"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="mb-3 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>TABELA DE VOTACOES POLARIZADAS</p>
            <SimpleTable
              rows={q94Rows.slice(0, q94RowsShown)}
              columns={["ano_dados", "id_votacao", "titulo_proposicao", "pct_sim_esquerda", "pct_sim_centro", "pct_sim_direita", "divergencia_esq_dir", "campo_favoravel"]}
              empty="Sem votacoes polarizadas."
            />
            {q94RowsShown < q94Rows.length ? (
              <button type="button" onClick={() => setQ94RowsShown((v) => v + 20)}
                className="mt-4 border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary" style={{ fontFamily: MONO }}>
                CARREGAR MAIS
              </button>
            ) : null}
          </>
        ) : (
          <EmptyPanel text="Dados de votacoes polarizadas ainda nao disponíveis. Execute o SQL atualizado da Q9." />
        )}
      </section>
      )}

      {/* ── Q9.5 SCORE DE VIÉS ── */}
      {activeSection === "vies-deputado" && (
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader
          n="9.5"
          tag="VIES INDIVIDUAL DO DEPUTADO"
          title="Onde cada deputado se posiciona de verdade?"
          desc="Score calculado apenas nas votacoes polarizadas: 0 = votou sempre com a esquerda, 100 = votou sempre com a direita. Independe do rotulo do partido."
        />

        {/* Busca */}
        <div className="mb-8">
          <p className="mb-2 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>BUSCAR DEPUTADO OU PARTIDO</p>
          <div className="relative max-w-md">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome do deputado ou sigla do partido..."
              className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              style={{ fontFamily: MONO }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground" style={{ fontFamily: MONO }}>
                ✕ LIMPAR
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="mt-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              {searchFiltered.length} resultado{searchFiltered.length !== 1 ? "s" : ""} encontrado{searchFiltered.length !== 1 ? "s" : ""}
              {!hasScoreData ? " · mostrando dados de aderencia (score de vies disponivel apos rodar o SQL atualizado)" : ""}
            </p>
          )}
        </div>

        {/* Card do deputado encontrado */}
        {foundDeputy && (() => {
          const score = hasScoreData ? raw(foundDeputy, "score_vies") : null;
          const aderencia = raw(foundDeputy, "pct_aderencia_partido");
          const ideologia = text(foundDeputy, "ideologia_partido") || text(foundDeputy, "ideologia");
          const cardColor = score !== null ? scoreColor(score) : (IDEOLOGY_COLORS[ideologia] ?? "#888");
          return (
            <div className="mb-8 border border-border p-6" style={{ background: "var(--card)", borderLeft: `4px solid ${cardColor}` }}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>{text(foundDeputy, "nome_deputado")}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    <span>{text(foundDeputy, "sigla_partido")}</span>
                    <IdeologyBadge ideology={ideologia} />
                  </p>
                </div>
                <div className="text-right">
                  {score !== null ? (
                    <>
                      <p className="text-4xl font-black" style={{ fontFamily: SERIF, color: cardColor }}>
                        {score.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                      </p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>SCORE VIES 0–100</p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-black" style={{ fontFamily: SERIF, color: cardColor }}>
                        {fmtPct(aderencia)}
                      </p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>ADERENCIA AO PARTIDO</p>
                    </>
                  )}
                </div>
              </div>

              {score !== null && (
                <div className="mb-4">
                  <ScoreBar score={score} />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    <span style={{ color: RED }}>← ESQUERDA</span>
                    <span>CENTRO</span>
                    <span style={{ color: "#2b5490" }}>DIREITA →</span>
                  </div>
                </div>
              )}

              {score !== null ? (
                <div className="grid grid-cols-2 gap-px border border-border md:grid-cols-4" style={{ background: "var(--secondary)" }}>
                  <StatCard label="VOTOS EM POLARIZADAS" value={fmtNum(raw(foundDeputy, "votos_em_polarizadas"))} />
                  <StatCard label="COM ESQUERDA" value={fmtNum(raw(foundDeputy, "votos_com_esquerda"))} color={RED} />
                  <StatCard label="COM DIREITA" value={fmtNum(raw(foundDeputy, "votos_com_direita"))} color="#2b5490" />
                  <StatCard label="% COM DIREITA" value={fmtPct(raw(foundDeputy, "pct_com_direita"))} color={cardColor} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-px border border-border md:grid-cols-3" style={{ background: "var(--secondary)" }}>
                  <StatCard label="TOTAL DE VOTOS" value={fmtNum(raw(foundDeputy, "total_votos"))} />
                  <StatCard label="SEGUIU PARTIDO" value={fmtNum(raw(foundDeputy, "seguiu_orientacao"))} color="#4a7c59" />
                  <StatCard label="CONTRARIOU" value={fmtNum(raw(foundDeputy, "contrariou_orientacao"))} color={RED} />
                </div>
              )}

              {searchFiltered.length > 1 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>OUTROS RESULTADOS</p>
                  <div className="space-y-2">
                    {searchFiltered.slice(1, 5).map((row, i) => {
                      const rowScore = hasScoreData ? raw(row, "score_vies") : null;
                      return (
                        <button key={`${text(row, "id_deputado")}-${i}`} type="button"
                          onClick={() => setSearch(text(row, "nome_deputado"))}
                          className="flex w-full items-center justify-between border border-border px-4 py-2 text-xs hover:border-primary"
                          style={{ background: "var(--card)", fontFamily: MONO }}>
                          <span>{text(row, "nome_deputado")} · {text(row, "sigla_partido")}</span>
                          {rowScore !== null
                            ? <span style={{ color: scoreColor(rowScore) }}>SCORE {rowScore.toFixed(1)}</span>
                            : <span style={{ color: "#d6a84f" }}>ADERENCIA {fmtPct(raw(row, "pct_aderencia_partido"))}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {!searchTerm && q95Sorted.length ? (
          <>
            {/* Grafico espectro — top e bottom 20 */}
            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>
              ESPECTRO — 20 MAIS A ESQUERDA E 20 MAIS A DIREITA
            </p>
            <div className="mb-8 overflow-x-auto">
              <div className="flex min-w-[640px] items-end justify-center gap-1 h-40">
                {[...q95Sorted.slice(0, 20), ...q95Sorted.slice(-20)].map((row, i) => {
                  const score = raw(row, "score_vies");
                  const color = scoreColor(score);
                  const heightPct = Math.max(20, score);
                  return (
                    <div key={`${text(row, "id_deputado")}-${i}`} className="group relative flex flex-col items-center" style={{ width: 16 }}>
                      <div className="w-full rounded-sm" style={{ height: `${heightPct * 0.9}px`, background: color, opacity: 0.85 }} />
                      <div className="pointer-events-none absolute bottom-full mb-1 hidden w-48 border border-border p-2 text-xs group-hover:block" style={{ background: "var(--card)", fontFamily: MONO, zIndex: 10 }}>
                        <p style={{ color }}>{text(row, "nome_deputado")}</p>
                        <p className="text-muted-foreground">{text(row, "sigla_partido")} · SCORE {score.toFixed(1)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 flex min-w-[640px] justify-between text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                <span style={{ color: RED }}>← 20 MAIS A ESQUERDA</span>
                <span style={{ color: "#2b5490" }}>20 MAIS A DIREITA →</span>
              </div>
            </div>

            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>RANKING COMPLETO (DO MAIS A ESQUERDA AO MAIS A DIREITA)</p>
            <div className="space-y-2">
              {q95Sorted.slice(0, q95Shown).map((row) => {
                const score = raw(row, "score_vies");
                const color = scoreColor(score);
                return (
                  <div key={text(row, "id_deputado")} className="border border-border p-4" style={{ background: "var(--card)" }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{text(row, "nome_deputado")}</span>
                          <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{text(row, "sigla_partido")}</span>
                          <IdeologyBadge ideology={text(row, "ideologia_partido")} />
                        </div>
                        <ScoreBar score={score} />
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-xl font-black" style={{ fontFamily: SERIF, color }}>{score.toFixed(1)}</span>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{fmtNum(raw(row, "votos_em_polarizadas"))} votos</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {q95Shown < q95Sorted.length ? (
              <button
                type="button"
                onClick={() => setQ95Shown((v) => v + 60)}
                className="mt-4 border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                style={{ fontFamily: MONO }}
              >
                CARREGAR MAIS ({fmtNum(q95Sorted.length - q95Shown)} restantes)
              </button>
            ) : null}
          </>
        ) : !searchTerm ? (
          <EmptyPanel text="Score de vies ainda nao disponivel. Execute o SQL atualizado da Q9." />
        ) : null}

        {searchTerm && searchFiltered.length === 0 && (
          <EmptyPanel text={`Nenhum deputado encontrado para "${search}".`} />
        )}
      </section>
      )}

      {/* ── Q9.3 ADESÃO ── */}
      {activeSection === "voto-cada" && (
      <section className="px-6 py-14 md:px-14">
        <SectionHeader n="9.3" tag="VOTO DE CADA DEPUTADO" title="Quem segue o partido — e quem contraria?" desc="Percentual de votos em que o deputado seguiu a orientacao oficial do partido nas votacoes em que havia diretriz explicita registrada." />

        {q93Rows.length ? (
          <>
            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>TOP 20 — MAIOR ADERENCIA AO PARTIDO</p>
            <div className="mb-8" style={{ height: Math.max(360, Math.min(q93Rows.length, 20) * 34) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q93Rows.slice(0, 20)} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="nome_deputado" width={160} tick={{ fill: "var(--chart-axis-fill)", fontSize: 9, fontFamily: MONO }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(value, _n, props) => [`${value}%`, `${props.payload.nome_deputado} · ${props.payload.sigla_partido}`]} />
                  <Bar dataKey="pct_aderencia_partido" maxBarSize={22} label={{ position: "right", fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO, formatter: (v: number) => fmtPct(v) }}>
                    {q93Rows.slice(0, 20).map((row) => <Cell key={text(row, "id_deputado")} fill={IDEOLOGY_COLORS[text(row, "ideologia")] ?? "#555"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <SimpleTable
              rows={q93Rows.slice(0, q93RowsShown)}
              columns={["sigla_partido", "nome_deputado", "ideologia", "total_votos", "seguiu_orientacao", "contrariou_orientacao", "pct_aderencia_partido"]}
              empty="Sem dados de aderencia."
            />
            {q93RowsShown < q93Rows.length ? (
              <button type="button" onClick={() => setQ93RowsShown((v) => v + 30)}
                className="mt-4 border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary" style={{ fontFamily: MONO }}>
                CARREGAR MAIS LINHAS
              </button>
            ) : null}
          </>
        ) : <EmptyPanel text="Sem dados de aderencia por deputado." />}
      </section>
      )}

      {/* ── 9.6 OBSERVAR UMA PROPOSTA -> VOTO DE CADA DEPUTADO ── */}
      {activeSection === "observar-proposta" && (
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader
          n="9.6"
          tag="OBSERVAR UMA PROPOSTA"
          title="Como cada deputado votou numa proposta?"
          desc="Escolha uma votacao de plenario e veja o voto individual de TODOS os deputados — com partido, UF e o voto (Sim, Nao, Abstencao...). Cobre todas as votacoes nominais de plenario, sem corte por deputado."
        />

        <div className="mb-4 max-w-2xl">
          <p className="mb-2 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>1. ESCOLHA A PROPOSTA / VOTACAO</p>
          <div className="relative">
            <input
              value={votacaoQuery}
              onChange={(e) => setVotacaoQuery(e.target.value)}
              placeholder="Pesquisar por titulo ou id da votacao..."
              className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              style={{ fontFamily: MONO }}
            />
            {votacaoQuery ? (
              <button type="button" onClick={() => setVotacaoQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground" style={{ fontFamily: MONO }}>✕</button>
            ) : null}
          </div>
        </div>

        <div className="mb-8 max-h-72 overflow-y-auto border border-border" style={{ background: "var(--card)" }}>
          {votacaoMatches.length === 0 ? (
            <div className="px-4 py-6 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>Nenhuma votacao encontrada.</div>
          ) : votacaoMatches.map((r) => {
            const id = text(r, "id_votacao");
            const isSel = selectedVotacaoId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedVotacao(r)}
                className="flex w-full items-center justify-between gap-4 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
                style={{ background: isSel ? "rgba(196,18,48,0.09)" : undefined }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{text(r, "titulo_proposicao")}</span>
                  <span className="block text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{text(r, "ano_dados")} · {id} · {fmtNum(raw(r, "total_votos"))} votos</span>
                </span>
                <span className="shrink-0 text-xs" style={{ fontFamily: MONO }}>
                  <span style={{ color: "#4a7c59" }}>{fmtNum(raw(r, "votos_sim"))} Sim</span>{" · "}<span style={{ color: RED }}>{fmtNum(raw(r, "votos_nao"))} Nao</span>
                </span>
              </button>
            );
          })}
        </div>

        {!selectedVotacao ? (
          <EmptyPanel text="Selecione uma votacao acima para ver o voto de cada deputado." />
        ) : votacaoVotosLoading ? (
          <EmptyPanel text="CARREGANDO VOTOS... (a base completa de votos e carregada na primeira consulta — pode levar alguns segundos)" />
        ) : (
          <>
            <div className="mb-6 border-l-4 py-4 pl-5" style={{ background: "var(--card)", borderColor: RED }}>
              <h3 className="text-xl font-black" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>{text(selectedVotacao, "titulo_proposicao")}</h3>
              <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{text(selectedVotacao, "ano_dados")} · {selectedVotacaoId}</p>
              <div className="mt-4 grid grid-cols-2 gap-px border border-border md:grid-cols-4" style={{ background: "var(--secondary)" }}>
                <StatCard label="DEPUTADOS" value={fmtNum(vvCounts.total)} />
                <StatCard label="SIM" value={fmtNum(vvCounts.sim)} color="#4a7c59" />
                <StatCard label="NAO" value={fmtNum(vvCounts.nao)} color={RED} />
                <StatCard label="OUTROS" value={fmtNum(vvCounts.out)} color="#888" />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>VOTO:</span>
              <div className="flex flex-wrap gap-1.5">
                {([["todos", "TODOS"], ["Sim", "SIM"], ["Nao", "NAO"], ["outros", "OUTROS"]] as const).map(([val, lab]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setVvVoto(val)}
                    className="border px-2.5 py-1 text-xs font-bold"
                    style={{ fontFamily: MONO, borderColor: vvVoto === val ? RED : "var(--border)", color: vvVoto === val ? RED : "var(--muted-foreground)" }}
                  >
                    {lab}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  value={vvDepSearch}
                  onChange={(e) => setVvDepSearch(e.target.value)}
                  placeholder="Filtrar deputado ou partido..."
                  className="w-60 border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                  style={{ fontFamily: MONO }}
                />
                {vvDepSearch ? (
                  <button type="button" onClick={() => setVvDepSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground" style={{ fontFamily: MONO }}>✕</button>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto border border-border" style={{ background: "var(--card)" }}>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-background">
                  <tr>
                    {["deputado", "partido", "uf", "voto"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-xs font-normal uppercase text-muted-foreground" style={{ fontFamily: MONO }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vvFiltered.slice(0, vvShown).map((r, i) => {
                    const v = text(r, "voto");
                    const vc = v === "Sim" ? "#4a7c59" : v === "Nao" ? RED : "#888";
                    return (
                      <tr key={`${text(r, "id_deputado")}-${i}`} className="border-t border-border">
                        <td className="px-4 py-3 text-foreground" style={{ fontFamily: SERIF }}>{text(r, "nome_deputado")}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground" style={{ fontFamily: MONO }}>{text(r, "sigla_partido")}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground" style={{ fontFamily: MONO }}>{text(r, "sigla_uf")}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-bold" style={{ fontFamily: MONO, color: vc }}>{v}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {vvFiltered.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>Nenhum deputado para este filtro.</p>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {vvShown < vvFiltered.length ? (
                  <button type="button" onClick={() => setVvShown((v) => v + 60)} className="border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary" style={{ fontFamily: MONO }}>MOSTRAR MAIS 60</button>
                ) : null}
                <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>Exibindo {fmtNum(Math.min(vvShown, vvFiltered.length))} de {fmtNum(vvFiltered.length)}.</span>
              </div>
            )}
          </>
        )}
      </section>
      )}

      {/* ── METODOLOGIA ── */}
      {activeSection === "metodologia" && (
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <p className="mb-8 text-sm font-black uppercase tracking-[0.35em] md:text-base" style={{ fontFamily: MONO, color: RED }}>METODOLOGIA — COMO CHEGAMOS AQUI</p>

        <CollapsibleMethod n="9.1" title="CLASSIFICACAO DOS PARTIDOS POR IDEOLOGIA" sub="Como mapeamos o espectro politico de cada partido" open={methQ91Open} onToggle={() => setMethQ91Open((v) => !v)}>
          <MethodSteps steps={[
            { n: "01", title: "Tabela de referencia", body: "A classificacao vem da tabela partidos_ideologia, construida com base em historico parlamentar e analises de plataformas de dados politicos." },
            { n: "02", title: "Tres campos", body: "Os partidos foram agrupados em esquerda, centro e direita. Partidos sem registro recebem o rotulo nao classificado." },
            { n: "03", title: "Uso nos graficos", body: "A ideologia e usada como eixo de cor em todos os graficos deste recorte: vermelho = esquerda, dourado = centro, azul = direita." },
          ]} />
        </CollapsibleMethod>

        <CollapsibleMethod n="9.2" title="CORRELACAO IDEOLOGIA X PROPOSICAO" sub="Como medimos o apoio de cada campo politico a cada votacao" open={methQ92Open} onToggle={() => setMethQ92Open((v) => !v)}>
          <MethodSteps steps={[
            { n: "01", title: "Cruzar voto com ideologia", body: "Para cada voto registrado, buscamos o partido do deputado e sua ideologia. Cada voto e classificado como pertencendo a um campo." },
            { n: "02", title: "Agrupar por votacao e ideologia", body: "Para cada votacao, contamos quantos votos Sim, Nao e outros cada campo emitiu." },
            { n: "03", title: "Calcular % Sim por campo", body: "pct_sim = (votos_sim / total_votos) x 100. Mostra o quao favoravel cada campo foi a proposicao votada." },
            { n: "04", title: "Media geral", body: "O grafico exibe a media de pct_sim de cada campo ao longo de todas as votacoes — revelando a tendencia geral de cada espectro." },
          ]} />
        </CollapsibleMethod>

        <CollapsibleMethod n="9.4" title="VOTACOES POLARIZADAS" sub="Como identificamos as votacoes que realmente revelam posicionamento ideologico" open={methQ94Open} onToggle={() => setMethQ94Open((v) => !v)}>
          <MethodSteps steps={[
            { n: "01", title: "Calcular pct_sim por campo em cada votacao", body: "Para cada votacao, computamos separadamente o % de Sim votado pela esquerda e pela direita." },
            { n: "02", title: "Filtrar divergencia >= 30pp", body: "Mantemos apenas votacoes onde |pct_sim_esquerda - pct_sim_direita| >= 30. Abaixo disso, a votacao nao distingue os campos ideologicos de forma relevante." },
            { n: "03", title: "Identificar campo favoravel", body: "Se esquerda votou mais Sim: 'esquerda favoravel'. Se direita votou mais Sim: 'direita favoravel'. Isso rotula cada votacao com a orientacao politica que a apoiou." },
            { n: "04", title: "Ordenar por divergencia", body: "Votacoes com maior diferenca aparecem primeiro — sao as que mais polarizaram o plenario ao longo da legislatura." },
          ]} />
        </CollapsibleMethod>

        <CollapsibleMethod n="9.5" title="VIES DO DEPUTADO — SCORE 0 A 100" sub="Como descobrimos a esquerda/centro/direita de cada deputado pelo voto real, nao pelo rotulo do partido" open={methQ95Open} onToggle={() => setMethQ95Open((v) => !v)}>
          <MethodSteps steps={[
            { n: "01", title: "O partido e so o ponto de partida", body: "A ideologia do partido (Q9.1) entra como referencia inicial, mas nao define o vies — o que vale e o voto real do deputado. Por isso um deputado de um partido de 'centro' pode terminar classificado como direita ou esquerda." },
            { n: "02", title: "Usar so as votacoes polarizadas", body: "Consideramos apenas as votacoes em que esquerda e direita divergiram >= 30 pontos percentuais (Q9.4). Em votacoes consensuais quase todos votam igual, entao elas nao revelam posicionamento ideologico." },
            { n: "03", title: "Achar o campo favoravel de cada votacao", body: "Em cada votacao polarizada comparamos o % de Sim da esquerda e da direita. O campo com maior apoio e o 'campo favoravel' daquela proposta — esquerda ou direita." },
            { n: "04", title: "Classificar o voto do deputado", body: "Se a esquerda favoreceu e o deputado votou Sim, ele votou 'com a esquerda'; se votou Nao, 'com a direita'. Quando a direita favorece, vale o inverso. Votos que nao sao Sim/Nao sao ignorados." },
            { n: "05", title: "Calcular o score (0 a 100)", body: "score = votos_com_direita / (votos_com_esquerda + votos_com_direita) x 100. Zero = sempre acompanhou a esquerda; cem = sempre a direita; cinquenta = equidistante." },
            { n: "06", title: "Classificar o vies final pelo comportamento", body: "0 a 35 = esquerda · 35 a 65 = centro · 65 a 100 = direita. A classificacao final vem do comportamento de voto, nao do rotulo do partido." },
            { n: "07", title: "Base minima e auditoria voto a voto", body: "Deputados com menos de 10 votos em polarizadas ficam de fora (base insuficiente). Em 'Observar o voto de proposta' da-se para auditar, voto a voto, as ate 50 votacoes mais polarizadas de cada deputado — com o campo (esquerda/direita) e como ele votou." },
          ]} />
        </CollapsibleMethod>

        <CollapsibleMethod n="9.3" title="ADERENCIA INDIVIDUAL AOS PARTIDOS" sub="Como calculamos se cada deputado seguiu ou contrariou seu partido" open={methQ93Open} onToggle={() => setMethQ93Open((v) => !v)}>
          <MethodSteps steps={[
            { n: "01", title: "Buscar orientacao do partido", body: "Para cada voto, verificamos se o partido emitiu orientacao de bancada. Liberado, Abstencao e Obstrucao sao excluidos." },
            { n: "02", title: "Classificar cada voto", body: "Voto igual a orientacao = Seguiu. Voto diferente = Contrariou. Sem orientacao registrada = excluido do calculo." },
            { n: "03", title: "Agregar por deputado", body: "Acumulamos Seguiu e Contrariou de todos os anos e votacoes do periodo para cada deputado." },
            { n: "04", title: "Calcular aderencia", body: "pct_aderencia = (seguiu / (seguiu + contrariou)) x 100. Difere do score 9.5: aqui comparamos com a orientacao do proprio partido, nao com a posicao dos campos ideologicos." },
          ]} />
        </CollapsibleMethod>
      </section>
      )}
    </div>
  );
}
