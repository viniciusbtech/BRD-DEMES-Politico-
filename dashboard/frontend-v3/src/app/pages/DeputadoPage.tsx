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

type DeputadoPageProps = { onNavigateHome: () => void };
type DeputySelection = FilterChoice;
type QuestionId = "q1" | "q13" | "q2" | "q3" | "q7";
type ProfilePayloads = Partial<Record<QuestionId, QuestionPayload>>;

const emptyFilters: FilterCatalog = {
  anos: [],
  eixos: [],
  partidos: [],
  ufs: [],
  deputados: [],
  escolaridade: [],
};

const money = (value: unknown) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value || 0));

const number = (value: unknown) => new Intl.NumberFormat("pt-BR").format(Number(value || 0));
const raw = (row: Record<string, unknown> | undefined, key: string) => Number(row?.[key] || 0);
const photo = (deputy: string | Pick<FilterChoice, "value" | "photo_url">) => {
  const id = typeof deputy === "string" ? deputy : deputy.value;
  const apiPhoto = typeof deputy === "string" ? null : deputy.photo_url;
  return apiPhoto || (/^\d+$/.test(id) ? `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg` : "/intro/deputados/107283.jpg");
};

function Header({ onNavigateHome }: DeputadoPageProps) {
  return (
    <header
      className="sticky top-0 z-50 flex h-14 items-center justify-between border-b px-6 sm:px-10"
      style={{ borderColor: "rgba(243,239,232,0.08)", background: "rgba(8,8,8,0.9)", backdropFilter: "blur(12px)" }}
    >
      <button
        type="button"
        onClick={onNavigateHome}
        className="text-[11px] uppercase transition-colors hover:text-white"
        style={{ color: "rgba(243,239,232,0.56)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}
      >
        Voltar a Home
      </button>
      <button type="button" onClick={onNavigateHome} className="flex items-center gap-3">
        <span className="block h-[22px] w-1 bg-[#e00836]" />
        <span className="text-[16px] font-black tracking-[0.04em]" style={{ fontFamily: "'Playfair Display', serif", color: "#f3efe8" }}>
          QUEM<span className="text-[#e00836]">GOVERNA</span>
        </span>
      </button>
      <span
        className="hidden text-[10px] uppercase sm:block"
        style={{ color: "rgba(243,239,232,0.48)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.22em" }}
      >
        Recorte 02
      </span>
    </header>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-[180px] items-center justify-center border p-8 text-center"
      style={{ borderColor: "rgba(243,239,232,0.14)", color: "rgba(243,239,232,0.56)", fontFamily: "'JetBrains Mono', monospace" }}
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
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options.slice(0, 8);
    return options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(normalized)).slice(0, 10);
  }, [options, query]);

  return (
    <section className="border-b px-6 py-10 sm:px-10 sm:py-12" style={{ borderColor: "rgba(243,239,232,0.1)" }}>
      <div className="mx-auto max-w-[1434px]">
        <p className="mb-4 text-[11px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.42em" }}>
          Pesquise um deputado federal
        </p>
        <h1 className="max-w-[900px] text-[42px] font-black leading-[0.95] sm:text-[66px]" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
          {selected ? selected.label : "Quem e o deputado?"}
        </h1>
        <p className="mt-5 max-w-[760px] text-[15px] leading-relaxed sm:text-[17px]" style={{ color: "rgba(243,239,232,0.66)" }}>
          Consulte gastos, temas de atuacao, votos por eixo e custo-beneficio do mandato em uma unica leitura.
        </p>

        <div className="relative mt-9 max-w-[680px]">
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Nome do deputado..."
            className="h-14 w-full border bg-transparent px-5 text-[15px] outline-none"
            style={{ borderColor: "rgba(243,239,232,0.18)", color: "#f3efe8", fontFamily: "'JetBrains Mono', monospace" }}
          />
          {!selected && (query || filtered.length > 0) ? (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 border" style={{ borderColor: "rgba(243,239,232,0.14)", background: "#141414" }}>
              {filtered.length === 0 ? (
                <p className="px-4 py-4 text-[12px] uppercase" style={{ color: "rgba(243,239,232,0.52)", fontFamily: "'JetBrains Mono', monospace" }}>
                  Nenhum resultado
                </p>
              ) : (
                filtered.map((deputy) => (
                  <button
                    key={deputy.value}
                    type="button"
                    onClick={() => onSelect(deputy)}
                    className="flex w-full items-center gap-4 border-b px-4 py-3 text-left transition-colors hover:bg-white/5"
                    style={{ borderColor: "rgba(243,239,232,0.08)" }}
                  >
                    <img src={photo(deputy)} alt="" className="h-11 w-9 object-cover object-top" style={{ filter: "grayscale(55%) contrast(1.08)" }} />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[15px]" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
                        {deputy.label}
                      </strong>
                      <small className="text-[10px] uppercase" style={{ color: "rgba(243,239,232,0.48)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em" }}>
                        ID {deputy.value}
                      </small>
                    </span>
                    <span className="text-[10px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.16em" }}>
                      Ver
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
        className="h-9 border px-4 text-[10px] font-bold uppercase transition-colors"
        style={{
          borderColor: selectedYear ? "rgba(243,239,232,0.14)" : "#e00836",
          background: selectedYear ? "transparent" : "#e00836",
          color: selectedYear ? "rgba(243,239,232,0.72)" : "#fff",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Todos
      </button>
      {years.map((year) => (
        <button
          key={year.value}
          type="button"
          onClick={() => onYearChange(year.value)}
          className="h-9 border px-4 text-[10px] font-bold uppercase transition-colors"
          style={{
            borderColor: selectedYear === year.value ? "#e00836" : "rgba(243,239,232,0.14)",
            background: selectedYear === year.value ? "#e00836" : "transparent",
            color: selectedYear === year.value ? "#fff" : "rgba(243,239,232,0.72)",
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
  return (
    <section className="relative overflow-hidden border-y px-6 py-10 sm:px-10" style={{ borderColor: "rgba(243,239,232,0.1)" }}>
      <img src={photo(deputy)} alt="" className="absolute inset-0 h-full w-full object-cover object-top" style={{ filter: "grayscale(80%) brightness(0.22)", opacity: 0.72 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,5,5,0.95), rgba(5,5,5,0.72))" }} />
      <div className="relative mx-auto flex max-w-[1434px] flex-col gap-6 sm:flex-row sm:items-center">
        <img src={photo(deputy)} alt={deputy.label} className="h-44 w-36 border object-cover object-top" style={{ borderColor: "#e00836" }} />
        <div>
          <p className="mb-2 text-[10px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.24em" }}>
            Perfil legislativo
          </p>
          <h2 className="text-[36px] font-black leading-none sm:text-[54px]" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
            {deputy.label}
          </h2>
          <p className="mt-4 max-w-[760px] text-[15px] leading-relaxed" style={{ color: "rgba(243,239,232,0.66)" }}>
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
  const rows = (payloads.q13?.table_spec.rows ?? []).slice(0, 10).map((row) => ({
    categoria: String(row.descricao_despesa || "Categoria"),
    gasto: raw(row, "gasto_total"),
    lancamentos: raw(row, "qtd_lancamentos"),
  }));
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
        <article className="border-b py-12" style={{ borderColor: "rgba(243,239,232,0.12)" }}>
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-3 text-[11px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.42em" }}>
                Gastos com cota parlamentar
              </p>
              <h2 className="text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
                Quanto ele gastou?
              </h2>
            </div>
            <YearTabs years={years} selectedYear={selectedYear} onYearChange={onYearChange} />
          </div>

          <div className="border" style={{ borderColor: "rgba(243,239,232,0.14)" }}>
            <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "rgba(243,239,232,0.08)" }}>
              <div className="bg-[#070707] p-7 lg:col-span-2">
                <p className="mb-3 text-[10px] uppercase" style={{ color: "rgba(243,239,232,0.54)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em" }}>
                  {selectedYear ? `Total em ${selectedYear}` : "Total acumulado"}
                </p>
                <strong className="block text-[42px] font-black leading-none sm:text-[52px]" style={{ color: "#e00836", fontFamily: "'Playfair Display', serif" }}>
                  {money(total)}
                </strong>
              </div>
              {annualRows.slice(0, 4).map((row) => (
                <div key={row.ano} className="bg-[#070707] p-7">
                  <p className="mb-3 text-[10px] uppercase" style={{ color: "rgba(243,239,232,0.54)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em" }}>
                    {row.ano}
                  </p>
                  <strong className="block text-[26px] font-black leading-none" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
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
                  <XAxis dataKey="ano" tick={{ fill: "rgba(243,239,232,0.62)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "rgba(243,239,232,0.48)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `R$${Math.round(Number(value) / 1000)}k`}
                    domain={[0, Math.ceil(maxAnnual / 100000) * 100000]}
                  />
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(243,239,232,0.14)", color: "#f3efe8" }} formatter={(value) => money(value)} />
                  <Bar dataKey="gasto" fill="#d20f3a" radius={[2, 2, 0, 0]} maxBarSize={78} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message="Sem gastos por ano para este deputado." />
            )}
          </div>
        </article>

        <article className="border-b py-12" style={{ borderColor: "rgba(243,239,232,0.12)" }}>
          <div className="mb-8">
            <p className="mb-3 text-[11px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.42em" }}>
              Distribuicao de despesas
            </p>
            <h2 className="text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
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
                    <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(243,239,232,0.14)", color: "#f3efe8" }} formatter={(value) => money(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel message="Sem categorias para este filtro." />
              )}
            </div>
            <div className="space-y-4">
              {rows.slice(0, 8).map((row, index) => {
                const pct = distributionTotal ? (row.gasto / distributionTotal) * 100 : 0;
                return (
                  <div key={row.categoria}>
                    <div className="mb-2 grid grid-cols-[minmax(0,1fr)_52px_104px] items-center gap-4 text-[12px]">
                      <span className="flex min-w-0 items-center gap-2 font-bold" style={{ color: "#f3efe8" }}>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} />
                        <span className="truncate">{row.categoria}</span>
                      </span>
                      <span className="text-right font-bold" style={{ color: "#f3efe8", fontFamily: "'JetBrains Mono', monospace" }}>
                        {Math.round(pct)}%
                      </span>
                      <span className="text-right" style={{ color: "rgba(243,239,232,0.58)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {money(row.gasto)}
                      </span>
                    </div>
                    <div className="h-1 bg-white/10">
                      <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: colors[index % colors.length] }} />
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
  const rows = (payloads.q13?.table_spec.rows ?? []).slice(0, 10).map((row) => ({
    categoria: String(row.descricao_despesa || "Categoria"),
    gasto: raw(row, "gasto_total"),
  }));
  const colors = ["#e00836", "#f3efe8", "#8c1d31", "#b8b2a8", "#7c1022", "#6f6a62"];

  return (
    <TwoColumnSection eyebrow="Gastos parlamentares" title="1. Quanto gastou e 2. como gastou o dinheiro">
      <article className="border p-6" style={{ borderColor: "rgba(243,239,232,0.14)", background: "rgba(255,255,255,0.018)" }}>
        <p className="text-[11px] uppercase" style={{ color: "rgba(243,239,232,0.52)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.16em" }}>
          Q1 - gasto total
        </p>
        <strong className="mt-4 block text-[52px] font-black leading-none" style={{ color: "#e00836", fontFamily: "'Playfair Display', serif" }}>
          {money(q1?.gasto_total)}
        </strong>
        <p className="mt-5 text-[14px]" style={{ color: "rgba(243,239,232,0.64)" }}>
          Partido {String(q1?.sigla_partido ?? "-")} · UF {String(q1?.sigla_uf ?? "-")}
        </p>
      </article>

      <article className="border p-6" style={{ borderColor: "rgba(243,239,232,0.14)", background: "#0d0d0d" }}>
        <p className="mb-5 text-[11px] uppercase" style={{ color: "rgba(243,239,232,0.52)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.16em" }}>
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
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(243,239,232,0.14)", color: "#f3efe8" }} formatter={(value) => money(value)} />
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
                  <span className="truncate" style={{ color: "#f3efe8" }}>{row.categoria}</span>
                  <span style={{ color: "rgba(243,239,232,0.58)", fontFamily: "'JetBrains Mono', monospace" }}>{money(row.gasto)}</span>
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
  const rows = useMemo(() => {
    const totals = new Map<string, { tema: string; proposicoes: number; aprovadas: number }>();
    (payloads.q2?.table_spec.rows ?? []).forEach((row) => {
      const tema = String(row.tema || "Sem tema");
      const current = totals.get(tema) ?? { tema, proposicoes: 0, aprovadas: 0 };
      current.proposicoes += raw(row, "qtd_proposicoes");
      current.aprovadas += raw(row, "proposicoes_aprovadas");
      totals.set(tema, current);
    });
    return Array.from(totals.values()).sort((a, b) => b.proposicoes - a.proposicoes).slice(0, 10);
  }, [payloads.q2]);
  const total = rows.reduce((sum, row) => sum + row.proposicoes, 0);

  return (
    <section className="border-t px-6 py-16 sm:px-10" style={{ borderColor: "rgba(243,239,232,0.12)" }}>
      <div className="mx-auto max-w-[1434px]">
        <p className="mb-4 text-[11px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.42em" }}>
          Temas legislativos
        </p>
        <h2 className="mb-10 text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
          Principais eixos de atuacao
        </h2>

        {rows.length ? (
          <div className="max-w-[840px] space-y-7">
            {rows.slice(0, 6).map((row, index) => {
              const pct = total ? (row.proposicoes / total) * 100 : 0;
              return (
                <div key={row.tema} className="grid grid-cols-[34px_minmax(0,1fr)] gap-4">
                  <span className="pt-1 text-[13px]" style={{ color: "rgba(243,239,232,0.58)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <strong className="text-[22px] leading-none" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
                        {row.tema}
                      </strong>
                      <strong className="text-[28px] leading-none" style={{ color: "#e00836", fontFamily: "'Playfair Display', serif" }}>
                        {Math.round(pct)}%
                      </strong>
                    </div>
                    <div className="h-[10px] bg-white/5">
                      <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: "#b90f2f" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyPanel message="Sem eixos de atuacao para este deputado." />
        )}
      </div>
    </section>
  );
}

function VotesSection({ payloads }: { payloads: ProfilePayloads }) {
  const [themeQuery, setThemeQuery] = useState("");
  const rows = useMemo(() => {
    const byTheme = payloads.q3?.chart_spec.options?.by_theme as Array<Record<string, unknown>> | undefined;
    if (byTheme?.length) {
      return byTheme.map((row) => ({
        eixo: String(row.eixo_principal || row.eixo_maior || "Tema"),
        sim: raw(row, "voto_sim") || raw(row, "votos_sim"),
        nao: raw(row, "voto_nao") || raw(row, "votos_nao"),
        abstencao: raw(row, "voto_abstencao") || raw(row, "abstencoes"),
        outros: raw(row, "voto_outro"),
      }));
    }

    const data = new Map<string, { eixo: string; sim: number; nao: number; abstencao: number; outros: number }>();
    (payloads.q3?.chart_spec.series?.[0]?.data as Array<Record<string, unknown>> | undefined)?.forEach((row) => {
      const eixo = String(row.eixo_principal || row.name || row.eixo || "Tema");
      data.set(eixo, {
        eixo,
        sim: raw(row, "voto_sim"),
        nao: raw(row, "voto_nao"),
        abstencao: raw(row, "voto_abstencao"),
        outros: raw(row, "voto_outro"),
      });
    });
    if (data.size === 0) {
      (payloads.q3?.table_spec.rows ?? []).forEach((row) => {
        const eixo = String(row.eixo_principal || "Tema");
        const current = data.get(eixo) ?? { eixo, sim: 0, nao: 0, abstencao: 0, outros: 0 };
        const voto = String(row.voto || "").toLowerCase();
        if (voto.includes("sim")) current.sim += 1;
        else if (voto.includes("nao") || voto.includes("não")) current.nao += 1;
        else if (voto.includes("abst")) current.abstencao += 1;
        else current.outros += 1;
        data.set(eixo, current);
      });
    }
    return Array.from(data.values()).slice(0, 10);
  }, [payloads.q3]);
  const filteredRows = rows.filter((row) => row.eixo.toLowerCase().includes(themeQuery.trim().toLowerCase()));

  return (
    <section className="border-t px-6 py-16 sm:px-10" style={{ borderColor: "rgba(243,239,232,0.12)" }}>
      <div className="mx-auto max-w-[1434px]">
        <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 text-[11px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.42em" }}>
              Votacoes nominais
            </p>
            <h2 className="text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
              Como ele vota por tema
            </h2>
          </div>
          <input
            value={themeQuery}
            onChange={(event) => setThemeQuery(event.target.value)}
            placeholder="Filtrar por tema..."
            className="h-11 w-full border bg-[#111] px-4 text-[12px] outline-none lg:w-[240px]"
            style={{ borderColor: "rgba(243,239,232,0.14)", color: "#f3efe8", fontFamily: "'JetBrains Mono', monospace" }}
          />
        </div>

        {filteredRows.length ? (
          <div className="overflow-x-auto border" style={{ borderColor: "rgba(243,239,232,0.14)" }}>
            <table className="w-full min-w-[860px] border-collapse">
              <thead style={{ background: "#101010" }}>
                <tr>
                  {["Tema", "A favor", "Contra", "Ausente"].map((column) => (
                    <th key={column} className="border-b px-6 py-4 text-left text-[10px] uppercase" style={{ borderColor: "rgba(243,239,232,0.12)", color: "rgba(243,239,232,0.58)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em" }}>
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
                    <tr key={row.eixo} className="border-b" style={{ borderColor: "rgba(243,239,232,0.08)" }}>
                      <td className="px-6 py-5 text-[15px] font-bold" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>{row.eixo}</td>
                      <td className="px-6 py-5">
                        <VoteMeter value={favor} color="#4a7c59" />
                      </td>
                      <td className="px-6 py-5">
                        <VoteMeter value={contra} color="#e00836" />
                      </td>
                      <td className="px-6 py-5 text-[13px]" style={{ color: "rgba(243,239,232,0.62)", fontFamily: "'JetBrains Mono', monospace" }}>{ausente}%</td>
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
    <section className="border-t px-6 py-16 sm:px-10" style={{ borderColor: "rgba(243,239,232,0.12)" }}>
      <div className="mx-auto max-w-[1434px]">
        <p className="mb-4 text-[11px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.42em" }}>
          Eficiencia parlamentar
        </p>
        <h2 className="mb-8 text-[34px] font-black leading-none sm:text-[44px]" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>
          Custo-beneficio do mandato
        </h2>

        <div className="border" style={{ borderColor: "rgba(243,239,232,0.14)" }}>
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "rgba(243,239,232,0.08)" }}>
            {[
              ["Nota geral", `${note.toFixed(1)}/10`, "#e39115"],
              ["Presencas", number(presence), "#f3efe8"],
              ["Proposicoes", number(propositions), "#f3efe8"],
              ["Aprovadas", number(approved), "#f3efe8"],
            ].map(([label, value, color]) => (
              <article key={label} className="bg-[#070707] p-7">
                <p className="mb-3 text-[10px] uppercase" style={{ color: "rgba(243,239,232,0.54)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em" }}>
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
          <div className="mb-2 flex justify-between text-[10px]" style={{ color: "rgba(243,239,232,0.58)", fontFamily: "'JetBrains Mono', monospace" }}>
            <span>0</span>
            <span>NOTA - {note.toFixed(1)}/10</span>
            <span>10</span>
          </div>
          <div className="h-3 bg-white/8">
            <div className="h-full" style={{ width: `${note * 10}%`, background: "linear-gradient(90deg, #e00836, #e39115)" }} />
          </div>
          <p className="mt-5 text-[14px] leading-relaxed" style={{ color: "rgba(243,239,232,0.66)" }}>
            Custo total do mandato ate agora: <strong style={{ color: "#f3efe8" }}>{money(spent)}</strong>. Taxa de aprovacao de proposicoes: <strong style={{ color: "#f3efe8" }}>{approvalRate}%</strong>.
            {benefit ? <span> Indicador de beneficio: <strong style={{ color: "#f3efe8" }}>{number(benefit)}</strong>.</span> : null}
            {score ? <span> Indice custo-beneficio: <strong style={{ color: "#f3efe8" }}>{score.toFixed(6)}</strong>.</span> : null}
          </p>
        </div>
      </div>
    </section>
  );
}

function VoteMeter({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[13px]" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}%
      </span>
      <div className="h-[5px] w-16 bg-white/8">
        <div className="h-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  );
}

function DetailTable({ payloads }: { payloads: ProfilePayloads }) {
  const rows = [
    ...(payloads.q13?.table_spec.rows ?? []).slice(0, 12).map((row) => ({
      categoria: row.descricao_despesa,
      lancamentos: number(row.qtd_lancamentos),
      valor: money(row.gasto_total),
    })),
  ];

  return (
    <section className="px-6 pb-16 sm:px-10">
      <div className="mx-auto max-w-[1434px]">
        <div className="mb-5 border-t pt-8" style={{ borderColor: "rgba(243,239,232,0.12)" }}>
          <p className="mb-2 text-[10px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.24em" }}>Detalhamento</p>
          <h2 className="text-[30px] font-black leading-none" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>Categorias de despesa</h2>
        </div>
        <div className="overflow-x-auto border" style={{ borderColor: "rgba(243,239,232,0.14)" }}>
          <table className="w-full min-w-[720px] border-collapse">
            <thead style={{ background: "#111" }}>
              <tr>
                {["Categoria", "Lancamentos", "Valor"].map((column) => (
                  <th key={column} className="border-b px-4 py-3 text-left text-[10px] uppercase" style={{ borderColor: "rgba(243,239,232,0.12)", color: "rgba(243,239,232,0.55)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em" }}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.categoria}-${index}`} className="transition-colors hover:bg-white/5">
                  <td className="border-b px-4 py-4 text-[13px]" style={{ borderColor: "rgba(243,239,232,0.08)", color: "rgba(243,239,232,0.72)" }}>{String(row.categoria || "-")}</td>
                  <td className="border-b px-4 py-4 text-[13px]" style={{ borderColor: "rgba(243,239,232,0.08)", color: "rgba(243,239,232,0.58)", fontFamily: "'JetBrains Mono', monospace" }}>{row.lancamentos}</td>
                  <td className="border-b px-4 py-4 text-[13px]" style={{ borderColor: "rgba(243,239,232,0.08)", color: "#f3efe8", fontFamily: "'JetBrains Mono', monospace" }}>{row.valor}</td>
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
    <div className="mb-5 border-t pt-8" style={{ borderColor: "rgba(243,239,232,0.12)" }}>
      <p className="mb-2 text-[10px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.24em" }}>{eyebrow}</p>
      <h2 className="text-[30px] font-black leading-none" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>{title}</h2>
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
    <div className="h-[360px] border p-5" style={{ borderColor: "rgba(243,239,232,0.14)", background: "rgba(255,255,255,0.018)" }}>
      {rows.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 16, right: 18, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="rgba(243,239,232,0.08)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "rgba(243,239,232,0.48)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis dataKey={yKey} type="category" width={170} tick={{ fill: "rgba(243,239,232,0.62)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(243,239,232,0.14)", color: "#f3efe8" }} />
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

export default function DeputadoPage({ onNavigateHome }: DeputadoPageProps) {
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
      fetchQuestion("q3", filtersForBackend, { page: 1, pageSize: 100, sortDir: "desc" }),
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
    <main className="min-h-screen" style={{ background: "#050505", color: "#f3efe8", fontFamily: "Inter, sans-serif" }}>
      <Header onNavigateHome={onNavigateHome} />
      <SearchHero query={query} selected={selectedDeputy} options={filters.deputados} onQueryChange={handleQueryChange} onSelect={handleSelectDeputy} />

      {loadingMeta ? (
        <div className="px-6 py-16 sm:px-10"><div className="mx-auto max-w-[1434px]"><EmptyPanel message="Carregando catalogo de deputados..." /></div></div>
      ) : error ? (
        <div className="px-6 py-16 sm:px-10"><div className="mx-auto max-w-[1434px]"><EmptyPanel message={error} /></div></div>
      ) : !selectedDeputy ? (
        <Suggestions deputies={filters.deputados} onSelect={handleSelectDeputy} />
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
        </>
      )}
    </main>
  );
}

function Suggestions({ deputies, onSelect }: { deputies: FilterChoice[]; onSelect: (deputy: FilterChoice) => void }) {
  return (
    <section className="px-6 py-14 sm:px-10">
      <div className="mx-auto max-w-[1434px]">
        <p className="mb-6 text-[10px] uppercase" style={{ color: "rgba(243,239,232,0.5)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.22em" }}>
          Sugestoes do catalogo
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {deputies.slice(0, 8).map((deputy) => (
            <button
              key={deputy.value}
              type="button"
              onClick={() => onSelect(deputy)}
              className="group relative min-h-[170px] overflow-hidden border p-4 text-left transition-colors hover:border-[#e00836]"
              style={{ borderColor: "rgba(243,239,232,0.14)", background: "#111" }}
            >
              <img src={photo(deputy)} alt="" className="absolute inset-0 h-full w-full object-cover object-top opacity-40 transition-transform duration-500 group-hover:scale-105" style={{ filter: "grayscale(70%) brightness(0.55)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,5,5,0.95) 22%, rgba(5,5,5,0.18))" }} />
              <span className="absolute bottom-4 left-4 right-4">
                <strong className="block text-[18px] leading-tight" style={{ color: "#f3efe8", fontFamily: "'Playfair Display', serif" }}>{deputy.label}</strong>
                <small className="mt-2 block text-[10px] uppercase" style={{ color: "#e00836", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.14em" }}>analisar deputado</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
