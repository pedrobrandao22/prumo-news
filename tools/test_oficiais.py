#!/usr/bin/env python3
"""Testes offline do tools/oficiais.py:  python3 -I tools/test_oficiais.py

As respostas em tools/fixtures/oficiais/ foram MONTADAS à mão no formato documentado de cada API (Câmara v2,
Senado dadosabertos — serviço novo /votacao e agenda antiga em PascalCase —, Banco Central SGS/Olinda/comunicados
do Copom, IBGE calendário v3 e SIDRA). Os números são fictícios: servem para testar o parser, não são notícia.
"""
import copy, importlib.util, json, os, sys, tempfile
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
FX = os.path.join(AQUI, "fixtures", "oficiais")
spec = importlib.util.spec_from_file_location("oficiais", os.path.join(AQUI, "oficiais.py"))
O = importlib.util.module_from_spec(spec); spec.loader.exec_module(O)
FEED = json.load(open(os.path.join(AQUI, "fixtures", "feed_mini.json"), encoding="utf-8"))
QUARTA = datetime.fromisoformat("2026-11-04T19:40-03:00")


def rodar(feed=FEED, anterior=None, agora=QUARTA, fx=FX):
    anterior = anterior if anterior is not None else {"estado": {"ipca_ref": "202608", "pnad_ref": "202609"}}
    return O.executar(feed, anterior, O.Ctx(agora, fx))


def t_helpers():
    assert O.idents("Aprovada a Proposta de Emenda à Constituição nº 18, de 2025, em 2º turno") == {"PEC 18/2025"}
    assert O.idents("PL 1.087/2025, MP 1303/2025 e PLP nº 68/2024") == {"PL 1087/2025", "MPV 1303/2025", "PLP 68/2024"}
    assert O.classe("Aprovada a Proposta de Emenda à Constituição nº 18") == "materia"
    assert O.classe("Rejeitada a Emenda nº 3") == "destaque"
    assert O.classe("Aprovado o Requerimento de urgência para o PL 1/2026") == "urgencia"
    assert O.placar("Sim: 344; não: 132; total: 476.") == (344, 132)
    assert O.turno_de("PEC 18/2025 - 1º turno") == "1º" and O.turno_de("em segundo turno") == "2º"
    assert O.resultado_de("Aprovado") is True and O.resultado_de("R") is False and O.resultado_de(None, "xx") is None
    assert O.fato_votacao("O Senado", None, "PEC 1/2026", None, None, None, "materia") is None  # sem resultado nem placar: nada


def t_eventos_e_ligacao():
    out, ok = rodar()
    assert ok
    ev = {e["id"]: e for e in out["eventos"]}
    v = ev["camara-vot-2401234-56"]
    assert v["fato"] == "A Câmara aprovou o PLP 108/2024 por 300 votos a 120." and v["numero"] == "300 a 120"
    assert v["url"].endswith("idProposicao=2459876") and v["acionar"] is True  # PLP aciona mesmo sem pauta
    assert "camara-vot-2401234-50" not in ev           # destaque fica de fora
    assert "camara-vot-2405555-1" not in ev            # comissão (CCJC) fica de fora
    assert ev["camara-vot-2407777-2"]["acionar"] is False  # PL de data comemorativa sem pauta não aciona
    s1 = ev["senado-vot-7001"]
    assert s1["fato"] == "O Senado aprovou a PEC 18/2025 em 1º turno por 62 votos a 9."
    assert s1["pid"] == "pec-seguranca-ccj" and s1["confianca"] == "palavras"
    c = ev["copom-2026-11-04"]
    assert c["fato"] == "O Copom manteve a Selic em 13,75% ao ano." and c["pid"] == "copom-novembro-selic"
    assert not c["ja_no_feed"]  # a pauta cita 13,75% como expectativa, mas é anterior à decisão
    assert ev["ipca-202609"]["fato"].startswith("O IPCA de setembro de 2026 ficou em 0,48%; em 12 meses, a inflação está em 4,58%")
    assert not any(e["tipo"] == "desemprego" for e in out["eventos"])  # PNAD sem referência nova
    assert not any(e["tipo"] == "focus" for e in out["eventos"])       # Focus só às segundas
    assert set(out["para_pautas"]) == {"pec-seguranca-ccj", "copom-novembro-selic"}
    p = out["para_pautas"]["pec-seguranca-ccj"][0]
    assert p["patch"] == {"op": "update_add", "pid": "pec-seguranca-ccj", "texto": p["texto"]}
    assert "senado-vot-7003" not in ev  # requerimento do Senado fica de fora
    ag = [a["texto"] for a in out["agenda_oficial"]]
    assert "Plenário da Câmara tem na pauta o PLP 108/2024" in ag and "Plenário do Senado tem na pauta o PL 1087/2025" in ag
    assert any(a.startswith("IBGE divulga: Índice Nacional de Preços ao Consumidor Amplo") for a in ag)
    assert not any("Orçamentos Familiares" in a for a in ag)
    assert out["fontes"]["STF: pauta do plenário"].startswith("pulado")
    assert set(out["novos"]) >= {"camara-vot-2401234-56", "copom-2026-11-04", "senado-vot-7001"}


