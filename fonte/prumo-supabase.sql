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
-- (o passo 10, das regras dos arquivos no Storage, fica só em sql/publicacoes-v8.sql: o banco dos testes não tem Storage)
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
-- (o passo 10, da foto de perfil aberto no Storage, fica só em sql/publicacoes-v9.sql: o banco dos testes não tem Storage)
-- Prumo News · v10: notificações no celular (Web Push) — aparelhos inscritos e fila de avisos.
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Precisa das versões v2 a v8 já rodadas. Funciona com ou sem a v9 ("Seguir"): se a tabela "seguidores" existir,
-- passam a valer também os avisos de novo seguidor e de posts e colunas de quem você segue.
-- Se a v9 for rodada DEPOIS desta, rode esta de novo (ela liga o aviso de novo seguidor).
-- Esta versão não envia nada sozinha: ela só guarda os aparelhos e põe os avisos numa fila.
-- Quem envia é a função "enviar-push" (passo a passo em supabase/LEIA-ME-push.md). Sem a função, a fila se limpa sozinha em 3 dias.
-- Nada aqui guarda chave secreta: a chave PÚBLICA do VAPID fica em config_app (é pública por natureza); a privada fica só nos segredos da função.
-- O app novo funciona antes e depois desta versão: sem ela, a página Notificações mostra só os avisos dentro do app.

-- 1. Aparelhos inscritos: cada celular/navegador que ligou as notificações, com as escolhas de cada tipo de aviso
create table if not exists public.push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references public.membros(uid) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 10 and 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  prefs jsonb not null default '{}'::jsonb check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) <= 2048),
  ua text check (char_length(coalesce(ua, '')) <= 200),
  created_at timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists push_inscricoes_uid_idx on public.push_inscricoes(uid);

-- os tipos de aviso (os mesmos nomes do app)
create or replace function public.push_tipo_ok(t text) returns boolean
language sql immutable as $$
  select t in ('mensagens','amizades','comentarios','mencoes','curtidas','reposts','seguidores','seguindo','coberturas','colunas')
$$;

-- as escolhas ficam só com os tipos conhecidos e com sim/não (true/false)
create or replace function public.push_inscricoes_normaliza() returns trigger
language plpgsql as $$
begin
  new.prefs := coalesce((select jsonb_object_agg(k, v) from jsonb_each(coalesce(new.prefs, '{}'::jsonb)) as e(k, v)
                          where public.push_tipo_ok(k) and jsonb_typeof(v) = 'boolean'), '{}'::jsonb);
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists push_inscricoes_normaliza on public.push_inscricoes;
create trigger push_inscricoes_normaliza before insert or update on public.push_inscricoes
  for each row execute function public.push_inscricoes_normaliza();

-- quem lê e muda: só o dono do aparelho (a função de envio usa a chave de serviço, que passa por cima disto)
alter table public.push_inscricoes enable row level security;
drop policy if exists push_insc_ler on public.push_inscricoes;
create policy push_insc_ler on public.push_inscricoes for select to authenticated using (uid = auth.uid());
drop policy if exists push_insc_criar on public.push_inscricoes;
create policy push_insc_criar on public.push_inscricoes for insert to authenticated with check (uid = auth.uid() and public.e_membro());
drop policy if exists push_insc_mudar on public.push_inscricoes;
create policy push_insc_mudar on public.push_inscricoes for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());
drop policy if exists push_insc_apagar on public.push_inscricoes;
create policy push_insc_apagar on public.push_inscricoes for delete to authenticated using (uid = auth.uid());
revoke all on public.push_inscricoes from anon, authenticated;
grant select, insert, delete on public.push_inscricoes to authenticated;
grant update (prefs) on public.push_inscricoes to authenticated;

-- inscrever este aparelho (ou atualizar). Se o aparelho era de outra conta (trocou de login), passa para esta.
-- Até 10 aparelhos por pessoa: o mais antigo sai.
create or replace function public.push_inscrever(p_endpoint text, p_p256dh text, p_auth text, p_prefs jsonb, p_ua text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  delete from public.push_inscricoes where endpoint = p_endpoint and uid <> me;
  insert into public.push_inscricoes(uid, endpoint, p256dh, auth, prefs, ua)
  values (me, p_endpoint, p_p256dh, p_auth, coalesce(p_prefs, '{}'::jsonb), left(p_ua, 200))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, prefs = excluded.prefs, ua = excluded.ua;
  delete from public.push_inscricoes where uid = me and id in (
    select id from public.push_inscricoes where uid = me order by atualizado_em desc offset 10);
end $$;
revoke all on function public.push_inscrever(text, text, text, jsonb, text) from public, anon;
grant execute on function public.push_inscrever(text, text, text, jsonb, text) to authenticated;

-- 2. A chave PÚBLICA do VAPID (o app precisa dela para inscrever o aparelho). Vazia = "ainda não ativado pelo administrador".
--    O Pedro grava assim (SQL Editor), trocando pelo valor de "Public Key":
--    insert into public.config_app(chave, valor) values ('push_vapid_publica', jsonb_build_object('chave', 'COLE_A_CHAVE_PUBLICA'))
--      on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
create or replace function public.push_chave_publica() returns text
language sql stable security definer set search_path = public as $$
  select nullif(btrim(valor->>'chave'), '') from public.config_app where chave = 'push_vapid_publica'
$$;
revoke all on function public.push_chave_publica() from public, anon;
grant execute on function public.push_chave_publica() to authenticated;

-- 3. A fila de avisos: os gatilhos abaixo põem aqui; a função enviar-push lê, agrupa e envia.
--    Ninguém do app lê nem escreve nesta tabela (só a função, com a chave de serviço).
create table if not exists public.push_fila (
  id bigint generated always as identity primary key,
  para uuid not null references public.membros(uid) on delete cascade,
  tipo text not null check (public.push_tipo_ok(tipo)),
  de uuid references public.membros(uid) on delete cascade,
  chave text not null default '' check (char_length(chave) <= 120),
  titulo text not null check (char_length(titulo) <= 140),
  corpo text not null default '' check (char_length(corpo) <= 300),
  url text not null default './' check (char_length(url) <= 300),
  estado text not null default 'pendente' check (estado in ('pendente','processando','enviado','agrupado','sem_destino','falhou')),
  criado_em timestamptz not null default now(),
  enviado_em timestamptz
);
create index if not exists push_fila_estado_idx on public.push_fila(estado, criado_em);
create index if not exists push_fila_grupo_idx on public.push_fila(para, tipo, chave, enviado_em);
alter table public.push_fila enable row level security;
revoke all on public.push_fila from anon, authenticated;

-- alguém quer este tipo de aviso em algum aparelho?
create or replace function public.push_quer(p_uid uuid, p_tipo text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.push_inscricoes where uid = p_uid and prefs ->> p_tipo = 'true')
$$;
create or replace function public.push_nome(p_uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select nome from public.membros where uid = p_uid), 'Alguém')
$$;
create or replace function public.push_corta(t text, n int) returns text
language sql immutable as $$
  select case when char_length(btrim(coalesce(t, ''))) <= n then btrim(coalesce(t, ''))
              else rtrim(left(btrim(t), n - 1)) || '…' end
$$;

-- põe um aviso na fila, só se: não é para si mesmo, a pessoa quer esse tipo em algum aparelho,
-- ninguém bloqueou ninguém e a conta de quem recebe está ativa
create or replace function public.push_enfileirar(p_para uuid, p_tipo text, p_de uuid, p_chave text, p_titulo text, p_corpo text, p_url text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_para is null or p_para = p_de or not public.push_tipo_ok(p_tipo) then return false; end if;
  if not public.push_quer(p_para, p_tipo) then return false; end if;
  if p_de is not null and exists (select 1 from public.bloqueios where (de = p_para and para = p_de) or (de = p_de and para = p_para)) then return false; end if;
  if exists (select 1 from public.membros where uid = p_para and (suspenso_em is not null or excluido_em is not null)) then return false; end if;
  insert into public.push_fila(para, tipo, de, chave, titulo, corpo, url)
  values (p_para, p_tipo, p_de, left(coalesce(p_chave, ''), 120), public.push_corta(p_titulo, 140), public.push_corta(p_corpo, 300), left(coalesce(p_url, './'), 300));
  -- limpeza de vez em quando: o que tem mais de 3 dias sai
  if random() < 0.05 then delete from public.push_fila where criado_em < now() - interval '3 days'; end if;
  return true;
end $$;

-- quem segue quem (só se a v9 existir; as colunas são descobertas na hora, sem depender da ordem das versões)
create or replace function public.push_seguidores_de(p_uid uuid) returns setof uuid
language plpgsql stable security definer set search_path = public as $$
declare c_de text; c_para text;
begin
  if to_regclass('public.seguidores') is null then return; end if;
  select column_name into c_de from information_schema.columns where table_schema = 'public' and table_name = 'seguidores'
     and column_name in ('seguidor','de','uid','quem') order by array_position(array['seguidor','de','uid','quem'], column_name::text) limit 1;
  select column_name into c_para from information_schema.columns where table_schema = 'public' and table_name = 'seguidores'
     and column_name in ('seguido','para','alvo','autor') order by array_position(array['seguido','para','alvo','autor'], column_name::text) limit 1;
  if c_de is null or c_para is null then return; end if;
  return query execute format('select %I from public.seguidores where %I = $1', c_de, c_para) using p_uid;
end $$;

-- quem recebe o aviso de uma publicação consegue vê-la? (as mesmas regras de leitura das publicações)
create or replace function public.push_pode_ver(p_quem uuid, p_autor uuid, p_publico text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare pub text := coalesce(p_publico, 'amigos');
begin
  if p_quem = p_autor then return true; end if;
  if exists (select 1 from public.bloqueios b where (b.de = p_quem and b.para = p_autor) or (b.de = p_autor and b.para = p_quem)) then return false; end if;
  if public.sao_amigos(p_quem, p_autor) and (pub in ('amigos', 'seguidores', 'todos', 'publico')
       or exists (select 1 from public.melhores_amigos m where m.dono = p_autor and m.amigo = p_quem)) then return true; end if;
  -- quem só segue (v9): vê o que é "para seguidores" enquanto o perfil do autor estiver aberto
  if pub in ('seguidores', 'todos', 'publico') and exists (select 1 from public.push_seguidores_de(p_autor) s(u) where s.u = p_quem) then
    begin
      return exists (select 1 from public.membros m where m.uid = p_autor and coalesce((to_jsonb(m) ->> 'perfil_aberto')::boolean, false));
    exception when others then return false;
    end;
  end if;
  return false;
end $$;

-- 4. Gatilhos: cada coisa nova vira um aviso na fila. Qualquer erro aqui é engolido:
--    um aviso nunca impede a mensagem, a curtida ou o post de ser gravado.

-- mensagens (e menções, que chegam como mensagem)
create or replace function public.push_t_mensagens() returns trigger
language plpgsql security definer set search_path = public as $$
declare n text; t text := coalesce(new.tipo, '');
begin
  begin
    n := public.push_nome(new.de);
    if t = 'mencao' then
      perform public.push_enfileirar(new.para, 'mencoes', new.de, 'men:' || new.de, n || ' mencionou você',
        case when coalesce(btrim(new.texto), '') = '' or new.texto = 'Mencionou você no story' then 'Toque para ver.' else new.texto end, '?nt=atividade');
    elsif t = 'curtiu_story' then
      perform public.push_enfileirar(new.para, 'curtidas', new.de, 'cst:' || new.de, n || ' curtiu seu story', '', '?nt=conversa:' || new.de);
    else
      perform public.push_enfileirar(new.para, 'mensagens', new.de, 'conv:' || new.de, n,
        case when t = 'reacao_msg' then 'Reagiu à sua mensagem: ' || public.push_corta(new.texto, 40)
             when coalesce(btrim(new.texto), '') <> '' then new.texto
             when new.pid is not null then 'Enviou uma publicação'
             else 'Enviou uma mensagem' end, '?nt=conversa:' || new.de);
    end if;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_mensagens on public.mensagens;
create trigger push_t_mensagens after insert on public.mensagens for each row execute function public.push_t_mensagens();

-- pedidos de amizade e pedido aceito
create or replace function public.push_t_amizades() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' and new.status = 'pendente' then
      perform public.push_enfileirar(new.para, 'amizades', new.de, 'amz:' || new.de, public.push_nome(new.de) || ' quer ser seu amigo',
        'Toque para aceitar ou recusar.', '?nt=pedidos');
    elsif tg_op = 'UPDATE' and new.status = 'aceita' and old.status is distinct from 'aceita' then
      perform public.push_enfileirar(new.de, 'amizades', new.para, 'amz:' || new.para, public.push_nome(new.para) || ' aceitou seu pedido de amizade',
        'Agora vocês são amigos no Prumo.', '?nt=perfil:' || new.para);
    end if;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_amizades on public.amizades;
create trigger push_t_amizades after insert or update of status on public.amizades for each row execute function public.push_t_amizades();

-- curtidas e comentários nas publicações (e "também comentou" para quem já comentou no mesmo post)
create or replace function public.push_t_reacoes() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; n text; oque text; o uuid;
begin
  begin
    select id, autor, tipo, estilo, publico into p from public.publicacoes where id = new.pub;
    if not found then return null; end if;
    n := public.push_nome(new.uid);
    oque := case when p.tipo = 'story' then 'seu story' when coalesce(p.estilo->>'reel', '') in ('true', '1') then 'seu reel' else 'seu post' end;
    if new.tipo = 'comentario' then
      perform public.push_enfileirar(p.autor, 'comentarios', new.uid, 'cmt:' || new.pub, n || ' comentou no ' || oque,
        coalesce(new.valor->>'texto', ''), '?nt=comentarios:' || new.pub);
      for o in select distinct r.uid from public.pub_reacoes r
                where r.pub = new.pub and r.tipo = 'comentario' and r.uid <> new.uid and r.uid <> p.autor
                  -- só quem conhece quem comentou (amigo, ou um segue o outro; o autor do post todos conhecem):
                  -- quem só segue o autor não recebe o nome nem o texto de um amigo do autor que não conhece, e vice-versa
                  and (new.uid = p.autor
                       or exists (select 1 from public.amizades a where a.status = 'aceita' and ((a.de = r.uid and a.para = new.uid) or (a.de = new.uid and a.para = r.uid)))
                       or exists (select 1 from public.push_seguidores_de(r.uid) s(u) where s.u = new.uid)
                       or exists (select 1 from public.push_seguidores_de(new.uid) s(u) where s.u = r.uid))
                  -- e quem recebe ainda vê o post (continua amigo do autor, ou segue o perfil aberto num post para seguidores)
                  and (exists (select 1 from public.amizades a where a.status = 'aceita' and ((a.de = r.uid and a.para = p.autor) or (a.de = p.autor and a.para = r.uid)))
                       or (p.publico = 'seguidores' and exists (select 1 from public.push_seguidores_de(p.autor) s(u) where s.u = r.uid)
                           and coalesce((select (to_jsonb(m) ->> 'perfil_aberto')::boolean from public.membros m where m.uid = p.autor), false)))
                limit 30 loop
        perform public.push_enfileirar(o, 'comentarios', new.uid, 'cmt:' || new.pub, n || ' também comentou no post de ' || public.push_nome(p.autor),
          coalesce(new.valor->>'texto', ''), '?nt=comentarios:' || new.pub);
      end loop;
    elsif new.tipo = 'curtida' then
      perform public.push_enfileirar(p.autor, 'curtidas', new.uid, 'curt:' || new.pub, n || ' curtiu ' || oque, '', '?nt=atividade');
    end if;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_reacoes on public.pub_reacoes;
create trigger push_t_reacoes after insert on public.pub_reacoes for each row execute function public.push_t_reacoes();

-- curtida em comentário (da v8)
create or replace function public.push_t_com_curtidas() returns trigger
language plpgsql security definer set search_path = public as $$
declare tx text; pid text;
begin
  begin
    if new.pub is not null then
      select valor->>'texto' into tx from public.pub_reacoes where pub = new.pub and uid = new.autor and tipo = 'comentario' and chave = new.cid;
    else
      select d.data->'itens'->new.cid->>'texto', d.data->'itens'->new.cid->>'pid' into tx, pid
        from public.docs d where d.path = 'comentarios/' || new.autor::text;
    end if;
    perform public.push_enfileirar(new.autor, 'curtidas', new.uid, 'cc:' || new.cid, public.push_nome(new.uid) || ' curtiu seu comentário',
      coalesce(tx, ''), case when new.pub is not null then '?nt=comentarios:' || new.pub when pid is not null then '?nt=noticia:' || pid else '?nt=atividade' end);
  exception when others then null;
  end;
  return null;
end $$;
do $$
begin
  if to_regclass('public.com_curtidas') is not null then
    execute 'drop trigger if exists push_t_com_curtidas on public.com_curtidas';
    execute 'create trigger push_t_com_curtidas after insert on public.com_curtidas for each row execute function public.push_t_com_curtidas()';
  end if;
end $$;

-- comentário numa notícia em que você também comentou (os comentários de notícia ficam em docs "comentarios/<pessoa>")
create or replace function public.push_t_docs_comentarios() returns trigger
language plpgsql security definer set search_path = public as $$
declare it record; o uuid; n text; tit text;
begin
  begin
    select e.key, e.value into it from jsonb_each(coalesce(new.data->'itens', '{}'::jsonb)) as e(key, value)
     where jsonb_typeof(e.value) = 'object'
       and (tg_op = 'INSERT' or not coalesce(old.data->'itens' ? e.key, false))
     order by coalesce((e.value->>'at')::bigint, 0) desc limit 1;
    if not found or coalesce(it.value->>'pid', '') = '' or it.value->>'pid' like 'u:%' then return null; end if;
    n := public.push_nome(new.owner);
    tit := coalesce(nullif(it.value->'snap'->>'titulo', ''), 'uma notícia');
    for o in select d.owner from public.docs d
              where d.col = 'comentarios' and d.owner is not null and d.owner <> new.owner and public.sao_amigos(d.owner, new.owner)
                and exists (select 1 from jsonb_each(coalesce(d.data->'itens', '{}'::jsonb)) as x(k, v)
                             where jsonb_typeof(x.v) = 'object' and x.v->>'pid' = it.value->>'pid')
              limit 30 loop
      perform public.push_enfileirar(o, 'comentarios', new.owner, 'cn:' || (it.value->>'pid'),
        n || ' também comentou em “' || public.push_corta(tit, 70) || '”', coalesce(it.value->>'texto', ''), '?nt=noticia:' || (it.value->>'pid'));
    end loop;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_docs_comentarios on public.docs;
create trigger push_t_docs_comentarios after insert or update on public.docs
  for each row when (new.col = 'comentarios') execute function public.push_t_docs_comentarios();

-- publicação nova: repost/citação do seu post; e (com a v9) posts e colunas de quem você segue
create or replace function public.push_t_publicacoes() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new); n text; orig uuid; oa uuid; f uuid; col boolean; tx text;
begin
  begin
    if new.tipo = 'story' or coalesce(j->>'arquivado', 'false') = 'true' then return null; end if;
    n := public.push_nome(new.autor);
    tx := btrim(coalesce(new.texto, ''));
    if new.estilo->'rp'->>'k' = 'pub' and (new.estilo->'rp'->>'id') ~* '^[0-9a-f-]{36}$' then
      orig := (new.estilo->'rp'->>'id')::uuid;
      select autor into oa from public.publicacoes where id = orig;
      if oa is not null and oa <> new.autor and public.push_pode_ver(oa, new.autor, j->>'publico') then
        perform public.push_enfileirar(oa, 'reposts', new.autor, 'rp:' || orig,
          n || case when tx = '' then ' repostou sua publicação' else ' citou sua publicação' end, tx, '?nt=pub:' || new.id);
      end if;
    end if;
    col := new.tipo = 'coluna' or coalesce(new.estilo->>'coluna', '') in ('true', '1') or new.estilo->>'tipo' = 'coluna' or new.estilo->>'kind' = 'coluna';
    for f in select * from public.push_seguidores_de(new.autor) limit 300 loop
      if f is distinct from oa and f <> new.autor and public.push_pode_ver(f, new.autor, j->>'publico') then
        perform public.push_enfileirar(f, case when col then 'colunas' else 'seguindo' end, new.autor, 'seg:' || new.autor,
          n || case when col then ' publicou uma coluna' else ' publicou' end,
          coalesce(nullif(new.estilo->>'titulo', ''), tx), '?nt=pub:' || new.id);
      end if;
    end loop;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_publicacoes on public.publicacoes;
create trigger push_t_publicacoes after insert on public.publicacoes for each row execute function public.push_t_publicacoes();

-- novo seguidor (só se a v9 existir; se a v9 vier depois, rode esta versão de novo)
create or replace function public.push_t_seguidores() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new); s uuid; a uuid;
begin
  begin
    s := coalesce(j->>'seguidor', j->>'de', j->>'uid', j->>'quem')::uuid;
    a := coalesce(j->>'seguido', j->>'para', j->>'alvo', j->>'autor')::uuid;
    perform public.push_enfileirar(a, 'seguidores', s, 'seg-novo', public.push_nome(s) || ' começou a seguir você', '', '?nt=perfil:' || s);
  exception when others then null;
  end;
  return null;
