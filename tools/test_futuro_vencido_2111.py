#!/usr/bin/env python3
"""Corretor 21/11 noite, causa noticia-parada-2 (achados COP31 e Enem): a rodada reescreve o título quando o prazo passa
e deixa o resumo/pontos/'O que vem agora' no tempo de antes ("A COP31 vai até sexta (20)", "Os pedidos vão até as 23h59
de sexta (20)"). Classe: qualquer campo que o leitor vê (fora linha do tempo e atualizações, que são registro do momento)
com verbo de futuro/prazo aberto logo antes de uma data que já passou vira PENDÊNCIA 'futuro_vencido'.

  cd tools && python3 -I test_futuro_vencido_2111.py
"""
import os, sys, unittest
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402


def pauta(pid, titulo, texto="", **kw):
    p = {"id": pid, "secao": "politica", "status": "ativa", "hora": "2026-11-20T06:52:00-03:00",
         "neutro": {"titulo": titulo, "texto": texto, "pontos": kw.pop("pontos", [])}, "atualizacoes": kw.pop("atualizacoes", [])}
    p.update(kw)
    return p


def fv(ps, quando="2026-11-21T06:00:00-03:00"):
    return [x for x in V.pendencias({"pautas": ps}, datetime.fromisoformat(quando), None, {}) if x["tipo"] == "futuro_vencido"]


class FuturoVencido(unittest.TestCase):
    def test_cop31_resumo_no_futuro(self):
        p = pauta("cop31", "COP31 passou do prazo de ontem sem texto final",
                  "Em Antália, Lula tratou na terça (10) com Erdogan de defesa. A COP31 vai até sexta (20).")
        r = fv([p]); self.assertEqual(len(r), 1); self.assertIn("COP31 vai até sexta (20)", r[0]["texto"])

    def test_enem_resumo_e_pontos(self):
        p = pauta("enem", "Pedido de reaplicação do Enem acabou ontem",
                  "Os pedidos de reaplicação vão até as 23h59 de sexta (20), na Página do Participante.",
                  pontos=["Os pedidos de reaplicação terminam às 23h59 de sexta (20)"])
        self.assertEqual(len(fv([p])), 1)
        p2 = pauta("enem2", "Pedido de reaplicação do Enem acabou ontem", "Texto já no passado.",
                   pontos=["Os pedidos de reaplicação terminam às 23h59 de sexta (20)"])
        self.assertEqual(len(fv([p2])), 1)

    def test_proximo_e_contexto(self):
        p = pauta("master", "Andrei fala ao Senado", "Texto.",
                  contexto="O Senado convidou Andrei para explicar a troca, em sessão marcada para as 14h de quarta (18).")
        self.assertEqual(len(fv([p], "2026-11-20T10:00:00-03:00")), 1)
        p = pauta("6x1", "Lula assina decreto", "Texto.", proximo="O decreto será publicado na quarta (18).")
        self.assertEqual(len(fv([p], "2026-11-19T10:00:00-03:00")), 1)

    def test_nao_cobra(self):
        casos = [
            # passado narrado, fala datada, data antes do verbo, substantivo, data futura, prazo encerrado
            "A COP31 terminou na sexta (20) sem texto final.",
            "O encerramento estava marcado para sexta (20), e as negociações seguem.",
            "Alckmin disse na terça (17) que Lula vai decidir depois.",
            "A Aneel formou maioria na terça (17) para recomendar a caducidade da concessão, prevista até 2028.",
            "US$ 111,50: onde a ação abriu na estreia, na quinta (19).",
            "A reaplicação será em 15 e 16/12 e as notas saem na segunda (23).",
            "Os pedidos de reaplicação terminaram às 23h59 de sexta (20).",
        ]
        for t in casos:
            self.assertEqual(fv([pauta("x", "Título", t)]), [], t)

    def test_linha_do_tempo_e_atualizacao_ficam_de_fora(self):
        p = pauta("cop", "COP31 passou do prazo", "Texto no passado.",
                  atualizacoes=[{"hora": "2026-11-20T06:52:00-03:00", "texto": "A COP31 vai até sexta (20)."}],
                  visuais=[{"tipo": "linha_do_tempo", "itens": [{"quando": "20/11", "texto": "Pedidos terminam sexta (20)"}]}])
        self.assertEqual(fv([p]), [])

    def test_encerrada_fora(self):
        self.assertEqual(fv([pauta("x", "T", "A COP31 vai até sexta (20).", status="encerrada")]), [])


if __name__ == "__main__":
    unittest.main(verbosity=1)
