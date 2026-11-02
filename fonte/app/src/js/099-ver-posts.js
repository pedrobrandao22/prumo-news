/* ---------- 099: ver e reagir aos posts dos membros, no jeito do Instagram ----------
   Salvar posts (aba Salvos no seu perfil), toque na foto mostra as marcações, coração grande no duplo toque,
   folha de comentários alta com emojis rápidos, linha de curtidas quando só você curtiu, "Na conversa" sem repetir
   menções, aviso de menção discreto no topo, folha de enviar com Story / Copiar link / Outros apps,
   post aberto pela grade fica logo abaixo da barra e fecha deslizando para a direita, contador 1/3 na foto,
   local truncado antes da hora, legenda do criador sem linha cortada. */
const VP99_BM='<svg class="ico vp99-bm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.7-6.5 4.7v-16a1 1 0 0 1 1-1z"/></svg>';
const VP99_CORACAO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8.2-4.9-9.9-10.1C.9 7.4 3.2 4 6.8 3.8c2.2-.1 4 1.1 5.2 3 1.2-1.9 3-3.1 5.2-3 3.6.2 5.9 3.6 4.7 7.1C20.2 16.1 12 21 12 21z"/></svg>';
const VP99_EMOJIS=["❤️","🙌","🔥","👏","😢","😍","😮","😂"];
const vp99Anim=()=>{try{return typeof ANIM_OK==="function"?ANIM_OK():true}catch(e){return false}};
function vp99Pop(b){if(!b||!vp99Anim())return;b.classList.remove("pulsa");void b.offsetWidth;b.classList.add("pulsa")}
/* S.salvos real enquanto renderMe/renderSaved trabalham com a cópia sem os posts */
const vp99Sv=()=>window.__vp99sv||S.salvos||{};
const vp99EhPost=k=>String(k||"").indexOf("u:")===0;

/* ===== cartão do post ===== */
{const _pp99=pubPostHTML;pubPostHTML=function(x){let h=_pp99.apply(this,arguments);if(!h||!x)return h;try{
    /* marcador de salvar (o botão já existia, escondido) */
    h=h.replace(/<button[^>]*data-a="save"[^>]*>[\s\S]*?<\/button>/,`<button type="button" class="act vp99-sv" data-a="save" aria-label="Salvar" aria-pressed="false">${VP99_BM}</button>`);
    /* local · hora: o local encolhe, a hora fica inteira */
    const es=x.estilo||{};
    if(es.local){const loc=esc(es.local);h=h.replace(/<span class="ph-sub">([^<]*)<\/span>/,(a,c)=>c.indexOf(loc+" · ")===0?`<span class="ph-sub vp99-sub"><span class="vp99-loc">${loc}</span><span class="vp99-qd">&nbsp;· ${c.slice(loc.length+3)}</span></span>`:a)}
    /* contador 1/N em cima da foto enquanto desliza */
    const n=(h.match(/class="sl /g)||[]).length;if(n>1)h=h.replace('<div class="car">',`<div class="car vp99-car"><span class="vp99-pg" aria-hidden="true">1/${n}</span>`);
  }catch(e){}return h}}
document.addEventListener("scroll",e=>{const t=e.target;if(!t||!t.classList||!t.classList.contains("track"))return;const pg=t.parentElement&&t.parentElement.querySelector(":scope > .vp99-pg");if(!pg)return;
  const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth));pg.textContent=`${Math.min(i+1,t.children.length)}/${t.children.length}`;pg.classList.add("on");clearTimeout(pg._t);pg._t=setTimeout(()=>pg.classList.remove("on"),1400)},true);

