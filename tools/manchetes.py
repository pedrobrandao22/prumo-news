#!/usr/bin/env python3
"""Manchetes novas dos veículos, sem IA (roda no GitHub a cada hora).

  python3 tools/manchetes.py feed.json novidades.json [--horas 6]

Lê os feeds RSS públicos dos veículos (só título, link e hora: nada do texto das matérias), junta as
manchetes que falam do mesmo assunto e compara com o feed do Prumo:
- "novos": assuntos que ainda não estão no feed (relevante = 3 ou mais veículos diferentes);
- "em_pautas": manchetes posteriores à última atualização de uma pauta que já está no feed;
- "novos_relatos": por pauta, as manchetes das últimas horas posteriores à última atualização dela
  (quantas, de quantos veículos, a mais nova, se a pauta é principal e há quantas horas está parada).
"acionar" (regra em REGRA, abaixo) + "acionar_motivo" + "acionar_itens": diz à rodada rápida do Claude se vale
rodar e por onde começar. Lê também oficiais.json (dados públicos, tools/oficiais.py) e rodadas.json (para não
acionar de novo pelo que uma rodada já viu). Se "acionar" for false, a rodada encerra sem gastar quase nada.
"""
import email.utils, json, os, re, sys, unicodedata, urllib.request
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
    ("agsenado", "Agência Senado", "https://www12.senado.leg.br/noticias/feed/todasnoticias/rss", "politica"),
    ("agcamara", "Agência Câmara", "https://www.camara.leg.br/noticias/rss/ultimas-noticias", "politica"),
]
# veículos cujas fotos têm licença livre (com crédito): podem ilustrar o Prumo
LIVRES = {"ab": "Agência Brasil", "agsenado": "Agência Senado", "agcamara": "Agência Câmara"}

STOP = set("""a o as os um uma uns umas de da do das dos dar em na no nas nos num numa por pela pelo pelas pelos para pra
com sem sob sobre entre ate apos e ou mas que se sua seu suas seus ao aos à às é ser foi sao são está esta estao diz dizem
vai vao apos após contra como mais menos muito ja já nao não sim tem têm ter há ha isso essa esse este esta pode podem
depois antes ainda onde quando quem qual quais ele ela eles elas lhe seja sido ate veja video vídeo ao-vivo hoje ontem
amanha amanhã novo nova novos novas ano anos dia dias diz após feira segunda terca quarta quinta sexta sabado domingo
janeiro fevereiro marco abril maio junho julho agosto setembro outubro novembro dezembro videos assista confira""".split())


def norm(s):
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()


def tokens(s):
    # números curtos (dia do mês, placar) e anos ligavam manchetes sem relação ("terça (3)", "novembro de 2026")
    return {t for t in re.findall(r"[a-z0-9]+", norm(s))
            if len(t) >= 3 and t not in STOP and not re.fullmatch(r"(19|20)\d\d|\d{1,2}", t)}


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
        img, cred = "", ""
        for c in it.iter():
            nm = c.tag.split("}")[-1]
            if nm == "enclosure" and str(c.get("type", "")).startswith("image") and c.get("url"): img = img or c.get("url")
            elif nm in ("content", "thumbnail") and c.get("url") and (c.get("medium") in (None, "image") or nm == "thumbnail"): img = img or c.get("url")
            elif nm == "credit" and (c.text or "").strip(): cred = cred or c.text.strip()
        if not img:
            for k in ("encoded", "description", "summary"):
                if f.get(k) is not None and f[k].text:
                    m = re.search(r'<img[^>]+src="(https://[^"]+)"', f[k].text)
                    if m: img = m.group(1); break
        if tit and link.startswith("http"): out.append({"titulo": tit[:180], "url": link, "hora": h, "img": img, "cred": cred[:80]})
    return out


def ultima_pauta(p):
    hs = [str(p.get("hora") or "")] + [str(u.get("hora") or "") for u in p.get("atualizacoes") or [] if isinstance(u, dict)]
    hs = [h for h in hs if re.match(r"\d{4}-\d\d-\d\dT", h)]
    if not hs: return None
    try: return max(datetime.fromisoformat(h) for h in hs)
    except Exception: return None


