/* ---------- Ver stories (rodada 2): barra de resposta, atividade do seu story, menu ⋯, bandeja ---------- */
var VS98_VIS={},VS98_ABRINDO=false;
const VS98_EMOS=["😂","😮","😍","😢","👏","🔥","🎉","💯"];
const VS98_IC={
  dest:`<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 16.6c-2.6-1.8-4.2-3.3-4.2-5.1 0-1.3 1-2.3 2.2-2.3.9 0 1.6.5 2 1.2.4-.7 1.1-1.2 2-1.2 1.2 0 2.2 1 2.2 2.3 0 1.8-1.6 3.3-4.2 5.1z"/></svg>`,
  cor:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5C5.6 16.2 2.5 12.9 2.5 9.2 2.5 6.4 4.7 4.2 7.4 4.2c1.9 0 3.6 1.1 4.6 2.7 1-1.6 2.7-2.7 4.6-2.7 2.7 0 4.9 2.2 4.9 5 0 3.7-3.1 7-9.5 11.3z"/></svg>`,
  olho:`<svg class="ico" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`
};
const vs98Espera=ms=>new Promise(ok=>setTimeout(ok,ms));
const vs98Anim=()=>{try{return typeof ANIM_OK==="function"?ANIM_OK():true}catch(e){return false}};
const vs98Atual=()=>ST&&String(ST.sec||"").indexOf("_u:")===0&&ST.itens?ST.itens[ST.i]:null;
const vs98Nome1=u=>String(nomeDe(u)).split(" ")[0];

/* Bug 1: a ordem dos amigos é congelada ANTES de marcar o primeiro story como visto */
{const _du98=igDrawUser;igDrawUser=function(){
  try{if(ST&&!ST._uord&&String(ST.sec||"").indexOf("_u:")===0&&String(ST.sec).indexOf("_u:~")!==0)storyOrdem()}catch(e){}
  const r=_du98.apply(this,arguments);
  try{vs98Rodape()}catch(e){}try{vs98Gestos()}catch(e){}try{vs98Selo();requestAnimationFrame(vs98Selo);setTimeout(vs98Selo,250)}catch(e){}
  return r}}

/* Cabeçalho: sai o botão de pausar/continuar; entra o ⋯ (segurar continua pausando) */
{const _ds98=drawStory;drawStory=function(){const r=_ds98.apply(this,arguments);try{vs98Cabecalho()}catch(e){}return r}}
function vs98Cabecalho(){const hb=$("#layer .story.sg .s-hb");if(!hb||hb.querySelector("[data-vs98menu]"))return;
  const a=hb.querySelector("[data-sauto]");const h=`<button type="button" class="vs98-mn" data-vs98menu aria-label="Mais opções">${ICON.dots}</button>`;
  if(a)a.insertAdjacentHTML("beforebegin",h);else hb.insertAdjacentHTML("afterbegin",h)}

/* selo Melhores amigos: se o nome não cabe, vira só a estrela verde */
function vs98Selo(){const m=$("#layer .story .us-ma"),b=$("#layer .story .sg-who b");if(!m||!b)return;m.setAttribute("title","Melhores amigos");if(b.scrollWidth>b.clientWidth+1){m.textContent="★";m.classList.add("vs98-so");m.setAttribute("role","img");m.setAttribute("aria-label","Melhores amigos")}}

/* Rodapé do story (amigo: resposta + ♥ + enviar + reações rápidas; seu: Atividade, Destacar, Enviar, Mais) */
function vs98Rodape(){const x=vs98Atual();const st=$("#layer .story.sg-user"),f=st&&st.querySelector(".us-f"),si=st&&st.querySelector(".story-in");if(!x||!f||!si)return;
  if(!si.querySelector(".vs98-dim"))si.insertAdjacentHTML("beforeend",`<div class="vs98-dim" aria-hidden="true"></div>`);
  if(x.autor===S.uid){const vs=VS98_VIS[x.id];
    f.classList.add("vs98-own");
    f.innerHTML=`<button type="button" class="us-vis vs98-at" data-usvistos="${esc(x.id)}" aria-label="Atividade: quem viu"><span class="vs98-lb"><b>Atividade</b><small class="vs98-n">${vs?vs98TxtVis(vs.length):"…"}</small></span><i class="vs98-avs" aria-hidden="true">${vs98Avs(vs)}</i></button><span class="sp"></span>
      ${typeof V5!=="undefined"&&V5.on?`<button type="button" class="vs98-ic" data-usdest="${esc(x.id)}">${VS98_IC.dest}<small>Destacar</small></button>`:""}
      <button type="button" class="vs98-ic" data-vs98env="${esc(x.id)}">${ICON.send}<small>Enviar</small></button>
      <button type="button" class="vs98-ic" data-vs98menu>${ICON.dots}<small>Mais</small></button>`;
    return}
  if(!f.querySelector("[data-vs98env]")&&x.publico!=="proximos"){const lk=f.querySelector("[data-uscurtir]");const h=`<button type="button" class="sg-a vs98-env" data-vs98env="${esc(x.id)}" aria-label="Enviar o story para amigos">${ICON.send}</button>`;if(lk)lk.insertAdjacentHTML("afterend",h);else f.insertAdjacentHTML("beforeend",h)}
  if(!f.querySelector(".vs98-reac"))f.insertAdjacentHTML("afterbegin",`<div class="vs98-reac" role="group" aria-label="Reações rápidas">${VS98_EMOS.map(e=>`<button type="button" data-vs98reac="${e}" aria-label="Reagir com ${e}">${e}</button>`).join("")}</div>`)}
