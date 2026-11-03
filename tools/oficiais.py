#!/usr/bin/env python3
"""Dados oficiais públicos, sem IA e sem chave (roda no GitHub de hora em hora em dia útil).

  python3 tools/oficiais.py feed.json oficiais.json [--fixtures DIR] [--agora ISO]

Fontes (APIs abertas):
- Câmara dos Deputados (dadosabertos.camara.leg.br/api/v2): votações do plenário (resultado e placar) e a pauta
  do plenário do dia;
- Senado Federal (legis.senado.leg.br/dadosabertos): votações nominais do plenário e a agenda do plenário;
- Banco Central: Selic meta (SGS 432) e comunicados do Copom; Boletim Focus (API Olinda), às segundas;
- IBGE: calendário de divulgações, IPCA (SIDRA 1737) e desemprego da PNAD Contínua (SIDRA 6381), com as séries
  do Banco Central (SGS 433, 13522 e 24369) de reserva.
STF: sem API aberta estável para a pauta do plenário (o portal é só HTML); fica de fora.

Grava oficiais.json:
- eventos: fatos oficiais (votação, Selic, IPCA, desemprego, Focus) com texto PRONTO de modelo fixo (número na
  frente, sem opinião), número, fonte, URL, primeiro_visto, pid (pauta do feed a que se liga) e acionar; a votação de
  mérito do plenário traz também "placar", pronto para o gráfico placar_votacao do app (ver placar_de);
- para_pautas: {pid: [atualização oficial pronta]} — só fatos ainda não registrados na pauta;
- agenda_oficial: o que está na pauta do plenário da Câmara e do Senado hoje e as divulgações do IBGE da semana;
- estado (para detectar mudança entre execuções) e fontes (ok/falhou de cada fonte).
Falha de rede nunca quebra: a fonte que falhou mantém os eventos anteriores; se nada mudou, não grava.
"""
import json, os, re, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request
from datetime import date, datetime, timedelta, timezone

SP = timezone(timedelta(hours=-3))
UA = "Mozilla/5.0 (prumo-news; +https://prumonews.com.br)"
CAM = "https://dadosabertos.camara.leg.br/api/v2"
SEN = "https://legis.senado.leg.br/dadosabertos"
SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{}/dados"
OLINDA = "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais"
COPOM = "https://www.bcb.gov.br/api/servico/sitebcb/copomcomunicados/ultimas?quantidade=3&filtro="
IBGE_CAL = "https://servicodados.ibge.gov.br/api/v3/calendario/"
SIDRA = "https://apisidra.ibge.gov.br/values"
PLENARIO_CAMARA = 180  # id do órgão Plenário na API da Câmara
RETER_H = 72           # eventos ficam no arquivo por 3 dias
RETER_VOT_H = 168      # votação ligada a uma pauta: 7 dias (o app mostra o placar oficial na matéria)
PRAZO_S = 420          # tempo máximo de rede por execução (o job tem 10 min)
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro",
         "novembro", "dezembro"]


# ---------- utilidades ----------
def norm(s):
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()


STOP = set("""a o as os um uma de da do das dos em na no nas nos por pela pelo para com sem sobre entre e ou que se
sua seu ao aos the and""".split())
GENERICOS = set("""altera alteracao lei leis decreto federal constituicao proposta emenda emendas projeto dispoe
institui nacional art arts artigo artigos paragrafo inciso redacao dada acrescenta revoga outras providencias termos
estabelece pec plp mpv pdl camara senado deputados plenario votacao aprovado aprovada requerimento urgencia materia
turno sessao brasil publica publico politica sistema programa fim criar cria regras regra medida provisoria
complementar""".split())


def tokens(s):
    return {t for t in re.findall(r"[a-z0-9]+", norm(s)) if len(t) >= 3 and t not in STOP and not t.isdigit()}


def kv(d, *nomes, padrao=None):
    """Valor da 1ª chave que existir, sem diferenciar maiúsculas (a API do Senado mudou de PascalCase para camelCase)."""
    if not isinstance(d, dict): return padrao
    low = {str(k).lower(): v for k, v in d.items()}
    for n in nomes:
        v = low.get(n.lower())
        if v not in (None, "", [], {}): return v
    return padrao


def andar(obj):
    """Todos os dicionários dentro de obj (qualquer profundidade)."""
    if isinstance(obj, dict):
        yield obj
        for v in obj.values(): yield from andar(v)
    elif isinstance(obj, list):
        for v in obj: yield from andar(v)


def br(x, casas):
    s = f"{float(x):,.{casas}f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def num(s):
    if s in (None, "", "-", "..."): return None
    try: return float(str(s).replace(",", "."))
    except ValueError: return None


def inteiro(s):
    try: return int(str(s).strip())
    except (TypeError, ValueError): return None


def data_hora(s, padrao_hora="00:00"):
    """'2026-11-03T15:42:10', '2026-11-03', '03/11/2026 09:00:00' ou '03/11/2026' -> datetime em Brasília."""
    s = str(s or "").strip()
    m = re.match(r"(\d{4})-(\d\d)-(\d\d)(?:[T ](\d\d):(\d\d))?", s)
    if m:
        a, mo, d, h, mi = m.groups()
    else:
        m = re.match(r"(\d\d)/(\d\d)/(\d{4})(?: (\d\d):(\d\d))?", s)
        if not m: return None
        d, mo, a, h, mi = m.groups()
    if h is None: h, mi = padrao_hora.split(":")
    try: return datetime(int(a), int(mo), int(d), int(h), int(mi), tzinfo=SP)
    except ValueError: return None


def iso(d):
    return d.isoformat(timespec="minutes") if d else None


# ---------- proposições ----------
LONGOS = [(r"propostas? de emenda (a|à) constitui[cç][aã]o", "PEC"), (r"projetos? de lei complementar", "PLP"),
          (r"projetos? de lei de convers[aã]o", "PLV"), (r"projetos? de decreto legislativo", "PDL"),
          (r"projetos? de lei do congresso nacional", "PLN"), (r"projetos? de lei", "PL"),
          (r"medidas? provis[oó]rias?", "MPV")]
