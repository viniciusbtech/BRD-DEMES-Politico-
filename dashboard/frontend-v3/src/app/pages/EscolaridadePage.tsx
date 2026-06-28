import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchQuestion } from "../api";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import type { QuestionPayload } from "../types";

type EscolaridadePageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
  onNavigateRecorte: (path: string) => void;
};

type Row = Record<string, unknown>;

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const RED = "#c41230";

// Ordem canônica dos níveis de instrução (do menor ao maior)
const NIVEL_ORDER = [
  "Primário Incompleto",
  "Primario Incompleto",
  "Ensino Fundamental",
  "Ensino Médio Incompleto",
  "Ensino Medio Incompleto",
  "Ensino Médio",
  "Ensino Medio",
  "Secundário Incompleto",
  "Secundario Incompleto",
  "Secundário",
  "Secundario",
  "Superior Incompleto",
  "Superior",
  "Pós-Graduação",
  "Pos-Graduacao",
  "Mestrado Incompleto",
  "Mestrado",
  "Doutorado Incompleto",
  "Doutorado",
  "Nao informado",
];

const EDU_COLORS: Record<string, string> = {
  "Primário Incompleto": "#8b1a1a",
  "Primario Incompleto": "#8b1a1a",
  "Ensino Fundamental": "#c41230",
  "Ensino Médio Incompleto": "#c4562a",
  "Ensino Medio Incompleto": "#c4562a",
  "Ensino Médio": "#c4813a",
  "Ensino Medio": "#c4813a",
  "Secundário Incompleto": "#b8980a",
  "Secundario Incompleto": "#b8980a",
  "Secundário": "#a08a10",
  "Secundario": "#a08a10",
  "Superior Incompleto": "#6b8cba",
  "Superior": "#4f6fad",
  "Pós-Graduação": "#3a5a9a",
  "Pos-Graduacao": "#3a5a9a",
  "Mestrado Incompleto": "#2a4f90",
  "Mestrado": "#2b5490",
  "Doutorado Incompleto": "#1e3d7a",
  "Doutorado": "#1a2f68",
  "Nao informado": "#555",
};

function eduColor(nivel: string): string {
  return EDU_COLORS[nivel] ?? "#888";
}

