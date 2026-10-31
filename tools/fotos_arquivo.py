#!/usr/bin/env python3
"""Banco de fotos de arquivo do Prumo News, sem IA (roda no GitHub).

  python3 tools/fotos_arquivo.py feed.json fotos-arquivo.json

Busca no Wikimedia Commons (licença livre, com autor) retratos das pessoas que mais aparecem nas notícias
e fotos de lugares/assuntos de cada seção (Congresso, STF, Banco Central, B3, estádio…). O app usa essas
fotos quando a pauta não tem foto própria, sempre com o crédito "Foto de arquivo: Autor/Wikimedia Commons".
Se a busca falhar, o arquivo anterior continua valendo.
"""
import html, json, os, re, sys, time, unicodedata, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "PrumoNews/1.0 (https://prumonews.com.br; robo de fotos de arquivo)"}
SP = timezone(timedelta(hours=-3))
LIVRE = re.compile(r"^(cc[ -]by(-sa)?( [\d.]+)?( [a-z-]+)?|cc0|public domain|pd\b|domínio público)", re.I)
PROIBIDO = re.compile(r"\b(nc|nd)\b", re.I)
FORA = re.compile(r"(hospital de campanha|trofeu|map|mapa|planta|plano geral|desenho|drawing|diagram|logo|coat of arms|brasao|bandeira de|flag of|selo|stamp|cracha|cranio|crane|sketch|plan of|acervo|caricatura|cartoon|grafico|chart|show de|show of|concert|protest|protesto|manifestac|cpmi|comissao parlamentar|display|placa|sign\b|1[89]\d\d)")

