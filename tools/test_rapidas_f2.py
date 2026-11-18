#!/usr/bin/env python3
"""Fase 2 · rodadas rápidas (18/11): fato novo relevante vira notícia (não breve) e rápida sem novidade diz por quê.

  cd tools && python3 -I test_rapidas_f2.py
"""
import json, os, subprocess, sys, tempfile, unittest
from datetime import datetime, timedelta

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import manchetes as M  # noqa: E402
import validar as V  # noqa: E402

AGORA = datetime.fromisoformat("2026-11-18T15:40-03:00")


def mk(titulo, fonte, hhmm, secao=None):
    h = datetime.fromisoformat(f"2026-11-18T{hhmm}:00-03:00")
    return {"titulo": titulo, "url": f"https://x.example/{fonte}/{abs(hash(titulo))}", "hora": h, "fonte": fonte,
            "veiculo": fonte, "secao": secao, "tk": M.tokens(titulo), "img": "", "cred": ""}


def feed(breves=(), pautas=None):
    return {"atualizado_em": "2026-11-18T11:49:00-03:00", "breves": list(breves), "pautas": pautas if pautas is not None else [
        {"id": "eua-trump-xi-putin-apec-china", "secao": "mundo", "tipo": "cobertura", "status": "ativa", "prioridade": 70,
         "tema": "Trump, Xi e Putin na China", "tag": "Diplomacia", "hora": "2026-11-18T07:00:00-03:00",
         "neutro": {"titulo": "Kremlin confirma encontro de Putin, Xi e Trump em Shenzhen na quinta (19)"}},
        {"id": "ajuste-fiscal-lula-4", "secao": "economia", "tipo": "cobertura", "status": "ativa", "prioridade": 90,
         "tema": "Ajuste fiscal", "tag": "Senado", "hora": "2026-11-18T09:00:00-03:00",
         "neutro": {"titulo": "Senado vota destaques do ajuste fiscal de Lula"}},
        {"id": "caso-velho", "secao": "politica", "tipo": "cobertura", "status": "encerrada", "prioridade": 30,
         "tema": "Dosimetria no STF", "tag": "STF", "hora": "2026-11-15T09:00:00-03:00",
         "neutro": {"titulo": "STF conclui julgamento da Lei da Dosimetria"}}]}


DOSI = [mk("Motta e Alcolumbre pedem ao STF julgamento da Lei da Dosimetria", "p360", "14:30", "politica"),
        mk("Presidentes da Câmara e do Senado pedem que STF julgue Lei da Dosimetria", "cnn", "14:45"),
        mk("Alcolumbre e Motta cobram STF sobre Lei da Dosimetria", "met", "15:05", "politica")]


