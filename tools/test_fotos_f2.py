#!/usr/bin/env python3
"""Fase 2 (18/11): foto só com confirmação forte. Foto própria só com "mostra" que cita a pessoa ou o lugar do título;
acervo só com retrato da 1ª pessoa da frase principal do título ou foto do lugar que o título E o nome do arquivo dizem.

  python3 tools/test_fotos_f2.py
"""
import json, os, sys, unittest, urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import paginas as PG  # noqa: E402
import validar as V  # noqa: E402

W = "https://upload.wikimedia.org/wikipedia/commons/a/ab/"
AB = "https://imagens.ebc.com.br/x/"


def foto(n, alt=None):
    return {"url": W + urllib.parse.quote(n), "credito": "Foto de arquivo: X/Wikimedia Commons (CC BY 2.0)", "alt": alt or "Foto de arquivo"}


def P(i, sec, t, **k):
    return dict({"id": i, "secao": sec, "neutro": {"titulo": t}}, **k)


ACERVO = {"gerado": "x",
          "pessoas": {"Hugo Motta": {"chaves": ["Hugo Motta", "Motta"], "fotos": [foto("Hugo_Motta_(cropped).jpg")]},
                      "Edson Fachin": {"chaves": ["Fachin"], "fotos": [foto("Edson_Fachin_(cropped).jpg")]},
                      "Gilmar Mendes": {"chaves": ["Gilmar"], "grupo": "curado", "fotos": []},
                      "Fernando Haddad": {"chaves": ["Haddad"], "grupo": "curado", "fotos": []},
                      "Zé Ninguém": {"chaves": ["Zé Ninguém"], "grupo": "camara", "cargo": "Deputado federal (XX-SP)", "fotos": []}},
          "assuntos": {"Senado plenário": {"chaves": ["Senado"], "fotos": [foto("Plenário_do_Senado_(29281060086).jpg")]},
                       "Banco Central": {"chaves": ["Banco Central", "Copom", "Selic", "juros"], "fotos": [foto("Edifício_Sede_do_Banco_Central_do_Brasil.jpg")]},
                       "supermercado": {"chaves": ["preços", "alimentos"], "fotos": [foto("Gôndola_do_supermercado.jpg")]},
                       "China": {"chaves": ["China"], "fotos": [foto("Beijing_skyline_(cropped).jpg")]},
                       "Flamengo": {"chaves": ["Flamengo"], "secoes": ["esportes"], "fotos": [foto("Estádio_do_Maracanã_-_panorama.jpg")]},
                       "Cruzeiro": {"chaves": ["Cruzeiro"], "secoes": ["esportes"], "fotos": [foto("Mineirão_Aérea.jpg")]},
                       "STF": {"chaves": ["STF"], "fotos": [foto("Prédio_do_Supremo_Tribunal_Federal.jpg")]},
                       "Congresso": {"chaves": ["Congresso"], "fotos": [foto("Congresso_Nacional_-_50495144217.jpg")]}},
          "temas": {"politica/Planalto e governo": [foto("Fachada_do_Palácio_do_Planalto.jpg"), foto("Esplanada_dos_Ministérios.jpg")],
                    "politica/Partidos": [foto("Plenário_da_Câmara_dos_Deputados_(2).jpg")],
                    "economia/Contas públicas": [foto("Ministério_da_Fazenda_2017.jpg")],
                    "economia/Mercados": [foto("Bovespa,_São_Paulo_city_downtown.jpg")],
                    "economia/Seu dinheiro": [foto("Reverso_da_cédula_de_200_reais.jpg")],
                    "brasil/Saúde": [foto("Unidade_Básica_de_Saúde.jpg")]}}


def nome(M, i):
    return urllib.parse.unquote(M[i]["url"].rsplit("/", 1)[-1]) if i in M else None


