#!/usr/bin/env python3
"""Corretor 18/11: EVENTO DE HOJE PARADO (manual 3b). Título que anuncia algo para hoje sem fato novo à tarde vira pendência.

  cd tools && python3 -I test_evento_hoje_1811.py
"""
import os, sys, unittest
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402


def pauta(pid, titulo, hora, ups=(), secao="politica", status="ativa"):
    return {"id": pid, "secao": secao, "status": status, "hora": hora, "neutro": {"titulo": titulo},
            "atualizacoes": [{"hora": h, "texto": t} for h, t in ups]}


def pend(ps, quando):
    return [x for x in V.pendencias({"pautas": ps}, datetime.fromisoformat(quando)) if x["tipo"] == "evento_de_hoje_parado"]


VOTA = pauta("ajuste", "Senado vota os quatro destaques do ajuste fiscal na terça (17)", "2026-11-17T06:52:00-03:00")
JOGO = pauta("selecao", "Seleção enfrenta Singapura na terça (17), às 7h", "2026-11-17T06:30:00-03:00", secao="esportes")


class EventoDeHoje(unittest.TestCase):
    def test_votacao_parada_a_tarde(self):
        r = pend([VOTA], "2026-11-17T16:50:00-03:00")
        self.assertEqual([x["pid"] for x in r], ["ajuste"])
        self.assertIn("17/11 06h52", r[0]["texto"]); self.assertIn("EVENTO DE HOJE", r[0]["texto"])

    def test_de_manha_nao_cobra(self):
        self.assertEqual(pend([VOTA], "2026-11-17T11:00:00-03:00"), [])

    def test_atualizada_a_tarde_nao_cobra(self):
        p = pauta("ajuste", VOTA["neutro"]["titulo"], VOTA["hora"], [("2026-11-17T15:10:00-03:00", "Sem novidade desde 7h; a votação ainda não começou.")])
        self.assertEqual(pend([p], "2026-11-17T16:50:00-03:00"), [])

    def test_correcao_nao_conta_como_fato(self):
        p = pauta("ajuste", VOTA["neutro"]["titulo"], VOTA["hora"], [("2026-11-17T15:10:00-03:00", "Correção: troca de nome.")])
        self.assertEqual(len(pend([p], "2026-11-17T16:50:00-03:00")), 1)

    def test_com_horario_cobra_3h_depois(self):
        self.assertEqual(pend([JOGO], "2026-11-17T09:30:00-03:00"), [])
        self.assertEqual([x["pid"] for x in pend([JOGO], "2026-11-17T10:05:00-03:00")], ["selecao"])

    def test_outro_dia_nao_e_hoje(self):
        p = pauta("putin", "Kremlin confirma encontro de Putin, Xi e Trump na quinta (19)", "2026-11-17T06:00:00-03:00", secao="mundo")
        self.assertEqual(pend([p], "2026-11-17T17:00:00-03:00"), [])

    def test_desfecho_no_passado_nao_cobra(self):
        p = pauta("adiada", "Votação do ajuste fiscal foi adiada na terça (17)", "2026-11-17T08:00:00-03:00")
        self.assertEqual(pend([p], "2026-11-17T17:00:00-03:00"), [])

    def test_encerrada_e_fim_de_semana(self):
        enc = pauta("enc", VOTA["neutro"]["titulo"], VOTA["hora"], status="encerrada")
        self.assertEqual(pend([enc], "2026-11-17T16:50:00-03:00"), [])
        sab = pauta("serie-b", "Série B fecha no sábado (21) com 7 jogos", "2026-11-21T07:00:00-03:00", secao="esportes")
        self.assertEqual([x["pid"] for x in pend([sab], "2026-11-21T15:00:00-03:00")], ["serie-b"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