class Manchetes(unittest.TestCase):
    def test_ja_e_breve_continua_acionando(s):
        """Antes, assunto que já era breve não acionava nunca mais (o fato da tarde morria na lista do fim)."""
        f = feed(breves=[{"titulo": "Motta e Alcolumbre pedem julgamento da Lei da Dosimetria ao STF", "fonte": "p360",
                          "url": "https://x.example/b", "secao": "politica", "hora": "2026-11-18T14:50:00-03:00"}])
        out = M.analisar([dict(x) for x in DOSI], f, AGORA)
        n = out["novos"][0]
        s.assertTrue(n["ja_e_breve"]); s.assertTrue(n["relevante"])
        s.assertTrue(out["acionar"])
        it = out["acionar_itens"][0]
        s.assertEqual(it["tipo"], "novo")
        s.assertTrue(it["acao"].startswith("nova (e tire a breve"), it["acao"])
        s.assertIn("hoje só breve", it["motivo"])

    def test_acao_atualiza_pauta(s):
        its = [mk("Senado aprova destaques do ajuste fiscal de Lula", "p360", "14:30"),
               mk("Ajuste fiscal: Senado conclui votação dos destaques", "cnn", "14:40"),
               mk("Senado termina votação do ajuste fiscal com destaques aprovados", "met", "14:50")]
        out = M.analisar([dict(x) for x in its], feed(), AGORA)
        it = next(x for x in out["acionar_itens"] if x["tipo"] == "pauta")
        s.assertEqual(it["acao"], "atualiza: ajuste-fiscal-lula-4")

    def test_pid_provavel_e_nunca_cobertura_encerrada(s):
        its = [mk("Putin chega à China para reunião com Xi e Trump em Shenzhen", "p360", "14:30", "mundo"),
               mk("Putin desembarca em Shenzhen antes de encontro com Trump", "cnn", "14:40", "mundo"),
               mk("Putin já está em Shenzhen; Trump chega na quarta", "met", "14:50", "mundo"),
               mk("Putin e Xi recebem Trump em Shenzhen nesta quinta", "ab", "15:00", "mundo")]
        f = feed(); f["pautas"][0]["neutro"]["titulo"] = "Kremlin confirma encontro de líderes na quinta (19)"  # só o tema casa
        out = M.analisar([dict(x) for x in its], f, AGORA)
        cands = out["novos"] + out["acionar_itens"]
        alvo = [c for c in cands if c.get("pid_provavel") or c.get("pid")]
        s.assertTrue(alvo, cands)
        s.assertTrue(all((c.get("pid_provavel") or c.get("pid")) == "eua-trump-xi-putin-apec-china" for c in alvo))
        out2 = M.analisar([dict(x) for x in DOSI], feed(), AGORA)  # Dosimetria: a cobertura que casaria está encerrada
        s.assertTrue(all("caso-velho" not in str(c.get("pid_provavel")) for c in out2["novos"]))
        s.assertEqual(out2["acionar_itens"][0]["acao"], "nova")

    def test_casa_pauta(s):
        tk = M.tokens("Trump, Xi e Putin preparam conversa inédita à margem da Apec em Shenzhen")
        ptk = M.tokens("Trump, Xi e Putin na China Diplomacia Kremlin confirma encontro de Putin, Xi e Trump em Shenzhen")
        s.assertGreaterEqual(M.casa_pauta(tk, ptk, M.tokens("Trump, Xi e Putin na China")), 0.35)
        s.assertEqual(M.casa_pauta(M.tokens("Senado aprova projeto das bets"), M.tokens("Senado vota destaques do ajuste fiscal")), 0.0)


class Breves(unittest.TestCase):
    def roda(s, f, ant, nov=None):
        V.erros.clear(); V.avisos.clear()
        V.checar_breves_1811(f, ant, V.dt(f["atualizado_em"]), nov)
        return list(V.erros), list(V.avisos)

    BR = {"titulo": "Trump, Xi e Putin preparam conversa inédita à margem da Apec em Shenzhen", "fonte": "cnn",
          "url": "https://x.example/trump", "secao": "mundo", "hora": "2026-11-18T11:49:00-03:00"}

    def test_breve_nova_da_cobertura_e_erro(s):
        e, a = s.roda(feed([s.BR]), feed([]))
        s.assertEqual(len(e), 1, e); s.assertIn("eua-trump-xi-putin-apec-china", e[0]); s.assertIn("update_add", e[0])

    def test_breve_antiga_nao_repete_e_no_ar_e_aviso(s):
        e, a = s.roda(feed([s.BR]), feed([s.BR]))
        s.assertEqual((e, a), ([], []))
        e, a = s.roda(feed([s.BR]), None)  # validar no feed no ar (sem --prev): só aviso
        s.assertEqual(e, []); s.assertEqual(len(a), 1)

    def test_breve_de_assunto_com_3_veiculos_e_erro(s):
        br = {"titulo": "Alcolumbre e Motta cobram STF sobre Lei da Dosimetria", "fonte": "met", "url": "https://x.example/met/1",
              "secao": "politica"}
        nov = {"gerado": "2026-11-18T11:40-03:00", "novos": [
            {"assunto": DOSI[1]["titulo"], "secao": "politica", "n_fontes": 3, "relevante": True,
             "manchetes": [{"veiculo": x["fonte"], "titulo": x["titulo"], "url": x["url"]} for x in DOSI]}]}
        e, a = s.roda(feed([br], pautas=[]), feed([], pautas=[]), nov)
        s.assertEqual(len(e), 1, e); s.assertIn("3 veículos", e[0]); s.assertIn("add_pauta", e[0])
        nov["novos"][0]["secao"] = "esportes"  # fora de Política, Economia, Brasil e Mundo: não pesa
        s.assertEqual(s.roda(feed([br], pautas=[]), feed([], pautas=[]), nov)[0], [])

    def test_urgente_e_cobertura_encerrada_ficam_de_fora(s):
        e, _ = s.roda(feed([dict(s.BR, urgente=True)]), feed([]))
        s.assertEqual(e, [])
        br = {"titulo": "STF conclui julgamento da Lei da Dosimetria e publica acórdão", "fonte": "cnn", "url": "https://x.example/d", "secao": "politica"}
        s.assertEqual(s.roda(feed([br]), feed([]))[0], [])