# pessoas: nome → palavras que, no título da notícia, indicam essa pessoa (a 1ª citada no título ganha)
PESSOAS = {
    "Luiz Inácio Lula da Silva": ["Lula"],
    "Flávio Bolsonaro": ["Flávio Bolsonaro", "Flávio"],
    "Jair Bolsonaro": ["Jair Bolsonaro"],
    "Eduardo Bolsonaro": ["Eduardo Bolsonaro"],
    "Michelle Bolsonaro": ["Michelle Bolsonaro", "Michelle"],
    "Alexandre de Moraes": ["Moraes"],
    "Hugo Motta": ["Hugo Motta", "Motta"],
    "Davi Alcolumbre": ["Alcolumbre"],
    "Fernando Haddad": ["Haddad"],
    "Gabriel Galípolo": ["Galípolo"],
    "Geraldo Alckmin": ["Alckmin"],
    "Tarcísio de Freitas": ["Tarcísio"],
    "Simone Tebet": ["Tebet"],
    "Gleisi Hoffmann": ["Gleisi"],
    "Valdemar Costa Neto": ["Valdemar"],
    "Ciro Nogueira": ["Ciro Nogueira"],
    "Edson Fachin": ["Fachin"],
    "Gilmar Mendes": ["Gilmar"],
    "Flávio Dino": ["Flávio Dino", "Dino"],
    "André Mendonça": ["Mendonça"],
    "Kassio Nunes Marques": ["Nunes Marques"],
    "Cármen Lúcia": ["Cármen Lúcia"],
    "Paulo Gonet": ["Gonet"],
    "Andrei Rodrigues": ["Andrei Rodrigues"],
    "Ronaldo Caiado": ["Caiado"],
    "Romeu Zema": ["Zema"],
    "Ratinho Júnior": ["Ratinho"],
    "Eduardo Leite": ["Eduardo Leite"],
    "Guilherme Boulos": ["Boulos"],
    "Ricardo Nunes": ["Ricardo Nunes"],
    "Eduardo Paes": ["Paes"],
    "Donald Trump": ["Trump"],
    "Benjamin Netanyahu": ["Netanyahu"],
    "Vladimir Putin": ["Putin"],
    "Volodymyr Zelensky": ["Zelensky", "Zelenski"],
    "Emmanuel Macron": ["Macron"],
    "Javier Milei": ["Milei"],
    "Xi Jinping": ["Xi Jinping"],
    "Nicolás Maduro": ["Maduro"],
    "Ali Khamenei": ["Khamenei"],
    "Carlo Ancelotti": ["Ancelotti"],
}
# assuntos: seção/subtema → buscas no Commons (o título do arquivo precisa conter ao menos uma palavra-chave)
TEMAS = {
    "politica/Eleições 2026": [("urna eletrônica", ["urna"]), ("Tribunal Superior Eleitoral", ["tribunal superior eleitoral", "tse"])],
    "politica/Congresso": [("Congresso Nacional Brasília", ["congresso nacional"]), ("plenário Câmara dos Deputados", ["câmara", "camara"]), ("plenário Senado Federal", ["senado"])],
    "politica/Planalto e governo": [("Palácio do Planalto", ["planalto"]), ("Esplanada dos Ministérios", ["esplanada"])],
    "politica/STF e Judiciário": [("Supremo Tribunal Federal", ["supremo tribunal federal", "stf"])],
    "politica/Partidos": [("Câmara dos Deputados plenário", ["câmara", "camara"])],
    "politica/Estados": [("Palácio dos Bandeirantes", ["bandeirantes"]), ("Palácio Guanabara", ["guanabara"])],
    "economia/Juros e inflação": [("Banco Central do Brasil", ["banco central"]), ("supermercado Brasil", ["supermercado"])],
    "economia/Contas públicas": [("Ministério da Fazenda Brasília", ["fazenda"]), ("Esplanada dos Ministérios", ["esplanada"])],
    "economia/Mercados": [("Bolsa de Valores de São Paulo", ["bolsa de valores", "bovespa", "bm&f"]), ("B3 Brasil Bolsa Balcão", ["bolsa"])],
    "economia/Atividade econômica": [("Porto de Santos navio contêiner", ["porto de santos", "port of santos"]), ("colheita soja Brasil", ["soja", "colheita"])],
    "economia/Empresas": [("Avenida Paulista", ["paulista"])],
    "economia/Trabalho e renda": [("carteira de trabalho", ["carteira de trabalho"]), ("operários obra construção civil Brasil", ["operário", "operarios", "construção civil", "construcao civil"])],
    "economia/Seu dinheiro": [("cédulas de reais Banco Central", ["cédulas de real", "cedulas de real", "notas de real", "reais", "brazilian real"])],
    "brasil/Segurança": [("viatura Polícia Militar", ["polícia militar", "viatura", "policia militar"])],
    "brasil/Justiça e polícia": [("Polícia Federal sede Brasília", ["polícia federal", "policia federal"])],
    "brasil/Saúde": [("Unidade Básica de Saúde", ["unidade básica", "unidade basica", "ubs"]), ("UPA pronto atendimento", ["upa", "pronto atendimento"])],
    "brasil/Meio ambiente e clima": [("enchente Brasil", ["enchente", "inundação", "chuva"]), ("floresta amazônica", ["amazônia", "amazonia", "amazon"])],
    "brasil/Infraestrutura e transporte": [("rodovia BR-116", ["br-116", "br-101", "rodovia"]), ("metrô de São Paulo trem", ["metrô de são paulo", "metro de sao paulo", "metrô"])],
    "brasil/Sociedade": [("Avenida Paulista pedestres", ["paulista"]), ("Copacabana calçadão", ["copacabana"])],
    "mundo/América Latina": [("Casa Rosada Buenos Aires", ["casa rosada"])],
    "mundo/EUA": [("White House north facade photo", ["the white house", "white house washington", "white house in washington"]), ("United States Capitol building", ["capitol"])],
    "mundo/Europa": [("European Parliament Strasbourg", ["european parliament", "parlement"])],
    "mundo/Oriente Médio": [("Jerusalem Old City panorama", ["jerusalem"]), ("Knesset building", ["knesset"])],
    "mundo/Ásia": [("Tiananmen Square", ["tiananmen"])],
    "mundo/África": [("African Union headquarters Addis Ababa", ["african union headquarters", "african union hall", "african union conference"])],
    "educacao/Educação básica": [("sala de aula escola estadual alunos", ["sala de aula", "escola estadual", "escola municipal", "alunos"])],
    "educacao/Ensino superior": [("campus universidade federal Brasil", ["campus", "reitoria", "universidade federal"])],
    "educacao/Enem e vestibulares": [("Enem candidatos prova", ["enem"]), ("vestibular candidatos", ["vestibular"])],
    "educacao/Políticas": [("Ministério da Educação Brasília", ["educação", "mec"])],
    "educacao/Avaliações": [("sala de aula escola estadual alunos", ["sala de aula", "escola estadual", "escola municipal", "alunos"])],
    "esportes/Brasileirão": [("Estádio do Maracanã", ["maracanã", "maracana"]), ("Allianz Parque", ["allianz parque"])],
    "esportes/Série B": [("estádio de futebol Brasil torcida", ["estádio", "estadio"])],
    "esportes/Copa do Brasil": [("Estádio do Maracanã", ["maracanã", "maracana"])],
    "esportes/Libertadores": [("taça Copa Libertadores troféu", ["libertadores"])],
    "esportes/Sul-Americana": [("Copa Sudamericana", ["sudamericana", "sul-americana"])],
    "esportes/Seleção": [("Brazil national football team 2022", ["brazil national football team", "seleção brasileira", "selecao brasileira"])],
    "esportes/Clubes": [("Estádio do Maracanã", ["maracanã", "maracana"])],
    "esportes/Outros esportes": [("Ginásio do Ibirapuera arena", ["ginásio do ibirapuera", "ginasio do ibirapuera"])],
}
# assuntos citados no título (lugar, clube, objeto): nome → (palavras no título [maiúsculas contam], busca no Commons,
# palavras no nome do arquivo, seções onde vale [None = todas]). Vêm depois das pessoas e antes do tema da seção.
ASSUNTOS = {
    "Irã": (["Irã", "iraniano", "iraniana", "Teerã"], "Tehran skyline Milad Tower", ["tehran", "teheran"], None),
    "Israel": (["Israel", "israelense", "Tel Aviv"], "Tel Aviv skyline", ["tel aviv"], None),
    "Gaza": (["Gaza"], "Gaza City", ["gaza"], None),
    "Ucrânia": (["Ucrânia", "ucraniano", "ucraniana", "Kiev", "Kyiv", "Oleshky"], "Kyiv Maidan Nezalezhnosti", ["kyiv", "kiev"], None),
    "Rússia": (["Rússia", "russo", "russa", "Moscou", "Kremlin"], "Moscow Kremlin", ["kremlin", "moscow"], None),
    "China": (["China", "chinês", "chinesa", "Pequim"], "Beijing skyline CBD", ["beijing"], None),
    "Venezuela": (["Venezuela", "venezuelano", "Caracas"], "Caracas panorama", ["caracas"], None),
    "Argentina": (["Argentina", "argentino", "Buenos Aires"], "Buenos Aires Obelisco", ["obelisco", "buenos aires"], None),
    "França": (["França", "francês", "francesa", "Paris", "Lecornu", "CGT"], "Paris Eiffel Tower view", ["paris"], None),
    "Espanha": (["Espanha", "espanhol", "espanhola", "Madri"], "Madrid Gran Via", ["madrid"], None),
    "Alemanha": (["Alemanha", "alemão", "alemã", "Berlim"], "Berlin Reichstag", ["reichstag", "berlin"], None),
    "Reino Unido": (["Reino Unido", "britânico", "britânica", "Londres"], "London Westminster Palace", ["westminster", "london"], None),
    "Japão": (["Japão", "japonês", "japonesa", "Tóquio"], "Tokyo Shibuya crossing", ["tokyo", "shibuya"], None),
    "Índia": (["Índia", "indiano", "indiana", "Nova Délhi"], "New Delhi India Gate", ["delhi", "india gate"], None),
    "Catar": (["Catar", "Doha"], "Doha skyline Qatar", ["doha"], None),
    "Ormuz e petróleo": (["Ormuz", "petróleo", "Petróleo", "petroleiro", "Opep"], "oil tanker ship", ["tanker", "oil tanker"], None),
    "Petrobras": (["Petrobras"], "Petrobras plataforma de petróleo", ["petrobras", "plataforma"], None),
    "ONU": (["ONU", "Nações Unidas", "COP"], "United Nations headquarters New York", ["united nations"], None),
    "trens": (["trem", "trens", "Trem", "Trens", "ferrovia", "ferroviário", "metrô", "Metrô"], "trem de passageiros ferrovia", ["trem", "passenger train", "railway"], None),
    "aviação": (["avião", "aviões", "Avião", "voo", "voos", "aeroporto", "Aeroporto", "aérea", "aéreo"], "Aeroporto de Guarulhos avião", ["aeroporto", "airport", "aircraft", "airbus", "boeing"], None),
    "barragem": (["barragem", "Barragem", "represa", "açude"], "barragem Brasil", ["barragem", "dam"], None),
    "incêndio": (["incêndio", "Incêndio", "queimada", "queimadas", "fogo"], "incêndio florestal Brasil", ["incêndio", "incendio", "queimada", "wildfire"], None),
    "aves": (["aves", "aviária", "Newcastle", "frango", "frangos", "granja"], "chickens poultry farm", ["chicken", "frango", "galinha", "poultry", "avicultura", "aviário"], None),
    "café e agro": (["café", "Café", "safra", "agro", "agronegócio"], "colheita de café Brasil", ["café", "coffee"], None),
    "combustíveis": (["gasolina", "Gasolina", "diesel", "combustível", "combustíveis", "etanol"], "posto de combustível bomba de gasolina", ["posto", "gas station", "fuel"], None),
    "energia": (["conta de luz", "energia elétrica", "Aneel", "apagão", "hidrelétrica"], "linhas de transmissão energia", ["transmissão", "transmission", "power line", "hidrelétrica"], None),
    "INSS e aposentadoria": (["INSS", "aposentadoria", "aposentados", "Previdência"], "agência INSS", ["inss"], None),
    "Receita e impostos": (["Receita Federal", "imposto de renda", "Imposto de Renda"], "Receita Federal do Brasil prédio", ["receita federal"], None),
    "indígenas": (["indígena", "indígenas", "Indígenas", "aldeia", "Funai"], "povos indígenas Brasil Acampamento Terra Livre", ["indígena", "indigena", "indigenous", "terra livre"], None),
    "vacinação e saúde": (["vacina", "vacinas", "vacinação", "mpox", "dengue", "gripe", "surto"], "vacinação Brasil posto de saúde", ["vacina", "vaccin"], None),
    "Corinthians": (["Corinthians", "Timão"], "Neo Química Arena", ["neo química", "neo quimica", "arena corinthians"], ["esportes"]),
    "Palmeiras": (["Palmeiras", "Verdão"], "Allianz Parque", ["allianz parque"], ["esportes"]),
    "Flamengo": (["Flamengo", "Fla-Flu"], "Maracanã Flamengo torcida", ["maracanã", "maracana"], ["esportes"]),
    "Vasco": (["Vasco"], "Estádio São Januário", ["são januário", "sao januario"], ["esportes"]),
    "Botafogo": (["Botafogo"], "Estádio Nilton Santos", ["nilton santos", "engenhão", "engenhao"], ["esportes"]),
    "Grêmio": (["Grêmio"], "Arena do Grêmio", ["arena do grêmio", "arena do gremio"], ["esportes"]),
    "Internacional": (["Internacional", "Inter"], "Estádio Beira-Rio", ["beira-rio", "beira rio"], ["esportes"]),
    "Atlético-MG": (["Atlético-MG", "Galo", "Arena MRV"], "Arena MRV", ["arena mrv"], ["esportes"]),
    "Cruzeiro": (["Cruzeiro"], "Mineirão estádio", ["mineirão", "mineirao"], ["esportes"]),
    "Bahia": (["Bahia"], "Arena Fonte Nova", ["fonte nova"], ["esportes"]),
    "Fórmula 1": (["Fórmula 1", "F1", "GP de", "Interlagos"], "Autódromo de Interlagos", ["interlagos"], ["esportes"]),
}
PADRAO = {"politica": "politica/Congresso", "economia": "economia/Mercados", "brasil": "brasil/Sociedade", "mundo": "mundo/Europa",
          "educacao": "educacao/Políticas", "esportes": "esportes/Brasileirão"}


