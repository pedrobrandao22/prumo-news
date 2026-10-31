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
    "Flávio Dino": ["Dino"],
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
    "economia/Mercados": [("B3 bolsa de valores São Paulo", ["b3", "bolsa", "bovespa"]), ("cédulas de real", ["real", "cédula", "cedula"])],
    "economia/Atividade econômica": [("Porto de Santos", ["porto de santos"]), ("colheita soja Brasil", ["soja", "colheita"])],
    "economia/Empresas": [("Avenida Paulista", ["paulista"])],
    "economia/Trabalho e renda": [("carteira de trabalho", ["carteira de trabalho"]), ("trabalhadores construção civil Brasil", ["trabalhador", "obra", "construção"])],
    "economia/Seu dinheiro": [("cédulas de real", ["real", "cédula", "cedula"])],
    "brasil/Segurança": [("viatura Polícia Militar", ["polícia militar", "viatura", "policia militar"])],
    "brasil/Justiça e polícia": [("Polícia Federal sede Brasília", ["polícia federal", "policia federal"])],
    "brasil/Saúde": [("hospital SUS Brasil", ["hospital", "sus"])],
    "brasil/Meio ambiente e clima": [("enchente Brasil", ["enchente", "inundação", "chuva"]), ("floresta amazônica", ["amazônia", "amazonia", "amazon"])],
    "brasil/Infraestrutura e transporte": [("rodovia Brasil", ["rodovia", "br-"]), ("metrô de São Paulo", ["metrô", "metro"])],
    "brasil/Sociedade": [("São Paulo centro rua", ["são paulo", "sao paulo"])],
    "mundo/América Latina": [("Casa Rosada Buenos Aires", ["casa rosada"])],
    "mundo/EUA": [("White House Washington", ["white house"]), ("United States Capitol", ["capitol"])],
    "mundo/Europa": [("European Parliament Strasbourg", ["european parliament", "parlement"])],
    "mundo/Oriente Médio": [("Jerusalem Old City", ["jerusalem"])],
    "mundo/Ásia": [("Tiananmen Square", ["tiananmen"])],
    "mundo/África": [("African Union headquarters", ["african union"])],
    "educacao/Educação básica": [("sala de aula escola pública Brasil", ["sala de aula", "escola"])],
    "educacao/Ensino superior": [("Universidade de São Paulo", ["universidade de são paulo", "usp"])],
    "educacao/Enem e vestibulares": [("estudantes prova Enem", ["enem", "vestibular", "prova"])],
    "educacao/Políticas": [("Ministério da Educação Brasília", ["educação", "mec"])],
    "educacao/Avaliações": [("sala de aula escola pública Brasil", ["sala de aula", "escola"])],
    "esportes/Brasileirão": [("Estádio do Maracanã", ["maracanã", "maracana"]), ("Allianz Parque", ["allianz parque"])],
    "esportes/Série B": [("estádio de futebol Brasil torcida", ["estádio", "estadio"])],
    "esportes/Copa do Brasil": [("Estádio do Maracanã", ["maracanã", "maracana"])],
    "esportes/Libertadores": [("Copa Libertadores", ["libertadores"])],
    "esportes/Sul-Americana": [("Copa Sudamericana", ["sudamericana", "sul-americana"])],
    "esportes/Seleção": [("Seleção Brasileira de Futebol", ["seleção brasileira", "brazil national football team", "selecao"])],
    "esportes/Clubes": [("Estádio do Maracanã", ["maracanã", "maracana"])],
    "esportes/Outros esportes": [("Ginásio do Ibirapuera", ["ibirapuera"])],
}
PADRAO = {"politica": "politica/Congresso", "economia": "economia/Mercados", "brasil": "brasil/Sociedade", "mundo": "mundo/Europa",
          "educacao": "educacao/Educação básica", "esportes": "esportes/Brasileirão"}


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


def busca(consulta, chaves, n=4, exige_todos=False):
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
        if ii.get("mime") not in ("image/jpeg", "image/png", "image/webp"): continue
        if (ii.get("width") or 0) < 700 or (ii.get("height") or 0) < 400: continue
        md = ii.get("extmetadata") or {}
        lic = limpa((md.get("LicenseShortName") or {}).get("value"))
        if not lic or not LIVRE.search(lic) or PROIBIDO.search(lic): continue
        autor = limpa((md.get("Artist") or {}).get("value")) or "autor desconhecido"
        url = ii.get("url") or ""
        if not url.startswith("https://upload.wikimedia.org/"): continue
        out.append({"url": url, "credito": f"Foto de arquivo: {autor}/Wikimedia Commons ({lic})", "pagina": ii.get("descriptionurl", "")})
        if len(out) >= n: break
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
    out_p, out_t = {}, {}
    for nome, chaves in pessoas.items():
        fotos = busca(f'intitle:"{nome}"', [nome], n=3, exige_todos=True)
        if not fotos and len(nome.split()) > 2:  # ex.: Luiz Inácio Lula da Silva → "Lula"
            fotos = busca(f'intitle:"{chaves[0]}"', [chaves[0]], n=3, exige_todos=True)
        if not fotos: fotos = ((velho.get("pessoas") or {}).get(nome) or {}).get("fotos") or []
        if fotos:
            out_p[nome] = {"chaves": chaves, "fotos": [dict(f, alt=f"Foto de arquivo: {nome}") for f in fotos]}
        print(f"{nome}: {len(fotos)}")
    for k, qs in TEMAS.items():
        fotos = []
        for q, ch in qs:
            fotos += [f for f in busca(q, ch, n=3) if f["url"] not in {x["url"] for x in fotos}]
            if len(fotos) >= 4: break
        if not fotos: fotos = (velho.get("temas") or {}).get(k) or []
        if fotos: out_t[k] = [dict(f, alt=f"Foto de arquivo: {qs[0][0]}") for f in fotos[:4]]
        print(f"{k}: {len(fotos)}")
    if not out_p and not out_t: print("nada encontrado: arquivo anterior mantido"); return 1
    res = {"gerado": datetime.now(SP).isoformat(timespec="minutes"), "padrao": PADRAO, "pessoas": out_p, "temas": out_t}
    with open(saida, "w", encoding="utf-8") as fh: json.dump(res, fh, ensure_ascii=False, separators=(",", ":"))
    print("gravado:", len(out_p), "pessoas,", len(out_t), "assuntos")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