end $$;
do $$
begin
  if to_regclass('public.seguidores') is not null then
    execute 'drop trigger if exists push_t_seguidores on public.seguidores';
    execute 'create trigger push_t_seguidores after insert on public.seguidores for each row execute function public.push_t_seguidores()';
  end if;
end $$;

-- 5. Ninguém do app chama estas funções direto (só os gatilhos e a função de envio)
revoke all on function public.push_quer(uuid, text), public.push_nome(uuid), public.push_enfileirar(uuid, text, uuid, text, text, text, text),
  public.push_seguidores_de(uuid), public.push_pode_ver(uuid, uuid, text), public.push_t_mensagens(), public.push_t_amizades(),
  public.push_t_reacoes(), public.push_t_com_curtidas(), public.push_t_docs_comentarios(), public.push_t_publicacoes(),
  public.push_t_seguidores(), public.push_inscricoes_normaliza() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.push_enfileirar(uuid, text, uuid, text, text, text, text) to service_role';
    execute 'grant select, update, delete on public.push_fila to service_role';
    execute 'grant select, delete on public.push_inscricoes to service_role';
  end if;
end $$;

-- 6. (Opcional) Chamar a função assim que um aviso entra na fila, pelo pg_net — o jeito "B" do LEIA-ME.
--    Só funciona se o pg_net estiver ligado (Database › Extensions › pg_net) e se o endereço da função estiver gravado:
--    insert into public.config_app(chave, valor) values ('push_funcao_url', jsonb_build_object('url', 'https://SEU-PROJETO.supabase.co/functions/v1/enviar-push'))
--      on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
--    Não vai chave nenhuma no pedido: a função só envia o que já está na fila, então chamá-la sem chave não vaza nada.
--    Para desligar: delete from public.config_app where chave = 'push_funcao_url';
create or replace function public.push_t_fila_chama() returns trigger
language plpgsql security definer set search_path = public as $$
declare u text;
begin
  begin
    select valor->>'url' into u from public.config_app where chave = 'push_funcao_url';
    if u like 'https://%' and exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'net' and p.proname = 'http_post') then
      execute 'select net.http_post(url := $1, body := $2, headers := $3)'
        using u, '{"origem":"fila"}'::jsonb, '{"Content-Type":"application/json"}'::jsonb;
    end if;
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.push_t_fila_chama() from public, anon, authenticated;
drop trigger if exists push_fila_chama on public.push_fila;
create trigger push_fila_chama after insert on public.push_fila for each statement execute function public.push_t_fila_chama();

-- 7. Excluir a conta já apaga os aparelhos e a fila (as duas tabelas apontam para membros com "on delete cascade"
--    e excluir_conta apaga o login; o nome fica como "Conta excluída", então aqui apagamos na hora também).
create or replace function public.push_limpa_conta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.excluido_em is not null and old.excluido_em is null then
    delete from public.push_inscricoes where uid = new.uid;
    delete from public.push_fila where para = new.uid or de = new.uid;
  end if;
  return null;
end $$;
revoke all on function public.push_limpa_conta() from public, anon, authenticated;
drop trigger if exists push_limpa_conta on public.membros;
create trigger push_limpa_conta after update of excluido_em on public.membros for each row execute function public.push_limpa_conta();

-- 8. Correções da revisão (QA noite B). Também rodam de novo sem problema.
--    a) quem recebe só é avisado do que consegue ver: "também comentou" e curtida no seu comentário passam a conferir
--       se você ainda vê a publicação (deixou de ser amigo, virou "próximos", foi arquivada, story vencido);
--    b) menção num post/story que você não vê (ex.: só para próximos) não vira aviso;
--    c) coluna da v9 (estilo.coluna é um objeto com o título em "tit") avisa como "Colunas", com o título;
--    d) autor suspenso ou com conta excluída não gera aviso para quem segue;
--    e) post novo: confere primeiro se o seguidor ligou o aviso (rápido) e só depois se ele vê o post;
--    f) excluir a conta nunca falha por causa dos avisos.

