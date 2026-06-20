import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchMeta, fetchQuestion } from "../api";
import NavBar from "../components/NavBar";
import type { FilterChoice, QuestionPayload } from "../types";

type InfluenciaPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
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

const raw = (row: Row | undefined, key: string) => Number(row?.[key] ?? 0);
const text = (row: Row | undefined, key: string) => String(row?.[key] ?? "");
const fmtNum = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtPct = (value: number) => `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

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

function StatCard({ label, value, sub, unit }: { label: string; value: string; sub?: string; unit?: string }) {
  return (
    <div className="bg-background px-6 py-6">
      <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>{label}</p>
      <p className="text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>{value}{unit ? <span className="ml-1 text-lg">{unit}</span> : null}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{sub}</p> : null}
    </div>
  );
}

function EmptyPanel({ text: message }: { text: string }) {
  return (
    <div className="border border-border px-6 py-12 text-center" style={{ background: "#111" }}>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{message}</p>
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
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-4 py-3 text-xs font-normal uppercase text-muted-foreground" style={{ fontFamily: MONO }}>
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
}: {
  nodes: RawGraphNode[];
  links: RawGraphLink[];
  selectedDeputy?: RawGraphNode | null;
  onSelectDeputy: (node: RawGraphNode | null) => void;
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
      backgroundColor: "#080808",
      animationDuration: 900,
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: "#141414",
        borderColor: "rgba(240,236,228,0.16)",
        textStyle: { color: "#f0ece4", fontFamily: "JetBrains Mono", fontSize: 11 },
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
            color: "#f0ece4",
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
                borderColor: isSelected ? "#f0ece4" : "rgba(240,236,228,0.28)",
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
  }, [links, nodes, onSelectDeputy, selectedDeputy]);

  return (
    <div className="border border-border" style={{ background: "#080808" }}>
      <div ref={chartRef} className="h-[620px] w-full" />
    </div>
  );
}

export default function InfluenciaPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado }: InfluenciaPageProps) {
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

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetchMeta(),
      fetchAllQ8Pages(),
      fetchQuestion("q10", q10Year ? { anos: [q10Year] } : {}, { page: 1, pageSize: 100, sortBy: "pct_alinhamento" }),
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
  }, [q10Year]);

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

      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "#0d0d0d" }}>
        <p className="mb-3 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>06 - INFLUENCIA</p>
        <h1 className="mb-4 font-black leading-none" style={{ fontFamily: SERIF, color: "#f0ece4", fontSize: "clamp(3rem, 7vw, 5.5rem)" }}>
          Influencia
          <br />
          <span style={{ color: RED }}>grupos e partidos</span>
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          Comunidades de comportamento de voto da Q8 e disciplina partidaria da Q10 em uma leitura integrada: quem vota junto, quais grupos emergem e qual partido consegue alinhar melhor sua bancada.
        </p>
      </section>

      {error ? (
        <section className="px-6 py-10 md:px-14">
          <EmptyPanel text={error} />
        </section>
      ) : null}

      <section className="border-b border-border px-6 py-14 md:px-14">
        <SectionHeader
          n="8"
          tag="COMUNIDADES"
          title="Como os grupos se influenciam?"
          desc="A Q8 complementar detecta comunidades de comportamento a partir de votos comparaveis. Cada grupo abaixo representa deputados com padrao de voto parecido."
        />

        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-4" style={{ background: "rgba(240,236,228,0.06)" }}>
          {q8Summary.slice(0, 4).map((card) => (
            <StatCard key={card.id} label={card.label.toUpperCase()} value={card.value} unit={card.unit ?? undefined} />
          ))}
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>GRAFO LEIDEN INTERATIVO</p>
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
                      borderColor: q8GraphTopLimit === option ? RED : "rgba(240,236,228,0.12)",
                      color: q8GraphTopLimit === option ? RED : "var(--muted-foreground)",
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
                    borderColor: q8SelectedCommunity === community.id ? community.color : "rgba(240,236,228,0.12)",
                    color: q8SelectedCommunity === community.id ? community.color : "var(--muted-foreground)",
                    background: q8SelectedCommunity === community.id ? `${community.color}18` : "transparent",
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
              />
            ) : (
              <EmptyPanel text="Sem nos para a comunidade selecionada." />
            )}
          </div>

          <div className="grid content-start gap-3">
            {selectedCommunityMeta ? (
              <div className="border border-border p-5" style={{ background: "#111", borderLeft: `3px solid ${selectedCommunityMeta.color}` }}>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>{selectedCommunityMeta.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      kappa medio {selectedCommunityMeta.kappa.toFixed(3)} · grau ponderado {selectedCommunityMeta.degree.toFixed(1)}
                    </p>
                  </div>
                  <span className="text-2xl font-black" style={{ fontFamily: SERIF, color: selectedCommunityMeta.color }}>{fmtNum(selectedCommunityMeta.deputies)}</span>
                </div>
                <div className="grid grid-cols-2 gap-px border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
                  <StatCard label="NOS VISIVEIS" value={fmtNum(visibleLeidenNodes.length)} />
                  <StatCard label="ARESTAS" value={fmtNum(visibleLeidenLinks.length)} />
                </div>
                {selectedCommunityMeta.parties ? (
                  <>
                    <p className="mb-2 mt-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>PARTIDOS PRESENTES</p>
                    <p className="text-xs leading-relaxed text-foreground">{selectedCommunityMeta.parties}</p>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="border border-border p-5" style={{ background: "#111" }}>
              <p className="mb-3 text-xs tracking-[0.25em] text-primary" style={{ fontFamily: MONO }}>DEPUTADO SELECIONADO</p>
              {selectedDeputy ? (
                <div>
                  <h3 className="text-2xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
                    {String(selectedDeputy.nome ?? selectedDeputy.name ?? selectedDeputy.id)}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {String(selectedDeputy.partido ?? selectedDeputy.sigla_partido ?? "")}
                    {selectedDeputy.uf || selectedDeputy.sigla_uf ? `-${String(selectedDeputy.uf ?? selectedDeputy.sigla_uf)}` : ""}
                    {" · "}
                    comunidade {String(selectedDeputy.community ?? "")}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-px border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
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

        <SectionHeader
          n="8"
          tag="RANKING ORIGINAL"
          title="Deputados com maior participacao nas proposicoes aprovadas"
          desc="Tabela baseada na resposta original da Q8. Ela mostra autoria, aprovacao e participacao no total global aprovado."
        />

        <div className="mb-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={q8FullRanking.slice(0, 15)} layout="vertical" margin={{ left: 40, right: 20, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" width={135} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.12)", fontFamily: MONO, fontSize: 11 }} />
              <Bar dataKey="pct_aprovadas" fill={RED} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <SimpleTable
          rows={q8FullRanking.slice(0, q8RowsShown)}
          columns={["id_deputado", "nome", "proposicoes_autoria", "proposicoes_aprovadas", "pct_aprovadas"]}
          empty="Sem linhas da Q8."
        />
        {q8RowsShown < q8FullRanking.length ? (
          <button
            type="button"
            onClick={() => setQ8RowsShown((value) => value + 20)}
            className="mt-4 border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            style={{ fontFamily: MONO }}
          >
            CARREGAR MAIS LINHAS
          </button>
        ) : null}

      </section>

      <section className="px-6 py-14 md:px-14" style={{ background: "#0e0e0e" }}>
        <SectionHeader
          n="10"
          tag="DISCIPLINA PARTIDARIA"
          title="Qual partido convence mais seus deputados?"
          desc="A Q10 ordena os partidos pelo alinhamento interno: votos alinhados com a orientacao partidaria dividido pelo total de votos com diretriz."
        />

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setQ10Year("")}
            className="border px-3 py-1.5 text-xs font-bold"
            style={{ fontFamily: MONO, borderColor: !q10Year ? RED : "rgba(240,236,228,0.12)", color: !q10Year ? RED : "var(--muted-foreground)" }}
          >
            TODOS
          </button>
          {years.map((year) => (
            <button
              key={year.value}
              type="button"
              onClick={() => setQ10Year(year.value)}
              className="border px-3 py-1.5 text-xs font-bold"
              style={{ fontFamily: MONO, borderColor: q10Year === year.value ? RED : "rgba(240,236,228,0.12)", color: q10Year === year.value ? RED : "var(--muted-foreground)" }}
            >
              {year.label}
            </button>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-px border border-border md:grid-cols-3" style={{ background: "rgba(240,236,228,0.06)" }}>
          <StatCard label="PARTIDO MAIS ALINHADO" value={text(q10Rows[0], "sigla_partido") || "-"} sub={q10Rows[0] ? fmtPct(raw(q10Rows[0], "pct_alinhamento")) : undefined} />
          <StatCard label="VOTOS COM DIRETRIZ" value={fmtNum(q10Rows.reduce((sum, row) => sum + raw(row, q10VoteTotalKey), 0))} />
          <StatCard label="PARTIDOS NO RANKING" value={fmtNum(q10Rows.length)} />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          {(["esquerda", "centro", "direita", "nao classificado"] as const).map((label) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: IDEOLOGY_COLORS[label] }} />
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{label.toUpperCase()}</span>
            </div>
          ))}
        </div>

        <div className="mb-10" style={{ height: Math.max(400, q10Rows.length * 34) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={q10Rows} layout="vertical" margin={{ left: 0, right: 50, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="sigla_partido" width={72} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.12)", fontFamily: MONO, fontSize: 11, color: "#fff" }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
                formatter={(value, _name, props) => [`${value}%`, `${props.payload.sigla_partido} · ${props.payload.ideologia ?? ""}`]}
              />
              <Bar dataKey="pct_alinhamento" maxBarSize={22} label={{ position: "right", fill: "#888880", fontSize: 10, fontFamily: MONO, formatter: (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` }}>
                {q10Rows.map((row) => (
                  <Cell key={text(row, "sigla_partido")} fill={IDEOLOGY_COLORS[text(row, "ideologia")] ?? "#555"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <SimpleTable
          rows={q10Rows}
          columns={q10Columns}
          empty="Sem linhas da Q10."
        />

        {!q10Year && q10AnnualRows.length ? (
          <div className="mt-10">
            <SectionHeader
              n="10"
              tag="SERIE ANUAL"
              title="Alinhamento interno por ano"
              desc="Tabela complementar da Q10 para comparar a disciplina partidaria ano a ano."
            />
            <SimpleTable
              rows={q10AnnualRows.slice(0, 40)}
              columns={["ano_dados", "sigla_partido", "ideologia", "total_votos", "votos_alinhados", "pct_alinhamento"]}
              empty="Sem linhas anuais da Q10."
            />
          </div>
        ) : null}
      </section>

      <section className="border-t border-border px-6 py-10 md:px-14" style={{ background: "#080808" }}>
        <p className="mb-5 text-xs tracking-[0.35em] text-muted-foreground" style={{ fontFamily: MONO }}>METODOLOGIA — COMO CHEGAMOS AQUI</p>

        {/* Q8 Collapsible */}
        <div className="mb-3 border border-border">
          <button
            type="button"
            onClick={() => setMethQ8Open((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#161616]"
            style={{ background: "#111" }}
          >
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.28)" }}>8</span>
              <div>
                <p className="text-sm font-bold tracking-wide" style={{ fontFamily: MONO, color: "#f0ece4" }}>INFLUENCIA LEGISLATIVA & COMUNIDADES DE COMPORTAMENTO</p>
                <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>Como medimos quem mais influenciou e como agrupamos deputados por padrao de voto</p>
              </div>
            </div>
            <span className="ml-6 shrink-0 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{methQ8Open ? "▲ RECOLHER" : "▼ EXPANDIR"}</span>
          </button>

          {methQ8Open && (
            <div className="border-t border-border px-5 py-7" style={{ background: "#0d0d0d" }}>
              <div className="grid gap-10 lg:grid-cols-2">

                <div>
                  <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>PARTE 1 — INFLUENCIA LEGISLATIVA (RANKING)</p>
                  <p className="mb-5 text-xs leading-relaxed text-muted-foreground">Objetivo: descobrir quais deputados mais contribuiram para o total de proposicoes aprovadas no periodo.</p>
                  <ol className="space-y-4">
                    {[
                      { n: "01", title: "Classificar cada proposicao", body: "Cada proposicao recebe o rotulo aprovada se a descricao da sua situacao contem palavras como aprovada, sancao, norma juridica ou promulgada. Todas as demais ficam como outra." },
                      { n: "02", title: "Contar autoria por deputado", body: "Para cada deputado, conta-se quantas proposicoes ele assinou como autor e, dessas, quantas foram aprovadas." },
                      { n: "03", title: "Calcular participacao global", body: "Divide-se o total de proposicoes aprovadas do deputado pelo total de proposicoes aprovadas de toda a legislatura e multiplica por 100. Isso gera o pct_aprovadas — a fatia do deputado no total." },
                      { n: "04", title: "Ranquear e exibir", body: "Ordena-se do maior pct_aprovadas para o menor. Quem esta no topo entregou mais legislacao aprovada. Empates sao desfeitos pelo nome." },
                    ].map((step) => (
                      <li key={step.n} className="flex gap-4">
                        <span className="mt-0.5 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color: RED }}>{step.n}</span>
                        <div>
                          <p className="mb-1 text-xs font-bold" style={{ fontFamily: MONO, color: "#f0ece4" }}>{step.title}</p>
                          <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="mb-4 text-xs tracking-[0.28em] text-primary" style={{ fontFamily: MONO }}>PARTE 2 — COMUNIDADES DE COMPORTAMENTO (GRAFO LEIDEN)</p>
                  <p className="mb-5 text-xs leading-relaxed text-muted-foreground">Objetivo: agrupar deputados que votam de forma parecida, sem levar partido ou UF em conta.</p>
                  <ol className="space-y-4">
                    {[
                      { n: "01", title: "Filtrar votacoes relevantes", body: "Votacoes unanimes nao revelam diferenca de comportamento. So entram votacoes com pelo menos 50 votos Sim/Nao e proporcao de Sim entre 10% e 90% — votacoes que realmente dividiram o plenario." },
                      { n: "02", title: "Codificar os votos", body: "Sim vira +1, Nao vira -1, Abstencao vira 0. Obstrucao e Artigo 17 sao ignorados — nao representam posicao real sobre o merito da proposicao." },
                      { n: "03", title: "Filtrar deputados ativos", body: "So entram no grafo deputados com ao menos 100 votos validos. Deputados com poucos registros nao tem base suficiente para calcular similaridade confiavel." },
                      { n: "04", title: "Calcular similaridade entre cada par", body: "Para cada par (A, B), conta-se quantas votacoes compartilharam e quantas vezes votaram igual. Similaridade = votos iguais / votacoes em comum. Pares com menos de 100 votacoes em comum ou cobertura abaixo de 50% sao descartados." },
                      { n: "05", title: "Montar o grafo", body: "Cada deputado vira um no. Uma aresta e criada se a similaridade for >= 0,75. O peso da aresta e a propria similaridade — linhas mais grossas indicam pares que quase sempre votam igual." },
                      { n: "06", title: "Detectar comunidades com Leiden", body: "O algoritmo Leiden agrupa nos com muitas conexoes fortes entre si e poucas com outros grupos. O resultado sao comunidades de comportamento que podem ultrapassar fronteiras partidarias." },
                    ].map((step) => (
                      <li key={step.n} className="flex gap-4">
                        <span className="mt-0.5 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color: RED }}>{step.n}</span>
                        <div>
                          <p className="mb-1 text-xs font-bold" style={{ fontFamily: MONO, color: "#f0ece4" }}>{step.title}</p>
                          <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
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
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#161616]"
            style={{ background: "#111" }}
          >
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.28)" }}>10</span>
              <div>
                <p className="text-sm font-bold tracking-wide" style={{ fontFamily: MONO, color: "#f0ece4" }}>DISCIPLINA PARTIDARIA — ALINHAMENTO INTERNO</p>
                <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>Como medimos o quanto cada partido consegue alinhar seus deputados</p>
              </div>
            </div>
            <span className="ml-6 shrink-0 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{methQ10Open ? "▲ RECOLHER" : "▼ EXPANDIR"}</span>
          </button>

          {methQ10Open && (
            <div className="border-t border-border px-5 py-7" style={{ background: "#0d0d0d" }}>
              <p className="mb-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">Objetivo: descobrir qual partido e mais disciplinado — qual consegue que seus deputados votem conforme a orientacao oficial na maior parte das vezes.</p>
              <ol className="grid gap-5 lg:grid-cols-2">
                {[
                  { n: "01", title: "Identificar votacoes com diretriz", body: "Filtra-se apenas as votacoes em que o partido emitiu orientacao explicita — Sim ou Nao. Orientacoes do tipo Liberado, Abstencao e Obstrucao sao excluidas: sem diretriz clara, nao ha alinhamento a medir." },
                  { n: "02", title: "Verificar alinhamento voto a voto", body: "Para cada voto de um deputado em uma votacao com diretriz, compara-se o voto do deputado com a orientacao do partido. Se iguais: voto alinhado. Se diferentes: voto contrario." },
                  { n: "03", title: "Agregar por partido", body: "Soma-se, por partido, todos os votos alinhados e o total de votos em situacao de diretriz. Um mesmo partido pode ter varios deputados em muitas votacoes — tudo e acumulado no periodo." },
                  { n: "04", title: "Calcular o indice de alinhamento", body: "% alinhamento = (votos alinhados / total de votos com diretriz) x 100. Um partido com 95% esta quase sempre unido; um com 60% tem um terco dos votos indo contra a propria orientacao." },
                  { n: "05", title: "Ranquear e filtrar por ano", body: "Ordena-se do maior para o menor percentual. O filtro de ano permite ver se um partido ficou mais ou menos disciplinado ao longo da legislatura — util para identificar rachas internos ou momentos de coesao." },
                  { n: "06", title: "Cruzar com ideologia", body: "Cada partido e cruzado com a tabela partidos_ideologia para categorizar o espectro politico. Isso permite observar se partidos de esquerda, centro ou direita tendem a ser mais disciplinados." },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span className="mt-0.5 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color: RED }}>{step.n}</span>
                    <div>
                      <p className="mb-1 text-xs font-bold" style={{ fontFamily: MONO, color: "#f0ece4" }}>{step.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
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
