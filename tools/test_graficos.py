#!/usr/bin/env python3
"""Testes do catálogo de gráficos no validar.py e da operação grafico_set do aplicar.py (sem internet).

  python3 tools/test_graficos.py
"""
import copy, json, os, subprocess, sys, tempfile, unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402

CAT = os.path.join(AQUI, "fixtures", "catalogo", "feed-catalogo.json")


def exemplos():
    with open(CAT, encoding="utf-8") as fh: F = json.load(fh)
    return {v["forma"] + ("_" + v["casa"] if v.get("casa") else ""): v for p in F["pautas"] for v in p.get("visuais") or [] if v.get("tipo") == "grafico"}


def checa(v, series=("selic", "ipca12m", "dolar")):
    V.erros.clear(); V.avisos.clear(); V.SERIES_IDX = set(series) if series is not None else None
    V.checar_grafico("p", v)
    return list(V.erros), list(V.avisos)


class TesteCatalogo(unittest.TestCase):
    def test_todos_os_modelos_do_catalogo_passam(s):
        ex = exemplos()
        formas = {k.split("_camara")[0].split("_senado")[0].split("_stf")[0] for k in ex}
        s.assertEqual(formas, set(V.FORMAS))
        for k, v in ex.items():
            e, a = checa(v); s.assertEqual(e, [], k); s.assertEqual(a, [], k)

    def test_fonte_obrigatoria_menos_com_serie(s):
        ex = exemplos()
        for k in ("rosca", "ranking", "placar_votacao_camara", "mapa_uf", "pesquisa"):
            v = dict(ex[k]); v.pop("fonte")
            s.assertTrue(any("sem fonte" in m for m in checa(v)[0]), k)
        v = dict(ex["linha"]); v.pop("fonte", None); s.assertEqual(checa(v)[0], [])

    def test_numeros_puros(s):
        v = copy.deepcopy(exemplos()["ranking"]); v["itens"][0]["valor"] = "92 deputados"
        s.assertTrue(any("número puro" in m for m in checa(v)[0]))
        v = copy.deepcopy(exemplos()["barras_empilhadas"]); v["itens"][0]["valores"] = [80, 8]
        s.assertTrue(any("um para cada série" in m for m in checa(v)[0]))
        v = copy.deepcopy(exemplos()["area"]); v["unidade"] = "bilhões de reais"
        s.assertTrue(any("unidade" in m for m in checa(v)[0]))

    def test_regras_de_cada_modelo(s):
        ex = exemplos()
        v = copy.deepcopy(ex["placar_votacao_camara"]); v["itens"][0]["valor"] = 500
        s.assertTrue(any("mais que as 513" in m for m in checa(v)[0]))
        v = copy.deepcopy(ex["placar_votacao_senado"]); v["casa"] = "assembleia"
        s.assertTrue(any("placar_votacao.casa" in m for m in checa(v)[0]))
        v = copy.deepcopy(ex["placar_votacao_stf"]); v["minimo"] = 12
        s.assertTrue(any("minimo" in m for m in checa(v)[0]))
        v = copy.deepcopy(ex["mapa_uf"]); v["itens"][0]["rotulo"] = "XX"; v["itens"][2]["rotulo"] = v["itens"][1]["rotulo"]
        e = checa(v)[0]; s.assertTrue(any("não é sigla" in m for m in e)); s.assertTrue(any("repetida" in m for m in e))
        v = copy.deepcopy(ex["pesquisa"]); v.pop("margem"); v["itens"][0]["valor"] = 140
        e = checa(v)[0]; s.assertTrue(any("margem" in m for m in e)); s.assertTrue(any("acima de 100" in m for m in e))
        v = copy.deepcopy(ex["faixa_meta"]); v["meta"] = {"centro": 3, "min": 4.5, "max": 1.5}
        s.assertTrue(any("min ≤ centro ≤ max" in m for m in checa(v)[0]))
        v = copy.deepcopy(ex["antes_depois"]); v["itens"].append({"rotulo": "Depois", "valor": 1})
        s.assertTrue(any("(2 a 2)" in m for m in checa(v)[0]))
        v = copy.deepcopy(ex["contagem"]); v["data"] = "09/12/2026"
        s.assertTrue(any("contagem.data" in m for m in checa(v)[0]))
        v = copy.deepcopy(ex["contagem"]); v["data"] = "2020-01-01"
        s.assertTrue(any("data passada" in m for m in checa(v)[1]))
        v = copy.deepcopy(ex["rosca"]); v["itens"] = [{"rotulo": "a", "valor": -1}, {"rotulo": "b", "valor": 0}]
        s.assertTrue(checa(v)[0])

    def test_series(s):
        v = dict(exemplos()["linha"], serie="petroleo")
        s.assertTrue(any("não existe em series/index.json" in m for m in checa(v)[0]))
        s.assertEqual(checa(v, series=None)[0], [])  # sem series/index.json ao lado: não acusa
        v = dict(exemplos()["linha"], periodo="dois anos")
        s.assertTrue(any("periodo" in m for m in checa(v)[0]))
        v = dict(exemplos()["ranking"], serie="selic")
        s.assertTrue(any("só vale nas formas" in m for m in checa(v)[0]))

    def test_forma_desconhecida_e_modelo_antigo(s):
        s.assertTrue(any("grafico.forma deve ser" in m for m in checa({"tipo": "grafico", "forma": "pizza3d", "titulo": "x", "fonte": "y"})[0]))
        v = {"tipo": "grafico", "forma": "linha", "titulo": "x", "fonte": "y", "itens": [{"rotulo": "a", "valor": 1}, {"rotulo": "b", "valor": 2}]}
        s.assertTrue(any("linha com 2 itens (3 a 24)" in m for m in checa(v)[0]))  # mensagem antiga mantida

    def test_feed_publicado_continua_valido(s):
        r = subprocess.run([sys.executable, os.path.join(AQUI, "validar.py"), os.path.join(AQUI, "..", "feed.json"), "--json"], capture_output=True, text=True)
        res = json.loads(r.stdout.strip().splitlines()[-1])
        s.assertFalse([l for l in r.stdout.splitlines() if l.startswith("ERRO") and "grafico" in l])
        s.assertIn("erros", res)


