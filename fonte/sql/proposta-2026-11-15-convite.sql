-- Prumo News · proposta de 15/11/2026: conferir o convite e mostrar a prévia de um post para quem ainda não tem conta.
-- PROPOSTA para o Pedro decidir e rodar (SQL Editor › New query › colar tudo › Run). Pode rodar de novo sem problema.
-- O app (js/160-conta.js) já usa as duas funções quando existem; sem elas, fica como antes.
--
-- O que muda, em linguagem simples:
--   1. convite_info(código): quem abre um link de convite (ainda sem conta) fica sabendo, ANTES de criar o login,
--      se o código vale e de quem é ("Convite de Ana"). Antes, o app criava a conta de e-mail primeiro e só depois
--      descobria "Convite inválido ou já usado", deixando um login solto.
--      Responde só: vale ou não, o motivo (não existe / já usado / expirou) e o PRIMEIRO nome de quem convidou.
--      Não diz e-mail, uid nem nada mais. Os códigos têm 8 letras de 32 possíveis (~1 trilhão de combinações), então
--      perguntar código por código não ajuda a achar convites de outras pessoas.
--   2. post_previa(id do post) — DECISÃO DO PEDRO: quem recebe o link de um post (#p=…) e não tem conta vê de quem é o
--      post (primeiro nome) e a notícia que ele comenta, com link para ler a notícia. O TEXTO do post, as fotos e os
--      comentários continuam só para amigos. Para post apagado ou arquivado, diz que o post não está mais disponível.
--      Posts para "Melhores amigos" não mostram nem o nome (o perfil fechado, que é o padrão, mostra o primeiro nome). Se preferir não mostrar nada a quem
--      não tem conta, rode só a parte 1.

-- ---------- 1. convite_info ----------
create or replace function public.convite_info(p_codigo text) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare c text := upper(btrim(coalesce(p_codigo,''))); cv record;
begin
  if not exists(select 1 from membros) then return jsonb_build_object('valido', true, 'fundador', true); end if;
  if char_length(c) < 1 or char_length(c) > 20 then return jsonb_build_object('valido', false, 'motivo', 'nao_existe'); end if;
  select v.usado_em, v.expira_em, m.nome, m.suspenso_em, m.excluido_em into cv
    from convites v join membros m on m.uid = v.criado_por where v.codigo = c;
  if not found or cv.suspenso_em is not null or cv.excluido_em is not null then return jsonb_build_object('valido', false, 'motivo', 'nao_existe'); end if;
  if cv.usado_em is not null then return jsonb_build_object('valido', false, 'motivo', 'usado'); end if;
  if cv.expira_em < now() then return jsonb_build_object('valido', false, 'motivo', 'expirado'); end if;
  return jsonb_build_object('valido', true, 'de', split_part(btrim(cv.nome), ' ', 1));
end $$;
revoke all on function public.convite_info(text) from public;
grant execute on function public.convite_info(text) to anon, authenticated;

-- ---------- 2. post_previa (opcional: decisão do Pedro) ----------
create or replace function public.post_previa(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare x record;
begin
  select p.pid, p.publico, coalesce(p.arquivado, false) as arq, p.publicar_em, m.nome, m.suspenso_em, m.excluido_em
    into x from publicacoes p join membros m on m.uid = p.autor where p.id = p_id and p.tipo = 'post';
  if not found or x.arq or x.suspenso_em is not null or x.excluido_em is not null or (x.publicar_em is not null and x.publicar_em > now()) then
    return jsonb_build_object('existe', false);
  end if;
  if x.publico = 'proximos' then return jsonb_build_object('existe', true); end if;
  return jsonb_build_object('existe', true, 'autor', split_part(btrim(x.nome), ' ', 1),
    'pid', case when x.pid is null or x.pid like 'u:%' then null else x.pid end);
end $$;
revoke all on function public.post_previa(uuid) from public;
grant execute on function public.post_previa(uuid) to anon, authenticated;
