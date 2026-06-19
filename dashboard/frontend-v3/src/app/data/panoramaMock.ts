export type TopDeputySpend = {
  name: string;
  party: string;
  state: string;
  total: number;
};

export type TopSupplier = {
  name: string;
  category: string;
  deputies: number;
  total: number;
};

export type TopCategory = {
  category: string;
  total: number;
  percent: number;
  color: string;
};

export type InfluenceGroup = {
  name: string;
  full: string;
  seats: number;
  score: number;
  color: string;
  detail: string;
};

export const topDeputySpending: TopDeputySpend[] = [
  { name: "Paulo H. Mota", party: "PL", state: "RJ", total: 1507600 },
  { name: "André Lima Fonseca", party: "PSDB", state: "MG", total: 1356200 },
  { name: "Roberto A. Silva", party: "PT", state: "SP", total: 1077250 },
  { name: "Marcos J. Ribeiro", party: "MDB", state: "CE", total: 987400 },
  { name: "Fernanda C. Lopes", party: "PL", state: "GO", total: 921300 },
  { name: "Sérgio D. Alves", party: "PP", state: "RS", total: 876500 },
  { name: "Eduardo M. Braga", party: "PDT", state: "AM", total: 845200 },
  { name: "Carla B. Santos", party: "UNIÃO", state: "BA", total: 812700 },
  { name: "Jorge A. Pereira", party: "PT", state: "MG", total: 798400 },
  { name: "Luciana F. Costa", party: "PSDB", state: "PR", total: 765900 },
];

export const topSuppliers: TopSupplier[] = [
  { name: "Azul Linhas Aéreas", category: "Transporte Aéreo", deputies: 312, total: 48200000 },
  { name: "LATAM Airlines", category: "Transporte Aéreo", deputies: 287, total: 41800000 },
  { name: "Gol Linhas Aéreas", category: "Transporte Aéreo", deputies: 261, total: 36500000 },
  { name: "Correios", category: "Postagem", deputies: 401, total: 8700000 },
  { name: "Auto Posto Brasília", category: "Combustível", deputies: 198, total: 12400000 },
  { name: "Hotel Nacional Brasília", category: "Hospedagem", deputies: 176, total: 9800000 },
  { name: "Restaurant Congresso", category: "Alimentação", deputies: 389, total: 5400000 },
  { name: "Claro S.A.", category: "Telecom", deputies: 234, total: 7200000 },
  { name: "Vivo / Telefônica", category: "Telecom", deputies: 218, total: 6900000 },
  { name: "Locadora Prime Cars", category: "Veículos", deputies: 142, total: 4800000 },
];

export const topCategories: TopCategory[] = [
  { category: "Passagens Aéreas", total: 312000000, percent: 41, color: "#c41230" },
  { category: "Divulgação da Ativ. Parlamentar", total: 187000000, percent: 25, color: "#d4841a" },
  { category: "Combustíveis e Lubrificantes", total: 98000000, percent: 13, color: "#4a7c59" },
  { category: "Alimentação", total: 76000000, percent: 10, color: "#2e5fa3" },
  { category: "Hospedagem", total: 52000000, percent: 7, color: "#7b3fa0" },
];

export const topInfluenceGroups: InfluenceGroup[] = [
  { name: "PL", full: "Partido Liberal", seats: 99, score: 94, color: "#1a3a7c", detail: "Maior bancada da Câmara. Lidera comissões-chave e pauta de segurança." },
  { name: "UNIÃO", full: "União Brasil", seats: 59, score: 80, color: "#d4841a", detail: "2ª maior bancada. Forte presença em comunicação e agronegócio." },
  { name: "PT", full: "Partido dos Trabalhadores", seats: 68, score: 76, color: "#c41230", detail: "Base governista. Domina pautas sociais e ministérios estratégicos." },
  { name: "PP", full: "Progressistas", seats: 47, score: 67, color: "#2e5fa3", detail: "Aliado histórico de grandes obras e bancada ruralista." },
  { name: "MDB", full: "Mov. Democrático Brasileiro", seats: 42, score: 60, color: "#4a7c59", detail: "Partido de centro com presença em todos os estados." },
];

export const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
