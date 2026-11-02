// Etapa 26: foto sem piscar; cabeçalho; Agora letreiro; pílula → O que mudou; fundo travado; sem menu ao segurar
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  f.pautas.forEach((p, i) => { p.foto = { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/F' + i + '.jpg', credito: 'Foto: X/Agência Senado', alt: 't' } });
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f)); const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const hh = ms => { const d = new Date(ms - 3 * 3600e3); const p = n => String(n).padStart(2, '0'); return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}h${p(d.getUTCMinutes())}` };
  const pe = f.pautas[3];
  fs.writeFileSync(__dirname + '/../site/novidades.json', JSON.stringify({ gerado: new Date().toISOString(), novos: [{ assunto: 'STF forma maioria para manter prisão de ex-ministro do governo anterior em julgamento', secao: 'politica', n_fontes: 4, relevante: true, manchetes: [{ hora: hh(Date.now() - 20 * 6e4) }] }], em_pautas: { [pe.id]: { n_fontes: 3, manchetes: [{ hora: hh(Date.now() - 10 * 6e4) }] } } }));
  const srv = U.servir('site', 8812); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa26/'; fs.mkdirSync(D, { recursive: true });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('https://upload.wikimedia.org/**', async r => { await new Promise(x => setTimeout(x, 300)); r.fulfill({ body: jpg, contentType: 'image/jpeg' }) });
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8812/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000); await sleep(1200);
  ok(await p.evaluate(() => { const t = document.querySelector('#v-capa .cp > .cp-top'); return t && /prumo/.test(t.textContent) && /Edição/.test(t.textContent) && t === document.querySelector('#v-capa .cp').firstElementChild }), 'cabeçalho do jornal (nome e edição/data) de volta no topo');
  ok(await p.evaluate(() => { const b = document.querySelector('#v-capa .cp-agora'); return b && b.previousElementSibling && b.previousElementSibling.classList.contains('cp-top') && getComputedStyle(b.querySelector('.ag-run')).animationName === 'tk' && /julgamento/.test(b.textContent) }), 'Agora: letreiro com a manchete inteira, logo abaixo do cabeçalho');
  await p.screenshot({ path: D + 'capa.png' });
  // foto da matéria: sem ilustração aparecendo enquanto carrega
  await p.evaluate(() => abrirMateria(FEED.capa.manchete)); await sleep(60);
  ok(await p.evaluate(() => { const a = document.querySelector('#layer .mat-arte .foto'); const ill = a && a.querySelector('.ill'); const img = a && a.querySelector('img'); return a && getComputedStyle(ill).visibility === 'hidden' && getComputedStyle(img).opacity === '1' }), 'foto da matéria: nada de ilustração por baixo nem efeito que pisca');
  await p.evaluate(() => history.back()); await sleep(500);
  // Agora: tocar no item que já é pauta abre a matéria
  await p.evaluate(id => { const it = [...document.querySelectorAll('.cp-agora .ag-i')].find(x => { const a = agoraItens()[+x.dataset.agi]; return a && a.pid === id }); it.click() }, pe.id); await sleep(500);
  ok(await p.evaluate(id => MAT_PID === id, pe.id), 'tocar no assunto do Agora que é pauta abre a matéria');
  await p.evaluate(() => history.back()); await sleep(500);
  // pílula → O que mudou
  await p.evaluate(() => { window.scrollTo(0, 900); const f = JSON.parse(JSON.stringify(FEED)); f.atualizado_em = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00'; f.mudancas = { titulo: 'O que mudou', itens: [{ pid: f.pautas[1].id, tipo: 'atualizada', texto: 'Fato novo de teste.' }] }; NOVO = f; mostrarPilula(1) }); await sleep(200);
  ok(await p.evaluate(() => !document.querySelector('#pilula')), 'sem pílula de edição nova');
  await p.evaluate(() => window.scrollTo(0, 0)); await sleep(4800);
  ok(await p.evaluate(() => !NOVO && FEED.mudancas.itens.some(i => /Fato novo de teste/.test(i.texto))), 'edição nova entra sozinha quando a pessoa volta ao topo');
  await p.evaluate(() => abrirMudou()); await sleep(600);
  ok(await p.evaluate(() => /O que mudou/.test(document.querySelector('#layer .sh-h')?.textContent || '') && /Fato novo de teste/.test(document.querySelector('#layer .mud-l').textContent)), '"O que mudou" mostra a edição nova');
  await p.screenshot({ path: D + 'mudou.png' });
  // fundo travado com a janela aberta
  ok(await p.evaluate(() => getComputedStyle(document.body).position === 'fixed'), 'com a janela aberta, a página de baixo fica travada');
  const pid1 = await p.evaluate(() => document.querySelector('[data-mudouir]').dataset.mudouir);
  await p.evaluate(() => document.querySelector('[data-mudouir]').click()); await sleep(700);
  ok(await p.evaluate(id => MAT_PID === id && !!document.querySelector('#layer .mat'), pid1), 'item de "O que mudou" abre a matéria');
  await p.evaluate(() => history.back()); await sleep(500);
  ok(await p.evaluate(() => getComputedStyle(document.body).position !== 'fixed' && !document.documentElement.classList.contains('travado')), 'fechou tudo: página destravada');
  // posição preservada ao abrir/fechar uma janela
  await p.evaluate(() => window.scrollTo(0, 1200)); await sleep(200); const y0 = await p.evaluate(() => scrollY);
  await p.evaluate(() => abrirPrevia(FEED.pautas[2].id)); await sleep(500);
  ok(await p.evaluate(() => getComputedStyle(document.body).position === 'fixed' && !!document.querySelector('#layer .pv')), 'prévia aberta: fundo travado');
  ok(await p.evaluate(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.querySelector('#layer .pv h3').dispatchEvent(e); return e.defaultPrevented }), 'segurar o dedo na prévia não abre menu de seleção');
  await p.evaluate(() => history.back()); await sleep(500);
  ok(await p.evaluate(y => Math.abs(scrollY - y) < 5, y0), 'ao fechar, a Capa volta exatamente onde estava', y0);
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa26: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(__dirname + '/../site/novidades.json') } catch (e) { } process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
