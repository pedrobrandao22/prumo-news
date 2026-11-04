// Testes A (120-testes-a*.js): abertura e leitura em condições de produção, com a edição real do repositório dividida pelo
// tools/feed_leve.py. Confere: TA01 a casca antes do código já é a da Capa (e nos testes sem "abrir na Capa" fica a do Feed);
// TA02 matéria aberta antes do detalhe não volta ao topo quando ele chega; TA03 detalhe que não chega vira aviso com
// "Tentar de novo" (e completa); TA06 tempo de leitura só com o texto; TA04 linha do placar oficial no Feed aberto depois
// da Capa; TA05 robô do leve parado: o rodadas.json faz o app conferir o feed.json; TA07 texto do placar sem números.
// Serve uma cópia do site (pasta ta120t/, apagada no fim). Portas 8736–8737.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const DIR = path.join(__dirname, '..', 'ta120t'), BASE = 'http://localhost:8736/', BASE2 = 'http://localhost:8737/';
const ev = (p, fn, a) => p.evaluate(fn, a);
const spIso = ms => new Date(Date.now() + ms - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
function dividir() { return cp.execFileSync('python3', ['-I', path.join(U.REPO, 'tools', 'feed_leve.py'), path.join(DIR, 'feed.json')]).toString().trim() }
function rodadas(itens) { fs.writeFileSync(path.join(DIR, 'rodadas.json'), JSON.stringify({ dia: spIso(0).slice(0, 10), itens })) }
(async () => {
  fs.rmSync(DIR, { recursive: true, force: true }); fs.cpSync(path.join(__dirname, '..', 'site'), DIR, { recursive: true });
  let F; try { F = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')) } catch (e) { F = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'feed.json'), 'utf8')) }
  F.atualizado_em = spIso(-40 * 60000);
  fs.writeFileSync(path.join(DIR, 'feed.json'), JSON.stringify(F)); console.log('  ' + dividir());
  const r0 = spIso(-45 * 60000); rodadas({ [r0.slice(11, 13) + 'h' + r0.slice(14, 16)]: { tipo: 'rapida', status: 'ok', publicou: true } });
  // placar oficial nominal ligado à pauta mais longa (confiança "numero")
  const alvo = [...F.pautas].sort((a, c) => String(c.neutro?.texto || '').length - String(a.neutro?.texto || '').length)[0];
  const PV = F.pautas[0].id;  // a primeira do Feed
  const voto = (id, turno, sim, nao, quando, modo = 'nominal') => ({ id, tipo: 'votacao', pid: PV, confianca: 'numero', proposicoes: ['PEC 99/2026'], quando,
    placar: { forma: 'placar_votacao', casa: 'senado', proposicao: 'PEC 99/2026', turno, modo, sim, nao, abst: modo === 'nominal' ? 0 : null, minimo: 49, regra: '3/5 dos senadores (49 votos)', resultado: 'aprovado', quando, hora_exata: true, fonte: 'Senado Federal', url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/1' } });
  fs.writeFileSync(path.join(DIR, 'oficiais.json'), JSON.stringify({ gerado: spIso(0), versao: 1, eventos: [voto('v1', '1º', 70, 2, spIso(-3 * 3600e3)), voto('v2', '2º', 72, 1, spIso(-3600e3))] }));
  const srv = U.servir('ta120t', 8736); await sleep(900);
  const H = await require('../harness').criar(); const b = await U.navegador();
  async function abrir(o = {}) {
    const p = U.erros(await H.pagina(b), o.nome || 'P'); const ctx = p.context(); const reqs = [];
    p.on('request', r => { const u = r.url(); if (/feed(-leve)?\.json|feed-det\//.test(u)) reqs.push(u.replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, '')) });
    if (o.capa !== false) await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-teste-tour', '1'); localStorage.setItem('prumo-teste-semreels', '1') } catch (e) { } });
    let soltar = () => { }; if (o.prender) { const preso = new Promise(r => soltar = r); await ctx.route('**/feed-det/*.json', async r => { await preso; r.continue().catch(() => { }) }) }
    if (o.antes) await o.antes(p);
    await p.goto(o.url || BASE + 'index.html');
    return { p, ctx, reqs, soltar: () => soltar() };
  }
  const capaOk = p => esperar(p, () => typeof VIEW !== 'undefined' && VIEW === 'capa' && !!document.querySelector('#v-capa .cpi'), null, 10000);
  const completo = p => esperar(p, () => typeof FL119 !== 'undefined' && !FL119.parcial && FEED && FEED.pautas.some(x => x.neutro && x.neutro.texto), null, 10000);

  // TA01: a página antes do código (o index cortado logo antes do script grande)
  const corta = async (p) => p.context().route('**/index.html', async r => { const resp = await r.fetch(); let h = await resp.text(); const i = h.indexOf('<script>window.SBJS_URL'); h = h.slice(0, i) + '</body></html>'; r.fulfill({ response: resp, body: h }) });
  const T1 = await abrir({ nome: 'T1', antes: corta });
  await sleep(500);
  const c1 = await ev(T1.p, () => ({ capa: !document.querySelector('#v-capa').hidden && !!document.querySelector('#v-capa .cp-top .word') && !!document.querySelector('#v-capa .cp-sk'), feed: document.querySelector('#v-feed').hidden, top: document.querySelector('header.top').hidden, cur: document.querySelector('.nav [aria-current]')?.id, sem: typeof VIEW === 'undefined' }));
  ok(c1.sem && c1.capa && c1.feed && c1.top && c1.cur === 't-capa', 'TA01: antes do código, a casca já é a da Capa (esqueleto, aba Capa)', c1);
  await U.foto(T1.p, 'ta120-casca'); await T1.ctx.close();
  const T2 = await abrir({ nome: 'T2', capa: false, antes: corta }); await sleep(500);
  ok(await ev(T2.p, () => !document.querySelector('#v-feed').hidden && document.querySelector('#v-capa').hidden && document.querySelector('.nav [aria-current]')?.id === 't-feed'), 'TA01: nos testes que abrem no Feed, a casca continua a do Feed');
  await T2.ctx.close();
  const T3 = await abrir({ nome: 'T3' }); ok(await capaOk(T3.p) && await completo(T3.p), 'TA01: o app abre normalmente na Capa depois da casca');
  ok(await ev(T3.p, () => document.querySelector('.nav [aria-current]')?.id === 't-capa' && document.querySelector('#v-feed').hidden), 'TA01: aba Capa marcada, Feed escondido');
  ok(T3.p._erros.length === 0, 'sem erros (T3)', T3.p._erros); await T3.ctx.close();

  // TA02 + TA06: matéria aberta antes do detalhe
  const M = await abrir({ nome: 'M', prender: true });
  await capaOk(M.p); await ev(M.p, id => abrirMateria(id), alvo.id); await sleep(500);
  ok(await ev(M.p, () => { const s = [...document.querySelectorAll('#layer .mat-meta span')].find(x => /min de leitura/.test(x.textContent)); return !!s && getComputedStyle(s).visibility === 'hidden' }), 'TA06: tempo de leitura escondido antes do texto');
  await ev(M.p, () => { document.querySelector('#layer .mat').scrollTop = 420 }); await sleep(300);
  const y0 = await ev(M.p, () => document.querySelector('#layer .mat').scrollTop);
  M.soltar(); await completo(M.p); await sleep(700);
  const m2 = await ev(M.p, () => ({ y: document.querySelector('#layer .mat').scrollTop, txt: (document.querySelector('#layer .mat-p')?.textContent || '').trim().length, sk: !!document.querySelector('#layer .fl119-sk') }));
  ok(y0 > 300 && Math.abs(m2.y - y0) < 30 && m2.txt > 100 && !m2.sk, 'TA02: o detalhe chega e a matéria fica onde a pessoa estava', { y0, ...m2 });
  ok(await ev(M.p, () => { const s = [...document.querySelectorAll('#layer .mat-meta span')].find(x => /min de leitura/.test(x.textContent)); return !!s && getComputedStyle(s).visibility !== 'hidden' }), 'TA06: tempo de leitura aparece com o texto');
  ok(M.p._erros.length === 0, 'sem erros (M)', M.p._erros); await M.ctx.close();

  // TA03: o detalhe não chega (nem o feed.json)
  const X = await abrir({ nome: 'X', antes: async p => p.context().route(/feed-det\/|feed\.json/, r => r.abort()) });
  await capaOk(X.p); await ev(X.p, id => abrirMateria(id), alvo.id);
  ok(await esperar(X.p, () => !!document.querySelector('#layer .ta120-det [data-ta120det]') && !document.querySelector('#layer .fl119-sk'), null, 8000), 'TA03: sem detalhe, aviso de conexão com "Tentar de novo" (sem esqueleto eterno)');
  await U.foto(X.p, 'ta120-sem-detalhe');
  await X.ctx.unroute(/feed-det\/|feed\.json/);
  await ev(X.p, () => document.querySelector('#layer [data-ta120det]').click());
  ok(await completo(X.p) && await esperar(X.p, () => !document.querySelector('#layer .ta120-det') && (document.querySelector('#layer .mat-p')?.textContent || '').trim().length > 100, null, 8000), 'TA03: "Tentar de novo" completa a matéria');
  ok(X.p._erros.length === 0, 'sem erros (X)', X.p._erros); await X.ctx.close();

  // TA04: abre na Capa, o oficiais.json chega, depois o Feed: a linha do placar está lá
  const P = await abrir({ nome: 'P' });
  await capaOk(P.p); await completo(P.p); await esperar(P.p, () => typeof PO118 !== 'undefined' && PO118 && PO118.v.length === 2, null, 8000); await sleep(1500);
  await ev(P.p, () => go('feed')); await sleep(500);
  const ln = await ev(P.p, id => { const a = document.getElementById('p-' + id); return a ? (a.querySelector('.po118-ln') || {}).textContent || '' : 'sem-post' }, PV);
  ok(/Senado aprovou/.test(ln) && /72 a 1/.test(ln), 'TA04: Feed aberto depois da Capa mostra a linha do placar oficial', ln);
  // TA07: placar sem números
  await ev(P.p, () => go('capa'));
  fs.writeFileSync(path.join(DIR, 'oficiais.json'), JSON.stringify({ gerado: spIso(0), versao: 1, eventos: [voto('v3', '2º', null, null, spIso(-600000), 'sem_placar')] }));
  await ev(P.p, () => po118Carrega(true)); await sleep(800); await ev(P.p, id => abrirMateria(id), PV); await sleep(500);
  const t7 = await ev(P.p, () => document.querySelector('#layer .po118')?.innerText || '');
  ok(/registrou o resultado/.test(t7) && /dados abertos do Senado/.test(t7) && !/não divulgou/.test(t7), 'TA07: placar sem números não diz que "não divulgou os votos"', t7.slice(0, 200));
  ok(P.p._erros.length === 0, 'sem erros (P)', P.p._erros); await P.ctx.close();

  // TA05: robô do leve parado. Rodada nova publica o feed.json; o leve fica velho; o rodadas.json avisa
  const R = await abrir({ nome: 'R' });
  await capaOk(R.p); await completo(R.p); await sleep(1200);
  ok(await ev(R.p, () => !!FL119.v.get(FEED)), 'TA05: edição na tela veio do leve (versão conhecida)');
  R.reqs.length = 0; await ev(R.p, () => { CHK_T = 0; return checarFeed(false) }); await sleep(600);
  ok(!R.reqs.includes('feed.json'), 'TA05: sem rodada nova, nada de feed.json', R.reqs);
  const F2 = JSON.parse(JSON.stringify(F)); F2.atualizado_em = spIso(-60000); F2.pautas[0].neutro.titulo = 'Edição da rodada nova sem leve';
  fs.writeFileSync(path.join(DIR, 'feed.json'), JSON.stringify(F2));
  const r2 = spIso(-2 * 60000); rodadas({ [r0.slice(11, 13) + 'h' + r0.slice(14, 16)]: { publicou: true }, [r2.slice(11, 13) + 'h' + r2.slice(14, 16)]: { tipo: 'rapida', status: 'ok', publicou: true } });
  R.reqs.length = 0; await ev(R.p, () => { CHK_T = 0; return checarFeed(false) }); await sleep(600);
  ok(await ev(R.p, () => FEED.pautas[0].neutro.titulo !== 'Edição da rodada nova sem leve'), 'TA05: só pelo leve (velho), o app não vê a edição nova');
  await ev(R.p, () => carregarRodadas(true));
  ok(await esperar(R.p, () => FEED.pautas[0].neutro.titulo === 'Edição da rodada nova sem leve', null, 6000), 'TA05: o rodadas.json faz o app conferir o feed.json e a edição nova entra', R.reqs);
  ok(await ev(R.p, () => document.querySelector('#v-capa').innerText.includes('Edição da rodada nova sem leve')), 'TA05: a Capa mostra a edição nova');
  R.reqs.length = 0; await ev(R.p, () => carregarRodadas(true)); await sleep(800);
  ok(!R.reqs.includes('feed.json'), 'TA05: a mesma rodada não confere de novo', R.reqs);
  ok(R.p._erros.length === 0, 'sem erros (R)', R.p._erros); await R.ctx.close();

  await b.close(); srv.kill(); fs.rmSync(DIR, { recursive: true, force: true });
  const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
