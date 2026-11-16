#!/usr/bin/env python3
"""Regras de 16/11 (noite) para as rodadas, sem internet: manchete de ontem pela hora do relógio, edição da tarde
parada, mercado de outro pregão, Focus sem hora, notícia de outro dia, frase sem verbo, uma proposta com dois nomes,
atualização que repete números, "Quem noticiou", evento de hoje no futuro, prioridade de cobertura vencida, hora das
breves e virada atrasada.

  cd tools && python3 -I -m pytest -q test_regras_1611r.py
"""
import json, os, subprocess, sys, tempfile, unittest
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402
import aplicar as AP  # noqa: E402

SECOES = [{"id": s, "nome": s} for s in V.SECOES]


def pauta(pid, secao="politica", subtema="Congresso", titulo="Senado aprova a PEC por 60 a 10", hora="2026-11-16T06:52:00-03:00", **kw):
    p = {"id": pid, "secao": secao, "subtema": subtema, "tipo": "cobertura", "tag": "Senado", "tema": "PEC da Segurança",
         "hora": hora, "prioridade": 50, "neutro": {"titulo": titulo, "texto": "Texto.", "pontos": ["Fato com outro dado: 60 votos.", "Dois.", "Três."]}}
    p.update(kw)
    return p


def feed(*ps, quando="2026-11-16T07:46:00-03:00", **top):
    f = {"atualizado_em": quando, "secoes": SECOES, "pautas": list(ps), "fontes": {"cnn": "CNN Brasil", "im": "InfoMoney", "folha": "Folha",
                                                                                   "agsenado": "Agência Senado", "ot": "O Tempo"}}
    f.update(top)
    return f


def hora(h): return datetime.fromisoformat(f"2026-11-16T{h}:00-03:00")  # segunda (16)


def roda(f, agora, ant=None, virada=False):
    V.erros.clear(); V.avisos.clear()
    ref = V.dt(f["atualizado_em"])
    V.checar_regras_1511(f, ant, ref, virada, None, agora)
    V.checar_regras_1611r(f, ant, ref, agora, virada)
    return list(V.erros), list(V.avisos)


def tem(lista, trecho): return any(trecho in m for m in lista)


class ManchetePeloRelogio(unittest.TestCase):
    """16/11: as rápidas rodaram no feed das 7h46 e a regra (que olhava o atualizado_em) nunca disparou."""
    def test_feed_parado_da_manha_e_erro_depois_das_9h48(s):
        f = feed(pauta("ajuste", hora="2026-11-15T15:48:00-03:00"), pauta("ministerios"), capa={"manchete": "ajuste"})
        e, _ = roda(f, hora("11:48"))
        s.assertTrue(tem(e, "MANCHETE DO DIA")); s.assertTrue(tem(e, "ministerios"))

    def test_antes_das_9h48_nao_cobra(s):
        f = feed(pauta("ajuste", hora="2026-11-15T15:48:00-03:00"), pauta("ministerios"), capa={"manchete": "ajuste"})
        e, a = roda(f, hora("09:00"))
        s.assertFalse(tem(e + a, "MANCHETE DO DIA"))


