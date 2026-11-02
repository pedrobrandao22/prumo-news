/* ---------- conta: Supabase ---------- */
%%PRUMO_DB%%
const SB_URL="%%SB_URL%%",SB_KEY="%%SB_KEY%%";
var INIT_FIM=false;
let SB=null,SESS_UID,SESS_TOK=0,CRIANDO=false;
const CONVITE_URL=(()=>{try{const q=new URLSearchParams(location.search),c=q.get("convite");if(c==null)return "";q.delete("convite");const r=q.toString();history.replaceState(history.state,"",location.pathname+(r?"?"+r:"")+location.hash);return c.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,20)}catch(e){return ""}})();
function sbCliente(){if(SB)return SB;const url=/^https:\/\/\S+$/.test(SB_URL)?SB_URL:"",key=SB_KEY&&SB_KEY.indexOf("%%")<0?SB_KEY:"";
  if(!url||!key||typeof criarDB!=="function"||!window.supabase||typeof supabase.createClient!=="function")return null;
  try{SB=supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:"prumo-auth"}})}catch(e){SB=null}return SB}
function pararSocial(){try{S.db&&S.db.fechar()}catch(e){}Object.keys(UNS).forEach(k=>delete UNS[k]);
  clearTimeout(prefTimer);clearTimeout(leituraTimer);leituraFila={};clearTimeout(histTimer);clearTimeout(usoTimer);HIST_SUJO=false;USO_SUJO=false;
  [PEND,CPEND,FILA].forEach(o=>Object.keys(o).forEach(k=>delete o[k]));clearTimeout(PODA_T);PODA_T=0;S._reCmt=null;S._reAmg=null;THREAD=null;QUIZ_LOCAL=null;
  Object.assign(S,{suspenso:false,adm:null,comuns:{},achados:{},bloq:[],db:null,user:null,uid:null,email:"",membro:false,membros:{},amigos:new Set(),amigosOk:false,pedidosIn:[],pedidosOut:[],raw:{curtidas:{},votos:{},juntos:{},listas:{}},soc:{curtidas:{},votos:{},juntos:{}},msgsIn:[],msgsOut:[],salvos:{},leituras:{},cmts:{},_cmtDocs:[],quizDocs:{},quiz:{},quizDias:{},juntos:{},listas:{},lista:{},erros:[]});
  renderSaved._ok=false;if(FEED)derivaQuiz()}
async function trocarSessao(user,forcar){
  const uid=user&&user.id||null;if(uid===SESS_UID&&!forcar)return;
  const tok=++SESS_TOK;SESS_UID=uid;pararSocial();
  if(!uid){INIT_FIM=true;rerenderAll();if(FEED&&FILTRO[0]==="_")renderFeed();avisoConta();if(CONVITE_URL&&!trocarSessao._conv){trocarSessao._conv=1;abrirLogin("criar",CONVITE_URL)}return}
  S.uid=uid;S.user={id:uid,email:user.email||""};S.email=user.email||"";S.db=criarDB(SB,uid);$("#avisoconta")?.remove();
  let membro=null;try{const g=await S.db.doc("pessoas/"+uid).get();membro=g.exists;if(g.exists)S.membros[uid]=g.data()}catch(e){}
  if(tok!==SESS_TOK)return;INIT_FIM=true;
  if(membro===false){S.membro=false;rerenderAll();if(!CRIANDO)abrirFaltaConvite();return}
  if(S.membros[uid]?.suspenso||S.membros[uid]?.excluido){S.membro=false;S.suspenso=true;rerenderAll();sheet("Conta suspensa",`<p style="margin:0;font-size:15px;line-height:1.5">Sua conta no Prumo está suspensa. Dá para ler as notícias, mas não para curtir, comentar ou conversar. Fale com o Pedro.</p><button type="button" class="btn ghost" data-close>Entendi</button>`);return}
  S.suspenso=false;
  S.membro=true;trocarSessao._conv=1;
  let dono=null;try{dono=localStorage.getItem("prumo-dono")}catch(e){}
  if(dono&&dono!==uid)limparLocalConta();   /* sobras de outra conta neste aparelho: não vão para esta */
  const donoNovo=dono!==uid;try{localStorage.setItem("prumo-dono",uid)}catch(e){}
  iniciarSocial(uid,donoNovo);rerenderAll();
}
/* poda: uma vez por sessão, apaga do banco o que já não aparece em lugar nenhum */
let PODA_T=0;
function podarDepois(){if(S._podou||PODA_T)return;PODA_T=setTimeout(podar,20000)}
async function podar(){PODA_T=0;if(!S.db||!S.uid||!S.membro||S._podou)return;S._podou=1;const agora=Date.now(),dia=864e5;
  const velhos=(m,dias,quando)=>Object.entries(m||{}).filter(([,v])=>{const t=quando(v);return t&&agora-t>dias*dia}).map(([k])=>k);
  const tempo=v=>typeof v==="number"?v:(v&&typeof v==="object"&&+v.at)||0;
  const tarefas=[["curtidas",velhos((S.raw.curtidas||{})[S.uid],45,tempo)],["leituras",[]]];
  const meusC=(S._cmtDocs.find(([u])=>u===S.uid)||[])[1];tarefas.push(["comentarios",velhos(meusC&&meusC.itens,60,tempo)]);
  const vt=(S.raw.votos||{})[S.uid]||{};if(Object.keys(vt).length>150&&FEED){const vivos=new Set((FEED.pautas||[]).map(p=>p.id));tarefas.push(["votos",Object.keys(vt).filter(k=>!vivos.has(k))])}
  for(const [col,ks] of tarefas){if(!ks.length)continue;const patch={};ks.slice(0,400).forEach(k=>patch[k]=null);try{await gravarMapa(col+"/"+S.uid,"itens",null,null,patch)}catch(e){}}
  for(const p of ["juntos/"+S.uid,"leituras/"+S.uid]){try{if(S.db)await S.db.doc(p).delete()}catch(e){}}}
