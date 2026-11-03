# Monta qa/visual/comparativo-2.html (uma página só, com as imagens dentro) a partir das capturas de review2/_vn_capturas.js.
# Uso: node review2/_vn_capturas.js && python3 review2/_vn_comparativo.py
# A página não tem <!doctype>/<html>/<head>/<body> (ela é embrulhada na hora de publicar) e começa pelo <title>.
import base64, io, os, html
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(AQUI, '..', 'qa', 'visual')
E = html.escape

def jpg(nome, w=300):
  im = Image.open(os.path.join(D, nome + '.png')).convert('RGB'); h = round(im.height * w / im.width)
  b = io.BytesIO(); im.resize((w, h), Image.LANCZOS).save(b, 'JPEG', quality=78, optimize=True, progressive=True)
  return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode(), w, h

def fig(nome, leg, cls='', cap=None):
  s, w, h = jpg(nome)
  return f'<figure class="{cls}"><img src="{s}" width="{w}" height="{h}" alt="{E(leg)}" loading="lazy" decoding="async"><figcaption>{E(cap or leg)}</figcaption></figure>'

APROVADO = [
  ('topo-giros', 'Giro com respiro', 'Os cartões do topo ganharam 12px entre si, a borda colorida passou para dentro do cartão (antes ela ficava por fora e comia o espaço) e o primeiro começa no mesmo recuo de 16px do Feed.'),
  ('feed-topo', 'Sem a barra de chips', 'A barra Tudo · Amigos · Política · Economia · Seguindo saiu. O filtro do topo do Feed volta a ser o de sempre, com o aviso “Política · Ver tudo ✕”.'),
  ('repost', 'Notícia e post como hoje, com Repostar', 'O cartão é o de hoje. Repostar entra à direita, ao lado de Guardar (à esquerda ficam gostei · comentar · enviar e, no meio, os pontinhos do carrossel; um quarto ícone ali encostaria neles). Quem repostou aparece embaixo de quem gostou (“Bia Souza repostou”). A citação vem numa moldura, com a letra das legendas.'),
  ('perfil', 'Seu perfil', 'Igual ao aprovado: faixa, foto sobreposta, “No Prumo desde…”, abas Posts · Respostas · Mídia. Os posts da lista usam o mesmo cartão do Feed.'),
  ('perfil-amiga', 'Perfil de amiga', 'Igual ao aprovado, com “Mensagem” ao lado da foto.'),
]
CENAS = [('noticia', 'Notícia com arte'), ('noticia-amigos', 'Notícia com o que a amiga acha'), ('post-texto', 'Post de texto'), ('post-foto', 'Post com foto'), ('repost', 'Repost com comentário'), ('escuro', 'Modo escuro')]
OPCOES = [
  ('hoje', 'Hoje', 'O cartão de hoje (o que vai ser ligado), para comparar.'),
  ('a', 'A · Jornal', 'Chapéu da editoria e hora, manchete grande em serifa, linha fina de duas linhas e a arte embaixo, entre fios. O post de amigo vira uma “nota”: o texto primeiro, como citação, e a assinatura pequena. Ações em texto.'),
  ('b', 'B · Fio', 'Avatar numa coluna, nome e hora numa linha só, texto recuado e a arte na largura toda com cantos arredondados. Números ao lado das ações. O que os amigos acham fica pendurado na notícia por um fio.'),
  ('c', 'C · Cartão', 'Como o YouTube: arte grande 16:9 com a etiqueta do assunto por cima; embaixo, a bolinha da editoria (ou da pessoa), a manchete e “Política · 14/10 · 3 comentários”. Ações em pílulas. O que os amigos acham vira um quadro de comentários.'),
]

ap = ''.join(f'''<article class="par"><h3>{E(t)}</h3><p>{E(d)}</p><div class="lado">{fig('antes-' + k, 'Hoje: ' + t, '', 'Hoje')}{fig('hoje-' + k, 'Visual novo: ' + t, 'novo', 'Visual novo')}</div></article>''' for k, t, d in APROVADO)
cols = ''.join(f'''<section class="op" aria-labelledby="op-{k}"><h3 id="op-{k}">{E(n)}</h3><p>{E(d)}</p>{''.join(fig(k + '-' + c, n + ': ' + t, '', t) for c, t in CENAS)}</section>''' for k, n, d in OPCOES)

