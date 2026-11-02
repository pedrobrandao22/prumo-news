// Etapa 72: compartilhar post no story, story "Sua semana", reações de story na Atividade
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8781/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../review3/var/';
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8781); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await A.context().grantPermissions(['camera'], { origin: 'http://localhost:8781' });
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  // Bia publica; Pedro compartilha no story
  const pid = await ev(B, async () => { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Pôr do sol na praia', fotos: [], estilo: { v: 2, fundo: 3 } }).select('id'); return r.data[0].id });
  await ev(A, () => { go('feed'); pubCarregar() }); await sleep(1500);
  await ev(A, id => { renderPosts(); garantirPost('u:' + id); document.querySelector(`[data-umenu="${id}"]`).click() }, pid); await sleep(400);
  ok(await ev(A, () => /Compartilhar no seu story/.test(document.querySelector('.sheet').textContent) && /só quem é amigo de Bia/.test(document.querySelector('.sheet').textContent)), 'menu do post da amiga: Compartilhar no seu story');
  await clk(A, '[data-upstory]'); await esperar(A, () => !!document.querySelector('#layer .ce .fg-pub'), null, 8000).catch(() => {});
  ok(await ev(A, () => ED && ED.tela === 'edit' && ED.st.els.some(e => e.t === 'pub') && /Bia Souza/.test(document.querySelector('#layer .ce .fg-pub').textContent)), 'editor abre com a figurinha do post');
  await A.screenshot({ path: SH + 'd72-editor.png' });
  await clk(A, "[data-edpubst='amigos']"); await esperar(A, () => !ED, null, 15000); await sleep(1200);
  const st = await H.sql(`select id, estilo from publicacoes where tipo='story'`);
  ok(st.length === 1 && st[0].estilo.itens.some(e => e.t === 'pub' && e.ref === pid && e.au === uidB), 'story salvo com a figurinha (id do post e autora)', JSON.stringify(st[0] && st[0].estilo.itens));
  // Bia vê o story e toca na figurinha → abre o post
  await ev(B, () => { go('feed'); pubCarregar() }); await sleep(1500);
  await ev(B, id => stLista([pubDe(id)], 0, 'Pedro', 'x'), st[0].id); await sleep(1200);
  ok(await ev(B, () => !!document.querySelector('#layer .story [data-uspub]')), 'no story, a figurinha é tocável');
  await B.screenshot({ path: SH + 'd72-story.png' });
  await clk(B, '#layer .story [data-uspub]'); await sleep(1200);
  ok(await ev(B, id => !document.querySelector('#layer .story') && !!document.getElementById('p-u:' + id), pid), 'tocar abre o post no Feed');
  // Atividade da Bia: Pedro compartilhou + curtida de story vinda por mensagem
  await ev(A, async u => { await dmEnviar(u, { texto: '', tipo: 'curtiu_story', snap: { story: { t: 'Meu dia' } } }, true) }, uidB); await sleep(1200);
  await ev(B, () => { AT.t = 0; atCarregar() }); await sleep(1500); await ev(B, () => abrirAtividade()); await sleep(800);
  const tB = await ev(B, () => document.querySelector('#layer .pfv-at').textContent);
  ok(/Pedro compartilhou seu post no story/.test(tB), 'Atividade: compartilhou seu post no story', tB.slice(0, 300));
  await ev(B, () => closeLayer()); await sleep(300);
  // Sua semana (Pedro)
  await ev(A, () => { window.SEM_SEMPRE = true; FEED.pautas.slice(0, 5).forEach(p => registrarHistorico(p.id)); go('feed'); renderSecs() }); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#secs [data-semana]') && /5/.test(document.querySelector('#secs [data-semana]').textContent)), 'círculo "Sua semana" na fileira');
  await ev(A, () => { PREF.storyAuto = false }); await clk(A, '#secs [data-semana]'); await sleep(900);
  ok(await ev(A, () => !!document.querySelector('#layer .sg-sem') && /5\s*notícias lidas/.test(document.querySelector('#layer .sg-sem').textContent)), 'story abre: 5 notícias lidas');
  await A.screenshot({ path: SH + 'd72-semana1.png' });
  const n = await ev(A, () => ST.itens.length);
  for (let i = 1; i < n; i++) { await ev(A, () => storyGo(1)); await sleep(500); if (i === 1) await A.screenshot({ path: SH + 'd72-semana2.png' }) }
  ok(await ev(A, () => /Na semana que vem/.test(document.querySelector('#layer .sg-sem').textContent)), 'último quadro: "Na semana que vem"');
  await ev(A, () => storyGo(1)); await sleep(600);
  ok(await ev(A, () => !document.querySelector('#layer .story') && document.querySelector('#secs [data-semana] .ig-r').classList.contains('visto')), 'fecha no fim e o círculo fica como visto');
  ok(await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe(); return !!document.querySelector('#v-me [data-semana]') }), 'Perfil > Conta tem "Sua semana no Prumo"');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa72: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
