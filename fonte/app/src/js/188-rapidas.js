/* 188 · rodadas rápidas (Fase 2, 18/11): a rápida "sem novidade" diz por quê.
   Desde 18/11 o registro em rodadas.json traz "motivo" (código conferido pelo tools/aplicar.py --rodada; manual 7).
   "Atualizações de hoje" mostra o texto do motivo no lugar do genérico "Nada mudou desde a anterior."; o administrador vê
   também o código. Registro antigo, sem motivo: fica como era. */
var RP188_MOT={nada_novo:"Nenhum fato novo relevante desde a anterior.",ja_no_feed:"Os fatos novos já estavam na edição.",
  sem_confirmacao:"Há relatos novos ainda sem confirmação; o Prumo volta a conferir na próxima atualização.",menor:"Só assuntos menores desde a anterior."};
/* 20/11: o uso do motivo foi para dentro de rodadaDetalhe (029); aqui fica só a tabela. */
