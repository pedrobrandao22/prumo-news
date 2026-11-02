/* ---------- Etapa 52: deslizar entre Capa e Feed ---------- */
(function(){let trk=null,x0=0,y0=0,t0=0,on=false,modo="",sec=null,alvo=null,lx=0,lt=0,vel=0,W=1;
  const rolaLado=el=>{for(let e=el;e&&e!==document.body;e=e.parentElement){if(e.matches&&e.matches(".track,.secs,#secs,.tk-vp,.ag-vp,.segs,.gr-box,.cp-ind,input,textarea,select,[data-agstrip],.etp"))return true;
    const cs=getComputedStyle(e);if((cs.overflowX==="auto"||cs.overflowX==="scroll")&&e.scrollWidth>e.clientWidth+2)return true}return false};
  const livre=()=>!$("#layer").innerHTML&&!($("#layer2")?.innerHTML)&&!document.getElementById("sg-fundo")&&(VIEW==="capa"||VIEW==="feed")&&innerWidth<900;
  addEventListener("touchstart",e=>{on=false;if(e.touches.length!==1||!livre())return;const t=e.touches[0];if(t.clientX<14||t.clientX>innerWidth-4)return;trk=null;const tk=e.target.closest&&e.target.closest(".post .track");if(tk&&VIEW==="feed"&&tk.scrollLeft<=2&&!rolaLado(tk.parentElement))trk=tk;else if(rolaLado(e.target))return;
    x0=lx=t.clientX;y0=t.clientY;t0=lt=Date.now();on=true;modo="";vel=0;sec=document.getElementById("v-"+VIEW);W=innerWidth;alvo=VIEW==="capa"?"feed":"capa"},{passive:true});
  addEventListener("touchmove",e=>{if(!on)return;const t=e.touches[0],dx=t.clientX-x0,dy=t.clientY-y0,now=Date.now();
    if(!modo){if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.6){if(trk&&(dx<0||trk.scrollLeft>2)){on=false;return}modo="lado"}else if(Math.abs(dy)>10){on=false;return}else return}
    e.preventDefault();if(now>lt){vel=(t.clientX-lx)/(now-lt);lx=t.clientX;lt=now}
    const certo=VIEW==="capa"?dx<0:dx>0;const d=certo?dx:dx*.15;
    if(sec){sec.style.transition="none";sec.style.transform=`translate3d(${d}px,0,0)`;sec.style.opacity=String(1-Math.min(.35,Math.abs(d)/W*.5))}},{passive:false});
  const solta=e=>{if(!on)return;on=false;if(modo!=="lado"||!sec)return;const t=e.changedTouches&&e.changedTouches[0],dx=t?t.clientX-x0:0;
    const certo=VIEW==="capa"?dx<0:dx>0,v=VIEW==="capa"?-vel:vel,vai=certo&&(Math.abs(dx)>W*.3||(v>.45&&Math.abs(dx)>40));const s0=sec,de=VIEW;
    if(!vai){s0.style.transition="transform .25s cubic-bezier(.25,.8,.3,1),opacity .25s";s0.style.transform="";s0.style.opacity="";setTimeout(()=>{s0.style.transition=""},260);return}
    const fim=VIEW==="capa"?-W:W;s0.style.transition="transform .17s cubic-bezier(.4,0,.9,.6),opacity .17s";s0.style.transform=`translate3d(${fim}px,0,0)`;s0.style.opacity=".4";try{vibrar(6)}catch(_){}
    setTimeout(()=>{s0.style.transition="";s0.style.transform="";s0.style.opacity="";
      const ir=()=>{const b=document.querySelector(`.nav [data-v="${alvo}"]`);if(b)b.click();else go(alvo)};ir();
      const n=document.getElementById("v-"+alvo);if(n&&n.animate&&!REDUZ.matches){n.animate([{transform:`translate3d(${de==="capa"?W*.35:-W*.35}px,0,0)`,opacity:.3},{transform:"none",opacity:1}],{duration:240,easing:"cubic-bezier(.2,.8,.2,1)"})}},170)};
  addEventListener("touchend",solta,{passive:true});addEventListener("touchcancel",()=>{if(on&&sec){sec.style.transform="";sec.style.opacity=""}on=false},{passive:true});
})();

