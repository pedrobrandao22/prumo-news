// Corretor 19/11: a folha de criar conta se chamava "Entrar no Prumo", abria com "entre na sua conta" e mandava tocar em
// "Convidar amigo" (o botão do Perfil é "Convidar alguém"; Conversas sem conta repetia o nome errado). Porta 9144.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:9144/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const folha = p => ev(p, () => { const s = document.querySelector('#layer .sheet') || document.querySelector('#layer2 .sheet');
  return s ? { tit: (s.querySelector('.sh-h,h2,h3,header') || {}).textContent || '', t: s.innerText } : null });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 9144); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 375, height: 667 } }), 'A');
  await A.goto(BASE); await esperar(A, () => document.querySelectorAll('.post').length > 0);
  // 1. Perfil sem conta > Criar conta
  await ev(A, () => go('me')); await sleep(600);
  const temBt = await A.$('#v-perfil [data-entrar="criar"], [data-entrar="criar"]');
  ok(!!temBt, 'Perfil sem conta tem "Criar conta"');
  await clk(A, '[data-entrar="criar"]'); await sleep(500);
  let f = await folha(A);
  ok(f && /Criar conta no Prumo/.test(f.t), 'aba Criar conta: título "Criar conta no Prumo"', f && f.t.slice(0, 120));
  ok(f && !/entre na sua conta/i.test(f.t), 'aba Criar conta: sem "entre na sua conta"', f && f.t.slice(0, 200));
  ok(f && /Convidar alguém/.test(f.t) && !/Convidar amigo/.test(f.t), 'ajuda cita "Convidar alguém"', f && f.t.slice(0, 400));
  const dobra = await ev(A, () => { const bt = document.querySelector('#lform [type=submit]'); return bt ? Math.round(bt.getBoundingClientRect().top) : -1 });
  await U.foto(A, 'corretor-1911-criar-conta');
  // 2. trocar para Entrar: volta "Entrar no Prumo"
  await clk(A, '[data-laba="entrar"]'); await sleep(400); f = await folha(A);
  ok(f && /Entrar no Prumo/.test(f.t) && !/Criar conta no Prumo/.test(f.t), 'aba Entrar: título "Entrar no Prumo"', f && f.t.slice(0, 120));
  await clk(A, '[data-laba="criar"]'); await sleep(400); f = await folha(A);
  ok(f && /Criar conta no Prumo/.test(f.t), 'volta para Criar conta: título certo');
  await ev(A, () => closeLayer()); await sleep(300);
  // 3. curtir sem conta continua explicando o motivo (aba Entrar)
  await ev(A, () => go('feed')); await sleep(500);
  const like = await A.$('#v-feed [data-a=like]');
  if (like) { await like.scrollIntoViewIfNeeded(); await like.click(); await sleep(500); f = await folha(A);
    ok(f && /entre na sua conta/i.test(f.t), 'curtir sem conta: motivo continua na folha de Entrar', f && f.t.slice(0, 160));
    await ev(A, () => closeLayer()); await sleep(300) }
  // 4. Conversas sem conta: mesmo nome do botão
  await ev(A, () => go('msgs')); await sleep(600);
  const cv = await ev(A, () => (document.querySelector('#v-msgs') || document.body).innerText);
  ok(!/Convidar amigo/.test(cv), 'Conversas sem conta: sem "Convidar amigo"', cv.slice(0, 300));
  ok(/Convidar alguém/.test(cv) || !/Perfil ›/.test(cv), 'Conversas sem conta: cita "Convidar alguém"');
  // 5. Perfil com conta: o botão se chama mesmo "Convidar alguém"
  const nomes = await ev(A, () => typeof SG181_TX !== 'undefined' ? SG181_TX['Convidar amigo'] : null);
  ok(nomes === 'Convidar alguém', 'nome do botão do Perfil é "Convidar alguém"', nomes);
  console.log('topo do botão Criar conta (375x667):', dobra);
  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1911: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
