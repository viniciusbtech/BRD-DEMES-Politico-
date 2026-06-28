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
import type { FilterCatalog, FilterChoice, MetaResponse, QuestionPayload } from "../types";
import { useTheme } from "../../contexts/ThemeContext";
import NavBar from "../components/NavBar";

type DeputadoPageProps = { onNavigateHome: () => void; onNavigateRecortes: () => void; onNavigateRecorte: (path: string) => void };
type DeputySelection = FilterChoice;
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

function CostBenefitSection({ payloads }: { payloads: ProfilePayloads }) {
  const row =
    payloads.q7?.table_spec.rows[0] ??
    payloads.q7?.complement_tables.find((table) => table.rows.length)?.rows[0];
  const score = raw(row, "custo_beneficio");
  const benefit = raw(row, "beneficio");
  const propositions = raw(row, "qtd_proposicoes");
  const approved = raw(row, "proposicoes_aprovadas");
  const presence = raw(row, "presenca_total");
  const spent = raw(row, "gasto_total");
  const approvalRate = propositions ? Math.round((approved / propositions) * 100) : 0;
  const note = Math.max(0, Math.min(10, score * 10000));

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
              ["Nota geral", `${note.toFixed(1)}/10`, "#e39115"],
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
            <span>NOTA — {note.toFixed(1)}/10</span>
            <span>10</span>
          </div>
          <div className="h-4 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
            <div className="h-full rounded-full" style={{ width: `${note * 10}%`, background: "linear-gradient(90deg, #e00836, #e39115)" }} />
          </div>
          <p className="mt-6 text-[16px] leading-relaxed" style={{ color: "var(--foreground)" }}>
            Custo total do mandato ate agora: <strong style={{ color: "#e00836" }}>{money(spent)}</strong>. Taxa de aprovacao de proposicoes: <strong style={{ color: "#e00836" }}>{approvalRate}%</strong>.
            {benefit ? <span> Indicador de beneficio: <strong style={{ color: "#e00836" }}>{number(benefit)}</strong>.</span> : null}
            {score ? <span> Indice custo-beneficio: <strong style={{ color: "#e00836" }}>{score.toFixed(6)}</strong>.</span> : null}
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
    titulo: "Quanto o deputado gastou",
    origem: "Q1 — Gastos por Deputado",
    formula: "Gasto total = soma de todas as despesas reembolsadas pela cota (CEAP)",
    passos: [
      "1. O CEAP é a 'cota parlamentar': uma verba pública que cada deputado pode usar para despesas do mandato, como passagens, combustível e divulgação.",
      "2. Juntamos todas as notas fiscais que o deputado pediu para serem reembolsadas e somamos os valores.",
      "3. Consideramos o período de 2023 a 2026, que é a atual legislatura (a 57ª).",
      "4. Esse total é o número que aparece no topo do perfil dele.",
    ],
    interpretacao: "Gastar mais não é sinal de corrupção: o CEAP é uma verba legal. Deputados de estados grandes (como SP e RJ) têm cota maior, então o valor sozinho não diz tudo.",
  },
  {
    id: "eixos",
    titulo: "Em que temas ele atua",
    origem: "Q2 — Eixos e Nuvem de Palavras",
    formula: "Quantas propostas o deputado apresentou em cada tema (2023-2026)",
    passos: [
      "1. Cada projeto de lei (proposição) trata de algum assunto — por exemplo, Saúde, Educação ou Segurança.",
      "2. Lendo o título e o resumo de cada projeto, o sistema o encaixa em um de 32 grandes temas.",
      "3. Contamos quantos projetos desse deputado caíram em cada tema.",
      "4. Os temas com mais projetos mostram onde ele concentra sua atuação.",
    ],
    interpretacao: "Um tema aparecer em destaque significa que o deputado apresentou muitos projetos sobre ele — não necessariamente que esses projetos foram aprovados ou tiveram impacto.",
  },
  {
    id: "votos",
    titulo: "Como ele vota por tema",
    origem: "Q3 — Votações Nominais",
    formula: "Contagem dos votos (Sim, Não, Abstenção) do deputado, separados por tema",
    passos: [
      "1. Nas votações importantes, o voto de cada deputado fica registrado: Sim, Não, Abstenção ou ausência.",
      "2. Pegamos os votos desse deputado e os agrupamos pelo tema da matéria votada.",
      "3. Para cada tema, contamos quantas vezes ele votou Sim, Não ou se absteve.",
      "4. Você pode ver os números em quantidade ou em porcentagem, para comparar o comportamento dele entre os temas.",
    ],
    interpretacao: "Isso mostra a tendência de voto do deputado em cada assunto, mas não julga se o voto foi 'certo' ou 'errado' — apenas registra a posição que ele tomou.",
  },
  {
    id: "cb",
    titulo: "Custo-benefício do mandato",
    origem: "Q7 — Índice de Custo-Benefício",
    formula: "Score = o quanto o deputado 'entregou' ÷ o quanto ele gastou",
    passos: [
      "1. Primeiro estimamos o quanto o deputado produziu, combinando três coisas: número de projetos apresentados, projetos aprovados (que pesam mais) e presença nas sessões.",
      "2. Depois dividimos essa 'entrega' pelo total que ele gastou da cota.",
      "3. Quanto maior o resultado, mais ele entregou para cada real gasto.",
      "4. Atenção: quem gastou quase nada pode aparecer com um score altíssimo e enganoso.",
    ],
    interpretacao: "Esse índice mede eficiência de custo, e não a qualidade do trabalho. Um deputado pode ter score alto só por gastar pouco, mesmo produzindo pouco.",
  },
  {
    id: "gastos_cat",
    titulo: "Em que ele gastou a cota",
    origem: "Q13 — Categorias de Gasto por Deputado",
    formula: "Total gasto pelo deputado em cada tipo de despesa",
    passos: [
      "1. Toda despesa da cota tem um tipo, como Divulgação Parlamentar, Passagem Aérea ou Combustível.",
      "2. Somamos quanto esse deputado gastou em cada tipo.",
      "3. Calculamos quanto cada tipo representa do total dele.",
      "4. Isso mostra como ele distribuiu o uso da cota ao longo do mandato.",
    ],
    interpretacao: "A 'Divulgação da Atividade Parlamentar' costuma ser uma das maiores fatias. Por ser a mais alta, é também a mais questionada em auditorias sobre o uso da cota.",
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
  const [payloads, setPayloads] = useState<ProfilePayloads>({});
  const [annualPayloads, setAnnualPayloads] = useState<Record<string, QuestionPayload>>({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      anos: selectedYear ? [selectedYear] : [],
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
  }, [selectedDeputy, selectedYear, filters.anos]);

  const handleSelectDeputy = (deputy: DeputySelection) => {
    setSelectedDeputy(deputy);
    setQuery(deputy.label);
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
        null
      ) : loadingData ? (
        <div className="px-6 py-16 sm:px-10"><div className="mx-auto max-w-[1434px]"><EmptyPanel message="Carregando dados do deputado..." /></div></div>
      ) : (
        <>
          <ProfileBanner deputy={selectedDeputy} />
          <SpendingSection
            payloads={payloads}
            annualPayloads={annualPayloads}
            years={filters.anos}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
          <AxesSection payloads={payloads} />
          <VotesSection payloads={payloads} />
          <CostBenefitSection payloads={payloads} />
          <MethodologySection />
        </>
      )}
    </main>
  );
}
