#!/usr/bin/env python3
"""Aplica um patch ao feed do Prumo News e recalcula os campos mecânicos.

Uso:
  python3 aplicar.py feed.json patch.json -o novo.json [--agora 2026-10-14T21:48:00-03:00] [--podar]
  python3 aplicar.py feed.json -o novo.json --virada          (rodada da meia-noite; patch opcional)
  python3 aplicar.py feed.json -o novo.json                   (sem patch: só recalcula)
  python3 aplicar.py rascunho.json -o feed.json --podar --prev anterior.json   (rodada completa)

--prev X: feed que estava no ar (OBRIGATÓRIO na completa, que monta o feed do zero). Sem ele, a base é o próprio feed de entrada.
Coberturas (automático): pauta que sai do feed vai para "dormentes" (o id pode voltar com add_pauta e recupera o histórico);
título que muda entra em "titulos"; "inicio" fica gravado; ao_vivo sem novidade há 4 h volta para ativa; "taxonomia" é regravada;
cobertura sem fato novo há mais de 3 dias (pontual: 2) fica com prioridade 35 no máximo; cada breve ganha "hora" (quando entrou).
FIM (17/11): toda cobertura nova (add_pauta tipo cobertura) precisa de "fim" (o critério de encerramento); a pauta que já tinha
"fim" o mantém mesmo se a rodada não o reescrever. Cobertura "encerrada" no feed de entrada não recebe update_add nem volta
de dormentes: fato novo do tema abre cobertura nova (id e tema novos, com o seu próprio fim).

patch.json: lista de operações (ou {"ops": [...]}). Operações:
  {"op":"set","pid":ID,"path":"neutro.texto","value":...}        caminho com pontos; índices numéricos valem (visuais.0.titulo)
  {"op":"update_add","pid":ID,"hora":ISO|"21h48","texto":...,"titulo":"manchete nova","subtitulo":"opcional","mudanca":"texto opcional"}
      titulo é obrigatório: a manchete passa a dizer o fato mais novo ou mais importante. Só numa atualização
      de detalhe, que não muda a notícia, use "manter_titulo": true no lugar de "titulo".
  {"op":"add_pauta","pauta":{...},"mudanca":"texto opcional"}
  {"op":"remove_pauta","pid":ID}
  {"op":"agenda_set","itens":[...]} · {"op":"agenda_add","item":{data,hora,texto,secao,pid}}
  {"op":"agenda_remove","pid":ID,"data":"AAAA-MM-DD"} ou {"op":"agenda_remove","texto":"trecho"}
  {"op":"breve_add","breve":{titulo,fonte,url,secao}} · {"op":"breve_remove","url":...} ou {"titulo":"trecho"}
  {"op":"mudanca_add","pid":ID,"tipo":"nova"|"atualizada","texto":...}   acumula: mais nova primeiro, máx. 8, 1 por pauta
  {"op":"mudancas_reset"}                                         só na rodada completa (recomeça a lista)
  {"op":"correcao_add","pid":ID,"hora":...,"texto":...}           correcoes + atualizacoes + mudancas
  {"op":"enquete_add","pid":ID,"enquete":{pergunta,opcoes}}      só em pauta sem enquete
  {"op":"remove_enquete","pid":ID}
  {"op":"grafico_set","pid":ID,"grafico":{forma,titulo,fonte,...}}  põe/troca o gráfico da pauta (catálogo do manual 2g); null tira
  {"op":"glossario_add","termo":...,"texto":...} · {"op":"pessoa_add","nome":...,"texto":...}
  {"op":"pesquisa_add","data":...,"instituto":...,"flavio":N,"lula":N}
  {"op":"jogo_set","id":ID_DO_JOGO,"campos":{"estado":"ao_vivo","ga":1,"gb":0}}  placar/estado de um jogo pelo id
  {"op":"top","path":"nota","value":...}                         campos de topo (quiz, nota, explicadores.Tema, semana...)

Depois das operações calcula: atualizado_em, edicao, contagem, título das mudanças, estatisticas;
tira da agenda o que tem data passada; poda fontes/espectro sem uso (mantém as fixas); grava JSON minificado.
--podar (rodada completa): também tira termos do glossário e pessoas que não aparecem nos textos, e "semana" fora do domingo.
--virada: também tira breves de prazo/evento com data passada (ou com data de anteontem para trás) e lista as palavras de dia relativo que precisam ser reescritas.
Recusa (sai com 1, sem gravar) qualquer patch que mude pergunta ou opções de uma enquete existente.

Registro da rodada (18/11; manual 7):
  python3 aplicar.py --rodada rodadas.json '{"hora":"13h48","tipo":"rapida","status":"sem_mudancas","motivo":"sem_confirmacao","nota":"..."}'
  (o registro também pode ser um arquivo .json). Grava em rodadas.json (recomeça no dia novo). Recusa, sem gravar, registro
  fora do formato e rápida "sem_mudancas" sem "motivo" (nada_novo, ja_no_feed, sem_confirmacao, menor); "nada_novo" com o
  acionar de novidades.json (ao lado do rodadas.json) ligado também é recusado.
"""
import copy, json, os, re, sys, importlib.util
from collections import Counter
from datetime import datetime, date, timedelta

def carregar_validar():
    caminho = os.path.join(os.path.dirname(os.path.abspath(__file__)), "validar.py")
    if not os.path.exists(caminho):
        sys.exit("ERRO: validar.py precisa estar na mesma pasta do aplicar.py")
    spec = importlib.util.spec_from_file_location("validar_prumo", caminho)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m

V = carregar_validar()

