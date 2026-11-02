// SQL v6: espaço usado, limpeza de stories velhos, arquivos sem uso e a regra de apagar do administrador
const U = require('../t_util'); const { ok } = U; const fs = require('fs'), path = require('path');
(async () => {
  const fake = `create schema if not exists storage; create table if not exists storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, metadata jsonb, created_at timestamptz default now());
    alter table storage.objects enable row level security; grant usage on schema storage to authenticated, anon; grant select, delete on storage.objects to authenticated;
    create policy dono_le on storage.objects for select to authenticated using (split_part(name, '/', 1) = auth.uid()::text);`;
  const tmp = path.join(__dirname, '..', 'review3', 'var', 'sqlv6.sql');
  fs.writeFileSync(tmp, fake + '\n' + fs.readFileSync(path.join(__dirname, '..', 'prumo-supabase.sql'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, '..', 'publicacoes-v6.sql'), 'utf8'));
  const H = await require('../harness').criar({ sql: tmp });
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456'), c = await H.criarConta('c@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro'),($3,'Caio','membro')`, [a, b, c]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [b, c]); // Pedro NÃO é amigo de Bia
  const velho = Date.now() - 40 * 864e5;
  const ins = async (autor, tipo, fotos, extra = '') => (await H.sql(`insert into publicacoes(autor,tipo,texto,fotos,estilo) values ($1,$2,'x',$3::jsonb,'{"v":2}'::jsonb) returning id`, [autor, tipo, JSON.stringify(fotos)]))[0].id;
  const p1 = await ins(b, 'post', [b + '/p1.jpg']);
  const s1 = await ins(b, 'story', [b + '/s1.jpg']), s2 = await ins(b, 'story', [b + '/s2.jpg']), s3 = await ins(b, 'story', [b + '/s3.jpg']);
  await H.sql(`update publicacoes set expira=$1, at=$1 where id = any($2)`, [velho, [s1, s2]]);
  await H.sql(`insert into destaques(dono,nome,itens) values ($1,'Viagem',array[$2::uuid])`, [b, s2]);
  for (const [n, sz, d] of [['p1.jpg', 1000, 3], ['s1.jpg', 2000, 3], ['s2.jpg', 3000, 3], ['s3.jpg', 500, 3], ['orfa.jpg', 7000, 3], ['nova.jpg', 9000, 0]])
    await H.sql(`insert into storage.objects(bucket_id,name,metadata,created_at) values ('fotos',$1,$2::jsonb, now() - ($3 || ' days')::interval)`, [b + '/' + n, JSON.stringify({ size: sz }), String(d)]);
  const comoA = q => H.comoUsuario(a, () => H.db.query(q)), comoB = q => H.comoUsuario(b, () => H.db.query(q));
  let e1 = null; try { await comoB('select public.admin_espaco()') } catch (e) { e1 = e.message } ok(/sem permissão/.test(e1 || ''), 'quem não é admin não vê o espaço');
  const esp = (await comoA('select public.admin_espaco() r')).rows[0].r;
  ok(esp.db_bytes > 0 && esp.tabelas.some(t => t.nome === 'publicacoes'), 'admin vê o tamanho do banco e das tabelas');
  ok(esp.buckets[0].bucket === 'fotos' && +esp.buckets[0].arquivos === 6 && +esp.buckets[0].bytes === 22500, 'arquivos por pasta', esp.buckets);
  ok(+esp.orfas.arquivos === 1 && +esp.orfas.bytes === 7000, 'só a foto sem uso e com mais de 1 dia conta como sobra', esp.orfas);
  ok(+esp.stories_velhos === 1, 'story velho fora de destaque: 1 (o do destaque fica)', esp.stories_velhos);
  // regra de apagar: admin não apaga foto em uso, mesmo de quem ele não vê
  const d1 = await comoA(`delete from storage.objects where name='${b}/p1.jpg' returning 1`); ok(d1.rows.length === 0, 'admin NÃO apaga foto de post em uso (mesmo sem ver o post)');
  const n = (await comoA('select public.admin_limpar_stories() n')).rows[0].n; ok(n === 1, 'limpeza apaga 1 story velho', n);
  ok((await H.sql(`select count(*)::int n from publicacoes where id=$1`, [s2]))[0].n === 1, 'story do destaque continua');
  const orf = (await comoA('select * from public.admin_midias_orfas(50)')).rows.map(r => r.nome).sort();
  ok(JSON.stringify(orf) === JSON.stringify([b + '/orfa.jpg', b + '/s1.jpg'].sort()), 'lista de sobras: a órfã e a foto do story apagado', orf);
  const d2 = await comoA(`delete from storage.objects where name in ('${b}/orfa.jpg','${b}/s1.jpg') returning 1`); ok(d2.rows.length === 2, 'admin apaga as sobras');
  const d3 = await comoB(`delete from storage.objects where name='${b}/s3.jpg' returning 1`); ok(d3.rows.length === 0, 'quem não é admin não apaga pela regra nova');
  const R = U.resumo(); console.log(`\nRESUMO t_sqlv6: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); process.exit(2) });
