import { useState, useEffect, useCallback } from "react";

type Politician = {
  id: number;
  img: string;
  name: string;
  party: string;
  state: string;
  bio: string;
};

type CamaraDeputado = {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto?: string;
};

type ThemeImage = {
  img: string;
  label: string;
};

const CAMARA_DEPUTADOS_URL =
  "https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=20";

const getDeputyPhoto = (id: number) => `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`;
const localDeputyImagePaths = [
  "107283.jpg",
  "160541.jpg",
  "160592.jpg",
  "160674.jpg",
  "178937.jpg",
  "204374.jpg",
  "204450.jpg",
  "204507.jpgmaior.jpg",
  "209787.jpg",
  "220639.jpgmaior.jpg",
  "73701.jpg",
  "74161.jpg",
  "74398.jpg",
  "74646.jpg",
  "92346.jpgmaior.jpg",
].map((fileName) => `/intro/deputados/${fileName}`);
const localConsequenceImagePaths = Array.from({ length: 12 }, (_, index) => `/intro/problemas/problema-${String(index + 1).padStart(2, "0")}.jpg`);

const imageExists = (src: string) =>
  new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });

const loadExistingImages = async (paths: string[]) => {
  const checks = await Promise.all(paths.map(async (path) => ((await imageExists(path)) ? path : null)));
  return checks.filter((path): path is string => Boolean(path));
};

const spendingImages: ThemeImage[] = [
  {
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=500&q=80",
    label: "Notas fiscais e prestacao de contas",
  },
  {
    img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=500&q=80",
    label: "Passagens aereas",
  },
  {
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80",
    label: "Hospedagem",
  },
  {
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80",
    label: "Restaurantes e refeicoes",
  },
  {
    img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=500&q=80",
    label: "Veiculos e deslocamentos",
  },
  {
    img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=500&q=80",
    label: "Contratos e documentos",
  },
];

const consequenceImages: ThemeImage[] = [
  {
    img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=500&q=80",
    label: "Pobreza e miseria",
  },
  {
    img: "https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=500&q=80",
    label: "Falta de saneamento basico",
  },
  {
    img: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=500&q=80",
    label: "Agua contaminada",
  },
  {
    img: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=500&q=80",
    label: "Infraestrutura abandonada",
  },
  {
    img: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=500&q=80",
    label: "Violencia urbana",
  },
  {
    img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&q=80",
    label: "Saude superlotada",
  },
  {
    img: "https://images.unsplash.com/photo-1605806616949-1e87b487fc2f?auto=format&fit=crop&w=500&q=80",
    label: "Assalto e inseguranca",
  },
];

const fallbackPoliticians: Politician[] = [
  {
    id: 220593,
    img: getDeputyPhoto(220593),
    name: "Abilio Brunini",
    party: "PL",
    state: "MT",
    bio: "Senador pelo estado de São Paulo há 12 anos. Presidente da Comissão de Educação.",
  },
  {
    id: 204379,
    img: getDeputyPhoto(204379),
    name: "Adriana Ventura",
    party: "NOVO",
    state: "SP",
    bio: "Deputado Federal por Minas Gerais. Relator do projeto de reforma tributária.",
  },
  {
    id: 204521,
    img: getDeputyPhoto(204521),
    name: "Gov. André Figueiredo",
    party: "PSDB",
    state: "RJ",
    bio: "Governador do Rio de Janeiro. Ex-prefeito da capital fluminense.",
  },
  {
    id: 220592,
    img: getDeputyPhoto(220592),
    name: "Min. Paulo Câmara",
    party: "MDB",
    state: "DF",
    bio: "Ministro da Fazenda. Economista formado pela USP com pós em Chicago.",
  },
  {
    id: 160592,
    img: getDeputyPhoto(160592),
    name: "Sen. Marcos Ribeiro",
    party: "PSD",
    state: "BA",
    bio: "Senador pela Bahia. Líder do governo no Senado Federal.",
  },
  {
    id: 204517,
    img: getDeputyPhoto(204517),
    name: "Dep. Eduardo Braga",
    party: "PP",
    state: "AM",
    bio: "Deputado Federal pelo Amazonas. Defensor da pauta ambiental.",
  },
  {
    id: 220552,
    img: getDeputyPhoto(220552),
    name: "Pref. Sérgio Mota",
    party: "DEM",
    state: "RS",
    bio: "Prefeito de Porto Alegre. Segundo mandato consecutivo na capital gaúcha.",
  },
];

