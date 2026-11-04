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