class TesteAplicar(unittest.TestCase):
    def test_grafico_set(s):
        d = tempfile.mkdtemp(prefix="ap-")
        with open(CAT, encoding="utf-8") as fh: F = json.load(fh)
        pid = next(p["id"] for p in F["pautas"] if any(v.get("tipo") == "numeros" for v in p.get("visuais") or []))
        fe, pa, sa = os.path.join(d, "f.json"), os.path.join(d, "p.json"), os.path.join(d, "n.json")
        json.dump(F, open(fe, "w", encoding="utf-8"), ensure_ascii=False)
        g = exemplos()["ranking"]
        json.dump([{"op": "grafico_set", "pid": pid, "grafico": {k: v for k, v in g.items() if k != "tipo"}}], open(pa, "w"))
        r = subprocess.run([sys.executable, os.path.join(AQUI, "aplicar.py"), fe, pa, "-o", sa], capture_output=True, text=True)
        s.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        p = next(x for x in json.load(open(sa, encoding="utf-8"))["pautas"] if x["id"] == pid)
        s.assertEqual([v["tipo"] for v in p["visuais"]].count("grafico"), 1)
        s.assertEqual(p["visuais"][0]["forma"], "ranking"); s.assertTrue(any(v["tipo"] == "numeros" for v in p["visuais"]))
        json.dump([{"op": "grafico_set", "pid": pid, "grafico": {"forma": "pizza3d"}}], open(pa, "w"))
        r = subprocess.run([sys.executable, os.path.join(AQUI, "aplicar.py"), sa, pa, "-o", os.path.join(d, "n2.json")], capture_output=True, text=True)
        s.assertNotEqual(r.returncode, 0)
        json.dump([{"op": "grafico_set", "pid": pid, "grafico": None}], open(pa, "w"))
        r = subprocess.run([sys.executable, os.path.join(AQUI, "aplicar.py"), sa, pa, "-o", os.path.join(d, "n3.json")], capture_output=True, text=True)
        p = next(x for x in json.load(open(os.path.join(d, "n3.json"), encoding="utf-8"))["pautas"] if x["id"] == pid)
        s.assertFalse(any(v["tipo"] == "grafico" for v in p["visuais"]))


if __name__ == "__main__":
    unittest.main(verbosity=1)
