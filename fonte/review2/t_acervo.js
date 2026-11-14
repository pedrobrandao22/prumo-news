// Acervo (110): fotos do acervo guardadas no site com crédito; escolha pessoa > assunto > tema; catálogo de gráficos
// (11 modelos novos + os antigos) na matéria, no Feed e nos stories, claro/escuro/foco; séries históricas (series/*.json).
// Capturas para QA em fonte/qa/acervo/ (390 px).
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const AQ = U.REPO + '/tools/fixtures/catalogo/', S0 = __dirname + '/../site/', QA = __dirname + '/../qa/acervo/'; fs.mkdirSync(QA, { recursive: true });
const PORTA = 8901, BASE = `http://localhost:${PORTA}/index.html`;
const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
const hj = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), mais = n => { const d = new Date(hj + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) };
function copiaPasta(de, para) { fs.mkdirSync(para, { recursive: true }); for (const n of fs.readdirSync(de)) { const a = path.join(de, n), b = path.join(para, n); if (fs.statSync(a).isDirectory()) copiaPasta(a, b); else fs.copyFileSync(a, b) } }
let srv = null;
(async () => {
  const f = JSON.parse(fs.readFileSync(AQ + 'feed-catalogo.json', 'utf8'));
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  const G = {}; f.pautas.forEach(p => (p.visuais || []).forEach(v => { if (v.tipo === 'grafico') { const k = v.forma + (v.casa ? '_' + v.casa : ''); G[k] = p.id; if (v.forma === 'contagem') { v.data = mais(12); v.itens = [{ data: mais(11), texto: 'Começa a reunião' }, { data: mais(12), texto: 'Decisão da Selic' }] } } }));
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  fs.copyFileSync(AQ + 'fotos-arquivo.json', S0 + 'fotos-arquivo.json'); copiaPasta(AQ + 'acervo', S0 + 'acervo'); copiaPasta(AQ + 'series', S0 + 'series');
  srv = U.servir('site', PORTA); await sleep(800); const br = await U.navegador();
  const remotos = [];
  const novo = async (o = {}) => { const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: o.escuro ? 'dark' : 'light' });
    await ctx.route(/^https:\/\/(upload\.wikimedia\.org|www\.camara\.leg\.br|www\.senado\.leg\.br)\//, r => { remotos.push(r.request().url()); return r.abort() });
    await ctx.addInitScript(o2 => { localStorage.setItem('prumo-teste-capa', '1'); if (o2.foco) localStorage.setItem('prumo-teste-foco', '1') }, o);
    const p = U.erros(await ctx.newPage(), o.nome || 'a'); await p.goto(BASE);
    await esperar(p, () => FEED && FOTOS_ARQ && document.querySelector('#v-capa .cpi'), null, 12000); await sleep(900); return { ctx, p } };
  let { ctx, p } = await novo();

  // ===== 1. fotos do acervo
  const fa = await p.evaluate(() => { const P = id => FEED.pautas.find(x => x.id === id); const r = {};
    for (const id of ['congresso-base-lula', 'reforma-eleitoral-distrital', 'copom-novembro-selic', 'flavio-mandato-senado']) { const x = fotoDe(P(id)); r[id] = x ? { url: x.url, src: fotoSrc(x.url), cred: x.credito, curto: creditoCurto(x.credito) } : null }
    return r });
  ok(fa['congresso-base-lula'] && /bandep\/204521/.test(fa['congresso-base-lula'].url) && /\/acervo\/p\/ze-trovao-/.test(fa['congresso-base-lula'].src), 'pessoa no título (deputado): retrato oficial da Câmara, servido do acervo do site', fa['congresso-base-lula']);
  ok(fa['congresso-base-lula'] && fa['congresso-base-lula'].curto === 'Arquivo · Câmara dos Deputados' && /uso livre com crédito/.test(fa['congresso-base-lula'].cred), 'crédito: "Arquivo · Câmara dos Deputados" (completo com a licença)', fa['congresso-base-lula']);
  ok(fa['reforma-eleitoral-distrital'] && /bandep\/204554/.test(fa['reforma-eleitoral-distrital'].url), 'sem pessoa no título: pessoa do subtítulo (Hugo Motta)', fa['reforma-eleitoral-distrital']);
  ok(fa['copom-novembro-selic'] && /Banco_Central/.test(fa['copom-novembro-selic'].url) && /\/acervo\/a\//.test(fa['copom-novembro-selic'].src), 'assunto no título (Copom → Banco Central), do acervo', fa['copom-novembro-selic']);
  ok(fa['flavio-mandato-senado'] && !/senado\.leg\.br/.test(fa['flavio-mandato-senado'].url) && /Congresso/.test(fa['flavio-mandato-senado'].url), '"foto_arquivo":"tema" continua trocando o retrato pela foto do assunto', fa['flavio-mandato-senado']);
  const py = JSON.parse(cp.execFileSync('python3', ['-c', `import json,sys;sys.path.insert(0,'${U.REPO}/tools');import paginas as P;F=json.load(open('${S0}feed.json'));A=json.load(open('${S0}fotos-arquivo.json'));print(json.dumps({k:v['url'] for k,v in P.mapa_fotos(F['pautas'],A).items()}))`]).toString());
  const js = await p.evaluate(() => Object.fromEntries(Object.entries(faMapa()).map(([k, v]) => [k, v.url])));
  ok(JSON.stringify(Object.keys(js).sort().map(k => [k, js[k]])) === JSON.stringify(Object.keys(py).sort().map(k => [k, py[k]])), 'prévia do link (paginas.py) escolhe a mesma foto que o app');
  await p.evaluate(() => { const el = document.querySelector('#cpi-congresso-base-lula') || [...document.querySelectorAll('#v-capa img')].find(i => /acervo/.test(i.src)); if (el) el.scrollIntoView({ block: 'center' }) }); await sleep(900);
  const im = await p.evaluate(() => [...document.querySelectorAll('#v-capa img')].filter(i => /\/acervo\//.test(i.getAttribute('src'))).map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, orig: i.getAttribute('data-orig') || '' })));
  ok(im.length >= 2 && im.filter(x => x.ok).length >= 1, 'Capa mostra fotos do acervo (arquivo local carregado)', im.slice(0, 4));
  ok(im.every(x => !x.orig || /\/thumb\/.*\/(960|330)px-|camara\.leg\.br|senado\.leg\.br/.test(x.orig)), 'reserva da foto local = miniatura da fonte (não o original pesado)', im.slice(0, 3));
  ok(!remotos.some(u => /bandep\/204521|Banco_Central_do_Brasil_sede/.test(u)), 'foto do acervo não vai buscar na fonte', remotos.slice(0, 4));
  await p.screenshot({ path: QA + 'capa-fotos-acervo.png' });

  // ===== 2. cada modelo de gráfico na matéria (e o renderizador antigo não quebra com os campos novos)
  const res = {};
  for (const [k, id] of Object.entries(G)) {
    await p.evaluate(i => abrirMateria(i), id);
    const pronto = await esperar(p, () => { const m = document.querySelector('#layer .mat .mat-vis'); return m && !m.querySelector('.acv-carrega') }, null, 6000);
    res[k] = await p.evaluate(() => { const m = document.querySelector('#layer .mat .mat-vis'); if (!m) return { vazio: 1 }; const h = m.innerHTML; const s = m.querySelector('svg');
      const r = m.getBoundingClientRect(); return { pronto: 1, acv: !!m.querySelector('.acv'), svg: !!s, aria: (m.querySelector('[role="img"],[aria-label]') || {}).getAttribute?.('aria-label') || '', ruim: /NaN|undefined|Infinity|\[object/.test(h), larg: r.width, sobra: m.scrollWidth - m.clientWidth, fonte: /Fonte:/.test(m.textContent) } });
    res[k].pronto = pronto;
    if (['placar_votacao_camara', 'mapa_uf', 'faixa_meta', 'pesquisa'].includes(k)) { await p.evaluate(() => document.querySelector('#layer .mat-vis').scrollIntoView({ block: 'center' })); await sleep(250); await (await p.$('#layer .mat-vis')).screenshot({ path: QA + 'materia-' + k + '.png' }) }
    await p.evaluate(() => closeLayer()); await sleep(250) }
  const formas = ['linha', 'area', 'faixa_meta', 'barras_empilhadas', 'rosca', 'placar_votacao_camara', 'placar_votacao_senado', 'placar_votacao_stf', 'mapa_uf', 'antes_depois', 'ranking', 'pesquisa', 'contagem'];
  for (const k of formas) { const r = res[k] || {}; ok(r.pronto && r.acv && !r.ruim && r.larg > 300 && r.sobra <= 1 && r.fonte && r.aria.length > 10, `matéria: gráfico "${k}" desenhado, com fonte e rótulo acessível, sem estourar a largura`, r) }
  for (const k of ['barras', 'colunas']) ok(res[k] && res[k].pronto && !res[k].acv && !res[k].ruim, `modelo antigo "${k}" continua com o desenho de antes`, res[k]);
  const chk = await p.evaluate(G => { const V = id => FEED.pautas.find(x => x.id === id).visuais.find(v => v.tipo === 'grafico'); const d = document.createElement('div'); const r = {};
    d.innerHTML = visualHTML(V(G.placar_votacao_camara)); r.cam = d.querySelectorAll('circle').length; r.sim = d.querySelectorAll('circle.acv-v-sim').length; r.nao = d.querySelectorAll('circle.acv-v-nao').length; r.aus = d.querySelectorAll('circle.acv-v-aus').length; r.min = !!d.querySelector('.acv-min'); r.res = d.querySelector('.acv-res')?.textContent;
    d.innerHTML = visualHTML(V(G.placar_votacao_senado)); r.sen = d.querySelectorAll('circle').length;
    d.innerHTML = visualHTML(V(G.placar_votacao_stf)); r.stf = d.querySelectorAll('circle').length;
    d.innerHTML = visualHTML(V(G.mapa_uf)); r.ufs = d.querySelectorAll('.acv-uf').length; r.ufSem = d.querySelectorAll('.acv-uf.sem').length;
    d.innerHTML = visualHTML(V(G.pesquisa)); r.emp = /Empate técnico entre Candidato A e Candidato B/.test(d.textContent); r.barras = d.querySelectorAll('.acv-pq s').length;
    d.innerHTML = visualHTML(V(G.contagem)); r.dias = d.querySelector('.acv-ct-n')?.textContent; r.alvo = d.querySelectorAll('.acv-cal span.alvo').length;
    d.innerHTML = visualHTML(V(G.ranking)); r.rk = [...d.querySelectorAll('.acv-rk-r')].map(x => x.textContent).join(',');
    d.innerHTML = visualHTML(V(G.antes_depois)); r.ad = d.querySelector('.acv-ad-s em')?.textContent;
    d.innerHTML = visualHTML(V(G.rosca)); r.ro = d.querySelectorAll('circle').length; r.roPct = [...d.querySelectorAll('.acv-leg b')].map(x => x.textContent).join(',');
    d.innerHTML = visualHTML(V(G.faixa_meta)); r.faixa = !!d.querySelector('.acv-faixa') && !!d.querySelector('.acv-meta'); r.fora = d.querySelectorAll('.acv-fora').length;
    d.innerHTML = visualHTML(V(G.linha)); r.linhaRot = [...d.querySelectorAll('.gr-xl')].map(x => x.textContent).join(',');
    // apps antigos: o desenho antigo recebe os campos novos sem erro
    r.antigo = Object.values(G).map(id => { try { return typeof _acvGraficoNoticia(V(id)) } catch (e) { return 'ERRO ' + e.message } });
    return r }, G);
  ok(chk.cam === 513 && chk.sim === 352 && chk.nao === 134 && chk.aus === 25 && chk.min && chk.res === 'Aprovado', 'placar da Câmara: 513 cadeiras, 352 sim, 134 não, ausentes, linha do mínimo e "Aprovado"', chk);
  ok(chk.sen === 81 && chk.stf === 11, 'placar do Senado (81) e do STF (11)', chk);
  ok(chk.ufs === 27 && chk.ufSem === 0, 'mapa: 27 estados', chk);
  ok(chk.emp && chk.barras === 4, 'pesquisa: barras de margem de erro e aviso de empate técnico', chk);
  ok(chk.dias === '12' && chk.alvo === 1, 'contagem: faltam 12 dias, dia marcado no calendário', chk);
  ok(chk.rk.startsWith('PL,PT,União'), 'ranking ordenado', chk.rk);
  ok(chk.ad === '−1,25 p.p.', 'antes e depois: diferença em pontos percentuais', chk.ad);
  ok(chk.ro === 5 && /40,1%/.test(chk.roPct), 'rosca: 5 fatias com %', chk);
  ok(chk.faixa && chk.fora > 0, 'faixa da meta: banda, centro e pontos fora da meta destacados', chk);
  ok(/\/\d{2}/.test(chk.linhaRot), 'linha da série: datas no eixo (mês/ano)', chk.linhaRot);
  ok(chk.antigo.every(x => x === 'string'), 'desenho antigo (apps desatualizados) não quebra com os modelos novos', chk.antigo);

  // ===== 3. série: arquivo que falta não deixa gráfico quebrado; série carregada fica guardada no aparelho
  const ser = await p.evaluate(async () => { const v = { tipo: 'grafico', forma: 'linha', titulo: 'Série que não existe', serie: 'naoexiste' }; const a = visualHTML(v); await new Promise(r => setTimeout(r, 900)); const b = visualHTML({ ...v, __tentou: 1 });
    return { a: /acv-carrega/.test(a), b, guardada: Object.keys(JSON.parse(localStorage.getItem('prumo-series') || '{}')) } });
  ok(ser.a && ser.b === '' && ser.guardada.includes('selic') && ser.guardada.includes('ipca12m'), 'série inexistente: some sem erro; selic e IPCA ficam guardadas para abrir sem internet', ser);

  // ===== 4. Feed (carrossel) e story com gráfico novo
  const st = await p.evaluate(G => { const P = id => FEED.pautas.find(x => x.id === id); const r = {};
    r.de = igVisDe(P(G.contagem))?.forma; r.html = /acv-ct-n/.test(igVisHTML(igVisDe(P(G.contagem))));
    r.slides = slidesSociais(P(G.placar_votacao_camara)).some(s => /acv-pl/.test(s)); return r }, G);
  ok(st.de === 'contagem' && st.html && st.slides, 'story e carrossel do Feed também desenham os modelos novos', st);

  // ===== 5. página de catálogo (QA): todos os modelos, claro, escuro e foco
  const catalogo = async (pg, nome) => { await pg.evaluate(() => { const vs = FEED.pautas.flatMap(p => (p.visuais || []).filter(v => v.tipo === 'grafico').map(v => ({ ...v, secao: p.secao })));
      const c = document.createElement('div'); c.id = 'qa-cat'; c.setAttribute('style', 'position:absolute;inset:0 0 auto 0;z-index:99999;background:var(--bg);padding:12px 16px');
      c.innerHTML = vs.map(v => `<div class="mat-vis" style="background:var(--card);border-radius:12px;padding:14px;margin:0 0 12px">${visualHTML(v)}</div>`).join(''); document.body.appendChild(c); window.scrollTo(0, 0) });
    await sleep(700); const h = await pg.evaluate(() => { const c = document.getElementById('qa-cat'); return { h: c.scrollHeight, sobra: [...c.querySelectorAll('.mat-vis')].filter(m => m.scrollWidth > m.clientWidth + 1).length, n: c.querySelectorAll('.mat-vis').length, vazio: [...c.querySelectorAll('.mat-vis')].filter(m => !m.textContent.trim()).length } });
    await (await pg.$('#qa-cat')).screenshot({ path: QA + nome + '.png' }); return h };
  const cl = await catalogo(p, 'catalogo-claro');
  ok(cl.n === 15 && !cl.sobra && !cl.vazio, 'catálogo (claro, 390 px): 15 gráficos, nenhum vazio ou mais largo que a tela', cl);
  const errosA = p._erros.filter(e => !/ERR_|404|net::|Failed to load/.test(e)); ok(!errosA.length, 'sem erros na página (claro) ' + errosA.join(' | '));
  await ctx.close();
  ({ ctx, p } = await novo({ escuro: true, nome: 'esc' }));
  const esc = await catalogo(p, 'catalogo-escuro');
  const cor = await p.evaluate(() => { const g = getComputedStyle(document.documentElement); const c = document.querySelector('#qa-cat circle.acv-v-sim'); return { bg: g.getPropertyValue('--bg').trim(), sim: c ? getComputedStyle(c).fill : '' } });
  ok(esc.n === 15 && !esc.sobra && cor.bg && cor.bg !== '#f3f4f6' && /121, 196, 149/.test(cor.sim), 'catálogo no tema escuro: cores do tema escuro', { esc, cor });
  ok(!p._erros.filter(e => !/ERR_|404|net::|Failed to load/.test(e)).length, 'sem erros (escuro) ' + p._erros.join(' | '));
  await ctx.close();
  ({ ctx, p } = await novo({ foco: true, nome: 'foco' }));
  const fo = await p.evaluate(() => document.documentElement.classList.contains('foco'));
  const fc = await catalogo(p, 'catalogo-foco');
  ok(fo && fc.n === 15 && !fc.sobra, 'catálogo com html.foco (estado de produção)', { fo, fc });
  ok(!p._erros.filter(e => !/ERR_|404|net::|Failed to load/.test(e)).length, 'sem erros (foco) ' + p._erros.join(' | '));
  await ctx.close();

  // ===== 6. feed sem nada novo (sem fotos-arquivo novo, sem séries): app igual ao de antes
  for (const x of ['fotos-arquivo.json']) try { fs.unlinkSync(S0 + x) } catch (e) { }
  fs.rmSync(S0 + 'series', { recursive: true, force: true });
  const f2 = JSON.parse(fs.readFileSync(U.REPO + '/feed.json', 'utf8')); f2.atualizado_em = iso(Date.now() - 5 * 60e3); fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f2));
  ({ ctx, p } = await (async () => { const c = await br.newContext({ viewport: { width: 390, height: 844 } }); await c.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1')); const q = U.erros(await c.newPage(), 'velho'); await q.goto(BASE);
    await esperar(q, () => FEED && document.querySelector('#v-capa .cpi'), null, 12000); await sleep(800); return { ctx: c, p: q } })());
  // pauta só com gráficos antigos (placar, linha, antes/depois… já são do acervo)
  const sem = await p.evaluate(() => { const id = FEED.pautas.find(x => (x.visuais || []).some(v => v.tipo === 'grafico') && (x.visuais || []).every(v => v.tipo !== 'grafico' || !ACV_FORMAS.includes(v.forma)))?.id; if (id) abrirMateria(id); return { id, g: !!document.querySelector('#layer .mat-vis .gn'), acv: !!document.querySelector('#layer .acv') } });
  ok((!sem.id || sem.g) && !sem.acv && !p._erros.filter(e => !/ERR_|404|net::|Failed to load/.test(e)).length, 'feed publicado sem campos novos: tudo como antes, sem erros', sem);
  await ctx.close();

  fs.rmSync(S0 + 'acervo', { recursive: true, force: true });
  const r = U.resumo(); console.log(`\nRESUMO t_acervo: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); if (srv) srv.kill(); process.exit(1) });
