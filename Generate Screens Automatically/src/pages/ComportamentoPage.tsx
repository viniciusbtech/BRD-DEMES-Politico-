import { useState } from "react";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import { DEPUTIES, PARTIES, img } from "../data";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

/* ── Bias data ────────────────────────────────────── */
const DEPUTY_BIAS: Record<number, {
  realScore: number;
  realLabel: string;
  declaredScore: number;
  declaredLabel: string;
  consistency: number;
  notes: string;
}> = {
  1: { realScore: 18, realLabel: "Centro-Esquerda",  declaredScore: 10, declaredLabel: "Esquerda",       consistency: 84, notes: "Vota ligeiramente mais ao centro do que declara publicamente. Alta coesão com a bancada do PT." },
  2: { realScore: 65, realLabel: "Centro-Direita",   declaredScore: 50, declaredLabel: "Centro",          consistency: 61, notes: "Discrepância significativa. Declara posição centrista mas vota consistentemente à direita em pautas econômicas e de segurança." },
  3: { realScore: 22, realLabel: "Centro-Esquerda",  declaredScore: 25, declaredLabel: "Centro-Esquerda", consistency: 91, notes: "Alto alinhamento entre discurso e voto. Um dos perfis mais consistentes entre os deputados analisados." },
  4: { realScore: 84, realLabel: "Direita",          declaredScore: 80, declaredLabel: "Direita",         consistency: 78, notes: "Alinhamento declarado e real próximos. Vota com a bancada conservadora em 98% das pautas de segurança." },
};

const PARTY_BIAS: Record<string, { score: number; label: string; consistency: number }> = {
  PT:    { score: 14, label: "Esquerda",       consistency: 88 },
  PL:    { score: 86, label: "Direita",        consistency: 82 },
  UNIAO: { score: 66, label: "Centro-Direita", consistency: 71 },
  MDB:   { score: 50, label: "Centro",         consistency: 64 },
  PSDB:  { score: 60, label: "Centro-Direita", consistency: 68 },
  PP:    { score: 70, label: "Centro-Direita", consistency: 73 },
  PDT:   { score: 26, label: "Centro-Esquerda",consistency: 79 },
};

/* ── Proposals ────────────────────────────────────── */
const PROPOSALS = [
  {
    id: "PL 102/2023",
    title: "Porte de arma para produtores rurais",
    date: "Mar 2023",
    theme: "Segurança",
    result: "Aprovado" as const,
    placar: "321 × 142",
  },
  {
    id: "PL 567/2023",
    title: "Piso nacional de enfermagem",
    date: "Set 2023",
    theme: "Saúde",
    result: "Aprovado" as const,
    placar: "378 × 98",
  },
  {
    id: "PL 890/2024",
    title: "Reforma tributária progressiva",
    date: "Mar 2024",
    theme: "Economia",
    result: "Aprovado" as const,
    placar: "382 × 118",
  },
  {
    id: "PL 1203/2024",
    title: "Marco regulatório de defesa pessoal",
    date: "Abr 2024",
    theme: "Segurança",
    result: "Rejeitado" as const,
    placar: "198 × 287",
  },
  {
    id: "PL 1456/2024",
    title: "Habitação popular em áreas urbanas",
    date: "Jul 2024",
    theme: "Social",
    result: "Aprovado" as const,
    placar: "412 × 78",
  },
  {
    id: "PL 1780/2025",
    title: "Regulação de horas extras e banco de horas",
    date: "Jan 2025",
    theme: "Trabalho",
    result: "Em votação" as const,
    placar: "—",
  },
];

const DEPUTY_VOTES: Record<number, Record<string, "Sim" | "Não" | "Abstenção" | "Ausente">> = {
  1: { "PL 102/2023": "Não",      "PL 567/2023": "Sim",       "PL 890/2024": "Sim",       "PL 1203/2024": "Não",      "PL 1456/2024": "Sim",      "PL 1780/2025": "Sim"      },
  2: { "PL 102/2023": "Sim",      "PL 567/2023": "Não",       "PL 890/2024": "Abstenção", "PL 1203/2024": "Sim",      "PL 1456/2024": "Não",      "PL 1780/2025": "Não"      },
  3: { "PL 102/2023": "Não",      "PL 567/2023": "Sim",       "PL 890/2024": "Sim",       "PL 1203/2024": "Não",      "PL 1456/2024": "Sim",      "PL 1780/2025": "Sim"      },
  4: { "PL 102/2023": "Sim",      "PL 567/2023": "Ausente",   "PL 890/2024": "Não",       "PL 1203/2024": "Sim",      "PL 1456/2024": "Não",      "PL 1780/2025": "Sim"      },
};

