// Etapa 9: Capa principal, leitura por lado, ordem das seções
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8786); await sleep(800);
  const br = await U.navegador(); const D = __dirname + '/etapa9/';
  for (const dark of [false, true]) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: dark ? 'dark' : 'light' });
    await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
    const p = U.erros(await ctx.newPage(), dark ? 'esc' : 'cla');
    await p.goto('http://localhost:8786/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(600);
    const n = dark ? 'e' : 'c';
    if (!dark) {
      ok(await p.evaluate(() => VIEW === 'capa' && RAIZ === 'capa'), 'abre na Capa');
      ok(await p.evaluate(() => [...document.querySelectorAll('.nav button')].map(b => b.textContent.trim()).slice(0, 2).join(',') === 'Capa,Feed'), 'menu: Capa, Feed');
      const ords = await p.evaluate(() => [...document.querySelectorAll('#v-capa .cp-h h3')].map(h => h.textContent.trim()).filter(t => ['Política', 'Economia', 'Brasil', 'Mundo', 'Esportes', 'Educação'].includes(t)).join(','));
      { const can = 'Política,Economia,Brasil,Mundo,Esportes,Educação'.split(','), tem = ords.split(','); /* seção sem notícia no dia não aparece: confere a ordem das que existem */ ok(tem.length >= 4 && tem.every(x => can.includes(x)) && tem.join() === can.filter(x => tem.includes(x)).join(), 'ordem das seções na Capa', ords); }
      ok(await p.evaluate(() => SECS().map(s => s.id).join(',') === 'politica,economia,brasil,mundo,esportes,educacao'), 'ordem das seções no app');
      ok(await p.evaluate(() => document.querySelectorAll('#v-capa .cp-sl').length >= 2 && document.querySelectorAll('#v-capa .cp-sl')[0].querySelectorAll('.cpi').length >= 3), 'Política com mais manchetes');
    }
    await p.screenshot({ path: D + n + '1-capa.png' });
    // abrir a manchete ali mesmo
    const man = await p.evaluate(() => document.querySelector('.cpi-man').id.slice(4));
    await p.evaluate(() => document.querySelector('.cpi-man .cpi-b').click()); await sleep(400);
    ok(await p.evaluate(m => !!document.querySelector('#cpi-' + m + ' .cpx .cpx-30') && VIEW === 'capa' && LIDAS.has(m), man), (dark ? '[escuro] ' : '') + 'tocar na manchete abre o texto ali mesmo e marca como lida');
    await p.screenshot({ path: D + n + '2-aberta.png', fullPage: false });
    // leitura da direita
    await p.evaluate(() => document.querySelector('#lp').click()); await sleep(200); await p.evaluate(() => document.querySelector('#lpm [data-lente="direita"]').click()); await sleep(400);
    const dir = await p.evaluate(() => { const c = document.querySelectorAll('#v-capa .cp-lado.direita').length; const tem = FEED.pautas.filter(x => x.direita && x.direita.titulo).length; return { c, tem, lente: PREF.lente } });
    ok(dir.lente === 'direita' && dir.c > 0, (dark ? '[escuro] ' : '') + 'leitura da direita marca os títulos com versão', dir);
    await p.evaluate(m => document.querySelector('#cpi-' + m + ' [data-cpmat]').click(), man); await sleep(400);
    const ab = await p.evaluate(() => { const el = document.querySelector('#layer .mat'); return el ? el.textContent : '' });
    const temDir = await p.evaluate(m => !!(pautaById(m).direita && pautaById(m).direita.titulo), man);
    ok(temDir ? /sem enquadramento/.test(ab) : /Sem versão da/.test(ab), 'aberta mostra a versão do lado e o fato neutro (ou avisa que não há)');
    await p.screenshot({ path: D + n + '3-direita.png' });
    await p.evaluate(() => history.back()); await sleep(500);
    await p.evaluate(() => document.querySelector('#lp').click()); await sleep(200); await p.evaluate(() => document.querySelector('#lpm [data-lente="esquerda"]').click()); await sleep(400);
    ok(await p.evaluate(() => PREF.lente === 'esquerda' && document.querySelectorAll('#v-capa .cp-lado.esquerda').length > 0), 'trocar para esquerda pelo botão');
    await p.screenshot({ path: D + n + '4-esquerda.png' });
    await p.evaluate(() => document.querySelector('#lp').click()); await sleep(250); await p.screenshot({ path: D + n + '5-menu.png' });
    ok(await p.evaluate(() => !!document.querySelector('#lpm')), 'menu de leitura abre'); await p.evaluate(() => document.querySelector('#v-capa .cp-fim').click()); await sleep(150);
    ok(await p.evaluate(() => !document.querySelector('#lpm')), 'tocar fora fecha o menu');
    if (!dark) {
      await p.reload(); await esperar(p, () => document.querySelector('#v-capa .cpi'), null, 8000); await sleep(400);
      ok(await p.evaluate(() => lente() === 'esquerda' && document.querySelector('#lp').classList.contains('esquerda') && /Esquerda/.test(document.querySelector('#lp').textContent)), 'a leitura escolhida fica guardada');
      await p.evaluate(() => { document.querySelector('#lp').click(); document.querySelector('#lpm [data-lente="neutro"]').click() }); await sleep(200);
      // ler completa e voltar
      await p.evaluate(() => document.querySelectorAll('.cpi-d1 .cpi-b')[0].click()); await sleep(300);
      await p.evaluate(() => document.querySelector('.cpx [data-cpmat]').click()); await sleep(400);
      await p.evaluate(() => document.querySelector('#layer .mat [data-capair]').click()); await sleep(700);
      ok(await p.evaluate(() => VIEW === 'feed'), 'Ler a notícia completa vai ao Feed');
      await p.evaluate(() => history.back()); await sleep(600);
      ok(await p.evaluate(() => VIEW === 'capa'), 'voltar volta à Capa');
      await p.click('#t-feed'); await sleep(400);
      ok(await p.evaluate(() => VIEW === 'feed'), 'aba Feed');
      ok(await p.evaluate(() => document.querySelector('#lp').hidden && !document.querySelector('#lpm')), 'botão de leitura só na Capa');
      await p.click('#t-busca'); await sleep(300);
      await p.evaluate(() => history.back()); await sleep(500);
      ok(await p.evaluate(() => VIEW === 'capa'), 'Busca → voltar → Capa (raiz)');
      // fechar
      await p.evaluate(() => document.querySelector('.cpi-man .cpi-b').click()); await sleep(200);
      await p.evaluate(() => document.querySelector('.cpi-man .cpi-b').click()); await sleep(200);
      ok(await p.evaluate(() => !document.querySelector('.cpx') && CP_AB === null), 'tocar de novo no título recolhe');
      const larg = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
      ok(larg, 'sem rolagem lateral');
    }
    ok(!p._erros.length, (dark ? '[escuro] ' : '') + 'sem erros ' + p._erros.join('|'));
    await ctx.close();
  }
  const r = U.resumo(); console.log(`\nRESUMO t_etapa9: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