def iso(s):
    try:
        d = datetime.fromisoformat(str(s))
        return d if d.tzinfo else d.replace(tzinfo=SP)
    except Exception:
        return None


# ---------- regra do "acionar" (desde 03/11) ----------
# Um assunto aciona a rodada quando JANELA_MIN minutos concentram veículos diferentes suficientes:
# pontos = nº de veículos distintos na melhor janela × peso da seção; aciona com pontos >= LIMIAR.
# Política/Economia: 3 veículos; Brasil/Mundo: 4; Educação/sem seção: 5; Esportes: 6. Lixo nunca aciona.
JANELA_MIN = 90
LIMIAR = 3.0
PESO = {"politica": 1.0, "economia": 1.0, "brasil": 0.75, "mundo": 0.75, "educacao": 0.6, "esportes": 0.5, None: 0.6}
DEFASADA_H = 3      # pauta principal sem atualização há 3 h ou mais + relatos de 2+ veículos => aciona
N_PRINCIPAIS = 8    # as 8 pautas de maior prioridade
REGRA = ("acionar = (a) assunto novo ou pauta com 3+ veículos em 90 min (peso por seção: Política/Economia 3, "
         "Brasil/Mundo 4, Educação 5, Esportes 6; sem lixo), (b) pauta principal parada há 3 h+ com relatos novos "
         "de 2+ veículos, ou (c) dado oficial novo (oficiais.json); itens que uma rodada já viu só voltam se "
         "ganharem 2+ veículos ou se a pauta for atualizada depois")

LIXO = re.compile(
    r"horoscopo|\bsignos?\b|\btaro\b|\bbbb\b|big brother|\ba fazenda \d|\bpeo(es|a)\b|\breality|\bnovela|\bfamosos|celebridade|"
    r"influenciador|mega-sena|mega da virada|lotofacil|\bquina\b|loteria|\bpalpites?\b|onde assistir|escalac|"
    r"\bodds\b|\bcupo[mn]|black friday|\bpromoca|\bofertas?\b|^videos?\b|ao vivo$|^ao vivo\b|^assista|"
    r"\bbom dia (df|sp|rio|brasil|[a-z]+) de\b|renda fixa hoje|\bconfira as taxas|receita de\b|^podcast|"
    r"newsletter|\beptv\b|\bem 1 minuto\b|previsao do tempo|\bquiz\b|\bcruzadinha")

KW = {
    "politica": set("""lula bolsonaro flavio senado senador senadora senadores camara deputado deputada deputados congresso
        stf moraes ministro ministra governo planalto pec tse alcolumbre motta partido cpi pgr impeachment cassacao
        janja alckmin gilmar dino fux zanin mendonca eleicao eleito reeleito psol mdb uniao centrao""".split()),
    "economia": set("""dolar ibovespa bolsa selic copom juros inflacao ipca pib petrobras fazenda haddad durigan imposto
        impostos tributaria tarifa tarifas mercado fiscal arrecadacao desemprego focus cdb investimento acoes b3
        credito divida orcamento gasolina combustivel salario inss aposentadoria fgts bets""".split()),
    "esportes": set("""futebol gol gols rodada brasileirao libertadores sulamericana campeonato tecnico atacante goleiro
        zagueiro jogador jogadora partida clube flamengo palmeiras corinthians santos vasco gremio cruzeiro
        botafogo fluminense bahia fortaleza bragantino coritiba selecao ancelotti neymar nba formula tenis ufc""".split()),
    "mundo": set("""eua trump israel ira irao iraniano iraniana ucrania russia putin china gaza hamas netanyahu europa
        franca argentina milei venezuela maduro otan onu papa alemanha japao coreia mexico india""".split()),
}


def lixo(titulo):
    return bool(LIXO.search(norm(titulo)))


def secao_de(its, pauta_sec=None):
    """Seção do assunto: palavras-chave fortes (2+), senão a seção dos feeds de origem, senão a da pauta."""
    tk = set().union(*[x["tk"] for x in its]) if its else set()
    hits = sorted(((len(tk & kw), s) for s, kw in KW.items()), reverse=True)
    if hits[0][0] >= 2 and hits[0][0] > hits[1][0]: return hits[0][1]
    secs = [x["secao"] for x in its if x.get("secao")]
    if secs: return max(set(secs), key=secs.count)
    if hits[0][0] >= 1 and hits[0][0] > hits[1][0]: return hits[0][1]
    return pauta_sec


