// Etapa 39: Feed remodelado
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00'; fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8839); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa39/'; fs.mkdirSync(D, { recursive: true });
  for (const esc of [0, 1]) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: esc ? 'dark' : 'light' });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8839/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(600);
  await p.evaluate(() => document.querySelector('.nav [data-v="feed"]').click()); await sleep(1500);
  const n = esc ? '[escuro] ' : '';
  ok(await p.evaluate(() => { const v = e => e && getComputedStyle(e).display !== 'none'; return !v(document.getElementById('b-audio')) && !v(document.getElementById('ed')) && v(document.getElementById('b-busca')) && document.querySelector('#secs .sb')?.matches('[data-5min]') }), n + 'topo enxuto: marca, filtro e busca; "Em 5 min" é o primeiro círculo');
  ok(await p.evaluate(() => { const po = document.querySelector('#posts .post'); return !!po.querySelector('.ph-av') && !!po.querySelector('.ph-nm b') && !!po.querySelector('.pt-cap') && !!po.querySelector('.pt-hora') }), n + 'post: avatar da seção, legenda e hora no pé');
  ok(await p.evaluate(() => { const c = document.querySelector('#posts .post .cover'); const r = c.getBoundingClientRect(); return r.height > r.width * 1.1 }), n + 'mídia vertical (4:5)');
  if (!esc) {
    await p.evaluate(() => { window.__c5 = 0; document.getElementById('b-5min').addEventListener('click', () => window.__c5++, true) });
    await p.evaluate(() => document.querySelector('#secs [data-5min]').click()); await sleep(900);
    ok(await p.evaluate(() => ST && ST.sec === '_5min' && !!document.querySelector('#layer .story')), 'tocar em "Em 5 min" abre o resumo de 5 minutos em story');
    await p.evaluate(() => closeLayer()); await sleep(400);
    const pid = await p.evaluate(() => { const b = document.querySelector('#posts .post .pt-cap'); b.click(); return b.dataset.capmat }); await sleep(600);
    ok(await p.evaluate(pid => MAT_PID === pid && !!document.querySelector('#layer .mat'), pid), 'tocar na legenda abre a matéria (como na Capa)');
    await p.evaluate(() => closeLayer()); await sleep(400);
  }
  await p.evaluate(() => scrollTo(0, 0)); await sleep(300); await p.screenshot({ path: D + (esc ? 'escuro' : 'claro') + '.png' });
  await p.evaluate(() => scrollTo(0, 650)); await sleep(300); await p.screenshot({ path: D + (esc ? 'escuro' : 'claro') + '2.png' });
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, n + 'sem erros ' + p._erros.join('|'));
  await ctx.close() }
  const r = U.resumo(); console.log(`\nRESUMO t_etapa39: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
