// Etapa 61: figurinhas (perguntas, quiz, contagem, slider, link, local, hashtag, adicione o seu, selfie)
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8770/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../review3/var/';
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const fig = async (p, k) => { await clk(p, '.ce-top [data-edfig]'); await sleep(200); await clk(p, `.ce-fig [data-edfig="${k}"]`); await sleep(250) };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8770); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await sleep(500);
  await ev(A, () => criarAbrir('story')); await sleep(400); await clk(A, '[data-edcriar]'); await sleep(300); await ev(A, () => edTextoOk()); await sleep(100);
  // perguntas, quiz, contagem, slider
  await fig(A, 'perg'); await A.fill('#fq', 'Qual notícia te chamou atenção?'); await clk(A, '[data-edfok]'); await sleep(150);
  await fig(A, 'quiz'); await A.fill('#fq', 'Capital do Paraná?'); await A.fill('#fo0', 'Londrina'); await A.fill('#fo1', 'Curitiba'); await A.fill('#fo2', 'Maringá'); await clk(A, '[data-fqc="1"]'); await clk(A, '[data-edfok]'); await sleep(150);
  await fig(A, 'cont'); await A.fill('#fq', 'Debate'); await ev(A, () => { const d = new Date(Date.now() + 2 * 864e5); document.querySelector('#fd').value = d.toISOString().slice(0, 10) }); await clk(A, '[data-edfok]'); await sleep(150);
  await fig(A, 'slid'); await A.fill('#fq', 'Gostou do app?'); await clk(A, '[data-femo="🔥"]'); await clk(A, '[data-edfok]'); await sleep(150);
  ok(await ev(A, () => ED.st.els.map(e => e.t).join() === 'perg,quiz,cont,slid'), 'perguntas, quiz, contagem e slider no editor');
  // link inválido e válido, local, hashtag, adicione o seu, selfie
  await fig(A, 'link'); await A.fill('#fu', 'http://x.com'); await clk(A, '[data-edfok]'); await sleep(150); ok(await ev(A, () => !!document.querySelector('.ce-sel #fu')), 'link sem https é recusado');
  await A.fill('#fu', 'https://www.gov.br/tse'); await clk(A, '[data-edfok]'); await sleep(150);
  await fig(A, 'local'); await A.fill('#fq', 'Curitiba'); await clk(A, '[data-edfok]'); await sleep(150);
  await fig(A, 'hash'); await A.fill('#fq', '#eleicoes 2026'); await clk(A, '[data-edfok]'); await sleep(150);
  await fig(A, 'add'); await A.fill('#fq', 'Mostre seu café'); await clk(A, '[data-edfok]'); await sleep(150);
  await fig(A, 'selfie'); await esperar(A, () => document.querySelector('.ce-selfie video')?.videoWidth > 0, null, 5000); await clk(A, '[data-edselfok]'); await sleep(900);
  ok(await ev(A, () => ED.st.els.length === 9 && ED.st.els.some(e => e.t === 'img' && e._img) && ED.st.els.find(e => e.t === 'hash').tx === 'eleicoes2026'), 'link, local, hashtag, adicione o seu e selfie');
  // espalhar para não ficarem uns sobre os outros
  await ev(A, () => { const pos = { perg: [.5, .14, .62], quiz: [.5, .38, .62], cont: [.27, .62, .5], slid: [.73, .62, .5], link: [.3, .8, .6], local: [.72, .8, .6], hash: [.5, .88, .6], add: [.5, .76, .5], img: [.85, .2, .4] };
    ED.st.els.forEach(e => { const p = pos[e.t]; if (p) { e.x = p[0]; e.y = p[1]; e.s = p[2] } }); ED.st.els.find(e => e.t === 'add').y = .5; ED.st.els.find(e => e.t === 'add').x = .5; edDesenha() });
  await A.screenshot({ path: SH + 'fg61-editor.png' });
  await clk(A, "[data-edpubst='amigos']"); await esperar(A, () => !ED, null, 10000); await sleep(600);
  ok(await ev(A, () => { const x = pubStoriesDe(S.uid)[0]; return x && x.estilo.itens.map(i => i.t).sort().join() === 'add,cont,link,perg,quiz,slid' }), 'publicado: 6 figurinhas tocáveis (local, hashtag e selfie na imagem)');
  // B interage
  await ev(B, () => go('feed')); await sleep(300); await ev(B, () => pubCarregar()); await sleep(1500);
  await clk(B, '#secs [data-ustory]'); await sleep(1500); await B.screenshot({ path: SH + 'fg61-B.png' });
  ok(await ev(B, () => document.querySelectorAll('#layer .us-fg').length === 6 && /dias/.test(document.querySelector('#layer .fg-cd').textContent)), 'amiga vê as figurinhas e a contagem ao vivo');
  await B.click('#layer [data-usquiz][data-i="0"]'); await sleep(600);
  ok(await ev(B, () => !!document.querySelector('#layer .fg-qo.certa') && !!document.querySelector('#layer .fg-qo.errada')), 'quiz: errou → mostra a certa em verde e a escolhida em vermelho');
  { const r = await ev(B, () => { const t = document.querySelector('#layer [data-usslid]').getBoundingClientRect(); return { x: t.x, y: t.y + t.height / 2, w: t.width } }); await B.mouse.move(r.x + 4, r.y); await B.mouse.down(); await B.mouse.move(r.x + r.w * .8, r.y, { steps: 6 }); await B.mouse.up(); await sleep(600) }
  ok(await ev(B, () => /1 resposta/.test(document.querySelector('#layer .fg-slid').textContent)), 'slider: arrastar registra a resposta (80%)');
  await B.click('#layer [data-uslem]'); await sleep(300); ok(await ev(B, () => usLembretes().length === 1), 'contagem: lembrete ligado');
  await B.click('#layer [data-usperg]'); await sleep(400); await B.fill('#layer2 .fg-rf textarea', 'A do debate!'); await B.click('#layer2 .fg-rf [type=submit]'); await sleep(900);
  await B.click('#layer [data-uslink]'); await sleep(300); ok(await ev(B, () => /gov\.br/.test(document.querySelector('#layer2 .sheet')?.textContent || '')), 'link pede confirmação antes de sair');
  await ev(B, () => closeLayer()); await sleep(300);
  await B.screenshot({ path: SH + 'fg61-B2.png' });
  await B.click('#layer [data-usadd]'); await sleep(900);
  ok(await ev(B, () => !!ED && ED.st.els.some(e => e.t === 'add' && /#/.test(e.ref))), 'Adicione o seu: abre a câmera da amiga com a figurinha');
  await ev(B, () => { ED.st.bg = { tipo: 'grad', g: 2 }; ED.tela = 'edit'; edDesenha() }); await sleep(300); await clk(B, "[data-edpubst='amigos']"); await esperar(B, () => !ED, null, 10000); await sleep(400);
  // A vê
  await ev(A, () => pubCarregar()); await sleep(1500); await ev(A, () => igAbrirUser(S.uid)); await sleep(1500);
  ok(await ev(A, () => /Ver respostas \(1\)/.test(document.querySelector('#layer [data-usperg]').textContent) && /1 pessoa participou/.test(document.querySelector('#layer [data-usadd]').textContent)), 'autor vê 1 resposta e 1 participação');
  ok(await ev(A, () => /100%/.test([...document.querySelectorAll('#layer .fg-qo')][0].textContent) && /média 80%/.test(document.querySelector('#layer .fg-slid').textContent)), 'autor vê o resultado do quiz e a média do slider');
  await A.screenshot({ path: SH + 'fg61-A.png' });
  await A.click('#layer [data-usperg]'); await sleep(400); ok(await ev(A, () => /A do debate!/.test(document.querySelector('#layer2 .fg-rs')?.textContent || '')), 'lista de respostas');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa61: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
