#!/usr/bin/env python3
"""Verbetes do catálogo de fotos por assunto (26/11). Cada verbete:
  (id, rótulo em português, tipo, seções, subtemas, palavras, consultas)
- tipo: "ilustrativa" (cena genérica), "lugar" (cidade, país, prédio com nome) ou "instituicao".
- seções: em que editorias o verbete pode ser usado ([] = todas).
- palavras: trechos (sem acento, minúsculas; valem como regex com início de palavra) que, no título ou no subtítulo
  da notícia, chamam o verbete. A ORDEM da lista é a prioridade: o mais específico vem antes.
- consultas: "busca no Commons|palavra-chave,palavra-chave" (a palavra-chave tem de estar no nome, na descrição ou
  nas categorias do arquivo).
Para acrescentar um assunto, ponha uma linha aqui e rode tools/acervo_catalogo.py.
"""
import re, unicodedata

def _s(t):
    t = unicodedata.normalize("NFD", t); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")

def I(vid, rot, sec, pal, cons, sub=()): return (vid, rot, "ilustrativa", list(sec), list(sub), list(pal), list(cons))
def L(vid, rot, sec, pal, cons, sub=()): return (vid, rot, "lugar", list(sec), list(sub), list(pal), list(cons))
def N(vid, rot, sec, pal, cons, sub=()): return (vid, rot, "instituicao", list(sec), list(sub), list(pal), list(cons))

V = []

# ---------- clima e desastres ----------
V += [
 I("enchente", "Rua alagada depois de chuva forte", [], ["enchente", "alagament", "alaga", "inundac", "cheia d", "transbord"], ["flooded street Brazil|flood,enchente,alagamento", "urban flooding street cars|flood", "enchente rua alagada|enchente,alagad,alagamento,inunda", "flooding Rio Grande do Sul 2024|flood,enchente"]),
 I("deslizamento", "Deslizamento de terra em encosta", [], ["deslizament", "desliza", "soterra", "desmoronament"], ["landslide houses hillside|landslide,deslizamento", "deslizamento de terra|deslizamento,landslide", "landslide road blocked debris|landslide", "mudslide damage houses|mudslide,landslide"]),
 I("temporal", "Céu de tempestade com nuvens carregadas", [], ["tempora", "tempestade", "chuvas? fort", "chuva", "frente fria", "ciclone", "vendaval", "granizo", "raio"], ["storm clouds over city|storm,cumulonimbus,thunderstorm", "heavy rain street|rain", "lightning over city night|lightning"]),
 I("frio", "Geada e manhã de frio intenso", [], ["geada", "onda de frio", "frio", "neve", "nevasca"], ["frost on grass morning|frost,geada", "snow covered street winter|snow"]),
 I("calor", "Sol forte e termômetro em dia de calor", [], ["onda de calor", "calor", "temperatura recorde", "sensacao termica"], ["heat wave sun city|heat,sun", "thermometer high temperature|thermometer", "people beach crowded hot day Rio|beach,praia", "sun sky hot summer|sun"]),
 I("seca", "Solo rachado pela estiagem", [], ["seca\\b", "estiagem", "falta de chuva", "racionamento de agua"], ["drought cracked soil|drought,cracked", "dry riverbed drought|drought,dry"]),
 I("queimada", "Fogo em vegetação e fumaça", [], ["queimada", "incendio florestal", "fogo no pantanal", "focos de incendio", "fumaca"], ["wildfire forest fire smoke|wildfire,forest fire,queimada", "queimada cerrado|queimada,fire"]),
 I("incendio-urbano", "Bombeiros combatem incêndio em prédio", [], ["incendio", "bombeiro", "chamas", "explos"], ["firefighters building fire|firefighter,fire", "fire truck firefighters hose|firefighter,fire engine", "bombeiros incêndio|bombeiro,incêndio,incendio", "firefighters fighting fire|firefight"]),
 I("terremoto", "Prédios danificados por terremoto", ["mundo", "brasil"], ["terremoto", "tremor", "sismo", "abalo sismico"], ["earthquake damaged buildings|earthquake", "earthquake rubble rescue|earthquake", "earthquake damage collapsed building|earthquake,collapsed"]),
 I("furacao", "Furacão visto de satélite", ["mundo"], ["furacao", "tufao", "tornado"], ["hurricane satellite image|hurricane,typhoon", "tornado funnel cloud|tornado"]),
 I("vulcao", "Vulcão em erupção", ["mundo"], ["vulcao", "erupcao"], ["volcano eruption ash plume|volcano,eruption", "erupting volcano lava|erupt,lava", "volcanic eruption|eruption"]),
 I("resgate", "Equipe de resgate e defesa civil em ação", [], ["resgate", "defesa civil", "desaparecid", "buscas", "desabament", "desabou"], ["rescue team search disaster|rescue", "defesa civil equipe|defesa civil,rescue"]),
 I("queda-arvore", "Árvore caída depois de vendaval", [], ["queda de arvore", "arvore cai", "arvores caid"], ["fallen tree street storm|fallen tree,tree"]),
]

# ---------- saúde ----------
V += [
 I("uti", "Leito de UTI com monitores", [], ["uti\\b", "internad", "estado grave", "boletim medico", "cirurgia", "hospitalizad", "alta hospitalar"], ["intensive care unit bed monitor|intensive care,icu", "hospital bed patient room|hospital"]),
 I("hospital", "Fachada e corredor de hospital", [], ["hospital", "pronto-socorro", "upa\\b", "santa casa", "fila do sus", "\\bsus\\b"], ["hospital building entrance Brazil|hospital", "hospital corridor|hospital"]),
 I("ambulancia", "Ambulância do Samu", [], ["ambulancia", "samu", "socorrid"], ["ambulância SAMU|samu,ambul", "ambulance emergency Brazil|ambulance,ambul"]),
 I("vacina", "Aplicação de vacina", [], ["vacina", "imuniza", "dose de reforco"], ["vaccination syringe arm|vaccin", "vaccine vials|vaccine"]),
 I("epidemia", "Profissionais com roupa de proteção contra vírus", [], ["ebola", "epidemia", "pandemia", "surto", "virus", "covid", "mpox", "gripe aviaria", "\\boms\\b"], ["ebola treatment unit protective suits|ebola", "health workers protective equipment outbreak|outbreak,protective,ppe", "virus electron micrograph|virus,micrograph"]),
 I("dengue", "Mosquito Aedes aegypti", [], ["dengue", "aedes", "zika", "chikungunya", "febre amarela", "malaria"], ["Aedes aegypti mosquito|aedes", "fumigation mosquito control|fumigation,mosquito"]),
 I("remedios", "Medicamentos em prateleira de farmácia", [], ["remedio", "medicament", "farmacia", "anvisa", "ozempic", "generico"], ["pharmacy shelves medicines|pharmacy,medicine", "pills tablets blister|pills,tablet,medic"]),
 I("laboratorio", "Pesquisadora em laboratório", [], ["laboratorio", "pesquisador", "cientista", "estudo mostra", "pesquisa cientifica", "fiocruz", "butantan"], ["scientist laboratory microscope|laboratory,microscope", "laboratory test tubes research|laboratory"]),
 I("medico", "Médico com estetoscópio em consulta", [], ["medic", "consulta", "plano de saude", "planos de saude", "enfermeir", "anestesista", "paciente"], ["doctor stethoscope patient|doctor,stethoscope", "nurse hospital work|nurse"]),
 I("sangue", "Bolsa de sangue em hemocentro", [], ["doacao de sangue", "hemocentro", "transplante", "doacao de orgaos"], ["blood donation bag|blood donation,blood bag"]),
 I("saude-mental", "Pessoa sozinha em banco de praça", [], ["saude mental", "depressao", "ansiedade", "suicid"], ["person sitting alone bench|alone,bench,solitude"]),
]