/* ===== curtidas, comentários e "Na conversa" ===== */
function vp99Social(pid){const el=document.getElementById("p-"+pid);if(!el)return;const up=vp99EhPost(pid);const {likes,cm}=socialOf(pid);
  const lk=el.querySelector("[data-likes]");
  if(lk&&!lk.textContent.trim()&&S.uid&&likes.length===1&&likes[0]===S.uid){lk.innerHTML=up?`Curtido por <b>você</b>`:`<b>Você</b> gostou`;lk.dataset.a="quem";lk.setAttribute("role","button");lk.tabIndex=0}
  const nc=el.querySelector("[data-nchat]");
  if(nc&&typeof allMsgs==="function"){const ms=allMsgs().filter(m=>m.pid===pid&&m.texto&&m.tipo!=="mencao");const u=ms[ms.length-1];
    nc.innerHTML=u?`<button type="button" class="nachat" data-nachat="${esc(u.de===S.uid?u.para:u.de)}">${ICON.cmt}<span><b>Na conversa</b> · ${esc(u.de===S.uid?"Você":nomeDe(u.de))}: ${esc(u.texto)}</span></button>`:""}
  const ver=el.querySelector('[data-cmts] > .link[data-a="cmt"]');if(ver)ver.textContent=`Ver todos os ${cm.length} comentários`;
  const sv=el.querySelector('.vp99-sv');if(sv)sv.setAttribute("aria-label",vp99Sv()[pid]?"Remover dos salvos":"Salvar")}
{const _us99=updateSocial;updateSocial=function(pid){const r=_us99.apply(this,arguments);try{vp99Social(pid)}catch(e){}return r}}
{const _tl99=toggleLike;toggleLike=function(pid){const antes=!!(S.uid&&socialOf(pid).likes.includes(S.uid));const r=_tl99.apply(this,arguments);try{if(!antes&&S.uid)vp99Pop(document.querySelector(`[id="p-${pid}"] .acts [data-a="like"]`))}catch(e){}return r}}

/* ===== toque na foto: um toque mostra as marcações, dois toques curte (coração grande) ===== */
(function(){let x0=0,y0=0,t0=0,tm=0;const SEL="#posts .upost .up-sl,#layer .pfv .upost .up-sl";
  document.addEventListener("pointerdown",e=>{x0=e.clientX;y0=e.clientY;t0=Date.now()},true);
  document.addEventListener("pointerup",e=>{const sl=e.target.closest&&e.target.closest(SEL);if(!sl||e.target.closest("button,a,.up-ntc,video"))return;const post=sl.closest(".upost");
    /* o 081 acabou de pôr o coração: é o segundo toque */
    const h=sl.querySelector(".up-heart:not(.vp99-h)");
    if(h){clearTimeout(tm);tm=0;h.classList.add("vp99-h");if(!vp99Anim())h.classList.add("vp99-sem");h.innerHTML=VP99_CORACAO;vp99Pop(post.querySelector('.acts [data-a="like"]'));return}
    if(Math.hypot(e.clientX-x0,e.clientY-y0)>12||Date.now()-t0>600)return;
    clearTimeout(tm);tm=setTimeout(()=>{tm=0;if(post.isConnected&&post.querySelector(".up-tg"))post.classList.toggle("tags-on")},330)},true)})();

/* ===== salvar posts ===== */
{const _ts99=toggleSave;toggleSave=function(pid){if(!vp99EhPost(pid))return _ts99.apply(this,arguments);return vp99Salvar(pid)}}
async function vp99Salvar(pid){uso("salvar_post");if(precisaConta())return;const id=String(pid).slice(2),x=pubDe(id);const on=!S.salvos[pid],ant=S.salvos[pid];
  const val=on?{at:Date.now(),snap:{id:pid,upub:id,autor:x?x.autor:""}}:null;if(on)S.salvos[pid]=val;else delete S.salvos[pid];
  updateSocial(pid);if(on)vp99Pop(document.querySelector(`[id="p-${pid}"] .acts [data-a="save"]`));vibrar(8);
  toast(on?"Salvo":"Removido dos salvos",on?"Ver salvos":"",on?vp99VerSalvos:null);if(VIEW==="me"&&PF_ABA==="salvos")renderMe();
  try{await gravarMapa(`data/users/${S.uid}/salvos`,"itens",pid,val)}catch(e){if(on)delete S.salvos[pid];else S.salvos[pid]=ant;updateSocial(pid);if(VIEW==="me"&&PF_ABA==="salvos")renderMe();toast("Não deu para salvar agora.")}}
