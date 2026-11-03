#!/usr/bin/env python3
"""Banco de fotos de arquivo do Prumo News, sem IA (roda no GitHub).

  python3 tools/fotos_arquivo.py feed.json fotos-arquivo.json [--pasta acervo] [--limite 120] [--max-mb 90]
                                 [--sem-baixar] [--podar]

Monta o acervo de fotos que o app usa quando a pauta não tem foto própria, SEMPRE de fonte livre e com crédito:
- Wikimedia Commons: só arquivos com licença CC BY, CC BY-SA, CC0 ou domínio público, conferida arquivo a arquivo
  pela API (LicenseShortName), com o autor. Retratos das pessoas das notícias e fotos de lugares/assuntos.
- Câmara dos Deputados (API Dados Abertos, urlFoto): retrato oficial dos 513 deputados. A Câmara permite uso livre,
  sem custo e sem autorização, com crédito ("Nome do Fotógrafo/Câmara dos Deputados"; sem autor, "Câmara dos Deputados").
- Senado Federal (API Dados Abertos, UrlFotoParlamentar): retrato oficial dos 81 senadores. Reprodução livre com a
  citação da Agência Senado e sem descaracterizar a foto.
Nunca agência paga, nunca foto de jornal, nunca imagem gerada por IA.

As fotos são guardadas no próprio repositório (pasta acervo/, WebP de até 640 px e ~60 KB), em lotes (--limite por
rodada) para o repositório crescer devagar. Cada foto do fotos-arquivo.json mantém o "url" original (os apps antigos
continuam usando) e ganha "local" (o arquivo do acervo), "licenca", "autor" e "fonte". Pessoas ganham "cargo",
"partido", "uf" e "grupo" quando a fonte oficial informa. Foto já escolhida fica (não troca todo dia).
Se uma fonte falhar, o que já havia continua valendo.
"""
import hashlib, html, io, json, os, re, sys, time, unicodedata, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