const VOTE_COLOR: Record<string, string> = {
  "Sim":       "#4a7c59",
  "Não":       "#c41230",
  "Abstenção": "#d4841a",
  "Ausente":   "#555",
};

const RESULT_COLOR = {
  "Aprovado":   { bg: "rgba(74,124,89,0.15)",   text: "#4a7c59" },
  "Rejeitado":  { bg: "rgba(196,18,48,0.15)",    text: "#c41230" },
  "Em votação": { bg: "rgba(212,132,26,0.15)",   text: "#d4841a" },
};

/* ── Bias bar ─────────────────────────────────────── */
function BiasBar({ score, label, color = "#c41230", showCenter = false }: {
  score: number; label: string; color?: string; showCenter?: boolean;
}) {
  return (
    <div>
      <div className="relative h-5 mb-1.5" style={{ background: "rgba(240,236,228,0.06)" }}>
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, #c41230 0%, #d4841a 50%, #1a3a7c 100%)", opacity: 0.12 }} />
        {showCenter && (
          <div className="absolute top-0 bottom-0 w-px opacity-20"
            style={{ left: "50%", background: "#f0ece4" }} />
        )}
        <div className="absolute top-1 bottom-1 w-3 rounded-none"
          style={{ left: `calc(${score}% - 6px)`, background: color, transition: "left 0.6s ease" }} />
      </div>
      <div className="flex justify-between text-xs" style={{ fontFamily: MONO, color: "#555" }}>
        <span>ESQUERDA</span>
        <span style={{ color }}>{label}</span>
        <span>DIREITA</span>
      </div>
    </div>
  );
}