def janela(its, minutos=JANELA_MIN):
    """(máximo de veículos distintos dentro de uma janela de N minutos, início dessa janela)."""
    its = sorted(its, key=lambda x: x["hora"])
    best, ini = 0, None
    for i, a in enumerate(its):
        fs = {b["fonte"] for b in its[i:] if b["hora"] - a["hora"] <= timedelta(minutes=minutos)}
        if len(fs) > best: best, ini = len(fs), a["hora"]
    return best, ini


def parecido(a, b):
    inter = len(a & b)
    return inter >= 3 or (inter >= 2 and inter / max(1, min(len(a), len(b))) >= 0.5)


def hm(d):
    return d.strftime("%d/%m %Hh%M") if d else ""


def ultima_rodada(feed, rodadas):
    """Início da última rodada do Claude (rodadas.json) ou a última publicação do feed, o que for mais novo."""
    cands = [iso(feed.get("atualizado_em"))]
    try:
        dia = rodadas.get("dia")
        for k, r in (rodadas.get("itens") or {}).items():
            if isinstance(r, dict) and r.get("tipo") in ("completa", "rapida") and re.match(r"\d\dh\d\d$", k):
                cands.append(datetime.fromisoformat(f"{dia}T{k[:2]}:{k[3:]}:00-03:00"))
    except Exception:
        pass
    cands = [c for c in cands if c]
    return max(cands) if cands else None


