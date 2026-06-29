import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchQuestion } from "../api";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import type { QuestionFilters, QuestionPayload } from "../types";

type ViesPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
  onNavigateRecorte: (path: string) => void;
};

type Row = Record<string, unknown>;
type Section = "vies" | "partidos" | "correlacao" | "votos" | "metodologia";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const RED = "#cc0022";
const IDEOLOGY_COLORS: Record<string, string> = {
  esquerda: "#b80020",
  centro: "#b8860b",
  direita: "#1a3a78",
  "amostra insuficiente": "#4b5563",
  "nao classificado": "#4b5563",
};
const IDEOLOGY_LABELS: Record<string, string> = {
  esquerda: "ESQUERDA",
  centro: "CENTRO",
  direita: "DIREITA",
  "amostra insuficiente": "AMOSTRA INSUFICIENTE",
  "nao classificado": "NAO CLASSIFICADO",
};

const text = (row: Row | null | undefined, key: string) => String(row?.[key] ?? "");
const raw = (row: Row | null | undefined, key: string) => Number(row?.[key] ?? 0);
const fmtNum = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtPct = (value: number) => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

type MetodoItem = {
  id: string;
  titulo: string;
  origem: string;
  formula: string;
  passos: string[];
  interpretacao: string;
};

const METODOS_Q9: MetodoItem[] = [
  {
    id: "q91",
    titulo: "Classificacao dupla dos partidos: declarada + comportamental",
    origem: "Q9.1 — Metodologia Dual · partidos_ideologia (declarada) + score medio Q9.4 (comportamental) · 57a Legislatura (2023-2026)",
    formula: "ideologia_declarada = lookup partidos_ideologia · ideologia_comportamental = avg(score_vies por partido) → <= 40 esquerda | 40-60 centro | >= 60 direita · dissidente = declarada != comportamental",
    passos: [
      "DIMENSAO 1 — IDEOLOGIA DECLARADA: A tabela partidos_ideologia e o catalogo historico/programatico do projeto. Cada partido recebe uma classificacao baseada no posicionamento declarado, documentos programaticos e tendencia geral. Esta e a classificacao usada como base em Q9.2, Q9.3 e Q9.4 para identificar os blocos ideologicos nas votacoes.",
      "DIMENSAO 2 — IDEOLOGIA COMPORTAMENTAL: Calculada a partir do score_vies medio por partido em Q9.4. Para cada partido, somamos os scores individuais dos deputados que tiveram >= 10 votos em votacoes polarizadas (metodo='comportamento') e calculamos a media. Score medio <= 40 = esquerda, entre 40 e 60 = centro, >= 60 = direita. Partidos sem deputados com votos suficientes recebem 'sem dados'.",
      "DISSIDENTE — REALINHAMENTO DE BANCADA: Um partido e marcado como dissidente quando ideologia_declarada != ideologia_comportamental. Isso nao significa erro de classificacao — significa que o partido esta operando em coalizao diferente do seu espectro historico. Na 57a Legislatura, PP e REPUBLICANOS (declarados direita) compuseram a base do governo Lula e votaram como centro. PSD, AVANTE e SOLIDARIEDADE (declarados centro) votaram sistematicamente com a esquerda pela mesma razao.",
      "POR QUE MANTER A DECLARADA COMO BASE: A ideologia declarada e estavel entre legislaturas e reflete a identidade do partido. Se usassemos apenas o comportamento observado, PP viraria 'centro' nesta legislatura e 'direita' na proxima — perdendo a informacao de que e estruturalmente um partido de direita que esta em alianca temporaria. As duas dimensoes juntas contam a historia completa.",
    ],
    interpretacao: "Dissidentes revelam o mapa real do poder em Brasilia — nao o que os partidos dizem ser, mas onde eles de fato votam. PP e REPUBLICANOS se declaram direita mas integram o governo de esquerda, o que desloca seus scores para o centro. PSD com score medio 39.2 vota mais com a esquerda do que com o centro ao qual se declara. Essa tensao entre identidade declarada e comportamento observado e o dado mais relevante de Q9.1 — ela revela quais partidos sao ideologicamente consistentes e quais operam por calculo de coalizao.",
  },
  {
    id: "q92",
    titulo: "Correlacao partido e proposta — percentual de votos Sim por votacao",
    origem: "Q9.2 — Correlacao Ideologia x Proposicao · tabelas votacoes_votos + partidos_ideologia + votacoes_objetos",
    formula: "pct_sim = COUNT(*) FILTER (voto = 'Sim') / COUNT(*) FILTER (voto IN ('Sim','Nao')) × 100 · agrupado por (ano_dados, id_votacao, ideologia)",
    passos: [
      "FONTE DOS DADOS: A tabela votacoes_votos contem um registro por voto individual de cada deputado em cada votacao nominal registrada na 57a Legislatura. Cada linha tem o voto (Sim, Nao, Abstencao, Obstrucao, etc.) e a sigla do partido do deputado naquele momento.",
      "AGREGACAO POR BLOCO IDEOLOGICO: Para cada votacao, agrupamos os votos pela ideologia do partido (via join com partidos_ideologia). Calculamos o percentual de votos Sim dentro de cada bloco — esquerda, centro e direita — ignorando Abstencao e Obstrucao para focar no comportamento decisorio real.",
      "TITULO DA PROPOSICAO: Usamos a tabela votacoes_objetos para associar um titulo legivel a cada votacao. Como uma votacao pode ter multiplos objetos vinculados, usamos DISTINCT ON para pegar apenas o primeiro registro de cada (ano, id_votacao), garantindo uma linha por votacao.",
      "ORIENTACAO OFICIAL DA BANCADA: Em Q9.2b, cruzamos tambem com votacoes_orientacoes para ver se o percentual de Sim da bancada coincide com a orientacao oficial emitida pelo partido naquela sessao. Isso permite identificar se a bancada seguiu a orientacao ou se votou diferente do que o lider determinou.",
      "GRANULARIDADE: O resultado tem uma linha por (votacao, ideologia). Para ver o comportamento de um partido especifico em vez de um bloco ideologico, usamos Q9.2b que tem granularidade por (votacao, sigla_partido).",
    ],
    interpretacao: "Um percentual de Sim alto para a esquerda e baixo para a direita (ou vice-versa) em uma mesma votacao indica que aquela proposta e ideologicamente dividente. Votacoes onde todos os blocos tem pct_sim similares indicam consenso ou pauta tecnica. A orientacao oficial da bancada versus o pct_sim real revela o nivel de disciplina interna — quando a bancada vota contra a orientacao, isso indica dissidencia organizada ou uma pauta que divide internamente o partido.",
  },
  {
    id: "q93",
    titulo: "Voto individual do deputado por proposta",
    origem: "Q9.3 — Voto Individual · tabelas votacoes_votos + partidos_ideologia + votacoes_orientacoes + votacoes_objetos",
    formula: "aderiu_orientacao = CASE WHEN voto = orientacao_bancada THEN 'Seguiu' WHEN orientacao IN ('Liberado','Abstencao','Obstrucao') THEN 'Liberado/Abstencao' ELSE 'Contrariou' END",
    passos: [
      "GRANULARIDADE MAXIMA: Esta consulta retorna uma linha por (deputado, votacao), com o voto real registrado. E o nivel mais detalhado da analise — permite auditar cada voto individual de cada parlamentar em cada proposicao.",
      "ORIENTACAO DA BANCADA: Para cada voto, buscamos a orientacao oficial que o partido emitiu naquela votacao (tabela votacoes_orientacoes). Quando a orientacao e 'Liberado', 'Abstencao' ou 'Obstrucao', o campo aderiu_orientacao recebe 'Liberado/Abstencao' — o deputado nao tinha diretriz para seguir ou contrariar.",
      "CALCULO DE ADERENCIA: Para cada deputado, somamos os casos em que ele 'Seguiu' a orientacao e dividimos pelo total de votacoes com orientacao explicita (Sim ou Nao). Isso gera o pct_aderencia_partido — o percentual de disciplina partidaria individual.",
      "FILTRO DA SECAO 9.3 NA INTERFACE: Para evitar carregar mais de 80.000 linhas no payload inicial, a secao de voto por proposta so carrega o detalhe quando um id_votacao especifico e selecionado. Isso mantém o desempenho da pagina enquanto permite a auditoria completa quando necessario.",
    ],
    interpretacao: "Um deputado com pct_aderencia alto (acima de 90%) e considerado muito disciplinado — vota quase sempre com o partido quando ha orientacao. Abaixo de 70%, ha um padrao claro de dissonancia. Esses casos podem indicar deputados que nao concordam com a linha do partido, que estao negociando individualmente ou que ja estao em processo de migracao partidaria. Compare o pct_aderencia com o indice de custo-beneficio (Q7) para ver se a dissonancia esta associada a maior ou menor atividade legislativa.",
  },
  {
    id: "q94",
    titulo: "Score de vies ideologico por votos divisivos",
    origem: "Q9.4 — Score Ideologico Individual · tabelas votacoes_votos + partidos_ideologia · Metodo C + Fallback A",
    formula: "score_vies = votos_com_direita / votos_em_polarizadas × 100 · onde polarizada = |pct_sim_esquerda - pct_sim_direita| ≥ 30pp · faixa: 0 = esquerda pura, 100 = direita pura",
    passos: [
      "PASSO 1 — IDENTIFICAR VOTACOES POLARIZADAS: Para cada votacao, calculamos o pct_sim da esquerda e o pct_sim da direita separadamente. Uma votacao e classificada como 'polarizada' quando a diferenca absoluta entre esses dois valores e maior ou igual a 30 pontos percentuais. Exemplo: esquerda com 78% Sim e direita com 31% Sim → divergencia de 47pp → polarizada. Votacoes com consenso ou com diferenca menor sao descartadas — elas nao distinguem bem os campos ideologicos.",
      "PASSO 2 — CLASSIFICAR CADA VOTO NAS POLARIZADAS: Para cada voto de um deputado em uma votacao polarizada, determinamos com qual campo ele se alinhou. Se a esquerda favorece a proposta (pct_esq > pct_dir) e o deputado votou Sim → 'votou com esquerda'. Se votou Nao → 'votou com direita'. O raciocinio e invertido quando a direita favorece a proposta. Votos Abstencao, Obstrucao e ausencias nao entram no calculo — apenas Sim e Nao.",
      "PASSO 3 — CALCULAR O SCORE INDIVIDUAL: Para cada deputado, contamos quantas vezes ele votou com a esquerda e quantas com a direita nas votacoes polarizadas. O score e: (votos_com_direita / total_votos_em_polarizadas) × 100. Score 0 significa que o deputado sempre votou com a esquerda nas divisivas. Score 100 significa que sempre votou com a direita. Score 50 indica comportamento de centro — alinhou igualmente com os dois campos.",
      "PASSO 4 — CLASSIFICAR O VIES FINAL: A partir do score, definimos a classificacao: score < 40 → esquerda, score entre 40 e 60 → centro, score > 60 → direita. Esses limiares foram escolhidos para dar uma faixa de centro razoavel — 20pp de margem em cada direcao — sem exigir que o deputado seja 'puro' para ser classificado.",
      "PASSO 5 — FALLBACK POR PARTIDO: Deputados que participaram de menos de 10 votacoes polarizadas tem amostra insuficiente para o calculo confiavel do score. Para eles, o campo vies_final herda a ideologia do partido (partidos_ideologia). O campo 'metodo' indica se o resultado veio de 'comportamento' (score calculado) ou 'partido' (fallback), permitindo identificar cada caso na tabela.",
      "ARQUIVO SQL: A consulta completa esta em questoes/q9_v2/consultas/q9_vies_final.sql. Para regenerar os dados execute o arquivo no banco com psql -f q9_vies_final.sql ou com \\i q9_vies_final.sql dentro do shell interativo do psql. A saida vai para questoes/q9_v2/respostas/q9_vies_final.txt.",
    ],
    interpretacao: "O score mede comportamento observado no plenario, nao ideologia declarada nem filiacao partidaria. Um deputado de partido de esquerda com score 75 votou sistematicamente com a direita nas proposicoes mais divisivas da legislatura — independente do que ele declara publicamente. O score e mais confiavel quando o deputado tem muitas votacoes em polarizadas (campo votos_em_polarizadas). Com menos de 20 votacoes, o score pode ser influenciado por algumas abstencoes ou ausencias pontuais. Deputados com metodo='partido' nao tiveram votos suficientes para analise propria — seu vies_final e uma estimativa baseada no partido, nao no comportamento individual.",
  },
];

