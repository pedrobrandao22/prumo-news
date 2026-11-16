// Proposta de 16/11: "Silenciar conversa" também tira o aviso no celular (o banco lê a preferência conv[<uid>].sil).
const U = require('../t_util'); const { ok } = U; const fs = require('fs'), path = require('path');
(async () => {
  const raiz = path.join(__dirname, '..'), ler = f => fs.readFileSync(path.join(raiz, f), 'utf8');
  const tmp = path.join(raiz, 'review3', 'var', 'silenciar.sql'); fs.mkdirSync(path.dirname(tmp), { recursive: true });
  const prop = ler('sql/proposta-2026-11-16-silenciar.sql');
  fs.writeFileSync(tmp, [ler('prumo-supabase.antes-v10.sql'), ler('sql/publicacoes-v10.sql'), prop, prop].join('\n'));
  const H = await require('../harness').criar({ sql: tmp });
  const a = await H.criarConta('a@x', '1'), b = await H.criarConta('b@x', '1'), c = await H.criarConta('c@x', '1');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro'),($3,'Caio','membro')`, [a, b, c]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita')`, [a, b, c]);
  const como = (u, q, p) => H.comoUsuario(u, () => H.db.query(q, p)).then(r => r.rows);
  const fila = async () => H.sql(`select de, tipo from push_fila where para=$1 order by id`, [a]);
  await como(a, `select public.push_inscrever($1,$2,$3,$4::jsonb,$5)`, ['https://fcm.googleapis.com/fcm/send/x', 'B' + 'p'.repeat(86), 'y'.repeat(22), JSON.stringify({ mensagens: true, curtidas: true, mencoes: true }), 't']);
  await como(b, `insert into mensagens(de,para,texto) values ($1,$2,'oi')`, [b, a]);
  ok((await fila()).length === 1, 'sem silenciar: mensagem da Bia vira aviso');
  await H.sql(`delete from push_fila`);
  // o Pedro silencia a Bia (o app grava as preferências inteiras em data/users/<uid>/prefs)
  await como(a, `insert into docs(path,col,owner,data) values ($1,'data',$2,$3::jsonb)`, ['data/users/' + a + '/prefs', a, JSON.stringify({ fonte: 1, conv: { [b]: { sil: true } } })]);
  await como(b, `insert into mensagens(de,para,texto) values ($1,$2,'oi de novo')`, [b, a]);
  await como(c, `insert into mensagens(de,para,texto) values ($1,$2,'oi do Caio')`, [c, a]);
  let f = await fila();
  ok(f.length === 1 && f[0].de === c, 'silenciada: a Bia não gera aviso; o Caio continua gerando', f);
  ok((await H.sql(`select count(*)::int n from mensagens where para=$1`, [a]))[0].n === 3, 'a mensagem silenciada é gravada normalmente');
  await H.sql(`delete from push_fila`);
  await como(a, `update docs set data = jsonb_set(data, '{conv}', '{}'::jsonb) where path=$1`, ['data/users/' + a + '/prefs']);
  await como(b, `insert into mensagens(de,para,texto) values ($1,$2,'voltou')`, [b, a]);
  ok((await fila()).length === 1, 'reativar avisos: volta a avisar');
  let e = null; try { await como(b, `select public.push_silenciou($1,$2)`, [a, b]) } catch (x) { e = x } ok(!!e, 'push_silenciou não é chamável pelo app (só pelo gatilho)');
  const R = U.resumo(); console.log(`\nRESUMO t_silenciar_1611: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
