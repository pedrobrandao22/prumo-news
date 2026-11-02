/* ---------- Etapa 47: ajustes dos stories ---------- */
/* gestos: tremor ao segurar não encolhe; deslizar rápido para baixo fecha */
igWire=function(el){if(!el)return;let x0=0,y0=0,on=false,modo="",dr=null,lx=0,lt=0,vel=0,ly=0,lty=0,vy=0;const si=el.querySelector(".story-in");
  el.addEventListener("touchstart",e=>{if(e.target.closest(".s-f,.s-h,.us-it")||IG_DIG||VIRANDO)return;const t=e.touches[0];x0=lx=t.clientX;y0=ly=t.clientY;lt=lty=Date.now();on=true;modo="";dr=null;vel=0;vy=0},{passive:true});
  el.addEventListener("touchmove",e=>{if(!on)return;const t=e.touches[0],dx=t.clientX-x0,dy=t.clientY-y0,now=Date.now();
    if(now>lty){vy=(t.clientY-ly)/(now-lty);ly=t.clientY;lty=now}
    if(!modo){if(Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.2)modo="lado";else if(dy>30&&dy>Math.abs(dx)*1.2)modo="baixo";else if(dy<-30&&-dy>Math.abs(dx)*1.2)modo="cima"}
    if(modo==="baixo"&&si){if(e.cancelable)e.preventDefault();el.classList.remove("segurando");const k=Math.max(0,dy-30);si.style.transition="none";si.style.transform=`translateY(${k}px) scale(${Math.max(.85,1-k/1600)})`;el.style.backgroundColor=`rgb(0 0 0 / ${Math.max(.3,1-k/500)})`}
    if(modo==="lado"){e.preventDefault();if(now>lt){vel=(t.clientX-lx)/(now-lt);lx=t.clientX;lt=now}
      if(!dr){dr=igDragIni(dx<0?1:-1)||{falhou:true}}
      if(dr&&!dr.falhou)igDragMove(dr,dx-(dx<0?-14:14))}},{passive:false});
  const volta=()=>{if(!si)return;si.style.transition="transform .22s cubic-bezier(.3,.7,.4,1)";si.style.transform="";el.style.backgroundColor="";setTimeout(()=>{si.style.transition=""},240)};
  el.addEventListener("touchend",e=>{if(!on)return;on=false;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(modo==="baixo"){e.preventDefault();if(dy>140||(vy>.55&&dy>50))igFechar();else{volta();storyRetoma()}return}
    if(modo==="lado"){e.preventDefault();if(dr&&!dr.falhou)igDragFim(dr,dx-(dx<0?-14:14),vel);else if(Math.abs(dx)>60)storySec(dx<0?1:-1);dr=null;return}
    if(modo==="cima"&&dy<-80){e.preventDefault();const pid=$("#s-acts")?.dataset.pid;if(pid)igLerMateria(pid)}},{passive:false});
  el.addEventListener("touchcancel",()=>{if(dr&&!dr.falhou)igDragFim(dr,0,0);dr=null;if(modo==="baixo")volta();on=false},{passive:true})};
/* matéria aberta pelo story: o story fica atrás e o botão do topo volta para ele */
function igFundoTira(){document.getElementById("sg-fundo")?.remove()}
{const _lm47=igLerMateria;igLerMateria=function(pid){const st=$("#layer .story");let cl=null;
  if(st){igFundoTira();cl=st.cloneNode(true);cl.id="sg-fundo";cl.removeAttribute("role");cl.setAttribute("aria-hidden","true");cl.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));cl.classList.remove("segurando","digitando","sg-anim")}
  const r=_lm47.apply(this,arguments);
  if(cl&&$("#layer .mat")){cl.querySelectorAll(".bars b").forEach(b=>b.style.animationPlayState="paused");document.body.appendChild(cl);
    const b=$("#layer .mat-v");if(b){b.textContent="‹ Story";b.setAttribute("aria-label","Voltar para o story")}}
  return r}}
{const _cl47=closeLayer;closeLayer=function(){const r=_cl47.apply(this,arguments);if(!$("#layer .mat"))setTimeout(igFundoTira,$("#layer .story")?60:320);return r}}
{const _go47=go;go=function(){igFundoTira();return _go47.apply(this,arguments)}}
/* matéria aberta pelo story e trocada por outra (deslizar para a esquerda): o botão continua "‹ Story" */
{const _am47=abrirMateria;abrirMateria=function(){const r=_am47.apply(this,arguments);if(IG_VOLTA&&document.getElementById("sg-fundo")){const b=$("#layer .mat-v");if(b){b.textContent="‹ Story";b.setAttribute("aria-label","Voltar para o story")}}return r}}
/* Gostei: ícone dourado e pulso */

/* teclado do celular: o rodapé sobe junto */
(function(){const vv=window.visualViewport;if(!vv)return;const aj=()=>{const f=$("#layer .story .sg-f2");if(!f)return;if(!IG_DIG){f.style.transform="";return}const k=Math.max(0,innerHeight-vv.height-vv.offsetTop);f.style.transform=k>40?`translateY(${-k}px)`:""};
  vv.addEventListener("resize",aj);vv.addEventListener("scroll",aj);document.addEventListener("focusin",()=>setTimeout(aj,50));document.addEventListener("focusout",()=>setTimeout(aj,200))})();

