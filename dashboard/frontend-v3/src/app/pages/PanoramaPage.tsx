import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import { fetchQuestion } from "../api";
import type { QuestionPayload, TableSpec } from "../types";

type PanoramaPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
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
const normalizedCb = (row: Row) => raw(row, "custo_beneficio") * 1000;

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

function Section({ n, tag, title, sub, children }: SectionProps) {
  return (
    <section className="border-b border-border px-6 py-16 md:px-14">
      <div className="mb-2 flex items-baseline gap-4">
        <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
          {n}
        </span>
        <span className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          {tag}
        </span>
      </div>
      <h2 className="mb-2 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
        {title}
      </h2>
      {sub ? (
        <p className="mb-10 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
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

export default function PanoramaPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado }: PanoramaPageProps) {
  // Seção 01 — Top deputados
  const [top10, setTop10] = useState<Row[]>([]);
  const [tableOpen, setTableOpen] = useState(false);
  const [tableRows, setTableRows] = useState<Row[]>([]);
  const [tablePage, setTablePage] = useState(1);
  const [tableTotal, setTableTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Seção 01B — Categorias globais de gasto
  const CAT_PAGE_SIZE = 10;
  const [catTop10, setCatTop10] = useState<Row[]>([]);
  const [catAllRows, setCatAllRows] = useState<Row[]>([]);
  const [catTableOpen, setCatTableOpen] = useState(false);
  const [catTablePage, setCatTablePage] = useState(1);
  const catTableRef = useRef<HTMLDivElement>(null);

  // Seção 01C — Eixos de atuação (temas legislativos)
  const EIXO_PAGE_SIZE = 10;
  const [eixoTop10, setEixoTop10] = useState<Row[]>([]);
  const [eixoAllRows, setEixoAllRows] = useState<Row[]>([]);
  const [eixoTableOpen, setEixoTableOpen] = useState(false);
  const [eixoTablePage, setEixoTablePage] = useState(1);
  const eixoTableRef = useRef<HTMLDivElement>(null);

  // Seção 01D — Custo-benefício
  const CB_PAGE_SIZE = 15;
  const [cbTop10, setCbTop10] = useState<Row[]>([]);
  const [cbAllRows, setCbAllRows] = useState<Row[]>([]);
  const [cbTableOpen, setCbTableOpen] = useState(false);
  const [cbTableRows, setCbTableRows] = useState<Row[]>([]);
  const [cbTablePage, setCbTablePage] = useState(1);
  const [cbTableTotal, setCbTableTotal] = useState(0);
  const [cbTableLoading, setCbTableLoading] = useState(false);
  const cbTableRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateDeputado={onNavigateDeputado} />

      <PageHero
        n="1"
        tag="VISÃO GERAL"
        title="Panorama"
        titleRed="Geral"
        desc="Uma visão estática e abrangente dos padrões de gasto, fornecedores dominantes e grupos de influência na 57ª Legislatura. Sem filtros, com dados mockados do período."
        imgId="/fundorecortes/recorte1/fundo-recorte1.png"
        hideStrip
        stripImgs={[
          { id: "photo-1561489396-888724a1543d", alt: "Reunião parlamentar" },
          { id: "photo-1567965606933-c46e07393d91", alt: "Manifestação política" },
          { id: "photo-1529107386315-e1a2ed48a620", alt: "Congresso" },
        ]}
      />

      <Section n="01" tag="DEPUTADOS" title="Top 10 que mais gastam" sub="CEAP ACUMULADA 2023-2026 · TODOS OS DEPUTADOS FEDERAIS">

        {/* ── Ranking com fotos ── */}
        <div className="mb-10 flex flex-col gap-0 border border-border" style={{ background: "#0e0e0e" }}>
          {top10.map((dep, idx) => {
            const id = str(dep, "id_deputado");
            const nome = str(dep, "nome");
            const partido = str(dep, "sigla_partido");
            const uf = str(dep, "sigla_uf");
            const total = raw(dep, "gasto_total");
            const isFirst = idx === 0;
            const rankColor = isFirst ? RED : idx < 3 ? "#d4841a" : "rgba(240,236,228,0.18)";
            const barPct = top10[0] ? (total / raw(top10[0], "gasto_total")) * 100 : 0;

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
                  <p className="truncate text-xl font-bold leading-tight" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
                    {nome}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="border px-2 py-1 text-xs font-bold uppercase"
                      style={{ fontFamily: MONO, borderColor: `${rankColor}55`, color: rankColor, background: `${rankColor}11` }}
                    >
                      {partido}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground" style={{ fontFamily: MONO }}>{uf}</span>
                  </div>
                  {/* Barra de proporção */}
                  <div className="mt-2 h-0.5 overflow-hidden rounded-full" style={{ background: "rgba(240,236,228,0.08)", width: "100%" }}>
                    <div style={{ width: `${barPct}%`, background: isFirst ? RED : idx < 3 ? "#d4841a" : "rgba(196,18,48,0.4)", height: "100%", transition: "width 0.6s ease" }} />
                  </div>
                </div>

                {/* Total */}
                <div className="flex shrink-0 items-center px-6 py-5">
                  <span className="text-base font-black tabular-nums" style={{ fontFamily: MONO, color: isFirst ? RED : "#f0ece4" }}>
                    {fmtCurrency(total)}
                  </span>
                </div>
              </div>
            );
          })}

          {top10.length === 0 && (
            <div className="flex h-24 items-center justify-center text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              CARREGANDO...
            </div>
          )}
        </div>

        {/* ── Tabela colapsável com paginação ── */}
        <div className="border border-border" style={{ background: "#0a0a0a" }}>
          {/* Cabeçalho colapsável */}
          <button
            type="button"
            onClick={handleToggleTable}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="text-xs tracking-[0.24em] text-muted-foreground" style={{ fontFamily: MONO }}>
              TABELA COMPLETA{tableTotal > 0 ? ` · ${tableTotal} DEPUTADOS` : ""}
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
              {/* Tabela */}
              <div className="overflow-x-auto" style={{ maxHeight: 440, overflowY: "auto" }}>
                <table className="min-w-full text-left text-xs" style={{ fontFamily: MONO }}>
                  <thead style={{ background: "#0d0d0d", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      {["#", "Foto", "Deputado", "Partido", "UF", "Total Gasto"].map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 font-normal uppercase text-muted-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">CARREGANDO...</td>
                      </tr>
                    ) : tableRows.map((dep, idx) => {
                      const id = str(dep, "id_deputado");
                      const globalIdx = (tablePage - 1) * PAGE_SIZE + idx;
                      const isFirst = globalIdx === 0;
                      return (
                        <tr key={id} className="border-t border-border hover:bg-white/[0.03]">
                          <td className="px-4 py-2 font-bold" style={{ color: isFirst ? RED : "rgba(240,236,228,0.35)", fontFamily: SERIF }}>
                            {String(globalIdx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-2 py-1">
                            <img
                              src={depPhoto(id)}
                              alt=""
                              className="h-9 w-7 object-cover object-top"
                              style={{ filter: "grayscale(50%)" }}
                              onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                            />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-medium" style={{ color: "#f0ece4", fontFamily: SERIF }}>
                            {str(dep, "nome")}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{str(dep, "sigla_partido")}</td>
                          <td className="px-4 py-2 text-muted-foreground">{str(dep, "sigla_uf")}</td>
                          <td className="px-4 py-2 text-right font-bold" style={{ color: isFirst ? RED : "#f0ece4" }}>
                            {fmtCurrency(raw(dep, "gasto_total"))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {tableTotal > PAGE_SIZE && (
                <div
                  className="flex items-center justify-between border-t px-5 py-4"
                  style={{ borderColor: "rgba(240,236,228,0.18)", background: "#111" }}
                >
                  <button
                    type="button"
                    disabled={tablePage <= 1 || tableLoading}
                    onClick={() => fetchTablePage(tablePage - 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{
                      fontFamily: MONO,
                      border: "1px solid rgba(240,236,228,0.35)",
                      color: "#f0ece4",
                      background: "transparent",
                    }}
                  >
                    ← ANTERIOR
                  </button>

                  <span
                    className="text-xs font-bold tracking-widest"
                    style={{ fontFamily: MONO, color: "#f0ece4" }}
                  >
                    {(tablePage - 1) * PAGE_SIZE + 1}–{Math.min(tablePage * PAGE_SIZE, tableTotal)}&nbsp;&nbsp;/&nbsp;&nbsp;{tableTotal} DEPUTADOS
                  </span>

                  <button
                    type="button"
                    disabled={tablePage * PAGE_SIZE >= tableTotal || tableLoading}
                    onClick={() => fetchTablePage(tablePage + 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{
                      fontFamily: MONO,
                      border: "1px solid rgba(240,236,228,0.35)",
                      color: "#f0ece4",
                      background: "transparent",
                    }}
                  >
                    PRÓXIMA →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════
          SEÇÃO 01-B  CATEGORIAS GLOBAIS DE GASTO
      ════════════════════════════════════════════════════════ */}
      <Section n="01B" tag="CATEGORIAS" title="No geral, onde os deputados mais gastam?" sub="CEAP CONSOLIDADA 2023-2026 · TODAS AS CATEGORIAS DE DESPESA · TOP 10">

        {/* Gráfico horizontal */}
        {catTop10.length > 0 ? (() => {
          const maxVal = raw(catTop10[0], "total_gasto") || 1;
          const barData = catTop10.map((r, i) => ({
            name: abrevCat(str(r, "descricao_despesa")),
            total: raw(r, "total_gasto"),
            pct: raw(r, "pct_total"),
            fill: i === 0 ? RED : i < 3 ? "#d4841a" : "rgba(196,18,48,0.40)",
          }));

          return (
            <div className="mb-10">
              <div className="mb-2 h-[340px] border border-border p-4" style={{ background: "#0e0e0e" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ left: 0, right: 80, top: 8, bottom: 8 }}
                    barCategoryGap="28%"
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: "rgba(240,236,228,0.55)", fontSize: 11, fontFamily: MONO }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1_000_000 ? `R$${(v / 1_000_000).toFixed(0)}M` : `R$${(v / 1_000).toFixed(0)}k`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={250}
                      tick={{ fill: "#f0ece4", fontSize: 13, fontFamily: MONO, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", color: "#ffffff", fontFamily: MONO, fontSize: 12 }}
                      itemStyle={{ color: "#ffffff" }}
                      labelStyle={{ color: "#ffffff" }}
                      formatter={(v: number, _: string, e: { payload?: { pct?: number } }) => [
                        `${fmtCurrency(v)}  ·  ${(e.payload?.pct ?? 0).toFixed(1)}% do total`,
                        "Total CEAP",
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

              {/* Mini legenda com % */}
              <div className="grid grid-cols-2 gap-px border border-border sm:grid-cols-5" style={{ background: "rgba(240,236,228,0.06)" }}>
                {catTop10.slice(0, 5).map((r, i) => (
                  <div key={i} className="bg-background px-4 py-3">
                    <p className="mb-1 text-base font-black" style={{ fontFamily: MONO, color: i === 0 ? RED : i < 3 ? "#d4841a" : "#f0ece4" }}>
                      {raw(r, "pct_total").toFixed(1)}%
                    </p>
                    <p className="text-xs font-semibold leading-snug text-muted-foreground" style={{ fontFamily: MONO }}>
                      {abrevCat(str(r, "descricao_despesa"))}
                    </p>
                    <div className="mt-2 h-0.5" style={{ background: `linear-gradient(to right, ${i === 0 ? RED : i < 3 ? "#d4841a" : "rgba(196,18,48,0.4)"} ${(raw(r, "pct_total") / raw(catTop10[0], "pct_total")) * 100}%, transparent 0%)` }} />
                  </div>
                ))}
              </div>

              {/* Barra de proporção visual */}
              <div className="mt-3 flex h-3 overflow-hidden border border-border">
                {catTop10.map((r, i) => {
                  const w = (raw(r, "total_gasto") / maxVal) * 100 / catTop10.length * catTop10.length;
                  const pct = raw(r, "pct_total");
                  return (
                    <div
                      key={i}
                      title={`${abrevCat(str(r, "descricao_despesa"))}: ${pct.toFixed(1)}%`}
                      style={{
                        width: `${pct}%`,
                        background: i === 0 ? RED : i === 1 ? "#b05010" : i === 2 ? "#a04828" : i < 5 ? "rgba(196,18,48,0.5)" : "rgba(196,18,48,0.2)",
                        transition: "width 0.6s ease",
                      }}
                    />
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground" style={{ fontFamily: MONO }}>
                Barra proporcional ao % do total · hover para ver categoria
              </p>
            </div>
          );
        })() : (
          <div className="mb-10 flex h-24 items-center justify-center border border-border text-xs text-muted-foreground" style={{ fontFamily: MONO, background: "#0e0e0e" }}>
            CARREGANDO...
          </div>
        )}

        {/* Tabela colapsável — todas as categorias */}
        <div className="border border-border" style={{ background: "#0a0a0a" }}>
          <button
            type="button"
            onClick={() => setCatTableOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="text-xs tracking-[0.24em] text-muted-foreground" style={{ fontFamily: MONO }}>
              TODAS AS CATEGORIAS ({catAllRows.length} no total)
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
              {/* Tabela com scroll interno — igual à seção de deputados */}
              <div className="overflow-x-auto" style={{ maxHeight: 440, overflowY: "auto" }}>
                <table className="min-w-full text-left text-xs" style={{ fontFamily: MONO }}>
                  <thead style={{ background: "#0d0d0d", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      {["#", "Categoria", "Total Gasto", "Lançamentos", "% Total"].map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 font-normal uppercase text-muted-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catAllRows
                      .slice((catTablePage - 1) * CAT_PAGE_SIZE, catTablePage * CAT_PAGE_SIZE)
                      .map((r) => {
                        const globalIdx = catAllRows.indexOf(r);
                        const isTop = globalIdx === 0;
                        const nome = str(r, "descricao_despesa");
                        const total = raw(r, "total_gasto");
                        const pct = raw(r, "pct_total");
                        const lances = raw(r, "qtd_lancamentos");
                        return (
                          <tr key={globalIdx} className="border-t border-border hover:bg-white/[0.03]">
                            <td className="px-4 py-2.5 font-bold" style={{ color: isTop ? RED : globalIdx < 3 ? "#d4841a" : "rgba(240,236,228,0.3)", fontFamily: SERIF }}>
                              {String(globalIdx + 1).padStart(2, "0")}
                            </td>
                            <td className="px-4 py-2.5" style={{ color: "#f0ece4", maxWidth: 360 }}>
                              <span className="block leading-tight">{abrevCat(nome)}</span>
                              <span className="mt-0.5 block text-[10px] text-muted-foreground">{nome}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold" style={{ color: isTop ? RED : "#f0ece4" }}>
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
                                <span style={{ color: isTop ? RED : "#f0ece4", minWidth: 40 }}>{pct.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Rodapé de paginação — idêntico ao da seção de deputados */}
              {catAllRows.length > CAT_PAGE_SIZE && (
                <div
                  className="flex items-center justify-between border-t px-5 py-4"
                  style={{ borderColor: "rgba(240,236,228,0.18)", background: "#111" }}
                >
                  <button
                    type="button"
                    disabled={catTablePage === 1}
                    onClick={() => setCatTablePage((p) => Math.max(1, p - 1))}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid rgba(240,236,228,0.35)", color: "#f0ece4", background: "transparent" }}
                  >
                    ← ANTERIOR
                  </button>
                  <span className="text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: "#f0ece4" }}>
                    {(catTablePage - 1) * CAT_PAGE_SIZE + 1}–{Math.min(catTablePage * CAT_PAGE_SIZE, catAllRows.length)}&nbsp;&nbsp;/&nbsp;&nbsp;{catAllRows.length} CATEGORIAS
                  </span>
                  <button
                    type="button"
                    disabled={catTablePage * CAT_PAGE_SIZE >= catAllRows.length}
                    onClick={() => setCatTablePage((p) => p + 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid rgba(240,236,228,0.35)", color: "#f0ece4", background: "transparent" }}
                  >
                    PRÓXIMA →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════
          SEÇÃO 01C  EIXOS DE ATUAÇÃO — TEMAS LEGISLATIVOS
      ════════════════════════════════════════════════════════ */}
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
              <div className="mb-2 h-[360px] border border-border p-4" style={{ background: "#0e0e0e" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ left: 0, right: 80, top: 8, bottom: 8 }}
                    barCategoryGap="28%"
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: "rgba(240,236,228,0.55)", fontSize: 11, fontFamily: MONO }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => v.toLocaleString("pt-BR")}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={260}
                      tick={{ fill: "#f0ece4", fontSize: 13, fontFamily: MONO, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", color: "#ffffff", fontFamily: MONO, fontSize: 12 }}
                      itemStyle={{ color: "#ffffff" }}
                      labelStyle={{ color: "#ffffff" }}
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
                    <p className="mb-1 text-base font-black" style={{ fontFamily: MONO, color: i === 0 ? RED : i < 3 ? "#d4841a" : "#f0ece4" }}>
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
          <div className="mb-10 flex h-24 items-center justify-center border border-border text-xs text-muted-foreground" style={{ fontFamily: MONO, background: "#0e0e0e" }}>
            CARREGANDO...
          </div>
        )}

        {/* Tabela colapsável — todos os eixos */}
        <div className="border border-border" style={{ background: "#0a0a0a" }}>
          <button
            type="button"
            onClick={() => setEixoTableOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="text-xs tracking-[0.24em] text-muted-foreground" style={{ fontFamily: MONO }}>
              TODOS OS EIXOS ({eixoAllRows.length} no total)
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
                  <thead style={{ background: "#0d0d0d", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      {["#", "Eixo Temático", "Proposições", "Aprovadas", "% Total"].map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 font-normal uppercase text-muted-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eixoAllRows
                      .slice((eixoTablePage - 1) * EIXO_PAGE_SIZE, eixoTablePage * EIXO_PAGE_SIZE)
                      .map((r) => {
                        const gi = eixoAllRows.indexOf(r);
                        const isTop = gi === 0;
                        const total = raw(r, "qtd_proposicoes");
                        const aprov = raw(r, "proposicoes_aprovadas");
                        const pct = raw(r, "pct_total");
                        return (
                          <tr key={gi} className="border-t border-border hover:bg-white/[0.03]">
                            <td className="px-4 py-2.5 font-bold" style={{ color: isTop ? RED : gi < 3 ? "#d4841a" : "rgba(240,236,228,0.3)", fontFamily: SERIF }}>
                              {String(gi + 1).padStart(2, "0")}
                            </td>
                            <td className="px-4 py-2.5 font-medium" style={{ color: "#f0ece4" }}>
                              {str(r, "tema")}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold" style={{ color: isTop ? RED : "#f0ece4" }}>
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
                                <span style={{ color: isTop ? RED : "#f0ece4", minWidth: 40 }}>{pct.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {eixoAllRows.length > EIXO_PAGE_SIZE && (
                <div
                  className="flex items-center justify-between border-t px-5 py-4"
                  style={{ borderColor: "rgba(240,236,228,0.18)", background: "#111" }}
                >
                  <button
                    type="button"
                    disabled={eixoTablePage === 1}
                    onClick={() => setEixoTablePage((p) => Math.max(1, p - 1))}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid rgba(240,236,228,0.35)", color: "#f0ece4", background: "transparent" }}
                  >
                    ← ANTERIOR
                  </button>
                  <span className="text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: "#f0ece4" }}>
                    {(eixoTablePage - 1) * EIXO_PAGE_SIZE + 1}–{Math.min(eixoTablePage * EIXO_PAGE_SIZE, eixoAllRows.length)}&nbsp;&nbsp;/&nbsp;&nbsp;{eixoAllRows.length} EIXOS
                  </span>
                  <button
                    type="button"
                    disabled={eixoTablePage * EIXO_PAGE_SIZE >= eixoAllRows.length}
                    onClick={() => setEixoTablePage((p) => p + 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid rgba(240,236,228,0.35)", color: "#f0ece4", background: "transparent" }}
                  >
                    PRÓXIMA →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════
          SEÇÃO 01D  CUSTO-BENEFÍCIO DOS DEPUTADOS
      ════════════════════════════════════════════════════════ */}
      <Section n="01D" tag="CUSTO-BENEFÍCIO" title="Quem entrega mais por menos?" sub="RANKING GLOBAL 2023-2026 · BENEFÍCIO ÷ GASTO TOTAL · TOP 10 DEPUTADOS">

        {/* Ranking top 10 */}
        <div className="mb-10 flex flex-col gap-3">
          {cbTop10.length === 0 && (
            <div className="flex h-24 items-center justify-center border border-border text-xs text-muted-foreground" style={{ fontFamily: MONO, background: "#0e0e0e" }}>
              CARREGANDO...
            </div>
          )}
          {cbTop10.map((r, i) => {
            const id = raw(r, "id_deputado");
            const nome = str(r, "nome");
            const partido = str(r, "sigla_partido");
            const uf = str(r, "sigla_uf");
            const gasto = raw(r, "gasto_total");
            const benef = raw(r, "beneficio");
            const cb = normalizedCb(r);
            const maxCb = normalizedCb(cbTop10[0]) || 1;
            const barW = Math.min((cb / maxCb) * 100, 100);
            const color = i === 0 ? RED : i < 3 ? "#d4841a" : "rgba(196,18,48,0.55)";
            return (
              <div key={i} className="flex items-center gap-5 border border-border px-6 py-4" style={{ background: "#0a0a0a" }}>
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
                  <p className="truncate text-lg font-black" style={{ color: "#f0ece4", fontFamily: MONO }}>
                    {nome}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-bold" style={{ background: "rgba(240,236,228,0.08)", color: "#f0ece4", fontFamily: MONO }}>
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
                  <p className="text-base font-black" style={{ fontFamily: MONO, color }}>
                    {cb.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground" style={{ fontFamily: MONO }}>pts / R$ 1 mil</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground" style={{ fontFamily: MONO }}>
                    benef. {benef.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} · gasto {fmtCurrency(gasto)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabela colapsável — todos por custo-benefício */}
        <div className="border border-border" style={{ background: "#0a0a0a" }}>
          <button
            type="button"
            onClick={handleToggleCbTable}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="text-xs tracking-[0.24em] text-muted-foreground" style={{ fontFamily: MONO }}>
              TABELA COMPLETA{cbTableTotal > 0 ? ` · ${cbTableTotal} REGISTROS` : ""}
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
                  <thead style={{ background: "#0d0d0d", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      {["#", "Foto", "Deputado", "Partido", "UF", "Ano", "Pts / R$ 1 mil", "Benefício", "Gasto"].map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 font-normal uppercase text-muted-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cbTableLoading ? (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">CARREGANDO...</td></tr>
                    ) : cbTableRows.map((r, i) => {
                      const globalRank = (cbTablePage - 1) * CB_PAGE_SIZE + i + 1;
                      const id = raw(r, "id_deputado");
                      const isTop = globalRank === 1;
                      const color = isTop ? RED : globalRank <= 3 ? "#d4841a" : "rgba(240,236,228,0.3)";
                      return (
                        <tr key={i} className="border-t border-border hover:bg-white/[0.03]">
                          <td className="px-4 py-2.5 font-bold" style={{ color, fontFamily: SERIF }}>
                            {String(globalRank).padStart(2, "0")}
                          </td>
                          <td className="px-4 py-2.5">
                            <img src={depPhoto(id)} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              className="h-7 w-7 rounded-full object-cover" style={{ border: `1px solid ${color}` }} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 font-medium" style={{ color: "#f0ece4" }}>{str(r, "nome")}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{str(r, "sigla_partido")}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{str(r, "sigla_uf")}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{str(r, "ano_dados")}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold" style={{ color: isTop ? RED : "#f0ece4" }}>
                            {normalizedCb(r).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">
                            {raw(r, "beneficio").toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
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

              {cbTableTotal > CB_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "rgba(240,236,228,0.18)", background: "#111" }}>
                  <button
                    type="button"
                    disabled={cbTablePage <= 1 || cbTableLoading}
                    onClick={() => fetchCbTablePage(cbTablePage - 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid rgba(240,236,228,0.35)", color: "#f0ece4", background: "transparent" }}
                  >
                    ← ANTERIOR
                  </button>
                  <span className="text-xs font-bold tracking-widest" style={{ fontFamily: MONO, color: "#f0ece4" }}>
                    {(cbTablePage - 1) * CB_PAGE_SIZE + 1}–{Math.min(cbTablePage * CB_PAGE_SIZE, cbTableTotal)}&nbsp;&nbsp;/&nbsp;&nbsp;{cbTableTotal} REGISTROS
                  </span>
                  <button
                    type="button"
                    disabled={cbTablePage * CB_PAGE_SIZE >= cbTableTotal || cbTableLoading}
                    onClick={() => fetchCbTablePage(cbTablePage + 1)}
                    className="px-5 py-2 text-xs font-semibold tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ fontFamily: MONO, border: "1px solid rgba(240,236,228,0.35)", color: "#f0ece4", background: "transparent" }}
                  >
                    PRÓXIMA →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════
          METODOLOGIA — colapsável, não poluente
      ════════════════════════════════════════════════════════ */}
      <Section n="MET" tag="METODOLOGIA" title="Como os indicadores foram calculados?" sub="TRANSPARÊNCIA ANALÍTICA · CLIQUE EM CADA MÉTODO PARA EXPANDIR">
        {([
          {
            id: "cb",
            titulo: "Score de Custo-Benefício",
            origem: "Q7 — Índice de Custo-Benefício",
            formula: "Score = Benefício ÷ Gasto Total",
            passos: [
              "1. Benefício é calculado como: (qtd_proposicoes × 0,4) + (proposicoes_aprovadas × 5) + (presenca_total × 1,0)",
              "2. O score é a razão entre esse benefício estimado e o gasto total do deputado no CEAP.",
              "3. Quanto maior o score, mais o deputado 'entregou' por real gasto. Um score de 0,01 significa que cada R$ 100 de gasto gerou 1 ponto de benefício.",
              "4. Deputados com gasto zero ou quase zero podem ter scores distorcidos — analise com cautela os primeiros colocados.",
            ],
            interpretacao: "O score não mede qualidade legislativa, mas eficiência de custo. Um deputado pode ter score alto por gastar pouco (mesmo com baixo volume de produção).",
          },
          {
            id: "eixos",
            titulo: "Eixos Temáticos de Atuação",
            origem: "Q2 — Eixos e Nuvem de Palavras",
            formula: "Soma de proposições por tema, agregada sobre todos os deputados (2023-2026)",
            passos: [
              "1. Cada proposição de autoria de um deputado é classificada em um de 32 eixos temáticos (ex.: Saúde, Educação, Defesa e Segurança).",
              "2. A classificação é feita por análise de texto dos títulos e ementas das proposições.",
              "3. As proposições de todos os deputados são somadas por eixo, resultando no volume total de cada tema na legislatura.",
              "4. O ranking mostra quais áreas concentram maior atividade legislativa coletiva.",
            ],
            interpretacao: "Eixos com maior volume não são necessariamente mais importantes — podem refletir maior facilidade de protocolar projetos naquela área.",
          },
          {
            id: "gastos_cat",
            titulo: "Categorias de Gasto (CEAP)",
            origem: "Q13 — Categorias de Gasto por Deputado",
            formula: "Soma do gasto_total por descricao_despesa, sobre todos os deputados e anos",
            passos: [
              "1. Cada lançamento do CEAP possui uma categoria de despesa (ex.: Divulgação Parlamentar, Passagem Aérea).",
              "2. Os valores são somados por categoria, independentemente do deputado ou partido.",
              "3. O percentual é calculado como: (gasto da categoria ÷ total geral) × 100.",
              "4. Isso revela onde o dinheiro público de gabinete vai, em termos agregados.",
            ],
            interpretacao: "Divulgação da Atividade Parlamentar representa ~40% do total do CEAP — é a categoria dominante e mais discutida em auditorias do uso da cota.",
          },
          {
            id: "gastos_dep",
            titulo: "Ranking de Gastos por Deputado",
            origem: "Q1 — Gastos por Deputado",
            formula: "gasto_total = soma de todos os lançamentos CEAP do deputado no período",
            passos: [
              "1. Cada nota fiscal ou lançamento reembolsado pelo CEAP é somado ao total do deputado.",
              "2. O período cobre 2023-2026 (57ª Legislatura em exercício).",
              "3. O ranking é ordenado de forma decrescente — quem gastou mais aparece no topo.",
              "4. Gastos altos não significam corrupção; o CEAP é uma cota legal com limites por estado.",
            ],
            interpretacao: "Deputados de estados maiores (SP, RJ) têm cota CEAP maior, o que influencia quem aparece no topo do ranking. Compare dentro do mesmo estado para análises mais justas.",
          },
        ] as Array<{ id: string; titulo: string; origem: string; formula: string; passos: string[]; interpretacao: string }>).map((m) => (
          <div key={m.id} className="mb-2 border border-border" style={{ background: "#0a0a0a" }}>
            <button
              type="button"
              onClick={() => toggleMetodo(m.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
            >
              <div>
                <p className="text-sm font-bold" style={{ color: "#f0ece4", fontFamily: MONO }}>{m.titulo}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground" style={{ fontFamily: MONO }}>{m.origem}</p>
              </div>
              <span className="ml-4 shrink-0 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {metodoOpen[m.id] ? "▲" : "▼"}
              </span>
            </button>

            {metodoOpen[m.id] && (
              <div className="border-t border-border px-5 py-5" style={{ background: "#080808" }}>
                {/* Fórmula */}
                <div className="mb-4 border-l-2 py-2 pl-4" style={{ borderColor: RED }}>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Fórmula</p>
                  <p className="mt-1 text-sm font-bold" style={{ color: "#f0ece4", fontFamily: MONO }}>{m.formula}</p>
                </div>
                {/* Passos */}
                <div className="mb-4 flex flex-col gap-2">
                  {m.passos.map((p, pi) => (
                    <p key={pi} className="text-xs leading-relaxed" style={{ color: "rgba(240,236,228,0.75)", fontFamily: MONO }}>{p}</p>
                  ))}
                </div>
                {/* Interpretação */}
                <div className="border border-border p-3" style={{ background: "rgba(196,18,48,0.06)" }}>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1" style={{ fontFamily: MONO }}>Como interpretar</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(240,236,228,0.75)", fontFamily: MONO }}>{m.interpretacao}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </Section>
    </div>
  );
}
