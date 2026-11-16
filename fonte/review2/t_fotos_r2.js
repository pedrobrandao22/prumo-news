// Fotos e ilustrações, 2ª rodada de 16/11 (169): a foto mostra o fato, o lugar ou a pessoa; na dúvida, ilustração.
// Tomate sem foto do Banco Central nem fachada de supermercado (ilustração de feira); Série B sem árbitro de outro jogo;
// final em Barranquilla sem a Arena MRV; incêndio em fábrica sem queimada no mato; selo postal fora (também no cartão
// "Notícia de outra edição"); texto alternativo da própria foto; crédito curto sem apelido de usuário; Esportes com
// ilustração por competição; etiqueta em maiúsculas; ilustração ocupando o quadro do Feed. Portas 8740–8741.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path');
const PORTA = 8740, BASE = `http://localhost:${PORTA}/index.html`, SITE = path.join(__dirname, '..', 'site');
const ARQ = path.join(U.REPO, 'fotos-arquivo.json');
const BOLA = { modelo: 'generica', etiqueta: 'Ilustração', alt: 'Ilustração de bola de futebol em gramado' };
const PAUTAS = [
  ['t-tomate', 'economia', 'Juros e inflação', 'Tomate acumula alta de 58,7% em 2026 com chuva e menos área plantada', { imagem: null }],
  ['t-serieb', 'esportes', 'Série B', 'Playoffs da Série B começam domingo (22) e dão 2 vagas na Série A', { imagem: { ...BOLA, dados: { rotulo: 'Série B · playoffs' } } }],
  ['t-final', 'esportes', 'Sul-Americana', 'Atlético-MG e Boca decidem a Sul-Americana no sábado (21)', { subtitulo: 'A final em jogo único é no sábado (21), em Barranquilla, na Colômbia.', imagem: { ...BOLA, dados: { rotulo: 'Sul-Americana · final' } } }],
  ['t-tabela', 'esportes', 'Brasileirão', 'Líderes do Brasileirão chegam à 35ª rodada separados por 3 pontos', { imagem: { ...BOLA, dados: { rotulo: 'Brasileirão · 35ª rodada' } } }],
  ['t-selecao', 'esportes', 'Seleção', 'Seleção perde o amistoso nos acréscimos', { imagem: { ...BOLA, dados: { rotulo: 'Seleção · amistoso' } } }],
  ['t-salto', 'brasil', 'Infraestrutura e transporte', 'Incêndio em indústria química de Salto deixa 9 feridos', {}],
  ['t-bahia', 'brasil', 'Meio ambiente e clima', 'Chuva derruba barragem na Bahia; alertas do Inmet já venceram', {}],
];
let srv = null;
(async () => {
  const f = U.feedFresco('site'); const ilu = f.pautas[0].imagem;
  const novas = PAUTAS.map(([id, secao, subtema, titulo, o], i) => ({ id, secao, subtema, tema: titulo.slice(0, 30), tipo: 'cobertura', status: 'nova', hora: f.atualizado_em, prioridade: 99 - i,
    neutro: { titulo, texto: titulo + '. Texto da notícia.', pontos: [titulo] }, imagem: ilu, ...o }));
  f.pautas = novas.concat(f.pautas.map(p => ({ ...p, prioridade: Math.min(50, p.prioridade || 0) })));
  fs.writeFileSync(path.join(SITE, 'feed.json'), JSON.stringify(f));
  fs.copyFileSync(ARQ, path.join(SITE, 'fotos-arquivo.json'));
  // páginas antigas (/m/) de notícias que saíram: selo postal; queimada num incêndio de fábrica; queimada de verdade
  fs.mkdirSync(path.join(SITE, 'm'), { recursive: true });
  const velha = (id, tit, img) => fs.writeFileSync(path.join(SITE, 'm', id + '.html'), `<!doctype html><meta property="og:title" content="${tit}"><meta property="og:description" content="Resumo."><meta property="og:image" content="${img}">`);
  const TH = n => `https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/${n}/960px-${n}`;
  velha('velha-chuva', 'Chuva derruba barragem na Bahia', TH('Brasil_Barragem_de_3_Marias_%2822129648701%29.jpg'));
  velha('velha-salto', 'Incêndio em indústria química de Salto deixa 9 feridos', TH('Corpo_de_Bombeiros_intensifica_combate_a_inc%C3%AAndios_florestais.jpg'));
  velha('velha-cerrado', 'Incêndio florestal atinge reserva no cerrado', TH('Corpo_de_Bombeiros_intensifica_combate_a_inc%C3%AAndios_florestais.jpg'));
  srv = U.servir('site', PORTA); await sleep(800); const br = await U.navegador();
  const novo = async (vp, escuro) => { const ctx = await br.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2, colorScheme: escuro ? 'dark' : 'light' });
    await ctx.route(/^https:\/\/upload\.wikimedia\.org\//, r => r.abort());
    const p = U.erros(await ctx.newPage(), 'f' + vp.width + (escuro ? 'e' : '')); await p.goto(BASE);
    await esperar(p, () => window.FEED && window.FOTOS_ARQ && document.querySelectorAll('.post').length > 0, null, 15000); await sleep(900); return { ctx, p } };
  let { ctx, p } = await novo({ width: 390, height: 664 });

  // 1. fotos escolhidas
  const r = await p.evaluate(() => { const o = {}; FEED.pautas.filter(q => /^t-/.test(q.id)).forEach(q => { const f = fotoDe(q); o[q.id] = f ? { n: decodeURIComponent(f.url.split('/').pop()), alt: f.alt || '' } : null }); return o });
  const nome = id => (r[id] && r[id].n) || '';
  ok(!/Banco_Central|Supermercado|Zaffari/i.test(nome('t-tomate')), 'tomate: sem o prédio do Banco Central nem fachada de supermercado', r['t-tomate']);
  ok(!/Arbitro|estadio/i.test(nome('t-serieb')), 'Série B: sem árbitro de outro jogo', r['t-serieb']);
  ok(!/Arena_MRV|Atl[eé]tico_Mineiro|Mineir[aã]o/i.test(nome('t-final')), 'final em Barranquilla: sem estádio de Belo Horizonte', r['t-final']);
  ok(!/florestais|C-130|Hercules|queimada/i.test(nome('t-salto')), 'incêndio em fábrica: sem brigadistas em queimada nem simulação de queda de avião', r['t-salto']);
  ok(!/3_Marias|selo|stamp/i.test(nome('t-bahia')), 'chuva na Bahia: sem o selo postal de Minas Gerais', r['t-bahia']);

  // 2. texto alternativo e crédito curto
  const t2 = await p.evaluate(() => ({
    alt: ft169Alt({ arquivo: 1, url: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Supermercado_Zaffari_Lima_e_Silva_%28Porto_Alegre%2C_Brasil%29_0.jpg', alt: 'Foto de arquivo: Banco Central do Brasil' }).alt,
    altOk: ft169Alt({ arquivo: 1, url: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Edif%C3%ADcio_%22Sede%22_do_Banco_Central_do_Brasil_em_Bras%C3%ADlia.jpg', alt: 'Foto de arquivo: Banco Central do Brasil' }).alt,
    c: ['Foto de arquivo: Adam Moreira (AEMoreira042281)/Wikimedia Commons (CC BY-SA 4.0)', 'Foto de arquivo: EDUARDOFSLIMA/Wikimedia Commons (CC BY 4.0)',
      'Foto de arquivo: Wilfredor/Wikimedia Commons (CC0)', 'Foto de arquivo: José Cruz/ABr/Wikimedia Commons (CC BY 3.0 br)', 'Foto de arquivo: Eugenio Hansen, OFS/Wikimedia Commons (CC BY-SA 4.0)',
      'Foto de arquivo: Agência Senado/Wikimedia Commons (CC BY 2.0)', 'Foto: Divulgação', 'Foto de arquivo: 總統府/Wikimedia Commons (CC BY 2.0)'].map(c => creditoCurto(c)),
    full: (document.createRange().createContextualFragment(credHTML('Foto de arquivo: Adam Moreira (AEMoreira042281)/Wikimedia Commons (CC BY-SA 4.0)', 'x')).firstChild || {}).dataset?.credfull }));
  ok(/Supermercado Zaffari/.test(t2.alt) && !/Banco Central/.test(t2.alt), 'texto alternativo vem da própria foto (supermercado não é "Banco Central")', t2.alt);
  ok(t2.altOk === 'Foto de arquivo: Banco Central do Brasil', 'texto alternativo certo continua', t2.altOk);
  ok(JSON.stringify(t2.c) === JSON.stringify(['Arquivo · Adam Moreira', 'Arquivo · Wikimedia Commons', 'Arquivo · Wikimedia Commons', 'Arquivo · José Cruz/ABr', 'Arquivo · Eugenio Hansen, OFS',
    'Arquivo · Agência Senado', 'Foto: Divulgação', 'Arquivo · Presidência de Taiwan']), 'crédito curto sem apelido de usuário do acervo', t2.c);
  ok(/AEMoreira042281/.test(t2.full || ''), 'o crédito completo (toque) continua com o autor e a licença', t2.full);

  // 3. ilustrações: Esportes por competição, feira no tomate, etiqueta em maiúsculas
  const t3 = await p.evaluate(() => { const g = id => pautaById(id); const sc = id => sceneOf(g(id).imagem);
    return { rot: ['t-serieb', 't-final', 't-tabela', 't-selecao'].map(id => g(id).imagem.dados.rotulo), cenas: ['t-serieb', 't-final', 't-tabela', 't-selecao'].map(sc),
      tomate: g('t-tomate').imagem, ctom: sc('t-tomate'), bola: sceneOf({ ...g('t-serieb').imagem, dados: { rotulo: 'FUTEBOL' } }), cong: sceneOf({ modelo: 'generica', alt: 'Ilustração do Congresso', dados: { rotulo: 'CONGRESSO' } }) } });
  ok(JSON.stringify(t3.rot) === JSON.stringify(['SÉRIE B · PLAYOFFS', 'SUL-AMERICANA · FINAL', 'BRASILEIRÃO · 35ª RODADA', 'SELEÇÃO · AMISTOSO']), 'etiquetas das ilustrações em maiúsculas', t3.rot);
  ok(new Set(t3.cenas).size === 4 && t3.cenas.every(c => c.length > 300 && c !== t3.bola), 'Esportes: cada competição com o seu desenho (não a mesma bola quatro vezes)');
  ok(/M158 52 H242/.test(t3.cenas[1]) && />10</.test(t3.cenas[3]), 'final = taça; Seleção = camisa');
  ok(t3.tomate && /feira/.test(t3.tomate.alt) && /#c8452f/.test(t3.ctom) && /INFLAÇÃO DOS ALIMENTOS/.test(t3.ctom), 'tomate sem foto: ilustração de feira com tomates', t3.tomate);
  ok(t3.cong.length > 200 && !/#c8452f/.test(t3.cong), 'as outras ilustrações genéricas continuam (Congresso)');

  // 4. Feed: a ilustração preenche o quadro (sem faixa vazia embaixo) e a etiqueta não é cortada
  await p.evaluate(() => go('feed')); await sleep(1200);
  const quadro = async id => { for (let k = 0; k < 30 && !(await p.$('#p-' + id)); k++) { await p.evaluate(() => scrollBy(0, 900)); await sleep(200) }
    await p.evaluate(id => { const el = document.getElementById('p-' + id); el.scrollIntoView({ block: 'start' }); scrollBy(0, -70) }, id); await sleep(500);
    return p.evaluate(id => { const c = document.querySelector('#p-' + id + ' .track>.sl:first-child>.cover'); const s = c && c.querySelector(':scope>svg'); if (!s) return null;
      const rc = c.getBoundingClientRect(), rs = s.getBoundingClientRect(), t = s.querySelector('text'), rt = t && t.getBoundingClientRect();
      return { ch: Math.round(rc.height), sh: Math.round(rs.height), cw: Math.round(rc.width), sw: Math.round(rs.width), top: Math.round(rs.top - rc.top), ft: s.hasAttribute('data-ft169'), tl: rt ? Math.round(rt.left - rc.left) : -1, tr: rt ? Math.round(rc.right - rt.right) : -1 } }, id) };
  for (const id of ['t-serieb', 't-tomate']) {
    const q = await quadro(id);
    ok(q && q.ft && Math.abs(q.sh - q.ch) <= 2 && Math.abs(q.sw - q.cw) <= 2 && q.top === 0, `${id}: a ilustração ocupa o quadro inteiro do Feed (${q && q.sh}/${q && q.ch} px)`, q);
    ok(q && q.tl > 8 && q.tr > 0, `${id}: etiqueta inteira dentro do quadro`, q);
    await U.foto(p, 'fotos-r2-' + id);
  }

  // 5. link de notícia de outra edição: foto bloqueada não aparece
  const pg = await p.evaluate(async () => { const o = {}; for (const id of ['velha-chuva', 'velha-salto', 'velha-cerrado']) { const r = await mt158Pagina(id); o[id] = r && r.img } return o });
  ok(pg['velha-chuva'] === '' && pg['velha-salto'] === '', 'notícia de outra edição: sem selo postal e sem queimada no incêndio da fábrica', pg);
  ok(/florestais/.test(pg['velha-cerrado'] || ''), 'queimada de verdade continua com a foto', pg);
  ok(!p._erros.length, 'sem erros no console', p._erros);
  await ctx.close();

  // 6. fotos de tela: iPhone 13 escuro e iPhone SE
  for (const [vp, esc, nm] of [[{ width: 390, height: 664 }, true, 'escuro'], [{ width: 375, height: 667 }, false, 'se']]) {
    ({ ctx, p } = await novo(vp, esc)); await p.evaluate(() => go('feed')); await sleep(1000);
    for (const id of ['t-tabela', 't-selecao']) { const q = await quadro(id); ok(q && Math.abs(q.sh - q.ch) <= 2, `${nm}: ${id} preenche o quadro`, q); await U.foto(p, `fotos-r2-${nm}-${id}`) }
    ok(!p._erros.length, `${nm}: sem erros no console`, p._erros); await ctx.close();
  }
  await br.close(); srv.kill(); try { fs.unlinkSync(path.join(SITE, 'fotos-arquivo.json')) } catch (e) {}
  for (const id of ['velha-chuva', 'velha-salto', 'velha-cerrado']) { try { fs.unlinkSync(path.join(SITE, 'm', id + '.html')) } catch (e) {} }
  const R = U.resumo(); console.log(`\nRESUMO t_fotos_r2: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('ERRO', e); try { srv && srv.kill() } catch (x) {} process.exit(1) });
