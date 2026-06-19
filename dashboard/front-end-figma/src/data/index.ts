export const B = "https://images.unsplash.com/";
export const img = (id: string, w = 800, h = 600) =>
  `${B}${id}?w=${w}&h=${h}&fit=crop&auto=format`;

export const fmt = (n: number) =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 0 });

export const stripPhotos = [
  { id: "photo-1519085360753-af0119f7cbe7", name: "Dep. Roberto Silva" },
  { id: "photo-1585846416120-3a7354ed7d39", name: "Dep. André Lima" },
  { id: "photo-1648448942225-7aa06c7e8f79", name: "Dep. Carlos Farias" },
  { id: "photo-1531630142108-cb432ed39657", name: "Dep. Paulo Mota" },
  { id: "photo-1740906010746-72aa48cea181", name: "Dep. Marcos Neto" },
  { id: "photo-1659444003277-6cb0a5ffc8bd", name: "Dep. Eduardo Braga" },
  { id: "photo-1750741268857-7e44510f867d", name: "Dep. Sérgio Alves" },
];

export const heroStats = [
  { value: "513", label: "Deputados Federais", sub: "na 57ª Legislatura" },
  { value: "R$ 1,48 bi", label: "Gastos Totais", sub: "CEAP acumulada 2023–2026" },
  { value: "34.712", label: "Proposições", sub: "apresentadas no período" },
];

export const analyses = [
  { n: 1,  tag: "COTA PARLAMENTAR",    title: "Quem gasta mais?",            summary: "A CEAP permite até R$ 45.600/mês por deputado. Mapeamos quem ultrapassa o razoável, o que compram e de quem.",                                                                           highlight: "Top 10% gastam 3× a média",               imgId: "photo-1526304640581-d334cdbbf45e" },
  { n: 2,  tag: "FREQUÊNCIA",          title: "Presente ou ausente?",         summary: "Cruzamos registros de votações nominais com ausências — quem justificou, quem sumiu e quem só aparece quando as câmeras estão ligadas.",                                                highlight: "68% de presença média",                   imgId: "photo-1540910419892-4a36d2c3266c" },
  { n: 3,  tag: "ALINHAMENTO",         title: "Qual é o lado?",               summary: "Calculamos o índice de governismo: com que frequência votou ao lado do Executivo — independente do discurso público.",                                                                    highlight: "41% votam diferente do que declaram",      imgId: "photo-1529107386315-e1a2ed48a620" },
  { n: 4,  tag: "PRODUÇÃO LEGISLATIVA",title: "Quem propõe o quê?",           summary: "Volume, tema, taxa de aprovação e impacto real de cada proposição. Separamos quem legisla de quem apenas protocola.",                                                                    highlight: "62% das proposições nunca saíram da mesa", imgId: "photo-1504711434969-e33886168f5c" },
  { n: 5,  tag: "FINANCIAMENTO",       title: "De onde vem o dinheiro?",      summary: "Quem financiou a campanha de cada deputado? Rastreamos doadores e conexões entre financiamento e votações subsequentes.",                                                                 highlight: "Média de 7 financiadores por candidato",   imgId: "photo-1553729459-efe14ef6055d" },
  { n: 6,  tag: "PATRIMÔNIO",          title: "O que declararam ter?",        summary: "Comparamos declarações de bens do TSE entre mandatos. Quem enriqueceu no exercício do cargo?",                                                                                           highlight: "Patrimônio médio: R$ 2,3 mi",              imgId: "photo-1551288049-bebda4e38f71" },
  { n: 7,  tag: "IDEOLOGIA",           title: "Esquerda, centro ou direita?", summary: "Posicionamento objetivo baseado em votações nominais — independente de autodesignação partidária.",                                                                                       highlight: "Centro declarado ≠ centro votado em 54%",  imgId: "photo-1519085360753-af0119f7cbe7" },
  { n: 8,  tag: "REDES",               title: "Quem vota com quem?",          summary: "Grafos de coesão revelam blocos informais que transcendem legenda — alianças reais que só aparecem nos dados.",                                                                           highlight: "23 blocos de coesão identificados",        imgId: "photo-1666875753105-c63a6f3bdc86" },
  { n: 9,  tag: "DISCURSO vs. AÇÃO",   title: "Falaram muito, fizeram pouco?",summary: "Tempo de tribuna versus taxa de entrega. Oradores prolíficos sem resultado e silenciosos com impacto real.",                                                                            highlight: "Mais fala ≠ mais leis aprovadas",          imgId: "photo-1495020689067-958852a7765e" },
  { n: 10, tag: "COMISSÕES",           title: "Quem fiscaliza o quê?",        summary: "Quem preside, quem participa e como a composição favorece setores específicos da economia.",                                                                                               highlight: "Agronegócio lidera presidências",           imgId: "photo-1637102134162-7dc2c4995c22" },
  { n: 11, tag: "GABINETE",            title: "Quanto custa o gabinete?",     summary: "Cruzamos contratações com vínculos familiares, políticos e partidários — mapeando nepotismo e uso estratégico da folha.",                                                                 highlight: "18% têm familiares nos quadros",           imgId: "photo-1593672715438-d88a70629abe" },
  { n: 12, tag: "VIAGENS",             title: "Onde estão quando não estão?", summary: "Missões internacionais e visitas de trabalho — levantamos todas as viagens com verba pública e seu resultado.",                                                                           highlight: "R$ 23 mi em passagens internacionais",     imgId: "photo-1760872645513-63b6846ce3c9" },
  { n: 13, tag: "BALANÇO DO MANDATO",  title: "O que mudou em 4 anos?",       summary: "Análise cruzada de todas as variáveis: um dossiê baseado em dados públicos de cada um dos 513 deputados.",                                                                               highlight: "Análise integrada de 513 perfis",          imgId: "photo-1526628953301-3e589a6a8b74" },
];

