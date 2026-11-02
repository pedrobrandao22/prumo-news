// Etapa 47: segurar não encolhe, deslizar rápido para baixo fecha, matéria do story volta ao story
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f)); fs.copyFileSync(require('../t_util').REPO + '/fotos-arquivo.json', S0 + 'fotos-arquivo.json');
  const srv = U.servir('site', 8847); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); const cdp = await ctx.newCDPSession(p);
  const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y })) });
  await p.goto('http://localhost:8847/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ, null, 10000); await sleep(500);
  await p.evaluate(() => go('feed')); await sleep(800);
  await p.evaluate(() => openSecStory('politica')); await sleep(700);
  await touch('touchStart', [[200, 300]]); for (let i = 1; i <= 6; i++) { await touch('touchMove', [[200 + (i % 3) * 4, 300 + i * 4]]); await sleep(110) }
  const tr = await p.evaluate(() => document.querySelector('#layer .story-in').style.transform); await touch('touchEnd', []); await sleep(300);
  ok(!tr && await p.evaluate(() => ST.i === 0 && !!document.querySelector('#layer .story')), 'segurar com o dedo tremendo só pausa (não encolhe nem avança) ' + tr);
  await p.evaluate(() => document.querySelector('#layer [data-stmat]').click()); await sleep(700);
  ok(await p.evaluate(() => !!document.getElementById('sg-fundo') && /Story/.test(document.querySelector('#layer .mat-v').textContent)), 'matéria aberta pelo story: o story fica atrás e o botão diz "‹ Story"');
  await touch('touchStart', [[20, 400]]); for (let i = 1; i <= 12; i++) { await touch('touchMove', [[20 + i * 25, 402]]); await sleep(20) } await touch('touchEnd', []); await sleep(1100);
  ok(await p.evaluate(() => !!document.querySelector('#layer .story') && !document.getElementById('sg-fundo') && VIEW === 'feed'), 'arrastar a matéria para a direita volta ao story');
  await p.evaluate(() => document.querySelector('#layer [data-stmat]').click()); await sleep(700);
  await p.evaluate(() => document.querySelector('#layer .mat-v').click()); await sleep(900);
  ok(await p.evaluate(() => !!document.querySelector('#layer .story')), 'botão "‹ Story" volta ao story');
  await touch('touchStart', [[200, 300]]); for (let i = 1; i <= 4; i++) { await touch('touchMove', [[200, 300 + i * 20]]); await sleep(10) } await touch('touchEnd', []); await sleep(700);
  ok(await p.evaluate(() => !document.querySelector('#layer .story') && HST === 0), 'deslizar rápido para baixo fecha o story');
  ok(await p.evaluate(() => { const d = document.createElement('div'); d.className = 'story sg'; d.innerHTML = '<button class="sg-a on" data-a="like"><svg class="ico"><path class="dotc" d="M0 0h1v1z"/></svg></button>'; document.body.appendChild(d); const c = getComputedStyle(d.querySelector('.dotc')).fill; d.remove(); return /242, 194, 123/.test(c) }), 'Gostei no story pinta o ícone de dourado');
  ok(!p._erros.filter(e => !/ERR_|404|net::|cancelable=false/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa47: ${R.OKS} ok, ${R.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'fotos-arquivo.json') } catch (e) { } process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
