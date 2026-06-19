import { useState } from "react";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import { DEPUTIES, PARTIES, img } from "../data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

/* ── Education levels ─────────────────────────────── */
const EDU_LEVELS = [
  { key: "medio",    label: "Ensino Médio",          color: "#555"    },
  { key: "supinc",   label: "Superior Incompleto",   color: "#888880" },
  { key: "sup",      label: "Superior Completo",     color: "#2e5fa3" },
  { key: "pos",      label: "Pós-Graduação",         color: "#4a7c59" },
  { key: "mestrado", label: "Mestrado",              color: "#d4841a" },
  { key: "dout",     label: "Doutorado",             color: "#c41230" },
];

/* ── Deputies with education ──────────────────────── */
const DEP_EDU: Record<number, { level: string; course: string; institution: string }> = {
  1: { level: "Superior Completo", course: "Direito",           institution: "USP" },
  2: { level: "Pós-Graduação",     course: "Economia",          institution: "PUC-MG" },
  3: { level: "Mestrado",          course: "Ciências Sociais",  institution: "UFBA" },
  4: { level: "Superior Completo", course: "Administração",     institution: "UERJ" },
};

/* ── Full deputy list with education for search ────── */
const ALL_DEPUTIES = [
  { id: 1,  name: "Roberto Alves Silva",   party: "PT",    state: "SP", img: "photo-1519085360753-af0119f7cbe7", edu: "Superior Completo",   course: "Direito",             institution: "USP"          },
  { id: 2,  name: "André Lima Fonseca",    party: "PSDB",  state: "MG", img: "photo-1585846416120-3a7354ed7d39", edu: "Pós-Graduação",       course: "Economia",            institution: "PUC-MG"       },
  { id: 3,  name: "Carlos Eduardo Farias", party: "MDB",   state: "BA", img: "photo-1648448942225-7aa06c7e8f79", edu: "Mestrado",            course: "Ciências Sociais",    institution: "UFBA"         },
  { id: 4,  name: "Paulo Henrique Mota",   party: "PL",    state: "RJ", img: "photo-1531630142108-cb432ed39657", edu: "Superior Completo",   course: "Administração",       institution: "UERJ"         },
  { id: 5,  name: "Marcos José Ribeiro",   party: "MDB",   state: "CE", img: "photo-1740906010746-72aa48cea181", edu: "Ensino Médio",        course: "—",                   institution: "—"            },
  { id: 6,  name: "Eduardo Braga",         party: "PDT",   state: "AM", img: "photo-1659444003277-6cb0a5ffc8bd", edu: "Doutorado",           course: "Engenharia Elétrica", institution: "UNICAMP"      },
  { id: 7,  name: "Sérgio Dias Alves",     party: "PP",    state: "RS", img: "photo-1750741268857-7e44510f867d", edu: "Pós-Graduação",       course: "Gestão Pública",      institution: "FGV"          },
  { id: 8,  name: "Fernanda Costa Lopes",  party: "PL",    state: "GO", img: "photo-1519085360753-af0119f7cbe7", edu: "Superior Completo",   course: "Medicina",            institution: "UFG"          },
  { id: 9,  name: "Jorge Antônio Pereira", party: "PT",    state: "MG", img: "photo-1585846416120-3a7354ed7d39", edu: "Mestrado",            course: "Educação",            institution: "UFMG"         },
  { id: 10, name: "Luciana Ferreira Costa",party: "PSDB",  state: "PR", img: "photo-1648448942225-7aa06c7e8f79", edu: "Doutorado",           course: "Direito Constitucional","institution": "UFPR"      },
  { id: 11, name: "Carla Braga Santos",    party: "UNIAO", state: "BA", img: "photo-1531630142108-cb432ed39657", edu: "Superior Incompleto", course: "Pedagogia",           institution: "UNEB"         },
  { id: 12, name: "Renato Cardoso Lima",   party: "MDB",   state: "MT", img: "photo-1740906010746-72aa48cea181", edu: "Superior Completo",   course: "Agronomia",           institution: "UFMT"         },
];

