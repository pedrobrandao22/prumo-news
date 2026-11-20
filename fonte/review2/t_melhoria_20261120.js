// Melhoria contínua 20/11/2026: topo da Capa ("Atualizada às …") depois da meia-noite.
// Antes: edição de ontem 22h12 e novidade ("Acabou de sair"/"Agora") às 0h07 de hoje → o topo seguia "Atualizada às 22h12 · qui, 19 de nov".
// Agora: hora e dia da novidade. Horários fixos no passado (não depende da hora em que o teste roda). Visitante. Porta 8713.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8713;
(async () => {
  U.feedFresco('site-semconfig');
  const srv = U.servir('site-semconfig', PORTA); await sleep(800); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const p = U.erros(await ctx.newPage(), 'mc2011'); await p.goto(`http://localhost:${PORTA}/index.html`);
  await esperar(p, () => typeof capaEdicao === 'function' && typeof ac208Itens === 'function' && typeof FEED !== 'undefined' && FEED && FEED.pautas, null, 15000);
  const r = await p.evaluate(() => {
    const a0 = FEED.atualizado_em, ai = ac208Itens, ag = typeof agoraItens === 'function' ? agoraItens : null;
    const caso = (ed, nov) => { FEED.atualizado_em = ed; ac208Itens = () => nov ? [{ h: Date.parse(nov) }] : []; if (ag) agoraItens = () => []; try { return capaEdicao() } finally { FEED.atualizado_em = a0; ac208Itens = ai; if (ag) agoraItens = ag } };
    return {
      virada: caso('2026-11-19T22:12:00-03:00', '2026-11-20T00:07:00-03:00'),
      mesmoDia: caso('2026-11-19T20:00:00-03:00', '2026-11-19T22:12:00-03:00'),
      semNov: caso('2026-11-19T22:12:00-03:00', null),
      velha: caso('2026-11-19T22:12:00-03:00', '2026-11-19T22:12:30-03:00') } });
  ok(/^Atualizada às 0h07 · sex, 20 de nov/.test(r.virada), 'virada do dia: topo com a hora e o dia da novidade', r.virada);
  ok(/^Atualizada às 22h12 · qui, 19 de nov/.test(r.mesmoDia), 'mesmo dia: topo com a hora da novidade (como antes)', r.mesmoDia);
  ok(/^Atualizada às 22h12 · qui, 19 de nov/.test(r.semNov) && /^Atualizada às 22h12 · qui, 19 de nov/.test(r.velha), 'sem novidade (ou menos de 1 min depois): hora da edição', [r.semNov, r.velha]);
  // na tela: o topo da Capa usa o mesmo texto
  await p.evaluate(() => { try { closeLayer && closeLayer() } catch (e) { } go('capa') }); await sleep(700);
  await esperar(p, () => { const e = document.querySelector('#v-capa .cp-ed'); return e && e.textContent.trim() }, null, 15000).catch(() => { });
  const t = await p.evaluate(() => { const e = document.querySelector('#v-capa .cp-ed'); return e ? e.textContent : '' });
  ok(/^(Atualizada às \d{1,2}h\d{2} · |Edição)/.test(t), 'topo da Capa aparece', t);
  await br.close(); srv.kill();
  const R = U.resumo(); console.log(`RESUMO t_melhoria_20261120: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('FAIL erro', e && e.stack || e); process.exit(1) });
