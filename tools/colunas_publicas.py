#!/usr/bin/env python3
"""Páginas abertas das colunas públicas do Prumo News (roda no GitHub a cada 15 min; só a chave publicável).

  python3 tools/colunas_publicas.py --url https://xxx.supabase.co --chave sb_publishable_... --saida c
  python3 tools/colunas_publicas.py --fixture colunas.json --saida c        (sem rede: para testar)

Lê as colunas que as autoras marcaram "Todos (link público)" pela função colunas_publicas() do banco (sql v14: só colunas
públicas já publicadas, só os campos da página) e grava, na pasta de saída:
  <slug>-<id8>.html   a coluna, com o HTML limpo AQUI (lista branca igual à do app, js/132), etiquetas Open Graph/Twitter,
                      canonical, bloco da autora, série anterior/próxima (só públicas), "Assinar por e-mail" e "Ler no Prumo"
  index.html          as colunas públicas mais recentes
  sitemap.xml         para o Google
  assinatura.html     confirmar / cancelar a newsletter (links dos e-mails)
  assinar.js          o formulário de assinatura (chama a função newsletter_assinar com a chave publicável)
  coluna.css          o visual (fontes do app)
  f/<hash>.<ext>      cópia das fotos (o nome não mostra o caminho do Storage)
Páginas e fotos de colunas que deixaram de ser públicas (ou foram apagadas) saem. Título mudou: o nome antigo vira um
redirecionamento para o novo (links já compartilhados continuam funcionando). Só reescreve arquivo que mudou.
Se o banco não responder, sai com erro e NÃO apaga nada.
"""
import argparse, hashlib, html, json, os, re, sys, unicodedata, urllib.parse, urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser

BASE = "https://prumonews.com.br"
FOTO = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[\w-]{1,80}\.(?:jpe?g|png|webp)$", re.I)
SERIE_G = re.compile(r"^[a-z0-9_]{2,30}$")
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
PAGINA = re.compile(r"^[a-z0-9-]{1,60}-[0-9a-f]{8}\.html$")
MESES = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."]
e = lambda s: html.escape(str(s if s is not None else ""), quote=True)

try:
    from zoneinfo import ZoneInfo
    SP = ZoneInfo("America/Sao_Paulo")
except Exception:  # sem base de fusos: Brasília é UTC-3 (sem horário de verão desde 2019)
    from datetime import timedelta
    SP = timezone(timedelta(hours=-3))


def slug(s):
    """Igual ao slug() da função enviar-newsletter (logica.mjs): o link do e-mail é o nome desta página."""
    t = unicodedata.normalize("NFD", str(s or ""))
    t = "".join(c for c in t if not ("̀" <= c <= "ͯ")).lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:60].rstrip("-") or "coluna"


def arquivo_de(c):
    return f"{slug(c.get('tit'))}-{re.sub(r'[^0-9a-f]', '', str(c.get('id') or '').lower())[:8]}.html"


def foto_nome(path):
    ext = path.rsplit(".", 1)[-1].lower()
    return hashlib.sha256(("prumo-foto:" + path).encode()).hexdigest()[:24] + "." + ("jpg" if ext == "jpeg" else ext)


def url_ok(u):
    try:
        p = urllib.parse.urlsplit(str(u or "").strip())
        return p.geturl() if p.scheme == "https" and p.netloc and not any(ch in p.netloc for ch in "@ ") else ""
    except ValueError:
        return ""


def dominio(u):
    try: return urllib.parse.urlsplit(u).hostname.lower().replace("www.", "", 1)
    except Exception: return ""


# ---------- HTML limpo: a lista branca do app (js/132) ----------
FORA = {"script", "style", "iframe", "object", "embed", "template", "noscript", "svg", "math", "img", "picture", "video", "audio",
        "source", "canvas", "input", "button", "select", "option", "textarea", "link", "meta", "title", "head", "form", "frame",
        "frameset", "applet", "base", "map", "area", "track", "dialog", "portal", "xml", "colgroup", "col"}
CONTEUDO_FORA = {"script", "style", "iframe", "object", "embed", "template", "noscript", "svg", "math", "textarea", "select",
                 "option", "title", "head", "button", "canvas", "video", "audio", "dialog", "xml"}
TROCA = {"b": "strong", "i": "em", "h1": "h2", "h4": "h3", "h5": "h3", "h6": "h3"}
BLOCOS = {"p", "h2", "h3", "blockquote", "ul", "ol", "li"}


