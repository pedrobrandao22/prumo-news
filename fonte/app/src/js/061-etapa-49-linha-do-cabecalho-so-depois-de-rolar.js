/* ---------- Etapa 49: linha do cabeçalho só depois de rolar ---------- */
/* pontinhos do carrossel: no máximo 5 visíveis desde o início (antes só depois de deslizar) */

(function(){let on=null;const f=()=>{const v=scrollY>4;if(v!==on){on=v;document.documentElement.classList.toggle("rolou",v)}};addEventListener("scroll",f,{passive:true});f()})();

