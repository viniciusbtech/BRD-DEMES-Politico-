import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import {
  deputiesEducation,
  educationColor,
  educationImageUrl,
  educationLevels,
  educationSummary,
  partyEducation,
  totalEducation,
  type DeputyEducation,
  type PartyEducation,
} from "../data/escolaridadeMock";

type EscolaridadePageProps = {
  onNavigateHome: () => void;
  onNavigateDeputado: () => void;
};

type TooltipValue = string | number | Array<string | number>;

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

const educationColors = educationLevels.map((item) => item.color);

export default function EscolaridadePage({ onNavigateHome, onNavigateDeputado }: EscolaridadePageProps) {
  const [depQuery, setDepQuery] = useState("");
  const [selectedDep, setSelectedDep] = useState<DeputyEducation | null>(null);
  const [depDropOpen, setDepDropOpen] = useState(false);
  const [partyQuery, setPartyQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState<PartyEducation | null>(null);
  const [partyDropOpen, setPartyDropOpen] = useState(false);

  const filteredDeps = useMemo(
    () =>
      deputiesEducation.filter(
        (deputy) =>
          deputy.name.toLowerCase().includes(depQuery.toLowerCase()) ||
          deputy.party.toLowerCase().includes(depQuery.toLowerCase()) ||
          deputy.education.toLowerCase().includes(depQuery.toLowerCase()),
      ),
    [depQuery],
  );

  const filteredParties = useMemo(
    () =>
      partyEducation.filter(
        (party) =>
          party.name.toLowerCase().includes(partyQuery.toLowerCase()) ||
          party.full.toLowerCase().includes(partyQuery.toLowerCase()),
      ),
    [partyQuery],
  );

  const partyChartData = selectedParty
    ? educationLevels.map((level, index) => ({
        label: level.shortLabel,
        fullLabel: level.label,
        value: selectedParty.values[index] ?? 0,
        color: level.color,
      }))
    : [];
  const partyTotal = partyChartData.reduce((sum, item) => sum + item.value, 0);
  const deputyList = depQuery ? filteredDeps : deputiesEducation;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateDeputado={onNavigateDeputado} />

      <PageHero
        n="8"
        tag="EDUCAÇÃO"
        title="Deputados"
        titleRed="e Escolaridade"
        desc="Quem representa o Brasil tem formação? Explore o nível de escolaridade dos deputados federais por indivíduo e por partido."
        imgId="photo-1633734973050-d6499a977c17"
        stripImgs={[
          { id: "photo-1590012314607-cda9d9b699ae", alt: "Capelo de formatura" },
          { id: "photo-1523580846011-d3a5bc25702b", alt: "Formanda" },
          { id: "photo-1551135049-8a33b5883817", alt: "Reunião profissional" },
        ]}
      />

      <section className="border-b border-border px-6 py-16 md:px-14">
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          PANORAMA
        </p>
        <h2 className="mb-10 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Escolaridade dos 513 deputados
        </h2>

        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={totalEducation} dataKey="percent" cx="50%" cy="50%" innerRadius="48%" outerRadius="76%" paddingAngle={2} labelLine={false}>
                  {totalEducation.map((item) => (
                    <Cell key={item.level} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                  formatter={(value: TooltipValue, _name: string, item: { payload?: { count?: number } }) => [`${value}% · ${item.payload?.count ?? 0} deputados`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-4">
            {totalEducation.map((item) => (
              <div key={item.level}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                      {item.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black" style={{ fontFamily: MONO, color: item.color }}>
                      {item.percent}%
                    </span>
                    <span className="w-16 text-right text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {item.count} dep.
                    </span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden" style={{ background: "rgba(240,236,228,0.06)" }}>
                  <div style={{ width: `${item.percent}%`, background: item.color, height: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px border border-border md:grid-cols-4" style={{ background: "rgba(240,236,228,0.07)" }}>
          {educationSummary.map((item) => (
            <div key={item.label} className="bg-background px-6 py-7">
              <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                {item.label}
              </p>
              <p className="mb-0.5 text-2xl font-black text-primary" style={{ fontFamily: SERIF }}>
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-border px-6 py-16 md:px-14">
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          DEPUTADOS
        </p>
        <h2 className="mb-3 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Escolaridade por deputado
        </h2>
        <p className="mb-8 max-w-lg text-sm text-muted-foreground">
          Busque um deputado pelo nome, partido ou nível de escolaridade.
        </p>

        <div className="relative mb-8 max-w-xl">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            ⌕
          </span>
          <input
            value={depQuery}
            onChange={(event) => {
              setDepQuery(event.target.value);
              setSelectedDep(null);
              setDepDropOpen(true);
            }}
            onFocus={() => setDepDropOpen(true)}
            placeholder="Nome, partido ou nível (ex: Doutorado)..."
            className="w-full border border-border bg-card py-3.5 pl-10 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {depQuery ? (
            <button
              onClick={() => {
                setDepQuery("");
                setSelectedDep(null);
                setDepDropOpen(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              x
            </button>
          ) : null}
          {depDropOpen ? (
            <div className="absolute left-0 right-0 top-full z-20 max-h-64 overflow-y-auto border border-border" style={{ background: "#141414" }}>
              {deputyList.map((deputy) => (
                <button
                  key={deputy.id}
                  onClick={() => {
                    setSelectedDep(deputy);
                    setDepQuery(deputy.name);
                    setDepDropOpen(false);
                  }}
                  className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
                >
                  <div className="h-9 w-9 flex-shrink-0 overflow-hidden">
                    <img src={educationImageUrl(deputy.img, 72, 72)} alt={deputy.name} className="h-full w-full object-cover" style={{ filter: "grayscale(40%)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                      {deputy.name}
                    </p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {deputy.party} · {deputy.state} · <span style={{ color: educationColor(deputy.education) }}>{deputy.education}</span>
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

        {selectedDep ? (
          <div className="relative mb-8 overflow-hidden border border-border" style={{ background: "#111111" }}>
            <div className="grid md:grid-cols-3">
              <div className="relative min-h-60 overflow-hidden">
                <img src={educationImageUrl(selectedDep.img, 600, 480)} alt={selectedDep.name} className="absolute inset-0 h-full w-full object-cover object-top" style={{ filter: "grayscale(30%) contrast(1.05)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(17,17,17,0) 60%, rgba(17,17,17,0.9) 100%)" }} />
              </div>
              <div className="flex flex-col justify-center px-8 py-8 md:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <span className="bg-primary px-2 py-0.5 text-xs text-primary-foreground" style={{ fontFamily: MONO }}>
                    {selectedDep.party}
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {selectedDep.state}
                  </span>
                </div>
                <h3 className="mb-6 text-3xl font-black text-foreground" style={{ fontFamily: SERIF }}>
                  {selectedDep.name}
                </h3>

                <div className="grid grid-cols-1 gap-px border border-border sm:grid-cols-3" style={{ background: "rgba(240,236,228,0.07)" }}>
                  {[
                    { label: "ESCOLARIDADE", value: selectedDep.education, color: educationColor(selectedDep.education) },
                    { label: "FORMAÇÃO", value: selectedDep.course, color: "#f0ece4" },
                    { label: "INSTITUIÇÃO", value: selectedDep.institution, color: "#f0ece4" },
                  ].map((item) => (
                    <div key={item.label} className="bg-background px-4 py-5">
                      <p className="mb-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        {item.label}
                      </p>
                      <p className="text-base font-black leading-tight" style={{ fontFamily: SERIF, color: item.color }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 inline-flex flex-wrap items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: educationColor(selectedDep.education) }} />
                  <span className="text-sm font-bold" style={{ color: educationColor(selectedDep.education), fontFamily: SERIF }}>
                    {selectedDep.education}
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {totalEducation.find((item) => item.level === selectedDep.education)?.percent ?? "-"}% dos deputados têm este nível
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <div className="flex min-w-[860px] flex-col gap-px border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
            <div className="grid grid-cols-5 gap-4 bg-background px-6 py-3">
              {["DEPUTADO", "PARTIDO · UF", "ESCOLARIDADE", "FORMAÇÃO", "INSTITUIÇÃO"].map((heading) => (
                <span key={heading} className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {heading}
                </span>
              ))}
            </div>
            {deputyList.map((deputy) => (
              <button
                key={deputy.id}
                onClick={() => {
                  setSelectedDep(deputy);
                  setDepQuery(deputy.name);
                  setDepDropOpen(false);
                }}
                className="grid grid-cols-5 items-center gap-4 bg-background px-6 py-3.5 text-left transition-colors hover:bg-card"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden">
                    <img src={educationImageUrl(deputy.img, 64, 64)} alt={deputy.name} className="h-full w-full object-cover" style={{ filter: "grayscale(40%)" }} />
                  </div>
                  <span className="truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                    {deputy.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {deputy.party} · {deputy.state}
                </span>
                <span className="text-xs font-bold" style={{ fontFamily: MONO, color: educationColor(deputy.education) }}>
                  {deputy.education}
                </span>
                <span className="truncate text-xs text-muted-foreground">{deputy.course}</span>
                <span className="text-xs text-muted-foreground">{deputy.institution}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-14">
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          PARTIDOS
        </p>
        <h2 className="mb-3 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Escolaridade por partido
        </h2>
        <p className="mb-8 max-w-lg text-sm text-muted-foreground">
          Selecione um partido para ver a distribuição do nível educacional dos seus deputados.
        </p>

        <div className="relative mb-8 max-w-xl">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            ⌕
          </span>
          <input
            value={partyQuery}
            onChange={(event) => {
              setPartyQuery(event.target.value);
              setSelectedParty(null);
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
                setSelectedParty(null);
                setPartyDropOpen(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              x
            </button>
          ) : null}
          {partyDropOpen ? (
            <div className="absolute left-0 right-0 top-full z-20 border border-border" style={{ background: "#141414" }}>
              {(partyQuery ? filteredParties : partyEducation).map((party) => (
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
                      {party.seats} deputados
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedParty ? (
          <div className="mb-10">
            <div className="mb-8 flex items-center gap-4 border-l-4 pl-5" style={{ borderColor: selectedParty.color }}>
              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center text-2xl font-black" style={{ background: selectedParty.color, fontFamily: SERIF, color: "#f0ece4" }}>
                {selectedParty.name}
              </span>
              <div>
                <p className="text-2xl font-black text-foreground" style={{ fontFamily: SERIF }}>
                  {selectedParty.full}
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {partyTotal} deputados com dados de escolaridade
                </p>
              </div>
            </div>

            <div className="grid items-start gap-10 md:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={partyChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: "#888880", fontSize: 9, fontFamily: MONO }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }} formatter={(value: TooltipValue) => [`${value} deputados`, ""]} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={48}>
                      {partyChartData.map((item) => (
                        <Cell key={item.label} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-3">
                {partyChartData.map((item) => {
                  const percent = partyTotal > 0 ? Math.round((item.value / partyTotal) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: item.color }} />
                          <span className="text-xs text-foreground">{item.fullLabel}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold" style={{ fontFamily: MONO, color: item.color }}>
                            {percent}%
                          </span>
                          <span className="w-12 text-right text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                            {item.value} dep.
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                        <div style={{ width: `${percent}%`, background: item.color, height: "100%" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <p className="mb-6 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          TABELA COMPARATIVA - TODOS OS PARTIDOS
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-muted-foreground" style={{ fontFamily: MONO }}>PARTIDO</th>
                {educationLevels.map((level) => (
                  <th key={level.key} className="whitespace-nowrap px-3 py-3 text-right text-xs" style={{ fontFamily: MONO, color: level.color }}>
                    {level.label.split(" ")[0]}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs text-muted-foreground" style={{ fontFamily: MONO }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {partyEducation.map((party) => {
                const total = party.values.reduce((sum, value) => sum + value, 0);
                return (
                  <tr
                    key={party.id}
                    className="cursor-pointer border-b border-border transition-colors hover:bg-card"
                    onClick={() => {
                      setSelectedParty(party);
                      setPartyQuery(party.full);
                      setPartyDropOpen(false);
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: party.color }} />
                        <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{party.name}</span>
                      </div>
                    </td>
                    {party.values.map((value, index) => (
                      <td key={`${party.id}-${educationLevels[index]?.key ?? index}`} className="px-3 py-3 text-right text-sm" style={{ fontFamily: MONO, color: value > 0 ? educationColors[index] : "#333333" }}>
                        {value > 0 ? value : "-"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-sm font-bold text-foreground" style={{ fontFamily: MONO }}>
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
