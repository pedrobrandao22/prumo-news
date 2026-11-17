#!/usr/bin/env python3
"""Checagem automática do feed do Prumo News (v2) antes de publicar.

Uso:
  python3 validar.py feed.json [anterior.json]            (forma antiga, continua valendo)
  python3 validar.py feed.json --prev anterior.json [--json] [--virada] [--agora 2026-10-14T21:48:00-03:00]

  --ind X     indicadores.json (padrão: ao lado do feed, ou /tmp/prumo-site/indicadores.json): confere dólar e Ibovespa citados
  --prev X    feed anterior (o que estava no ar antes da sua rodada): enquetes, pesquisas, mudanças
  --json      imprime na ÚLTIMA linha um resumo {"erros":N,"avisos":N,"pendencias":[...]}
  --virada    modo da rodada da meia-noite: palavras de dia relativo viram ERRO
  --agora X   hora de referência para as pendências (padrão: relógio de Brasília)

Sai com código 1 se houver ERROS (corrija antes de publicar). AVISOS não bloqueiam, mas devem ser revistos.
PENDÊNCIAS são coisas que já deveriam ter desfecho (evento da agenda que começou, texto dizendo
"ainda não"/"até as 19h"): resolva-as primeiro na rodada rápida.
Só usa a biblioteca padrão do Python.
"""
import json, os, re, sys, difflib, unicodedata
from collections import Counter
from datetime import datetime, date, timedelta, timezone
from urllib.parse import urlparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paginas import confirma as foto_confirma  # noqa: E402  (18/11: a mesma confirmação da foto que o app e a prévia usam)

SP = timezone(timedelta(hours=-3))
TURNO2 = date(2026, 10, 25)
SECOES = ["politica", "economia", "brasil", "mundo", "esportes", "educacao"]
REGUA = ["cnn", "p360", "met", "jp", "ab", "gp", "cc", "cb", "sbt", "em"]
FAIXA = {"politica": (8, 10), "economia": (6, 8), "brasil": (4, 5), "mundo": (3, 5), "esportes": (3, 4), "educacao": (2, 3)}
DS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
FOTO_OK = re.compile(r"^https://([a-z0-9-]+\.)*(ebc\.com\.br|wikimedia\.org|staticflickr\.com|flickr\.com|unsplash\.com|pexels\.com|senado\.leg\.br|camara\.leg\.br|gov\.br|stf\.jus\.br|tse\.jus\.br)/", re.I)
DIAS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
TIT_MUD = ("O que mudou desde a manhã", "O que mudou desde ontem à noite", "O que mudou desde a noite")

# Ilustrações (modelos ILL do app) e limites de texto de cada campo, medidos no desenho de 400×240.
MODELOS = {"plenario", "debate", "celular", "remocao", "tribunal", "investigacao", "rua", "dinheiro", "pesquisa",
           "indicador", "globo", "escola", "campo", "clima", "seguranca", "generica"}
LIM = {
    "plenario": {"rotulo": 26, "legenda": 58},
    "debate": {"rotulo": 26},
    "celular": {"status": 20, "contador": 8},
    "remocao": {"rotulo": 40},
    "tribunal": {"rotulo": 28},
    "investigacao": {"carimbo": 15},
    "rua": {"rotulo": 40}, "escola": {"rotulo": 40}, "seguranca": {"rotulo": 40}, "generica": {"rotulo": 40},
    "clima": {"rotulo": 40, "temp": 6},
    "globo": {"rotulo": 40, "local": 15},
    "dinheiro": {"valor": 12, "legenda": 64},
    "pesquisa": {"titulo": 30, "a": 9, "b": 9},
    "indicador": {"rotulo": 26, "valor": 6, "variacao": 22, "legenda": 130},
    "campo": {"a": 15, "b": 15, "rotulo": 44},
}
SO_ILUSTRACAO = {"debate", "remocao", "tribunal", "investigacao", "rua", "escola", "seguranca", "generica", "globo"}
VISUAIS = {"linha_do_tempo", "numeros", "imagem", "pesquisas", "grafico"}
# chamadas vazias (manual seção 2, ESTILO): o título diz o fato, não manda o leitor "entender"
RUIDO = re.compile(r"(^|[:—–]\s*)(entenda|saiba|veja|confira|descubra)\b|\b(entenda|saiba|confira|descubra)\b|\bveja (como|o que|quem|quando|onde|por que)\b|\b(fique por dentro|tudo sobre|o que se sabe)\b", re.I)

# Coberturas (etapa 2): subtemas fixos por seção, estado da cobertura e formato.
TAXONOMIA = {
    "politica": ["Eleições 2026", "Congresso", "Planalto e governo", "STF e Judiciário", "Partidos", "Estados", "Outros"],
    "economia": ["Juros e inflação", "Contas públicas", "Mercados", "Atividade econômica", "Empresas", "Trabalho e renda", "Seu dinheiro", "Outros"],
    "brasil": ["Segurança", "Justiça e polícia", "Saúde", "Meio ambiente e clima", "Infraestrutura e transporte", "Sociedade", "Outros"],
    "mundo": ["América Latina", "EUA", "Europa", "Oriente Médio", "Ásia", "África", "Outros"],
    "educacao": ["Educação básica", "Ensino superior", "Enem e vestibulares", "Políticas", "Avaliações", "Outros"],
    "esportes": ["Brasileirão", "Série B", "Copa do Brasil", "Libertadores", "Sul-Americana", "Seleção", "Clubes", "Outros esportes"],
}
STATUS = ("ativa", "ao_vivo", "encerrada")
TIPOS = ("cobertura", "pontual")
MAX_DORMENTES, DIAS_DORMENTE = 40, 30
INDICADORES = {"dolar": "Dólar", "ibovespa": "Ibovespa", "selic": "Selic", "ipca12m": "IPCA 12m", "desemprego": "Desemprego"}
UFS = set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split())
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?-03:00$")

# Palavras de dia relativo: envelhecem de um dia para o outro (não há rodada entre 0h05 e 6h52).
REL_DIA = re.compile(r"\b(ainda hoje|hoje à noite|hoje(?! em dia)|esta noite|nesta noite|esta madrugada|nesta madrugada|"
                     r"esta manhã|nesta manhã|esta tarde|nesta tarde|depois de amanhã|amanhã|anteontem|ontem)\b", re.I)
REL_SEM = re.compile(r"\b((?:nest[ae]|dest[ae]|próxim[ao]|últim[ao]|n[ao]|d[ao]|até\s+[ao]|desde\s+[ao]|para\s+[ao])\s+"
                     r"(?:segunda|terça|quarta|quinta|sexta|sábado|domingo)(?:-feira)?)\b"
                     r"(?!-|\s*(?:\(\d|,?\s*(?:dia\s+)?\d{1,2}\b|vez|colocad|posi|lugar|fase|turma|rodada|edi|série|parte|maior|menor|"
                     r"economia|década|semana|instância|câmara|turma|seção|via|onda|dose|etapa|geração|força))", re.I)
DIA_NUM = re.compile(r"\b(segunda|terça|quarta|quinta|sexta|sábado|domingo)(?:-feira)?(?:\s*\((\d{1,2})(?:/(\d{1,2}))?\)|,\s*(?:dia\s+)?(\d{1,2})(?:/(\d{1,2}))?\b)", re.I)
# Frases de desfecho pendente.
PEND = re.compile(r"(ainda não|até as \d{1,2}h\d{0,2}|até o momento|até a última atualização|até o fechamento|"
                  r"não havia (?:começado|terminado|sido|saído|acabado)|não constava|não constavam|sem placar|sem resultado|"
                  r"em andamento|aguarda(?:m|va|vam)? (?:o resultado|a votação|a decisão|o julgamento|o placar)|"
                  r"até a apuração|ainda hoje|esta noite|nesta noite|deve ser votad[ao] hoje|pode ser votad[ao] hoje)", re.I)
PEND_FRACA = re.compile(r"^(ainda não|até o momento|até a última atualização|até o fechamento|em andamento)$", re.I)

# Campos de texto em que dia relativo vira ERRO na virada (os demais, como atualizações datadas, ficam AVISO).
PRINCIPAL = re.compile(r"(neutro\.texto|direita\.texto|esquerda\.texto|\] contexto|\] proximo|explicadores\.[^.]+\.texto)$")

erros, avisos = [], []
# nomes de veículos (para não citar fonte a cada frase); órgãos oficiais e palavras comuns ficam de fora
VEIC_FORA = {"TSE", "TCU", "STF", "STJ", "PF", "IBGE", "Banco Central", "Placar", "Massa", "Terra", "Observador", "Agora com Você", "Netfla", "Mix Vale", "Notícias do Planalto", "Globe TV", "Cada Minuto", "Titres Presse"}
VEIC_EXTRA = ["g1", "Folha de S.Paulo", "Estadão", "O Globo", "Valor Econômico", "UOL", "Reuters", "Bloomberg", "Agência Câmara"]
VEIC_RE = None
def preparar_veiculos(f):
    global VEIC_RE
    ns = set(VEIC_EXTRA)
    for k, v in (f.get("fontes") or {}).items():
        for n in (k, v):
            if isinstance(n, str) and len(n) >= 3 and n not in VEIC_FORA and not n.islower(): ns.add(n)
    ns = sorted(ns, key=len, reverse=True)
    VEIC_RE = re.compile(r"(?<![\w])(" + "|".join(re.escape(n) for n in ns) + r")(?![\w])") if ns else None
def veiculos_em(t):
    if not isinstance(t, str) or not t or VEIC_RE is None: return []
    out = []
    for m in VEIC_RE.finditer(t):
        if m.group(1) not in out: out.append(m.group(1))
    return out
def E(m): erros.append(m)
def A(m): avisos.append(m)
def norm(s): return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
def nums(s):
    out = set()
    for n in re.findall(r"\d[\d.,]*", str(s or "")):
        n = n.rstrip(".,").replace(".", "").replace(",", ".")
        if n and n not in {"1", "2"}: out.add(n)
    return out
def dt(s):
    try: return datetime.fromisoformat(str(s))
    except Exception: return None

# ---------- funções compartilhadas (resumo.py e aplicar.py importam daqui) ----------
def edicao_de(t):
    hm = f"{t.hour}h" + (f"{t.minute:02d}" if t.minute else "")
    return f"{DS[t.weekday()]}, {t.day} {MESES[t.month - 1]} · {hm}"

def contagem_de(d):
    n = (TURNO2 - d).days
    return f"{n} dias para o 2º turno" if n > 1 else "1 dia para o 2º turno" if n == 1 else "Hoje é o 2º turno" if n == 0 else ""

def dia_rotulo(d):
    """'quarta (14)'"""
    return f"{DIAS[d.weekday()]} ({d.day})"

def hora_agenda(h):
    m = re.match(r"^\s*(\d{1,2})\s*(?:h|:)\s*(\d{2})?", str(h or ""))
    return (int(m[1]), int(m[2] or 0)) if m else None

def dur_agenda(texto):
    t = " " + norm(texto) + " "
    if re.search(r" x |jogo|partida|semifinal|final|rodada|classico", t): return 125
    if re.search(r"sessao|plenario|votac|vota |julgamento|julga|analisa|cpi|comissao|audiencia", t): return 300
    if re.search(r"debate|entrevista|sabatina", t): return 150
    return 120

# bastidor da redação no texto do leitor (manual 3b). 16/11: notas de manutenção ("atualização duplicada de 14/11
# removida", "Tema passa a Dólar e Bolsa") apareceram como manchete nas Últimas da Capa.
BASTIDOR_SEMPRE = (r"\bo Prumo (ainda )?n[ãa]o (leu|conferiu|achou|encontrou|confirmou)|\bas buscas n[ãa]o\b|\bconferente\b"
                   r"|atualiza[çc][ãa]o (duplicada|repetida)|\bduplicad[ao]s?\b[^;.]{0,40}\bremovid[ao]s?\b"
                   r"|\bremovid[ao]s? (da|do) (feed|edi[çc][ãa]o|lista)\b|^\s*tema passa a\b|;\s*tema passa a\b|\bnota interna\b")
BASTIDOR_RODADA = r"|\bnesta rodada\b|\brodada anterior\b|\b(na|da) rodada (r[áa]pida|completa)\b"


def bastidor(t, esporte=False):
    return re.search(BASTIDOR_SEMPRE + ("" if esporte else BASTIDOR_RODADA), str(t or ""), re.I)


def campos_texto(f):
    """(local, tipo, texto). tipo 'estrito' = títulos, enquetes, breves, agenda, mudanças (não podem ter dia relativo)."""
    for p in f.get("pautas") or []:
        pid = p.get("id", "?")
        n = p.get("neutro") or {}
        yield f"[{pid}] neutro.titulo", "estrito", n.get("titulo", "")
        yield f"[{pid}] neutro.texto", "texto", n.get("texto", "")
        if isinstance(p.get("subtitulo"), str): yield f"[{pid}] subtitulo", "estrito", p.get("subtitulo")
        for lado in ("neutro", "direita", "esquerda"):
            v = p.get(lado) if isinstance(p.get(lado), dict) else {}
            for i, x in enumerate(v.get("pontos") if isinstance(v.get("pontos"), list) else []):
                if isinstance(x, str): yield f"[{pid}] {lado}.pontos.{i}", "estrito", x
        for lado in ("direita", "esquerda"):
            v = p.get(lado) or {}
            if v:
                yield f"[{pid}] {lado}.titulo", "estrito", v.get("titulo", "")
                yield f"[{pid}] {lado}.texto", "texto", v.get("texto", "")
        for i, x in enumerate(p.get("social") if isinstance(p.get("social"), list) else []):
            if isinstance(x, str): yield f"[{pid}] social.{i}", "estrito", x
        for i, x in enumerate(p.get("essencial") or []): yield f"[{pid}] essencial.{i}", "texto", str(x)
        for k in ("o_que_muda", "contexto", "proximo", "por_que", "e_o_brasil"):
            yield f"[{pid}] {k}", "texto", p.get(k) or ""
        for i, q in enumerate(p.get("faq") if isinstance(p.get("faq"), list) else []):
            if not isinstance(q, dict): continue
            yield f"[{pid}] faq.{i}.p", "texto", q.get("p", "")
            yield f"[{pid}] faq.{i}.r", "texto", q.get("r", "")
        en = p.get("enquete") or {}
        if en:
            yield f"[{pid}] enquete.pergunta", "enquete", en.get("pergunta", "")
            for i, o in enumerate(en.get("opcoes") or []): yield f"[{pid}] enquete.opcoes.{i}", "enquete", o
        for i, u in enumerate(p.get("atualizacoes") or []): yield f"[{pid}] atualizacoes.{i}.texto", "texto", u.get("texto", "")
        for i, u in enumerate(p.get("correcoes") or []): yield f"[{pid}] correcoes.{i}.texto", "texto", u.get("texto", "")
        c = p.get("checagem") or {}
        if c: yield f"[{pid}] checagem.texto", "texto", c.get("texto", "")
        for vi, v in enumerate(p.get("visuais") or []):
            if v.get("titulo"): yield f"[{pid}] visuais.{vi}.titulo", "texto", v.get("titulo", "")
            for ii, it in enumerate(v.get("itens") or []):
                for k in ("quando", "texto", "rotulo"):
                    if isinstance(it, dict) and isinstance(it.get(k), str) and it.get(k): yield f"[{pid}] visuais.{vi}.itens.{ii}.{k}", "texto", it[k]
        d = (p.get("imagem") or {}).get("dados") or {}
        for k, v in d.items():
            if isinstance(v, str): yield f"[{pid}] imagem.dados.{k}", "texto", v
    for i, b in enumerate(f.get("breves") or []): yield f"breves.{i}.titulo", "estrito", b.get("titulo", "")
    rd = f.get("resumo_dia") if isinstance(f.get("resumo_dia"), dict) else {}
    for i, it in enumerate(rd.get("itens") if isinstance(rd.get("itens"), list) else []):
        if isinstance(it, dict): yield f"resumo_dia.itens.{i}.texto", "estrito", it.get("texto", "")
    for i, a in enumerate(f.get("agenda") or []): yield f"agenda.{i}.texto", "estrito", a.get("texto", "")
    for i, c in enumerate(f.get("calendario") or []): yield f"calendario.{i}.texto", "estrito", c.get("texto", "")
    for i, it in enumerate((f.get("mudancas") or {}).get("itens") or []): yield f"mudancas.itens.{i}.texto", "estrito", it.get("texto", "")
    for k, e in (f.get("explicadores") or {}).items():
        yield f"explicadores.{k}.texto", "texto", e.get("texto", "")
        for i, x in enumerate(e.get("pontos") or []): yield f"explicadores.{k}.pontos.{i}", "texto", x
    for i, q in enumerate(f.get("quiz") or []):
        yield f"quiz.{i}.pergunta", "texto", q.get("pergunta", "")
        yield f"quiz.{i}.explicacao", "texto", q.get("explicacao", "")
    for i, it in enumerate((f.get("semana") or {}).get("itens") or []): yield f"semana.itens.{i}.texto", "texto", it.get("texto", "")

def relativas(f):
    """Lista (local, tipo, trecho, palavra, classe) com palavras de dia relativo."""
    out = []
    for loc, tipo, t in campos_texto(f):
        for rx, classe in ((REL_DIA, "dia"), (REL_SEM, "semana")):
            for m in rx.finditer(str(t or "")):
                a, b = max(0, m.start() - 40), min(len(t), m.end() + 40)
                out.append((loc, tipo, t[a:b].replace("\n", " "), m.group(0), classe))
    return out

def sugestao(palavra, ref):
    """Troca sugerida para uma palavra relativa escrita no dia ref (date)."""
    w = palavra.lower()
    if "depois de amanhã" in w: return dia_rotulo(ref + timedelta(days=2))
    if "anteontem" in w: return dia_rotulo(ref - timedelta(days=2))
    if "amanhã" in w: return dia_rotulo(ref + timedelta(days=1))
    if "ontem" in w: return dia_rotulo(ref - timedelta(days=1))
    if "noite" in w: return f"na noite de {dia_rotulo(ref)}"
    if "madrugada" in w: return f"na madrugada de {dia_rotulo(ref)}"
    if "manhã" in w: return f"na manhã de {dia_rotulo(ref)}"
    if "tarde" in w: return f"na tarde de {dia_rotulo(ref)}"
    if "hoje" in w: return dia_rotulo(ref)
    for i, d in enumerate(DIAS):
        if d in w:
            k0 = (i - ref.weekday()) % 7
            fut = ref + timedelta(days=k0 or 7)
            pas = ref - timedelta(days=(ref.weekday() - i) % 7 or 7)
            if k0 == 0 and not re.search(r"próxim|últim|passad", w): return dia_rotulo(ref)
            if re.search(r"próxim", w): return dia_rotulo(fut)
            if re.search(r"últim|passad", w): return dia_rotulo(pas)
            if re.search(r"nest|dest", w):
                return dia_rotulo(fut if (fut - ref).days <= (ref - pas).days else pas)
            return f"{dia_rotulo(pas)} se já passou, ou {dia_rotulo(fut)} se ainda vem"
    return "o dia da semana com a data, ex.: " + dia_rotulo(ref)