RE_IDENT = re.compile(r"\b(PEC|PLP|PLV|PLN|PDL|PL|MPV|MP|PDS|PLS|PRS)\s*(?:n[º°o.]*\s*)?(\d[\d.]{0,6})\s*(?:/|,?\s*de\s+)(\d{4})\b", re.I)
FEMININO = {"PEC", "MPV"}


def idents(texto):
    """{'PEC 18/2025', ...} achados no texto (aceita 'Proposta de Emenda à Constituição nº 18, de 2025')."""
    t = str(texto or "")
    for pad, sig in LONGOS: t = re.sub(pad, sig, t, flags=re.I)
    out = set()
    for s, n, a in RE_IDENT.findall(t):
        s = s.upper(); s = "MPV" if s == "MP" else s
        try: out.add(f"{s} {int(n.replace('.', ''))}/{a}")
        except ValueError: pass
    return out


def ident_de(sigla, numero, ano):
    sigla, numero, ano = str(sigla or "").upper().strip(), inteiro(str(numero or "").replace(".", "")), inteiro(ano)
    if not sigla or not numero or not ano: return None
    return f"{'MPV' if sigla == 'MP' else sigla} {numero}/{ano}"


def com_artigo(ident):
    if not ident: return "a matéria"
    return ("a " if ident.split()[0] in FEMININO else "o ") + ident


def classe(desc):
    n = re.sub(r"emenda (a|da) constituicao|emenda constitucional", "pec", norm(desc))[:120]
    if "requerimento" in n: return "urgencia" if "urgencia" in n else "requerimento"
    if re.search(r"\b(emendas?|destaques?|dvs|mantido o texto|redacao final|subemenda)\b", n): return "destaque"
    return "materia"


def turno_de(desc):
    n = norm(desc)
    m = re.search(r"\b(primeiro|segundo|1o|2o|1|2)\s*(?:º|o)?\s*turno", n)
    if not m: return None
    return "1º" if m.group(1) in ("primeiro", "1o", "1") else "2º"


def placar(desc):
    n = norm(desc)
    s = re.search(r"\bsim\s*[:=]?\s*(\d+)", n); nao = re.search(r"\bnao\s*[:=]?\s*(\d+)", n)
    return (int(s.group(1)), int(nao.group(1))) if s and nao else (None, None)


def contagem(desc):
    """{'sim', 'nao', 'abst', 'total'} lidos da descrição da Câmara ("Sim: 300; não: 120; abstenção: 2; total: 422.")."""
    n = norm(desc)
    def um(pad):
        m = re.search(pad + r"\s*[:=]?\s*(\d+)", n)
        return int(m.group(1)) if m else None
    sim, nao = placar(desc)
    return {"sim": sim, "nao": nao, "abst": um(r"\babstenc(?:ao|oes)") if sim is not None else None,
            "total": um(r"\btotal") if sim is not None else None}


CADEIRAS = {"camara": 513, "senado": 81}
NOME_CASA = {"camara": "Câmara", "senado": "Senado"}
FONTE_CASA = {"camara": "Câmara dos Deputados", "senado": "Senado Federal"}
# quórum de aprovação fixado pela Constituição (por turno): PEC 3/5 dos membros; PLP maioria absoluta. O resto é
# maioria simples dos presentes (não há um número fixo de votos para desenhar).
QUORUM = {("PEC", "camara"): (308, "3/5 dos deputados (308 votos)"), ("PEC", "senado"): (49, "3/5 dos senadores (49 votos)"),
          ("PLP", "camara"): (257, "maioria absoluta (257 votos)"), ("PLP", "senado"): (41, "maioria absoluta (41 votos)")}


def placar_de(casa, ok, ident, cont, turno, quando, hora_exata, url, desc=""):
    """Placar pronto para o app (gráfico placar_votacao), só com números oficiais. Sem contagem (votação simbólica, ou
    a fonte não trouxe os votos): só o resultado, com modo "simbolica" ou "sem_placar"."""
    tot = CADEIRAS.get(casa)
    if not tot: return None
    sim, nao, abst = (cont or {}).get("sim"), (cont or {}).get("nao"), (cont or {}).get("abst")
    validos = all(isinstance(x, int) and x >= 0 for x in (sim, nao)) and (abst is None or (isinstance(abst, int) and abst >= 0))
    if validos and sim + nao + (abst or 0) > tot: validos = False  # número impossível: não desenha
    if not validos:
        sim = nao = abst = None
        if ok is None: return None
    sigla = (ident or "").split(" ")[0]
    minimo, regra = QUORUM.get((sigla, casa), (None, "maioria simples dos presentes"))
    itens = []
    if sim is not None:
        itens = [{"rotulo": "Sim", "valor": sim}, {"rotulo": "Não", "valor": nao}]
        if abst: itens.append({"rotulo": "Abstenção", "valor": abst})
    total = (cont or {}).get("total") if sim is not None else None
    if sim is not None and not (isinstance(total, int) and sim + nao + (abst or 0) <= total <= tot): total = sim + nao + (abst or 0)
    modo = "nominal" if sim is not None else ("simbolica" if casa == "camara" or "simbolic" in norm(desc) else "sem_placar")
    tit = f"{ident or 'Votação'} no {'Senado' if casa == 'senado' else 'plenário da Câmara'}" + (f" · {turno} turno" if turno else "")
    return {"forma": "placar_votacao", "casa": casa, "titulo": tit, "proposicao": ident, "turno": turno, "modo": modo,
            "sim": sim, "nao": nao, "abst": abst, "total": total, "cadeiras": tot, "minimo": minimo, "regra": regra,
            "resultado": "aprovado" if ok is True else "rejeitado" if ok is False else None,
            "quando": iso(quando), "hora_exata": bool(hora_exata), "fonte": FONTE_CASA[casa], "url": url, "itens": itens}


def resultado_de(valor, desc=""):
    """True aprovado, False rejeitado, None não dá para afirmar."""
    if valor in (1, True, "1"): return True
    if valor in (0, False, "0"): return False
    v = norm(valor)
    if v.startswith("aprov") or v == "a": return True
    if v.startswith("rejeit") or v == "r": return False
    d = norm(desc).strip()
    if d.startswith("aprovad"): return True
    if d.startswith("rejeitad"): return False
    return None


