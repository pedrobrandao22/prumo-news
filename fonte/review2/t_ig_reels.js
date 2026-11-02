// 096: Reels e câmera — corte em tira de quadros, texto/figurinha gravados no reel, capa, Boomerang, timer, toque duplo, zoom, anel, publicar sem refazer
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
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  // a câmera falsa não tem zoom: simula um aparelho com zoom para testar a barra e a pinça
  await A.context().addInitScript(() => { const gc = MediaStreamTrack.prototype.getCapabilities; MediaStreamTrack.prototype.getCapabilities = function () { const c = gc ? gc.call(this) : {}; if (this.kind === 'video') c.zoom = { min: 1, max: 4, step: 0.1 }; return c };
    MediaStreamTrack.prototype.applyConstraints = function (x) { const z = x && x.advanced && x.advanced[0] && x.advanced[0].zoom; if (z) window.__zoom = z; return Promise.resolve() } });
  await A.context().grantPermissions(['camera', 'microphone'], { origin: `http://localhost:${PORT}` });
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await sleep(400);

  // ===== câmera do story: trilho, zoom, toque duplo =====
  await ev(A, () => criarAbrir('story')); await esperar(A, () => document.querySelector('#ce-video')?.videoWidth > 0, null, 6000); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('.ce.t-cam [data-rcboom]') && !!document.querySelector('.ce.t-cam [data-rctimer]')), 'câmera do story: Boomerang e Timer no trilho');
  ok(await ev(A, () => !document.querySelector('#rc-zoom').hidden && RC.zoom && RC.zoom.max === 4), 'zoom aparece quando a câmera tem zoom');
  await ev(A, () => { const r = document.querySelector('#rc-zoom input'); r.value = 2.5; r.dispatchEvent(new Event('input')) }); await sleep(100);
  ok(await ev(A, () => Math.abs(window.__zoom - 2.5) < .01 && /2,5/.test(document.querySelector('#rc-zl').textContent)), 'barra de zoom aplica 2,5×');
  await shot(A, '01-story-camera-zoom');
  { const r = await caixa(A, '#ce-cv'); const f0 = await ev(A, () => CAM.f); await A.mouse.click(r.x + r.w / 2, r.y + r.h * .4); await sleep(120); await A.mouse.click(r.x + r.w / 2, r.y + r.h * .4); await sleep(300);
    ok(await ev(A, f => CAM.f !== f, f0), 'toque duplo na prévia vira a câmera'); await esperar(A, () => document.querySelector('#ce-video')?.videoWidth > 0 && CAM.s, null, 6000); await sleep(300) }
  // ===== timer (mãos livres) =====
  await clk(A, '[data-rctimer]'); await sleep(100);
  ok(await ev(A, () => RC.tm === 3 && /3s/.test(document.querySelector('[data-rctimer]').textContent)), 'timer em 3 s');
  await clk(A, '[data-edfoto]'); await sleep(250);
  ok(await ev(A, () => document.querySelector('#rc-cd b')?.textContent === '3' && !CAM.rec), 'timer: contagem 3 na tela, ainda sem gravar');
  await shot(A, '02-story-timer-contagem');
  await esperar(A, () => !!CAM.rec, null, 5000); await sleep(1300);
  ok(await ev(A, () => !!CAM.rec && RC.livre && !!document.querySelector('.ce-shut .rc-ring') && +document.querySelector('.ce-shut').style.getPropertyValue('--rcp') > 0.03), 'depois da contagem grava sozinho, com anel de progresso');
  await shot(A, '03-story-gravando-anel');
  { const r = await caixa(A, '[data-edfoto]'); await A.mouse.click(r.x + r.w / 2, r.y + r.h / 2) } await esperar(A, () => ED && ED.st.bg.tipo === 'video', null, 8000); await sleep(400);
  ok(await ev(A, () => ED.st.bg.tipo === 'video' && ED.st.bg.dur > 0.8 && !CAM.rec), 'toque no botão para de gravar e abre o vídeo', await ev(A, () => [ED && ED.st.bg.tipo, ED && ED.st.bg.dur, !!CAM.rec, RC.livre, ED && ED.tela]));
  await fechaEd(A);
  // ===== Boomerang no story =====
  await ev(A, () => criarAbrir('story')); await esperar(A, () => document.querySelector('#ce-video')?.videoWidth > 0, null, 6000); await sleep(300);
  await clk(A, '[data-rcboom]'); await sleep(100);
  ok(await ev(A, () => RC.boom && document.querySelector('.ce-shut').classList.contains('rc-boom')), 'Boomerang ligado (botão muda)');
  await shot(A, '04-story-boomerang-camera');
  await clk(A, '[data-edfoto]'); await esperar(A, () => ED && ED.st.bg.tipo === 'video' && ED.st.bg.boomF, null, 12000); await sleep(600);
  ok(await ev(A, () => ED.st.bg.boomF.length >= 10 && ED.st.bg.mudo && !document.querySelector('[data-edtrim]') && /Boomerang/.test(document.querySelector('.rc-tag')?.textContent || '')), 'Boomerang: ~1 s de quadros, prévia em vídeo, sem corte');
  await shot(A, '05-story-boomerang-editor');
  await clk(A, "[data-edpubst='amigos']"); await esperar(A, () => !ED, null, 30000); await sleep(600);
  ok(await ev(A, () => { const x = pubStoriesDe(S.uid)[0]; return x && x.estilo.video && x.estilo.dur > 3 && x.estilo.mudo }), 'story Boomerang publicado (ida e volta 3 vezes, mais de 3 s)', await ev(A, () => pubStoriesDe(S.uid)[0]?.estilo));

  // ===== Reels: editor =====
  await clk(A, '#b-criar'); await sleep(300); await clk(A, '[data-edmodo="reel"]'); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('.ce.t-rcam [data-rcboom]') && !!document.querySelector('.ce.t-rcam [data-rctimer]')), 'câmera do Reels com Boomerang e Timer');
  await shot(A, '06-reel-camera');
  await A.setInputFiles('#rl-file', VID); await esperar(A, () => ED && ED.rl && ED.rl.tela === 'vid' && document.querySelector('#ce-bgv'), null, 8000); await sleep(600);
  ok(await ev(A, () => ['data-edtexto', 'data-edfig', 'data-edcaneta', 'data-rltrim', 'data-rlcapa', 'data-rlsom'].every(a => document.querySelector('.rc-ferr [' + a + ']')) && !document.querySelector('.ce-modos')), 'editor do reel: ferramentas Texto, Figurinhas, Desenhar, Cortar, Capa, Som');
  await shot(A, '07-reel-editor');
  // cortar
  await clk(A, '[data-rltrim]'); await sleep(1500);
  ok(await ev(A, () => document.querySelectorAll('#ce-trs .ce-trq').length === 10 && document.querySelectorAll('#ce-trs .ce-trq.ok').length >= 2), 'cortar do reel: tira com 10 lugares, quadros chegando (bug do url corrigido)', await ev(A, () => document.querySelectorAll('#ce-trs .ce-trq.ok').length));
  ok(await esperar(A, () => document.querySelectorAll('#ce-trs .ce-trq.ok').length === 10, null, 6000), 'cortar do reel: os 10 quadros desenhados');
  { const r = await caixa(A, '#rc-fs'); const d = await ev(A, () => ED.rl.dur);
    await arrasta(A, r.x + r.w + 8, r.y + r.h / 2, r.x + r.w * (5 / d), r.y + r.h / 2); await sleep(200);
    await arrasta(A, r.x - 8, r.y + r.h / 2, r.x + r.w * (1 / d), r.y + r.h / 2); await sleep(300) }
  const tr = await ev(A, () => [ED.rl.ini, ED.rl.fim]);
  ok(Math.abs(tr[0] - 1) < .25 && Math.abs(tr[1] - 5) < .25, 'arrastar as alças muda início e fim', tr);
  { const p1 = await ev(A, () => parseFloat(document.querySelector('.rc-ph').style.left)); await sleep(700); const p2 = await ev(A, () => parseFloat(document.querySelector('.rc-ph').style.left)); const v = await ev(A, () => document.querySelector('#ce-bgv').currentTime);
    ok(p1 !== p2 && v >= tr[0] - .3 && v <= tr[1] + .3, 'cursor anda na prévia e o vídeo fica no trecho', [p1, p2, v]) }
  await shot(A, '08-reel-cortar-filmstrip');
  // janela inteira arrastada (meio) mantém a duração
  { const r = await caixa(A, '.rc-win'); const len0 = await ev(A, () => ED.rl.fim - ED.rl.ini); await arrasta(A, r.x + r.w / 2, r.y + r.h / 2, r.x + r.w / 2 + 40, r.y + r.h / 2); await sleep(200);
    ok(await ev(A, l => Math.abs((ED.rl.fim - ED.rl.ini) - l) < .02 && ED.rl.ini > 1.05, len0), 'arrastar o meio move o trecho sem mudar a duração') }
  await clk(A, '[data-trok]'); await sleep(400);
  // texto e figurinhas no reel
  await clk(A, '.rc-ferr [data-edtexto]'); await sleep(250); await A.fill('#ce-txa', 'Fim de semana!'); await clk(A, '[data-edtxfd]'); await clk(A, '[data-edtxok]'); await sleep(300);
  await clk(A, '.rc-ferr [data-edfig]'); await sleep(250);
  ok(await ev(A, () => !document.querySelector('.ce-fig [data-edfig="enq"]') && !!document.querySelector('.ce-fig [data-edfig="local"]') && !!document.querySelector('.rc-fignota')), 'figurinhas no reel: só as visuais (sem enquete/quiz)');
  await shot(A, '09-reel-figurinhas');
  await ev(A, () => document.querySelector('.ce-fig [data-edemo]').click()); await sleep(300);
  ok(await ev(A, () => ED.rl.st.els.length === 2 && ED.st === ED.rl.st && document.querySelectorAll('#ce-els .ce-el').length === 2), 'texto e emoji ficam sobre o vídeo do reel');
  await ev(A, () => { const e = ED.st.els[1]; e.x = .5; e.y = .7; e.s = 2; edPosEl(e) });
  await shot(A, '10-reel-texto-emoji');
  // capa
  await clk(A, '[data-rlcapa]'); await esperar(A, () => document.querySelectorAll('#rc-cts .ce-trq.ok').length === 8, null, 6000); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('.rc-capa #rc-cpvid') && document.querySelectorAll('#rc-cts .ce-trq.ok').length === 8 && !document.querySelector('#rc-cpov').hidden), 'capa: tira de quadros, prévia grande com o texto', await ev(A, () => [document.querySelectorAll('#rc-cts .ce-trq').length, document.querySelector('#rc-cpov').hidden]));
  { const r = await caixa(A, '#rc-cfs'); await arrasta(A, r.x + 20, r.y + r.h / 2, r.x + r.w * .7, r.y + r.h / 2); await sleep(600) }
  const capa = await ev(A, () => ED.rl.capa);
  ok(await ev(A, c => c > ED.rl.ini + .5 && c <= ED.rl.fim, capa), 'arrastar o seletor escolhe outro quadro da capa', capa);
  await shot(A, '11-reel-capa');
  await clk(A, '[data-trok]'); await sleep(400);
  ok(await ev(A, c => ED.rl.capa === c && !document.querySelector('.rc-capa'), capa), 'Concluir guarda a capa');
  await shot(A, '12-reel-editor-pronto');
  await clk(A, '[data-rlav]'); await sleep(900); await A.fill('#ce-leg', 'Reel com texto');
  ok(await ev(A, () => { const c = document.querySelector('#rl-th'), d = c.getContext('2d').getImageData(0, 0, 90, 160).data; let s = 0; for (let i = 0; i < d.length; i += 4)s += d[i]; return s > 0 }), 'detalhes: miniatura da capa desenhada');
  await shot(A, '13-reel-detalhes');
  const t0 = Date.now(); await clk(A, '[data-rlpub]'); await sleep(500); await shot(A, '14-reel-publicando'); await esperar(A, () => !ED, null, 40000); const tPub = Date.now() - t0; await sleep(800);
  const reel = await ev(A, () => { const x = PUB.itens.find(y => y.estilo && y.estilo.reel); return x && { video: x.estilo.video, dur: x.estilo.dur, ini: x.estilo.ini, fotos: x.fotos.length, id: x.id } });
  ok(reel && reel.video && reel.dur > 3 && reel.dur < 4.6 && reel.ini == null && reel.fotos === 1, 'reel publicado com o trecho cortado e refeito (texto gravado no vídeo)', reel);
  // confere que o texto está dentro dos quadros: compara o vídeo publicado com o original no mesmo instante
  const dif = await ev(A, async () => { const x = PUB.itens.find(y => y.estilo && y.estilo.reel); const u = PUB.urls[x.estilo.video].u;
    const fr = async (src, t) => { const v = document.createElement('video'); v.muted = true; v.src = src; await new Promise(r => { v.onloadeddata = r; setTimeout(r, 4000) }); await new Promise(r => { v.onseeked = r; v.currentTime = t; setTimeout(r, 3000) }); const c = document.createElement('canvas'); c.width = 90; c.height = 160; c.getContext('2d').drawImage(v, 0, 0, 90, 160); return c.getContext('2d').getImageData(0, 0, 90, 160).data };
    const a = await fr(u, 1);
    // região do texto (y≈.42) bem mais clara que o resto: o texto tem fundo branco
    const media = (d, y0, y1) => { let s = 0, n = 0; for (let y = Math.round(y0 * 160); y < Math.round(y1 * 160); y++)for (let x = 25; x < 65; x++) { const i = (y * 90 + x) * 4; s += (d[i] + d[i + 1] + d[i + 2]) / 3; n++ } return s / n };
    let brancos = 0; for (let y = 62; y < 72; y++)for (let x = 20; x < 70; x++) { const i = (y * 90 + x) * 4; if (a[i] > 225 && a[i + 1] > 225 && a[i + 2] > 225) brancos++ }
    return { brancos, texto: media(a, .39, .45), baixo: media(a, .85, .95) } });
  ok(dif.brancos > 60, 'o fundo branco do texto aparece nos quadros do vídeo publicado', dif);
  // ===== B vê =====
  await ev(B, () => go('feed')); await sleep(300); await ev(B, () => pubCarregar()); await sleep(1800);
  await ev(B, () => document.querySelector('#posts .up-reel').scrollIntoView({ block: 'center' })); await sleep(2200);
  ok(await ev(B, () => { const v = document.querySelector('#posts .up-reel video.up-vid'); return v && !v.paused && v.currentTime > 0 }), 'o reel toca no Feed da amiga');
  await shot(B, '15-B-feed-reel-com-texto');
  await ev(B, () => scrollTo(0, 0)); await sleep(300); await clk(B, '#secs [data-ustory]'); await sleep(2200);
  ok(await ev(B, () => { const v = document.querySelector('#layer .us2-vid'); return v && !v.paused && v.currentTime > 0 }), 'o story Boomerang toca para a amiga');
  await shot(B, '16-B-story-boomerang'); await ev(B, () => closeLayer()); await sleep(300);

  // ===== publicar sem refazer: vídeo gravado na câmera, sem corte, com som =====
  await clk(A, '#b-criar'); await sleep(300); await clk(A, '[data-edmodo="reel"]'); await esperar(A, () => document.querySelector('#ce-video')?.videoWidth > 0, null, 6000); await sleep(300);
  await clk(A, '[data-rlgrava]'); await sleep(2300);
  ok(await ev(A, () => !!CAM.rec && !!document.querySelector('.rl-shut .rc-ring')), 'Reels: gravando com anel de progresso');
  await shot(A, '17-reel-gravando-anel');
  await clk(A, '[data-rlgrava]'); await esperar(A, () => ED && ED.rl && ED.rl.tela === 'vid', null, 8000); await sleep(500);
  await clk(A, '[data-rlav]'); await sleep(400); const t1 = Date.now(); await clk(A, '[data-rlpub]'); await esperar(A, () => !ED, null, 30000); const tRapido = Date.now() - t1; await sleep(500);
  const r2 = await ev(A, () => { const x = PUB.itens.filter(y => y.estilo && y.estilo.reel).sort((a, b) => b.at - a.at)[0]; return { ini: x.estilo.ini, fim: x.estilo.fim, dur: x.estilo.dur, mudo: x.estilo.mudo } });
  ok(r2.ini === 0 && r2.fim > 1.5 && !r2.mudo, 'sem corte nem texto: sobe o vídeo original, sem refazer', r2);
  ok(tRapido < 1800, `publicar sem refazer é rápido (${tRapido} ms; o reel refeito levou ${tPub} ms)`);
  // timer no Reels + cancelar
  await clk(A, '#b-criar'); await sleep(300); await clk(A, '[data-edmodo="reel"]'); await esperar(A, () => document.querySelector('#ce-video')?.videoWidth > 0, null, 6000);
  await clk(A, '[data-rctimer]'); await clk(A, '[data-rctimer]'); await sleep(100);
  ok(await ev(A, () => RC.tm === 10), 'timer em 10 s');
  await clk(A, '[data-rlgrava]'); await sleep(400); ok(await ev(A, () => document.querySelector('#rc-cd b')?.textContent === '10'), 'contagem de 10');
  await shot(A, '18-reel-timer-10');
  await clk(A, '[data-rlgrava]'); await sleep(200); ok(await ev(A, () => !document.querySelector('#rc-cd') && !CAM.rec), 'tocar de novo cancela o timer');
  await fechaEd(A);
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_ig_reels: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