def pendencias(f, agora, IND=None):
    """Itens que já deveriam ter desfecho. agora: datetime com fuso. IND: indicadores.json (fechamento do mercado)."""
    out = []
    hoje = agora.date()
    P = {p.get("id"): p for p in f.get("pautas") or []}
    for a in f.get("agenda") or []:
        try: d = date.fromisoformat(str(a.get("data", "")))
        except ValueError: continue
        tx = str(a.get("texto", ""))[:70]
        if d < hoje:
            out.append({"pid": a.get("pid") or "", "tipo": "agenda_passada", "texto": f"agenda de {d.strftime('%d/%m')} ainda no feed: registre o desfecho na pauta e tire da agenda — {tx}"})
            continue
        if d != hoje: continue
        hm = hora_agenda(a.get("hora")) or hora_tipica(a.get("texto"))  # Focus sem hora: sai às 8h25
        if hm:
            ini = datetime(d.year, d.month, d.day, hm[0], hm[1], tzinfo=SP)
            if agora >= ini:
                fim = ini + timedelta(minutes=dur_agenda(a.get("texto")))
                est = "já deve ter terminado" if agora >= fim else "em andamento"
                hr = a.get("hora") if hora_agenda(a.get("hora")) else f"{hm[0]}h{hm[1]:02d} (horário de costume)"
                out.append({"pid": a.get("pid") or "", "tipo": "agenda_comecou", "texto": f"{hr} {est}: confira o desfecho — {tx}"})
        elif agora.hour >= 20:
            out.append({"pid": a.get("pid") or "", "tipo": "agenda_sem_hora", "texto": f"evento de {dia_rotulo(d)} sem horário: confira se aconteceu — {tx}"})
    com_agenda = {a.get("pid") for a in f.get("agenda") or [] if str(a.get("data", "")) <= hoje.isoformat()}
    for p in f.get("pautas") or []:
        pid = p.get("id", "?")
        ups = sorted(p.get("atualizacoes") or [], key=lambda u: str(u.get("hora", "")))
        campos = [("neutro.texto", (p.get("neutro") or {}).get("texto", "")), ("proximo", p.get("proximo") or "")]
        if ups: campos.append(("última atualização", ups[-1].get("texto", "")))
        for k, t in campos:
            achou = []
            for m in PEND.finditer(str(t or "")):
                w = m.group(0).lower()
                hm = re.match(r"até as (\d{1,2})h(\d{0,2})", w)
                if hm:  # "até as 19h50": só é pendência depois que essa hora passou
                    h, mi = int(hm[1]), int(hm[2] or 0)
                    if h > 23 or agora < datetime(hoje.year, hoje.month, hoje.day, h, min(mi, 59), tzinfo=SP): continue
                elif PEND_FRACA.match(w) and pid not in com_agenda:
                    continue  # "ainda não", "até o momento": só conta se a pauta tem evento de hoje (ou passado) na agenda
                achou.append(m)
            if achou:
                m = achou[0]
                a, b = max(0, m.start() - 50), min(len(t), m.end() + 70)
                out.append({"pid": pid, "tipo": "frase_pendente", "texto": f"{k}: …{t[a:b]}…"})
    out += pendencias_do_dia(f, agora, IND)
    return out


def pendencias_do_dia(f, agora, IND=None):
    """Edição parada e mercado de outro dia (16/11: rápidas da tarde "sem novidade" com o Feed só de manhã)."""
    out = []
    hoje = agora.date()
    if hoje.weekday() >= 5: return out
    ps = [p for p in f.get("pautas") or [] if isinstance(p, dict)]
    # EDIÇÃO PARADA: de tarde, nenhuma notícia de Política, Economia, Brasil ou Mundo ganhou fato novo há 6 h
    if 13 <= agora.hour < 23:
        hs = [h for h in (ultimo_fato(p) for p in ps if p.get("secao") in ("politica", "economia", "brasil", "mundo")) if h and h <= agora]
        ult = max(hs) if hs else None
        if ult and (agora - ult).total_seconds() > 6 * 3600:
            brs = [b for b in f.get("breves") or [] if isinstance(b, dict) and b.get("secao") in ("politica", "economia", "brasil", "mundo")]
            de_hoje = [b for b in brs if (dt(b.get("hora")) or agora).date() == hoje]
            ex = "; ".join(str(b.get("titulo"))[:60] for b in (de_hoje or brs)[:3])
            out.append({"pid": "", "tipo": "edicao_parada", "texto": f"nenhuma notícia ganhou fato novo desde {ult.strftime('%d/%m %Hh%M')} "
                        f"({int((agora - ult).total_seconds() // 3600)} h): quem abre agora vê o Feed da manhã. Transforme em notícia (add_pauta ou update_add) "
                        f"o fato mais importante da tarde" + (f" (breves: {ex})" if ex else "") + " (manual 3b, EDIÇÃO DA TARDE)"})
    # MERCADO DE OUTRO DIA: depois do fechamento (18h), a notícia de mercado ainda fala do pregão anterior
    ind = IND or {}
    datas_ind = {str((ind.get(k) or {}).get("data") or "") for k in ("dolar", "ibovespa")}
    if agora.hour >= 18 and hoje.isoformat() in datas_ind:
        for p in ps:
            tit = str((p.get("neutro") or {}).get("titulo") or "")
            if p.get("subtema") != "Mercados" or not re.search(r"d[óo]lar|ibovespa|\bbolsa\b", tit, re.I): continue
            ds = [d for _, _, d, _ in datas_em(tit, hoje) if d]
            uf = ultimo_fato(p)
            if (ds and max(ds) < hoje) or (not ds and uf and uf.date() < hoje):
                out.append({"pid": p.get("id") or "", "tipo": "mercado_velho", "texto": f"o mercado já fechou hoje e a notícia ainda é de outro pregão ('{tit[:60]}'): "
                            "registre o fechamento do dia (update_add, conferido em indicadores.json e num veículo) (manual 3b, EDIÇÃO DA TARDE)"})
    return out

# ---------- checagem ----------
# números do mercado no texto × indicadores.json (dólar e Ibovespa, gravados pelo robô de cotações)
IND_CTX = {"dolar": re.compile(r"d[óo]lar", re.I), "ibovespa": re.compile(r"ibovespa|\bbolsa\b|\bB3\b", re.I)}
IND_VAL = {"dolar": re.compile(r"R\$\s?(\d{1,2},\d{2,4})(?!\d)"), "ibovespa": re.compile(r"(\d{2,3}(?:\.\d{3})|\d{2,3}(?:,\d)?\s?mil)\s*pontos", re.I)}
IND_PCT = re.compile(r"(\d{1,2}(?:,\d{1,2})?)\s?%\s*(na semana|no dia(?!\s+\d)|em uma semana|em sete dias)", re.I)
BOLSA_OUTRA = re.compile(r"bolsa\s+(fam[íi]lia|de nova york|dos eua|de t[óo]quio|de londres|de xangai|de valores de (nova york|londres|t[óo]quio))|bolsas? (americanas?|europeias?|asi[áa]ticas?)|bolsa[- ](atleta|escola|verde|de estudos)", re.I)
VARIACAO_ANTES = re.compile(r"(perde|perdeu|ganha|ganhou|cai|caiu|sobe|subiu|recua|recuou|avança|avançou|alta|queda|salto|tombo|mais|menos|variação)( de| cerca de| quase)?\s*$", re.I)
def fmt_ind(k, v): return f"R$ {v:.2f}".replace(".", ",") if k == "dolar" else f"{v:,.0f}".replace(",", ".")
OUTRA_MOEDA = re.compile(r"\beuro|\bpeso|\byuan|\biene|\blibra", re.I)

def ler_indicadores(caminho):
    for c in [caminho, "indicadores.json", "/tmp/prumo-site/indicadores.json"]:
        if not c: continue
        try:
            d = json.load(open(c, encoding="utf-8"))
            return {x.get("id"): x for x in d.get("itens") or [] if isinstance(x, dict)}
        except Exception: continue
    return None

def num_br(t):
    t = t.strip().lower()
    if "mil" in t: return float(re.sub(r"\s*mil", "", t).replace(",", ".")) * 1000
    return float(t.replace(".", "").replace(",", "."))

def checar_mercado(f, IND, ref):
    """Erro em título, subtítulo, pontos, resumo e capa; aviso no texto. Só dólar e Ibovespa (os que têm série diária)."""
    if not IND: return
    ok = {}
    for k in ("dolar", "ibovespa"):
        x = IND.get(k) or {}
        se = [v for v in x.get("serie") or [] if isinstance(v, (int, float)) and v > 0]
        try: dd = date.fromisoformat(str(x.get("data", "")))
        except ValueError: continue
        if len(se) < 6 or (ref.date() - dd).days > 4: continue
        try: var = float(str(x.get("variacao", "")).replace("%", "").replace(",", ".").replace("+", ""))
        except ValueError: var = None
        ult = se[-10:]
        # semana vale para qualquer um dos últimos 6 pregões (dia, para os 3 últimos): "caiu 18% na semana" sobre a semana encerrada na
        # sexta (30) é verdade na terça (3), quando a semana "móvel" de 5 pregões dá 6% (ERRO falso em 03/11)
        sems = [abs(se[i] / se[i - 5] - 1) * 100 for i in range(max(5, len(se) - 6), len(se))]
        dias = [abs(se[i] / se[i - 1] - 1) * 100 for i in range(max(1, len(se) - 3), len(se))] + ([abs(var)] if var is not None else [])
        # o robô grava só o FECHAMENTO (18h30, decisão de 17/11/2026): num dia útil, antes disso, o pregão de hoje ainda não está no
        # arquivo e a variação "no dia" citada não tem com o que comparar (fica para a conferência em 2 veículos, manual 3b)
        sem_hoje = dd < ref.date() and ref.weekday() < 5 and ref.hour >= 9
        ok[k] = {"lo": min(ult) * 0.97, "hi": max(ult) * 1.03, "sem": sems[-1], "sems": sems, "dia": abs(var) if var is not None and not sem_hoje else None,
                 "dias": dias, "nome": x.get("nome") or k}
    if not ok: return
    def campos():
        cp = f.get("capa") or {}
        if cp.get("linha_fina"): yield "capa.linha_fina", True, cp["linha_fina"]
        for i, it in enumerate((f.get("resumo_dia") or {}).get("itens") or []):
            if isinstance(it, dict): yield "resumo_dia", True, it.get("texto") or ""
        for p in f.get("pautas") or []:
            if p.get("secao") not in ("economia", None) and not any(IND_CTX[k].search(json.dumps(p.get("neutro") or {}, ensure_ascii=False)) for k in ok): continue
            pid = p.get("id")
            for lado in ("neutro", "direita", "esquerda"):
                v = p.get(lado) or {}
                if not isinstance(v, dict): continue
                yield f"[{pid}] {lado}.titulo", True, v.get("titulo") or ""
                for t in v.get("pontos") or []: yield f"[{pid}] {lado}.pontos", True, t if isinstance(t, str) else ""
                yield f"[{pid}] {lado}.texto", False, v.get("texto") or ""
            yield f"[{pid}] subtitulo", True, p.get("subtitulo") or ""
            for u in p.get("atualizacoes") or []:
                if isinstance(u, dict): yield f"[{pid}] atualizacoes", False, u.get("texto") or ""
    for onde, estrito, t in campos():
        for fr in re.split(r"(?<=[.!?;])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9])", str(t)):
            if OUTRA_MOEDA.search(fr): continue
            outra_bolsa = [m.span() for m in BOLSA_OUTRA.finditer(fr)]
            ctx = sorted((m.start(), k) for k in ok for m in IND_CTX[k].finditer(fr) if not (k == "ibovespa" and any(a <= m.start() < b for a, b in outra_bolsa)))
            if not ctx: continue
            def dono(pos):
                d = [k for s0, k in ctx if s0 <= pos]
                return d[-1] if d else None
            problemas = []
            for k in ok:
                for m in IND_VAL[k].finditer(fr):
                    if dono(m.start()) != k: continue
                    perto = [s0 for s0, kk in ctx if kk == k and s0 <= m.start()]
                    if k == "dolar" and (not perto or m.start() - perto[-1] > 30 or "R$" in fr[perto[-1]:m.start()]): continue  # outro R$ da frase (gasolina etc.)
                    if VARIACAO_ANTES.search(fr[max(0, m.start() - 30):m.start()]): continue  # "perde 37 mil pontos" é variação, não nível
                    try: v = num_br(m.group(1))
                    except ValueError: continue
                    if not ok[k]["lo"] <= v <= ok[k]["hi"]:
                        problemas.append(f"{ok[k]['nome']} {m.group(0).strip()} fora da faixa dos últimos 10 pregões ({fmt_ind(k, ok[k]['lo'] / 0.97)} a {fmt_ind(k, ok[k]['hi'] / 1.03)})")
            for m in IND_PCT.finditer(fr):
                k = dono(m.start())
                if not k: continue
                antes = [s0 for s0, kk in ctx if kk == k and s0 <= m.start()]
                if not antes or m.start() - antes[-1] > 90: continue
                c = float(m.group(1).replace(",", "."))
                if "dia" in m.group(2).lower():
                    real = ok[k]["dia"]
                    if real is None or any(abs(c - r) <= max(0.5, 0.2 * r) for r in ok[k]["dias"]): continue
                else:
                    real = ok[k]["sem"]
                    if any(abs(c - r) <= max(1.5, 0.2 * r) for r in ok[k]["sems"]): continue
                problemas.append(f"{ok[k]['nome']}: \"{m.group(0)}\", mas a variação foi de {real:.2f}% ({m.group(2)})")
            for pr_ in problemas:
                (E if estrito else A)(f"{onde}: número de mercado não bate com os indicadores — {pr_}. Confira na fonte.")


# ---------- regras de 15/11 (achados do testador no site real) ----------
# Palavras sem conteúdo, para medir o que uma frase acrescenta ao título ou a outra atualização.
VAZIAS = set("o a os as um uma uns umas de do da dos das em no na nos nas ao aos à às para pra por pelo pela pelos pelas com sem "
             "que e ou se seu sua seus suas mais muito já ainda isso esse essa este esta foi ser são está estão tem têm após "
             "sobre entre como quando onde também até".split())
VAZIAS_N = {norm(x) for x in VAZIAS}
def palavras(t):
    return {w for w in re.findall(r"[0-9a-z]+", norm(t)) if len(w) >= 2 and w not in VAZIAS_N}

# Nome de cobertura que parece propaganda (o app mostra "Cobertura completa · <passo atual>"; 15/11 "· Anúncio").
PUBLI_EXATO = re.compile(r"^\s*(an[úu]ncios?|publicidade|patrocinad[oa]s?|propaganda|publi|publieditorial|conte[úu]do patrocinado|"
                         r"informe publicit[áa]rio|oferta|promo[çc][ãa]o|ad|ads)\s*[.:!]?\s*$", re.I)
PUBLI_PALAVRA = re.compile(r"\b(an[úu]ncio|publicidade|patrocinad[oa]|propaganda|publieditorial|informe publicit[áa]rio)\b", re.I)
# tema que é só a seção, o subtema ou uma instituição não é nome de cobertura ("Mercado", "STF", "Fiscal")
TEMA_GENERICO = {"stf", "supremo", "judiciario", "mercado", "mercados", "governo", "planalto", "congresso", "senado", "camara",
                 "economia", "politica", "fiscal", "contas publicas", "clima", "diplomacia", "brasil", "mundo", "esportes",
                 "educacao", "cambio", "juros", "noticias", "geral", "outros", "cobertura", "eua"}

# Evento anunciado no futuro com data que já passou (Esportes da Capa, 15/11: "Série B fecha no sábado (14), às 16h30")
# FUTURO_FORTE só faz sentido antes do evento; FUTURO_PRESENTE ("fecha", "decide") também serve de resultado ("dólar fecha a R$ 5,67
# na sexta (13)"), então só conta com horário marcado na mesma frase ("às 16h30") ou com confronto "A x B"
FUTURO_FORTE = re.compile(r"\b(reabre|reabrem|volta|voltam|ter[áa]|ser[áa]|ser[ãa]o|vai|v[ãa]o|deve|devem|estreia|estreiam|promete|prometem|prev[êe]|"
                          r"prevista?o?s?|marcad[oa]s?|agendad[oa]s?|programad[oa]s?|aguarda|aguardam)\b", re.I)
FUTURO_PRESENTE = re.compile(r"\b(fecha|fecham|come[çc]a|come[çc]am|abre|abrem|decide|decidem|enfrenta|enfrentam|recebe|recebem|visita|visitam|"
                             r"pega|pegam|encara|encaram|joga|jogam|disputa|disputam|tem|t[êe]m|acontece|acontecem|ocorre|ocorrem|define|definem|"
                             r"julga|julgam|vota|votam)\b", re.I)
HORA_EVENTO = re.compile(r"\b[àa]s?\s+(\d{1,2})h(\d{2})?\b", re.I)
DDMM = re.compile(r"\b(\d{1,2})/(\d{1,2})\b(?!/|\d)")
# preposições que "amarram" uma data na frase; sem elas, a data fica solta ("votos zeram, 16/12 vale")
PREP_DATA = re.compile(r"(\b(em|até|de|do|da|desde|após|apos|antes de|depois de|entre|e|ou|a|à|para|no|na|dia|partir de|marcad[oa] para)\s*)$", re.I)

CLIMA_RE = re.compile(r"clima|aquecimento|emiss|carbono|desmat|florest|queimad|chuva|enchente|seca\b|calor|ambient|f[óo]ss|"
                      r"energia|metano|biodivers|tfff|petr[óo]leo|renov[áa]v|oceano|temperatura|tornado|temporal|temporais|ciclone|tempestade|vendaval|"
                      r"granizo|el ni[ñn]o|la ni[ñn]a|frente fria|onda de", re.I)
NAO_CLIMA_RE = re.compile(r"\bdefesa\b(?! civil)|militar|\barmas?\b|ca[çc]as?\b|m[íi]sseis|m[íi]ssil|com[ée]rcio|comercia|tarif|diplomac|"
                          r"visita de estado|guerra|cessar-fogo|investimento", re.I)


def resolver_data(wd, dn, mes, hoje):
    """Data de "sábado (14)" ou "14/11" (wd = índice do dia da semana ou None). None se não der para saber."""
    try:
        dn = int(dn)
        if mes:
            mm = int(mes); y = hoje.year + (1 if mm < hoje.month - 6 else -1 if mm > hoje.month + 6 else 0)
            d = date(y, mm, dn)
            return d if wd is None or d.weekday() == wd else None
        cands = [hoje + timedelta(days=k) for k in range(-20, 21) if (hoje + timedelta(days=k)).day == dn]
        if wd is not None: cands = [c for c in cands if c.weekday() == wd]
        return min(cands, key=lambda c: abs((c - hoje).days)) if cands else None
    except (ValueError, TypeError):
        return None


