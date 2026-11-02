/* ---------- Etapa 69: grade de perfil ---------- */
var PFV=null,PF_ABA=(()=>{try{const a=localStorage.getItem("prumo-pf-aba");return ["posts","reels","marc","conta"].includes(a)?a:"posts"}catch(e){return "posts"}})(),PF_TROCA=[],PF_T={};
const PF_ABAS=[["posts","Publicações",'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16"/></svg>'],["reels","Reels",'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10.5 9.5v5l4-2.5z" fill="currentColor"/></svg>'],["marc","Marcado",'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="10.5" r="2.6"/><path d="M7.5 17.5c1-2.3 2.6-3.3 4.5-3.3s3.5 1 4.5 3.3"/></svg>'],["conta","Conta",'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M6 18l1.6-1.6M16.4 7.6L18 6"/></svg>']];
function pfLista(u,aba){const vs=pubVisiveis().filter(x=>x.tipo==="post");let l;
  if(aba==="marc")l=vs.filter(x=>x.autor!==u&&((x.estilo&&(x.estilo.tags||[]).some(t=>t.u===u))||(x.estilo&&(x.estilo.marcados||[]).includes(u))));
  else l=vs.filter(x=>x.autor===u&&(aba!=="reels"||(x.estilo&&x.estilo.reel)));return l.sort((a,b)=>b.at-a.at)}
async function pfCarregar(u){if(!SB||!S.uid||!S.membro||PUB.on===false)return;if(Date.now()-(PF_T[u]||0)<45000)return;PF_T[u]=Date.now();
  try{const r=await SB.from("publicacoes").select("*").eq("autor",u).eq("tipo","post").order("at",{ascending:false}).limit(90);if(r.error)return;const ids=new Set(PUB.itens.map(x=>x.id));
    (r.data||[]).forEach(x=>{x.fotos=Array.isArray(x.fotos)?x.fotos:[];try{pubLimpa(x)}catch(e){}if(!ids.has(x.id))PUB.itens.push(x)});await pubAssinar()}catch(e){}}
function pfCab(u){const eu=u===S.uid,st=pubStoriesDe(u),n=pfLista(u,"posts").length,na=amigosL().length,cm=!eu&&S.comuns?S.comuns[u]:null,vist=st.length&&st.every(x=>PUB_VISTOS.has(x.id));
  return `<div class="pf-cab"><button type="button" class="pf-av${st.length?(vist?" ring visto":" ring"):""}" ${st.length?`data-pfstory="${esc(u)}"`:eu?`data-criarde="story"`:""} aria-label="${st.length?"Ver o story":"Foto de "+esc(nomeDe(u))}"><span class="pf-avi">${avatar(u)}</span>${eu&&!st.length?`<i class="pf-mais" aria-hidden="true">+</i>`:""}</button>
    <div class="pf-num"><span><b>${n}</b>${n===1?"publicação":"publicações"}</span>${eu?`<span><b>${na}</b>${na===1?"amigo":"amigos"}</span>`:cm!=null?`<span><b>${cm}</b>${cm===1?"amigo em comum":"amigos em comum"}</span>`:""}</div></div>
    <b class="pf-nome">${esc(nomeDe(u))}</b>${eu?`<div class="pf-bts"><button type="button" class="btn ghost" data-criarde="post">Nova publicação</button><button type="button" class="btn ghost" data-convidar>Convidar amigo</button></div>`:S.amigos.has(u)?`<div class="pf-bts"><button type="button" class="btn" data-pfmsg="${esc(u)}">Mensagem</button></div>`:""}`}
