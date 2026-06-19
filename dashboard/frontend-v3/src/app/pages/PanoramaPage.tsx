import type { ReactNode } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import {
  formatCurrency,
  topCategories,
  topDeputySpending,
  topInfluenceGroups,
  topSuppliers,
} from "../data/panoramaMock";

type PanoramaPageProps = {
  onNavigateHome: () => void;
  onNavigateDeputado: () => void;
};

type SectionProps = {
  n: string;
  tag: string;
  title: string;
  sub?: string;
  children: ReactNode;
};

type TooltipValue = string | number | Array<string | number>;

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const maxSupplier = topSuppliers[0]?.total ?? 1;

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

export default function PanoramaPage({ onNavigateHome, onNavigateDeputado }: PanoramaPageProps) {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateDeputado={onNavigateDeputado} />

      <PageHero
        n="1"
        tag="VISÃO GERAL"
        title="Panorama"
        titleRed="Geral"
        desc="Uma visão estática e abrangente dos padrões de gasto, fornecedores dominantes e grupos de influência na 57ª Legislatura. Sem filtros, com dados mockados do período."
        imgId="photo-1544531586-fde5298cdd40"
        stripImgs={[
          { id: "photo-1561489396-888724a1543d", alt: "Reunião parlamentar" },
          { id: "photo-1567965606933-c46e07393d91", alt: "Manifestação política" },
          { id: "photo-1529107386315-e1a2ed48a620", alt: "Congresso" },
        ]}
      />

      <Section n="01" tag="DEPUTADOS" title="Top 10 que mais gastam" sub="CEAP ACUMULADA 2023-2026 · TODOS OS DEPUTADOS FEDERAIS">
        <div className="mb-10 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topDeputySpending} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
              <XAxis
                type="number"
                tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#f0ece4", fontSize: 11, fontFamily: SERIF }}
                axisLine={false}
                tickLine={false}
                width={160}
              />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                formatter={(value: TooltipValue) => [formatCurrency(Number(value)), "Total gasto"]}
              />
              <Bar dataKey="total" radius={[0, 2, 2, 0]} maxBarSize={20}>
                {topDeputySpending.map((item, index) => (
                  <Cell key={item.name} fill={index === 0 ? "#c41230" : index < 3 ? "#d4841a" : "rgba(196,18,48,0.35)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-w-[760px] flex-col gap-px border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
            <div className="grid grid-cols-4 bg-background px-6 py-3">
              {["#", "DEPUTADO", "PARTIDO · UF", "TOTAL GASTO"].map((heading) => (
                <span key={heading} className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {heading}
                </span>
              ))}
            </div>
            {topDeputySpending.map((deputy, index) => (
              <div key={deputy.name} className="grid grid-cols-4 items-center bg-background px-6 py-3.5 transition-colors hover:bg-card">
                <span className="text-2xl font-black" style={{ fontFamily: SERIF, color: index === 0 ? "#c41230" : index < 3 ? "#d4841a" : "rgba(240,236,228,0.3)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                  {deputy.name}
                </span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {deputy.party} · {deputy.state}
                </span>
                <span className="text-sm font-bold" style={{ fontFamily: MONO, color: index === 0 ? "#c41230" : "#f0ece4" }}>
                  {formatCurrency(deputy.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=1600&h=900&fit=crop&auto=format"
          alt="Contratos"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ filter: "grayscale(60%) brightness(0.35)", opacity: 0.6 }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(10,10,10,0.82)" }} />
        <Section n="02" tag="FORNECEDORES" title="Top 10 que mais receberam" sub="TOTAL DE CONTRATOS CEAP PAGOS NO PERÍODO">
          <div className="flex flex-col gap-3">
            {topSuppliers.map((supplier, index) => (
              <div key={supplier.name} className="flex items-center gap-5 border border-border px-5 py-4 transition-colors hover:border-primary" style={{ background: "#141414" }}>
                <span className="w-12 flex-shrink-0 text-3xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.4)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <p className="truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                      {supplier.name}
                    </p>
                    <p className="flex-shrink-0 text-sm font-black text-primary" style={{ fontFamily: MONO }}>
                      {formatCurrency(supplier.total)}
                    </p>
                  </div>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {supplier.category}
                    </span>
                    <span className="border border-border px-1.5 py-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {supplier.deputies} dep.
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                    <div style={{ width: `${(supplier.total / maxSupplier) * 100}%`, background: "#c41230", height: "100%" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section n="03" tag="CATEGORIAS" title="Top 5 gastos dos deputados" sub="DISTRIBUIÇÃO DO TOTAL DE R$ 1,48 BI EM COTA PARLAMENTAR">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topCategories} dataKey="percent" cx="50%" cy="50%" innerRadius="48%" outerRadius="78%" paddingAngle={2}>
                  {topCategories.map((category) => (
                    <Cell key={category.category} fill={category.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                  formatter={(value: TooltipValue, _name: string, item: { payload?: { total?: number } }) => [`${value}% · ${formatCurrency(item.payload?.total ?? 0)}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-4">
            {topCategories.map((category, index) => (
              <div key={category.category}>
                <div className="mb-1.5 flex items-center gap-3">
                  <span className="w-4 flex-shrink-0 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: category.color }} />
                  <span className="flex-1 text-sm font-bold text-foreground">{category.category}</span>
                  <span className="text-sm font-black" style={{ fontFamily: MONO, color: category.color }}>
                    {category.percent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)", marginLeft: "2rem" }}>
                  <div style={{ width: `${category.percent}%`, background: category.color, height: "100%" }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO, marginLeft: "2rem" }}>
                  {formatCurrency(category.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1699112204356-532841a77e07?w=1600&h=900&fit=crop&auto=format"
          alt="Manifestação"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ filter: "grayscale(60%) brightness(0.35)", opacity: 0.6 }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(10,10,10,0.82)" }} />
        <Section n="04" tag="INFLUÊNCIA" title="Top 5 partidos mais influentes" sub="RANKING POR CADEIRAS, LIDERANÇAS DE COMISSÃO E PODER DE ARTICULAÇÃO">
          <div className="flex flex-col gap-4">
            {topInfluenceGroups.map((group, index) => (
              <div key={group.name} className="border border-border p-6 transition-colors hover:border-primary" style={{ background: "#111111", borderLeft: `3px solid ${group.color}` }}>
                <div className="grid items-center gap-6 md:grid-cols-3">
                  <div className="flex items-center gap-4">
                    <span className="flex-shrink-0 text-5xl font-black" style={{ fontFamily: SERIF, color: `${group.color}35` }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="mb-1 text-2xl font-black leading-none" style={{ fontFamily: SERIF, color: group.color }}>
                        {group.name}
                      </p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        {group.full}
                      </p>
                      <span className="mt-1.5 inline-block px-2 py-0.5 text-xs text-primary-foreground" style={{ background: group.color, fontFamily: MONO }}>
                        {group.seats} cadeiras
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        ÍNDICE DE INFLUÊNCIA
                      </p>
                      <span className="text-2xl font-black" style={{ fontFamily: SERIF, color: group.color }}>
                        {group.score}
                        <span className="text-sm">/100</span>
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                      <div style={{ width: `${group.score}%`, background: group.color, height: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      DESTAQUE
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">{group.detail}</p>
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
