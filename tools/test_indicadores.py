#!/usr/bin/env python3
"""Testes das séries históricas do robô de indicadores, sem internet (respostas gravadas em tools/fixtures/).

  python3 tools/test_indicadores.py
"""
import json, os, re, shutil, sys, tempfile, unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import indicadores as IN  # noqa: E402

FIX = os.path.join(AQUI, "fixtures")


def carrega(n):
    with open(os.path.join(FIX, n), encoding="utf-8") as fh: return json.load(fh)


class Rede:
    def __init__(s): s.urls, s.falha = [], set()

    def get_json(s, url, tempo=20):
        s.urls.append(url)
        if any(f in url for f in s.falha): raise OSError("sem rede")
        m = re.search(r"bcdata\.sgs\.(\d+)/", url)
        if m: return carrega(f"sgs_{m.group(1)}.json")
        if "query1.finance.yahoo.com" in url: return carrega("yahoo_bvsp.json")
        raise OSError("url inesperada " + url)


class TesteSeries(unittest.TestCase):
    def setUp(s):
        s.dir = tempfile.mkdtemp(prefix="ser-"); s.rede = Rede(); s._g = IN.get_json; IN.get_json = s.rede.get_json

    def tearDown(s):
        IN.get_json = s._g; shutil.rmtree(s.dir, ignore_errors=True)

    def le(s, n):
        with open(os.path.join(s.dir, n), encoding="utf-8") as fh: return json.load(fh)

    def test_grava_series_e_indice(s):
        self_n = IN.atualizar_series(s.dir)
        s.assertEqual(self_n, 6)
        sel = s.le("selic.json")
        s.assertEqual((sel["unidade"], sel["freq"], sel["casas"]), ("%", "mensal", 2))
        s.assertEqual(sel["pontos"][0], ["2026-08", 15.0])
        s.assertEqual(dict(sel["pontos"])["2026-10"], 13.75)          # fim do mês
        s.assertTrue(all(re.match(r"^\d{4}-\d{2}$", d) for d, _ in sel["pontos"]))
        dol = s.le("dolar.json"); s.assertTrue(all(re.match(r"^\d{4}-\d{2}-\d{2}$", d) for d, _ in dol["pontos"]))
        s.assertEqual(dol["unidade"], "R$")
        des = s.le("desemprego.json"); s.assertEqual(len(des["pontos"]), 9)   # valor vazio é ignorado
        ib = s.le("ibovespa.json"); s.assertEqual(len(ib["pontos"]), 21)      # fechamento nulo é ignorado
        idx = s.le("index.json")["series"]
        s.assertEqual([x["id"] for x in idx], ["selic", "ipca12m", "ipca_mes", "desemprego", "dolar", "ibovespa"])
        s.assertTrue(all(x["fonte"] and x["ate"] and x["n"] > 0 for x in idx))
        # primeira vez: janela longa (mensais desde 2012; diárias até 10 anos)
        s.assertTrue(any("bcdata.sgs.13522/" in u and "dataInicial=01/01/2012" in u for u in s.rede.urls))
        s.assertTrue(any("range=5y" in u for u in s.rede.urls))

    def test_incremental_e_sem_regravar(s):
        IN.atualizar_series(s.dir)
        # histórico antigo que a janela curta não traz continua no arquivo
        p = os.path.join(s.dir, "ipca12m.json"); d = s.le("ipca12m.json")
        d["pontos"] = [["2015-01", 7.14]] + d["pontos"]
        with open(p, "w", encoding="utf-8") as fh: json.dump(d, fh)
        m0 = {f: os.path.getmtime(os.path.join(s.dir, f)) for f in os.listdir(s.dir)}
        s.rede.urls = []; IN.atualizar_series(s.dir)
        s.assertEqual(s.le("ipca12m.json")["pontos"][0], ["2015-01", 7.14])
        s.assertTrue(any("range=3mo" in u for u in s.rede.urls))
        s.assertFalse(any("dataInicial=01/01/2012" in u for u in s.rede.urls))
        m1 = {f: os.path.getmtime(os.path.join(s.dir, f)) for f in os.listdir(s.dir)}
        s.assertEqual(m0["selic.json"], m1["selic.json"])  # não regrava o que não mudou

    def test_falha_mantem_historico(s):
        IN.atualizar_series(s.dir); antes = s.le("selic.json")
        s.rede.falha = {"bcdata.sgs.432"}
        IN.atualizar_series(s.dir)
        s.assertEqual(s.le("selic.json")["pontos"], antes["pontos"])
        s.rede.falha = {"api.bcb.gov.br", "yahoo"}
        shutil.rmtree(s.dir); os.makedirs(s.dir)
        s.assertEqual(IN.atualizar_series(s.dir), 0)    # nada: não grava índice vazio
        s.assertFalse(os.path.exists(os.path.join(s.dir, "index.json")))

    def test_main_aceita_series(s):
        ind = os.path.join(s.dir, "indicadores.json")
        s.rede.falha = {"query1.finance.yahoo.com/v8/finance/chart/BRL"}  # dólar cai para a PTAX
        r = IN.main([ind, "--series", os.path.join(s.dir, "series")])
        s.assertEqual(r, 0)
        s.assertTrue(os.path.exists(os.path.join(s.dir, "series", "selic.json")))
        s.assertTrue(os.path.exists(ind))


if __name__ == "__main__":
    unittest.main(verbosity=1)
