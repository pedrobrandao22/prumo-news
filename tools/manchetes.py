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
Desde 18/11 cada item do acionar traz "acao" ("atualiza: <pid>" ou "nova") e os assuntos novos trazem
"pid_provavel" quando parecem continuação de uma cobertura do feed: a rodada não decide sozinha entre breve e notícia.
"""
import email.utils, html, json, os, re, sys, unicodedata, urllib.request
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
    # 20/11: mais veículos (grandes jornais e veículos de direita e de esquerda), para o "acionar" ver mais assuntos e as
    # versões Direita/Esquerda terem em que se apoiar. Cada veículo conta uma vez só (a chave), mesmo com vários feeds.
    ("estadao", "Estadão Política", "https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/politica/", "politica"),
    ("estadao", "Estadão Economia", "https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/economia/", "economia"),
    ("estadao", "Estadão Brasil", "https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/brasil/", "brasil"),
    ("estadao", "Estadão Internacional", "https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/internacional/", "mundo"),
    ("oglobo", "O Globo", "https://oglobo.globo.com/rss/oglobo", None),
    ("valor", "Valor Econômico", "https://valor.globo.com/rss/valor", None),  # o feed geral do Valor traz Mundo e Brasil também
    ("ex", "Exame", "https://exame.com/feed/", None),
    ("veja", "Veja", "https://veja.abril.com.br/feed/", None),
    ("nexo", "Nexo", "https://www.nexojornal.com.br/rss.xml", None),
    ("dw", "DW Brasil", "https://rss.dw.com/rdf/rss-br-all", "mundo"),
    ("gp", "Gazeta do Povo República", "https://www.gazetadopovo.com.br/feed/rss/republica.xml", "politica"),
    ("gp", "Gazeta do Povo Economia", "https://www.gazetadopovo.com.br/feed/rss/economia.xml", "economia"),
    ("oeste", "Revista Oeste", "https://revistaoeste.com/feed/", None),
    ("jp", "Jovem Pan", "https://jovempan.com.br/feed", None),
    ("antag", "O Antagonista", "https://oantagonista.com.br/feed/", None),
    ("cc", "CartaCapital", "https://www.cartacapital.com.br/feed/", None),
    ("bdf", "Brasil de Fato", "https://www.brasildefato.com.br/feed/", None),
    ("icl", "ICL Notícias", "https://iclnoticias.com.br/feed/", None),
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
        if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)  # "-0000" do RFC 2822 é UTC
    except Exception:
        try: d = datetime.fromisoformat(txt.replace("Z", "+00:00"))
        except Exception: return None
        if d.tzinfo is None: d = d.replace(tzinfo=SP)  # ISO sem fuso (Exame): é a hora de Brasília
    return d.astimezone(SP)


def declarar_prefixos(bruto):
    """Feed que usa um prefixo sem declarar (Revista Oeste usa "media:" sem xmlns:media): declara na raiz e tenta de novo."""
    txt = bruto.decode("utf-8", "replace")
    usados = set(re.findall(r"</?([A-Za-z][\w.-]*):[A-Za-z]", txt)) | set(re.findall(r"\s([A-Za-z][\w.-]*):[A-Za-z][\w.-]*=", txt))
    falta = [p for p in sorted(usados) if p not in ("xml", "xmlns") and f"xmlns:{p}=" not in txt]
    if not falta: return bruto
    m = re.search(r"<(rss|feed|rdf:RDF)\b", txt)
    if not m: return bruto
    decl = "".join(f' xmlns:{p}="urn:prumo:{p}"' for p in falta)
    return (txt[:m.end()] + decl + txt[m.end():]).encode("utf-8")


def ler(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        bruto = r.read()
    try:
        raiz = ET.fromstring(bruto)
    except ET.ParseError:
        raiz = ET.fromstring(declarar_prefixos(bruto))
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
         "ganharem 2+ veículos ou se a pauta for atualizada depois; assunto que já é breve também aciona (18/11). "
         "Cada item traz acao: 'atualiza: <pid>' (update_add) ou 'nova' (add_pauta), nunca breve")

LIXO = re.compile(
    r"horoscopo|\bsignos?\b|\btaro\b|\bbbb\b|big brother|\ba fazenda \d|\bpeo(es|a)\b|\breality|\bnovela|\bfamosos|celebridade|"
    r"influenciador|mega-sena|mega da virada|lotofacil|\bquina\b|loteria|\bpalpites?\b|onde assistir|escalac|"
    r"\bodds\b|\bcupo[mn]|black friday|\bpromoca|\bofertas?\b|^videos?\b|ao vivo$|^ao vivo\b|^assista|"
    r"\bbom dia (df|sp|rio|brasil|[a-z]+) de\b|renda fixa hoje|\bconfira as taxas|receita de\b|^podcast|"
    r"newsletter|\beptv\b|\bem 1 minuto\b|previsao do tempo|\bquiz\b|\bcruzadinha|"
    # 19/11 (testador): episódio de podcast virava "Acabou de sair" ("... - O Assunto #1849")
    r"\bpodcast\b|\bepisodio\b|\bo assunto #|\s#\d{2,}\s*$")

KW = {
    "politica": set("""lula bolsonaro flavio senado senador senadora senadores camara deputado deputada deputados congresso
        stf moraes ministro ministra governo planalto pec tse alcolumbre motta partido cpi pgr impeachment cassacao
        janja alckmin gilmar dino fux zanin mendonca eleicao eleito reeleito psol mdb uniao centrao fachin barroso toffoli
        stj anistia""".split()),
    "economia": set("""dolar ibovespa bolsa selic copom juros inflacao ipca pib petrobras fazenda haddad durigan imposto
        impostos tributaria tarifa tarifas mercado fiscal arrecadacao desemprego focus cdb investimento acoes b3
        credito divida orcamento gasolina combustivel salario inss aposentadoria fgts bets""".split()),
    "esportes": set("""futebol gol gols rodada brasileirao libertadores sulamericana campeonato tecnico atacante goleiro
        zagueiro jogador jogadora partida clube flamengo palmeiras corinthians santos vasco gremio cruzeiro
        botafogo fluminense bahia fortaleza bragantino coritiba selecao ancelotti neymar nba formula tenis ufc""".split()),
    "mundo": set("""eua trump israel ira irao iraniano iraniana ucrania russia putin china gaza hamas netanyahu europa
        franca argentina milei venezuela maduro otan onu papa alemanha japao coreia mexico india arabia saudita houthis
        iemen libano siria brexit reino unido londres paris cop cop30 cop31 clima climatica climaticas
        fosseis erdogan turquia""".split()),
    # 20/11: com mais veículos, o "palpite" de seção do feed (InfoMoney = economia) pesava em assunto de outra área
    "educacao": set("""enem fuvest vestibular mec escola escolas universidade universidades professores professor alunos
        estudantes sisu prouni fies ensino creche""".split()),
    "brasil": set("""defesa civil temporal tempestade chuva chuvas enchente alagamento ciclone tiroteio policia policial
        operacao incendio acidente mortes mortos desabamento assassinato assassinada assassinado feminicidio crime
        presa preso presos suspeito suspeitos delegado homicidio matar matou morte morta morto vitima vitimas facadas
        estupro esfaqueado baleado baleada sequestro latrocinio""".split()),
}


BREVES_ALVO = 12  # 20/11: abaixo disso a rodada rápida repõe breves (até 4 por rodada)


def lixo(titulo):
    return bool(LIXO.search(norm(titulo)))


def secao_de(its, pauta_sec=None):
    """Seção do assunto, pelo assunto e não pelo veículo (causa acabou-de-sair-editoria, 20/11 noite).

    1) palavras-chave fortes (2+ e sem empate) decidem;
    2) a seção do feed de origem (ge = esportes, InfoMoney = economia...) é só um PALPITE: vale quando o título tem ao
       menos uma palavra daquela seção, ou quando mais da metade das manchetes do grupo veio de feeds daquela seção e
       nenhuma outra seção tem palavra no título. Antes o palpite valia sozinho: um único item do ge ou do InfoMoney
       num grupo de veículos gerais punha crime em Esportes, Zumbi e COP31 em Economia, decisão do STF em Economia;
    3) uma palavra-chave só (sem empate);
    4) a seção da pauta; senão nenhuma (o app mostra o assunto sem editoria, melhor que editoria errada)."""
    tk = set().union(*[x["tk"] for x in its]) if its else set()
    hits = sorted(((len(tk & kw), s) for s, kw in KW.items()), reverse=True)
    if hits[0][0] >= 2 and hits[0][0] > hits[1][0]: return hits[0][1]
    por = dict((s, n) for n, s in hits)
    secs = [x["secao"] for x in its if x.get("secao")]
    if secs:
        palpite = max(sorted(set(secs)), key=secs.count)
        outras = any(n >= 1 for s, n in por.items() if s != palpite)
        if por.get(palpite, 0) >= 1 or (secs.count(palpite) * 2 > len(its) and not outras):
            return palpite
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


def casa_pauta(tk, ptk, ttk=None):
    """18/11: quanto um título (palavras tk) parece fato da pauta (palavras de tema, tag e título: ptk; ttk = do tema).
    0 = não casa; >= 0.35 = casa. 2 palavras em comum só valem com metade das palavras ou o tema inteiro; 3+ com 35%.
    Usada aqui (pid_provavel) e no validar.py (breve que é fato de cobertura)."""
    inter = len(tk & ptk)
    if inter < 2: return 0.0
    s = inter / min(len(tk), len(ptk))
    if ttk and len(ttk) >= 2 and ttk <= tk: s = max(s, 0.6)
    return s if (inter >= 3 or s >= 0.5) else 0.0


def acao_de(c):
    """18/11: o que a rodada faz com cada item do acionar, já decidido aqui (a rodada confere o fato e executa).
    Nunca "breve": o que aciona tem veículos bastantes para ser notícia."""
    pid = c.get("pid") or c.get("pid_provavel")
    if pid: return f"atualiza: {pid}" + ("" if c.get("pid") else " (provável; confira que é o mesmo assunto)")
    return "nova" + (" (e tire a breve do mesmo assunto)" if c.get("ja_e_breve") else "")


def analisar(itens_todos, feed, agora, horas=6, anterior=None, oficiais=None, rodadas=None, fotos=()):
    """Toda a lógica sem rede (testável). itens_todos: [{titulo,url,hora(datetime),fonte,veiculo,secao,tk}]."""
    anterior, oficiais, rodadas = anterior or {}, oficiais or {}, rodadas or {}
    ref = iso(feed.get("atualizado_em")) or agora - timedelta(hours=horas)
    desde = max(ref, agora - timedelta(hours=horas)) - timedelta(minutes=10)
    limite6h = agora - timedelta(hours=horas) - timedelta(minutes=10)
    todos = [x for x in itens_todos if x["hora"] and x["hora"] >= limite6h and x["hora"] <= agora + timedelta(minutes=5)]
    itens = [x for x in todos if x["hora"] >= desde]

    # o que já é pauta (título, tema e tag) e o que já é breve
    pautas, sec_p, prio, tema_tk, ativas = [], {}, {}, {}, set()
    for p in feed.get("pautas") or []:
        if p.get("status") != "encerrada": ativas.add(p.get("id"))
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
            # cobertura encerrada não recebe atualização: fato novo do tema é assunto novo (manual 2b, FIM; 18/11)
            if not tk or not ptk or pid not in ativas: continue
            inter = len(tk & ptk)
            s = inter / min(len(tk), len(ptk))
            # o tema da pauta (nome estável: "Caso Master", "Mercado", "PEC da Segurança") inteiro na manchete
            if inter >= 2 and tema_tk.get(pid) and tema_tk[pid] <= tk: s = max(s, 0.6)
            if inter >= 2 and s > sc: best, sc = (pid, sec, ult), s
        return best if sc >= 0.5 else None

    def pauta_provavel(gtk):
        """18/11: cobertura provável de um assunto "novo" (o grupo inteiro, não manchete a manchete). Só cobertura ativa."""
        sc = [(casa_pauta(gtk, ptk, tema_tk.get(pid)), pid) for pid, sec, ptk, ult in pautas if pid in ativas]
        sc = [x for x in sc if x[0] >= 0.35]
        return max(sc)[1] if sc else None

    for x in todos:
        x["lixo"] = lixo(x["titulo"])
        pp = pauta_de(x["tk"])
        x["pid"] = pp[0] if pp else None

    # agrupa manchetes parecidas (ligação simples, comparando com até 8 manchetes do grupo)
    grupos = []
    for x in sorted(itens, key=lambda x: x["hora"]):
        alvo = None
        for g in grupos:
            # 19/11: parecer com pelo menos metade do grupo (antes bastava 1: um jogo puxava outro em corrente)
            am = g["itens"][:8]
            if sum(1 for m in am if parecido(x["tk"], m["tk"])) * 2 >= len(am):
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
        # 18/11: assunto que já é breve continua relevante e acionando (antes a breve o calava: o fato da tarde
        # entrava como breve e nunca mais voltava, mesmo com 5 veículos)
        novo = {"assunto": lista[0]["titulo"], "secao": sec, "n_fontes": len(fontes), "fontes": fontes,
                "ja_e_breve": breve, "relevante": len(fontes) >= 3 and not eh_lixo, "manchetes": lista,
                "n_fontes_90min": nj, "ultima_iso": max(x["hora"] for x in g["itens"]).isoformat(timespec="minutes")}
        prov = None if eh_lixo else pauta_provavel(g["tk"])
        if prov: novo["pid_provavel"] = prov
        if eh_lixo: novo["lixo"] = True
        novos.append(novo)
        if not eh_lixo and pontos >= LIMIAR:
            c = {"tipo": "novo", "titulo": lista[0]["titulo"], "secao": sec, "n_fontes": len(fontes),
                 "motivo": f"assunto novo: {nj} veículos em {JANELA_MIN} min ({sec or 'sem seção'})" + (" — hoje só breve" if breve else ""),
                 "chave": sorted(g["tk"])[:40], "_pontos": pontos}
            if prov: c["pid_provavel"] = prov
            if breve: c["ja_e_breve"] = True
            cands.append(c)
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
    for c in ativos:
        c.pop("_pontos", None)
        c["acao"] = acao_de(c)
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
    # 20/11: breves. A edição da manhã deixava 4 a 6 breves e nenhuma rodada repunha. Sugere à rodada rápida até 8
    # assuntos que não viraram notícia: 2+ veículos diferentes, das últimas 4 h, sem lixo, que não são breve, cobertura
    # nem item do acionar (esses são notícia). A rápida escreve a breve com as palavras do Prumo, só com o que as
    # manchetes de 2 veículos dizem igual.
    tit_acionar = {norm(str(a.get("titulo") or "")) for a in ativos}
    sugeridas = []
    for g in novos:
        if g.get("lixo") or g["ja_e_breve"] or g.get("pid_provavel") or g["n_fontes"] < 2 or not g["secao"]: continue
        if norm(g["assunto"]) in tit_acionar: continue
        if iso(g.get("ultima_iso")) and iso(g["ultima_iso"]) < agora - timedelta(hours=4): continue
        sugeridas.append({"assunto": g["assunto"], "secao": g["secao"], "n_fontes": g["n_fontes"], "manchetes": g["manchetes"]})
    n_breves = len(breves)
    pautas_2 = sum(1 for e in em_pautas.values() if e["n_fontes"] >= 3)
    return {"gerado": agora.isoformat(timespec="minutes"), "desde": desde.isoformat(timespec="minutes"),
            "feed_atualizado_em": feed.get("atualizado_em"),
            "resumo": {"manchetes": len(itens), "assuntos_novos_relevantes": relevantes, "assuntos_novos": len(novos),
                       "pautas_com_novidade": len(em_pautas), "pautas_com_novidade_3_fontes": pautas_2,
                       "pautas_com_relatos": len(novos_relatos), "acionar_itens": len(ativos), "ja_avaliados": ja_av},
            "acionar": bool(ativos), "acionar_motivo": motivo, "acionar_itens": ativos[:12], "regra": REGRA,
            "novos": novos[:30], "em_pautas": em_pautas, "novos_relatos": novos_relatos,
            "fotos_livres": fl[:40], "avaliados": avaliados,
            "breves_no_feed": n_breves, "breves_faltam": max(0, BREVES_ALVO - n_breves), "breves_sugeridas": sugeridas[:8],
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


def lide_de(url, tempo=10):
    """Resumo que o próprio veículo publica na página (og:description / description). Só metadado, sem baixar a matéria."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; PrumoNews/1.0; +https://prumonews.com.br)"})
    with urllib.request.urlopen(req, timeout=tempo) as r:
        h = r.read(400_000).decode("utf-8", "replace")
    for pat in (r'<meta[^>]+property=["\']og:description["\'][^>]*content=["\']([^"\']{30,})',
                r'<meta[^>]+content=["\']([^"\']{30,})["\'][^>]*property=["\']og:description',
                r'<meta[^>]+name=["\']description["\'][^>]*content=["\']([^"\']{30,})'):
        m = re.search(pat, h, re.I)
        if m: return html.unescape(m.group(1)).strip()[:400]
    return None


