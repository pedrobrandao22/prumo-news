-- =====================================================================================================================
-- Prumo News · proposta de 17/11/2026: modelo social "só seguir" (como Instagram/X). Não existem mais amigos,
-- pedidos de amizade nem Melhores amigos.
-- =====================================================================================================================
--
-- COMO RODAR (passo a passo, uma vez só):
--   1. Abra o Supabase do Prumo › menu da esquerda "SQL Editor" › botão "New query".
--   2. Copie TUDO deste arquivo (do começo ao fim), cole na caixa e clique em "Run" (ou Ctrl+Enter).
--   3. Espere aparecer "Success. No rows returned". Pronto. Não precisa rodar mais nada.
--   Pode rodar de novo sem problema (o script é idempotente: a conversão das amizades e dos públicos só acontece
--   na primeira vez, e o que ela muda fica guardado em três tabelas de cópia, ver "Como desfazer" no fim).
--   Rodar DEPOIS de todas as versões anteriores (v1 a v15, seguranca-2026-11-09 e as propostas de 15/11 e 16/11).
--   Se alguma versão antiga (v7, v8, v9, v10, v11 ou v14) for rodada de novo depois desta, rode esta outra vez.
--
-- O app novo funciona antes e depois deste SQL: sem ele, fica tudo como hoje (amigos, Melhores amigos, perfil aberto
-- opcional). Assim que o SQL roda, o app percebe sozinho (função seguir_estado) e passa para o "só seguir".
--
-- O QUE MUDA, em linguagem simples:
--   1. Perfil aberto ou fechado. Quem não escolhe fica ABERTO (antes o padrão era fechado). Na primeira vez que este
--      SQL roda, TODOS os perfis ficam abertos (antes ninguém tinha escolhido "fechado": era só o padrão). Quem quiser
--      fecha em Ajustes do app › Privacidade › "Perfil fechado". (A confirmar com o Pedro; ver "Como desfazer".)
--   2. Perfil aberto: qualquer membro segue na hora, vê o perfil e os posts, curte, comenta, menciona, reposta e
--      manda mensagem.
--   3. Perfil fechado: "Seguir" vira um PEDIDO, que o dono aprova ou recusa (tabela seguir_pedidos). Quem não segue
--      vê nome, foto e os números (seguidores/seguindo), mas não vê os posts, não interage com eles, não manda
--      mensagem e não vê as listas de seguidores/seguindo. (Exceção: dá para RESPONDER uma conversa que a pessoa do
--      perfil fechado começou.) Ao abrir o perfil, os pedidos que estavam esperando viram "seguindo" sozinhos.
--   4. Posts e giros: no perfil aberto vão para todos os membros; no fechado, só para os seguidores. Não existe mais
--      "Melhores amigos": o que era só para eles passa a ser só para seguidores.
--   5. Colunas: vão para todos por padrão, mesmo no perfil fechado; a autora pode marcar "Só para quem me segue".
--      Coluna "para todos" de perfil fechado: qualquer membro vê, curte e comenta. "Só seguidores": só os seguidores.
--      As colunas que JÁ existem continuam com o mesmo público de hoje: as "para amigos" viram "só para quem me segue"
--      (os amigos viraram seguidores, então quem lia continua lendo). O link público ("Todos (link público)") não muda.
--   6. Na mudança: toda amizade vira seguir dos dois lados; pedido de amizade que estava esperando vira "seguir"
--      (quem pediu passa a seguir; como os perfis ficam abertos, entra direto).
--   7. Convite: quem entra por convite começa seguindo quem convidou e sendo seguido por essa pessoa (antes: amizade).
--      O mesmo vale para o link de convite aberto por quem já é membro.
--   8. Todo membro aparece para todo membro na busca de pessoas (nome e foto), menos quem bloqueou você.
--   9. Avisos no celular: "Fulano pediu para seguir você" (tipo "Novos seguidores"); posts e colunas avisam quem
--      segue e pode ver. Ninguém recebe aviso pelas conversões do passo 6.
--  10. As funções antigas de amizade (pedir_amizade, responder_amizade, desfazer_amizade) continuam existindo para a
--      versão antiga do app que ainda estiver aberta em algum celular, mas agora fazem "seguir"/"aprovar"/"deixar de
--      seguir". A tabela amizades fica vazia (a cópia fica em so_seguir_copia_amizades).
-- =====================================================================================================================