def datas_em(t, hoje):
    """[(início, fim, data, texto)] das datas citadas ("sábado (14)", "sexta, 13", "16/12")."""
    out, ocup = [], []
    for m in DIA_NUM.finditer(t):
        d = resolver_data(DIAS.index(m[1].lower()), m[2] or m[4], m[3] or m[5], hoje)
        out.append((m.start(), m.end(), d, m[0])); ocup.append((m.start(), m.end()))
    for m in DDMM.finditer(t):
        if any(a <= m.start() < b for a, b in ocup): continue
        if not (1 <= int(m[2]) <= 12 and 1 <= int(m[1]) <= 31): continue
        out.append((m.start(), m.end(), resolver_data(None, m[1], m[2], hoje), m[0]))
    return out


def ultimo_fato(p):
    hs = [dt(p.get("hora"))] + [dt(u.get("hora")) for u in (p.get("atualizacoes") or []) if isinstance(u, dict) and not str(u.get("texto", "")).startswith("Correção")]
    hs = [h for h in hs if h]
    return max(hs) if hs else None


def valores_dolar(t):
    """Cotações do dólar citadas na frase (R$ 5,66 perto de "dólar")."""
    out = []
    for fr in re.split(r"(?<=[.;!?])\s+", str(t or "")):
        if not re.search(r"d[óo]lar", fr, re.I) or OUTRA_MOEDA.search(fr): continue
        for m in re.finditer(r"R\$\s?(\d,\d{2})(?!\d)", fr):
            antes = fr[:m.start()]
            k = max((x.start() for x in re.finditer(r"d[óo]lar", antes, re.I)), default=-1)
            if k < 0 or m.start() - k > 40 or "R$" in fr[k:m.start()]: continue
            out.append(float(m[1].replace(",", ".")))
    return out


def checar_regras_1511(f, ant, ref, virada, IND=None, agora=None):
    ps = [p for p in f.get("pautas") or [] if isinstance(p, dict)]
    P = {p.get("id"): p for p in ps}
    hoje = ref.date()
    AP = {p.get("id"): p for p in (ant or {}).get("pautas") or [] if isinstance(p, dict)}
    AD = {d.get("id"): d for d in (ant or {}).get("dormentes") or [] if isinstance(d, dict)}
    E_ = A if virada else E  # na virada (sem IA) as regras novas só avisam

    # 1. MANCHETE DO DIA (manual 3b): depois da rápida das 9h48 (dia útil) ou da completa (fim de semana).
    # 16/11: a referência é o RELÓGIO (agora), não o atualizado_em do feed. As rápidas das 9h48 em diante rodam o
    # validar.py no feed que está no ar; quando nenhuma publica, o atualizado_em fica parado na edição da manhã (7h46,
    # antes do limite) e a regra nunca disparava: as rápidas passavam "sem novidade" com a manchete de ontem.
    cp = f.get("capa") if isinstance(f.get("capa"), dict) else {}
    m = cp.get("manchete")
    rel_ = agora if agora is not None and agora >= ref else ref
    hoje_m = rel_.date()
    minutos = rel_.hour * 60 + rel_.minute
    limite = 9 * 60 + 40 if hoje_m.weekday() < 5 else 6 * 60 + 40
    if m in P and not virada and minutos >= limite:
        um = ultimo_fato(P[m])
        if um and um.date() < hoje_m:
            novas = sorted((p for p in ps if p.get("id") != m and p.get("secao") in ("politica", "economia", "brasil", "mundo")
                            and (ultimo_fato(p) or rel_).date() == hoje_m and (ultimo_fato(p) or rel_) <= rel_),
                           key=lambda p: -(p.get("prioridade") or 0))
            msg = (f"capa.manchete '{m}' é de {um.strftime('%d/%m %Hh%M')} (o leitor vê \"atualizado ontem\"): troque pela notícia mais importante de hoje"
                   + (f" (ex.: {', '.join(p.get('id') for p in novas[:3])})" if novas else "") + " ou registre um fato real do dia na manchete (manual 3b, MANCHETE DO DIA)")
            (E if novas else A)(msg)

    # 2. UM NÚMERO SÓ (manual 3b): o mesmo dólar em título, subtítulo, pontos, quadro de números, ilustração, linha fina e resumo
    vistos = []
    def junta(onde, t):
        for v in valores_dolar(t): vistos.append((v, onde))
    junta("capa.linha_fina", cp.get("linha_fina"))
    for it in ((f.get("resumo_dia") or {}).get("itens") or []) if isinstance(f.get("resumo_dia"), dict) else []:
        if isinstance(it, dict): junta("resumo_dia", it.get("texto"))
    for p in ps:
        pid = p.get("id"); n = p.get("neutro") or {}
        junta(f"[{pid}] neutro.titulo", n.get("titulo")); junta(f"[{pid}] subtitulo", p.get("subtitulo"))
        for x in n.get("pontos") or []: junta(f"[{pid}] neutro.pontos", x if isinstance(x, str) else "")
        for v in p.get("visuais") or []:
            if isinstance(v, dict) and v.get("tipo") == "numeros":
                for it in v.get("itens") or []:
                    if isinstance(it, dict) and re.search(r"d[óo]lar", f"{it.get('rotulo', '')} {v.get('titulo', '')}", re.I):
                        mm_ = re.search(r"(\d,\d{2})(?!\d)", str(it.get("valor", "")))
                        if mm_ and "R$" in str(it.get("valor", "")): vistos.append((float(mm_[1].replace(",", ".")), f"[{pid}] quadro de números"))
        im = p.get("imagem") if isinstance(p.get("imagem"), dict) else {}
        dd = im.get("dados") if isinstance(im.get("dados"), dict) else {}
        if im.get("modelo") == "dinheiro" and re.search(r"d[óo]lar", str(dd.get("legenda", "")), re.I):
            mm_ = re.search(r"R\$\s?(\d,\d{2})(?!\d)", str(dd.get("valor", "")))
            if mm_: vistos.append((float(mm_[1].replace(",", ".")), f"[{pid}] ilustração"))
        # quadro de números de um dia diferente do título ("fechamento de quinta (12)" com título da sexta)
        dt_tit = {d for _, _, d, _ in datas_em(str(n.get("titulo") or ""), hoje) if d}
        if dt_tit and re.search(r"d[óo]lar|ibovespa|bolsa", str(n.get("titulo") or ""), re.I):
            for v in p.get("visuais") or []:
                if isinstance(v, dict) and v.get("tipo") == "numeros":
                    txt = " ".join([str(v.get("titulo") or "")] + [str(it.get("rotulo") or "") for it in v.get("itens") or [] if isinstance(it, dict)])
                    dq = {d for _, _, d, _ in datas_em(txt, hoje) if d}
                    if dq and not dq & dt_tit:
                        A(f"[{pid}] quadro de números é de {', '.join(sorted(x.strftime('%d/%m') for x in dq))}, mas o título fala de {', '.join(sorted(x.strftime('%d/%m') for x in dt_tit))}: atualize o quadro junto com a chamada ou tire (manual 3b, UM NÚMERO SÓ)")
    difs = sorted({v for v, _ in vistos})
    if len(difs) > 1:
        A("dólar com valores diferentes na mesma edição (" + "; ".join(f"R$ {v:.2f}".replace(".", ",") + " em " + ", ".join(sorted({o for x, o in vistos if x == v}))[:120] for v in difs) +
          "): use o mesmo número e a mesma data em todos os lugares; se forem horas diferentes, escreva a hora (manual 3b, UM NÚMERO SÓ)")
    x = (IND or {}).get("dolar") or {}
    try:
        vi = float(str(x.get("valor", "")).replace("R$", "").strip().replace(",", ".")); di = date.fromisoformat(str(x.get("data", "")))
    except ValueError: vi = di = None
    if vi and di and (hoje - di).days <= 4:
        for v, onde in vistos:
            if abs(v - vi) >= 0.005 and onde.endswith(("neutro.titulo", "subtitulo", "quadro de números", "ilustração", "capa.linha_fina")):
                p_ = P.get((re.match(r"\[([^\]]+)\]", onde) or [None, None])[1]) or {}
                alvo = " ".join(str(z) for z in [(p_.get("neutro") or {}).get("titulo"), p_.get("subtitulo"), cp.get("linha_fina") if onde == "capa.linha_fina" else ""])
                if di in {d for _, _, d, _ in datas_em(alvo, hoje)}:
                    A(f"{onde}: dólar a R$ {v:.2f}".replace(".", ",") + f" em {di.strftime('%d/%m')}, mas o indicador da Capa mostra {x.get('valor')} para o mesmo dia: confira e use um número só (manual 3b)")

    # 3. Chamada de evento que já passou (manual 3b, EVENTO PASSADO): vira resultado
    def campos_chamada():
        yield "capa.linha_fina", None, cp.get("linha_fina") or ""
        for it in ((f.get("resumo_dia") or {}).get("itens") or []) if isinstance(f.get("resumo_dia"), dict) else []:
            if isinstance(it, dict): yield "resumo_dia", None, it.get("texto") or ""
        for p in ps:
            n = p.get("neutro") or {}
            yield f"[{p.get('id')}] neutro.titulo", p, n.get("titulo") or ""
            yield f"[{p.get('id')}] subtitulo", p, p.get("subtitulo") or ""
            for x in n.get("pontos") or []: yield f"[{p.get('id')}] neutro.pontos", p, x if isinstance(x, str) else ""
    for onde, p, t in campos_chamada():
        for cl in re.split(r";\s+|,\s+(?!às?\s+\d)(?=[A-ZÁÉÍÓÚa-zà-ú])|\s+[—–]\s+", str(t)):
            if not (FUTURO_FORTE.search(cl) or (FUTURO_PRESENTE.search(cl) and (HORA_EVENTO.search(cl) or re.search(r"\S\s+x\s+\S", cl)))): continue
            for a, b, d, txt in datas_em(cl, hoje):
                if not d: continue
                hm = HORA_EVENTO.search(cl)
                passou = d < hoje or (d == hoje and hm and int(hm[1]) <= 23 and ref >= datetime(d.year, d.month, d.day, int(hm[1]), int(hm[2] or 0), tzinfo=SP) + timedelta(hours=3))
                if not passou: continue
                msg = (f"{onde}: anuncia no futuro um evento de {d.strftime('%d/%m')} que já passou ('{cl.strip()[:70]}'): troque pelo resultado "
                       "(placar, decisão, votação) ou tire da chamada (manual 3b, EVENTO PASSADO)")
                (E_ if hm and onde.endswith(("titulo", "subtitulo")) else A)(msg)
                break

    for p in ps:
        pid = p.get("id"); n = p.get("neutro") or {}
        tit = str(n.get("titulo") or "")
        # 4. título que se entende sozinho (manual 3b, TÍTULO CLARO)
        for a, b, d, txt in datas_em(tit, hoje):
            # "16/12 vale": dd/mm sem preposição antes, ou qualquer data logo depois de vírgula/ponto e vírgula
            ddmm = not re.match(r"[A-Za-zÀ-ú]", txt)
            if a > 0 and not re.match(r"\s*[:—–]", tit[b:]) and ((ddmm and not PREP_DATA.search(tit[:a])) or re.search(r"[,;]\s*$", tit[:a])):
                A(f"[{pid}] neutro.titulo com data solta ('{txt}' em '{tit[:70]}'): diga o que acontece na data, com preposição ('jornada de 42 h segue valendo em 16/12') (manual 3b, TÍTULO CLARO)")
                break
        if len(re.findall(r"[;,]\s", tit)) >= 2:
            A(f"[{pid}] neutro.titulo telegráfico, com 3 partes ou mais ('{tit[:70]}'): no máximo 2 ideias; o resto vai no subtítulo (manual 3b, TÍTULO CLARO)")
        # 5. EM 30 SEGUNDOS: o 1º ponto não repete o título (o "Em 5 min" mostra os dois juntos)
        for lado in ("neutro", "direita", "esquerda"):
            v = p.get(lado) if isinstance(p.get(lado), dict) else None
            pt = (v or {}).get("pontos") if v else None
            tl = (v or {}).get("titulo") or ""
            if isinstance(pt, list) and pt and isinstance(pt[0], str) and tl:
                novo = palavras(pt[0]) - palavras(tl)
                if len(novo) < 2 and difflib.SequenceMatcher(None, norm(tl), norm(pt[0])).ratio() > 0.6:
                    A(f"[{pid}] {lado}.pontos[0] repete o título ('{pt[0][:70]}'): o 1º ponto traz um fato a mais (número, prazo, consequência), em frase completa (manual 2)")
        # 6. atualização sem fato novo (manual 3b, ATUALIZAÇÃO É FATO NOVO)
        ups = [u for u in (p.get("atualizacoes") or []) if isinstance(u, dict) and isinstance(u.get("texto"), str)]
        ups = sorted(ups, key=lambda u: str(u.get("hora") or ""))
        ant_h = {str(u.get("hora")) for u in ((AP.get(pid) or {}).get("atualizacoes") or []) if isinstance(u, dict)} if ant else None
        for j in range(1, len(ups)):
            for i in range(j):
                a_, b_ = norm(ups[i]["texto"]), norm(ups[j]["texto"])
                if a_ == b_: continue  # igual: o "atualização repetida" já avisa
                r = difflib.SequenceMatcher(None, a_, b_).ratio()
                if r < 0.8: continue
                novo = palavras(ups[j]["texto"]) - palavras(ups[i]["texto"])
                nova_agora = ant_h is not None and str(ups[j].get("hora")) not in ant_h
                msg = (f"[{pid}] atualização das {str(ups[j].get('hora'))[11:16]} ({str(ups[j].get('hora'))[8:10]}/{str(ups[j].get('hora'))[5:7]}) quase igual à de "
                       f"{str(ups[i].get('hora'))[8:10]}/{str(ups[i].get('hora'))[5:7]} {str(ups[i].get('hora'))[11:16]} (semelhança {r:.2f}): atualização só com fato novo, dito em 1 frase; "
                       "detalhe que muda vai no texto (set), sem nova atualização (manual 3b)")
                (E_ if nova_agora and r >= 0.85 and len(novo) < 3 else A)(msg)
                break
            else: continue
            break
        # 7. nome da cobertura (manual 3b, NOME DA COBERTURA)
        tema = p.get("tema"); tag = p.get("tag")
        et = p.get("etapa") if isinstance(p.get("etapa"), dict) else {}
        rotulos = [("tema", tema), ("tag", tag)] + [(f"etapa.passos.{i}", x) for i, x in enumerate(et.get("passos") or []) if isinstance(x, str)]
        for campo, x in rotulos:
            if not isinstance(x, str) or not x: continue
            if PUBLI_EXATO.match(x):
                E_(f"[{pid}] {campo} '{x}' parece propaganda (o app mostra \"Cobertura completa · {x}\"): use o assunto ou a etapa sem essa palavra ('Encontro marcado', 'Cúpula da Apec') (manual 3b)")
            elif PUBLI_PALAVRA.search(x):
                A(f"[{pid}] {campo} '{x}' tem palavra de propaganda ('{PUBLI_PALAVRA.search(x)[0]}'): diga o fato sem ela (manual 3b)")
        if p.get("tipo", "cobertura") == "cobertura":
            if not isinstance(tema, str) or not tema.strip():
                A(f"[{pid}] cobertura sem tema: o tema é o NOME da cobertura (o leitor segue por ele), ex.: 'Caso Master', 'Ajuste fiscal' (manual 3b)")
            else:
                gen = {norm(x).rstrip("s") for x in [p.get("subtema"), tag, dict((s_["id"], s_.get("nome")) for s_ in f.get("secoes") or [] if isinstance(s_, dict)).get(p.get("secao"))] if x}
                if norm(tema) in TEMA_GENERICO or norm(tema).rstrip("s") in gen:
                    A(f"[{pid}] tema '{tema}' é genérico (seção, subtema ou instituição): o tema é o nome da cobertura, o assunto ('Dólar e Bolsa', 'Caso Master') (manual 3b)")
            velho = (AP.get(pid) or AD.get(pid) or {}).get("tema")
            if ant and isinstance(velho, str) and isinstance(tema, str) and velho and norm(velho) != norm(tema):
                A(f"[{pid}] o nome da cobertura (tema) mudou de '{velho}' para '{tema}': mantenha o mesmo nome em todo lugar (os leitores seguem pelo tema) (manual 3b)")
        # 8. seção/tag pelo fato do título: local do evento não define a editoria (Erdogan na COP31 como "Clima", 15/11)
        rot_clima = norm(tag) in ("clima", "cop", "meio ambiente") or re.match(r"cop\d*$", norm(tag)) or p.get("subtema") == "Meio ambiente e clima"
        if rot_clima and NAO_CLIMA_RE.search(tit) and not CLIMA_RE.search(re.sub(r"\bCOP\s?\d*\b", "", tit, flags=re.I)):
            A(f"[{pid}] rótulo de clima ('{tag or p.get('subtema')}'), mas o fato do título é outro ('{tit[:60]}'): a tag e o subtema vêm do assunto, não do evento onde aconteceu (ex.: Diplomacia) (manual 3b)")
        if p.get("subtema") == "Planalto e governo" and re.search(r"\b(STF|Supremo|plen[áa]rio (f[íi]sico|virtual))\b", tit) and not re.match(r"(STF|Supremo|Moraes|Dino|Fachin|Gilmar|Zanin|Barroso|Mendonça|Nunes Marques|Fux|Cármen|Toffoli)\b", tit):
            A(f"[{pid}] título fala do STF ('{tit[:60]}'), mas está em Planalto e governo: se o fato principal é a decisão do tribunal, use STF e Judiciário (e troque a ilustração antiga) (manual 3b)")


# ---------- regras de 16/11 (noite): achados do testador sobre o conteúdo das rodadas ----------
# frase sem verbo que começa por "Isso" (carrossel do caso Master: "Isso um ano depois da operação que abriu o caso.")
ISSO_SEM_VERBO = re.compile(r"^\s*(?:e\s+)?(?:tudo\s+)?isso\s+(?:um|uma|dois|duas|tr[êe]s|\d|ap[óo]s|depois|antes|em|no|na|nos|nas|h[áa]|desde|"
                            r"com|sem|durante|logo|j[áa]|ainda|s[óo]|apenas|mais|menos|à|ao|aos|às)\b", re.I)
# a mesma proposição com dois nomes ("PL das big techs" no título, "PL dos mercados digitais" na agenda)
PROPOSICAO = re.compile(r"\b(PL|PEC|PLP|MP)\s+d[aoe]s?\s+([A-Za-zÀ-ú0-9×]+(?:\s+(?!(?:para|na|no|nas|nos|em|de|do|da|dos|das|e|ou|com|que|a|o|as|os|à|ao|é|vai|volta|"
                        r"segue|sobe|tem|foi|pelo|pela|sem|até|após|antes|depois|diz|entra)\b)[A-Za-zÀ-ú0-9×]+)?)")
PROPOSICAO_TAG = re.compile(r"^#(PL|PEC|PLP|MP)(?:d[aoe]s?)([A-Za-zÀ-ú0-9]{3,})$")
# checagem escrita como nota interna ("data que parece erro; o texto usa quarta (18)")
CHECAGEM_INTERNA = re.compile(r"parece (um )?(erro|engano)|prov[áa]vel (erro|engano)|erro de digita[çc][ãa]o|\bo texto usa\b|"
                              r"as fontes s[ãa]o atribu[íi]das|\bo Prumo (adota|optou|preferiu|considera)\b", re.I)
