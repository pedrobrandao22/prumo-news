// Etapa 23: prévia com foto e Compartilhar; Abrir pela Capa vai para a matéria
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  f.pautas.forEach((p, i) => { p.foto = { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/F' + i + '.jpg', credito: 'Foto: X/Agência Senado', alt: 't' } });
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f)); const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8807); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa23/'; fs.mkdirSync(D, { recursive: true });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8807/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(400);
  const pid = await p.evaluate(() => FEED.capa.destaques[0]);
  await p.evaluate(id => abrirPrevia(id), pid); await sleep(600);
  ok(await p.evaluate(() => !!document.querySelector('#layer .pv .art.foto img') && !!document.querySelector('#layer [data-pvshare]')), 'prévia com foto e botão Compartilhar');
  await p.screenshot({ path: D + 'previa.png' });
  await p.evaluate(() => { window.__c = null; navigator.share = d => { window.__c = d; return Promise.resolve() }; document.querySelector('#layer [data-pvshare]').click() }); await sleep(200); await p.evaluate(() => document.querySelector('.sheet [data-envmais]').click()); await sleep(200);
  ok(await p.evaluate(id => window.__c && window.__c.url.endsWith('/m/' + id + '.html'), pid), 'Compartilhar da prévia manda o link da matéria');
  await p.evaluate(() => document.querySelector('#layer [data-pvabrir]').click()); await sleep(600);
  ok(await p.evaluate(id => MAT_PID === id && !!document.querySelector('#layer .mat') && VIEW === 'capa', pid), 'Abrir pela Capa abre a matéria');
  await p.evaluate(() => history.back()); await sleep(500);
  const cid = await p.evaluate(() => { const c = FEED.pautas.find(x => cobTemPagina(x)); abrirPagCob(c.id); return c.id }); await sleep(500);
  ok(await p.evaluate(() => !!document.querySelector('#layer .pc .pc-foto img') && /Fontes/.test(document.querySelector('#layer .cobx2')?.textContent || 'Fontes')), 'cobertura com foto e "Fontes" discreto');
  await p.evaluate(() => document.querySelector('#layer [data-cobler]').click()); await sleep(700);
  ok(await p.evaluate(id => MAT_PID === id && !!document.querySelector('#layer .mat'), cid), 'Ler a notícia (cobertura, na Capa) abre a matéria');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa23: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
