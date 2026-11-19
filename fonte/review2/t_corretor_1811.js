// Corretor 18/11 (189): voltar do celular na tela "Notícia" volta para a caixa com o texto (antes abria o "Novo post"
// antigo e o comentário sumia). Dois caminhos: + > Notícia > escolher, e "O que você acha?" do Feed. Porta 9140.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:9140/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const antigo = A => ev(A, () => /Escolher fotos/.test(document.querySelector('#layer').innerText) || /O que você quer publicar/.test(document.querySelector('#layer').innerText));
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 9140); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000);

  // 1. + > Notícia > escolher > escrever > voltar do celular
  await ev(A, () => criarMenu()); await sleep(300);
  // 19/11: a notícia é escolhida por cima da própria caixa; não existe mais a tela "Notícia" no meio
  await A.fill('#cp152-tx', 'Meu comentário importante'); await sleep(150);
  await clk(A, '[data-cp152ax="nt"]'); await sleep(600);
  const pid1 = await ev(A, () => { const b = document.querySelector('#layer > .cp152 [data-fc164nt]'); if (!b) return null; b.click(); return b.dataset.fc164nt }); await sleep(500);
  ok(!(await antigo(A)), 'escolher a notícia não abre o "Novo post" antigo', await ev(A, () => document.querySelector('#layer').innerText.slice(0, 80)));
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152') && document.querySelector('#cp152-tx')?.value === 'Meu comentário importante'), 'a caixa continua com o comentário');
  ok(await ev(A, (p) => !!p && CR155.pid === p && !!document.querySelector('#layer > .cp152 .cr155-nt'), pid1), 'a notícia escolhida aparece como cartão na caixa');
  // 2. o segundo voltar pergunta antes (155) e o texto fica guardado; o terceiro sai
  await A.goBack().catch(() => {}); await sleep(600);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152')), 'segundo voltar não descarta sem perguntar');
  await sleep(300); await A.goBack().catch(() => {}); await sleep(700);
  ok(await ev(A, () => !document.querySelector('#layer').innerHTML), 'voltar de novo logo em seguida sai da caixa', await ev(A, () => JSON.stringify({HST, hl: history.length, l: document.querySelector('#layer').innerText.slice(0, 60)})));
  await ev(A, () => criarMenu()); await sleep(400);
  ok(await ev(A, () => document.querySelector('#cp152-tx')?.value === 'Meu comentário importante'), 'reabrir: o texto está lá');
  await ev(A, () => { try { cr155Limpa() } catch (e) {} CP152.txt = ''; CP152.guardado = ''; closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(400);

  // 3. "O que você acha?" (notícia já escolhida) > escrever > voltar do celular
  const pid = await ev(A, () => (FEED.pautas || []).find(p => p && p.id)?.id);
  await ev(A, (p) => { cn102Comeca('nt', { pid: p }) }, pid); await sleep(600);
  ok(await ev(A, () => !!document.querySelector('#ce-leg')), 'O que você acha?: formulário da notícia');
  await A.fill('#ce-leg', 'Outro comentário'); await sleep(200);
  await A.goBack().catch(() => {}); await sleep(800);
  ok(!(await antigo(A)), 'O que você acha?: voltar não abre o "Novo post" antigo');
  ok(await ev(A, () => document.querySelector('#cp152-tx')?.value === 'Outro comentário'), 'O que você acha?: voltar leva à caixa com o comentário');

  // 4. abrir a lista de notícias e desistir: a lista fecha e o texto continua na caixa
  await ev(A, () => { if (!document.querySelector('#layer > .cp152')) cp152Abre({ manter: true, aba: 'post' }) }); await sleep(400);
  await clk(A, '[data-cp152ax="nt"]'); await sleep(600);
  await ev(A, () => document.querySelector('#layer > .cp152 .cn102-ntl [data-edselx]')?.click()); await sleep(400);
  ok(await ev(A, () => !document.querySelector('#layer > .cp152 .cn102-ntl') && document.querySelector('#cp152-tx')?.value === 'Outro comentário'), 'Cancelar na lista de notícias fecha só a lista, com o texto na caixa', await ev(A, () => ({ l: !!document.querySelector('#layer .cn102-ntl'), v: document.querySelector('#cp152-tx')?.value })));
  await U.foto(A, 'corretor-1811-voltar');
  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1811: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
