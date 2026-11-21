// Corretor 21/11 (tarde): causa "fotos-2" voltou porque o último recurso (tema do subtema e padrão da editoria) e o
// assunto pelo tema/subtítulo traziam foto de um LUGAR, CIDADE ou JOGO que o título não diz. Gera a CLASSE (app e
// paginas.py, iguais): padrão da editoria não dá lugar com nome (Bolsonaro no hospital com o Congresso; COP31 com o
// Parlamento Europeu); tema não dá lugar de fora do Brasil (Tiananmen na trilateral de Shenzhen); vista de cidade só da
// cidade dita (Pequim em Shenzhen); Esportes no último recurso só com time/nome do título (jogador do Fluminense e
// estádio chileno na final Atlético-MG x Boca; taça vale). Dois clubes no título: só o mandante ("A visita o B"). Controles: Senado, PEC, Ibovespa, Fies → MEC.
// Porta 9163.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const PORTA = 9163, BASE = `http://localhost:${PORTA}/index.html`, SITE = path.join(__dirname, '..', 'site');
const ARQ = path.join(U.REPO, 'fotos-arquivo.json');
const PAUTAS = [
  ['d-bolso', 'politica', 'Outros', 'Carlos diz que Bolsonaro fez procedimento com sonda; cirurgia é avaliada', { tema: 'Saúde de Bolsonaro', tag: 'Bolsonaro', foto_arquivo: 'tema' }],
  ['d-bolso2', 'politica', 'Outros', 'Médicos avaliam nova cirurgia no ex-presidente', { tema: 'Saúde de Bolsonaro' }],
  ['d-cop', 'mundo', 'Clima', 'Negociadores fecham texto sobre florestas no último dia', { tema: 'COP31' }],
  ['d-shenzhen', 'mundo', 'Ásia', 'Trilateral em Shenzhen termina com declaração de paz e diálogo nuclear', { tema: 'Trump, Xi e Putin na China', tag: 'Diplomacia', foto_arquivo: 'tema' }],
  ['d-sula', 'esportes', 'Sul-Americana', 'Atlético-MG x Boca decidem a Sul-Americana às 20h de sábado (21)', { tema: 'Sul-Americana 2026', tag: 'Sul-Americana', subtitulo: 'Final em jogo único em Barranquilla.' }],
  ['d-sula2', 'esportes', 'Sul-Americana', 'Galo define o time para a final com o Boca', { tema: 'Sul-Americana 2026' }],
  ['d-visita', 'esportes', 'Brasileirão', 'Flamengo (79) visita o Palmeiras (73) hoje', { tema: 'Brasileirão 2026', tag: 'Brasileirão' }],
  ['d-dois', 'esportes', 'Brasileirão', 'Corinthians vence o Vasco e sobe na tabela', { tema: 'Brasileirão 2026' }],
  // controles: o lugar dito continua
  ['d-senado', 'politica', 'Congresso', 'Senado aprova o ajuste fiscal por 45 a 31', {}],
  ['d-pec', 'politica', 'Congresso', 'PEC da segurança avança na comissão', {}],
  ['d-ibov', 'economia', 'Mercados', 'Ibovespa sobe 1% com alta das commodities', {}],
  ['d-liberta', 'esportes', 'Libertadores', 'Palmeiras x Estudiantes decidem a Libertadores no sábado (28)', { tema: 'Libertadores 2026' }],
  ['d-fies', 'educacao', 'Políticas', 'Fies convoca a lista de espera de 25 a 30/11', {}],
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
  ok(!/congresso|planalto|senado|camara/.test(N('d-bolso')), 'Bolsonaro no hospital: sem foto do Congresso (padrão de Política)', N('d-bolso'));
  ok(!T('d-bolso2').some(x => /congresso|planalto/.test(x)), 'notícia de saúde sem lugar no título: nenhuma candidata de lugar', T('d-bolso2').slice(0, 4));
  ok(!T('d-cop').some(x => /european parliament|parlamento europeu|hemicycle/.test(x)), 'COP31: sem o Parlamento Europeu (padrão de Mundo)', T('d-cop').slice(0, 4));
  ok(!T('d-shenzhen').some(x => /beijing|pequim|tiananmen|european/.test(x)), 'trilateral em Shenzhen: sem Pequim, Tiananmen nem Parlamento Europeu', T('d-shenzhen').slice(0, 4));
  ok(!T('d-sula').some(x => /romero|estadio nacional|racing/.test(x)), 'final Atlético-MG x Boca: sem jogador ou estádio de outro jogo', T('d-sula'));
  ok(!T('d-sula2').some(x => /romero|estadio nacional|racing/.test(x)), 'Galo e Boca (sem "x"): idem', T('d-sula2'));
  ok(!T('d-visita').some(x => /maracana/.test(x)), 'Flamengo visita o Palmeiras: sem o Maracanã (estádio do visitante)', T('d-visita').slice(0, 3));
  ok(!N('d-visita') || /allianz/.test(N('d-visita')), 'Flamengo visita o Palmeiras: Allianz (mandante) ou ilustração', N('d-visita'));
  ok(!T('d-dois').some(x => /arena corinthians|neo quimica|sao januario|itaquera/.test(x)), 'dois clubes sem mandante: nenhum estádio de clube', T('d-dois').slice(0, 3));
  ok(/senado/.test(N('d-senado')), 'controle: Senado no título continua com o Senado', N('d-senado'));
  ok(/congresso/.test(N('d-pec')), 'controle: PEC continua com o Congresso', N('d-pec'));
  ok(/bovespa/.test(N('d-ibov')), 'controle: Ibovespa continua com a Bovespa', N('d-ibov'));
  ok(/taca|libertadores/.test(N('d-liberta')), 'controle: final da Libertadores continua com a taça', N('d-liberta'));
  ok(/ministerio da educacao|mec/.test(N('d-fies')), 'Fies: fachada do MEC (órgão do programa)', N('d-fies'));
  // as travas em funções (casos antigos da família)
  const tr = await p.evaluate(() => [
    ft187SkyAlheio({ url: 'https://x/Beijing_skyline_(cropped).jpg' }, 'Trilateral em Shenzhen termina'),
    ft187SkyAlheio({ url: 'https://x/Beijing_skyline_(cropped).jpg' }, 'Xi recebe Lula em Pequim; Beijing'),
    ft187SkyAlheio({ url: 'https://x/Bovespa,_São_Paulo_city_downtown.jpg' }, 'Dólar fecha em alta'),
    ft187EspAlheio({ url: 'https://x/Maracanã_Flamengo_torcida.jpg' }, 'Palmeiras recebe o Atlético'),
    ft187EspAlheio({ url: 'https://x/Maracanã_Flamengo_torcida.jpg' }, 'Flamengo vence no Maracanã'),
    ft187EspAlheio({ url: 'https://x/Taca-libertadores-2021.jpg' }, 'Final da Libertadores'),
    ft187LugarAlheio({ url: 'https://x/Congresso_Nacional_Brasília.jpg' }, new Set(), true),
    ft187LugarAlheio({ url: 'https://x/Congresso_Nacional_Brasília.jpg' }, new Set(), false),
    ft187LugarAlheio({ url: 'https://x/Tiananmen_Square_4.jpg' }, new Set(), false)]);
  ok(JSON.stringify(tr) === JSON.stringify([true, false, false, true, false, false, true, false, true]), 'travas: vista de cidade, jogo alheio e lugar no último recurso', tr);
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
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_2111b: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.log('ERRO', e); try { srv && srv.kill() } catch (x) {} process.exit(1) });
