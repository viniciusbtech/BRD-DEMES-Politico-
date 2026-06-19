export type SocialItem = {
  id: string;
  label: string;
  marker: string;
  unit: string;
  cost: number;
  color: string;
};

export type SpendingSlider = {
  id: string;
  label: string;
  max: number;
  description: string;
};

export type OpportunityCost = {
  saving: number;
  headline: string;
  description: string;
};

export type SocialProgram = {
  label: string;
  base: number;
  currencyPrefix?: boolean;
};

export type ManifestLine = {
  text: string;
  sub: string;
};

export const totalCeap = 1_480_000_000;

export const socialItems: SocialItem[] = [
  { id: "casas", label: "Casas populares", marker: "CASA", unit: "casas", cost: 150_000, color: "#c41230" },
  { id: "leitos", label: "Leitos de UTI", marker: "UTI", unit: "leitos", cost: 100_000, color: "#d4841a" },
  { id: "salas", label: "Salas de aula", marker: "AULA", unit: "salas", cost: 80_000, color: "#4a7c59" },
  { id: "bolsas", label: "Bolsas universitárias/ano", marker: "BOLSA", unit: "bolsas", cost: 24_000, color: "#2e5fa3" },
  { id: "saneamento", label: "Famílias com saneamento", marker: "ÁGUA", unit: "famílias", cost: 5_000, color: "#7b3fa0" },
  { id: "merenda", label: "Crianças com merenda/ano", marker: "MERENDA", unit: "crianças", cost: 1_500, color: "#c8970a" },
];

export const spendingSliders: SpendingSlider[] = [
  { id: "ceap", label: "Cota Parlamentar (CEAP)", max: 1_480_000_000, description: "Gasto total com reembolso de atividades parlamentares." },
  { id: "gabinete", label: "Salários de Assessores", max: 890_000_000, description: "Custo anual estimado com equipes de gabinete." },
  { id: "divulgacao", label: "Divulgação de Atividade Parlamentar", max: 370_000_000, description: "Verba para publicidade e propaganda de mandatos." },
  { id: "viagens", label: "Viagens e Missões Internacionais", max: 230_000_000, description: "Passagens e diárias em agendas oficiais." },
];

export const opportunityCosts: OpportunityCost[] = [
  {
    saving: 25,
    headline: "Com 25% de economia...",
    description: "R$ 370 milhões livres: daria para construir 2.467 casas, abrir 3.700 leitos de UTI ou garantir merenda para 246 mil crianças.",
  },
  {
    saving: 50,
    headline: "Com 50% de economia...",
    description: "R$ 740 milhões livres: equivale a 4.933 casas populares, 30.833 bolsas universitárias ou saneamento para 148 mil famílias.",
  },
  {
    saving: 75,
    headline: "Com 75% de economia...",
    description: "R$ 1,11 bilhão livres: 7.400 casas, 46.250 bolsas universitárias ou saneamento para 222 mil famílias.",
  },
  {
    saving: 100,
    headline: "Com o valor total da CEAP...",
    description: "R$ 1,48 bilhão: 9.867 casas populares, 14.800 leitos de UTI, 18.500 salas de aula ou merenda para 986 mil crianças.",
  },
];

export const socialPrograms: SocialProgram[] = [
  { label: "Verba para universidades públicas", base: 49_000_000_000 },
  { label: "Salário mínimo nacional", base: 1_412, currencyPrefix: true },
  { label: "Programa Bolsa Família", base: 168_000_000_000 },
  { label: "Investimento em saneamento", base: 12_000_000_000 },
  { label: "Merenda escolar (PNAE)", base: 8_000_000_000 },
];

export const manifestLines: ManifestLine[] = [
  { text: "R$ 1.480.000.000 gastos.", sub: "9.867 casas que não foram construídas." },
  { text: "R$ 890.000.000 em assessores.", sub: "37.083 bolsas universitárias extintas." },
  { text: "R$ 370.000.000 em divulgação.", sub: "246.666 crianças sem merenda." },
  { text: "R$ 230.000.000 em viagens.", sub: "46.000 famílias sem saneamento." },
];

export const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
