#!/usr/bin/env python3
"""Testes das regras de conteúdo de 15/11 no validar.py (achados do testador no site real), sem internet.

  cd tools && python3 -I -m pytest -q test_regras_1511.py
"""
import copy, os, sys, unittest
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402

SECOES = [{"id": "politica", "nome": "Política"}, {"id": "economia", "nome": "Economia"}, {"id": "mundo", "nome": "Mundo"},
          {"id": "esportes", "nome": "Esportes"}, {"id": "educacao", "nome": "Educação"}]


def pauta(pid, secao="politica", subtema="Congresso", titulo="Senado aprova a PEC por 60 a 10", hora="2026-11-15T09:48:00-03:00", **kw):
    p = {"id": pid, "secao": secao, "subtema": subtema, "tipo": "cobertura", "tag": "Senado", "tema": "PEC da Segurança",
         "hora": hora, "prioridade": 50, "neutro": {"titulo": titulo, "texto": "Texto.", "pontos": ["Fato com outro dado: 60 votos.", "Dois.", "Três."]}}
    p.update(kw)
    return p


def feed(*ps, quando="2026-11-15T21:49:00-03:00", **top):
    f = {"atualizado_em": quando, "secoes": SECOES, "pautas": list(ps)}
    f.update(top)
    return f


def roda(f, ant=None, virada=False, IND=None):
    V.erros.clear(); V.avisos.clear()
    V.checar_regras_1511(f, ant, V.dt(f["atualizado_em"]), virada, IND)
    return list(V.erros), list(V.avisos)


def tem(lista, trecho): return any(trecho in m for m in lista)


class ManchetedoDia(unittest.TestCase):
    def test_manchete_de_ontem_com_noticia_de_hoje_e_erro(s):
        velha = pauta("ajuste", secao="economia", subtema="Contas públicas", hora="2026-11-13T06:53:00-03:00")
        nova = pauta("fux", hora="2026-11-14T19:48:00-03:00")
        e, a = roda(feed(velha, nova, quando="2026-11-14T20:50:00-03:00", capa={"manchete": "ajuste"}))
        s.assertTrue(tem(e, "MANCHETE DO DIA")); s.assertTrue(tem(e, "fux"))

    def test_sem_noticia_de_hoje_so_avisa_e_cedo_nao_cobra(s):
        velha = pauta("ajuste", hora="2026-11-13T06:53:00-03:00")
        e, a = roda(feed(velha, quando="2026-11-14T20:50:00-03:00", capa={"manchete": "ajuste"}))
        s.assertEqual(e, []); s.assertTrue(tem(a, "MANCHETE DO DIA"))
        # quinta (13), 7h: dia útil, a rápida das 9h48 ainda não passou
        velha = pauta("ajuste", hora="2026-11-12T06:53:00-03:00")
        e, a = roda(feed(velha, pauta("x", hora="2026-11-13T06:50:00-03:00"), quando="2026-11-13T07:00:00-03:00", capa={"manchete": "ajuste"}))
        s.assertFalse(tem(e + a, "MANCHETE DO DIA"))

    def test_atualizacao_de_hoje_conta_e_virada_nao_cobra(s):
        m = pauta("ajuste", hora="2026-11-13T06:53:00-03:00", atualizacoes=[{"hora": "2026-11-14T15:48:00-03:00", "texto": "Fato novo."}])
        e, a = roda(feed(m, pauta("x"), quando="2026-11-14T20:50:00-03:00", capa={"manchete": "ajuste"}))
        s.assertFalse(tem(e + a, "MANCHETE DO DIA"))
        velha = pauta("ajuste", hora="2026-11-13T06:53:00-03:00")
        e, a = roda(feed(velha, pauta("x", hora="2026-11-14T19:48:00-03:00"), quando="2026-11-14T20:50:00-03:00", capa={"manchete": "ajuste"}), virada=True)
        s.assertFalse(tem(e + a, "MANCHETE DO DIA"))


class UmNumeroSo(unittest.TestCase):
    def test_tres_cotacoes_do_dolar(s):
        p = pauta("dolar", secao="economia", subtema="Mercados", titulo="Ibovespa sobe 0,66%; dólar fecha a R$ 5,66 na sexta (13)",
                  visuais=[{"tipo": "numeros", "titulo": "O fechamento de quinta (12)", "itens": [{"valor": "R$ 5,65", "rotulo": "Dólar no fechamento"}]}])
        e, a = roda(feed(p, quando="2026-11-14T20:50:00-03:00"),
                    IND={"dolar": {"valor": "R$ 5,67", "data": "2026-11-13"}})
        s.assertTrue(tem(a, "dólar com valores diferentes")); s.assertTrue(tem(a, "quadro de números é de 12/11"))
        s.assertTrue(tem(a, "indicador da Capa mostra R$ 5,67"))

    def test_mesmo_numero_passa(s):
        p = pauta("dolar", secao="economia", subtema="Mercados", titulo="Dólar fecha a R$ 5,67 na sexta (13)",
                  visuais=[{"tipo": "numeros", "titulo": "O fechamento de sexta (13)", "itens": [{"valor": "R$ 5,67", "rotulo": "Dólar comercial"}]}])
        e, a = roda(feed(p, quando="2026-11-14T20:50:00-03:00"), IND={"dolar": {"valor": "R$ 5,67", "data": "2026-11-13"}})
        s.assertFalse(tem(e + a, "UM NÚMERO SÓ")); s.assertFalse(tem(a, "indicador da Capa"))