# veículos que a checagem costuma citar sem estarem em "fontes" (o app põe na lista "Noticiaram", mas sem link)
CITAVEIS = ["CNN", "CNN Brasil", "g1", "Folha", "Folha de S.Paulo", "Estadão", "O Globo", "Valor", "Valor Econômico", "UOL", "Poder360",
            "Metrópoles", "Agência Brasil", "Agência Senado", "Agência Câmara", "O Tempo", "Congresso em Foco", "Brasil 247", "Brasil de Fato",
            "JB", "InfoMoney", "Exame", "Money Times", "Correio Braziliense", "Gazeta do Povo", "CartaCapital", "Carta Capital", "Jovem Pan",
            "Revista Oeste", "Revista Fórum", "SBT News", "Estado de Minas", "Folha de Pernambuco", "O Liberal", "Band", "R7", "Veja",
            "Reuters", "Bloomberg", "BBC", "DW", "Rádio Senado", "TV Senado", "Times Brasil", "Nexo", "GZH", "Lance!", "ge"]
ALIAS_VEIC = {"cnn": "cnnbrasil", "folhadespaulo": "folha", "folhasp": "folha", "oestadodespaulo": "estadao", "valoreconomico": "valor",
              "agenciabrasilacessa": "agenciabrasil", "bbcbrasil": "bbc", "bbcnewsbrasil": "bbc", "dwbrasil": "dw", "timesbrasilcnbc": "timesbrasil",
              "revistaoeste": "oeste", "jornaldobrasil": "jb", "gazetaesportiva": "gazetaesportiva"}
# divulgação oficial com horário conhecido: a agenda sem "hora" vira pendência quando o horário passa (Focus, 16/11)
HORA_TIPICA = [(re.compile(r"\bfocus\b", re.I), (8, 25)), (re.compile(r"\bata do copom\b", re.I), (8, 0)),
               (re.compile(r"\bcopom\b.*\b(decide|decis|anuncia|define|juros|selic)|\b(decis[ãa]o|anúncio) do copom", re.I), (18, 30)),
               (re.compile(r"\b(ibge|ipca|inpc|pnad|pib\b|desemprego|vendas no varejo|produ[çc][ãa]o industrial|volume de servi[çc]os)", re.I), (9, 0))]


def hora_tipica(texto):
    for rx, hm in HORA_TIPICA:
        if rx.search(str(texto or "")): return hm
    return None


def id_veiculo(k, fontes=None):
    n = (fontes or {}).get(k, k) if isinstance(k, str) else ""
    c = re.sub(r"[^a-z0-9]", "", norm(re.sub(r"\(.*?\)", " ", str(n or ""))))
    return ALIAS_VEIC.get(c, c)


def veiculos_citados(t, fontes):
    """[(nome, id)] dos veículos citados num texto (o quadro "Veículos divergem")."""
    nomes = {n for n in list((fontes or {}).values()) + CITAVEIS if isinstance(n, str) and (len(n) >= 3 or n in ("g1", "ge", "JB", "R7", "DW"))
             and n not in VEIC_FORA and not re.search(r"\(", n)}
    out, t = [], str(t or "")
    for n in sorted(nomes, key=len, reverse=True):
        rx = re.compile(r"(?<![\w])" + re.escape(n) + r"(?![\w])")
        if rx.search(t):
            i = id_veiculo(n)
            if i not in [x[1] for x in out]: out.append((n, i))
            t = rx.sub(" # ", t)
    return out


# fechamento já ocorrido ("fecha", "fechou", "no fechamento"); "deve fechar" (pregão em andamento) não conta
PREGAO = re.compile(r"(d[óo]lar|ibovespa|\bbolsa\b).*\bfech(a|ou|am|aram|amento)\b|\bfech(a|ou|am|aram|amento)\b.*(d[óo]lar|ibovespa|\bbolsa\b)", re.I)


def mesmo_pregao(a, b, hoje):
    """Duas atualizações sobre o fechamento do mercado do mesmo dia (sexta (13) registrada de novo no domingo, com outro valor)."""
    if not (PREGAO.search(a) and PREGAO.search(b)): return False
    da = {d for _, _, d, _ in datas_em(a, hoje) if d}
    return bool(da & {d for _, _, d, _ in datas_em(b, hoje) if d})


def nomes_proposicao(t):
    """Chave de cada proposição citada: a 1ª palavra do nome ("big", "mercados", "seguranca")."""
    return {re.sub(r"[^a-z0-9]", "", norm(m[2].split()[0])) for m in PROPOSICAO.finditer(str(t or ""))}


def grupos_nomes(chaves):
    """Junta chaves que são o mesmo nome ("seguranca" e a hashtag "segurancapublica")."""
    gs = []
    for c in sorted(chaves, key=len):
        if not any(c.startswith(g) or g.startswith(c) for g in gs): gs.append(c)
    return gs


def checar_regras_1611r(f, ant, ref, agora, virada):
    ps = [p for p in f.get("pautas") or [] if isinstance(p, dict)]
    agora = agora if agora is not None and agora >= ref else ref
    hoje = agora.date()
    fontes = f.get("fontes") if isinstance(f.get("fontes"), dict) else {}
    AP = {p.get("id"): p for p in (ant or {}).get("pautas") or [] if isinstance(p, dict)}
    E_ = A if virada else E
    agenda = [a for a in f.get("agenda") or [] if isinstance(a, dict)]
    resumo = [it for it in ((f.get("resumo_dia") or {}).get("itens") or []) if isinstance(it, dict)] if isinstance(f.get("resumo_dia"), dict) else []
    for p in ps:
        pid = p.get("id"); n = p.get("neutro") if isinstance(p.get("neutro"), dict) else {}
        tit = str(n.get("titulo") or "")
        # 1. frase sem verbo nos pontos e no carrossel do Feed (manual 2: cada ponto/página é frase completa)
        frases = [(f"{lado}.pontos.{i}", x) for lado in ("neutro", "direita", "esquerda") for i, x in
                  enumerate(((p.get(lado) or {}).get("pontos") or []) if isinstance(p.get(lado), dict) else [])]
        frases += [(f"social.{i}", x) for i, x in enumerate(p.get("social") if isinstance(p.get("social"), list) else [])]
        for onde, x in frases:
            if isinstance(x, str) and ISSO_SEM_VERBO.match(x):
                A(f"[{pid}] {onde} sem verbo ('{x[:60]}'): cada frase se lê sozinha; escreva o fato ('As denúncias saem um ano depois da operação') (manual 2)")
        # 2. notícia de dias atrás com cara de hoje (Huang/Nvidia de quinta na Capa de segunda, 16/11)
        uf = ultimo_fato(p)
        if uf and p.get("status") != "ao_vivo" and (hoje - uf.date()).days >= 2 and tit and not datas_em(tit, hoje):
            A(f"[{pid}] o último fato é de {dia_rotulo(uf.date())} e o título não tem data ('{tit[:60]}'): o leitor acha que é de hoje. "
              f"Atualize com o fato do dia, ponha a data no título e o texto no passado ('{'no' if uf.weekday() >= 5 else 'na'} {dia_rotulo(uf.date())}, …') ou tire da edição (manual 3b, NOTÍCIA DE OUTRO DIA)")
        # 3. a mesma lei com dois nomes na mesma edição (manual 3b, NOME DA COBERTURA)
        textos = [p.get("tema"), tit, p.get("subtitulo"), p.get("proximo"), n.get("texto")] + list(n.get("pontos") or []) + list(p.get("social") or [])
        textos += [a.get("texto") for a in agenda if a.get("pid") == pid] + [it.get("texto") for it in resumo if it.get("pid") == pid]
        achados = {}
        alias = False
        for t in textos:
            ns = nomes_proposicao(t)
            if len(grupos_nomes(ns)) > 1: alias = True  # "PL das big techs (mercados digitais)": os dois nomes juntos explicam
            for x in ns: achados.setdefault(x, t)
        for h in p.get("hashtags") if isinstance(p.get("hashtags"), list) else []:
            m = PROPOSICAO_TAG.match(str(h))
            if m: achados.setdefault(re.sub(r"[^a-z0-9]", "", norm(m[2])), str(h))
        if len(grupos_nomes(achados)) > 1 and not alias:
            nomes_ = sorted({(PROPOSICAO.search(str(t)) or [None, None, None])[0] or str(t) for t in achados.values()})
            A(f"[{pid}] a mesma proposta com nomes diferentes ({'; '.join(x for x in nomes_ if x)[:140]}): use um nome só em título, tema, "
              "agenda e resumo, ou os dois juntos na primeira vez ('PL das big techs (mercados digitais)') (manual 3b, NOME DA COBERTURA)")
        # 4. atualização que repete os números de outra (fechamento de sexta registrado de novo no domingo, 16/11)
        ups = sorted([u for u in (p.get("atualizacoes") or []) if isinstance(u, dict) and isinstance(u.get("texto"), str)
                      and not u["texto"].startswith("Correção")], key=lambda u: str(u.get("hora") or ""))
        ant_h = {str(u.get("hora")) for u in ((AP.get(pid) or {}).get("atualizacoes") or []) if isinstance(u, dict)} if ant else None
        for j in range(1, len(ups)):
            nj = nums(ups[j]["texto"])
            if len(nj) < 3 and not PREGAO.search(ups[j]["texto"]): continue
            if len(nj) < 3: nj = {"-"}  # só o teste do mesmo pregão
            i = next((i for i in range(j) if nj <= nums(ups[i]["texto"]) or mesmo_pregao(ups[i]["texto"], ups[j]["texto"], hoje)), None)
            if i is None: continue
            nova = ant_h is not None and str(ups[j].get("hora")) not in ant_h
            hj, hi = str(ups[j].get("hora")), str(ups[i].get("hora"))
            (E_ if nova else A)(f"[{pid}] a atualização de {hj[8:10]}/{hj[5:7]} {hj[11:16]} repete os números da de {hi[8:10]}/{hi[5:7]} {hi[11:16]} "
                                "(o mesmo fato registrado de novo, como o mesmo fechamento do mercado): a linha do tempo da cobertura mostra as duas. Atualização só com fato novo; "
                                "detalhe vai no texto (set) e número corrigido com correcao_add (manual 3b, ATUALIZAÇÃO É FATO NOVO)")
            break
        # 5. título trocado sem fato novo: cada troca vira um item da linha do tempo da cobertura
        ap = AP.get(pid)
        if ant and ap and not virada:
            velho = str((ap.get("neutro") or {}).get("titulo") or "")
            novos = [u for u in ups if str(u.get("hora")) not in (ant_h or set())]
            corr = len(p.get("correcoes") or []) > len(ap.get("correcoes") or [])
            if velho and tit and norm(velho) != norm(tit) and not novos and not corr:
                A(f"[{pid}] o título mudou sem atualização nova ('{velho[:45]}' → '{tit[:45]}'): cada troca entra na linha do tempo da cobertura. "
                  "Troque o título com fato novo (update_add) ou, se era número errado, com correcao_add; só clareza de texto pode ficar assim (manual 3b)")
        # 6. "Quem noticiou" (Fontes e quem noticiou): cada veículo com uma linha e link; quadro sem nota interna
        links = [l for l in p.get("links") or [] if isinstance(l, dict)]
        enq = [e for e in p.get("enquadramentos") or [] if isinstance(e, dict)]
        com_link = {id_veiculo(l.get("fonte"), fontes) for l in links if l.get("url")}
        com_enq = Counter(id_veiculo(e.get("fonte"), fontes) for e in enq)
        sem_nada, sem_link = [], []
        for k in p.get("fontes") or []:
            i = id_veiculo(k, fontes)
            if i in com_link: continue
            (sem_link if com_enq.get(i) else sem_nada).append(str(fontes.get(k, k)))
        if sem_nada or sem_link:
            A(f"[{pid}] em \"Quem noticiou\" há veículo " + "; ".join(x for x in [
                ("sem link nem resumo: " + ", ".join(sem_nada)) if sem_nada else "", ("sem link: " + ", ".join(sem_link)) if sem_link else ""] if x) +
              ": ponha o link da matéria lida em links (e 1 linha em enquadramentos) ou tire o veículo de fontes (manual 3b, QUEM NOTICIOU)")
        rep = [str(e.get("fonte")) for e in enq if com_enq.get(id_veiculo(e.get("fonte"), fontes), 0) > 1]
        if rep:
            A(f"[{pid}] enquadramentos com mais de uma linha do mesmo veículo ({', '.join(sorted(set(rep)))}): fique só com a mais nova (manual 3b, QUEM NOTICIOU)")
        for e in enq:
            d_ = str(e.get("descricao") or "")
            for cl in re.split(r";\s+|,\s+(?=[a-zà-ú])", d_):
                if not (FUTURO_FORTE.search(cl) or re.search(r"\bpode(m)? ser\b", cl, re.I)): continue
                ds = [d for _, _, d, _ in datas_em(cl, hoje) if d and d < hoje]
                if ds:
                    A(f"[{pid}] enquadramento de {e.get('fonte')} anuncia como futuro algo de {ds[0].strftime('%d/%m')} ('{cl.strip()[:60]}'): "
                      "troque pela linha da matéria mais nova do veículo ou tire (manual 3b, QUEM NOTICIOU)")
                    break
        c = p.get("checagem") if isinstance(p.get("checagem"), dict) else {}
        ct = str(c.get("texto") or "")
        if ct:
            fora = [nm for nm, i in veiculos_citados(re.sub(r"\b(Estad[ãa]o|Folhapress|Globo) Conte[úu]do\b", " ", ct), fontes) if i not in com_link]
            if fora:
                A(f"[{pid}] a checagem cita {', '.join(fora)} sem link na notícia: o leitor não acha o veículo em \"Quem noticiou\". "
                  "Ponha o link lido em links ou não cite (manual 3b, QUEM NOTICIOU)")
            m = CHECAGEM_INTERNA.search(ct)
            if m:
                A(f"[{pid}] checagem com cara de nota interna ('{m.group(0)}'): escreva para o leitor quem publicou o quê "
                  "('O Tempo publicou 18/12; os demais, quarta (18/11)') (manual 3b, QUEM NOTICIOU)")
    # 7. evento de HOJE ainda anunciado no futuro à tarde (voos "até segunda (16)" e "mercado reabre na segunda (16)" no dia 16)
    if agora.hour >= 15 and not virada:
        cp = f.get("capa") if isinstance(f.get("capa"), dict) else {}
        campos = [("capa.linha_fina", cp.get("linha_fina"))] + [("resumo_dia", it.get("texto")) for it in resumo]
        for p in ps:
            n = p.get("neutro") if isinstance(p.get("neutro"), dict) else {}
            campos += [(f"[{p.get('id')}] neutro.titulo", n.get("titulo")), (f"[{p.get('id')}] subtitulo", p.get("subtitulo")),
                       (f"[{p.get('id')}] proximo", p.get("proximo"))] + [(f"[{p.get('id')}] neutro.pontos", x) for x in n.get("pontos") or [] if isinstance(x, str)]
        for onde, t in campos:
            for cl in re.split(r";\s+|,\s+(?!às?\s+\d)(?=[A-ZÁÉÍÓÚa-zà-ú])|\s+[—–]\s+", str(t or "")):
                if not FUTURO_FORTE.search(cl) or HORA_EVENTO.search(cl): continue
                if any(d == hoje for _, _, d, _ in datas_em(cl, hoje)):
                    A(f"{onde}: fala de hoje ({dia_rotulo(hoje)}) no futuro às {agora.strftime('%Hh%M')} ('{cl.strip()[:70]}'): "
                      "confira se já aconteceu e escreva o resultado (manual 3b, EVENTO PASSADO)")
                    break
    # 8. agenda de divulgação oficial sem horário (Focus "hoje" o dia inteiro, 16/11)
    for a in agenda:
        ht = hora_tipica(a.get("texto"))
        if ht and not hora_agenda(a.get("hora")):
            A(f"agenda '{str(a.get('texto'))[:50]}' sem hora: a divulgação costuma sair às {ht[0]}h{ht[1]:02d}; ponha a hora para o evento virar resultado quando passar (manual 1, agenda)")


# ---------- regras de 17/11 (corretor: achados do testador) ----------
PASSADO_NARRADO = re.compile(r"\b(estava|estavam|era|eram|foi|foram|tinha|tinham|havia|adiad[oa]s?|cancelad[oa]s?|suspens[oa]s?|desmarcad[oa]s?)\b", re.I)
MERCADO_PERGUNTA = re.compile(r"d[óo]lar|bolsa|ibovespa|c[âa]mbio|cota[çc][ãa]o", re.I)
AGORA_PERGUNTA = re.compile(r"\b(agora|hoje|atual|atualmente|neste momento|no momento|est[áa] hoje)\b", re.I)


def checar_regras_1711(f, ant, ref, agora, virada):
    """1. EVENTO PASSADO também no "O que vem agora" (proximo) e no Entenda (faq): "Lula volta da viagem na segunda (16)"
    lido na terça e "o mercado reabre na segunda (16)" depois do pregão de segunda (16-17/11).
    2. Entenda com "agora" parado: resposta de "Quanto custa o dólar agora?" com o fechamento de sexta quando a cobertura
    já tem o de segunda (16/11, 21h55)."""
    ps = [p for p in f.get("pautas") or [] if isinstance(p, dict)]
    agora = agora if agora is not None and agora >= ref else ref
    hoje = agora.date()
    for p in ps:
        pid = p.get("id")
        campos = [("proximo", p.get("proximo"), "")]
        faq = [q for q in (p.get("faq") if isinstance(p.get("faq"), list) else []) if isinstance(q, dict)]
        campos += [(f"faq.{i}.r", q.get("r"), str(q.get("p") or "")) for i, q in enumerate(faq)]
        for onde, t, pergunta in campos:
            if PASSADO_NARRADO.search(pergunta): continue  # "O que foi adiado?" → "... prevista para segunda (9)" conta o que era
            for cl in re.split(r";\s+|,\s+(?!às?\s+\d)(?=[A-ZÁÉÍÓÚa-zà-ú])|\s+[—–]\s+|(?<=[.!?])\s+", str(t or "")):
                if not FUTURO_FORTE.search(cl) or PASSADO_NARRADO.search(cl): continue
                ds = [d for _, _, d, _ in datas_em(cl, hoje) if d and d < hoje]
                if ds:
                    A(f"[{pid}] {onde} anuncia no futuro algo de {ds[0].strftime('%d/%m')} que já passou ('{cl.strip()[:70]}'): "
                      "escreva o que aconteceu ou o próximo passo de verdade (manual 3b, EVENTO PASSADO)")
                    break
        uf = ultimo_fato(p)
        for i, q in enumerate(faq):
            if not AGORA_PERGUNTA.search(str(q.get("p") or "")): continue
            r = str(q.get("r") or "")
            ds = [d for a_, _, d, _ in sorted(datas_em(r, hoje)) if d]  # a 1ª data citada é a do dado da resposta
            if uf and ds:
                if MERCADO_PERGUNTA.search(str(q.get("p") or "")):
                    # último pregão fechado até o fato mais novo da cobertura (o câmbio fecha por volta das 17h)
                    lim = uf.date() if uf.weekday() < 5 and uf.hour >= 17 else uf.date() - timedelta(days=1)
                    while lim.weekday() >= 5: lim -= timedelta(days=1)
                    velha = ds[0] < lim
                else:
                    velha = (uf.date() - ds[0]).days >= 2
            if uf and ds and velha:
                A(f"[{pid}] faq.{i}: a pergunta fala de agora ('{str(q.get('p'))[:50]}'), mas a resposta é de {ds[0].strftime('%d/%m')} "
                  f"e a cobertura já tem fato de {uf.date().strftime('%d/%m')} ('{r[:60]}'): atualize a resposta junto com a notícia (set path \"faq\") (manual 3b, ENTENDA)")
                continue
            vr = valores_dolar(r)
            if not vr and re.search(r"d[óo]lar", str(q.get("p") or ""), re.I) and not OUTRA_MOEDA.search(r):
                vr = [float(m[1].replace(",", ".")) for m in re.finditer(r"R\$\s?(\d,\d{2})(?!\d)", r)][:1]
            if vr:
                n = p.get("neutro") if isinstance(p.get("neutro"), dict) else {}
                vt = valores_dolar(n.get("titulo")) + valores_dolar(p.get("subtitulo"))
                if vt and not any(abs(a - b) < 0.005 for a in vr for b in vt):
                    A(f"[{pid}] faq.{i}: '{str(q.get('p'))[:50]}' responde dólar a R$ {vr[0]:.2f}".replace(".", ",") +
                      f", mas o título diz R$ {vt[0]:.2f}".replace(".", ",") + ": use o mesmo número (manual 3b, ENTENDA)")


