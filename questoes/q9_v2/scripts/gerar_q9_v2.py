from __future__ import annotations

import csv
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable


REPO = Path(__file__).resolve().parents[3]
DADOS = REPO / "dados_padronizados"
OUT = REPO / "questoes" / "q9_v2" / "respostas"
MIN_VOTOS_DEPUTADO = 20
MIN_VOTOS_VOTACAO = 50


def clean(value: object) -> str:
    return str(value or "").replace("|", "/").strip()


def read_csv(name: str) -> list[dict[str, str]]:
    with (DADOS / name).open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle, delimiter=";"))


def pct(part: int, total: int) -> str:
    if total <= 0:
        return "0.0"
    return f"{(part * 100.0 / total):.1f}"


def emit_table(handle, title: str, columns: list[str], rows: Iterable[Iterable[object]]) -> None:
    rows = [[clean(value) for value in row] for row in rows]
    widths = [len(col) for col in columns]
    for row in rows:
        for idx, value in enumerate(row):
            widths[idx] = max(widths[idx], len(value))

    handle.write(f"{title}\n")
    handle.write(" | ".join(columns[idx].ljust(widths[idx]) for idx in range(len(columns))) + "\n")
    handle.write("-+-".join("-" * width for width in widths) + "\n")
    for row in rows:
        handle.write(" | ".join(row[idx].ljust(widths[idx]) for idx in range(len(columns))) + "\n")
    handle.write(f"({len(rows)} rows)\n\n")