FIXAS = {"cnn": ("CNN Brasil", "centro"), "p360": ("Poder360", "centro"), "met": ("Metrópoles", "centro"), "jp": ("Jovem Pan", "direita"),
         "ab": ("Agência Brasil", "publica"), "gp": ("Gazeta do Povo", "direita"), "cc": ("CartaCapital", "esquerda"),
         "cb": ("Correio Braziliense", "centro"), "sbt": ("SBT News", "centro"), "em": ("Estado de Minas", "centro"),
         "im": ("InfoMoney", "centro"), "ex": ("Exame", "centro"), "bbc": ("BBC News Brasil", "centro"), "dw": ("DW Brasil", "centro"),
         "lance": ("Lance!", "centro"), "espn": ("ESPN Brasil", "centro"), "ot": ("O Tempo", "centro"), "nexo": ("Nexo", "centro"),
         "r7": ("R7", "centro"), "zh": ("GZH", "centro"), "jc": ("Jornal do Commercio", "centro"),
         "agsenado": ("Agência Senado", "publica"), "agcamara": ("Agência Câmara", "publica")}

# espectro dos veículos: a mesma tabela do app (fonte/app/src/js/158-materia.js, aprovada pelo Pedro em 16/11).
# Veículo fora dela fica "nc" (não classificado): o app não mostra etiqueta, em vez de pôr todo mundo no "centro".
def _tabela_espectro():
    import re, unicodedata
    js = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonte", "app", "src", "js", "158-materia.js")
    try: t = open(js, encoding="utf-8").read()
    except OSError: return {}, {}
    veic = dict((k, e) for k, _n, e in re.findall(r'(\w+):\["([^"]+)","(esquerda|direita|centro|publica)"\]', t.split("const MT158_VEIC=", 1)[-1].split("};", 1)[0]))
    alias = dict(re.findall(r'(\w+):"(\w+)"', t.split("const MT158_ALIAS=", 1)[-1].split("};", 1)[0]))
    return veic, alias
_VEIC, _ALIAS = _tabela_espectro()
def _n(s):
    import re, unicodedata
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "", re.sub(r"\(.*?\)", " ", s))
def espectro_de(k, nome=""):
    if k in FIXAS: return FIXAS[k][1]
    for c in (_n(k), _n(nome)):
        c = _ALIAS.get(c, c)
        if c in _VEIC: return _VEIC[c]
    return "nc"

class Recusa(Exception): pass

IND_APL = None  # indicadores.json (main): congela as marcas de indicador no que vira histórico

def iso(t): return t.strftime("%Y-%m-%dT%H:%M:00-03:00")

def para_iso(h, agora):
    if not h: return iso(agora)
    h = str(h).strip()
    if V.ISO.match(h): return h
    m = re.match(r"^(\d{1,2})\s*[h:]\s*(\d{2})?$", h)
    if m: return iso(agora.replace(hour=int(m[1]), minute=int(m[2] or 0)))
    raise Recusa(f"hora inválida: {h} (use ISO com -03:00 ou 21h48)")

def caminho(path):
    return [int(k) if re.fullmatch(r"\d+", k) else k for k in str(path).split(".") if k != ""]

def set_path(obj, path, value):
    ks = caminho(path)
    if not ks: raise Recusa("path vazio")
    cur = obj
    for i, k in enumerate(ks[:-1]):
        nxt = ks[i + 1]
        if isinstance(cur, list):
            if not isinstance(k, int) or k >= len(cur): raise Recusa(f"índice {k} não existe em {path}")
            cur = cur[k]
        else:
            if cur.get(k) is None: cur[k] = [] if isinstance(nxt, int) else {}
            cur = cur[k]
    last = ks[-1]
    if isinstance(cur, list):
        if not isinstance(last, int): raise Recusa(f"{path}: esperava índice numérico")
        if last == len(cur): cur.append(value)
        elif last < len(cur): cur[last] = value
        else: raise Recusa(f"índice {last} não existe em {path}")
    else:
        cur[last] = value

