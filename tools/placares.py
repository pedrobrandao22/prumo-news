#!/usr/bin/env python3
"""Placares ao vivo (25/11), sem IA e sem chave: o resultado dos jogos da Agenda entra sozinho no app.

  python3 tools/placares.py feed.json placares.json [--fixtures DIR] [--agora ISO]

Lê os jogos da Agenda da edição ("Brasileirão: Atlético-MG x Corinthians", com data, hora e pid) de hoje e de ontem,
busca o placar no placar público da ESPN (site.api.espn.com, aberto, sem chave) e grava placares.json:
  {"gerado": ISO, "jogos": [{"pid", "agenda", "mandante", "visitante", "gols_m", "gols_v", "estado": "andamento" |
   "encerrado", "relogio", "texto"}]}
O app (js/212-ao-vivo.js) lê esse arquivo: jogo encerrado vira "Terminou: Atlético-MG 1 x 0 Corinthians." no alto da
notícia; em andamento, "Ao vivo: … (45')". A rodada seguinte escreve a notícia; isto é só o placar oficial.
Falha de rede nunca quebra: mantém o arquivo anterior. Se nada mudou, não grava.
"""
import json, os, re, sys, unicodedata, urllib.request
from datetime import datetime, timedelta, timezone

SP = timezone(timedelta(hours=-3))
UA = {"User-Agent": "Mozilla/5.0 (prumo-news; +https://prumonews.com.br)"}
LIGAS = ["bra.1", "bra.2", "bra.copa_do_brazil", "conmebol.libertadores", "conmebol.sudamericana", "fifa.world",
         "fifa.worldq.conmebol", "fifa.friendly"]
URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/{liga}/scoreboard?dates={dia}"
# nomes que a ESPN escreve diferente da edição (chave e valor já normalizados)
APELIDOS = {"atletico mineiro": "atletico-mg", "atletico mg": "atletico-mg", "athletico paranaense": "athletico-pr",
            "athletico pr": "athletico-pr", "atletico paranaense": "athletico-pr", "atletico goianiense": "atletico-go",
            "atletico go": "atletico-go", "vasco da gama": "vasco", "red bull bragantino": "bragantino",
            "rb bragantino": "bragantino", "sao paulo fc": "sao paulo", "boca juniors": "boca", "river plate": "river",
            "brasil": "brasil", "brazil": "brasil", "estudiantes de la plata": "estudiantes"}


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9-]+", " ", s).strip()
    s = re.sub(r"\b(fc|ec|sc|cr|ac|clube|club|de futebol)\b", "", s).strip()
    s = re.sub(r"\s+", " ", s)
    return APELIDOS.get(s, s)


def times_da_agenda(texto):
    """'Brasileirão: Atlético-MG x Corinthians, jogo atrasado' -> ('Atlético-MG', 'Corinthians')"""
    t = str(texto or "")
    t = t.split(":", 1)[1] if ":" in t.split(" x ")[0] else t
    m = re.search(r"([A-Za-zÀ-ÿ0-9 .'-]{2,40}?)\s+x\s+([A-Za-zÀ-ÿ0-9 .'-]{2,40}?)(?:,|\.|;|\(| em | no | na | pela | pelo |$)", t)
    if not m: return None
    return m.group(1).strip(), m.group(2).strip()


def casa(a, b):
    a, b = norm(a), norm(b)
    return bool(a and b) and (a == b or a in b or b in a)


def ler(url, fixtures=None):
    if fixtures:
        nome = re.sub(r"[^a-z0-9.]+", "_", url.split("/soccer/")[1])
        cam = os.path.join(fixtures, nome + ".json")
        return json.load(open(cam, encoding="utf-8")) if os.path.exists(cam) else {"events": []}
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def eventos(dias, fixtures=None):
    out, falhou = [], False
    for liga in LIGAS:
        for dia in dias:
            try: d = ler(URL.format(liga=liga, dia=dia), fixtures)
            except Exception:
                falhou = True; continue
            for e in d.get("events") or []:
                try:
                    c = e["competitions"][0]; st = e["status"]["type"]
                    cs = {x["homeAway"]: x for x in c["competitors"]}
                    out.append({"liga": liga, "quando": e.get("date"), "estado": st.get("state"),
                                "relogio": (e.get("status") or {}).get("displayClock") or "",
                                "m": cs["home"]["team"]["displayName"], "v": cs["away"]["team"]["displayName"],
                                "gm": cs["home"].get("score"), "gv": cs["away"].get("score")})
                except (KeyError, IndexError, TypeError):
                    continue
    return out, falhou


def montar(feed, agora, fixtures=None):
    hoje = agora.astimezone(SP).date(); ontem = hoje - timedelta(days=1)
    alvo = []
    for a in feed.get("agenda") or []:
        if not isinstance(a, dict) or not a.get("pid") or a.get("data") not in (str(hoje), str(ontem)): continue
        tm = times_da_agenda(a.get("texto"))
        if tm: alvo.append((a, tm))
    if not alvo: return [], False
    dias = sorted({d.strftime("%Y%m%d") for d in (ontem, hoje, hoje + timedelta(days=1))})
    evs, falhou = eventos(dias, fixtures)
    jogos = []
    for a, (t1, t2) in alvo:
        for e in evs:
            if not ((casa(t1, e["m"]) and casa(t2, e["v"])) or (casa(t1, e["v"]) and casa(t2, e["m"]))): continue
            try: dia_sp = datetime.fromisoformat(str(e["quando"]).replace("Z", "+00:00")).astimezone(SP).date()
            except ValueError: continue
            if str(dia_sp) != a.get("data"): continue
            if e["estado"] not in ("in", "post"): break
            placar = f'{e["m"]} {e["gm"]} x {e["gv"]} {e["v"]}'
            fim = e["estado"] == "post"
            jogos.append({"pid": a["pid"], "agenda": a.get("texto"), "mandante": e["m"], "visitante": e["v"],
                          "gols_m": e["gm"], "gols_v": e["gv"], "estado": "encerrado" if fim else "andamento",
                          "relogio": "" if fim else e["relogio"],
                          "texto": f"Terminou: {placar}." if fim else f"Ao vivo: {placar}" + (f' ({e["relogio"]})' if e["relogio"] else "") + "."})
            break
    return jogos, falhou


def main(argv):
    args, opt, i = [], {}, 0
    while i < len(argv):
        if argv[i].startswith("--"): opt[argv[i]] = argv[i + 1] if i + 1 < len(argv) else ""; i += 2
        else: args.append(argv[i]); i += 1
    feed_p, saida = args[0], args[1]
    fixtures = opt.get("--fixtures")
    agora = datetime.fromisoformat(opt["--agora"]) if "--agora" in opt else datetime.now(timezone.utc)
    feed = json.load(open(feed_p, encoding="utf-8"))
    jogos, falhou = montar(feed, agora, fixtures)
    try: velho = json.load(open(saida, encoding="utf-8"))
    except (OSError, ValueError): velho = {}
    if falhou and not jogos and velho.get("jogos"):
        print("placares: rede falhou, mantém o arquivo anterior"); return 0
    if velho.get("jogos") == jogos:
        print(f"placares: nada mudou ({len(jogos)} jogo(s))"); return 0
    json.dump({"gerado": agora.astimezone(timezone.utc).isoformat(timespec="seconds"), "jogos": jogos},
              open(saida, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"placares: {len(jogos)} jogo(s) gravado(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
