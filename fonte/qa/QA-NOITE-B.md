# QA da noite — B: notificações (04/11/2026)

Escopo: bolinhas e números dentro do app (js/124), página Perfil › Conta › Notificações, gatilhos e regras do banco
(sql/publicacoes-v10.sql), função `enviar-push` (index.ts + logica.mjs), service worker (push e toque no aviso) e o LEIA-ME.
Testado como gente de verdade: duas pessoas e dois aparelhos da mesma pessoa pelo harness (PGlite), o service worker fora do
navegador, e a lógica da função no Node com a biblioteca de Web Push de verdade.

Correções: `app/src/js/126-qa-noite-b.js` + `app/src/css/41-qa-noite-b.css` (incluídos no fim, antes do 999), parte **8** no fim
de `sql/publicacoes-v10.sql` (a mesma coisa no fim de `prumo-supabase.sql`), `app/sw.js`, `supabase/functions/enviar-push/*`
e `supabase/LEIA-ME-push.md`. Testes: `review2/t_qa_noite_b.js` (novo) e blocos novos em `t_sqlv10.js` e `t_push_logica.js`.

Resumo: 23 problemas — 4 altos, 10 médios, 9 baixos. Corrigidos: 19 (os 4 altos, os 10 médios e 5 baixos). Ficam 4 baixos, anotados.

| id | gravidade | onde | situação |
| --- | --- | --- | --- |
| NB03 | alta | app (preferências) | corrigido |
| NB04 | alta | app (sair da conta) | corrigido |
| NB10 | alta | banco (gatilhos) | corrigido |
| NB11 | alta | banco (menção) | corrigido |
| NB01 | média | app (Atividade) | corrigido |
| NB02 | média | app (dois aparelhos) | corrigido |
| NB05 | média | app (bolinhas) | corrigido |
| NB06 | média | app (página Notificações) | corrigido |
| NB09 | média | app + banco (colunas) | corrigido |
| NB14 | média | função (segurança) | corrigido |
| NB16 | média | função (aviso em dobro) | corrigido |
| NB23 | média | LEIA-ME (coberturas) | corrigido |
| NB07 | média | service worker (número no ícone) | corrigido |
| NB15 | média | service worker (toque no aviso) | corrigido |
| NB08 | baixa | app (bolinha presa) | corrigido |
| NB12 | baixa | banco (excluir conta) | corrigido |
| NB13 | baixa | função (cortar texto) | corrigido |
| NB17 | baixa | banco (desempenho) | corrigido |
| NB18 | baixa | banco (autor suspenso) | corrigido |
| NB19 | baixa | app (seguir alguém novo) | anotado |
| NB20 | baixa | app (menção conta 2) | anotado |
| NB21 | baixa | função (falhou) | anotado (LEIA-ME) |
| NB22 | baixa | função (chamada sem chave) | anotado |

---

### NB03 — alta — Um aparelho desatualizado apaga as preferências mudadas no outro
- Passos: Pedro com o Prumo aberto no celular e no computador. No computador desliga "Curtidas" (No app) ou segue uma cobertura.
  Depois, no celular (que não recarregou), abre a Atividade.
- Esperado: as duas coisas ficam.
- Antes: abrir a Atividade grava o "visto" junto com as preferências **inteiras** do celular (velhas) por cima do banco — a escolha
  e a cobertura seguida no computador somem (o js/124 passou a gravar a cada abertura da Atividade, então isso ficou frequente).
- Correção: as preferências do banco são acompanhadas em tempo real e relidas na volta ao app; antes de gravar uma escolha das
  notificações o app relê o banco e junta (só a mudança feita aqui vai por cima; o "visto" fica com o maior dos dois).

### NB04 — alta — Sair da conta deixava o celular recebendo os avisos da conta
- Passos: ativar os avisos, ligar "Mensagens", Perfil › Sair. Outra pessoa manda mensagem.
- Esperado: o aparelho não recebe mais nada daquela conta.
- Antes: a inscrição continuava no banco e no navegador; o aviso, com o texto da mensagem, chegava no aparelho já sem a conta.
- Correção: "Sair" apaga a inscrição deste aparelho no banco e cancela a inscrição do navegador (antes de deslogar). A página
  Notificações avisa: "Ao sair da conta, este aparelho deixa de receber os avisos."

