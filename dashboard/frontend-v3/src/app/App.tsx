import { useState, useEffect, useCallback, useContext } from "react";
import DeputadoPage from "./pages/DeputadoPage";
import { ThemeContext } from "../contexts/ThemeContext";
import EscolaridadePage from "./pages/EscolaridadePage";
import FornecedoresPage from "./pages/FornecedoresPage";
import GastosSociaisPage from "./pages/GastosSociaisPage";
import IdeologiaPage from "./pages/IdeologiaPage";
import ViesPage from "./pages/ViesPage";
import InfluenciaPage from "./pages/InfluenciaPage";
import PanoramaPage from "./pages/PanoramaPage";
import PartidosPage from "./pages/PartidosPage";

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

type QuestionCard = {
  id: number;
  title: string;
  image: string;
  fallbackImage: string;
  description: string;
};

const CAMARA_DEPUTADOS_URL =
  "https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=20";
const HERO_DEPUTADOS_URL =
  "https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=100";
const HERO_DEPUTY_ROTATION_MS = 2600;

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
const localGastosImagePaths = Array.from({ length: 10 }, (_, index) => `/intro/gastos/gasto-${String(index + 1).padStart(2, "0")}.jpg`);

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

const shufflePoliticians = (items: Politician[]) => [...items].sort(() => Math.random() - 0.5);

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

const referenceStats = [
  {
    value: "513",
    title: "Deputados Federais",
    detail: "na 57ª Legislatura",
  },
  {
    value: "R$ 1,48 bi",
    title: "Gastos Totais",
    detail: "CEAP acumulada 2023-2026",
  },
  {
    value: "34.712",
    title: "Proposições",
    detail: "apresentadas no período",
  },
];

const questionCards: QuestionCard[] = [
  {
    id: 1,
    title: "Panorama Geral",
    image: "/perguntas/q01/TH1.jpg",
    fallbackImage: "/intro/deputados/images (7).jpg",
    description:
      "Visão inicial dos principais indicadores da Câmara: deputados, gastos, votações, proposições e sinais gerais de comportamento parlamentar.",
  },
  {
    id: 2,
    title: "Quem é seu deputado?",
    image: "/perguntas/q02/images.jpg",
    fallbackImage: "/wordclouds/q2_nuvem_palavras_consolidado.png",
    description:
      "Consulta centrada no parlamentar: perfil, atuação, gastos, presença, proposições e dados públicos que ajudam a entender quem representa cada eleitor.",
  },
  {
    id: 3,
    title: "Partidos e como se comportam?",
    image: "/perguntas/q03/cover.jpg",
    fallbackImage: "/intro/deputados/160592.jpg",
    description:
      "Comparação entre partidos, disciplina interna, padrões de voto, alinhamentos e diferenças entre discurso partidário e comportamento observado.",
  },
  {
    id: 4,
    title: "Gastos e problemas sociais",
    image: "/fundorecortes/recorte4/recorte04.jpg",
    fallbackImage: "/fundorecortes/recorte4/recorte04.jpg",
    description:
      "Conexão entre os gastos públicos analisados e problemas sociais como saúde, educação, insegurança, pobreza e infraestrutura precária.",
  },
  {
    id: 5,
    title: "Fornecedores e deputados",
    image: "/perguntas/q05/ChatGPT Image Jun 16, 2026, 10_05_56 PM.png",
    fallbackImage: "/intro/deputados/160674.jpg",
    description:
      "Mapeamento das relações entre despesas parlamentares, fornecedores recorrentes, concentração de pagamentos e pares deputado-fornecedor.",
  },
  {
    id: 6,
    title: "Influência na Câmara",
    image: "/perguntas/q06/Captura de tela 2026-06-20 150902.png",
    fallbackImage: "/intro/deputados/178937.jpg",
    description:
      "Leitura de influência legislativa a partir de proposições, aprovações, participação em votações e capacidade de movimentar pautas dentro da Câmara.",
  },
  {
    id: 7,
    title: "Ideologia e deputado",
    image: "/perguntas/q07/Captura de tela 2026-06-20 150755.png",
    fallbackImage: "/intro/deputados/204374.jpg",
    description:
      "Análise do posicionamento ideológico de deputados e partidos com base em votos, blocos de comportamento e padrões de alinhamento político.",
  },
  {
    id: 8,
    title: "Escolaridade",
    image: "/perguntas/q08/download.png",
    fallbackImage: "/intro/deputados/204450.jpg",
    description:
      "Distribuição da escolaridade dos deputados federais e cruzamentos com atuação parlamentar, produção legislativa e outros indicadores.",
  },
];

const questionBlocks = questionCards.reduce<(typeof questionCards)[]>((blocks, item, index) => {
  if (index % 3 === 0) blocks.push([item]);
  else blocks[blocks.length - 1].push(item);
  return blocks;
}, []);

const homeProblemaPaths = [
  "/home/problemas/images.jpg",
  "/home/problemas/images (1).jpg",
  "/home/problemas/images (2).jpg",
  "/home/problemas/images (3).jpg",
  "/home/problemas/images (4).jpg",
  "/home/problemas/images (5).jpg",
  "/home/problemas/images (6).jpg",
  "/home/problemas/principais-problemas-sociais.jpg",
];

