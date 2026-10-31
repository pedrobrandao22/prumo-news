#!/usr/bin/env python3
"""Páginas de compartilhamento do Prumo News, sem IA (roda no GitHub quando o feed muda).

  python3 tools/paginas.py feed.json m/

Para cada pauta grava m/<id>.html: uma página mínima com título, resumo e foto nas etiquetas Open Graph
(o que o WhatsApp mostra na prévia do link) e que leva direto à matéria no app (/#m=<id>).
Só reescreve o arquivo quando muda. Páginas de pautas que saíram ficam (o app avisa que a notícia saiu).
"""
import html, json, os, re, sys

BASE = "https://prumonews.com.br"
FOTO_OK = re.compile(r"^https://([a-z0-9-]+\.)*(ebc\.com\.br|wikimedia\.org|staticflickr\.com|flickr\.com|unsplash\.com|pexels\.com|senado\.leg\.br|camara\.leg\.br|gov\.br|stf\.jus\.br|tse\.jus\.br)/", re.I)
WIKI = re.compile(r"^https://upload\.wikimedia\.org/wikipedia/([a-z]+)/([0-9a-f])/([0-9a-f]{2})/([^/?#]+\.(?:jpe?g|png|webp))$", re.I)
PID = re.compile(r"^[A-Za-z0-9_-]{1,80}$")


def foto_leve(u):
    m = WIKI.match(u or "")
    return f"https://upload.wikimedia.org/wikipedia/{m[1]}/thumb/{m[2]}/{m[3]}/{m[4]}/960px-{m[4]}" if m else u


def hash_str(s):
    """Igual ao hashStr do app: escolhe a mesma foto de arquivo para a mesma pauta."""
    h = 0
    for c in str(s):
        h = (h * 31 + ord(c[0] if ord(c) < 0x10000 else chr(0xD800 + ((ord(c) - 0x10000) >> 10)))) & 0xFFFFFFFF
    if h >= 0x80000000: h -= 0x100000000
    return abs(h)


def pos_palavra(t, k):
    m = re.search(r"(^|[^\w]|_)" + re.escape(k) + r"(?=$|[^\w]|_)", t)
    return m.start() + len(m.group(1)) if m else -1


def fa_nome(u):
    u = str(u or "").split("?")[0]
    m = re.search(r"/thumb/[0-9a-f]/[0-9a-f]{2}/([^/]+)/", u, re.I)
    from urllib.parse import unquote
    return unquote(m.group(1) if m else u.rsplit("/", 1)[-1]).lower()


def fa_valida(f):
    return isinstance(f, dict) and isinstance(f.get("url"), str) and bool(FOTO_OK.match(f["url"]))


def fa_pessoa(tit, A):
    best, pos, ln = None, 10**9, 0
    for x in (A.get("pessoas") or {}).values():
        for k in (x.get("chaves") if isinstance(x, dict) and isinstance(x.get("chaves"), list) else []):
            if not isinstance(k, str) or not k: continue
            i = pos_palavra(tit, k)
            if i >= 0 and (i < pos or (i == pos and len(k) > ln)): best, pos, ln = x, i, len(k)
    return best


def fa_assunto(tit, A, sec):
    best, pos, ln = None, 10**9, 0
    for x in (A.get("assuntos") or {}).values():
        if not isinstance(x, dict) or not isinstance(x.get("chaves"), list): continue
        if isinstance(x.get("secoes"), list) and sec not in x["secoes"]: continue
        for k in x["chaves"]:
            if not isinstance(k, str) or not k: continue
            i = pos_palavra(tit, k)
            if i >= 0 and (i < pos or (i == pos and len(k) > ln)): best, pos, ln = x, i, len(k)
    return best


def fa_listas(p, A):
    L, T, sec = [], A.get("temas") or {}, p.get("secao") or "politica"
    pe = None if p.get("foto_arquivo") == "tema" else fa_pessoa(str((p.get("neutro") or {}).get("titulo") or ""), A)
    if pe and isinstance(pe.get("fotos"), list) and pe["fotos"]: L.append(pe["fotos"])
    asn = fa_assunto(str((p.get("neutro") or {}).get("titulo") or ""), A, sec)
    if asn and isinstance(asn.get("fotos"), list) and asn["fotos"]: L.append(asn["fotos"])
    t = T.get(f"{sec}/{p.get('subtema') or ''}")
    if isinstance(t, list) and t: L.append(t)
    d = T.get((A.get("padrao") or {}).get(sec))
    if isinstance(d, list) and d and d is not t: L.append(d)
    return L


