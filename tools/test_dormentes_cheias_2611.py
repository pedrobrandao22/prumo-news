#!/usr/bin/env python3
"""26/11: tirar da edição uma notícia velha com a lista de dormentes cheia não é erro (a poda das 40 mais recentes a
descarta); tirar uma notícia nova sem guardá-la continua sendo erro. Usa a edição fixa dos testes (fonte/edicao-teste)."""
import copy, json, os, subprocess, sys, tempfile, unittest
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import validar as V
FEED = os.path.join(AQUI, "..", "fonte", "edicao-teste", "feed.json")

def ult(p): return max([str(p.get("hora") or "")] + [str(u.get("hora") or "") for u in p.get("atualizacoes") or []])
def roda(args, cwd): return subprocess.run([sys.executable, "-I"] + args, cwd=cwd, capture_output=True, text=True)

class T(unittest.TestCase):
    def setUp(s):
        s.base = json.load(open(FEED, encoding="utf-8"))
        # lista de dormentes cheia, todas mais recentes que a notícia mais velha da edição
        ps = sorted(s.base["pautas"], key=ult); s.velha, s.nova = ps[0], ps[-1]
        mod = (s.base.get("dormentes") or [{}])[0]
        s.base["dormentes"] = [dict(mod, id=f"dormente-teste-{i}", titulo=f"Dormente de teste {i}", ultima=ult(s.nova)) for i in range(V.MAX_DORMENTES)]
        s.d = tempfile.mkdtemp(); json.dump(s.base, open(os.path.join(s.d, "anterior.json"), "w", encoding="utf-8"), ensure_ascii=False)
    def valida(s, novo):
        json.dump(novo, open(os.path.join(s.d, "novo.json"), "w", encoding="utf-8"), ensure_ascii=False)
        r = roda([os.path.join(AQUI, "validar.py"), "novo.json", "--prev", "anterior.json"], s.d)
        return [l for l in r.stdout.splitlines() if "saíram sem ir para dormentes" in l]
    def test_velha_sai_com_lista_cheia(s):
        novo = copy.deepcopy(s.base); novo["pautas"] = [p for p in novo["pautas"] if p["id"] != s.velha["id"]]
        s.assertLess(ult(s.velha)[:16], ult(s.nova)[:16])
        s.assertEqual(s.valida(novo), [])
    def test_nova_que_some_continua_erro(s):
        novo = copy.deepcopy(s.base); novo["pautas"] = [p for p in novo["pautas"] if p["id"] != s.nova["id"]]
        for d in novo["dormentes"]: d["ultima"] = ult(s.velha)   # a que sumiu é mais nova que todas as guardadas
        json.dump(dict(s.base, dormentes=novo["dormentes"]), open(os.path.join(s.d, "anterior.json"), "w", encoding="utf-8"), ensure_ascii=False)
        e = s.valida(novo); s.assertEqual(len(e), 1); s.assertIn(s.nova["id"], e[0])
    def test_lista_com_folga_continua_erro(s):
        novo = copy.deepcopy(s.base); novo["dormentes"] = novo["dormentes"][:5]
        novo["pautas"] = [p for p in novo["pautas"] if p["id"] != s.velha["id"]]
        json.dump(dict(s.base, dormentes=novo["dormentes"]), open(os.path.join(s.d, "anterior.json"), "w", encoding="utf-8"), ensure_ascii=False)
        e = s.valida(novo); s.assertEqual(len(e), 1); s.assertIn(s.velha["id"], e[0])

if __name__ == "__main__":
    unittest.main()
