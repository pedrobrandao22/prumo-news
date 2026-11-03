# Monta qa/visual/comparativo.html (uma página só, com as imagens dentro) a partir de qa/visual/antes-*.png e depois-*.png.
# Uso: python3 review2/_vn_comparativo.py   (depois de node review2/_vn_capturas.js)
import base64, io, os, html
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(AQUI, '..', 'qa', 'visual')
PARES = [
  ('feed-topo', 'Abertura do Feed', 'As bolinhas viram cartões verticais com a manchete por cima da arte (como a prateleira de Shorts do YouTube). Logo abaixo, uma barra de chips — Tudo · Amigos · Política · Economia · Seguindo — que filtra o Feed e fica presa no topo ao rolar.'),
  ('topo-giros', 'Fileira do topo (agora “Giro”)', 'Mesmo toque, mesmo visualizador de antes. Cartão com borda colorida = ainda não visto; borda cinza = já visto. Nos amigos, o avatar fica no canto. “Stories” passa a se chamar “Giro” e “Destaques” do perfil, “Coleções”.'),
  ('noticia', 'Cartão de notícia', 'No ritmo do X: editoria e hora numa linha, manchete e resumo primeiro, e a arte (o mesmo carrossel de sempre) logo abaixo, com cantos arredondados. Ações com números: comentar · repostar · gostei · salvar · enviar.'),
  ('post-amiga', 'Post de amiga', 'Avatar na coluna da esquerda, “nome · lugar · hora” numa linha, o texto antes da foto e a foto dentro de uma moldura. O ícone do prumo continua sendo o “gostei”.'),
  ('repost', 'Repostar com comentário', 'Novo: dá para repostar uma notícia ou o post de um amigo, com ou sem comentário; o original aparece dentro, como no X. Quem não pode ver o original (não é amigo do autor) vê “Publicação indisponível”. Hoje isso não existe: à esquerda está como um repost aparece para quem continua no visual atual.'),
  ('perfil', 'Seu perfil', 'Faixa no alto com a cor do seu avatar, foto sobreposta, “No Prumo desde…”, amigos e publicações. As abas viram Posts · Respostas · Mídia (e a engrenagem da Conta), com os posts em lista no lugar da grade.'),
  ('perfil-amiga', 'Perfil de amiga', 'Mesmo cabeçalho, com “Mensagem” ao lado da foto. Os filtros de contribuição (notícias comentadas, análises…) continuam dentro de Posts.'),
  ('conta', 'A chave', 'Em Perfil › Conta, “Visual novo (teste)” liga e desliga só neste aparelho (a página recarrega). A linha aparece para você (administrador) e para quem já ligou alguma vez.'),
  ('escuro-feed', 'Modo escuro: abertura do Feed', 'Os cartões, os chips e os posts seguem as cores do modo escuro.'),
  ('escuro-repost', 'Modo escuro: repost', 'O cartão citado e as ações também no escuro.'),
]
def jpg(nome, w=300):
  im = Image.open(os.path.join(D, nome + '.png')).convert('RGB'); h = round(im.height * w / im.width)
  b = io.BytesIO(); im.resize((w, h), Image.LANCZOS).save(b, 'JPEG', quality=80, optimize=True)
  return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode(), w, h
