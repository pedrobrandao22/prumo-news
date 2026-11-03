#!/usr/bin/env python3
"""Indicadores econômicos do Prumo News, sem IA (roda no GitHub a cada hora em dia útil).

  python3 tools/indicadores.py indicadores.json [--series series]

Fontes públicas, sem chave:
- Dólar e Ibovespa: cotação do dia (Yahoo Finance; se falhar, o dólar usa a PTAX do Banco Central).
- Selic (meta), IPCA em 12 meses e desemprego (PNAD Contínua): séries do Banco Central (SGS).
Grava {"atualizado", "itens": [{id, nome, valor, variacao, dir, data, serie, fonte}]}. O app junta com os
indicadores do feed. Se uma fonte falhar, o indicador anterior do arquivo continua valendo.

Com --series PASTA, guarda também o HISTÓRICO de cada indicador em PASTA/<id>.json (selic, ipca12m, ipca_mes,
desemprego, dolar, ibovespa) e PASTA/index.json, para os gráficos do app ("serie": "selic"): as rodadas não digitam
números. Formato: {id, nome, unidade, casas, fonte, freq "mensal"|"diaria", atualizado, pontos [["AAAA-MM(-DD)", valor]]}.
A cada hora só busca o trecho recente e junta com o que já está no arquivo; só regrava quando muda.
"""
import json, os, sys, time, urllib.error, urllib.request
from datetime import datetime, timedelta, timezone

SP = timezone(timedelta(hours=-3))
UA = {"User-Agent": "Mozilla/5.0 (prumo-news; +https://prumonews.com.br)", "Accept": "application/json"}


def get_json(url, tempo=20, tentativas=3):
    """Até 3 tentativas (espera 2 s e 6 s) em tempo esgotado, erro de conexão, 429 ou 5xx (o BC deu 502 várias vezes
    em 03/11); 4xx não repete."""
    for n in range(tentativas):
        req = urllib.request.Request(url, headers=UA)
        try:
            with urllib.request.urlopen(req, timeout=tempo) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code != 429 and e.code < 500 or n == tentativas - 1: raise
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if n == tentativas - 1: raise
        time.sleep(2 + 4 * n)


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


def dia_yahoo(t, meta=None):
    """Dia (AAAA-MM-DD) de uma barra diária do Yahoo, no fuso da bolsa que a publica.
    As barras do câmbio (BRL=X) vêm à meia-noite de Londres: no fuso de São Paulo elas caíam no dia anterior
    (sexta virava quinta, segunda virava domingo). Sem o fuso no meta, usa o deslocamento (gmtoffset) e, por fim, São Paulo."""
    meta = meta or {}
    tz = meta.get("exchangeTimezoneName")
    if isinstance(tz, str) and tz:
        try:
            from zoneinfo import ZoneInfo
            return datetime.fromtimestamp(t, ZoneInfo(tz)).date().isoformat()
        except Exception:
            pass
    off = meta.get("gmtoffset")
    if isinstance(off, (int, float)) and not isinstance(off, bool) and abs(off) <= 14 * 3600:
        return datetime.fromtimestamp(t + off, timezone.utc).date().isoformat()
    return datetime.fromtimestamp(t, SP).date().isoformat()


