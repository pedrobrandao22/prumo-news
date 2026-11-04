-- Prumo News · v9: seguir perfis abertos (seguidores) e colunas longas.
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Precisa das versões v2 a v8 já rodadas. Também reafirma as regras finais de quem lê as publicações
-- (se alguma versão antiga, inclusive a v7 ou a v8, for rodada de novo depois desta, rode esta outra vez).
-- O app novo funciona antes e depois desta versão: sem ela, não aparecem "Seguir", "Perfil aberto" nem
-- o público "Seguidores e amigos", e a coluna fica limitada a 6.000 caracteres (com ela, até 40.000).

-- 1. Perfil aberto: a própria pessoa liga ou desliga (começa desligado para todo mundo)
alter table public.membros add column if not exists perfil_aberto boolean not null default false;
create or replace function public.mudar_perfil_aberto(p_aberto boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  update public.membros set perfil_aberto = coalesce(p_aberto, false) where uid = me;
  return coalesce(p_aberto, false);
end $$;
revoke all on function public.mudar_perfil_aberto(boolean) from public, anon;
grant execute on function public.mudar_perfil_aberto(boolean) to authenticated;

-- 2. Quem segue quem (só de um lado: seguir não é amizade). Cada um vê as próprias linhas
--    (quem ele segue e quem o segue); seguir é só pela função do passo 3; deixar de seguir
--    ou tirar um seguidor apaga a linha.
create table if not exists public.seguidores (
  seguidor uuid not null references public.membros(uid) on delete cascade,
  seguido uuid not null references public.membros(uid) on delete cascade,
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (seguidor, seguido),
  check (seguidor <> seguido)
);
create index if not exists seguidores_seguido_idx on public.seguidores(seguido, at desc);
alter table public.seguidores enable row level security;
drop policy if exists seg_ler on public.seguidores;
create policy seg_ler on public.seguidores for select to authenticated using (
  public.e_membro() and (seguidor = auth.uid() or seguido = auth.uid()));
drop policy if exists seg_tirar on public.seguidores;
create policy seg_tirar on public.seguidores for delete to authenticated using (seguidor = auth.uid() or seguido = auth.uid());
revoke all on public.seguidores from anon, authenticated;
grant select, delete on public.seguidores to authenticated;

-- 3. Seguir: só perfil aberto, de quem está ativo e sem bloqueio de nenhum dos lados; limite contra enxurrada
create or replace function public.seguir(p_uid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); agora bigint := (extract(epoch from now())*1000)::bigint;
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if p_uid is null or p_uid = me then raise exception 'pedido invalido' using errcode = '22023'; end if;
  if exists (select 1 from seguidores where seguidor = me and seguido = p_uid) then return 'ja'; end if;
  if not exists (select 1 from membros m where m.uid = p_uid and m.perfil_aberto and m.suspenso_em is null and m.excluido_em is null)
     or exists (select 1 from bloqueios b where (b.de = me and b.para = p_uid) or (b.de = p_uid and b.para = me)) then
    raise exception 'perfil fechado' using errcode = '42501';
  end if;
  if (select count(*) from seguidores where seguidor = me and at > agora - 86400000) >= 100 then
    raise exception 'seguir demais' using errcode = '54000';
  end if;
  insert into seguidores(seguidor, seguido, at) values (me, p_uid, agora) on conflict do nothing;
  return 'ok';
end $$;
create or replace function public.deixar_de_seguir(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sem login' using errcode = '28000'; end if;
  delete from seguidores where seguidor = auth.uid() and seguido = p_uid;
end $$;
create or replace function public.tirar_seguidor(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sem login' using errcode = '28000'; end if;
  delete from seguidores where seguido = auth.uid() and seguidor = p_uid;
end $$;
-- quem lê as publicações "para seguidores": segue o autor, o perfil dele continua aberto e ninguém bloqueou ninguém
create or replace function public.ve_como_seguidor(p_autor uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and p_autor is not null
    and exists (select 1 from seguidores s where s.seguidor = auth.uid() and s.seguido = p_autor)
    and exists (select 1 from membros m where m.uid = p_autor and m.perfil_aberto and m.suspenso_em is null and m.excluido_em is null)
    and not exists (select 1 from bloqueios b where (b.de = auth.uid() and b.para = p_autor) or (b.de = p_autor and b.para = auth.uid()))
$$;
revoke all on function public.seguir(uuid), public.deixar_de_seguir(uuid), public.tirar_seguidor(uuid), public.ve_como_seguidor(uuid) from public, anon;
grant execute on function public.seguir(uuid), public.deixar_de_seguir(uuid), public.tirar_seguidor(uuid), public.ve_como_seguidor(uuid) to authenticated;

-- 4. Achar perfis abertos e montar as listas. Destes perfis só saem o nome e a foto
--    (o resto da linha da pessoa continua visível só para quem já via antes: amigos, amigos de amigos etc.).
--    Quem segue alguém passa a ter o nome visto por essa pessoa (na lista de seguidores e na Atividade).
create or replace function public.perfis_abertos(p_busca text default '') returns table(uid uuid, nome text, foto text, sigo boolean)
language sql stable security definer set search_path = public as $$
  select m.uid, m.nome, m.foto, exists (select 1 from seguidores s where s.seguidor = auth.uid() and s.seguido = m.uid)
  from membros m
  where public.e_membro() and m.perfil_aberto and m.uid <> auth.uid() and m.suspenso_em is null and m.excluido_em is null
    and not exists (select 1 from bloqueios b where (b.de = m.uid and b.para = auth.uid()) or (b.de = auth.uid() and b.para = m.uid))
    and (btrim(coalesce(p_busca, '')) = '' or position(lower(btrim(p_busca)) in lower(m.nome)) > 0)
  order by m.nome
  limit 30
$$;
-- números de um perfil (o próprio, um perfil aberto ou alguém que a pessoa já vê)
create or replace function public.seg_contagem(p_uid uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); m record;
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  select * into m from membros where uid = p_uid;
  if not found or (p_uid <> me and not m.perfil_aberto and not public.pode_ver_membro(p_uid))
     or exists (select 1 from bloqueios b where b.de = p_uid and b.para = me) then
    return json_build_object('ok', false);
  end if;
  return json_build_object('ok', true, 'aberto', m.perfil_aberto,
    'seguidores', (select count(*) from seguidores s join membros x on x.uid = s.seguidor where s.seguido = p_uid and x.excluido_em is null),
    'seguindo', (select count(*) from seguidores s join membros x on x.uid = s.seguido where s.seguidor = p_uid and x.excluido_em is null),
    'sigo', exists (select 1 from seguidores where seguidor = me and seguido = p_uid),
    'me_segue', exists (select 1 from seguidores where seguidor = p_uid and seguido = me));
end $$;
-- lista de seguidores ou de quem a pessoa segue. Dos outros perfis, só aparecem as pessoas que quem pede
-- já veria (você, perfis abertos e quem você já vê no Prumo).
create or replace function public.seg_lista(p_uid uuid, p_tipo text) returns table(uid uuid, nome text, foto text, aberto boolean, at bigint)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if p_uid <> me and not exists (select 1 from membros x where x.uid = p_uid and (x.perfil_aberto or public.pode_ver_membro(p_uid)))
     or exists (select 1 from bloqueios b where b.de = p_uid and b.para = me) then return; end if;
  return query
    select m.uid, m.nome, m.foto, m.perfil_aberto, s.at
    from seguidores s join membros m on m.uid = case when p_tipo = 'seguindo' then s.seguido else s.seguidor end
    where (case when p_tipo = 'seguindo' then s.seguidor else s.seguido end) = p_uid
      and m.excluido_em is null
      and (p_uid = me or m.uid = me or m.perfil_aberto or public.pode_ver_membro(m.uid))
      and not exists (select 1 from bloqueios b where b.de = m.uid and b.para = me)
    order by s.at desc
    limit 500;
end $$;
revoke all on function public.perfis_abertos(text), public.seg_contagem(uuid), public.seg_lista(uuid, text) from public, anon;
grant execute on function public.perfis_abertos(text), public.seg_contagem(uuid), public.seg_lista(uuid, text) to authenticated;

-- 5. Bloquear desfaz o seguir dos dois lados; conta excluída sai das listas e fecha o perfil
--    (são gatilhos: continuam valendo se a v7 ou a v8 forem rodadas de novo)
create or replace function public.seg_limpa_bloqueio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.seguidores where (seguidor = new.de and seguido = new.para) or (seguidor = new.para and seguido = new.de);
  return null;
end $$;
drop trigger if exists seg_limpa_bloqueio on public.bloqueios;
create trigger seg_limpa_bloqueio after insert on public.bloqueios for each row execute function public.seg_limpa_bloqueio();
create or replace function public.seg_limpa_conta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.seguidores where seguidor = new.uid or seguido = new.uid;
  update public.membros set perfil_aberto = false where uid = new.uid and perfil_aberto;
  return null;
end $$;
drop trigger if exists seg_limpa_conta on public.membros;
create trigger seg_limpa_conta after update of excluido_em on public.membros
  for each row when (new.excluido_em is not null and old.excluido_em is null) execute function public.seg_limpa_conta();
revoke all on function public.seg_limpa_bloqueio(), public.seg_limpa_conta() from public, anon, authenticated;
-- limpeza única (se a v9 for rodada de novo): linhas que sobraram de bloqueio ou de conta excluída
delete from public.seguidores s where exists (select 1 from public.bloqueios b where (b.de = s.seguidor and b.para = s.seguido) or (b.de = s.seguido and b.para = s.seguidor))
  or exists (select 1 from public.membros m where m.uid in (s.seguidor, s.seguido) and m.excluido_em is not null);

-- 6. Público novo das publicações: 'seguidores' = quem segue o autor (perfil aberto) + os amigos.
--    Stories não vão para seguidores (só posts e reels).
alter table public.publicacoes drop constraint if exists publicacoes_publico_chk;
alter table public.publicacoes add constraint publicacoes_publico_chk check (publico in ('amigos','proximos','seguidores'));

-- 7. Regras finais de quem lê as publicações (as da v8, com os seguidores; o arquivado continua na regra restritiva da v8)
drop policy if exists pub_ler on public.publicacoes;
create policy pub_ler on public.publicacoes for select to authenticated using (
  public.e_membro() and (autor = auth.uid()
    or (public.sao_amigos(auth.uid(), autor)
        and (publico in ('amigos','seguidores') or exists (select 1 from public.melhores_amigos m where m.dono = autor and m.amigo = auth.uid())))
    or (publico = 'seguidores' and tipo <> 'story' and public.ve_como_seguidor(autor)))
  and (tipo <> 'story' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint
       or exists (select 1 from public.destaques d where d.dono = publicacoes.autor and publicacoes.id = any(d.itens))));

-- 8. Coluna: o texto longo fica numa coluna própria da publicação (até 40.000 caracteres).
--    O título, a linha fina e o tempo de leitura ficam em estilo.coluna. Antes desta versão o app guarda
--    o texto em estilo.coluna.corpo (até 6.000 caracteres). O gatilho confere os tamanhos no servidor.
alter table public.publicacoes add column if not exists corpo text;
alter table public.publicacoes drop constraint if exists publicacoes_corpo_chk;
alter table public.publicacoes add constraint publicacoes_corpo_chk check (corpo is null or char_length(corpo) <= 40000);
create or replace function public.pub_coluna_confere() returns trigger language plpgsql as $$
declare c jsonb := case when new.estilo is not null and jsonb_typeof(new.estilo -> 'coluna') = 'object' then new.estilo -> 'coluna' end;
begin
  if c is null then
    if new.corpo is not null then raise exception 'texto longo so em coluna' using errcode = '22023'; end if;
    return new;
  end if;
  if new.tipo <> 'post' then raise exception 'coluna so em post' using errcode = '22023'; end if;
  if char_length(coalesce(c ->> 'tit', '')) not between 1 and 90 or char_length(coalesce(c ->> 'linha', '')) > 160
     or char_length(coalesce(c ->> 'corpo', '')) > 6000 then
    raise exception 'coluna fora do tamanho' using errcode = '22023';
  end if;
  return new;
end $$;
drop trigger if exists pub_coluna_confere on public.publicacoes;
create trigger pub_coluna_confere before insert or update on public.publicacoes for each row execute function public.pub_coluna_confere();
revoke all on function public.pub_coluna_confere() from public, anon, authenticated;

-- 9. Tempo real: seguidor novo chega na hora para quem foi seguido (só inserções, como o resto)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'seguidores') then
    execute 'alter publication supabase_realtime add table public.seguidores';
  end if;
end $$;

-- 10. Arquivos: a foto de um perfil aberto abre para os membros (só ela; as fotos dos posts seguem a regra das publicações)
--     (regra à parte, que se soma às outras e não se perde se a v7 ou a v8 forem rodadas de novo)
create or replace function public.foto_de_perfil_aberto(p_nome text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros m where m.foto = p_nome and m.perfil_aberto and m.suspenso_em is null and m.excluido_em is null
    and not exists (select 1 from public.bloqueios b where b.de = m.uid and b.para = auth.uid())) $$;
revoke all on function public.foto_de_perfil_aberto(text) from public, anon;
grant execute on function public.foto_de_perfil_aberto(text) to authenticated;
drop policy if exists fotos_aberto_ler on storage.objects;
create policy fotos_aberto_ler on storage.objects for select to authenticated using (
  bucket_id = 'fotos' and public.e_membro() and public.foto_de_perfil_aberto(storage.objects.name));
