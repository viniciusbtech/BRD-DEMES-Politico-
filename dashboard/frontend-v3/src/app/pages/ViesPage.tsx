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
};

type Row = Record<string, unknown>;

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const RED = "#c41230";

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
      <h2 className="mb-2 text-3xl font-black leading-tight md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>{title}</h2>
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
    <div className="border border-border px-6 py-12 text-center" style={{ background: "#111" }}>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{msg}</p>
    </div>
  );
}

function SimpleTable({ rows, columns, empty }: { rows: Row[]; columns: string[]; empty: string }) {
  if (!rows.length) return <EmptyPanel text={empty} />;
  return (
    <div className="overflow-x-auto border border-border" style={{ background: "#111" }}>
      <table className="min-w-full text-left text-sm">
        <thead style={{ background: "#0a0a0a" }}>
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
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#161616]"
        style={{ background: "#111" }}
      >
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.28)" }}>{n}</span>
          <div>
            <p className="text-sm font-bold tracking-wide" style={{ fontFamily: MONO, color: "#f0ece4" }}>{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{sub}</p>
          </div>
        </div>
        <span className="ml-6 shrink-0 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          {open ? "▲ RECOLHER" : "▼ EXPANDIR"}
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-7" style={{ background: "#0d0d0d" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MethodSteps({ steps }: { steps: { n: string; title: string; body: string }[] }) {
  return (
    <ol className="max-w-2xl space-y-4">
      {steps.map((step) => (
        <li key={step.n} className="flex gap-4">
          <span className="mt-0.5 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color: RED }}>{step.n}</span>
          <div>
            <p className="mb-1 text-xs font-bold" style={{ fontFamily: MONO, color: "#f0ece4" }}>{step.title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ViesPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado }: ViesPageProps) {
  const [q9, setQ9] = useState<QuestionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q93RowsShown, setQ93RowsShown] = useState(20);
  const [q94RowsShown, setQ94RowsShown] = useState(20);
  const [search, setSearch] = useState("");
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

  // Q9.5 — score viés individual
  const q95Rows = useMemo(() => {
    const t = q9?.complement_tables.find((t) => t.title.toLowerCase().includes("score vies"));
    return (t?.rows ?? []) as Row[];
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
    contentStyle: { background: "#141414", border: "1px solid rgba(240,236,228,0.12)", fontFamily: MONO, fontSize: 11, color: "#fff" },
    itemStyle: { color: "#fff" },
    labelStyle: { color: "#fff" },
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
        <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateDeputado={onNavigateDeputado} />
        <div className="flex h-[60vh] items-center justify-center text-xs text-muted-foreground" style={{ fontFamily: MONO }}>CARREGANDO DADOS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateDeputado={onNavigateDeputado} />

      <PageHero
        n="7"
        tag="VIES IDEOLOGICO"
        title="Ideologia"
        titleRed="e voto"
        desc="Onde cada partido se posiciona no espectro politico, como cada campo ideologico reage a cada proposicao, quais votacoes realmente dividem esquerda e direita — e onde cada deputado se posiciona de verdade."
        imgId="/fundorecortes/recorte7/questao7.png"
      />

      {error ? <section className="px-6 py-10 md:px-14"><EmptyPanel text={error} /></section> : null}

      {/* ── Q9.1 CLASSIFICAÇÃO ── */}
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader n="9.1" tag="CLASSIFICACAO DOS PARTIDOS" title="Qual o vies de cada partido?" desc="Cada partido foi classificado por espectro ideologico. O grafico mostra a distribuicao dos partidos por campo politico e lista os integrantes de cada grupo." />

        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-4" style={{ background: "rgba(240,236,228,0.06)" }}>
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
                <div key={group.ideologia} className="border border-border p-4" style={{ background: "#111", borderLeft: `3px solid ${color}` }}>
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

      {/* ── Q9.2 CORRELAÇÃO ── */}
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "#0e0e0e" }}>
        <SectionHeader n="9.2" tag="CORRELACAO PARTIDO X PROPOSTA" title="Qual campo vota mais Sim?" desc="Para cada votacao, calculamos o percentual de votos Sim por campo ideologico. O resumo exibe a media de apoio de cada campo ao longo de todo o periodo." />

        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-2" style={{ background: "rgba(240,236,228,0.06)" }}>
          <StatCard label="VOTACOES ANALISADAS" value={fmtNum(totalVotacoes)} />
          <StatCard label="REGISTROS IDEOLOGIA X VOTACAO" value={fmtNum(q92Rows.length)} color="#d6a84f" />
        </div>

        {q92Summary.length ? (
          <>
            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>MEDIA DE APOIO (% SIM) POR CAMPO</p>
            <div className="mb-8 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q92Summary} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="ideologia" width={110} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v: string) => IDEOLOGY_LABELS[v] ?? v} />
                  <Tooltip {...tooltipStyle} formatter={(value, _n, props) => [`${value}%`, `${IDEOLOGY_LABELS[props.payload.ideologia] ?? props.payload.ideologia} · ${fmtNum(props.payload.total)} registros`]} />
                  <Bar dataKey="media_pct_sim" maxBarSize={28} label={{ position: "right", fill: "#888880", fontSize: 10, fontFamily: MONO, formatter: (v: number) => fmtPct(v) }}>
                    {q92Summary.map((e) => <Cell key={e.ideologia} fill={IDEOLOGY_COLORS[e.ideologia] ?? "#555"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}

        <p className="mb-3 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>DETALHE — PRIMEIRAS VOTACOES</p>
        <SimpleTable rows={q92Rows.slice(0, 50)} columns={["ano_dados", "id_votacao", "titulo_proposicao", "ideologia", "votos_sim", "votos_nao", "pct_sim"]} empty="Sem dados de correlacao." />
      </section>

      {/* ── Q9.4 VOTAÇÕES POLARIZADAS ── */}
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader
          n="9.4"
          tag="VOTACOES POLARIZADAS"
          title="Onde esquerda e direita divergiram de verdade?"
          desc="Filtramos as votacoes em que a diferenca entre o % Sim da esquerda e da direita foi de 30 pontos percentuais ou mais. Essas sao as votacoes que realmente revelam posicionamento ideologico."
        />

        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-3" style={{ background: "rgba(240,236,228,0.06)" }}>
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
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="id_votacao" width={72} tick={{ fill: "#888880", fontSize: 9, fontFamily: MONO }} axisLine={false} tickLine={false} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value, name, props) => {
                      const r = props.payload;
                      return [`Esq ${fmtPct(raw(r, "pct_sim_esquerda"))} / Dir ${fmtPct(raw(r, "pct_sim_direita"))} / Ctr ${fmtPct(raw(r, "pct_sim_centro"))}`, text(r, "titulo_proposicao").slice(0, 60)];
                    }}
                  />
                  <Bar dataKey="divergencia_esq_dir" maxBarSize={22} label={{ position: "right", fill: "#888880", fontSize: 10, fontFamily: MONO, formatter: (v: number) => fmtPct(v) }}>
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

      {/* ── Q9.5 SCORE DE VIÉS ── */}
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "#0e0e0e" }}>
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
            <div className="mb-8 border border-border p-6" style={{ background: "#111", borderLeft: `4px solid ${cardColor}` }}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>{text(foundDeputy, "nome_deputado")}</h3>
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
                <div className="grid grid-cols-2 gap-px border border-border md:grid-cols-4" style={{ background: "rgba(240,236,228,0.06)" }}>
                  <StatCard label="VOTOS EM POLARIZADAS" value={fmtNum(raw(foundDeputy, "votos_em_polarizadas"))} />
                  <StatCard label="COM ESQUERDA" value={fmtNum(raw(foundDeputy, "votos_com_esquerda"))} color={RED} />
                  <StatCard label="COM DIREITA" value={fmtNum(raw(foundDeputy, "votos_com_direita"))} color="#2b5490" />
                  <StatCard label="% COM DIREITA" value={fmtPct(raw(foundDeputy, "pct_com_direita"))} color={cardColor} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-px border border-border md:grid-cols-3" style={{ background: "rgba(240,236,228,0.06)" }}>
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
                          style={{ background: "#0d0d0d", fontFamily: MONO }}>
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
                      <div className="pointer-events-none absolute bottom-full mb-1 hidden w-48 border border-border p-2 text-xs group-hover:block" style={{ background: "#141414", fontFamily: MONO, zIndex: 10 }}>
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
              {q95Sorted.map((row) => {
                const score = raw(row, "score_vies");
                const color = scoreColor(score);
                return (
                  <div key={text(row, "id_deputado")} className="border border-border p-4" style={{ background: "#111" }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-bold text-sm" style={{ color: "#f0ece4" }}>{text(row, "nome_deputado")}</span>
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
          </>
        ) : !searchTerm ? (
          <EmptyPanel text="Score de vies ainda nao disponivel. Execute o SQL atualizado da Q9." />
        ) : null}

        {searchTerm && searchFiltered.length === 0 && (
          <EmptyPanel text={`Nenhum deputado encontrado para "${search}".`} />
        )}
      </section>

      {/* ── Q9.3 ADESÃO ── */}
      <section className="px-6 py-14 md:px-14">
        <SectionHeader n="9.3" tag="VOTO DE CADA DEPUTADO" title="Quem segue o partido — e quem contraria?" desc="Percentual de votos em que o deputado seguiu a orientacao oficial do partido nas votacoes em que havia diretriz explicita registrada." />

        {q93Rows.length ? (
          <>
            <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>TOP 20 — MAIOR ADERENCIA AO PARTIDO</p>
            <div className="mb-8" style={{ height: Math.max(360, Math.min(q93Rows.length, 20) * 34) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q93Rows.slice(0, 20)} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="nome_deputado" width={160} tick={{ fill: "#888880", fontSize: 9, fontFamily: MONO }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(value, _n, props) => [`${value}%`, `${props.payload.nome_deputado} · ${props.payload.sigla_partido}`]} />
                  <Bar dataKey="pct_aderencia_partido" maxBarSize={22} label={{ position: "right", fill: "#888880", fontSize: 10, fontFamily: MONO, formatter: (v: number) => fmtPct(v) }}>
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

      {/* ── METODOLOGIA ── */}
      <section className="border-t border-border px-6 py-10 md:px-14" style={{ background: "#080808" }}>
        <p className="mb-5 text-xs tracking-[0.35em] text-muted-foreground" style={{ fontFamily: MONO }}>METODOLOGIA — COMO CHEGAMOS AQUI</p>

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

        <CollapsibleMethod n="9.5" title="SCORE DE VIES INDIVIDUAL (0–100)" sub="Como calculamos onde cada deputado se posiciona de verdade, independente do partido" open={methQ95Open} onToggle={() => setMethQ95Open((v) => !v)}>
          <MethodSteps steps={[
            { n: "01", title: "Usar somente votacoes polarizadas", body: "O score e calculado apenas nas votacoes com divergencia >= 30pp entre esquerda e direita. Votacoes consensuais nao revelam posicionamento." },
            { n: "02", title: "Classificar cada voto como 'com esquerda' ou 'com direita'", body: "Se a esquerda favoreceu a proposicao (pct_esq > pct_dir) e o deputado votou Sim, ele votou 'com esquerda'. Se votou Nao, votou 'com direita'. O contrario vale quando a direita favorece." },
            { n: "03", title: "Agregar por deputado", body: "Somamos quantas vezes o deputado votou com esquerda e com direita ao longo de todas as votacoes polarizadas do periodo." },
            { n: "04", title: "Calcular o score", body: "score = (votos_com_direita / total_classificados) x 100. Zero = o deputado sempre acompanhou a esquerda nas polarizadas. Cem = sempre acompanhou a direita. Cinquenta = equidistante." },
            { n: "05", title: "Minimo de 10 votos", body: "Deputados com menos de 10 votos em votacoes polarizadas sao excluidos do ranking — base insuficiente para calcular um score confiavel." },
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
    </div>
  );
}
