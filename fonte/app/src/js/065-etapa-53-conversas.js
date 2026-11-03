/* ---------- Etapa 53: Conversas ---------- */
const DM_EMO=["❤️","😂","😮","😢","👍","🔥"];
var RESPM=null,DM_Q="";
const DM_IC={nova:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',busca:'<svg class="ico" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>',env:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/></svg>',voltar:'<svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>'};
function dmPar(u){return m=>(m.de===u&&m.para===S.uid)||(m.de===S.uid&&m.para===u)}
function dmCurto(at){const m=(Date.now()-at)/6e4;if(m<1)return "agora";if(m<60)return Math.floor(m)+" min";if(m<1440)return Math.floor(m/60)+" h";if(m<10080)return Math.floor(m/1440)+" d";return Math.floor(m/10080)+" sem"}
function dmQuando(at){const d=dataSP(at),h=hhmm(at),hoje=hojeSP();if(d===hoje)return "Hoje, "+h;if(d===somaDias(hoje,-1))return "Ontem, "+h;const w=new Date(at).toLocaleDateString("pt-BR",{weekday:"short",timeZone:"America/Sao_Paulo"}).replace(".","");return `${w} (${+d.slice(8,10)}), ${h}`}
function dmPrevia(m){const eu=m.de===S.uid;
  if(m.tipo==="reacao_msg")return (eu?"Você reagiu ":"Reagiu ")+(m.texto||"❤️")+(eu?" a uma mensagem":" à sua mensagem");
  if(m.tipo==="reacao")return (eu?"Você reagiu ":"Reagiu ")+(m.texto||"")+" a uma notícia";
  if(m.tipo==="mencao")return eu?"Você mencionou num comentário":"Mencionou você num comentário";
  if(m.tipo==="curtiu_story")return eu?"Você curtiu o story":"Curtiu seu story ❤️";
  if(m.tipo==="resp_story")return (eu?"Você respondeu ao story: ":"Respondeu ao seu story: ")+(m.texto||"");
  if(m.pid&&!m.texto)return eu?"Você enviou uma notícia":"Enviou uma notícia";
  return (eu?"Você: ":"")+(m.texto||"")}
