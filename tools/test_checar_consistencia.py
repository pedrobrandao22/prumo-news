#!/usr/bin/env python3
"""Testes offline do tools/checar_consistencia.py:  python3 -I tools/test_checar_consistencia.py

Cada teste monta um repositório mínimo numa pasta temporária (feed, leve feito pelo tools/feed_leve.py, acervo,
séries, oficiais.json com placar, páginas e rodadas), confere que ele passa limpo e depois estraga uma coisa.
"""
import importlib.util, json, os, shutil, subprocess, sys, tempfile

AQUI = os.path.dirname(os.path.abspath(__file__))


def carregar(nome):
    spec = importlib.util.spec_from_file_location(nome + "_t", os.path.join(AQUI, nome + ".py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


K = carregar("checar_consistencia")
L = carregar("feed_leve")

FEED = {"versao": 1, "atualizado_em": "2026-11-03T20:50:00-03:00", "glossario": {"PEC": "emenda"},
        "pautas": [{"id": "pec-seguranca-ccj", "tag": "PEC 18/2025", "neutro": {"titulo": "Senado aprova PEC", "texto": "longo"},
                    "links": [{"url": "https://a"}]},
                   {"id": "dolar", "neutro": {"titulo": "Dólar sobe"}}]}
PLACAR = {"forma": "placar_votacao", "casa": "senado", "titulo": "PEC 18/2025 no Senado · 2º turno", "proposicao": "PEC 18/2025",
          "turno": "2º", "modo": "nominal", "sim": 75, "nao": 0, "abst": 0, "total": 75, "cadeiras": 81, "minimo": 49,
          "regra": "3/5", "resultado": "aprovado", "quando": "2026-11-03T20:10-03:00", "hora_exata": True,
          "fonte": "Senado Federal", "url": "https://www25.senado.leg.br/web/atividade/materias/-/materia/172997",
          "itens": [{"rotulo": "Sim", "valor": 75}, {"rotulo": "Não", "valor": 0}]}


def escrever(caminho, obj, compacto=False):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(obj, ensure_ascii=False, separators=(",", ":")) if compacto else json.dumps(obj, ensure_ascii=False))


def montar(d):
    escrever(os.path.join(d, "feed.json"), FEED, compacto=True)
    L.executar(os.path.join(d, "feed.json"))
    os.makedirs(os.path.join(d, "acervo", "p"))
    open(os.path.join(d, "acervo", "p", "lula.webp"), "wb").write(b"RIFF")
    escrever(os.path.join(d, "fotos-arquivo.json"), {"versao": 2, "pessoas": {"Lula": {"fotos": [{"url": "https://x", "local": "acervo/p/lula.webp"}]}},
                                                     "acervo": {"pasta": "acervo", "no_repositorio": 1}})
    escrever(os.path.join(d, "series", "selic.json"), {"id": "selic", "freq": "mensal", "pontos": [["2026-09", 15.0], ["2026-10", 14.5], ["2026-11", 13.75]]})
    escrever(os.path.join(d, "series", "dolar.json"), {"id": "dolar", "freq": "diaria", "pontos": [["2026-10-30", 5.42], ["2026-11-03", 5.49]]})
    escrever(os.path.join(d, "series", "index.json"), {"series": [
        {"id": "selic", "freq": "mensal", "de": "2026-09", "ate": "2026-11", "n": 3},
        {"id": "dolar", "freq": "diaria", "de": "2026-10-30", "ate": "2026-11-03", "n": 2}]})
    ev = {"id": "senado-vot-7112", "tipo": "votacao", "casa": "senado", "quando": "2026-11-03T20:10-03:00", "pid": "pec-seguranca-ccj",
          "confianca": "numero", "placar": dict(PLACAR)}
    escrever(os.path.join(d, "oficiais.json"), {"gerado": "2026-11-03T21:00-03:00", "eventos": [ev], "fontes": {"Senado": "ok: 1"},
                                                "para_pautas": {"pec-seguranca-ccj": [{"evento": "senado-vot-7112", "patch": {"op": "update_add", "pid": "pec-seguranca-ccj"}}]}})
    os.makedirs(os.path.join(d, "m"))
    for p in FEED["pautas"]: open(os.path.join(d, "m", p["id"] + ".html"), "w").write("<html>")
    escrever(os.path.join(d, "rodadas.json"), {"dia": "2026-11-03", "itens": {"20h48": {"tipo": "rapida", "status": "ok", "publicou": True, "checagem": "0 erros, 7 avisos"}}})


def com_repo(estragar=None):
    d = tempfile.mkdtemp()
    try:
        montar(d)
        if estragar: estragar(d)
        return K.checar(d)
    finally:
        shutil.rmtree(d, ignore_errors=True)


def ler(d, n): return json.load(open(os.path.join(d, n), encoding="utf-8"))


def tem(R, trecho, onde="erros"):
    return any(trecho in x for x in getattr(R, onde))


def t_repo_limpo():
    R, rc = com_repo()
    assert rc == 0 and not R.erros and not R.avisos, (R.erros, R.avisos)


def t_leve_desatualizado_sem_git_e_erro():
    def f(d):
        F = dict(FEED, atualizado_em="2026-11-03T21:50:00-03:00"); escrever(os.path.join(d, "feed.json"), F, compacto=True)
    R, rc = com_repo(f)
    assert rc == 1 and tem(R, "leve na versão"), R.erros


def t_leve_desatualizado_recente_com_git_e_aviso():
    d = tempfile.mkdtemp()
    try:
        montar(d)
        g = lambda *a: subprocess.run(["git", "-C", d, "-c", "user.name=t", "-c", "user.email=t@t", *a], capture_output=True, check=True)
        g("init", "-q"); g("add", "-A"); g("commit", "-qm", "a")
        F = dict(FEED, atualizado_em="2026-11-03T21:50:00-03:00"); escrever(os.path.join(d, "feed.json"), F, compacto=True)
        g("commit", "-qam", "feed novo")
        R, rc = K.checar(d)
        assert rc == 0 and tem(R, "o robô refaz", "avisos"), (R.erros, R.avisos)
        R, rc = K.checar(d, max_atraso=-1)  # passou do prazo: erro
        assert rc == 1 and tem(R, "leve na versão"), R.erros
    finally:
        shutil.rmtree(d, ignore_errors=True)


def t_detalhe_ausente_e_indice():
    def f(d):
        v = ler(d, "feed-leve.json")["_leve"]["v"]
        os.remove(os.path.join(d, "feed-det", v + ".json"))
    R, rc = com_repo(f)
    assert rc == 1 and tem(R, "não existe"), R.erros

    def g(d):
        escrever(os.path.join(d, "feed-det", "indice.json"), {"versoes": ["000000000000", ler(d, "feed-leve.json")["_leve"]["v"]]})
    R, rc = com_repo(g)
    assert tem(R, "não começa pela versão") and tem(R, "feed-det/000000000000.json não existe"), R.erros


def t_detalhe_adulterado():
    def f(d):
        v = ler(d, "feed-leve.json")["_leve"]["v"]; det = ler(d, f"feed-det/{v}.json")
        det["topo"]["glossario"] = {"PEC": "outra coisa"}; escrever(os.path.join(d, "feed-det", v + ".json"), det)
    R, rc = com_repo(f)
    assert rc == 1 and tem(R, "não refazem"), R.erros


def t_foto_local_ausente_e_fora():
    def f(d):
        F = ler(d, "fotos-arquivo.json")
        F["pessoas"]["Lula"]["fotos"].append({"local": "acervo/p/sumiu.webp"})
        F["pessoas"]["Lula"]["fotos"].append({"local": "../segredo.webp"})
        escrever(os.path.join(d, "fotos-arquivo.json"), F)
        open(os.path.join(d, "acervo", "p", "orfa.webp"), "wb").write(b"x")
    R, rc = com_repo(f)
    assert rc == 1 and tem(R, "sem arquivo em acervo/") and tem(R, "fora de acervo/") and tem(R, "nenhuma entrada usa", "avisos"), (R.erros, R.avisos)


def t_series_buracos_e_repeticoes():
    def f(d):
        escrever(os.path.join(d, "series", "selic.json"), {"id": "selic", "freq": "mensal", "pontos": [["2026-07", 15.0], ["2026-09", 15.0], ["2026-09", 14.5]]})
        escrever(os.path.join(d, "series", "dolar.json"), {"id": "dolar", "freq": "diaria", "pontos": [["2026-10-01", 5.4], ["2026-11-03", 5.49]]})
    R, rc = com_repo(f)
    assert rc == 1 and tem(R, "meses faltando") and tem(R, "datas repetidas") and tem(R, "index.json diz") \
        and tem(R, "buracos de mais de 7 dias", "avisos"), (R.erros, R.avisos)


def t_series_ponto_ruim():
    def f(d):
        escrever(os.path.join(d, "series", "dolar.json"), {"id": "dolar", "freq": "diaria", "pontos": [["2026-10-30", None], ["2026-11-03", 5.49]]})
    R, rc = com_repo(f)
    assert rc == 1 and tem(R, "fora do formato"), R.erros


def t_placar_regras_do_app():
    casos = [({"modo": "nominal", "sim": 70, "nao": 20}, "cadeiras"), ({"modo": "nominal", "sim": None}, "inteiros"),
             ({"modo": "sem_placar", "sim": None, "nao": None, "resultado": None}, "sem resultado"),
             ({"casa": "stf"}, "casa"), ({"quando": "03/11/2026 20:10"}, "quando"), ({"turno": "3º"}, "turno"),
             ({"minimo": 90}, "minimo"), ({"url": "https://exemplo.com/x"}, "url"), ({"forma": "barras"}, "forma")]
    for mud, motivo in casos:
        pl = dict(PLACAR, **mud)
        if "sim" in mud and mud.get("modo") == "nominal" and mud["sim"] is not None:
            pl["itens"] = [{"rotulo": "Sim", "valor": pl["sim"]}, {"rotulo": "Não", "valor": pl["nao"]}]
        ok, m = K.placar_valido({"quando": "x", "placar": pl})
        assert not ok and motivo in m, (mud, m)
    assert K.placar_valido({"placar": dict(PLACAR, modo="sem_placar", sim=None, nao=None, itens=[])}) == (True, "sem_placar")
    assert K.placar_valido({"placar": dict(PLACAR, quando="2026-11-03T00:00-03:00", hora_exata=False)})[0]
    assert K.placar_valido({"placar": dict(PLACAR, quando="2026-11-03")})[0]  # Date.parse do app aceita só a data


def t_oficiais_pid_inexistente_e_sem_pauta():
    def f(d):
        O = ler(d, "oficiais.json")
        O["eventos"][0]["pid"] = "pauta-que-saiu"
        O["eventos"].append({"id": "camara-vot-1", "tipo": "votacao", "quando": "2026-11-03T20:00-03:00", "pid": None,
                             "placar": dict(PLACAR, casa="camara", modo="simbolica", sim=None, nao=None, itens=[])})
        O["eventos"].append(dict(O["eventos"][1]))  # id repetido
        O["para_pautas"]["sumiu"] = [{"evento": "x", "patch": {"pid": "outra"}}]
        escrever(os.path.join(d, "oficiais.json"), O)
    R, rc = com_repo(f)
    assert rc == 1 and tem(R, "pid 'pauta-que-saiu' não existe") and tem(R, "id repetido") and tem(R, "pauta 'sumiu'") \
        and tem(R, "patch.pid diferente") and tem(R, "evento 'x'") and tem(R, "placar sem pauta ligada", "avisos"), (R.erros, R.avisos)


def t_pagina_e_rodada():
    def f(d):
        os.remove(os.path.join(d, "m", "dolar.html"))
        r = ler(d, "rodadas.json"); r["itens"]["21h48"] = {"tipo": "rapida", "status": "falhou", "nota": "push recusado"}
        r["itens"]["22h48"] = {"tipo": "rapida", "status": "talvez"}; escrever(os.path.join(d, "rodadas.json"), r)
    R, rc = com_repo(f)
    assert rc == 1 and tem(R, "sem m/<id>.html") and tem(R, "22h48: status") and tem(R, "falhou: push recusado", "avisos"), (R.erros, R.avisos)


def t_feed_ilegivel_sai_2():
    def f(d): open(os.path.join(d, "feed.json"), "w").write("{quebrado")
    R, rc = com_repo(f)
    assert rc == 2 and tem(R, "feed.json ilegível")


def t_main_e_json():
    d = tempfile.mkdtemp()
    try:
        montar(d)
        r = subprocess.run([sys.executable, "-I", os.path.join(AQUI, "checar_consistencia.py"), d, "--json"], capture_output=True, text=True)
        assert r.returncode == 0 and json.loads(r.stdout)["saida"] == 0, r.stdout + r.stderr
        assert subprocess.run([sys.executable, "-I", os.path.join(AQUI, "checar_consistencia.py"), os.path.join(d, "nao-existe")],
                              capture_output=True).returncode == 2
    finally:
        shutil.rmtree(d, ignore_errors=True)


TESTES = [v for k, v in sorted(globals().items()) if k.startswith("t_")]
if __name__ == "__main__":
    falhas = 0
    for t in TESTES:
        try: t(); print("ok  ", t.__name__)
        except Exception as e:
            falhas += 1; print("FALHOU", t.__name__, repr(e))
            import traceback; traceback.print_exc()
    print(f"{len(TESTES) - falhas}/{len(TESTES)} ok")
    sys.exit(1 if falhas else 0)