-- são amigos? (o sao_amigos do app só responde para quem está logado e é uma das duas pessoas; nos gatilhos quem
-- está logado é quem fez a ação — quem comentou, quem curtiu —, então aqui a conferência é direta)
create or replace function public.push_amigos(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_a is not null and p_b is not null and exists (select 1 from public.amizades
    where status = 'aceita' and ((de = p_a and para = p_b) or (de = p_b and para = p_a)))
$$;

-- a pessoa vê esta publicação agora? (as regras de leitura, mais arquivado e story vencido)
create or replace function public.push_ve_pub(p_quem uuid, p_pub uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare j jsonb;
begin
  select to_jsonb(p) into j from public.publicacoes p where p.id = p_pub;
  if j is null then return false; end if;
  if (j->>'autor')::uuid = p_quem then return true; end if;
  if coalesce(j->>'arquivado', 'false') = 'true' then return false; end if;
  if j->>'tipo' = 'story' and coalesce((j->>'expira')::bigint, 0) <= (extract(epoch from now())*1000)::bigint then return false; end if;
  return public.push_pode_ver(p_quem, (j->>'autor')::uuid, j->>'publico');
end $$;

create or replace function public.push_pode_ver(p_quem uuid, p_autor uuid, p_publico text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare pub text := coalesce(p_publico, 'amigos');
begin
  if p_quem is null or p_autor is null then return false; end if;
  if p_quem = p_autor then return true; end if;
  if exists (select 1 from public.membros m where m.uid = p_autor and (m.suspenso_em is not null or m.excluido_em is not null)) then return false; end if;
  if exists (select 1 from public.bloqueios b where (b.de = p_quem and b.para = p_autor) or (b.de = p_autor and b.para = p_quem)) then return false; end if;
  if public.push_amigos(p_quem, p_autor) and (pub in ('amigos', 'seguidores', 'todos', 'publico')
       or exists (select 1 from public.melhores_amigos m where m.dono = p_autor and m.amigo = p_quem)) then return true; end if;
  -- quem só segue (v9): vê o que é "para seguidores" enquanto o perfil do autor estiver aberto
  if pub in ('seguidores', 'todos', 'publico') and exists (select 1 from public.push_seguidores_de(p_autor) s(u) where s.u = p_quem) then
    begin
      return exists (select 1 from public.membros m where m.uid = p_autor and coalesce((to_jsonb(m) ->> 'perfil_aberto')::boolean, false));
    exception when others then return false;
    end;
  end if;
  return false;
end $$;

create or replace function public.push_t_mensagens() returns trigger
language plpgsql security definer set search_path = public as $$
declare n text; t text := coalesce(new.tipo, ''); up text;
begin
  begin
    n := public.push_nome(new.de);
    if t = 'mencao' then
      -- menção num post/story do Prumo ("u:<id>"): só avisa quem consegue ver a publicação
      up := case when coalesce(new.pid, '') like 'u:%' then substr(new.pid, 3) else null end;
      if up is not null and (up !~* '^[0-9a-f-]{36}$' or not public.push_ve_pub(new.para, up::uuid)) then return null; end if;
      perform public.push_enfileirar(new.para, 'mencoes', new.de, 'men:' || new.de, n || ' mencionou você',
        case when coalesce(btrim(new.texto), '') = '' or new.texto = 'Mencionou você no story' then 'Toque para ver.' else new.texto end, '?nt=atividade');
    elsif t = 'curtiu_story' then
      perform public.push_enfileirar(new.para, 'curtidas', new.de, 'cst:' || new.de, n || ' curtiu seu story', '', '?nt=conversa:' || new.de);
    else
      perform public.push_enfileirar(new.para, 'mensagens', new.de, 'conv:' || new.de, n,
        case when t = 'reacao_msg' then 'Reagiu à sua mensagem: ' || public.push_corta(new.texto, 40)
             when coalesce(btrim(new.texto), '') <> '' then new.texto
             when new.pid is not null then 'Enviou uma publicação'
             else 'Enviou uma mensagem' end, '?nt=conversa:' || new.de);
    end if;
  exception when others then null;
  end;
  return null;
end $$;

create or replace function public.push_t_reacoes() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; n text; oque text; o uuid;
begin
  begin
    select id, autor, tipo, estilo into p from public.publicacoes where id = new.pub;
    if not found then return null; end if;
    n := public.push_nome(new.uid);
    oque := case when p.tipo = 'story' then 'seu story' when coalesce(p.estilo->>'reel', '') in ('true', '1') then 'seu reel' else 'seu post' end;
    if new.tipo = 'comentario' then
      perform public.push_enfileirar(p.autor, 'comentarios', new.uid, 'cmt:' || new.pub, n || ' comentou no ' || oque,
        coalesce(new.valor->>'texto', ''), '?nt=comentarios:' || new.pub);
      for o in select distinct r.uid from public.pub_reacoes r
                where r.pub = new.pub and r.tipo = 'comentario' and r.uid <> new.uid and r.uid <> p.autor
                  -- só quem conhece quem comentou (o autor do post todos conhecem; senão amigo, ou um segue o outro)
                  and (new.uid = p.autor
                       or exists (select 1 from public.amizades a where a.status = 'aceita' and ((a.de = r.uid and a.para = new.uid) or (a.de = new.uid and a.para = r.uid)))
                       or exists (select 1 from public.push_seguidores_de(r.uid) s(u) where s.u = new.uid)
                       or exists (select 1 from public.push_seguidores_de(new.uid) s(u) where s.u = r.uid))
                limit 30 loop
        if public.push_quer(o, 'comentarios') and public.push_ve_pub(o, new.pub) then
          perform public.push_enfileirar(o, 'comentarios', new.uid, 'cmt:' || new.pub, n || ' também comentou no post de ' || public.push_nome(p.autor),
            coalesce(new.valor->>'texto', ''), '?nt=comentarios:' || new.pub);
        end if;
      end loop;
    elsif new.tipo = 'curtida' then
      perform public.push_enfileirar(p.autor, 'curtidas', new.uid, 'curt:' || new.pub, n || ' curtiu ' || oque, '', '?nt=atividade');
    end if;
  exception when others then null;
  end;
  return null;
end $$;

create or replace function public.push_t_com_curtidas() returns trigger
language plpgsql security definer set search_path = public as $$
declare tx text; pid text;
begin
  begin
    if new.pub is not null then
      -- quem escreveu o comentário ainda vê o post?
      if not public.push_ve_pub(new.autor, new.pub) then return null; end if;
      select valor->>'texto' into tx from public.pub_reacoes where pub = new.pub and uid = new.autor and tipo = 'comentario' and chave = new.cid;
    else
      select d.data->'itens'->new.cid->>'texto', d.data->'itens'->new.cid->>'pid' into tx, pid
        from public.docs d where d.path = 'comentarios/' || new.autor::text;
    end if;
    perform public.push_enfileirar(new.autor, 'curtidas', new.uid, 'cc:' || new.cid, public.push_nome(new.uid) || ' curtiu seu comentário',
      coalesce(tx, ''), case when new.pub is not null then '?nt=comentarios:' || new.pub when pid is not null then '?nt=noticia:' || pid else '?nt=atividade' end);
  exception when others then null;
  end;
  return null;
end $$;

create or replace function public.push_t_publicacoes() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new); n text; orig uuid; oa uuid; f uuid; col boolean; tx text; tit text; tp text;
begin
  begin
    if new.tipo = 'story' or coalesce(j->>'arquivado', 'false') = 'true' then return null; end if;
    if exists (select 1 from public.membros m where m.uid = new.autor and (m.suspenso_em is not null or m.excluido_em is not null)) then return null; end if;
    n := public.push_nome(new.autor);
    tx := btrim(coalesce(new.texto, ''));
    if new.estilo->'rp'->>'k' = 'pub' and (new.estilo->'rp'->>'id') ~* '^[0-9a-f-]{36}$' then
      orig := (new.estilo->'rp'->>'id')::uuid;
      select autor into oa from public.publicacoes where id = orig;
      if oa is not null and oa <> new.autor and public.push_pode_ver(oa, new.autor, j->>'publico') then
        perform public.push_enfileirar(oa, 'reposts', new.autor, 'rp:' || orig,
          n || case when tx = '' then ' repostou sua publicação' else ' citou sua publicação' end, tx, '?nt=pub:' || new.id);
      end if;
    end if;
    -- coluna: a da v9 tem estilo.coluna = {tit, linha, …}; as outras formas ficam valendo
    col := new.tipo = 'coluna' or jsonb_typeof(new.estilo->'coluna') = 'object' or coalesce(new.estilo->>'coluna', '') in ('true', '1')
           or new.estilo->>'tipo' = 'coluna' or new.estilo->>'kind' = 'coluna';
    tit := coalesce(nullif(btrim(case when jsonb_typeof(new.estilo->'coluna') = 'object' then new.estilo->'coluna'->>'tit' end), ''),
                    nullif(btrim(new.estilo->>'titulo'), ''), tx);
    tp := case when col then 'colunas' else 'seguindo' end;
    for f in select * from public.push_seguidores_de(new.autor) limit 300 loop
      if f is distinct from oa and f <> new.autor and public.push_quer(f, tp) and public.push_pode_ver(f, new.autor, j->>'publico') then
        perform public.push_enfileirar(f, tp, new.autor, 'seg:' || new.autor,
          n || case when col then ' publicou uma coluna' else ' publicou' end, tit, '?nt=pub:' || new.id);
      end if;
    end loop;
  exception when others then null;
  end;
  return null;
end $$;

create or replace function public.push_limpa_conta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.excluido_em is not null and old.excluido_em is null then
    begin
      delete from public.push_inscricoes where uid = new.uid;
      delete from public.push_fila where para = new.uid or de = new.uid;
    exception when others then null;
    end;
  end if;
  return null;
end $$;

revoke all on function public.push_amigos(uuid, uuid), public.push_ve_pub(uuid, uuid), public.push_pode_ver(uuid, uuid, text), public.push_t_mensagens(), public.push_t_reacoes(),
  public.push_t_com_curtidas(), public.push_t_publicacoes(), public.push_limpa_conta() from public, anon, authenticated;

-- Prumo News · v11: listas de seguidores visíveis para os membros e reposts dos seus posts feitos por quem segue você.
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Rodar depois da v9 e da v10 (precisa do "Seguir" da v9 e das funções da v10). Não muda tabela nenhuma: só cria funções de leitura.
-- O que muda:
--   1. A lista de seguidores (e a de quem a pessoa segue) fica visível para os outros membros quando o perfil
--      é aberto, ou para os amigos (e para a própria pessoa). Aparecem só nome, foto (ou a inicial) e desde quando.
--      Quem bloqueou ou foi bloqueado por quem pede, e contas suspensas ou excluídas, ficam fora (da lista e da contagem).
--      Fechar o perfil não apaga seguidores (nunca apagou): só esconde a lista de quem não é amigo.
--   2. Atividade: quem escreveu passa a ver os reposts e as citações dos próprios posts feitos por quem só o segue
--      (antes, a regra de leitura das publicações escondia esses reposts do autor). O comentário da citação só aparece
--      se a citação estiver visível para o autor (por exemplo, publicada "para seguidores" num perfil aberto que ele segue).
-- O app novo funciona antes e depois desta versão: sem ela, as listas e a Atividade ficam como antes.

-- perfil aberto (coluna da v9), lido sem depender da ordem das versões
create or replace function public.seg11_aberto(p_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (to_jsonb(m) ->> 'perfil_aberto')::boolean from public.membros m where m.uid = p_uid), false)
$$;

-- 1. quem pede pode ver as listas de seguir de p_uid? (a própria pessoa; ou perfil aberto ou amigo, sem bloqueio e com a conta ativa)
create or replace function public.seguidores_pode_listar(p_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and p_uid is not null and public.e_membro() and (p_uid = auth.uid() or (
    exists (select 1 from public.membros m where m.uid = p_uid and m.suspenso_em is null and m.excluido_em is null)
    and not exists (select 1 from public.bloqueios b where (b.de = p_uid and b.para = auth.uid()) or (b.de = auth.uid() and b.para = p_uid))
    and (public.seg11_aberto(p_uid) or public.sao_amigos(auth.uid(), p_uid))))
$$;

-- a lista: seguidores (p_tipo = 'seguidores') ou quem a pessoa segue (p_tipo = 'seguindo').
-- A foto só vai quando quem pede já poderia vê-la (perfil aberto, a própria pessoa ou alguém que já vê no Prumo); senão, a inicial.
create or replace function public.seguidores_lista(p_uid uuid, p_tipo text default 'seguidores')
returns table(uid uuid, nome text, foto text, inicial text, aberto boolean, at bigint)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if p_tipo is null or p_tipo not in ('seguidores', 'seguindo') then raise exception 'pedido invalido' using errcode = '22023'; end if;
  if not public.seguidores_pode_listar(p_uid) then return; end if;
  return query
    select m.uid, m.nome,
           case when m.uid = me or public.seg11_aberto(m.uid) or public.pode_ver_membro(m.uid) then m.foto end,
           upper(left(btrim(m.nome), 1)),
           public.seg11_aberto(m.uid),
           s.at
    from public.seguidores s
    join public.membros m on m.uid = case when p_tipo = 'seguindo' then s.seguido else s.seguidor end
    where (case when p_tipo = 'seguindo' then s.seguidor else s.seguido end) = p_uid
      and m.suspenso_em is null and m.excluido_em is null
      and not exists (select 1 from public.bloqueios b where (b.de = m.uid and b.para = me) or (b.de = me and b.para = m.uid))
    order by s.at desc
    limit 500;
end $$;

-- os números do perfil, com as mesmas regras da lista (ok = false quando a lista não é visível para quem pede)
create or replace function public.seguidores_contagem(p_uid uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if not public.seguidores_pode_listar(p_uid) then return json_build_object('ok', false); end if;
  return json_build_object('ok', true, 'lista', true, 'aberto', public.seg11_aberto(p_uid),
    'amigo', p_uid <> me and public.sao_amigos(me, p_uid),
    'seguidores', (select count(*) from public.seguidores s join public.membros x on x.uid = s.seguidor
                    where s.seguido = p_uid and x.suspenso_em is null and x.excluido_em is null
                      and not exists (select 1 from public.bloqueios b where (b.de = x.uid and b.para = me) or (b.de = me and b.para = x.uid))),
    'seguindo', (select count(*) from public.seguidores s join public.membros x on x.uid = s.seguido
                  where s.seguidor = p_uid and x.suspenso_em is null and x.excluido_em is null
                    and not exists (select 1 from public.bloqueios b where (b.de = x.uid and b.para = me) or (b.de = me and b.para = x.uid))),
    'sigo', exists (select 1 from public.seguidores where seguidor = me and seguido = p_uid),
    'me_segue', exists (select 1 from public.seguidores where seguidor = p_uid and seguido = me));
end $$;

revoke all on function public.seg11_aberto(uuid), public.seguidores_pode_listar(uuid), public.seguidores_lista(uuid, text), public.seguidores_contagem(uuid) from public, anon;
grant execute on function public.seg11_aberto(uuid), public.seguidores_pode_listar(uuid), public.seguidores_lista(uuid, text), public.seguidores_contagem(uuid) to authenticated;

-- 2. Reposts e citações dos posts de quem pede (desde p_desde, em milissegundos), feitos por amigos ou seguidores.
--    Fora: quem bloqueou ou foi bloqueado, contas suspensas ou excluídas, reposts ou originais arquivados (apagados já não existem),
--    reposts só para os Melhores amigos de quem repostou (a não ser que quem pede esteja entre eles).
--    "visivel" diz se quem pede consegue abrir o repost; o trecho do comentário só vem quando ele é visível.
create or replace function public.reposts_dos_meus_posts(p_desde bigint default 0)
returns table(id uuid, orig uuid, autor uuid, nome text, foto text, at bigint, citacao boolean, trecho text, visivel boolean)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  return query
    with rp as (
      select r.id, r.autor, r.at, r.texto, coalesce(r.publico, 'amigos') as publico,
             case when (r.estilo -> 'rp' ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                  then (r.estilo -> 'rp' ->> 'id')::uuid end as orig_id
      from public.publicacoes r
      where r.tipo = 'post' and r.autor <> me and r.at >= coalesce(p_desde, 0)
        and r.estilo is not null and jsonb_typeof(r.estilo -> 'rp') = 'object' and r.estilo -> 'rp' ->> 'k' = 'pub'
        and coalesce(to_jsonb(r) ->> 'arquivado', 'false') <> 'true'
    ), v as (
      select rp.*, m.nome as mnome, m.foto as mfoto,
             public.sao_amigos(me, rp.autor) as amigo,
             exists (select 1 from public.melhores_amigos ma where ma.dono = rp.autor and ma.amigo = me) as melhor
      from rp
      join public.publicacoes o on o.id = rp.orig_id and o.autor = me and coalesce(to_jsonb(o) ->> 'arquivado', 'false') <> 'true'
      join public.membros m on m.uid = rp.autor and m.suspenso_em is null and m.excluido_em is null
      where not exists (select 1 from public.bloqueios b where (b.de = rp.autor and b.para = me) or (b.de = me and b.para = rp.autor))
        and (public.sao_amigos(me, rp.autor) or exists (select 1 from public.seguidores s where s.seguidor = rp.autor and s.seguido = me))
    ), w as (
      select v.*, ((v.amigo and (v.publico in ('amigos', 'seguidores') or v.melhor))
                   or (v.publico = 'seguidores' and public.ve_como_seguidor(v.autor))) as vis
      from v
      where v.publico in ('amigos', 'seguidores') or v.melhor
    )
    select w.id, w.orig_id, w.autor, w.mnome,
           case when w.amigo or public.seg11_aberto(w.autor) then w.mfoto end,
           w.at, btrim(coalesce(w.texto, '')) <> '',
           case when w.vis and btrim(coalesce(w.texto, '')) <> '' then
             case when char_length(btrim(w.texto)) <= 140 then btrim(w.texto) else rtrim(left(btrim(w.texto), 139)) || '…' end end,
           w.vis
    from w
    order by w.at desc
    limit 200;
end $$;
revoke all on function public.reposts_dos_meus_posts(bigint) from public, anon;
grant execute on function public.reposts_dos_meus_posts(bigint) to authenticated;

-- Prumo News · v12: editor de colunas — rascunhos no banco, histórico de versões, agendamento e fotos no texto.
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Rodar depois da v11 (precisa da v9 "Seguir/colunas" e das funções de aviso da v10). Já inclui a proposta de 04/11
-- (sql/proposta-2026-11-04.sql: o autor pode mudar o texto longo da coluna); rodar as duas não faz mal.
-- O que muda:
--   1. Rascunhos de coluna no banco (tabela coluna_rascunhos): só a própria pessoa lê, grava e apaga os seus
--      (até 30 rascunhos). Assim o rascunho abre em outro aparelho. Sem esta versão, o app guarda só no aparelho.
--   2. Histórico de versões (tabela coluna_versoes): cada vez que uma coluna é publicada ou editada, o banco guarda
--      uma cópia (título, linha fina, texto). Só o autor vê as versões das próprias colunas; ninguém escreve nelas
--      (é o gatilho do banco que grava). Ficam as 30 últimas de cada coluna; apagar a coluna apaga as versões.
--   3. Agendar a publicação: coluna nova publicacoes.publicar_em (data e hora). Enquanto a hora não chega, a coluna
--      só aparece para a autora (a regra de leitura esconde de todos os outros: Feed, Atividade, perfil, busca).
--      Ao chegar a hora, ela aparece sozinha, com a hora de publicação como hora do post (ordem no Feed).
--      A autora pode mudar a hora, publicar agora (publicar_em vazio) ou apagar. Depois de publicada, a hora não muda.
--      Os avisos no celular (v10) não saem na hora do agendamento: saem quando a coluna é publicada. Quem manda os
--      avisos das colunas que chegaram à hora é a função colunas_agendadas_avisar(), chamada a cada 5 minutos pelo
--      pg_cron (bloco OPCIONAL no fim deste arquivo). Sem o pg_cron, a coluna aparece na hora certa do mesmo jeito;
--      só os avisos no celular dessas colunas agendadas não saem ("publicar agora" avisa na hora, sem o pg_cron).
--   4. Fotos dentro do texto da coluna: a coluna pode guardar até 10 fotos (capa + fotos do texto) na lista fotos,
--      e o autor pode mudar essa lista ao editar (só fotos da própria pasta). A regra de leitura dos arquivos já
--      libera as fotos que estão na lista de um post que a pessoa pode ver.
--   5. Série ("Bastidores de Brasília", "Coluna 12"), chamada do Feed e assuntos do dia ligados à coluna ficam em
--      estilo.coluna; o gatilho confere os tamanhos.
-- O app novo funciona antes e depois desta versão: sem ela, rascunhos ficam só no aparelho e "Agendar" e
-- "Histórico" não aparecem.

-- 1. Rascunhos ---------------------------------------------------------------------------------------------------
create table if not exists public.coluna_rascunhos (
  autor uuid not null default auth.uid() references public.membros(uid) on delete cascade,
  rid text not null check (rid ~ '^[a-z0-9]{4,40}$'),
  dados jsonb not null check (jsonb_typeof(dados) = 'object' and pg_column_size(dados) <= 120000),
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (autor, rid)
);
create index if not exists coluna_rascunhos_autor_at_idx on public.coluna_rascunhos(autor, at desc);
alter table public.coluna_rascunhos enable row level security;
drop policy if exists crasc_ler on public.coluna_rascunhos;
create policy crasc_ler on public.coluna_rascunhos for select to authenticated using (autor = auth.uid() and public.e_membro());
drop policy if exists crasc_criar on public.coluna_rascunhos;
create policy crasc_criar on public.coluna_rascunhos for insert to authenticated with check (autor = auth.uid() and public.e_membro());
drop policy if exists crasc_mudar on public.coluna_rascunhos;
create policy crasc_mudar on public.coluna_rascunhos for update to authenticated using (autor = auth.uid() and public.e_membro()) with check (autor = auth.uid());
drop policy if exists crasc_apagar on public.coluna_rascunhos;
create policy crasc_apagar on public.coluna_rascunhos for delete to authenticated using (autor = auth.uid());
revoke all on public.coluna_rascunhos from anon, authenticated;
grant select, insert, delete on public.coluna_rascunhos to authenticated;
grant update (dados) on public.coluna_rascunhos to authenticated;

create or replace function public.crasc_normaliza() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.at := (extract(epoch from now())*1000)::bigint;
  if tg_op = 'INSERT' then
    if (select count(*) from public.coluna_rascunhos r where r.autor = new.autor) >= 30 then
      raise exception 'no maximo 30 rascunhos' using errcode = '22023';
    end if;
  else
    new.autor := old.autor; new.rid := old.rid;
  end if;
  return new;
end $$;
drop trigger if exists crasc_normaliza on public.coluna_rascunhos;
create trigger crasc_normaliza before insert or update on public.coluna_rascunhos for each row execute function public.crasc_normaliza();
revoke all on function public.crasc_normaliza() from public, anon, authenticated;

-- 2. Histórico de versões ----------------------------------------------------------------------------------------
create table if not exists public.coluna_versoes (
  id bigint generated always as identity primary key,
  pub uuid not null references public.publicacoes(id) on delete cascade,
  autor uuid not null references public.membros(uid) on delete cascade,
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  tit text not null default '',
  linha text not null default '',
  corpo text not null default '',
  coluna jsonb
);
create index if not exists coluna_versoes_pub_idx on public.coluna_versoes(pub, at desc);
alter table public.coluna_versoes enable row level security;
drop policy if exists cvers_ler on public.coluna_versoes;
create policy cvers_ler on public.coluna_versoes for select to authenticated using (autor = auth.uid() and public.e_membro());
revoke all on public.coluna_versoes from anon, authenticated;
grant select on public.coluna_versoes to authenticated;

-- 3. Agendar ------------------------------------------------------------------------------------------------------
alter table public.publicacoes add column if not exists publicar_em timestamptz;
alter table public.publicacoes add column if not exists agenda_aviso boolean not null default false;
create index if not exists publicacoes_agenda_idx on public.publicacoes(publicar_em) where agenda_aviso;

-- quem não é a autora não vê a coluna antes da hora (regra restritiva: soma-se às outras regras de leitura)
drop policy if exists pub_agendada on public.publicacoes;
create policy pub_agendada on public.publicacoes as restrictive for select to authenticated using (
  publicar_em is null or publicar_em <= now() or autor = auth.uid());

-- a hora: no agendamento, a hora do post (at) é a de publicação; depois de publicada, não muda mais.
-- (o nome começa com "pub_v12" para rodar depois do pub_normaliza, que põe a hora do servidor no post)
create or replace function public.pub_v12_agenda() returns trigger language plpgsql as $$
declare agora timestamptz := now();
begin
  if tg_op = 'INSERT' then
    new.agenda_aviso := false;
    if new.publicar_em is not null then
      if new.tipo <> 'post' or new.estilo is null or jsonb_typeof(new.estilo -> 'coluna') is distinct from 'object' then
        raise exception 'so coluna pode ser agendada' using errcode = '22023';
      end if;
      if new.publicar_em > agora + interval '366 days' then raise exception 'agendamento longe demais' using errcode = '22023'; end if;
      if new.publicar_em <= agora then new.publicar_em := null;
      else new.at := (extract(epoch from new.publicar_em)*1000)::bigint; new.agenda_aviso := true; end if;
    end if;
    return new;
  end if;
  -- UPDATE
  new.agenda_aviso := old.agenda_aviso and new.agenda_aviso;   -- só o banco desliga o aviso pendente
  if old.publicar_em is null or old.publicar_em <= agora then
    new.publicar_em := old.publicar_em;                        -- já publicada: a hora não muda
    return new;
  end if;
  -- ainda agendada: mudar a hora ou publicar agora (publicar_em vazio ou já passado)
  if new.publicar_em is null or new.publicar_em <= agora then
    new.publicar_em := agora; new.at := (extract(epoch from agora)*1000)::bigint; new.agenda_aviso := false;
  else
    if new.publicar_em > agora + interval '366 days' then raise exception 'agendamento longe demais' using errcode = '22023'; end if;
    new.at := (extract(epoch from new.publicar_em)*1000)::bigint; new.agenda_aviso := true;
  end if;
  return new;
end $$;
drop trigger if exists pub_v12_agenda on public.publicacoes;
create trigger pub_v12_agenda before insert or update on public.publicacoes for each row execute function public.pub_v12_agenda();
revoke all on function public.pub_v12_agenda() from public, anon, authenticated;

-- o texto longo (proposta de 04/11), a hora do agendamento e a lista de fotos (só em coluna) podem mudar pelo autor
grant update (corpo, publicar_em, fotos) on public.publicacoes to authenticated;
create or replace function public.pub_edita() returns trigger language plpgsql as $$
declare f text;
begin
  if new.texto is distinct from old.texto or new.corpo is distinct from old.corpo then new.editado := (extract(epoch from now())*1000)::bigint; end if;
  if new.fixado is not null and old.fixado is null then
    if new.tipo <> 'post' then raise exception 'so posts podem ser fixados'; end if;
    if (select count(*) from public.publicacoes where autor = new.autor and fixado is not null and id <> new.id) >= 3 then raise exception 'no maximo 3 fixados'; end if;
    new.fixado := (extract(epoch from now())*1000)::bigint;
  elsif new.fixado is not null and old.fixado is not null then
    new.fixado := old.fixado;  -- a hora de fixar é do servidor e não muda depois
  end if;
  if coalesce(new.estilo->>'video', '') is distinct from coalesce(old.estilo->>'video', '') then raise exception 'o video nao muda'; end if;
  if new.fotos is distinct from old.fotos then
    if new.tipo <> 'post' or new.estilo is null or jsonb_typeof(new.estilo -> 'coluna') is distinct from 'object' then
      raise exception 'so a coluna muda as fotos' using errcode = '22023';
    end if;
    for f in select jsonb_array_elements_text(new.fotos) loop
      if position((new.autor::text || '/') in f) <> 1 then raise exception 'foto fora da pasta do autor' using errcode = '22023'; end if;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists pub_edita on public.publicacoes;
create trigger pub_edita before update on public.publicacoes for each row execute function public.pub_edita();

-- 5. Tamanhos da coluna (série, chamada do Feed, assuntos ligados) ---------------------------------------------------
create or replace function public.pub_coluna_confere() returns trigger language plpgsql as $$
declare c jsonb := case when new.estilo is not null and jsonb_typeof(new.estilo -> 'coluna') = 'object' then new.estilo -> 'coluna' end;
begin
  if c is null then
    if new.corpo is not null then raise exception 'texto longo so em coluna' using errcode = '22023'; end if;
    return new;
  end if;
  if new.tipo <> 'post' then raise exception 'coluna so em post' using errcode = '22023'; end if;
  if char_length(coalesce(c ->> 'tit', '')) not between 1 and 90 or char_length(coalesce(c ->> 'linha', '')) > 160
     or char_length(coalesce(c ->> 'corpo', '')) > 6000 or char_length(coalesce(c ->> 'cham', '')) > 280
     or char_length(coalesce(c ->> 'serie', '')) > 60
     or (c ? 'pautas' and (jsonb_typeof(c -> 'pautas') <> 'array' or jsonb_array_length(c -> 'pautas') > 3)) then
    raise exception 'coluna fora do tamanho' using errcode = '22023';
  end if;
  return new;
end $$;
drop trigger if exists pub_coluna_confere on public.publicacoes;
create trigger pub_coluna_confere before insert or update on public.publicacoes for each row execute function public.pub_coluna_confere();
revoke all on function public.pub_coluna_confere() from public, anon, authenticated;

-- 2b. o gatilho que grava as versões (depois de publicar ou editar a coluna)
create or replace function public.pub_v12_versao() returns trigger
language plpgsql security definer set search_path = public as $$
declare c jsonb := case when new.estilo is not null and jsonb_typeof(new.estilo -> 'coluna') = 'object' then new.estilo -> 'coluna' end;
begin
  if c is null then return null; end if;
  if tg_op = 'UPDATE' and new.texto is not distinct from old.texto and new.corpo is not distinct from old.corpo
     and (new.estilo -> 'coluna') is not distinct from (old.estilo -> 'coluna') then return null; end if;
  insert into public.coluna_versoes(pub, autor, tit, linha, corpo, coluna)
  values (new.id, new.autor, left(coalesce(c ->> 'tit', ''), 90), left(coalesce(c ->> 'linha', ''), 160),
          left(coalesce(new.corpo, c ->> 'corpo', ''), 40000), c - 'corpo');
  delete from public.coluna_versoes v where v.pub = new.id and v.id not in
    (select v2.id from public.coluna_versoes v2 where v2.pub = new.id order by v2.id desc limit 30);
  return null;
end $$;
drop trigger if exists pub_v12_versao on public.publicacoes;
create trigger pub_v12_versao after insert or update on public.publicacoes for each row execute function public.pub_v12_versao();
revoke all on function public.pub_v12_versao() from public, anon, authenticated;

-- 3b. avisos no celular (v10): o mesmo aviso de antes, numa função que serve ao gatilho e ao agendamento
create or replace function public.push_pub_avisa(p public.publicacoes) returns void
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(p); n text; orig uuid; oa uuid; f uuid; col boolean; tx text; tit text; tp text;
begin
  begin
    if p.tipo = 'story' or coalesce(j->>'arquivado', 'false') = 'true' then return; end if;
    if exists (select 1 from public.membros m where m.uid = p.autor and (m.suspenso_em is not null or m.excluido_em is not null)) then return; end if;
    n := public.push_nome(p.autor);
    tx := btrim(coalesce(p.texto, ''));
    if p.estilo->'rp'->>'k' = 'pub' and (p.estilo->'rp'->>'id') ~* '^[0-9a-f-]{36}$' then
      orig := (p.estilo->'rp'->>'id')::uuid;
      select autor into oa from public.publicacoes where id = orig;
      if oa is not null and oa <> p.autor and public.push_pode_ver(oa, p.autor, j->>'publico') then
        perform public.push_enfileirar(oa, 'reposts', p.autor, 'rp:' || orig,
          n || case when tx = '' then ' repostou sua publicação' else ' citou sua publicação' end, tx, '?nt=pub:' || p.id);
      end if;
    end if;
    col := p.tipo = 'coluna' or jsonb_typeof(p.estilo->'coluna') = 'object' or coalesce(p.estilo->>'coluna', '') in ('true', '1')
           or p.estilo->>'tipo' = 'coluna' or p.estilo->>'kind' = 'coluna';
    tit := coalesce(nullif(btrim(case when jsonb_typeof(p.estilo->'coluna') = 'object' then p.estilo->'coluna'->>'tit' end), ''),
                    nullif(btrim(p.estilo->>'titulo'), ''), tx);
    tp := case when col then 'colunas' else 'seguindo' end;
    for f in select * from public.push_seguidores_de(p.autor) limit 300 loop
      if f is distinct from oa and f <> p.autor and public.push_quer(f, tp) and public.push_pode_ver(f, p.autor, j->>'publico') then
        perform public.push_enfileirar(f, tp, p.autor, 'seg:' || p.autor,
          n || case when col then ' publicou uma coluna' else ' publicou' end, tit, '?nt=pub:' || p.id);
      end if;
    end loop;
  exception when others then null;
  end;
end $$;
revoke all on function public.push_pub_avisa(public.publicacoes) from public, anon, authenticated;

-- o gatilho da v10, agora sem avisar das colunas agendadas (elas avisam quando saem)
create or replace function public.push_t_publicacoes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.publicar_em is not null and new.publicar_em > now() then return null; end if;
  perform public.push_pub_avisa(new);
  return null;
end $$;
drop trigger if exists push_t_publicacoes on public.publicacoes;
create trigger push_t_publicacoes after insert on public.publicacoes for each row execute function public.push_t_publicacoes();

-- "publicar agora" de uma coluna agendada: avisa na hora
create or replace function public.pub_v12_saiu() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.publicar_em is not null and old.publicar_em > now() and new.publicar_em is not null and new.publicar_em <= now() then
    perform public.push_pub_avisa(new);
  end if;
  return null;
end $$;
drop trigger if exists pub_v12_saiu on public.publicacoes;
create trigger pub_v12_saiu after update of publicar_em on public.publicacoes for each row execute function public.pub_v12_saiu();
revoke all on function public.pub_v12_saiu() from public, anon, authenticated;

-- as colunas que chegaram à hora: manda os avisos e desliga a pendência (chamada pelo pg_cron; ninguém do app chama)
create or replace function public.colunas_agendadas_avisar() returns int
language plpgsql security definer set search_path = public as $$
declare r public.publicacoes; k int := 0;
begin
  for r in select * from public.publicacoes p where p.agenda_aviso and p.publicar_em <= now() order by p.publicar_em limit 200 loop
    perform public.push_pub_avisa(r);
    update public.publicacoes set agenda_aviso = false where id = r.id;
    k := k + 1;
  end loop;
  return k;
end $$;
revoke all on function public.colunas_agendadas_avisar() from public, anon, authenticated;

-- 4b. a limpeza do administrador (v8) não trata as fotos dos rascunhos e das versões como "sem uso"
create or replace function public.midia_em_uso(p_nome text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.publicacoes p where p.fotos ? p_nome or p.estilo->>'video' = p_nome)
      or exists (select 1 from public.membros m where m.foto = p_nome)
      or exists (select 1 from public.coluna_rascunhos r where position(p_nome in r.dados::text) > 0) $$;
revoke all on function public.midia_em_uso(text) from public, anon;
grant execute on function public.midia_em_uso(text) to authenticated;

-- ===================================================================================================================
-- BLOCO OPCIONAL: avisos no celular das colunas agendadas (pg_cron).
-- Antes, ligue a extensão no painel do Supabase: Database › Extensions › procure "pg_cron" › Enable.
-- Depois rode este arquivo (ou só este bloco). Sem a extensão, o bloco não faz nada e o resto funciona igual:
-- a coluna aparece na hora certa; só os avisos no celular das colunas agendadas não saem.
-- Para desligar depois: select cron.unschedule('prumo-colunas-agendadas');
-- ===================================================================================================================
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'prumo-colunas-agendadas') then
      perform cron.unschedule('prumo-colunas-agendadas');
    end if;
    perform cron.schedule('prumo-colunas-agendadas', '*/5 * * * *', 'select public.colunas_agendadas_avisar()');
  end if;
end $$;

-- Prumo News · v13: colunas, fase 3 — leitores e números para a autora, seguir uma série (ou só as colunas de alguém),
-- comentários em destaque e aviso novo "Colunas e séries que você assina".
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Rodar depois da v12 (precisa da v9 "Seguir/colunas", das funções de aviso da v10 e do push_pub_avisa da v12).
-- O que muda:
--   1. Leituras das colunas (tabela coluna_leituras): uma linha por leitor e por coluna, com de onde a pessoa veio
--      (Feed, perfil, hashtag, série, busca, conversa, notificação), se chegou ao fim (rolou 90% do texto) e quantos
--      segundos leu. O app grava pela função coluna_leitura() (no máximo 3 vezes por leitura: ao abrir, ao chegar ao fim
--      e ao sair), que guarda sempre o maior valor. A leitura da própria autora não conta.
--      A leitura é anônima: ninguém lê as linhas dos outros; cada um vê só as próprias. A autora vê só os TOTAIS, pela
--      função coluna_numeros() (leituras, chegaram ao fim, tempo médio, origens, curtidas, comentários, reposts,
--      envios e as leituras de cada um dos 14 primeiros dias) e coluna_mais_lidas() (as suas colunas mais lidas).
--   2. Seguir uma série ou as colunas de alguém, sem seguir a pessoa (tabela coluna_assinaturas): só a própria pessoa
--      vê e muda as suas (até 200). Quando sai coluna nova da série (ou da autora), quem assinou e PODE LER a coluna
--      (amigo, ou seguidor quando a coluna é para seguidores) recebe o aviso no celular do tipo novo
--      "colunas_seguidas" (desligado por padrão, como os outros). Quem não pode ler nunca é avisado.
--      O aviso dentro do app (Atividade) é montado pelo próprio app com as colunas que a pessoa já pode ver.
--   3. Comentários em destaque (tabela coluna_destaques): a autora fixa até 3 comentários no topo da coluna.
--      O banco confere que o comentário existe e é desta coluna e guarda uma cópia do texto e do nome de quem
--      comentou (quem pode ler a coluna vê o destaque). Comentário apagado sai do destaque.
-- O app novo funciona antes e depois desta versão: sem ela, "Leitores", "Seguir esta série", fixar comentário e o
-- aviso novo não aparecem (o resto, como citar e copiar trecho e o selo "Autora", funciona igual).

-- 0. O tipo de aviso novo ------------------------------------------------------------------------------------------
create or replace function public.push_tipo_ok(t text) returns boolean
language sql immutable as $$
  select t in ('mensagens','amizades','comentarios','mencoes','curtidas','reposts','seguidores','seguindo','coberturas','colunas','colunas_seguidas')
$$;

-- é coluna publicada (não agendada para depois)?
create or replace function public.lt_coluna_ok(p public.publicacoes) returns boolean
language sql stable as $$
  select p.tipo = 'post' and p.estilo is not null and jsonb_typeof(p.estilo -> 'coluna') = 'object'
     and coalesce((to_jsonb(p) ->> 'arquivado')::boolean, false) = false
     and (p.publicar_em is null or p.publicar_em <= now())
$$;
revoke all on function public.lt_coluna_ok(public.publicacoes) from public, anon;

-- 1. Leituras ------------------------------------------------------------------------------------------------------
create table if not exists public.coluna_leituras (
  pub uuid not null references public.publicacoes(id) on delete cascade,
  leitor uuid not null references public.membros(uid) on delete cascade,
  origem text not null default 'outro' check (origem in ('feed','perfil','hashtag','serie','busca','conversa','notificacao','outro')),
  chegou_fim boolean not null default false,
  segundos int not null default 0 check (segundos between 0 and 3600),
  primeiro_at bigint not null default (extract(epoch from now())*1000)::bigint,
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (pub, leitor)
);
create index if not exists coluna_leituras_leitor_idx on public.coluna_leituras(leitor);
alter table public.coluna_leituras enable row level security;
drop policy if exists cleit_ler on public.coluna_leituras;
create policy cleit_ler on public.coluna_leituras for select to authenticated using (leitor = auth.uid());
revoke all on public.coluna_leituras from anon, authenticated;
grant select on public.coluna_leituras to authenticated;

-- grava (ou melhora) a leitura de quem está logado. Devolve 'ok', 'autora' (não conta) ou erro.
create or replace function public.coluna_leitura(p_pub uuid, p_origem text, p_fim boolean, p_segundos int) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); p public.publicacoes; o text := coalesce(p_origem, 'outro'); s int := least(3600, greatest(0, coalesce(p_segundos, 0)));
  agora bigint := (extract(epoch from now())*1000)::bigint;
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  select * into p from public.publicacoes where id = p_pub;
  if p.id is null or not public.lt_coluna_ok(p) then raise exception 'coluna indisponivel' using errcode = '42501'; end if;
  if p.autor = me then return 'autora'; end if;
  if not public.push_pode_ver(me, p.autor, p.publico) then raise exception 'coluna indisponivel' using errcode = '42501'; end if;
  if o not in ('feed','perfil','hashtag','serie','busca','conversa','notificacao') then o := 'outro'; end if;
  -- freio: no máximo 300 colunas novas lidas por dia por pessoa
  if not exists (select 1 from public.coluna_leituras where pub = p_pub and leitor = me)
     and (select count(*) from public.coluna_leituras where leitor = me and primeiro_at > agora - 86400000) >= 300 then
    raise exception 'leituras demais hoje' using errcode = '54000';
  end if;
  insert into public.coluna_leituras(pub, leitor, origem, chegou_fim, segundos, primeiro_at, at)
  values (p_pub, me, o, coalesce(p_fim, false), s, agora, agora)
  on conflict (pub, leitor) do update set
    chegou_fim = coluna_leituras.chegou_fim or excluded.chegou_fim,
    segundos = greatest(coluna_leituras.segundos, excluded.segundos),
    at = excluded.at;
  return 'ok';
end $$;
revoke all on function public.coluna_leitura(uuid, text, boolean, int) from public, anon;
grant execute on function public.coluna_leitura(uuid, text, boolean, int) to authenticated;

-- os números de uma coluna: só a autora, só totais (nunca quem leu)
create or replace function public.coluna_numeros(p_pub uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); p public.publicacoes; k text := 'u:' || p_pub::text; r jsonb; ori jsonb; dias jsonb;
  n_cur int; n_com int; n_rep int; n_cit int; n_env int;
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  select * into p from public.publicacoes where id = p_pub;
  if p.id is null or p.autor <> me then raise exception 'so a autora ve os numeros' using errcode = '42501'; end if;
  select coalesce(jsonb_object_agg(origem, n), '{}'::jsonb) into ori from (select origem, count(*) n from public.coluna_leituras where pub = p_pub group by origem) o;
  select jsonb_agg(coalesce(c.n, 0) order by g.d) into dias from generate_series(0, 13) g(d)
    left join (select floor((primeiro_at - p.at) / 86400000.0)::int d, count(*) n from public.coluna_leituras where pub = p_pub group by 1) c on c.d = g.d;
  select count(*) filter (where r.tipo = 'curtida' and r.uid <> me), count(*) filter (where r.tipo = 'comentario') into n_cur, n_com
    from public.pub_reacoes r where r.pub = p_pub;
  select count(*) filter (where btrim(coalesce(x.texto, '')) = ''), count(*) filter (where btrim(coalesce(x.texto, '')) <> '') into n_rep, n_cit
    from public.publicacoes x where x.estilo is not null and jsonb_typeof(x.estilo -> 'rp') = 'object' and x.estilo -> 'rp' ->> 'k' = 'pub' and x.estilo -> 'rp' ->> 'id' = p_pub::text and x.autor <> me;
  select count(*) into n_env from public.mensagens m where m.pid = k and m.tipo is null and m.de <> me;
  select jsonb_build_object('leituras', count(*), 'fim', count(*) filter (where chegou_fim),
           'seg_medio', coalesce(round(avg(segundos) filter (where segundos > 0)), 0), 'origens', ori, 'dias', dias,
           'curtidas', n_cur, 'comentarios', n_com, 'reposts', n_rep, 'citacoes', n_cit, 'envios', n_env, 'at', p.at)
    into r from public.coluna_leituras where pub = p_pub;
  return r;
end $$;
revoke all on function public.coluna_numeros(uuid) from public, anon;
grant execute on function public.coluna_numeros(uuid) to authenticated;

-- as colunas mais lidas de quem está logado (até 10)
create or replace function public.coluna_mais_lidas() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('pub', t.pub, 'leituras', t.n, 'fim', t.f) order by t.n desc, t.pub)
    from (select l.pub, count(*) n, count(*) filter (where l.chegou_fim) f from public.coluna_leituras l
          join public.publicacoes p on p.id = l.pub where p.autor = me group by l.pub order by count(*) desc limit 10) t), '[]'::jsonb);
