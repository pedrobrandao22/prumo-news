// Etapa 42: topo do Feed e stories no estilo Instagram
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  const ps = f.pautas.filter(p => p.secao === 'politica')[0] || f.pautas[0]; ps.social = ['R$ 44.008,52: é o subsídio bruto do senador.', 'Cada falta gera desconto.', 'E agora? Alcolumbre não respondeu.'];
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); f.agenda = [{ data: hoje, hora: '23h59', texto: 'Evento de teste no Senado' }].concat(f.agenda || []);
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f)); fs.copyFileSync(require('../t_util').REPO + '/fotos-arquivo.json', S0 + 'fotos-arquivo.json');
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8842); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.route(u => u.hostname !== 'localhost' && /\.(jpe?g|png|webp|gif)$/i.test(u.pathname), r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));  // qualquer foto de fora (Wikimedia, Agência Câmara, Senado…): o conteúdo do dia muda de fonte
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8842/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ, null, 10000); await sleep(500);
  await p.evaluate(() => go('feed')); await sleep(900);
  const t = await p.evaluate(() => { const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
    const secs = document.querySelector('#secs'), post = document.querySelector('#posts .post');
    return { ticker: vis(document.querySelector('#ticker')), chg: vis(document.querySelector('#chg')), cinco: !!secs.querySelector('[data-5min]'), ult: !!secs.querySelector('[data-ultimas]'), ag: !!secs.querySelector('[data-igagenda]'), nums: secs.querySelectorAll('.ncount').length, gap: Math.round(post.getBoundingClientRect().top - (document.querySelector('#avisoconta') || secs).getBoundingClientRect().bottom), secsTop: Math.round(secs.getBoundingClientRect().top) } });
  ok(!t.ticker && !t.chg, 'Feed sem faixa Últimas, agenda e barra de novidades no topo ' + JSON.stringify(t));
  ok(t.cinco && t.ult && !t.ag && t.nums === 0, 'círculos: Em 5 min, Últimas e seções (Agenda dentro do Em 5 min), sem números ' + JSON.stringify(t));
  ok(t.gap <= 20 && t.secsTop < 90, 'posts começam logo abaixo dos stories ' + JSON.stringify(t));
  await p.evaluate(() => igAbrir('_ag')); await sleep(500);
  ok(await p.evaluate(() => /Evento de teste no Senado/.test(document.querySelector('#layer .story.sg-ag')?.textContent || '') && document.querySelector('#layer .sg-who b')?.textContent === 'Em 5 min' && document.querySelector('#secs .sb:nth-child(2)')?.matches('[data-ultimas]')), 'Agenda aparece como parte do Em 5 min; segunda bolinha é Últimas');
  await p.evaluate(() => closeLayer()); await sleep(300);
  await p.evaluate(id => { const ps = pautasDa('politica'); ST = { sec: 'politica', ids: ps.map(p => p.id), i: ps.findIndex(p => p.id === id), ordem: secsStory().map(s => s.id) }; drawStory() }, ps.id); await sleep(700);
  const s = await p.evaluate(() => { const st = document.querySelector('#layer .story.sg'); const b = st.querySelector('.sg-body').getBoundingClientRect(); return { foto: st.classList.contains('com-foto'), h2: st.querySelector('h2').textContent, n: st.querySelector('.sg-n')?.textContent, li: [...st.querySelectorAll('.sg-l li')].map(x => x.textContent), ler: !!st.querySelector('[data-stmat]'), topo: b.top, fundo: b.bottom, alt: innerHeight } });
  ok(s.foto && s.ler && s.n === 'R$ 44.008,52' && s.li.length === 3 && /^É o subsídio/.test(s.li[0]), 'story: foto, título, número grande, 3 frases e "Ler a matéria" ' + JSON.stringify(s));
  ok(s.topo > 100 && s.fundo < s.alt - 60, 'texto do story cabe entre o topo e os botões ' + JSON.stringify(s));
  await p.evaluate(() => document.querySelector('#layer [data-stmat]').click()); await sleep(600);
  ok(await p.evaluate(id => MAT_PID === id && !!document.querySelector('#layer .mat') && !ST.timer, ps.id), '"Ler a matéria" abre a matéria e para o story');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa42: ${R.OKS} ok, ${R.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'fotos-arquivo.json') } catch (e) { } process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