function iniciarSocial(uid,donoNovo){
  const db=S.db,vale=()=>S.db===db;const mk=q=>q.docs.filter(d=>d.exists).map(d=>({id:d.id,...d.data()}));
  const soc=()=>{refiltrar();if(FEED)(FEED.pautas||[]).forEach(p=>updateSocial(p.id));document.querySelectorAll("#posts .upost[data-pid]").forEach(a=>updateSocial(a.dataset.pid));S._reCmt&&S._reCmt();if(VIEW==="me")renderMe();if(VIEW==="play")renderPlay();updatePlayBadge()};
  (async()=>{try{const g=await db.doc(`data/users/${uid}/prefs`).get();if(!vale())return;if(g.exists){const d=clone(g.data());if(!donoNovo&&(d.mod||0)<(PREF.mod||0)){salvarPrefs();throw 0}const loc=PREF.conhecidas||{};Object.assign(PREF,d);normPrefs();PREF.conhecidas={...(d.conhecidas||{}),...loc};PREF.ajuste=Object.assign({sec:{},tag:{}},d.ajuste||{});lsSet("radar-prefs",PREF);aplicarFonte();window.aplicarVidro&&aplicarVidro();if(FEED){calcularNovidades();renderFeed()}}else salvarPrefs()}catch(e){}})();
  db.collection("pessoas").onSnapshot(q=>{if(!vale())return;S.membros={};q.docs.forEach(d=>{if(d.exists)S.membros[d.id]=d.data()});rerenderAll()},()=>{});
  db.collection("amizades").onSnapshot(q=>{if(!vale())return;const am=new Set(),pin=[],pout=[];q.docs.forEach(d=>{const x=d.data();if(!x)return;const o=x.de===uid?x.para:x.de;if(x.status==="aceita")am.add(o);else if(x.para===uid){if(x.status==="pendente")pin.push(x.de)}else pout.push(x.para)});
    S.amigos=am;S.pedidosIn=pin;S.pedidosOut=pout;S.amigosOk=true;derivaQuiz();if(FEED&&FILTRO[0]==="_"&&!am.size)renderFeed();rerenderAll()},()=>{});
  ["curtidas","votos"].forEach(col=>db.collection(col).onSnapshot(q=>{if(!vale())return;const r={};q.docs.forEach(d=>{if(d.exists)r[d.id]=(d.data()||{}).itens||{}});S.raw[col]=r;recalcSoc(col);soc();podarDepois()},()=>{}));
  db.collection("comentarios").onSnapshot(q=>{if(!vale())return;S._cmtDocs=q.docs.filter(d=>d.exists).map(d=>[d.id,d.data()]);S.cmts=montarCmts(S._cmtDocs);soc();podarDepois()},()=>{});
  db.doc("quiz/"+uid).onSnapshot(d=>{if(!vale())return;S.quizDocs=d.exists?{[uid]:d.data()||{}}:{};derivaQuiz();renderChgBox();updatePlayBadge();if(VIEW==="play")renderPlay()},()=>{});
  db.collection("mensagens").where("para","==",uid).onSnapshot(q=>{if(!vale())return;S.msgsIn=mk(q);updateBadge();if(VIEW==="msgs")renderMsgs();atualizarChatPosts()},()=>{});
  db.collection("mensagens").where("de","==",uid).onSnapshot(q=>{if(!vale())return;S.msgsOut=mk(q);if(VIEW==="msgs")renderMsgs();if(VIEW==="me")renderMe();atualizarChatPosts()},()=>{});
  db.doc(`data/users/${uid}/salvos`).onSnapshot(d=>{if(!vale())return;const it=d.exists?(d.data().itens||{}):{};S.salvos={};let nulos=0;Object.entries(it).forEach(([k,v])=>{if(v)S.salvos[k]=clone(v);else nulos++});rerenderAll();if(nulos>25&&!S._compactou){S._compactou=1;const p=`data/users/${uid}/salvos`;emFila(p,()=>db.doc(p).set({itens:clone(S.salvos)})).catch(()=>{})}},()=>{});
  db.collection("erros").where("uid","==",uid).onSnapshot(q=>{if(!vale())return;S.erros=mk(q).sort((a,b)=>b.at-a.at);if(VIEW==="me")renderMe()},()=>{});
  (async()=>{try{const gh=await db.doc(`data/users/${uid}/historico`).get();if(!vale())return;if(gh.exists){HIST={...(gh.data().itens||{}),...HIST};lsSet("radar-hist",HIST)}}catch(e){}})();
  carregarErrosResp();db.rpc("meus_bloqueios").then(r=>{if(vale())S.bloq=(r||[]).map(x=>x.uid)}).catch(()=>{});
  const espera=()=>{if(!vale())return;if(!FEED){setTimeout(espera,500);return}subEdicao()};espera();
}
async function initSocial(){
  try{if(sessionStorage.getItem("prumo-excluida")){sessionStorage.removeItem("prumo-excluida");toast("Sua conta foi excluída.")}}catch(e){}
  if(!window.supabase){carregarSbjs();await Promise.race([window.SBJS_PRONTO,new Promise(r=>setTimeout(r,20000))])}
  const sb=sbCliente();if(!sb){SESS_UID=null;INIT_FIM=true;avisoConta();if(CONVITE_URL)abrirLogin("criar",CONVITE_URL);return}
  try{sb.auth.onAuthStateChange((ev,sess)=>{const u=sess&&sess.user||null;setTimeout(()=>trocarSessao(u),0)})}catch(e){}
  let s=null;try{s=(await sb.auth.getSession()).data.session}catch(e){}
  await trocarSessao(s&&s.user||null);
}
loadFeed();setTimeout(initSocial,0);
if("serviceWorker" in navigator&&location.protocol==="https:")addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})});
/* ================= v12: revisão geral ================= */
const vibrar=(ms=10)=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
/* 1. atualização com o app aberto */
function diffFeed(f){if(!FEED)return 0;const cur=new Map((FEED.pautas||[]).map(p=>[p.id,versaoP(p)]));return (f.pautas||[]).filter(p=>cur.get(p.id)!==versaoP(p)).length}
let CHK_T=0;
async function checarFeed(forcar){
  if(!forcar&&Date.now()-CHK_T<60000)return;CHK_T=Date.now();
  try{const r=await fetch("feed.json",{cache:"no-cache"});if(!r.ok)throw 0;const f=await r.json();if(OFFLINE){OFFLINE=false;$(".late.offl")?.remove();if(FEED&&JSON.stringify(f)===JSON.stringify(FEED)){if(forcar)toast("Conexão de volta.");return}}
    if(FEED&&JSON.stringify(f)===JSON.stringify(FEED)){if(forcar)toast("Nada novo desde as "+hhmm(FEED.atualizado_em));return}
    lsSet("radar-feed",f);
    const quieto=(VIEW==="feed"||VIEW==="capa")&&scrollY<60&&!$("#layer").innerHTML;
    if(forcar||quieto){aplicarNovo(f);if(forcar)toast("Atualizado: edição das "+hhmm(f.atualizado_em))}
    else{NOVO=f;mostrarPilula(Math.max(1,diffFeed(f)))}
  }catch(e){if(forcar)toast("Sem conexão agora. Tente de novo.")}
}
document.addEventListener("click",e=>{const cof=e.target.closest("#v-capa .cp-off [data-retry]");if(cof){cof.disabled=true;cof.textContent="Carregando…";setTimeout(()=>{if(!FEED&&document.contains(cof)){cof.disabled=false;cof.textContent="Tentar de novo";toast("Ainda sem conexão. Tente daqui a pouco.")}},9000)}if(e.target.closest("[data-retry]")){e.stopPropagation();if(FEED)checarFeed(true);else{$("#posts").innerHTML=`<p class="empty">Carregando as notícias de hoje…</p>`;loadFeed()}}},true);
function aplicarNovo(f){NOVO=null;$("#pilula")?.remove();prepararFeed(f)}
function mostrarPilula(n){let b=$("#pilula");if(!b){b=document.createElement("button");b.id="pilula";b.type="button";b.className="pilula";document.body.appendChild(b)}b.textContent=`${n} ${n===1?"novidade":"novidades"} · toque para ver`;b.hidden=VIEW!=="feed"&&VIEW!=="capa"}
document.addEventListener("visibilitychange",()=>{document.querySelectorAll(".track").forEach(t=>clearTimeout(t._t));if(!document.hidden){if(VIEW==="msgs"&&THREAD)renderMsgs();carregarRodadas();tkStart();if(FEED)checarFeed(false);else loadFeed()}});
addEventListener("online",()=>{if(FEED)checarFeed(false);else loadFeed()});
setInterval(()=>{if(!document.hidden&&FEED)checarFeed(false)},10*60*1000);
setInterval(()=>{if(document.hidden||!FEED)return;document.querySelectorAll("time[data-when]").forEach(t=>{const q=quando(t.dataset.when);if(t.textContent!==q)t.textContent=q});if(VIEW==="feed"&&!$("#layer").innerHTML)renderChgBox()},60000);
/* 2. voltar do celular */
function hPush(){try{history.pushState({prumo:Date.now()},"");return true}catch(e){return false}}
window.addEventListener("popstate",()=>{if(IGN>0){IGN--;if(!IGN)while(PUSHQ>0){PUSHQ--;hPush()}return}
  if(HST>0){HST--;closeLayer(true);return}
  if(JUMPS.length&&TST>0&&(JUMPS[JUMPS.length-1].at||0)>TST_AT){voltarDoSalto();return}
  if(TST>0){TST--;THREAD=null;if(THREAD_DE){const d=THREAD_DE;THREAD_DE=null;if(d===RAIZ&&VST>0){VST--;voltarH(1)}go(d,true);return}renderMsgs();return}
  if(JUMPS.length){voltarDoSalto();return}
  if(FST>0){FST--;FILTRO="tudo";ssSet("radar-filtro",FILTRO);renderSecs();renderPosts();return}
  if(SUBV>0&&(VIEW==="saved"||VIEW==="play")){SUBV--;go("me",true);return}
  if(VST>0){VST--;go(RAIZ,true);return}});
