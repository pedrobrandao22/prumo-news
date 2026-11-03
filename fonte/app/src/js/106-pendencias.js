/* ---------- 106: pendências do QA de 02/11 (o que dava para resolver sem mexer no banco) ---------- */

/* 1. Conversas: mensagens antigas além das 300 mais recentes de cada lado ("Carregar mensagens antigas") */
var DM106={uid:null,ant:new Map(),fim:{},pag:{},car:false};
const DM106_MAX=300,DM106_PAG=100;
function dm106Zera(){if(DM106.uid!==S.uid){DM106.uid=S.uid;DM106.ant=new Map();DM106.fim={};DM106.pag={}}}
/* a escuta guarda uma janela das mais recentes: o que escorrega para fora dela numa conversa já paginada passa para as antigas (senão abriria um buraco) */
function dm106Desliza(){[["i","msgsIn"],["o","msgsOut"]].forEach(([l,k])=>{const cur=S[k]||[],old=DM106["v"+l];DM106["v"+l]=cur;if(!old||old===cur||!DM106.ant.size)return;
  let mn=Infinity;cur.forEach(m=>{if(!String(m.id).startsWith("tmp")&&+m.at<mn)mn=+m.at});if(!isFinite(mn))return;
  old.forEach(m=>{const o=l==="o"?m.para:m.de;if(+m.at<mn&&!String(m.id).startsWith("tmp")&&DM106.pag[o])DM106.ant.set(m.id,m)})})}
{const _am106=allMsgs;allMsgs=function(){const l=_am106.apply(this,arguments);if(DM106.uid!==S.uid)return l;dm106Desliza();if(!DM106.ant.size)return l;
  const ids=new Set(l.map(m=>m.id)),bl=S.bloq||[],ex=[];DM106.ant.forEach(m=>{if(!ids.has(m.id)&&!bl.includes(m.de===S.uid?m.para:m.de))ex.push(m)});
  return ex.length?l.concat(ex).sort((a,b)=>a.at-b.at):l}}
/* lado "o" = o que eu mandei para u; lado "i" = o que u me mandou. A escuta guarda as 300 mais recentes de cada lado (de todas as conversas) */
function dm106Lado(u,l){dm106Zera();const feed=(l==="o"?S.msgsOut:S.msgsIn)||[],k=u+":"+l;
  if(DM106.fim[k]||feed.filter(m=>!String(m.id).startsWith("tmp")).length<DM106_MAX)return {fim:true};
  let antes=Infinity;feed.forEach(m=>{if(+m.at<antes)antes=+m.at});DM106.ant.forEach(m=>{if((l==="o"?m.de===S.uid&&m.para===u:m.de===u&&m.para===S.uid)&&+m.at<antes)antes=+m.at});
  return {fim:false,antes}}
function dm106TemMais(u){return !!u&&!!S.uid&&!(dm106Lado(u,"o").fim&&dm106Lado(u,"i").fim)}
async function dm106Mais(u){if(DM106.car||typeof SB==="undefined"||!SB||!u)return;DM106.car=true;const b=$("#v-msgs [data-dm106mais]");if(b){b.disabled=true;b.textContent="Carregando…"}
  let erro=false;DM106.pag[u]=true;DM106.vi=S.msgsIn;DM106.vo=S.msgsOut;
  try{for(const [l,de,para] of [["o",S.uid,u],["i",u,S.uid]]){const x=dm106Lado(u,l);if(x.fim)continue;
      const r=await SB.from("mensagens").select("*").eq("de",de).eq("para",para).lt("at",x.antes).order("at",{ascending:false}).limit(DM106_PAG);if(r.error){erro=true;break}
      const rows=r.data||[];rows.forEach(m=>{const id=String(m.id);DM106.ant.set(id,{id,de:m.de,para:m.para,at:+m.at,texto:m.texto||"",pid:m.pid||null,snap:m.snap||null,resp:m.resp,tipo:m.tipo||null,lida:!!m.lida})});
      if(rows.length<DM106_PAG)DM106.fim[u+":"+l]=true}}
  catch(e){erro=true}
  DM106.car=false;if(erro)toast("Não deu para carregar as mensagens antigas agora.");
  if(VIEW!=="msgs"||THREAD!==u){return}
  const pri=$("#v-msgs .thread .dm-m"),id=pri&&pri.dataset.mid,y0=pri?pri.getBoundingClientRect().top:0;renderMsgs();
  const el=id&&document.querySelector(`#v-msgs [data-mid="${CSS.escape(id)}"]`);if(el)window.scrollBy(0,el.getBoundingClientRect().top-y0)}
{const _th106=dmThreadHTML;dmThreadHTML=function(u){const h=_th106.apply(this,arguments);try{if(dm106TemMais(u)&&h.indexOf('class="dm-vazio"')<0)return `<div class="dm106-topo"><button type="button" class="btn ghost dm106-mais" data-dm106mais>${DM106.car?"Carregando…":"Carregar mensagens antigas"}</button></div>`+h}catch(e){}return h}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-dm106mais]");if(!b)return;e.stopPropagation();dm106Mais(THREAD)});
{const _ap106=dmApagar;dmApagar=async function(id){const m=DM106.ant.get(id);if(m&&m.de===S.uid)DM106.ant.delete(id);return _ap106.apply(this,arguments)}}

