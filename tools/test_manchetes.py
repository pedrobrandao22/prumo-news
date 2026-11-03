#!/usr/bin/env python3
"""Testes offline da regra do "acionar" e dos "novos relatos" do tools/manchetes.py:
  python3 -I tools/test_manchetes.py
Manchetes fictícias (só título/veículo/hora), sem rede. Feed: tools/fixtures/feed_mini.json (recorte do feed de 03/11).
"""
import copy, importlib.util, json, os, sys
from datetime import datetime, timedelta

AQUI = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("manchetes", os.path.join(AQUI, "manchetes.py"))
M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
FEED = json.load(open(os.path.join(AQUI, "fixtures", "feed_mini.json"), encoding="utf-8"))  # atualizado_em 03/11 10h50
AGORA = datetime.fromisoformat("2026-11-03T12:40-03:00")


def mk(titulo, fonte, hhmm, secao=None):
    h = datetime.fromisoformat(f"2026-11-03T{hhmm}:00-03:00")
    return {"titulo": titulo, "url": f"https://x.example/{fonte}/{abs(hash(titulo))}", "hora": h, "fonte": fonte,
            "veiculo": fonte, "secao": secao, "tk": M.tokens(titulo), "img": "", "cred": ""}


def rodar(itens, feed=FEED, agora=AGORA, **kw):
    return M.analisar([dict(x) for x in itens], feed, agora, **kw)


POL = [mk("Haddad deixa o Ministério da Fazenda e Lula anuncia Durigan interino", "p360", "11:30"),
       mk("Lula anuncia Durigan como ministro interino da Fazenda após saída de Haddad", "cnn", "11:45"),
       mk("Saída de Haddad: Durigan assume Fazenda interinamente, anuncia Lula", "met", "12:05", "politica")]


def t_compat():
    out = rodar(POL)
    for k in ("gerado", "desde", "feed_atualizado_em", "resumo", "acionar", "novos", "em_pautas", "fotos_livres"):
        assert k in out, k
    for k in ("manchetes", "assuntos_novos_relevantes", "assuntos_novos", "pautas_com_novidade", "pautas_com_novidade_3_fontes"):
        assert k in out["resumo"], k
    n = out["novos"][0]
    for k in ("assunto", "secao", "n_fontes", "fontes", "ja_e_breve", "relevante", "manchetes"):
        assert k in n, k


def t_politica_3_em_90min_aciona():
    out = rodar(POL)
    assert out["acionar"] is True and out["acionar_itens"][0]["tipo"] == "novo"
    assert "3 veículos em 90 min" in out["acionar_motivo"]


def t_espalhado_nao_aciona():
    def em(*hs): return [dict(x, hora=datetime.fromisoformat(f"2026-11-03T{h}:00-03:00")) for x, h in zip(POL, hs)]
    out = rodar(em("10:45", "11:30", "12:30"))  # 3 veículos, mas nunca 3 dentro de 90 min
    assert out["acionar"] is False, out["acionar_motivo"]
    assert out["novos"][0]["relevante"] is True and out["novos"][0]["n_fontes_90min"] == 2  # campo antigo igual
    assert rodar(em("11:00", "11:30", "12:20"))["acionar"] is True  # 80 min


def t_esporte_precisa_de_6():
    base = "Jesús de Miguel, atacante do Tenerife, morre após choque com goleiro"
    its = [mk(base + s, f, "12:%02d" % (5 + i), "esportes") for i, (f, s) in enumerate(
        [("ge", ""), ("folha", " na Espanha"), ("cnn", " em jogo"), ("bbc", " na Espanha"), ("p360", "")])]
    assert rodar(its)["acionar"] is False
    its.append(mk(base + " aos 24 anos", "im", "12:20", "esportes"))
    assert rodar(its)["acionar"] is True


def t_lixo_nunca():
    its = [mk("Horóscopo do dia: veja a previsão para o seu signo nesta terça", f, "12:%02d" % (10 + i)) for i, f in
           enumerate(["p360", "cnn", "met", "g1", "folha"])]
    out = rodar(its)
    assert out["acionar"] is False and out["novos"][0].get("lixo") and out["novos"][0]["relevante"] is False
    its = [mk("VÍDEOS: Bom Dia DF de terça-feira, 3 de novembro de 2026", "g1", "11:00"),
           mk("Durigan prevê alíquota menor para imposto do pecado", "folha", "11:10", "economia")]
    out = rodar(its)
    assert "pec-seguranca-ccj" not in out["novos_relatos"]  # data no título não liga mais manchete a pauta


