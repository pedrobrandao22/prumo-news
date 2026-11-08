#!/usr/bin/env python3
"""Testes offline do tools/colunas_publicas.py:  python3 -I tools/test_colunas_publicas.py  (ou python3 -m pytest -q)

Sem rede: as colunas vêm de tools/fixtures/colunas_publicas.json e as fotos de um baixador falso. Confere o HTML limpo
(lista branca: sem script, sem on*, sem javascript:, sem foto de outra pasta), as etiquetas Open Graph/Twitter e o
canonical, a série anterior/próxima, o formulário de assinatura, o índice e o sitemap, que a coluna que deixou de ser
pública some (página e fotos), que o título novo deixa o nome antigo redirecionando, que nada muda sem mudança e que o
nome da página bate com o da função de e-mail (logica.mjs).
"""
import copy, importlib.util, json, os, re, shutil, subprocess, sys, tempfile, unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("colunas_publicas", os.path.join(AQUI, "colunas_publicas.py"))
CP = importlib.util.module_from_spec(spec); spec.loader.exec_module(CP)
FIX = json.load(open(os.path.join(AQUI, "fixtures", "colunas_publicas.json"), encoding="utf-8"))
JPG = b"\xff\xd8\xff\xe0" + b"0" * 200


class T(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp(); self.pedidas = []

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def baixa(self, p):
        self.pedidas.append(p); return JPG

    def gera(self, dados=None):
        return CP.gerar(copy.deepcopy(FIX if dados is None else dados), self.d, self.baixa, "https://x.supabase.co", "sb_publishable_teste")

    def le(self, nome):
        return open(os.path.join(self.d, nome), encoding="utf-8").read()

    def test_pagina_limpa_e_og(self):
        R = self.gera()
        self.assertEqual(R["colunas"], 3)
        nome = CP.arquivo_de(FIX[0]); self.assertEqual(nome, "o-orcamento-no-corredor-aaaaaaaa.html")
        h = self.le(nome)
        art = h.split('<article class="cp-art">', 1)[1].split("</article>", 1)[0]
        self.assertNotIn("<script", art.lower()); self.assertNotIn("<style", art.lower()); self.assertNotIn("iframe", art)
        self.assertNotRegex(art, r"\son\w+\s*="); self.assertNotIn("javascript:", art)
        self.assertEqual(len(re.findall(r"<script", h)), 1); self.assertIn('<script src="assinar.js" defer></script>', h)
        self.assertNotIn("alheia.jpg", h); self.assertNotIn("11111111-2222", h, "o caminho do Storage (com o id da autora) não aparece")
        self.assertIn('<strong>parágrafo</strong>', art); self.assertIn('href="https://www.camara.leg.br/x"', art)
        self.assertIn('<h2>Intertítulo</h2>', art); self.assertIn("<blockquote><p>Uma citação</p></blockquote>", art)
        self.assertIn("Plenário cheio", art); self.assertIn("<small>Foto: Agência Câmara</small>", art); self.assertIn("cp-graf", art)
        for m in ['property="og:title" content="O orçamento no corredor · Bia Souza · Prumo News"', 'property="og:description" content="O que se ouve no Congresso"',
                  'name="twitter:card" content="summary_large_image"', 'property="og:type" content="article"',
                  f'rel="canonical" href="https://prumonews.com.br/c/{nome}"', 'property="og:url" content="https://prumonews.com.br/c/' + nome]:
            self.assertIn(m, h)
        img = re.search(r'property="og:image" content="([^"]+)"', h).group(1)
        self.assertRegex(img, r"^https://prumonews\.com\.br/c/f/[0-9a-f]{24}\.jpg$")
        self.assertTrue(os.path.exists(os.path.join(self.d, "f", img.rsplit("/", 1)[1])))
        self.assertIn('data-coluna="aaaaaaaa-0000-4000-8000-000000000001"', h); self.assertIn("Assinar por e-mail", h); self.assertIn("Ler no Prumo", h)
        self.assertIn("../?nt=coluna:aaaaaaaa-0000-4000-8000-000000000001", h); self.assertIn("só a autora vê quem confirmou", h)
        self.assertIn("../fontes/newsreader.woff2", self.le("coluna.css"))
        self.assertIn("#Economia", h)
        self.assertNotIn("Inválida", self.le("index.html"))

    def test_serie_indice_sitemap_md(self):
        self.gera()
        h1, h2 = self.le(CP.arquivo_de(FIX[0])), self.le(CP.arquivo_de(FIX[1]))
        self.assertIn('href="a-comissao-mista-decide-cccccccc.html"', h1); self.assertIn("Próxima ›", h1); self.assertNotIn("‹ Anterior", h1)
        self.assertIn("‹ Anterior", h2); self.assertIn('property="og:image" content="https://prumonews.com.br/og-padrao.png"', h2)
        self.assertIn('content="Chamada da segunda"', h2)
        h3 = self.le(CP.arquivo_de(FIX[2]))
        self.assertIn("<h2>Um título</h2>", h3); self.assertIn("<strong>negrito</strong>", h3); self.assertIn("Carla &lt;Mendes&gt;", h3)
        ix = self.le("index.html"); self.assertLess(ix.index("A comissão mista"), ix.index("O orçamento"))
        sm = self.le("sitemap.xml"); self.assertEqual(sm.count("<loc>"), 4); self.assertIn("/c/o-orcamento-no-corredor-aaaaaaaa.html", sm)
        js = self.le("assinar.js"); self.assertIn('"sb_publishable_teste"', js); self.assertIn("newsletter_assinar", js)
        self.assertNotRegex(js + self.le("assinatura.html"), r"sb_secret|service_role")
        self.assertNotRegex(js, r"\(\?<[=!]")

    def test_some_quando_deixa_de_ser_publica(self):
        self.gera(); nome = CP.arquivo_de(FIX[0]); fotos0 = set(os.listdir(os.path.join(self.d, "f")))
        self.assertEqual(len(fotos0), 3)
        R = self.gera(FIX[1:])
        self.assertFalse(os.path.exists(os.path.join(self.d, nome))); self.assertEqual(R["removidas"], 1)
        self.assertEqual(len(os.listdir(os.path.join(self.d, "f"))), 1, "fica só a foto de perfil (a autora ainda tem coluna aberta)")
        self.assertNotIn("O orçamento", self.le("index.html")); self.assertNotIn("o-orcamento", self.le("sitemap.xml"))
        self.assertNotIn("Próxima", self.le(CP.arquivo_de(FIX[1])), "a série não aponta para coluna fechada")

    def test_titulo_novo_redireciona_e_idempotente(self):
        self.gera(); self.pedidas.clear()
        R = self.gera(); self.assertEqual((R["novas"], R["mudaram"], R["fotos"]), (0, 0, 0)); self.assertEqual(self.pedidas, [], "não baixa de novo")
        d = copy.deepcopy(FIX); d[0]["tit"] = "Orçamento: o fim do corredor"
        self.gera(d)
        velho, novo = "o-orcamento-no-corredor-aaaaaaaa.html", "orcamento-o-fim-do-corredor-aaaaaaaa.html"
        self.assertIn('url=orcamento-o-fim-do-corredor-aaaaaaaa.html', self.le(velho)); self.assertIn("noindex", self.le(velho))
        self.assertIn("Orçamento: o fim do corredor", self.le(novo))
        self.gera(d[1:])
        self.assertFalse(os.path.exists(os.path.join(self.d, velho))); self.assertFalse(os.path.exists(os.path.join(self.d, novo)))

    def test_sem_foto_e_dados_ruins(self):
        R = CP.gerar(copy.deepcopy(FIX), self.d, lambda p: b"<html>nao e foto</html>")
        self.assertEqual(R["fotos"], 0); h = self.le(CP.arquivo_de(FIX[0]))
        self.assertIn("og-padrao.png", h); self.assertNotIn("<img", h.split('<div class="cp-corpo">', 1)[1].split("</div>", 1)[0])
        self.assertEqual(CP.gerar([], self.d)["colunas"], 0); self.assertIn("Ainda não há colunas abertas", self.le("index.html"))

    def test_mesmo_nome_que_a_funcao_de_email(self):
        node = shutil.which("node")
        if not node: self.skipTest("sem node")
        lg = os.path.join(os.path.dirname(AQUI), "fonte", "supabase", "functions", "enviar-newsletter", "logica.mjs")
        tits = ["Ação é já! Orçamento 2027", "  --Olá, mundo--  ", "x" * 80 + " fim", "", "Çãõ ü ñ 100%"]
        cod = f"import('{lg}').then(L=>console.log(JSON.stringify({json.dumps(tits)}.map(t=>L.arquivoDe({{tit:t,id:'A4596F2D-0f36'}})))))"
        js = json.loads(subprocess.run([node, "-e", cod], capture_output=True, text=True, timeout=30).stdout)
        self.assertEqual(js, [CP.arquivo_de({"tit": t, "id": "A4596F2D-0f36"}) for t in tits])

    def test_chave_so_publicavel(self):
        self.assertEqual(CP.main(["--chave", "sb_secret_xyz", "--url", "https://x", "--saida", self.d]), 2)


if __name__ == "__main__":
    unittest.main(verbosity=1)
