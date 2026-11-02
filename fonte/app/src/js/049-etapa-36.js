/* ---------- Etapa 36 ---------- */
/* o cartão que a pessoa está vendo (o primeiro que aparece abaixo do topo) */
function ancoraCapa(){if(CP_AB){const a=document.getElementById("cpi-"+CP_AB);if(a){const r=a.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)return {id:a.id,top:r.top}}}
  const L=document.querySelectorAll("#v-capa .cpi[id]");for(const el of L){const r=el.getBoundingClientRect();if(r.bottom>70)return {id:el.id,top:r.top}}return null}
/* rola só o necessário para o quadro aberto caber na tela, sem tirar o título do cartão de vista */
function mostrarInteiro(el){const r=el.getBoundingClientRect(),nav=document.querySelector(".nav"),baixo=innerHeight-((nav&&nav.offsetHeight)||0)-24;
  let dy=0;if(r.bottom>baixo)dy=Math.min(r.bottom-baixo,r.top-70);if(r.top<64)dy=r.top-70;if(Math.abs(dy)>4){window.PULA_SCROLL=Date.now()+400;window.scrollTo({top:scrollY+dy,behavior:"smooth"})}}

