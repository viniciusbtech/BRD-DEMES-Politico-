export type PartyStatus = "Aprovado" | "Em votação" | "Rejeitado" | "Arquivado";

export type Party = {
  id: string;
  name: string;
  full: string;
  seats: number;
  color: string;
  presence: number;
  spending: number;
};

export type CategorySpend = {
  category: string;
  value: number;
  color: string;
};

export type PartyProposal = {
  id: string;
  title: string;
  status: PartyStatus;
  author: string;
  date: string;
};

export type WordCloudItem = {
  word: string;
  size: number;
  weight: number;
};

export type InfluenceRankItem = {
  party: string;
  score: number;
  seats: number;
  color: string;
};

export const parties: Party[] = [
  { id: "PL", name: "PL", full: "Partido Liberal", seats: 99, color: "#1a3a7c", presence: 76, spending: 41200000 },
  { id: "UNIAO", name: "UNIÃO", full: "União Brasil", seats: 59, color: "#d4841a", presence: 79, spending: 24600000 },
  { id: "PT", name: "PT", full: "Partido dos Trabalhadores", seats: 68, color: "#c41230", presence: 84, spending: 28400000 },
  { id: "PP", name: "PP", full: "Progressistas", seats: 47, color: "#2e5fa3", presence: 78, spending: 19500000 },
  { id: "MDB", name: "MDB", full: "Movimento Democrático Brasileiro", seats: 42, color: "#4a7c59", presence: 81, spending: 17400000 },
  { id: "REPO", name: "REPO", full: "Republicanos", seats: 40, color: "#7b3fa0", presence: 77, spending: 16600000 },
  { id: "PDT", name: "PDT", full: "Partido Democrático Trabalhista", seats: 17, color: "#c8970a", presence: 82, spending: 7100000 },
  { id: "PSDB", name: "PSDB", full: "Partido da Social Democracia Brasileira", seats: 13, color: "#888880", presence: 73, spending: 5400000 },
];

export const categorySpendingByParty: Record<string, CategorySpend[]> = {
  PL: [
    { category: "Passagens aéreas", value: 16800000, color: "#c41230" },
    { category: "Divulgação", value: 10400000, color: "#d4841a" },
    { category: "Combustível", value: 6900000, color: "#4a7c59" },
    { category: "Alimentação", value: 5200000, color: "#2e5fa3" },
    { category: "Outros", value: 1900000, color: "#555555" },
  ],
  UNIAO: [
    { category: "Passagens aéreas", value: 10100000, color: "#c41230" },
    { category: "Divulgação", value: 6200000, color: "#d4841a" },
    { category: "Combustível", value: 3800000, color: "#4a7c59" },
    { category: "Alimentação", value: 2900000, color: "#2e5fa3" },
    { category: "Outros", value: 1600000, color: "#555555" },
  ],
  PT: [
    { category: "Passagens aéreas", value: 11200000, color: "#c41230" },
    { category: "Divulgação", value: 7100000, color: "#d4841a" },
    { category: "Combustível", value: 4200000, color: "#4a7c59" },
    { category: "Alimentação", value: 3800000, color: "#2e5fa3" },
    { category: "Outros", value: 2100000, color: "#555555" },
  ],
  PP: [
    { category: "Passagens aéreas", value: 7900000, color: "#c41230" },
    { category: "Divulgação", value: 4800000, color: "#d4841a" },
    { category: "Combustível", value: 3100000, color: "#4a7c59" },
    { category: "Alimentação", value: 2400000, color: "#2e5fa3" },
    { category: "Outros", value: 1300000, color: "#555555" },
  ],
  MDB: [
    { category: "Passagens aéreas", value: 7100000, color: "#c41230" },
    { category: "Divulgação", value: 4300000, color: "#d4841a" },
    { category: "Combustível", value: 2800000, color: "#4a7c59" },
    { category: "Alimentação", value: 2100000, color: "#2e5fa3" },
    { category: "Outros", value: 1100000, color: "#555555" },
  ],
  REPO: [
    { category: "Passagens aéreas", value: 6600000, color: "#c41230" },
    { category: "Divulgação", value: 4000000, color: "#d4841a" },
    { category: "Combustível", value: 2700000, color: "#4a7c59" },
    { category: "Alimentação", value: 2100000, color: "#2e5fa3" },
    { category: "Outros", value: 1200000, color: "#555555" },
  ],
  PDT: [
    { category: "Passagens aéreas", value: 2900000, color: "#c41230" },
    { category: "Divulgação", value: 1700000, color: "#d4841a" },
    { category: "Combustível", value: 1000000, color: "#4a7c59" },
    { category: "Alimentação", value: 900000, color: "#2e5fa3" },
    { category: "Outros", value: 600000, color: "#555555" },
  ],
  PSDB: [
    { category: "Passagens aéreas", value: 2200000, color: "#c41230" },
    { category: "Divulgação", value: 1400000, color: "#d4841a" },
    { category: "Combustível", value: 800000, color: "#4a7c59" },
    { category: "Alimentação", value: 600000, color: "#2e5fa3" },
    { category: "Outros", value: 400000, color: "#555555" },
  ],
};

