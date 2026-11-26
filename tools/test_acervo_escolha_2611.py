#!/usr/bin/env python3
"""26/11: toda notícia tem foto. Escolha no catálogo por assunto (tools/acervo_escolha.py), sem rede."""
import os, re, sys, unittest
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import acervo_escolha as AE
from acervo_verbetes import VERBETES

def cat():
    V = {}
    for vid, rot, tipo, secs, subs, pals, _ in VERBETES:
        V[vid] = {"rotulo": rot, "tipo": tipo, "secoes": secs, "subtemas": subs, "palavras": pals,
                  "fotos": [{"url": f"https://upload.wikimedia.org/x/{vid}-{i}.jpg", "local": f"acervo/c/{vid}-{i}.webp", "credito": "Fulano/Wikimedia Commons (CC BY 4.0)", "w": 640, "h": 427} for i in range(3)]}
    return {"verbetes": V}

def P(sec, tit, sub="", pid=None): return {"id": pid or re.sub(r"\W+", "-", tit.lower())[:40], "secao": sec, "neutro": {"titulo": tit}, "subtitulo": sub}

CASOS = [  # (editoria, título, verbete esperado)
    ("brasil", "Temporais deixam 6 mortos no PR; RS soma 5 desde segunda (16)", "temporal"),
    ("brasil", "Frente fria traz alerta de tempestade a quase todo o Sudeste", "temporal"),
    ("mundo", "Ebola no Congo passa de 12 mil casos e quase 6 mil mortes", "epidemia"),
    ("mundo", "Colômbia resgata reféns de supermercado em Cartagena", "resgate"),
    ("politica", "Bolsonaro segue estável na UTI e sem previsão de alta, diz boletim", "uti"),
    ("economia", "Arrecadação federal chegou a R$ 294 bi em outubro, recorde", "reais"),
    ("educacao", "Pé-de-Meia paga julho e agosto em 26/11; parcela vai até 30/11", "reais"),
    ("educacao", "Queda de árvore em escola fere três alunos", "queda-arvore"),
    ("esportes", "Corinthians empata com o Atlético-MG no jogo atrasado", "bola-gramado"),
    ("esportes", "Playoffs da Série B: voltas na sexta (27) e no sábado (28)", "bola-gramado"),
    ("mundo", "EUA barraram na terça (24) o pedido do Brasil por painel na OMC", "porto"),
    ("economia", "Governo estuda limitar a 2,5% ao ano o gasto obrigatório", "fazenda"),
    ("brasil", "Incêndio no Ninho do Urubu: dois réus condenados na terça (24)", "incendio-urbano"),
    ("politica", "Lula irá a Belém para a abertura da cúpula", "cidade-belem"),   # "irá" não é o Irã
    ("mundo", "Irã anuncia novo teste de mísseis", "destrocos-guerra"),
    ("educacao", "Enem: gabarito oficial sai na quinta (27)", "enem"),
    ("economia", "IA puxa lucro recorde de fabricante de chips", "bolsa"),
    ("politica", "Deputados aprovam urgência para projeto das redes sociais", "camara-plen"),
]

class T(unittest.TestCase):
    def test_casos(s):
        C = cat()
        for sec, tit, esp in CASOS:
            with s.subTest(tit=tit): s.assertEqual(AE.verbete_de(P(sec, tit), C), esp)
    def test_toda_noticia_ganha_foto(s):
        C = cat()
        for sec in ("politica", "economia", "brasil", "mundo", "esportes", "educacao"):
            f = AE.foto_de(P(sec, "Zzz qqq www sem nenhuma palavra do catálogo"), C)
            s.assertTrue(f and f["local"].startswith(f"acervo/c/geral-{sec}"), (sec, f))
            s.assertTrue(f["ilustrativa"] and f["credito"].startswith("Foto ilustrativa: ") and f["alt"].startswith("Foto ilustrativa: "))
    def test_lugar_nao_e_ilustrativa(s):
        f = AE.foto_de(P("brasil", "Curitiba amplia rede de ciclovias"), cat())
        s.assertNotIn("ilustrativa", f); s.assertTrue(f["credito"].startswith("Foto de arquivo: "))
    def test_nao_repete_na_edicao_e_e_estavel(s):
        C = cat(); us = set()
        a = AE.foto_de(P("brasil", "Chuva forte alaga ruas de Recife", pid="a"), C, us); b = AE.foto_de(P("brasil", "Chuva forte derruba árvores em Natal", pid="b"), C, us)
        s.assertNotEqual(a["local"], b["local"])
        s.assertEqual(AE.foto_de(P("brasil", "Chuva forte alaga ruas de Recife", pid="a"), C)["local"], AE.foto_de(P("brasil", "Chuva forte alaga ruas de Recife", pid="a"), C)["local"])
    def test_verbete_sem_foto_e_pulado(s):
        C = cat(); C["verbetes"]["temporal"]["fotos"] = []
        s.assertNotEqual(AE.verbete_de(P("brasil", "Temporais deixam 6 mortos no PR"), C), "temporal")
    def test_foto_retirada_na_revisao_nao_sai(s):
        C = cat(); ruim = {f["url"] for f in C["verbetes"]["temporal"]["fotos"][:2]}; antes = AE.FORA
        try:
            AE.FORA = ruim
            for i in range(20): s.assertNotIn(AE.foto_de(P("brasil", "Temporais deixam 6 mortos no PR", pid=f"x{i}"), C)["url"], ruim)
        finally: AE.FORA = antes
    def test_palavras_valem_as_do_codigo(s):
        C = cat(); C["verbetes"]["temporal"]["palavras"] = ["zzzz"]   # catálogo uma rodada atrás
        s.assertEqual(AE.verbete_de(P("brasil", "Temporais deixam 6 mortos no PR"), C), "temporal")
    def test_editoria_respeitada(s):
        s.assertNotEqual(AE.verbete_de(P("esportes", "Santos vence e sai do Z4"), cat()), "porto")
        s.assertNotEqual(AE.verbete_de(P("educacao", "Pé-de-Meia: pagamento começa hoje"), cat()), "cidade-recife")

if __name__ == "__main__":
    unittest.main()
