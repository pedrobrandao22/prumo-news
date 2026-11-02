/* ---------- Etapa 20 ---------- */
(function(){const ant=renderCapa;renderCapa=function(){const r=ant.apply(this,arguments);try{if(!FEED&&OFFLINE){const v=$("#v-capa");if(v&&!v.querySelector(".cp-off"))v.innerHTML=`<div class="gut cp cp-direto"><div class="cp-off"><b>Sem conexão agora</b><span>Não consegui baixar as notícias. Assim que a internet voltar, o Prumo atualiza sozinho.</span><button type="button" class="btn" data-retry>Tentar de novo</button></div></div>`}}catch(e){}return r}})();
(function(){const ant=loadFeed;loadFeed=async function(){const r=await ant.apply(this,arguments);try{if(!FEED&&OFFLINE&&VIEW==="capa")renderCapa()}catch(e){}return r}})();
(function(){let n=0;const t=setInterval(()=>{n++;if(FEED||n>60){clearInterval(t);return}if(OFFLINE&&VIEW==="capa"&&!document.querySelector("#v-capa .cp-off"))renderCapa()},1000)})();

