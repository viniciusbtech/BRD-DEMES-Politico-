import { useEffect, useMemo, useState, type CSSProperties } from "react";
import NavBar from "../components/NavBar";
import { useTheme } from "../../contexts/ThemeContext";
import {
  formatCurrency,
  luxuryComparisons,
  manifestLines,
  opportunityCosts,
  socialItems,
  socialPrograms,
  spendingSliders,
  totalCeap,
  workInsights,
} from "../data/gastosSociaisMock";

type GastosSociaisPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
  onNavigateRecorte: (path: string) => void;
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

const initialSliderValues = spendingSliders.reduce<Record<string, number>>((values, slider) => {
  values[slider.id] = slider.max;
  return values;
}, {});

// Fundo P&B de problema social, atrás do conteúdo de cada seção (legível por cima via -z-10).
function SectionProblemBg({ img }: { img: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <img
        src={img}
        alt=""
        className="h-full w-full object-cover"
        style={{ filter: "grayscale(100%) contrast(1.12) brightness(0.4)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.84) 0%, rgba(10,10,10,0.92) 100%)" }}
      />
    </div>
  );
}

export default function GastosSociaisPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado, onNavigateRecorte }: GastosSociaisPageProps) {
  const { theme } = useTheme();
  type GastosSection = "painel-economico" | "curiosidades" | "categorias" | "construir";
  const [activeSection, setActiveSection] = useState<GastosSection>("painel-economico");
  const RED = "#e00836";
  const [savings, setSavings] = useState(50);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(initialSliderValues);
  const [glitch, setGlitch] = useState(false);
  const [heroTarget, setHeroTarget] = useState<"deputado" | "povo">("povo");
  const isDark = theme === "dark";
  const lightModeColorOverrides = (!isDark
    ? {
        "--muted-foreground": "#0069ff",
        "--foreground": "#4c814f",
        "--primary": "#007fff",
        "--primary-rgb": "0, 127, 255",
        "--ring": "#007fff",
      }
    : {}) as CSSProperties;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGlitch(true);
      window.setTimeout(() => setGlitch(false), 400);
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroTarget((current) => (current === "povo" ? "deputado" : "povo"));
    }, 2500);
    return () => window.clearInterval(interval);
  }, []);

  const savedAmount = Math.round((savings / 100) * totalCeap);
  const totalParliamentary = Object.values(sliderValues).reduce((sum, value) => sum + value, 0);
  const maxPossible = spendingSliders.reduce((sum, slider) => sum + slider.max, 0);
  const wasteRatio = totalParliamentary / maxPossible;
  const opportunity = useMemo(
    () => opportunityCosts.find((item) => item.saving >= savings) ?? opportunityCosts[opportunityCosts.length - 1],
    [savings],
  );

  return (
    <>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateRecorte={onNavigateRecorte} />
    <div
      className="min-h-screen overflow-x-hidden bg-background"
      style={{ fontFamily: "'Inter', sans-serif", ...lightModeColorOverrides }}
    >
      <style>{`
        @keyframes gastos-glitch-1 {
          0% { transform: translateX(0) skewX(0deg); opacity: 1; }
          10% { transform: translateX(-4px) skewX(-2deg); opacity: 0.9; clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); }
          20% { transform: translateX(4px) skewX(2deg); color: #0ff; }
          30% { transform: translateX(-2px); clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
          40%, 100% { transform: translateX(0); color: #f0ece4; clip-path: none; opacity: 1; }
        }
        @keyframes gastos-glitch-2 {
          0% { transform: translateX(0); opacity: 0; }
          10% { transform: translateX(3px); opacity: 0.7; color: #f00; }
          20% { transform: translateX(-3px); color: #0f0; }
          30%, 100% { transform: translateX(0); opacity: 0; }
        }
        @keyframes gastos-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes gastos-flicker {
          0%, 95%, 100% { opacity: 1; }
          96% { opacity: 0.7; }
          97% { opacity: 1; }
          98% { opacity: 0.5; }
          99% { opacity: 1; }
        }
        .gastos-glitch-text { animation: gastos-glitch-1 0.4s steps(1) forwards; }
        .gastos-glitch-shadow {
          position: absolute;
          inset: 0;
          animation: gastos-glitch-2 0.4s steps(1) forwards;
          pointer-events: none;
          user-select: none;
        }
        .gastos-scanline {
          position: fixed;
          inset-x: 0;
          top: 0;
          height: 3px;
          background: rgba(240,236,228,0.04);
          animation: gastos-scanline 6s linear infinite;
          pointer-events: none;
          z-index: 999;
        }
        .gastos-flicker { animation: gastos-flicker 8s ease-in-out infinite; }
        .gastos-word-swap {
          position: relative;
          display: inline-block;
          animation: gastos-word-in 0.55s cubic-bezier(0.2, 0.9, 0.1, 1) both;
        }
        .gastos-word-swap::before,
        .gastos-word-swap::after {
          content: attr(data-text);
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          pointer-events: none;
          user-select: none;
          mix-blend-mode: screen;
        }
        .gastos-word-swap::before { color: #0ff; animation: gastos-word-cyan 0.55s steps(2) both; }
        .gastos-word-swap::after  { color: #f0f; animation: gastos-word-magenta 0.55s steps(2) both; }
        @keyframes gastos-word-in {
          0%   { opacity: 0; transform: translateY(0.14em) scale(1.08) skewX(10deg); filter: blur(3px); clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); }
          14%  { opacity: 1; filter: blur(0); clip-path: polygon(0 0, 100% 0, 100% 42%, 0 42%); transform: translateX(-8px) skewX(-7deg); }
          30%  { clip-path: polygon(0 52%, 100% 52%, 100% 100%, 0 100%); transform: translateX(8px) skewX(7deg); }
          46%  { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); transform: translateX(-4px) skewX(0deg); }
          64%  { transform: translateX(4px); }
          82%  { transform: translateX(-2px); }
          100% { opacity: 1; transform: translateX(0) scale(1) skewX(0); clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
        }
        @keyframes gastos-word-cyan {
          0%   { opacity: 0; transform: translate(0, 0); }
          18%  { opacity: 0.85; transform: translate(-5px, 2px); }
          50%  { opacity: 0.55; transform: translate(4px, -2px); }
          78%  { opacity: 0.3; transform: translate(-2px, 1px); }
          100% { opacity: 0; transform: translate(0, 0); }
        }
        @keyframes gastos-word-magenta {
          0%   { opacity: 0; transform: translate(0, 0); }
          18%  { opacity: 0.85; transform: translate(5px, -2px); }
          50%  { opacity: 0.55; transform: translate(-4px, 2px); }
          78%  { opacity: 0.3; transform: translate(2px, -1px); }
          100% { opacity: 0; transform: translate(0, 0); }
        }
        .gastos-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: rgba(240,236,228,0.1);
          outline: none;
          cursor: pointer;
        }
        .gastos-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #c41230;
          cursor: pointer;
        }
        .gastos-range::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #c41230;
          cursor: pointer;
          border: none;
          border-radius: 0;
        }
      `}</style>

      <div className="gastos-scanline" />

      <div className="relative overflow-hidden border-b border-border px-6 pb-16 pt-20 md:px-14">
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {[
            { id: "photo-1607920609380-4ce0f52486a9", alt: "Desigualdade urbana" },
            { id: "photo-1601195496005-f4f6092b0c69", alt: "Pobreza" },
            { id: "photo-1572506532104-a982a90beccc", alt: "Vulnerabilidade social" },
          ].map((photo) => (
            <div key={photo.id} className="relative overflow-hidden">
              <img
                src={`https://images.unsplash.com/${photo.id}?w=600&h=700&fit=crop&auto=format`}
                alt={photo.alt}
                className="h-full w-full object-cover"
                style={{ filter: "grayscale(80%) contrast(1.2) brightness(0.32)" }}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0" style={{ background: "rgba(10,10,10,0.78)" }} />
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "200px",
          }}
        />

        <div className="relative z-10">
          <p className="gastos-flicker mb-4 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
            04 — GASTOS E PROBLEMAS SOCIAIS
          </p>

          <div className="relative mb-6">
            <h1
              className={`text-5xl font-black leading-tight md:text-7xl ${glitch ? "gastos-glitch-text" : ""}`}
              style={{ fontFamily: SERIF, color: "#f0ece4" }}
            >
              E SE o dinheiro
              <br />
              fosse para o
              <br />
              <span
                key={heroTarget}
                data-text={`${heroTarget}?`}
                className="gastos-word-swap text-primary"
              >
                {heroTarget}?
              </span>
            </h1>
            {glitch ? (
              <h1
                className="gastos-glitch-shadow text-5xl font-black leading-tight md:text-7xl"
                style={{ fontFamily: SERIF, color: "#0ff", mixBlendMode: "screen" }}
              >
                E SE o dinheiro
                <br />
                fosse para o
                <br />
                {heroTarget}?
              </h1>
            ) : null}
          </div>

          <p className="mb-3 max-w-2xl text-lg leading-relaxed text-muted-foreground" style={{ fontWeight: 300 }}>
            R$ 1,48 bilhão em cota parlamentar por legislatura. Enquanto despesas são reembolsadas,
            hospitais fecham alas, escolas não têm estrutura e famílias vivem sem esgoto.
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            ESTA PÁGINA NÃO TEM FILTROS — TEM NÚMEROS.
          </p>

          <div className="mt-12 inline-block border border-primary p-6" style={{ background: "rgba(196,18,48,0.06)" }}>
            <p className="mb-1 text-xs tracking-widest text-primary" style={{ fontFamily: MONO }}>
              CUSTO DA CEAP POR LEGISLATURA
            </p>
            <p className={`text-6xl font-black text-primary ${glitch ? "gastos-glitch-text" : ""}`} style={{ fontFamily: SERIF }}>
              R$ 1,48 bi
            </p>
            <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              = R$ 2.884.405 por deputado · 4 anos
            </p>
          </div>
        </div>
      </div>

      {/* ── NAV DE SEÇÕES ── */}
      <div
        className="sticky top-[56px] z-30 flex flex-wrap gap-3 border-b px-6 py-3 md:px-14"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        <button type="button" onClick={() => setActiveSection("painel-economico")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "painel-economico" ? RED : "transparent", color: activeSection === "painel-economico" ? "#fff" : "var(--foreground)", borderColor: activeSection === "painel-economico" ? RED : "var(--border)" }}>
          Painel Econômico
        </button>
        <button type="button" onClick={() => setActiveSection("curiosidades")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "curiosidades" ? RED : "transparent", color: activeSection === "curiosidades" ? "#fff" : "var(--foreground)", borderColor: activeSection === "curiosidades" ? RED : "var(--border)" }}>
          Curiosidades
        </button>
        <button type="button" onClick={() => setActiveSection("categorias")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "categorias" ? RED : "transparent", color: activeSection === "categorias" ? "#fff" : "var(--foreground)", borderColor: activeSection === "categorias" ? RED : "var(--border)" }}>
          Categorias
        </button>
        <button type="button" onClick={() => setActiveSection("construir")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "construir" ? RED : "transparent", color: activeSection === "construir" ? "#fff" : "var(--foreground)", borderColor: activeSection === "construir" ? RED : "var(--border)" }}>
          O que construiríamos
        </button>
      </div>

      {activeSection === "painel-economico" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: "#080808" }}>
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" />
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          PAINEL ECONÔMICO
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Arraste o slider de economia
        </h2>
        <p className="mb-12 max-w-lg text-base leading-relaxed" style={{ color: "rgba(240,236,228,0.88)" }}>
          Quanto poderíamos economizar cortando parte dos gastos parlamentares? Arraste e veja o que seria possível financiar em troca.
        </p>

        <div className="mb-12 max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-bold" style={{ color: "#f0ece4" }}>% da CEAP economizada</span>
            <span className="text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
              {savings}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={savings}
            onChange={(event) => setSavings(Number(event.target.value))}
            className="gastos-range mb-3 w-full"
          />
          <div className="flex justify-between text-sm" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.7)" }}>
            <span>R$ 0</span>
            <span className="font-bold text-primary">{formatCurrency(savedAmount)} liberados</span>
            <span>R$ 1,48 bi</span>
          </div>
        </div>

        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-3">
          {socialItems.map((item) => {
            const count = Math.floor(savedAmount / item.cost);
            const opacity = savings === 0 ? 0.2 : 0.4 + (savings / 100) * 0.6;
            const scale = savings === 0 ? 0.7 : 0.85 + (savings / 100) * 0.15;
            return (
              <div
                key={item.id}
                className="border p-5 transition-all duration-500"
                style={{ background: "#111111", borderColor: savings > 0 ? `${item.color}70` : "rgba(240,236,228,0.12)" }}
              >
                <span className="mb-3 inline-flex min-h-8 items-center border px-2 text-[11px] font-bold tracking-widest" style={{ borderColor: item.color, color: item.color, opacity, fontFamily: MONO }}>
                  {item.marker}
                </span>
                <p className="mb-2 text-sm font-semibold" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.78)" }}>
                  {item.label.toUpperCase()}
                </p>
                <p
                  className="font-black transition-all duration-500"
                  style={{
                    fontFamily: SERIF,
                    fontSize: `${scale * 2}rem`,
                    color: item.color,
                    opacity,
                    lineHeight: 1,
                  }}
                >
                  {savings === 0 ? "—" : count.toLocaleString("pt-BR")}
                </p>
                <p className="mt-2 text-sm" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.62)" }}>
                  {item.unit} · {formatCurrency(item.cost)}/un.
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-l-4 border-primary px-6 py-5 transition-all duration-700" style={{ background: "rgba(196,18,48,0.10)", opacity: savings > 0 ? 1 : 0.3 }}>
          <p className="mb-2 text-xs font-bold tracking-[0.3em] text-primary" style={{ fontFamily: MONO }}>
            {opportunity.headline.toUpperCase()}
          </p>
          <p className="text-base font-medium leading-relaxed" style={{ color: "#f0ece4" }}>{opportunity.description}</p>
        </div>
      </section>
      )}

      {activeSection === "curiosidades" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: "#080808" }}>
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" />
        <p className="mb-2 text-xs font-bold tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          CURIOSIDADES DOS RECORTES
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Números que viram custo social
        </h2>
        <p className="mb-10 max-w-2xl text-base leading-relaxed" style={{ color: "rgba(240,236,228,0.88)" }}>
          Esta leitura junta pontos levantados em outros recortes do trabalho: gasto total, fornecedores,
          categorias sensíveis e custo-benefício. Os valores abaixo são fixos no frontend para contar a história
          sem alterar consultas, respostas ou banco.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {workInsights.map((item, index) => (
            <article
              key={item.title}
              className="border p-5"
              style={{ background: index === 0 ? "rgba(196,18,48,0.14)" : "#111111", borderColor: index === 0 ? "rgba(196,18,48,0.45)" : "rgba(240,236,228,0.12)" }}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="border px-2 py-1 text-[11px] font-bold tracking-widest text-primary" style={{ borderColor: "rgba(196,18,48,0.5)", fontFamily: MONO }}>
                  {item.source}
                </span>
                <span className="text-xs font-medium" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.5)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mb-2 text-base font-bold leading-snug" style={{ color: "#f0ece4" }}>
                {item.title}
              </p>
              <p className="mb-4 text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                {item.value}
              </p>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: "rgba(240,236,228,0.82)" }}>
                {item.description}
              </p>
              <p className="border-t pt-3 text-sm leading-relaxed" style={{ borderColor: "rgba(240,236,228,0.14)", color: "rgba(240,236,228,0.78)", fontFamily: MONO }}>
                {item.conversion}
              </p>
            </article>
          ))}
        </div>
      </section>
      )}

      {activeSection === "categorias" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: "#080808" }}>
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" />
        <p className="mb-2 text-xs font-bold tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          CATEGORIAS DE GASTO
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Onde está o dinheiro?
        </h2>
        <p className="mb-12 max-w-lg text-base leading-relaxed" style={{ color: "rgba(240,236,228,0.88)" }}>
          Cada slider representa um achado consolidado do trabalho. Conforme o valor aumenta, o painel social perde força.
        </p>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-8">
            {spendingSliders.map((slider) => {
              const value = sliderValues[slider.id] ?? 0;
              const percent = Math.round((value / slider.max) * 100);
              return (
                <div key={slider.id}>
                  <div className="mb-1 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-1 text-base font-bold" style={{ color: "#f0ece4" }}>{slider.label}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(240,236,228,0.72)" }}>{slider.description}</p>
                    </div>
                    <span className="shrink-0 text-xl font-black text-primary" style={{ fontFamily: SERIF }}>
                      {percent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={slider.max}
                    step={Math.round(slider.max / 100)}
                    value={value}
                    onChange={(event) => setSliderValues((previous) => ({ ...previous, [slider.id]: Number(event.target.value) }))}
                    className="gastos-range mb-1 mt-3 w-full"
                  />
                  <p className="text-right text-sm font-medium" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.68)" }}>
                    {formatCurrency(value)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border p-6" style={{ background: "#111111", borderColor: "rgba(240,236,228,0.12)" }}>
            <p className="mb-6 text-xs font-bold tracking-[0.3em]" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.7)" }}>
              IMPACTO EM PROGRAMAS SOCIAIS
            </p>

            {socialPrograms.map((program) => {
              const fade = Math.max(0.15, 1 - wasteRatio * 0.85);
              const sizeMultiplier = Math.max(0.6, 1 - wasteRatio * 0.4);
              const visibleValue = Math.round(program.base * fade);
              return (
                <div key={program.label} className="mb-5 transition-all duration-700">
                  <p
                    className="mb-1 text-sm font-semibold transition-all duration-700"
                    style={{ fontFamily: MONO, color: `rgba(240,236,228,${Math.max(0.5, fade)})` }}
                  >
                    {program.label.toUpperCase()}
                  </p>
                  <p
                    className="font-black transition-all duration-700"
                    style={{
                      fontFamily: SERIF,
                      fontSize: `${sizeMultiplier * 1.6}rem`,
                      color: "#f0ece4",
                      opacity: fade,
                      filter: wasteRatio > 0.7 ? `blur(${(wasteRatio - 0.7) * 6}px)` : "none",
                    }}
                  >
                    {program.currencyPrefix ? `R$ ${visibleValue.toLocaleString("pt-BR")}` : formatCurrency(visibleValue)}
                  </p>
                  <div className="mt-2 h-px" style={{ background: `rgba(240,236,228,${fade * 0.15})` }} />
                </div>
              );
            })}

            {wasteRatio > 0.8 ? (
              <div
                className={`mt-4 p-3 ${glitch ? "gastos-glitch-text" : ""}`}
                style={{ background: "rgba(196,18,48,0.15)", border: "1px solid rgba(196,18,48,0.4)" }}
              >
                <p className="text-sm font-bold text-primary" style={{ fontFamily: MONO }}>
                  ALERTA — GASTO MÁXIMO ATIVADO
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "rgba(240,236,228,0.82)" }}>
                  Com esse nível de gasto parlamentar, programas sociais operam no limite mínimo.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      )}

      {activeSection === "categorias" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: "#080808" }}>
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" />
        <p className="mb-2 text-xs font-bold tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          O LUXO × O POVO
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Quando o gasto vira privilégio
        </h2>
        <p className="mb-10 max-w-2xl text-base leading-relaxed" style={{ color: "rgba(240,236,228,0.88)" }}>
          Quatro categorias sensíveis de gasto parlamentar, comparadas ao que o mesmo dinheiro
          entregaria à população. Valores ilustrativos fixos no frontend, sem alterar consultas,
          respostas ou banco.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {luxuryComparisons.map((item, index) => (
            <article
              key={item.id}
              className="flex flex-col border p-5"
              style={{ background: "#111111", borderColor: "rgba(240,236,228,0.12)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-medium" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.45)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mb-2 text-base font-bold leading-snug" style={{ color: "#f0ece4" }}>
                {item.label}
              </p>
              <p className="mb-1 text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                {formatCurrency(item.value)}
              </p>
              {item.illustrative ? (
                <p className="mb-3 text-[11px] font-bold tracking-widest" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.55)" }}>
                  VALOR ILUSTRATIVO
                </p>
              ) : null}
              <div className="mt-auto border-t pt-3" style={{ borderColor: "rgba(240,236,228,0.14)" }}>
                <p className="mb-1 text-[11px] font-bold tracking-widest" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.55)" }}>
                  EQUIVALE A
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(240,236,228,0.88)" }}>
                  {item.socialEquivalent}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      )}

      {activeSection === "categorias" && (
      <section className="relative overflow-hidden px-6 py-20 md:px-14" style={{ background: "#0d0000" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(196,18,48,0.03) 2px, rgba(196,18,48,0.03) 4px)" }}
        />

        <div className="relative z-10 max-w-3xl">
          <p className="gastos-flicker mb-6 text-xs font-bold tracking-[0.4em] text-primary" style={{ fontFamily: MONO }}>
            ERRO DO SISTEMA · DADOS NÃO ENCONTRADOS
          </p>

          {manifestLines.map((line, index) => (
            <div key={line.text} className="relative mb-8">
              <p
                className={`mb-2 font-black leading-none transition-all ${glitch && index % 2 === 0 ? "gastos-glitch-text" : ""}`}
                style={{
                  fontFamily: SERIF,
                  fontSize: "clamp(1.5rem, 4vw, 3rem)",
                  color: "#f0ece4",
                }}
              >
                {line.text}
              </p>
              <p className="text-base font-medium leading-relaxed" style={{ color: "#e00836", fontFamily: MONO }}>
                → {line.sub}
              </p>
            </div>
          ))}
        </div>
      </section>
      )}

      {activeSection === "construir" && (() => {
        const ceapPorAno = totalCeap / 4;
        const economiaPorAno = ceapPorAno * 0.20;
        const economia4Anos = economiaPorAno * 4;
        const CONSTRUCOES = [
          { id: "casas", icon: "🏠", label: "Casas populares", custo: 150_000, unidade: "casas", cor: "#c41230", descricao: "Programa Minha Casa Minha Vida — unidade básica com 45 m²" },
          { id: "ubs", icon: "🏥", label: "Unidades Básicas de Saúde", custo: 600_000, unidade: "UBS", cor: "#d4841a", descricao: "UBS padrão MS com consultórios, triagem e farmácia básica" },
          { id: "salas", icon: "📚", label: "Salas de aula equipadas", custo: 80_000, unidade: "salas", cor: "#4a7c59", descricao: "Sala escolar completa com mobiliário, quadro e ventilação" },
          { id: "cisternas", icon: "💧", label: "Cisternas para o semiárido", custo: 2_500, unidade: "cisternas", cor: "#2e5fa3", descricao: "Programa P1+2 — cisterna de 16 mil litros por família rural" },
          { id: "bolsas", icon: "🎓", label: "Bolsas universitárias (por ano)", custo: 24_000, unidade: "bolsas/ano", cor: "#7b3fa0", descricao: "Bolsa de estudo integral em universidade particular — 1 ano" },
          { id: "merenda", icon: "🍽️", label: "Crianças com merenda (1 ano)", custo: 1_500, unidade: "crianças/ano", cor: "#c8970a", descricao: "Custo PNAE por aluno por ano letivo completo" },
          { id: "saneamento", icon: "🚿", label: "Famílias com saneamento básico", custo: 5_000, unidade: "famílias", cor: "#1e7a6d", descricao: "Conexão de rede de esgoto e água tratada por domicílio" },
          { id: "km", icon: "🛣️", label: "Km de estrada rural pavimentada", custo: 1_000_000, unidade: "km", cor: "#8b5e3c", descricao: "Pavimentação de estrada vicinal de acesso a comunidades rurais" },
        ];
        return (
        <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: "#080808" }}>
          <SectionProblemBg img="/intro/problemas/saude publica.jpg" />
          <p className="mb-2 text-xs font-bold tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
            O QUE PODERÍAMOS CONSTRUIR
          </p>
          <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
            Com 20% de economia na CEAP por ano
          </h2>
          <p className="mb-4 max-w-2xl text-base leading-relaxed" style={{ color: "rgba(240,236,228,0.88)" }}>
            A CEAP custa em média <strong style={{ color: "#e00836" }}>R$ 370 milhões por ano</strong>. Se economizarmos apenas
            20% — sem cortar absolutamente nada essencial — liberamos <strong style={{ color: "#e00836" }}>R$ 74 milhões por ano</strong>.
            Em 4 anos de legislatura, isso equivale a <strong style={{ color: "#e00836" }}>R$ 296 milhões</strong>. Veja o que daria para construir.
          </p>
          <div className="mb-12 flex flex-wrap items-center gap-6 border-l-4 border-primary px-6 py-5" style={{ background: "rgba(196,18,48,0.10)" }}>
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-primary" style={{ fontFamily: MONO }}>CEAP ANUAL ESTIMADA</p>
              <p className="text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>R$ 370 mi / ano</p>
            </div>
            <div className="hidden md:block h-10 w-px" style={{ background: "rgba(196,18,48,0.4)" }} />
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-primary" style={{ fontFamily: MONO }}>20% DE ECONOMIA / ANO</p>
              <p className="text-3xl font-black" style={{ fontFamily: SERIF, color: "#e00836" }}>R$ 74 mi / ano</p>
            </div>
            <div className="hidden md:block h-10 w-px" style={{ background: "rgba(196,18,48,0.4)" }} />
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-primary" style={{ fontFamily: MONO }}>TOTAL EM 4 ANOS</p>
              <p className="text-3xl font-black" style={{ fontFamily: SERIF, color: "#e00836" }}>R$ 296 mi</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CONSTRUCOES.map((item) => {
              const qtd = Math.floor(economia4Anos / item.custo);
              return (
                <article
                  key={item.id}
                  className="flex flex-col border p-5"
                  style={{ background: "#111111", borderColor: `${item.cor}35` }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="border px-2 py-0.5 text-[10px] font-bold tracking-widest" style={{ borderColor: `${item.cor}55`, color: item.cor, fontFamily: MONO }}>
                      R$ {(item.custo / 1000).toLocaleString("pt-BR")}K/un.
                    </span>
                  </div>
                  <p className="mb-1 text-sm font-bold leading-snug" style={{ color: "rgba(240,236,228,0.78)", fontFamily: MONO }}>
                    {item.label.toUpperCase()}
                  </p>
                  <p className="mb-4 text-4xl font-black leading-none" style={{ fontFamily: SERIF, color: item.cor }}>
                    {qtd.toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-auto text-sm leading-relaxed" style={{ color: "rgba(240,236,228,0.72)" }}>
                    {item.descricao}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-12 border-t pt-8" style={{ borderColor: "rgba(240,236,228,0.1)" }}>
            <p className="mb-3 text-xs font-bold tracking-[0.3em]" style={{ fontFamily: MONO, color: "rgba(240,236,228,0.55)" }}>NOTA METODOLÓGICA</p>
            <p className="max-w-3xl text-sm leading-relaxed" style={{ color: "rgba(240,236,228,0.7)" }}>
              Valores calculados com base no <strong style={{ color: "rgba(240,236,228,0.88)" }}>custo estimado por unidade</strong> de cada tipo de obra ou programa social.
              A CEAP total projetada para a 57ª legislatura é de R$ 1,48 bilhão (R$ 370 mi/ano). 20% de economia anual =
              R$ 74 mi/ano × 4 anos = <strong style={{ color: "#e00836" }}>R$ 296 milhões</strong>.
              Custos referenciais: Minha Casa Minha Vida, Ministério da Saúde (UBS), FNDE (salas de aula),
              Programa Cisternas (P1+2), PNAE (merenda), SNIS (saneamento). Valores são estimativas de referência,
              não incluem terraplanagem, urbanização ou custos indiretos.
            </p>
          </div>
        </section>
        );
      })()}
    </div>
    </>
  );
}