### NB10 — alta — "Também comentou" e curtida no comentário avisavam quem não vê mais o post
- Passos: Gil comenta no post da Eva; a Eva desfaz a amizade com o Gil (ou arquiva o post, ou é story vencido); a Fabi comenta.
- Esperado: o Gil não recebe aviso (o texto do comentário da Fabi não pode chegar a quem não vê o post).
- Antes: o aviso entrava na fila com o texto. Além disso, a conferência de amizade (`sao_amigos`) só responde quando quem está
  logado é uma das duas pessoas — nos gatilhos quem está logado é quem comentou/curtiu, então a regra de "consegue ver" ficava errada.
- Correção: `push_amigos` (conferência direta) e `push_ve_pub` (regras de leitura + arquivado + story vencido); "também comentou"
  e curtida em comentário de post só avisam quem vê o post.

### NB11 — alta — Menção num post "só próximos" avisava quem não está nos próximos
- Passos: Eva publica para "Próximos" e menciona o Gil, que é amigo mas não está nos próximos.
- Esperado: sem aviso (o Gil não vê o post).
- Antes: o aviso "Eva mencionou você" saía com o texto do post.
- Correção: menção em post/story do Prumo (`pid` "u:…") só vira aviso se a pessoa vê a publicação. Menção em notícia continua.

### NB01 — média — Novo seguidor aparecia duas vezes e contava 2
- Passos: com a v9, a Dani começa a seguir o Pedro. Pedro olha a Atividade e as bolinhas.
- Esperado: "Dani começou a seguir você" uma vez, em "Novos seguidores".
- Antes: aparecia duas vezes (o item do js/123 e o do js/124) e a bolinha contava 2 — um deles como "outros", que nenhuma
  escolha desliga.
- Correção: fica um item só, contado como "Novos seguidores".

### NB02 — média — O outro aparelho só sabia do "visto" e das escolhas ao recarregar
- Passos: dois aparelhos abertos; ver a Atividade no primeiro.
- Esperado: a bolinha some no segundo também.
- Antes: só depois de recarregar o segundo.
- Correção: as preferências do banco chegam em tempo real (e na volta ao app); bolinhas e página Notificações se redesenham.

### NB05 — média — Abrir o destino não apagava a bolinha daquele item
- Passos: Bia comenta no post do Pedro; Pedro toca no aviso (ou abre os comentários do post pelo feed).
- Esperado: a bolinha daquele comentário some (as outras novidades continuam).
- Antes: só abrir a Atividade apagava (tudo de uma vez).
- Correção: abrir os comentários de um post ou notícia, o post, o perfil (novo seguidor, amizade nova), a cobertura ou a conversa
  marca como vistos os itens da Atividade que levam ali. Vale nos dois aparelhos. O item continua na Atividade.

### NB06 — média — Tipo ligado no celular sem gravar nada
- Passos: avisos ativados; o servidor apaga o aparelho (o serviço de push respondeu 410, ou outra conta usou o mesmo navegador).
  Ligar "Mensagens" na coluna Celular.
- Esperado: grava (inscreve de novo, se for preciso).
- Antes: a chave ficava ligada na tela, mas nada era gravado (a atualização mexia em 0 linhas sem erro) e nenhum aviso chegava.
- Correção: se o servidor não tem mais o aparelho, inscreve de novo com as escolhas.

### NB09 — média — Coluna da v9 tratada como post comum
- Passos: Pedro segue o Caio (perfil aberto); o Caio publica uma coluna (estilo.coluna = {tit, linha…}).
- Esperado: "Caio publicou uma coluna: “título”", no tipo "Colunas" (no app e no celular).
- Antes: "Caio publicou", no tipo "Posts de quem você segue", sem o título; desligar "Colunas" não silenciava.
- Correção: app (126) e gatilho reconhecem a coluna da v9 e usam o título.

### NB14 — média — A função fazia pedido para qualquer endereço https inscrito
- Antes: qualquer membro podia inscrever um "aparelho" com endereço de um servidor qualquer; a função mandava POST para ele.
- Correção: `endpointOk` — só serviços de push dos navegadores (Google/FCM, Mozilla, Apple, Windows). O resto fica `sem_destino`.

### NB16 — média — Aviso em dobro com a fila acumulada
- Antes: cada chamada devolvia à fila o que estava "processando" havia mais de 5 minutos **desde a entrada na fila**. Com fila
  acumulada (função desligada um tempo, enxurrada de webhooks), uma chamada devolvia o que outra tinha acabado de pegar, e o aviso
  saía duas vezes.
- Correção: a hora em que a linha foi pega fica em `enviado_em` enquanto processa; só volta à fila o que foi pego há mais de 5 min.

### NB23 — média — LEIA-ME: o agendamento das coberturas sem o cabeçalho de autenticação
- Antes: o passo 7 não mandava "Add auth header with service key"; com a função publicada do jeito padrão, o agendamento
  receberia 401 e os avisos de cobertura nunca sairiam.
