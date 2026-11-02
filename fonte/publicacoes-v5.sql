-- Prumo News · Publicações v5: arquivo de stories, destaques no perfil, editar legenda e fixar posts — pode rodar mais de uma vez.

-- ---------- editar e fixar ----------
alter table public.publicacoes add column if not exists fixado bigint;
alter table public.publicacoes add column if not exists editado bigint;
drop policy if exists pub_editar on public.publicacoes;
create policy pub_editar on public.publicacoes for update to authenticated using (autor = auth.uid()) with check (autor = auth.uid());
revoke update on public.publicacoes from authenticated;
grant update (texto, estilo, fixado, editado) on public.publicacoes to authenticated;
create or replace function public.pub_edita() returns trigger language plpgsql as $$
begin
  if new.texto is distinct from old.texto then new.editado := (extract(epoch from now())*1000)::bigint; end if;
  if new.fixado is not null and old.fixado is null then
    if new.tipo <> 'post' then raise exception 'so posts podem ser fixados'; end if;
    if (select count(*) from public.publicacoes where autor = new.autor and fixado is not null and id <> new.id) >= 3 then raise exception 'no maximo 3 fixados'; end if;
    new.fixado := (extract(epoch from now())*1000)::bigint;
  elsif new.fixado is not null and old.fixado is not null then
    new.fixado := old.fixado;  -- a hora de fixar é do servidor e não muda depois
  end if;
  if coalesce(new.estilo->>'video', '') is distinct from coalesce(old.estilo->>'video', '') then raise exception 'o video nao muda'; end if;
  return new;
end $$;
drop trigger if exists pub_edita on public.publicacoes;
create trigger pub_edita before update on public.publicacoes for each row execute function public.pub_edita();

-- ---------- destaques ----------
create table if not exists public.destaques (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references public.membros(uid) on delete cascade,
  nome text not null default 'Destaque' check (char_length(nome) between 1 and 30),
  itens uuid[] not null default '{}' check (cardinality(itens) <= 100),
  capa uuid,
  ordem int not null default 0,
  at bigint not null default (extract(epoch from now())*1000)::bigint
);
create index if not exists destaques_dono_idx on public.destaques(dono);
alter table public.destaques enable row level security;
drop policy if exists dest_ler on public.destaques;
create policy dest_ler on public.destaques for select to authenticated using (
  public.e_membro() and (dono = auth.uid() or public.sao_amigos(auth.uid(), dono)));
drop policy if exists dest_criar on public.destaques;
create policy dest_criar on public.destaques for insert to authenticated with check (dono = auth.uid() and public.e_membro());
drop policy if exists dest_mudar on public.destaques;
create policy dest_mudar on public.destaques for update to authenticated using (dono = auth.uid()) with check (dono = auth.uid());
drop policy if exists dest_apagar on public.destaques;
create policy dest_apagar on public.destaques for delete to authenticated using (dono = auth.uid());
revoke all on public.destaques from anon, authenticated;
grant select, insert, update, delete on public.destaques to authenticated;
create or replace function public.dest_confere() returns trigger language plpgsql as $$
begin
  -- story que já foi apagado sai da lista sozinho (assim o destaque continua editável), sem repetir ids
  new.itens := array(select i from (select i, min(o) o from unnest(new.itens) with ordinality u(i, o) group by i) x
                     where exists (select 1 from public.publicacoes p where p.id = x.i) order by x.o);
  if exists (select 1 from unnest(new.itens) i where not exists (select 1 from public.publicacoes p where p.id = i and p.autor = new.dono and p.tipo = 'story')) then
    raise exception 'destaque so com stories do proprio dono';
  end if;
  return new;
end $$;
drop trigger if exists dest_confere on public.destaques;
create trigger dest_confere before insert or update on public.destaques for each row execute function public.dest_confere();

-- story que está num destaque não é apagado sem antes sair do destaque
-- (protege contra a limpeza automática de uma versão antiga do app; o app novo tira do destaque antes de apagar)
create or replace function public.pub_protege_destaque() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.tipo = 'story'
     and exists (select 1 from public.destaques d where d.dono = old.autor and old.id = any(d.itens))
     and exists (select 1 from public.membros m where m.uid = old.autor) then
    raise exception 'story em destaque: tire do destaque antes de apagar';
  end if;
  return old;
end $$;
drop trigger if exists pub_protege_destaque on public.publicacoes;
create trigger pub_protege_destaque before delete on public.publicacoes for each row execute function public.pub_protege_destaque();

-- stories que estão num destaque continuam visíveis para os amigos depois das 24 horas
drop policy if exists pub_ler on public.publicacoes;
create policy pub_ler on public.publicacoes for select to authenticated using (
  public.e_membro() and (autor = auth.uid() or (public.sao_amigos(auth.uid(), autor)
    and (publico = 'amigos' or exists (select 1 from public.melhores_amigos m where m.dono = autor and m.amigo = auth.uid()))))
  and (tipo <> 'story' or autor = auth.uid() or coalesce(expira, 0) > (extract(epoch from now())*1000)::bigint
       or exists (select 1 from public.destaques d where d.dono = publicacoes.autor and publicacoes.id = any(d.itens))));
