process.env.PRUMO_FORMATOS_TODOS = '1';  // testa os formatos escondidos em 17/11 (FT182_ESCONDE), religados só no teste
// Etapa 41: carrossel social no Feed
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8')); f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  const ps = f.pautas.find(p => Array.isArray(p.social)) || f.pautas[0]; ps.social = ['R$ 44.008,52: é o subsídio bruto do senador.', 'Cada falta gera desconto.', 'Alcolumbre não respondeu.'];
  // 26/11: carrossel sob medida. ps vira uma notícia GRANDE (prioridade alta, contexto, 3 atualizações); pc, uma CURTA
  ps.neutro.pontos = ['O subsídio bruto do senador é de R$ 44.008,52.', 'Cada falta sem justificativa gera desconto no contracheque.', 'Alcolumbre não respondeu até a publicação.'];
  ps.prioridade = 95; ps.tipo = 'cobertura'; ps.proximo = 'A Mesa do Senado decide na próxima semana se publica as faltas de cada senador.';
  ps.contexto = 'O Senado paga o subsídio integral a quem registra presença em plenário. A regra do desconto existe desde 2011, mas a lista de faltas nunca foi publicada. Em 2025, três senadores tiveram desconto.';
  ps.atualizacoes = [1, 2, 3].map(i => ({ hora: new Date(Date.now() - i * 3600e3).toISOString(), texto: 'Atualização de teste número ' + i + ' sobre o desconto das faltas.' }));
  const pc = f.pautas.find(p => p.id !== ps.id && p.secao !== ps.secao) || f.pautas[1]; pc.prioridade = 10; pc.tipo = 'pontual'; pc.contexto = ''; pc.atualizacoes = []; pc.visuais = []; pc.faq = []; delete pc.direita; delete pc.esquerda;
  pc.neutro.texto = 'Texto curto de teste.'; pc.neutro.pontos = ['Primeiro ponto da notícia curta.', 'Segundo ponto da notícia curta.', 'Terceiro ponto da notícia curta.'];
  if (f.capa) { f.capa.manchete = ps.id; f.capa.destaques = (f.capa.destaques || []).filter(x => x !== pc.id && x !== ps.id) }
  const pe = f.pautas.find(p => p.enquete && p.id !== ps.id);
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f)); fs.copyFileSync(require('../t_util').REPO + '/fotos-arquivo.json', S0 + 'fotos-arquivo.json');
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8841); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8841/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ, null, 10000); await sleep(500);
  await p.evaluate(() => go('feed')); await sleep(800); await p.evaluate(() => { LOTE.pos = LOTE.lista.length; renderPosts(true); document.querySelectorAll('.post .track').forEach(t => fitTrack(t)) }); await sleep(600);
  const quadros = id => p.evaluate(id => { const t = document.querySelector('#p-' + id + ' .track'); if (!t) return null; const sl = [...t.children].filter(e => !e.classList.contains('pag')); const pts = t.querySelector('.ss-pts');
    return { peso: ssPeso(pautaById(id)), n: sl.length, capa: sl[0].querySelector('.cover') ? 1 : 0, fim: sl[sl.length - 1].classList.contains('ss-fim'), pontos: pts ? pts.querySelectorAll('.ss-ul li').length : 0, num: pts && pts.querySelector('.ss-nn') ? pts.querySelector('.ss-nn').textContent : '',
      ctx: !!t.querySelector('.ss-ctx'), atu: t.querySelectorAll('.ss-atu li').length, fecho: (t.querySelector('.ss-fim .ss-ft') || {}).textContent || '', fechoVis: !!t.querySelector('.ss-fim .ss-ft') && getComputedStyle(t.querySelector('.ss-fim .ss-ft')).display !== 'none', k: [...t.querySelectorAll('.ss-k')].map(e => e.textContent) } }, id);
  const r = await quadros(ps.id);
  ok(r && r.capa && r.fim && r.n <= 10, 'carrossel: começa na foto, termina em "Ler a matéria", no máximo 10 páginas ' + JSON.stringify(r));
  ok(r.pontos === 3 && r.num === 'R$ 44.008,52', 'o essencial: os 3 pontos num quadro só, com o número em destaque ' + JSON.stringify(r));
  ok(r.peso === 'grande' && r.ctx && r.atu === 3, 'notícia grande ganha Contexto e O que mudou ' + JSON.stringify(r));
  ok(/Mesa do Senado/.test(r.fecho) && r.fechoVis, 'o fecho traz o "E agora?" junto do botão ' + JSON.stringify(r.fecho));
  const rc = await quadros(pc.id);
  if (rc) ok(rc.peso === 'curta' && rc.n <= 4 && !rc.ctx && !rc.atu && rc.pontos === 3, 'notícia curta: foto, o essencial e fecho (sem contexto) ' + JSON.stringify(rc));
  else ok(await p.evaluate(id => { const x = pautaById(id); return ssPeso(x) === 'curta' && slidesSociais(x).length <= 4 }, pc.id), 'notícia curta (na prateleira): até 4 quadros');
  const tudo = await p.evaluate(() => ({ emais: [...document.querySelectorAll('#posts .ss-k')].filter(e => /^E mais$/i.test(e.textContent)).length, quem: [...document.querySelectorAll('#posts .ss-foto .ss-k')].filter(e => /Quem é/.test(e.textContent)).length, solta: [...document.querySelectorAll('#posts .ss-pts')].filter(e => e.querySelectorAll('li').length < 2).length }));
  ok(tudo.emais === 0 && tudo.quem === 0 && tudo.solta === 0, 'nenhum quadro "E mais", nenhum quadro "Quem é" e nenhum quadro de uma frase só ' + JSON.stringify(tudo));
  ok(await p.evaluate(() => creditoCurto('Foto ilustrativa: Fulano de Tal/Wikimedia Commons (CC BY 4.0)') === 'Foto ilustrativa · Fulano de Tal' && creditoCurto('Foto de arquivo: Maria Souza/Wikimedia Commons (CC0)') === 'Arquivo · Maria Souza'), 'crédito da foto do catálogo por assunto diz "Foto ilustrativa"');
  ok(await p.evaluate(() => { const u = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Teste_do_banco.jpg', u2 = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Teste_do_banco_2.jpg', ant = FT213_ESC;
    try { FT213_ESC = { feed: FEED.atualizado_em, mapa: { a: { url: u, local: 'acervo/c/teste-1.webp' }, b: { url: u2, local: 'acervo/../segredo.webp' }, c: null } }; return /\/acervo\/c\/teste-1\.webp$/.test(fotoSrc(u)) && /upload\.wikimedia\.org/.test(fotoSrc(u2)) } finally { FT213_ESC = ant } }), 'foto do banco por assunto abre a cópia guardada no site (e caminho estranho não entra)');
  // 27/11: post só de texto com assunto claro ganha foto ilustrativa no fundo; texto pessoal, curto, story ou com a foto tirada pelo autor, não
  await p.route('**/m/acervo-posts.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ v: 1, verbetes: [
    { id: 'stf-ext', k: 1, p: ['\\bstf\\b', 'supremo', 'moraes'], f: [{ l: 'acervo/c/stf-1.webp', c: 'Fulano de Tal/Wikimedia Commons (CC BY 4.0)' }] },
    { id: 'dolar', k: 0, p: ['dolar', 'cambio', 'moeda americana'], f: [{ l: '../segredo.webp', c: 'x' }, { l: 'acervo/c/dolar-1.webp', c: 'Maria Souza/Wikimedia Commons (CC0)' }] }] }) }));
  const ilu = await p.evaluate(async () => { IP27 = null; IP27_T = 0; ip27Carrega(); for (let i = 0; i < 50 && !IP27; i++) await new Promise(r => setTimeout(r, 100));
    const mk = (id, texto, extra) => Object.assign({ id, autor: 'outro', tipo: 'post', texto, at: Date.now(), fotos: [], estilo: {} }, extra || {}); const o = {};
    o.stf = ppBase(mk('a1', 'O STF vai julgar isso de novo na semana que vem, vocês viram?'));
    o.dolar1 = ppBase(mk('a2', 'O dólar subiu demais esse mês, que coisa impressionante'));
    o.dolar2 = ppBase(mk('a3', 'O dólar subiu e o câmbio ficou maluco esse mês inteiro'));
    o.pessoal = ppBase(mk('a4', 'Meu pai está internado, torçam por ele, por favor gente'));
    o.curto = ppBase(mk('a5', 'STF de novo'));
    o.tirada = ppBase(mk('a6', 'O STF vai julgar isso de novo na semana que vem, vocês viram?', { estilo: { semIlu: true } }));
    o.story = ppBase(mk('a7', 'O STF vai julgar isso de novo na semana que vem, vocês viram?', { tipo: 'story' }));
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ilu: /data-ilu="1"/.test(v), stf: /acervo\/c\/stf-1\.webp/.test(v), dol: /acervo\/c\/dolar-1\.webp/.test(v), cred: (/class="up-ilc">([^<]*)</.exec(v) || [])[1] || '', seg: /segredo/.test(v), tx: /class="sl up-sl up-tx"/.test(v) }])) });
  ok(ilu.stf.ilu && ilu.stf.stf && /^Foto ilustrativa/.test(ilu.stf.cred) && ilu.stf.tx, 'post de texto que fala do STF ganha a foto do STF no fundo, com o crédito "Foto ilustrativa"', ilu.stf);
  ok(!ilu.dolar1.ilu && ilu.dolar2.ilu && ilu.dolar2.dol && !ilu.dolar2.seg, 'tema genérico pede 2 palavras do assunto; caminho estranho de foto não entra', [ilu.dolar1, ilu.dolar2]);
  ok(!ilu.pessoal.ilu && !ilu.curto.ilu && !ilu.tirada.ilu && !ilu.story.ilu, 'texto pessoal, texto curto, story e post com a foto tirada pelo autor ficam só com a cor', ilu);
  // a enquete de uma notícia da lista principal (as da prateleira da fase 2 aparecem como miniatura)
  // 25/11: enquete saiu das rodadas (manual: "sem quiz e sem enquete"); só confere quando a edição tem uma
  if (await p.evaluate(() => (FEED.pautas || []).some(x => x.enquete))) ok(await p.evaluate(() => [...document.querySelectorAll('#posts .post .track')].some(t => !!t.querySelector('.ss-enq [data-poll] .poll'))), 'enquete dentro do carrossel');
  else ok(true, '(sem enquete na edição de hoje)');
  ok(await p.evaluate(() => [...document.querySelectorAll('#posts .post .track > .sl')].every(s => s.scrollHeight <= s.clientHeight + 2)), 'nenhuma página transborda');
  await p.evaluate(id => document.querySelector('#p-' + id + ' .ss-cta').click(), ps.id); await sleep(600);
  ok(await p.evaluate(id => MAT_PID === id, ps.id), '"Ler a matéria completa" abre a matéria');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa41: ${R.OKS} ok, ${R.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'fotos-arquivo.json') } catch (e) { } process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