end $$;
revoke all on function public.coluna_mais_lidas() from public, anon;
grant execute on function public.coluna_mais_lidas() to authenticated;

-- 2. Seguir uma série ou as colunas de alguém ------------------------------------------------------------------------
-- serie vazia = todas as colunas da autora; senão, só as colunas daquela série (sem diferença de maiúsculas)
create table if not exists public.coluna_assinaturas (
  leitor uuid not null default auth.uid() references public.membros(uid) on delete cascade,
  autor uuid not null references public.membros(uid) on delete cascade,
  serie text not null default '' check (char_length(serie) <= 60),
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (leitor, autor, serie),
  check (leitor <> autor)
);
create index if not exists coluna_assinaturas_autor_idx on public.coluna_assinaturas(autor);
alter table public.coluna_assinaturas enable row level security;
drop policy if exists cass_ler on public.coluna_assinaturas;
create policy cass_ler on public.coluna_assinaturas for select to authenticated using (leitor = auth.uid() and public.e_membro());
drop policy if exists cass_criar on public.coluna_assinaturas;
create policy cass_criar on public.coluna_assinaturas for insert to authenticated with check (
  leitor = auth.uid() and public.e_membro() and autor <> auth.uid()
  and not exists (select 1 from public.bloqueios b where (b.de = auth.uid() and b.para = autor) or (b.de = autor and b.para = auth.uid())));