function ReferenceHome({
  deputies,
  problemImages,
  onNavigatePanorama,
  onNavigateDeputado,
  onNavigateFornecedores,
  onNavigateGastosSociais,
  onNavigateInfluencia,
  onNavigatePartidos,
  onNavigateIdeologia,
  onNavigateEscolaridade,
}: {
  deputies: Politician[];
  problemImages: string[];
  onNavigatePanorama: () => void;
  onNavigateDeputado: () => void;
  onNavigateFornecedores: () => void;
  onNavigateGastosSociais: () => void;
  onNavigateInfluencia: () => void;
  onNavigatePartidos: () => void;
  onNavigateIdeologia: () => void;
  onNavigateEscolaridade: () => void;
}) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [shockIndex, setShockIndex] = useState(0);
  const [shockDeputies, setShockDeputies] = useState<Politician[]>(() =>
    shufflePoliticians(deputies).slice(0, 40),
  );
  const currentShockDeputy = shockDeputies[shockIndex % Math.max(shockDeputies.length, 1)];
  const nextShockDeputy = shockDeputies[(shockIndex + 1) % Math.max(shockDeputies.length, 1)];

  useEffect(() => {
    setShockDeputies(shufflePoliticians(deputies).slice(0, 40));
    setShockIndex(0);
  }, [deputies]);

  useEffect(() => {
    if (shockDeputies.length < 2) return undefined;

    const intervalId = window.setInterval(() => {
      setShockIndex((index) => (index + 1) % shockDeputies.length);
    }, HERO_DEPUTY_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [shockDeputies.length]);

  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
        fontFamily: "'Inter', sans-serif",
        isolation: "isolate",
      }}
    >
      <style>{`
        @keyframes deputy-shock-cycle {
          0% {
            opacity: 1;
            filter: grayscale(0%) contrast(1) brightness(1) saturate(1);
            transform: scale(1);
          }
          26% {
            opacity: 1;
            filter: grayscale(0%) contrast(1) brightness(1) saturate(1);
            transform: scale(1.01);
          }
          42% {
            filter: grayscale(100%) contrast(1.85) brightness(0.72) saturate(0);
            transform: scale(1.04);
          }
          90% {
            opacity: 1;
            filter: grayscale(100%) contrast(1.85) brightness(0.72) saturate(0);
            transform: scale(1.04);
          }
          100% {
            opacity: 0;
            filter: grayscale(100%) contrast(2.2) brightness(0.52) saturate(0);
            transform: scale(1.07);
          }
        }
        @keyframes deputy-full-x-cycle {
          0%, 34% {
            opacity: 0;
            transform: scale(0.92);
          }
          46%, 90% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.04);
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <img
          src="/backgrounds/memoria-rasurada.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          style={{
            opacity: isDark ? 0.24 : 0.1,
            filter: isDark
              ? "grayscale(42%) contrast(1.2) brightness(0.58) saturate(0.72)"
              : "grayscale(72%) contrast(0.95) brightness(1.16) saturate(0.42)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(90deg, rgba(5,5,5,0.96) 0%, rgba(5,5,5,0.88) 39%, rgba(5,5,5,0.66) 100%)"
              : "linear-gradient(90deg, rgba(248,250,252,0.98) 0%, rgba(248,250,252,0.94) 43%, rgba(240,245,250,0.82) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "radial-gradient(circle at 78% 30%, rgba(224,8,54,0.22) 0, rgba(224,8,54,0.08) 24%, rgba(5,5,5,0) 52%)"
              : "radial-gradient(circle at 78% 30%, rgba(0,51,102,0.12) 0, rgba(196,18,48,0.055) 25%, rgba(248,250,252,0) 56%)",
          }}
        />
        <div
          className={`absolute inset-0 ${isDark ? "opacity-25" : "opacity-40"}`}
          style={{
            backgroundImage:
              isDark
                ? "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 5px)"
                : "repeating-linear-gradient(0deg, rgba(15,23,42,0.035) 0, rgba(15,23,42,0.035) 1px, transparent 1px, transparent 6px)",
          }}
        />
      </div>

      <header
        className="relative z-20 flex h-14 items-center justify-between border-b px-6 sm:px-10"
        style={{
          borderColor: "var(--surface-glass-border)",
          background: "var(--surface-glass)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="block h-[22px] w-1 bg-primary" />
          <span
            className="text-[16px] font-black tracking-[0.04em] text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            QUEM<span className="text-primary">GOVERNA</span>
          </span>
        </div>

        <nav
          className="hidden items-center gap-4 sm:flex"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.16em",
          }}
        >
          <span className="text-[13px] font-medium uppercase text-muted-foreground">Transparência</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-[13px] font-medium uppercase text-muted-foreground">Dados Públicos</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-[13px] font-medium uppercase text-muted-foreground">57ª Legislatura</span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => document.getElementById("recortes")?.scrollIntoView({ behavior: "smooth" })}
            className="hidden items-center gap-2 border px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.28em] transition-colors hover:border-primary hover:text-primary sm:flex"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              borderColor: isDark ? "rgba(243,239,232,0.28)" : "rgba(15,23,42,0.22)",
              color: isDark ? "rgba(243,239,232,0.72)" : "rgba(15,23,42,0.68)",
            }}
          >
            ROTEIRO DE ANÁLISE
          </button>
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <section className="home-page relative z-10 flex min-h-[calc(100vh-56px)] flex-col justify-between px-6 pb-10 pt-20 sm:px-10 sm:pt-[88px]">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[54vw]"
          style={{
            background: isDark
              ? "radial-gradient(circle at 63% 47%, rgba(224,8,54,0.10) 0, rgba(224,8,54,0.045) 17%, rgba(7,7,7,0) 38%)"
              : "radial-gradient(circle at 63% 47%, rgba(0,51,102,0.12) 0, rgba(196,18,48,0.055) 22%, rgba(248,250,252,0) 48%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(90deg, rgba(7,7,7,0.94) 0%, rgba(7,7,7,0.82) 46%, rgba(22,2,8,0.56) 100%)"
              : "linear-gradient(90deg, rgba(248,250,252,0.96) 0%, rgba(248,250,252,0.88) 47%, rgba(226,232,240,0.48) 100%)",
          }}
        />

        <div className="relative z-10 grid max-w-[1120px] items-center gap-8 lg:grid-cols-[minmax(0,760px)_minmax(250px,330px)]">
          <div>
            <p
              className="mb-7 text-[13px] font-bold uppercase"
              style={{
                color: "#e00836",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.36em",
              }}
            >
              ANÁLISE DE DADOS LEGISLATIVOS · BRASIL 2023-2026
            </p>

            <h1
              className="mb-6 font-black"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(62px, 7.2vw, 96px)",
                lineHeight: 0.82,
                letterSpacing: "-0.015em",
              }}
            >
              <span className="block">QUEM</span>
              <span className="mt-2 block" style={{ color: "#e00836" }}>
                GOVERNA?
              </span>
            </h1>

            <p
              className="max-w-[640px] text-[18px] leading-[1.55] sm:text-[21px]"
              style={{ color: isDark ? "rgba(243,239,232,0.88)" : "rgba(15,23,42,0.82)" }}
            >
              Uma análise de dados legislativos para revelar contradições entre
              gastos, votos, proposições, ideologia e comportamento parlamentar.
            </p>

            <p
              className="mt-5 text-[13px] leading-relaxed"
              style={{
                color: isDark ? "rgba(243,239,232,0.72)" : "rgba(15,23,42,0.68)",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.12em",
              }}
            >
              — Pesquisa restrita a Deputados Federais. Não abrange senadores,
              vereadores ou governadores.
            </p>
          </div>

          <div
            className="relative aspect-[0.78] w-full max-w-[280px] overflow-hidden border sm:max-w-[330px]"
            style={{
              background: isDark ? "#000000" : "#ffffff",
              borderColor: isDark ? "rgba(243,239,232,0.2)" : "rgba(15,23,42,0.14)",
              boxShadow: isDark
                ? "0 30px 90px rgba(0,0,0,0.64), inset 0 0 0 1px rgba(224,8,54,0.28)"
                : "0 26px 70px rgba(15,23,42,0.16), inset 0 0 0 1px rgba(0,51,102,0.12)",
            }}
            aria-hidden="true"
          >
            {nextShockDeputy && (
              <img
                key={`preload-${nextShockDeputy.id}`}
                src={nextShockDeputy.img}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top opacity-0"
                onError={(event) => {
                  event.currentTarget.src = getDeputyPhoto(nextShockDeputy.id);
                }}
              />
            )}
            {currentShockDeputy ? (
              <div
                className="absolute inset-0"
                style={{ filter: "blur(5px)", opacity: 0.10 }}
              >
                <img
                  key={currentShockDeputy.id}
                  src={currentShockDeputy.img}
                  alt=""
                  className="h-full w-full object-cover object-top"
                  style={{ animation: "deputy-shock-cycle 2.6s ease-in-out both" }}
                  onError={(event) => {
                    event.currentTarget.src = getDeputyPhoto(currentShockDeputy.id);
                  }}
                />
              </div>
            ) : (
              <div className="h-full w-full" style={{ background: isDark ? "#000000" : "#0a0a0a" }} />
            )}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: isDark
                  ? "linear-gradient(180deg, rgba(5,5,5,0.08) 0%, rgba(5,5,5,0) 34%, rgba(5,5,5,0.74) 100%), repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 34%, rgba(248,250,252,0.52) 100%), repeating-linear-gradient(0deg, rgba(15,23,42,0.05) 0, rgba(15,23,42,0.05) 1px, transparent 1px, transparent 5px)",
                mixBlendMode: isDark ? "screen" : "multiply",
                opacity: isDark ? 0.34 : 0.26,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: isDark
                  ? "inset 0 0 0 10px rgba(5,5,5,0.28), inset 0 0 54px rgba(224,8,54,0.22)"
                  : "inset 0 0 0 10px rgba(255,255,255,0.24), inset 0 0 48px rgba(0,51,102,0.12)",
              }}
            />
          </div>
        </div>

        <div
          className="relative z-10 mt-12 grid shrink-0 border sm:grid-cols-3"
          style={{ borderColor: "var(--border)" }}
        >
          {referenceStats.map((item, index) => (
            <article
              key={item.title}
              className="min-h-[190px] px-7 pt-8 pb-16 sm:px-8 sm:pt-9 sm:pb-20"
              style={{
                borderLeft: index === 0 ? "0" : "1px solid var(--border)",
                background: isDark
                  ? "transparent"
                  : index % 2 === 0
                    ? "rgba(255,255,255,0.68)"
                    : "rgba(241,245,249,0.58)",
                minHeight: "230px",
                paddingBottom: "80px",
              }}
            >
              <p
                className="text-[42px] font-black leading-none sm:text-[48px] text-primary"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: "-0.03em",
                }}
              >
                {item.value}
              </p>
              <h2 className="mt-2 text-[17px] font-black leading-tight text-foreground">
                {item.title}
              </h2>
              <p
                className="mt-2 text-[13px]"
                style={{
                  color: isDark ? "rgba(243,239,232,0.72)" : "rgba(15,23,42,0.65)",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.06em",
                }}
              >
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="home-investigation relative z-10 overflow-hidden border-y px-6 py-16 sm:px-10 sm:py-20"
        style={{
          borderColor: "var(--border)",
          background: isDark
            ? "var(--background)"
            : "linear-gradient(180deg, #ffffff 0%, #f8fafc 42%, #eef4f9 100%)",
        }}
      >
        <div
          className="absolute inset-0 grid grid-cols-2 sm:grid-cols-4"
          style={{ opacity: isDark ? 0.4 : 0.18 }}
        >
          {problemImages.map((src, index) => (
            <div key={src} className="relative min-h-[180px] overflow-hidden">
              <img
                src={src}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
                style={{
                  opacity: isDark ? (index % 2 === 0 ? 0.62 : 0.5) : index % 2 === 0 ? 0.44 : 0.36,
                  filter: isDark
                    ? "grayscale(70%) contrast(1.08) brightness(0.78)"
                    : "grayscale(88%) contrast(0.92) brightness(1.24) saturate(0.52)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: isDark
                    ? "linear-gradient(180deg, rgba(5,5,5,0.02) 0%, rgba(5,5,5,0.48) 100%)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(248,250,252,0.82) 100%)",
                }}
              />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(90deg, rgba(5,5,5,0.82) 0%, rgba(5,5,5,0.62) 48%, rgba(38,0,10,0.48) 100%)"
              : "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.78) 50%, rgba(226,232,240,0.64) 100%)",
          }}
        />
        <div
          className={`absolute inset-0 ${isDark ? "opacity-40" : "opacity-35"}`}
          style={{
            backgroundImage:
              isDark
                ? "repeating-linear-gradient(90deg, rgba(224,8,54,0.12) 0, rgba(224,8,54,0.12) 1px, transparent 1px, transparent 84px)"
                : "repeating-linear-gradient(90deg, rgba(0,51,102,0.08) 0, rgba(0,51,102,0.08) 1px, transparent 1px, transparent 84px)",
          }}
        />

        <div className="relative mx-auto max-w-[1434px]">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="mb-4 text-[13px] font-bold uppercase"
                style={{
                  color: "#e00836",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.36em",
                }}
              >
                O CUSTO DO ABANDONO
              </p>
              <h2
                className="max-w-[780px] text-[42px] font-black leading-[0.95] sm:text-[64px]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Antes dos números, existe o país que eles atravessam.
              </h2>
            </div>
            <p
              className="max-w-[430px] text-[16px] leading-relaxed sm:text-[17px]"
              style={{
                color: isDark ? "rgba(243,239,232,0.82)" : "rgba(15,23,42,0.75)",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.04em",
              }}
            >
              Fome, saúde precária, insegurança, violência e falta de educação
              compõem o pano de fundo das decisões, gastos e votos analisados.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {problemImages.map((src, index) => (
              <figure
                key={`problem-gallery-${src}`}
                tabIndex={0}
                className={`group relative m-0 min-h-[250px] overflow-hidden border ${
                  index === 0 || index === 3 || index === 4 || index === 7 ? "lg:col-span-2" : ""
                }`}
                style={{
                  background: isDark ? "#000000" : "#ffffff",
                  borderColor: isDark ? "rgba(243,239,232,0.22)" : "rgba(15,23,42,0.12)",
                  boxShadow: isDark ? "none" : "0 18px 45px rgba(15,23,42,0.08)",
                }}
                onMouseEnter={(event) => {
                  const image = event.currentTarget.querySelector("img");
                  if (image) {
                    image.style.filter = isDark
                      ? "grayscale(0%) contrast(1.03) brightness(1.02) saturate(1.08)"
                      : "grayscale(8%) contrast(1) brightness(1.04) saturate(1.02)";
                  }
                }}
                onMouseLeave={(event) => {
                  const image = event.currentTarget.querySelector("img");
                  if (image) {
                    image.style.filter = isDark
                      ? "grayscale(100%) contrast(1.18) brightness(0.52)"
                      : "grayscale(62%) contrast(0.96) brightness(1.08) saturate(0.78)";
                  }
                }}
                onFocus={(event) => {
                  const image = event.currentTarget.querySelector("img");
                  if (image) {
                    image.style.filter = isDark
                      ? "grayscale(0%) contrast(1.03) brightness(1.02) saturate(1.08)"
                      : "grayscale(8%) contrast(1) brightness(1.04) saturate(1.02)";
                  }
                }}
                onBlur={(event) => {
                  const image = event.currentTarget.querySelector("img");
                  if (image) {
                    image.style.filter = isDark
                      ? "grayscale(100%) contrast(1.18) brightness(0.52)"
                      : "grayscale(62%) contrast(0.96) brightness(1.08) saturate(0.78)";
                  }
                }}
              >
                <img
                  src={src}
                  alt=""
                  className="h-full min-h-[250px] w-full object-cover transition duration-500 group-hover:scale-105"
                  style={{
                    filter: isDark
                      ? "grayscale(100%) contrast(1.18) brightness(0.52)"
                      : "grayscale(62%) contrast(0.96) brightness(1.08) saturate(0.78)",
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-hover:opacity-10"
                  style={{
                    background: isDark
                      ? "linear-gradient(180deg, rgba(5,5,5,0.08) 0%, rgba(5,5,5,0.54) 100%)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(248,250,252,0.42) 100%)",
                  }}
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section
        id="recortes"
        className="relative z-10 px-6 py-16 sm:px-10 sm:py-20"
        style={{ background: "var(--background)" }}
      >
        <div className="mx-auto max-w-[1434px]">
          <div className="mb-10 flex flex-col justify-between gap-5 border-t pt-8 sm:flex-row sm:items-end">
            <div>
              <p
                className="mb-3 text-[13px] font-bold uppercase"
                style={{
                  color: "#e00836",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.36em",
                }}
              >
                ROTEIRO DE ANÁLISE
              </p>
              <h2
                className="max-w-[720px] text-[38px] font-black leading-none sm:text-[52px]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                8 recortes para entender quem governa.
              </h2>
            </div>
            <p
              className="max-w-[380px] text-[15px] leading-relaxed sm:text-[16px]"
              style={{
                color: isDark ? "rgba(243,239,232,0.78)" : "rgba(15,23,42,0.72)",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.04em",
              }}
            >
              Cada bloco reúne um panorama de investigação, com imagem provisória
              até a escolha visual definitiva de cada recorte.
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 sm:-mx-10 sm:px-10" style={{ scrollbarWidth: "auto", scrollbarColor: isDark ? "rgba(224,8,54,0.85) rgba(255,255,255,0.06)" : "rgba(0,51,102,0.65) rgba(15,23,42,0.08)" }}>
            {questionCards.map((item) => {
              const navigateHandler =
                item.id === 1 ? onNavigatePanorama
                : item.id === 2 ? onNavigateDeputado
                : item.id === 3 ? onNavigatePartidos
                : item.id === 4 ? onNavigateGastosSociais
                : item.id === 5 ? onNavigateFornecedores
                : item.id === 6 ? onNavigateInfluencia
                : item.id === 7 ? onNavigateIdeologia
                : item.id === 8 ? onNavigateEscolaridade
                : undefined;

              return (
                <article
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={navigateHandler}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === " ") && navigateHandler) {
                      event.preventDefault();
                      navigateHandler();
                    }
                  }}
                  className="group flex flex-shrink-0 w-[260px] flex-col overflow-hidden border cursor-pointer"
                  style={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="relative h-[160px] overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={`Análise ${item.id}`}
                      className={`h-full w-full transition-transform duration-700 group-hover:scale-105 ${
                        item.id === 4 || item.id === 8 || item.fallbackImage.includes("/wordclouds/") ? "object-contain" : "object-cover"
                      }`}
                      style={{
                        filter: item.fallbackImage.includes("/wordclouds/")
                          ? "grayscale(35%) contrast(1.08) brightness(0.9)"
                          : "grayscale(72%) contrast(1.08) brightness(0.86)",
                        background: item.id === 4 || item.id === 8 || item.fallbackImage.includes("/wordclouds/") ? "#0a0a0a" : "transparent",
                      }}
                      onError={(event) => {
                        if (event.currentTarget.src.endsWith(item.fallbackImage)) return;
                        event.currentTarget.src = item.fallbackImage;
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(180deg, rgba(7,7,7,0) 40%, rgba(7,7,7,0.55) 100%)" }}
                    />
                    <span
                      className="absolute bottom-3 left-4 text-[42px] font-black leading-none"
                      style={{
                        color: "#e00836",
                        fontFamily: "'Playfair Display', serif",
                        letterSpacing: "-0.04em",
                        textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                      }}
                    >
                      {item.id}
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 justify-between p-5">
                    <div>
                      <h3
                        className="text-[17px] font-black leading-tight text-foreground"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="mt-3 text-[15px] leading-relaxed"
                        style={{
                          color: isDark ? "rgba(243,239,232,0.86)" : "rgba(15,23,42,0.80)",
                        }}
                      >
                        {item.description}
                      </p>
                    </div>
                    <div
                      className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors group-hover:text-primary"
                      style={{
                        color: isDark ? "rgba(243,239,232,0.45)" : "rgba(15,23,42,0.4)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <span>Acessar</span>
                      <span>→</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div className="relative z-10 flex justify-center border-t py-10" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-3 border px-8 py-3 text-[13px] font-bold uppercase tracking-[0.3em] transition-colors hover:border-primary hover:text-primary"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            borderColor: isDark ? "rgba(243,239,232,0.28)" : "rgba(15,23,42,0.22)",
            color: isDark ? "rgba(243,239,232,0.72)" : "rgba(15,23,42,0.68)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 13V3M8 3L3 8M8 3L13 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar ao início
        </button>
      </div>
    </main>
  );
}

type Phase = "intro" | "transitioning" | "home";

export default function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [flash, setFlash] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [politicians, setPoliticians] = useState<Politician[]>(officialFallbackPoliticians);
  const [heroDeputies, setHeroDeputies] = useState<Politician[]>(officialFallbackPoliticians);
  const [consequences, setConsequences] = useState<ThemeImage[]>(consequenceImages);
  const [gastos, setGastos] = useState<ThemeImage[]>(spendingImages);
  const [homeProblemas, setHomeProblemas] = useState<string[]>([]);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const navigateHome = useCallback(() => {
    setPhase("home");
    navigateTo("/");
  }, [navigateTo]);

  const navigateRecortes = useCallback(() => {
    setPhase("home");
    window.history.pushState({}, "", "/");
    setCurrentPath("/");
    window.setTimeout(() => {
      document.getElementById("recortes")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, []);

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
    const controller = new AbortController();

    fetch(HERO_DEPUTADOS_URL, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao carregar deputados para a home");
        return response.json() as Promise<{ dados?: CamaraDeputado[] }>;
      })
      .then((payload) => {
        const deputados = (payload.dados || []).filter((deputado) => deputado.urlFoto);
        if (deputados.length > 0) setHeroDeputies(shufflePoliticians(deputados.map(toPolitician)));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Nao foi possivel carregar deputados da API para a home.", error);
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

  useEffect(() => {
    let active = true;

    loadExistingImages(homeProblemaPaths).then((existing) => {
      if (!active || existing.length === 0) return;
      setHomeProblemas(existing);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    loadExistingImages(localGastosImagePaths).then((localImages) => {
      if (!active || localImages.length === 0) return;
      setGastos(
        localImages.map((img, index) => ({
          img,
          label: `Gasto público ${String(index + 1).padStart(2, "0")}`,
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

  const strip1 = [...gastos, ...gastos, ...gastos];
  const strip2 = [...politicians, ...politicians].reverse();
  const strip3 = [...consequences, ...consequences, ...consequences];

  if (["/q/q1", "/recortes/panorama", "/panorama"].includes(currentPath)) {
    return <PanoramaPage onNavigateHome={navigateHome} onNavigateRecortes={navigateRecortes} onNavigateDeputado={() => navigateTo("/q/q2")} onNavigateRecorte={(path) => navigateTo(path)} />;
  }

  if (["/q/q2", "/recortes/deputado", "/deputado"].includes(currentPath)) {
    return <DeputadoPage onNavigateHome={navigateHome} onNavigateRecortes={navigateRecortes} onNavigateRecorte={(path) => navigateTo(path)} />;
  }

  if (["/q/q3", "/recortes/partidos", "/partidos"].includes(currentPath)) {
    return <PartidosPage onNavigateHome={navigateHome} onNavigateRecortes={navigateRecortes} onNavigateDeputado={() => navigateTo("/q/q2")} onNavigateRecorte={(path) => navigateTo(path)} />;
  }

  if (["/q/q4", "/recortes/gastos-sociais", "/gastos-sociais"].includes(currentPath)) {
    return <GastosSociaisPage onNavigateHome={navigateHome} onNavigateRecortes={navigateRecortes} onNavigateDeputado={() => navigateTo("/q/q2")} onNavigateRecorte={(path) => navigateTo(path)} />;
  }

  if (["/q/q5", "/recortes/fornecedores", "/fornecedores"].includes(currentPath)) {
    return <FornecedoresPage onNavigateHome={navigateHome} onNavigateRecortes={navigateRecortes} onNavigateDeputado={() => navigateTo("/q/q2")} onNavigateRecorte={(path) => navigateTo(path)} />;
  }

  if (["/q/q6", "/recortes/influencia", "/influencia"].includes(currentPath)) {
    return <InfluenciaPage onNavigateHome={navigateHome} onNavigateRecortes={navigateRecortes} onNavigateDeputado={() => navigateTo("/q/q2")} onNavigateRecorte={(path) => navigateTo(path)} />;
  }

  if (["/q/q7", "/recortes/ideologia", "/ideologia", "/comportamento"].includes(currentPath)) {
    return <ViesPage onNavigateHome={navigateHome} onNavigateRecortes={navigateRecortes} onNavigateDeputado={() => navigateTo("/q/q2")} onNavigateRecorte={(path) => navigateTo(path)} />;
  }

  if (["/q/q8", "/recortes/escolaridade", "/escolaridade"].includes(currentPath)) {
    return <EscolaridadePage onNavigateHome={navigateHome} onNavigateRecortes={navigateRecortes} onNavigateDeputado={() => navigateTo("/q/q2")} onNavigateRecorte={(path) => navigateTo(path)} />;
  }

  if (phase === "home") {
    return (
      <ReferenceHome
        deputies={heroDeputies}
        problemImages={homeProblemas}
        onNavigatePanorama={() => navigateTo("/q/q1")}
        onNavigateDeputado={() => navigateTo("/q/q2")}
        onNavigateFornecedores={() => navigateTo("/q/q5")}
        onNavigateGastosSociais={() => navigateTo("/q/q4")}
        onNavigateInfluencia={() => navigateTo("/q/q6")}
        onNavigatePartidos={() => navigateTo("/q/q3")}
        onNavigateIdeologia={() => navigateTo("/q/q7")}
        onNavigateEscolaridade={() => navigateTo("/q/q8")}
      />
    );
  }

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
        @keyframes title-reveal {
          0%   { opacity: 0; transform: translateY(28px) skewY(1.5deg); }
          100% { opacity: 1; transform: translateY(0) skewY(0deg); }
        }
        @keyframes tagline-reveal {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes chevron-bob {
          0%, 100% { transform: translateY(0); opacity: 0.9; }
          50%       { transform: translateY(7px); opacity: 0.5; }
        }
        .strip-left  { animation: scroll-left  62s linear infinite; }
        .strip-right { animation: scroll-right 78s linear infinite; }
        .strip-left2 { animation: scroll-left  52s linear infinite; }
        @media (max-width: 768px) {
          .strip-left, .strip-right, .strip-left2 { animation-play-state: paused; }
        }
        .intro-exit  { animation: intro-exit 0.6s ease-in forwards; }
        .home-enter  { animation: home-enter 0.7s ease-out forwards; }
        .flash       { animation: flash-in 0.22s ease-out forwards; }
        .click-hint  { animation: pulse-text 2s ease-in-out infinite; }
        .title-line-1 { animation: title-reveal 0.72s cubic-bezier(0.22,1,0.36,1) 0.18s both; }
        .title-line-2 { animation: title-reveal 0.72s cubic-bezier(0.22,1,0.36,1) 0.42s both; }
        .intro-tagline { animation: tagline-reveal 0.6s ease-out 0.88s both; }
        .intro-divider { animation: tagline-reveal 0.5s ease-out 0.72s both; }
        .chevron-cta   { animation: chevron-bob 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .strip-left, .strip-right, .strip-left2 { animation: none !important; }
          .chevron-cta { animation: none !important; }
          .title-line-1, .title-line-2 { animation: none !important; opacity: 1; transform: none; }
          .intro-tagline, .intro-divider { animation: none !important; opacity: 1; transform: none; }
          .intro-exit, .home-enter { animation: none !important; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(196,18,48,0.4); border-radius: 2px; }
      `}</style>

      {/* Flash overlay */}
      {flash && (
        <div
          className="flash fixed inset-0 z-50 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse, #c41230 0%, #0a0a0a 100%)"
              : "radial-gradient(ellipse, #003366 0%, #ffffff 100%)",
          }}
        />
      )}

      {/* ── INTRO ─────────────────────────────────────────── */}
      {phase !== "home" && (
        <div
          onClick={handleClick}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
          role="button"
          tabIndex={0}
          aria-label="Tela de entrada. Pressione Enter ou clique para acessar o painel Quem Governa."
          className={`fixed inset-0 z-40 flex flex-col justify-center cursor-pointer select-none overflow-hidden bg-background ${phase === "transitioning" ? "intro-exit" : ""}`}
        >
          {/* Theme toggle — top right, stops propagation so it doesn't enter the app */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
            className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.9rem",
              color: isDark ? "rgba(243,239,232,0.88)" : "rgba(15,23,42,0.88)",
              borderColor: isDark ? "rgba(243,239,232,0.55)" : "rgba(15,23,42,0.55)",
              background: isDark ? "rgba(10,10,10,0.70)" : "rgba(255,255,255,0.80)",
              backdropFilter: "blur(6px)",
              outlineColor: isDark ? "#f0ece4" : "#003366",
            }}
          >
            {isDark ? "☀" : "☾"}
          </button>

          {/* Grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: "180px",
              opacity: isDark ? 0.30 : 0.08,
            }}
          />

          {/* Global scrim — uniformizes brightness across all strip cards */}
          <div
            className="absolute inset-0 z-[15] pointer-events-none"
            style={{
              background: isDark ? "rgba(0,0,0,0.52)" : "rgba(248,250,252,0.56)",
            }}
          />

          {/* Top vignette */}
          <div
            className="absolute top-0 left-0 right-0 h-40 z-20 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, var(--background), transparent)" }}
          />
          {/* Bottom vignette */}
          <div
            className="absolute bottom-0 left-0 right-0 h-40 z-20 pointer-events-none"
            style={{ background: "linear-gradient(to top, var(--background), transparent)" }}
          />
          {/* Outer edge mask — darkens/lightens the periphery */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: isDark
                ? "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 28%, rgba(5,5,5,0.82) 100%)"
                : "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 28%, rgba(248,250,252,0.88) 100%)",
            }}
          />
          {/* Central text scrim — reading bubble behind the title (WCAG contrast layer) */}
          <div
            className="absolute inset-0 z-[25] pointer-events-none"
            style={{
              background: isDark
                ? "radial-gradient(ellipse 52% 44% at 50% 50%, rgba(0,0,0,0.76) 0%, rgba(0,0,0,0.44) 52%, transparent 72%)"
                : "radial-gradient(ellipse 52% 44% at 50% 50%, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.58) 54%, transparent 74%)",
            }}
          />

          {/* Scrolling strips — decorative, hidden from assistive technologies */}
          <div className="flex flex-col gap-3" aria-hidden="true">
            {/* Strip 1 — left | gastos públicos */}
            <div className="overflow-hidden" style={{ opacity: 0.95 }}>
              <div className="strip-left flex gap-3" style={{ width: "max-content" }}>
                {strip1.map((item, i) => (
                  <div key={`${item.label}-${i}`} className="relative flex-shrink-0 w-40 h-48 overflow-hidden" style={{ filter: "contrast(1.08) brightness(1.00)" }}>
                    <img
                      src={item.img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: isDark
                          ? "linear-gradient(to top, rgba(5,5,5,0.20) 0%, transparent 50%)"
                          : "linear-gradient(to top, rgba(248,250,252,0.22) 0%, transparent 50%)",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Strip 2 — right | atores políticos */}
            <div className="overflow-hidden" style={{ opacity: 0.60, filter: "blur(4px)" }}>
              <div className="strip-right flex gap-3" style={{ width: "max-content" }}>
                {strip2.map((p, i) => (
                  <div
                    key={`${p.id}-${i}`}
                    className="relative flex-shrink-0 w-44 h-56 md:w-48 md:h-64 overflow-hidden"
                    style={{
                      filter: "grayscale(70%) brightness(0.85) contrast(0.95)",
                    }}
                  >
                    <img src={p.img} alt="" className="w-full h-full object-cover" loading="eager" />
                    <div
                      className="absolute inset-0"
                      style={{ background: "rgba(0,0,0,0.18)" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Strip 3 — left | problemas sociais */}
            <div className="overflow-hidden" style={{ opacity: 0.92 }}>
              <div className="strip-left2 flex gap-3" style={{ width: "max-content" }}>
                {strip3.map((item, i) => (
                  <div
                    key={`${item.label}-${i}`}
                    className="relative flex-shrink-0 w-40 h-48 overflow-hidden"
                    style={{ filter: "contrast(1.05) brightness(1.00)" }}
                  >
                    <img src={item.img} alt="" className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: isDark
                          ? "linear-gradient(to top, rgba(5,5,5,0.30) 0%, transparent 55%)"
                          : "linear-gradient(to top, rgba(248,250,252,0.32) 0%, transparent 55%)",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center text */}
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
            <p
              className="text-sm tracking-[0.35em] mb-6 px-3 py-1"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: isDark ? "#fff7e8" : "#0a1628",
                background: isDark ? "rgba(5,5,5,0.55)" : "rgba(255,255,255,0.72)",
                border: isDark ? "1px solid rgba(243,239,232,0.12)" : "1px solid rgba(15,23,42,0.10)",
                backdropFilter: "blur(4px)",
                textShadow: isDark
                  ? "0 1px 6px rgba(0,0,0,0.98), 0 0 18px rgba(196,18,48,0.4)"
                  : "none",
              }}
            >
              REPÚBLICA FEDERATIVA DO BRASIL
            </p>
            <h1
              aria-label="Quem Governa?"
              className="text-6xl md:text-8xl font-black text-center leading-none"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <div style={{ overflow: "hidden" }}>
                <span
                  aria-hidden="true"
                  className="title-line-1 block mb-1"
                  style={{
                    color: isDark ? "#f0ece4" : "#0a1628",
                    textShadow: isDark
                      ? "0 2px 8px rgba(0,0,0,1), 0 4px 28px rgba(0,0,0,0.96), 0 0 80px rgba(196,18,48,0.55)"
                      : "0 0 24px rgba(255,255,255,1), 0 2px 14px rgba(255,255,255,0.96), 0 4px 32px rgba(255,255,255,0.88)",
                  }}
                >
                  QUEM
                </span>
              </div>
              <div style={{ overflow: "hidden" }}>
                <span
                  aria-hidden="true"
                  className="title-line-2 block"
                  style={{
                    color: isDark ? "#c41230" : "#003366",
                    textShadow: isDark
                      ? "0 2px 8px rgba(0,0,0,1), 0 4px 28px rgba(0,0,0,0.94), 0 0 80px rgba(196,18,48,0.72)"
                      : "0 0 22px rgba(255,255,255,1), 0 2px 14px rgba(255,255,255,0.95), 0 4px 32px rgba(255,255,255,0.84)",
                  }}
                >
                  GOVERNA?
                </span>
              </div>
            </h1>
            <div className="intro-divider mt-5 h-px w-24 bg-primary opacity-60" />
            <p
              className="intro-tagline mt-4 text-[13px] font-bold tracking-[0.24em] text-center"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: isDark ? "rgba(243,239,232,0.78)" : "#1a2a40",
                textShadow: isDark
                  ? "0 1px 6px rgba(0,0,0,0.96)"
                  : "0 1px 4px rgba(255,255,255,0.98)",
              }}
            >
              DADOS LEGISLATIVOS · 57ª LEGISLATURA · 2023–2026
            </p>
          </div>

          {/* Click hint — accessible CTA with high-contrast backdrop */}
          <div className="absolute bottom-16 left-0 right-0 z-30 flex flex-col items-center gap-3 pointer-events-none">
            <div
              className="chevron-cta flex flex-col items-center gap-1"
              style={{ color: isDark ? "#e00836" : "#003366" }}
            >
              <svg width="28" height="28" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path
                  d="M4 8l7 7 7-7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              className="px-7 py-2.5 text-[13px] font-bold tracking-[0.42em]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: isDark ? "rgba(243,239,232,0.92)" : "rgba(10,22,40,0.92)",
                background: isDark ? "rgba(5,5,5,0.72)" : "rgba(255,255,255,0.84)",
                border: isDark ? "1px solid rgba(243,239,232,0.38)" : "1px solid rgba(10,22,40,0.38)",
                backdropFilter: "blur(6px)",
              }}
            >
              ENTRAR
            </span>
          </div>
        </div>
      )}

      {/* ── HOME ──────────────────────────────────────────── */}
      {phase === "home" && (
        <div className="home-enter min-h-screen overflow-y-auto bg-background">
          {/* NAV */}
          <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-border" style={{ background: "var(--surface-glass)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-3">
              <span className="w-2 h-8 bg-primary block" />
              <span className="text-lg font-black tracking-wider text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
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
              className="text-5xl md:text-7xl font-black leading-none mb-6 max-w-3xl text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
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
                <h3 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
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
                <h3 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
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
                    className="text-lg font-bold leading-snug mb-3 group-hover:text-primary transition-colors text-foreground"
                    style={{ fontFamily: "'Playfair Display', serif" }}
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
                <span className="text-base font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
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
