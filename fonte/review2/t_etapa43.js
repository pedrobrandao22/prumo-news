// Etapa 43: Em 5 min e Últimas como stories
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f)); fs.copyFileSync(require('../t_util').REPO + '/fotos-arquivo.json', S0 + 'fotos-arquivo.json');
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8843); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8843/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ, null, 10000); await sleep(500);
  await p.evaluate(() => go('feed')); await sleep(900);
  await p.evaluate(() => document.querySelector('#secs [data-5min]').click()); await sleep(700);
  const a = await p.evaluate(() => ({ st: !!document.querySelector('#layer .story.sg'), sheet: !!document.querySelector('#layer .sheet'), sec: ST.sec, n: ST.ids.filter(x => !/#v$/.test(x)).length, nome: document.querySelector('.sg-who b')?.textContent, ord: storyOrdem().slice(0, 3) }));
  ok(a.st && !a.sheet && a.sec === '_5min' && a.n === 5 && a.nome === 'Em 5 min', '"Em 5 min" abre em story com 5 notícias ' + JSON.stringify(a));
  ok(a.ord[0] === '_5min' && a.ord[1] === '_ag' && a.ord[2] === '_ult', 'sequência: Em 5 min, Agenda, Últimas, seções ' + JSON.stringify(a));
  await p.evaluate(() => { for (let i = 0; i < 5; i++) storyGo(1); igSet('_ult', 0); drawStory() }); await sleep(600);
  const b = await p.evaluate(() => ({ sec: ST.sec, nome: document.querySelector('.sg-who b')?.textContent, h2: document.querySelector('.sg-body h2').textContent, txt: ST.itens[ST.i].txt }));
  ok(b.sec === '_ult' && b.nome === 'Últimas' && b.h2 === b.txt, 'depois do 5º, passa para Últimas, com o texto da atualização ' + JSON.stringify(b));
  await p.evaluate(() => closeLayer()); await sleep(400);
  await p.evaluate(() => document.querySelector('#secs [data-ultimas]').click()); await sleep(700);
  ok(await p.evaluate(() => !!document.querySelector('#layer .story.sg') && ST.sec === '_ult' && ST.i === 1), '"Últimas" abre em story, na primeira ainda não vista');
  await p.evaluate(() => storySec(1)); await sleep(800);
  ok(await p.evaluate(() => ST.sec === storyOrdem()[3]), 'deslizar de Últimas leva à primeira seção');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa43: ${R.OKS} ok, ${R.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'fotos-arquivo.json') } catch (e) { } process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
