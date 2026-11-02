// Etapa 10: em 30 segundos, o dia em 1 minuto, fontes discretas
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  const ord = [...f.pautas].sort((a, b) => b.prioridade - a.prioridade);
  const m = f.capa.manchete; const P = f.pautas.find(p => p.id === m);
  P.neutro.pontos = ['Ponto um do fato principal.', 'R$ 5,35: o número que importa.', 'Próximo passo na sexta (30).'];
  if (P.direita) P.direita.pontos = ['Como a direita conta, ponto um.', 'Ponto dois da direita.', 'Ponto três da direita.'];
  f.resumo_dia = { itens: ord.slice(0, 5).map((p, i) => ({ pid: p.id, texto: 'Linha ' + (i + 1) + ' do dia sobre ' + p.id })) };
  f.resumo_dia.itens.push({ pid: 'nao-existe', texto: 'linha órfã' });
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8787); await sleep(800);
  const br = await U.navegador(); const D = __dirname + '/etapa10/';
  for (const dark of [false, true]) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: dark ? 'dark' : 'light' });
    await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
    const p = U.erros(await ctx.newPage(), dark ? 'esc' : 'cla'); const n = dark ? 'e' : 'c';
    await p.goto('http://localhost:8787/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(500);
    ok(await p.evaluate(() => document.querySelectorAll('.cp-1m li').length === 5 && /Linha 1 do dia/.test(document.querySelector('.cp-1m').textContent) && !/órfã/.test(document.querySelector('.cp-1m').textContent)), (dark ? '[e] ' : '') + 'O dia em 1 minuto (sem linha de pauta inexistente)');
    ok(await p.evaluate(() => !/veículos/.test(document.querySelector('.cpi-man .cp-meta').textContent)), 'manchete sem contagem de veículos');
    await p.screenshot({ path: D + n + '1-capa.png' });
    await p.evaluate(() => document.querySelector('.cpi-man .cpi-b').click()); await sleep(300);
    ok(await p.evaluate(m => { const x = document.querySelector('#cpi-' + m + ' .cpx-30'); return x && x.querySelectorAll('li').length === 3 && /Ponto um/.test(x.textContent) && !document.querySelector('#cpi-' + m + ' .cpx-tx') }, m), 'aberta: Em 30 segundos com os 3 pontos, texto longo guardado');
    ok(await p.evaluate(m => !/veículos|Guardar|Abrir no feed/.test(document.querySelector('#cpi-' + m + ' .cpx').textContent), m), 'quadro limpo: sem fontes, Guardar nem Abrir no feed');
    await p.screenshot({ path: D + n + '2-30s.png' });
    await p.evaluate(m => document.querySelector('#cpi-' + m + ' [data-cpmat]').click(), m); await sleep(400);
    ok(await p.evaluate(() => !!document.querySelector('#layer .mat .mat-p') && /Fontes/.test(document.querySelector('#layer .mat .mat-rod').textContent)), 'tocar no quadro abre a matéria completa (fontes discretas no rodapé)');
    await p.evaluate(() => history.back()); await sleep(500);
    if (P.direita) {
      await p.evaluate(() => { document.querySelector('#lp').click(); document.querySelector('#lpm [data-lente="direita"]').click() }); await sleep(300);
      await p.evaluate(m => { if (!document.querySelector('#cpi-' + m + ' .cpx-30')) document.querySelector('#cpi-' + m + ' .cpi-b').click() }, m); await sleep(300);
      ok(await p.evaluate(m => /Como a direita conta/.test(document.querySelector('#cpi-' + m + ' .cpx-30').textContent), m), 'pontos da direita');
      await p.evaluate(() => { document.querySelector('#lp').click(); document.querySelector('#lpm [data-lente="neutro"]').click() }); await sleep(200);
    }
    // outra notícia sem pontos: usa frases do texto
    const outro = await p.evaluate(() => { const b = document.querySelector('.cp-dest .cpi-b'); b.click(); return b.dataset.cpx }); await sleep(300);
    ok(await p.evaluate(o => { const x = document.querySelector('#cpi-' + o + ' .cpx-30'); return x && x.querySelectorAll('li').length >= 1 }, outro), 'sem pontos: usa as frases do texto');
    // tocar numa linha do 1 minuto abre a notícia ali
    await p.evaluate(() => window.scrollTo(0, 0)); await p.evaluate(() => document.querySelectorAll('.cp-1m [data-cp1m]')[2].click()); await sleep(700);
    ok(await p.evaluate(() => { const pid = document.querySelectorAll('.cp-1m [data-cp1m]')[2].dataset.cp1m; return MAT_PID === pid && !!document.querySelector('#layer .mat') }), 'linha do 1 minuto abre a matéria completa (etapa 26)');
    await p.evaluate(() => history.back()); await sleep(500);
    await p.screenshot({ path: D + n + '3-linha.png' });
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sem rolagem lateral');
    ok(!p._erros.length, (dark ? '[e] ' : '') + 'sem erros ' + p._erros.join('|'));
    await ctx.close();
  }
  const r = U.resumo(); console.log(`\nRESUMO t_etapa10: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
