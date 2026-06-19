from __future__ import annotations

import csv
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path
from typing import Any

import igraph as ig
import leidenalg


ROOT = Path(__file__).resolve().parents[3]
VOTES_CSV = ROOT / "dados_padronizados" / "votacoes_votos.csv"
OUTPUT_TXT = ROOT / "questoes" / "q8" / "respostas" / "q8_influencia_por_voto_extra.txt"

MIN_VALID_VOTES_PER_DEPUTY = 100
MIN_SHARED_VOTES_PER_PAIR = 100
MIN_COVERAGE = 0.50
MIN_BINARY_VOTES_PER_ROLLCALL = 50
MIN_KAPPA = 0.40
MAX_EDGES_OUTPUT = 3000

VOTE_CODE = {
    "Sim": 1,
    "Nao": -1,
}


def to_int(value: str) -> int:
    return int(str(value).strip())


def fmt_number(value: Any) -> str:
    if isinstance(value, float):
        return f"{value:.4f}"
    return str(value)


def write_psql_table(handle, title: str, rows: list[dict[str, Any]], columns: list[str]) -> None:
    handle.write(f"{title}\n")
    if not rows:
        header = " | ".join(columns)
        handle.write(f"{header}\n")
        handle.write("-+-".join("-" * len(col) for col in columns) + "\n")
        handle.write("(0 rows)\n\n")
        return

    rendered_rows = [[fmt_number(row.get(column, "")) for column in columns] for row in rows]
    widths = [
        max(len(column), *(len(rendered[column_index]) for rendered in rendered_rows))
        for column_index, column in enumerate(columns)
    ]
    handle.write(" | ".join(column.rjust(widths[idx]) for idx, column in enumerate(columns)) + "\n")
    handle.write("-+-".join("-" * width for width in widths) + "\n")
    for rendered in rendered_rows:
        handle.write(" | ".join(rendered[idx].rjust(widths[idx]) for idx in range(len(columns))) + "\n")
    handle.write(f"({len(rows)} rows)\n\n")


def load_votes() -> list[dict[str, str]]:
    with VOTES_CSV.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file, delimiter=";"))


def informative_vote_weights(rows: list[dict[str, str]]) -> dict[tuple[int, str], float]:
    stats: dict[tuple[int, str], Counter[str]] = defaultdict(Counter)
    for row in rows:
        vote = row["voto"]
        if vote not in {"Sim", "Nao"}:
            continue
        stats[(to_int(row["ano_dados"]), row["id_votacao"])][vote] += 1

    weights: dict[tuple[int, str], float] = {}
    for key, counter in stats.items():
        total_binary = counter["Sim"] + counter["Nao"]
        if total_binary < MIN_BINARY_VOTES_PER_ROLLCALL:
            continue
        sim_share = counter["Sim"] / total_binary if total_binary else 0
        weight = 4 * sim_share * (1 - sim_share)
        if weight > 0:
            weights[key] = weight
    return weights


def build_matrix(rows: list[dict[str, str]], vote_weights: dict[tuple[int, str], float]) -> tuple[dict[int, dict[tuple[int, str], int]], dict[int, dict[str, str]]]:
    matrix: dict[int, dict[tuple[int, str], int]] = defaultdict(dict)
    deputies: dict[int, dict[str, str]] = {}

    for row in rows:
        key = (to_int(row["ano_dados"]), row["id_votacao"])
        if key not in vote_weights:
            continue
        vote = row["voto"]
        if vote not in VOTE_CODE:
            continue
        deputy_id = to_int(row["id_deputado"])
        matrix[deputy_id][key] = VOTE_CODE[vote]
        deputies[deputy_id] = {
            "id_deputado": deputy_id,
            "nome": row["nome_deputado"],
            "sigla_partido": row["sigla_partido"],
            "sigla_uf": row["sigla_uf"],
        }

    matrix = {
        deputy_id: votes
        for deputy_id, votes in matrix.items()
        if len(votes) >= MIN_VALID_VOTES_PER_DEPUTY
    }
    deputies = {deputy_id: deputies[deputy_id] for deputy_id in matrix}
    return matrix, deputies


