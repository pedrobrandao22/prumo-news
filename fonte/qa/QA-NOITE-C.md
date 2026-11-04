# QA da noite C — regressão geral (04/11, depois dos arquivos 100–124)

Estado testado: produção (foco, visual novo com o cartão A, fase 2, sem reels, abre na Capa), com a edição real do
repositório servida como o GitHub Pages (feed-leve.json + feed-det/, oficiais.json, series/, acervo/). Leitor (visitante)
e membros (Pedro admin, Bia amiga). 360/390/430 px, claro/escuro, letra no máximo (1,4), sem internet, 3G lento e 4G com
CPU 4× mais lenta. Teste automático: `review2/t_qa_noite_c.js` (portas 8764–8765, 72 checagens). Correções em
`app/src/js/127-qa-noite-c.js` e `app/src/css/42-qa-noite-c.css` (incluídos por último, antes do `999-fim`).

Resumo: a passada funcional (Capa, matéria com capítulos, Neutra/Direita/Esquerda, placar oficial, gráficos, fotos e
créditos; Feed com cartões, prateleiras, fio e Contexto; Giro e visualizador; Busca e hashtags; Em 5 min, Quiz,
indicadores; Guardadas; Perfil próprio e de amiga com abas; Arquivados; Ajustes; Administração com as 6 abas; Conversas;
criação de cada tipo de post e de um giro; sem internet) **não achou erro de JavaScript nem nada saindo da tela** em
nenhuma das combinações. Os problemas achados são de iPhone antigo e de desempenho.

| id | gravidade | estado |
| --- | --- | --- |
| NC01 | média | corrigido |
| NC02 | média | corrigido |
| NC03 | baixa | corrigido |
| NC04 | média (desempenho) | corrigido |
| NC05 | média (desempenho) | aberto |
| NC06 | baixa (tamanho) | aberto |
| NC07 | baixa (conteúdo) | aberto, fora do app |

## NC01 — iPhone com iOS 15 a 16.1: fundos transparentes e gráficos sem barras (média, corrigido)
O Safari só entende `color-mix()` a partir do iOS 16.2. O CSS usa `color-mix` em 32 lugares, vários sem nenhuma
outra cor antes: a declaração inteira é descartada.
- Passos: abrir a matéria e rolar; abrir Perfil › Ajustes do app (qualquer folha); ver um gráfico do acervo/indicador.
- Esperado: barra do topo da matéria e folhas com fundo; barras dos gráficos visíveis.
- Antes: topo da matéria **transparente** (o texto passa por baixo de "‹ Capa"), folhas transparentes (a Capa aparece
  entre os cartões), índice "Nesta matéria" transparente, barras dos gráficos novos e do acervo invisíveis, quadrados do
  mapa do acervo **pretos** (o `fill` cai para o padrão do SVG), anéis de "visto" sem cor.
- Capturas (simulação: o mesmo index com `color-mix(` trocado por um nome inválido): `noite-c/nc-ios-sem-colormix-materia-antes.png`
  × `-depois.png`, `nc-ios-sem-colormix-folha-antes(-escuro).png` × `-depois(-escuro).png`.
- Correção: `@supports not (color:color-mix(in srgb,red 50%,blue)){…}` no css/42 com cores equivalentes (fundo sólido
  `--card`/`--bg`, acento com opacidade, rgba). No mapa do acervo (110) cada quadrado leva também `--qc127o` (intensidade)
  e `data-qc127o`, usados só pela reserva. Nada muda em navegador novo.

## NC02 — iPhone com iOS 15.0–15.3 (sem `:has()`): mensagens atrás da barra de resposta (média, corrigido)
`body.dm-conv:has(#respbar) .app{padding-bottom:…}` (e o mesmo para `.dm104-am`) é a única coisa que afasta as últimas
mensagens da barra "Respondendo a…". Também por `:has()`: o aviso (toast) sobe para o topo com a criação/o giro abertos
(senão fica atrás dos botões de baixo) e a criação de notícia esconde o fundo atrás do cartão.
- Passos: conversa › segurar uma mensagem › Responder.
- Esperado: a última mensagem continua visível acima da barra. Antes (Safari < 15.4): coberta pela barra.
- Correção: o 127 testa `CSS.supports("selector(:has(*))")`; só quando não há suporte, um MutationObserver (com rAF)
  põe no `body` as classes `qc127-respbar`, `qc127-am`, `qc127-ce`, `qc127-story` e na `.ce` a `qc127-cs`; o css/42 repete
  as regras com essas classes. Em navegador novo nada roda. O teste simula o Safari sem `:has()` e confere as classes e o
  `padding-bottom` ≥ 136 px.

