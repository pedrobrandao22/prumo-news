// Corretor 17/11 (171): a manchete do ajuste fiscal abria com a foto P&B da promulgação da Constituinte
// ("200 anos do Senado Federal") e o Fies com galhos de árvore contra o céu. As duas fotos saem do acervo. Porta 8751.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path');
const PORTA = 8751, BASE = `http://localhost:${PORTA}/index.html`, SITE = path.join(__dirname, '..', 'site');
const ARQ = path.join(U.REPO, 'fotos-arquivo.json');
let srv = null;
(async () => {
  const f = U.feedFresco('site');
  const A = JSON.parse(fs.readFileSync(ARQ, 'utf8'));
  const C200 = 'https://upload.wikimedia.org/wikipedia/commons/d/d2/200_anos_do_Senado_Federal_%2853454234104%29_%28cropped%29.jpg';
  const PLE = 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Plen%C3%A1rio_do_Senado_%2829281060086%29.jpg';
  const BOS = 'https://upload.wikimedia.org/wikipedia/commons/9/93/Bosque_Campus_Universidade_Federal_de_Goi%C3%A1s.JPG';
  A.assuntos = A.assuntos || {};
  A.assuntos['Senado plenário'] = { chaves: ['Senado'], fotos: [
    { url: C200, credito: 'Foto de arquivo: Agência Senado/Wikimedia Commons (CC BY 2.0)', alt: 'Foto de arquivo: Plenário do Senado Federal vista geral' },
    { url: PLE, credito: 'Foto de arquivo: Agência Senado/Wikimedia Commons (CC BY 2.0)', alt: 'Foto de arquivo: Plenário do Senado Federal vista geral' }] };
  fs.writeFileSync(path.join(SITE, 'feed.json'), JSON.stringify(f));
  fs.writeFileSync(path.join(SITE, 'fotos-arquivo.json'), JSON.stringify(A));
  srv = U.servir('site', PORTA); await sleep(800); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  await ctx.route(/^https:\/\/upload\.wikimedia\.org\//, r => r.abort());
  const p = U.erros(await ctx.newPage(), 'c171'); await p.goto(BASE);
  await esperar(p, () => window.FEED && window.FOTOS_ARQ && document.querySelectorAll('.post').length > 0, null, 15000); await sleep(900);
  const b = await p.evaluate(([a, b2, c]) => ({ c200: ft157Bloq({ url: a }), bos: ft157Bloq({ url: c }), ple: ft157Bloq({ url: b2 }) }), [C200, PLE, BOS]);
  ok(b.c200, 'a foto "200 anos do Senado" (promulgação de 1988) está bloqueada', b);
  ok(b.bos, 'a foto dos galhos ("Bosque Campus") está bloqueada', b);
  ok(!b.ple, 'o plenário do Senado de verdade continua liberado', b);
  const ac = await p.evaluate(() => JSON.stringify(FOTOS_ARQ));
  ok(!/200_anos_do_Senado/.test(ac) && !/Bosque_Campus/.test(ac), 'o acervo carregado não oferece mais as duas fotos');
  const r = await p.evaluate(() => { const q = { id: 't-171', secao: 'politica', subtema: 'Congresso', tag: 'Senado', tema: 'Ajuste fiscal',
    neutro: { titulo: 'Senado vota os quatro destaques do ajuste fiscal', texto: 'O Senado vota os destaques.' } };
    try { const fo = fotoDe(q); return fo ? decodeURIComponent(fo.url.split('/').pop()) : '' } catch (e) { return 'erro ' + e.message } });
  ok(!/200_anos/.test(r), 'notícia do Senado não recebe a foto da promulgação', r);
  ok(!p._erros.length, 'sem erros no console', p._erros);
  await br.close(); srv.kill(); try { fs.unlinkSync(path.join(SITE, 'fotos-arquivo.json')) } catch (e) {}
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1711: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('ERRO', e); try { srv && srv.kill() } catch (x) {} process.exit(1) });
