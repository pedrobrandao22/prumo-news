-- Proposta da melhoria contínua de 04/11/2026: editar o texto de uma coluna depois de publicada.
-- Para o Pedro rodar no Supabase (SQL Editor › New query › colar › Run), depois da v9. Só precisa rodar uma vez.
--
-- O que faz: deixa o AUTOR mudar a coluna publicacoes.corpo (o texto longo das colunas, criado na v9).
-- Continua valendo:
--   * a regra pub_editar: só o autor atualiza o próprio post (using/with check autor = auth.uid());
--   * o gatilho pub_coluna_confere: corpo só existe em post que é coluna, até 40.000 caracteres;
--   * as outras colunas (foto, público, tipo, data) continuam sem poder mudar.
-- Sem esta proposta, o app já deixa editar título, linha fina e hashtags; só o texto longo fica travado (o app avisa).

grant update (corpo) on public.publicacoes to authenticated;

-- (opcional) marcar "editado" também quando só o texto longo muda:
create or replace function public.pub_edita() returns trigger language plpgsql as $$
begin
  if new.texto is distinct from old.texto or new.corpo is distinct from old.corpo then new.editado := (extract(epoch from now())*1000)::bigint; end if;
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