# ---------- segurança e justiça ----------
V += [
 I("viatura-pm", "Viatura da Polícia Militar", ["brasil", "politica"], ["policia militar", "\\bpm\\b", "pms\\b", "viatura", "patrulha", "tiroteio", "balead"], ["viatura Polícia Militar|polícia militar,policia militar,viatura", "Brazilian military police car|military police,polícia"]),
 I("policia-civil", "Delegacia e Polícia Civil", ["brasil", "politica"], ["policia civil", "delegacia", "delegad", "inquerito", "investigac", "preso", "prisao", "pres[ao]s? em", "mandado"], ["Polícia Civil delegacia|polícia civil,policia civil,delegacia", "police station Brazil|police,delegacia"]),
 I("presidio", "Corredor de presídio com grades", ["brasil", "politica", "mundo"], ["presidio", "penitenciaria", "cadeia", "detento", "sistema prisional", "papuda", "regime fechado", "regime semiaberto", "tornozeleira", "saidinha"], ["prison corridor cells bars|prison,jail,cell", "penitenciária Brasil|penitenci,presídio,prison", "prison cell block interior|prison,cell block,jail", "prison fence barbed wire|prison"]),
 I("tribunal", "Martelo de juiz e sala de tribunal", [], ["julgament", "juri\\b", "condenad", "sentenca", "absolvid", "reus?\\b", "juiz", "tribunal de justica", "\\btj", "habeas corpus", "recurso", "acao penal"], ["judge gavel courtroom|gavel,courtroom", "courtroom interior empty|courtroom", "tribunal do júri sala|tribunal,júri,juri"]),
 I("algemas", "Algemas sobre mesa", ["brasil", "politica", "mundo"], ["algema", "detid", "capturad", "foragid", "extradic"], ["handcuffs|handcuffs", "police arrest handcuffs|handcuff,arrest"]),
 I("armas", "Armas apreendidas pela polícia", ["brasil", "mundo"], ["arma", "fuzil", "pistola", "municao", "desarmament"], ["seized weapons police table|seized,weapons,armas", "armas apreendidas|armas,apreens"]),
 I("drogas", "Apreensão de drogas", ["brasil", "mundo"], ["droga", "cocaina", "maconha", "trafico", "narcotraf", "cartel", "faccao", "\\bpcc\\b", "comando vermelho", "crime organizado"], ["drug seizure cocaine packages|seizure,cocaine,drug", "apreensão de drogas|apreens,droga"]),
 I("operacao-policial", "Agentes em operação policial", ["brasil", "politica"], ["operacao", "megaoperacao", "busca e apreensao", "forca nacional", "choque", "\\bbope\\b"], ["police operation officers Brazil|police,polícia,operação", "Força Nacional de Segurança|força nacional,forca nacional"]),
 I("cena-crime", "Fita de isolamento em local de crime", ["brasil", "mundo"], ["homicid", "assassin", "morto a tiros", "feminicid", "latrocin", "chacina", "crime", "atentado", "refens?", "sequestr", "assalto", "roubo"], ["police line do not cross tape|police line,crime scene,police tape", "crime scene investigation forensic|crime scene,forensic"]),
 I("camera-seguranca", "Câmera de vigilância em rua", ["brasil", "mundo"], ["camera de seguranca", "reconhecimento facial", "vigilancia", "monitorament"], ["surveillance camera street|surveillance,cctv", "CCTV cameras pole|cctv", "security camera wall|security camera,cctv"]),
 I("fronteira", "Posto de controle em fronteira", ["brasil", "mundo"], ["fronteira", "imigra", "deportac", "refugiad", "migrante", "visto"], ["border crossing checkpoint|border", "border fence wall|border", "border control passport checkpoint|border control,passport", "refugees border crossing|refugee,border"]),
 N("pf-agentes", "Agentes e viatura da Polícia Federal", ["brasil", "politica", "economia"], ["policia federal", "\\bpf\\b"], ["Polícia Federal viatura|polícia federal,policia federal", "Polícia Federal agentes operação|polícia federal,policia federal"]),
 N("mpf", "Sede do Ministério Público Federal", ["brasil", "politica"], ["ministerio publico", "\\bmpf?\\b", "\\bmp[a-z]{2}\\b", "promotor", "procurador", "denuncia"], ["Procuradoria-Geral da República sede Brasília|procuradoria", "Ministério Público sede prédio|ministério público,ministerio publico"]),
 N("pgr", "Sede da Procuradoria-Geral da República", ["politica", "brasil"], ["\\bpgr\\b", "procurador-geral", "procuradoria-geral", "gonet"], ["Procuradoria-Geral da República Brasília edifício|procuradoria"]),
 N("stj", "Sede do Superior Tribunal de Justiça", ["politica", "brasil"], ["\\bstj\\b", "superior tribunal de justica"], ["Superior Tribunal de Justiça Brasília|superior tribunal de justiça,stj"]),
 N("tcu", "Sede do Tribunal de Contas da União", ["politica", "economia"], ["\\btcu\\b", "tribunal de contas"], ["Tribunal de Contas da União sede|tribunal de contas"]),
 N("oab", "Advogados e sede da OAB", ["politica", "brasil"], ["\\boab\\b", "advogad", "defesa de"], ["Ordem dos Advogados do Brasil sede|ordem dos advogados,oab", "lawyer court documents|lawyer,advogad"]),
]

# ---------- política e instituições ----------
V += [
 N("congresso-ext", "Congresso Nacional, em Brasília", ["politica", "economia"], ["congresso", "\\bpec\\b", "parlament", "bancada", "emendas?\\b", "\\bldo\\b", "orcamento de 20", "sessao conjunta", "veto"], ["Congresso Nacional Brasília cúpulas|congresso nacional,national congress", "National Congress of Brazil building|national congress,congresso"]),
 N("camara-plen", "Plenário da Câmara dos Deputados", ["politica", "economia"], ["camara", "deputad", "motta"], ["plenário Câmara dos Deputados|câmara dos deputados,camara dos deputados,plenário", "Chamber of Deputies Brazil plenary|chamber of deputies,câmara"]),
 N("senado-plen", "Plenário do Senado Federal", ["politica", "economia"], ["senado", "senador", "alcolumbre", "sabatina"], ["Plenário do Senado Federal|senado federal,plenário do senado", "Federal Senate Brazil plenary|senate,senado"]),
 N("planalto", "Palácio do Planalto", ["politica", "economia"], ["planalto", "governo lula", "governo federal", "presidente lula", "ministro d", "ministra d", "reforma ministerial", "medida provisoria", "\\bmp\\b", "decreto", "sancion"], ["Palácio do Planalto fachada|planalto", "Palácio do Planalto rampa|planalto"]),
 N("alvorada", "Palácio da Alvorada", ["politica"], ["alvorada", "jantar com", "reuniao com lula"], ["Palácio da Alvorada|alvorada"]),
 N("esplanada", "Esplanada dos Ministérios", ["politica", "economia"], ["esplanada", "ministerio", "servidores", "concurso", "funcionalismo", "reforma administrativa"], ["Esplanada dos Ministérios Brasília|esplanada"]),
 N("stf-ext", "Supremo Tribunal Federal", ["politica", "brasil", "economia"], ["\\bstf\\b", "supremo", "moraes", "fachin", "gilmar", "barroso", "toffoli", "zanin", "dino", "nunes marques", "mendonca", "fux", "carmen lucia"], ["Supremo Tribunal Federal prédio|supremo tribunal federal", "Supremo Tribunal Federal plenário|supremo tribunal federal"]),
 N("tse-ext", "Tribunal Superior Eleitoral", ["politica"], ["\\btse\\b", "justica eleitoral", "inelegib", "cassac"], ["Tribunal Superior Eleitoral sede|tribunal superior eleitoral"]),
 I("urna", "Urna eletrônica", ["politica"], ["eleic", "urna", "candidat", "pesquisa eleitoral", "datafolha", "quaest", "segundo turno", "primeiro turno", "voto", "titulo de eleitor", "pre-candidat"], ["urna eletrônica brasileira|urna", "Brazilian voting machine|voting machine,urna", "urna eletrônica eleições|urna", "eleições Brasil seção eleitoral votação|eleiç,votação,seção"]),
 N("itamaraty", "Palácio Itamaraty", ["politica", "mundo", "economia"], ["itamaraty", "chanceler", "diplomac", "embaixad", "mauro vieira", "relacoes exteriores"], ["Palácio Itamaraty Brasília|itamaraty"]),
 N("fazenda", "Ministério da Fazenda", ["economia", "politica"], ["fazenda", "haddad", "arcabouco", "meta fiscal", "deficit", "superavit", "gasto", "contas publicas", "ajuste fiscal", "corte de gastos", "tesouro"], ["Ministério da Fazenda Brasília edifício|ministério da fazenda,ministerio da fazenda", "Tesouro Nacional Brasil sede|tesouro"]),
 I("bandeira-brasil", "Bandeira do Brasil hasteada", ["politica", "brasil", "mundo"], ["soberania", "7 de setembro", "independencia", "patria", "brasil e eua", "brasil-eua"], ["Brazil flag waving sky|bandeira do brasil,flag of brazil,brazilian flag"]),
 N("assembleia-sp", "Assembleia Legislativa de São Paulo", ["politica"], ["alesp", "assembleia legislativa de sao paulo"], ["Assembleia Legislativa de São Paulo|assembleia legislativa"]),
 N("alerj", "Assembleia Legislativa do Rio de Janeiro", ["politica"], ["alerj", "assembleia legislativa do rio"], ["Palácio Tiradentes Rio de Janeiro|tiradentes,alerj"]),
 N("bandeirantes", "Palácio dos Bandeirantes, sede do governo paulista", ["politica"], ["tarcisio", "governo de sao paulo", "governo paulista", "bandeirantes"], ["Palácio dos Bandeirantes|bandeirantes", "Palácio dos Bandeirantes fachada São Paulo|bandeirantes", "Palacio dos Bandeirantes Morumbi|bandeirantes"]),
 N("guanabara", "Palácio Guanabara, sede do governo do Rio", ["politica"], ["governo do rio", "governo fluminense", "claudio castro", "guanabara"], ["Palácio Guanabara|guanabara"]),
 I("prefeitura", "Prédio de prefeitura", ["politica", "brasil"], ["prefeit", "vereador", "camara municipal", "municip"], ["prefeitura municipal prédio|prefeitura", "Edifício Matarazzo Prefeitura de São Paulo|matarazzo,prefeitura"]),
 I("microfones", "Microfones em entrevista coletiva", ["politica", "economia", "esportes", "mundo"], ["coletiva", "entrevista", "discurso", "pronunciament", "declarac", "diz que", "afirma", "critica", "rebate"], ["press conference microphones|press conference,microphones", "microphones podium|microphone,podium"]),
 I("documentos", "Pilha de processos e documentos", ["politica", "brasil", "economia"], ["relatorio", "documento", "delacao", "dossie", "\\bcpi\\b", "\\bcpmi\\b", "auditoria", "sigilo", "vazament"], ["stack of documents files paper|documents,files,paperwork", "court files archive shelves|files,archive"]),
]

