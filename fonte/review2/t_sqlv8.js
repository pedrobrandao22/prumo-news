// SQL v8: foto de perfil, arquivar post, curtir comentário (post e notícia) e reações de mensagem apagada (C25)
const U = require('../t_util'); const { ok } = U; const fs = require('fs'), path = require('path');
(async () => {
  // Storage falso (o banco dos testes não tem) para conferir as regras dos arquivos
  const fake = `create schema if not exists storage; create table if not exists storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, metadata jsonb, created_at timestamptz default now());
    create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    alter table storage.objects enable row level security; grant usage on schema storage to authenticated, anon; grant select, delete on storage.objects to authenticated;
    grant execute on function storage.foldername(text) to authenticated;`;
  const raiz = path.join(__dirname, '..'), ler = f => fs.readFileSync(path.join(raiz, f), 'utf8');
  const v8 = ler('sql/publicacoes-v8.sql');
  const tmp = path.join(raiz, 'review3', 'var', 'sqlv8.sql'); fs.mkdirSync(path.dirname(tmp), { recursive: true });
  // banco de hoje (já com a v8 sem o Storage) + v6 + v8 inteira de novo + v7 rodada de novo DEPOIS (fora de ordem)
  fs.writeFileSync(tmp, [fake, ler('prumo-supabase.sql'), ler('publicacoes-v6.sql'), v8, ler('sql/publicacoes-v7.sql')].join('\n'));
  const H = await require('../harness').criar({ sql: tmp });
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456'), c = await H.criarConta('c@x', '123456'), d = await H.criarConta('d@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro'),($3,'Caio','membro'),($4,'Dani','membro')`, [a, b, c, d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($2,$3,'aceita')`, [a, b, c]); // Pedro–Bia e Bia–Caio; Pedro e Caio não; Dani sem amigos
  const como = (u, q, p) => H.comoUsuario(u, () => H.db.query(q, p)).then(r => r.rows);
  const erro = async (u, q, p) => { try { await como(u, q, p); return null } catch (e) { return e.code || e.message } };

  /* ---------- 1. foto de perfil ---------- */
  await como(b, `select public.mudar_foto($1)`, [b + '/perfil1.jpg']);
  ok((await H.sql(`select foto from membros where uid=$1`, [b]))[0].foto === b + '/perfil1.jpg', 'foto: a pessoa põe a própria foto');
  ok(!!(await erro(b, `select public.mudar_foto($1)`, [a + '/x.jpg'])), 'foto: não aceita arquivo da pasta de outro');
  ok(!!(await erro(b, `select public.mudar_foto($1)`, [b + '/../x.jpg'])), 'foto: não aceita caminho com ..');
  ok(!!(await erro(b, `update membros set foto=$1 where uid=$2`, [b + '/y.jpg', b])), 'foto: não dá para gravar direto na tabela');
  ok(!!(await erro(null, `select public.mudar_foto('x')`)), 'foto: sem login não chama');
  ok((await como(a, `select foto from membros where uid=$1`, [b]))[0]?.foto === b + '/perfil1.jpg', 'foto: amigo vê a foto (quem vê o nome)');
  ok((await como(d, `select foto from membros where uid=$1`, [b])).length === 0, 'foto: quem não vê o nome não vê a foto');
  for (const [n, dias] of [['perfil1.jpg', 3], ['velha.jpg', 3], ['p1.jpg', 0]])
    await H.sql(`insert into storage.objects(bucket_id,name,metadata,created_at) values ('fotos',$1,'{"size":100}'::jsonb, now() - ($2 || ' days')::interval)`, [b + '/' + n, String(dias)]);
  const abre = async (u, n) => (await como(u, `select name from storage.objects where name=$1`, [n])).length;
  ok(await abre(a, b + '/perfil1.jpg') === 1 && await abre(c, b + '/perfil1.jpg') === 1, 'foto: o arquivo abre para amigos (mesmo com a v7 rodada depois)');
  ok(await abre(d, b + '/perfil1.jpg') === 0, 'foto: o arquivo não abre para quem não vê a pessoa');
  const orf = (await como(a, `select nome from public.admin_midias_orfas(50)`)).map(r => r.nome);
  ok(orf.includes(b + '/velha.jpg') && !orf.includes(b + '/perfil1.jpg'), 'foto: a limpeza do administrador não trata a foto do perfil como sobra', orf);
  ok((await como(a, `delete from storage.objects where name=$1 returning 1`, [b + '/perfil1.jpg'])).length === 0, 'foto: administrador não apaga a foto do perfil');
  await como(b, `select public.mudar_foto(null)`); ok((await H.sql(`select foto from membros where uid=$1`, [b]))[0].foto === null, 'foto: tirar a foto');
  await como(b, `select public.mudar_foto($1)`, [b + '/perfil1.jpg']);

  /* ---------- 2. arquivar post ---------- */
  const post = async (u, extra = {}) => (await como(u, `insert into publicacoes(autor,tipo,texto,fotos,publico) values ($1,$2,'x',$3::jsonb,$4) returning id`, [u, extra.tipo || 'post', JSON.stringify(extra.fotos || []), extra.publico || 'amigos']))[0].id;
  const vePub = async (u, id) => (await como(u, `select id, arquivado, fixado from publicacoes where id=$1`, [id]))[0] || null;
  const p1 = await post(b, { fotos: [b + '/p1.jpg'] });
  ok(!!await vePub(a, p1) && await abre(a, b + '/p1.jpg') === 1, 'arquivar: antes, o amigo vê o post e a foto');
  await como(b, `update publicacoes set fixado=1 where id=$1`, [p1]);
  ok((await como(b, `select public.pub_arquivar($1,true) r`, [p1]))[0].r === true, 'arquivar: o autor arquiva');
  ok(!(await vePub(a, p1)) && await abre(a, b + '/p1.jpg') === 0, 'arquivar: o amigo deixa de ver o post e a foto (servidor)');
  const meu = await vePub(b, p1); ok(meu && meu.arquivado === true && meu.fixado === null, 'arquivar: o autor continua vendo, marcado como arquivado e sem fixar', meu);
  ok(!!(await erro(a, `insert into pub_reacoes(pub,uid,tipo) values ($1,$2,'curtida')`, [p1, a])), 'arquivar: amigo não curte post arquivado');
  ok((await como(a, `select public.pub_arquivar($1,false) r`, [p1]))[0].r === false && (await H.sql(`select arquivado from publicacoes where id=$1`, [p1]))[0].arquivado === true, 'arquivar: outra pessoa não mexe');
  ok(!!(await erro(b, `update publicacoes set arquivado=false where id=$1`, [p1])), 'arquivar: só pela função (sem gravar direto)');
  await como(b, `select public.pub_arquivar($1,false)`, [p1]);
  ok(!!(await vePub(a, p1)) && !!(await vePub(c, p1)), 'arquivar: "Mostrar no perfil" volta para os amigos');
  const s1 = await post(b, { tipo: 'story' }); ok((await como(b, `select public.pub_arquivar($1,true) r`, [s1]))[0].r === false, 'arquivar: story não se arquiva (tem o Arquivo próprio)');
  const pm = await post(b, { publico: 'proximos' }); ok(!(await vePub(a, pm)), 'regras de antes: Melhores amigos continua valendo');
  await como(b, `insert into melhores_amigos(dono,amigo) values ($1,$2)`, [b, a]); ok(!!(await vePub(a, pm)), 'regras de antes: na lista de Melhores amigos, vê');
  await H.sql(`update publicacoes set expira=1 where id=$1`, [s1]); ok(!(await vePub(a, s1)) && !!(await vePub(b, s1)), 'regras de antes: story vencido some para o amigo');
  ok(!(await vePub(d, p1)), 'regras de antes: quem não é amigo não vê');
  const pols = (await H.sql(`select policyname, permissive from pg_policies where tablename='publicacoes' and cmd='SELECT' order by 1`)).map(r => r.policyname + ':' + r.permissive);
  ok(JSON.stringify(pols.filter(x => x !== 'pub_agendada:RESTRICTIVE')) === JSON.stringify(['pub_arquivado:RESTRICTIVE', 'pub_ler:PERMISSIVE']) /* a v12 acrescenta pub_agendada (colunas agendadas) */, 'regras: a do arquivado continua depois de rodar a v7 de novo', pols);

  /* ---------- 3. curtir comentário ---------- */
  const p2 = await post(b);
  await como(b, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','c1','{"texto":"Que foto"}')`, [p2, b]);
  await como(c, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','c9','{"texto":"Oi"}')`, [p2, c]);
  const curtir = (u, autor, cid, pub, uid) => como(u, `insert into com_curtidas(autor,cid,pub,uid,at) values ($1,$2,$3,$4,1) returning at`, [autor, cid, pub, uid || u]);
  const r1 = await curtir(a, b, 'c1', p2); ok(r1.length === 1 && Math.abs(+r1[0].at - Date.now()) < 60000, 'curtir: amigo curte comentário, com a hora do servidor');
  ok(/23505/.test(await erro(a, `insert into com_curtidas(autor,cid,pub,uid) values ($1,'c1',$2,$3)`, [b, p2, a]) || ''), 'curtir: uma curtida por pessoa por comentário');
  ok(!!(await erro(d, `insert into com_curtidas(autor,cid,pub,uid) values ($1,'c1',$2,$3)`, [b, p2, d])), 'curtir: quem não vê o post não curte');
  ok(!!(await erro(a, `insert into com_curtidas(autor,cid,pub,uid) values ($1,'nao-existe',$2,$3)`, [b, p2, a])), 'curtir: comentário que não existe não leva curtida');
  ok(!!(await erro(a, `insert into com_curtidas(autor,cid,pub,uid) values ($1,'c1',$2,$3)`, [b, p2, c])), 'curtir: ninguém curte em nome de outro');
  ok(!!(await erro(a, `insert into com_curtidas(autor,cid,pub,uid) values ($1,'c1',$2,$3)`, [c, p2, a])), 'curtir: autor trocado (comentário de outra pessoa) é recusado');
  await curtir(c, b, 'c1', p2); await curtir(a, c, 'c9', p2); // Pedro curte o comentário do Caio (que não é amigo dele) no post da Bia
  const conta = async (u, cid) => +(await como(u, `select count(*) n from com_curtidas where cid=$1`, [cid]))[0].n;
  ok(await conta(c, 'c1') === 2 && await conta(a, 'c1') === 2 && await conta(b, 'c1') === 2, 'curtir: quem vê o comentário vê todas as curtidas');
  ok(await conta(d, 'c1') === 0, 'curtir: quem não vê o post não vê as curtidas');
  ok(await conta(c, 'c9') === 1, 'curtir: o autor do comentário (Caio) vê a curtida de quem não é amigo dele');
  ok((await como(c, `delete from com_curtidas where cid='c1' and uid=$1 returning 1`, [a])).length === 0, 'curtir: não tira a curtida dos outros');
  ok((await como(c, `delete from com_curtidas where cid='c1' and uid=$1 returning 1`, [c])).length === 1, 'curtir: tira a própria');
  ok(!!(await erro(a, `update com_curtidas set at=0`)), 'curtir: não dá para mudar uma curtida');
  // comentário de notícia (documento comentarios/<pessoa>)
  await como(b, `select public.doc_mesclar($1, $2::jsonb)`, ['comentarios/' + b, JSON.stringify({ itens: { n1: { pid: 'not1', texto: 'Boa análise', at: 1 }, n2: { pid: 'not1', texto: 'Outro', at: 2 } } })]);
  await curtir(a, b, 'n1', null); await curtir(c, b, 'n2', null);
  ok(await conta(c, 'n1') === 1 && await conta(b, 'n1') === 1, 'notícia: amigos da autora veem a curtida');
  ok(await conta(d, 'n1') === 0 && !!(await erro(d, `insert into com_curtidas(autor,cid,uid) values ($1,'n1',$2)`, [b, d])), 'notícia: quem não é amigo não vê nem curte');
  await como(b, `select public.doc_mesclar($1, $2::jsonb)`, ['comentarios/' + b, JSON.stringify({ itens: { n1: null } })]);
  ok(+(await H.sql(`select count(*) n from com_curtidas where cid='n1'`))[0].n === 0 && +(await H.sql(`select count(*) n from com_curtidas where cid='n2'`))[0].n === 1, 'notícia: apagar o comentário apaga só as curtidas dele');
  // limpeza: comentário apagado, post apagado, post arquivado
  await como(b, `delete from pub_reacoes where pub=$1 and uid=$2 and tipo='comentario' and chave='c1'`, [p2, b]);
  ok(+(await H.sql(`select count(*) n from com_curtidas where cid='c1'`))[0].n === 0, 'limpeza: comentário de post apagado leva as curtidas');
  const p3 = await post(b); await como(b, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','c3','{"texto":"x"}')`, [p3, b]); await curtir(a, b, 'c3', p3);
  await como(b, `select public.pub_arquivar($1,true)`, [p3]);
  ok(await conta(a, 'c3') === 0 && await conta(b, 'c3') === 1, 'limpeza: post arquivado esconde as curtidas dos comentários (o autor ainda vê)');
  await como(b, `delete from publicacoes where id=$1`, [p3]);
  ok(+(await H.sql(`select count(*) n from com_curtidas where cid='c3'`))[0].n === 0, 'limpeza: post apagado leva as curtidas dos comentários');
  // limite contra enxurrada
  const muitos = {}; for (let i = 0; i < 65; i++) muitos['m' + i] = { pid: 'not2', texto: 'c' + i, at: i };
  await como(b, `select public.doc_mesclar($1, $2::jsonb)`, ['comentarios/' + b, JSON.stringify({ itens: muitos })]);
  let lim = null, feitas = 0; for (let i = 0; i < 65 && !lim; i++) { const e = await erro(c, `insert into com_curtidas(autor,cid,uid) values ($1,$2,$3)`, [b, 'm' + i, c]); if (e) lim = e; else feitas++ }
  ok(lim === '54000' && feitas >= 58 && feitas <= 60, 'limite: no máximo 60 curtidas por minuto', [lim, feitas]);

  /* ---------- 4. mensagem apagada leva as reações (C25) ---------- */
  const msg = async (de, para, extra = {}) => (await como(de, `insert into mensagens(de,para,texto,tipo,snap) values ($1,$2,$3,$4,$5::jsonb) returning id`, [de, para, extra.texto || 'oi', extra.tipo || null, extra.snap ? JSON.stringify(extra.snap) : null]))[0].id;
  const m1 = await msg(b, a), m2 = await msg(b, a, { texto: 'outra' });
  const r1m = await msg(a, b, { texto: '❤️', tipo: 'reacao_msg', snap: { ref: m1 } }), r2m = await msg(a, b, { texto: '😂', tipo: 'reacao_msg', snap: { ref: m2 } });
  await como(b, `delete from mensagens where id=$1`, [m1]);
  const resta = async id => +(await H.sql(`select count(*) n from mensagens where id=$1`, [id]))[0].n;
  ok(await resta(r1m) === 0 && await resta(r2m) === 1 && await resta(m2) === 1, 'C25: apagar a mensagem apaga as reações a ela (e só elas)');
  ok(await resta(r2m) === 1 && (await como(b, `delete from mensagens where id=$1 returning 1`, [r2m])).length === 0, 'C25: quem apaga não ganha poder de apagar outras mensagens');
  // órfãs de antes da v8: rodar a v8 de novo limpa
  await H.sql(`alter table mensagens disable trigger msg_apaga_reacoes`); await como(b, `delete from mensagens where id=$1`, [m2]); await H.sql(`alter table mensagens enable trigger msg_apaga_reacoes`);
  ok(await resta(r2m) === 1, 'C25: (simula uma reação órfã de antes da v8)');
  await H.db.exec(v8);
  ok(await resta(r2m) === 0, 'C25: a v8 limpa as reações órfãs (e roda de novo sem erro)');

  /* ---------- 5. excluir a conta ---------- */
  await como(a, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','ca','{"texto":"meu"}')`, [p2, a]); await curtir(b, a, 'ca', p2);
  ok(+(await H.sql(`select count(*) n from com_curtidas where uid=$1 or autor=$1`, [a]))[0].n >= 2, 'conta: Pedro tem curtidas dadas e recebidas');
  await como(a, `select public.mudar_foto($1)`, [a + '/eu.jpg']); await como(a, `select public.excluir_conta()`);
  ok(+(await H.sql(`select count(*) n from com_curtidas where uid=$1 or autor=$1`, [a]))[0].n === 0, 'conta: excluir a conta apaga as curtidas de comentário dadas e recebidas');
  ok((await H.sql(`select foto from membros where uid=$1`, [a]))[0].foto === null, 'conta: e tira a foto');
  const R = U.resumo(); console.log(`\nRESUMO t_sqlv8: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); process.exit(2) });
