-- Proposta 18/11 (Fase 6 · Colunas): os números de TODAS as colunas de quem escreve, para "Minhas colunas" > Publicadas.
-- Hoje o app usa coluna_mais_lidas(), que devolve só as 10 mais lidas; sem esta função ele continua assim.
-- Mesma regra de privacidade da v13: só a própria autora vê, e só os totais (leituras e quantos chegaram ao fim).
-- Rodar depois de sql/publicacoes-v13.sql. Não muda tabela nenhuma.
create or replace function public.coluna_minhas_numeros() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('pub', t.pub, 'leituras', t.n, 'fim', t.f) order by t.n desc, t.pub)
    from (select l.pub, count(*) n, count(*) filter (where l.chegou_fim) f from public.coluna_leituras l
          join public.publicacoes p on p.id = l.pub where p.autor = me group by l.pub order by count(*) desc limit 500) t), '[]'::jsonb);
end $$;
revoke all on function public.coluna_minhas_numeros() from public, anon;
grant execute on function public.coluna_minhas_numeros() to authenticated;