# ---------- economia ----------
V += [
 N("banco-central", "Sede do Banco Central, em Brasília", ["economia", "politica"], ["banco central", "copom", "selic", "galipolo", "\\bbc\\b", "juros", "politica monetaria", "focus"], ["Banco Central do Brasil edifício sede|banco central", "Central Bank of Brazil building|banco central,central bank of brazil"]),
 I("reais", "Cédulas de real", ["economia", "politica", "brasil", "educacao"], ["\\bipca\\b", "inflac", "salario minimo", "13o", "decimo terceiro", "renda", "auxilio", "bolsa familia", "beneficio", "pagament", "parcela", "pe-de-meia", "reajuste", "\\bpib\\b", "arrecadac", "bilh", "milh"], ["cédulas de real dinheiro|real,reais,cédula,cedula", "Brazilian real banknotes|real banknote,brazilian real,reais"]),
 I("moedas", "Moedas de real", ["economia"], ["poupanca", "moeda", "troco", "centavos", "endividad", "divida", "inadimpl", "credito", "emprestimo", "consignado"], ["moedas de real|moedas,coins,real", "Brazilian real coins|coins,real"]),
 I("dolar", "Notas de dólar", ["economia", "mundo"], ["dolar", "cambio", "moeda americana"], ["US dollar banknotes|dollar,banknote", "one hundred dollar bills|dollar"]),
 I("bolsa", "Painel de cotações da bolsa", ["economia"], ["ibovespa", "bolsa", "\\bb3\\b", "acoes", "investidor", "mercado financeiro", "\\bipo\\b", "dividendo", "lucro", "prejuizo", "balanco", "resultado trimestral"], ["B3 Bolsa de Valores São Paulo pregão|b3,bovespa,bolsa", "stock exchange trading floor screens|stock exchange,trading floor", "stock market ticker board|stock,ticker"]),
 I("wall-street", "Bolsa de Nova York, em Wall Street", ["economia", "mundo"], ["wall street", "nasdaq", "s&p", "dow jones", "nyse", "\\bfed\\b", "federal reserve", "treasur"], ["New York Stock Exchange building Wall Street|new york stock exchange,wall street", "Federal Reserve building Washington|federal reserve"]),
 I("supermercado", "Prateleiras de supermercado", ["economia", "brasil"], ["supermercado", "precos", "cesta basica", "aliment", "carestia", "consumo", "varejo", "custo de vida"], ["supermarket shelves aisle|supermarket", "supermercado Brasil prateleira|supermercado"]),
 I("feira", "Frutas e legumes em feira livre", ["economia", "brasil"], ["feira", "hortifruti", "tomate", "legume", "fruta", "ceasa"], ["feira livre frutas legumes|feira,market", "fruit vegetable market stall|market,vegetable"]),
 I("combustivel", "Bomba de combustível em posto", ["economia", "brasil"], ["gasolina", "diesel", "etanol", "combustive", "posto"], ["gas station fuel pump Brazil|posto,gas station,fuel", "fuel pump nozzle car|fuel,pump,gasoline"]),
 I("gas-cozinha", "Botijões de gás de cozinha", ["economia", "brasil"], ["botijao", "gas de cozinha", "\\bglp\\b"], ["botijão de gás|botij,gas cylinder,lpg", "LPG gas cylinders|lpg,gas cylinder", "botijões de gás GLP|botij,glp", "gas bottles cooking stack|gas bottle,lpg"]),
 I("energia", "Torres de transmissão de energia", ["economia", "brasil"], ["energia", "conta de luz", "apagao", "eletric", "aneel", "bandeira tarifaria", "eletrobras", "blecaute"], ["power transmission towers lines|transmission,power line,pylon", "linhas de transmissão energia|transmiss,energia"]),
 I("hidreletrica", "Usina hidrelétrica", ["economia", "brasil"], ["hidreletrica", "itaipu", "belo monte", "reservatorio"], ["Itaipu dam|itaipu", "hydroelectric dam Brazil|hydroelectric,usina,dam"]),
 I("solar", "Painéis de energia solar", ["economia", "brasil", "mundo"], ["solar", "fotovolt", "energia limpa", "renovave", "transicao energetica"], ["solar panels farm|solar", "wind turbines farm|wind"]),
 I("petroleo", "Plataforma de petróleo no mar", ["economia", "mundo"], ["petroleo", "pre-sal", "barril", "opep", "brent", "margem equatorial", "foz do amazonas"], ["offshore oil platform|oil platform,offshore,oil rig", "plataforma de petróleo Petrobras|plataforma,petrobras"]),
 N("petrobras", "Sede e instalações da Petrobras", ["economia", "politica"], ["petrobras"], ["Petrobras edifício sede Rio|petrobras", "Petrobras refinaria|petrobras"]),
 I("porto", "Contêineres em porto", ["economia", "mundo"], ["exportac", "importac", "tarifa", "tarifaco", "comercio exterior", "balanca comercial", "porto", "\\bomc\\b", "protecion", "acordo comercial", "mercosul", "secao 301"], ["container port cranes ship|container,port", "Porto de Santos contêineres|santos,porto,container", "cargo ship containers sea|container ship,cargo"]),
 I("caminhoes", "Caminhões em rodovia", ["economia", "brasil"], ["caminhon", "frete", "rodovia", "pedagio", "transporte de carga", "logistica", "\\bbr-\\d"], ["trucks highway Brazil|truck,caminh,rodovia", "caminhões rodovia|caminh,rodovia"]),
 I("ferrovia", "Trem de carga em ferrovia", ["economia", "brasil"], ["ferrovia", "trem de carga", "ferrogrão", "ferrograo", "trilhos"], ["freight train Brazil railway|train,ferrovia,railway", "railway tracks freight|railway,freight"]),
 I("soja", "Colheita de soja", ["economia", "brasil"], ["soja", "safra", "agronegocio", "\\bagro\\b", "graos", "plano safra", "colheita", "milho"], ["soybean harvest combine Brazil|soy,soja,harvest", "colheita de soja|soja,colheita", "corn field harvest|corn,maize,milho"]),
 I("cafe", "Grãos e lavoura de café", ["economia"], ["cafe\\b", "cafeicult"], ["coffee plantation Brazil|coffee,café", "coffee beans harvest|coffee"]),
 I("gado", "Rebanho bovino em pasto", ["economia", "brasil"], ["carne", "boi\\b", "gado", "pecuaria", "frigorific", "jbs", "rebanho", "frango", "aftosa"], ["cattle herd pasture Brazil|cattle,gado,nelore", "gado nelore pasto|gado,nelore"]),
 I("trator", "Trator em lavoura", ["economia", "brasil"], ["agricult", "lavoura", "produtor rural", "fertilizante", "agrotoxico", "defensivo"], ["tractor field agriculture|tractor", "crop sprayer field|sprayer,crop"]),
 I("industria", "Linha de montagem em fábrica", ["economia"], ["industria", "fabrica", "montadora", "producao industrial", "automove", "carros", "veiculos", "\\bcni\\b"], ["car assembly line factory|assembly line,factory", "fábrica linha de produção|fábrica,fabrica,factory"]),
 I("siderurgia", "Forno de siderúrgica", ["economia"], ["aco\\b", "siderurg", "aluminio", "metalurg", "csn", "gerdau", "usiminas"], ["steel mill furnace molten|steel", "steel coils factory|steel"]),
 I("obra", "Operários em canteiro de obras", ["economia", "brasil"], ["construcao civil", "obra", "minha casa", "habitac", "\\bpac\\b", "infraestrutura", "empreiteira"], ["construction site workers building|construction", "canteiro de obras|obra,construção,construcao"]),
 I("imoveis", "Prédios residenciais", ["economia", "brasil"], ["imove", "aluguel", "imobiliar", "financiamento imobiliario", "apartament", "moradia", "casa propria"], ["apartment buildings residential skyline|apartment,residential", "prédios residenciais São Paulo|prédios,edifícios,residential"]),
 I("banco-agencia", "Caixas eletrônicos em agência bancária", ["economia", "brasil"], ["banco\\b", "bancos\\b", "agencia bancaria", "caixa economica", "bradesco", "itau", "santander", "nubank", "fintech", "master\\b", "liquidacao extrajudicial", "\\bfgc\\b", "correntista", "\\bpix\\b", "cartao"], ["ATM cash machines bank|atm,cash machine", "agência bancária Brasil|agência,banco,bank"]),
 N("banco-do-brasil", "Agência e sede do Banco do Brasil", ["economia"], ["banco do brasil", "\\bbb\\b"], ["Banco do Brasil edifício sede|banco do brasil", "Banco do Brasil agência|banco do brasil"]),
 N("caixa", "Agência da Caixa Econômica Federal", ["economia", "brasil"], ["caixa economica", "\\bcaixa\\b", "\\bfgts\\b", "loteria", "mega-sena", "mega da virada"], ["Caixa Econômica Federal agência|caixa econ", "Caixa Econômica Federal edifício|caixa econ"]),
 N("bndes", "Sede do BNDES, no Rio", ["economia"], ["bndes"], ["BNDES edifício sede Rio de Janeiro|bndes"]),
 N("receita", "Receita Federal e declaração de imposto", ["economia", "politica"], ["receita federal", "imposto de renda", "\\bir\\b", "\\birpf\\b", "tribut", "imposto", "reforma tributaria", "\\biof\\b", "\\bicms\\b", "sonegac", "isenc", "taxac"], ["Receita Federal prédio|receita federal", "tax form calculator|tax,calculator"]),
 N("inss", "Agência do INSS", ["economia", "brasil", "politica"], ["inss", "aposentad", "previdencia", "pension", "\\bbpc\\b", "pericia"], ["INSS agência Previdência Social|inss,previdência,previdencia", "elderly people queue bench|elderly,idosos"]),
 I("carteira-trabalho", "Carteira de trabalho", ["economia", "brasil", "politica"], ["emprego", "desemprego", "caged", "pnad", "vagas", "carteira assinada", "\\bclt\\b", "6x1", "escala", "jornada", "trabalhador", "demiss", "greve", "sindicat", "salario"], ["carteira de trabalho e previdência social|carteira de trabalho", "workers factory shift|workers,trabalhadores", "office workers desks|office"]),
 I("comercio", "Rua de comércio movimentada", ["economia", "brasil"], ["comercio", "lojas", "vendas", "black friday", "natal movimenta", "shopping", "lojista", "25 de marco"], ["shopping street crowd São Paulo|25 de março,shopping,comércio", "shopping mall interior|shopping mall,mall"]),
 I("entregador", "Entregadores de aplicativo", ["economia", "brasil"], ["entregador", "aplicativo", "ifood", "uber", "motorista de app", "motoboy"], ["food delivery rider motorcycle|delivery", "delivery cyclist bag city|delivery"]),
 I("aviao", "Avião decolando", ["economia", "brasil", "mundo"], ["aviao", "voo", "aerea", "aeroporto", "passagens aereas", "\\banac\\b", "latam", "gol\\b", "azul\\b", "embraer", "boeing", "airbus", "pouso"], ["airliner taking off runway|airliner,takeoff,airplane", "airport terminal passengers|airport", "Embraer E-Jet|embraer"]),
 I("data-center", "Corredor de servidores em data center", ["economia", "mundo"], ["data center", "inteligencia artificial", "\\bia\\b", "openai", "chatgpt", "anthropic", "nvidia", "chips?\\b", "semicondutor", "big techs?", "nuvem", "microsoft", "google", "meta\\b", "amazon", "apple"], ["data center server racks|data center,server", "semiconductor wafer chip|semiconductor,wafer,microchip"]),
 I("celular", "Pessoa usando smartphone", ["economia", "brasil", "mundo", "politica", "educacao"], ["celular", "smartphone", "redes sociais", "whatsapp", "instagram", "tiktok", "\\bx\\b", "aplicativ", "internet", "golpe", "fraude", "bets?\\b", "apostas", "regulacao das redes"], ["person using smartphone hands|smartphone", "smartphone screen apps hand|smartphone"]),
 I("ciberseguranca", "Código em tela de computador", ["economia", "mundo", "brasil"], ["hacker", "ciberataque", "vazamento de dados", "invasao", "ransomware", "pane", "apagao digital", "\\blgpd\\b"], ["computer code screen programming|code,programming", "server room network cables|server,network"]),
 I("mineracao", "Mina a céu aberto", ["economia", "brasil"], ["minera", "minerio", "vale\\b", "garimpo", "terras raras", "litio", "niobio", "ouro"], ["open pit mine trucks|open pit,mine", "Carajás mina minério de ferro|carajás,mina,iron ore", "gold bars|gold bar,gold"]),
 I("telecom", "Antena de telefonia", ["economia", "brasil"], ["5g", "telecom", "anatel", "operadora", "banda larga", "\\bvivo\\b", "\\bclaro\\b", "\\btim\\b", "satelite", "starlink"], ["cell tower antenna 5G|cell tower,antenna,5g", "satellite dish antenna|satellite dish"]),
 I("turismo", "Turistas em praia brasileira", ["economia", "brasil"], ["turis", "feriad", "ferias", "hotel", "praia", "verao", "reveillon"], ["Copacabana beach crowd|copacabana", "praia brasileira turistas|praia,beach"]),
 I("startup", "Reunião de trabalho em escritório", ["economia"], ["startup", "empresa", "fusao", "aquisic", "compra d", "\\bcade\\b", "recuperacao judicial", "falencia", "\\bceo\\b", "conselho de administracao"], ["business meeting office table|meeting,office", "office building glass facade|office building"]),
 I("saneamento", "Estação de tratamento de água", ["economia", "brasil"], ["saneament", "agua", "esgoto", "sabesp", "cedae", "abasteciment"], ["water treatment plant|water treatment", "tap water faucet|tap,faucet"]),
 I("lixo", "Coleta e reciclagem de lixo", ["brasil", "economia"], ["lixo", "reciclage", "aterro", "residuo", "catador"], ["garbage truck waste collection|garbage,waste", "recycling plant sorting|recycling"]),
 N("fmi", "Sede do FMI, em Washington", ["economia", "mundo"], ["\\bfmi\\b", "banco mundial", "fundo monetario"], ["International Monetary Fund headquarters|international monetary fund,imf", "World Bank headquarters building|world bank"]),
 N("omc", "Sede da OMC, em Genebra", ["economia", "mundo"], ["\\bomc\\b", "organizacao mundial do comercio"], ["World Trade Organization headquarters Geneva|world trade organization,wto"]),
 N("opep", "Sede da Opep, em Viena", ["economia", "mundo"], ["opep"], ["OPEC headquarters Vienna|opec"]),
]

