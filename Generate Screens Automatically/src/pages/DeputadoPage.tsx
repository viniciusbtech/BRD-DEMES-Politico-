import { useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { img, fmt, DEPUTIES, type Deputy } from "../data";

const years = [2023, 2024, 2025, 2026] as const;

export default function DeputadoPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Deputy | null>(null);
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [activeSection, setActiveSection] = useState(0);
  const [themeQuery, setThemeQuery] = useState("");

  const filtered = DEPUTIES.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()) ||
    d.party.toLowerCase().includes(query.toLowerCase()) ||
    d.state.toLowerCase().includes(query.toLowerCase())
  );

  const spendingData = selected
    ? yearFilter === "all"
      ? years.map((y) => ({ year: String(y), value: selected.spending[y] }))
      : [{ year: String(yearFilter), value: selected.spending[yearFilter as keyof typeof selected.spending] }]
    : [];

  const totalSpent = selected
    ? yearFilter === "all"
      ? Object.values(selected.spending).reduce((a, b) => a + b, 0)
      : selected.spending[yearFilter as keyof typeof selected.spending]
    : 0;

  const sections = [
    { id: "gastos",   label: "Gastos" },
    { id: "despesas", label: "Como Gasta" },
    { id: "eixos",    label: "Eixos de Atuação" },
    { id: "votos",    label: "Padrão de Votos" },
    { id: "custo",    label: "Custo-Benefício" },
  ];

  const scrollTo = (id: string, i: number) => {
    setActiveSection(i);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pick = (d: Deputy) => {
    setSelected(d);
    setQuery(d.name);
    setYearFilter("all");
    setActiveSection(0);
    setThemeQuery("");
  };

  const filteredVoting = selected
    ? selected.voting.filter((v) => v.theme.toLowerCase().includes(themeQuery.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-14 h-14 border-b border-border"
        style={{ background: "rgba(10,10,10,0.95)", backdropFilter: "blur(14px)" }}>
        <button onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.2em" }}>
          ← INÍCIO
        </button>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/home")}>
          <span className="w-1.5 h-5 bg-primary" />
          <span className="text-sm font-black"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
            QUEM<span className="text-primary">GOVERNA</span>
          </span>
        </div>
        <span className="text-xs text-muted-foreground hidden md:block"
          style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>
          PERFIL DO DEPUTADO
        </span>
      </nav>

      {/* SEARCH HEADER */}
      <div className="relative overflow-hidden border-b border-border">
        {/* background strip of politician photos */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          {["photo-1519085360753-af0119f7cbe7","photo-1648448942225-7aa06c7e8f79","photo-1531630142108-cb432ed39657","photo-1740906010746-72aa48cea181"].map((id) => (
            <div key={id} className="relative overflow-hidden">
              <img src={`https://images.unsplash.com/${id}?w=400&h=400&fit=crop&auto=format`}
                alt="" className="w-full h-full object-cover object-top"
                style={{ filter: "grayscale(55%) contrast(1.1) brightness(0.38)" }} />
            </div>
          ))}
        </div>
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(10,10,10,0.95) 45%, rgba(10,10,10,0.55) 100%)" }} />
        <div className="absolute bottom-0 inset-x-0 h-16"
          style={{ background: "linear-gradient(to top, #0a0a0a, transparent)" }} />

        <div className="relative z-10 px-6 md:px-14 pt-16 pb-10">
          <p className="text-xs tracking-[0.35em] text-primary mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            02 — PESQUISE UM DEPUTADO FEDERAL
          </p>
          <h1 className="text-4xl md:text-6xl font-black mb-8"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
            {selected ? selected.name : "Quem você quer analisar?"}
          </h1>

        {/* search */}
        <div className="relative max-w-xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>⌕</span>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Nome, partido ou estado..."
            className="w-full pl-10 pr-4 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* dropdown */}
        {query && !selected && (
          <div className="max-w-xl mt-1 border border-border" style={{ background: "#141414" }}>
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>NENHUM RESULTADO</p>
            ) : filtered.map((d) => (
              <button key={d.id} onClick={() => pick(d)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
                <div className="w-10 h-10 overflow-hidden flex-shrink-0 bg-card">
                  <img src={img(d.img, 80, 80)} alt={d.name}
                    className="w-full h-full object-cover" style={{ filter: "grayscale(40%)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate"
                    style={{ fontFamily: "'Playfair Display', serif" }}>{d.name}</p>
                  <p className="text-xs text-muted-foreground"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.party} · {d.state}</p>
                </div>
                <span className="text-xs text-primary"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>VER →</span>
              </button>
            ))}
          </div>
        )}
        </div>{/* end z-10 content */}
      </div>{/* end header wrapper */}

      {/* DEPUTY CONTENT */}
      {selected ? (
        <div>
          {/* Profile banner */}
          <div className="relative border-y border-border overflow-hidden" style={{ minHeight: 360 }}>
            <img src={img(selected.img, 1600, 720)} alt={selected.name}
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ filter: "grayscale(55%) brightness(0.35)" }} />
            <div className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(10,10,10,0.2), rgba(10,10,10,0.92) 80%)" }} />
            <div className="relative z-10 flex flex-col items-center justify-center py-12 px-6 text-center" style={{ minHeight: 360 }}>
              <div className="w-36 h-44 overflow-hidden border-2 border-primary mb-5 flex-shrink-0 bg-card"
                style={{ boxShadow: "0 0 40px rgba(196,18,48,0.25)" }}>
                <img src={img(selected.img, 288, 352)} alt={selected.name}
                  className="w-full h-full object-cover object-top" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selected.party}</span>
                <span className="text-xs text-muted-foreground"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selected.state}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}>{selected.name}</h2>
              <p className="text-xs text-muted-foreground"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selected.mandate}</p>
            </div>
          </div>

          {/* Section tabs */}
          <div className="sticky top-14 z-40 border-b border-border overflow-x-auto"
            style={{ background: "rgba(10,10,10,0.96)", backdropFilter: "blur(10px)" }}>
            <div className="flex px-6 md:px-14">
              {sections.map((s, i) => (
                <button key={s.id} onClick={() => scrollTo(s.id, i)}
                  className={`px-5 py-4 text-xs tracking-widest whitespace-nowrap border-b-2 transition-colors ${activeSection === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {s.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* ── GASTOS ── */}
          <section id="sec-gastos" className="px-6 md:px-14 py-16 border-b border-border">
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-10">
              <div>
                <p className="text-xs tracking-[0.35em] text-primary mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>GASTOS COM COTA PARLAMENTAR</p>
                <h3 className="text-3xl font-black"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>Quanto ele gastou?</h3>
              </div>
              <div className="flex gap-1">
                {(["all", ...years] as const).map((y) => (
                  <button key={y} onClick={() => setYearFilter(y)}
                    className={`px-3 py-1.5 text-xs transition-colors ${yearFilter === y ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {y === "all" ? "TODOS" : y}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-px border border-border mb-10"
              style={{ background: "rgba(240,236,228,0.07)" }}>
              <div className="bg-background px-8 py-7 md:col-span-1">
                <p className="text-xs tracking-widest text-muted-foreground mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {yearFilter === "all" ? "TOTAL ACUMULADO" : `TOTAL ${yearFilter}`}
                </p>
                <p className="text-4xl font-black text-primary"
                  style={{ fontFamily: "'Playfair Display', serif" }}>{fmt(totalSpent)}</p>
              </div>
              {yearFilter === "all" && years.map((y) => (
                <div key={y} className="bg-background px-6 py-7">
                  <p className="text-xs tracking-widest text-muted-foreground mb-2"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>{y}</p>
                  <p className="text-2xl font-black text-foreground"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {fmt(selected.spending[y])}
                  </p>
                </div>
              ))}
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="year" tick={{ fill: "#888880", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#888880", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                    labelStyle={{ color: "#f0ece4" }} formatter={(v: number) => [fmt(v), "Gastos"]} />
                  <Bar dataKey="value" fill="#c41230" radius={[2, 2, 0, 0]} maxBarSize={80} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── COMO GASTA ── */}
          <section id="sec-despesas" className="px-6 md:px-14 py-16 border-b border-border">
            <p className="text-xs tracking-[0.35em] text-primary mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>DISTRIBUIÇÃO DE DESPESAS</p>
            <h3 className="text-3xl font-black mb-10"
              style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>Como ele gasta o dinheiro?</h3>

            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={selected.categories} dataKey="value" cx="50%" cy="50%"
                      innerRadius="50%" outerRadius="80%" paddingAngle={2}>
                      {selected.categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                      formatter={(v: number) => [fmt(v), ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3">
                {selected.categories.map((c) => {
                  const total = selected.categories.reduce((a, b) => a + b.value, 0);
                  const pct = Math.round((c.value / total) * 100);
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                          <span className="text-xs text-foreground">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-foreground"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                          <span className="text-xs text-muted-foreground w-28 text-right"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(c.value)}</span>
                        </div>
                      </div>
                      <div className="h-1 overflow-hidden" style={{ background: "rgba(240,236,228,0.08)" }}>
                        <div className="h-full" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── EIXOS ── */}
          <section id="sec-eixos" className="px-6 md:px-14 py-16 border-b border-border">
            <p className="text-xs tracking-[0.35em] text-primary mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>TEMAS LEGISLATIVOS</p>
            <h3 className="text-3xl font-black mb-10"
              style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>Principais eixos de atuação</h3>

            <div className="flex flex-col gap-5 max-w-2xl">
              {selected.axes.map((a, i) => (
                <div key={a.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-base font-bold text-foreground"
                        style={{ fontFamily: "'Playfair Display', serif" }}>{a.label}</span>
                    </div>
                    <span className="text-xl font-black text-primary"
                      style={{ fontFamily: "'Playfair Display', serif" }}>{a.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden" style={{ background: "rgba(240,236,228,0.06)", marginLeft: "1.75rem" }}>
                    <div className="h-full"
                      style={{ width: `${a.pct}%`, background: "linear-gradient(to right, #c41230, rgba(196,18,48,0.5))" }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── VOTOS ── */}
          <section id="sec-votos" className="px-6 md:px-14 py-16 border-b border-border">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
              <div>
                <p className="text-xs tracking-[0.35em] text-primary mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>VOTAÇÕES NOMINAIS</p>
                <h3 className="text-3xl font-black"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>Como ele vota por tema</h3>
              </div>
              <div className="relative w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>⌕</span>
                <input
                  value={themeQuery}
                  onChange={(e) => setThemeQuery(e.target.value)}
                  placeholder="Filtrar por tema..."
                  className="w-full pl-8 pr-3 py-2.5 border border-border bg-card text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                {themeQuery && (
                  <button onClick={() => setThemeQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-px border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
              <div className="grid grid-cols-4 px-6 py-3 bg-background">
                {["TEMA", "A FAVOR", "CONTRA", "AUSENTE"].map((h) => (
                  <span key={h} className="text-xs text-muted-foreground"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>{h}</span>
                ))}
              </div>
              {filteredVoting.length === 0 ? (
                <div className="px-6 py-8 bg-background text-center">
                  <p className="text-xs text-muted-foreground"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    NENHUM TEMA ENCONTRADO PARA "{themeQuery.toUpperCase()}"
                  </p>
                </div>
              ) : filteredVoting.map((v) => (
                <div key={v.theme} className="grid grid-cols-4 px-6 py-4 bg-background hover:bg-card transition-colors items-center">
                  <span className="text-sm font-bold text-foreground"
                    style={{ fontFamily: "'Playfair Display', serif" }}>{v.theme}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: "#4a7c59", fontFamily: "'JetBrains Mono', monospace" }}>{v.favor}%</span>
                    <div className="h-1.5 w-16 overflow-hidden" style={{ background: "rgba(240,236,228,0.08)" }}>
                      <div style={{ width: `${v.favor}%`, background: "#4a7c59", height: "100%" }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: "#c41230", fontFamily: "'JetBrains Mono', monospace" }}>{v.contra}%</span>
                    <div className="h-1.5 w-16 overflow-hidden" style={{ background: "rgba(240,236,228,0.08)" }}>
                      <div style={{ width: `${v.contra}%`, background: "#c41230", height: "100%" }} />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v.ausente}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── CUSTO-BENEFÍCIO ── */}
          <section id="sec-custo" className="px-6 md:px-14 py-16 border-b border-border">
            <p className="text-xs tracking-[0.35em] text-primary mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>EFICIÊNCIA PARLAMENTAR</p>
            <h3 className="text-3xl font-black mb-10"
              style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>Custo-benefício do mandato</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border mb-10"
              style={{ background: "rgba(240,236,228,0.07)" }}>
              {[
                { label: "NOTA GERAL",   val: `${selected.cb.score}/10`, color: selected.cb.score >= 7 ? "#4a7c59" : selected.cb.score >= 5 ? "#d4841a" : "#c41230" },
                { label: "PRESENÇA",     val: `${selected.cb.presenca}%`, color: "#f0ece4" },
                { label: "PROPOSIÇÕES",  val: selected.cb.proposicoes,    color: "#f0ece4" },
                { label: "APROVADAS",    val: selected.cb.aprovadas,      color: "#f0ece4" },
              ].map((m) => (
                <div key={m.label} className="bg-background px-6 py-7">
                  <p className="text-xs tracking-widest text-muted-foreground mb-2"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.label}</p>
                  <p className="text-3xl font-black"
                    style={{ fontFamily: "'Playfair Display', serif", color: m.color }}>{m.val}</p>
                </div>
              ))}
            </div>

            <div className="max-w-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>0</span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>NOTA: {selected.cb.score}/10</span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>10</span>
              </div>
              <div className="h-3 relative overflow-hidden" style={{ background: "rgba(240,236,228,0.08)" }}>
                <div className="h-full absolute left-0 top-0" style={{
                  width: `${selected.cb.score * 10}%`,
                  background: selected.cb.score >= 7
                    ? "linear-gradient(to right, #c41230, #4a7c59)"
                    : selected.cb.score >= 5
                      ? "linear-gradient(to right, #c41230, #d4841a)"
                      : "#c41230",
                }} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Custo total do mandato até agora:{" "}
                <span className="text-foreground font-bold">{fmt(selected.cb.total)}</span>.
                Taxa de aprovação de proposições:{" "}
                <span className="text-foreground font-bold">
                  {Math.round((selected.cb.aprovadas / selected.cb.proposicoes) * 100)}%
                </span>.
              </p>
            </div>
          </section>
        </div>
      ) : (
        /* Empty state — suggestion cards */
        <div className="px-6 md:px-14 pb-24">
          <p className="text-xs text-muted-foreground mb-6"
            style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>SUGESTÕES</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DEPUTIES.map((d) => (
              <button key={d.id} onClick={() => pick(d)}
                className="group relative overflow-hidden text-left border border-border hover:border-primary transition-colors"
                style={{ height: 180, background: "#141414" }}>
                <img src={img(d.img, 400, 360)} alt={d.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                  style={{ filter: "grayscale(50%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.95) 40%, transparent)" }} />
                <div className="absolute bottom-0 p-4">
                  <span className="block text-xs text-primary mb-0.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.party} · {d.state}</span>
                  <span className="block text-sm font-bold text-foreground leading-snug"
                    style={{ fontFamily: "'Playfair Display', serif" }}>{d.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