const vs98TxtVis=n=>n?`Visto por ${n}`:"Ninguém viu ainda";
const vs98Avs=vs=>(vs||[]).slice(0,3).map(v=>avatar(v.uid)).join("");

/* contagem de quem viu: pinta a pilha de rostos */
pubContaVistos=async function(id){try{const r=await SB.from("pub_vistos").select("uid,at").eq("pub",id);if(r.error)return;
  VS98_VIS[id]=(r.data||[]).filter(v=>v.uid!==S.uid).sort((a,b)=>+b.at-+a.at);const b=$(`#layer [data-usvistos="${CSS.escape(id)}"]`);if(!b)return;
  const n=b.querySelector(".vs98-n"),av=b.querySelector(".vs98-avs");if(n)n.textContent=vs98TxtVis(VS98_VIS[id].length);else{const s=b.querySelector("span");if(s)s.textContent=vs98TxtVis(VS98_VIS[id].length)}if(av)av.innerHTML=vs98Avs(VS98_VIS[id])}catch(e){}};

/* respostas às figurinhas (enquete, quiz, slider) e perguntas, por pessoa */
function vs98Respostas(x){const it=(x&&x.estilo&&Array.isArray(x.estilo.itens))?x.estilo.itens:[];let ne=0;const out={};const add=(u,t)=>{if(t)(out[u]=out[u]||[]).push(t)};
  it.forEach((e,k)=>{if(!e||typeof e!=="object")return;let key=null,fmt=null;
    if(e.t==="enq"){const n=ne++;key=n?`us:${x.id}#e${n}`:`us:${x.id}`;fmt=v=>Array.isArray(e.o)&&e.o[v]!=null?`Votou “${String(e.o[v]).slice(0,24)}”`:""}
    else if(e.t==="quiz"){key=`us:${x.id}#${k}`;fmt=v=>Array.isArray(e.o)&&e.o[v]!=null?`Quiz: ${"ABCD"[v]||""} ${String(e.o[v]).slice(0,20)} ${v===e.c?"✓":"✗"}`:""}
    else if(e.t==="slid"){key=`us:${x.id}#${k}`;fmt=v=>typeof v==="number"?`${e.emo||"😍"} ${Math.round(v)}%`:""}
    if(!key)return;let vs={};try{vs=votosDe(key)||{}}catch(_){}Object.entries(vs).forEach(([u,v])=>{if(u!==S.uid)add(u,fmt(v))})});
  return out}
function vs98Msgs(id){const curt=new Set(),resp={};(S.msgsIn||[]).forEach(m=>{const sid=(m.snap&&m.snap.story&&m.snap.story.id)||(String(m.pid||"")==="u:"+id?id:null);if(sid!==id)return;
    if(m.tipo==="curtiu_story")curt.add(m.de);else if(m.tipo==="resp_story"&&(!resp[m.de]||+m.at>+resp[m.de].at))resp[m.de]=m});return {curt,resp}}