function sortByNivel<T extends Row>(rows: T[], key = "escolaridade"): T[] {
  return [...rows].sort((a, b) => {
    const ia = NIVEL_ORDER.indexOf(String(a[key] ?? ""));
    const ib = NIVEL_ORDER.indexOf(String(b[key] ?? ""));
    if (ia === -1 && ib === -1) return String(a[key]).localeCompare(String(b[key]));
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

const raw = (row: Row | undefined, key: string) => Number(row?.[key] ?? 0);
const text = (row: Row | undefined, key: string) => String(row?.[key] ?? "");
const fmtNum = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtPct = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const TOOLTIP = {
  contentStyle: {
    background: "var(--chart-tooltip-bg)",
    border: "1px solid var(--chart-tooltip-border)",
    fontFamily: MONO,
    fontSize: 11,
    color: "var(--chart-tooltip-text)",
  },
  itemStyle: { color: "var(--chart-tooltip-text)" },
  labelStyle: { color: "var(--chart-tooltip-text)" },
};

function SectionHeader({ n, tag, title, desc }: { n: string; tag: string; title: string; desc: string }) {
  return (
    <div className="mb-10">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span
          className="text-5xl font-black leading-none md:text-6xl"
          style={{ fontFamily: SERIF, color: "#e00836", textShadow: "0 0 18px rgba(224,8,54,0.22)" }}
        >
          {n}
        </span>
        <span className="text-sm font-black uppercase tracking-[0.3em] md:text-base" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{tag}</span>
      </div>
      <h2 className="mb-3 text-3xl font-black leading-tight md:text-5xl" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>{title}</h2>
      <p className="max-w-[980px] text-[13px] font-bold uppercase leading-relaxed tracking-[0.18em] md:text-sm" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.82 }}>{desc}</p>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-background px-6 py-6">
      <p className="mb-2 text-[13px] font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>{label}</p>
      <p className="text-3xl font-black" style={{ fontFamily: SERIF, color: color ?? RED }}>{value}</p>
      {sub ? <p className="mt-1 text-[13px]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>{sub}</p> : null}
    </div>
  );
}

function EmptyPanel({ text: msg }: { text: string }) {
  return (
    <div className="border border-border px-6 py-10 text-center" style={{ background: "var(--card)" }}>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{msg}</p>
    </div>
  );
}

function HBar({
  rows,
  dataKey,
  labelFormatter,
  tooltipFormatter,
  empty,
}: {
  rows: Row[];
  dataKey: string;
  labelFormatter?: (v: number) => string;
  tooltipFormatter?: (v: number, name: string, props: { payload: Row }) => [string, string];
  empty: string;
}) {
  if (!rows.length) return <EmptyPanel text={empty} />;
  const height = Math.max(320, rows.length * 36);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 80, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="escolaridade" width={150} tick={{ fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP} formatter={tooltipFormatter} />
          <Bar dataKey={dataKey} maxBarSize={24}
            label={{ position: "right", fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO, formatter: labelFormatter ?? ((v: number) => fmtNum(v)) }}>
            {rows.map((row) => (
              <Cell key={text(row, "escolaridade")} fill={eduColor(text(row, "escolaridade"))} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CollapsibleMethod({
  n, title, sub, open, onToggle, children,
}: { n: string; title: string; sub: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="mb-3 border border-border">
      <button type="button" onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-secondary"
        style={{ background: "var(--card)" }}>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.28)" }}>{n}</span>
          <div>
            <p className="text-sm font-bold tracking-wide" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{sub}</p>
          </div>
        </div>
        <span className="ml-6 shrink-0 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          {open ? "▲ RECOLHER" : "▼ EXPANDIR"}
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-7" style={{ background: "var(--card)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MethodSteps({ steps }: { steps: { n: string; title: string; body: string }[] }) {
  return (
    <ol className="max-w-2xl space-y-4">
      {steps.map((s) => (
        <li key={s.n} className="flex gap-4">
          <span className="mt-0.5 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color: RED }}>{s.n}</span>
          <div>
            <p className="mb-1 text-xs font-bold" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{s.title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function EscolaridadePage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado, onNavigateRecorte }: EscolaridadePageProps) {
  const [q4, setQ4] = useState<QuestionPayload | null>(null);
  const [q6, setQ6] = useState<QuestionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [depSearch, setDepSearch] = useState("");
  const [depDropOpen, setDepDropOpen] = useState(false);
  const [selectedDep, setSelectedDep] = useState<Row | null>(null);
  const [methOpen, setMethOpen] = useState<Record<string, boolean>>({});

  const toggleMeth = (k: string) => setMethOpen((v) => ({ ...v, [k]: !v[k] }));

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetchQuestion("q4", {}, { page: 1, pageSize: 100 }),
      fetchQuestion("q6", {}, { page: 1, pageSize: 300 }),
    ])
      .then(([p4, p6]) => {
        if (!mounted) return;
        setQ4(p4);
        setQ6(p6);
      })
      .catch(() => { if (mounted) setError("Nao foi possivel carregar os dados do backend."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // ── Q4 distribuição ──────────────────────────────────────────────────────
  const q4Rows = useMemo(
    () => sortByNivel((q4?.table_spec.rows ?? []) as Row[]),
    [q4]
  );

  // Q4 complement: lista de deputados por escolaridade
  const q4DeputyRows = useMemo(
    () => (q4?.complement_tables[0]?.rows ?? []) as Row[],
    [q4]
  );

  // Dropdown suggestions (busca por nome, mostra até 10)
  const depSuggestions = useMemo(() => {
    const q = depSearch.trim().toLowerCase();
    if (!q) return [];
    return q4DeputyRows
      .filter((r) => text(r, "nome").toLowerCase().includes(q))
      .slice(0, 10);
  }, [q4DeputyRows, depSearch]);

  const depPhotoUrl = (id: string) =>
    `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`;

  // ── Q6 correlações ───────────────────────────────────────────────────────
  // main table: ano | escolaridade | media_gasto | media_fidelidade | media_proposicoes | media_presenca_eventos | media_presenca_plenario
  const q6MainRows = useMemo(() => (q6?.table_spec.rows ?? []) as Row[], [q6]);

  // Média global por escolaridade (média sobre todos os anos)
  const q6ByEdu = useMemo(() => {
    const acc = new Map<string, { gasto: number[]; fidel: number[]; prop: number[]; eventos: number[]; plenario: number[] }>();
    for (const row of q6MainRows) {
      const edu = text(row, "escolaridade");
      if (!edu) continue;
      if (!acc.has(edu)) acc.set(edu, { gasto: [], fidel: [], prop: [], eventos: [], plenario: [] });
      const e = acc.get(edu)!;
      const g = raw(row, "media_gasto");
      const f = raw(row, "media_fidelidade");
      const p = raw(row, "media_proposicoes");
      const ev = raw(row, "media_presenca_eventos");
      const pl = raw(row, "media_presenca_plenario");
      if (g > 0) e.gasto.push(g);
      if (f > 0) e.fidel.push(f);
      if (p > 0) e.prop.push(p);
      if (ev > 0) e.eventos.push(ev);
      if (pl > 0) e.plenario.push(pl);
    }
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return sortByNivel(
      Array.from(acc.entries()).map(([escolaridade, v]) => ({
        escolaridade,
        media_gasto: Math.round(avg(v.gasto)),
        media_fidelidade: Math.round(avg(v.fidel) * 10) / 10,
        media_proposicoes: Math.round(avg(v.prop) * 10) / 10,
        media_presenca_eventos: Math.round(avg(v.eventos) * 10) / 10,
        media_presenca_plenario: Math.round(avg(v.plenario) * 10) / 10,
      }))
    ) as Row[];
  }, [q6MainRows]);

  // Complement tables específicas
  const findComplement = (hint: string) =>
    q6?.complement_tables.find((t) => t.title.toLowerCase().includes(hint.toLowerCase()));

  const q6aRows = useMemo(
    () => sortByNivel((findComplement("gastos")?.rows ?? []) as Row[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q6]
  );
  const q6bRows = useMemo(
    () => sortByNivel((findComplement("fidelidade")?.rows ?? []) as Row[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q6]
  );
  const q6cRows = useMemo(
    () => sortByNivel((findComplement("proposicoes")?.rows ?? []) as Row[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q6]
  );
  const q6dRows = useMemo(
    () => sortByNivel((findComplement("eventos")?.rows ?? []) as Row[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q6]
  );
  const q6eRows = useMemo(
    () => sortByNivel((findComplement("plenario")?.rows ?? []) as Row[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q6]
  );

  // Eta quadrado — tabela complementar Q6
  const q6EtaRows = useMemo(
    () => (findComplement("forca da associacao")?.rows ?? []) as Row[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q6]
  );

  // Use complement rows if available, otherwise fall back to q6ByEdu
  const gastoRows = q6aRows.length ? q6aRows : q6ByEdu;
  const fidelRows = q6bRows.length ? q6bRows : q6ByEdu;
  const propRows = q6cRows.length ? q6cRows : q6ByEdu;
  const eventosRows = q6dRows.length ? q6dRows : q6ByEdu;
  const plenarioRows = q6eRows.length ? q6eRows : q6ByEdu;

  // Stats
  const totalDeputados = q4Rows.reduce((s, r) => s + raw(r, "qtd_deputados"), 0);
  const niveisCount = q4Rows.length;
  const topNivel = q4Rows.reduce(
    (best, r) => (raw(r, "qtd_deputados") > raw(best, "qtd_deputados") ? r : best),
    q4Rows[0] ?? {}
  );
  const maisProp = [...q6ByEdu].sort((a, b) => raw(b, "media_proposicoes") - raw(a, "media_proposicoes"))[0];

  // Pie data
  const pieData = q4Rows.map((r) => ({
    name: text(r, "escolaridade"),
    value: raw(r, "qtd_deputados"),
  }));

  // Radar data: normaliza os 5 indicadores por nível para o ETA
  // Evolution: anos disponíveis
  const anos = useMemo(
    () => [...new Set(q6MainRows.map((r) => text(r, "ano_dados")))].sort(),
    [q6MainRows]
  );

  type EscolaridadeSection = "distribuicao" | "consulta" | "gastos" | "fidelidade" | "producao" | "presenca-eventos" | "presenca-plenario" | "evolucao" | "eta" | "metodologia";
  const [activeSection, setActiveSection] = useState<EscolaridadeSection>("distribuicao");
  const RED = "#e00836";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateRecorte={onNavigateRecorte} />
        <div className="flex h-[60vh] items-center justify-center text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          CARREGANDO DADOS...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateRecorte={onNavigateRecorte} />

      <PageHero
        n="8"
        tag="ESCOLARIDADE"
        title="Diploma"
        titleRed="e mandato"
        desc="Que nível de instrução têm os deputados federais da 57ª legislatura? E como a escolaridade se correlaciona com gastos, fidelidade partidária, produção de proposições e presença parlamentar?"
        imgId="/fundorecortes/recorte8/questao8.png"
      />

      {error ? (
        <section className="px-6 py-10 md:px-14"><EmptyPanel text={error} /></section>
      ) : null}

      {/* ── CARDS DE RESUMO (sempre visíveis) ── */}
      <section className="border-b border-border px-6 py-8 md:px-14">
        <div className="grid grid-cols-1 gap-px border border-border md:grid-cols-4" style={{ background: "rgba(240,236,228,0.06)" }}>
          <StatCard label="DEPUTADOS MAPEADOS" value={fmtNum(totalDeputados)} sub="57ª legislatura" />
          <StatCard label="NIVEIS DE INSTRUCAO" value={fmtNum(niveisCount)} sub="categorias distintas" color="#d6a84f" />
          <StatCard label="NIVEL MAIS COMUM" value={text(topNivel, "escolaridade")} sub={`${fmtNum(raw(topNivel, "qtd_deputados"))} deputados`} color="#4f6fad" />
          <StatCard label="MAIS PROPOSICOES" value={text(maisProp ?? {}, "escolaridade")} sub={maisProp ? `media ${fmtNum(raw(maisProp, "media_proposicoes"))}/dep` : ""} color="#4a7c59" />
        </div>
      </section>

      {/* ── NAV DE SEÇÕES ── */}
      <div
        className="sticky top-[56px] z-30 flex flex-wrap gap-3 border-b px-6 py-3 md:px-14"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        <button type="button" onClick={() => setActiveSection("distribuicao")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "distribuicao" ? RED : "transparent", color: activeSection === "distribuicao" ? "#fff" : "var(--foreground)", borderColor: activeSection === "distribuicao" ? RED : "var(--border)" }}>
          Distribuição
        </button>
        <button type="button" onClick={() => setActiveSection("consulta")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "consulta" ? RED : "transparent", color: activeSection === "consulta" ? "#fff" : "var(--foreground)", borderColor: activeSection === "consulta" ? RED : "var(--border)" }}>
          Consulta
        </button>
        <button type="button" onClick={() => setActiveSection("gastos")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "gastos" ? RED : "transparent", color: activeSection === "gastos" ? "#fff" : "var(--foreground)", borderColor: activeSection === "gastos" ? RED : "var(--border)" }}>
          Gastos
        </button>
        <button type="button" onClick={() => setActiveSection("fidelidade")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "fidelidade" ? RED : "transparent", color: activeSection === "fidelidade" ? "#fff" : "var(--foreground)", borderColor: activeSection === "fidelidade" ? RED : "var(--border)" }}>
          Fidelidade
        </button>
        <button type="button" onClick={() => setActiveSection("producao")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "producao" ? RED : "transparent", color: activeSection === "producao" ? "#fff" : "var(--foreground)", borderColor: activeSection === "producao" ? RED : "var(--border)" }}>
          Produção
        </button>
        <button type="button" onClick={() => setActiveSection("presenca-eventos")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "presenca-eventos" ? RED : "transparent", color: activeSection === "presenca-eventos" ? "#fff" : "var(--foreground)", borderColor: activeSection === "presenca-eventos" ? RED : "var(--border)" }}>
          Eventos
        </button>
        <button type="button" onClick={() => setActiveSection("presenca-plenario")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "presenca-plenario" ? RED : "transparent", color: activeSection === "presenca-plenario" ? "#fff" : "var(--foreground)", borderColor: activeSection === "presenca-plenario" ? RED : "var(--border)" }}>
          Plenário
        </button>
        <button type="button" onClick={() => setActiveSection("evolucao")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "evolucao" ? RED : "transparent", color: activeSection === "evolucao" ? "#fff" : "var(--foreground)", borderColor: activeSection === "evolucao" ? RED : "var(--border)" }}>
          Evolução
        </button>
        <button type="button" onClick={() => setActiveSection("eta")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "eta" ? RED : "transparent", color: activeSection === "eta" ? "#fff" : "var(--foreground)", borderColor: activeSection === "eta" ? RED : "var(--border)" }}>
          Eta²
        </button>
        <button type="button" onClick={() => setActiveSection("metodologia")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "metodologia" ? RED : "transparent", color: activeSection === "metodologia" ? "#fff" : "var(--foreground)", borderColor: activeSection === "metodologia" ? RED : "var(--border)" }}>
          Metodologia
        </button>
      </div>

      {/* ── 4.1 DISTRIBUIÇÃO ── */}
      {activeSection === "distribuicao" && (
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader
          n="08A"
          tag="DISTRIBUICAO POR ESCOLARIDADE"
          title="Quantos deputados têm cada nível de instrução?"
          desc="Distribuição dos 640 deputados únicos da 57ª legislatura por nível de escolaridade declarado."
        />

        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          {/* Donut */}
          <div>
            <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: "var(--foreground)" }}>DISTRIBUICAO PERCENTUAL</p>
            {pieData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius="48%" outerRadius="72%" paddingAngle={2}
                      label={({ name, percent }) => percent > 0.03 ? `${name.split(" ").pop()} ${(percent * 100).toFixed(0)}%` : ""}
                      labelLine={false}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={eduColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip {...TOOLTIP} formatter={(v, name) => [`${fmtNum(Number(v))} deputados`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyPanel text="Sem dados de escolaridade." />}
          </div>

          {/* Barra horizontal */}
          <div>
            <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: "var(--foreground)" }}>QUANTIDADE POR NIVEL</p>
            <HBar
              rows={q4Rows}
              dataKey="qtd_deputados"
              labelFormatter={(v) => fmtNum(v)}
              tooltipFormatter={(v, _n, p) => [`${fmtNum(Number(v))} deputados`, text(p.payload, "escolaridade")]}
              empty="Sem dados de distribuicao."
            />
          </div>
        </div>

        {/* Legenda de cores */}
        <div className="mt-8 flex flex-wrap gap-2">
          {q4Rows.map((r) => (
            <span key={text(r, "escolaridade")}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2 py-1 text-xs"
              style={{ background: "var(--card)", fontFamily: MONO }}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: eduColor(text(r, "escolaridade")) }} />
              {text(r, "escolaridade")}
            </span>
          ))}
        </div>
      </section>
      )}

      {/* ── 4.1 CONSULTA INDIVIDUAL ── */}
      {activeSection === "consulta" && (
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader
          n="08B"
          tag="CONSULTA INDIVIDUAL"
          title="Qual é a escolaridade do seu deputado?"
          desc={`Pesquise pelo nome. Dados de ${q4DeputyRows.length} deputados da 57ª legislatura, incluindo titulares e suplentes que exerceram o mandato.`}
        />

        <div className="max-w-[640px]">
          {/* Campo de busca com dropdown */}
          <div className="relative">
            <input
              type="text"
              value={depSearch}
              onChange={(e) => { setDepSearch(e.target.value); setDepDropOpen(true); if (!e.target.value) setSelectedDep(null); }}
              onFocus={() => setDepDropOpen(true)}
              onBlur={() => setTimeout(() => setDepDropOpen(false), 180)}
              placeholder="Nome do deputado..."
              className="h-14 w-full border bg-transparent px-5 text-[15px] outline-none"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: MONO }}
            />

            {depDropOpen && depSearch.trim() ? (
              <div
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 border"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                {depSuggestions.length === 0 ? (
                  <p className="px-4 py-4 text-xs uppercase text-muted-foreground" style={{ fontFamily: MONO }}>
                    Nenhum resultado para "{depSearch}"
                  </p>
                ) : (
                  depSuggestions.map((dep) => (
                    <button
                      key={text(dep, "id_deputado")}
                      type="button"
                      onMouseDown={() => {
                        setSelectedDep(dep);
                        setDepSearch(text(dep, "nome"));
                        setDepDropOpen(false);
                      }}
                      className="flex w-full items-center gap-4 border-b px-4 py-3 text-left transition-colors hover:bg-white/5"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <img
                        src={depPhotoUrl(text(dep, "id_deputado"))}
                        alt=""
                        className="h-11 w-9 shrink-0 object-cover object-top"
                        style={{ filter: "grayscale(55%) contrast(1.08)" }}
                        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                      />
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-[15px]" style={{ color: "var(--foreground)", fontFamily: SERIF }}>
                          {text(dep, "nome")}
                        </strong>
                        <small className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.12em" }}>
                          <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0" style={{ background: eduColor(text(dep, "escolaridade")) }} />
                          <span style={{ color: eduColor(text(dep, "escolaridade")) }}>{text(dep, "escolaridade") || "Nao informado"}</span>
                          <span className="text-muted-foreground">· ID {text(dep, "id_deputado")}</span>
                        </small>
                      </span>
                      <span className="shrink-0 text-[10px] uppercase" style={{ color: RED, fontFamily: MONO, letterSpacing: "0.16em" }}>Ver</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {/* Card do deputado selecionado */}
          {selectedDep ? (() => {
            const id = text(selectedDep, "id_deputado");
            const nome = text(selectedDep, "nome");
            const nivel = text(selectedDep, "escolaridade") || "Nao informado";
            const color = eduColor(nivel);
            return (
              <div className="mt-6 border border-border" style={{ background: "var(--card)", borderLeft: `4px solid ${color}` }}>
                <div className="flex items-start gap-0">
                  {/* Foto */}
                  <div className="relative shrink-0 overflow-hidden" style={{ width: 120, minHeight: 160, background: "#1a1a1a" }}>
                    <img
                      src={depPhotoUrl(id)}
                      alt={nome}
                      className="h-full w-full object-cover object-top"
                      style={{ minHeight: 160, filter: "grayscale(20%) contrast(1.06)" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (sib) sib.style.display = "flex";
                      }}
                    />
                    <div className="hidden h-full w-full items-center justify-center" style={{ minHeight: 160 }}>
                      <span className="text-5xl font-black" style={{ fontFamily: SERIF, color: `${color}55` }}>
                        {nome.charAt(0)}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between gap-4 p-6">
                    <div>
                      <h3 className="text-xl font-black leading-tight" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>
                        {nome}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        ID {id}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>ESCOLARIDADE</p>
                      <span
                        className="inline-flex items-center gap-2 border px-3 py-2 text-sm font-bold"
                        style={{ borderColor: `${color}44`, background: `${color}18`, color, fontFamily: MONO }}
                      >
                        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                        {nivel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setSelectedDep(null); setDepSearch(""); }}
                      className="self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
                      style={{ fontFamily: MONO }}
                    >
                      ✕ LIMPAR
                    </button>
                  </div>
                </div>
              </div>
            );
          })() : (
            <p className="mt-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              Digite o nome para buscar. Ex: "Kim Kataguiri", "Erika Santos"
            </p>
          )}
        </div>
      </section>
      )}

      {/* ── 6a GASTOS ── */}
      {activeSection === "gastos" && (
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader
          n="08C"
          tag="ESCOLARIDADE × GASTOS"
          title="Deputados mais escolarizados gastam mais?"
          desc="Media de gasto total com verba indenizatória (CEAP) por nivel de escolaridade, considerando todos os anos do periodo."
        />

        <HBar
          rows={gastoRows}
          dataKey="media_gasto"
          labelFormatter={(v) => fmtCurrency(v)}
          tooltipFormatter={(v, _n, p) => [fmtCurrency(Number(v)), text(p.payload, "escolaridade")]}
          empty="Sem dados de gastos por escolaridade."
        />

        <p className="mt-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          * Media calculada sobre todos os deputados do nivel no periodo 2023-2026.
        </p>
      </section>
      )}

      {/* ── 6b FIDELIDADE ── */}
      {activeSection === "fidelidade" && (
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader
          n="08D"
          tag="ESCOLARIDADE × FIDELIDADE PARTIDARIA"
          title="Formação influencia a disciplina de voto?"
          desc="Media do percentual de votos alinhados com a orientacao do partido por nivel de instrucao. Exclui votacoes sem orientacao registrada."
        />

        <HBar
          rows={fidelRows}
          dataKey="media_fidelidade"
          labelFormatter={(v) => fmtPct(v)}
          tooltipFormatter={(v, _n, p) => [fmtPct(Number(v)), text(p.payload, "escolaridade")]}
          empty="Sem dados de fidelidade por escolaridade."
        />
      </section>
      )}

      {/* ── 6c PROPOSIÇÕES ── */}
      {activeSection === "producao" && (
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader
          n="08E"
          tag="ESCOLARIDADE × PRODUCAO LEGISLATIVA"
          title="Quem apresenta mais proposições?"
          desc="Media de proposicoes apresentadas por deputado por nivel de instrucao. Mede o volume de producao legislativa."
        />

        <HBar
          rows={propRows}
          dataKey="media_proposicoes"
          labelFormatter={(v) => fmtNum(v)}
          tooltipFormatter={(v, _n, p) => [`${fmtNum(Number(v))} proposicoes/dep`, text(p.payload, "escolaridade")]}
          empty="Sem dados de proposicoes por escolaridade."
        />
      </section>
      )}

      {/* ── 6d PRESENÇA EM EVENTOS ── */}
      {activeSection === "presenca-eventos" && (
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader
          n="08F"
          tag="ESCOLARIDADE × PRESENCA EM EVENTOS"
          title="Quem aparece mais nas comissões e eventos?"
          desc="Media de presenças em eventos parlamentares (reunioes de comissao, audiencias, etc.) por nivel de instrucao."
        />

        <HBar
          rows={eventosRows}
          dataKey="media_presenca_eventos"
          labelFormatter={(v) => fmtNum(v)}
          tooltipFormatter={(v, _n, p) => [`${fmtNum(Number(v))} eventos/dep`, text(p.payload, "escolaridade")]}
          empty="Sem dados de presenca em eventos."
        />
      </section>
      )}

      {/* ── 6e PRESENÇA NO PLENÁRIO ── */}
      {activeSection === "presenca-plenario" && (
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader
          n="08G"
          tag="ESCOLARIDADE × PRESENCA NO PLENARIO"
          title="Quem frequenta mais o plenário?"
          desc="Media de presenças em votacoes no plenario por nivel de instrucao. Exclui ausencias e outros registros nao binarios."
        />

        <HBar
          rows={plenarioRows}
          dataKey="media_presenca_plenario"
          labelFormatter={(v) => fmtNum(v)}
          tooltipFormatter={(v, _n, p) => [`${fmtNum(Number(v))} sessoes/dep`, text(p.payload, "escolaridade")]}
          empty="Sem dados de presenca no plenario."
        />
      </section>
      )}

      {/* ── EVOLUÇÃO POR ANO ── */}
      {activeSection === "evolucao" && (
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader
          n="08H"
          tag="EVOLUCAO ANUAL"
          title="Como os indicadores evoluíram ao longo dos anos?"
          desc={`Dados para os anos ${anos.join(", ")} — comparacao interanual dos principais indicadores por nivel de instrucao.`}
        />

        {anos.length && q6MainRows.length ? (
          <div className="overflow-x-auto border border-border" style={{ background: "var(--card)" }}>
            <table className="min-w-full text-left text-xs" style={{ fontFamily: MONO }}>
              <thead style={{ background: "var(--secondary)" }}>
                <tr>
                  {["Ano", "Escolaridade", "Qtd Dep", "Media Gasto", "Media Fidelidade", "Media Proposicoes", "Presenca Eventos", "Presenca Plenario"].map((col) => (
                      <th key={col} className="whitespace-nowrap px-4 py-3 text-[13px] font-bold uppercase" style={{ color: "var(--foreground)", opacity: 0.78 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q6MainRows.map((row, i) => (
                  <tr key={i} className="border-t border-border hover:bg-secondary">
                    <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{text(row, "ano_dados")}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: eduColor(text(row, "escolaridade")) }} />
                        {text(row, "escolaridade")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">{fmtNum(raw(row, "qtd_deputados"))}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">{raw(row, "media_gasto") ? fmtCurrency(raw(row, "media_gasto")) : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">{raw(row, "media_fidelidade") ? fmtPct(raw(row, "media_fidelidade")) : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">{raw(row, "media_proposicoes") ? fmtNum(raw(row, "media_proposicoes")) : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">{raw(row, "media_presenca_eventos") ? fmtNum(raw(row, "media_presenca_eventos")) : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">{raw(row, "media_presenca_plenario") ? fmtNum(raw(row, "media_presenca_plenario")) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyPanel text="Sem dados de evolucao anual." />}
      </section>
      )}

      {/* ── ETA COMPLEMENTAR ── */}
      {activeSection === "eta" && (
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader
          n="08I"
          tag="ETA COMPLEMENTAR"
          title="Qual a força real da associação entre escolaridade e desempenho?"
          desc="O η² (eta quadrado) mede quanto da variação em cada indicador parlamentar é explicada pela escolaridade. Escolaridade é variável categórica; os indicadores são numéricos."
        />

        {/* Gráfico de barras horizontais com η² */}
        {q6EtaRows.length > 0 ? (() => {
          const ETA_INTERP_COLOR: Record<string, string> = {
            "associacao fraca": "#c4813a",
            "associacao muito fraca": "#555",
          };
          const barData = [...q6EtaRows]
            .sort((a, b) => raw(b, "eta_quadrado") - raw(a, "eta_quadrado"))
            .map((r) => ({
              name: text(r, "indicador").replace(/_/g, " "),
              eta: raw(r, "eta_quadrado"),
              registros: raw(r, "registros_validos"),
              interpretacao: text(r, "interpretacao").trim(),
              fill: ETA_INTERP_COLOR[text(r, "interpretacao").trim()] ?? "#888",
            }));

          return (
            <div className="space-y-8">
              {/* Gráfico */}
              <div className="border border-border p-6" style={{ background: "var(--card)" }}>
                <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.78 }}>
                  η² POR INDICADOR — quanto da variação é explicada pela escolaridade
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ top: 0, right: 80, bottom: 0, left: 160 }}
                    barCategoryGap="30%"
                  >
                    <XAxis
                      type="number"
                      domain={[0, 0.016]}
                      tickFormatter={(v: number) => v.toFixed(4)}
                      tick={{ fill: "var(--chart-axis-fill)", fontSize: 10, fontFamily: MONO }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={155}
                      tick={{ fill: "var(--chart-axis-fill)", fontSize: 11, fontFamily: MONO }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", fontFamily: MONO, fontSize: 11, color: "var(--chart-tooltip-text)" }}
                      formatter={(v: number, _: string, entry: { payload?: { interpretacao?: string; registros?: number } }) => [
                        `η² = ${v.toFixed(4)}  ·  ${entry.payload?.interpretacao ?? ""}  ·  ${entry.payload?.registros ?? 0} registros`,
                        "Força",
                      ]}
                      labelFormatter={() => ""}
                    />
                    <Bar dataKey="eta" radius={[0, 2, 2, 0]}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Linha de referência textual */}
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-6 rounded" style={{ background: "#c4813a" }} />
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>Associação fraca (η² ≈ 0.01–0.05)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-6 rounded" style={{ background: "#555" }} />
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>Associação muito fraca (η² &lt; 0.01)</span>
                  </div>
                </div>
              </div>

              {/* Tabela de valores */}
              <div className="overflow-x-auto border border-border" style={{ background: "var(--card)" }}>
                <table className="min-w-full text-left text-xs" style={{ fontFamily: MONO }}>
                  <thead style={{ background: "var(--secondary)" }}>
                    <tr>
                      {["Indicador", "Registros válidos", "Grupos", "η²", "Interpretação"].map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 text-[13px] font-bold uppercase" style={{ color: "var(--foreground)", opacity: 0.78 }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {barData.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-4 py-2.5 font-medium" style={{ color: "var(--foreground)" }}>{row.name}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{fmtNum(row.registros)}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">
                          {fmtNum(raw(q6EtaRows.find((r) => text(r, "indicador").replace(/_/g, " ") === row.name) ?? {}, "grupos_escolaridade"))}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold" style={{ color: row.fill }}>{row.eta.toFixed(4)}</td>
                        <td className="px-4 py-2.5" style={{ color: row.fill }}>{row.interpretacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Conclusão */}
              <div className="border border-border p-6" style={{ background: "var(--card)", borderLeft: `4px solid ${RED}` }}>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em]" style={{ color: RED, fontFamily: MONO }}>Conclusão estatística</p>
                <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: MONO }}>
                  Todos os η² ficam abaixo de 0,02 — na prática, a escolaridade explica menos de 2% da variação em qualquer
                  indicador parlamentar. A análise estatística confirma o que as médias sugerem: <strong style={{ color: "var(--foreground)" }}>
                  partido, ideologia e trajetória política importam muito mais do que o grau de instrução</strong> para
                  prever gastos, fidelidade, produção legislativa ou presença parlamentar.
                </p>
              </div>
            </div>
          );
        })() : <EmptyPanel text="Dados de eta quadrado nao disponíveis. Verifique o arquivo q6_eta_complementar.txt." />}
      </section>
      )}

      {/* ── METODOLOGIA ── */}
      {activeSection === "metodologia" && (
      <section className="border-t border-border px-6 py-10 md:px-14" style={{ background: "var(--card)" }}>
        <p className="sr-only">METODOLOGIA</p>

        <SectionHeader
          n="08J"
          tag="METODOLOGIA"
          title="Como os indicadores foram calculados?"
          desc="Transparencia analitica - Fonte dos dados, criterios de agrupamento, medias por escolaridade e forca da associacao estatistica."
        />

        <CollapsibleMethod n="4" title="DISTRIBUICAO POR ESCOLARIDADE" sub="Como classificamos o nivel de instrucao de cada deputado"
          open={!!methOpen["4"]} onToggle={() => toggleMeth("4")}>
          <MethodSteps steps={[
            { n: "01", title: "Fonte dos dados", body: "A escolaridade vem do cadastro oficial de deputados da Camara dos Deputados, acessado via API publica (dados abertos). O campo e declarado pelo proprio parlamentar no momento do registro." },
            { n: "02", title: "Deputados unicos", body: "Contamos deputados unicos da 57a legislatura (2023-2026). Um mesmo deputado que mudou de partido durante o mandato e contado apenas uma vez, com a escolaridade do seu registro mais recente." },
            { n: "03", title: "Nao informado", body: "Deputados sem escolaridade registrada no sistema foram agrupados na categoria 'Nao informado'. Isso pode indicar omissao voluntaria ou ausencia no cadastro." },
          ]} />
        </CollapsibleMethod>

        <CollapsibleMethod n="6a" title="ESCOLARIDADE × GASTOS" sub="Como correlacionamos instrucao com despesas parlamentares"
          open={!!methOpen["6a"]} onToggle={() => toggleMeth("6a")}>
          <MethodSteps steps={[
            { n: "01", title: "Base de gastos", body: "Utilizamos a tabela de Cota para Exercicio da Atividade Parlamentar (CEAP), que registra todas as despesas reembolsadas aos deputados com recursos publicos." },
            { n: "02", title: "Agregacao por deputado-ano", body: "Somamos todos os gastos de cada deputado em cada ano. Isso cria um registro de gasto_total por (id_deputado, ano)." },
            { n: "03", title: "Media por escolaridade", body: "Calculamos a media de gasto_total de todos os deputados dentro de cada nivel de escolaridade, ponderando igualmente todos os anos com dados." },
          ]} />
        </CollapsibleMethod>

        <CollapsibleMethod n="6b" title="ESCOLARIDADE × FIDELIDADE PARTIDARIA" sub="Como medimos o alinhamento de voto com o partido"
          open={!!methOpen["6b"]} onToggle={() => toggleMeth("6b")}>
          <MethodSteps steps={[
            { n: "01", title: "Orientacoes de bancada", body: "Para cada votacao com diretriz partidaria registrada, comparamos o voto do deputado com a orientacao oficial da bancada." },
            { n: "02", title: "Calculo de fidelidade", body: "Fidelidade = (votos seguindo orientacao / total de votos com orientacao) x 100. Votacoes sem orientacao (Liberado, Abstencao) sao excluidas." },
            { n: "03", title: "Media por escolaridade", body: "Calculamos a media do indice de fidelidade de todos os deputados dentro de cada nivel de escolaridade." },
          ]} />
        </CollapsibleMethod>

        <CollapsibleMethod n="6c" title="ESCOLARIDADE × PRODUCAO LEGISLATIVA" sub="Como medimos o volume de proposicoes"
          open={!!methOpen["6c"]} onToggle={() => toggleMeth("6c")}>
          <MethodSteps steps={[
            { n: "01", title: "Proposicoes registradas", body: "Contamos todas as proposicoes (PL, PEC, REQ, MPV, etc.) das quais o deputado e primeiro autor, conforme registros da base legislativa da Camara." },
            { n: "02", title: "Normalizacao por ano", body: "O numero de proposicoes e normalizado por ano para permitir comparacao entre deputados com diferentes periodos de mandato." },
            { n: "03", title: "Media por escolaridade", body: "A media de proposicoes por deputado e calculada dentro de cada nivel de escolaridade, agregando todos os anos disponiveis." },
          ]} />
        </CollapsibleMethod>

        <CollapsibleMethod n="6d/6e" title="ESCOLARIDADE × PRESENCA" sub="Como medimos a frequencia parlamentar"
          open={!!methOpen["6de"]} onToggle={() => toggleMeth("6de")}>
          <MethodSteps steps={[
            { n: "01", title: "Presenca em eventos", body: "Contamos os registros de presenca em reunioes de comissao, audiencias publicas, seminarios e demais eventos parlamentares registrados no sistema da Camara." },
            { n: "02", title: "Presenca no plenario", body: "Contamos os votos efetivos (Sim ou Nao) registrados em votacoes nominais no plenario. Abstencoes e obstrucoes sao excluidas da contagem de presenca." },
            { n: "03", title: "Media por escolaridade", body: "Para cada nivel de instrucao, calculamos a media de eventos/sessoes por deputado ao longo do periodo 2023-2026." },
          ]} />
        </CollapsibleMethod>

        <CollapsibleMethod n="η²" title="ETA QUADRADO — FORCA DA ASSOCIACAO" sub="Por que usamos η² para medir a relacao entre escolaridade e indicadores"
          open={!!methOpen["eta"]} onToggle={() => toggleMeth("eta")}>
          <MethodSteps steps={[
            { n: "01", title: "Por que η² e nao correlacao de Pearson", body: "A correlacao de Pearson exige duas variaveis numericas. Escolaridade e categorica (nominal ordenada), entao usamos o η² (eta quadrado), que compara a variancia entre grupos com a variancia total." },
            { n: "02", title: "Formula", body: "η² = SS_between / SS_total. SS_between = variacao explicada pelas diferencas entre grupos de escolaridade. SS_total = variacao total do indicador na amostra inteira. O resultado e um numero entre 0 e 1." },
            { n: "03", title: "Interpretacao dos valores", body: "η² < 0,01 = associacao negligenciavel. 0,01–0,06 = fraca. 0,06–0,14 = moderada. > 0,14 = forte. Todos os indicadores desta analise ficaram abaixo de 0,02, indicando que escolaridade explica menos de 2% da variacao observada." },
            { n: "04", title: "Limitacoes", body: "η² e sensivel ao numero de grupos e ao tamanho da amostra. Grupos com poucos deputados (ex: Doutorado = 5 deputados) podem inflar ou deflacionar o valor. Os resultados devem ser interpretados com cautela para niveis de instrucao com menos de 30 representantes." },
          ]} />
        </CollapsibleMethod>
      </section>
      )}
    </div>
  );
}