def load_titles() -> dict[tuple[str, str], str]:
    titles: dict[tuple[str, str], str] = {}
    for row in read_csv("votacoes_objetos.csv"):
        key = (clean(row.get("ano_dados")), clean(row.get("id_votacao")))
        titles.setdefault(key, clean(row.get("titulo_proposicao")) or "(sem proposicao vinculada)")
    return titles


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ideologia = {
        clean(row.get("sigla_partido")): clean(row.get("ideologia")) or "nao classificado"
        for row in read_csv("partidos_ideologia.csv")
    }
    titles = load_titles()
    votos = read_csv("votacoes_votos.csv")

    party_deps: dict[str, set[str]] = defaultdict(set)
    party_votes: Counter[str] = Counter()
    correlacao: dict[tuple[str, str, str], Counter[str]] = defaultdict(Counter)
    votos_por_votacao: Counter[tuple[str, str]] = Counter()
    votos_resumo: dict[tuple[str, str], Counter[str]] = defaultdict(Counter)
    votos_detalhe: list[list[object]] = []

    for row in votos:
        ano = clean(row.get("ano_dados"))
        votacao = clean(row.get("id_votacao"))
        partido = clean(row.get("sigla_partido"))
        voto = clean(row.get("voto"))
        if not ano or not votacao or not partido:
            continue

        party_deps[partido].add(clean(row.get("id_deputado")))
        party_votes[partido] += 1
        correlacao[(ano, votacao, partido)][voto] += 1
        votos_por_votacao[(ano, votacao)] += 1
        votos_resumo[(ano, votacao)][voto] += 1
        votos_detalhe.append([
            ano,
            votacao,
            titles.get((ano, votacao), "(sem proposicao vinculada)"),
            clean(row.get("id_deputado")),
            clean(row.get("nome_deputado")),
            partido,
            ideologia.get(partido, "nao classificado"),
            clean(row.get("sigla_uf")),
            voto,
        ])

    partidos_rows = [
        [partido, ideologia.get(partido, "nao classificado"), len(party_deps.get(partido, set())), party_votes.get(partido, 0)]
        for partido in sorted(ideologia, key=lambda p: ({"esquerda": 1, "centro": 2, "direita": 3}.get(ideologia.get(p, ""), 4), p))
    ]

    correlacao_rows = []
    for (ano, votacao, partido), counter in correlacao.items():
        sim = counter.get("Sim", 0)
        nao = counter.get("Nao", 0)
        abstencao = counter.get("Abstencao", 0)
        obstrucao = counter.get("Obstrucao", 0)
        outros = sum(counter.values()) - sim - nao - abstencao - obstrucao
        total = sum(counter.values())
        if total < 1:
            continue
        correlacao_rows.append([
            ano,
            votacao,
            titles.get((ano, votacao), "(sem proposicao vinculada)"),
            partido,
            ideologia.get(partido, "nao classificado"),
            sim,
            nao,
            abstencao,
            obstrucao,
            outros,
            total,
            pct(sim, total),
        ])
    correlacao_rows.sort(key=lambda row: (str(row[0]), str(row[1]), str(row[3])), reverse=True)

    votacoes_rows = []
    for (ano, votacao), total in votos_por_votacao.items():
        if total >= MIN_VOTOS_VOTACAO:
            counts = votos_resumo[(ano, votacao)]
            votacoes_rows.append([
                ano,
                votacao,
                titles.get((ano, votacao), "(sem proposicao vinculada)"),
                counts.get("Sim", 0),
                counts.get("Nao", 0),
                total - counts.get("Sim", 0) - counts.get("Nao", 0),
                total,
            ])
    votacoes_rows.sort(key=lambda row: (str(row[0]), int(row[6]), str(row[1])), reverse=True)

    bloco_majoritario: dict[tuple[str, str, str], str] = {}
    bloco_counts: dict[tuple[str, str, str], Counter[str]] = defaultdict(Counter)
    for row in votos:
        voto = clean(row.get("voto"))
        if voto not in {"Sim", "Nao"}:
            continue
        partido = clean(row.get("sigla_partido"))
        campo = ideologia.get(partido)
        if campo not in {"esquerda", "centro", "direita"}:
            continue
        key = (clean(row.get("ano_dados")), clean(row.get("id_votacao")), campo)
        bloco_counts[key][voto] += 1
    for key, counter in bloco_counts.items():
        bloco_majoritario[key] = "Sim" if counter.get("Sim", 0) >= counter.get("Nao", 0) else "Nao"

    dep_acc: dict[tuple[str, str, str, str], Counter[str]] = defaultdict(Counter)
    for row in votos:
        voto = clean(row.get("voto"))
        if voto not in {"Sim", "Nao"}:
            continue
        ano = clean(row.get("ano_dados"))
        votacao = clean(row.get("id_votacao"))
        partido = clean(row.get("sigla_partido"))
        key = (
            clean(row.get("id_deputado")),
            clean(row.get("nome_deputado")),
            partido,
            ideologia.get(partido, "nao classificado"),
        )
        dep_acc[key]["votos_validos"] += 1
        for campo in ("esquerda", "centro", "direita"):
            if bloco_majoritario.get((ano, votacao, campo)) == voto:
                dep_acc[key][campo] += 1

    deputados_rows = []
    for (dep_id, nome, partido, ideo_partido), counter in dep_acc.items():
        total = counter["votos_validos"]
        ae = float(pct(counter["esquerda"], total))
        ac = float(pct(counter["centro"], total))
        ad = float(pct(counter["direita"], total))
        if total < MIN_VOTOS_DEPUTADO:
            vies = "amostra insuficiente"
        elif ae >= ac and ae >= ad:
            vies = "esquerda"
        elif ad >= ae and ad >= ac:
            vies = "direita"
        else:
            vies = "centro"
        deputados_rows.append([dep_id, nome, partido, ideo_partido, total, f"{ae:.1f}", f"{ac:.1f}", f"{ad:.1f}", vies])
    deputados_rows.sort(key=lambda row: (-int(row[4]), str(row[1])))
    votos_detalhe.sort(key=lambda row: (str(row[0]), str(row[1]), str(row[5]), str(row[4])), reverse=True)

    # ── Q9 VIES FINAL ─────────────────────────────────────────────────────────
    # Lookup UF por deputado (última ocorrência — estável por mandato)
    dep_uf: dict[str, str] = {}
    for row in votos:
        dep_id = clean(row.get("id_deputado"))
        uf = clean(row.get("sigla_uf"))
        if dep_id and uf:
            dep_uf[dep_id] = uf

    # Passo 1: pct_sim de esquerda e direita para cada votacao
    por_votacao_campo: dict[tuple[str, str], dict[str, Counter[str]]] = defaultdict(lambda: defaultdict(Counter))
    for row in votos:
        voto = clean(row.get("voto"))
        if voto not in {"Sim", "Nao"}:
            continue
        partido = clean(row.get("sigla_partido"))
        campo = ideologia.get(partido)
        if campo not in {"esquerda", "direita"}:
            continue
        ano = clean(row.get("ano_dados"))
        votacao = clean(row.get("id_votacao"))
        por_votacao_campo[(ano, votacao)][campo][voto] += 1

    # Passo 2: votacoes polarizadas (|pct_esq - pct_dir| >= 30pp)
    votacoes_polarizadas: dict[tuple[str, str], tuple[float, float]] = {}
    for (ano, votacao), campos in por_votacao_campo.items():
        esq = campos.get("esquerda", Counter())
        dir_ = campos.get("direita", Counter())
        esq_total = esq.get("Sim", 0) + esq.get("Nao", 0)
        dir_total = dir_.get("Sim", 0) + dir_.get("Nao", 0)
        if esq_total == 0 or dir_total == 0:
            continue
        pct_esq = esq.get("Sim", 0) * 100.0 / esq_total
        pct_dir = dir_.get("Sim", 0) * 100.0 / dir_total
        if abs(pct_esq - pct_dir) >= 30:
            votacoes_polarizadas[(ano, votacao)] = (pct_esq, pct_dir)

    # Passo 3: classificar cada voto nas polarizadas
    dep_vies_acc: dict[tuple[str, str, str, str], Counter[str]] = defaultdict(Counter)
    for row in votos:
        voto = clean(row.get("voto"))
        if voto not in {"Sim", "Nao"}:
            continue
        ano = clean(row.get("ano_dados"))
        votacao = clean(row.get("id_votacao"))
        if (ano, votacao) not in votacoes_polarizadas:
            continue
        pct_esq, pct_dir = votacoes_polarizadas[(ano, votacao)]
        partido = clean(row.get("sigla_partido"))
        ideo_partido = ideologia.get(partido, "nao classificado")
        key = (clean(row.get("id_deputado")), clean(row.get("nome_deputado")), partido, ideo_partido)
        if pct_esq > pct_dir:
            dep_vies_acc[key]["com_esquerda" if voto == "Sim" else "com_direita"] += 1
        else:
            dep_vies_acc[key]["com_direita" if voto == "Sim" else "com_esquerda"] += 1
        dep_vies_acc[key]["total"] += 1

    # Passo 4+5: score + fallback por partido
    MIN_POLARIZADAS = 10
    vies_final_rows = []
    for (dep_id, nome, partido, ideo_partido), counter in dep_vies_acc.items():
        total = counter["total"]
        com_esq = counter["com_esquerda"]
        com_dir = counter["com_direita"]
        pct_com_esq = com_esq * 100.0 / total if total > 0 else 0.0
        pct_com_dir = com_dir * 100.0 / total if total > 0 else 0.0
        score = pct_com_dir  # 0 = esquerda pura, 100 = direita pura
        if total >= MIN_POLARIZADAS:
            if score >= 60:
                vies = "direita"
            elif pct_com_esq >= 60:
                vies = "esquerda"
            else:
                vies = "centro"
            metodo = "comportamento"
        else:
            vies = ideo_partido
            metodo = "partido"
        vies_final_rows.append([
            dep_id, nome, partido, ideo_partido,
            dep_uf.get(dep_id, ""),
            str(total), str(com_esq), str(com_dir),
            f"{pct_com_esq:.1f}", f"{pct_com_dir:.1f}",
            f"{score:.1f}",
            vies, metodo,
        ])
    vies_final_rows.sort(key=lambda r: (float(r[9]), str(r[1])))

    # ── Q9.1 CLASSIFICACAO DUPLA ───────────────────────────────────────────────
    # Calcula o score medio por partido usando apenas deputados com metodo='comportamento'
    party_score_sum: dict[str, float] = defaultdict(float)
    party_score_n: dict[str, int] = defaultdict(int)
    for r in vies_final_rows:
        # r = [dep_id, nome, partido, ideo_partido, uf, total, com_esq, com_dir, pct_esq, pct_dir, score, vies, metodo]
        if r[12] == "comportamento":
            party_score_sum[r[2]] += float(r[10])
            party_score_n[r[2]] += 1

    def _ideo_comp(avg: float) -> str:
        if avg <= 40:
            return "esquerda"
        if avg >= 60:
            return "direita"
        return "centro"

    q9_1_rows = []
    for partido in sorted(
        ideologia,
        key=lambda p: ({"esquerda": 1, "centro": 2, "direita": 3}.get(ideologia.get(p, ""), 4), p),
    ):
        ideo_decl = ideologia.get(partido, "nao classificado")
        n = party_score_n.get(partido, 0)
        if n > 0:
            avg = party_score_sum[partido] / n
            ideo_comp = _ideo_comp(avg)
            score_med = f"{avg:.1f}"
        else:
            ideo_comp = "sem dados"
            score_med = "-"
        dissidente = "SIM" if ideo_comp != "sem dados" and ideo_comp != ideo_decl else "-"
        q9_1_rows.append([
            partido,
            ideo_decl,
            ideo_comp,
            score_med,
            dissidente,
            str(len(party_deps.get(partido, set()))),
            str(party_votes.get(partido, 0)),
        ])
    # ──────────────────────────────────────────────────────────────────────────

    with (OUT / "q9_v2_partidos.txt").open("w", encoding="utf-8", newline="") as fh:
        fh.write("Q9 v2.1 - Classificacao dos partidos\n\n")
        emit_table(fh, "Q9 v2.1 - Partidos por ideologia", ["sigla_partido", "ideologia", "deputados_com_voto", "votos_registrados"], partidos_rows)

    with (OUT / "q9_v2_correlacao.txt").open("w", encoding="utf-8", newline="") as fh:
        fh.write("Q9 v2.2 - Correlacao partido x proposta\n\n")
        emit_table(fh, "Q9 v2.2 - Partido x proposta", ["ano", "id_votacao", "proposicao", "partido", "ideologia", "sim", "nao", "abstencao", "obstrucao", "outros", "total", "pct_sim"], correlacao_rows)

    with (OUT / "q9_v2_votacoes.txt").open("w", encoding="utf-8", newline="") as fh:
        fh.write("Q9 v2.3 - Lista de propostas/votacoes\n\n")
        emit_table(fh, "Q9 v2.3 - Propostas disponiveis", ["ano", "id_votacao", "proposicao", "sim", "nao", "outros", "total"], votacoes_rows)

    with (OUT / "q9_v2_votos.txt").open("w", encoding="utf-8", newline="") as fh:
        fh.write("Q9 v2.3 - Voto de cada deputado por proposta\n\n")
        emit_table(fh, "Q9 v2.3 - Votos por deputado e proposta", ["ano", "id_votacao", "proposicao", "id_deputado", "nome", "partido", "ideologia_partido", "sigla_uf", "voto"], votos_detalhe)

    with (OUT / "q9_v2_deputados.txt").open("w", encoding="utf-8", newline="") as fh:
        fh.write("Q9 v2.4 - Tendencia de voto observada do deputado\n\n")
        emit_table(fh, "Q9 v2.4 - Vies estimado por deputado", ["id_deputado", "nome", "partido", "ideologia_partido", "votos_validos", "alinhamento_esquerda", "alinhamento_centro", "alinhamento_direita", "vies_estimado"], deputados_rows)

    with (OUT / "q9_vies_final.txt").open("w", encoding="utf-8", newline="") as fh:
        fh.write("Q9 Vies Final - Score ideologico por votos divisivos\n\n")
        emit_table(
            fh,
            "Q9 Vies Final - Score por votos divisivos",
            ["id_deputado", "nome", "partido", "ideologia_partido", "sigla_uf", "votos_em_polarizadas", "votos_com_esquerda", "votos_com_direita", "pct_com_esquerda", "pct_com_direita", "score_vies", "vies_final", "metodo"],
            vies_final_rows,
        )

    with (OUT / "q9_1_classificar_partidos.txt").open("w", encoding="utf-8", newline="") as fh:
        fh.write("Q9.1 - Classificacao dupla dos partidos: declarada + comportamental\n\n")
        emit_table(
            fh,
            "Q9.1 - Classificacao dupla: declarada vs comportamental",
            ["sigla_partido", "ideologia_declarada", "ideologia_comportamental", "score_medio", "dissidente", "deputados_com_voto", "votos_registrados"],
            q9_1_rows,
        )

    print(f"partidos: {len(partidos_rows)}")
    print(f"correlacao: {len(correlacao_rows)}")
    print(f"votacoes: {len(votacoes_rows)}")
    print(f"votos: {len(votos_detalhe)}")
    print(f"deputados: {len(deputados_rows)}")
    print(f"votacoes_polarizadas: {len(votacoes_polarizadas)}")
    print(f"vies_final: {len(vies_final_rows)}")
    print(f"q9_1_classificar_partidos: {len(q9_1_rows)} partidos, {sum(1 for r in q9_1_rows if r[4] == 'SIM')} dissidentes")


if __name__ == "__main__":
    main()
