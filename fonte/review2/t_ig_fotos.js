// Criação (dev 3): filtros rápidos (prévia CSS/SVG × foto final), foto inteira no story, post no fluxo do Instagram
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8930/index.html'; const D = __dirname + '/ig3/', PAIS = D + 'paisagem.jpg', RET = D + 'retrato.jpg', QUA = D + 'quadrada.jpg';
const SH = __dirname + '/../shots-ig3/'; require('fs').mkdirSync(SH, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
let N = 0; const shot = async (p, nome) => { await sleep(250); await p.screenshot({ path: SH + String(++N).padStart(2, '0') + '-' + nome + '.png' }) };
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const slide = (p, k, v) => ev(p, ([k, v]) => { const r = document.querySelector(`[data-edaj2="${k}"]`); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })) }, [k, v]);
// compara a prévia (captura do elemento) com a foto final (pipeline de exportação), média da diferença absoluta 0–255
const ESCONDE = '.ce-top,.ce-bot,.ce-modos,.ce-sts,.ce-npg,.ce-nav{visibility:hidden!important}';
async function compara(p, sel, tipo) {
  const st = await p.addStyleTag({ content: ESCONDE }); await sleep(200); const png = (await (await p.$(sel)).screenshot()).toString('base64'); await ev(p, s => s.remove(), st);
  return ev(p, async ([b64, sel, tipo]) => {
    const el = document.querySelector(sel), w = Math.round(el.getBoundingClientRect().width), h = Math.round(el.getBoundingClientRect().height);
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    let src; if (tipo === 'post') { const P = ED.po, c = document.createElement('canvas'); c.width = 1080; edRenderFoto(P.fotos[P.cur], c, P.ar); src = c }
    else { const b = await edExportaStory(); src = await createImageBitmap(b) }
    const px = x => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(x, 0, 0, w, h); return g.getImageData(0, 0, w, h).data };
    const a = px(im), z = px(src); let s = 0, n = 0; for (let i = 0; i < a.length; i += 4) { s += Math.abs(a[i] - z[i]) + Math.abs(a[i + 1] - z[i + 1]) + Math.abs(a[i + 2] - z[i + 2]); n += 3 }
    return +(s / n).toFixed(2) }, [png, sel, tipo]) }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8930); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await ev(A, () => pubCarregar()); await sleep(800);

  // ===== POST: o toque no + já abre a galeria
  const [fc] = await Promise.all([A.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), clk(A, '#b-criar')]);
  ok(!!fc && fc.isMultiple(), 'tocar no + abre a galeria do aparelho direto (sem o toque a mais)');
  await shot(A, 'post-vazio-atras-da-galeria');
  await fc.setFiles([PAIS, RET, QUA]); await esperar(A, () => ED.po.fotos.length === 3, null, 6000); await sleep(400);
  ok(await ev(A, () => ED.po.multi && [...document.querySelectorAll('.ce-num.on')].map(x => x.textContent).join() === '1,2,3'), 'galeria: 3 fotos numeradas 1, 2, 3');
  ok(await ev(A, () => { const b = document.querySelector('.cfp-box').getBoundingClientRect(), pv = document.querySelector('#ce-pv').getBoundingClientRect(); return b.width === 390 && Math.abs(pv.width - 390) < 2 && Math.abs(pv.height - 487.5) < 2 }), 'prévia grande em 4:5 ocupa toda a largura (sem faixas pretas)');
  await shot(A, 'post-galeria-4x5');
  await clk(A, '[data-edar]'); await sleep(250);
  ok(await ev(A, () => { const pv = document.querySelector('#ce-pv').getBoundingClientRect(); return ED.po.ar === '1:1' && Math.abs(pv.width - pv.height) < 2 && pv.width > 385 }), 'formato 1:1: prévia quadrada grande');
  await shot(A, 'post-galeria-1x1');
  await clk(A, '[data-edar]'); await sleep(200); await clk(A, '[data-edar]'); await sleep(200); ok(await ev(A, () => ED.po.ar === '4:5'), 'formato volta para 4:5 (4:5 → 1:1 → Original → 4:5)');
  await clk(A, '[data-edav]'); await sleep(400);
  // ===== EDITAR
  ok(await ev(A, () => document.querySelectorAll('#cfp-trk .cfp-sl').length === 3 && document.querySelectorAll('.cfp-dots i').length === 3 && document.querySelector('.cfp-dots i.on') === document.querySelectorAll('.cfp-dots i')[0]), 'editar: 3 fotos lado a lado com pontinhos');
  ok(await ev(A, () => [...document.querySelectorAll('[data-edfn]')].every(b => b.getBoundingClientRect().width <= 1)), 'botões ‹ › ficam só para leitor de tela');
  ok(await ev(A, () => document.querySelectorAll('.cfp-flts [data-edflt] .cfp-th img').length === 9 && /url\(.*cfp-t-moon/.test(document.querySelector('[data-edflt="moon"] img').style.filter)), 'miniaturas mostram a foto com cada filtro');
  await shot(A, 'post-editar-filtros');
  // deslizar para a 2ª foto (gesto de toque de verdade)
  { const cdp = await A.context().newCDPSession(A); const r = await ev(A, () => { const b = document.querySelector('#cfp-trk').getBoundingClientRect(); return { x: b.x + b.width * .8, y: b.y + b.height / 2 } });
    for (const [t, k] of [['touchStart', 0], ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => ['touchMove', k]), ['touchEnd', 10]]) { await cdp.send('Input.dispatchTouchEvent', { type: t, touchPoints: t === 'touchEnd' ? [] : [{ x: Math.round(r.x - k * 26), y: Math.round(r.y), id: 1 }] }); await sleep(16) } await sleep(800); }
  ok(await ev(A, () => ED.po.cur === 1 && document.querySelectorAll('.cfp-dots i')[1].classList.contains('on')), 'deslizar o dedo vai para a 2ª foto e o pontinho acompanha');
  await clk(A, '[data-edflt="clarendon"]'); await sleep(250);
  ok(await ev(A, () => ED.po.fotos[1].f === 'clarendon' && /cfp-f1/.test(document.querySelector('[data-cfpsl="1"] .cfp-in').style.filter) && ED.po.fotos[0].f === 'normal'), 'filtro vale só para a foto da vez (prévia por CSS/SVG)');
  await shot(A, 'post-editar-clarendon-foto2');
  // prévia × foto final
  const difs = {};
  for (const [nome, cfg] of [['normal', { f: 'normal', aj: {} }], ['clarendon', { f: 'clarendon', aj: {} }], ['juno', { f: 'juno', aj: {} }], ['moon', { f: 'moon', aj: {} }], ['valencia-60', { f: 'valencia', fi: 60, aj: {} }], ['aden', { f: 'aden', aj: {} }],
    ['brilho-contraste-sat-calor', { f: 'normal', aj: { b: 30, c: 25, s: -30, w: 25 } }], ['realce-sombras-esmaecer', { f: 'normal', aj: { h: 45, sh: -35, fd: 50 } }], ['vinheta', { f: 'normal', aj: { v: 80 } }],
    ['nitidez', { f: 'normal', aj: { n: 70 } }], ['endireitar-8', { f: 'lark', aj: { b: 10 }, str: 8 }], ['tudo-junto', { f: 'juno', fi: 80, aj: { b: 15, c: 15, s: 20, w: -20, h: 20, sh: 20, fd: 20, v: 50, n: 30 } }]]) {
    await ev(A, c => { const f = ED.po.fotos[ED.po.cur]; f.f = c.f; f.fi = c.fi == null ? 100 : c.fi; f.aj = { ...c.aj }; f.str = c.str || 0; edPrevFiltro() }, cfg); await sleep(200);
    difs[nome] = await compara(A, '[data-cfpsl="1"] .cfp-fr', 'post');
    if (nome === 'tudo-junto') await shot(A, 'post-editar-tudo-junto') }
  ok(Object.values(difs).every(d => d < 4), 'prévia igual à foto final em todos os filtros/ajustes (diferença média < 4 de 255)');
  await ev(A, () => { const f = ED.po.fotos[1]; f.f = 'clarendon'; f.fi = 100; f.aj = {}; f.str = 0; edPrevFiltro() });
  // intensidade e Editar
  await clk(A, '[data-edflt="clarendon"]'); await sleep(250); ok(await ev(A, () => !!document.querySelector('.ce-fi [data-edaj2="fi"]')), 'tocar de novo no filtro abre a intensidade');
  await slide(A, 'fi', 70); await sleep(100); await clk(A, '[data-edfiok]'); await sleep(200);
  await clk(A, '[data-edaba="editar"]'); await sleep(300);
  ok(await ev(A, () => document.querySelectorAll('.cfp-tools [data-cfptool]').length === 10 && !document.querySelector('[data-cfpaj="aj"]').hidden && document.querySelector('[data-cfpaj="b"]').hidden), 'Editar: ferramentas em linha, uma régua por vez');
  await clk(A, '[data-cfptool="b"]'); await sleep(100); await slide(A, 'b', 25); await sleep(150);
  ok(await ev(A, () => ED.po.fotos[1].aj.b === 25 && document.querySelector('[data-cfptool="b"]').classList.contains('mud') && !document.querySelector('[data-cfpaj="b"]').hidden), 'ajustar Brilho marca a ferramenta');
  await shot(A, 'post-editar-ajustes');
  await clk(A, '[data-edgira]'); await sleep(250); ok(await ev(A, () => ED.po.fotos[1].rot === 1 && /^data:/.test(document.querySelector('[data-cfpsl="1"] img').src)), 'girar 90° atualiza a prévia');
  await clk(A, '[data-edav]'); await sleep(500);
  // ===== DETALHES
  ok(await ev(A, () => { const s = document.querySelector('.cfp-shb[data-edpubpo]').getBoundingClientRect(); return s.width > 340 && s.bottom > innerHeight - 30 && !document.querySelector('.ce-ph [data-edpubpo]') }), 'Compartilhar grande embaixo (não no cabeçalho)');
  ok(await ev(A, () => document.querySelectorAll('.cfp-car canvas').length === 3 && ['Marcar pessoas', 'Adicionar local', 'Texto alternativo', 'Público'].every(t => [...document.querySelectorAll('.ce-row span')].some(s => s.textContent === t))), 'final: as 3 fotos, legenda e Marcar pessoas, local, Texto alternativo, Público');
  await A.fill('#ce-leg', 'Fim de tarde na praia @Bia'); await sleep(300); await shot(A, 'post-detalhes-mencao');
  await ev(A, () => { document.querySelector('.men-box')?.remove(); if (typeof menFecha === 'function') menFecha() });
  await clk(A, '[data-cfpalt]'); await sleep(300);
  ok(await ev(A, () => ED.po.avOn && document.activeElement === document.querySelector('[data-edalt="0"]')), 'Texto alternativo abre e põe o cursor na 1ª foto');
  await A.fill('[data-edalt="0"]', 'Pôr do sol sobre os morros');
  await clk(A, '[data-cfppub]'); await sleep(200); await clk(A, '[data-cfppubv="proximos"]'); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('[data-edma]')), 'Melhores amigos com a lista vazia pede para escolher quem entra');
  await clk(A, '[data-edma]'); await sleep(400); await clk(A, '[data-edmaok]'); await sleep(300);
  ok(await ev(A, () => ED.po.pub === 'proximos' && /Melhores amigos/.test(document.querySelector('[data-cfppub] em').textContent)), 'Público: Melhores amigos');
  await shot(A, 'post-detalhes');
  await clk(A, '[data-edpubpo]'); await esperar(A, () => !ED, null, 20000); await sleep(800);
  ok(await ev(A, () => { const x = PUB.itens.find(y => y.tipo === 'post'); return x && x.fotos.length === 3 && x.publico === 'proximos' && x.estilo.alt[0] === 'Pôr do sol sobre os morros' && /Bia/.test(x.texto) }), 'post publicado com 3 fotos, texto alternativo e para os Melhores amigos');
  await ev(B, () => pubCarregar()); await sleep(1500); ok(await ev(B, () => PUB.itens.some(y => y.tipo === 'post')), 'quem está nos Melhores amigos vê o post');
  await ev(A, () => go('feed')); await sleep(600); await ev(A, () => document.querySelector('#posts .upost')?.scrollIntoView({ block: 'start' })); await sleep(500); await shot(A, 'post-no-feed');

  // ===== STORY: foto inteira
  await ev(A, () => criarAbrir('story')); await sleep(600); await A.setInputFiles('#ce-file', [PAIS]); await esperar(A, () => ED.tela === 'edit', null, 6000); await sleep(500);
  ok(await ev(A, () => { const b = ED.st.bg, i = document.querySelector('#ce-bgi').getBoundingClientRect(), c = document.querySelector('#ce-cv').getBoundingClientRect(); return b.cont === true && Math.abs(i.width - c.width) < 2 && i.height < c.height * .5 && /gradient/.test(document.querySelector('#ce-cv .ce-bg').style.background) }), 'story: foto deitada aparece inteira, centralizada, com fundo nas cores dela');
  await shot(A, 'story-paisagem-inteira');
  const dS = {}; dS.inteira = await compara(A, '#ce-cv', 'story');
  // filtro na hora (CSS) e depois em pixels
  { const r = await ev(A, () => { const b = document.querySelector('#ce-cv').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } });
    await A.mouse.move(r.x + r.w * .8, r.y + r.h * .3); await A.mouse.down(); for (let i = 1; i <= 8; i++) { await A.mouse.move(r.x + r.w * (.8 - .6 * i / 8), r.y + r.h * .31); await sleep(16) } await A.mouse.up() }
  ok(await ev(A, () => ED.st.bg.f === 'clarendon' && /cfp-t-clarendon/.test(document.querySelector('#ce-cv .ce-bg').style.getPropertyValue('--cfp'))), 'arrastar troca o filtro na hora (CSS), sem esperar o cálculo');
  await sleep(500); ok(await ev(A, () => /^data:image/.test(document.querySelector('#ce-bgi').src) && document.querySelector('#ce-cv .ce-bg').style.getPropertyValue('--cfp') === 'none'), 'depois a versão em pixels entra no lugar');
  dS.clarendon = await compara(A, '#ce-cv', 'story');
  // pinçar com dois dedos para preencher
  { const cdp = await A.context().newCDPSession(A); const c = await ev(A, () => { const b = document.querySelector('#ce-cv').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } });
    const tp = d => [{ x: c.x - d, y: c.y, id: 1 }, { x: c.x + d, y: c.y, id: 2 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(30) }); for (let d = 40; d <= 150; d += 10) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(d) }); await sleep(16) }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(300) }
  ok(await ev(A, () => ED.st.bg.z > 2.5 && document.querySelector('#ce-bgi').getBoundingClientRect().height >= document.querySelector('#ce-cv').getBoundingClientRect().height - 1), 'pinçar amplia a foto até preencher a tela');
  await shot(A, 'story-pincado');
  dS.pincado = await compara(A, '#ce-cv', 'story');
  await ev(A, () => { ED.st.bg.z = 1.4; ED.st.bg.oy = .05; edBgPos() }); await sleep(200); dS.meio = await compara(A, '#ce-cv', 'story'); await shot(A, 'story-zoom-medio');
  ok(Object.values(dS).every(d => d < 5), 'story publicado igual ao que o editor mostra (diferença média < 5 de 255)');
  // várias fotos: miniaturas também inteiras
  await clk(A, '[data-edgal]'); await A.setInputFiles('#ce-file', [RET]); await esperar(A, () => ED.sts.length === 2, null, 6000); await sleep(400);
  ok(await ev(A, () => ED.sts.every(s => s.bg.cont) && document.querySelectorAll('canvas[data-stt]').length === 2), 'vários stories: todos com a foto inteira');
  await shot(A, 'story-varios');
  await clk(A, '[data-edpubst="amigos"]'); await esperar(A, () => !ED, null, 20000); await sleep(600);
  ok(await ev(A, () => PUB.itens.filter(y => y.tipo === 'story').length === 2), '2 stories publicados');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  console.log('DIF post prévia×final (0–255):', JSON.stringify(difs)); console.log('DIF story editor×final (0–255):', JSON.stringify(dS));
  const R = U.resumo(); console.log(`\nRESUMO t_ig_fotos: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
