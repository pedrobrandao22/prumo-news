// Corretor 21/11 (noite, 21h): (1) causa celular-pequeno-2 / achado "nesta-materia-abas-passam-por-baixo-do-rotulo-e-deixam-
// letra-solta-2" (voltou 1 vez): no fim da faixa "Nesta matéria" a rolagem máxima não cai no começo de uma aba e sobrava pedaço
// de palavra colado ao rótulo. Gera a CLASSE: todas as matérias com 3+ capítulos, 3 larguras (320, 375, 412) x letra normal
// e maior (1,4), marcando cada aba (do 1º ao último) e rolando a faixa à mão até o fim: nenhuma aba VISÍVEL fica cortada pela
// borda esquerda. Controles: a aba marcada continua inteira e visível; no começo da faixa nada some.
// (2) achado "notificacoes-novos-seguidores-aparece-duas-vezes": no só-seguir, a lista "O que avisar" tem um "Novos seguidores"
// só (a chave amizades vira "Pedidos para seguir"). Porta 9165.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9165, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (P, f, a) => P.evaluate(f, a);
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const b = await U.navegador();
  let casos = 0, ruins = [], marcadasFora = [], inicioSome = [];
  for (const w of [320, 375, 412]) for (const fz of [1, 1.4]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 760 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const P = U.erros(await ctx.newPage(), 'P' + w); await P.goto(BASE);
    await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && window.__prumoPronto, null, 15000);
    if (await ev(P, () => !!window.__pCarrega)) { await ev(P, () => { __pCarrega(2); __pCarrega(3) }); await sleep(600) }
    await ev(P, z => { PREF.fonte = z; aplicarFonte() }, fz);
    const ids = await ev(P, () => FEED.pautas.map(p => p.id));
    for (const id of ids) {
      const n = await ev(P, id => { closeLayer(); abrirMateria(id); return document.querySelectorAll('#layer .fs2-cap [data-f113cap]').length }, id);
      if (n < 3) continue;
      await sleep(150);
      // começo da faixa: nada escondido
      const ini = await ev(P, () => document.querySelectorAll('#layer .fs2-cap .f113-corta').length);
      if (ini) inicioSome.push(`${w}/${fz} ${id}`);
      for (let i = 0; i < n; i++) {
        const r = await ev(P, i => { const nav = document.querySelector('#layer .fs2-cap'); const l = nav.querySelector('.fs2-cap-l'); f113CapMarca(nav, i); return true }, i);
        await sleep(i === n - 1 ? 450 : 120);
        const x = await ev(P, i => { const l = document.querySelector('#layer .fs2-cap-l'); f113CapCorta(l); const lr = l.getBoundingClientRect();
          const vis = [...l.querySelectorAll('.fs2-cap-b')].filter(b => getComputedStyle(b).visibility !== 'hidden');
          const cort = vis.filter(b => { const r = b.getBoundingClientRect(); return r.left < lr.left - 0.5 && r.right > lr.left + 0.5 }).map(b => b.textContent);
          const m = l.querySelector(`[data-f113cap="${i}"]`), mr = m.getBoundingClientRect();
          return { cort, marcadaOk: getComputedStyle(m).visibility !== 'hidden' && mr.left >= lr.left - 1 && mr.right <= lr.right + 1, d: [getComputedStyle(m).visibility, Math.round(mr.left - lr.left), Math.round(lr.right - mr.right), Math.round(mr.width), Math.round(lr.width), l.scrollLeft] } }, i);
        casos++; if (x.cort.length) ruins.push(`${w}/${fz} ${id} aba ${i}: ${x.cort.join(',')}`); if (!x.marcadaOk) marcadasFora.push(`${w}/${fz} ${id} aba ${i} ${JSON.stringify(x.d)}`);
      }
      // rolar a faixa à mão até o fim (o caso do testador) e voltar ao começo
      const fim = await ev(P, async () => { const l = document.querySelector('#layer .fs2-cap-l'); l.style.scrollSnapType = 'none'; l.scrollLeft = l.scrollWidth; l.dispatchEvent(new Event('scroll')); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
        const lr = l.getBoundingClientRect(); const cort = [...l.querySelectorAll('.fs2-cap-b')].filter(b => getComputedStyle(b).visibility !== 'hidden').filter(b => { const r = b.getBoundingClientRect(); return r.left < lr.left - 0.5 && r.right > lr.left + 0.5 }).map(b => b.textContent);
        l.scrollLeft = 0; l.dispatchEvent(new Event('scroll')); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
        return { cort, volta: l.querySelectorAll('.f113-corta').length } });
      casos++; if (fim.cort.length) ruins.push(`${w}/${fz} ${id} fim à mão: ${fim.cort.join(',')}`); if (fim.volta) inicioSome.push(`${w}/${fz} ${id} depois de voltar`);
    }
    await ctx.close();
  }
  ok(casos > 20, `"Nesta matéria": casos conferidos (${casos})`);
  ok(!ruins.length, '"Nesta matéria": nenhuma aba visível cortada pela borda esquerda (sem pedaço de palavra junto do rótulo)', ruins.slice(0, 6));
  ok(!marcadasFora.length, '"Nesta matéria": a aba marcada continua inteira e visível', marcadasFora.slice(0, 6));
  ok(!inicioSome.length, '"Nesta matéria": no começo da faixa nenhuma aba some', inicioSome.slice(0, 6));

  // (2) notificações no só-seguir
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const P = U.erros(await ctx.newPage(), 'N'); await P.goto(BASE);
  await esperar(P, () => window.FEED && FEED.pautas && window.__prumoPronto, null, 15000);
  if (await ev(P, () => !!window.__pCarrega)) { await ev(P, () => { __pCarrega(2); __pCarrega(3) }); await sleep(600) }
  const nt = await ev(P, async () => { SG181.on = true; NT124.v9 = true;
    const d = document.createElement('div'); d.id = 't2111d'; d.innerHTML = nt124Tipos().map(t => `<div class="row"><b>${t[1]}</b><small>${t[2]}</small></div>`).join('') + '<span class="amg-t">Pedido de amizade</span>';
    document.body.appendChild(d); await new Promise(r => setTimeout(r, 120)); sg181Textos(d);
    const nomes = [...d.querySelectorAll('b')].map(x => x.textContent), sub = [...d.querySelectorAll('small')].map(x => x.textContent), ped = d.querySelector('.amg-t').textContent; d.remove(); return { nomes, sub, ped } });
  ok(nt.nomes.filter(x => x === 'Novos seguidores').length === 1, 'Notificações: "Novos seguidores" aparece uma vez só', nt.nomes);
  ok(nt.nomes.includes('Pedidos para seguir') && nt.sub.includes('Quem pede para seguir o seu perfil fechado'), 'Notificações: a outra chave vira "Pedidos para seguir"', nt);
  ok(nt.ped === 'Pedido para seguir', 'Perfil: pedido pendente diz "Pedido para seguir"', nt.ped);
  ok(!P._erros.length, 'sem erros na página', P._erros.slice(0, 3));
  await ctx.close(); await b.close(); srv.kill();
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_2111d: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.log('ERRO', e); process.exit(1) });
