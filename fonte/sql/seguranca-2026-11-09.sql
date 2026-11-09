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
