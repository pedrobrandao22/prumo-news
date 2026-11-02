// SQL v5 (correções): story em destaque protegido, ids mortos saem do destaque, hora de fixar não muda, excluir conta continua funcionando
const U = require('../t_util'); const { ok } = U;
(async () => {
  const H = await require('../harness').criar();
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro')`, [a, b]);
  const ins = async (autor, tipo) => (await H.sql(`insert into publicacoes(autor,tipo,texto,fotos,estilo) values ($1,$2,'x','[]'::jsonb,'{"v":2}'::jsonb) returning id`, [autor, tipo]))[0].id;
  const s1 = await ins(b, 'story'), s2 = await ins(b, 'story'), s3 = await ins(b, 'story'), p1 = await ins(b, 'post');
  const comoB = (q, v) => H.comoUsuario(b, () => H.db.query(q, v));
  const d = (await comoB(`insert into destaques(dono,nome,itens) values ($1,'Viagem',array[$2::uuid,$3::uuid,$2::uuid]) returning id, itens`, [b, s1, s2])).rows[0];
  ok(d.itens.length === 2, 'ids repetidos saem', d.itens);
  let e1 = null; try { await comoB(`delete from publicacoes where id=$1`, [s1]) } catch (e) { e1 = e.message } ok(/story em destaque/.test(e1 || ''), 'apagar story em destaque é recusado (app antigo)');
  await comoB(`update destaques set itens=array[$1::uuid] where id=$2`, [s2, d.id]); await comoB(`delete from publicacoes where id=$1`, [s1]);
  ok((await H.sql(`select count(*)::int n from publicacoes where id=$1`, [s1]))[0].n === 0, 'tirando do destaque, apaga normal');
  // id morto (story apagado por outro caminho): o destaque continua editável
  await H.sql(`alter table publicacoes disable trigger pub_protege_destaque`); await H.sql(`delete from publicacoes where id=$1`, [s2]); await H.sql(`alter table publicacoes enable trigger pub_protege_destaque`);
  const r = (await comoB(`update destaques set nome='Viagem 2' where id=$1 returning itens`, [d.id])).rows[0]; ok(r.itens.length === 0, 'renomear tira o id morto em vez de dar erro', r.itens);
  const r2 = (await comoB(`update destaques set itens=array[$1::uuid] where id=$2 returning itens`, [s3, d.id])).rows[0]; ok(r2.itens.length === 1, 'pôr outro story depois funciona');
  let e2 = null; try { await comoB(`update destaques set itens=array[$1::uuid] where id=$2`, [p1, d.id]) } catch (e) { e2 = e.message } ok(/proprio dono/.test(e2 || ''), 'post (não story) continua recusado');
  // fixado: hora do servidor, não muda depois
  await comoB(`update publicacoes set fixado=1 where id=$1`, [p1]); const f1 = (await H.sql(`select fixado from publicacoes where id=$1`, [p1]))[0].fixado;
  await comoB(`update publicacoes set fixado=9000000000000000 where id=$1`, [p1]); const f2 = (await H.sql(`select fixado from publicacoes where id=$1`, [p1]))[0].fixado;
  ok(+f1 > 1e12 && String(f1) === String(f2), 'hora de fixar é do servidor e não muda', [f1, f2]);
  // excluir a conta apaga tudo, mesmo com story em destaque
  await H.sql(`delete from membros where uid=$1`, [b]);
  ok((await H.sql(`select count(*)::int n from publicacoes where autor=$1`, [b]))[0].n === 0, 'excluir a conta apaga stories em destaque também');
  const R = U.resumo(); console.log(`\nRESUMO t_sqlv5: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); process.exit(2) });
