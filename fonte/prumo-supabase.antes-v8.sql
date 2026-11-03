-- =====================================================================
-- Prumo News — banco de dados (Supabase)
-- Cole tudo no SQL Editor do Supabase e clique em "Run".
-- Pode rodar de novo sem problema: o script é idempotente.
-- =====================================================================

-- ---------- tabelas ----------
create table if not exists public.membros (
  uid uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 40),
  convidado_por uuid,
  criado_em timestamptz not null default now()
);

create table if not exists public.convites (
  codigo text primary key,
  criado_por uuid not null references public.membros(uid) on delete cascade,
  criado_em timestamptz not null default now(),
  usado_por uuid references public.membros(uid) on delete set null,
  usado_em timestamptz
);

create table if not exists public.amizades (
  de uuid not null references public.membros(uid) on delete cascade,
  para uuid not null references public.membros(uid) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente','aceita')),
  criado_em timestamptz not null default now(),
  primary key (de, para),
  check (de <> para)
);

-- documentos JSON (preferências, guardadas, curtidas, votos, comentários, leituras, quiz, "junto?", listas a dois)
create table if not exists public.docs (
  path text primary key check (char_length(path) <= 200),
  col text not null,
  owner uuid,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 262144),
  atualizado_em timestamptz not null default now()
);
create index if not exists docs_col_idx on public.docs(col);
create index if not exists docs_owner_idx on public.docs(owner);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  de uuid not null references public.membros(uid) on delete cascade,
  para uuid not null references public.membros(uid) on delete cascade,
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  texto text not null default '' check (char_length(texto) <= 1000),
  pid text,
  snap jsonb check (snap is null or pg_column_size(snap) <= 16384),
  resp boolean,
  tipo text,
  lida boolean not null default false
);
create index if not exists mensagens_de_idx on public.mensagens(de);
create index if not exists mensagens_para_idx on public.mensagens(para);

create table if not exists public.erros (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null default auth.uid() references public.membros(uid) on delete cascade,
  pid text,
  titulo text check (char_length(titulo) <= 300),
  texto text not null check (char_length(texto) between 1 and 800),
  edicao text,
  status text not null default 'aberto',
  at bigint not null default (extract(epoch from now())*1000)::bigint
);

-- limites de tamanho que faltavam + data do aviso de erro definida pelo servidor
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'erros_tamanhos') then
    alter table public.erros add constraint erros_tamanhos check (char_length(coalesce(pid,'')) <= 200 and char_length(coalesce(edicao,'')) <= 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'mensagens_tamanhos') then
    alter table public.mensagens add constraint mensagens_tamanhos check (char_length(coalesce(pid,'')) <= 200 and char_length(coalesce(tipo,'')) <= 30);
  end if;
end $$;
create or replace function public.erros_servidor() returns trigger language plpgsql as $$
begin new.at := (extract(epoch from now())*1000)::bigint; new.status := 'aberto'; return new; end $$;
drop trigger if exists erros_servidor on public.erros;
create trigger erros_servidor before insert on public.erros for each row execute function public.erros_servidor();

-- nomes sem caracteres invisíveis/de direção (evita "Pedro" disfarçado)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'membros_nome_limpo') then
    alter table public.membros add constraint membros_nome_limpo check (nome !~ '[[:cntrl:]­​-‏‪-‮⁠-⁯﻿]');
  end if;
end $$;

-- ---------- leva 3: administrador, suspensão, conta excluída, cota de convites, bloqueios, denúncias ----------
alter table public.membros add column if not exists papel text not null default 'membro';
alter table public.membros add column if not exists suspenso_em timestamptz;
alter table public.membros add column if not exists excluido_em timestamptz;
alter table public.membros add column if not exists cota_convites int not null default 3;
alter table public.convites add column if not exists expira_em timestamptz not null default now() + interval '7 days';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'membros_papel_ok') then
    alter table public.membros add constraint membros_papel_ok check (papel in ('admin','membro'));
  end if;
  -- amizade recusada fica registrada (a pessoa não pode pedir de novo sem parar)
  if exists (select 1 from pg_constraint where conname = 'amizades_status_check') then
    alter table public.amizades drop constraint amizades_status_check;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'amizades_status_ok') then
    alter table public.amizades add constraint amizades_status_ok check (status in ('pendente','aceita','recusada'));
  end if;
end $$;
-- conta excluída: a linha do membro fica (como "Conta excluída") para as conversas do outro lado continuarem;
-- por isso o membro deixa de depender do login (que é apagado de verdade).
do $$ declare c text; begin
  for c in select conname from pg_constraint where conrelid = 'public.membros'::regclass and contype = 'f' and confrelid = 'auth.users'::regclass loop
    execute format('alter table public.membros drop constraint %I', c);
  end loop;
end $$;
-- o fundador é o administrador
update public.membros set papel = 'admin'
 where uid = (select uid from public.membros order by criado_em limit 1)
   and not exists (select 1 from public.membros where papel = 'admin');

create table if not exists public.bloqueios (
  de uuid not null references public.membros(uid) on delete cascade,
  para uuid not null references public.membros(uid) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (de, para),
  check (de <> para)
);
create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),
  de uuid not null references public.membros(uid) on delete cascade,
  alvo uuid references public.membros(uid) on delete set null,
  tipo text not null check (tipo in ('comentario','mensagem','pessoa')),
  ref text check (char_length(coalesce(ref,'')) <= 200),
  pid text check (char_length(coalesce(pid,'')) <= 200),
  texto text check (char_length(coalesce(texto,'')) <= 1200),
  motivo text check (char_length(coalesce(motivo,'')) <= 500),
  status text not null default 'aberta' check (status in ('aberta','resolvida','descartada')),
  criado_em timestamptz not null default now()
);
create index if not exists amizades_para_idx on public.amizades(para);
create index if not exists mensagens_para_at_idx on public.mensagens(para, at desc);
create index if not exists mensagens_de_at_idx on public.mensagens(de, at desc);
create index if not exists docs_atualizado_idx on public.docs(atualizado_em);

-- nome único entre quem está ativo (as contas excluídas viram todas "Conta excluída")
do $$ begin
  if exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'membros_nome_unico' and indexdef not like '%excluido_em%') then
    drop index public.membros_nome_unico;
  end if;
end $$;
create unique index if not exists membros_nome_unico on public.membros (lower(btrim(nome))) where excluido_em is null;

-- ---------- funções de apoio ----------
create or replace function public.e_membro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.membros where uid = auth.uid() and suspenso_em is null and excluido_em is null)
$$;

create or replace function public.e_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.membros where uid = auth.uid() and papel = 'admin' and suspenso_em is null and excluido_em is null)
$$;

