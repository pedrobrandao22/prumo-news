// Etapa 53: Conversas (2 usuários reais pelo harness)
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8768/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8768); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' }); const uidA = await ev(A, () => S.uid);
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  await esperar(A, u => S.amigos.has(u), uidB);
  // A abre Conversas: caixa de entrada (não a conversa)
  await clk(A, '#t-msgs'); await sleep(500);
  ok(await ev(A, () => document.querySelector('#v-msgs').dataset.thr === '' && document.querySelectorAll('.dm-amg [data-thread]').length === 1 && !!document.querySelector('#dmq')), 'Conversas abre na caixa de entrada (com 1 amigo também), com busca e fileira de amigos');
  await A.screenshot({ path: __dirname + '/../review3/var/dm-inbox0.png' });
  await clk(A, '.dm-amg [data-thread]'); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#v-msgs').dataset.thr && getComputedStyle(document.querySelector('.nav')).display === 'none' && !!document.querySelector('#mform')), 'conversa aberta: barra de abas some, campo de mensagem');
  await A.fill('#mtext', 'Oi Bia, viu a PEC?'); await clk(A, '#mform .send'); await sleep(300); await A.fill('#mtext', 'Acho que passa'); await clk(A, '#mform .send'); await sleep(800);
  // A envia notícia
  await ev(A, () => { go('feed') }); await sleep(400); await ev(A, () => openSend(FEED.pautas[0].id)); await sleep(300); await A.fill('#stext', 'Olha essa'); await clk(A, '#sbtn'); await sleep(900);
  // B inbox
  await clk(B, '#t-msgs'); await sleep(800);
  ok(await esperar(B, () => /Olha essa/.test(document.querySelector('.dm-lista')?.textContent || '') && !!document.querySelector('.dm-row.un')), 'B vê a conversa na lista, em negrito (não lida)');
  await B.screenshot({ path: __dirname + '/../review3/var/dm-inboxB.png' });
  await clk(B, `.dm-lista [data-thread="${uidA}"]`); await sleep(700);
  await B.screenshot({ path: __dirname + '/../review3/var/dm-threadB.png' });
  // B reage com ❤️ (dois toques via função) e responde a primeira
  const mids = await ev(B, () => [...document.querySelectorAll('.dm-m')].map(m => m.dataset.mid));
  await ev(B, id => dmReagir(id, '❤️'), mids[0]); await sleep(800);
  await ev(B, id => dmResponder(id), mids[1]); await sleep(200); await B.fill('#mtext', 'Também acho'); await clk(B, '#mform .send'); await sleep(1200);
  await B.screenshot({ path: __dirname + '/../review3/var/dm-threadB2.png' });
  // A vê
  await ev(A, () => go('msgs')); await sleep(400); await clk(A, `.dm-lista [data-thread="${uidB}"]`); await sleep(1200);
  ok(await esperar(A, () => document.querySelectorAll('.dm-rx').length === 1 && document.querySelectorAll('.dm-q').length === 1), 'A vê a reação ❤️ e a resposta citando a mensagem');
  await A.screenshot({ path: __dirname + '/../review3/var/dm-threadA.png' });
  // A apaga a última dele? (a notícia)
  const minha = await ev(A, () => [...document.querySelectorAll('.dm-m.mine')].map(m => m.dataset.mid).pop()); await ev(A, id => dmApagar(id), minha); await sleep(1200);
  ok(await ev(A, id => !allMsgs().some(m => m.id === id) && !document.querySelector(`[data-mid="${id}"]`), minha), 'Apagar para todos some da conversa');
  // menção no comentário
  await ev(B, () => { THREAD=null; go('feed') }); await sleep(500); await ev(B, () => openComments(FEED.pautas[1].id)); await sleep(400);
  await B.focus('#ctext'); await B.type('#ctext', 'Olha isso @Ped', { delay: 30 }); await sleep(300);
  ok(await ev(B, () => /Pedro/.test(document.querySelector('.men-box')?.textContent || '')), '@ no comentário sugere o amigo');
  await B.screenshot({ path: __dirname + '/../review3/var/dm-men.png' });
  await B.dispatchEvent('.men-box [data-men]', 'pointerdown'); await sleep(200); ok(await ev(B, () => document.querySelector('#ctext').value === 'Olha isso @Pedro '), 'tocar na sugestão completa o nome');
  await clk(B, '#cform .sendc'); await sleep(1500);
  await ev(A, () => renderMsgs()); await sleep(800);
  ok(await esperar(A, () => [...document.querySelectorAll('.dm-lb')].some(x => /Mencionou você/.test(x.textContent))), 'quem foi marcado recebe a notícia por mensagem');
  await A.screenshot({ path: __dirname + '/../review3/var/dm-threadA2.png' });
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa53: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
