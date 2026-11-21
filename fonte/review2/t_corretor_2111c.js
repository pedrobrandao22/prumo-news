// Corretor 21/11 (noite): achado "foto-bolsonaro-internado-com-foto-do-congresso-nacional" voltou com o STF. A trava
// de 21/11 tarde barrava lugar não dito só no PADRÃO da editoria; o TEMA do subtema ainda dava lugar com nome, e a
// internação de Bolsonaro marcada "STF e Judiciário" pegava a fachada do Supremo. Gera a CLASSE: notícia de saúde/
// internação (UTI, hospital, cirurgia) com qualquer subtema de Política não ganha foto de lugar que o título não diz;
// controles: título que diz o STF/Senado continua com a foto do lugar. App e paginas.py iguais. Porta 9164.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const PORTA = 9164, BASE = `http://localhost:${PORTA}/index.html`, SITE = path.join(__dirname, '..', 'site');
const ARQ = path.join(U.REPO, 'fotos-arquivo.json');
const PAUTAS = [
  ['d-uti', 'politica', 'STF e Judiciário', 'Bolsonaro está na UTI com abdômen agudo obstrutivo e sem previsão de alta', { tema: 'Saúde de Bolsonaro', tag: 'Bolsonaro', foto_arquivo: 'tema' }],
  ['d-cir', 'politica', 'STF e Judiciário', 'Médicos avaliam cirurgia e boletim fala em sonda gástrica', { tema: 'Saúde de Bolsonaro' }],
  ['d-hosp', 'politica', 'Planalto e governo', 'Hospital divulga novo boletim; alta ainda sem data', { tema: 'Saúde de Bolsonaro' }],
  ['d-cong', 'politica', 'Congresso', 'Governistas fecham acordo sobre a reforma administrativa', {}],
  // controles: o lugar dito continua
  ['d-stf', 'politica', 'STF e Judiciário', 'STF julga recurso sobre a revisão da pena', {}],
  ['d-senado', 'politica', 'Congresso', 'Senado aprova o ajuste fiscal por 45 a 31', {}],
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
  const novas = PAUTAS.map(([id, secao, subtema, titulo, o], i) => ({ id, secao, subtema, tema: titulo.slice(0, 30), tipo: 'cobertura', status: 'nova', hora: f.atualizado_em,
    neutro: { titulo, texto: titulo + '. Texto da notícia.', pontos: [titulo] }, imagem: ilu, prioridade: 99 - i, ...o }));
  f.pautas = novas.concat(f.pautas.map(p => ({ ...p, prioridade: Math.min(50, p.prioridade || 0) })));
  fs.writeFileSync(path.join(SITE, 'feed.json'), JSON.stringify(f));
  fs.copyFileSync(ARQ, path.join(SITE, 'fotos-arquivo.json'));
  srv = U.servir('site', PORTA); await sleep(800); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route(/^https:\/\/(upload\.wikimedia\.org|imagens\.ebc\.com\.br)\//, r => r.abort());
  await ctx.addInitScript(() => { localStorage.setItem('prumo-teste-capa', '1') });
  const p = U.erros(await ctx.newPage(), 'c'); await p.goto(BASE);
  await esperar(p, () => window.FEED && window.FOTOS_ARQ && document.querySelector('#v-capa .cpi'), null, 15000); await sleep(900);
  const r = await p.evaluate(() => { const o = {}; FEED.pautas.filter(q => /^d-/.test(q.id)).forEach(q => { const f = fotoDe(q);
    o[q.id] = { f: f ? f.url : null, todas: faListas(q, FOTOS_ARQ).flat().map(x => x.url) } }); return o });
  const N = k => nome(r[k].f), T = k => r[k].todas.map(nome);
  const LUG = /supremo|congresso|planalto|senado|camara|esplanada/;
  ok(!LUG.test(N('d-uti')), 'Bolsonaro na UTI (subtema STF): sem foto do Supremo nem de outro lugar', N('d-uti'));
  ok(!T('d-cir').some(x => LUG.test(x)), 'cirurgia, subtema STF, sem lugar no título: nenhuma candidata de lugar', T('d-cir').slice(0, 4));
  ok(!T('d-hosp').some(x => LUG.test(x)), 'boletim do hospital, subtema Planalto: sem o Planalto', T('d-hosp').slice(0, 4));
  ok(!T('d-cong').some(x => LUG.test(x)), 'tema do subtema não dá lugar que o título não diz (Congresso sem "Congresso" no título)', T('d-cong').slice(0, 4));
  ok(/supremo/.test(N('d-stf')), 'controle: STF no título continua com o Supremo', N('d-stf'));
  ok(/senado/.test(N('d-senado')), 'controle: Senado no título continua com o Senado', N('d-senado'));
  const tg = await p.evaluate(() => ['Bolsonaro está na UTI', 'Bolsonaro segue internado', 'internação de Bolsonaro', 'Hospital divulga boletim', 'cirurgia avaliada', 'Senado aprova ajuste'].map(t => FT187_TRAGICO.test(t)));
  ok(JSON.stringify(tg) === JSON.stringify([true, true, true, true, true, false]), 'internação, UTI, hospital e cirurgia contam como notícia trágica', tg);
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
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_2111c: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.log('ERRO', e); try { srv && srv.kill() } catch (x) {} process.exit(1) });