/* 7. arrastar janelas para fechar */
function wireSheetDrag(sh){if(!sh)return;
  const solta=(dy,lim)=>{sh.style.transition="transform .2s ease";if(dy>lim){sh.style.transform="translateY(100%)";setTimeout(()=>closeLayer(),170)}else sh.style.transform=""};
  [sh.querySelector(".grab"),sh.querySelector(".sh-h")].filter(Boolean).forEach(z=>{let y0=null,dy=0;
    z.addEventListener("touchstart",e=>{if(e.target.closest("button"))return;y0=e.touches[0].clientY;dy=0;sh.style.transition="none"},{passive:true});
    z.addEventListener("touchmove",e=>{if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);sh.style.transform=`translateY(${dy}px)`},{passive:true});
    z.addEventListener("touchend",()=>{if(y0==null)return;y0=null;solta(dy,90)})});
  const b=sh.querySelector(".sh-b");if(b){let y0=null,dy=0;
    b.addEventListener("touchstart",e=>{if(e.target.closest("[data-hdl],.track,.gr-box,input,textarea,select")){y0=null;return}y0=b.scrollTop<=0?e.touches[0].clientY:null;dy=0},{passive:true});
    b.addEventListener("touchmove",e=>{if(y0==null)return;dy=e.touches[0].clientY-y0;if(dy>0&&b.scrollTop<=0){sh.style.transition="none";sh.style.transform=`translateY(${dy}px)`}else if(dy<0){y0=null;sh.style.transform=""}},{passive:true});
    b.addEventListener("touchend",()=>{if(y0==null)return;y0=null;solta(dy,120)})}}
