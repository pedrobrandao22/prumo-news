-- Prumo News · v10: notificações no celular (Web Push) — aparelhos inscritos e fila de avisos.
-- Rodar UMA vez no Supabase: SQL Editor › New query › colar tudo › Run. Pode rodar de novo sem problema.
-- Precisa das versões v2 a v8 já rodadas. Funciona com ou sem a v9 ("Seguir"): se a tabela "seguidores" existir,
-- passam a valer também os avisos de novo seguidor e de posts e colunas de quem você segue.
-- Se a v9 for rodada DEPOIS desta, rode esta de novo (ela liga o aviso de novo seguidor).
-- Esta versão não envia nada sozinha: ela só guarda os aparelhos e põe os avisos numa fila.
-- Quem envia é a função "enviar-push" (passo a passo em supabase/LEIA-ME-push.md). Sem a função, a fila se limpa sozinha em 3 dias.
-- Nada aqui guarda chave secreta: a chave PÚBLICA do VAPID fica em config_app (é pública por natureza); a privada fica só nos segredos da função.
-- O app novo funciona antes e depois desta versão: sem ela, a página Notificações mostra só os avisos dentro do app.

-- 1. Aparelhos inscritos: cada celular/navegador que ligou as notificações, com as escolhas de cada tipo de aviso
create table if not exists public.push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references public.membros(uid) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 10 and 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  prefs jsonb not null default '{}'::jsonb check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) <= 2048),
  ua text check (char_length(coalesce(ua, '')) <= 200),
  created_at timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists push_inscricoes_uid_idx on public.push_inscricoes(uid);

-- os tipos de aviso (os mesmos nomes do app)
create or replace function public.push_tipo_ok(t text) returns boolean
language sql immutable as $$
  select t in ('mensagens','amizades','comentarios','mencoes','curtidas','reposts','seguidores','seguindo','coberturas','colunas')
$$;

-- as escolhas ficam só com os tipos conhecidos e com sim/não (true/false)
create or replace function public.push_inscricoes_normaliza() returns trigger
language plpgsql as $$
begin
  new.prefs := coalesce((select jsonb_object_agg(k, v) from jsonb_each(coalesce(new.prefs, '{}'::jsonb)) as e(k, v)
                          where public.push_tipo_ok(k) and jsonb_typeof(v) = 'boolean'), '{}'::jsonb);
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists push_inscricoes_normaliza on public.push_inscricoes;
create trigger push_inscricoes_normaliza before insert or update on public.push_inscricoes
  for each row execute function public.push_inscricoes_normaliza();

-- quem lê e muda: só o dono do aparelho (a função de envio usa a chave de serviço, que passa por cima disto)
alter table public.push_inscricoes enable row level security;
drop policy if exists push_insc_ler on public.push_inscricoes;
create policy push_insc_ler on public.push_inscricoes for select to authenticated using (uid = auth.uid());
drop policy if exists push_insc_criar on public.push_inscricoes;
create policy push_insc_criar on public.push_inscricoes for insert to authenticated with check (uid = auth.uid() and public.e_membro());
drop policy if exists push_insc_mudar on public.push_inscricoes;
create policy push_insc_mudar on public.push_inscricoes for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());
drop policy if exists push_insc_apagar on public.push_inscricoes;
create policy push_insc_apagar on public.push_inscricoes for delete to authenticated using (uid = auth.uid());
revoke all on public.push_inscricoes from anon, authenticated;
grant select, insert, delete on public.push_inscricoes to authenticated;
grant update (prefs) on public.push_inscricoes to authenticated;