drop policy if exists cass_apagar on public.coluna_assinaturas;
create policy cass_apagar on public.coluna_assinaturas for delete to authenticated using (leitor = auth.uid());
revoke all on public.coluna_assinaturas from anon, authenticated;
grant select, insert, delete on public.coluna_assinaturas to authenticated;

create or replace function public.cass_normaliza() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.serie := btrim(coalesce(new.serie, ''));
  new.at := (extract(epoch from now())*1000)::bigint;
  if (select count(*) from public.coluna_assinaturas a where a.leitor = new.leitor) >= 200 then
    raise exception 'no maximo 200 assinaturas' using errcode = '22023';
  end if;
  return new;
end $$;
drop trigger if exists cass_normaliza on public.coluna_assinaturas;
create trigger cass_normaliza before insert on public.coluna_assinaturas for each row execute function public.cass_normaliza();
revoke all on function public.cass_normaliza() from public, anon, authenticated;

-- avisa quem assinou a série (ou a autora) e pode ler a coluna. Quem já recebe "Colunas" por seguir a autora não
-- recebe dois avisos da mesma coluna.
create or replace function public.coluna_assin_avisa(p public.publicacoes) returns void
language plpgsql security definer set search_path = public as $$
declare se text; n text; tit text; f uuid;
begin
  begin
    if not public.lt_coluna_ok(p) then return; end if;
    se := lower(btrim(coalesce(p.estilo -> 'coluna' ->> 'serie', '')));
    n := public.push_nome(p.autor);
    tit := coalesce(nullif(btrim(p.estilo -> 'coluna' ->> 'tit'), ''), 'Coluna nova');
    for f in select distinct a.leitor from public.coluna_assinaturas a
             where a.autor = p.autor and (a.serie = '' or (se <> '' and lower(a.serie) = se)) limit 500 loop
      if f <> p.autor and public.push_pode_ver(f, p.autor, p.publico)
         and not (public.push_quer(f, 'colunas') and exists (select 1 from public.push_seguidores_de(p.autor) s(u) where s.u = f)) then
        perform public.push_enfileirar(f, 'colunas_seguidas', p.autor, 'cs:' || p.autor,
          n || case when se <> '' then ' publicou na série “' || btrim(p.estilo -> 'coluna' ->> 'serie') || '”' else ' publicou uma coluna' end,
          tit, '?nt=coluna:' || p.id);
      end if;
    end loop;
  exception when others then null;
  end;
end $$;
revoke all on function public.coluna_assin_avisa(public.publicacoes) from public, anon, authenticated;

-- o aviso da v12 (publicar, publicar agora e agendadas que chegaram à hora) passa a avisar também quem assinou
create or replace function public.push_pub_avisa(p public.publicacoes) returns void
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(p); n text; orig uuid; oa uuid; f uuid; col boolean; tx text; tit text; tp text;
begin
  begin
    if p.tipo = 'story' or coalesce(j->>'arquivado', 'false') = 'true' then return; end if;
    if exists (select 1 from public.membros m where m.uid = p.autor and (m.suspenso_em is not null or m.excluido_em is not null)) then return; end if;
    n := public.push_nome(p.autor);
    tx := btrim(coalesce(p.texto, ''));
    if p.estilo->'rp'->>'k' = 'pub' and (p.estilo->'rp'->>'id') ~* '^[0-9a-f-]{36}$' then
      orig := (p.estilo->'rp'->>'id')::uuid;
      select autor into oa from public.publicacoes where id = orig;
      if oa is not null and oa <> p.autor and public.push_pode_ver(oa, p.autor, j->>'publico') then
        perform public.push_enfileirar(oa, 'reposts', p.autor, 'rp:' || orig,
          n || case when tx = '' and jsonb_typeof(p.estilo->'trecho') is distinct from 'object' then ' repostou sua publicação' else ' citou sua publicação' end, tx, '?nt=pub:' || p.id);
      end if;
    end if;
    col := p.tipo = 'coluna' or jsonb_typeof(p.estilo->'coluna') = 'object' or coalesce(p.estilo->>'coluna', '') in ('true', '1')
           or p.estilo->>'tipo' = 'coluna' or p.estilo->>'kind' = 'coluna';
    tit := coalesce(nullif(btrim(case when jsonb_typeof(p.estilo->'coluna') = 'object' then p.estilo->'coluna'->>'tit' end), ''),
                    nullif(btrim(p.estilo->>'titulo'), ''), tx);
    tp := case when col then 'colunas' else 'seguindo' end;
    for f in select * from public.push_seguidores_de(p.autor) limit 300 loop
      if f is distinct from oa and f <> p.autor and public.push_quer(f, tp) and public.push_pode_ver(f, p.autor, j->>'publico') then
        perform public.push_enfileirar(f, tp, p.autor, 'seg:' || p.autor,
          n || case when col then ' publicou uma coluna' else ' publicou' end, tit, '?nt=pub:' || p.id);
      end if;
    end loop;
  exception when others then null;
  end;
  if jsonb_typeof(p.estilo->'coluna') = 'object' then perform public.coluna_assin_avisa(p); end if;
end $$;
revoke all on function public.push_pub_avisa(public.publicacoes) from public, anon, authenticated;

-- 3. Comentários em destaque ----------------------------------------------------------------------------------------
create table if not exists public.coluna_destaques (
  pub uuid not null references public.publicacoes(id) on delete cascade,
  cautor uuid not null references public.membros(uid) on delete cascade,
  cid text not null check (char_length(cid) between 1 and 60),
  txt text not null default '' check (char_length(txt) <= 600),
  nome text not null default '' check (char_length(nome) <= 80),
  cat bigint not null default 0,
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (pub, cautor, cid)
);
alter table public.coluna_destaques enable row level security;

-- o comentário ainda existe? (os comentários das publicações ficam em pub_reacoes, desde a v4)
create or replace function public.cdest_vivo(p_autor uuid, p_cid text, p_pub uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pub_reacoes r where r.pub = p_pub and r.uid = p_autor and r.tipo = 'comentario' and r.chave = p_cid)
$$;
revoke all on function public.cdest_vivo(uuid, text, uuid) from public, anon;
grant execute on function public.cdest_vivo(uuid, text, uuid) to authenticated;

drop policy if exists cdest_ler on public.coluna_destaques;
create policy cdest_ler on public.coluna_destaques for select to authenticated using (
  public.e_membro() and exists (select 1 from public.publicacoes p where p.id = pub) and public.cdest_vivo(cautor, cid, pub));
drop policy if exists cdest_criar on public.coluna_destaques;
create policy cdest_criar on public.coluna_destaques for insert to authenticated with check (
  public.e_membro() and exists (select 1 from public.publicacoes p where p.id = pub and p.autor = auth.uid()));
drop policy if exists cdest_apagar on public.coluna_destaques;
create policy cdest_apagar on public.coluna_destaques for delete to authenticated using (
  exists (select 1 from public.publicacoes p where p.id = pub and p.autor = auth.uid()));
revoke all on public.coluna_destaques from anon, authenticated;
grant select, insert, delete on public.coluna_destaques to authenticated;

-- confere a coluna, o comentário e o limite de 3, e guarda a cópia do texto e do nome
create or replace function public.cdest_confere() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.publicacoes; c public.pub_reacoes;
begin
  select * into p from public.publicacoes where id = new.pub;
  if p.id is null or jsonb_typeof(p.estilo -> 'coluna') is distinct from 'object' then raise exception 'so em coluna' using errcode = '22023'; end if;
  select * into c from public.pub_reacoes r where r.pub = new.pub and r.uid = new.cautor and r.tipo = 'comentario' and r.chave = new.cid;
  if c.pub is null then raise exception 'comentario nao encontrado' using errcode = '22023'; end if;
  delete from public.coluna_destaques d where d.pub = new.pub and not public.cdest_vivo(d.cautor, d.cid, d.pub);
  if (select count(*) from public.coluna_destaques d where d.pub = new.pub) >= 3 then
    raise exception 'no maximo 3 destaques' using errcode = '22023';
  end if;
  new.txt := left(coalesce(c.valor ->> 'texto', ''), 600);
  new.nome := left(coalesce((select m.nome from public.membros m where m.uid = new.cautor), ''), 80);
  new.cat := coalesce(c.at, 0);
  new.at := (extract(epoch from now())*1000)::bigint;
  return new;
end $$;
drop trigger if exists cdest_confere on public.coluna_destaques;
create trigger cdest_confere before insert on public.coluna_destaques for each row execute function public.cdest_confere();
revoke all on function public.cdest_confere() from public, anon, authenticated;

-- Prumo News · v14: colunas públicas (link aberto) e newsletter por e-mail das autoras.
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Rodar depois da v13 (precisa da v9 "Seguir/colunas", da v10 "avisos", da v12 "agendar" e da v13).
-- Passo a passo completo (Resend, função, segredos, webhook): fonte/supabase/LEIA-ME-newsletter.md
-- O que muda:
--   1. Coluna pública: a autora escolhe, coluna por coluna, "Todos (link público)" (publico = 'publico', só em coluna).
--      Dentro do app, a coluna pública aparece para quem já veria uma coluna "para seguidores" (amigos e quem segue o
--      perfil aberto). Fora do app, qualquer pessoa lê pelo link, SEM conta: só pelas funções colunas_publicas() e
--      coluna_publica(id), que entregam apenas colunas públicas JÁ publicadas (não agendadas, não arquivadas, de autora
--      não suspensa nem excluída) e apenas os campos da página: título, linha fina, chamada, texto, capa e fotos do texto,
--      série, data, hashtags, nome e foto (só se o perfil for aberto) da autora. Nada de e-mail, nem dado de membro, nem
--      curtidas ou comentários. A tabela publicacoes continua fechada para quem não entrou.
--      Apagar a coluna, arquivar ou voltar para "Amigos"/"Seguidores" tira a coluna do link na próxima rodada do robô.
--   2. Fotos da coluna pública: o robô do site (GitHub, só com a chave publicável) copia as fotos para o próprio site
--      (c/f/), com nome embaralhado. Para isso, o Storage deixa ler SEM login só as fotos que estão numa coluna pública
--      publicada (e a foto de perfil aberto de quem tem coluna pública). Nada de pasta ou bucket público: deixou de ser
--      pública, a regra fecha na hora e o robô apaga a cópia.
--   3. Newsletter por e-mail de cada autora (tabela newsletter_assinantes): quem lê a coluna pública deixa o e-mail,
--      recebe um e-mail de confirmação e só passa a receber as colunas depois de confirmar (dois passos). Todo e-mail
--      tem o link de cancelar. Membro logado assina com 1 toque, usando o e-mail da conta só se marcar que concorda.
--      Proteções: no máximo 3 pedidos por hora (6 por dia) para o mesmo e-mail, 20 por hora para a mesma autora e 60 por
--      hora no total (o plano grátis do Resend manda 100 e-mails por dia);
--      ninguém lista assinantes. A autora vê só quantos são e baixa a lista dos CONFIRMADOS dela (CSV).
--   4. Envio: ao publicar uma coluna pública (inclusive a agendada, quando chega a hora), o banco põe na fila
--      (newsletter_fila) um e-mail para cada assinante confirmado da autora. A função enviar-newsletter (Edge Function,
--      chave do Resend só nos segredos do Supabase) manda em lotes e anota enviado/erro em cada linha.
--      A tabela newsletter_disparo ganha uma linha por pedido de confirmação e por coluna na fila: é nela que o
--      Database Webhook chama a função (uma chamada por coluna, não uma por assinante).
-- O app funciona antes e depois desta versão: sem ela, a opção "Todos (link público)" e a newsletter não aparecem.

-- 0. O valor novo de publico ---------------------------------------------------------------------------------------
alter table public.publicacoes drop constraint if exists publicacoes_publico_chk;
alter table public.publicacoes add constraint publicacoes_publico_chk check (publico in ('amigos','proximos','seguidores','publico'));

-- só coluna pode ser pública (post comum, story e reel, não)
create or replace function public.pub_v14_publico() returns trigger language plpgsql as $$
begin
  if new.publico = 'publico' and (new.tipo <> 'post' or new.estilo is null or jsonb_typeof(new.estilo -> 'coluna') is distinct from 'object') then
    raise exception 'so coluna pode ser publica' using errcode = '22023';
  end if;
  return new;
end $$;
drop trigger if exists pub_v14_publico on public.publicacoes;
create trigger pub_v14_publico before insert or update on public.publicacoes for each row execute function public.pub_v14_publico();
revoke all on function public.pub_v14_publico() from public, anon, authenticated;

-- dentro do app: a coluna pública aparece para os amigos e para quem segue o perfil aberto (como "seguidores").
-- (regra à parte, que se soma às outras; as restritivas de arquivado e agendada continuam valendo)
drop policy if exists pub_ler_publica on public.publicacoes;
create policy pub_ler_publica on public.publicacoes for select to authenticated using (
  publico = 'publico' and tipo = 'post' and public.e_membro()
  and (autor = auth.uid() or public.sao_amigos(auth.uid(), autor) or public.ve_como_seguidor(autor)));

-- é coluna pública já publicada, de autora ativa?
create or replace function public.coluna_publica_ok(p public.publicacoes) returns boolean
language sql stable security definer set search_path = public as $$
  select p.id is not null and p.publico = 'publico' and p.tipo = 'post' and p.estilo is not null
     and jsonb_typeof(p.estilo -> 'coluna') = 'object'
     and coalesce((to_jsonb(p) ->> 'arquivado')::boolean, false) = false
     and (p.publicar_em is null or p.publicar_em <= now())
     and exists (select 1 from public.membros m where m.uid = p.autor and m.suspenso_em is null and m.excluido_em is null)
$$;
revoke all on function public.coluna_publica_ok(public.publicacoes) from public, anon, authenticated;

-- a autora muda o "quem pode ler" de uma coluna já publicada (ou agendada): 'publico', 'amigos' ou 'seguidores'
create or replace function public.coluna_mudar_publico(p_id uuid, p_publico text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); p public.publicacoes; v text := coalesce(p_publico, '');
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if v not in ('publico', 'amigos', 'seguidores') then raise exception 'publico invalido' using errcode = '22023'; end if;
  select * into p from public.publicacoes where id = p_id;
  if p.id is null or p.autor <> me then raise exception 'so a autora muda' using errcode = '42501'; end if;
  if jsonb_typeof(p.estilo -> 'coluna') is distinct from 'object' then raise exception 'so coluna pode ser publica' using errcode = '22023'; end if;
  if v = 'seguidores' and not coalesce((select m.perfil_aberto from public.membros m where m.uid = me), false) then v := 'amigos'; end if;
  update public.publicacoes set publico = v where id = p_id;
  return v;
end $$;
revoke all on function public.coluna_mudar_publico(uuid, text) from public, anon;
grant execute on function public.coluna_mudar_publico(uuid, text) to authenticated;

-- 1. O que sai para fora: só os campos da página (sem uid, sem e-mail) -------------------------------------------
-- a autora vira uma chave embaralhada (para o robô juntar as colunas e a série da mesma pessoa)
create or replace function public.coluna_publica_json(p public.publicacoes) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id,
    'tit', left(coalesce(p.estilo -> 'coluna' ->> 'tit', ''), 90),
    'linha', left(coalesce(p.estilo -> 'coluna' ->> 'linha', ''), 160),
    'cham', left(coalesce(p.estilo -> 'coluna' ->> 'cham', ''), 280),
    'formato', case when p.estilo -> 'coluna' ->> 'f' = 'h' then 'h' else 'md' end,
    'corpo', left(coalesce(p.corpo, p.estilo -> 'coluna' ->> 'corpo', ''), 40000),
    'capa', case when coalesce(p.estilo -> 'coluna' ->> 'capa', 'true') <> 'false' and jsonb_array_length(p.fotos) > 0 then p.fotos ->> 0 end,
    'fotos', p.fotos,
    'serie', left(coalesce(p.estilo -> 'coluna' ->> 'serie', ''), 60),
    'n', case when coalesce(p.estilo -> 'coluna' ->> 'n', '') ~ '^[0-9]{1,4}$' then (p.estilo -> 'coluna' ->> 'n')::int end,
    'min', case when coalesce(p.estilo -> 'coluna' ->> 'min', '') ~ '^[0-9]{1,3}$' then (p.estilo -> 'coluna' ->> 'min')::int end,
    'at', p.at,
    'editado', (to_jsonb(p) ->> 'editado'),
    'tags', case when p.texto ~ E'\n\n#' then (select string_agg(t[1], ' ') from regexp_matches(
               (regexp_split_to_array(p.texto, E'\n\n'))[array_length(regexp_split_to_array(p.texto, E'\n\n'), 1)], '(#[^\s#]{1,40})', 'g') t) else '' end,
    'autora', jsonb_build_object(
       'k', left(md5('prumo-autora:' || p.autor::text), 16),
       'nome', m.nome,
       'foto', case when coalesce((to_jsonb(m) ->> 'perfil_aberto')::boolean, false) then m.foto end))
  from public.membros m where m.uid = p.autor