# ---------- Brasil: cotidiano, ambiente, sociedade ----------
V += [
 I("onibus", "Ônibus urbano em ponto", ["brasil", "economia"], ["onibus", "tarifa de onibus", "transporte publico", "passagem", "tarifa zero", "\\bbrt\\b"], ["ônibus urbano São Paulo|ônibus,onibus,bus", "city bus stop passengers Brazil|bus"]),
 I("metro", "Estação e trem de metrô", ["brasil", "economia"], ["metro\\b", "\\bcptm\\b", "trem urbano", "linha \\d", "monotrilho", "\\bvlt\\b"], ["Metrô de São Paulo estação|metrô,metro", "subway train platform passengers|subway,metro"]),
 I("transito", "Congestionamento em avenida", ["brasil"], ["transito", "congestionament", "engarrafament", "rodizio", "multa", "\\bcnh\\b", "detran", "motorista"], ["traffic jam São Paulo|traffic,trânsito,congestion", "traffic jam avenue cars|traffic jam,congestion"]),
 I("acidente-estrada", "Rodovia com sinalização de acidente", ["brasil", "mundo"], ["acidente", "colisao", "capotament", "batida", "engavetament", "atropela"], ["highway patrol road accident scene|accident,crash", "Polícia Rodoviária Federal viatura rodovia|rodoviária,prf"]),
 I("ponte", "Ponte sobre rio", ["brasil", "economia"], ["ponte", "viaduto", "tunel"], ["bridge over river Brazil|ponte,bridge"]),
 I("favela", "Casas em comunidade de morro", ["brasil"], ["favela", "comunidade", "morro d", "periferia", "complexo d"], ["favela Rio de Janeiro hillside|favela", "favela houses|favela"]),
 I("moradores-rua", "Barracas de pessoas em situação de rua", ["brasil"], ["situacao de rua", "sem-teto", "cracolandia", "moradores de rua", "pobreza", "fome", "inseguranca alimentar"], ["homeless tents street|homeless", "soup kitchen food distribution|soup kitchen,food distribution"]),
 I("indigenas", "Indígenas em aldeia", ["brasil", "politica"], ["indigen", "yanomami", "marco temporal", "funai", "aldeia", "demarcac"], ["indigenous village Brazil Amazon|indigenous,indígena,aldeia", "Terra Indígena aldeia|indígena,aldeia"]),
 I("amazonia", "Floresta amazônica vista do alto", ["brasil", "mundo", "economia", "politica"], ["amazonia", "floresta", "desmatament", "\\bcop\\d", "clima", "aqueciment", "emissoes", "carbono", "ibama", "meio ambiente", "ambiental", "fundo amazonia", "biodiversidade"], ["Amazon rainforest aerial view|amazon,rainforest,amazônia", "deforestation Amazon aerial|deforestation,desmatamento", "Amazon river aerial meander|amazon"]),
 I("pantanal", "Paisagem do Pantanal", ["brasil"], ["pantanal"], ["Pantanal landscape wetland|pantanal"]),
 I("garimpo", "Área de garimpo ilegal na floresta", ["brasil"], ["garimp"], ["illegal gold mining Amazon|garimpo,gold mining,mining"]),
 I("barragem", "Barragem e reservatório", ["brasil", "economia"], ["barrage", "brumadinho", "mariana", "rejeito"], ["dam reservoir aerial Brazil|barragem,dam", "tailings dam mining|tailings"]),
 I("rio-poluido", "Rio poluído em área urbana", ["brasil"], ["poluic", "rio tiete", "contaminac", "oleo no mar", "vazamento de oleo"], ["polluted river urban|pollut,tietê,tiete", "air pollution smog city|smog,pollution"]),
 I("praia", "Mar e faixa de areia", ["brasil"], ["mar\\b", "litoral", "ressaca", "afogament", "banhista", "tubarao", "balneabilidade"], ["beach waves sand Brazil|praia,beach", "rough sea waves coast|waves,sea"]),
 I("igreja", "Interior de igreja", ["brasil", "mundo", "politica"], ["igreja", "papa\\b", "vaticano", "catolic", "evangelic", "pastor", "padre", "missa", "religi", "\\bcnbb\\b", "bispo"], ["church interior pews|church", "St. Peter's Basilica Vatican|st. peter,vatican,san pietro"]),
 I("natal", "Árvore e luzes de Natal", ["brasil", "economia", "mundo"], ["natal\\b", "cantata", "papai noel", "festas de fim de ano", "ceia"], ["Christmas tree lights city square|christmas", "Christmas lights street night|christmas"]),
 I("carnaval", "Desfile de escola de samba", ["brasil", "economia"], ["carnaval", "sambodromo", "bloco", "escola de samba"], ["Sambadrome Rio parade|sambadrome,sambódromo,carnival"]),
 I("fogos", "Queima de fogos de artifício", ["brasil", "mundo"], ["reveillon", "ano novo", "virada do ano", "fogos"], ["fireworks Copacabana New Year|fireworks,réveillon", "fireworks night city|fireworks"]),
 I("idosos", "Idosos em praça", ["brasil", "economia"], ["idos", "envelheciment", "terceira idade", "longevidade", "censo", "populac", "ibge", "natalidade"], ["elderly people park bench|elderly,senior", "crowd people walking street city|crowd,pedestrians"]),
 I("criancas", "Crianças brincando", ["brasil", "educacao"], ["crianca", "infancia", "adolescent", "eca\\b", "conselho tutelar", "trabalho infantil", "adocao", "bebe"], ["children playing playground|children,playground", "kids playing soccer street|children,kids"]),
 I("mulheres", "Mulheres em roda de conversa", ["brasil", "politica"], ["mulher", "violencia domestica", "maria da penha", "aborto", "igualdade salarial", "genero"], ["women group meeting community|women", "woman silhouette window|woman,silhouette"]),
 I("lgbt", "Bandeira do arco-íris", ["brasil", "mundo", "politica"], ["lgbt", "parada do orgulho", "homofob", "transfob", "casamento homoafetivo"], ["rainbow flag waving|rainbow flag"]),
 I("racismo", "Mãos de pessoas de diferentes tons de pele", ["brasil", "politica"], ["racis", "injuria racial", "consciencia negra", "cotas", "quilombol", "zumbi"], ["hands together diversity|hands,diversity", "Zumbi dos Palmares monument|zumbi"]),
 I("cultura", "Plateia em teatro", ["brasil", "mundo"], ["cinema", "filme", "oscar", "teatro", "show\\b", "festival", "musica", "cantor", "artista", "lei rouanet", "novela", "escritor", "livro", "premio"], ["cinema audience theater seats|cinema,theater,audience", "bookstore shelves books|bookstore,books"]),
 I("espaco", "Lançamento de foguete", ["mundo", "brasil", "economia"], ["foguete", "nasa", "spacex", "lua\\b", "marte", "astronauta", "estacao espacial", "telescopio", "eclipse", "asteroide", "alcantara"], ["rocket launch|rocket launch,launch", "International Space Station Earth|space station,iss"]),
 I("animais", "Onça-pintada na natureza", ["brasil", "mundo"], ["onca", "animal", "fauna", "especie", "extinc", "zoologico", "baleia", "tartaruga", "aves\\b"], ["jaguar Pantanal|jaguar,onça", "macaw flying Brazil|macaw,arara"]),
 I("pets", "Cão e gato domésticos", ["brasil"], ["cachorro", "cao\\b", "gato\\b", "pets?\\b", "maus-tratos", "pitbull"], ["dog and cat together|dog,cat"]),
 I("correios", "Agência dos Correios", ["economia", "brasil"], ["correios", "encomenda", "taxa das blusinhas", "shein", "shopee", "e-commerce", "mercado livre"], ["Correios agência Brasil|correios", "parcels warehouse conveyor|parcel,warehouse"]),
 I("exercito", "Soldados do Exército em formação", ["brasil", "politica"], ["exercito", "militares", "forcas armadas", "quartel", "general", "golpe", "8 de janeiro", "tentativa de golpe", "anistia"], ["Exército Brasileiro soldados formatura|exército brasileiro,exercito brasileiro,brazilian army", "Brazilian Army soldiers parade|brazilian army,exército"]),
 I("marinha", "Navio da Marinha do Brasil", ["brasil", "politica", "mundo"], ["marinha", "fragata", "submarino", "almirante"], ["Marinha do Brasil navio|marinha do brasil,brazilian navy", "Brazilian Navy frigate|brazilian navy,marinha"]),
 I("fab", "Caça da Força Aérea Brasileira", ["brasil", "politica"], ["\\bfab\\b", "forca aerea", "gripen", "caca\\b"], ["Força Aérea Brasileira Gripen|força aérea brasileira,brazilian air force,gripen"]),
]

