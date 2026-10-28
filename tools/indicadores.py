#!/usr/bin/env python3
"""Indicadores econômicos do Prumo News, sem IA (roda no GitHub a cada hora em dia útil).

  python3 tools/indicadores.py indicadores.json

Fontes públicas, sem chave:
- Dólar e Ibovespa: cotação do dia (Yahoo Finance; se falhar, o dólar usa a PTAX do Banco Central).
- Selic (meta), IPCA em 12 meses e desemprego (PNAD Contínua): séries do Banco Central (SGS).
Grava {"atualizado", "itens": [{id, nome, valor, variacao, dir, data, serie, fonte}]}. O app junta com os
indicadores do feed. Se uma fonte falhar, o indicador anterior do arquivo continua valendo.
"""
import json, os, sys, urllib.request
from datetime import datetime, timedelta, timezone

SP = timezone(timedelta(hours=-3))
UA = {"User-Agent": "Mozilla/5.0 (prumo-news; +https://prumonews.com.br)", "Accept": "application/json"}


def get_json(url, tempo=20):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=tempo) as r:
        return json.loads(r.read().decode("utf-8"))


def br(x, casas):
    s = f"{x:,.{casas}f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def pct(x):
    return ("+" if x > 0 else "") + br(x, 2) + "%"


def direcao(a, b, tol=1e-9):
    return "sobe" if b > a + tol else "desce" if b < a - tol else "estavel"


def sgs(cod, n=None, dias=None):
    """n: últimos n valores (a API aceita no máximo 20); dias: janela de datas (para séries diárias longas)."""
    if dias:
        ini = (datetime.now(SP) - timedelta(days=dias)).strftime("%d/%m/%Y")
        url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados?formato=json&dataInicial={ini}"
    else:
        url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados/ultimos/{min(n, 20)}?formato=json"
    d = get_json(url)
    out = []
    for x in d:
        dd, mm, aa = x["data"].split("/")
        out.append((f"{aa}-{mm}-{dd}", float(x["valor"])))
    return out


def yahoo(simbolo):
    """(preço atual, fechamento do pregão anterior, data, fechamentos dos últimos 3 meses, datas deles)."""
    d1 = get_json(f"https://query1.finance.yahoo.com/v8/finance/chart/{simbolo}?range=1d&interval=5m")["chart"]["result"][0]["meta"]
    preco = float(d1["regularMarketPrice"])
    ant = float(d1.get("chartPreviousClose") or d1.get("previousClose"))
    t = d1.get("regularMarketTime")
    data = datetime.fromtimestamp(t, SP).date().isoformat() if t else datetime.now(SP).date().isoformat()
    try:
        r = get_json(f"https://query1.finance.yahoo.com/v8/finance/chart/{simbolo}?range=3mo&interval=1d")["chart"]["result"][0]
        pares = [(datetime.fromtimestamp(t, SP).date().isoformat(), round(float(c), 4))
                 for t, c in zip(r.get("timestamp") or [], r["indicators"]["quote"][0].get("close") or []) if c is not None]
        dia = {}
        for d, c in pares: dia[d] = c  # um ponto por dia (o último)
        if data not in dia or abs(dia[data] - preco) > 1e-9: dia[data] = round(preco, 4)
        ds = sorted(dia)[-66:]
        serie, rotulos = [dia[d] for d in ds], ds
    except Exception:
        serie, rotulos = [], []
    return preco, ant, data, serie, rotulos


def dolar():
    try:
        p, a, data, serie, rot = yahoo("BRL%3DX")
        return {"id": "dolar", "nome": "Dólar", "valor": "R$ " + br(p, 2), "variacao": pct((p / a - 1) * 100),
                "dir": direcao(round(a, 3), round(p, 3)), "data": data, "serie": serie, "rotulos": rot, "fonte": "cotação comercial"}
    except Exception as e:
        print("dólar (Yahoo) falhou:", repr(e)[:120])
    s = sgs(1, 20)
    (d0, a), (d1, p) = s[-2], s[-1]
    return {"id": "dolar", "nome": "Dólar", "valor": "R$ " + br(p, 2), "variacao": pct((p / a - 1) * 100),
            "dir": direcao(a, p), "data": d1, "serie": [v for _, v in s], "rotulos": [d for d, _ in s], "fonte": "PTAX/Banco Central"}