-- inscrever este aparelho (ou atualizar). Se o aparelho era de outra conta (trocou de login), passa para esta.
-- Até 10 aparelhos por pessoa: o mais antigo sai.
create or replace function public.push_inscrever(p_endpoint text, p_p256dh text, p_auth text, p_prefs jsonb, p_ua text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not public.e_membro() then raise exception 'sem acesso' using errcode = '42501'; end if;
  delete from public.push_inscricoes where endpoint = p_endpoint and uid <> me;
  insert into public.push_inscricoes(uid, endpoint, p256dh, auth, prefs, ua)
  values (me, p_endpoint, p_p256dh, p_auth, coalesce(p_prefs, '{}'::jsonb), left(p_ua, 200))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, prefs = excluded.prefs, ua = excluded.ua;
  delete from public.push_inscricoes where uid = me and id in (
    select id from public.push_inscricoes where uid = me order by atualizado_em desc offset 10);
end $$;
revoke all on function public.push_inscrever(text, text, text, jsonb, text) from public, anon;
grant execute on function public.push_inscrever(text, text, text, jsonb, text) to authenticated;

-- 2. A chave PÚBLICA do VAPID (o app precisa dela para inscrever o aparelho). Vazia = "ainda não ativado pelo administrador".
--    O Pedro grava assim (SQL Editor), trocando pelo valor de "Public Key":
--    insert into public.config_app(chave, valor) values ('push_vapid_publica', jsonb_build_object('chave', 'COLE_A_CHAVE_PUBLICA'))
--      on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
create or replace function public.push_chave_publica() returns text
language sql stable security definer set search_path = public as $$
  select nullif(btrim(valor->>'chave'), '') from public.config_app where chave = 'push_vapid_publica'
$$;
revoke all on function public.push_chave_publica() from public, anon;
grant execute on function public.push_chave_publica() to authenticated;

-- 3. A fila de avisos: os gatilhos abaixo põem aqui; a função enviar-push lê, agrupa e envia.
--    Ninguém do app lê nem escreve nesta tabela (só a função, com a chave de serviço).
create table if not exists public.push_fila (
  id bigint generated always as identity primary key,
  para uuid not null references public.membros(uid) on delete cascade,
  tipo text not null check (public.push_tipo_ok(tipo)),
  de uuid references public.membros(uid) on delete cascade,
  chave text not null default '' check (char_length(chave) <= 120),
  titulo text not null check (char_length(titulo) <= 140),
  corpo text not null default '' check (char_length(corpo) <= 300),
  url text not null default './' check (char_length(url) <= 300),
  estado text not null default 'pendente' check (estado in ('pendente','processando','enviado','agrupado','sem_destino','falhou')),
  criado_em timestamptz not null default now(),
  enviado_em timestamptz
);
create index if not exists push_fila_estado_idx on public.push_fila(estado, criado_em);
create index if not exists push_fila_grupo_idx on public.push_fila(para, tipo, chave, enviado_em);
alter table public.push_fila enable row level security;
revoke all on public.push_fila from anon, authenticated;

-- alguém quer este tipo de aviso em algum aparelho?
create or replace function public.push_quer(p_uid uuid, p_tipo text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.push_inscricoes where uid = p_uid and prefs ->> p_tipo = 'true')
$$;
create or replace function public.push_nome(p_uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select nome from public.membros where uid = p_uid), 'Alguém')
$$;
create or replace function public.push_corta(t text, n int) returns text
language sql immutable as $$
  select case when char_length(btrim(coalesce(t, ''))) <= n then btrim(coalesce(t, ''))
              else rtrim(left(btrim(t), n - 1)) || '…' end
$$;