def yahoo(simbolo):
    """(preço atual, fechamento do pregão anterior, data, fechamentos dos últimos 3 meses, datas deles)."""
    d1 = get_json(f"https://query1.finance.yahoo.com/v8/finance/chart/{simbolo}?range=1d&interval=5m")["chart"]["result"][0]["meta"]
    preco = float(d1["regularMarketPrice"])
    ant = float(d1.get("chartPreviousClose") or d1.get("previousClose"))
    t = d1.get("regularMarketTime")
    data = datetime.fromtimestamp(t, SP).date().isoformat() if t else datetime.now(SP).date().isoformat()
    try:
        r = get_json(f"https://query1.finance.yahoo.com/v8/finance/chart/{simbolo}?range=3mo&interval=1d")["chart"]["result"][0]
        pares = [(dia_yahoo(t, r.get("meta")), round(float(c), 4))
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
    hoje = datetime.now(SP).date().isoformat()
    s = [x for x in s if x[0] <= hoje]  # a série do BC já traz dias à frente (a meta vale até a próxima reunião)
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


# ---------- séries históricas (gráficos do app) ----------
SERIES = {
    "selic": {"nome": "Selic (meta)", "unidade": "%", "casas": 2, "fonte": "Banco Central (Copom)", "freq": "mensal", "sgs": 432, "diaria": True},
    "ipca12m": {"nome": "IPCA em 12 meses", "unidade": "%", "casas": 2, "fonte": "IBGE (via Banco Central)", "freq": "mensal", "sgs": 13522},
    "ipca_mes": {"nome": "IPCA no mês", "unidade": "%", "casas": 2, "fonte": "IBGE (via Banco Central)", "freq": "mensal", "sgs": 433},
    "desemprego": {"nome": "Desemprego (PNAD Contínua)", "unidade": "%", "casas": 1, "fonte": "IBGE/PNAD Contínua (via Banco Central)", "freq": "mensal", "sgs": 24369},
    "dolar": {"nome": "Dólar (PTAX, venda)", "unidade": "R$", "casas": 2, "fonte": "Banco Central (PTAX)", "freq": "diaria", "sgs": 1, "diaria": True},
    "ibovespa": {"nome": "Ibovespa (fechamento)", "unidade": "pontos", "casas": 0, "fonte": "B3", "freq": "diaria", "yahoo": "%5EBVSP"},
}
INICIO_MENSAL = "01/01/2012"


def sgs_janela(cod, ini, fim=None):
    """Série do SGS entre duas datas dd/mm/aaaa (séries diárias: no máximo 10 anos por pedido)."""
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados?formato=json&dataInicial={ini}"
    if fim: url += f"&dataFinal={fim}"
    out = []
    for x in get_json(url, 30):
        try:
            dd, mm, aa = str(x["data"]).split("/")
            out.append((f"{aa}-{mm}-{dd}", float(str(x["valor"]).replace(",", "."))))
        except (KeyError, ValueError, TypeError): continue
    return out


def buscar_serie(sid, cfg, velho):
    """Pontos novos da série (só o trecho recente se já há histórico)."""
    hoje = datetime.now(SP).date()
    ult = velho[-1][0] if velho else None
    if cfg.get("yahoo"):
        rng = "3mo" if ult else "5y"
        r = get_json(f"https://query1.finance.yahoo.com/v8/finance/chart/{cfg['yahoo']}?range={rng}&interval=1d")["chart"]["result"][0]
        dia = {}
        for t, c in zip(r.get("timestamp") or [], r["indicators"]["quote"][0].get("close") or []):
            if c is not None: dia[dia_yahoo(t, r.get("meta"))] = round(float(c), 2)
        return sorted(dia.items())
    if cfg.get("diaria"):
        # histórico inicial em janelas de até 2 anos: um pedido de ~10 anos da série diária 432 falhou nas 3 primeiras
        # execuções de 03/11 (series/selic.json só apareceu às 14h58); o SGS limita séries diárias a 10 anos por pedido
        dias = 120 if ult else (3600 if sid == "selic" else 1830)
        pts, fim = [], hoje
        while (hoje - fim).days < dias:
            ini = max(hoje - timedelta(days=dias), fim - timedelta(days=730))
            pts = sgs_janela(cfg["sgs"], ini.strftime("%d/%m/%Y"), fim.strftime("%d/%m/%Y")) + pts
            fim = ini - timedelta(days=1)
        pts = [p for p in pts if p[0] <= hoje.isoformat()]
    else:
        ini = (hoje - timedelta(days=500)).strftime("%d/%m/%Y") if ult else INICIO_MENSAL
        pts = sgs_janela(cfg["sgs"], ini)
    if cfg["freq"] == "mensal":  # valor de cada mês (série diária: o do último dia do mês; o mês corrente, o de hoje)
        mes = {}
        for d, v in pts: mes[d[:7]] = v
        return sorted(mes.items())
    return pts


def juntar_pontos(velhos, novos):
    m = {d: v for d, v in velhos}
    for d, v in novos: m[d] = v
    return [[d, m[d]] for d in sorted(m)]


def atualizar_series(pasta):
    """Grava PASTA/<id>.json e PASTA/index.json. Falha de uma série não apaga o histórico dela."""
    os.makedirs(pasta, exist_ok=True)
    idx, log, mudou = [], [], False
    for sid, cfg in SERIES.items():
        arq = os.path.join(pasta, sid + ".json")
        velho = {}
        try: velho = json.load(open(arq, encoding="utf-8"))
        except Exception: velho = {}
        vp = [p for p in (velho.get("pontos") or []) if isinstance(p, list) and len(p) == 2]
        try:
            novos = buscar_serie(sid, cfg, vp)
            pts = juntar_pontos(vp, novos)
            log.append(f"série {sid}: {len(pts)} pontos (+{len(pts) - len(vp)})")
        except Exception as e:
            log.append(f"série {sid}: FALHOU {repr(e)[:100]}"); pts = vp
        if not pts: continue
        meta = {k: cfg[k] for k in ("nome", "unidade", "casas", "fonte", "freq")}
        doc = dict({"id": sid}, **meta, atualizado=velho.get("atualizado") or "", pontos=pts)
        if pts != vp or any(velho.get(k) != v for k, v in meta.items()):
            doc["atualizado"] = datetime.now(SP).isoformat(timespec="minutes"); mudou = True
            with open(arq, "w", encoding="utf-8") as fh: json.dump(doc, fh, ensure_ascii=False, separators=(",", ":"))
        idx.append({"id": sid, "nome": cfg["nome"], "unidade": cfg["unidade"], "freq": cfg["freq"], "fonte": cfg["fonte"],
                    "de": pts[0][0], "ate": pts[-1][0], "n": len(pts), "atualizado": doc["atualizado"]})
    print("\n".join(log))
    ia = os.path.join(pasta, "index.json")
    try: vi = json.load(open(ia, encoding="utf-8")).get("series")
    except Exception: vi = None
    if idx and (mudou or vi != idx):
        with open(ia, "w", encoding="utf-8") as fh: json.dump({"series": idx}, fh, ensure_ascii=False, separators=(",", ":"))
    return len(idx)


def main(argv):
    if not argv: print(__doc__); return 2
    if "--series" in argv:
        i = argv.index("--series"); pasta = argv[i + 1] if i + 1 < len(argv) else "series"; argv = argv[:i] + argv[i + 2:]
        try: atualizar_series(pasta)
        except Exception as e: print("séries falharam:", repr(e)[:160])
        if not argv: return 0
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
