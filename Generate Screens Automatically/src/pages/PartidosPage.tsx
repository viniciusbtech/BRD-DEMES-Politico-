import { useState } from "react";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import { fmt } from "../data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

/* ── Mock data ─────────────────────────────────── */
const PARTIES = [
  { id: "PL",    name: "PL",    full: "Partido Liberal",                         seats: 99,  color: "#1a3a7c", presenca: 76, gasto: 41200000 },
  { id: "UNIAO", name: "UNIÃO", full: "União Brasil",                             seats: 59,  color: "#d4841a", presenca: 79, gasto: 24600000 },
  { id: "PT",    name: "PT",    full: "Partido dos Trabalhadores",                seats: 68,  color: "#c41230", presenca: 84, gasto: 28400000 },
  { id: "PP",    name: "PP",    full: "Progressistas",                            seats: 47,  color: "#2e5fa3", presenca: 78, gasto: 19500000 },
  { id: "MDB",   name: "MDB",  full: "Movimento Democrático Brasileiro",          seats: 42,  color: "#4a7c59", presenca: 81, gasto: 17400000 },
  { id: "REPO",  name: "REPO", full: "Republicanos",                              seats: 40,  color: "#7b3fa0", presenca: 77, gasto: 16600000 },
  { id: "PDT",   name: "PDT",  full: "Partido Democrático Trabalhista",           seats: 17,  color: "#c8970a", presenca: 82, gasto: 7100000  },
  { id: "PSDB",  name: "PSDB", full: "Partido da Social Democracia Brasileira",   seats: 13,  color: "#888880", presenca: 73, gasto: 5400000  },
];

const CAT_SPEND: Record<string, { cat: string; value: number; color: string }[]> = {
  PL:    [{ cat: "Passagens Aéreas", value: 16800000, color: "#c41230" }, { cat: "Divulgação", value: 10400000, color: "#d4841a" }, { cat: "Combustível", value: 6900000, color: "#4a7c59" }, { cat: "Alimentação", value: 5200000, color: "#2e5fa3" }, { cat: "Outros", value: 1900000, color: "#555" }],
  UNIAO: [{ cat: "Passagens Aéreas", value: 10100000, color: "#c41230" }, { cat: "Divulgação", value: 6200000,  color: "#d4841a" }, { cat: "Combustível", value: 3800000, color: "#4a7c59" }, { cat: "Alimentação", value: 2900000, color: "#2e5fa3" }, { cat: "Outros", value: 1600000, color: "#555" }],
  PT:    [{ cat: "Passagens Aéreas", value: 11200000, color: "#c41230" }, { cat: "Divulgação", value: 7100000,  color: "#d4841a" }, { cat: "Combustível", value: 4200000, color: "#4a7c59" }, { cat: "Alimentação", value: 3800000, color: "#2e5fa3" }, { cat: "Outros", value: 2100000, color: "#555" }],
  PP:    [{ cat: "Passagens Aéreas", value: 7900000,  color: "#c41230" }, { cat: "Divulgação", value: 4800000,  color: "#d4841a" }, { cat: "Combustível", value: 3100000, color: "#4a7c59" }, { cat: "Alimentação", value: 2400000, color: "#2e5fa3" }, { cat: "Outros", value: 1300000, color: "#555" }],
  MDB:   [{ cat: "Passagens Aéreas", value: 7100000,  color: "#c41230" }, { cat: "Divulgação", value: 4300000,  color: "#d4841a" }, { cat: "Combustível", value: 2800000, color: "#4a7c59" }, { cat: "Alimentação", value: 2100000, color: "#2e5fa3" }, { cat: "Outros", value: 1100000, color: "#555" }],
  REPO:  [{ cat: "Passagens Aéreas", value: 6600000,  color: "#c41230" }, { cat: "Divulgação", value: 4000000,  color: "#d4841a" }, { cat: "Combustível", value: 2700000, color: "#4a7c59" }, { cat: "Alimentação", value: 2100000, color: "#2e5fa3" }, { cat: "Outros", value: 1200000, color: "#555" }],
  PDT:   [{ cat: "Passagens Aéreas", value: 2900000,  color: "#c41230" }, { cat: "Divulgação", value: 1700000,  color: "#d4841a" }, { cat: "Combustível", value: 1000000, color: "#4a7c59" }, { cat: "Alimentação", value: 900000,  color: "#2e5fa3" }, { cat: "Outros", value: 600000,  color: "#555" }],
  PSDB:  [{ cat: "Passagens Aéreas", value: 2200000,  color: "#c41230" }, { cat: "Divulgação", value: 1400000,  color: "#d4841a" }, { cat: "Combustível", value: 800000,  color: "#4a7c59" }, { cat: "Alimentação", value: 600000,  color: "#2e5fa3" }, { cat: "Outros", value: 400000,  color: "#555" }],
};