function pfAbas(u,aba){return `<div class="pf-abas" role="tablist">${PF_ABAS.filter(a=>a[0]!=="conta"||u===S.uid).map(([k,n,ic])=>`<button type="button" role="tab" data-pfaba="${k}" aria-selected="${aba===k}" aria-label="${n}">${ic}</button>`).join("")}</div>`}
function pfTiles(l,aba,u){if(!l.length){const eu=u===S.uid;const msg=aba==="reels"?(eu?"Seus reels aparecem aqui.":"Nenhum reel ainda."):aba==="marc"?(eu?"Quando marcarem você numa foto, ela aparece aqui.":"Ninguém marcou "+esc(String(nomeDe(u)).split(" ")[0])+" ainda."):(eu?"Compartilhe sua primeira publicação.":"Nenhuma publicação ainda.");
    return `<div class="pf-vz"><b>${aba==="reels"?"Reels":aba==="marc"?"Fotos com você":"Publicações"}</b><span>${msg}</span>${eu&&aba!=="marc"?`<button type="button" class="btn" data-criarde="${aba==="reels"?"post":"post"}"${aba==="reels"?" data-pfreel":""}>${aba==="reels"?"Criar reel":"Nova publicação"}</button>`:""}</div>`}
  return `<div class="pf-grade">${l.map((x,i)=>{const es=x.estilo||{},f=x.fotos[0],uu=f&&pubUrl(f),nt=x.pid&&pautaById(x.pid);const ic=es.reel?"▶":(x.fotos.length+(x.pid&&x.fotos.length?1:0))>1?"⧉":"";
    const inner=uu?`<img src="${pubSrc(uu)}" alt="${esc((es.alt&&es.alt[0])||x.texto||"Publicação")}" loading="lazy" decoding="async">`:x.pid?`<span class="pf-nt"><small style="color:${secCor(nt?secOf(nt):"politica")}">${esc(nt?secNome(secOf(nt)):"Notícia")}</small><b>${esc(nt?versao(nt,lente()).titulo:(x.snap&&x.snap.titulo)||"Notícia")}</b></span>`:`<span class="pf-tx" style="background:${pubFundo(String(x.id).charCodeAt(0))}">${esc(String(x.texto||"").slice(0,110))}</span>`;
    return `<button type="button" class="pf-t" data-pfi="${i}" aria-label="${esc(es.reel?"Reel":"Publicação")} de ${esc(quando(x.at))}">${inner}${ic?`<i class="pf-ic">${ic}</i>`:""}</button>`}).join("")}</div>`}
/* troca de ids para a lista do perfil (o Feed e a lista podem ter o mesmo post) */
function pfIdsTroca(l){pfIdsVolta();l.forEach(x=>{document.querySelectorAll(`#posts [id="p-u:${x.id}"]`).forEach(el=>{el.id="p-u:"+x.id+"~f";PF_TROCA.push(el)})})}
function pfIdsVolta(){const t=PF_TROCA;PF_TROCA=[];t.forEach(el=>{if(el.isConnected){el.id=el.id.replace(/~f$/,"");try{updateSocial(el.dataset.pid)}catch(e){}}})}
/* perfil de amigo (camada) */
function abrirPerfil(u){if(!u||!S.uid)return;if(u===S.uid){if($("#layer").innerHTML)closeLayer();setTimeout(()=>{go("me");PF_ABA="posts";renderMe();scrollTo(0,0)},60);return}
  if($("#layer").innerHTML)closeLayer();PFV={u,aba:"posts",modo:"grade"};$("#layer").innerHTML=`<div class="pfv" role="dialog" aria-modal="true" aria-label="Perfil de ${esc(nomeDe(u))}"></div>`;if(pushH())HST++;uso("perfil");
  pfvDesenha();pfCarregar(u).then(()=>{if(PFV&&PFV.u===u&&PFV.modo==="grade")pfvDesenha()})}