def fato_votacao(casa, ok, ident, sim, nao, turno, cls):
    if ok is None and sim is None: return None
    alvo = com_artigo(ident)
    if cls == "urgencia":
        if ok is None: return None
        base = f"{casa} {'aprovou' if ok else 'rejeitou'} a urgência para {alvo}"
    elif ok is None:
        return f"{casa} votou {alvo}{f' em {turno} turno' if turno else ''}: {sim} votos sim e {nao} não."
    else:
        base = f"{casa} {'aprovou' if ok else 'rejeitou'} {alvo}{f' em {turno} turno' if turno else ''}"
    return base + (f" por {sim} votos a {nao}." if sim is not None else ".")


# ---------- acesso (rede ou fixtures) ----------
class Ctx:
    def __init__(self, agora, fixtures=None):
        self.agora, self.fx, self.t0 = agora, fixtures, time.time()
        self.hoje = agora.date()

    def get(self, chave, url, accept="application/json", tempo=15, tentativas=3):
        """Com rede: até 3 tentativas (espera 2 s e 6 s) em tempo esgotado, erro de conexão, 429 ou 5xx; 4xx não repete."""
        if self.fx:
            with open(os.path.join(self.fx, chave + ".json"), encoding="utf-8") as fh: return json.load(fh)
        for n in range(tentativas):
            if time.time() - self.t0 > PRAZO_S: raise TimeoutError("prazo da execução esgotado")
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
            try:
                with urllib.request.urlopen(req, timeout=tempo) as r:
                    return json.loads(r.read().decode("utf-8-sig"))
            except urllib.error.HTTPError as e:
                if e.code != 429 and e.code < 500 or n == tentativas - 1: raise
            except (urllib.error.URLError, TimeoutError, ConnectionError):
                if n == tentativas - 1: raise
            time.sleep(2 + 4 * n)


# ---------- Câmara ----------
def camara_votacoes(ctx):
    d0, d1 = ctx.hoje - timedelta(days=1), ctx.hoje
    q = urllib.parse.urlencode({"dataInicio": d0.isoformat(), "dataFim": d1.isoformat(), "ordem": "DESC",
                                "ordenarPor": "dataHoraRegistro", "itens": 100})
    dados = kv(ctx.get("camara_votacoes", f"{CAM}/votacoes?{q}"), "dados") or []
    evs, outras, detalhes = [], 0, 0
    for v in dados:
        if str(kv(v, "siglaOrgao") or "").upper() != "PLEN": continue
        desc = str(kv(v, "descricao") or "")
        cls = classe(desc)
        if cls in ("destaque", "requerimento"): outras += 1; continue
        vid = str(kv(v, "id") or "")
        quando = data_hora(kv(v, "dataHoraRegistro", "data"))
        ok = resultado_de(kv(v, "aprovacao"), desc)
        cont = contagem(desc)
        sim, nao = cont["sim"], cont["nao"]
        ids = idents(desc) | idents(kv(v, "proposicaoObjeto"))
        ementa, prop_id = "", None
        if vid and detalhes < 12:
            detalhes += 1
            try:
                det = kv(ctx.get(f"camara_votacao_{vid}", f"{CAM}/votacoes/{vid}"), "dados") or {}
                for p in (kv(det, "proposicoesAfetadas") or []) + [kv(det, "ultimaApresentacaoProposicao") or {}]:
                    i = ident_de(kv(p, "siglaTipo"), kv(p, "numero"), kv(p, "ano"))
                    if i:
                        ids.add(i); ementa = ementa or str(kv(p, "ementa") or "")
                        prop_id = prop_id or kv(p, "id") or (str(kv(p, "uriProposicao", "uri") or "").rstrip("/").split("/")[-1] or None)
            except Exception:
                pass
        principal = sorted(ids, key=lambda s: (s.split()[0] not in ("PEC", "PLP", "MPV", "PL"), s))[0] if ids else None
        fato = fato_votacao("A Câmara", ok, principal, sim, nao, turno_de(desc), cls)
        if not fato or not quando: continue
        url = (f"https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao={prop_id}" if prop_id and str(prop_id).isdigit()
               else f"{CAM}/votacoes/{urllib.parse.quote(vid)}")
        ev = {"id": f"camara-vot-{vid}", "fonte": "Câmara dos Deputados", "tipo": "votacao", "casa": "camara",
              "classe": cls, "quando": iso(quando), "fato": fato, "numero": f"{sim} a {nao}" if sim is not None else None,
              "aprovado": ok, "proposicoes": sorted(ids), "ementa": ementa[:300], "url": url}
        if cls == "materia":
            pl = placar_de("camara", ok, principal, cont, turno_de(desc), quando, bool(re.search(r"T\d\d:\d\d", str(kv(v, "dataHoraRegistro") or ""))), url, desc)
            if pl: ev["placar"] = pl
        evs.append(ev)
    return {"eventos": evs, "nota": f"{len(evs)} votações de mérito/urgência, {outras} de destaque ou requerimento"}


def camara_pauta(ctx):
    d = ctx.hoje.isoformat()
    q = urllib.parse.urlencode({"idOrgao": PLENARIO_CAMARA, "dataInicio": d, "dataFim": d, "ordem": "ASC", "ordenarPor": "dataHoraInicio"})
    evs = kv(ctx.get("camara_eventos", f"{CAM}/eventos?{q}"), "dados") or []
    agenda, vistos = [], set()
    for e in evs[:3]:
        eid = kv(e, "id")
        if not eid: continue
        ini = data_hora(kv(e, "dataHoraInicio"))
        try:
            itens = kv(ctx.get(f"camara_pauta_{eid}", f"{CAM}/eventos/{eid}/pauta"), "dados") or []
        except Exception:
            continue
        for it in itens:
            p = kv(it, "proposicao_", "proposicao") or {}
            i = ident_de(kv(p, "siglaTipo"), kv(p, "numero"), kv(p, "ano")) or next(iter(idents(kv(it, "titulo"))), None)
            if not i or i in vistos: continue
            vistos.add(i)
            agenda.append({"data": d, "hora": ini.strftime("%Hh%M") if ini else "", "casa": "camara",
                           "texto": f"Plenário da Câmara tem na pauta {com_artigo(i)}", "proposicoes": [i],
                           "ementa": str(kv(p, "ementa") or "")[:300], "regime": kv(it, "regime") or "",
                           "fonte": "Câmara dos Deputados", "url": f"https://www.camara.leg.br/evento-legislativo/{eid}"})
    return {"agenda": agenda, "nota": f"{len(evs)} sessões, {len(agenda)} proposições na pauta"}


