#!/usr/bin/env python3
"""Corretor 20/11: (1) placar oficial já saiu e a linha fina da Capa / 'O que vem agora' / linha do tempo ainda anunciam a
votação (achado placar-oficial-mostra-o-ajuste-aprovado…, reaberto: a correção de 19/11 não olhava capa.linha_fina);
(2) evento de pregão sem 'às Xh' no texto ('Anthropic estreia na Nasdaq na quinta (19)') continuava no ar às 14h sem
pendência: agora a hora implícita é a abertura da bolsa.

  cd tools && python3 -I test_corretor_2011.py
"""
import os, sys, unittest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import validar as V  # noqa: E402


def pauta(pid, titulo, hora, ups=(), **kw):
    p = {"id": pid, "secao": kw.pop("secao", "politica"), "status": "ativa", "hora": hora,
         "neutro": {"titulo": titulo, "texto": kw.pop("texto", "")}, "atualizacoes": [{"hora": h, "texto": t} for h, t in ups]}
    p.update(kw); return p


def pend(f, quando, ofi=None, tipos=None):
    r = V.pendencias(f, datetime.fromisoformat(quando), None, ofi or {})
    return [x for x in r if tipos is None or x["tipo"] in tipos]


OFI = {"para_pautas": {"ajuste-fiscal-lula-4": [
    {"quando": "2026-11-18T00:00-03:00", "texto": "O Senado aprovou o PLP 299/2026 por 45 votos a 32.", "numero": "45 a 32"},
    {"quando": "2026-11-18T00:00-03:00", "texto": "O Senado aprovou o PLP 299/2026 por 49 votos a 31.", "numero": "49 a 31"}]}}
# o título já foi reescrito e o número entrou na atualização: oficial_pendente some; o resto ficou velho
AJ = pauta("ajuste-fiscal-lula-4", "Senado registra aprovação do ajuste fiscal por 45 a 32 e 49 a 31", "2026-11-18T06:52:00-03:00",
           [("2026-11-18T06:52:00-03:00", "A votação dos destaques ficou para quarta (18) por falta de acordo."),
            ("2026-11-18T21:48:00-03:00", "O Senado registrou a aprovação do PLP 299/2026 por 45 votos a 32 e por 49 votos a 31.")])
LF_VELHA = "O Senado retoma na quarta (18) a votação dos cinco destaques ao ajuste fiscal, sem acordo com a oposição."


class PlacarTextoVelho(unittest.TestCase):
    def test_linha_fina_da_capa_velha_cobra(self):  # o caso que reabriu
        f = {"pautas": [AJ], "capa": {"manchete": AJ["id"], "linha_fina": LF_VELHA}}
        r = pend(f, "2026-11-19T00:05:00-03:00", OFI, {"oficial_texto_velho", "oficial_pendente"})
        self.assertEqual([x["tipo"] for x in r], ["oficial_texto_velho"]); self.assertIn("capa.linha_fina", r[0]["texto"])

    def test_proximo_e_linha_do_tempo_velhos_cobram(self):
        p = dict(AJ, proximo="O plenário vota os cinco destaques na quarta (18); depois o texto segue para a Câmara.",
                 visuais=[{"tipo": "linha_do_tempo", "itens": [{"quando": "18/11", "texto": "Senado deixa os destaques para quarta (18)"}]}])
        r = pend({"pautas": [p]}, "2026-11-19T07:00:00-03:00", OFI, {"oficial_texto_velho"})
        nomes = " ".join(x["texto"] for x in r)
        self.assertIn("proximo", nomes); self.assertIn("linha do tempo", nomes)

    def test_texto_reescrito_nao_cobra(self):
        f = {"pautas": [dict(AJ, proximo="A Câmara pôs o texto na pauta de segunda (23).")],
             "capa": {"manchete": AJ["id"], "linha_fina": "O Senado aprovou o ajuste fiscal por 45 a 32 e 49 a 31 na quarta (18); a Câmara vota na segunda (23)."}}
        self.assertEqual(pend(f, "2026-11-19T07:00:00-03:00", OFI, {"oficial_texto_velho"}), [])

    def test_sem_placar_oficial_nao_cobra(self):
        f = {"pautas": [AJ], "capa": {"manchete": AJ["id"], "linha_fina": LF_VELHA}}
        self.assertEqual(pend(f, "2026-11-18T12:00:00-03:00", {}, {"oficial_texto_velho"}), [])

    def test_linha_fina_de_outra_pauta_nao_conta(self):
        f = {"pautas": [AJ], "capa": {"manchete": "outra", "linha_fina": LF_VELHA}}
        self.assertEqual(pend(f, "2026-11-19T00:05:00-03:00", OFI, {"oficial_texto_velho"}), [])

    def test_placar_velho_de_mais_de_2_dias_nao_cobra(self):
        f = {"pautas": [AJ], "capa": {"manchete": AJ["id"], "linha_fina": LF_VELHA}}
        self.assertEqual(pend(f, "2026-11-22T10:00:00-03:00", OFI, {"oficial_texto_velho"}), [])


ANT = pauta("anthropic-ipo-nasdaq", "Anthropic estreia na Nasdaq na quinta (19) em IPO bilionário", "2026-11-19T06:21:00-03:00", secao="economia",
            subtitulo="A faixa de preço prevê captação de até US$ 64,4 bi e avaliação de até US$ 1,4 tri.")


class PregaoSemHora(unittest.TestCase):
    def test_estreia_na_nasdaq_parada_as_14h_cobra(self):  # o caso do testador (13h55)
        r = pend({"pautas": [ANT]}, "2026-11-19T13:55:00-03:00", None, {"evento_de_hoje_parado"})
        self.assertEqual(len(r), 1)

    def test_antes_da_abertura_mais_2h_nao_cobra(self):
        self.assertEqual(pend({"pautas": [ANT]}, "2026-11-19T12:30:00-03:00", None, {"evento_de_hoje_parado"}), [])

    def test_com_atualizacao_depois_da_abertura_nao_cobra(self):
        p = dict(ANT, atualizacoes=[{"hora": "2026-11-19T12:10:00-03:00", "texto": "As ações abriram em alta de 35%."}])
        self.assertEqual(pend({"pautas": [p]}, "2026-11-19T14:30:00-03:00", None, {"evento_de_hoje_parado"}), [])

    def test_b3_abre_as_10h(self):
        p = pauta("ipo-b3", "Empresa X estreia na B3 na quinta (19)", "2026-11-19T06:21:00-03:00", secao="economia")
        self.assertEqual(len(pend({"pautas": [p]}, "2026-11-19T12:05:00-03:00", None, {"evento_de_hoje_parado"})), 1)

    def test_horario_de_verao_dos_eua(self):
        from datetime import date
        self.assertEqual(V.hora_implicita("estreia na Nasdaq", date(2026, 7, 1)), (10, 30))
        self.assertEqual(V.hora_implicita("estreia na Nasdaq", date(2026, 11, 19)), (11, 30))
        self.assertIsNone(V.hora_implicita("A Nasdaq caiu 2%", date(2026, 11, 19)))


if __name__ == "__main__":
    unittest.main(verbosity=1)