def checar(f, ant=None, virada=False, agora=None, IND=None):
    preparar_veiculos(f)
    ps = f.get("pautas") or []
    P = {p.get("id"): p for p in ps}
    ids = [p.get("id") for p in ps]
    fontes = f.get("fontes") or {}
    veic = norm(" ".join(list(fontes.values()) + list(fontes.keys())))
    ref = dt(f.get("atualizado_em"))
    if not ref or not ISO.match(str(f.get("atualizado_em", ""))):
        E("atualizado_em ausente ou fora do formato ISO com -03:00"); ref = datetime.now(SP)
    hoje = ref.date()
    estrito = virada or ref.hour >= 23 or ref.hour < 6
    if agora is None:
        agora = datetime.now(SP)
        if not (ref - timedelta(minutes=5) <= agora <= ref + timedelta(hours=24)): agora = ref

    # topo
    for k in ["atualizado_em", "edicao", "secoes", "regua", "fontes", "pautas", "agenda", "mudancas"]:
        if k not in f: E(f"campo de topo ausente: {k}")
    secs = [s.get("id") for s in f.get("secoes", [])]
    if secs and secs != SECOES: A(f"ordem/ids de secoes diferente do padrão: {secs}")
    if f.get("regua") and f.get("regua") != REGUA: A("regua diferente da fixa")
    esp_c = contagem_de(hoje)
    if f.get("contagem", "") != esp_c: E(f"contagem deveria ser '{esp_c}' (é '{f.get('contagem', '')}'); o aplicar.py calcula sozinho")
    esp_e = edicao_de(ref)
    if str(f.get("edicao", "")).replace("h00", "h") != esp_e: E(f"edicao deveria ser '{esp_e}' (é '{f.get('edicao', '')}')")
    if f.get("semana") and hoje.weekday() != 6: A("semana (resumo da semana) só no domingo: tire na rodada completa")

    # texto para o leitor sem bastidor (manual 3b)
    for loc, tipo, t in campos_texto(f):
        t = str(t or "")
        pm = re.match(r"\[([^\]]+)\]", loc); esporte = bool(pm and (P.get(pm.group(1)) or {}).get("secao") == "esportes")
        m = bastidor(t, esporte)
        if m: E(f"{loc}: bastidor no texto do leitor ('{m.group(0)}'): diga o que se sabe e de quem é a informação (manual 3b)")
        elif re.search(r"\bpautas?\b", t) and tipo != "estrito" and not re.search(r"pauta d[aoe] (plenário|Senado|Câmara|STF|votaç)|da pauta|na pauta|em pauta|à pauta|a pauta", t, re.I):
            A(f"{loc}: 'pauta' no sentido interno? O leitor não sabe o que é (manual 3b)")
    for i, d in enumerate(f.get("dormentes") if isinstance(f.get("dormentes"), list) else []):
        m = bastidor(d.get("resumo")) if isinstance(d, dict) else None
        if m: A(f"dormentes.{i}.resumo: bastidor no resumo da cobertura anterior ('{m.group(0)}'): reescreva só com o fato (manual 3b)")
    # seção pelo fato do título (manual 3b): título que começa por decisão de tribunal vai para política/STF e Judiciário
    for p in ps:
        tit = str(((p.get("neutro") or {}).get("titulo")) or p.get("titulo") or "")
        if re.match(r"(STF|Supremo|STJ|TSE|TST|TCU|Moraes|Dino|Fachin|Gilmar|Zanin|Barroso|Mendonça|Nunes Marques|Fux|Cármen|Toffoli)\b", tit) and (p.get("secao"), p.get("subtema")) != ("politica", "STF e Judiciário"):
            # Planalto e governo com título de decisão de tribunal é contradição clara (6×1 no STF marcada como governo, 15/11): ERRO
            (E if p.get("subtema") == "Planalto e governo" and not virada else A)(f"[{p.get('id')}] título é decisão de tribunal ('{tit[:50]}'), mas está em {p.get('secao')}/{p.get('subtema')}: mude para politica/STF e Judiciário ou reescreva o título pelo fato principal (manual 3b)")
    # validade: cobertura sem fato novo há mais de 3 dias (manual 3b)
    for p in ps:
        if p.get("status") == "ao_vivo": continue
        hs = [dt(u.get("hora")) for u in (p.get("atualizacoes") or []) if isinstance(u, dict)] + [dt(p.get("hora")), dt(p.get("inicio"))]
        hs = [h for h in hs if h]
        if not hs: continue
        idade = (ref - max(hs)).total_seconds() / 86400
        lim = 2 if p.get("tipo") == "pontual" else 3
        if idade > lim:
            A(f"[{p.get('id')}] sem fato novo há {idade:.0f} dias: tire da edição (remove_pauta). Só fica se houver etapa marcada nos próximos 5 dias; nesse caso, diga qual na nota da rodada (manual 3b)")

    dup = {i for i in ids if ids.count(i) > 1}
    if dup: E(f"ids repetidos: {sorted(dup)}")
    por_sec = Counter(p.get("secao") for p in ps)
    seen_links = {}
    for p in ps:
        pid = p.get("id", "?")
        if p.get("secao") not in SECOES: E(f"[{pid}] secao inválida: {p.get('secao')}")
        n = p.get("neutro") or {}
        tit = n.get("titulo", "")
        if not tit or not n.get("texto"): E(f"[{pid}] neutro sem titulo ou texto")
        checar_cobertura(p, pid, ref)
        checar_hashtags(p, pid, ant)
        checar_fim(p, pid, ant)
        if len(tit) > 90: E(f"[{pid}] título com {len(tit)} caracteres (máx. 90; ideal ≤ 75)")
        elif len(tit) > 75: A(f"[{pid}] título com {len(tit)} caracteres (ideal ≤ 60)")
        # estilo: título diz o fato (manual seção 2, ESTILO)
        for lado in ("neutro", "direita", "esquerda"):
            v = p.get(lado) if isinstance(p.get(lado), dict) else None
            tt = (v or {}).get("titulo") or ""
            if not isinstance(tt, str) or not tt: continue
            m = RUIDO.search(tt)
            if m: E(f"[{pid}] {lado}.titulo com chamada vazia ('{m.group(0).strip(' :—–')}'): diga o fato no título")
            if tt.rstrip().endswith("?"): A(f"[{pid}] {lado}.titulo em forma de pergunta: diga o fato")
            if "!" in tt: A(f"[{pid}] {lado}.titulo com exclamação: atraia pela informação, não pelo tom")
            if re.search(r"\bpode(m)?\b", tt, re.I): A(f"[{pid}] {lado}.titulo com 'pode': prefira o fato ou o próximo passo concreto")
            for x in (v.get("pontos") if isinstance(v.get("pontos"), list) else []):
                if isinstance(x, str) and RUIDO.search(x): E(f"[{pid}] {lado}.pontos com chamada vazia ('{RUIDO.search(x).group(0).strip(' :—–')}')")
        # manchete atrás da notícia: atualização mais nova que o último título
        ups_h = [str(u.get("hora") or "") for u in (p.get("atualizacoes") or []) if isinstance(u, dict)]
        tit_h = str(((p.get("titulos") or [{}])[-1] or {}).get("hora") or p.get("inicio") or "")
        if ups_h and tit_h and max(ups_h) > tit_h and ISO.match(max(ups_h)) and ISO.match(tit_h):
            A(f"[{pid}] atualização das {max(ups_h)[11:16]} é mais nova que a manchete: reescreva o título com o fato mais novo ou mais importante (se for só detalhe, deixe)")
        # veículos citados demais: o Prumo afirma o fato conferido
        for campo, txt in [("subtitulo", p.get("subtitulo"))] + [(f"{lado}.titulo", (p.get(lado) or {}).get("titulo") if isinstance(p.get(lado), dict) else None) for lado in ("neutro", "direita", "esquerda")] + [(f"{lado}.pontos", " | ".join(x for x in ((p.get(lado) or {}).get("pontos") or []) if isinstance(x, str)) if isinstance(p.get(lado), dict) else None) for lado in ("neutro", "direita", "esquerda")]:
            vs = veiculos_em(txt)
            if vs: E(f"[{pid}] {campo} cita veículo ({', '.join(vs)}): título, subtítulo e pontos dizem só o fato")
        vs = veiculos_em((p.get("neutro") or {}).get("texto"))
        if len(vs) >= 2: A(f"[{pid}] neutro.texto cita {len(vs)} veículos ({', '.join(vs)}): afirme o fato conferido; veículo só para dado exclusivo ou divergência (na checagem)")
        for u in p.get("atualizacoes") or []:
            vs = veiculos_em((u or {}).get("texto") if isinstance(u, dict) else None)
            if vs: A(f"[{pid}] atualização das {str(u.get('hora'))[11:16]} cita veículo ({', '.join(vs)}): diga só o fato novo"); break
        sb = p.get("subtitulo")
        if isinstance(sb, str) and RUIDO.search(sb): E(f"[{pid}] subtitulo com chamada vazia ('{RUIDO.search(sb).group(0).strip(' :—–')}')")
        # formato "em 30 segundos": 3 pontos curtos por versão
        for lado in ("neutro", "direita", "esquerda"):
            v = p.get(lado) if isinstance(p.get(lado), dict) else None
            if not v or v.get("pontos") is None: continue
            pt = v.get("pontos")
            if not isinstance(pt, list) or not all(isinstance(x, str) and x.strip() for x in pt): E(f"[{pid}] {lado}.pontos deve ser lista de frases"); continue
            if not 2 <= len(pt) <= 4: A(f"[{pid}] {lado}.pontos com {len(pt)} itens (3 é o ideal)")
            for x in pt:
                if len(x) > 160: E(f"[{pid}] {lado}.pontos com frase de {len(x)} caracteres (até 120)")
                elif len(x) > 120: A(f"[{pid}] {lado}.pontos com frase de {len(x)} caracteres (ideal até 120)")
        pr = p.get("prioridade")
        if not isinstance(pr, int) or not 0 <= pr <= 100: E(f"[{pid}] prioridade ausente ou fora de 0–100")
        # horas
        h = str(p.get("hora", ""))
        if not ISO.match(h): E(f"[{pid}] hora fora do ISO com -03:00: {h}")
        elif dt(h) > ref + timedelta(minutes=5): E(f"[{pid}] hora no futuro ({h[11:16]})")
        hs = []
        ups = p.get("atualizacoes") or []
        if len(ups) > 4: E(f"[{pid}] {len(ups)} atualizações (máx. 4: tire as mais antigas)")
        for campo in ("atualizacoes", "correcoes"):
            for u in p.get(campo) or []:
                uh = str(u.get("hora", ""))
                if not ISO.match(uh): E(f"[{pid}] {campo}.hora fora do ISO com -03:00: {uh}")
                else:
                    if dt(uh) > ref + timedelta(minutes=5): E(f"[{pid}] {campo}.hora no futuro ({uh[11:16]})")
                    if campo == "atualizacoes": hs.append(uh)
                if not u.get("texto"): E(f"[{pid}] {campo} sem texto")
        if hs and ISO.match(h) and max(hs) > h: A(f"[{pid}] hora ({h[11:16]}) anterior à última atualização ({max(hs)[11:16]}): suba pauta.hora")
        txts = [u.get("texto") for u in ups]
        if len(set(txts)) != len(txts): A(f"[{pid}] atualização repetida")
        # imagem
        im = p.get("imagem") or {}
        if im or p.get("tipo") != "pontual": checar_imagem(pid, im, p)
        # foto real (fontes de licença livre)
        ft = p.get("foto")
        if ft is not None:
            if not isinstance(ft, dict) or not isinstance(ft.get("url"), str): E(f"[{pid}] foto deve ser {{url, credito, alt}}")
            elif not FOTO_OK.match(ft["url"]): E(f"[{pid}] foto de fonte não permitida: {ft['url'][:80]} (só Agência Brasil, Senado, Câmara, gov.br, STF/TSE, Wikimedia Commons, Flickr oficial, Unsplash, Pexels)")
            else:
                if not ft.get("credito"): E(f"[{pid}] foto sem credito (ex.: \"Foto: Marcelo Camargo/Agência Brasil\")")
                if not ft.get("alt"): A(f"[{pid}] foto sem alt (o que a foto mostra)")
                # 18/11 (fase 2): foto própria só aparece com "mostra" que cita a pessoa ou o lugar do título (paginas.confirma)
                if not isinstance(ft.get("mostra"), str) or not ft["mostra"].strip():
                    fa = (ant_pauta(ant, pid) if ant else None) or {}
                    velha = isinstance(fa.get("foto"), dict) and fa["foto"].get("url") == ft["url"]
                    (A if velha else E)(f"[{pid}] foto sem \"mostra\" (o que está na foto, com a pessoa ou o lugar do título): o app não mostra a foto; acrescente \"mostra\" ou tire a foto")
                elif not foto_confirma(p, ft):
                    E(f"[{pid}] foto: \"mostra\" não cita nenhum nome do título (pessoa, lugar, sigla): o app não mostra a foto; corrija \"mostra\" ou tire a foto")
        # subtítulo (linha fina da Capa)
        st = p.get("subtitulo")
        if st is not None:
            if not isinstance(st, str) or not st.strip(): E(f"[{pid}] subtitulo deve ser texto (ou não existir)")
            elif len(st) > 200: E(f"[{pid}] subtitulo com {len(st)} caracteres (até 160)")
            elif len(st) > 160: A(f"[{pid}] subtitulo com {len(st)} caracteres (ideal até 160)")
            elif norm(st) == norm(tit): A(f"[{pid}] subtitulo repete o título")
        # versões com viés
        for lado in ("direita", "esquerda"):
            v = p.get(lado)
            if v is not None and (not isinstance(v, dict) or not v.get("titulo") or not v.get("texto")): E(f"[{pid}] {lado} incompleto")
        if p.get("direita") or p.get("esquerda"):
            om = norm(p.get("o_que_muda"))
            if not om: A(f"[{pid}] tem versões com viés mas sem o_que_muda")
            elif not (("direita" in om and "esquerda" in om) or re.search(r"versoes|as duas|ambas|os dois lados", om)):
                A(f"[{pid}] o_que_muda não compara as duas versões (cite direita e esquerda)")
            if p.get("secao") == "esportes": A(f"[{pid}] esporte com versão de viés")
        base = " ".join([n.get("texto", ""), tit, " ".join(x for x in (n.get("pontos") or []) if isinstance(x, str)), p.get("contexto") or "", p.get("proximo") or "",
                         json.dumps(p.get("visuais"), ensure_ascii=False), json.dumps(p.get("checagem"), ensure_ascii=False),
                         json.dumps(p.get("atualizacoes"), ensure_ascii=False), json.dumps(im.get("dados"), ensure_ascii=False)])
        bn, bnorm = nums(base), norm(base)
        for lado in ("direita", "esquerda"):
            v = p.get(lado) or {}
            if not v: continue
            vt = v.get("titulo", "") + ". " + v.get("texto", "") + ". " + ". ".join(x for x in (v.get("pontos") or []) if isinstance(x, str))
            extra = nums(vt) - bn
            if extra: E(f"[{pid}] números na versão {lado} que não aparecem no neutro, contexto, atualizações nem checagem: {sorted(extra)}. Confirme na matéria e cite no contexto ou na checagem, ou tire da versão.")
            novos = [nm for nm in nomes(vt) if norm(nm) not in bnorm and norm(nm) not in veic and nm not in INSTITUCIONAIS]
            if novos: A(f"[{pid}] nomes na versão {lado} que não aparecem no neutro/contexto/checagem: {sorted(set(novos))[:6]}. Cite no contexto ou tire.")
        # fontes, links
        fs = p.get("fontes") or []
        if not fs: E(f"[{pid}] sem fontes")
        for k in fs:
            if k not in fontes: A(f"[{pid}] fonte '{k}' não está no mapa fontes")
        for e in p.get("enquadramentos") or []:
            if e.get("fonte") not in fs: A(f"[{pid}] enquadramento de '{e.get('fonte')}' que não está em fontes")
        links = p.get("links") or []
        if not links: A(f"[{pid}] sem links")
        for l in links:
            u = urlparse(str(l.get("url", "")))
            if u.scheme not in ("http", "https") or not u.netloc: E(f"[{pid}] link inválido: {l.get('url')}")
            seen_links.setdefault(l.get("url"), set()).add(pid)
        if len({l.get("url") for l in links}) != len(links): A(f"[{pid}] link repetido")
        # checagem
        c = p.get("checagem")
        if c:
            if c.get("status") not in ("ok", "divergencia"): E(f"[{pid}] checagem.status deve ser ok ou divergencia")
            if c.get("status") == "ok" and len(set(fs)) < 2: E(f"[{pid}] checagem 'ok' com menos de 2 veículos em fontes: use divergencia/null ou confirme em outro veículo")
            if not c.get("texto"): E(f"[{pid}] checagem sem texto")
        # visuais
        vis = p.get("visuais") or []
        if len(vis) > 2: A(f"[{pid}] mais de 2 visuais (no máx. 1 gráfico + 1 outro)")
        if sum(1 for v in vis if isinstance(v, dict) and v.get("tipo") == "grafico") > 1: E(f"[{pid}] mais de 1 gráfico")
        for v in vis:
            tp = v.get("tipo")
            if tp not in VISUAIS: E(f"[{pid}] visual de tipo inválido: {tp}"); continue
            its = v.get("itens") or []
            if tp == "numeros":
                if not 2 <= len(its) <= 4: A(f"[{pid}] numeros com {len(its)} itens (2 a 4)")
                for it in its:
                    if len(str(it.get("valor", ""))) > 9: E(f"[{pid}] numeros.valor '{it.get('valor')}' com {len(str(it.get('valor')))} caracteres (máx. 9: mova a unidade para o rótulo)")
                    if not re.search(r"\d", str(it.get("valor", ""))): A(f"[{pid}] numeros.valor sem número: '{it.get('valor')}'")
            if tp == "grafico": checar_grafico(pid, v)
            if tp == "linha_do_tempo" and not 3 <= len(its) <= 6: A(f"[{pid}] linha_do_tempo com {len(its)} itens (3 a 6)")
            if tp == "imagem": checar_imagem(pid + " visual", v.get("imagem") or {}, p)
            if tp == "pesquisas" and not f.get("pesquisas_2t"): E(f"[{pid}] visual pesquisas sem pesquisas_2t")
        # enquete
        en = p.get("enquete")
        if en:
            if not (2 <= len(en.get("opcoes") or []) <= 3): E(f"[{pid}] enquete precisa de 2 ou 3 opções")
            if re.search(r"\bvot(a|ar|aria|ou|e)\s+em\b|seu voto|em quem", norm(en.get("pergunta"))): E(f"[{pid}] enquete pergunta em quem a pessoa vota")
            if hoje > TURNO2 and re.search(r"2o turno|segundo turno|eleic|vot|lula|flavio|candidat", norm(en.get("pergunta"))):
                A(f"[{pid}] enquete ligada à votação depois de 25/10: retire com remove_enquete")
    for s in SECOES:
        lo, hi = FAIXA[s]
        if not lo <= por_sec.get(s, 0) <= hi: A(f"seção {s} com {por_sec.get(s, 0)} pautas (manual: {lo} a {hi})")
    nen = sum(1 for p in ps if p.get("enquete"))
    if nen > 6: A(f"{nen} enquetes (manual: 3 a 5 nas pautas de maior interesse)")
    top = [p.get("secao") for p in sorted(ps, key=lambda p: -(p.get("prioridade") or 0))[:3]]
    if len(top) == 3 and len(set(top)) == 1: A(f"as 3 primeiras pautas são da mesma seção ({top[0]})")
    sem_sub = [p.get("id") for p in sorted(ps, key=lambda p: -(p.get("prioridade") or 0))[:8] if not p.get("subtitulo")]
    sem_pt = [p.get("id") for p in ps if not ((p.get("neutro") or {}).get("pontos"))]
    if sem_pt: A(f"pautas sem neutro.pontos (formato em 30 segundos; a Capa usa as frases do texto): {sem_pt[:12]}")
    rd = f.get("resumo_dia")
    for it in (rd.get("itens") if isinstance(rd, dict) and isinstance(rd.get("itens"), list) else []):
        vs = veiculos_em(it.get("texto") if isinstance(it, dict) else None)
        if vs: E(f"resumo_dia cita veículo ({', '.join(vs)}): diga só o fato")
    lf = (f.get("capa") or {}).get("linha_fina") if isinstance(f.get("capa"), dict) else None
    if veiculos_em(lf): A(f"capa.linha_fina cita veículo ({', '.join(veiculos_em(lf))}): diga só o fato")
    if rd is None: A("sem resumo_dia (O dia em 1 minuto): a completa escreve 4 a 6 itens")
    elif not isinstance(rd, dict) or not isinstance(rd.get("itens"), list): E("resumo_dia deve ser {itens: [{pid, texto}]}")
    else:
        its = rd["itens"]
        if not 4 <= len(its) <= 6: A(f"resumo_dia com {len(its)} itens (4 a 6)")
        for it in its:
            if not isinstance(it, dict) or not it.get("texto"): E("resumo_dia: item sem texto"); continue
            if len(it["texto"]) > 110: A(f"resumo_dia: item com {len(it['texto'])} caracteres (até 90)")
            if it.get("pid") and it["pid"] not in P: E(f"resumo_dia aponta para pauta inexistente: {it['pid']}")
    if sem_sub: A(f"pautas do topo sem subtitulo (a Capa usa a 1ª frase do texto): {sem_sub}")
    for sx in ("politica", "economia"):
        da = [p for p in ps if p.get("secao") == sx and p.get("tipo") != "pontual"]
        com = sum(1 for p in da if p.get("direita") and p.get("esquerda"))
        if da and com * 2 < len(da): A(f"{sx}: só {com} de {len(da)} pautas com leitura de direita e esquerda (meta: metade ou mais, quando houver leitura política real)")
    for u, s in seen_links.items():
        if len(s) > 1: A(f"mesmo link em {sorted(s)}")
    # títulos repetidos
    tt = [(p.get("id"), norm((p.get("neutro") or {}).get("titulo"))) for p in ps]
    for i in range(len(tt)):
        for j in range(i + 1, len(tt)):
            r = difflib.SequenceMatcher(None, tt[i][1], tt[j][1]).ratio()
            if r > 0.72: E(f"possível pauta repetida: {tt[i][0]} × {tt[j][0]} (semelhança {r:.2f})")
    # prioridade x idade
    for p in ps:
        hp = dt(p.get("hora"))
        if hp and (ref - hp).total_seconds() > 86400 and (p.get("prioridade") or 0) > 60:
            A(f"[{p.get('id')}] prioridade {p.get('prioridade')} com notícia de {int((ref - hp).total_seconds() // 3600)} h")

    # dormentes (coberturas que saíram do feed; o aplicar.py mantém)
    dor = f.get("dormentes") or []
    if len(dor) > MAX_DORMENTES: A(f"{len(dor)} dormentes (máx. {MAX_DORMENTES}; o aplicar.py poda)")
    for d in dor:
        if d.get("id") in P: E(f"dormente '{d.get('id')}' também está nas pautas (o aplicar.py tira sozinho: rode-o)")
    if f.get("taxonomia") and f.get("taxonomia") != TAXONOMIA: A("taxonomia diferente da fixa (o aplicar.py regrava)")

    # capa (manchete e destaques escolhidos pela rodada)
    cp = f.get("capa")
    if not cp: A("sem capa: a rodada completa escolhe manchete e 3 a 5 destaques (manual 2c)")
    elif not isinstance(cp, dict): E("capa deve ser um objeto {manchete, destaques, linha_fina}")
    else:
        m = cp.get("manchete")
        if m is None: A("capa sem manchete: a próxima completa escolhe (até lá o app usa a de maior prioridade)")
        elif m not in P: E(f"capa.manchete '{m}' não é uma pauta do feed")
        ds = cp.get("destaques") if isinstance(cp.get("destaques"), list) else []
        if not 3 <= len(ds) <= 5: A(f"capa com {len(ds)} destaques (3 a 5)")
        for d in ds:
            if d not in P: E(f"capa.destaques tem pauta inexistente: {d}")
            if d == m: E(f"capa: a manchete '{m}' também está nos destaques")
        cs = Counter(P[d].get("secao") for d in ds if d in P)
        for sx, n in cs.items():
            if n > 2: A(f"capa com {n} destaques de {sx} (máx. 2 da mesma seção)")
        lf = cp.get("linha_fina") or ""
        if lf and len(lf) > 240: A(f"capa.linha_fina com {len(lf)} caracteres (até 240)")
        if m in P and P[m].get("tipo") == "pontual": A("manchete é uma notícia pontual: prefira uma cobertura")
    # indicadores (economia)
    ind = f.get("indicadores")
    if ind and not isinstance(ind, dict): E("indicadores deve ser um objeto {itens: [...]}"); ind = None
    if ind:
        vistos_i = set()
        for x in ind.get("itens") or []:
            i_ = x.get("id")
            if i_ not in INDICADORES: E(f"indicador com id inválido: {i_} (use {', '.join(INDICADORES)})"); continue
            if i_ in vistos_i: E(f"indicador repetido: {i_}")
            vistos_i.add(i_)
            if not x.get("valor") or len(str(x.get("valor"))) > 10: E(f"indicador {i_}: valor vazio ou com mais de 10 caracteres")
            if x.get("variacao") and len(str(x["variacao"])) > 8: E(f"indicador {i_}: variacao com mais de 8 caracteres")
            if x.get("dir") not in ("sobe", "desce", "estavel"): E(f"indicador {i_}: dir deve ser sobe, desce ou estavel")
            try:
                dd = date.fromisoformat(str(x.get("data", "")))
                if dd > hoje: E(f"indicador {i_} com data futura")
                pass  # dólar e Ibovespa são automáticos (indicadores.json): o do feed é só reserva
            except ValueError: E(f"indicador {i_} sem data AAAA-MM-DD")
            se = x.get("serie")
            if se is not None and (not isinstance(se, list) or not 3 <= len(se) <= 12 or not all(isinstance(n, (int, float)) for n in se)):
                E(f"indicador {i_}: serie precisa de 3 a 12 números reais (os últimos valores, do mais antigo ao mais novo)")
    # calendário (Economia, Educação, Política)
    cal = f.get("calendario") or []
    if len(cal) > 25: A(f"calendario com {len(cal)} itens (máx. 25)")
    for c in cal:
        tx = str(c.get("texto", ""))[:50]
        if c.get("secao") not in ("economia", "educacao", "politica"): E(f"calendario com secao inválida (economia, educacao ou politica): {tx}")
        try:
            d0 = date.fromisoformat(str(c.get("data", "")))
            d1 = date.fromisoformat(str(c.get("ate"))) if c.get("ate") else d0
            if d1 < d0: E(f"calendario: ate antes de data: {tx}")
            if d1 < hoje: A(f"calendario com data passada (o aplicar.py tira): {tx}")
            if d0 > hoje + timedelta(days=120): A(f"calendario além de 120 dias: {tx}")
        except ValueError: E(f"calendario sem data AAAA-MM-DD: {tx}")
        if not c.get("texto") or len(str(c.get("texto"))) > 80: E(f"calendario sem texto ou com mais de 80 caracteres: {tx}")

    # esportes (campeonatos, tabela e jogos)
    es = f.get("esportes")
    if es:
        cps = es.get("competicoes") or []
        cids = [c.get("id") for c in cps]
        if len(set(cids)) != len(cids): E("esportes: id de competição repetido")
        for c in cps:
            cn = c.get("id", "?")
            if not c.get("id") or not c.get("nome"): E("esportes: competição sem id ou nome")
            if c.get("subtema") and c["subtema"] not in TAXONOMIA["esportes"]: E(f"esportes [{cn}]: subtema '{c['subtema']}' fora da lista de esportes")
            tb = c.get("tabela") or []
            if tb:
                if [t.get("pos") for t in tb] != list(range(1, len(tb) + 1)): E(f"esportes [{cn}]: tabela com posições fora de ordem (1, 2, 3…)")
                for t in tb:
                    if not t.get("time") or not isinstance(t.get("pts"), int): E(f"esportes [{cn}]: linha da tabela sem time ou pts inteiro")
                pts = [t.get("pts") for t in tb if isinstance(t.get("pts"), int)]
                if pts != sorted(pts, reverse=True): A(f"esportes [{cn}]: pontos da tabela não estão em ordem decrescente")
                if not c.get("tabela_ate"): A(f"esportes [{cn}]: diga de quando é a tabela em tabela_ate (ex.: \"após a 30ª rodada\")")
            for fz in c.get("chave") or []:
                if not fz.get("fase") or not isinstance(fz.get("confrontos"), list): E(f"esportes [{cn}]: chave precisa de fase e confrontos")
        jids = []
        for j in es.get("jogos") or []:
            jn = f"{j.get('a', '?')} x {j.get('b', '?')}"
            jids.append(j.get("id"))
            if not j.get("id") or not j.get("a") or not j.get("b"): E(f"esportes: jogo sem id, a ou b: {jn}")
            if j.get("comp") not in cids: E(f"esportes: jogo {jn} com comp '{j.get('comp')}' que não está em competicoes")
            try: date.fromisoformat(str(j.get("data", "")))
            except ValueError: E(f"esportes: jogo {jn} sem data AAAA-MM-DD")
            st = j.get("estado")
            if st not in ("agendado", "ao_vivo", "encerrado", "adiado"): E(f"esportes: jogo {jn} com estado inválido (agendado, ao_vivo, encerrado, adiado)")
            temp = j.get("ga") is not None or j.get("gb") is not None
            if st in ("encerrado", "ao_vivo") and not (isinstance(j.get("ga"), int) and isinstance(j.get("gb"), int)): E(f"esportes: jogo {jn} {st} sem placar ga/gb inteiro")
            if st == "agendado" and temp: E(f"esportes: jogo {jn} agendado com placar")
            if st == "ao_vivo" and not ISO.match(str(j.get("atualizado", ""))): E(f"esportes: jogo {jn} ao vivo sem 'atualizado' (ISO -03:00 da rodada)")
            passado = str(j.get("data", "")) < hoje.isoformat()
            if st == "agendado" and passado: (A if virada else E)(f"esportes: jogo {jn} de data passada ainda agendado: registre o placar (encerrado) ou adiado")
            if st == "ao_vivo" and passado: (A if virada else E)(f"esportes: jogo {jn} de {j.get('data')} ainda ao_vivo: registre o placar final (encerrado)")
            if j.get("hora") and not re.match(r"^\d{1,2}h(\d{2})?$", str(j["hora"])): A(f"esportes: jogo {jn} com hora fora do padrão 16h/21h30")
            if j.get("pid") and j["pid"] not in P: E(f"esportes: jogo {jn} aponta para pid inexistente")
        if len(set(jids)) != len(jids): E("esportes: id de jogo repetido")
    for p in ps:
        if p.get("times") is not None and (not isinstance(p["times"], list) or not all(isinstance(x, str) and x for x in p["times"])): E(f"[{p.get('id')}] times deve ser lista de nomes")

    # breves
    cb = Counter(b.get("secao") for b in f.get("breves") or [])
    for s in SECOES:
        if not 2 <= cb.get(s, 0) <= 4: A(f"breves de {s}: {cb.get(s, 0)} (manual: 2 a 4)")
    for b in f.get("breves") or []:
        u = urlparse(str(b.get("url", "")))
        if u.scheme not in ("http", "https") or not u.netloc: E(f"breve com link inválido: {b.get('titulo', '')[:50]}")
        if b.get("url") in seen_links: A(f"breve repete o link da pauta {sorted(seen_links[b['url']])}: {b.get('titulo', '')[:50]}")
        if b.get("secao") not in SECOES: E(f"breve com secao inválida: {b.get('titulo', '')[:50]}")
        if len(b.get("titulo", "")) > 90: A(f"breve com título longo ({len(b['titulo'])}): {b['titulo'][:50]}")
        if b.get("urgente"):
            if not ISO.match(str(b.get("hora", ""))): E(f"breve urgente sem hora ISO -03:00: {b.get('titulo', '')[:50]}")
            elif dt(b["hora"]) > ref + timedelta(minutes=5): E(f"breve urgente com hora no futuro: {b.get('titulo', '')[:50]}")

    # mudanças
    mud = f.get("mudancas") or {}
    mi = mud.get("itens") or []
    if mud.get("titulo") and not str(mud.get("titulo")).startswith(TIT_MUD): A(f"mudancas.titulo deveria ser '{TIT_MUD[0]}' ou '{TIT_MUD[1]}' (é '{mud.get('titulo')}')")
    if len(mi) > 8: E(f"mudancas com {len(mi)} itens (máx. 8; mais novos primeiro)")
    mp = [it.get("pid") for it in mi]
    if len(set(mp)) != len(mp): A("mudancas com a mesma pauta duas vezes")
    for it in mi:
        if it.get("pid") not in ids: E(f"mudancas aponta para pid inexistente: {it.get('pid')}")
        if it.get("tipo") not in ("nova", "atualizada"): A(f"mudancas com tipo '{it.get('tipo')}' (use nova ou atualizada)")

    # pesquisas
    vistos = set()
    for x in f.get("pesquisas_2t") or []:
        k = (x.get("data"), x.get("instituto"))
        if k in vistos: E(f"pesquisa repetida em pesquisas_2t: {k}")
        vistos.add(k)
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(x.get("data", ""))): E(f"data inválida em pesquisas_2t: {x.get('data')}"); continue
        if x["data"] > hoje.isoformat(): E(f"pesquisa com data futura: {k}")
        try:
            fv, lv = float(x.get("flavio")), float(x.get("lula"))
            if abs(fv + lv - 100) > 1: E(f"pesquisa {k}: votos válidos somam {fv + lv}")
            if not (40 <= fv <= 60 and 40 <= lv <= 60): A(f"pesquisa {k} fora da escala 40–60% do gráfico")
        except (TypeError, ValueError): E(f"pesquisa {k} com números inválidos")

    # agenda
    ag = f.get("agenda") or []
    if not 4 <= len(ag) <= 10: A(f"agenda com {len(ag)} itens (manual: 4 a 10)")
    textos_ag = [norm(a.get("texto")) for a in ag]
    for a in ag:
        tx = str(a.get("texto", ""))
        try: d = date.fromisoformat(str(a.get("data", "")))
        except ValueError: E(f"agenda sem data AAAA-MM-DD: {tx[:50]}"); continue
        if d < hoje: E(f"agenda com evento passado ({d.strftime('%d/%m')}): {tx[:50]}")
        if d > hoje + timedelta(days=7): A(f"agenda além de 7 dias: {tx[:50]}")
        hh = str(a.get("hora", ""))
        if hh and not re.match(r"^\d{1,2}h(\d{2})?$", hh) and hh.lower() not in ("manhã", "à tarde", "tarde", "à noite", "noite"):
            A(f"agenda com hora fora do padrão 16h/21h30: {hh}")
        if not hh and re.search(r" x |jogo|debate|sessão", " " + tx.lower()): A(f"agenda sem hora (jogos, debates e sessões quase sempre têm): {tx[:50]}")
        if a.get("pid") and a.get("pid") not in ids: E(f"agenda aponta para pid inexistente: {a.get('pid')}")
        if a.get("secao") and a.get("secao") not in SECOES: A(f"agenda com secao inválida: {tx[:40]}")
        if ";" in tx or DIA_NUM.search(tx) or len(re.findall(r"\b\d{1,2}h\d{0,2}\b", tx)) > 1:
            A(f"agenda com mais de um evento no mesmo item (um evento por item, cada um com a sua data): {tx[:60]}")
        if re.search(r"\bida\b", tx.lower()):
            tm = [w for w in re.findall(r"[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ú-]{3,}", tx)]
            if tm and not any("volta" in t2 and any(norm(w) in t2 for w in tm) for t2 in textos_ag):
                A(f"jogo de ida sem a volta na agenda (inclua se cair nos próximos 7 dias): {tx[:50]}")

    # quiz
    qz = f.get("quiz") or []
    if qz and len(qz) != 3: A(f"quiz com {len(qz)} perguntas (manual: 3)")
    for i, q in enumerate(qz):
        if not isinstance(q.get("correta"), int) or not 0 <= q["correta"] < len(q.get("opcoes") or []): E(f"quiz {i + 1}: índice de resposta correta inválido")

    # explicadores
    for k, e in (f.get("explicadores") or {}).items():
        if not e.get("titulo") or not e.get("texto"): E(f"explicador '{k}' sem titulo ou texto")
        if e.get("atualizado") and not re.match(r"^\d{2}/\d{2}$", str(e["atualizado"])): A(f"explicador '{k}': atualizado deve ser dd/mm")

    # glossário e pessoas: o app marca os termos em neutro.texto, contexto, proximo e no texto dos explicadores
    todo = texto_marcavel(f)
    sem_uso = [k for k in (f.get("glossario") or {}) if k not in todo]
    if sem_uso: A(f"glossário sem uso nos textos (a rodada completa remove com --podar): {sem_uso}")
    sem_uso = [k for k in (f.get("pessoas") or {}) if k not in todo]
    if sem_uso: A(f"pessoas sem uso nos textos (a rodada completa remove com --podar): {sem_uso}")

    # fontes / espectro
    usadas = fontes_usadas(f)
    for k in usadas:
        if k not in fontes: A(f"fonte '{k}' usada mas fora do mapa fontes")
        elif k not in (f.get("espectro") or {}): A(f"fonte sem espectro: {k}")
    sobra = [k for k in fontes if k not in usadas and k not in REGUA]
    if sobra: A(f"{len(sobra)} fontes sem uso no mapa (o aplicar.py poda sozinho)")
    est = f.get("estatisticas") or {}
    ndiv = sum(1 for p in ps if (p.get("checagem") or {}).get("status") == "divergencia")
    if est and est.get("divergencias") != ndiv: A(f"estatisticas.divergencias = {est.get('divergencias')}, mas há {ndiv} (o aplicar.py recalcula)")

    # dia da semana x número do dia
    for loc, tipo, t in campos_texto(f):
        for m in DIA_NUM.finditer(str(t or "")):
            dn = int(m[2] or m[4]); mes = m[3] or m[5]
            wd = DIAS.index(m[1].lower())
            if mes:
                mm = int(mes); y = hoje.year + (1 if mm < hoje.month - 6 else -1 if mm > hoje.month + 6 else 0)
                try: ok = date(y, mm, dn).weekday() == wd
                except ValueError: ok = False
            else:
                span = range(-30, 131) if loc.startswith("calendario") else range(-30, 21)
                cands = [hoje + timedelta(days=k) for k in span if (hoje + timedelta(days=k)).day == dn]
                ok = not cands or any(c.weekday() == wd for c in cands)
            if not ok:
                # na virada (sem IA), texto corrido (explicadores, FAQ, atualizações) só avisa: dia citado há mais de 30 dias
                # sem o mês deixa de "conferir" sozinho na troca do dia e não pode travar a virada (14/11)
                (A if virada and tipo != "estrito" else E)(f"{loc}: '{m[0]}' não confere com o calendário" + (" (escreva o mês: 14/10)" if not mes else ""))

    # palavras de dia relativo (escritas no dia do feed anterior; na virada, no dia que acabou)
    ra = dt((ant or {}).get("atualizado_em"))
    dia_escrito = ra.date() if ra and ra.date() <= hoje else (hoje - timedelta(days=1) if ref.hour < 6 else hoje)
    for loc, tipo, trecho, palavra, classe in relativas(f):
        pid = re.match(r"\[([^\]]+)\]", loc)
        nova_enq = tipo == "enquete" and ant is not None and pid and not (ant_pauta(ant, pid[1]) or {}).get("enquete")
        msg = f"{loc}: '{palavra}' envelhece → troque por '{sugestao(palavra, dia_escrito)}' — …{trecho}…"
        if tipo == "enquete":
            msg = f"{loc}: '{palavra}' envelhece — …{trecho}…"
            if nova_enq: E(msg + " [enquete nova precisa ser atemporal: reescreva antes de publicar]")
            elif estrito: E(msg + " [enquete não se edita: retire com remove_enquete]")
            else: A(msg + " [enquete não se edita: retire com remove_enquete quando perder o sentido]")
        elif tipo == "estrito":
            (E if estrito else A)(msg)
        elif estrito:
            (E if classe == "dia" and PRINCIPAL.search(loc) else A)(msg)

    # tamanho
    tam = len(json.dumps(f, ensure_ascii=False, separators=(",", ":")).encode())
    if tam > 230_000: A(f"feed com {tam // 1000} KB minificado (meta: ≤ 230 KB)")

    # comparação com o anterior
    if ant:
        AP = {p.get("id"): p for p in ant.get("pautas") or []}
        for p in ps:
            a = (AP.get(p.get("id")) or {}).get("enquete")
            e = p.get("enquete")
            if a and e and (a.get("pergunta") != e.get("pergunta") or a.get("opcoes") != e.get("opcoes")):
                E(f"[{p.get('id')}] enquete mudou: os votos ficam gravados pelo índice da opção. Volte ao texto anterior ou retire a enquete")
        ant_t = {p.get("id"): norm((p.get("neutro") or {}).get("titulo")) for p in ant.get("pautas") or []}
        dor_ids = {d.get("id") for d in f.get("dormentes") or []}
        sumiram = [pid for pid in ant_t if pid not in ids and pid not in dor_ids]
        if sumiram: E(f"pautas que saíram sem ir para dormentes: {sumiram} (rode o aplicar.py com --prev anterior.json)")
        lim_d = (ref - timedelta(days=DIAS_DORMENTE)).isoformat()[:16] if ref else ""
        perd = [d.get("id") for d in ant.get("dormentes") or [] if isinstance(d, dict) and d.get("id") not in ids and d.get("id") not in dor_ids and str(d.get("ultima", ""))[:16] >= lim_d]
        # o aplicar.py guarda no máximo MAX_DORMENTES (as mais recentes): com a lista cheia, sair a mais antiga é esperado
        dor_f = [d for d in f.get("dormentes") or [] if isinstance(d, dict)]
        if len(dor_f) >= MAX_DORMENTES:
            corte = min(str(d.get("ultima", ""))[:16] for d in dor_f)
            perd = [pid for pid in perd if str(next((d.get("ultima", "") for d in ant.get("dormentes") or [] if isinstance(d, dict) and d.get("id") == pid), ""))[:16] > corte]
        if perd: E(f"dormentes perdidas em relação ao feed anterior: {perd} (rode o aplicar.py com --prev anterior.json)")
        for d in ant.get("dormentes") or []:
            if d.get("id") not in ant_t: ant_t[d.get("id")] = norm(d.get("titulo"))
        for pid, t in tt:
            if pid in ant_t: continue
            for aid, at in ant_t.items():
                if aid not in ids and difflib.SequenceMatcher(None, t, at).ratio() > 0.7:
                    A(f"[{pid}] parece continuação de '{aid}' do feed anterior (ou dormente): reusar o id?")
        a_p = {(x.get("data"), x.get("instituto")) for x in ant.get("pesquisas_2t") or []}
        if not a_p <= vistos: E("pesquisas_2t perdeu pesquisas que estavam no feed anterior")
        if hoje > TURNO2 and (ant.get("pesquisas_2t") or []) != (f.get("pesquisas_2t") or []):
            E("pesquisas_2t está congelada depois de 25/10")
        am = ant.get("mudancas") or {}
        if am.get("titulo") == mud.get("titulo") and len(mi) < 8:
            perdidos = [it.get("pid") for it in am.get("itens") or [] if it.get("pid") in ids and it.get("pid") not in mp]
            if perdidos: A(f"mudancas perdeu itens do feed anterior (devem acumular desde a última rodada completa): {perdidos}")
    for p in ps:
        so = p.get("social")
        if so is not None:
            if not isinstance(so, list) or not all(isinstance(x, str) for x in so): E(f"[{p.get('id')}] social deve ser uma lista de frases")
            else:
                if not 3 <= len(so) <= 6: A(f"[{p.get('id')}] social com {len(so)} frases (3 a 6)")
                for i, x in enumerate(so):
                    if len(x) > 140: E(f"[{p.get('id')}] social.{i} com {len(x)} caracteres (até 140: é um slide)")
                    vs = veiculos_em(x)
                    if vs: E(f"[{p.get('id')}] social.{i} cita veículo ({', '.join(vs)}): diga só o fato")
        if p.get("status") == "encerrada" and not str(p.get("desfecho") or "").strip():
            A(f"[{p.get('id')}] cobertura encerrada sem desfecho: escreva \"desfecho\" (1 frase: como terminou), que o app mostra no topo da matéria")
        elif p.get("desfecho") and len(str(p["desfecho"])) > 200: A(f"[{p.get('id')}] desfecho com {len(str(p['desfecho']))} caracteres (até 200)")
    grafias = {}
    for x in list(ps) + list(f.get("dormentes") or []):
        for h in (x.get("hashtags") if isinstance(x, dict) and isinstance(x.get("hashtags"), list) else []):
            if isinstance(h, str) and HASHTAG.match(h): grafias.setdefault(chave_hashtag(h), set()).add(h)
    for k, g in grafias.items():
        if len(g) > 1: A(f"a mesma hashtag com grafias diferentes ({', '.join(sorted(g))}): use uma só em todas as pautas")
    try: checar_regras_1511(f, ant, ref, virada, IND, agora)
    except Exception as e: A(f"conferência das regras de 15/11 falhou: {e!r}")
    try: checar_regras_1611r(f, ant, ref, agora, virada)
    except Exception as e: A(f"conferência das regras de 16/11 (noite) falhou: {e!r}")
    try: checar_regras_1711(f, ant, ref, agora, virada)
    except Exception as e: A(f"conferência das regras de 17/11 falhou: {e!r}")
    try: checar_mercado(f, IND, ref)
    except Exception as e: A(f"conferência dos números de mercado falhou: {e!r}")
    return ref, agora