# ---------- Senado ----------
def registros_votacao(obj):
    return [d for d in andar(obj) if kv(d, "descricaoVotacao") is not None or
            (kv(d, "totalVotosSim") is not None and kv(d, "sigla", "siglaMateria") is not None)]


def senado_votacoes(ctx):
    d0, d1 = ctx.hoje - timedelta(days=1), ctx.hoje
    regs, via = [], "votacao"
    try:
        regs = registros_votacao(ctx.get("senado_votacoes", f"{SEN}/votacao?dataInicio={d0.isoformat()}&dataFim={d1.isoformat()}"))
    except Exception as e:
        via, respondeu = f"lista/votacao (a nova falhou: {repr(e)[:60]})", False
        for d in (d0, d1):  # serviço antigo, um dia por vez
            try:
                regs += registros_votacao(ctx.get(f"senado_votacoes_{d:%Y%m%d}", f"{SEN}/plenario/lista/votacao/{d:%Y%m%d}.json"))
                respondeu = True
            except Exception: pass
        if not respondeu: raise
    evs = []
    for r in regs:
        desc = str(kv(r, "descricaoVotacao") or "")
        cls = classe(desc)
        if cls in ("destaque", "requerimento"): continue
        i = ident_de(kv(r, "sigla", "siglaMateria"), kv(r, "numero", "numeroMateria"), kv(r, "ano", "anoMateria"))
        ids = ({i} if i else set()) | idents(kv(r, "identificacao", "descricaoIdentificacaoMateria")) | idents(desc)
        principal = i or (sorted(ids)[0] if ids else None)
        sim, nao = inteiro(kv(r, "totalVotosSim")), inteiro(kv(r, "totalVotosNao"))
        cont = {"sim": sim, "nao": nao, "abst": inteiro(kv(r, "totalVotosAbstencao")) if sim is not None else None, "total": None}
        if sim is None: cont = contagem(desc); sim, nao = cont["sim"], cont["nao"]
        ok = resultado_de(kv(r, "resultadoVotacao", "resultado"), desc)
        # hora da própria votação, quando a API trouxer; senão a da abertura da sessão (o app então mostra só o dia)
        exata = data_hora(kv(r, "dataHoraInicioVotacao", "dataHoraVotacao", "dataHoraFimVotacao", "dataHoraInicio")) \
            if re.search(r"\d\d:\d\d", str(kv(r, "dataHoraInicioVotacao", "dataHoraVotacao", "dataHoraFimVotacao", "dataHoraInicio") or "")) else None
        quando = exata or data_hora(f"{str(kv(r, 'dataSessao') or '')[:10]} {str(kv(r, 'horaInicio') or '')[:5]}".strip()) or data_hora(kv(r, "dataSessao"))
        fato = fato_votacao("O Senado", ok, principal, sim, nao, turno_de(desc), cls)
        if not fato or not quando: continue
        cod = kv(r, "codigoMateria")
        sid = kv(r, "codigoSessaoVotacao", "codigoVotacao", "codigoSessao") or f"{principal}-{iso(quando)}"
        ev = {"id": f"senado-vot-{sid}", "fonte": "Senado Federal", "tipo": "votacao", "casa": "senado",
              "classe": cls, "quando": iso(quando), "fato": fato, "numero": f"{sim} a {nao}" if sim is not None else None,
              "aprovado": ok, "proposicoes": sorted(ids), "ementa": str(kv(r, "ementa", "ementaMateria") or "")[:300],
              "url": f"https://www25.senado.leg.br/web/atividade/materias/-/materia/{cod}" if cod else "https://www12.senado.leg.br/hoje"}
        if cls == "materia":
            pl = placar_de("senado", ok, principal, cont, turno_de(desc), quando, exata is not None, ev["url"], desc)
            if pl: ev["placar"] = pl
        evs.append(ev)
    return {"eventos": evs, "nota": f"{len(evs)} votações nominais (via {via})"}


def senado_agenda(ctx):
    d = ctx.hoje
    dados, erro = None, None
    for chave, url in (("senado_agenda", f"{SEN}/plenario/agenda/dia/{d:%Y%m%d}.json"), ("senado_agenda_b", f"{SEN}/agenda/{d:%Y%m%d}.json")):
        try: dados = ctx.get(chave, url); break
        except Exception as e: erro = e
    if dados is None: raise erro or RuntimeError("sem agenda")
    agenda, vistos = [], set()
    hora = ""
    for s in andar(dados):
        h = kv(s, "horaInicio", "HoraInicioSessao", "hora")
        if h and not hora and re.match(r"\d\d:\d\d", str(h)): hora = str(h)[:5].replace(":", "h")
        i = ident_de(kv(s, "siglaMateria", "sigla"), kv(s, "numeroMateria", "numero"), kv(s, "anoMateria", "ano"))
        if not i or i in vistos: continue
        vistos.add(i)
        cod = kv(s, "codigoMateria")
        agenda.append({"data": d.isoformat(), "hora": "", "casa": "senado", "texto": f"Plenário do Senado tem na pauta {com_artigo(i)}",
                       "proposicoes": [i], "ementa": str(kv(s, "ementa", "ementaMateria") or "")[:300], "fonte": "Senado Federal",
                       "url": f"https://www25.senado.leg.br/web/atividade/materias/-/materia/{cod}" if cod else "https://www25.senado.leg.br/web/atividade/plenario"})
    for a in agenda: a["hora"] = hora
    return {"agenda": agenda, "nota": f"{len(agenda)} matérias na pauta"}


# ---------- Banco Central ----------
def sgs(ctx, cod, n=None, dias=None):
    if dias:
        ini = (ctx.hoje - timedelta(days=dias)).strftime("%d/%m/%Y")
        url = SGS.format(cod) + f"?formato=json&dataInicial={ini}"
    else:
        url = SGS.format(cod) + f"/ultimos/{n}?formato=json"
    out = []
    for x in ctx.get(f"sgs_{cod}", url):
        d = data_hora(x.get("data")); v = num(x.get("valor"))
        if d and v is not None: out.append((d.date(), v))
    return out