const PROPOSALS: Record<string, { id: string; title: string; status: "Aprovado" | "Em votação" | "Rejeitado" | "Arquivado"; author: string; date: string }[]> = {
  PL:    [{ id: "PL 102/2023", title: "Porte de arma para produtores rurais",         status: "Aprovado",   author: "Dep. Marcos Neto",    date: "Mar 2023" }, { id: "PL 445/2023", title: "Redução do ICMS sobre combustíveis",         status: "Aprovado",   author: "Dep. Paulo Mota",     date: "Jun 2023" }, { id: "PL 981/2024", title: "Privatização de terminais portuários",        status: "Em votação", author: "Dep. Sérgio Lima",    date: "Jan 2024" }, { id: "PL 1203/2024",title: "Marco regulatório de defesa pessoal",         status: "Rejeitado",  author: "Dep. André Faria",    date: "Abr 2024" }, { id: "PL 2340/2025",title: "Desburocratização do setor agropecuário",     status: "Em votação", author: "Dep. Carlos Braga",   date: "Fev 2025" }],
  PT:    [{ id: "PL 234/2023", title: "Ampliação do Bolsa Família urbano",            status: "Aprovado",   author: "Dep. Carlos Farias",  date: "Mai 2023" }, { id: "PL 567/2023", title: "Piso nacional de enfermagem",                status: "Aprovado",   author: "Dep. Roberto Silva",  date: "Set 2023" }, { id: "PL 890/2024", title: "Reforma tributária progressiva",              status: "Em votação", author: "Dep. Ana Souza",      date: "Mar 2024" }, { id: "PL 1456/2024",title: "Habitação popular em áreas urbanas",          status: "Aprovado",   author: "Dep. João Lima",      date: "Jul 2024" }, { id: "PL 2100/2025",title: "Expansão do programa de saúde da família",    status: "Em votação", author: "Dep. Maria Costa",    date: "Jan 2025" }],
  MDB:   [{ id: "PL 321/2023", title: "Modernização do código eleitoral",             status: "Em votação", author: "Dep. André Lima",     date: "Abr 2023" }, { id: "PL 654/2023", title: "Parcerias público-privadas em infraestrutura", status: "Aprovado",   author: "Dep. Paulo Câmara",   date: "Ago 2023" }, { id: "PL 987/2024", title: "Regulação de plataformas digitais",           status: "Arquivado",  author: "Dep. Sara Mendes",    date: "Fev 2024" }, { id: "PL 1678/2024",title: "Fundo municipal de desenvolvimento",           status: "Aprovado",   author: "Dep. Bruno Soares",   date: "Jun 2024" }, { id: "PL 2234/2025",title: "Incentivos fiscais para inovação",             status: "Em votação", author: "Dep. Lúcia Ferreira", date: "Mar 2025" }],
  UNIAO: [{ id: "PL 410/2023", title: "Marco do agronegócio sustentável",             status: "Aprovado",   author: "Dep. Heitor Viana",   date: "Mai 2023" }, { id: "PL 720/2024", title: "Renegociação de dívidas municipais",           status: "Em votação", author: "Dep. Fátima Queiroz", date: "Fev 2024" }, { id: "PL 1100/2024",title: "Concessão de rodovias federais",               status: "Aprovado",   author: "Dep. Renato Abreu",   date: "Mai 2024" }, { id: "PL 1890/2025",title: "Programa nacional de saneamento básico",       status: "Em votação", author: "Dep. Celso Sabino",   date: "Jan 2025" }, { id: "PL 2410/2025",title: "Desoneração da folha para micro empresas",    status: "Em votação", author: "Dep. Elmar Nascimento",date: "Mar 2025" }],
  PP:    [{ id: "PL 188/2023", title: "Obras de infraestrutura em municípios pequenos",status:"Aprovado",   author: "Dep. Eduardo Braga",  date: "Mar 2023" }, { id: "PL 512/2023", title: "Fundo de manutenção de estradas vicinais",     status: "Aprovado",   author: "Dep. Lira Júnior",    date: "Jul 2023" }, { id: "PL 930/2024", title: "Emenda constitucional de fiscalização",        status: "Rejeitado",  author: "Dep. Samuel Moreira", date: "Abr 2024" }, { id: "PL 1400/2024",title: "Programa de habitação rural",                  status: "Em votação", author: "Dep. Cacá Leão",      date: "Ago 2024" }, { id: "PL 2050/2025",title: "Simplificação do licenciamento ambiental",     status: "Em votação", author: "Dep. Marcus Pestana", date: "Fev 2025" }],
  PDT:   [{ id: "PL 290/2023", title: "Salário mínimo com correção anual garantida",  status: "Em votação", author: "Dep. Sérgio Alves",   date: "Abr 2023" }, { id: "PL 670/2024", title: "Proteção de trabalhadores de plataforma digital",status:"Aprovado",   author: "Dep. Wolmir Amado",   date: "Mar 2024" }, { id: "PL 1050/2024",title: "Expansão da creche pública",                   status: "Em votação", author: "Dep. Reginaldo Lopes", date:"Jul 2024"  }, { id: "PL 1780/2025",title: "Regulação de horas extras e banco de horas",   status: "Em votação", author: "Dep. Merlong Solano", date: "Jan 2025" }, { id: "PL 2300/2025",title: "Auxílio-transporte para trabalhadores rurais",  status: "Em votação", author: "Dep. Yglésio Moyses", date: "Mar 2025" }],
  PSDB:  [{ id: "PL 310/2023", title: "Reforma administrativa do serviço público",    status: "Arquivado",  author: "Dep. Domingos Neto",  date: "Mai 2023" }, { id: "PL 740/2024", title: "Voucher educação para escola privada",          status: "Rejeitado",  author: "Dep. Cássio Cunha",   date: "Fev 2024" }, { id: "PL 1180/2024",title: "Privatização de serviços postais",              status: "Arquivado",  author: "Dep. Silvio Torres",  date: "Jun 2024" }, { id: "PL 1900/2025",title: "Desonerações para setor de tecnologia",         status: "Em votação", author: "Dep. Beto Mansur",    date: "Fev 2025" }, { id: "PL 2480/2025",title: "Reforma do sistema de previdência estadual",    status: "Em votação", author: "Dep. Alfredo Kaefer", date: "Abr 2025" }],
  REPO:  [{ id: "PL 355/2023", title: "Isenção de IR para igrejas e entidades",       status: "Aprovado",   author: "Dep. Marco Feliciano",date: "Jun 2023" }, { id: "PL 780/2024", title: "Programa de moradia para famílias carentes",    status: "Aprovado",   author: "Dep. Sóstenes Cavalcante",date:"Mar 2024"},{ id: "PL 1230/2024",title: "Regulação de escolas confessionais",             status: "Em votação", author: "Dep. Hugo Motta",     date: "Jul 2024" }, { id: "PL 1960/2025",title: "Marco legal do voluntariado",                   status: "Em votação", author: "Dep. Vinicius Carvalho",date:"Jan 2025"}, { id: "PL 2520/2025",title: "Apoio a pequenas entidades religiosas",          status: "Em votação", author: "Dep. Juninho do Pneu", date:"Abr 2025"}],
};