def t_ja_no_feed():
    feed = copy.deepcopy(FEED)
    p = next(p for p in feed["pautas"] if p["id"] == "pec-seguranca-ccj")
    p["atualizacoes"].append({"hora": "2026-11-03T21:48:00-03:00", "texto": "O Senado aprovou a PEC em 1º turno por 62 a 9."})
    out, _ = rodar(feed)
    ev = {e["id"]: e for e in out["eventos"]}
    assert ev["senado-vot-7001"]["ja_no_feed"] is True and ev["senado-vot-7002"]["ja_no_feed"] is False
    assert [x["evento"] for x in out["para_pautas"]["pec-seguranca-ccj"]] == ["senado-vot-7002"]


def t_primeiro_visto_e_estado():
    out1, _ = rodar()
    depois = datetime.fromisoformat("2026-11-04T20:40-03:00")
    out2, _ = rodar(anterior=out1, agora=depois)
    e1 = {e["id"]: e for e in out1["eventos"]}; e2 = {e["id"]: e for e in out2["eventos"]}
    assert e2["copom-2026-11-04"]["primeiro_visto"] == e1["copom-2026-11-04"]["primeiro_visto"] == "2026-11-04T19:40-03:00"
    assert out2["novos"] == []                 # nada novo na 2ª execução
    assert "ipca-202609" in e2                 # o evento continua (estado já é 202609, não duplica)
    assert out2["estado"]["ipca_ref"] == "202609"


def t_falha_de_rede():
    with tempfile.TemporaryDirectory() as vazio:
        out1, _ = rodar()
        out, ok = rodar(anterior=out1, agora=datetime.fromisoformat("2026-11-04T20:40-03:00"), fx=vazio)
        assert ok is False                     # nada respondeu: main() não grava
        assert {e["id"] for e in out["eventos"]} == {e["id"] for e in out1["eventos"]}  # mantém os anteriores
        assert all(v.startswith(("falhou", "pulado", "cache")) for v in out["fontes"].values())
        assert out["fontes"]["IBGE: calendário"].startswith("cache")  # consulta de hoje reaproveitada, sem rede
        # main() com tudo falhando não toca no arquivo
        cam = os.path.join(vazio, "oficiais.json")
        json.dump(out1, open(cam, "w", encoding="utf-8"))
        antes = open(cam, encoding="utf-8").read()
        assert O.main([os.path.join(AQUI, "fixtures", "feed_mini.json"), cam, "--fixtures", vazio, "--agora", "2026-11-04T20:40-03:00"]) == 0
        assert open(cam, encoding="utf-8").read() == antes


def t_sidra_falha_usa_sgs():
    with tempfile.TemporaryDirectory() as d:
        for n in os.listdir(FX):
            if not n.startswith("sidra_"): open(os.path.join(d, n), "w", encoding="utf-8").write(open(os.path.join(FX, n), encoding="utf-8").read())
        out, _ = rodar(fx=d)
        ev = {e["id"]: e for e in out["eventos"]}
        assert ev["ipca-202609"]["numero"] == "0,48%" and "4,58%" in ev["ipca-202609"]["fato"]
        assert "SGS" in out["fontes"]["IBGE: IPCA"]