function vp99VerSalvos(){if($("#layer").innerHTML)closeLayer();setTimeout(()=>{PF_ABA="salvos";go("me");renderMe();scrollTo(0,0)},60)}
/* aba Salvos no seu perfil (só você vê) */
{const ic='<svg class="ico" viewBox="0 0 24 24"><path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.7-6.5 4.7v-16a1 1 0 0 1 1-1z"/></svg>';const i=PF_ABAS.findIndex(a=>a[0]==="conta");PF_ABAS.splice(i<0?PF_ABAS.length:i,0,["salvos","Salvos",ic])}
{const _pa99=pfAbas;pfAbas=function(u){const h=_pa99.apply(this,arguments);return u===S.uid?h:h.replace(/<button[^>]*data-pfaba="salvos"[^>]*>[\s\S]*?<\/button>/,"")}}
function vp99ListaSalvos(){const sv=vp99Sv();return Object.entries(sv).filter(([k,v])=>v&&vp99EhPost(k)).map(([k,v])=>({x:pubDe(k.slice(2)),at:+v.at||0}))
  .filter(o=>o.x&&o.x.tipo==="post"&&(o.x.autor===S.uid||S.amigos.has(o.x.autor))).sort((a,b)=>b.at-a.at).map(o=>o.x)}
{const _pl99=pfLista;pfLista=function(u,aba){return aba==="salvos"?vp99ListaSalvos():_pl99.apply(this,arguments)}}
{const _pt99=pfTiles;pfTiles=function(l,aba,u){if(aba!=="salvos")return _pt99.apply(this,arguments);const sv=vp99Sv(),nn=Object.keys(sv).filter(k=>sv[k]&&!vp99EhPost(k)).length;
  const topo=`<button type="button" class="vp99-gd" data-vgo="saved"><span class="vp99-gdi">${ICON.save}</span><span class="vp99-gdt"><b>Notícias guardadas</b><small>${nn?nn+(nn===1?" notícia":" notícias"):"Nenhuma ainda"}</small></span><i aria-hidden="true">›</i></button>`;
  if(!l.length)return topo+`<div class="pf-vz"><b>Salvos</b><span>Toque no marcador de um post para guardar aqui. Só você vê o que salvou.</span></div>`;
  return topo+_pt99.call(this,l,"posts",u)+`<p class="hint vp99-so">Só você vê o que salvou.</p>`}}
async function vp99CarregaSalvos(){const sv=vp99Sv();const falta=Object.keys(sv).filter(k=>sv[k]&&vp99EhPost(k)&&!pubDe(k.slice(2))).map(k=>k.slice(2)).filter(id=>/^[0-9a-f-]{36}$/i.test(id));
  if(!falta.length||typeof SB==="undefined"||!SB||Date.now()-(vp99CarregaSalvos.t||0)<60000)return false;vp99CarregaSalvos.t=Date.now();
  try{const r=await SB.from("publicacoes").select("*").in("id",falta.slice(0,100));if(r.error)return false;let n=0;(r.data||[]).forEach(x=>{x.fotos=Array.isArray(x.fotos)?x.fotos:[];try{pubLimpa(x)}catch(e){}if(!pubDe(x.id)){PUB.itens.push(x);n++}});if(n)await pubAssinar();return n>0}catch(e){return false}}
/* Guardadas (notícias) e o Perfil não contam os posts salvos: eles ficam na aba Salvos */
function vp99SemPosts(fn,ctx,args){const real=S.salvos;if(!real)return fn.apply(ctx,args);const f={};Object.entries(real).forEach(([k,v])=>{if(!vp99EhPost(k))f[k]=v});window.__vp99sv=real;S.salvos=f;
  try{return fn.apply(ctx,args)}finally{if(S.salvos===f)S.salvos=real;window.__vp99sv=null}}
