// Leva 2: telas com muitos amigos (20), busca, nova conversa, reações, voltar, boas-vindas.
const U = require('./t_util');
const { ok, sleep, esperar } = U;
const fs = require('fs');
const BASE = 'http://localhost:8772/index.html';
const P1 = 'pec-6x1-senado';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const DIR = __dirname + '/review2/leva2'; fs.mkdirSync(DIR, { recursive: true });
const foto = async (p, n) => { await sleep(300); await p.screenshot({ path: `${DIR}/${n}.png` }) };
async function fecha(p) { if (await p.$('#layer .sheet, #layer2 .sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }

(async () => {
  U.feedFresco('site');
  const srv = U.servir('site', 8772); await sleep(800);
  const H = await require('./harness').criar(); { const _pg = H.pagina; H.pagina = async (...a) => { const p = await _pg(...a); await p.context().addInitScript(() => { try { localStorage.setItem('prumo-pf-aba', 'conta') } catch (e) { } }); return p } }
  const nomes = ['Pedro', 'Ana', 'Caio', 'Dani', 'Edu', 'Fabi', 'Gil', 'Hana', 'Ivo', 'Jade', 'Kau', 'Lia', 'Mel', 'Nina', 'Otto', 'Paula', 'Quim', 'Rita', 'Saulo', 'Tati', 'Ulisses', 'Vera', 'Wagner', 'Xica', 'Yuri'];
  const uids = [];
  for (let i = 0; i < nomes.length; i++) uids.push(await H.criarConta(`u${i}@x.com`, '123456'));
  for (let i = 0; i < nomes.length; i++) await H.sql(`insert into public.membros(uid,nome,convidado_por) values ($1,$2,$3)`, [uids[i], nomes[i], i ? uids[0] : null]);
  for (let i = 1; i <= 20; i++) await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [uids[0], uids[i]]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'pendente')`, [uids[21], uids[0]]);   // Vera pediu a Pedro
  const codigo = 'TESTE234'; await H.sql(`insert into public.convites(codigo,criado_por) values ($1,$2)`, [codigo, uids[0]]);

  const b = await U.navegador();
  const pg = async (i, vp) => { const p = U.erros(await H.pagina(b, { viewport: vp, sessao: { user: { id: uids[i], email: `u${i}@x.com` } } }), nomes[i]); await p.goto(BASE); return p };
  const A = await pg(0), B = await pg(1, { width: 360, height: 740 });
  for (const p of [A, B]) ok(await esperar(p, () => S.membro && S.amigosOk && document.querySelectorAll('.post').length > 0, null, 10000), 'abre logado');
  ok(await esperar(A, () => S.amigos.size === 20), 'Pedro tem 20 amigos');

  // ---------- Perfil: 5 amigos + "Ver todos"
  await clk(A, '#t-me'); await sleep(300);
  ok(await ev(A, () => document.querySelectorAll('#v-me .amg .amg-r').length === 5 && /Ver todos os 20 amigos/.test(document.querySelector('#v-me').textContent)), 'Perfil mostra 5 amigos e "Ver todos os 20 amigos"');
  await foto(A, '01-perfil');
  await clk(A, '[data-veramigos]');
  ok(await esperar(A, () => document.querySelectorAll('.sheet [data-conversa]').length === 20 && !!document.querySelector('#pq')), '"Ver todos" lista os 20 com busca');
  await A.fill('#pq', 'jad');
  ok(await esperar(A, () => document.querySelectorAll('.sheet [data-conversa]').length === 1 && /Jade/.test(document.querySelector('#pbox').textContent)), 'busca "jad" acha a Jade');
  await A.fill('#pq', 'zzz');
  ok(await esperar(A, () => /Ninguém com esse nome/.test(document.querySelector('#pbox').textContent)), 'busca sem resultado avisa');
  await A.fill('#pq', 'otto'); await foto(A, '02-ver-todos-busca');
  // conversar a partir do Perfil e voltar: volta ao Perfil
  await clk(A, '.sheet [data-conversa]');
  ok(await esperar(A, () => VIEW === 'msgs' && !!THREAD && !!document.querySelector('#mform')), 'abre a conversa com Otto');
  await A.goBack(); await sleep(500);
  ok(await esperar(A, () => VIEW === 'me'), 'voltar do celular leva de volta ao Perfil', await ev(A, () => VIEW));

  // ---------- Adicionar amigos: pedido recebido em cima, busca, cancelar pedido
  await clk(A, '[data-addamigos]');
  ok(await esperar(A, v => !!document.querySelector(`#pbox [data-aceitar="${v}"]`) && /quer ser seu amigo/.test(document.querySelector('#pbox li')?.textContent || ''), uids[21]), 'pedido da Vera aparece primeiro, com "quer ser seu amigo"');
  await clk(A, `#pbox [data-pedir="${uids[22]}"]`);
  ok(await esperar(A, w => !!document.querySelector(`#pbox [data-cancelar="${w}"]`), uids[22]), 'pedir amizade vira "Cancelar pedido"');
  await foto(A, '03-adicionar-amigos');
  await clk(A, `#pbox [data-cancelar="${uids[22]}"]`);
  ok(await esperar(A, w => !!document.querySelector(`#pbox [data-pedir="${w}"]`) && !S.pedidosOut.includes(w), uids[22]), 'cancelar pedido volta para "Pedir amizade"');
  ok((await H.sql(`select 1 from public.amizades where de=$1 and para=$2`, [uids[0], uids[22]])).length === 0, 'pedido some do banco');
  await fecha(A);

  // ---------- Conversas: vazio, "Nova conversa", depois lista só com quem conversou
  await clk(A, '#t-msgs'); await sleep(300);
  ok(await ev(A, () => /Nenhuma conversa ainda/.test(document.querySelector('#v-msgs').textContent) || document.querySelectorAll('#v-msgs .people li').length <= 1), 'Conversas não lista os 20 amigos');
  await ev(A, () => { THREAD = null; renderMsgs() });
  await clk(A, '#v-msgs [data-novaconv]');
  ok(await esperar(A, () => document.querySelectorAll('.sheet [data-conversa]').length === 20), '"Nova conversa" com os 20 amigos e busca');
  await A.fill('#pq', 'ana'); await sleep(200);
  ok(await ev(A, () => [...document.querySelectorAll('.sheet [data-conversa]')].map(x => x.textContent).some(t => /Ana/.test(t))), 'busca "ana" acha Ana');
  await fecha(A);

  // ---------- Enviar com busca
  await clk(A, '#t-feed'); await sleep(300); await ev(A, p => garantirPost(p), P1);
  await clk(A, `#p-${P1} [data-a="send"]`);
  ok(await esperar(A, () => !!document.querySelector('#pkq') && document.querySelectorAll('#pick [data-pick]').length === 20), 'Enviar com 20 amigos tem busca');
  await A.fill('#pkq', 'ana');
  ok(await esperar(A, () => [...document.querySelectorAll('#pick [data-pick]')].filter(x => !x.hidden).length >= 1 && [...document.querySelectorAll('#pick [data-pick]')].filter(x => !x.hidden).length < 5), 'busca filtra os amigos no Enviar');
  await foto(A, '04-enviar-busca');
  await clk(A, `[data-pick="${uids[1]}"]`); await A.fill('#stext', 'Olha essa'); await clk(A, '#sbtn');
  ok(await esperar(B, () => S.msgsIn.some(m => m.texto === 'Olha essa')), 'Ana recebe');

  // ---------- reações visíveis embaixo da notícia recebida
  await clk(B, '#t-msgs'); await sleep(300);
  if (!(await ev(B, () => !!document.querySelector('#mform')))) await clk(B, `#v-msgs [data-thread="${uids[0]}"]`);
  const midN = await ev(B, () => { const m = [...document.querySelectorAll('#v-msgs .dm-m')].find(x => x.querySelector('.dm-card')); return m && m.dataset.mid });
  ok(!!midN, 'Ana vê a notícia como cartão na conversa');
  await foto(B, '05-reacoes');
  await ev(B, id => dmReagir(id, '👍'), midN);
  ok(await esperar(B, id => !!document.querySelector(`[data-mid="${id}"] .dm-rx`), midN), 'depois de reagir: a reação aparece no balão');
  ok(await esperar(A, () => S.msgsIn.some(m => m.tipo === 'reacao_msg' && m.texto === '👍')), 'Pedro recebe a reação');
  await clk(A, '#t-msgs'); await sleep(300);
  await ev(A, a => { THREAD = a; renderMsgs() }, uids[1]);
  ok(await esperar(A, () => /👍/.test(document.querySelector('#v-msgs .thread .dm-rx')?.textContent || '')), 'na conversa de Pedro aparece 👍 na notícia');
  await foto(B, '06-reagiu'); await foto(A, '07-reacao-recebida');
  await ev(A, () => { THREAD = null; renderMsgs() });
  ok(await esperar(A, () => document.querySelectorAll('#v-msgs .people li').length === 1 && !!document.querySelector('#v-msgs [data-novaconv]')), 'Conversas: só Ana na lista + botão "Nova conversa"');
  await foto(A, '08-conversas');

  // ---------- Interagir: só o próprio quiz
  await A.evaluate(() => go('play')); await sleep(300); await foto(A, '09-interagir');

  // ---------- nova pessoa: boas-vindas
  const N = U.erros(await H.pagina(b), 'Nova');
  await N.goto(BASE + '?convite=' + codigo);
  ok(await esperar(N, () => !!document.querySelector('#lcod')), 'link de convite abre o cadastro');
  await N.fill('#lnome', 'Zeca'); await N.fill('#lemail', 'zeca@x.com'); await N.fill('#lsenha', '123456'); await clk(N, '#lform [type=submit]');
  ok(await esperar(N, () => /Bem-vindo ao Prumo, Zeca/.test(document.querySelector('.sheet')?.textContent || '') && /Quem te convidou já é seu amigo/.test(document.querySelector('.sheet').textContent), null, 10000), 'boas-vindas para quem acabou de entrar');
  await foto(N, '10-boas-vindas');
  await clk(N, '.sheet [data-close]');
  ok(await esperar(N, () => !document.querySelector('#layer .sheet')), '"Começar a ler" fecha');

  for (const p of [A, B, N]) ok(!p._erros.length, 'sem erros de JS: ' + p._erros.join(' | '));
  const r = U.resumo(); console.log(`\nRESUMO t_leva2: ${r.OKS} ok, ${r.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
