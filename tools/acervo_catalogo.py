#!/usr/bin/env python3
"""Catálogo de fotos por ASSUNTO do Prumo News (26/11, pedido do Pedro: toda notícia com foto; banco com 1.000+ fotos
bem rotuladas). Sem IA. Complementa o tools/fotos_arquivo.py (retratos e instituições).

  python3 -I tools/acervo_catalogo.py [--raiz .] [--limite 150] [--minutos 20] [--so id1,id2] [--sem-baixar]

Lê o catálogo de verbetes (tools/acervo_verbetes.py), busca no Wikimedia Commons fotos de licença livre (CC BY,
CC BY-SA, CC0 ou domínio público, conferida arquivo a arquivo), guarda a cópia reduzida em acervo/c/ e grava
acervo-catalogo.json na raiz:
  {"versao":1, "gerado":ISO, "verbetes": {id: {"rotulo", "tipo", "secoes", "subtemas", "palavras", "fotos":[
      {"url","local","credito","pagina","licenca","autor","fonte","alt","w","h"}]}}, "total": N}
"tipo": "ilustrativa" (cena genérica, serve a qualquer notícia do assunto; o app credita como "Foto ilustrativa"),
"lugar" (cidade, país, prédio com nome) ou "instituicao". Foto já escolhida fica (não troca a cada execução);
foto retirada à mão entra em "fora" do verbete e não volta.
"""
import hashlib, json, os, re, sys, time
from datetime import datetime
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import fotos_arquivo as F
from acervo_verbetes import VERBETES

POR_VERBETE = 5
RUIM = re.compile(r"(\bmap\b|mapa|locator|diagram|logo|icon|coat of arms|brasao|flag of|bandeira d|stamp|selo|sketch|drawing|desenho|"
                  r"painting|pintura|engraving|gravura|illustration from|cartoon|caricatur|chart|grafico|screenshot|poster|cartaz|"
                  r"\b1[5-9]\d\d\b|\b19[0-8]\d\b|black and white|preto e branco|postcard|cartao postal|portrait|retrato|headshot|"
                  r"nude|naked|corpse|dead body|cadaver|blood|sangue|wounded|ferido|funeral|protest|manifestac|election poster|"
                  r"campaign|campanha|rally|comicio)")


GENTE = re.compile(r"(portrait|retrato|selfie|ceremony|cerimonia|posse\b|visits?\b|visita\b|meeting|meets\b|reuniao|encontro|secretary|minist(?:er|ro|ra)\b|president[ea]?\b|governador|senador|deputad|prefeit[oa]\b|ambassador|embaixador|general\b|commander|speech|discurso|press conference|coletiva|delegation|comitiva|award|premiac|medal|podium|podio|mascot|black and white|preto e branco|satellite|satelite|landsat|sentinel-|modis|nasa earth|\biss0|bird\b|aves?\b|passaro)")

