#!/usr/bin/env python3
"""Páginas de compartilhamento do Prumo News, sem IA (roda no GitHub quando o feed muda).

  python3 tools/paginas.py feed.json m/

Para cada pauta grava m/<id>.html: uma página mínima com título, resumo e foto nas etiquetas Open Graph
(o que o WhatsApp mostra na prévia do link) e que leva direto à matéria no app (/#m=<id>).
Só reescreve o arquivo quando muda. Páginas de pautas que saíram ficam (o app avisa que a notícia saiu).
"""
import copy, html, json, os, re, sys, unicodedata

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


def _borda(ch):
    """Igual ao JS [^\\p{L}\\d]: letra (qualquer alfabeto) ou dígito 0-9 não é borda."""
    return not (ch.isalpha() or "0" <= ch <= "9")


def pos_palavra(t, k):
    for m in re.finditer(re.escape(k), t):
        i, j = m.start(), m.end()
        if (i == 0 or _borda(t[i - 1])) and (j == len(t) or _borda(t[j])): return i
    return -1


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


# ---- regras da foto de arquivo: iguais às do app (fonte/app/src/js/157-fotos.js) ----
def _norm(s):
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()


def _arq(f):
    return _norm(fa_nome(f.get("url") if isinstance(f, dict) else "")).replace("_", " ")


BLOQ = ["bolsa de valores (17205467578)", "bolsa de valores (17391295482)", "bolsa de valores (17393276865)", "iss-32 american eva b3", "alpina b3", "casa-da-moeda", "avenida central, vendo-se", "atual centro cultural da justica federal",
        "plenario do senado (15717805622)", "plenario do senado (15687627386)", "plenario do senado (15109327665)", "vestibular.jpg",
        "ofrenda de la liga", "roda viva com senadora", "com bandeira do brasil", "conselheira tais ferraz", "arena corinthians opening",
        "allianz parque - reconhecimento facial", "tudo-o-que-voce-sempre-quis-saber", "vidpovid to be performing", "hibakujumoku",
        "northern door of the assumption cathedral", "estacao agrometeorologica", "travessia de pedestres no patio da estacao"]
