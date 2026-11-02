-- Prumo News · Publicações v2: Melhores Amigos e vídeos (stories e Reels) — pode rodar mais de uma vez.

-- ---------- Melhores Amigos ----------
create table if not exists public.melhores_amigos (
  dono uuid not null references public.membros(uid) on delete cascade,
  amigo uuid not null references public.membros(uid) on delete cascade,
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (dono, amigo)
);
alter table public.melhores_amigos enable row level security;
drop policy if exists ma_ler on public.melhores_amigos;
create policy ma_ler on public.melhores_amigos for select to authenticated using (dono = auth.uid() or amigo = auth.uid());
drop policy if exists ma_por on public.melhores_amigos;
create policy ma_por on public.melhores_amigos for insert to authenticated with check (
  dono = auth.uid() and public.e_membro() and public.sao_amigos(auth.uid(), amigo));
drop policy if exists ma_tirar on public.melhores_amigos;
create policy ma_tirar on public.melhores_amigos for delete to authenticated using (dono = auth.uid());
revoke all on public.melhores_amigos from anon, authenticated;
grant select, insert, delete on public.melhores_amigos to authenticated;

-- quem vê cada publicação: todos os amigos ou só os Melhores Amigos
alter table public.publicacoes add column if not exists publico text not null default 'amigos';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'publicacoes_publico_chk') then
    alter table public.publicacoes add constraint publicacoes_publico_chk check (publico in ('amigos','proximos'));
  end if;
end $$;
-- (se a v5 já foi rodada, a regra dela, com os destaques, é mais nova: não volta para esta)
do $v2$ begin
  if to_regclass('public.destaques') is null then
    drop policy if exists pub_ler on public.publicacoes;
    create policy pub_ler on public.publicacoes for select to authenticated using (
      public.e_membro() and (autor = auth.uid() or (public.sao_amigos(auth.uid(), autor)
        and (publico = 'amigos' or exists (select 1 from public.melhores_amigos m where m.dono = autor and m.amigo = auth.uid()))))
      and (tipo <> 'story' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint));
  end if;
end $v2$;

-- ---------- vídeos (pasta privada de cada membro, como as fotos) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', false, 15728640, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = 15728640, allowed_mime_types = array['video/mp4','video/webm','video/quicktime'];

-- (se a v3 já foi rodada, a regra dela, presa às publicações que você pode ver, é mais segura: não volta para esta)
do $v2$ begin
  if to_regprocedure('public.convite_amizade(text)') is null then
    drop policy if exists videos_ler on storage.objects;
    create policy videos_ler on storage.objects for select to authenticated using (
      bucket_id = 'videos' and public.e_membro()
      and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
      and ((storage.foldername(name))[1] = auth.uid()::text
           or public.sao_amigos(auth.uid(), ((storage.foldername(name))[1])::uuid)));
  end if;
end $v2$;
drop policy if exists videos_enviar on storage.objects;
create policy videos_enviar on storage.objects for insert to authenticated with check (
  bucket_id = 'videos' and public.e_membro() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists videos_apagar on storage.objects;
create policy videos_apagar on storage.objects for delete to authenticated using (
  bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