const officialFallbackById: Record<number, Pick<Politician, "name" | "party" | "state" | "bio">> = {
  220593: { name: "Abilio Brunini", party: "PL", state: "MT", bio: "Deputado federal em exercicio, com dados publicos da Camara dos Deputados." },
  204379: { name: "Adriana Ventura", party: "NOVO", state: "SP", bio: "Deputada federal em exercicio, com dados publicos da Camara dos Deputados." },
  204521: { name: "Bia Kicis", party: "PL", state: "DF", bio: "Deputada federal em exercicio, com dados publicos da Camara dos Deputados." },
  220592: { name: "Zezinho Barbary", party: "PP", state: "AC", bio: "Deputado federal em exercicio, com dados publicos da Camara dos Deputados." },
  160592: { name: "Zeca Dirceu", party: "PT", state: "PR", bio: "Deputado federal em exercicio, com dados publicos da Camara dos Deputados." },
  204517: { name: "Ze Vitor", party: "PL", state: "MG", bio: "Deputado federal em exercicio, com dados publicos da Camara dos Deputados." },
  220552: { name: "Zucco", party: "PL", state: "RS", bio: "Deputado federal em exercicio, com dados publicos da Camara dos Deputados." },
};

const officialFallbackPoliticians = fallbackPoliticians.map((politician) => ({
  ...politician,
  ...officialFallbackById[politician.id],
}));

const toPolitician = (deputado: CamaraDeputado): Politician => ({
  id: deputado.id,
  img: deputado.urlFoto || getDeputyPhoto(deputado.id),
  name: deputado.nome,
  party: deputado.siglaPartido,
  state: deputado.siglaUf,
  bio: "Deputado federal em exercicio, com dados publicos da Camara dos Deputados.",
});

const newsItems = [
  {
    date: "16 JUN 2026",
    tag: "SENADO",
    headline: "Senado aprova em primeiro turno reforma da previdência municipal",
    lead: "Votação encerrou com 52 votos favoráveis e 28 contrários. Texto segue para a Câmara.",
  },
  {
    date: "15 JUN 2026",
    tag: "CÂMARA",
    headline: "Câmara derruba veto presidencial a reajuste do funcionalismo",
    lead: "Parlamentares votaram 310 a 142 pela derrubada do veto. Governo avalia medidas compensatórias.",
  },
  {
    date: "14 JUN 2026",
    tag: "EXECUTIVO",
    headline: "Planalto anuncia pacote de R$ 40 bi em infraestrutura para Norte e Nordeste",
    lead: "Obras preveem rodovias, portos e saneamento em 11 estados. Licitações abertas em agosto.",
  },
  {
    date: "13 JUN 2026",
    tag: "JUDICIÁRIO",
    headline: "STF retoma julgamento sobre limites do poder de investigação do Congresso",
    lead: "Sessão plenária foi acompanhada por representantes dos três poderes.",
  },
];

const stats = [
  { label: "Senadores", value: "81" },
  { label: "Deputados Federais", value: "513" },
  { label: "Governadores", value: "27" },
  { label: "Vereadores no país", value: "58.839" },
];

type Phase = "intro" | "transitioning" | "home";

