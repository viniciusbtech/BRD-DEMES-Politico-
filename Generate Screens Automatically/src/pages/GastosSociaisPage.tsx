import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { fmt } from "../data";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

const TOTAL_CEAP = 1_480_000_000;

const SOCIAL_ITEMS = [
  { id: "casas",       label: "Casas populares",              icon: "🏠", unit: "casas",        cost: 150_000, color: "#c41230" },
  { id: "leitos",      label: "Leitos de UTI",                icon: "🏥", unit: "leitos",       cost: 100_000, color: "#d4841a" },
  { id: "salas",       label: "Salas de aula",                icon: "🏫", unit: "salas",        cost: 80_000,  color: "#4a7c59" },
  { id: "bolsas",      label: "Bolsas universitárias/ano",    icon: "🎓", unit: "bolsas",       cost: 24_000,  color: "#2e5fa3" },
  { id: "saneamento",  label: "Famílias com saneamento",      icon: "💧", unit: "famílias",     cost: 5_000,   color: "#7b3fa0" },
  { id: "merenda",     label: "Crianças com merenda/ano",     icon: "🍽️", unit: "crianças",     cost: 1_500,   color: "#c8970a" },
];

const SLIDERS = [
  { id: "ceap",      label: "Cota Parlamentar (CEAP)",          max: 1_480_000_000, description: "Gasto total com reembolso de atividades parlamentares" },
  { id: "gabinete",  label: "Salários de Assessores",           max: 890_000_000,   description: "Custo anual com até 25 assessores por deputado" },
  { id: "divulgacao",label: "Divulgação de Atividade Parl.",    max: 370_000_000,   description: "Verba para publicidade e propaganda dos mandatos" },
  { id: "viagens",   label: "Viagens e Missões Internacionais", max: 230_000_000,   description: "Passagens e diárias em missões no exterior" },
];

const OPPORTUNITY_COST = [
  { saving: 25,  headline: "Com 25% de economia...",    description: "R$ 370 milhões livres — daria para construir 2.467 casas, abrir 4.625 leitos de UTI e garantir merenda para 246 mil crianças por um ano inteiro." },
  { saving: 50,  headline: "Com 50% de economia...",    description: "R$ 740 milhões livres — equivale a 4.933 casas populares, 154.000 bolsas universitárias ou saneamento básico para quase 150 mil famílias." },
  { saving: 75,  headline: "Com 75% de economia...",    description: "R$ 1,1 bilhão livres — 7.400 casas, 462 mil bolsas universitárias, saneamento para 222 mil famílias. Tudo ao mesmo tempo." },
  { saving: 100, headline: "Com o valor total da CEAP...", description: "R$ 1,48 bilhão — 9.867 casas populares, 14.800 leitos de UTI, 18.500 salas de aula, 61.667 bolsas ou merenda para 987 mil crianças." },
];

