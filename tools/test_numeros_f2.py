#!/usr/bin/env python3
"""Fase 2 (18/11): números de mercado por referência — marcas {dolar}, {ibovespa}, {selic}, {ipca}, {desemprego}.

  cd tools && python3 -I test_numeros_f2.py
"""
import copy, json, os, subprocess, sys, tempfile, unittest
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import validar as V  # noqa: E402

IND = {"dolar": {"id": "dolar", "valor": "R$ 5,78", "variacao": "-0,16%", "data": "2026-11-17", "serie": [5.7] * 10},
       "ibovespa": {"id": "ibovespa", "valor": "170.634", "variacao": "+0,79%", "data": "2026-11-17", "serie": [170000] * 10},
       "selic": {"id": "selic", "valor": "13,75%", "data": "2026-09-17"},
       "ipca12m": {"id": "ipca12m", "valor": "4,63%", "ref": "2026-10"},
       "desemprego": {"id": "desemprego", "valor": "5,2%", "ref": "2026-09"}}
REF = datetime.fromisoformat("2026-11-17T19:48:00-03:00")


def roda_marcas(f, ind=IND):
    V.erros.clear(); V.avisos.clear()
    V.checar_marcas(f, ind, REF)
    return list(V.erros), list(V.avisos)


def pauta(**kw):
    p = {"id": "dolar-hoje", "secao": "economia", "hora": "2026-11-17T19:40:00-03:00",
         "neutro": {"titulo": "Dólar fecha a {dolar} ({dolar.var}) na {dolar.dia}", "texto": "O dólar terminou a {dolar.dia} a {dolar}. A Selic está em {selic}."},
         "subtitulo": "Ibovespa vai a {ibov} pontos ({ibovespa.var})"}
    p.update(kw); return p


class Resolver(unittest.TestCase):
    def test_troca_todas(s):
        M = V.mapa_marcas({}, IND)
        s.assertEqual(V.marca_texto("Dólar fecha a {dolar} ({dolar.var}) na {dolar.dia}", M), "Dólar fecha a R$ 5,78 (-0,16%) na terça (17)")
        s.assertEqual(V.marca_texto("{ibov} pontos; {ibovespa.var}", M), "170.634 pontos; +0,79%")
        s.assertEqual(V.marca_texto("Selic {selic}, IPCA {ipca} até {ipca.mes}, desemprego {desemprego} em {desemprego.mes}", M),
                      "Selic 13,75%, IPCA 4,63% até outubro, desemprego 5,2% em setembro")

    def test_sem_indicador_tira_a_frase(s):
        M = V.mapa_marcas({}, {"dolar": IND["dolar"]})
        s.assertEqual(V.marca_texto("A bolsa fechou a {ibov} pontos. O dólar ficou em {dolar}.", M), "O dólar ficou em R$ 5,78.")
        s.assertEqual(V.marca_texto("Bolsa a {ibov} pontos", M), "Bolsa a pontos")
        s.assertNotIn("{", V.marca_texto("Bolsa ({ibovespa.var})", M))

    def test_reserva_do_feed(s):
        f = {"indicadores": {"itens": [{"id": "dolar", "valor": "R$ 5,60", "data": "2026-11-13"}]}, "pautas": [pauta()]}
        r = V.marcas_resolver(f, None)
        s.assertTrue(r["pautas"][0]["neutro"]["titulo"].startswith("Dólar fecha a R$ 5,60"))
        r = V.marcas_resolver(f, IND)  # indicadores.json vale sobre a reserva
        s.assertTrue(r["pautas"][0]["neutro"]["titulo"].startswith("Dólar fecha a R$ 5,78"))
        s.assertIn("{dolar}", f["pautas"][0]["neutro"]["titulo"])  # não mexe no original

    def test_quadro_e_ilustracao_se_preenchem(s):
        p = pauta(visuais=[{"tipo": "numeros", "titulo": "Mercado", "itens": [{"valor": "{dolar}", "rotulo": "Dólar na {dolar.dia}"}, {"valor": "{ibov}", "rotulo": "Ibovespa"}]}],
                  imagem={"modelo": "dinheiro", "dados": {"valor": "{dolar}", "legenda": "Dólar"}})
        r = V.marcas_resolver({"pautas": [p]}, IND)["pautas"][0]
        s.assertEqual(r["visuais"][0]["itens"][0], {"valor": "R$ 5,78", "rotulo": "Dólar na terça (17)"})
        s.assertEqual(r["imagem"]["dados"]["valor"], "R$ 5,78")


