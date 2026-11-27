# Pedidos (prompts) das rodadas de conteúdo

Os pedidos que valem são os das tarefas agendadas do Claude ("Atualizar Prumo News (rodada completa, 6h52)" e "Prumo
News rápido"). Esta pasta guarda PROPOSTAS ainda não ligadas, para o Pedro aprovar antes de trocar.

## manha-incremental.md (LIGADA em 26/11, decisão do Pedro; primeira rodada em 27/11 às 6h52)
Medido no histórico do feed.json: na edição da manhã de 24 e 25/11, 27 e 28 das 32 notícias já estavam na edição da
véspera (9 e 13 delas saíram idênticas) e só 5 e 4 eram novas. Mesmo assim a rodada completa refazia a edição inteira
com 4 subagentes de apuração e 1 conferente (cerca de 15 minutos; era a maior conta de conteúdo do dia). A rodada nova
é única, sem subagentes: parte da edição da véspera (já virada pelo robô da meia-noite) e do que o robô de manchetes
juntou na madrugada, atualiza o que mudou, traz o que é novo e tira o que envelheceu.
Teste a seco de 26/11: as operações do patch (mudancas_reset, mudanca_add, remove_pauta, set de prioridade, top de
resumo_dia, capa e nota) passam no aplicar.py e no validar.py com 0 erros.
Risco: a edição da manhã pode sair com menos notícias novas ou menos apuradas. Combinado: comparar 3 manhãs (27, 28 e
29/11) com as 3 anteriores e voltar ao pedido antigo se piorar.

## completa-ate-2611.md
O pedido antigo da tarefa "Atualizar Prumo News (rodada completa, 6h52)", guardado para poder voltar: basta colar o
texto de volta no pedido da tarefa.

## Retrato das manhãs com o pedido antigo (para comparar)
| Manhã | Notícias | Novas | Atualizadas | Saíram | Breves | Com Direita e Esquerda |
| --- | --- | --- | --- | --- | --- | --- |
| 23/11 | 30 | 2 | 14 | 5 | 18 | 3 |
| 24/11 | 32 | 5 | 17 | 9 | 15 | 4 |
| 25/11 | 32 | 4 | 12 | 9 | 16 | 5 |
| 26/11 | 34 | 5 | 16 | 6 | 18 | 5 |

## Manhãs com a incremental
| Manhã | Notícias | Novas | Atualizadas | Saíram | Breves | Com Direita e Esquerda |
| --- | --- | --- | --- | --- | --- | --- |
| 27/11 | 30 | 5 | 6 (3 com texto novo) | 10 | 12 | 3 |

27/11: publicou às 6h58 (uns 6 minutos), 0 erros no validador (64 avisos; a edição anterior tinha 76), manchete nova
(Trabuco na Fazenda). Não leu nenhuma página: escreveu só com títulos e lides de novidades.json. Pontos fracos frente
às manhãs antigas: bem menos notícias atualizadas (6 contra 12 a 17) e menos breves (12 contra 15 a 18).
"Novas" = notícia que não estava na edição da véspera; "atualizadas" = título ou texto mudou. A rodada antiga levava
cerca de 15 minutos, com 5 subagentes.