def build_edges(
    matrix: dict[int, dict[tuple[int, str], int]],
    deputies: dict[int, dict[str, str]],
    vote_weights: dict[tuple[int, str], float],
) -> list[dict[str, Any]]:
    vote_to_deputies: dict[tuple[int, str], list[tuple[int, int]]] = defaultdict(list)
    for deputy_id, votes in matrix.items():
        for vote_key, vote_code in votes.items():
            vote_to_deputies[vote_key].append((deputy_id, vote_code))

    pair_stats: dict[tuple[int, int], dict[str, float]] = defaultdict(
        lambda: {
            "shared": 0,
            "same": 0,
            "weighted_total": 0.0,
            "weighted_same": 0.0,
            "a_sim": 0.0,
            "a_nao": 0.0,
            "b_sim": 0.0,
            "b_nao": 0.0,
        }
    )
    for vote_key, values in vote_to_deputies.items():
        weight = vote_weights[vote_key]
        values.sort()
        for (deputy_a, vote_a), (deputy_b, vote_b) in combinations(values, 2):
            stats = pair_stats[(deputy_a, deputy_b)]
            stats["shared"] += 1
            stats["weighted_total"] += weight
            if vote_a == 1:
                stats["a_sim"] += weight
            else:
                stats["a_nao"] += weight
            if vote_b == 1:
                stats["b_sim"] += weight
            else:
                stats["b_nao"] += weight
            if vote_a == vote_b:
                stats["same"] += 1
                stats["weighted_same"] += weight

    edges: list[dict[str, Any]] = []
    valid_counts = {deputy_id: len(votes) for deputy_id, votes in matrix.items()}
    for (deputy_a, deputy_b), stats in pair_stats.items():
        shared = int(stats["shared"])
        if shared < MIN_SHARED_VOTES_PER_PAIR:
            continue
        coverage = shared / min(valid_counts[deputy_a], valid_counts[deputy_b])
        if coverage < MIN_COVERAGE:
            continue
        weighted_total = stats["weighted_total"]
        if weighted_total <= 0:
            continue
        weighted_agreement = stats["weighted_same"] / weighted_total
        p_a_sim = stats["a_sim"] / weighted_total
        p_a_nao = stats["a_nao"] / weighted_total
        p_b_sim = stats["b_sim"] / weighted_total
        p_b_nao = stats["b_nao"] / weighted_total
        expected_agreement = p_a_sim * p_b_sim + p_a_nao * p_b_nao
        if expected_agreement >= 1:
            continue
        kappa = (weighted_agreement - expected_agreement) / (1 - expected_agreement)
        if kappa < MIN_KAPPA:
            continue
        info_a = deputies[deputy_a]
        info_b = deputies[deputy_b]
        edges.append(
            {
                "id_deputado_a": deputy_a,
                "nome_a": info_a["nome"],
                "sigla_partido_a": info_a["sigla_partido"],
                "sigla_uf_a": info_a["sigla_uf"],
                "votacoes_validas_a": valid_counts[deputy_a],
                "id_deputado_b": deputy_b,
                "nome_b": info_b["nome"],
                "sigla_partido_b": info_b["sigla_partido"],
                "sigla_uf_b": info_b["sigla_uf"],
                "votacoes_validas_b": valid_counts[deputy_b],
                "votacoes_em_comum": shared,
                "cobertura": round(coverage, 4),
                "votos_iguais": int(stats["same"]),
                "similaridade": round(weighted_agreement, 4),
                "concordancia_ponderada": round(weighted_agreement, 4),
                "concordancia_esperada": round(expected_agreement, 4),
                "kappa_ponderado": round(kappa, 4),
                "peso": round(kappa, 4),
            }
        )
    edges.sort(key=lambda row: (-row["peso"], -row["votacoes_em_comum"], row["nome_a"], row["nome_b"]))
    return edges


