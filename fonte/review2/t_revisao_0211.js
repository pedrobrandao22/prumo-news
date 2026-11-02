// Revisão geral de 02/11: o que os 4 revisores acharam continua corrigido
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8785/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8785); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  // número de destaque não corta faixas
  ok(await ev(A, () => ssNumero('30% a 34%: é a aprovação') === null && ssNumero('17 anos, 1 mês e 10 dias') === null && ssNumero('1.700 a 2.000 pessoas') === null && ssNumero('R$ 60 bi a R$ 80 bi') === null && ssNumero('61,6%: é a adesão') === '61,6%'), 'número de destaque não corta faixas ("30% a 34%")');
  ok(await ev(A, () => { const d = new Date(Date.now() - 864e5 - 3600e3).toISOString(); return /ontem|\(/.test(horaDia(d)) }), 'horário de ontem mostra o dia');
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid), uidA = await ev(A, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  // duas enquetes no mesmo story: votos separados
  const sid = await ev(A, async () => { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', texto: '', fotos: [], estilo: { v: 2, fundo: 1, itens: [{ t: 'enq', x: .5, y: .3, q: 'Café ou chá?', o: ['Sim', 'Não'] }, { t: 'enq', x: .5, y: .7, q: 'Praia ou serra?', o: ['Sim', 'Não'] }] } }).select('id'); return r.data[0].id });
  await ev(B, () => pubCarregar()); await sleep(1200);
  await ev(B, id => stLista([pubDe(id)], 0, 'Pedro', 'x'), sid); await sleep(900);
  await ev(B, () => document.querySelector('#layer [data-usvoto][data-n="0"][data-i="0"]').click()); await sleep(1200);
  ok(await ev(B, () => { const e = [...document.querySelectorAll('#layer .us-enq')]; return e.length === 2 && e[0].classList.contains('res') && !e[1].classList.contains('res') }), 'duas enquetes no story: votar na 1ª não vota na 2ª');
  await ev(B, () => closeLayer()); await sleep(300);
  // post de Melhores amigos não pode ser enviado por quem não é o autor
  const pp = await ev(A, async u => { await SB.from('melhores_amigos').insert({ dono: S.uid, amigo: u }); const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'SEGREDO', fotos: [], estilo: { v: 2 }, publico: 'proximos' }).select('id'); return r.data[0].id }, uidB);
  await ev(B, () => pubCarregar()); await sleep(1200);
  await ev(B, () => { window.__T = []; const t = toast; toast = function (m) { window.__T.push(m); return t.apply(this, arguments) } });
  await ev(B, id => pubEnviar(pubDe(id)), pp); await sleep(300);
  ok(await ev(B, () => !document.querySelector('#pick') && window.__T.some(m => /Melhores amigos/.test(m))), 'post de Melhores amigos: amiga não consegue enviar adiante');
  // servidor: hora das mensagens é a do servidor; pedido cancelado não vira amizade
  const m = await H.comoUsuario(uidA, () => H.db.query(`insert into mensagens(de,para,at,texto,lida) values ($1,$2,9007199254740991,'oi',true) returning at, lida`, [uidA, uidB]));
  ok(+m.rows[0].at < Date.now() + 60000 && m.rows[0].lida === false, 'mensagem: hora do servidor e chega como não lida');
  const c = await H.criarConta('c@x', '123456'); await H.sql(`insert into membros(uid,nome) values ($1,'Caio')`, [c]);
  let e1 = null; try { await H.comoUsuario(uidA, () => H.db.query(`select public.responder_amizade($1, true)`, [c])) } catch (e) { e1 = e.message }
  ok(/nao existe/.test(e1 || '') && (await H.sql(`select count(*)::int n from amizades where (de=$1 and para=$2) or (de=$2 and para=$1)`, [c, uidA]))[0].n === 0, 'aceitar pedido que não existe: avisa e não cria amizade');
  // desfazer amizade tira dos Melhores amigos
  await H.comoUsuario(uidA, () => H.db.query(`select public.desfazer_amizade($1)`, [uidB]));
  ok((await H.sql(`select count(*)::int n from melhores_amigos where dono=$1`, [uidA]))[0].n === 0, 'desfazer amizade tira da lista de Melhores amigos');
  // excluir a conta leva as publicações junto
  await H.comoUsuario(uidA, () => H.db.query(`select public.excluir_conta()`));
  ok((await H.sql(`select count(*)::int n from publicacoes where autor=$1`, [uidA]))[0].n === 0, 'excluir a conta apaga as publicações');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_revisao_0211: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
