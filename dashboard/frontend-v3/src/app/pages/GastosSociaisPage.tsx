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
  type GastosSection = "painel-economico" | "achados" | "categorias";
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
          style={{ fontFamily: "monospace", background: activeSection === "painel-economico" ? RED : "transparent", color: activeSection === "painel-economico" ? "#fff" : "var(--foreground)", borderColor: activeSection === "painel-economico" ? RED : "var(--border)" }}>
          Painel Econômico
        </button>
        <button type="button" onClick={() => setActiveSection("achados")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: "monospace", background: activeSection === "achados" ? RED : "transparent", color: activeSection === "achados" ? "#fff" : "var(--foreground)", borderColor: activeSection === "achados" ? RED : "var(--border)" }}>
          Achados
        </button>
        <button type="button" onClick={() => setActiveSection("categorias")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: "monospace", background: activeSection === "categorias" ? RED : "transparent", color: activeSection === "categorias" ? "#fff" : "var(--foreground)", borderColor: activeSection === "categorias" ? RED : "var(--border)" }}>
          Categorias
        </button>
      </div>

      {activeSection === "painel-economico" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14">
        <SectionProblemBg img="/intro/problemas/principais-problemas-sociais.jpg" />
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          PAINEL ECONÔMICO
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Arraste o slider de economia
        </h2>
        <p className="mb-12 max-w-lg text-sm text-muted-foreground">
          Quanto poderíamos economizar cortando parte dos gastos parlamentares? Arraste e veja o que seria possível financiar em troca.
        </p>

        <div className="mb-12 max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">% da CEAP economizada</span>
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
          <div className="flex justify-between text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
            <span>R$ 0</span>
            <span className="font-bold text-primary">{formatCurrency(savedAmount)} liberados</span>
            <span>R$ 1,48 bi</span>
          </div>
        </div>

        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-3">
          {socialItems.map((item) => {
            const count = Math.floor(savedAmount / item.cost);
            const opacity = savings === 0 ? 0.15 : 0.3 + (savings / 100) * 0.7;
            const scale = savings === 0 ? 0.7 : 0.85 + (savings / 100) * 0.15;
            return (
              <div
                key={item.id}
                className="border border-border p-5 transition-all duration-500"
                style={{ background: "#111111", borderColor: savings > 0 ? `${item.color}60` : "rgba(240,236,228,0.1)" }}
              >
                <span className="mb-3 inline-flex min-h-8 items-center border px-2 text-[10px] tracking-widest" style={{ borderColor: item.color, color: item.color, opacity, fontFamily: MONO }}>
                  {item.marker}
                </span>
                <p className="mb-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
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
                <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {item.unit} · {formatCurrency(item.cost)}/un.
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-l-4 border-primary px-6 py-5 transition-all duration-700" style={{ background: "rgba(196,18,48,0.06)", opacity: savings > 0 ? 1 : 0.3 }}>
          <p className="mb-2 text-xs text-primary" style={{ fontFamily: MONO }}>
            {opportunity.headline.toUpperCase()}
          </p>
          <p className="text-base leading-relaxed text-foreground">{opportunity.description}</p>
        </div>
      </section>
      )}

      {activeSection === "achados" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14">
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" />
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          ACHADOS DOS RECORTES
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Curiosidades que viram custo social
        </h2>
        <p className="mb-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Esta leitura junta pontos levantados em outros recortes do trabalho: gasto total, fornecedores,
          categorias sensiveis e custo-beneficio. Os valores abaixo sao fixos no frontend para contar a historia
          sem alterar consultas, respostas ou banco.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {workInsights.map((item, index) => (
            <article
              key={item.title}
              className="border border-border p-5"
              style={{ background: index === 0 ? "rgba(196,18,48,0.12)" : "#111111" }}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="border px-2 py-1 text-[10px] font-bold tracking-widest text-primary" style={{ borderColor: "rgba(196,18,48,0.5)", fontFamily: MONO }}>
                  {item.source}
                </span>
                <span className="text-[10px] text-muted-foreground" style={{ fontFamily: MONO }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mb-2 text-sm font-bold leading-snug" style={{ color: "#f0ece4" }}>
                {item.title}
              </p>
              <p className="mb-4 text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                {item.value}
              </p>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              <p className="border-t pt-3 text-[11px] leading-relaxed" style={{ borderColor: "rgba(240,236,228,0.12)", color: "rgba(240,236,228,0.72)", fontFamily: MONO }}>
                {item.conversion}
              </p>
            </article>
          ))}
        </div>
      </section>
      )}

      {activeSection === "categorias" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14">
        <SectionProblemBg img="/intro/problemas/images (3).jpg" />
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          CATEGORIAS DE GASTO
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Onde está o dinheiro?
        </h2>
        <p className="mb-12 max-w-lg text-sm text-muted-foreground">
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
                      <p className="mb-0.5 text-sm font-bold text-foreground">{slider.label}</p>
                      <p className="text-xs text-muted-foreground">{slider.description}</p>
                    </div>
                    <span className="shrink-0 text-lg font-black text-primary" style={{ fontFamily: SERIF }}>
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
                  <p className="text-right text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {formatCurrency(value)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border border-border p-6" style={{ background: "#111111" }}>
            <p className="mb-6 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              IMPACTO EM PROGRAMAS SOCIAIS
            </p>

            {socialPrograms.map((program) => {
              const fade = Math.max(0.08, 1 - wasteRatio * 0.85);
              const sizeMultiplier = Math.max(0.6, 1 - wasteRatio * 0.4);
              const visibleValue = Math.round(program.base * fade);
              return (
                <div key={program.label} className="mb-5 transition-all duration-700">
                  <p
                    className="mb-1 text-xs text-muted-foreground transition-all duration-700"
                    style={{ fontFamily: MONO, opacity: Math.max(0.2, fade) }}
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
                <p className="text-xs text-primary" style={{ fontFamily: MONO }}>
                  ALERTA — GASTO MÁXIMO ATIVADO
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Com esse nível de gasto parlamentar, programas sociais operam no limite mínimo.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      )}

      {activeSection === "categorias" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14">
        <SectionProblemBg img="/intro/problemas/images (1).jpg" />
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          O LUXO × O POVO
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Quando o gasto vira privilégio
        </h2>
        <p className="mb-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Quatro categorias sensíveis de gasto parlamentar, comparadas ao que o mesmo dinheiro
          entregaria à população. Valores ilustrativos fixos no frontend, sem alterar consultas,
          respostas ou banco.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {luxuryComparisons.map((item, index) => (
            <article
              key={item.id}
              className="flex flex-col border border-border p-5"
              style={{ background: "rgba(17,17,17,0.86)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] text-muted-foreground" style={{ fontFamily: MONO }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mb-2 text-sm font-bold leading-snug" style={{ color: "#f0ece4" }}>
                {item.label}
              </p>
              <p className="mb-1 text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                {formatCurrency(item.value)}
              </p>
              {item.illustrative ? (
                <p className="mb-3 text-[10px] tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                  VALOR ILUSTRATIVO
                </p>
              ) : null}
              <div className="mt-auto border-t pt-3" style={{ borderColor: "rgba(240,236,228,0.12)" }}>
                <p className="text-[10px] tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                  EQUIVALE A
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(240,236,228,0.82)" }}>
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
          <p className="gastos-flicker mb-6 text-xs tracking-[0.4em] text-primary" style={{ fontFamily: MONO }}>
            ERRO DO SISTEMA · DADOS NÃO ENCONTRADOS
          </p>

          {manifestLines.map((line, index) => (
            <div key={line.text} className="relative mb-8">
              <p
                className={`mb-1 font-black leading-none transition-all ${glitch && index % 2 === 0 ? "gastos-glitch-text" : ""}`}
                style={{
                  fontFamily: SERIF,
                  fontSize: "clamp(1.5rem, 4vw, 3rem)",
                  color: "#f0ece4",
                }}
              >
                {line.text}
              </p>
              <p className="text-base leading-relaxed" style={{ color: "#c41230", fontFamily: MONO, fontSize: "0.85rem" }}>
                → {line.sub}
              </p>
            </div>
          ))}
        </div>
      </section>
      )}
    </div>
    </>
  );
}
