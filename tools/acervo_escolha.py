#!/usr/bin/env python3
"""Escolhe, no catálogo por assunto (acervo-catalogo.json), a foto de uma notícia que ficou sem foto (26/11, pedido do
Pedro: toda notícia tem foto; vale uma foto próxima do assunto, marcada como ilustrativa, em vez de nenhuma).

Ordem: (1) o primeiro verbete, na ordem do catálogo, cuja palavra aparece no título ou no subtítulo e que vale para a
editoria da notícia; (2) o verbete "geral-<editoria>"; (3) "geral-jornais". Dentro do verbete, a foto ainda não usada
na edição; a escolha é estável (sai do id da notícia), para a foto não trocar a cada rodada.
Sem rede e sem IA: usado por tools/paginas.py, que grava a escolha em m/fotos.json para o app usar a mesma.
"""
import hashlib, re, unicodedata


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
    bruto = f"{n.get('titulo') or ''} {p.get('subtitulo') if isinstance(p.get('subtitulo'), str) else ''}"
    limpo = norm(bruto); sec = p.get("secao")
    for vid, v in V.items():
        if vid.startswith("geral-") or not v.get("fotos"): continue
        if v.get("secoes") and sec not in v["secoes"]: continue
        if any(casa(w, bruto, limpo) for w in v.get("palavras") or []): return vid
    for vid in (f"geral-{sec}", "geral-jornais"):
        if (V.get(vid) or {}).get("fotos"): return vid
    return None


def foto_de(p, cat, usadas=None):
    """Foto do catálogo para a notícia, no formato do fotos-arquivo.json (+ "verbete" e "ilustrativa"). usadas: conjunto
    de arquivos já usados na edição (a função acrescenta o escolhido)."""
    vid = verbete_de(p, cat)
    if not vid: return None
    v = cat["verbetes"][vid]; fotos = [f for f in v["fotos"] if f.get("local")]
    if not fotos: return None
    k = int(hashlib.sha1(str(p.get("id")).encode("utf-8")).hexdigest()[:8], 16)
    ordem = fotos[k % len(fotos):] + fotos[:k % len(fotos)]
    f = next((x for x in ordem if usadas is None or x["local"] not in usadas), ordem[0])
    if usadas is not None: usadas.add(f["local"])
    ilus = v.get("tipo") == "ilustrativa"
    cred = str(f.get("credito") or "Wikimedia Commons")
    out = {"url": f.get("url"), "local": f["local"], "pagina": f.get("pagina"), "licenca": f.get("licenca"), "fonte": f.get("fonte"),
           "credito": ("Foto ilustrativa: " if ilus else "Foto de arquivo: ") + cred,
           "alt": ("Foto ilustrativa: " if ilus else "Foto de arquivo: ") + str(v.get("rotulo") or ""),
           "w": f.get("w"), "h": f.get("h"), "verbete": vid}
    if ilus: out["ilustrativa"] = True
    return {k2: v2 for k2, v2 in out.items() if v2 is not None}