$$;
revoke all on function public.coluna_publica_json(public.publicacoes) from public, anon, authenticated;

-- as colunas públicas publicadas (as mais novas primeiro); é o que o robô do site lê
create or replace function public.colunas_publicas(p_limite int default 300) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(public.coluna_publica_json(p) order by p.at desc), '[]'::jsonb)
  from (select * from public.publicacoes x where x.publico = 'publico' and public.coluna_publica_ok(x)
        order by x.at desc limit least(greatest(coalesce(p_limite, 300), 1), 1000)) p
$$;
-- uma coluna pública (ou null se não existe, não é pública ou ainda não saiu)
create or replace function public.coluna_publica(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.coluna_publica_ok(p) then public.coluna_publica_json(p) end
  from public.publicacoes p where p.id = p_id
$$;
revoke all on function public.colunas_publicas(int), public.coluna_publica(uuid) from public;
grant execute on function public.colunas_publicas(int), public.coluna_publica(uuid) to anon, authenticated;

-- 2. Fotos: o arquivo abre sem login só se estiver numa coluna pública publicada (ou for a foto do perfil aberto
--    de quem tem coluna pública). A regra do Storage fica num bloco que só roda onde existe o Storage.
create or replace function public.foto_de_coluna_publica(p_nome text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.publicacoes p where p.fotos ? p_nome and public.coluna_publica_ok(p))
      or exists (select 1 from public.membros m where m.foto = p_nome and coalesce((to_jsonb(m) ->> 'perfil_aberto')::boolean, false)
                 and m.suspenso_em is null and m.excluido_em is null
                 and exists (select 1 from public.publicacoes p where p.autor = m.uid and public.coluna_publica_ok(p)))
$$;
revoke all on function public.foto_de_coluna_publica(text) from public;
grant execute on function public.foto_de_coluna_publica(text) to anon, authenticated;
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and to_regclass('storage.objects') is not null then
    execute 'drop policy if exists fotos_coluna_publica_ler on storage.objects';
    execute 'create policy fotos_coluna_publica_ler on storage.objects for select to anon, authenticated using (
      bucket_id = ''fotos'' and public.foto_de_coluna_publica(name))';
  end if;
end $$;

-- 3. Newsletter --------------------------------------------------------------------------------------------------
create table if not exists public.newsletter_assinantes (
  id bigint generated always as identity primary key,
  autora uuid not null references public.membros(uid) on delete cascade,
  email text not null check (char_length(email) between 6 and 254 and email = lower(email)),
  confirmado boolean not null default false,
  token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  criado timestamptz not null default now(),
  confirmado_em timestamptz,
  cancelado timestamptz,
  membro uuid references public.membros(uid) on delete set null,
  origem text not null default 'pagina' check (origem in ('pagina', 'app')),
  unique (autora, email)
);
create index if not exists newsletter_assinantes_autora_idx on public.newsletter_assinantes(autora) where confirmado and cancelado is null;
alter table public.newsletter_assinantes enable row level security;
revoke all on public.newsletter_assinantes from anon, authenticated;   -- sem regra de leitura: só pelas funções abaixo

-- pedidos de assinatura (para o limite): guarda só um resumo (md5) do e-mail, por 2 dias
create table if not exists public.newsletter_pedidos (
  id bigint generated always as identity primary key,
  email_h text not null,
  autora uuid not null,
  at timestamptz not null default now()
);
create index if not exists newsletter_pedidos_email_idx on public.newsletter_pedidos(email_h, at);
create index if not exists newsletter_pedidos_autora_idx on public.newsletter_pedidos(autora, at);
create index if not exists newsletter_pedidos_at_idx on public.newsletter_pedidos(at);
alter table public.newsletter_pedidos enable row level security;
revoke all on public.newsletter_pedidos from anon, authenticated;

-- a fila de envio: um e-mail por linha (confirmação ou coluna), com o resultado
create table if not exists public.newsletter_fila (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('confirmacao', 'coluna')),
  assinante bigint not null references public.newsletter_assinantes(id) on delete cascade,
  pub uuid references public.publicacoes(id) on delete cascade,
  estado text not null default 'pendente' check (estado in ('pendente', 'processando', 'enviado', 'falhou', 'cancelado')),
  tentativas int not null default 0,
  erro text check (erro is null or char_length(erro) <= 500),
  resend_id text,
  criado timestamptz not null default now(),
  liberar_em timestamptz not null default now(),
  pego_em timestamptz,
  enviado_em timestamptz
);
create unique index if not exists newsletter_fila_coluna_uk on public.newsletter_fila(pub, assinante) where tipo = 'coluna';
create index if not exists newsletter_fila_estado_idx on public.newsletter_fila(estado, liberar_em);
alter table public.newsletter_fila enable row level security;
revoke all on public.newsletter_fila from anon, authenticated;

-- as colunas que já foram para a fila (uma vez só por coluna)
create table if not exists public.newsletter_colunas (
  pub uuid primary key references public.publicacoes(id) on delete cascade,
  autora uuid not null,
  n int not null default 0,
  at timestamptz not null default now()
);
alter table public.newsletter_colunas enable row level security;
revoke all on public.newsletter_colunas from anon, authenticated;

-- o "sino" do Database Webhook: 1 linha por confirmação pedida e por coluna na fila
create table if not exists public.newsletter_disparo (
  id bigint generated always as identity primary key,
  motivo text not null,
  at timestamptz not null default now()
);
alter table public.newsletter_disparo enable row level security;
revoke all on public.newsletter_disparo from anon, authenticated;

-- a partir de quando as colunas públicas contam (não manda colunas antigas na primeira vez)
insert into public.config_app(chave, valor) values ('newsletter_desde', jsonb_build_object('ts', (extract(epoch from now())*1000)::bigint))
  on conflict (chave) do nothing;

create or replace function public.nl_email_ok(p text) returns boolean
language sql immutable as $$
  select p is not null and char_length(p) between 6 and 254 and position('..' in p) = 0
     and p ~ '^[a-z0-9][a-z0-9._%+-]{0,63}@[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?)*\.[a-z]{2,24}$'
$$;
-- a autora tem coluna pública publicada? (a newsletter só existe para quem tem)
create or replace function public.nl_autora_aberta(p_autora uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.publicacoes p where p.autor = p_autora and p.publico = 'publico' and public.coluna_publica_ok(p))
$$;
revoke all on function public.nl_email_ok(text), public.nl_autora_aberta(uuid) from public, anon, authenticated;

create or replace function public.nl_disparo(p_motivo text) returns void
language sql security definer set search_path = public as $$
  insert into public.newsletter_disparo(motivo) values (left(coalesce(p_motivo, ''), 60));
  delete from public.newsletter_disparo where at < now() - interval '2 days';
$$;
revoke all on function public.nl_disparo(text) from public, anon, authenticated;

-- pedir a assinatura (página pública, sem login; ou no app): manda o e-mail de confirmação.
-- p_coluna (da página pública) ou p_autora (do app). Devolve 'ok' ou 'limite'. Nunca diz se o e-mail já assinava.
create or replace function public.newsletter_assinar(p_email text, p_coluna uuid default null, p_autora uuid default null) returns text
language plpgsql security definer set search_path = public as $$
declare e text := lower(btrim(coalesce(p_email, ''))); a uuid; h text; s public.newsletter_assinantes;
begin
  if not public.nl_email_ok(e) then raise exception 'email invalido' using errcode = '22023'; end if;
  if p_coluna is not null then
    select p.autor into a from public.publicacoes p where p.id = p_coluna and public.coluna_publica_ok(p);
  elsif p_autora is not null and auth.uid() is not null and public.e_membro() then
    a := p_autora;
  end if;
  if a is null or not public.nl_autora_aberta(a) then raise exception 'newsletter indisponivel' using errcode = '42501'; end if;
  h := md5('prumo-nl:' || e);
  if (select count(*) from public.newsletter_pedidos where email_h = h and at > now() - interval '1 hour') >= 3
     or (select count(*) from public.newsletter_pedidos where email_h = h and at > now() - interval '1 day') >= 6
     or (select count(*) from public.newsletter_pedidos where autora = a and at > now() - interval '1 hour') >= 20
     or (select count(*) from public.newsletter_pedidos where at > now() - interval '1 hour') >= 60 then
    return 'limite';
  end if;
  insert into public.newsletter_pedidos(email_h, autora) values (h, a);
  if random() < 0.05 then delete from public.newsletter_pedidos where at < now() - interval '2 days'; end if;
  select * into s from public.newsletter_assinantes where autora = a and email = e;
  if s.id is not null and s.confirmado and s.cancelado is null then return 'ok'; end if;   -- já assina: nada a mandar
  if s.id is null then
    insert into public.newsletter_assinantes(autora, email, origem, membro)
    values (a, e, case when p_coluna is null then 'app' else 'pagina' end, case when public.e_membro() then auth.uid() end) returning * into s;
  else
    update public.newsletter_assinantes set confirmado = false, cancelado = null, criado = now(), confirmado_em = null,
      token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
    where id = s.id returning * into s;
  end if;
  update public.newsletter_fila set estado = 'cancelado' where assinante = s.id and tipo = 'confirmacao' and estado = 'pendente';
  insert into public.newsletter_fila(tipo, assinante) values ('confirmacao', s.id);
  perform public.nl_disparo('confirmacao');
  return 'ok';
end $$;
revoke all on function public.newsletter_assinar(text, uuid, uuid) from public;
grant execute on function public.newsletter_assinar(text, uuid, uuid) to anon, authenticated;

-- o link do e-mail de confirmação (vale 7 dias). Devolve {ok, nome} ou {ok:false, motivo}
create or replace function public.newsletter_confirmar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.newsletter_assinantes;
begin
  if coalesce(p_token, '') !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'motivo', 'link'); end if;
  select * into s from public.newsletter_assinantes where token = p_token;
  if s.id is null or s.cancelado is not null then return jsonb_build_object('ok', false, 'motivo', 'link'); end if;
  if not s.confirmado then
    if s.criado < now() - interval '7 days' then return jsonb_build_object('ok', false, 'motivo', 'expirado'); end if;
    update public.newsletter_assinantes set confirmado = true, confirmado_em = now() where id = s.id;
  end if;
  return jsonb_build_object('ok', true, 'nome', (select m.nome from public.membros m where m.uid = s.autora));
end $$;
-- o link "cancelar" de todo e-mail (vale sempre)
create or replace function public.newsletter_cancelar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.newsletter_assinantes;
begin
  if coalesce(p_token, '') !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'motivo', 'link'); end if;
  select * into s from public.newsletter_assinantes where token = p_token;
  if s.id is null then return jsonb_build_object('ok', false, 'motivo', 'link'); end if;
  update public.newsletter_assinantes set confirmado = false, cancelado = coalesce(cancelado, now()) where id = s.id;
  update public.newsletter_fila set estado = 'cancelado' where assinante = s.id and estado = 'pendente';
  return jsonb_build_object('ok', true, 'nome', (select m.nome from public.membros m where m.uid = s.autora));
end $$;
revoke all on function public.newsletter_confirmar(text), public.newsletter_cancelar(text) from public;
grant execute on function public.newsletter_confirmar(text), public.newsletter_cancelar(text) to anon, authenticated;

-- membro logado: assinar com 1 toque usando o e-mail da conta (só com p_consentimento = true) ou cancelar
create or replace function public.newsletter_membro(p_autora uuid, p_assinar boolean, p_consentimento boolean default false) returns text
language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid(); e text;
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  select lower(btrim(u.email)) into e from auth.users u where u.id = me;
  if e is null or not public.nl_email_ok(e) then raise exception 'conta sem e-mail valido' using errcode = '22023'; end if;
  if coalesce(p_assinar, false) then
    if not coalesce(p_consentimento, false) then raise exception 'precisa do consentimento' using errcode = '22023'; end if;
    if p_autora = me then raise exception 'nao assina a si mesma' using errcode = '22023'; end if;
    if not public.nl_autora_aberta(p_autora) then raise exception 'newsletter indisponivel' using errcode = '42501'; end if;
    if exists (select 1 from public.bloqueios b where (b.de = me and b.para = p_autora) or (b.de = p_autora and b.para = me)) then
      raise exception 'newsletter indisponivel' using errcode = '42501'; end if;
    insert into public.newsletter_assinantes(autora, email, confirmado, confirmado_em, membro, origem)
    values (p_autora, e, true, now(), me, 'app')
    on conflict (autora, email) do update set confirmado = true, confirmado_em = now(), cancelado = null, membro = me;
    return 'ok';
  end if;
  update public.newsletter_assinantes set confirmado = false, cancelado = coalesce(cancelado, now()) where autora = p_autora and email = e;
  update public.newsletter_fila f set estado = 'cancelado' from public.newsletter_assinantes s
   where f.assinante = s.id and s.autora = p_autora and s.email = e and f.estado = 'pendente';
  return 'ok';
end $$;
-- o que o app mostra: a autora tem newsletter? eu assino? (e, para a própria autora, quantos confirmados e pendentes)
create or replace function public.newsletter_info(p_autora uuid) returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare me uuid := auth.uid(); e text;
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  select lower(btrim(u.email)) into e from auth.users u where u.id = me;
  return jsonb_build_object(
    'aberta', public.nl_autora_aberta(p_autora),
    'assinando', exists (select 1 from public.newsletter_assinantes s where s.autora = p_autora and s.email = e and s.confirmado and s.cancelado is null),
    'confirmados', case when p_autora = me then (select count(*) from public.newsletter_assinantes s where s.autora = me and s.confirmado and s.cancelado is null) end,
    'pendentes', case when p_autora = me then (select count(*) from public.newsletter_assinantes s where s.autora = me and not s.confirmado and s.cancelado is null and s.criado > now() - interval '7 days') end);
end $$;
-- a lista da autora (só os confirmados, só os dela), para baixar em CSV
create or replace function public.newsletter_exportar() returns table(email text, desde timestamptz, origem text)
language sql stable security definer set search_path = public as $$
  select s.email, s.confirmado_em, s.origem from public.newsletter_assinantes s
  where s.autora = auth.uid() and public.e_membro() and s.confirmado and s.cancelado is null order by s.confirmado_em, s.id
$$;
revoke all on function public.newsletter_membro(uuid, boolean, boolean), public.newsletter_info(uuid), public.newsletter_exportar() from public, anon;
grant execute on function public.newsletter_membro(uuid, boolean, boolean), public.newsletter_info(uuid), public.newsletter_exportar() to authenticated;

-- 4. Fila das colunas -----------------------------------------------------------------------------------------------
-- põe a coluna pública na fila para os confirmados da autora (uma vez só por coluna). Os e-mails esperam 10 minutos
-- (o robô do site publica a página antes; a função ainda confere se a página já existe).
create or replace function public.newsletter_coluna(p public.publicacoes) returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; desde bigint;
begin
  begin
    if p.id is null or not public.coluna_publica_ok(p) then return 0; end if;
    if exists (select 1 from public.newsletter_colunas c where c.pub = p.id) then return 0; end if;
    desde := coalesce((select (valor ->> 'ts')::bigint from public.config_app where chave = 'newsletter_desde'), 0);
    if p.at < desde - 600000 then return 0; end if;
    insert into public.newsletter_fila(tipo, assinante, pub, liberar_em)
    select 'coluna', s.id, p.id, now() + interval '10 minutes' from public.newsletter_assinantes s
     where s.autora = p.autor and s.confirmado and s.cancelado is null
    on conflict do nothing;
    get diagnostics n = row_count;
    insert into public.newsletter_colunas(pub, autora, n) values (p.id, p.autor, n) on conflict do nothing;
    if n > 0 then perform public.nl_disparo('coluna'); end if;
  exception when others then return 0;   -- um erro aqui nunca impede a coluna de ser gravada
  end;
  return n;
end $$;
revoke all on function public.newsletter_coluna(public.publicacoes) from public, anon, authenticated;

-- publicar já pública (sem agendar)
create or replace function public.nl_t_pub_insere() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.publico = 'publico' and (new.publicar_em is null or new.publicar_em <= now()) then perform public.newsletter_coluna(new); end if;
  return null;
end $$;
drop trigger if exists nl_t_pub_insere on public.publicacoes;
create trigger nl_t_pub_insere after insert on public.publicacoes for each row execute function public.nl_t_pub_insere();
-- agendada que saiu ("publicar agora" ou o aviso das agendadas da v12) e coluna que virou pública nas primeiras 24 h
create or replace function public.nl_t_pub_muda() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.publico = 'publico' and (
       (old.publicar_em is not null and old.publicar_em > now() and new.publicar_em is not null and new.publicar_em <= now())
    or (old.agenda_aviso and not new.agenda_aviso)
    or (old.publico <> 'publico' and new.at > (extract(epoch from now() - interval '24 hours')*1000)::bigint)) then
    perform public.newsletter_coluna(new);
  end if;
  return null;