/* 10. aviso de conta */
function avisoConta(){if(S.uid||$("#avisoconta"))return;let vis=false;try{vis=sessionStorage.getItem("prumo-aviso")==="1"}catch(e){}if(vis)return;
  const a=document.createElement("div");a.id="avisoconta";a.className="avisoconta gut";a.innerHTML=`<span>Você está só lendo. Entre para gostar, comentar e conversar.</span><button type="button" class="av-entrar" data-entrar>Entrar</button><button type="button" class="av-x" data-fecharaviso aria-label="Fechar aviso">✕</button>`;
  $("#secs")?.after(a)}
/* 13. quem gostou */
function abrirQuem(pid){const it=socialOf(pid).likes.map(u=>[u,curtidasDe(u)[pid]?.at||0]).sort((a,b)=>b[1]-a[1]);
  sheet("Quem gostou",it.length?`<ul class="clist">${it.map(([u,t])=>`<li>${avatar(u)}<div><span><b>${esc(u===S.uid?"Você":nomeDe(u))}</b></span><i>${t?esc(quando(t)):""}</i></div></li>`).join("")}</ul>`:`<div class="empty"><b>Ninguém ainda</b></div>`)}
/* 14. toque duplo na capa */
let ULT={t:0,el:null},TS0=null;
document.addEventListener("touchstart",e=>{const t=e.touches[0];TS0=t?{x:t.clientX,y:t.clientY,t:Date.now(),n:e.touches.length}:null},{passive:true});
document.addEventListener("touchend",e=>{const c=e.target.closest(".cover");if(!c||e.target.closest("button"))return;const now=Date.now(),t=e.changedTouches[0];
  if(!TS0||TS0.n>1||!t||Math.hypot(t.clientX-TS0.x,t.clientY-TS0.y)>10||now-TS0.t>280){ULT={t:0,el:null};return}if(ULT.el===c&&now-ULT.t<320){e.preventDefault();duploGostei(c);ULT={t:0,el:null}}else ULT={t:now,el:c}},{passive:false});