class TesteAcervo(unittest.TestCase):
    def test_so_pessoa_ou_lugar_confirmado(s):
        pautas = [P("motta", "politica", "Motta marca a votação da PEC para terça", subtema="Congresso"),
                  P("senado", "politica", "Senado aprova o ajuste fiscal por 45 a 31", subtema="Congresso"),
                  P("copom", "economia", "Copom mantém a Selic em 15%", subtema="Juros e inflação"),
                  P("selic", "economia", "Juros futuros sobem com o dólar", subtema="Juros e inflação"),        # não diz o lugar
                  P("planalto", "politica", "Planalto prepara a reforma ministerial", subtema="Planalto e governo"),
                  P("governo", "politica", "Governo prepara a reforma ministerial", subtema="Planalto e governo"),  # tema sem lugar no título
                  P("aluguel", "economia", "Aluguel sobe 9% em 12 meses", subtema="Seu dinheiro"),             # cédula: assunto genérico
                  P("precos", "economia", "Preços dos alimentos sobem em outubro", subtema="Juros e inflação"),  # gôndola: genérico
                  P("covid", "brasil", "Fiocruz vê alta de casos de Covid", subtema="Saúde"),                  # UBS: genérico
                  P("china", "mundo", "China anuncia tarifa sobre soja", subtema="Ásia"),                      # cartão-postal de país
                  P("fla", "esportes", "Flamengo vence o Vasco e segue líder", subtema="Brasileirão"),          # estádio não citado
                  P("maraca", "esportes", "Maracanã recebe a final da Copa do Brasil", subtema="Copa do Brasil"),
                  P("fachin2", "politica", "PGR pede arquivar inquérito; Fachin mira dezembro", subtema="STF e Judiciário"),  # 2ª frase
                  P("senado-eua", "mundo", "Senado dos EUA aprova orçamento", subtema="EUA")]                   # não é o Senado daqui
        M = PG.mapa_fotos(pautas, ACERVO)
        s.assertEqual(nome(M, "motta"), "Hugo_Motta_(cropped).jpg")
        s.assertEqual(nome(M, "senado"), "Plenário_do_Senado_(29281060086).jpg")
        s.assertEqual(nome(M, "copom"), "Edifício_Sede_do_Banco_Central_do_Brasil.jpg")
        s.assertEqual(nome(M, "planalto"), "Fachada_do_Palácio_do_Planalto.jpg")
        s.assertIn("maracan", (nome(M, "maraca") or "maracan").lower())  # 18/11 noite: a foto do Maracanã pode ter ido para outra notícia (sem repetir)
        # 18/11 noite (Pedro: "errar para mais"): assunto genérico, cartão-postal e tema ganham foto; só não pode a pessoa
        # que está na 2ª frase nem o Senado daqui em notícia dos EUA
        s.assertNotIn("fachin", (nome(M, "fachin2") or "").lower())
        s.assertNotIn("senado", (nome(M, "senado-eua") or "").lower())

    def test_lugar_no_exterior(s):
        # Lula no exterior: nada de Planalto mesmo com "Planalto" no título
        M = PG.mapa_fotos([P("viagem", "politica", "Planalto confirma viagem de Lula à China", subtema="Planalto e governo")], ACERVO)
        s.assertNotIn("planalto", (nome(M, "viagem") or "").lower())

    def test_tema_tira_retrato(s):
        M = PG.mapa_fotos([P("m", "politica", "Motta é internado em Brasília", foto_arquivo="tema")], ACERVO)
        s.assertNotIn("m", M)


class TesteMeioTermo(unittest.TestCase):
    """18/11, meio-termo do Pedro: órgão do sujeito e estádio do mandante."""
    def test_orgao_e_mandante(s):
        pautas = [P("gilmar", "politica", "Gilmar suspende a lei das bets", subtema="STF e Judiciário"),           # ministro do STF → STF
                  P("kassio", "politica", "Kassio deve levar ao plenário a revisão da pena", subtema="STF e Judiciário"),
                  P("haddad", "economia", "Haddad anuncia corte de R$ 20 bi", subtema="Contas públicas"),          # → Fazenda
                  P("dep", "politica", "Zé Ninguém apresenta projeto contra apostas", subtema="Congresso"),        # deputado → Câmara
                  P("pl", "politica", "Relator mantém texto do PL das big techs", subtema="Congresso"),             # PL/relator → Congresso
                  P("fachin", "politica", "Fachin marca o julgamento", subtema="STF e Judiciário"),                 # retrato vem antes da fachada
                  P("jogo", "esportes", "Brasileirão: Cruzeiro x Palmeiras jogam na quarta", subtema="Brasileirão"),  # mandante
                  P("final", "esportes", "Cruzeiro x Flamengo decidem a final em Brasília", subtema="Copa do Brasil"),  # final: campo neutro
                  P("fora", "esportes", "Cruzeiro x Boca jogam em Buenos Aires", subtema="Libertadores"),           # fora do Brasil
                  P("bolsa", "economia", "Bolsa sobe 1,2% com alta da Petrobras", subtema="Mercados"),
                  P("dolar", "economia", "Dólar sobe 2,17% e vai a R$ 5,60", subtema="Mercados"),                   # dólar: sem Bovespa
                  P("aneel", "brasil", "Aneel retoma votação sobre a Enel-SP", subtema="Infraestrutura e transporte"),  # "votação" sozinha não é Congresso
                  P("stf2", "politica", "PGR denuncia Bolsonaro; Gilmar vota na terça", subtema="STF e Judiciário")]  # Gilmar só na 2ª frase
        M = PG.mapa_fotos(pautas, ACERVO)
        s.assertEqual(nome(M, "gilmar"), "Prédio_do_Supremo_Tribunal_Federal.jpg")
        s.assertIsNone(nome(M, "kassio"))                                   # a única foto do STF já foi para a notícia do Gilmar
        s.assertEqual(nome(M, "haddad"), "Ministério_da_Fazenda_2017.jpg")
        s.assertEqual(nome(M, "dep"), "Plenário_da_Câmara_dos_Deputados_(2).jpg")
        s.assertEqual(nome(M, "pl"), "Congresso_Nacional_-_50495144217.jpg")
        s.assertEqual(nome(M, "fachin"), "Edson_Fachin_(cropped).jpg")
        s.assertEqual(nome(M, "jogo"), "Mineirão_Aérea.jpg")
        s.assertEqual(nome(M, "bolsa"), "Bovespa,_São_Paulo_city_downtown.jpg")
        for i in ("final", "fora", "dolar", "aneel", "stf2"):
            s.assertIsNone(nome(M, i), i)
        M2 = PG.mapa_fotos([P("kassio", "politica", "Kassio deve levar ao plenário a revisão da pena", subtema="STF e Judiciário")], ACERVO)
        s.assertEqual(nome(M2, "kassio"), "Prédio_do_Supremo_Tribunal_Federal.jpg")


