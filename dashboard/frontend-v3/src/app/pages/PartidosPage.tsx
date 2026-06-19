import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import {
  categorySpendingByParty,
  formatCurrency,
  influenceRank,
  parties,
  proposalsByParty,
  statusColor,
  wordsByParty,
  type Party,
} from "../data/partidosMock";

type PartidosPageProps = {
  onNavigateHome: () => void;
  onNavigateDeputado: () => void;
};

type TooltipValue = string | number | Array<string | number>;

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

const sectionTitleStyle = { fontFamily: SERIF, color: "#f0ece4" };

const getPartySpending = (party: Party) => categorySpendingByParty[party.id] ?? categorySpendingByParty.PL;
const getPartyWords = (party: Party) => wordsByParty[party.id] ?? wordsByParty.PL;
const getPartyProposals = (party: Party) => proposalsByParty[party.id] ?? proposalsByParty.PL;

export default function PartidosPage({ onNavigateHome, onNavigateDeputado }: PartidosPageProps) {
  const [selected, setSelected] = useState<Party>(parties[0]);
  const [partyQuery, setPartyQuery] = useState("");
  const [showPartyDrop, setShowPartyDrop] = useState(false);

  const filteredParties = useMemo(
    () =>
      parties.filter(
        (party) =>
          party.full.toLowerCase().includes(partyQuery.toLowerCase()) ||
          party.name.toLowerCase().includes(partyQuery.toLowerCase()),
      ),
    [partyQuery],
  );

  const categoryData = getPartySpending(selected);
  const words = getPartyWords(selected);
  const proposals = getPartyProposals(selected);
  const totalSpending = categoryData.reduce((sum, item) => sum + item.value, 0);
  const sortedParties = [...parties].sort((a, b) => b.presence - a.presence);
  const presenceRank = sortedParties.findIndex((party) => party.id === selected.id) + 1;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateDeputado={onNavigateDeputado} />

      <PageHero
        n="3"
        tag="AGREMIAÇÕES"
        title="Partidos"
        desc="Selecione um partido para ver presença, gastos, proposições, nuvem de palavras e ranking de influência."
        imgId="photo-1699112204356-532841a77e07"
        stripImgs={[
          { id: "photo-1741030766598-d4810a5a7563", alt: "Manifestação com megafone" },
          { id: "photo-1567965142886-f347ae9b829b", alt: "Bandeira política" },
          { id: "photo-1561489396-888724a1543d", alt: "Reunião de líderes" },
        ]}
      />

      <div className="border-b border-border px-6 py-8 md:px-14">
        <p className="mb-4 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          SELECIONE UM PARTIDO
        </p>
        <div className="relative max-w-xl">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            ⌕
          </span>
          <input
            value={partyQuery}
            onChange={(event) => {
              setPartyQuery(event.target.value);
              setShowPartyDrop(true);
            }}
            onFocus={() => setShowPartyDrop(true)}
            placeholder="Nome ou sigla do partido..."
            className="w-full border border-border bg-card py-3.5 pl-10 pr-12 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {partyQuery ? (
            <button
              onClick={() => {
                setPartyQuery("");
                setShowPartyDrop(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              x
            </button>
          ) : null}

          {showPartyDrop ? (
            <div className="absolute left-0 right-0 top-full z-20 border border-border" style={{ background: "#141414" }}>
              {(partyQuery ? filteredParties : parties).map((party) => (
                <button
                  key={party.id}
                  onClick={() => {
                    setSelected(party);
                    setPartyQuery(party.full);
                    setShowPartyDrop(false);
                  }}
                  className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-black" style={{ background: party.color, fontFamily: SERIF, color: "#f0ece4" }}>
                    {party.name}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                      {party.full}
                    </span>
                    <span className="block text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {party.seats} deputados · presença média {party.presence}%
                    </span>
                  </span>
                  {selected.id === party.id ? (
                    <span className="shrink-0 text-xs text-primary" style={{ fontFamily: MONO }}>
                      SELECIONADO
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-5 border-b border-border px-6 py-8 md:px-14" style={{ borderLeft: `4px solid ${selected.color}`, background: "#111111" }}>
        <div>
          <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: SERIF }}>
            {selected.full}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            {selected.seats} DEPUTADOS FEDERAIS
          </p>
        </div>
      </div>

      <section className="border-b border-border px-6 py-14 md:px-14">
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          PRESENÇA
        </p>
        <h3 className="mb-10 text-3xl font-black" style={sectionTitleStyle}>
          Esse partido tem presença?
        </h3>

        <div className="grid grid-cols-1 gap-px border border-border md:grid-cols-3" style={{ background: "rgba(240,236,228,0.07)" }}>
          {[
            { label: "PRESENÇA MÉDIA", value: `${selected.presence}%`, note: "nas votações nominais" },
            { label: "AUSÊNCIAS JUSTIFICADAS", value: `${100 - selected.presence - 4}%`, note: "com justificativa formal" },
            { label: "AUSÊNCIAS SEM JUSTIF.", value: "4%", note: "sem registro de motivo" },
          ].map((item) => (
            <div key={item.label} className="bg-background px-8 py-8">
              <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                {item.label}
              </p>
              <p className="mb-1 text-4xl font-black text-primary" style={{ fontFamily: SERIF }}>
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {item.note}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>AUSENTE</span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>PRESENTE</span>
          </div>
          <div className="h-4 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
            <div style={{ width: `${selected.presence}%`, background: selected.color, height: "100%" }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            {presenceRank}º lugar em presença entre os partidos listados
          </p>
        </div>

        <div className="mt-10 h-52">
          <p className="mb-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            COMPARATIVO DE PRESENÇA - TODOS OS PARTIDOS
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedParties}>
              <XAxis dataKey="name" tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value}%`} />
              <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }} formatter={(value: TooltipValue) => [`${value}%`, "Presença"]} />
              <Bar dataKey="presence" radius={[2, 2, 0, 0]} maxBarSize={48}>
                {sortedParties.map((party) => (
                  <Cell key={party.id} fill={party.id === selected.id ? selected.color : "rgba(240,236,228,0.12)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="border-b border-border px-6 py-14 md:px-14">
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          DESPESAS
        </p>
        <h3 className="mb-10 text-3xl font-black" style={sectionTitleStyle}>
          Como o partido gasta?
        </h3>

        <div className="grid items-start gap-10 md:grid-cols-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius="50%" outerRadius="78%" paddingAngle={2}>
                  {categoryData.map((category) => (
                    <Cell key={category.category} fill={category.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }} formatter={(value: TooltipValue) => [formatCurrency(Number(value)), ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col justify-center gap-3">
            {categoryData.map((category) => {
              const percent = Math.round((category.value / totalSpending) * 100);
              return (
                <div key={category.category}>
                  <div className="mb-1 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: category.color }} />
                      <span className="text-xs text-foreground">{category.category}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground" style={{ fontFamily: MONO }}>
                      {percent}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                    <div style={{ width: `${percent}%`, background: category.color, height: "100%" }} />
                  </div>
                </div>
              );
            })}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>TOTAL GASTO</span>
              <span className="text-lg font-black text-primary" style={{ fontFamily: SERIF }}>{formatCurrency(totalSpending)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-6 py-14 md:px-14">
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          LEGISLAÇÃO
        </p>
        <h3 className="mb-10 text-3xl font-black" style={sectionTitleStyle}>
          Quais proposições desse partido?
        </h3>

        <div className="flex flex-col gap-px overflow-x-auto border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
          <div className="grid min-w-[760px] gap-4 bg-background px-6 py-3" style={{ gridTemplateColumns: "120px 1fr 150px 110px" }}>
            {["Nº / DATA", "TÍTULO", "AUTOR", "STATUS"].map((heading) => (
              <span key={heading} className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {heading}
              </span>
            ))}
          </div>

          {proposals.map((proposal) => (
            <div key={proposal.id} className="grid min-w-[760px] items-center gap-4 bg-background px-6 py-4 transition-colors hover:bg-card" style={{ gridTemplateColumns: "120px 1fr 150px 110px" }}>
              <div>
                <p className="text-xs font-bold text-primary" style={{ fontFamily: MONO }}>{proposal.id}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{proposal.date}</p>
              </div>
              <p className="text-sm leading-snug text-foreground">{proposal.title}</p>
              <p className="truncate text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{proposal.author}</p>
              <span className="px-2 py-1 text-center text-xs" style={{ fontFamily: MONO, color: statusColor[proposal.status], background: `${statusColor[proposal.status]}18` }}>
                {proposal.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-border px-6 py-14 md:px-14">
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          TEMAS
        </p>
        <h3 className="mb-4 text-3xl font-black" style={sectionTitleStyle}>
          Nuvem de palavras do partido
        </h3>
        <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-x-6 gap-y-4 border border-border p-10" style={{ background: "#111111" }}>
          {words.map((word) => (
            <span key={word.word} className="select-none transition-opacity hover:opacity-100" style={{ fontFamily: SERIF, fontWeight: word.weight, fontSize: `${word.size}rem`, color: selected.color, opacity: 0.3 + word.size * 0.25 }}>
              {word.word}
            </span>
          ))}
        </div>
      </section>

      <section className="px-6 py-14 md:px-14">
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          PODER
        </p>
        <h3 className="mb-10 text-3xl font-black" style={sectionTitleStyle}>
          Ranking de influência - Top 5
        </h3>
        <div className="flex max-w-2xl flex-col gap-5">
          {influenceRank.map((rank, index) => (
            <div key={rank.party} className="flex items-center gap-5 border px-6 py-5 transition-colors" style={{ background: "#111111", borderColor: rank.party === selected.name ? rank.color : "rgba(240,236,228,0.1)" }}>
              <span className="shrink-0 text-4xl font-black" style={{ fontFamily: SERIF, color: `${rank.color}60` }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-foreground" style={{ fontFamily: SERIF }}>{rank.party}</span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{rank.seats} cadeiras</span>
                  </div>
                  <span className="text-2xl font-black" style={{ fontFamily: SERIF, color: rank.color }}>{rank.score}</span>
                </div>
                <div className="h-2 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                  <div style={{ width: `${rank.score}%`, background: rank.color, height: "100%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
