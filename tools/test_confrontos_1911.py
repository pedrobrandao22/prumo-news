#!/usr/bin/env python3
"""Corretor 19/11, causa hoje-depois-da-meia-noite: título de Esportes com dois times ligados por "e" e verbo de jogo,
sem o confronto com "x", é ambíguo ("Flamengo e Palmeiras jogam às 20h30" eram dois jogos). O validar.py avisa.

  cd tools && python3 -I test_confrontos_1911.py
"""
import os, sys, unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402


def avisos(ps):
    V.erros.clear(); V.avisos.clear()
    V.checar_confrontos_1911({"pautas": ps})
    return [a for a in V.avisos if "parece um jogo" in a]


def p(titulo, secao="esportes", **kw):
    d = {"id": "b", "secao": secao, "neutro": {"titulo": titulo}}
    d.update(kw); return d


class T(unittest.TestCase):
    def test_casos_do_testador(self):
        self.assertTrue(avisos([p("Flamengo e Palmeiras jogam às 20h30 de quarta (18); líder tem 76")]))
        self.assertTrue(avisos([p("Flamengo e Palmeiras tinham jogo às 20h30 de quarta (18); líder tem 76")]))
        self.assertTrue(avisos([p("x", subtitulo="Flamengo (76) e Palmeiras (73) jogam às 20h30 de quarta (18).")]))
        self.assertTrue(avisos([p("x", social=["Corinthians e Grêmio enfrentam rivais diretos."])]))

    def test_sem_ambiguidade(self):
        self.assertFalse(avisos([p("Brasileirão: Cruzeiro x Palmeiras e Flamengo x Athletico-PR, às 20h30 de quarta (18)")]))
        self.assertFalse(avisos([p("Flamengo pega o Athletico-PR e Palmeiras visita o Cruzeiro às 20h30")]))
        self.assertFalse(avisos([p("Palmeiras x Flamengo é no sábado (21)")]))
        self.assertFalse(avisos([p("Lula e Alckmin jogam no mesmo time", secao="politica")]))  # só Esportes


if __name__ == "__main__":
    unittest.main()