class EdicaoDaTarde(unittest.TestCase):
    def test_tarde_sem_fato_novo_vira_pendencia_com_as_breves(s):
        f = feed(pauta("a"), breves=[{"titulo": "CCJ do Senado aprova convite ao ministro", "secao": "politica", "hora": "2026-11-16T15:48:00-03:00"},
                                     {"titulo": "Gol vence", "secao": "esportes"}])
        pe = V.pendencias(f, hora("17:52"))
        x = [p for p in pe if p["tipo"] == "edicao_parada"]
        s.assertEqual(len(x), 1); s.assertIn("CCJ do Senado", x[0]["texto"]); s.assertNotIn("Gol vence", x[0]["texto"])

    def test_sem_pendencia_de_manha_no_fim_de_semana_ou_com_fato_recente(s):
        s.assertFalse([p for p in V.pendencias(feed(pauta("a")), hora("12:30")) if p["tipo"] == "edicao_parada"])
        sab = feed(pauta("a", hora="2026-11-14T06:52:00-03:00"))
        s.assertFalse([p for p in V.pendencias(sab, datetime.fromisoformat("2026-11-14T18:00:00-03:00")) if p["tipo"] == "edicao_parada"])
        s.assertFalse([p for p in V.pendencias(feed(pauta("a"), pauta("b", hora="2026-11-16T15:48:00-03:00")), hora("17:52")) if p["tipo"] == "edicao_parada"])

    def test_mercado_de_sexta_depois_do_fechamento(s):
        m = pauta("dolar", secao="economia", subtema="Mercados", titulo="Ibovespa sobe 0,66%; dólar fecha a R$ 5,65 na sexta (13)", hora="2026-11-15T06:52:00-03:00")
        ind = {"dolar": {"data": "2026-11-16"}}
        s.assertTrue([p for p in V.pendencias(feed(m), hora("19:00"), ind) if p["tipo"] == "mercado_velho"])
        s.assertFalse([p for p in V.pendencias(feed(m), hora("15:00"), ind) if p["tipo"] == "mercado_velho"])
        s.assertFalse([p for p in V.pendencias(feed(m), hora("19:00"), {"dolar": {"data": "2026-11-13"}}) if p["tipo"] == "mercado_velho"])

    def test_focus_sem_hora_vence_pela_hora_de_costume(s):
        f = feed(pauta("dolar"), agenda=[{"data": "2026-11-16", "hora": "", "texto": "Banco Central divulga o Boletim Focus", "pid": "dolar"},
                                         {"data": "2026-11-16", "hora": "", "texto": "Fies: resultado da chamada", "pid": "dolar"}])
        pe = V.pendencias(f, hora("13:52"))
        s.assertEqual([p["texto"][:5] for p in pe if p["tipo"] == "agenda_comecou"], ["8h25 "])
        s.assertFalse(V.pendencias(f, hora("08:00")))
        _, a = roda(f, hora("08:00"))
        s.assertTrue(tem(a, "8h25")); s.assertFalse(tem(a, "Fies"))


class TextoDoDia(unittest.TestCase):
    def test_noticia_de_quinta_sem_data_no_titulo(s):
        nv = pauta("nvidia", secao="economia", subtema="Empresas", titulo="Huang deixa a Nvidia; ação cai mais de 10% no pré-mercado", hora="2026-11-12T13:48:00-03:00")
        _, a = roda(feed(nv), hora("17:00"))
        s.assertTrue(tem(a, "NOTÍCIA DE OUTRO DIA"))
        nv["neutro"]["titulo"] = "Huang deixou a Nvidia na quinta (12); ação caiu 10%"
        _, a = roda(feed(nv), hora("17:00"))
        s.assertFalse(tem(a, "NOTÍCIA DE OUTRO DIA"))
        _, a = roda(feed(pauta("ontem", hora="2026-11-15T06:52:00-03:00")), hora("17:00"))
        s.assertFalse(tem(a, "NOTÍCIA DE OUTRO DIA"))

    def test_hoje_no_futuro_a_tarde(s):
        p = pauta("voos", secao="mundo", subtema="EUA", titulo="Transtornos em voos nos EUA devem seguir até segunda (16)",
                  proximo="O mercado reabre na segunda (16), com o Focus.")
        _, a = roda(feed(p), hora("17:00"))
        s.assertTrue(tem(a, "neutro.titulo: fala de hoje")); s.assertTrue(tem(a, "proximo: fala de hoje"))
        _, a = roda(feed(p), hora("10:00"))
        s.assertFalse(tem(a, "fala de hoje"))

    def test_frase_sem_verbo_no_carrossel(s):
        p = pauta("master", social=["A PGR prepara as primeiras denúncias.", "Isso um ano depois da operação que abriu o caso."])
        _, a = roda(feed(p), hora("10:00"))
        s.assertTrue(tem(a, "social.1 sem verbo"))
        p["social"][1] = "Isso acontece um ano depois da operação."
        _, a = roda(feed(p), hora("10:00"))
        s.assertFalse(tem(a, "sem verbo"))

    def test_mesma_proposta_com_dois_nomes(s):
        p = pauta("pl", titulo="Relator mantém texto do PL das big techs para votação na terça (17)", tema="PL dos mercados digitais")
        f = feed(p, agenda=[{"data": "2026-11-17", "hora": "", "texto": "Possível votação do PL dos mercados digitais na Câmara", "pid": "pl"}])
        _, a = roda(f, hora("10:00"))
        s.assertTrue(tem(a, "nomes diferentes"))
        p["neutro"]["texto"] = "O PL das big techs (PL dos mercados digitais) regula a concorrência."
        _, a = roda(f, hora("10:00"))
        s.assertFalse(tem(a, "nomes diferentes"))
        _, a = roda(feed(pauta("pec", titulo="PEC da Segurança passa no Senado", tema="PEC da Segurança")), hora("10:00"))
        s.assertFalse(tem(a, "nomes diferentes"))