export const proposalsByParty: Record<string, PartyProposal[]> = {
  PL: [
    { id: "PL 102/2023", title: "Porte de arma para produtores rurais", status: "Aprovado", author: "Dep. Marcos Neto", date: "Mar 2023" },
    { id: "PL 445/2023", title: "Redução do ICMS sobre combustíveis", status: "Aprovado", author: "Dep. Paulo Mota", date: "Jun 2023" },
    { id: "PL 981/2024", title: "Privatização de terminais portuários", status: "Em votação", author: "Dep. Sérgio Lima", date: "Jan 2024" },
    { id: "PL 1203/2024", title: "Marco regulatório de defesa pessoal", status: "Rejeitado", author: "Dep. André Faria", date: "Abr 2024" },
  ],
  PT: [
    { id: "PL 234/2023", title: "Ampliação do Bolsa Família urbano", status: "Aprovado", author: "Dep. Carlos Farias", date: "Mai 2023" },
    { id: "PL 567/2023", title: "Piso nacional de enfermagem", status: "Aprovado", author: "Dep. Roberto Silva", date: "Set 2023" },
    { id: "PL 890/2024", title: "Reforma tributária progressiva", status: "Em votação", author: "Dep. Ana Souza", date: "Mar 2024" },
    { id: "PL 1456/2024", title: "Habitação popular em áreas urbanas", status: "Aprovado", author: "Dep. João Lima", date: "Jul 2024" },
  ],
};

const defaultProposals = [
  { id: "PL 410/2023", title: "Marco de desenvolvimento regional", status: "Aprovado" as PartyStatus, author: "Dep. Heitor Viana", date: "Mai 2023" },
  { id: "PL 720/2024", title: "Renegociação de dívidas municipais", status: "Em votação" as PartyStatus, author: "Dep. Fátima Queiroz", date: "Fev 2024" },
  { id: "PL 1100/2024", title: "Concessão de rodovias federais", status: "Aprovado" as PartyStatus, author: "Dep. Renato Abreu", date: "Mai 2024" },
  { id: "PL 1890/2025", title: "Programa nacional de saneamento básico", status: "Em votação" as PartyStatus, author: "Dep. Celso Sabino", date: "Jan 2025" },
];

["UNIAO", "PP", "MDB", "REPO", "PDT", "PSDB"].forEach((partyId) => {
  proposalsByParty[partyId] = defaultProposals;
});

export const wordsByParty: Record<string, WordCloudItem[]> = {
  PL: [
    { word: "Segurança", size: 2.4, weight: 900 },
    { word: "Armas", size: 2, weight: 700 },
    { word: "Família", size: 1.8, weight: 700 },
    { word: "Privatização", size: 1.5, weight: 500 },
    { word: "Liberdade", size: 1.4, weight: 500 },
    { word: "Economia", size: 1.2, weight: 400 },
  ],
  PT: [
    { word: "Saúde", size: 2.4, weight: 900 },
    { word: "Educação", size: 2.1, weight: 700 },
    { word: "Trabalhadores", size: 1.9, weight: 700 },
    { word: "Habitação", size: 1.5, weight: 500 },
    { word: "Assistência", size: 1.4, weight: 500 },
    { word: "Direitos", size: 1.1, weight: 400 },
  ],
  UNIAO: [
    { word: "Agronegócio", size: 2.3, weight: 900 },
    { word: "Comunicação", size: 1.9, weight: 700 },
    { word: "Infraestrutura", size: 1.7, weight: 700 },
    { word: "Segurança", size: 1.5, weight: 500 },
    { word: "Regional", size: 1.2, weight: 400 },
  ],
};

