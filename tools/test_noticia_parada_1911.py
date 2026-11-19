#!/usr/bin/env python3
"""Corretor 19/11, causa noticia-parada-2: o texto da manhã não pode ficar no ar depois de o fato acontecer.

Classe: qualquer campo que o leitor vê (título, texto, pontos, essencial/social, "O que vem agora", última atualização,
linha do tempo) anunciando um evento que já passou, ou o placar oficial (oficiais.json) com resultado que o texto não
registrou, vira PENDÊNCIA para a rodada seguinte.

  cd tools && python3 -I test_noticia_parada_1911.py
"""
import os, sys, unittest
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402


def pauta(pid, titulo, hora, ups=(), **kw):
    p = {"id": pid, "secao": kw.pop("secao", "politica"), "status": kw.pop("status", "ativa"), "hora": hora,
         "neutro": {"titulo": titulo, "texto": kw.pop("texto", "")}, "atualizacoes": [{"hora": h, "texto": t} for h, t in ups]}
    p.update(kw)
    return p


def pend(ps, quando, ofi=None, tipos=None):
    r = V.pendencias({"pautas": ps}, datetime.fromisoformat(quando), None, ofi or {})
    return [x for x in r if tipos is None or x["tipo"] in tipos]


TIPOS = {"evento_de_hoje_parado", "hora_passou", "desfecho_em_aberto", "oficial_pendente"}
AJUSTE = pauta("ajuste-fiscal-lula-4", "Sem acordo, Senado deixa os 5 destaques do ajuste para quarta (18)", "2026-11-18T06:52:00-03:00",
               [("2026-11-18T06:52:00-03:00", "A votação dos destaques ficou para quarta (18) por falta de acordo.")],
               proximo="O plenário do Senado vota os cinco destaques ao PLP 299/2026 em sessão de quarta (18); depois, o texto segue para a Câmara.")
OFI = {"para_pautas": {"ajuste-fiscal-lula-4": [
    {"quando": "2026-11-18T00:00-03:00", "texto": "O Senado aprovou o PLP 299/2026 por 45 votos a 32.", "numero": "45 a 32"},
    {"quando": "2026-11-18T00:00-03:00", "texto": "O Senado aprovou o PLP 299/2026 por 49 votos a 31.", "numero": "49 a 31"}]}}
MASTER = pauta("caso-master", "Chefe da PF e ministro da Justiça vão ao Senado explicar delegados do Master", "2026-11-18T15:48:00-03:00",
               [("2026-11-18T06:52:00-03:00", "Lula recebe o diretor-geral da PF."),
                ("2026-11-18T15:48:00-03:00", "A sessão conjunta das comissões do Senado estava marcada para as 14h de quarta (18); "
                                              "o teor das falas ainda será conferido.")],
               visuais=[{"tipo": "linha_do_tempo", "itens": [{"quando": "18/11", "texto": "Audiência conjunta no Senado, às 14h, a confirmar."}]}])
BIGTECH = pauta("pl-mercados-digitais", "PL das big techs fica fora da pauta da Câmara em 18/11", "2026-11-18T06:52:00-03:00",
                social=["Terça (17): a votação do PL das big techs estava prevista, sem resultado confirmado."])