def bcb_copom(ctx, est_ant=None):
    """Selic: comunicado do Copom (mantém/reduz/eleva) e, de reserva, a série 432 (meta), sem chave:
    - mudança de valor (reduziu/elevou);
    - MANTEVE: a série traz a meta até a data da próxima reunião; quando a última data salta (de uma reunião que
      acabou de acontecer para a seguinte, semanas à frente) sem mudar o valor, o Copom manteve a taxa."""
    est_ant = est_ant or {}
    evs, notas = [], []
    try:
        for d in andar(ctx.get("bcb_copom", COPOM)):
            t = str(kv(d, "titulo") or "")
            m = re.search(r"Copom\s+(mant[ée]m|reduz|eleva|aumenta|corta)\b.*?Selic\s+(?:em|para)\s+([\d,]+)\s*%", t, re.I)
            dd = data_hora(kv(d, "dataReferencia", "data", "dataPublicacao"))
            if not m or not dd: continue
            if dd.date() < ctx.hoje - timedelta(days=3): continue
            verbo = norm(m.group(1))
            taxa = m.group(2)
            fato = ("O Copom manteve a Selic em " if verbo.startswith("mant") else
                    "O Copom reduziu a Selic para " if verbo in ("reduz", "corta") else "O Copom elevou a Selic para ") + f"{taxa}% ao ano."
            evs.append({"id": f"copom-{dd.date().isoformat()}", "fonte": "Banco Central", "tipo": "selic", "quando": iso(dd),
                        "fato": fato, "numero": f"{taxa}%", "url": "https://www.bcb.gov.br/publicacoes/comunicadoscopom"})
            break
        notas.append("comunicado ok" if evs else "sem comunicado recente")
    except Exception as e:
        notas.append(f"comunicado falhou ({repr(e)[:60]})")
    s = sgs(ctx, 432, dias=60)  # a série já traz os dias à frente: a meta nova aparece logo depois da decisão
    ate_ant = data_hora(est_ant.get("selic_ate"))
    ate_ant = ate_ant.date() if ate_ant else None
    if s and ate_ant:
        ate, atual = s[-1][0], s[-1][1]
        val_ant = next((v for d, v in reversed(s) if d <= ate_ant), None)
        if (ate - ate_ant).days >= 14 and ctx.hoje - timedelta(days=5) <= ate_ant <= ctx.hoje + timedelta(days=1) \
                and val_ant is not None and abs(val_ant - atual) < 1e-9 and not evs:
            taxa = br(atual, 2)
            q = datetime(ate_ant.year, ate_ant.month, ate_ant.day, 18, 30, tzinfo=SP)
            evs.append({"id": f"copom-{ate_ant.isoformat()}", "fonte": "Banco Central", "tipo": "selic",
                        "quando": iso(min(q, ctx.agora)), "fato": f"O Copom manteve a Selic em {taxa}% ao ano.",
                        "numero": f"{taxa}%", "url": "https://www.bcb.gov.br/controleinflacao/historicotaxasjuros"})
            notas.append(f"manteve (série 432 estendida de {ate_ant:%d/%m} para {ate:%d/%m})")
    if s:
        atual, desde, ant = s[-1][1], s[0][0], None
        for i in range(len(s) - 2, -1, -1):
            if abs(s[i][1] - atual) > 1e-9: desde, ant = s[i + 1][0], s[i][1]; break
        notas.append(f"meta {br(atual, 2)}% desde {desde:%d/%m}")
        if ant is not None and ctx.hoje - timedelta(days=5) <= desde <= ctx.hoje + timedelta(days=3):
            taxa = br(atual, 2)
            if not any(e["numero"] == f"{taxa}%" for e in evs):
                verbo = "reduziu" if atual < ant else "elevou"
                evs.append({"id": f"selic-{desde.isoformat()}", "fonte": "Banco Central", "tipo": "selic",
                            "quando": iso(datetime(desde.year, desde.month, desde.day, tzinfo=SP)),
                            "fato": f"O Copom {verbo} a Selic de {br(ant, 2)}% para {taxa}% ao ano; a nova taxa vale a partir de {desde:%d/%m}.",
                            "numero": f"{taxa}%", "url": "https://www.bcb.gov.br/controleinflacao/historicotaxasjuros"})
    return {"eventos": evs, "nota": "; ".join(notas),
            "estado": {"selic_meta": s[-1][1] if s else None, "selic_ate": s[-1][0].isoformat() if s else None}}


def focus(ctx):
    """Boletim Focus (segunda de manhã): mediana do IPCA e da Selic do ano, contra a semana anterior."""
    ano = ctx.hoje.year
    ini = (ctx.hoje - timedelta(days=20)).isoformat()
    filtro = (f"(Indicador eq 'IPCA' or Indicador eq 'Selic') and baseCalculo eq 0 and DataReferencia eq '{ano}' "
              f"and Data ge '{ini}'")
    q = urllib.parse.urlencode({"$filter": filtro, "$orderby": "Data desc", "$top": 100, "$format": "json",
                                "$select": "Indicador,Data,DataReferencia,Mediana"},
                               quote_via=lambda s, safe="", enc=None, err=None: urllib.parse.quote(s, safe="$',()"))
    linhas = kv(ctx.get("focus", f"{OLINDA}?{q}"), "value") or []
    serie = {}
    for l in linhas:
        d = data_hora(kv(l, "Data")); v = num(kv(l, "Mediana"))
        if d and v is not None and str(kv(l, "DataReferencia")) == str(ano): serie.setdefault(kv(l, "Indicador"), {})[d.date()] = v
    if not serie.get("IPCA"): return {"eventos": [], "nota": "sem dados"}
    ult = max(serie["IPCA"])
    est = {"focus_data": ult.isoformat()}
    # o boletim sai às segundas, 8h25, com os dados até a sexta; com feriado na segunda, sai na terça. O id leva a
    # data da sexta: se a terça repetir a mesma sexta, é o mesmo evento (não aciona de novo).
    sexta_recente = ult.weekday() == 4 and 0 < (ctx.hoje - ult).days <= 4
    if ctx.agora.weekday() not in (0, 1) or not sexta_recente or ctx.agora.hour < 9:
        return {"eventos": [], "nota": f"última data {ult:%d/%m} (evento na segunda, ou na terça se segunda for feriado)", "estado": est}
    partes = []
    for ind, nome in (("IPCA", "do IPCA"), ("Selic", "da Selic no fim")):
        s = serie.get(ind) or {}
        if ult not in s: continue
        ants = [d for d in s if d <= ult - timedelta(days=7)]
        txt = f"mediana {nome} de {ano} em {br(s[ult], 2)}%"
        if ants: txt += f" (eram {br(s[max(ants)], 2)}% uma semana antes)"
        partes.append(txt)
    fato = "Boletim Focus (Banco Central): " + " e ".join(partes) + "."
    ev = {"id": f"focus-{ult.isoformat()}", "fonte": "Banco Central", "tipo": "focus",
          "quando": iso(datetime(ctx.hoje.year, ctx.hoje.month, ctx.hoje.day, 8, 25, tzinfo=SP)), "fato": fato,
          "numero": f"{br(serie['IPCA'][ult], 2)}%", "url": "https://www.bcb.gov.br/publicacoes/focus"}
    return {"eventos": [ev], "nota": f"boletim com dados de {ult:%d/%m}", "estado": est}


