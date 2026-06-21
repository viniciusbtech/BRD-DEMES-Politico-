#!/usr/bin/env python3
"""Gera questoes/q9/respostas/q9_vies_deputado.txt a partir de dados_padronizados/.

Reproduz, em formato psql (lido pelo parser do backend), os blocos:
  Q9.1  catalogo + lista partidos x ideologia
  Q9.2  correlacao ideologia x proposicao (pct Sim por campo)
  Q9.2  resumo partido x proposta (agregado por partido)
  Q9.2b correlacao partido x proposta (voto e orientacao, granular)
  Q9.3  resumo consolidado de votos e aderencia por deputado
  Q9.4  votacoes polarizadas (divergencia esquerda vs direita >= 30pp)
  Q9.5  score vies ideologico individual dos deputados

Idempotente: regenera o arquivo inteiro. Le apenas dados_padronizados (read-only).
"""
from __future__ import annotations

import csv
import math
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
DADOS = REPO / "dados_padronizados"
OUT = REPO / "questoes" / "q9" / "respostas" / "q9_vies_deputado.txt"

POLARIZACAO_MIN = 30.0      # divergencia minima esquerda x direita (pp)
MIN_VOTOS_POLARIZADAS = 10  # minimo de votos classificados para entrar no score
MIN_VOTOS_VOTACAO = 50      # minimo de Sim/Nao para a votacao entrar na lista de plenario
OUT_VOTOS = REPO / "questoes" / "q9" / "respostas" / "q9_votos_por_votacao.txt"


def round1(value: float) -> float:
    return math.floor(value * 10 + 0.5) / 10


def clean(text: str) -> str:
    return (text or "").strip().replace("|", "/").replace("\n", " ").replace("\r", " ")


def load_ideologia() -> dict[str, str]:
    out: dict[str, str] = {}
    with open(DADOS / "partidos_ideologia.csv", encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter=";")
        next(reader, None)
        for row in reader:
            if len(row) >= 2 and row[0].strip():
                out[row[0].strip()] = row[1].strip()
    return out


def load_titulos() -> dict[tuple[str, str], str]:
    out: dict[tuple[str, str], str] = {}
    with open(DADOS / "votacoes_objetos.csv", encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter=";")
        next(reader, None)
        for row in reader:
            if len(row) < 5:
                continue
            key = (row[0].strip(), row[1].strip())
            if key not in out:
                out[key] = clean(row[4]) or "(sem proposicao vinculada)"
    return out


def load_orientacoes() -> dict[tuple[str, str, str], str]:
    out: dict[tuple[str, str, str], str] = {}
    with open(DADOS / "votacoes_orientacoes.csv", encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter=";")
        next(reader, None)
        for row in reader:
            if len(row) < 4:
                continue
            out[(row[0].strip(), row[1].strip(), row[2].strip())] = row[3].strip()
    return out


def emit(fh, title: str, columns: list[str], rows: list[list]) -> None:
    fh.write("\n")
    fh.write(title + "\n")
    fh.write(" | ".join(columns) + "\n")
    fh.write("+".join("-" * max(3, len(col)) for col in columns) + "\n")
    for row in rows:
        fh.write(" | ".join("" if value is None else str(value) for value in row) + "\n")
    fh.write(f"({len(rows)} rows)\n")