class Validar(unittest.TestCase):
    def test_marcas_certas_sem_erro(s):
        e, a = roda_marcas({"pautas": [pauta(faq=[{"p": "Quanto custa o dólar agora?", "r": "{dolar} no fechamento de {dolar.dia}."}])],
                            "capa": {"linha_fina": "Dólar a {dolar}"}, "resumo_dia": {"itens": [{"texto": "Bolsa sobe {ibovespa.var}"}]}})
        s.assertEqual((e, a), ([], []))

    def test_marca_errada(s):
        e, _ = roda_marcas({"pautas": [pauta(subtitulo="Euro a {euro}; dólar {dolar.mes}; Selic {selic.var}")]})
        s.assertTrue(any("{euro}" in x and "desconhecida" in x for x in e), e)
        s.assertTrue(any("{dolar.mes}" in x for x in e), e)
        s.assertTrue(any("{selic.var}" in x for x in e), e)

    def test_marca_fora_dos_campos_de_agora(s):
        p = pauta(atualizacoes=[{"hora": "2026-11-17T17:30:00-03:00", "texto": "Dólar fecha a {dolar}."}])
        e, _ = roda_marcas({"pautas": [p], "breves": [{"titulo": "Bolsa a {ibov}"}]})
        s.assertTrue(any("atualizacoes.0.texto" in x and "fora dos campos" in x for x in e), e)
        s.assertTrue(any("breves.0.titulo" in x for x in e), e)

    def test_rs_e_porcento_duplicados(s):
        e, _ = roda_marcas({"pautas": [pauta(subtitulo="Dólar a R$ {dolar}, Selic {selic}%")]})
        s.assertTrue(any("R$" in x for x in e), e)
        s.assertTrue(any("%" in x for x in e), e)

    def test_data_digitada_que_desmente(s):
        """às 18h48 o robô ainda não gravou o fechamento de terça: 'fecha a {dolar} nesta terça (17)' mostraria o de segunda"""
        ind = copy.deepcopy(IND); ind["dolar"]["data"] = "2026-11-16"
        _, a = roda_marcas({"pautas": [pauta(neutro={"titulo": "Dólar fecha a {dolar} nesta terça (17)", "texto": "x"})]}, ind)
        s.assertTrue(any("{dolar.dia}" in x and "segunda (16)" in x for x in a), a)
        _, a = roda_marcas({"pautas": [pauta(neutro={"titulo": "Dólar fecha a {dolar} na {dolar.dia}", "texto": "x"})]}, ind)
        s.assertEqual(a, [])

    def test_sugere_marca_no_quadro(s):
        p = pauta(visuais=[{"tipo": "numeros", "titulo": "Câmbio", "itens": [{"valor": "R$ 5,66", "rotulo": "Dólar"}, {"valor": "2%", "rotulo": "alta"}]}])
        _, a = roda_marcas({"pautas": [p]})
        s.assertTrue(any("quadro de números" in x and "{dolar}" in x for x in a), a)

    def test_checar_ve_o_valor_resolvido(s):
        """o mesmo dado com a marca em todo lugar não dá UM NÚMERO SÓ; o digitado diferente continua avisando e sugere a marca"""
        p = pauta(neutro={"titulo": "Dólar fecha a {dolar} na {dolar.dia}", "texto": "O dólar fechou a {dolar}."}, subtitulo="Moeda termina a {dolar}")
        p["visuais"] = [{"tipo": "numeros", "titulo": "Dólar", "itens": [{"valor": "{dolar}", "rotulo": "fechamento"}, {"valor": "{dolar.var}", "rotulo": "no dia"}]}]
        f = {"atualizado_em": "2026-11-17T19:48:00-03:00", "pautas": [p], "capa": {"linha_fina": "Dólar a {dolar}"}}
        V.erros.clear(); V.avisos.clear()
        V.checar(f, None, False, REF, IND)
        s.assertFalse([x for x in V.avisos + V.erros if "valores diferentes" in x or "{" in x or "não bate" in x], V.avisos + V.erros)
        p["subtitulo"] = "Dólar termina a R$ 5,66"
        V.erros.clear(); V.avisos.clear()
        V.checar(f, None, False, REF, IND)
        s.assertTrue(any("valores diferentes" in x and "{dolar}" in x for x in V.avisos), V.avisos)
        s.assertTrue(any("subtitulo" in x and "indicador da Capa" in x and "{dolar}" in x for x in V.avisos + V.erros), V.avisos + V.erros)


