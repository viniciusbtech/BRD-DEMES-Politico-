export type Supplier = {
  id: number;
  name: string;
  category: string;
  deputies: number;
  total: number;
};

export type MockDeputy = {
  id: number;
  name: string;
  party: string;
  state: string;
  mandate: string;
  img: string;
};

export type DeputySupplierLink = {
  supplierId: number;
  total: number;
  percent: number;
};

export const backgroundImages = [
  { id: "photo-1603796846097-bee99e4a601f", alt: "Assinatura de contrato" },
  { id: "photo-1526304640581-d334cdbbf45e", alt: "Dinheiro e gastos públicos" },
  { id: "photo-1681505531034-8d67054e07f6", alt: "Acordo comercial" },
  { id: "photo-1521791055366-0d553872125f", alt: "Contrato empresarial" },
  { id: "photo-1551135049-8a33b5883817", alt: "Reunião de negócios" },
];

export const suppliers: Supplier[] = [
  { id: 1, name: "Azul Linhas Aéreas", category: "Transporte Aéreo", deputies: 312, total: 48_200_000 },
  { id: 2, name: "LATAM Airlines", category: "Transporte Aéreo", deputies: 287, total: 41_800_000 },
  { id: 3, name: "Gol Linhas Aéreas", category: "Transporte Aéreo", deputies: 261, total: 36_500_000 },
  { id: 4, name: "Correios", category: "Postagem", deputies: 401, total: 8_700_000 },
  { id: 5, name: "Auto Posto Brasília", category: "Combustível", deputies: 198, total: 12_400_000 },
  { id: 6, name: "Hotel Nacional Brasília", category: "Hospedagem", deputies: 176, total: 9_800_000 },
  { id: 7, name: "Restaurant Congresso", category: "Alimentação", deputies: 389, total: 5_400_000 },
  { id: 8, name: "Claro S.A.", category: "Telecom", deputies: 234, total: 7_200_000 },
  { id: 9, name: "Vivo / Telefônica", category: "Telecom", deputies: 218, total: 6_900_000 },
  { id: 10, name: "Locadora Prime Cars", category: "Veículos", deputies: 142, total: 4_800_000 },
];

export const mockDeputies: MockDeputy[] = [
  {
    id: 1,
    name: "Roberto Alves Silva",
    party: "PT",
    state: "SP",
    mandate: "57ª Legislatura · 2023-2027",
    img: "photo-1519085360753-af0119f7cbe7",
  },
  {
    id: 2,
    name: "André Lima Fonseca",
    party: "PSDB",
    state: "MG",
    mandate: "57ª Legislatura · 2023-2027",
    img: "photo-1585846416120-3a7354ed7d39",
  },
  {
    id: 3,
    name: "Carlos Farias",
    party: "PL",
    state: "BA",
    mandate: "57ª Legislatura · 2023-2027",
    img: "photo-1648448942225-7aa06c7e8f79",
  },
  {
    id: 4,
    name: "Marina Costa Prado",
    party: "MDB",
    state: "RS",
    mandate: "57ª Legislatura · 2023-2027",
    img: "photo-1740906010746-72aa48cea181",
  },
];

export const deputySuppliers: Record<number, DeputySupplierLink[]> = {
  1: [
    { supplierId: 1, total: 98_400, percent: 9.1 },
    { supplierId: 2, total: 72_100, percent: 6.7 },
    { supplierId: 8, total: 15_600, percent: 1.4 },
    { supplierId: 5, total: 32_800, percent: 3 },
    { supplierId: 4, total: 18_200, percent: 1.7 },
  ],
  2: [
    { supplierId: 2, total: 142_600, percent: 10.5 },
    { supplierId: 3, total: 89_200, percent: 6.6 },
    { supplierId: 6, total: 54_300, percent: 4 },
    { supplierId: 9, total: 21_400, percent: 1.6 },
    { supplierId: 10, total: 48_700, percent: 3.6 },
  ],
  3: [
    { supplierId: 1, total: 61_200, percent: 8.8 },
    { supplierId: 4, total: 9_800, percent: 1.4 },
    { supplierId: 8, total: 11_200, percent: 1.6 },
    { supplierId: 7, total: 24_600, percent: 3.5 },
    { supplierId: 5, total: 18_400, percent: 2.6 },
  ],
  4: [
    { supplierId: 2, total: 178_400, percent: 11.8 },
    { supplierId: 1, total: 124_600, percent: 8.3 },
    { supplierId: 10, total: 68_200, percent: 4.5 },
    { supplierId: 6, total: 72_400, percent: 4.8 },
    { supplierId: 9, total: 34_800, percent: 2.3 },
  ],
};

export const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

export const unsplashImage = (id: string, width = 800, height = 600) =>
  `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop&auto=format`;
