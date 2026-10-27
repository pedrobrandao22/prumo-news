#!/usr/bin/env python3
"""Manchetes novas dos veículos, sem IA (roda no GitHub a cada hora).

  python3 tools/manchetes.py feed.json novidades.json [--horas 6]

Lê os feeds RSS públicos dos veículos (só título, link e hora: nada do texto das matérias), junta as
manchetes que falam do mesmo assunto e compara com o feed do Prumo:
- "novos": assuntos que ainda não estão no feed (relevante = 2 ou mais veículos);
- "em_pautas": manchetes posteriores à última atualização de uma pauta que já está no feed.
A rodada rápida do Claude lê novidades.json; se "acionar" for false, ela encerra sem gastar quase nada.
"""
import email.utils, json, re, sys, unicodedata, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

SP = timezone(timedelta(hours=-3))
UA = {"User-Agent": "Mozilla/5.0 (prumo-news; +https://prumonews.com.br)"}

FONTES = [
    # (chave do veículo no feed, nome, url, seção provável ou None)
    ("p360", "Poder360", "https://www.poder360.com.br/feed/", None),
    ("cnn", "CNN Brasil", "https://www.cnnbrasil.com.br/feed/", None),
    ("ab", "Agência Brasil", "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml", None),
    ("met", "Metrópoles", "https://www.metropoles.com/feed", None),
    ("g1", "g1", "https://g1.globo.com/rss/g1/", None),
    ("g1", "g1 Política", "https://g1.globo.com/rss/g1/politica/", "politica"),
    ("g1", "g1 Economia", "https://g1.globo.com/rss/g1/economia/", "economia"),
    ("g1", "g1 Mundo", "https://g1.globo.com/rss/g1/mundo/", "mundo"),
    ("g1", "g1 Educação", "https://g1.globo.com/rss/g1/educacao/", "educacao"),
    ("ge", "ge", "https://ge.globo.com/rss/ge/", "esportes"),
    ("folha", "Folha Poder", "https://feeds.folha.uol.com.br/poder/rss091.xml", "politica"),
    ("folha", "Folha Mercado", "https://feeds.folha.uol.com.br/mercado/rss091.xml", "economia"),
    ("folha", "Folha Cotidiano", "https://feeds.folha.uol.com.br/cotidiano/rss091.xml", "brasil"),
    ("folha", "Folha Mundo", "https://feeds.folha.uol.com.br/mundo/rss091.xml", "mundo"),
    ("folha", "Folha Educação", "https://feeds.folha.uol.com.br/educacao/rss091.xml", "educacao"),
    ("folha", "Folha Esporte", "https://feeds.folha.uol.com.br/esporte/rss091.xml", "esportes"),
    ("im", "InfoMoney", "https://www.infomoney.com.br/feed/", "economia"),
    ("bbc", "BBC News Brasil", "https://feeds.bbci.co.uk/portuguese/rss.xml", None),
]

STOP = set("""a o as os um uma uns umas de da do das dos dar em na no nas nos num numa por pela pelo pelas pelos para pra
com sem sob sobre entre ate apos e ou mas que se sua seu suas seus ao aos à às é ser foi sao são está esta estao diz dizem
vai vao apos após contra como mais menos muito ja já nao não sim tem têm ter há ha isso essa esse este esta pode podem
depois antes ainda onde quando quem qual quais ele ela eles elas lhe seja sido ate veja video vídeo ao-vivo hoje ontem
amanha amanhã novo nova novos novas ano anos dia dias diz após""".split())


def norm(s):
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()


def tokens(s):
    return {t for t in re.findall(r"[a-z0-9]+", norm(s)) if (len(t) >= 3 or t.isdigit()) and t not in STOP}


def quando(txt):
    if not txt: return None
    txt = txt.strip()
    try:
        d = email.utils.parsedate_to_datetime(txt)
    except Exception:
        try: d = datetime.fromisoformat(txt.replace("Z", "+00:00"))
        except Exception: return None
    if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(SP)


