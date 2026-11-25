#!/usr/bin/env python3
"""25/11: regra única de fotos. tools/fotos_regras.json é a fonte; o app (js/213-fotos-regra.js) carrega uma cópia e
paginas.py lê o arquivo. Este teste falha se a cópia do app divergir e confere as condições 'exige'."""
import json, os, re, sys, unittest
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import paginas  # noqa: E402

class TesteRegraUnica(unittest.TestCase):
    def test_app_igual_ao_json(s):
        R = json.load(open(os.path.join(AQUI, "fotos_regras.json"), encoding="utf-8"))
        js = open(os.path.join(AQUI, "..", "fonte", "app", "src", "js", "213-fotos-regra.js"), encoding="utf-8").read()
        m = re.search(r"var FT213_REGRAS=(\{.*?\}\]\});", js, re.S)
        s.assertTrue(m, "FT213_REGRAS não achado no 213")
        app = json.loads(m.group(1))
        s.assertEqual(app["bloq"], R["bloq"])
        s.assertEqual([(r["nome"], r["titulo"]) for r in app["exige"]], [(r["nome"], r["titulo"]) for r in R["exige"]])

    def test_exige(s):
        pf = {"url": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Sede_da_Policia_Federal_Brasilia.jpg"}
        s.assertFalse(paginas.regra_ok(pf, "familia diz que absolvicao de anestesista no df e devastadora"))
        s.assertTrue(paginas.regra_ok(pf, "policia federal prende suspeito"))
        av = {"url": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Alaska_Airlines_Airbus_A321.jpg"}
        s.assertFalse(paginas.regra_ok(av, "falha em sistema da delta atrasa voos nos eua"))
        wh = {"url": "https://upload.wikimedia.org/wikipedia/commons/a/ab/The_White_House_June_2024.jpg"}
        s.assertFalse(paginas.regra_ok(wh, "democratas chegam a 258 cadeiras, maior bancada desde 1992"))
        s.assertTrue(paginas.regra_ok(wh, "trump anuncia tarifa"))

    def test_bloq(s):
        s.assertTrue(paginas.bloqueada({"url": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Kyiv_Maidan_Nezalezhnosti.jpg"}))

if __name__ == "__main__":
    unittest.main()