- Correção: passo 7 completo; passo 1 diz a ordem (v9 antes da v10) e pede para rodar a v10 de novo quem já tinha rodado a antiga.

### NB07 — média — Número no ícone vindo do aviso
- Antes: o service worker punha no ícone só o número de mensagens não lidas (o app mostra novidades + mensagens: o número caía),
  mesmo com "Número no ícone do app" desligado ou com o tipo desligado "No app".
- Correção: o app deixa para o service worker o que mostra (número, ligado/desligado, tipos desligados); com o app fechado cada
  aviso soma 1; com o app aberto, a página refaz o número certo.

### NB15 — média — Tocar no aviso com uma página de notícia aberta
- Antes: com uma página `m/….html` aberta (dentro do site), o toque mandava a ação para ela e não abria o app.
- Correção: só conta como "app aberto" a página principal; com duas janelas do app, usa a que está na frente.

### NB08 — baixa — Bolinha presa por item com hora no futuro
- Passos: cobertura seguida com atualização marcada no futuro (fuso errado no feed).
- Antes: a bolinha não apagava mesmo depois de abrir a Atividade (até a hora chegar).
- Correção: para contar, um item "do futuro" vale a hora em que o aparelho o viu pela primeira vez.

### NB12 — baixa — Excluir a conta podia falhar por causa dos avisos
- Correção: a limpeza dos aparelhos e da fila ao excluir a conta não derruba mais a exclusão.

### NB13 — baixa — Corte do texto partia emoji
- Antes: o corte de título/texto na função contava em unidades de UTF-16 e podia partir um emoji (caractere quebrado no aviso);
  sem conferência do tamanho total.
- Correção: corte por caractere, sem deixar junção/tom de pele solto, e o aviso todo em no máximo 3.000 bytes. O service worker
  também corta por caractere.

### NB17 — baixa — Post novo lento com muitos seguidores
- Antes: para cada seguidor, conferia se ele vê o post (o que relê a lista inteira de seguidores) antes de ver se ele quer o aviso.
- Correção: primeiro "quer esse aviso?" (rápido); só então a conferência de leitura.

### NB18 — baixa — Autor suspenso continuava avisando quem segue
- Correção: post de conta suspensa ou excluída não gera aviso.

### NB19 — baixa — anotado — Seguir alguém novo
- Ao começar a seguir alguém, até 12 posts dele dos últimos 30 dias que forem mais novos que a sua última visita contam como
  novidade em "Posts de quem você segue". Pequeno; fica anotado.

### NB20 — baixa — anotado — Menção conta duas vezes no número do ícone
- A menção (e o "curtiu seu story") chega como mensagem: conta nas Conversas (não lida) e na Atividade, como já acontecia no app.
  O número do ícone é coerente com o que aparece; fica anotado.

### NB21 — baixa — anotado — `falhou` não é tentado de novo
- Se o serviço de push responde 5xx/429, a linha fica `falhou`. Escrito no LEIA-ME.

### NB22 — baixa — anotado — Chamada sem chave
- No jeito B (pg_net, `--no-verify-jwt`), qualquer um pode chamar a função; ela só envia o que já está na fila (documentado), mas
  responde a mensagem de erro do banco e o modo coberturas pode ser adiantado. Sem risco de vazar aviso; fica anotado.

## O que foi conferido e está certo
- Cada tipo (mensagem, pedido, comentário/resposta, menção em post/comentário/giro, curtida, curtida em comentário,
  repost/citação, novo seguidor, post/coluna de quem segue, cobertura) entra na bolinha certa e some ao ver; bloqueado não gera
  bolinha nem aviso; contas nunca negativas; "Desde a sua última visita" certo depois de 5 dias fora; número no ícone = novidades
  + mensagens não lidas que aparecem.
- Página Notificações: escolhas continuam ao recarregar e nos outros aparelhos; iPhone fora da Tela de Início explica como ativar;
  sem v10, v10 sem chave e com chave.
- Banco: nada para si mesmo; post "para seguidores" só a quem segue perfil aberto; Melhores amigos; arquivado; bloqueio; erro no
  aviso não impede a gravação; RLS: ninguém lê aparelho de outro nem a fila.
- Função: agrupamento de 2 minutos, 404/410 apaga o aparelho, vários aparelhos, segredos nunca no log, nenhum e-mail do Pedro no
  repositório.
- Service worker: push e toque abrem a tela certa (app fechado e aberto); cache e atualização sem mudança (t_sw, t_sw2).
