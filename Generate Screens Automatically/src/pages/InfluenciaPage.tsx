import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

/* ── Q8 — Grupos e suas conexões ─────────────────── */
const GROUPS = [
  {
    name: "Bancada Ruralista",
    members: 297,
    score: 94,
    color: "#c41230",
    parties: ["PL", "UNIÃO", "PP", "MDB"],
    themes: ["Agronegócio", "Fundiário", "Crédito Rural", "Ambiental"],
    connects: ["Bancada da Segurança", "Bancada do Hidro"],
    opposes: ["Bancada da Educação", "Bancada Progressista"],
    description:
      "A maior bancada temática da Câmara. Bloqueia legislação ambiental e pauta crédito rural. Articula-se transversalmente em todos os partidos de centro-direita.",
  },
  {
    name: "Bancada da Segurança",
    members: 184,
    score: 81,
    color: "#d4841a",
    parties: ["PL", "PP", "UNIÃO"],
    themes: ["Segurança Pública", "Armamento", "Penal", "Policial"],
    connects: ["Bancada Ruralista", "Bancada da Bíblia"],
    opposes: ["Bancada de Direitos Humanos"],
    description:
      "Pauta endurecimento penal, porte de armas e militarização da segurança. Tem forte presença em estados com altos índices de violência.",
  },
  {
    name: "Bancada da Bíblia",
    members: 203,
    score: 78,
    color: "#4a7c59",
    parties: ["PL", "UNIÃO", "PSDB", "PT"],
    themes: ["Família", "Religião", "Moral", "Educação"],
    connects: ["Bancada da Segurança", "Bancada Ruralista"],
    opposes: ["Bancada LGBTQIA+", "Bancada Progressista"],
    description:
      "Transversal a todos os partidos. Define pauta de costumes: aborto, casamento civil, educação religiosa nas escolas e isenções fiscais para entidades.",
  },
  {
    name: "Bancada da Saúde",
    members: 89,
    score: 62,
    color: "#2e5fa3",
    parties: ["PT", "MDB", "PDT"],
    themes: ["SUS", "Medicamentos", "Planos de Saúde", "Profissões"],
    connects: ["Bancada da Educação"],
    opposes: ["Bancada Ruralista"],
    description:
      "Defende o SUS e regulação de planos privados. Tem força moderada mas articula-se com bancadas de esquerda e centro na aprovação de financiamento público.",
  },
  {
    name: "Bancada da Educação",
    members: 74,
    score: 55,
    color: "#7b3fa0",
    parties: ["PT", "PDT", "PSDB"],
    themes: ["Universidades", "Ensino Básico", "FIES", "Professores"],
    connects: ["Bancada da Saúde"],
    opposes: ["Bancada Ruralista", "Bancada da Bíblia"],
    description:
      "Defende autonomia universitária, piso salarial de professores e financiamento público do ensino. Menor bancada do ranking, mas com alta coesão interna.",
  },
];

/* ── Q10 — Partidos mais influentes ──────────────── */
const PARTY_INFLUENCE = [
  { party: "PL",    seats: 99,  score: 94, color: "#1a3a7c", full: "Partido Liberal",                      detail: "Maior bancada. Preside comissões estratégicas e dita pauta de segurança e economia." },
  { party: "UNIÃO", seats: 59,  score: 80, color: "#d4841a", full: "União Brasil",                          detail: "2ª maior bancada. Forte em comunicação, agronegócio e cargos no primeiro escalão." },
  { party: "PT",    seats: 68,  score: 76, color: "#c41230", full: "Partido dos Trabalhadores",             detail: "Base governista. Controla ministérios sociais e pauta redistribuição de renda." },
  { party: "PP",    seats: 47,  score: 67, color: "#2e5fa3", full: "Progressistas",                        detail: "Aliado histórico de obras e infraestrutura. Articula emendas com municípios pequenos." },
  { party: "MDB",   seats: 42,  score: 60, color: "#4a7c59", full: "Movimento Democrático Brasileiro",     detail: "Centrão clássico. Presente em todos os governos, negocia cargos e recursos." },
  { party: "REPO",  seats: 40,  score: 54, color: "#7b3fa0", full: "Republicanos",                        detail: "Forte na bancada evangélica. Acesso a ministérios e cargos de segundo escalão." },
  { party: "PDT",   seats: 17,  score: 42, color: "#c8970a", full: "Partido Democrático Trabalhista",     detail: "Influência desproporcional ao tamanho. Articula pautas trabalhistas e de esquerda." },
];

