// Tarde 19/11: na conversa o campo de escrever e o Enviar aparecem (o degradê do rodapé não cobre); sem internet com o app
// aberto, uma faixa avisa e o fim do Feed não fica "Carregando…" para sempre. Porta 9304.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9304, BASE = `http://localhost:${PORTA}/index.html`;
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
  const vp = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
  const A = U.erros(await H.pagina(b, vp), 'A'), B = U.erros(await H.pagina(b, { ...vp, dark: true }), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  await esperar(A, u => S.amigos.has(u), uidB);
  for (const [P, nome] of [[A, 'claro'], [B, 'escuro']]) {
    const u = P === A ? uidB : await ev(A, () => S.uid);
    await ev(P, x => { go('msgs'); abrirConversa(x) }, u); await sleep(800);
    const vis = await ev(P, () => { const r = [], ch = s => { const e = document.querySelector(s); if (!e) return false; const b = e.getBoundingClientRect(); if (b.height < 10 || b.bottom > innerHeight + 1) return false; const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!t && (t === e || e.contains(t)) };
      return { campo: ch('#mtext'), enviar: ch('#mform .send'), deg: getComputedStyle(document.body, '::after').display } });
    ok(vis.campo && vis.enviar && vis.deg === 'none', `conversa (${nome}): campo de mensagem e Enviar à vista, nada por cima`, vis);
    await P.fill('#mtext', 'Teste de digitação'); ok(await ev(P, () => document.querySelector('#mtext').value === 'Teste de digitação' && getComputedStyle(document.querySelector('#mtext')).opacity !== '0'), `conversa (${nome}): o texto digitado aparece`);
    await ev(P, () => { history.back() }); await sleep(500);
  }
  // sem internet
  await ev(A, () => { closeLayer && closeLayer(); go('feed') }); await sleep(600);
  await A.context().setOffline(true); await sleep(500);
  const f = await ev(A, () => { const e = document.getElementById('sr209'); if (!e) return null; const b = e.getBoundingClientRect(); return { t: e.textContent, top: Math.round(b.top), w: Math.round(b.width), cabe: b.left >= 0 && b.right <= innerWidth } });
  ok(f && /Sem conexão/.test(f.t) && f.cabe && f.top > 200, 'sem internet: faixa "Sem conexão" perto da barra de baixo, sem cobrir o topo (19/11 noite)', f);
  const m = await ev(A, () => { const e = document.getElementById('mais'); return e ? { t: e.innerText, sk: !!e.querySelector('.fd156-sk') && getComputedStyle(e.querySelector('.fd156-sk')).display } : 'sem-mais' });
  ok(m === 'sem-mais' || (/Sem conexão/.test(m.t) && m.sk !== 'block'), 'sem internet: fim do Feed diz "Sem conexão" em vez de carregar para sempre', m);
  await ev(A, () => go('msgs')); await sleep(300);
  ok(await ev(A, () => !!document.getElementById('sr209')), 'sem internet: a faixa continua em Conversas');
  await A.context().setOffline(false); await sleep(400);
  ok(await ev(A, () => /Conexão de volta/.test(document.getElementById('sr209')?.textContent || '') && !document.body.classList.contains('sr209-off')), 'internet voltou: "Conexão de volta"');
  await sleep(2600); ok(await ev(A, () => !document.getElementById('sr209')), 'a faixa some sozinha');
  ok(!A._erros.length && !B._erros.length, 'sem erros de JavaScript ' + [...A._erros, ...B._erros].slice(0, 3).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_tarde_1911: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