class Feed:
    def __init__(self, f, agora):
        self.f, self.agora, self.log = f, agora, []
        # coberturas já encerradas no feed de entrada (17/11: depois do fim não recebem fato novo)
        self.encerradas = {p.get("id") for p in f.get("pautas") or [] if isinstance(p, dict) and p.get("status") == "encerrada"}
    def pauta(self, pid):
        for p in self.f.get("pautas") or []:
            if p.get("id") == pid: return p
        raise Recusa(f"pauta '{pid}' não existe no feed")
    def mudanca(self, pid, tipo, texto):
        if tipo not in ("nova", "atualizada"): raise Recusa(f"mudanca tipo deve ser nova ou atualizada (veio {tipo})")
        self.pauta(pid)
        m = self.f.setdefault("mudancas", {"titulo": "", "itens": []})
        itens = [it for it in m.get("itens") or [] if it.get("pid") != pid]
        m["itens"] = ([{"pid": pid, "tipo": tipo, "texto": texto}] + itens)[:8]
    def update(self, pid, hora, texto):
        p = self.pauta(pid)
        if not texto: raise Recusa("update_add sem texto")
        h = para_iso(hora, self.agora)
        ups = [u for u in p.get("atualizacoes") or [] if u.get("texto") != texto] + [{"hora": h, "texto": texto}]
        ups.sort(key=lambda u: str(u.get("hora", "")))
        p["atualizacoes"] = ups[-4:]
        if h > str(p.get("hora", "")): p["hora"] = h

    def aplicar(self, op):
        k = op.get("op")
        F = self.f
        if k == "set":
            p = self.pauta(op.get("pid"))
            ks = caminho(op.get("path"))
            if ks and ks[0] == "id": raise Recusa("não se muda o id de uma pauta (remova e crie outra)")
            if ks and ks[0] in ("titulos", "inicio", "ao_vivo_desde"): raise Recusa(f"{ks[0]} é automático (o aplicar.py grava quando o título muda)")
            if ks == ["subtema"] and op.get("value") not in V.TAXONOMIA.get(p.get("secao"), []): raise Recusa(f"subtema '{op.get('value')}' não existe em {p.get('secao')} ({', '.join(V.TAXONOMIA.get(p.get('secao'), []))})")
            if ks == ["status"] and op.get("value") not in V.STATUS: raise Recusa("status deve ser ativa, ao_vivo ou encerrada")
            if ks and ks[0] == "enquete" and p.get("enquete"): raise Recusa(f"[{p['id']}] enquete existente não pode ser editada (os votos são gravados pelo índice da opção); use remove_enquete")
            set_path(p, op.get("path"), op.get("value"))
        elif k == "update_add":
            if op.get("pid") in self.encerradas:
                raise Recusa(f"[{op.get('pid')}] cobertura encerrada (atingiu o fim): não recebe atualização. Fato novo do tema abre cobertura nova (add_pauta com id e tema novos e o seu \"fim\"; ex.: \"Implementação da escala 6x1\")")
            tit = op.get("titulo")
            if not (isinstance(tit, str) and tit.strip()) and op.get("manter_titulo") is not True:
                raise Recusa(f"[{op.get('pid')}] update_add sem 'titulo': quando a notícia ganha fato novo, a manchete passa a dizer o fato mais novo ou mais importante (use \"manter_titulo\": true só em atualização de detalhe)")
            self.update(op.get("pid"), op.get("hora"), op.get("texto"))
            p = self.pauta(op.get("pid"))
            if isinstance(tit, str) and tit.strip(): p.setdefault("neutro", {})["titulo"] = tit.strip()
            if isinstance(op.get("subtitulo"), str) and op["subtitulo"].strip(): p["subtitulo"] = op["subtitulo"].strip()
            if op.get("mudanca"): self.mudanca(op["pid"], "atualizada", op["mudanca"])
        elif k == "add_pauta":
            p = copy.deepcopy(op.get("pauta") or {})
            pid = p.get("id")
            if not pid: raise Recusa("add_pauta sem id")
            if any(x.get("id") == pid for x in F.get("pautas") or []): raise Recusa(f"pauta '{pid}' já existe: use set/update_add")
            if p.get("secao") not in V.SECOES: raise Recusa(f"add_pauta '{pid}' com secao inválida: {p.get('secao')}")
            p["hora"] = para_iso(p.get("hora"), self.agora)
            for c in ("atualizacoes", "correcoes", "visuais", "enquadramentos", "links", "fontes"): p.setdefault(c, [])
            for c in ("direita", "esquerda", "checagem", "enquete"): p.setdefault(c, None)
            for c in ("o_que_muda", "contexto", "proximo"): p.setdefault(c, "")
            p.setdefault("tipo", "cobertura"); p.setdefault("status", "ativa")
            sub = p.get("subtema")
            if not sub: raise Recusa(f"add_pauta '{pid}' sem subtema (de {p['secao']}: {', '.join(V.TAXONOMIA[p['secao']])})")
            if sub not in V.TAXONOMIA[p["secao"]]: raise Recusa(f"add_pauta '{pid}': subtema '{sub}' não existe em {p['secao']} ({', '.join(V.TAXONOMIA[p['secao']])})")
            dor = {d.get("id"): d for d in F.get("dormentes") or []}
            if pid in dor and dor[pid].get("status") == "encerrada":
                raise Recusa(f"add_pauta '{pid}': essa cobertura foi encerrada (atingiu o fim). Fato novo do tema abre cobertura nova, com id e tema novos e o seu \"fim\"")
            if pid in dor and not p.get("fim") and dor[pid].get("fim"): p["fim"] = dor[pid]["fim"]
            if p.get("tipo", "cobertura") == "cobertura" and not (isinstance(p.get("fim"), str) and p["fim"].strip()):
                raise Recusa(f"add_pauta '{pid}' sem \"fim\": toda cobertura nova diz quando termina (ex.: \"Aprovação e promulgação da PEC\"); pontual não precisa")
            if pid in dor:
                d = dor[pid]
                for c in ("inicio", "titulos"): 
                    if d.get(c) and not p.get(c): p[c] = d[c]
                F["dormentes"] = [x for x in F["dormentes"] if x.get("id") != pid]
                self.log.append("reativada")
            F.setdefault("pautas", []).append(p)
            if op.get("mudanca"): self.mudanca(pid, "nova", op["mudanca"])
        elif k == "remove_pauta":
            pid = op.get("pid"); self.pauta(pid)
            F["pautas"] = [p for p in F["pautas"] if p.get("id") != pid]
            m = F.get("mudancas") or {}
            m["itens"] = [it for it in m.get("itens") or [] if it.get("pid") != pid]
            for a in F.get("agenda") or []:
                if a.get("pid") == pid: a["pid"] = ""
        elif k == "agenda_set":
            F["agenda"] = list(op.get("itens") or [])
        elif k == "agenda_add":
            it = dict(op.get("item") or {kk: op[kk] for kk in ("data", "hora", "texto", "secao", "pid") if kk in op})
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(it.get("data", ""))) or not it.get("texto"): raise Recusa("agenda_add precisa de data AAAA-MM-DD e texto")
            it.setdefault("hora", ""); it.setdefault("pid", ""); it.setdefault("secao", "")
            ag = [a for a in F.get("agenda") or [] if not (a.get("data") == it["data"] and V.norm(a.get("texto")) == V.norm(it["texto"]))]
            F["agenda"] = ag + [it]
        elif k == "agenda_remove":
            ag = F.get("agenda") or []
            if op.get("texto"):
                fica = [a for a in ag if V.norm(op["texto"]) not in V.norm(a.get("texto"))]
            else:
                fica = [a for a in ag if not (a.get("pid") == op.get("pid") and (not op.get("data") or a.get("data") == op.get("data")))]
            if len(fica) == len(ag): raise Recusa(f"agenda_remove não achou nada: {op}")
            F["agenda"] = fica
        elif k == "breve_add":
            b = dict(op.get("breve") or {kk: op[kk] for kk in ("titulo", "fonte", "url", "secao", "urgente") if kk in op})
            if b.get("urgente") is True:
                ja = next((x for x in F.get("breves") or [] if x.get("url") == b.get("url") and x.get("urgente") is True and x.get("hora")), None)
                b["hora"] = ja["hora"] if ja and not b.get("hora") else para_iso(b.get("hora"), self.agora)
            else:
                b.pop("urgente", None)
                ja = next((x for x in F.get("breves") or [] if x.get("url") == b.get("url") and x.get("hora")), None)
                if not b.get("hora"): b["hora"] = ja["hora"] if ja else iso(self.agora)
            if not all(b.get(kk) for kk in ("titulo", "fonte", "url", "secao")): raise Recusa("breve_add precisa de titulo, fonte, url e secao")
            F["breves"] = [x for x in F.get("breves") or [] if x.get("url") != b["url"]] + [b]
        elif k == "breve_remove":
            br = F.get("breves") or []
            if op.get("url"): fica = [b for b in br if b.get("url") != op["url"]]
            else: fica = [b for b in br if V.norm(op.get("titulo")) not in V.norm(b.get("titulo"))]
            if len(fica) == len(br): raise Recusa(f"breve_remove não achou nada: {op}")
            F["breves"] = fica
        elif k == "mudanca_add":
            self.mudanca(op.get("pid"), op.get("tipo", "atualizada"), op.get("texto") or "")
        elif k == "mudancas_reset":
            F["mudancas"] = {"titulo": op.get("titulo") or "", "itens": []}
        elif k == "correcao_add":
            p = self.pauta(op.get("pid"))
            if not op.get("texto"): raise Recusa("correcao_add sem texto")
            h = para_iso(op.get("hora"), self.agora)
            p.setdefault("correcoes", [])
            if not p["correcoes"]: p["correcoes"] = []
            p["correcoes"].append({"hora": h, "texto": op["texto"]})
            self.update(p["id"], h, "Correção: " + op["texto"])
            self.mudanca(p["id"], "atualizada", "Correção: " + op["texto"])
        elif k == "enquete_add":
            p = self.pauta(op.get("pid"))
            if p.get("enquete"): raise Recusa(f"[{p['id']}] já tem enquete")
            e = op.get("enquete") or {}
            if not e.get("pergunta") or not 2 <= len(e.get("opcoes") or []) <= 3: raise Recusa("enquete precisa de pergunta e 2 ou 3 opções")
            p["enquete"] = {"pergunta": e["pergunta"], "opcoes": list(e["opcoes"])}
        elif k == "remove_enquete":
            p = self.pauta(op.get("pid")); p["enquete"] = None
        elif k == "grafico_set":
            p = self.pauta(op.get("pid")); g = op.get("grafico")
            vs = [v for v in (p.get("visuais") or []) if not (isinstance(v, dict) and v.get("tipo") == "grafico")]
            if g is not None:
                if not isinstance(g, dict) or g.get("forma") not in V.FORMAS: raise Recusa(f"grafico_set: forma deve ser uma de {', '.join(V.FORMAS)}")
                vs = [dict(g, tipo="grafico")] + vs
            p["visuais"] = vs
        elif k == "glossario_add":
            if not op.get("termo") or not op.get("texto"): raise Recusa("glossario_add precisa de termo e texto")
            F.setdefault("glossario", {})[op["termo"]] = op["texto"]
        elif k == "pessoa_add":
            if not op.get("nome") or not op.get("texto"): raise Recusa("pessoa_add precisa de nome e texto")
            F.setdefault("pessoas", {})[op["nome"]] = op["texto"]
        elif k == "pesquisa_add":
            if self.agora.date() > V.TURNO2: raise Recusa("pesquisas_2t está congelada depois de 25/10")
            x = {kk: op.get(kk) for kk in ("data", "instituto", "flavio", "lula")}
            if not all(x[kk] not in (None, "") for kk in x): raise Recusa("pesquisa_add precisa de data, instituto, flavio, lula")
            pq = F.setdefault("pesquisas_2t", [])
            if any(y.get("data") == x["data"] and y.get("instituto") == x["instituto"] for y in pq): raise Recusa(f"pesquisa já existe: {x['data']} {x['instituto']}")
            pq.append(x)
        elif k == "jogo_set":
            j = next((x for x in (F.get("esportes") or {}).get("jogos") or [] if isinstance(x, dict) and x.get("id") == op.get("id")), None)
            if not j: raise Recusa(f"jogo '{op.get('id')}' não existe em esportes.jogos")
            cs = op.get("campos")
            if not isinstance(cs, dict) or not cs: raise Recusa("jogo_set precisa de campos {...}")
            j.update(cs)
            if j.get("estado") == "ao_vivo": j["atualizado"] = iso(self.agora)
        elif k == "top":
            ks = caminho(op.get("path"))
            if not ks: raise Recusa("top sem path")
            if ks[0] in ("pautas",): raise Recusa("para pautas use set/add_pauta/remove_pauta")
            if ks[0] in ("atualizado_em", "edicao", "contagem", "estatisticas", "taxonomia", "dormentes"): raise Recusa(f"{ks[0]} é calculado pelo aplicar.py")
            if ks[0] == "pesquisas_2t" and self.agora.date() > V.TURNO2: raise Recusa("pesquisas_2t está congelada depois de 25/10")
            set_path(F, op.get("path"), op.get("value"))
        else:
            raise Recusa(f"operação desconhecida: {k}")
        self.log.append(k)

