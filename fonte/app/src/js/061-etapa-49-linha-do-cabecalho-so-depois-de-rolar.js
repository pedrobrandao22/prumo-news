/* ---------- Etapa 49: linha do cabeçalho só depois de rolar ---------- */
/* pontinhos do carrossel: no máximo 5 visíveis desde o início (antes só depois de deslizar) */
{const _ft49=fitTrack;fitTrack=function(t){const r=_ft49.apply(this,arguments);try{if(t&&t.closest&&t.closest(".post"))pgDots(t)}catch(e){}return r}}
(function(){let on=null;const f=()=>{const v=scrollY>4;if(v!==on){on=v;document.documentElement.classList.toggle("rolou",v)}};addEventListener("scroll",f,{passive:true});f()})();

