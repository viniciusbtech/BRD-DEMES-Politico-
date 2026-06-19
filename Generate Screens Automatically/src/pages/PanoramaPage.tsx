import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import { fmt } from "../data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

/* ── Static mock data ──────────────────────────── */
const TOP10_DEPUTIES = [
  { name: "Paulo H. Mota",       party: "PL",    state: "RJ", total: 1507600 },
  { name: "André Lima Fonseca",  party: "PSDB",  state: "MG", total: 1356200 },
  { name: "Roberto A. Silva",    party: "PT",    state: "SP", total: 1077250 },
  { name: "Marcos J. Ribeiro",   party: "MDB",   state: "CE", total: 987400  },
  { name: "Fernanda C. Lopes",   party: "PL",    state: "GO", total: 921300  },
  { name: "Sérgio D. Alves",     party: "PP",    state: "RS", total: 876500  },
  { name: "Eduardo M. Braga",    party: "PDT",   state: "AM", total: 845200  },
  { name: "Carla B. Santos",     party: "UNIÃO", state: "BA", total: 812700  },
  { name: "Jorge A. Pereira",    party: "PT",    state: "MG", total: 798400  },
  { name: "Luciana F. Costa",    party: "PSDB",  state: "PR", total: 765900  },
];

const TOP10_SUPPLIERS = [
  { name: "Azul Linhas Aéreas",      category: "Transporte Aéreo", deputies: 312, total: 48200000 },
  { name: "LATAM Airlines",           category: "Transporte Aéreo", deputies: 287, total: 41800000 },
  { name: "Gol Linhas Aéreas",        category: "Transporte Aéreo", deputies: 261, total: 36500000 },
  { name: "Correios",                 category: "Postagem",         deputies: 401, total: 8700000  },
  { name: "Auto Posto Brasília",      category: "Combustível",      deputies: 198, total: 12400000 },
  { name: "Hotel Nacional Brasília",  category: "Hospedagem",       deputies: 176, total: 9800000  },
  { name: "Restaurant Congresso",     category: "Alimentação",      deputies: 389, total: 5400000  },
  { name: "Claro S.A.",               category: "Telecom",          deputies: 234, total: 7200000  },
  { name: "Vivo / Telefônica",        category: "Telecom",          deputies: 218, total: 6900000  },
  { name: "Locadora Prime Cars",      category: "Veículos",         deputies: 142, total: 4800000  },
];

const TOP5_CATEGORIES = [
  { cat: "Passagens Aéreas",                    total: 312000000, pct: 41, color: "#c41230" },
  { cat: "Divulgação da Ativ. Parlamentar",      total: 187000000, pct: 25, color: "#d4841a" },
  { cat: "Combustíveis e Lubrificantes",         total: 98000000,  pct: 13, color: "#4a7c59" },
  { cat: "Alimentação",                          total: 76000000,  pct: 10, color: "#2e5fa3" },
  { cat: "Hospedagem",                           total: 52000000,  pct: 7,  color: "#7b3fa0" },
];

const TOP5_GROUPS = [
  { name: "PL",    full: "Partido Liberal",                       seats: 99, score: 94, color: "#1a3a7c", detail: "Maior bancada da Câmara. Lidera comissões-chave e pauta de segurança." },
  { name: "UNIÃO", full: "União Brasil",                          seats: 59, score: 80, color: "#d4841a", detail: "2ª maior bancada. Forte presença em comunicação e agronegócio." },
  { name: "PT",    full: "Partido dos Trabalhadores",             seats: 68, score: 76, color: "#c41230", detail: "Base governista. Domina pautas sociais e ministérios estratégicos." },
  { name: "PP",    full: "Progressistas",                         seats: 47, score: 67, color: "#2e5fa3", detail: "Aliado histórico de grandes obras e bancada ruralista." },
  { name: "MDB",   full: "Mov. Democrático Brasileiro",           seats: 42, score: 60, color: "#4a7c59", detail: "Partido de centro com presença em todos os estados." },
];

const maxSupplier = TOP10_SUPPLIERS[0].total;