-- quem aparece para quem: você, amigos, amigos de amigos, quem tem pedido ou conversa com você,
-- quem você convidou e quem te convidou. O administrador vê todos. Quem te bloqueou some.
create or replace function public.pode_ver_membro(m uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return false; end if;
  if m = me then return true; end if;
  if not public.e_membro() then return false; end if;
  if public.e_admin() then return true; end if;
  if exists(select 1 from bloqueios where de = m and para = me) then return false; end if;
  if exists(select 1 from amizades where (de = me and para = m) or (de = m and para = me)) then return true; end if;
  if exists(select 1 from mensagens where (de = me and para = m) or (de = m and para = me)) then return true; end if;
  if exists(select 1 from membros where (uid = m and convidado_por = me) or (uid = me and convidado_por = m)) then return true; end if;
  if exists(select 1 from membros where uid = m and (suspenso_em is not null or excluido_em is not null)) then return false; end if;
  return exists(
    select 1 from amizades a1 join amizades a2
      on (case when a1.de = me then a1.para else a1.de end) in (a2.de, a2.para)
    where a1.status = 'aceita' and a2.status = 'aceita' and me in (a1.de, a1.para) and m in (a2.de, a2.para));
end $$;

create or replace function public.sao_amigos(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select a is not null and b is not null and auth.uid() in (a, b) and exists(
    select 1 from public.amizades
    where status = 'aceita' and ((de = a and para = b) or (de = b and para = a)))
$$;

-- coleções de atividade: cada pessoa escreve só no próprio documento e os amigos leem
create or replace function public.col_social(c text) returns boolean
language sql immutable as $$
  select c in ('curtidas','votos','comentarios','leituras','quiz','juntos')
$$;

-- dono e coleção a partir do caminho
create or replace function public.doc_info(p text, out col text, out owner uuid, out ok boolean)
language plpgsql immutable as $$
declare a text; b text; c text; par text[];
begin
  ok := false; col := split_part(p, '/', 1); owner := null;
  begin
    if col = 'data' then
      a := split_part(p, '/', 2); b := split_part(p, '/', 3); c := split_part(p, '/', 4);
      if a = 'users' and c in ('prefs','salvos','historico','uso') and split_part(p,'/',5) = '' and b::uuid::text = b then
        owner := b::uuid; ok := true;
      end if;
    elsif public.col_social(col) then
      b := split_part(p, '/', 2);
      if split_part(p,'/',3) = '' and b::uuid::text = b then owner := b::uuid; ok := true; end if;
    elsif col = 'lista' then
      par := string_to_array(split_part(p, '/', 2), '_');
      if array_length(par,1) = 2 and split_part(p,'/',3) = '' and par[1]::uuid::text = par[1] and par[2]::uuid::text = par[2]
         and par[1]::uuid < par[2]::uuid then ok := true; end if;
    end if;
  exception when others then ok := false;
  end;
end $$;

create or replace function public.lista_par(p text) returns uuid[]
language sql immutable as $$
  select array[split_part(split_part(p,'/',2),'_',1)::uuid, split_part(split_part(p,'/',2),'_',2)::uuid]
$$;

create or replace function public.pode_ler_doc(p text, c text, o uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); par uuid[];
begin
  if me is null or not public.e_membro() then return false; end if;
  if c = 'data' then return o = me; end if;
  if public.col_social(c) then return o = me or public.sao_amigos(me, o); end if;
  if c = 'lista' then par := public.lista_par(p); return me = any(par); end if;
  return false;
end $$;

create or replace function public.pode_escrever_doc(p text, c text, o uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); par uuid[]; i record;
begin
  if me is null or not public.e_membro() then return false; end if;
  select * into i from public.doc_info(p);
  if not i.ok or i.col is distinct from c or i.owner is distinct from o then return false; end if;
  if c = 'data' or public.col_social(c) then return o = me; end if;
  if c = 'lista' then
    par := public.lista_par(p);
    return me = any(par) and public.sao_amigos(par[1], par[2]);
  end if;
  return false;
end $$;

-- mescla profunda: objetos se juntam, null apaga a chave
create or replace function public.jsonb_mescla(a jsonb, b jsonb) returns jsonb
language plpgsql immutable as $$
declare k text; v jsonb; r jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' then a := '{}'::jsonb; end if;
  if b is null or jsonb_typeof(b) <> 'object' then return a; end if;
  r := a;
  for k, v in select * from jsonb_each(b) loop
    if v = 'null'::jsonb then
      r := r - k;
    elsif jsonb_typeof(v) = 'object' and jsonb_typeof(r -> k) = 'object' then
      r := jsonb_set(r, array[k], public.jsonb_mescla(r -> k, v));
    elsif jsonb_typeof(v) = 'object' then
      r := jsonb_set(r, array[k], public.jsonb_mescla('{}'::jsonb, v));
    else
      r := jsonb_set(r, array[k], v);
    end if;
  end loop;
  return r;
end $$;

-- grava (mescla) um documento; cria se não existir. Respeita as regras de acesso (security invoker).
create or replace function public.doc_mesclar(p_path text, p_patch jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare i record;
begin
  select * into i from public.doc_info(p_path);
  if not i.ok then raise exception 'caminho invalido' using errcode = '22023'; end if;
  insert into public.docs as d (path, col, owner, data, atualizado_em)
  values (p_path, i.col, i.owner, public.jsonb_mescla('{}'::jsonb, p_patch), now())
  on conflict (path) do update set data = public.jsonb_mescla(d.data, p_patch), atualizado_em = now();
end $$;

-- grava (substitui) um documento inteiro
create or replace function public.doc_gravar(p_path text, p_data jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare i record;
begin
  select * into i from public.doc_info(p_path);
  if not i.ok then raise exception 'caminho invalido' using errcode = '22023'; end if;
  insert into public.docs as d (path, col, owner, data, atualizado_em)
  values (p_path, i.col, i.owner, public.jsonb_mescla('{}'::jsonb, coalesce(p_data,'{}'::jsonb)), now())
  on conflict (path) do update set data = excluded.data, atualizado_em = now();
end $$;

-- ---------- entrada, convites e amizades ----------
create or replace function public.entrar(p_codigo text, p_nome text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); cv record; n text := btrim(coalesce(p_nome,''));
begin
  if me is null then raise exception 'sem login' using errcode = '28000'; end if;
  if exists(select 1 from membros where uid = me) then return jsonb_build_object('ok', true, 'ja', true); end if;
  if char_length(n) < 1 or char_length(n) > 40 then raise exception 'nome invalido' using errcode = '22023'; end if;
  lock table membros in share row exclusive mode;            -- dois "primeiros" ao mesmo tempo não viram dois fundadores
  if not exists(select 1 from membros) then
    insert into membros(uid, nome, papel) values (me, n, 'admin');
    return jsonb_build_object('ok', true, 'fundador', true);
  end if;
  select * into cv from convites where codigo = upper(btrim(coalesce(p_codigo,''))) for update;
  if not found or cv.usado_em is not null or cv.expira_em < now() then raise exception 'convite invalido' using errcode = '22023'; end if;
  if exists(select 1 from membros where uid = cv.criado_por and (suspenso_em is not null or excluido_em is not null)) then
    raise exception 'convite invalido' using errcode = '22023';
  end if;
  insert into membros(uid, nome, convidado_por) values (me, n, cv.criado_por);
  update convites set usado_por = me, usado_em = now() where codigo = cv.codigo;
  insert into amizades(de, para, status) values (cv.criado_por, me, 'aceita') on conflict do nothing;
  return jsonb_build_object('ok', true, 'amigo', cv.criado_por);
end $$;

create or replace function public.criar_convite() returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c text; abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if (select count(*) from convites where criado_por = me and usado_por is null and expira_em > now()) >= 20 then
    raise exception 'convites demais em aberto' using errcode = '54000';
  end if;
  if not public.e_admin() and (select count(*) from convites where criado_por = me and (usado_em is not null or expira_em > now()))
     >= (select cota_convites from membros where uid = me) then
    raise exception 'sem convites' using errcode = '54001';
  end if;
  loop
    c := '';
    for i in 1..8 loop c := c || substr(abc, 1 + floor(random()*length(abc))::int, 1); end loop;
    exit when not exists(select 1 from convites where codigo = c);
  end loop;
  insert into convites(codigo, criado_por) values (c, me);
  return c;
end $$;

create or replace function public.pedir_amizade(p_uid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.e_membro() or p_uid is null or p_uid = me or not exists(select 1 from membros where uid = p_uid) then
    raise exception 'pedido invalido' using errcode = '22023';
  end if;
  if exists(select 1 from bloqueios where (de = me and para = p_uid) or (de = p_uid and para = me))
     or exists(select 1 from membros where uid = p_uid and (suspenso_em is not null or excluido_em is not null)) then
    raise exception 'pedido invalido' using errcode = '22023';
  end if;
  if exists(select 1 from amizades where de = p_uid and para = me) then
    update amizades set status = 'aceita' where de = p_uid and para = me;
    return 'aceita';
  end if;
  if not exists(select 1 from amizades where de = me and para = p_uid)
     and (select count(*) from amizades where de = me and status <> 'aceita') >= 20 then
    raise exception 'pedidos demais' using errcode = '54000';
  end if;
  insert into amizades(de, para) values (me, p_uid) on conflict do nothing;
  return case (select status from amizades where de = me and para = p_uid) when 'aceita' then 'aceita' else 'pendente' end;
end $$;

create or replace function public.responder_amizade(p_uid uuid, p_aceitar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if p_aceitar then
    update amizades set status = 'aceita' where de = p_uid and para = me;
  else
    update amizades set status = 'recusada' where de = p_uid and para = me and status = 'pendente';
  end if;
end $$;

create or replace function public.desfazer_amizade(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  delete from amizades where ((de = me and para = p_uid) or (de = p_uid and para = me))
    and not (de = me and status = 'recusada');   -- cancelar não apaga a recusa de quem recusou
end $$;

-- avisos de erro que as rodadas conferem (sem dizer quem mandou)
create or replace function public.erros_abertos() returns table(id uuid, pid text, titulo text, texto text, edicao text, status text, at bigint)
language sql stable security definer set search_path = public as $$
  select e.id, e.pid, e.titulo, e.texto, e.edicao, e.status, e.at from public.erros e
  where e.at > (extract(epoch from now() - interval '14 days')*1000)::bigint
  order by e.at
$$;

-- excluir a conta e tudo o que é da pessoa
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
  -- as mensagens ficam com quem conversou, mostrando "Conta excluída"
  update public.membros set nome = 'Conta excluída', excluido_em = now(), papel = 'membro' where uid = me;
  delete from auth.users where id = me;
end $$;

-- ---------- leva 3: convites, busca, bloqueio, denúncia ----------
create or replace function public.meus_convites() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); m record;
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  select * into m from membros where uid = me;
  return jsonb_build_object(
    'admin', m.papel = 'admin',
    'cota', m.cota_convites,
    'usados', (select count(*) from convites where criado_por = me and usado_em is not null),
    'abertos', coalesce((select jsonb_agg(jsonb_build_object('codigo', codigo, 'criado_em', criado_em, 'expira_em', expira_em) order by criado_em desc)
                 from convites where criado_por = me and usado_em is null and expira_em > now()), '[]'::jsonb));
end $$;

create or replace function public.revogar_convite(p_codigo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  delete from convites where codigo = upper(btrim(p_codigo)) and usado_em is null
    and (criado_por = auth.uid() or public.e_admin());
end $$;

-- achar alguém pelo nome exato (para quem não é amigo de amigo)
create or replace function public.buscar_membro(p_nome text) returns table(uid uuid, nome text)
language sql stable security definer set search_path = public as $$
  select m.uid, m.nome from membros m
  where public.e_membro() and lower(btrim(m.nome)) = lower(btrim(coalesce(p_nome,'')))
    and m.uid <> auth.uid() and m.suspenso_em is null and m.excluido_em is null
    and not exists(select 1 from bloqueios b where b.de = m.uid and b.para = auth.uid())
  limit 1
$$;

-- amigos em comum com quem aparece em "Adicionar amigos"
create or replace function public.amigos_em_comum() returns table(uid uuid, comuns int)
language sql stable security definer set search_path = public as $$
  with meus as (
    select case when de = auth.uid() then para else de end as a from amizades
    where status = 'aceita' and auth.uid() in (de, para))
  select case when z.de = meus.a then z.para else z.de end as uid, count(*)::int as comuns
  from meus join amizades z on z.status = 'aceita' and meus.a in (z.de, z.para)
  where public.e_membro() and (case when z.de = meus.a then z.para else z.de end) <> auth.uid()
    and (case when z.de = meus.a then z.para else z.de end) not in (select a from meus)
  group by 1
$$;

create or replace function public.bloquear(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.e_membro() or p_uid is null or p_uid = me then raise exception 'pedido invalido' using errcode = '22023'; end if;
  insert into bloqueios(de, para) values (me, p_uid) on conflict do nothing;
  delete from amizades where (de = me and para = p_uid) or (de = p_uid and para = me);
end $$;

create or replace function public.desbloquear(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  delete from bloqueios where de = auth.uid() and para = p_uid;
end $$;

create or replace function public.meus_bloqueios() returns table(uid uuid, nome text)
language sql stable security definer set search_path = public as $$
  select b.para, m.nome from bloqueios b join membros m on m.uid = b.para where b.de = auth.uid() order by b.criado_em desc
$$;

create or replace function public.denunciar(p_tipo text, p_alvo uuid, p_ref text, p_pid text, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t text;
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if (select count(*) from denuncias where de = me and criado_em > now() - interval '1 day') >= 20 then
    raise exception 'denuncias demais' using errcode = '54000';
  end if;
  if p_tipo = 'comentario' then
    if not (p_alvo = me or public.sao_amigos(me, p_alvo)) then raise exception 'sem acesso' using errcode = '42501'; end if;
    select d.data -> 'itens' -> p_ref ->> 'texto' into t from docs d where d.path = 'comentarios/' || p_alvo::text;
  elsif p_tipo = 'mensagem' then
    select m.texto, m.de into t, p_alvo from mensagens m where m.id::text = p_ref and m.para = me;
    if p_alvo is null then raise exception 'sem acesso' using errcode = '42501'; end if;
  elsif p_tipo <> 'pessoa' then
    raise exception 'tipo invalido' using errcode = '22023';
  end if;
  insert into denuncias(de, alvo, tipo, ref, pid, texto, motivo)
  values (me, p_alvo, p_tipo, left(p_ref, 200), left(p_pid, 200), left(t, 1200), left(nullif(btrim(coalesce(p_motivo,'')), ''), 500));
end $$;

-- ---------- leva 3: administração (só o administrador) ----------
create or replace function public.admin_membros() returns table(uid uuid, nome text, email text, papel text, convidado_por uuid,
  criado_em timestamptz, suspenso_em timestamptz, excluido_em timestamptz, cota_convites int, convites_usados int, amigos int)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.e_admin() then raise exception 'sem acesso' using errcode = '42501'; end if;
  return query select m.uid, m.nome, u.email::text, m.papel, m.convidado_por, m.criado_em, m.suspenso_em, m.excluido_em, m.cota_convites,
    (select count(*)::int from public.convites c where c.criado_por = m.uid and c.usado_em is not null),
    (select count(*)::int from public.amizades a where a.status = 'aceita' and m.uid in (a.de, a.para))
  from public.membros m left join auth.users u on u.id = m.uid
  order by m.criado_em;
end $$;

create or replace function public.admin_convites() returns table(codigo text, criado_por uuid, criado_em timestamptz, expira_em timestamptz, usado_por uuid, usado_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.e_admin() then raise exception 'sem acesso' using errcode = '42501'; end if;
  return query select c.codigo, c.criado_por, c.criado_em, c.expira_em, c.usado_por, c.usado_em from convites c order by c.criado_em desc limit 300;
end $$;

create or replace function public.admin_suspender(p_uid uuid, p_suspender boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.e_admin() or p_uid = auth.uid() then raise exception 'sem acesso' using errcode = '42501'; end if;
  update membros set suspenso_em = case when p_suspender then now() else null end where uid = p_uid and excluido_em is null;
end $$;

create or replace function public.admin_cota(p_uid uuid, p_delta int) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.e_admin() then raise exception 'sem acesso' using errcode = '42501'; end if;
  update membros set cota_convites = greatest(0, least(100, cota_convites + coalesce(p_delta,0))) where uid = p_uid returning cota_convites into n;
  return n;
end $$;

create or replace function public.admin_denuncias() returns table(id uuid, de uuid, alvo uuid, tipo text, ref text, pid text, texto text, motivo text, status text, criado_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.e_admin() then raise exception 'sem acesso' using errcode = '42501'; end if;
  return query select d.id, d.de, d.alvo, d.tipo, d.ref, d.pid, d.texto, d.motivo, d.status, d.criado_em from denuncias d order by (d.status = 'aberta') desc, d.criado_em desc limit 200;
end $$;

create or replace function public.admin_resolver_denuncia(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.e_admin() or p_status not in ('aberta','resolvida','descartada') then raise exception 'sem acesso' using errcode = '42501'; end if;
  update denuncias set status = p_status where id = p_id;
end $$;

create or replace function public.admin_apagar_comentario(p_uid uuid, p_cid text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.e_admin() then raise exception 'sem acesso' using errcode = '42501'; end if;
  update docs set data = data #- array['itens', p_cid], atualizado_em = now() where path = 'comentarios/' || p_uid::text;
end $$;

create or replace function public.admin_erros() returns table(id uuid, uid uuid, pid text, titulo text, texto text, status text, at bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.e_admin() then raise exception 'sem acesso' using errcode = '42501'; end if;
  return query select e.id, e.uid, e.pid, e.titulo, e.texto, e.status, e.at from erros e order by e.at desc limit 200;
end $$;

-- mensagens: quem recebe só pode marcar como lida
create or replace function public.msg_so_lida() returns trigger
language plpgsql as $$
begin
  if new.de is distinct from old.de or new.para is distinct from old.para or new.at is distinct from old.at
     or new.texto is distinct from old.texto or new.pid is distinct from old.pid or new.snap is distinct from old.snap
     or new.resp is distinct from old.resp or new.tipo is distinct from old.tipo then
    raise exception 'so pode marcar como lida' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists msg_so_lida on public.mensagens;
create trigger msg_so_lida before update on public.mensagens for each row execute function public.msg_so_lida();

-- ---------- regras de acesso (RLS) ----------
alter table public.membros enable row level security;
alter table public.convites enable row level security;
alter table public.amizades enable row level security;
alter table public.docs enable row level security;
alter table public.mensagens enable row level security;
alter table public.erros enable row level security;

drop policy if exists membros_ler on public.membros;
create policy membros_ler on public.membros for select to authenticated using (uid = auth.uid() or public.pode_ver_membro(uid));
drop policy if exists membros_nome on public.membros;
create policy membros_nome on public.membros for update to authenticated using (uid = auth.uid() and public.e_membro()) with check (uid = auth.uid());

drop policy if exists convites_ler on public.convites;
create policy convites_ler on public.convites for select to authenticated using (criado_por = auth.uid());

drop policy if exists amizades_ler on public.amizades;
create policy amizades_ler on public.amizades for select to authenticated using (de = auth.uid() or para = auth.uid());

drop policy if exists docs_ler on public.docs;
create policy docs_ler on public.docs for select to authenticated using (public.pode_ler_doc(path, col, owner));
drop policy if exists docs_criar on public.docs;
create policy docs_criar on public.docs for insert to authenticated with check (public.pode_escrever_doc(path, col, owner));
drop policy if exists docs_mudar on public.docs;
create policy docs_mudar on public.docs for update to authenticated using (public.pode_escrever_doc(path, col, owner)) with check (public.pode_escrever_doc(path, col, owner));
drop policy if exists docs_apagar on public.docs;
create policy docs_apagar on public.docs for delete to authenticated using (public.pode_escrever_doc(path, col, owner));

drop policy if exists msg_ler on public.mensagens;
create policy msg_ler on public.mensagens for select to authenticated using (de = auth.uid() or para = auth.uid());
drop policy if exists msg_enviar on public.mensagens;
create policy msg_enviar on public.mensagens for insert to authenticated with check (de = auth.uid() and public.e_membro() and public.sao_amigos(de, para));
drop policy if exists msg_lida on public.mensagens;
create policy msg_lida on public.mensagens for update to authenticated using (para = auth.uid()) with check (para = auth.uid());
drop policy if exists msg_apagar on public.mensagens;
create policy msg_apagar on public.mensagens for delete to authenticated using (de = auth.uid());

drop policy if exists erros_ler on public.erros;
create policy erros_ler on public.erros for select to authenticated using (uid = auth.uid());
drop policy if exists erros_enviar on public.erros;
create policy erros_enviar on public.erros for insert to authenticated with check (uid = auth.uid() and public.e_membro() and status = 'aberto');

alter table public.bloqueios enable row level security;
alter table public.denuncias enable row level security;
drop policy if exists bloqueios_ler on public.bloqueios;
create policy bloqueios_ler on public.bloqueios for select to authenticated using (de = auth.uid());

-- ---------- permissões ----------
revoke all on public.membros, public.convites, public.amizades, public.docs, public.mensagens, public.erros, public.bloqueios, public.denuncias from anon, authenticated;
grant select on public.bloqueios to authenticated;
grant select, update(nome) on public.membros to authenticated;
grant select on public.convites, public.amizades to authenticated;
grant select, insert, update, delete on public.docs to authenticated;
grant select, insert, delete on public.mensagens to authenticated;
grant update(lida) on public.mensagens to authenticated;
grant select, insert on public.erros to authenticated;

revoke execute on function public.doc_mesclar(text, jsonb), public.doc_gravar(text, jsonb), public.entrar(text, text),
  public.criar_convite(), public.pedir_amizade(uuid), public.responder_amizade(uuid, boolean),
  public.desfazer_amizade(uuid), public.excluir_conta() from public, anon;
grant execute on function public.doc_mesclar(text, jsonb), public.doc_gravar(text, jsonb), public.entrar(text, text),
  public.criar_convite(), public.pedir_amizade(uuid), public.responder_amizade(uuid, boolean),
  public.desfazer_amizade(uuid), public.excluir_conta() to authenticated;
grant execute on function public.erros_abertos() to anon, authenticated;
revoke execute on function public.e_membro(), public.sao_amigos(uuid, uuid), public.pode_ler_doc(text, text, uuid),
  public.pode_escrever_doc(text, text, uuid) from public, anon;
grant execute on function public.e_membro(), public.sao_amigos(uuid, uuid), public.pode_ler_doc(text, text, uuid),
  public.pode_escrever_doc(text, text, uuid) to authenticated;

do $$ declare f text; begin
  foreach f in array array['public.meus_convites()','public.revogar_convite(text)','public.buscar_membro(text)','public.amigos_em_comum()',
    'public.bloquear(uuid)','public.desbloquear(uuid)','public.meus_bloqueios()','public.denunciar(text, uuid, text, text, text)','public.admin_membros()',
    'public.admin_convites()','public.admin_suspender(uuid, boolean)','public.admin_cota(uuid, integer)','public.admin_denuncias()',
    'public.admin_resolver_denuncia(uuid, text)','public.admin_apagar_comentario(uuid, text)','public.admin_erros()',
    'public.e_admin()','public.pode_ver_membro(uuid)'] loop
    execute 'revoke execute on function ' || f || ' from public, anon';
    execute 'grant execute on function ' || f || ' to authenticated';
  end loop;
end $$;

-- funções auxiliares: fora do alcance do anon (o Supabase dá EXECUTE a anon por padrão em tudo de public)
revoke execute on function public.doc_info(text), public.jsonb_mescla(jsonb, jsonb), public.lista_par(text),
  public.col_social(text), public.msg_so_lida(), public.erros_servidor() from public, anon;
grant execute on function public.doc_info(text), public.jsonb_mescla(jsonb, jsonb), public.lista_par(text),
  public.col_social(text) to authenticated;   -- doc_mesclar/doc_gravar são security invoker e usam estas
-- erros_abertos() fica liberada para anon de propósito: a rodada automática lê os avisos sem chave secreta
-- (o texto do aviso, sem o nome de quem mandou; a política de privacidade do app avisa isso).

-- ---------- tempo real ----------
do $$
declare t text;
begin
  foreach t in array array['membros','amizades','docs','mensagens'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Realtime: eventos DELETE não passam pelo RLS e mandam a chave primária para QUALQUER logado (até não-membro):
--     quem desfez/recusou amizade (amizades.de/para) e as listas de quem excluiu a conta (docs.path = lista/uid_uid).
--     Sem DELETE no tempo real, o app pega essas mudanças na releitura periódica (até ~90 s) e ao voltar para o app.
alter publication supabase_realtime set (publish = 'insert, update');

-- Prumo News · Etapa 3: manchete fixada pelo administrador (pode rodar mais de uma vez)
create table if not exists public.config_app (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb,
  por uuid,
  atualizado_em timestamptz not null default now()
);
alter table public.config_app enable row level security;
-- sem políticas: a tabela só é lida e gravada pelas duas funções abaixo

-- qualquer pessoa (até sem conta) lê a manchete fixada, porque a capa é a mesma para todos
create or replace function public.capa_fixa() returns jsonb
language sql stable security definer set search_path = public as $$
  select valor from public.config_app
   where chave = 'capa_fixa' and coalesce((valor->>'ate')::timestamptz, now()) > now()
$$;

-- só o administrador fixa; pid vazio desfixa; prazo de 1 a 72 horas
create or replace function public.admin_fixar_manchete(p_pid text, p_horas int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.e_admin() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if coalesce(trim(p_pid), '') = '' then delete from public.config_app where chave = 'capa_fixa'; return; end if;
  if length(p_pid) > 120 then raise exception 'pid inválido'; end if;
  insert into public.config_app(chave, valor, por, atualizado_em)
  values ('capa_fixa', jsonb_build_object('pid', p_pid, 'ate', now() + make_interval(hours => greatest(1, least(72, coalesce(p_horas, 12))))), auth.uid(), now())
  on conflict (chave) do update set valor = excluded.valor, por = excluded.por, atualizado_em = now();
end $$;

revoke execute on function public.capa_fixa(), public.admin_fixar_manchete(text, int) from public;
grant execute on function public.capa_fixa() to anon, authenticated;
revoke execute on function public.admin_fixar_manchete(text, int) from anon;
grant execute on function public.admin_fixar_manchete(text, int) to authenticated;

-- Prumo News · Publicações dos membros (posts no Feed e stories de 24 h) — pode rodar mais de uma vez.
-- Quem vê: só o autor e os amigos dele (as mesmas regras de curtidas e comentários).

-- ---------- tabela das publicações ----------
create table if not exists public.publicacoes (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null references public.membros(uid) on delete cascade,
  tipo text not null check (tipo in ('post','story')),
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  expira bigint,
  texto text not null default '' check (char_length(texto) <= 2200),
  fotos jsonb not null default '[]'::jsonb check (jsonb_typeof(fotos) = 'array' and jsonb_array_length(fotos) <= 10),
  pid text check (char_length(coalesce(pid,'')) <= 200),
  snap jsonb check (snap is null or pg_column_size(snap) <= 16384),
  estilo jsonb check (estilo is null or pg_column_size(estilo) <= 2048)
);
create index if not exists publicacoes_autor_at_idx on public.publicacoes(autor, at desc);
create index if not exists publicacoes_at_idx on public.publicacoes(at desc);

alter table public.publicacoes enable row level security;
drop policy if exists pub_ler on public.publicacoes;
create policy pub_ler on public.publicacoes for select to authenticated using (
  public.e_membro() and (autor = auth.uid() or public.sao_amigos(auth.uid(), autor))
  and (tipo = 'post' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint));
drop policy if exists pub_criar on public.publicacoes;
create policy pub_criar on public.publicacoes for insert to authenticated with check (
  autor = auth.uid() and public.e_membro()
  and (tipo = 'post' or (expira is not null and expira <= at + 86460000)));
drop policy if exists pub_apagar on public.publicacoes;
create policy pub_apagar on public.publicacoes for delete to authenticated using (autor = auth.uid());

revoke all on public.publicacoes from anon, authenticated;
grant select, insert, delete on public.publicacoes to authenticated;

-- ---------- quem viu cada story ----------
create table if not exists public.pub_vistos (
  pub uuid not null references public.publicacoes(id) on delete cascade,
  uid uuid not null references public.membros(uid) on delete cascade,
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (pub, uid)
);
alter table public.pub_vistos enable row level security;
drop policy if exists vistos_ler on public.pub_vistos;
create policy vistos_ler on public.pub_vistos for select to authenticated using (
  uid = auth.uid() or exists(select 1 from public.publicacoes p where p.id = pub and p.autor = auth.uid()));
drop policy if exists vistos_marcar on public.pub_vistos;
create policy vistos_marcar on public.pub_vistos for insert to authenticated with check (
  uid = auth.uid() and public.e_membro() and exists(select 1 from public.publicacoes p where p.id = pub));
revoke all on public.pub_vistos from anon, authenticated;
grant select, insert on public.pub_vistos to authenticated;

-- ---------- tempo real (só inserções; o app relê de tempos em tempos) ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'publicacoes') then
    execute 'alter publication supabase_realtime add table public.publicacoes';
  end if;
end $$;
-- Prumo News · Publicações v2: Melhores Amigos e vídeos (stories e Reels) — pode rodar mais de uma vez.

-- ---------- Melhores Amigos ----------
create table if not exists public.melhores_amigos (
  dono uuid not null references public.membros(uid) on delete cascade,
  amigo uuid not null references public.membros(uid) on delete cascade,
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (dono, amigo)
);
alter table public.melhores_amigos enable row level security;
drop policy if exists ma_ler on public.melhores_amigos;
create policy ma_ler on public.melhores_amigos for select to authenticated using (dono = auth.uid() or amigo = auth.uid());
drop policy if exists ma_por on public.melhores_amigos;
create policy ma_por on public.melhores_amigos for insert to authenticated with check (
  dono = auth.uid() and public.e_membro() and public.sao_amigos(auth.uid(), amigo));
drop policy if exists ma_tirar on public.melhores_amigos;
create policy ma_tirar on public.melhores_amigos for delete to authenticated using (dono = auth.uid());
revoke all on public.melhores_amigos from anon, authenticated;
grant select, insert, delete on public.melhores_amigos to authenticated;

-- quem vê cada publicação: todos os amigos ou só os Melhores Amigos
alter table public.publicacoes add column if not exists publico text not null default 'amigos';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'publicacoes_publico_chk') then
    alter table public.publicacoes add constraint publicacoes_publico_chk check (publico in ('amigos','proximos'));
  end if;
end $$;
drop policy if exists pub_ler on public.publicacoes;
create policy pub_ler on public.publicacoes for select to authenticated using (
  public.e_membro() and (autor = auth.uid() or (public.sao_amigos(auth.uid(), autor)
    and (publico = 'amigos' or exists (select 1 from public.melhores_amigos m where m.dono = autor and m.amigo = auth.uid()))))
  and (tipo <> 'story' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint));

-- Reels (vídeo curto no Feed)
alter table public.publicacoes drop constraint if exists publicacoes_tipo_check;
alter table public.publicacoes add constraint publicacoes_tipo_check check (tipo in ('post','story','reel'));
drop policy if exists pub_criar on public.publicacoes;
create policy pub_criar on public.publicacoes for insert to authenticated with check (
  autor = auth.uid() and public.e_membro()
  and (tipo <> 'story' or (expira is not null and expira <= at + 86460000)));

-- Prumo News · Publicações v3: proteções do servidor — pode rodar mais de uma vez.
-- 1) A data da publicação e o fim do story são definidos pelo servidor (ninguém fixa post no topo nem faz story eterno).
-- 2) Fotos e vídeo de uma publicação têm de estar na pasta do próprio autor.
-- 3) Fotos e vídeos só podem ser abertos por quem pode ver a publicação (Melhores amigos e stories vencidos incluídos).
create or replace function public.pub_normaliza() returns trigger language plpgsql as $$
declare agora bigint := (extract(epoch from now())*1000)::bigint; f text;
begin
  new.at := agora;
  if new.tipo = 'story' then new.expira := agora + 86400000; else new.expira := null; end if;
  for f in select jsonb_array_elements_text(new.fotos) loop
    if position((new.autor::text || '/') in f) <> 1 then raise exception 'foto fora da pasta do autor'; end if;
  end loop;
  if new.estilo is not null and new.estilo ? 'video'
     and position((new.autor::text || '/') in coalesce(new.estilo->>'video', '')) <> 1 then
    raise exception 'video fora da pasta do autor';
  end if;
  return new;
end $$;
drop trigger if exists pub_normaliza on public.publicacoes;
create trigger pub_normaliza before insert on public.publicacoes for each row execute function public.pub_normaliza();


-- 4) Mais espaço para as configurações de cada publicação (marcas, texto alternativo, figurinhas)
alter table public.publicacoes drop constraint if exists publicacoes_estilo_check;
alter table public.publicacoes add constraint publicacoes_estilo_check check (estilo is null or pg_column_size(estilo) <= 8192);

-- 5) Link de convite aberto por quem já é membro: vira amizade com quem convidou
create or replace function public.convite_amizade(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); cv record;
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  select * into cv from convites where codigo = upper(btrim(coalesce(p_codigo,''))) for update;
  if found and cv.usado_por = me then return jsonb_build_object('ok', true, 'ja', true, 'usado', true, 'amigo', cv.criado_por); end if;
  if not found or cv.usado_em is not null or cv.expira_em < now() then return jsonb_build_object('ok', false, 'motivo', 'invalido'); end if;
  if cv.criado_por = me then return jsonb_build_object('ok', false, 'motivo', 'proprio'); end if;
  if exists(select 1 from bloqueios where (de = me and para = cv.criado_por) or (de = cv.criado_por and para = me))
     or exists(select 1 from membros where uid = cv.criado_por and (suspenso_em is not null or excluido_em is not null)) then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;
  if public.sao_amigos(me, cv.criado_por) then return jsonb_build_object('ok', true, 'ja', true, 'amigo', cv.criado_por); end if;
  update convites set usado_por = me, usado_em = now() where codigo = cv.codigo;
  update amizades set status = 'aceita' where (de = me and para = cv.criado_por) or (de = cv.criado_por and para = me);
  if not found then insert into amizades(de, para, status) values (cv.criado_por, me, 'aceita') on conflict do nothing; end if;
  return jsonb_build_object('ok', true, 'amigo', cv.criado_por);
end $$;
revoke all on function public.convite_amizade(text) from public, anon;
grant execute on function public.convite_amizade(text) to authenticated;
-- Prumo News · Publicações v4: curtidas, comentários e votos das publicações dos membros — pode rodar mais de uma vez.
-- Ficam guardados junto da publicação e só quem pode ver a publicação vê quem curtiu, comentou ou votou.
-- "Desativar comentários" passa a valer também no servidor.
create table if not exists public.pub_reacoes (
  pub uuid not null references public.publicacoes(id) on delete cascade,
  uid uuid not null references public.membros(uid) on delete cascade,
  tipo text not null check (tipo in ('curtida','comentario','voto')),
  chave text not null default '' check (char_length(chave) <= 80),
  valor jsonb not null default '{}'::jsonb check (pg_column_size(valor) <= 4096),
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (pub, uid, tipo, chave)
);
create index if not exists pub_reacoes_pub_idx on public.pub_reacoes(pub);
alter table public.pub_reacoes enable row level security;

drop policy if exists reac_ler on public.pub_reacoes;
create policy reac_ler on public.pub_reacoes for select to authenticated using (
  public.e_membro() and exists (select 1 from public.publicacoes p where p.id = pub));
drop policy if exists reac_criar on public.pub_reacoes;
create policy reac_criar on public.pub_reacoes for insert to authenticated with check (
  uid = auth.uid() and public.e_membro()
  and exists (select 1 from public.publicacoes p where p.id = pub)
  and (tipo <> 'comentario' or not exists (select 1 from public.publicacoes p where p.id = pub and coalesce(p.estilo->>'semCom', 'false') = 'true')));
drop policy if exists reac_apagar on public.pub_reacoes;
create policy reac_apagar on public.pub_reacoes for delete to authenticated using (
  uid = auth.uid() or exists (select 1 from public.publicacoes p where p.id = pub and p.autor = auth.uid()));
revoke all on public.pub_reacoes from anon, authenticated;
grant select, insert, delete on public.pub_reacoes to authenticated;

-- a hora é a do servidor
create or replace function public.reac_normaliza() returns trigger language plpgsql as $$
begin new.at := (extract(epoch from now())*1000)::bigint; return new; end $$;
drop trigger if exists reac_normaliza on public.pub_reacoes;
create trigger reac_normaliza before insert on public.pub_reacoes for each row execute function public.reac_normaliza();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pub_reacoes') then
    execute 'alter publication supabase_realtime add table public.pub_reacoes';
  end if;
end $$;
-- Prumo News · Publicações v5: arquivo de stories, destaques no perfil, editar legenda e fixar posts — pode rodar mais de uma vez.

-- ---------- editar e fixar ----------
alter table public.publicacoes add column if not exists fixado bigint;
alter table public.publicacoes add column if not exists editado bigint;
drop policy if exists pub_editar on public.publicacoes;
create policy pub_editar on public.publicacoes for update to authenticated using (autor = auth.uid()) with check (autor = auth.uid());
revoke update on public.publicacoes from authenticated;
grant update (texto, estilo, fixado, editado) on public.publicacoes to authenticated;
create or replace function public.pub_edita() returns trigger language plpgsql as $$
begin
  if new.texto is distinct from old.texto then new.editado := (extract(epoch from now())*1000)::bigint; end if;
  if new.fixado is not null and old.fixado is null then
    if new.tipo <> 'post' then raise exception 'so posts podem ser fixados'; end if;
    if (select count(*) from public.publicacoes where autor = new.autor and fixado is not null and id <> new.id) >= 3 then raise exception 'no maximo 3 fixados'; end if;
    new.fixado := (extract(epoch from now())*1000)::bigint;
  elsif new.fixado is not null and old.fixado is not null then
    new.fixado := old.fixado;  -- a hora de fixar é do servidor e não muda depois
  end if;
  if coalesce(new.estilo->>'video', '') is distinct from coalesce(old.estilo->>'video', '') then raise exception 'o video nao muda'; end if;
  return new;
end $$;
drop trigger if exists pub_edita on public.publicacoes;
create trigger pub_edita before update on public.publicacoes for each row execute function public.pub_edita();

-- ---------- destaques ----------
create table if not exists public.destaques (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references public.membros(uid) on delete cascade,
  nome text not null default 'Destaque' check (char_length(nome) between 1 and 30),
  itens uuid[] not null default '{}' check (cardinality(itens) <= 100),
  capa uuid,
  ordem int not null default 0,
  at bigint not null default (extract(epoch from now())*1000)::bigint
);
create index if not exists destaques_dono_idx on public.destaques(dono);
alter table public.destaques enable row level security;
drop policy if exists dest_ler on public.destaques;
create policy dest_ler on public.destaques for select to authenticated using (
  public.e_membro() and (dono = auth.uid() or public.sao_amigos(auth.uid(), dono)));
drop policy if exists dest_criar on public.destaques;
create policy dest_criar on public.destaques for insert to authenticated with check (dono = auth.uid() and public.e_membro());
drop policy if exists dest_mudar on public.destaques;
create policy dest_mudar on public.destaques for update to authenticated using (dono = auth.uid()) with check (dono = auth.uid());
drop policy if exists dest_apagar on public.destaques;
create policy dest_apagar on public.destaques for delete to authenticated using (dono = auth.uid());
revoke all on public.destaques from anon, authenticated;
grant select, insert, update, delete on public.destaques to authenticated;
create or replace function public.dest_confere() returns trigger language plpgsql as $$
begin
  -- story que já foi apagado sai da lista sozinho (assim o destaque continua editável), sem repetir ids
  new.itens := array(select i from (select i, min(o) o from unnest(new.itens) with ordinality u(i, o) group by i) x
                     where exists (select 1 from public.publicacoes p where p.id = x.i) order by x.o);
  if exists (select 1 from unnest(new.itens) i where not exists (select 1 from public.publicacoes p where p.id = i and p.autor = new.dono and p.tipo = 'story')) then
    raise exception 'destaque so com stories do proprio dono';
  end if;
  return new;
end $$;
drop trigger if exists dest_confere on public.destaques;
create trigger dest_confere before insert or update on public.destaques for each row execute function public.dest_confere();

-- story que está num destaque não é apagado sem antes sair do destaque
-- (protege contra a limpeza automática de uma versão antiga do app; o app novo tira do destaque antes de apagar)
create or replace function public.pub_protege_destaque() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.tipo = 'story'
     and exists (select 1 from public.destaques d where d.dono = old.autor and old.id = any(d.itens))
     and exists (select 1 from public.membros m where m.uid = old.autor) then
    raise exception 'story em destaque: tire do destaque antes de apagar';
  end if;
  return old;
end $$;
drop trigger if exists pub_protege_destaque on public.publicacoes;
create trigger pub_protege_destaque before delete on public.publicacoes for each row execute function public.pub_protege_destaque();

-- stories que estão num destaque continuam visíveis para os amigos depois das 24 horas
drop policy if exists pub_ler on public.publicacoes;
create policy pub_ler on public.publicacoes for select to authenticated using (
  public.e_membro() and (autor = auth.uid() or (public.sao_amigos(auth.uid(), autor)
    and (publico = 'amigos' or exists (select 1 from public.melhores_amigos m where m.dono = autor and m.amigo = auth.uid()))))
  and (tipo <> 'story' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint
       or exists (select 1 from public.destaques d where d.dono = publicacoes.autor and publicacoes.id = any(d.itens))));

-- Prumo News · v7: correções da revisão geral de 02/11 (segurança, denúncias, exclusão de conta, limites).
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Precisa das versões v2 a v6 já rodadas. Também reafirma as regras finais de quem lê o quê
-- (se alguma versão antiga tiver sido rodada de novo fora de ordem, esta deixa tudo certo outra vez).

-- 1. Publicação nova não nasce fixada nem "editada" (só o servidor marca isso depois)
create or replace function public.pub_normaliza() returns trigger language plpgsql as $$
declare agora bigint := (extract(epoch from now())*1000)::bigint; f text;
begin
  new.at := agora;
  new.fixado := null;
  new.editado := null;
  if new.tipo = 'story' then new.expira := agora + 86400000; else new.expira := null; end if;
  for f in select jsonb_array_elements_text(new.fotos) loop
    if position((new.autor::text || '/') in f) <> 1 then raise exception 'foto fora da pasta do autor'; end if;
  end loop;
  if new.estilo is not null and new.estilo ? 'video'
     and position((new.autor::text || '/') in coalesce(new.estilo->>'video', '')) <> 1 then
    raise exception 'video fora da pasta do autor';
  end if;
  return new;
end $$;

-- 2. Mensagens: a hora é a do servidor, chegam como não lidas, e há limite contra enxurrada
create or replace function public.msg_normaliza() returns trigger language plpgsql as $$
declare agora bigint := (extract(epoch from now())*1000)::bigint;
begin
  new.at := agora;
  new.lida := false;
  if (select count(*) from public.mensagens where de = new.de and at > agora - 60000) >= 40
     or (select count(*) from public.mensagens where de = new.de and at > agora - 86400000) >= 2000 then
    raise exception 'mensagens demais' using errcode = '54000';
  end if;
  return new;
end $$;
drop trigger if exists msg_normaliza on public.mensagens;
create trigger msg_normaliza before insert on public.mensagens for each row execute function public.msg_normaliza();

-- 3. Curtidas, comentários e votos em publicações: hora do servidor e limite de comentários
create or replace function public.reac_normaliza() returns trigger language plpgsql as $$
declare agora bigint := (extract(epoch from now())*1000)::bigint;
begin
  new.at := agora;
  if new.tipo = 'comentario' and (
       (select count(*) from public.pub_reacoes where uid = new.uid and tipo = 'comentario' and at > agora - 60000) >= 20
    or (select count(*) from public.pub_reacoes where uid = new.uid and pub = new.pub and tipo = 'comentario') >= 300) then
    raise exception 'comentarios demais' using errcode = '54000';
  end if;
  if new.tipo = 'voto' and (select count(*) from public.pub_reacoes where uid = new.uid and pub = new.pub and tipo = 'voto') >= 40 then
    raise exception 'votos demais' using errcode = '54000';
  end if;
  return new;
end $$;

-- 4. Denúncia de comentário em publicação de membro (antes só achava os comentários das notícias)
create or replace function public.denunciar(p_tipo text, p_alvo uuid, p_ref text, p_pid text, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t text; pubid uuid;
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if (select count(*) from denuncias where de = me and criado_em > now() - interval '1 day') >= 20 then
    raise exception 'denuncias demais' using errcode = '54000';
  end if;
  if p_tipo = 'comentario' then
    if coalesce(p_pid, '') ~ '^u:[0-9a-fA-F-]{36}$' then
      pubid := substr(p_pid, 3)::uuid;
      if not exists (select 1 from publicacoes p where p.id = pubid and (p.autor = me or public.sao_amigos(me, p.autor))) then
        raise exception 'sem acesso' using errcode = '42501';
      end if;
      select r.valor ->> 'texto' into t from pub_reacoes r where r.pub = pubid and r.uid = p_alvo and r.tipo = 'comentario' and r.chave = p_ref;
    else
      if not (p_alvo = me or public.sao_amigos(me, p_alvo)) then raise exception 'sem acesso' using errcode = '42501'; end if;
      select d.data -> 'itens' -> p_ref ->> 'texto' into t from docs d where d.path = 'comentarios/' || p_alvo::text;
    end if;
  elsif p_tipo = 'mensagem' then
    select m.texto, m.de into t, p_alvo from mensagens m where m.id::text = p_ref and m.para = me;
    if p_alvo is null then raise exception 'sem acesso' using errcode = '42501'; end if;
  elsif p_tipo <> 'pessoa' then
    raise exception 'tipo invalido' using errcode = '22023';
  end if;
  insert into denuncias(de, alvo, tipo, ref, pid, texto, motivo)
  values (me, p_alvo, p_tipo, left(p_ref, 200), left(p_pid, 200), left(t, 1200), left(nullif(btrim(coalesce(p_motivo,'')), ''), 500));
end $$;

-- 5. "Apagar comentário" do administrador apaga também os comentários de publicações de membros
create or replace function public.admin_apagar_comentario(p_uid uuid, p_cid text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.e_admin() then raise exception 'sem acesso' using errcode = '42501'; end if;
  update docs set data = data #- array['itens', p_cid], atualizado_em = now() where path = 'comentarios/' || p_uid::text;
  delete from pub_reacoes where uid = p_uid and tipo = 'comentario' and chave = p_cid;
end $$;

-- 6. Aceitar um pedido que não existe mais (foi cancelado) avisa em vez de fingir que deu certo
create or replace function public.responder_amizade(p_uid uuid, p_aceitar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int;
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if p_aceitar then
    update amizades set status = 'aceita' where de = p_uid and para = me and status in ('pendente', 'aceita');
  else
    update amizades set status = 'recusada' where de = p_uid and para = me and status = 'pendente';
  end if;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'pedido nao existe mais' using errcode = 'P0002'; end if;
end $$;

-- 7. Limite de 20 pedidos conta só os pendentes (recusas antigas não travam quem pede)
create or replace function public.pedir_amizade(p_uid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.e_membro() or p_uid is null or p_uid = me or not exists(select 1 from membros where uid = p_uid) then
    raise exception 'pedido invalido' using errcode = '22023';
  end if;
  if exists(select 1 from bloqueios where (de = me and para = p_uid) or (de = p_uid and para = me))
     or exists(select 1 from membros where uid = p_uid and (suspenso_em is not null or excluido_em is not null)) then
    raise exception 'pedido invalido' using errcode = '22023';
  end if;
  if exists(select 1 from amizades where de = p_uid and para = me) then
    update amizades set status = 'aceita' where de = p_uid and para = me;
    return 'aceita';
  end if;
  if not exists(select 1 from amizades where de = me and para = p_uid)
     and (select count(*) from amizades where de = me and status = 'pendente') >= 20 then
    raise exception 'pedidos demais' using errcode = '54000';
  end if;
  insert into amizades(de, para) values (me, p_uid) on conflict do nothing;
  return case (select status from amizades where de = me and para = p_uid) when 'aceita' then 'aceita' else 'pendente' end;
end $$;

-- 8. Bloquear e desbloquear não apaga a recusa de quem recusou (senão dava para pedir de novo)
create or replace function public.bloquear(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.e_membro() or p_uid is null or p_uid = me then raise exception 'pedido invalido' using errcode = '22023'; end if;
  insert into bloqueios(de, para) values (me, p_uid) on conflict do nothing;
  delete from amizades where ((de = me and para = p_uid) or (de = p_uid and para = me))
    and not (de = me and status = 'recusada');
end $$;

-- 9. Desfez a amizade (ou bloqueou): sai também das listas de Melhores amigos dos dois
create or replace function public.amz_limpa_ma() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'aceita' then
    delete from melhores_amigos where (dono = old.de and amigo = old.para) or (dono = old.para and amigo = old.de);
  end if;
  return old;
end $$;
drop trigger if exists amz_limpa_ma on public.amizades;
create trigger amz_limpa_ma after delete on public.amizades for each row execute function public.amz_limpa_ma();

-- 10. Excluir a conta apaga também publicações, reações, destaques, listas e visualizações
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
  delete from public.pub_reacoes where uid = me;
  delete from public.pub_vistos where uid = me;
  delete from public.publicacoes where autor = me;
  -- as mensagens ficam com quem conversou, mostrando "Conta excluída"; as fotos e vídeos o app apaga antes de chamar esta função
  update public.membros set nome = 'Conta excluída', excluido_em = now(), papel = 'membro' where uid = me;
  delete from auth.users where id = me;
end $$;

-- 11. Regras finais de quem lê o quê (as mesmas das versões v3 e v5, reafirmadas)
drop policy if exists pub_ler on public.publicacoes;
create policy pub_ler on public.publicacoes for select to authenticated using (
  public.e_membro() and (autor = auth.uid() or (public.sao_amigos(auth.uid(), autor)
    and (publico = 'amigos' or exists (select 1 from public.melhores_amigos m where m.dono = autor and m.amigo = auth.uid()))))
  and (tipo <> 'story' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint
       or exists (select 1 from public.destaques d where d.dono = publicacoes.autor and publicacoes.id = any(d.itens))));
