import { useEffect, useMemo, useState } from "react";
import { fetchMeta, fetchQuestion } from "../api";
import NavBar from "../components/NavBar";
import type { FilterChoice, QuestionPayload } from "../types";
import { useTheme } from "../../contexts/ThemeContext";

// ─── tipos ───────────────────────────────────────────────────────────────────
type Props = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
};
type Row = Record<string, unknown>;
type DepStats = { id: string; lancamentos: number; total: number; partido: string; uf: string };

// ─── constantes de estilo ────────────────────────────────────────────────────
const MONO  = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const RED   = "#c41230";

// quantas tuplas a tabela oculta avança por vez
const ANNUAL_PAGE_SIZE = 20;

// ─── helpers ─────────────────────────────────────────────────────────────────
const raw = (r: Row, k: string) => Number(r?.[k] ?? 0);
const str = (r: Row, k: string) => String(r?.[k] ?? "");

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}K`;
  return fmtCurrency(v);
};
const fmtNum = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
// normaliza texto para busca (minúsculas, sem acentos)
const normalizeText = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const camaraPhoto = (id: string | number) =>
  `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`;
const deputyPhoto = (deputy: Pick<FilterChoice, "value" | "photo_url"> | null, id?: string | number) => {
  const photoUrl = deputy?.photo_url;
  const depId = String(deputy?.value ?? id ?? "");
  return photoUrl || (/^\d+$/.test(depId) ? camaraPhoto(depId) : "");
};

// ─── componente de foto com fallback de iniciais ─────────────────────────────
function DeputyAvatar({
  nome,
  id,
  deputy,
  size = 48,
}: {
  nome: string;
  id?: string | number;
  deputy?: Pick<FilterChoice, "value" | "photo_url"> | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const src = deputyPhoto(deputy ?? null, id);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const initials = nome
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || nome.slice(0, 2).toUpperCase();

  if (!src || failed) {
    return (
      <div
        style={{
          width: size, height: size, flexShrink: 0,
          background: "#1a1a1a",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: size * 0.32, color: RED, fontWeight: "bold" }}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: size, height: size, flexShrink: 0,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <img
        src={src}
        alt={nome}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: "grayscale(25%)" }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// ─── sub-componentes de layout ────────────────────────────────────────────────
function SectionHeader({ n, tag, title, desc }: { n: string; tag: string; title: string; desc: string }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-baseline gap-4">
        <span className="select-none text-5xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.18)" }}>{n}</span>
        <span className="text-xs tracking-[0.3em] text-primary" style={{ fontFamily: MONO }}>{tag}</span>
      </div>
      <h2 className="mb-2 text-3xl font-black leading-tight" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>{title}</h2>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function YearPills({ years, selected, onChange }: { years: FilterChoice[]; selected: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange("")}
        className="border px-3 py-1.5 text-xs font-bold uppercase transition-colors"
        style={{
          fontFamily: MONO,
          borderColor: !selected ? RED : "var(--border)",
          background:  !selected ? `${RED}22` : "transparent",
          color:       !selected ? RED : "var(--muted-foreground)",
        }}
      >
        TODOS
      </button>
      {years.map((y) => (
        <button
          key={y.value}
          onClick={() => onChange(y.value)}
          className="border px-3 py-1.5 text-xs font-bold transition-colors"
          style={{
            fontFamily: MONO,
            borderColor: selected === y.value ? RED : "var(--border)",
            background:  selected === y.value ? `${RED}22` : "transparent",
            color:       selected === y.value ? RED : "var(--muted-foreground)",
          }}
        >
          {y.label}
        </button>
      ))}
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="border border-border px-6 py-10 text-center" style={{ background: "var(--card)" }}>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{text}</p>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-background px-6 py-6">
      <p className="mb-1.5 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>{label}</p>
      <p className="text-2xl font-black text-primary" style={{ fontFamily: SERIF }}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{sub}</p> : null}
    </div>
  );
}

// ─── metodologia (Q5 + Q12) ───────────────────────────────────────────────────
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
    id: "ranking_forn",
    titulo: "Ranking de Fornecedores",
    origem: "Q5 — Fornecedores por Valor",
    formula: "Total pago ao fornecedor = soma do valor liquido de todas as despesas em que ele aparece",
    passos: [
      "1. Cada nota da cota parlamentar (CEAP) tem um fornecedor: a empresa ou pessoa que recebeu o pagamento.",
      "2. Juntamos todas as notas de cada fornecedor e somamos os valores liquidos pagos.",
      "3. Consideramos apenas a 57a Legislatura (2023 em diante) e ignoramos estornos (valores zero ou negativos).",
      "4. Ordenamos do fornecedor que mais recebeu para o que menos recebeu.",
    ],
    interpretacao: "Receber muito da cota nao e irregular por si so — graficas e companhias aereas concentram grandes valores naturalmente. O ranking mostra para onde o dinheiro publico se concentra, nao onde ha suspeita.",
  },
  {
    id: "concentracao",
    titulo: "Concentracao e Participacao no Total",
    origem: "Q5 — % do Total e Top 30",
    formula: "% do fornecedor = total pago a ele ÷ total pago a todos os fornecedores do ano",
    passos: [
      "1. Para cada ano, somamos quanto foi pago a todos os fornecedores juntos.",
      "2. Dividimos o valor de cada fornecedor por esse total para achar sua fatia (%).",
      "3. Somando os 30 maiores, vemos quanto do dinheiro fica concentrado em poucas empresas.",
      "4. A barra de cada linha mostra o tamanho do fornecedor em relacao ao maior do ranking.",
    ],
    interpretacao: "Quanto maior a fatia dos primeiros colocados, mais concentrado e o mercado de fornecedores da cota. Pouca concentracao indica gasto pulverizado entre muitas empresas.",
  },
  {
    id: "dep_forn",
    titulo: "Deputado × Fornecedores",
    origem: "Q12 — Pares Deputado-Fornecedor",
    formula: "Total = soma do valor liquido pago por um deputado a cada fornecedor",
    passos: [
      "1. Cada nota liga um deputado a um fornecedor especifico.",
      "2. Para o deputado escolhido, agrupamos as notas por fornecedor e somamos os valores.",
      "3. Cada par 'deputado-fornecedor' vira uma linha, com total pago e numero de lancamentos.",
      "4. Ordenamos os fornecedores do que mais recebeu daquele deputado para o que menos recebeu.",
    ],
    interpretacao: "Mostra com quem cada deputado gasta a cota. Um fornecedor que concentra boa parte dos gastos de um parlamentar pode indicar uma relacao preferencial — um ponto de partida para investigacao, nao uma conclusao.",
  },
  {
    id: "universo",
    titulo: "Universo e Filtros dos Dados",
    origem: "Q5 e Q12 — CEAP / 57a Legislatura",
    formula: "Base = despesas da Cota Parlamentar (CEAP) de deputados da 57a Legislatura",
    passos: [
      "1. Usamos apenas despesas reembolsadas pela cota parlamentar (CEAP), nao o orcamento geral da Camara.",
      "2. Restringimos aos deputados da 57a Legislatura (2023-2027) para nao misturar mandatos anteriores.",
      "3. No ranking de gastos (Q5) consideramos so valores liquidos positivos, excluindo estornos e glosas.",
      "4. Nomes de fornecedores sao padronizados (caracteres especiais normalizados) para evitar duplicatas.",
    ],
    interpretacao: "Esses filtros garantem que os valores reflitam gastos efetivos da atual legislatura. Pequenas diferencas com outras fontes geralmente vem de estornos ou de periodos diferentes.",
  },
];

function MethodologySection() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <section className="border-t border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
      <SectionHeader
        n="03"
        tag="METODOLOGIA"
        title="Como os indicadores foram calculados?"
        desc="Transparência analítica · Clique em cada método para expandir e ver a fórmula, os passos e como interpretar."
      />

      {METODOS.map((m) => (
        <div key={m.id} className="mb-2 border border-border" style={{ background: "var(--card)" }}>
          <button
            type="button"
            onClick={() => toggle(m.id)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.titulo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{m.origem}</p>
            </div>
            <span className="ml-4 shrink-0 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              {open[m.id] ? "▲" : "▼"}
            </span>
          </button>

          {open[m.id] ? (
            <div className="border-t border-border px-5 py-5" style={{ background: "var(--card)" }}>
              {/* Fórmula */}
              <div className="mb-4 border-l-2 py-2 pl-4" style={{ borderColor: RED }}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Fórmula</p>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.formula}</p>
              </div>
              {/* Passos */}
              <div className="mb-4 flex flex-col gap-2">
                {m.passos.map((p, pi) => (
                  <p key={pi} className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: MONO }}>{p}</p>
                ))}
              </div>
              {/* Interpretação */}
              <div className="border border-border p-3" style={{ background: "rgba(196,18,48,0.06)" }}>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>Como interpretar</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: MONO }}>{m.interpretacao}</p>
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────
export default function FornecedoresPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // ── Q5 (seção 1) ──
  const [q5Payload, setQ5Payload]     = useState<QuestionPayload | null>(null);
  const [q5Year, setQ5Year]           = useState("");
  const [q5Search, setQ5Search]       = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // ── tabela oculta: top 30 fornecedores por ano ──
  const [annualTableOpen, setAnnualTableOpen] = useState(false);
  const [annualPage, setAnnualPage]           = useState(0);

  // ── Q12 overview (para top 10 + stats por deputado) ──
  const [q12Overview, setQ12Overview] = useState<Row[]>([]);
  const [depStats, setDepStats] = useState<Map<string, DepStats>>(new Map());

  // ── Q12 selecionado (seção 2) ──
  const [allYears, setAllYears]           = useState<FilterChoice[]>([]);
  const [deputyCatalog, setDeputyCatalog] = useState<FilterChoice[]>([]);
  const [depSearch, setDepSearch]         = useState("");
  const [showDepDrop, setShowDepDrop]     = useState(false);
  const [selectedDep, setSelectedDep]     = useState<FilterChoice | null>(null);
  const [q12Year, setQ12Year]             = useState("");
  const [q12Rows, setQ12Rows]             = useState<Row[]>([]);
  const [loadingQ12, setLoadingQ12]       = useState(false);
  const [fornecedorSearch, setFornecedorSearch] = useState(""); // 2º filtro: nome do fornecedor

  const [pageLoading, setPageLoading] = useState(true);

  // ── carga inicial ──
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchMeta(),
      fetchQuestion("q5", {}, { page: 1, pageSize: 200 }),
      fetchQuestion("q12", {}, { page: 1, pageSize: 200 }),
    ])
      .then(([meta, q5, q12]) => {
        if (!mounted) return;
        const q12Filters = meta.question_filters?.q12 ?? meta.question_filters?.q13 ?? meta.available_filters;
        setAllYears(q12Filters.anos ?? meta.available_filters.anos ?? []);
        setDeputyCatalog(q12Filters.deputados ?? []);
        setQ5Payload(q5);

        const overviewRows = q12.table_spec.rows as Row[];

        setQ12Overview(overviewRows);

        // Monta mapa nome → { id, lancamentos, total, partido, uf }
        const stats = new Map<string, DepStats>();
        overviewRows.forEach((r) => {
          const nome = str(r, "nome").trim();
          const id   = str(r, "id_deputado").trim();
          const lc   = raw(r, "qtd_lancamentos");
          const tp   = raw(r, "total_pago");
          if (!nome) return;
          const key = nome.toLowerCase();
          if (!stats.has(key)) {
            stats.set(key, { id, lancamentos: 0, total: 0, partido: str(r, "sigla_partido"), uf: str(r, "sigla_uf") });
          }
          if (id && !stats.has(id.toLowerCase())) {
            stats.set(id.toLowerCase(), { id, lancamentos: 0, total: 0, partido: str(r, "sigla_partido"), uf: str(r, "sigla_uf") });
          }
          const e = stats.get(key)!;
          e.lancamentos += lc;
          e.total       += tp;
          if (id) {
            const byId = stats.get(id.toLowerCase())!;
            byId.lancamentos += lc;
            byId.total       += tp;
          }
        });
        setDepStats(stats);
      })
      .catch(console.error)
      .finally(() => { if (mounted) setPageLoading(false); });
    return () => { mounted = false; };
  }, []);

  // ── fetch Q12 filtrado ao selecionar deputado ──
  useEffect(() => {
    if (!selectedDep) { setQ12Rows([]); return; }
    let mounted = true;
    setLoadingQ12(true);
    const anos = q12Year ? [q12Year] : [];

    const loadDeputyRows = async () => {
      const pageSize = 200;
      const firstPage = await fetchQuestion("q12", { deputados: [selectedDep.value], anos }, { page: 1, pageSize });
      const firstRows = firstPage.table_spec.rows as Row[];
      const total = firstPage.table_spec.total;
      const totalPages = Math.ceil(total / pageSize);

      if (totalPages <= 1) return firstRows;

      const nextPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          fetchQuestion("q12", { deputados: [selectedDep.value], anos }, { page: index + 2, pageSize }),
        ),
      );

      return [
        ...firstRows,
        ...nextPages.flatMap((page) => page.table_spec.rows as Row[]),
      ];
    };

    loadDeputyRows()
      .then((rows) => { if (mounted) setQ12Rows(rows); })
      .catch(() => { if (mounted) setQ12Rows([]); })
      .finally(() => { if (mounted) setLoadingQ12(false); });
    return () => { mounted = false; };
  }, [selectedDep, q12Year]);

  // ── helper: busca stats pelo id do catalogo; cai para nome quando vem do top 10 ──
  const statsForDeputy = (deputy: Pick<FilterChoice, "value" | "label"> | null) => {
    if (!deputy) return undefined;
    return depStats.get(deputy.value.trim().toLowerCase()) ?? depStats.get(deputy.label.trim().toLowerCase());
  };

  // ── Q5: linhas anuais e globais ──
  const q5AnnualRows = useMemo(() => (q5Payload?.table_spec.rows ?? []) as Row[], [q5Payload]);
  const q5GlobalRows = useMemo(() => {
    for (const ct of q5Payload?.complement_tables ?? []) {
      const rows = (ct.rows ?? []) as Row[];
      if (rows.length > 0 && str(rows[0], "ano_dados") === "GLOBAL") return rows;
    }
    return [] as Row[];
  }, [q5Payload]);

  const q5BaseRows = useMemo(() => {
    if (q5Year) return q5AnnualRows.filter((r) => str(r, "ano_dados") === q5Year);
    return q5GlobalRows.length > 0 ? q5GlobalRows : q5AnnualRows;
  }, [q5Year, q5AnnualRows, q5GlobalRows]);

  const q5Visible = useMemo(() => {
    if (!q5Search.trim()) return q5BaseRows;
    const q = q5Search.toLowerCase();
    return q5BaseRows.filter((r) => str(r, "fornecedor").toLowerCase().includes(q));
  }, [q5BaseRows, q5Search]);

  const q5Max = useMemo(() => Math.max(...q5BaseRows.map((r) => raw(r, "total_pago")), 1), [q5BaseRows]);
  const s1Total       = useMemo(() => q5Visible.reduce((s, r) => s + raw(r, "total_pago"), 0), [q5Visible]);
  const s1Lancamentos = useMemo(() => q5Visible.reduce((s, r) => s + raw(r, "qtd_lancamentos"), 0), [q5Visible]);

  const expandedBreakdown = useMemo(() => {
    if (!expandedRow) return [];
    return q5AnnualRows
      .filter((r) => str(r, "fornecedor") === expandedRow)
      .sort((a, b) => raw(a, "ano_dados") - raw(b, "ano_dados"));
  }, [q5AnnualRows, expandedRow]);

  // ── linhas anuais (top 30 por ano) ordenadas: ano asc, posicao asc ──
  const q5AnnualSorted = useMemo(() => (
    q5AnnualRows
      .filter((r) => /^\d{4}$/.test(str(r, "ano_dados")))
      .sort((a, b) => {
        const byYear = raw(a, "ano_dados") - raw(b, "ano_dados");
        return byYear !== 0 ? byYear : raw(a, "posicao") - raw(b, "posicao");
      })
  ), [q5AnnualRows]);

  const annualTotalPages = Math.max(1, Math.ceil(q5AnnualSorted.length / ANNUAL_PAGE_SIZE));
  const q5AnnualPageRows = useMemo(
    () => q5AnnualSorted.slice(annualPage * ANNUAL_PAGE_SIZE, annualPage * ANNUAL_PAGE_SIZE + ANNUAL_PAGE_SIZE),
    [q5AnnualSorted, annualPage],
  );
  const annualRangeStart = q5AnnualSorted.length === 0 ? 0 : annualPage * ANNUAL_PAGE_SIZE + 1;
  const annualRangeEnd   = Math.min(q5AnnualSorted.length, (annualPage + 1) * ANNUAL_PAGE_SIZE);

  // ── Top 10 deputados (de Q12 overview) ──
  const top10Deputies = useMemo(() => {
    const map = new Map<string, { nome: string; id: number; partido: string; uf: string; total: number; lancamentos: number }>();
    q12Overview.forEach((r) => {
      const nome = str(r, "nome");
      const id   = raw(r, "id_deputado");
      if (!nome || !id) return;
      if (!map.has(nome)) map.set(nome, { nome, id, partido: str(r, "sigla_partido"), uf: str(r, "sigla_uf"), total: 0, lancamentos: 0 });
      const e = map.get(nome)!;
      e.total       += raw(r, "total_pago");
      e.lancamentos += raw(r, "qtd_lancamentos");
    });
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  }, [q12Overview]);

  // ── Filtro deputados no dropdown ──
  const filteredDeps = useMemo(() => {
    if (!depSearch.trim()) return deputyCatalog.slice(0, 25);
    const q = depSearch.toLowerCase();
    return deputyCatalog.filter((d) => `${d.label} ${d.value}`.toLowerCase().includes(q));
  }, [deputyCatalog, depSearch]);

  // ── Resultados seção 2 ──
  const s2Results = useMemo(() => {
    if (!q12Rows.length) return [];
    const map = new Map<string, { fornecedor: string; total: number; lancamentos: number; anos: Set<string> }>();
    q12Rows.forEach((r) => {
      const name = str(r, "fornecedor");
      if (!name) return;
      if (!map.has(name)) map.set(name, { fornecedor: name, total: 0, lancamentos: 0, anos: new Set() });
      const e = map.get(name)!;
      e.total       += raw(r, "total_pago");
      e.lancamentos += raw(r, "qtd_lancamentos");
      e.anos.add(str(r, "ano_dados"));
    });
    const entries = [...map.values()].sort((a, b) => b.total - a.total);
    const grandTotal = entries.reduce((s, e) => s + e.total, 0);
    const maxTotal   = entries[0]?.total ?? 1;
    return entries.map((e, i) => ({ ...e, rank: i + 1, pct: grandTotal > 0 ? (e.total / grandTotal) * 100 : 0, barPct: (e.total / maxTotal) * 100 }));
  }, [q12Rows]);

  // 2º filtro: quando vazio, mostra a tabela inteira; quando preenchido, só os fornecedores que casam
  const s2Visible = useMemo(() => {
    const q = normalizeText(fornecedorSearch);
    if (!q) return s2Results;
    return s2Results.filter((e) => normalizeText(e.fornecedor).includes(q));
  }, [s2Results, fornecedorSearch]);

  const s2Total       = useMemo(() => s2Visible.reduce((s, e) => s + e.total, 0), [s2Visible]);
  const s2Lancamentos = useMemo(() => s2Visible.reduce((s, e) => s + e.lancamentos, 0), [s2Visible]);

  const selectDeputy = (deputy: FilterChoice) => {
    setSelectedDep(deputy);
    setDepSearch(deputy.label);
    setShowDepDrop(false);
    setFornecedorSearch(""); // reinicia o filtro de fornecedor ao trocar de deputado
  };

  // ─────────────────────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateDeputado={onNavigateDeputado} />
        <div className="flex h-[60vh] items-center justify-center text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          CARREGANDO DADOS…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateDeputado={onNavigateDeputado} />

      {/* ── HERO ── */}
      <div
        className="relative overflow-hidden border-b border-border px-6 pb-20 pt-20 md:px-14 md:pb-24 md:pt-24"
      >
        <img
          src="/perguntas/q05/ChatGPT Image Jun 16, 2026, 10_05_56 PM.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,5,5,0.78) 0%, rgba(5,5,5,0.46) 42%, rgba(5,5,5,0.10) 100%)",
          }}
        />
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 -70px 90px rgba(10,10,10,0.52)" }} />
        <p className="relative z-10 mb-3 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>05 — CONTRATOS</p>
        <h1 className="relative z-10 mb-4 font-black leading-none" style={{ fontFamily: SERIF, color: "var(--foreground)", fontSize: "clamp(3rem, 7vw, 5.5rem)" }}>
          Fornecedores
          <br />
          <span style={{ color: RED }}>× Deputados</span>
        </h1>
        <p className="relative z-10 max-w-2xl text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Quem recebeu dinheiro da cota parlamentar — quanto cada empresa foi paga ao longo da 57ª Legislatura e com quais fornecedores cada deputado fez seus gastos.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SEÇÃO 01 — FORNECEDORES POR VALOR  (Q5)
      ══════════════════════════════════════════════════════════ */}
      <section className="border-b border-border px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader
          n="01"
          tag="FORNECEDORES POR VALOR"
          title="Ordenados pelo total recebido da cota parlamentar"
          desc="Ranking dos maiores fornecedores. Filtre por ano ou pesquise um fornecedor específico. Clique em qualquer linha para ver o detalhamento por ano."
        />

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <YearPills years={allYears} selected={q5Year} onChange={(v) => { setQ5Year(v); setExpandedRow(null); }} />
          <div className="relative max-w-xs flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">⌕</span>
            <input
              value={q5Search}
              onChange={(e) => setQ5Search(e.target.value)}
              placeholder="Pesquisar fornecedor..."
              className="w-full border border-border bg-card py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            {q5Search ? (
              <button onClick={() => setQ5Search("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">×</button>
            ) : null}
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="mb-8 grid grid-cols-1 gap-px border border-border sm:grid-cols-3" style={{ background: "var(--secondary)" }}>
          <StatCard
            label={q5Year ? `TOTAL PAGO — ${q5Year}` : "TOTAL PAGO — TODOS OS ANOS"}
            value={fmtShort(s1Total)}
            sub={fmtCurrency(s1Total)}
          />
          <StatCard
            label="FORNECEDORES NO RANKING"
            value={fmtNum(q5Visible.length)}
            sub={q5Search ? `filtrado de ${q5BaseRows.length}` : `top ${q5BaseRows.length}`}
          />
          <StatCard label="LANÇAMENTOS" value={fmtNum(s1Lancamentos)} />
        </div>

        {/* Ranking de fornecedores */}
        {q5Visible.length === 0 ? (
          <EmptyMsg text="NENHUM FORNECEDOR ENCONTRADO." />
        ) : (
          <div>
            {/* Cabeçalho */}
            <div
              className="grid items-center gap-3 px-4 py-2.5"
              style={{ gridTemplateColumns: "2.5rem 1fr 6.5rem 7.5rem", background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}
            >
              {["POS.", "FORNECEDOR", "LANÇ.", "TOTAL"].map((h) => (
                <span
                  key={h}
                  className="text-xs text-muted-foreground"
                  style={{ fontFamily: MONO, ...(h === "POS." && !isDark ? { color: RED } : {}) }}
                >
                  {h}
                </span>
              ))}
            </div>

            {q5Visible.map((row, idx) => {
              const name   = str(row, "fornecedor");
              const total  = raw(row, "total_pago");
              const lanc   = raw(row, "qtd_lancamentos");
              const pos    = raw(row, "posicao") || idx + 1;
              const barPct = (total / q5Max) * 100;
              const isTop3 = pos <= 3;
              const isExp  = expandedRow === name;

              return (
                <div key={name + pos} style={{ borderBottom: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setExpandedRow(isExp ? null : name)}
                    className="grid w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-card"
                    style={{ gridTemplateColumns: "2.5rem 1fr 6.5rem 7.5rem", background: isExp ? "rgba(196,18,48,0.06)" : undefined }}
                  >
                    <span
                      className="font-black"
                      style={{
                        fontFamily: SERIF,
                        fontSize: isTop3 ? "1.25rem" : "1rem",
                        color: isDark ? (isTop3 ? RED : "rgba(240,236,228,0.3)") : RED,
                      }}
                    >
                      {String(pos).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="mb-1.5 truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1" style={{ background: "var(--secondary)", height: "6px" }}>
                          <div style={{ width: `${barPct}%`, height: "100%", background: isTop3 ? RED : "rgba(196,18,48,0.4)" }} />
                        </div>
                        <span className="shrink-0 text-xs" style={{ fontFamily: MONO, color: "#666660" }}>{barPct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <span className="text-right text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{fmtNum(lanc)}</span>
                    <span className="text-right text-sm font-bold" style={{ fontFamily: MONO, color: isTop3 ? RED : "var(--foreground)" }}>{fmtShort(total)}</span>
                  </button>

                  {/* Painel de breakdown por ano */}
                  {isExp ? (
                    <div className="px-4 pb-4 pt-2" style={{ background: "rgba(196,18,48,0.04)", borderTop: "1px solid rgba(196,18,48,0.15)" }}>
                      <p className="mb-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        DETALHAMENTO POR ANO — {name}
                      </p>
                      {expandedBreakdown.length === 0 ? (
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>DADOS ANUAIS NÃO DISPONÍVEIS.</p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {expandedBreakdown.map((yr) => (
                            <div key={str(yr, "ano_dados")} className="border border-border px-4 py-3" style={{ background: "var(--card)", minWidth: "160px" }}>
                              <p className="mb-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{str(yr, "ano_dados")}</p>
                              <p className="text-base font-black text-primary" style={{ fontFamily: SERIF }}>{fmtShort(raw(yr, "total_pago"))}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                                {fmtNum(raw(yr, "qtd_lancamentos"))} lanç. · #{raw(yr, "posicao")} no ranking
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tabela oculta: top 30 fornecedores por ano ── */}
        <div className="mt-10 border border-border">
          <button
            type="button"
            onClick={() => { setAnnualTableOpen((v) => !v); setAnnualPage(0); }}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#161616]"
            style={{ background: "var(--card)" }}
          >
            <div>
              <p className="text-sm font-bold tracking-wide" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                TOP 30 FORNECEDORES POR ANO
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                Quanto cada fornecedor recebeu, ano a ano (maior total pago)
              </p>
            </div>
            <span className="ml-6 shrink-0 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              {annualTableOpen ? "▲ OCULTAR" : "▼ MOSTRAR TABELA"}
            </span>
          </button>

          {annualTableOpen ? (
            <div className="border-t border-border" style={{ background: "var(--card)" }}>
              {q5AnnualSorted.length === 0 ? (
                <EmptyMsg text="SEM DADOS ANUAIS DISPONÍVEIS." />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead style={{ background: "var(--secondary)" }}>
                        <tr>
                          {["ANO", "POS", "FORNECEDOR", "LANÇ.", "TOTAL", "% ANO"].map((h) => (
                            <th
                              key={h}
                              className="whitespace-nowrap px-4 py-3 text-xs font-normal uppercase text-muted-foreground"
                              style={{ fontFamily: MONO, ...(h === "POS" && !isDark ? { color: RED } : {}) }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {q5AnnualPageRows.map((row, idx) => {
                          const pos = raw(row, "posicao");
                          return (
                            <tr key={`${str(row, "ano_dados")}-${pos}-${idx}`} className="border-t border-border">
                              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground" style={{ fontFamily: MONO }}>
                                {str(row, "ano_dados")}
                              </td>
                              <td
                                className="whitespace-nowrap px-4 py-3 font-black"
                                style={{
                                  fontFamily: MONO,
                                  color: isDark ? (pos <= 3 ? RED : "rgba(240,236,228,0.4)") : RED,
                                }}
                              >
                                {String(pos).padStart(2, "0")}
                              </td>
                              <td className="px-4 py-3 text-foreground" style={{ fontFamily: SERIF }}>
                                {str(row, "fornecedor")}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground" style={{ fontFamily: MONO }}>
                                {fmtNum(raw(row, "qtd_lancamentos"))}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-bold" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                                {fmtCurrency(raw(row, "total_pago"))}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground" style={{ fontFamily: MONO }}>
                                {raw(row, "pct_total").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* paginação — passa de 20 em 20 */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"
                    style={{ background: "var(--secondary)" }}
                  >
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {annualRangeStart}–{annualRangeEnd} de {fmtNum(q5AnnualSorted.length)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={annualPage === 0}
                        onClick={() => setAnnualPage((p) => Math.max(0, p - 1))}
                        className="border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
                        style={{ fontFamily: MONO, color: "var(--muted-foreground)" }}
                      >
                        ← ANTERIORES
                      </button>
                      <span className="px-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        {annualPage + 1}/{annualTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={annualPage >= annualTotalPages - 1}
                        onClick={() => setAnnualPage((p) => Math.min(annualTotalPages - 1, p + 1))}
                        className="border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
                        style={{ fontFamily: MONO, color: "var(--muted-foreground)" }}
                      >
                        PRÓXIMAS →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SEÇÃO 02 — DEPUTADO × FORNECEDORES  (Q12)
      ══════════════════════════════════════════════════════════ */}
      <section className="px-6 py-14 md:px-14" style={{ background: "var(--card)" }}>
        <SectionHeader
          n="02"
          tag="DEPUTADO × FORNECEDORES"
          title="Com quais fornecedores esse deputado gastou?"
          desc="Veja os maiores gastadores com fornecedores ou pesquise um deputado específico para ver todos os fornecedores com quem ele realizou gastos da cota parlamentar."
        />

        {/* TOP 10 DEPUTADOS */}
        {top10Deputies.length > 0 ? (
          <div className="mb-10">
            <p className="mb-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              TOP 10 — MAIORES GASTOS COM FORNECEDORES (dados disponíveis)
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {top10Deputies.map((dep, idx) => {
                const deputy = {
                  value: String(dep.id),
                  label: dep.nome,
                  photo_url: camaraPhoto(dep.id),
                };
                const isSelected = selectedDep?.value === deputy.value;
                return (
                  <button
                    key={dep.nome}
                    onClick={() => selectDeputy(deputy)}
                    className="flex flex-col items-center border p-3 text-center transition-colors hover:border-primary"
                    style={{
                      background:  isSelected ? "rgba(196,18,48,0.09)" : "var(--card)",
                      borderColor: isSelected ? RED : "var(--border)",
                    }}
                  >
                    {/* Foto */}
                    <div className="relative mb-2">
                      <DeputyAvatar nome={dep.nome} deputy={deputy} size={64} />
                      <span
                        className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center text-xs font-black"
                        style={{ fontFamily: MONO, background: idx < 3 ? RED : "var(--secondary)", color: "#fff" }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                    {/* Nome */}
                    <p className="mb-0.5 line-clamp-2 text-xs font-bold text-foreground" style={{ fontFamily: SERIF }}>
                      {dep.nome}
                    </p>
                    {/* Partido · UF */}
                    {dep.partido ? (
                      <p className="mb-1.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        {dep.partido}{dep.uf ? ` · ${dep.uf}` : ""}
                      </p>
                    ) : null}
                    {/* Total */}
                    <p className="text-xs font-bold" style={{ fontFamily: MONO, color: RED }}>
                      {fmtShort(dep.total)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* DIVIDER */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>OU PESQUISE UM DEPUTADO</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* CONTROLES: busca + filtro de ano */}
        <div className="mb-6 flex flex-wrap items-start gap-4">
          {/* Busca — estilo Recorte 2 */}
          <div className="w-full max-w-xl">
        <p className="mb-3 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              SELECIONE UM DEPUTADO
            </p>
            <div
              className="relative"
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setShowDepDrop(false); }}
            >
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                ⌕
              </span>
              <input
                value={depSearch}
                onChange={(e) => { setDepSearch(e.target.value); setShowDepDrop(true); }}
                onFocus={() => setShowDepDrop(true)}
                placeholder="Nome do deputado..."
                className="w-full border border-border bg-card py-3.5 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {depSearch ? (
                <button
                  type="button"
                  onClick={() => { setDepSearch(""); setSelectedDep(null); setShowDepDrop(true); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  x
                </button>
              ) : null}

              {showDepDrop ? (
                <div className="absolute left-0 right-0 top-full z-30 max-h-80 overflow-y-auto border border-border" style={{ background: "var(--card)" }}>
                  {filteredDeps.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      Nenhum deputado encontrado.
                    </div>
                  ) : filteredDeps.map((d) => {
                    const s = statsForDeputy(d);
                    const isSelected = selectedDep?.value === d.value;
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onMouseDown={() => selectDeputy(d)}
                        className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
                      >
                        <DeputyAvatar nome={d.label} id={s?.id} deputy={d} size={40} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                            {d.label}
                          </span>
                          <span className="block text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                            {s?.id ? `ID ${s.id}` : "—"}{s?.lancamentos ? ` · ${fmtNum(s.lancamentos)} lançamentos` : ""}
                            {s?.partido ? ` · ${s.partido}` : ""}
                            {s?.uf ? ` · ${s.uf}` : ""}
                          </span>
                        </span>
                        {isSelected ? (
                          <span className="shrink-0 text-xs text-primary" style={{ fontFamily: MONO }}>SELECIONADO</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {/* Filtro de ano */}
          <div className="pt-7">
            <YearPills years={allYears} selected={q12Year} onChange={setQ12Year} />
          </div>
        </div>

        {/* RESULTADO DA SEÇÃO 2 */}
        {!selectedDep ? (
          <EmptyMsg text="SELECIONE UM DEPUTADO ACIMA PARA VER OS FORNECEDORES." />
        ) : (
          <div>
            {/* Header do deputado */}
            {(() => {
              const s = statsForDeputy(selectedDep);
              return (
                <div className="mb-6 flex items-center gap-4 border-l-4 py-4 pl-5" style={{ background: "var(--card)", borderColor: RED }}>
                  <DeputyAvatar nome={selectedDep.label} id={s?.id} deputy={selectedDep} size={72} />
                  <div>
                    <h3 className="text-2xl font-black text-foreground" style={{ fontFamily: SERIF }}>{selectedDep.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {s?.id ? `ID ${s.id}` : ""}
                      {s?.partido ? ` · ${s.partido}` : ""}
                      {s?.uf ? ` · ${s.uf}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {q12Year ? `ANO ${q12Year}` : "TODOS OS ANOS"}
                      {s2Lancamentos > 0 ? ` · ${fmtNum(s2Lancamentos)} lançamentos` : ""}
                    </p>
                  </div>
                </div>
              );
            })()}

            {loadingQ12 ? (
              <EmptyMsg text="CARREGANDO FORNECEDORES DO DEPUTADO…" />
            ) : s2Results.length === 0 ? (
              <EmptyMsg text="NENHUM DADO ENCONTRADO PARA ESSE DEPUTADO NO PERÍODO SELECIONADO." />
            ) : (
              <>
                {/* 2º filtro: pesquisar um fornecedor específico desse deputado */}
                <div className="mb-6">
                  <p className="mb-3 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
                    FILTRAR POR FORNECEDOR (OPCIONAL)
                  </p>
                  <div className="relative w-full max-w-xl">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      ⌕
                    </span>
                    <input
                      value={fornecedorSearch}
                      onChange={(e) => setFornecedorSearch(e.target.value)}
                      placeholder="Nome do fornecedor... (vazio = todos)"
                      className="w-full border border-border bg-card py-3.5 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                    {fornecedorSearch ? (
                      <button
                        type="button"
                        onClick={() => setFornecedorSearch("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        x
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Cards de totais */}
                <div className="mb-8 grid grid-cols-1 gap-px border border-border sm:grid-cols-3" style={{ background: "var(--secondary)" }}>
                  <StatCard label={fornecedorSearch.trim() ? "GASTO COM O FILTRO" : "TOTAL GASTO"} value={fmtShort(s2Total)} sub={fmtCurrency(s2Total)} />
                  <StatCard label="FORNECEDORES" value={fmtNum(s2Visible.length)} />
                  <StatCard label="LANÇAMENTOS"  value={fmtNum(s2Lancamentos)} />
                </div>

                {s2Visible.length === 0 ? (
                  <EmptyMsg text={`NENHUM FORNECEDOR ENCONTRADO PARA "${fornecedorSearch.trim().toUpperCase()}".`} />
                ) : (
                  <>
                    {/* Tabela de fornecedores */}
                    <div className="grid items-center gap-3 px-4 py-2.5" style={{ gridTemplateColumns: "2.5rem 1fr 6.5rem 7.5rem", background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
                      {["POS.", "FORNECEDOR", "LANÇ.", "TOTAL"].map((h) => (
                        <span
                          key={h}
                          className="text-xs text-muted-foreground"
                          style={{ fontFamily: MONO, ...(h === "POS." && !isDark ? { color: RED } : {}) }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>

                    {s2Visible.map((item) => (
                      <div
                        key={item.fornecedor}
                        className="grid items-center gap-3 px-4 py-4 transition-colors hover:bg-card"
                        style={{ gridTemplateColumns: "2.5rem 1fr 6.5rem 7.5rem", background: "var(--card)", borderBottom: "1px solid var(--border)" }}
                      >
                        <span
                          className="font-black"
                          style={{
                            fontFamily: SERIF,
                            fontSize: item.rank <= 3 ? "1.25rem" : "1rem",
                            color: isDark ? (item.rank <= 3 ? RED : "rgba(240,236,228,0.3)") : RED,
                          }}
                        >
                          {String(item.rank).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="mb-1 truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{item.fornecedor}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1" style={{ background: "var(--secondary)", height: "6px" }}>
                              <div style={{ width: `${item.barPct}%`, height: "100%", background: item.rank === 1 ? RED : "rgba(196,18,48,0.4)" }} />
                            </div>
                            <span className="shrink-0 text-xs" style={{ fontFamily: MONO, color: "#666660" }}>{item.pct.toFixed(1)}%</span>
                          </div>
                          {item.anos.size > 1 ? (
                            <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{[...item.anos].sort().join(" · ")}</p>
                          ) : null}
                        </div>
                        <span className="text-right text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{fmtNum(item.lancamentos)}</span>
                        <span className="text-right text-sm font-bold" style={{ fontFamily: MONO, color: item.rank === 1 ? RED : "var(--foreground)" }}>{fmtShort(item.total)}</span>
                      </div>
                    ))}

                    {/* Rodapé de total */}
                    <div
                      className="grid items-center gap-3 px-4 py-3"
                      style={{ gridTemplateColumns: "2.5rem 1fr 6.5rem 7.5rem", background: `${RED}11`, borderTop: `1px solid ${RED}44` }}
                    >
                      <span />
                      <span className="text-xs font-bold text-primary" style={{ fontFamily: MONO }}>{fornecedorSearch.trim() ? "GASTO COM O FILTRO" : "TOTAL GASTO"}</span>
                      <span className="text-right text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{fmtNum(s2Lancamentos)}</span>
                      <span className="text-right text-sm font-black text-primary" style={{ fontFamily: SERIF }}>{fmtShort(s2Total)}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          SEÇÃO 03 — METODOLOGIA  (Q5 + Q12) · mesmo estilo dos recortes 1 e 2
      ══════════════════════════════════════════════════════════ */}
      <MethodologySection />
    </div>
  );
}