def titulo_mudancas(t, agora, virada, dia_anterior):
    base = str(t or "")
    if virada:
        if "(" in base: return base
        if base.startswith(V.TIT_MUD[1]): return f"O que mudou desde a noite de {V.dia_rotulo(dia_anterior - timedelta(days=1))}"
        return f"O que mudou desde a manhã de {V.dia_rotulo(dia_anterior)}"
    if base.startswith(V.TIT_MUD) and not (agora.hour >= 6 and "(" in base):
        return base
    m = agora.hour * 60 + agora.minute
    return V.TIT_MUD[1] if 6 * 60 + 30 <= m < 17 * 60 + 30 else V.TIT_MUD[0]

def datas_passadas(texto, hoje, como_data=False):
    """Datas explícitas no texto que já passaram (trechos, ou objetos date com como_data=True)."""
    out = []
    for m in re.finditer(r"\b(\d{1,2})/(\d{1,2})\b", texto):
        try:
            d = date(hoje.year, int(m[2]), int(m[1]))
            if d < hoje and (hoje - d).days < 180: out.append(d if como_data else m[0])
        except ValueError: pass
    for m in V.DIA_NUM.finditer(texto):
        dn = int(m[2] or m[4])
        cands = [hoje + timedelta(days=k) for k in range(-7, 8) if (hoje + timedelta(days=k)).day == dn and (hoje + timedelta(days=k)).weekday() == V.DIAS.index(m[1].lower())]
        if cands and cands[0] < hoje: out.append(cands[0] if como_data else m[0])
    return out

