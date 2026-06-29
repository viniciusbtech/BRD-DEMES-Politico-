import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchMeta, fetchQuestion } from "../api";
import type { FilterCatalog, FilterChoice, MetaResponse, QuestionPayload, TableSpec } from "../types";
import { useTheme } from "../../contexts/ThemeContext";
import NavBar from "../components/NavBar";

type Row = Record<string, unknown>;

const strVal = (row: Row | undefined, key: string) => String(row?.[key] ?? "");

const isGlobalCbTable = (table: TableSpec) => {
  const title = table.title.toLowerCase();
  return title.includes("ranking global") && title.includes("todos os anos");
};

const getGlobalCbTable = (payload: QuestionPayload) =>
  [payload.table_spec, ...payload.complement_tables].find(isGlobalCbTable) ?? payload.complement_tables[0];

const getGlobalCbRows = (payload: QuestionPayload): Row[] => {
  const globalTable = getGlobalCbTable(payload);
  const rows = (globalTable?.rows ?? []) as Row[];
  const globalOnly = rows.filter((r) => strVal(r, "ano_dados").toUpperCase() === "GLOBAL");
  return globalOnly.length > 0 ? [...globalOnly] : [...rows];
};

const dedupeGlobalRows = (rows: Row[]): Row[] => {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${strVal(r, "ano_dados")}:${strVal(r, "id_deputado")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchGlobalCbRanking = async (): Promise<Row[]> => {
  const pageSize = 200;
  const first = await fetchQuestion("q7", {}, { page: 1, pageSize });
  const firstTable = getGlobalCbTable(first);
  const total = firstTable?.total ?? 0;
  const effectivePageSize = firstTable?.page_size ?? pageSize;
  const pages = Math.ceil(total / effectivePageSize);

  const rest =
    pages > 1
      ? await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) => fetchQuestion("q7", {}, { page: i + 2, pageSize })),
        )
      : [];

  return dedupeGlobalRows([first, ...rest].flatMap(getGlobalCbRows));
};

type DeputadoPageProps = { onNavigateHome: () => void; onNavigateRecortes: () => void; onNavigateRecorte: (path: string) => void };
type DeputySelection = FilterChoice;
type DeputadoSection = "gastos" | "eixos" | "votacoes" | "custo-beneficio" | "metodologia";
type QuestionId = "q1" | "q13" | "q2" | "q3" | "q7";
type ProfilePayloads = Partial<Record<QuestionId, QuestionPayload>>;
type SpendingRow = {
  categoria: string;
  gasto: number;
  lancamentos: number;
};

const emptyFilters: FilterCatalog = {
  anos: [],
  eixos: [],
  partidos: [],
  ufs: [],
  deputados: [],
  escolaridade: [],
};

const DEPUTY_SEARCH_HERO_DARK_IMAGE = "/fundorecortes/recorte2/fundo-recorte2.jpg";
const DEPUTY_SEARCH_HERO_LIGHT_IMAGE = "/fundorecortes/recorte2/lightmode/fundo-recorte2-light.jpg";

const money = (value: unknown) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value || 0));

const number = (value: unknown) => new Intl.NumberFormat("pt-BR").format(Number(value || 0));
const raw = (row: Record<string, unknown> | undefined, key: string) => Number(row?.[key] || 0);
const photo = (deputy: string | Pick<FilterChoice, "value" | "photo_url">) => {
  const id = typeof deputy === "string" ? deputy : deputy.value;
  const apiPhoto = typeof deputy === "string" ? null : deputy.photo_url;
  return apiPhoto || (/^\d+$/.test(id) ? `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg` : "/intro/deputados/107283.jpg");
};