/* 2. Conversas: resposta a uma mensagem que foi apagada não mostra mais o texto apagado */
function dm106Apagada(q,ids,u){if(!q||!q.id||String(q.id).startsWith("tmp")||ids.has(q.id))return false;return dm106Lado(u,q.de===S.uid?"o":"i").fim}
const DM106_APG="\u2063dm106apagada\u2063";
{const _th106b=dmThreadHTML;dmThreadHTML=function(u){const am=allMsgs;let mud=false;
  allMsgs=function(){const l=am.apply(this,arguments),ids=new Set(l.map(m=>m.id));return l.map(m=>{if(m&&m.tipo==="resposta"&&m.snap&&m.snap.q&&dm106Apagada(m.snap.q,ids,u)){mud=true;return {...m,snap:{...m.snap,q:{...m.snap.q,t:DM106_APG}}}}return m})};
  let h;try{h=_th106b.apply(this,arguments)}finally{allMsgs=am}
  return mud?h.split(`<span>${DM106_APG}</span>`).join(`<span class="dm106-apg">Mensagem apagada</span>`):h}}

/* tocar na citação de uma original que ainda não foi carregada (conversa longa): não diz que foi apagada */
window.addEventListener("click",e=>{const q=e.target.closest&&e.target.closest("#v-msgs .dm-m div.dm-q");if(!q||!THREAD)return;const dm=q.closest(".dm-m"),m=dm&&allMsgs().find(x=>x.id===dm.dataset.mid);const r=m&&m.tipo==="resposta"&&m.snap&&m.snap.q;
  if(!r||!r.id||String(r.id).startsWith("tmp")||document.querySelector(`#v-msgs [data-mid="${CSS.escape(String(r.id))}"]`)||dm106Lado(THREAD,r.de===S.uid?"o":"i").fim)return;
  e.stopImmediatePropagation();toast("A original é mais antiga: toque em “Carregar mensagens antigas”, no começo da conversa.")},true);

/* 3. Atividade: quem pediu amizade vê quando o pedido foi aceito (mesmo sem nunca ter aberto a Atividade) */
function at106Aceitos(){try{if(!S.uid||!S.membro||!S.amigosOk)return;const k="prumo-pedout:"+S.uid;let ant=null;try{ant=JSON.parse(localStorage.getItem(k)||"null")}catch(e){}
  const agora=(S.pedidosOut||[]).slice().sort(),novos=(ant||[]).filter(u=>S.amigos.has(u));
  if(novos.length){let l=atLed();if(!l)l={_t0:Date.now()};novos.forEach(u=>{l["a:"+u]=Date.now()});atLedSalva(l);setTimeout(()=>{try{atDot()}catch(e){}},0)}
  if(JSON.stringify(ant)!==JSON.stringify(agora))try{localStorage.setItem(k,JSON.stringify(agora))}catch(e){}}catch(e){}}
{const _ra106=rerenderAll;rerenderAll=function(){at106Aceitos();return _ra106.apply(this,arguments)}}

/* 4. Aviso (toast) que já estava na tela não fica por cima de uma folha que acabou de abrir */
{const _t106=toast;toast=function(){const r=_t106.apply(this,arguments);const el=[...document.querySelectorAll(".toast")].pop();if(el)el._t106=Date.now();return r}}
{const _sh106=sheet;sheet=function(){const r=_sh106.apply(this,arguments);try{document.querySelectorAll(".toast").forEach(x=>{if(!x.querySelector(".toast-a")&&Date.now()-(x._t106||0)>400)x.remove()})}catch(e){}return r}}

/* 5. Matéria: voltar do celular com o menu "Aa" aberto fecha só o menu */
{const _cl106a=closeLayer;closeLayer=function(fromPop){const ab=$("#layer .mat-aap");if(fromPop===true&&ab&&!($("#layer2")?.innerHTML)){ab.remove();$("#layer [data-mataa]")?.setAttribute("aria-expanded","false");if(pushH())HST++;return}return _cl106a.apply(this,arguments)}}