/* Atividade (lista de quem viu) */
async function vs98Atividade(id){igPausa();const x=pubDe(id)||(ST&&ST.itens||[]).find(y=>y.id===id);let vs=VS98_VIS[id]||[];
  try{const r=await SB.from("pub_vistos").select("uid,at").eq("pub",id);if(!r.error){vs=(r.data||[]).filter(v=>v.uid!==S.uid).sort((a,b)=>+b.at-+a.at);VS98_VIS[id]=vs}}catch(e){}
  if(!$("#layer .story"))return;
  const {curt,resp}=vs98Msgs(id),rs=x?vs98Respostas(x):{};const quem=vs.map(v=>v.uid);[...curt,...Object.keys(resp),...Object.keys(rs)].forEach(u=>{if(u!==S.uid&&!quem.includes(u)){quem.push(u);vs.push({uid:u,at:resp[u]?+resp[u].at:0})}});
  const ordem=vs.slice().sort((a,b)=>(curt.has(b.uid)-curt.has(a.uid))||(+b.at-+a.at));
  const linha=v=>{const u=v.uid,m=resp[u],ch=(rs[u]||[]).slice(0,2);const emo=m&&/^\p{Extended_Pictographic}/u.test(m.texto||"")&&String(m.texto).length<=4?m.texto:"";
    const sub=[v.at?dmCurto(+v.at):""].concat(ch.map(t=>`<em class="vs98-ch">${esc(t)}</em>`)).concat(m&&!emo&&!(m.snap&&m.snap.q!=null)?[`<em class="vs98-ch vs98-rp">💬 ${esc(String(m.texto||"").slice(0,40))}</em>`]:m&&m.snap&&m.snap.q!=null?[`<em class="vs98-ch vs98-rp">Respondeu à pergunta</em>`]:[]).filter(Boolean);
    return `<li class="vs98-v"><span class="vs98-va">${avatar(u)}${emo?`<i class="vs98-em">${esc(emo)}</i>`:""}</span><span class="vs98-vn"><b>${esc(nomeDe(u))}</b><span>${sub.map((s,i)=>i===0&&!/^<em/.test(s)?esc(s):s).join(" ")}</span></span>${curt.has(u)?`<i class="vs98-cor" role="img" aria-label="Curtiu">${VS98_IC.cor}</i>`:""}${S.amigos.has(u)?`<button type="button" class="vs98-dm" data-conversa="${esc(u)}" aria-label="Responder a ${esc(nomeDe(u))}">${ICON.send}</button>`:""}</li>`};
  const resumo=`<div class="vs98-res"><span>${VS98_IC.olho}<b>${vs.length}</b> ${vs.length===1?"visualização":"visualizações"}</span>${curt.size?`<span class="vs98-rc">${VS98_IC.cor}<b>${curt.size}</b> ${curt.size===1?"curtida":"curtidas"}</span>`:""}</div>`;
  sheet("Atividade",vs.length?`${resumo}<ul class="vs98-vl">${ordem.map(linha).join("")}</ul>`:`<div class="empty vs98-vz"><b>Ninguém viu ainda</b><span>Quando seus amigos virem este story, eles aparecem aqui.</span></div>`)}

/* Enviar o story para amigos (mesmo fluxo de enviar post) */
function vs98Enviar(x){if(precisaConta()||!x)return;if(x.publico==="proximos"&&x.autor!==S.uid){toast("Este story é só para os Melhores amigos: não dá para enviar.");return}
  let am=amigosL();if(x.publico==="proximos"&&typeof MA!=="undefined"&&MA.set)am=am.filter(u=>MA.set.has(u));if(x.autor!==S.uid)am=am.filter(u=>u!==x.autor);
  if(!am.length){toast("Adicione amigos no Perfil para mandar.");return}igPausa();const snap={titulo:"Story de "+nomeDe(x.autor),upub:x.id};
  sheet("Enviar story",`<div class="pick dm-pick" id="pick">${am.map(u=>`<button type="button" data-pick="${esc(u)}" aria-pressed="false">${avatar(u)}<span>${esc(nomeDe(u))}</span><i class="dm-ck" aria-hidden="true"></i></button>`).join("")}</div><p class="hint">${x.autor===S.uid?"O story some em 24 horas.":`Só quem também é amigo de ${esc(vs98Nome1(x.autor))} consegue abrir. Some em 24 horas.`}</p>`,`<form id="sform"><input class="field" id="stext" maxlength="600" autocomplete="off" placeholder="Escreva uma mensagem (opcional)"><button class="send" id="sbtn" type="submit" disabled>Enviar</button></form>`);
  const sel=new Set();$("#pick").addEventListener("click",e=>{const b=e.target.closest("[data-pick]");if(!b)return;const u=b.dataset.pick;sel.has(u)?sel.delete(u):sel.add(u);b.setAttribute("aria-pressed",String(sel.has(u)));$("#sbtn").disabled=!sel.size});
  $("#sform").addEventListener("submit",async e=>{e.preventDefault();if(!sel.size)return;const t=$("#stext").value.trim();$("#sbtn").disabled=true;const us=[...sel];
    const r=await Promise.all(us.map(u=>dmEnviar(u,{texto:t,pid:"u:"+x.id,snap},true)));closeLayer();toast(r.every(Boolean)?(us.length>1?"Enviado":"Enviado para "+vs98Nome1(us[0])):"Algumas não foram enviadas")})}

