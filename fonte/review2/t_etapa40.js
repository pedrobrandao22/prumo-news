// Etapa 40: todos os quadros dos posts com a mesma altura; o que não cabe vira mais páginas, sem perder texto
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00'; fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8840); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa40/'; fs.mkdirSync(D, { recursive: true });
  for (const [w, fz] of [[390, 1], [360, 1.15], [430, 1]]) {
  const ctx = await br.newContext({ viewport: { width: w, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await ctx.route('https://upload.wikimedia.org/**', r => r.abort());
  await ctx.addInitScript(fz => { localStorage.setItem('prumo-teste-capa', '1'); if (fz > 1) localStorage.setItem('radar-prefs', JSON.stringify({ fonte: fz })) }, fz);
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8840/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(500);
  await p.evaluate(() => go('feed')); await sleep(800);
  const r = await p.evaluate(async () => { LOTE.pos = LOTE.lista.length; renderPosts(true); await new Promise(r => setTimeout(r, 300)); await document.fonts.ready;
    const norm = s => s.replace(/Continuar lendo|· continua/g, '').replace(/\s+/g, '');
    let ruins = [], perdas = [], pags = 0, dots = [];
    for (const po of document.querySelectorAll('#posts .post')) { const t = po.querySelector('.track'); fitTrack(t); const H = parseInt(getComputedStyle(t).getPropertyValue('--slh'));
      const pid = po.dataset.pid, pa = pautaById(pid); const orig = document.createElement('div'); orig.innerHTML = slidesSociais(pa).join(''); document.body.appendChild(orig); orig.style.cssText = 'position:absolute;left:-9999px';
      const a = norm([...orig.children].map(x => x.textContent).join('')), b = norm([...t.children].map(x => { const c = x.cloneNode(true); c.querySelectorAll('.lbl em').forEach(e => { if (/continua/.test(e.textContent)) e.parentNode.remove() }); c.querySelectorAll('[data-poll]').forEach(e => e.innerHTML = ''); return c.textContent }).join('')); orig.remove();
      if (a !== b) perdas.push(pid + ' ' + a.length + '→' + b.length);
      [...t.children].forEach((sl, i) => { const h = sl.getBoundingClientRect().height; if (Math.abs(h - H) > 1.5 || sl.scrollHeight > H + 2) ruins.push(pid + '#' + i + ' h' + Math.round(h) + ' sh' + sl.scrollHeight + '/' + H) });
      pags += t.querySelectorAll('.pag').length; const d = po.querySelectorAll('.pdots i').length; if (d !== t.children.length && !(t.children.length === 1 && d === 0)) dots.push(pid + ' ' + d + '/' + t.children.length) }
    return { ruins: ruins.slice(0, 6), nr: ruins.length, perdas: perdas.slice(0, 6), np: perdas.length, pags, dots: dots.slice(0, 4) } });
  const tag = `[${w}px${fz > 1 ? ', letra maior' : ''}] `;
  ok(r.nr === 0, tag + 'todos os quadros com a mesma altura e nada transbordando ' + JSON.stringify(r.ruins));
  ok(r.np === 0, tag + 'nenhum texto perdido ao dividir em páginas ' + JSON.stringify(r.perdas));
  ok(r.dots.length === 0, tag + `pontinhos acompanham as páginas novas (${r.pags} páginas de texto) ` + JSON.stringify(r.dots));
  if (w === 390) { await p.evaluate(() => { const t = document.querySelector('#posts .post .track'); t.scrollLeft = t.clientWidth * 2; document.querySelector('#posts .post').scrollIntoView() }); await sleep(500); await p.screenshot({ path: D + 'pag2.png' });
    await p.evaluate(() => { const t = document.querySelector('#posts .post .track'); t.scrollLeft = t.clientWidth * 3 }); await sleep(500); await p.screenshot({ path: D + 'pag3.png' }) }
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, tag + 'sem erros ' + p._erros.join('|'));
  await ctx.close() }
  const R = U.resumo(); console.log(`\nRESUMO t_etapa40: ${R.OKS} ok, ${R.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
