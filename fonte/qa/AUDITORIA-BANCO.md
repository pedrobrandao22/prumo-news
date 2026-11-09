# Auditoria de segurança do banco — Prumo News (09/11/2026)

Auditoria feita como auditor externo sobre o estado do banco **até a v14** (o que já roda em produção), lendo o SQL consolidado
(`prumo-supabase.sql`) e as regras de Storage que só existem nas versões (`sql/publicacoes-v1/v2/v6/v7/v8/v9/v14.sql`).
Cada achado foi **provado** num Postgres de verdade (PGlite), com usuários de teste nos papéis `anon` e `authenticated`
(conta só logada, membro comum, amigo, estranho, administrador, conta suspensa e conta excluída).

- Correções: `sql/seguranca-2026-11-09.sql` (rodar no SQL Editor **depois da v14**; pode rodar de novo). O mesmo texto está no fim de `prumo-supabase.sql`.
- Cópia de antes: `sql/prumo-supabase.antes-seg.sql` (é o banco "antes" do teste).
- Teste: `review2/t_seguranca_banco.js` (sem navegador, ~20 s). Cada achado roda no banco de antes (tem de mostrar o problema)
  e no de depois (tem de estar corrigido), mais os fluxos que têm de continuar funcionando.

Nada foi rodado no Supabase de verdade. Nenhuma chave foi usada nem pedida.

## Achados

Gravidade: **crítica** (dado de todo mundo exposto sem login ou tomada de conta), **alta** (dado privado de outra pessoa exposto),
**média** (abuso que afeta outras pessoas ou o serviço, ou dado pessoal guardado sem necessidade), **baixa** (defesa em profundidade, efeito pequeno).

Não foi encontrado nenhum achado **crítico**: RLS está ligado em todas as 28 tabelas (29 com a nova `freio_eventos`), nenhuma tabela é lida por `anon`,
nenhuma view, nenhuma extensão em `public`, `auth.users` só é lido por funções que conferem o administrador ou a própria pessoa,
e todas as funções de administração conferem `e_admin()`.

