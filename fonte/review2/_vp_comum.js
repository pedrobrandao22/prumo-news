// Cenário comum para t_ver_posts: Pedro (A) publica post de 3 fotos com marcação e local; Bia (B) é amiga.
const U = require('../t_util'); const { sleep, esperar } = U;
const F1 = __dirname + '/etapa13/foto.jpg', F2 = __dirname + '/../qa2/f2.jpg', F3 = __dirname + '/../qa2/f3.jpg';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const CDP = new Map();
async function cdp(p) { if (!CDP.has(p)) CDP.set(p, await p.context().newCDPSession(p)); return CDP.get(p) }
async function swipe(p, x0, y0, x1, y1, n = 10, ms = 16) { const c = await cdp(p); await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= n; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / n, y: y0 + (y1 - y0) * i / n }] }); await sleep(ms) }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
const rect = (p, sel) => ev(p, s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, cx: b.x + b.width / 2, cy: b.y + b.height / 2 } }, sel);
async function tapSel(p, sel) { const r = await rect(p, sel); if (!r) throw new Error('sem ' + sel); await p.touchscreen.tap(r.cx, r.cy) }
const fimPub = p => esperar(p, () => !ED && (typeof PQ === 'undefined' || !PQ.atual), null, 25000);
async function criar(p, BASE, { url, nome, email }) {
  await p.goto(url || BASE); await ev(p, () => { localStorage.setItem('prumo-teste-semreels', '1') });
  await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
async function convite(P) { await ev(P, () => go('me')); await sleep(300); await clk(P, '[data-convidar]'); await sleep(150); await clk(P, '[data-gerarconvite]'); await esperar(P, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(P, () => document.querySelector('#cvurl').value); await ev(P, () => closeLayer()); return l }
async function cenario(PORT, opt = {}) {
  const BASE = `http://localhost:${PORT}/index.html`;
  U.feedFresco('site'); const srv = U.servir('site', PORT); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, BASE, { nome: 'Pedro Brandão', email: 'a@x.com' }); const link = await convite(A);
  await criar(B, BASE, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  const uidA = await ev(A, () => S.uid);
  for (const p of [A, B]) { await ev(p, () => go('feed')); await esperar(p, () => PUB.on === true, null, 8000) }
  // post de 3 fotos com marcação e local
  await ev(A, () => criarAbrir('post')); await sleep(400); await clk(A, '[data-edpgal]'); await A.setInputFiles('#ce-pfile', [F1, F2, F3]); await esperar(A, () => ED.po.fotos.length === 3, null, 6000); await sleep(300);
  await clk(A, '[data-edav]'); await sleep(400); await clk(A, '[data-edav]'); await sleep(500);
  await A.fill('#ce-leg', 'Domingo de sol no Rio com a família toda reunida depois de muito tempo. Fomos ao Arpoador ver o pôr do sol, depois comemos pastel na feira e terminamos o dia conversando na varanda até tarde. @Bia obrigado pela companhia #domingo');
  await A.fill('#ce-local', 'Arpoador, Rio de Janeiro, praia linda no fim da tarde').catch(() => { });
  try { await clk(A, '[data-edtags]'); await sleep(500); const r = await rect(A, '#ce-tgb'); await A.mouse.click(r.x + r.w * .4, r.y + r.h * .5); await sleep(400); await clk(A, '[data-edtagu]'); await sleep(300); await clk(A, '[data-edtagok]'); await sleep(300) } catch (e) { }
  if (opt.antesPublicar) await opt.antesPublicar(A);
  await clk(A, '[data-edpubpo]'); await fimPub(A); await sleep(800);
  // post de 1 foto
  await ev(A, () => criarAbrir('post')); await sleep(400); await clk(A, '[data-edpgal]'); await A.setInputFiles('#ce-pfile', [F2]); await esperar(A, () => ED.po.fotos.length === 1, null, 6000); await sleep(300);
  await clk(A, '[data-edav]'); await sleep(400); await clk(A, '[data-edav]'); await sleep(400); await A.fill('#ce-leg', 'Café da manhã ☕');
  await clk(A, '[data-edpubpo]'); await fimPub(A); await sleep(800);
  await ev(B, () => { go('feed'); pubCarregar() }); await sleep(2500);
  const P3 = await ev(B, () => { const e = [...document.querySelectorAll('#posts .upost')].find(e => e.querySelectorAll('.up-sl').length >= 3); return e && e.id });
  const P1 = await ev(B, () => { const e = [...document.querySelectorAll('#posts .upost')].find(e => e.querySelectorAll('.up-sl').length === 1 && e.querySelector('.up-img')); return e && e.id });
  return { H, b, A, B, srv, uidA, uidB, P3, P1, BASE };
}
module.exports = { cenario, clk, ev, swipe, rect, tapSel, sleep, esperar, U };