-- põe um aviso na fila, só se: não é para si mesmo, a pessoa quer esse tipo em algum aparelho,
-- ninguém bloqueou ninguém e a conta de quem recebe está ativa
create or replace function public.push_enfileirar(p_para uuid, p_tipo text, p_de uuid, p_chave text, p_titulo text, p_corpo text, p_url text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_para is null or p_para = p_de or not public.push_tipo_ok(p_tipo) then return false; end if;
  if not public.push_quer(p_para, p_tipo) then return false; end if;
  if p_de is not null and exists (select 1 from public.bloqueios where (de = p_para and para = p_de) or (de = p_de and para = p_para)) then return false; end if;
  if exists (select 1 from public.membros where uid = p_para and (suspenso_em is not null or excluido_em is not null)) then return false; end if;
  insert into public.push_fila(para, tipo, de, chave, titulo, corpo, url)
  values (p_para, p_tipo, p_de, left(coalesce(p_chave, ''), 120), public.push_corta(p_titulo, 140), public.push_corta(p_corpo, 300), left(coalesce(p_url, './'), 300));
  -- limpeza de vez em quando: o que tem mais de 3 dias sai
  if random() < 0.05 then delete from public.push_fila where criado_em < now() - interval '3 days'; end if;
  return true;
end $$;

-- quem segue quem (só se a v9 existir; as colunas são descobertas na hora, sem depender da ordem das versões)
create or replace function public.push_seguidores_de(p_uid uuid) returns setof uuid
language plpgsql stable security definer set search_path = public as $$
declare c_de text; c_para text;
begin
  if to_regclass('public.seguidores') is null then return; end if;
  select column_name into c_de from information_schema.columns where table_schema = 'public' and table_name = 'seguidores'
     and column_name in ('seguidor','de','uid','quem') order by array_position(array['seguidor','de','uid','quem'], column_name::text) limit 1;
  select column_name into c_para from information_schema.columns where table_schema = 'public' and table_name = 'seguidores'
     and column_name in ('seguido','para','alvo','autor') order by array_position(array['seguido','para','alvo','autor'], column_name::text) limit 1;
  if c_de is null or c_para is null then return; end if;
  return query execute format('select %I from public.seguidores where %I = $1', c_de, c_para) using p_uid;
end $$;

-- quem recebe o aviso de uma publicação consegue vê-la? (as mesmas regras de leitura das publicações)
create or replace function public.push_pode_ver(p_quem uuid, p_autor uuid, p_publico text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare pub text := coalesce(p_publico, 'amigos');
begin
  if p_quem = p_autor then return true; end if;
  if exists (select 1 from public.bloqueios b where (b.de = p_quem and b.para = p_autor) or (b.de = p_autor and b.para = p_quem)) then return false; end if;
  if public.sao_amigos(p_quem, p_autor) and (pub in ('amigos', 'seguidores', 'todos', 'publico')
       or exists (select 1 from public.melhores_amigos m where m.dono = p_autor and m.amigo = p_quem)) then return true; end if;
  -- quem só segue (v9): vê o que é "para seguidores" enquanto o perfil do autor estiver aberto
  if pub in ('seguidores', 'todos', 'publico') and exists (select 1 from public.push_seguidores_de(p_autor) s(u) where s.u = p_quem) then
    begin
      return exists (select 1 from public.membros m where m.uid = p_autor and coalesce((to_jsonb(m) ->> 'perfil_aberto')::boolean, false));
    exception when others then return false;
    end;
  end if;
  return false;
end $$;

-- 4. Gatilhos: cada coisa nova vira um aviso na fila. Qualquer erro aqui é engolido:
--    um aviso nunca impede a mensagem, a curtida ou o post de ser gravado.

-- mensagens (e menções, que chegam como mensagem)
create or replace function public.push_t_mensagens() returns trigger
language plpgsql security definer set search_path = public as $$
declare n text; t text := coalesce(new.tipo, '');
begin
  begin
    n := public.push_nome(new.de);
    if t = 'mencao' then
      perform public.push_enfileirar(new.para, 'mencoes', new.de, 'men:' || new.de, n || ' mencionou você',
        case when coalesce(btrim(new.texto), '') = '' or new.texto = 'Mencionou você no story' then 'Toque para ver.' else new.texto end, '?nt=atividade');
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
drop trigger if exists push_t_mensagens on public.mensagens;
create trigger push_t_mensagens after insert on public.mensagens for each row execute function public.push_t_mensagens();

-- pedidos de amizade e pedido aceito
create or replace function public.push_t_amizades() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' and new.status = 'pendente' then
      perform public.push_enfileirar(new.para, 'amizades', new.de, 'amz:' || new.de, public.push_nome(new.de) || ' quer ser seu amigo',
        'Toque para aceitar ou recusar.', '?nt=pedidos');
    elsif tg_op = 'UPDATE' and new.status = 'aceita' and old.status is distinct from 'aceita' then
      perform public.push_enfileirar(new.de, 'amizades', new.para, 'amz:' || new.para, public.push_nome(new.para) || ' aceitou seu pedido de amizade',
        'Agora vocês são amigos no Prumo.', '?nt=perfil:' || new.para);
    end if;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_amizades on public.amizades;
create trigger push_t_amizades after insert or update of status on public.amizades for each row execute function public.push_t_amizades();

-- curtidas e comentários nas publicações (e "também comentou" para quem já comentou no mesmo post)
create or replace function public.push_t_reacoes() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; n text; oque text; o uuid;
begin
  begin
    select id, autor, tipo, estilo into p from public.publicacoes where id = new.pub;
    if not found then return null; end if;
    n := public.push_nome(new.uid);
    oque := case when p.tipo = 'story' then 'seu story' when coalesce(p.estilo->>'reel', '') in ('true', '1') then 'seu reel' else 'seu post' end;
    if new.tipo = 'comentario' then
      perform public.push_enfileirar(p.autor, 'comentarios', new.uid, 'cmt:' || new.pub, n || ' comentou no ' || oque,
        coalesce(new.valor->>'texto', ''), '?nt=comentarios:' || new.pub);
      for o in select distinct r.uid from public.pub_reacoes r
                where r.pub = new.pub and r.tipo = 'comentario' and r.uid <> new.uid and r.uid <> p.autor limit 30 loop
        perform public.push_enfileirar(o, 'comentarios', new.uid, 'cmt:' || new.pub, n || ' também comentou no post de ' || public.push_nome(p.autor),
          coalesce(new.valor->>'texto', ''), '?nt=comentarios:' || new.pub);
      end loop;
    elsif new.tipo = 'curtida' then
      perform public.push_enfileirar(p.autor, 'curtidas', new.uid, 'curt:' || new.pub, n || ' curtiu ' || oque, '', '?nt=atividade');
    end if;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_reacoes on public.pub_reacoes;
create trigger push_t_reacoes after insert on public.pub_reacoes for each row execute function public.push_t_reacoes();

-- curtida em comentário (da v8)
create or replace function public.push_t_com_curtidas() returns trigger
language plpgsql security definer set search_path = public as $$
declare tx text; pid text;
begin
  begin
    if new.pub is not null then
      select valor->>'texto' into tx from public.pub_reacoes where pub = new.pub and uid = new.autor and tipo = 'comentario' and chave = new.cid;
    else
      select d.data->'itens'->new.cid->>'texto', d.data->'itens'->new.cid->>'pid' into tx, pid
        from public.docs d where d.path = 'comentarios/' || new.autor::text;
    end if;
    perform public.push_enfileirar(new.autor, 'curtidas', new.uid, 'cc:' || new.cid, public.push_nome(new.uid) || ' curtiu seu comentário',
      coalesce(tx, ''), case when new.pub is not null then '?nt=comentarios:' || new.pub when pid is not null then '?nt=noticia:' || pid else '?nt=atividade' end);
  exception when others then null;
  end;
  return null;
end $$;
do $$
begin
  if to_regclass('public.com_curtidas') is not null then
    execute 'drop trigger if exists push_t_com_curtidas on public.com_curtidas';
    execute 'create trigger push_t_com_curtidas after insert on public.com_curtidas for each row execute function public.push_t_com_curtidas()';
  end if;
end $$;

-- comentário numa notícia em que você também comentou (os comentários de notícia ficam em docs "comentarios/<pessoa>")
create or replace function public.push_t_docs_comentarios() returns trigger
language plpgsql security definer set search_path = public as $$
declare it record; o uuid; n text; tit text;
begin
  begin
    select e.key, e.value into it from jsonb_each(coalesce(new.data->'itens', '{}'::jsonb)) as e(key, value)
     where jsonb_typeof(e.value) = 'object'
       and (tg_op = 'INSERT' or not coalesce(old.data->'itens' ? e.key, false))
     order by coalesce((e.value->>'at')::bigint, 0) desc limit 1;
    if not found or coalesce(it.value->>'pid', '') = '' or it.value->>'pid' like 'u:%' then return null; end if;
    n := public.push_nome(new.owner);
    tit := coalesce(nullif(it.value->'snap'->>'titulo', ''), 'uma notícia');
    for o in select d.owner from public.docs d
              where d.col = 'comentarios' and d.owner is not null and d.owner <> new.owner and public.sao_amigos(d.owner, new.owner)
                and exists (select 1 from jsonb_each(coalesce(d.data->'itens', '{}'::jsonb)) as x(k, v)
                             where jsonb_typeof(x.v) = 'object' and x.v->>'pid' = it.value->>'pid')
              limit 30 loop
      perform public.push_enfileirar(o, 'comentarios', new.owner, 'cn:' || (it.value->>'pid'),
        n || ' também comentou em “' || public.push_corta(tit, 70) || '”', coalesce(it.value->>'texto', ''), '?nt=noticia:' || (it.value->>'pid'));
    end loop;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_docs_comentarios on public.docs;
create trigger push_t_docs_comentarios after insert or update on public.docs
  for each row when (new.col = 'comentarios') execute function public.push_t_docs_comentarios();

-- publicação nova: repost/citação do seu post; e (com a v9) posts e colunas de quem você segue
create or replace function public.push_t_publicacoes() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new); n text; orig uuid; oa uuid; f uuid; col boolean; tx text;
begin
  begin
    if new.tipo = 'story' or coalesce(j->>'arquivado', 'false') = 'true' then return null; end if;
    n := public.push_nome(new.autor);
    tx := btrim(coalesce(new.texto, ''));
    if new.estilo->'rp'->>'k' = 'pub' and (new.estilo->'rp'->>'id') ~* '^[0-9a-f-]{36}$' then
      orig := (new.estilo->'rp'->>'id')::uuid;
      select autor into oa from public.publicacoes where id = orig;
      if oa is not null and oa <> new.autor and public.push_pode_ver(oa, new.autor, j->>'publico') then
        perform public.push_enfileirar(oa, 'reposts', new.autor, 'rp:' || orig,
          n || case when tx = '' then ' repostou sua publicação' else ' citou sua publicação' end, tx, '?nt=pub:' || new.id);
      end if;
    end if;
    col := new.tipo = 'coluna' or coalesce(new.estilo->>'coluna', '') in ('true', '1') or new.estilo->>'tipo' = 'coluna' or new.estilo->>'kind' = 'coluna';
    for f in select * from public.push_seguidores_de(new.autor) limit 300 loop
      if f is distinct from oa and f <> new.autor and public.push_pode_ver(f, new.autor, j->>'publico') then
        perform public.push_enfileirar(f, case when col then 'colunas' else 'seguindo' end, new.autor, 'seg:' || new.autor,
          n || case when col then ' publicou uma coluna' else ' publicou' end,
          coalesce(nullif(new.estilo->>'titulo', ''), tx), '?nt=pub:' || new.id);
      end if;
    end loop;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists push_t_publicacoes on public.publicacoes;
create trigger push_t_publicacoes after insert on public.publicacoes for each row execute function public.push_t_publicacoes();

-- novo seguidor (só se a v9 existir; se a v9 vier depois, rode esta versão de novo)
create or replace function public.push_t_seguidores() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new); s uuid; a uuid;
begin
  begin
    s := coalesce(j->>'seguidor', j->>'de', j->>'uid', j->>'quem')::uuid;
    a := coalesce(j->>'seguido', j->>'para', j->>'alvo', j->>'autor')::uuid;
    perform public.push_enfileirar(a, 'seguidores', s, 'seg-novo', public.push_nome(s) || ' começou a seguir você', '', '?nt=perfil:' || s);
  exception when others then null;
  end;
  return null;
