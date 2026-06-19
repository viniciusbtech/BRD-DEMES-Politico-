export type FilterChoice = {
  value: string;
  label: string;
  status?: string | null;
  photo_url?: string | null;
};

export type FilterCatalog = {
  anos: FilterChoice[];
  eixos: FilterChoice[];
  partidos: FilterChoice[];
  ufs: FilterChoice[];
  deputados: FilterChoice[];
  escolaridade: FilterChoice[];
};

export type QuestionMeta = {
  id: string;
  title: string;
  route?: string;
  description: string;
  chart_type: string;
  supported_filters: string[];
};

export type MetaResponse = {
  dataset_version: string;
  last_updated: string;
  questions: QuestionMeta[];
  available_filters: FilterCatalog;
  question_filters?: Record<string, FilterCatalog>;
};

export type SummaryCard = {
  id: string;
  label: string;
  value: string;
  unit?: string | null;
};

export type ChartSpec = {
  type: string;
  title: string;
  description: string;
  x_field?: string | null;
  y_fields: string[];
  categories: string[];
  series: Array<Record<string, unknown>>;
  options: Record<string, unknown>;
};

export type TableColumn = {
  key: string;
  label: string;
  numeric: boolean;
};

export type TableSpec = {
  title: string;
  columns: TableColumn[];
  rows: Array<Record<string, unknown>>;
  total: number;
  page: number;
  page_size: number;
  sort_by?: string | null;
  sort_dir: "asc" | "desc";
};

export type QuestionPayload = {
  question_id: string;
  title: string;
  description: string;
  filters_supported: string[];
  filters_applied: Record<string, unknown>;
  summary_cards: SummaryCard[];
  chart_spec: ChartSpec;
  table_spec: TableSpec;
  complement_tables: TableSpec[];
  warnings: Array<{ code: string; message: string }>;
  empty_state: { is_empty: boolean; message: string };
  dataset_version: string;
  generated_at: string;
};

export type QuestionFilters = {
  anos?: string[];
  eixos?: string[];
  deputados?: string[];
  search?: string;
};
