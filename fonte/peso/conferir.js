// Peso: abre o site dividido e confere: sem erros, as partes 2 e 3 chegam sozinhas, e quantas vezes um apelido precisou buscar a parte dele na hora
const U = require('../t_util'); const { sleep, esperar } = U; const PASTA = process.argv[2] || 'site-ct210', PORTA = 9332;
(async () => { U.feedFresco(PASTA); const srv = U.servir(PASTA, PORTA); await sleep(800); const br = await U.navegador(); const H = await require('../harness').criar();
  const id = await H.criarConta('a@x', '123456'); await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin')`, [id]);
  for (const k of ['visitante', 'admin']) {
    const p = U.erros(await H.pagina(br, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, sessao: k === 'admin' ? { user: { id, email: 'a@x' } } : undefined }), k);
    const t0 = Date.now(); await p.goto(`http://localhost:${PORTA}/index.html`); await esperar(p, () => window.__prumoPronto && typeof FEED !== 'undefined' && FEED, null, 20000);
    const pronto = Date.now() - t0; await sleep(3000);
    const r = await p.evaluate(() => ({ p2: !!(window.__PF || {})[2], p3: !!(window.__PF || {})[3], sinc: (window.__psinc || []).length, quais: (window.__psinc || []).slice(0, 8) }));
    await p.evaluate(() => { go('feed') }); await sleep(800); await p.evaluate(() => { const b = document.querySelector('#v-capa [data-capmat]') || document.querySelector('[data-capmat]'); b && b.click() }); await sleep(1000);
    if (k === 'admin') { await p.evaluate(() => { closeLayer._ok = true; closeLayer(); closeLayer._ok = false; try { abrirAdmin() } catch (e) { console.error('abrirAdmin', e) } }); await sleep(1500); r.admin = await p.evaluate(() => !!document.querySelector('#layer') && document.querySelector('#layer').innerText.slice(0, 60)) }
    console.log(k, 'pronto em', pronto, 'ms', JSON.stringify(r), 'erros:', p._erros.slice(0, 3)) }
  await br.close(); srv.kill(); process.exit(0) })().catch(e => { console.error(e); process.exit(2) });