def norm(s):
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()


def api(params):
    params = dict(params, format="json", formatversion="2", origin="*")
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))


def limpa(htm):
    t = html.unescape(re.sub(r"<[^>]+>", "", str(htm or ""))).strip()
    return re.sub(r"\s+", " ", t)[:70]


def busca(consulta, chaves, n=4, exige_todos=False, evitar=()):
    """Fotos livres do Commons cujo nome do arquivo contém as palavras-chave."""
    try:
        d = api({"action": "query", "generator": "search", "gsrsearch": f"{consulta} filetype:bitmap", "gsrnamespace": "6", "gsrlimit": "25",
                 "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiextmetadatafilter": "Artist|LicenseShortName|Credit"})
    except Exception as e:
        print("  busca falhou:", consulta, repr(e)[:100]); return []
    pags = sorted((d.get("query") or {}).get("pages") or [], key=lambda p: p.get("index", 99))
    out = []
    for p in pags:
        ii = (p.get("imageinfo") or [{}])[0]
        tit = norm(p.get("title", ""))
        ks = [norm(k) for k in chaves]
        if exige_todos:
            if not all(all(w in tit for w in k.split()) for k in ks[:1]): continue
        elif not any(k in tit for k in ks): continue
        if FORA.search(tit.replace("_", " ")): continue
        if ii.get("mime") not in ("image/jpeg", "image/webp"): continue
        if (ii.get("width") or 0) < 700 or (ii.get("height") or 0) < 400: continue
        md = ii.get("extmetadata") or {}
        lic = limpa((md.get("LicenseShortName") or {}).get("value"))
        if not lic or not LIVRE.search(lic) or PROIBIDO.search(lic): continue
        autor = limpa((md.get("Artist") or {}).get("value")) or "autor desconhecido"
        url = (ii.get("url") or "").split("?")[0]
        if not url.startswith("https://upload.wikimedia.org/"): continue
        t2 = tit.replace("_", " ")
        if any(norm(o) in t2 for o in evitar): nota_outro = -3
        else: nota_outro = 0
        if exige_todos and re.search(r"\b(pec|sessao|reuniao|cerimonia|encontro|audiencia|plenario|congresso nacional|descerramento|entrega|visita|lancamento|meeting|summit)\b", t2): nota_outro -= 2
        nota = nota_outro + (3 if re.search(r"cropped|retrato|portrait|oficial|official", t2) else 0) - (2 if exige_todos and re.search(r" e | and | com | with |, ", t2) else 0)
        out.append({"url": url, "credito": f"Foto de arquivo: {autor}/Wikimedia Commons ({lic})", "pagina": (ii.get("descriptionurl") or "").split("?")[0], "_n": nota})
    out.sort(key=lambda x: -x["_n"])
    if sum(1 for x in out if x["_n"] >= 0) >= 2: out = [x for x in out if x["_n"] >= 0]  # foto de grupo só se não houver retrato sozinho
    out = [{k: v for k, v in x.items() if k != "_n"} for x in out[:n]]
    time.sleep(0.4)
    return out