/* ── Overall distribution ─────────────────────────── */
const TOTAL_EDU = [
  { level: "Ensino Médio",        n: 57,  pct: 11, color: "#555"    },
  { level: "Superior Incompleto", n: 39,  pct: 8,  color: "#888880" },
  { level: "Superior Completo",   n: 236, pct: 46, color: "#2e5fa3" },
  { level: "Pós-Graduação",       n: 97,  pct: 19, color: "#4a7c59" },
  { level: "Mestrado",            n: 52,  pct: 10, color: "#d4841a" },
  { level: "Doutorado",           n: 32,  pct: 6,  color: "#c41230" },
];

/* ── Party × education breakdown ─────────────────── */
const PARTY_EDU: Record<string, number[]> = {
  PT:    [4,  5,  28, 15, 10, 6],
  PL:    [22, 12, 38, 16, 8,  3],
  UNIAO: [10, 8,  25, 10, 4,  2],
  MDB:   [6,  5,  20, 7,  3,  1],
  PSDB:  [1,  0,  5,  4,  2,  1],
  PP:    [12, 7,  18, 7,  2,  1],
  PDT:   [2,  2,  7,  4,  1,  1],
};

const EDU_COLORS = EDU_LEVELS.map((e) => e.color);
const EDU_SHORT  = ["Méd.", "Sup.Inc.", "Superior", "Pós-Grad.", "Mestrado", "Doutorado"];

const levelColor = (level: string) =>
  EDU_LEVELS.find((e) => e.label === level)?.color ?? "#888";