def ultima_de(p):
    hs = [str(p.get("hora") or "")] + [str(u.get("hora") or "") for u in p.get("atualizacoes") or []]
    return max(hs)

def resumo_curto(t, n=220):
    frases = re.split(r"(?<=[.!?])\s+", str(t or "").strip())
    out = ""
    for fr in frases[:2]:
        if len(out) + len(fr) + 1 > n and out: break
        out = (out + " " + fr).strip()
    if len(out) > n: out = out[:n].rsplit(" ", 1)[0].rstrip(",;:(") + "…"
    return out

PRIO_VELHA = 35  # prioridade máxima de cobertura que passou da validade (fica só por etapa/agenda próxima)

def coberturas(F, base, agora, virada=False):
    """Histórico de títulos, início, ao vivo vencido e dormentes. base = feed que estava no ar."""
    rel = []
    agora_iso = iso(agora)
    # marcas de indicador ({dolar}, 18/11): o que vira HISTÓRICO (títulos anteriores, dormentes) fica com o número de agora
    M = V.mapa_marcas(F, IND_APL)
    cg = lambda t: V.marca_texto(t, M) if isinstance(t, str) else t
    BP = {p.get("id"): p for p in base.get("pautas") or []}
    dor = {d.get("id"): d for d in (base.get("dormentes") or [])}
    for d in F.get("dormentes") or []: dor[d.get("id")] = d
    ids = set()
    for p in F.get("pautas") or []:
        pid = p.get("id"); ids.add(pid)
        bp = BP.get(pid) or dor.get(pid) or {}
        p.setdefault("tipo", "cobertura"); p.setdefault("status", "ativa")
        for c in ("inicio", "titulos"):
            if not p.get(c) and bp.get(c): p[c] = copy.deepcopy(bp[c])
        if "hashtags" not in p and isinstance(bp.get("hashtags"), list) and bp["hashtags"]: p["hashtags"] = list(bp["hashtags"])  # cobertura que continua mantém as hashtags
        if not p.get("fim") and isinstance(bp.get("fim"), str) and bp["fim"].strip(): p["fim"] = bp["fim"]  # e o fim (17/11)
        if not p.get("inicio"):
            hs = [str(p.get("hora") or "")] + [str(u.get("hora") or "") for u in p.get("atualizacoes") or []]
            hs = [h for h in hs if V.ISO.match(h)]
            p["inicio"] = min(hs) if hs else agora_iso
        novo = (p.get("neutro") or {}).get("titulo", "")
        velho = (bp.get("neutro") or {}).get("titulo") if "neutro" in bp else bp.get("titulo")
        hist = list(p.get("titulos") or [])
        if velho and novo and V.norm(velho) != V.norm(novo):
            if virada:
                if hist: hist[-1]["titulo"] = cg(novo)   # na virada só a referência de dia muda: não é manchete nova
            else:
                if not hist: hist = [{"hora": str(bp.get("inicio") or p["inicio"]), "titulo": cg(velho)}]
                if V.norm(hist[-1].get("titulo")) != V.norm(cg(novo)): hist.append({"hora": agora_iso, "titulo": cg(novo)})
                rel.append(f"[{pid}] título mudou: entrou no histórico ({len(hist)})")
        if len(hist) > 6: hist = hist[:1] + hist[-5:]
        if hist: p["titulos"] = hist
        else: p.pop("titulos", None)
        if p.get("status") == "ao_vivo":
            if bp.get("status") != "ao_vivo" or not p.get("ao_vivo_desde"): p["ao_vivo_desde"] = bp.get("ao_vivo_desde") if bp.get("status") == "ao_vivo" and bp.get("ao_vivo_desde") else agora_iso
            u = V.dt(max(ultima_de(p), str(p["ao_vivo_desde"])))
            if u and (agora - u).total_seconds() > 4 * 3600:
                p["status"] = "ativa"; p.pop("ao_vivo_desde", None); p.pop("essencial", None); rel.append(f"[{pid}] ao_vivo sem novidade há 4 h: voltou para ativa")
        else: p.pop("ao_vivo_desde", None)
        # VALIDADE (manual 3b): cobertura sem fato novo há mais de 3 dias só fica por etapa/agenda próxima, e aí com
        # prioridade baixa (16/11: Huang/Nvidia, de quinta, abria Economia na Capa de segunda com prioridade 53)
        if p.get("status") != "ao_vivo" and isinstance(p.get("prioridade"), (int, float)) and p["prioridade"] > PRIO_VELHA:
            hs = [V.dt(u.get("hora")) for u in p.get("atualizacoes") or [] if isinstance(u, dict)] + [V.dt(p.get("hora")), V.dt(p.get("inicio"))]
            hs = [h for h in hs if h]
            lim = 2 if p.get("tipo") == "pontual" else 3
            if hs and (agora - max(hs)).total_seconds() > lim * 86400:
                rel.append(f"[{pid}] sem fato novo há {(agora - max(hs)).days} dias: prioridade {p['prioridade']} → {PRIO_VELHA}")
                p["prioridade"] = PRIO_VELHA
    # hora em que cada breve entrou (o app mostra na lista "Outras notícias"; o validar.py acha as breves do dia)
    if not virada:
        # breve que já estava no ar sem hora (antes de 16/11): fica com a hora daquela edição, não com a desta rodada
        ed = str(base.get("atualizado_em") or "") if V.ISO.match(str(base.get("atualizado_em") or "")) else ""
        hb = {b.get("url"): b.get("hora") or ed for b in base.get("breves") or [] if isinstance(b, dict)}
        for b in F.get("breves") or []:
            if isinstance(b, dict) and not b.get("hora"):
                b["hora"] = hb.get(b.get("url")) or agora_iso
    for pid, bp in BP.items():
        if pid in ids: continue
        dor[pid] = {"id": pid, "secao": bp.get("secao"), "subtema": bp.get("subtema") or "", "tema": bp.get("tema") or "",
                    "tag": bp.get("tag") or "", "titulo": cg((bp.get("neutro") or {}).get("titulo", "")),
                    "resumo": resumo_curto(cg((bp.get("neutro") or {}).get("texto"))), "inicio": bp.get("inicio") or str(bp.get("hora") or ""),
                    "ultima": ultima_de(bp), "status": bp.get("status") or "ativa"}
        if bp.get("titulos"): dor[pid]["titulos"] = bp["titulos"]
        if isinstance(bp.get("hashtags"), list) and bp["hashtags"]: dor[pid]["hashtags"] = list(bp["hashtags"])
        if isinstance(bp.get("fim"), str) and bp["fim"].strip(): dor[pid]["fim"] = bp["fim"]
        rel.append(f"[{pid}] saiu do feed: guardada em dormentes")
    limite = (agora - timedelta(days=V.DIAS_DORMENTE)).strftime("%Y-%m-%dT%H:%M")
    fica = [d for pid, d in dor.items() if pid not in ids and str(d.get("ultima", ""))[:16] >= limite]
    fica.sort(key=lambda d: str(d.get("ultima", "")), reverse=True)
    if len(fica) < len([1 for pid in dor if pid not in ids]): rel.append("dormentes com mais de 30 dias removidas")
    F["dormentes"] = fica[:V.MAX_DORMENTES]
    F["taxonomia"] = V.TAXONOMIA
    cp = F.get("capa")
    if isinstance(cp, dict):
        if cp.get("manchete") and cp["manchete"] not in ids:
            rel.append(f"capa: a manchete '{cp['manchete']}' saiu do feed; o app usa a de maior prioridade até a rodada escolher outra")
            cp.pop("manchete", None); cp.pop("linha_fina", None)
        ds0 = cp.get("destaques") if isinstance(cp.get("destaques"), list) else []
        ds = [d for d in ds0 if d in ids and d != cp.get("manchete")]
        if any(d not in ids for d in ds0): rel.append("capa: destaques que saíram do feed foram tirados")
        if cp.get("manchete") in ds0: rel.append("capa: destaque igual à manchete foi tirado")
        cp["destaques"] = ds
    return rel

