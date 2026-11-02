// Mede o custo da prévia de filtros/ajustes do post (CPU 4x mais lenta, ~celular médio). Funciona no código antigo e no novo.
const U = require('../t_util'); const { sleep, esperar } = U;
const PORT = 8938, BASE = `http://localhost:${PORT}/index.html`; const F1 = __dirname + '/ig3/retrato.jpg';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORT); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador(); const DPR = +(process.env.DPR || 1); const nc = b.newContext.bind(b); b.newContext = o => nc({ ...o, deviceScaleFactor: DPR });
  const A = U.erros(await H.pagina(b), 'A');
  await A.goto(BASE); await esperar(A, () => document.querySelectorAll('.post').length > 0);
  await esperar(A, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(A, '#avisoconta [data-entrar]'); await clk(A, '[data-laba="criar"]');
  await A.fill('#lnome', 'P'); await A.fill('#lemail', 'p@x.com'); await A.fill('#lsenha', '123456'); await clk(A, '#lform [type=submit]'); await esperar(A, () => S.membro, null, 8000); await sleep(600);
  await A.evaluate(() => { if (document.querySelector('.sheet')) closeLayer() }); await esperar(A, () => PUB.on === true, null, 8000);
  await A.evaluate(() => criarAbrir('post')); await sleep(300); await A.setInputFiles('#ce-pfile', [F1]); await esperar(A, () => ED.po.fotos.length === 1);
  await clk(A, '[data-edav]'); await sleep(400); await clk(A, '[data-edaba="editar"]'); await sleep(400);
  const cdp = await A.context().newCDPSession(A); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const r = await A.evaluate(async () => {
    const raf = () => new Promise(r => requestAnimationFrame(() => r())); const novo = typeof cfpAtualiza === 'function'; const P = ED.po, f = P.fotos[0];
    // 1) custo por evento de slider (do input até o quadro pintado)
    async function porEvento(aj, fil, n) { f.aj = { ...aj }; f.f = fil; const k = 'b'; const r = document.querySelector('[data-edaj2="b"]'); const ts = [];
      for (let i = 0; i < n; i++) { await raf(); const t0 = performance.now(); const v = (i % 2 ? 12 : -12) + i; r.value = v;
        if (novo) { r.dispatchEvent(new Event('input', { bubbles: true })); await raf(); await raf() }
        else { f.aj.b = v; const c = document.querySelector('#ce-fc'); edRenderFoto(f, c, P.ar); await raf(); await raf() }
        ts.push(performance.now() - t0) }
      ts.sort((a, b) => a - b); return { med: Math.round(ts[n >> 1]), p90: Math.round(ts[Math.floor(n * .9)]) } }
    const um = await porEvento({ b: 10 }, 'normal', 12);
    const tudo = await porEvento({ b: 10, c: 10, s: 10, w: 10, h: 10, sh: 10, fd: 20, v: 30, n: 30 }, 'juno', 12);
    // 2) arrastar: um input por quadro durante 40 quadros; intervalo médio entre quadros
    async function arrasta(aj, fil) { f.aj = { ...aj }; f.f = fil; const r2 = document.querySelector('[data-edaj2="c"]'); const iv = []; let ult = performance.now();
      for (let i = 0; i < 40; i++) { await raf(); const now = performance.now(); iv.push(now - ult); ult = now; r2.value = i - 20; r2.dispatchEvent(new Event('input', { bubbles: true })) }
      await new Promise(r => setTimeout(r, 1200)); iv.shift(); iv.sort((a, b) => a - b);
      return { medio: Math.round(iv.reduce((a, b) => a + b, 0) / iv.length), p90: Math.round(iv[Math.floor(iv.length * .9)]) } }
    const drag = { um: await arrasta({}, 'normal'), filtro_e_cor: await arrasta({ b: 10, s: 10, w: 10, fd: 20, v: 30 }, 'juno'), tudo: await arrasta({ b: 10, c: 10, s: 10, w: 10, h: 10, sh: 10, fd: 20, v: 30, n: 30 }, 'juno') };
    const js = {}; for (const [nm, aj, fil] of [['um', { b: 10 }, 'normal'], ['tudo', { b: 10, c: 10, s: 10, w: 10, h: 10, sh: 10, fd: 20, v: 30, n: 30 }, 'juno']]) { f.aj = { ...aj }; f.f = fil; const c = document.createElement('canvas'); c.width = Math.min(720, Math.round(390 * Math.min(2, devicePixelRatio || 1))); const t0 = performance.now();
      for (let i = 0; i < 6; i++) { f.aj.b = i; if (novo) cfpAtualiza(P.cur); else edRenderFoto(f, c, P.ar) } js[nm] = +((performance.now() - t0) / 6).toFixed(1) }
    let lt = 0; const ob = new PerformanceObserver(l => l.getEntries().forEach(e => lt += e.duration)); ob.observe({ type: 'longtask', buffered: false });
    const dragLT = await arrasta({ b: 10, c: 10, s: 10, w: 10, h: 10, sh: 10, fd: 20, v: 30, n: 30 }, 'juno'); ob.disconnect();
    // 3) trocar de filtro tocando na tira
    const fl = []; if (document.querySelector('[data-edaba="filtros"]')) { document.querySelector('[data-edaba="filtros"]').click(); await raf(); await raf() }
    for (const k of ['clarendon', 'juno', 'moon', 'valencia', 'lark']) { const bt = document.querySelector(`[data-edflt="${k}"]`); await raf(); const t0 = performance.now(); bt.click(); if (!novo) { await new Promise(r => setTimeout(r, 40)) } await raf(); await raf(); fl.push(performance.now() - t0) }
    fl.sort((a, b) => a - b);
    return { codigo: novo ? 'novo (CSS/SVG)' : 'antigo (pixels em JS)', porEvento_1ajuste: um, porEvento_tudo: tudo, arrastar_intervaloQuadro: drag, trocarFiltro_med: Math.round(fl[2]), jsPrincipalPorAtualizacao_ms: js, tarefasLongas_arrastar40quadros_ms: Math.round(lt), dpr: devicePixelRatio } });
  console.log('PERF (CPU 4x):', JSON.stringify(r));
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await b.close(); srv.kill(); process.exit(0) })().catch(e => { console.error(e); process.exit(2) });
