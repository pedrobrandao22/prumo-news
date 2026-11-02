// Etapa 15: Capa direto nas notícias; lida sem esmaecer; transições (matéria lateral, arrastar, janelas que descem)
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  f.pautas.forEach((p, i) => { p.foto = { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Foto' + i + '.jpg', credito: 'Foto: Fulano/Agência Senado', alt: 'teste' } });
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8788); await sleep(800);
  const br = await U.navegador(); const D = __dirname + '/etapa15/';
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-teste-anim', '1') });
  const p = U.erros(await ctx.newPage(), 'c');
  await p.goto('http://localhost:8788/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(700);
  const c1 = await p.evaluate(() => { const cp = document.querySelector('#v-capa .cp'); const ch = [...cp.children]; const i1m = ch.findIndex(x => x.classList.contains('cp-1m')), idest = ch.findIndex(x => x.classList.contains('cp-dest'));
    return { top: !!cp.querySelector('.cp-top'), nov: !!cp.querySelector('.cp-nov'), primeiro: ch[0].className, i1m, idest, y: ch[0].getBoundingClientRect().top } });
  ok(c1.top && !c1.nov && /cp-top/.test(c1.primeiro), 'Capa começa com o cabeçalho do jornal (voltou na etapa 26)', c1);
  ok(c1.i1m > c1.idest && c1.idest > 1, '"O dia em 1 minuto" fica depois dos destaques', c1);
  await p.screenshot({ path: D + 'capa.png' });
  // lida: sem esmaecer
  const mid = await p.evaluate(() => FEED.capa.manchete);
  await p.evaluate(id => { marcarLida(id); renderCapa() }, mid); await sleep(200);
  const ld = await p.evaluate(id => { const el = document.getElementById('cpi-' + id); const b = el.querySelector('.cpi-b'); const t = el.querySelector('.cp-t'); return { lida: el.classList.contains('lida'), op: getComputedStyle(b).opacity, opEl: getComputedStyle(el).opacity, cor: getComputedStyle(t).color, after: getComputedStyle(t, '::after').content, k: getComputedStyle(el.querySelector('.cp-k'), '::after').content } }, mid);
  const outra = await p.evaluate(() => { const el = [...document.querySelectorAll('#v-capa .cpi:not(.lida) .cp-t')][0]; return getComputedStyle(el).color });
  ok(ld.lida && ld.op === '1' && ld.opEl === '1' && (ld.after === 'none' || ld.after === 'normal'), 'lida: sem esmaecer', ld);
  ok(/✓/.test(ld.k), 'lida: só um ✓ discreto no chapéu', ld.k);
  // abrir matéria: entra pela lateral
  await p.evaluate(id => { document.querySelector('#cpi-' + id + ' .cpi-b').click() }, mid); await sleep(250);
  await p.evaluate(id => document.querySelector('#cpi-' + id + ' .cpx-30').click(), mid); await sleep(80);
  ok(await p.evaluate(() => { const m = document.querySelector('#layer .mat'); return m && m.classList.contains('mat-entra') && getComputedStyle(m).animationName === 'matEntra' }), 'matéria entra pela lateral');
  await sleep(400);
  // próxima: a anterior sai para a esquerda por baixo
  await p.evaluate(() => document.querySelector('#layer [data-matprox]').click()); await sleep(60);
  ok(await p.evaluate(() => !!document.querySelector('.saida.sai-esq .mat') && !document.querySelector('.saida [id]')), 'próxima: a anterior desliza para a esquerda (cópia sem ids)');
  await sleep(450);
  ok(await p.evaluate(() => !document.querySelector('.saida')), 'cópia de saída é removida');
  // arrastar para a esquerda acompanha o dedo e abre a próxima
  const pid1 = await p.evaluate(() => MAT_PID), prox = await p.evaluate(() => document.querySelector('#layer [data-matprox]').dataset.matprox);
  const arrasta = async (x0, x1, passos) => p.evaluate(([x0, x1, n]) => { const el = document.querySelector('#layer .mat h1'); const T = x => new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 });
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [T(x0)], changedTouches: [T(x0)] }));
    let tr = ''; for (let i = 1; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; el.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [T(x)], changedTouches: [T(x)] })); if (i === n) tr = document.querySelector('#layer .mat').style.transform }
    return tr }, [x0, x1, passos]);
  const tr = await arrasta(300, 150, 6);
  ok(/translateX\(-/.test(tr), 'arrastar para a esquerda move a matéria junto', tr);
  await p.evaluate(() => { const el = document.querySelector('#layer .mat h1'); const t = new Touch({ identifier: 1, target: el, clientX: 150, clientY: 400 }); el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t] })) }); await sleep(500);
  ok(await p.evaluate(a => MAT_PID === a, prox), 'soltar abre a próxima');
  // arrastar para a direita volta à Capa
  const tr2 = await arrasta(40, 260, 6);
  ok(/translateX\(2/.test(tr2), 'arrastar para a direita move a matéria junto', tr2);
  await p.evaluate(() => { const el = document.querySelector('#layer .mat h1'); const t = new Touch({ identifier: 1, target: el, clientX: 260, clientY: 400 }); el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t] })) }); await sleep(700);
  ok(await p.evaluate(() => !document.querySelector('#layer .mat') && VIEW === 'capa' && HST === 0 && !document.querySelector('.saida')), 'soltar à direita volta para a Capa (sem cópia extra)');
  // arrasto curto volta ao lugar
  await p.evaluate(id => { abrirMateria(id) }, mid); await sleep(450);
  await arrasta(100, 140, 3);
  await p.evaluate(() => { const el = document.querySelector('#layer .mat h1'); const t = new Touch({ identifier: 1, target: el, clientX: 140, clientY: 400 }); el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t] })) }); await sleep(350);
  ok(await p.evaluate(() => !!document.querySelector('#layer .mat') && !document.querySelector('#layer .mat').style.transform), 'arrasto curto: matéria volta ao lugar');
  // fechar pelo botão: cópia desliza para a direita
  await p.evaluate(() => document.querySelector('.mat-v').click()); await sleep(60);
  ok(await p.evaluate(() => !!document.querySelector('.saida.sai-mat .mat') && !document.querySelector('#layer .mat')), 'fechar: a matéria sai pela direita');
  await sleep(450);
  // janela (sheet) desce ao fechar
  await p.evaluate(() => document.querySelector('#v-capa [data-indg]')?.click()); await sleep(450);
  const temSheet = await p.evaluate(() => !!document.querySelector('#layer .sheet'));
  if (temSheet) { await p.evaluate(() => history.back()); await sleep(60); ok(await p.evaluate(() => !!document.querySelector('.saida.sai-sheet .sheet') && !document.querySelector('#layer .sheet')), 'janela desce ao fechar'); await sleep(400) }
  // troca de aba: só esmaece
  await p.evaluate(() => go('feed')); await sleep(30);
  ok(await p.evaluate(() => { const s = document.querySelector('#v-feed'); return !s.classList.contains('entra') || getComputedStyle(s).animationName === 'vEsmaece' }), 'troca de aba só esmaece');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  await ctx.close();
  const r = U.resumo(); console.log(`\nRESUMO t_etapa15: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