class Limpa(HTMLParser):
    """Monta o HTML de novo, só com o que o Prumo usa: p, h2, h3, citação, listas, separador, negrito, itálico, link https,
    quebra de linha, foto (figure data-f, só fotos desta coluna, com legenda e crédito) e gráfico do acervo (vira um aviso)."""

    def __init__(self, fotos, url_foto):
        super().__init__(convert_charrefs=True)
        self.out, self.pilha, self.fora, self.fotos, self.url_foto = [], [], 0, set(fotos or []), url_foto
        self.fig = None  # figura aberta: {"f": caminho, "leg": [], "cred": [], "em": "leg"|"cred"|None}

    def _fecha_ate(self, t):
        if t not in self.pilha: return
        while self.pilha:
            x = self.pilha.pop(); self.out.append(f"</{x}>")
            if x == t: break

    def handle_starttag(self, tag, attrs):
        t = TROCA.get(tag, tag)
        if self.fora:
            if t in CONTEUDO_FORA: self.fora += 1
            return
        if t in CONTEUDO_FORA: self.fora = 1; return
        a = {k.lower(): (v or "") for k, v in attrs}
        if self.fig is not None:
            if t == "small": self.fig["em"] = "cred"
            elif t == "figcaption": self.fig["em"] = "leg"
            return
        if t == "figure":
            f, g = a.get("data-f", ""), a.get("data-g", "")
            if f and FOTO.match(f) and f in self.fotos: self.fig = {"f": f, "leg": [], "cred": [], "em": None}
            elif g and SERIE_G.match(g): self.fig = {"g": g, "leg": [], "cred": [], "em": None}
            else: self.fig = {"leg": [], "cred": [], "em": None}
            return
        if t in FORA: return
        if t == "br": self.out.append("<br>"); return
        if t == "hr":
            while self.pilha: self.out.append(f"</{self.pilha.pop()}>")
            self.out.append('<hr class="cp-hr">'); return
        if t in ("p", "li") and self.pilha and self.pilha[-1] == t: self._fecha_ate(t)
        if t in ("h2", "h3", "ul", "ol", "blockquote"):
            while self.pilha and self.pilha[-1] != "blockquote": self.out.append(f"</{self.pilha.pop()}>")
        if t == "a":
            u = url_ok(a.get("href", "")[:500])
            if not u: return
            self.out.append(f'<a href="{e(u)}" target="_blank" rel="noopener noreferrer nofollow ugc">'); self.pilha.append("a"); return
        if t in BLOCOS or t in ("strong", "em"):
            self.out.append(f"<{t}>"); self.pilha.append(t)

    def handle_endtag(self, tag):
        t = TROCA.get(tag, tag)
        if self.fora:
            if t in CONTEUDO_FORA: self.fora -= 1
            return
        if self.fig is not None:
            if t == "small" or t == "figcaption": self.fig["em"] = "leg" if t == "small" else None
            if t == "figure": self._figura(self.fig); self.fig = None
            return
        if t in BLOCOS or t in ("strong", "em", "a"): self._fecha_ate(t)

    def handle_data(self, d):
        if self.fora: return
        if self.fig is not None:
            if self.fig["em"] == "cred": self.fig["cred"].append(d)
            elif self.fig["em"] == "leg": self.fig["leg"].append(d)
            return
        self.out.append(e(re.sub(r"\s+", " ", d)))

    def _figura(self, f):
        leg = re.sub(r"\s+", " ", "".join(f["leg"])).strip()[:200]
        cred = re.sub(r"\s+", " ", "".join(f["cred"])).strip()[:120]
        while self.pilha and self.pilha[-1] != "blockquote": self.out.append(f"</{self.pilha.pop()}>")
        if f.get("f"):
            cap = f'<figcaption>{e(leg)}{(" <small>" + e(cred) + "</small>") if cred else ""}</figcaption>' if (leg or cred) else ""
            self.out.append(f'<figure class="cp-fig"><img src="{e(self.url_foto(f["f"]))}" alt="{e(leg)}" loading="lazy" decoding="async">{cap}</figure>')
        elif f.get("g"):
            self.out.append('<p class="cp-graf">Esta coluna tem um gráfico do acervo do Prumo. Abra no app para ver.</p>')

    def resultado(self):
        if self.fig is not None: self._figura(self.fig); self.fig = None
        while self.pilha: self.out.append(f"</{self.pilha.pop()}>")
        h = "".join(self.out)
        h = re.sub(r"<(p|h2|h3|li|strong|em)>(?:\s|<br>)*</\1>", "", h)
        return re.sub(r"<(ul|ol|blockquote)>\s*</\1>", "", h).strip()


def limpar(corpo, fotos=(), url_foto=lambda p: ""):
    p = Limpa(fotos, url_foto)
    p.feed(str(corpo or "")[:60000]); p.close()
    return p.resultado()


