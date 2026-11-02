// Etapa 13: fotos nas capas do Feed; gráficos dos indicadores
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  f.pautas.forEach((p, i) => { p.foto = { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/' + (i === 1 ? 'Falha' : 'Foto' + i) + '.jpg', credito: 'Foto: Fulano/Agência Senado', alt: 'teste' } });
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
    await p.goto('http://localhost:8788/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cp-ind button.ind-t'), null, 10000); await sleep(500);
    ok(await p.evaluate(() => document.querySelectorAll('#v-capa .cp-ind .ind-t .gr-sp').length >= 3), 'miniaturas nos indicadores da Capa');
    await p.evaluate(() => { document.querySelector('#v-capa .cp-ind').scrollIntoView({ block: 'center' }) }); await sleep(200);
    await p.screenshot({ path: D + n + '2-capa-ind.png' });
    await p.evaluate(() => document.querySelector('#v-capa .cp-ind [data-indg="dolar"]').click()); await sleep(500);
    ok(await p.evaluate(() => { const s = document.querySelector('#layer .sheet'); return s && s.querySelector('.gr-svg') && /Dólar/.test(s.textContent) && s.querySelectorAll('.gr-pers button').length === 2 && /3 meses/.test(s.querySelector('.gr-per-t').textContent) }), (dark ? '[e] ' : '') + 'tocar no Dólar abre o gráfico (3 meses, com períodos)');
    await p.screenshot({ path: D + n + '3-dolar.png' });
    // arrastar: leitura do ponto
    const bb = await p.evaluate(() => { const r = document.querySelector('.gr-svg').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } });
    await p.mouse.move(bb.x + bb.w * .3, bb.y + bb.h * .5); await sleep(150);
    const ro = await p.evaluate(() => ({ t: document.querySelector('.gr-ro').textContent, vis: document.querySelector('.gr-x').style.display !== 'none' }));
    ok(ro.vis && /R\$/.test(ro.t) && !/último dado/.test(ro.t), 'passar o dedo/mouse mostra valor e data do ponto', ro);
    await p.screenshot({ path: D + n + '4-dolar-ponto.png' });
    await p.mouse.move(5, 5); await sleep(100);
    ok(await p.evaluate(() => /último dado/.test(document.querySelector('.gr-ro').textContent)), 'ao sair, volta ao último dado');
    await p.evaluate(() => document.querySelector('[data-grper="22"]').click()); await sleep(300);
    ok(await p.evaluate(() => GR.d.length === 22 && /1 mês/.test(document.querySelector('.gr-per-t').textContent) && !!document.querySelector('#layer .sheet')), 'período 1 mês');
    ok(await p.evaluate(() => HST === 1), 'trocar período não cria passo extra no Voltar');
    await p.evaluate(() => document.querySelector('.gr-outros [data-indg="selic"]').click()); await sleep(400);
    ok(await p.evaluate(() => /Selic/.test(document.querySelector('#layer .sh-h').textContent) && /2 anos/.test(document.querySelector('.gr-per-t').textContent) && /ponto/.test(document.querySelector('.gr-per-t').textContent)), 'Selic: degraus, 2 anos, variação em pontos');
    await p.screenshot({ path: D + n + '5-selic.png' });
    await p.evaluate(() => document.querySelector('.gr-outros [data-indg="ipca12m"]').click()); await sleep(400);
    ok(await p.evaluate(() => !document.querySelector('.gr-pers') && /12 meses/.test(document.querySelector('.gr-per-t').textContent)), 'IPCA: 12 meses sem botões de período');
    await p.evaluate(() => { document.querySelector('.gr-tab').open = true; document.querySelector('#layer .sh-b').scrollTo(0, 9999) }); await sleep(200);
    await p.screenshot({ path: D + n + '6-ipca-tabela.png' });
    ok(await p.evaluate(() => document.querySelectorAll('.gr-tab tbody tr').length === 12), 'tabela com os números');
    await p.evaluate(() => history.back()); await sleep(400);
    ok(await p.evaluate(() => !document.querySelector('#layer .sheet') && VIEW === 'capa'), 'Voltar fecha o gráfico');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sem rolagem lateral');
    ok(!p._erros.filter(e => !/ERR_|404|net::|Falha/.test(e)).length, 'sem erros ' + p._erros.join('|'));
    await ctx2.close();
  }
  const r = U.resumo(); console.log(`\nRESUMO t_etapa13: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(__dirname + '/../site/indicadores.json') } catch (e) { } process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
