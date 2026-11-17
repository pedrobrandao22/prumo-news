// Corretor 16/11 noite (170): a derrota da Seleção para o Japão abria com o Ancelotti de corpo inteiro, de camisa do
// Bayern, e o quadro cortava o rosto. A foto sai do acervo (app e robô) e retrato de pessoa mostra a parte de cima
// (o rosto) no Feed e na matéria. Porta 8750.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path');
const PORTA = 8750, BASE = `http://localhost:${PORTA}/index.html`, SITE = path.join(__dirname, '..', 'site');
const ARQ = path.join(U.REPO, 'fotos-arquivo.json');
let srv = null;
(async () => {
  const f = U.feedFresco('site'); const ilu = f.pautas[0].imagem;
  const A = JSON.parse(fs.readFileSync(ARQ, 'utf8'));
  // o acervo de teste tem a foto do Bayern (como estava no ar em 16/11) e o retrato de 2012
  A.pessoas = A.pessoas || {};
  const anc = A.pessoas['Carlo Ancelotti'] = A.pessoas['Carlo Ancelotti'] || { chaves: ['Ancelotti'], fotos: [] };
  const BAY = 'https://upload.wikimedia.org/wikipedia/commons/6/67/Carlo_Ancelotti_2016_ICC.jpg';
  const RET = 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Carlo_Ancelotti_2012_%28cropped%29.jpg';
  if (!anc.fotos.some(x => x.url === BAY)) anc.fotos.unshift({ url: BAY, credito: 'Foto de arquivo: goatling/Wikimedia Commons (CC BY-SA 2.0)', alt: 'Foto de arquivo: Carlo Ancelotti', local: 'acervo/p/carlo-ancelotti-653a34c8.webp' });
  if (!anc.fotos.some(x => x.url === RET)) anc.fotos.push({ url: RET, credito: 'Foto de arquivo: Wikimedia Commons (CC BY-SA 3.0)', alt: 'Foto de arquivo: Carlo Ancelotti', local: 'acervo/p/carlo-ancelotti-af29d848.webp' });
  anc.fotos = anc.fotos.filter(x => x.url === BAY || x.url === RET);  // 18/11: só as duas fotos do teste (as outras do acervo não têm cópia local e a matéria as tira quando não carregam)
  const tit = 'Brasil perde do Japão por 3 a 2 e Ancelotti é expulso'; // 18/11 (187): o retrato só vale com a pessoa na frase principal do título
  const nova = { id: 't-selecao-170', secao: 'esportes', subtema: 'Seleção', tema: 'Seleção Brasileira', tipo: 'cobertura', status: 'nova', hora: f.atualizado_em, prioridade: 99,
    neutro: { titulo: tit, texto: tit + '. Texto da notícia.', pontos: [tit] },
    imagem: { modelo: 'generica', etiqueta: 'Ilustração', alt: 'Ilustração de bola de futebol em gramado', dados: { rotulo: 'Seleção · amistoso' } } };
  f.pautas = [nova].concat(f.pautas.map(p => ({ ...p, prioridade: Math.min(50, p.prioridade || 0) })));
  if (!f.pautas[1].imagem) f.pautas[1].imagem = ilu;
  fs.writeFileSync(path.join(SITE, 'feed.json'), JSON.stringify(f));
  fs.writeFileSync(path.join(SITE, 'fotos-arquivo.json'), JSON.stringify(A));
  srv = U.servir('site', PORTA); await sleep(800); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  await ctx.route(/^https:\/\/upload\.wikimedia\.org\//, r => r.abort());
  const p = U.erros(await ctx.newPage(), 'c170'); await p.goto(BASE);
  await esperar(p, () => window.FEED && window.FOTOS_ARQ && window.FOTOS_ARQ.pessoas && document.querySelectorAll('.post').length > 0, null, 15000); await sleep(900);

  // 1. a foto do Bayern não é escolhida; o retrato de 2012 sim
  const r = await p.evaluate(() => { const q = FEED.pautas.find(x => x.id === 't-selecao-170'); const fo = fotoDe(q); return fo ? decodeURIComponent(fo.url.split('/').pop()) : null });
  ok(r && !/2016_ICC/.test(r), 'Seleção: sem a foto do Ancelotti de camisa do Bayern', r);
  ok(/Ancelotti_2012/.test(r || ''), 'Seleção: usa o retrato do Ancelotti em que aparece o rosto', r);
  ok(await p.evaluate(() => ft157Bloq({ url: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Carlo_Ancelotti_2016_ICC.jpg' })), 'a foto do Bayern está bloqueada no app');
  ok(await p.evaluate(() => !(FOTOS_ARQ.pessoas['Carlo Ancelotti'].fotos || []).some(x => /2016_ICC/.test(x.url))), 'o acervo carregado não oferece mais a foto do Bayern');

  // 2. retrato de pessoa mostra a parte de cima no Feed e na matéria; foto de lugar continua centralizada
  const ret = await p.evaluate(() => ({ s: cr170Retrato('https://upload.wikimedia.org/wikipedia/commons/c/cf/Carlo_Ancelotti_2012_%28cropped%29.jpg'),
    l: cr170Retrato('acervo/p/carlo-ancelotti-af29d848.webp'), n: cr170Retrato('https://upload.wikimedia.org/wikipedia/commons/9/98/Edif%C3%ADcio_Sede.jpg') }));
  ok(ret.s && ret.l && !ret.n, 'reconhece o retrato (endereço do acervo e cópia local) e não confunde com foto de lugar', ret);
  await p.evaluate(() => { try { go('feed') } catch (e) { } }); await sleep(900);
  await p.evaluate(() => { const im = [...document.querySelectorAll('#posts img')].find(i => /ancelotti/i.test(i.getAttribute('src') || '')); if (im) im.scrollIntoView({ block: 'center' }) }); await sleep(600);
  const fe = await p.evaluate(() => { const ims = [...document.querySelectorAll('img')].filter(i => /ancelotti/i.test(i.getAttribute('src') || ''));
    return ims.map(i => ({ m: i.dataset.cr170, op: getComputedStyle(i).objectPosition })) });
  ok(fe.length > 0, 'o Feed mostra a foto do Ancelotti', fe);
  ok(fe.length > 0 && fe.every(x => x.m === '1' && /18%/.test(x.op)), 'Feed: o retrato fica preso pela parte de cima (rosto à vista)', fe);
  const outras = await p.evaluate(() => [...document.querySelectorAll('img[data-cr170="1"]')].filter(i => !/ancelotti/i.test(i.getAttribute('src') || '')).map(i => i.getAttribute('src')).filter(s => !/acervo\/p\/|wikimedia.*\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\//.test(s)));
  ok(outras.length === 0, 'só retratos ganham o ajuste', outras);
  await p.evaluate(() => abrirMateria('t-selecao-170')); await sleep(1200);
  const ma = await p.evaluate(() => { const ims = [...document.querySelectorAll('#layer img')].filter(i => /ancelotti/i.test(i.getAttribute('src') || ''));
    return ims.map(i => ({ m: i.dataset.cr170, op: getComputedStyle(i).objectPosition })) });
  ok(ma.length > 0 && ma.every(x => x.m === '1' && /18%/.test(x.op)), 'matéria: o retrato mostra o rosto', ma);
  ok(await p.evaluate(() => !/2016_ICC|653a34c8/.test(document.querySelector('#layer').innerHTML)), 'matéria: sem a foto do Bayern');
  ok(!p._erros.length, 'sem erros no console', p._erros);
  await br.close(); srv.kill(); try { fs.unlinkSync(path.join(SITE, 'fotos-arquivo.json')) } catch (e) {}
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1611c: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('ERRO', e); try { srv && srv.kill() } catch (x) {} process.exit(1) });
