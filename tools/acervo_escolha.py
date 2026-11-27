#!/usr/bin/env python3
"""Escolhe, no catálogo por assunto (acervo-catalogo.json), a foto de uma notícia que ficou sem foto (26/11, pedido do
Pedro: toda notícia tem foto; vale uma foto próxima do assunto, marcada como ilustrativa, em vez de nenhuma).

Ordem: (1) o primeiro verbete, na ordem do catálogo, cuja palavra aparece no título ou no subtítulo e que vale para a
editoria da notícia; (2) o verbete "geral-<editoria>"; (3) "geral-jornais". Dentro do verbete, a foto ainda não usada
na edição; a escolha é estável (sai do id da notícia), para a foto não trocar a cada rodada.
Sem rede e sem IA: usado por tools/paginas.py, que grava a escolha em m/fotos.json para o app usar a mesma.
"""
import hashlib, json, os, re, sys, unicodedata

_AQUI = os.path.dirname(os.path.abspath(__file__))
if _AQUI not in sys.path: sys.path.insert(0, _AQUI)
try:
    from acervo_verbetes import VERBETES  # as palavras e a ordem valem as do código (o catálogo pode estar uma rodada atrás)
except Exception:
    VERBETES = []
try:
    FORA = {u for us in json.load(open(os.path.join(_AQUI, "acervo_fora.json"), encoding="utf-8")).values() for u in us}  # retiradas na revisão
except Exception:
    FORA = set()


def fotos_de(v):
    return [f for f in (v or {}).get("fotos") or [] if f.get("local") and f.get("url") not in FORA]


def regras(cat):
    """(id, editorias, palavras) na ordem de escolha: a do código; verbete que só existe no catálogo vem depois."""
    V = (cat or {}).get("verbetes") or {}
    r = [(x[0], x[3], x[5]) for x in VERBETES if x[0] in V]; tem = {x[0] for x in r}
    return r + [(k, v.get("secoes"), v.get("palavras")) for k, v in V.items() if k not in tem]


def norm(s):
    t = unicodedata.normalize("NFD", str(s or "")); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return t.lower()


def casa(palavra, bruto, limpo):
    try:
        if palavra.startswith("CS:"): return re.search(palavra[3:], bruto) is not None
        if palavra.startswith("UF:"): return re.search(r"(?<![A-Za-zÀ-ÿ])" + re.escape(palavra[3:]) + r"(?![A-Za-zÀ-ÿ])", bruto) is not None
        return re.search(r"\b" + palavra, limpo) is not None
    except re.error:
        return False


def verbete_de(p, cat):
    """id do verbete para a notícia (ou None se o catálogo estiver vazio)."""
    V = (cat or {}).get("verbetes") or {}
    n = p.get("neutro") or {}
    tit = str(n.get("titulo") or ""); sub = p.get("subtitulo") if isinstance(p.get("subtitulo"), str) else ""
    sec = p.get("secao"); R = regras(cat)
    # 27/11: primeiro só o título (o assunto da notícia); o subtítulo só entra se o título não casar com nada.
    # Antes "Corinthians empata…" saía com o estádio de outro clube citado no subtítulo.
    for bruto in (tit, f"{tit} {sub}"):
        limpo = norm(bruto)
        for vid, secoes, palavras in R:
            if vid.startswith("geral-") or not fotos_de(V[vid]): continue
            if secoes and sec not in secoes: continue
            if any(casa(w, bruto, limpo) for w in palavras or []): return vid
    for vid in (f"geral-{sec}", "geral-jornais"):
        if fotos_de(V.get(vid)): return vid
    return None


def foto_de(p, cat, usadas=None):
    """Foto do catálogo para a notícia, no formato do fotos-arquivo.json (+ "verbete" e "ilustrativa"). usadas: conjunto
    de arquivos já usados na edição (a função acrescenta o escolhido)."""
    vid = verbete_de(p, cat)
    if not vid: return None
    v = cat["verbetes"][vid]; fotos = fotos_de(v)
    if not fotos: return None
    k = int(hashlib.sha1(str(p.get("id")).encode("utf-8")).hexdigest()[:8], 16)
    ordem = fotos[k % len(fotos):] + fotos[:k % len(fotos)]
    f = next((x for x in ordem if usadas is None or x["local"] not in usadas), ordem[0])
    if usadas is not None: usadas.add(f["local"])
    ilus = v.get("tipo") == "ilustrativa"
    cred = str(f.get("credito") or "").strip().lstrip("/").strip() or "Wikimedia Commons"
    out = {"url": f.get("url"), "local": f["local"], "pagina": f.get("pagina"), "licenca": f.get("licenca"), "fonte": f.get("fonte"),
           "credito": ("Foto ilustrativa: " if ilus else "Foto de arquivo: ") + cred,
           "alt": ("Foto ilustrativa: " if ilus else "Foto de arquivo: ") + str(v.get("rotulo") or ""),
           "w": f.get("w"), "h": f.get("h"), "verbete": vid}
    if ilus: out["ilustrativa"] = True
    return {k2: v2 for k2, v2 in out.items() if v2 is not None}


# 27/11 (Pedro, opção 3): post só de texto de uma pessoa ganha foto ilustrativa SÓ quando o assunto casa com clareza.
# Entram instituições, estádios e os temas de notícia abaixo. Ficam de fora os temas que aparecem em texto pessoal
# (saúde, luto, crime, religião, família, bichos, o dia a dia: ônibus, praia, café) e cidades/países (citar não é o assunto).
POSTS_TEMAS = set("""temporal frio calor seca queimada furacao vulcao enchente reais moedas dolar bolsa wall-street combustivel
gas-cozinha petroleo soja industria siderurgia mineracao data-center ciberseguranca telecom saneamento amazonia pantanal
garimpo barragem espaco urna bandeira-brasil enem nuclear tanque caca navio-guerra arbitro torcida volei basquete tenis f1
olimpiadas natacao atletismo lutas surfe skate ginastica ciclismo futebol-feminino esports bola-gramado trofeu-taca""".split())


# nome que também é palavra comum ("a câmera", "fui para a fazenda", "congresso de medicina"): pede 2 palavras do verbete
POSTS_NOME_COMUM = {"camara-plen", "fazenda", "congresso-ext", "esplanada", "alvorada"}


def para_posts(cat, por=3):
    """Lista enxuta para o app (m/acervo-posts.json): [{id, k, p, f:[{l, c}]}], na ordem de escolha.
    O texto casa com o verbete se tiver uma das k primeiras palavras (o nome: estádio = todas, instituição = a
    primeira, tema = nenhuma) ou 2 palavras diferentes da lista."""
    V = (cat or {}).get("verbetes") or {}; tipo = {x[0]: x[2] for x in VERBETES}
    out = []
    for vid, _secoes, palavras in regras(cat):
        if vid.startswith(("geral-", "cidade-", "pais-")): continue
        t = tipo.get(vid) or (V.get(vid) or {}).get("tipo")
        firme = vid.startswith("estadio-") or t == "instituicao"
        if not firme and vid not in POSTS_TEMAS: continue
        fs = fotos_de(V.get(vid))[:por]
        if not fs or not palavras: continue
        k = len(palavras) if vid.startswith("estadio-") else (1 if firme and vid not in POSTS_NOME_COMUM else 0)
        out.append({"id": vid, "k": k, "p": list(palavras),
                    "f": [{"l": f["local"], "c": (str(f.get("credito") or "").strip().lstrip("/").strip() or "Wikimedia Commons")[:90]} for f in fs]})
    return out