HIST = re.compile(r"(n[uú]cleo de digitaliza|\bIMS\b|Moreira Salles|Arquivo Nacional|Gaensly)", re.I)
BR = re.compile(r"(brasil|brazil|brasilia|sao paulo|guarulhos|rio de janeiro|planalto|congresso nacional|senado federal|camara dos deputados|supremo tribunal|paulista|copacabana|maracana|esplanada|itamaraty|banco central|ministerio d|bovespa|petrobras|policia militar|policia federal|unidade basica|allianz|mineirao|januario|beira-rio|fonte nova|arena mrv|interlagos)")
FORA = re.compile(r"(\bEUA\b|Estados Unidos|Miami|Nova York|Washington|Casa Branca|China|Shenzhen|Pequim|Apec|Asean|Filipinas|Manila|Turquia|\bCOP ?\d|Jap[aã]o|Singapura|Canad[aá]|Europa|Uni[aã]o Europeia|\bONU\b|\bG20\b|\bG7\b|Brics|[Vv]iagem|[Cc][uú]pula|exterior|Argentina|Venezuela|R[uú]ssia|Ucr[aâ]nia|Israel|Gaza|Ir[aã](?=$|[^A-Za-zÀ-ú])|Fran[cç]a|Alemanha|Reino Unido|Londres|Paris|[ÍI]ndia|Catar)")
PAISES = ["Irã", "Israel", "Ucrânia", "Rússia", "China", "Venezuela", "Argentina", "França", "Espanha", "Alemanha", "Reino Unido", "Japão", "Índia", "Catar"]
EVENTO = re.compile(r"([Cc][uú]pula|reuni|[Ee]ncontro|[Cc]onfer[eê]ncia|\bCOP ?\d*|Apec|\bG20\b|\bG7\b|Brics|Asean|[Vv]isita|[Vv]iagem|amistoso|[Jj]ogo|partida|Copa)")
EXIGE = {"café e agro": re.compile(r"[Cc]af[eé]"), "ONU": re.compile(r"(\bONU\b|Na[cç][oõ]es Unidas)"), "energia": re.compile(r"(energia|[Ll]uz\b|Aneel|hidrel|el[eé]tric)")}
TEMA = {"politica/Eleições 2026": 1, "politica/Congresso": 1, "politica/Planalto e governo": 1,
        "politica/STF e Judiciário": re.compile(r"(STF|Supremo|[Mm]inistr|[Pp]len[aá]rio|[Jj]ulg|Corte|Fachin|Moraes|Dino|Fux|Gilmar|Kassio|Nunes Marques|Mendon[cç]a|Zanin|Toffoli|C[aá]rmen|Barroso|Messias)"),
        "politica/Partidos": 1, "politica/Estados": re.compile(r"(S[aã]o Paulo|Rio de Janeiro|Tarc[ií]sio|Cl[aá]udio Castro|Bandeirantes|Guanabara)"),
        "economia/Juros e inflação": 1, "economia/Contas públicas": 1, "economia/Mercados": 1, "economia/Atividade econômica": 1, "economia/Trabalho e renda": 1, "economia/Seu dinheiro": 1,
        "brasil/Segurança": 1, "brasil/Justiça e polícia": 1, "brasil/Saúde": 1,
        "brasil/Meio ambiente e clima": re.compile(r"([Cc]huva|[Ee]nchente|[Aa]laga|[Ii]nunda|[Tt]emporal|[Cc]heia)"),
        "brasil/Infraestrutura e transporte": re.compile(r"([Rr]odovia|[Ee]strada|\bBR-\d|[Mm]etr[oô]|[Tt]r[aâ]nsito|[Tt]ransporte)"),
        "mundo/EUA": re.compile(r"(Casa Branca|Washington|Capit[oó]lio|Congresso (dos EUA|americano))"), "mundo/Europa": re.compile(r"(Parlamento Europeu|Estrasburgo|Bruxelas|Uni[aã]o Europeia)"),
        "mundo/Oriente Médio": re.compile(r"(Knesset|Jerusal[eé]m)"), "mundo/Ásia": re.compile(r"(Tiananmen|Pequim)"), "mundo/América Latina": re.compile(r"(Casa Rosada|Buenos Aires|Milei)"),
        "mundo/África": re.compile(r"(Uni[aã]o Africana|Adis Abeba)"),
        "educacao/Educação básica": 1, "educacao/Ensino superior": 1, "educacao/Enem e vestibulares": 1, "educacao/Políticas": 1, "educacao/Avaliações": 1,
        "esportes/Brasileirão": 1, "esportes/Série B": 1, "esportes/Copa do Brasil": 1, "esportes/Libertadores": 1, "esportes/Sul-Americana": 1, "esportes/Seleção": 1,
        "esportes/Clubes": 1, "esportes/Outros esportes": 1}


def bloqueada(f):
    if not isinstance(f, dict) or not isinstance(f.get("url"), str): return True
    n = _arq(f)
    return any(b in n for b in BLOQ) or bool(HIST.search(str(f.get("credito") or "")))


def grupo(f):
    """0 = retrato; 1 = recorte de foto com outra pessoa (só se não houver outro); 2 = foto de grupo/evento."""
    n = _arq(f); crop = "crop" in n
    if re.search(r"(ofrenda|champions|roda viva|bandeira|conselheir|nobel|gift to)", n): return 2
    if not crop and (n.count(",") >= 2 or re.search(r"\b(posse|cerimonia|almoco|convencao|comitiva|lancamento|inauguracao|votacao|acompanha|visita|meets|with|programa)\b", n)): return 2
    if re.search(r"\b(e|y|and|with|meets|com)\b", re.sub(r"\.[a-z]+$", "", n)): return 1 if crop else 2
    return 0


def preparar(A):
    """Acervo sem as fotos bloqueadas e sem foto de grupo como retrato (cópia; o arquivo não muda)."""
    A = copy.deepcopy(A)
    lista = lambda l: [f for f in l if isinstance(f, dict) and not bloqueada(f)] if isinstance(l, list) else l
    for x in (A.get("pessoas") or {}).values():
        if isinstance(x, dict) and isinstance(x.get("fotos"), list):
            l = lista(x["fotos"]); bons = [f for f in l if grupo(f) == 0]
            x["fotos"] = bons or [f for f in l if grupo(f) == 1]
    for x in (A.get("assuntos") or {}).values():
        if isinstance(x, dict) and isinstance(x.get("fotos"), list): x["fotos"] = lista(x["fotos"])
    T = A.get("temas") or {}
    for k in list(T): T[k] = lista(T[k])
    return A