-- ---------- 0. cópias do que a conversão muda (para desfazer, se o Pedro quiser) ----------
create table if not exists public.so_seguir_copia_amizades (
  de uuid not null, para uuid not null, status text, criado_em timestamptz, copiado_em timestamptz not null default now(),
  primary key (de, para));
create table if not exists public.so_seguir_copia_perfis (
  uid uuid primary key, perfil_aberto boolean, copiado_em timestamptz not null default now());
create table if not exists public.so_seguir_copia_publico (
  id uuid primary key, publico text, copiado_em timestamptz not null default now());
alter table public.so_seguir_copia_amizades enable row level security;
alter table public.so_seguir_copia_perfis enable row level security;
alter table public.so_seguir_copia_publico enable row level security;
revoke all on public.so_seguir_copia_amizades, public.so_seguir_copia_perfis, public.so_seguir_copia_publico from anon, authenticated;

-- ---------- 1. pedidos para seguir perfil fechado ----------
create table if not exists public.seguir_pedidos (
  de uuid not null references public.membros(uid) on delete cascade,     -- quem pediu
  para uuid not null references public.membros(uid) on delete cascade,   -- dono do perfil fechado
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (de, para),
  check (de <> para)
);
create index if not exists seguir_pedidos_para_idx on public.seguir_pedidos(para, at desc);
alter table public.seguir_pedidos enable row level security;
drop policy if exists sp_ler on public.seguir_pedidos;
create policy sp_ler on public.seguir_pedidos for select to authenticated using (de = auth.uid() or para = auth.uid());
revoke all on public.seguir_pedidos from anon, authenticated;
grant select on public.seguir_pedidos to authenticated;   -- pedir, aprovar e cancelar só pelas funções do passo 4

-- perfil aberto passa a ser o padrão de quem entra
alter table public.membros alter column perfil_aberto set default true;

-- ---------- 2. a conversão (só na primeira vez: marcada em config_app) ----------
do $$
declare feito boolean := exists (select 1 from public.config_app where chave = 'so_seguir_convertido');
begin
  if feito then return; end if;
  -- perfis: todos abertos (cópia antes)
  insert into public.so_seguir_copia_perfis(uid, perfil_aberto) select uid, perfil_aberto from public.membros on conflict do nothing;
  update public.membros set perfil_aberto = true where not perfil_aberto and excluido_em is null;
  -- amizades viram seguir dos dois lados; pedido esperando vira seguir de quem pediu (sem avisos no celular)
  insert into public.so_seguir_copia_amizades(de, para, status, criado_em) select de, para, status, criado_em from public.amizades on conflict do nothing;
  alter table public.seguidores disable trigger user;
  insert into public.seguidores(seguidor, seguido)
    select a.de, a.para from public.amizades a where a.status in ('aceita', 'pendente')
    union select a.para, a.de from public.amizades a where a.status = 'aceita'
    on conflict do nothing;
  alter table public.seguidores enable trigger user;
  delete from public.seguidores s where exists (select 1 from public.bloqueios b where (b.de = s.seguidor and b.para = s.seguido) or (b.de = s.seguido and b.para = s.seguidor))
    or exists (select 1 from public.membros m where m.uid in (s.seguidor, s.seguido) and m.excluido_em is not null);
  delete from public.amizades;
  -- públicos: amigos/Melhores amigos viram "seguidores" (nos posts: regra do perfil; nas colunas: só quem segue)
  insert into public.so_seguir_copia_publico(id, publico) select id, publico from public.publicacoes where publico in ('amigos', 'proximos') on conflict do nothing;
  alter table public.publicacoes disable trigger user;
  update public.publicacoes set publico = 'seguidores' where publico in ('amigos', 'proximos');
  alter table public.publicacoes enable trigger user;
  insert into public.config_app(chave, valor) values ('so_seguir_convertido', jsonb_build_object('em', now())) on conflict (chave) do nothing;
end $$;