export default function EscolaridadePage() {
  const [depQuery, setDepQuery]   = useState("");
  const [selectedDep, setSelectedDep] = useState<typeof ALL_DEPUTIES[0] | null>(null);
  const [depDropOpen, setDepDropOpen] = useState(false);

  const [partyQuery, setPartyQuery]     = useState("");
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [partyDropOpen, setPartyDropOpen] = useState(false);

  const filteredDeps = ALL_DEPUTIES.filter((d) =>
    d.name.toLowerCase().includes(depQuery.toLowerCase()) ||
    d.party.toLowerCase().includes(depQuery.toLowerCase()) ||
    d.edu.toLowerCase().includes(depQuery.toLowerCase())
  );

  const filteredParties = PARTIES.filter((p) =>
    p.name.toLowerCase().includes(partyQuery.toLowerCase()) ||
    p.full.toLowerCase().includes(partyQuery.toLowerCase())
  );

  const partyEduData = selectedParty ? PARTY_EDU[selectedParty] ?? [] : null;
  const partyEduChartData = partyEduData
    ? EDU_SHORT.map((label, i) => ({ label, value: partyEduData[i] ?? 0, color: EDU_COLORS[i] }))
    : [];
  const partyTotal = partyEduData ? partyEduData.reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar />

      {/* Header */}
      <PageHero
        n="8" tag="EDUCAÇÃO"
        title="Deputados" titleRed="e Escolaridade"
        desc="Quem representa o Brasil tem formação? Explore o nível de escolaridade dos 513 deputados federais por indivíduo e por partido."
        imgId="photo-1633734973050-d6499a977c17"
        stripImgs={[
          { id: "photo-1590012314607-cda9d9b699ae", alt: "Capelo de formatura" },
          { id: "photo-1523580846011-d3a5bc25702b", alt: "Formanda" },
          { id: "photo-1551135049-8a33b5883817", alt: "Reunião profissional" },
        ]}
      />

      {/* ── Panorama geral ── */}
      <section className="px-6 md:px-14 py-16 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>PANORAMA</p>
        <h2 className="text-3xl font-black mb-10"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Escolaridade dos 513 deputados
        </h2>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* donut */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={TOTAL_EDU} dataKey="pct" cx="50%" cy="50%"
                  innerRadius="48%" outerRadius="76%" paddingAngle={2}
                  label={({ name, pct }) => `${pct}%`} labelLine={false}>
                  {TOTAL_EDU.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                  formatter={(v: number, _: unknown, p: { payload?: { n?: number } }) =>
                    [`${v}% · ${p.payload?.n} deputados`, ""]
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* breakdown */}
          <div className="flex flex-col gap-4">
            {TOTAL_EDU.map((d) => (
              <div key={d.level}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{d.level}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black" style={{ fontFamily: MONO, color: d.color }}>{d.pct}%</span>
                    <span className="text-xs text-muted-foreground w-16 text-right" style={{ fontFamily: MONO }}>
                      {d.n} dep.
                    </span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden" style={{ background: "rgba(240,236,228,0.06)" }}>
                  <div style={{ width: `${d.pct}%`, background: d.color, height: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border mt-10"
          style={{ background: "rgba(240,236,228,0.07)" }}>
          {[
            { label: "COM SUPERIOR OU MAIS", val: "81%", note: "416 deputados" },
            { label: "COM MESTRADO OU MAIS",  val: "16%", note: "84 deputados"  },
            { label: "SEM DIPLOMA SUPERIOR",  val: "19%", note: "97 deputados"  },
            { label: "CURSO MAIS COMUM",      val: "Direito", note: "34% dos formados" },
          ].map((s) => (
            <div key={s.label} className="bg-background px-6 py-7">
              <p className="text-xs tracking-widest text-muted-foreground mb-2" style={{ fontFamily: MONO }}>{s.label}</p>
              <p className="text-2xl font-black text-primary mb-0.5" style={{ fontFamily: SERIF }}>{s.val}</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Seção 1 — Deputados ── */}
      <section className="px-6 md:px-14 py-16 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>DEPUTADOS</p>
        <h2 className="text-3xl font-black mb-3"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Escolaridade por deputado
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-lg">
          Busque um deputado pelo nome, partido ou nível de escolaridade.
        </p>

        {/* Deputy search */}
        <div className="relative max-w-xl mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
            style={{ fontFamily: MONO }}>⌕</span>
          <input value={depQuery}
            onChange={(e) => { setDepQuery(e.target.value); setSelectedDep(null); setDepDropOpen(true); }}
            onFocus={() => setDepDropOpen(true)}
            placeholder="Nome, partido ou nível (ex: Doutorado)..."
            className="w-full pl-10 pr-10 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {depQuery && (
            <button onClick={() => { setDepQuery(""); setSelectedDep(null); setDepDropOpen(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
          )}
          {depDropOpen && (
            <div className="absolute top-full left-0 right-0 border border-border z-20 max-h-64 overflow-y-auto"
              style={{ background: "#141414" }}>
              {(depQuery ? filteredDeps : ALL_DEPUTIES).map((d) => (
                <button key={d.id}
                  onClick={() => { setSelectedDep(d); setDepQuery(d.name); setDepDropOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
                  <div className="w-9 h-9 overflow-hidden flex-shrink-0">
                    <img src={`https://images.unsplash.com/${d.img}?w=72&h=72&fit=crop&auto=format`}
                      alt={d.name} className="w-full h-full object-cover" style={{ filter: "grayscale(40%)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>{d.name}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {d.party} · {d.state} · <span style={{ color: levelColor(d.edu) }}>{d.edu}</span>
                    </p>
                  </div>
                </button>
              ))}
              {depQuery && filteredDeps.length === 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  NENHUM RESULTADO
                </p>
              )}
            </div>
          )}
        </div>

        {/* Selected deputy card */}
        {selectedDep && (
          <div className="relative border border-border overflow-hidden mb-8"
            style={{ background: "#111" }}>
            <div className="grid md:grid-cols-3">
              {/* photo */}
              <div className="relative overflow-hidden" style={{ minHeight: 240 }}>
                <img src={`https://images.unsplash.com/${selectedDep.img}?w=600&h=480&fit=crop&auto=format`}
                  alt={selectedDep.name}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  style={{ filter: "grayscale(30%) contrast(1.05)" }} />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to right, rgba(17,17,17,0) 60%, rgba(17,17,17,0.9) 100%)" }} />
              </div>
              {/* info */}
              <div className="md:col-span-2 px-8 py-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground"
                    style={{ fontFamily: MONO }}>{selectedDep.party}</span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{selectedDep.state}</span>
                </div>
                <h3 className="text-3xl font-black text-foreground mb-6"
                  style={{ fontFamily: SERIF }}>{selectedDep.name}</h3>

                <div className="grid grid-cols-3 gap-px border border-border"
                  style={{ background: "rgba(240,236,228,0.07)" }}>
                  {[
                    { label: "ESCOLARIDADE",  val: selectedDep.edu,         color: levelColor(selectedDep.edu) },
                    { label: "FORMAÇÃO",      val: selectedDep.course,      color: "#f0ece4" },
                    { label: "INSTITUIÇÃO",   val: selectedDep.institution, color: "#f0ece4" },
                  ].map((m) => (
                    <div key={m.label} className="bg-background px-4 py-5">
                      <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: MONO }}>{m.label}</p>
                      <p className="text-base font-black leading-tight"
                        style={{ fontFamily: SERIF, color: m.color }}>{m.val}</p>
                    </div>
                  ))}
                </div>

                {/* level badge */}
                <div className="mt-6 inline-flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: levelColor(selectedDep.edu) }} />
                  <span className="text-sm font-bold" style={{ color: levelColor(selectedDep.edu), fontFamily: SERIF }}>
                    {selectedDep.edu}
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    — {TOTAL_EDU.find((t) => t.level === selectedDep.edu)?.pct ?? "—"}% dos deputados têm este nível
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full list table */}
        <div className="flex flex-col gap-px border border-border"
          style={{ background: "rgba(240,236,228,0.06)" }}>
          <div className="grid grid-cols-5 px-6 py-3 bg-background gap-4">
            {["DEPUTADO", "PARTIDO · UF", "ESCOLARIDADE", "FORMAÇÃO", "INSTITUIÇÃO"].map((h) => (
              <span key={h} className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{h}</span>
            ))}
          </div>
          {(depQuery ? filteredDeps : ALL_DEPUTIES).map((d) => (
            <div key={d.id}
              onClick={() => { setSelectedDep(d); setDepQuery(d.name); setDepDropOpen(false); }}
              className="grid grid-cols-5 px-6 py-3.5 bg-background hover:bg-card transition-colors items-center gap-4 cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 overflow-hidden flex-shrink-0">
                  <img src={`https://images.unsplash.com/${d.img}?w=64&h=64&fit=crop&auto=format`}
                    alt={d.name} className="w-full h-full object-cover" style={{ filter: "grayscale(40%)" }} />
                </div>
                <span className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>
                  {d.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {d.party} · {d.state}
              </span>
              <span className="text-xs font-bold" style={{ fontFamily: MONO, color: levelColor(d.edu) }}>
                {d.edu}
              </span>
              <span className="text-xs text-muted-foreground truncate">{d.course}</span>
              <span className="text-xs text-muted-foreground">{d.institution}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Seção 2 — Partidos ── */}
      <section className="px-6 md:px-14 py-16">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>PARTIDOS</p>
        <h2 className="text-3xl font-black mb-3"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Escolaridade por partido
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-lg">
          Selecione um partido para ver a distribuição do nível educacional dos seus deputados.
        </p>

        {/* Party search */}
        <div className="relative max-w-xl mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
            style={{ fontFamily: MONO }}>⌕</span>
          <input value={partyQuery}
            onChange={(e) => { setPartyQuery(e.target.value); setSelectedParty(null); setPartyDropOpen(true); }}
            onFocus={() => setPartyDropOpen(true)}
            placeholder="Sigla ou nome do partido..."
            className="w-full pl-10 pr-10 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {partyQuery && (
            <button onClick={() => { setPartyQuery(""); setSelectedParty(null); setPartyDropOpen(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
          )}
          {partyDropOpen && (
            <div className="absolute top-full left-0 right-0 border border-border z-20"
              style={{ background: "#141414" }}>
              {(partyQuery ? filteredParties : PARTIES).map((p) => (
                <button key={p.id}
                  onClick={() => { setSelectedParty(p.id); setPartyQuery(p.full); setPartyDropOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
                  <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-xs font-black"
                    style={{ background: p.color, fontFamily: SERIF, color: "#f0ece4" }}>{p.name}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>{p.full}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {p.seats} deputados
                    </p>
                  </div>
                </button>
              ))}
              {partyQuery && filteredParties.length === 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>NENHUM RESULTADO</p>
              )}
            </div>
          )}
        </div>

        {/* Party education detail */}
        {selectedParty && partyEduData && (
          <div className="mb-10">
            {(() => {
              const party = PARTIES.find((p) => p.id === selectedParty)!;
              return (
                <div className="flex items-center gap-4 mb-8 border-l-4 pl-5"
                  style={{ borderColor: party.color }}>
                  <span className="w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl font-black"
                    style={{ background: party.color, fontFamily: SERIF, color: "#f0ece4" }}>
                    {party.name}
                  </span>
                  <div>
                    <p className="text-2xl font-black text-foreground" style={{ fontFamily: SERIF }}>{party.full}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {partyTotal} deputados com dados de escolaridade
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="grid md:grid-cols-2 gap-10 items-start">
              {/* bar chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={partyEduChartData}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: "#888880", fontSize: 9, fontFamily: MONO }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                      axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                      formatter={(v: number) => [`${v} deputados`, ""]} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={48}>
                      {partyEduChartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* breakdown */}
              <div className="flex flex-col gap-3">
                {partyEduChartData.map((d) => {
                  const pct = partyTotal > 0 ? Math.round((d.value / partyTotal) * 100) : 0;
                  return (
                    <div key={d.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                          <span className="text-xs text-foreground">{EDU_LEVELS.find((e) => e.key === d.label.toLowerCase().replace(/[\s.-]/g,""))?.label ?? d.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold" style={{ fontFamily: MONO, color: d.color }}>{pct}%</span>
                          <span className="text-xs text-muted-foreground w-12 text-right" style={{ fontFamily: MONO }}>
                            {d.value} dep.
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                        <div style={{ width: `${pct}%`, background: d.color, height: "100%" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Comparative table — all parties */}
        <div>
          <p className="text-xs text-muted-foreground mb-6" style={{ fontFamily: MONO }}>
            TABELA COMPARATIVA — TODOS OS PARTIDOS
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>PARTIDO</th>
                  {EDU_LEVELS.map((e) => (
                    <th key={e.key} className="text-right px-3 py-3 text-xs whitespace-nowrap"
                      style={{ fontFamily: MONO, color: e.color }}>{e.label.split(" ")[0]}</th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {PARTIES.map((p) => {
                  const edu = PARTY_EDU[p.id] ?? [0, 0, 0, 0, 0, 0];
                  const total = edu.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={p.id}
                      className="border-b border-border hover:bg-card transition-colors cursor-pointer"
                      onClick={() => { setSelectedParty(p.id); setPartyQuery(p.full); setPartyDropOpen(false); }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                          <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{p.name}</span>
                        </div>
                      </td>
                      {edu.map((v, i) => (
                        <td key={i} className="text-right px-3 py-3 text-sm"
                          style={{ fontFamily: MONO, color: v > 0 ? EDU_COLORS[i] : "#333" }}>
                          {v > 0 ? v : "—"}
                        </td>
                      ))}
                      <td className="text-right px-4 py-3 text-sm font-bold text-foreground"
                        style={{ fontFamily: MONO }}>{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