class EventoPassado(unittest.TestCase):
    def test_jogo_de_sabado_anunciado_no_domingo(s):
        sb = pauta("serie-b", secao="esportes", subtema="Série B", titulo="Série B fecha no sábado (14), às 16h30, com 7 jogos e G6 em disputa")
        br = pauta("bra", secao="esportes", subtema="Brasileirão", titulo="Brasileirão volta sábado (14) com Flamengo líder, 3 pontos à frente")
        e, a = roda(feed(sb, br, quando="2026-11-15T00:50:00-03:00"))
        s.assertTrue(tem(e, "[serie-b] neutro.titulo: anuncia no futuro")); s.assertTrue(tem(a, "[bra] neutro.titulo: anuncia no futuro"))
        # mesmo dia, 5 h depois do horário: já passou
        e, a = roda(feed(sb, quando="2026-11-14T21:49:00-03:00"))
        s.assertTrue(tem(e, "EVENTO PASSADO"))
        # antes do jogo: tudo certo; e na virada só avisa
        e, a = roda(feed(sb, br, quando="2026-11-14T11:50:00-03:00")); s.assertFalse(tem(e + a, "EVENTO PASSADO"))
        e, a = roda(feed(sb, quando="2026-11-15T00:50:00-03:00"), virada=True); s.assertEqual(e, []); s.assertTrue(tem(a, "EVENTO PASSADO"))

    def test_resultado_no_presente_nao_e_evento(s):
        p = pauta("dolar", secao="economia", subtema="Mercados", titulo="Ibovespa sobe 0,66%; dólar fecha a R$ 5,67 na sexta (13)")
        q = pauta("vasco", secao="esportes", subtema="Brasileirão", titulo="Vasco vence a Chapecoense no sábado (14) e se afasta do Z-4")
        e, a = roda(feed(p, q, quando="2026-11-15T09:50:00-03:00"))
        s.assertFalse(tem(e + a, "EVENTO PASSADO"))


class TituloClaroEPontos(unittest.TestCase):
    def test_data_solta_e_telegrama(s):
        p = pauta("fux", subtema="STF e Judiciário", titulo="Fux leva a 6×1 ao plenário físico; votos zeram, 16/12 vale")
        e, a = roda(feed(p))
        s.assertTrue(tem(a, "data solta")); s.assertTrue(tem(a, "telegráfico"))
        ok = pauta("fux", subtema="STF e Judiciário", titulo="Fux leva a 6×1 ao plenário físico do STF; jornada de 42 h segue em 16/12")
        e, a = roda(feed(ok)); s.assertFalse(tem(a, "data solta")); s.assertFalse(tem(a, "telegráfico"))

    def test_primeiro_ponto_repete_o_titulo(s):
        p = pauta("pgr", titulo="PGR prepara as primeiras denúncias do caso Master")
        p["neutro"]["pontos"] = ["A PGR prepara as primeiras denúncias do caso Master.", "Isso um ano depois.", "Três."]
        e, a = roda(feed(p)); s.assertTrue(tem(a, "neutro.pontos[0] repete o título"))
        p["neutro"]["pontos"][0] = "As denúncias saem um ano depois da operação, com R$ 12 bilhões investigados."
        e, a = roda(feed(p)); s.assertFalse(tem(a, "repete o título"))


