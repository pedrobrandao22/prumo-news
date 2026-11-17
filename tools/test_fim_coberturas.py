#!/usr/bin/env python3
"""FIM das coberturas (17/11, Pedro): toda cobertura nova tem "fim" (critério de encerramento); atingido o fim, ela é
encerrada, não recebe mais atualização (logo, não manda aviso) e fato novo do tema abre cobertura nova.

  cd tools && python3 -I -m pytest -q test_fim_coberturas.py
"""
import copy, os, sys, unittest
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402
import aplicar as AP  # noqa: E402

AGORA = datetime.fromisoformat("2026-11-17T09:48:00-03:00")


def pauta(pid="escala-6x1", **kw):
    p = {"id": pid, "secao": "politica", "subtema": "Congresso", "tipo": "cobertura", "status": "ativa", "tag": "Câmara",
         "tema": "Escala 6x1", "fim": "Aprovação e promulgação da PEC", "hora": "2026-11-17T08:00:00-03:00", "prioridade": 50,
         "neutro": {"titulo": "Câmara aprova a PEC do fim da escala 6x1", "texto": "x", "pontos": ["a", "b", "c"]},
         "atualizacoes": [{"hora": "2026-11-17T08:00:00-03:00", "texto": "Câmara aprova em 2º turno."}]}
    p.update(kw)
    return p


def fim(f, ant):
    V.erros.clear(); V.avisos.clear()
    for p in f["pautas"]: V.checar_fim(p, p["id"], ant)
    return list(V.erros), list(V.avisos)


class Validar(unittest.TestCase):
    def test_com_fim_nao_reclama(s):
        f = {"pautas": [pauta()]}
        s.assertEqual(fim(f, copy.deepcopy(f)), ([], []))

    def test_cobertura_nova_sem_fim_e_erro(s):
        p = pauta(); p.pop("fim")
        er, _ = fim({"pautas": [p]}, {"pautas": []})
        s.assertTrue(any("cobertura nova sem \"fim\"" in e for e in er), er)

    def test_cobertura_antiga_sem_fim_e_aviso(s):
        p = pauta(); p.pop("fim")
        er, av = fim({"pautas": [p]}, {"pautas": [copy.deepcopy(p)]})
        s.assertEqual(er, []); s.assertTrue(any("sem \"fim\"" in a for a in av), av)
        er, av = fim({"pautas": [p]}, None)
        s.assertEqual(er, []); s.assertTrue(av)

    def test_pontual_nao_precisa(s):
        p = pauta(tipo="pontual"); p.pop("fim")
        s.assertEqual(fim({"pautas": [p]}, {"pautas": []}), ([], []))

    def test_fim_longo_ou_vazio(s):
        er, _ = fim({"pautas": [pauta(fim="x" * 161)]}, None)
        s.assertTrue(any("161 caracteres" in e for e in er), er)
        er, _ = fim({"pautas": [pauta(fim="  ")]}, None)
        s.assertTrue(er)

    def test_encerrada_nao_recebe_atualizacao_nem_reabre(s):
        ant = {"pautas": [pauta(status="encerrada", desfecho="PEC promulgada em 17/11.")]}
        p = pauta(status="encerrada", desfecho="PEC promulgada em 17/11.")
        p["atualizacoes"] = p["atualizacoes"] + [{"hora": "2026-11-18T08:00:00-03:00", "texto": "Governo prepara a regulamentação."}]
        er, _ = fim({"pautas": [p]}, ant)
        s.assertTrue(any("encerrada recebeu atualização" in e for e in er), er)
        er, _ = fim({"pautas": [pauta(status="ativa")]}, ant)
        s.assertTrue(any("não reabre" in e for e in er), er)
        er, _ = fim({"pautas": [pauta(status="encerrada", desfecho="PEC promulgada em 17/11.")]}, ant)
        s.assertEqual(er, [])

    def test_encerrar_na_rodada_vale(s):
        """O fato final e o encerramento entram na mesma rodada."""
        ant = {"pautas": [pauta()]}
        p = pauta(status="encerrada", desfecho="PEC promulgada em 17/11.")
        p["atualizacoes"] = p["atualizacoes"] + [{"hora": "2026-11-17T09:48:00-03:00", "texto": "Congresso promulga a PEC."}]
        s.assertEqual(fim({"pautas": [p]}, ant)[0], [])


