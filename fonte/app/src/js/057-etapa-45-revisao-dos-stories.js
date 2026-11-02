/* ---------- Etapa 45: revisão dos stories ---------- */
{const _sg45=storyGo;storyGo=function(){if(VIRANDO)return;return _sg45.apply(this,arguments)}}
/* segurar: pausa, esconde a interface e não avança ao soltar */
var IG_DOWN=0,IG_HOLD_T=0;
document.addEventListener("pointerdown",e=>{const st=e.target.closest&&e.target.closest("#layer .story.sg");if(!st||e.target.closest(".s-f,.s-h,.us-it"))return;IG_DOWN=Date.now();clearTimeout(IG_HOLD_T);IG_HOLD_T=setTimeout(()=>{if(IG_DOWN)st.classList.add("segurando")},220)},true);
const igSolta=()=>{IG_DOWN_FIM=Date.now();clearTimeout(IG_HOLD_T);const st=$("#layer .story.sg");if(st)st.classList.remove("segurando")};var IG_DOWN_FIM=0;
document.addEventListener("pointerup",e=>{if(!IG_DOWN)return;IG_HELD=Date.now()-IG_DOWN;IG_DOWN=0;igSolta()},true);
document.addEventListener("pointercancel",()=>{IG_DOWN=0;igSolta()},true);
var IG_HELD=0;
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("#layer .story [data-sgo]");if(!b)return;if(IG_HELD>280||VIRANDO){e.stopPropagation();e.preventDefault()}IG_HELD=0},true);
/* app em segundo plano: pausa; ao voltar, continua de onde parou */
document.addEventListener("visibilitychange",()=>{if(!ST||!$("#layer .story"))return;
  if(document.hidden){if(ST.timer){clearTimeout(ST.timer);ST.timer=0;ST.resto=Math.max(800,(ST.fim||0)-Date.now());const f=$("#layer .bars b");if(f)f.style.animationPlayState="paused";ST.pausouFundo=true}}
  else if(ST.pausouFundo){ST.pausouFundo=false;storyRetoma()}});
/* "Em 5 min": mesmas notícias enquanto o story está aberto */
var C5=null;
{const _c5=cincoLista;cincoLista=function(){if(C5){const l=C5.map(pautaById).filter(Boolean);if(l.length)return l}const r=_c5.apply(this,arguments);if($("#layer .story")||(ST&&ST.sec==="_5min"))C5=r.map(p=>p.id);return r}}
{const _ia45=igAbrir;igAbrir=function(sec){C5=null;if(sec==="_5min")C5=null;const r=_ia45.apply(this,arguments);if(sec==="_5min"&&ST&&ST.sec==="_5min")C5=ST.ids.slice();return r}}
/* matéria aberta pelo story: ao fechar, volta ao mesmo story */
var IG_VOLTA=null,IG_XMAT=0;
{const _lm=igLerMateria;igLerMateria=function(pid){if(ST&&$("#layer .story"))IG_VOLTA={...ST,timer:0};return _lm.apply(this,arguments)}}
document.addEventListener("click",e=>{if(e.target&&e.target.closest&&e.target.closest("#layer .mat [data-close],#layer .mat .mat-x,#layer .mat [data-voltar]"))IG_XMAT=Date.now()},true);
{const _cl45=closeLayer;closeLayer=function(fromPop){const tinhaMat=!!$("#layer .mat")&&!($("#layer2")?.innerHTML),eraStory=!!$("#layer .story")&&!($("#layer2")?.innerHTML);
  const r=_cl45.apply(this,arguments);
  if(tinhaMat&&IG_VOLTA&&!$("#layer").innerHTML){const v=IG_VOLTA;IG_VOLTA=null;if(fromPop===true||Date.now()-IG_XMAT<1500){ST=v;IG_MATPUSH=false;const _ph=pushH;pushH=()=>false;try{drawStory()}catch(e){}finally{pushH=_ph}}}
  else if(eraStory&&!$("#layer .story")){C5=null}
  return r}}
{const _go45=go;go=function(){IG_VOLTA=null;return _go45.apply(this,arguments)}}

