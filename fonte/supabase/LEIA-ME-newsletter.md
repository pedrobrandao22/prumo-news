# Colunas públicas e newsletter por e-mail — passo a passo para ligar

Uns 30 minutos, uma vez só (a maior parte é esperar o DNS). Enquanto você não fizer isto, o app continua igual: a opção
"Todos (link público)" e a newsletter só aparecem depois do passo 1, e os e-mails só saem depois do passo 7.

Nenhuma chave vai para o repositório nem para o SQL (o repositório é público). A chave do Resend fica **só** nos
segredos da função, no painel do Supabase. Não cole a chave em conversa, e-mail ou arquivo.

## 1. Rodar o SQL v14 (1 min)

Precisa da v13 já rodada (a ordem é v12, v13, v14). Supabase › **SQL Editor** › **New query** › cole todo o
`fonte/sql/publicacoes-v14.sql` › **Run**. Pode rodar de novo sem problema.

A partir daí, no app, a autora já vê "Todos (link público)" em "Antes de publicar", e o robô do GitHub
(`.github/workflows/colunas.yml`, a cada 15 minutos) passa a gravar as páginas abertas em `prumonews.com.br/c/`.
Para não esperar: GitHub › **Actions** › **Colunas públicas** › **Run workflow**.

## 2. Criar a conta no Resend (3 min)

Entre em **resend.com** › **Sign up** (dá para entrar com a conta do Google). O plano grátis manda até 3.000 e-mails
por mês (100 por dia). Não precisa de cartão.

## 3. Verificar o domínio prumonews.com.br (5 min + espera do DNS)

1. Resend › **Domains** › **Add Domain** › digite `prumonews.com.br` › região **São Paulo (sa-east-1)** › **Add**.
2. O Resend mostra uma lista de registros DNS (normalmente: um **MX** e um **TXT** em `send`, um **TXT** em
   `resend._domainkey` e, opcional, um **TXT** em `_dmarc`). Copie **exatamente** o que ele mostrar.
3. No painel onde o domínio é administrado (onde você aponta o prumonews.com.br para o GitHub Pages: Registro.br,
   Cloudflare etc.) › DNS › **adicione** cada registro com o mesmo tipo, nome e valor. Não apague nem mude os registros
   que já existem (os do site continuam iguais: os do Resend ficam em `send` e `resend._domainkey`).
4. Volte ao Resend › **Verify DNS Records**. Pode levar de alguns minutos a algumas horas. Quando ficar **Verified**, siga.

## 4. Criar a chave do Resend (1 min)

Resend › **API Keys** › **Create API Key** › Name `prumo-newsletter` › Permission **Sending access** › Domain
`prumonews.com.br` › **Add**. A chave (começa com `re_`) aparece **uma vez só**: deixe a janela aberta para o passo 6.

## 5. Publicar a função `enviar-newsletter` (3 min)

No terminal, dentro da pasta `fonte/` do repositório:

```
npx supabase@latest login
npx supabase@latest functions deploy enviar-newsletter --project-ref kkzcljusiotoklldaupg --use-api
```

Os arquivos são `fonte/supabase/functions/enviar-newsletter/index.ts` e `logica.mjs`.

## 6. Guardar os segredos da função (2 min)

Supabase › **Edge Functions** › **Secrets** › **Add new secret**:

| Nome | Valor |
| --- | --- |
| `RESEND_API_KEY` | a chave do passo 4 (`re_…`) |
| `NEWSLETTER_REMETENTE` | `Prumo <colunas@prumonews.com.br>` (qualquer endereço do domínio verificado) |

Opcionais: `NEWSLETTER_SITE` (padrão `https://prumonews.com.br`) e `NEWSLETTER_RESPONDER` (um e-mail seu para receber
pedidos de cancelamento por e-mail; o link de cancelar funciona sem ele). Depois de guardar, feche a janela do Resend:
a chave não precisa ficar em mais lugar nenhum. O `SUPABASE_URL` e o `SUPABASE_SERVICE_ROLE_KEY` o Supabase já entrega.

## 7. Ligar a fila à função (3 min) — os DOIS

**A. Database Webhook (e-mails de confirmação e colunas saem na hora).** Supabase › **Integrations** › **Database Webhooks**
› **Create a new hook**:

- Name: `newsletter_enviar`
- Table: `newsletter_disparo` · Events: só **Insert** (é uma linha por pedido de confirmação e por coluna; não por e-mail)
- Type: **Supabase Edge Functions** · Function: `enviar-newsletter` · Method: POST · Timeout: 10000
- HTTP Headers: **Add auth header with service key** › **Create webhook**

**B. Agendamento de 5 em 5 minutos (os e-mails das colunas esperam a página aberta ficar pronta).** Supabase ›
**Integrations** › **Cron** › **Create job** › Name `newsletter_rodada` › Schedule `*/5 * * * *` › Type **Supabase Edge
Function** › `enviar-newsletter` › Method POST › HTTP Headers: **Add auth header with service key** › Body `{}` › Create.

