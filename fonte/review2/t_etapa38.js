// Etapa 38: puxar para atualizar com o prumo
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00'; fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8838); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa38/'; fs.mkdirSync(D, { recursive: true });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await ctx.route('https://upload.wikimedia.org/**', r => r.abort());
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8838/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(800);
  await p.evaluate(() => { window.__chk = 0; const o = checarFeed; checarFeed = function () { window.__chk++; return new Promise(r => setTimeout(r, 300)) } });
  const cdp = await ctx.newCDPSession(p); const T = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: 195, y }] });
  await T('touchStart', 200); for (let y = 200; y <= 330; y += 10) { await T('touchMove', y); await sleep(16) }
  const meio = await p.evaluate(() => ({ app: document.querySelector('.app').style.transform, op: getComputedStyle(document.querySelector('.ptr2')).opacity, pronto: document.querySelector('.ptr2').classList.contains('pronto') }));
  ok(/translate3d\(0px, [1-9]/.test(meio.app) && +meio.op > 0.5 && !meio.pronto, 'puxando: a página acompanha o dedo e o prumo aparece ' + JSON.stringify(meio));
  for (let y = 330; y <= 560; y += 15) { await T('touchMove', y); await sleep(16) }
  ok(await p.evaluate(() => document.querySelector('.ptr2').classList.contains('pronto') && /Solte/.test(document.querySelector('.ptr2-t').textContent)), 'puxou o bastante: o prumo fica dourado e avisa "Solte para atualizar"');
  await p.screenshot({ path: D + '1-puxando.png' });
  await T('touchEnd'); await sleep(250);
  ok(await p.evaluate(() => document.querySelector('.ptr2').classList.contains('balanca') && window.__chk === 1), 'soltou: o prumo balança enquanto atualiza');
  await p.screenshot({ path: D + '2-balancando.png' });
  await sleep(1700);
  ok(await p.evaluate(() => document.querySelector('.app').style.transform === '' && getComputedStyle(document.querySelector('.ptr2')).opacity === '0'), 'terminou: a página volta suave ao lugar');
  // puxar pouco não atualiza
  await T('touchStart', 200); for (let y = 200; y <= 260; y += 10) { await T('touchMove', y); await sleep(16) } await T('touchEnd'); await sleep(700);
  ok(await p.evaluate(() => window.__chk === 1 && document.querySelector('.app').style.transform === ''), 'puxada curta só volta, sem atualizar');
  ok(await p.evaluate(() => !document.getElementById('ptr') || getComputedStyle(document.getElementById('ptr')).opacity === '0'), 'os indicadores antigos não aparecem');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa38: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
