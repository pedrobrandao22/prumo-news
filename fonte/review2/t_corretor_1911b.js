// Corretor 19/11 (2ª rodada): causa "fotos-2" — foto de arquivo de outro lugar ou de outra pessoa (187-fotos-f2.js e
// tools/paginas.py). Gera a CLASSE: (a) "Governo X" não dá retrato nem "Quem é"; (b) com lugar no título (Câmara, B3),
// foto de OUTRO lugar com nome (Senado, Banco Central) não entra; Câmara/Senado aceitam o Congresso; (c) empresa
// estrangeira/bolsa americana (Nasdaq, Wall Street) não usa lugar brasileiro (Paulista, Bovespa); (d) Esportes: foto de
// jogo de outros times só se o título cita um deles. E o carrossel: "R$ 350 milhões" não vira "R$ 350 mil" + "hões".
// App e prévia do WhatsApp escolhem igual. Porta 9145.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const PORTA = 9145, BASE = `http://localhost:${PORTA}/index.html`, SITE = path.join(__dirname, '..', 'site');
const ARQ = path.join(U.REPO, 'fotos-arquivo.json');
const PAUTAS = [
  // casos do testador (19/11) e os antigos da mesma classe
  ['c-mps', 'politica', 'Congresso', 'Câmara aprovou na terça (17) cinco MPs de crédito, somando R$ 14,7 bi', { subtitulo: 'Os créditos somam R$ 14,7 bi; o Senado ainda vota.', tag: 'Câmara', foto_arquivo: 'tema' }],
  ['c-goldman', 'economia', 'Mercados', 'Goldman rebaixa a Bolsa brasileira a neutro; Ibovespa cai 1,34% na quarta (18)', {}],
  ['c-anthropic', 'economia', 'Empresas', 'Anthropic estreia na Nasdaq na quinta (19) em IPO bilionário', { tag: 'IPO' }],
  ['c-wall', 'economia', 'Empresas', 'Ações da Apple caem em Wall Street após resultado', {}],
  ['c-voos', 'mundo', 'EUA', 'Governo Trump pediu US$ 30 bi ao Congresso após a pane aérea de sexta (13)', { tag: 'Aviação', foto_arquivo: 'tema', neutro_pontos: ['Trump pediu o dinheiro ao Congresso.'] }],
  ['c-gestao', 'politica', 'Planalto e governo', 'Gestão Lula anuncia corte de R$ 5 bi no Orçamento', {}],
  ['c-sula', 'esportes', 'Sul-Americana', 'Boca projeta invasão na final da Sul-Americana de sábado (21)', { tag: 'Sul-Americana', subtitulo: 'Jogo único em Barranquilla.' }],
  ['c-sena', 'politica', 'Congresso', 'Senado aprova o ajuste fiscal por 45 a 31', {}],
  ['c-lula', 'politica', 'Planalto e governo', 'Lula sanciona a lei do Pé-de-Meia', {}],
];
const nome = u => u ? decodeURIComponent(String(u).split('/').pop()).toLowerCase().replace(/_/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '') : '';
const pyMapa = feed => JSON.parse(cp.execFileSync('python3', ['-I', '-c', `import json,sys;sys.path.insert(0,'${U.REPO}/tools');import paginas as P;F=json.load(open('${feed}'));A=json.load(open('${ARQ}'));
M=P.mapa_fotos(F['pautas'],A,F.get('pessoas') or {});AP=P.preparar(A);PF=F.get('pessoas') or {}
o={}
for p in F['pautas']:
  f=p.get('foto')
  o[p['id']]=M[p['id']]['url'] if p['id'] in M else (f['url'] if P.fa_valida(f) and not P.bloqueada(f) and P.propria_ok(p,f,AP,PF) else None)
print(json.dumps(o))`]).toString());
let srv = null;
(async () => {
  const f = U.feedFresco('site'); const ilu = f.pautas[0].imagem;
  const novas = PAUTAS.map(([id, secao, subtema, titulo, o], i) => { const { neutro_pontos, ...r } = o; return { id, secao, subtema, tema: titulo.slice(0, 30), tipo: 'cobertura', status: 'nova', hora: f.atualizado_em,
    neutro: { titulo, texto: titulo + '. Texto da notícia.', pontos: neutro_pontos || [titulo] }, imagem: ilu, prioridade: 99 - i, ...r } });
  // a Bolsa já usada por outra notícia de prioridade maior (o caso do Goldman: o dólar levou a fachada da Bovespa)
  novas.unshift({ id: 'c-dolar', secao: 'economia', subtema: 'Mercados', tema: 'Dólar', tipo: 'cobertura', status: 'nova', hora: f.atualizado_em, prioridade: 100,
    neutro: { titulo: 'Bolsa sobe e dólar cai na quarta (18)', texto: 'x', pontos: ['x'] }, imagem: ilu });
  f.pautas = novas.concat(f.pautas.map(p => ({ ...p, prioridade: Math.min(50, p.prioridade || 0) })));
  fs.writeFileSync(path.join(SITE, 'feed.json'), JSON.stringify(f));
  fs.copyFileSync(ARQ, path.join(SITE, 'fotos-arquivo.json'));
  srv = U.servir('site', PORTA); await sleep(800); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route(/^https:\/\/(upload\.wikimedia\.org|imagens\.ebc\.com\.br)\//, r => r.abort());
  await ctx.addInitScript(() => { localStorage.setItem('prumo-teste-capa', '1') });
  const p = U.erros(await ctx.newPage(), 'c'); await p.goto(BASE);
  await esperar(p, () => window.FEED && window.FOTOS_ARQ && document.querySelector('#v-capa .cpi'), null, 15000); await sleep(900);

  const r = await p.evaluate(() => { const o = {}; FEED.pautas.filter(q => /^c-/.test(q.id)).forEach(q => { const f = fotoDe(q);
    const L = faListas(q, FOTOS_ARQ).flat().map(x => x.url); o[q.id] = { f: f ? f.url : null, todas: L } }); return o });
  const N = k => nome(r[k].f);
  // (b) outro lugar
  ok(!/senado/.test(N('c-mps')), 'MPs da Câmara: sem foto do plenário do Senado', N('c-mps'));
  ok(!r['c-mps'].todas.some(u => /senado/.test(nome(u))), 'MPs da Câmara: nenhuma candidata do Senado (nem no carrossel)', r['c-mps'].todas.map(nome).slice(0, 6));
  ok(!N('c-mps') || /camara|congresso/.test(N('c-mps')), 'MPs da Câmara: Câmara, Congresso por fora ou ilustração', N('c-mps'));
  ok(!/banco central/.test(N('c-goldman')), 'Goldman e a Bolsa (fachada da Bovespa já usada): sem o prédio do Banco Central', N('c-goldman'));
  ok(/senado/.test(N('c-sena')), 'Senado no título continua com o plenário do Senado', N('c-sena'));
  // (c) bolsa americana
  ok(!/paulista|bovespa|sao paulo/.test(N('c-anthropic')), 'Anthropic na Nasdaq: sem prédio da Paulista nem Bovespa', N('c-anthropic'));
  ok(!/paulista|bovespa|sao paulo/.test(N('c-wall')), 'Apple em Wall Street: sem lugar brasileiro', N('c-wall'));
  // (a) governo X
  ok(!/trump/.test(N('c-voos')), '"Governo Trump" na pane aérea: sem retrato de Trump', N('c-voos'));
  ok(!r['c-voos'].todas.some(u => /trump/.test(nome(u))), '"Governo Trump": retrato fora das candidatas', r['c-voos'].todas.map(nome).slice(0, 4));
  ok(!/lula/.test(N('c-gestao')), '"Gestão Lula": sem retrato de Lula', N('c-gestao'));
  const temLula = await p.evaluate(() => { const x = Object.values(FOTOS_ARQ.pessoas || {}).find(v => (v.chaves || []).includes('Lula')); return !!(x && (x.fotos || []).length) });
  if (temLula) ok(/lula/.test(N('c-lula')), 'Lula sujeito do título continua com o retrato dele', N('c-lula'));
  const quem = await p.evaluate(() => { const q = FEED.pautas.find(x => x.id === 'c-voos'); return slidesSociais(q).join('') });
  ok(!/Quem é/.test(quem), 'carrossel da pane aérea: sem "Quem é Donald Trump"', (quem.match(/Quem é[^<]*<\/span><b>[^<]*/) || [''])[0]);
  // (d) jogo de outros times
  ok(!r['c-sula'].todas.some(u => /pachuca/.test(nome(u))), 'final Atlético-MG x Boca: sem a foto do América x Pachuca (nem no carrossel)', r['c-sula'].todas.map(nome));
  const alheio = await p.evaluate(() => [ft187JogoAlheio({ url: 'https://upload.wikimedia.org/x/America-Pachuca_Copa_Sudamericana_-_panoramio.jpg' }, 'América e Pachuca jogam pela Copa'),
    ft187JogoAlheio({ url: 'https://upload.wikimedia.org/x/Taça_da_Copa_Sul-Americana_de_2016.jpg' }, 'Boca projeta invasão na final da Sul-Americana'),
    ft187JogoAlheio({ url: 'https://upload.wikimedia.org/x/Flamengo_vs_River_Libertadores.jpg' }, 'Palmeiras x Boca pela Libertadores')]);
  ok(alheio[0] === false && alheio[1] === false && alheio[2] === true, 'jogo alheio: vale com um dos times no título; taça não é jogo; Flamengo vs River fora do Palmeiras x Boca', alheio);

  // carrossel: número grande com milhões/bilhões
  const nums = await p.evaluate(() => ['R$ 350 milhões: a doação que a Noruega prevê', 'US$ 30 bilhões para o controle aéreo', 'US$ 2,7 bi em ações', 'R$ 14,7 bi em créditos', 'R$ 1 milhão de multa', 'R$ 3 trilhões de dívida', 'R$ 500 mil em fiança'].map(ssNumero));
  ok(JSON.stringify(nums) === JSON.stringify(['R$ 350 milhões', 'US$ 30 bilhões', 'US$ 2,7 bi', 'R$ 14,7 bi', 'R$ 1 milhão', 'R$ 3 trilhões', 'R$ 500 mil']), 'carrossel: número grande inteiro (milhões, bilhões, trilhões, bi, mil)', nums);

  // paridade com a prévia do WhatsApp
  const js = await p.evaluate(() => { const o = {}; FEED.pautas.forEach(q => { const f = fotoDe(q); o[q.id] = f ? f.url : null }); return o });
  const py = pyMapa(path.join(SITE, 'feed.json'));
  const dif = Object.keys(js).filter(k => (js[k] || null) !== (py[k] || null));
  ok(!dif.length, 'prévia do link (paginas.py) escolhe a mesma foto que o app (feed de teste)', dif.slice(0, 6).map(k => [k, nome(js[k]), nome(py[k])]));
  const real = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  const jr = await p.evaluate(F => { FEED = F; FA_MAP = null; FA_MAPK = ''; const o = {}; F.pautas.forEach(q => { const f = fotoDe(q); o[q.id] = f ? f.url : null }); return o }, real);
  const pr = pyMapa(path.join(U.REPO, 'feed.json'));
  const dr = Object.keys(jr).filter(k => (jr[k] || null) !== (pr[k] || null));
  ok(!dr.length, 'feed real: app e prévia escolhem igual', dr.slice(0, 3).map(k => [k, nome(jr[k]), nome(pr[k])]));
  ok(!p._erros.length, 'sem erros na página', p._erros.slice(0, 3));
  await ctx.close(); await br.close(); srv.kill(); try { fs.unlinkSync(path.join(SITE, 'fotos-arquivo.json')) } catch (e) {}
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1911b: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.log('ERRO', e); try { srv && srv.kill() } catch (x) {} process.exit(1) });