# ---------- educação ----------
V += [
 I("sala-de-aula", "Sala de aula com carteiras", ["educacao", "brasil", "politica"], ["escola", "aula", "aluno", "estudante", "professor", "ensino", "educac", "alfabetiz", "\\bideb\\b", "\\bpisa\\b", "evasao", "rede publica", "novo ensino medio", "celular na escola", "\\bmec\\b"], ["classroom desks empty school|classroom", "sala de aula escola pública Brasil|sala de aula,escola,classroom", "students classroom Brazil|students,classroom,alunos"]),
 I("escola-fachada", "Fachada de escola pública", ["educacao", "brasil"], ["escola estadual", "escola municipal", "colegio", "creche", "merenda", "volta as aulas", "matricula"], ["escola estadual fachada|escola", "school building entrance Brazil|escola,school"]),
 I("enem", "Estudantes fazem prova", ["educacao"], ["enem", "vestibular", "prova", "gabarito", "redacao", "\\bsisu\\b", "\\binep\\b", "fuvest", "concurso"], ["students taking exam hall|exam,examination", "exam answer sheet pencil|exam,answer sheet,test"]),
 I("universidade", "Campus universitário", ["educacao", "brasil"], ["universidade", "faculdade", "\\busp\\b", "\\bufrj\\b", "unicamp", "\\bunb\\b", "federal d", "reitor", "campus", "ensino superior", "\\bfies\\b", "prouni", "graduac", "\\bcapes\\b", "\\bcnpq\\b", "bolsas? de"], ["Universidade de São Paulo campus|universidade de são paulo,usp", "Universidade de Brasília campus|universidade de brasília,unb", "university campus students walking|university,campus"]),
 I("biblioteca", "Estantes de biblioteca", ["educacao", "brasil"], ["biblioteca", "leitura", "livros", "analfabet"], ["library bookshelves reading room|library", "biblioteca pública Brasil|biblioteca"]),
 I("lapis", "Caderno e lápis sobre carteira", ["educacao"], ["material escolar", "tarefa", "licao", "aprendizage", "matematica", "nota\\b", "avaliac"], ["notebook pencil school desk|pencil,notebook", "child writing notebook school|writing,school"]),
 I("onibus-escolar", "Ônibus escolar", ["educacao", "brasil"], ["transporte escolar", "onibus escolar"], ["ônibus escolar Caminho da Escola|ônibus escolar,escolar,school bus"]),
 I("formatura", "Formandos de beca", ["educacao"], ["formatura", "diploma", "formand", "pos-graduac", "mestrado", "doutorado"], ["graduation ceremony caps gowns|graduation"]),
 I("professor", "Professora diante do quadro", ["educacao"], ["piso do magisterio", "piso salarial dos professores", "docente", "greve de professores", "magisterio"], ["teacher blackboard classroom|teacher,blackboard"]),
 N("mec", "Sede do Ministério da Educação", ["educacao", "politica"], ["ministerio da educacao", "camilo santana", "\\bfnde\\b", "\\bfundeb\\b"], ["Ministério da Educação Brasília edifício|ministério da educação,ministerio da educacao"]),
]

