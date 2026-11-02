-- Prumo News · publicações v6: espaço usado e limpeza de arquivos (só o administrador)
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Precisa das versões anteriores (publicações v2 a v5) já rodadas.

-- 1. Quanto o Prumo ocupa: banco, tabelas, arquivos por pasta, e o que dá para limpar
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
          and not exists (select 1 from public.publicacoes p where p.fotos ? o.name or p.estilo->>'video' = o.name)),
    'stories_velhos', (select count(*) from public.publicacoes p
        where p.tipo = 'story' and p.expira < lim
          and not exists (select 1 from public.destaques d where p.id = any(d.itens)))
  ) into r;
  return r;
end $$;
revoke all on function public.admin_espaco() from public, anon;
grant execute on function public.admin_espaco() to authenticated;

-- 2. Apaga stories com mais de 30 dias que não estão em nenhum destaque (as fotos viram "sem uso" e saem no passo 3)
create or replace function public.admin_limpar_stories() returns int
language plpgsql security definer set search_path = public as $$
declare n int; lim bigint := (extract(epoch from now())*1000)::bigint - 30::bigint*86400000;
begin
  if not public.e_admin() then raise exception 'sem permissão' using errcode = '42501'; end if;
  with x as (delete from public.publicacoes p
    where p.tipo = 'story' and p.expira < lim
      and not exists (select 1 from public.destaques d where p.id = any(d.itens))
    returning 1)
  select count(*) into n from x;
  return n;
end $$;
revoke all on function public.admin_limpar_stories() from public, anon;
grant execute on function public.admin_limpar_stories() to authenticated;

-- 3. Lista de arquivos que nenhuma publicação usa mais (com mais de 1 dia, para não pegar envio em andamento)
create or replace function public.admin_midias_orfas(p_lim int default 300)
returns table (bucket text, nome text, bytes bigint)
language plpgsql security definer set search_path = public, storage as $$
begin
  if not public.e_admin() then raise exception 'sem permissão' using errcode = '42501'; end if;
  return query
    select o.bucket_id::text, o.name::text, coalesce((o.metadata->>'size')::bigint, 0)
    from storage.objects o
    where o.bucket_id in ('fotos', 'videos') and o.created_at < now() - interval '1 day'
      and not exists (select 1 from public.publicacoes p where p.fotos ? o.name or p.estilo->>'video' = o.name)
    order by o.created_at
    limit least(greatest(p_lim, 1), 1000);
end $$;
revoke all on function public.admin_midias_orfas(int) from public, anon;
grant execute on function public.admin_midias_orfas(int) to authenticated;

-- 4. O administrador pode apagar SÓ arquivos sem uso (o app apaga pelo próprio Storage, que remove o arquivo de verdade).
--    A conferência olha TODAS as publicações (inclusive as que o administrador não vê), para nunca apagar foto em uso.
create or replace function public.midia_em_uso(p_nome text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.publicacoes p where p.fotos ? p_nome or p.estilo->>'video' = p_nome) $$;
revoke all on function public.midia_em_uso(text) from public, anon;
grant execute on function public.midia_em_uso(text) to authenticated;
-- (apagar exige também poder ver o arquivo, por isso as duas regras; as duas valem só para arquivo sem uso há mais de 1 dia)
drop policy if exists midias_admin_ver on storage.objects;
create policy midias_admin_ver on storage.objects for select to authenticated using (
  bucket_id in ('fotos', 'videos') and public.e_admin() and created_at < now() - interval '1 day' and not public.midia_em_uso(name));
drop policy if exists midias_admin_apagar on storage.objects;
create policy midias_admin_apagar on storage.objects for delete to authenticated using (
  bucket_id in ('fotos', 'videos') and public.e_admin() and created_at < now() - interval '1 day' and not public.midia_em_uso(name));
