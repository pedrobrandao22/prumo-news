#!/usr/bin/env python3
"""Testes offline do tools/feed_leve.py:  python3 -I tools/test_feed_leve.py

Confere que leve + detalhe refazem o feed.json igualzinho (inclusive a ordem das chaves), que o leve fica pequeno
e sem as partes pesadas, que o script é idempotente (sem mudança, nada é gravado), que guarda só as últimas versões
do detalhe e que um feed ilegível não mexe em nada.
"""
import copy, importlib.util, json, os, shutil, sys, tempfile

AQUI = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("feed_leve", os.path.join(AQUI, "feed_leve.py"))
FL = importlib.util.module_from_spec(spec); spec.loader.exec_module(FL)
RAIZ = os.path.dirname(AQUI)
FEEDS = [os.path.join(RAIZ, "feed.json"), os.path.join(RAIZ, "fonte", "app", "feed.json"), os.path.join(AQUI, "fixtures", "feed_mini.json")]


def bytes_de(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def ida_e_volta(dados):
    leve, det, v = FL.dividir(dados)
    # pelo texto, como o app recebe
    leve2, det2 = json.loads(FL.compacto(leve)), json.loads(FL.compacto(det))
    junto = FL.juntar(leve2, det2)
    orig = json.loads(dados.decode("utf-8"))
    assert junto == orig, "leve + detalhe não refazem o feed"
    assert bytes_de(junto) == bytes_de(orig), "a ordem das chaves mudou"
    return leve, det, v


def t_feeds_reais():
    for caminho in FEEDS:
        if not os.path.exists(caminho): continue
        dados = open(caminho, "rb").read()
        leve, det, v = ida_e_volta(dados)
        assert v == FL.versao(dados) and len(v) == 12
        txt = FL.compacto(leve)
        assert txt.startswith('{"_leve":{"formato":1,"v":"%s","det":"feed-det/%s.json","atualizado_em":' % (v, v)), txt[:120]
        assert leve["_leve"]["atualizado_em"] == json.loads(dados).get("atualizado_em")
        for k in FL.TOPO_DET: assert k not in leve
        for p in leve.get("pautas") or []:
            if not isinstance(p, dict): continue
            for k in FL.PAUTA_DET: assert k not in p, (p.get("id"), k)
            assert "texto" not in (p.get("neutro") or {}), p.get("id")
            # o que a Capa usa continua no leve
            for k in ("id", "secao", "titulos", "atualizacoes", "imagem", "status", "direita", "esquerda", "faq", "etapa", "enquete"):
                if k in [q for q in json.loads(dados)["pautas"] if q.get("id") == p.get("id")][0]: assert k in p, (p.get("id"), k)
        if caminho == FEEDS[0]:
            assert len(txt.encode()) < len(dados) * 0.55, (len(txt.encode()), len(dados))


def t_casos_limite():
    base = {"versao": 1, "atualizado_em": "2026-11-03T20:00:00-03:00", "secoes": [{"id": "politica", "nome": "Política"}],
            "pautas": [{"id": "a", "neutro": {"titulo": "T", "texto": "X", "pontos": ["p"]}, "links": [{"url": "u"}], "hora": "h"},
                       {"id": "b", "neutro": {"titulo": "Sem texto"}},
                       {"id": "c", "contexto": "só contexto", "neutro": "não é objeto"},
                       "lixo", None, {"sem_id": 1, "visuais": []}],
            "dormentes": [{"id": "d", "titulo": "D"}], "glossario": {}}
    leve, det, v = ida_e_volta(bytes_de(base))
    assert det["pautas"][1] is None and det["pautas"][3] is None and det["pautas"][4] is None
    assert leve["pautas"][0] == {"id": "a", "neutro": {"titulo": "T", "pontos": ["p"]}, "hora": "h"}
    assert leve["pautas"][2] == {"id": "c", "neutro": "não é objeto"}
    # a ordem original volta mesmo quando o campo tirado estava no meio
    b2 = copy.deepcopy(base); b2["pautas"][0] = {"links": [], "id": "a", "neutro": {"texto": "X", "titulo": "T"}, "hora": "h"}
    ida_e_volta(bytes_de(b2))
    # sem pautas, pautas que não são lista, feed vazio
    ida_e_volta(bytes_de({"versao": 1}))
    ida_e_volta(bytes_de({"pautas": {"x": 1}, "dormentes": []}))
    ida_e_volta(bytes_de({}))
    # versões diferentes não se misturam
    _, det_outro, _ = FL.dividir(bytes_de(b2))
    try: FL.juntar(leve, det_outro); raise AssertionError("juntou versões diferentes")
    except ValueError: pass
    # feed com _leve é recusado; feed que não é objeto também
    for ruim in ({"_leve": 1}, [1, 2]):
        try: FL.dividir(bytes_de(ruim)); raise AssertionError("aceitou " + repr(ruim))
        except ValueError: pass


def t_arquivos():
    d = tempfile.mkdtemp()
    try:
        feed = os.path.join(d, "feed.json")
        F = json.load(open(FEEDS[1], encoding="utf-8"))
        vs = []
        for i in range(FL.GUARDAR + 3):
            F["atualizado_em"] = "2026-11-03T%02d:00:00-03:00" % i
            open(feed, "wb").write(bytes_de(F))
            assert FL.main([feed]) == 0
            vs.append(FL.versao(open(feed, "rb").read()))
            leve = json.load(open(os.path.join(d, "feed-leve.json"), encoding="utf-8"))
            assert leve["_leve"]["v"] == vs[-1]
            det = json.load(open(os.path.join(d, "feed-det", vs[-1] + ".json"), encoding="utf-8"))
            assert FL.juntar(leve, det) == F
        ind = json.load(open(os.path.join(d, "feed-det", "indice.json")))["versoes"]
        assert ind == list(reversed(vs))[:FL.GUARDAR], ind
        assert sorted(os.listdir(os.path.join(d, "feed-det"))) == sorted([x + ".json" for x in ind] + ["indice.json"])
        # sem mudança: nada é regravado
        ts = {n: os.stat(os.path.join(d, "feed-det", n)).st_mtime_ns for n in os.listdir(os.path.join(d, "feed-det"))}
        tl = os.stat(os.path.join(d, "feed-leve.json")).st_mtime_ns
        v, mudou, *_ = FL.executar(feed)
        assert not mudou and v == vs[-1]
        assert tl == os.stat(os.path.join(d, "feed-leve.json")).st_mtime_ns
        assert ts == {n: os.stat(os.path.join(d, "feed-det", n)).st_mtime_ns for n in os.listdir(os.path.join(d, "feed-det"))}
        # feed de volta a uma versão antiga ainda guardada: o leve aponta para ela de novo
        F["atualizado_em"] = "2026-11-03T%02d:00:00-03:00" % (FL.GUARDAR + 1)
        open(feed, "wb").write(bytes_de(F)); FL.main([feed])
        assert json.load(open(os.path.join(d, "feed-det", "indice.json")))["versoes"][0] == vs[FL.GUARDAR + 1]
        # feed ilegível: código 1 e nada muda
        antes = open(os.path.join(d, "feed-leve.json"), "rb").read()
        open(feed, "w").write('{"pautas": [')
        assert FL.main([feed]) == 1
        assert open(os.path.join(d, "feed-leve.json"), "rb").read() == antes
        # --saida em outra pasta
        d2 = os.path.join(d, "outra"); os.makedirs(d2)
        open(feed, "wb").write(bytes_de(F))
        assert FL.main([feed, "--saida", d2]) == 0 and os.path.exists(os.path.join(d2, "feed-leve.json"))
    finally:
        shutil.rmtree(d)


def t_conferir():
    """--conferir (testes A): em dia, atrasado (robô do leve não rodou), detalhe ausente, detalhe de outra versão, leve sem cabeçalho."""
    d = tempfile.mkdtemp()
    try:
        feed = os.path.join(d, "feed.json")
        F = json.load(open(FEEDS[1], encoding="utf-8"))
        F["atualizado_em"] = "2026-11-03T10:00:00-03:00"; open(feed, "wb").write(bytes_de(F))
        assert FL.main([feed, "--conferir"]) == 1  # ainda sem leve
        assert FL.main([feed]) == 0
        assert FL.conferir(feed)[0] == "em_dia" and FL.main([feed, "--conferir"]) == 0
        v1 = FL.versao(open(feed, "rb").read())
        # o feed muda e o robô do leve não roda: atrasado (o leve velho ainda refaz a edição velha)
        F2 = copy.deepcopy(F); F2["atualizado_em"] = "2026-11-03T11:00:00-03:00"; F2["pautas"][0]["neutro"]["titulo"] = "Nova"
        open(feed, "wb").write(bytes_de(F2))
        e, txt = FL.conferir(feed)
        assert e == "atrasado" and "10:00" in txt and "11:00" in txt, (e, txt)
        assert FL.main([feed, "--conferir"]) == 3
        # o mesmo feed regravado com outra formatação: em dia (conteúdo igual)
        open(feed, "w", encoding="utf-8").write(json.dumps(F, ensure_ascii=False, indent=1))
        assert FL.conferir(feed)[0] == "em_dia"
        # detalhe ausente
        os.rename(os.path.join(d, "feed-det", v1 + ".json"), os.path.join(d, "x.json"))
        assert FL.conferir(feed)[0] == "quebrado" and FL.main([feed, "--conferir"]) == 1
        # detalhe de outra versão no lugar
        det = json.load(open(os.path.join(d, "x.json"), encoding="utf-8")); det["v"] = "0" * 12
        open(os.path.join(d, "feed-det", v1 + ".json"), "w").write(json.dumps(det))
        assert FL.conferir(feed)[0] == "quebrado"
        # leve sem o cabeçalho no começo
        leve = json.load(open(os.path.join(d, "feed-leve.json"), encoding="utf-8")); meta = leve.pop("_leve"); leve["_leve"] = meta
        open(os.path.join(d, "feed-leve.json"), "w").write(json.dumps(leve))
        assert FL.conferir(feed)[0] == "quebrado"
        # o --conferir não grava nada
        antes = sorted(os.listdir(os.path.join(d, "feed-det"))); FL.main([feed, "--conferir"])
        assert sorted(os.listdir(os.path.join(d, "feed-det"))) == antes
    finally:
        shutil.rmtree(d)


def t_publicado():
    """O que está publicado na raiz do repositório: leve + detalhe refazem o feed.json (ou uma edição anterior, se o robô
    ainda não rodou — aviso, não falha); nunca um leve quebrado."""
    feed = FEEDS[0]
    if not os.path.exists(feed) or not os.path.exists(os.path.join(RAIZ, "feed-leve.json")): return
    e, txt = FL.conferir(feed)
    print("     publicado:", txt)
    assert e in ("em_dia", "atrasado"), txt


if __name__ == "__main__":
    n = 0
    for nome, fn in list(globals().items()):
        if nome.startswith("t_") and callable(fn):
            fn(); n += 1; print("ok  ", nome)
    print(f"{n} testes ok")