class Aplicar(unittest.TestCase):
    def feed(s, *ps, dormentes=None):
        return {"atualizado_em": "2026-11-17T08:00:00-03:00", "pautas": list(ps), "dormentes": dormentes or []}

    def test_add_pauta_sem_fim_recusa(s):
        F = AP.Feed(s.feed(), AGORA)
        p = pauta("nova"); p.pop("fim")
        with s.assertRaises(AP.Recusa) as c: F.aplicar({"op": "add_pauta", "pauta": p})
        s.assertIn("fim", str(c.exception))
        F.aplicar({"op": "add_pauta", "pauta": pauta("nova")})
        pt = pauta("pt", tipo="pontual"); pt.pop("fim")
        F.aplicar({"op": "add_pauta", "pauta": pt})
        s.assertEqual([x["id"] for x in F.f["pautas"]], ["nova", "pt"])

    def test_encerrada_recusa_update_add(s):
        F = AP.Feed(s.feed(pauta(status="encerrada")), AGORA)
        with s.assertRaises(AP.Recusa) as c:
            F.aplicar({"op": "update_add", "pid": "escala-6x1", "hora": "09h48", "texto": "Fato novo.", "manter_titulo": True})
        s.assertIn("cobertura nova", str(c.exception))

    def test_encerrar_na_mesma_rodada(s):
        F = AP.Feed(s.feed(pauta()), AGORA)
        F.aplicar({"op": "update_add", "pid": "escala-6x1", "hora": "09h48", "texto": "Congresso promulga a PEC.", "titulo": "Congresso promulga a PEC da escala 6x1"})
        F.aplicar({"op": "set", "pid": "escala-6x1", "path": "status", "value": "encerrada"})
        s.assertEqual(F.f["pautas"][0]["status"], "encerrada")

    def test_dormente_encerrada_nao_volta(s):
        dor = [{"id": "escala-6x1", "secao": "politica", "tema": "Escala 6x1", "status": "encerrada", "fim": "Promulgação"}]
        F = AP.Feed(s.feed(dormentes=dor), AGORA)
        with s.assertRaises(AP.Recusa): F.aplicar({"op": "add_pauta", "pauta": pauta()})
        F.aplicar({"op": "add_pauta", "pauta": pauta("implementacao-6x1", tema="Implementação da escala 6x1", fim="Entrada em vigor das novas regras")})

    def test_dormente_ativa_volta_com_o_fim(s):
        dor = [{"id": "escala-6x1", "secao": "politica", "tema": "Escala 6x1", "status": "ativa", "fim": "Promulgação"}]
        F = AP.Feed(s.feed(dormentes=dor), AGORA)
        p = pauta(); p.pop("fim")
        F.aplicar({"op": "add_pauta", "pauta": p})
        s.assertEqual(F.f["pautas"][0]["fim"], "Promulgação")

    def test_fim_se_mantem_e_vai_para_dormentes(s):
        base = s.feed(pauta())
        F = s.feed(pauta()); F["pautas"][0].pop("fim")       # a completa reescreveu sem o fim
        AP.coberturas(F, base, AGORA)
        s.assertEqual(F["pautas"][0]["fim"], "Aprovação e promulgação da PEC")
        F2 = s.feed()
        AP.coberturas(F2, base, AGORA)
        s.assertEqual(F2["dormentes"][0]["fim"], "Aprovação e promulgação da PEC")


if __name__ == "__main__":
    unittest.main()
