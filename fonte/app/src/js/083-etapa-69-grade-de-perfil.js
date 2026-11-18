/* ---------- Etapa 69: grade de perfil ---------- */
var PFV=null,PF_ABA=(()=>{try{const a=localStorage.getItem("prumo-pf-aba");return ["posts","reels","marc","conta"].includes(a)?a:"posts"}catch(e){return "posts"}})(),PF_TROCA=[],PF_T={};
const PF_ABAS=[["posts","Publicações",'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16"/></svg>'],["reels","Reels",'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10.5 9.5v5l4-2.5z" fill="currentColor"/></svg>'],["marc","Marcado",'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="10.5" r="2.6"/><path d="M7.5 17.5c1-2.3 2.6-3.3 4.5-3.3s3.5 1 4.5 3.3"/></svg>'],["conta","Ajustes",'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>']];
/* troca de ids para a lista do perfil (o Feed e a lista podem ter o mesmo post) */
function pfIdsTroca(l){pfIdsVolta();l.forEach(x=>{document.querySelectorAll(`#posts [id="p-u:${x.id}"]`).forEach(el=>{el.id="p-u:"+x.id+"~f";PF_TROCA.push(el)})})}
function pfIdsVolta(){const t=PF_TROCA;PF_TROCA=[];t.forEach(el=>{if(el.isConnected){el.id=el.id.replace(/~f$/,"");try{updateSocial(el.dataset.pid)}catch(e){}}})}
/* perfil de amigo (camada) */
function pfAbrePosts(u,aba,i){const lista=pfLista(u,aba);if(!lista[i])return;if(PFV&&$("#layer .pfv")&&PFV.modo==="grade"){PFV={...PFV,modo:"posts",aba,lista,i,daGrade:true};if(pushH())HST++;pfvDesenha();return}
  if($("#layer").innerHTML)closeLayer();PFV={u,aba,modo:"posts",lista,i,daGrade:false};$("#layer").innerHTML=`<div class="pfv" role="dialog" aria-modal="true" aria-label="Publicações"></div>`;if(pushH())HST++;pfvDesenha()}
/* aba Perfil no estilo Instagram */
/* toques */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(b=t.closest("[data-pfaba]")){pare();const k=b.dataset.pfaba;if(t.closest("#layer .pfv")){PFV.aba=k;pfvDesenha()}else{PF_ABA=k;try{localStorage.setItem("prumo-pf-aba",k)}catch(_){}renderMe()}return}
  if(b=t.closest("[data-pfi]")){pare();const i=+b.dataset.pfi;if(t.closest("#layer .pfv"))pfAbrePosts(PFV.u,PFV.aba,i);else pfAbrePosts(S.uid,PF_ABA,i);return}
  if(t.closest("[data-pfvolta]")){pare();history.back();return}
  if(b=t.closest("[data-pfstory]")){pare();const u=b.dataset.pfstory;if($("#layer").innerHTML)closeLayer();setTimeout(()=>igAbrirUser(u),80);return}
  if(b=t.closest("[data-pfmsg]")){pare();const u=b.dataset.pfmsg;closeLayer();setTimeout(()=>abrirConversa(u),80);return}
  if(t.closest("[data-pfreel]")){/* abre direto no modo Reels */setTimeout(()=>{if(ED){ED.modo="reel";edDesenha()}},120)}
  /* entradas para o perfil */
  if(b=t.closest(".upost .up-au")){const a=b.closest(".upost"),x=a&&pubDe(String(a.dataset.pid||"").slice(2));if(x){pare();abrirPerfil(x.autor)}return}
  if(b=t.closest("#layer .story.sg-user .sg-who b,#layer .story.sg-user .us-av")){const x=ST&&ST.itens&&ST.itens[ST.i];if(x&&x.autor){pare();abrirPerfil(x.autor)}return}
  if(b=t.closest(".dm-th-h .dm-who")){if(THREAD){pare();abrirPerfil(THREAD)}return}
  if(b=t.closest(".amg-r .av")){const r=b.closest(".amg-r");const u=r&&r.dataset.conversa;if(u){pare();abrirPerfil(u)}return}},true);
/* reels tocando na lista do perfil */
setInterval(()=>{const vs=document.querySelectorAll("#layer .pfv .up-vid");if(!vs.length)return;const H=innerHeight;vs.forEach(v=>{const r=v.getBoundingClientRect();const vis=r.height>0&&r.top<H*.75&&r.bottom>H*.25&&!($("#layer2")?.innerHTML);
  if(vis){if(!v.src&&v.dataset.vsrc){v.src=v.dataset.vsrc;if(+v.dataset.ini)v.currentTime=+v.dataset.ini}if(v.paused)v.play().catch(()=>{})}else if(!v.paused)v.pause()})},500);