def analisar(itens_todos, feed, agora, horas=6, anterior=None, oficiais=None, rodadas=None, fotos=()):
    """Toda a lógica sem rede (testável). itens_todos: [{titulo,url,hora(datetime),fonte,veiculo,secao,tk}]."""
    anterior, oficiais, rodadas = anterior or {}, oficiais or {}, rodadas or {}
    ref = iso(feed.get("atualizado_em")) or agora - timedelta(hours=horas)
    desde = max(ref, agora - timedelta(hours=horas)) - timedelta(minutes=10)
    limite6h = agora - timedelta(hours=horas) - timedelta(minutes=10)
    todos = [x for x in itens_todos if x["hora"] and x["hora"] >= limite6h and x["hora"] <= agora + timedelta(minutes=5)]
    itens = [x for x in todos if x["hora"] >= desde]

    # o que já é pauta (título, tema e tag) e o que já é breve
    pautas, sec_p, prio, tema_tk = [], {}, {}, {}
    for p in feed.get("pautas") or []:
        tk = tokens(" ".join(str(p.get(k) or "") for k in ("tema", "tag")) + " " + str((p.get("neutro") or {}).get("titulo") or ""))
        pautas.append((p.get("id"), p.get("secao"), tk, ultima_pauta(p)))
        tema_tk[p.get("id")] = tokens(p.get("tema"))
        sec_p[p.get("id")] = p.get("secao"); prio[p.get("id")] = p.get("prioridade") or 0
    ult_p = {pid: ult for pid, _, _, ult in pautas}
    principais = set(sorted(prio, key=lambda k: -prio[k])[:N_PRINCIPAIS])
    breves = [tokens(b.get("titulo")) for b in feed.get("breves") or [] if isinstance(b, dict)]

    def pauta_de(tk):
        best, sc = None, 0.0
        for pid, sec, ptk, ult in pautas:
            if not tk or not ptk: continue
            inter = len(tk & ptk)
            s = inter / min(len(tk), len(ptk))
            # o tema da pauta (nome estável: "Caso Master", "Mercado", "PEC da Segurança") inteiro na manchete
            if inter >= 2 and tema_tk.get(pid) and tema_tk[pid] <= tk: s = max(s, 0.6)
            if inter >= 2 and s > sc: best, sc = (pid, sec, ult), s
        return best if sc >= 0.5 else None

    for x in todos:
        x["lixo"] = lixo(x["titulo"])
        pp = pauta_de(x["tk"])
        x["pid"] = pp[0] if pp else None

    # agrupa manchetes parecidas (ligação simples, comparando com até 8 manchetes do grupo)
    grupos = []
    for x in sorted(itens, key=lambda x: x["hora"]):
        alvo = None
        for g in grupos:
            if any(parecido(x["tk"], m["tk"]) for m in g["itens"][:8]):
                alvo = g; break
        if alvo is None:
            alvo = {"tk": set(), "itens": []}; grupos.append(alvo)
        alvo["itens"].append(x); alvo["tk"] |= x["tk"]

    def lista_de(its, n=4):
        return [{"veiculo": x["veiculo"], "titulo": x["titulo"], "url": x["url"], "hora": hm(x["hora"])}
                for x in sorted(its, key=lambda x: x["hora"], reverse=True)[:n]]

    novos, em_pautas, cands = [], {}, []
    for g in grupos:
        fontes = sorted({x["fonte"] for x in g["itens"]})
        pids = [x["pid"] for x in g["itens"] if x["pid"]]
        pid = max(set(pids), key=pids.count) if pids else None
        if pid and not (pids.count(pid) * 2 >= len(g["itens"]) or pids.count(pid) >= 2): pid = None
        lista = lista_de(g["itens"])
        if pid:
            ult = ult_p.get(pid)
            depois = [x for x in g["itens"] if not ult or x["hora"] > ult]
            if depois:
                e = em_pautas.setdefault(pid, {"secao": sec_p.get(pid), "n_fontes": 0, "manchetes": []})
                e["n_fontes"] = max(e["n_fontes"], len({x["fonte"] for x in depois}))
                e["manchetes"] += [m for m in lista if m["titulo"] not in {y["titulo"] for y in e["manchetes"]}][:4]
            continue
        breve = any(len(g["tk"] & b) >= 3 for b in breves)
        eh_lixo = sum(x["lixo"] for x in g["itens"]) * 2 >= len(g["itens"])
        sec = secao_de(g["itens"])
        nj, ini = janela([x for x in g["itens"] if not x["lixo"]])
        pontos = nj * PESO.get(sec, PESO[None])
        novo = {"assunto": lista[0]["titulo"], "secao": sec, "n_fontes": len(fontes), "fontes": fontes,
                "ja_e_breve": breve, "relevante": len(fontes) >= 3 and not breve and not eh_lixo, "manchetes": lista,
                "n_fontes_90min": nj}
        if eh_lixo: novo["lixo"] = True
        novos.append(novo)
        if not eh_lixo and not breve and pontos >= LIMIAR:
            cands.append({"tipo": "novo", "titulo": lista[0]["titulo"], "secao": sec, "n_fontes": len(fontes),
                          "motivo": f"assunto novo: {nj} veículos em {JANELA_MIN} min ({sec or 'sem seção'})",
                          "chave": sorted(g["tk"])[:40], "_pontos": pontos})
    novos.sort(key=lambda g: (-g["relevante"], -g["n_fontes"], g["assunto"]))

    # 1C: novos relatos por pauta (manchetes das últimas horas posteriores à última atualização da pauta)
    novos_relatos = {}
    for pid in ult_p:
        ult = ult_p[pid]
        rel = [x for x in todos if x["pid"] == pid and not x["lixo"] and (not ult or x["hora"] > ult)]
        if not rel: continue
        fs = sorted({x["fonte"] for x in rel})
        mais_nova = max(x["hora"] for x in rel)
        defas = round((agora - ult).total_seconds() / 3600, 1) if ult else None
        nj, _ = janela(rel)
        novos_relatos[pid] = {"n": len(rel), "n_fontes": len(fs), "fontes": fs, "n_fontes_90min": nj,
                              "ultima": hm(mais_nova), "ultima_iso": mais_nova.isoformat(timespec="minutes"),
                              "pauta_atualizada_em": ult.isoformat(timespec="minutes") if ult else None,
                              "horas_sem_atualizar": defas, "principal": pid in principais,
                              "manchetes": lista_de(rel, 6)}
        pontos = nj * PESO.get(sec_p.get(pid), PESO[None])
        motivo = None
        if pontos >= LIMIAR:
            motivo = f"pauta {pid}: {nj} veículos em {JANELA_MIN} min depois da última atualização"
        elif pid in principais and defas is not None and defas >= DEFASADA_H and len(fs) >= 2:
            motivo = f"pauta principal {pid} sem atualização há {defas:g} h e {len(fs)} veículos com relatos novos"
        if motivo:
            cands.append({"tipo": "pauta", "pid": pid, "titulo": max(rel, key=lambda x: x["hora"])["titulo"], "n_fontes": len(fs), "motivo": motivo,
                          "_pontos": pontos + (2 if pid in principais else 0)})

    # 1B: dado oficial novo (oficiais.json, gravado pelo robô de dados públicos)
    for ev in oficiais.get("eventos") or []:
        if not isinstance(ev, dict) or not ev.get("acionar") or ev.get("ja_no_feed"): continue
        pv = iso(ev.get("primeiro_visto"))
        if not pv or pv < agora - timedelta(hours=horas): continue
        cands.append({"tipo": "oficial", "id": ev.get("id"), "pid": ev.get("pid"), "titulo": ev.get("fato"),
                      "motivo": f"dado oficial ({ev.get('fonte')}): {ev.get('fato')}", "_pontos": 10})

    # o que uma rodada já viu não aciona de novo (a não ser que cresça 2+ veículos)
    u_rod = ultima_rodada(feed, rodadas)
    av = [a for a in anterior.get("avaliados") or [] if isinstance(a, dict) and (iso(a.get("em")) or agora) >= agora - timedelta(hours=12)]
    g_ant = iso(anterior.get("gerado"))
    if g_ant and u_rod and g_ant <= u_rod:
        for it in anterior.get("acionar_itens") or []:
            if isinstance(it, dict):
                av.append({k: it.get(k) for k in ("tipo", "pid", "id", "chave", "n_fontes")} | {"em": anterior.get("gerado")})
    vistos, avaliados = set(), []
    for a in av:
        k = json.dumps([a.get("tipo"), a.get("pid"), a.get("id"), a.get("chave"), a.get("n_fontes")], ensure_ascii=False)
        if k not in vistos: vistos.add(k); avaliados.append(a)
    avaliados = avaliados[-80:]

    def ja_visto(c):
        for a in avaliados:
            if a.get("tipo") != c["tipo"]: continue
            if c["tipo"] == "oficial" and a.get("id") == c.get("id"): return True
            if c["tipo"] == "pauta" and a.get("pid") == c.get("pid"):
                # a pauta foi atualizada depois dessa avaliação: os relatos contados agora são outros (posteriores
                # à atualização), então a memória antiga não vale (antes, 5 veículos às 13h barravam 3 novos às 16h)
                ult, em = ult_p.get(c.get("pid")), iso(a.get("em"))
                if ult and em and ult > em: continue
                if c["n_fontes"] < (a.get("n_fontes") or 0) + 2: return True
            if c["tipo"] == "novo" and parecido(set(c["chave"]), set(a.get("chave") or [])) and c["n_fontes"] < (a.get("n_fontes") or 0) + 2: return True
        return False

    ativos = [c for c in cands if not ja_visto(c)]
    ja_av = len(cands) - len(ativos)
    ativos.sort(key=lambda c: -c["_pontos"])
    for c in ativos: c.pop("_pontos", None)
    if ativos:
        motivo = "; ".join(c["motivo"] for c in ativos[:3]) + (f" (+{len(ativos) - 3})" if len(ativos) > 3 else "")
    else:
        motivo = f"nada novo que acione ({len(novos)} assuntos fora do feed, {len(novos_relatos)} pautas com relatos" + \
                 (f", {ja_av} já vistos por uma rodada" if ja_av else "") + ")"

    # fotos livres: sugere a pauta do mesmo assunto
    vistas, fl = set(), []
    for x in fotos:
        if x["img"] in vistas: continue
        vistas.add(x["img"]); x = dict(x); pp = pauta_de(x.pop("tk"))
        x["pid_sugerido"] = pp[0] if pp else None
        fl.append(x)
    relevantes = sum(1 for g in novos if g["relevante"])
    pautas_2 = sum(1 for e in em_pautas.values() if e["n_fontes"] >= 3)
    return {"gerado": agora.isoformat(timespec="minutes"), "desde": desde.isoformat(timespec="minutes"),
            "feed_atualizado_em": feed.get("atualizado_em"),
            "resumo": {"manchetes": len(itens), "assuntos_novos_relevantes": relevantes, "assuntos_novos": len(novos),
                       "pautas_com_novidade": len(em_pautas), "pautas_com_novidade_3_fontes": pautas_2,
                       "pautas_com_relatos": len(novos_relatos), "acionar_itens": len(ativos), "ja_avaliados": ja_av},
            "acionar": bool(ativos), "acionar_motivo": motivo, "acionar_itens": ativos[:12], "regra": REGRA,
            "novos": novos[:30], "em_pautas": em_pautas, "novos_relatos": novos_relatos,
            "fotos_livres": fl[:40], "avaliados": avaliados,
            "ultima_rodada": u_rod.isoformat(timespec="minutes") if u_rod else None}


