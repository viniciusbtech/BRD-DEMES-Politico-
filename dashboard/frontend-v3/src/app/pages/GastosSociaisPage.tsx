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
function SectionProblemBg({ img, isDark }: { img: string; isDark: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <img
        src={img}
        alt=""
        className="h-full w-full object-cover"
        style={{
          filter: isDark
            ? "grayscale(100%) contrast(1.12) brightness(0.4)"
            : "grayscale(88%) contrast(0.9) brightness(1.22) saturate(0.5)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(10,10,10,0.84) 0%, rgba(10,10,10,0.92) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(248,250,252,0.94) 100%)",
        }}
      />
    </div>
  );
}

export default function GastosSociaisPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado, onNavigateRecorte }: GastosSociaisPageProps) {
  const { theme } = useTheme();
  type GastosSection = "painel-economico" | "curiosidades" | "categorias" | "construir" | "metodologia";
  const [activeSection, setActiveSection] = useState<GastosSection>("painel-economico");
  const RED = "#e00836";
  const [savings, setSavings] = useState(50);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(initialSliderValues);
  const [glitch, setGlitch] = useState(false);
  const [heroTarget, setHeroTarget] = useState<"deputado" | "povo">("povo");
  const [openMethodology, setOpenMethodology] = useState<Record<string, boolean>>({ base: true });
  const isDark = theme === "dark";
  const lightModeColorOverrides = (!isDark
    ? {
        "--muted-foreground": "#475569",
        "--foreground": "#172033",
        "--primary": "#c41230",
        "--primary-rgb": "196, 18, 48",
        "--ring": "#c41230",
      }
    : {}) as CSSProperties;
  const sectionBg = isDark ? "#080808" : "linear-gradient(180deg, #ffffff 0%, #f3f7fb 100%)";
  const dangerSectionBg = isDark ? "#0d0000" : "linear-gradient(180deg, #fff5f6 0%, #ffffff 100%)";
  const panelBg = isDark ? "#111111" : "rgba(255,255,255,0.88)";
  const panelStrongBg = isDark ? "rgba(196,18,48,0.14)" : "rgba(196,18,48,0.08)";
  const textStrong = isDark ? "#f0ece4" : "#172033";
  const textSoft = isDark ? "rgba(240,236,228,0.82)" : "rgba(23,32,51,0.76)";
  const textMuted = isDark ? "rgba(240,236,228,0.62)" : "rgba(71,85,105,0.86)";
  const subtleBorder = isDark ? "rgba(240,236,228,0.12)" : "rgba(15,23,42,0.12)";
  const subtleLine = isDark ? "rgba(240,236,228,0.14)" : "rgba(15,23,42,0.12)";

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
  const methodologyItems = [
    {
      id: "base",
      titulo: "Base do recorte",
      origem: "CEAP · 57ª Legislatura · valores consolidados no frontend",
      formula: "Custo da legislatura = soma projetada da CEAP no período analisado",
      passos: [
        "1. O recorte parte da Cota para o Exercício da Atividade Parlamentar (CEAP), que reúne despesas reembolsadas aos deputados.",
        "2. A página usa o total consolidado de R$ 1,48 bilhão para a legislatura, equivalente a cerca de R$ 370 milhões por ano.",
        "3. O objetivo não é apontar irregularidade individual, mas traduzir o volume de gasto parlamentar em impacto social comparável.",
      ],
      interpretacao: "A leitura correta é de ordem de grandeza: quanto dinheiro público está envolvido e que tipo de política social poderia ser financiada com parte desse valor.",
    },
    {
      id: "economia",
      titulo: "Slider de economia",
      origem: "Painel econômico",
      formula: "Valor liberado = total da CEAP × percentual de economia escolhido",
      passos: [
        "1. O usuário escolhe um percentual entre 0% e 100%.",
        "2. Esse percentual é aplicado sobre o total da CEAP usado no recorte.",
        "3. O valor resultante é dividido pelo custo unitário de cada item social, como UBS, casas, merenda ou saneamento.",
      ],
      interpretacao: "O slider mostra uma simulação simples: se parte do gasto parlamentar fosse economizada, quantas entregas sociais caberiam nesse mesmo orçamento.",
    },
    {
      id: "comparacoes",
      titulo: "Comparações sociais",
      origem: "Categorias sensíveis e custos de oportunidade",
      formula: "Quantidade possível = valor disponível ÷ custo estimado por unidade",
      passos: [
        "1. Cada comparação usa um custo unitário de referência para uma política pública ou entrega social.",
        "2. Os valores são arredondados para facilitar leitura e comparação visual.",
        "3. Algumas categorias são marcadas como ilustrativas quando servem para explicar escala, não para representar contrato real.",
      ],
      interpretacao: "Essas comparações funcionam como tradução didática do dinheiro: elas ajudam o usuário a entender o tamanho do gasto em termos de serviços concretos.",
    },
    {
      id: "limites",
      titulo: "Limites da análise",
      origem: "Transparência metodológica",
      formula: "Recorte analítico ≠ auditoria fiscal ou conclusão jurídica",
      passos: [
        "1. O recorte não avalia legalidade de notas, contratos ou reembolsos específicos.",
        "2. As estimativas sociais dependem de custos médios e podem variar por região, inflação, escala de compra e desenho do programa.",
        "3. Salários, emendas, verbas partidárias e outros gastos fora da CEAP não entram nesta página.",
      ],
      interpretacao: "A seção deve ser lida como uma comparação pública e pedagógica sobre prioridade orçamentária, não como prova de desvio ou acusação contra parlamentares.",
    },
  ];
  const toggleMethodology = (id: string) => {
    setOpenMethodology((previous) => ({ ...previous, [id]: !previous[id] }));
  };

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
          background: ${isDark ? "rgba(240,236,228,0.1)" : "rgba(15,23,42,0.16)"};
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
                style={{
                  filter: isDark
                    ? "grayscale(80%) contrast(1.2) brightness(0.32)"
                    : "grayscale(72%) contrast(0.92) brightness(1.18) saturate(0.55)",
                }}
              />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "rgba(10,10,10,0.78)"
              : "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.82) 48%, rgba(226,232,240,0.62) 100%)",
          }}
        />
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
              style={{ fontFamily: SERIF, color: textStrong }}
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
                style={{ fontFamily: SERIF, color: isDark ? "#0ff" : "#0f5fa8", mixBlendMode: isDark ? "screen" : "multiply" }}
              >
                E SE o dinheiro
                <br />
                fosse para o
                <br />
                {heroTarget}?
              </h1>
            ) : null}
          </div>

          <p className="mb-3 max-w-2xl text-lg leading-relaxed text-muted-foreground" style={{ fontWeight: 400 }}>
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
        <button type="button" onClick={() => setActiveSection("metodologia")}
          className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
          style={{ fontFamily: MONO, background: activeSection === "metodologia" ? RED : "transparent", color: activeSection === "metodologia" ? "#fff" : "var(--foreground)", borderColor: activeSection === "metodologia" ? RED : "var(--border)" }}>
          Metodologia
        </button>
      </div>

      {activeSection === "painel-economico" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: sectionBg }}>
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" isDark={isDark} />
        <p className="mb-2 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          PAINEL ECONÔMICO
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: textStrong }}>
          Arraste o slider de economia
        </h2>
        <p className="mb-12 max-w-lg text-base leading-relaxed" style={{ color: textSoft }}>
          Quanto poderíamos economizar cortando parte dos gastos parlamentares? Arraste e veja o que seria possível financiar em troca.
        </p>

        <div className="mb-12 max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-bold" style={{ color: textStrong }}>% da CEAP economizada</span>
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
          <div className="flex justify-between text-sm" style={{ fontFamily: MONO, color: textMuted }}>
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
                style={{ background: panelBg, borderColor: savings > 0 ? `${item.color}70` : subtleBorder }}
              >
                <span className="mb-3 inline-flex min-h-8 items-center border px-2 text-[11px] font-bold tracking-widest" style={{ borderColor: item.color, color: item.color, opacity, fontFamily: MONO }}>
                  {item.marker}
                </span>
                <p className="mb-2 text-sm font-semibold" style={{ fontFamily: MONO, color: textSoft }}>
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
                <p className="mt-2 text-sm" style={{ fontFamily: MONO, color: textMuted }}>
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
          <p className="text-base font-medium leading-relaxed" style={{ color: textStrong }}>{opportunity.description}</p>
        </div>
      </section>
      )}

      {activeSection === "curiosidades" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: sectionBg }}>
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" isDark={isDark} />
        <p className="mb-2 text-xs font-bold tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          CURIOSIDADES DOS RECORTES
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: textStrong }}>
          Números que viram custo social
        </h2>
        <p className="mb-10 max-w-2xl text-base leading-relaxed" style={{ color: textSoft }}>
          Esta leitura junta pontos levantados em outros recortes do trabalho: gasto total, fornecedores,
          categorias sensíveis e custo-benefício. Os valores abaixo são fixos no frontend para contar a história
          sem alterar consultas, respostas ou banco.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {workInsights.map((item, index) => (
            <article
              key={item.title}
              className="border p-5"
              style={{ background: index === 0 ? panelStrongBg : panelBg, borderColor: index === 0 ? "rgba(196,18,48,0.45)" : subtleBorder }}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="border px-2 py-1 text-[11px] font-bold tracking-widest text-primary" style={{ borderColor: "rgba(196,18,48,0.5)", fontFamily: MONO }}>
                  {item.source}
                </span>
                <span className="text-xs font-medium" style={{ fontFamily: MONO, color: textMuted }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mb-2 text-base font-bold leading-snug" style={{ color: textStrong }}>
                {item.title}
              </p>
              <p className="mb-4 text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                {item.value}
              </p>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: textSoft }}>
                {item.description}
              </p>
              <p className="border-t pt-3 text-sm leading-relaxed" style={{ borderColor: subtleLine, color: textSoft, fontFamily: MONO }}>
                {item.conversion}
              </p>
            </article>
          ))}
        </div>
      </section>
      )}

      {activeSection === "categorias" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: sectionBg }}>
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" isDark={isDark} />
        <p className="mb-2 text-xs font-bold tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          CATEGORIAS DE GASTO
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: textStrong }}>
          Onde está o dinheiro?
        </h2>
        <p className="mb-12 max-w-lg text-base leading-relaxed" style={{ color: textSoft }}>
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
                      <p className="mb-1 text-base font-bold" style={{ color: textStrong }}>{slider.label}</p>
                      <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{slider.description}</p>
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
                  <p className="text-right text-sm font-medium" style={{ fontFamily: MONO, color: textMuted }}>
                    {formatCurrency(value)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border p-6" style={{ background: panelBg, borderColor: subtleBorder }}>
            <p className="mb-6 text-xs font-bold tracking-[0.3em]" style={{ fontFamily: MONO, color: textMuted }}>
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
                    style={{ fontFamily: MONO, color: isDark ? `rgba(240,236,228,${Math.max(0.5, fade)})` : `rgba(23,32,51,${Math.max(0.62, fade)})` }}
                  >
                    {program.label.toUpperCase()}
                  </p>
                  <p
                    className="font-black transition-all duration-700"
                    style={{
                      fontFamily: SERIF,
                      fontSize: `${sizeMultiplier * 1.6}rem`,
                      color: textStrong,
                      opacity: fade,
                      filter: wasteRatio > 0.7 ? `blur(${(wasteRatio - 0.7) * 6}px)` : "none",
                    }}
                  >
                    {program.currencyPrefix ? `R$ ${visibleValue.toLocaleString("pt-BR")}` : formatCurrency(visibleValue)}
                  </p>
                  <div className="mt-2 h-px" style={{ background: isDark ? `rgba(240,236,228,${fade * 0.15})` : `rgba(15,23,42,${Math.max(0.08, fade * 0.12)})` }} />
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
                <p className="mt-1 text-sm leading-relaxed" style={{ color: textSoft }}>
                  Com esse nível de gasto parlamentar, programas sociais operam no limite mínimo.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      )}

      {activeSection === "categorias" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: sectionBg }}>
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" isDark={isDark} />
        <p className="mb-2 text-xs font-bold tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          O LUXO × O POVO
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: textStrong }}>
          Quando o gasto vira privilégio
        </h2>
        <p className="mb-10 max-w-2xl text-base leading-relaxed" style={{ color: textSoft }}>
          Quatro categorias sensíveis de gasto parlamentar, comparadas ao que o mesmo dinheiro
          entregaria à população. Valores ilustrativos fixos no frontend, sem alterar consultas,
          respostas ou banco.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {luxuryComparisons.map((item, index) => (
            <article
              key={item.id}
              className="flex flex-col border p-5"
              style={{ background: panelBg, borderColor: subtleBorder }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-medium" style={{ fontFamily: MONO, color: textMuted }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mb-2 text-base font-bold leading-snug" style={{ color: textStrong }}>
                {item.label}
              </p>
              <p className="mb-1 text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                {formatCurrency(item.value)}
              </p>
              {item.illustrative ? (
                <p className="mb-3 text-[11px] font-bold tracking-widest" style={{ fontFamily: MONO, color: textMuted }}>
                  VALOR ILUSTRATIVO
                </p>
              ) : null}
              <div className="mt-auto border-t pt-3" style={{ borderColor: subtleLine }}>
                <p className="mb-1 text-[11px] font-bold tracking-widest" style={{ fontFamily: MONO, color: textMuted }}>
                  EQUIVALE A
                </p>
                <p className="text-sm leading-relaxed" style={{ color: textSoft }}>
                  {item.socialEquivalent}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      )}

      {activeSection === "categorias" && (
      <section className="relative overflow-hidden px-6 py-20 md:px-14" style={{ background: dangerSectionBg }}>
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
                  color: textStrong,
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
        <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: sectionBg }}>
          <SectionProblemBg img="/intro/problemas/saude publica.jpg" isDark={isDark} />
          <p className="mb-2 text-xs font-bold tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
            O QUE PODERÍAMOS CONSTRUIR
          </p>
          <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: textStrong }}>
            Com 20% de economia na CEAP por ano
          </h2>
          <p className="mb-4 max-w-2xl text-base leading-relaxed" style={{ color: textSoft }}>
            A CEAP custa em média <strong style={{ color: "#e00836" }}>R$ 370 milhões por ano</strong>. Se economizarmos apenas
            20% — sem cortar absolutamente nada essencial — liberamos <strong style={{ color: "#e00836" }}>R$ 74 milhões por ano</strong>.
            Em 4 anos de legislatura, isso equivale a <strong style={{ color: "#e00836" }}>R$ 296 milhões</strong>. Veja o que daria para construir.
          </p>
          <div className="mb-12 flex flex-wrap items-center gap-6 border-l-4 border-primary px-6 py-5" style={{ background: "rgba(196,18,48,0.10)" }}>
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-primary" style={{ fontFamily: MONO }}>CEAP ANUAL ESTIMADA</p>
              <p className="text-3xl font-black" style={{ fontFamily: SERIF, color: textStrong }}>R$ 370 mi / ano</p>
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
                  style={{ background: panelBg, borderColor: `${item.cor}35` }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="border px-2 py-0.5 text-[10px] font-bold tracking-widest" style={{ borderColor: `${item.cor}55`, color: item.cor, fontFamily: MONO }}>
                      R$ {(item.custo / 1000).toLocaleString("pt-BR")}K/un.
                    </span>
                  </div>
                  <p className="mb-1 text-sm font-bold leading-snug" style={{ color: textSoft, fontFamily: MONO }}>
                    {item.label.toUpperCase()}
                  </p>
                  <p className="mb-4 text-4xl font-black leading-none" style={{ fontFamily: SERIF, color: item.cor }}>
                    {qtd.toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-auto text-sm leading-relaxed" style={{ color: textMuted }}>
                    {item.descricao}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-12 border-t pt-8" style={{ borderColor: subtleLine }}>
            <p className="mb-3 text-xs font-bold tracking-[0.3em]" style={{ fontFamily: MONO, color: textMuted }}>NOTA METODOLÓGICA</p>
            <p className="max-w-3xl text-sm leading-relaxed" style={{ color: textMuted }}>
              Valores calculados com base no <strong style={{ color: textSoft }}>custo estimado por unidade</strong> de cada tipo de obra ou programa social.
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

      {activeSection === "metodologia" && (
      <section className="relative isolate overflow-hidden border-b border-border px-6 py-16 md:px-14" style={{ background: sectionBg }}>
        <SectionProblemBg img="/intro/problemas/saude publica.jpg" isDark={isDark} />
        <p className="mb-2 text-xs font-bold tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
          METODOLOGIA
        </p>
        <h2 className="mb-3 text-3xl font-black md:text-4xl" style={{ fontFamily: SERIF, color: textStrong }}>
          Como construímos o recorte 04?
        </h2>
        <p className="mb-10 max-w-3xl text-base leading-relaxed" style={{ color: textSoft }}>
          Esta seção explica de onde vêm os números, como as simulações foram calculadas e quais cuidados são necessários para interpretar o recorte.
        </p>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-3">
            {methodologyItems.map((item) => {
              const isOpen = Boolean(openMethodology[item.id]);
              return (
                <article key={item.id} className="border" style={{ background: panelBg, borderColor: subtleBorder }}>
                  <button
                    type="button"
                    onClick={() => toggleMethodology(item.id)}
                    className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary" style={{ fontFamily: MONO }}>
                        {item.titulo}
                      </p>
                      <p className="mt-1 text-xs font-semibold" style={{ color: textMuted, fontFamily: MONO }}>
                        {item.origem}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold" style={{ color: textMuted, fontFamily: MONO }}>
                      {isOpen ? "FECHAR" : "ABRIR"}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="border-t px-5 py-5" style={{ borderColor: subtleLine }}>
                      <div className="mb-5 border-l-4 border-primary px-4 py-3" style={{ background: panelStrongBg }}>
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary" style={{ fontFamily: MONO }}>
                          Fórmula
                        </p>
                        <p className="text-sm font-bold leading-relaxed" style={{ color: textStrong, fontFamily: MONO }}>
                          {item.formula}
                        </p>
                      </div>

                      <div className="mb-5 grid gap-3">
                        {item.passos.map((passo) => (
                          <p key={passo} className="text-sm leading-relaxed" style={{ color: textSoft }}>
                            {passo}
                          </p>
                        ))}
                      </div>

                      <div className="border-t pt-4" style={{ borderColor: subtleLine }}>
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary" style={{ fontFamily: MONO }}>
                          Como interpretar
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
                          {item.interpretacao}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <aside className="border p-6" style={{ background: panelStrongBg, borderColor: "rgba(196,18,48,0.35)" }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary" style={{ fontFamily: MONO }}>
              Leitura recomendada
            </p>
            <p className="mb-5 text-2xl font-black leading-tight" style={{ fontFamily: SERIF, color: textStrong }}>
              O recorte compara prioridade orçamentária, não acusa comportamento individual.
            </p>
            <p className="mb-5 text-sm leading-relaxed" style={{ color: textSoft }}>
              A pergunta central é simples: se uma parte da CEAP fosse reduzida, que tipo de entrega social poderia ser financiada com o mesmo dinheiro?
            </p>
            <div className="grid gap-3">
              {[
                ["Base", "CEAP da legislatura analisada"],
                ["Escala", "R$ 1,48 bi no período"],
                ["Simulação", "Percentual economizado × custo social"],
                ["Cuidado", "Estimativa pública, não auditoria"],
              ].map(([label, value]) => (
                <div key={label} className="border px-4 py-3" style={{ borderColor: subtleBorder, background: panelBg }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary" style={{ fontFamily: MONO }}>
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: textStrong }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
      )}
    </div>
    </>
  );
}
