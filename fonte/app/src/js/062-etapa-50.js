/* ---------- Etapa 50 ---------- */
var CPS_K=null,CPS_V="";function capaPrefSig(){const k=PREF&&PREF.mod;if(k&&k===CPS_K)return CPS_V;CPS_V=JSON.stringify(PREF,(kk,v)=>kk==="conhecidas"||kk==="visitaAtual"||kk==="mod"?undefined:v);CPS_K=k;return CPS_V}