# ---------- IBGE ----------
INTERESSE_IBGE = re.compile(r"IPCA|INPC|PNAD|Produto Interno|PIB|Contas Nacionais|Produ[çc][ãa]o Industrial|"
                            r"Pesquisa Mensal de (Com[ée]rcio|Servi[çc]os)|Desocupa", re.I)


def ibge_calendario(ctx, est_ant=None, agenda_ant=None):
    """Divulgações do IBGE em 7 dias. A API é lenta (deu tempo esgotado em 15 s o dia todo em 03/11): espera até 40 s,
    e, depois de um sucesso, reaproveita o resultado o resto do dia (estado ibge_cal_dia/ibge_hoje)."""
    est_ant = est_ant or {}
    if est_ant.get("ibge_cal_dia") == ctx.hoje.isoformat():
        agenda = [a for a in agenda_ant or [] if isinstance(a, dict) and a.get("casa") == "ibge" and str(a.get("data")) >= ctx.hoje.isoformat()]
        return {"agenda": agenda, "nota": f"{len(agenda)} divulgações (consulta de hoje, reaproveitada)", "hoje": est_ant.get("ibge_hoje") or [],
                "cache": True}
    de, ate = ctx.hoje, ctx.hoje + timedelta(days=7)
    url = f"{IBGE_CAL}?de={de:%m-%d-%Y}&ate={ate:%m-%d-%Y}&qtd=100"
    dados = ctx.get("ibge_calendario", url, tempo=40, tentativas=2)
    itens = kv(dados, "items", "itens") if isinstance(dados, dict) else dados
    agenda, hoje = [], set()
    for it in itens or []:
        tit = str(kv(it, "titulo", "nome") or "")
        quando = data_hora(kv(it, "data_divulgacao", "dataDivulgacao", "data"))
        if not quando or not INTERESSE_IBGE.search(tit) or not (de <= quando.date() <= ate): continue
        agenda.append({"data": quando.date().isoformat(), "hora": quando.strftime("%Hh%M") if quando.hour else "",
                       "casa": "ibge", "texto": f"IBGE divulga: {tit}", "fonte": "IBGE",
                       "url": "https://www.ibge.gov.br/calendario-de-divulgacoes.html"})
        if quando.date() == ctx.hoje:
            n = norm(tit)
            if "ipca" in n and "15" not in n: hoje.add("ipca")
            if "pnad" in n or "desocupa" in n: hoje.add("pnad")
    return {"agenda": agenda, "nota": f"{len(agenda)} divulgações de interesse em 7 dias", "hoje": sorted(hoje),
            "estado": {"ibge_cal_dia": ctx.hoje.isoformat(), "ibge_hoje": sorted(hoje)}}


def sidra(ctx, chave, caminho):
    """Linhas da API SIDRA como dicionários pelo cabeçalho (1ª linha), à prova de ordem das colunas."""
    rows = ctx.get(chave, f"{SIDRA}/{caminho}")
    if not isinstance(rows, list) or len(rows) < 2: raise ValueError("SIDRA sem linhas")
    cab = rows[0]
    col_per = next(k for k, v in cab.items() if re.search(r"(M[êe]s|Trimestre).*\(C[óo]digo\)", str(v)))
    col_var = next(k for k, v in cab.items() if re.fullmatch(r"Vari[áa]vel \(C[óo]digo\)", str(v)))
    out = []
    for r in rows[1:]:
        v = num(r.get("V"))
        if v is not None: out.append((str(r.get(col_per)), str(r.get(col_var)), v))
    return out


def mes_ano(ref):  # '202610' -> ('outubro', 2026)
    return MESES[int(ref[4:6]) - 1], int(ref[:4])


def ipca(ctx, est_ant, hoje_ibge):
    try:
        linhas = sidra(ctx, "sidra_ipca", "t/1737/n1/all/v/63,2265/p/last%202")
        por = {}
        for per, var, v in linhas: por.setdefault(per, {})[var] = v
        refs = sorted(por)
        ref, ant = refs[-1], (refs[-2] if len(refs) > 1 else None)
        mes, m12, mant = por[ref].get("63"), por[ref].get("2265"), por.get(ant, {}).get("63") if ant else None
        via = "SIDRA"
    except Exception as e:
        s, s12 = sgs(ctx, 433, n=2), sgs(ctx, 13522, n=1)
        ref, mes, mant = s[-1][0].strftime("%Y%m"), s[-1][1], s[-2][1] if len(s) > 1 else None
        ant = s[-2][0].strftime("%Y%m") if len(s) > 1 else None
        m12 = s12[-1][1] if s12 and s12[-1][0].strftime("%Y%m") == ref else None
        via = f"SGS (SIDRA falhou: {repr(e)[:50]})"
    est = {"ipca_ref": ref}
    novo = (est_ant.get("ipca_ref") and est_ant["ipca_ref"] != ref) or (not est_ant.get("ipca_ref") and "ipca" in hoje_ibge)
    if mes is None or not novo: return {"eventos": [], "nota": f"ref {ref} via {via}", "estado": est}
    nome, a = mes_ano(ref)
    fato = f"O IPCA de {nome} de {a} ficou em {br(mes, 2)}%"
    if m12 is not None: fato += f"; em 12 meses, a inflação está em {br(m12, 2)}%"
    if mant is not None and ant: fato += f" (em {mes_ano(ant)[0]}, {br(mant, 2)}%)"
    ev = {"id": f"ipca-{ref}", "fonte": "IBGE", "tipo": "ipca", "quando": iso(ctx.agora.replace(hour=9, minute=0)) if ctx.agora.hour >= 9 else iso(ctx.agora),
          "fato": fato + ".", "numero": f"{br(mes, 2)}%", "url": "https://sidra.ibge.gov.br/tabela/1737"}
    return {"eventos": [ev], "nota": f"ref {ref} nova via {via}", "estado": est}


