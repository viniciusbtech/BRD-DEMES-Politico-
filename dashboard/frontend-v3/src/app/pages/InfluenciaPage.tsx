import { Bar, BarChart, Cell, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import { groups, partyInfluence, radarData } from "../data/influenciaMock";

type InfluenciaPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
};

type ConnectionLineProps = {
  from: string;
  to: string;
  type: "ally" | "oppose";
};

type TooltipValue = string | number | Array<string | number>;

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

function ConnectionLine({ from, to, type }: ConnectionLineProps) {
  return (
    <div className="flex items-center gap-2 text-xs" style={{ fontFamily: MONO }}>
      <span className="max-w-[120px] truncate text-muted-foreground">{from}</span>
      <span style={{ color: type === "ally" ? "#4a7c59" : "#c41230", flexShrink: 0 }}>
        {type === "ally" ? "↔" : "×"}
      </span>
      <span className="max-w-[120px] truncate text-muted-foreground">{to}</span>
    </div>
  );
}

export default function InfluenciaPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado }: InfluenciaPageProps) {
  const totalMembers = groups.reduce((sum, group) => sum + group.members, 0);
  const totalConnections = groups.reduce((sum, group) => sum + group.connects.length, 0);
  const totalOppositions = groups.reduce((sum, group) => sum + group.opposes.length, 0);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateDeputado={onNavigateDeputado} />

      <PageHero
        n="6"
        tag="REDES"
        title="Influência"
        titleRed="+ Grupos e Partidos"
        desc="Como as bancadas parlamentares se conectam, se opõem e articulam votos, e quais partidos exercem o maior poder de influência real na Câmara."
        imgId="photo-1561489396-888724a1543d"
        stripImgs={[
          { id: "photo-1699112204356-532841a77e07", alt: "Manifestação com bandeiras" },
          { id: "photo-1551135049-8a33b5883817", alt: "Negociação política" },
          { id: "photo-1758518730178-6e237bc8b87d", alt: "Mesa de negociação" },
        ]}
      />

      <section className="border-b border-border px-6 py-16 md:px-14">
        <div className="mb-2 flex items-baseline gap-4">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
            Q8
          </span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
            BANCADAS
          </p>
        </div>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Como os grupos se influenciam?
        </h2>
        <p className="mb-12 max-w-xl text-sm text-muted-foreground">
          Cada bancada temática articula aliados, bloqueia adversários e atravessa legendas partidárias. O mapa abaixo mostra conexões e oposições entre os principais grupos.
        </p>

        <div className="flex flex-col gap-6">
          {groups.map((group, index) => (
            <div
              key={group.name}
              className="border border-border transition-colors hover:border-primary"
              style={{ background: "#111111", borderLeft: `3px solid ${group.color}` }}
            >
              <div className="flex items-start justify-between border-b border-border px-6 pb-4 pt-6">
                <div className="flex items-start gap-5">
                  <span className="shrink-0 text-5xl font-black" style={{ fontFamily: SERIF, color: `${group.color}30` }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="mb-1 text-xl font-black text-foreground" style={{ fontFamily: SERIF }}>
                      {group.name}
                    </h3>
                    <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">{group.description}</p>
                  </div>
                </div>
                <div className="ml-6 shrink-0 text-right">
                  <p className="mb-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    INFLUÊNCIA
                  </p>
                  <p className="text-3xl font-black" style={{ fontFamily: SERIF, color: group.color }}>
                    {group.score}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {group.members} membros
                  </p>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-5 md:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    PARTIDOS PRINCIPAIS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.parties.map((party) => (
                      <span key={party} className="px-2 py-0.5 text-xs" style={{ fontFamily: MONO, background: `${group.color}20`, color: group.color }}>
                        {party}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    TEMAS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.themes.map((theme) => (
                      <span key={theme} className="border border-border px-2 py-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    CONEXÕES
                  </p>
                  <div className="flex flex-col gap-2">
                    {group.connects.map((connection) => (
                      <ConnectionLine key={connection} from={group.name} to={connection} type="ally" />
                    ))}
                    {group.opposes.map((opposition) => (
                      <ConnectionLine key={opposition} from={group.name} to={opposition} type="oppose" />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs" style={{ fontFamily: MONO }}>
                    <span className="flex items-center gap-1">
                      <span style={{ color: "#4a7c59" }}>↔</span>
                      <span className="text-muted-foreground">Aliado</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span style={{ color: "#c41230" }}>×</span>
                      <span className="text-muted-foreground">Adversário</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-5">
                <div className="h-1.5 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                  <div style={{ width: `${group.score}%`, background: group.color, height: "100%", transition: "width 0.8s ease" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-px border border-border md:grid-cols-3" style={{ background: "rgba(240,236,228,0.07)" }}>
          {[
            { label: "TOTAL DE MEMBROS EM BANCADAS", value: totalMembers.toLocaleString("pt-BR") },
            { label: "CONEXÕES MAPEADAS", value: totalConnections },
            { label: "OPOSIÇÕES IDENTIFICADAS", value: totalOppositions },
          ].map((item) => (
            <div key={item.label} className="bg-background px-8 py-7">
              <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                {item.label}
              </p>
              <p className="text-4xl font-black text-primary" style={{ fontFamily: SERIF }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1699521376772-8622f9935e97?w=1600&h=900&fit=crop&auto=format"
          alt="Discurso político"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ filter: "grayscale(50%) brightness(0.3)" }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(10,10,10,0.80)" }} />
        <section className="relative z-10 px-6 py-16 md:px-14">
          <div className="mb-2 flex items-baseline gap-4">
            <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
              Q10
            </span>
            <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              PARTIDOS
            </p>
          </div>
          <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
            Quais são os partidos mais influentes?
          </h2>
          <p className="mb-12 max-w-xl text-sm text-muted-foreground">
            Ranking baseado em cadeiras, presidências de comissão, acesso ao Executivo e poder de mobilização de votos.
          </p>

          <div className="mb-12 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partyInfluence} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="party" tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                  formatter={(value: TooltipValue) => [`${value}/100`, "Influência"]}
                  labelFormatter={(label) => partyInfluence.find((party) => party.party === label)?.full ?? label}
                />
                <Bar dataKey="score" radius={[2, 2, 0, 0]} maxBarSize={56}>
                  {partyInfluence.map((party) => (
                    <Cell key={party.party} fill={party.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-14 flex flex-col gap-4">
            {partyInfluence.map((party, index) => (
              <div
                key={party.party}
                className="border border-border p-5 transition-colors hover:border-primary"
                style={{ background: "#111111", borderLeft: `3px solid ${party.color}` }}
              >
                <div className="grid items-center gap-5 md:grid-cols-4">
                  <div className="flex items-center gap-4">
                    <span className="shrink-0 text-4xl font-black" style={{ fontFamily: SERIF, color: `${party.color}35` }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-2xl font-black leading-none" style={{ fontFamily: SERIF, color: party.color }}>
                        {party.party}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        {party.seats} cadeiras
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      PARTIDO
                    </p>
                    <p className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                      {party.full}
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        ÍNDICE
                      </p>
                      <p className="text-2xl font-black" style={{ fontFamily: SERIF, color: party.color }}>
                        {party.score}
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                      <div style={{ width: `${party.score}%`, background: party.color, height: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      DESTAQUE
                    </p>
                    <p className="text-xs leading-relaxed text-foreground">{party.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              COMPARATIVO POR ESFERA — PL, PT E MDB
            </p>
            <h3 className="mb-6 text-2xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
              Onde cada partido exerce mais influência?
            </h3>
            <div className="mb-6 flex gap-6">
              {[
                { label: "PL", color: "#1a3a7c" },
                { label: "PT", color: "#c41230" },
                { label: "MDB", color: "#4a7c59" },
              ].map((party) => (
                <div key={party.label} className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: party.color }} />
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {party.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-80 max-w-lg">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(240,236,228,0.08)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }} />
                  <Radar dataKey="PL" stroke="#1a3a7c" fill="#1a3a7c" fillOpacity={0.18} />
                  <Radar dataKey="PT" stroke="#c41230" fill="#c41230" fillOpacity={0.18} />
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
