#!/usr/bin/env python3
"""Páginas de compartilhamento do Prumo News, sem IA (roda no GitHub quando o feed muda).

  python3 tools/paginas.py feed.json m/

Para cada pauta grava m/<id>.html: uma página mínima com título, resumo e foto nas etiquetas Open Graph
(o que o WhatsApp mostra na prévia do link) e que leva direto à matéria no app (/#m=<id>).
Desde 16/11 grava também m/<título-da-notícia>.html (o link que o app compartilha) e m/indice.json ({id: endereço}).
O endereço pelo título é o "endereço bonito"; o m/<id>.html continua valendo para os links antigos.
Só reescreve o arquivo quando muda. Páginas de pautas que saíram ficam (o app avisa que a notícia saiu); endereços
antigos de uma notícia cujo título mudou também ficam, para nenhum link compartilhado quebrar.
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


# ---- acervo de fotos: limpeza igual à do app (fonte/app/src/js/157-fotos.js) ----
def _norm(s):
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()


def _arq(f):
    return _norm(fa_nome(f.get("url") if isinstance(f, dict) else "")).replace("_", " ")


BLOQ = ["21449400719", "iluminacao lgbtqia", "cervejas colorado", "buraco tampado da arquibancada", "fabrica da gwm brasil", "buzios - panoramio", "laboratorio de paleontologia", "bolsa de valores (17205467578)", "bolsa de valores (17391295482)", "bolsa de valores (17393276865)", "iss-32 american eva b3", "alpina b3", "casa-da-moeda", "avenida central, vendo-se", "atual centro cultural da justica federal",
        "plenario do senado (15717805622)", "plenario do senado (15687627386)", "plenario do senado (15109327665)", "vestibular.jpg",
        "ofrenda de la liga", "roda viva com senadora", "com bandeira do brasil", "conselheira tais ferraz", "arena corinthians opening",
        "allianz parque - reconhecimento facial", "tudo-o-que-voce-sempre-quis-saber", "vidpovid to be performing", "hibakujumoku",
        "northern door of the assumption cathedral", "estacao agrometeorologica", "travessia de pedestres no patio da estacao",
        # 16/11 (169): selo postal de MG na chuva da Bahia; árbitro de outro jogo na Série B
        "brasil barragem de 3 marias", "selo postal", "postage stamp", "stamp of ", "francobollo", "arbitro futebol apontando estadio",
        "carlo ancelotti 2016 icc",  # 16/11 noite (170)
        "200 anos do senado federal", "bosque campus universidade",
        "vista de goiania a partir da faculdade",
        # 20/11 (testador), igual ao FT157_BLOQ do app: taça de 2016; prédios da Paulista; Maracanã em tira
        "taca da copa sul-americana de 2016", "parque avenida building", "reflection of parque cultural paulista", "estadio do maracana - panorama"]  # 17/11 noite (172): paisagem no Fies  # 17/11 (171): promulgação de 1988 como plenário; galhos no Fies
HIST = re.compile(r"(n[uú]cleo de digitaliza|\bIMS\b|Moreira Salles|Arquivo Nacional|Gaensly|\b(?:PMDB|MDB|PSDB|PSOL|PDT|PSB)\b|\b(?:PT|PL|PP|PSD) (?:Nacional|na C[aâ]mara|no Senado)\b|Partido (?:dos|Liberal|Social|Progressista|Novo)|Uni[aã]o Brasil Nacional)", re.I)  # 19/11: também acervo de partido (foto distribuída por partido pesa contra a neutralidade)
FORA = re.compile(r"(\bEUA\b|Estados Unidos|Miami|Nova York|Nasdaq|Wall Street|\bNYSE\b|Dow Jones|S&P 500|Washington|Casa Branca|China|Shenzhen|Pequim|Apec|Asean|Filipinas|Manila|Turquia|\bCOP ?\d|Jap[aã]o|Singapura|Canad[aá]|Europa|Uni[aã]o Europeia|\bONU\b|\bG20\b|\bG7\b|Brics|[Vv]iagem|[Cc][uú]pula|exterior|Argentina|Venezuela|R[uú]ssia|Ucr[aâ]nia|Israel|Gaza|Ir[aã](?=$|[^A-Za-zÀ-ú])|Fran[cç]a|Alemanha|Reino Unido|Londres|Paris|[ÍI]ndia|Catar)")


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


FORA_ESP = re.compile(r"(Col[oô]mbia|Barranquilla|Bogot[aá]|Medell[ií]n|Uruguai|Montevid[eé]u|Paraguai|Assun[cç][aã]o|Chile|Santiago do Chile|Peru\b|Lima\b|Equador|Quito|Guayaquil|Bol[ií]via|La Paz|M[eé]xico|Arábia|Riad|Catar|Doha|Singapura|Jap[aã]o|T[oó]quio|Estados Unidos|\bEUA\b|Espanha|Madri|Portugal|Lisboa|Inglaterra|Londres|It[aá]lia|Fran[cç]a|Alemanha|Argentina|Buenos Aires|Avellaneda|La Bombonera)")


def fora(p):
    if (p.get("secao") or "politica") == "mundo": return True
    n = p.get("neutro") or {}
    if FORA.search(" · ".join(x for x in (n.get("titulo"), p.get("tema"), p.get("tag")) if isinstance(x, str))): return True
    # 169: jogo fora do Brasil (o resumo diz "em Barranquilla, na Colômbia") não usa estádio brasileiro
    return (p.get("secao") or "") == "esportes" and bool(FORA_ESP.search(" · ".join(x for x in (n.get("titulo"), p.get("subtitulo")) if isinstance(x, str))))


def pessoa_titulo(tit, A):
    best, pos, ln = None, 10**9, 0
    for x in (A.get("pessoas") or {}).values():
        if not isinstance(x, dict) or not isinstance(x.get("chaves"), list) or not isinstance(x.get("fotos"), list) or not any(fa_valida(f) for f in x["fotos"]): continue
        for k in x["chaves"]:
            if not isinstance(k, str) or not k: continue
            i = pos_palavra(tit, k)
            if i >= 0 and (i < pos or (i == pos and len(k) > ln)): best, pos, ln = x, i, len(k)
    return best


# ---- regra de 18/11 (fase 2, "foto só com confirmação forte"): igual ao app (fonte/app/src/js/187-fotos-f2.js) ----
# A foto de arquivo só entra em dois casos: (1) retrato da 1ª pessoa citada na frase principal do título; (2) foto de um
# LUGAR que a frase principal do título diz e que o NOME DO ARQUIVO da foto também diz (as duas pontas confirmam).
# Todo o resto (assunto genérico: dinheiro, escola, hospital, colheita, avião, país em cartão-postal…) fica com a
# ilustração. Lugar brasileiro não entra em notícia que acontece fora do Brasil.
# [nome, o que o título diz (regex), o que o nome do arquivo diz (sem acento, minúsculo), 1 = lugar no Brasil]
LUGARES = [
    ["Congresso", r"Congresso(?! dos EUA| americano| argentino| do Peru)|PEC|CPI|CPMI|[Pp]rojeto de lei|PL d[aoe]s?|[Rr]elatora?", r"congresso nacional|palacio do congresso", 1],
    ["Senado", r"Senado(?! dos EUA| americano)|[Ss]enador(?:a|es|as)?", r"plenario do senado|senado federal", 1],
    ["Câmara", r"Câmara(?! Municipal| de | Legislativa| dos Comuns)|[Dd]eputad[oa]s?(?! estadua| distrita)", r"camara dos deputados", 1],
    ["Planalto", r"Planalto|Presidência da República", r"planalto", 1],
    ["STF", r"STF|Supremo(?! dos EUA| americano| Tribunal de Justiça)|Kassio", r"supremo tribunal federal", 1],
    ["TSE", r"TSE|Justiça Eleitoral", r"tribunal superior eleitoral|^tse ", 1],
    ["Banco Central", r"Banco Central(?! Europeu| do Japão| da China| dos EUA| americano)|BC|Copom|Selic", r"banco central", 1],
    ["Itamaraty", r"Itamaraty", r"itamaraty", 1],
    ["Fazenda", r"Ministério da Fazenda|Fazenda", r"ministerio da fazenda", 1],
    ["MEC", r"MEC|Ministério da Educação|Enem|Inep|Fies|Sisu|ProUni|Prouni", r"ministerio da educacao", 1],
    ["Esplanada", r"Esplanada", r"esplanada", 1],
    ["B3", r"B3|Bovespa|Ibovespa|Bolsa(?! Família| de estudo| Atleta| Verde)", r"bovespa", 1],
    ["Bandeirantes", r"Palácio dos Bandeirantes|Bandeirantes", r"bandeirantes", 1],
    ["Guanabara", r"Palácio Guanabara|Guanabara", r"guanabara", 1],
    ["Maracanã", r"Maracanã", r"maracana", 1], ["Allianz Parque", r"Allianz Parque|Allianz", r"allianz", 1],
    ["Arena MRV", r"Arena MRV", r"arena mrv", 1], ["Mineirão", r"Mineirão", r"mineirao", 1],
    ["Beira-Rio", r"Beira-Rio", r"beira.rio", 1], ["São Januário", r"São Januário", r"sao januario", 1],
    ["Fonte Nova", r"Fonte Nova", r"fonte nova", 1], ["Nilton Santos", r"Nilton Santos|Engenhão", r"nilton santos", 1],
    ["Arena do Grêmio", r"Arena do Grêmio", r"arena do gremio", 1], ["Arena Corinthians", r"Arena Corinthians|Neo Química Arena", r"arena corinthians", 1],
    ["Interlagos", r"Interlagos", r"interlagos", 1], ["Ibirapuera", r"Ibirapuera", r"ibirapuera", 1],
    ["Casa Branca", r"Casa Branca", r"white house|casa branca", 0], ["Capitólio", r"Capitólio", r"capitol", 0],
    ["Parlamento Europeu", r"Parlamento Europeu", r"european parliament", 0], ["Knesset", r"Knesset", r"knesset", 0],
    ["Casa Rosada", r"Casa Rosada", r"casa rosada", 0],
    ["Tiananmen", r"Tiananmen|Praça da Paz Celestial", r"tiananmen", 0], ["União Africana", r"União Africana", r"african union", 0],
    ["Gaza", r"Gaza", r"gaza", 0]]
_LETRA = "A-Za-zÀ-ÿ0-9"
LUG_RE = [(nome, re.compile(f"(?:^|[^{_LETRA}])({tit})(?![{_LETRA}])"), re.compile(arq), br) for nome, tit, arq, br in LUGARES]


def frase_principal(tit):
    return re.split(r";|\s[—–]\s", str(tit or ""))[0]


# órgão da pessoa (18/11, meio-termo): o grupo que o acervo traz (deputado → Câmara, senador → Senado, ministro do STF →
# STF); para os retratos curados, que vêm sem cargo, esta tabela curta
ORGAO_GRUPO = {"camara": "Câmara", "senado": "Senado", "stf": "STF"}
ORGAO_NOME = {"Alexandre de Moraes": "STF", "Edson Fachin": "STF", "Gilmar Mendes": "STF", "Flávio Dino": "STF", "André Mendonça": "STF",
              "Kassio Nunes Marques": "STF", "Cármen Lúcia": "STF", "Dias Toffoli": "STF", "Luiz Fux": "STF", "Cristiano Zanin": "STF",
              "Fernando Haddad": "Fazenda", "Gabriel Galípolo": "Banco Central"}


def orgao_da_pessoa(fr, A):
    """(posição, lugar) do órgão da 1ª pessoa citada na frase principal (com ou sem retrato no acervo)."""
    best, pos, ln = None, 10**9, 0
    for nome, x in (A.get("pessoas") or {}).items():
        if not isinstance(x, dict) or not isinstance(x.get("chaves"), list): continue
        for k in x["chaves"]:
            if not isinstance(k, str) or not k: continue
            i = pos_palavra(fr, k)
            if i >= 0 and (i < pos or (i == pos and len(k) > ln)): best, pos, ln = (nome, x), i, len(k)
    if not best: return None
    org = ORGAO_GRUPO.get(best[1].get("grupo")) or ORGAO_NOME.get(best[0])
    return (pos, org) if org else None


def lugares_do_titulo(fr, A=None):
    """Lugares da frase principal do título, na ordem em que aparecem: os que o título diz e o órgão da 1ª pessoa citada."""
    out = []
    for k, (nome, rt, ra, br) in enumerate(LUG_RE):
        m = rt.search(fr)
        if m: out.append((m.start(1), k, nome, ra, br))
    og = orgao_da_pessoa(fr, A) if A else None
    if og and not any(x[2] == og[1] for x in out):
        k = next(i for i, x in enumerate(LUG_RE) if x[0] == og[1]); out.append((og[0], k) + LUG_RE[k][:1] + LUG_RE[k][2:])
    return [x[2:] for x in sorted(out)]


# jogo (18/11): estádio do mandante, o time citado primeiro em "A x B", quando o acervo tem a foto do estádio do time;
# nunca em final/decisão (campo neutro) nem em jogo fora do Brasil
FINAL = re.compile(r"[Ff]ina(?:l|is)|[Dd]ecide|[Dd]ecis")


def mandante(p, fr, A):
    if (p.get("secao") or "") != "esportes" or FINAL.search(fr) or fora(p): return []
    best, pos = None, 10**9
    for x in (A.get("assuntos") or {}).values():
        if not isinstance(x, dict) or x.get("secoes") != ["esportes"] or not isinstance(x.get("chaves"), list): continue
        for k in x["chaves"]:
            if not isinstance(k, str) or not k: continue
            i = pos_palavra(fr, k)
            if 0 <= i < pos and fr[i + len(k):i + len(k) + 3] == " x ": best, pos = x, i
    return [f for f in (best or {}).get("fotos") or [] if fa_valida(f) and not bloqueada(f)]


def fotos_do_lugar(A, ra):
    """Fotos do acervo (assuntos e temas, nessa ordem, sem repetir) cujo nome de arquivo diz o lugar."""
    out, vistos = [], set()
    listas = [x.get("fotos") for x in (A.get("assuntos") or {}).values() if isinstance(x, dict)] + list((A.get("temas") or {}).values())
    for l in listas:
        for f in l if isinstance(l, list) else []:
            if fa_valida(f) and not bloqueada(f) and ra.search(_arq(f)) and fa_nome(f["url"]) not in vistos:
                vistos.add(fa_nome(f["url"])); out.append(f)
    return out


_BR_FOTO = re.compile(r"(brasil|brazil|brasilia|sao paulo|guarulhos|rio de janeiro|planalto|congresso nacional|senado federal|camara dos deputados|supremo tribunal|paulista|copacabana|maracana|esplanada|itamaraty|banco central|ministerio d|bovespa|petrobras|policia militar|policia federal|unidade basica|allianz|mineirao|januario|beira-rio|fonte nova|arena mrv|interlagos)")


def FT_BR(f):
    """Igual ao ft157Br do app: a foto mostra um lugar do Brasil (pelo nome do arquivo ou pela descrição)."""
    return bool(_BR_FOTO.search(_norm(fa_nome(f.get("url"))).replace("_", " ") + " " + _norm(f.get("alt"))))


TRAGICO = re.compile(r"\b(mort[eoa]s?|morre|morreu|morrem|matou|mata|assassin|pres[oa]s?\b|prisão|prende|detid|acidente|ataque|atentado|tiroteio|velório|enterro|luto|desaparec|internad|cassa|cassação|condena|réu\b|inelegív|denunciad)", re.I)
FINAL = re.compile(r"[Ff]ina(?:l|is)|[Dd]ecide|[Dd]ecis")


def assunto_titulo(tit, A, sec):
    """Igual ao faAssunto do app: o assunto do acervo cuja chave aparece primeiro no texto (respeitando as seções)."""
    best, pos, ln = None, 10**9, 0
    for x in (A.get("assuntos") or {}).values():
        if not isinstance(x, dict) or not isinstance(x.get("chaves"), list): continue
        if isinstance(x.get("secoes"), list) and sec not in x["secoes"]: continue
        for k in x["chaves"]:
            if not isinstance(k, str) or not k: continue
            i = pos_palavra(tit, k)
            if i >= 0 and (i < pos or (i == pos and len(k) > ln)): best, pos, ln = x, i, len(k)
    return best


# corretor 19/11 (causa fotos-2), igual ao app (187): (a) "Governo Trump" não é a pessoa do fato; (b) com lugar na frase
# principal do título, foto de OUTRO lugar com nome não entra por assunto/tema/padrão (Câmara e Senado aceitam o
# Congresso); (c) Esportes: foto de jogo de outros times só se o título cita um deles.
_GOV = re.compile(r"(^|[^A-Za-zÀ-ÿ])((?:[Gg]overno|[Gg]est[aã]o|[Aa]dministra[cç][aã]o|[Ee]ra)\s+)([A-ZÀ-Ý][A-Za-zÀ-ÿ'-]+)")
def sem_governo(t):
    return _GOV.sub(lambda m: m.group(1) + m.group(2) + " " * len(m.group(3)), str(t or ""))
DENTRO = {"Câmara": ["Congresso"], "Senado": ["Congresso"]}
def outro_lugar(f, ditos):
    if not ditos: return False
    a = _arq(f)
    return any(ra.search(a) and nome not in ditos for nome, _, ra, _ in LUG_RE)
COMPOSTO = re.compile(r"^(sul-americana|beira-rio|atletico-mg|atletico-pr|sao-paulo|fla-flu|neo-quimica|mato-grosso|rio-grandense)$")
def jogo_alheio(f, tit):
    a = re.sub(r"\.[a-z]+$", "", _arq(f))
    m = re.search(r"(?:^|[^a-z])([a-z]{3,})(?:-| vs\.? | versus )([a-z]{3,})(?=[^a-z]|$)", a)
    if not m or COMPOSTO.match(m.group(1) + "-" + m.group(2)) or not re.search(r"(copa|sudamericana|libertadores|campeonato|liga|match|jogo|partida| vs\.? | versus )", a): return False
    t = " " + re.sub(r"[^a-z0-9]+", " ", _norm(tit)) + " "
    return not (" " + m.group(1) + " " in t or " " + m.group(2) + " " in t)


# corretor 21/11 (causa fotos-2): travas do último recurso (tema/padrão) e da vista de cidade, iguais ao app (187)
def lugar_alheio(f, ditos, pad):
    a = _arq(f)
    return any(ra.search(a) and nome not in ditos and (pad or not br) for nome, _, ra, br in LUG_RE)
SKY = re.compile(r"skyline|cityscape|downtown|(?:^|[^a-z])cbd(?![a-z])|panoram")
SKYW = re.compile(r"^(skyline|cityscape|downtown|panorama|panoramio|panoramic|cropped|sunset|flickr|from|northeast|northwest|southeast|southwest|night|view|city|aerial|centro)$")
def sky_alheio(f, txt):
    a = _arq(f)
    if not SKY.search(a) or any(ra.search(a) for _, _, ra, _ in LUG_RE): return False  # lugar com nome: regras de lugar
    t = " " + re.sub(r"[^a-z0-9]+", " ", _norm(txt)) + " "
    return not any(len(w) >= 5 and not SKYW.match(w) and " " + w + " " in t for w in re.split(r"[^a-z]+", re.sub(r"\.[a-z]+$", "", a)))
ESPOK = re.compile(r"(^|[^a-z])(taca|trofeu|trophy|bola|ball)(?![a-z])")
ESPW = re.compile(r"^(final|finais|copa|jogo|jogos|estadio|stadium|arena|antes|depois|sector|setor|campeonato|partida|match|club|clube|futebol|football|soccer|time|team|torcida|cropped|conmebol|panoramio|exibicao)$")
def esp_alheio(f, tit):
    a = re.sub(r"\.[a-z]+$", "", _arq(f))
    if ESPOK.search(a): return False
    t = " " + re.sub(r"[^a-z0-9]+", " ", _norm(tit)) + " "
    return not any(len(w) >= 4 and not ESPW.match(w) and " " + w + " " in t for w in re.split(r"[^a-z0-9]+", a))


def clubes(fr, A):
    """Igual ao ft187Clubes do app: clubes (assuntos só de esporte, menos F1/Série/Seleção) citados, na ordem."""
    out = []
    for n, x in (A.get("assuntos") or {}).items():
        if not isinstance(x, dict) or x.get("secoes") != ["esportes"] or not isinstance(x.get("chaves"), list) or re.match(r"^(F[óo]rmula|S[ée]rie|Sele)", n): continue
        pos = -1
        for k in x["chaves"]:
            if not isinstance(k, str) or not k: continue
            i = pos_palavra(fr, k)
            if i >= 0 and (pos < 0 or i < pos): pos = i
        if pos >= 0: out.append((pos, n, x))
    return sorted(out, key=lambda c: c[0])


def fa_listas(p, A):
    """Igual ao faListas do app (187-fotos-f2.js, regra aberta de 18/11 à noite, pedido do Pedro: "se for errar, errar
    para mais"): retrato da 1ª pessoa da frase principal do título ("foto_arquivo": "tema" só tira o retrato em morte,
    prisão, acidente) > lugar do título ou órgão da pessoa > estádio do mandante > assunto (título, tag, subtítulo;
    em Esportes só assunto de esporte e nunca em final) > tema da editoria > padrão da editoria. A = acervo preparado."""
    n = p.get("neutro") or {}; tit = str(n.get("titulo") or ""); fr = frase_principal(tit)
    sec = p.get("secao") or "politica"; T = A.get("temas") or {}
    sub = p.get("subtitulo") if isinstance(p.get("subtitulo"), str) else ""
    extra = " · ".join(x for x in (p.get("tag"), p.get("tema")) if isinstance(x, str) and x)
    L, vistos = [], []
    st = {"fo": None}
    def fo():
        if st["fo"] is None: st["fo"] = fora(p)
        return st["fo"]
    ditos, esp = set(), sec == "esportes"
    # 20/11 (testador), igual ao app: Capitólio só em notícia do Congresso dos EUA; foto em tira fica borrada
    cong = bool(re.search(r"Congresso|Capit[óo]lio|Senado (?:americano|dos EUA)|C[âa]mara dos (?:EUA|Representantes)", tit))
    def ruim(f):
        if not cong and re.search(r"capitol", _arq(f), re.I): return True
        w, h = f.get("w"), f.get("h")
        return bool(w and h and (h < 280 or w / h > 2.3))
    def pega(l, lugar):
        if not isinstance(l, list): return
        k = "|".join(sorted(str(f.get("url")) for f in l if isinstance(f, dict)))
        if k in vistos: return
        ok = [f for f in l if fa_valida(f) and not bloqueada(f) and not (lugar and fo() and FT_BR(f))
              and not (lugar and outro_lugar(f, ditos)) and not (esp and jogo_alheio(f, tit))]
        if ok: vistos.append(k); L.append(ok)
    if p.get("foto_arquivo") != "tema" or not TRAGICO.search(tit):
        pe = pessoa_titulo(sem_governo(fr), A)
        if pe: pega(pe["fotos"], False)
    for nome, ra, br in lugares_do_titulo(sem_governo(fr), A):
        if br and fo(): continue
        ditos.add(nome); ditos.update(DENTRO.get(nome, []))
        ok = [f for f in fotos_do_lugar(A, ra) if not (esp and jogo_alheio(f, tit))]
        if ok: L.append(ok)
    ok = [f for f in mandante(p, fr, A) if not jogo_alheio(f, tit)]
    if ok: L.append(ok)
    ts = tit + " · " + sub  # corretor 21/11: vista de cidade só da cidade que o título ou o subtítulo diz
    # corretor 21/11, igual ao app: dois clubes na frase principal → só o mandante ("A visita o B": B); senão nenhum clube
    cl = clubes(fr, A) if esp else []
    dois = len(cl) >= 2; clN = [c[2] for c in cl]
    if dois and not FINAL.search(fr) and not fo():
        vm = next((c for c in cl if re.search(r"visitam?\s+(?:o|a)\s+$", fr[:c[0]])), None)
        if vm: pega(vm[2].get("fotos"), True)
    for t in (fr, extra, sub):
        if not t: continue
        x = assunto_titulo(t, A, sec)
        if x and dois and any(x is c for c in clN): x = None
        if x and (sec != "esportes" or (isinstance(x.get("secoes"), list) and "esportes" in x["secoes"] and not FINAL.search(fr))):
            pega([f for f in (x.get("fotos") or []) if not sky_alheio(f, ts)], True); break
    # tema e padrão: foto de lugar com nome vai por último (fica para a notícia que diz o lugar), igual ao app
    de_lugar = lambda f: any(ra.search(_arq(f)) for _, _, ra, _ in LUG_RE)
    fin = sec == "esportes" and bool(FINAL.search(fr))  # final (campo neutro): nenhum estádio
    tm = lambda l: [f for f in l if not de_lugar(f)] + ([] if fin else [f for f in l if de_lugar(f)]) if isinstance(l, list) else l
    # 20/11 noite, igual ao app: trágica sem retrato (internação, morte, prisão) não cai na foto genérica da editoria
    if not (p.get("foto_arquivo") == "tema" and TRAGICO.search(tit) and not L):
        # corretor 21/11 (causa fotos-2), igual ao app: no último recurso, lugar com nome só se o título disse; no padrão
        # nenhum, no tema nenhum de fora do Brasil; Esportes só com time/nome do título no arquivo (taça e bola valem)
        gen = lambda l, pad: [f for f in l if not lugar_alheio(f, ditos, pad) and not (esp and esp_alheio(f, tit)) and not sky_alheio(f, ts)] if isinstance(l, list) else l
        pega(gen(tm(T.get(sec + "/" + str(p.get("subtema") or ""))), False), True)
        pega(gen(tm(T.get((A.get("padrao") or {}).get(sec) or "")), True), True)
    return [o for o in ([f for f in l if not ruim(f)] for l in L) if o]


# foto própria da rodada (pauta.foto) só vale com "mostra": o que está na foto, citando a pessoa ou o lugar do título
STOP = {"a", "o", "as", "os", "e", "em", "no", "na", "nos", "nas", "de", "do", "da", "dos", "das", "um", "uma", "com", "por", "para", "pelo", "pela",
        "apos", "sem", "se", "ao", "aos", "que", "mais", "ja", "nao", "sob", "ate", "entre", "contra", "como", "diz", "foto", "arquivo", "durante"}


def nomes(t):
    """Nomes próprios, siglas e códigos (COP31, BR-116) de um texto, sem acento e minúsculos."""
    out = set()
    for tk in re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*", str(t or "")):
        if len(tk) < 2: continue
        if re.match(r"[A-ZÀ-ÖØ-Þ]", tk) or (re.search(r"[0-9]", tk) and re.search(r"[A-Za-zÀ-ÖØ-öø-ÿ]", tk)):
            n = _norm(tk)
            if n not in STOP: out.add(n)
    return out


def confirma(p, f):
    """A foto própria diz o que mostra ("mostra") e isso partilha um nome (pessoa, lugar, sigla) com o título."""
    m = f.get("mostra") if isinstance(f, dict) else None
    # 18/11 noite: sem "mostra" a foto própria vale (errar para mais); com "mostra", precisa bater com o título
    if not isinstance(m, str) or not m.strip(): return True
    return bool(nomes(m) & nomes((p.get("neutro") or {}).get("titulo")))


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
    """Foto própria da pauta: só com "mostra" que confirma (18/11); e nunca retrato de arquivo de quem não está no título
    (nem com "foto_arquivo":"tema")."""
    if not fa_valida(f) or bloqueada(f) or not confirma(p, f): return False
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


# ---- prévia própria das notícias sem foto (16/11, 169) ----
# As notícias com ilustração no app iam para o WhatsApp com og-padrao.png (o mesmo quadrado escuro em todas). Agora cada
# uma ganha m/og/<id>.jpg: a cor da editoria, a editoria e o tema, o destaque da ilustração do app (o número das cédulas,
# o carimbo, a etiqueta) e o título. Só texto e formas (nada de imagem gerada de pessoa). Precisa do Pillow (o mesmo do
# robô de fotos); sem ele, fica a imagem padrão.
ARTE_VERSAO = "1"
ARTE_W, ARTE_H = 1200, 630
SECOES = {"politica": ("Política", "#e3e8f0", "#1d3a63", "#cbd5e3"), "economia": ("Economia", "#e4ece7", "#24533c", "#cddcd3"),
          "brasil": ("Brasil", "#efe7dc", "#6e4419", "#dfd2c0"), "mundo": ("Mundo", "#e8e4ef", "#46337a", "#d5cee3"),
          "educacao": ("Educação", "#f1e3e5", "#7a2b37", "#e3ccd0"), "esportes": ("Esportes", "#e1edef", "#1e5a60", "#c9dde0")}
TINTA, AMBAR, ESCURO = "#14213a", "#c9822b", "#0f1522"
FONTES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fontes")


def _fonte(tipo, tam, peso):
    """Newsreader/Public Sans do app (woff2 variável); sem suporte a woff2, DejaVu; por fim a fonte embutida do Pillow."""
    from PIL import ImageFont
    arq = {"serif": "newsreader.woff2", "sans": "public-sans.woff2"}[tipo]
    try:
        f = ImageFont.truetype(os.path.join(FONTES, arq), tam)
        try: f.set_variation_by_axes([peso, min(72, max(6, tam // 2))] if tipo == "serif" else [peso])
        except Exception: pass
        return f
    except Exception: pass
    for c in ([f"/usr/share/fonts/truetype/dejavu/DejaVuSerif{'-Bold' if peso >= 600 else ''}.ttf"] if tipo == "serif" else []) + [f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if peso >= 600 else ''}.ttf"]:
        try: return ImageFont.truetype(c, tam)
        except Exception: pass
    try: return ImageFont.load_default(tam)
    except Exception: return ImageFont.load_default()


def _linhas(d, txt, f, larg, maxl):
    pal, out, cur = str(txt or "").split(), [], ""
    for w in pal:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= larg or not cur: cur = t
        else: out.append(cur); cur = w
    if cur: out.append(cur)
    if len(out) > maxl:
        out = out[:maxl]
        while out[-1] and d.textlength(out[-1] + "…", font=f) > larg: out[-1] = out[-1].rsplit(" ", 1)[0] if " " in out[-1] else out[-1][:-1]
        out[-1] = out[-1].rstrip(" ,;:—–-") + "…"
    return out


FEIRA_TIT = re.compile(r"([Tt]omate|[Ff]eira|[Hh]ortifr|[Aa]limentos|[Vv]erduras|[Ll]egumes|[Cc]esta b[aá]sica|[Ff]eij[aã]o|[Aa]rroz|[Bb]atata|[Cc]ebola)")


def _maiusc(t):
    return str(t or "").upper()


def arte_dados(p):
    """O que entra na imagem (também é a chave: a imagem só é refeita quando isto muda)."""
    n, im = p.get("neutro") or {}, p.get("imagem") if isinstance(p.get("imagem"), dict) else {}
    dd = im.get("dados") if isinstance(im.get("dados"), dict) else {}
    sec = p.get("secao") if p.get("secao") in SECOES else "politica"
    sub = str(p.get("subtema") or "").strip()
    if not dd and sec == "economia" and FEIRA_TIT.search(str(n.get("titulo") or "")):  # igual ao app (169): feira
        dd = {"rotulo": "INFLAÇÃO DOS ALIMENTOS" if sub == "Juros e inflação" else "ALIMENTOS"}
    sel = {"valor": str(dd.get("valor") or "").strip()[:14], "legenda": str(dd.get("legenda") or "").strip()[:80],
           "carimbo": _maiusc(dd.get("carimbo")).strip()[:28], "rotulo": _maiusc(dd.get("rotulo")).strip()[:36]}
    return {"v": ARTE_VERSAO, "sec": sec, "sub": "" if sub.startswith("Outros") else sub, "titulo": str(n.get("titulo") or "").strip(), **sel}


def arte_chave(p):
    import hashlib
    return hashlib.sha1(json.dumps(arte_dados(p), ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:10]


def desenhar_arte(p, cam):
    """Grava a prévia em JPEG (1200×630). Devolve False sem o Pillow."""
    try: from PIL import Image, ImageDraw
    except ImportError: return False
    D = arte_dados(p)
    nome, bg, ac, fundo = SECOES[D["sec"]]
    W, H, M = ARTE_W, ARTE_H, 72
    im = Image.new("RGB", (W, H), bg); d = ImageDraw.Draw(im)
    # formas da editoria ao fundo (sem pessoas nem logotipos)
    d.ellipse((W - 250, -190, W + 130, 190), fill=fundo)
    d.ellipse((W - 150, 52, W - 70, 132), outline=ac, width=5)
    d.rectangle((0, 0, 14, H - 96), fill=ac)
    fundo_img, d0 = im, d
    im = Image.new("RGBA", (W, H - 96), (0, 0, 0, 0)); d = ImageDraw.Draw(im)  # texto numa camada, centralizada depois
    y = 0
    fk = _fonte("sans", 25, 700)
    kick = _maiusc(nome) + (" · " + _maiusc(D["sub"]) if D["sub"] else "")
    d.text((M, y), kick, font=fk, fill=ac); y += 52
    if D["valor"]:
        fv = _fonte("serif", 112, 800)
        d.text((M - 4, y + 4), D["valor"], font=fv, fill=ac); y += 134
        if D["legenda"]:
            fl = _fonte("sans", 24, 500)
            d.text((M, y), _linhas(d, D["legenda"], fl, W - 2 * M - 200, 1)[0], font=fl, fill="#3b4a62"); y += 44
    elif D["carimbo"]:
        fc = _fonte("sans", 44, 800)
        tw = int(d.textlength(D["carimbo"], font=fc)) + 56
        st = Image.new("RGBA", (tw + 20, 110), (0, 0, 0, 0)); sd = ImageDraw.Draw(st)
        sd.rounded_rectangle((10, 18, tw + 10, 92), radius=10, outline="#b4532a", width=7)
        sd.text((10 + tw / 2, 56), D["carimbo"], font=fc, fill="#b4532a", anchor="mm")
        st = st.rotate(4, resample=Image.BICUBIC, expand=True)
        im.paste(st, (M - 12, y - 14), st); y += st.height - 6
    elif D["rotulo"]:
        fr = _fonte("sans", 24, 700)
        tw = int(d.textlength(D["rotulo"], font=fr)) + 44
        d.rounded_rectangle((M, y, M + tw, y + 46), radius=23, fill=TINTA)
        d.text((M + tw / 2, y + 23), D["rotulo"], font=fr, fill="#ffffff", anchor="mm"); y += 76
    # título: o maior tamanho que cabe em até 3 linhas no espaço que sobra
    base = H - 96 - 100
    for tam in (74, 66, 58, 52, 46):
        ft = _fonte("serif", tam, 700)
        ls = _linhas(d, D["titulo"], ft, W - 2 * M - 40, 3)
        alt = int(tam * 1.14) * len(ls)
        if y + alt <= base and (len(ls) < 3 or tam <= 58 or y + alt + int(tam * 1.14) <= base): break
    y0 = y + 6
    for i, l in enumerate(ls): d.text((M, y0 + i * int(tam * 1.14)), l, font=ft, fill=TINTA)
    usado = y0 + alt
    fundo_img.paste(im, (0, max(48, (H - 96 - usado) // 2)), im)
    im, d = fundo_img, d0
    # rodapé com a marca
    d.rectangle((0, H - 96, W, H), fill=ESCURO)
    fm, fn, fu = _fonte("serif", 44, 700), _fonte("sans", 19, 700), _fonte("sans", 24, 500)
    d.text((M, H - 48), "prumo", font=fm, fill="#ffffff", anchor="lm")
    d.text((M + d.textlength("prumo", font=fm) + 12, H - 52), "N E W S", font=fn, fill=AMBAR, anchor="lm")
    d.text((W - M, H - 48), "prumonews.com.br", font=fu, fill="#9aa6b8", anchor="rm")
    os.makedirs(os.path.dirname(cam), exist_ok=True)
    im.save(cam, "JPEG", quality=76, optimize=True, progressive=True)
    return True


# páginas antigas (16/11, 169): incêndio em fábrica que saiu com foto de queimada no mato
INC_MATO = re.compile(r"(florest|queimad|wildfire|forest|bush ?fire|cerrado|vegetac|brigadist|crash|hercules|c-130|aircraft)")
INC_TIT = re.compile(r"([Ff]loresta|[Qq]ueimad|[Mm]ato\b|[Vv]egeta|[Cc]errado|[Pp]antanal|[Aa]maz[oô]nia|[Rr]eserva)")


def pagina_bloqueada(txt):
    """Página antiga (pauta que saiu) com foto que já apareceu no lugar errado: devolve o texto com a imagem padrão."""
    m = re.search(r'<meta property="og:image" content="([^"]+)">', txt or "")
    if not m or "wikimedia.org" not in m.group(1): return None
    f = {"url": html.unescape(m.group(1))}
    t = re.search(r'<meta property="og:title" content="([^"]*)">', txt)
    t = html.unescape(t.group(1)) if t else ""
    inc = bool(re.search(r"[Ii]nc[eê]ndio", t)) and not INC_TIT.search(t) and bool(INC_MATO.search(_arq(f)))
    if not bloqueada(f) and not inc: return None
    tam = '\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'
    return txt.replace(m.group(0), f'<meta property="og:image" content="{BASE}/og-padrao.png">{tam}', 1)


def primeira_frase(t):
    t = re.sub(r"\s+", " ", str(t or "")).strip()
    m = re.match(r"(.+?[.!?])(\s|$)", t)
    return (m.group(1) if m else t)[:220]


SLUG_MAX = 70
def slug_de(tit):
    """endereço pelo título: minúsculas, sem acento, palavras com hífen, até ~70 letras sem cortar palavra"""
    # 20/11 (testador): "fim da 6×1" virava "fim-da-61"; número × número vira "6x1"
    t = re.sub(r"(\d)\s*[×✕✖xX]\s*(\d)", r"\1x\2", str(tit or ""))
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    pal = [w for w in re.sub(r"[^a-z0-9]+", " ", t).split() if w]
    out = ""
    for w in pal:
        if out and len(out) + 1 + len(w) > SLUG_MAX: break
        out = (out + "-" + w) if out else w[:SLUG_MAX]
    return out


def alvo_do_arquivo(cam):
    """para qual notícia uma página m/ já existente leva (None se não existe ou não é página do Prumo)"""
    try: m = re.search(r'location\.replace\("/#m=([A-Za-z0-9_-]+)"\)', open(cam, encoding="utf-8").read())
    except OSError: return None
    return m.group(1) if m else None


def pagina(p, FA=None, propria=None, slug=None, arte=None):
    pid = p["id"]
    n = p.get("neutro") or {}
    tit = str(n.get("titulo") or "Prumo News").strip()
    desc = str(p.get("subtitulo") or "").strip() or primeira_frase(n.get("texto"))
    pf = p.get("foto") if fa_valida(p.get("foto")) and not bloqueada(p["foto"]) and (propria is None or propria(p)) else {}
    f = (FA or {}).get(p["id"]) or pf
    img, w, h = BASE + "/og-padrao.png", "1200", "630"
    if isinstance(f.get("url"), str) and FOTO_OK.match(f["url"]):
        img, w, h = foto_leve(f["url"]), "", ""  # o crédito fica na página da matéria, não na prévia (15/11)
    elif arte:
        img, w, h = arte, str(ARTE_W), str(ARTE_H)
    e = lambda s: html.escape(str(s), quote=True)
    url = f"{BASE}/m/{slug or pid}.html"
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


MARCA_RE = re.compile(r"\{(dolar|ibov|ibovespa|selic|ipca|ipca12m|desemprego)(?:\.(var|dia|mes))?\}")


def resolver_marcas(F, feed):
    """Marcas de indicador ({dolar}, 18/11) → o valor de indicadores.json (ao lado do feed), com a mesma regra do app
    (tools/validar.py, marcas_resolver). Sem o validar.py, a frase com a marca sai como o app faria sem indicador."""
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("validar_prumo", os.path.join(os.path.dirname(os.path.abspath(__file__)), "validar.py"))
        V = importlib.util.module_from_spec(spec); spec.loader.exec_module(V)
        return V.marcas_resolver(F, V.ler_indicadores(os.path.join(os.path.dirname(os.path.abspath(feed)), "indicadores.json")))
    except Exception as e:
        print("marcas de indicador: validar.py indisponível:", repr(e)[:120])
        tira = lambda x: re.sub(r"\s{2,}", " ", MARCA_RE.sub("", x)).strip() if isinstance(x, str) else ([tira(y) for y in x] if isinstance(x, list) else ({k: tira(v) for k, v in x.items()} if isinstance(x, dict) else x))
        return tira(F)


def main(argv):
    if len(argv) < 2: print(__doc__); return 2
    feed, pasta = argv[0], argv[1]
    F = json.load(open(feed, encoding="utf-8"))
    # o endereço pelo título não muda quando o número muda: sai do título sem as marcas
    tit_cru = {p.get("id"): MARCA_RE.sub("", str((p.get("neutro") or {}).get("titulo") or "")) for p in F.get("pautas") or [] if isinstance(p, dict)}
    F = resolver_marcas(F, feed)
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
    cam_ind = os.path.join(pasta, "indice.json")
    try: IND = json.load(open(cam_ind, encoding="utf-8"))
    except (OSError, ValueError): IND = {}
    if not isinstance(IND, dict): IND = {}
    ids = {p.get("id") for p in pautas if isinstance(p.get("id"), str)}
    def grava(cam, txt):
        nonlocal novas, mudou
        velho = open(cam, encoding="utf-8").read() if os.path.exists(cam) else None
        if velho == txt: return
        with open(cam, "w", encoding="utf-8") as fh: fh.write(txt)
        if velho is None: novas += 1
        else: mudou += 1
    for p in pautas:
        pid = p.get("id")
        if not isinstance(pid, str) or not PID.match(pid): continue
        # o endereço pelo título: não pode tomar o de outra notícia nem o m/<id>.html de outra pauta
        s0 = slug_de(tit_cru.get(pid, (p.get("neutro") or {}).get("titulo")))
        sl = None
        if s0 and len(s0) >= 8:
            for cand in (s0, s0 + "-" + re.sub(r"[^a-z0-9-]", "", pid.lower())[:24]):
                dono = alvo_do_arquivo(os.path.join(pasta, cand + ".html"))
                if (dono is None or dono == pid) and cand not in ids - {pid}: sl = cand; break
        tem_foto = bool(FA.get(pid)) or (fa_valida(p.get("foto")) and not bloqueada(p["foto"]) and propria(p))
        arte = None
        if not tem_foto:
            k = arte_chave(p)
            cam_arte = os.path.join(pasta, "og", pid + ".jpg")
            url_arte = f"{BASE}/m/og/{pid}.jpg?v={k}"
            antes = open(os.path.join(pasta, pid + ".html"), encoding="utf-8").read() if os.path.exists(os.path.join(pasta, pid + ".html")) else ""
            if (url_arte in antes and os.path.exists(cam_arte)) or desenhar_arte(p, cam_arte): arte = url_arte
        txt = pagina(p, FA, propria, sl, arte)
        grava(os.path.join(pasta, pid + ".html"), txt)
        if sl:
            grava(os.path.join(pasta, sl + ".html"), txt)
            IND[pid] = sl
    # páginas de notícias que saíram e mostram foto bloqueada depois (selo postal na chuva da Bahia): imagem padrão
    for fn in sorted(os.listdir(pasta)):
        if not fn.endswith(".html"): continue
        cam = os.path.join(pasta, fn)
        if alvo_do_arquivo(cam) in ids: continue
        try: velho = open(cam, encoding="utf-8").read()
        except OSError: continue
        novo_txt = pagina_bloqueada(velho)
        if novo_txt: grava(cam, novo_txt)
    novo = json.dumps(dict(sorted(IND.items())), ensure_ascii=False, separators=(",", ":"))
    if not os.path.exists(cam_ind) or open(cam_ind, encoding="utf-8").read() != novo:
        with open(cam_ind, "w", encoding="utf-8") as fh: fh.write(novo)
    print(f"páginas: {novas} novas, {mudou} atualizadas")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