def ler(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        raiz = ET.fromstring(r.read())
    out = []
    for it in raiz.iter():
        tag = it.tag.split("}")[-1]
        if tag not in ("item", "entry"): continue
        f = {c.tag.split("}")[-1]: c for c in it}
        tit = (f.get("title").text if f.get("title") is not None else "") or ""
        link = ""
        if f.get("link") is not None:
            link = (f["link"].text or f["link"].get("href") or "").strip()
        h = None
        for k in ("pubDate", "published", "updated", "date"):
            if f.get(k) is not None and f[k].text: h = quando(f[k].text); break
        tit = re.sub(r"\s+", " ", tit).strip()
        if tit and link.startswith("http"): out.append({"titulo": tit[:180], "url": link, "hora": h})
    return out


def ultima_pauta(p):
    hs = [str(p.get("hora") or "")] + [str(u.get("hora") or "") for u in p.get("atualizacoes") or [] if isinstance(u, dict)]
    hs = [h for h in hs if re.match(r"\d{4}-\d\d-\d\dT", h)]
    if not hs: return None
    try: return datetime.fromisoformat(max(hs))
    except Exception: return None


def main(argv):
    horas = 6
    if "--horas" in argv:
        i = argv.index("--horas"); horas = float(argv[i + 1]); argv = argv[:i] + argv[i + 2:]
    if len(argv) < 2: print(__doc__); return 2
    feed = json.load(open(argv[0], encoding="utf-8"))
    agora = datetime.now(SP)
    try: ref = datetime.fromisoformat(feed.get("atualizado_em"))
    except Exception: ref = agora - timedelta(hours=horas)
    desde = max(ref, agora - timedelta(hours=horas)) - timedelta(minutes=10)

    status, itens, vistos = {}, [], set()
    for chave, nome, url, sec in FONTES:
        try:
            lst = ler(url)
            novos = [x for x in lst if x["hora"] and x["hora"] >= desde]
            status[nome] = f"ok: {len(lst)} itens, {len(novos)} desde {desde.strftime('%d/%m %Hh%M')}"
            for x in novos:
                if x["url"] in vistos: continue
                vistos.add(x["url"])
                itens.append({**x, "fonte": chave, "veiculo": nome, "secao": sec, "tk": tokens(x["titulo"])})
        except Exception as e:
            status[nome] = "falhou: " + repr(e)[:100]

    # o que já é pauta (título, tema, tag e subtema) e o que já é breve
    pautas = []
    for p in feed.get("pautas") or []:
        tk = tokens(" ".join(str(p.get(k) or "") for k in ("tema", "tag")) + " " + str((p.get("neutro") or {}).get("titulo") or ""))
        pautas.append((p.get("id"), p.get("secao"), tk, ultima_pauta(p)))
    breves = [tokens(b.get("titulo")) for b in feed.get("breves") or [] if isinstance(b, dict)]

    def pauta_de(tk):
        best, sc = None, 0.0
        for pid, sec, ptk, ult in pautas:
            if not tk or not ptk: continue
            inter = len(tk & ptk)
            s = inter / min(len(tk), len(ptk))
            if inter >= 2 and s > sc: best, sc = (pid, sec, ult), s
        return best if sc >= 0.5 else None

    # agrupa manchetes parecidas
    grupos = []
    for x in sorted(itens, key=lambda x: x["hora"]):
        alvo = None
        for g in grupos:
            inter = len(x["tk"] & g["tk"])
            if inter >= 3 or (inter >= 2 and inter / max(1, min(len(x["tk"]), len(g["tk"]))) >= 0.5):
                alvo = g; break
        if alvo is None:
            alvo = {"tk": set(), "itens": []}; grupos.append(alvo)
        alvo["itens"].append(x); alvo["tk"] |= x["tk"]

    novos, em_pautas = [], {}
    for g in grupos:
        fontes = sorted({x["fonte"] for x in g["itens"]})
        secs = [x["secao"] for x in g["itens"] if x["secao"]]
        sec = max(set(secs), key=secs.count) if secs else None
        p = pauta_de(g["tk"])
        lista = [{"veiculo": x["veiculo"], "titulo": x["titulo"], "url": x["url"], "hora": x["hora"].strftime("%d/%m %Hh%M")}
                 for x in sorted(g["itens"], key=lambda x: x["hora"], reverse=True)[:4]]
        if p:
            pid, psec, ult = p
            depois = [x for x in g["itens"] if not ult or x["hora"] > ult]
            if depois:
                e = em_pautas.setdefault(pid, {"secao": psec, "n_fontes": 0, "manchetes": []})
                e["n_fontes"] = max(e["n_fontes"], len({x["fonte"] for x in depois}))
                e["manchetes"] += [m for m in lista if m["titulo"] not in {y["titulo"] for y in e["manchetes"]}][:4]
            continue
        breve = any(len(g["tk"] & b) >= 3 for b in breves)
        novos.append({"assunto": lista[0]["titulo"], "secao": sec, "n_fontes": len(fontes), "fontes": fontes,
                      "ja_e_breve": breve, "relevante": len(fontes) >= 2 and not breve, "manchetes": lista})
    novos.sort(key=lambda g: (-g["relevante"], -g["n_fontes"], g["assunto"]))
    relevantes = sum(1 for g in novos if g["relevante"])
    pautas_2 = sum(1 for e in em_pautas.values() if e["n_fontes"] >= 2)
    out = {"gerado": agora.isoformat(timespec="minutes"), "desde": desde.isoformat(timespec="minutes"),
           "feed_atualizado_em": feed.get("atualizado_em"),
           "resumo": {"manchetes": len(itens), "assuntos_novos_relevantes": relevantes, "assuntos_novos": len(novos),
                      "pautas_com_novidade": len(em_pautas), "pautas_com_novidade_2_fontes": pautas_2},
           "acionar": relevantes > 0 or pautas_2 > 0,
           "novos": novos[:30], "em_pautas": em_pautas, "fontes": status}
    with open(argv[1], "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print(json.dumps(out["resumo"], ensure_ascii=False), "acionar =", out["acionar"])
    for k, v in status.items(): print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
