"""Corretor 21/11: a reserva de indicadores do feed (aplicar.reserva_indicadores) segue o indicadores.json para dólar e
Ibovespa mesmo quando o feed tem data mais nova (fechamento gravado num feriado sem pregão: 'Dólar fecha a R$ 5,95 hoje'
em 20/11, Consciência Negra). Indicadores que não são do robô continuam só trocando por valor mais novo."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import aplicar as AP

ok = falhas = 0
def chk(c, msg, det=""):
    global ok, falhas
    if c: ok += 1; print("ok  ", msg)
    else: falhas += 1; print("FAIL", msg, det)

def feed(*itens): return {"indicadores": {"itens": [dict(i) for i in itens]}}
IND = {"dolar": {"valor": "R$ 5,93", "variacao": "+1,47%", "dir": "sobe", "data": "2026-11-19", "serie": [5.1, 5.2, 5.93]},
       "ibovespa": {"valor": "166.376", "variacao": "-0,4%", "dir": "cai", "data": "2026-11-19"},
       "selic": {"valor": "15%", "data": "2026-11-04"}}
# o caso do testador: feed com o dólar de 20/11 (feriado) e o robô em 19/11
F = feed({"id": "dolar", "valor": "R$ 5,95", "variacao": "+0,74%", "dir": "sobe", "data": "2026-11-20"},
         {"id": "ibovespa", "valor": "166.000", "data": "2026-11-20"},
         {"id": "selic", "valor": "15,25%", "data": "2026-11-10"})
AP.reserva_indicadores(F, IND); it = {x["id"]: x for x in F["indicadores"]["itens"]}
chk(it["dolar"]["valor"] == "R$ 5,93" and it["dolar"]["data"] == "2026-11-19", "dólar de feriado no feed volta ao fechamento do robô", it["dolar"])
chk(it["ibovespa"]["valor"] == "166.376", "Ibovespa idem", it["ibovespa"])
chk(it["selic"]["valor"] == "15,25%", "Selic (não é do robô de cotações): valor mais novo do feed fica", it["selic"])
# caso antigo (20/11): reserva parada em outubro é atualizada
F = feed({"id": "dolar", "valor": "R$ 5,02", "data": "2026-10-22"}, {"id": "selic", "valor": "15%", "data": "2026-09-17"})
AP.reserva_indicadores(F, dict(IND, selic={"valor": "15%", "data": "2026-11-04"})); it = {x["id"]: x for x in F["indicadores"]["itens"]}
chk(it["dolar"]["valor"] == "R$ 5,93", "reserva parada em outubro segue o robô", it["dolar"])
chk(it["selic"]["data"] == "2026-11-04", "Selic mais nova no indicadores.json entra", it["selic"])
# sem indicadores.json: nada muda
F = feed({"id": "dolar", "valor": "R$ 5,95", "data": "2026-11-20"}); AP.reserva_indicadores(F, None)
chk(F["indicadores"]["itens"][0]["valor"] == "R$ 5,95", "sem indicadores.json a reserva fica como está")
# o feed real de hoje
import json
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
try:
    FR = json.load(open(os.path.join(R, "feed.json"))); IR = AP.V.ler_indicadores(os.path.join(R, "indicadores.json"))
    AP.reserva_indicadores(FR, IR); d = [x for x in FR["indicadores"]["itens"] if x.get("id") == "dolar"][0]
    chk(d["data"] == (IR.get("dolar") or {}).get("data"), "feed real: reserva do dólar com a data do robô", d.get("data"))
except FileNotFoundError: pass
print(f"{ok} ok, {falhas} falhas"); sys.exit(1 if falhas else 0)
