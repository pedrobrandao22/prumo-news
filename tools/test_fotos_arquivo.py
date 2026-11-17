#!/usr/bin/env python3
"""Testes do robô de fotos de arquivo, sem internet (respostas gravadas em tools/fixtures/).

  python3 tools/test_fotos_arquivo.py
"""
import io, json, os, re, shutil, sys, tempfile, unittest, urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import fotos_arquivo as FA  # noqa: E402
import paginas as PG  # noqa: E402

FIX = os.path.join(AQUI, "fixtures")


def fixture(n):
    return open(os.path.join(FIX, n), encoding="utf-8").read()


def jpeg(w=1600, h=2000):
    try:
        from PIL import Image
    except Exception:
        return None
    im = Image.new("RGB", (w, h), (90, 110, 140))
    for y in range(0, h, 7):  # textura para o arquivo não ficar trivial
        for x in range(0, w, 97): im.putpixel((x, y), (200, (x * y) % 255, 40))
    b = io.BytesIO(); im.save(b, "JPEG", quality=92); return b.getvalue()


class Rede:
    """Imita as APIs: Commons (busca), Câmara (2 páginas) e Senado; conta downloads."""
    def __init__(s, falha=()):
        s.falha, s.baixados, s.buscas = set(falha), [], 0
        s.img = jpeg()

    def get_json(s, url, tempo=25):
        if any(f in url for f in s.falha): raise OSError("sem rede")
        if url.startswith(FA.API):
            s.buscas += 1
            q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)["gsrsearch"][0].replace(" filetype:bitmap", "")
            m = re.search(r'intitle:"([^"]+)"', q); nome = m.group(1) if m else q
            t = fixture("commons_busca.json").replace("{NOME}", nome).replace("{ARQ}", urllib.parse.quote(nome.replace(" ", "_")))
            return json.loads(t)
        if "dadosabertos.camara.leg.br" in url:
            return json.loads(fixture("camara_deputados_p2.json" if "pagina=2" in url else "camara_deputados_p1.json"))
        if "legis.senado.leg.br" in url: return json.loads(fixture("senado_atual.json"))
        raise OSError("url inesperada " + url)

    def get_bytes(s, url, tempo=30, maximo=0):
        if any(f in url for f in s.falha): raise OSError("sem rede")
        s.baixados.append(url); return s.img


FEED = {"pessoas": {"Maurício Marcon": "Deputado.", "Fulano Novo da Silva": "Pessoa do feed."},
        "pautas": [{"id": "a", "secao": "politica", "neutro": {"titulo": "Zé Trovão lança candidatura contra Motta"}},
                   {"id": "b", "secao": "economia", "neutro": {"titulo": "Copom mantém a Selic"}}]}


class Base(unittest.TestCase):
    def setUp(s):
        s.dir = tempfile.mkdtemp(prefix="fa-")
        s.feed = os.path.join(s.dir, "feed.json"); s.saida = os.path.join(s.dir, "fotos-arquivo.json")
        json.dump(FEED, open(s.feed, "w", encoding="utf-8"), ensure_ascii=False)
        s.rede = Rede(); s._orig = (FA.get_json, FA.get_bytes, FA.time.sleep)
        FA.get_json, FA.get_bytes = s.rede.get_json, s.rede.get_bytes; FA.time.sleep = lambda x: None
        # listas menores para o teste ser rápido (o algoritmo é o mesmo)
        s._listas = (FA.PESSOAS, FA.CURADOS, FA.TEMAS, FA.ASSUNTOS)
        FA.PESSOAS = {"Hugo Motta": ["Hugo Motta", "Motta"], "Fernando Haddad": ["Haddad"], "Flávio Bolsonaro": ["Flávio Bolsonaro", "Flávio"]}
        FA.CURADOS = {"stf": {"Dias Toffoli": ["Toffoli"]}}
        FA.TEMAS = {"politica/Congresso": [("Congresso Nacional", ["congresso nacional"])], "economia/Mercados": [("Bolsa de Valores", ["bolsa de valores"])]}
        FA.ASSUNTOS = {"Banco Central": (["Banco Central", "Copom", "Selic"], "Banco Central do Brasil", ["banco central"], None)}

    def tearDown(s):
        FA.get_json, FA.get_bytes, FA.time.sleep = s._orig
        FA.PESSOAS, FA.CURADOS, FA.TEMAS, FA.ASSUNTOS = s._listas
        shutil.rmtree(s.dir, ignore_errors=True)

    def roda(s, *extra):
        return FA.main([s.feed, s.saida, *extra])

    def arq(s):
        return json.load(open(s.saida, encoding="utf-8"))


