#!/usr/bin/env python3
"""Corretor 22/11: foto de arquivo pelo lugar do fato, nunca pelo gentílico de quem age.

Achado "foto-drone-em-kiev-com-o-kremlin-de-moscou": "Drone russo atinge prédio perto de Kiev" abria com o Kremlin
porque "russo" era palavra do assunto Rússia e o app fica com a primeira palavra achada no título (posPalavra/ft157AchaEm).
Gera a CLASSE: títulos de ataque/ação com o gentílico de um país e o lugar de outro, imitando a busca do app.

  python3 tools/test_fotos_gentilico_2211.py
"""
import os, re, sys, unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import fotos_arquivo as FA  # noqa: E402


def pos_palavra(t, k):
    """o mesmo que posPalavra do app (031): palavra inteira, maiúsculas contam"""
    if k not in t: return -1
    m = re.search(r"(^|[^\w])" + re.escape(k) + r"(?=$|[^\w])", t)
    return m.start() + len(m.group(1)) if m else -1


def assunto_do_titulo(tit, assuntos):
    """o mesmo critério do app: a palavra que aparece primeiro (empate: a mais longa)"""
    best, pos, ln = None, 10 ** 9, 0
    for nome, x in assuntos.items():
        for k in x["chaves"]:
            i = pos_palavra(tit, k)
            if i >= 0 and (i < pos or (i == pos and len(k) > ln)): best, pos, ln = nome, i, len(k)
    return best


ASS = {n: {"chaves": FA.chaves_do_assunto(v[0])} for n, v in FA.ASSUNTOS.items()}


class Gentilico(unittest.TestCase):
    def test_caso_do_dia(self):
        self.assertEqual(assunto_do_titulo("Drone russo atinge prédio perto de Kiev; 14 estão desaparecidos", ASS), "Ucrânia")

    def test_classe(self):
        casos = [
            ("Drone russo atinge prédio perto de Kiev; 14 estão desaparecidos", "Ucrânia"),
            ("Míssil russo mata 5 em Kyiv durante a madrugada", "Ucrânia"),
            ("Drone ucraniano atinge prédio perto de Moscou", "Rússia"),
            ("Ataque israelense deixa 20 mortos em Gaza", "Gaza"),
            ("Bombardeio israelense atinge Teerã", "Irã"),
            ("Míssil iraniano é interceptado sobre Tel Aviv", "Israel"),
            ("Navio chinês é acusado de cortar cabo perto do Japão", "Japão"),
            ("Exército russo avança no leste", None),          # sem lugar: fica o tema da seção
            ("Governo chinês anuncia novo plano", None),
        ]
        for tit, esperado in casos:
            with self.subTest(tit=tit):
                self.assertEqual(assunto_do_titulo(tit, ASS), esperado)

    def test_nunca_o_pais_do_gentilico(self):
        # com outro assunto no título (refinaria, soja), vale ele; nunca o país de quem age
        for tit, nao in [("Drone ucraniano atinge refinaria perto de Moscou", "Ucrânia"), ("Governo chinês anuncia tarifa sobre soja", "China"),
                         ("Caça israelense derruba drone sobre o Líbano", "Israel"), ("Tanque russo é destruído em Kharkiv", "Rússia")]:
            with self.subTest(tit=tit): self.assertNotEqual(assunto_do_titulo(tit, ASS), nao)

    def test_nomes_de_pais_continuam(self):
        for tit, esp in [("Rússia e Ucrânia retomam conversa em Istambul", "Rússia"), ("Kremlin diz que Putin fala com Trump", "Rússia"),
                         ("China corta juros", "China"), ("Paris tem greve geral", "França")]:
            with self.subTest(tit=tit): self.assertEqual(assunto_do_titulo(tit, ASS), esp)

    def test_nenhum_gentilico_vai_para_o_app(self):
        for nome, v in FA.ASSUNTOS.items():
            for k in FA.chaves_do_assunto(v[0]):
                self.assertIsNone(FA.GENTILICOS.match(k), f"{nome}: {k}")
        # controle: o filtro reconhece os gentílicos antigos
        for g in ["russo", "russa", "ucraniano", "israelense", "chinês", "chinesa", "alemão", "britânica", "japonês", "iraniano"]:
            self.assertTrue(FA.GENTILICOS.match(g), g)
        # e não come palavras de assunto
        for k in ["Rússia", "Kiev", "Argentina", "Índia", "petróleo", "trem", "Internacional", "Bahia"]:
            self.assertIsNone(FA.GENTILICOS.match(k), k)


if __name__ == "__main__":
    unittest.main(verbosity=1)
