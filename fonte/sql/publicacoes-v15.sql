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
