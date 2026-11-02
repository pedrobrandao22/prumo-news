-- Prumo News · Publicações dos membros (posts no Feed e stories de 24 h) — pode rodar mais de uma vez.
-- Quem vê: só o autor e os amigos dele (as mesmas regras de curtidas e comentários).

-- ---------- tabela das publicações ----------
create table if not exists public.publicacoes (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null references public.membros(uid) on delete cascade,
  tipo text not null check (tipo in ('post','story')),
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  expira bigint,
  texto text not null default '' check (char_length(texto) <= 2200),
  fotos jsonb not null default '[]'::jsonb check (jsonb_typeof(fotos) = 'array' and jsonb_array_length(fotos) <= 10),
  pid text check (char_length(coalesce(pid,'')) <= 200),
  snap jsonb check (snap is null or pg_column_size(snap) <= 16384),
  estilo jsonb check (estilo is null or pg_column_size(estilo) <= 2048)
);
create index if not exists publicacoes_autor_at_idx on public.publicacoes(autor, at desc);
create index if not exists publicacoes_at_idx on public.publicacoes(at desc);

alter table public.publicacoes enable row level security;
drop policy if exists pub_ler on public.publicacoes;
create policy pub_ler on public.publicacoes for select to authenticated using (
  public.e_membro() and (autor = auth.uid() or public.sao_amigos(auth.uid(), autor))
  and (tipo = 'post' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint));
drop policy if exists pub_criar on public.publicacoes;
create policy pub_criar on public.publicacoes for insert to authenticated with check (
  autor = auth.uid() and public.e_membro()
  and (tipo = 'post' or (expira is not null and expira <= at + 86460000)));
drop policy if exists pub_apagar on public.publicacoes;
create policy pub_apagar on public.publicacoes for delete to authenticated using (autor = auth.uid());

revoke all on public.publicacoes from anon, authenticated;
grant select, insert, delete on public.publicacoes to authenticated;

-- ---------- quem viu cada story ----------
create table if not exists public.pub_vistos (
  pub uuid not null references public.publicacoes(id) on delete cascade,
  uid uuid not null references public.membros(uid) on delete cascade,
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (pub, uid)
);
alter table public.pub_vistos enable row level security;
drop policy if exists vistos_ler on public.pub_vistos;
create policy vistos_ler on public.pub_vistos for select to authenticated using (
  uid = auth.uid() or exists(select 1 from public.publicacoes p where p.id = pub and p.autor = auth.uid()));
drop policy if exists vistos_marcar on public.pub_vistos;
create policy vistos_marcar on public.pub_vistos for insert to authenticated with check (
  uid = auth.uid() and public.e_membro() and exists(select 1 from public.publicacoes p where p.id = pub));
revoke all on public.pub_vistos from anon, authenticated;
grant select, insert on public.pub_vistos to authenticated;

-- ---------- tempo real (só inserções; o app relê de tempos em tempos) ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'publicacoes') then
    execute 'alter publication supabase_realtime add table public.publicacoes';
  end if;
end $$;

-- ---------- fotos (Storage): pasta privada "fotos"; cada pessoa só grava na própria pasta ----------
-- (rode no SQL Editor do Supabase; tamanho máximo de 1 MB por foto, só imagens)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists fotos_ler on storage.objects;
create policy fotos_ler on storage.objects for select to authenticated using (
  bucket_id = 'fotos' and public.e_membro()
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  and ((storage.foldername(name))[1] = auth.uid()::text
       or public.sao_amigos(auth.uid(), ((storage.foldername(name))[1])::uuid)));
drop policy if exists fotos_enviar on storage.objects;
create policy fotos_enviar on storage.objects for insert to authenticated with check (
  bucket_id = 'fotos' and public.e_membro() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists fotos_apagar on storage.objects;
create policy fotos_apagar on storage.objects for delete to authenticated using (
  bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
