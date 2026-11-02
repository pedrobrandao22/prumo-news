// Etapa 19: convite para instalar o app; glossário uma vez por matéria
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  const m = f.pautas.find(p => p.id === f.capa.manchete); f.glossario = Object.assign({}, f.glossario, { 'Senado': 'Casa do Congresso.' });
  m.neutro.texto = 'O Senado votou. ' + m.neutro.texto + '\nO Senado vai votar de novo. Outra frase. Mais uma. E outra.'; m.contexto = 'O Senado tem 81 senadores.';
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8803); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa19/'; fs.mkdirSync(D, { recursive: true });
  const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
  // 1º dia: sem convite
  let ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, userAgent: IOS });
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  let p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8803/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(500);
  ok(await p.evaluate(() => !document.querySelector('.cp-inst')), '1º dia de uso: sem convite');
  // 2º dia (iPhone): instruções
  await p.evaluate(() => { localStorage.setItem('prumo-dias', JSON.stringify(['2026-10-01', hojeSP()])); renderCapa() }); await sleep(200);
  ok(await p.evaluate(() => { const c = document.querySelector('.cp-inst'); return c && /Adicionar à Tela de Início/.test(c.textContent) && !c.querySelector('[data-instok]') }), 'iPhone a partir do 2º dia: mostra como adicionar à Tela de Início');
  await p.evaluate(() => document.querySelector('.cp-inst').scrollIntoView({ block: 'center' })); await sleep(200); await p.screenshot({ path: D + 'ios.png' });
  await p.evaluate(() => document.querySelector('[data-instnao]').click()); await sleep(150);
  ok(await p.evaluate(() => { renderCapa(); return !document.querySelector('.cp-inst') }), '"Agora não" esconde por 14 dias');
  // glossário: uma vez por matéria
  await p.evaluate(() => abrirMateria(FEED.capa.manchete)); await sleep(400);
  ok(await p.evaluate(() => document.querySelectorAll('#layer .mat .gl[data-k="Senado"]').length === 1), 'glossário marca o termo só uma vez na matéria');
  await ctx.close();
  // Android com prompt
  ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.addInitScript(() => { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-dias', JSON.stringify(['2026-10-01', '2026-10-02'])) });
  p = U.erros(await ctx.newPage(), 'b'); await p.goto('http://localhost:8803/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(300);
  await p.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__pr = 1 }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); dispatchEvent(e); renderCapa() }); await sleep(200);
  ok(await p.evaluate(() => !!document.querySelector('.cp-inst [data-instok]')), 'Android: botão Instalar');
  await p.evaluate(() => document.querySelector('[data-instok]').click()); await sleep(300);
  ok(await p.evaluate(() => window.__pr === 1 && !document.querySelector('.cp-inst') && JSON.parse(localStorage.getItem('prumo-inst')).ok === 1), 'Instalar chama o pedido do sistema e some');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa19: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
