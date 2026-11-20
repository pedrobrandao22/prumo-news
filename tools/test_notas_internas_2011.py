#!/usr/bin/env python3
"""Causa notas-internas (corretor 20/11): recados do robô e da redação não chegam ao leitor.

Classe: texto que a rodada escreve para registrar o que fez ("contagem vencida trocada por linha do tempo", "proximo e faq
trazem a Câmara", "etapa avança para Câmara", "ficam para a próxima por falta de página que confirmasse",
"atualização duplicada removida") virava texto de leitor nas Últimas (mudancas.itens) e em "Atualizações de hoje"
(rodadas.json, nota). Agora: o validar.py dá ERRO nesses recados em qualquer texto de leitor; o registro da rodada tem um
campo "leitor" próprio (o app não mostra mais a nota) e o aplicar.py recusa leitor com bastidor ou rodada publicada sem ele.

  cd tools && python3 -I test_notas_internas_2011.py
"""
import os, sys, unittest
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402

AGORA = datetime.fromisoformat("2026-11-20T15:00-03:00")

RECADOS = [  # casos reais do testador (16/11, 18/11, 19/11, 20/11)
    "Ajuste fiscal passa no Senado e entra na pauta da Câmara na segunda (23); etapa avança para Câmara.",
    "B3 fecha amanhã; proximo e faq trazem a Câmara na segunda (23).",
    "Trump, Xi e Putin começam a reunião trilateral em Shenzhen; contagem vencida trocada por linha do tempo.",
    "Dúvida sobre anulação da questão 159 de matemática; atualização duplicada de 14/11 removida",
    "Caso Master e Enem ficam para a próxima por falta de página que confirmasse.",
    "Acionou Moraes marcar a Lei da Dosimetria, mas nenhuma página lida confirma a data.",
    "O que acionou (MPVs de crédito) já está no feed.",
    "Acionaram Caso Master, mas nada novo.",
]
LIMPOS = [  # textos de leitor que precisam passar
    "Fachin tira o sigilo do relatório da PF sobre Mendonça",
    "Mauro Benevides Filho relata o ajuste fiscal na Câmara, que vota na segunda (23)",
    "O julgamento fica para a próxima semana, segundo o STF.",
    "A decisão fica para a próxima sessão do plenário.",
    "O próximo passo é a votação na Câmara; a contagem dos votos terminou às 18h.",
    "Moraes acionou a PF para ouvir o ex-diretor.",
    "A linha do tempo da cobertura mostra os cinco marcos da votação.",
]


class Classe(unittest.TestCase):
    def test_recados_sao_bastidor(s):
        for t in RECADOS: s.assertTrue(V.bastidor(t), t)

    def test_texto_de_leitor_passa(s):
        for t in LIMPOS: s.assertIsNone(V.bastidor(t), t)

    def test_mudancas_itens_da_erro(s):
        f = {"mudancas": {"itens": [{"pid": "x", "tipo": "atualizada", "texto": t} for t in RECADOS[:3]]}}
        locs = [loc for loc, _, t in V.campos_texto(f) if V.bastidor(t)]
        s.assertEqual(len(locs), 3, locs)


class Registro(unittest.TestCase):
    BASE = {"tipo": "rapida", "status": "ok", "publicou": True, "pautas": 1, "mudancas": 1, "nota": "Acionaram Caso Master; Gazeta do Povo e Migalhas."}

    def test_publicada_sem_leitor_recusa(s):
        s.assertTrue(any("leitor" in e for e in V.checar_registro(dict(s.BASE), None, AGORA)))

    def test_leitor_limpo_passa(s):
        s.assertEqual(V.checar_registro(dict(s.BASE, leitor="Fachin tira o sigilo do relatório da PF sobre Mendonça."), None, AGORA), [])

    def test_leitor_com_recado_recusa(s):
        for t in RECADOS:
            s.assertTrue(any("bastidor" in e for e in V.checar_registro(dict(s.BASE, leitor=t), None, AGORA)), t)

    def test_sem_novidade_nao_precisa_de_leitor(s):
        s.assertEqual(V.checar_registro({"tipo": "rapida", "status": "sem_mudancas", "publicou": False, "motivo": "menor", "nota": "x"}, None, AGORA), [])

    def test_virada_nao_precisa_de_leitor(s):
        s.assertEqual(V.checar_registro({"tipo": "virada", "status": "ok", "publicou": True, "nota": "Virada."}, None, AGORA), [])


class ReservaIndicadores(unittest.TestCase):
    """Feed com o dólar de outubro (R$ 5,02) quando se vai direto ao Feed: a reserva do feed.json acompanha indicadores.json."""
    def test_reserva_atualiza(s):
        import aplicar as A
        F = {"indicadores": {"itens": [{"id": "dolar", "nome": "Dólar", "valor": "R$ 5,02", "variacao": "-0,06%", "dir": "desce", "data": "2026-10-22", "serie": [5.0]},
                                       {"id": "selic", "nome": "Selic", "valor": "13,75%", "variacao": "", "dir": "estavel", "data": "2026-09-16"}]}}
        IND = {"dolar": {"id": "dolar", "valor": "R$ 5,93", "variacao": "+1,47%", "dir": "sobe", "data": "2026-11-19", "serie": list(range(60))},
               "selic": {"id": "selic", "valor": "13,75%", "data": "2026-09-15"}}
        s.assertEqual(A.reserva_indicadores(F, IND), 1)
        d = F["indicadores"]["itens"][0]
        s.assertEqual((d["valor"], d["variacao"], d["data"], d["nome"], len(d["serie"])), ("R$ 5,93", "+1,47%", "2026-11-19", "Dólar", 8))
        s.assertEqual(F["indicadores"]["itens"][1]["data"], "2026-09-16")  # indicadores.json mais velho não volta a reserva
        s.assertEqual(A.reserva_indicadores(F, None), 0)


if __name__ == "__main__":
    unittest.main(verbosity=1)
