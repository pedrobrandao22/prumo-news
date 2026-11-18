#!/usr/bin/env python3
"""Datas (Fase 2, 18/11): as duas pontas combinam. A virada (e a rodada) gravam o dia com o número ("na terça (17)");
o app (fonte/app/src/js/185-datas.js, dt185Rel) mostra "hoje", "ontem" ou "amanhã" pela data de quem lê. Aqui:
o que a virada_auto grava é lido pelo app do jeito certo, e o validar aceita a forma com o mês ("terça (17/11)").

  cd tools && python3 -I -m pytest -q test_datas_f2.py
"""
import json, os, shutil, subprocess, sys, unittest
from datetime import date

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402
import virada_auto as VA  # noqa: E402

JS = os.path.join(AQUI, "..", "fonte", "app", "src", "js", "185-datas.js")
NODE = shutil.which("node")
# roda dt185Rel fora do navegador (somaDias e hojeSP do app; o resto do arquivo só liga o observador quando há document)
RODA = r"""
const fs=require('fs');const somaDias=(iso,n)=>{const d=new Date(iso+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const hojeSP=()=>"";const document={body:null,addEventListener(){}};
eval(fs.readFileSync(process.argv[1],'utf8'));
const E=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(E.map(([t,h])=>dt185Rel(t,h))));
"""


def app(pares):
    r = subprocess.run([NODE, "-e", RODA, JS], input=json.dumps(pares), capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


@unittest.skipUnless(NODE, "precisa do node")
class Datas(unittest.TestCase):
    def test_virada_grava_e_app_mostra_relativo(s):
        ref = date(2026, 11, 17)  # terça
        casos = [("Senado vota hoje a PEC", "Senado vota hoje a PEC", "="),  # 18/11: sem verbo no passado, "ontem" não entra
                 ("Copom decide amanhã", "Copom decide amanhã", "Copom decide hoje"),
                 ("Hoje, o Senado aprovou", "Hoje, o Senado aprovou", "="),  # verbo depois da data: fica a data
                 ("Votação fica para depois de hoje", None, None)]
        for orig, no_dia, dia_seguinte in casos:
            gravado, n = VA.reescreve(orig, ref)
            s.assertTrue(n >= 1, orig)
            s.assertRegex(gravado, r"\((1[78])\)", "a virada grava o dia com o número")
            if no_dia is None: continue
            r = app([[gravado, "2026-11-17"], [gravado, "2026-11-18"], [gravado, "2026-11-20"]])
            s.assertEqual(r[0], no_dia, gravado)
            s.assertEqual(r[1], gravado if dia_seguinte == "=" else dia_seguinte, gravado)
            s.assertEqual(r[2], gravado, "longe do dia, fica a data")

    def test_app_formas(s):
        h = "2026-11-17"
        casos = {"até a terça (17)": "até hoje", "desde a segunda (16)": "desde ontem", "de terça (17)": "de hoje",
                 "Na noite de segunda (16)": "Na noite de segunda (16)", "O Senado votou na noite de segunda (16)": "O Senado votou ontem à noite", "Terça-feira (17): Senado vota": "Hoje: Senado vota",
                 "na terça (17/11)": "hoje", "na terça (17/12)": "na terça (17/12)", "na quinta (19)": "na quinta (19)",
                 "antes da segunda (16)": "antes da segunda (16)", "depois de quarta (18)": "depois de quarta (18)",
                 "na quarta (17)": "na quarta (17)"}
        r = app([[k, h] for k in casos])
        for (k, e), got in zip(casos.items(), r): s.assertEqual(got, e, k)

    def test_validar_aceita_o_mes(s):
        m = V.DIA_NUM.search("O Senado vota na terça (17/11)")
        s.assertTrue(m and m.group(2) == "17" and m.group(3) == "11")

    def test_manual_diz_que_o_app_faz_o_relativo(s):
        t = open(os.path.join(AQUI, "manual.md"), encoding="utf-8").read()
        s.assertIn("O app mostra sozinho \"hoje\", \"ontem\" ou \"amanhã\"", t)


if __name__ == "__main__":
    unittest.main()
