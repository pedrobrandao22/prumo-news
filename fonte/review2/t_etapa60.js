// Etapa 60: story completo (câmera, várias fotos, filtros por arrasto, texto com tamanho/animação, Melhores amigos)
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8769/index.html'; const F1 = __dirname + '/etapa13/foto.jpg', F2 = __dirname + '/../qa2/f2.jpg', F3 = __dirname + '/../qa2/f3.jpg';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../review3/var/';
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
async function arrasta(p, x0, y0, x1, y1, n = 8) { await p.mouse.move(x0, y0); await p.mouse.down(); for (let i = 1; i <= n; i++) { await p.mouse.move(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); await sleep(16) } await p.mouse.up() }
const cv = p => ev(p, () => { const b = document.querySelector('#ce-cv').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8769); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B'), C = U.erros(await H.pagina(b), 'C');
  await A.context().grantPermissions(['camera'], { origin: 'http://localhost:8769' });
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  const conv = async () => { await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); await sleep(200); return l };
  await criar(B, { url: await conv(), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  await criar(C, { url: await conv(), nome: 'Carlos Lima', email: 'c@x.com' }); const uidC = await ev(C, () => S.uid);
  await esperar(A, (u) => S.amigos.has(u[0]) && S.amigos.has(u[1]), [uidB, uidC]);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await ev(A, () => pubCarregar()); await sleep(800);
  ok(await ev(A, () => MA.on === true), 'Melhores amigos ligado com o banco novo');
  // câmera
  await ev(A, () => scrollTo(0, 0)); await clk(A, '#secs [data-meustory] .up-mais'); await sleep(300);
  ok(await esperar(A, () => !!CAM.s && document.querySelector('#ce-video')?.videoWidth > 0, null, 6000), 'abre na câmera com a imagem ao vivo');
  await A.screenshot({ path: SH + 'st60-cam.png' });
  await clk(A, '[data-edflash]'); await clk(A, '[data-edvira]'); await sleep(800); ok(await ev(A, () => CAM.f === 'user' && document.querySelector('#ce-video').classList.contains('esp')), 'virar para a câmera frontal (espelhada)');
  await clk(A, '[data-edfoto]'); await esperar(A, () => ED && ED.tela === 'edit', null, 4000); await sleep(300);
  ok(await ev(A, () => ED.st.bg.tipo === 'foto' && ED.st.bg.img.naturalWidth === 1080 && !CAM.s), 'foto tirada vira o fundo e a câmera desliga');
  // filtro arrastando para o lado
  { const r = await cv(A); await arrasta(A, r.x + r.w * .8, r.y + r.h * .5, r.x + r.w * .2, r.y + r.h * .52) } await sleep(300);
  ok(await ev(A, () => ED.st.bg.f === 'clarendon' && /^data:image/.test(document.querySelector('#ce-bgi').src)), 'arrastar para o lado aplica o filtro (Clarendon)');
  await A.screenshot({ path: SH + 'st60-filtro.png' });
  // texto grande e animado
  await clk(A, '[data-edtexto]'); await sleep(200); await A.fill('#ce-txa', 'Bom dia!');
  await ev(A, () => { const r = document.querySelector('#ce-tam'); r.value = 180; r.dispatchEvent(new Event('input', { bubbles: true })) });
  await clk(A, '[data-edtxan]'); await clk(A, '[data-edtxan]'); await A.screenshot({ path: SH + 'st60-texto.png' }); await clk(A, '[data-edtxok]'); await sleep(200);
  ok(await ev(A, () => { const t = ED.st.els.find(e => e.t === 'texto'); return t.tam === 1.8 && t.an === 'surgir' && !!document.querySelector('#ce-els .an-surgir') }), 'texto com tamanho 180% e animação Surgir');
  // guia de alinhamento
  { const r = await ev(A, () => { const e = document.querySelector('#ce-els .ce-el').getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height / 2 } }); const c = await cv(A);
    await A.mouse.move(r.x, r.y); await A.mouse.down(); await A.mouse.move(r.x + 30, r.y + 40, { steps: 4 }); await A.mouse.move(c.x + c.w * .5 + 2, r.y + 40, { steps: 4 }); await sleep(100);
    ok(await ev(A, () => !document.querySelector('#ce-gv').hidden), 'guia vertical aparece no centro'); await A.mouse.up() }
  ok(await ev(A, () => ED.st.els[0].x === .5), 'texto encaixa no centro');
  // várias fotos pela galeria
  await clk(A, '[data-edgal]'); await A.setInputFiles('#ce-file', [F2, F3]); await esperar(A, () => ED.sts.length === 3, null, 5000);
  ok(await ev(A, () => ED.sts.length === 3 && ED.si === 1 && document.querySelectorAll('.ce-stb canvas').length === 3), '2 fotos da galeria viram mais 2 stories com miniaturas');
  await A.screenshot({ path: SH + 'st60-varios.png' });
  // publicar os 3
  await clk(A, "[data-edpubst='amigos']"); await esperar(A, () => !ED, null, 15000); await sleep(800);
  ok(await ev(A, () => pubStoriesDe(S.uid).length === 3), '3 stories publicados de uma vez');
  ok(await ev(A, () => { const x = pubStoriesDe(S.uid)[0]; return x.publico === 'amigos' && x.estilo.itens.some(i => i.t === 'texto' && i.an === 'surgir') }), 'texto animado continua vivo no story publicado');
  // Melhores amigos (o Layout saiu da câmera com o foco, 105)
  await clk(A, '#secs [data-meustory] .up-mais'); await sleep(400);
  await esperar(A, () => !!CAM.s && document.querySelector('#ce-video')?.videoWidth > 0, null, 6000); await clk(A, '[data-edfoto]'); await esperar(A, () => ED && ED.tela === 'edit', null, 4000); await sleep(300);
  ok(await ev(A, () => !document.querySelector('[data-edlayout]')), 'câmera sem Layout');
  await clk(A, "[data-edpubst='proximos']"); await sleep(300); ok(await ev(A, () => !!document.querySelector('.ce-sel [data-edma]')), 'sem lista: abre a lista dos Melhores amigos');
  await clk(A, `[data-edma="${uidB}"]`); await sleep(500); await clk(A, '[data-edmaok]'); await sleep(200);
  ok(await ev(A, (u) => MA.set.has(u) && MA.set.size === 1, uidB), 'Bia entrou na lista');
  await A.screenshot({ path: SH + 'st60-layout-ed.png' });
  await clk(A, "[data-edpubst='proximos']"); await esperar(A, () => !ED, null, 10000); await sleep(800);
  ok(await ev(A, () => pubStoriesDe(S.uid).slice(-1)[0].publico === 'proximos'), 'story publicado para Melhores amigos');
  // B vê (anel verde), C não vê o story dos Melhores amigos
  for (const P of [B, C]) { await ev(P, () => go('feed')); await sleep(300); await ev(P, () => pubCarregar()); await sleep(1500) }
  ok(await ev(B, () => pubStoriesDe([...S.amigos][0]).length === 4 && !!document.querySelector('#secs [data-ustory] .ig-r.ma')), 'Bia vê 4 stories e o anel verde');
  ok(await ev(C, () => pubStoriesDe([...S.amigos][0]).length === 3), 'Carlos não vê o story dos Melhores amigos');
  await B.screenshot({ path: SH + 'st60-rowB.png', clip: { x: 0, y: 0, width: 390, height: 200 } });
  await clk(B, '#secs [data-ustory]'); await sleep(1500); ok(await ev(B, () => !!document.querySelector('#layer .us2-img') && !!document.querySelector('#layer .us-tx .an-surgir')), 'story com texto animado ao vivo para a amiga');
  await B.screenshot({ path: SH + 'st60-verB.png' });
  ok(!A._erros.length && !B._erros.length && !C._erros.length, 'sem erros ' + A._erros.concat(B._erros, C._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa60: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