end $$;
drop trigger if exists nl_t_pub_muda on public.publicacoes;
create trigger nl_t_pub_muda after update on public.publicacoes for each row execute function public.nl_t_pub_muda();
revoke all on function public.nl_t_pub_insere(), public.nl_t_pub_muda() from public, anon, authenticated;

-- rede de segurança (a função de envio chama a cada rodada): agendadas que chegaram à hora sem o pg_cron da v12,
-- e limpeza (pedidos de 2 dias, fila resolvida de 90 dias, cadastro sem confirmar de 30 dias)
create or replace function public.newsletter_varrer() returns int
language plpgsql security definer set search_path = public as $$
declare r public.publicacoes; k int := 0;
begin
  for r in select * from public.publicacoes p where p.publico = 'publico' and p.at > (extract(epoch from now() - interval '2 days')*1000)::bigint
             and not exists (select 1 from public.newsletter_colunas c where c.pub = p.id) order by p.at limit 50 loop
    k := k + public.newsletter_coluna(r);
  end loop;
  delete from public.newsletter_pedidos where at < now() - interval '2 days';
  delete from public.newsletter_fila where estado in ('enviado', 'falhou', 'cancelado') and criado < now() - interval '90 days';
  delete from public.newsletter_assinantes where not confirmado and cancelado is null and criado < now() - interval '30 days';
  return k;
end $$;
revoke all on function public.newsletter_varrer() from public, anon, authenticated;

-- a função de envio (service_role) lê e marca a fila, os assinantes e chama a varredura
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, update, delete on public.newsletter_fila to service_role';
    execute 'grant select on public.newsletter_assinantes, public.newsletter_colunas to service_role';
    execute 'grant execute on function public.newsletter_varrer(), public.coluna_publica(uuid) to service_role';
  end if;
end $$;

-- conta excluída: some da newsletter como assinante (o e-mail da conta) — como autora, o "on delete cascade" já apaga
create or replace function public.nl_t_conta_sai() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  update public.newsletter_assinantes set confirmado = false, cancelado = coalesce(cancelado, now()) where membro = new.uid;
  delete from public.newsletter_assinantes where autora = new.uid;
  return null;
end $$;
drop trigger if exists nl_t_conta_sai on public.membros;
create trigger nl_t_conta_sai after update of excluido_em on public.membros
  for each row when (new.excluido_em is not null and old.excluido_em is null) execute function public.nl_t_conta_sai();
revoke all on function public.nl_t_conta_sai() from public, anon, authenticated;

-- Prumo News · correções da auditoria de segurança do banco (09/11/2026).
-- Rodar UMA vez no Supabase, DEPOIS da v14: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Não depende de nada que venha depois da v14; se uma versão futura for rodada depois desta, rode esta de novo
-- (algumas versões recriam funções e, ao recriar, voltam ao jeito antigo — ver o item 1).
-- O app funciona igual antes e depois. O relatório completo está em fonte/qa/AUDITORIA-BANCO.md.
--
-- O que muda, em linguagem simples:
--   1. "Esta foto está em uso?" (midia_em_uso) deixa de responder para quem não é o administrador.
--      Antes, qualquer conta logada (até quem só criou o login, sem convite) podia perguntar se um TEXTO qualquer
--      aparecia no rascunho de coluna de QUALQUER pessoa — dava para descobrir o rascunho letra por letra.
--      Agora só o administrador recebe a resposta de verdade (é para a limpeza de arquivos dele); para os outros
--      a resposta é sempre "em uso", que nunca libera nada.
--   2. Freios contra enxurrada (contam por pessoa; só valem para quem usa o app, não para o SQL Editor nem para as
--      funções do servidor): publicações (60 por hora, 300 por dia), curtidas em publicações e em comentários
--      (200 por hora cada), comentários em publicações (1.000 por dia), pedidos de amizade novos (50 por dia),
--      começar a seguir (150 por dia), avisos de erro (10 por hora, 20 por dia) e destaques (100 por pessoa).
--      Antes, pedir amizade e cancelar (ou seguir e deixar de seguir) em ciclo mandava um aviso no celular da
--      outra pessoa a cada vez, sem fim; e não havia limite nenhum de posts nem de avisos de erro.
--      Curtida em publicação passa a ser uma só por pessoa (a "chave" da curtida tem de ser vazia, como o app faz);
--      antes dava para gravar curtidas sem fim na mesma publicação, cada uma com até 4 KB.
--   3. Newsletter: no máximo 10 pedidos de assinatura por hora (20 por dia) vindos do mesmo endereço de internet e
--      50 por dia no total. Antes, qualquer pessoa SEM conta podia mandar até 1.440 e-mails de confirmação por dia
--      para endereços quaisquer, gastando a cota do Resend (100 por dia no plano grátis) e travando as colunas.
--      Do endereço de internet o banco guarda só um resumo embaralhado (md5), apagado com o pedido em 2 dias.
--   4. Excluir a conta passa a apagar também os rascunhos de coluna, o histórico de leituras de colunas, as
--      assinaturas de séries (as suas e as que outros faziam de você), a cópia do seu comentário nos destaques das
--      colunas e o seu e-mail das newsletters que você assinou pelo app (LGPD). Antes, isso ficava no banco.
--   5. Conta suspensa não edita mais as próprias publicações nem os destaques (antes ela continuava mudando o texto,
--      que os amigos seguiam vendo). Apagar continua liberado.
--   6. "Quem viu o story": a hora passa a ser a do servidor (antes o app podia mandar uma hora qualquer).
--   7. Arquivos (Storage): no máximo 2.000 fotos e 60 vídeos guardados por pessoa, e 300 fotos e 15 vídeos por dia.
--      Antes um membro podia encher sozinho o espaço do plano. (Só roda onde existe o Storage.)
--   8. Permissões padrão: tabela, sequência ou função NOVA no schema public não nasce mais aberta para visitantes
--      sem login (anon). Antes o Supabase dava tudo a anon por padrão — a tabela config_app estava assim (só o RLS
--      segurava; o TRUNCATE nem passa pelo RLS). Função nova para visitantes precisa de "grant execute ... to anon"
--      explícito (as atuais já têm). A função seg11_aberto deixa de ser chamada direto pelo app (só por dentro).
--   9. "Security Advisors" do Supabase: as funções que não tinham o search_path fixo passam a ter
--      (aviso "Function Search Path Mutable"), e as SECURITY DEFINER ganham pg_temp no fim do search_path
--      (ninguém consegue "trocar" uma tabela por outra temporária com o mesmo nome).

-- 1. midia_em_uso: resposta só para o administrador -------------------------------------------------------------
create or replace function public.midia_em_uso(p_nome text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select case when not public.e_admin() then true else (
         exists (select 1 from public.publicacoes p where p.fotos ? p_nome or p.estilo->>'video' = p_nome)
      or exists (select 1 from public.membros m where m.foto = p_nome)
      or exists (select 1 from public.coluna_rascunhos r where position(p_nome in r.dados::text) > 0)) end $$;
revoke all on function public.midia_em_uso(text) from public, anon;
grant execute on function public.midia_em_uso(text) to authenticated;   -- as regras do Storage da v6 chamam como "authenticated"

-- 2. Freios -----------------------------------------------------------------------------------------------------
-- cada ação contada fica registrada aqui por 2 dias (só quem, o quê e quando); ninguém do app lê nem escreve
create table if not exists public.freio_eventos (
  uid uuid not null,
  tipo text not null,
  at timestamptz not null default now()
);
create index if not exists freio_eventos_idx on public.freio_eventos(uid, tipo, at);
alter table public.freio_eventos enable row level security;
revoke all on public.freio_eventos from anon, authenticated;

-- conta a ação e recusa se passou do limite. Só vale para pedidos do app (papel anon/authenticated):
-- o SQL Editor e as funções do servidor (service_role) não são freados.
create or replace function public.freio_conta(p_uid uuid, p_tipo text, p_hora int, p_dia int) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_uid is null or coalesce(current_setting('role', true), '') not in ('authenticated', 'anon') then return; end if;
  if (p_hora is not null and (select count(*) from public.freio_eventos e where e.uid = p_uid and e.tipo = p_tipo and e.at > now() - interval '1 hour') >= p_hora)
     or (p_dia is not null and (select count(*) from public.freio_eventos e where e.uid = p_uid and e.tipo = p_tipo and e.at > now() - interval '1 day') >= p_dia) then
    raise exception 'limite: % demais por agora', p_tipo using errcode = '54000';
  end if;
  insert into public.freio_eventos(uid, tipo) values (p_uid, p_tipo);
  if random() < 0.02 then delete from public.freio_eventos where at < now() - interval '2 days'; end if;
end $$;
revoke all on function public.freio_conta(uuid, text, int, int) from public, anon, authenticated;

create or replace function public.freio_t_publicacoes() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin perform public.freio_conta(new.autor, 'publicacao', 60, 300); return new; end $$;
drop trigger if exists freio_publicacoes on public.publicacoes;
create trigger freio_publicacoes before insert on public.publicacoes for each row execute function public.freio_t_publicacoes();

create or replace function public.freio_t_reacoes() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.tipo = 'curtida' then perform public.freio_conta(new.uid, 'curtida', 200, 2000);
  elsif new.tipo = 'comentario' then perform public.freio_conta(new.uid, 'comentario', null, 1000);
  end if;
  return new;
end $$;
drop trigger if exists freio_reacoes on public.pub_reacoes;
create trigger freio_reacoes before insert on public.pub_reacoes for each row execute function public.freio_t_reacoes();

-- curtida é uma só por pessoa e por publicação (o app sempre grava chave vazia e valor vazio).
-- "not valid": não confere as linhas antigas (não falha se houver alguma), só as novas.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'pub_reacoes_curtida_unica') then
    alter table public.pub_reacoes add constraint pub_reacoes_curtida_unica
      check (tipo <> 'curtida' or (chave = '' and valor = '{}'::jsonb)) not valid;
  end if;
end $$;

create or replace function public.freio_t_com_curtidas() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin perform public.freio_conta(new.uid, 'curtida_comentario', 200, 2000); return new; end $$;
drop trigger if exists freio_com_curtidas on public.com_curtidas;
create trigger freio_com_curtidas before insert on public.com_curtidas for each row execute function public.freio_t_com_curtidas();

create or replace function public.freio_t_amizades() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'pendente' then perform public.freio_conta(new.de, 'pedido_amizade', null, 50); end if;
  return new;
end $$;
drop trigger if exists freio_amizades on public.amizades;
create trigger freio_amizades before insert on public.amizades for each row execute function public.freio_t_amizades();

create or replace function public.freio_t_seguidores() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin perform public.freio_conta(new.seguidor, 'seguir', null, 150); return new; end $$;
drop trigger if exists freio_seguidores on public.seguidores;
create trigger freio_seguidores before insert on public.seguidores for each row execute function public.freio_t_seguidores();

create or replace function public.freio_t_erros() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin perform public.freio_conta(new.uid, 'aviso_erro', 10, 20); return new; end $$;
drop trigger if exists freio_erros on public.erros;
create trigger freio_erros before insert on public.erros for each row execute function public.freio_t_erros();

create or replace function public.freio_t_destaques() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.destaques d where d.dono = new.dono) >= 100 then
    raise exception 'no maximo 100 destaques' using errcode = '54000';
  end if;
  return new;
end $$;
drop trigger if exists freio_destaques on public.destaques;
create trigger freio_destaques before insert on public.destaques for each row execute function public.freio_t_destaques();

revoke all on function public.freio_t_publicacoes(), public.freio_t_reacoes(), public.freio_t_com_curtidas(), public.freio_t_amizades(),
  public.freio_t_seguidores(), public.freio_t_erros(), public.freio_t_destaques() from public, anon, authenticated;

-- 3. Newsletter: limite por endereço de internet e por dia ----------------------------------------------------------
alter table public.newsletter_pedidos add column if not exists ip_h text;
create index if not exists newsletter_pedidos_ip_idx on public.newsletter_pedidos(ip_h, at);
create or replace function public.freio_t_nl_pedidos() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare hd json; ip text;
begin
  begin hd := nullif(current_setting('request.headers', true), '')::json; exception when others then hd := null; end;
  ip := nullif(btrim(coalesce(hd ->> 'cf-connecting-ip', split_part(coalesce(hd ->> 'x-forwarded-for', ''), ',', 1), hd ->> 'x-real-ip', '')), '');
  if ip is not null then new.ip_h := md5('prumo-ip:' || ip); end if;
  if coalesce(current_setting('role', true), '') not in ('authenticated', 'anon') then return new; end if;
  if new.ip_h is not null and (
       (select count(*) from public.newsletter_pedidos p where p.ip_h = new.ip_h and p.at > now() - interval '1 hour') >= 10
    or (select count(*) from public.newsletter_pedidos p where p.ip_h = new.ip_h and p.at > now() - interval '1 day') >= 20) then
    raise exception 'limite de pedidos deste endereco' using errcode = '54000';
  end if;
  if (select count(*) from public.newsletter_pedidos p where p.at > now() - interval '1 day') >= 50 then
    raise exception 'limite de pedidos do dia' using errcode = '54000';
  end if;
  return new;
end $$;
drop trigger if exists freio_nl_pedidos on public.newsletter_pedidos;
create trigger freio_nl_pedidos before insert on public.newsletter_pedidos for each row execute function public.freio_t_nl_pedidos();
revoke all on function public.freio_t_nl_pedidos() from public, anon, authenticated;

-- 4. Excluir a conta apaga o resto (LGPD) ----------------------------------------------------------------------------
-- (gatilho, como os da v9/v10/v14: continua valendo mesmo se uma versão futura recriar excluir_conta)
create or replace function public.segur_lgpd_conta() returns trigger
language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare e text;
begin
  if to_regclass('public.coluna_rascunhos') is not null then
    execute 'delete from public.coluna_rascunhos where autor = $1' using new.uid; end if;
  if to_regclass('public.coluna_leituras') is not null then
    execute 'delete from public.coluna_leituras where leitor = $1' using new.uid; end if;
  if to_regclass('public.coluna_assinaturas') is not null then
    execute 'delete from public.coluna_assinaturas where leitor = $1 or autor = $1' using new.uid; end if;
  if to_regclass('public.coluna_destaques') is not null then
    execute 'delete from public.coluna_destaques where cautor = $1' using new.uid; end if;
  if to_regclass('public.newsletter_assinantes') is not null then
    select lower(btrim(u.email)) into e from auth.users u where u.id = new.uid;
    -- o e-mail da própria conta sai; um e-mail de outra pessoa digitado no app fica, mas sem ligação com a conta
    execute 'delete from public.newsletter_assinantes where membro = $1 and email = $2' using new.uid, coalesce(e, '');
    execute 'update public.newsletter_assinantes set membro = null where membro = $1' using new.uid;
  end if;
  return null;
end $$;
drop trigger if exists segur_lgpd_conta on public.membros;
create trigger segur_lgpd_conta after update of excluido_em on public.membros
  for each row when (new.excluido_em is not null and old.excluido_em is null) execute function public.segur_lgpd_conta();
revoke all on function public.segur_lgpd_conta() from public, anon, authenticated;

-- 5. Conta suspensa não edita (regras restritivas: somam-se às de "só o autor/dono") --------------------------------
drop policy if exists segur_pub_editar_ativo on public.publicacoes;
create policy segur_pub_editar_ativo on public.publicacoes as restrictive for update to authenticated using (public.e_membro());
drop policy if exists segur_dest_mudar_ativo on public.destaques;
create policy segur_dest_mudar_ativo on public.destaques as restrictive for update to authenticated using (public.e_membro());

-- 6. Quem viu o story: a hora é a do servidor ------------------------------------------------------------------------
create or replace function public.segur_vistos_hora() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.at := (extract(epoch from now())*1000)::bigint; return new; end $$;
drop trigger if exists segur_vistos_hora on public.pub_vistos;
create trigger segur_vistos_hora before insert on public.pub_vistos for each row execute function public.segur_vistos_hora();
revoke all on function public.segur_vistos_hora() from public, anon, authenticated;

-- 7. Storage: cota de arquivos por pessoa (só onde existe o Storage) -------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and to_regclass('storage.objects') is not null then
    execute $f$
      create or replace function public.segur_storage_cota_ok(p_bucket text) returns boolean
      language sql stable security definer set search_path = public, pg_temp as $q$
        select auth.uid() is not null
          and (select count(*) from storage.objects o where o.bucket_id = p_bucket and split_part(o.name, '/', 1) = auth.uid()::text)
              < case when p_bucket = 'videos' then 60 else 2000 end
          and (select count(*) from storage.objects o where o.bucket_id = p_bucket and split_part(o.name, '/', 1) = auth.uid()::text
                 and o.created_at > now() - interval '1 day')
              < case when p_bucket = 'videos' then 15 else 300 end $q$ $f$;
    execute 'revoke all on function public.segur_storage_cota_ok(text) from public, anon';
    execute 'grant execute on function public.segur_storage_cota_ok(text) to authenticated';
    execute 'drop policy if exists segur_cota_envio on storage.objects';
    execute 'create policy segur_cota_envio on storage.objects as restrictive for insert to authenticated with check (
      bucket_id not in (''fotos'', ''videos'') or public.segur_storage_cota_ok(bucket_id))';
  end if;
end $$;