# ---------- defesa e conflitos (mundo) ----------
V += [
 I("destrocos-guerra", "Prédios destruídos por bombardeio", ["mundo"], ["bombardei", "ataque aereo", "ataque russo", "ataque israelense", "missil", "misseis", "guerra", "ofensiva", "cessar-fogo", "tregua", "invasao", "front"], ["destroyed buildings war rubble|destroyed,rubble,ruins", "damaged apartment building missile strike|damaged,missile,strike"]),
 I("tanque", "Tanque de guerra", ["mundo"], ["tanque", "blindad", "tropas", "exercito russo", "exercito ucraniano", "exercito israelense", "soldados"], ["main battle tank field|tank", "soldiers military patrol|soldiers"]),
 I("caca", "Caça militar em voo", ["mundo"], ["caca\\b", "aviao militar", "f-35", "f-16", "forca aerea", "espaco aereo", "drone"], ["fighter jet in flight|fighter", "military drone unmanned aerial vehicle|drone,uav"]),
 I("navio-guerra", "Navio de guerra em alto-mar", ["mundo"], ["navio de guerra", "porta-avioes", "frota", "marinha dos eua", "navio russo", "bloqueio naval", "estreito", "ormuz", "mar vermelho", "mar do sul da china"], ["aircraft carrier at sea|aircraft carrier", "warship destroyer navy sea|destroyer,warship"]),
 I("nuclear", "Usina nuclear", ["mundo", "economia"], ["nuclear", "uranio", "ogiva", "\\baiea\\b", "angra"], ["nuclear power plant cooling towers|nuclear", "Angra nuclear power plant|angra"]),
 N("onu", "Sede da ONU, em Nova York", ["mundo", "politica"], ["\\bonu\\b", "nacoes unidas", "conselho de seguranca", "assembleia geral", "guterres"], ["United Nations headquarters New York|united nations", "UN General Assembly hall|general assembly"]),
 N("otan", "Sede da Otan, em Bruxelas", ["mundo"], ["\\botan\\b", "\\bnato\\b", "rutte", "alianca atlantica"], ["NATO headquarters Brussels|nato"]),
 N("pentagono", "Pentágono, sede da Defesa dos EUA", ["mundo"], ["pentagono", "departamento de defesa", "secretario de defesa", "hegseth"], ["The Pentagon aerial|pentagon"]),
 N("capitolio", "Capitólio dos EUA, em Washington", ["mundo", "economia"], ["congresso dos eua", "congresso americano", "camara dos eua", "senado dos eua", "republicanos", "democratas", "capitolio", "shutdown", "impeachment de trump"], ["United States Capitol building|capitol"]),
 N("casa-branca-ext", "Casa Branca, em Washington", ["mundo", "economia", "politica"], ["casa branca", "trump", "governo trump", "vance", "rubio", "governo americano", "governo dos eua", "eua\\b"], ["White House north facade|white house", "White House south lawn|white house"]),
 N("suprema-corte-eua", "Suprema Corte dos EUA", ["mundo"], ["suprema corte dos eua", "suprema corte americana", "justica americana", "juiz federal"], ["United States Supreme Court building|supreme court"]),
 N("uniao-europeia", "Bandeiras diante da Comissão Europeia", ["mundo", "economia"], ["uniao europeia", "\\bue\\b", "comissao europeia", "bruxelas", "von der leyen", "parlamento europeu", "europeu", "zona do euro", "\\bbce\\b"], ["European Commission Berlaymont flags|berlaymont,european commission", "European Parliament Strasbourg hemicycle|european parliament"]),
 N("kremlin", "Kremlin, em Moscou", ["mundo"], ["kremlin", "putin", "russia", "moscou", "russo"], ["Moscow Kremlin river view|kremlin"]),
 N("tpi", "Tribunal Penal Internacional, em Haia", ["mundo"], ["haia", "tribunal penal internacional", "\\btpi\\b", "corte internacional", "crimes de guerra", "genocidio"], ["International Criminal Court The Hague building|international criminal court", "Peace Palace The Hague|peace palace"]),
 N("oms", "Sede da OMS, em Genebra", ["mundo", "brasil"], ["organizacao mundial da saude", "\\boms\\b", "tedros"], ["World Health Organization headquarters Geneva|world health organization"]),
]

# ---------- esportes ----------
V += [
 I("bola-gramado", "Bola de futebol no gramado", ["esportes"], ["futebol", "brasileirao", "serie a", "serie b", "copa do brasil", "rodada", "empat", "venc", "derrot", "gol\\b", "gols\\b", "classificac", "rebaixament", "\\bz4\\b", "playoff", "tecnico", "atacante", "zagueiro", "goleiro", "reforco", "contrat", "libertadores", "sul-americana", "mata-mata", "tabela"], ["soccer ball on grass pitch|soccer ball,football,bola", "football goal net stadium|goal,net", "corner flag football pitch|corner flag,football pitch"]),
 I("arbitro", "Árbitro com cartão em jogo", ["esportes"], ["arbitr", "\\bvar\\b", "penalti", "cartao vermelho", "expuls", "stjd", "punic", "suspens"], ["football referee showing card|referee", "referee whistle football|referee"]),
 I("torcida", "Torcida em arquibancada", ["esportes"], ["torcid", "torcedor", "ingresso", "publico recorde", "organizada", "briga de torcida"], ["football fans stadium stands Brazil|torcida,fans,supporters", "stadium crowd flags|crowd,stadium"]),
 N("cbf", "Sede da CBF e camisa da seleção", ["esportes"], ["cbf", "selecao", "ancelotti", "convocac", "amistoso", "eliminatorias", "copa do mundo", "copa de 2026"], ["Seleção Brasileira futebol jogadores hino|seleção brasileira,brazil national football team", "Brazil national football team jersey|brazil,seleção"]),
 I("volei", "Partida de vôlei", ["esportes"], ["volei", "superliga"], ["volleyball match indoor|volleyball"]),
 I("basquete", "Jogo de basquete", ["esportes"], ["basquete", "\\bnba\\b", "\\bnbb\\b"], ["basketball game arena|basketball"]),
 I("tenis", "Quadra e bola de tênis", ["esportes"], ["tenis", "roland garros", "wimbledon", "us open", "australian open", "\\batp\\b", "\\bwta\\b", "joao fonseca"], ["tennis ball court line|tennis", "tennis match clay court|tennis"]),
 I("f1", "Carro de Fórmula 1 na pista", ["esportes"], ["formula 1", "\\bf1\\b", "gp d", "grande premio", "interlagos", "bortoleto", "verstappen", "hamilton"], ["Formula One car race track|formula one,formula 1,grand prix", "Interlagos circuit|interlagos"]),
 I("olimpiadas", "Anéis olímpicos", ["esportes"], ["olimpi", "\\bcob\\b", "paralimp", "medalha"], ["Olympic rings monument|olympic rings", "Olympic stadium athletics track|olympic,athletics"]),
 I("natacao", "Nadadores em piscina", ["esportes"], ["natacao", "nadador", "piscina"], ["swimming competition pool|swimming"]),
 I("atletismo", "Corredores em pista de atletismo", ["esportes", "brasil"], ["atletismo", "maratona", "corrida de rua", "sao silvestre"], ["marathon runners street|marathon", "athletics track sprint|athletics,sprint"]),
 I("lutas", "Luta de MMA em octógono", ["esportes"], ["\\bufc\\b", "\\bmma\\b", "boxe", "judo", "jiu-jitsu", "luta"], ["mixed martial arts octagon fight|mixed martial arts,mma", "boxing ring match|boxing"]),
 I("surfe", "Surfista em onda", ["esportes"], ["surf", "\\bwsl\\b", "medina", "italo"], ["surfer riding wave|surf"]),
 I("skate", "Skatista em pista", ["esportes"], ["skate", "rayssa"], ["skateboarder skatepark trick|skateboard"]),
 I("ginastica", "Ginasta em apresentação", ["esportes"], ["ginastica", "rebeca"], ["artistic gymnastics competition|gymnastics"]),
 I("ciclismo", "Pelotão de ciclistas", ["esportes"], ["ciclis", "tour de france", "bicicleta"], ["road cycling peloton|cycling,peloton"]),
 I("futebol-feminino", "Jogo de futebol feminino", ["esportes"], ["futebol feminino", "selecao feminina", "brasileirao feminino", "marta"], ["women's football match|women's football,women's soccer"]),
 I("esports", "Jogadores em torneio de e-sports", ["esportes"], ["e-sports", "esports", "games", "cblol"], ["esports tournament stage players|esports,e-sports"]),
 I("trofeu-taca", "Taça em pedestal no estádio", ["esportes"], ["titulo", "campea", "final\\b", "decisao", "taca"], ["Copa Libertadores trophy|libertadores", "FIFA World Cup trophy|world cup trophy,fifa world cup"]),
]

