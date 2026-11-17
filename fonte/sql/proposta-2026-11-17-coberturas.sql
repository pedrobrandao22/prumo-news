-- Prumo News · proposta de 17/11/2026: "Avisos desta cobertura" desligado também no celular.
-- PARA O PEDRO RODAR (SQL Editor › New query › colar tudo › Run). Pode rodar de novo sem problema. Rodar depois da v10
-- (a fila de avisos, push_fila, precisa existir). Não precisa publicar de novo a função enviar-push.
--
-- O app (js/183-coberturas.js) guarda, nas suas preferências (data/users/<você>/prefs, campo cobSemAviso), as coberturas
-- em que você desligou os avisos: {"<id da cobertura>": "<nome>"}. Sem este SQL, a cobertura desligada já some da
-- Atividade e da bolinha no app, mas o aviso no celular continua chegando (o robô push_coberturas, a cada 15 min).
-- Com ele, o banco confere a mesma preferência antes de pôr o aviso de cobertura na fila (chave "cob:<id>").
-- Não cria tabela, não muda permissão e não mexe nos outros avisos: só lê a preferência de quem recebe.

create or replace function public.push_cob_desligada(p_para uuid, p_pid text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_typeof(d.data -> 'cobSemAviso') = 'object' and (d.data -> 'cobSemAviso') ? p_pid
                     from public.docs d where d.path = 'data/users/' || p_para::text || '/prefs'), false)
$$;
revoke all on function public.push_cob_desligada(uuid, text) from public, anon, authenticated;

-- antes de entrar na fila: aviso de cobertura ("cob:<id>") de quem desligou aquela cobertura não entra.
-- Um erro aqui nunca impede o aviso (fica como era antes).
create or replace function public.push_t_fila_cob() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'coberturas' and coalesce(new.chave, '') like 'cob:%' then
    begin
      if public.push_cob_desligada(new.para, substr(new.chave, 5)) then return null; end if;
    exception when others then null;
    end;
  end if;
  return new;
end $$;
revoke all on function public.push_t_fila_cob() from public, anon, authenticated;

drop trigger if exists push_fila_cob on public.push_fila;
create trigger push_fila_cob before insert on public.push_fila
  for each row execute function public.push_t_fila_cob();

-- Para conferir (troque o nome): as coberturas com aviso desligado de uma pessoa
-- select d.data -> 'cobSemAviso' from public.docs d join public.membros m on d.path = 'data/users/' || m.uid::text || '/prefs'
--  where m.nome = 'Pedro Brandão';
-- Para desfazer: drop trigger if exists push_fila_cob on public.push_fila;