def coletar(agora, horas):
    """Lê os RSS (rede). Devolve (itens das últimas horas, fotos livres, status por fonte)."""
    limite = agora - timedelta(hours=horas) - timedelta(minutes=10)
    status, itens, vistos, fotos = {}, [], set(), []
    for chave, nome, url, sec in FONTES:
        try:
            lst = ler(url)
            if chave in LIVRES:
                for x in lst:
                    im = x.get("img", "")
                    if im.startswith("https://") and "logo" not in im.lower() and "jsdelivr" not in im and re.search(r"\.(jpe?g|png|webp)(\?|$)", im, re.I):
                        fotos.append({"veiculo": LIVRES[chave], "titulo": x["titulo"], "materia": x["url"], "img": x["img"],
                                      "credito": (f"Foto: {x['cred']}/{LIVRES[chave]}" if x.get("cred") else f"Foto: {LIVRES[chave]}"),
                                      "hora": x["hora"].strftime("%d/%m %Hh%M") if x["hora"] else "", "tk": tokens(x["titulo"])})
            novos = [x for x in lst if x["hora"] and x["hora"] >= limite]
            status[nome] = f"ok: {len(lst)} itens, {len(novos)} nas últimas {horas:g} h"
            for x in novos:
                if x["url"] in vistos: continue
                vistos.add(x["url"])
                itens.append({**x, "fonte": chave, "veiculo": nome, "secao": sec, "tk": tokens(x["titulo"])})
        except Exception as e:
            status[nome] = "falhou: " + repr(e)[:100]
    return itens, fotos, status


