const U = require('../t_util');
(async () => {
  const srv = U.servir('site', 8771); await U.sleep(800);
  const b = await U.navegador(); const ctx = await b.newContext(); const p = await ctx.newPage();
  await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.supabase=null' }));
  await p.goto('http://localhost:8771/index.html');
  await U.esperar(p, () => document.querySelectorAll('.post').length > 0, null, 10000);
  const reg = await p.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready; return true });
  await p.goto('http://localhost:8771/'); await U.sleep(1500);
  await ctx.setOffline(true);
  await p.goto('http://localhost:8771/').catch(e => console.log('nav err', e.message));
  const n = await p.evaluate(() => document.querySelectorAll('.post').length).catch(() => -1);
  const off = await p.evaluate(() => document.querySelector('.late.offl')?.textContent || '').catch(() => '');
  console.log('registrou', reg, 'posts offline', n, 'aviso:', off);
  await p.screenshot({ path: __dirname + '/sw-offline.png' });
  await b.close(); srv.kill();
})();