function duploGostei(c){const pid=c.closest("[data-pid]")?.dataset.pid;if(!pid)return;if(!S.uid){precisaConta();return}
  if(!socialOf(pid).likes.includes(S.uid))toggleLike(pid);const s=document.createElement("span");s.className="pop";s.innerHTML=ICON.like;c.appendChild(s);setTimeout(()=>s.remove(),950);vibrar(15)}
/* 15. puxar para atualizar */
(()=>{if(1)return;let y0=null,x0=0,dy=0;const ind=document.createElement("div");ind.id="ptr";ind.setAttribute("aria-hidden","true");ind.innerHTML='<svg viewBox="0 0 64 112"><rect x="14" y="0" width="36" height="7" rx="1.5"/><rect x="29.5" y="6" width="5" height="46"/><path d="M18 60H46L52 74L32 112L12 74Z"/></svg>';document.body.appendChild(ind);
  document.addEventListener("touchstart",e=>{if(VIEW!=="feed"||scrollY>0||$("#layer").innerHTML||e.target.closest(".tk-vp")){y0=null;return}y0=e.touches[0].clientY;x0=e.touches[0].clientX;dy=0},{passive:true});
  document.addEventListener("touchmove",e=>{if(y0==null)return;dy=e.touches[0].clientY-y0;if(dy<25&&Math.abs(e.touches[0].clientX-x0)>Math.abs(dy)+6){y0=null;ind.style.opacity=0;ind.style.transform="";return}if(dy<=0||scrollY>0){ind.style.opacity=0;return}const dd=Math.min(dy,130);ind.style.opacity=Math.min(1,dd/75);ind.style.transform=`translate(-50%,${dd*.5}px) rotate(${(dd-65)*.4}deg)`},{passive:true});
  document.addEventListener("touchend",()=>{if(y0==null)return;y0=null;if(dy>80&&scrollY<=0){ind.classList.add("spin");vibrar(8);checarFeed(true).finally(()=>{ind.classList.remove("spin");ind.style.opacity=0;ind.style.transform=""})}else{ind.style.opacity=0;ind.style.transform=""}},{passive:true});})();
