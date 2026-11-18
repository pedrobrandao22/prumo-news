/* ---------- Etapa 56 ---------- */
var DM_LP=0,TST_AT=0;
window.addEventListener("click",e=>{if(Date.now()-DM_LP<700&&e.target.closest&&e.target.closest(".scrim,.sheet")){e.stopPropagation();e.preventDefault()}},true);
async function dmCopiar(t){let ok=false;try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(t);ok=true}}catch(e){}
  if(!ok){try{const ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");ta.style.cssText="position:fixed;opacity:0;top:0";document.body.appendChild(ta);ta.select();ok=document.execCommand("copy");ta.remove()}catch(e){}}
  toast(ok?"Texto copiado":"Não deu para copiar aqui. Segure o texto para copiar.")}
/* 2. posts de membros nas Conversas */
function dmEhPub(m){return String(m.pid||"").indexOf("u:")===0}
/* 3. curtida de story lembrada */
var US_CURTI=new Set((()=>{try{return JSON.parse(localStorage.getItem("prumo-us-curti")||"[]")}catch(e){return []}})());
function usCurtiu(id){return US_CURTI.has(id)||S.msgsOut.some(m=>m.tipo==="curtiu_story"&&m.snap&&m.snap.story&&m.snap.story.id===id)}
{const _du56=igDrawUser;igDrawUser=function(){const r=_du56.apply(this,arguments);try{const x=ST.itens[ST.i];const b=$("#layer [data-uscurtir]");if(b&&x&&usCurtiu(x.id))b.classList.add("on")}catch(e){}return r}}
window.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer [data-uscurtir]");if(!b)return;const id=b.dataset.uscurtir;if(usCurtiu(id)){e.stopPropagation();b.classList.add("on");return}US_CURTI.add(id);try{localStorage.setItem("prumo-us-curti",JSON.stringify([...US_CURTI].slice(-300)))}catch(_){}},true);
/* 5. Feed com publicação apagada: redesenha ao entrar no Feed */
/* 8. voltar (gesto/botão do celular) com algo no criador: pede um segundo voltar */
var CR_VOLTA=0;