TOK_C = '--bg:#f2f3f5;--card:#ffffff;--ink:#14213a;--ink2:#3b4250;--muted:#5b6370;--line:#dde2e9;--accent:#1d3a63;--bronze:#9a5f17;--code:#e6ebf3;color-scheme:light'
TOK_E = '--bg:#0f1522;--card:#171f2e;--ink:#e8ecf2;--ink2:#c5cdd9;--muted:#98a3b3;--line:#2a3445;--accent:#9dbbe6;--bronze:#e3ad62;--code:#1f2c42;color-scheme:dark'
pag = f'''<title>Cartões do Prumo</title>
<style>
:root{{{TOK_C}}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{{TOK_E}}}}}
:root[data-theme="dark"]{{{TOK_E}}}
*{{box-sizing:border-box}}
html{{-webkit-text-size-adjust:100%}}
body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding-block:20px 48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
main{{max-width:1320px;margin:0 auto}}
h1{{margin:0 0 6px;font:800 27px/1.2 Georgia,"Times New Roman",serif;letter-spacing:-.01em}}
.intro{{margin:0 0 14px;color:var(--ink2);max-width:68ch}}
.tenta{{margin:0 0 26px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card);max-width:760px}}
.tenta b{{display:block;margin-bottom:2px}}
code{{font:600 14px ui-monospace,Menlo,monospace;background:var(--code);padding:1px 5px;border-radius:5px;overflow-wrap:anywhere}}
h2{{margin:30px 0 4px;font:800 21px/1.25 system-ui,sans-serif}}
h2+p{{margin:0 0 14px;color:var(--ink2);max-width:68ch}}
.aprov{{display:grid;align-items:start;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr));gap:18px}}
.par{{padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--card);min-width:0}}
.par h3,.op h3{{margin:0 0 4px;font:700 17px/1.3 system-ui,sans-serif}}
.par>p,.op>p{{margin:0 0 12px;color:var(--ink2);font-size:14.5px}}
.lado{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
figure{{margin:0;min-width:0}}
figure img{{display:block;width:100%;max-width:300px;height:auto;margin:0 auto;border:1px solid var(--line);border-radius:10px;background:var(--bg)}}
figcaption{{margin:6px 0 0;font:700 11.5px/1.3 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);text-align:center}}
.novo figcaption{{color:var(--bronze)}}
.ops{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;align-items:start}}
.op{{padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--card);min-width:0}}
.op>p{{min-height:6.2em}}
.op figure+figure{{margin-top:14px}}
#op-a,#op-b,#op-c{{color:var(--bronze)}}
footer{{margin-top:22px;color:var(--muted);font-size:14px}}
@media (max-width:1100px){{.ops{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
@media (max-width:640px){{.ops{{grid-template-columns:1fr}}.op>p{{min-height:0}}h1{{font-size:24px}}}}
</style>
<main>
<h1>Cartões do Prumo</h1>
<p class="intro">Duas partes: o que você já aprovou, com os ajustes pedidos (vai ser ligado para todos), e três caminhos para o cartão de notícia e o post de amigo, para você escolher um. Capturas em 390×844 (tamanho de um iPhone), com as contas de teste Pedro e Bia.</p>
<div class="tenta"><b>Para ver no celular</b>Abra o Prumo com <code>?visual=novo&amp;cartao=a</code> no fim do endereço (troque <code>a</code> por <code>b</code> ou <code>c</code>). A escolha fica guardada no aparelho; <code>?cartao=atual</code> volta ao cartão de hoje e <code>?visual=atual</code> desliga tudo.</div>
<h2>O que já está aprovado (vai ser ligado)</h2>
<p>À esquerda, o app de hoje; à direita, o visual novo com os ajustes.</p>
<div class="aprov">{ap}</div>
<h2>Escolha o cartão: A, B ou C</h2>
<p>As mesmas cenas em cada opção: notícia com arte, notícia com o que a amiga acha, post de texto, post com foto, repost com comentário e uma tela no modo escuro. Repostar e o perfil funcionam igual nas três.</p>
<div class="ops">{cols}</div>
<footer>Prumo News · comparativo do visual novo</footer>
</main>
'''
open(os.path.join(D, 'comparativo-2.html'), 'w').write(pag)
print('ok', round(len(pag) / 1024), 'KB')
