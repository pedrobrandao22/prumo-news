# Peso do app: núcleo + parte 2 + parte 3 (20/11/2026)

O app abre sempre na **Capa**, e o código chega em três pedaços:

| pedaço | onde | o que tem | quando chega |
|---|---|---|---|
| núcleo (parte 1) | dentro do `index.html` | o que a Capa precisa para abrir, mais as notificações (sino, novidades, conversas não lidas) e o que roda sozinho nos primeiros segundos | junto com a página |
| parte 2 | `parte2.<hash>.js` | Feed, matéria, busca, giro (stories), Atividade e Conversas | assim que a Capa aparece na tela |
| parte 3 | `parte3.<hash>.js` | o resto: criar post, editores, administração, telas raras | depois da parte 2, num momento ocioso |

Se o app não abriu na Capa (link de matéria, `#algo` ou `?x=` no endereço), a parte 2 é buscada já de partida.

No lugar de cada função separada fica um **apelido** de uma linha com o mesmo nome
(`function x(){return __p2(k,this,arguments)}`, ou `__p3`). Se alguém chamar antes de a parte chegar, o apelido busca o
arquivo na hora (pedido síncrono, marcado em `window.__psinc`) e a chamada segue igual. Nada muda de comportamento; só a
ordem de chegada.

## Arquivos
- `frias.json` (versão 2): `{"partes":{"2":[chaves],"3":[chaves]}}`. A chave de cada função é um resumo do texto dela;
  função **nova ou mudada** fica no núcleo automaticamente. No dia a dia, não é preciso mexer aqui.
- `unidades.js`: diz quais funções podem sair do núcleo (funções de topo; ficam as curtas, as usadas com `new` e as que
  dependem de `arguments`/`new.target`/`super`).
- `dividir.js`: o `build.py` chama (antes de compactar). `--sem-dividir` no build desliga.
- `cobertura.js`: abre o app na Capa com o Chromium (visitante no celular e no computador, membro, administrador) e mede
  o que roda (1) parado na Capa por 12 s, na volta ao app e sem internet (vira núcleo) e (2) usando Feed, matéria,
  busca, giro, Atividade e Conversas (vira parte 2). O resto vai para a parte 3. Grava `frias.json`.
- `conferir.js`: abre o site dividido e diz se as partes chegaram e se algum apelido precisou buscá-las na hora.

## Publicar (importante)
O build do site de produção (`--saida site-real`) já põe `parte2.<hash>.js` e `parte3.<hash>.js` na raiz do
repositório. Eles **precisam entrar no mesmo commit** do `index.html` (`git add index.html versao.json sw.js parte*.js`);
sem eles, o site novo quebra. Nunca apague `parte*.js` antigos: quem tem a página antiga guardada no celular ainda busca
as partes dela.

## Refazer a medição (quando o app mudar muito)
    cd fonte
    python3 build.py https://teste.supabase.co sb_publishable_teste123 --sem-minificar --sem-dividir --saida site-cob
    node peso/cobertura.js
Depois, rode a bateria em modo de medição para achar o que os testes usam antes de a parte chegar:
    PRUMO_P2_CAPTURA=/tmp/pcap.log bash testar.sh
e devolva ao núcleo as funções que aparecem como `__p2uso/<parte>/<n>` no log (o `site/partes-mapa.json` diz a chave
e o nome de cada número). Por fim, a bateria normal tem que ficar verde.
