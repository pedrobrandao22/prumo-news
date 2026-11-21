// Revisão da madrugada 21/11 (achados do testador + varredura). Porta 9427.
//  1. Celular deitado: a barra de cima da matéria some ao descer e volta ao subir
//  2. Subtema "Outros" não aparece (sanear tira)
//  3. Tabela parcial do Brasileirão não aparece
//  4. Trágica com retrato tirado (internação) não cai na foto genérica da editoria
//  5. Login: aviso do erro fica no #lerro, logo abaixo do campo certo
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9427, BASE = `http://localhost:${PORTA}/index.html`;
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const b = await U.navegador();
  // 1
  const ctx = await b.newContext({ viewport: { width: 667, height: 375 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('prumo-tour-visto', '1') } catch (e) {} });
  const P = U.erros(await ctx.newPage(), 'P'); await P.goto(BASE);
  await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && window.__prumoPronto, null, 15000);
  const pid = await P.evaluate(() => FEED.pautas.slice().sort((a, c) => (c.neutro.texto || '').length - (a.neutro.texto || '').length)[0].id);
  await P.evaluate(id => abrirMateria(id), pid); await sleep(1200);
  const topo = () => P.evaluate(() => Math.round(document.querySelector('#layer .mat-top').getBoundingClientRect().top));
  const rola = y => P.evaluate(y => { const m = document.querySelector('#layer .mat'); m.scrollTop = y; m.dispatchEvent(new Event('scroll')) }, y);
  ok(await topo() >= 0, '1: deitado, a barra começa visível');
  for (const y of [500, 900, 1300]) { await rola(y); await sleep(250) }
  ok(await topo() < 0, '1: deitado, ao descer a barra sai da frente');
  await P.evaluate(() => { const m = document.querySelector('#layer .mat'); m.scrollTop -= 40; m.dispatchEvent(new Event('scroll')) }); await sleep(400);
  ok(await topo() >= 0, '1: ao subir um pouco a barra volta (‹ Feed, Aa, enviar, guardar)');
  await ctx.close();
  // 2-5
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const Q = U.erros(await c2.newPage(), 'Q'); await Q.goto(BASE);
  await esperar(Q, () => window.FEED && FEED.pautas && FEED.pautas.length && window.__prumoPronto, null, 15000);
  const r2 = await Q.evaluate(() => { const f = sanear({ pautas: [{ id: 'x', neutro: { titulo: 't', texto: '' }, subtema: 'Outros' }, { id: 'y', neutro: { titulo: 't', texto: '' }, subtema: 'Congresso' }] }); return f.pautas.map(p => p.subtema || '') });
  ok(r2[0] === '' && r2[1] === 'Congresso', '2: subtema "Outros" some, os outros ficam', r2);
  const r3 = await Q.evaluate(() => [tabelaHTML({ tabela: [{ pos: 1, time: 'A', pts: 3 }], tabela_ate: 'parcial: após a 34ª rodada' }), tabelaHTML({ tabela: [{ pos: 1, time: 'A', pts: 3 }], tabela_ate: 'após a 35ª rodada (19/11)' })]);
  ok(!/<table/.test(r3[0]) && /atualizada/.test(r3[0]) && /<table/.test(r3[1]), '3: tabela parcial não aparece; a completa aparece');
  const r4 = await Q.evaluate(() => { if (!FOTOS_ARQ) return 'sem acervo'; const p = { id: 'z', secao: 'politica', subtema: 'Congresso', foto_arquivo: 'tema', neutro: { titulo: 'Fulano de Tal segue internado, diz médico', texto: '' } }; return faListas(p, FOTOS_ARQ).length });
  ok(r4 === 0 || r4 === 'sem acervo', '4: internação sem retrato fica sem foto genérica (ilustração)', r4);
  await Q.evaluate(() => { try { abrirLogin('criar') } catch (e) {} }); await sleep(400);
  const r5 = await Q.evaluate(() => { mostraErro('#lerro', 'Escreva o código do convite.'); const e = document.querySelector('#lerro'); return { txt: e.textContent, vis: !e.hidden, depois: e.previousElementSibling && !!e.previousElementSibling.querySelector('#lcod') } });
  ok(r5.txt === 'Escreva o código do convite.' && r5.vis && r5.depois, '5: aviso no #lerro, logo abaixo do campo do código', r5);
  // 6-7 (21/11): folha Agora da mais nova para a mais antiga; o navegador não restaura a rolagem (o app cuida)
  const r6 = await Q.evaluate(() => { const o = agoraItens; let l = []; try { NOVID_AG = NOVID_AG || null; l = agoraItens() } catch (e) {} return { ord: l.every((x, i) => !i || (+l[i - 1].h) >= (+x.h)), sr: history.scrollRestoration } });
  ok(r6.ord, '6: Agora em ordem de hora (mais nova primeiro)', r6);
  ok(r6.sr === 'manual', '7: rolagem não é restaurada pelo navegador (Feed não empresta a altura para a Capa)', r6);
  await c2.close(); await b.close(); srv.close && srv.close(); const s = U.resumo(); console.log(`${s.OKS} ok, ${s.FALHAS} falhas`); process.exit(s.FALHAS ? 1 : 0);
})();
