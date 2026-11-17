/* 188 · rodadas rápidas (Fase 2, 18/11): a rápida "sem novidade" diz por quê.
   Desde 18/11 o registro em rodadas.json traz "motivo" (código conferido pelo tools/aplicar.py --rodada; manual 7).
   "Atualizações de hoje" mostra o texto do motivo no lugar do genérico "Nada mudou desde a anterior."; o administrador vê
   também o código. Registro antigo, sem motivo: fica como era. */
var RP188_MOT={nada_novo:"Nenhum fato novo relevante desde a anterior.",ja_no_feed:"Os fatos novos já estavam na edição.",
  sem_confirmacao:"Há relatos novos ainda sem confirmação em fonte aberta; ficam para a próxima.",menor:"Só assuntos menores desde a anterior."};
if(typeof rodadaDetalhe==="function"){const _rd188=rodadaDetalhe;rodadaDetalhe=function(x){
  const h=_rd188.apply(this,arguments);const m=x&&x.status==="sem_mudancas"&&RP188_MOT[x.motivo];if(!m)return h;
  const adm=!!(S.membro&&S.uid&&S.membros&&S.membros[S.uid]&&S.membros[S.uid].papel==="admin");
  if(adm)return `${esc(m)} (${esc(x.motivo)})${h?" · "+h:""}`;
  return h&&h!==esc("Nada mudou desde a anterior.")?`${esc(m)} ${h}`:esc(m)}}