class Registro(unittest.TestCase):
    NOV = {"gerado": "2026-11-18T13:40-03:00", "acionar": True, "acionar_motivo": "pauta ajuste-fiscal-lula-4: 5 veículos"}

    def test_regras(s):
        ag = datetime.fromisoformat("2026-11-18T13:55-03:00")
        base = {"tipo": "rapida", "status": "sem_mudancas", "publicou": False, "nota": "x"}
        s.assertTrue(any("motivo" in e for e in V.checar_registro(base, None, ag)))
        s.assertEqual(V.checar_registro(dict(base, motivo="sem_confirmacao"), s.NOV, ag), [])
        s.assertTrue(V.checar_registro(dict(base, motivo="nada_novo"), s.NOV, ag))  # o acionar pediu: nada_novo não vale
        s.assertEqual(V.checar_registro(dict(base, motivo="nada_novo"), dict(s.NOV, acionar=False), ag), [])
        s.assertTrue(V.checar_registro(dict(base, motivo="preguica"), None, ag))
        s.assertEqual(V.checar_registro({"tipo": "rapida", "status": "ok", "publicou": True, "nota": "x"}, None, ag), [])
        s.assertEqual(V.checar_registro({"tipo": "completa", "status": "sem_mudancas", "nota": "x"}, None, ag), [])
        s.assertTrue(V.checar_registro(dict(base, nota=""), None, ag))

    def test_aplicar_rodada_grava_e_recusa(s):
        with tempfile.TemporaryDirectory() as d:
            r = os.path.join(d, "rodadas.json")
            json.dump({"dia": "2026-11-17", "itens": {"21h48": {"tipo": "rapida", "status": "ok", "nota": "velho"}}}, open(r, "w"))
            json.dump(s.NOV, open(os.path.join(d, "novidades.json"), "w"))
            cmd = [sys.executable, "-I", os.path.join(AQUI, "aplicar.py"), "--rodada", r]
            ag = ["--agora", "2026-11-18T13:58:00-03:00"]
            p = subprocess.run(cmd + ['{"hora":"13h48","tipo":"rapida","status":"sem_mudancas","publicou":false,"nota":"x"}'] + ag, capture_output=True, text=True)
            s.assertEqual(p.returncode, 1, p.stdout); s.assertIn("motivo", p.stdout)
            s.assertEqual(json.load(open(r))["dia"], "2026-11-17")  # nada gravado
            p = subprocess.run(cmd + ['{"hora":"13h48","tipo":"rapida","status":"sem_mudancas","publicou":false,"motivo":"nada_novo","nota":"x"}'] + ag, capture_output=True, text=True)
            s.assertEqual(p.returncode, 1, p.stdout)
            p = subprocess.run(cmd + ['{"hora":"13h48","tipo":"rapida","status":"sem_mudancas","publicou":false,"motivo":"sem_confirmacao","nota":"Dosimetria só em manchetes."}'] + ag, capture_output=True, text=True)
            s.assertEqual(p.returncode, 0, p.stdout)
            with open(r) as fh: R = json.load(fh)
            s.assertEqual(R["dia"], "2026-11-18")  # dia novo recomeça
            s.assertEqual(list(R["itens"]), ["13h48"])
            s.assertEqual(R["itens"]["13h48"]["motivo"], "sem_confirmacao"); s.assertNotIn("hora", R["itens"]["13h48"])


if __name__ == "__main__":
    unittest.main(verbosity=1)