## NC03 — iOS < 15.4 (sem `dvh`): alturas da criação e da conversa (baixa, corrigido)
`max-height:62dvh`/`58dvh` (prévia da foto na criação), `width:calc((100dvh - 210px)*9/16)` (tela do giro), `--bw`
do texto do giro e `min-height:calc(100dvh - 160px)` da conversa não tinham versão em `vh` antes. Correção:
`@supports not (height:1dvh){…}` com as mesmas contas em `vh`.

Conferido e sem problema: nenhuma regex com lookbehind; `structuredClone`, `requestIdleCallback`, `randomUUID`,
`Intl.Segmenter`, `MediaRecorder`, `roundRect`, `startViewTransition` sempre com reserva; sem `Array.at`, `Object.hasOwn`,
`findLast`, `toSorted`, `groupBy`, `withResolvers`, `AbortSignal.timeout`; o esbuild já baixa a sintaxe para ES2019
(`?.`, `??`); `backdrop-filter` sempre com `-webkit-`; sem CSS aninhado, `@container`, `@layer`.

## NC04 — 3G lento: primeira pintura ~0,8 s mais tarde que ontem (média, corrigido)
Medido com `review2/t_desempenho.js` (agora aceita `PERF_RTT`, `PERF_KBPS`, `PERF_PORTA`), CPU 4×, abertura fria,
mediana de 3: 3G lento (400 ms, 400 kbit/s) primeira pintura 2,93 s (ontem, ad3324c) → 3,70 s (hoje). O `<head>` tem
todo o CSS: 62 → 76 KB gzip (+13,6 KB), e no 3G ele divide a banda com o feed-leve e com as duas fontes em `preload`
(132 + 27 KB, sem gzip). Correção: sem `preload` das fontes (pagina.html). Com `font-display:swap` elas chegam muito
antes de a Capa ter conteúdo (que só vem com o código, ~15 s no 3G frio); na volta ao app vêm do aparelho.
Resultado: 3,70 → **3,16 s** no 3G lento (só tirar a Newsreader: 3,40 s); 4G: 1,12 → 1,04 s; tempo até a Capa com
conteúdo igual (15,0–15,3 s no 3G, 4,5 s no 4G).

## NC05 — Feed: tarefas longas ao rolar (média, aberto)
CPU 4×, 390×844, 30 rolagens: tarefas longas de 200–380 ms (3 a 5 acima de 150 ms por passada), iguais às de ontem.
Perfil: cada `carregarMais` (6 posts) leva 225–325 ms: ~80 ms montando o HTML (o 112/113/117 transformam o HTML do
post em DOM e de volta em texto várias vezes, `vn112Tp`) e ~130 ms no primeiro layout dos 6 posts novos (forçado pela
medida das ações do cartão A, `vn112Aperta`, e do carrossel, `fitTrack`/`ssCaber`). Tentei (1) medir as ações em lote
e só dos posts perto da tela, (2) juntar as duas chamadas seguidas do `ssCaber` e (3) não refazer o `fitTrack` quando o
post volta à tela sem mudança: o custo só mudou de lugar (vai para o `fit108Roda`) e o tempo ocupado subiu ~10 %;
**revertido**. Caminhos para depois: lotes de 3 posts, ou montar o cartão uma vez só (sem o vai-e-volta de HTML).

## NC06 — app ~23 % maior em 24 h (baixa, aberto)
`index.html` publicado: 1,32 MB (gzip 373 KB) ontem 04h27 → 1,63 MB (gzip 456 KB) hoje; JS 996 → 1.221 KB, CSS 320 →
400 KB. Só a publicação de 01h35 (colunas, seguir, notificações) somou +96 KB. Efeito medido (CPU 4×): volta ao app
(service worker) Capa em 1,45 → 1,56–1,67 s; a tarefa longa do script principal 975 → 1.066 ms; 1ª abertura no 3G
14,8 → 15,1 s; trocas de aba, story e matéria iguais (± ruído). Candidatos a carregar sob demanda: Administração
(031, 95 KB), criação de giro/câmera/figurinhas/Reels desligados (071/077/094/095/096, ~165 KB).

## NC07 — Capa: imagem "49 de 81 votos" na manchete "por 75 votos" (baixa, conteúdo)
A manchete "Senado aprova a PEC da Segurança por 75 votos" usa o infográfico antigo do mínimo ("49 de 81 votos ·
Mínimo de 49 votos em cada um dos dois turnos"). O placar oficial certo (75) está no capítulo "Placar oficial" da
matéria. É do conteúdo/robô (visual da pauta), não do app.

## Informativo
- `abrirNovCapa` e `capaNovBar` são declaradas duas vezes (033 e 043); a segunda vale (de propósito, desde 02/11).
  Nenhuma outra declaração de topo (function/var/const/let) repetida.
- A pasta `qa/` está no `.gitignore` (este arquivo e as capturas não vão para o repositório).
