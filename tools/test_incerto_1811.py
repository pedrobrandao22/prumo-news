#!/usr/bin/env python3
"""Corretor 18/11 (tarde): "sem confirmação" não vira título, e notícia com resultado em aberto não dá o fato como feito.

  cd tools && python3 -I test_incerto_1811.py
"""
import os, sys, unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402

REF = "2026-11-17T21:50:00-03:00"


def roda(f, virada=False):
    V.erros.clear(); V.avisos.clear()
    V.checar_incerto_1811(f, V.dt(f["atualizado_em"]), virada)
    return list(V.erros), list(V.avisos)


def ajuste(**kw):
    """A matéria do ajuste na edição das 21h50 de terça (17/11), como o testador viu."""
    p = {"id": "ajuste-fiscal-lula-4", "secao": "politica", "hora": "2026-11-17T06:52:00-03:00",
         "neutro": {"titulo": "Governo retira urgência do PL das bets para votar o ajuste fiscal", "texto": "x"},
         "proximo": "Concluída a votação dos destaques no Senado, o texto segue para a Câmara, cujo presidente vai consultar os líderes.",
         "faq": [{"p": "O que é o Plano Moretti?", "r": "O projeto enviado ao Senado na quarta (11); o texto-base foi aprovado na quinta (12)."},
                 {"p": "O que falta no Senado?", "r": "Quatro destaques, votados na terça (17): dois sobre créditos tributários."}],
         "visuais": [{"tipo": "linha_do_tempo", "titulo": "Como a história andou", "itens": [
             {"quando": "12/11", "texto": "Senado aprova o texto-base por 45 a 31"},
             {"quando": "17/11", "texto": "Senado vota os quatro destaques; o texto segue para a Câmara"}]}],
         "atualizacoes": [{"hora": "2026-11-17T19:50:00-03:00", "texto": "O governo retirou a urgência do projeto das bets."},
                          {"hora": "2026-11-17T21:48:00-03:00", "texto": "Os quatro destaques estavam previstos para terça (17); o resultado não foi confirmado até as 21h48."}]}
    p.update(kw); return p


class SemConfirmacao(unittest.TestCase):
    def test_titulos_da_noite_de_17(s):
        for t in ["Sem votação confirmada do PL das big techs na Câmara na terça (17)",
                  "Sem decisão confirmada da Aneel sobre a Enel-SP na terça (17)",
                  "Placar de Brasil x Singapura não foi confirmado; Seleção perdeu do Japão",
                  "Desfecho da votação da Aneel sobre a Enel-SP segue sem confirmação"]:
            f = {"atualizado_em": REF, "pautas": [{"id": "x", "neutro": {"titulo": t}}]}
            er, _ = roda(f)
            s.assertTrue(any("SEM CONFIRMAÇÃO" in e for e in er), t)

    def test_titulo_com_fato_passa(s):
        for t in ["Kremlin confirma encontro de Putin, Xi e Trump em Shenzhen na quinta (19)",
                  "Sem acordo, Senado deixa os 5 destaques do ajuste para quarta (18)",
                  "Planalto não confirma viagem de Lula à COP31",
                  "Aneel decide na terça (17) se recomenda a caducidade da Enel-SP"]:
            f = {"atualizado_em": REF, "pautas": [{"id": "x", "neutro": {"titulo": t}}]}
            er, av = roda(f)
            s.assertEqual((er, av), ([], []), t)

    def test_ultimas_e_breves(s):
        f = {"atualizado_em": REF, "pautas": [],
             "breves": [{"titulo": "Placar do amistoso com Singapura sem confirmação"}],
             "mudancas": {"itens": [{"texto": "Ajuste fiscal: destaques no Senado sem desfecho confirmado"},
                                    {"texto": "Nvidia divulga o balanço: receita de US$ 115,8 bi"}]}}
        er, av = roda(f)
        s.assertTrue(any(e.startswith("breves.0") for e in er), er)
        s.assertEqual([a[:17] for a in av], ["mudancas.itens.0."])

    def test_virada_so_avisa(s):
        f = {"atualizado_em": REF, "pautas": [{"id": "x", "neutro": {"titulo": "Sem decisão confirmada da Aneel"}}]}
        er, av = roda(f, virada=True)
        s.assertEqual(er, []); s.assertEqual(len(av), 1)

    def test_paginas_consultadas_e_bastidor(s):
        s.assertTrue(V.bastidor("o resultado não foi confirmado nas páginas consultadas até as 21h48"))
        s.assertTrue(V.bastidor("as páginas consultadas não registram o resultado"))
        s.assertFalse(V.bastidor("Especialistas consultados pelo g1 veem risco fiscal"))


class ResultadoEmAberto(unittest.TestCase):
    def test_materia_do_ajuste(s):
        er, av = roda({"atualizado_em": REF, "pautas": [ajuste()]})
        s.assertTrue(any("visuais.0.itens.1" in e and "RESULTADO EM ABERTO" in e for e in er), er)
        s.assertFalse(any("itens.0" in e for e in er), er)
        s.assertTrue(any("faq.1.r" in a for a in av), av)
        s.assertTrue(any("proximo" in a for a in av), av)
        s.assertFalse(any("faq.0.r" in a for a in av), av)

    def test_com_resultado_nao_cobra(s):
        p = ajuste()
        p["atualizacoes"].append({"hora": "2026-11-17T22:30:00-03:00", "texto": "O Senado rejeitou os quatro destaques; o texto segue para a Câmara."})
        s.assertEqual(roda({"atualizado_em": "2026-11-17T22:35:00-03:00", "pautas": [p]}), ([], []))

    def test_texto_com_a_mesma_cautela_passa(s):
        p = ajuste(proximo="Se os destaques forem votados, o texto segue para a Câmara.",
                   faq=[{"p": "O que falta no Senado?", "r": "Quatro destaques, previstos para terça (17); o resultado não foi confirmado."}],
                   visuais=[{"tipo": "linha_do_tempo", "itens": [{"quando": "17/11", "texto": "Destaques previstos; resultado ainda não confirmado"}]}])
        s.assertEqual(roda({"atualizado_em": REF, "pautas": [p]}), ([], []))

    def test_validar_inteiro_roda(s):
        V.erros.clear(); V.avisos.clear()
        V.checar({"atualizado_em": REF, "pautas": [ajuste()], "agenda": [], "mudancas": {"itens": []}})
        s.assertFalse(any("falhou" in a for a in V.avisos), V.avisos)


if __name__ == "__main__":
    unittest.main(verbosity=2)