sec = []
for k, tit, txt in PARES:
  a, aw, ah = jpg('antes-' + k); d, dw, dh = jpg('depois-' + k)
  sec.append(f'''<section class="par" id="{k}"><h2>{html.escape(tit)}</h2><p>{html.escape(txt)}</p>
<div class="lado"><figure><button type="button" class="zoom" aria-label="Ampliar: hoje, {html.escape(tit)}"><img src="{a}" width="{aw}" height="{ah}" alt="Hoje: {html.escape(tit)}" loading="lazy"></button><figcaption>Hoje</figcaption></figure>
<figure class="novo"><button type="button" class="zoom" aria-label="Ampliar: visual novo, {html.escape(tit)}"><img src="{d}" width="{dw}" height="{dh}" alt="Visual novo: {html.escape(tit)}" loading="lazy"></button><figcaption>Visual novo</figcaption></figure></div></section>''')
pag = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prumo: visual novo</title>
<style>
:root{{--bg:#f2f3f5;--card:#ffffff;--ink:#14213a;--ink2:#3b4250;--muted:#5b6370;--line:#dde2e9;--accent:#1d3a63;--bronze:#a8681c;color-scheme:light}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0f1522;--card:#171f2e;--ink:#e8ecf2;--ink2:#c5cdd9;--muted:#98a3b3;--line:#2a3445;--accent:#86a8db;--bronze:#e3ad62;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#0f1522;--card:#171f2e;--ink:#e8ecf2;--ink2:#c5cdd9;--muted:#98a3b3;--line:#2a3445;--accent:#86a8db;--bronze:#e3ad62;color-scheme:dark}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:760px;margin:0 auto;padding:20px 16px 48px}}
header h1{{margin:0 0 6px;font:800 26px/1.2 Georgia,"Times New Roman",serif;letter-spacing:-.01em}}
header p{{margin:0 0 10px;color:var(--ink2)}}
.chave{{margin:14px 0 22px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--card)}}
.chave b{{display:block;margin-bottom:4px}}
.chave ul{{margin:6px 0 0;padding-left:20px;color:var(--ink2)}}
.chave code{{font:600 14px ui-monospace,Menlo,monospace;background:color-mix(in srgb,var(--accent) 12%,transparent);padding:1px 5px;border-radius:5px}}
.par{{padding:18px 0 22px;border-top:1px solid var(--line)}}
.par h2{{margin:0 0 4px;font:700 19px/1.3 system-ui,sans-serif}}
.par p{{margin:0 0 12px;color:var(--ink2);font-size:15px}}
.lado{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}
figure{{margin:0;min-width:0}}
.zoom{{display:block;width:100%;padding:0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--card);cursor:zoom-in}}
.zoom:focus-visible{{outline:3px solid var(--accent);outline-offset:2px}}
.zoom img{{display:block;width:100%;height:auto}}
figcaption{{margin-top:6px;font:700 12px system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:center}}
.novo figcaption{{color:var(--bronze)}}
.novo .zoom{{border-color:color-mix(in srgb,var(--bronze) 55%,var(--line))}}
footer{{margin-top:8px;color:var(--muted);font-size:14px}}
dialog{{border:0;padding:0;background:transparent;max-width:min(94vw,430px);max-height:94vh}}
dialog::backdrop{{background:rgb(0 0 0 / .78)}}
dialog img{{display:block;width:100%;height:auto;border-radius:12px}}
dialog button{{position:absolute;top:8px;right:8px;width:40px;height:40px;border-radius:50%;border:0;background:rgb(0 0 0 / .6);color:#fff;font:700 22px/1 system-ui}}
@media (max-width:420px){{.lado{{gap:8px}}header h1{{font-size:23px}}}}
</style></head><body><main>
<header><h1>Prumo News: visual novo</h1><p>Um pouco de X e de YouTube, sem mudar o que o Prumo é. À esquerda, o app de hoje; à direita, o visual novo, com os mesmos dados. Toque numa imagem para ampliar.</p></header>
<div class="chave"><b>Está desligado para todo mundo.</b>Nada muda até alguém ligar no próprio aparelho:
<ul><li>abrir o site com <code>?visual=novo</code> no fim do endereço (e <code>?visual=atual</code> para voltar), ou</li>
<li>em Perfil › Conta, tocar em “Visual novo (teste)”.</li></ul>
Para lançar para todos depois, basta mudar uma linha no código; e voltar é igual.</div>
{''.join(sec)}
<footer>Capturas em 390×844 (tamanho de um iPhone), com contas de teste (Pedro e Bia).</footer>
</main>
<dialog id="dz" aria-label="Imagem ampliada"><button type="button" aria-label="Fechar">×</button><img alt=""></dialog>
<script>
(function(){{var d=document.getElementById("dz"),im=d.querySelector("img");
document.addEventListener("click",function(e){{var b=e.target.closest&&e.target.closest(".zoom");if(b){{var s=b.querySelector("img");im.src=s.src;im.alt=s.alt;try{{d.showModal()}}catch(_){{}}return}}
if(e.target===d||e.target.closest&&e.target.closest("#dz button"))d.close()}})}})();
</script></body></html>'''
open(os.path.join(D, 'comparativo.html'), 'w').write(pag)
print('ok', round(len(pag) / 1024), 'KB')
