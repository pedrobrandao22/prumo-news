// Etapa 27: fotos de arquivo (Commons) quando a pauta não tem foto própria — meta ≥ 90% com foto real
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  fs.copyFileSync(require('../t_util').REPO + '/fotos-arquivo.json', S0 + 'fotos-arquivo.json');
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8813); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa27/'; fs.mkdirSync(D, { recursive: true });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8813/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ, null, 10000); await sleep(1200);
  const c = await p.evaluate(() => { const ps = FEED.pautas; const com = ps.filter(x => fotoDe(x)); return { tot: ps.length, com: com.length, propria: ps.filter(x => x.foto).length, sem: ps.filter(x => !fotoDe(x)).map(x => x.id) } });
  ok(c.com / c.tot >= 0.9, `≥ 90% das notícias com foto real (${c.com}/${c.tot}; ${c.propria} com foto própria)`, c);
  ok(await p.evaluate(() => { const q = FEED.pautas.find(x => !x.foto && fotoArquivo(x)); const f = fotoDe(q); return /Foto de arquivo/.test(f.credito) && /^https:\/\/upload\.wikimedia\.org\//.test(f.url) }), 'foto de arquivo vem do Commons e diz "Foto de arquivo" no crédito');
  ok(await p.evaluate(() => { const fa = fotoArquivo({ id: 'x', secao: 'politica', subtema: 'STF e Judiciário', neutro: { titulo: 'Flávio Dino suspende emendas' } }); const fb = fotoArquivo({ id: 'y', secao: 'politica', subtema: 'Congresso', neutro: { titulo: 'Flávio Bolsonaro discursa no Senado' } }); return fa && fb && fa.alt !== fb.alt && /Bolsonaro/.test(fb.alt) }), 'pessoa do título define a foto (e "Flávio Dino" não vira Flávio Bolsonaro)');
  ok(await p.evaluate(() => { const els = [...document.querySelectorAll('#v-capa .cpi')]; const comFoto = els.filter(e => e.querySelector('.foto img')).length; const comArte = els.filter(e => e.querySelector('.art,.cp-th')).length; return comArte > 0 && comFoto === comArte }), 'Capa: todas as imagens visíveis são fotos');
  await p.screenshot({ path: D + 'capa.png' }); await p.evaluate(() => scrollTo(0, 1400)); await sleep(300); await p.screenshot({ path: D + 'capa2.png' });
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa27: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'fotos-arquivo.json') } catch (e) { } process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