def busca(consulta, chaves, n, vistos, fora):
    """Fotos livres do Commons para a consulta; a palavra-chave precisa estar no nome, na descrição ou nas categorias."""
    d = None
    for tentativa in range(5):  # o Commons limita pedidos por IP (429 com Retry-After): espera e tenta de novo
        try:
            d = F.api({"action": "query", "generator": "search", "gsrsearch": f"{consulta} filetype:bitmap", "gsrnamespace": "6",
                       "gsrlimit": "50", "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
                       "iiextmetadatafilter": "Artist|LicenseShortName|ImageDescription|Categories|ObjectName"})
            break
        except Exception as e:
            if getattr(e, "code", 0) == 429 and tentativa < 4: time.sleep(20 * (tentativa + 1)); continue
            print("  busca falhou:", consulta, repr(e)[:100]); return []
    if d is None: return []
    pags = sorted((d.get("query") or {}).get("pages") or [], key=lambda p: p.get("index", 99))
    ks = [F.norm(k) for k in chaves if k.strip()]
    out = []
    for p in pags:
        ii = (p.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata") or {}
        tit = F.norm(p.get("title", "")).replace("_", " ")
        desc = F.norm(F.limpa((md.get("ImageDescription") or {}).get("value")) or "")[:400]
        cats = F.norm((md.get("Categories") or {}).get("value") or "")
        if ks and not any(k in tit or k in cats or k in desc for k in ks): continue
        if RUIM.search(tit) or RUIM.search(cats) or F.FORA.search(tit) or F.NEGADAS.search(tit): continue
        if GENTE.search(tit) or GENTE.search(desc[:200]): continue  # 26/11: foto de assunto não mostra autoridade nem evento com gente identificável
        if ii.get("mime") not in ("image/jpeg", "image/webp"): continue
        w, h = ii.get("width") or 0, ii.get("height") or 0
        if w < 900 or h < 500 or w < h * 1.15 or w > h * 2.4: continue  # deitada, nem tira nem retrato
        lic = F.limpa((md.get("LicenseShortName") or {}).get("value"))
        if not lic or not F.LIVRE.search(lic) or F.PROIBIDO.search(lic): continue
        autor = F.limpa((md.get("Artist") or {}).get("value")) or "autor desconhecido"
        if F.HISTORICO.search(autor) or len(autor) > 90: continue
        url = (ii.get("url") or "").split("?")[0]
        if not url.startswith("https://upload.wikimedia.org/") or url in vistos or url in fora: continue
        vistos.add(url)
        out.append({"url": url, "credito": F.limpa_credito(f"{autor}/Wikimedia Commons ({lic})"),
                    "pagina": (ii.get("descriptionurl") or "").split("?")[0], "licenca": lic, "autor": autor, "fonte": "Wikimedia Commons"})
        if len(out) >= n: break
    time.sleep(1.5)
    return out


def main(argv):
    opts = {"--raiz": os.path.join(AQUI, ".."), "--limite": "150", "--so": "", "--por": str(POR_VERBETE), "--minutos": "0"}
    i = 1
    while i < len(argv):
        if argv[i] in opts: opts[argv[i]] = argv[i + 1]; i += 2
        else: i += 1
    raiz = os.path.abspath(opts["--raiz"]); saida = os.path.join(raiz, "acervo-catalogo.json"); por = int(opts["--por"])
    velho = {}
    if os.path.exists(saida):
        try: velho = json.load(open(saida, encoding="utf-8")).get("verbetes") or {}
        except Exception: velho = {}
    so = {x for x in opts["--so"].split(",") if x}
    E = {"raiz": raiz, "restam": int(opts["--limite"]), "total": 0, "max": 10 ** 12, "baixar": "--sem-baixar" not in argv, "novas": 0}
    vistos = {f.get("url") for v in velho.values() for f in v.get("fotos") or []}
    try:  # não repete foto que já está no acervo de retratos e instituições
        A = json.load(open(os.path.join(raiz, "fotos-arquivo.json"), encoding="utf-8"))
        for g in ("assuntos", "temas"):
            for v in (A.get(g) or {}).values():
                for f in (v.get("fotos") if isinstance(v, dict) else v) or []: vistos.add(f.get("url"))
    except Exception: pass
    try: FORA = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "acervo_fora.json"), encoding="utf-8"))  # revisão à mão: {verbete: [url, ...]}
    except Exception: FORA = {}
    res = {}; t0 = time.time(); prazo = float(opts["--minutos"]) * 60
    for vid, rotulo, tipo, secoes, subtemas, palavras, consultas in VERBETES:
        ant = velho.get(vid) or {}
        fora = set(ant.get("fora") or []) | set(FORA.get(vid) or [])
        for f in ant.get("fotos") or []:  # foto retirada na revisão: o arquivo sai junto
            if f.get("url") in fora and (f.get("local") or "").startswith("acervo/c/"):
                try: os.remove(os.path.join(raiz, f["local"]))
                except OSError: pass
        fotos = [f for f in ant.get("fotos") or [] if f.get("url") not in fora and f.get("local") and os.path.exists(os.path.join(raiz, f["local"]))]
        alvo = por if not (ant.get("fotos") or fora) else 3  # verbete já revisado só é completado quando fica com menos de 3 fotos
        ch = hashlib.md5("\n".join(consultas).encode("utf-8")).hexdigest()[:10]  # a lista de consultas mudou? então vale buscar de novo
        if len(FORA.get(vid) or []) >= 5 and not vid.startswith("geral-") and (ant.get("consultas_h") == ch or (fotos and "consultas_h" not in ant)): alvo = 0  # busca esgotada: 5+ fotos já recusadas à mão; só volta com consulta nova (ou, vazio, uma vez)
        if len(fotos) < alvo and E["baixar"] and E["restam"] > 0 and (not so or vid in so) and (not prazo or time.time() - t0 < prazo):
            for c in consultas:
                q, _, kw = c.partition("|")
                for f in busca(q.strip(), kw.split(","), por * 2, vistos, fora):
                    if len(fotos) >= alvo or E["restam"] <= 0: break
                    if sum(1 for x in fotos if x.get("autor") == f.get("autor")) >= 2: continue  # variedade: até 2 fotos do mesmo autor
                    f["alt"] = ("Foto ilustrativa: " if tipo == "ilustrativa" else "Foto de arquivo: ") + rotulo
                    if F.guardar(f, vid, "acervo/c", False, E) and not F.fina_demais(f): fotos.append(f)
                if len(fotos) >= alvo: break
            print(f"{vid}: {len(fotos)} fotos")
        res[vid] = {"rotulo": rotulo, "tipo": tipo, "secoes": secoes, "subtemas": subtemas, "palavras": palavras, "fotos": fotos, "consultas_h": ch}
        if fora: res[vid]["fora"] = sorted(fora)
    total = sum(len(v["fotos"]) for v in res.values())
    with open(saida, "w", encoding="utf-8") as fh:
        json.dump({"versao": 1, "gerado": datetime.now(F.SP).isoformat(timespec="minutes"), "total": total, "verbetes": res}, fh, ensure_ascii=False, separators=(",", ":"))
    vazios = [k for k, v in res.items() if not v["fotos"]]
    print(f"gravado: {len(res)} verbetes, {total} fotos ({E['novas']} novas); sem foto: {len(vazios)} {vazios[:30]}")


if __name__ == "__main__":
    main(sys.argv)