/* 17. listas do perfil */
function abrirMinhaLista(tipo){const u=S.uid;if(!u){precisaConta();return}let html="",tit="";
  const row=(id,snap,sub)=>`<li><button type="button" data-goto="${esc(id)}"><b>${esc(snap?.titulo||"Notícia")}</b><span>${sub}</span></button></li>`;
  if(tipo==="gostei"){tit="Notícias que você gostou";const it=Object.entries(curtidasDe(u)).filter(([,x])=>x).sort((a,b)=>(b[1].at||0)-(a[1].at||0));html=it.map(([id,x])=>{const sn=x.snap&&x.snap.titulo?x.snap:snapById(id);return row(id,sn,esc(secNome(sn?.secao||"politica"))+" · "+esc(quando(x.at)))}).join("")}
  if(tipo==="cmt"){tit="Seus comentários";const it=todosComentarios().filter(c=>c.uid===u).map(c=>({id:c.pid,snap:c.snap||snapById(c.pid),c}));it.sort((a,b)=>b.c.at-a.c.at);html=it.map(x=>row(x.id,x.snap,"“"+esc(x.c.texto.slice(0,90))+"” · "+esc(quando(x.c.at)))).join("")}
  if(tipo==="env"){tit="Notícias que você enviou";const it=S.msgsOut.filter(m=>m.pid&&!m.resp&&m.tipo!=="cutucada").sort((a,b)=>b.at-a.at);html=it.map(m=>row(m.pid,m.snap,"Para "+esc(nomeDe(m.para))+" · "+esc(quando(m.at)))).join("")}
  sheet(tit,html?`<ul class="sres">${html}</ul>`:`<div class="empty"><b>Nada por aqui ainda</b></div>`)}
/* 19. ponto no Interagir */
function updatePlayBadge(){if(!FEED)return;const enq=visiveis().filter(p=>p.enquete&&(p.enquete.opcoes||[]).length);const pend=S.uid?enq.filter(p=>meuVoto(p.id)==null).length:0;const qz=(FEED.quiz||[]).length&&!(S.quiz||{})[S.uid||"eu"]?1:0;const b=$("#pbadge");if(b){b.hidden=!qz;b.textContent="";b.classList.add("pdot");b.setAttribute("aria-label",qz?"Quiz do dia esperando":"")}}
/* 21. arrastar seções nos ajustes */
document.addEventListener("pointerdown",e=>{const h=e.target.closest("[data-hdl]");if(!h)return;e.preventDefault();const li=h.closest("li"),ul=li.parentElement,y0=e.clientY,r0=li.getBoundingClientRect();li.classList.add("drag");try{h.setPointerCapture(e.pointerId)}catch(_){}let idx=[...ul.children].indexOf(li);
  const mv=ev=>{const dy=ev.clientY-y0;li.style.transform=`translateY(${dy}px)`;const mid=r0.top+r0.height/2+dy;let k=0;[...ul.children].forEach(c=>{if(c===li)return;const r=c.getBoundingClientRect();if(mid>r.top+r.height/2)k++});idx=k};
  const up=()=>{h.removeEventListener("pointermove",mv);h.removeEventListener("pointerup",up);h.removeEventListener("pointercancel",up);li.classList.remove("drag");li.style.transform="";
    const ids=[...ul.children].map(c=>c.querySelector("[data-hdl]")?.dataset.hdl).filter(Boolean),cur=h.dataset.hdl,rest=ids.filter(x=>x!==cur);rest.splice(idx,0,cur);
    if(rest.join()!==ids.join()){PREF.ordem2=rest;salvarPrefs();refreshAjustes();if(FEED)renderFeed();vibrar(8)}};
  h.addEventListener("pointermove",mv);h.addEventListener("pointerup",up);h.addEventListener("pointercancel",up)});