end $$;
do $$
begin
  if to_regclass('public.seguidores') is not null then
    execute 'drop trigger if exists push_t_seguidores on public.seguidores';
    execute 'create trigger push_t_seguidores after insert on public.seguidores for each row execute function public.push_t_seguidores()';
  end if;
end $$;

-- 5. Ninguém do app chama estas funções direto (só os gatilhos e a função de envio)
revoke all on function public.push_quer(uuid, text), public.push_nome(uuid), public.push_enfileirar(uuid, text, uuid, text, text, text, text),
  public.push_seguidores_de(uuid), public.push_pode_ver(uuid, uuid, text), public.push_t_mensagens(), public.push_t_amizades(),
  public.push_t_reacoes(), public.push_t_com_curtidas(), public.push_t_docs_comentarios(), public.push_t_publicacoes(),
  public.push_t_seguidores(), public.push_inscricoes_normaliza() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.push_enfileirar(uuid, text, uuid, text, text, text, text) to service_role';
    execute 'grant select, update, delete on public.push_fila to service_role';
    execute 'grant select, delete on public.push_inscricoes to service_role';
  end if;
end $$;

-- 6. (Opcional) Chamar a função assim que um aviso entra na fila, pelo pg_net — o jeito "B" do LEIA-ME.
--    Só funciona se o pg_net estiver ligado (Database › Extensions › pg_net) e se o endereço da função estiver gravado:
--    insert into public.config_app(chave, valor) values ('push_funcao_url', jsonb_build_object('url', 'https://SEU-PROJETO.supabase.co/functions/v1/enviar-push'))
--      on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
--    Não vai chave nenhuma no pedido: a função só envia o que já está na fila, então chamá-la sem chave não vaza nada.
--    Para desligar: delete from public.config_app where chave = 'push_funcao_url';
create or replace function public.push_t_fila_chama() returns trigger
language plpgsql security definer set search_path = public as $$
declare u text;
begin
  begin
    select valor->>'url' into u from public.config_app where chave = 'push_funcao_url';
    if u like 'https://%' and exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'net' and p.proname = 'http_post') then
      execute 'select net.http_post(url := $1, body := $2, headers := $3)'
        using u, '{"origem":"fila"}'::jsonb, '{"Content-Type":"application/json"}'::jsonb;
    end if;
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.push_t_fila_chama() from public, anon, authenticated;
drop trigger if exists push_fila_chama on public.push_fila;
create trigger push_fila_chama after insert on public.push_fila for each statement execute function public.push_t_fila_chama();

