"""Endereço da notícia pelo título (paginas.py, 16/11): slug, índice, colisão e links antigos que continuam valendo."""
import importlib.util, json, os, shutil, sys, tempfile
AQ = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("paginas", os.path.join(AQ, "paginas.py")); P = importlib.util.module_from_spec(spec); spec.loader.exec_module(P)
ok = 0
def t(c, msg, *x):
    global ok
    if not c: print("FALHA", msg, *x); sys.exit(1)
    ok += 1; print("ok  ", msg)
t(P.slug_de("Lula diz que buscou outros parceiros após tarifaço") == "lula-diz-que-buscou-outros-parceiros-apos-tarifaco", "slug: sem acento, minúsculo, com hífen")
t(P.slug_de("Ibovespa sobe 0,66% a 172.458; dólar fecha a R$ 5,67") == "ibovespa-sobe-0-66-a-172-458-dolar-fecha-a-r-5-67", "slug: números e símbolos viram hífen")
l = P.slug_de("palavra " * 30); t(len(l) <= 70 and not l.endswith("-") and l.endswith("palavra"), "slug: até 70 letras sem cortar palavra")
d = tempfile.mkdtemp()
try:
    F = {"pautas": [{"id": "lula-4", "neutro": {"titulo": "Lula diz que buscou outros parceiros"}, "subtitulo": "x"},
                    {"id": "outra", "neutro": {"titulo": "Lula diz que buscou outros parceiros"}, "subtitulo": "y"}]}
    fj = os.path.join(d, "feed.json"); json.dump(F, open(fj, "w")); m = os.path.join(d, "m")
    P.main([fj, m, os.path.join(d, "nada.json")])
    ind = json.load(open(os.path.join(m, "indice.json")))
    t(ind["lula-4"] == "lula-diz-que-buscou-outros-parceiros" and ind["outra"].startswith("lula-diz-que-buscou-outros-parceiros-"), "índice: título repetido ganha sufixo e não toma o endereço da outra", ind)
    t(os.path.exists(os.path.join(m, "lula-4.html")) and os.path.exists(os.path.join(m, "lula-diz-que-buscou-outros-parceiros.html")), "grava a página pelo id (links antigos) e pelo título")
    t('location.replace("/#m=lula-4")' in open(os.path.join(m, "lula-diz-que-buscou-outros-parceiros.html")).read(), "a página pelo título leva à notícia certa")
    t('canonical" href="https://prumonews.com.br/m/lula-diz-que-buscou-outros-parceiros.html"' in open(os.path.join(m, "lula-4.html")).read(), "endereço oficial (canonical) é o pelo título")
    # o título muda: endereço novo, o antigo continua levando à notícia
    F["pautas"][0]["neutro"]["titulo"] = "Lula fala de novos parceiros comerciais"; json.dump(F, open(fj, "w"))
    P.main([fj, m, os.path.join(d, "nada.json")])
    ind = json.load(open(os.path.join(m, "indice.json")))
    t(ind["lula-4"] == "lula-fala-de-novos-parceiros-comerciais" and 'location.replace("/#m=lula-4")' in open(os.path.join(m, "lula-diz-que-buscou-outros-parceiros.html")).read(), "título mudou: endereço novo e o antigo continua valendo")
    antes = sorted(os.listdir(m)); P.main([fj, m, os.path.join(d, "nada.json")]); t(sorted(os.listdir(m)) == antes, "rodar de novo não muda nada")
finally:
    shutil.rmtree(d)
print(f"{ok} ok")
