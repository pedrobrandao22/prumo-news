#!/usr/bin/env python3
"""Monta o site do Prumo News.

Fonte: app/src/pagina.html + app/src/css/*.css + app/src/js/*.js (montar.py junta, na ordem da pagina.html).
Uso:  python3 build.py [URL_DO_SUPABASE] [CHAVE_PUBLICAVEL] [--saida PASTA] [--sem-minificar]
Sem URL e chave, o app abre só para leitura (sem login).
Gera PASTA (padrão: site/) com index.html, manifest.json, ícones, feed.json, rodadas.json e erros-respostas.json.
Só aceita a chave PUBLICÁVEL (sb_publishable_… ou a chave "anon"). Nunca use a service_role/secret aqui.
"""
import base64, datetime, json, os, re, shutil, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(AQUI, 'app')


def ler(*p):
    return open(os.path.join(*p), encoding='utf-8').read()


def papel_jwt(k):
    try:
        meio = k.split('.')[1]
        meio += '=' * (-len(meio) % 4)
        return json.loads(base64.urlsafe_b64decode(meio)).get('role')
    except Exception:
        return None


def chave_ok(k):
    """Só a chave publicável: sb_publishable_… ou o JWT antigo com role "anon"."""
    if re.match(r'^sb_publishable_[A-Za-z0-9_\-]+$', k):
        return True, ''
    if k.startswith('sb_secret_'):
        return False, 'Essa é a chave SECRETA (sb_secret_…). Ela nunca pode ir para o site. Use a chave publicável (sb_publishable_…).'
    if re.match(r'^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$', k):
        papel = papel_jwt(k)
        if papel == 'anon':
            return True, ''
        if papel == 'service_role':
            return False, 'Essa é a chave service_role (secreta). Ela nunca pode ir para o site. Use a chave publicável (sb_publishable_…) ou a "anon".'
        return False, 'Chave JWT com papel "%s". Só a chave "anon" (ou sb_publishable_…) pode ir para o site.' % papel
    return False, 'Chave não reconhecida. Use a chave publicável do Supabase (começa com sb_publishable_…) ou a chave "anon".'


def main(argv):
    saida = os.path.join(AQUI, 'site')
    args = []
    minificar = '--sem-minificar' not in argv
    argv = [a for a in argv if a != '--sem-minificar']
    i = 0
    while i < len(argv):
        if argv[i] == '--saida':
            saida = os.path.abspath(argv[i + 1]); i += 2; continue
        args.append(argv[i]); i += 1
    url = (args[0] if len(args) > 0 else '').strip().rstrip('/')
    key = (args[1] if len(args) > 1 else '').strip()
    if url and not re.match(r'^https://[A-Za-z0-9.-]+(:\d+)?$', url):
        sys.exit('URL inválida: use algo como https://xxxx.supabase.co')
    if bool(url) != bool(key):
        sys.exit('Passe a URL e a chave publicável juntas (ou nenhuma das duas).')
    if key:
        bom, msg = chave_ok(key)
        if not bom:
            sys.exit(msg)

    if os.path.isdir(os.path.join(APP, 'src')):  # fonte organizada em app/src (pagina.html + css/ + js/)
        sys.path.insert(0, AQUI); import montar
        t = montar.montar()
    else:
        t = ler(APP, 'prumo-template.html')
    for ph in ('%%ILL%%', '%%PRUMO_DB%%', '%%SB_URL%%', '%%SB_KEY%%'):
        assert t.count(ph) == 1, ph
    t = t.replace('%%ILL%%', ler(APP, 'ill_block.js') + '\n' + ler(APP, 'ill_extra.js'))
    t = t.replace('%%PRUMO_DB%%', ler(AQUI, 'prumo-db.js'))
    t = t.replace('%%SB_URL%%', url).replace('%%SB_KEY%%', key)
    versao = None
    if t.count('%%VERSAO%%') == 1:  # código da versão: o app compara com versao.json e se atualiza sozinho
        import hashlib
        versao = hashlib.sha1(t.encode('utf-8')).hexdigest()[:12]
        t = t.replace('%%VERSAO%%', versao)

    os.makedirs(saida, exist_ok=True)
    open(os.path.join(saida, 'index.html'), 'w', encoding='utf-8').write(t)
    if minificar:  # app mais leve: compacta scripts e estilos (os nomes globais continuam iguais)
        import subprocess
        try:
            subprocess.run(['node', os.path.join(AQUI, 'minificar.js'), os.path.join(saida, 'index.html')], check=True, cwd=AQUI, timeout=120)
        except Exception as e:
            print('aviso: não deu para compactar (' + str(e) + '); o site sai sem compactar')
    if versao: json.dump({"v": versao}, open(os.path.join(saida, 'versao.json'), 'w', encoding='utf-8'))
    if os.path.isdir(os.path.join(APP, 'fontes')):  # fontes do próprio site (sem depender do Google)
        shutil.copytree(os.path.join(APP, 'fontes'), os.path.join(saida, 'fontes'), dirs_exist_ok=True)
    for f in ['sw.js', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'feed.json']:
        shutil.copy(os.path.join(APP, f), os.path.join(saida, f))
    hoje = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).strftime('%Y-%m-%d')
    rod = {"dia": hoje, "itens": {
        "06h52": {"tipo": "completa", "status": "ok", "pautas": 31, "mudancas": 12, "checagem": "números conferidos em 9 notícias"},
        "07h48": {"tipo": "rapida", "status": "ok", "pautas": 31, "mudancas": 3, "checagem": "sem alertas"},
        "08h48": {"tipo": "rapida", "status": "sem_mudancas", "pautas": 31, "mudancas": 0},
    }}
    json.dump(rod, open(os.path.join(saida, 'rodadas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if not os.path.exists(os.path.join(saida, 'erros-respostas.json')):
        json.dump({"00000000-0000-0000-0000-000000000000": {"status": "corrigido", "resposta": "Exemplo: o placar foi corrigido para 2 a 1."}},
                  open(os.path.join(saida, 'erros-respostas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('site montado em', saida, '(com login)' if url else '(só leitura, sem login)')


if __name__ == '__main__':
    main(sys.argv[1:])