function rowsOf(payload: QuestionPayload | null): Row[] {
  return (payload?.table_spec.rows ?? []) as Row[];
}

function SectionHeader({ n, tag, title, desc }: { n: string; tag: string; title: string; desc: string }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-baseline gap-4">
        <span className="text-5xl font-black" style={{ fontFamily: SERIF, color: RED }}>{n}</span>
        <span className="text-sm font-black uppercase tracking-[0.28em]" style={{ fontFamily: MONO, color: RED }}>{tag}</span>
      </div>
      <h2 className="mb-3 text-3xl font-black leading-tight md:text-4xl" style={{ fontFamily: SERIF, color: "var(--foreground)" }}>{title}</h2>
      <p className="max-w-3xl text-base font-semibold leading-relaxed" style={{ color: "var(--foreground)" }}>{desc}</p>
    </div>
  );
}

function StatCard({ label, value, sub, color = RED }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="border border-border bg-background px-6 py-6">
      <p className="mb-2 text-xs font-black uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{label}</p>
      <p className="text-4xl font-black" style={{ fontFamily: SERIF, color }}>{value}</p>
      {sub ? <p className="mt-1 text-sm font-medium" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{sub}</p> : null}
    </div>
  );
}

function Badge({ value }: { value: string }) {
  const key = value || "nao classificado";
  const color = IDEOLOGY_COLORS[key] ?? "#4b5563";
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-black uppercase text-white" style={{ background: color, fontFamily: MONO }}>
      {IDEOLOGY_LABELS[key] ?? key}
    </span>
  );
}

