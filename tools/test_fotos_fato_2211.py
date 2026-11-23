#!/usr/bin/env python3
"""Corretor 22/11 noite: no tema e no padrão da editoria, foto de um FATO (enchente) ou de cartão-postal (Paulista,
Copacabana) só entra se o título ou o subtítulo diz esse fato ou lugar.

Achados: temporais no RS, tremores no interior de SP e alerta de chuva na Grande SP abriam com enchentes do Maranhão
(tema "brasil/Meio ambiente e clima"); Chitãozinho e Xororó com a Avenida Paulista ao anoitecer (padrão "brasil/Sociedade").
Gera a CLASSE com o fotos-arquivo.json de hoje (que ainda tem essas fotos) e confere que o robô de fotos não guarda mais
tema genérico de enchente nem de cartão-postal.

  python3 tools/test_fotos_fato_2211.py
"""
import json, os, sys, unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import paginas as P  # noqa: E402
import fotos_arquivo as FA  # noqa: E402

def acervo():
    A = {"padrao": {"brasil": "brasil/Sociedade"}, "pessoas": {}, "assuntos": {}, "temas": {
        "brasil/Meio ambiente e clima": [{"url": "https://upload.wikimedia.org/wikipedia/commons/4/47/Enchente_em_Itapecuru_Mirim.jpg"},
                                          {"url": "https://upload.wikimedia.org/wikipedia/commons/a/aa/Enchente_em_Trizidela_do_Vale_%28MA%29.jpg"},
                                          {"url": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Enchente_Itaoca_2014.jpg"}],
        "brasil/Sociedade": [{"url": "https://upload.wikimedia.org/wikipedia/commons/x/xx/Paulista_Avenue%2C_S%C3%A3o_Paulo%2C_Brazil_-Twilight.jpg"},
                             {"url": "https://upload.wikimedia.org/wikipedia/commons/x/xx/Copacabana_Beach_Mosaic_and_Palm_Trees.jpg"}]}}
    for l in A["temas"].values():
        for f in l: f.update(w=640, h=427)
    return P.preparar(A)

def pauta(tit, sub="Meio ambiente e clima", subt=""):
    return {"id": "x", "secao": "brasil", "subtema": sub, "subtitulo": subt, "neutro": {"titulo": tit}}

def fotos(p):
    return [P.fa_nome(f["url"]) for l in P.fa_listas(p, acervo()) for f in l]


class Fato(unittest.TestCase):
    def test_sem_o_fato_no_titulo_fica_a_ilustracao(self):
        for tit, sub in [("Temporais no Rio Grande do Sul deixam 3 mortos desde segunda (16)", "Meio ambiente e clima"),
                         ("Sobe para 4 o número de mortos no temporal em Tupanciretã (RS)", "Meio ambiente e clima"),
                         ("Estrondos e tremores assustam moradores no interior de SP", "Meio ambiente e clima"),
                         ("Defesa Civil emite alerta severo de chuva para a Grande SP", "Meio ambiente e clima"),
                         ("Chitãozinho e Xororó anunciam aposentadoria após 56 anos", "Música"),
                         ("Onda de calor deve durar até quinta no Centro-Oeste", "Meio ambiente e clima")]:
            with self.subTest(tit=tit):
                self.assertEqual([x for x in fotos(pauta(tit, sub)) if any(k in x.lower() for k in ("enchente", "paulista", "copacabana"))], [])

    def test_com_o_fato_no_titulo_vale(self):
        self.assertTrue(any("enchente" in x.lower() for x in fotos(pauta("Enchente deixa 2 mil desalojados no Maranhão"))))
        self.assertTrue(any("paulista" in x.lower() for x in fotos(pauta("Avenida Paulista fecha para a parada", "Sociedade"))))
        self.assertTrue(any("enchente" in x.lower() for x in fotos(pauta("Chuva forte em Recife", subt="Ruas alagadas na zona norte"))))

    def test_robo_nao_guarda_tema_generico(self):
        self.assertEqual(FA.TEMAS["brasil/Meio ambiente e clima"], [])
        self.assertEqual(FA.TEMAS["brasil/Sociedade"], [])
        for k, qs in FA.TEMAS.items():
            for q, ch in qs:
                self.assertFalse(any(w in q.lower() for w in ("enchente", "copacabana", "paulista")), (k, q))


if __name__ == "__main__":
    unittest.main()
