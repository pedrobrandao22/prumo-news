// Etapa 28: fotos sem repetir, crédito curto, versão nova na 1ª abertura, desde a última visita, correções visíveis, resumo com título, agenda da semana
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const cp = require('child_process');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  const pc = f.pautas[2]; pc.correcoes = [{ hora: iso(Math.max(Date.now() - 2 * 3600e3, Date.parse(new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10) + 'T00:01:00-03:00'))),  /* ainda hoje, mesmo logo depois da meia-noite */ texto: 'O valor certo é R$ 44 mil, e não R$ 46 mil.' }];
  f.resumo_dia.titulo = 'A semana em 5 fatos';
  const hj = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); const mais = n => { const d = new Date(hj + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) };
  f.agenda = (f.agenda || []).filter(a => false);  /* a edição real pode ter mais de 8 itens hoje e amanhã e esconder o de teste no fim de semana */
  f.agenda.push({ data: mais(4), hora: '10h', texto: 'Evento de teste da semana que vem', secao: 'politica' });
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  fs.copyFileSync(require('../t_util').REPO + '/fotos-arquivo.json', S0 + 'fotos-arquivo.json');
  // conhecidas: todas menos 2 (novas); 2 com data antiga (atualizadas)
  const novas = [f.pautas[5].id, f.pautas[6].id], atual = [f.pautas[0].id, f.pautas[1].id];
  const conh = {}; f.pautas.forEach(p => { if (novas.includes(p.id)) return; conh[p.id] = atual.includes(p.id) ? '2026-10-20T10:00:00-03:00' : '2099-01-01T00:00:00-03:00' });
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8828); await sleep(700); const br = await U.navegador(); const D = __dirname + '/etapa28/'; fs.mkdirSync(D, { recursive: true });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(c => { localStorage.setItem('prumo-teste-capa', '1'); if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('radar-prefs', JSON.stringify({ conhecidas: c, visitaAtual: '2026-10-30T22:10:00-03:00' })) } }, conh);
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8828/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ, null, 10000); await sleep(1200);
  await p.evaluate(() => renderCapa()); await sleep(300);

  // fotos sem repetir
  const r1 = await p.evaluate(() => { const M = faMapa(); const nomes = FEED.pautas.map(x => fotoDe(x)).filter(Boolean).map(x => faNome(x.url)); const top = [...FEED.pautas].sort((a, b) => (b.prioridade || 0) - (a.prioridade || 0)).slice(0, 15).map(x => faNome(fotoDe(x).url));
    return { tot: nomes.length, uni: new Set(nomes).size, top: top.length, topU: new Set(top).size, M } });
  ok(r1.topU === r1.top, `as 15 notícias principais têm fotos diferentes (${r1.topU}/${r1.top}); na edição: ${r1.uni} fotos distintas em ${r1.tot}`);
  const py = JSON.parse(cp.execFileSync('python3', ['-c', `import json,sys;sys.path.insert(0,'${require('../t_util').REPO}/tools');import paginas as P;F=json.load(open('${S0}feed.json'));A=json.load(open('${S0}fotos-arquivo.json'));print(json.dumps({k:v['url'] for k,v in P.mapa_fotos(F['pautas'],A).items()}))`]).toString());
  const js = Object.fromEntries(Object.entries(r1.M).map(([k, v]) => [k, v.url]));
  ok(JSON.stringify(Object.keys(js).sort().map(k => [k, js[k]])) === JSON.stringify(Object.keys(py).sort().map(k => [k, py[k]])), 'prévia do link (WhatsApp) usa a mesma foto que o app');
  ok(await p.evaluate(() => { const q = { ...FEED.pautas.find(x => !x.foto && /Flávio/.test(x.neutro.titulo)) }; if (!q.id) return 'sem'; const a = fotoArquivo(q); q.foto_arquivo = 'tema'; q.neutro = { ...q.neutro, titulo: q.neutro.titulo + ' ' }; const b = fotoArquivo(q); return a && b && !/Bolsonaro/i.test(b.alt + b.url) }), 'foto_arquivo:"tema" troca o retrato da pessoa por foto do assunto');

  // crédito curto
  const cr = await p.evaluate(() => [...document.querySelectorAll('#v-capa [data-credfull]')].map(e => e.textContent));
  ok(cr.length && cr.every(t => /^(Arquivo · |Foto: )/.test(t) && t.length <= 44 && !/Commons|CC BY/.test(t)), 'crédito curto na foto: ' + cr.slice(0, 3).join(' | '));
  const tg = await p.evaluate(() => { const el = document.querySelector('#v-capa [data-credfull]'); const _o = renderCapa; window.__rs = ''; renderCapa = function () { window.__rs += new Error().stack.split('\n').slice(1, 7).join(' / ') + ' || '; return _o.apply(this, arguments) }; el.click(); renderCapa = _o; const c1 = el.isConnected; const a = el.textContent; const lay = !!document.querySelector('#layer').innerHTML; el.click(); return { rs: window.__rs, c1, a, b: el.textContent, lay } });
  ok(/Commons|Agência|\(/.test(tg.a) && tg.b.length < tg.a.length && !tg.lay, 'um toque no crédito mostra o completo (sem abrir a notícia) ' + JSON.stringify(tg));

  // desde a sua última visita
  const nb = await p.evaluate(() => document.querySelector('#v-capa .cp-nov')?.textContent || '');
  ok(/^2 novas · 2 atualizadas desde (ontem|[a-zç]{3}), 22h10/.test(nb), 'Capa: "2 novas · 2 atualizadas desde a sua última visita" → ' + nb);
  await p.evaluate(() => document.querySelector('#v-capa .cp-nov').click()); await sleep(500);
  ok(await p.evaluate(n => { const l = document.querySelector('#layer .mud-l'); return l && l.querySelectorAll('li').length === 4 && /Nova/.test(l.querySelector('li').textContent) && /Atualizada/.test(l.textContent) }, novas), 'lista "Desde a sua última visita" com novas primeiro');
  await p.screenshot({ path: D + 'desde.png' });
  await p.evaluate(() => document.querySelector('#layer .mud-l button').click()); await sleep(600);
  ok(await p.evaluate(n => n.includes(MAT_PID), novas), 'tocar num item abre a matéria');
  await p.evaluate(() => history.back()); await sleep(500);

  // correções visíveis
  ok(await p.evaluate(id => /corrigida/.test(document.querySelector('#cpi-' + id + ' .cp-k')?.textContent || ''), pc.id), 'Capa: chapéu avisa "corrigida" (até 48 h)');
  await p.evaluate(id => abrirMateria(id), pc.id); await sleep(500);
  ok(await p.evaluate(() => /Corrigida hoje às/.test(document.querySelector('#layer .mat-corr')?.textContent || '') && /R\$ 44 mil/.test(document.querySelector('#layer #mat-fix')?.textContent || '')), 'matéria: selo "Corrigida hoje às…" e o texto da correção');
  await p.evaluate(() => document.querySelector('#layer .mat-corr').click()); await sleep(900);
  ok(await p.evaluate(() => { const r = document.querySelector('#layer #mat-fix').getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight }), 'tocar no selo leva até a correção');
  await p.screenshot({ path: D + 'correcao.png' });
  await p.evaluate(() => history.back()); await sleep(500);

  // resumo com título e agenda da semana
  ok(await p.evaluate(() => document.querySelector('#v-capa .cp-1m h3 span')?.textContent === 'A semana em 5 fatos'), 'resumo com título próprio ("A semana em 5 fatos")');
  const ag = await p.evaluate(() => ({ fds: fimDeSemana(), t: [...document.querySelectorAll('#v-capa .cp-h h3')].map(h => h.textContent).find(t => /Agenda/.test(t)), tem: /Evento de teste da semana que vem/.test(document.querySelector('#v-capa').textContent), dia: agDiaTxt('2026-11-03', '2026-10-31', '2026-11-01') }));
  ok(ag.dia === 'ter (3)' && (ag.fds ? ag.t === 'Agenda da semana' && ag.tem : ag.t === 'Agenda' && !ag.tem), 'agenda: no fim de semana mostra a semana que vem ' + JSON.stringify(ag));

  // versão nova: não recarrega mais na hora (141, a Capa sumia e voltava na frente da pessoa); fica para a volta ao app
  const p2 = U.erros(await ctx.newPage(), 'b'); let navs = 0; p2.on('framenavigated', fr => { if (fr === p2.mainFrame()) navs++ });
  await p2.route('**/versao.json', r => r.fulfill({ body: '{"v":"abcdefabcdef"}', contentType: 'application/json' }));
  const html = fs.readFileSync(S0 + 'index.html', 'utf8') + '<!-- "abcdefabcdef" -->';
  await p2.route('http://localhost:8828/', r => r.fulfill({ body: html, contentType: 'text/html' }));
  await p2.addInitScript(() => localStorage.setItem('prumo-teste-versao', '1'));
  await p2.goto('http://localhost:8828/index.html'); await sleep(5000);
  ok(navs === 1 && await p2.evaluate(() => VERSAO_NOVA === 'abcdefabcdef'), `versão nova: guardada para a volta ao app, sem recarregar na abertura (navegações: ${navs})`);
  const p3 = U.erros(await ctx.newPage(), 'c'); let nav3 = 0; p3.on('framenavigated', fr => { if (fr === p3.mainFrame()) nav3++ });
  await p3.route('**/versao.json', r => r.fulfill({ body: '{"v":"123456abcdef"}', contentType: 'application/json' }));
  await p3.route('http://localhost:8828/', r => r.fulfill({ body: html.replace('abcdefabcdef', '123456abcdef'), contentType: 'text/html' }));
  await p3.addInitScript(() => { localStorage.setItem('prumo-teste-versao', '1'); addEventListener('DOMContentLoaded', () => setTimeout(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })), 50)) });
  await p3.goto('http://localhost:8828/index.html'); await sleep(4000);
  ok(nav3 === 1 && await p3.evaluate(() => VERSAO_NOVA === '123456abcdef'), 'se a pessoa já está mexendo, não recarrega na cara dela (fica para a volta ao app)');

  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa28: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'fotos-arquivo.json') } catch (e) { } process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
