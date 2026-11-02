/* ---------- camadas ---------- */
let onClose=null;
function sheet(title,body,foot="",opt={}){
  const L=$(".story")||$("#layer .mat")||$("#layer .pv.pv-sob")||$("#layer .cria")||$("#layer .ce")||$("#layer .pfv")?$("#layer2"):$("#layer");const vazio=!L.innerHTML;if(L.id==="layer2"&&ST.timer){clearTimeout(ST.timer);ST.timer=0;ST.resto=Math.max(800,(ST.fim||0)-Date.now());const fb=$("#layer .bars b");if(fb)fb.style.animationPlayState="paused"}
  L.innerHTML=`<div class="scrim" data-scrim><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div><div class="sh-h">${esc(title)}<button type="button" data-close>Fechar</button></div><div class="sh-b gut">${body}</div>${foot?`<div class="sh-f gut">${foot}</div>`:""}</div></div>`;
  const f=L.querySelector("input");if(f&&(opt.focus||matchMedia("(pointer:fine)").matches))f.focus();
  if(vazio&&pushH())HST++;wireSheetDrag(L.querySelector(".sheet"));
}
function closeLayer(fromPop){if(QUIZ_ON&&$(".qopts")){QUIZ_ON=false;setTimeout(()=>toast("Quiz interrompido. Dá para refazer em Interagir."),50)}const had=($("#layer2")?.innerHTML)||$("#layer").innerHTML;if(had&&!fromPop&&HST>0){HST--;voltarH(1)}const l2=$("#layer2");if(l2&&l2.innerHTML){l2.innerHTML="";const c2=onClose;onClose=null;c2&&c2();storyRetoma();return}clearTimeout(ST?.timer);if(ST)ST.timer=0;clearTimeout(VIRA_T);VIRANDO=false;$("#layer").innerHTML="";const c=onClose;onClose=null;c&&c()}
/* voltas do histórico ficam para o fim do toque; se outra janela abrir no mesmo toque, ela reaproveita a entrada */
function voltarH(n){BACKN+=n;if(!BACKT)BACKT=setTimeout(()=>{BACKT=0;const k=BACKN;BACKN=0;if(k>0){IGN++;try{history.go(-k)}catch(e){IGN--}}},0)}
function pushH(){if(BACKN>0){BACKN--;return true}if(IGN>0){PUSHQ++;return true}return hPush()}
document.addEventListener("keydown",e=>{const kt=e.target;if((e.key==="Enter"||e.key===" ")&&kt&&kt.matches&&kt.matches("[role=button],div[data-a],span[data-a],.tk-i")){e.preventDefault();if(kt.matches(".tk-i"))openSnap(kt.dataset.tk);else kt.click();return}if(e.key==="Escape"&&$("#layer").innerHTML)closeLayer();if($("#layer .story")&&!$("#layer2")?.innerHTML&&!(kt&&kt.closest&&kt.closest("input,textarea,select,[contenteditable]"))){if(e.key==="ArrowRight")storyGo(1);if(e.key==="ArrowLeft")storyGo(-1)}});

let ST={sec:null,i:0,ordem:[]};
function stPs(){return (ST.ids||[]).map(pautaById).filter(Boolean)}
function openSecStory(sec){uso("story");const ps=pautasDa(sec);let i=ps.findIndex(p=>!SEEN.has(seenKey(p)));ST={sec,ids:ps.map(p=>p.id),i:i<0?0:i,ordem:secsStory().map(s=>s.id)};drawStory()}
function storyActs(pid){const {likes,cm}=socialOf(pid),mine=!!(S.uid&&likes.includes(S.uid));
  return `<button type="button" class="sact ${mine?"on":""}" data-a="like" aria-pressed="${mine}" aria-label="Gostei">${ICON.like}<span>${likes.length||"Gostei"}</span></button><button type="button" class="sact" data-a="cmt" aria-label="Comentar">${ICON.cmt}<span>${cm.length||""}</span></button><button type="button" class="sact" data-a="send" aria-label="Enviar">${ICON.send}</button><span class="sp"></span><button type="button" class="sact go" data-goto="${esc(pid)}">Ver no feed</button>`}