class NoticiaParada(unittest.TestCase):
    # --- casos do dia (19/11) ---
    def test_placar_oficial_sem_texto(self):
        r = pend([AJUSTE], "2026-11-18T20:55:00-03:00", OFI, {"oficial_pendente"})
        self.assertEqual(len(r), 1); self.assertIn("45 votos a 32", r[0]["texto"]); self.assertIn("DADOS OFICIAIS", r[0]["texto"])

    def test_oficial_ja_registrado_nao_cobra(self):
        p = pauta(AJUSTE["id"], "Senado aprova ajuste por 49 a 31 e texto vai à Câmara", AJUSTE["hora"],
                  [("2026-11-18T21:10:00-03:00", "O Senado aprovou o PLP 299/2026 por 45 votos a 32 e, na 2ª votação, por 49 votos a 31; caíram os 5 destaques.")])
        self.assertEqual(pend([p], "2026-11-18T21:30:00-03:00", OFI, {"oficial_pendente"}), [])

    def test_uma_das_duas_votacoes_faltando_cobra(self):
        p = pauta(AJUSTE["id"], "Senado aprova ajuste por 49 a 31", AJUSTE["hora"],
                  [("2026-11-18T21:10:00-03:00", "O Senado aprovou o PLP 299/2026 por 49 votos a 31.")])
        r = pend([p], "2026-11-18T21:30:00-03:00", OFI, {"oficial_pendente"})
        self.assertEqual(len(r), 1); self.assertIn("45 votos a 32", r[0]["texto"]); self.assertNotIn("49 votos", r[0]["texto"])

    def test_oficial_antigo_ou_encerrada_nao_cobra(self):
        self.assertEqual(pend([AJUSTE], "2026-11-22T10:00:00-03:00", OFI, {"oficial_pendente"}), [])
        enc = dict(AJUSTE, status="encerrada")
        self.assertEqual(pend([enc], "2026-11-18T20:55:00-03:00", OFI, {"oficial_pendente"}), [])

    def test_titulo_para_hoje_sem_verbo_de_futuro(self):
        r = pend([AJUSTE], "2026-11-18T16:00:00-03:00", tipos={"evento_de_hoje_parado"})
        self.assertEqual([x["pid"] for x in r], ["ajuste-fiscal-lula-4"])

    def test_adiada_para_hoje_conta_adiada_ontem_nao(self):
        p = pauta("x", "Votação do PL foi adiada para quarta (18)", "2026-11-18T07:00:00-03:00")
        self.assertEqual(len(pend([p], "2026-11-18T16:00:00-03:00", tipos={"evento_de_hoje_parado"})), 1)
        q = pauta("y", "Votação do ajuste fiscal foi adiada na terça (17)", "2026-11-17T08:00:00-03:00")
        self.assertEqual(pend([q], "2026-11-17T17:00:00-03:00", tipos={"evento_de_hoje_parado"}), [])

    def test_audiencia_marcada_depois_da_hora(self):
        r = pend([MASTER], "2026-11-18T16:50:00-03:00", tipos={"hora_passou"})
        self.assertEqual([x["pid"] for x in r], ["caso-master"]); self.assertIn("14h", r[0]["texto"])

    def test_audiencia_antes_da_hora_nao_cobra(self):
        self.assertEqual(pend([MASTER], "2026-11-18T15:00:00-03:00", tipos={"hora_passou"}), [])

    def test_audiencia_com_desfecho_nao_cobra(self):
        p = dict(MASTER, atualizacoes=MASTER["atualizacoes"] + [
            {"hora": "2026-11-18T17:30:00-03:00", "texto": "Andrei disse aos senadores que a troca de delegados foi técnica."}])
        self.assertEqual(pend([p], "2026-11-18T18:00:00-03:00", tipos={"hora_passou"}), [])

    def test_marcada_para_outro_dia_nao_cobra(self):
        p = pauta("z", "CPI ouve ministro", "2026-11-18T07:00:00-03:00", texto="O depoimento está marcado para sexta (20), às 10h.")
        self.assertEqual(pend([p], "2026-11-18T22:00:00-03:00", tipos={"hora_passou", "desfecho_em_aberto"}), [])

    def test_essencial_de_ontem_sem_resultado(self):
        r = pend([BIGTECH], "2026-11-18T09:00:00-03:00", tipos={"desfecho_em_aberto"})
        self.assertEqual([x["pid"] for x in r], ["pl-mercados-digitais"])

    # --- casos antigos da família (17/11 e 18/11) continuam cobertos ---
    def test_caso_antigo_vota_na_terca(self):
        p = pauta("ajuste", "Senado vota os quatro destaques do ajuste fiscal na terça (17)", "2026-11-17T06:52:00-03:00")
        self.assertEqual(len(pend([p], "2026-11-17T16:50:00-03:00", tipos={"evento_de_hoje_parado"})), 1)

    def test_caso_antigo_proximo_hoje_ou_amanha(self):
        # 18/11: "O que vem agora" seguia com a votação de hoje depois de o placar sair; agora o oficial cobra.
        p = dict(AJUSTE, proximo="Alcolumbre vai ligar a Motta para saber se a Câmara vota o texto na quarta (18) ou na quinta (19).")
        self.assertTrue(pend([p], "2026-11-18T20:55:00-03:00", OFI, {"oficial_pendente"}))

    def test_tudo_em_dia_sem_pendencia(self):
        p = pauta("ok", "Senado aprova ajuste fiscal por 49 a 31", "2026-11-18T20:40:00-03:00",
                  [("2026-11-18T20:40:00-03:00", "O Senado aprovou o PLP 299/2026 por 45 votos a 32 e por 49 votos a 31.")],
                  proximo="O texto vai à Câmara; Hugo Motta volta depois de sexta (20).")
        self.assertEqual(pend([p], "2026-11-18T22:00:00-03:00", {"para_pautas": {"ok": OFI["para_pautas"]["ajuste-fiscal-lula-4"]}}, TIPOS), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