function dmFotoDe(m){const p=m.pid&&pautaById(m.pid);const f=p&&fotoDe(p);return f&&f.url?f:null}
function dmCard(m){const s=m.snap||{},p=m.pid&&pautaById(m.pid),tit=(p&&versao(p,lente()).titulo)||s.titulo||"Notícia",sec=(p&&secOf(p))||s.secao||"politica",f=dmFotoDe(m);
  return `<button type="button" class="dm-card" data-open="${esc(m.pid)}"><span class="dm-cf paper" data-sec="${esc(sec)}">${f?`<img src="${escU(fotoSrc(f.url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`:svgOf(s.imagem||(p&&p.imagem))}</span><span class="dm-ct"><small style="color:${secCor(sec)}">${esc(secNome(sec))}</small><b>${esc(tit)}</b></span></button>`}
function dmMarca(t){let h=esc(t);amigosL().concat(S.uid?[S.uid]:[]).map(u=>nomeDe(u)).filter(Boolean).sort((a,b)=>b.length-a.length).forEach(n=>{const e=esc("@"+n);if(h.includes(e))h=h.split(e).join(`<b class="dm-at">${e}</b>`)});return h}
function dmThreadHTML(u){const all=allMsgs().filter(dmPar(u)),reac={},ms=[];
  all.forEach(m=>{if(m.tipo==="reacao_msg"&&m.snap&&m.snap.ref)(reac[m.snap.ref]=reac[m.snap.ref]||[]).push(m);else ms.push(m)});
  if(!ms.length)return `<div class="dm-vazio">${avatar(u)}<b>${esc(nomeDe(u))}</b><span>Mande uma mensagem ou uma notícia pelo botão Enviar de qualquer post.</span></div>`;
  let h="",ant=null;const ultMinha=ms.length&&ms[ms.length-1].de===S.uid?ms[ms.length-1]:null;
  const quebra=(a,b)=>!a||b.at-a.at>3600e3||dataSP(a.at)!==dataSP(b.at);
  ms.forEach((m,i)=>{const nx=ms[i+1],eu=m.de===S.uid;if(quebra(ant,m))h+=`<div class="dm-tm">${esc(dmQuando(m.at))}</div>`;
    const pri=quebra(ant,m)||ant.de!==m.de||m.at-ant.at>300e3,ult=!nx||quebra(m,nx)||nx.de!==m.de||nx.at-m.at>300e3;
    let corpo="";
    if(m.tipo==="curtiu_story"){h+=`<div class="dm-ev">${eu?"Você curtiu o story de "+esc(nomeDe(m.para)):"❤️ "+esc(nomeDe(m.de))+" curtiu seu story"}${m.snap&&m.snap.story&&m.snap.story.t?` · “${esc(m.snap.story.t)}”`:""}</div>`;ant=m;return}
    if(m.tipo==="resp_story"){const st=(m.snap&&m.snap.story)||{};corpo+=`<div class="dm-q"><small>${eu?"Você respondeu ao story de "+esc(nomeDe(m.para)):"Respondeu ao seu story"}</small><span>${esc(st.t||(st.foto?"📷 Foto":"Story"))}</span></div>`}
    if(m.tipo==="reacao"){h+=`<div class="dm-ev">${eu?"Você reagiu":esc(nomeDe(m.de))+" reagiu"} ${esc(m.texto||"")} a uma notícia</div>`;ant=m;return}
    if(m.tipo==="mencao")corpo+=`<span class="dm-lb">${eu?"Você mencionou "+esc(nomeDe(m.para)):"Mencionou você"} ${m.snap&&m.snap.story===true?"no story":"num comentário"}</span>`;
    if(m.tipo==="resposta"&&m.snap&&m.snap.q){const q=m.snap.q;corpo+=`<div class="dm-q"><small>${eu?(q.de===S.uid?"Você respondeu a si mesmo":"Você respondeu a "+esc(nomeDe(q.de))):(q.de===S.uid?"Respondeu a você":"Respondeu a si mesmo")}</small><span>${esc(q.t||"")}</span></div>`}
    else if(m.pid&&m.resp&&m.tipo!=="mencao")corpo+=`<button type="button" class="dm-q" data-open="${esc(m.pid)}"><small>Sobre a notícia</small><span>${esc(m.snap?.titulo||"notícia")}</span></button>`;
    else if(m.pid)corpo+=dmCard(m);
    if(m.texto&&!(m.tipo==="mencao"&&m.snap&&m.snap.upub&&(m.snap.story===true&&m.texto==="Mencionou você no story"||typeof pubDe==="function"&&(pubDe(m.snap.upub)||{}).texto===m.texto)))corpo+=`<div class="bub${dmSoEmoji(m.texto)?" bub-emo":""}">${dmLinka(m.tipo==="mencao"?dmMarca(m.texto):esc(m.texto))}</div>`;
    const rs=reac[m.id]||[];const pill=rs.length?`<button type="button" class="dm-rx" data-dmacoes="${esc(m.id)}" aria-label="Reações">${[...new Set(rs.map(r=>String(r.texto||"").slice(0,8)))].map(esc).join("")}${rs.length>1?`<i>${rs.length}</i>`:""}</button>`:"";
    h+=`<div class="msg dm-m ${eu?"mine":"theirs"}${pri?" pri":""}${ult?" ult":""}${rs.length?" crx":""}" data-mid="${esc(m.id)}">${!eu?`<span class="dm-av">${ult?avatar(m.de):""}</span>`:""}<div class="dm-c">${corpo}${pill}</div></div>`;
    if(m===ultMinha)h+=`<div class="dm-st">${m.lida?"Visto":String(m.id).startsWith("tmp")?"Enviando…":"Enviada"}</div>`;
    ant=m});
  return h}
function dmInboxHTML(){const msgs0=allMsgs(),ids=new Set(msgs0.map(m=>m.id)),msgs=msgs0.filter(m=>!(m.tipo==="reacao_msg"&&m.snap&&m.snap.ref&&!ids.has(m.snap.ref))),am=amigosL(),ult={};msgs.forEach(m=>{const o=m.de===S.uid?m.para:m.de;if(!o||o===S.uid)return;ult[o]=m});
  const convs=Object.keys(ult).sort((a,b)=>ult[b].at-ult[a].at),n=norm(DM_Q).trim();const ok=u=>!n||norm(nomeDe(u)).includes(n);
  const amigosRow=am.slice().sort((a,b)=>((ult[b]||{}).at||0)-((ult[a]||{}).at||0)).filter(ok);
  const rows=convs.filter(ok).map(u=>{const m=ult[u],un=msgs.filter(x=>x.de===u&&x.para===S.uid&&!x.lida).length;
    return `<li><button type="button" class="dm-row${un?" un":""}" data-thread="${esc(u)}">${avatar(u)}<span class="pt"><b>${esc(nomeDe(u))}</b><span><span class="dm-pv">${esc(dmPrevia(m))}</span><span class="dm-t"> · ${esc(dmCurto(m.at))}</span></span></span>${un?`<span class="dot" aria-label="${un} não ${un===1?"lida":"lidas"}"></span>`:""}</button></li>`}).join("");
  return `<div class="gut dm-in"><div class="view-h dm-h"><h1>Conversas</h1>${am.length?`<button type="button" class="icbtn" data-novaconv aria-label="Nova conversa">${DM_IC.nova}</button>`:""}</div>
    ${am.length||convs.length?`<label class="dm-busca">${DM_IC.busca}<input id="dmq" type="search" autocomplete="off" placeholder="Pesquisar" aria-label="Pesquisar conversas" value="${esc(DM_Q)}"></label>`:""}
    ${amigosRow.length?`<div class="dm-amg" aria-label="Amigos">${amigosRow.map(u=>`<button type="button" data-thread="${esc(u)}">${avatar(u)}<span>${esc(String(nomeDe(u)).split(" ")[0])}</span></button>`).join("")}</div>`:""}
    ${convs.length?`<h3 class="dm-sh">Mensagens</h3><ul class="people dm-lista">${rows||`<li class="dm-nada">Ninguém com esse nome</li>`}</ul>`
      :DM_Q.trim()?`<div class="empty"><b>Ninguém com esse nome</b></div>`:am.length?`<div class="empty"><b>Nenhuma conversa ainda</b>Toque num amigo acima, ou mande uma notícia pelo botão Enviar de um post.</div>`
      :`<div class="empty"><b>Nenhum amigo ainda</b>Adicione amigos no Perfil para conversar.<button type="button" class="btn ghost" data-vgo="me" style="margin-top:10px">Ir ao Perfil</button></div>`}</div>`}
/* troca só os balões que mudaram (antes a conversa inteira era redesenhada a cada mensagem nova) */
function dmPorCorpo(el,html){const t=document.createElement("template");t.innerHTML=html;const nv=[...t.content.childNodes],at=[...el.childNodes];if(!at.length||!nv.length){el.innerHTML=html;return}
  const k=n=>n.nodeType===1?n.outerHTML:"#"+n.textContent,A=at.map(k),B=nv.map(k);let p=0,s=0;while(p<A.length&&p<B.length&&A[p]===B[p])p++;while(s<A.length-p&&s<B.length-p&&A[A.length-1-s]===B[B.length-1-s])s++;
  const ref=at[A.length-s]||null;for(let i=p;i<A.length-s;i++)at[i].remove();const fr=document.createDocumentFragment();for(let i=p;i<B.length-s;i++)fr.appendChild(nv[i]);el.insertBefore(fr,ref)}
renderMsgs=function(){const v=$("#v-msgs");document.body.classList.toggle("dm-conv",!!THREAD&&VIEW==="msgs");
  if(!S.db||!S.uid||!S.membro){v.dataset.thr="";v.innerHTML=`<div class="gut"><div class="view-h"><h1>Conversas</h1></div><div class="empty"><b>Conversas precisam da sua conta</b>${S.uid?"Falta só o convite para você entrar no Prumo.":"Entre para trocar notícias com os seus amigos."}<button type="button" class="btn" data-entrar style="margin-top:10px">${S.uid?"Usar um convite":"Entrar"}</button></div></div>`;return}
  if(!THREAD){const foco=document.activeElement&&document.activeElement.id==="dmq",pos=foco?document.activeElement.selectionStart:0;v.dataset.thr="";v.innerHTML=dmInboxHTML();if(foco){const i=$("#dmq");i.focus();try{i.setSelectionRange(pos,pos)}catch(e){}}return}
  const u=THREAD,amigo=S.amigos.has(u),th=allMsgs().filter(dmPar(u)),corpo=dmThreadHTML(u);
  const ja=v.dataset.thr===u&&v.dataset.am===String(amigo)&&v.querySelector(".thread");
  if(ja){const perto=document.documentElement.scrollHeight-scrollY-innerHeight<200,n0=v.querySelectorAll(".thread .dm-m").length;dmPorCorpo(v.querySelector(".thread"),corpo);marcarLidasThread(th);updateBadge();const n1=v.querySelectorAll(".thread .dm-m").length;if(perto||(n1>n0&&th[th.length-1]?.de===S.uid))window.scrollTo(0,document.body.scrollHeight);return}
  v.dataset.thr=u;v.dataset.am=String(amigo);RESPM=null;
  v.innerHTML=`<div class="dm-th-h"><button type="button" class="dm-bk" data-back aria-label="Voltar para Conversas">${DM_IC.voltar}</button><button type="button" class="dm-who" ${amigo?"data-thmenu":""}>${avatar(u)}<span><b>${esc(nomeDe(u))}</b><small>${amigo?"Amigo no Prumo":S.membros[u]?.excluido?"Conta excluída":"Não são amigos agora"}</small></span></button>${amigo?`<button type="button" class="icbtn" data-thmenu aria-label="Opções da conversa">${ICON.dots}</button>`:""}</div>
    <div class="gut"><div class="thread dm-thr">${corpo}</div></div>
    <div class="composer gut dm-comp">${amigo?`<form id="mform" class="dm-f" autocomplete="off"><input class="field" id="mtext" maxlength="1000" autocomplete="off" enterkeyhint="send" placeholder="Mensagem…" aria-label="Mensagem"><button class="send dm-send" type="submit" aria-label="Enviar" disabled>${DM_IC.env}</button></form>`:`<p class="hint" style="margin:0;padding:8px 0">${S.membros[u]?.excluido?"Esta conta foi excluída. A conversa fica aqui só para leitura.":(S.membros[u]&&!S.membros[u].excluido?"Vocês não são amigos no Prumo agora. Para conversar de novo, peça amizade no Perfil.":"Não dá para conversar com esta pessoa agora.")}</p>`}</div>`;
  if(amigo){const i=$("#mtext"),b=$("#mform .send");i.addEventListener("input",()=>{b.disabled=!i.value.trim()});
    $("#mform").addEventListener("submit",async e=>{e.preventDefault();const t=i.value.trim();if(!t)return;i.value="";b.disabled=true;const rq=RESPM;RESPM=null;$("#respbar")?.remove();
      const extra=rq?{tipo:"resposta",snap:{q:rq}}:{};const ok=await dmEnviar(u,{texto:t,...extra});
      if(!ok){if(!i.value){i.value=t;b.disabled=false}if(rq&&!RESPM){RESPM=rq;dmBarraResp()}}})}
  marcarLidasThread(th);updateBadge();window.scrollTo(0,document.body.scrollHeight)};
async function dmEnviar(para,campos,silencioso){const at=Date.now(),id="tmp"+at+Math.random().toString(36).slice(2,5);const m={de:S.uid,para,at,texto:"",lida:false,...campos};
  S.msgsOut.push({id,...m});if(VIEW==="msgs")renderMsgs();
  try{await S.db.collection("mensagens").add(m);return true}catch(err){S.msgsOut=S.msgsOut.filter(x=>x.id!==id);if(VIEW==="msgs")renderMsgs();if(!silencioso)toast(err?.code==="permission_denied"?"Só dá para mandar mensagem para amigos.":"A mensagem não foi enviada. Tente de novo.");return false}}
async function dmApagar(id){const m=allMsgs().find(x=>x.id===id);if(!m||m.de!==S.uid)return;const bk=S.msgsOut.slice();S.msgsOut=S.msgsOut.filter(x=>x.id!==id);if(VIEW==="msgs")renderMsgs();
  try{await S.db.doc("mensagens/"+id).delete()}catch(e){S.msgsOut=bk;if(VIEW==="msgs")renderMsgs();toast("Não deu para apagar agora.")}}
async function dmReagir(mid,e){const m=allMsgs().find(x=>x.id===mid);if(!m||!THREAD)return;if(!S.amigos.has(THREAD)){toast("Só dá para reagir com amigos.");return}vibrar(8);
  const minhas=allMsgs().filter(x=>x.tipo==="reacao_msg"&&x.de===S.uid&&x.snap&&x.snap.ref===mid);const igual=minhas.find(x=>x.texto===e);
  for(const r of minhas)if(!String(r.id).startsWith("tmp"))await dmApagar(r.id);if(igual)return;
  await dmEnviar(THREAD,{texto:e,tipo:"reacao_msg",snap:{ref:mid}})}
function dmTexto(m){return m.texto||(m.snap&&m.snap.titulo?"📰 "+m.snap.titulo:m.pid?"📰 notícia":"")}
function dmBarraResp(){$("#respbar")?.remove();const f=$("#mform");if(!f||!RESPM)return;f.insertAdjacentHTML("beforebegin",`<div id="respbar" class="respbar dm-rb"><span><small>Respondendo ${RESPM.de===S.uid?"a você mesmo":"a "+esc(nomeDe(RESPM.de))}</small>${esc(RESPM.t)}</span><button type="button" data-dmsemresp aria-label="Cancelar resposta">✕</button></div>`)}
function dmResponder(mid){const m=allMsgs().find(x=>x.id===mid);if(!m)return;RESPM={id:m.id,de:m.de,t:dmTexto(m).slice(0,120)};dmBarraResp();$("#mtext")?.focus()}
responderMsg=dmResponder;
function dmAcoes(mid){const m=allMsgs().find(x=>x.id===mid);if(!m)return;const eu=m.de===S.uid;vibrar(10);
  sheet("Mensagem",`<div class="dm-emo" role="group" aria-label="Reagir">${DM_EMO.map(e=>`<button type="button" data-dmreac="${esc(mid)}" data-e="${e}">${e}</button>`).join("")}</div><div class="opt">${S.amigos.has(THREAD)?`<button type="button" data-dmresp="${esc(mid)}">Responder</button>`:""}${dmTexto(m)?`<button type="button" data-dmcopiar="${esc(mid)}">Copiar texto</button>`:""}${m.pid?`<button type="button" data-open="${esc(m.pid)}">${String(m.pid).indexOf("u:")===0?"Abrir a publicação":"Abrir a notícia"}</button>`:""}${eu?`<button type="button" data-dmapagar="${esc(mid)}" class="perigo">Apagar para todos<span>some para você e para ${esc(nomeDe(m.para))}</span></button>`:""}</div>`)}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
  if(b=t.closest("[data-dmreac]")){e.stopPropagation();const mid=b.dataset.dmreac,em=b.dataset.e;closeLayer();dmReagir(mid,em);return}
  if(b=t.closest("[data-dmresp]")){e.stopPropagation();const mid=b.dataset.dmresp;closeLayer();setTimeout(()=>dmResponder(mid),60);return}
  if(b=t.closest("[data-dmcopiar]")){e.stopPropagation();const m=allMsgs().find(x=>x.id===b.dataset.dmcopiar);closeLayer();dmCopiar(dmTexto(m));return}
  if(b=t.closest("[data-dmapagar]")){e.stopPropagation();if(!b.classList.contains("conf")){b.classList.add("conf");b.firstChild.textContent="Toque de novo para apagar";return}const mid=b.dataset.dmapagar;closeLayer();dmApagar(mid);return}
  if(b=t.closest("[data-dmacoes]")){e.stopPropagation();dmAcoes(b.dataset.dmacoes);return}
  if(t.closest("[data-dmsemresp]")){e.stopPropagation();RESPM=null;$("#respbar")?.remove();return}},true);