API = "https://commons.wikimedia.org/w/api.php"
CAMARA = "https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=100&pagina={}"
SENADO = "https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json"
UA = {"User-Agent": "PrumoNews/1.0 (https://prumonews.com.br; robo de fotos de arquivo)"}
SP = timezone(timedelta(hours=-3))
LIVRE = re.compile(r"^(cc[ -]by(-sa)?( [\d.]+)?( [a-z-]+)?|cc0|public domain|pd\b|domínio público)", re.I)
PROIBIDO = re.compile(r"\b(nc|nd)\b", re.I)
FORA = re.compile(r"(hospital de campanha|trofeu|map|mapa|planta|plano geral|desenho|drawing|diagram|logo|coat of arms|brasao|bandeira de|flag of|selo|stamp|cracha|cranio|crane|sketch|plan of|acervo|caricatura|cartoon|grafico|chart|show de|show of|concert|protest|protesto|manifestac|cpmi|comissao parlamentar|display|placa|sign\b|1[89]\d\d)")
CRED_CAMARA = "Foto de arquivo: Câmara dos Deputados (foto oficial; uso livre com crédito)"
CRED_SENADO = "Foto de arquivo: Agência Senado (foto oficial; reprodução livre com crédito)"
LARG, ALT_MAX, ALVO_KB = 640, 800, 60
RETER_DIAS = 120  # pessoa que saiu do feed continua no acervo por esse tempo

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
# retratos procurados no Commons além das pessoas acima: STF, ministérios e governos estaduais. É só um índice de NOMES
# (a foto é da pessoa, qualquer que seja o cargo hoje); cargos mudam, por isso não vão para o app como fato.
# Quem não estiver aqui e aparecer em feed.pessoas com nome completo entra sozinho.
CURADOS = {
    "stf": {
        "Dias Toffoli": ["Toffoli"], "Luiz Fux": ["Fux"], "Cristiano Zanin": ["Zanin"], "Jorge Messias": ["Jorge Messias"],
        "Luís Roberto Barroso": ["Barroso"],
    },
    "ministros": {
        "Dario Durigan": ["Durigan"], "Rui Costa": ["Rui Costa"], "Sidônio Palmeira": ["Sidônio"], "Mauro Vieira": ["Mauro Vieira"],
        "José Múcio": ["Múcio"], "Ricardo Lewandowski": ["Lewandowski"], "Camilo Santana": ["Camilo Santana", "Camilo"],
        "Alexandre Padilha": ["Padilha"], "Marina Silva": ["Marina Silva"], "Wellington Dias": ["Wellington Dias"],
        "Carlos Fávaro": ["Fávaro"], "Paulo Teixeira": ["Paulo Teixeira"], "Luiz Marinho": ["Luiz Marinho"],
        "Silvio Costa Filho": ["Silvio Costa Filho"], "Renan Filho": ["Renan Filho"], "Alexandre Silveira": ["Alexandre Silveira"],
        "Waldez Góes": ["Waldez"], "Jader Filho": ["Jader Filho"], "André Fufuca": ["Fufuca"], "Celso Sabino": ["Celso Sabino"],
        "Margareth Menezes": ["Margareth Menezes"], "Anielle Franco": ["Anielle"], "Sônia Guajajara": ["Guajajara"],
        "Macaé Evaristo": ["Macaé"], "Esther Dweck": ["Dweck"], "Luciana Santos": ["Luciana Santos"], "Márcio França": ["Márcio França"],
        "Paulo Pimenta": ["Pimenta"], "Wolney Queiroz": ["Wolney"], "Marcos Amaro": ["Marcos Amaro"],
    },
    "governadores": {
        "Gladson Cameli": ["Gladson"], "Paulo Dantas": ["Paulo Dantas"], "Clécio Luís": ["Clécio"], "Wilson Lima": ["Wilson Lima"],
        "Jerônimo Rodrigues": ["Jerônimo"], "Elmano de Freitas": ["Elmano"], "Ibaneis Rocha": ["Ibaneis"],
        "Renato Casagrande": ["Casagrande"], "Carlos Brandão": ["Carlos Brandão"], "Mauro Mendes": ["Mauro Mendes"],
        "Eduardo Riedel": ["Riedel"], "Helder Barbalho": ["Helder"], "João Azevêdo": ["João Azevêdo"], "Raquel Lyra": ["Raquel Lyra"],
        "Rafael Fonteles": ["Fonteles"], "Cláudio Castro": ["Cláudio Castro"], "Fátima Bezerra": ["Fátima Bezerra"],
        "Marcos Rocha": ["Marcos Rocha"], "Antonio Denarium": ["Denarium"], "Jorginho Mello": ["Jorginho Mello"],
        "Fábio Mitidieri": ["Mitidieri"], "Wanderlei Barbosa": ["Wanderlei Barbosa"],
    },
}
# lugares e assuntos recorrentes do Brasil (Política e Economia primeiro). Mesmo formato de ASSUNTOS.
ASSUNTOS_BR = {
    "Congresso": (["Congresso", "PEC", "LDO", "Orçamento de", "emendas parlamentares", "emenda parlamentar"], "Congresso Nacional Brasília cúpulas", ["congresso nacional"], ["politica", "economia"]),
    "Câmara plenário": (["Câmara", "deputados", "Deputados"], "plenário Câmara dos Deputados sessão", ["câmara dos deputados", "camara dos deputados", "plenário ulysses"], ["politica", "economia"]),
    "Senado plenário": (["Senado", "senadores", "Senadores"], "plenário Senado Federal sessão", ["senado federal", "plenário do senado"], ["politica", "economia"]),
    "Planalto": (["Planalto", "Presidência da República"], "Palácio do Planalto fachada", ["palácio do planalto", "palacio do planalto"], None),
    "STF": (["STF", "Supremo"], "Supremo Tribunal Federal prédio", ["supremo tribunal federal"], None),
    "TSE": (["TSE", "Justiça Eleitoral"], "Tribunal Superior Eleitoral sede", ["tribunal superior eleitoral"], None),
    "Banco Central": (["Banco Central", "Copom", "Selic", "juros", "Juros", "BC"], "Banco Central do Brasil edifício sede", ["banco central"], None),
    "B3 e Bolsa": (["Ibovespa", "Bolsa", "B3", "ações"], "B3 Bolsa de Valores São Paulo", ["b3", "bovespa", "bolsa de valores"], None),
    "Esplanada": (["Esplanada", "ministérios"], "Esplanada dos Ministérios Brasília", ["esplanada dos ministérios", "esplanada dos ministerios"], None),
    "Fazenda": (["Fazenda", "fiscal", "arcabouço", "meta fiscal", "Tesouro"], "Ministério da Fazenda Brasília prédio", ["ministério da fazenda", "ministerio da fazenda"], None),
    "Itamaraty": (["Itamaraty", "diplomacia", "embaixador"], "Palácio Itamaraty Brasília", ["itamaraty"], None),
    "Polícia Federal": (["PF", "Polícia Federal"], "Polícia Federal sede Brasília", ["polícia federal", "policia federal"], None),
    "porto": (["porto", "Porto de", "exportações", "importações", "tarifaço", "tarifas", "comércio exterior"], "Porto de Santos contêineres navio", ["porto de santos", "port of santos", "porto de paranaguá"], None),
    "refinaria": (["refinaria", "Refinaria", "refino"], "refinaria Petrobras Brasil", ["refinaria", "refinery"], None),
    "escola pública": (["escola", "escolas", "Escola", "alunos", "professores", "ensino médio"], "escola pública sala de aula Brasil alunos", ["sala de aula", "escola estadual", "escola municipal"], None),
    "hospital e SUS": (["SUS", "hospital", "Hospital", "hospitais", "UPA", "Saúde"], "hospital público Brasil SUS", ["hospital", "sus "], None),
    "polícia": (["polícia", "Polícia Militar", "PM", "policiais", "operação policial"], "viatura Polícia Militar Brasil", ["polícia militar", "policia militar", "viatura"], None),
    "chuva e enchente": (["chuva", "chuvas", "Chuva", "enchente", "enchentes", "temporal", "alagamento", "inundação", "Defesa Civil"], "enchente Brasil inundação rua", ["enchente", "inundação", "inundacao", "flood"], None),
    "seca": (["seca", "Seca", "estiagem", "crise hídrica"], "seca rio Brasil estiagem", ["seca", "drought", "estiagem"], None),
    "agro e colheita": (["safra", "soja", "milho", "colheita", "agronegócio", "agro"], "colheita soja colheitadeira Brasil", ["soja", "colheita", "harvest"], None),
    "Bolsa Família": (["Bolsa Família"], "agência Caixa Econômica Federal fachada", ["caixa econômica", "caixa economica"], None),
    "dinheiro": (["dólar", "Dólar", "câmbio", "Câmbio", "inflação", "IPCA", "salário mínimo", "Desenrola", "dívidas"], "cédulas de real moeda brasileira", ["cédulas de real", "cedulas de real", "notas de real", "brazilian real"], ["economia"]),
    "supermercado": (["preços", "alimentos", "supermercado", "cesta básica"], "supermercado Brasil gôndola", ["supermercado"], None),
    "urna": (["urna", "urnas", "apuração", "votos válidos", "eleição", "Eleição", "eleitores"], "urna eletrônica brasileira", ["urna"], ["politica"]),
}
PADRAO = {"politica": "politica/Congresso", "economia": "economia/Mercados", "brasil": "brasil/Sociedade", "mundo": "mundo/Europa",
          "educacao": "educacao/Políticas", "esportes": "esportes/Brasileirão"}


