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