def pnad(ctx, est_ant, hoje_ibge):
    try:
        linhas = sidra(ctx, "sidra_pnad", "t/6381/n1/all/v/4099/p/last%202")
        s = sorted((per, v) for per, _, v in linhas)
        via = "SIDRA"
    except Exception as e:
        s = [(d.strftime("%Y%m"), v) for d, v in sgs(ctx, 24369, n=2)]
        via = f"SGS (SIDRA falhou: {repr(e)[:50]})"
    ref, v = s[-1]
    est = {"pnad_ref": ref}
    novo = (est_ant.get("pnad_ref") and est_ant["pnad_ref"] != ref) or (not est_ant.get("pnad_ref") and "pnad" in hoje_ibge)
    if not novo: return {"eventos": [], "nota": f"ref {ref} via {via}", "estado": est}
    nome, a = mes_ano(ref)
    fato = f"O desemprego ficou em {br(v, 1)}% no trimestre encerrado em {nome} de {a}, segundo a PNAD Contínua do IBGE"
    if len(s) > 1: fato += f"; no trimestre encerrado em {mes_ano(s[-2][0])[0]}, a taxa era {br(s[-2][1], 1)}%"
    ev = {"id": f"pnad-{ref}", "fonte": "IBGE", "tipo": "desemprego", "quando": iso(ctx.agora.replace(hour=9, minute=0)) if ctx.agora.hour >= 9 else iso(ctx.agora),
          "fato": fato + ".", "numero": f"{br(v, 1)}%", "url": "https://sidra.ibge.gov.br/tabela/6381"}
    return {"eventos": [ev], "nota": f"ref {ref} nova via {via}", "estado": est}


# ---------- ligação com as pautas do feed ----------
TEMAS = {"selic": {"copom", "selic"}, "ipca": {"ipca", "inflacao"}, "desemprego": {"desemprego", "desocupacao", "pnad"},
         "focus": {"focus"}}


def texto_pauta(p):
    n = p.get("neutro") or {}
    partes = [p.get("tag"), p.get("tema"), n.get("titulo"), p.get("subtitulo"), n.get("texto"), p.get("contexto"),
              p.get("proximo")] + [u.get("texto") for u in p.get("atualizacoes") or [] if isinstance(u, dict)]
    return " ".join(str(x or "") for x in partes)


def ultima(p):
    hs = [str(p.get("hora") or "")] + [str(u.get("hora") or "") for u in p.get("atualizacoes") or [] if isinstance(u, dict)]
    ds = [data_hora(h) for h in hs if re.match(r"\d{4}-\d\d-\d\dT", h)]
    ds = [d for d in ds if d]
    return max(ds) if ds else None


def indice(feed):
    out = []
    for p in feed.get("pautas") or []:
        curto = " ".join(str(x or "") for x in (p.get("tag"), p.get("tema"), (p.get("neutro") or {}).get("titulo")))
        todo = texto_pauta(p)
        out.append({"pid": p.get("id"), "secao": p.get("secao"), "prio": p.get("prioridade") or 0,
                    "tk": tokens(curto), "props": idents(todo), "texto": todo, "ultima": ultima(p)})
    return out


def ligar(ev, idx):
    """(pid, confiança) da pauta a que o evento pertence, ou (None, None)."""
    props = set(ev.get("proposicoes") or [])
    if props:
        c = [p for p in idx if p["props"] & props]
        if c: return max(c, key=lambda p: p["prio"])["pid"], "numero"
    if ev.get("tipo") in TEMAS:
        c = [p for p in idx if p["tk"] & TEMAS[ev["tipo"]]]
        if c: return max(c, key=lambda p: (p["secao"] == "economia", p["prio"]))["pid"], "tema"
        return None, None
    if props and ev.get("ementa"):
        sig = {s.split()[0].lower() for s in props}
        etk = tokens(ev["ementa"]) - GENERICOS
        c = []
        for p in idx:
            inter = etk & (p["tk"] - GENERICOS)
            if len(inter) >= 2 or (inter and sig & p["tk"]): c.append((len(inter), p["prio"], p["pid"]))
        if c: return max(c)[2], "palavras"
    return None, None


def ja_no_feed(ev, p):
    """O número do evento já está no texto da pauta e a pauta foi atualizada depois do fato."""
    if not p or not ev.get("numero"): return False
    q = data_hora(ev.get("quando"))
    if p["ultima"] and q and p["ultima"] < q: return False
    nums = re.findall(r"\d+(?:,\d+)?", ev["numero"])
    if not nums: return False
    pad = r"(?<![\d,])" + r"\D{1,15}".join(re.escape(n) for n in nums) + r"(?![\d,])"
    return bool(re.search(pad, p["texto"]))


def deve_acionar(ev):
    if ev.get("tipo") in ("selic", "ipca", "desemprego"): return True
    if ev.get("tipo") == "votacao" and ev.get("classe") == "materia":
        return bool(ev.get("pid")) or any(s.split()[0] in ("PEC", "PLP", "MPV", "PLN") for s in ev.get("proposicoes") or [])
    return bool(ev.get("pid"))