const defaultWords = [
  { word: "Infraestrutura", size: 2.2, weight: 900 },
  { word: "Desenvolvimento", size: 1.9, weight: 700 },
  { word: "Reforma", size: 1.7, weight: 700 },
  { word: "Municipal", size: 1.4, weight: 500 },
  { word: "Saúde", size: 1.1, weight: 400 },
  { word: "Educação", size: 1, weight: 400 },
];

["PP", "MDB", "REPO", "PDT", "PSDB"].forEach((partyId) => {
  wordsByParty[partyId] = defaultWords;
});

export const influenceRank: InfluenceRankItem[] = [
  { party: "PL", score: 94, seats: 99, color: "#1a3a7c" },
  { party: "UNIÃO", score: 80, seats: 59, color: "#d4841a" },
  { party: "PT", score: 76, seats: 68, color: "#c41230" },
  { party: "PP", score: 67, seats: 47, color: "#2e5fa3" },
  { party: "MDB", score: 60, seats: 42, color: "#4a7c59" },
];

export const statusColor: Record<PartyStatus, string> = {
  Aprovado: "#4a7c59",
  "Em votação": "#d4841a",
  Rejeitado: "#c41230",
  Arquivado: "#555555",
};

export const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

export type ComportamentoDeputy = {
  id: number;
  name: string;
  party: string;
  state: string;
  img: string;
  mandate: string;
};

export type IdeologyBias = {
  realScore: number;
  realLabel: string;
  declaredScore: number;
  declaredLabel: string;
  consistency: number;
  notes: string;
};

export type ComportamentoParty = {
  id: string;
  name: string;
  full: string;
  seats: number;
  color: string;
  score: number;
  label: string;
  consistency: number;
};

export type ProposalResult = "Aprovado" | "Rejeitado" | "Em votação";
export type DeputyVote = "Sim" | "Não" | "Abstenção" | "Ausente";

export type ComportamentoProposal = {
  id: string;
  title: string;
  date: string;
  theme: string;
  result: ProposalResult;
  placar: string;
};

export const imageUrl = (id: string, width = 800, height = 600) =>
  `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop&auto=format`;

export const comportamentoDeputies: ComportamentoDeputy[] = [
  {
    id: 1,
    name: "Roberto Alves Silva",
    party: "PT",
    state: "SP",
    img: "photo-1519085360753-af0119f7cbe7",
    mandate: "57ª Legislatura · 2023-2027",
  },
  {
    id: 2,
    name: "André Lima Fonseca",
    party: "PSDB",
    state: "MG",
    img: "photo-1585846416120-3a7354ed7d39",
    mandate: "57ª Legislatura · 2023-2027",
  },
  {
    id: 3,
    name: "Carlos Eduardo Farias",
    party: "MDB",
    state: "BA",
    img: "photo-1648448942225-7aa06c7e8f79",
    mandate: "57ª Legislatura · 2023-2027",
  },
  {
    id: 4,
    name: "Paulo Henrique Mota",
    party: "PL",
    state: "RJ",
    img: "photo-1531630142108-cb432ed39657",
    mandate: "57ª Legislatura · 2023-2027",
  },
];

