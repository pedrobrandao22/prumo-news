// service worker: com internet, a versão nova do app aparece já na primeira abertura (não só na seguinte)
const U = require('../t_util'); const fs = require('fs'); const arq = __dirname + '/../site/index.html';
(async () => {
  const srv = U.servir('site', 8772); await U.sleep(800);
  const b = await U.navegador(); const ctx = await b.newContext(); const p = await ctx.newPage();
  await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.supabase=null' }));
  await p.goto('http://localhost:8772/'); await U.esperar(p, () => document.querySelectorAll('.post').length > 0, null, 10000);
  await p.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready });
  await p.goto('http://localhost:8772/'); await U.sleep(1200);
  U.ok(await p.evaluate(() => !!navigator.serviceWorker.controller), 'service worker no controle');
  const orig = fs.readFileSync(arq, 'utf8'); fs.writeFileSync(arq, orig.replace('</body>', '<i id="marca-nova"></i></body>'));
  try {
    await p.goto('http://localhost:8772/'); await U.sleep(800);
    U.ok(await p.evaluate(() => !!document.getElementById('marca-nova')), 'versão nova já na primeira abertura');
    await ctx.setOffline(true); await p.goto('http://localhost:8772/').catch(() => { }); await U.sleep(800);
    U.ok(await p.evaluate(() => !!document.getElementById('marca-nova') && document.querySelectorAll('.post').length > 0).catch(() => false), 'sem internet: abre a cópia guardada (já a nova)');
  } finally { fs.writeFileSync(arq, orig) }
  const R = U.resumo(); console.log(`\nRESUMO t_sw2: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