class Aplicar(unittest.TestCase):
    def test_historico_de_titulos_e_dormentes_congelam(s):
        d = tempfile.mkdtemp()
        base = json.load(open(os.path.join(AQUI, "fixtures", "feed_mini.json"), encoding="utf-8"))
        base["atualizado_em"] = "2026-11-17T18:48:00-03:00"
        p0, p1 = base["pautas"][0], base["pautas"][1] if len(base["pautas"]) > 1 else None
        p0["neutro"]["titulo"] = "Dólar fecha a {dolar} na {dolar.dia}"
        if p1: p1["neutro"]["titulo"] = "Bolsa a {ibov} pontos"
        json.dump(base, open(os.path.join(d, "feed.json"), "w"), ensure_ascii=False)
        json.dump({"itens": list(IND.values())}, open(os.path.join(d, "indicadores.json"), "w"), ensure_ascii=False)
        ops = [{"op": "update_add", "pid": p0["id"], "hora": "19h40", "texto": "Fechamento do dia.", "titulo": "Dólar cai a {dolar} na {dolar.dia}"}]
        if p1: ops.append({"op": "remove_pauta", "pid": p1["id"]})
        json.dump(ops, open(os.path.join(d, "patch.json"), "w"))
        r = subprocess.run([sys.executable, "-I", os.path.join(AQUI, "aplicar.py"), os.path.join(d, "feed.json"), os.path.join(d, "patch.json"),
                            "-o", os.path.join(d, "novo.json"), "--agora", "2026-11-17T19:48:00-03:00"], capture_output=True, text=True)
        s.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        n = json.load(open(os.path.join(d, "novo.json"), encoding="utf-8"))
        q = next(x for x in n["pautas"] if x["id"] == p0["id"])
        s.assertEqual(q["neutro"]["titulo"], "Dólar cai a {dolar} na {dolar.dia}")  # o título do ar continua com a marca
        s.assertEqual([t["titulo"] for t in q["titulos"]], ["Dólar fecha a R$ 5,78 na terça (17)", "Dólar cai a R$ 5,78 na terça (17)"])
        if p1:
            dm = next(x for x in n["dormentes"] if x["id"] == p1["id"])
            s.assertEqual(dm["titulo"], "Bolsa a 170.634 pontos")
        # rodar de novo sem mudar o título não duplica o histórico
        r = subprocess.run([sys.executable, "-I", os.path.join(AQUI, "aplicar.py"), os.path.join(d, "novo.json"), "-o", os.path.join(d, "novo2.json"),
                            "--agora", "2026-11-17T20:48:00-03:00"], capture_output=True, text=True)
        s.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        q2 = next(x for x in json.load(open(os.path.join(d, "novo2.json"), encoding="utf-8"))["pautas"] if x["id"] == p0["id"])
        s.assertEqual(len(q2["titulos"]), 2)


class Paginas(unittest.TestCase):
    def test_previa_com_o_valor_e_endereco_sem_numero(s):
        d = tempfile.mkdtemp()
        base = json.load(open(os.path.join(AQUI, "fixtures", "feed_mini.json"), encoding="utf-8"))
        p0 = base["pautas"][0]
        p0["neutro"]["titulo"] = "Dólar fecha a {dolar} na {dolar.dia}"
        p0["subtitulo"] = "Ibovespa a {ibov} pontos"
        json.dump(base, open(os.path.join(d, "feed.json"), "w"), ensure_ascii=False)
        json.dump({"itens": list(IND.values())}, open(os.path.join(d, "indicadores.json"), "w"), ensure_ascii=False)
        r = subprocess.run([sys.executable, "-I", os.path.join(AQUI, "paginas.py"), os.path.join(d, "feed.json"), os.path.join(d, "m")], capture_output=True, text=True)
        s.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        h = open(os.path.join(d, "m", p0["id"] + ".html"), encoding="utf-8").read()
        s.assertIn("Dólar fecha a R$ 5,78 na terça (17)", h)
        s.assertIn("Ibovespa a 170.634 pontos", h)
        s.assertNotIn("{dolar", h)
        idx = json.load(open(os.path.join(d, "m", "indice.json"), encoding="utf-8"))
        s.assertEqual(idx.get(p0["id"]), "dolar-fecha-a-na")


if __name__ == "__main__":
    unittest.main()