def t_focus_segunda():
    seg = datetime.fromisoformat("2026-11-09T09:10-03:00")
    out, _ = rodar(agora=seg)
    f = [e for e in out["eventos"] if e["tipo"] == "focus"]
    assert len(f) == 1
    assert f[0]["fato"] == ("Boletim Focus (Banco Central): mediana do IPCA de 2026 em 4,52% (eram 4,55% uma semana antes) "
                            "e mediana da Selic no fim de 2026 em 13,75% (eram 13,75% uma semana antes).")
    assert f[0]["acionar"] is False  # sem pauta do Focus, não aciona


def t_copom_manteve_pela_serie():
    """Sem o comunicado (a API do site do BC deu 400 em 03/11): a série 432 ia até o dia da reunião (04/11) e passa a
    ir até a reunião seguinte (09/12) com o mesmo valor => o Copom manteve."""
    with tempfile.TemporaryDirectory() as d:
        for n in os.listdir(FX):
            if n not in ("bcb_copom.json", "sgs_432.json"): open(os.path.join(d, n), "w", encoding="utf-8").write(open(os.path.join(FX, n), encoding="utf-8").read())
        dias = [datetime(2026, 10, 5).toordinal() + i for i in range(66)]  # 05/10 a 09/12
        serie = [{"data": datetime.fromordinal(o).strftime("%d/%m/%Y"), "valor": "13.75"} for o in dias]
        json.dump(serie, open(os.path.join(d, "sgs_432.json"), "w", encoding="utf-8"))
        est = {"ipca_ref": "202608", "pnad_ref": "202609", "selic_ate": "2026-11-04"}
        out, _ = rodar(anterior={"estado": est}, fx=d)
        s = [e for e in out["eventos"] if e["tipo"] == "selic"]
        assert len(s) == 1 and s[0]["id"] == "copom-2026-11-04" and s[0]["fato"] == "O Copom manteve a Selic em 13,75% ao ano.", s
        assert s[0]["pid"] == "copom-novembro-selic" and s[0]["acionar"] and out["estado"]["selic_ate"] == "2026-12-09"
        # a série andando um dia por vez (ou já longe da reunião) não inventa decisão
        for ate_ant in ("2026-12-08", "2026-10-20"):
            out, _ = rodar(anterior={"estado": dict(est, selic_ate=ate_ant)}, fx=d)
            assert not [e for e in out["eventos"] if e["tipo"] == "selic"], ate_ant
        # sem estado anterior (1ª execução): nada
        out, _ = rodar(fx=d)
        assert not [e for e in out["eventos"] if e["tipo"] == "selic"]


def t_focus_terca_depois_de_feriado():
    """03/11/2026: segunda (2) foi Finados e o Focus saiu na terça, com dados até a sexta (30/10)."""
    with tempfile.TemporaryDirectory() as d:
        for n in os.listdir(FX): open(os.path.join(d, n), "w", encoding="utf-8").write(open(os.path.join(FX, n), encoding="utf-8").read())
        fx = json.load(open(os.path.join(FX, "focus.json"), encoding="utf-8"))
        fx["value"] = [x for x in fx["value"] if x["Data"] <= "2026-10-30"] + [dict(x, Data="2026-10-23") for x in fx["value"] if x["Data"] == "2026-10-30"]
        json.dump(fx, open(os.path.join(d, "focus.json"), "w", encoding="utf-8"))
        ter = datetime.fromisoformat("2026-11-03T11:25-03:00")
        out, _ = rodar(agora=ter, fx=d)
        f = [e for e in out["eventos"] if e["tipo"] == "focus"]
        assert len(f) == 1 and f[0]["id"] == "focus-2026-10-30", f
        out2, _ = rodar(anterior=out, agora=datetime.fromisoformat("2026-11-03T12:25-03:00"), fx=d)
        assert "focus-2026-10-30" not in out2["novos"]  # mesma sexta: não é novo de novo
        qua = datetime.fromisoformat("2026-11-04T11:25-03:00")
        out3, _ = rodar(agora=qua, fx=d)
        assert not [e for e in out3["eventos"] if e["tipo"] == "focus"]


