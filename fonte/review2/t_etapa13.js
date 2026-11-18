// Etapa 13: fotos nas capas do Feed; indicadores (desde 17/11 um card só na Capa, sem gráfico)
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  f.pautas.forEach((p, i) => { p.foto = { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/' + (i === 1 ? 'Falha' : 'Foto' + i) + '.jpg', credito: 'Foto: Fulano/Agência Senado', alt: 'teste', mostra: p.neutro.titulo } });  // 18/11 (187): foto própria só com "mostra"
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  // indicadores com datas
  const ind = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/indicadores.json', 'utf8'));
  const dias = n => { const out = []; let d = new Date(Date.now() - 3 * 3600e3); while (out.length < n) { if (d.getUTCDay() % 6) out.unshift(d.toISOString().slice(0, 10)); d = new Date(d - 864e5) } return out };
  const meses = n => { const out = []; const d = new Date(); for (let i = n - 1; i >= 0; i--) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)); out.push(x.toISOString().slice(0, 7)) } return out };
  const dol = ind.itens.find(x => x.id === 'dolar'), ibo = ind.itens.find(x => x.id === 'ibovespa'), sel = ind.itens.find(x => x.id === 'selic');
  const ext = (s, n) => { const o = []; for (let i = 0; i < n - s.length; i++)o.push(s[0] * (1 + Math.sin(i / 5) * .02)); return o.concat(s) };
  dol.serie = ext(dol.serie, 66); dol.rotulos = dias(66); ibo.serie = ext(ibo.serie, 66); ibo.rotulos = dias(66);
  sel.serie = Array.from({ length: 24 }, (_, i) => i < 8 ? 10.5 + i * .5 : i < 20 ? 15 : 14.25 - (i - 20) * .25 < 13.75 ? 13.75 : 14.25 - (i - 20) * .25); sel.rotulos = meses(24);
  ind.itens.filter(x => x.id === 'ipca12m' || x.id === 'desemprego').forEach(x => x.rotulos = meses(x.serie.length));
  fs.writeFileSync(__dirname + '/../site/indicadores.json', JSON.stringify(ind));
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8788); await sleep(800);
  const br = await U.navegador(); const D = __dirname + '/etapa13/';
  for (const dark of [false, true]) {
    const n = dark ? 'e' : 'c';
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: dark ? 'dark' : 'light' });
    await ctx.route('https://upload.wikimedia.org/**', r => /Falha/.test(r.request().url()) ? r.abort() : r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
    // ---- Feed
    let p = U.erros(await ctx.newPage(), n);
    await p.goto('http://localhost:8788/index.html'); await esperar(p, () => FEED && document.querySelector('.cover'), null, 10000); await sleep(900);
    const r1 = await p.evaluate(() => { const c = [...document.querySelectorAll('.cover')]; return { tot: c.length, fcv: c.filter(x => x.classList.contains('fcv')).length, img: c.filter(x => x.querySelector('img.fcv-i')).length, cred: /Agência Senado/.test(c[0].textContent) } });
    ok(r1.fcv >= 1 && r1.cred, (dark ? '[e] ' : '') + 'capa do post no Feed com foto e crédito', r1);
    await p.evaluate(() => { const c = document.querySelector('.cover.fcv'); c.scrollIntoView({ block: 'start' }); scrollBy(0, -70) }); await sleep(500);
    await p.screenshot({ path: D + n + '1-feed.png' });
    // a foto que falha volta para a ilustração
    for (let k = 0; k < 8; k++) { const ach = await p.evaluate(() => { const i = document.querySelector('img.fcv-i[src*="Falha"]'); if (i) { i.scrollIntoView({ block: 'center' }); return true } scrollBy(0, innerHeight); return false }); await sleep(ach ? 1200 : 300); if (ach) break }
    const fx = await p.evaluate(() => [...document.querySelectorAll('img.fcv-i')].filter(i => /Falha/.test(i.src)).map(i => ({ src: i.getAttribute('src'), orig: i.getAttribute('data-orig'), ok: i.complete, nw: i.naturalWidth, n: document.querySelectorAll('.post').length })));
    ok(!fx.length, 'foto que não carrega sai e fica a ilustração', fx);
    await ctx.close();
    // ---- Capa: indicadores e gráfico
    const ctx2 = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: dark ? 'dark' : 'light' });
    await ctx2.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
    await ctx2.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
    p = U.erros(await ctx2.newPage(), n);
    // decisão do Pedro (17/11): um card só na Capa, sem gráfico nem "outros indicadores"; tocar só explica (ver t_uso_f1)
    await p.goto('http://localhost:8788/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .ui184'), null, 10000); await sleep(500);
    ok(await p.evaluate(() => document.querySelectorAll('#v-capa .ui184 .ui184-c').length === 4 && !document.querySelector('#v-capa .cp-ind, #v-capa [data-indg]')), 'Capa: indicadores num card só (4 números)');
    await p.evaluate(() => { document.querySelector('#v-capa .ui184').scrollIntoView({ block: 'center' }) }); await sleep(200);
    await p.screenshot({ path: D + n + '2-capa-ind.png' });
    await p.evaluate(() => document.querySelector('#v-capa .ui184-b').click()); await sleep(500);
    ok(await p.evaluate(() => { const s = document.querySelector('#layer .sheet'); return s && !s.querySelector('.gr-svg') && !document.querySelector('.gr-outros') && /Selic/.test(s.textContent) }), 'tocar no card: explicação, sem gráfico');
    await p.screenshot({ path: D + n + '3-explica.png' });
    await p.evaluate(() => history.back()); await sleep(400);
    ok(await p.evaluate(() => !document.querySelector('#layer .sheet') && VIEW === 'capa'), 'Voltar fecha a explicação');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sem rolagem lateral');
    ok(!p._erros.filter(e => !/ERR_|404|net::|Falha/.test(e)).length, 'sem erros ' + p._erros.join('|'));
    await ctx2.close();
  }
  const r = U.resumo(); console.log(`\nRESUMO t_etapa13: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(__dirname + '/../site/indicadores.json') } catch (e) { } process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
