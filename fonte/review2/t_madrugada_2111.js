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
  await Q.evaluate(() => { go('feed'); scrollTo(0, 2800) }); await sleep(500); await Q.reload();
  await esperar(Q, () => window.FEED && FEED.pautas && window.__prumoPronto, null, 15000); await sleep(800);
  const r7 = await Q.evaluate(() => ({ v: VIEW, y: scrollY }));
  ok(r7.v !== 'capa' || r7.y < 60, '7: recarregar no Feed não abre a Capa no meio', r7);
  // 8 (21/11): resposta a comentário apagado fica sob "Comentário apagado", sem o @Nome
  const r8 = await Q.evaluate(() => { const box = document.createElement('div'); box.id = 'cbox'; box.innerHTML = '<ul class="clist"><li><div><span><b>Ana Lima</b> Concordo</span></div></li><li><div><span><b>Bia</b> @Claude Teste Teste do testador: resposta</span></div></li></ul>'; document.body.appendChild(box);
    fd156Agrupa(); fd167SemMencao(); const lis = [...box.querySelectorAll('.clist>li')]; const r = { n: lis.length, ph: !!box.querySelector('.fd156-apag'), resp: lis[2] && lis[2].classList.contains('fd156-resp'), tx: lis[2] && lis[2].querySelector('span').textContent }; box.remove(); return r });
  ok(r8.ph && r8.resp && !/@Claude/.test(r8.tx || '') && /Teste do testador/.test(r8.tx || ''), '8: resposta a comentário apagado fica recuada sob "Comentário apagado", sem o @Nome', r8);
  // 9: giro Últimas com o título da notícia (a atualização vira linha)
  const r9 = await Q.evaluate(async () => { try { const r = igLista('_ult'); if (!r.itens || !r.itens.length) return 'sem itens'; abrirUltimas(); await new Promise(z => setTimeout(z, 700)); const h = document.querySelector('#layer .story h2'); const it = ST.itens && ST.itens[ST.i]; const p = it && pautaById(it.pid); const t = h && h.textContent; try { closeLayer() } catch (e) {} return { t, tit: p && versao(p, lente()).titulo } } catch (e) { return 'erro ' + e.message } });
  ok(r9 === 'sem itens' || (r9 && r9.t && r9.t.slice(0, 20) === String(r9.tit).slice(0, 20)), '9: giro Últimas usa o título da notícia', r9);
  // 10 (21/11): rótulo do cartão com espaço antes de "· há"; cabeçalho rolado opaco
  const r10 = await Q.evaluate(async () => { go('feed'); await new Promise(z => setTimeout(z, 800)); const h = document.querySelector('#posts .post .ph-sub.fd156-sub .vn-hr'); const ws = h && getComputedStyle(h).whiteSpace; scrollTo(0, 900); await new Promise(z => setTimeout(z, 600)); const t = document.querySelector('.top'); return { ws, bg: getComputedStyle(t).backgroundColor, rolou: t.classList.contains('rolou') } });
  ok((!r10.ws || r10.ws === 'pre') && (!r10.rolou || !/rgba\(.*,\s*0?\.\d+\)/.test(r10.bg)), '10: espaço antes de "· há" e cabeçalho rolado opaco', r10);
  await c2.close(); await b.close(); srv.close && srv.close(); const s = U.resumo(); console.log(`${s.OKS} ok, ${s.FALHAS} falhas`); process.exit(s.FALHAS ? 1 : 0);
})();