let vp99RM=0;
{const _rm99=renderMe;renderMe=function(){const r=vp99SemPosts(_rm99,this,arguments);if(PF_ABA==="salvos"&&!vp99RM&&S.uid&&S.membro)vp99CarregaSalvos().then(n=>{if(n&&VIEW==="me"&&PF_ABA==="salvos"){vp99RM=1;try{renderMe()}finally{vp99RM=0}}});return r}}
{const _rs99=renderSaved;renderSaved=function(){return vp99SemPosts(_rs99,this,arguments)}}

/* ===== comentários: folha alta, sem botão "Fechar" à vista, emojis rápidos ===== */
{const _oc99=openComments;openComments=function(pid){const r=_oc99.apply(this,arguments);try{vp99Cmts()}catch(e){}return r}}
function vp99Cmts(){const sh=$("#cform")&&$("#cform").closest(".sheet");if(!sh||sh.classList.contains("vp99-cm"))return;sh.classList.add("vp99-cm");
  const fx=sh.querySelector(".sh-h [data-close]");if(fx){fx.classList.add("vp99-fx");fx.setAttribute("aria-label","Fechar comentários")}
  const f=sh.querySelector(".sh-f");if(f)f.insertAdjacentHTML("afterbegin",`<div class="vp99-emo" role="group" aria-label="Emojis rápidos">${VP99_EMOJIS.map(e=>`<button type="button" data-vp99emo="${e}" aria-label="Pôr ${e} no comentário">${e}</button>`).join("")}</div>`);
  /* puxar a alça para cima abre a folha inteira */
  const g=sh.querySelector(".grab");if(g){let y0=null;g.addEventListener("touchstart",e=>{y0=e.touches[0].clientY},{passive:true});g.addEventListener("touchend",e=>{if(y0==null)return;const dy=(e.changedTouches[0]||{}).clientY-y0;y0=null;if(dy<-30)sh.classList.add("vp99-cheia")},{passive:true})}}
document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest("[data-vp99emo]"))e.preventDefault()},true);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-vp99emo]");if(!b)return;e.stopPropagation();e.preventDefault();const i=$("#ctext");if(!i)return;
  const em=b.dataset.vp99emo,a=i.selectionStart==null?i.value.length:i.selectionStart,z=i.selectionEnd==null?a:i.selectionEnd;if((i.value.length-(z-a)+em.length)>(+i.maxLength>0?+i.maxLength:600))return;
  i.value=i.value.slice(0,a)+em+i.value.slice(z);const p=a+em.length;try{i.setSelectionRange(p,p)}catch(_){}i.focus();i.dispatchEvent(new Event("input",{bubbles:true}));vibrar(6)},true);

/* ===== aviso "foi avisado(a) por mensagem": pílula pequena no topo, some logo ===== */
function vp99Pilula(t){document.querySelectorAll(".vp99-pill").forEach(x=>x.remove());const el=document.createElement("div");el.className="vp99-pill";el.setAttribute("role","status");el.textContent=t;document.body.appendChild(el);
  setTimeout(()=>el.classList.add("sai"),1500);setTimeout(()=>el.remove(),1900)}
{const _t99=toast;toast=function(m){if(typeof m==="string"){const k=/^(.+?) (foi avisado\(a\)|foram avisados|recebeu a notícia|receberam a notícia) por mensagem$/.exec(m);if(k){vp99Pilula(`✓ ${k[1]} ${k[2]}`);return}}return _t99.apply(this,arguments)}}