const WORD_CLOUDS: Record<string, { word: string; size: number; weight: number }[]> = {
  PL:    [{ word: "Segurança",      size: 2.4, weight: 900 }, { word: "Armas",         size: 2.0, weight: 700 }, { word: "Família",       size: 1.8, weight: 700 }, { word: "Privatização",  size: 1.5, weight: 500 }, { word: "Liberdade",     size: 1.4, weight: 500 }, { word: "Economia",      size: 1.2, weight: 400 }, { word: "Defesa",        size: 1.1, weight: 400 }, { word: "Propriedade",   size: 1.0, weight: 400 }],
  PT:    [{ word: "Saúde",         size: 2.4, weight: 900 }, { word: "Educação",      size: 2.1, weight: 700 }, { word: "Trabalhadores", size: 1.9, weight: 700 }, { word: "Habitação",     size: 1.5, weight: 500 }, { word: "Assistência",   size: 1.4, weight: 500 }, { word: "Reforma",       size: 1.2, weight: 400 }, { word: "Direitos",      size: 1.1, weight: 400 }, { word: "Previdência",   size: 1.0, weight: 400 }],
  MDB:   [{ word: "Infraestrutura",size: 2.2, weight: 900 }, { word: "Desenvolvimento",size:1.9, weight: 700 }, { word: "Reforma",       size: 1.7, weight: 700 }, { word: "Agronegócio",   size: 1.4, weight: 500 }, { word: "Fiscal",        size: 1.3, weight: 500 }, { word: "Municipal",     size: 1.2, weight: 400 }, { word: "Saúde",         size: 1.1, weight: 400 }, { word: "Educação",      size: 1.0, weight: 400 }],
  UNIAO: [{ word: "Agronegócio",   size: 2.3, weight: 900 }, { word: "Comunicação",   size: 1.9, weight: 700 }, { word: "Infraestrutura",size: 1.7, weight: 700 }, { word: "Segurança",     size: 1.5, weight: 500 }, { word: "Fiscal",        size: 1.3, weight: 500 }, { word: "Regional",      size: 1.2, weight: 400 }, { word: "Família",       size: 1.1, weight: 400 }, { word: "Economia",      size: 1.0, weight: 400 }],
  PP:    [{ word: "Obras",         size: 2.2, weight: 900 }, { word: "Infraestrutura",size: 2.0, weight: 700 }, { word: "Municipal",     size: 1.7, weight: 700 }, { word: "Agronegócio",   size: 1.5, weight: 500 }, { word: "Estradas",      size: 1.3, weight: 500 }, { word: "Emendas",       size: 1.2, weight: 400 }, { word: "Saúde",         size: 1.1, weight: 400 }, { word: "Segurança",     size: 1.0, weight: 400 }],
  PDT:   [{ word: "Trabalhadores", size: 2.2, weight: 900 }, { word: "Educação",      size: 1.9, weight: 700 }, { word: "Sindicatos",    size: 1.7, weight: 700 }, { word: "Renda",         size: 1.5, weight: 500 }, { word: "Saúde",         size: 1.3, weight: 500 }, { word: "Emprego",       size: 1.2, weight: 400 }, { word: "Social",        size: 1.1, weight: 400 }, { word: "Reforma",       size: 1.0, weight: 400 }],
  PSDB:  [{ word: "Modernização",  size: 2.1, weight: 900 }, { word: "Privatização",  size: 1.9, weight: 700 }, { word: "Eficiência",    size: 1.7, weight: 700 }, { word: "Educação",      size: 1.5, weight: 500 }, { word: "Mercado",       size: 1.3, weight: 500 }, { word: "Gestão",        size: 1.2, weight: 400 }, { word: "Social",        size: 1.1, weight: 400 }, { word: "Tecnologia",    size: 1.0, weight: 400 }],
  REPO:  [{ word: "Família",       size: 2.3, weight: 900 }, { word: "Religião",      size: 2.0, weight: 700 }, { word: "Moral",         size: 1.7, weight: 700 }, { word: "Educação",      size: 1.5, weight: 500 }, { word: "Voluntariado",  size: 1.3, weight: 500 }, { word: "Comunidade",    size: 1.2, weight: 400 }, { word: "Segurança",     size: 1.1, weight: 400 }, { word: "Tradição",      size: 1.0, weight: 400 }],
};