function drawStory(anim){
  const ps=stPs(),p=ps[ST.i];if(!p)return closeLayer();clearTimeout(ST.timer);const vazioS=!$("#layer").innerHTML;
  SEEN.add(seenKey(p));lsSet("radar-vistos",[...SEEN].slice(-400));marcarLida(p.id);
  $("#layer").innerHTML=`<div class="story paper" data-sec="${esc(ST.sec)}" role="dialog" aria-modal="true" aria-label="${esc(secNome(ST.sec))}"><div class="story-in">
    <div class="bars">${ps.map((_,k)=>`<i class="${k<ST.i||(k===ST.i&&!PREF.storyAuto)?"on":""}">${k===ST.i&&PREF.storyAuto?"<b></b>":""}</i>`).join("")}</div>
    <div class="s-h"><b>${esc(secNome(ST.sec))} · ${ST.i+1}/${ps.length}</b><span class="s-hb"><button type="button" data-sauto aria-pressed="${!!PREF.storyAuto}" aria-label="${PREF.storyAuto?"Parar de passar sozinho":"Passar sozinho"}">${PREF.storyAuto?'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>'}</button><button type="button" data-close aria-label="Fechar">${ICON.close}</button></span></div>
    <button type="button" class="tap l" data-sgo="-1" aria-label="Notícia anterior"></button><button type="button" class="tap r" data-sgo="1" aria-label="Próxima notícia"></button>
    <div class="s-body">${p.tag?`<span class="s-kick">${esc(p.tag)}</span>`:""}<h2>${esc(p.neutro?.titulo)}</h2><p>${esc(p.neutro?.texto)}</p><div class="s-art">${svgOf(p.imagem)}</div></div>
    <div class="s-f" id="s-acts" data-pid="${esc(p.id)}">${storyActs(p.id)}</div>
  </div></div>`;
  wireStorySwipe($("#layer .story"));if(vazioS&&pushH())HST++;storyAuto(p);
  const si=$("#layer .story-in");if(anim&&si){si.classList.add(anim);si.addEventListener("animationend",()=>{si.classList.remove(anim);$("#layer .story")?.classList.remove("flipping")},{once:true});$("#layer .story").classList.add("flipping")}
  const sp=$("#layer .s-body p");if(sp&&sp.scrollHeight>sp.clientHeight+2)sp.classList.add("ovf");
  renderSecs();
}
function wireStorySwipe(el){if(!el)return;let x0=0,y0=0,on=false;
  const sb=el.querySelector(".s-body");if(sb){let sy=0,mv=false;sb.addEventListener("pointerdown",e=>{sy=(e.target.closest("p")||{}).scrollTop||0;mv=false},{passive:true});sb.addEventListener("pointermove",()=>{mv=true},{passive:true});
    sb.addEventListener("click",e=>{if(e.target.closest("button,a"))return;const p=e.target.closest("p");if(p&&Math.abs((p.scrollTop||0)-sy)>4)return;if(String(getSelection&&getSelection())!=="")return;storyGo(e.clientX<innerWidth*0.33?-1:1)})}
  el.addEventListener("touchstart",e=>{if(e.target.closest(".s-f"))return;const t=e.touches[0];x0=t.clientX;y0=t.clientY;on=true},{passive:true});
  el.addEventListener("touchend",e=>{if(!on)return;on=false;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.3){e.preventDefault();storySec(dx<0?1:-1)}
    else if(dy>110&&Math.abs(dy)>Math.abs(dx)*1.5&&!e.target.closest(".s-body")?.scrollTop){e.preventDefault();closeLayer()}},{passive:false});
}
function storyOrdem(){const L=(ST.ordem&&ST.ordem.length?ST.ordem:secsStory().map(s=>s.id)).filter(id=>pautasDa(id).length);return L}
let VIRANDO=false;
function storySec(d){if(VIRANDO)return;const L=storyOrdem(),k=L.indexOf(ST.sec),nx=L[k+d];if(!nx){if(d>0)closeLayer();return}
  const ps=pautasDa(nx);let i=ps.findIndex(p=>!SEEN.has(seenKey(p)));if(i<0)i=0;
  const go=()=>{VIRANDO=false;VIRA_T=0;if(!$("#layer .story"))return;ST={...ST,sec:nx,ids:ps.map(p=>p.id),i};drawStory(REDUZ.matches?null:(d>0?"in-r":"in-l"))};
  const si=$("#layer .story-in");if(!si||REDUZ.matches){go();return}
  VIRANDO=true;vibrar(6);$("#layer .story").classList.add("flipping");si.classList.add(d>0?"out-l":"out-r");VIRA_T=setTimeout(go,260)}
function storyGo(d){
  const ps=stPs();ST.i+=d;const L=storyOrdem(),k=L.indexOf(ST.sec);
  if(ST.i<0){const prev=L[k-1];if(prev){const pp=pautasDa(prev);ST={...ST,sec:prev,ids:pp.map(p=>p.id),i:pp.length-1}}else ST.i=0}
  else if(ST.i>=ps.length){const nx=L[k+1];if(!nx)return closeLayer();ST={...ST,sec:nx,ids:pautasDa(nx).map(p=>p.id),i:0}}
  drawStory();
}

