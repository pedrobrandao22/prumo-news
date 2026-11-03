// Etapas 30-31: fotos nos círculos; cartões de cobertura; botão de leitura recolhe; cartão do resumo; página da pessoa; como terminou
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  const pe = f.pautas.find(p => p.tipo !== 'pontual' && (p.atualizacoes || []).length); pe.status = 'encerrada'; pe.desfecho = 'Terminou assim: resultado de teste com 51 votos.';
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  fs.copyFileSync(require('../t_util').REPO + '/fotos-arquivo.json', S0 + 'fotos-arquivo.json'); try { fs.rmSync(S0 + 'acervo', { recursive: true, force: true }); if (fs.existsSync(require('../t_util').REPO + '/acervo')) fs.symlinkSync(require('../t_util').REPO + '/acervo', S0 + 'acervo') } catch (e) { }
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8831); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa31/'; fs.mkdirSync(D, { recursive: true });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, acceptDownloads: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8831/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ, null, 10000); await sleep(800);
  // botão de leitura recolhe ao rolar
  await p.evaluate(() => { renderCapa(); lenteBotao() }); await sleep(300);
  await p.mouse.wheel(0, 900); await sleep(250);
  ok(await p.evaluate(() => document.getElementById('lp').classList.contains('lp-mini')), 'rolando para baixo, o botão Neutra vira só o ícone');
  await p.evaluate(() => scrollTo(0, 0)); await sleep(300); ok(await p.evaluate(() => !document.getElementById('lp').classList.contains('lp-mini')), 'de volta ao topo, o botão volta inteiro');
  // cartão do resumo
  const cart = await p.evaluate(() => { const c = cartaoResumo(); return c && c.width === 1080 && c.height === 1350 });
  ok(cart, 'cartão do resumo (1080×1350) é gerado');
  await p.evaluate(() => { const c = cartaoResumo(); const i = document.createElement('img'); i.id = 'cartao'; i.src = c.toDataURL(); i.style = 'position:fixed;top:0;left:0;width:390px;z-index:999'; document.body.appendChild(i) }); await sleep(300);
  await p.screenshot({ path: D + 'cartao.png' }); await p.evaluate(() => document.getElementById('cartao').remove());
  const dl = p.waitForEvent('download', { timeout: 5000 }).catch(() => null); await p.evaluate(() => document.querySelector('[data-1mshare]').click()); await sleep(200); await p.evaluate(() => document.querySelector('.sheet [data-envimg]').click()); const d = await dl;
  ok(d && /prumo-1-minuto\.png/.test(d.suggestedFilename()), 'botão "Mandar" do resumo: compartilha ou baixa a imagem');
  // página da pessoa
  const nome = await p.evaluate(() => Object.keys(FEED.pessoas).find(k => pessoaArq(k) && pautasDaPessoa(k).length >= 2));
  await p.evaluate(k => abrirTermo('p', k), nome); await sleep(500);
  ok(await p.evaluate(() => !!document.querySelector('#layer .pes-f img, #layer2 .pes-f img') && document.querySelectorAll('#layer .mud-l li, #layer2 .mud-l li').length >= 2), `página da pessoa (${nome}): foto e notícias em que aparece`);
  await p.screenshot({ path: D + 'pessoa.png' });
  await p.evaluate(() => document.querySelector('#layer .mud-l button, #layer2 .mud-l button').click()); await sleep(700);
  ok(await p.evaluate(() => !!MAT_PID && !!document.querySelector('#layer .mat')), 'tocar numa notícia da pessoa abre a matéria');
  await p.evaluate(() => closeLayer()); await sleep(400);
  // como terminou
  await p.evaluate(id => abrirMateria(id), pe.id); await sleep(500);
  ok(await p.evaluate(() => /Como terminou/.test(document.querySelector('#layer .mat-fim')?.textContent || '') && /51 votos/.test(document.querySelector('#layer .mat-fim').textContent)), 'cobertura encerrada: "Como terminou" no topo da matéria');
  await p.evaluate(() => closeLayer()); await sleep(400);
  // círculos do Feed com foto; coberturas com título inteiro
  await p.evaluate(() => go('feed')); await sleep(1200);
  ok(await p.evaluate(() => { const fs = [...document.querySelectorAll('#secs [data-sec-story] .ig-f')]; return fs.length && fs.every(f => f.querySelector('img')) }), 'círculos das seções no Feed com foto real');
  await p.screenshot({ path: D + 'feed.png' });
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa31: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'fotos-arquivo.json') } catch (e) { } try { fs.unlinkSync(S0 + 'acervo') } catch (e) { } process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
