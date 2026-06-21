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

export type WorkInsight = {
  source: string;
  title: string;
  value: string;
  description: string;
  conversion: string;
};

export const totalCeap = 1_480_000_000;
export const observedCeap = 838_508_798;

export const socialItems: SocialItem[] = [
  { id: "casas", label: "Casas populares", marker: "CASA", unit: "casas", cost: 150_000, color: "#c41230" },
  { id: "leitos", label: "Leitos de UTI", marker: "UTI", unit: "leitos", cost: 100_000, color: "#d4841a" },
  { id: "salas", label: "Salas de aula", marker: "AULA", unit: "salas", cost: 80_000, color: "#4a7c59" },
  { id: "bolsas", label: "Bolsas universitárias/ano", marker: "BOLSA", unit: "bolsas", cost: 24_000, color: "#2e5fa3" },
  { id: "saneamento", label: "Famílias com saneamento", marker: "ÁGUA", unit: "famílias", cost: 5_000, color: "#7b3fa0" },
  { id: "merenda", label: "Crianças com merenda/ano", marker: "MERENDA", unit: "crianças", cost: 1_500, color: "#c8970a" },
];

export const spendingSliders: SpendingSlider[] = [
  { id: "ceap", label: "CEAP observada nos dados", max: observedCeap, description: "Soma dos reembolsos parlamentares encontrados entre 2023 e 2026." },
  { id: "aereas", label: "Companhias aereas no topo", max: 142_487_845, description: "TAM, GOL e AZUL concentram R$ 142,49 mi entre os maiores fornecedores globais." },
  { id: "divulgacao", label: "Divulgacao parlamentar extrema", max: 1_589_000, description: "Maior registro global por deputado e categoria: divulgacao da atividade parlamentar." },
  { id: "locadoras", label: "Locacao e veiculos", max: 25_000_000, description: "Locadoras e fornecedores automotivos aparecem repetidamente entre os maiores pagamentos." },
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
  { text: "R$ 838.508.798 em CEAP observada.", sub: "5.590 casas populares ou 167.701 familias com saneamento basico." },
  { text: "R$ 142.487.845 nos tres maiores fornecedores aereos.", sub: "1.424 leitos de UTI ou 94.991 criancas com merenda por um ano." },
  { text: "R$ 1.589.000 em um unico recorte de divulgacao parlamentar.", sub: "10 casas populares ou 1.059 criancas com merenda anual." },
  { text: "R$ 2.163.012 no deputado com maior gasto global.", sub: "14 casas populares ou 432 familias com saneamento." },
];

export const workInsights: WorkInsight[] = [
  {
    source: "Q13",
    title: "A CEAP medida no projeto passa de R$ 838 mi",
    value: "R$ 838,5 mi",
    description: "Somando os totais anuais de 2023, 2024, 2025 e 2026, o recorte de despesas parlamentares chega a R$ 838.508.798,47.",
    conversion: "Equivale a 5.590 casas populares de R$ 150 mil ou saneamento para 167.701 familias.",
  },
  {
    source: "Q5",
    title: "Tres companhias aereas dominam fornecedores",
    value: "R$ 142,5 mi",
    description: "TAM, GOL e AZUL aparecem como os tres maiores fornecedores globais da legislatura no ranking de pagamentos.",
    conversion: "So esse trio compraria 1.424 leitos de UTI de R$ 100 mil.",
  },
  {
    source: "Q13",
    title: "Divulgacao parlamentar aparece como gasto sensivel",
    value: "R$ 1,59 mi",
    description: "O maior registro global por deputado e categoria e de divulgacao da atividade parlamentar, com R$ 1.589.000,00.",
    conversion: "Um unico caso desse porte pagaria 1.059 merendas anuais no parametro usado no painel.",
  },
  {
    source: "Q1",
    title: "O maior gasto individual passa de R$ 2 mi",
    value: "R$ 2,16 mi",
    description: "No ranking global de gastos por deputado, Darci Pompeo de Mattos aparece no topo com R$ 2.163.012,40.",
    conversion: "Isso equivale a 14 casas populares ou 432 familias com saneamento basico.",
  },
  {
    source: "Q7",
    title: "Custo-beneficio muda a leitura do gasto",
    value: "10,18 pts / R$ 1 mil",
    description: "No ranking global de custo-beneficio, Gilson Marques aparece no topo da leitura consolidada usada no recorte 01D.",
    conversion: "A comparacao mostra que gastar menos pode entregar mais pontos de atividade por real reembolsado.",
  },
];

export const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
