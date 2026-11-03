#!/usr/bin/env python3
"""Abertura leve do Prumo News: divide o feed.json em uma parte pequena (a Capa) e o detalhe.

  python3 tools/feed_leve.py feed.json            (grava feed-leve.json e feed-det/<versão>.json ao lado do feed)
  python3 tools/feed_leve.py feed.json --saida DIR

O feed.json continua sendo a ÚNICA fonte: rodadas e robôs só escrevem nele. Este script (sem IA, determinístico)
roda no GitHub depois de cada mudança do feed (workflow "Feed leve" e a virada) e gera:
- feed-leve.json: o feed sem as partes pesadas que só aparecem dentro da matéria (texto, links, gráficos, FAQ,
  enquadramentos, dormentes, glossário…). A Capa abre só com ele. Leva "_leve": {"v", "det"}.
- feed-det/<v>.json: o que foi tirado, com a ordem original das chaves; leve + det = feed.json, igualzinho.
  <v> = 12 primeiros dígitos do SHA-1 do feed.json: o app nunca mistura um leve novo com um detalhe velho.
- feed-det/indice.json: as últimas versões (os arquivos antigos saem; quem abriu com um leve antigo e não achar
  o detalhe volta para o feed.json).
Idempotente: se o feed não mudou, não grava nada (o robô não faz commit).
Sai com 0 (gravou ou já estava em dia) ou 1 (feed.json ilegível: não mexe em nada; o app segue com o feed.json).
"""
import hashlib, json, os, sys

FORMATO = 1
GUARDAR = 8  # versões de detalhe mantidas (quem está com um leve antigo em cache ainda acha o seu)
# só o que a Capa (e a primeira tela) não usa; o teste review2/t_feed_leve.js confere que a Capa sai igual
PAUTA_DET = ("links", "social", "visuais", "enquadramentos", "contexto", "checagem", "proximo", "o_que_muda", "servicos", "desfecho", "essencial", "e_o_brasil")
NEUTRO_DET = ("texto",)
TOPO_DET = ("dormentes", "explicadores", "glossario", "espectro", "calendario", "pesquisas_2t")


def versao(dados):
    return hashlib.sha1(dados).hexdigest()[:12]


