# Ajuste das tarefas agendadas do Testador e do Corretor (25/11)

O Pedro aprovou o modo econômico em 25/11. As mudanças nas tarefas agendadas precisam ser feitas por ele no app
(Tarefas agendadas), porque a alteração automática foi bloqueada pela permissão de segurança.

## Prumo: testador do app
- Horário: todo dia às 9h41 (fuso de São Paulo). Antes era de hora em hora.
- O pedido (prompt) fica como está: ele manda ler fonte/testador/ROTEIRO.md, que agora começa pelo "MODO ECONÔMICO".
- Ligar a tarefa.

## Prumo: corretor do app
- Horário: todo dia às 19h23 (fuso de São Paulo). Antes era 3x por dia.
- Trocar o PASSO 0 do pedido por este texto (o resto pode ficar):

PASSO 0 — Ligado? Tem trabalho? (modo econômico, 25/11)
Carregue ArtifactData (ToolSearch "select:ArtifactData"). Leia config/estado do artifact
https://claude.ai/artifact/CiNSJVyKo9ctBZAYtRBKQF (action get). Se "corretor_ligado" não for true (ou a leitura
falhar), termine com a linha "Corretor desligado." e nada mais. Antes de clonar ou instalar qualquer coisa, veja se há
trabalho: consulte só os achados abertos (action query, collection "achados", where status == "aberto", com out_dir) e
baixe o vigia.json (curl -s https://raw.githubusercontent.com/pedrobrandao22/prumo-news/main/vigia.json). Há trabalho
se existir achado aberto de prioridade alta ou média criado ou reaberto depois de config/estado.corretor_ultima, ou
problema no vigia.json que não seja só "notícia com fato novo". Sem trabalho: atualize config/estado.corretor_ultima e
termine com "Prumo — corretor: nada a fazer hoje."

- Ligar a tarefa.

## Opcional (economia maior)
Trocar o modelo das duas tarefas para o Sonnet. Só com o "sim" do Pedro.
