#!/usr/bin/env python3
"""Conferência offline do que os robôs gravaram no repositório do Prumo News (sem rede, só biblioteca padrão).

  python3 -I tools/checar_consistencia.py [PASTA_DO_REPO] [--json] [--max-atraso-leve MIN]

Confere, na cópia do repositório (padrão: a pasta acima de tools/):
- feed-leve.json: versão = SHA-1 do feed.json atual; o detalhe apontado existe; leve + detalhe refazem o feed.json;
  feed-det/indice.json só lista arquivos que existem, começa pela versão do leve e não sobra arquivo fora dele.
  Leve atrasado há menos de --max-atraso-leve minutos (padrão 75: o robô "Feed leve" tem a rede de segurança
  de hora em hora) é só aviso; mais que isso (ou sem git para medir), erro.
- fotos-arquivo.json: todo "local" existe em acervo/ (e não sai da pasta); foto em acervo/ sem uso é aviso.
- series/: index.json bate com cada arquivo (de, até, n); datas em ordem, sem repetição, no formato da frequência;
  mês faltando na série mensal é erro; buraco de mais de 7 dias na diária é aviso.
- oficiais.json: cada "placar" passa nas mesmas regras do app (fonte/app/src/js/118-placar-oficial.js, po118Limpa);
  pid das votações e chaves de para_pautas existem no feed.json; ids sem repetição.
- m/: toda pauta do feed tem a página de compartilhamento.
- rodadas.json: formato do registro e rodadas com status "falhou".
Sai com 0 (nenhum erro), 1 (há erro) ou 2 (pasta ou feed.json ilegível).
"""
import hashlib, importlib.util, json, math, os, re, subprocess, sys
from datetime import date, datetime, timedelta

AQUI = os.path.dirname(os.path.abspath(__file__))
CASAS = {"camara": 513, "senado": 81}
URL_LEG = re.compile(r"^https://[\w.-]+\.leg\.br/")
DATA_ISO = re.compile(r"^\d{4}-\d\d-\d\d(?:T\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)?)?$")
STATUS_RODADA = {"ok", "sem_mudancas", "falhou", "pulada"}