/* ===== enviar: amigos em cima; embaixo Story, Copiar link e Outros apps ===== */
function vp99Link(id){const o=/^https?:\/\/(localhost|127\.)/.test(location.origin)?location.origin:"https://prumonews.com.br";return `${o}/#p=${id}`}
function vp99TextoFora(x){const t=String(x.texto||"").replace(/\s+/g," ").trim();return `Post de ${nomeDe(x.autor)} no Prumo News${t?`: “${t.length>90?t.slice(0,88)+"…":t}”`:""}`}
{const _pe99=pubEnviar;pubEnviar=function(x){const r=_pe99.apply(this,arguments);try{vp99Partilha(x)}catch(e){}return r}}
function vp99Partilha(x){const pk=$("#pick");const sh=pk&&pk.closest(".sheet");if(!sh||!x||sh.querySelector(".vp99-shr")||x.publico==="proximos")return;sh.classList.add("vp99-env");
  const f=sh.querySelector(".sh-f");if(!f)return;
  f.insertAdjacentHTML("afterbegin",`<div class="vp99-shr">${x.tipo==="post"?`<button type="button" data-upstory="${esc(x.id)}"><span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke-dasharray="3 2.4"/><path d="M12 8.5v7M8.5 12h7"/></svg></span>Adicionar ao story</button>`:""}<button type="button" data-vp99link="${esc(x.id)}"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg></span>Copiar link</button><button type="button" data-vp99fora="${esc(x.id)}"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg></span>Outros apps</button></div>`);
  const sync=()=>{const b=$("#sbtn");sh.classList.toggle("vp99-sel",!!(b&&!b.disabled))};pk.addEventListener("click",()=>setTimeout(sync,0));sync()}
async function vp99Copia(t){try{await navigator.clipboard.writeText(t);return true}catch(e){return false}}
document.addEventListener("click",async e=>{const t=e.target;if(!t.closest)return;let b;
  if(b=t.closest("[data-vp99link]")){e.stopPropagation();e.preventDefault();const id=b.dataset.vp99link,l=vp99Link(id);uso("post_link");
    if(await vp99Copia(l)){closeLayer();toast("Link copiado. Só amigos de quem postou conseguem abrir.")}else{const sh=b.closest(".sheet");if(sh&&!sh.querySelector(".vp99-lk")){b.closest(".vp99-shr").insertAdjacentHTML("afterend",`<input class="field vp99-lk" readonly value="${esc(l)}" aria-label="Link do post">`)}const i=sh&&sh.querySelector(".vp99-lk");if(i){i.focus();i.select()}toast("Selecionei o link: toque em Copiar.")}return}
  if(b=t.closest("[data-vp99fora]")){e.stopPropagation();e.preventDefault();const x=pubDe(b.dataset.vp99fora);if(!x)return;const url=vp99Link(x.id),txt=vp99TextoFora(x);uso("post_fora");
    if(navigator.share){try{await navigator.share({title:"Prumo News",text:txt,url});closeLayer();return}catch(err){if(err&&err.name==="AbortError")return}}
    if(typeof abrirEnvioFora==="function"){closeLayer();setTimeout(()=>{abrirEnvioFora({titulo:"Mandar post",texto:`${txt}\n\n${url}`,url});const h=$(".sheet .env-h");if(h)h.textContent="O link abre o post no Prumo, só para quem é amigo de "+nomeDe(x.autor)+"."},60)}return}},true);
