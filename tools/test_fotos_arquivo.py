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


def self_fotos(A):
    out = []
    for x in A["pessoas"].values(): out += x["fotos"]
    for x in A["assuntos"].values(): out += x["fotos"]
    for l in A["temas"].values(): out += l
    return out


if __name__ == "__main__":
    unittest.main(verbosity=1)