export const DEPUTIES = [
  {
    id: 1,
    name: "Roberto Alves Silva",
    party: "PT",
    state: "SP",
    img: "photo-1519085360753-af0119f7cbe7",
    mandate: "57ª Legislatura · 2023–2027",
    spending: { 2023: 312450, 2024: 398700, 2025: 276800, 2026: 89300 },
    categories: [
      { name: "Passagens Aéreas", value: 185000, color: "#c41230" },
      { name: "Alimentação",      value: 145000, color: "#d4841a" },
      { name: "Hospedagem",       value: 98000,  color: "#4a7c59" },
      { name: "Combustível",      value: 67000,  color: "#2e5fa3" },
      { name: "Telecom",          value: 55000,  color: "#7b3fa0" },
      { name: "Serv. Postais",    value: 32000,  color: "#555" },
    ],
    axes: [
      { label: "Educação",          pct: 34 },
      { label: "Saúde",             pct: 28 },
      { label: "Meio Ambiente",     pct: 19 },
      { label: "Segurança Pública", pct: 12 },
      { label: "Infraestrutura",    pct: 7  },
    ],
    voting: [
      { theme: "Educação",      favor: 87, contra: 8,  ausente: 5 },
      { theme: "Saúde",         favor: 92, contra: 5,  ausente: 3 },
      { theme: "Meio Ambiente", favor: 78, contra: 15, ausente: 7 },
      { theme: "Privatizações", favor: 12, contra: 82, ausente: 6 },
      { theme: "Segurança",     favor: 65, contra: 28, ausente: 7 },
    ],
    cb: { score: 7.4, presenca: 82, proposicoes: 34, aprovadas: 8, total: 1077250 },
  },
  {
    id: 2,
    name: "André Lima Fonseca",
    party: "PSDB",
    state: "MG",
    img: "photo-1585846416120-3a7354ed7d39",
    mandate: "57ª Legislatura · 2023–2027",
    spending: { 2023: 408900, 2024: 445200, 2025: 390100, 2026: 112000 },
    categories: [
      { name: "Passagens Aéreas", value: 220000, color: "#c41230" },
      { name: "Alimentação",      value: 175000, color: "#d4841a" },
      { name: "Hospedagem",       value: 130000, color: "#4a7c59" },
      { name: "Combustível",      value: 89000,  color: "#2e5fa3" },
      { name: "Telecom",          value: 72000,  color: "#7b3fa0" },
      { name: "Serv. Postais",    value: 45000,  color: "#555" },
    ],
    axes: [
      { label: "Agronegócio",        pct: 42 },
      { label: "Infraestrutura",     pct: 30 },
      { label: "Segurança",          pct: 15 },
      { label: "Educação",           pct: 8  },
      { label: "Saúde",              pct: 5  },
    ],
    voting: [
      { theme: "Agronegócio",    favor: 96, contra: 2,  ausente: 2 },
      { theme: "Infraestrutura", favor: 88, contra: 7,  ausente: 5 },
      { theme: "Segurança",      favor: 71, contra: 22, ausente: 7 },
      { theme: "Meio Ambiente",  favor: 24, contra: 68, ausente: 8 },
      { theme: "Saúde",          favor: 55, contra: 38, ausente: 7 },
    ],
    cb: { score: 5.1, presenca: 74, proposicoes: 18, aprovadas: 3, total: 1356200 },
  },
  {
    id: 3,
    name: "Carlos Eduardo Farias",
    party: "MDB",
    state: "BA",
    img: "photo-1648448942225-7aa06c7e8f79",
    mandate: "57ª Legislatura · 2023–2027",
    spending: { 2023: 198700, 2024: 231400, 2025: 198000, 2026: 67200 },
    categories: [
      { name: "Passagens Aéreas",    value: 120000, color: "#c41230" },
      { name: "Alimentação",         value: 98000,  color: "#d4841a" },
      { name: "Hospedagem",          value: 72000,  color: "#4a7c59" },
      { name: "Combustível",         value: 45000,  color: "#2e5fa3" },
      { name: "Telecom",             value: 38000,  color: "#7b3fa0" },
      { name: "Serv. Postais",       value: 22300,  color: "#555" },
    ],
    axes: [
      { label: "Saúde",              pct: 38 },
      { label: "Assistência Social", pct: 29 },
      { label: "Educação",           pct: 22 },
      { label: "Habitação",          pct: 11 },
    ],
    voting: [
      { theme: "Saúde",              favor: 94, contra: 3,  ausente: 3 },
      { theme: "Assistência Social", favor: 90, contra: 6,  ausente: 4 },
      { theme: "Educação",           favor: 85, contra: 10, ausente: 5 },
      { theme: "Privatizações",      favor: 18, contra: 76, ausente: 6 },
      { theme: "Segurança",          favor: 60, contra: 33, ausente: 7 },
    ],
    cb: { score: 8.7, presenca: 91, proposicoes: 52, aprovadas: 14, total: 695300 },
  },
  {
    id: 4,
    name: "Paulo Henrique Mota",
    party: "PL",
    state: "RJ",
    img: "photo-1531630142108-cb432ed39657",
    mandate: "57ª Legislatura · 2023–2027",
    spending: { 2023: 421000, 2024: 487300, 2025: 456100, 2026: 143200 },
    categories: [
      { name: "Passagens Aéreas", value: 245000, color: "#c41230" },
      { name: "Alimentação",      value: 198000, color: "#d4841a" },
      { name: "Hospedagem",       value: 155000, color: "#4a7c59" },
      { name: "Combustível",      value: 112000, color: "#2e5fa3" },
      { name: "Telecom",          value: 89000,  color: "#7b3fa0" },
      { name: "Serv. Postais",    value: 58600,  color: "#555" },
    ],
    axes: [
      { label: "Segurança Pública", pct: 48 },
      { label: "Defesa Nacional",   pct: 25 },
      { label: "Economia",          pct: 17 },
      { label: "Outros",            pct: 10 },
    ],
    voting: [
      { theme: "Segurança",     favor: 98, contra: 1,  ausente: 1 },
      { theme: "Privatizações", favor: 91, contra: 5,  ausente: 4 },
      { theme: "Meio Ambiente", favor: 18, contra: 75, ausente: 7 },
      { theme: "Saúde",         favor: 42, contra: 50, ausente: 8 },
      { theme: "Educação",      favor: 38, contra: 55, ausente: 7 },
    ],
    cb: { score: 4.2, presenca: 69, proposicoes: 11, aprovadas: 1, total: 1507600 },
  },
];

export type Deputy = typeof DEPUTIES[0];
