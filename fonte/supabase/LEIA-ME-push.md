# Avisos no celular (Web Push) — passo a passo para ligar

Uns 10 minutos, uma vez só. Enquanto você não fizer isto, o app continua funcionando: as bolinhas e os números dentro do app
e o número no ícone já valem. Em Perfil › Conta › Notificações, a parte "Avisos no celular" só aparece depois do passo 1 e,
até o passo 3, mostra "Ainda não ativado pelo administrador".

Nenhuma chave secreta vai para o repositório nem para o SQL. A chave **privada** do VAPID fica só nos segredos da função, no painel do Supabase.

## 1. Rodar o SQL v10 (1 min)

Antes, se a v9 ("Seguir") ainda não foi rodada no Supabase, rode a v9 primeiro (`fonte/sql/publicacoes-v9.sql`): a ordem certa é
**v9 e depois v10**. A v10 funciona sem a v9, mas aí não há avisos de novos seguidores nem de posts e colunas de quem você segue.

Supabase › **SQL Editor** › **New query** › cole todo o `fonte/sql/publicacoes-v10.sql` › **Run**.
Pode rodar de novo sem problema. Se a v9 for rodada **depois**, rode a v10 outra vez (liga o aviso de novo seguidor).
Se você já tinha rodado uma v10 anterior a 04/11, rode esta de novo: ela traz as correções da revisão (parte 8 do arquivo).

## 2. Gerar as chaves VAPID (1 min)

No seu computador, com o Node instalado:

```
npx web-push@3.6.7 generate-vapid-keys
```

Saem duas linhas: **Public Key** (87 caracteres) e **Private Key** (43 caracteres). Guarde a privada como senha: não mande
por e-mail, não cole no repositório. Se ela vazar, gere outro par e refaça os passos 3 e 5 (os celulares se reinscrevem sozinhos
quando a pessoa abre a página Notificações).

## 3. Gravar a chave PÚBLICA no banco (1 min)

SQL Editor › New query (troque pelo valor da Public Key):

```sql
insert into public.config_app(chave, valor) values ('push_vapid_publica', jsonb_build_object('chave', 'COLE_A_PUBLIC_KEY'))
  on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
```

O app lê na hora (não precisa publicar o site de novo).

## 4. Publicar a função `enviar-push` (3 min)

No terminal, dentro da pasta `fonte/` do repositório:

```
npx supabase@latest login
npx supabase@latest functions deploy enviar-push --project-ref kkzcljusiotoklldaupg --use-api
```

(`--use-api` monta a função nos servidores do Supabase, sem precisar de Docker.) Os arquivos são
`fonte/supabase/functions/enviar-push/index.ts` e `logica.mjs`.
Se for usar o jeito **B** do passo 6, acrescente `--no-verify-jwt` no fim desse comando.

## 5. Guardar os segredos da função (2 min)

Supabase › **Edge Functions** › **Secrets** (em alguns painéis: Project Settings › Edge Functions) › **Add new secret**, três vezes:

| Nome | Valor |
| --- | --- |
| `VAPID_PUBLIC` | a Public Key do passo 2 |
| `VAPID_PRIVATE` | a Private Key do passo 2 |
| `VAPID_SUBJECT` | `mailto:` seguido de um e-mail seu (ex.: `mailto:voce@exemplo.com`) |

O `SUPABASE_URL` e o `SUPABASE_SERVICE_ROLE_KEY` o Supabase já entrega à função; não crie.

## 6. Ligar a fila à função (2 min) — escolha UM dos jeitos

**A. Database Webhook (recomendado).** Supabase › **Integrations** › **Database Webhooks** (ou Database › Webhooks) ›
**Create a new hook**:

- Name: `push_fila_enviar`
- Table: `push_fila` · Events: só **Insert**
- Type: **Supabase Edge Functions** · Function: `enviar-push` · Method: POST · Timeout: 5000
- HTTP Headers: clique em **Add auth header with service key** (o painel guarda a chave; ela não aparece no seu SQL)
- **Create webhook**

**B. pg_net pelo SQL (alternativa).** Database › **Extensions** › ligue `pg_net`. Publique a função com `--no-verify-jwt` (passo 4).
Depois, no SQL Editor (troque o endereço do projeto):

```sql
insert into public.config_app(chave, valor) values ('push_funcao_url', jsonb_build_object('url', 'https://kkzcljusiotoklldaupg.supabase.co/functions/v1/enviar-push'))
  on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
```

Não vai chave nenhuma no pedido. Não há risco: a função não aceita nada de quem chama, só envia o que já está na fila
(chamar à toa, no máximo, adianta o envio do que já ia sair).

