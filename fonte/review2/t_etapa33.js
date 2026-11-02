// Etapa 33: fluidez — quadro e voltar sem remontar a Capa; aba Capa só remonta se mudou; Feed ajusta só o que está perto; espaços
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8833); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.abort());
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8833/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(800);
  await p.evaluate(() => { window.__man = document.querySelector('#v-capa .cpi-man'); window.__rc = 0; const o = renderCapa; renderCapa = function () { window.__rc++; return o.apply(this, arguments) } });
  const id = await p.evaluate(() => document.querySelectorAll('#v-capa .cp-dest .cpi')[1].id.slice(4));
  await p.evaluate(id => document.querySelector('#cpi-' + id + ' .cpi-b').click(), id); await sleep(300);
  ok(await p.evaluate(id => window.__rc === 0 && document.querySelector('#cpi-' + id).classList.contains('aberto') && !!document.querySelector('#cpi-' + id + ' > .cpx') && window.__man.isConnected, id), 'abrir o quadro de 30 s muda só aquele cartão (Capa não é remontada)');
  await p.evaluate(id => document.querySelector('#cpi-' + id + ' .cpx-30').click(), id); await sleep(600);
  await p.evaluate(() => closeLayer()); await sleep(600);
  ok(await p.evaluate(id => window.__rc === 0 && !document.querySelector('#cpi-' + id + ' > .cpx') && window.__man.isConnected, id), 'voltar da matéria fecha o quadro sem remontar a Capa');
  await p.evaluate(() => document.querySelector('.nav [data-v="me"]').click()); await sleep(500); await p.evaluate(() => document.querySelector('.nav [data-v="capa"]').click()); await sleep(500);
  ok(await p.evaluate(() => window.__rc === 0 && window.__man.isConnected), 'voltar para a aba Capa sem mudança não remonta');
  await p.evaluate(() => { lente && PREF && (PREF.lente = PREF.lente) ; LIDAS.set('x-teste', new Date().toISOString()) }); await p.evaluate(() => document.querySelector('.nav [data-v="me"]').click()); await sleep(300); await p.evaluate(() => document.querySelector('.nav [data-v="capa"]').click()); await sleep(400);
  ok(await p.evaluate(() => window.__rc === 1), 'se algo mudou (leitura), a Capa remonta');
  ok(await p.evaluate(() => { const a = document.querySelector('#v-capa .cp-dest').getBoundingClientRect().bottom, b = document.querySelector('#v-capa .cp > .cp-1m').getBoundingClientRect().top; return b - a >= 14 }), 'respiro entre os destaques e o "Dia em 1 minuto"');
  // Feed: só os carrosséis perto da tela são medidos
  await p.evaluate(() => { window.__ft = 0; const o = fitTrack; fitTrack = function () { window.__ft++; return o.apply(this, arguments) } });
  await p.evaluate(() => document.querySelector('.nav [data-v="feed"]').click()); await sleep(900);
  const ft = await p.evaluate(() => ({ n: window.__ft, tot: document.querySelectorAll('.track').length }));
  ok(ft.n > 0 && ft.n < ft.tot + 3, `Feed mede só os carrosséis perto da tela (${ft.n} de ${ft.tot})`);
  await p.evaluate(() => { scrollTo(0, 0); FILTRO = 'economia'; renderSecs(); renderPosts() }); await sleep(800);
  ok(await p.evaluate(() => { const d = document.querySelector('.sh4-mais'); return !d || (d.querySelector('summary') && !d.open && document.querySelectorAll('.sh4-b > .sh4-cal li').length <= 4) }), 'calendário da seção mostra 4 datas e "Ver mais"');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa33: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
