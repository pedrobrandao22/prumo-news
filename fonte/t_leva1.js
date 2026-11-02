// Leva 1: economia (tempo real aplica a linha, sem reler tudo), falhas que voltam atrás, conversas, poda.
const U = require('./t_util');
const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8770/index.html';
const P1 = 'pec-6x1-senado', P2 = 'debate-band', P3 = 'canais-whatsapp';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function fecha(p) { if (await p.$('#layer .sheet, #layer2 .sheet')) { await p.evaluate(() => closeLayer()); await sleep(200) } }

(async () => {
  U.feedFresco('site');
  const srv = U.servir('site', 8770); await sleep(800);
  const CONT = {};
  const conta = (uid, k) => { CONT[uid] = CONT[uid] || {}; CONT[uid][k] = (CONT[uid][k] || 0) + 1 };
  const H = await require('./harness').criar({
    contar: (op, res, uid) => { if (!uid) return; conta(uid, op.kind + ':' + (op.table || op.name) + ':' + (op.action || '')) }
  });
  const zera = () => Object.keys(CONT).forEach(k => delete CONT[k]);
  const q = (uid, k) => (CONT[uid] || {})[k] || 0;

  // ---------- 14 pessoas: A (Pedro) com 13 amigos; só A, B e C ficam com o app aberto
  const nomes = ['Pedro', 'Ana', 'Caio', 'Dani', 'Edu', 'Fabi', 'Gil', 'Hana', 'Ivo', 'Jade', 'Kau', 'Lia', 'Mel', 'Nina'];
  const uids = [];
  for (let i = 0; i < nomes.length; i++) uids.push(await H.criarConta(`u${i}@x.com`, '123456'));
  for (let i = 0; i < nomes.length; i++) await H.sql(`insert into public.membros(uid,nome,convidado_por) values ($1,$2,$3)`, [uids[i], nomes[i], i ? uids[0] : null]);
  for (let i = 1; i < nomes.length; i++) await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [uids[0], uids[i]]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [uids[1], uids[2]]);
  // atividade antiga dos amigos (para a carga inicial ter volume)
  const agora = Date.now(), dia = 864e5;
  for (let i = 1; i < nomes.length; i++) {
    const it = {}; for (let k = 0; k < 60; k++) it['velha-' + k] = { at: agora - k * dia, snap: { id: 'velha-' + k, titulo: 'Notícia antiga ' + k, secao: 'politica' } };
    await H.sql(`insert into public.docs(path,col,owner,data) values ($1,'curtidas',$2,$3)`, ['curtidas/' + uids[i], uids[i], JSON.stringify({ itens: it })]);
  }
  // curtidas velhas do próprio A (para a poda)
  const minhas = { [P2]: { at: agora - dia, snap: { id: P2 } } }; for (let k = 0; k < 5; k++) minhas['bem-velha-' + k] = { at: agora - (50 + k) * dia, snap: { id: 'x' } };
  await H.sql(`insert into public.docs(path,col,owner,data) values ($1,'curtidas',$2,$3)`, ['curtidas/' + uids[0], uids[0], JSON.stringify({ itens: minhas })]);
  const lei = {}; for (let k = 0; k < 30; k++) lei['p' + k] = agora - k * dia;
  await H.sql(`insert into public.docs(path,col,owner,data) values ($1,'leituras',$2,$3)`, ['leituras/' + uids[0], uids[0], JSON.stringify({ itens: lei })]);
  // a mesma notícia em listas com Ana e Caio
  const par = (a, b) => a < b ? a + '_' + b : b + '_' + a;
  for (const i of [1, 2]) await H.sql(`insert into public.docs(path,col,owner,data) values ($1,'lista',null,$2)`, ['lista/' + par(uids[0], uids[i]), JSON.stringify({ itens: { [P3]: { at: agora - i * 60000, uid: uids[i], snap: { id: P3, titulo: 'Canais', secao: 'politica' } } } })]);

  const b = await U.navegador();
  const pg = async i => { const p = U.erros(await H.pagina(b, { sessao: { user: { id: uids[i], email: `u${i}@x.com` } } }), nomes[i]); await p.goto(BASE); return p };
  const A = await pg(0), B = await pg(1), C = await pg(2);
  for (const p of [A, B, C]) ok(await esperar(p, () => S.membro && S.amigosOk && document.querySelectorAll('.post').length > 0, null, 10000), 'abre logado: ' + (await ev(p, () => S.membros[S.uid]?.nome)));
  ok(await esperar(A, () => S.amigos.size === 13), 'A tem 13 amigos');
  await sleep(1500);

  // ---------- 1. curtida de um amigo chega sem A reler o banco
  zera();
  await clk(B, `#p-${P1} [data-a="like"]`);
  ok(await esperar(A, (p) => socialOf(p).likes.length >= 1, P1), 'A vê a curtida de Ana (tempo real)');
  await sleep(600);
  ok(q(uids[0], 'from:docs:select') === 0, 'A não releu nenhuma coleção por causa da curtida de Ana', CONT[uids[0]]);
  ok(q(uids[1], 'from:docs:select') === 0, 'Ana não releu nada depois da própria curtida', CONT[uids[1]]);

  // ---------- 2. comentário de amigo
  zera();
  await ev(C, p => { openComments(p) }, P1); await C.fill('#ctext', 'Comentário do Caio'); await clk(C, '#cform .sendc');
  ok(await esperar(A, p => socialOf(p).cm.some(c => c.texto === 'Comentário do Caio'), P1), 'A vê o comentário do Caio');
  await sleep(600);
  ok(q(uids[0], 'from:docs:select') === 0, 'sem releitura em A por causa do comentário', CONT[uids[0]]);
  await fecha(C);

  // ---------- 3. falhas voltam atrás
  const falhar = (p, on) => ev(p, on => {
    if (!window.__sbOrig) { window.__sbOrig = window.__sb; window.__sb = s => { const o = JSON.parse(s); if (window.__falhar && (o.op.kind === 'rpc' || o.op.action === 'insert')) return Promise.resolve(JSON.stringify({ data: null, error: { message: 'Failed to fetch' } })); return window.__sbOrig(s) } }
    window.__falhar = on;
  }, on);
  await falhar(A, true);
  await ev(A, p => openComments(p), P1); await A.fill('#ctext', 'Vai falhar'); await clk(A, '#cform .sendc');
  ok(await esperar(A, () => document.querySelector('#ctext')?.value === 'Vai falhar'), 'comentário que falhou: texto volta para a caixa');
  ok(await ev(A, p => !socialOf(p).cm.some(c => c.texto === 'Vai falhar'), P1), 'comentário que falhou não fica na lista');
  await fecha(A);
  const antes = await ev(A, p => socialOf(p).likes.includes(S.uid), P1);
  await clk(A, `#p-${P1} [data-a="like"]`);
  ok(await esperar(A, ([p, a]) => socialOf(p).likes.includes(S.uid) === a && /Não deu para marcar/.test(document.querySelector('.toast')?.textContent || ''), [P1, antes]), 'curtida que falhou volta ao que era');
  await ev(A, p => { garantirPost(p); }, P1);
  await clk(A, `#p-${P1} [data-voto="0"]`).catch(() => { });
  ok(await esperar(A, p => meuVoto(p) === undefined && /Não deu para votar/.test(document.querySelector('.toast')?.textContent || ''), P1), 'voto que falhou volta ao que era');
  await clk(A, `#p-${P1} [data-a="send"]`); await sleep(200);
  await clk(A, `[data-pick="${uids[1]}"]`); await A.fill('#stext', 'Olha isso'); await clk(A, '#sbtn');
  ok(await esperar(A, () => document.querySelector('#stext')?.value === 'Olha isso' && !document.querySelector('#sbtn').disabled), 'Enviar que falhou: janela e texto continuam');
  await falhar(A, false);
  await clk(A, '#sbtn');
  ok(await esperar(A, () => !document.querySelector('#stext')), 'Enviar ok fecha a janela');
  ok(await esperar(B, () => S.msgsIn.some(m => m.texto === 'Olha isso')), 'Ana recebe a notícia enviada');

  // ---------- 4. lidas numa gravação só
  for (const t of ['um', 'dois', 'três']) await ev(C, ([t, a]) => S.db.collection('mensagens').add({ de: S.uid, para: a, at: Date.now(), texto: t, lida: false }), [t, uids[0]]);
  ok(await esperar(A, () => S.msgsIn.filter(m => !m.lida).length === 3), 'A tem 3 não lidas');
  zera();
  await clk(A, '#t-msgs'); await sleep(200); await clk(A, `[data-thread="${uids[2]}"]`);
  ok(await esperar(A, () => S.msgsIn.every(m => m.lida) && document.querySelector('#badge').hidden), 'abrir a conversa zera o contador');
  await sleep(500);
  ok(q(uids[0], 'from:mensagens:update') === 1, 'marcar 3 como lidas = 1 gravação', CONT[uids[0]]);
  ok(await esperar(C, () => true), 'ok');

  // ---------- 5. conversa com quem desfez a amizade continua na lista
  await ev(C, a => S.db.collection('mensagens').add({ de: S.uid, para: a, at: Date.now(), texto: 'tchau', lida: false }), uids[0]);
  await esperar(A, () => S.msgsIn.some(m => m.texto === 'tchau'));
  await ev(A, () => { THREAD = null; renderMsgs() });
  await ev(C, a => S.db.rpc('desfazer_amizade', { p_uid: a }), uids[0]);
  ok(await esperar(A, c => !S.amigos.has(c), uids[2], 8000), 'A deixa de ter Caio como amigo');
  ok(await esperar(A, c => !!document.querySelector(`#v-msgs [data-thread="${c}"]`) || (THREAD === c), uids[2]), 'conversa com Caio continua em Conversas');
  await ev(A, () => { THREAD = null; renderMsgs() });
  await clk(A, `[data-thread="${uids[2]}"]`);
  ok(await esperar(A, () => S.msgsIn.every(m => m.lida) && document.querySelector('#badge').hidden && /não são amigos/.test(document.querySelector('#v-msgs').textContent)), 'abre só para ler e o contador zera');

  // ---------- 7. sem "Cutucar" e sem "Junto?"
  await clk(A, '#t-feed'); await sleep(300);
  ok(await ev(A, () => !document.querySelector('[data-cutucar],[data-juntos]')), 'sem Cutucar e sem Junto?');

  // ---------- 8. releitura incremental pega o que o tempo real perdeu
  await sleep(2000);
  await H.sql(`update public.docs set data = jsonb_set(data, '{itens,${P2}}', '{"at":1,"snap":{"id":"${P2}"}}'::jsonb), atualizado_em = now() where path = $1`, ['curtidas/' + uids[5]]);
  zera();
  await ev(A, () => S.db.atualizar());
  ok(await esperar(A, ([p, f]) => socialOf(p).likes.includes(f), [P2, uids[5]]), 'releitura incremental traz a curtida da Fabi');
  ok(q(uids[0], 'from:docs:select') === 1, 'releitura incremental = 1 consulta', CONT[uids[0]]);

  // ---------- 9. poda (roda 20 s depois de abrir)
  ok(await esperar(A, () => S._podou, null, 30000), 'poda rodou');
  await sleep(1500);
  const meu = (await H.sql(`select data from public.docs where path=$1`, ['curtidas/' + uids[0]]))[0].data.itens;
  ok(!Object.keys(meu).some(k => k.startsWith('bem-velha')) && meu[P2], 'curtidas com mais de 45 dias saem; a recente fica', Object.keys(meu));
  const le = await H.sql(`select 1 from public.docs where path=$1`, ['leituras/' + uids[0]]);
  ok(le.length === 0, 'leituras saem do banco (ficam só no aparelho)');

  // ---------- 10. sair só deste aparelho
  await ev(A, () => { const c = window.__sbClient; const o = c.auth.signOut; c.auth.signOut = a => { window.__saiu = a; return o.call(c.auth, a) } });
  await ev(A, () => sair());
  ok(await esperar(A, () => window.__saiu && window.__saiu.scope === 'local'), 'sair usa scope local');

  for (const p of [A, B, C]) ok(!p._erros.length, 'sem erros de JS: ' + p._erros.join(' | '));
  const r = U.resumo(); console.log(`\nRESUMO t_leva1: ${r.OKS} ok, ${r.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