def anexar_manchetes(out, anterior, buscar=True):
    """20/11: o acionar dizia só o título, e a rápida gastava buscas para achar uma página (às 17h48 só confirmou 1 de 5).
    Agora cada item do acionar leva até 3 manchetes de veículos diferentes, com o link e o resumo que o próprio veículo
    publica (lide), para a rodada confirmar o fato sem procurar na web."""
    cache = {}
    for it in anterior.get("acionar_itens") or []:
        for m in (it.get("manchetes") or []) if isinstance(it, dict) else []:
            if m.get("lide"): cache[m.get("url")] = m["lide"]
    por_titulo = {g["assunto"]: g["manchetes"] for g in out.get("novos") or []}
    for it in (out.get("acionar_itens") or [])[:5]:
        lista = por_titulo.get(it.get("titulo")) if it.get("tipo") == "novo" else None
        if lista is None and it.get("pid"):
            lista = ((out.get("novos_relatos") or {}).get(it["pid"]) or {}).get("manchetes") \
                or ((out.get("em_pautas") or {}).get(it["pid"]) or {}).get("manchetes")
        escolhidas, vs = [], set()
        for m in lista or []:
            if not isinstance(m, dict) or m.get("veiculo") in vs or not str(m.get("url", "")).startswith("http"): continue
            vs.add(m.get("veiculo")); m = {k: m.get(k) for k in ("veiculo", "titulo", "url", "hora")}
            lide = cache.get(m["url"])
            if lide is None and buscar:
                try: lide = lide_de(m["url"])
                except Exception: lide = None
            if lide: m["lide"] = lide
            escolhidas.append(m)
            if len(escolhidas) == 3: break
        if escolhidas: it["manchetes"] = escolhidas


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
    anexar_manchetes(out, anterior)
    with open(argv[1], "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    fl = out["fotos_livres"]
    print(json.dumps(out["resumo"], ensure_ascii=False), "acionar =", out["acionar"], f"· fotos livres: {len(fl)} ({sum(1 for x in fl if x['pid_sugerido'])} com pauta)")
    print("motivo:", out["acionar_motivo"])
    for k, v in status.items(): print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