/* ── Deputy search ────────────────────────────────── */
function DeputySearch({ value, onChange, onSelect }: {
  value: string; onChange: (v: string) => void; onSelect: (d: typeof DEPUTIES[0]) => void;
}) {
  const [open, setOpen] = useState(false);
  const filtered = DEPUTIES.filter((d) =>
    d.name.toLowerCase().includes(value.toLowerCase()) ||
    d.party.toLowerCase().includes(value.toLowerCase())
  );
  return (
    <div className="relative max-w-xl">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
        style={{ fontFamily: MONO }}>⌕</span>
      <input value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Nome ou partido do deputado..."
        className="w-full pl-10 pr-10 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
      />
      {value && (
        <button onClick={() => { onChange(""); setOpen(false); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
      )}
      {open && (
        <div className="absolute top-full left-0 right-0 border border-border z-20"
          style={{ background: "#141414" }}>
          {(value ? filtered : DEPUTIES).map((d) => (
            <button key={d.id} onClick={() => { onSelect(d); onChange(d.name); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
              <div className="w-9 h-9 overflow-hidden flex-shrink-0">
                <img src={img(d.img, 72, 72)} alt={d.name}
                  className="w-full h-full object-cover" style={{ filter: "grayscale(40%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>{d.name}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{d.party} · {d.state}</p>
              </div>
            </button>
          ))}
          {value && filtered.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>NENHUM RESULTADO</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── All party names for search ───────────────────── */
const ALL_PARTIES = Object.entries(PARTY_BIAS).map(([id, pb]) => ({
  id,
  label: pb.label,
  score: pb.score,
  consistency: pb.consistency,
  full: PARTIES.find((p) => p.id === id)?.full ?? id,
  seats: PARTIES.find((p) => p.id === id)?.seats ?? 0,
  color: PARTIES.find((p) => p.id === id)?.color ?? "#888",
}));

/* ── Page ─────────────────────────────────────────── */
export default function ComportamentoPage() {
  const [depQuery, setDepQuery]       = useState("");
  const [selected, setSelected]       = useState<typeof DEPUTIES[0] | null>(null);
  const [depDropOpen, setDepDropOpen] = useState(false);
  const [partyQuery, setPartyQuery]   = useState("");
  const [selectedParty, setSelectedParty] = useState<typeof ALL_PARTIES[0] | null>(null);
  const [partyDropOpen, setPartyDropOpen] = useState(false);
  const [propFilter, setPropFilter]   = useState("");

  const bias      = selected ? DEPUTY_BIAS[selected.id] ?? null : null;
  const partyBias = selectedParty
    ? PARTY_BIAS[selectedParty.id] ?? null
    : selected ? PARTY_BIAS[selected.party] ?? null : null;
  const activePartyId = selectedParty?.id ?? selected?.party ?? null;
  const votes     = selected ? DEPUTY_VOTES[selected.id] ?? {} : {};

  const filteredDeps = DEPUTIES.filter((d) =>
    d.name.toLowerCase().includes(depQuery.toLowerCase()) ||
    d.party.toLowerCase().includes(depQuery.toLowerCase())
  );
  const filteredPartyList = ALL_PARTIES.filter((p) =>
    p.id.toLowerCase().includes(partyQuery.toLowerCase()) ||
    p.full.toLowerCase().includes(partyQuery.toLowerCase())
  );

  const filteredProposals = propFilter
    ? PROPOSALS.filter((p) =>
        p.title.toLowerCase().includes(propFilter.toLowerCase()) ||
        p.theme.toLowerCase().includes(propFilter.toLowerCase()) ||
        p.id.toLowerCase().includes(propFilter.toLowerCase())
      )
    : PROPOSALS;

  const discrepancy = bias ? Math.abs(bias.realScore - (bias.declaredScore)) : 0;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar />

      <PageHero
        n="7" tag="VIÉS & VOTO"
        title="Como o Deputado" titleRed="se Comporta"
        desc="O viés ideológico real — calculado com base em votações nominais — e o registro de como cada parlamentar votou em cada proposta específica."
        imgId="photo-1534293230397-c067fc201ab8"
        stripImgs={[
          { id: "photo-1600041967514-701d405228c6", alt: "Mão erguida em votação" },
          { id: "photo-1641376028786-da6f7d7897d3", alt: "Político discursando" },
          { id: "photo-1699521376772-8622f9935e97", alt: "Discurso para multidão" },
        ]}
      />

      {/* Filters — deputy + party */}
      <div className="px-6 md:px-14 py-10 border-b border-border" style={{ background: "#0d0d0d" }}>
        <div className="grid md:grid-cols-2 gap-6">

          {/* Deputy filter */}
          <div>
            <p className="text-xs tracking-[0.35em] text-primary mb-3" style={{ fontFamily: MONO }}>
              PESQUISAR DEPUTADO
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
                style={{ fontFamily: MONO }}>⌕</span>
              <input value={depQuery}
                onChange={(e) => { setDepQuery(e.target.value); setSelected(null); setDepDropOpen(true); }}
                onFocus={() => setDepDropOpen(true)}
                placeholder="Nome ou partido do deputado..."
                className="w-full pl-10 pr-10 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              {depQuery && (
                <button onClick={() => { setDepQuery(""); setSelected(null); setDepDropOpen(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
              )}
              {depDropOpen && (
                <div className="absolute top-full left-0 right-0 border border-border z-20"
                  style={{ background: "#141414" }}>
                  {(depQuery ? filteredDeps : DEPUTIES).map((d) => (
                    <button key={d.id}
                      onClick={() => { setSelected(d); setDepQuery(d.name); setDepDropOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
                      <div className="w-8 h-8 overflow-hidden flex-shrink-0">
                        <img src={img(d.img, 64, 64)} alt={d.name}
                          className="w-full h-full object-cover" style={{ filter: "grayscale(40%)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>{d.name}</p>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{d.party} · {d.state}</p>
                      </div>
                    </button>
                  ))}
                  {depQuery && filteredDeps.length === 0 && (
                    <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>NENHUM RESULTADO</p>
                  )}
                </div>
              )}
            </div>
            {selected && (
              <div className="mt-4 flex items-center gap-5 border-l-2 border-primary pl-4">
                <div className="w-20 h-24 overflow-hidden flex-shrink-0 border-2 border-primary"
                  style={{ boxShadow: "0 0 24px rgba(196,18,48,0.2)" }}>
                  <img src={img(selected.img, 160, 192)} alt={selected.name}
                    className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground"
                      style={{ fontFamily: MONO }}>{selected.party}</span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{selected.state}</span>
                  </div>
                  <p className="text-lg font-black text-foreground" style={{ fontFamily: SERIF }}>{selected.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: MONO }}>{selected.mandate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Party filter */}
          <div>
            <p className="text-xs tracking-[0.35em] text-primary mb-3" style={{ fontFamily: MONO }}>
              PESQUISAR PARTIDO
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
                style={{ fontFamily: MONO }}>⌕</span>
              <input value={partyQuery}
                onChange={(e) => { setPartyQuery(e.target.value); setSelectedParty(null); setPartyDropOpen(true); }}
                onFocus={() => setPartyDropOpen(true)}
                placeholder="Sigla ou nome completo do partido..."
                className="w-full pl-10 pr-10 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              {partyQuery && (
                <button onClick={() => { setPartyQuery(""); setSelectedParty(null); setPartyDropOpen(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
              )}
              {partyDropOpen && (
                <div className="absolute top-full left-0 right-0 border border-border z-20"
                  style={{ background: "#141414" }}>
                  {(partyQuery ? filteredPartyList : ALL_PARTIES).map((p) => (
                    <button key={p.id}
                      onClick={() => { setSelectedParty(p); setPartyQuery(p.full); setPartyDropOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
                      <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-xs font-black"
                        style={{ background: p.color, fontFamily: SERIF, color: "#f0ece4" }}>{p.id}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>{p.full}</p>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                          {p.seats} cadeiras · {p.label}
                        </p>
                      </div>
                    </button>
                  ))}
                  {partyQuery && filteredPartyList.length === 0 && (
                    <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>NENHUM RESULTADO</p>
                  )}
                </div>
              )}
            </div>
            {selectedParty && (
              <div className="mt-4 flex items-center gap-5 border-l-2 pl-4"
                style={{ borderColor: selectedParty.color }}>
                <div className="w-20 h-24 flex items-center justify-center flex-shrink-0 text-3xl font-black"
                  style={{
                    background: selectedParty.color,
                    fontFamily: SERIF,
                    color: "#f0ece4",
                    boxShadow: `0 0 24px ${selectedParty.color}40`,
                    letterSpacing: "-0.02em",
                  }}>
                  {selectedParty.id}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: MONO }}>
                    {selectedParty.seats} CADEIRAS
                  </p>
                  <p className="text-lg font-black text-foreground" style={{ fontFamily: SERIF }}>{selectedParty.full}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ fontFamily: MONO, color: selectedParty.color }}>
                    {selectedParty.label}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ Q: Viés real do deputado ══ */}
      <section className="px-6 md:px-14 py-16 border-b border-border">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>01</span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>ESPECTRO IDEOLÓGICO</p>
        </div>
        <h2 className="text-3xl font-black mb-10" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Qual é o real viés do deputado?
        </h2>

        {!selected && (
          <p className="text-sm text-muted-foreground" style={{ fontFamily: MONO }}>
            ↑ Selecione um deputado acima para ver o espectro ideológico.
          </p>
        )}

        {selected && bias && (
          <div className="max-w-2xl flex flex-col gap-10">
            {/* real position */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                  Posicionamento Real
                  <span className="text-xs text-muted-foreground ml-2" style={{ fontFamily: MONO }}>
                    (baseado em votações nominais)
                  </span>
                </span>
                <span className="text-lg font-black text-primary" style={{ fontFamily: MONO }}>
                  {bias.realLabel}
                </span>
              </div>
              <BiasBar score={bias.realScore} label={bias.realLabel} color="#c41230" showCenter />
            </div>

            {/* declared position */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                  Posicionamento Declarado
                  <span className="text-xs text-muted-foreground ml-2" style={{ fontFamily: MONO }}>
                    (autodesignação pública)
                  </span>
                </span>
                <span className="text-sm text-muted-foreground" style={{ fontFamily: MONO }}>
                  {bias.declaredLabel}
                </span>
              </div>
              <BiasBar score={bias.declaredScore} label={bias.declaredLabel} color="#555" />
            </div>

            {/* consistency */}
            <div className="grid grid-cols-2 gap-px border border-border"
              style={{ background: "rgba(240,236,228,0.07)" }}>
              <div className="bg-background px-6 py-6">
                <p className="text-xs tracking-widest text-muted-foreground mb-2" style={{ fontFamily: MONO }}>
                  CONSISTÊNCIA DISCURSO / VOTO
                </p>
                <p className="text-4xl font-black"
                  style={{ fontFamily: SERIF, color: bias.consistency >= 80 ? "#4a7c59" : bias.consistency >= 65 ? "#d4841a" : "#c41230" }}>
                  {bias.consistency}%
                </p>
              </div>
              <div className="bg-background px-6 py-6">
                <p className="text-xs tracking-widest text-muted-foreground mb-2" style={{ fontFamily: MONO }}>
                  DISTÂNCIA DECLARADO → REAL
                </p>
                <p className="text-4xl font-black"
                  style={{ fontFamily: SERIF, color: discrepancy > 20 ? "#c41230" : discrepancy > 10 ? "#d4841a" : "#4a7c59" }}>
                  {discrepancy} <span className="text-xl">pts</span>
                </p>
              </div>
            </div>

            {/* analysis note */}
            <div className="flex items-start gap-3 px-5 py-4 border border-border"
              style={{ background: "#111", borderLeft: `3px solid ${discrepancy > 20 ? "#c41230" : discrepancy > 10 ? "#d4841a" : "#4a7c59"}` }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: discrepancy > 20 ? "#c41230" : discrepancy > 10 ? "#d4841a" : "#4a7c59" }} />
              <p className="text-sm text-muted-foreground leading-relaxed">{bias.notes}</p>
            </div>
          </div>
        )}
      </section>

      {/* ══ Q: Viés real do partido ══ */}
      <section className="px-6 md:px-14 py-16 border-b border-border">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>02</span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>PARTIDO</p>
        </div>
        <h2 className="text-3xl font-black mb-10" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Qual é o real viés do partido?
        </h2>

        {!selected && !selectedParty && (
          <p className="text-sm text-muted-foreground" style={{ fontFamily: MONO }}>
            ↑ Selecione um deputado ou partido acima para ver o viés.
          </p>
        )}

        {(selected || selectedParty) && partyBias && (
          <div className="max-w-2xl flex flex-col gap-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                  {activePartyId} — Média das votações nominais
                </span>
                <span className="text-lg font-black text-primary" style={{ fontFamily: MONO }}>
                  {partyBias.label}
                </span>
              </div>
              <BiasBar score={partyBias.score} label={partyBias.label} color="#d4841a" showCenter />
            </div>

            {/* party vs deputy comparison */}
            {bias && (
              <div>
                <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: MONO }}>
                  DEPUTADO vs. PARTIDO — ESPECTRO COMPARATIVO
                </p>
                <div className="relative h-12" style={{ background: "rgba(240,236,228,0.04)" }}>
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to right, #c41230 0%, #d4841a 50%, #1a3a7c 100%)", opacity: 0.1 }} />
                  {/* center line */}
                  <div className="absolute top-0 bottom-0 w-px opacity-20" style={{ left: "50%", background: "#f0ece4" }} />
                  {/* party marker */}
                  <div className="absolute top-1 bottom-1 flex flex-col items-center"
                    style={{ left: `calc(${partyBias.score}% - 1px)` }}>
                    <div className="w-0.5 h-full bg-amber-500 opacity-70" />
                    <span className="absolute -top-5 text-xs whitespace-nowrap"
                      style={{ fontFamily: MONO, color: "#d4841a", transform: "translateX(-50%)" }}>
                      {selected.party}
                    </span>
                  </div>
                  {/* deputy marker */}
                  <div className="absolute top-1 bottom-1 flex flex-col items-center"
                    style={{ left: `calc(${bias.realScore}% - 1px)` }}>
                    <div className="w-0.5 h-full bg-primary" />
                    <span className="absolute -bottom-5 text-xs whitespace-nowrap"
                      style={{ fontFamily: MONO, color: "#c41230", transform: "translateX(-50%)" }}>
                      {selected.name.split(" ")[0]}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-px border border-border"
              style={{ background: "rgba(240,236,228,0.07)" }}>
              <div className="bg-background px-6 py-6">
                <p className="text-xs tracking-widest text-muted-foreground mb-2" style={{ fontFamily: MONO }}>
                  CONSISTÊNCIA INTERNA DO PARTIDO
                </p>
                <p className="text-4xl font-black"
                  style={{ fontFamily: SERIF, color: partyBias.consistency >= 80 ? "#4a7c59" : "#d4841a" }}>
                  {partyBias.consistency}%
                </p>
              </div>
              <div className="bg-background px-6 py-6">
                <p className="text-xs tracking-widest text-muted-foreground mb-2" style={{ fontFamily: MONO }}>
                  ALINHAMENTO DEPUTADO ↔ PARTIDO
                </p>
                <p className="text-4xl font-black"
                  style={{ fontFamily: SERIF, color: bias && Math.abs(bias.realScore - partyBias.score) < 15 ? "#4a7c59" : "#d4841a" }}>
                  {bias ? `${Math.max(0, 100 - Math.abs(bias.realScore - partyBias.score) * 2)}%` : "—"}
                </p>
              </div>
            </div>

            {/* all parties comparison */}
            <div>
              <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: MONO }}>
                COMPARATIVO — TODOS OS PARTIDOS
              </p>
              <div className="flex flex-col gap-3">
                {Object.entries(PARTY_BIAS)
                  .sort((a, b) => a[1].score - b[1].score)
                  .map(([pid, pb]) => (
                    <div key={pid}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold w-12 flex-shrink-0"
                          style={{ fontFamily: MONO, color: pid === activePartyId ? "#c41230" : "#888880" }}>
                          {pid}
                        </span>
                        <div className="flex-1 relative h-2" style={{ background: "rgba(240,236,228,0.07)" }}>
                          <div style={{
                            position: "absolute", left: 0, top: 0, bottom: 0,
                            width: `${pb.score}%`,
                            background: pid === activePartyId ? "#c41230" : "rgba(240,236,228,0.2)",
                          }} />
                        </div>
                        <span className="text-xs w-20 flex-shrink-0"
                          style={{ fontFamily: MONO, color: pid === activePartyId ? "#c41230" : "#555" }}>
                          {pb.label}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ══ Q: Votos por proposta ══ */}
      <section className="px-6 md:px-14 py-16">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>03</span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>VOTAÇÕES</p>
        </div>
        <h2 className="text-3xl font-black mb-3" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Em uma proposta, qual foi o voto?
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-lg">
          Selecione um deputado acima e filtre as propostas abaixo para ver o registro de voto de cada um.
        </p>

        {/* proposal filter */}
        <div className="relative max-w-xl mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
            style={{ fontFamily: MONO }}>⌕</span>
          <input value={propFilter} onChange={(e) => setPropFilter(e.target.value)}
            placeholder="Filtrar por título, tema ou número..."
            className="w-full pl-10 pr-10 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {propFilter && (
            <button onClick={() => setPropFilter("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
          )}
        </div>

        {/* vote legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {Object.entries(VOTE_COLOR).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{label}</span>
            </div>
          ))}
        </div>

        {/* proposals table */}
        <div className="flex flex-col gap-px border border-border"
          style={{ background: "rgba(240,236,228,0.06)" }}>
          {/* header */}
          <div className="grid px-6 py-3 bg-background gap-4"
            style={{ gridTemplateColumns: "130px 1fr 90px 100px 110px" }}>
            {["Nº / DATA", "TÍTULO", "TEMA", "PLACAR", selected ? "VOTO" : "DEPUTADO"].map((h) => (
              <span key={h} className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{h}</span>
            ))}
          </div>

          {filteredProposals.length === 0 ? (
            <div className="px-6 py-8 bg-background text-center">
              <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                NENHUMA PROPOSTA ENCONTRADA PARA "{propFilter.toUpperCase()}"
              </p>
            </div>
          ) : filteredProposals.map((p) => {
            const vote = selected ? votes[p.id] ?? "Ausente" : null;
            const rc = RESULT_COLOR[p.result];
            return (
              <div key={p.id}
                className="grid px-6 py-4 bg-background hover:bg-card transition-colors items-center gap-4"
                style={{ gridTemplateColumns: "130px 1fr 90px 100px 110px" }}>

                <div>
                  <p className="text-xs font-bold text-primary" style={{ fontFamily: MONO }}>{p.id}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{p.date}</p>
                </div>

                <p className="text-sm text-foreground leading-snug">{p.title}</p>

                <span className="text-xs px-2 py-0.5 border border-border text-muted-foreground text-center"
                  style={{ fontFamily: MONO }}>{p.theme}</span>

                <div>
                  <span className="text-xs px-2 py-1 block text-center"
                    style={{ fontFamily: MONO, background: rc.bg, color: rc.text }}>
                    {p.result}
                  </span>
                  <p className="text-xs text-muted-foreground text-center mt-1"
                    style={{ fontFamily: MONO }}>{p.placar}</p>
                </div>

                {vote ? (
                  <span className="text-sm font-bold px-3 py-1.5 text-center"
                    style={{ fontFamily: MONO, color: VOTE_COLOR[vote], background: `${VOTE_COLOR[vote]}18` }}>
                    {vote}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    Selecione um deputado
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
