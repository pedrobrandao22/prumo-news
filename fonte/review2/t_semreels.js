// Reels desligados (097): criar não oferece REELS, perfil sem aba Reels
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8853/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8853); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A');
  await A.addInitScript(() => localStorage.setItem('prumo-teste-semreels', '1'));
  await A.goto(BASE); await esperar(A, () => document.querySelectorAll('.post').length > 0);
  if (!(await A.$('#lcod'))) { await esperar(A, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(A, '#avisoconta [data-entrar]'); await clk(A, '[data-laba="criar"]') }
  await A.fill('#lnome', 'Pedro'); await A.fill('#lemail', 'a@x.com'); await A.fill('#lsenha', '123456'); await clk(A, '#lform [type=submit]');
  await esperar(A, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await A.$('.sheet')) { await A.evaluate(() => closeLayer()); await sleep(250) }
  ok(await A.evaluate(() => REELS_LIGADO === false && !PF_ABAS.some(a => a[0] === 'reels')), 'Reels desligados: sem aba Reels no perfil');
  await A.evaluate(() => criarAbrir('story')); await esperar(A, () => !!document.querySelector('#layer .ce'), null, 8000); await sleep(400);
  ok(await A.evaluate(() => { const m = [...document.querySelectorAll('#layer [data-edmodo]')].map(b => b.dataset.edmodo); return !m.includes('reel') && m.includes('story') }), 'criar oferece POST e STORY, sem REELS');
  await A.evaluate(() => { ED.modo = 'reel'; edDesenha() }); await sleep(300);
  ok(await A.evaluate(() => ED.modo !== 'reel' && !document.querySelector('#layer .ce-reel')), 'modo reel não abre');
  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  await b.close(); srv.kill(); const R = U.resumo(); console.log(`\nRESUMO t_semreels: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
