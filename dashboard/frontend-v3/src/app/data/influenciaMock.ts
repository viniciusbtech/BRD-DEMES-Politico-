export type GroupInfluence = {
  name: string;
  members: number;
  score: number;
  color: string;
  parties: string[];
  themes: string[];
  connects: string[];
  opposes: string[];
  description: string;
};

export type PartyInfluence = {
  party: string;
  seats: number;
  score: number;
  color: string;
  full: string;
  detail: string;
};

export type RadarInfluence = {
  axis: string;
  PL: number;
  PT: number;
  MDB: number;
};

export const groups: GroupInfluence[] = [
  {
    name: "Bancada Ruralista",
    members: 297,
    score: 94,
    color: "#c41230",
    parties: ["PL", "UNIÃO", "PP", "MDB"],
    themes: ["Agronegócio", "Fundiário", "Crédito Rural", "Ambiental"],
    connects: ["Bancada da Segurança", "Bancada do Hidro"],
    opposes: ["Bancada da Educação", "Bancada Progressista"],
    description:
      "A maior bancada temática da Câmara. Bloqueia legislação ambiental e pauta crédito rural. Articula-se transversalmente em partidos de centro-direita.",
  },
  {
    name: "Bancada da Segurança",
    members: 184,
    score: 81,
    color: "#d4841a",
    parties: ["PL", "PP", "UNIÃO"],
    themes: ["Segurança Pública", "Armamento", "Penal", "Policial"],
    connects: ["Bancada Ruralista", "Bancada da Bíblia"],
    opposes: ["Bancada de Direitos Humanos"],
    description:
      "Pauta endurecimento penal, porte de armas e militarização da segurança. Tem forte presença em estados com altos índices de violência.",
  },
  {
    name: "Bancada da Bíblia",
    members: 203,
    score: 78,
    color: "#4a7c59",
    parties: ["PL", "UNIÃO", "PSDB", "PT"],
    themes: ["Família", "Religião", "Moral", "Educação"],
    connects: ["Bancada da Segurança", "Bancada Ruralista"],
    opposes: ["Bancada LGBTQIA+", "Bancada Progressista"],
    description:
      "Transversal a vários partidos. Define pauta de costumes e atua sobre educação religiosa, isenções fiscais e temas de família.",
  },
  {
    name: "Bancada da Saúde",
    members: 89,
    score: 62,
    color: "#2e5fa3",
    parties: ["PT", "MDB", "PDT"],
    themes: ["SUS", "Medicamentos", "Planos de Saúde", "Profissões"],
    connects: ["Bancada da Educação"],
    opposes: ["Bancada Ruralista"],
    description:
      "Defende o SUS e regulação de planos privados. Tem força moderada, mas articula-se com bancadas de esquerda e centro.",
  },
  {
    name: "Bancada da Educação",
    members: 74,
    score: 55,
    color: "#7b3fa0",
    parties: ["PT", "PDT", "PSDB"],
    themes: ["Universidades", "Ensino Básico", "FIES", "Professores"],
    connects: ["Bancada da Saúde"],
    opposes: ["Bancada Ruralista", "Bancada da Bíblia"],
    description:
      "Defende autonomia universitária, piso salarial de professores e financiamento público do ensino. Menor no ranking, mas coesa internamente.",
  },
];

export const partyInfluence: PartyInfluence[] = [
  { party: "PL", seats: 99, score: 94, color: "#1a3a7c", full: "Partido Liberal", detail: "Maior bancada. Preside comissões estratégicas e dita pauta de segurança e economia." },
  { party: "UNIÃO", seats: 59, score: 80, color: "#d4841a", full: "União Brasil", detail: "Forte em comunicação, agronegócio e cargos no primeiro escalão." },
  { party: "PT", seats: 68, score: 76, color: "#c41230", full: "Partido dos Trabalhadores", detail: "Base governista. Controla ministérios sociais e pauta redistribuição de renda." },
  { party: "PP", seats: 47, score: 67, color: "#2e5fa3", full: "Progressistas", detail: "Aliado histórico de obras e infraestrutura. Articula emendas com municípios pequenos." },
  { party: "MDB", seats: 42, score: 60, color: "#4a7c59", full: "Movimento Democrático Brasileiro", detail: "Centrão clássico. Presente em governos distintos, negocia cargos e recursos." },
  { party: "REPO", seats: 40, score: 54, color: "#7b3fa0", full: "Republicanos", detail: "Forte na bancada evangélica. Acesso a ministérios e cargos de segundo escalão." },
  { party: "PDT", seats: 17, score: 42, color: "#c8970a", full: "Partido Democrático Trabalhista", detail: "Influência desproporcional ao tamanho. Articula pautas trabalhistas e de esquerda." },
];

export const radarData: RadarInfluence[] = [
  { axis: "Legislativo", PL: 92, PT: 78, MDB: 68 },
  { axis: "Executivo", PL: 74, PT: 88, MDB: 62 },
  { axis: "Judiciário", PL: 62, PT: 72, MDB: 74 },
  { axis: "Imprensa", PL: 68, PT: 82, MDB: 70 },
  { axis: "Mercado", PL: 88, PT: 52, MDB: 76 },
  { axis: "Social", PL: 56, PT: 94, MDB: 64 },
];