-- 7. Excluir a conta já apaga os aparelhos e a fila (as duas tabelas apontam para membros com "on delete cascade"
--    e excluir_conta apaga o login; o nome fica como "Conta excluída", então aqui apagamos na hora também).
create or replace function public.push_limpa_conta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.excluido_em is not null and old.excluido_em is null then
    delete from public.push_inscricoes where uid = new.uid;
    delete from public.push_fila where para = new.uid or de = new.uid;
  end if;
  return null;
end $$;
revoke all on function public.push_limpa_conta() from public, anon, authenticated;
drop trigger if exists push_limpa_conta on public.membros;
create trigger push_limpa_conta after update of excluido_em on public.membros for each row execute function public.push_limpa_conta();

-- 8. Correções da revisão (QA noite B). Também rodam de novo sem problema.
--    a) quem recebe só é avisado do que consegue ver: "também comentou" e curtida no seu comentário passam a conferir
--       se você ainda vê a publicação (deixou de ser amigo, virou "próximos", foi arquivada, story vencido);
--    b) menção num post/story que você não vê (ex.: só para próximos) não vira aviso;
--    c) coluna da v9 (estilo.coluna é um objeto com o título em "tit") avisa como "Colunas", com o título;
--    d) autor suspenso ou com conta excluída não gera aviso para quem segue;
--    e) post novo: confere primeiro se o seguidor ligou o aviso (rápido) e só depois se ele vê o post;
--    f) excluir a conta nunca falha por causa dos avisos.