def mapa_fotos(pautas, A):
    """Mesma regra do app (faMapa): pessoa citada primeiro no título, senão o tema; sem repetir foto na edição,
    e a pauta de maior prioridade escolhe primeiro."""
    if not isinstance(A, dict): return {}
    usados, M, dup = set(), {}, set()
    pr = lambda p: p.get("prioridade") if isinstance(p.get("prioridade"), (int, float)) and not isinstance(p.get("prioridade"), bool) else 0
    ordem = [p for _, p in sorted(enumerate(pautas), key=lambda x: (-pr(x[1]), x[0]))]
    for p in ordem:  # foto própria repetida em outra pauta (de maior prioridade) dá lugar a uma de arquivo
        if fa_valida(p.get("foto")):
            n = fa_nome(p["foto"]["url"])
            if n in usados: dup.add(p.get("id"))
            else: usados.add(n)
    for p in ordem:
        if not p.get("id") or (fa_valida(p.get("foto")) and p.get("id") not in dup): continue
        L, h, esc = fa_listas(p, A), hash_str(p["id"]), None
        for l in L:
            for j in range(len(l)):
                f = l[(h + j) % len(l)]
                if fa_valida(f) and fa_nome(f["url"]) not in usados: esc = f; break
            if esc: break
        if not esc and L and fa_valida(L[0][h % len(L[0])]): esc = L[0][h % len(L[0])]
        if not esc and p["id"] in dup: continue
        if esc:
            usados.add(fa_nome(esc["url"]))
            M[p["id"]] = {"url": esc["url"], "credito": esc.get("credito") or "Foto de arquivo: Wikimedia Commons"}
    return M


def primeira_frase(t):
    t = re.sub(r"\s+", " ", str(t or "")).strip()
    m = re.match(r"(.+?[.!?])(\s|$)", t)
    return (m.group(1) if m else t)[:220]


def pagina(p, FA=None):
    pid = p["id"]
    n = p.get("neutro") or {}
    tit = str(n.get("titulo") or "Prumo News").strip()
    desc = str(p.get("subtitulo") or "").strip() or primeira_frase(n.get("texto"))
    f = (FA or {}).get(p["id"]) or (p["foto"] if fa_valida(p.get("foto")) else {})
    img, w, h = BASE + "/og-padrao.png", "1200", "630"
    if isinstance(f.get("url"), str) and FOTO_OK.match(f["url"]):
        img, w, h = foto_leve(f["url"]), "", ""
        if f.get("credito"): desc = (desc + " (" + str(f["credito"]).strip() + ")").strip()
    e = lambda s: html.escape(str(s), quote=True)
    url = f"{BASE}/m/{pid}.html"
    alvo = f"/#m={pid}"
    tam = f'\n<meta property="og:image:width" content="{w}">\n<meta property="og:image:height" content="{h}">' if w else ""
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(tit)} · Prumo News</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Prumo News">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{e(tit)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(img)}">{tam}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0f1522">
<script>location.replace({json.dumps(alvo)})</script>
<style>body{{margin:0;font:16px/1.5 system-ui,sans-serif;background:#0f1522;color:#e8ecf2;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box;text-align:center}}a{{color:#e6b673}}</style>
</head>
<body><p><a href="{e(alvo)}">{e(tit)}</a><br>Abrindo no Prumo News…</p></body>
</html>
"""


def main(argv):
    if len(argv) < 2: print(__doc__); return 2
    feed, pasta = argv[0], argv[1]
    F = json.load(open(feed, encoding="utf-8"))
    os.makedirs(pasta, exist_ok=True)
    arq = argv[2] if len(argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(feed)), "fotos-arquivo.json")
    try: A = json.load(open(arq, encoding="utf-8"))
    except (OSError, ValueError): A = None
    pautas = [p for p in F.get("pautas") or [] if isinstance(p, dict)]
    FA = mapa_fotos(pautas, A)
    novas = mudou = 0
    for p in F.get("pautas") or []:
        pid = p.get("id") if isinstance(p, dict) else None
        if not isinstance(pid, str) or not PID.match(pid): continue
        cam = os.path.join(pasta, pid + ".html")
        txt = pagina(p, FA)
        velho = open(cam, encoding="utf-8").read() if os.path.exists(cam) else None
        if velho == txt: continue
        with open(cam, "w", encoding="utf-8") as fh: fh.write(txt)
        if velho is None: novas += 1
        else: mudou += 1
    print(f"páginas: {novas} novas, {mudou} atualizadas")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
