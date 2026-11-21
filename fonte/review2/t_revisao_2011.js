// Revisão geral 20/11 (achados do testador). Porta 9423.
//  1. "Acabou de sair"/AGORA: título "Tema: entenda…" não vira só o tema (assuntoCurto devolve vazio e usa outro veículo)
//  2. Nova publicação só com a notícia: o primeiro toque em Publicar pergunta; o segundo publica; escrever desfaz a pergunta
//  3. Pílula "Sem conexão": some sozinha em 4 s e nem aparece se o aviso do topo já está na tela
//  4. Cartões do topo do Feed: texto do desenho (placar, legenda) escondido atrás do título
//  5. "Nesta matéria": faixa para sempre no começo de uma aba (scroll-snap)
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 9423, BASE = `http://localhost:${PORTA}/index.html`;
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const b = await U.navegador();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const P = U.erros(await ctx.newPage(), 'P'); await P.goto(BASE);
  await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && window.__prumoPronto, null, 15000);
  // 1
  const r1 = await P.evaluate(() => [assuntoCurto('Supercélula de tempestade: entenda o que é fenômeno que devastou Tupanciretã, no RS'),
    assuntoCurto('DOAÇÕES: Veja como ajudar famílias atingidas'), assuntoCurto('Câmara aprova o ajuste fiscal; veja como votou cada deputado'),
    assuntoCurto('Tempestade causa mortes em Tupanciretã (RS)')]);
  ok(r1[0] === '' && r1[1] === '', '1: "Tema: entenda/veja…" não vira título solto', r1);
  ok(r1[2] === 'Câmara aprova o ajuste fiscal' && r1[3] === 'Tempestade causa mortes em Tupanciretã (RS)', '1: título com o fato continua (corta só o "veja" depois do ponto e vírgula)', r1);
  // 2
  const r2 = await P.evaluate(async () => {
    if (window.__pCarrega) { __pCarrega(2); __pCarrega(3) } await new Promise(r => setTimeout(r, 600));
    const L = document.getElementById('layer'); L.insertAdjacentHTML('beforeend', '<div id="t2011"><button type="button" data-cp152pub>Publicar</button></div>');
    const p = FEED.pautas[0]; CR155.pid = p.id; CP152.txt = ''; let n = 0; const orig = cp206Publica164; cp206Publica164 = function () { n++ };
    const btn = () => L.querySelector('#t2011 [data-cp152pub]');
    cp152Publica(); const a = { n, txt: btn().textContent };
    cp152Publica(); const bb = { n };
    CP152.semCom = 0; btn().textContent = 'Publicar'; cp152Publica(); const c0 = btn().textContent; CP152.txt = 'Acho importante'; cp152Ok(); const c1 = btn().textContent;
    cp152Publica(); const d = { n };
    cp206Publica164 = orig; CR155.pid = null; CP152.txt = ''; document.getElementById('t2011').remove();
    return { a, bb, c0, c1, d };
  });
  ok(r2.a.n === 0 && /sem comentar/.test(r2.a.txt), '2: primeiro toque só pergunta "Publicar sem comentar?"', r2);
  ok(r2.bb.n === 1, '2: segundo toque publica', r2);
  ok(/sem comentar/.test(r2.c0) && r2.c1 === 'Publicar' && r2.d.n === 2, '2: ao escrever, o botão volta a "Publicar" e publica de primeira', r2);
  // 3
  const r3 = await P.evaluate(async () => {
    document.querySelectorAll('.late.offl').forEach(x => x.remove());
    sr209Faixa(true); const f = document.getElementById('sr209'); const a = f && !f.classList.contains('some');
    await new Promise(r => setTimeout(r, 4300)); const b = f.classList.contains('some') && getComputedStyle(f).visibility === 'hidden';
    sr209Faixa(false); await new Promise(r => setTimeout(r, 2400));
    const av = document.createElement('div'); av.className = 'late offl'; av.textContent = 'Sem conexão. Mostrando a edição'; document.getElementById(VIEW === 'capa' ? 'v-capa' : 'v-feed').prepend(av);
    sr209Faixa(true); const c = document.getElementById('sr209').classList.contains('some'); sr209Faixa(false); av.remove(); return { a, b, c };
  });
  ok(r3.a && r3.b, '3: a pílula aparece e some sozinha depois de 4 s', r3);
  ok(r3.c, '3: com o aviso "Sem conexão" do topo na tela, a pílula não aparece', r3);
  // 4
  const r4 = await P.evaluate(() => {
    const s = document.getElementById('secs') || (() => { const d = document.createElement('div'); d.id = 'secs'; document.body.appendChild(d); return d })();
    s.insertAdjacentHTML('beforeend', '<span class="vn-tl" id="t4"><span class="vn-tl-bg"><span class="vn-tl-art"><svg viewBox="0 0 10 10"><text x="1" y="5">45 a 31</text><rect width="3" height="3"/></svg><p class="acv-min-t">mínimo era 41 votos</p></span></span></span>');
    const t = document.querySelector('#t4 text'), p = document.querySelector('#t4 p'), r = document.querySelector('#t4 rect');
    const o = { text: getComputedStyle(t).display, p: getComputedStyle(p).color, rect: getComputedStyle(r).display }; document.getElementById('t4').remove(); return o });
  ok(r4.text === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test(r4.p) && r4.rect !== 'none', '4: no cartão do topo, letras do desenho escondidas e o desenho fica', r4);
  // 5
  const css = fs.readFileSync(path.join(__dirname, '..', 'app/src/css/89-correcoes-tarde.css'), 'utf8');
  ok(/\.fs2-cap-l\{scroll-snap-type:x mandatory/.test(css) && /\.fs2-cap-l li\{scroll-snap-align:start\}/.test(css), '5: abas "Nesta matéria" com scroll-snap no começo da aba');
  await ctx.close(); await b.close(); srv.close && srv.close(); const s = U.resumo(); console.log(`${s.OKS} ok, ${s.FALHAS} falhas`); process.exit(s.FALHAS ? 1 : 0);
})();