export default function App() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [flash, setFlash] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [politicians, setPoliticians] = useState<Politician[]>(officialFallbackPoliticians);
  const [consequences, setConsequences] = useState<ThemeImage[]>(consequenceImages);

  useEffect(() => {
    const t = setInterval(() => setCursorVisible((v) => !v), 600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadExistingImages(localDeputyImagePaths)
      .then((localImages) => {
        if (localImages.length > 0) {
          setPoliticians(
            localImages.map((img, index) => ({
              id: index + 1,
              img,
              name: `Deputado ${String(index + 1).padStart(2, "0")}`,
              party: "BR",
              state: "BR",
              bio: "Imagem local escolhida para a faixa central.",
            })),
          );
          return null;
        }

        return fetch(CAMARA_DEPUTADOS_URL, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
      })
      .then((response) => {
        if (!response) return null;
        if (!response.ok) throw new Error("Falha ao carregar deputados");
        return response.json() as Promise<{ dados?: CamaraDeputado[] }>;
      })
      .then((payload) => {
        if (!payload) return;
        const deputados = (payload.dados || []).filter((deputado) => deputado.urlFoto);
        if (deputados.length > 0) {
          setPoliticians(deputados.slice(0, 14).map(toPolitician));
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Nao foi possivel carregar fotos da API da Camara.", error);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;

    loadExistingImages(localConsequenceImagePaths).then((localImages) => {
      if (!active || localImages.length === 0) return;
      setConsequences(
        localImages.map((img, index) => ({
          img,
          label: `Problema social ${String(index + 1).padStart(2, "0")}`,
        })),
      );
    });

    return () => {
      active = false;
    };
  }, []);

  const handleClick = useCallback(() => {
    if (phase !== "intro") return;
    setFlash(true);
    setTimeout(() => {
      setPhase("transitioning");
      setTimeout(() => setPhase("home"), 600);
    }, 120);
  }, [phase]);

  const strip1 = [...spendingImages, ...spendingImages, ...spendingImages];
  const strip2 = [...politicians, ...politicians].reverse();
  const strip3 = [...consequences, ...consequences, ...consequences];

  return (
    <div className="size-full overflow-hidden bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        @keyframes intro-exit {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.06); }
        }
        @keyframes home-enter {
          0%   { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes flash-in {
          0%   { opacity: 0; }
          50%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .strip-left  { animation: scroll-left  38s linear infinite; }
        .strip-right { animation: scroll-right 36s linear infinite; }
        .strip-left2 { animation: scroll-left  44s linear infinite; }
        .intro-exit  { animation: intro-exit 0.6s ease-in forwards; }
        .home-enter  { animation: home-enter 0.7s ease-out forwards; }
        .flash       { animation: flash-in 0.22s ease-out forwards; }
        .click-hint  { animation: pulse-text 2s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(196,18,48,0.4); border-radius: 2px; }
      `}</style>

      {/* Flash overlay */}
      {flash && (
        <div
          className="flash fixed inset-0 z-50 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #c41230 0%, #0a0a0a 100%)" }}
        />
      )}

      {/* ── INTRO ─────────────────────────────────────────── */}
      {phase !== "home" && (
        <div
          onClick={handleClick}
          className={`fixed inset-0 z-40 flex flex-col justify-center cursor-pointer select-none overflow-hidden bg-background ${phase === "transitioning" ? "intro-exit" : ""}`}
          style={{ background: "#0a0a0a" }}
        >
          {/* Grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: "180px",
            }}
          />

          {/* Top vignette */}
          <div className="absolute top-0 left-0 right-0 h-40 z-20 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0a0a0a, transparent)" }} />
          {/* Bottom vignette */}
          <div className="absolute bottom-0 left-0 right-0 h-40 z-20 pointer-events-none" style={{ background: "linear-gradient(to top, #0a0a0a, transparent)" }} />
          {/* Center mask */}
          <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 30%, rgba(10,10,10,0.7) 100%)" }} />

          {/* Scrolling strips */}
          <div className="flex flex-col gap-3">
            {/* Strip 1 — left */}
            <div className="overflow-hidden">
              <div className="strip-left flex gap-3" style={{ width: "max-content" }}>
                {strip1.map((item, i) => (
                  <div key={`${item.label}-${i}`} className="relative flex-shrink-0 w-40 h-48 overflow-hidden" style={{ filter: "grayscale(75%) contrast(1.15)" }}>
                    <img
                      src={item.img}
                      alt={item.label}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(196,18,48,0.34), rgba(10,10,10,0.08))" }} />
                    <span className="absolute bottom-2 left-2 right-2 text-[10px] uppercase tracking-[0.18em] text-white/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strip 2 — right */}
            <div className="overflow-hidden">
              <div className="strip-right flex gap-3" style={{ width: "max-content" }}>
                {strip2.map((p, i) => (
                  <div
                    key={`${p.id}-${i}`}
                    className="relative flex-shrink-0 w-44 h-56 md:w-48 md:h-64 overflow-hidden"
                    style={{ filter: "grayscale(65%) contrast(1.18)", boxShadow: "0 0 40px rgba(196,18,48,0.2)" }}
                  >
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover" loading="eager" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.3), transparent)" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Strip 3 — left */}
            <div className="overflow-hidden">
              <div className="strip-left2 flex gap-3" style={{ width: "max-content" }}>
                {strip3.map((item, i) => (
                  <div key={`${item.label}-${i}`} className="relative flex-shrink-0 w-40 h-48 overflow-hidden" style={{ filter: "grayscale(88%) contrast(1.2) brightness(0.82)" }}>
                    <img src={item.img} alt={item.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.7), rgba(196,18,48,0.16))" }} />
                    <span className="absolute bottom-2 left-2 right-2 text-[10px] uppercase tracking-[0.18em] text-white/75" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center text */}
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
            <p
              className="text-xs tracking-[0.35em] mb-4 px-3 py-1"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "#fff7e8",
                background: "rgba(10,10,10,0.38)",
                textShadow: "0 2px 14px rgba(0,0,0,0.95), 0 0 18px rgba(196,18,48,0.55)",
              }}
            >
              REPÚBLICA FEDERATIVA DO BRASIL
            </p>
            <h1
              className="text-6xl md:text-8xl font-black text-center leading-none mb-2"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#f0ece4",
                textShadow: "0 0 80px rgba(196,18,48,0.6)",
              }}
            >
              QUEM
            </h1>
            <h1
              className="text-6xl md:text-8xl font-black text-center leading-none"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#c41230",
                textShadow: "0 0 80px rgba(196,18,48,0.8)",
              }}
            >
              GOVERNA?
            </h1>
            <div className="mt-3 h-px w-24 bg-primary opacity-60" />
          </div>

          {/* Click hint */}
          <div className="absolute bottom-10 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
            <p
              className="click-hint text-xs tracking-[0.3em] px-4 py-2"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "#fff2d6",
                background: "rgba(10,10,10,0.5)",
                border: "1px solid rgba(240,236,228,0.28)",
                textShadow: "0 2px 12px rgba(0,0,0,0.95), 0 0 16px rgba(196,18,48,0.7)",
              }}
            >
              {cursorVisible ? "▶  CLIQUE PARA ENTRAR  ◀" : "   CLIQUE PARA ENTRAR   "}
            </p>
          </div>
        </div>
      )}

      {/* ── HOME ──────────────────────────────────────────── */}
      {phase === "home" && (
        <div className="home-enter min-h-screen overflow-y-auto" style={{ background: "#0a0a0a" }}>
          {/* NAV */}
          <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-border" style={{ background: "rgba(10,10,10,0.92)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-3">
              <span className="w-2 h-8 bg-primary block" />
              <span className="text-lg font-black tracking-wider" style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
                REPÚBLICA<span className="text-primary">BR</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {["Representantes", "Partidos", "Votações", "Transparência"].map((item) => (
                <button
                  key={item}
                  className="text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="text-xs tracking-widest px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ACESSO
            </button>
          </nav>

          {/* HERO */}
          <section className="relative px-6 md:px-12 pt-20 pb-16 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 opacity-10 pointer-events-none" style={{ background: "radial-gradient(ellipse, #c41230, transparent 70%)" }} />
            <p className="text-xs tracking-[0.3em] text-primary mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              PLATAFORMA DE TRANSPARÊNCIA POLÍTICA
            </p>
            <h2
              className="text-5xl md:text-7xl font-black leading-none mb-6 max-w-3xl"
              style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}
            >
              Conheça seus<br />
              <span className="text-primary">representantes.</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-xl leading-relaxed mb-10">
              Monitore votos, mandatos e declarações de bens de todos os parlamentares e governantes eleitos do Brasil em tempo real.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                className="px-6 py-3 bg-primary text-primary-foreground text-xs tracking-widest hover:opacity-90 transition-opacity"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                EXPLORAR AGORA
              </button>
              <button
                className="px-6 py-3 border border-border text-foreground text-xs tracking-widest hover:border-foreground transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                COMO FUNCIONA
              </button>
            </div>
          </section>

          {/* STATS BAR */}
          <section className="border-y border-border px-6 md:px-12 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span
                    className="text-3xl md:text-4xl font-black text-primary"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.value}
                  </span>
                  <span className="text-xs tracking-widest text-muted-foreground mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {s.label.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* REPRESENTATIVES */}
          <section className="px-6 md:px-12 py-16">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-xs tracking-[0.3em] text-primary mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  REPRESENTANTES EM DESTAQUE
                </p>
                <h3 className="text-3xl font-black" style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
                  Nossos Eleitos
                </h3>
              </div>
              <button className="hidden md:block text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground pb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                VER TODOS →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {politicians.map((p) => (
                <div
                  key={p.name}
                  className="group relative overflow-hidden cursor-pointer"
                  style={{ aspectRatio: "2/3" }}
                >
                  <div className="bg-card w-full h-full">
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ filter: "grayscale(40%) contrast(1.05)" }}
                    />
                  </div>
                  {/* Overlay */}
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(to top, rgba(10,10,10,0.95) 40%, rgba(10,10,10,0.2) 100%)" }}
                  >
                    <span
                      className="text-xs font-black text-primary tracking-widest block"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {p.party} · {p.state}
                    </span>
                    <span className="text-sm font-bold text-foreground leading-snug mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {p.name}
                    </span>
                  </div>
                  {/* Party badge always visible */}
                  <div className="absolute top-2 left-2 group-hover:opacity-0 transition-opacity">
                    <span
                      className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {p.party}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* NEWS */}
          <section className="px-6 md:px-12 pb-16">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-xs tracking-[0.3em] text-primary mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ÚLTIMAS NOTÍCIAS
                </p>
                <h3 className="text-3xl font-black" style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
                  O Congresso Hoje
                </h3>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-px border border-border" style={{ background: "rgba(240,236,228,0.1)" }}>
              {newsItems.map((n, i) => (
                <div
                  key={i}
                  className="bg-background p-6 hover:bg-card transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-xs bg-primary text-primary-foreground px-2 py-0.5"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {n.tag}
                    </span>
                    <span
                      className="text-xs text-muted-foreground"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {n.date}
                    </span>
                  </div>
                  <h4
                    className="text-lg font-bold leading-snug mb-3 group-hover:text-primary transition-colors"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}
                  >
                    {n.headline}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {n.lead}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    LER MAIS →
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-border px-6 md:px-12 py-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <span className="w-2 h-6 bg-primary block" />
                <span className="text-base font-black" style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
                  REPÚBLICA<span className="text-primary">BR</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                DADOS PÚBLICOS · TRANSPARÊNCIA · DEMOCRACIA
              </p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                © 2026 REPÚBLICABR
              </p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