const aggregateSpendingByCategory = (rows: Array<Record<string, unknown>>): SpendingRow[] => {
  const grouped = new Map<string, SpendingRow>();

  rows.forEach((row) => {
    const categoria = String(row.descricao_despesa || "Categoria");
    const current = grouped.get(categoria) ?? { categoria, gasto: 0, lancamentos: 0 };
    current.gasto += raw(row, "gasto_total");
    current.lancamentos += raw(row, "qtd_lancamentos");
    grouped.set(categoria, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.gasto - a.gasto);
};


function EmptyPanel({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-[180px] items-center justify-center border p-8 text-center"
      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}
    >
      {message}
    </div>
  );
}

function SearchHero({
  query,
  selected,
  options,
  onQueryChange,
  onSelect,
}: {
  query: string;
  selected: DeputySelection | null;
  options: DeputySelection[];
  onQueryChange: (value: string) => void;
  onSelect: (deputy: DeputySelection) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options.slice(0, 8);
    return options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(normalized)).slice(0, 10);
  }, [options, query]);

  return (
    <section className="relative z-20 overflow-visible border-b px-6 py-10 sm:px-10 sm:py-12" style={{ borderColor: "var(--border)" }}>
      <img
        src={isDark ? DEPUTY_SEARCH_HERO_DARK_IMAGE : DEPUTY_SEARCH_HERO_LIGHT_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          if (!isDark && event.currentTarget.src.includes(DEPUTY_SEARCH_HERO_LIGHT_IMAGE)) {
            event.currentTarget.src = DEPUTY_SEARCH_HERO_DARK_IMAGE;
          }
        }}
        style={{
          filter: isDark
            ? "grayscale(20%) contrast(1.05) brightness(0.42)"
            : "grayscale(34%) contrast(0.96) brightness(1.12) saturate(0.82)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(to right, rgba(5,5,5,0.93) 0%, rgba(5,5,5,0.78) 48%, rgba(5,5,5,0.45) 100%)"
            : "linear-gradient(to right, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.84) 48%, rgba(226,232,240,0.52) 100%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1434px]">
        <p className="mb-4 text-[13px] font-bold uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.36em" }}>
          Pesquise um deputado federal
        </p>
        <h1 className="max-w-[900px] text-[42px] font-black leading-[0.95] sm:text-[66px]" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
          {selected ? selected.label : "Quem e o deputado?"}
        </h1>
        <p className="mt-5 max-w-[760px] text-[17px] leading-relaxed sm:text-[19px]" style={{ color: "var(--foreground)" }}>
          Consulte gastos, temas de atuacao, votos por eixo e custo-beneficio do mandato em uma unica leitura.
        </p>

        <div className="relative mt-9 max-w-[680px]">
          {selected && (
            <div
              className="mb-3 flex items-center gap-3 border px-4 py-2"
              style={{ borderColor: "#22c55e", background: "rgba(34,197,94,0.08)" }}
            >
              <span style={{ color: "#22c55e", fontSize: "16px" }}>✓</span>
              <span className="text-[14px] font-bold" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
                {selected.label}
              </span>
              <span className="ml-auto text-[12px] font-bold uppercase" style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace" }}>
                Selecionado
              </span>
            </div>
          )}
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={selected ? "Buscar outro deputado..." : "Nome do deputado..."}
            className="h-14 w-full border bg-transparent px-5 text-[15px] outline-none"
            style={{
              borderColor: selected ? "#22c55e" : "var(--border)",
              color: "var(--foreground)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          {!selected && (query || filtered.length > 0) ? (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[360px] overflow-y-auto border shadow-2xl" style={{ borderColor: "#e00836", background: "var(--card)" }}>
              {filtered.length === 0 ? (
                <p className="px-4 py-4 text-[13px] uppercase" style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                  Nenhum resultado
                </p>
              ) : (
                filtered.map((deputy) => (
                  <button
                    key={deputy.value}
                    type="button"
                    onClick={() => onSelect(deputy)}
                    className="flex w-full items-center gap-4 border-b px-4 py-3 text-left transition-colors hover:bg-[rgba(224,8,54,0.08)]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <img src={photo(deputy)} alt="" className="h-12 w-10 object-cover object-top" style={{ filter: "grayscale(30%) contrast(1.1)" }} />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[16px]" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
                        {deputy.label}
                      </strong>
                      <small className="text-[12px] uppercase" style={{ color: "var(--foreground)", opacity: 0.7, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em" }}>
                        ID {deputy.value}
                      </small>
                    </span>
                    <span className="text-[12px] font-bold uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.16em" }}>
                      Ver →
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function YearTabs({
  years,
  selectedYear,
  onYearChange,
}: {
  years: FilterChoice[];
  selectedYear: string;
  onYearChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => onYearChange("")}
        className="h-10 border px-5 text-[13px] font-bold uppercase transition-colors"
        style={{
          borderColor: selectedYear ? "var(--border)" : "#e00836",
          background: selectedYear ? "transparent" : "#e00836",
          color: selectedYear ? "var(--foreground)" : "#fff",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Total acumulado
      </button>
      {years.map((year) => (
        <button
          key={year.value}
          type="button"
          onClick={() => onYearChange(year.value)}
          className="h-10 border px-5 text-[13px] font-bold uppercase transition-colors"
          style={{
            borderColor: selectedYear === year.value ? "#e00836" : "var(--border)",
            background: selectedYear === year.value ? "#e00836" : "transparent",
            color: selectedYear === year.value ? "#fff" : "var(--foreground)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {year.label}
        </button>
      ))}
    </div>
  );
}

function ProfileBanner({ deputy }: { deputy: DeputySelection }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className="relative overflow-hidden border-y px-6 py-10 sm:px-10"
      style={{
        borderColor: "var(--border)",
        background: isDark
          ? "var(--background)"
          : "linear-gradient(90deg, #ffffff 0%, #f8fafc 48%, #eef4f9 100%)",
      }}
    >
      <img
        src={photo(deputy)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top"
        style={{
          filter: isDark
            ? "grayscale(80%) brightness(0.22)"
            : "grayscale(88%) contrast(0.95) brightness(1.18) saturate(0.55)",
          opacity: isDark ? 0.72 : 0.16,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(90deg, rgba(5,5,5,0.95), rgba(5,5,5,0.72))"
            : "linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.84) 52%, rgba(226,232,240,0.60) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(circle at 80% 35%, rgba(224,8,54,0.14) 0, rgba(224,8,54,0) 48%)"
            : "radial-gradient(circle at 82% 30%, rgba(0,51,102,0.12) 0, rgba(196,18,48,0.045) 30%, rgba(255,255,255,0) 58%)",
        }}
      />
      <div className="relative mx-auto flex max-w-[1434px] flex-col gap-6 sm:flex-row sm:items-center">
        <img
          src={photo(deputy)}
          alt={deputy.label}
          className="h-44 w-36 border object-cover object-top"
          style={{
            borderColor: "#e00836",
            boxShadow: isDark ? "none" : "0 18px 45px rgba(15,23,42,0.16)",
          }}
        />
        <div>
          <p className="mb-2 text-[13px] font-bold uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.32em" }}>
            Perfil legislativo
          </p>
          <h2 className="text-[36px] font-black leading-none sm:text-[54px]" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
            {deputy.label}
          </h2>
          <p className="mt-4 max-w-[760px] text-[17px] leading-relaxed" style={{ color: "var(--foreground)" }}>
            Recorte de gastos com cota parlamentar, consolidado a partir dos dados publicos da Camara dos Deputados.
          </p>
        </div>
      </div>
    </section>
  );
}

function SpendingSection({
  payloads,
  annualPayloads,
  years,
  selectedYear,
  onYearChange,
}: {
  payloads: ProfilePayloads;
  annualPayloads: Record<string, QuestionPayload>;
  years: FilterChoice[];
  selectedYear: string;
  onYearChange: (value: string) => void;
}) {
  const q1 = payloads.q1?.table_spec.rows[0];
  const rows = aggregateSpendingByCategory(payloads.q13?.table_spec.rows ?? []).slice(0, 10);
  const colors = ["#d20f3a", "#e39115", "#4a7c59", "#2f66ad", "#8745aa", "#777777", "#b8b2a8", "#7c1022"];
  const annualRows = years.map((year) => {
    const yearRows = annualPayloads[year.value]?.table_spec.rows ?? [];
    return {
      ano: year.value,
      gasto: yearRows.reduce((sum, row) => sum + raw(row, "gasto_total"), 0),
    };
  });
  const selectedAnnualTotal = selectedYear ? annualRows.find((row) => row.ano === selectedYear)?.gasto ?? 0 : null;
  const total = selectedAnnualTotal ?? raw(q1, "gasto_total");
  const maxAnnual = Math.max(...annualRows.map((row) => row.gasto), 1);
  const distributionTotal = rows.reduce((sum, row) => sum + row.gasto, 0);

  return (
    <section className="px-6 pb-16 sm:px-10">
      <div className="mx-auto max-w-[1434px]">
        <article className="border-b py-12" style={{ borderColor: "var(--border)" }}>
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-3 text-[13px] font-bold uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.36em" }}>
                Gastos com cota parlamentar
              </p>
              <h2 className="text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
                Quanto ele gastou?
              </h2>
            </div>
            <YearTabs years={years} selectedYear={selectedYear} onYearChange={onYearChange} />
          </div>

          <div className="border" style={{ borderColor: "var(--border)" }}>
            <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "rgba(243,239,232,0.08)" }}>
              <div className="bg-card p-7 lg:col-span-2">
                <p className="mb-3 text-[13px] font-bold uppercase" style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em" }}>
                  {selectedYear ? `Total em ${selectedYear}` : "Total acumulado"}
                </p>
                <strong className="block text-[42px] font-black leading-none sm:text-[52px]" style={{ color: "#e00836", fontFamily: "'Playfair Display', serif" }}>
                  {money(total)}
                </strong>
              </div>
              {annualRows.slice(0, 4).map((row) => (
                <div key={row.ano} className="bg-card p-7">
                  <p className="mb-3 text-[13px] font-bold uppercase" style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em" }}>
                    {row.ano}
                  </p>
                  <strong className="block text-[26px] font-black leading-none" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
                    {money(row.gasto)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-9 h-[300px]">
            {annualRows.some((row) => row.gasto > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={annualRows} margin={{ left: 8, right: 8, top: 10, bottom: 8 }}>
                  <XAxis dataKey="ano" tick={{ fill: "var(--foreground)", fontSize: 13, fontFamily: "JetBrains Mono", fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "var(--foreground)", fontSize: 12, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `R$${Math.round(Number(value) / 1000)}k`}
                    domain={[0, Math.ceil(maxAnnual / 100000) * 100000]}
                  />
                  <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", color: "var(--chart-tooltip-text)", fontSize: "14px" }} formatter={(value) => money(value)} />
                  <Bar dataKey="gasto" fill="#d20f3a" radius={[2, 2, 0, 0]} maxBarSize={78} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message="Sem gastos por ano para este deputado." />
            )}
          </div>
        </article>

        <article className="border-b py-12" style={{ borderColor: "var(--border)" }}>
          <div className="mb-8">
            <p className="mb-3 text-[13px] font-bold uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.36em" }}>
              Distribuicao de despesas
            </p>
            <h2 className="text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
              Como ele gasta o dinheiro?
            </h2>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(260px,420px)_1fr]">
            <div className="h-[300px]">
              {rows.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rows} dataKey="gasto" nameKey="categoria" innerRadius={76} outerRadius={120} paddingAngle={2} stroke="#f3efe8" strokeWidth={1}>
                      {rows.map((_, index) => (
                        <Cell key={index} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", color: "var(--chart-tooltip-text)" }} formatter={(value) => money(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel message="Sem categorias para este filtro." />
              )}
            </div>
            <div className="space-y-5">
              {rows.slice(0, 8).map((row, index) => {
                const pct = distributionTotal ? (row.gasto / distributionTotal) * 100 : 0;
                return (
                  <div key={row.categoria}>
                    <div className="mb-2 grid grid-cols-[minmax(0,1fr)_56px_116px] items-center gap-4 text-[13px]">
                      <span className="flex min-w-0 items-center gap-2 font-bold" style={{ color: "var(--foreground)" }}>
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} />
                        <span className="truncate">{row.categoria}</span>
                      </span>
                      <span className="text-right text-[14px] font-black" style={{ color: colors[index % colors.length], fontFamily: "'JetBrains Mono', monospace" }}>
                        {Math.round(pct)}%
                      </span>
                      <span className="text-right font-bold" style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {money(row.gasto)}
                      </span>
                    </div>
                    <div className="h-[6px] rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: colors[index % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function LegacySpendingSection({ payloads }: { payloads: ProfilePayloads }) {
  const q1 = payloads.q1?.table_spec.rows[0];
  const rows = aggregateSpendingByCategory(payloads.q13?.table_spec.rows ?? []).slice(0, 10);
  const colors = ["#e00836", "#f3efe8", "#8c1d31", "#b8b2a8", "#7c1022", "#6f6a62"];

  return (
    <TwoColumnSection eyebrow="Gastos parlamentares" title="1. Quanto gastou e 2. como gastou o dinheiro">
      <article className="border p-6" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.018)" }}>
        <p className="text-[11px] uppercase" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.16em" }}>
          Q1 - gasto total
        </p>
        <strong className="mt-4 block text-[52px] font-black leading-none" style={{ color: "#e00836", fontFamily: "'Playfair Display', serif" }}>
          {money(q1?.gasto_total)}
        </strong>
        <p className="mt-5 text-[14px]" style={{ color: "var(--muted-foreground)" }}>
          Partido {String(q1?.sigla_partido ?? "-")} · UF {String(q1?.sigla_uf ?? "-")}
        </p>
      </article>

      <article className="border p-6" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <p className="mb-5 text-[11px] uppercase" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.16em" }}>
          Q13 - categorias de gasto
        </p>
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="h-56">
            {rows.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rows} dataKey="gasto" nameKey="categoria" innerRadius={50} outerRadius={92} paddingAngle={2}>
                    {rows.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", color: "var(--chart-tooltip-text)" }} formatter={(value) => money(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message="Sem categorias para este filtro." />
            )}
          </div>
          <div className="space-y-3">
            {rows.slice(0, 6).map((row, index) => (
              <div key={row.categoria}>
                <div className="mb-1 flex justify-between gap-3 text-[12px]">
                  <span className="truncate" style={{ color: "var(--foreground)" }}>{row.categoria}</span>
                  <span style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>{money(row.gasto)}</span>
                </div>
                <div className="h-1 bg-white/10">
                  <div className="h-full" style={{ width: `${Math.min(100, (row.gasto / Math.max(rows[0]?.gasto || 1, 1)) * 100)}%`, background: colors[index % colors.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>
    </TwoColumnSection>
  );
}

function AxesSection({ payloads }: { payloads: ProfilePayloads }) {
  const [viewMode, setViewMode] = useState<"ranking" | "cloud">("ranking");
  const rows = useMemo(() => {
    const totals = new Map<string, { tema: string; proposicoes: number; aprovadas: number }>();
    (payloads.q2?.table_spec.rows ?? []).forEach((row) => {
      const tema = String(row.tema || row.eixo_maior || row.eixo_mais_atuante || row.eixo_principal || "Sem tema");
      const current = totals.get(tema) ?? { tema, proposicoes: 0, aprovadas: 0 };
      current.proposicoes += raw(row, "qtd_proposicoes");
      current.aprovadas += raw(row, "proposicoes_aprovadas");
      totals.set(tema, current);
    });
    return Array.from(totals.values()).sort((a, b) => b.proposicoes - a.proposicoes).slice(0, 10);
  }, [payloads.q2]);
  const total = rows.reduce((sum, row) => sum + row.proposicoes, 0);

  return (
    <section className="border-t px-6 py-16 sm:px-10" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-[1434px]">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 text-[13px] font-bold uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.36em" }}>
              Temas legislativos
            </p>
            <h2 className="text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
              Principais eixos de atuacao
            </h2>
          </div>
          <div className="flex w-full border lg:w-auto" style={{ borderColor: "var(--border)" }}>
            {[
              ["ranking", "Ranking"],
              ["cloud", "Nuvem"],
            ].map(([mode, label]) => {
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode as "ranking" | "cloud")}
                  className="h-11 flex-1 px-4 text-[13px] font-bold uppercase transition-colors lg:min-w-[120px]"
                  style={{
                    background: active ? "#e00836" : "transparent",
                    color: active ? "#fff" : "var(--foreground)",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.12em",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {rows.length ? (
          viewMode === "ranking" ? (
            <div className="max-w-[840px] space-y-7">
              {rows.slice(0, 6).map((row, index) => {
                const pct = total ? (row.proposicoes / total) * 100 : 0;
                return (
                  <div key={row.tema} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4">
                    <span className="pt-1 text-[15px] font-bold" style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="mb-3 flex items-end justify-between gap-4">
                        <strong className="text-[22px] leading-none" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
                          {row.tema}
                        </strong>
                        <strong className="text-[28px] leading-none" style={{ color: "#e00836", fontFamily: "'Playfair Display', serif" }}>
                          {Math.round(pct)}%
                        </strong>
                      </div>
                      <div className="h-[10px] rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: "#b90f2f" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <TopicWordCloud rows={rows} total={total} />
          )
        ) : (
          <EmptyPanel message="Sem eixos de atuacao para este deputado." />
        )}
      </div>
    </section>
  );
}

function TopicWordCloud({
  rows,
  total,
}: {
  rows: Array<{ tema: string; proposicoes: number; aprovadas: number }>;
  total: number;
}) {
  const palette = ["#e00836", "#f3efe8", "#e39115", "#4a7c59", "#2f66ad", "#b8b2a8", "#8745aa"];
  const max = Math.max(...rows.map((row) => row.proposicoes), 1);

  return (
    <div className="min-h-[320px] border p-5 sm:p-8" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <div className="flex min-h-[260px] flex-wrap items-center justify-center gap-x-6 gap-y-5">
        {rows.map((row, index) => {
          const weight = row.proposicoes / max;
          const pct = total ? Math.round((row.proposicoes / total) * 100) : 0;
          const size = Math.round(18 + weight * 34);
          return (
            <span
              key={row.tema}
              title={`${number(row.proposicoes)} proposicoes; ${number(row.aprovadas)} aprovadas`}
              className="inline-flex items-baseline gap-2 whitespace-nowrap leading-none"
              style={{
                color: palette[index % palette.length],
                fontFamily: index % 2 === 0 ? "'Playfair Display', serif" : "'JetBrains Mono', monospace",
                fontSize: `${size}px`,
                fontWeight: index % 2 === 0 ? 900 : 700,
                opacity: 0.58 + weight * 0.42,
              }}
            >
              {row.tema}
              <small className="text-[11px]" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                {pct}%
              </small>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function VotesSection({ payloads }: { payloads: ProfilePayloads }) {
  const [themeQuery, setThemeQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [voteTableMode, setVoteTableMode] = useState<"percentual" | "contagem">("percentual");
  const rows = useMemo(() => {
    const allYearTable = payloads.q3?.complement_tables.find((table) => table.title === "Votos por eixo - todos os anos");
    if (allYearTable?.rows.length) {
      return allYearTable.rows.map((row) => ({
        eixo: String(row.eixo_principal || row.eixo_maior || "Tema"),
        sim: raw(row, "voto_sim") || raw(row, "votos_sim"),
        nao: raw(row, "voto_nao") || raw(row, "votos_nao"),
        abstencao: raw(row, "voto_abstencao") || raw(row, "abstencoes"),
        outros: raw(row, "voto_outro"),
        total: raw(row, "votos_total"),
      }));
    }

    const byTheme = payloads.q3?.chart_spec.options?.by_theme as Array<Record<string, unknown>> | undefined;
    if (byTheme?.length) {
      return byTheme.map((row) => ({
        eixo: String(row.eixo_principal || row.eixo_maior || "Tema"),
        sim: raw(row, "voto_sim") || raw(row, "votos_sim"),
        nao: raw(row, "voto_nao") || raw(row, "votos_nao"),
        abstencao: raw(row, "voto_abstencao") || raw(row, "abstencoes"),
        outros: raw(row, "voto_outro"),
        total: raw(row, "votos_total"),
      }));
    }

    const data = new Map<string, { eixo: string; sim: number; nao: number; abstencao: number; outros: number; total: number }>();
    (payloads.q3?.chart_spec.series?.[0]?.data as Array<Record<string, unknown>> | undefined)?.forEach((row) => {
      const eixo = String(row.eixo_principal || row.name || row.eixo || "Tema");
      data.set(eixo, {
        eixo,
        sim: raw(row, "voto_sim"),
        nao: raw(row, "voto_nao"),
        abstencao: raw(row, "voto_abstencao"),
        outros: raw(row, "voto_outro"),
        total: raw(row, "votos_total"),
      });
    });
    if (data.size === 0) {
      (payloads.q3?.table_spec.rows ?? []).forEach((row) => {
        const eixo = String(row.eixo_principal || "Tema");
        const current = data.get(eixo) ?? { eixo, sim: 0, nao: 0, abstencao: 0, outros: 0, total: 0 };
        const sim = raw(row, "voto_sim") || raw(row, "votos_sim");
        const nao = raw(row, "voto_nao") || raw(row, "votos_nao");
        const abstencao = raw(row, "voto_abstencao") || raw(row, "abstencoes");
        const outros = raw(row, "voto_outro");
        const total = raw(row, "votos_total");
        if (sim || nao || abstencao || outros || total) {
          current.sim += sim;
          current.nao += nao;
          current.abstencao += abstencao;
          current.outros += outros;
          current.total += total || sim + nao + abstencao + outros;
          data.set(eixo, current);
          return;
        }
        const voto = String(row.voto || "").toLowerCase();
        if (voto.includes("sim")) current.sim += 1;
        else if (voto.includes("nao") || voto.includes("não")) current.nao += 1;
        else if (voto.includes("abst")) current.abstencao += 1;
        else current.outros += 1;
        current.total += 1;
        data.set(eixo, current);
      });
    }
    return Array.from(data.values())
      .map((row) => ({ ...row, total: row.total || row.sim + row.nao + row.abstencao + row.outros }))
      .slice(0, 10);
  }, [payloads.q3]);
  const themeOptions = rows.map((row) => row.eixo);
  const filteredRows = rows.filter((row) => {
    const matchesSelected = selectedTheme ? row.eixo === selectedTheme : true;
    const matchesSearch = row.eixo.toLowerCase().includes(themeQuery.trim().toLowerCase());
    return matchesSelected && matchesSearch;
  });

  return (
    <section className="border-t px-6 py-16 sm:px-10" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-[1434px]">
        <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 text-[13px] font-bold uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.36em" }}>
              Votacoes nominais
            </p>
            <h2 className="text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
              Como ele vota por tema
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-[360px]">
            <button
              type="button"
              onClick={() => setVoteTableMode((mode) => (mode === "percentual" ? "contagem" : "percentual"))}
              className="h-12 border px-5 text-left text-[13px] font-bold uppercase transition-colors hover:border-[#e00836]"
              style={{
                borderColor: voteTableMode === "contagem" ? "#e00836" : "var(--border)",
                background: voteTableMode === "contagem" ? "rgba(224,8,54,0.14)" : "var(--card)",
                color: "var(--foreground)",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.12em",
              }}
            >
              {voteTableMode === "percentual" ? "Ver contagem de votos" : "Ver tabela percentual"}
            </button>
            <select
              value={selectedTheme}
              onChange={(event) => setSelectedTheme(event.target.value)}
              className="h-12 w-full border bg-card px-4 text-[14px] font-bold outline-none"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              <option value="">Todos os eixos</option>
              {themeOptions.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
            <input
              value={themeQuery}
              onChange={(event) => setThemeQuery(event.target.value)}
              placeholder="Filtrar por texto..."
              className="h-12 w-full border bg-card px-4 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
        </div>

        {filteredRows.length ? (
          <div className="overflow-x-auto border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full min-w-[860px] border-collapse">
              <thead style={{ background: "var(--secondary)" }}>
                <tr>
                  {(voteTableMode === "percentual" ? ["Tema", "A favor", "Contra", "Ausente"] : ["Eixo", "Votou sim", "Votou nao", "Abstencao", "Voto total"]).map((column) => (
                    <th key={column} className="border-b px-6 py-4 text-left text-[12px] font-bold uppercase" style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em" }}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const total = Math.max(row.sim + row.nao + row.abstencao + row.outros, 1);
                  const favor = Math.round((row.sim / total) * 100);
                  const contra = Math.round((row.nao / total) * 100);
                  const ausente = Math.max(0, 100 - favor - contra);
                  return (
                    <tr key={row.eixo} className="border-b" style={{ borderColor: "var(--border)" }}>
                      <td className="px-6 py-5 text-[15px] font-bold" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>{row.eixo}</td>
                      {voteTableMode === "percentual" ? (
                        <>
                          <td className="px-6 py-5">
                            <VoteMeter value={favor} color="#4a7c59" />
                          </td>
                          <td className="px-6 py-5">
                            <VoteMeter value={contra} color="#e00836" />
                          </td>
                          <td className="px-6 py-5 text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}>{ausente}%</td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-5 text-[13px] font-bold" style={{ color: "#4a7c59", fontFamily: "'JetBrains Mono', monospace" }}>{number(row.sim)}</td>
                          <td className="px-6 py-5 text-[13px] font-bold" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace" }}>{number(row.nao)}</td>
                          <td className="px-6 py-5 text-[13px]" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>{number(row.abstencao)}</td>
                          <td className="px-6 py-5 text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}>{number(row.total || total)}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyPanel message="Sem votos para este tema." />
        )}
      </div>
    </section>
  );
}

function CostBenefitSection({ payloads, cbAllRows, selectedDeputyId }: { payloads: ProfilePayloads; cbAllRows: Row[]; selectedDeputyId: string }) {
  const row =
    payloads.q7?.table_spec.rows[0] ??
    payloads.q7?.complement_tables.find((table) => table.rows.length)?.rows[0];
  const propositions = raw(row, "qtd_proposicoes");
  const approved = raw(row, "proposicoes_aprovadas");
  const presence = raw(row, "presenca_total");
  const spent = raw(row, "gasto_total");
  const approvalRate = propositions ? Math.round((approved / propositions) * 100) : 0;

  const scoreCb = useMemo(() => {
    if (!cbAllRows.length || !selectedDeputyId) return null;
    const n = cbAllRows.length;
    const idx = cbAllRows.findIndex((r) => String(r["id_deputado"] ?? "") === selectedDeputyId);
    if (idx === -1) return null;
    return ((n - idx) / n) * 100;
  }, [cbAllRows, selectedDeputyId]);

  const scoreCbDisplay = scoreCb !== null
    ? scoreCb.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : cbAllRows.length === 0 ? "..." : "—";

  return (
    <section className="border-t px-6 py-16 sm:px-10" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-[1434px]">
        <p className="mb-4 text-[13px] font-bold uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.36em" }}>
          Eficiencia parlamentar
        </p>
        <h2 className="mb-8 text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
          Custo-beneficio do mandato
        </h2>

        <div className="border" style={{ borderColor: "var(--border)" }}>
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "rgba(243,239,232,0.08)" }}>
            {[
              ["Score CB", scoreCbDisplay, "#e39115"],
              ["Presencas", number(presence), "var(--foreground)"],
              ["Proposicoes", number(propositions), "var(--foreground)"],
              ["Aprovadas", number(approved), "var(--foreground)"],
            ].map(([label, value, color]) => (
              <article key={label} className="bg-card p-7">
                <p className="mb-3 text-[13px] font-bold uppercase" style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em" }}>
                  {label}
                </p>
                <strong className="block text-[30px] font-black leading-none" style={{ color, fontFamily: "'Playfair Display', serif" }}>
                  {value}
                </strong>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-9 max-w-[480px]">
          <div className="mb-2 flex justify-between text-[13px] font-bold" style={{ color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
            <span>0</span>
            <span>SCORE CB — {scoreCbDisplay}</span>
            <span>100</span>
          </div>
          <div className="h-4 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
            <div className="h-full rounded-full" style={{ width: `${scoreCb ?? 0}%`, background: "linear-gradient(90deg, #e00836, #e39115)" }} />
          </div>
          <p className="mt-6 text-[16px] leading-relaxed" style={{ color: "var(--foreground)" }}>
            Custo total do mandato ate agora: <strong style={{ color: "#e00836" }}>{money(spent)}</strong>. Taxa de aprovacao de proposicoes: <strong style={{ color: "#e00836" }}>{approvalRate}%</strong>.
          </p>
        </div>
      </div>
    </section>
  );
}

function VoteMeter({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-[14px] font-black" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}%
      </span>
      <div className="h-[7px] w-20 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  );
}

function DetailTable({ payloads }: { payloads: ProfilePayloads }) {
  const rows = aggregateSpendingByCategory(payloads.q13?.table_spec.rows ?? []).slice(0, 12).map((row) => ({
    categoria: row.categoria,
    lancamentos: number(row.lancamentos),
    valor: money(row.gasto),
  }));

  return (
    <section className="px-6 pb-16 sm:px-10">
      <div className="mx-auto max-w-[1434px]">
        <div className="mb-5 border-t pt-8" style={{ borderColor: "var(--border)" }}>
          <p className="mb-2 text-[10px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.24em" }}>Detalhamento</p>
          <h2 className="text-[30px] font-black leading-none" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>Categorias de despesa</h2>
        </div>
        <div className="overflow-x-auto border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full min-w-[720px] border-collapse">
            <thead style={{ background: "var(--secondary)" }}>
              <tr>
                {["Categoria", "Lancamentos", "Valor"].map((column) => (
                  <th key={column} className="border-b px-4 py-3 text-left text-[12px] font-bold uppercase" style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em" }}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.categoria}-${index}`} className="transition-colors hover:bg-white/5">
                  <td className="border-b px-4 py-4 text-[14px]" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>{String(row.categoria || "-")}</td>
                  <td className="border-b px-4 py-4 text-[14px]" style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}>{row.lancamentos}</td>
                  <td className="border-b px-4 py-4 text-[14px] font-bold" style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}>{row.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function TwoColumnSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="px-6 pb-10 sm:px-10">
      <div className="mx-auto max-w-[1434px]">
        <SectionTitle eyebrow={eyebrow} title={title} />
        <div className="grid gap-6 lg:grid-cols-2">{children}</div>
      </div>
    </section>
  );
}

function FullSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="px-6 pb-10 sm:px-10">
      <div className="mx-auto max-w-[1434px]">
        <SectionTitle eyebrow={eyebrow} title={title} />
        {children}
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5 border-t pt-8" style={{ borderColor: "var(--border)" }}>
      <p className="mb-2 text-[13px] font-bold uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.24em" }}>{eyebrow}</p>
      <h2 className="text-[32px] font-black leading-none" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>{title}</h2>
    </div>
  );
}

function ChartBox({
  rows,
  xKey,
  yKey,
  secondaryKey,
  empty,
}: {
  rows: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  secondaryKey?: string;
  empty: string;
}) {
  return (
    <div className="h-[360px] border p-5" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.018)" }}>
      {rows.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 16, right: 18, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--foreground)", fontSize: 12, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis dataKey={yKey} type="category" width={170} tick={{ fill: "var(--foreground)", fontSize: 12, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", color: "var(--chart-tooltip-text)" }} />
            <Bar dataKey={xKey} fill="#e00836" radius={[0, 2, 2, 0]} />
            {secondaryKey ? <Bar dataKey={secondaryKey} fill="rgba(243,239,232,0.42)" radius={[0, 2, 2, 0]} /> : null}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyPanel message={empty} />
      )}
    </div>
  );
}

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
    id: "gastos_dep",
    titulo: "Gastos totais do deputado com a cota parlamentar",
    origem: "Q1 — Cota para o Exercício da Atividade Parlamentar (CEAP) · 57ª Legislatura (2023-2026)",
    formula: "Gasto total = soma de valor_liquido de todos os registros de reembolso do deputado entre 2023 e 2026",
    passos: [
      "O QUE É O CEAP: A Cota para o Exercício da Atividade Parlamentar é uma verba pública mensal destinada a cada deputado federal para cobrir despesas relacionadas ao mandato — passagens aéreas, combustível, hospedagem, alimentação, telefonia, material de escritório, divulgação parlamentar, entre outros. Cada estado tem um teto diferente: deputados do Amazonas e Roraima, por exemplo, têm cotas maiores porque precisam voar muito mais para chegar a Brasília.",
      "FONTE E COLETA: Os dados vêm diretamente da API pública da Câmara dos Deputados. Cada linha na base representa um pedido de reembolso individual, com o valor líquido efetivamente pago (após eventuais glosas ou deduções realizadas pela Câmara). Importamos todos os registros da 57ª legislatura, que cobre 2023 a 2026.",
      "CÁLCULO DO TOTAL: Para cada deputado, somamos o campo valor_liquido de todos os seus registros no período. Não há ponderação por tempo de mandato — um deputado que assumiu a vaga em 2024 tem seus gastos somados a partir da data de posse, e o valor reflete exatamente o período em que esteve ativo.",
      "PARTIDO E ESTADO EXIBIDOS: O partido e a UF mostrados no perfil não são necessariamente os dados cadastrais atuais. Usamos o 'perfil dominante por frequência': qual combinação partido + UF aparece com mais frequência nos próprios registros de gastos daquele deputado. Isso captura mudanças de partido de forma orgânica — um deputado que trocou de legenda será classificado pelo partido com o qual registrou mais despesas.",
      "NOME EXIBIDO: Priorizamos o nome civil (campo nome_civil) quando disponível. Se estiver em branco, usamos o nome parlamentar. Isso evita que o mesmo parlamentar apareça com grafias diferentes em anos distintos.",
    ],
    interpretacao: "Gastar valores altos não é sinônimo de irregularidade — o CEAP existe exatamente para isso. O que revela mais não é o total absoluto, mas a composição dos gastos: em que categorias o deputado concentrou a cota, e como esse valor se compara a outros deputados do mesmo estado (que têm o mesmo teto). O cruzamento mais poderoso é comparar o total gasto com a produção legislativa via índice de custo-benefício (Q7): deputados que gastam muito e produzem pouco têm um perfil bem diferente dos que gastam moderadamente e geram mais resultado.",
  },
  {
    id: "eixos",
    titulo: "Temas de atuação legislativa e nuvem de palavras",
    origem: "Q2 — Classificação Temática das Proposições · 57ª Legislatura (2023-2026)",
    formula: "Total de proposições distintas por tema = COUNT DISTINCT (id_proposicao) por eixo temático, para o deputado selecionado",
    passos: [
      "CLASSIFICAÇÃO TEMÁTICA: Cada proposição legislativa (PL, PEC, REQ, INC, etc.) que o deputado apresentou ou co-assinou passou por um processo de classificação temática. O sistema analisa o título, a ementa e as palavras-chave de cada proposição e a enquadra em um de 32 grandes eixos temáticos — como Saúde, Educação, Segurança Pública, Meio Ambiente, Economia, Infraestrutura, entre outros. Essa classificação está pré-processada e vinculada a cada proposição na base.",
      "EVITANDO DUPLA CONTAGEM: Uma mesma proposição pode ter vários autores. Para não contar a mesma proposição mais de uma vez quando o deputado foi co-autor, aplicamos DISTINCT na combinação (ano_dados, id_proposicao): cada proposta é contada uma única vez por tema, independentemente do número de assinantes.",
      "PROPOSIÇÕES APROVADAS: A situação de cada proposição é verificada. Se a descrição da situação contém termos como 'aprovada', 'sancionada', 'norma jurídica' ou 'promulgada', a proposição é marcada como aprovada. Isso permite separar, dentro de cada tema, quantas propostas apenas tramitaram e quantas efetivamente viraram lei ou norma.",
      "NUVEM DE PALAVRAS: Os títulos e ementas de todas as proposições do deputado foram tokenizados por um pipeline de processamento de linguagem natural (NLP). O processo remove stopwords (artigos, preposições, termos genéricos como 'projeto', 'lei', 'artigo') e identifica os termos mais substantivos. Os 200 tokens mais frequentes alimentam a nuvem de palavras, que dá uma leitura visual e intuitiva sobre os assuntos que mais aparecem na produção legislativa daquele deputado.",
      "EIXO PRINCIPAL DE ATUAÇÃO: Para identificar em qual tema o deputado se concentra mais, ranqueamos os eixos pelo número de proposições e destacamos o de maior peso. Quando dois eixos têm exatamente o mesmo número de proposições, ambos são exibidos juntos — o deputado atuou igualmente nos dois temas.",
    ],
    interpretacao: "Volume de proposições não equivale a impacto. Apresentar 200 requerimentos de informação ou projetos de homenagem é muito mais fácil do que redigir uma PEC de peso. Por isso, a análise de eixos deve ser lida junto com o índice de custo-benefício (Q7), que já desconta proposições de menor relevância temática. O eixo dominante revela a prioridade declarada do deputado — mas compare com os dados de votação (Q3) para ver se ele também vota de forma consistente com os temas que defende.",
  },
  {
    id: "votos",
    titulo: "Comportamento de voto por eixo temático",
    origem: "Q3 — Votações Nominais da 57ª Legislatura (2023-2026)",
    formula: "Contagem de votos Sim, Não e Abstenção do deputado, agrupados por eixo temático da matéria votada",
    passos: [
      "FONTE DAS VOTAÇÕES: Nas votações nominais — as mais importantes, em que cada deputado precisa registrar explicitamente sua posição — o voto fica gravado individualmente na base da Câmara. Os registros incluem o identificador da votação, o identificador da proposição votada e o voto registrado: 'Sim', 'Nao', 'Abstencao' ou ausência (deputados que não registraram voto simplesmente não aparecem naquela votação).",
      "CLASSIFICAÇÃO POR EIXO: Cada votação está vinculada a uma proposição, e cada proposição pertence a um tema oficial da Câmara. Esses temas são então agrupados em 8 grandes eixos: Social, Econômico, Segurança, Institucional e Jurídico, Ambiental e Energético, Infraestrutura e Tecnologia, Cultura e Sociedade, e Internacional. Para proposições que não tinham tema cadastrado no sistema oficial, foi feita uma classificação manual por id da proposição, garantindo cobertura de matérias importantes sem classificação automática.",
      "AGREGAÇÃO POR DEPUTADO E TEMA: Para o deputado selecionado, somamos separadamente os votos 'Sim', 'Não' e 'Abstenção' em cada eixo. Usamos DISTINCT no identificador da votação para evitar contar duas vezes uma mesma votação que, por alguma razão, tenha entrado duplicada na base.",
      "VISÃO ANUAL E CONSOLIDADA: Os dados são produzidos por ano (2023, 2024, 2025, 2026) e também em uma visão consolidada de todos os anos juntos. O painel permite alternar entre as duas perspectivas — útil para ver se o comportamento de voto do deputado mudou ao longo da legislatura.",
      "EXIBIÇÃO EM PERCENTUAL E CONTAGEM: Os votos podem ser visualizados em quantidade absoluta (quantas vezes votou Sim em cada tema) ou em porcentagem (qual proporção dos votos naquele tema foi Sim). O modo percentual facilita a comparação entre temas com volumes de votação muito diferentes.",
    ],
    interpretacao: "Esse painel mostra a posição que o deputado tomou nas votações, não a qualidade ou a consequência dessas posições. Um deputado pode votar consistentemente 'Não' em pautas econômicas por convicção ou por oposição ao governo — o dado sozinho não distingue. O que é revelador é a consistência: um deputado que se diz defensor do meio ambiente mas vota 'Não' na maioria das matérias ambientais apresenta uma contradição verificável pelos dados. Compare sempre o comportamento de voto com os temas de atuação (Q2) para identificar coerência ou inconsistência entre o que o deputado propõe e o que ele aprova.",
  },
  {
    id: "cb",
    titulo: "Índice de custo-benefício parlamentar e Score CB",
    origem: "Q7 — Eficiência do Mandato · 57ª Legislatura (2023-2026) · Metodologia revisada",
    formula: "Custo-Benefício = Benefício ÷ (Gasto × Fator_Penalidade) · onde Benefício = qualidade_proposicoes + (presença_total × 0,1)",
    passos: [
      "PONTUAÇÃO DE QUALIDADE DAS PROPOSIÇÕES: Cada proposição recebe uma pontuação composta por três fatores multiplicados. (1) Tipo da proposição: PEC vale 12 pts, PLP vale 10, Medidas Provisórias e Mensagens valem 9, PL vale 7, decretos e resoluções valem 5, requerimentos e indicações valem 1,5, demais tipos valem 3. (2) Situação atual: aprovadas/sancionadas/promulgadas acrescentam +24 pts ao tipo, proposições em tramitação ativa acrescentam +6, arquivadas ou retiradas acrescentam 0, e demais situações acrescentam +2. Os dois fatores são somados antes da multiplicação pelos fatores seguintes.",
      "PENALIDADE PARA PROPOSIÇÕES SIMBÓLICAS: Se a ementa ou o título contiver termos como 'homenagem', 'data comemorativa', 'dia nacional', 'semana nacional', 'sessão solene', 'título honorífico', 'denomina' ou 'concede', a pontuação total é multiplicada por 0,45. Isso penaliza projetos de baixo impacto substantivo que historicamente inflariam rankings de produtividade.",
      "PESO DE AUTORIA: Ser o autor principal (primeiro ou único assinante) vale peso 1,0. Ser o 2º ao 5º assinante vale peso 0,55. Demais co-autores valem 0,25. Esse fator é o último multiplicador. A soma de todos os scores de proposições do deputado no período gera o campo qualidade_proposicoes.",
      "PRESENÇA EM EVENTOS: Contamos o total de eventos parlamentares — sessões plenárias, reuniões de comissão, audiências — em que o deputado compareceu. A presença entra no benefício com peso de apenas 10% (× 0,1) em relação às proposições. É um sinal positivo de engajamento, mas não domina o score.",
      "PENALIDADE EXPONENCIAL NO GASTO: O denominador não usa o gasto simples, mas sim gasto elevado à potência 1,08, além de um fator de penalidade por faixa: gastos acima de R$400 mil multiplicam por 1,45; entre R$250 mil e R$400 mil por 1,25; entre R$100 mil e R$250 mil por 1,10; abaixo de R$100 mil sem acréscimo. A potência 1,08 cria uma curva levemente convexa — quem gasta o dobro não divide por 2×, mas por 2^1,08 ≈ 2,11×. Alto consumo é progressivamente penalizado.",
      "ELEGIBILIDADE: São excluídos do índice deputados com gasto total abaixo de R$40 mil (evita distorções de quem mal usou a cota) e deputados com qualidade_proposicoes igual a zero (não produziram nenhuma proposição pontuável no período). Isso garante que o ranking reflita parlamentares efetivamente ativos.",
      "SCORE CB — NORMALIZAÇÃO POR PERCENTIL: O valor bruto de custo_beneficio é um número muito pequeno (como 0,096 ou 0,0048) e difícil de interpretar. Para torná-lo legível, calculamos o percentil de cada deputado no ranking global: Score CB = ((total de registros no ranking − posição do deputado) ÷ total de registros) × 100. O 1º colocado recebe score próximo de 100; o último, próximo de 0. Um Score CB de 80,7 significa que aquele deputado supera 80,7% de todos os demais no índice. Esse cálculo é feito inteiramente no front-end, sobre o ranking completo carregado em memória.",
    ],
    interpretacao: "O índice mede eficiência de custo dentro das métricas disponíveis nos dados públicos — não a qualidade política ou ética do mandato. Um score alto pode resultar de gastar pouco (denominador pequeno), de produzir proposições relevantes e aprovadas, ou da combinação dos dois. Deputados com gastos muito abaixo da média tendem a dominar o topo pelo efeito matemático do denominador pequeno. Leia sempre o score em conjunto com o volume absoluto de gastos e com a quantidade de proposições: um deputado com Score CB 95 que apresentou 3 projetos não aprovados está em situação bem diferente de outro com Score CB 95 que apresentou 40 proposições, das quais 8 viraram lei.",
  },
  {
    id: "gastos_cat",
    titulo: "Distribuição dos gastos por categoria de despesa",
    origem: "Q13 — Categorias de Gasto por Deputado · 57ª Legislatura (2023-2026)",
    formula: "Total por categoria = soma de valor_liquido agrupada por tipo de despesa (descricao_despesa), apenas lançamentos positivos da 57ª legislatura",
    passos: [
      "CATEGORIAS OFICIAIS DA CEAP: A Câmara define um conjunto fechado de tipos de despesa elegíveis para reembolso. Os tipos vêm diretamente do campo descricao_despesa em cada registro, sem reclassificação. As principais categorias incluem: Divulgação da Atividade Parlamentar, Passagens Aéreas, Combustíveis e Lubrificantes, Serviços Postais, Locação de Veículos, Hospedagem, Alimentação, Telefonia, Consultorias e Assessorias Técnicas, Material de Escritório, e Serviço de Segurança Prestado por Empresa.",
      "FILTRO DE ELEGIBILIDADE: Consideramos apenas registros de deputados com id_legislatura_final igual a 57 — isso exclui deputados de legislaturas anteriores que possam ter algum gasto residual no sistema. Além disso, filtramos apenas lançamentos com valor_liquido maior que zero, eliminando estornos, glosas e correções negativas que existem na base bruta e que distorceriam as somas.",
      "CÁLCULO POR DEPUTADO: Para o deputado selecionado, agrupamos todos os seus registros por tipo de despesa e somamos o valor_liquido de cada grupo. Também contamos a quantidade de lançamentos individuais em cada categoria — a diferença entre valor total e número de lançamentos revela o ticket médio de cada tipo de despesa.",
      "PERCENTUAL DO TOTAL INDIVIDUAL: Para cada categoria, calculamos qual porcentagem ela representa do gasto total daquele deputado específico. Isso permite ver, por exemplo, que 45% da cota foi usada em divulgação e apenas 8% em passagens — um perfil bem diferente de um deputado de estado distante que inverte essas proporções.",
      "VISÃO ANUAL: Os gastos são mostrados separadamente por ano (2023, 2024, 2025, 2026), permitindo ver se o padrão de consumo mudou ao longo da legislatura — seja por mudança de comportamento, seja por variação na disponibilidade de cota ou no calendário parlamentar.",
    ],
    interpretacao: "A categoria 'Divulgação da Atividade Parlamentar' historicamente representa a maior fatia do CEAP porque cobre desde publicidade em rádio e jornal até impulsionamento de publicações em redes sociais. Por ser a mais ampla e subjetiva nos critérios de elegibilidade, é também a mais auditada por entidades de transparência e por jornalistas. Categorias com muitos lançamentos mas valor médio baixo (como combustível ou alimentação) revelam um perfil de uso frequente e pulverizado. Categorias com poucos lançamentos e valor alto (como consultorias) merecem atenção especial porque concentram valor em poucas transações, que podem ser mais difíceis de fiscalizar.",
  },
];

function MethodologySection() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  const MONO = "'JetBrains Mono', monospace";

  return (
    <section className="border-t px-6 py-16 sm:px-10" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-[1434px]">
        <div className="mb-9">
          <p className="mb-4 text-[13px] font-bold uppercase" style={{ color: "#e00836", fontFamily: MONO, letterSpacing: "0.36em" }}>
            Metodologia
          </p>
          <h2 className="text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>
            Como os indicadores foram calculados?
          </h2>
          <p className="mt-4 text-[15px] font-bold uppercase" style={{ color: "var(--foreground)", fontFamily: MONO, letterSpacing: "0.18em" }}>
            Transparência analítica · Clique em cada método para expandir
          </p>
        </div>

        {METODOS.map((m) => (
          <div key={m.id} className="mb-2 border" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.018)" }}>
            <button
              type="button"
              onClick={() => toggle(m.id)}
              className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-white/[0.04]"
            >
              <div>
                <p className="text-[16px] font-bold" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.titulo}</p>
                <p className="mt-1 text-[13px]" style={{ color: "var(--foreground)", opacity: 0.7, fontFamily: MONO }}>{m.origem}</p>
              </div>
              <span className="ml-4 shrink-0 text-[14px] font-bold" style={{ color: "#e00836", fontFamily: MONO }}>
                {open[m.id] ? "▲" : "▼"}
              </span>
            </button>

            {open[m.id] && (
              <div className="border-t px-5 py-6" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}>
                <div className="mb-5 border-l-2 py-2 pl-4" style={{ borderColor: "#e00836" }}>
                  <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "#e00836", fontFamily: MONO }}>Fórmula</p>
                  <p className="mt-1 text-[15px] font-bold" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.formula}</p>
                </div>
                <div className="mb-5 flex flex-col gap-3">
                  {m.passos.map((p, pi) => (
                    <p key={pi} className="text-[14px] leading-relaxed" style={{ color: "var(--foreground)", fontFamily: MONO }}>{p}</p>
                  ))}
                </div>
                <div className="border p-4" style={{ borderColor: "var(--border)", background: "rgba(224,8,54,0.08)" }}>
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-widest" style={{ color: "#e00836", fontFamily: MONO }}>Como interpretar</p>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.interpretacao}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DeputadoPage({ onNavigateHome, onNavigateRecortes, onNavigateRecorte }: DeputadoPageProps) {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [selectedDeputy, setSelectedDeputy] = useState<DeputySelection | null>(null);
  const [query, setQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [activeSection, setActiveSection] = useState<DeputadoSection>("gastos");
  const [payloads, setPayloads] = useState<ProfilePayloads>({});
  const [annualPayloads, setAnnualPayloads] = useState<Record<string, QuestionPayload>>({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cbAllRows, setCbAllRows] = useState<Row[]>([]);

  const filters = meta?.question_filters?.q13 ?? meta?.available_filters ?? emptyFilters;

  useEffect(() => {
    let mounted = true;
    setLoadingMeta(true);
    fetchMeta()
      .then((result) => {
        if (mounted) setMeta(result);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Erro ao carregar metadados.");
      })
      .finally(() => {
        if (mounted) setLoadingMeta(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchGlobalCbRanking()
      .then((rows) => { if (active) setCbAllRows(rows); })
      .catch(() => { /* silently ignore — cb ranking is optional */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedDeputy) {
      setPayloads({});
      setAnnualPayloads({});
      return;
    }

    let mounted = true;
    setLoadingData(true);
    setError(null);

    const filtersForBackend = {
      deputados: [selectedDeputy.value],
      anos: [],
    };
    const years = filters.anos.length ? filters.anos : ["2023", "2024", "2025", "2026"].map((year) => ({ value: year, label: year }));

    Promise.all([
      fetchQuestion("q1", filtersForBackend, { page: 1, pageSize: 20, sortBy: "gasto_total", sortDir: "desc" }),
      fetchQuestion("q13", filtersForBackend, { page: 1, pageSize: 100, sortBy: "gasto_total", sortDir: "desc" }),
      fetchQuestion("q2", filtersForBackend, { page: 1, pageSize: 100, sortBy: "qtd_proposicoes", sortDir: "desc" }),
      fetchQuestion("q3", { deputados: [selectedDeputy.value], anos: [] }, { page: 1, pageSize: 100, sortDir: "desc" }),
      fetchQuestion("q7", filtersForBackend, { page: 1, pageSize: 20, sortBy: "custo_beneficio", sortDir: "desc" }),
      ...years.map((year) =>
        fetchQuestion(
          "q13",
          { deputados: [selectedDeputy.value], anos: [year.value] },
          { page: 1, pageSize: 100, sortBy: "gasto_total", sortDir: "desc" },
        ),
      ),
    ])
      .then(([q1, q13, q2, q3, q7, ...annual]) => {
        if (!mounted) return;
        setPayloads({ q1, q13, q2, q3, q7 });
        setAnnualPayloads(Object.fromEntries(years.map((year, index) => [year.value, annual[index]])));
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Erro ao carregar dados do deputado.");
      })
      .finally(() => {
        if (mounted) setLoadingData(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedDeputy, filters.anos]);

  const handleSelectDeputy = (deputy: DeputySelection) => {
    setSelectedDeputy(deputy);
    setQuery(deputy.label);
    setActiveSection("gastos");
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedDeputy(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateRecorte={onNavigateRecorte} />
      <SearchHero query={query} selected={selectedDeputy} options={filters.deputados} onQueryChange={handleQueryChange} onSelect={handleSelectDeputy} />

      {loadingMeta ? (
        <div className="px-6 py-16 sm:px-10"><div className="mx-auto max-w-[1434px]"><EmptyPanel message="Carregando catalogo de deputados..." /></div></div>
      ) : error ? (
        <div className="px-6 py-16 sm:px-10"><div className="mx-auto max-w-[1434px]"><EmptyPanel message={error} /></div></div>
      ) : !selectedDeputy ? (
        <div className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-[1434px]">
            <p
              className="text-[15px]"
              style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              Selecione um deputado para visualizar as seções de análise.
            </p>
          </div>
        </div>
      ) : loadingData ? (
        <div className="px-6 py-16 sm:px-10"><div className="mx-auto max-w-[1434px]"><EmptyPanel message="Carregando dados do deputado..." /></div></div>
      ) : (
        <>
          <ProfileBanner deputy={selectedDeputy} />

          {/* ── Navegação entre seções ──────────────────────── */}
          <div
            className="sticky top-[56px] z-30 flex flex-wrap gap-2 border-b px-6 py-3 sm:px-10"
            style={{ background: "var(--background)", borderColor: "var(--border)" }}
          >
            {(
              [
                ["gastos",          "Gastos parlamentares"],
                ["eixos",           "Eixos de atuação"],
                ["votacoes",        "Votações"],
                ["custo-beneficio", "Custo-benefício"],
                ["metodologia",     "Metodologia"],
              ] as [DeputadoSection, string][]
            ).map(([key, label]) => {
              const active = activeSection === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: active ? "#e00836" : "transparent",
                    color: active ? "#fff" : "var(--foreground)",
                    borderColor: active ? "#e00836" : "var(--border)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Seções condicionais ─────────────────────────── */}
          {activeSection === "gastos" && (
            <SpendingSection
              payloads={payloads}
              annualPayloads={annualPayloads}
              years={filters.anos}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
          )}
          {activeSection === "eixos" && <AxesSection payloads={payloads} />}
          {activeSection === "votacoes" && <VotesSection payloads={payloads} />}
          {activeSection === "custo-beneficio" && <CostBenefitSection payloads={payloads} cbAllRows={cbAllRows} selectedDeputyId={selectedDeputy?.value ?? ""} />}
          {activeSection === "metodologia" && <MethodologySection />}
        </>
      )}
    </main>
  );
}
