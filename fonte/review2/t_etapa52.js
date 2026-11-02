// Etapa 52: deslizar entre Capa e Feed
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f)); fs.copyFileSync(require('../t_util').REPO + '/fotos-arquivo.json', S0 + 'fotos-arquivo.json');
  const srv = U.servir('site', 8852); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); const cdp = await ctx.newCDPSession(p);
  const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y })) });
  const sw = async (x0, y0, x1, y1, n = 10, dt = 16) => { await touch('touchStart', [[x0, y0]]); for (let i = 1; i <= n; i++) { await touch('touchMove', [[x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]]); await sleep(dt) } await touch('touchEnd', []); await sleep(700) };
  const V = () => p.evaluate(() => VIEW);
  await p.goto('http://localhost:8852/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ, null, 10000); await sleep(800);
  await sw(330, 500, 270, 505, 10, 40); ok(await V() === 'capa', 'Capa: arrasto curto e devagar não troca de tela');
  await sw(330, 500, 60, 505); ok(await V() === 'feed', 'Capa: deslizar da direita para a esquerda vai para o Feed');
  await sw(60, 500, 330, 505); ok(await V() === 'capa', 'Feed: deslizar da esquerda para a direita (foto na 1ª página) volta para a Capa');
  await sw(330, 500, 60, 505); await p.evaluate(() => { const t = document.querySelector('#posts .post .track'); t.scrollLeft = t.clientWidth }); await sleep(300);
  await sw(60, 500, 330, 505); ok(await V() === 'feed', 'Feed: com o carrossel na 2ª página, deslizar para a direita volta a página, não troca de tela');
  const y0 = await p.evaluate(() => scrollY); await sw(200, 650, 215, 250); ok(await V() === 'feed' && await p.evaluate(y0 => scrollY > y0, y0), 'rolar para baixo (com leve diagonal) só rola');
  await p.evaluate(() => { scrollTo(0, 0); openSecStory('politica') }); await sleep(600); await sw(60, 500, 330, 505);
  ok(await p.evaluate(() => VIEW === 'feed'), 'com story aberto, o gesto não troca de tela');
  ok(!p._erros.filter(e => !/ERR_|404|net::|cancelable=false/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa52: ${R.OKS} ok, ${R.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'fotos-arquivo.json') } catch (e) { } process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