ASSUNTOS.update(ASSUNTOS_BR)
# nome parlamentar de uma palavra só que também é palavra comum (não vira chave sozinho)
COMUNS = {"bacelar", "general", "pastor", "delegado", "coronel", "capitao", "sargento", "professor", "professora", "doutor",
          "doutora", "padre", "irmao", "irma", "pastora", "cabo", "major", "tenente", "missionario", "juninho", "zezinho"}


def norm(s):
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", norm(s)).strip("-")[:40] or "foto"


def get_json(url, tempo=25):
    req = urllib.request.Request(url, headers=dict(UA, Accept="application/json"))
    with urllib.request.urlopen(req, timeout=tempo) as r:
        return json.loads(r.read().decode("utf-8"))


def get_bytes(url, tempo=30, maximo=8_000_000):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=tempo) as r:
        b = r.read(maximo + 1)
    if len(b) > maximo: raise ValueError("arquivo grande demais")
    return b


def api(params):
    params = dict(params, format="json", formatversion="2", origin="*")
    return get_json(API + "?" + urllib.parse.urlencode(params))


WIKI = re.compile(r"^https://upload\.wikimedia\.org/wikipedia/([a-z]+)/([0-9a-f])/([0-9a-f]{2})/([^/?#]+\.(?:jpe?g|png|webp))$", re.I)