class TesteLicencas(Base):
    def test_so_licenca_livre_com_autor(s):
        r = FA.busca('intitle:"Fernando Haddad"', ["Fernando Haddad"], n=5, exige_todos=True)
        lic = [x["licenca"] for x in r]
        s.assertEqual(sorted(lic), ["CC BY 2.0", "CC BY 3.0 br"], lic)  # recusa NC, PNG, pequena e sem licença
        for x in r:
            s.assertRegex(x["credito"], r"^Foto de arquivo: .+/Wikimedia Commons \(CC BY")
            s.assertTrue(x["autor"] and "<" not in x["autor"])
            s.assertTrue(x["pagina"].startswith("https://commons.wikimedia.org/wiki/File:"))

    def test_miniatura_padrao(s):
        u = "https://upload.wikimedia.org/wikipedia/commons/a/a1/Foo_bar.jpg"
        s.assertEqual(FA.miniatura(u), "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Foo_bar.jpg/960px-Foo_bar.jpg")
        s.assertEqual(FA.miniatura("https://www.camara.leg.br/internet/deputado/bandep/1.jpg"), "https://www.camara.leg.br/internet/deputado/bandep/1.jpg")


@unittest.skipIf(jpeg() is None, "sem Pillow")
class TesteAcervo(Base):
    def test_completo(s):
        s.assertEqual(s.roda("--limite", "200"), 0)
        A = s.arq(); P = A["pessoas"]
        s.assertEqual(A["versao"], 2)
        # deputados e senadores com cargo, partido, UF e crédito oficial
        z = P["Zé Trovão"]
        s.assertEqual((z["grupo"], z["partido"], z["uf"], z["cargo"]), ("camara", "PL", "SC", "Deputado federal (PL-SC)"))
        s.assertIn("Zé Trovão", z["chaves"])
        s.assertEqual(z["fotos"][0]["credito"], FA.CRED_CAMARA)
        s.assertNotIn("Pastor", P)          # nome de uma palavra comum não vira chave
        s.assertNotIn("Foto Estranha", P)   # foto fora do endereço oficial
        s.assertEqual(P["Maurício Marcon"]["fotos"][0]["url"], "https://www.camara.leg.br/internet/deputado/bandep/160976.jpg")  # http → https
        # quem já estava (Commons) ganha o retrato oficial na frente e o cargo
        m = P["Hugo Motta"]
        s.assertEqual(m["grupo"], "camara"); s.assertIn("Motta", m["chaves"])
        s.assertEqual(m["fotos"][0]["fonte"], "Câmara dos Deputados"); s.assertTrue(any(f["fonte"] == "Wikimedia Commons" for f in m["fotos"]))
        f = P["Flávio Bolsonaro"]; s.assertEqual((f["grupo"], f["uf"]), ("senado", "RJ")); s.assertEqual(f["fotos"][0]["credito"], FA.CRED_SENADO)
        s.assertEqual(P["Dias Toffoli"]["grupo"], "stf")
        s.assertIn("Fulano Novo da Silva", P)  # pessoa do feed
        # arquivos leves no repositório
        locais = [x for x in self_fotos(A) if x.get("local")]
        s.assertEqual(len(locais), len(self_fotos(A)))
        for x in locais:
            p = os.path.join(s.dir, x["local"])
            s.assertTrue(os.path.exists(p), x["local"]); s.assertTrue(x["local"].startswith("acervo/"))
            s.assertLessEqual(os.path.getsize(p), 95 * 1024); s.assertLessEqual(x["w"], 640); s.assertLessEqual(x["h"], 800)
            s.assertTrue(p.endswith(".webp"))
        # compatível com os apps antigos: url de domínio permitido e crédito em toda foto
        for x in self_fotos(A):
            s.assertTrue(PG.FOTO_OK.match(x["url"]), x["url"]); s.assertTrue(x.get("credito")); s.assertTrue(x.get("licenca"))

    def test_lotes_e_prioridade(s):
        s.roda("--limite", "3")
        A = s.arq(); loc = [x for x in self_fotos(A) if x.get("local")]
        s.assertEqual(len(loc), 3)
        # primeiro quem está nas notícias de hoje (Zé Trovão, Motta)
        s.assertTrue(A["pessoas"]["Zé Trovão"]["fotos"][0].get("local"))
        s.assertTrue(A["pessoas"]["Hugo Motta"]["fotos"][0].get("local"))
        n0 = len(s.rede.baixados)
        s.roda("--limite", "3")  # a 2ª rodada continua de onde parou, sem baixar de novo o que já tem
        A2 = s.arq(); loc2 = [x for x in self_fotos(A2) if x.get("local")]
        s.assertEqual(len(loc2), 6); s.assertEqual(len(s.rede.baixados) - n0, 3)

    def test_estavel(s):
        s.roda("--limite", "500"); A = s.arq(); b = s.rede.buscas; n = len(s.rede.baixados)
        s.roda("--limite", "500"); A2 = s.arq()
        s.assertEqual(json.dumps(A["pessoas"], sort_keys=True), json.dumps(A2["pessoas"], sort_keys=True))
        s.assertEqual(len(s.rede.baixados), n)            # nada baixado de novo
        s.assertLess(s.rede.buscas - b, b)                # e menos buscas (quem já tem fotos não procura)

    def test_falha_da_rede_mantem_o_anterior(s):
        s.roda("--limite", "50"); A = s.arq()
        s.rede.falha = {"dadosabertos.camara.leg.br", "legis.senado.leg.br"}
        s.assertEqual(s.roda(), 0); A2 = s.arq()
        s.assertEqual(A2["pessoas"]["Zé Trovão"]["fotos"][0]["url"], A["pessoas"]["Zé Trovão"]["fotos"][0]["url"])
        s.assertEqual(A2["pessoas"]["Flávio Bolsonaro"]["grupo"], "senado")
        s.rede.falha = {"wikimedia.org", "camara.leg.br", "senado.leg.br"}
        os.remove(s.saida)
        s.assertEqual(s.roda(), 1)  # nada encontrado: não grava
        s.assertFalse(os.path.exists(s.saida))

    def test_pessoa_do_feed_fica_um_tempo(s):
        s.roda("--limite", "50"); A = s.arq()
        x = A["pessoas"]["Fulano Novo da Silva"]; s.assertEqual(x["grupo"], "feed"); s.assertTrue(x.get("visto"))
        s.assertEqual(len(x["fotos"]), 2)  # quem não é da lista fixa guarda 2 fotos
        json.dump({"pessoas": {}, "pautas": FEED["pautas"]}, open(s.feed, "w", encoding="utf-8"))
        b0 = s.rede.buscas; s.roda()
        s.assertIn("Fulano Novo da Silva", s.arq()["pessoas"])          # saiu do feed: continua, sem nova busca
        s.assertFalse(any("Fulano" in u for u in s.rede.baixados[-5:]))
        A = s.arq(); A["pessoas"]["Fulano Novo da Silva"]["visto"] = "2020-01-01"
        json.dump(A, open(s.saida, "w", encoding="utf-8"), ensure_ascii=False)
        s.roda(); s.assertNotIn("Fulano Novo da Silva", s.arq()["pessoas"])  # passou do prazo: sai

    def test_podar(s):
        s.roda("--limite", "50")
        lixo = os.path.join(s.dir, "acervo", "p", "velha-00000000.webp"); open(lixo, "wb").write(b"x")
        s.roda("--podar"); s.assertFalse(os.path.exists(lixo))