def main() -> None:
    ideologia = load_ideologia()
    titulos = load_titulos()
    orientacoes = load_orientacoes()

    titulo = lambda ano, vid: titulos.get((ano, vid), "(sem proposicao vinculada)")

    # acumuladores (pass 1)
    campo: dict[tuple[str, str, str], list[int]] = defaultdict(lambda: [0, 0, 0, 0])   # sim,nao,outros,total
    partido_vot: dict[tuple[str, str, str], list[int]] = defaultdict(lambda: [0, 0, 0])  # sim,nao,total
    dep: dict[tuple, dict[str, int]] = {}

    votos_path = DADOS / "votacoes_votos.csv"
    with open(votos_path, encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter=";")
        next(reader, None)
        for row in reader:
            if len(row) < 6:
                continue
            ano, vid, id_dep, voto, nome, partido = (row[0].strip(), row[1].strip(), row[2].strip(),
                                                     row[3].strip(), row[4].strip(), row[5].strip())
            if voto == "voto" or not partido:
                continue
            ideo = ideologia.get(partido)
            if ideo is None:
                continue  # JOIN partidos_ideologia

            c = campo[(ano, vid, ideo)]
            p = partido_vot[(ano, vid, partido)]
            if voto == "Sim":
                c[0] += 1; p[0] += 1
            elif voto == "Nao":
                c[1] += 1; p[1] += 1
            else:
                c[2] += 1
            c[3] += 1; p[2] += 1

            dkey = (partido, id_dep, nome, ideo)
            d = dep.get(dkey)
            if d is None:
                d = {"total": 0, "sim": 0, "nao": 0, "outros": 0, "seguiu": 0, "contrariou": 0}
                dep[dkey] = d
            d["total"] += 1
            if voto == "Sim":
                d["sim"] += 1
            elif voto == "Nao":
                d["nao"] += 1
            else:
                d["outros"] += 1
            orient = orientacoes.get((ano, vid, partido))
            if orient is not None and orient not in ("Liberado", "Abstencao", "Obstrucao"):
                if voto == orient:
                    d["seguiu"] += 1
                else:
                    d["contrariou"] += 1

    # pct Sim binario por campo e deteccao de votacoes polarizadas
    votacoes = sorted({(a, v) for (a, v, _i) in campo})
    pct_campo: dict[tuple[str, str], dict[str, float]] = defaultdict(dict)
    binario_campo: dict[tuple[str, str], dict[str, int]] = defaultdict(dict)
    for (ano, vid, ideo), (sim, nao, _o, _t) in campo.items():
        binario = sim + nao
        binario_campo[(ano, vid)][ideo] = binario
        if binario > 0:
            pct_campo[(ano, vid)][ideo] = round1(sim * 100.0 / binario)

    polarizadas: dict[tuple[str, str], tuple[float, float]] = {}
    q94_rows: list[list] = []
    for (ano, vid) in votacoes:
        pcts = pct_campo[(ano, vid)]
        if "esquerda" not in pcts or "direita" not in pcts:
            continue
        pe, pd = pcts["esquerda"], pcts["direita"]
        pc = pcts.get("centro")
        div = round1(abs(pe - pd))
        if div < POLARIZACAO_MIN:
            continue
        polarizadas[(ano, vid)] = (pe, pd)
        total = sum(binario_campo[(ano, vid)].get(k, 0) for k in ("esquerda", "centro", "direita"))
        campo_fav = "esquerda favoravel" if pe > pd else "direita favoravel"
        q94_rows.append([ano, vid, titulo(ano, vid), pe, ("" if pc is None else pc), pd, total, div, campo_fav])

    q94_rows.sort(key=lambda r: (-float(r[7]), r[0], r[1]))

    # pass 2 — score de vies individual + voto-a-voto (apenas votacoes polarizadas)
    # O voto-a-voto e limitado as N votacoes mais polarizadas de cada deputado
    # (maior divergencia esq x dir) para manter o arquivo/payload enxutos.
    CAP_VOTOS_POR_DEPUTADO = 50
    vies: dict[tuple, list[int]] = defaultdict(lambda: [0, 0])  # com_esq, com_dir
    q93voto_por_dep: dict[str, list] = defaultdict(list)
    with open(votos_path, encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter=";")
        next(reader, None)
        for row in reader:
            if len(row) < 6:
                continue
            ano, vid, id_dep, voto, nome, partido = (row[0].strip(), row[1].strip(), row[2].strip(),
                                                     row[3].strip(), row[4].strip(), row[5].strip())
            if voto not in ("Sim", "Nao") or not partido:
                continue
            pol = polarizadas.get((ano, vid))
            if pol is None:
                continue
            ideo = ideologia.get(partido)
            if ideo is None:
                continue
            pe, pd = pol
            if pe > pd:
                lado = "esquerda" if voto == "Sim" else "direita"
            elif pd > pe:
                lado = "direita" if voto == "Sim" else "esquerda"
            else:
                continue
            acc = vies[(partido, id_dep, nome, ideo)]
            if lado == "esquerda":
                acc[0] += 1
            else:
                acc[1] += 1
            campo_fav = "esquerda favoravel" if pe > pd else "direita favoravel"
            q93voto_por_dep[id_dep].append((abs(pe - pd),
                                            [id_dep, nome, partido, ideo, ano, vid,
                                             titulo(ano, vid), voto, campo_fav, lado]))

    q93voto_rows: list[list] = []
    for items in q93voto_por_dep.values():
        items.sort(key=lambda x: -x[0])
        q93voto_rows.extend(row for _div, row in items[:CAP_VOTOS_POR_DEPUTADO])
    q93voto_rows.sort(key=lambda r: (str(r[0]), r[4], r[5]))

    # ---- Q9.6: voto de cada deputado por votacao (todos os deputados) ----
    # Pass V1: conta votos por votacao (sem filtro de ideologia/partido)
    vcount: dict[tuple[str, str], list[int]] = defaultdict(lambda: [0, 0, 0, 0])  # total, sim, nao, outros
    with open(votos_path, encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter=";")
        next(reader, None)
        for row in reader:
            if len(row) < 4:
                continue
            ano, vid, voto = row[0].strip(), row[1].strip(), row[3].strip()
            if voto == "voto":
                continue
            c = vcount[(ano, vid)]
            c[0] += 1
            if voto == "Sim":
                c[1] += 1
            elif voto == "Nao":
                c[2] += 1
            else:
                c[3] += 1

    # Votacoes de plenario: tem titulo e >= MIN_VOTOS_VOTACAO votos Sim/Nao
    plenario = {k for k, c in vcount.items() if (c[1] + c[2]) >= MIN_VOTOS_VOTACAO and k in titulos}
    lista_votacoes_rows = []
    for (ano, vid) in sorted(plenario):
        c = vcount[(ano, vid)]
        lista_votacoes_rows.append([ano, vid, titulo(ano, vid), c[0], c[1], c[2], c[3]])

    # Pass V2: coleta o voto de cada deputado nas votacoes de plenario
    votos_votacao_rows: list[list] = []
    with open(votos_path, encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter=";")
        next(reader, None)
        for row in reader:
            if len(row) < 6:
                continue
            ano, vid, id_dep, voto, nome, partido = (row[0].strip(), row[1].strip(), row[2].strip(),
                                                     row[3].strip(), row[4].strip(), row[5].strip())
            uf = row[6].strip() if len(row) > 6 else ""
            if voto == "voto" or (ano, vid) not in plenario:
                continue
            votos_votacao_rows.append([ano, vid, id_dep, nome, partido, uf, voto])
    votos_votacao_rows.sort(key=lambda r: (r[0], r[1], r[4], r[3]))

    # ---- monta blocos ----
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("Q9 - Vies ideologico dos deputados (direita / esquerda / centro)\n")

        # Q9.1 catalogo
        por_ideo: dict[str, list[str]] = defaultdict(list)
        for sigla, ideo in ideologia.items():
            por_ideo[ideo].append(sigla)
        cat_rows = [[ideo, ", ".join(sorted(siglas)), len(siglas)]
                    for ideo, siglas in sorted(por_ideo.items())]
        emit(fh, "Q9.1 - Catalogo de partidos por ideologia",
             ["ideologia", "partidos", "qtd_partidos"], cat_rows)

        # Q9.1 lista completa (tabela principal)
        lista_rows = [[sigla, ideo] for sigla, ideo in
                      sorted(ideologia.items(), key=lambda kv: (kv[1], kv[0]))]
        emit(fh, "Q9.1 - Lista completa partidos x ideologia",
             ["sigla_partido", "ideologia"], lista_rows)

        # Q9.2 correlacao ideologia x proposicao
        q92_rows: list[list] = []
        for (ano, vid, ideo), (sim, nao, outros, total) in sorted(campo.items()):
            pct = round1(sim * 100.0 / total) if total else 0.0
            q92_rows.append([ano, vid, titulo(ano, vid), ideo, sim, nao, outros, total, pct])
        emit(fh, "Q9.2 - Correlacao ideologia x proposicao (pct de Sim por campo)",
             ["ano_dados", "id_votacao", "titulo_proposicao", "ideologia",
              "votos_sim", "votos_nao", "outros", "total_votos", "pct_sim"], q92_rows)

        # Q9.2 resumo partido x proposta (agregado por partido)
        agg: dict[str, dict[str, float]] = {}
        for (ano, vid, partido), (sim, nao, total) in partido_vot.items():
            binario = sim + nao
            a = agg.setdefault(partido, {"votacoes": 0, "soma_pct": 0.0, "sim": 0, "nao": 0,
                                          "orient": 0, "orient_ok": 0})
            a["votacoes"] += 1
            a["sim"] += sim
            a["nao"] += nao
            if binario > 0:
                a["soma_pct"] += sim * 100.0 / binario
            orient = orientacoes.get((ano, vid, partido))
            if orient in ("Sim", "Nao") and binario > 0:
                a["orient"] += 1
                maioria = "Sim" if sim >= nao else "Nao"
                if maioria == orient:
                    a["orient_ok"] += 1
        resumo_part_rows: list[list] = []
        for partido in sorted(agg):
            a = agg[partido]
            media = round1(a["soma_pct"] / a["votacoes"]) if a["votacoes"] else 0.0
            pct_ori = round1(a["orient_ok"] * 100.0 / a["orient"]) if a["orient"] else 0.0
            votou_mais = "Sim" if a["sim"] >= a["nao"] else "Nao"
            resumo_part_rows.append([partido, ideologia.get(partido, "nao classificado"),
                                     a["votacoes"], media, a["orient"], pct_ori, votou_mais])
        resumo_part_rows.sort(key=lambda r: (-float(r[3]), r[0]))
        emit(fh, "Q9.2 - Resumo partido x proposta (agregado por partido)",
             ["sigla_partido", "ideologia", "votacoes", "media_pct_sim",
              "orientacoes", "pct_orientacao_seguida", "votou_mais"], resumo_part_rows)

        # Q9.2b correlacao partido x proposta (granular)
        q92b_rows: list[list] = []
        for (ano, vid, partido), (sim, nao, total) in partido_vot.items():
            binario = sim + nao
            pct = round1(sim * 100.0 / binario) if binario else 0.0
            orient = orientacoes.get((ano, vid, partido), "-") or "-"
            q92b_rows.append([ano, vid, titulo(ano, vid), partido,
                              ideologia.get(partido, "nao classificado"),
                              sim, nao, total, pct, orient])
        q92b_rows.sort(key=lambda r: (r[0], r[1], r[3]))
        emit(fh, "Q9.2b - Correlacao partido x proposta (voto e orientacao)",
             ["ano_dados", "id_votacao", "titulo_proposicao", "sigla_partido", "ideologia",
              "votos_sim", "votos_nao", "total_votos", "pct_sim", "orientacao_partido"], q92b_rows)

        # Q9.3 resumo consolidado por deputado
        q93_rows: list[list] = []
        for (partido, id_dep, nome, ideo), d in dep.items():
            base = d["seguiu"] + d["contrariou"]
            pct = round1(d["seguiu"] * 100.0 / base) if base else ""
            q93_rows.append([partido, id_dep, nome, ideo, d["total"], d["sim"], d["nao"],
                             d["outros"], d["seguiu"], d["contrariou"], pct])
        q93_rows.sort(key=lambda r: (r[0], r[2]))
        emit(fh, "Q9.3 - Resumo consolidado de votos e aderencia por deputado",
             ["sigla_partido", "id_deputado", "nome_deputado", "ideologia", "total_votos",
              "votos_sim", "votos_nao", "outros_votos", "seguiu_orientacao",
              "contrariou_orientacao", "pct_aderencia_partido"], q93_rows)

        # Q9.4 votacoes polarizadas
        emit(fh, "Q9.4 - votacoes polarizadas (divergencia esquerda vs direita)",
             ["ano_dados", "id_votacao", "titulo_proposicao", "pct_sim_esquerda",
              "pct_sim_centro", "pct_sim_direita", "total_votos", "divergencia_esq_dir",
              "campo_favoravel"], q94_rows)

        # Q9.5 score vies individual
        q95_rows: list[list] = []
        for (partido, id_dep, nome, ideo), (com_esq, com_dir) in vies.items():
            total = com_esq + com_dir
            if total < MIN_VOTOS_POLARIZADAS:
                continue
            pct_esq = round1(com_esq * 100.0 / total)
            pct_dir = round1(com_dir * 100.0 / total)
            q95_rows.append([partido, id_dep, nome, ideo, total, com_esq, com_dir,
                             pct_esq, pct_dir, pct_dir])
        q95_rows.sort(key=lambda r: (float(r[9]), r[2]))
        emit(fh, "Q9.5 - score vies ideologico individual dos deputados",
             ["sigla_partido", "id_deputado", "nome_deputado", "ideologia_partido",
              "votos_em_polarizadas", "votos_com_esquerda", "votos_com_direita",
              "pct_com_esquerda", "pct_com_direita", "score_vies"], q95_rows)

        # Q9.3 voto-a-voto do deputado por proposta polarizada (auditoria, filtravel)
        emit(fh, "Q9.3 - Voto do deputado por proposta polarizada",
             ["id_deputado", "nome_deputado", "sigla_partido", "ideologia_partido",
              "ano_dados", "id_votacao", "titulo_proposicao", "voto",
              "campo_favoravel", "votou_com"], q93voto_rows)

        # Q9.6 lista de votacoes de plenario (seletor da secao "observar uma proposta")
        emit(fh, "Q9.6 - Lista de votacoes em plenario",
             ["ano_dados", "id_votacao", "titulo_proposicao", "total_votos",
              "votos_sim", "votos_nao", "votos_outros"], lista_votacoes_rows)

    # Arquivo separado (grande, carregado sob demanda quando se filtra por votacao)
    with open(OUT_VOTOS, "w", encoding="utf-8") as fh:
        fh.write("Q9.6 - Voto de cada deputado por votacao (plenario)\n")
        emit(fh, "Q9.6 - Votos por votacao",
             ["ano_dados", "id_votacao", "id_deputado", "nome_deputado",
              "sigla_partido", "sigla_uf", "voto"], votos_votacao_rows)

    print(f"OK -> {OUT}")
    print(f"OK -> {OUT_VOTOS}")
    print(f"  Q9.6 lista votacoes      : {len(lista_votacoes_rows)} linhas")
    print(f"  Q9.6 votos por votacao   : {len(votos_votacao_rows)} linhas")
    print(f"  Q9.3 voto-a-voto         : {len(q93voto_rows)} linhas")
    print(f"  Q9.2 ideologia x votacao : {len(q92_rows)} linhas")
    print(f"  Q9.2 resumo partido      : {len(resumo_part_rows)} linhas")
    print(f"  Q9.2b partido granular   : {len(q92b_rows)} linhas")
    print(f"  Q9.3 deputados           : {len(q93_rows)} linhas")
    print(f"  Q9.4 polarizadas         : {len(q94_rows)} linhas")
    print(f"  Q9.5 score vies          : {len(q95_rows)} linhas")


if __name__ == "__main__":
    main()
