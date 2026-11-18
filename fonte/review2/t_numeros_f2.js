// Fase 2 · números (186, 18/11): as rodadas escrevem {dolar}, {dolar.var}, {dolar.dia}, {ibov}, {selic}, {ipca}… no lugar
// da cotação; o app põe o valor de indicadores.json (o mesmo do card da Capa) em título, subtítulo, pontos, texto, quadro
// de números, ilustração "dinheiro", linha fina e resumo; quando o indicadores.json muda, os números mudam juntos; sem
// indicador, a frase sai (nunca "{dolar}" na tela). A troca do app é a mesma do tools/validar.py. iPhone 13 e SE. Porta 9120.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const PORTA = 9120, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
const ind = (dolar, var_, data) => ({ atualizado: data + 'T18:30-03:00', dados_em: data + 'T18:07-03:00', itens: [
  { id: 'dolar', nome: 'Dólar', valor: dolar, variacao: var_, dir: 'sobe', data, fechamento: true, serie: [5.7, 5.79, 5.81], rotulos: ['2026-11-13', '2026-11-16', data], fonte: 'cotação comercial' },
  { id: 'ibovespa', nome: 'Ibovespa', valor: '171.000', variacao: '-0,85%', dir: 'desce', data, fechamento: true, serie: [170000, 172000, 171000], rotulos: ['2026-11-13', '2026-11-16', data], fonte: 'B3' },
  { id: 'selic', nome: 'Selic', valor: '13,75%', dir: 'desce', data: '2026-09-17', fonte: 'Copom/Banco Central' },
  { id: 'ipca12m', nome: 'IPCA 12m', valor: '4,63%', dir: 'sobe', ref: '2026-10', fonte: 'IBGE', data: '2026-11-12' }] });