def main(argv):
    if len(argv) < 2: print(__doc__); return 2
    feed, saida = argv[0], argv[1]
    try: F = json.load(open(feed, encoding="utf-8"))
    except Exception: F = {}
    velho = {}
    if os.path.exists(saida):
        try: velho = json.load(open(saida, encoding="utf-8"))
        except Exception: velho = {}
    pessoas = dict(PESSOAS)
    # pessoas do feed com nome completo (2+ palavras) entram também, casando pelo nome completo
    for nome in (F.get("pessoas") or {}):
        if isinstance(nome, str) and len(nome.split()) >= 2 and nome not in pessoas and not any(nome in v for v in pessoas.values()):
            pessoas[nome] = [nome]
    out_p, out_t, out_a = {}, {}, {}
    for nome, chaves in pessoas.items():
        outros = [o for o in pessoas if o != nome and o.split()[-1] not in nome]
        fotos = busca(f'intitle:"{nome}"', [nome], n=3, exige_todos=True, evitar=outros)
        if not fotos and len(nome.split()) > 2:  # ex.: Luiz Inácio Lula da Silva → "Lula"
            fotos = busca(f'intitle:"{chaves[0]}"', [chaves[0]], n=3, exige_todos=True, evitar=outros)
        if not fotos: fotos = ((velho.get("pessoas") or {}).get(nome) or {}).get("fotos") or []
        if fotos:
            out_p[nome] = {"chaves": chaves, "fotos": [dict(f, alt=f"Foto de arquivo: {nome}") for f in fotos]}
        print(f"{nome}: {len(fotos)}")
    for k, qs in TEMAS.items():
        fotos = []
        for q, ch in qs:
            fotos += [f for f in busca(q, ch, n=3) if f["url"] not in {x["url"] for x in fotos}]
            if len(fotos) >= 4: break
        if not fotos: fotos = [f for f in ((velho.get("temas") or {}).get(k) or []) if not FORA.search(norm(f.get("url", "")).replace("_", " "))]
        if fotos: out_t[k] = [dict(f, alt=f"Foto de arquivo: {qs[0][0]}") for f in fotos[:4]]
        print(f"{k}: {len(fotos)}")
    for nome, (chaves, q, ch, secs) in ASSUNTOS.items():
        fotos = busca(q, ch, n=3)
        if not fotos: fotos = ((velho.get("assuntos") or {}).get(nome) or {}).get("fotos") or []
        if fotos:
            out_a[nome] = {"chaves": chaves, "fotos": [dict(f, alt=f"Foto de arquivo: {q}") for f in fotos]}
            if secs: out_a[nome]["secoes"] = secs
        print(f"assunto {nome}: {len(fotos)}")
    if not out_p and not out_t: print("nada encontrado: arquivo anterior mantido"); return 1
    res = {"gerado": datetime.now(SP).isoformat(timespec="minutes"), "padrao": PADRAO, "pessoas": out_p, "assuntos": out_a, "temas": out_t}
    with open(saida, "w", encoding="utf-8") as fh: json.dump(res, fh, ensure_ascii=False, separators=(",", ":"))
    print("gravado:", len(out_p), "pessoas,", len(out_a), "assuntos,", len(out_t), "temas")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
