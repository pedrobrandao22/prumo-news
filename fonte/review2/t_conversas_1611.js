// Conversas (16/11): Silenciar e Apagar conversa, pela folha de opções; vale nos dois sentidos de leitura e não afeta a outra pessoa.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8670, BASE = `http://localhost:${PORTA}/index.html`;
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
async function convite(A) { await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await require('../t_util').gerarConvite(A); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' }); const uidA = await ev(A, () => S.uid);
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, u => { go('msgs'); abrirConversa(u) }, uidB); await sleep(500);
  await A.fill('#mtext', 'Oi Bia'); await clk(A, '#mform .send'); await sleep(1200);
  await esperar(B, () => S.msgsIn.some(m => !m.lida), null, 8000);
  await ev(B, () => { go('msgs'); THREAD = null; renderMsgs() }); await sleep(500);
  ok(await ev(B, () => !$('#badge').hidden), 'antes: Bia vê o número de não lidas');
  // silenciar
  await ev(B, u => abrirThMenu(u), uidA); await sleep(400);
  ok(await ev(B, () => !!document.querySelector('#layer [data-cv162sil]') && !!document.querySelector('#layer [data-cv162apg]')), 'folha da conversa tem Silenciar e Apagar');
  await clk(B, '#layer [data-cv162sil]'); await sleep(500);
  const sil = await ev(B, u => ({ pref: !!(PREF.conv && PREF.conv[u] && PREF.conv[u].sil), badge: $('#badge').hidden, icone: !!document.querySelector(`#v-msgs [data-thread="${u}"] .cv162-ic`), dot: !!document.querySelector(`#v-msgs .dm-row[data-thread="${u}"] .dot`) }), uidA);
  ok(sil.pref && sil.badge && sil.icone && !sil.dot, 'silenciada: sem número, sem ponto, com o sino cortado', sil);
  await sleep(1800);
  ok(await ev(B, async u => { const g = await S.db.doc(`data/users/${S.uid}/prefs`).get(); return !!(g.exists && g.data().conv && g.data().conv[u] && g.data().conv[u].sil) }, uidA), 'silenciar fica na conta (preferências)');
  await ev(B, u => abrirThMenu(u), uidA); await sleep(400);
  ok(/Reativar avisos/.test(await ev(B, () => document.querySelector('#layer [data-cv162sil]').textContent)), 'folha oferece Reativar avisos');
  await ev(B, () => closeLayer()); await sleep(300);
  // apagar (dois toques)
  await ev(B, u => abrirThMenu(u), uidA); await sleep(400);
  await clk(B, '#layer [data-cv162apg]'); await sleep(200);
  ok(/Toque de novo/.test(await ev(B, () => document.querySelector('#layer [data-cv162apg]').textContent)), 'apagar pede um segundo toque');
  await clk(B, '#layer [data-cv162apg]'); await sleep(600);
  const apg = await ev(B, u => ({ lista: !!document.querySelector(`#v-msgs .dm-row[data-thread="${u}"]`), msgs: allMsgs().filter(m => m.de === u || m.para === u).length, toast: (document.querySelector('.toast') || {}).textContent || '' }), uidA);
  ok(!apg.lista && apg.msgs === 0 && /Desfazer/.test(apg.toast), 'apagada: some da lista da Bia, com Desfazer', apg);
  ok(await ev(A, u => allMsgs().filter(m => m.para === u).length === 1, uidB), 'o Pedro continua vendo a conversa');
  // mensagem nova reabre
  await ev(A, u => abrirConversa(u), uidB); await sleep(300); await A.fill('#mtext', 'Mensagem nova'); await clk(A, '#mform .send');
  ok(await esperar(B, u => allMsgs().filter(m => m.de === u).length === 1 && /Mensagem nova/.test(allMsgs().filter(m => m.de === u)[0].texto), uidA, 8000), 'mensagem nova reabre a conversa só com o que veio depois');
  await U.foto(B, 'conversas-1611');
  // link da notícia pelo título (163): usa o índice m/indice.json; sem índice, o m/<id>.html de sempre
  const fs = require('fs'), path = require('path'); const MP = path.join(__dirname, '..', 'site', 'm'); fs.mkdirSync(MP, { recursive: true });
  const pidL = await ev(A, () => FEED.pautas[1].id);
  const antes = await ev(A, p => linkMateria(p), pidL);
  fs.writeFileSync(path.join(MP, 'indice.json'), JSON.stringify({ [pidL]: 'titulo-da-noticia-de-teste' }));
  await ev(A, () => lk163Carrega()); await sleep(800);
  const depois = await ev(A, p => linkMateria(p), pidL);
  ok(antes.endsWith('/m/' + pidL + '.html') && depois.endsWith('/m/titulo-da-noticia-de-teste.html') && /\/m\/[^/]+\.html$/.test(await ev(A, () => linkMateria(FEED.pautas[0].id))), 'link da notícia usa o endereço pelo título quando está no índice', { antes, depois });
  fs.unlinkSync(path.join(MP, 'indice.json'));
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_conversas_1611: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