-- 8. Permissões padrão e sobras de permissão --------------------------------------------------------------------------
revoke all on public.config_app from anon, authenticated;            -- só as funções leem e gravam (como já era a intenção)
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges revoke execute on functions from public;   -- o padrão do PUBLIC só sai assim (sem "in schema")
revoke all on function public.seg11_aberto(uuid) from public, anon, authenticated;   -- só as funções de seguidores usam

-- 9. search_path fixo em todas as funções do Prumo (Security Advisors) -------------------------------------------------
do $$
declare r record; sp text;
begin
  for r in select p.oid, p.prosecdef, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.prokind = 'f' and pg_get_userbyid(p.proowner) = current_user
              and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e') loop
    sp := (select substr(c, 13) from unnest(coalesce(r.proconfig, '{}'::text[])) c where c like 'search_path=%' limit 1);
    if sp is null then
      execute format('alter function %s set search_path = public, pg_temp', r.oid::regprocedure);
    elsif r.prosecdef and sp !~ 'pg_temp' then
      execute format('alter function %s set search_path = %s, pg_temp', r.oid::regprocedure, sp);
    end if;
  end loop;
end $$;
-- Prumo News · v15: registro de erros do app e contagem de uso, anônimos (para o administrador).
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Rodar depois da v14 (usa a função e_admin(), que já existe desde a primeira versão).
-- O que muda:
--   1. Erros: o app manda, em lotes, os erros que acontecem nos aparelhos (erro de JavaScript, promessa sem tratamento,
--      service worker e falha de chamada ao Supabase), já agrupados por assinatura (mensagem limpa + arquivo/linha +
--      função). O banco soma num grupo só (tl_erros): quantas vezes, quantos aparelhos, primeira e última vez, versão do
--      app, plataformas e o último "retrato" (aparelho resumido, tela e as 5 últimas ações por rótulo genérico).
--   2. Uso: contadores por dia + evento + plataforma (tl_uso), sem pessoa nem aparelho.
--   3. Painel (Administração › App): só o administrador lê (funções tl142_admin_*), marca erro como resolvido e, ao abrir,
--      roda a limpeza (erros resolvidos há 60 dias, contadores com mais de 180 dias). Não precisa de pg_cron.
--   4. Aviso ao administrador: quando um erro aberto atinge mais de 5 aparelhos em 1 hora, o banco marca o grupo e o app
--      do administrador mostra o aviso na Atividade (notificações dentro do app).
-- Privacidade:
--   - Nada de uid, nome, e-mail, texto digitado, conteúdo de posts ou mensagens, nem URL com dados. O app manda sem a
--     sessão da pessoa (só com a chave publicável), então o banco nem sabe quem é.
--   - O "aparelho" é um número aleatório do próprio aparelho, que a pessoa zera ao desligar; aqui ele vira um resumo
--     (md5), usado só para contar aparelhos afetados e limitar envios (20 lotes por aparelho por dia; teto geral diário).
--   - O banco limpa de novo as mensagens (e-mails, ids, endereços, números longos, textos entre aspas) e aceita só
--     campos curtos e conhecidos. Quem não entrou pode ENVIAR, mas ninguém lê as tabelas direto.
-- O app funciona antes e depois desta versão: sem ela, ele detecta e não manda nada.

-- 1. Tabelas -------------------------------------------------------------------------------------------------------
create table if not exists public.tl_erros (
  id bigserial primary key,
  assinatura text not null unique,
  tipo text not null,
  mensagem text not null,
  local text not null default '',
  funcao text not null default '',
  contagem bigint not null default 0,
  aparelhos int not null default 0,
  primeira timestamptz not null default now(),
  ultima timestamptz not null default now(),
  primeira_versao text not null default '',
  ultima_versao text not null default '',
  plataformas jsonb not null default '{}'::jsonb,
  detalhe jsonb not null default '{}'::jsonb,
  resolvido_em timestamptz,
  resolvido_versao text,
  reaberto boolean not null default false,
  alerta_em timestamptz,
  alerta_n int
);
create index if not exists tl_erros_ultima_idx on public.tl_erros (ultima desc);

create table if not exists public.tl_erros_aparelhos (
  erro bigint not null references public.tl_erros(id) on delete cascade,
  aparelho text not null,
  primeira timestamptz not null default now(),
  ultima timestamptz not null default now(),
  primary key (erro, aparelho)
);
create index if not exists tl_erros_aparelhos_ultima_idx on public.tl_erros_aparelhos (erro, ultima);

create table if not exists public.tl_envios (
  aparelho text not null,
  dia date not null,
  n int not null default 0,
  primary key (aparelho, dia)
);
create index if not exists tl_envios_dia_idx on public.tl_envios (dia);

create table if not exists public.tl_uso (
  dia date not null,
  evento text not null,
  plataforma text not null,
  n bigint not null default 0,
  primary key (dia, evento, plataforma)
);

-- ninguém lê nem grava direto: só pelas funções abaixo
alter table public.tl_erros enable row level security;
alter table public.tl_erros_aparelhos enable row level security;
alter table public.tl_envios enable row level security;
alter table public.tl_uso enable row level security;
revoke all on table public.tl_erros, public.tl_erros_aparelhos, public.tl_envios, public.tl_uso from public, anon, authenticated;
revoke all on sequence public.tl_erros_id_seq from public, anon, authenticated;

-- 2. Limpeza do texto (o app já limpa; aqui de novo) ------------------------------------------------------------------
create or replace function public.tl142_limpa(t text) returns text
language plpgsql immutable set search_path = public as $$
begin
  t := coalesce(t, '');
  t := regexp_replace(t, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}', '<email>', 'g');
  t := regexp_replace(t, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '<id>', 'g');
  t := regexp_replace(t, 'https?://[^ )"'']+', '<url>', 'g');
  t := regexp_replace(t, '"[^"]*[^A-Za-z0-9_."][^"]*"', '"…"', 'g');
  t := regexp_replace(t, '''[^'']*[^A-Za-z0-9_.''][^'']*''', '''…''', 'g');
  t := regexp_replace(t, '[0-9]{4,}', '<n>', 'g');
  t := regexp_replace(t, '[[:cntrl:]]+', ' ', 'g');
  t := btrim(regexp_replace(t, '[[:space:]]+', ' ', 'g'));
  return left(t, 200);
end $$;
revoke all on function public.tl142_limpa(text) from public, anon, authenticated;

-- 3. O app detecta a v15 -------------------------------------------------------------------------------------------
create or replace function public.tl142_ligado() returns boolean
language sql stable security definer set search_path = public as $$ select true $$;
revoke all on function public.tl142_ligado() from public;
grant execute on function public.tl142_ligado() to anon, authenticated;

-- 4. Receber um lote (qualquer um, com limites) ---------------------------------------------------------------------
-- p_lote = {"erros":[{t,m,l,f,n,v,p,b,bv,i,w,s,a}], "uso":[{e,n,p,d}]}
create or replace function public.tl142_registrar(p_aparelho text, p_lote jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  ap text; k int; e jsonb; u jsonb; ne int := 0; nu int := 0;
  v_tipo text; v_msg text; v_loc text; v_fn text; v_n int; v_ver text; v_plat text; v_ass text; v_id bigint;
  v_det jsonb; v_aps int; v_ev text; v_dia date; v_nav text; v_bv int; v_w int; v_tela text;
begin
  if p_aparelho is null or p_aparelho !~ '^[A-Za-z0-9_-]{16,64}$' then return jsonb_build_object('ok', false, 'motivo', 'aparelho'); end if;
  if p_lote is null or jsonb_typeof(p_lote) <> 'object' or octet_length(p_lote::text) > 16000 then return jsonb_build_object('ok', false, 'motivo', 'tamanho'); end if;
  ap := md5('prumo-tl142:' || p_aparelho);
  insert into tl_envios(aparelho, dia, n) values (ap, hoje, 1)
    on conflict (aparelho, dia) do update set n = tl_envios.n + 1 returning n into k;
  if k > 20 then return jsonb_build_object('ok', false, 'motivo', 'limite'); end if;
  if (select coalesce(sum(n), 0) from tl_envios where dia = hoje) > 20000 then return jsonb_build_object('ok', false, 'motivo', 'teto'); end if;

  for e in select x from jsonb_array_elements(case when jsonb_typeof(p_lote -> 'erros') = 'array' then p_lote -> 'erros' else '[]'::jsonb end) with ordinality as t(x, i) order by i limit 10 loop
    continue when jsonb_typeof(e) <> 'object';
    v_tipo := e ->> 't';
    continue when v_tipo is null or v_tipo not in ('js', 'promessa', 'sw', 'supabase');
    v_msg := public.tl142_limpa(left(e ->> 'm', 400));
    continue when v_msg = '';
    v_loc := left(regexp_replace(coalesce(e ->> 'l', ''), '[^A-Za-z0-9_./:<>-]', '', 'g'), 120);
    v_fn := left(regexp_replace(coalesce(e ->> 'f', ''), '[^A-Za-z0-9_$.]', '', 'g'), 60);
    v_n := case when coalesce(e ->> 'n', '') ~ '^[0-9]{1,4}$' then greatest(1, least(50, (e ->> 'n')::int)) else 1 end;
    v_ver := case when coalesce(e ->> 'v', '') ~ '^[0-9a-f]{12}$' then e ->> 'v' else '' end;
    v_plat := case when e ->> 'p' in ('ios', 'android', 'desktop') then e ->> 'p' else 'outro' end;
    v_nav := case when coalesce(e ->> 'b', '') ~ '^[a-z]{1,12}$' then e ->> 'b' else 'outro' end;
    v_bv := case when coalesce(e ->> 'bv', '') ~ '^[0-9]{1,3}$' then (e ->> 'bv')::int else 0 end;
    v_w := case when coalesce(e ->> 'w', '') ~ '^[0-9]{1,4}$' then (e ->> 'w')::int else 0 end;
    v_tela := case when coalesce(e ->> 's', '') ~ '^[a-z0-9_:.-]{1,40}$' then e ->> 's' else '' end;
    v_det := jsonb_build_object('p', v_plat, 'b', v_nav, 'bv', v_bv, 'i', coalesce(e ->> 'i', '') in ('1', 'true'), 'w', v_w, 's', v_tela, 'v', v_ver,
      'a', (select coalesce(jsonb_agg(z.x order by z.i), '[]'::jsonb) from (
              select x, i from jsonb_array_elements_text(case when jsonb_typeof(e -> 'a') = 'array' then e -> 'a' else '[]'::jsonb end) with ordinality as q(x, i)
              where x ~ '^[a-z0-9_:.-]{1,40}$' order by i desc limit 5) z),
      'em', now());
    v_ass := md5(v_tipo || '|' || v_msg || '|' || v_loc || '|' || v_fn);
    insert into tl_erros(assinatura, tipo, mensagem, local, funcao, contagem, primeira_versao, ultima_versao, plataformas, detalhe)
      values (v_ass, v_tipo, v_msg, v_loc, v_fn, v_n, v_ver, v_ver, jsonb_build_object(v_plat, v_n), v_det)
    on conflict (assinatura) do update set
      contagem = tl_erros.contagem + excluded.contagem,
      ultima = now(),
      ultima_versao = case when excluded.ultima_versao <> '' then excluded.ultima_versao else tl_erros.ultima_versao end,
      plataformas = jsonb_set(tl_erros.plataformas, array[v_plat], to_jsonb(coalesce((tl_erros.plataformas ->> v_plat)::bigint, 0) + v_n)),
      detalhe = excluded.detalhe,
      -- resolvido e voltou numa versão diferente da que foi dada como resolvida: reabre
      reaberto = tl_erros.reaberto or (tl_erros.resolvido_em is not null and excluded.ultima_versao is distinct from coalesce(tl_erros.resolvido_versao, '')),
      resolvido_em = case when tl_erros.resolvido_em is not null and excluded.ultima_versao is distinct from coalesce(tl_erros.resolvido_versao, '') then null else tl_erros.resolvido_em end
    returning id into v_id;
    if exists (select 1 from tl_erros_aparelhos where erro = v_id and aparelho = ap) then
      update tl_erros_aparelhos set ultima = now() where erro = v_id and aparelho = ap;
    else
      insert into tl_erros_aparelhos(erro, aparelho) values (v_id, ap);
      update tl_erros set aparelhos = aparelhos + 1 where id = v_id;
    end if;
    -- erro frequente: mais de 5 aparelhos na última hora (um aviso por dia por erro)
    select count(*) into v_aps from tl_erros_aparelhos where erro = v_id and ultima > now() - interval '1 hour';
    if v_aps > 5 then
      update tl_erros set alerta_em = now(), alerta_n = v_aps
       where id = v_id and resolvido_em is null and (alerta_em is null or alerta_em < now() - interval '24 hours');
    end if;
    ne := ne + 1;
  end loop;

  for u in select x from jsonb_array_elements(case when jsonb_typeof(p_lote -> 'uso') = 'array' then p_lote -> 'uso' else '[]'::jsonb end) with ordinality as t(x, i) order by i limit 40 loop
    continue when jsonb_typeof(u) <> 'object';
    v_ev := u ->> 'e';
    continue when v_ev is null or v_ev !~ '^[a-z][a-z0-9_]{1,39}$';
    v_n := case when coalesce(u ->> 'n', '') ~ '^[0-9]{1,4}$' then least(200, (u ->> 'n')::int) else 0 end;
    continue when v_n < 1;
    v_plat := case when u ->> 'p' in ('ios', 'android', 'desktop') then u ->> 'p' else 'outro' end;
    v_dia := case when coalesce(u ->> 'd', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then (u ->> 'd')::date else hoje end;
    if v_dia > hoje or v_dia < hoje - 2 then v_dia := hoje; end if;
    -- teto de nomes de evento por dia (protege contra lixo)
    continue when not exists (select 1 from tl_uso where dia = v_dia and evento = v_ev)
              and (select count(distinct evento) from tl_uso where dia = v_dia) >= 300;
    insert into tl_uso(dia, evento, plataforma, n) values (v_dia, v_ev, v_plat, v_n)
      on conflict (dia, evento, plataforma) do update set n = tl_uso.n + excluded.n;
    nu := nu + 1;
  end loop;
  return jsonb_build_object('ok', true, 'erros', ne, 'uso', nu);
end $$;
revoke all on function public.tl142_registrar(text, jsonb) from public;
grant execute on function public.tl142_registrar(text, jsonb) to anon, authenticated;

-- 5. Painel do administrador ------------------------------------------------------------------------------------------
create or replace function public.tl142_admin_erros() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.e_admin() then raise exception 'so o administrador' using errcode = '42501'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(r) order by (r.resolvido_em is null) desc, r.ultima desc), '[]'::jsonb) from (
    select e.id, e.tipo, e.mensagem, e.local, e.funcao, e.contagem, e.aparelhos, e.primeira, e.ultima, e.primeira_versao, e.ultima_versao,
           e.plataformas, e.detalhe, e.resolvido_em, e.resolvido_versao, e.reaberto, e.alerta_em, e.alerta_n,
           (select count(*) from tl_erros_aparelhos a where a.erro = e.id and a.ultima > now() - interval '1 hour')::int as aparelhos_1h
      from tl_erros e order by (e.resolvido_em is null) desc, e.ultima desc limit 300) r);
end $$;

create or replace function public.tl142_admin_uso(p_dias int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare d int := greatest(1, least(180, coalesce(p_dias, 30))); hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not public.e_admin() then raise exception 'so o administrador' using errcode = '42501'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('dia', u.dia, 'evento', u.evento, 'plataforma', u.plataforma, 'n', u.n) order by u.dia, u.evento, u.plataforma), '[]'::jsonb)
            from tl_uso u where u.dia > hoje - d);
end $$;

create or replace function public.tl142_resolver(p_id bigint, p_resolvido boolean default true) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.e_admin() then raise exception 'so o administrador' using errcode = '42501'; end if;
  if coalesce(p_resolvido, true) then
    update tl_erros set resolvido_em = now(), resolvido_versao = ultima_versao, reaberto = false where id = p_id;
  else
    update tl_erros set resolvido_em = null, resolvido_versao = null where id = p_id;
  end if;
  return found;
end $$;

-- alertas recentes (mais de 5 aparelhos em 1 hora), para a Atividade do administrador
create or replace function public.tl142_alertas() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.e_admin() then raise exception 'so o administrador' using errcode = '42501'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'mensagem', mensagem, 'alerta_em', alerta_em, 'alerta_n', alerta_n) order by alerta_em desc), '[]'::jsonb)
            from tl_erros where alerta_em > now() - interval '3 days' and resolvido_em is null);
end $$;

-- limpeza: o próprio painel chama ao abrir (sem pg_cron)
create or replace function public.tl142_limpar() returns jsonb
language plpgsql security definer set search_path = public as $$
declare a int; b int; c int; d int; hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not public.e_admin() then raise exception 'so o administrador' using errcode = '42501'; end if;
  delete from tl_erros where resolvido_em is not null and resolvido_em < now() - interval '60 days'; get diagnostics a = row_count;
  delete from tl_uso where dia < hoje - 180; get diagnostics b = row_count;
  delete from tl_envios where dia < hoje - 2; get diagnostics c = row_count;
  delete from tl_erros_aparelhos where ultima < now() - interval '90 days'; get diagnostics d = row_count;
  return jsonb_build_object('erros', a, 'uso', b, 'envios', c, 'aparelhos', d);
end $$;

revoke all on function public.tl142_admin_erros(), public.tl142_admin_uso(int), public.tl142_resolver(bigint, boolean), public.tl142_alertas(), public.tl142_limpar() from public, anon;
grant execute on function public.tl142_admin_erros(), public.tl142_admin_uso(int), public.tl142_resolver(bigint, boolean), public.tl142_alertas(), public.tl142_limpar() to authenticated;