| id | gravidade | o que um atacante consegue | prova (no teste) | correção | status |
|---|---|---|---|---|---|
| A1 | **alta** | Qualquer conta **só logada** (basta criar o login, sem convite) ou membro estranho chama `midia_em_uso('texto')` e descobre se aquele texto aparece no **rascunho de coluna de qualquer pessoa** (a função procura dentro de `coluna_rascunhos.dados`). Repetindo, dá para ler o rascunho letra por letra; também revela nomes de fotos privadas. | A1: `midia_em_uso('segredo do cofre')` ≠ `midia_em_uso('zz-nao-existe-zz')` para o estranho | Só o administrador recebe a resposta real; para os outros a resposta é sempre "em uso" (fechado: a regra de limpeza do Storage nunca libera nada para eles). | corrigido |
| A2 | média | Sem conta nenhuma, pedir assinatura da newsletter com e-mails diferentes: até 60 e-mails de confirmação por hora (1.440 por dia) para endereços de terceiros. Gasta a cota do Resend (100/dia no grátis) e trava o envio das colunas para os assinantes de verdade. | A2: 15 pedidos do mesmo endereço de internet aceitos; 51º pedido do dia aceito | Até 10 pedidos por hora e 20 por dia do mesmo endereço de internet (guardado só como md5, apagado em 2 dias) e 50 por dia no total. | corrigido |
| A3 | média | Membro faz "pedir amizade → cancelar" (ou "seguir → deixar de seguir") em ciclo: **cada volta manda um aviso no celular** da vítima, sem fim (os limites antigos contavam só as linhas que sobravam). Assédio. | A3: 55 avisos de pedido e 155 de "começou a seguir" | Freio por pessoa: 50 pedidos de amizade novos e 150 "seguir" por dia. | corrigido |
| A4 | média | Publicar sem limite (posts, reels, stories; até ~60 KB por linha) — cada post avisa até 300 seguidores. Enche o banco e o celular dos outros. | A4: 65 posts seguidos | 60 publicações por hora e 300 por dia por pessoa. | corrigido |
| A5 | média | Curtida em publicação aceitava qualquer `chave` e `valor` (até 4 KB): a mesma pessoa gravava curtidas sem fim no mesmo post, e curtir/descurtir em ciclo mandava aviso a cada vez. | A5: 5 curtidas da mesma pessoa no mesmo post (3 KB cada) e 205 ciclos | Curtida só com `chave=''` e `valor={}` (regra nova, sem conferir as linhas antigas); 200 curtidas por hora (posts e comentários, cada); 1.000 comentários por dia. | corrigido |
| A6 | média (LGPD) | "Excluir conta" deixava no banco: rascunhos de coluna (texto inteiro), histórico de leituras de colunas, assinaturas de séries (dela e de outros nela), cópia do comentário e do nome nos destaques de colunas e o e-mail dela nas newsletters assinadas pelo app (só "cancelado"). | A6: 5 linhas sobrando depois de `excluir_conta()` | Gatilho na exclusão apaga tudo isso (o e-mail digitado de outra pessoa fica, mas sem ligação com a conta). | corrigido |
| A7 | média | Storage sem cota: um membro enche sozinho o espaço do plano (fotos de 1 MB e vídeos de 15 MB, sem limite de quantidade). | A7: passou de 300 fotos no mesmo dia | Até 2.000 fotos e 60 vídeos guardados por pessoa; 300 fotos e 15 vídeos por dia (regra restritiva de envio). | corrigido (só roda onde existe Storage) |
| A8 | baixa | Permissões padrão do Supabase: toda tabela, sequência e função nova em `public` nasce com acesso total para `anon`. A `config_app` estava assim (SELECT/INSERT/UPDATE/DELETE/**TRUNCATE** para anon; só o RLS sem regras segurava, e TRUNCATE não passa pelo RLS — hoje não dá para chamar pela API, mas é um esquecimento de distância). | A8: `has_table_privilege('anon','config_app','TRUNCATE')`, tabela e função novas abertas a anon | `config_app` fechada; padrão novo sem `anon` (tabelas, sequências, funções) e sem `PUBLIC` em funções. Função nova para visitantes precisa de `grant ... to anon` explícito (as atuais têm). | corrigido |
| A9 | baixa (Advisor) | 19 funções sem `search_path` fixo (aviso "Function Search Path Mutable" do Security Advisor) e 100+ SECURITY DEFINER sem `pg_temp` no fim (troca por tabela temporária — só com acesso SQL). | A9: contagem no catálogo | Todas as funções do Prumo com `search_path = public, pg_temp` (as que tinham `auth` mantêm). | corrigido |
| A10 | baixa | Conta **suspensa** mandando um PATCH **sem filtro** (`update publicacoes set texto=…`) mudava o texto de todos os próprios posts e destaques, que os amigos continuam vendo. (Com filtro já não dava: a regra de leitura esconde.) | A10: post e destaque mudados pela conta suspensa | Regras restritivas: editar post e destaque só com a conta ativa. Apagar continua liberado. | corrigido |
| A11 | baixa | Avisos de erro sem limite — e o texto deles é lido **sem login** por `erros_abertos()`: um membro podia publicar texto à vontade num lugar público. | A11: 25 avisos seguidos | 10 por hora e 20 por dia por pessoa. | corrigido |
| A12 | baixa | "Quem viu o story": a hora vinha do app (dava para aparecer como visto em qualquer hora). | A12: `at = 1` gravado | A hora é a do servidor. | corrigido |
| A13 | baixa | Destaques sem limite de quantidade. | A13: 101 destaques | Até 100 por pessoa. | corrigido |
| A14 | baixa | `seg11_aberto(uid)` (interna) podia ser chamada direto por quem nem é membro: diz se o perfil de qualquer uid é aberto. | A14 | Só as funções de seguidores usam (sem acesso direto). | corrigido |

### Visto e deixado como está (decisão ou risco aceito — não muda nada sem o Pedro decidir)

| id | gravidade | o quê | por que ficou |
|---|---|---|---|
| N1 | baixa | `erros_abertos()` entrega a qualquer pessoa sem login o texto dos avisos de erro de 14 dias (sem o nome). | É de propósito (a rodada automática lê sem chave). Se um aviso tiver dado pessoal, ele fica público. Alternativa: a rodada usar a chave secreta e tirar o `anon`. |
| N2 | baixa (LGPD) | Excluir a conta mantém as **mensagens enviadas** (aparecem como "Conta excluída") e as **denúncias contra a pessoa** (com o trecho denunciado). | Decisão do app (a conversa do outro lado continua). Precisa estar escrito na política de privacidade. |
| N3 | baixa | Posts de conta **suspensa** continuam visíveis para os amigos (e ela continua aparecendo para eles). | Pode ser intencional (suspender = não entrar). Se a ideia é "sumir", é uma regra restritiva a mais na leitura. |
| N4 | baixa | Amigos e amigos de amigos leem a linha inteira de `membros` (inclui `papel`, `suspenso_em`, `cota_convites`, `convidado_por`). | O app lê a própria linha com essas colunas; fechar por coluna exige mudar o app. |
| N5 | baixa | Pequenos "oráculos" que as regras precisam: `pode_ver_membro(uid)` (dá para inferir bloqueio), `cdest_vivo(...)` (precisa do id do comentário). | São usadas dentro das regras de acesso; exigem chutar ids aleatórios. |
| N6 | baixa | `push_inscrever` com o endereço (endpoint) do aparelho de outra pessoa passa o aparelho para a conta de quem chamou. | O endpoint é secreto (URL aleatória do Google/Apple/Mozilla); só quem já tem acesso ao aparelho sabe. |
| N7 | baixa (LGPD) | E-mails que cancelaram a newsletter ficam guardados para sempre (como "cancelado"). | Serve de lista de "não mande". Se preferir, apagar cancelados com mais de 90 dias na `newsletter_varrer`. |
| N8 | baixa (LGPD) | As fotos e vídeos de quem exclui a conta são apagados pelo **app** antes de chamar `excluir_conta`; se o app falhar no meio, sobram arquivos (não abrem para ninguém e aparecem na limpeza do administrador). | O banco não apaga arquivo do Storage sozinho. Rodar a limpeza do administrador de vez em quando. |
| N9 | baixa | O limite por endereço de internet da newsletter usa `cf-connecting-ip` ou o 1º `x-forwarded-for`, que dá para falsificar em alguns caminhos. | O limite de 50 por dia no total segura o resto. Captcha na página seria o passo seguinte. |
| N10 | info | Realtime: só INSERT/UPDATE são publicados (DELETE desligado desde a leva 3), e as 8 tabelas publicadas têm regra de leitura — o tempo real respeita o RLS. Broadcast/Presence não são usados pelo app, mas qualquer pessoa com a chave publicável pode abrir um canal público de Broadcast (não vaza nada do banco). | Ver o item 9 da lista do painel. |

### Conferido e sem problema

- RLS ligado em todas as tabelas de `public` (inclusive as internas `push_fila`, `newsletter_*`, `config_app`, `freio_eventos`), sem regra nenhuma onde só as funções mexem.
- Nenhuma tabela tem permissão para `anon` (depois da correção A8); `authenticated` tem permissão por coluna onde só parte pode mudar (`membros.nome`, `mensagens.lida`, `publicacoes` texto/estilo/fixado/editado/corpo/publicar_em/fotos, `push_inscricoes.prefs`, `coluna_rascunhos.dados`).
- Gatilhos que não confiam no app: hora de mensagens, posts, stories, reações, curtidas, rascunhos, assinaturas e (agora) "quem viu"; post não nasce fixado/editado; fotos e vídeo só da pasta do autor; vídeo não muda na edição; quem recebe mensagem só marca "lida"; avisos de erro nascem "aberto"; nome sem caracteres invisíveis.
- Funções SECURITY DEFINER conferem `auth.uid()` / `e_membro()` / `e_admin()`; as que recebem uid de outra pessoa (`seg_contagem`, `seg_lista`, `seguidores_lista`, `newsletter_info`, `coluna_numeros`, `sao_amigos`…) só devolvem o que quem pede já poderia ver. Nenhuma devolve e-mail, a não ser `admin_membros` (só o administrador) e `newsletter_exportar` (só os confirmados da própria autora).
- Sem login só se chamam: `capa_fixa`, `colunas_publicas`, `coluna_publica`, `foto_de_coluna_publica`, `erros_abertos`, `newsletter_assinar`, `newsletter_confirmar`, `newsletter_cancelar` (o teste confere a lista exata).
- Newsletter não diz se um e-mail já assinava (não dá para descobrir quem assina); tokens de 64 caracteres aleatórios.
- Storage: buckets `fotos` e `videos` privados, com limite de tamanho e tipo; cada um grava e apaga só na própria pasta; fotos e vídeos só abrem para quem pode ver a publicação (inclusive Melhores amigos, story vencido, arquivado, agendado); foto de perfil só para quem vê o nome; sem login só a capa/fotos de coluna pública publicada.
- Excluir a conta apaga o login de verdade (`auth.users`) e os dados (com A6, o que sobrava).

## O que o Pedro deve conferir no painel do Supabase

1. **Rodar as correções**: SQL Editor › New query › colar `fonte/sql/seguranca-2026-11-09.sql` › Run (depois da v14). Tem de terminar sem erro.
   Se alguma versão futura recriar `midia_em_uso` ou funções sem `search_path`, rode este arquivo de novo.
2. **Advisors** (Database › Advisors › Security Advisor › Rerun): depois do passo 1, não deve sobrar "Function Search Path Mutable", "RLS Disabled in Public",
   "Security Definer View", "Extension in Public" nem "Policy Exists RLS Disabled". Se aparecer algo, mande o print. Avisos de Auth que podem sobrar
   (resolver no passo 3–5): "Leaked Password Protection Disabled" (só no plano Pro), "Auth OTP long expiry", "Insufficient MFA options".
   Olhe também o **Performance Advisor** (índices) uma vez.
3. **Auth › Sign In / Providers**: Email com **"Confirm email" ligado**; **"Allow anonymous sign-ins" desligado** (login anônimo vira "authenticated");
   provedores não usados (telefone, Google etc.) desligados; "Secure email change" ligado; senha mínima de 8 caracteres se o app aceitar.
4. **Auth › Attack Protection / Rate Limits**: ligar **Captcha** (Cloudflare Turnstile ou hCaptcha) no cadastro e no login; conferir os limites
   de e-mails por hora, de cadastros/logins por IP e de verificação. Hoje qualquer pessoa pode criar login (o convite só é conferido depois).
5. **Auth › URL Configuration**: Site URL = o endereço do Prumo; **Redirect URLs só os domínios do app**, sem curinga (`*`) e sem `localhost` em produção.
6. **Chaves (Settings › API Keys)**: no app, no site e no robô do GitHub **só a chave publicável** (`sb_publishable_…`, ou a "anon" antiga).
   A secreta (`sb_secret_…` / service_role) só nos *Secrets* das Edge Functions — nunca no repositório (ele é público), nunca no GitHub Actions
   se não for preciso. Se ela já apareceu em algum commit ou print, **gerar outra** e apagar a antiga. Conferido no repositório: só aparece a publicável.
7. **Data API (Settings › API)**: schemas expostos só `public` (e `graphql_public` se usar). Se o app não usa GraphQL, desligar a extensão `pg_graphql`.
8. **Extensões (Database › Extensions)**: `pg_net` e `pg_cron` (se ligadas) fora do schema `public` (o padrão é `extensions` / `cron`).
9. **Realtime (Project Settings › Realtime)**: o app só usa mudanças do banco (postgres_changes), que respeitam o RLS. "Allow public access" ligado
   deixa qualquer pessoa com a chave publicável usar Broadcast/Presence em canal público (não vaza dado do banco). **Não desligue sem mudar o app**
   (os canais dele são públicos e parariam).
10. **Storage**: buckets `fotos` (1 MB, jpeg/png/webp) e `videos` (15 MB, mp4/webm/quicktime) com "Public bucket" **desligado**. Em Policies devem
    aparecer: fotos_ler, fotos_enviar, fotos_apagar, fotos_perfil_ler, fotos_aberto_ler, fotos_coluna_publica_ler, videos_ler, videos_enviar,
    videos_apagar, midias_admin_ver, midias_admin_apagar e a nova **segur_cota_envio**.
11. **Edge Functions** `enviar-push` e `enviar-newsletter`: os segredos (`RESEND_API_KEY`, chave privada do VAPID) só em Secrets; elas podem ser
    chamadas sem chave porque só enviam o que já está na fila — mantenha assim (não ponha lógica que aceite dados de quem chama).
12. **Conta do painel**: MFA ligado na conta do Supabase e na do GitHub; senha do banco forte (Settings › Database); apagar usuários de teste em Auth › Users.
13. **Política de privacidade**: dizer o que fica depois de excluir a conta (mensagens enviadas como "Conta excluída", denúncias), que o texto
    dos avisos de erro é público, e como a newsletter guarda o e-mail (e o cancelamento).
14. **Limites novos** (ajuste se precisar, no próprio arquivo): newsletter 50 pedidos/dia no total; publicações 60/h e 300/dia; pedidos de amizade
    50/dia; seguir 150/dia; curtidas 200/h; comentários 1.000/dia; avisos de erro 20/dia; fotos 300/dia e 2.000 no total; vídeos 15/dia e 60 no total.
    Quem passa recebe o erro 54000 ("limite") e o app mostra a mensagem de erro de sempre.

## Testes

- Novo: `review2/t_seguranca_banco.js` (na lista do `testar.sh`, depois de `review2/t_teclado_app`).
- Rodados depois das correções: t_seguranca_banco, t_sqlv8, t_sqlv9, t_sqlv10, t_social, t_notificacoes, t_qa_noite_a, t_colunas_leitores,
  t_colunas_publicas, t_decisoes_0411, t_editor_coluna, t_etapa7 — resultado no relatório da rodada.
