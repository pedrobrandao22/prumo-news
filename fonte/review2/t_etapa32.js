// Etapa 32: correções da revisão (fechar janela não conta como rolagem; recarga não fecha matéria; cartão não transborda; contraste)
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  f.resumo_dia.itens = f.resumo_dia.itens.map((x, i) => ({ ...x, texto: (x.texto + ' ').repeat(4).trim() }));
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8832); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: 'dark' });
  await ctx.route('https://upload.wikimedia.org/**', r => r.abort());
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8832/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(800);
  await p.evaluate(() => scrollTo(0, 1500)); await sleep(1800); await p.evaluate(() => document.getElementById('lp')?.classList.remove('lp-mini'));
  await p.evaluate(() => abrirMateria(FEED.pautas[1].id)); await sleep(500); await p.evaluate(() => closeLayer()); await sleep(250);
  const st = await p.evaluate(() => ({ lp: document.getElementById('lp')?.classList.contains('lp-mini'), y: scrollY, nav: document.querySelector('nav')?.className || '' }));
  ok(!st.lp && st.y > 1000, 'fechar a matéria devolve a posição sem recolher o botão de leitura ' + JSON.stringify(st));
  // recarga com janela aberta fica para depois
  await p.evaluate(() => { abrirMateria(FEED.pautas[0].id); VERSAO_NOVA = 'abcdefabcdef'; window.__rec = 0; tentarRecarregar(true) }); await sleep(300);
  ok(await p.evaluate(() => !!document.querySelector('#layer .mat') && window.RECARGA_PEND === 1), 'versão nova na volta ao app não fecha a matéria aberta (recarrega ao fechar)');
  await p.evaluate(() => { window.RECARGA_PEND = 0; VERSAO_NOVA = null; closeLayer() }); await sleep(300);
  // cartão com textos longos não passa do fim
  ok(await p.evaluate(() => { const c = cartaoResumo(); const g = c.getContext('2d'); const d = g.getImageData(0, 1150, 1080, 60).data; let tinta = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 120) tinta++; return tinta < 50 }), 'cartão do resumo com itens longos não invade o rodapé');
  // contraste do rótulo no escuro
  ok(await p.evaluate(() => { const b = document.createElement('b'); b.className = 'mud-k'; b.textContent = 'Nova'; document.body.appendChild(b); const c = getComputedStyle(b).color; b.remove(); return c === 'rgb(15, 21, 34)' }), 'rótulos "Nova/Atualizada" legíveis no modo escuro do sistema');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa32: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