export default function GastosSociaisPage() {
  const [savings, setSavings] = useState(50);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({
    ceap: 1_480_000_000,
    gabinete: 890_000_000,
    divulgacao: 370_000_000,
    viagens: 230_000_000,
  });
  const [glitch, setGlitch] = useState(false);

  // Glitch effect trigger
  useEffect(() => {
    const trigger = () => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 400);
    };
    const interval = setInterval(trigger, 4000);
    return () => clearInterval(interval);
  }, []);

  const savedAmount = Math.round((savings / 100) * TOTAL_CEAP);
  const totalParliamentary = Object.values(sliderValues).reduce((a, b) => a + b, 0);
  const maxPossible = SLIDERS.reduce((a, s) => a + s.max, 0);
  const wasteRatio = totalParliamentary / maxPossible;

  const opp = OPPORTUNITY_COST.find((o) => o.saving >= savings) ?? OPPORTUNITY_COST[3];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes glitch-1 {
          0%   { transform: translateX(0) skewX(0deg); opacity: 1; }
          10%  { transform: translateX(-4px) skewX(-2deg); opacity: 0.9; clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); }
          20%  { transform: translateX(4px) skewX(2deg); color: #0ff; }
          30%  { transform: translateX(-2px); clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
          40%  { transform: translateX(0); color: #f0ece4; clip-path: none; }
          100% { transform: translateX(0); opacity: 1; clip-path: none; }
        }
        @keyframes glitch-2 {
          0%   { transform: translateX(0); opacity: 0; }
          10%  { transform: translateX(3px); opacity: 0.7; color: #f00; }
          20%  { transform: translateX(-3px); color: #0f0; }
          30%  { transform: translateX(0); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes flicker {
          0%, 95%, 100% { opacity: 1; }
          96%            { opacity: 0.7; }
          97%            { opacity: 1; }
          98%            { opacity: 0.5; }
          99%            { opacity: 1; }
        }
        .glitch-text { animation: glitch-1 0.4s steps(1) forwards; }
        .glitch-shadow {
          position: absolute; inset: 0;
          animation: glitch-2 0.4s steps(1) forwards;
          pointer-events: none; user-select: none;
        }
        .scanline {
          position: fixed; inset-x-0; top: 0; height: 3px;
          background: rgba(240,236,228,0.04);
          animation: scanline 6s linear infinite;
          pointer-events: none; z-index: 999;
        }
        .flicker { animation: flicker 8s ease-in-out infinite; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; background: rgba(240,236,228,0.1); outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: #c41230; cursor: pointer; }
        input[type=range]::-moz-range-thumb { width: 20px; height: 20px; background: #c41230; cursor: pointer; border: none; border-radius: 0; }
      `}</style>

      {/* Scanline overlay */}
      <div className="scanline" />

      <NavBar />

      {/* ── HERO GLITCH ── */}
      <div className="relative px-6 md:px-14 pt-20 pb-16 border-b border-border overflow-hidden">
        {/* background — social problem photos mosaic */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {[
            { id: "photo-1607920609380-4ce0f52486a9", alt: "Desigualdade" },
            { id: "photo-1601195496005-f4f6092b0c69", alt: "Pobreza" },
            { id: "photo-1572506532104-a982a90beccc", alt: "Vulnerabilidade" },
          ].map((s) => (
            <div key={s.id} className="relative overflow-hidden">
              <img src={`https://images.unsplash.com/${s.id}?w=600&h=700&fit=crop&auto=format`}
                alt={s.alt} className="w-full h-full object-cover"
                style={{ filter: "grayscale(80%) contrast(1.2) brightness(0.32)" }} />
            </div>
          ))}
        </div>
        <div className="absolute inset-0" style={{ background: "rgba(10,10,10,0.78)" }} />
        {/* noise overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-15"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "200px" }} />

        <p className="text-xs tracking-[0.35em] text-primary mb-4 flicker" style={{ fontFamily: MONO }}>
          04 — GASTOS E PROBLEMAS SOCIAIS
        </p>

        <div className="relative mb-6">
          <h1
            className={`text-5xl md:text-7xl font-black leading-tight ${glitch ? "glitch-text" : ""}`}
            style={{ fontFamily: SERIF, color: "#f0ece4" }}>
            E SE o dinheiro<br />fosse para o<br /><span className="text-primary">povo?</span>
          </h1>
          {glitch && (
            <h1 className="glitch-shadow text-5xl md:text-7xl font-black leading-tight"
              style={{ fontFamily: SERIF, color: "#0ff", mixBlendMode: "screen" }}>
              E SE o dinheiro<br />fosse para o<br />povo?
            </h1>
          )}
        </div>

        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mb-3" style={{ fontWeight: 300 }}>
          R$ 1,48 bilhão em Cota Parlamentar por legislatura. Enquanto deputados reembolsam passagens e
          jantares, hospitais fecham alas, escolas não têm cadeiras e famílias vivem sem esgoto.
        </p>
        <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
          ESTA PÁGINA NÃO TEM FILTROS — TEM NÚMEROS.
        </p>

        {/* big stat */}
        <div className="mt-12 inline-block border border-primary p-6" style={{ background: "rgba(196,18,48,0.06)" }}>
          <p className="text-xs tracking-widest text-primary mb-1" style={{ fontFamily: MONO }}>CUSTO DA CEAP POR LEGISLATURA</p>
          <p className={`text-6xl font-black text-primary ${glitch ? "glitch-text" : ""}`}
            style={{ fontFamily: SERIF }}>R$ 1,48 bi</p>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: MONO }}>
            = R$ 2.884.405 por deputado · 4 anos
          </p>
        </div>
      </div>

      {/* ── SLIDER DE ORÇAMENTO ── */}
      <section className="px-6 md:px-14 py-16 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>PAINEL ECONÔMICO</p>
        <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Arraste o slider de economia
        </h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-lg">
          Quanto poderíamos economizar cortando parte dos gastos parlamentares?
          Arraste e veja o que seria possível financiar em troca.
        </p>

        {/* Main savings slider */}
        <div className="max-w-2xl mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-foreground">% da CEAP economizada</span>
            <span className="text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>{savings}%</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={savings}
            onChange={(e) => setSavings(Number(e.target.value))}
            className="w-full mb-3" />
          <div className="flex justify-between text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            <span>R$ 0</span>
            <span className="text-primary font-bold">{fmt(savedAmount)} liberados</span>
            <span>R$ 1,48 bi</span>
          </div>
        </div>

        {/* What we could build */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {SOCIAL_ITEMS.map((item) => {
            const count = Math.floor(savedAmount / item.cost);
            const opacity = savings === 0 ? 0.15 : 0.3 + (savings / 100) * 0.7;
            const scale = savings === 0 ? 0.7 : 0.85 + (savings / 100) * 0.15;
            return (
              <div key={item.id}
                className="border border-border p-5 transition-all duration-500"
                style={{ background: "#111", borderColor: savings > 0 ? item.color + "60" : "rgba(240,236,228,0.1)" }}>
                <span className="text-2xl block mb-3" style={{ opacity }}>
                  {item.icon}
                </span>
                <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: MONO }}>
                  {item.label.toUpperCase()}
                </p>
                <p className="font-black transition-all duration-500"
                  style={{
                    fontFamily: SERIF,
                    fontSize: `${scale * 2}rem`,
                    color: item.color,
                    opacity,
                    lineHeight: 1,
                  }}>
                  {savings === 0 ? "—" : count.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: MONO }}>
                  {item.unit} · {fmt(item.cost)}/un.
                </p>
              </div>
            );
          })}
        </div>

        {/* Opportunity cost narrative */}
        <div
          className="border-l-4 border-primary px-6 py-5 transition-all duration-700"
          style={{ background: "rgba(196,18,48,0.06)", opacity: savings > 0 ? 1 : 0.3 }}>
          <p className="text-xs text-primary mb-2" style={{ fontFamily: MONO }}>{opp.headline.toUpperCase()}</p>
          <p className="text-base text-foreground leading-relaxed">{opp.description}</p>
        </div>
      </section>

      {/* ── SLIDERS DE CATEGORIAS ── */}
      <section className="px-6 md:px-14 py-16 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>CATEGORIAS DE GASTO</p>
        <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Onde está o dinheiro?
        </h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-lg">
          Cada slider representa uma categoria real de gasto parlamentar.
          Conforme você aumenta o valor, observe o que deixamos de financiar.
        </p>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Sliders */}
          <div className="flex flex-col gap-8">
            {SLIDERS.map((s) => {
              const val = sliderValues[s.id] ?? 0;
              const pct = Math.round((val / s.max) * 100);
              return (
                <div key={s.id}>
                  <div className="flex items-start justify-between mb-1 gap-4">
                    <div>
                      <p className="text-sm font-bold text-foreground mb-0.5">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                    <span className="text-lg font-black text-primary flex-shrink-0"
                      style={{ fontFamily: SERIF }}>{pct}%</span>
                  </div>
                  <input type="range" min={0} max={s.max} step={Math.round(s.max / 100)}
                    value={val}
                    onChange={(e) => setSliderValues((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))}
                    className="w-full mt-3 mb-1" />
                  <p className="text-xs text-right text-muted-foreground" style={{ fontFamily: MONO }}>
                    {fmt(val)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Live effect panel */}
          <div className="border border-border p-6" style={{ background: "#111" }}>
            <p className="text-xs text-muted-foreground mb-6" style={{ fontFamily: MONO }}>
              IMPACTO EM PROGRAMAS SOCIAIS
            </p>

            {[
              { label: "Verba para Universidades Públicas", base: 49_000_000_000 },
              { label: "Salário Mínimo Nacional",            base: 1_412 },
              { label: "Programa Bolsa Família",             base: 168_000_000_000 },
              { label: "Investimento em Saneamento",         base: 12_000_000_000 },
              { label: "Merenda Escolar (PNAE)",             base: 8_000_000_000 },
            ].map((prog) => {
              const fade = Math.max(0.08, 1 - wasteRatio * 0.85);
              const sizeMult = Math.max(0.6, 1 - wasteRatio * 0.4);
              return (
                <div key={prog.label} className="mb-5 transition-all duration-700">
                  <p className="text-xs text-muted-foreground mb-1 transition-all duration-700"
                    style={{ fontFamily: MONO, opacity: Math.max(0.2, fade) }}>
                    {prog.label.toUpperCase()}
                  </p>
                  <p className="font-black transition-all duration-700"
                    style={{
                      fontFamily: SERIF,
                      fontSize: `${sizeMult * 1.6}rem`,
                      color: "#f0ece4",
                      opacity: fade,
                      filter: wasteRatio > 0.7 ? `blur(${(wasteRatio - 0.7) * 6}px)` : "none",
                    }}>
                    {typeof prog.base === "number" && prog.base > 1000
                      ? fmt(Math.round(prog.base * fade))
                      : `R$ ${Math.round(prog.base * fade).toLocaleString("pt-BR")}`}
                  </p>
                  <div className="h-px mt-2" style={{ background: `rgba(240,236,228,${fade * 0.15})` }} />
                </div>
              );
            })}

            {wasteRatio > 0.8 && (
              <div className={`mt-4 p-3 ${glitch ? "glitch-text" : ""}`}
                style={{ background: "rgba(196,18,48,0.15)", border: "1px solid rgba(196,18,48,0.4)" }}>
                <p className="text-xs text-primary" style={{ fontFamily: MONO }}>
                  ⚠ ALERTA — GASTO MÁXIMO ATIVADO
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Com esse nível de gasto parlamentar, programas sociais operam no limite mínimo.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── GLITCH MANIFESTO ── */}
      <section className="relative px-6 md:px-14 py-20 overflow-hidden" style={{ background: "#0d0000" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(196,18,48,0.03) 2px, rgba(196,18,48,0.03) 4px)" }} />

        <div className="relative z-10 max-w-3xl">
          <p className="text-xs tracking-[0.4em] text-primary mb-6 flicker" style={{ fontFamily: MONO }}>
            ERRO DO SISTEMA · DADOS NÃO ENCONTRADOS
          </p>

          {[
            { text: "R$ 1.480.000.000 gastos.", sub: "9.867 casas que não foram construídas." },
            { text: "R$ 890.000.000 em assessores.", sub: "37.083 bolsas universitárias extintas." },
            { text: "R$ 370.000.000 em divulgação.", sub: "246.666 crianças sem merenda." },
            { text: "R$ 230.000.000 em viagens.", sub: "46.000 famílias sem saneamento." },
          ].map((line, i) => (
            <div key={i} className="mb-8 relative">
              <p className={`font-black leading-none mb-1 transition-all ${glitch && i % 2 === 0 ? "glitch-text" : ""}`}
                style={{
                  fontFamily: SERIF,
                  fontSize: "clamp(1.5rem, 4vw, 3rem)",
                  color: "#f0ece4",
                }}>
                {line.text}
              </p>
              <p className="text-base leading-relaxed"
                style={{ color: "#c41230", fontFamily: MONO, fontSize: "0.85rem" }}>
                → {line.sub}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
