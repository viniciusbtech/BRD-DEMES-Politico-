export const B = "https://images.unsplash.com/";
export const img = (id: string, w = 800, h = 600) =>
  `${B}${id}?w=${w}&h=${h}&fit=crop&auto=format`;
export const fmt = (n: number) =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 0 });

/* ── Strip photos (intro) ─────────────────────────── */
export const stripPhotos = [
  { id: "photo-1519085360753-af0119f7cbe7", name: "Dep. Roberto Silva" },
  { id: "photo-1585846416120-3a7354ed7d39", name: "Dep. André Lima" },
  { id: "photo-1648448942225-7aa06c7e8f79", name: "Dep. Carlos Farias" },
  { id: "photo-1531630142108-cb432ed39657", name: "Dep. Paulo Mota" },
  { id: "photo-1740906010746-72aa48cea181", name: "Dep. Marcos Neto" },
  { id: "photo-1659444003277-6cb0a5ffc8bd", name: "Dep. Eduardo Braga" },
  { id: "photo-1750741268857-7e44510f867d", name: "Dep. Sérgio Alves" },
];

/* ── Hero stats ───────────────────────────────────── */
export const heroStats = [
  { value: "513", label: "Deputados Federais", sub: "na 57ª Legislatura" },
  { value: "R$ 1,48 bi", label: "Gastos Totais", sub: "CEAP acumulada 2023–2026" },
  { value: "34.712", label: "Proposições", sub: "apresentadas no período" },
];

/* ── Análises disponíveis (home cards) ───────────── */
export const analyses = [
  {
    n: 1,
    route: "/panorama",
    tag: "VISÃO GERAL",
    title: "Panorama Geral",
    desc: "Top 10 deputados que mais gastam, fornecedores, categorias e grupos mais influentes.",
    imgId: "photo-1529107386315-e1a2ed48a620",
  },
  {
    n: 2,
    route: "/deputado",
    tag: "PERFIL",
    title: "Deputados Específicos",
    desc: "Gastos, eixos de atuação, padrão de votos e custo-benefício de cada parlamentar.",
    imgId: "photo-1519085360753-af0119f7cbe7",
  },
  {
    n: 3,
    route: "/partidos",
    tag: "AGREMIAÇÕES",
    title: "Partidos",
    desc: "Presença, gastos, proposições, nuvem de palavras e ranking de influência.",
    imgId: "photo-1540910419892-4a36d2c3266c",
  },
  {
    n: 4,
    route: "/gastos-sociais",
    tag: "IMPACTO SOCIAL",
    title: "Gastos e Problemas Sociais",
    desc: "O que poderíamos construir se economizássemos os gastos parlamentares? Sliders interativos e efeitos disruptivos.",
    imgId: "photo-1607920609380-4ce0f52486a9",
  },
  {
    n: 5,
    route: "/fornecedores",
    tag: "CONTRATOS",
    title: "Fornecedores × Deputados",
    desc: "Quanto foi gasto, fornecedores com mais deputados e contratos por empresa.",
    imgId: "photo-1526304640581-d334cdbbf45e",
  },
  {
    n: 6,
    route: "/influencia",
    tag: "REDES",
    title: "Influência + Grupos e Partidos",
    desc: "Como os grupos parlamentares se influenciam e quais partidos têm maior poder de articulação.",
    imgId: "photo-1666875753105-c63a6f3bdc86",
  },
  {
    n: 7,
    route: "/comportamento",
    tag: "VIÉS & VOTO",
    title: "Como o Deputado se Comporta",
    desc: "Viés real do deputado e do partido, e como cada parlamentar votou em propostas específicas.",
    imgId: "photo-1529107386315-e1a2ed48a620",
  },
  {
    n: 8,
    route: "/escolaridade",
    tag: "EDUCAÇÃO",
    title: "Deputados e Escolaridade",
    desc: "Nível de escolaridade por deputado e por partido — quem representa o Brasil tem formação?",
    imgId: "photo-1551288049-bebda4e38f71",
  },
];

