#!/usr/bin/env python3
"""Índice compacto do feed do Prumo News (para as rodadas rápidas não lerem o feed inteiro).

Uso:
  python3 resumo.py feed.json                 índice (~3 mil tokens) + pendências
  python3 resumo.py feed.json --pauta ID      a pauta inteira, formatada (para editar com aplicar.py)
  python3 resumo.py feed.json --agora 2026-10-14T21:48:00-03:00

Precisa do validar.py na mesma pasta (usa as mesmas regras de pendência).
"""
import json, os, sys, importlib.util
from datetime import datetime, timedelta

def carregar_validar():
    caminho = os.path.join(os.path.dirname(os.path.abspath(__file__)), "validar.py")
    if not os.path.exists(caminho):
        sys.exit("ERRO: validar.py precisa estar na mesma pasta do resumo.py")
    spec = importlib.util.spec_from_file_location("validar_prumo", caminho)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m

V = carregar_validar()

def corta(s, n):
    s = str(s or "").replace("\n", " ").replace("|", "/")
    return s if len(s) <= n else s[:n - 1] + "…"

def hm(iso):
    t = V.dt(iso)
    return t.strftime("%d %Hh%M") if t else "?"

def main(argv):
    args, pauta, agora = [], None, None
    i = 0
    while i < len(argv):
        if argv[i] == "--pauta": pauta = argv[i + 1]; i += 2; continue
        if argv[i] == "--agora": agora = datetime.fromisoformat(argv[i + 1]); i += 2; continue
        if argv[i] in ("-h", "--help"): print(__doc__); return 0
        args.append(argv[i]); i += 1
    if not args: print(__doc__); return 2
    caminho = args[0]
    f = json.load(open(caminho, encoding="utf-8"))
    ps = f.get("pautas") or []
    if pauta:
        p = next((x for x in ps if x.get("id") == pauta), None)
        if not p: print(f"pauta '{pauta}' não existe"); return 1
        print(json.dumps(p, ensure_ascii=False, indent=1)); return 0

    if agora is not None and agora.tzinfo is None: agora = agora.replace(tzinfo=V.SP)
    ref = V.dt(f.get("atualizado_em")) or datetime.now(V.SP)
    if agora is None:
        agora = datetime.now(V.SP)
        if agora < ref - timedelta(minutes=5): agora = ref
    idade = int((agora - ref).total_seconds() // 60)
    tam = len(json.dumps(f, ensure_ascii=False, separators=(",", ":")).encode())
    print(f"PRUMO · {f.get('edicao')} · {f.get('contagem') or '(sem contagem)'} · atualizado_em {f.get('atualizado_em')} "
          f"(há {idade} min{' → passou de 100 min: publique mesmo sem novidade' if idade > 100 else ''})")
    print(f"tamanho {tam // 1024} KB · {len(ps)} pautas · {len(f.get('breves') or [])} breves · nota: {corta(f.get('nota'), 90)}")
    print()
    print("PAUTAS (id | seção/subtema | prio | hora | título | nº fontes | sinais)")
    print("  sinais: P=pendência E=enquete C=checagem ok / D=divergência V=visual U=nº atualizações X=correções B=versões de viés")
    print("          AOVIVO / ENCERRADA · PONTUAL · etapa n/N · FAQ · T=nº de títulos no histórico")
    pend = V.pendencias(f, agora)
    com_pend = {x["pid"] for x in pend}
    for p in sorted(ps, key=lambda p: -(p.get("prioridade") or 0)):
        sinais = []
        if p.get("id") in com_pend: sinais.append("P")
        if p.get("enquete"): sinais.append("E")
        c = (p.get("checagem") or {}).get("status")
        if c: sinais.append("C" if c == "ok" else "D")
        for v in p.get("visuais") or []: sinais.append("V:" + {"linha_do_tempo": "linha", "numeros": "num", "imagem": "img", "pesquisas": "pesq"}.get(v.get("tipo"), "?"))
        ups = p.get("atualizacoes") or []
        if ups: sinais.append(f"U{len(ups)}@{max(str(u.get('hora', '')) for u in ups)[11:16]}")
        if p.get("correcoes"): sinais.append(f"X{len(p['correcoes'])}")
        if p.get("direita") or p.get("esquerda"): sinais.append("B")
        sinais.append("img:" + str((p.get("imagem") or {}).get("modelo")))
        st = p.get("status", "ativa")
        if st == "ao_vivo": sinais.insert(0, "AOVIVO")
        if st == "encerrada": sinais.insert(0, "ENCERRADA")
        if p.get("tipo") == "pontual": sinais.insert(0, "PONTUAL")
        et = p.get("etapa") if isinstance(p.get("etapa"), dict) else {}
        if isinstance(et.get("passos"), list) and et["passos"]:
            try: sinais.append(f"etapa {int(et.get('atual') or 0) + 1}/{len(et['passos'])}")
            except (TypeError, ValueError): sinais.append("etapa ?")
        if p.get("faq"): sinais.append("FAQ")
        if len(p.get("titulos") or []) > 1: sinais.append(f"T{len(p['titulos'])}")
        print(f"{p.get('id')} | {p.get('secao', '')[:4]}/{p.get('subtema') or 'SEM SUBTEMA'} | {p.get('prioridade')} | {hm(p.get('hora'))} | "
              f"{corta((p.get('neutro') or {}).get('titulo'), 70)} | {len(p.get('fontes') or [])} | {' '.join(sinais)}")
    print()
    print("AGENDA (data hora | texto | pid)")
    for a in sorted(f.get("agenda") or [], key=lambda a: (str(a.get("data")), V.hora_agenda(a.get("hora")) or (99, 0))):
        print(f"  {a.get('data')} {a.get('hora') or '--'} | {corta(a.get('texto'), 80)} | {a.get('pid') or '-'}")
    mud = f.get("mudancas") or {}
    print()
    print(f"MUDANÇAS — {mud.get('titulo', '')} ({len(mud.get('itens') or [])}/8)")
    for it in mud.get("itens") or []:
        print(f"  {it.get('tipo')} | {it.get('pid')} | {corta(it.get('texto'), 90)}")
    print()
    from collections import Counter
    cb = Counter(b.get("secao") for b in f.get("breves") or [])
    print("BREVES por seção: " + ", ".join(f"{s} {cb.get(s, 0)}" for s in V.SECOES))
    for b in f.get("breves") or []:
        if b.get("urgente") is True:
            t = V.dt(b.get("hora")); mins = int((agora - t).total_seconds() // 60) if t else -1
            print(f"  URGENTE (faixa vermelha, há {mins} min; some sozinha em 3 h): {corta(b.get('titulo'), 90)} | {b.get('url')}")
    pq = f.get("pesquisas_2t") or []
    if pq:
        ult = max(x.get("data", "") for x in pq)
        print(f"PESQUISAS_2T: {len(pq)} · últimas ({ult}): " + "; ".join(f"{x.get('instituto')} {x.get('flavio')}×{x.get('lula')}" for x in pq if x.get("data") == ult))
    print("EXPLICADORES: " + ", ".join(f"{k} ({e.get('atualizado', '')})" for k, e in (f.get("explicadores") or {}).items()))
    print("ENQUETES (não editar; para retirar: remove_enquete): " + ", ".join(p["id"] for p in ps if p.get("enquete")))
    print(f"GLOSSÁRIO {len(f.get('glossario') or {})} termos · PESSOAS {len(f.get('pessoas') or {})} · FONTES {len(f.get('fontes') or {})} · QUIZ {len(f.get('quiz') or [])}")
    cp = f.get("capa") if isinstance(f.get("capa"), dict) else {}
    print()
    print(f"CAPA: manchete {cp.get('manchete') or '(nenhuma: o app usa a maior prioridade)'} · destaques {', '.join(cp.get('destaques') or []) or '-'}")
    it = f.get("indicadores") if isinstance(f.get("indicadores"), dict) else {}
    it = [x for x in it.get("itens") or [] if isinstance(x, dict)] if isinstance(it.get("itens"), list) else []
    print("INDICADORES: " + ("; ".join(f"{x.get('nome')} {x.get('valor')} {x.get('variacao', '')} ({x.get('data')})" for x in it) or "nenhum (manual 2c)"))
    cal = f.get("calendario") or []
    print(f"CALENDÁRIO ({len(cal)}): " + ("; ".join(f"{c.get('data')} {c.get('secao', '')[:4]} {corta(c.get('texto'), 40)}" for c in cal[:12]) or "vazio (manual 2d)"))
    es = f.get("esportes") or {}
    hj = agora.date().isoformat()
    jg = es.get("jogos") or []
    print(f"ESPORTES: {len(es.get('competicoes') or [])} campeonatos ({', '.join(c.get('id', '?') for c in es.get('competicoes') or [])}) · {len(jg)} jogos")
    print("  jogos (id | comp | data hora | mandante x visitante | estado placar) — edite com jogo_set pelo id")
    for j in jg:
        if not isinstance(j, dict): continue
        pl = f" {j.get('ga')}x{j.get('gb')}" if j.get("ga") is not None else ""
        marca = " ← HOJE" if str(j.get("data")) == hj else (" ← ATRASADO" if str(j.get("data")) < hj and j.get("estado") in ("agendado", "ao_vivo") else "")
        print(f"  {j.get('id')} | {j.get('comp')} | {j.get('data')} {j.get('hora') or '--'} | {j.get('a')} x {j.get('b')} | {j.get('estado')}{pl}{marca}")
    dor = f.get("dormentes") or []
    print()
    print(f"DORMENTES ({len(dor)}) — coberturas que saíram; se o assunto voltar, REUSE o id com add_pauta (id | seção/subtema | última | título)")
    for d in dor[:40]:
        print(f"  {d.get('id')} | {str(d.get('secao', ''))[:4]}/{d.get('subtema') or '-'} | {hm(d.get('ultima'))} | {corta(d.get('titulo'), 70)}")
    if not dor: print("  nenhuma")
    sem = [p.get("id") for p in ps if not p.get("subtema")]
    if sem:
        print(f"SEM SUBTEMA ({len(sem)}): {', '.join(sem)} — dê um com set path \"subtema\" (lista no manual, seção 2b)")
    print()
    print(f"PENDÊNCIAS ({len(pend)}) — resolva primeiro")
    for x in pend:
        print(f"  [{x['pid'] or '-'}] {x['tipo']}: {corta(x['texto'], 170)}")
    if not pend: print("  nenhuma")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
