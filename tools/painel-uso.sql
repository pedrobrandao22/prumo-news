-- Prumo News — painel de uso (anônimo). Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run.
-- Guarda só: quando, um número aleatório do aparelho, o tipo (abrir, matéria, link, compartilhar) e qual matéria.
-- Nada de nome, e-mail ou conta. Só o administrador vê os totais, e só somados.

create table if not exists public.eventos (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  sessao text not null,
  tipo text not null,
  pid text,
  secao text,
  origem text
);
alter table public.eventos enable row level security;
-- sem políticas: ninguém lê nem grava a tabela direto; só pelas funções abaixo
create index if not exists eventos_criado_idx on public.eventos (criado_em);
create index if not exists eventos_sessao_idx on public.eventos (sessao, criado_em);

create or replace function public.registrar_evento(p_sessao text, p_tipo text, p_pid text default null, p_secao text default null, p_origem text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_tipo is null or p_tipo not in ('abrir', 'link', 'materia', 'compartilhar') then return; end if;
  if p_sessao is null or length(p_sessao) not between 6 and 64 then return; end if;
  -- limite por aparelho: 300 eventos por dia
  if (select count(*) from eventos where sessao = p_sessao and criado_em > now() - interval '1 day') >= 300 then return; end if;
  insert into eventos (sessao, tipo, pid, secao, origem)
  values (p_sessao, p_tipo, left(p_pid, 80), left(p_secao, 20), left(p_origem, 12));
  -- guarda 180 dias
  if random() < 0.01 then delete from eventos where criado_em < now() - interval '180 days'; end if;
end $$;
revoke all on function public.registrar_evento(text, text, text, text, text) from public;
grant execute on function public.registrar_evento(text, text, text, text, text) to anon, authenticated;

create or replace function public.admin_painel(p_dias int default 14)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  d int := least(greatest(coalesce(p_dias, 14), 1), 90);
  r jsonb;
begin
  if not public.e_admin() then raise exception 'sem acesso' using errcode = '42501'; end if;
  with ev as (
    select sessao, tipo, pid, secao, origem, (criado_em at time zone 'America/Sao_Paulo') as sp
    from eventos where criado_em > now() - make_interval(days => d)
  )
  select jsonb_build_object(
    'dias', coalesce((select jsonb_agg(jsonb_build_object('dia', dia, 'aparelhos', ap, 'aberturas', ab, 'materias', ma) order by dia)
      from (select to_char(sp::date, 'YYYY-MM-DD') as dia, count(distinct sessao) as ap,
                   count(*) filter (where tipo in ('abrir', 'link')) as ab, count(*) filter (where tipo = 'materia') as ma
            from ev group by sp::date) t), '[]'::jsonb),
    'horas', coalesce((select jsonb_agg(jsonb_build_object('hora', hora, 'n', n) order by hora)
      from (select extract(hour from sp)::int as hora, count(*) as n from ev where tipo in ('abrir', 'link') group by 1) t), '[]'::jsonb),
    'secoes', coalesce((select jsonb_agg(jsonb_build_object('secao', secao, 'n', n) order by n desc)
      from (select coalesce(secao, '?') as secao, count(*) as n from ev where tipo = 'materia' group by 1) t), '[]'::jsonb),
    'top', coalesce((select jsonb_agg(jsonb_build_object('pid', pid, 'n', n) order by n desc)
      from (select pid, count(*) as n from ev where tipo = 'materia' and pid is not null group by pid order by count(*) desc limit 12) t), '[]'::jsonb),
    'origem', coalesce((select jsonb_agg(jsonb_build_object('origem', o, 'n', n) order by n desc)
      from (select case when tipo = 'link' then 'link' else coalesce(origem, '?') end as o, count(*) as n from ev where tipo in ('abrir', 'link') group by 1) t), '[]'::jsonb),
    'compartilhamentos', (select count(*) from ev where tipo = 'compartilhar'),
    'total_aparelhos', (select count(distinct sessao) from ev)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_painel(int) from public;
grant execute on function public.admin_painel(int) to authenticated;
