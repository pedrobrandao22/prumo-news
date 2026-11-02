// Etapa 20: Últimas/Agenda abrem a matéria; Capa sem conexão
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8804); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa20/'; fs.mkdirSync(D, { recursive: true });
  let ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  let p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8804/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(400);
  const pid = await p.evaluate(() => { const b = [...document.querySelectorAll('#v-capa .cp-l [data-capair]')].find(x => pautaById(x.dataset.capair)); if (!b) return null; b.click(); return b.dataset.capair });
  await sleep(500);
  ok(pid && await p.evaluate(a => MAT_PID === a && !!document.querySelector('#layer .mat') && VIEW === 'capa', pid), '"Últimas" na Capa abre a matéria (sem ir para o Feed)', pid);
  await p.evaluate(() => history.back()); await sleep(400);
  ok(await p.evaluate(() => !document.querySelector('#layer .mat') && VIEW === 'capa'), 'volta para a Capa');
  await ctx.close();
  // sem conexão e sem edição guardada
  ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  await ctx.route('**/feed.json*', r => r.abort());
  p = U.erros(await ctx.newPage(), 'b'); await p.goto('http://localhost:8804/index.html');
  ok(await esperar(p, () => !!document.querySelector('#v-capa .cp-off [data-retry]'), null, 8000), 'sem conexão: Capa mostra aviso com "Tentar de novo"');
  await p.screenshot({ path: D + 'off.png' });
  await ctx.unroute('**/feed.json*');
  await p.evaluate(() => document.querySelector('#v-capa [data-retry]').click());
  ok(await esperar(p, () => FEED && !!document.querySelector('#v-capa .cpi'), null, 8000), '"Tentar de novo" carrega a Capa');
  const r = U.resumo(); console.log(`\nRESUMO t_etapa20: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