def de_markdown(t):
    """Colunas antigas (texto com "## " e "> ", **negrito** e [link](https://…))."""
    out = []
    for s in re.split(r"\n+", str(t or "")):
        s = s.strip()
        if not s: continue
        x = e(s)
        x = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", x)
        x = re.sub(r"\[([^\]]+)\]\((https://[^)\s]+)\)", r'<a href="\2">\1</a>', x)
        if s.startswith("## "): out.append(f"<h2>{x[3:]}</h2>")
        elif s.startswith("&gt; "): out.append(f"<blockquote><p>{x[5:]}</p></blockquote>")
        else: out.append(f"<p>{x}</p>")
    return "".join(out)


def texto_puro(h):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h or ""))).strip()


def data_br(ms):
    try:
        d = datetime.fromtimestamp(int(ms) / 1000, timezone.utc).astimezone(SP)
        return f"{d.day} {MESES[d.month - 1]} {d.year}"
    except (TypeError, ValueError, OverflowError):
        return ""


def iso(ms):
    try: return datetime.fromtimestamp(int(ms) / 1000, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except (TypeError, ValueError, OverflowError): return ""


def valida(c):
    """Só o que tem a forma certa (o banco já filtra; aqui é a segunda trava)."""
    if not isinstance(c, dict) or not UUID.match(str(c.get("id") or "")): return None
    tit = str(c.get("tit") or "").strip()[:90]
    if not tit: return None
    a = c.get("autora") if isinstance(c.get("autora"), dict) else {}
    fotos = [f for f in (c.get("fotos") or []) if isinstance(f, str) and FOTO.match(f)][:10]
    capa = c.get("capa") if isinstance(c.get("capa"), str) and c.get("capa") in fotos else None
    af = a.get("foto") if isinstance(a.get("foto"), str) and FOTO.match(a.get("foto") or "") else None
    try: at = int(c.get("at") or 0)
    except (TypeError, ValueError): at = 0
    n = c.get("n") if isinstance(c.get("n"), int) and 0 < c.get("n") < 10000 else None
    return {"id": c["id"].lower(), "tit": tit, "linha": str(c.get("linha") or "").strip()[:160], "cham": str(c.get("cham") or "").strip()[:280],
            "formato": "h" if c.get("formato") == "h" else "md", "corpo": str(c.get("corpo") or "")[:40000], "capa": capa, "fotos": fotos,
            "serie": str(c.get("serie") or "").strip()[:60], "n": n, "at": at, "min": c.get("min") if isinstance(c.get("min"), int) else None,
            "tags": [t for t in re.findall(r"#[^\s#]{1,40}", str(c.get("tags") or ""))][:10],
            "autora": {"k": re.sub(r"[^0-9a-f]", "", str(a.get("k") or ""))[:16] or "x", "nome": str(a.get("nome") or "Autora").strip()[:40] or "Autora", "foto": af}}


CSS = """@font-face{font-family:"Newsreader";font-style:normal;font-weight:200 800;font-display:swap;src:url(../fontes/newsreader.woff2) format("woff2")}
@font-face{font-family:"Newsreader";font-style:italic;font-weight:200 800;font-display:swap;src:url(../fontes/newsreader-italico.woff2) format("woff2")}
@font-face{font-family:"Public Sans";font-style:normal;font-weight:100 900;font-display:swap;src:url(../fontes/public-sans.woff2) format("woff2")}
:root{--bg:#fbfaf7;--card:#ffffff;--ink:#14213a;--tx:#1f2937;--mut:#5b6472;--line:#e3e0d8;--acc:#8a5a17;--btn:#14213a;--btnt:#ffffff;--f-d:"Newsreader",Georgia,"Times New Roman",serif;--f-s:"Public Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--bg:#0f1522;--card:#161e2e;--ink:#eef1f6;--tx:#d9dee7;--mut:#9aa4b4;--line:#283247;--acc:#e6b673;--btn:#e6b673;--btnt:#14213a}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--tx);font:17px/1.6 var(--f-s);overflow-wrap:anywhere}
a{color:inherit}.cp-top{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:720px;margin:0 auto;padding:14px 16px;border-bottom:1px solid var(--line)}
.cp-marca{font:600 22px/1 var(--f-d);color:var(--ink);text-decoration:none;letter-spacing:-.01em}.cp-top a.cp-ler{font:600 14px var(--f-s);text-decoration:none;color:var(--acc)}
main{max-width:680px;margin:0 auto;padding:22px 16px 48px}.cp-k{margin:0;font:700 12px/1.4 var(--f-s);letter-spacing:.08em;text-transform:uppercase;color:var(--acc)}
h1{margin:6px 0 0;font:600 30px/1.13 var(--f-d);letter-spacing:-.02em;color:var(--ink);text-wrap:balance}.cp-l{margin:10px 0 0;font:400 19px/1.42 var(--f-d);color:var(--mut)}
.cp-by{display:flex;align-items:center;gap:10px;margin:18px 0 0;font-size:14px;color:var(--mut)}.cp-by b{display:block;color:var(--ink);font-size:15px}
.cp-av{width:40px;height:40px;border-radius:50%;object-fit:cover;background:var(--line);display:inline-grid;place-items:center;font:700 16px var(--f-s);color:var(--ink);flex:none}
.cp-capa{margin:20px -16px 0;}.cp-capa img,.cp-fig img{display:block;width:100%;height:auto;max-height:70vh;object-fit:cover}
.cp-corpo{margin-top:22px}.cp-corpo p,.cp-corpo li{font:400 19px/1.62 var(--f-d);color:var(--tx)}.cp-corpo p{margin:0 0 18px}
.cp-corpo h2{margin:30px 0 10px;font:600 24px/1.25 var(--f-d);color:var(--ink)}.cp-corpo h3{margin:24px 0 8px;font:700 17px/1.3 var(--f-s);color:var(--ink)}
.cp-corpo blockquote{margin:22px 0;padding:2px 0 2px 16px;border-left:3px solid var(--acc)}.cp-corpo blockquote p{font-style:italic;font-size:21px;line-height:1.45}
.cp-corpo ul,.cp-corpo ol{margin:0 0 18px;padding-left:24px}.cp-corpo a{color:var(--ink);text-decoration:underline;text-underline-offset:2px}.cp-dom{color:var(--mut);font-size:.8em}
.cp-hr{border:0;border-top:1px solid var(--line);margin:30px auto;width:40%}.cp-fig{margin:22px -16px}.cp-fig figcaption{padding:6px 16px 0;font-size:14px;color:var(--mut)}.cp-fig small{opacity:.85}
.cp-graf{font:14px var(--f-s)!important;color:var(--mut)!important;border:1px dashed var(--line);border-radius:10px;padding:10px 12px}
.cp-tags{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 0;padding:0;list-style:none}.cp-tags li{font:600 13px var(--f-s);color:var(--acc)}
.cp-box{margin:30px 0 0;padding:18px 16px;border:1px solid var(--line);border-radius:14px;background:var(--card)}.cp-box h2{margin:0 0 4px;font:600 20px/1.25 var(--f-d);color:var(--ink)}
.cp-box p{margin:6px 0 0;font-size:15px;color:var(--mut)}.cp-au{display:flex;gap:12px;align-items:center}.cp-au .cp-av{width:56px;height:56px;font-size:20px}
.cp-form{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}.cp-form input[type=email]{flex:1 1 200px;min-width:0;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--tx);font:16px var(--f-s)}
.cp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 18px;border:0;border-radius:999px;background:var(--btn);color:var(--btnt);font:700 15px var(--f-s);text-decoration:none;cursor:pointer}
.cp-btn.cp-g{background:transparent;color:var(--ink);border:1px solid var(--line)}.cp-priv{font-size:13px!important}.cp-msg{min-height:1.4em;font-weight:600;color:var(--ink)!important}
.cp-acoes{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0 0}.cp-nav{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 0}.cp-nav a{display:block;padding:12px;border:1px solid var(--line);border-radius:12px;text-decoration:none}
.cp-nav small{display:block;font:600 12px var(--f-s);color:var(--acc)}.cp-nav span{font:500 16px/1.3 var(--f-d);color:var(--ink)}.cp-nav .cp-p{text-align:right;grid-column:2}
.cp-lista{list-style:none;margin:16px 0 0;padding:0}.cp-lista li{padding:16px 0;border-top:1px solid var(--line)}.cp-lista a{text-decoration:none}.cp-lista b{display:block;font:600 21px/1.25 var(--f-d);color:var(--ink)}
.cp-lista span{display:block;margin-top:4px;color:var(--mut);font-size:15px}footer{max-width:680px;margin:0 auto;padding:0 16px 40px;font-size:13px;color:var(--mut)}
@media (min-width:700px){main{padding-top:34px}h1{font-size:40px}.cp-capa,.cp-fig{margin-left:0;margin-right:0;border-radius:12px;overflow:hidden}}
"""

JS = """/* Prumo News · assinatura das colunas por e-mail (página pública). Só a chave publicável (é pública, como no app). */
(function(){var U=%s,K=%s;
function rpc(n,a){return fetch(U+"/rest/v1/rpc/"+n,{method:"POST",headers:{"apikey":K,"Content-Type":"application/json"},body:JSON.stringify(a)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j})})}
function msg(el,t){var m=el.querySelector(".cp-msg");if(m)m.textContent=t}
document.querySelectorAll("form.cp-form").forEach(function(f){f.addEventListener("submit",function(ev){ev.preventDefault();if(!U||!K)return;
  var em=(f.querySelector("input[type=email]").value||"").trim(),b=f.querySelector("button"),box=f.closest(".cp-box")||f;if(!em)return;b.disabled=true;msg(box,"Enviando…");
  rpc("newsletter_assinar",{p_email:em,p_coluna:f.getAttribute("data-coluna")}).then(function(r){msg(box,r==="limite"?"Muitos pedidos para este e-mail agora. Tente de novo mais tarde.":"Pronto! Mandamos um e-mail para "+em+". Toque no link dele para confirmar.");f.reset()})
  .catch(function(e){msg(box,/invalido/.test(String(e&&e.message))?"Confira o e-mail digitado.":"Não deu para assinar agora. Tente de novo.")}).then(function(){b.disabled=false})})});
var q=new URLSearchParams(location.search),st=document.getElementById("cp-estado");if(!st)return;
var t=q.get("confirmar"),c=q.get("cancelar"),fe=q.get("email"),fc=q.get("coluna");
try{if(t||c||fe)history.replaceState(null,"",location.pathname)}catch(e){}
function mostra(h,p){st.querySelector("h1").textContent=h;st.querySelector("p").textContent=p}
if(!U||!K){mostra("Assinatura","Esta página ainda não está ligada ao Prumo.");return}
if(t)rpc("newsletter_confirmar",{p_token:t}).then(function(r){if(r&&r.ok)mostra("Assinatura confirmada","Você vai receber as colunas de "+(r.nome||"a autora")+" quando saírem. Para sair, use o link “Cancelar” em qualquer e-mail.");else mostra("Link vencido ou inválido",r&&r.motivo==="expirado"?"O link de confirmação vale 7 dias. Peça de novo na página da coluna.":"Peça a assinatura de novo na página da coluna.")}).catch(function(){mostra("Não deu agora","Tente abrir o link de novo daqui a pouco.")});
else if(c)rpc("newsletter_cancelar",{p_token:c}).then(function(r){if(r&&r.ok)mostra("Assinatura cancelada","Você não vai mais receber as colunas de "+(r.nome||"a autora")+" por e-mail.");else mostra("Link inválido","Este link de cancelar não foi reconhecido.")}).catch(function(){mostra("Não deu agora","Tente abrir o link de novo daqui a pouco.")});
else if(fe&&fc)rpc("newsletter_assinar",{p_email:fe,p_coluna:fc}).then(function(r){mostra(r==="limite"?"Muitos pedidos":"Falta confirmar",r==="limite"?"Tente de novo mais tarde.":"Mandamos um e-mail para "+fe+". Toque no link dele para confirmar.")}).catch(function(){mostra("Não deu agora","Confira o e-mail e tente de novo.")});
})();
"""


def cabeca(tit, desc, url, img, extra=""):
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(tit)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta property="og:site_name" content="Prumo News">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{e(tit)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(tit)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{e(img)}">{extra}
<meta name="theme-color" content="#0f1522" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#fbfaf7" media="(prefers-color-scheme: light)">
<link rel="icon" href="../icon-192.png">
<link rel="stylesheet" href="coluna.css">
</head>
"""


def avatar(a, url_foto):
    if a.get("foto"): return f'<img class="cp-av" src="{e(url_foto(a["foto"]))}" alt="" width="40" height="40">'
    return f'<span class="cp-av" aria-hidden="true">{e(a["nome"][:1].upper())}</span>'


def form(c):
    return f"""<form class="cp-form" action="assinatura.html" method="get" data-coluna="{e(c['id'])}">
<input type="hidden" name="coluna" value="{e(c['id'])}">
<input id="em-{e(c['id'][:8])}" aria-label="Seu e-mail" type="email" name="email" required maxlength="254" autocomplete="email" inputmode="email" placeholder="seu@email.com">
<button class="cp-btn" type="submit">Assinar por e-mail</button>
</form>
<p class="cp-msg" role="status" aria-live="polite"></p>
<p class="cp-priv">Seu e-mail serve só para mandar as colunas de {e(c['autora']['nome'])} quando saírem. Primeiro chega um e-mail para você confirmar; todo e-mail tem o link para cancelar. A lista não é pública: só a autora vê quem confirmou.</p>"""


def pagina(c, todas, url_foto, base=BASE):
    a, arq = c["autora"], arquivo_de(c)
    url = f"{base}/c/{arq}"
    corpo = limpar(c["corpo"] if c["formato"] == "h" else de_markdown(c["corpo"]), c["fotos"], url_foto)
    # links: mostram o domínio ao lado (como no app)
    def dom(m):
        d = dominio(html.unescape(m.group(1)))
        tx = texto_puro(m.group(2)).lower()
        return m.group(0) + (f' <span class="cp-dom">({e(d)})</span>' if d and d not in tx else "")
    corpo = re.sub(r'<a href="([^"]*)"[^>]*>(.*?)</a>', dom, corpo)
    desc = (c["linha"] or c["cham"] or texto_puro(corpo))[:200]
    img = f"{base}/c/f/{foto_nome(c['capa'])}" if c["capa"] else f"{base}/og-padrao.png"
    kick = "Coluna" + (f" {c['n']}" if c["n"] else "") + (f" · {c['serie']}" if c["serie"] else "")
    words = len(re.findall(r"\w+", texto_puro(corpo)))
    mins = c["min"] or max(1, round(words / 200))
    extra = (f'\n<meta property="og:type" content="article">\n<meta property="article:published_time" content="{iso(c["at"])}">'
             f'\n<meta property="article:author" content="{e(a["nome"])}">\n<meta name="author" content="{e(a["nome"])}">')
    # série: só as públicas da mesma autora
    nav = ""
    if c["serie"]:
        k = slug(c["serie"])
        ser = sorted([x for x in todas if x["autora"]["k"] == a["k"] and x["serie"] and slug(x["serie"]) == k], key=lambda x: (x["n"] or 0, x["at"]))
        i = next((j for j, x in enumerate(ser) if x["id"] == c["id"]), -1)
        ant, prox = (ser[i - 1] if i > 0 else None), (ser[i + 1] if 0 <= i < len(ser) - 1 else None)
        if ant or prox:
            nav = f'<nav class="cp-nav" aria-label="Série {e(c["serie"])}">' + \
                (f'<a class="cp-a" href="{e(arquivo_de(ant))}"><small>‹ Anterior{" · Coluna " + str(ant["n"]) if ant["n"] else ""}</small><span>{e(ant["tit"])}</span></a>' if ant else "") + \
                (f'<a class="cp-p" href="{e(arquivo_de(prox))}"><small>Próxima ›{" · Coluna " + str(prox["n"]) if prox["n"] else ""}</small><span>{e(prox["tit"])}</span></a>' if prox else "") + "</nav>"
    n_au = sum(1 for x in todas if x["autora"]["k"] == a["k"])
    tags = f'<ul class="cp-tags">{"".join(f"<li>{e(t)}</li>" for t in c["tags"])}</ul>' if c["tags"] else ""
    capa = f'<figure class="cp-capa"><img src="{e(url_foto(c["capa"]))}" alt="" fetchpriority="high"></figure>' if c["capa"] else ""
    ler = f"../?nt=coluna:{c['id']}"
    return cabeca(f"{c['tit']} · {a['nome']} · Prumo News", desc, url, img, extra) + f"""<body>
<header class="cp-top"><a class="cp-marca" href="../">Prumo</a><a class="cp-ler" href="index.html">Colunas</a></header>
<main>
<article class="cp-art">
<p class="cp-k">{e(kick)}</p>
<h1>{e(c['tit'])}</h1>
{f'<p class="cp-l">{e(c["linha"])}</p>' if c["linha"] else ""}
<div class="cp-by">{avatar(a, url_foto)}<span><b>{e(a['nome'])}</b>{e(data_br(c['at']))} · {mins} min de leitura</span></div>
{capa}
<div class="cp-corpo">{corpo}</div>
{tags}
</article>
<div class="cp-acoes"><a class="cp-btn" href="{e(ler)}">Ler no Prumo</a><a class="cp-btn cp-g" href="#assinar">Assinar por e-mail</a></div>
{f'<section class="cp-box" aria-label="Série"><p class="cp-k">Série</p><h2>{e(c["serie"])}</h2>{nav}</section>' if nav else ""}
<section class="cp-box" id="assinar" aria-label="Sobre a autora">
<div class="cp-au">{avatar(a, url_foto).replace('width="40" height="40"', 'width="56" height="56"')}<div><h2>{e(a['nome'])}</h2><p>{n_au} {"coluna aberta" if n_au == 1 else "colunas abertas"} no Prumo</p></div></div>
<p>Receba as próximas colunas de {e(a['nome'])} por e-mail.</p>
{form(c)}
</section>
</main>
<footer>Publicado originalmente no Prumo News, por {e(a['nome'])}. O texto é da autora.</footer>
<script src="assinar.js" defer></script>
</body>
</html>
"""


def redireciona(novo, base=BASE):
    u = f"{base}/c/{novo}"
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Coluna · Prumo News</title><link rel="canonical" href="{e(u)}"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url={e(novo)}"></head>
<body><p><a href="{e(novo)}">A coluna mudou de endereço. Abrir.</a></p></body></html>
"""


def indice(todas, base=BASE):
    itens = "".join(f'<li><a href="{e(arquivo_de(c))}"><b>{e(c["tit"])}</b><span>{e(c["autora"]["nome"])} · {e(data_br(c["at"]))}{(" · " + e(c["linha"])) if c["linha"] else ""}</span></a></li>' for c in todas[:60])
    vazio = "" if todas else '<p class="cp-l">Ainda não há colunas abertas.</p>'
    return cabeca("Colunas abertas · Prumo News", "Colunas que as autoras do Prumo abriram para todos.", f"{base}/c/", f"{base}/og-padrao.png") + f"""<body>
<header class="cp-top"><a class="cp-marca" href="../">Prumo</a><a class="cp-ler" href="../">Abrir o Prumo</a></header>
<main><p class="cp-k">Prumo News</p><h1>Colunas abertas</h1><p class="cp-l">Colunas que as autoras do Prumo escolheram abrir para todos.</p>{vazio}<ul class="cp-lista">{itens}</ul></main>
</body>
</html>
"""


def assinatura(base=BASE):
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Assinatura · Prumo News</title><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer">
<link rel="canonical" href="{base}/c/assinatura.html"><link rel="stylesheet" href="coluna.css"></head>
<body><header class="cp-top"><a class="cp-marca" href="../">Prumo</a><a class="cp-ler" href="index.html">Colunas</a></header>
<main><section id="cp-estado" class="cp-box" aria-live="polite"><h1>Um instante…</h1><p>Conferindo o link.</p></section>
<p class="cp-priv">O e-mail que você deixou serve só para mandar as colunas da autora que você escolheu. Para sair, use o link “Cancelar” de qualquer e-mail.</p></main>
<script src="assinar.js" defer></script></body></html>
"""


def sitemap(todas, base=BASE):
    us = "".join(f"<url><loc>{e(base)}/c/{e(arquivo_de(c))}</loc><lastmod>{iso(c['at'])[:10]}</lastmod></url>" for c in todas)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{e(base)}/c/</loc></url>{us}</urlset>\n'


# ---------- rede (só no GitHub) ----------
def ler_api(url, chave):
    req = urllib.request.Request(url.rstrip("/") + "/rest/v1/rpc/colunas_publicas", data=b'{"p_limite":500}', method="POST",
                                 headers={"apikey": chave, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.loads(r.read().decode("utf-8"))
    if not isinstance(d, list): raise ValueError("resposta não é lista")
    return d


def baixador(url, chave):
    def baixa(path):
        q = urllib.parse.quote(path)
        h = {"apikey": chave}
        try:
            with urllib.request.urlopen(urllib.request.Request(f"{url.rstrip('/')}/storage/v1/object/authenticated/fotos/{q}", headers=h), timeout=30) as r:
                return r.read()
        except Exception:
            pass
        try:  # se o Storage pedir link assinado, assina por 10 minutos (a regra da v14 é a mesma)
            req = urllib.request.Request(f"{url.rstrip('/')}/storage/v1/object/sign/fotos/{q}", data=b'{"expiresIn":600}', method="POST",
                                         headers={**h, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                s = json.loads(r.read().decode()).get("signedURL") or ""
            if not s: return None
            with urllib.request.urlopen(f"{url.rstrip('/')}/storage/v1{s if s.startswith('/') else '/' + s}", timeout=30) as r:
                return r.read()
        except Exception:
            return None
    return baixa


def grava(cam, txt, modo="w"):
    if os.path.exists(cam):
        with open(cam, "rb" if modo == "wb" else "r", **({} if modo == "wb" else {"encoding": "utf-8"})) as f:
            if f.read() == txt: return False
    with open(cam, modo, **({} if modo == "wb" else {"encoding": "utf-8"})) as f: f.write(txt)
    return True


def gerar(dados, saida, baixa=lambda p: None, url_api="", chave="", base=BASE):
    """Grava tudo em `saida`. Devolve um resumo. `baixa(caminho)` devolve os bytes da foto (ou None)."""
    todas = [c for c in (valida(x) for x in (dados or [])) if c]
    vistos, uni = set(), []
    for c in sorted(todas, key=lambda x: -x["at"]):
        if c["id"] not in vistos: vistos.add(c["id"]); uni.append(c)
    todas = uni
    os.makedirs(os.path.join(saida, "f"), exist_ok=True)
    R = {"colunas": len(todas), "novas": 0, "mudaram": 0, "removidas": 0, "fotos": 0, "fotos_removidas": 0, "redirecionam": 0, "sem_foto": 0}
    # fotos (só baixa as que faltam)
    fotos_ok = set()
    for c in todas:
        quero = set(c["fotos"]) | ({c["autora"]["foto"]} if c["autora"]["foto"] else set())
        for p in quero:
            nm = foto_nome(p); cam = os.path.join(saida, "f", nm)
            if os.path.exists(cam): fotos_ok.add(p); continue
            b = baixa(p)
            if b and len(b) < 15 * 1024 * 1024 and (b[:3] == b"\xff\xd8\xff" or b[:8] == b"\x89PNG\r\n\x1a\n" or b[8:12] == b"WEBP"):
                with open(cam, "wb") as f: f.write(b)
                fotos_ok.add(p); R["fotos"] += 1
            else: R["sem_foto"] += 1
    url_foto = lambda p: f"f/{foto_nome(p)}" if p in fotos_ok else ""
    for c in todas:
        if c["capa"] and c["capa"] not in fotos_ok: c["capa"] = None
        if c["autora"]["foto"] and c["autora"]["foto"] not in fotos_ok: c["autora"]["foto"] = None
        c["fotos"] = [p for p in c["fotos"] if p in fotos_ok]
    # mapa: id -> nomes que a coluna já teve (para redirecionar)
    mp_cam = os.path.join(saida, "mapa.json")
    try: mapa = json.load(open(mp_cam, encoding="utf-8"))
    except (OSError, ValueError): mapa = {}
    if not isinstance(mapa, dict): mapa = {}
    novo_mapa, manter = {}, {"index.html", "assinatura.html"}
    for c in todas:
        arq, k = arquivo_de(c), c["id"]
        cam = os.path.join(saida, arq); ja = os.path.exists(cam)
        if grava(cam, pagina(c, todas, url_foto, base)): R["mudaram" if ja else "novas"] += 1
        manter.add(arq)
        antigos = [x for x in (mapa.get(k) or []) if isinstance(x, str) and PAGINA.match(x) and x != arq][-5:]
        for v in antigos:
            if grava(os.path.join(saida, v), redireciona(arq, base)): R["redirecionam"] += 1
            manter.add(v)
        novo_mapa[k] = antigos + [arq]
    for nm in os.listdir(saida):
        if PAGINA.match(nm) and nm not in manter:
            os.remove(os.path.join(saida, nm)); R["removidas"] += 1
    usadas = {foto_nome(p) for p in fotos_ok}
    for nm in os.listdir(os.path.join(saida, "f")):
        if nm not in usadas:
            os.remove(os.path.join(saida, "f", nm)); R["fotos_removidas"] += 1
    grava(mp_cam, json.dumps(novo_mapa, ensure_ascii=False, sort_keys=True, indent=0) + "\n")
    grava(os.path.join(saida, "index.html"), indice(todas, base))
    grava(os.path.join(saida, "sitemap.xml"), sitemap(todas, base))
    grava(os.path.join(saida, "assinatura.html"), assinatura(base))
    grava(os.path.join(saida, "coluna.css"), CSS)
    grava(os.path.join(saida, "assinar.js"), JS % (json.dumps(url_api.rstrip("/")), json.dumps(chave)))
    return R


def main(argv):
    ap = argparse.ArgumentParser(description="Páginas abertas das colunas públicas")
    ap.add_argument("--url", default=os.environ.get("SUPABASE_URL", ""))
    ap.add_argument("--chave", default=os.environ.get("SUPABASE_PUBLICAVEL", ""))
    ap.add_argument("--fixture"); ap.add_argument("--saida", default="c")
    a = ap.parse_args(argv)
    if a.chave and not a.chave.startswith("sb_publishable_"):
        print("use só a chave PUBLICÁVEL (sb_publishable_...)"); return 2
    if a.fixture:
        dados = json.load(open(a.fixture, encoding="utf-8")); baixa = lambda p: None
    else:
        if not a.url or not a.chave: print("faltam --url e --chave"); return 2
        try: dados = ler_api(a.url, a.chave)
        except Exception as ex:
            msg = str(ex)
            if "PGRST202" in msg or "404" in msg: print("o banco ainda não tem a v14 (colunas_publicas): nada a fazer"); return 0
            print("não deu para ler as colunas:", msg[:200]); return 1
        baixa = baixador(a.url, a.chave)
    R = gerar(dados, a.saida, baixa, a.url, a.chave)
    print("colunas públicas:", json.dumps(R, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