/* ── Shared section wrapper ──────────────────── */
function Section({ n, tag, title, sub, children }: {
  n: string; tag: string; title: string; sub?: string; children: React.ReactNode;
}) {
  return (
    <section className="px-6 md:px-14 py-16 border-b border-border">
      <div className="flex items-baseline gap-4 mb-2">
        <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>{n}</span>
        <span className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>{tag}</span>
      </div>
      <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: SERIF, color: "#f0ece4" }}>{title}</h2>
      {sub && <p className="text-xs text-muted-foreground mb-10" style={{ fontFamily: MONO }}>{sub}</p>}
      {!sub && <div className="mb-10" />}
      {children}
    </section>
  );
}

export default function PanoramaPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar />

      <PageHero
        n="1" tag="VISÃO GERAL"
        title="Panorama" titleRed="Geral"
        desc="Uma visão estática e abrangente dos padrões de gasto, fornecedores dominantes e grupos de influência na 57ª Legislatura. Sem filtros — dados completos do período."
        imgId="photo-1544531586-fde5298cdd40"
        stripImgs={[
          { id: "photo-1561489396-888724a1543d", alt: "Reunião parlamentar" },
          { id: "photo-1567965606933-c46e07393d91", alt: "Manifestação política" },
          { id: "photo-1529107386315-e1a2ed48a620", alt: "Congresso" },
        ]}
      />

      {/* ── 1. Top 10 deputados que mais gastam ── */}
      <Section n="01" tag="DEPUTADOS" title="Top 10 que mais gastam"
        sub="CEAP ACUMULADA 2023–2026 · TODOS OS DEPUTADOS FEDERAIS">

        {/* chart */}
        <div className="h-80 mb-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TOP10_DEPUTIES} layout="vertical"
              margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name"
                tick={{ fill: "#f0ece4", fontSize: 11, fontFamily: SERIF }}
                axisLine={false} tickLine={false} width={160} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                formatter={(v: number) => [fmt(v), "Total gasto"]} />
              <Bar dataKey="total" radius={[0, 2, 2, 0]} maxBarSize={20}>
                {TOP10_DEPUTIES.map((_, i) => (
                  <Cell key={i}
                    fill={i === 0 ? "#c41230" : i < 3 ? "#d4841a" : "rgba(196,18,48,0.35)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* table */}
        <div className="flex flex-col gap-px border border-border"
          style={{ background: "rgba(240,236,228,0.06)" }}>
          <div className="grid grid-cols-4 px-6 py-3 bg-background">
            {["#", "DEPUTADO", "PARTIDO · UF", "TOTAL GASTO"].map((h) => (
              <span key={h} className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{h}</span>
            ))}
          </div>
          {TOP10_DEPUTIES.map((d, i) => (
            <div key={d.name}
              className="grid grid-cols-4 px-6 py-3.5 bg-background hover:bg-card transition-colors items-center">
              <span className="text-2xl font-black"
                style={{ fontFamily: SERIF, color: i === 0 ? "#c41230" : i < 3 ? "#d4841a" : "rgba(240,236,228,0.3)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{d.name}</span>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{d.party} · {d.state}</span>
              <span className="text-sm font-bold"
                style={{ fontFamily: MONO, color: i === 0 ? "#c41230" : "#f0ece4" }}>
                {fmt(d.total)}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 2. Top 10 fornecedores ── */}
      <div className="relative">
        <img src="https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=1600&h=900&fit=crop&auto=format" alt="Contratos" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ filter: "grayscale(60%) brightness(0.35)", opacity: 0.6 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(10,10,10,0.82)" }} />
        <Section n="02" tag="FORNECEDORES" title="Top 10 que mais receberam"
        sub="TOTAL DE CONTRATOS CEAP PAGOS NO PERÍODO">

        <div className="flex flex-col gap-3">
          {TOP10_SUPPLIERS.map((s, i) => (
            <div key={s.name}
              className="flex items-center gap-5 border border-border px-5 py-4 hover:border-primary transition-colors"
              style={{ background: "#141414" }}>

              {/* rank */}
              <span className="text-3xl font-black flex-shrink-0 w-12"
                style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.4)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* info + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1.5 gap-4">
                  <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>{s.name}</p>
                  <p className="text-sm font-black text-primary flex-shrink-0" style={{ fontFamily: MONO }}>{fmt(s.total)}</p>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{s.category}</span>
                  <span className="text-xs px-1.5 py-0.5 border border-border text-muted-foreground"
                    style={{ fontFamily: MONO }}>{s.deputies} dep.</span>
                </div>
                <div className="h-1 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                  <div style={{ width: `${(s.total / maxSupplier) * 100}%`, background: "#c41230", height: "100%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
      </div>

      {/* ── 3. Top 5 categorias de gasto ── */}
      <Section n="03" tag="CATEGORIAS" title="Top 5 gastos dos deputados"
        sub="DISTRIBUIÇÃO DO TOTAL DE R$ 1,48 BI EM COTA PARLAMENTAR">

        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* donut */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={TOP5_CATEGORIES} dataKey="pct" cx="50%" cy="50%"
                  innerRadius="48%" outerRadius="78%" paddingAngle={2}>
                  {TOP5_CATEGORIES.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                  formatter={(v: number, _, p: { payload?: { total?: number } }) => [`${v}% · ${fmt(p.payload?.total ?? 0)}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* bars */}
          <div className="flex flex-col gap-4">
            {TOP5_CATEGORIES.map((c, i) => (
              <div key={c.cat}>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xs text-muted-foreground w-4 flex-shrink-0"
                    style={{ fontFamily: MONO }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-sm font-bold text-foreground flex-1">{c.cat}</span>
                  <span className="text-sm font-black" style={{ fontFamily: MONO, color: c.color }}>{c.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)", marginLeft: "2rem" }}>
                  <div style={{ width: `${c.pct}%`, background: c.color, height: "100%" }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: MONO, marginLeft: "2rem" }}>
                  {fmt(c.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 4. Top 5 partidos mais influentes ── */}
      <div className="relative">
        <img src="https://images.unsplash.com/photo-1699112204356-532841a77e07?w=1600&h=900&fit=crop&auto=format" alt="Manifestação" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ filter: "grayscale(60%) brightness(0.35)", opacity: 0.6 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(10,10,10,0.82)" }} />
        <Section n="04" tag="INFLUÊNCIA" title="Top 5 partidos mais influentes"
        sub="RANKING POR CADEIRAS, LIDERANÇAS DE COMISSÃO E PODER DE ARTICULAÇÃO">

        <div className="flex flex-col gap-4">
          {TOP5_GROUPS.map((g, i) => (
            <div key={g.name}
              className="border border-border p-6 transition-colors hover:border-primary"
              style={{ background: "#111", borderLeft: `3px solid ${g.color}` }}>
              <div className="grid md:grid-cols-3 gap-6 items-center">

                {/* rank + identity */}
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black flex-shrink-0"
                    style={{ fontFamily: SERIF, color: `${g.color}35` }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-2xl font-black leading-none mb-1"
                      style={{ fontFamily: SERIF, color: g.color }}>{g.name}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{g.full}</p>
                    <span className="inline-block mt-1.5 text-xs px-2 py-0.5 text-primary-foreground"
                      style={{ background: g.color, fontFamily: MONO }}>{g.seats} cadeiras</span>
                  </div>
                </div>

                {/* score bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>ÍNDICE DE INFLUÊNCIA</p>
                    <span className="text-2xl font-black"
                      style={{ fontFamily: SERIF, color: g.color }}>{g.score}<span className="text-sm">/100</span></span>
                  </div>
                  <div className="h-3 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                    <div style={{ width: `${g.score}%`, background: g.color, height: "100%" }} />
                  </div>
                </div>

                {/* detail */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: MONO }}>DESTAQUE</p>
                  <p className="text-sm text-foreground leading-relaxed">{g.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
      </div>
    </div>
  );
}
