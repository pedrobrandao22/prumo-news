#!/usr/bin/env python3
"""Monta o modelo do app (o antigo prumo-template.html) a partir de app/src/: pagina.html com as linhas
<!--@inclui css/…--> e <!--@inclui js/…--> trocadas pelo conteúdo de cada arquivo, na ordem em que aparecem.
Uso: python3 montar.py            → grava app/prumo-template.html
     python3 montar.py --conferir → só confere se app/prumo-template.html está igual ao que a fonte monta"""
import os, re, sys
AQUI = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(AQUI, 'app', 'src')
def montar():
    pag = open(os.path.join(SRC, 'pagina.html'), encoding='utf-8', newline='').read()
    usados = set()
    def troca(m):
        nome = m.group(1); usados.add(nome)
        return open(os.path.join(SRC, nome), encoding='utf-8', newline='').read()
    t = re.sub(r'^<!--@inclui ([\w./-]+)-->\n', troca, pag, flags=re.M)
    sobra = {os.path.join(d, f) for d in ('css', 'js') for f in os.listdir(os.path.join(SRC, d))} - usados
    if sobra: sys.exit('arquivos na fonte que a pagina.html não inclui: ' + ', '.join(sorted(sobra)))
    return t
if __name__ == '__main__':
    t = montar(); alvo = os.path.join(AQUI, 'app', 'prumo-template.html')
    if '--conferir' in sys.argv:
        if not os.path.exists(alvo): print('app/prumo-template.html não existe (rode python3 montar.py para gerar)'); sys.exit(1)
        ok = open(alvo, encoding='utf-8', newline='').read() == t
        print('igual' if ok else 'DIFERENTE'); sys.exit(0 if ok else 1)
    open(alvo, 'w', encoding='utf-8', newline='').write(t); print('montado:', alvo, len(t), 'caracteres')
