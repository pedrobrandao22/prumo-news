/* ---------- Etapa 64 ---------- */
/* 1. segurar para gravar: o soltar não tira foto (antes de qualquer outro clique) */
window.addEventListener("click",e=>{if(!ED||!e.target.closest)return;if((Date.now()-(ED._gravou||0)<1200||ED._gravando||CAM.rec&&ED.modo==="story")&&e.target.closest("#layer [data-edfoto]")){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()}},true);
/* 2 e 8. voltar do celular: selfie desliga a câmera; marcar pessoas fecha só a tela de marcas; Layout e Reels voltam um passo; post oferece rascunho */
{const _cl64=closeLayer;closeLayer=function(fromPop){if(fromPop===true&&ED&&$("#layer .ce")&&!($("#layer2")?.innerHTML)&&!ED.env){const fica=()=>{if(pushH())HST++};
    if($("#layer .ce-selfie")){camDesliga();CAM.f=ED._selfieF||"environment";$("#layer .ce-selfie").remove();fica();return}
    if($("#layer .ce-tagov")){$("#layer .ce-tagov").remove();edDesenha();fica();return}
    if(!$("#layer .ce-sel,#layer .ce-fig,#layer .ce-tx,#layer .ce-cn")){
      if(ED.modo==="story"&&ED.tela==="lay"){ED.st.bg={tipo:"grad",g:Math.floor(Math.random()*PUB_FUNDOS.length)};ED.tela="cam";edDesenha();fica();return}
      if(ED.modo==="post"&&ED.po.passo==="fotos"&&ED.po.fotos.length+ED.po.texto.trim().length>0){edFechar();fica();return}}}
  return _cl64.apply(this,arguments)}}
/* 6. segurar o story de um amigo pausa também o vídeo */
var US_HOLD=false;
document.addEventListener("pointerdown",e=>{if(!e.target.closest||!e.target.closest("#layer .story")||e.target.closest(".s-f,.s-h,.us-it,[data-usom]"))return;const v=$("#layer .us2-vid");if(v){US_HOLD=true;v.pause()}},true);
["pointerup","pointercancel"].forEach(k=>document.addEventListener(k,()=>{if(!US_HOLD)return;US_HOLD=false;setTimeout(()=>{const v=$("#layer .us2-vid");if(v&&v.paused&&(!PREF.storyAuto||ST.timer)&&!$("#layer2")?.innerHTML)v.play().catch(()=>{})},60)},true));
setInterval(()=>{const v=$("#layer .us2-vid");if(!v||!PREF.storyAuto||US_HOLD)return;const x=ST.itens&&ST.itens[ST.i],fim=x&&x.estilo&&x.estilo.fim;
  if(!ST.timer){if(!v.paused)v.pause()}else if(v.paused&&!v.ended&&!(fim&&v.currentTime>=fim))v.play().catch(()=>{})},200);
/* contador do texto do story */
document.addEventListener("input",e=>{if(e.target.id!=="ce-txa")return;let c=$("#ce-txc");const n=e.target.value.length;if(n<180){c&&c.remove();return}if(!c){e.target.closest(".ce-tx").insertAdjacentHTML("beforeend",`<div class="ce-txc" id="ce-txc"></div>`);c=$("#ce-txc")}c.textContent=`${n}/220`},true);
/* legenda longa no Feed: "… mais" */
{const _pp64=pubPostHTML;pubPostHTML=function(x){const h=_pp64.apply(this,arguments);return String(x.texto||"").length>160||/\n.*\n/.test(x.texto||"")?h.replace('<p class="up-leg">','<p class="up-leg up-curta" data-upmais role="button" tabindex="0">'):h}}
document.addEventListener("click",e=>{const p=e.target.closest&&e.target.closest(".upost .up-leg.up-curta");if(!p||e.target.closest("a,.dm-at"))return;p.classList.remove("up-curta")},true);