class Atualizacoes(unittest.TestCase):
    U1 = "Para o 2º dia, no domingo (15), os portões abrem às 12h e fecham às 13h; a prova vai das 13h30 às 18h30, com permanência mínima na sala até as 15h30."
    U2 = "Para o 2º dia, no domingo (15), os portões abrem às 12h e fecham às 13h; a prova vai das 13h30 às 18h30, com permanência mínima de duas horas."

    def test_atualizacao_quase_igual(s):
        p = pauta("enem", secao="educacao", subtema="Enem e vestibulares", atualizacoes=[
            {"hora": "2026-11-14T06:52:00-03:00", "texto": s.U1}, {"hora": "2026-11-14T15:48:00-03:00", "texto": s.U2}])
        ant = feed(dict(p, atualizacoes=p["atualizacoes"][:1]))
        e, a = roda(feed(p), ant=ant); s.assertTrue(tem(e, "quase igual"))     # entrou agora: barra
        e, a = roda(feed(p), ant=feed(p)); s.assertEqual(e, []); s.assertTrue(tem(a, "quase igual"))  # já estava: avisa

    def test_atualizacoes_diferentes_passam(s):
        p = pauta("dolar", atualizacoes=[
            {"hora": "2026-11-10T21:48:00-03:00", "texto": "No fechamento de terça (10), o Ibovespa caiu 0,52%, a 171.337 pontos."},
            {"hora": "2026-11-13T19:48:00-03:00", "texto": "Na sexta (13), o Senado aprovou o texto-base por 45 a 31 e os destaques ficaram para terça (17)."}])
        e, a = roda(feed(p), ant=feed(p)); s.assertFalse(tem(e + a, "quase igual"))


class NomeDaCobertura(unittest.TestCase):
    def test_anuncio_como_nome_e_erro(s):
        p = pauta("apec", secao="mundo", subtema="Ásia", titulo="Trump vai se reunir com Xi e Putin na China",
                  etapa={"passos": ["Anúncio", "Cúpula da Apec", "Encontro"], "atual": 0})
        e, a = roda(feed(p)); s.assertTrue(tem(e, "etapa.passos.0 'Anúncio' parece propaganda"))
        p2 = copy.deepcopy(p); p2["etapa"]["passos"][0] = "Encontro marcado"; p2["tag"] = "Publicidade"
        e, a = roda(feed(p2)); s.assertTrue(tem(e, "tag 'Publicidade'")); s.assertFalse(tem(e, "etapa.passos"))
        p3 = copy.deepcopy(p); p3["etapa"]["passos"][0] = "Anúncio do pacote"
        e, a = roda(feed(p3)); s.assertEqual(e, []); s.assertTrue(tem(a, "palavra de propaganda"))

    def test_tema_generico_ausente_e_trocado(s):
        e, a = roda(feed(pauta("dolar", secao="economia", subtema="Mercados", tema="Mercado", tag="Câmbio")))
        s.assertTrue(tem(a, "tema 'Mercado' é genérico"))
        e, a = roda(feed(pauta("x", tema=""))); s.assertTrue(tem(a, "cobertura sem tema"))
        e, a = roda(feed(pauta("x", tema="Ajuste fiscal")), ant=feed(pauta("x", tema="Fiscal")))
        s.assertTrue(tem(a, "mudou de 'Fiscal' para 'Ajuste fiscal'"))
        e, a = roda(feed(pauta("x", tema="Caso Master", tag="STF")), ant=feed(pauta("x", tema="Caso Master")))
        s.assertFalse(tem(e + a, "tema"))


class SecaoPeloFato(unittest.TestCase):
    def test_clima_pelo_local_e_avisado(s):
        p = pauta("cop", secao="mundo", subtema="Outros", tag="Clima", titulo="Lula negocia parceria de defesa com Erdogan na COP31")
        e, a = roda(feed(p)); s.assertTrue(tem(a, "rótulo de clima"))
        for t in ("Lula cobra US$ 1,3 tri por ano para o clima na COP31", "Defesa Civil confirma tornados em 5 cidades do RS"):
            e, a = roda(feed(dict(p, titulo=t, neutro={"titulo": t, "texto": "x"})))
            s.assertFalse(tem(a, "rótulo de clima"), t)

    def test_stf_em_planalto(s):
        p = pauta("fux", subtema="Planalto e governo", titulo="Governo vê o plenário físico do STF julgar a 6×1 em dezembro")
        e, a = roda(feed(p)); s.assertTrue(tem(a, "título fala do STF"))

    def test_decisao_de_tribunal_em_planalto_e_erro_no_checar(s):
        f = feed(pauta("fux", subtema="Planalto e governo", titulo="Fux leva a 6×1 ao plenário físico do STF"))
        f.update({"edicao": "", "regua": V.REGUA, "fontes": {}, "agenda": [], "mudancas": {}})
        V.erros.clear(); V.avisos.clear(); V.checar(f, None, False, datetime(2026, 11, 15, 21, 55, tzinfo=V.SP))
        s.assertTrue(tem(V.erros, "título é decisão de tribunal"))
        V.erros.clear(); V.avisos.clear(); V.checar(f, None, True, datetime(2026, 11, 15, 21, 55, tzinfo=V.SP))
        s.assertFalse(tem(V.erros, "título é decisão de tribunal")); s.assertTrue(tem(V.avisos, "título é decisão de tribunal"))


if __name__ == "__main__":
    unittest.main()