const INFLUENCE_RANK = [
  { party: "PL",    score: 94, seats: 99,  color: "#1a3a7c" },
  { party: "UNIÃO", score: 80, seats: 59,  color: "#d4841a" },
  { party: "PT",    score: 76, seats: 68,  color: "#c41230" },
  { party: "PP",    score: 67, seats: 47,  color: "#2e5fa3" },
  { party: "MDB",   score: 60, seats: 42,  color: "#4a7c59" },
];

const STATUS_COLOR: Record<string, string> = {
  "Aprovado":   "#4a7c59",
  "Em votação": "#d4841a",
  "Rejeitado":  "#c41230",
  "Arquivado":  "#555",
};

/* ── Component ─────────────────────────────────── */
export default function PartidosPage() {
  const [selected, setSelected] = useState(PARTIES[0]);
  const [partyQuery, setPartyQuery] = useState("");
  const [showPartyDrop, setShowPartyDrop] = useState(false);

  const filteredParties = PARTIES.filter((p) =>
    p.full.toLowerCase().includes(partyQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(partyQuery.toLowerCase())
  );

  const catData  = CAT_SPEND[selected.id]   ?? CAT_SPEND.PL;
  const words    = WORD_CLOUDS[selected.id]  ?? WORD_CLOUDS.PL;
  const props    = PROPOSALS[selected.id]    ?? PROPOSALS.PL;

  const totalGasto = catData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar />

      <PageHero
        n="3" tag="AGREMIAÇÕES"
        title="Partidos"
        desc="Selecione um partido para ver presença, gastos, proposições, nuvem de palavras e ranking de influência."
        imgId="photo-1699112204356-532841a77e07"
        stripImgs={[
          { id: "photo-1741030766598-d4810a5a7563", alt: "Manifestação com megafone" },
          { id: "photo-1567965142886-f347ae9b829b", alt: "Bandeira política" },
          { id: "photo-1561489396-888724a1543d", alt: "Reunião de líderes" },
        ]}
      />

      {/* Party search */}
      <div className="px-6 md:px-14 py-8 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-4" style={{ fontFamily: MONO }}>
          SELECIONE UM PARTIDO
        </p>
        <div className="relative max-w-xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
            style={{ fontFamily: MONO }}>⌕</span>
          <input
            value={partyQuery}
            onChange={(e) => { setPartyQuery(e.target.value); setShowPartyDrop(true); }}
            onFocus={() => setShowPartyDrop(true)}
            placeholder="Nome ou sigla do partido..."
            className="w-full pl-10 pr-4 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {partyQuery && (
            <button
              onClick={() => { setPartyQuery(""); setShowPartyDrop(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">
              ✕
            </button>
          )}

          {showPartyDrop && (
            <div className="absolute top-full left-0 right-0 border border-border z-20"
              style={{ background: "#141414" }}>
              {(partyQuery ? filteredParties : PARTIES).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p);
                    setPartyQuery(p.full);
                    setShowPartyDrop(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
                  <span className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-sm font-black"
                    style={{ background: p.color, fontFamily: SERIF, color: "#f0ece4" }}>
                    {p.name}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{p.full}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {p.seats} deputados · presença média {p.presenca}%
                    </p>
                  </div>
                  {selected.id === p.id && (
                    <span className="text-xs text-primary flex-shrink-0" style={{ fontFamily: MONO }}>SELECIONADO</span>
                  )}
                </button>
              ))}
              {partyQuery && filteredParties.length === 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  NENHUM PARTIDO ENCONTRADO
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Party identity strip */}
      <div
        className="px-6 md:px-14 py-8 border-b border-border flex items-center gap-5"
        style={{ borderLeft: `4px solid ${selected.color}`, background: "#111" }}
      >
        <div>
          <h2 className="text-3xl font-black text-foreground"
            style={{ fontFamily: SERIF }}>{selected.full}</h2>
          <p className="text-xs text-muted-foreground mt-1"
            style={{ fontFamily: MONO }}>{selected.seats} DEPUTADOS FEDERAIS</p>
        </div>
      </div>

      {/* ── 1. PRESENÇA ── */}
      <section className="px-6 md:px-14 py-14 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>
          PRESENÇA
        </p>
        <h3 className="text-3xl font-black mb-10"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>Esse partido tem presença?</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px border border-border"
          style={{ background: "rgba(240,236,228,0.07)" }}>
          {[
            { label: "PRESENÇA MÉDIA",       val: `${selected.presenca}%`,      note: "nas votações nominais" },
            { label: "AUSÊNCIAS JUSTIFICADAS",val: `${100 - selected.presenca - 4}%`, note: "com justificativa formal" },
            { label: "AUSÊNCIAS SEM JUSTIF.", val: "4%",                         note: "sem registro de motivo" },
          ].map((s) => (
            <div key={s.label} className="bg-background px-8 py-8">
              <p className="text-xs tracking-widest text-muted-foreground mb-2"
                style={{ fontFamily: MONO }}>{s.label}</p>
              <p className="text-4xl font-black text-primary mb-1"
                style={{ fontFamily: SERIF }}>{s.val}</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{s.note}</p>
            </div>
          ))}
        </div>

        {/* presence bar */}
        <div className="mt-8 max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>AUSENTE</span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>PRESENTE</span>
          </div>
          <div className="h-4 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
            <div style={{ width: `${selected.presenca}%`, background: selected.color, height: "100%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: MONO }}>
            {PARTIES.filter(p => p.presenca > selected.presenca).length + 1}º lugar em presença entre os partidos listados
          </p>
        </div>

        {/* comparative bar chart */}
        <div className="h-52 mt-10">
          <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: MONO }}>
            COMPARATIVO DE PRESENÇA — TODOS OS PARTIDOS
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...PARTIES].sort((a, b) => b.presenca - a.presenca)}>
              <XAxis dataKey="name" tick={{ fill: "#888880", fontSize: 11, fontFamily: MONO }}
                axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, "Presença"]} />
              <Bar dataKey="presenca" radius={[2, 2, 0, 0]} maxBarSize={48}>
                {[...PARTIES].sort((a, b) => b.presenca - a.presenca).map((p) => (
                  <Cell key={p.id} fill={p.id === selected.id ? selected.color : "rgba(240,236,228,0.12)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── 2. COMO GASTA ── */}
      <section className="px-6 md:px-14 py-14 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>
          DESPESAS
        </p>
        <h3 className="text-3xl font-black mb-10"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>Como o partido gasta?</h3>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* donut */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} dataKey="value" cx="50%" cy="50%"
                  innerRadius="50%" outerRadius="78%" paddingAngle={2}>
                  {catData.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                  formatter={(v: number) => [fmt(v), ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* breakdown bars */}
          <div className="flex flex-col gap-3 justify-center">
            {catData.map((c) => {
              const pct = Math.round((c.value / totalGasto) * 100);
              return (
                <div key={c.cat}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <span className="text-xs text-foreground">{c.cat}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-foreground"
                        style={{ fontFamily: MONO }}>{pct}%</span>
                      <span className="text-xs text-muted-foreground w-24 text-right"
                        style={{ fontFamily: MONO }}>{fmt(c.value)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                    <div style={{ width: `${pct}%`, background: c.color, height: "100%" }} />
                  </div>
                </div>
              );
            })}
            <div className="mt-2 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>TOTAL GASTO</span>
              <span className="text-lg font-black text-primary" style={{ fontFamily: SERIF }}>{fmt(totalGasto)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. PROPOSIÇÕES ── */}
      <section className="px-6 md:px-14 py-14 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>
          LEGISLAÇÃO
        </p>
        <h3 className="text-3xl font-black mb-10"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>Quais proposições desse partido?</h3>

        <div className="flex flex-col gap-px border border-border"
          style={{ background: "rgba(240,236,228,0.06)" }}>
          {/* header */}
          <div className="grid px-6 py-3 bg-background gap-4"
            style={{ gridTemplateColumns: "120px 1fr 140px 100px" }}>
            {["Nº / DATA", "TÍTULO", "AUTOR", "STATUS"].map((h) => (
              <span key={h} className="text-xs text-muted-foreground"
                style={{ fontFamily: MONO }}>{h}</span>
            ))}
          </div>

          {props.map((p) => (
            <div key={p.id}
              className="grid px-6 py-4 bg-background hover:bg-card transition-colors items-center gap-4"
              style={{ gridTemplateColumns: "120px 1fr 140px 100px" }}>
              <div>
                <p className="text-xs font-bold text-primary" style={{ fontFamily: MONO }}>{p.id}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{p.date}</p>
              </div>
              <p className="text-sm text-foreground leading-snug">{p.title}</p>
              <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: MONO }}>{p.author}</p>
              <span
                className="text-xs px-2 py-1 text-center"
                style={{
                  fontFamily: MONO,
                  color: STATUS_COLOR[p.status],
                  background: `${STATUS_COLOR[p.status]}18`,
                }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. NUVEM DE PALAVRAS ── */}
      <section className="px-6 md:px-14 py-14 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>
          TEMAS
        </p>
        <h3 className="text-3xl font-black mb-4"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>Nuvem de palavras do partido</h3>
        <p className="text-xs text-muted-foreground mb-8" style={{ fontFamily: MONO }}>
          Baseado nas palavras mais frequentes nos títulos das proposições e discursos
        </p>

        <div
          className="flex flex-wrap gap-x-6 gap-y-4 items-center justify-center p-10 border border-border"
          style={{ background: "#111", minHeight: 220 }}>
          {words.map((w) => (
            <span
              key={w.word}
              className="cursor-default select-none transition-opacity hover:opacity-100"
              style={{
                fontFamily: SERIF,
                fontWeight: w.weight,
                fontSize: `${w.size}rem`,
                color: selected.color,
                opacity: 0.3 + w.size * 0.25,
              }}>
              {w.word}
            </span>
          ))}
        </div>
      </section>

      {/* ── 5. RANKING DE INFLUÊNCIA ── */}
      <section className="px-6 md:px-14 py-14">
        <p className="text-xs tracking-[0.35em] text-primary mb-2" style={{ fontFamily: MONO }}>
          PODER
        </p>
        <h3 className="text-3xl font-black mb-10"
          style={{ fontFamily: SERIF, color: "#f0ece4" }}>Ranking de influência — Top 5</h3>

        <div className="flex flex-col gap-5 max-w-2xl">
          {INFLUENCE_RANK.map((r, i) => (
            <div key={r.party}
              className="flex items-center gap-5 px-6 py-5 border transition-colors"
              style={{
                background: "#111",
                borderColor: r.party === selected.name ? r.color : "rgba(240,236,228,0.1)",
              }}>
              <span className="text-4xl font-black flex-shrink-0"
                style={{ fontFamily: SERIF, color: `${r.color}60` }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-foreground"
                      style={{ fontFamily: SERIF }}>{r.party}</span>
                    <span className="text-xs text-muted-foreground"
                      style={{ fontFamily: MONO }}>{r.seats} cadeiras</span>
                  </div>
                  <span className="text-2xl font-black"
                    style={{ fontFamily: SERIF, color: r.color }}>{r.score}</span>
                </div>
                <div className="h-2 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                  <div style={{ width: `${r.score}%`, background: r.color, height: "100%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