const RADAR_DATA = [
  { axis: "Legislativo", PL: 92, PT: 78, MDB: 68 },
  { axis: "Executivo",   PL: 74, PT: 88, MDB: 62 },
  { axis: "Judiciário",  PL: 62, PT: 72, MDB: 74 },
  { axis: "Imprensa",    PL: 68, PT: 82, MDB: 70 },
  { axis: "Mercado",     PL: 88, PT: 52, MDB: 76 },
  { axis: "Social",      PL: 56, PT: 94, MDB: 64 },
];

/* ── Connection map visual ───────────────────────── */
function ConnectionLine({ from, to, type }: { from: string; to: string; type: "ally" | "oppose" }) {
  return (
    <div className="flex items-center gap-2 text-xs" style={{ fontFamily: MONO }}>
      <span className="text-muted-foreground truncate max-w-[120px]">{from}</span>
      <span style={{ color: type === "ally" ? "#4a7c59" : "#c41230", flexShrink: 0 }}>
        {type === "ally" ? "↔" : "✕"}
      </span>
      <span className="text-muted-foreground truncate max-w-[120px]">{to}</span>
    </div>
  );
}

export default function InfluenciaPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar />

      <PageHero
        n="6" tag="REDES"
        title="Influência" titleRed="+ Grupos e Partidos"
        desc="Como as bancadas parlamentares se conectam, se opõem e articulam votos — e quais partidos exercem o maior poder de influência real na Câmara."
        imgId="photo-1561489396-888724a1543d"
        stripImgs={[
          { id: "photo-1699112204356-532841a77e07", alt: "Manifestação com bandeiras" },
          { id: "photo-1551135049-8a33b5883817", alt: "Negociação política" },
          { id: "photo-1758518730178-6e237bc8b87d", alt: "Mesa de negociação" },
        ]}
      />

      {/* ══ Q8 — Como os grupos se influenciam ══ */}
      <section className="px-6 md:px-14 py-16 border-b border-border">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>Q8</span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>BANCADAS</p>
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-3"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Como os grupos se influenciam?
        </h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-xl">
          Cada bancada temática articula aliados, bloqueia adversários e atravessa legendas
          partidárias. O mapa abaixo mostra conexões e oposições entre os principais grupos.
        </p>

        <div className="flex flex-col gap-6">
          {GROUPS.map((g, i) => (
            <div key={g.name}
              className="border border-border transition-colors hover:border-primary"
              style={{ background: "#111", borderLeft: `3px solid ${g.color}` }}>

              {/* top bar */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-start gap-5">
                  <span className="text-5xl font-black flex-shrink-0"
                    style={{ fontFamily: SERIF, color: `${g.color}30` }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-foreground mb-1"
                      style={{ fontFamily: SERIF }}>{g.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                      {g.description}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right ml-6">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: MONO }}>INFLUÊNCIA</p>
                  <p className="text-3xl font-black"
                    style={{ fontFamily: SERIF, color: g.color }}>{g.score}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{g.members} membros</p>
                </div>
              </div>

              {/* detail grid */}
              <div className="grid md:grid-cols-3 gap-6 px-6 py-5">

                {/* parties */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: MONO }}>PARTIDOS PRINCIPAIS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.parties.map((p) => (
                      <span key={p}
                        className="text-xs px-2 py-0.5"
                        style={{ fontFamily: MONO, background: `${g.color}20`, color: g.color }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* themes */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: MONO }}>TEMAS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.themes.map((t) => (
                      <span key={t}
                        className="text-xs px-2 py-0.5 border border-border text-muted-foreground"
                        style={{ fontFamily: MONO }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* connections */}
                <div>
                  <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: MONO }}>CONEXÕES</p>
                  <div className="flex flex-col gap-2">
                    {g.connects.map((c) => (
                      <ConnectionLine key={c} from={g.name} to={c} type="ally" />
                    ))}
                    {g.opposes.map((o) => (
                      <ConnectionLine key={o} from={g.name} to={o} type="oppose" />
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs" style={{ fontFamily: MONO }}>
                    <span className="flex items-center gap-1">
                      <span style={{ color: "#4a7c59" }}>↔</span>
                      <span className="text-muted-foreground">Aliado</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span style={{ color: "#c41230" }}>✕</span>
                      <span className="text-muted-foreground">Adversário</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* influence bar */}
              <div className="px-6 pb-5">
                <div className="h-1.5 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                  <div style={{ width: `${g.score}%`, background: g.color, height: "100%", transition: "width 0.8s ease" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* network summary */}
        <div className="mt-10 grid md:grid-cols-3 gap-px border border-border"
          style={{ background: "rgba(240,236,228,0.07)" }}>
          {[
            { label: "TOTAL DE MEMBROS EM BANCADAS", val: GROUPS.reduce((a, g) => a + g.members, 0).toLocaleString("pt-BR") },
            { label: "CONEXÕES MAPEADAS",             val: GROUPS.reduce((a, g) => a + g.connects.length, 0) },
            { label: "OPOSIÇÕES IDENTIFICADAS",       val: GROUPS.reduce((a, g) => a + g.opposes.length, 0) },
          ].map((s) => (
            <div key={s.label} className="bg-background px-8 py-7">
              <p className="text-xs tracking-widest text-muted-foreground mb-2" style={{ fontFamily: MONO }}>{s.label}</p>
              <p className="text-4xl font-black text-primary" style={{ fontFamily: SERIF }}>{s.val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ Q10 — Partidos mais influentes ══ */}
      <div className="relative">
        <img src="https://images.unsplash.com/photo-1699521376772-8622f9935e97?w=1600&h=900&fit=crop&auto=format" alt="Discurso político" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ filter: "grayscale(50%) brightness(0.3)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(10,10,10,0.80)" }} />
        <section className="px-6 md:px-14 py-16">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>Q10</span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>PARTIDOS</p>
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-3"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Como os partidos mais influentes?
        </h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-xl">
          Ranking baseado em cadeiras, presidências de comissão, acesso ao Executivo
          e poder de mobilização de votos.
        </p>

        {/* bar chart */}
        <div className="h-72 mb-12">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PARTY_INFLUENCE}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="party"
                tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }}
                axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]}
                tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                formatter={(v: number) => [`${v}/100`, "Influência"]}
                labelFormatter={(l) => PARTY_INFLUENCE.find((p) => p.party === l)?.full ?? l}
              />
              <Bar dataKey="score" radius={[2, 2, 0, 0]} maxBarSize={56}>
                {PARTY_INFLUENCE.map((p) => <Cell key={p.party} fill={p.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* party cards */}
        <div className="flex flex-col gap-4 mb-14">
          {PARTY_INFLUENCE.map((p, i) => (
            <div key={p.party}
              className="border border-border transition-colors hover:border-primary p-5"
              style={{ background: "#111", borderLeft: `3px solid ${p.color}` }}>
              <div className="grid md:grid-cols-4 gap-5 items-center">

                {/* rank + identity */}
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black flex-shrink-0"
                    style={{ fontFamily: SERIF, color: `${p.color}35` }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-2xl font-black leading-none"
                      style={{ fontFamily: SERIF, color: p.color }}>{p.party}</p>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: MONO }}>
                      {p.seats} cadeiras
                    </p>
                  </div>
                </div>

                {/* full name */}
                <div className="md:col-span-1">
                  <p className="text-xs text-muted-foreground mb-0.5" style={{ fontFamily: MONO }}>PARTIDO</p>
                  <p className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{p.full}</p>
                </div>

                {/* score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>ÍNDICE</p>
                    <p className="text-2xl font-black" style={{ fontFamily: SERIF, color: p.color }}>{p.score}</p>
                  </div>
                  <div className="h-2 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                    <div style={{ width: `${p.score}%`, background: p.color, height: "100%" }} />
                  </div>
                </div>

                {/* detail */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: MONO }}>DESTAQUE</p>
                  <p className="text-xs text-foreground leading-relaxed">{p.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* radar — top 3 */}
        <div>
          <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>
            COMPARATIVO POR ESFERA — PL, PT E MDB
          </p>
          <h3 className="text-2xl font-black mb-6" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
            Onde cada partido exerce mais influência?
          </h3>
          <div className="flex gap-6 mb-6">
            {[{ label: "PL", color: "#1a3a7c" }, { label: "PT", color: "#c41230" }, { label: "MDB", color: "#4a7c59" }].map((p) => (
              <div key={p.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{p.label}</span>
              </div>
            ))}
          </div>
          <div className="h-80 max-w-lg">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="rgba(240,236,228,0.08)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }} />
                <Radar dataKey="PL"  stroke="#1a3a7c" fill="#1a3a7c" fillOpacity={0.18} />
                <Radar dataKey="PT"  stroke="#c41230" fill="#c41230" fillOpacity={0.18} />
                <Radar dataKey="MDB" stroke="#4a7c59" fill="#4a7c59" fillOpacity={0.18} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