AUTO_IND = {"dolar", "ibovespa"}  # gravados por tools/indicadores.py a cada pregão


def reserva_indicadores(F, IND):
    """20/11 (corretor): o "indicadores" do feed é a reserva do app quando o indicadores.json ainda não chegou (ou não
    chega, sem rede). Estava parado em 22/10 e quem ia direto ao Feed via "Dólar fecha a R$ 5,02". Agora cada rodada
    copia para a reserva os valores de indicadores.json que forem mais novos (sem a série longa, que o app pega de lá)."""
    if not IND or not isinstance(F.get("indicadores"), dict) or not isinstance(F["indicadores"].get("itens"), list): return 0
    n = 0
    for i, x in enumerate(F["indicadores"]["itens"]):
        if not isinstance(x, dict): continue
        y = IND.get(x.get("id"))
        # corretor 21/11: dólar e Ibovespa são do robô de cotações (indicadores.json manda sempre): um "fechamento" que a
        # rodada gravou à mão num feriado (R$ 5,95 em 20/11, sem pregão) tinha data mais nova e nunca era trocado
        auto = x.get("id") in AUTO_IND
        if not isinstance(y, dict) or not y.get("valor") or (not auto and str(y.get("data") or "") < str(x.get("data") or "")): continue
        novo = dict(x)
        for k in ("valor", "variacao", "dir", "data"):
            if k in y: novo[k] = y[k]
        if isinstance(y.get("serie"), list) and y["serie"]: novo["serie"] = y["serie"][-8:]
        if novo != x: F["indicadores"]["itens"][i] = novo; n += 1
    return n