def _feed_leve():
    spec = importlib.util.spec_from_file_location("feed_leve_chk", os.path.join(AQUI, "feed_leve.py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


class Relatorio:
    def __init__(self):
        self.erros, self.avisos, self.ok = [], [], []

    def erro(self, area, msg): self.erros.append(f"[{area}] {msg}")
    def aviso(self, area, msg): self.avisos.append(f"[{area}] {msg}")
    def bom(self, area, msg): self.ok.append(f"[{area}] {msg}")


def ler_json(caminho):
    with open(caminho, "rb") as fh: return json.loads(fh.read().decode("utf-8"))


def quando_ok(s):
    """Mesma ideia do Date.parse do app: data ISO, com ou sem hora e fuso."""
    s = str(s or "")
    if not DATA_ISO.match(s): return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None


def idade_feed_min(repo):
    """Minutos entre o último commit que mudou feed.json e o HEAD (None sem git)."""
    try:
        t = lambda *a: subprocess.run(["git", "-C", repo, "log", "-1", "--format=%ct", *a], capture_output=True, text=True, timeout=20).stdout.strip()
        f, h = t("--", "feed.json"), t()
        return (int(h) - int(f)) / 60 if f and h else None
    except Exception:
        return None


# ---------- feed leve ----------
def checar_leve(repo, dados, feed, R, max_atraso):
    A = "feed-leve"
    cam = os.path.join(repo, "feed-leve.json")
    if not os.path.exists(cam):
        R.aviso(A, "feed-leve.json não existe (o app abre pelo feed.json)"); return
    try: leve = ler_json(cam)
    except (OSError, ValueError) as e: R.erro(A, f"feed-leve.json ilegível: {e}"); return
    meta = leve.get("_leve") if isinstance(leve, dict) else None
    if not isinstance(meta, dict) or not meta.get("v"): R.erro(A, "feed-leve.json sem cabeçalho _leve.v"); return
    v, sha = meta["v"], hashlib.sha1(dados).hexdigest()[:12]
    det_rel = meta.get("det") or ""
    if det_rel != f"feed-det/{v}.json": R.erro(A, f"_leve.det ({det_rel}) não é feed-det/{v}.json")
    det_cam = os.path.join(repo, "feed-det", f"{v}.json")
    det = None
    if not os.path.exists(det_cam): R.erro(A, f"o leve aponta para feed-det/{v}.json, que não existe")
    else:
        try: det = ler_json(det_cam)
        except (OSError, ValueError) as e: R.erro(A, f"feed-det/{v}.json ilegível: {e}")
    if v != sha:
        idade = idade_feed_min(repo)
        txt = f"leve na versão {v}, feed.json atual é {sha}"
        if idade is not None and idade < max_atraso: R.aviso(A, f"{txt} (feed mudou há {idade:.0f} min; o robô refaz)")
        else: R.erro(A, f"{txt}" + (f" há {idade:.0f} min" if idade is not None else " (sem git para medir há quanto tempo)"))
    elif det is not None:
        try:
            igual = _feed_leve().juntar(leve, det) == feed
        except Exception as e:
            igual = False; R.erro(A, f"leve + detalhe não se juntam: {e}")
        else:
            if igual: R.bom(A, f"versão {v} = feed.json; leve + detalhe refazem o feed")
            else: R.erro(A, "leve + detalhe não refazem o feed.json")
    pasta = os.path.join(repo, "feed-det")
    try: ind = ler_json(os.path.join(pasta, "indice.json")).get("versoes")
    except (OSError, ValueError, AttributeError): ind = None
    if not isinstance(ind, list): R.erro(A, "feed-det/indice.json ausente ou sem 'versoes'"); return
    if not ind or ind[0] != v: R.erro(A, f"indice.json não começa pela versão do leve ({v}): {ind[:3]}")
    if len(set(ind)) != len(ind): R.erro(A, "indice.json com versão repetida")
    for x in ind:
        if not os.path.exists(os.path.join(pasta, f"{x}.json")): R.erro(A, f"indice.json lista {x}, mas feed-det/{x}.json não existe")
    sobra = sorted(n for n in os.listdir(pasta) if n.endswith(".json") and n != "indice.json" and n[:-5] not in ind)
    if sobra: R.aviso(A, f"arquivos em feed-det/ fora do índice: {sobra[:5]}")


# ---------- fotos ----------
def checar_fotos(repo, R):
    A = "fotos"
    cam = os.path.join(repo, "fotos-arquivo.json")
    if not os.path.exists(cam): R.aviso(A, "fotos-arquivo.json não existe"); return
    try: F = ler_json(cam)
    except (OSError, ValueError) as e: R.erro(A, f"fotos-arquivo.json ilegível: {e}"); return
    locs = []

    def andar(o):
        if isinstance(o, dict):
            if isinstance(o.get("local"), str): locs.append(o["local"])
            for x in o.values(): andar(x)
        elif isinstance(o, list):
            for x in o: andar(x)
    andar({k: v for k, v in F.items() if k != "acervo"} if isinstance(F, dict) else F)
    base = os.path.realpath(os.path.join(repo, "acervo"))
    faltam, fora = [], []
    for l in sorted(set(locs)):
        real = os.path.realpath(os.path.join(repo, l))
        if not (real == base or real.startswith(base + os.sep)): fora.append(l); continue
        if not os.path.isfile(real): faltam.append(l)
    if fora: R.erro(A, f"{len(fora)} 'local' fora de acervo/: {fora[:3]}")
    if faltam: R.erro(A, f"{len(faltam)} 'local' sem arquivo em acervo/: {faltam[:3]}")
    arquivos = set()
    if os.path.isdir(base):
        for raiz, _, nomes in os.walk(base):
            for n in nomes: arquivos.add(os.path.relpath(os.path.join(raiz, n), repo).replace(os.sep, "/"))
    orf = sorted(arquivos - set(locs))
    if orf: R.aviso(A, f"{len(orf)} fotos em acervo/ que nenhuma entrada usa: {orf[:3]}")
    info = F.get("acervo") if isinstance(F, dict) else None
    if isinstance(info, dict) and isinstance(info.get("no_repositorio"), int) and info["no_repositorio"] != len(set(locs)):
        R.aviso(A, f"acervo.no_repositorio = {info['no_repositorio']}, mas há {len(set(locs))} 'local' diferentes")
    if not fora and not faltam: R.bom(A, f"{len(set(locs))} fotos locais, todas presentes ({len(arquivos)} arquivos em acervo/)")


# ---------- séries ----------
def meses_entre(a, b):
    ya, ma = map(int, a.split("-")); yb, mb = map(int, b.split("-"))
    return (yb - ya) * 12 + (mb - ma)


def checar_series(repo, R):
    A = "series"
    pasta = os.path.join(repo, "series")
    if not os.path.isdir(pasta): R.aviso(A, "pasta series/ não existe"); return
    try: idx = ler_json(os.path.join(pasta, "index.json")).get("series")
    except (OSError, ValueError, AttributeError): idx = None
    if not isinstance(idx, list): R.erro(A, "series/index.json ausente ou sem 'series'"); return
    ids = [s.get("id") for s in idx if isinstance(s, dict)]
    if len(set(ids)) != len(ids): R.erro(A, "index.json com id repetido")
    arquivos = {n[:-5] for n in os.listdir(pasta) if n.endswith(".json") and n != "index.json"}
    for x in sorted(arquivos - set(ids)): R.aviso(A, f"series/{x}.json não está no index.json")
    boas = 0
    for s in idx:
        if not isinstance(s, dict): continue
        sid = s.get("id")
        try: d = ler_json(os.path.join(pasta, f"{sid}.json"))
        except (OSError, ValueError): R.erro(A, f"index.json lista {sid}, mas series/{sid}.json não existe ou é ilegível"); continue
        pts = d.get("pontos")
        if not isinstance(pts, list) or not pts: R.erro(A, f"{sid}: sem pontos"); continue
        freq = d.get("freq") or s.get("freq")
        fmt = re.compile(r"^\d{4}-\d\d$") if freq == "mensal" else re.compile(r"^\d{4}-\d\d-\d\d$")
        ruins = [p for p in pts if not (isinstance(p, list) and len(p) == 2 and isinstance(p[0], str) and fmt.match(p[0])
                                         and isinstance(p[1], (int, float)) and not isinstance(p[1], bool) and math.isfinite(p[1]))]
        if ruins: R.erro(A, f"{sid}: {len(ruins)} pontos fora do formato ({freq}): {ruins[:2]}"); continue
        datas = [p[0] for p in pts]
        rep = sorted({x for x in datas if datas.count(x) > 1})
        if rep: R.erro(A, f"{sid}: datas repetidas {rep[:3]}")
        if datas != sorted(datas): R.erro(A, f"{sid}: datas fora de ordem")
        erro_aqui = bool(rep) or datas != sorted(datas)
        if freq == "mensal":
            buracos = [(a, b) for a, b in zip(datas, datas[1:]) if meses_entre(a, b) > 1]
            if buracos: R.erro(A, f"{sid}: {len(buracos)} meses faltando, ex. entre {buracos[0][0]} e {buracos[0][1]}"); erro_aqui = True
        else:
            try:
                ds = [date.fromisoformat(x) for x in datas]
                gr = [(a, b) for a, b in zip(ds, ds[1:]) if (b - a).days > 7]
                if gr: R.aviso(A, f"{sid}: {len(gr)} buracos de mais de 7 dias, ex. {gr[-1][0]} → {gr[-1][1]}")
            except ValueError as e:
                R.erro(A, f"{sid}: data inválida ({e})"); erro_aqui = True
        for k, real in (("de", datas[0]), ("ate", datas[-1]), ("n", len(pts))):
            if s.get(k) != real: R.erro(A, f"{sid}: index.json diz {k}={s.get(k)!r}, o arquivo tem {real!r}"); erro_aqui = True
        if not erro_aqui: boas += 1
    R.bom(A, f"{boas}/{len(idx)} séries sem problema")


# ---------- oficiais / placar ----------
def placar_valido(e):
    """Regras de po118Limpa (app). Devolve (ok, motivo)."""
    pl = e.get("placar")
    if not isinstance(pl, dict): return False, "placar não é objeto"
    if pl.get("forma") != "placar_votacao": return False, "forma diferente de placar_votacao"
    tot = CASAS.get(pl.get("casa"))
    if not tot: return False, f"casa {pl.get('casa')!r}"
    if not quando_ok(pl.get("quando") or e.get("quando")): return False, f"quando ilegível {pl.get('quando')!r}"
    modo = pl.get("modo")
    if modo not in ("nominal", "simbolica", "sem_placar"): return False, f"modo {modo!r}"
    res = pl.get("resultado") if pl.get("resultado") in ("aprovado", "rejeitado") else None
    inteiro = lambda x: isinstance(x, int) and not isinstance(x, bool) and x >= 0
    if modo == "nominal":
        if not (inteiro(pl.get("sim")) and inteiro(pl.get("nao"))): return False, "nominal sem sim/nao inteiros"
        ab = pl.get("abst") if inteiro(pl.get("abst")) else 0
        if pl["sim"] + pl["nao"] + ab > tot: return False, f"{pl['sim']}+{pl['nao']}+{ab} > {tot} cadeiras"
        its = pl.get("itens")
        if not (isinstance(its, list) and len(its) >= 2 and its[0].get("valor") == pl["sim"] and its[1].get("valor") == pl["nao"]):
            return False, "itens não batem com sim/nao"
    elif not res:
        return False, f"modo {modo} sem resultado"
    if pl.get("turno") not in (None, "", "1º", "2º"): return False, f"turno {pl.get('turno')!r} (o app só aceita 1º/2º)"
    m = pl.get("minimo")
    if m is not None and not (isinstance(m, int) and 0 < m <= tot): return False, f"minimo {m!r}"
    if pl.get("url") and not URL_LEG.match(str(pl["url"])): return False, "url fora de *.leg.br (o app não mostra o link)"
    return True, modo


def checar_oficiais(repo, pids, R):
    A = "oficiais"
    cam = os.path.join(repo, "oficiais.json")
    if not os.path.exists(cam): R.aviso(A, "oficiais.json não existe"); return
    try: O = ler_json(cam)
    except (OSError, ValueError) as e: R.erro(A, f"oficiais.json ilegível: {e}"); return
    evs = O.get("eventos") if isinstance(O, dict) else None
    if not isinstance(evs, list): R.erro(A, "oficiais.json sem lista 'eventos'"); return
    ids = [e.get("id") for e in evs if isinstance(e, dict)]
    rep = sorted({i for i in ids if ids.count(i) > 1})
    if rep: R.erro(A, f"eventos com id repetido: {rep[:3]}")
    ids_set, n_pl, n_bons = set(ids), 0, 0
    for e in evs:
        if not isinstance(e, dict): continue
        if e.get("pid") and e["pid"] not in pids: R.erro(A, f"{e.get('id')}: pid {e['pid']!r} não existe no feed.json")
        if e.get("tipo") != "votacao" or "placar" not in e: continue
        n_pl += 1
        ok, motivo = placar_valido(e)
        if not ok: R.erro(A, f"{e.get('id')}: placar inválido para o app ({motivo})"); continue
        n_bons += 1
        pl = e["placar"]
        if motivo == "sem_placar": R.aviso(A, f"{e.get('id')}: {pl.get('titulo')} sem os votos na API (o app mostra só '{pl.get('resultado')}')")
        if not e.get("pid"): R.aviso(A, f"{e.get('id')}: placar sem pauta ligada (não aparece no app; ponha o número da proposição na pauta)")
        elif e.get("confianca") not in ("numero", "id", "palavras"): R.aviso(A, f"{e.get('id')}: confiança {e.get('confianca')!r} (o app não liga)")
    pp = O.get("para_pautas") or {}
    if not isinstance(pp, dict): R.erro(A, "para_pautas não é objeto"); pp = {}
    for pid, lst in pp.items():
        if pid not in pids: R.erro(A, f"para_pautas: pauta {pid!r} não existe no feed.json")
        for x in lst if isinstance(lst, list) else []:
            if (x.get("patch") or {}).get("pid") != pid: R.erro(A, f"para_pautas[{pid}]: patch.pid diferente")
            if x.get("evento") not in ids_set: R.erro(A, f"para_pautas[{pid}]: evento {x.get('evento')!r} não está em eventos")
    falhas = [k for k, v in (O.get("fontes") or {}).items() if str(v).startswith("falhou")]
    if falhas: R.aviso(A, f"fontes que falharam na última execução: {', '.join(falhas)}")
    R.bom(A, f"gerado {O.get('gerado')}; {len(evs)} eventos, {n_bons}/{n_pl} placares válidos para o app")


# ---------- páginas e rodadas ----------
def checar_paginas(repo, pids, R):
    pasta = os.path.join(repo, "m")
    if not os.path.isdir(pasta): R.aviso("paginas", "pasta m/ não existe"); return
    faltam = [p for p in pids if not os.path.isfile(os.path.join(pasta, f"{p}.html"))]
    if faltam: R.erro("paginas", f"{len(faltam)} pautas sem m/<id>.html: {faltam[:3]}")
    else: R.bom("paginas", f"{len(pids)} pautas com página")


def checar_rodadas(repo, R):
    A = "rodadas"
    cam = os.path.join(repo, "rodadas.json")
    if not os.path.exists(cam): R.aviso(A, "rodadas.json não existe"); return
    try: r = ler_json(cam)
    except (OSError, ValueError) as e: R.erro(A, f"rodadas.json ilegível: {e}"); return
    itens = r.get("itens") if isinstance(r, dict) else None
    if not isinstance(itens, dict) or not re.match(r"^\d{4}-\d\d-\d\d$", str(r.get("dia"))): R.erro(A, "formato {dia, itens} inválido"); return
    cont = {}
    for k, reg in itens.items():
        if not re.match(r"^\d\dh\d\d$", k): R.aviso(A, f"chave {k!r} fora do formato HHhMM")
        if not isinstance(reg, dict) or reg.get("status") not in STATUS_RODADA: R.erro(A, f"{k}: status {(reg or {}).get('status')!r}"); continue
        cont[reg["status"]] = cont.get(reg["status"], 0) + 1
        if reg["status"] == "falhou": R.aviso(A, f"{k} ({reg.get('tipo')}) falhou: {reg.get('nota')}")
        if reg.get("publicou") is True and reg["status"] != "ok": R.aviso(A, f"{k}: publicou=true com status {reg['status']}")
        chk = str(reg.get("checagem") or "")
        m = re.match(r"(\d+) erros?", chk)
        if m and int(m.group(1)) > 0 and reg.get("tipo") != "virada": R.aviso(A, f"{k}: publicou com '{chk}'")
    R.bom(A, f"dia {r.get('dia')}: " + ", ".join(f"{n} {s}" for s, n in sorted(cont.items())))


def checar(repo, max_atraso=75):
    R = Relatorio()
    try:
        with open(os.path.join(repo, "feed.json"), "rb") as fh: dados = fh.read()
        feed = json.loads(dados.decode("utf-8"))
        pids = [p.get("id") for p in feed.get("pautas") or [] if isinstance(p, dict)]
    except (OSError, ValueError, UnicodeDecodeError, AttributeError) as e:
        R.erro("feed", f"feed.json ilegível: {e}"); return R, 2
    checar_leve(repo, dados, feed, R, max_atraso)
    checar_fotos(repo, R)
    checar_series(repo, R)
    checar_oficiais(repo, set(pids), R)
    checar_paginas(repo, pids, R)
    checar_rodadas(repo, R)
    return R, (1 if R.erros else 0)


def main(argv):
    if "-h" in argv or "--help" in argv: print(__doc__); return 0
    js, max_atraso, args, i = False, 75, [], 0
    while i < len(argv):
        if argv[i] == "--json": js = True; i += 1; continue
        if argv[i] == "--max-atraso-leve": max_atraso = float(argv[i + 1]); i += 2; continue
        args.append(argv[i]); i += 1
    repo = args[0] if args else os.path.dirname(AQUI)
    if not os.path.isdir(repo): print(f"pasta não encontrada: {repo}"); return 2
    R, rc = checar(repo, max_atraso)
    if js:
        print(json.dumps({"erros": R.erros, "avisos": R.avisos, "ok": R.ok, "saida": rc}, ensure_ascii=False, indent=1))
    else:
        for x in R.ok: print("ok    " + x)
        for x in R.avisos: print("AVISO " + x)
        for x in R.erros: print("ERRO  " + x)
        print(f"{len(R.erros)} erros · {len(R.avisos)} avisos")
    return rc


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