-- são amigos? (o sao_amigos do app só responde para quem está logado e é uma das duas pessoas; nos gatilhos quem
-- está logado é quem fez a ação — quem comentou, quem curtiu —, então aqui a conferência é direta)
create or replace function public.push_amigos(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_a is not null and p_b is not null and exists (select 1 from public.amizades
    where status = 'aceita' and ((de = p_a and para = p_b) or (de = p_b and para = p_a)))
$$;

-- a pessoa vê esta publicação agora? (as regras de leitura, mais arquivado e story vencido)
create or replace function public.push_ve_pub(p_quem uuid, p_pub uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare j jsonb;
begin
  select to_jsonb(p) into j from public.publicacoes p where p.id = p_pub;
  if j is null then return false; end if;
  if (j->>'autor')::uuid = p_quem then return true; end if;
  if coalesce(j->>'arquivado', 'false') = 'true' then return false; end if;
  if j->>'tipo' = 'story' and coalesce((j->>'expira')::bigint, 0) <= (extract(epoch from now())*1000)::bigint then return false; end if;
  return public.push_pode_ver(p_quem, (j->>'autor')::uuid, j->>'publico');
end $$;

create or replace function public.push_pode_ver(p_quem uuid, p_autor uuid, p_publico text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare pub text := coalesce(p_publico, 'amigos');
begin
  if p_quem is null or p_autor is null then return false; end if;
  if p_quem = p_autor then return true; end if;
  if exists (select 1 from public.membros m where m.uid = p_autor and (m.suspenso_em is not null or m.excluido_em is not null)) then return false; end if;
  if exists (select 1 from public.bloqueios b where (b.de = p_quem and b.para = p_autor) or (b.de = p_autor and b.para = p_quem)) then return false; end if;
  if public.push_amigos(p_quem, p_autor) and (pub in ('amigos', 'seguidores', 'todos', 'publico')
       or exists (select 1 from public.melhores_amigos m where m.dono = p_autor and m.amigo = p_quem)) then return true; end if;
  -- quem só segue (v9): vê o que é "para seguidores" enquanto o perfil do autor estiver aberto
  if pub in ('seguidores', 'todos', 'publico') and exists (select 1 from public.push_seguidores_de(p_autor) s(u) where s.u = p_quem) then
    begin
      return exists (select 1 from public.membros m where m.uid = p_autor and coalesce((to_jsonb(m) ->> 'perfil_aberto')::boolean, false));
    exception when others then return false;
    end;
  end if;
  return false;
end $$;

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

create or replace function public.push_t_reacoes() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; n text; oque text; o uuid;
begin
  begin
    select id, autor, tipo, estilo into p from public.publicacoes where id = new.pub;
    if not found then return null; end if;
    n := public.push_nome(new.uid);
    oque := case when p.tipo = 'story' then 'seu story' when coalesce(p.estilo->>'reel', '') in ('true', '1') then 'seu reel' else 'seu post' end;
    if new.tipo = 'comentario' then
      perform public.push_enfileirar(p.autor, 'comentarios', new.uid, 'cmt:' || new.pub, n || ' comentou no ' || oque,
        coalesce(new.valor->>'texto', ''), '?nt=comentarios:' || new.pub);
      for o in select distinct r.uid from public.pub_reacoes r
                where r.pub = new.pub and r.tipo = 'comentario' and r.uid <> new.uid and r.uid <> p.autor limit 30 loop
        if public.push_quer(o, 'comentarios') and public.push_ve_pub(o, new.pub) then
          perform public.push_enfileirar(o, 'comentarios', new.uid, 'cmt:' || new.pub, n || ' também comentou no post de ' || public.push_nome(p.autor),
            coalesce(new.valor->>'texto', ''), '?nt=comentarios:' || new.pub);
        end if;
      end loop;
    elsif new.tipo = 'curtida' then
      perform public.push_enfileirar(p.autor, 'curtidas', new.uid, 'curt:' || new.pub, n || ' curtiu ' || oque, '', '?nt=atividade');
    end if;
  exception when others then null;
  end;
  return null;
end $$;

create or replace function public.push_t_com_curtidas() returns trigger
language plpgsql security definer set search_path = public as $$
declare tx text; pid text;
begin
  begin
    if new.pub is not null then
      -- quem escreveu o comentário ainda vê o post?
      if not public.push_ve_pub(new.autor, new.pub) then return null; end if;
      select valor->>'texto' into tx from public.pub_reacoes where pub = new.pub and uid = new.autor and tipo = 'comentario' and chave = new.cid;
    else
      select d.data->'itens'->new.cid->>'texto', d.data->'itens'->new.cid->>'pid' into tx, pid
        from public.docs d where d.path = 'comentarios/' || new.autor::text;
    end if;
    perform public.push_enfileirar(new.autor, 'curtidas', new.uid, 'cc:' || new.cid, public.push_nome(new.uid) || ' curtiu seu comentário',
      coalesce(tx, ''), case when new.pub is not null then '?nt=comentarios:' || new.pub when pid is not null then '?nt=noticia:' || pid else '?nt=atividade' end);
  exception when others then null;
  end;
  return null;
end $$;

create or replace function public.push_t_publicacoes() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new); n text; orig uuid; oa uuid; f uuid; col boolean; tx text; tit text; tp text;
begin
  begin
    if new.tipo = 'story' or coalesce(j->>'arquivado', 'false') = 'true' then return null; end if;
    if exists (select 1 from public.membros m where m.uid = new.autor and (m.suspenso_em is not null or m.excluido_em is not null)) then return null; end if;
    n := public.push_nome(new.autor);
    tx := btrim(coalesce(new.texto, ''));
    if new.estilo->'rp'->>'k' = 'pub' and (new.estilo->'rp'->>'id') ~* '^[0-9a-f-]{36}$' then
      orig := (new.estilo->'rp'->>'id')::uuid;
      select autor into oa from public.publicacoes where id = orig;
      if oa is not null and oa <> new.autor and public.push_pode_ver(oa, new.autor, j->>'publico') then
        perform public.push_enfileirar(oa, 'reposts', new.autor, 'rp:' || orig,
          n || case when tx = '' then ' repostou sua publicação' else ' citou sua publicação' end, tx, '?nt=pub:' || new.id);
      end if;
    end if;
    -- coluna: a da v9 tem estilo.coluna = {tit, linha, …}; as outras formas ficam valendo
    col := new.tipo = 'coluna' or jsonb_typeof(new.estilo->'coluna') = 'object' or coalesce(new.estilo->>'coluna', '') in ('true', '1')
           or new.estilo->>'tipo' = 'coluna' or new.estilo->>'kind' = 'coluna';
    tit := coalesce(nullif(btrim(case when jsonb_typeof(new.estilo->'coluna') = 'object' then new.estilo->'coluna'->>'tit' end), ''),
                    nullif(btrim(new.estilo->>'titulo'), ''), tx);
    tp := case when col then 'colunas' else 'seguindo' end;
    for f in select * from public.push_seguidores_de(new.autor) limit 300 loop
      if f is distinct from oa and f <> new.autor and public.push_quer(f, tp) and public.push_pode_ver(f, new.autor, j->>'publico') then
        perform public.push_enfileirar(f, tp, new.autor, 'seg:' || new.autor,
          n || case when col then ' publicou uma coluna' else ' publicou' end, tit, '?nt=pub:' || new.id);
      end if;
    end loop;
  exception when others then null;
  end;
  return null;
end $$;

create or replace function public.push_limpa_conta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.excluido_em is not null and old.excluido_em is null then
    begin
      delete from public.push_inscricoes where uid = new.uid;
      delete from public.push_fila where para = new.uid or de = new.uid;
    exception when others then null;
    end;
  end if;
  return null;
end $$;

revoke all on function public.push_amigos(uuid, uuid), public.push_ve_pub(uuid, uuid), public.push_pode_ver(uuid, uuid, text), public.push_t_mensagens(), public.push_t_reacoes(),
  public.push_t_com_curtidas(), public.push_t_publicacoes(), public.push_limpa_conta() from public, anon, authenticated;