document.addEventListener("input",e=>{if(e.target&&e.target.id==="dmq"){DM_Q=e.target.value;renderMsgs()}});
/* gestos nos balões: dois toques = ❤️, segurar = ações, arrastar para a direita = responder */
(function(){let alvo=null,x0=0,y0=0,lp=0,mov=false,ultT=0,ultId="";
  const m0=e=>e.target.closest&&e.target.closest("#v-msgs .dm-m");
  document.addEventListener("touchstart",e=>{const m=m0(e);alvo=null;if(!m||e.touches.length>1)return;alvo=m;mov=false;x0=e.touches[0].clientX;y0=e.touches[0].clientY;clearTimeout(lp);lp=setTimeout(()=>{if(alvo&&!mov){const id=alvo.dataset.mid;alvo.classList.remove("arr");alvo=null;DM_LP=Date.now();dmAcoes(id)}},480)},{passive:true});
  document.addEventListener("touchmove",e=>{if(!alvo)return;const dx=e.touches[0].clientX-x0,dy=e.touches[0].clientY-y0;if(Math.abs(dx)>8||Math.abs(dy)>8){mov=true;clearTimeout(lp)}
    if(dx>0&&Math.abs(dx)>Math.abs(dy)*1.3&&S.amigos.has(THREAD)){const c=alvo.querySelector(".dm-c");if(c){c.style.transition="none";c.style.transform=`translateX(${Math.min(80,dx*.6)}px)`;alvo.classList.toggle("arr",dx>60)}}},{passive:true});
  document.addEventListener("touchend",e=>{clearTimeout(lp);if(Date.now()-DM_LP<700){e.preventDefault();DM_LP=0;return}const m=alvo;alvo=null;if(!m)return;const c=m.querySelector(".dm-c"),t=e.changedTouches[0],dx=t.clientX-x0;
    if(c&&c.style.transform){c.style.transition="transform .2s cubic-bezier(.3,.7,.4,1)";c.style.transform="";if(dx>60&&S.amigos.has(THREAD)){vibrar(8);dmResponder(m.dataset.mid)}m.classList.remove("arr");return}
    if(!mov&&!e.target.closest("button,a")){const now=Date.now();if(ultId===m.dataset.mid&&now-ultT<320){ultT=0;e.preventDefault();if(S.amigos.has(THREAD)){dmReagir(m.dataset.mid,"❤️");const k=document.createElement("span");k.className="dm-pop";k.textContent="❤️";m.querySelector(".dm-c")?.appendChild(k);setTimeout(()=>k.remove(),800)}}else{ultT=now;ultId=m.dataset.mid}}},{passive:false});
  document.addEventListener("contextmenu",e=>{const m=m0(e);if(!m)return;e.preventDefault();dmAcoes(m.dataset.mid)});
  document.addEventListener("dblclick",e=>{const m=m0(e);if(!m||matchMedia("(pointer:coarse)").matches||e.target.closest("button,a"))return;if(S.amigos.has(THREAD))dmReagir(m.dataset.mid,"❤️")})})();
/* barra de abas some dentro da conversa */
{const _go53=go;go=function(v){const r=_go53.apply(this,arguments);document.body.classList.toggle("dm-conv",VIEW==="msgs"&&!!THREAD);return r}}

