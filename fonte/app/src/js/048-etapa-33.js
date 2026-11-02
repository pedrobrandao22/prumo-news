/* ---------- Etapa 33 ---------- */
/* abre/fecha o quadro de um cartão sem remontar a Capa; devolve false se não deu (aí remonta) */
function cpAlternar(antigo,novo){try{if(VIEW!=="capa")return false;
  if(antigo&&antigo!==novo){const el=document.getElementById("cpi-"+antigo);if(!el)return false;el.querySelector(":scope > .cpx")?.remove();el.classList.remove("aberto");el.querySelector(".cpi-b")?.setAttribute("aria-expanded","false")}
  if(novo){const el=document.getElementById("cpi-"+novo),p=pautaById(novo);if(!el||!p)return false;if(!el.querySelector(":scope > .cpx"))el.insertAdjacentHTML("beforeend",cpAberta(p));el.classList.add("aberto");el.querySelector(".cpi-b")?.setAttribute("aria-expanded","true");if(lidaAtual(p))el.classList.add("lida");const nv=el.querySelector(".cp-nv");if(nv&&lidaAtual(p))nv.remove()}
  CAPA_SIG=capaSig();return true}catch(e){return false}}
/* assinatura do que a Capa mostra: se não mudou, trocar de aba não remonta */
var CAPA_SIG="";
function capaSig(){try{return [FEED&&FEED.atualizado_em,FEED&&FEED.pautas&&FEED.pautas.length,lente(),CP_AB,NOVAS.size,ATUALIZADAS.size,LIDAS.size,(PREF.ocultas||[]).join(),FOTOS_ARQ&&FOTOS_ARQ.gerado,typeof NOVID_AG!=="undefined"&&NOVID_AG&&NOVID_AG.gerado,Math.floor(Date.now()/300000),S.uid||"",S.membro?1:0,innerWidth>=900,typeof CAPA_FIXA!=="undefined"?JSON.stringify(CAPA_FIXA):"",capaPrefSig(),JSON.stringify(((S.quiz||{})[S.uid||"eu"]||{}).at||"")].join("|")}catch(e){return String(Math.random())}}
{const _rc=renderCapa;renderCapa=function(){const r=_rc.apply(this,arguments);CAPA_SIG=capaSig();return r}}
function capaSeMudou(){const v=$("#v-capa");if(!v||!v.querySelector(".cpi")||capaSig()!==CAPA_SIG)renderCapa();else{try{lenteBotao()}catch(e){}}}

