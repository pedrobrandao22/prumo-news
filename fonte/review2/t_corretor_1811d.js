// Corretor 18/11 noite: resposta a comentário aparecia no cartão do Feed como "Claude Teste @Claude Teste texto".
// Agora o cartão mostra a resposta como a folha: recuada, "respondendo a Nome" e sem o "@Nome" no texto. Porta 9143.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:9143/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 9143); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
  await criar(A, { nome: 'Claude Teste', email: 'a@x.com' });
  await ev(A, () => go('feed')); await sleep(800);
  const pid = await ev(A, () => { const a = document.querySelector('#v-feed article.post[id^="p-"]:not([id^="p-u:"])'); return a && a.id.slice(2) });
  ok(!!pid, 'há uma notícia no Feed', pid);
  // função pura: casos da classe
  const r = await ev(A, () => { const me = S.uid, cm = [{ uid: me, texto: 'primeiro' }];
    return [fd204CmtHTML({ uid: me, texto: '@Claude Teste resposta aqui' }, cm), fd204CmtHTML({ uid: me, texto: '@Claude Testex não é' }, cm),
      fd204CmtHTML({ uid: me, texto: 'e-mail a@b.com' }, cm), fd204CmtHTML({ uid: me, texto: '@Claude Teste' }, cm)] });
  ok(/cmt204-resp/.test(r[0]) && /respondendo a Claude Teste/.test(r[0]) && /<\/b>resposta aqui<\/div>$/.test(r[0]), 'resposta: recuada, "respondendo a" e sem @Nome', r[0]);
  ok(!/cmt204-resp/.test(r[1]) && r[1].includes('@Claude Testex'), 'nome que só começa igual não vira resposta', r[1]);
  ok(!/cmt204-resp/.test(r[2]), 'comentário comum fica igual');
  ok(/cmt204-resp/.test(r[3]), 'só a menção também é resposta');
  // de verdade: comenta, responde, fecha e olha o cartão
  await ev(A, pid => openComments(pid), pid); await sleep(500);
  await A.fill('#ctext', 'Teste do testador: comentário de teste'); await ev(A, () => document.getElementById('cform').requestSubmit()); await sleep(900);
  await ev(A, () => { FD167_RESP = nomeDe(S.uid); fd167RespBarra() });
  await A.fill('#ctext', 'Teste do testador: resposta'); await ev(A, () => document.getElementById('cform').requestSubmit()); await sleep(900);
  await ev(A, () => closeLayer()); await sleep(400);
  const card = await ev(A, pid => { const el = document.getElementById('p-' + pid); const c = el && el.querySelector('[data-cmts]'); return c ? { t: c.innerText, h: c.innerHTML } : null }, pid);
  ok(card && !/@Claude Teste/.test(card.t), 'cartão: sem "@Claude Teste" no texto', card && card.t);
  ok(card && /respondendo a Claude Teste/.test(card.t) && /cmt204-resp/.test(card.h), 'cartão: resposta marcada e recuada', card && card.t);
  ok(card && /comentário de teste/.test(card.t), 'cartão: o comentário de cima continua');
  await ev(A, pid => document.getElementById('p-' + pid).querySelector('[data-cmts]').scrollIntoView({ block: 'center' }), pid); await sleep(300);
  await U.foto(A, 'corretor-1811d-resposta');
  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1811d: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
