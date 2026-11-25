#!/usr/bin/env python3
"""25/11: placares.py lê os jogos da Agenda e acha o placar na ESPN (fixture offline)."""
import json, os, sys, unittest
from datetime import datetime
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import placares as P
FIX = os.path.join(AQUI, "fixtures", "placares")
FEED = {"agenda": [{"data": "2026-11-25", "hora": "20h", "texto": "Brasileirão: Atlético-MG x Corinthians, jogo atrasado da 36ª rodada", "pid": "brasileirao-37-rodada-z4"},
                   {"data": "2026-11-25", "hora": "10h", "texto": "Plenário do Senado analisa a Força Nacional do SUS", "pid": ""}]}

class T(unittest.TestCase):
    def test_times(s):
        s.assertEqual(P.times_da_agenda("Brasileirão: Atlético-MG x Corinthians, jogo atrasado"), ("Atlético-MG", "Corinthians"))
        s.assertEqual(P.times_da_agenda("Final da Libertadores: Estudiantes x Palmeiras, em Montevidéu"), ("Estudiantes", "Palmeiras"))
        s.assertIsNone(P.times_da_agenda("Plenário do Senado analisa a PEC"))
    def test_nomes(s):
        s.assertTrue(P.casa("Atlético-MG", "Atletico Mineiro"))
        s.assertTrue(P.casa("Estudiantes", "Estudiantes de La Plata"))
        s.assertFalse(P.casa("Atlético-MG", "Athletico-PR"))
    def test_encerrado(s):
        j, _ = P.montar(FEED, datetime.fromisoformat("2026-11-26T01:30:00+00:00"), FIX)
        s.assertEqual(len(j), 1); s.assertEqual(j[0]["estado"], "encerrado")
        s.assertEqual(j[0]["texto"], "Terminou: Atlético-MG 2 x 1 Corinthians.")
        s.assertEqual(j[0]["pid"], "brasileirao-37-rodada-z4")
    def test_sem_jogo_na_agenda(s):
        j, _ = P.montar({"agenda": []}, datetime.fromisoformat("2026-11-26T01:30:00+00:00"), FIX)
        s.assertEqual(j, [])

if __name__ == "__main__":
    unittest.main()
