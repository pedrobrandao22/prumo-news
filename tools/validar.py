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

def pendencias(f, agora):
    """Itens que já deveriam ter desfecho. agora: datetime com fuso."""
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
        hm = hora_agenda(a.get("hora"))
        if hm:
            ini = datetime(d.year, d.month, d.day, hm[0], hm[1], tzinfo=SP)
            if agora >= ini:
                fim = ini + timedelta(minutes=dur_agenda(a.get("texto")))
                est = "já deve ter terminado" if agora >= fim else "em andamento"
                out.append({"pid": a.get("pid") or "", "tipo": "agenda_comecou", "texto": f"{a.get('hora')} {est}: confira o desfecho — {tx}"})
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
    return out

# ---------- checagem ----------
# números do mercado no texto × indicadores.json (dólar e Ibovespa, gravados pelo robô de cotações)
IND_CTX = {"dolar": re.compile(r"d[óo]lar", re.I), "ibovespa": re.compile(r"ibovespa|\bbolsa\b|\bB3\b", re.I)}
IND_VAL = {"dolar": re.compile(r"R\$\s?(\d{1,2},\d{2,4})(?!\d)"), "ibovespa": re.compile(r"(\d{2,3}(?:\.\d{3})|\d{2,3}(?:,\d)?\s?mil)\s*pontos", re.I)}
IND_PCT = re.compile(r"(\d{1,2}(?:,\d{1,2})?)\s?%\s*(na semana|no dia|em uma semana|em sete dias)", re.I)
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
        ok[k] = {"lo": min(ult) * 0.97, "hi": max(ult) * 1.03, "sem": abs(se[-1] / se[-6] - 1) * 100, "dia": abs(var) if var is not None else None, "nome": x.get("nome") or k}
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
            ctx = sorted((m.start(), k) for k in ok for m in IND_CTX[k].finditer(fr))
            if not ctx: continue
            def dono(pos):
                d = [k for s0, k in ctx if s0 <= pos]
                return d[-1] if d else None
            problemas = []
            for k in ok:
                for m in IND_VAL[k].finditer(fr):
                    if dono(m.start()) != k: continue
                    if VARIACAO_ANTES.search(fr[max(0, m.start() - 30):m.start()]): continue  # "perde 37 mil pontos" é variação, não nível
                    try: v = num_br(m.group(1))
                    except ValueError: continue
                    if not ok[k]["lo"] <= v <= ok[k]["hi"]:
                        problemas.append(f"{ok[k]['nome']} {m.group(0).strip()} fora da faixa dos últimos 10 pregões ({fmt_ind(k, ok[k]['lo'] / 0.97)} a {fmt_ind(k, ok[k]['hi'] / 1.03)})")
            for m in IND_PCT.finditer(fr):
                k = dono(m.start())
                if not k: continue
                c = float(m.group(1).replace(",", "."))
                if "dia" in m.group(2).lower():
                    real = ok[k]["dia"]
                    if real is None or abs(c - real) <= max(0.5, 0.2 * real): continue
                else:
                    real = ok[k]["sem"]
                    if abs(c - real) <= max(1.5, 0.2 * real): continue
                problemas.append(f"{ok[k]['nome']}: \"{m.group(0)}\", mas a variação foi de {real:.2f}% ({m.group(2)})")
            for pr_ in problemas:
                (E if estrito else A)(f"{onde}: número de mercado não bate com os indicadores — {pr_}. Confira na fonte.")


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
            if tp == "grafico":
                forma = v.get("forma")
                if forma not in ("barras", "colunas", "linha"): E(f"[{pid}] grafico.forma deve ser barras, colunas ou linha")
                tg = v.get("titulo")
                if not isinstance(tg, str) or not tg.strip(): E(f"[{pid}] grafico sem titulo")
                elif len(tg) > 70: A(f"[{pid}] grafico.titulo com {len(tg)} caracteres (até 70)")
                if not isinstance(v.get("fonte"), str) or not v.get("fonte").strip(): E(f"[{pid}] grafico sem fonte (de onde vêm os números)")
                un = v.get("unidade")
                if un is not None and (not isinstance(un, str) or len(un) > 12): E(f"[{pid}] grafico.unidade deve ser texto curto (%, R$ bi, votos…)")
                if v.get("casas") is not None and v.get("casas") not in (0, 1, 2): E(f"[{pid}] grafico.casas deve ser 0, 1 ou 2")
                lo, hi, rmax = {"barras": (2, 12, 28), "colunas": (2, 14, 10), "linha": (3, 24, 12)}.get(forma, (2, 12, 28))
                if not lo <= len(its) <= hi: E(f"[{pid}] grafico {forma} com {len(its)} itens ({lo} a {hi})")
                for it in its:
                    if not isinstance(it, dict) or not isinstance(it.get("rotulo"), str) or not it.get("rotulo").strip(): E(f"[{pid}] grafico com item sem rotulo"); continue
                    vl = it.get("valor")
                    if isinstance(vl, bool) or not isinstance(vl, (int, float)): E(f"[{pid}] grafico.valor '{vl}' deve ser número puro (a unidade vai em 'unidade')")
                    if len(it["rotulo"]) > rmax: A(f"[{pid}] grafico.rotulo '{it['rotulo']}' longo (até {rmax} em {forma})")
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
            if not ok: E(f"{loc}: '{m[0]}' não confere com o calendário")

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
        if p.get("status") == "encerrada" and not str(p.get("desfecho") or "").strip():
            A(f"[{p.get('id')}] cobertura encerrada sem desfecho: escreva \"desfecho\" (1 frase: como terminou), que o app mostra no topo da matéria")
        elif p.get("desfecho") and len(str(p["desfecho"])) > 200: A(f"[{p.get('id')}] desfecho com {len(str(p['desfecho']))} caracteres (até 200)")
    try: checar_mercado(f, IND, ref)
    except Exception as e: A(f"conferência dos números de mercado falhou: {e!r}")
    return ref, agora

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
    try: ref, ag = checar(f, ant, virada, agora, IND)
    except Exception as e:
        E(f"validar.py falhou ao checar (algum campo com tipo errado?): {e!r}"); ag = agora or datetime.now(SP)
    try: pend = pendencias(f, ag)
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