# ---------- montagem ----------
def executar(feed, anterior, ctx):
    est_ant = anterior.get("estado") or {}
    eventos_ant = {e["id"]: e for e in anterior.get("eventos") or [] if isinstance(e, dict) and e.get("id")}
    fontes, eventos, agenda, estado = {}, {}, [], dict(est_ant)
    falhou_algo, ok_algo = False, False

    casa_de = {"Câmara: pauta do plenário": "camara", "Senado: agenda do plenário": "senado", "IBGE: calendário": "ibge"}
    falhas_agenda = set()

    def rodar(nome, fn):
        nonlocal falhou_algo, ok_algo
        try:
            r = fn() or {}
            for e in r.get("eventos") or []: eventos[e["id"]] = e
            agenda.extend(r.get("agenda") or [])
            estado.update({k: v for k, v in (r.get("estado") or {}).items() if v is not None})
            if r.get("cache"): fontes[nome] = "cache: " + str(r.get("nota") or "")  # sem rede: não conta como resposta
            else: fontes[nome] = "ok: " + str(r.get("nota") or ""); ok_algo = True
            return r
        except Exception as e:
            fontes[nome] = "falhou: " + repr(e)[:120]; falhou_algo = True
            if nome in casa_de: falhas_agenda.add(casa_de[nome])
            return {}

    rodar("Câmara: votações do plenário", lambda: camara_votacoes(ctx))
    rodar("Câmara: pauta do plenário", lambda: camara_pauta(ctx))
    rodar("Senado: votações do plenário", lambda: senado_votacoes(ctx))
    rodar("Senado: agenda do plenário", lambda: senado_agenda(ctx))
    rodar("Banco Central: Copom/Selic", lambda: bcb_copom(ctx, est_ant))
    rodar("Banco Central: Focus", lambda: focus(ctx))
    cal = rodar("IBGE: calendário", lambda: ibge_calendario(ctx, est_ant, anterior.get("agenda_oficial")))
    hoje_ibge = set(cal.get("hoje") or [])
    rodar("IBGE: IPCA", lambda: ipca(ctx, est_ant, hoje_ibge))
    rodar("IBGE: desemprego (PNAD)", lambda: pnad(ctx, est_ant, hoje_ibge))
    fontes["STF: pauta do plenário"] = "pulado: sem API aberta estável (portal só em HTML)"

    # agenda de fonte que falhou: fica a anterior (de hoje em diante)
    agenda.extend(a for a in anterior.get("agenda_oficial") or [] if isinstance(a, dict)
                  and a.get("casa") in falhas_agenda and str(a.get("data")) >= ctx.hoje.isoformat())
    # eventos anteriores continuam (fonte que falhou não apaga nada); somem depois de 3 dias
    corte = ctx.agora - timedelta(hours=RETER_H)
    for i, e in eventos_ant.items():
        if i not in eventos: eventos[i] = e
    idx = indice(feed)
    por_pid = {p["pid"]: p for p in idx}
    lista = []
    corte_vot = ctx.agora - timedelta(hours=RETER_VOT_H)
    for e in eventos.values():
        q = data_hora(e.get("quando"))
        if not q or q < corte_vot or q > ctx.agora + timedelta(days=4): continue
        pid, conf = ligar(e, idx)
        # depois de 3 dias só fica a votação com placar ligada a uma pauta (o placar continua na matéria)
        if q < corte and not (e.get("tipo") == "votacao" and e.get("placar") and pid): continue
        e["primeiro_visto"] = (eventos_ant.get(e["id"]) or {}).get("primeiro_visto") or iso(ctx.agora)
        e["pid"], e["confianca"] = pid, conf
        e["ja_no_feed"] = ja_no_feed(e, por_pid.get(pid))
        e["acionar"] = deve_acionar(e)
        lista.append(e)
    lista.sort(key=lambda e: e["quando"], reverse=True)
    lista = lista[:60]

    for a in agenda:
        pid, _ = ligar({"tipo": "agenda", **a}, idx)
        a["pid"] = pid
    agenda.sort(key=lambda a: (a["data"], a.get("hora") or "99", a.get("casa") or ""))

    para = {}
    for e in lista:
        if not e["pid"] or e["ja_no_feed"]: continue
        if data_hora(e["quando"]) < ctx.agora - timedelta(hours=36): continue
        para.setdefault(e["pid"], []).append({
            "evento": e["id"], "quando": e["quando"], "texto": e["fato"], "numero": e.get("numero"),
            "fonte": e["fonte"], "url": e["url"], "confianca": e["confianca"],
            "patch": {"op": "update_add", "pid": e["pid"], "texto": e["fato"]}})
    novos = [e["id"] for e in lista if e["primeiro_visto"] == iso(ctx.agora) and e["acionar"] and not e["ja_no_feed"]]
    out = {"gerado": iso(ctx.agora), "versao": 1, "novos": novos, "para_pautas": para, "eventos": lista,
           "agenda_oficial": agenda[:40], "estado": estado, "fontes": fontes}
    return out, ok_algo


def essencial(d):
    return json.dumps({k: d.get(k) for k in ("eventos", "para_pautas", "agenda_oficial", "estado")}, sort_keys=True, ensure_ascii=False)


def main(argv):
    fixtures, agora = None, datetime.now(SP)
    if "--fixtures" in argv:
        i = argv.index("--fixtures"); fixtures = argv[i + 1]; argv = argv[:i] + argv[i + 2:]
    if "--agora" in argv:
        i = argv.index("--agora"); agora = datetime.fromisoformat(argv[i + 1]).astimezone(SP); argv = argv[:i] + argv[i + 2:]
    if len(argv) < 2: print(__doc__); return 2
    try:
        with open(argv[0], encoding="utf-8") as fh: feed = json.load(fh)
    except Exception as e:
        print("feed ilegível:", repr(e)[:120]); feed = {}
    anterior = {}
    if os.path.exists(argv[1]):
        try:
            with open(argv[1], encoding="utf-8") as fh: anterior = json.load(fh)
        except Exception: anterior = {}
    out, ok = executar(feed, anterior, Ctx(agora, fixtures))
    for k, v in out["fontes"].items(): print(f"  {k}: {v}")
    print(f"{len(out['eventos'])} eventos, {sum(len(v) for v in out['para_pautas'].values())} para pautas, "
          f"{len(out['agenda_oficial'])} na agenda, novos: {out['novos']}")
    if not ok: print("nenhuma fonte respondeu: mantém o arquivo anterior"); return 0
    if anterior and essencial(anterior) == essencial(out): print("sem mudança"); return 0
    with open(argv[1], "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print("gravado", argv[1])
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