def mecanicos(F, agora, podar, virada, dia_anterior):
    hoje = agora.date()
    reserva_indicadores(F, IND_APL)
    F["atualizado_em"] = iso(agora)
    F["edicao"] = V.edicao_de(agora)
    F["contagem"] = V.contagem_de(hoje)
    if isinstance(F.get("secoes"), list):
        F["secoes"] = sorted([x for x in F["secoes"] if isinstance(x, dict)], key=lambda x: V.SECOES.index(x.get("id")) if x.get("id") in V.SECOES else 99)
    ids = {p.get("id") for p in F.get("pautas") or []}
    m = F.setdefault("mudancas", {"titulo": "", "itens": []})
    m["itens"] = [it for it in m.get("itens") or [] if it.get("pid") in ids][:8]
    rd = F.get("resumo_dia")
    if isinstance(rd, dict) and isinstance(rd.get("itens"), list):
        rd["itens"] = [it for it in rd["itens"] if isinstance(it, dict) and (not it.get("pid") or it.get("pid") in ids)]
    m["titulo"] = titulo_mudancas(m.get("titulo"), agora, virada, dia_anterior)
    rel = []
    ag = F.get("agenda") or []
    fora = [a for a in ag if str(a.get("data", "")) < hoje.isoformat()]
    F["agenda"] = sorted([a for a in ag if a not in fora], key=lambda a: (str(a.get("data")), V.hora_agenda(a.get("hora")) or (99, 0)))
    for a in fora: rel.append(f"agenda removida (data passada): {a.get('data')} {a.get('texto', '')[:60]}")
    for b in F.get("breves") or []:
        if b.get("urgente"):
            hb = V.dt(b.get("hora"))
            if not hb or (agora - hb).total_seconds() > 3 * 3600:
                b.pop("urgente", None); rel.append(f"breve deixou de ser urgente (3 h): {b.get('titulo', '')[:50]}")
    es = F.get("esportes")
    if isinstance(es, dict) and isinstance(es.get("jogos"), list):
        lim_a, lim_b = (hoje - timedelta(days=12)).isoformat(), (hoje + timedelta(days=14)).isoformat()
        js = [j for j in es["jogos"] if lim_a <= str(j.get("data", "")) <= lim_b]
        if len(js) != len(es["jogos"]): rel.append(f"esportes: {len(es['jogos']) - len(js)} jogos fora da janela de 12 dias atrás a 14 à frente removidos")
        es["jogos"] = sorted(js, key=lambda j: (str(j.get("data")), V.hora_agenda(j.get("hora")) or (99, 0)))
        for j in es["jogos"]:
            if j.get("pid") and j["pid"] not in ids: j.pop("pid")
    if isinstance(F.get("calendario"), list):
        cal = [c for c in F["calendario"] if isinstance(c, dict)]
        fica_c = [c for c in cal if str(c.get("ate") or c.get("data") or "") >= hoje.isoformat()]
        if len(fica_c) != len(cal): rel.append(f"calendario: {len(cal) - len(fica_c)} itens vencidos removidos")
        F["calendario"] = sorted(fica_c, key=lambda c: str(c.get("data")))
    for a in F["agenda"]:
        if a.get("pid") and a["pid"] not in ids: a["pid"] = ""
    if virada:
        fica = []
        for b in F.get("breves") or []:
            dp = datas_passadas(b.get("titulo", ""), hoje)
            prazo = re.search(r"prazo|termina|acaba|encerra|vence|último dia|começa|acontece|será|vai |marcad|previst|agendad|até ", b.get("titulo", ""), re.I)
            velha = any(d < hoje - timedelta(days=1) for d in datas_passadas(b.get("titulo", ""), hoje, como_data=True))
            if dp and (prazo or velha): rel.append(f"breve removida (cita {', '.join(dp)}): {b.get('titulo', '')[:60]}")
            else: fica.append(b)
        F["breves"] = fica
    if virada or podar:
        # 20/11: breve sem data no título ficava para sempre (no dia 20 ainda havia breves do dia 18, e elas contavam como
        # "breves no ar", então a rápida repunha menos). Breve que entrou anteontem ou antes sai.
        fica = []
        for b in F.get("breves") or []:
            try: hb = datetime.fromisoformat(str(b.get("hora")))
            except Exception: hb = None
            if hb and not b.get("urgente") and hb.date() < hoje - timedelta(days=1):
                rel.append(f"breve antiga removida (entrou {hb:%d/%m}): {b.get('titulo', '')[:60]}")
            else: fica.append(b)
        F["breves"] = fica
    if podar:
        todo = V.texto_marcavel(F)
        for campo in ("glossario", "pessoas"):
            d = F.get(campo) or {}
            sai = [k for k in d if k not in todo]
            for k in sai: del d[k]
            if sai: rel.append(f"{campo}: removidos {len(sai)} sem uso ({', '.join(sai[:8])}{'…' if len(sai) > 8 else ''})")
        if F.get("semana") and hoje.weekday() != 6:
            del F["semana"]; rel.append("semana removida (só no domingo)")
    # fontes e espectro
    usadas = V.fontes_usadas(F)
    fontes = F.setdefault("fontes", {}); esp = F.setdefault("espectro", {})
    for k in usadas:
        if k not in fontes: fontes[k] = FIXAS.get(k, (k, "centro"))[0]
        if k not in esp or (esp[k] == "centro" and k not in FIXAS and espectro_de(k, fontes.get(k)) != "centro"): esp[k] = espectro_de(k, fontes.get(k))
    sai = [k for k in list(fontes) if k not in usadas and k not in V.REGUA]
    for k in sai: fontes.pop(k, None)
    for k in list(esp):
        if k not in fontes: esp.pop(k)
    for k in V.REGUA:
        if k not in fontes: fontes[k] = FIXAS[k][0]
        if k not in esp: esp[k] = FIXAS[k][1]
    if sai: rel.append(f"fontes podadas: {len(sai)}")
    # estatísticas
    ps = F.get("pautas") or []
    c = Counter(x for p in ps for x in set(p.get("fontes") or []))
    F["estatisticas"] = {"divergencias": sum(1 for p in ps if (p.get("checagem") or {}).get("status") == "divergencia"),
                         "veiculos": [{"fonte": k, "n": n} for k, n in c.most_common(5)]}
    return rel

def registrar(argv, agora):
    """--rodada rodadas.json REGISTRO: confere e grava o registro da rodada."""
    if len(argv) < 2: print(__doc__); return 2
    caminho, bruto = argv[0], argv[1]
    try: reg = json.load(open(bruto, encoding="utf-8")) if os.path.isfile(bruto) else json.loads(bruto)
    except Exception as e: print(f"ERRO: registro não é JSON: {e}. Nada foi gravado."); return 1
    if agora is None: agora = datetime.now(V.SP)
    if agora.tzinfo is None: agora = agora.replace(tzinfo=V.SP)
    agora = agora.astimezone(V.SP)
    hora = str(reg.pop("hora", "") or agora.strftime("%Hh%M")) if isinstance(reg, dict) else ""
    nov = None
    try: nov = json.load(open(os.path.join(os.path.dirname(os.path.abspath(caminho)), "novidades.json"), encoding="utf-8"))
    except Exception: pass
    errs = V.checar_registro(reg, nov, agora)
    if not re.match(r"^\d\dh\d\d$", hora): errs.append(f"hora {hora!r}: use HHhMM (a hora de início da rodada)")
    if errs:
        for e in errs: print("ERRO:", e)
        print("Nada foi gravado."); return 1
    try: R = json.load(open(caminho, encoding="utf-8"))
    except Exception: R = {}
    hoje = agora.date().isoformat()
    if not isinstance(R, dict) or R.get("dia") != hoje or not isinstance(R.get("itens"), dict): R = {"dia": hoje, "itens": {}}
    R["itens"][hora] = reg
    with open(caminho, "w", encoding="utf-8") as fh: json.dump(R, fh, ensure_ascii=False, indent=1); fh.write("\n")
    print(f"OK: rodada {hora} registrada em {caminho} ({reg.get('tipo')}, {reg.get('status')}" + (f", motivo {reg['motivo']}" if reg.get("motivo") else "") + ")")
    return 0


