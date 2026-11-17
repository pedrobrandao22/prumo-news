#!/usr/bin/env python3
"""Regras de 17/11 (corretor): "O que vem agora" e Entenda com prazo vencido; Entenda "agora" parado.

  cd tools && python3 -I test_regras_1711.py
"""
import os, sys, unittest
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402


def roda(f, agora):
    V.erros.clear(); V.avisos.clear()
    V.checar_regras_1711(f, None, V.dt(f["atualizado_em"]), agora, False)
    return list(V.erros), list(V.avisos)


def pauta(**kw):
    p = {"id": "dolar", "secao": "economia", "hora": "2026-11-13T18:00:00-03:00",
         "neutro": {"titulo": "Dólar sobe mais de 2% e fecha a R$ 5,77; Ibovespa cai 1,83%", "texto": "x"},
         "atualizacoes": [{"hora": "2026-11-16T17:30:00-03:00", "texto": "Dólar fecha a R$ 5,77."}]}
    p.update(kw); return p


class Teste(unittest.TestCase):
    def test_entenda_agora_parado_na_sexta(s):
        """16/11, 21h55: 'Quanto custa o dólar agora?' → 'R$ 5,65 no fechamento de sexta (13); o mercado reabre na segunda (16).'"""
        p = pauta(faq=[{"p": "Por que subiu?", "r": "Fiscal."},
                       {"p": "Quanto custa o dólar agora?", "r": "R$ 5,65 no fechamento de sexta (13); o mercado reabre na segunda (16)."}])
        f = {"atualizado_em": "2026-11-16T21:48:00-03:00", "pautas": [p]}
        _, av = roda(f, datetime.fromisoformat("2026-11-17T00:55:00-03:00"))
        s.assertTrue(any("faq.1" in a and "agora" in a for a in av), av)
        s.assertTrue(any("faq.1.r anuncia no futuro" in a for a in av), av)

    def test_entenda_com_outro_valor_do_titulo(s):
        p = pauta(faq=[{"p": "Quanto custa o dólar agora?", "r": "R$ 5,79, a cotação de segunda (16)."}])
        f = {"atualizado_em": "2026-11-16T21:48:00-03:00", "pautas": [p]}
        _, av = roda(f, datetime.fromisoformat("2026-11-16T21:55:00-03:00"))
        s.assertTrue(any("R$ 5,79" in a and "R$ 5,77" in a for a in av), av)

    def test_entenda_certo_nao_avisa(s):
        p = pauta(faq=[{"p": "Quanto custa o dólar agora?", "r": "R$ 5,77 no fechamento de segunda (16), o maior valor desde abril de 2025."}])
        f = {"atualizado_em": "2026-11-17T07:02:00-03:00", "pautas": [p]}
        _, av = roda(f, datetime.fromisoformat("2026-11-17T09:00:00-03:00"))
        s.assertEqual(av, [])

    def test_o_que_vem_agora_vencido(s):
        """17/11 0h: 'Lula volta da viagem na segunda (16) e decide a formação dos ministérios'."""
        p = pauta(id="ministerios", secao="politica", neutro={"titulo": "Alckmin: Lula define ministérios após a viagem", "texto": "x"},
                  atualizacoes=[], proximo="Lula volta da viagem na segunda (16) e decide a formação dos ministérios.")
        f = {"atualizado_em": "2026-11-17T00:05:00-03:00", "pautas": [p]}
        _, av = roda(f, datetime.fromisoformat("2026-11-17T04:00:00-03:00"))
        s.assertTrue(any("[ministerios] proximo" in a for a in av), av)
        p["proximo"] = "Lula volta da viagem na quarta (18) e decide a formação dos ministérios."
        _, av = roda(f, datetime.fromisoformat("2026-11-17T04:00:00-03:00"))
        s.assertEqual(av, [])

    def test_validar_inteiro_roda(s):
        import json
        with open(os.path.join(AQUI, "..", "feed.json"), encoding="utf-8") as fh: f = json.load(fh)
        V.erros.clear(); V.avisos.clear()
        V.checar(f)
        s.assertFalse(any("regras de 17/11 falhou" in a for a in V.avisos), [a for a in V.avisos if "17/11" in a])


if __name__ == "__main__":
    unittest.main()
