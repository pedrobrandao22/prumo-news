# Peso do app: núcleo + parte 2 (20/11/2026)

O `index.html` traz só o **núcleo** do app. As funções que não rodam numa visita comum ficam em `parte2.<hash>.js`,
que o navegador baixa sozinho logo depois que a página carrega (e o service worker guarda junto com a página).
No lugar de cada função separada fica um **apelido** de uma linha com o mesmo nome (`function x(){return __p2(k,this,arguments)}`):
se alguém chamar antes de a parte 2 chegar, o apelido busca o arquivo na hora (pedido síncrono) e a chamada segue igual.
Nada muda de comportamento; só o que chega primeiro.

Resultado (20/11): página inicial 640 KB → 483 KB comprimidos; parte 2 com 173 KB, depois da Capa.

## Arquivos
- `frias.json`: a lista do que vai para a parte 2 (nome da função, ordem entre as de mesmo nome e um resumo do texto).
  Função **nova ou mudada** fica no núcleo automaticamente (o resumo do texto não confere). Então, no dia a dia, não é
  preciso mexer aqui.
- `dividir.js`: o `build.py` chama (antes de compactar). `--sem-dividir` no build desliga.
- `cobertura.js`: mede, com o Chromium, quais funções rodam em visitas típicas (sem conta, com conta, computador,
  volta ao app, sem internet) e grava `frias.json`.
- `conferir.js`: abre o site dividido e diz se a parte 2 chegou e se algum apelido precisou buscá-la na hora.

## Publicar (importante)
O build do site de produção (`--saida site-real`) já põe o `parte2.<hash>.js` na raiz do repositório. Ele **precisa
entrar no mesmo commit** do `index.html` (`git add index.html versao.json sw.js parte2.*.js`); sem ele, o site novo
quebra. Nunca apague `parte2.*.js` antigos: quem tem a página antiga guardada no celular ainda busca a parte 2 dela.

## Refazer a medição (quando o app mudar muito)
    cd fonte
    python3 build.py https://teste.supabase.co sb_publishable_teste123 --sem-minificar --sem-dividir --saida site-cob
    node peso/cobertura.js
Depois, rode a bateria em modo de medição para achar o que os testes usam logo na abertura:
    PRUMO_P2_CAPTURA=/tmp/p2cap.log bash testar.sh
e tire de `frias.json` as funções cujos números aparecem como `__p2uso/<n>` no log (o `site/parte2-mapa.json` diz o
nome de cada número). Por fim, a bateria normal tem que ficar verde.
