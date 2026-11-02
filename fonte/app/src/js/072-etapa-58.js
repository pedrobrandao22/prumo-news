/* ---------- Etapa 58 ---------- */
/* Feed: post com formato próprio (1:1, original) */
{const _ft58=fitTrack;fitTrack=function(t){const r=_ft58.apply(this,arguments);try{const a=t.closest&&t.closest(".upost.up-ar"),ar=a&&+a.dataset.ar,w=t.clientWidth;if(ar&&w){t.style.setProperty("--slh",Math.round(w/ar)+"px");const s=t.children[r];if(s&&s.offsetHeight>0)t.style.height=s.offsetHeight+"px"}}catch(e){}return r}}
/* sugestões de @ abaixo do campo quando não cabem acima */
{const _ms58=menSugere;menSugere=function(i){const r=_ms58.apply(this,arguments);try{if(MEN_BOX&&MEN_BOX.isConnected&&MEN_INP===i){const b=MEN_BOX.getBoundingClientRect(),q=i.getBoundingClientRect();if(b.top<8){MEN_BOX.style.bottom="auto";MEN_BOX.style.top=(q.bottom+6)+"px"}else MEN_BOX.style.top=""}}catch(e){}return r}}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="ce-leg"&&MEN_BOX)MEN_BOX.style.top=""},true);
addEventListener("resize",()=>{if($("#ce-pv")){edPvTam();edPvPos()}});