def t_novos_relatos_e_pauta_principal_parada():
    its = [mk("Senado começa a votar a PEC da Segurança Pública no plenário", "agsenado", "11:20", "politica"),
           mk("PEC da Segurança: Senado abre sessão e governo busca acordo", "p360", "12:10")]
    out = rodar(its)
    r = out["novos_relatos"]["pec-seguranca-ccj"]
    assert r["n"] == 2 and r["n_fontes"] == 2 and r["principal"] is True and r["ultima"] == "03/11 12h10"
    assert r["horas_sem_atualizar"] == 5.8 and r["pauta_atualizada_em"].startswith("2026-11-03T06:52")
    it = out["acionar_itens"][0]
    assert out["acionar"] and it["tipo"] == "pauta" and it["pid"] == "pec-seguranca-ccj"
    assert "sem atualização há 5.8 h" in it["motivo"]
    # pauta atualizada há pouco: 2 veículos não bastam
    feed = copy.deepcopy(FEED)
    next(p for p in feed["pautas"] if p["id"] == "pec-seguranca-ccj")["atualizacoes"].append(
        {"hora": "2026-11-03T11:30:00-03:00", "texto": "x"})
    out = rodar(its, feed)
    assert out["novos_relatos"]["pec-seguranca-ccj"]["n"] == 1 and out["acionar"] is False


def t_ja_visto_por_rodada_nao_repete():
    out1 = rodar(POL, agora=datetime.fromisoformat("2026-11-03T12:41-03:00"))
    assert out1["acionar"]
    rodadas = {"dia": "2026-11-03", "itens": {"12h48": {"tipo": "rapida", "status": "sem_mudancas"}}}
    agora2 = datetime.fromisoformat("2026-11-03T13:40-03:00")
    out2 = rodar(POL, agora=agora2, anterior=out1, rodadas=rodadas)
    assert out2["acionar"] is False and out2["resumo"]["ja_avaliados"] == 1, out2["acionar_motivo"]
    assert out2["avaliados"] and "já vistos" in out2["acionar_motivo"]
    # sem rodada no meio (a das 12h48 não rodou): continua acionando
    out2b = rodar(POL, agora=agora2, anterior=out1, rodadas={"dia": "2026-11-03", "itens": {}})
    assert out2b["acionar"] is True
    # o assunto cresceu 2 veículos: aciona de novo
    mais = POL + [mk("Durigan assume a Fazenda no lugar de Haddad", "ab", "13:10"),
                  mk("Haddad sai da Fazenda; Durigan fica interino, diz Lula", "folha", "13:20", "politica")]
    out3 = rodar(mais, agora=agora2, anterior=out1, rodadas=rodadas)
    assert out3["acionar"] is True
    # a memória passa adiante para a hora seguinte
    out4 = rodar(POL, agora=datetime.fromisoformat("2026-11-03T14:40-03:00"), anterior=out2, rodadas=rodadas)
    assert out4["acionar"] is False


def t_dado_oficial_aciona():
    of = {"eventos": [{"id": "copom-2026-11-03", "fonte": "Banco Central", "tipo": "selic", "acionar": True,
                       "ja_no_feed": False, "pid": "copom-novembro-selic", "primeiro_visto": "2026-11-03T12:25-03:00",
                       "fato": "O Copom manteve a Selic em 13,75% ao ano."},
                      {"id": "velho", "acionar": True, "primeiro_visto": "2026-11-02T12:25-03:00", "fato": "x"},
                      {"id": "ja", "acionar": True, "ja_no_feed": True, "primeiro_visto": "2026-11-03T12:25-03:00", "fato": "y"}]}
    out = rodar([], oficiais=of)
    assert out["acionar"] and [i["id"] for i in out["acionar_itens"]] == ["copom-2026-11-03"]
    assert out["acionar_motivo"].startswith("dado oficial (Banco Central): O Copom manteve")


def t_nada():
    out = rodar([])
    assert out["acionar"] is False and out["acionar_motivo"].startswith("nada novo")


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