export const deputyBias: Record<number, IdeologyBias> = {
  1: {
    realScore: 18,
    realLabel: "Centro-Esquerda",
    declaredScore: 10,
    declaredLabel: "Esquerda",
    consistency: 84,
    notes: "Vota ligeiramente mais ao centro do que declara publicamente. Alta coesão com a bancada do PT.",
  },
  2: {
    realScore: 65,
    realLabel: "Centro-Direita",
    declaredScore: 50,
    declaredLabel: "Centro",
    consistency: 61,
    notes: "Declara posição centrista, mas vota consistentemente à direita em pautas econômicas e de segurança.",
  },
  3: {
    realScore: 22,
    realLabel: "Centro-Esquerda",
    declaredScore: 25,
    declaredLabel: "Centro-Esquerda",
    consistency: 91,
    notes: "Alto alinhamento entre discurso e voto. Um dos perfis mais consistentes entre os deputados analisados.",
  },
  4: {
    realScore: 84,
    realLabel: "Direita",
    declaredScore: 80,
    declaredLabel: "Direita",
    consistency: 78,
    notes: "Alinhamento declarado e real próximos. Vota com a bancada conservadora em pautas de segurança.",
  },
};

export const comportamentoParties: ComportamentoParty[] = [
  { id: "PT", name: "PT", full: "Partido dos Trabalhadores", seats: 68, color: "#c41230", score: 14, label: "Esquerda", consistency: 88 },
  { id: "PL", name: "PL", full: "Partido Liberal", seats: 99, color: "#1a3a7c", score: 86, label: "Direita", consistency: 82 },
  { id: "UNIAO", name: "UNIÃO", full: "União Brasil", seats: 59, color: "#d4841a", score: 66, label: "Centro-Direita", consistency: 71 },
  { id: "MDB", name: "MDB", full: "Movimento Democrático Brasileiro", seats: 42, color: "#4a7c59", score: 50, label: "Centro", consistency: 64 },
  { id: "PSDB", name: "PSDB", full: "Partido da Social Democracia Brasileira", seats: 13, color: "#7b3fa0", score: 60, label: "Centro-Direita", consistency: 68 },
  { id: "PP", name: "PP", full: "Progressistas", seats: 47, color: "#2e5fa3", score: 70, label: "Centro-Direita", consistency: 73 },
  { id: "PDT", name: "PDT", full: "Partido Democrático Trabalhista", seats: 17, color: "#c8970a", score: 26, label: "Centro-Esquerda", consistency: 79 },
];

export const comportamentoProposals: ComportamentoProposal[] = [
  { id: "PL 102/2023", title: "Porte de arma para produtores rurais", date: "Mar 2023", theme: "Segurança", result: "Aprovado", placar: "321 x 142" },
  { id: "PL 567/2023", title: "Piso nacional de enfermagem", date: "Set 2023", theme: "Saúde", result: "Aprovado", placar: "378 x 98" },
  { id: "PL 890/2024", title: "Reforma tributária progressiva", date: "Mar 2024", theme: "Economia", result: "Aprovado", placar: "382 x 118" },
  { id: "PL 1203/2024", title: "Marco regulatório de defesa pessoal", date: "Abr 2024", theme: "Segurança", result: "Rejeitado", placar: "198 x 287" },
  { id: "PL 1456/2024", title: "Habitação popular em áreas urbanas", date: "Jul 2024", theme: "Social", result: "Aprovado", placar: "412 x 78" },
  { id: "PL 1780/2025", title: "Regulação de horas extras e banco de horas", date: "Jan 2025", theme: "Trabalho", result: "Em votação", placar: "-" },
];

export const deputyVotes: Record<number, Record<string, DeputyVote>> = {
  1: { "PL 102/2023": "Não", "PL 567/2023": "Sim", "PL 890/2024": "Sim", "PL 1203/2024": "Não", "PL 1456/2024": "Sim", "PL 1780/2025": "Sim" },
  2: { "PL 102/2023": "Sim", "PL 567/2023": "Não", "PL 890/2024": "Abstenção", "PL 1203/2024": "Sim", "PL 1456/2024": "Não", "PL 1780/2025": "Não" },
  3: { "PL 102/2023": "Não", "PL 567/2023": "Sim", "PL 890/2024": "Sim", "PL 1203/2024": "Não", "PL 1456/2024": "Sim", "PL 1780/2025": "Sim" },
  4: { "PL 102/2023": "Sim", "PL 567/2023": "Ausente", "PL 890/2024": "Não", "PL 1203/2024": "Sim", "PL 1456/2024": "Não", "PL 1780/2025": "Sim" },
};