def compacto(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def dividir(dados):
    """dados: bytes do feed.json. Devolve (leve, det, v)."""
    F = json.loads(dados.decode("utf-8"))
    if not isinstance(F, dict):
        raise ValueError("feed.json não é um objeto")
    v = versao(dados)
    # o cabeçalho vem primeiro: o app lê a versão nos primeiros bytes, sem ler o arquivo inteiro
    leve, topo = {"_leve": {"formato": FORMATO, "v": v, "det": f"feed-det/{v}.json", "atualizado_em": F.get("atualizado_em")}}, {}
    for k, x in F.items():
        if k == "_leve": raise ValueError("o feed não pode ter a chave _leve")
        if k in TOPO_DET: topo[k] = x
        elif k == "pautas" and isinstance(x, list): leve[k] = []
        else: leve[k] = x
    pd = []
    for p in F.get("pautas") if isinstance(F.get("pautas"), list) else []:
        if not isinstance(p, dict):
            leve["pautas"].append(p); pd.append(None); continue
        lp, campos, nd = {}, {}, None
        for k, x in p.items():
            if k in PAUTA_DET: campos[k] = x
            elif k == "neutro" and isinstance(x, dict) and any(c in x for c in NEUTRO_DET):
                lp[k] = {a: b for a, b in x.items() if a not in NEUTRO_DET}
                nd = {"ordem": list(x.keys()), "campos": {a: b for a, b in x.items() if a in NEUTRO_DET}}
            else: lp[k] = x
        leve["pautas"].append(lp)
        if campos or nd:
            d = {"id": p.get("id"), "ordem": list(p.keys()), "campos": campos}
            if nd: d["neutro"] = nd
            pd.append(d)
        else: pd.append(None)
    if "pautas" in F and not isinstance(F["pautas"], list): leve["pautas"] = F["pautas"]
    det = {"formato": FORMATO, "v": v, "ordem": list(F.keys()), "topo": topo, "pautas": pd}
    return leve, det, v


def juntar(leve, det):
    """O mesmo que o app faz (app/src/js/119-feed-leve.js): leve + det = feed.json (com a ordem das chaves)."""
    meta = leve.get("_leve") or {}
    if det.get("v") != meta.get("v"): raise ValueError("versões diferentes")
    ps, pd = leve.get("pautas"), det.get("pautas") or []
    if isinstance(ps, list) and len(ps) != len(pd): raise ValueError("número de pautas diferente")
    out = {}
    for k in det["ordem"]:
        if k == "pautas" and isinstance(ps, list):
            lst = []
            for p, d in zip(ps, pd):
                if not d: lst.append(p); continue
                if not isinstance(p, dict) or p.get("id") != d.get("id"): raise ValueError("pauta fora de ordem")
                q = {}
                for c in d["ordem"]:
                    if c == "neutro" and d.get("neutro"):
                        n, nd = p.get("neutro") or {}, d["neutro"]
                        q[c] = {a: (nd["campos"][a] if a in nd["campos"] else n[a]) for a in nd["ordem"]}
                    else: q[c] = d["campos"][c] if c in d["campos"] else p[c]
                lst.append(q)
            out[k] = lst
        elif k in det["topo"]: out[k] = det["topo"][k]
        else: out[k] = leve[k]
    return out


def gravar(caminho, texto):
    tmp = caminho + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh: fh.write(texto)
    os.replace(tmp, caminho)


def ler(caminho):
    try:
        with open(caminho, encoding="utf-8") as fh: return fh.read()
    except OSError: return None


def executar(feed, saida=None):
    """Gera os arquivos. Devolve (v, mudou)."""
    saida = saida or os.path.dirname(os.path.abspath(feed))
    with open(feed, "rb") as fh: dados = fh.read()
    leve, det, v = dividir(dados)
    if juntar(json.loads(compacto(leve)), json.loads(compacto(det))) != json.loads(dados.decode("utf-8")):
        raise ValueError("leve + detalhe não refazem o feed")  # nunca grava uma divisão que não volta inteira
    pasta = os.path.join(saida, "feed-det")
    os.makedirs(pasta, exist_ok=True)
    mudou = False
    tl, td = compacto(leve), compacto(det)
    cam_det = os.path.join(pasta, v + ".json")
    if ler(cam_det) != td: gravar(cam_det, td); mudou = True
    try: ind = json.loads(ler(os.path.join(pasta, "indice.json")) or "{}").get("versoes") or []
    except ValueError: ind = []
    ind = [v] + [x for x in ind if isinstance(x, str) and x != v]
    ind = ind[:GUARDAR]
    ti = compacto({"versoes": ind})
    if ler(os.path.join(pasta, "indice.json")) != ti: gravar(os.path.join(pasta, "indice.json"), ti); mudou = True
    for nome in sorted(os.listdir(pasta)):
        if nome.endswith(".json") and nome != "indice.json" and nome[:-5] not in ind:
            os.remove(os.path.join(pasta, nome)); mudou = True
    # o leve por último: só aponta para um detalhe que já está gravado
    if ler(os.path.join(saida, "feed-leve.json")) != tl: gravar(os.path.join(saida, "feed-leve.json"), tl); mudou = True
    return v, mudou, len(dados), len(tl.encode()), len(td.encode())


def main(argv):
    args, saida = [], None
    i = 0
    while i < len(argv):
        if argv[i] == "--saida": saida = argv[i + 1]; i += 2; continue
        if argv[i] in ("-h", "--help"): print(__doc__); return 0
        args.append(argv[i]); i += 1
    if len(args) != 1: print(__doc__); return 2
    try:
        v, mudou, nf, nl, nd = executar(args[0], saida)
    except (OSError, ValueError, UnicodeDecodeError) as e:
        print(f"ERRO: {e}. Nada foi gravado; o app continua com o feed.json."); return 1
    print(f"{'gravado' if mudou else 'já estava em dia'}: versão {v} · feed {nf // 1024} KB → leve {nl // 1024} KB + detalhe {nd // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
