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
drop policy if exists fotos_ler on storage.objects;
create policy fotos_ler on storage.objects for select to authenticated using (
  bucket_id = 'fotos' and public.e_membro()
  and ((storage.foldername(name))[1] = auth.uid()::text
       or exists (select 1 from public.publicacoes p where p.fotos ? storage.objects.name)));
drop policy if exists videos_ler on storage.objects;
create policy videos_ler on storage.objects for select to authenticated using (
  bucket_id = 'videos' and public.e_membro()
  and ((storage.foldername(name))[1] = auth.uid()::text
       or exists (select 1 from public.publicacoes p where p.estilo->>'video' = storage.objects.name)));
