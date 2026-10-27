#!/usr/bin/env python3
"""Virada da meia-noite do Prumo News, sem IA (roda no GitHub às 0h05).

  python3 tools/virada_auto.py feed.json [--agora 2026-10-28T00:05] [--saida feed.json] [--relatorio virada.txt]

1. aplicar.py --virada: recalcula edição, contagem e título das mudanças; tira agenda e breves vencidas.
2. Troca as palavras de dia relativo ("hoje", "amanhã", "nesta quarta", "esta noite"…) pelo dia com a data,
   escritas no dia da última edição: "hoje" → "na terça (27)", "de hoje" → "de terça (27)",
   "esta noite" → "na noite de terça (27)", "nesta quarta" → "na quarta (28)".
3. Enquete com dia relativo é retirada (enquete nunca se edita).
4. validar.py --virada. Só grava se não sobrar ERRO além de dia relativo que a troca automática não resolveu
   (esses viram aviso no relatório; a rodada da manhã corrige).
Sai com 0 quando gravou, 3 quando não havia o que gravar e 1 quando recusou.
"""
import copy, importlib.util, json, os, re, subprocess, sys, tempfile
from datetime import datetime, timedelta

AQUI = os.path.dirname(os.path.abspath(__file__))


def carregar(nome):
    spec = importlib.util.spec_from_file_location(nome + "_prumo", os.path.join(AQUI, nome + ".py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


V = carregar("validar")
MASC = {"sábado", "domingo"}
PREP_ANTES = re.compile(r"\b(de|até|desde|para|a partir de|após|antes de|depois de|entre|e)\s+$", re.I)
PASSADO = re.compile(r"\b\w{3,}(?:ou|eu|iu|aram|eram|iram|ava|avam|ia|iam)\b", re.I)
FUTURO = re.compile(r"\b(vai|vão|deve|devem|deverá|deverão|será|serão|pode|podem|marcad\w*|previst\w*|agendad\w*|prevê|promete|quer)\b", re.I)


def rot(d):
    return V.dia_rotulo(d)


def art(d):
    return "no" if V.DIAS[d.weekday()] in MASC else "na"


def maiusc(orig, novo):
    return novo[0].upper() + novo[1:] if orig[:1].isupper() else novo


def troca_dia(m, texto, ref):
    w = m.group(0); lw = w.lower()
    antes = texto[:m.start()]
    if "noite" in lw: return maiusc(w, f"na noite de {rot(ref)}")
    if "madrugada" in lw: return maiusc(w, f"na madrugada de {rot(ref)}")
    if "tarde" in lw: return maiusc(w, f"na tarde de {rot(ref)}")
    if "manhã" in lw and "amanhã" not in lw: return maiusc(w, f"na manhã de {rot(ref)}")
    if "depois de amanhã" in lw: d = ref + timedelta(days=2)
    elif "anteontem" in lw: d = ref - timedelta(days=2)
    elif "amanhã" in lw: d = ref + timedelta(days=1)
    elif "ontem" in lw: d = ref - timedelta(days=1)
    else: d = ref  # hoje, ainda hoje
    if PREP_ANTES.search(antes): return rot(d)
    return maiusc(w, f"{art(d)} {rot(d)}")


def frase_antes(texto, pos):
    i = max(texto.rfind(".", 0, pos), texto.rfind("!", 0, pos), texto.rfind("?", 0, pos), texto.rfind(";", 0, pos))
    return texto[i + 1:pos]


def troca_semana(m, texto, ref):
    w = m.group(0); lw = w.lower()
    wd = next(i for i, d in enumerate(V.DIAS) if d in lw)
    k0 = (wd - ref.weekday()) % 7
    fut = ref + timedelta(days=k0 or 7)
    pas = ref - timedelta(days=(ref.weekday() - wd) % 7 or 7)
    if re.search(r"próxim", lw): d = fut
    elif re.search(r"últim|passad", lw): d = pas
    elif k0 == 0: d = ref
    elif re.search(r"\b(nest|dest)", lw): d = fut if (fut - ref).days <= (ref - pas).days else pas
    else:
        fr = frase_antes(texto, m.start()) + texto[m.end():m.end() + 30]
        d = fut if FUTURO.search(fr) or not PASSADO.search(fr) else pas
    masc = V.DIAS[d.weekday()] in MASC
    nome = f"{V.DIAS[d.weekday()]} ({d.day})"
    pm = re.match(r"\s*(até|desde|para)\s+[ao]\s", lw)
    if pm: novo = f"{pm.group(1)} {'o' if masc else 'a'} {nome}"
    elif re.match(r"\s*(dest|d[ao]\s)", lw): novo = f"{'do' if masc else 'da'} {nome}"
    else: novo = f"{'no' if masc else 'na'} {nome}"
    return maiusc(w, novo)


def reescreve(texto, ref, so_dia=False):
    if not isinstance(texto, str) or not texto: return texto, 0
    n = 0
    def f1(m):
        nonlocal n; n += 1; return troca_dia(m, m.string, ref)
    def f2(m):
        nonlocal n; n += 1; return troca_semana(m, m.string, ref)
    t = V.REL_DIA.sub(f1, texto)
    if not so_dia: t = V.REL_SEM.sub(f2, t)
    return t, n


def campos(F):
    """(dicionário, chave, tipo) dos textos em que dia relativo é ERRO na virada.
    'estrito' (títulos, breves, agenda, calendário, mudanças): troca tudo.
    'principal' (textos principais): troca só hoje/amanhã/ontem/esta noite; "no domingo" genérico fica.
    Os demais campos (atualizações datadas, FAQ, explicadores, quiz…) ficam como estão: o validar só avisa."""
    for p in F.get("pautas") or []:
        n = p.get("neutro") or {}
        yield n, "titulo", "estrito"
        yield n, "texto", "principal"
        for lado in ("direita", "esquerda"):
            v = p.get(lado)
            if isinstance(v, dict):
                yield v, "titulo", "estrito"; yield v, "texto", "principal"
        for k in ("contexto", "proximo"): yield p, k, "principal"
    for b in F.get("breves") or []: yield b, "titulo", "estrito"
    for a in F.get("agenda") or []: yield a, "texto", "estrito"
    for c in F.get("calendario") or []: yield c, "texto", "estrito"
    for it in (F.get("mudancas") or {}).get("itens") or []: yield it, "texto", "estrito"
    for e in (F.get("explicadores") or {}).values():
        if isinstance(e, dict): yield e, "texto", "principal"
    cp = F.get("capa")
    if isinstance(cp, dict): yield cp, "linha_fina", "principal"


def virar(F, ref):
    trocas, enq = 0, 0
    titulos_antes = {p.get("id"): (p.get("neutro") or {}).get("titulo") for p in F.get("pautas") or []}
    for p in F.get("pautas") or []:
        en = p.get("enquete")
        if isinstance(en, dict):
            txt = " ".join([str(en.get("pergunta") or "")] + [str(o) for o in en.get("opcoes") or []])
            if V.REL_DIA.search(txt) or V.REL_SEM.search(txt):
                p.pop("enquete", None); enq += 1
    for cont, k, tipo in campos(F):
        try: v = cont[k]
        except (KeyError, IndexError, TypeError): continue
        novo, n = reescreve(v, ref, so_dia=(tipo == "principal"))
        if n: cont[k] = novo; trocas += n
    for p in F.get("pautas") or []:
        hist = p.get("titulos")
        novo = (p.get("neutro") or {}).get("titulo")
        if isinstance(hist, list) and hist and isinstance(hist[-1], dict) and hist[-1].get("titulo") == titulos_antes.get(p.get("id")):
            hist[-1]["titulo"] = novo
    return trocas, enq


def main(argv):
    args, agora, saida, rel = [], None, None, None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--agora": agora = argv[i + 1]; i += 2; continue
        if a == "--saida": saida = argv[i + 1]; i += 2; continue
        if a == "--relatorio": rel = argv[i + 1]; i += 2; continue
        args.append(a); i += 1
    if not args: print(__doc__); return 2
    entrada = args[0]; saida = saida or entrada
    anterior = json.load(open(entrada, encoding="utf-8"))
    tmp = tempfile.mkdtemp()
    v1 = os.path.join(tmp, "v1.json")
    cmd = [sys.executable, "-I", os.path.join(AQUI, "aplicar.py"), entrada, "-o", v1, "--virada"] + (["--agora", agora] if agora else [])
    r = subprocess.run(cmd, capture_output=True, text=True)
    linhas = [r.stdout.strip()]
    if r.returncode != 0 or not os.path.exists(v1):
        print("ERRO no aplicar.py --virada:\n" + r.stdout + r.stderr); return 1
    F = json.load(open(v1, encoding="utf-8"))
    ref_ant = V.dt(anterior.get("atualizado_em"))
    ag = V.dt(F.get("atualizado_em"))
    ref = ref_ant.date() if ref_ant and ref_ant.date() < ag.date() else ag.date() - timedelta(days=1)
    trocas, enq = virar(F, ref)
    v2 = os.path.join(tmp, "v2.json")
    with open(v2, "w", encoding="utf-8") as fh: fh.write(json.dumps(F, ensure_ascii=False, separators=(",", ":")))
    cmd = [sys.executable, "-I", os.path.join(AQUI, "validar.py"), v2, "--prev", entrada, "--virada", "--json"] + (["--agora", agora] if agora else [])
    r = subprocess.run(cmd, capture_output=True, text=True)
    erros = [l[6:] for l in r.stdout.splitlines() if l.startswith("ERRO: ")]
    so_relativo = [e for e in erros if "envelhece" in e]
    outros = [e for e in erros if "envelhece" not in e]
    linhas += [f"trechos reescritos: {trocas} · enquetes retiradas: {enq} · erros: {len(erros)} ({len(so_relativo)} de dia relativo)"]
    linhas += ["ERRO: " + e for e in erros]
    texto = "\n".join(linhas)
    print(texto)
    if rel:
        with open(rel, "w", encoding="utf-8") as fh: fh.write(texto + "\n")
    if outros:
        print("RECUSADO: há erros que não são de dia relativo; o feed não foi gravado."); return 1
    with open(saida, "w", encoding="utf-8") as fh: fh.write(json.dumps(F, ensure_ascii=False, separators=(",", ":")))
    resumo = {"tipo": "virada", "status": "ok", "publicou": True, "pautas": len(F.get("pautas") or []),
              "mudancas": len((F.get("mudancas") or {}).get("itens") or []), "trechos_reescritos": trocas,
              "enquetes_retiradas": enq, "checagem": f"{len(erros)} erros de dia relativo" if erros else "0 erros",
              "nota": "Virada automática (GitHub, sem IA)." + (f" {len(so_relativo)} trechos ficaram para a rodada da manhã." if so_relativo else "")}
    print("REG " + json.dumps(resumo, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
