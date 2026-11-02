/* ---------- Etapa 32 ---------- */
{const _cl32=closeLayer;closeLayer=function(){const r=_cl32.apply(this,arguments);if(window.RECARGA_PEND&&VERSAO_NOVA)setTimeout(()=>{if(!temJanela()){try{sessionStorage.setItem("prumo-recarregou",VERSAO_NOVA)}catch(e){}location.reload()}},400);return r}}