# Hashtags das pautas (manual 2f): "#" + 2 a 30 letras ou números (acento vale), em CamelCase, sem espaço, hífen nem pontuação.
HASHTAG = re.compile(r"^#[0-9A-Za-zÀ-ÖØ-öø-ÿ]{2,30}$")
HASHTAG_OPINIAO = re.compile(r"^(fora|mito$|lulalivre|lulaladrao|elenao|elesim|bolsominion|petralha|esquerdopata|mamata)|golpis|ladrao|fascis|comunis|genocid|traidor|vergonha|lixo|chocante|absurd|escandal", re.I)
def chave_hashtag(t): return re.sub(r"[^0-9a-z]", "", norm(t))
def checar_hashtags(p, pid, ant):
    hs = p.get("hashtags")
    if hs is None: return
    if not isinstance(hs, list) or not all(isinstance(x, str) for x in hs): E(f"[{pid}] hashtags deve ser lista de textos (ex.: [\"#Copom\", \"#Selic\"])"); return
    if not hs: A(f"[{pid}] hashtags vazia: tire o campo ou ponha 2 a 4"); return
    if len(hs) > 4: E(f"[{pid}] {len(hs)} hashtags (máx. 4; ideal 2 a 4)")
    elif len(hs) < 2: A(f"[{pid}] só 1 hashtag (ideal 2 a 4)")
    ks = []
    for x in hs:
        if not HASHTAG.match(x) or not re.search(r"[A-Za-zÀ-ÖØ-öø-ÿ]", x):
            E(f"[{pid}] hashtag inválida '{x}': # + 2 a 30 letras ou números, sem espaço, hífen nem pontuação (ex.: #PECdaSegurança)"); continue
        if HASHTAG_OPINIAO.search(chave_hashtag(x)): A(f"[{pid}] hashtag '{x}' parece opinativa ou partidária: use o nome neutro do assunto")
        ks.append(chave_hashtag(x))
    dup = sorted({k for k in ks if ks.count(k) > 1})
    if dup: E(f"[{pid}] hashtags repetidas (maiúscula/acento não diferenciam): {', '.join(dup)}")
    ap = ant_pauta(ant, pid) if ant else None
    old = [chave_hashtag(x) for x in (ap.get("hashtags") or []) if isinstance(x, str)] if ap and isinstance(ap.get("hashtags"), list) else []
    if old and ks and not set(old) & set(ks): A(f"[{pid}] a cobertura trocou todas as hashtags (antes: {', '.join(ap['hashtags'])}): mantenha a principal, porque há leitores seguindo")