# estádios e clubes: (clube, palavras, estádio, palavras-chave do arquivo)
_CLUBES = [
 ("Flamengo", ["flamengo", "ninho do urubu"], "Maracanã", "maracan"), ("Fluminense", ["fluminense"], "Maracanã estádio", "maracan"),
 ("Vasco", ["vasco"], "São Januário estádio", "januário,januario"), ("Botafogo", ["botafogo"], "Estádio Nilton Santos Engenhão", "nilton santos,engenh"),
 ("Corinthians", ["corinthians"], "Neo Química Arena", "arena corinthians,neo química,neo quimica"), ("Palmeiras", ["palmeiras"], "Allianz Parque", "allianz parque"),
 ("São Paulo FC", ["sao paulo fc", "tricolor paulista", "morumbi", "spfc"], "Estádio do Morumbi", "morumbi"), ("Santos", ["santos fc", "\\bsantos\\b", "vila belmiro", "neymar"], "Vila Belmiro estádio", "vila belmiro"),
 ("Atlético-MG", ["atletico-mg", "galo\\b"], "Arena MRV", "arena mrv"), ("Cruzeiro", ["cruzeiro"], "Mineirão", "mineir"),
 ("Grêmio", ["gremio"], "Arena do Grêmio", "arena do grêmio,arena do gremio"), ("Internacional", ["internacional", "\\binter\\b", "colorado"], "Estádio Beira-Rio", "beira-rio,beira rio"),
 ("Bahia", ["bahia\\b"], "Arena Fonte Nova", "fonte nova"), ("Vitória", ["vitoria\\b"], "Estádio Barradão", "barrad"),
 ("Fortaleza", ["fortaleza ec", "fortaleza\\b"], "Arena Castelão Fortaleza", "castel"), ("Ceará", ["ceara sc", "\\bceara\\b"], "Arena Castelão estádio", "castel"),
 ("Sport", ["sport\\b", "sport recife"], "Ilha do Retiro estádio", "ilha do retiro"), ("Athletico-PR", ["athletico", "furacao"], "Arena da Baixada Ligga Arena", "baixada,ligga"),
 ("Coritiba", ["coritiba"], "Estádio Couto Pereira", "couto pereira"), ("Bragantino", ["bragantino"], "Estádio Nabi Abi Chedid", "nabi abi chedid"),
 ("Goiás", ["goias ec", "\\bgoias\\b"], "Estádio da Serrinha Goiás", "serrinha"), ("Atlético-GO", ["atletico-go"], "Estádio Antônio Accioly", "accioly"),
 ("Vila Nova", ["vila nova"], "Estádio Onésio Brasileiro Alvarenga", "alvarenga,oba"), ("Juventude", ["juventude"], "Estádio Alfredo Jaconi", "jaconi"),
 ("Mirassol", ["mirassol"], "Estádio José Maria de Campos Maia", "campos maia,maião"), ("Cuiabá", ["cuiaba ec"], "Arena Pantanal", "arena pantanal"),
]
for clube, pal, est, kw in _CLUBES:
    V.append(L("estadio-" + _s(clube), f"{est.replace(' estádio','').replace('Estádio ','Estádio ')} ({clube})", ["esportes"], pal, [f"{est}|{kw}", f"{est} stadium interior|{kw}"]))
V += [
 L("estadio-monumental", "Estádio Monumental de Núñez, em Buenos Aires", ["esportes"], ["river plate", "monumental"], ["Estadio Monumental Buenos Aires|monumental"]),
 L("estadio-bombonera", "La Bombonera, em Buenos Aires", ["esportes"], ["boca juniors", "bombonera"], ["La Bombonera stadium|bombonera"]),
 L("estadio-centenario", "Estádio Centenário, em Montevidéu", ["esportes"], ["montevideu", "centenario", "penarol", "nacional-uru"], ["Estadio Centenario Montevideo|centenario"]),
 L("estadio-europa", "Estádio europeu em noite de jogo", ["esportes"], ["champions", "real madrid", "barcelona", "premier league", "liga dos campeoes", "manchester", "liverpool", "psg", "bayern", "la liga", "serie a italiana", "vini jr", "vinicius"], ["Santiago Bernabéu stadium interior|bernab", "Wembley Stadium interior|wembley", "Camp Nou stadium|camp nou"]),
]

# ---------- cidades e estados do Brasil ----------
_UF = [
 ("São Paulo", "SP", ["sao paulo", "paulista", "\\bsp\\b", "capital paulista"], "São Paulo skyline"), ("Rio de Janeiro", "RJ", ["rio de janeiro", "\\brio\\b", "carioca", "fluminense\\b", "\\brj\\b"], "Rio de Janeiro panorama Sugarloaf"),
 ("Brasília", "DF", ["brasilia", "distrito federal", "\\bdf\\b"], "Brasília aerial view Eixo Monumental"), ("Belo Horizonte", "MG", ["belo horizonte", "minas gerais", "mineir", "\\bmg\\b", "\\bbh\\b"], "Belo Horizonte skyline"),
 ("Salvador", "BA", ["salvador", "baian", "\\bba\\b", "na bahia"], "Salvador Bahia Pelourinho"), ("Recife", "PE", ["recife", "pernambuc", "\\bpe\\b"], "Recife skyline"),
 ("Fortaleza", "CE", ["fortaleza", "cearens", "no ceara", "\\bce\\b"], "Fortaleza skyline beach"), ("Porto Alegre", "RS", ["porto alegre", "rio grande do sul", "gauch", "\\brs\\b"], "Porto Alegre skyline Guaíba"),
 ("Curitiba", "PR", ["curitiba", "parana\\b", "paranaens", "\\bpr\\b"], "Curitiba skyline"), ("Florianópolis", "SC", ["florianopolis", "santa catarina", "catarinens", "\\bsc\\b"], "Florianópolis Hercílio Luz bridge"),
 ("Manaus", "AM", ["manaus", "amazonas", "amazonens", "\\bam\\b"], "Manaus skyline Rio Negro"), ("Belém", "PA", ["belem", "\\bpara\\b", "paraens", "\\bpa\\b"], "Belém Pará skyline"),
 ("Goiânia", "GO", ["goiania", "goias", "goian", "\\bgo\\b"], "Goiânia skyline"), ("Vitória", "ES", ["vitoria \\(es", "espirito santo", "capixaba", "\\bes\\b"], "Vitória Espírito Santo skyline"),
 ("Cuiabá", "MT", ["cuiaba", "mato grosso\\b(?! do sul)", "\\bmt\\b"], "Cuiabá skyline"), ("Campo Grande", "MS", ["campo grande", "mato grosso do sul", "\\bms\\b"], "Campo Grande Mato Grosso do Sul skyline"),
 ("São Luís", "MA", ["sao luis", "maranha", "\\bma\\b"], "São Luís Maranhão centro histórico"), ("Natal", "RN", ["natal \\(rn", "rio grande do norte", "potiguar", "\\brn\\b"], "Natal Rio Grande do Norte Ponta Negra"),
 ("Maceió", "AL", ["maceio", "alagoas", "alagoan", "\\bal\\b"], "Maceió skyline beach"), ("João Pessoa", "PB", ["joao pessoa", "paraiba", "paraiban", "\\bpb\\b"], "João Pessoa skyline"),
 ("Teresina", "PI", ["teresina", "piaui", "\\bpi\\b"], "Teresina Piauí skyline"), ("Aracaju", "SE", ["aracaju", "sergipe", "sergipan", "\\bse\\b(?= )"], "Aracaju skyline"),
 ("Porto Velho", "RO", ["porto velho", "rondonia", "\\bro\\b"], "Porto Velho Rondônia"), ("Rio Branco", "AC", ["rio branco", "\\bacre\\b", "\\bac\\b"], "Rio Branco Acre"),
 ("Macapá", "AP", ["macapa", "amapa", "\\bap\\b"], "Macapá Amapá"), ("Boa Vista", "RR", ["boa vista", "roraima", "\\brr\\b"], "Boa Vista Roraima"),
 ("Palmas", "TO", ["palmas \\(to", "tocantins", "\\bto\\b(?= )"], "Palmas Tocantins"),
]
for cid, uf, pal, q in _UF:
    k = _s(cid).replace("-", " ")
    V.append(L("cidade-" + _s(cid), f"{cid} ({uf})", ["brasil", "politica", "economia", "educacao"], pal, [f"{q}|{cid.lower()},{k}", f"{cid} cidade vista aérea|{cid.lower()},{k}", f"{cid} city center|{cid.lower()},{k}"]))

