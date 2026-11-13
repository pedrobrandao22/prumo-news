// Etapa 63: vídeo (story gravado segurando o botão, story da galeria com corte e texto, Reels já publicados tocando no Feed)
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8773/index.html'; const VID = __dirname + '/teste.webm';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../review3/var/';
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8773); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await A.context().grantPermissions(['camera', 'microphone'], { origin: 'http://localhost:8773' });
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await sleep(400);
  // 1) segurar para gravar
  await ev(A, () => criarAbrir('story')); await esperar(A, () => document.querySelector('#ce-video')?.videoWidth > 0, null, 6000);
  ok(await ev(A, () => CAM.s.getAudioTracks().length === 1), 'câmera abre com microfone');
  { const r = await ev(A, () => { const e = document.querySelector('[data-edfoto]').getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height / 2 } }); await A.mouse.move(r.x, r.y); await A.mouse.down(); await sleep(700);
    ok(await ev(A, () => !!CAM.rec && document.querySelector('.ce-shut').classList.contains('grava')), 'segurando: grava (anel vermelho)'); await A.screenshot({ path: SH + 'v63-grava.png' }); await sleep(2200); await A.mouse.up() }
  await esperar(A, () => ED && ED.st.bg.tipo === 'video', null, 8000); await sleep(500);
  ok(await ev(A, () => ED.st.bg.tipo === 'video' && ED.st.bg.dur > 1 && !!document.querySelector('#ce-bgv')), 'soltar: vídeo vira o fundo do story (não tira foto)');
  await ev(A, () => closeLayer._ok = true); await ev(A, () => { ED = null; closeLayer() }); await sleep(300);
  // 2) vídeo da galeria: cortar, sem som, texto
  await ev(A, () => criarAbrir('story')); await sleep(500); await clk(A, '[data-edgal]'); await A.setInputFiles('#ce-file', VID); await esperar(A, () => ED && ED.st.bg.tipo === 'video', null, 8000); await sleep(600);
  await clk(A, '[data-edtrim]'); await sleep(400); await ev(A, () => { const i = document.querySelector('[data-trini]'); i.value = 1; i.dispatchEvent(new Event('input')); const f = document.querySelector('[data-trfim]'); f.value = 4.5; f.dispatchEvent(new Event('input')) }); await sleep(1500);
  ok(await ev(A, () => ED.st.bg.ini === 1 && ED.st.bg.fim === 4.5 && document.querySelectorAll('.ce-trq').length >= 4), 'cortar: trecho de 1 s a 4,5 s com miniaturas');
  await A.screenshot({ path: SH + 'v63-corta.png' }); await clk(A, '[data-trok]'); await sleep(200);
  await clk(A, '[data-edtexto]'); await sleep(200); await A.fill('#ce-txa', 'Ao vivo!'); await clk(A, '[data-edtxok]'); await sleep(200);
  await A.screenshot({ path: SH + 'v63-story-ed.png' });
  await clk(A, "[data-edpubst='amigos']"); await esperar(A, () => !ED, null, 30000); await sleep(800);
  ok(await ev(A, () => { const x = pubStoriesDe(S.uid)[0]; return x && x.estilo.video && x.estilo.dur > 3 && x.estilo.dur < 4.5 && x.estilo.ov === 1 && x.fotos.length === 2 }), 'story em vídeo publicado (3,5 s, com camada do texto)');
  // 3) Reel já publicado (a criação de Reels saiu em 13/11; os publicados continuam tocando no Feed): grava direto no banco
  await ev(A, async () => { const st = pubStoriesDe(S.uid)[0]; const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Meu primeiro reel', fotos: [st.fotos[0]], estilo: { v: 2, reel: 1, video: st.estilo.video, dur: st.estilo.dur, mudo: true } }).select('id'); if (q.error) throw q.error; await pubCarregar() });
  ok(await ev(A, () => { const x = PUB.itens.find(y => y.estilo && y.estilo.reel); return x && x.tipo === 'post' && x.estilo.video && x.estilo.mudo && x.fotos.length === 1 }), 'reel publicado');
  // B vê
  await ev(B, () => go('feed')); await sleep(300); await ev(B, () => pubCarregar()); await sleep(1800);
  await ev(B, () => document.querySelector('#posts .up-reel').scrollIntoView({ block: 'center' })); await sleep(1800);
  ok(await ev(B, () => { const v = document.querySelector('#posts .up-reel video.up-vid'); return v && /^data:video/.test(v.src) && !v.paused }), 'reel toca sozinho no Feed da amiga');
  await B.screenshot({ path: SH + 'v63-feedB.png' });
  await ev(B, () => scrollTo(0, 0)); await sleep(300); await clk(B, '#secs [data-ustory]'); await sleep(1800);
  ok(await ev(B, () => { const v = document.querySelector('#layer .us2-vid'); return v && !v.paused && v.currentTime > 0 && !!document.querySelector('#layer .us2-ovi') }), 'story em vídeo toca para a amiga com o texto por cima');
  await B.screenshot({ path: SH + 'v63-storyB.png' });
  await ev(B, () => igPausa()); await sleep(200); ok(await ev(B, () => document.querySelector('#layer .us2-vid').paused), 'pausar o story pausa o vídeo');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa63: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