class TesteSemPillow(Base):
    def test_jpeg_pequeno(s):
        orig = FA.converter; FA.converter = lambda d, r: None
        s.rede.img = bytes.fromhex("ffd8ffe000104a46494600010100000100010000ffc0001108012c00c8030122000211010311ffd9")
        try:
            s.roda("--limite", "2")
        finally:
            FA.converter = orig
        loc = [x for x in self_fotos(s.arq()) if x.get("local")]
        s.assertEqual(len(loc), 2)
        s.assertTrue(all(x["local"].endswith(".jpg") and (x["w"], x["h"]) == (200, 300) for x in loc), loc)
        s.assertTrue(any("/500px-" in u for u in s.rede.baixados) or all("wikimedia" not in u for u in s.rede.baixados))


W = "https://upload.wikimedia.org/wikipedia/commons/a/ab/"


def foto(nome, cred="Foto de arquivo: Fulano/Wikimedia Commons (CC BY 2.0)", alt="Foto de arquivo"):
    return {"url": W + urllib.parse.quote(nome), "credito": cred, "alt": alt}


class TesteRevisao1511(unittest.TestCase):
    """Revisão das fotos de todas as notícias (15/11): créditos, fotos bloqueadas, retratos de grupo e a escolha da prévia."""

    def test_credito_limpo(s):
        casos = {
            "Foto de arquivo: Agência Senado from Brasilia, Brazil/Wikimedia Commons (CC BY 2.0)": "Foto de arquivo: Agência Senado/Wikimedia Commons (CC BY 2.0)",
            "Foto de arquivo: Agência Senado from Brasilia, Bra…/Wikimedia Commons (CC BY 2.0)": "Foto de arquivo: Agência Senado/Wikimedia Commons (CC BY 2.0)",
            "Foto de arquivo: Taken by Adrian Pingstone in June 2002 and released to the publ…/Wikimedia Commons (Public domain)": "Foto de arquivo: Adrian Pingstone/Wikimedia Commons (domínio público)",
            "Foto de arquivo: Contato: clickdearaujo@gmail.com/Wikimedia Commons (CC BY 2.0)": "Foto de arquivo: autor desconhecido/Wikimedia Commons (CC BY 2.0)",
            "Foto de arquivo: Unknown authorUnknown author/Wikimedia Commons (Public domain)": "Foto de arquivo: autor desconhecido/Wikimedia Commons (domínio público)",
            "Foto de arquivo: Photograph by Mike Peel (www.mikepeel.net)./Wikimedia Commons (CC BY-SA 4.0)": "Foto de arquivo: Mike Peel/Wikimedia Commons (CC BY-SA 4.0)",
            "Foto de arquivo: Rodrigo Silveira Camargo (RodrigoCamargo on commons or RodrigoC…/Wikimedia Commons (CC BY 2.0)": "Foto de arquivo: Rodrigo Silveira Camargo/Wikimedia Commons (CC BY 2.0)",
            "Foto de arquivo: Sérgio Valle Duarte .mw-parser-output .messagebox{margin:4px 0;/Wikimedia Commons (CC BY 3.0)": "Foto de arquivo: Sérgio Valle Duarte/Wikimedia Commons (CC BY 3.0)",
            "Foto de arquivo: Staff Sgt. Craig Cisek, U.S. Air Force/Wikimedia Commons (Public domain)": "Foto de arquivo: Craig Cisek/Força Aérea dos EUA/Wikimedia Commons (domínio público)",
            "Foto de arquivo: José Cruz/ABr/Wikimedia Commons (CC BY 3.0 br)": "Foto de arquivo: José Cruz/ABr/Wikimedia Commons (CC BY 3.0 br)",
            FA.CRED_CAMARA: FA.CRED_CAMARA,
        }
        for a, b in casos.items():
            s.assertEqual(FA.limpa_credito(a), b)
            s.assertEqual(FA.limpa_credito(b), b)  # não estraga o que já está limpo

    def test_bloqueadas_e_historicas(s):
        s.assertTrue(FA.bloqueada(foto("Casa-da-moeda-bovespa-01.jpg")))
        s.assertTrue(FA.bloqueada(foto("Bolsa_de_Valores_(17205467578).jpg")))  # pregão antigo P&B (corretor 16/11)
        s.assertTrue(FA.bloqueada(foto("Bolsa_de_Valores_(17391295482).jpg")))
        s.assertTrue(FA.bloqueada(foto("200_anos_do_Senado_Federal_%2853454234104%29_%28cropped%29.jpg")))  # corretor 17/11
        s.assertTrue(FA.bloqueada(foto("Bosque_Campus_Universidade_Federal_de_Goi%C3%A1s.JPG")))
        s.assertTrue(FA.bloqueada(foto("Vista_de_Goiânia_a_partir_da_Faculdade_de_Ciências_e_Tecnologia,_Campus_Aparecida_de_Goiânia,_Universidade_Federal_de_Goiás,_maio_de_2025_(13).jpg")))  # corretor 17/11 noite
        s.assertFalse(FA.bloqueada(foto("Reitoria_da_Universidade_Federal_de_Goiás.jpg")))
        s.assertFalse(FA.bloqueada(foto("Plen%C3%A1rio_do_Senado_%2829281060086%29.jpg")))
        s.assertTrue(FA.bloqueada(foto("ISS-32_American_EVA_b3_Aki_Hoshide.jpg")))
        s.assertTrue(FA.bloqueada(foto("Senado_Federal_do_Brasil_Plenário_do_Senado_(15717805622).jpg")))
        s.assertTrue(FA.bloqueada(foto("Foo.jpg", cred="Foto de arquivo: Núcleo de digitalização / IMS/Wikimedia Commons (Public domain)")))
        s.assertFalse(FA.bloqueada(foto("Prédio_do_Supremo_Tribunal_Federal_(Brasilia).jpg")))
        s.assertTrue(FA.bloqueada(foto("Carlo_Ancelotti_2016_ICC.jpg")))  # camisa do Bayern, rosto cortado (corretor 16/11 noite)
        s.assertFalse(FA.bloqueada(foto("Carlo_Ancelotti_2012_(cropped).jpg")))
        s.assertFalse(FA.valida_velha(foto("Vestibular.JPG")))

    def test_retrato_de_grupo(s):
        s.assertEqual(FA.grupo(foto("Carlo_Ancelotti_2012_(cropped).jpg")), 0)
        s.assertEqual(FA.grupo(foto("Ofrenda_de_la_Liga_y_la_Champions-50-L.Millán_(Carlo_Ancelotti,_Florentino_Pérez)_(cropped).jpg")), 2)
        s.assertEqual(FA.grupo(foto("Ministra_Margareth_Menezes_acompanha_posse_de_Flávio_Dino_como_novo_ministro_do_STF.jpg")), 2)
        s.assertEqual(FA.grupo(foto("Javier_Milei_y_Santiago_Peña_(cropped).jpg")), 1)
        s.assertEqual(FA.grupo(foto("02.01.2023_-_Posse_de_Jader_Filho_(52626809793)_(cropped).jpg")), 0)
        fotos = [dict(foto("Javier_Milei_y_Santiago_Peña_(cropped).jpg"), fonte="Wikimedia Commons"), dict(foto("Javier_Milei_2023.jpg"), fonte="Wikimedia Commons")]
        s.assertEqual([f["url"].rsplit("/", 1)[-1] for f in FA.so_retratos(fotos)], ["Javier_Milei_2023.jpg"])

    def acervo(s):
        return {"gerado": "x", "padrao": {"mundo": "mundo/Europa", "economia": "economia/Mercados"},
                "pessoas": {"Edson Fachin": {"chaves": ["Fachin"], "fotos": [foto("Edson_Fachin_(cropped).jpg", alt="Foto de arquivo: Edson Fachin")]},
                            "Carlo Ancelotti": {"chaves": ["Ancelotti"], "fotos": [foto("Ofrenda_de_la_Liga_y_la_Champions_(Carlo_Ancelotti,_Florentino_Pérez)_(cropped).jpg"), foto("Carlo_Ancelotti_2016_ICC.jpg")]}},
                "assuntos": {"aviação": {"chaves": ["voos", "aéreo"], "fotos": [foto("Aeroporto_Internacional_de_São_Paulo-Guarulhos_-_Avião.jpg", alt="Foto de arquivo: Aeroporto de Guarulhos avião")]},
                             "China": {"chaves": ["China"], "fotos": [foto("Beijing_skyline_(cropped).jpg")]},
                             "café e agro": {"chaves": ["agro", "café"], "fotos": [foto("Colheita_de_café_moderna.jpg")]},
                             "B3 e Bolsa": {"chaves": ["Ibovespa"], "fotos": [foto("Casa-da-moeda-bovespa-01.jpg"), foto("Bolsa_de_Valores_pregão.jpg")]}},
                "temas": {"mundo/Europa": [foto("European_Parliament_Strasbourg.jpg")], "economia/Mercados": [foto("Bolsa_de_Valores_(1).jpg")],
                          "economia/Empresas": [foto("Building_in_Paulista_Avenue_09.jpg")], "brasil/Meio ambiente e clima": [foto("Enchente_em_Itapecuru_Mirim.jpg")],
                          "politica/STF e Judiciário": [foto("Supremo_Tribunal_Federal2.jpg")]}}

    def test_previa_escolhe_foto_que_combina(s):
        P = lambda i, sec, t, **k: dict({"id": i, "secao": sec, "neutro": {"titulo": t}}, **k)
        pautas = [P("master", "politica", "PGR prepara as primeiras denúncias do caso Master", subtema="STF e Judiciário", subtitulo="Fachin recebe o pedido", prioridade=9),
                  P("fachin", "politica", "Fachin manda arquivar o inquérito", subtema="STF e Judiciário", prioridade=8),
                  P("voos", "mundo", "Aviões colidem em Miami após caos aéreo nos EUA", subtema="EUA", prioridade=7),
                  P("apec", "mundo", "Trump vai se reunir com Xi na China, na cúpula da Apec", subtema="Ásia", foto_arquivo="tema"),
                  P("bb", "economia", "Lucro do BB cai 66%; ação recua e agro reage", subtema="Empresas"),
                  P("ibov", "economia", "Ibovespa sobe 0,66%; dólar fecha a R$ 5,67", subtema="Mercados"),
                  P("canada", "brasil", "Canadá promete US$ 400 milhões a fundo de florestas", subtema="Meio ambiente e clima"),
                  P("cop", "mundo", "Lula negocia com Erdogan na COP31", subtema="Europa"),
                  P("selecao", "esportes", "Brasil perde do Japão; Ancelotti é expulso", subtema="Seleção"),
                  P("propria", "politica", "Senado aprova o ajuste fiscal", subtema="Congresso",
                    foto={"url": W + "Edson_Fachin_(cropped).jpg", "credito": "Foto de arquivo: X/Wikimedia Commons (CC BY 2.0)", "alt": "Foto de arquivo: Edson Fachin"})]
        M = PG.mapa_fotos(pautas, s.acervo())
        nome = lambda i: urllib.parse.unquote(M[i]["url"].rsplit("/", 1)[-1]) if i in M else None
        s.assertIsNone(nome("master"))                      # Fachin só no subtítulo; tema do STF sem STF no título
        s.assertEqual(nome("fachin"), "Edson_Fachin_(cropped).jpg")
        s.assertIsNone(nome("voos"))                        # avião em Guarulhos não serve para voo nos EUA
        s.assertIsNone(nome("apec"))                        # cúpula na China não usa o cartão-postal de Pequim
        s.assertIsNone(nome("bb"))                          # "agro" no fim do título não é colheita de café; Empresas sem foto
        s.assertIsNone(nome("ibov"))                        # 18/11: B3 só com arquivo que diz "Bovespa" (moedas de réis bloqueadas)
        s.assertIsNone(nome("canada"))                      # enchente não ilustra fundo de florestas
        s.assertIsNone(nome("cop"))                         # Parlamento Europeu não é a COP31
        s.assertIsNone(nome("selecao"))                     # 18/11: Ancelotti só na 2ª frase do título (o fato é a derrota)
        s.assertNotIn("propria", M)
        pg = PG.pagina(pautas[-1], M, lambda p: PG.propria_ok(p, p.get("foto"), PG.preparar(s.acervo()), {}))
        s.assertIn("og-padrao.png", pg)                     # retrato de quem não está no título: a prévia não usa
        # sem repetir a mesma foto em duas notícias
        dois = [P("a", "politica", "Fachin vota pela condenação", subtema="Outros"), P("b", "politica", "Fachin pede vista", subtema="Outros")]
        M2 = PG.mapa_fotos(dois, s.acervo()); s.assertEqual(len(M2), 1)

    def test_previa_sem_credito(s):
        p = {"id": "x", "secao": "economia", "neutro": {"titulo": "Ibovespa sobe"}, "subtitulo": "Bolsa fecha em alta."}
        pg = PG.pagina(p, {"x": {"url": W + "Bolsa.jpg", "credito": "Foto de arquivo: Agência Senado from Brasilia, Brazil/Wikimedia Commons (CC BY 2.0)"}})
        s.assertIn('<meta property="og:description" content="Bolsa fecha em alta.">', pg)
        s.assertNotIn("Wikimedia", pg)


