/* ===== Revisão da madrugada 21/11 ===== */

/* testador (materia-deitada-barra-do-topo-some): deitado, a barra de cima da matéria some ao descer e volta ao subir
   um pouco ou perto do começo (o CSS 90 só age com pouca altura) */
var MT211_Y=new WeakMap();
document.addEventListener("scroll",e=>{const m=e.target;if(!m||!m.classList||!m.classList.contains("mat"))return;
  try{if(!matchMedia("(max-height:500px)").matches){m.classList.remove("mt211-ve");return}
    const y=m.scrollTop,a=MT211_Y.has(m)?MT211_Y.get(m):y;
    if(y<80)m.classList.add("mt211-ve");else if(y<a-6)m.classList.add("mt211-ve");else if(y>a+6)m.classList.remove("mt211-ve");
    if(!MT211_Y.has(m)||Math.abs(y-a)>6||y<80)MT211_Y.set(m,y)}catch(er){}},true);
/* matéria aberta (no topo): a barra começa visível */
(function(){const ob=()=>{const L=document.getElementById("layer");if(!L)return false;
  new MutationObserver(()=>{const m=L.querySelector(".mat:not(.mt211-ok)");if(m)m.classList.add("mt211-ok","mt211-ve")}).observe(L,{childList:true,subtree:true});return true};
  if(!ob())document.addEventListener("DOMContentLoaded",ob)})();

/* testador (girar-o-celular-na-materia-perde-o-ponto-de-leitura-2): gráficos e fotos mudam de altura depois do giro;
   o 168 restaurava o ponto até 450 ms. Mais duas tentativas tardias e o bloqueio da âncora vai junto */
addEventListener("resize",()=>{try{if(typeof CM168_ANC==="undefined"||!CM168_ANC)return;const a=CM168_ANC;
  CM168_GIRO=Math.max(CM168_GIRO,Date.now()+1400);
  [800,1250].forEach(t=>setTimeout(()=>{const mm=$("#layer .mat");if(mm&&typeof cm168Restaura==="function")cm168Restaura(mm,a)},t))}catch(e){}});
