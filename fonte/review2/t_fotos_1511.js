// Fotos que combinam com a notícia (157, 15/11): retrato só de quem está no título; foto de assunto/tema só quando
// combina com o fato (nada de avião em Guarulhos para voo nos EUA, enchente para fundo de florestas, moedas de réis
// para a Bolsa, cartão-postal antigo do Rio para o STF, diretoria do Real Madrid para a Seleção, close de senador
// como "plenário"); sem repetir a foto de arquivo na edição; na dúvida, a ilustração da pauta. Créditos do Commons em
// português e sem "from <cidade>"; a prévia do link (m/<id>.html) sem crédito no resumo. Portas 8630–8631.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process'); const os = require('os');
const PORTA = 8630, BASE = `http://localhost:${PORTA}/index.html`, SITE = path.join(__dirname, '..', 'site');
const ARQ = path.join(U.REPO, 'fotos-arquivo.json');
const FACHIN = 'https://upload.wikimedia.org/wikipedia/commons/4/43/Edson_Fachin_%28cropped%29.jpg';
const PAUTAS = [
  ['t-master', 'politica', 'STF e Judiciário', 'PGR prepara as primeiras denúncias do caso Master', { subtitulo: 'Fachin recebe o pedido da PGR', prioridade: 99 }],
  ['t-colisao', 'mundo', 'EUA', 'Aviões colidem em Miami após caos aéreo nos EUA', { foto_arquivo: 'tema', prioridade: 98 }],
  ['t-voos', 'mundo', 'EUA', 'EUA retomam voos após 4 h de apagão; cancelamentos seguem', { prioridade: 97 }],
  ['t-apec', 'mundo', 'Ásia', 'Trump vai se reunir com Xi e Putin na China, na cúpula da Apec', { foto_arquivo: 'tema', prioridade: 96 }],
  ['t-bb', 'economia', 'Empresas', 'Lucro do BB cai 66,5% a R$ 1,27 bi; ação recua 8,35% e agro reage', { prioridade: 95 }],
  ['t-ibov', 'economia', 'Mercados', 'Ibovespa sobe 0,66% e dólar fecha a R$ 5,66, com alta de 2,63% na semana', { prioridade: 94 }],
  ['t-canada', 'brasil', 'Meio ambiente e clima', 'Canadá promete US$ 400 milhões a fundo de florestas', { foto_arquivo: 'tema', prioridade: 93 }],
  ['t-cop', 'mundo', 'Outros', 'Lula negocia parceria de defesa com Erdogan na COP31', { foto_arquivo: 'tema', tag: 'Clima', prioridade: 92 }],
  ['t-selecao', 'esportes', 'Seleção', 'Brasil perde do Japão por 3 a 2; Vini Jr. faz dois gols', { prioridade: 91 }],
  ['t-kassio', 'politica', 'STF e Judiciário', 'Kassio deve levar ao plenário a revisão da pena de Bolsonaro', { foto_arquivo: 'tema', tag: 'STF', prioridade: 90 }],
  ['t-nvidia', 'economia', 'Empresas', 'Huang deixa a Nvidia; ação cai mais de 10% no pré-mercado', { prioridade: 89 }],
  ['t-ms', 'economia', 'Empresas', 'Microsoft atribui pane a falha em mudança na rede', { subtitulo: 'Pane afetou até sistemas do STF, diz Fachin', prioridade: 88 }],
  ['t-enem', 'educacao', 'Enem e vestibulares', 'Enem: 2º dia vai das 13h30 às 18h30; portões fecham às 13h', { prioridade: 87 }],
  ['t-ajuste', 'politica', 'Congresso', 'Senado aprova ajuste fiscal por 45 a 31', { prioridade: 86 }],
  ['t-filipinas', 'politica', 'Planalto e governo', 'Lula faz visita de Estado às Filipinas e vai à cúpula da Asean', { prioridade: 85 }],
  ['t-propria', 'economia', 'Empresas', 'Microsoft explica a causa da pane', { prioridade: 84, foto: { url: FACHIN, credito: 'Foto de arquivo: Antonio Cruz/Agência Brasil/Wikimedia Commons (CC BY 3.0 br)', alt: 'Foto de arquivo: Edson Fachin' } }],
  ['t-propria2', 'politica', 'STF e Judiciário', 'Fachin marca o julgamento para dezembro', { prioridade: 83, foto: { url: FACHIN, credito: 'Foto de arquivo: Antonio Cruz/Agência Brasil/Wikimedia Commons (CC BY 3.0 br)', alt: 'Foto de arquivo: Edson Fachin' } }],
];
let srv = null;
(async () => {
  const f = U.feedFresco('site'); const ilu = f.pautas[0].imagem;
  const novas = PAUTAS.map(([id, secao, subtema, titulo, o]) => ({ id, secao, subtema, tema: titulo.slice(0, 30), tipo: 'cobertura', status: 'nova', hora: f.atualizado_em,
    neutro: { titulo, texto: titulo + '. Texto da notícia.', pontos: [titulo] }, imagem: ilu, ...o }));
  f.pautas = novas.concat(f.pautas.map(p => ({ ...p, prioridade: Math.min(50, p.prioridade || 0) })));
  if (f.capa) f.capa = { ...f.capa, manchete: 't-master', destaques: ['t-colisao', 't-ibov', 't-canada'] };
  fs.writeFileSync(path.join(SITE, 'feed.json'), JSON.stringify(f));
  fs.copyFileSync(ARQ, path.join(SITE, 'fotos-arquivo.json'));
  srv = U.servir('site', PORTA); await sleep(800); const br = await U.navegador();
  const novo = async (vp, escuro) => { const ctx = await br.newContext({ viewport: vp, hasTouch: true, deviceScaleFactor: 2, colorScheme: escuro ? 'dark' : 'light' });
    await ctx.route(/^https:\/\/upload\.wikimedia\.org\//, r => r.abort());
    await ctx.addInitScript(() => { localStorage.setItem('prumo-teste-capa', '1') });
    const p = U.erros(await ctx.newPage(), 'f' + vp.width); await p.goto(BASE);
    await esperar(p, () => window.FEED && window.FOTOS_ARQ && document.querySelector('#v-capa .cpi'), null, 15000); await sleep(900); return { ctx, p } };
  let { ctx, p } = await novo({ width: 390, height: 844 });

  // 1. o que o app escolhe para cada notícia
  const r = await p.evaluate(() => { const o = {}; FEED.pautas.filter(q => /^t-/.test(q.id)).forEach(q => { const f = fotoDe(q); o[q.id] = f ? { n: decodeURIComponent(f.url.split('/').pop()), alt: f.alt || '', cred: f.credito || '', curto: creditoCurto(f.credito) } : null }); return o });
  const nome = id => (r[id] && r[id].n) || '';
  const br1 = x => /(Guarulhos|S[aã]o_Paulo|Bras[ií]lia|Brasil|Brazil|Planalto|Congresso|Maracan)/i.test(x);
  ok(!/Fachin/i.test(nome('t-master')), 'PGR no caso Master: nada de retrato do Fachin (ele só está no subtítulo)', r['t-master']);
  ok(!/Supremo|STF/i.test(nome('t-master')), 'PGR no caso Master: sem STF no título, sem a fachada do STF (fica a ilustração "caso Master")', r['t-master']);
  ok(!br1(nome('t-colisao')) && !br1(nome('t-voos')), 'voos nos EUA: nenhum avião em Guarulhos nem lugar brasileiro', [r['t-colisao'], r['t-voos']]);
  ok(!/transmiss/i.test(nome('t-voos')), '"apagão" dos voos não vira foto de linha de transmissão', r['t-voos']);
  ok(!/Beijing|Tiananmen|European_Parliament/i.test(nome('t-apec')), 'Apec em Shenzhen: sem o centro de Pequim nem plenário de outro lugar', r['t-apec']);
  ok(!/caf[eé]|colheita/i.test(nome('t-bb')) && !/Paulista/i.test(nome('t-bb')), 'lucro do BB: nem colheita de café nem prédio da Paulista', r['t-bb']);
  ok(!/moeda|EVA|Alpina/i.test(nome('t-ibov')), 'Ibovespa: nada de moedas antigas de réis, astronauta ou carro "B3"', r['t-ibov']);
  ok(!/Enchente|alag/i.test(nome('t-canada')), 'fundo de florestas: sem rua alagada', r['t-canada']);
  ok(!/European_Parliament|Hemicycle|United_Nations/i.test(nome('t-cop')), 'COP31: sem Parlamento Europeu nem sede da ONU em Nova York', r['t-cop']);
  ok(!/Ofrenda|Shibuya|Tokyo|Maracan/i.test(nome('t-selecao')), 'Seleção x Japão: sem diretoria do Real Madrid, sem Tóquio, sem Maracanã', r['t-selecao']);
  ok(!/Avenida_Central|Centro_Cultural/i.test(nome('t-kassio')), 'revisão no STF: sem o cartão-postal antigo do Rio', r['t-kassio']);
  ok(!/Paulista/i.test(nome('t-nvidia')), 'Nvidia: sem fachada de prédio na Paulista', r['t-nvidia']);
  ok(!/Fachin|Supremo/i.test(nome('t-ms')), 'pane da Microsoft: sem Fachin nem STF (só estão no subtítulo)', r['t-ms']);
  ok(!/^Vestibular\.JPG$/i.test(nome('t-enem')), 'Enem: sem o mural de listas de vestibular', r['t-enem']);
  ok(!/Plen[aá]rio_do_Senado_\((15717805622|15687627386|15109327665)\)/.test(nome('t-ajuste')), 'ajuste no Senado: sem o close de um senador como "plenário"', r['t-ajuste']);
  ok(!/Planalto/i.test(nome('t-filipinas')), 'Lula nas Filipinas: sem a fachada do Planalto', r['t-filipinas']);
  ok(!/Fachin/i.test(nome('t-propria')), 'foto própria = retrato de quem não está no título: não aparece', r['t-propria']);
  ok(/Fachin/i.test(nome('t-propria2')), 'foto própria com a pessoa no título continua', r['t-propria2']);
  const usadas = await p.evaluate(() => { const v = FEED.pautas.map(q => fotoDe(q)).filter(Boolean).map(f => faNome(f.url)); return { n: v.length, u: new Set(v).size } });
  ok(usadas.n === usadas.u, `nenhuma foto de arquivo repetida na edição (${usadas.u}/${usadas.n})`, usadas);

  // 2. acervo limpo: créditos, bloqueadas, retratos de grupo
  const lim = await p.evaluate(() => { const T = []; const A = FOTOS_ARQ; ft157Prep();
    Object.values(A.pessoas).forEach(x => (x.fotos || []).forEach(f => T.push(['p', f]))); Object.values(A.assuntos).forEach(x => (x.fotos || []).forEach(f => T.push(['a', f]))); Object.values(A.temas).forEach(l => l.forEach(f => T.push(['t', f])));
    return { ingles: T.filter(([, f]) => / from |Template:|Unknown author|Taken by|\.mw-parser|@/.test(f.credito || '')).map(([, f]) => f.credito).slice(0, 3),
      bloq: T.filter(([, f]) => ft157Bloq(f)).length, grupo: T.filter(([k, f]) => k === 'p' && /wikimedia/.test(f.url) && ft157Grupo(f) === 2).map(([, f]) => faNome(f.url)).slice(0, 3),
      curto: creditoCurto('Foto de arquivo: Agência Senado from Brasilia, Brazil/Wikimedia Commons (CC BY 2.0)'),
      full: (document.createRange().createContextualFragment(credHTML('Foto de arquivo: Agência Senado from Brasilia, Bra…/Wikimedia Commons (CC BY 2.0)', 'x')).firstChild || {}).dataset?.credfull,
      todos: T.length } });
  ok(!lim.ingles.length, 'créditos do acervo sem "from <cidade>", "Template:", e-mail ou CSS', lim.ingles);
  ok(lim.bloq === 0 && !lim.grupo.length && lim.todos > 100, `acervo sem as fotos bloqueadas e sem foto de grupo como retrato (${lim.todos} fotos)`, lim);
  ok(lim.curto === 'Arquivo · Agência Senado' && lim.full === 'Foto de arquivo: Agência Senado/Wikimedia Commons (CC BY 2.0)', 'crédito: "Arquivo · Agência Senado" (sem "from Brasilia, Brazil")', lim);

  // 3. Capa e Feed: a manchete fica com a ilustração da pauta; cartões e "Quem é" sem foto errada
  const cap = await p.evaluate(() => { const el = document.querySelector('#v-capa .cpi') || document.querySelector('#v-capa'); const man = document.querySelector('#v-capa [data-capmat="t-master"], #v-capa #cpi-t-master') || el;
    const img = man && man.querySelector('.foto img'); return { temFoto: !!img, src: img ? img.getAttribute('src') : '', svg: !!(man && man.querySelector('svg')) } });
  ok(!cap.temFoto || !/Fachin|Supremo/i.test(cap.src), 'Capa: manchete do caso Master sem retrato do Fachin', cap);
  await U.foto(p, 'fotos1511-capa-390');
  const ss = await p.evaluate(() => { const q = FEED.pautas.find(x => x.id === 't-selecao'); const h = slidesSociais(q).join(''); return { ofrenda: /Ofrenda/i.test(decodeURIComponent(h)), quem: /Quem é/.test(h) } });
  ok(!ss.ofrenda, 'carrossel da Seleção sem a foto da diretoria do Real Madrid', ss);
  await p.evaluate(() => go('feed')); await sleep(1500); await U.foto(p, 'fotos1511-feed-390');
  ok(!p._erros.length, 'sem erros na página (390)', p._erros.slice(0, 3));
  await ctx.close();
  ({ ctx, p } = await novo({ width: 375, height: 667 }, true));
  await U.foto(p, 'fotos1511-capa-375-escuro'); await p.evaluate(() => go('feed')); await sleep(1500); await U.foto(p, 'fotos1511-feed-375-escuro');
  ok(!p._erros.length, 'sem erros na página (iPhone SE, escuro)', p._erros.slice(0, 3));

  // 4. prévia do link (paginas.py): mesma foto do app e resumo sem crédito
  const js = await p.evaluate(() => Object.fromEntries(Object.entries(faMapa()).map(([k, v]) => [k, v.url])));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ft157-'));
  const py = JSON.parse(cp.execFileSync('python3', ['-I', '-c', `import json,sys;sys.path.insert(0,'${U.REPO}/tools');import paginas as P;F=json.load(open('${SITE}/feed.json'));A=json.load(open('${ARQ}'));print(json.dumps({k:v['url'] for k,v in P.mapa_fotos(F['pautas'],A,F.get('pessoas') or {}).items()}))`]).toString());
  ok(JSON.stringify(Object.keys(js).sort().map(k => [k, js[k]])) === JSON.stringify(Object.keys(py).sort().map(k => [k, py[k]])), 'prévia do link (paginas.py) escolhe a mesma foto que o app');
  cp.execFileSync('python3', ['-I', U.REPO + '/tools/paginas.py', SITE + '/feed.json', tmp, ARQ]);
  const pg = fs.readFileSync(path.join(tmp, 't-ibov.html'), 'utf8'), pg2 = fs.readFileSync(path.join(tmp, 't-propria.html'), 'utf8');
  const desc = (/og:description" content="([^"]*)"/.exec(pg) || [])[1] || '';
  ok(desc && !/Foto de arquivo|Wikimedia|CC BY/.test(desc), 'prévia do WhatsApp: resumo sem o crédito técnico da foto', desc);
  ok(!/Fachin/.test(pg2), 'prévia: retrato de quem não está no título não vai para o WhatsApp', (/og:image" content="([^"]*)"/.exec(pg2) || [])[1]);
  fs.rmSync(tmp, { recursive: true, force: true });

  await br.close(); srv.kill(); try { fs.unlinkSync(path.join(SITE, 'fotos-arquivo.json')) } catch (e) {}
  const R = U.resumo(); console.log(`\nRESUMO t_fotos_1511: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.log('ERRO', e); try { srv && srv.kill() } catch (x) {} process.exit(1) });
