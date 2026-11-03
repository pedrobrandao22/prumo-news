-- Prumo News · v8: foto de perfil, arquivar post, curtir comentário e reações de mensagem apagada.
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Precisa das versões v2 a v7 já rodadas. Também reafirma as regras finais de quem lê o quê
-- (se alguma versão antiga, inclusive a v7, for rodada de novo depois desta, rode esta outra vez).
-- O app novo funciona antes e depois desta versão: sem ela, só não aparecem os botões novos.

-- 1. Foto do perfil: fica na pasta da própria pessoa (a mesma das fotos dos posts) e só ela troca ou tira
alter table public.membros add column if not exists foto text check (foto is null or char_length(foto) <= 200);
create or replace function public.mudar_foto(p_foto text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); f text := nullif(btrim(coalesce(p_foto, '')), '');
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if f is not null and f !~ ('^' || me::text || '/[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$') then
    raise exception 'foto fora da pasta' using errcode = '22023';
  end if;
  update public.membros set foto = f where uid = me;
end $$;
revoke all on function public.mudar_foto(text) from public, anon;
grant execute on function public.mudar_foto(text) to authenticated;

-- 2. Arquivar post: some para os amigos (o servidor não entrega mais) e continua com o autor, que pode mostrar de novo.
--    É uma regra "restritiva" à parte: soma-se à regra de leitura e não se perde se a v7 for rodada de novo.
alter table public.publicacoes add column if not exists arquivado boolean not null default false;
drop policy if exists pub_arquivado on public.publicacoes;
create policy pub_arquivado on public.publicacoes as restrictive for select to authenticated using (
  not arquivado or autor = auth.uid());