def miniatura(u, w=960):
    """Miniatura do Wikimedia (só larguras padrão: 500, 960…); outros endereços ficam como estão."""
    m = WIKI.match(u or "")
    return f"https://upload.wikimedia.org/wikipedia/{m[1]}/thumb/{m[2]}/{m[3]}/{m[4]}/{w}px-{m[4]}" if m else u


def limpa(htm):
    t = html.unescape(re.sub(r"<[^>]+>", "", str(htm or ""))).strip()
    return re.sub(r"\s+", " ", t)[:70]


def licenca_do_credito(c):
    m = re.search(r"\(([^()]*)\)\s*$", str(c or ""))
    return m.group(1) if m else ""


def busca(consulta, chaves, n=4, exige_todos=False, evitar=()):
    """Fotos livres do Commons cujo nome do arquivo contém as palavras-chave (licença conferida arquivo a arquivo)."""
    try:
        d = api({"action": "query", "generator": "search", "gsrsearch": f"{consulta} filetype:bitmap", "gsrnamespace": "6", "gsrlimit": "40",
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
        if exige_todos and re.search(r"\b(pec|sessao|reuniao|cerimonia|encontro|audiencia|plenario|congresso nacional|descerramento|entrega|visita|lancamento|meeting|summit|welcomes|hosts|bilateral|visits|greets|recebe|cumprimenta|coletiva|entrevista|plenaria)\b", t2): nota_outro -= 5
        nota = nota_outro + (3 if re.search(r"cropped|retrato|portrait|oficial|official", t2) else 0) - (2 if exige_todos and re.search(r" e | and | com | with |, ", t2) else 0)
        out.append({"url": url, "credito": f"Foto de arquivo: {autor}/Wikimedia Commons ({lic})", "pagina": (ii.get("descriptionurl") or "").split("?")[0],
                    "licenca": lic, "autor": autor, "fonte": "Wikimedia Commons", "_n": nota})
    out.sort(key=lambda x: -x["_n"])
    if any(x["_n"] >= 0 for x in out): out = [x for x in out if x["_n"] >= 0]  # foto de grupo só se não houver retrato sozinho
    out = [{k: v for k, v in x.items() if k != "_n"} for x in out[:n]]
    time.sleep(0.4)
    return out


# ---------- fontes oficiais: Câmara e Senado ----------
def _https(u):
    u = str(u or "").strip()
    return "https://" + u[7:] if u.startswith("http://") else u


def deputados():
    """[{nome, partido, uf, id, foto}] dos deputados em exercício (API Dados Abertos da Câmara, paginada)."""
    out, pag = [], 1
    while pag <= 10:
        d = get_json(CAMARA.format(pag))
        for x in d.get("dados") or []:
            if not isinstance(x, dict): continue
            foto = _https(x.get("urlFoto"))
            if not re.match(r"^https://www\.camara\.leg\.br/internet/deputado/bandep/\d+\.jpe?g$", foto, re.I): continue
            if x.get("nome"): out.append({"nome": str(x["nome"]).strip(), "partido": x.get("siglaPartido") or "", "uf": x.get("siglaUf") or "", "id": x.get("id"), "foto": foto})
        if not any(isinstance(l, dict) and l.get("rel") == "next" for l in d.get("links") or []): break
        pag += 1
        time.sleep(0.3)
    return out


def senadores():
    """[{nome, partido, uf, id, foto}] dos senadores em exercício (API Dados Abertos do Senado)."""
    d = get_json(SENADO)
    ps = (((d.get("ListaParlamentarEmExercicio") or {}).get("Parlamentares") or {}).get("Parlamentar")) or []
    if isinstance(ps, dict): ps = [ps]
    out = []
    for p in ps:
        i = (p or {}).get("IdentificacaoParlamentar") or {}
        foto = _https(i.get("UrlFotoParlamentar"))
        if not re.match(r"^https://www\.senado\.leg\.br/senadores/img/fotos-oficiais/senador\d+\.jpe?g$", foto, re.I): continue
        if i.get("NomeParlamentar"): out.append({"nome": str(i["NomeParlamentar"]).strip(), "partido": i.get("SiglaPartidoParlamentar") or "", "uf": i.get("UfParlamentar") or "", "id": i.get("CodigoParlamentar"), "foto": foto})
    return out


def chaves_parlamentar(nome):
    """Nome parlamentar como chave; nome de uma palavra só entra se for raro (Tiririca sim, Pastor não)."""
    nome = re.sub(r"\s+", " ", nome).strip()
    if len(nome.split()) >= 2: return [nome]
    return [nome] if len(nome) >= 5 and norm(nome) not in COMUNS else []


# ---------- guardar no repositório (leve) ----------
def jpeg_dims(b):
    """(largura, altura) de um JPEG, lendo o cabeçalho (sem bibliotecas)."""
    i = 2
    while i + 9 < len(b):
        if b[i] != 0xFF: i += 1; continue
        m = b[i + 1]
        if m in (0xC0, 0xC1, 0xC2):
            return (b[i + 7] << 8) + b[i + 8], (b[i + 5] << 8) + b[i + 6]
        i += 2 + (b[i + 2] << 8) + b[i + 3]
    return None, None


def converter(dados, retrato):
    """WebP de até 640 px de largura e ~60 KB (Pillow). Sem Pillow: None (o chamador decide)."""
    try:
        from PIL import Image, ImageOps
    except Exception:
        return None
    im = Image.open(io.BytesIO(dados))
    im = ImageOps.exif_transpose(im).convert("RGB")
    w, h = im.size
    if w > LARG: im = im.resize((LARG, max(1, round(h * LARG / w))), Image.LANCZOS); w, h = im.size
    if h > ALT_MAX:  # muito alta: retrato corta de cima (o rosto), o resto pelo meio
        y0 = 0 if retrato else (h - ALT_MAX) // 2
        im = im.crop((0, y0, w, y0 + ALT_MAX)); h = ALT_MAX
    for q in (74, 64, 54, 46):
        buf = io.BytesIO(); im.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= ALVO_KB * 1024: break
    if buf.tell() > 95 * 1024: return False
    return buf.getvalue(), w, h, "webp"


def guardar(foto, base, pasta, retrato, E):
    """Garante foto["local"] (arquivo no acervo). E = estado {raiz, restam, total, max, baixar}. True se ficou local."""
    loc = foto.get("local")
    if isinstance(loc, str) and loc.startswith(pasta + "/") and os.path.exists(os.path.join(E["raiz"], loc)): return True
    foto.pop("local", None); foto.pop("w", None); foto.pop("h", None)
    if not E["baixar"] or E["restam"] <= 0 or E["total"] >= E["max"]: return False
    url = foto.get("url") or ""
    try:
        dados = get_bytes(miniatura(url, 960))
        conv = converter(dados, retrato)
        if conv is None:  # sem Pillow: guarda o JPEG pequeno como veio
            if WIKI.match(url): dados = get_bytes(miniatura(url, 500))
            if dados[:2] != b"\xff\xd8" or len(dados) > 90 * 1024: return False
            w, h = jpeg_dims(dados); conv = (dados, w, h, "jpg")
        if conv is False: return False
    except Exception as e:
        print("  download falhou:", url[:90], repr(e)[:80]); return False
    b, w, h, ext = conv
    rel = f"{pasta}/{slug(base)}-{hashlib.sha1(url.encode('utf-8')).hexdigest()[:8]}.{ext}"
    os.makedirs(os.path.dirname(os.path.join(E["raiz"], rel)), exist_ok=True)
    with open(os.path.join(E["raiz"], rel), "wb") as fh: fh.write(b)
    foto["local"] = rel
    if w and h: foto["w"], foto["h"] = w, h
    E["restam"] -= 1; E["total"] += len(b); E["novas"] += 1
    time.sleep(0.15)
    return True


def tamanho_pasta(p):
    t = 0
    for dp, _, fs in os.walk(p):
        for f in fs: t += os.path.getsize(os.path.join(dp, f))
    return t


# ---------- escolha estável (não troca foto todo dia) ----------
def valida_velha(f):
    return isinstance(f, dict) and isinstance(f.get("url"), str) and f["url"].startswith("https://") and not FORA.search(norm(f["url"].rsplit("/", 1)[-1]).replace("_", " "))


def completa(f):
    f = dict(f)
    if not f.get("licenca"):
        lic = licenca_do_credito(f.get("credito"))
        if lic: f["licenca"] = lic
    if not f.get("fonte"):
        u = f.get("url", "")
        f["fonte"] = "Wikimedia Commons" if "wikimedia.org" in u else "Câmara dos Deputados" if "camara.leg.br" in u else "Agência Senado" if "senado.leg.br" in u else ""
        if not f["fonte"]: f.pop("fonte")
    return f


def junta(velhas, novas, n):
    out, vistos = [], set()
    for f in list(velhas or []) + list(novas or []):
        if not valida_velha(f) or f["url"] in vistos: continue
        vistos.add(f["url"]); out.append(completa(f))
        if len(out) >= n: break
    return out


def no_titulo(titulos, chaves):
    for t in titulos:
        for k in chaves:
            if isinstance(k, str) and k and re.search(r"(^|[^\w])" + re.escape(k) + r"($|[^\w])", t): return True
    return False


def main(argv):
    opts = {"--pasta": "acervo", "--limite": "120", "--max-mb": "90"}
    pos, flags, i = [], set(), 0
    while i < len(argv):
        a = argv[i]
        if a in opts and i + 1 < len(argv): opts[a] = argv[i + 1]; i += 2; continue
        if a in ("--sem-baixar", "--podar", "--sem-rede-oficial"): flags.add(a); i += 1; continue
        pos.append(a); i += 1
    if len(pos) < 2: print(__doc__); return 2
    feed, saida = pos[0], pos[1]
    pasta = opts["--pasta"].strip("/") or "acervo"
    raiz = os.path.dirname(os.path.abspath(saida))
    try: F = json.load(open(feed, encoding="utf-8"))
    except Exception: F = {}
    velho = {}
    if os.path.exists(saida):
        try: velho = json.load(open(saida, encoding="utf-8"))
        except Exception: velho = {}
    VP, VA, VT = velho.get("pessoas") or {}, velho.get("assuntos") or {}, velho.get("temas") or {}
    titulos = [str((p.get("neutro") or {}).get("titulo") or "") + " " + str(p.get("subtitulo") or "") for p in F.get("pautas") or [] if isinstance(p, dict)]

    # 1) pessoas procuradas no Commons: as fixas, o índice de cargos e as do feed
    pessoas, grupo = {}, {}
    for nome, ch in PESSOAS.items(): pessoas[nome] = ch; grupo[nome] = "curado"
    for g, lista in CURADOS.items():
        for nome, ch in lista.items():
            if nome not in pessoas: pessoas[nome] = ch; grupo[nome] = g
    hoje = datetime.now(SP).date().isoformat()
    lim = (datetime.now(SP).date() - timedelta(days=RETER_DIAS)).isoformat()
    visto = {}
    for nome in (F.get("pessoas") or {}):
        if isinstance(nome, str) and len(nome.split()) >= 2 and nome not in pessoas and not any(nome in v for v in pessoas.values()):
            pessoas[nome] = [nome]; grupo[nome] = "feed"; visto[nome] = hoje
    # quem saiu do feed fica por RETER_DIAS (sem buscar de novo): não baixa a mesma foto duas vezes
    for nome, x in VP.items():
        if isinstance(x, dict) and x.get("grupo") == "feed" and nome not in pessoas and str(x.get("visto") or "") >= lim:
            pessoas[nome] = x.get("chaves") or [nome]; grupo[nome] = "feed"; visto[nome] = x["visto"]
    out_p, out_t, out_a = {}, {}, {}
    for nome, chaves in pessoas.items():
        n = 3 if grupo[nome] == "curado" else 2
        antes = (VP.get(nome) or {}).get("fotos") or []
        antes = [f for f in antes if "wikimedia.org" in str(f.get("url", ""))]
        fotos = junta(antes, [], n)
        if len(fotos) < 2 and visto.get(nome, hoje) == hoje:  # só procura quem ainda tem menos de 2 fotos (o resto fica como está)
            outros = [o for o in pessoas if o != nome and o.split()[-1] not in nome]
            novas = busca(f'intitle:"{nome}"', [nome], n=3, exige_todos=True, evitar=outros)
            if not novas and len(nome.split()) > 2:  # ex.: Luiz Inácio Lula da Silva → "Lula"
                novas = busca(f'intitle:"{chaves[0]}"', [chaves[0]], n=3, exige_todos=True, evitar=outros)
            fotos = junta(fotos, novas, n)
        if fotos:
            out_p[nome] = {"chaves": list(chaves), "grupo": grupo[nome], "fotos": [dict(f, alt=f"Foto de arquivo: {nome}") for f in fotos]}
            if nome in visto: out_p[nome]["visto"] = visto[nome]
        print(f"{nome}: {len(fotos)}")

    # 2) retratos oficiais: Câmara (513) e Senado (81). Se a API falhar, ficam os de antes.
    idx = {norm(k): k for k in out_p}
    for g, fn, cargo, cred, fonte in (("camara", deputados, "Deputado federal", CRED_CAMARA, "Câmara dos Deputados"),
                                      ("senado", senadores, "Senador", CRED_SENADO, "Agência Senado")):
        lista = []
        if "--sem-rede-oficial" not in flags:
            try: lista = fn()
            except Exception as e: print(f"{g}: API falhou", repr(e)[:120])
        if not lista:  # mantém os do arquivo anterior
            for nome, x in VP.items():
                if isinstance(x, dict) and x.get("grupo") == g:
                    lista.append({"nome": nome, "partido": x.get("partido", ""), "uf": x.get("uf", ""), "id": x.get("id"),
                                  "foto": next((f.get("url") for f in x.get("fotos") or [] if fonte == f.get("fonte")), None), "_velho": x})
        print(f"{g}: {len(lista)} parlamentares")
        for d in lista:
            if not d.get("foto"): continue
            nome = d["nome"]
            oficial = {"url": d["foto"], "credito": cred, "licenca": "uso livre com crédito", "autor": fonte, "fonte": fonte, "alt": f"Foto de arquivo: {nome}"}
            ant = (VP.get(nome) or {}).get("fotos") or []
            velho_of = next((f for f in ant if f.get("url") == d["foto"]), None)
            if velho_of and velho_of.get("local"): oficial["local"] = velho_of["local"]; oficial.update({k: velho_of[k] for k in ("w", "h") if k in velho_of})
            info = {"cargo": f"{cargo} ({d['partido']}-{d['uf']})" if d.get("partido") and d.get("uf") else cargo, "partido": d.get("partido", ""), "uf": d.get("uf", ""), "grupo": g}
            if d.get("id") is not None: info["id"] = str(d["id"])
            k = idx.get(norm(nome))
            if k:  # já está (Commons): o retrato oficial entra primeiro
                e = out_p[k]; e.update(info); e["grupo_busca"] = grupo.get(k, "")
                e["fotos"] = [oficial] + [f for f in e["fotos"] if f.get("url") != d["foto"]][:2]
                if nome not in e["chaves"] and chaves_parlamentar(nome): e["chaves"].append(nome)
            else:
                ch = chaves_parlamentar(nome)
                if not ch: continue
                out_p[nome] = dict(info, chaves=ch, fotos=[oficial]); idx[norm(nome)] = nome

    # 3) assuntos de cada seção (temas) e assuntos citados no título
    for k, qs in TEMAS.items():
        fotos = junta(VT.get(k) or [], [], 4)
        if len(fotos) < 3:
            for q, ch in qs:
                fotos = junta(fotos, busca(q, ch, n=3), 4)
                if len(fotos) >= 4: break
        if fotos: out_t[k] = [dict(f, alt=f.get("alt") or f"Foto de arquivo: {qs[0][0]}") for f in fotos[:4]]
        print(f"{k}: {len(fotos)}")
    for nome, (chaves, q, ch, secs) in ASSUNTOS.items():
        fotos = junta(((VA.get(nome) or {}).get("fotos")) or [], [], 3)
        if len(fotos) < 2: fotos = junta(fotos, busca(q, ch, n=3), 3)
        if fotos:
            out_a[nome] = {"chaves": chaves, "fotos": [dict(f, alt=f.get("alt") or f"Foto de arquivo: {q}") for f in fotos]}
            if secs: out_a[nome]["secoes"] = secs
        print(f"assunto {nome}: {len(fotos)}")
    if not out_p and not out_t: print("nada encontrado: arquivo anterior mantido"); return 1

    # 4) guardar no repositório, em lotes: primeiro o que está nas notícias de hoje, depois o resto
    E = {"raiz": raiz, "restam": int(opts["--limite"]), "max": float(opts["--max-mb"]) * 1e6, "baixar": "--sem-baixar" not in flags,
         "total": tamanho_pasta(os.path.join(raiz, pasta)), "novas": 0}
    fila = []
    for nome, x in out_p.items():
        hoje = no_titulo(titulos, x["chaves"])
        ordem = 0 if hoje else 1 if x.get("grupo") in ("curado", "stf", "ministros", "governadores", "feed") or x.get("grupo_busca") else 3 if x.get("grupo") == "senado" else 4
        for j, f in enumerate(x["fotos"]): fila.append((ordem, j, f, nome, f"{pasta}/p", True))
    for nome, x in out_a.items():
        for j, f in enumerate(x["fotos"]): fila.append((0 if no_titulo(titulos, x["chaves"]) else 2, j, f, nome, f"{pasta}/a", False))
    for k, l in out_t.items():
        for j, f in enumerate(l): fila.append((2, j, f, k.replace("/", "-"), f"{pasta}/t", False))
    fila.sort(key=lambda z: (z[0], z[1]))
    locais = sum(1 for o, j, f, b, pp, r in fila if guardar(f, b, pp, r, E))
    for x in out_p.values(): x.pop("grupo_busca", None)
    usados = {f.get("local") for _, _, f, _, _, _ in fila if f.get("local")}
    if "--podar" in flags:  # arquivos do acervo que ninguém usa mais
        for dp, _, fs in os.walk(os.path.join(raiz, pasta)):
            for fn in fs:
                rel = os.path.relpath(os.path.join(dp, fn), raiz).replace(os.sep, "/")
                if rel not in usados: os.remove(os.path.join(dp, fn)); print("podado:", rel)
    res = {"versao": 2, "gerado": datetime.now(SP).isoformat(timespec="minutes"), "padrao": PADRAO, "pessoas": out_p, "assuntos": out_a, "temas": out_t,
           "acervo": {"pasta": pasta, "fotos": len(fila), "no_repositorio": locais, "mb": round(tamanho_pasta(os.path.join(raiz, pasta)) / 1e6, 1)},
           "licencas": "Wikimedia Commons: CC BY, CC BY-SA, CC0 ou domínio público (conferida por arquivo). Câmara dos Deputados e Agência Senado: uso livre com crédito."}
    with open(saida, "w", encoding="utf-8") as fh: json.dump(res, fh, ensure_ascii=False, separators=(",", ":"))
    print("gravado:", len(out_p), "pessoas,", len(out_a), "assuntos,", len(out_t), "temas ·", locais, "de", len(fila), "fotos no repositório (", E["novas"], "novas ) ·", res["acervo"]["mb"], "MB")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