/* link de um post (#p=…): abre o post quando o Feed e os posts carregarem */
function vp99LeLink(){try{const m=location.hash.match(/^#p=([0-9a-f-]{36})$/i);if(m){history.replaceState(history.state,"",location.pathname+location.search);return m[1].toLowerCase()}}catch(e){}return null}
var VP99_LINK=vp99LeLink();
function vp99AbreLink(){if(!VP99_LINK)return;let n=0;const w=async()=>{if(!VP99_LINK)return;if(S.uid&&S.membro&&PUB.carregou&&FEED){const id=VP99_LINK;VP99_LINK=null;if(!pubDe(id))try{const r=await SB.from("publicacoes").select("*").eq("id",id);(r.data||[]).forEach(x=>{x.fotos=Array.isArray(x.fotos)?x.fotos:[];try{pubLimpa(x)}catch(e){}if(!pubDe(x.id))PUB.itens.push(x)});await pubAssinar()}catch(e){}pubIrPara(id);return}if(n++<120)setTimeout(w,500)};setTimeout(w,300)}
vp99AbreLink();addEventListener("hashchange",()=>{const id=vp99LeLink();if(id){VP99_LINK=id;vp99AbreLink()}});

/* ===== post aberto pela grade: cabeçalho logo abaixo da barra; deslizar para a direita volta ===== */
function vp99Ancora(el){const sc=el.querySelector(".pfv-sc");const a=PFV&&PFV.lista&&PFV.lista[PFV.i];const alvo=a&&sc&&sc.querySelector(`[id="p-u:${a.id}"]`);if(!alvo)return;
  let mexeu=false;const para=()=>{mexeu=true};sc.addEventListener("touchstart",para,{passive:true,once:true});sc.addEventListener("wheel",para,{passive:true,once:true});sc.addEventListener("keydown",para,{once:true});
  const t0=performance.now();const fixa=()=>{if(mexeu||!alvo.isConnected)return;const d=alvo.getBoundingClientRect().top-sc.getBoundingClientRect().top;if(Math.abs(d)>.5)sc.scrollTop+=d;if(performance.now()-t0<1600)requestAnimationFrame(fixa)};fixa()}
{const _pv99=pfvPosts;pfvPosts=function(el){const r=_pv99.apply(this,arguments);try{if(PFV&&PFV.aba==="salvos"){const b=el.querySelector(".pfv-h b");if(b&&b.firstChild&&b.firstChild.nodeType===3)b.firstChild.textContent="Salvos";const sm=b&&b.querySelector("small");if(sm)sm.textContent="Só você vê"}vp99Ancora(el)}catch(e){}return r}}
(function(){let x0=null,y0=0,dx=0,ok=false,el=null;
  const solta=()=>{if(!el)return;el.style.transition="";el.style.transform="";el.style.boxShadow=""};
  document.addEventListener("touchstart",e=>{x0=null;const p=e.target.closest&&e.target.closest("#layer .pfv");if(!p||(($("#layer2")||{}).innerHTML)||e.touches.length>1)return;const t=e.touches[0];
    if(t.clientX>=28&&e.target.closest(".track,input,textarea,.up-vid,.pf-abas"))return;x0=t.clientX;y0=t.clientY;dx=0;ok=false;el=p},{passive:true,capture:true});
  document.addEventListener("touchmove",e=>{if(x0==null)return;const t=e.touches[0],ddx=t.clientX-x0,ddy=t.clientY-y0;
    if(!ok){if(Math.abs(ddy)>12&&Math.abs(ddy)>Math.abs(ddx)){x0=null;return}if(ddx<-12){x0=null;return}if(ddx>14&&ddx>Math.abs(ddy)*1.4){ok=true;el.style.transition="none"}else return}
    dx=Math.max(0,ddx);el.style.transform=`translateX(${dx}px)`;el.style.boxShadow="-10px 0 28px rgb(0 0 0 / .16)"},{passive:true,capture:true});
  document.addEventListener("touchend",()=>{if(x0==null)return;x0=null;if(!ok||!el)return;ok=false;const w=innerWidth,anim=vp99Anim(),fecha=dx>Math.min(110,w*.28),alvo=el;
    if(fecha){alvo.style.transition=anim?"transform .2s ease-out":"none";alvo.style.transform=`translateX(${w}px)`;setTimeout(()=>{history.back();setTimeout(()=>{if(alvo.isConnected){alvo.style.transition="none";alvo.style.transform="";alvo.style.boxShadow=""}},40)},anim?190:0)}
    else{alvo.style.transition=anim?"transform .2s ease":"none";alvo.style.transform="";setTimeout(()=>{if(alvo.isConnected){alvo.style.transition="";alvo.style.boxShadow=""}},220)}},{passive:true,capture:true});
  document.addEventListener("touchcancel",()=>{if(x0!=null&&ok)solta();x0=null;ok=false},{passive:true,capture:true})})();
