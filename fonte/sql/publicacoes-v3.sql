-- Prumo News · Publicações v3: proteções do servidor — pode rodar mais de uma vez.
-- 1) A data da publicação e o fim do story são definidos pelo servidor (ninguém fixa post no topo nem faz story eterno).
-- 2) Fotos e vídeo de uma publicação têm de estar na pasta do próprio autor.
-- 3) Fotos e vídeos só podem ser abertos por quem pode ver a publicação (Melhores amigos e stories vencidos incluídos).
-- 4) Mais espaço para as configurações das publicações. 5) Link de convite também funciona para quem já é membro.
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

-- ---------- quem pode abrir cada arquivo ----------
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
