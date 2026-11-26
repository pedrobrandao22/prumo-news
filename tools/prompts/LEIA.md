# Pedidos (prompts) das rodadas de conteúdo

Os pedidos que valem são os das tarefas agendadas do Claude ("Atualizar Prumo News (rodada completa, 6h52)" e "Prumo
News rápido"). Esta pasta guarda PROPOSTAS ainda não ligadas, para o Pedro aprovar antes de trocar.

## manha-incremental.md (proposta de 26/11, NÃO ligada, nunca rodou)
Medido no histórico do feed.json: na edição da manhã de 24 e 25/11, 27 e 28 das 32 notícias já estavam na edição da
véspera (9 e 13 delas saíram idênticas) e só 5 e 4 eram novas. Mesmo assim a rodada completa refaz a edição inteira com
4 subagentes de apuração e 1 conferente (cerca de 15 minutos; é a maior conta de conteúdo do dia). A proposta troca
isso por uma rodada única, sem subagentes, que parte da edição da véspera (já virada pelo robô da meia-noite) e do que
o robô de manchetes juntou na madrugada: atualiza o que mudou, traz o que é novo, tira o que envelheceu.
Risco: a edição da manhã pode sair com menos notícias novas ou menos apuradas que hoje. Por isso o combinado é ligar
num dia em que o Pedro possa olhar a edição das 7h, comparar por 2 ou 3 dias e voltar ao pedido antigo se piorar (o
pedido antigo fica guardado na própria tarefa: basta colar de volta).
