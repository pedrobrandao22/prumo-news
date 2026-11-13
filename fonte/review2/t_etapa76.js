// Etapa 76: guia da primeira abertura (4 telas) depois de entrar por convite; rever em Perfil › Conta
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8784/index.html'; const SH = __dirname + '/../review3/var/';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { url, nome, email }, fecha = true) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(800); if (fecha && await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8784); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await B.addInitScript(() => { try { localStorage.setItem('prumo-teste-tour', '1') } catch (e) { } });
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }, false);
  await esperar(B, () => !!document.querySelector('#layer .tour'), null, 5000).catch(() => { });
  ok(await ev(B, () => !!document.querySelector('#layer .tour') && /Boas-vindas, Bia/.test(document.querySelector('#layer .tour').textContent)), 'quem entra por convite vê o guia, com o nome ("Boas-vindas", 106)');
  ok(await ev(B, () => document.querySelectorAll('#layer .tr-t').length === 4 && document.documentElement.scrollWidth <= 390), '4 telas, sem rolagem horizontal');
  await B.screenshot({ path: SH + 'd76-tour1.png' });
  for (let i = 0; i < 3; i++) { await clk(B, '[data-tourprox]'); await sleep(700) }
  ok(await ev(B, () => /Começar a ler/.test(document.querySelector('[data-tourprox]').textContent) && /tela de início/.test(document.querySelectorAll('#layer .tr-t')[3].textContent)), 'última tela: instalar como app + "Começar a ler"');
  await B.screenshot({ path: SH + 'd76-tour4.png' });
  await clk(B, '[data-tourprox]'); await sleep(500);
  ok(await ev(B, () => !document.querySelector('#layer .tour') && localStorage.getItem('prumo-tour-visto') === '1'), '"Começar a ler" fecha o guia');
  await ev(B, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(400);
  await clk(B, '#v-me [data-tourver]'); await sleep(500);
  ok(await ev(B, () => !!document.querySelector('#layer .tour')), 'Perfil › Conta › Como usar o Prumo reabre o guia');
  await clk(B, '[data-tourfim]'); await sleep(400);
  ok(await ev(B, () => !document.querySelector('#layer .tour')), '"Pular" fecha');
  for (const [w, h] of [[768, 1024], [1280, 800], [844, 390]]) {
    const cx = await b.newContext({ viewport: { width: w, height: h } }); const q = await cx.newPage(); await q.goto(BASE); await esperar(q, () => typeof abrirTour === 'function' && FEED, null, 10000);
    await q.evaluate(() => abrirTour('Ana')); await sleep(300);
    for (let i = 0; i < 3; i++) { await q.evaluate(() => document.querySelector('[data-tourprox]').click()); await sleep(700) }
    const r = await q.evaluate(() => ({ txt: document.querySelector('[data-tourprox]').textContent, dot: [...document.querySelectorAll('.tr-dots i')].findIndex(x => x.classList.contains('on')), cabe: [...document.querySelectorAll('.tr-t')].every(t => t.scrollHeight <= t.clientHeight + 1 || getComputedStyle(t).overflowY === 'auto') }));
    await q.evaluate(() => document.querySelector('[data-tourprox]').click()); await sleep(500);
    ok(/Começar a ler/.test(r.txt) && r.dot === 3 && r.cabe && await q.evaluate(() => !document.querySelector('#layer .tour')), `guia em ${w}x${h}: chega ao fim e fecha`, r);
    await cx.close() }
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa76: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