class TesteFotoPropria(unittest.TestCase):
    def F(s, **k):
        return dict({"url": AB + "img.jpg", "credito": "Foto: Marcelo Camargo/Agência Brasil", "alt": "Plenário do Senado"}, **k)

    def test_confirma(s):
        p = P("x", "politica", "Senado aprova o ajuste fiscal por 45 a 31")
        s.assertTrue(PG.confirma(p, s.F()))                                                # 18/11 noite: sem "mostra" a foto própria vale
        s.assertTrue(PG.confirma(p, s.F(mostra="Senadores no plenário do Senado durante a votação")))
        s.assertFalse(PG.confirma(p, s.F(mostra="Fachada do Ministério da Fazenda")))     # não cita nada do título
        s.assertFalse(PG.confirma(p, s.F(mostra="A votação de hoje")))                    # só palavras comuns
        s.assertTrue(PG.confirma(P("c", "mundo", "Lula discursa na COP31 em Belém"), s.F(mostra="Lula na plenária da COP31")))
        s.assertTrue(PG.confirma(P("d", "brasil", "Incêndio em fábrica de Diadema deixa 3 feridos"), s.F(mostra="Bombeiros no galpão em Diadema")))

    def test_mapa_e_previa(s):
        A = ACERVO
        sem = P("a", "politica", "Senado aprova o ajuste fiscal", foto=s.F(), prioridade=9)
        com = P("b", "politica", "Motta marca a votação da PEC", foto=s.F(url=AB + "motta.jpg", mostra="Hugo Motta no plenário da Câmara"), prioridade=8)
        M = PG.mapa_fotos([sem, com], A)
        s.assertNotIn("a", M)                                                 # 18/11 noite: foto própria sem "mostra" vale
        s.assertNotIn("b", M)                                                 # foto própria confirmada fica
        s.assertTrue(PG.propria_ok(com, com["foto"], PG.preparar(A), {}))
        s.assertTrue(PG.propria_ok(sem, sem["foto"], PG.preparar(A), {}))
        pg = PG.pagina(com, M, lambda p: PG.propria_ok(p, p.get("foto"), PG.preparar(A), {}))
        s.assertIn(AB + "motta.jpg", pg)

    def test_validar(s):
        def erros(feed, ant=None):
            V.erros.clear(); V.avisos.clear()
            pid = feed["pautas"][0]["id"]  # roda o checar inteiro e fica só com as mensagens da foto
            try: V.checar(feed, ant)
            except Exception: pass
            return [m for m in V.erros if m.startswith(f"[{pid}] foto")], [m for m in V.avisos if m.startswith(f"[{pid}] foto")]
        with open(os.path.join(os.path.dirname(AQUI), "feed.json"), encoding="utf-8") as fh: base = json.load(fh)
        p0 = dict(base["pautas"][0]); tit = p0["neutro"]["titulo"]
        nomes_tit = sorted(PG.nomes(tit))
        s.assertTrue(nomes_tit, tit)
        f = dict(base); f["pautas"] = [dict(p0, foto=s.F())] + base["pautas"][1:]
        e, a = erros(f)
        s.assertTrue(any("mostra" in m for m in e), e)                         # foto nova sem "mostra": erro
        ant = dict(base); ant["pautas"] = [dict(p0, foto=s.F())] + base["pautas"][1:]
        e, a = erros(f, ant)
        s.assertFalse(any("mostra" in m for m in e), e); s.assertTrue(any("mostra" in m for m in a), a)  # já publicada: só aviso
        f["pautas"][0] = dict(p0, foto=s.F(mostra="Uma coisa qualquer"))
        e, a = erros(f)
        s.assertTrue(any("não cita" in m for m in e), e)
        orig = [w for w in tit.split() if PG.nomes(w) & set(nomes_tit)][0]
        f["pautas"][0] = dict(p0, foto=s.F(mostra="Foto de " + orig))
        e, a = erros(f)
        s.assertFalse(any("mostra" in m for m in e + a), (e, a))


if __name__ == "__main__":
    unittest.main(verbosity=1)
