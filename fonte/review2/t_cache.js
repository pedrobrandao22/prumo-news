// reabrir com o feed em cache não pode perder posts (erro de inicialização no carregamento)
const U = require('../t_util'); const { ok, sleep, esperar } = U;
(async () => {
  const srv = U.servir('site', 8780); await sleep(800);
  const br = await U.navegador(); const p = U.erros(await br.newPage({ viewport: { width: 390, height: 844 } }), 'cache');
  await p.goto('http://localhost:8780/index.html'); await esperar(p, () => document.querySelectorAll('.post').length > 2, null, 10000); await sleep(800);
  await p.reload(); await sleep(1500);
  console.log('DBG', await p.evaluate(() => [document.querySelectorAll('#posts .post').length, LOTE.pos, listaFeed().length, !!document.querySelector('.cobbar')]));
  ok(await p.evaluate(() => document.querySelectorAll('#posts .post').length === Math.min(LOTE.pos, listaFeed().length) && !!document.querySelector('.cobbar') === listaFeed().slice(0, LOTE.pos).some(cobTemPagina)), 'reabrir com cache: todos os posts do primeiro lote, com a barra da cobertura');
  ok(!p._erros.length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`RESUMO t_cache: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