class LinhaDoTempo(unittest.TestCase):
    UPS = [{"hora": "2026-11-13T19:48:00-03:00", "texto": "No fechamento de sexta (13), o Ibovespa subiu 0,66%, a 172.458 pontos, e o dólar fechou a R$ 5,65."}]
    REPETE = {"hora": "2026-11-15T06:52:00-03:00", "texto": "O dólar fecha a sexta (13) a R$ 5,65 e o Ibovespa a 172.458 pontos (alta de 0,66%)."}

    def test_atualizacao_nova_que_repete_os_numeros_e_erro(s):
        ant = feed(pauta("dolar", atualizacoes=list(s.UPS)))
        f = feed(pauta("dolar", atualizacoes=list(s.UPS) + [s.REPETE]))
        e, _ = roda(f, hora("07:00"), ant=ant)
        s.assertTrue(tem(e, "repete os números"))
        e, a = roda(f, hora("07:00"))  # já estava no ar: só avisa
        s.assertFalse(tem(e, "repete os números")); s.assertTrue(tem(a, "repete os números"))
        e, a = roda(f, hora("07:00"), ant=ant, virada=True)
        s.assertFalse(tem(e, "repete os números"))

    def test_mesmo_fechamento_com_outro_valor(s):
        outro = {"hora": "2026-11-15T06:52:00-03:00", "texto": "Os indicadores registram o dólar a R$ 5,67 no fechamento de sexta (13); a Bolsa ganha 2,35% na semana."}
        e, _ = roda(feed(pauta("dolar", atualizacoes=list(s.UPS) + [outro])), hora("07:00"), ant=feed(pauta("dolar", atualizacoes=list(s.UPS))))
        s.assertTrue(tem(e, "repete os números"))

    def test_fato_novo_com_numero_novo_passa(s):
        novo = {"hora": "2026-11-16T18:00:00-03:00", "texto": "Na segunda (16), o dólar fechou a R$ 5,69 e o Ibovespa a 171.900 pontos."}
        e, a = roda(feed(pauta("dolar", atualizacoes=list(s.UPS) + [novo])), hora("19:00"), ant=feed(pauta("dolar", atualizacoes=list(s.UPS))))
        s.assertFalse(tem(e + a, "repete os números"))

    def test_titulo_trocado_sem_fato_novo(s):
        ant = feed(pauta("dolar", titulo="Dólar fecha a R$ 5,67 na sexta (13)", atualizacoes=list(s.UPS)))
        _, a = roda(feed(pauta("dolar", titulo="Dólar fecha a R$ 5,65 na sexta (13)", atualizacoes=list(s.UPS))), hora("07:00"), ant=ant)
        s.assertTrue(tem(a, "título mudou sem atualização nova"))
        corr = pauta("dolar", titulo="Dólar fecha a R$ 5,65 na sexta (13)", atualizacoes=list(s.UPS), correcoes=[{"hora": "2026-11-16T07:00:00-03:00", "texto": "x"}])
        _, a = roda(feed(corr), hora("07:00"), ant=ant)
        s.assertFalse(tem(a, "título mudou"))