# ---------- países e cidades do mundo ----------
_MUNDO = [
 ("Estados Unidos", ["estados unidos", "americano", "nova york", "washington"], "New York City skyline Manhattan", "new york,manhattan"),
 ("Argentina", ["argentin", "buenos aires", "milei"], "Buenos Aires Casa Rosada", "casa rosada,buenos aires"),
 ("México", ["mexic", "sheinbaum"], "Mexico City Zócalo National Palace", "zócalo,zocalo,mexico city"),
 ("Colômbia", ["colombi", "bogota", "cartagena", "petro\\b"], "Bogotá skyline", "bogot"),
 ("Chile", ["chile", "santiago", "boric", "kast"], "Santiago Chile skyline Andes", "santiago"),
 ("Peru", ["peru\\b", "peruan", "lima\\b"], "Lima Peru Plaza Mayor", "lima"),
 ("Bolívia", ["bolivi", "la paz"], "La Paz Bolivia panorama", "la paz"),
 ("Paraguai", ["paragua", "assuncao"], "Asunción Paraguay skyline", "asunci"),
 ("Uruguai", ["urugua", "montevideu"], "Montevideo skyline rambla", "montevideo"),
 ("Venezuela", ["venezuel", "caracas", "maduro"], "Caracas skyline", "caracas"),
 ("Equador", ["equador", "quito", "noboa"], "Quito Ecuador panorama", "quito"),
 ("Cuba", ["cuba\\b", "havana", "cuban"], "Havana Cuba Capitolio", "havana,habana"),
 ("Canadá", ["canad", "ottawa", "carney"], "Parliament Hill Ottawa", "parliament hill,ottawa"),
 ("Reino Unido", ["reino unido", "britanic", "londres", "starmer", "inglaterra"], "Palace of Westminster London", "westminster,big ben"),
 ("França", ["franca\\b", "frances", "paris", "macron"], "Paris skyline Eiffel Tower", "eiffel,paris"),
 ("Alemanha", ["alemanha", "alema", "berlim", "merz"], "Reichstag building Berlin", "reichstag"),
 ("Itália", ["italia", "italian", "roma\\b", "meloni"], "Rome skyline", "rome,roma"),
 ("Espanha", ["espanha", "espanhol", "madri", "sanchez"], "Madrid skyline Gran Vía", "madrid"),
 ("Portugal", ["portugal", "portugues", "lisboa"], "Lisbon skyline Tagus", "lisbon,lisboa"),
 ("Ucrânia", ["ucrani", "kiev", "kyiv", "zelensk"], "Kyiv skyline Dnieper", "kyiv,kiev"),
 ("Polônia", ["poloni", "polones", "varsovia"], "Warsaw skyline", "warsaw"),
 ("Turquia", ["turquia", "turc", "erdogan", "istambul", "ancara"], "Istanbul skyline Bosphorus", "istanbul"),
 ("Israel", ["israel", "tel aviv", "jerusalem", "netanyahu"], "Jerusalem Old City panorama", "jerusalem"),
 ("Gaza", ["gaza", "palestin", "hamas", "cisjordania"], "Gaza City buildings", "gaza"),
 ("Líbano", ["liban", "beirute", "hezbollah"], "Beirut skyline", "beirut"),
 ("Síria", ["siria", "damasco"], "Damascus panorama", "damascus"),
 ("Irã", ["ira\\b", "iranian", "teera", "khamenei"], "Tehran skyline Milad Tower", "tehran"),
 ("Iraque", ["iraque", "bagda"], "Baghdad city Tigris", "baghdad"),
 ("Arábia Saudita", ["arabia saudita", "saudit", "riad"], "Riyadh skyline", "riyadh"),
 ("Emirados Árabes", ["emirados", "dubai", "abu dhabi"], "Dubai skyline", "dubai"),
 ("Catar", ["catar", "doha"], "Doha skyline", "doha"),
 ("Egito", ["egito", "egipci", "cairo"], "Cairo skyline Nile", "cairo"),
 ("China", ["china", "chines", "pequim", "xi jinping", "xangai"], "Shanghai skyline Pudong", "shanghai"),
 ("Japão", ["japao", "japones", "toquio"], "Tokyo skyline", "tokyo"),
 ("Coreia do Sul", ["coreia do sul", "sul-corean", "seul"], "Seoul skyline", "seoul"),
 ("Coreia do Norte", ["coreia do norte", "norte-corean", "pyongyang", "kim jong"], "Pyongyang skyline", "pyongyang"),
 ("Taiwan", ["taiwan", "taipe"], "Taipei skyline Taipei 101", "taipei"),
 ("Índia", ["india\\b", "indian", "nova deli", "modi\\b"], "New Delhi India Gate", "india gate,delhi"),
 ("Paquistão", ["paquist", "islamabad"], "Islamabad Faisal Mosque", "islamabad,faisal"),
 ("Afeganistão", ["afegan", "cabul", "taliba"], "Kabul city view", "kabul"),
 ("Indonésia", ["indonesi", "jacarta"], "Jakarta skyline", "jakarta"),
 ("Filipinas", ["filipin", "manila"], "Manila skyline", "manila"),
 ("Austrália", ["australi", "sydney", "camberra"], "Sydney Opera House Harbour Bridge", "sydney"),
 ("África do Sul", ["africa do sul", "sul-african", "joanesburgo", "pretoria", "g20"], "Johannesburg skyline", "johannesburg"),
 ("Nigéria", ["nigeri", "lagos", "abuja"], "Lagos Nigeria skyline", "lagos"),
 ("Congo", ["congo", "kinshasa"], "Kinshasa city view", "kinshasa"),
 ("Etiópia", ["etiopi", "adis abeba"], "Addis Ababa skyline", "addis ababa"),
 ("Quênia", ["quenia", "nairobi"], "Nairobi skyline", "nairobi"),
 ("Sudão", ["sudao", "cartum", "darfur"], "Khartoum Nile view", "khartoum"),
 ("Angola", ["angola", "luanda"], "Luanda skyline bay", "luanda"),
 ("Moçambique", ["mocambi", "maputo"], "Maputo skyline", "maputo"),
 ("Líbia", ["libia", "tripoli"], "Tripoli Libya city", "tripoli"),
 ("Marrocos", ["marroc", "rabat", "casablanca"], "Casablanca Hassan II Mosque", "casablanca,hassan ii"),
 ("Haiti", ["haiti", "porto principe"], "Port-au-Prince city view", "port-au-prince"),
 ("Suíça", ["suica", "genebra", "davos", "zurique"], "Geneva lake Jet d'Eau", "geneva,genève"),
 ("Bélgica", ["belgica", "belga"], "Brussels Grand Place", "brussels,grand place"),
 ("Holanda", ["holanda", "holandes", "paises baixos", "amsterda"], "Amsterdam canal houses", "amsterdam"),
 ("Grécia", ["grecia", "grego", "atenas"], "Athens Acropolis panorama", "acropolis,athens"),
 ("Suécia", ["suecia", "sueco", "estocolmo", "nobel"], "Stockholm skyline Gamla stan", "stockholm"),
 ("Hong Kong", ["hong kong"], "Hong Kong skyline Victoria Harbour", "hong kong"),
 ("Singapura", ["singapura"], "Singapore skyline Marina Bay", "singapore"),
 ("Tailândia", ["tailandi", "bangcoc"], "Bangkok skyline", "bangkok"),
 ("Vietnã", ["vietna", "hanoi"], "Hanoi city view", "hanoi"),
 ("Hungria", ["hungri", "orban", "budapeste"], "Budapest Parliament Danube", "budapest"),
]
for pais, pal, q, kw in _MUNDO:
    V.append(L("pais-" + _s(pais), f"{pais}: {q.split(' skyline')[0].split(' panorama')[0]}", ["mundo", "economia", "esportes", "politica"], pal, [f"{q}|{kw}", f"{q.split(' ')[0]} city aerial view|{kw}"]))

# ---------- último recurso por editoria (sempre ilustrativa) ----------
V += [
 I("geral-politica", "Praça dos Três Poderes, em Brasília", ["politica"], [], ["Praça dos Três Poderes Brasília|três poderes,tres poderes", "Brasília Eixo Monumental vista|eixo monumental,brasília"]),
 I("geral-economia", "Calculadora, gráficos e moedas", ["economia"], [], ["calculator coins financial documents|calculator,coins", "financial newspaper stock pages|financial,newspaper,stock"]),
 I("geral-brasil", "Pessoas caminham em rua movimentada", ["brasil"], [], ["Avenida Paulista pedestrians|paulista", "crowded street pedestrians Brazil city|pedestrians,street"]),
 I("geral-mundo", "Globo terrestre", ["mundo"], [], ["terrestrial globe on desk|globe", "Earth from space Blue Marble|earth,blue marble"]),
 I("geral-esportes", "Refletores de estádio à noite", ["esportes"], [], ["stadium floodlights night|floodlight,stadium", "empty stadium seats|stadium,seats"]),
 I("geral-educacao", "Livros empilhados e maçã", ["educacao"], [], ["stack of books desk|books", "school hallway lockers|school,hallway"]),
 I("geral-jornais", "Jornais empilhados", [], [], ["newspapers stack|newspaper", "newspaper printing press|newspaper,printing"]),
]

VERBETES = V
if __name__ == "__main__":
    ids = [v[0] for v in V]; assert len(ids) == len(set(ids)), [i for i in ids if ids.count(i) > 1]
    for v in V:
        for p in v[5]: re.compile(r"\b" + p)
    print(len(V), "verbetes;", sum(len(v[6]) for v in V), "consultas")