/* ── Deputies ─────────────────────────────────────── */
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
      { label: "Agronegócio",    pct: 42 },
      { label: "Infraestrutura", pct: 30 },
      { label: "Segurança",      pct: 15 },
      { label: "Educação",       pct: 8  },
      { label: "Saúde",          pct: 5  },
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

/* ── Parties mock data ────────────────────────────── */
export const PARTIES = [
  { id: "PT",   name: "PT",   full: "Partido dos Trabalhadores",          seats: 68, color: "#c41230", presenca: 84, gasto: 28400000 },
  { id: "PL",   name: "PL",   full: "Partido Liberal",                    seats: 99, color: "#1a3a7c", presenca: 76, gasto: 41200000 },
  { id: "UNIAO",name: "UNIÃO",full: "União Brasil",                       seats: 59, color: "#d4841a", presenca: 79, gasto: 24600000 },
  { id: "MDB",  name: "MDB",  full: "Movimento Democrático Brasileiro",   seats: 42, color: "#4a7c59", presenca: 81, gasto: 17400000 },
  { id: "PSDB", name: "PSDB", full: "Partido da Social Democracia Brasileira", seats: 13, color: "#7b3fa0", presenca: 73, gasto: 5400000 },
  { id: "PP",   name: "PP",   full: "Progressistas",                      seats: 47, color: "#2e5fa3", presenca: 78, gasto: 19500000 },
  { id: "PDT",  name: "PDT",  full: "Partido Democrático Trabalhista",    seats: 17, color: "#c8970a", presenca: 82, gasto: 7100000 },
];

/* ── Suppliers mock data ──────────────────────────── */
export const SUPPLIERS = [
  { id: 1, name: "Azul Linhas Aéreas",      total: 48200000, deputies: 312, category: "Transporte Aéreo" },
  { id: 2, name: "LATAM Airlines",           total: 41800000, deputies: 287, category: "Transporte Aéreo" },
  { id: 3, name: "Gol Linhas Aéreas",        total: 36500000, deputies: 261, category: "Transporte Aéreo" },
  { id: 4, name: "Auto Posto Brasília",      total: 12400000, deputies: 198, category: "Combustível" },
  { id: 5, name: "Hotel Nacional Brasília",  total: 9800000,  deputies: 176, category: "Hospedagem" },
  { id: 6, name: "Correios",                 total: 8700000,  deputies: 401, category: "Postagem" },
  { id: 7, name: "Claro S.A.",               total: 7200000,  deputies: 234, category: "Telecom" },
  { id: 8, name: "Vivo / Telefônica",        total: 6900000,  deputies: 218, category: "Telecom" },
  { id: 9, name: "Restaurant Congresso",     total: 5400000,  deputies: 389, category: "Alimentação" },
  { id: 10,name: "Locadora Prime Cars",      total: 4800000,  deputies: 142, category: "Veículos" },
];

/* ── Panorama — top spenders ──────────────────────── */
export const TOP_SPENDERS = [
  { name: "Paulo H. Mota",      party: "PL",   state: "RJ", total: 1507600 },
  { name: "André Lima Fonseca", party: "PSDB", state: "MG", total: 1356200 },
  { name: "Roberto A. Silva",   party: "PT",   state: "SP", total: 1077250 },
  { name: "Marcos J. Ribeiro",  party: "MDB",  state: "CE", total: 987400  },
  { name: "Fernanda C. Lopes",  party: "PL",   state: "GO", total: 921300  },
  { name: "Sérgio D. Alves",    party: "PP",   state: "RS", total: 876500  },
  { name: "Eduardo M. Braga",   party: "PDT",  state: "AM", total: 845200  },
  { name: "Carla B. Santos",    party: "UNION",state: "BA", total: 812700  },
  { name: "Jorge A. Pereira",   party: "PT",   state: "MG", total: 798400  },
  { name: "Luciana F. Costa",   party: "PSDB", state: "PR", total: 765900  },
];