Por que os dois: o e-mail de uma coluna espera 10 minutos e só sai quando a página `prumonews.com.br/c/…` já está no ar
(o robô do GitHub roda a cada 15 minutos; depois de 3 horas, sai mesmo assim). O agendamento é quem manda nessa hora.
Ele também cobre a coluna agendada que chegou à hora. A função não aceita nada de quem chama: só manda o que já está na fila.

## 8. Testar (5 min)

1. No app, escreva uma coluna curta e, em "Antes de publicar", escolha **Todos (link público)** › Publicar.
2. GitHub › Actions › **Colunas públicas** › Run workflow. Em 1 minuto a página abre em `prumonews.com.br/c/` (a lista)
   e o "Copiar link" da coluna dá o endereço dela. Cole o link no LinkedIn ou no WhatsApp para ver a prévia.
3. Na página aberta, em **Assinar por e-mail**, use um e-mail seu. Chega o e-mail "Confirme…" em segundos; toque em
   **Confirmar a assinatura**.
4. Publique outra coluna pública. Uns 15 a 25 minutos depois, ela chega no seu e-mail, com "Leia a coluna completa" e
   "Cancelar a assinatura" no fim.
5. Se algo não chegou, Edge Functions › `enviar-newsletter` › **Logs** (a função diz o que faltou, por exemplo
   "faltam os segredos") e, no SQL Editor:

```sql
select tipo, estado, count(*), max(erro) from public.newsletter_fila group by 1, 2;
```

`enviado` = saiu; `pendente` com `liberar_em` no futuro = esperando a página ou uma nova tentativa; `pendente` parado há
muito tempo = o webhook/agendamento (passo 7) não está chamando; `falhou` = o Resend recusou (o erro está na coluna `erro`;
o mais comum é o domínio ainda não verificado); `cancelado` = a pessoa cancelou ou a coluna deixou de ser pública.
No Resend › **Emails** dá para ver cada envio.

## Como funciona (para explicar a quem perguntar)

- A autora escolhe, coluna por coluna. Só colunas "Todos (link público)" já publicadas ganham página; agendada só quando
  sai; arquivada, apagada, de volta para "Amigos" ou de conta suspensa sai do ar na próxima rodada do robô (até 15 min).
- A página aberta mostra só: título, linha fina, texto, fotos e capa, série, data, hashtags, nome e foto da autora (a foto
  só se o perfil for aberto). Comentários e curtidas continuam só dentro do Prumo. O HTML é limpo de novo no robô.
- As fotos são copiadas para o próprio site (`c/f/`), com nome embaralhado. O Storage só deixa ler sem login as fotos que
  estão numa coluna pública; fechou a coluna, a regra fecha na hora e o robô apaga a cópia.
- Newsletter: quem assina pela página recebe primeiro um e-mail para confirmar (sem confirmar, nada chega; o link vale 7 dias).
  Membro do Prumo assina pelo perfil da autora com 1 toque, usando o e-mail da conta só depois de marcar que concorda.
  Todo e-mail tem "Cancelar a assinatura" (um toque, sem senha) e o cabeçalho de cancelar que o Gmail e o Outlook mostram.
- Limites: 3 pedidos por hora (6 por dia) para o mesmo e-mail, 20 por hora para a mesma autora e 60 por hora no total
  (para ninguém gastar a cota grátis do Resend com pedidos falsos). Ninguém lista os
  assinantes; a autora vê quantos são em "Minhas colunas" e baixa a lista dos confirmados (CSV) — o texto da assinatura avisa isso.
- LGPD: o e-mail serve só para mandar as colunas da autora escolhida. Pedido sem confirmar some depois de 30 dias; quem
  cancela não recebe mais nada; conta excluída sai das listas. O registro de cada envio fica 90 dias.
- Grátis do Resend: 100 e-mails por dia. Se uma autora passar de ~90 assinantes, os excedentes do dia ficam "pendentes" e o
  Resend recusa (erro 429): a função tenta de novo mais 2 vezes (15 e 30 minutos depois) e então marca "falhou". Se crescer,
  o plano pago do Resend resolve sem mudar nada aqui.

## Como desligar

- **Uma coluna:** no app, menu "…" da coluna › **Quem pode ler** › Amigos.
- **Os e-mails, para todos:** apague o webhook `newsletter_enviar` e o job `newsletter_rodada` (passo 7). As assinaturas ficam guardadas.
- **As páginas abertas:** GitHub › Actions › Colunas públicas › "…" › **Disable workflow**, e apague a pasta `c/` do repositório.
- **Trocar a chave do Resend** (se vazar): Resend › API Keys › apague a antiga e crie outra › troque o segredo `RESEND_API_KEY`.