function pfvDesenha(){const el=$("#layer .pfv");if(!el||!PFV)return;if(PFV.modo==="posts")return pfvPosts(el);
  el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-pfvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>${esc(nomeDe(PFV.u))}</b><span class="sp"></span></div><div class="pfv-sc">${pfCab(PFV.u)}${pfAbas(PFV.u,PFV.aba)}${pfTiles(pfLista(PFV.u,PFV.aba),PFV.aba,PFV.u)}</div>`}
function pfvPosts(el){const l=PFV.lista||[];el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-pfvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>${PFV.aba==="reels"?"Reels":PFV.aba==="marc"?"Marcações":"Publicações"}<small>${esc(nomeDe(PFV.u))}</small></b><span class="sp"></span></div><div class="pfv-sc pfv-posts">${l.map(x=>{try{return pubPostHTML(x)}catch(e){return ""}}).join("")}</div>`;
  pfIdsTroca(l);const sc=el.querySelector(".pfv-sc");try{wireTracks(sc)}catch(e){}l.forEach(x=>{try{updateSocial("u:"+x.id)}catch(e){}});const a=l[PFV.i];const alvo=a&&el.querySelector(`[id="p-u:${a.id}"]`);if(alvo){sc.scrollTop=alvo.offsetTop-sc.offsetTop;requestAnimationFrame(()=>{sc.scrollTop=alvo.offsetTop-sc.offsetTop})}}
function pfAbrePosts(u,aba,i){const lista=pfLista(u,aba);if(!lista[i])return;if(PFV&&$("#layer .pfv")&&PFV.modo==="grade"){PFV={...PFV,modo:"posts",aba,lista,i,daGrade:true};if(pushH())HST++;pfvDesenha();return}
  if($("#layer").innerHTML)closeLayer();PFV={u,aba,modo:"posts",lista,i,daGrade:false};$("#layer").innerHTML=`<div class="pfv" role="dialog" aria-modal="true" aria-label="Publicações"></div>`;if(pushH())HST++;pfvDesenha()}
{const _cl69=closeLayer;closeLayer=function(fromPop){if(fromPop===true&&PFV&&PFV.modo==="posts"&&PFV.daGrade&&$("#layer .pfv")&&!($("#layer2")?.innerHTML)){pfIdsVolta();PFV={...PFV,modo:"grade",lista:null};pfvDesenha();return}
  const r=_cl69.apply(this,arguments);if(!$("#layer .pfv")){if(PFV){pfIdsVolta();PFV=null}}return r}}
/* aba Perfil no estilo Instagram */
{const _rm69=renderMe;renderMe=function(){const r=_rm69.apply(this,arguments);try{if(!(S.uid&&S.db&&S.membro)||PUB.on===false)return r;const v=$("#v-me"),gut=v&&v.querySelector(".gut"),head=gut&&gut.querySelector(".me-head");if(!head)return r;
    const resto=document.createElement("div");resto.className="pf-conta";[...gut.children].forEach(c=>{if(c!==head)resto.appendChild(c)});
    gut.innerHTML=`<div class="pf-me">${pfCab(S.uid)}${pfAbas(S.uid,PF_ABA)}<div class="pf-corpo"></div></div>`;const corpo=gut.querySelector(".pf-corpo");
    if(PF_ABA==="conta")corpo.appendChild(resto);else{const pin=(S.pedidosIn||[]).filter(x=>S.membros[x]);corpo.innerHTML=(pin.length?`<div class="card amg pf-ped"><span class="amg-t">${pin.length===1?"Pedido de amizade":"Pedidos de amizade"}</span><ul class="amgl">${pin.map(x=>`<li>${avatar(x)}<span class="amg-n"><b>${esc(nomeDe(x))}</b></span><button type="button" class="btn amg-b" data-aceitar="${esc(x)}">Aceitar</button><button type="button" class="btn ghost amg-b" data-recusar="${esc(x)}">Recusar</button></li>`).join("")}</ul></div>`:"")+pfTiles(pfLista(S.uid,PF_ABA),PF_ABA,S.uid)}}catch(e){}return r}}
{const _go69=go;go=function(v){const r=_go69.apply(this,arguments);if(v==="me"&&S.uid&&S.membro)pfCarregar(S.uid).then(()=>{if(VIEW==="me")renderMe()});return r}}
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

