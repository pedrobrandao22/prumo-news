// Auditoria de segurança do banco (09/11/2026): cada achado é provado no banco de ANTES (sql/prumo-supabase.antes-seg.sql,
// o estado da v14) e conferido no banco de DEPOIS (prumo-supabase.sql, com sql/seguranca-2026-11-09.sql no fim, rodado de novo).
// Sem navegador. Também confere que os fluxos normais continuam funcionando. Relatório: qa/AUDITORIA-BANCO.md
const U = require('../t_util'); const { ok } = U; const fs = require('fs'), path = require('path');
(async () => {
  const raiz = path.join(__dirname, '..'), ler = f => fs.readFileSync(path.join(raiz, f), 'utf8');
  const SEG = ler('sql/seguranca-2026-11-09.sql'), ANTES = ler('sql/prumo-supabase.antes-seg.sql'), ATUAL = ler('prumo-supabase.sql');
  ok(ATUAL.trim().startsWith((ANTES.trimEnd() + '\n\n' + SEG).trim()) /* versões depois desta (v15…) vêm em seguida */, 'o arquivo de correções está igual no fim do prumo-supabase.sql (e a cópia de antes é o resto)');

  // Storage falso (o banco dos testes não tem) com as regras dos arquivos de produção (v1, v2, v6, v7, v8, v9; a da v14 já está no SQL)
  const fake = `create schema if not exists storage; create table if not exists storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb, created_at timestamptz default now());
    create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    alter table storage.objects enable row level security; grant usage on schema storage to authenticated, anon;
    grant select, insert, delete on storage.objects to authenticated; grant select on storage.objects to anon; grant execute on function storage.foldername(text) to authenticated, anon;`;
  const regrasStorage = `
    create policy fotos_enviar on storage.objects for insert to authenticated with check (bucket_id = 'fotos' and public.e_membro() and (storage.foldername(name))[1] = auth.uid()::text);
    create policy fotos_apagar on storage.objects for delete to authenticated using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
    create policy videos_enviar on storage.objects for insert to authenticated with check (bucket_id = 'videos' and public.e_membro() and (storage.foldername(name))[1] = auth.uid()::text);
    create policy fotos_ler on storage.objects for select to authenticated using (bucket_id = 'fotos' and public.e_membro()
      and ((storage.foldername(name))[1] = auth.uid()::text or exists (select 1 from public.publicacoes p where p.fotos ? storage.objects.name)));
    create policy fotos_perfil_ler on storage.objects for select to authenticated using (bucket_id = 'fotos' and public.e_membro()
      and exists (select 1 from public.membros m where m.foto = storage.objects.name));
    create policy midias_admin_ver on storage.objects for select to authenticated using (
      bucket_id in ('fotos', 'videos') and public.e_admin() and created_at < now() - interval '1 day' and not public.midia_em_uso(name));`;
  const tmp = path.join(raiz, 'review3', 'var'); fs.mkdirSync(tmp, { recursive: true });
  const fa = path.join(tmp, 'seg_antes.sql'), fd = path.join(tmp, 'seg_depois.sql');
  fs.writeFileSync(fa, [fake, ANTES, regrasStorage].join('\n'));
  fs.writeFileSync(fd, [fake, ATUAL, regrasStorage, SEG].join('\n'));   // + correções de novo: pode rodar mais de uma vez

  async function cenario(arq) {
    const H = await require('../harness').criar({ sql: arq });
    const R = {};
    const como = (u, q, p) => H.comoUsuario(u, () => H.db.query(q, p)).then(r => r.rows);
    const erro = async (u, q, p) => { try { await como(u, q, p); return null } catch (e) { return e.code || e.message } };
    const a = await H.criarConta('pedro@exemplo.com', '1'), b = await H.criarConta('bia@exemplo.com', '1'), c = await H.criarConta('caio@exemplo.com', '1'),
      d = await H.criarConta('dani@exemplo.com', '1'), x = await H.criarConta('estranho@exemplo.com', '1');   // x: só criou o login (não é membro)
    await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro'),($3,'Caio','membro'),($4,'Dani','membro')`, [a, b, c, d]);
    await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($2,$3,'aceita')`, [a, b, c]);   // Pedro–Bia, Bia–Caio; Dani sem amigos
    const inscreve = (u, prefs) => como(u, `select public.push_inscrever($1,$2,$3,$4::jsonb,'t')`, ['https://push.exemplo.com/' + u, 'B' + 'p'.repeat(86), 'y'.repeat(22), JSON.stringify(prefs)]);
    // coluna pública da Bia, com capa
    const col = (await H.sql(`insert into publicacoes(autor,tipo,texto,fotos,estilo,publico) values ($1,'post','',$2::jsonb,'{"coluna":{"tit":"Coluna da Bia"}}'::jsonb,'publico') returning id`, [b, JSON.stringify([b + '/capa.jpg'])]))[0].id;
    await H.sql(`insert into storage.objects(bucket_id,name) values ('fotos',$1),('fotos',$2),('fotos',$3)`, [b + '/capa.jpg', a + '/p.jpg', b + '/orfa.jpg']);
    await H.sql(`update storage.objects set created_at = now() - interval '3 days' where name = $1`, [b + '/orfa.jpg']);

    /* ---------- fluxos que têm de continuar funcionando ---------- */
    const pa = (await como(a, `insert into publicacoes(autor,tipo,texto,fotos) values ($1,'post','Post do Pedro',$2::jsonb) returning id`, [a, JSON.stringify([a + '/p.jpg'])]))[0].id;
    R.f_post = !!pa;
    R.f_curtir = !(await erro(b, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'curtida','','{}')`, [pa, b]));
    R.f_curtir_dup = await erro(b, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'curtida','','{}')`, [pa, b]);
    R.f_comentar = !(await erro(b, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','k1','{"texto":"Bom"}')`, [pa, b]));
    R.f_votar = !(await erro(b, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'voto','o1','{"v":1}')`, [pa, b]));
    R.f_msg = !(await erro(b, `insert into mensagens(de,para,texto) values ($1,$2,'oi')`, [b, a]));
    R.f_editar = (await como(a, `update publicacoes set texto='Post do Pedro (editado)' where id=$1 returning 1`, [pa])).length === 1;
    R.f_foto_amigo = (await como(b, `select 1 from storage.objects where name=$1`, [a + '/p.jpg'])).length === 1;
    R.f_foto_estranho = (await como(d, `select 1 from storage.objects where name=$1`, [a + '/p.jpg'])).length === 0;
    R.f_enviar_foto = !(await erro(b, `insert into storage.objects(bucket_id,name) values ('fotos',$1)`, [b + '/nova.jpg']));
    R.f_enviar_foto_outro = !!(await erro(b, `insert into storage.objects(bucket_id,name) values ('fotos',$1)`, [a + '/intrusa.jpg']));
    R.f_capa_anon = (await como(null, `select 1 from storage.objects where name=$1`, [b + '/capa.jpg'])).length === 1
      && (await como(null, `select 1 from storage.objects where name=$1`, [a + '/p.jpg'])).length === 0;
    R.f_colunas_anon = ((await como(null, `select public.colunas_publicas() j`))[0].j || []).length === 1 && (await como(null, `select public.capa_fixa()`)).length === 1
      && !(await erro(null, `select * from public.erros_abertos()`));
    R.f_admin_midia = (await como(a, `select public.midia_em_uso($1) s, public.midia_em_uso('nada/x.jpg') n`, [a + '/p.jpg']))[0];
    R.f_admin_orfa = (await como(a, `select name from storage.objects where name=$1`, [b + '/orfa.jpg'])).length === 1
      && (await como(d, `select name from storage.objects where name=$1`, [b + '/orfa.jpg'])).length === 0;
    R.f_pedir = (await como(d, `select public.pedir_amizade($1) r`, [a]))[0].r === 'pendente' && !(await erro(a, `select public.responder_amizade($1, true)`, [d]));
    await H.sql(`update membros set perfil_aberto = true where uid = $1`, [c]);
    R.f_seguir = (await como(a, `select public.seguir($1) r`, [c]))[0].r === 'ok';
    const cv = (await como(a, `select public.criar_convite() c`))[0].c;
    R.f_entrar = (await como(x, `select public.entrar($1,'Xavier') r`, [cv]))[0].r.ok === true;
    await H.sql(`update membros set suspenso_em = now() where uid = $1`, [x]);   // volta a ser "não membro" para os testes abaixo
    R.f_semente = true; try { for (let i = 0; i < 70; i++) await H.sql(`insert into publicacoes(autor,tipo,texto) values ($1,'post','semente')`, [a]) } catch (e) { R.f_semente = e.message }
    await H.db.exec(`select set_config('request.headers', '{"x-forwarded-for":"200.1.1.1"}', false)`);
    R.f_nl = (await como(null, `select public.newsletter_assinar('leitor@exemplo.com', $1) r`, [col]))[0].r;
    const tk = (await H.sql(`select token from newsletter_assinantes where email='leitor@exemplo.com'`))[0].token;
    R.f_nl_conf = (await como(null, `select public.newsletter_confirmar($1) r`, [tk]))[0].r.ok === true;
    await H.db.exec(`select set_config('request.headers', '', false)`);

    /* ---------- A1: midia_em_uso como oráculo dos rascunhos de qualquer pessoa ---------- */
    await como(b, `insert into coluna_rascunhos(rid,dados) values ('rasc1','{"texto":"o segredo do cofre e 4321"}'::jsonb)`);
    const oraculo = async u => { const r = (await como(u, `select public.midia_em_uso('segredo do cofre') s, public.midia_em_uso('zz-nao-existe-zz') n`))[0]; return r.s !== r.n };
    R.a1 = (await oraculo(x)) || (await oraculo(d));

    /* ---------- A2: newsletter sem limite por endereço de internet nem por dia ---------- */
    await H.db.exec(`select set_config('request.headers', '{"x-forwarded-for":"203.0.113.9, 10.0.0.1"}', false)`);
    let aceitos = 0; for (let i = 0; i < 15; i++) { const e = await erro(null, `select public.newsletter_assinar($1, $2)`, ['vitima' + i + '@exemplo.com', col]); if (!e) aceitos++ }
    R.a2_ip = aceitos;
    await H.db.exec(`select set_config('request.headers', '{"x-forwarded-for":"198.51.100.7"}', false)`);
    R.a2_outro_ip = !(await erro(null, `select public.newsletter_assinar('outra@exemplo.com', $1)`, [col]));
    await H.sql(`insert into newsletter_pedidos(email_h, autora, at) select md5(g::text), $1, now() - interval '2 hours' from generate_series(1, 50) g`, [b]);
    await H.db.exec(`select set_config('request.headers', '', false)`);
    R.a2_dia = !(await erro(null, `select public.newsletter_assinar('mais-uma@exemplo.com', $1)`, [col]));

    /* ---------- A3: pedir amizade/cancelar e seguir/deixar de seguir em ciclo = avisos sem fim ---------- */
    await inscreve(c, { amizades: true, seguidores: true });
    for (let i = 0; i < 55; i++) { if (await erro(d, `select public.pedir_amizade($1)`, [c])) break; await como(d, `select public.desfazer_amizade($1)`, [c]) }
    R.a3_amz = +(await H.sql(`select count(*) n from push_fila where para=$1 and tipo='amizades'`, [c]))[0].n;
    for (let i = 0; i < 155; i++) { if (await erro(d, `select public.seguir($1)`, [c])) break; await como(d, `select public.deixar_de_seguir($1)`, [c]) }
    R.a3_seg = +(await H.sql(`select count(*) n from push_fila where para=$1 and tipo='seguidores' and de=$2`, [c, d]))[0].n;

    /* ---------- A4: publicações sem limite ---------- */
    let pubs = 0; for (let i = 0; i < 65; i++) { if (await erro(d, `insert into publicacoes(autor,tipo,texto) values ($1,'post','spam')`, [d])) break; pubs++ }
    R.a4 = pubs;

    /* ---------- A5: curtidas sem fim na mesma publicação (chave livre) e curtir/descurtir sem freio ---------- */
    let cur = 0; for (let i = 0; i < 5; i++) if (!(await erro(c, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'curtida',$3,$4::jsonb)`, [col, c, 'x' + i, JSON.stringify({ lixo: 'z'.repeat(3000) })]))) cur++;
    R.a5_chave = cur;
    let ciclos = 0; for (let i = 0; i < 205; i++) { if (await erro(c, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'curtida','','{}')`, [col, c])) break; ciclos++; await como(c, `delete from pub_reacoes where pub=$1 and uid=$2 and tipo='curtida'`, [col, c]) }
    R.a5_ciclo = ciclos;

    /* ---------- A7: Storage sem cota de arquivos ---------- */
    await H.sql(`insert into storage.objects(bucket_id,name) select 'fotos', $1 || '/lote' || g || '.jpg' from generate_series(1, 297) g`, [b]);  // + capa, orfa(3 dias), nova = 299 hoje
    R.a7 = 0; for (let i = 0; i < 3; i++) if (!(await erro(b, `insert into storage.objects(bucket_id,name) values ('fotos',$1)`, [b + '/extra' + i + '.jpg']))) R.a7++;

    /* ---------- A8: permissões padrão (o que nasce aberto para anon) ---------- */
    await H.db.exec(`create table public.t_seg_nova(x int); create function public.t_seg_fn() returns int language sql as 'select 1'`);
    R.a8 = (await H.sql(`select has_table_privilege('anon','public.config_app','TRUNCATE') t, has_table_privilege('anon','public.t_seg_nova','SELECT') n,
      has_function_privilege('anon','public.t_seg_fn()','EXECUTE') f`))[0];
    R.a8_auth_fn = (await H.sql(`select has_function_privilege('authenticated','public.t_seg_fn()','EXECUTE') f`))[0].f;
    await H.db.exec(`drop table public.t_seg_nova; drop function public.t_seg_fn()`);

    /* ---------- A9: Security Advisors — search_path ---------- */
    R.a9 = (await H.sql(`select count(*) filter (where not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%')) sem,
        count(*) filter (where p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%pg_temp%')) def
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'`))[0];

    /* ---------- A10: conta suspensa continua editando ---------- */
    const pb = (await como(b, `insert into publicacoes(autor,tipo,texto) values ($1,'post','original') returning id`, [b]))[0].id;
    const dst = (await como(b, `insert into destaques(dono,nome) values ($1,'D') returning id`, [b]))[0].id;
    await H.sql(`update membros set suspenso_em = now() where uid = $1`, [b]);
    // com "where" a regra de leitura já esconde da conta suspensa o que é dela; SEM filtro (PATCH sem filtro no PostgREST)
    // o Postgres não aplica a regra de leitura e a de editar deixava mudar tudo o que é dela
    await como(b, `update publicacoes set texto='editado suspensa'`).catch(() => 0);
    await como(b, `update destaques set nome='X'`).catch(() => 0);
    R.a10 = +(await H.sql(`select (select count(*) from publicacoes where id=$1 and texto='editado suspensa') + (select count(*) from destaques where id=$2 and nome='X') n`, [pb, dst]))[0].n;
    await como(b, `delete from destaques`);
    R.a10_apagar = (await H.sql(`select 1 from destaques where id=$1`, [dst])).length === 0;
    await H.sql(`update membros set suspenso_em = null where uid = $1`, [b]);

    /* ---------- A11: avisos de erro sem limite (e lidos sem login) ---------- */
    let ers = 0; for (let i = 0; i < 25; i++) { if (await erro(d, `insert into erros(texto) values ($1)`, ['aviso ' + i])) break; ers++ }
    R.a11 = ers;

    /* ---------- A12: hora de "quem viu o story" vinda do app ---------- */
    const st = (await como(b, `insert into publicacoes(autor,tipo,texto) values ($1,'story','s') returning id`, [b]))[0].id;
    await como(c, `insert into pub_vistos(pub,uid,at) values ($1,$2,1)`, [st, c]);
    R.a12 = +(await H.sql(`select at from pub_vistos where pub=$1 and uid=$2`, [st, c]))[0].at;

    /* ---------- A13: destaques sem limite ---------- */
    let ds = 0; for (let i = 0; i < 101; i++) { if (await erro(a, `insert into destaques(dono,nome) values ($1,'d')`, [a])) break; ds++ }
    R.a13 = ds;

    /* ---------- A14: função interna chamada direto (até por quem não é membro) ---------- */
    R.a14 = !(await erro(x, `select public.seg11_aberto($1)`, [c]));

    /* ---------- A6: excluir a conta deixa dados pessoais (por último: o Caio sai) ---------- */
    await como(c, `insert into coluna_rascunhos(rid,dados) values ('meu1','{"texto":"rascunho do Caio"}'::jsonb)`);
    await como(c, `select public.coluna_leitura($1,'feed',true,30)`, [col]);
    await como(c, `insert into coluna_assinaturas(autor) values ($1)`, [b]);
    await como(c, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','cc1','{"texto":"comentário do Caio"}')`, [col, c]);
    await como(b, `insert into coluna_destaques(pub,cautor,cid) values ($1,$2,'cc1')`, [col, c]);
    await como(c, `select public.newsletter_membro($1, true, true)`, [b]);
    await como(c, `select public.excluir_conta()`);
    R.a6 = (await H.sql(`select (select count(*) from coluna_rascunhos where autor=$1) + (select count(*) from coluna_leituras where leitor=$1)
        + (select count(*) from coluna_assinaturas where leitor=$1) + (select count(*) from coluna_destaques where cautor=$1)
        + (select count(*) from newsletter_assinantes where email='caio@exemplo.com' or membro=$1) n`, [c]))[0].n;
    R.a6_conta = (await H.sql(`select nome, excluido_em is not null e from membros where uid=$1`, [c]))[0];

    /* ---------- conferências gerais (o que os Advisors e o tempo real olham) ---------- */
    R.g = (await H.sql(`select
        (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity) rls_off,
        (select count(*) from information_schema.views where table_schema='public') views,
        (select count(*) from pg_publication_tables t where t.pubname='supabase_realtime' and not exists (select 1 from pg_policies p where p.schemaname=t.schemaname and p.tablename=t.tablename and p.cmd in ('SELECT','ALL'))) rt_sem_regra,
        (select pubdelete from pg_publication where pubname='supabase_realtime') rt_delete,
        (select string_agg(p.proname, ',' order by p.proname) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef
           and has_function_privilege('anon', p.oid, 'execute') and p.prorettype <> 'trigger'::regtype) anon_definer`))[0];
    return R;
  }

  const A = await cenario(fa), D = await cenario(fd);
  const ANON_OK = 'capa_fixa,coluna_publica,colunas_publicas,erros_abertos,foto_de_coluna_publica,newsletter_assinar,newsletter_cancelar,newsletter_confirmar,tl142_ligado,tl142_registrar';

  /* ---------- deve continuar funcionando (depois) ---------- */
  ok(D.f_post && D.f_curtir && D.f_curtir_dup === '23505' && D.f_comentar && D.f_votar && D.f_msg && D.f_editar, 'continua: post, curtida (repetida dá 23505, como o app espera), comentário, voto, mensagem e editar', D);
  ok(D.f_foto_amigo && D.f_foto_estranho && D.f_enviar_foto && D.f_enviar_foto_outro && D.f_capa_anon, 'continua: fotos (amigo abre, estranho não; envia na própria pasta e não na de outro; capa da coluna pública abre sem login)', D);
  ok(D.f_colunas_anon, 'continua: sem login lê as colunas públicas, a manchete fixada e os avisos de erro (erros_abertos)');
  ok(D.f_admin_midia.s === true && D.f_admin_midia.n === false && D.f_admin_orfa, 'continua: o administrador vê o que está em uso e as sobras para limpar (e só ele)', D.f_admin_midia);
  ok(D.f_pedir && D.f_seguir && D.f_entrar, 'continua: pedir/aceitar amizade, seguir perfil aberto e entrar com convite');
  ok(D.f_semente === true, 'continua: o SQL Editor (sem papel do app) não é freado — 70 posts seguidos', D.f_semente);
  ok(D.f_nl === 'ok' && D.f_nl_conf, 'continua: assinar a newsletter pela página e confirmar');
  ok(D.a2_outro_ip, 'continua: outro endereço de internet ainda assina depois do limite do primeiro');
  ok(D.a10_apagar, 'continua: conta suspensa ainda pode apagar o que é dela');
  ok(D.a6_conta && D.a6_conta.e && D.a6_conta.nome === 'Conta excluída', 'continua: excluir a conta funciona (fica "Conta excluída" para as conversas)', D.a6_conta);
  ok(D.a8_auth_fn === true, 'continua: função nova segue liberada para quem está logado (só o anon perdeu o padrão)');
  ok(+D.g.rls_off === 0 && +D.g.views === 0 && +D.g.rt_sem_regra === 0 && D.g.rt_delete === false, 'geral: RLS ligado em todas as tabelas, nenhuma view, tempo real só com tabelas que têm regra de leitura e sem DELETE', D.g);
  ok(D.g.anon_definer === ANON_OK, 'geral: sem login só se chamam as funções públicas de propósito', D.g.anon_definer);

  /* ---------- achados: vulnerável antes, corrigido depois ---------- */
  const caso = (id, nome, antes, depois, extra) => { ok(antes, `${id} antes: ${nome} (provado)`, extra && extra[0]); ok(depois, `${id} depois: corrigido`, extra && extra[1]) };
  caso('A1', 'conta só logada (ou membro estranho) descobre texto do rascunho de outra pessoa por midia_em_uso', A.a1 === true, D.a1 === false);
  caso('A2', 'mesmo endereço de internet manda 15 pedidos de assinatura (e passa do total do dia)', A.a2_ip === 15 && A.a2_dia, D.a2_ip === 10 && !D.a2_dia, [[A.a2_ip, A.a2_dia], [D.a2_ip, D.a2_dia]]);
  caso('A3', '(a Dani já tinha 1 pedido hoje; o limite é 50 por dia) pedir/cancelar amizade e seguir/deixar em ciclo enche o celular da pessoa de avisos', A.a3_amz === 55 && A.a3_seg === 155, D.a3_amz === 49 && D.a3_seg === 150, [[A.a3_amz, A.a3_seg], [D.a3_amz, D.a3_seg]]);
  caso('A4', 'publicações sem limite (65 seguidas)', A.a4 === 65, D.a4 === 60, [A.a4, D.a4]);
  caso('A5', 'várias curtidas da mesma pessoa no mesmo post (chave livre, 3 KB cada) e curtir/descurtir sem fim', A.a5_chave === 5 && A.a5_ciclo === 205, D.a5_chave === 0 && D.a5_ciclo === 200, [[A.a5_chave, A.a5_ciclo], [D.a5_chave, D.a5_ciclo]]);
  caso('A6', 'excluir a conta deixa rascunho, leituras, assinaturas, cópia do comentário em destaque e e-mail na newsletter', +A.a6 >= 5, +D.a6 === 0, [A.a6, D.a6]);
  caso('A7', 'Storage sem cota (passa de 300 fotos no dia)', A.a7 === 3, D.a7 === 1, [A.a7, D.a7]);
  caso('A8', 'config_app e tabelas/funções novas nascem abertas para anon', A.a8.t && A.a8.n && A.a8.f, !D.a8.t && !D.a8.n && !D.a8.f, [A.a8, D.a8]);
  caso('A9', 'funções com search_path mutável (Advisors) e SECURITY DEFINER sem pg_temp', +A.a9.sem > 0 && +A.a9.def > 0, +D.a9.sem === 0 && +D.a9.def === 0, [A.a9, D.a9]);
  caso('A10', 'conta suspensa edita o próprio post e destaque', A.a10 === 2, D.a10 === 0, [A.a10, D.a10]);
  caso('A11', 'avisos de erro sem limite (25 seguidos; sem login dá para ler)', A.a11 === 25, D.a11 === 10, [A.a11, D.a11]);
  caso('A12', '"quem viu o story" aceita hora inventada pelo app', A.a12 === 1, D.a12 > Date.now() - 3600e3, [A.a12, D.a12]);
  caso('A13', 'destaques sem limite (101)', A.a13 === 101, D.a13 === 100, [A.a13, D.a13]);
  caso('A14', 'função interna seg11_aberto chamada direto por quem nem é membro', A.a14 === true, D.a14 === false);

  const R = U.resumo(); console.log(`\nRESUMO t_seguranca_banco: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