FIM_MAX = 160

def checar_fim(p, pid, ant):
    """FIM (17/11, Pedro): toda cobertura tem um critério de encerramento ("fim": "Aprovação e promulgação da PEC").
    Atingido o fim, status "encerrada" (com desfecho) e acabou: fato novo do tema abre cobertura NOVA (id e tema novos)."""
    fim = p.get("fim")
    tp = p.get("tipo", "cobertura")
    ap = ant_pauta(ant, pid) if ant else None
    if fim is not None:
        if not isinstance(fim, str) or not fim.strip(): E(f"[{pid}] fim deve ser um texto (o critério de encerramento da cobertura)")
        elif len(fim) > FIM_MAX: E(f"[{pid}] fim com {len(fim)} caracteres (até {FIM_MAX}: uma frase curta, ex.: \"Aprovação e promulgação da PEC\")")
        elif tp == "pontual": A(f"[{pid}] pontual com fim (só cobertura usa)")
    elif tp == "cobertura":
        nova = ant is not None and ap is None and pid not in {d.get("id") for d in ant.get("dormentes") or [] if isinstance(d, dict)}
        if nova: E(f"[{pid}] cobertura nova sem \"fim\": diga quando ela termina (ex.: \"Aprovação e promulgação da PEC\", \"Final da Copa do Brasil\")")
        else: A(f"[{pid}] cobertura sem \"fim\": acrescente o critério de encerramento (set path \"fim\")")
    if ap and ap.get("status") == "encerrada":
        if p.get("status") != "encerrada":
            E(f"[{pid}] cobertura encerrada voltou a {p.get('status', 'ativa')}: depois do fim ela não reabre; fato novo do tema abre cobertura nova (id e tema novos, com o seu fim)")
        velhas = {(u.get("hora"), u.get("texto")) for u in ap.get("atualizacoes") or [] if isinstance(u, dict)}
        if any((u.get("hora"), u.get("texto")) not in velhas for u in p.get("atualizacoes") or [] if isinstance(u, dict)):
            E(f"[{pid}] cobertura encerrada recebeu atualização: depois do fim, fato novo do tema vai para uma cobertura nova (ex.: \"Implementação da escala 6x1\")")

def checar_cobertura(p, pid, ref):
    sec = p.get("secao")
    sub = p.get("subtema")
    if not sub: E(f"[{pid}] sem subtema (escolha um de {sec}: {', '.join(TAXONOMIA.get(sec, []))})")
    elif sub not in TAXONOMIA.get(sec, []): E(f"[{pid}] subtema '{sub}' não existe em {sec}: use {', '.join(TAXONOMIA.get(sec, []))}")
    tp = p.get("tipo", "cobertura")
    if tp not in TIPOS: E(f"[{pid}] tipo deve ser cobertura ou pontual")
    st = p.get("status", "ativa")
    if st not in STATUS: E(f"[{pid}] status deve ser ativa, ao_vivo ou encerrada")
    if tp == "pontual":
        if st == "ao_vivo": E(f"[{pid}] pontual não fica ao vivo: vire cobertura ou use ativa")
        if not p.get("por_que"): A(f"[{pid}] pontual sem por_que (1 frase: por que importa)")
        if p.get("direita") or p.get("esquerda"): A(f"[{pid}] pontual com versões de viés (o formato curto não mostra)")
        if p.get("etapa") or p.get("faq"): A(f"[{pid}] pontual com etapa/faq (só coberturas mostram)")
        if len(re.findall(r"[.!?](?:\s|$)", (p.get("neutro") or {}).get("texto", ""))) > 3: A(f"[{pid}] pontual com texto longo (2 a 3 frases)")
    if p.get("por_que") and len(p["por_que"]) > 200: A(f"[{pid}] por_que longo ({len(p['por_que'])} caracteres; 1 frase)")
    if st == "ao_vivo":
        hs = [dt(p.get("hora")), dt(p.get("ao_vivo_desde"))] + [dt(u.get("hora")) for u in p.get("atualizacoes") or []]
        hs = [h for h in hs if h]
        if hs and (ref - max(hs)).total_seconds() > 4 * 3600: A(f"[{pid}] ao_vivo sem novidade há mais de 4 h (o aplicar.py volta para ativa)")
    et = p.get("etapa")
    if et is not None:
        ps_ = et.get("passos") if isinstance(et, dict) else None
        if not isinstance(ps_, list) or not 2 <= len(ps_) <= 7 or not all(isinstance(x, str) and x for x in ps_):
            E(f"[{pid}] etapa.passos precisa de 2 a 7 rótulos")
        else:
            for x in ps_:
                if len(x) > 24: E(f"[{pid}] etapa '{x}' com {len(x)} caracteres (cabe 24)")
            if not isinstance(et.get("atual"), int) or not 0 <= et["atual"] < len(ps_): E(f"[{pid}] etapa.atual deve ser o índice (0 a {len(ps_) - 1}) do passo em que a cobertura está")
    fq = p.get("faq")
    if fq is not None:
        if not isinstance(fq, list) or not 2 <= len(fq) <= 5: A(f"[{pid}] faq com 2 a 5 perguntas")
        for q in fq if isinstance(fq, list) else []:
            if not isinstance(q, dict): E(f"[{pid}] faq precisa de itens {{p, r}}"); continue
            if not q.get("p") or not q.get("r"): E(f"[{pid}] faq precisa de p (pergunta) e r (resposta)")
            elif len(q["r"]) > 400: A(f"[{pid}] faq: resposta longa ({len(q['r'])} caracteres)")
    uf = p.get("uf")
    if uf is not None:
        if p.get("secao") != "brasil": A(f"[{pid}] uf só é usado em brasil")
        if not isinstance(uf, list) or not uf or any(u not in UFS for u in uf): E(f"[{pid}] uf deve ser lista de siglas (ex.: [\"SP\"])")
    sv = p.get("servicos")
    if sv is not None:
        if not isinstance(sv, list) or not 1 <= len(sv) <= 6: E(f"[{pid}] servicos com 1 a 6 itens")
        for x in sv if isinstance(sv, list) else []:
            if not isinstance(x, dict): E(f"[{pid}] servicos precisa de itens {{texto, url}}"); continue
            if not x.get("texto"): E(f"[{pid}] servicos sem texto")
            if x.get("url") and not str(x["url"]).startswith(("http://", "https://")): E(f"[{pid}] servicos com url inválida")
    if p.get("e_o_brasil") and len(p["e_o_brasil"]) > 300: A(f"[{pid}] e_o_brasil longo ({len(p['e_o_brasil'])} caracteres; até 300)")
    es = p.get("essencial")
    if es is not None:
        if not isinstance(es, list) or not 2 <= len(es) <= 3: E(f"[{pid}] essencial com 2 ou 3 pontos")
        if p.get("status") != "ao_vivo": A(f"[{pid}] essencial só aparece em cobertura ao_vivo: tire quando acabar")
    for t in p.get("titulos") or []:
        if not ISO.match(str(t.get("hora", ""))) or not t.get("titulo"): E(f"[{pid}] titulos com item inválido (é automático: não escreva à mão)"); break

def ant_pauta(ant, pid):
    for p in ant.get("pautas") or []:
        if p.get("id") == pid: return p
    return None

def texto_marcavel(f):
    ps = f.get("pautas") or []
    return " ".join([" ".join([(p.get("neutro") or {}).get("texto", ""), p.get("contexto") or "", p.get("proximo") or ""]) for p in ps] +
                    [e.get("texto", "") for e in (f.get("explicadores") or {}).values()])

