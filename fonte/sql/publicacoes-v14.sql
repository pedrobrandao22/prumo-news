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