def detect_leiden_communities(deputy_ids: list[int], edges: list[dict[str, Any]]) -> dict[int, int]:
    index_by_id = {deputy_id: idx for idx, deputy_id in enumerate(deputy_ids)}
    graph = ig.Graph()
    graph.add_vertices(len(deputy_ids))
    graph.vs["name"] = [str(deputy_id) for deputy_id in deputy_ids]
    graph.add_edges(
        [(index_by_id[row["id_deputado_a"]], index_by_id[row["id_deputado_b"]]) for row in edges]
    )
    graph.es["weight"] = [row["peso"] for row in edges]

    partition = leidenalg.find_partition(
        graph,
        leidenalg.ModularityVertexPartition,
        weights="weight",
        seed=42,
    )
    communities: dict[int, int] = {}
    for community_index, members in enumerate(partition):
        for vertex_index in members:
            communities[deputy_ids[vertex_index]] = community_index + 1
    return communities


def summarize(
    matrix: dict[int, dict[tuple[int, str], int]],
    deputies: dict[int, dict[str, str]],
    edges: list[dict[str, Any]],
    community_by_deputy: dict[int, int],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    degree: dict[int, dict[str, float]] = defaultdict(lambda: {"qtd_conexoes": 0, "grau_ponderado": 0.0})
    internal_weights: dict[int, list[float]] = defaultdict(list)

    for edge in edges:
        a = edge["id_deputado_a"]
        b = edge["id_deputado_b"]
        weight = edge["peso"]
        degree[a]["qtd_conexoes"] += 1
        degree[a]["grau_ponderado"] += weight
        degree[b]["qtd_conexoes"] += 1
        degree[b]["grau_ponderado"] += weight
        if community_by_deputy[a] == community_by_deputy[b]:
            internal_weights[community_by_deputy[a]].append(weight)

    deputy_rows: list[dict[str, Any]] = []
    for deputy_id, info in deputies.items():
        community = community_by_deputy[deputy_id]
        deputy_rows.append(
            {
                "comunidade": community,
                "id_deputado": deputy_id,
                "nome": info["nome"],
                "sigla_partido": info["sigla_partido"],
                "sigla_uf": info["sigla_uf"],
                "votacoes_validas": len(matrix[deputy_id]),
                "qtd_conexoes": int(degree[deputy_id]["qtd_conexoes"]),
                "grau_ponderado": round(degree[deputy_id]["grau_ponderado"], 4),
            }
        )

    grouped: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for row in deputy_rows:
        grouped[row["comunidade"]].append(row)

    community_rows: list[dict[str, Any]] = []
    for community, members in grouped.items():
        parties = sorted({row["sigla_partido"] for row in members})
        names = ", ".join(row["nome"] for row in sorted(members, key=lambda item: item["nome"]))
        internal = internal_weights.get(community, [])
        community_rows.append(
            {
                "comunidade": community,
                "qtd_deputados": len(members),
                "kappa_medio_interno": round(sum(internal) / len(internal), 4) if internal else 0.0,
                "similaridade_media_interna": round(sum(internal) / len(internal), 4) if internal else 0.0,
                "grau_ponderado_medio": round(sum(row["grau_ponderado"] for row in members) / len(members), 4),
                "media_votacoes_validas": round(sum(row["votacoes_validas"] for row in members) / len(members), 2),
                "partidos_presentes": ", ".join(parties),
                "deputados_exemplo": names[:250],
            }
        )

    community_rows.sort(key=lambda row: (-row["qtd_deputados"], -row["similaridade_media_interna"], row["comunidade"]))
    deputy_rows.sort(key=lambda row: (row["comunidade"], -row["grau_ponderado"], row["nome"]))
    return community_rows, deputy_rows


def main() -> None:
    rows = load_votes()
    vote_weights = informative_vote_weights(rows)
    matrix, deputies = build_matrix(rows, vote_weights)
    edges = build_edges(matrix, deputies, vote_weights)
    deputy_ids = sorted(matrix)
    community_by_deputy = detect_leiden_communities(deputy_ids, edges)
    community_rows, deputy_rows = summarize(matrix, deputies, edges, community_by_deputy)

    with OUTPUT_TXT.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("Q8 complementar - comunidades por similaridade de votos individuais\n")
        handle.write("Pipeline: votos individuais -> matriz deputado x votacao -> Kappa ponderado entre pares -> grafo ponderado -> Leiden.\n")
        handle.write("Codificacao: somente Sim = 1 e Nao = -1; Abstencao, Obstrucao, ausencia e Artigo 17 foram ignorados nesta rede.\n")
        handle.write(
            "Filtros: deputado >= 100 votos validos; par >= 100 votacoes em comum; "
            "cobertura >= 0.50; votacoes ponderadas por 4*p*(1-p), onde p e a proporcao de Sim; "
            "Kappa de Cohen ponderado >= 0.40.\n"
        )
        handle.write("Comunidades detectadas por Leiden, usando Kappa ponderado como peso no grafo.\n\n")

        write_psql_table(
            handle,
            "Resumo executivo",
            [
                {
                    "deputados_com_votos_validos": len(deputies),
                    "votacoes_informativas": len(vote_weights),
                    "votacoes_na_matriz": len({key for votes in matrix.values() for key in votes}),
                    "votos_validos_codificados": sum(len(votes) for votes in matrix.values()),
                    "pares_comparaveis": "calculado_com_filtros_100_e_cobertura",
                    "arestas_grafo": len(edges),
                    "comunidades_detectadas": len(community_rows),
                    "minimo_votos_validos_deputado": MIN_VALID_VOTES_PER_DEPUTY,
                    "minimo_votacoes_comuns": MIN_SHARED_VOTES_PER_PAIR,
                    "cobertura_minima": MIN_COVERAGE,
                    "peso_votacao": "4*p*(1-p)",
                    "limiar_kappa": MIN_KAPPA,
                    "algoritmo_comunidades": "Leiden",
                }
            ],
            [
                "deputados_com_votos_validos",
                "votacoes_informativas",
                "votacoes_na_matriz",
                "votos_validos_codificados",
                "pares_comparaveis",
                "arestas_grafo",
                "comunidades_detectadas",
                "minimo_votos_validos_deputado",
                "minimo_votacoes_comuns",
                "cobertura_minima",
                "peso_votacao",
                "limiar_kappa",
                "algoritmo_comunidades",
            ],
        )
        write_psql_table(
            handle,
            "Tabela principal - comunidades de comportamento de voto",
            community_rows,
            [
                "comunidade",
                "qtd_deputados",
                "kappa_medio_interno",
                "similaridade_media_interna",
                "grau_ponderado_medio",
                "media_votacoes_validas",
                "partidos_presentes",
                "deputados_exemplo",
            ],
        )
        write_psql_table(
            handle,
            "Tabela extra - deputados por comunidade",
            deputy_rows,
            [
                "comunidade",
                "id_deputado",
                "nome",
                "sigla_partido",
                "sigla_uf",
                "votacoes_validas",
                "qtd_conexoes",
                "grau_ponderado",
            ],
        )
        write_psql_table(
            handle,
            "Tabela extra - arestas do grafo ponderado",
            edges[:MAX_EDGES_OUTPUT],
            [
                "id_deputado_a",
                "nome_a",
                "sigla_partido_a",
                "sigla_uf_a",
                "votacoes_validas_a",
                "id_deputado_b",
                "nome_b",
                "sigla_partido_b",
                "sigla_uf_b",
                "votacoes_validas_b",
                "votacoes_em_comum",
                "cobertura",
                "votos_iguais",
                "similaridade",
                "concordancia_ponderada",
                "concordancia_esperada",
                "kappa_ponderado",
                "peso",
            ],
        )


if __name__ == "__main__":
    main()