def ibovespa():
    p, a, data, serie, rot = yahoo("%5EBVSP")
    return {"id": "ibovespa", "nome": "Ibovespa", "valor": br(p, 0), "variacao": pct((p / a - 1) * 100),
            "dir": direcao(round(a), round(p)), "data": data, "serie": [round(x) for x in serie], "rotulos": rot, "fonte": "B3"}


def mudanca(serie):
    """(data em que o valor atual começou, valor anterior diferente) numa série diária/mensal."""
    atual = serie[-1][1]
    for i in range(len(serie) - 2, -1, -1):
        if abs(serie[i][1] - atual) > 1e-9:
            return serie[i + 1][0], serie[i][1]
    return serie[0][0], atual


def selic():
    try:
        s = sgs(432, dias=760)
    except Exception as e:
        print("selic (760 dias) falhou:", repr(e)[:160]); s = sgs(432, dias=600)
    desde, ant = mudanca(s)
    mes = {}
    for d, v in s: mes[d[:7]] = v  # valor no fim de cada mês (o do mês atual é o de hoje)
    ms = sorted(mes)[-24:]
    return {"id": "selic", "nome": "Selic", "valor": br(s[-1][1], 2) + "%", "dir": direcao(ant, s[-1][1]),
            "data": desde, "serie": [mes[m] for m in ms], "rotulos": ms, "fonte": "Copom/Banco Central"}


def mensal(cod, id_, nome, fonte, velho):
    s = sgs(cod, 13)
    v, a = s[-1][1], s[-2][1]
    item = {"id": id_, "nome": nome, "valor": br(v, 2 if id_ == "ipca12m" else 1) + "%", "dir": direcao(a, v),
            "ref": s[-1][0][:7], "serie": [x for _, x in s], "rotulos": [d[:7] for d, _ in s], "fonte": fonte}
    # data = quando o número novo apareceu (perto da divulgação); mantém a anterior se não mudou
    if velho and velho.get("ref") == item["ref"] and velho.get("data"):
        item["data"] = velho["data"]
    else:
        item["data"] = datetime.now(SP).date().isoformat()
    return item


def main(argv):
    if not argv: print(__doc__); return 2
    caminho = argv[0]
    antigo = {}
    if os.path.exists(caminho):
        try: antigo = {x["id"]: x for x in json.load(open(caminho, encoding="utf-8")).get("itens", [])}
        except Exception: antigo = {}
    novos, log, falhas = {}, [], {}
    tarefas = [("dolar", dolar), ("ibovespa", ibovespa), ("selic", selic),
               ("ipca12m", lambda: mensal(13522, "ipca12m", "IPCA 12m", "IBGE", antigo.get("ipca12m"))),
               ("desemprego", lambda: mensal(24369, "desemprego", "Desemprego", "IBGE/PNAD", antigo.get("desemprego")))]
    for id_, fn in tarefas:
        try:
            novos[id_] = fn(); log.append(f"{id_}: {novos[id_]['valor']} ({novos[id_]['data']})")
        except Exception as e:
            log.append(f"{id_}: FALHOU {repr(e)[:120]}"); falhas[id_] = repr(e)[:160]
            if id_ in antigo: novos[id_] = antigo[id_]
    print("\n".join(log))
    if not novos: print("nenhum indicador: nada gravado"); return 1
    itens = [novos[k] for k in ("dolar", "ibovespa", "selic", "ipca12m", "desemprego") if k in novos]
    if [{k: v for k, v in x.items()} for x in itens] == list(antigo.values()) and len(antigo) == len(itens):
        print("sem mudança"); return 0
    out = {"atualizado": datetime.now(SP).isoformat(timespec="minutes"), "itens": itens}
    if falhas: out["falhas"] = falhas
    with open(caminho, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
    print("gravado", caminho)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