Não ligue os dois jeitos ao mesmo tempo (não duplicaria aviso, mas chamaria a função duas vezes).

## 7. (Opcional) Avisos das coberturas seguidas

As atualizações das coberturas vêm do `feed.json`, não do banco. Para avisar quem segue, agende a função a cada 15 minutos:
Supabase › **Integrations** › **Cron** › **Create job** › Name `push_coberturas` › Schedule `*/15 * * * *` ›
Type **Supabase Edge Function** › `enviar-push` › Method POST › HTTP Headers: **Add auth header with service key**
(sem ele a função responde 401, a não ser que você tenha publicado com `--no-verify-jwt`) › Body `{"modo":"coberturas"}` › Create.
Na primeira vez, ela só olha a última hora (não manda avisos antigos).

## 8. Testar (2 min)

1. No celular, abra o Prumo. No **iPhone**, precisa estar na Tela de Início (Safari › Compartilhar › Adicionar à Tela de Início;
   iOS 16.4 ou mais novo) e aberto por lá.
2. Perfil › Conta › **Notificações** › **Ativar notificações neste aparelho** › permita. Ligue **Mensagens** na coluna "Celular".
3. **Mostrar um aviso de teste** confere que o celular mostra avisos do Prumo (esse sai do próprio aparelho).
4. Para testar o caminho todo, no SQL Editor (troque o nome se for outro):

```sql
select public.push_enfileirar((select uid from public.membros where nome = 'Pedro Brandão'), 'mensagens', null,
  'teste', 'Teste do Prumo', 'Se este aviso chegou, está tudo certo.', '?nt=atividade');
```

Em alguns segundos o aviso chega. Se não chegar: Edge Functions › `enviar-push` › **Logs** (a função diz o que faltou, por exemplo
"faltam os segredos VAPID"), e veja a fila:

```sql
select estado, count(*) from public.push_fila group by 1;
```

`enviado` = saiu; `sem_destino` = ninguém ligou aquele tipo (ou o aparelho não é de um serviço de push conhecido); `agrupado` = juntou com um aviso de menos de 2 minutos da mesma
conversa ou post; `falhou` = o serviço de push recusou (veja os Logs); `pendente` parado = o webhook (passo 6) não está chamando.

## Como funciona

- Cada pessoa liga, **aparelho por aparelho**, o que quer receber (tudo começa desligado): Mensagens, Pedidos de amizade,
  Comentários e respostas, Menções, Curtidas, Reposts, Novos seguidores, Posts de quem você segue, Coberturas que você segue, Colunas
  (os três do "Seguir" só aparecem com a v9).
- Os gatilhos do banco põem um aviso na fila só se a pessoa ligou aquele tipo em algum aparelho, se ninguém bloqueou ninguém e se
  quem recebe consegue ver a publicação. Um erro no aviso nunca impede a mensagem, a curtida ou o post de ser gravado.
- A função manda no máximo 1 aviso por tipo e por conversa/post a cada 2 minutos; o aviso novo substitui o anterior na tela.
- Aparelho que não existe mais (o serviço de push responde 404/410) é apagado sozinho. A fila se limpa depois de 3 dias.
  `falhou` não é tentado de novo (o próximo aviso daquela conversa ou post sai normalmente).
- A função só manda para os serviços de push dos navegadores (Google, Mozilla, Apple e Windows); qualquer outro endereço é ignorado.
- **Sair da conta** (Perfil › Sair) tira aquele aparelho dos avisos: depois de sair, o celular não recebe mais nada da conta.
  Ao entrar de novo, é só tocar em **Ativar notificações neste aparelho** (as escolhas de cada tipo continuam guardadas).
- O número no ícone que chega com o aviso respeita "Número no ícone do app" e as escolhas "No app"; com o app aberto, vale o
  número que o app mostra.
- O texto da mensagem aparece no aviso (como em qualquer app de conversa). Quem não quiser pode deixar "Mensagens" desligado no celular.

## Como desligar

- **Um aparelho:** Perfil › Conta › Notificações › **Desativar neste aparelho**.
- **Tudo, para todos:** apague o webhook (Integrations › Database Webhooks › `push_fila_enviar` › Delete) e, se fez o jeito B,
  `delete from public.config_app where chave = 'push_funcao_url';`. Para o app também esconder o botão de ativar:
  `delete from public.config_app where chave = 'push_vapid_publica';`. Para apagar os aparelhos guardados:
  `delete from public.push_inscricoes;`. As bolinhas dentro do app continuam (elas não dependem disto).
