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

-- nome único no Prumo (sem diferença de maiúsculas e espaços nas pontas)
create unique index if not exists membros_nome_unico on public.membros (lower(btrim(nome)));

-- ---------- funções de apoio ----------
create or replace function public.e_membro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.membros where uid = auth.uid())
$$;

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
    insert into membros(uid, nome) values (me, n);
    return jsonb_build_object('ok', true, 'fundador', true);
  end if;
  select * into cv from convites where codigo = upper(btrim(coalesce(p_codigo,''))) for update;
  if not found or cv.usado_em is not null then raise exception 'convite invalido' using errcode = '22023'; end if;
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
  if (select count(*) from convites where criado_por = me and usado_por is null) >= 20 then
    raise exception 'convites demais em aberto' using errcode = '54000';
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
  if exists(select 1 from amizades where de = p_uid and para = me) then
    update amizades set status = 'aceita' where de = p_uid and para = me;
    return 'aceita';
  end if;
  insert into amizades(de, para) values (me, p_uid) on conflict do nothing;
  return (select status from amizades where de = me and para = p_uid);
end $$;

create or replace function public.responder_amizade(p_uid uuid, p_aceitar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if p_aceitar then
    update amizades set status = 'aceita' where de = p_uid and para = me;
  else
    delete from amizades where de = p_uid and para = me and status = 'pendente';
  end if;
end $$;

create or replace function public.desfazer_amizade(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  delete from amizades where (de = me and para = p_uid) or (de = p_uid and para = me);
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
  delete from public.mensagens where de = me or para = me;
  delete from public.erros where uid = me;
  delete from public.amizades where de = me or para = me;
  delete from public.convites where criado_por = me;
  delete from public.membros where uid = me;
  delete from auth.users where id = me;
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
create policy membros_ler on public.membros for select to authenticated using (public.e_membro());
drop policy if exists membros_nome on public.membros;
create policy membros_nome on public.membros for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());

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

-- ---------- permissões ----------
revoke all on public.membros, public.convites, public.amizades, public.docs, public.mensagens, public.erros from anon, authenticated;
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
