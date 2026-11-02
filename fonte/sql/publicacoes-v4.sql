-- Prumo News · Publicações v4: curtidas, comentários e votos das publicações dos membros — pode rodar mais de uma vez.
-- Ficam guardados junto da publicação e só quem pode ver a publicação vê quem curtiu, comentou ou votou.
-- "Desativar comentários" passa a valer também no servidor.
create table if not exists public.pub_reacoes (
  pub uuid not null references public.publicacoes(id) on delete cascade,
  uid uuid not null references public.membros(uid) on delete cascade,
  tipo text not null check (tipo in ('curtida','comentario','voto')),
  chave text not null default '' check (char_length(chave) <= 80),
  valor jsonb not null default '{}'::jsonb check (pg_column_size(valor) <= 4096),
  at bigint not null default (extract(epoch from now())*1000)::bigint,
  primary key (pub, uid, tipo, chave)
);
create index if not exists pub_reacoes_pub_idx on public.pub_reacoes(pub);
alter table public.pub_reacoes enable row level security;

drop policy if exists reac_ler on public.pub_reacoes;
create policy reac_ler on public.pub_reacoes for select to authenticated using (
  public.e_membro() and exists (select 1 from public.publicacoes p where p.id = pub));
drop policy if exists reac_criar on public.pub_reacoes;
create policy reac_criar on public.pub_reacoes for insert to authenticated with check (
  uid = auth.uid() and public.e_membro()
  and exists (select 1 from public.publicacoes p where p.id = pub)
  and (tipo <> 'comentario' or not exists (select 1 from public.publicacoes p where p.id = pub and coalesce(p.estilo->>'semCom', 'false') = 'true')));
drop policy if exists reac_apagar on public.pub_reacoes;
create policy reac_apagar on public.pub_reacoes for delete to authenticated using (
  uid = auth.uid() or exists (select 1 from public.publicacoes p where p.id = pub and p.autor = auth.uid()));
revoke all on public.pub_reacoes from anon, authenticated;
grant select, insert, delete on public.pub_reacoes to authenticated;

-- a hora é a do servidor
create or replace function public.reac_normaliza() returns trigger language plpgsql as $$
begin new.at := (extract(epoch from now())*1000)::bigint; return new; end $$;
drop trigger if exists reac_normaliza on public.pub_reacoes;
create trigger reac_normaliza before insert on public.pub_reacoes for each row execute function public.reac_normaliza();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pub_reacoes') then
    execute 'alter publication supabase_realtime add table public.pub_reacoes';
  end if;
end $$;