class QuemNoticiou(unittest.TestCase):
    def test_veiculos_sem_link_resumo_repetido_e_velho(s):
        p = pauta("ajuste", fontes=["cnn", "im", "folha", "agsenado"],
                  links=[{"fonte": "CNN Brasil", "url": "https://cnn/x"}, {"fonte": "Agência Senado", "url": "https://senado/x"}],
                  enquadramentos=[{"fonte": "folha", "descricao": "Detalha o plano."},
                                  {"fonte": "agsenado", "descricao": "Relata que o ajuste fiscal pode ser votado na quinta (12)."},
                                  {"fonte": "agsenado", "descricao": "Lista os quatro destaques da terça (17)."}],
                  checagem={"status": "divergencia", "texto": "O Tempo cita a audiência em 18/12, data que parece erro; a CNN Brasil diz quarta (18)."})
        _, a = roda(feed(p), hora("12:00"))
        s.assertTrue(tem(a, "sem link nem resumo: InfoMoney")); s.assertTrue(tem(a, "sem link: Folha"))
        s.assertTrue(tem(a, "mais de uma linha do mesmo veículo (agsenado)"))
        s.assertTrue(tem(a, "enquadramento de agsenado anuncia como futuro algo de 12/11"))
        s.assertTrue(tem(a, "a checagem cita O Tempo sem link")); s.assertFalse(tem(a, "cita CNN"))
        s.assertTrue(tem(a, "cara de nota interna ('parece erro')"))

    def test_lista_completa_nao_avisa(s):
        p = pauta("ok", fontes=["cnn", "Brasil 247"], links=[{"fonte": "cnn", "url": "https://cnn/x"}, {"fonte": "Brasil 247", "url": "https://b247/x"}],
                  checagem={"status": "ok", "texto": "CNN Brasil e Brasil 247 dão 45 a 31; o Estadão Conteúdo, republicado, também."})
        _, a = roda(feed(p), hora("12:00"))
        s.assertFalse(tem(a, "QUEM NOTICIOU"))


class Aplicar(unittest.TestCase):
    def test_cobertura_vencida_perde_prioridade_e_breve_ganha_hora(s):
        F = feed(pauta("nvidia", hora="2026-11-12T13:48:00-03:00", prioridade=53), pauta("hoje", prioridade=60),
                 pauta("ao", hora="2026-11-12T13:48:00-03:00", prioridade=70, status="ao_vivo"),
                 breves=[{"titulo": "Velha", "fonte": "cnn", "url": "https://a", "secao": "politica"}])
        base = json.loads(json.dumps(F)); base["breves"][0]["hora"] = "2026-11-16T06:52:00-03:00"
        fd = AP.Feed(F, hora("17:48"))
        fd.aplicar({"op": "breve_add", "breve": {"titulo": "Caixa informa ataque hacker", "fonte": "cnn", "url": "https://b", "secao": "economia"}})
        AP.coberturas(F, base, hora("17:48"))
        P = {p["id"]: p for p in F["pautas"]}
        s.assertEqual(P["nvidia"]["prioridade"], AP.PRIO_VELHA); s.assertEqual(P["hoje"]["prioridade"], 60); s.assertEqual(P["ao"]["prioridade"], 70)
        H = {b["url"]: b.get("hora") for b in F["breves"]}
        s.assertEqual(H, {"https://a": "2026-11-16T06:52:00-03:00", "https://b": "2026-11-16T17:48:00-03:00"})


class ViradaAtrasada(unittest.TestCase):
    def test_virada_depois_da_completa_nao_mexe(s):
        d = tempfile.mkdtemp()
        fp = os.path.join(d, "feed.json")
        F = feed(pauta("a")); F["atualizado_em"] = "2026-11-16T07:02:00-03:00"
        json.dump(F, open(fp, "w"))
        r = subprocess.run([sys.executable, "-I", os.path.join(AQUI, "virada_auto.py"), fp, "--agora", "2026-11-16T07:46"], capture_output=True, text=True)
        s.assertEqual(r.returncode, 0)
        reg = json.loads([l for l in r.stdout.splitlines() if l.startswith("REG ")][0][4:])
        s.assertEqual((reg["status"], reg["publicou"]), ("sem_mudancas", False))
        s.assertEqual(json.load(open(fp))["atualizado_em"], "2026-11-16T07:02:00-03:00")


if __name__ == "__main__":
    unittest.main()