create or replace function public.pub_arquivar(p_id uuid, p_arquivar boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int;
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  -- post arquivado sai também dos fixados (ao voltar, volta sem fixar)
  update public.publicacoes set arquivado = coalesce(p_arquivar, false),
         fixado = case when coalesce(p_arquivar, false) then null else fixado end
   where id = p_id and autor = me and tipo <> 'story';
  get diagnostics n = row_count;
  return n > 0;
end $$;
revoke all on function public.pub_arquivar(uuid, boolean) from public, anon;
grant execute on function public.pub_arquivar(uuid, boolean) to authenticated;

-- 3. Regras finais de quem lê as publicações (as mesmas da v7, reafirmadas; o arquivado vem da regra do passo 2)
drop policy if exists pub_ler on public.publicacoes;
create policy pub_ler on public.publicacoes for select to authenticated using (
  public.e_membro() and (autor = auth.uid() or (public.sao_amigos(auth.uid(), autor)
    and (publico = 'amigos' or exists (select 1 from public.melhores_amigos m where m.dono = autor and m.amigo = auth.uid()))))
  and (tipo <> 'story' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint
       or exists (select 1 from public.destaques d where d.dono = publicacoes.autor and publicacoes.id = any(d.itens))));

-- 4. Curtir comentário (de post de membro ou de notícia): uma curtida por pessoa por comentário.
--    Só quem consegue ver o comentário vê e dá a curtida; cada um tira só a própria.
create table if not exists public.com_curtidas (
  autor uuid not null references public.membros(uid) on delete cascade,     -- quem escreveu o comentário
  cid text not null check (char_length(cid) between 1 and 80),              -- o comentário
  pub uuid references public.publicacoes(id) on delete cascade,             -- o post (vazio = comentário de notícia)
  uid uuid not null references public.membros(uid) on delete cascade,       -- quem curtiu
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (autor, cid, uid)
);
create index if not exists com_curtidas_pub_idx on public.com_curtidas(pub);
create index if not exists com_curtidas_uid_idx on public.com_curtidas(uid, at);
alter table public.com_curtidas enable row level security;
drop policy if exists cc_ler on public.com_curtidas;
create policy cc_ler on public.com_curtidas for select to authenticated using (
  public.e_membro() and case when com_curtidas.pub is null
    then com_curtidas.autor = auth.uid() or public.sao_amigos(auth.uid(), com_curtidas.autor)
    else exists (select 1 from public.publicacoes p where p.id = com_curtidas.pub) end);
drop policy if exists cc_curtir on public.com_curtidas;
create policy cc_curtir on public.com_curtidas for insert to authenticated with check (
  com_curtidas.uid = auth.uid() and public.e_membro() and case when com_curtidas.pub is null
    then (com_curtidas.autor = auth.uid() or public.sao_amigos(auth.uid(), com_curtidas.autor))
      and exists (select 1 from public.docs d where d.path = 'comentarios/' || com_curtidas.autor::text and d.data -> 'itens' ? com_curtidas.cid)
    else exists (select 1 from public.pub_reacoes r where r.pub = com_curtidas.pub and r.uid = com_curtidas.autor
                   and r.tipo = 'comentario' and r.chave = com_curtidas.cid) end);
drop policy if exists cc_tirar on public.com_curtidas;
create policy cc_tirar on public.com_curtidas for delete to authenticated using (com_curtidas.uid = auth.uid());
revoke all on public.com_curtidas from anon, authenticated;
grant select, insert, delete on public.com_curtidas to authenticated;

-- 5. Curtidas de comentário: a hora é a do servidor e há limite contra enxurrada (como os comentários na v7)
create or replace function public.cc_normaliza() returns trigger
language plpgsql security definer set search_path = public as $$
declare agora bigint := (extract(epoch from now())*1000)::bigint;
begin
  new.at := agora;
  if (select count(*) from public.com_curtidas where uid = new.uid and at > agora - 60000) >= 60
     or (select count(*) from public.com_curtidas where uid = new.uid and at > agora - 86400000) >= 3000 then
    raise exception 'curtidas demais' using errcode = '54000';
  end if;
  return new;
end $$;
drop trigger if exists cc_normaliza on public.com_curtidas;
create trigger cc_normaliza before insert on public.com_curtidas for each row execute function public.cc_normaliza();

-- 6. Comentário apagado leva junto as curtidas dele (post apagado e conta excluída também)
create or replace function public.cc_limpa_reac() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.com_curtidas where pub = old.pub and autor = old.uid and cid = old.chave;
  return old;
end $$;
drop trigger if exists cc_limpa_reac on public.pub_reacoes;
create trigger cc_limpa_reac after delete on public.pub_reacoes
  for each row when (old.tipo = 'comentario') execute function public.cc_limpa_reac();
-- comentários de notícia ficam no documento "comentarios/<pessoa>": o que saiu dele perde as curtidas
create or replace function public.cc_limpa_doc() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    delete from public.com_curtidas where autor = old.owner and pub is null;
  elsif new.data is distinct from old.data then
    delete from public.com_curtidas c where c.autor = new.owner and c.pub is null
      and not coalesce(new.data -> 'itens' ? c.cid, false);
  end if;
  return null;
end $$;
drop trigger if exists cc_limpa_doc on public.docs;
create trigger cc_limpa_doc after update or delete on public.docs
  for each row when (old.col = 'comentarios') execute function public.cc_limpa_doc();
revoke all on function public.cc_normaliza(), public.cc_limpa_reac(), public.cc_limpa_doc() from public, anon, authenticated;

-- 7. Excluir a conta apaga também as curtidas de comentário (dadas e recebidas) e a foto do perfil
create or replace function public.excluir_conta() returns void
language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'sem login' using errcode = '28000'; end if;
  delete from public.docs where owner = me or (col = 'lista' and me = any(public.lista_par(path)));
  delete from public.erros where uid = me;
  delete from public.amizades where de = me or para = me;
  delete from public.bloqueios where de = me or para = me;
  delete from public.denuncias where de = me;
  delete from public.convites where criado_por = me and usado_em is null;
  delete from public.destaques where dono = me;
  delete from public.melhores_amigos where dono = me or amigo = me;
  delete from public.com_curtidas where uid = me or autor = me;
  delete from public.pub_reacoes where uid = me;
  delete from public.pub_vistos where uid = me;
  delete from public.publicacoes where autor = me;
  -- as mensagens ficam com quem conversou, mostrando "Conta excluída"; as fotos e vídeos o app apaga antes de chamar esta função
  update public.membros set nome = 'Conta excluída', excluido_em = now(), papel = 'membro', foto = null where uid = me;
  delete from auth.users where id = me;
end $$;
revoke execute on function public.excluir_conta() from public, anon;
grant execute on function public.excluir_conta() to authenticated;

-- 8. Mensagem apagada leva junto as reações a ela (antes ficavam no banco e contavam como não lidas)
create or replace function public.msg_apaga_reacoes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.mensagens where tipo = 'reacao_msg' and snap ->> 'ref' = old.id::text;
  return old;
end $$;
drop trigger if exists msg_apaga_reacoes on public.mensagens;
create trigger msg_apaga_reacoes after delete on public.mensagens
  for each row when (old.tipo is distinct from 'reacao_msg') execute function public.msg_apaga_reacoes();
revoke all on function public.msg_apaga_reacoes() from public, anon, authenticated;
create index if not exists mensagens_reacao_ref_idx on public.mensagens ((snap ->> 'ref')) where tipo = 'reacao_msg';
-- limpeza única: reações a mensagens que já tinham sido apagadas
delete from public.mensagens r where r.tipo = 'reacao_msg' and r.snap ? 'ref'
  and not exists (select 1 from public.mensagens m where m.id::text = r.snap ->> 'ref');

-- 9. Tempo real: curtida nova num comentário chega na hora para quem escreveu (só inserções, como o resto)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'com_curtidas') then
    execute 'alter publication supabase_realtime add table public.com_curtidas';
  end if;
