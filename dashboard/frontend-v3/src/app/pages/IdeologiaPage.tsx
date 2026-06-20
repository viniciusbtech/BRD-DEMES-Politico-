import { useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import {
  comportamentoDeputies,
  comportamentoParties,
  comportamentoProposals,
  deputyBias,
  deputyVotes,
  imageUrl,
  type ComportamentoDeputy,
  type ComportamentoParty,
  type DeputyVote,
  type ProposalResult,
} from "../data/partidosMock";

type IdeologiaPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

const voteColor: Record<DeputyVote, string> = {
  Sim: "#4a7c59",
  Não: "#c41230",
  Abstenção: "#d4841a",
  Ausente: "#555555",
};

const resultColor: Record<ProposalResult, { bg: string; text: string }> = {
  Aprovado: { bg: "rgba(74,124,89,0.15)", text: "#4a7c59" },
  Rejeitado: { bg: "rgba(196,18,48,0.15)", text: "#c41230" },
  "Em votação": { bg: "rgba(212,132,26,0.15)", text: "#d4841a" },
};

function BiasBar({
  score,
  label,
  color = "#c41230",
  showCenter = false,
}: {
  score: number;
  label: string;
  color?: string;
  showCenter?: boolean;
}) {
  return (
    <div>
      <div className="relative mb-1.5 h-5" style={{ background: "rgba(240,236,228,0.06)" }}>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, #c41230 0%, #d4841a 50%, #1a3a7c 100%)", opacity: 0.12 }}
        />
        {showCenter ? <div className="absolute bottom-0 top-0 w-px opacity-20" style={{ left: "50%", background: "#f0ece4" }} /> : null}
        <div
          className="absolute bottom-1 top-1 w-3"
          style={{ left: `calc(${score}% - 6px)`, background: color, transition: "left 0.6s ease" }}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ fontFamily: MONO, color: "#555555" }}>
        <span>ESQUERDA</span>
        <span style={{ color }}>{label}</span>
        <span>DIREITA</span>
      </div>
    </div>
  );
}

