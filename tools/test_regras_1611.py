#!/usr/bin/env python3
"""Corretor 16/11: nota interna da redação no texto do leitor ("atualização duplicada de 14/11 removida",
"Tema passa a Dólar e Bolsa") vira ERRO; resumo de cobertura anterior com bastidor vira aviso.

  cd tools && python3 -I -m pytest -q test_regras_1611.py
"""
import os, sys, unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402


class Bastidor(unittest.TestCase):
    def test_nota_de_manutencao(s):
        for t in ("Dúvida sobre anulação da questão 159 de matemática; atualização duplicada de 14/11 removida",
                  "Tema passa a Dólar e Bolsa; fechamento de sexta (13) corrigido para R$ 5,65.",
                  "Fechamento corrigido; tema passa a Dólar e Bolsa",
                  "Item duplicado da edição removido",
                  "Quem fez o levantamento não foi apurado nesta rodada."):
            s.assertTrue(V.bastidor(t), t)

    def test_noticia_normal(s):
        for t in ("Polícia diz que documentos foram removidos do gabinete",
                  "Senado aprova a PEC por 60 a 10; texto volta à Câmara",
                  "Questão 159 pode ser anulada, dizem professores"):
            s.assertFalse(V.bastidor(t), t)

    def test_esporte_pode_dizer_rodada(s):
        s.assertFalse(V.bastidor("Vitória nesta rodada garante o acesso", esporte=True))
        s.assertTrue(V.bastidor("Vitória nesta rodada garante o acesso"))

    def test_mudancas_entram_no_texto_do_leitor(s):
        f = {"pautas": [], "mudancas": {"itens": [{"pid": "x", "texto": "Fato; atualização duplicada de 14/11 removida"}]}}
        achou = [loc for loc, _, t in V.campos_texto(f) if V.bastidor(t)]
        s.assertEqual(achou, ["mudancas.itens.0.texto"])


if __name__ == "__main__":
    unittest.main()
