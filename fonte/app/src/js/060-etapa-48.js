/* ---------- Etapa 48 ---------- */
var IG_MATPUSH=false;
{const _lm48=igLerMateria;igLerMateria=function(pid){if($("#layer .story")&&!IG_MATPUSH){if(pushH()){HST++;IG_MATPUSH=true}}return _lm48.apply(this,arguments)}}
{const _cl48=closeLayer;closeLayer=function(fromPop){const tinhaMat=!!$("#layer .mat")&&!($("#layer2")?.innerHTML);const r=_cl48.apply(this,arguments);
  if(tinhaMat&&IG_MATPUSH&&!$("#layer .story")&&!$("#layer .mat")){IG_MATPUSH=false;if(HST>0){HST--;voltarH(1)}}return r}}
/* Gostei no story: atualiza no lugar */
function igLikeNoLugar(pid){const sa=$("#layer #s-acts");if(!sa||sa.dataset.pid!==pid)return false;const b=sa.querySelector('[data-a="like"]');if(!b)return false;
  const {likes}=socialOf(pid),mine=!!(S.uid&&likes.includes(S.uid));const era=b.classList.contains("on");b.classList.toggle("on",mine);b.setAttribute("aria-pressed",String(mine));
  let sp=b.querySelector("span");if(likes.length){if(!sp){sp=document.createElement("span");b.appendChild(sp)}sp.textContent=likes.length}else if(sp)sp.remove();
  if(mine&&!era){b.classList.remove("anel");void b.offsetWidth;b.classList.add("anel")}return true}
{const _us48=updateSocial;updateSocial=function(pid){const sa=$("#layer #s-acts");let tirou=false;if(sa&&sa.dataset.pid===pid&&sa.querySelector('[data-a="like"]')){sa.dataset.pid="";tirou=true}
  let r;try{r=_us48.apply(this,arguments)}finally{if(tirou){sa.dataset.pid=pid;igLikeNoLugar(pid)}}return r}}
/* desempenho: a fileira de círculos fica escondida atrás do story; redesenha uma vez só, ao fechar */
var RS_PEND=false;
{const _rs48=renderSecs;renderSecs=function(){if($("#layer .story")){RS_PEND=true;return}RS_PEND=false;return _rs48.apply(this,arguments)}}
{const _cl48b=closeLayer;closeLayer=function(){const sec=ST&&ST.sec;const r=_cl48b.apply(this,arguments);if(RS_PEND&&!$("#layer .story")){try{renderSecs();const box=$("#secs");if(box&&sec&&VIEW==="feed"){const sel=sec==="_5min"?"[data-5min]":sec==="_ult"?"[data-ultimas]":sec==="_ag"?"[data-igagenda]":String(sec).indexOf("_h:")===0?`[data-dest="${CSS.escape(sec.slice(3))}"]`:`[data-sec-story="${CSS.escape(sec)}"]`;const b=box.querySelector(sel);
    if(b){const want=Math.max(0,b.getBoundingClientRect().left-box.getBoundingClientRect().left+box.scrollLeft-(box.clientWidth-b.offsetWidth)/2);if(Math.abs(box.scrollLeft-want)>8)box.scrollTo({left:want,behavior:REDUZ.matches?"auto":"smooth"})}}}catch(e){}}return r}}
{const _de48=destaques;let ck="",cv=[];destaques=function(){const k=FEED?(FEED.atualizado_em+"|"+(FEED.pautas||[]).length+"|"+(PREF.ocultas||[]).join()):"";if(k&&k===ck)return cv;cv=_de48.apply(this,arguments);ck=k;return cv}}
/* rolagem infinita: se a marca de "carregar mais" já passou da tela (feed redesenhado lá embaixo), carrega na hora */
{const _om48=observarMais;observarMais=function(){const r=_om48.apply(this,arguments);requestAnimationFrame(()=>{const m=$("#mais");if(m&&m.getBoundingClientRect().top<innerHeight+600)carregarMais()});return r}}