def t_selic_pela_serie():
    with tempfile.TemporaryDirectory() as d:
        for n in os.listdir(FX):
            if n not in ("bcb_copom.json", "sgs_432.json"): open(os.path.join(d, n), "w", encoding="utf-8").write(open(os.path.join(FX, n), encoding="utf-8").read())
        serie = [{"data": f"{x:02d}/10/2026", "valor": "13.75"} for x in range(5, 32)] + \
                [{"data": f"{x:02d}/11/2026", "valor": "13.75"} for x in range(1, 5)] + \
                [{"data": f"{x:02d}/11/2026", "valor": "13.50"} for x in range(5, 20)]
        json.dump(serie, open(os.path.join(d, "sgs_432.json"), "w", encoding="utf-8"))
        out, _ = rodar(fx=d)
        s = [e for e in out["eventos"] if e["tipo"] == "selic"]
        assert len(s) == 1 and s[0]["fato"] == "O Copom reduziu a Selic de 13,75% para 13,50% ao ano; a nova taxa vale a partir de 05/11."
        assert s[0]["pid"] == "copom-novembro-selic" and s[0]["acionar"]
        assert out["fontes"]["Banco Central: Copom/Selic"].startswith("ok: comunicado falhou")


def t_formato_ok_para_aplicar():
    """O patch pronto (+ hora e título, que a rodada escreve) passa no aplicar.py e no validar.py do feed real."""
    import subprocess
    out, _ = rodar()
    for pid, lst in out["para_pautas"].items():
        for x in lst:
            assert x["texto"].endswith(".") and len(x["texto"]) <= 240
            assert not any(v in x["texto"] for v in ("Folha", "g1", "CNN", "Poder360"))  # sem veículo
    feed_real = os.path.join(AQUI, "..", "feed.json")
    if not os.path.exists(feed_real): print("   (sem feed.json ao lado: pulei o aplicar)"); return
    pids = {p["id"] for p in json.load(open(feed_real, encoding="utf-8")).get("pautas") or []}
    x = out["para_pautas"]["copom-novembro-selic"][0]
    if x["patch"]["pid"] not in pids: print("   (pauta do teste saiu do feed: pulei o aplicar)"); return
    patch = [dict(x["patch"], hora="19h48", titulo="Copom mantém a Selic em 13,75% ao ano")]
    with tempfile.TemporaryDirectory() as d:
        json.dump(patch, open(os.path.join(d, "p.json"), "w", encoding="utf-8"), ensure_ascii=False)
        r = subprocess.run([sys.executable, "-I", os.path.join(AQUI, "aplicar.py"), feed_real, os.path.join(d, "p.json"),
                            "-o", os.path.join(d, "novo.json")], capture_output=True, text=True)
        assert r.returncode == 0, r.stdout + r.stderr
        novo = json.load(open(os.path.join(d, "novo.json"), encoding="utf-8"))
        p = next(p for p in novo["pautas"] if p["id"] == "copom-novembro-selic")
        assert p["atualizacoes"][-1]["texto"] == x["texto"]


def t_placar_pronto():
    """Cada votação de mérito do plenário traz o placar pronto para o gráfico placar_votacao do app."""
    out, _ = rodar()
    ev = {e["id"]: e for e in out["eventos"]}
    p1 = ev["senado-vot-7001"]["placar"]
    assert p1["forma"] == "placar_votacao" and p1["casa"] == "senado" and p1["modo"] == "nominal"
    assert (p1["sim"], p1["nao"], p1["abst"], p1["total"]) == (62, 9, 1, 72)
    assert p1["minimo"] == 49 and "3/5" in p1["regra"] and p1["turno"] == "1º" and p1["resultado"] == "aprovado"
    assert p1["proposicao"] == "PEC 18/2025" and p1["fonte"] == "Senado Federal" and p1["url"].endswith("/171234")
    assert p1["itens"] == [{"rotulo": "Sim", "valor": 62}, {"rotulo": "Não", "valor": 9}, {"rotulo": "Abstenção", "valor": 1}]
    assert p1["hora_exata"] is False  # o fixture só tem a abertura da sessão
    assert ev["senado-vot-7002"]["placar"]["turno"] == "2º" and len(ev["senado-vot-7002"]["placar"]["itens"]) == 2  # abstenção 0 sai
    c = ev["camara-vot-2401234-56"]["placar"]
    assert (c["sim"], c["nao"], c["abst"], c["total"], c["minimo"]) == (300, 120, 2, 422, 257) and c["hora_exata"] is True
    assert c["quando"] == "2026-11-04T18:52-03:00" and c["cadeiras"] == 513
    s = ev["camara-vot-2407777-2"]["placar"]  # sem "Sim: …; não: …" na Câmara = votação simbólica
    assert s["modo"] == "simbolica" and s["sim"] is None and s["itens"] == [] and s["resultado"] == "aprovado" and s["minimo"] is None
    assert "maioria simples" in s["regra"]
    for e in out["eventos"]:
        if e.get("tipo") == "votacao" and e.get("classe") != "materia": assert "placar" not in e
    json.dumps(out, ensure_ascii=False)  # serializável