def main(argv):
    if "--rodada" in argv:
        i = argv.index("--rodada"); resto = argv[:i] + argv[i + 1:]
        ag = None
        if "--agora" in resto:
            j = resto.index("--agora"); ag = datetime.fromisoformat(resto[j + 1]); resto = resto[:j] + resto[j + 2:]
        return registrar(resto, ag)
    args, out, agora, podar, virada, prev = [], None, None, False, False, None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "-o": out = argv[i + 1]; i += 2; continue
        if a == "--agora": agora = datetime.fromisoformat(argv[i + 1]); i += 2; continue
        if a == "--prev": prev = argv[i + 1]; i += 2; continue
        if a == "--podar": podar = True
        elif a == "--virada": virada = True
        elif a in ("-h", "--help"): print(__doc__); return 0
        else: args.append(a)
        i += 1
    if not args or not out: print(__doc__); return 2
    if podar and not prev:
        print("ERRO: --podar (rodada completa) exige --prev anterior.json: sem ele as coberturas perdem histórico, início e dormentes. Nada foi gravado."); return 1
    F = json.load(open(args[0], encoding="utf-8"))
    original = copy.deepcopy(F)
    ops = []
    if len(args) > 1:
        pj = json.load(open(args[1], encoding="utf-8"))
        ops = pj.get("ops", []) if isinstance(pj, dict) else pj
    if agora is None: agora = datetime.now(V.SP)
    if agora.tzinfo is None: agora = agora.replace(tzinfo=V.SP)
    agora = agora.astimezone(V.SP).replace(second=0, microsecond=0)
    ant_ref = V.dt(original.get("atualizado_em")) or agora
    dia_anterior = ant_ref.date() if ant_ref.date() < agora.date() else agora.date() - timedelta(days=1)
    fd = Feed(F, agora)
    for n, op in enumerate(ops, 1):
        try: fd.aplicar(op)
        except Recusa as e:
            print(f"ERRO: operação {n} ({op.get('op')}) recusada: {e}. Nada foi gravado."); return 1
        except Exception as e:
            print(f"ERRO: operação {n} ({op.get('op')}) falhou: {e!r}. Nada foi gravado."); return 1
    # enquetes existentes não mudam
    antes = {p.get("id"): p.get("enquete") for p in original.get("pautas") or [] if p.get("enquete")}
    for p in F.get("pautas") or []:
        a, e = antes.get(p.get("id")), p.get("enquete")
        if a and e and (a.get("pergunta") != e.get("pergunta") or a.get("opcoes") != e.get("opcoes")):
            print(f"ERRO: [{p.get('id')}] o patch muda a enquete existente (pergunta/opções). Os votos são gravados pelo índice da opção: "
                  f"não edite; para tirar, use remove_enquete. Nada foi gravado."); return 1
    base = json.load(open(prev, encoding="utf-8")) if prev else original
    if prev:
        AP = {p.get("id"): p.get("enquete") for p in base.get("pautas") or [] if p.get("enquete")}
        for p in F.get("pautas") or []:
            a0, e = AP.get(p.get("id")), p.get("enquete")
            if a0 and e and (a0.get("pergunta") != e.get("pergunta") or a0.get("opcoes") != e.get("opcoes")):
                print(f"ERRO: [{p.get('id')}] a enquete mudou em relação ao feed no ar: copie a anterior byte a byte ou deixe sem. Nada foi gravado."); return 1
    global IND_APL
    IND_APL = V.ler_indicadores(os.path.join(os.path.dirname(os.path.abspath(args[0])), "indicadores.json"))
    rel = coberturas(F, base, agora, virada) + mecanicos(F, agora, podar, virada, dia_anterior)
    txt = json.dumps(F, ensure_ascii=False, separators=(",", ":"))
    with open(out, "w", encoding="utf-8") as fh: fh.write(txt)
    print(f"OK: {len(ops)} operações ({', '.join(f'{k}×{n}' for k, n in Counter(fd.log).items()) or 'nenhuma'}) → {out}")
    print(f"atualizado_em {F['atualizado_em']} · edicao '{F['edicao']}' · contagem '{F['contagem']}' · mudanças '{F['mudancas']['titulo']}' ({len(F['mudancas']['itens'])})")
    print(f"tamanho {len(txt.encode()):,} bytes ({len(txt.encode()) // 1024} KB)".replace(",", "."))
    for r in rel: print("·", r)
    if virada:
        lst = V.relativas(F)
        print()
        print(f"VIRADA: {len(lst)} trechos com dia relativo escritos em {V.dia_rotulo(dia_anterior)}. Reescreva com 'set' (títulos, breves, agenda e mudanças são obrigatórios;")
        print("enquete não se edita: retire com remove_enquete). Sugestão de troca entre colchetes:")
        for loc, tipo, trecho, palavra, classe in lst:
            dica = "retire com remove_enquete" if tipo == "enquete" else V.sugestao(palavra, dia_anterior)
            print(f"  {loc} ({tipo}): '{palavra}' → [{dica}] …{trecho}…")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
