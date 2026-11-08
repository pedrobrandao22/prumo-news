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