class TesteFotos1611b(unittest.TestCase):
    """2ª rodada de 16/11 (169): a foto mostra o fato, o lugar ou a pessoa; na dúvida, ilustração. Prévia própria das
    notícias sem foto; páginas antigas com foto bloqueada."""

    def acervo(s):
        return {"gerado": "x", "pessoas": {},
                "assuntos": {"Atlético-MG": {"chaves": ["Atlético-MG"], "secoes": ["esportes"], "fotos": [foto("Atlético_Mineiro_v_Botafogo,_Arena_MRV,_Horizonte,_2023.jpg", alt="Foto de arquivo: Arena MRV")]},
                             "incêndio": {"chaves": ["Incêndio", "incêndio"], "fotos": [foto("Corpo_de_Bombeiros_intensifica_combate_a_incêndios_florestais.jpg"), foto("Fire_of_a_simulated_C-130_Hercules_plane_crash.jpg")]},
                             "barragem": {"chaves": ["barragem"], "fotos": [foto("Brasil_Barragem_de_3_Marias_(22129648701).jpg")]}},
                "temas": {"economia/Juros e inflação": [foto("Edifício_Sede_do_Banco_Central_do_Brasil.jpg"), foto("Supermercado_Zaffari_Lima_e_Silva_(Porto_Alegre,_Brasil)_0.jpg", alt="Foto de arquivo: Banco Central do Brasil")],
                          "esportes/Série B": [foto("Arbitro_futebol_apontando_estadio_Brasil.jpg")],
                          "esportes/Sul-Americana": [foto("Taça_da_Copa_Sul-Americana_de_2016.jpg")]}}

    def test_regras(s):
        P = lambda i, sec, t, **k: dict({"id": i, "secao": sec, "neutro": {"titulo": t}}, **k)
        pautas = [P("tomate", "economia", "Tomate acumula alta de 58,7% em 2026 com chuva", subtema="Juros e inflação"),
                  P("copom", "economia", "Copom mantém os juros em 15%", subtema="Juros e inflação"),
                  P("serieb", "esportes", "Playoffs da Série B começam domingo (22)", subtema="Série B"),
                  P("final", "esportes", "Atlético-MG e Boca decidem a Sul-Americana no sábado (21)", subtema="Sul-Americana", subtitulo="A final é em Barranquilla, na Colômbia."),
                  P("salto", "brasil", "Incêndio em indústria química de Salto deixa 9 feridos", subtema="Infraestrutura e transporte"),
                  P("cerrado", "brasil", "Incêndio florestal atinge reserva no cerrado", subtema="Meio ambiente e clima"),
                  P("bahia", "brasil", "Chuva derruba barragem na Bahia", subtema="Meio ambiente e clima")]
        M = PG.mapa_fotos(pautas, s.acervo())
        nome = lambda i: urllib.parse.unquote(M[i]["url"].rsplit("/", 1)[-1]) if i in M else None
        s.assertIsNone(nome("tomate"))                                     # nem Banco Central nem fachada de supermercado
        s.assertEqual(nome("copom"), "Edifício_Sede_do_Banco_Central_do_Brasil.jpg")
        s.assertIsNone(nome("serieb"))                                     # árbitro de outro jogo
        s.assertIsNone(nome("final"))                                      # 18/11: taça não é o fato; final em Barranquilla: sem Arena MRV
        s.assertIsNone(nome("salto"))                                      # fábrica não é queimada no mato
        s.assertIsNone(nome("cerrado"))                                    # 18/11: assunto genérico (incêndio) fica com a ilustração
        s.assertIsNone(nome("bahia"))                                      # selo postal de MG
        s.assertTrue(FA.NEGADAS.search("selo postal brasil 1962"))
        s.assertTrue(FA.EVITAR["incêndio"].search("corpo de bombeiros intensifica combate a incendios florestais"))

    def test_alt_do_tema(s):
        qs = FA.TEMAS["economia/Juros e inflação"]
        s.assertEqual(FA.alt_do_tema(foto("Supermercado_Zaffari_Lima_e_Silva.jpg", alt="Foto de arquivo: Banco Central do Brasil"), qs), "Foto de arquivo: supermercado Brasil")
        s.assertEqual(FA.alt_do_tema(foto("Edifício_Sede_do_Banco_Central_do_Brasil.jpg"), qs), "Foto de arquivo: Banco Central do Brasil")
        s.assertNotIn("esportes/Série B", FA.TEMAS)
        s.assertIn("tomate e feira", FA.ASSUNTOS)

    def test_previa_propria(s):
        try: import PIL  # noqa: F401
        except ImportError: s.skipTest("sem Pillow")
        d = tempfile.mkdtemp()
        try:
            feed = {"pautas": [{"id": "caso-x", "secao": "politica", "subtema": "STF e Judiciário", "neutro": {"titulo": "PGR prepara as primeiras denúncias do caso X"},
                                "imagem": {"modelo": "investigacao", "dados": {"carimbo": "CASO X"}}},
                               {"id": "dolar", "secao": "economia", "subtema": "Mercados", "neutro": {"titulo": "Dólar fecha a R$ 5,65 na sexta"},
                                "imagem": {"modelo": "dinheiro", "dados": {"valor": "R$ 5,65", "legenda": "Dólar no fechamento"}}},
                               {"id": "jogo", "secao": "esportes", "subtema": "Série B", "neutro": {"titulo": "Playoffs da Série B começam domingo"},
                                "imagem": {"modelo": "generica", "dados": {"rotulo": "Série B · playoffs"}}}]}
            json.dump(feed, open(os.path.join(d, "feed.json"), "w")); json.dump({"pessoas": {}, "assuntos": {}, "temas": {}}, open(os.path.join(d, "fa.json"), "w"))
            m = os.path.join(d, "m")
            # página antiga de notícia que saiu, com o selo postal e com queimada num incêndio de fábrica
            os.makedirs(m)
            velha = lambda pid, tit, img: f'<meta property="og:title" content="{tit}">\n<meta property="og:image" content="{img}">\n<script>location.replace("/#m={pid}")</script>'
            open(os.path.join(m, "chuva.html"), "w").write(velha("chuva", "Chuva derruba barragem na Bahia", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Brasil_Barragem_de_3_Marias_%2822129648701%29.jpg/960px-Brasil_Barragem_de_3_Marias_%2822129648701%29.jpg"))
            open(os.path.join(m, "salto.html"), "w").write(velha("salto", "Incêndio em indústria química de Salto", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Corpo_de_Bombeiros_intensifica_combate_a_inc%C3%AAndios_florestais.jpg/960px-Corpo_de_Bombeiros_intensifica_combate_a_inc%C3%AAndios_florestais.jpg"))
            open(os.path.join(m, "ok.html"), "w").write(velha("ok", "Queimada no Pantanal", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Corpo_de_Bombeiros_intensifica_combate_a_inc%C3%AAndios_florestais.jpg/960px-x.jpg"))
            s.assertEqual(PG.main([os.path.join(d, "feed.json"), m, os.path.join(d, "fa.json")]), 0)
            for pid in ("caso-x", "dolar", "jogo"):
                pg = open(os.path.join(m, pid + ".html")).read()
                s.assertRegex(pg, r'og:image" content="https://prumonews\.com\.br/m/og/' + pid + r'\.jpg\?v=[0-9a-f]{10}"')
                s.assertNotIn("og-padrao", pg)
                from PIL import Image
                im = Image.open(os.path.join(m, "og", pid + ".jpg")); s.assertEqual(im.size, (1200, 630))
                s.assertLess(os.path.getsize(os.path.join(m, "og", pid + ".jpg")), 90_000)
            # estável: rodar de novo não refaz nada
            t0 = os.path.getmtime(os.path.join(m, "og", "dolar.jpg")); antes = open(os.path.join(m, "dolar.html")).read()
            PG.main([os.path.join(d, "feed.json"), m, os.path.join(d, "fa.json")])
            s.assertEqual(os.path.getmtime(os.path.join(m, "og", "dolar.jpg")), t0); s.assertEqual(open(os.path.join(m, "dolar.html")).read(), antes)
            # título novo: imagem nova (a chave muda)
            feed["pautas"][1]["neutro"]["titulo"] = "Dólar fecha a R$ 5,70 na segunda"; json.dump(feed, open(os.path.join(d, "feed.json"), "w"))
            PG.main([os.path.join(d, "feed.json"), m, os.path.join(d, "fa.json")])
            s.assertNotEqual(open(os.path.join(m, "dolar.html")).read(), antes)
            # páginas antigas
            s.assertIn("og-padrao.png", open(os.path.join(m, "chuva.html")).read())
            s.assertIn("og-padrao.png", open(os.path.join(m, "salto.html")).read())
            s.assertNotIn("og-padrao.png", open(os.path.join(m, "ok.html")).read())  # queimada de verdade fica
        finally:
            shutil.rmtree(d, ignore_errors=True)


def self_fotos(A):
    out = []
    for x in A["pessoas"].values(): out += x["fotos"]
    for x in A["assuntos"].values(): out += x["fotos"]
    for l in A["temas"].values(): out += l
    return out


if __name__ == "__main__":
    unittest.main(verbosity=1)
