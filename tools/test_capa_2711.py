#!/usr/bin/env python3
"""27/11: topo da Capa completo. Manchete e destaques de Política e Economia: cobertura, com Direita/Esquerda (ou
sem_versoes com motivo) e, na manchete, um visual. ERRO só para o que a rodada mexeu (ou tudo, com --topo)."""
import copy, json, os, subprocess, sys, tempfile, unittest
AQUI = os.path.dirname(os.path.abspath(__file__))
FEED = os.path.join(AQUI, "..", "fonte", "edicao-teste", "feed.json")
LADO = {"titulo": "Título de um lado", "texto": "Texto de um lado.", "pontos": ["Um.", "Dois.", "Três."]}
VIS = [{"tipo": "linha_do_tempo", "titulo": "Passo a passo", "itens": [{"quando": "segunda (23)", "texto": "A"}, {"quando": "terça (24)", "texto": "B"}, {"quando": "quarta (25)", "texto": "C"}]}]

@unittest.skipUnless(__import__("re").search(r"^TOPO_ERRO = True", open(os.path.join(AQUI, "validar.py"), encoding="utf-8").read(), __import__("re").M), "regra do topo está só como aviso (28/11)")
class T(unittest.TestCase):
    def setUp(s):
        s.base = json.load(open(FEED, encoding="utf-8")); s.d = tempfile.mkdtemp()
        P = {p["id"]: p for p in s.base["pautas"]}
        pol = [p for p in s.base["pautas"] if p["secao"] in ("politica", "economia")]
        s.m, s.dq = pol[0], pol[1]
        outros = [p["id"] for p in s.base["pautas"] if p["secao"] not in ("politica", "economia")][:2]
        s.base["capa"] = dict(s.base.get("capa") or {}, manchete=s.m["id"], destaques=[s.dq["id"]] + outros)
        for p in (s.m, s.dq):   # ponto de partida: topo completo
            p["tipo"] = "cobertura"; p["direita"] = dict(LADO); p["esquerda"] = dict(LADO); p["visuais"] = copy.deepcopy(VIS); p.pop("sem_versoes", None)
    def roda(s, novo, ant=None, extra=()):
        json.dump(novo, open(os.path.join(s.d, "novo.json"), "w", encoding="utf-8"), ensure_ascii=False)
        args = [sys.executable, "-I", os.path.join(AQUI, "validar.py"), "novo.json"]
        if ant is not None:
            json.dump(ant, open(os.path.join(s.d, "anterior.json"), "w", encoding="utf-8"), ensure_ascii=False); args += ["--prev", "anterior.json"]
        r = subprocess.run(args + list(extra), cwd=s.d, capture_output=True, text=True)
        L = [l for l in r.stdout.splitlines() if "TOPO DA CAPA" in l or "sem_versoes" in l]
        return [l for l in L if l.startswith("ERRO")], [l for l in L if l.startswith("AVISO")]
    def pauta(s, f, pid): return next(p for p in f["pautas"] if p["id"] == pid)
    def test_topo_completo_passa(s):
        e, a = s.roda(copy.deepcopy(s.base), s.base); s.assertEqual((e, a), ([], []))
    def test_manchete_pontual_mexida_e_erro(s):
        n = copy.deepcopy(s.base); p = s.pauta(n, s.m["id"]); p["tipo"] = "pontual"
        e, a = s.roda(n, s.base); s.assertEqual(len(e), 1); s.assertIn("formato curto", e[0])
    def test_destaque_sem_versao_mexido_e_erro_herdado_e_aviso(s):
        ant = copy.deepcopy(s.base); p = s.pauta(ant, s.dq["id"]); p["direita"] = p["esquerda"] = None
        e, a = s.roda(copy.deepcopy(ant), ant); s.assertEqual(e, []); s.assertTrue(any("sem versão Direita nem Esquerda" in x for x in a))
        n = copy.deepcopy(ant); s.pauta(n, s.dq["id"])["subtitulo"] = "Subtítulo novo da rodada."
        e, a = s.roda(n, ant); s.assertEqual(len(e), 1); s.assertIn(s.dq["id"], e[0])
    def test_topo_estrito_da_manha(s):
        ant = copy.deepcopy(s.base); p = s.pauta(ant, s.dq["id"]); p["direita"] = p["esquerda"] = None
        e, a = s.roda(copy.deepcopy(ant), ant, ["--topo"]); s.assertEqual(len(e), 1)
    def test_sem_versoes_com_motivo_dispensa(s):
        n = copy.deepcopy(s.base); p = s.pauta(n, s.dq["id"]); p["direita"] = p["esquerda"] = None
        p["sem_versoes"] = "Só agências e veículos de centro noticiaram; nenhum lado deu foco próprio."
        e, a = s.roda(n, s.base); s.assertEqual(e, [])
        p["sem_versoes"] = "não tem"
        e, a = s.roda(n, s.base); s.assertEqual(len(e), 2)
    def test_um_lado_so_basta_no_destaque(s):
        n = copy.deepcopy(s.base); s.pauta(n, s.dq["id"])["esquerda"] = None
        e, a = s.roda(n, s.base); s.assertEqual(e, [])
    def test_manchete_sem_visual(s):
        n = copy.deepcopy(s.base); s.pauta(n, s.m["id"])["visuais"] = []
        e, a = s.roda(n, s.base); s.assertEqual(len(e), 1); s.assertIn("manchete sem visual", e[0])
    def test_destaque_de_outra_secao_nao_e_cobrado(s):
        n = copy.deepcopy(s.base); o = s.pauta(n, n["capa"]["destaques"][1]); o["direita"] = o["esquerda"] = None; o["subtitulo"] = "Mexida."
        e, a = s.roda(n, s.base); s.assertEqual(e, [])
    def test_virada_e_conferencia_sem_anterior_so_avisam(s):
        n = copy.deepcopy(s.base); s.pauta(n, s.m["id"])["tipo"] = "pontual"
        e, a = s.roda(n); s.assertEqual(e, []); s.assertEqual(len(a), 1)
        e, a = s.roda(n, s.base, ["--virada"]); s.assertEqual(e, [])

if __name__ == "__main__":
    unittest.main()
