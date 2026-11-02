// Etapa 3: capa, menu novo, aba Buscar, Guardadas/Quiz no Perfil, manchete fixada pelo admin
const U = require('../t_util');
const { ok, sleep, esperar } = U;
const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(__dirname + '/feed-etapa2.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  f.capa = { manchete: 'caso-master', destaques: ['pec-6x1-senado', 'dolar-volta-acima-5', 'alerta-chuvas-sp', 'estudiantes-flamengo-semi-libertadores'], linha_fina: 'Linha fina escrita pela rodada para a manchete.' };
  f.indicadores = { itens: [{ id: 'dolar', nome: 'Dólar', valor: 'R$ 5,09', variacao: '+1,17%', dir: 'sobe', data: '2026-10-16' }, { id: 'ibovespa', nome: 'Ibovespa', valor: '139.512', variacao: '-1,06%', dir: 'desce', data: '2026-10-16' }, { id: 'selic', nome: 'Selic', valor: '14,25%', dir: 'estavel', data: '2026-09-17' }, { id: 'ipca12m', nome: 'IPCA 12m', valor: '5,1%', dir: 'desce', data: '2026-10-09' }] };
  f.pautas.find(p => p.id === 'estudiantes-flamengo-semi-libertadores').status = 'ao_vivo';
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8778); await sleep(800);
  const H = await require('../harness').criar(); { const _pg = H.pagina; H.pagina = async (...a) => { const p = await _pg(...a); await p.context().addInitScript(() => { try { localStorage.setItem('prumo-pf-aba', 'conta') } catch (e) { } }); return p } }
  const a = await H.criarConta('a@x', '123456'), b2 = await H.criarConta('b@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Ana','membro')`, [a, b2]);
  const br = await U.navegador();
  const D = __dirname + '/etapa3/';
  const P = U.erros(await H.pagina(br, { sessao: { user: { id: a, email: 'a@x' } } }), 'Pedro');
  await P.goto('http://localhost:8778/index.html'); await esperar(P, () => document.querySelectorAll('.post').length > 2 && S.membro, null, 10000); await sleep(600);
  ok(await P.evaluate(() => [...document.querySelectorAll('.nav button')].map(b => b.dataset.v).join() === 'capa,feed,msgs,busca,me'), 'menu: Capa · Feed · Conversas · Buscar · Perfil');
  await P.click('#t-capa'); await sleep(600);
  ok(await P.evaluate(() => !document.querySelector('#v-capa').hidden && /Caso Master|Vorcaro|Master/i.test(document.querySelector('.cpi-man').textContent) && /Linha fina escrita/.test(document.querySelector('.cpi-man').textContent)), 'capa: manchete escolhida pela rodada, com linha fina');
  ok(await P.evaluate(() => document.querySelectorAll('.cp-dest>.cpi').length === 4), 'capa: 4 destaques');
  ok(await P.evaluate(() => document.querySelectorAll('.cp-ind .ind-t').length === 4 && /R\$ 5,09/.test(document.querySelector('.cp-ind').textContent)), 'capa: indicadores');
  ok(await P.evaluate(() => !!document.querySelector('.cp-vivo') && document.querySelectorAll('.cp-h').length >= 6), 'capa: faixa ao vivo e faixas por seção');
  ok(await P.evaluate(() => { return /Para acompanhar/.test(document.querySelector('#v-capa').textContent) && /Últimas/.test(document.querySelector('#v-capa').textContent) }), 'capa: Para acompanhar e Últimas');
  await P.screenshot({ path: D + '1-capa.png' });
  await P.evaluate(() => window.scrollTo(0, 900)); await sleep(300); await P.screenshot({ path: D + '2-capa-meio.png' });
  await P.evaluate(() => window.scrollTo(0, 99999)); await sleep(300); await P.screenshot({ path: D + '3-capa-fim.png' });
  await P.evaluate(() => window.scrollTo(0, 0)); await sleep(200);
  await P.evaluate(() => document.querySelector('.cp-dest .cpi-b').click()); await sleep(400);
  ok(await P.evaluate(() => !!document.querySelector('.cp-dest .cpx') && VIEW === 'capa'), 'tocar num destaque abre o texto ali mesmo');
  await P.evaluate(() => document.querySelector('.cp-dest .cpx [data-cpmat]').click()); await sleep(400);
  ok(await P.evaluate(() => !!document.querySelector('#layer .mat')), 'tocar no quadro abre a matéria completa');
  await P.evaluate(() => document.querySelector('#layer .mat [data-capair]').click()); await sleep(900);
  ok(await P.evaluate(() => VIEW === 'feed' && Math.abs(document.querySelector('#p-pec-6x1-senado').getBoundingClientRect().top) < 220), 'Ver no feed (da matéria) abre no feed');
  await P.evaluate(() => history.back()); await sleep(700);
  ok(await P.evaluate(() => VIEW === 'capa'), 'voltar retorna à capa');
  await P.evaluate(() => document.querySelector('[data-capasec="economia"]').click()); await sleep(500);
  ok(await P.evaluate(() => VIEW === 'feed' && FILTRO === 'economia'), '"Ver a seção" abre o feed filtrado');
  await P.evaluate(() => { FILTRO = 'tudo'; renderPosts() });
  // Buscar
  await P.click('#t-busca'); await sleep(500);
  ok(await P.evaluate(() => /Assuntos desta edição/.test(document.querySelector('#v-busca').textContent) && /Congresso/.test(document.querySelector('#v-busca').textContent) && !!document.querySelector('#v-busca [data-dorm]')), 'Buscar: assuntos por seção e subtema, coberturas anteriores');
  await P.screenshot({ path: D + '4-buscar.png' });
  await P.fill('#bvq', 'escala 6x1'); await sleep(300);
  ok(await P.evaluate(() => !!document.querySelector('#bvres [data-busca="pec-6x1-senado"]')), 'Buscar: resultado');
  await P.screenshot({ path: D + '5-buscar-res.png' });
  // Perfil: Guardadas e Quiz
  await P.click('#t-me'); await sleep(400);
  ok(await P.evaluate(() => !!document.querySelector('#v-me [data-vgo="saved"]') && !!document.querySelector('#v-me [data-vgo="play"]')), 'Perfil tem Guardadas e Quiz e enquetes');
  await P.screenshot({ path: D + '6-perfil.png' });
  await P.evaluate(() => document.querySelector('#v-me [data-vgo="play"]').click()); await sleep(400);
  ok(await P.evaluate(() => VIEW === 'play' && document.querySelector('#t-me').getAttribute('aria-current') === 'page' && !!document.querySelector('#v-play .vback')), 'Quiz abre com Perfil marcado e botão voltar');
  await P.evaluate(() => document.querySelector('#v-play .vback').click()); await sleep(300);
  ok(await P.evaluate(() => VIEW === 'me'), 'voltar ao Perfil');
  // admin fixa manchete
  await P.evaluate(() => abrirAdmin('capa')); await sleep(800);
  ok(await P.evaluate(() => /a rodada escolhe a manchete/i.test(document.querySelector('#admbox').textContent)), 'admin: aba Capa');
  await P.screenshot({ path: D + '7-admin-capa.png' });
  await P.evaluate(() => [...document.querySelectorAll('[data-fixar]')].find(b=>b.dataset.fixar==='alerta-chuvas-sp').click());
  ok(await esperar(P, () => CAPA_FIXA && CAPA_FIXA.pid === 'alerta-chuvas-sp', null, 5000), 'admin fixa a manchete');
  await P.evaluate(() => closeLayer()); await P.click('#t-capa'); await sleep(500);
  ok(await P.evaluate(() => document.querySelector('.cpi-man').id.slice(4) === 'alerta-chuvas-sp' && /Fixada/.test(document.querySelector('.cpi-man').textContent)), 'capa mostra a manchete fixada');
  // outra pessoa (sem ser admin) vê a mesma manchete e não consegue fixar
  const A = U.erros(await H.pagina(br, { sessao: { user: { id: b2, email: 'b@x' } } }), 'Ana');
  await A.goto('http://localhost:8778/index.html'); await esperar(A, () => document.querySelectorAll('.post').length > 2 && S.membro, null, 10000);
  await A.click('#t-capa'); await sleep(300);
  ok(await esperar(A, () => document.querySelector('.cpi-man')?.id === 'cpi-alerta-chuvas-sp', null, 5000), 'Ana vê a manchete fixada');
  const neg = await A.evaluate(async () => { try { await S.db.rpc('admin_fixar_manchete', { p_pid: 'x', p_horas: 2 }); return 'fixou' } catch (e) { return 'negado' } });
  ok(neg === 'negado', 'quem não é admin não fixa');
  await A.screenshot({ path: D + '8-capa-fixada.png' });
  await P.evaluate(() => abrirAdmin('capa')); await sleep(500);
  await P.evaluate(() => document.querySelector('[data-desfixar]').click());
  ok(await esperar(P, () => !CAPA_FIXA, null, 5000), 'desfixar');
  // a última aba (Capa) volta ao reabrir
  await P.evaluate(() => { closeLayer(); localStorage.setItem('prumo-teste-capa', '1') }); await sleep(200);
  await P.reload(); await esperar(P, () => !!FEED, null, 10000); await sleep(500);
  ok(await P.evaluate(() => VIEW === 'capa' && !document.querySelector('#v-capa').hidden && !!document.querySelector('.cpi-man')), 'abre sempre na Capa');
  // escuro
  const E = U.erros(await br.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' }), 'escuro');
  await E.goto('http://localhost:8778/index.html'); await esperar(E, () => document.querySelectorAll('.post').length > 2, null, 10000);
  await E.click('#t-capa'); await sleep(600); await E.screenshot({ path: D + '9-capa-escuro.png' });
  for (const p of [P, A, E]) ok(!p._erros.length, 'sem erros de JS: ' + p._erros.join(' | '));
  const res = U.resumo(); console.log(`\nRESUMO t_etapa3: ${res.OKS} ok, ${res.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(res.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
