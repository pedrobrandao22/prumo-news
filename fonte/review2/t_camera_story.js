// 096: câmera do story — zoom (barra) e toque duplo para virar; sem Boomerang nem Timer (o trilho começa pela notícia). Era o t_ig_reels até 13/11.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORT = 8940, BASE = `http://localhost:${PORT}/index.html`; const VID = __dirname + '/teste.webm';
const SH = __dirname + '/../shots-ig4/'; require('fs').mkdirSync(SH, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const shot = async (p, nome) => { await sleep(300); await p.screenshot({ path: SH + nome + '.png' }) };
const caixa = (p, sel) => ev(p, s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }, sel);
async function arrasta(p, x0, y0, x1, y1, n = 10) { await p.mouse.move(x0, y0); await p.mouse.down(); for (let i = 1; i <= n; i++) { await p.mouse.move(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); await sleep(20) } await p.mouse.up() }
const fechaEd = async p => { await ev(p, () => { if (window.camDesliga) camDesliga(); ED = null; closeLayer._ok = true; closeLayer() }); await sleep(300) };
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORT); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const A = U.erros(await H.pagina(b), 'A');
  // a câmera falsa não tem zoom: simula um aparelho com zoom para testar a barra e a pinça
  await A.context().addInitScript(() => { const gc = MediaStreamTrack.prototype.getCapabilities; MediaStreamTrack.prototype.getCapabilities = function () { const c = gc ? gc.call(this) : {}; if (this.kind === 'video') c.zoom = { min: 1, max: 4, step: 0.1 }; return c };
    MediaStreamTrack.prototype.applyConstraints = function (x) { const z = x && x.advanced && x.advanced[0] && x.advanced[0].zoom; if (z) window.__zoom = z; return Promise.resolve() } });
  await A.context().grantPermissions(['camera', 'microphone'], { origin: `http://localhost:${PORT}` });
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  // ===== câmera do story: trilho, zoom, toque duplo =====
  await ev(A, () => criarAbrir('story')); await esperar(A, () => document.querySelector('#ce-video')?.videoWidth > 0, null, 6000); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('.ce.t-cam .ce-rail') && !document.querySelector('[data-rcboom],[data-rctimer]')), 'câmera do story: trilho sem Boomerang nem Timer');
  ok(await ev(A, () => !document.querySelector('#rc-zoom').hidden && RC.zoom && RC.zoom.max === 4), 'zoom aparece quando a câmera tem zoom');
  await ev(A, () => { const r = document.querySelector('#rc-zoom input'); r.value = 2.5; r.dispatchEvent(new Event('input')) }); await sleep(100);
  ok(await ev(A, () => Math.abs(window.__zoom - 2.5) < .01 && /2,5/.test(document.querySelector('#rc-zl').textContent)), 'barra de zoom aplica 2,5×');
  await shot(A, '01-story-camera-zoom');
  { const r = await caixa(A, '#ce-cv'); const f0 = await ev(A, () => CAM.f); await A.mouse.click(r.x + r.w / 2, r.y + r.h * .4); await sleep(120); await A.mouse.click(r.x + r.w / 2, r.y + r.h * .4); await sleep(300);
    ok(await ev(A, f => CAM.f !== f, f0), 'toque duplo na prévia vira a câmera'); await esperar(A, () => document.querySelector('#ce-video')?.videoWidth > 0 && CAM.s, null, 6000); await sleep(300) }
  await fechaEd(A);
  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_camera_story: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
