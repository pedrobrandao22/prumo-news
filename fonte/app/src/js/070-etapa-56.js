/* ---------- Etapa 56 ---------- */
var DM_LP=0,TST_AT=0;
window.addEventListener("click",e=>{if(Date.now()-DM_LP<700&&e.target.closest&&e.target.closest(".scrim,.sheet")){e.stopPropagation();e.preventDefault()}},true);
async function dmCopiar(t){let ok=false;try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(t);ok=true}}catch(e){}
  if(!ok){try{const ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");ta.style.cssText="position:fixed;opacity:0;top:0";document.body.appendChild(ta);ta.select();ok=document.execCommand("copy");ta.remove()}catch(e){}}
  toast(ok?"Texto copiado":"Não deu para copiar aqui. Segure o texto para copiar.")}
/* 2. posts de membros nas Conversas */
function dmEhPub(m){return String(m.pid||"").indexOf("u:")===0}
{const _dc56=dmCard;dmCard=function(m){if(!dmEhPub(m))return _dc56.apply(this,arguments);const id=m.pid.slice(2),x=typeof pubDe==="function"&&pubDe(id),s=m.snap||{};
  const u=x&&x.fotos&&x.fotos[0]&&pubUrl(x.fotos[0]),au=x?x.autor:null,tx=x?x.texto:(String(s.titulo||"").replace(/^(Post|Story) de [^:]+:\s*/,""));
  return `<button type="button" class="dm-card dm-ucard" data-open="${esc(m.pid)}"><span class="dm-uh">${au?avatar(au):""}<b>${esc(au?nomeDe(au):(String(s.titulo||"").match(/^(?:Post|Story) de ([^:]+)/)||[,"Publicação"])[1])}</b><small>${x?(x.tipo==="story"?"Story":x.estilo&&x.estilo.reel?"Reel":"Post"):/^Story de /.test(String(s.titulo||""))?"Story":"Publicação"}</small></span>${u?`<span class="dm-cf"><img src="${pubSrc(u)}" alt="" loading="lazy" decoding="async"></span>`:""}${tx?`<span class="dm-ct"><b class="dm-utx">${esc(String(tx).slice(0,160))}</b></span>`:""}${!x?`<span class="dm-ct"><small class="dm-indisp">Só quem é amigo do autor consegue abrir</small></span>`:""}</button>`}}
{const _dp56=dmPrevia;dmPrevia=function(m){const eu=m.de===S.uid;if(m.tipo==="mencao"&&dmEhPub(m)&&m.snap&&m.snap.upub)return m.snap.story===true?(eu?"Você mencionou no story":"Mencionou você no story"):eu?"Você marcou num post":"Marcou você num post";
  if(dmEhPub(m)&&!m.texto&&m.tipo!=="mencao")return eu?"Você enviou um post":"Enviou um post";return _dp56.apply(this,arguments)}}
{const _th56=dmThreadHTML;dmThreadHTML=function(u){let h=_th56.apply(this,arguments);return h.replace(/(<span class="dm-lb">)(Você mencionou [^<]*|Mencionou você) num comentário(<\/span>)(<button type="button" class="dm-card dm-ucard" data-open="u:([^"]+)")/g,(a,b1,quem,b3,b4,id)=>{const m=allMsgs().find(x=>x.tipo==="mencao"&&x.pid==="u:"+id&&x.snap&&x.snap.upub);return m?b1+quem+" num post"+b3+b4:a})}}
/* 3. curtida de story lembrada */
var US_CURTI=new Set((()=>{try{return JSON.parse(localStorage.getItem("prumo-us-curti")||"[]")}catch(e){return []}})());
function usCurtiu(id){return US_CURTI.has(id)||S.msgsOut.some(m=>m.tipo==="curtiu_story"&&m.snap&&m.snap.story&&m.snap.story.id===id)}
{const _du56=igDrawUser;igDrawUser=function(){const r=_du56.apply(this,arguments);try{const x=ST.itens[ST.i];const b=$("#layer [data-uscurtir]");if(b&&x&&usCurtiu(x.id))b.classList.add("on")}catch(e){}return r}}
window.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer [data-uscurtir]");if(!b)return;const id=b.dataset.uscurtir;if(usCurtiu(id)){e.stopPropagation();b.classList.add("on");return}US_CURTI.add(id);try{localStorage.setItem("prumo-us-curti",JSON.stringify([...US_CURTI].slice(-300)))}catch(_){}},true);
/* 5. Feed com publicação apagada: redesenha ao entrar no Feed */
{const _go56=go;go=function(v){const r=_go56.apply(this,arguments);if(v==="feed"&&typeof PUB_FEED_PEND!=="undefined"&&PUB_FEED_PEND){PUB_FEED_PEND=false;try{renderPosts(true)}catch(e){}}return r}}
/* 8. voltar (gesto/botão do celular) com algo no criador: pede um segundo voltar */
var CR_VOLTA=0;
{const _cl56=closeLayer;closeLayer=function(fromPop){if(fromPop===true&&$("#layer .cria")&&!($("#layer2")?.innerHTML)&&CR&&!CR.env&&(CR.fotos.length||CR.texto.trim()||CR.pid)&&Date.now()-CR_VOLTA>3000){CR_VOLTA=Date.now();if(pushH())HST++;toast("Volte de novo para descartar o que você fez.");return}return _cl56.apply(this,arguments)}}

