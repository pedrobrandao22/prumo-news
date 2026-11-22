// Corretor 22/11 (noite). Porta 9171.
// Achado "sem-internet-fechar-o-app-perde-o-post-e-a-curtida-prometidos": sem internet, o app diz "vamos publicar quando
// a internet voltar" e "a curtida vai ser enviada quando a internet voltar", mas a fila ficava só na memória: recarregar
// (ou o celular fechar o app) antes da rede voltar perdia o post (ia calado para os rascunhos) e a curtida.
// Gera a CLASSE: post de texto, post com notícia e curtida feitos sem rede; o app recarrega AINDA sem rede (uma e duas
// vezes) e só depois a rede volta: os dois posts saem sozinhos, a curtida chega ao servidor, os rascunhos somem.
// Controle: post com formulário (fica para a pessoa) recebe "Publicar agora" em vez de sair sozinho.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9171, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (P, f, a) => P.evaluate(f, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const OFF = () => { window.__on = window.__on !== undefined ? window.__on : sessionStorage.getItem('__off') !== '1'; Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => window.__on !== false });
  const t = setInterval(() => { if (window.__sb && !window.__sb.__w) { const o0 = window.__sb; window.__sb = function () { if (window.__on === false) return Promise.reject(new TypeError('Failed to fetch')); return o0.apply(this, arguments) }; window.__sb.__w = 1; clearInterval(t) } }, 0) };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A');
  await A.context().addInitScript(OFF);
  await A.goto(BASE); await esperar(A, () => document.querySelectorAll('.post').length > 0);
  if (!(await A.$('#lcod'))) { await esperar(A, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(A, '#avisoconta [data-entrar]'); await clk(A, '[data-laba="criar"]') }
  await A.fill('#lnome', 'Pedro'); await A.fill('#lemail', 'a@x.com'); await A.fill('#lsenha', '123456'); await clk(A, '#lform [type=submit]');
  await esperar(A, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await A.$('.sheet')) { await ev(A, () => closeLayer()); await sleep(250) }
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000);
  const uid = await ev(A, () => S.uid);
  const sair = () => ev(A, () => { window.__on = false; sessionStorage.setItem('__off', '1'); dispatchEvent(new Event('offline')) });
  const voltar = () => ev(A, () => { sessionStorage.removeItem('__off'); window.__on = true; dispatchEvent(new Event('online')) });

  // 1. post de texto sem rede
  await sair();
  await ev(A, () => criarMenu()); await sleep(300); await A.fill('#cp152-tx', 'Escrito no metrô 1'); await clk(A, '#layer [data-cp152pub]');
  ok(await esperar(A, () => PQ.jobs.some(j => j.estado === 'erro'), null, 8000), 'sem rede: o post de texto fica na fila');
  await sleep(500);
  // 2. post com notícia sem rede (rascunho com pid, sem formulário) — gravado como o 206 grava
  const pid = await ev(A, () => FEED.pautas[0].id);
  // 3. curtida sem rede
  const lpid = await ev(A, () => { const p = FEED.pautas[1].id; toggleLike(p); return p });
  await sleep(300);
  ok(await ev(A, p => JSON.parse(localStorage.getItem('prumo-gostei-pend:' + S.uid) || '{}')[p] === true, lpid), 'sem rede: a curtida pendente fica guardada no aparelho');
  // segundo post: com notícia
  await ev(A, async p => { const st = edNovoSt(); ED = { modo: 'post', tela: 'cam', env: false, st, sts: [st], si: 0, po: { passo: 'detalhes', fotos: [], cur: 0, ar: '4:5', texto: 'Sobre esta notícia', marcados: [], local: '', pid: p, aba: 'filtros', rid: 'rx' + Date.now() } }; await rascSalva(); pq108Grava(pq108Le().concat(ED.po.rid)); ED = null }, pid);
  // controle: rascunho com formulário (análise) não sai sozinho
  await ev(A, async () => { const st = edNovoSt(); const rid = 'rf' + Date.now(); ED = { modo: 'post', tela: 'cam', env: false, st, sts: [st], si: 0, po: { passo: 'detalhes', fotos: [], cur: 0, ar: '4:5', texto: 'Minha análise', marcados: [], local: '', pid: null, aba: 'filtros', rid, cn: { k: 'ana', tit: 'Minha análise' } } }; await rascSalva(); pq108Grava(pq108Le().concat(rid)); ED = null });
  ok((await ev(A, () => pq108Le().length)) === 3, 'sem rede: três posts pendentes anotados');

  // recarrega sem rede, duas vezes
  for (let i = 0; i < 2; i++) { await A.reload(); await esperar(A, () => window.S && S.uid && S.amigosOk, null, 15000); await sleep(4500) }
  ok(await ev(A, () => navigator.onLine === false), 'continua sem rede depois de recarregar');
  ok((await ev(A, () => pq108Le().length)) === 3, 'sem rede, abrir o app não apaga a lista de posts pendentes', await ev(A, () => pq108Le()));
  ok(await ev(A, p => JSON.parse(localStorage.getItem('prumo-gostei-pend:' + S.uid) || '{}')[p] === true, lpid), 'sem rede, abrir o app não perde a curtida pendente');
  ok(await ev(A, p => [...document.querySelectorAll(`#p-${p} [data-a="like"]`)].some(b => b.classList.contains('on')) || !document.querySelector(`#p-${p} [data-a="like"]`), lpid), 'sem rede, o losango da notícia curtida continua marcado');

  // achado "aberto-sem-internet-conversas-diz-nenhum-amigo-e-perfil-vira-voce-0-amigos": sem rede e sem a lista de amigos
  // baixada, Conversas e Perfil dizem que é a conexão (e não "Nenhum amigo ainda" / "0 amigos")
  await ev(A, () => go('msgs')); await sleep(600);
  const cv = await ev(A, () => ({ ok: S.amigosOk, t: (document.getElementById('v-msgs') || document.querySelector('.dm-in') || {}).textContent || '' }));
  if (!cv.ok) ok(!/Nenhum amigo ainda/.test(cv.t) && /Sem conexão/.test(cv.t), 'sem rede: Conversas diz "Sem conexão", não "Nenhum amigo ainda"', cv.t.slice(0, 160));
  else ok(true, 'sem rede: lista de amigos já estava baixada');
  await ev(A, () => go('me')); await sleep(800);
  const pf = await ev(A, () => ({ ok: S.amigosOk, t: (document.getElementById('v-me') || {}).textContent || '' }));
  if (!pf.ok) ok(!/\b0 amigos|Nenhum amigo ainda/.test(pf.t) && /Sem conexão/.test(pf.t), 'sem rede: o Perfil diz "Sem conexão", não "0 amigos"', pf.t.slice(0, 200));
  
  // rede volta
  await voltar(); const t0=Date.now();
  ok(await esperar(A, () => S.amigosOk, null, 5000), 'a rede volta: amigos e conversas carregam logo (até 5 s)', Date.now() - t0);
  ok(await esperar(A, () => !/Sem conexão:|Carregando seu perfil/.test((document.getElementById('v-me') || {}).textContent || ''), null, 4000), 'a rede volta: o Perfil troca o aviso pelos números');
  ok(await esperar(A, () => PUB.itens.some(x => x.texto === 'Escrito no metrô 1'), null, 60000), 'a rede volta: o post de texto sai sozinho');
  ok(await esperar(A, () => PUB.itens.some(x => x.texto === 'Sobre esta notícia'), null, 20000), 'a rede volta: o post com notícia sai sozinho');
  const nPub = (await H.sql("select count(*)::int n from publicacoes where autor=$1 and texto in ('Escrito no metrô 1','Sobre esta notícia')", [uid]))[0].n;
  ok(nPub === 2, 'no servidor: cada post uma vez só', nPub);
  
  const rs = await ev(A, async () => (await rascLista()).map(r => r.texto));
  ok(!rs.includes('Escrito no metrô 1') && !rs.includes('Sobre esta notícia') && rs.includes('Minha análise'), 'rascunhos: os publicados saem, o de formulário fica para a pessoa', rs);
  ok(!(await ev(A, () => PUB.itens.some(x => x.texto === 'Minha análise'))), 'controle: o post com formulário não sai sozinho');
  ok(await esperar(A, p => !localStorage.getItem('prumo-gostei-pend:' + S.uid) && socialOf(p).likes.includes(S.uid), lpid, 12000), 'a rede volta: a curtida é enviada e sai da fila');
  await sleep(500);
  await b.close(); process.exit(0)
})().catch(e => { console.error('FAIL', e); process.exit(1) });