/* 22. prévia das outras notícias */
function abrirBreve(i){const b=(window.BREVES||[])[i];if(!b)return;const rel=agPid({texto:b.titulo});const rp=rel&&pautaById(rel);
  sheet(secNome(b.secao||"politica"),`<h3 style="margin:0;font-family:var(--f-display);font-size:21px;line-height:1.25">${esc(b.titulo)}</h3><p class="hint" style="margin:0">${esc(nomeFonte(b.fonte))} · ${esc(secNome(b.secao||"politica"))}</p>
    ${rp?`<div class="card"><span class="hint">Relacionada no Prumo</span><button type="button" class="link" data-goto="${esc(rp.id)}">${esc(rp.neutro?.titulo||"")} ›</button></div>`:""}
    <a class="btn" href="${escU(b.url)}" target="_blank" rel="noopener">Ler em ${esc(nomeFonte(b.fonte))} ›</a><p class="hint" style="margin:0">Notícia menor desta edição: o Prumo só traz o título e o link, sem resumo próprio.</p>`)}
/* 23. rodadas */
function proximaRodadaTxt(){const m=minAgoraSP(),cand=[];for(let h=7;h<=23;h++)if(h!==17)cand.push([h*60+48,"rápida"]);cand.push([6*60+52,"completa"],[17*60+52,"completa"]);cand.sort((a,b)=>a[0]-b[0]);const nx=cand.find(c=>c[0]>m);const f=c=>`${Math.floor(c[0]/60)}h${String(c[0]%60).padStart(2,"0")}`;return nx?`Próxima atualização ${nx[1]} por volta das ${f(nx)}.`:`Próxima atualização amanhã por volta das 6h52.`}
function abrirRodadas(redesenho){const r=S.rodadas||{};const it=Object.entries(r.itens||{}).sort((a,b)=>b[0].localeCompare(a[0]));const e=estadoRadar();
  sheet("Atualizações de hoje",`<div id="rodbox" style="display:contents"><p class="hint" style="margin:0">${esc(e.txt||"")} ${proximaRodadaTxt()} A edição completa sai às 6h52; as rápidas, às 10h48, 13h48, 17h48 e 21h48.</p>${it.length?`<ul class="sres">${it.map(([h,x])=>`<li><div style="padding:10px 0;display:flex;flex-direction:column;gap:2px"><b>${esc(h)} · ${x.tipo==="completa"?"Rodada completa":x.tipo==="virada"?"Virada da meia-noite":"Rodada rápida"} · ${x.status==="ok"?"publicada":x.status==="sem_mudancas"?"sem novidade":"problema"}</b><span class="hint">${x.pautas!=null?esc(x.pautas)+" notícias · ":""}${x.mudancas!=null?esc(x.mudancas)+" mudanças · ":""}${x.checagem?esc(x.checagem):""}${x.nota?" · "+esc(x.nota):""}</span></div></li>`).join("")}</ul>`:`<p class="hint">O registro das rodadas de hoje aparece aqui a partir da próxima atualização.</p>`}</div>`);
  if(!redesenho)carregarRodadas(true)}
/* 24. story passando sozinho */
function storyAuto(p){clearTimeout(ST.timer);if(!PREF.storyAuto)return;const w=((p.neutro?.titulo||"")+" "+(p.neutro?.texto||"")).split(/\s+/).length;const dur=Math.max(7000,Math.min(24000,w/3.2*1000));
  const fill=$("#layer .bars b");if(fill)fill.style.animationDuration=dur+"ms";ST.fim=Date.now()+dur;ST.resto=dur;ST.timer=setTimeout(()=>storyGo(1),dur);
  const el=$("#layer .story");if(!el||el._auto)return;el._auto=true;
  el.addEventListener("pointerdown",ev=>{if(ev.target.closest(".s-f,.s-h,.us-it"))return;if(!PREF.storyAuto||!ST.timer)return;clearTimeout(ST.timer);ST.timer=0;ST.resto=Math.max(800,ST.fim-Date.now());const f=$("#layer .bars b");if(f)f.style.animationPlayState="paused"});
  const volta=()=>{if(!PREF.storyAuto||ST.timer||!$("#layer .story")||$("#layer2").innerHTML)return;ST.fim=Date.now()+ST.resto;ST.timer=setTimeout(()=>storyGo(1),ST.resto);const f=$("#layer .bars b");if(f)f.style.animationPlayState="running"};
  el.addEventListener("pointerup",volta);el.addEventListener("pointercancel",volta)}
function storyRetoma(){if(!PREF.storyAuto||ST.timer||!$("#layer .story")||$("#layer2")?.innerHTML)return;const r=ST.resto||4000;ST.fim=Date.now()+r;ST.timer=setTimeout(()=>storyGo(1),r);const f=$("#layer .bars b");if(f)f.style.animationPlayState="running"}