/* Menu ⋯ */
function vs98Menu(){const x=vs98Atual();const auto=`<button type="button" data-vs98auto aria-pressed="${!!PREF.storyAuto}">Passar sozinho<span>${PREF.storyAuto?"ligado":"desligado"}</span></button>`;
  if(x&&x.autor===S.uid){sheet("Seu story",`<div class="opt"><button type="button" data-criarde="story">Criar outro story</button>${auto}<button type="button" class="perigo" data-vs98apagar="${esc(x.id)}">Apagar este story<span>some para todos</span></button></div>`);return}
  if(x){const u=x.autor;sheet("Story de "+nomeDe(u),`<div class="opt">${S.amigos.has(u)?`<button type="button" data-conversa="${esc(u)}">Mandar mensagem para ${esc(vs98Nome1(u))}</button>`:""}${auto}<button type="button" data-denp="${esc(u)}">Denunciar<span>o Pedro recebe e analisa</span></button></div>`);return}
  sheet("Stories",`<div class="opt">${auto}</div>`)}

/* Reações rápidas (enviadas como resposta ao story) */
async function vs98Reagir(emo){const x=vs98Atual();if(!x||x.autor===S.uid||precisaConta())return;const i=$("#layer .us-rp input");if(i)i.blur();vs98Voa(emo);vibrar(8);
  const ok=await dmEnviar(x.autor,{texto:emo,tipo:"resp_story",snap:{story:{id:x.id,t:String(x.texto||"").slice(0,80),foto:!!(x.fotos&&x.fotos.length)}}},true);
  toast(ok?"Reação enviada para "+vs98Nome1(x.autor):"Não deu para enviar. Tente de novo.")}
function vs98Voa(emo){const si=$("#layer .story-in");if(!si||!vs98Anim())return;const box=document.createElement("div");box.className="vs98-voa";box.setAttribute("aria-hidden","true");
  box.innerHTML=Array.from({length:7},(_,k)=>`<i style="--x:${(8+Math.random()*84).toFixed(0)}%;--d:${(k*70+Math.random()*80).toFixed(0)}ms;--s:${(.8+Math.random()*.7).toFixed(2)}">${esc(emo)}</i>`).join("");si.appendChild(box);setTimeout(()=>box.remove(),1700)}

/* Gestos: deslizar para cima responde (amigo) ou abre a Atividade (seu story) */
function vs98Gestos(){const el=$("#layer .story.sg-user");if(!el||el._vs98)return;el._vs98=1;let x0=0,y0=0,on=false;
  el.addEventListener("touchstart",e=>{on=false;if(IG_DIG||VIRANDO||e.touches.length>1||e.target.closest(".s-f,.s-h,.us-it,.vs98-dim"))return;x0=e.touches[0].clientX;y0=e.touches[0].clientY;on=true},{passive:true});
  el.addEventListener("touchend",e=>{if(!on)return;on=false;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;if(!(dy<-70&&-dy>Math.abs(dx)*1.5))return;const x=vs98Atual();if(!x)return;
    if(x.autor===S.uid){const b=$("#layer [data-usvistos]");if(b)vs98Atividade(b.dataset.usvistos);return}
    const i=$("#layer .us-rp input");if(i)i.focus()},{passive:true})}