def _br(f):
    return bool(BR.search(_arq(f) + " " + _norm(f.get("alt"))))


def fora(p):
    if (p.get("secao") or "politica") == "mundo": return True
    n = p.get("neutro") or {}
    return bool(FORA.search(" · ".join(x for x in (n.get("titulo"), p.get("tema"), p.get("tag")) if isinstance(x, str))))


def assunto_ok(nome, p, tit):
    if nome in PAISES and ((p.get("secao") or "politica") == "esportes" or EVENTO.search(tit)): return False
    r = EXIGE.get(nome)
    return not r or bool(r.search(tit))


def tema_ok(k, p):
    r = TEMA.get(k)
    if not r: return False
    if r == 1: return True
    n = p.get("neutro") or {}
    return bool(r.search(" · ".join(x for x in (n.get("titulo"), p.get("tema")) if isinstance(x, str))))


def pessoa_titulo(tit, A):
    best, pos, ln = None, 10**9, 0
    for x in (A.get("pessoas") or {}).values():
        if not isinstance(x, dict) or not isinstance(x.get("chaves"), list) or not isinstance(x.get("fotos"), list) or not any(fa_valida(f) for f in x["fotos"]): continue
        for k in x["chaves"]:
            if not isinstance(k, str) or not k: continue
            i = pos_palavra(tit, k)
            if i >= 0 and (i < pos or (i == pos and len(k) > ln)): best, pos, ln = x, i, len(k)
    return best


def assuntos_titulo(t, A, sec):
    out = []
    for nome, x in (A.get("assuntos") or {}).items():
        if not isinstance(x, dict) or not isinstance(x.get("chaves"), list): continue
        if isinstance(x.get("secoes"), list) and sec not in x["secoes"]: continue
        pos, ln = 10**9, 0
        for k in x["chaves"]:
            if not isinstance(k, str) or not k: continue
            i = pos_palavra(t, k)
            # palavra comum no começo do título vem com maiúscula ("Queimadas no Amazonas…", "Aviões colidem…")
            if i < 0 and k[0] != k[0].upper() and pos_palavra(t, k[0].upper() + k[1:]) == 0: i = 0
            if i >= 0 and (i < pos or (i == pos and len(k) > ln)): pos, ln = i, len(k)
        if pos < 10**9: out.append((pos, -ln, nome, x))
    out.sort(key=lambda z: (z[0], z[1], z[2]))
    return [(z[2], z[3]) for z in out]


def fa_listas(p, A):
    """Igual ao faListas do app (157-fotos.js): pessoa no TÍTULO > assuntos da frase principal do título que combinam
    com o fato > tema da seção quando ele é o lugar do fato. Notícia do exterior não usa lugar brasileiro.
    "foto_arquivo": "tema" tira o retrato. A = acervo já preparado (preparar)."""
    L, T, sec = [], A.get("temas") or {}, p.get("secao") or "politica"
    tit = str((p.get("neutro") or {}).get("titulo") or "")
    fo = fora(p)

    def pega(l, lugar):
        if not isinstance(l, list): return
        ok = [f for f in l if fa_valida(f) and not bloqueada(f) and not (lugar and fo and _br(f))]
        if ok and not any(o is l for o, _ in L): L.append((l, ok))
    if p.get("foto_arquivo") != "tema":
        pe = pessoa_titulo(tit, A)
        if pe: pega(pe["fotos"], False)
    fr = re.split(r";|\s[—–]\s", tit)[0]
    for nome, x in assuntos_titulo(fr, A, sec):
        if assunto_ok(nome, p, fr): pega(x.get("fotos"), True)
    k = f"{sec}/{p.get('subtema') or ''}"
    if tema_ok(k, p): pega(T.get(k), True)
    return [ok for _, ok in L]


def pessoa_da_foto(f, A, pessoas_feed):
    nm = fa_nome(f.get("url"))
    for k, x in (A.get("pessoas") or {}).items():
        if isinstance(x, dict) and any(isinstance(g, dict) and fa_nome(g.get("url")) == nm for g in x.get("fotos") or []): return k, x.get("chaves") or []
    m = re.match(r"^\s*foto de arquivo\s*:\s*(.+?)\s*$", str(f.get("alt") or ""), re.I)
    if m:
        nome = m.group(1); x = (A.get("pessoas") or {}).get(nome)
        if isinstance(x, dict): return nome, x.get("chaves") or []
        if nome in (pessoas_feed or {}): return nome, [nome]
    return None