def ler_json(caminho):
    try:
        with open(caminho, encoding="utf-8") as fh: return json.load(fh)
    except Exception:
        return {}


def main(argv):
    horas = 6
    if "--horas" in argv:
        i = argv.index("--horas"); horas = float(argv[i + 1]); argv = argv[:i] + argv[i + 2:]
    if len(argv) < 2: print(__doc__); return 2
    feed = json.load(open(argv[0], encoding="utf-8"))
    pasta = os.path.dirname(os.path.abspath(argv[0]))
    agora = datetime.now(SP)
    anterior = ler_json(argv[1])
    oficiais = ler_json(os.path.join(pasta, "oficiais.json"))
    rodadas = ler_json(os.path.join(pasta, "rodadas.json"))
    itens, fotos, status = coletar(agora, horas)
    if status and all(v.startswith("falhou") for v in status.values()) and anterior:
        print("nenhum veículo respondeu: mantém o novidades.json anterior")
        for k, v in status.items(): print(f"  {k}: {v}")
        return 0
    out = analisar(itens, feed, agora, horas, anterior, oficiais, rodadas, fotos)
    out["fontes"] = status
    with open(argv[1], "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    fl = out["fotos_livres"]
    print(json.dumps(out["resumo"], ensure_ascii=False), "acionar =", out["acionar"], f"· fotos livres: {len(fl)} ({sum(1 for x in fl if x['pid_sugerido'])} com pauta)")
    print("motivo:", out["acionar_motivo"])
    for k, v in status.items(): print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