/* cliques */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;
  if(b=t.closest("#layer .story [data-vs98menu]")){e.stopPropagation();e.preventDefault();igPausa();vs98Menu();return}
  if(b=t.closest("#layer .story [data-usvistos]")){e.stopPropagation();e.preventDefault();vs98Atividade(b.dataset.usvistos);return}
  if(b=t.closest("#layer .story [data-vs98env]")){e.stopPropagation();e.preventDefault();const x=pubDe(b.dataset.vs98env)||vs98Atual();vs98Enviar(x);return}
  if(b=t.closest("#layer .story [data-vs98reac]")){e.stopPropagation();e.preventDefault();vs98Reagir(b.dataset.vs98reac);return}
  if(b=t.closest("#layer .story .vs98-dim")){e.stopPropagation();e.preventDefault();document.activeElement?.blur?.();return}
  if(b=t.closest("#layer2 [data-vs98auto]")){e.stopPropagation();e.preventDefault();PREF.storyAuto=!PREF.storyAuto;salvarPrefs();closeLayer();if($("#layer .story")&&ST){clearTimeout(ST.timer);ST.timer=0;drawStory()}
    toast(PREF.storyAuto?"O story passa sozinho. Segure o dedo para pausar.":"O story não passa mais sozinho.");return}
  if(b=t.closest("#layer2 [data-vs98apagar]")){e.stopPropagation();e.preventDefault();if(!b.classList.contains("conf")){b.classList.add("conf");b.firstChild.textContent="Toque de novo para apagar";return}
    const id=b.dataset.vs98apagar;closeLayer();igPausa();pubApagar(id,true).then(ok=>{if(!ok){toast("Não deu para apagar agora.");return}toast("Story apagado");if(!$("#layer .story"))return;const fr=pubStoriesDe(S.uid);
      if(String(ST.sec||"").indexOf("_u:~")===0||!fr.length){igFechar();return}ST.itens=fr;ST.ids=fr.map(x=>"us:"+x.id);ST.i=Math.min(ST.i,fr.length-1);drawStory()});return}},true);
/* tocar num emoji não tira o foco do campo antes do clique */
document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest("#layer .vs98-reac button"))e.preventDefault()},true);

/* teclado do celular: o rodapé do story de amigo sobe junto */
(function(){const vv=window.visualViewport;if(!vv)return;const aj=()=>{const f=$("#layer .story .us-f");if(!f)return;if(!IG_DIG){f.style.transform="";return}const k=Math.max(0,innerHeight-vv.height-vv.offsetTop);f.style.transform=k>40?`translateY(${-k}px)`:""};
  vv.addEventListener("resize",aj);vv.addEventListener("scroll",aj);document.addEventListener("focusout",()=>setTimeout(aj,200))})();

/* Bandeja: anel girando enquanto o story carrega; abre com a transição só depois de pronto (a barra de abas não fica por cima) */
async function vs98Prepara(u){const t0=Date.now();try{await Promise.race([pubAssinar(),vs98Espera(2500)]);const fr=pubStoriesDe(u);const x=fr.find(y=>!PUB_VISTOS.has(y.id))||fr[0];
    const f=x&&!(x.estilo&&x.estilo.video)&&x.fotos&&x.fotos[0]&&pubUrl(x.fotos[0]);if(f){const im=new Image();im.decoding="async";im.src=f;await Promise.race([im.decode?im.decode().catch(()=>{}):vs98Espera(0),vs98Espera(1500)])}}catch(e){}
  const resto=vs98Anim()?260-(Date.now()-t0):0;if(resto>0)await vs98Espera(resto)}
/* durante a transição a barra de abas (que tem nome próprio na transição) fica na foto de fundo, por baixo do story */
function vs98SemBarra(ms){const n=document.querySelector(".nav");if(n)n.style.viewTransitionName="none";const volta=()=>{if(n)n.style.viewTransitionName=""};if(ms)setTimeout(volta,ms);return volta}
(function(){const ant=window.comTransicao;
  window.comTransicao=function(origem,abre,alvo){const b=origem&&origem.closest&&origem.closest("#secs [data-ustory],#secs [data-meustory]");
    if(alvo!==".story-in"||!b){if(alvo===".story-in")vs98SemBarra(900);return ant?ant.apply(this,arguments):abre()}
    if(VS98_ABRINDO)return;VS98_ABRINDO=true;const u=b.matches("[data-meustory]")?S.uid:b.dataset.ustory,ring=b.querySelector(".ig-r")||origem;ring.classList.add("vs98-carrega");
    vs98Prepara(u).then(()=>{ring.classList.remove("vs98-carrega");VS98_ABRINDO=false;if($("#layer").innerHTML&&!$("#layer .story"))return;
      if(!(vs98Anim()&&document.startViewTransition&&ring.isConnected&&!$("#layer .story"))){abre();return}
      try{const volta=vs98SemBarra(0);ring.style.viewTransitionName="abre";const vt=document.startViewTransition(async()=>{ring.style.viewTransitionName="";await abre();const a=$("#layer .story-in");if(a)a.style.viewTransitionName="abre"});
        vt.finished.catch(()=>{}).then(()=>{volta();const a=$("#layer .story-in");if(a)a.style.viewTransitionName=""})}
      catch(e){ring.style.viewTransitionName="";abre()}})}})();
