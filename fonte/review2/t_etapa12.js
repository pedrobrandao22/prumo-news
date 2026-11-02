// Etapa 12: quadro de 30 s abre a matéria completa; voltar à Capa no mesmo ponto; fotos livres
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  const man = f.capa.manchete; const P = f.pautas.find(p => p.id === man);
  P.foto = { url: 'http://localhost:8788/foto.svg', credito: 'Foto: Teste/Agência Brasil', alt: 'teste' }; // domínio fora da lista: deve ser ignorado
  const D2 = f.pautas.find(p => p.id === f.capa.destaques[0]);
  D2.foto = { url: 'https://upload.wikimedia.org/wikipedia/commons/x/xx/Inexistente.jpg', credito: 'Foto: Fulano/Wikimedia Commons', alt: 'x' };
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8788); await sleep(800);
  const br = await U.navegador(); const D = __dirname + '/etapa12/';
  for (const dark of [false, true]) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: dark ? 'dark' : 'light' }); await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: require('fs').readFileSync(__dirname + '/etapa13/foto.jpg'), contentType: 'image/jpeg' }));
    await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
    const p = U.erros(await ctx.newPage(), dark ? 'e' : 'c'); const n = dark ? 'e' : 'c';
    await p.goto('http://localhost:8788/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(400);
    ok(await p.evaluate(m => !document.querySelector('#cpi-' + m + ' img'), man), 'foto de domínio fora da lista é ignorada');
    const d2 = f.capa.destaques[0];
    // rolar até um destaque, abrir o quadro, abrir a matéria, voltar
    await p.evaluate(id => { document.getElementById('cpi-' + id).scrollIntoView({ block: 'center' }) }, d2); await sleep(200);
    const top0 = await p.evaluate(id => document.getElementById('cpi-' + id).getBoundingClientRect().top, d2);
    await p.evaluate(id => document.querySelector('#cpi-' + id + ' .cpi-b').click(), d2); await sleep(900);
    const topAberto = await p.evaluate(id => document.getElementById('cpi-' + id).getBoundingClientRect().top, d2);
    ok(await p.evaluate(id => !!document.querySelector('#cpi-' + id + ' button.cpx-30') && !/Guardar|Abrir no feed/.test(document.querySelector('#cpi-' + id + ' .cpx').textContent), d2), (dark ? '[e] ' : '') + 'título abre só o quadro de 30 s');
    await p.screenshot({ path: D + n + '1-quadro.png' });
    await p.evaluate(id => document.querySelector('#cpi-' + id + ' .cpx-30 li').click(), d2); await sleep(400);
    ok(await p.evaluate(() => { const m = document.querySelector('#layer .mat'); return m && /Guardar/.test(m.querySelector('.mat-top').textContent) && m.querySelector('h1') && m.querySelector('.mat-p') }), (dark ? '[e] ' : '') + 'tocar em qualquer lugar do quadro abre a matéria (com Guardar)');
    ok(await p.evaluate(() => { const c = document.querySelector('#layer .mat [data-credfull]'); window.__c = c ? c.outerHTML : document.querySelector('#layer .mat-arte').innerHTML.slice(0, 400); return c && /Wikimedia Commons/.test(c.dataset.credfull) && /^(Foto: |Arquivo · )/.test(c.textContent) }), 'crédito da foto na matéria (curto, completo ao tocar)', await p.evaluate(() => window.__c));
    await p.screenshot({ path: D + n + '2-materia.png' });
    await p.evaluate(() => document.querySelector('#layer .mat').scrollTo(0, 99999)); await sleep(200); await p.screenshot({ path: D + n + '3-materia-fim.png' });
    await p.evaluate(() => document.querySelector('[data-matsalvar]').click()); await sleep(300);
    ok(await p.evaluate(() => !!document.querySelector('#layer .mat') && (document.querySelector('[data-matsalvar]').getAttribute('aria-pressed') === 'true' || !!document.querySelector('#layer2 .sheet'))), 'Guardar na matéria (sem conta: pede para entrar, por cima)');
    await p.evaluate(() => { if (document.querySelector('#layer2 .sheet')) history.back() }); await sleep(400);
    await p.evaluate(() => document.querySelector('#layer .mat [data-cpfontes]').click()); await sleep(400);
    ok(await p.evaluate(() => !!document.querySelector('#layer2 .sheet') && !!document.querySelector('#layer .mat')), 'Fontes abre por cima da matéria');
    await p.evaluate(() => history.back()); await sleep(400);
    ok(await p.evaluate(() => !document.querySelector('#layer2 .sheet') && !!document.querySelector('#layer .mat')), 'fechar Fontes volta para a matéria');
    await p.evaluate(() => history.back()); await sleep(500);
    const r = await p.evaluate(id => ({ mat: !!document.querySelector('#layer .mat'), ab: CP_AB, view: VIEW, top: document.getElementById('cpi-' + id).getBoundingClientRect().top }), d2);
    ok(!r.mat && r.ab === null && r.view === 'capa' && Math.abs(r.top - topAberto) < 30, (dark ? '[e] ' : '') + 'voltar: Capa no mesmo ponto, quadro fechado', { r, top0 });
    // fechar pelo botão também
    await p.evaluate(id => document.querySelector('#cpi-' + id + ' .cpi-b').click(), d2); await sleep(200);
    await p.evaluate(id => document.querySelector('#cpi-' + id + ' .cpx-30').click(), d2); await sleep(300);
    await p.evaluate(() => document.querySelector('.mat-v').click()); await sleep(400);
    ok(await p.evaluate(() => !document.querySelector('#layer .mat') && CP_AB === null && VIEW === 'capa'), '‹ Capa fecha a matéria');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sem rolagem lateral');
    ok(!p._erros.filter(e => !/Inexistente|ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
    await ctx.close();
  }
  const r = U.resumo(); console.log(`\nRESUMO t_etapa12: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
