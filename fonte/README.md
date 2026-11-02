# Prumo News — código-fonte do app

O site publicado (o `index.html` da raiz do repositório) é **gerado** a partir desta pasta. Não edite o `index.html` à mão: mude a fonte aqui, monte e publique.

## Estrutura

| Onde | O que é |
| --- | --- |
| `app/src/pagina.html` | O esqueleto da página. Cada linha `<!--@inclui …-->` é trocada pelo arquivo indicado, na ordem em que aparece. |
| `app/src/css/` | Os estilos, em 10 blocos (o 10, `telas.css`, recebe os estilos das funções novas). |
| `app/src/js/` | O código do app, um arquivo por parte (`001-estado.js` … `090-etapa-76-…`). A ordem importa: várias partes "embrulham" funções de partes anteriores. `999-fim-…` tem de continuar por último. |
| `app/` | Ilustrações (`ill_*.js`), `sw.js` (funcionamento sem internet), `manifest.json`, ícones, fontes e um `feed.json` de exemplo para os testes. |
| `prumo-db.js` | A camada que liga o app ao Supabase. |
| `build.py` | Monta o site: junta a fonte (`montar.py`), põe a URL e a chave **publicável** do Supabase, compacta (`minificar.js`) e grava a pasta de saída. |
| `harness.js`, `t_util.js`, `t_*.js`, `review2/` | Testes automáticos: um navegador de verdade (Playwright) contra um banco Postgres em memória (PGlite) com o mesmo SQL do Supabase. |
| `prumo-supabase.sql` | O banco inteiro como está hoje (usado pelos testes). |
| `prumo-supabase.antes-*.sql`, `prumo-supabase-uso.sql`, `publicacoes-v5/v6.sql` (na raiz) | Versões antigas e partes do banco que alguns testes usam para conferir que o app novo funciona com banco antigo. |
| `sql/publicacoes-v1.sql` … `v7.sql` | As atualizações do banco, na ordem, para rodar no Supabase (SQL Editor › New query › colar › Run). Cada uma só precisa rodar uma vez. Se alguma antiga for rodada de novo, rode a v7 depois: ela reafirma as regras finais de quem lê o quê. |

## Fazer uma mudança

1. Edite o arquivo em `app/src/` (ou crie um novo em `app/src/js/` e inclua-o em `pagina.html`, antes do `999-fim-…`).
2. Teste: `bash testar.sh` (todos, ~25 min) ou `bash testar.sh review2/t_etapa75` (um só). Na primeira vez numa máquina nova: `npm install`, `npm install --no-save playwright` e `npx playwright install chromium` (Python 3 e Node 18+ também são necessários).
3. Monte o site de verdade, com a chave **publicável** (nunca a secreta nem a service_role):
   `python3 build.py https://kkzcljusiotoklldaupg.supabase.co <chave publicável> --saida site-real`
4. Copie `site-real/index.html` e `site-real/versao.json` para a raiz do repositório e faça o commit. O GitHub Pages publica em poucos minutos, e os celulares pegam a versão nova sozinhos.

`python3 montar.py` grava `app/prumo-template.html` (o arquivo único, para conferir), e `python3 montar.py --conferir` diz se ele está igual ao que a fonte monta.

## Testes que dependem do dia

Alguns testes usam o `feed.json` e o `fotos-arquivo.json` publicados na raiz do repositório (variável `PRUMO_REPO`, por padrão a pasta acima desta). Por isso, três deles às vezes falham por causa do conteúdo do dia ou do relógio, sem defeito no app: `t_etapa28` (perto da meia-noite), `t_etapa36` e `t_etapa47` (tempo de animação).

## O que nunca vai para cá

Nenhuma chave secreta do Supabase (`sb_secret_…`, service_role) nem senha. A chave publicável é pública por natureza (está no próprio site) e só é passada na hora de montar.
