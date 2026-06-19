import type { MetaResponse, QuestionFilters, QuestionPayload } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function buildQuery(params: Record<string, string | number | string[] | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item.trim()) query.append(key, item);
      });
      return;
    }
    if (String(value).trim()) query.append(key, String(value));
  });

  return query.toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro na API (${response.status})`);
  return response.json() as Promise<T>;
}

export function fetchMeta(): Promise<MetaResponse> {
  return fetchJson<MetaResponse>(`${API_BASE}/api/meta`);
}

export function fetchQuestion(
  questionId: string,
  filters: QuestionFilters,
  table: { page?: number; pageSize?: number; sortBy?: string; sortDir?: "asc" | "desc" } = {},
): Promise<QuestionPayload> {
  const query = buildQuery({
    anos: filters.anos,
    eixos: filters.eixos,
    deputados: filters.deputados,
    search: filters.search,
    page: table.page ?? 1,
    page_size: table.pageSize ?? 100,
    sort_by: table.sortBy,
    sort_dir: table.sortDir ?? "desc",
  });

  return fetchJson<QuestionPayload>(`${API_BASE}/api/questions/${questionId}?${query}`);
}