function EmptyPanel({ text: message }: { text: string }) {
  return (
    <div className="border border-border px-6 py-12 text-center" style={{ background: "var(--card)" }}>
      <p className="text-sm font-semibold" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{message}</p>
    </div>
  );
}

function SimpleTable({ rows, columns, empty, limit = 80 }: { rows: Row[]; columns: string[]; empty: string; limit?: number }) {
  if (!rows.length) return <EmptyPanel text={empty} />;
  return (
    <div className="overflow-x-auto border border-border" style={{ background: "var(--card)" }}>
      <table className="min-w-full text-left text-sm">
        <thead style={{ background: "var(--card)" }}>
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-wider" style={{ fontFamily: MONO, color: "var(--foreground)", borderBottom: "2px solid var(--border)" }}>
                {column.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, limit).map((row, index) => (
            <tr key={index} className="border-t border-border">
              {columns.map((column) => (
                <td key={column} className="max-w-[520px] whitespace-nowrap px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {column.includes("ideologia") || column === "vies_estimado" ? <Badge value={text(row, column)} /> : String(row[column] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export default function ViesPage({ onNavigateHome, onNavigateRecortes, onNavigateRecorte }: ViesPageProps) {
  const [activeSection, setActiveSection] = useState<Section>("vies");
  const [partidos, setPartidos] = useState<QuestionPayload | null>(null);
  const [viesFinal, setViesFinal] = useState<QuestionPayload | null>(null);
  const [correlacao, setCorrelacao] = useState<QuestionPayload | null>(null);
  const [votacoes, setVotacoes] = useState<QuestionPayload | null>(null);
  const [votos, setVotos] = useState<QuestionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partyFilter, setPartyFilter] = useState("");
  const [proposalSearch, setProposalSearch] = useState("");
  const [selectedVotacao, setSelectedVotacao] = useState<Row | null>(null);
  const [voteSearch, setVoteSearch] = useState("");
  const [voteFilter, setVoteFilter] = useState("todos");
  const [votosLoading, setVotosLoading] = useState(false);

  // filtros seção 9.2
  const [corrYearFilter, setCorrYearFilter] = useState("2026");
  const [corrPartyFilter, setCorrPartyFilter] = useState("");
  const [corrIdeologyFilter, setCorrIdeologyFilter] = useState("");
  const [corrLoading, setCorrLoading] = useState(false);

  // carga inicial — sem correlacao (lazy)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetchQuestion("q9_1_classificar_partidos", {}, { page: 1, pageSize: 200 }),
      fetchQuestion("q9_vies_final", {}, { page: 1, pageSize: 2000 }),
      fetchQuestion("q9_v2_votacoes", {}, { page: 1, pageSize: 200 }),
    ])
      .then(([p, vf, v]) => {
        if (!mounted) return;
        setPartidos(p);
        setViesFinal(vf);
        setVotacoes(v);
      })
      .catch(() => {
        if (mounted) setError("Nao foi possivel carregar os dados da Q9 v2.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // lazy load correlacao — só quando seção ativa, re-fetcha ao mudar filtros
  useEffect(() => {
    if (activeSection !== "correlacao") return;
    let mounted = true;
    setCorrLoading(true);
    const filters: QuestionFilters = {};
    if (corrYearFilter) filters.anos = [corrYearFilter];
    if (corrPartyFilter) filters.partidos = [corrPartyFilter];
    fetchQuestion("q9_v2_correlacao", filters, { page: 1, pageSize: 5000 })
      .then((payload) => { if (mounted) setCorrelacao(payload); })
      .catch(() => { if (mounted) setCorrelacao(null); })
      .finally(() => { if (mounted) setCorrLoading(false); });
    return () => { mounted = false; };
  }, [activeSection, corrYearFilter, corrPartyFilter]);

  useEffect(() => {
    if (!selectedVotacao) {
      setVotos(null);
      return;
    }
    let mounted = true;
    setVotosLoading(true);
    fetchQuestion("q9_v2_votos", { search: text(selectedVotacao, "id_votacao") }, { page: 1, pageSize: 200 })
      .then((payload) => { if (mounted) setVotos(payload); })
      .catch(() => { if (mounted) setVotos(null); })
      .finally(() => { if (mounted) setVotosLoading(false); });
    return () => { mounted = false; };
  }, [selectedVotacao]);

  const partidoRows = rowsOf(partidos);
  const viesFinalRows = rowsOf(viesFinal);
  const correlacaoRows = rowsOf(correlacao);
  const votacaoRows = rowsOf(votacoes);
  const votoRows = rowsOf(votos);

  const ideologySummary = useMemo(() => {
    const map = new Map<string, { ideologia: string; partidos: number; votos: number }>();
    for (const row of partidoRows) {
      const ideologia = text(row, "ideologia_declarada") || "nao classificado";
      const item = map.get(ideologia) ?? { ideologia, partidos: 0, votos: 0 };
      item.partidos += 1;
      item.votos += raw(row, "votos_registrados");
      map.set(ideologia, item);
    }
    return Array.from(map.values()).sort((a, b) => b.votos - a.votos);
  }, [partidoRows]);

  const dissidenteCount = useMemo(
    () => partidoRows.filter((r) => text(r, "dissidente") === "SIM").length,
    [partidoRows],
  );

  // ano e partido já filtrados no backend; ideologia e busca texto são cliente
  const filteredCorrelacao = useMemo(() => {
    const query = proposalSearch.trim().toLowerCase();
    return correlacaoRows.filter((row) => {
      if (corrIdeologyFilter && text(row, "ideologia") !== corrIdeologyFilter) return false;
      if (!query) return true;
      return text(row, "proposicao").toLowerCase().includes(query) || text(row, "id_votacao").toLowerCase().includes(query);
    });
  }, [correlacaoRows, proposalSearch, corrIdeologyFilter]);

  const proposalMatches = useMemo(() => {
    const query = proposalSearch.trim().toLowerCase();
    if (!query) return votacaoRows.slice(0, 20);
    return votacaoRows
      .filter((row) => text(row, "proposicao").toLowerCase().includes(query) || text(row, "id_votacao").toLowerCase().includes(query))
      .slice(0, 30);
  }, [votacaoRows, proposalSearch]);

  const filteredVotes = useMemo(() => {
    const query = voteSearch.trim().toLowerCase();
    return votoRows.filter((row) => {
      if (voteFilter !== "todos" && text(row, "voto") !== voteFilter) return false;
      if (!query) return true;
      return text(row, "nome").toLowerCase().includes(query) || text(row, "partido").toLowerCase().includes(query);
    });
  }, [votoRows, voteSearch, voteFilter]);

  const parties = useMemo(() => [...new Set(correlacaoRows.map((row) => text(row, "partido")).filter(Boolean))].sort(), [correlacaoRows]);
  const corrYears = ["2023", "2024", "2025", "2026"];
  const corrParties = useMemo(() => [...new Set(correlacaoRows.map((r) => text(r, "partido")).filter(Boolean))].sort(), [correlacaoRows]);

  const [scoreSearch, setScoreSearch] = useState("");
  const [scorePartyFilter, setScorePartyFilter] = useState("");
  const [scoreIdeologyFilter, setScoreIdeologyFilter] = useState("");
  const [scoreUFFilter, setScoreUFFilter] = useState("");
  const [metodoOpen, setMetodoOpen] = useState<Record<string, boolean>>({});
  const toggleMetodo = (id: string) => setMetodoOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredScoreRows = useMemo(() => {
    const q = scoreSearch.trim().toLowerCase();
    return viesFinalRows
      .filter((row) => {
        if (scorePartyFilter && text(row, "partido") !== scorePartyFilter) return false;
        if (scoreIdeologyFilter && text(row, "vies_final") !== scoreIdeologyFilter) return false;
        if (scoreUFFilter && text(row, "sigla_uf") !== scoreUFFilter) return false;
        if (q) return text(row, "nome").toLowerCase().includes(q) || text(row, "partido").toLowerCase().includes(q);
        return true;
      })
      .sort((a, b) => raw(a, "score_vies") - raw(b, "score_vies"));
  }, [viesFinalRows, scoreSearch, scorePartyFilter, scoreIdeologyFilter, scoreUFFilter]);

  const scoreParties = useMemo(
    () => [...new Set(viesFinalRows.map((r) => text(r, "partido")).filter(Boolean))].sort(),
    [viesFinalRows],
  );

  const scoreUFs = useMemo(
    () => [...new Set(viesFinalRows.map((r) => text(r, "sigla_uf")).filter(Boolean))].sort(),
    [viesFinalRows],
  );

  const navItems: Array<[Section, string]> = [
    ["vies", "Viés do deputado"],
    ["partidos", "Classificar partidos"],
    ["correlacao", "Partido x proposta"],
    ["votos", "Voto na proposta"],
    ["metodologia", "Metodologia"],
  ];

  return (
    <>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateRecorte={onNavigateRecorte} />
      <div className="min-h-screen bg-background">
        <PageHero
          n="07"
          tag="IDEOLOGIA E VOTO"
          title="Viés observado"
          titleRed="no plenário"
          desc="Nova Q9 v2: partidos classificados por ideologia, voto real por proposta e tendência observada do deputado sem alterar a Q9 original."
          imgId="photo-1529107386315-e1a2ed48a620"
          hideStrip
        />

        <div className="sticky top-[56px] z-30 flex flex-wrap gap-3 border-b px-6 py-3 md:px-14" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
          {navItems.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className="h-9 border px-4 text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{ fontFamily: MONO, background: activeSection === id ? RED : "transparent", color: activeSection === id ? "#fff" : "var(--foreground)", borderColor: activeSection === id ? RED : "var(--border)" }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <section className="px-6 py-16 md:px-14"><EmptyPanel text="Carregando Q9 v2..." /></section>
        ) : error ? (
          <section className="px-6 py-16 md:px-14"><EmptyPanel text={error} /></section>
        ) : null}

        {!loading && !error && activeSection === "vies" && (
          <section className="border-b border-border px-6 py-16 md:px-14">
            <SectionHeader
              n="9.4"
              tag="QUAL VIES DO DEPUTADO?"
              title="Score por votos divisivos"
              desc="Cada deputado recebe um score de 0 (puro esquerda) a 100 (puro direita) calculado a partir do seu voto real nas proposições em que esquerda e direita divergiram em ≥ 30pp. Deputados com menos de 10 votos nessas sessões herdam a ideologia do partido como fallback."
            />

            {viesFinalRows.length > 0 ? (
              <>
                {/* ── stat cards ── */}
                <div className="mb-8 grid gap-4 md:grid-cols-4">
                  <StatCard label="Deputados classificados" value={fmtNum(viesFinalRows.length)} sub="por votos divisivos" />
                  <StatCard label="Esquerda (score ≤ 40)" value={fmtNum(viesFinalRows.filter((r) => raw(r, "score_vies") <= 40).length)} color={IDEOLOGY_COLORS.esquerda} />
                  <StatCard label="Centro (41–59)" value={fmtNum(viesFinalRows.filter((r) => { const s = raw(r, "score_vies"); return s > 40 && s < 60; }).length)} color={IDEOLOGY_COLORS.centro} />
                  <StatCard label="Direita (score ≥ 60)" value={fmtNum(viesFinalRows.filter((r) => raw(r, "score_vies") >= 60).length)} color={IDEOLOGY_COLORS.direita} />
                </div>

                {/* ── filtros ── */}
                <div className="mb-6 flex flex-wrap gap-3">
                  <input
                    value={scoreSearch}
                    onChange={(e) => setScoreSearch(e.target.value)}
                    placeholder="Buscar deputado ou partido…"
                    className="h-11 min-w-[300px] border border-border bg-background px-4 text-base outline-none"
                    style={{ fontFamily: MONO }}
                  />
                  <select value={scorePartyFilter} onChange={(e) => setScorePartyFilter(e.target.value)} className="h-11 border border-border bg-background px-3 text-sm outline-none" style={{ fontFamily: MONO }}>
                    <option value="">Todos os partidos</option>
                    {scoreParties.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={scoreIdeologyFilter} onChange={(e) => setScoreIdeologyFilter(e.target.value)} className="h-11 border border-border bg-background px-3 text-sm outline-none" style={{ fontFamily: MONO }}>
                    <option value="">Todos os campos</option>
                    <option value="esquerda">Esquerda</option>
                    <option value="centro">Centro</option>
                    <option value="direita">Direita</option>
                  </select>
                  <select value={scoreUFFilter} onChange={(e) => setScoreUFFilter(e.target.value)} className="h-11 border border-border bg-background px-3 text-sm outline-none" style={{ fontFamily: MONO }}>
                    <option value="">Todos os estados</option>
                    {scoreUFs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>

                {/* ── cards de deputados ── */}
                <div className="space-y-3">
                  {filteredScoreRows.slice(0, 150).map((row, i) => {
                    const score = raw(row, "score_vies");
                    const vies = text(row, "vies_final") || text(row, "ideologia_partido");
                    const color = IDEOLOGY_COLORS[vies] ?? "#888";
                    const metodo = text(row, "metodo");
                    const depId = text(row, "id_deputado");
                    const comEsq = raw(row, "votos_com_esquerda");
                    const comDir = raw(row, "votos_com_direita");
                    const totalDiv = raw(row, "votos_em_polarizadas");
                    const photoUrl = `https://www.camara.leg.br/internet/deputado/bandep/${depId}.jpg`;
                    const initials = text(row, "nome").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

                    return (
                      <div
                        key={i}
                        className="border border-border p-4"
                        style={{ background: "var(--card)" }}
                      >
                        {/* ── linha 1: foto + nome + badges ── */}
                        <div className="flex items-start gap-4">
                          {/* foto */}
                          <div className="relative shrink-0">
                            <img
                              src={photoUrl}
                              alt={text(row, "nome")}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex"; }}
                              className="h-14 w-14 rounded-full object-cover border-2"
                              style={{ borderColor: color }}
                            />
                            <div
                              className="h-14 w-14 rounded-full items-center justify-center text-lg font-black text-white hidden"
                              style={{ background: color }}
                            >
                              {initials}
                            </div>
                          </div>

                          {/* nome + partido + score */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-lg font-black text-foreground leading-tight" style={{ fontFamily: SERIF }}>
                                {text(row, "nome")}
                              </span>
                              <span className="text-sm font-black uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                                {text(row, "partido")}
                              </span>
                              {text(row, "sigla_uf") && (
                                <span className="px-1.5 py-0.5 text-xs font-bold uppercase" style={{ fontFamily: MONO, background: "var(--border)", color: "var(--foreground)" }}>
                                  {text(row, "sigla_uf")}
                                </span>
                              )}
                            </div>

                            {/* barra de score */}
                            <div className="mt-3 flex items-center gap-3">
                              <span className="w-10 shrink-0 text-xs font-black" style={{ fontFamily: MONO, color }}>
                                {score.toFixed(1)}
                              </span>
                              <div className="relative flex-1 h-4 rounded-full" style={{ background: "var(--border)" }}>
                                <div
                                  className="absolute inset-y-0 left-0 rounded-full"
                                  style={{
                                    width: `${Math.min(score, 100)}%`,
                                    background: `linear-gradient(to right, ${IDEOLOGY_COLORS.esquerda}, ${IDEOLOGY_COLORS.centro}, ${IDEOLOGY_COLORS.direita})`,
                                  }}
                                />
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow"
                                  style={{ left: `calc(${Math.min(score, 100)}% - 7px)`, background: color }}
                                />
                              </div>
                              <span className="w-16 shrink-0 text-right text-xs font-bold" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                                ← E · D →
                              </span>
                            </div>
                          </div>

                          {/* badges */}
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span
                              className="px-3 py-1 text-sm font-black uppercase tracking-widest text-white"
                              style={{ background: color, fontFamily: MONO }}
                            >
                              {IDEOLOGY_LABELS[vies] ?? vies.toUpperCase()}
                            </span>
                            <span
                              className="px-3 py-1 text-xs font-bold uppercase tracking-wider"
                              style={{
                                fontFamily: MONO,
                                background: metodo === "comportamento" ? "var(--foreground)" : IDEOLOGY_COLORS.centro,
                                color: metodo === "comportamento" ? "var(--background)" : "white",
                              }}
                            >
                              {metodo}
                            </span>
                          </div>
                        </div>

                        {/* ── linha 2: stats ── */}
                        <div className="mt-3 flex flex-wrap gap-6 border-t border-border pt-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>Com Esquerda</span>
                            <span className="text-xl font-black" style={{ fontFamily: MONO, color: IDEOLOGY_COLORS.esquerda }}>{fmtNum(comEsq)}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>Com Direita</span>
                            <span className="text-xl font-black" style={{ fontFamily: MONO, color: IDEOLOGY_COLORS.direita }}>{fmtNum(comDir)}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>Votos Divisivos</span>
                            <span className="text-xl font-black" style={{ fontFamily: MONO, color: "var(--foreground)" }}>{fmtNum(totalDiv)}</span>
                          </div>
                          <div className="ml-auto flex flex-col gap-0.5 text-right">
                            <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)" }}>Score</span>
                            <span className="text-2xl font-black" style={{ fontFamily: MONO, color }}>{score.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredScoreRows.length > 150 && (
                  <p className="mt-4 text-sm font-semibold" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                    Mostrando 150 de {fmtNum(filteredScoreRows.length)} deputados. Use os filtros acima para refinar.
                  </p>
                )}
              </>
            ) : (
              <EmptyPanel text="Dados ainda não disponíveis. Execute questoes/q9_v2/scripts/gerar_q9_v2.py para gerar os dados." />
            )}
          </section>
        )}

        {!loading && !error && activeSection === "partidos" && (
          <section className="border-b border-border px-6 py-16 md:px-14">
            <SectionHeader
              n="9.1"
              tag="CLASSIFICAR OS PARTIDOS"
              title="Ideologia declarada vs. comportamental"
              desc="Cada partido recebe duas classificações: a declarada (catálogo histórico/programático) e a comportamental (score médio dos deputados nas votações divisivas do Q9.4). Partidos onde as duas divergem são marcados como dissidentes — revelando realinhamentos reais de bancada na 57ª Legislatura."
            />

            {/* ── stat cards ── */}
            <div className="mb-8 grid gap-4 md:grid-cols-4">
              {ideologySummary.map((item) => (
                <StatCard
                  key={item.ideologia}
                  label={IDEOLOGY_LABELS[item.ideologia] ?? item.ideologia}
                  value={fmtNum(item.partidos)}
                  sub={`${fmtNum(item.votos)} votos registrados`}
                  color={IDEOLOGY_COLORS[item.ideologia]}
                />
              ))}
              <StatCard label="Dissidentes" value={fmtNum(dissidenteCount)} sub="declarado ≠ comportamento" color={RED} />
            </div>

            {/* ── pie chart ── */}
            <div className="mb-8 border border-border p-6" style={{ background: "var(--card)" }}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ideologySummary} dataKey="partidos" nameKey="ideologia" innerRadius={70} outerRadius={105} paddingAngle={3}>
                    {ideologySummary.map((item) => <Cell key={item.ideologia} fill={IDEOLOGY_COLORS[item.ideologia] ?? "#555"} />)}
                  </Pie>
                  <Tooltip formatter={(value, _name, props) => [`${value} partidos`, IDEOLOGY_LABELS[String(props.payload.ideologia)] ?? props.payload.ideologia]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ── tabela dupla com destaque dissidentes ── */}
            <div className="overflow-x-auto border border-border" style={{ background: "var(--card)" }}>
              <table className="min-w-full text-left text-sm">
                <thead style={{ background: "var(--card)" }}>
                  <tr>
                    {["partido", "declarada", "comportamental", "score médio", "dissidente", "deputados", "votos"].map((col) => (
                      <th key={col} className="whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-wider" style={{ fontFamily: MONO, color: "var(--foreground)", borderBottom: "2px solid var(--border)" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partidoRows.map((row, i) => {
                    const isDissidente = text(row, "dissidente") === "SIM";
                    const decl = text(row, "ideologia_declarada");
                    const comp = text(row, "ideologia_comportamental");
                    return (
                      <tr
                        key={i}
                        className="border-t border-border"
                        style={{ background: isDissidente ? "rgba(204,0,34,0.06)" : undefined }}
                      >
                        <td className="px-4 py-3 font-black" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                          {text(row, "sigla_partido")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge value={decl} />
                        </td>
                        <td className="px-4 py-3">
                          {comp === "sem dados"
                            ? <span className="text-xs font-medium" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.5 }}>sem dados</span>
                            : <Badge value={comp} />
                          }
                        </td>
                        <td className="px-4 py-3 text-sm font-black" style={{ fontFamily: MONO, color: isDissidente ? RED : "var(--foreground)" }}>
                          {text(row, "score_medio")}
                        </td>
                        <td className="px-4 py-3">
                          {isDissidente
                            ? <span className="inline-flex items-center px-2 py-0.5 text-xs font-black uppercase text-white" style={{ background: RED, fontFamily: MONO }}>DISSIDENTE</span>
                            : <span className="text-xs font-medium" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.4 }}>—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {fmtNum(raw(row, "deputados_com_voto"))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {fmtNum(raw(row, "votos_registrados"))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── nota metodológica ── */}
            <div className="mt-6 border-l-2 py-3 pl-4" style={{ borderColor: RED }}>
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ fontFamily: MONO, color: RED }}>Nota sobre dissidentes</p>
              <p className="text-sm font-medium leading-relaxed" style={{ fontFamily: MONO, color: "var(--foreground)" }}>
                PP e REPUBLICANOS são declarados <strong>direita</strong> mas votam como <strong>centro</strong> (scores 49.7 e 46.6) por integrarem a base do governo Lula na 57ª Legislatura.
                PSD, AVANTE e SOLIDARIEDADE são declarados <strong>centro</strong> mas votam como <strong>esquerda</strong> pelo mesmo motivo de coalização.
                A classificação declarada representa a identidade histórica do partido; a comportamental, o alinhamento real nesta legislatura.
              </p>
            </div>
          </section>
        )}

        {!loading && !error && activeSection === "correlacao" && (
          <section className="border-b border-border px-6 py-16 md:px-14">
            <SectionHeader
              n="9.2"
              tag="CORRELACIONAR PARTIDO X PROPOSTA"
              title="Como cada partido votou?"
              desc="Cada linha resume uma votação por partido, com percentuais de apoio e contagem de votos. Use os filtros de ano, partido e campo ideológico para navegar pelos 4 anos de legislatura."
            />

            {/* ── filtros ── */}
            <div className="mb-3 flex flex-wrap gap-3">
              <input
                value={proposalSearch}
                onChange={(e) => setProposalSearch(e.target.value)}
                placeholder="Buscar proposta ou id da votação…"
                className="h-10 min-w-[280px] border border-border bg-background px-3 text-sm outline-none"
                style={{ fontFamily: MONO }}
              />
              <select value={corrYearFilter} onChange={(e) => setCorrYearFilter(e.target.value)} className="h-10 border border-border bg-background px-3 text-sm outline-none" style={{ fontFamily: MONO }}>
                <option value="">Todos os anos</option>
                {corrYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={corrPartyFilter} onChange={(e) => setCorrPartyFilter(e.target.value)} className="h-10 border border-border bg-background px-3 text-sm outline-none" style={{ fontFamily: MONO }}>
                <option value="">Todos os partidos</option>
                {corrParties.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={corrIdeologyFilter} onChange={(e) => setCorrIdeologyFilter(e.target.value)} className="h-10 border border-border bg-background px-3 text-sm outline-none" style={{ fontFamily: MONO }}>
                <option value="">Todos os campos</option>
                <option value="esquerda">Esquerda</option>
                <option value="centro">Centro</option>
                <option value="direita">Direita</option>
              </select>
              {(corrPartyFilter || corrIdeologyFilter || proposalSearch) && (
                <button
                  type="button"
                  onClick={() => { setCorrPartyFilter(""); setCorrIdeologyFilter(""); setProposalSearch(""); }}
                  className="h-10 border border-border px-3 text-sm font-bold uppercase"
                  style={{ fontFamily: MONO, color: RED, borderColor: RED }}
                >
                  Limpar
                </button>
              )}
            </div>

            {/* ── contagem / loading ── */}
            {corrLoading ? (
              <EmptyPanel text={`Carregando votações de ${corrYearFilter || "todos os anos"}…`} />
            ) : (
              <>
                <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: "var(--foreground)", opacity: 0.6 }}>
                  {fmtNum(filteredCorrelacao.length)} registros
                  {corrYearFilter ? ` · ${corrYearFilter}` : " · todos os anos"}
                  {corrPartyFilter ? ` · ${corrPartyFilter}` : ""}
                  {corrIdeologyFilter ? ` · ${IDEOLOGY_LABELS[corrIdeologyFilter] ?? corrIdeologyFilter}` : ""}
                  {" · mostrando 200 por vez"}
                </p>

                <SimpleTable
                  rows={filteredCorrelacao}
                  columns={["ano", "id_votacao", "proposicao", "partido", "ideologia", "sim", "nao", "abstencao", "obstrucao", "outros", "total", "pct_sim"]}
                  empty="Sem correlação para os filtros selecionados."
                  limit={200}
                />
              </>
            )}
          </section>
        )}

        {!loading && !error && activeSection === "votos" && (
          <section className="border-b border-border px-6 py-16 md:px-14">
            <SectionHeader n="9.3" tag="OBSERVAR VOTO NA PROPOSTA" title="Voto de cada deputado em uma proposta específica" desc="Escolha uma votação/proposta e veja o voto nominal registrado para cada deputado." />
            <div className="mb-6">
              <input value={proposalSearch} onChange={(event) => setProposalSearch(event.target.value)} placeholder="Buscar proposta ou id da votação" className="h-10 w-full max-w-xl border border-border bg-background px-3 text-sm outline-none" />
            </div>
            <div className="mb-8 grid gap-3">
              {proposalMatches.map((row) => (
                <button key={`${text(row, "ano")}-${text(row, "id_votacao")}`} type="button" onClick={() => setSelectedVotacao(row)} className="border border-border p-4 text-left transition-colors hover:border-primary" style={{ background: selectedVotacao && text(selectedVotacao, "id_votacao") === text(row, "id_votacao") ? "rgba(196,18,48,0.08)" : "var(--card)" }}>
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary" style={{ fontFamily: MONO }}>{text(row, "ano")} · {text(row, "id_votacao")} · {fmtNum(raw(row, "total"))} votos</p>
                  <p className="text-sm font-semibold text-foreground">{text(row, "proposicao")}</p>
                </button>
              ))}
            </div>
            {selectedVotacao ? (
              <>
                <div className="mb-6 flex flex-wrap gap-3">
                  <input value={voteSearch} onChange={(event) => setVoteSearch(event.target.value)} placeholder="Filtrar deputado ou partido" className="h-10 min-w-[260px] border border-border bg-background px-3 text-sm outline-none" />
                  <select value={voteFilter} onChange={(event) => setVoteFilter(event.target.value)} className="h-10 border border-border bg-background px-3 text-sm outline-none">
                    <option value="todos">Todos os votos</option>
                    <option value="Sim">Sim</option>
                    <option value="Nao">Não</option>
                    <option value="Abstencao">Abstenção</option>
                    <option value="Obstrucao">Obstrução</option>
                  </select>
                </div>
                {votosLoading ? <EmptyPanel text="Carregando votos da proposta..." /> : <SimpleTable rows={filteredVotes} columns={["ano", "id_votacao", "nome", "partido", "ideologia_partido", "sigla_uf", "voto"]} empty="Sem votos para esta proposta." limit={200} />}
              </>
            ) : <EmptyPanel text="Selecione uma proposta para carregar os votos nominais." />}
          </section>
        )}

        {!loading && !error && activeSection === "metodologia" && (
          <section className="border-b border-border px-6 py-14 md:px-14">
            <SectionHeader
              n="07E"
              tag="METODOLOGIA"
              title="Como os indicadores foram calculados?"
              desc="Transparencia analitica - Clique em cada metodo para expandir"
            />

            {METODOS_Q9.map((m) => (
              <div key={m.id} className="mb-3 border border-border" style={{ background: "var(--card)" }}>
                <button
                  type="button"
                  onClick={() => toggleMetodo(m.id)}
                  className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-white/[0.03] md:px-6"
                >
                  <div>
                    <p className="text-base font-black leading-tight md:text-lg" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.titulo}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] md:text-[13px]" style={{ color: RED, fontFamily: MONO }}>{m.origem}</p>
                  </div>
                  <span className="ml-4 shrink-0 text-sm font-black md:text-base" style={{ color: RED, fontFamily: MONO }}>
                    {metodoOpen[m.id] ? "▲" : "▼"}
                  </span>
                </button>

                {metodoOpen[m.id] && (
                  <div className="border-t border-border px-5 py-6 md:px-6" style={{ background: "var(--card)" }}>
                    <div className="mb-4 border-l-2 py-2 pl-4" style={{ borderColor: "var(--primary)" }}>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: RED, fontFamily: MONO }}>Formula</p>
                      <p className="mt-1 text-base font-bold leading-relaxed" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.formula}</p>
                    </div>
                    <div className="mb-5 flex flex-col gap-3">
                      {m.passos.map((p, pi) => (
                        <p key={pi} className="text-sm font-medium leading-relaxed md:text-[15px]" style={{ color: "var(--foreground)", fontFamily: MONO }}>{p}</p>
                      ))}
                    </div>
                    <div className="border border-border p-4" style={{ background: "rgba(196,18,48,0.08)" }}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: RED, fontFamily: MONO }}>Como interpretar</p>
                      <p className="text-sm font-semibold leading-relaxed md:text-[15px]" style={{ color: "var(--foreground)", fontFamily: MONO }}>{m.interpretacao}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
