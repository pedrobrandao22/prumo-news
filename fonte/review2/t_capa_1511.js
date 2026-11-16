// Capa (159, 15/11 noite): saltos num pregão marcados no gráfico; Selic "mantida · Copom"; IPCA "vs set" e setas neutras;
// "Atualizada às"; chamada de evento já passado sai da Capa; "Para acompanhar" com o que mudou; "Ver a seção" já na lista
// e "Todas as editorias ✕"; sem bolinha do quiz; balança no cabeçalho no alto; letra grande com a foto em cima; sino da
// Atividade com número. Portas 8650 (site).
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8650/index.html';
const ev = (p, fn, a) => p.evaluate(fn, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8650); await sleep(800);
  const b = await U.navegador();
  const ctx = await b.newContext({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const P = U.erros(await ctx.newPage(), 'P');
  await P.goto(BASE); await esperar(P, () => !!FEED && typeof ca159Selic === 'function', null, 10000);
  await ev(P, () => { closeLayer && closeLayer(); go('capa') }); await sleep(700);

  // 1. edição: "Atualizada às 21h49", sem "Edição da manhã/noite"
  ok(await ev(P, () => /^Atualizada às \d{1,2}h\d{2} · /.test(capaEdicao()) && !/Edição da (manhã|noite)/.test(document.querySelector('#v-capa .cp-ed').textContent)), 'cabeçalho: "Atualizada às HhMM"', await ev(P, () => capaEdicao()));

  // 2. sem bolinha do quiz na aba Capa
  ok(await ev(P, () => { updatePlayBadge(); return $('#pbadge').hidden }), 'aba Capa sem a bolinha do quiz');

  // 3. Selic: mantida / mudou, pela última reunião do Copom
  const sel = await ev(P, () => { const hj = hojeSP(), C0 = CA159_COPOM; CA159_COPOM = [somaDias(hj, -60), somaDias(hj, -10)];
    const base = { id: 'selic', nome: 'Selic', valor: '13,75%', dir: 'desce', serie: [14.25, 14, 13.75, 13.75], rotulos: ['2026-08', '2026-09', '2026-10', '2026-11'] };
    const man = ca159Selic({ ...base, data: somaDias(hj, -59) }), mud = ca159Selic({ ...base, data: somaDias(hj, -9) });
    const t1 = indTile({ ...base, data: somaDias(hj, -59) }); CA159_COPOM = C0; return { man, mud, t1 } });
  ok(sel.man && sel.man.t === 'mantida' && sel.man.dir === 'estavel', 'Selic: reunião depois da mudança = mantida', JSON.stringify(sel.man));
  ok(sel.mud && sel.mud.dir === 'desce' && sel.mud.t === '−0,25', 'Selic: a última reunião mudou = ▼ −0,25', JSON.stringify(sel.mud));
  ok(/= mantida/.test(sel.t1) && /Copom, \d+ [a-z]{3}/.test(sel.t1) && /ca159-neu/.test(sel.t1) && !/▼/.test(sel.t1), 'cartão da Selic: "= mantida" e "Copom, dia mês", sem seta', sel.t1.replace(/<svg.*<\/svg>/, ''));
  ok(await ev(P, () => { const hj = hojeSP(); const x = ca159Selic({ id: 'selic', data: '2026-09-17', serie: [14, 13.75] }); return hj < '2026-11-05' || hj > '2026-12-09' || (x && x.t === 'mantida' && x.d === '2026-11-04') }), 'com o calendário real: em 15/11/2026 a Selic aparece mantida em 4/11');

  // 4. IPCA: o cartão diz com o que compara; o gráfico também; setas neutras
  const ip = await ev(P, () => indTile({ id: 'ipca12m', nome: 'IPCA 12m', valor: '4,63%', dir: 'sobe', data: '2026-11-12', serie: [4.68, 4.58, 4.63], rotulos: ['2025-10', '2026-09', '2026-10'] }));
  ok(/▲ \+0,05 <small>vs set<\/small>/.test(ip) && /ca159-neu/.test(ip), 'cartão do IPCA: "▲ +0,05 vs set" em cor neutra', ip.replace(/<svg.*<\/svg>/, ''));
  await ev(P, () => { IND_AUTO = { atualizado: new Date().toISOString(), itens: [
    { id: 'ibovespa', nome: 'Ibovespa', valor: '172.458', variacao: '+0,66%', dir: 'sobe', data: '2026-11-13', fonte: 'B3',
      serie: [192115, 206912, 206000, 205083, 176608, 175710, 172458], rotulos: ['2026-10-02', '2026-10-05', '2026-10-06', '2026-10-23', '2026-10-26', '2026-10-27', '2026-11-13'] },
    { id: 'dolar', nome: 'Dólar', valor: 'R$ 5,67', variacao: '+0,38%', dir: 'sobe', data: '2026-11-13', fonte: 'cotação comercial', fonte_serie: 'PTAX/Banco Central',
      serie: [5.04, 5.05, 5.04, 5.03, 5.04, 5.5, 5.65], rotulos: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-26', '2026-11-13'] },
    { id: 'ipca12m', nome: 'IPCA 12m', valor: '4,63%', dir: 'sobe', data: '2026-11-12', fonte: 'IBGE', serie: [4.68, 4.4, 4.5, 4.58, 4.63], rotulos: ['2025-10', '2026-07', '2026-08', '2026-09', '2026-10'] }] } });
  await ev(P, () => abrirGrafico('ipca12m')); await sleep(400);
  ok(await ev(P, () => { const h = document.querySelector('.gr .gr-hd em'); return !!h && /▲ \+0,05 ponto vs setembro/.test(h.textContent) && h.classList.contains('ca159-neu') }), 'gráfico do IPCA: "▲ +0,05 ponto vs setembro" no alto', await ev(P, () => (document.querySelector('.gr .gr-hd') || {}).textContent));
  ok(await ev(P, () => [...document.querySelectorAll('.gr .gr-per-t em')].every(e => e.classList.contains('ca159-neu') && getComputedStyle(e).color === getComputedStyle(document.querySelector('.gr .gr-v')).color || e.classList.contains('ca159-neu'))), 'gráfico do IPCA: variação de 12 meses em cor neutra');
  await U.foto(P, 'capa1511-ipca'); await ev(P, () => closeLayer()); await sleep(300);

  // 5. saltos num pregão: marca no gráfico e linha com o dia; o dólar diz que o gráfico é a PTAX
  await ev(P, () => abrirGrafico('ibovespa')); await sleep(400);
  const sx = await ev(P, () => ({ n: document.querySelectorAll('.gr-svg .ca159-sp').length, t: (document.querySelector('.ca159-salto') || {}).textContent || '' }));
  ok(sx.n === 2 && /\+7,7% em 5 out de 2026/.test(sx.t) && /−13,9% em 26 out de 2026 \(de 205\.083 para 176\.608\)/.test(sx.t), 'Ibovespa: os dois pregões fortes marcados, com o dia e os valores', JSON.stringify(sx));
  await U.foto(P, 'capa1511-ibovespa'); await ev(P, () => closeLayer()); await sleep(300);
  await ev(P, () => abrirGrafico('dolar')); await sleep(400);
  ok(await ev(P, () => /\+9,1% em 26 out/.test((document.querySelector('.ca159-salto') || {}).textContent || '') && /gráfico: PTAX\/Banco Central/.test(document.querySelector('.gr-fonte').textContent)), 'dólar: salto de 26/10 marcado e fonte do gráfico = PTAX', await ev(P, () => (document.querySelector('.ca159-salto') || {}).textContent + ' | ' + document.querySelector('.gr-fonte').textContent));
  ok(await ev(P, () => ca159Saltos('dolar', [{ v: 5 }, { v: 5.05 }, { v: 5.1 }]).length === 0), 'sem salto forte: nada marcado');
  await ev(P, () => closeLayer()); await sleep(300);

  // 6. chamada de evento que já passou (escrita antes dele) sai das seções da Capa
  const vz = await ev(P, () => { const ag = Date.now(), dia = n => new Date(ag + n * 864e5).toISOString(), dd = n => +new Date(ag + n * 864e5 - 3 * 3600e3).toISOString().slice(8, 10);
    const pa = (tit, esc) => ({ id: 'x', hora: esc, neutro: { titulo: tit }, titulos: [{ hora: esc, titulo: tit }] });
    return { vencida: ca159Passou(pa(`Série B fecha no sábado (${dd(-1)}), às 10h30, com 7 jogos`, dia(-2))),
      semHora: ca159Passou(pa(`Brasileirão volta no sábado (${dd(-2)}) com Flamengo líder`, dia(-3))),
      futura: ca159Passou(pa(`Atlético-MG e Boca decidem em ${dd(3)}/${new Date(ag + 3 * 864e5 - 3 * 3600e3).toISOString().slice(5, 7)}, às 20h`, dia(-1))),
      depois: ca159Passou(pa(`Vasco vence no sábado (${dd(-2)}) e se afasta do Z-4`, dia(-1))),
      semData: ca159Passou(pa('Brasil perde do Japão por 3 a 2', dia(-2))) } });
  ok(vz.vencida && vz.semHora && !vz.futura && !vz.depois && !vz.semData, 'evento passado escrito antes dele = vencida; futuro, escrito depois ou sem data = fica', JSON.stringify(vz));
  const cap = await ev(P, () => { const ag = Date.now(), dd = +new Date(ag - 864e5 - 3 * 3600e3).toISOString().slice(8, 10), esc = new Date(ag - 2 * 864e5).toISOString();
    const base = FEED.pautas.find(p => p.secao === 'esportes') || FEED.pautas[FEED.pautas.length - 1];
    const v = JSON.parse(JSON.stringify(base)); v.id = 'ca159-vencida'; v.hora = esc; v.atualizacoes = []; v.neutro.titulo = `Série B fecha no sábado (${dd}), às 10h30`; v.titulos = [{ hora: esc, titulo: v.neutro.titulo }];
    const f = JSON.parse(JSON.stringify(v)); f.id = 'ca159-fresca'; f.neutro.titulo = 'Brasileirão chega à reta final'; f.titulos = [{ hora: esc, titulo: f.neutro.titulo }];
    FEED.pautas.push(v, f); FEED.atualizado_em = new Date().toISOString(); renderCapa();
    const e = capaEscolha(), em = (l, id) => l.some(p => p.id === id), naTela = id => !!document.querySelector(`#v-capa .cp-sl #cpi-${id}, #v-capa .cp-dest #cpi-${id}`);
    const r = { vencida: em(e.ord, 'ca159-vencida') || em(e.dest, 'ca159-vencida') || naTela('ca159-vencida'), fresca: em(e.ord, 'ca159-fresca') };
    FEED.pautas = FEED.pautas.filter(p => !/^ca159-/.test(p.id)); FEED.atualizado_em = new Date(Date.now() - 1000).toISOString(); renderCapa(); return r });
  ok(!cap.vencida && cap.fresca, 'Capa: a chamada vencida sai; a da mesma editoria sem data fica', JSON.stringify(cap));

  // 7. "Para acompanhar": linha do que mudou
  const ac = await ev(P, () => { const h = [...document.querySelectorAll('#v-capa .cp-h h3')].find(x => x.textContent.trim() === 'Para acompanhar'); if (!h) return null;
    const bs = [...h.closest('.cp-h').nextElementSibling.querySelectorAll('button[data-cobpag]')]; return { n: bs.length, m: bs.filter(b => b.querySelector('.ca159-mud')).length, t: (bs[0] && bs[0].querySelector('.ca159-mud') || {}).textContent } });
  ok(ac === null || (ac.n > 0 && ac.m > 0 && ac.t.length > 10), '"Para acompanhar": cada cobertura com o que mudou por último', JSON.stringify(ac));

  // 8. balança no cabeçalho com a Capa no alto; ao rolar, volta a flutuar
  await ev(P, () => window.scrollTo(0, 0)); await sleep(300);
  const lp = await ev(P, () => { const b = document.getElementById('lp').getBoundingClientRect(), t = document.querySelector('#v-capa .cp-t'), r = t && t.getBoundingClientRect();
    return { topo: document.documentElement.classList.contains('ca159-lp-topo'), y: b.top, cobre: !!r && b.right > r.left && b.left < r.right && b.bottom > r.top && b.top < r.bottom } });
  ok(lp.topo && lp.y < 60 && !lp.cobre, 'Capa no alto: a balança fica no cabeçalho e não cobre o título da manchete', JSON.stringify(lp));
  await U.foto(P, 'capa1511-topo-se');
  await ev(P, () => window.scrollTo(0, 900)); await sleep(300);
  ok(await ev(P, () => !document.documentElement.classList.contains('ca159-lp-topo') && document.getElementById('lp').getBoundingClientRect().top > innerHeight / 2), 'ao rolar, a balança volta a flutuar embaixo');
  await ev(P, () => window.scrollTo(0, 0)); await sleep(200);

  // 9. letra grande: a foto pequena das listas sobe e o texto usa a largura toda
  const fz = await ev(P, () => { PREF.fonte = 1.4; aplicarFonte(); renderCapa(); const it = [...document.querySelectorAll('#v-capa .cpi:not(.cpi-man):not(.cpi-rel)')].find(e => e.querySelector('.cpi-b > .cp-th'));
    if (!it) return null; const th = it.querySelector('.cp-th').getBoundingClientRect(), tx = it.querySelector('.tx').getBoundingClientRect(); return { thw: th.width, txw: tx.width, cima: th.bottom <= tx.top + 1, larg: innerWidth } });
  ok(fz && fz.cima && fz.txw > fz.larg * 0.8, 'letra grande: a foto fica em cima e o texto ocupa a largura', JSON.stringify(fz));
  await ev(P, () => { const it = [...document.querySelectorAll('#v-capa .cpi-um')].find(e => e.querySelector('.cp-th')); if (it) it.scrollIntoView() }); await U.foto(P, 'capa1511-letra-grande');
  await ev(P, () => { PREF.fonte = 1; aplicarFonte(); renderCapa(); window.scrollTo(0, 0) }); await sleep(200);
  ok(await ev(P, () => { const it = [...document.querySelectorAll('#v-capa .cpi-um')].find(e => e.querySelector('.cpi-b > .cp-th')); return !it || getComputedStyle(it.querySelector('.cpi-b')).flexDirection === 'row' }), 'letra normal: foto continua ao lado');

  // 10. "Ver a seção": o Feed abre já na lista da editoria; "Todas as editorias ✕"
  await ev(P, () => { const b = document.querySelector('[data-capasec]'); b.scrollIntoView({ block: 'center' }); b.click() });
  ok(await esperar(P, () => VIEW === 'feed' && FILTRO !== 'tudo' && !!document.querySelector('#v-feed .sech') && document.querySelector('#v-feed .sech').getBoundingClientRect().top < 140, null, 4000), '"Ver a seção": Feed já na lista da editoria', await ev(P, () => [VIEW, FILTRO, scrollY, (document.querySelector('#v-feed .sech') || { getBoundingClientRect: () => ({}) }).getBoundingClientRect().top]));
  ok(await ev(P, () => document.querySelector('#v-feed .vertudo').textContent === 'Todas as editorias ✕'), 'o botão de tirar o filtro diz "Todas as editorias ✕"');
  await U.foto(P, 'capa1511-secao');
  ok(!P._erros.length, 'sem erros (visitante) ' + P._erros.join('|'));

  // 11. membro: sino da Atividade com o número de novidades
  const H = await require('../harness').criar();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
  await criar(A, { nome: 'Pedro', email: 'ca159@x.com' }); await ev(A, () => go('capa')); await sleep(700);
  ok(await ev(A, () => { const bs = [...document.querySelectorAll('.at-b')]; return bs.length > 0 && bs.every(b => b.querySelector('svg.ca159-sino')) }), 'Atividade: sino no lugar do losango (Capa e topo)');
  const nd = await ev(A, () => { const f = atNovas; atNovas = () => 3; atDot(); const d = document.querySelector('#v-capa .at-b .at-dot'), r = { hid: d.hidden, t: d.textContent, l: d.closest('.at-b').getAttribute('aria-label') }; atNovas = () => 0; atDot(); r.vazio = d.hidden; atNovas = f; return r });
  ok(!nd.hid && nd.t === '3' && /3 novidades/.test(nd.l) && nd.vazio, 'Atividade: bolinha com o número de novidades', JSON.stringify(nd));
  await U.foto(A, 'capa1511-sino');
  ok(!A._erros.length, 'sem erros (membro) ' + A._erros.join('|'));

  const R = U.resumo(); console.log(`\nRESUMO t_capa_1511: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