def fontes_usadas(f):
    u = set()
    for p in f.get("pautas") or []:
        u.update(p.get("fontes") or [])
        u.update(l.get("fonte") for l in p.get("links") or [])
        u.update(e.get("fonte") for e in p.get("enquadramentos") or [])
    u.update(b.get("fonte") for b in f.get("breves") or [])
    u.update(v.get("fonte") for v in (f.get("estatisticas") or {}).get("veiculos") or [])
    u.discard(None)
    return u

INICIO_FRASE = set("o a os as um uma no na nos nas do da dos das em de para por com sem se ao à e mas já ainda segundo após antes depois "
                   "ele ela eles elas isso este esta esse essa quem que como quando onde porque também só não sim governo".split())
INSTITUCIONAIS = set("Planalto Congresso Senado Câmara Bolsa Governo Justiça Brasil País Estado Estados União Executivo Legislativo "
                     "Judiciário Supremo Corte Federal Nacional República Presidência Ministério Todos Juntos".split())
def nomes(t):
    """Nomes próprios (palavras com maiúscula fora do início de frase, e siglas)."""
    out = []
    for frase in re.split(r"(?<=[.!?:;“\"])\s+", str(t or "")):
        palavras = re.findall(r"[\wÀ-ú][\wÀ-ú'-]*", frase)
        for i, w in enumerate(palavras):
            if i == 0 or w.lower() in INICIO_FRASE: continue
            if re.match(r"^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]", w) and len(w) >= 3: out.append(w)
    return out

# ---------- gráficos (catálogo de modelos; manual 2, "visuais") ----------
FORMAS = ("barras", "colunas", "linha", "area", "barras_empilhadas", "rosca", "placar_votacao", "mapa_uf", "antes_depois",
          "faixa_meta", "ranking", "pesquisa", "contagem")
UFS = {"AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS",
       "RO", "RR", "SC", "SP", "SE", "TO"}
CASAS_VOTO = {"camara": 513, "senado": 81, "stf": 11}
PERIODOS = re.compile(r"^(\d{1,3})(d|m|a)$|^tudo$")
SERIES_IDX = None  # ids de series/index.json (ao lado do feed), quando existir
SERIES_ROBO = {"selic", "ipca12m", "ipca_mes", "desemprego", "dolar", "ibovespa"}  # as que tools/indicadores.py grava


def ler_series(pasta):
    try:
        with open(os.path.join(pasta, "series", "index.json"), encoding="utf-8") as fh:
            return {x["id"] for x in json.load(fh).get("series") or [] if isinstance(x, dict) and x.get("id")}
    except Exception:
        return None


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def checar_grafico(pid, v):
    """Valida um visual {tipo:"grafico"} de qualquer forma do catálogo: números puros, unidade curta e fonte."""
    forma = v.get("forma")
    its = v.get("itens") or []
    if forma not in FORMAS: E(f"[{pid}] grafico.forma deve ser uma de: {', '.join(FORMAS)}"); return
    tg = v.get("titulo")
    if not isinstance(tg, str) or not tg.strip(): E(f"[{pid}] grafico sem titulo")
    elif len(tg) > 70: A(f"[{pid}] grafico.titulo com {len(tg)} caracteres (até 70)")
    serie = v.get("serie")
    if serie is not None and forma not in ("linha", "area", "faixa_meta"): E(f"[{pid}] grafico.serie só vale nas formas linha, area e faixa_meta")
    if not (isinstance(v.get("fonte"), str) and v.get("fonte").strip()) and not serie:
        E(f"[{pid}] grafico sem fonte (de onde vêm os números)")
    un = v.get("unidade")
    if un is not None and (not isinstance(un, str) or len(un) > 12): E(f"[{pid}] grafico.unidade deve ser texto curto (%, R$ bi, votos…)")
    if v.get("casas") is not None and v.get("casas") not in (0, 1, 2): E(f"[{pid}] grafico.casas deve ser 0, 1 ou 2")
    if v.get("nota") is not None and (not isinstance(v.get("nota"), str) or len(v.get("nota")) > 160): A(f"[{pid}] grafico.nota até 160 caracteres")
    if not isinstance(its, list): E(f"[{pid}] grafico.itens deve ser lista"); return

    def itens_simples(lo, hi, rmax, nome=forma, minimo=None, maximo=None):
        if not lo <= len(its) <= hi: E(f"[{pid}] grafico {nome} com {len(its)} itens ({lo} a {hi})")
        for it in its:
            if not isinstance(it, dict) or not isinstance(it.get("rotulo"), str) or not it.get("rotulo").strip(): E(f"[{pid}] grafico com item sem rotulo"); continue
            vl = it.get("valor")
            if not _num(vl): E(f"[{pid}] grafico.valor '{vl}' deve ser número puro (a unidade vai em 'unidade')"); continue
            if minimo is not None and vl < minimo: E(f"[{pid}] grafico {nome}: valor {vl} abaixo de {minimo}")
            if maximo is not None and vl > maximo: E(f"[{pid}] grafico {nome}: valor {vl} acima de {maximo}")
            if len(it["rotulo"]) > rmax: A(f"[{pid}] grafico.rotulo '{it['rotulo']}' longo (até {rmax} em {nome})")

    def checa_serie():
        if not isinstance(serie, str) or not re.match(r"^[a-z0-9_]{2,30}$", serie): E(f"[{pid}] grafico.serie deve ser o id de uma série (selic, ipca12m, dolar…)"); return
        if SERIES_IDX is not None and serie not in SERIES_IDX:
            # série do robô (tools/indicadores.py) que ainda não foi gravada (ex.: selic.json faltou na manhã de 03/11):
            # o app esconde o gráfico até ela aparecer, então não bloqueia a rodada
            if serie in SERIES_ROBO: A(f"[{pid}] grafico.serie '{serie}' ainda não está em series/index.json: o app esconde o gráfico até o robô gravá-la")
            else: E(f"[{pid}] grafico.serie '{serie}' não existe em series/index.json ({', '.join(sorted(SERIES_IDX | SERIES_ROBO))})")
        elif SERIES_IDX is None and serie not in SERIES_ROBO: A(f"[{pid}] grafico.serie '{serie}' não é uma das séries do robô ({', '.join(sorted(SERIES_ROBO))})")
        per = v.get("periodo")
        if per is not None and not (isinstance(per, str) and PERIODOS.match(per)): E(f"[{pid}] grafico.periodo '{per}' inválido (ex.: 30d, 12m, 5a, tudo)")
        for k in ("desde", "ate"):
            if v.get(k) is not None and not re.match(r"^\d{4}-\d{2}(-\d{2})?$", str(v.get(k))): E(f"[{pid}] grafico.{k} deve ser AAAA-MM ou AAAA-MM-DD")
        if its: A(f"[{pid}] grafico com serie e itens: o app usa a série e ignora os itens")

    if forma in ("barras", "colunas"):
        itens_simples(*{"barras": (2, 12, 28), "colunas": (2, 14, 10)}[forma])
    elif forma in ("linha", "area"):
        if serie is not None: checa_serie()
        else: itens_simples(3, 24, 12)
    elif forma == "ranking":
        itens_simples(3, 10, 28)
        if v.get("ordem") not in (None, "desc", "asc"): E(f"[{pid}] ranking.ordem deve ser desc ou asc")
    elif forma == "rosca":
        itens_simples(2, 6, 24, minimo=0)
        if its and sum(it.get("valor") or 0 for it in its if isinstance(it, dict) and _num(it.get("valor"))) <= 0: E(f"[{pid}] rosca com soma zero")
        if v.get("centro") is not None and len(str(v.get("centro"))) > 12: A(f"[{pid}] rosca.centro até 12 caracteres")
    elif forma == "antes_depois":
        itens_simples(2, 2, 18)
    elif forma == "mapa_uf":
        itens_simples(3, 27, 2)
        ufs = [it.get("rotulo") for it in its if isinstance(it, dict)]
        for u in ufs:
            if u not in UFS: E(f"[{pid}] mapa_uf: '{u}' não é sigla de UF (SP, RJ, DF…)")
        if len(set(ufs)) != len(ufs): E(f"[{pid}] mapa_uf com UF repetida")
    elif forma == "barras_empilhadas":
        sr = v.get("series")
        if not isinstance(sr, list) or not 2 <= len(sr) <= 4 or not all(isinstance(x, str) and x.strip() and len(x) <= 18 for x in sr):
            E(f"[{pid}] barras_empilhadas.series: 2 a 4 nomes de até 18 caracteres"); sr = sr if isinstance(sr, list) else []
        if not 2 <= len(its) <= 8: E(f"[{pid}] grafico barras_empilhadas com {len(its)} itens (2 a 8)")
        for it in its:
            if not isinstance(it, dict) or not isinstance(it.get("rotulo"), str) or not it.get("rotulo").strip(): E(f"[{pid}] grafico com item sem rotulo"); continue
            vs = it.get("valores")
            if not isinstance(vs, list) or len(vs) != len(sr) or not all(_num(x) and x >= 0 for x in vs): E(f"[{pid}] barras_empilhadas: '{it['rotulo']}' precisa de valores (números ≥ 0), um para cada série")
            if len(it["rotulo"]) > 24: A(f"[{pid}] grafico.rotulo '{it['rotulo']}' longo (até 24 em barras_empilhadas)")
        if v.get("modo") not in (None, "valor", "percentual"): E(f"[{pid}] barras_empilhadas.modo deve ser valor ou percentual")
    elif forma == "placar_votacao":
        casa = v.get("casa")
        if casa not in CASAS_VOTO: E(f"[{pid}] placar_votacao.casa deve ser camara (513), senado (81) ou stf (11)"); return
        itens_simples(2, 4, 14, minimo=0)
        tot = CASAS_VOTO[casa]
        if any(isinstance(it, dict) and _num(it.get("valor")) and int(it["valor"]) != it["valor"] for it in its): E(f"[{pid}] placar_votacao: votos são números inteiros")
        sm = sum(it.get("valor") for it in its if isinstance(it, dict) and _num(it.get("valor")))
        if sm > tot: E(f"[{pid}] placar_votacao: {sm} votos é mais que as {tot} cadeiras de {casa}")
        mn = v.get("minimo")
        if mn is not None and (not isinstance(mn, int) or isinstance(mn, bool) or not 0 < mn <= tot): E(f"[{pid}] placar_votacao.minimo deve ser inteiro de 1 a {tot}")
        if v.get("resultado") not in (None, "", "aprovado", "rejeitado"): E(f"[{pid}] placar_votacao.resultado: aprovado, rejeitado ou vazio")
    elif forma == "faixa_meta":
        if serie is not None: checa_serie()
        else: itens_simples(3, 24, 10)
        m = v.get("meta")
        if not isinstance(m, dict) or not all(_num(m.get(k)) for k in ("centro", "min", "max")): E(f"[{pid}] faixa_meta.meta precisa de centro, min e max (números)")
        elif not m["min"] <= m["centro"] <= m["max"]: E(f"[{pid}] faixa_meta.meta: min ≤ centro ≤ max")
    elif forma == "pesquisa":
        itens_simples(2, 8, 20, minimo=0, maximo=100)
        mg = v.get("margem")
        if not _num(mg) or not 0 < mg <= 10: E(f"[{pid}] pesquisa.margem (pontos percentuais, ex.: 2) é obrigatória")
        if not isinstance(v.get("instituto"), str) or not v.get("instituto").strip(): E(f"[{pid}] pesquisa sem instituto")
        try: date.fromisoformat(str(v.get("data")))
        except ValueError: E(f"[{pid}] pesquisa.data deve ser AAAA-MM-DD (fim do campo)")
    elif forma == "contagem":
        try: d = date.fromisoformat(str(v.get("data")))
        except ValueError: E(f"[{pid}] contagem.data deve ser AAAA-MM-DD"); d = None
        if not isinstance(v.get("rotulo"), str) or not v.get("rotulo").strip() or len(v.get("rotulo")) > 60: E(f"[{pid}] contagem.rotulo (até 60 caracteres, ex.: \"para a reunião do Copom\") é obrigatório")
        if d and d < datetime.now(SP).date(): A(f"[{pid}] contagem com data passada ({d.isoformat()}): troque o visual")
        for it in its[:6]:
            if not isinstance(it, dict) or not re.match(r"^\d{4}-\d{2}-\d{2}$", str(it.get("data"))) or not isinstance(it.get("texto"), str): E(f"[{pid}] contagem.itens: [{{data AAAA-MM-DD, texto}}]")
        if len(its) > 4: A(f"[{pid}] contagem com mais de 4 marcos (o app mostra 4)")



def checar_imagem(pid, im, p):
    mo = im.get("modelo")
    if mo not in MODELOS: E(f"[{pid}] modelo de imagem inválido: {mo}"); return
    d = im.get("dados") or {}
    if im.get("etiqueta") not in ("Ilustração", "Infográfico"): A(f"[{pid}] imagem.etiqueta deve ser Ilustração ou Infográfico")
    if not im.get("alt"): A(f"[{pid}] imagem sem alt")
    if im.get("etiqueta") == "Infográfico" and mo in SO_ILUSTRACAO: A(f"[{pid}] modelo {mo} não mostra números: etiqueta deveria ser Ilustração")
    for k, n in LIM.get(mo, {}).items():
        v = d.get(k)
        if v is not None and len(str(v)) > n: E(f"[{pid}] imagem {mo}.{k} com {len(str(v))} caracteres (cabe {n}): '{v}'")
    base = " ".join([(p.get("neutro") or {}).get("texto", ""), (p.get("neutro") or {}).get("titulo", ""), p.get("contexto") or "",
                     json.dumps(p.get("atualizacoes"), ensure_ascii=False), json.dumps(p.get("checagem"), ensure_ascii=False),
                     json.dumps(p.get("visuais"), ensure_ascii=False)])
    if mo == "indicador":
        ser = [x for x in (d.get("serie") or []) if isinstance(x, (int, float))]
        if len(ser) < 3: E(f"[{pid}] indicador sem serie de 3+ números: o app desenha barras subindo (enganoso numa queda). Dê a serie real ou use outro modelo (dinheiro/generica)")
        if d.get("valor") and d.get("valor") == d.get("variacao"): A(f"[{pid}] indicador com valor e variacao iguais")
    if mo == "plenario":
        de, to = d.get("destaque"), d.get("total")
        if not isinstance(de, int) or not isinstance(to, int) or not 0 < de <= to: E(f"[{pid}] plenario: destaque e total devem ser inteiros com destaque ≤ total")
        elif not re.search(rf"\b{de}\b", base): E(f"[{pid}] plenario.destaque {de} não aparece no texto da pauta: precisa ser uma contagem real (votos, cadeiras, mínimo exigido)")
    if mo == "dinheiro":
        its = d.get("itens") or []
        if len(its) > 3: A(f"[{pid}] dinheiro com mais de 3 itens (o app mostra 3)")
        for it in its:
            if len(str(it[0])) > 22: E(f"[{pid}] dinheiro: item '{it[0]}' tem {len(str(it[0]))} caracteres (cabe 22)")
            if len(it) > 1 and len(str(it[1])) > 10: E(f"[{pid}] dinheiro: valor '{it[1]}' tem {len(str(it[1]))} caracteres (cabe 10)")
    if mo == "pesquisa":
        for s in (d.get("series") or [])[:4]:
            if len(str(s[0])) > 10: E(f"[{pid}] pesquisa: instituto '{s[0]}' com mais de 10 caracteres")
            for v in s[1:3]:
                try:
                    if not 0 <= float(v) <= 60: A(f"[{pid}] pesquisa: valor {v} fora da escala 0–60 do desenho")
                except (TypeError, ValueError): E(f"[{pid}] pesquisa: valor não numérico {v}")
        if len(d.get("series") or []) > 4: A(f"[{pid}] pesquisa com mais de 4 séries (o app mostra 4)")
    if mo == "campo":
        ga, gb = d.get("ga"), d.get("gb")
        if (ga in (None, "")) != (gb in (None, "")): E(f"[{pid}] campo: ga e gb vão juntos (só com jogo terminado)")
    if mo == "celular" and d.get("contador") and not re.search(re.escape(str(d.get("contador")).split()[0]), base):
        A(f"[{pid}] celular.contador '{d.get('contador')}' não aparece no texto")

def main(argv):
    args, prev, as_json, virada, agora, indf = [], None, False, False, None, None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--prev": prev = argv[i + 1]; i += 2; continue
        if a == "--agora": agora = datetime.fromisoformat(argv[i + 1]); i += 2; continue
        if a == "--ind": indf = argv[i + 1]; i += 2; continue
        if a == "--json": as_json = True
        elif a == "--virada": virada = True
        elif a in ("-h", "--help"): print(__doc__); return 0
        else: args.append(a)
        i += 1
    if not args: print(__doc__); return 2
    if len(args) > 1 and not prev: prev = args[1]
    try:
        f = json.load(open(args[0], encoding="utf-8"))
    except Exception as e:
        print(f"ERRO: JSON inválido: {e}")
        if as_json: print(json.dumps({"erros": 1, "avisos": 0, "pendencias": []}, ensure_ascii=False))
        return 1
    ant = None
    if prev:
        try: ant = json.load(open(prev, encoding="utf-8"))
        except Exception: A("não consegui ler o feed anterior")
    if agora is not None and agora.tzinfo is None: agora = agora.replace(tzinfo=SP)
    IND = ler_indicadores(indf or os.path.join(os.path.dirname(os.path.abspath(args[0])), "indicadores.json"))
    global SERIES_IDX
    SERIES_IDX = ler_series(os.path.dirname(os.path.abspath(args[0])))
    try: ref, ag = checar(f, ant, virada, agora, IND)
    except Exception as e:
        E(f"validar.py falhou ao checar (algum campo com tipo errado?): {e!r}"); ag = agora or datetime.now(SP)
    try: pend = pendencias(f, ag, IND)
    except Exception as e:
        E(f"validar.py falhou nas pendências: {e!r}"); pend = []
    for pnd in pend:
        if pnd["tipo"] == "frase_pendente":
            for a in f.get("agenda") or []:
                if a.get("pid") == pnd["pid"] and a.get("data") == ag.date().isoformat() and hora_agenda(a.get("hora")):
                    h, m = hora_agenda(a.get("hora"))
                    if ag >= datetime(ag.year, ag.month, ag.day, h, m, tzinfo=SP) + timedelta(minutes=dur_agenda(a.get("texto"))):
                        A(f"PENDÊNCIA [{pnd['pid']}]: o evento das {a.get('hora')} já deve ter terminado e o texto ainda diz que não aconteceu")
                        break
    ps = f.get("pautas") or []
    print(f"{len(ps)} pautas · {len(erros)} erros · {len(avisos)} avisos · {len(pend)} pendências · referência {ag.strftime('%d/%m %Hh%M')}{' · modo virada' if virada else ''}")
    for m in erros: print("ERRO:", m)
    for m in avisos: print("AVISO:", m)
    for pnd in pend: print(f"PENDÊNCIA [{pnd['pid'] or '-'}] ({pnd['tipo']}): {pnd['texto']}")
    if as_json:
        print(json.dumps({"erros": len(erros), "avisos": len(avisos), "pendencias": pend}, ensure_ascii=False))
    return 1 if erros else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
