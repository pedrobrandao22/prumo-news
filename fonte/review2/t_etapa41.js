// Etapa 41: carrossel social no Feed
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  const ps = f.pautas.find(p => Array.isArray(p.social)) || f.pautas[0]; ps.social = ['R$ 44.008,52: é o subsídio bruto do senador.', 'Cada falta gera desconto.', 'E agora? Alcolumbre não respondeu.'];
  const pe = f.pautas.find(p => p.enquete && p.id !== ps.id);
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f)); fs.copyFileSync(require('../t_util').REPO + '/fotos-arquivo.json', S0 + 'fotos-arquivo.json');
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8841); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8841/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ, null, 10000); await sleep(500);
  await p.evaluate(() => go('feed')); await sleep(800); await p.evaluate(() => { LOTE.pos = LOTE.lista.length; renderPosts(true); document.querySelectorAll('.post .track').forEach(t => fitTrack(t)) }); await sleep(600);
  const r = await p.evaluate(id => { const t = document.querySelector('#p-' + id + ' .track'); const sl = [...t.children]; const f1 = t.querySelector('.ss-fato'); return { n: sl.length, capa: sl[0].querySelector('.cover') ? 1 : 0, fim: sl[sl.length - 1].classList.contains('ss-fim'), num: f1.querySelector('.ss-n')?.textContent, txt: f1.querySelector('.ss-t').textContent, fatos: t.querySelectorAll('.ss-fato').length } }, ps.id);
  ok(r.capa && r.fim && r.n <= 10, 'carrossel: começa na foto, termina em "Ler a matéria", no máximo 10 páginas ' + JSON.stringify(r));
  ok(r.fatos === 3 && r.num === 'R$ 44.008,52' && /^É o subsídio/.test(r.txt), 'usa as frases "social": número grande e frase sem repetir o número ' + JSON.stringify(r));
  console.log('DIAG41', await p.evaluate(id => { const e = document.getElementById('p-' + id); return e ? e.className + ' | ' + e.innerHTML.slice(0, 600) : 'sem post; ids: ' + [...document.querySelectorAll('#posts > .post')].map(x => x.id).slice(0, 12).join() }, pe.id));
  ok(await p.evaluate(id => { const t = document.querySelector('#p-' + id + ' .track'); return !!t.querySelector('.ss-enq [data-poll] .poll') }, pe.id), 'enquete dentro do carrossel');
  ok(await p.evaluate(() => [...document.querySelectorAll('#posts .post .track > .sl')].every(s => s.scrollHeight <= s.clientHeight + 2)), 'nenhuma página transborda');
  await p.evaluate(id => document.querySelector('#p-' + id + ' .ss-cta').click(), ps.id); await sleep(600);
  ok(await p.evaluate(id => MAT_PID === id, ps.id), '"Ler a matéria completa" abre a matéria');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa41: ${R.OKS} ok, ${R.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'fotos-arquivo.json') } catch (e) { } process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
