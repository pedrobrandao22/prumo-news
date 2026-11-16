-- Prumo News · proposta de 16/11/2026: "Silenciar conversa" também para o aviso no celular.
-- PARA O PEDRO RODAR (SQL Editor › New query › colar tudo › Run). Pode rodar de novo sem problema.
--
-- O app (js/162-conversas.js) guarda o "silenciar" nas suas preferências (data/users/<você>/prefs, campo conv).
-- Sem este SQL, a conversa silenciada já fica sem bolinha e sem número no app, mas o aviso no celular continua chegando.
-- Com ele, o banco confere a mesma preferência antes de pôr o aviso de mensagem na fila.
-- Não cria tabela nem muda permissão: só lê a preferência de quem recebe.

create or replace function public.push_silenciou(p_para uuid, p_de uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (d.data -> 'conv' -> (p_de::text) ->> 'sil') = 'true'
                     from public.docs d where d.path = 'data/users/' || p_para::text || '/prefs'), false)
$$;
revoke all on function public.push_silenciou(uuid, uuid) from public, anon, authenticated;

-- igual à versão da v10 (parte 8), com a conferência do "silenciar" para mensagens, reações e curtidas de giro
create or replace function public.push_t_mensagens() returns trigger
language plpgsql security definer set search_path = public as $$
declare n text; t text := coalesce(new.tipo, ''); up text;
begin
  begin
    n := public.push_nome(new.de);
    if t = 'mencao' then
      -- menção num post/story do Prumo ("u:<id>"): só avisa quem consegue ver a publicação
      up := case when coalesce(new.pid, '') like 'u:%' then substr(new.pid, 3) else null end;
      if up is not null and (up !~* '^[0-9a-f-]{36}$' or not public.push_ve_pub(new.para, up::uuid)) then return null; end if;
      perform public.push_enfileirar(new.para, 'mencoes', new.de, 'men:' || new.de, n || ' mencionou você',
        case when coalesce(btrim(new.texto), '') = '' or new.texto = 'Mencionou você no story' then 'Toque para ver.' else new.texto end, '?nt=atividade');
    elsif public.push_silenciou(new.para, new.de) then
      return null;   -- conversa silenciada por quem recebe
    elsif t = 'curtiu_story' then
      perform public.push_enfileirar(new.para, 'curtidas', new.de, 'cst:' || new.de, n || ' curtiu seu story', '', '?nt=conversa:' || new.de);
    else
      perform public.push_enfileirar(new.para, 'mensagens', new.de, 'conv:' || new.de, n,
        case when t = 'reacao_msg' then 'Reagiu à sua mensagem: ' || public.push_corta(new.texto, 40)
             when coalesce(btrim(new.texto), '') <> '' then new.texto
             when new.pid is not null then 'Enviou uma publicação'
             else 'Enviou uma mensagem' end, '?nt=conversa:' || new.de);
    end if;
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.push_t_mensagens() from public, anon, authenticated;