end $$;

-- 10. Arquivos: a foto do perfil abre para quem já vê o nome da pessoa
--     (regra à parte, que se soma às das fotos dos posts e não se perde se a v7 for rodada de novo)
drop policy if exists fotos_perfil_ler on storage.objects;
create policy fotos_perfil_ler on storage.objects for select to authenticated using (
  bucket_id = 'fotos' and public.e_membro()
  and exists (select 1 from public.membros m where m.foto = storage.objects.name));
-- e a limpeza do administrador (v6) não trata a foto do perfil como "arquivo sem uso"
create or replace function public.midia_em_uso(p_nome text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.publicacoes p where p.fotos ? p_nome or p.estilo->>'video' = p_nome)
      or exists (select 1 from public.membros m where m.foto = p_nome) $$;
revoke all on function public.midia_em_uso(text) from public, anon;
grant execute on function public.midia_em_uso(text) to authenticated;
create or replace function public.admin_espaco() returns json
language plpgsql security definer set search_path = public, storage as $$
declare r json; lim bigint := (extract(epoch from now())*1000)::bigint - 30::bigint*86400000;
begin
  if not public.e_admin() then raise exception 'sem permissão' using errcode = '42501'; end if;
  select json_build_object(
    'db_bytes', pg_database_size(current_database()),
    'tabelas', (select coalesce(json_agg(t order by t.bytes desc), '[]'::json) from (
        select c.relname as nome, pg_total_relation_size(c.oid) as bytes, greatest(c.reltuples, 0)::bigint as linhas
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r') t),
    'buckets', (select coalesce(json_agg(b order by b.bytes desc), '[]'::json) from (
        select o.bucket_id as bucket, count(*) as arquivos, coalesce(sum((o.metadata->>'size')::bigint), 0) as bytes
        from storage.objects o group by o.bucket_id) b),
    'orfas', (select json_build_object('arquivos', count(*), 'bytes', coalesce(sum((o.metadata->>'size')::bigint), 0))
        from storage.objects o
        where o.bucket_id in ('fotos', 'videos') and o.created_at < now() - interval '1 day'
          and not public.midia_em_uso(o.name)),
    'stories_velhos', (select count(*) from public.publicacoes p
        where p.tipo = 'story' and p.expira < lim
          and not exists (select 1 from public.destaques d where p.id = any(d.itens)))
  ) into r;
  return r;
end $$;
revoke all on function public.admin_espaco() from public, anon;
grant execute on function public.admin_espaco() to authenticated;
create or replace function public.admin_midias_orfas(p_lim int default 300)
returns table (bucket text, nome text, bytes bigint)
language plpgsql security definer set search_path = public, storage as $$
begin
  if not public.e_admin() then raise exception 'sem permissão' using errcode = '42501'; end if;
  return query
    select o.bucket_id::text, o.name::text, coalesce((o.metadata->>'size')::bigint, 0)
    from storage.objects o
    where o.bucket_id in ('fotos', 'videos') and o.created_at < now() - interval '1 day'
      and not public.midia_em_uso(o.name)
    order by o.created_at
    limit least(greatest(p_lim, 1), 1000);
end $$;
revoke all on function public.admin_midias_orfas(int) from public, anon;
grant execute on function public.admin_midias_orfas(int) to authenticated;
