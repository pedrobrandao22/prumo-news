// SQL v9: seguir perfis abertos (regras do banco) e colunas longas
const U = require('../t_util'); const { ok } = U; const fs = require('fs'), path = require('path');
(async () => {
  // Storage falso (o banco dos testes não tem) para conferir a regra da foto de perfil aberto
  const fake = `create schema if not exists storage; create table if not exists storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, metadata jsonb, created_at timestamptz default now());
    create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    alter table storage.objects enable row level security; grant usage on schema storage to authenticated, anon; grant select, delete on storage.objects to authenticated;
    grant execute on function storage.foldername(text) to authenticated;`;
  const raiz = path.join(__dirname, '..'), ler = f => fs.readFileSync(path.join(raiz, f), 'utf8');
  const tmp = path.join(raiz, 'review3', 'var', 'sqlv9.sql'); fs.mkdirSync(path.dirname(tmp), { recursive: true });
  // banco de hoje (já com a v9 sem o Storage) + v6 + v8 e v7 rodadas de novo (fora de ordem) + a v9 inteira por último, duas vezes
  fs.writeFileSync(tmp, [fake, ler('prumo-supabase.sql'), ler('publicacoes-v6.sql'), ler('sql/publicacoes-v8.sql'), ler('sql/publicacoes-v7.sql'), ler('sql/publicacoes-v9.sql'), ler('sql/publicacoes-v9.sql')].join('\n'));
  const H = await require('../harness').criar({ sql: tmp });
  const ids = []; for (const x of ['a', 'b', 'c', 'd', 'e']) ids.push(await H.criarConta(x + '@x', '123456'));
  const [A, B, C, D, E] = ids;
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro'),($3,'Caio','membro'),($4,'Dani','membro'),($5,'Edu','membro')`, ids);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($2,$3,'aceita')`, [A, B, C]); // Pedro–Bia, Bia–Caio; Dani e Edu sem amigos
  const como = (u, q, p) => H.comoUsuario(u, () => H.db.query(q, p)).then(r => r.rows);
  const erro = async (u, q, p) => { try { await como(u, q, p); return null } catch (x) { return x.code || x.message } };
  const um = async (u, q, p) => (await como(u, q, p))[0];

  /* ---------- 1. perfil aberto ---------- */
  ok((await H.sql(`select perfil_aberto from membros where uid=$1`, [B]))[0].perfil_aberto === false, 'perfil: começa fechado');
  ok(!!(await erro(B, `update membros set perfil_aberto=true where uid=$1`, [B])), 'perfil: não grava direto na tabela');
  ok(!!(await erro(null, `select public.mudar_perfil_aberto(true)`)), 'perfil: sem login não muda');
  ok(/42501/.test(await erro(D, `select public.seguir($1)`, [B]) || ''), 'seguir: perfil fechado não pode ser seguido');
  await como(B, `select public.mudar_perfil_aberto(true)`);
  ok((await H.sql(`select perfil_aberto from membros where uid=$1`, [B]))[0].perfil_aberto === true, 'perfil: a própria pessoa abre');

  /* ---------- 2. seguir ---------- */
  ok((await um(D, `select public.seguir($1) r`, [B])).r === 'ok', 'seguir: Dani segue a Bia (perfil aberto)');
  ok((await um(D, `select public.seguir($1) r`, [B])).r === 'ja', 'seguir: de novo responde "já"');
  ok(!!(await erro(D, `select public.seguir($1)`, [D])), 'seguir: não segue a si mesma');
  ok(!!(await erro(D, `insert into seguidores(seguidor,seguido) values ($1,$2)`, [D, A])), 'seguir: não grava direto na tabela');
  ok(!!(await erro(E, `select public.seguir($1)`, [A])), 'seguir: perfil fechado do Pedro, não');
  ok((await como(E, `select * from seguidores`)).length === 0, 'seguidores: quem não está na linha não vê');
  ok((await como(B, `select seguidor from seguidores`)).map(r => r.seguidor).join() === D, 'seguidores: a Bia vê quem a segue');

  /* ---------- 3. quem lê o quê ---------- */
  const post = async (u, x = {}) => (await como(u, `insert into publicacoes(autor,tipo,texto,fotos,publico) values ($1,$2,'x',$3::jsonb,$4) returning id`, [u, x.tipo || 'post', JSON.stringify(x.fotos || []), x.publico || 'amigos']))[0].id;
  const ve = async (u, id) => (await como(u, `select id from publicacoes where id=$1`, [id])).length === 1;
  const ps = await post(B, { publico: 'seguidores', fotos: [B + '/s1.jpg'] }), pa = await post(B), pm = await post(B, { publico: 'proximos' }), st = await post(B, { tipo: 'story', publico: 'seguidores' });
  const rl = await post(B, { tipo: 'reel', publico: 'seguidores' });
  ok(await ve(D, ps) && await ve(D, rl), 'seguidor vê o post e o reel "para seguidores" do perfil aberto');
  ok(!(await ve(E, ps)), 'quem não segue não vê o post para seguidores');
  ok(await ve(A, ps) && await ve(C, ps), 'amigos veem o post para seguidores');
  ok(!(await ve(D, pa)), 'seguidor não vê o post só para amigos');
  ok(!(await ve(D, pm)), 'seguidor não vê o post de Melhores amigos');
  ok(!(await ve(D, st)) && await ve(A, st), 'story nunca vai para seguidores (o amigo vê)');
  await H.sql(`insert into storage.objects(bucket_id,name,metadata) values ('fotos',$1,'{"size":10}')`, [B + '/s1.jpg']);
  const abre = async (u, n) => (await como(u, `select name from storage.objects where name=$1`, [n])).length;
  ok(await abre(D, B + '/s1.jpg') === 1 && await abre(E, B + '/s1.jpg') === 0, 'a foto do post abre para o seguidor e não para quem não segue');
  // curtir e comentar no post para seguidores
  await como(D, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','d1','{"texto":"Boa"}')`, [ps, D]);
  await como(D, `insert into pub_reacoes(pub,uid,tipo) values ($1,$2,'curtida')`, [ps, D]);
  ok((await como(B, `select uid from pub_reacoes where pub=$1`, [ps])).length === 2, 'seguidor curte e comenta; a autora vê');
  ok(!!(await erro(E, `insert into pub_reacoes(pub,uid,tipo) values ($1,$2,'curtida')`, [ps, E])), 'quem não segue não curte');
  await como(B, `insert into com_curtidas(autor,cid,pub,uid) values ($1,'d1',$2,$3)`, [D, ps, B]);
  ok((await como(D, `select uid from com_curtidas where cid='d1'`)).length === 1, 'curtida no comentário do seguidor aparece para ele');
  // Melhores amigos continua igual
  await como(B, `insert into melhores_amigos(dono,amigo) values ($1,$2)`, [B, A]);
  ok(await ve(A, pm) && !(await ve(C, pm)), 'Melhores amigos: só quem está na lista (igual a antes)');
  // arquivado
  await como(B, `select public.pub_arquivar($1,true)`, [ps]);
  ok(!(await ve(D, ps)) && !(await ve(A, ps)) && await ve(B, ps), 'arquivado: some para seguidor e amigos, fica com a autora');
  await como(B, `select public.pub_arquivar($1,false)`, [ps]);
  ok(await ve(D, ps), 'mostrar no perfil: volta para o seguidor');
  // fechar o perfil
  await como(B, `select public.mudar_perfil_aberto(false)`);
  ok(!(await ve(D, ps)) && await ve(A, ps), 'perfil fechado: o seguidor deixa de ver (amigos continuam)');
  ok(!!(await erro(E, `select public.seguir($1)`, [B])), 'perfil fechado: ninguém novo segue');
  await como(B, `select public.mudar_perfil_aberto(true)`);
  ok(await ve(D, ps), 'perfil aberto de novo: o seguidor volta a ver');

  /* ---------- 4. listas e busca ---------- */
  const cont = async (u, alvo) => (await um(u, `select public.seg_contagem($1) r`, [alvo])).r;
  let k = await cont(E, B); ok(k.ok && k.aberto && k.seguidores === 1 && k.seguindo === 0 && k.sigo === false, 'contagem de um perfil aberto', k);
  k = await cont(D, B); ok(k.sigo === true, 'contagem: "sigo" para quem segue');
  k = await cont(E, A); ok(k.ok === false, 'contagem: perfil fechado de quem não conheço não abre', k);
  k = await cont(D, D); ok(k.ok && k.seguindo === 1, 'contagem: a própria');
  const lista = async (u, alvo, t) => (await como(u, `select * from public.seg_lista($1,$2)`, [alvo, t]));
  let l = await lista(B, B, 'seguidores'); ok(l.length === 1 && l[0].uid === D && l[0].nome === 'Dani' && +l[0].at > 0, 'lista: a Bia vê o nome de quem a segue');
  l = await lista(E, B, 'seguidores'); ok(l.length === 0, 'lista: de outro perfil, só quem eu já veria (Dani é fechada e desconhecida)');
  await como(D, `select public.mudar_perfil_aberto(true)`);
  l = await lista(E, B, 'seguidores'); ok(l.length === 1 && l[0].aberto === true, 'lista: perfil aberto aparece na lista dos outros');
  await como(D, `select public.mudar_perfil_aberto(false)`);
  l = await lista(D, D, 'seguindo'); ok(l.length === 1 && l[0].nome === 'Bia', 'lista: quem eu sigo, com nome');
  let r = await como(E, `select * from public.perfis_abertos('bi')`); ok(r.length === 1 && r[0].nome === 'Bia' && Object.keys(r[0]).sort().join() === 'foto,nome,sigo,uid', 'busca: acha o perfil aberto (só nome, foto e "sigo")', r);
  r = await como(E, `select * from public.perfis_abertos('')`); ok(r.length === 1, 'busca vazia: só perfis abertos');
  r = await como(E, `select * from public.perfis_abertos('ped')`); ok(r.length === 0, 'busca: perfil fechado não aparece');
  ok((await como(E, `select uid from membros where uid=$1`, [B])).length === 0, 'perfil aberto não abre a linha inteira da pessoa (membros continua igual)');
  await H.sql(`update membros set foto=$1 where uid=$2`, [B + '/perfil.jpg', B]);
  await H.sql(`insert into storage.objects(bucket_id,name,metadata) values ('fotos',$1,'{"size":10}')`, [B + '/perfil.jpg']);
  ok(await abre(E, B + '/perfil.jpg') === 1, 'foto de perfil aberto abre para qualquer membro');
  await como(B, `select public.mudar_perfil_aberto(false)`); ok(await abre(E, B + '/perfil.jpg') === 0, 'foto: com o perfil fechado, não');
  await como(B, `select public.mudar_perfil_aberto(true)`);

  /* ---------- 5. deixar de seguir, tirar seguidor e bloquear ---------- */
  await como(E, `select public.seguir($1)`, [B]);
  await como(B, `select public.tirar_seguidor($1)`, [E]); ok(!(await ve(E, ps)), 'tirar seguidor: Edu deixa de ver');
  await como(E, `select public.seguir($1)`, [B]); await como(E, `select public.deixar_de_seguir($1)`, [B]);
  ok((await H.sql(`select count(*) n from seguidores where seguidor=$1`, [E]))[0].n == 0, 'deixar de seguir');
  await como(E, `select public.seguir($1)`, [B]);
  ok(!!(await erro(B, `select public.seguir($1)`, [E])), 'seguir de volta: só se o perfil de quem segue também for aberto');
  await como(E, `select public.mudar_perfil_aberto(true)`); await como(B, `select public.seguir($1)`, [E]);
  ok((await H.sql(`select count(*) n from seguidores where (seguidor=$1 and seguido=$2) or (seguidor=$2 and seguido=$1)`, [B, E]))[0].n == 2, 'os dois se seguem');
  await como(B, `select public.bloquear($1)`, [E]);
  ok((await H.sql(`select count(*) n from seguidores where $1 in (seguidor,seguido) and $2 in (seguidor,seguido)`, [B, E]))[0].n == 0, 'bloquear: desfaz o seguir dos dois lados');
  ok(!!(await erro(E, `select public.seguir($1)`, [B])) && !!(await erro(B, `select public.seguir($1)`, [E])), 'bloquear: ninguém segue de novo');
  ok((await como(E, `select * from public.perfis_abertos('bia')`)).length === 0, 'bloquear: some da busca de perfis abertos');
  await como(B, `select public.desbloquear($1)`, [E]);

  /* ---------- 6. coluna ---------- */
  const col = (u, estilo, corpo) => como(u, `insert into publicacoes(autor,tipo,texto,estilo,corpo) values ($1,'post','Título',$2::jsonb,$3) returning id`, [u, JSON.stringify(estilo), corpo]);
  const longo = 'Palavra '.repeat(4900);   // ~39 mil caracteres
  ok((await col(B, { v: 2, coluna: { v: 1, tit: 'Uma coluna', linha: 'Linha fina' } }, longo)).length === 1, 'coluna: texto longo (39 mil caracteres) na coluna própria');
  ok(!!(await erro(B, `insert into publicacoes(autor,tipo,texto,estilo,corpo) values ($1,'post','x',$2::jsonb,$3)`, [B, JSON.stringify({ coluna: { tit: 'x' } }), 'a'.repeat(40001)])), 'coluna: mais de 40 mil não entra');
  ok(!!(await erro(B, `insert into publicacoes(autor,tipo,texto,corpo) values ($1,'post','x','texto')`, [B])), 'coluna: texto longo só em coluna');
  ok(!!(await erro(B, `insert into publicacoes(autor,tipo,texto,estilo) values ($1,'post','x',$2::jsonb)`, [B, JSON.stringify({ coluna: { tit: 'x'.repeat(91) } })])), 'coluna: título acima de 90 não entra');
  ok(!!(await erro(B, `insert into publicacoes(autor,tipo,texto,estilo) values ($1,'post','x',$2::jsonb)`, [B, JSON.stringify({ coluna: { tit: '' } })])), 'coluna: sem título não entra');
  ok(!!(await erro(B, `insert into publicacoes(autor,tipo,texto,estilo) values ($1,'post','x',$2::jsonb)`, [B, JSON.stringify({ coluna: { tit: 'x', linha: 'l'.repeat(161) } })])), 'coluna: linha fina acima de 160 não entra');
  ok(!!(await erro(B, `insert into publicacoes(autor,tipo,texto,estilo,expira) values ($1,'story','x',$2::jsonb,null)`, [B, JSON.stringify({ coluna: { tit: 'x' } })])), 'coluna: só em post');
  ok((await col(B, { v: 2, coluna: { v: 1, tit: 'Curta', corpo: 'c'.repeat(5000) } }, null)).length === 1, 'coluna do app antigo (texto no estilo, até 6 mil) continua entrando');
  const cid = (await col(B, { v: 2, coluna: { v: 1, tit: 'Editar' } }, 'abc'))[0].id;
  await como(B, `update publicacoes set texto='novo' where id=$1`, [cid]); ok((await H.sql(`select texto from publicacoes where id=$1`, [cid]))[0].texto === 'novo', 'coluna: editar a legenda continua funcionando');

  /* ---------- 7. excluir a conta ---------- */
  await como(D, `select public.excluir_conta()`);
  ok((await H.sql(`select count(*) n from seguidores where $1 in (seguidor,seguido)`, [D]))[0].n == 0, 'excluir a conta: sai das listas de seguir');
  k = await cont(B, B); ok(k.seguidores === 0, 'excluir a conta: a contagem da Bia baixa');

  /* ---------- 8. estrutura ---------- */
  const pols = (await H.sql(`select policyname, permissive from pg_policies where tablename='publicacoes' and cmd='SELECT' order by 1`)).map(x => x.policyname + ':' + x.permissive);
  ok(JSON.stringify(pols) === JSON.stringify(['pub_agendada:RESTRICTIVE', 'pub_arquivado:RESTRICTIVE', 'pub_ler:PERMISSIVE']), 'regras: a do arquivado continua (e a da coluna agendada, v12)', pols);
  ok((await H.sql(`select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='seguidores'`)).length === 1, 'tempo real: seguidores');
  const anon = await H.sql(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname = any($1) and has_function_privilege('anon', p.oid, 'execute')`, [['seguir', 'deixar_de_seguir', 'tirar_seguidor', 'perfis_abertos', 'seg_contagem', 'seg_lista', 'mudar_perfil_aberto', 've_como_seguidor', 'foto_de_perfil_aberto']]);
  ok(anon.length === 0, 'funções novas fora do alcance do anon', anon);
  // banco antigo (antes da v9) recebe a v9 sem erro
  const H2 = await require('../harness').criar({ sql: (() => { const t2 = path.join(raiz, 'review3', 'var', 'sqlv9b.sql'); fs.writeFileSync(t2, [fake, ler('prumo-supabase.antes-v9.sql'), ler('sql/publicacoes-v9.sql')].join('\n')); return t2 })() });
  ok((await H2.sql(`select count(*) n from information_schema.columns where table_name='publicacoes' and column_name='corpo'`))[0].n == 1, 'v9 roda num banco de antes da v9');

  const R = U.resumo(); console.log(`\nRESUMO t_sqlv9: ${R.OKS} ok, ${R.FALHAS} falhas`);
  process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