-- ---------- 3. regras de base: quem segue quem, quem vê quem ----------
-- a segue b?
create or replace function public.ss_segue(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select a is not null and b is not null and exists (select 1 from public.seguidores s where s.seguidor = a and s.seguido = b)
$$;
-- o autor está ativo e ninguém bloqueou ninguém?
create or replace function public.ss_livre(quem uuid, autor uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select quem is not null and autor is not null
    and exists (select 1 from public.membros m where m.uid = autor and m.suspenso_em is null and m.excluido_em is null)
    and not exists (select 1 from public.bloqueios b where (b.de = quem and b.para = autor) or (b.de = autor and b.para = quem))
$$;
-- quem vê o que o autor publica para seguidores (e interage com ele)? perfil aberto, ou quem segue
create or replace function public.ss_ve(quem uuid, autor uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select quem is not null and autor is not null and (quem = autor or (public.ss_livre(quem, autor)
    and (coalesce((select m.perfil_aberto from public.membros m where m.uid = autor), true) or public.ss_segue(quem, autor))))
$$;
-- uma publicação: coluna "para todos" (ou com link público) vai para todos; coluna "só seguidores", só para quem segue;
-- post e giro seguem a regra do perfil
create or replace function public.ss_ve_pub(quem uuid, autor uuid, p_publico text, p_coluna boolean) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when quem is not null and quem = autor then true
    when not public.ss_livre(quem, autor) then false
    when coalesce(p_coluna, false) and p_publico in ('todos', 'publico') then true
    when coalesce(p_coluna, false) and p_publico = 'seguidores' then public.ss_segue(quem, autor)
    else public.ss_ve(quem, autor) end
$$;
revoke all on function public.ss_segue(uuid, uuid), public.ss_livre(uuid, uuid), public.ss_ve(uuid, uuid), public.ss_ve_pub(uuid, uuid, text, boolean) from public, anon, authenticated;
-- as mesmas, para quem está logado (são as que as regras de leitura chamam)
create or replace function public.ss_ve_eu(autor uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$ select public.ss_ve(auth.uid(), autor) $$;
create or replace function public.ss_ve_pub_eu(autor uuid, p_publico text, p_coluna boolean) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$ select public.ss_ve_pub(auth.uid(), autor, p_publico, p_coluna) $$;
-- mandar mensagem: perfil aberto, quem segue, ou responder a quem começou a conversa
create or replace function public.ss_pode_msg(p_para uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and public.e_membro() and public.ss_livre(auth.uid(), p_para)
    and (public.ss_ve(auth.uid(), p_para) or exists (select 1 from public.mensagens x where x.de = p_para and x.para = auth.uid()))
$$;
revoke all on function public.ss_ve_eu(uuid), public.ss_ve_pub_eu(uuid, text, boolean), public.ss_pode_msg(uuid) from public, anon;
grant execute on function public.ss_ve_eu(uuid), public.ss_ve_pub_eu(uuid, text, boolean), public.ss_pode_msg(uuid) to authenticated;

-- "sao_amigos" continua com o nome antigo (várias regras chamam), mas agora quer dizer:
-- "a pessoa logada (uma das duas) pode ver e interagir com a outra" = perfil aberto ou ela segue.
-- Vale para: curtidas/comentários das notícias (documentos sociais), listas a dois, destaques, curtir comentário,
-- denunciar e os reposts da Atividade.
create or replace function public.sao_amigos(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select a is not null and b is not null and auth.uid() in (a, b)
    and public.ss_ve(auth.uid(), case when a = auth.uid() then b else a end)
$$;
-- quem aparece para quem: todo membro ativo para todo membro (menos quem bloqueou você). Conta suspensa ou excluída
-- só aparece para quem conversou com ela ou tem convite com ela (para mostrar "Conta excluída" nas conversas).
create or replace function public.pode_ver_membro(m uuid) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null then return false; end if;
  if m = me then return true; end if;
  if not public.e_membro() then return false; end if;
  if public.e_admin() then return true; end if;
  if exists (select 1 from bloqueios where de = m and para = me) then return false; end if;
  if exists (select 1 from mensagens where (de = me and para = m) or (de = m and para = me)) then return true; end if;
  if exists (select 1 from membros where (uid = m and convidado_por = me) or (uid = me and convidado_por = m)) then return true; end if;
  return exists (select 1 from membros where uid = m and suspenso_em is null and excluido_em is null);
end $$;
-- quem segue (ativo, sem bloqueio) — usado pelas funções da v9 a v14
create or replace function public.ve_como_seguidor(p_autor uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.ss_livre(auth.uid(), p_autor) and public.ss_segue(auth.uid(), p_autor)
$$;

-- ---------- 4. seguir, pedir, aprovar ----------
create or replace function public.seguir(p_uid uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); agora bigint := (extract(epoch from now())*1000)::bigint; ab boolean;
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if p_uid is null or p_uid = me then raise exception 'pedido invalido' using errcode = '22023'; end if;
  if exists (select 1 from seguidores where seguidor = me and seguido = p_uid) then return 'ja'; end if;
  if not public.ss_livre(me, p_uid) then raise exception 'pedido invalido' using errcode = '22023'; end if;
  if (select count(*) from seguidores where seguidor = me and at > agora - 86400000)
     + (select count(*) from seguir_pedidos where de = me and at > agora - 86400000) >= 100 then
    raise exception 'seguir demais' using errcode = '54000';
  end if;
  select coalesce(perfil_aberto, true) into ab from membros where uid = p_uid;
  if ab then
    insert into seguidores(seguidor, seguido, at) values (me, p_uid, agora) on conflict do nothing;
    delete from seguir_pedidos where de = me and para = p_uid;
    return 'ok';
  end if;
  insert into seguir_pedidos(de, para, at) values (me, p_uid, agora) on conflict do nothing;
  return 'pedido';
end $$;
-- deixar de seguir (ou cancelar o pedido)
create or replace function public.deixar_de_seguir(p_uid uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'sem login' using errcode = '28000'; end if;
  delete from seguidores where seguidor = auth.uid() and seguido = p_uid;
  delete from seguir_pedidos where de = auth.uid() and para = p_uid;
end $$;
-- o dono do perfil fechado aprova (vira seguidor) ou recusa (o pedido some; a pessoa pode pedir de novo depois)
create or replace function public.seguir_responder(p_uid uuid, p_aceitar boolean) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if not exists (select 1 from seguir_pedidos where de = p_uid and para = me) then return 'sem_pedido'; end if;
  delete from seguir_pedidos where de = p_uid and para = me;
  if coalesce(p_aceitar, false) and public.ss_livre(me, p_uid) then
    insert into seguidores(seguidor, seguido) values (p_uid, me) on conflict do nothing;
    return 'aceito';
  end if;
  return 'recusado';
end $$;
-- abrir ou fechar o perfil; ao abrir, quem estava esperando passa a seguir
create or replace function public.mudar_perfil_aberto(p_aberto boolean) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); v boolean := coalesce(p_aberto, true);
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  update public.membros set perfil_aberto = v where uid = me;
  if v then
    insert into seguidores(seguidor, seguido) select p.de, me from seguir_pedidos p where p.para = me and public.ss_livre(me, p.de) on conflict do nothing;
    delete from seguir_pedidos where para = me;
  end if;
  return v;
end $$;
-- tudo o que o app precisa saber de uma vez (e é por ela que o app descobre que este SQL foi rodado)
create or replace function public.seguir_estado() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  return jsonb_build_object('v', 1,
    'aberto', coalesce((select perfil_aberto from membros where uid = me), true),
    'enviados', coalesce((select jsonb_agg(p.para) from seguir_pedidos p where p.de = me), '[]'::jsonb),
    'recebidos', coalesce((select jsonb_agg(jsonb_build_object('uid', m.uid, 'nome', m.nome, 'foto', m.foto, 'at', p.at) order by p.at desc)
                           from seguir_pedidos p join membros m on m.uid = p.de
                           where p.para = me and public.ss_livre(me, p.de)), '[]'::jsonb),
    'fechados', coalesce((select jsonb_agg(m.uid) from membros m where not m.perfil_aberto and m.uid <> me
                           and m.suspenso_em is null and m.excluido_em is null), '[]'::jsonb));
end $$;
revoke all on function public.seguir(uuid), public.deixar_de_seguir(uuid), public.seguir_responder(uuid, boolean),
  public.mudar_perfil_aberto(boolean), public.seguir_estado(), public.ve_como_seguidor(uuid) from public, anon;
grant execute on function public.seguir(uuid), public.deixar_de_seguir(uuid), public.seguir_responder(uuid, boolean),
  public.mudar_perfil_aberto(boolean), public.seguir_estado(), public.ve_como_seguidor(uuid) to authenticated;

-- as funções antigas de amizade (versão antiga do app ainda aberta): passam a seguir/aprovar/deixar de seguir
create or replace function public.pedir_amizade(p_uid uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin return case public.seguir(p_uid) when 'pedido' then 'pendente' else 'aceita' end; end $$;
create or replace function public.responder_amizade(p_uid uuid, p_aceitar boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin perform public.seguir_responder(p_uid, p_aceitar); end $$;
create or replace function public.desfazer_amizade(p_uid uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin perform public.deixar_de_seguir(p_uid); end $$;

-- ---------- 5. números e listas de seguidores ----------
-- as listas: a própria pessoa; ou perfil aberto; ou quem segue (sem bloqueio, conta ativa)
create or replace function public.seguidores_pode_listar(p_uid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and p_uid is not null and public.e_membro() and public.ss_ve(auth.uid(), p_uid)
$$;
-- os números aparecem sempre (também no perfil fechado); "lista" diz se dá para abrir as listas
create or replace function public.seguidores_contagem(p_uid uuid) returns json
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if p_uid <> me and not public.ss_livre(me, p_uid) then return json_build_object('ok', false); end if;
  return json_build_object('ok', true, 'lista', public.seguidores_pode_listar(p_uid), 'aberto', public.seg11_aberto(p_uid), 'amigo', false,
    'seguidores', (select count(*) from public.seguidores s join public.membros x on x.uid = s.seguidor
                    where s.seguido = p_uid and x.suspenso_em is null and x.excluido_em is null
                      and not exists (select 1 from public.bloqueios b where (b.de = x.uid and b.para = me) or (b.de = me and b.para = x.uid))),
    'seguindo', (select count(*) from public.seguidores s join public.membros x on x.uid = s.seguido
                  where s.seguidor = p_uid and x.suspenso_em is null and x.excluido_em is null
                    and not exists (select 1 from public.bloqueios b where (b.de = x.uid and b.para = me) or (b.de = me and b.para = x.uid))),
    'sigo', exists (select 1 from public.seguidores where seguidor = me and seguido = p_uid),
    'pedido', exists (select 1 from public.seguir_pedidos where de = me and para = p_uid),
    'me_segue', exists (select 1 from public.seguidores where seguidor = p_uid and seguido = me));
end $$;
-- a versão da v9 (o app usa as duas): mesmas regras
create or replace function public.seg_contagem(p_uid uuid) returns json
language sql stable security definer set search_path = public, pg_temp as $$ select public.seguidores_contagem(p_uid) $$;
create or replace function public.seg_lista(p_uid uuid, p_tipo text) returns table(uid uuid, nome text, foto text, aberto boolean, at bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if not public.seguidores_pode_listar(p_uid) then return; end if;
  return query select l.uid, l.nome, l.foto, l.aberto, l.at from public.seguidores_lista(p_uid, case when p_tipo = 'seguindo' then 'seguindo' else 'seguidores' end) l;
end $$;
-- busca de pessoas: todo membro ativo (aberto ou fechado), menos quem bloqueou ou foi bloqueado
create or replace function public.perfis_abertos(p_busca text default '') returns table(uid uuid, nome text, foto text, sigo boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select m.uid, m.nome, m.foto, exists (select 1 from seguidores s where s.seguidor = auth.uid() and s.seguido = m.uid)
  from membros m
  where public.e_membro() and m.uid <> auth.uid() and public.ss_livre(auth.uid(), m.uid)
    and (btrim(coalesce(p_busca, '')) = '' or position(lower(btrim(p_busca)) in lower(m.nome)) > 0)
  order by m.nome
  limit 30
$$;
revoke all on function public.seguidores_pode_listar(uuid), public.seguidores_contagem(uuid), public.seg_contagem(uuid), public.seg_lista(uuid, text), public.perfis_abertos(text) from public, anon;
grant execute on function public.seguidores_pode_listar(uuid), public.seguidores_contagem(uuid), public.seg_contagem(uuid), public.seg_lista(uuid, text), public.perfis_abertos(text) to authenticated;

-- ---------- 6. quem lê as publicações ----------
alter table public.publicacoes drop constraint if exists publicacoes_publico_chk;
alter table public.publicacoes add constraint publicacoes_publico_chk check (publico in ('amigos','proximos','seguidores','publico','todos'));
-- o público gravado: post e giro são sempre "seguidores" (vale a regra do perfil); coluna é "todos" (padrão),
-- "seguidores" (só quem segue) ou "publico" (link aberto). A versão antiga do app manda "amigos"/"proximos": vira isso.
create or replace function public.pub_ss_publico() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare col boolean := new.tipo = 'post' and new.estilo is not null and jsonb_typeof(new.estilo -> 'coluna') = 'object';
begin
  if tg_op = 'UPDATE' and new.publico is not distinct from old.publico then return new; end if;
  if col then
    if new.publico in ('amigos', 'proximos') then new.publico := 'todos'; end if;
  elsif new.publico in ('amigos', 'proximos', 'todos') then new.publico := 'seguidores';
  end if;
  return new;
end $$;
drop trigger if exists pub_ss_publico on public.publicacoes;
create trigger pub_ss_publico before insert or update on public.publicacoes for each row execute function public.pub_ss_publico();
revoke all on function public.pub_ss_publico() from public, anon, authenticated;
alter table public.publicacoes alter column publico set default 'seguidores';

-- a regra de leitura (as restritivas de arquivado e de agendada continuam valendo)
drop policy if exists pub_ler on public.publicacoes;
create policy pub_ler on public.publicacoes for select to authenticated using (
  public.e_membro()
  and (autor = auth.uid() or public.ss_ve_pub_eu(autor, publico, tipo = 'post' and estilo is not null and jsonb_typeof(estilo -> 'coluna') = 'object'))
  and (tipo <> 'story' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint
       or exists (select 1 from public.destaques d where d.dono = publicacoes.autor and publicacoes.id = any(d.itens))));
drop policy if exists pub_ler_publica on public.publicacoes;   -- a regra acima já cobre a coluna com link público

-- a autora muda o "quem pode ler" de uma coluna: 'todos', 'seguidores' ou 'publico' ('amigos' = 'todos')
create or replace function public.coluna_mudar_publico(p_id uuid, p_publico text) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); p public.publicacoes; v text := coalesce(p_publico, '');
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  if v = 'amigos' then v := 'todos'; end if;
  if v not in ('publico', 'todos', 'seguidores') then raise exception 'publico invalido' using errcode = '22023'; end if;
  select * into p from public.publicacoes where id = p_id;
  if p.id is null or p.autor <> me then raise exception 'so a autora muda' using errcode = '42501'; end if;
  if jsonb_typeof(p.estilo -> 'coluna') is distinct from 'object' then raise exception 'so coluna pode ser publica' using errcode = '22023'; end if;
  update public.publicacoes set publico = v where id = p_id;
  return v;
end $$;
revoke all on function public.coluna_mudar_publico(uuid, text) from public, anon;
grant execute on function public.coluna_mudar_publico(uuid, text) to authenticated;

-- ---------- 7. mensagens ----------
drop policy if exists msg_enviar on public.mensagens;
create policy msg_enviar on public.mensagens for insert to authenticated with check (
  de = auth.uid() and public.e_membro() and public.ss_pode_msg(para));

-- ---------- 8. convite: começa seguindo quem convidou e sendo seguido ----------
create or replace function public.entrar(p_codigo text, p_nome text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); cv record; n text := btrim(coalesce(p_nome,''));
begin
  if me is null then raise exception 'sem login' using errcode = '28000'; end if;
  if exists(select 1 from membros where uid = me) then return jsonb_build_object('ok', true, 'ja', true); end if;
  if char_length(n) < 1 or char_length(n) > 40 then raise exception 'nome invalido' using errcode = '22023'; end if;
  lock table membros in share row exclusive mode;
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
  insert into seguidores(seguidor, seguido) values (me, cv.criado_por), (cv.criado_por, me) on conflict do nothing;
  return jsonb_build_object('ok', true, 'amigo', cv.criado_por);
end $$;
create or replace function public.convite_amizade(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); cv record;
begin
  if not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  select * into cv from convites where codigo = upper(btrim(coalesce(p_codigo,''))) for update;
  if found and cv.usado_por = me then return jsonb_build_object('ok', true, 'ja', true, 'usado', true, 'amigo', cv.criado_por); end if;
  if not found or cv.usado_em is not null or cv.expira_em < now() then return jsonb_build_object('ok', false, 'motivo', 'invalido'); end if;
  if cv.criado_por = me then return jsonb_build_object('ok', false, 'motivo', 'proprio'); end if;
  if not public.ss_livre(me, cv.criado_por) then return jsonb_build_object('ok', false, 'motivo', 'invalido'); end if;
  if public.ss_segue(me, cv.criado_por) and public.ss_segue(cv.criado_por, me) then
    return jsonb_build_object('ok', true, 'ja', true, 'amigo', cv.criado_por);
  end if;
  update convites set usado_por = me, usado_em = now() where codigo = cv.codigo;
  insert into seguidores(seguidor, seguido) values (me, cv.criado_por), (cv.criado_por, me) on conflict do nothing;
  delete from seguir_pedidos where (de = me and para = cv.criado_por) or (de = cv.criado_por and para = me);
  return jsonb_build_object('ok', true, 'amigo', cv.criado_por);
end $$;
revoke all on function public.convite_amizade(text) from public, anon;
grant execute on function public.convite_amizade(text) to authenticated;

-- ---------- 9. limpeza: bloquear e excluir a conta apagam os pedidos ----------
create or replace function public.ss_limpa_pedidos() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_table_name = 'bloqueios' then
    delete from public.seguir_pedidos where (de = new.de and para = new.para) or (de = new.para and para = new.de);
  else
    delete from public.seguir_pedidos where de = new.uid or para = new.uid;
  end if;
  return null;
end $$;
drop trigger if exists ss_limpa_pedidos on public.bloqueios;
create trigger ss_limpa_pedidos after insert on public.bloqueios for each row execute function public.ss_limpa_pedidos();
drop trigger if exists ss_limpa_pedidos on public.membros;
create trigger ss_limpa_pedidos after update of excluido_em on public.membros
  for each row when (new.excluido_em is not null and old.excluido_em is null) execute function public.ss_limpa_pedidos();
revoke all on function public.ss_limpa_pedidos() from public, anon, authenticated;

-- ---------- 10. avisos no celular (v10) com as regras novas ----------
create or replace function public.push_pode_ver(p_quem uuid, p_autor uuid, p_publico text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.ss_ve_pub(p_quem, p_autor, p_publico, false)
$$;
create or replace function public.push_ve_pub(p_quem uuid, p_pub uuid) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare j jsonb;
begin
  select to_jsonb(p) into j from public.publicacoes p where p.id = p_pub;
  if j is null then return false; end if;
  if (j->>'autor')::uuid = p_quem then return true; end if;
  if coalesce(j->>'arquivado', 'false') = 'true' then return false; end if;
  if j->>'tipo' = 'story' and coalesce((j->>'expira')::bigint, 0) <= (extract(epoch from now())*1000)::bigint then return false; end if;
  return public.ss_ve_pub(p_quem, (j->>'autor')::uuid, j->>'publico', j->>'tipo' = 'post' and jsonb_typeof(j->'estilo'->'coluna') = 'object');
end $$;
-- "Fulano também comentou": só para quem segue quem comentou
create or replace function public.push_t_docs_comentarios() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
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
              where d.col = 'comentarios' and d.owner is not null and d.owner <> new.owner
                and public.ss_segue(d.owner, new.owner) and public.ss_livre(d.owner, new.owner)
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
-- pedido para seguir: aviso para o dono do perfil fechado (tipo "Novos seguidores")
create or replace function public.push_t_seguir_pedidos() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    perform public.push_enfileirar(new.para, 'seguidores', new.de, 'seg-pedido', public.push_nome(new.de) || ' pediu para seguir você', 'Toque para aprovar ou recusar.', '?nt=perfil:' || new.para);
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_seguir_pedidos on public.seguir_pedidos;
create trigger push_t_seguir_pedidos after insert on public.seguir_pedidos for each row execute function public.push_t_seguir_pedidos();
revoke all on function public.push_pode_ver(uuid, uuid, text), public.push_ve_pub(uuid, uuid), public.push_t_docs_comentarios(),
  public.push_t_seguir_pedidos() from public, anon, authenticated;

-- =====================================================================================================================
-- COMO DESFAZER (só se o Pedro pedir; rodar à mão, uma linha de cada vez):
--   * voltar os perfis como eram:   update public.membros m set perfil_aberto = c.perfil_aberto from public.so_seguir_copia_perfis c where c.uid = m.uid;
--   * fechar só alguém:             update public.membros set perfil_aberto = false where nome = 'Nome da pessoa';
--   * voltar as amizades:           insert into public.amizades(de, para, status, criado_em) select de, para, status, criado_em from public.so_seguir_copia_amizades on conflict do nothing;
--   * voltar os públicos dos posts: update public.publicacoes p set publico = c.publico from public.so_seguir_copia_publico c where c.id = p.id;
--   (e rodar de novo as versões v9, v11 e v14 para as regras de leitura antigas)
-- =====================================================================================================================
