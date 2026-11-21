// Fase 2 (18/11): foto só com confirmação forte (187-fotos-f2.js). Foto própria só com "mostra" que cita a pessoa ou o
// lugar do título; acervo só com retrato da 1ª pessoa da frase principal do título ou foto do lugar que o título e o nome
// do arquivo dizem, o órgão do sujeito (meio-termo de 18/11) ou o estádio do mandante; o resto fica com a ilustração. App e prévia do WhatsApp (tools/paginas.py) escolhem igual, inclusive
// no feed real. Portas 9130–9131.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const PORTA = 9130, BASE = `http://localhost:${PORTA}/index.html`, SITE = path.join(__dirname, '..', 'site');
const ARQ = path.join(U.REPO, 'fotos-arquivo.json');
const AB = 'https://imagens.ebc.com.br/teste/';
const PAUTAS = [
  ['t-senado', 'politica', 'Congresso', 'Senado aprova o ajuste fiscal por 45 a 31', { prioridade: 99 }],
  ['t-copom', 'economia', 'Juros e inflação', 'Copom mantém a Selic em 15% pela 4ª vez', { prioridade: 98 }],
  ['t-aluguel', 'economia', 'Seu dinheiro', 'Aluguel sobe 9,01% em 12 meses, quase o dobro do IPCA', { prioridade: 97 }],
  ['t-fies', 'educacao', 'Ensino superior', 'Fies: pré-selecionados validam inscrição até quarta', { prioridade: 96 }],
  ['t-ufs', 'brasil', 'Saúde', 'Fiocruz vê alta de casos graves de Covid em 5 estados', { prioridade: 95 }],
  ['t-taca', 'esportes', 'Sul-Americana', 'Atlético-MG e Boca decidem a Sul-Americana no sábado', { prioridade: 94 }],
  ['t-fachin', 'politica', 'STF e Judiciário', 'PGR pede arquivar inquérito; Fachin mira dezembro', { prioridade: 93 }],
  ['t-kassio', 'politica', 'STF e Judiciário', 'Kassio deve levar ao plenário a revisão da pena', { prioridade: 92.5 }],
  ['t-jogo', 'esportes', 'Brasileirão', 'Brasileirão: Cruzeiro x Palmeiras jogam na quarta', { prioridade: 92.4 }],
  ['t-final', 'esportes', 'Copa do Brasil', 'Cruzeiro x Flamengo decidem a final em Brasília', { prioridade: 92.3 }],
  ['t-sem', 'politica', 'Congresso', 'Câmara aprova PEC da segurança em 1º turno', { prioridade: 92, foto: { url: AB + 'sem.jpg', credito: 'Foto: Lula Marques/Agência Brasil', alt: 'Plenário da Câmara' } }],
  ['t-com', 'politica', 'Congresso', 'Câmara conclui a votação da PEC da segurança', { prioridade: 91, foto: { url: AB + 'com.jpg', credito: 'Foto: Lula Marques/Agência Brasil', alt: 'Plenário da Câmara', mostra: 'Deputados no plenário da Câmara durante a votação' } }],
  ['t-errada', 'economia', 'Mercados', 'Dólar sobe 2,17% e vai ao maior valor desde abril', { prioridade: 90, foto: { url: AB + 'err.jpg', credito: 'Foto: X/Agência Brasil', alt: 'Cédulas', mostra: 'Cédulas de real sobre a mesa' } }],
];
let srv = null;
const pyMapa = feed => JSON.parse(cp.execFileSync('python3', ['-I', '-c', `import json,sys;sys.path.insert(0,'${U.REPO}/tools');import paginas as P;F=json.load(open('${feed}'));A=json.load(open('${ARQ}'));
M=P.mapa_fotos(F['pautas'],A,F.get('pessoas') or {});AP=P.preparar(A);PF=F.get('pessoas') or {}
o={}
for p in F['pautas']:
  f=p.get('foto')
  o[p['id']]=M[p['id']]['url'] if p['id'] in M else (f['url'] if P.fa_valida(f) and not P.bloqueada(f) and P.propria_ok(p,f,AP,PF) else None)
print(json.dumps(o))`]).toString());
(async () => {
  const f = U.feedFresco('site'); const ilu = f.pautas[0].imagem;
  const novas = PAUTAS.map(([id, secao, subtema, titulo, o]) => ({ id, secao, subtema, tema: titulo.slice(0, 30), tipo: 'cobertura', status: 'nova', hora: f.atualizado_em,
    neutro: { titulo, texto: titulo + '. Texto da notícia.', pontos: [titulo] }, imagem: ilu, ...o }));
  f.pautas = novas.concat(f.pautas.map(p => ({ ...p, prioridade: Math.min(50, p.prioridade || 0) })));
  if (f.capa) f.capa = { ...f.capa, manchete: 't-senado', destaques: ['t-copom', 't-aluguel', 't-com'] };
  fs.writeFileSync(path.join(SITE, 'feed.json'), JSON.stringify(f));
  fs.copyFileSync(ARQ, path.join(SITE, 'fotos-arquivo.json'));
  srv = U.servir('site', PORTA); await sleep(800); const br = await U.navegador();
  const novo = async (vp, escuro) => { const ctx = await br.newContext({ viewport: vp, hasTouch: true, deviceScaleFactor: 2, colorScheme: escuro ? 'dark' : 'light' });
    await ctx.route(/^https:\/\/(upload\.wikimedia\.org|imagens\.ebc\.com\.br)\//, r => r.abort());
    await ctx.addInitScript(() => { localStorage.setItem('prumo-teste-capa', '1') });
    const p = U.erros(await ctx.newPage(), 'f' + vp.width); await p.goto(BASE);
    await esperar(p, () => window.FEED && window.FOTOS_ARQ && document.querySelector('#v-capa .cpi'), null, 15000); await sleep(900); return { ctx, p } };
  let { ctx, p } = await novo({ width: 390, height: 844 });

  // 1. o que o app escolhe
  const r = await p.evaluate(() => { const o = {}; FEED.pautas.filter(q => /^t-/.test(q.id)).forEach(q => { const f = fotoDe(q); o[q.id] = f ? decodeURIComponent(f.url.split('/').pop()) : null }); return o });
  ok(/Plen[aá]rio_do_Senado/.test(r['t-senado'] || ''), 'Senado no título: plenário do Senado (lugar dito pelo título e pelo nome do arquivo)', r['t-senado']);
  ok(/Banco_Central/.test(r['t-copom'] || ''), 'Copom no título: prédio do Banco Central', r['t-copom']);
  // 18/11 noite (Pedro: "se for errar, errar para mais"): assunto genérico também ganha foto do acervo, em vez da ilustração
  ok(!!(r['t-aluguel'] && r['t-fies'] && r['t-ufs']), 'assunto genérico (cédula, campus, posto de saúde): foto do acervo do assunto', [r['t-aluguel'], r['t-fies'], r['t-ufs']]);
  // corretor 21/11 (causa fotos-2): a taça de 2016 foi bloqueada e o tema da Sul-Americana só tem jogador e estádio de outros
  // jogos; na final, a taça ou a ilustração (nunca jogador de outro time)
  ok(!r['t-taca'] || /ta[cç]a|trof|troph/i.test(decodeURIComponent(r['t-taca'])), 'final da Sul-Americana: taça ou ilustração, nunca jogador/estádio de outro jogo', r['t-taca']);
  ok(!/Fachin/i.test(r['t-fachin'] || ''), 'Fachin só na 2ª frase do título: sem retrato dele (18/11 noite: a foto do tema vale)', r['t-fachin']);
  // meio-termo do Pedro (18/11): órgão do sujeito e estádio do mandante
  ok(/Supremo_Tribunal_Federal|Kassio/.test(r['t-kassio'] || ''), 'Kassio (ministro do STF) sujeito do título: retrato dele (quando o acervo tem) ou fachada do STF', r['t-kassio']);
  ok(/Mineir/.test(r['t-jogo'] || ''), 'jogo "Cruzeiro x Palmeiras": estádio do mandante (Mineirão)', r['t-jogo']);
  ok(!/Est[aá]dio|Arena|Maracan|Mineir/i.test(r['t-final'] || ''), 'final em campo neutro: sem estádio (a taça ou a ilustração valem)', r['t-final']);
  ok(r['t-sem'] === 'sem.jpg', 'foto própria sem "mostra": aparece (18/11 noite, errar para mais)', r['t-sem']);
  ok(r['t-com'] === 'com.jpg', 'foto própria com "mostra" que cita a Câmara: aparece', r['t-com']);
  ok(r['t-errada'] !== 'err.jpg', 'foto própria cujo "mostra" não cita nada do título: não aparece', r['t-errada']);
  const usadas = await p.evaluate(() => { const v = FEED.pautas.map(q => fotoDe(q)).filter(Boolean).map(f => faNome(f.url)); return { n: v.length, u: new Set(v).size } });
  ok(usadas.n === usadas.u, `nenhuma foto repetida na edição (${usadas.u}/${usadas.n})`, usadas);
  const cap = await p.evaluate(() => { const c = document.querySelector('#v-capa'); return { fotos: c.querySelectorAll('.foto img').length, svgs: c.querySelectorAll('svg').length } });
  ok(cap.svgs > 0, 'Capa: notícias sem foto mostram a ilustração', cap);
  await U.foto(p, 'fotos-f2-capa-390');
  await p.evaluate(() => go('feed')); await sleep(1500); await U.foto(p, 'fotos-f2-feed-390');
  ok(!p._erros.length, 'sem erros na página (iPhone 13)', p._erros.slice(0, 3));

  // 2. prévia do WhatsApp (paginas.py) igual ao app, no feed de teste
  const js = await p.evaluate(() => { const o = {}; FEED.pautas.forEach(q => { const f = fotoDe(q); o[q.id] = f ? f.url : null }); return o });
  const py = pyMapa(path.join(SITE, 'feed.json'));
  const dif = Object.keys(js).filter(k => (js[k] || null) !== (py[k] || null));
  ok(!dif.length, 'prévia do link (paginas.py) escolhe a mesma foto que o app (feed de teste)', dif.slice(0, 6).map(k => [k, (js[k] || '').split('/').pop(), (py[k] || '').split('/').pop()]));

  // 3. feed real do repositório (o publicado agora): app e prévia iguais
  const real = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  const jr = await p.evaluate(F => { FEED = F; FA_MAP = null; FA_MAPK = ''; const o = {}; F.pautas.forEach(q => { const f = fotoDe(q); o[q.id] = f ? f.url : null }); return o }, real);
  const pr = pyMapa(path.join(U.REPO, 'feed.json'));
  const dr = Object.keys(jr).filter(k => (jr[k] || null) !== (pr[k] || null));
  ok(!dr.length, `feed real: app e prévia escolhem igual (${Object.values(jr).filter(Boolean).length} de ${real.pautas.length} com foto)`, dr.slice(0, 3).map(k => [k, jr[k], pr[k]]));
  await ctx.close();

  // 4. iPhone SE, escuro
  ({ ctx, p } = await novo({ width: 375, height: 667 }, true));
  await U.foto(p, 'fotos-f2-capa-375-escuro'); await p.evaluate(() => go('feed')); await sleep(1500); await U.foto(p, 'fotos-f2-feed-375-escuro');
  ok(!p._erros.length, 'sem erros na página (iPhone SE, escuro)', p._erros.slice(0, 3));
  await ctx.close();

  await br.close(); srv.kill(); try { fs.unlinkSync(path.join(SITE, 'fotos-arquivo.json')) } catch (e) {}
  const R = U.resumo(); console.log(`\nRESUMO t_fotos_f2: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.log('ERRO', e); try { srv && srv.kill() } catch (x) {} process.exit(1) });
