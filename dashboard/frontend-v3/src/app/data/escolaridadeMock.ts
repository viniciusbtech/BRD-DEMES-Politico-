export type EducationLevel = {
  key: string;
  label: string;
  shortLabel: string;
  color: string;
};

export type DeputyEducation = {
  id: number;
  name: string;
  party: string;
  state: string;
  img: string;
  education: string;
  course: string;
  institution: string;
};

export type EducationDistribution = {
  level: string;
  count: number;
  percent: number;
  color: string;
};

export type EducationSummary = {
  label: string;
  value: string;
  note: string;
};

export type PartyEducation = {
  id: string;
  name: string;
  full: string;
  seats: number;
  color: string;
  values: number[];
};

export const educationLevels: EducationLevel[] = [
  { key: "medio", label: "Ensino Médio", shortLabel: "Méd.", color: "#555555" },
  { key: "supinc", label: "Superior Incompleto", shortLabel: "Sup.Inc.", color: "#888880" },
  { key: "sup", label: "Superior Completo", shortLabel: "Superior", color: "#2e5fa3" },
  { key: "pos", label: "Pós-Graduação", shortLabel: "Pós-Grad.", color: "#4a7c59" },
  { key: "mestrado", label: "Mestrado", shortLabel: "Mestrado", color: "#d4841a" },
  { key: "doutorado", label: "Doutorado", shortLabel: "Doutorado", color: "#c41230" },
];

export const deputiesEducation: DeputyEducation[] = [
  { id: 1, name: "Roberto Alves Silva", party: "PT", state: "SP", img: "photo-1519085360753-af0119f7cbe7", education: "Superior Completo", course: "Direito", institution: "USP" },
  { id: 2, name: "André Lima Fonseca", party: "PSDB", state: "MG", img: "photo-1585846416120-3a7354ed7d39", education: "Pós-Graduação", course: "Economia", institution: "PUC-MG" },
  { id: 3, name: "Carlos Eduardo Farias", party: "MDB", state: "BA", img: "photo-1648448942225-7aa06c7e8f79", education: "Mestrado", course: "Ciências Sociais", institution: "UFBA" },
  { id: 4, name: "Paulo Henrique Mota", party: "PL", state: "RJ", img: "photo-1531630142108-cb432ed39657", education: "Superior Completo", course: "Administração", institution: "UERJ" },
  { id: 5, name: "Marcos José Ribeiro", party: "MDB", state: "CE", img: "photo-1740906010746-72aa48cea181", education: "Ensino Médio", course: "-", institution: "-" },
  { id: 6, name: "Eduardo Braga", party: "PDT", state: "AM", img: "photo-1659444003277-6cb0a5ffc8bd", education: "Doutorado", course: "Engenharia Elétrica", institution: "UNICAMP" },
  { id: 7, name: "Sérgio Dias Alves", party: "PP", state: "RS", img: "photo-1750741268857-7e44510f867d", education: "Pós-Graduação", course: "Gestão Pública", institution: "FGV" },
  { id: 8, name: "Fernanda Costa Lopes", party: "PL", state: "GO", img: "photo-1519085360753-af0119f7cbe7", education: "Superior Completo", course: "Medicina", institution: "UFG" },
  { id: 9, name: "Jorge Antônio Pereira", party: "PT", state: "MG", img: "photo-1585846416120-3a7354ed7d39", education: "Mestrado", course: "Educação", institution: "UFMG" },
  { id: 10, name: "Luciana Ferreira Costa", party: "PSDB", state: "PR", img: "photo-1648448942225-7aa06c7e8f79", education: "Doutorado", course: "Direito Constitucional", institution: "UFPR" },
  { id: 11, name: "Carla Braga Santos", party: "UNIAO", state: "BA", img: "photo-1531630142108-cb432ed39657", education: "Superior Incompleto", course: "Pedagogia", institution: "UNEB" },
  { id: 12, name: "Renato Cardoso Lima", party: "MDB", state: "MT", img: "photo-1740906010746-72aa48cea181", education: "Superior Completo", course: "Agronomia", institution: "UFMT" },
];

export const totalEducation: EducationDistribution[] = [
  { level: "Ensino Médio", count: 57, percent: 11, color: "#555555" },
  { level: "Superior Incompleto", count: 39, percent: 8, color: "#888880" },
  { level: "Superior Completo", count: 236, percent: 46, color: "#2e5fa3" },
  { level: "Pós-Graduação", count: 97, percent: 19, color: "#4a7c59" },
  { level: "Mestrado", count: 52, percent: 10, color: "#d4841a" },
  { level: "Doutorado", count: 32, percent: 6, color: "#c41230" },
];

export const educationSummary: EducationSummary[] = [
  { label: "COM SUPERIOR OU MAIS", value: "81%", note: "416 deputados" },
  { label: "COM MESTRADO OU MAIS", value: "16%", note: "84 deputados" },
  { label: "SEM DIPLOMA SUPERIOR", value: "19%", note: "97 deputados" },
  { label: "CURSO MAIS COMUM", value: "Direito", note: "34% dos formados" },
];

export const partyEducation: PartyEducation[] = [
  { id: "PT", name: "PT", full: "Partido dos Trabalhadores", seats: 68, color: "#c41230", values: [4, 5, 28, 15, 10, 6] },
  { id: "PL", name: "PL", full: "Partido Liberal", seats: 99, color: "#1a3a7c", values: [22, 12, 38, 16, 8, 3] },
  { id: "UNIAO", name: "UNIÃO", full: "União Brasil", seats: 59, color: "#d4841a", values: [10, 8, 25, 10, 4, 2] },
  { id: "MDB", name: "MDB", full: "Movimento Democrático Brasileiro", seats: 42, color: "#4a7c59", values: [6, 5, 20, 7, 3, 1] },
  { id: "PSDB", name: "PSDB", full: "Partido da Social Democracia Brasileira", seats: 13, color: "#7b3fa0", values: [1, 0, 5, 4, 2, 1] },
  { id: "PP", name: "PP", full: "Progressistas", seats: 47, color: "#2e5fa3", values: [12, 7, 18, 7, 2, 1] },
  { id: "PDT", name: "PDT", full: "Partido Democrático Trabalhista", seats: 17, color: "#c8970a", values: [2, 2, 7, 4, 1, 1] },
];

export const educationImageUrl = (id: string, width = 800, height = 600) =>
  `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop&auto=format`;

export const educationColor = (level: string) =>
  educationLevels.find((item) => item.label === level)?.color ?? "#888880";
