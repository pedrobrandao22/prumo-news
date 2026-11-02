// Etapa 77: envio para fora (texto formatado + link, WhatsApp) e a mini logo do prumo para Direita/Esquerda
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
const SH = __dirname + '/../review3/var/';
(async () => {
  const f = JSON.parse(fs.readFileSync(U.REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 600e3).toISOString().slice(0, 16) + ':00-03:00';
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8787); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: fs.readFileSync(__dirname + '/etapa13/foto.jpg'), contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8787/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(800);
  // O dia em 1 minuto
  const tem1 = await p.evaluate(() => !!(FEED.resumo_dia && FEED.resumo_dia.itens && FEED.resumo_dia.itens.length));
  if (tem1) {
    await p.evaluate(() => mandarResumo()); await sleep(500);
    const r = await p.evaluate(() => ({ bolha: document.querySelector('.sheet .env-bolha')?.innerText || '', wa: document.querySelector('.sheet [data-envwa]')?.getAttribute('href') || '', img: !!document.querySelector('.sheet [data-envimg]') }));
    ok(/^.+· Prumo News/.test(r.bolha) && /\n1\. /.test(r.bolha) && /prumonews\.com\.br/.test(r.bolha) && /^https:\/\/wa\.me\/\?text=/.test(r.wa) && r.img, 'O dia em 1 minuto: texto numerado com link, botão do WhatsApp e a imagem como opção', r.bolha.slice(0, 120));
    ok(await p.evaluate(() => { const b = document.querySelector('.sheet .env-bolha b'); return !!b && !/\*/.test(document.querySelector('.sheet .env-bolha').innerText.split('\n')[0]) }), 'prévia mostra o negrito do WhatsApp (sem asteriscos)');
    await p.screenshot({ path: SH + 'd77-1min.png' }); await p.evaluate(() => closeLayer()); await sleep(300);
  }
  // notícia
  const pid = await p.evaluate(() => FEED.pautas[0].id);
  await p.evaluate(id => compartilhar(id), pid); await sleep(500);
  const n = await p.evaluate(() => ({ bolha: document.querySelector('.sheet .env-bolha')?.innerText || '', wa: decodeURIComponent((document.querySelector('.sheet [data-envwa]')?.getAttribute('href') || '').split('text=')[1] || '') }));
  ok(/\/m\/.+\.html/.test(n.wa) && n.wa.startsWith('*') && /Leia no Prumo News/.test(n.bolha), 'notícia: título em negrito, subtítulo e o link com prévia', n.wa.slice(0, 140));
  await p.screenshot({ path: SH + 'd77-noticia.png' }); await p.evaluate(() => closeLayer()); await sleep(300);
  // mini logo: Direita e Esquerda
  for (const L of ['direita', 'esquerda']) {
    await p.evaluate(L => { PREF.lente = L; renderCapa(); }, L); await sleep(500);
    const m = await p.evaluate(L => { const e = document.querySelector('#v-capa .cp-lado.' + L); if (!e) return null; const cs = getComputedStyle(e); return { mask: (cs.maskImage || cs.webkitMaskImage || '').slice(0, 40), w: e.getBoundingClientRect().width, cor: cs.backgroundColor } }, L);
    ok(m && /svg/.test(m.mask) && m.w >= 12, `Capa (${L}): mini logo do prumo no lugar da bolinha`, m);
    await p.screenshot({ path: SH + `d77-lado-${L}.png`, clip: { x: 0, y: 0, width: 390, height: 520 } });
  }
  await p.evaluate(id => abrirMateria(id), await p.evaluate(() => (FEED.pautas.find(p => versao(p, 'esquerda').tem) || {}).id)); await sleep(600);
  await p.screenshot({ path: SH + 'd77-materia.png', clip: { x: 0, y: 0, width: 390, height: 420 } });
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa77: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