function DeputyCard({ deputy }: { deputy: ComportamentoDeputy }) {
  return (
    <div className="mt-4 flex items-center gap-5 border-l-2 border-primary pl-4">
      <div className="h-24 w-20 flex-shrink-0 overflow-hidden border-2 border-primary" style={{ boxShadow: "0 0 28px rgba(196,18,48,0.22)" }}>
        <img src={imageUrl(deputy.img, 160, 192)} alt={deputy.name} className="h-full w-full object-cover object-top" />
      </div>
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="bg-primary px-2 py-0.5 text-xs text-primary-foreground" style={{ fontFamily: MONO }}>
            {deputy.party}
          </span>
          <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            {deputy.state}
          </span>
        </div>
        <p className="text-lg font-black text-foreground" style={{ fontFamily: SERIF }}>
          {deputy.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          {deputy.mandate}
        </p>
      </div>
    </div>
  );
}

function PartyCard({ party }: { party: ComportamentoParty }) {
  return (
    <div className="mt-4 flex items-center gap-5 border-l-2 pl-4" style={{ borderColor: party.color }}>
      <div className="flex h-24 w-20 flex-shrink-0 items-center justify-center text-3xl font-black" style={{ background: party.color, fontFamily: SERIF, color: "#f0ece4" }}>
        {party.name}
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          {party.seats} DEPUTADOS FEDERAIS
        </p>
        <p className="text-lg font-black text-foreground" style={{ fontFamily: SERIF }}>
          {party.full}
        </p>
        <p className="mt-0.5 text-sm font-bold" style={{ fontFamily: MONO, color: party.color }}>
          {party.label}
        </p>
      </div>
    </div>
  );
}

export default function IdeologiaPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado }: IdeologiaPageProps) {
  const [depQuery, setDepQuery] = useState("");
  const [selectedDeputy, setSelectedDeputy] = useState<ComportamentoDeputy | null>(null);
  const [depDropOpen, setDepDropOpen] = useState(false);
  const [partyQuery, setPartyQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState<ComportamentoParty | null>(null);
  const [partyDropOpen, setPartyDropOpen] = useState(false);
  const [propFilter, setPropFilter] = useState("");

  const filteredDeps = useMemo(
    () =>
      comportamentoDeputies.filter(
        (deputy) =>
          deputy.name.toLowerCase().includes(depQuery.toLowerCase()) ||
          deputy.party.toLowerCase().includes(depQuery.toLowerCase()),
      ),
    [depQuery],
  );

  const filteredParties = useMemo(
    () =>
      comportamentoParties.filter(
        (party) =>
          party.id.toLowerCase().includes(partyQuery.toLowerCase()) ||
          party.full.toLowerCase().includes(partyQuery.toLowerCase()),
      ),
    [partyQuery],
  );

  const filteredProposals = useMemo(
    () =>
      propFilter
        ? comportamentoProposals.filter(
            (proposal) =>
              proposal.title.toLowerCase().includes(propFilter.toLowerCase()) ||
              proposal.theme.toLowerCase().includes(propFilter.toLowerCase()) ||
              proposal.id.toLowerCase().includes(propFilter.toLowerCase()),
          )
        : comportamentoProposals,
    [propFilter],
  );

  const bias = selectedDeputy ? deputyBias[selectedDeputy.id] ?? null : null;
  const activeParty = selectedParty ?? comportamentoParties.find((party) => party.id === selectedDeputy?.party) ?? null;
  const votes = selectedDeputy ? deputyVotes[selectedDeputy.id] ?? {} : {};
  const discrepancy = bias ? Math.abs(bias.realScore - bias.declaredScore) : 0;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateDeputado={onNavigateDeputado} />

      <PageHero
        n="7"
        tag="VIÉS E VOTO"
        title="Partidos e como"
        titleRed="se comportam?"
        desc="Compare o posicionamento declarado com votos reais, leia o viés dos partidos e acompanhe como parlamentares se posicionam em propostas específicas."
        imgId="photo-1534293230397-c067fc201ab8"
        stripImgs={[
          { id: "photo-1529107386315-e1a2ed48a620", alt: "Plenário legislativo" },
          { id: "photo-1589829545856-d10d557cf95f", alt: "Documento jurídico" },
          { id: "photo-1520690214124-2405c5217036", alt: "Sessão parlamentar" },
        ]}
      />

      <div className="border-b border-border px-6 py-10 md:px-14" style={{ background: "#0d0d0d" }}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              BUSCAR DEPUTADO
            </p>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                ⌕
              </span>
              <input
                value={depQuery}
                onChange={(event) => {
                  setDepQuery(event.target.value);
                  setDepDropOpen(true);
                }}
                onFocus={() => setDepDropOpen(true)}
                placeholder="Nome ou partido do deputado..."
                className="w-full border border-border bg-card py-3.5 pl-10 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {depQuery ? (
                <button
                  onClick={() => {
                    setDepQuery("");
                    setDepDropOpen(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  x
                </button>
              ) : null}
              {depDropOpen ? (
                <div className="absolute left-0 right-0 top-full z-20 border border-border" style={{ background: "#141414" }}>
                  {(depQuery ? filteredDeps : comportamentoDeputies).map((deputy) => (
                    <button
                      key={deputy.id}
                      onClick={() => {
                        setSelectedDeputy(deputy);
                        setDepQuery(deputy.name);
                        setDepDropOpen(false);
                      }}
                      className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
                    >
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden">
                        <img src={imageUrl(deputy.img, 64, 64)} alt={deputy.name} className="h-full w-full object-cover" style={{ filter: "grayscale(40%)" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                          {deputy.name}
                        </p>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                          {deputy.party} · {deputy.state}
                        </p>
                      </div>
                    </button>
                  ))}
                  {depQuery && filteredDeps.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      NENHUM RESULTADO
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {selectedDeputy ? <DeputyCard deputy={selectedDeputy} /> : null}
          </div>

          <div>
            <p className="mb-3 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              BUSCAR PARTIDO
            </p>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                ⌕
              </span>
              <input
                value={partyQuery}
                onChange={(event) => {
                  setPartyQuery(event.target.value);
                  setPartyDropOpen(true);
                }}
                onFocus={() => setPartyDropOpen(true)}
                placeholder="Sigla ou nome do partido..."
                className="w-full border border-border bg-card py-3.5 pl-10 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {partyQuery ? (
                <button
                  onClick={() => {
                    setPartyQuery("");
                    setPartyDropOpen(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  x
                </button>
              ) : null}
              {partyDropOpen ? (
                <div className="absolute left-0 right-0 top-full z-20 border border-border" style={{ background: "#141414" }}>
                  {(partyQuery ? filteredParties : comportamentoParties).map((party) => (
                    <button
                      key={party.id}
                      onClick={() => {
                        setSelectedParty(party);
                        setPartyQuery(party.full);
                        setPartyDropOpen(false);
                      }}
                      className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-xs font-black" style={{ background: party.color, fontFamily: SERIF, color: "#f0ece4" }}>
                        {party.name}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                          {party.full}
                        </p>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                          {party.seats} deputados · {party.label}
                        </p>
                      </div>
                    </button>
                  ))}
                  {partyQuery && filteredParties.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      NENHUM RESULTADO
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {selectedParty ? <PartyCard party={selectedParty} /> : null}
          </div>
        </div>
      </div>

      <section className="border-b border-border px-6 py-16 md:px-14">
        <div className="mb-2 flex items-baseline gap-4">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
            01
          </span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
            ESPECTRO IDEOLÓGICO
          </p>
        </div>
        <h2 className="mb-10 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          O deputado vota como se declara?
        </h2>

        {!bias ? (
          <p className="text-sm text-muted-foreground" style={{ fontFamily: MONO }}>
            Selecione um deputado acima para comparar viés declarado e comportamento de votação.
          </p>
        ) : (
          <div className="flex max-w-2xl flex-col gap-10">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                  Viés real <span className="ml-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>baseado em votos</span>
                </span>
                <span className="text-lg font-black text-primary" style={{ fontFamily: MONO }}>
                  {bias.realScore}/100
                </span>
              </div>
              <BiasBar score={bias.realScore} label={bias.realLabel} showCenter />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                  Viés declarado <span className="ml-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>discurso público</span>
                </span>
                <span className="text-sm text-muted-foreground" style={{ fontFamily: MONO }}>
                  {bias.declaredLabel}
                </span>
              </div>
              <BiasBar score={bias.declaredScore} label={bias.declaredLabel} color="#d4841a" />
            </div>

            <div className="grid grid-cols-2 gap-px border border-border" style={{ background: "rgba(240,236,228,0.08)" }}>
              <div className="bg-background px-6 py-6">
                <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                  CONSISTÊNCIA
                </p>
                <p className="text-4xl font-black" style={{ fontFamily: SERIF, color: bias.consistency >= 80 ? "#4a7c59" : "#d4841a" }}>
                  {bias.consistency}%
                </p>
              </div>
              <div className="bg-background px-6 py-6">
                <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                  DISCREPÂNCIA
                </p>
                <p className="text-4xl font-black" style={{ fontFamily: SERIF, color: discrepancy > 20 ? "#c41230" : "#4a7c59" }}>
                  {discrepancy} <span className="text-xl">pts</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 border border-border px-5 py-4" style={{ background: "rgba(196,18,48,0.06)" }}>
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: "#c41230" }} />
              <p className="text-sm leading-relaxed text-muted-foreground">{bias.notes}</p>
            </div>
          </div>
        )}
      </section>

      <section className="border-b border-border px-6 py-16 md:px-14">
        <div className="mb-2 flex items-baseline gap-4">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
            02
          </span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
            PARTIDO
          </p>
        </div>
        <h2 className="mb-10 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Qual o viés real do partido?
        </h2>

        {!activeParty ? (
          <p className="text-sm text-muted-foreground" style={{ fontFamily: MONO }}>
            Selecione um partido ou deputado para visualizar o posicionamento da legenda.
          </p>
        ) : (
          <div className="flex max-w-2xl flex-col gap-8">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                  {activeParty.full}
                </span>
                <span className="text-lg font-black text-primary" style={{ fontFamily: MONO }}>
                  {activeParty.score}/100
                </span>
              </div>
              <BiasBar score={activeParty.score} label={activeParty.label} color={activeParty.color} showCenter />
            </div>

            {bias ? (
              <div>
                <p className="mb-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  COMPARAÇÃO DEPUTADO x PARTIDO
                </p>
                <div className="relative h-12" style={{ background: "rgba(240,236,228,0.04)" }}>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #c41230 0%, #d4841a 50%, #1a3a7c 100%)", opacity: 0.1 }} />
                  <div className="absolute bottom-0 top-0 w-px opacity-20" style={{ left: "50%", background: "#f0ece4" }} />
                  <div className="absolute bottom-1 top-1 flex flex-col items-center" style={{ left: `calc(${activeParty.score}% - 1px)` }}>
                    <div className="h-full w-0.5 bg-amber-500 opacity-70" />
                    <span className="absolute -top-5 whitespace-nowrap text-xs" style={{ fontFamily: MONO, color: "#d4841a" }}>
                      PARTIDO
                    </span>
                  </div>
                  <div className="absolute bottom-1 top-1 flex flex-col items-center" style={{ left: `calc(${bias.realScore}% - 1px)` }}>
                    <div className="h-full w-0.5 bg-primary" />
                    <span className="absolute -bottom-5 whitespace-nowrap text-xs" style={{ fontFamily: MONO, color: "#c41230" }}>
                      DEPUTADO
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-px border border-border" style={{ background: "rgba(240,236,228,0.08)" }}>
              <div className="bg-background px-6 py-6">
                <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                  COESÃO INTERNA
                </p>
                <p className="text-4xl font-black" style={{ fontFamily: SERIF, color: activeParty.color }}>
                  {activeParty.consistency}%
                </p>
              </div>
              <div className="bg-background px-6 py-6">
                <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                  BANCADA
                </p>
                <p className="text-4xl font-black" style={{ fontFamily: SERIF, color: activeParty.color }}>
                  {activeParty.seats}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                MAPA COMPARATIVO DOS PARTIDOS
              </p>
              <div className="flex flex-col gap-3">
                {comportamentoParties.map((party) => (
                  <div key={party.id}>
                    <div className="mb-1 flex items-center gap-3">
                      <span className="w-12 flex-shrink-0 text-xs font-bold" style={{ fontFamily: MONO, color: party.color }}>
                        {party.name}
                      </span>
                      <div className="relative h-2 flex-1" style={{ background: "rgba(240,236,228,0.07)" }}>
                        <div style={{ width: `${party.score}%`, background: party.color, height: "100%" }} />
                      </div>
                      <span className="w-20 flex-shrink-0 text-xs" style={{ fontFamily: MONO, color: "#888888" }}>
                        {party.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="px-6 py-16 md:px-14">
        <div className="mb-2 flex items-baseline gap-4">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
            03
          </span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
            VOTAÇÕES
          </p>
        </div>
        <h2 className="mb-3 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Como votou em propostas específicas?
        </h2>
        <p className="mb-8 max-w-lg text-sm text-muted-foreground">
          Filtre propostas por tema, número ou título. Ao selecionar um deputado, a última coluna mostra seu voto mockado.
        </p>

        <div className="relative mb-8 max-w-xl">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            ⌕
          </span>
          <input
            value={propFilter}
            onChange={(event) => setPropFilter(event.target.value)}
            placeholder="Filtrar por tema, número ou título..."
            className="w-full border border-border bg-card py-3.5 pl-10 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {propFilter ? (
            <button onClick={() => setPropFilter("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
              x
            </button>
          ) : null}
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          {Object.entries(voteColor).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: color }} />
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-px overflow-x-auto border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
          <div className="grid min-w-[820px] gap-4 bg-background px-6 py-3" style={{ gridTemplateColumns: "120px 1fr 110px 120px 110px" }}>
            {["Nº / DATA", "PROPOSTA", "TEMA", "RESULTADO", "VOTO"].map((heading) => (
              <span key={heading} className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {heading}
              </span>
            ))}
          </div>

          {filteredProposals.length === 0 ? (
            <div className="min-w-[820px] bg-background px-6 py-8 text-center">
              <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                NENHUMA PROPOSTA ENCONTRADA
              </p>
            </div>
          ) : (
            filteredProposals.map((proposal) => {
              const vote = selectedDeputy ? votes[proposal.id] ?? "Ausente" : null;
              const result = resultColor[proposal.result];

              return (
                <div key={proposal.id} className="grid min-w-[820px] items-center gap-4 bg-background px-6 py-4 transition-colors hover:bg-card" style={{ gridTemplateColumns: "120px 1fr 110px 120px 110px" }}>
                  <div>
                    <p className="text-xs font-bold text-primary" style={{ fontFamily: MONO }}>
                      {proposal.id}
                    </p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {proposal.date}
                    </p>
                  </div>
                  <p className="text-sm leading-snug text-foreground">{proposal.title}</p>
                  <span className="border border-border px-2 py-0.5 text-center text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {proposal.theme}
                  </span>
                  <div>
                    <span className="block px-2 py-1 text-center text-xs" style={{ fontFamily: MONO, color: result.text, background: result.bg }}>
                      {proposal.result}
                    </span>
                    <p className="mt-1 text-center text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {proposal.placar}
                    </p>
                  </div>
                  {vote ? (
                    <span className="px-3 py-1.5 text-center text-sm font-bold" style={{ fontFamily: MONO, background: `${voteColor[vote]}22`, color: voteColor[vote] }}>
                      {vote}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      SELECIONE
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