def propria_ok(p, f, A, pessoas_feed):
    """Foto própria da pauta: vale, menos retrato de arquivo de quem não está no título (ou com "foto_arquivo":"tema")."""
    if not fa_valida(f) or bloqueada(f): return False
    pe = pessoa_da_foto(f, A, pessoas_feed)
    if not pe: return True
    if p.get("foto_arquivo") == "tema": return False
    tit = str((p.get("neutro") or {}).get("titulo") or "")
    return any(isinstance(k, str) and k and pos_palavra(tit, k) >= 0 for k in [pe[0]] + list(pe[1]))


def mapa_fotos(pautas, A, pessoas_feed=None):
    """Mesma regra do app (faMapa em 157-fotos.js): a pauta de maior prioridade escolhe primeiro; sem repetir foto na
    edição; sem foto que combine, nenhuma (a prévia usa a imagem padrão do site)."""
    if not isinstance(A, dict): return {}
    A = preparar(A)
    usados, M, prop = set(), {}, set()
    pr = lambda p: p.get("prioridade") if isinstance(p.get("prioridade"), (int, float)) and not isinstance(p.get("prioridade"), bool) else 0
    ordem = [p for _, p in sorted(enumerate(pautas), key=lambda x: (-pr(x[1]), x[0]))]
    for p in ordem:  # foto própria repetida em outra pauta (de maior prioridade) dá lugar a uma de arquivo
        f = p.get("foto")
        if isinstance(f, dict) and propria_ok(p, f, A, pessoas_feed):
            n = fa_nome(f["url"])
            if n not in usados: usados.add(n); prop.add(p.get("id"))
    for p in ordem:
        if not p.get("id") or p.get("id") in prop: continue
        L, h, esc = fa_listas(p, A), hash_str(p["id"]), None
        for l in L:
            for j in range(len(l)):
                f = l[(h + j) % len(l)]
                if fa_valida(f) and fa_nome(f["url"]) not in usados: esc = f; break
            if esc: break
        if esc:
            usados.add(fa_nome(esc["url"]))
            M[p["id"]] = {"url": esc["url"], "credito": esc.get("credito") or "Foto de arquivo: Wikimedia Commons"}
    return M


def primeira_frase(t):
    t = re.sub(r"\s+", " ", str(t or "")).strip()
    m = re.match(r"(.+?[.!?])(\s|$)", t)
    return (m.group(1) if m else t)[:220]


def pagina(p, FA=None, propria=None):
    pid = p["id"]
    n = p.get("neutro") or {}
    tit = str(n.get("titulo") or "Prumo News").strip()
    desc = str(p.get("subtitulo") or "").strip() or primeira_frase(n.get("texto"))
    pf = p.get("foto") if fa_valida(p.get("foto")) and not bloqueada(p["foto"]) and (propria is None or propria(p)) else {}
    f = (FA or {}).get(p["id"]) or pf
    img, w, h = BASE + "/og-padrao.png", "1200", "630"
    if isinstance(f.get("url"), str) and FOTO_OK.match(f["url"]):
        img, w, h = foto_leve(f["url"]), "", ""  # o crédito fica na página da matéria, não na prévia (15/11)
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
    PF = F.get("pessoas") if isinstance(F.get("pessoas"), dict) else {}
    FA = mapa_fotos(pautas, A, PF)
    AP = preparar(A) if isinstance(A, dict) else {}
    propria = lambda p: propria_ok(p, p.get("foto"), AP, PF)
    novas = mudou = 0
    for p in F.get("pautas") or []:
        pid = p.get("id") if isinstance(p, dict) else None
        if not isinstance(pid, str) or not PID.match(pid): continue
        cam = os.path.join(pasta, pid + ".html")
        txt = pagina(p, FA, propria)
        velho = open(cam, encoding="utf-8").read() if os.path.exists(cam) else None
        if velho == txt: continue
        with open(cam, "w", encoding="utf-8") as fh: fh.write(txt)
        if velho is None: novas += 1
        else: mudou += 1
    print(f"páginas: {novas} novas, {mudou} atualizadas")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
