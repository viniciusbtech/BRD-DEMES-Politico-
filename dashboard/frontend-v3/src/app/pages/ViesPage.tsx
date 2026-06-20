import { useEffect, useMemo, useState } from "react";
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
  "nao classificado": "NÃO CLASSIFICADO",
};

const raw = (row: Row | undefined, key: string) => Number(row?.[key] ?? 0);
const text = (row: Row | undefined, key: string) => String(row?.[key] ?? "");
const fmtNum = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtPct = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

function SectionHeader({
  tag,
  n,
  title,
  desc,
}: {
  tag: string;
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-baseline gap-4">
        <span
          className="text-5xl font-black"
          style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.22)" }}
        >
          {n}
        </span>
        <span
          className="text-xs tracking-[0.35em] text-primary"
          style={{ fontFamily: MONO }}
        >
          {tag}
        </span>
      </div>
      <h2
        className="mb-2 text-3xl font-black leading-tight md:text-4xl"
        style={{ fontFamily: SERIF, color: "#f0ece4" }}
      >
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-background px-6 py-6">
      <p
        className="mb-2 text-xs tracking-widest text-muted-foreground"
        style={{ fontFamily: MONO }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-black"
        style={{ fontFamily: SERIF, color: color ?? RED }}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function EmptyPanel({ text: msg }: { text: string }) {
  return (
    <div
      className="border border-border px-6 py-12 text-center"
      style={{ background: "#111" }}
    >
      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
        {msg}
      </p>
    </div>
  );
}

function SimpleTable({
  rows,
  columns,
  empty,
}: {
  rows: Row[];
  columns: string[];
  empty: string;
}) {
  if (!rows.length) return <EmptyPanel text={empty} />;
  return (
    <div
      className="overflow-x-auto border border-border"
      style={{ background: "#111" }}
    >
      <table className="min-w-full text-left text-sm">
        <thead style={{ background: "#0a0a0a" }}>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-3 text-xs font-normal uppercase text-muted-foreground"
                style={{ fontFamily: MONO }}
              >
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
                  {typeof row[col] === "number"
                    ? Number(row[col]).toLocaleString("pt-BR")
                    : String(row[col] ?? "")}
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
    <span
      className="inline-block rounded-sm px-2 py-0.5 text-xs font-bold uppercase"
      style={{ background: `${color}22`, color, fontFamily: MONO }}
    >
      {IDEOLOGY_LABELS[ideology] ?? ideology}
    </span>
  );
}

export default function ViesPage({
  onNavigateHome,
  onNavigateRecortes,
  onNavigateDeputado,
}: ViesPageProps) {
  const [q9, setQ9] = useState<QuestionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q93RowsShown, setQ93RowsShown] = useState(20);
  const [methQ91Open, setMethQ91Open] = useState(false);
  const [methQ92Open, setMethQ92Open] = useState(false);
  const [methQ93Open, setMethQ93Open] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    fetchQuestion("q9", {}, { page: 1, pageSize: 500 })
      .then((payload) => {
        if (mounted) setQ9(payload);
      })
      .catch(() => {
        if (mounted) setError("Nao foi possivel carregar os dados do backend.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Q9.1 — lista partido → ideologia
  const q91Rows = useMemo(
    () => (q9?.table_spec.rows ?? []) as Row[],
    [q9]
  );

  // agrupar por ideologia para o donut
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

  // Q9.2 — correlação ideologia x proposta
  const q92Rows = useMemo(() => {
    const t = q9?.complement_tables.find((t) =>
      t.title.toLowerCase().includes("correlacao")
    );
    return (t?.rows ?? []) as Row[];
  }, [q9]);

  // agregar média de pct_sim por ideologia (resumo)
  const q92SummaryByIdeologia = useMemo(() => {
    const acc = new Map<string, { sum: number; count: number }>();
    for (const row of q92Rows) {
      const ideo = text(row, "ideologia") || "nao classificado";
      const pct = raw(row, "pct_sim");
      if (!acc.has(ideo)) acc.set(ideo, { sum: 0, count: 0 });
      const entry = acc.get(ideo)!;
      entry.sum += pct;
      entry.count += 1;
    }
    return Array.from(acc.entries())
      .map(([ideologia, { sum, count }]) => ({
        ideologia,
        media_pct_sim: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
        total_registros: count,
      }))
      .sort((a, b) => b.media_pct_sim - a.media_pct_sim);
  }, [q92Rows]);

  // Q9.3 — resumo por deputado
  const q93Rows = useMemo(() => {
    const t = q9?.complement_tables.find((t) =>
      t.title.toLowerCase().includes("voto individual") ||
      t.title.toLowerCase().includes("resumo")
    );
    return (t?.rows ?? []) as Row[];
  }, [q9]);

  const q93Sorted = useMemo(
    () =>
      [...q93Rows].sort(
        (a, b) => raw(b, "pct_aderencia_partido") - raw(a, "pct_aderencia_partido")
      ),
    [q93Rows]
  );

  // stats gerais
  const totalPartidos = q91Rows.length;
  const totalDeputados = new Set(q93Rows.map((r) => text(r, "id_deputado"))).size;
  const totalVotacoes = new Set(q92Rows.map((r) => `${text(r, "ano_dados")}_${text(r, "id_votacao")}`)).size;

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
        <NavBar
          onNavigateHome={onNavigateHome}
          onNavigateRecortes={onNavigateRecortes}
          onNavigateDeputado={onNavigateDeputado}
        />
        <div
          className="flex h-[60vh] items-center justify-center text-xs text-muted-foreground"
          style={{ fontFamily: MONO }}
        >
          CARREGANDO DADOS...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}
    >
      <NavBar
        onNavigateHome={onNavigateHome}
        onNavigateRecortes={onNavigateRecortes}
        onNavigateDeputado={onNavigateDeputado}
      />

      {/* HERO */}
      <section
        className="border-b border-border px-6 py-14 md:px-14"
        style={{ background: "#0d0d0d" }}
      >
        <p
          className="mb-3 text-xs tracking-[0.35em] text-primary"
          style={{ fontFamily: MONO }}
        >
          07 - VIES IDEOLOGICO
        </p>
        <h1
          className="mb-4 font-black leading-none"
          style={{
            fontFamily: SERIF,
            color: "#f0ece4",
            fontSize: "clamp(3rem, 7vw, 5.5rem)",
          }}
        >
          Ideologia
          <br />
          <span style={{ color: RED }}>e voto</span>
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          Onde cada partido se posiciona no espectro politico, como cada campo ideologico
          reage a cada proposicao e o quanto cada deputado segue a orientacao do seu
          partido.
        </p>
      </section>

      {error ? (
        <section className="px-6 py-10 md:px-14">
          <EmptyPanel text={error} />
        </section>
      ) : null}

      {/* Q9.1 — CLASSIFICAÇÃO POR IDEOLOGIA */}
      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader
          n="9.1"
          tag="CLASSIFICACAO DOS PARTIDOS"
          title="Qual o vies de cada partido?"
          desc="Cada partido foi classificado por espectro ideologico. O grafico mostra a distribuicao dos partidos por campo politico e lista os integrantes de cada grupo."
        />

        <div
          className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-3"
          style={{ background: "rgba(240,236,228,0.06)" }}
        >
          <StatCard label="PARTIDOS MAPEADOS" value={fmtNum(totalPartidos)} />
          <StatCard
            label="CAMPOS IDEOLOGICOS"
            value={fmtNum(ideologiaGroups.length)}
          />
          <StatCard
            label="DEPUTADOS ANALISADOS"
            value={fmtNum(totalDeputados)}
            color="#d6a84f"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {/* Donut */}
          <div>
            <p
              className="mb-4 text-xs tracking-[0.28em] text-primary"
              style={{ fontFamily: MONO }}
            >
              DISTRIBUICAO POR CAMPO POLITICO
            </p>
            {pieData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="76%"
                      paddingAngle={3}
                      label={({ name, value }) => `${name} (${value})`}
                      labelLine={false}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.ideologia}
                          fill={IDEOLOGY_COLORS[entry.ideologia] ?? "#555"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#141414",
                        border: "1px solid rgba(240,236,228,0.12)",
                        fontFamily: MONO,
                        fontSize: 11,
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value, name) => [`${value} partidos`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyPanel text="Sem dados de ideologia." />
            )}
          </div>

          {/* Lista por campo */}
          <div className="space-y-4">
            <p
              className="mb-4 text-xs tracking-[0.28em] text-primary"
              style={{ fontFamily: MONO }}
            >
              PARTIDOS POR CAMPO
            </p>
            {ideologiaGroups.map((group) => {
              const color = IDEOLOGY_COLORS[group.ideologia] ?? "#555";
              return (
                <div
                  key={group.ideologia}
                  className="border border-border p-4"
                  style={{ background: "#111", borderLeft: `3px solid ${color}` }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <IdeologyBadge ideology={group.ideologia} />
                    <span
                      className="text-xs text-muted-foreground"
                      style={{ fontFamily: MONO }}
                    >
                      {group.qtd} partido{group.qtd !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">
                    {group.partidos.join(", ")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <SimpleTable
            rows={q91Rows}
            columns={["sigla_partido", "ideologia"]}
            empty="Sem dados de classificacao."
          />
        </div>
      </section>

      {/* Q9.2 — CORRELAÇÃO IDEOLOGIA X PROPOSTA */}
      <section
        className="border-b border-border px-6 py-14 md:px-14"
        style={{ background: "#0e0e0e" }}
      >
        <SectionHeader
          n="9.2"
          tag="CORRELACAO PARTIDO X PROPOSTA"
          title="Qual campo ideologico vota mais Sim?"
          desc="Para cada votacao, calcula-se o percentual de votos Sim por campo ideologico. O resumo abaixo mostra a media de apoio (% Sim) de cada campo ao longo de todas as votacoes do periodo."
        />

        <div
          className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-2"
          style={{ background: "rgba(240,236,228,0.06)" }}
        >
          <StatCard
            label="VOTACOES ANALISADAS"
            value={fmtNum(totalVotacoes)}
            sub="votacoes com orientacao registrada"
          />
          <StatCard
            label="REGISTROS IDEOLOGIA X VOTACAO"
            value={fmtNum(q92Rows.length)}
            color="#d6a84f"
          />
        </div>

        {q92SummaryByIdeologia.length ? (
          <>
            <p
              className="mb-4 text-xs tracking-[0.28em] text-primary"
              style={{ fontFamily: MONO }}
            >
              MEDIA DE APOIO (% SIM) POR CAMPO IDEOLOGICO
            </p>
            <div className="mb-8 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={q92SummaryByIdeologia}
                  layout="vertical"
                  margin={{ left: 0, right: 60, top: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="ideologia"
                    width={100}
                    tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => IDEOLOGY_LABELS[v] ?? v}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#141414",
                      border: "1px solid rgba(240,236,228,0.12)",
                      fontFamily: MONO,
                      fontSize: 11,
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value, _name, props) => [
                      `${value}%`,
                      `${IDEOLOGY_LABELS[props.payload.ideologia] ?? props.payload.ideologia} · ${fmtNum(props.payload.total_registros)} registros`,
                    ]}
                  />
                  <Bar
                    dataKey="media_pct_sim"
                    maxBarSize={28}
                    label={{
                      position: "right",
                      fill: "#888880",
                      fontSize: 10,
                      fontFamily: MONO,
                      formatter: (v: number) => `${fmtPct(v)}`,
                    }}
                  >
                    {q92SummaryByIdeologia.map((entry) => (
                      <Cell
                        key={entry.ideologia}
                        fill={IDEOLOGY_COLORS[entry.ideologia] ?? "#555"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}

        <p
          className="mb-3 text-xs tracking-[0.28em] text-primary"
          style={{ fontFamily: MONO }}
        >
          DETALHE — PRIMEIRAS VOTACOES
        </p>
        <SimpleTable
          rows={q92Rows.slice(0, 50)}
          columns={[
            "ano_dados",
            "id_votacao",
            "titulo_proposicao",
            "ideologia",
            "votos_sim",
            "votos_nao",
            "pct_sim",
          ]}
          empty="Sem dados de correlacao."
        />
      </section>

      {/* Q9.3 — ADESAO POR DEPUTADO */}
      <section className="px-6 py-14 md:px-14" style={{ background: "#0d0d0d" }}>
        <SectionHeader
          n="9.3"
          tag="VOTO DE CADA DEPUTADO"
          title="Quem segue o partido — e quem contraria?"
          desc="Para cada deputado, calculamos o percentual de vezes em que votou alinhado a orientacao oficial do partido nas votacoes em que havia diretriz registrada."
        />

        {/* Grafico top 20 aderencia */}
        {q93Sorted.length ? (
          <>
            <p
              className="mb-4 text-xs tracking-[0.28em] text-primary"
              style={{ fontFamily: MONO }}
            >
              TOP 20 — DEPUTADOS COM MAIOR ADERENCIA AO PARTIDO
            </p>
            <div
              className="mb-8"
              style={{ height: Math.max(360, Math.min(q93Sorted.length, 20) * 34) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={q93Sorted.slice(0, 20)}
                  layout="vertical"
                  margin={{ left: 0, right: 60, top: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="nome_deputado"
                    width={160}
                    tick={{ fill: "#888880", fontSize: 9, fontFamily: MONO }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#141414",
                      border: "1px solid rgba(240,236,228,0.12)",
                      fontFamily: MONO,
                      fontSize: 11,
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value, _name, props) => [
                      `${value}%`,
                      `${props.payload.nome_deputado} · ${props.payload.sigla_partido} · ${props.payload.ideologia}`,
                    ]}
                  />
                  <Bar
                    dataKey="pct_aderencia_partido"
                    maxBarSize={22}
                    label={{
                      position: "right",
                      fill: "#888880",
                      fontSize: 10,
                      fontFamily: MONO,
                      formatter: (v: number) => `${fmtPct(v)}`,
                    }}
                  >
                    {q93Sorted.slice(0, 20).map((row) => (
                      <Cell
                        key={text(row, "id_deputado")}
                        fill={IDEOLOGY_COLORS[text(row, "ideologia")] ?? "#555"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p
              className="mb-4 text-xs tracking-[0.28em] text-primary"
              style={{ fontFamily: MONO }}
            >
              RANKING COMPLETO
            </p>
            <SimpleTable
              rows={q93Sorted.slice(0, q93RowsShown)}
              columns={[
                "sigla_partido",
                "nome_deputado",
                "ideologia",
                "total_votos",
                "seguiu_orientacao",
                "contrariou_orientacao",
                "pct_aderencia_partido",
              ]}
              empty="Sem dados de aderencia."
            />
            {q93RowsShown < q93Sorted.length ? (
              <button
                type="button"
                onClick={() => setQ93RowsShown((v) => v + 30)}
                className="mt-4 border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                style={{ fontFamily: MONO }}
              >
                CARREGAR MAIS LINHAS
              </button>
            ) : null}
          </>
        ) : (
          <EmptyPanel text="Sem dados de aderencia por deputado." />
        )}
      </section>

      {/* METODOLOGIA COLLAPSIBLE */}
      <section
        className="border-t border-border px-6 py-10 md:px-14"
        style={{ background: "#080808" }}
      >
        <p
          className="mb-5 text-xs tracking-[0.35em] text-muted-foreground"
          style={{ fontFamily: MONO }}
        >
          METODOLOGIA — COMO CHEGAMOS AQUI
        </p>

        {/* Q9.1 */}
        <div className="mb-3 border border-border">
          <button
            type="button"
            onClick={() => setMethQ91Open((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#161616]"
            style={{ background: "#111" }}
          >
            <div className="flex items-baseline gap-3">
              <span
                className="text-3xl font-black"
                style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.28)" }}
              >
                9.1
              </span>
              <div>
                <p
                  className="text-sm font-bold tracking-wide"
                  style={{ fontFamily: MONO, color: "#f0ece4" }}
                >
                  CLASSIFICACAO DOS PARTIDOS POR IDEOLOGIA
                </p>
                <p
                  className="mt-0.5 text-xs text-muted-foreground"
                  style={{ fontFamily: MONO }}
                >
                  Como mapeamos o espectro politico de cada partido
                </p>
              </div>
            </div>
            <span
              className="ml-6 shrink-0 text-xs text-muted-foreground"
              style={{ fontFamily: MONO }}
            >
              {methQ91Open ? "▲ RECOLHER" : "▼ EXPANDIR"}
            </span>
          </button>
          {methQ91Open && (
            <div
              className="border-t border-border px-5 py-7"
              style={{ background: "#0d0d0d" }}
            >
              <ol className="space-y-4 max-w-2xl">
                {[
                  {
                    n: "01",
                    title: "Tabela de referencia",
                    body: "A classificacao vem da tabela partidos_ideologia, construida manualmente com base em analises de plataformas de dados politicos e historico parlamentar de cada sigla.",
                  },
                  {
                    n: "02",
                    title: "Tres campos",
                    body: "Os partidos foram agrupados em tres campos: esquerda, centro e direita. Partidos sem registro na tabela recebem o rotulo nao classificado.",
                  },
                  {
                    n: "03",
                    title: "Uso nos graficos",
                    body: "A ideologia e usada como eixo de cor em todos os graficos deste recorte: vermelho = esquerda, dourado = centro, azul = direita.",
                  },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span
                      className="mt-0.5 shrink-0 text-xs font-black"
                      style={{ fontFamily: MONO, color: RED }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <p
                        className="mb-1 text-xs font-bold"
                        style={{ fontFamily: MONO, color: "#f0ece4" }}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Q9.2 */}
        <div className="mb-3 border border-border">
          <button
            type="button"
            onClick={() => setMethQ92Open((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#161616]"
            style={{ background: "#111" }}
          >
            <div className="flex items-baseline gap-3">
              <span
                className="text-3xl font-black"
                style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.28)" }}
              >
                9.2
              </span>
              <div>
                <p
                  className="text-sm font-bold tracking-wide"
                  style={{ fontFamily: MONO, color: "#f0ece4" }}
                >
                  CORRELACAO IDEOLOGIA X PROPOSICAO
                </p>
                <p
                  className="mt-0.5 text-xs text-muted-foreground"
                  style={{ fontFamily: MONO }}
                >
                  Como medimos o apoio de cada campo politico a cada votacao
                </p>
              </div>
            </div>
            <span
              className="ml-6 shrink-0 text-xs text-muted-foreground"
              style={{ fontFamily: MONO }}
            >
              {methQ92Open ? "▲ RECOLHER" : "▼ EXPANDIR"}
            </span>
          </button>
          {methQ92Open && (
            <div
              className="border-t border-border px-5 py-7"
              style={{ background: "#0d0d0d" }}
            >
              <ol className="space-y-4 max-w-2xl">
                {[
                  {
                    n: "01",
                    title: "Cruzar voto com ideologia do partido",
                    body: "Para cada voto registrado, buscamos o partido do deputado e a sua ideologia. Cada voto e entao classificado como pertencendo a um campo: esquerda, centro ou direita.",
                  },
                  {
                    n: "02",
                    title: "Agrupar por votacao e ideologia",
                    body: "Para cada votacao (id_votacao), contamos quantos votos Sim, Nao e outros cada campo ideologico emitiu.",
                  },
                  {
                    n: "03",
                    title: "Calcular % Sim por campo",
                    body: "pct_sim = (votos_sim / total_votos) x 100. Isso mostra, para cada votacao, quao favoravel cada campo politico foi a proposicao votada.",
                  },
                  {
                    n: "04",
                    title: "Media geral",
                    body: "O grafico de barras exibe a media de pct_sim de cada campo ao longo de todas as votacoes do periodo — revelando a tendencia geral de cada espectro a votar 'a favor'.",
                  },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span
                      className="mt-0.5 shrink-0 text-xs font-black"
                      style={{ fontFamily: MONO, color: RED }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <p
                        className="mb-1 text-xs font-bold"
                        style={{ fontFamily: MONO, color: "#f0ece4" }}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Q9.3 */}
        <div className="border border-border">
          <button
            type="button"
            onClick={() => setMethQ93Open((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#161616]"
            style={{ background: "#111" }}
          >
            <div className="flex items-baseline gap-3">
              <span
                className="text-3xl font-black"
                style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.28)" }}
              >
                9.3
              </span>
              <div>
                <p
                  className="text-sm font-bold tracking-wide"
                  style={{ fontFamily: MONO, color: "#f0ece4" }}
                >
                  ADERENCIA INDIVIDUAL DOS DEPUTADOS
                </p>
                <p
                  className="mt-0.5 text-xs text-muted-foreground"
                  style={{ fontFamily: MONO }}
                >
                  Como calculamos se cada deputado seguiu ou contrariou seu partido
                </p>
              </div>
            </div>
            <span
              className="ml-6 shrink-0 text-xs text-muted-foreground"
              style={{ fontFamily: MONO }}
            >
              {methQ93Open ? "▲ RECOLHER" : "▼ EXPANDIR"}
            </span>
          </button>
          {methQ93Open && (
            <div
              className="border-t border-border px-5 py-7"
              style={{ background: "#0d0d0d" }}
            >
              <ol className="space-y-4 max-w-2xl">
                {[
                  {
                    n: "01",
                    title: "Buscar a orientacao do partido",
                    body: "Para cada voto de um deputado em uma votacao, verificamos se o partido emitiu uma orientacao de bancada (Sim ou Nao). Orientacoes do tipo Liberado, Abstencao e Obstrucao sao marcadas como 'sem diretriz clara'.",
                  },
                  {
                    n: "02",
                    title: "Classificar cada voto",
                    body: "Se o voto do deputado coincide com a orientacao: marcamos como 'Seguiu'. Se for diferente: 'Contrariou'. Votacoes sem orientacao registrada ficam como 'Sem orientacao'.",
                  },
                  {
                    n: "03",
                    title: "Agregar por deputado",
                    body: "Somamos, por deputado, o total de vezes que seguiu e o total de vezes que contrariou a orientacao do partido — acumulando todos os anos do periodo.",
                  },
                  {
                    n: "04",
                    title: "Calcular o indice de aderencia",
                    body: "pct_aderencia = (seguiu / (seguiu + contrariou)) x 100. Deputados com 100% nunca foram contra o partido; com 50% contrariaram metade das vezes.",
                  },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span
                      className="mt-0.5 shrink-0 text-xs font-black"
                      style={{ fontFamily: MONO, color: RED }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <p
                        className="mb-1 text-xs font-bold"
                        style={{ fontFamily: MONO, color: "#f0ece4" }}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