/* 6. Visitante: a tela de entrar diz por que apareceu (guardar, curtir, mandar) */
var PC106={k:"",t:0};
const PC106_TX={guardar:"Para guardar notícias e ler depois, entre na sua conta.",salvar_post:"Para guardar posts, entre na sua conta.",curtir:"Para curtir, entre na sua conta.",enviar:"Para mandar notícias aos amigos, entre na sua conta."};
{const _u106=uso;uso=function(k){PC106={k,t:Date.now()};return _u106.apply(this,arguments)}}
{const _al106=abrirLogin;abrirLogin=function(){const ja=$(".sheet .pc106");const tx=Date.now()-PC106.t<400&&PC106_TX[PC106.k]?PC106_TX[PC106.k]:ja?ja.textContent:"";
  const r=_al106.apply(this,arguments);try{if(tx){const b=$("#layer .sheet .sh-b")||$("#layer2 .sheet .sh-b");if(b&&!b.querySelector(".pc106"))b.insertAdjacentHTML("afterbegin",`<p class="pc106">${esc(tx)}</p>`)}}catch(e){}return r}}

/* 7. Pergunta aos amigos: as opções têm até 40 letras; mostra quantas faltam quando chega perto */
document.addEventListener("input",e=>{const i=e.target;if(!i||!i.matches||!i.matches("[data-cn102o]"))return;const sp=i.closest(".cn102-op");if(!sp)return;const f=40-i.value.length;if(f<=10)sp.dataset.falta=String(Math.max(0,f));else delete sp.dataset.falta});

/* 8. Comentário: caixa que cresce com o texto (até 5 linhas); Enter publica, como antes */
function cm106Ajusta(t){if(!t)return;t.style.height="auto";t.style.height=Math.min(t.scrollHeight+2,128)+"px"}
document.addEventListener("input",e=>{const t=e.target;if(!t||t.id!=="ctext"||t.tagName!=="TEXTAREA")return;if(/\n/.test(t.value)){const p=t.selectionStart;t.value=t.value.replace(/\r?\n/g," ");try{t.setSelectionRange(p,p)}catch(_){}}cm106Ajusta(t)});
document.addEventListener("keydown",e=>{const t=e.target;if(!t||t.id!=="ctext"||t.tagName!=="TEXTAREA"||e.key!=="Enter"||e.shiftKey||e.isComposing)return;e.preventDefault();const f=t.form;const b=f&&f.querySelector("[type=submit]");if(f&&b&&!b.disabled){if(f.requestSubmit)f.requestSubmit(b);else b.click()}});
document.addEventListener("submit",e=>{if(e.target&&e.target.id==="cform")setTimeout(()=>cm106Ajusta($("#ctext")),0)});

/* 9. Story de amigo com "Adicione o seu": tocar no cartão todo participa; fechar a câmera sem publicar volta para o story da amiga */
var AD106=null;
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const c=t.closest("#layer .story .fg-add");if(!c)return;const b=c.querySelector("[data-usadd]");if(!b)return;
  if(!t.closest("[data-usadd]")){e.stopImmediatePropagation();e.preventDefault();b.click();return}
  try{const x=usX(b);AD106=x&&x.autor!==S.uid?{autor:x.autor,id:x.id,t:Date.now()}:null}catch(_){}},true);
{const _cl106=closeLayer;closeLayer=function(){const ce=!!$("#layer .ce")&&!($("#layer2")?.innerHTML);const r=_cl106.apply(this,arguments);
  try{if(AD106&&ce&&!$("#layer .ce")){const a=AD106;AD106=null;const pub=typeof ED!=="undefined"&&ED&&ED.env;if(!pub&&Date.now()-a.t<30*60e3&&typeof igAbrirUser==="function"&&pubDe(a.id))setTimeout(()=>{if(!$("#layer").innerHTML){document.querySelectorAll(".toast").forEach(x=>{if(!x.querySelector(".toast-a"))x.remove()});igAbrirUser(a.autor,a.id)}},260)}}catch(e){}return r}}

/* 10. Stories: tocar no ✕ enquanto o cubo gira (troca de grupo) fecha — antes o toque caía no vazio */
function st106NoX(cx,cy){const st=$("#layer .story");if(!st||($("#layer2")?.innerHTML)||!(VIRANDO||st.classList.contains("sg-cubo")))return false;
  const b=st.querySelector(".story-in .s-h [data-close]");if(!b)return false;let el=b,x=0,y=0;while(el&&el!==st&&el!==document.body){x+=el.offsetLeft;y+=el.offsetTop;el=el.offsetParent}if(el!==st)return false;
  const r=st.getBoundingClientRect();return cx>=r.left+x-8&&cx<=r.left+x+b.offsetWidth+8&&cy>=r.top+y-8&&cy<=r.top+y+b.offsetHeight+8}
window.addEventListener("touchend",e=>{const t=e.changedTouches&&e.changedTouches[0];if(!t||!st106NoX(t.clientX,t.clientY))return;e.preventDefault();e.stopImmediatePropagation();closeLayer()},{capture:true,passive:false});
window.addEventListener("click",e=>{if(!st106NoX(e.clientX,e.clientY)||(e.target.closest&&e.target.closest("#layer .story [data-close]")))return;e.preventDefault();e.stopImmediatePropagation();closeLayer()},true);