const IND1 = ind('R$ 5,81', '+0,42%', '2026-11-17'), IND2 = ind('R$ 5,90', '+1,55%', '2026-11-18');
(async () => {
  const f = U.feedFresco('site');
  const raiz = path.join(__dirname, '..'), js = fs.readFileSync(path.join(raiz, 'app/src/js/186-numeros.js'), 'utf8');
  ok(!/\(\?<[=!]/.test(js), '186: sem lookbehind');
  // a pauta de maior prioridade (manchete da Capa) passa a citar os indicadores por marca
  const p0 = f.pautas.slice().sort((a, b) => (b.prioridade || 0) - (a.prioridade || 0))[0], PID = p0.id;
  p0.neutro.titulo = 'Dólar fecha a {dolar} ({dolar.var}) na {dolar.dia}';
  p0.subtitulo = 'Ibovespa termina a {ibov} pontos; Selic segue em {selic}';
  p0.neutro.texto = 'O dólar comercial terminou a {dolar.dia} a {dolar}, com variação de {dolar.var}. A inflação em 12 meses está em {ipca}, até {ipca.mes}. O desemprego ficou em {desemprego}.';
  p0.neutro.pontos = ['Dólar a {dolar}', 'Bolsa a {ibov} pontos', 'Juros em {selic}'];
  p0.visuais = [{ tipo: 'numeros', titulo: 'Mercado', itens: [{ valor: '{dolar}', rotulo: 'dólar na {dolar.dia}' }, { valor: '{ibov}', rotulo: 'Ibovespa (pontos)' }] }];
  p0.faq = [{ p: 'Quanto custa o dólar agora?', r: '{dolar}, no fechamento de {dolar.dia}.' }, { p: 'E a Selic?', r: 'Está em {selic}.' }];
  f.capa = Object.assign({}, f.capa || {}, { manchete: PID, linha_fina: 'Dólar a {dolar} e Ibovespa a {ibov} pontos' });
  delete f.indicadores;  // sem reserva no feed: o que vale é o indicadores.json
  fs.writeFileSync(path.join(raiz, 'site', 'feed.json'), JSON.stringify(f));
  U.servir('site', PORTA); await sleep(800);

  // a mesma troca no app e no tools/validar.py
  const casos = ['Dólar fecha a {dolar} ({dolar.var}) na {dolar.dia}', '{ibov} pontos; {ibovespa.var}', 'Selic {selic}, IPCA {ipca} até {ipca.mes}',
    'A bolsa fechou a {ibov} pontos. O desemprego ficou em {desemprego}.', 'Desemprego de {desemprego} em {desemprego.mes}', 'Só {desemprego}'];
  const py = JSON.parse(execFileSync('python3', ['-I', '-c', `import sys,json,importlib.util
s=importlib.util.spec_from_file_location("v",sys.argv[1]);V=importlib.util.module_from_spec(s);s.loader.exec_module(V)
ind={x["id"]:x for x in json.loads(sys.argv[2])["itens"]};M=V.mapa_marcas({},ind)
print(json.dumps([V.marca_texto(t,M) for t in json.loads(sys.argv[3])],ensure_ascii=False))`, path.join(raiz, '..', 'tools', 'validar.py'), JSON.stringify(IND1), JSON.stringify(casos)], { encoding: 'utf8' }));

  const b = await U.navegador();
  for (const dev of [{ nome: 'iPhone 13', w: 390, h: 844 }, { nome: 'iPhone SE', w: 375, h: 667 }]) {
    const se = dev.nome === 'iPhone SE', tag = se ? ' [SE]' : '';
    const ctx = await b.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    let IND = IND1;
    await ctx.route('**/indicadores.json*', rt => IND ? rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(IND) }) : rt.fulfill({ status: 404, body: '' }));
    await ctx.route('**/feed-leve.json*', rt => rt.fulfill({ status: 404, body: '' }));
    await ctx.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-tour-visto', '1') } catch (e) {} });
    const P = U.erros(await ctx.newPage(), 'P' + tag);
    await P.goto(BASE); await esperar(P, () => !!FEED && IND_AUTO && IND_AUTO.dados_em && document.querySelector('#v-capa .ui184'), null, 12000);
    await ev(P, () => { go('capa'); renderCapa() }); await sleep(400);

    if (!se) {
      const js_ = await ev(P, c => { const M = nm186Mapa({}); return c.map(t => nm186Texto(t, M)) }, casos);
      ok(JSON.stringify(js_) === JSON.stringify(py), 'o app e o validar.py trocam as marcas do mesmo jeito', { js: js_, py });
      ok(js_[0] === 'Dólar fecha a R$ 5,81 (+0,42%) na terça (17)' && js_[2] === 'Selic 13,75%, IPCA 4,63% até outubro', 'valor, variação, dia e mês', js_);
      ok(js_[3] === 'A bolsa fechou a 171.000 pontos.' && js_[5] === 'Só', 'indicador que falta tira a frase (ou a marca)', js_);
    }

    // 1. Capa: manchete, linha fina e card com o mesmo número; nenhuma marca na tela
    const capa = await ev(P, () => document.querySelector('#v-capa').innerText);
    ok(!/\{(dolar|ibov|selic|ipca|desemprego)/.test(capa), 'Capa sem marca na tela' + tag);
    ok(capa.includes((await ev(P, x => typeof dt185Rel === 'function' ? dt185Rel(x) : x, 'Dólar fecha a R$ 5,81 (+0,42%) na terça (17)'))), 'manchete com o dólar do indicadores.json' + tag, capa.slice(0, 300));
    ok(await ev(P, () => [...document.querySelectorAll('#v-capa .ui184 b')].some(e => e.textContent === 'R$ 5,81')), 'card da Capa com o mesmo valor' + tag);
    await U.foto(P, 'numeros-f2-capa' + (se ? '-se' : ''));

    // 2. Matéria: texto, pontos, quadro de números e Entenda
    await ev(P, id => abrirMateria(id), PID); await sleep(700);
    const mat = await ev(P, () => (document.querySelector('#layer') || document.body).innerText);
    ok(!/\{(dolar|ibov|selic|ipca|desemprego)/.test(mat), 'matéria sem marca na tela' + tag, mat.match(/.{0,40}\{[a-z.]+\}.{0,20}/));
    ok(mat.includes((await ev(P, x => typeof dt185Rel === 'function' ? dt185Rel(x) : x, 'terminou a terça (17) a R$ 5,81'))) && /4,63%, até outubro/.test(mat), 'texto da matéria com os valores' + tag);
    ok(await ev(P, id => { const p = pautaById(id); return p.visuais[0].itens[0].valor === 'R$ 5,81' && p.visuais[0].itens[0].rotulo === 'dólar na terça (17)' && p.faq[0].r === 'R$ 5,81, no fechamento de terça (17).' }, PID), 'quadro de números e Entenda se preenchem sozinhos' + tag);
    await U.foto(P, 'numeros-f2-materia' + (se ? '-se' : ''));
    await ev(P, () => { try { closeLayer() } catch (e) {} }); await sleep(300);

    if (se) { await ctx.close(); continue }
    // 3. o fechamento novo chega: todos os lugares mudam juntos (e a edição guardada leva o texto com marca)
    IND = IND2;
    await ev(P, () => { IND_T = 0; return carregarIndAuto() }); await sleep(500);
    const c2 = await ev(P, () => document.querySelector('#v-capa').innerText);
    ok(c2.includes((await ev(P, x => typeof dt185Rel === 'function' ? dt185Rel(x) : x, 'Dólar fecha a R$ 5,90 (+1,55%) na quarta (18)'))) && !c2.includes('5,81'), 'indicadores.json novo: a Capa troca o número sem edição nova', c2.slice(0, 300));
    ok(await ev(P, id => { const p = pautaById(id); return p.subtitulo.startsWith('Ibovespa termina a 171.000') && p.neutro.pontos[0] === 'Dólar a R$ 5,90' && FEED.capa.linha_fina === 'Dólar a R$ 5,90 e Ibovespa a 171.000 pontos' }, PID), 'pontos e linha fina trocam juntos');
    await ev(P, () => fl119Guardar(FEED));
    ok(await ev(P, id => { const g = JSON.parse(localStorage.getItem('radar-feed')); const p = g.pautas.find(x => x.id === id); return p.neutro._m186.titulo === 'Dólar fecha a {dolar} ({dolar.var}) na {dolar.dia}' && p.neutro.titulo.includes('R$ 5,90') }, PID), 'a edição guardada leva o texto com a marca (e o valor da hora)');

    // 4. abrir de novo com a edição guardada e o fechamento seguinte: número novo, sem marca
    IND = ind('R$ 5,70', '-3,39%', '2026-11-19');
    await P.reload(); await esperar(P, () => !!FEED && IND_AUTO && IND_AUTO.dados_em && IND_AUTO.dados_em.startsWith('2026-11-19'), null, 12000);
    await ev(P, () => { go('capa'); renderCapa() }); await sleep(400);
    const c3 = await ev(P, () => document.querySelector('#v-capa').innerText);
    ok(c3.includes('Dólar fecha a R$ 5,70 (-3,39%) na quinta (19)'), 'reabrir: a edição guardada mostra o fechamento novo', c3.slice(0, 200));

    // 5. Feed: o cartão também
    await ev(P, () => go('feed')); await sleep(800);
    const fd = await ev(P, () => document.querySelector('#posts').innerText);
    ok(!/\{(dolar|ibov|selic|ipca|desemprego)/.test(fd), 'Feed sem marca na tela');

    // 6. sem indicadores.json nem reserva: a frase sai, nada de "{dolar}"
    IND = null;
    await ev(P, () => { localStorage.removeItem('prumo-ind'); localStorage.removeItem('radar-feed') });
    const P2 = U.erros(await ctx.newPage(), 'P2'); await P.close();
    await P2.goto(BASE); await esperar(P2, () => !!FEED && FEED.pautas.length > 3, null, 12000);
    await ev(P2, () => { go('capa'); renderCapa() }); await sleep(400);
    const sem = await ev(P2, id => { const p = pautaById(id); return { t: p.neutro.titulo, x: p.neutro.texto, capa: document.querySelector('#v-capa').innerText } }, PID);
    ok(!/\{/.test(sem.t + sem.x + sem.capa), 'sem indicador: nenhuma marca na tela', sem);
    ok(!/d[óo]lar/i.test(sem.x) && /desemprego/i.test(sem.x) === false, 'sem indicador: as frases com marca saem do texto', sem.x);
    ok(P2._erros.length === 0, 'sem erro de JavaScript', P2._erros);
    await ctx.close();
  }
  await b.close();
  const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