def t_placar_robusto():
    P = O.placar_de
    q = O.data_hora("2026-11-03T19:42")
    assert P("senado", None, "PEC 1/2026", {}, None, q, True, "u") is None                    # sem resultado nem votos: nada
    x = P("senado", True, "PEC 1/2026", {"sim": 70, "nao": 20}, None, q, True, "u")           # 90 > 81: número impossível
    assert x["modo"] == "sem_placar" and x["sim"] is None and x["itens"] == [] and x["resultado"] == "aprovado"
    x = P("senado", False, "PL 5/2026", {"sim": 20, "nao": 30, "abst": None, "total": 999}, "2º", q, True, "u")
    assert x["resultado"] == "rejeitado" and x["total"] == 50 and x["minimo"] is None and x["turno"] == "2º"
    x = P("camara", True, "PEC 9/2025", {"sim": 352, "nao": 134, "abst": 2, "total": 489}, "1º", q, True, "u")
    assert x["minimo"] == 308 and x["total"] == 489 and "PEC 9/2025 no plenário da Câmara · 1º turno" == x["titulo"]
    assert P("stf", True, "X", {"sim": 6, "nao": 5}, None, q, True, "u") is None
    assert P("senado", True, None, {"sim": "62", "nao": 9}, None, q, True, "u")["modo"] == "sem_placar"  # texto em vez de número
    assert O.contagem("Rejeitado. Sim: 10; Não: 300; Abstenções: 4; Total: 314")["abst"] == 4
    assert O.contagem("Aprovado o projeto.") == {"sim": None, "nao": None, "abst": None, "total": None}


def t_placar_hora_exata_senado():
    """Se a API do Senado trouxer a hora da própria votação, o placar usa essa hora (e não a da abertura da sessão)."""
    with tempfile.TemporaryDirectory() as d:
        for n in os.listdir(FX): open(os.path.join(d, n), "w", encoding="utf-8").write(open(os.path.join(FX, n), encoding="utf-8").read())
        sv = json.load(open(os.path.join(FX, "senado_votacoes.json"), encoding="utf-8"))
        sv[0]["dataHoraInicioVotacao"] = "2026-11-03T19:42:10"
        sv[1]["totalVotosSim"] = None; sv[1]["totalVotosNao"] = None  # 2º turno sem os votos na API
        json.dump(sv, open(os.path.join(d, "senado_votacoes.json"), "w", encoding="utf-8"))
        out, _ = rodar(fx=d)
        ev = {e["id"]: e for e in out["eventos"]}
        p = ev["senado-vot-7001"]["placar"]
        assert p["hora_exata"] is True and p["quando"] == "2026-11-03T19:42-03:00" == ev["senado-vot-7001"]["quando"]
        p2 = ev["senado-vot-7002"]["placar"]
        assert p2["modo"] == "sem_placar" and p2["resultado"] == "aprovado" and p2["itens"] == []


def t_placar_fica_7_dias():
    """Votação ligada a uma pauta fica 7 dias (o app mostra o placar na matéria); o resto sai em 3 dias."""
    out1, _ = rodar()
    depois = datetime.fromisoformat("2026-11-08T20:40-03:00")  # 5 dias depois
    with tempfile.TemporaryDirectory() as vazio:
        open(os.path.join(vazio, "camara_votacoes.json"), "w").write('{"dados": []}')
        out2, _ = rodar(anterior=out1, agora=depois, fx=vazio)
    ids = {e["id"] for e in out2["eventos"]}
    assert {"senado-vot-7001", "senado-vot-7002"} <= ids and "camara-vot-2407777-2" not in ids and "copom-2026-11-04" not in ids, ids
    assert out2["para_pautas"] == {} and out2["novos"] == []
    with tempfile.TemporaryDirectory() as nada:  # 8 dias depois, sem rede: o placar sai
        out3, _ = rodar(anterior=out1, agora=datetime.fromisoformat("2026-11-11T20:40-03:00"), fx=nada)
    assert not any(e["id"].startswith("senado-vot-") for e in out3["eventos"])


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
