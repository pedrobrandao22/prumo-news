/* ---------- 204 · Feed (Fase 3): as funções do Feed, cada uma numa versão só ----------
   Antes eram definidas em 006, 008, 026, 067 e 068 e remendadas em 052, 053, 058, 060, 061, 067, 068, 072, 081, 099, 102,
   103, 104-correcoes-feed, 107, 108, 109, 111, 112, 113, 115, 118, 121, 122, 123, 126, 129, 134, 145, 155, 156, 159, 167 e 186.
   Cada função abaixo faz o que a cadeia inteira fazia, na mesma ordem; os comentários dizem de onde veio cada passo.
   Os auxiliares dos outros arquivos (vn112*, fd156*, fd167*, f113*, fc107*, ht*, …) continuam onde estavam: aqui eles só
   são chamados, sempre depois da carga.
   Carga: o 029 desenha o Feed com a edição guardada antes dos complementos (renderPosts → postSeguro, updateSocial,
   fitTrack). Naquela hora só existia a definição base, e os complementos ainda nem tinham sido declarados: até o 999
   chamar fd204Pronta(), estas funções fazem só a parte base, como antes. As variáveis daqui não têm valor inicial
   (var sem =): o 121 grava FD204_VIGIA121 na carga e a posição deste arquivo não pode apagá-la. */
var FD204_PRONTA,FD204_VIGIA121;
function fd204Pronta(){FD204_PRONTA=true}

/* ===== postSeguro: o HTML de um item do Feed (notícia, post de membro, prateleira) =====
   Base no 006; remendos (de dentro para fora): 068, 107, 111, 112, 113, 122, 129. */
function ps204Base(p){try{return postHTML(p)}catch(e){return ""}}
function postSeguro(p){
  if(!FD204_PRONTA)return ps204Base(p);
  /* 068: post de membro misturado no Feed */
  const c068=()=>{if(p&&p.__pub)try{return pubPostHTML(p.__pub)}catch(e){return ""}return ps204Base(p)};
  /* 107: foco na notícia (comentário junto da notícia; cartão da notícia) */
  const c107=()=>{const h=c068();try{if(typeof h!=="string"||!h||!p)return h;if(p.__fc107)return fc107Junto(h,p);if(!p.__pub)return fc107NoPost(h,p.id)}catch(e){}return h};
  /* 111: linha das hashtags e "Por seguir #…" */
  const c111=()=>{let h=c107();try{if(typeof h!=="string"||!h||!p||p.__fc107)return h;
    let sg=null;if(p.__pub)sg=htSeguidaDePost(p.__pub);else{const pp=pautaById(p.id)||p;const ln=htLinhaNot(pp,"ht-nl");if(ln&&h.indexOf('class="ht-nl')<0){const i=h.indexOf('<div class="pollbox"');if(i>0)h=h.slice(0,i)+ln+h.slice(i)}sg=htSeguidaDe(pp)}
    if(sg)h=h.replace(/^(\s*<article\b[^>]*>)/,`$1<p class="ht-por gut">Por seguir <b>${esc(sg)}</b></p>`)}catch(e){}return h};
  /* 112: visual novo (cartão A da notícia) */
  const c112=()=>{let h=c111();try{if(typeof h==="string"&&h&&p&&!p.__pub&&pautaById(p.id)){const a=vn112Tp(h);if(a){vn112PoeRp(a,"pauta",p.id);return VN112_CT?vn112CtNt(a,p):a.outerHTML}return VN112_CT?vn112CtNt(h,p):h}
    /* 107 escreve o título do comentário único entre aspas duplas (sai "${esc(...)}" na tela); aqui sai o nome */
    if(typeof h==="string"&&p&&p.__fc107&&p.__pub&&h.indexOf("${esc(fc107Prim(x.autor))}")>=0)h=h.replace("${esc(fc107Prim(x.autor))}",esc(fc107Prim(p.__pub.autor)))}catch(e){}return h};
  /* 113: prateleira; o comentário logo abaixo da notícia já está junto dela: sem caixa de contexto */
  const c113=()=>{if(p&&p.__f113)try{return f113PratHTML(p.__f113)}catch(e){return ""}
    let h=c112();try{if(p&&p.__fc107&&typeof h==="string"&&h.indexOf("fs2-ctx")>=0){const a=vn112Tp(h);if(a){a.querySelectorAll(".fs2-ctx").forEach(e=>e.remove());h=a.outerHTML}}}catch(e){}return h};
  /* 122: linha de decisão */
  const c122=()=>{const h=c113();try{if(p&&p.__dc122)return dc122Linha(h,p)}catch(e){}return h};
  /* 129 */
  const h=c122();try{if(p&&p.__dz129&&typeof h==="string"&&h){const a=vn112Tp(h);if(a&&!a.classList.contains("dz129-nt")){a.classList.add("dz129-nt");return a.outerHTML}}}catch(e){}return h}

/* ===== pubMistura: põe os posts dos amigos no meio da lista do Feed =====
   Base no 068; remendos: 107, 111, 113, 122, 129. */
function pm204Base(lista){if(FILTRO!=="tudo"||!PUB.on)return lista;const now=Date.now();const ps=pubVisiveis().filter(x=>x.tipo==="post"&&now-x.at<30*864e5).sort((a,b)=>b.at-a.at);if(!ps.length)return lista;
  const out=lista.slice();let k=0;ps.forEach(x=>{const novo=now-x.at<48*3600e3;const pos=novo?1+k*3:Math.min(out.length,8+k*4);out.splice(Math.min(out.length,pos),0,{id:"u:"+x.id,__pub:x});k++});return out}
function pubMistura(lista){
  if(!FD204_PRONTA)return pm204Base(lista);
  /* 107 */
  const c107=()=>{const out=pm204Base(lista);try{return fc107Mistura(out,lista)}catch(e){return out}};
  /* 111: posts de hashtag seguida sobem */
  const c111=()=>{const out=c107();try{if(!Array.isArray(out)||!Object.keys(htSeguidas()).length)return out;
    const ps=out.filter(x=>x&&x.__pub&&Date.now()-(+x.__pub.at||0)<7*864e5&&htSeguidaDePost(x.__pub)).slice(0,2);
    ps.forEach((x,j)=>{const i=out.indexOf(x);if(i>1+j){out.splice(i,1);out.splice(1+j,0,x)}})}catch(e){}return out};
  /* 113: prateleiras só na lista principal ("Tudo"), uma vez por desenho */
  const c113=()=>{const out=c111();if(!F113_SH_LIGA||FILTRO!=="tudo")return out;F113_SH_LIGA=false;try{return f113Prat(out)}catch(e){console.error(e);return out}};
  /* 122 */
  const c122=()=>{const out=c113();try{return dc122Feed(out)}catch(e){console.error(e);return out}};
  /* 129 */
  const out=c122();try{return dz129Feed(out)}catch(e){console.error(e);return out}}

/* ===== fitTrack: altura das páginas do cartão =====
   Base no 006; remendos: 052, 053, 061, 072, 112. O 108 troca fitTrack por um instante durante carregarMais (lá embaixo). */
function ft204Base(t){const w=t.clientWidth;if(w)t.style.setProperty("--slh",(t.closest&&t.closest(".vn-cn")?Math.max(260,Math.round(Math.min(w*.98,innerHeight*.6))):Math.max(300,Math.round(Math.min(w*1.25,innerHeight*0.7))))+"px");t.querySelectorAll(".txs:not(.aberto)").forEach(x=>x.classList.toggle("ovf",x.scrollHeight>x.clientHeight+6));const i=Math.max(0,Math.round(t.scrollLeft/Math.max(1,w)));const s=t.children[i];if(s&&s.offsetHeight>0)t.style.height=s.offsetHeight+"px";return i}
function fitTrack(t){
  const r=ft204Base(t);
  if(!FD204_PRONTA)return r;
  /* 052: páginas de altura fixa */
  if(t&&t.closest&&t.closest(".post")){if(document.fonts&&document.fonts.status!=="loaded")document.fonts.ready.then(()=>paginarTrack(t));else paginarTrack(t)}
  /* 053: carrossel social */
  if(t&&t.closest&&t.closest(".post")){const go=()=>ssCaber(t);if(document.fonts&&document.fonts.status!=="loaded")document.fonts.ready.then(go);else go()}
  /* 061: pontinhos das páginas */
  try{if(t&&t.closest&&t.closest(".post"))pgDots(t)}catch(e){}
  /* 072: proporção da foto do post */
  try{const a=t.closest&&t.closest(".upost.up-ar"),ar=a&&+a.dataset.ar,w=t.clientWidth;if(ar&&w){t.style.setProperty("--slh",Math.round(w/ar)+"px");const s=t.children[r];if(s&&s.offsetHeight>0)t.style.height=s.offsetHeight+"px"}}catch(e){}
  /* 112: mídia mais baixa no cartão da notícia */
  try{const c=t&&t.closest&&t.closest(".vn-c");if(c&&c.classList.contains("vn-cn")){const w=t.clientWidth;if(w){t.style.setProperty("--slh",Math.max(260,Math.round(Math.min(w*.98,innerHeight*.6)))+"px");try{if(typeof ssCaber==="function")ssCaber(t)}catch(e){}const s=t.children[r|0];if(s&&s.offsetHeight>0)t.style.height=s.offsetHeight+"px"}}}catch(e){}
  return r}

/* ===== updateSocial: curtidas, comentários e amigos no cartão =====
   Base no 006; remendos: 058, 060, 081, 099, 102, 104-correcoes-feed, 112, 123, 156. */
function us204Base(pid){
  const sa=$("#s-acts");if(sa&&sa.dataset.pid===pid)sa.innerHTML=storyActs(pid);
  const el=document.getElementById("p-"+pid);if(!el)return;
  const {likes,cm}=socialOf(pid),mine=!!(S.uid&&likes.includes(S.uid)),others=likes.filter(u=>u!==S.uid);
  const lb=el.querySelector('[data-a="like"]');lb.classList.toggle("on",mine);lb.setAttribute("aria-pressed",String(mine));
  el.querySelector('[data-n="like"]').textContent="";
  el.querySelector('[data-n="cmt"]').textContent="";
  const sb=el.querySelector('[data-a="save"]'),sv=!!S.salvos[pid];sb.classList.toggle("saved",sv);sb.setAttribute("aria-pressed",String(sv));
  let lt="";const n1=others[0]?`<b>${esc(nomeDe(others[0]))}</b>`:"";
  if(mine&&others.length===1)lt=`<b>Você</b> e ${n1} curtiram`;
  else if(mine&&others.length>1)lt=`<b>Você</b> e mais ${others.length} curtiram`;
  else if(others.length===1)lt=`${n1} curtiu`;
  else if(others.length>1)lt=`${n1} e mais ${others.length-1} curtiram`;
  {const lk=el.querySelector("[data-likes]");lk.innerHTML=lt;if(lt){lk.dataset.a="quem";lk.setAttribute("role","button");lk.tabIndex=0}else{delete lk.dataset.a;lk.removeAttribute("role");lk.removeAttribute("tabindex")}}
  const pp=pautaById(pid);if(pp){const pl=el.querySelector("[data-poll]");if(pl){const eh=enqueteHTML(pp);pl.innerHTML=eh?`<span class="pb-l">Enquete</span>${eh}`:""}}
  {const ot=el.querySelector("[data-otr]");if(ot){const at=atividadeAmigos(pid);
    if(at.length===1){const {u,ac}=at[0];ot.innerHTML=`<span class="otr" role="button" tabindex="0" ${ac.includes("curtiu")?`data-filtro="_gostou"`:`data-otrs="${esc(pid)}"`} title="${esc(nomeDe(u))}" aria-label="${esc(nomeDe(u)+" "+ac.join(", "))}">${avatar(u)}${esc(ac.join(" · "))}</span>`}
    else if(at.length>1)ot.innerHTML=`<span class="otr" role="button" tabindex="0" data-otrs="${esc(pid)}" aria-label="${esc(at.length+" amigos nesta notícia")}">${avatares(at.map(x=>x.u))}${at.length} amigos</span>`;
    else ot.innerHTML=""}}
  {const nc=el.querySelector("[data-nchat]");if(nc){const ms=allMsgs().filter(m=>m.pid===pid&&m.texto);const u=ms[ms.length-1];nc.innerHTML=u?`<button type="button" class="nachat" data-nachat="${esc(u.de===S.uid?u.para:u.de)}">${ICON.cmt}<span><b>Na conversa</b> · ${esc(u.de===S.uid?"Você":nomeDe(u.de))}: ${esc(u.texto)}</span></button>`:""}}
  el.querySelector("[data-together]").innerHTML="";
  el.querySelector("[data-cmts]").innerHTML=(cm.length>2?`<button type="button" class="link" data-a="cmt">Ver os ${cm.length} comentários</button>`:"")+cm.slice(-2).map(c=>fd204CmtHTML(c,cm)).join("");
}
/* um comentário no cartão do Feed (corretor 18/11): resposta ("@Nome texto", como a folha grava) sai como na folha,
   recuada e com "respondendo a Nome", sem o "@Nome" grudado no texto */
function fd204CmtHTML(c,cm){const nm=nomeDe(c.uid);let tx=String(c.texto||""),quem="";
  if(tx[0]==="@"){const ns=[...new Set((cm||[]).map(x=>nomeDe(x.uid)).filter(Boolean))].sort((a,b)=>b.length-a.length);
    for(const n of ns){if(tx.slice(1,n.length+1)===n&&(tx.length===n.length+1||/\s/.test(tx[n.length+1]))){quem=n;tx=tx.slice(n.length+1).replace(/^\s+/,"");break}}}
  return quem?`<div class="cmt cmt204-resp" data-a="cmt" role="button" tabindex="0"><small class="cmt204-rt">respondendo a ${esc(quem)}</small><b>${esc(nm)}</b>${esc(tx)}</div>`
    :`<div class="cmt" data-a="cmt" role="button" tabindex="0"><b>${esc(nm)}</b>${esc(tx)}</div>`}
function updateSocial(pid){
  if(!FD204_PRONTA)return us204Base(pid);
  /* 060: com o story aberto, a curtida do story é posta no lugar (sem redesenhar a barra) */
  const sa=$("#layer #s-acts");let tirou=false;if(sa&&sa.dataset.pid===pid&&sa.querySelector('[data-a="like"]')){sa.dataset.pid="";tirou=true}
  let r;try{r=us204Base(pid);
    /* 058: contador de comentários no story */
    try{const w=$("#layer .sg-f2");if(w&&w.dataset.pid===pid){const c=w.querySelector(".sg-ccw");if(c)c.innerHTML=igCmtChip(pid)}}catch(e){}
  }finally{if(tirou){sa.dataset.pid=pid;igLikeNoLugar(pid)}}
  /* 081: post sem curtidas não mostra amigos */
  try{const el=document.getElementById("p-"+pid);if(el&&el.classList.contains("sem-curt")){const o=el.querySelector("[data-otr]");if(o)o.innerHTML=""}}catch(e){}
  /* 099 */
  try{vp99Social(pid)}catch(e){}
  /* 102: enquete do post */
  try{const m=/^u:(.+)$/.exec(String(pid||""));if(m&&document.querySelector(`.cn102-enq[data-cn102enq="${CSS.escape(m[1])}"]`))cn102EnqRedesenha(m[1])}catch(e){}
  /* 104 */
  try{fd104Curtidas(pid)}catch(e){}
  /* 112 */
  vn112Social(pid);
  /* 123: coluna aberta */
  try{if(CS123.ler&&pid==="u:"+CS123.ler.id)cs123FimAtualiza()}catch(e){}
  /* 156 */
  fd156Curtidas(pid);
  return r}

/* ===== renderPosts: a lista do Feed =====
   Base no 006; remendos: 068 (posts dos amigos na lista), 113, 115, 118, 121, 156, 159, 167, 186. */
function rp204Base(manter){
  AUTO=autoPesos();
  let lista=listaFeed();
  const novas=lista.filter(p=>NOVAS.has(p.id)&&!LIDAS.has(p.id)).length+lista.filter(p=>ATUALIZADAS.has(p.id)).length;
  let h="";
  if(FILTRO==="_colunas")h+=col207Cab(lista);
  else if(FILTRO!=="tudo"){h+=`<div class="sech gut"><i style="background:${FILTRO[0]==="_"?"var(--bronze)":secCor(FILTRO)}"></i><h4>${esc(nomeFiltro(FILTRO))}</h4><button type="button" class="vertudo" data-filtro="tudo">Ver tudo ✕</button><span>${lista.length} ${lista.length===1?"notícia":"notícias"}${FILTRO==="politica"&&FEED.contagem?" · "+esc(FEED.contagem):""}</span></div>`;h+=secHub(FILTRO)}
  NOVID=lista.filter(p=>(NOVAS.has(p.id)&&!LIDAS.has(p.id))||ATUALIZADAS.has(p.id)).map(p=>p.id);
  if(novas)h+=`<button type="button" class="newbar gut" data-novidades><span class="nb-d"></span>${novas} ${novas===1?"novidade":"novidades"} desde a sua última visita${VISITA0&&hhmm(VISITA0)?` (${esc(diaHora(VISITA0))})`:""}<span class="chev" aria-hidden="true">›</span></button>`;
  if(FILTRO==="tudo"){const u=urgHTML("urg-f");if(u)h=`<div class="gut">${u}</div>`+h}h+=cobSegStrip();
  LOTE={lista,pos:Math.min(manter?Math.max(6,LOTE.pos||0):6,lista.length)};h=avisoAtraso()+h+lista.slice(0,LOTE.pos).map(postSeguro).join("")+(LOTE.pos<lista.length?`<div id="mais" class="empty" style="padding:24px">Carregando mais notícias…</div>`:"");
  $("#posts").innerHTML=lista.length?h:`${h}<div class="empty"><b>${FILTRO==="tudo"&&PREF.feedModo==="seguindo"?"Nada do que você segue nesta edição":FILTRO==="_colunas"?"Nenhuma coluna aqui":FILTRO[0]==="_"?"Nada por aqui ainda":"Nenhuma notícia nesta seção agora"}</b>${FILTRO==="tudo"&&PREF.feedModo==="seguindo"?"Siga uma cobertura (botão Seguir) ou escolha o seu time em Esportes. Para ver tudo, mude a ordem no filtro.":FILTRO==="_colunas"?(COL207.ed||COL207.au?"Nenhuma coluna com este filtro. Toque em Todas para ver as outras.":"As colunas de quem você segue aparecem aqui."):FILTRO[0]==="_"?"Quando isso mudar, as notícias aparecem aqui.":""}<button type="button" class="btn ghost" data-filtro="tudo" style="margin-top:10px">Ver todas as notícias</button></div>`;
  lista.slice(0,LOTE.pos).forEach(p=>updateSocial(p.id));wireTracks($("#posts"));observarMais();
  renderChgBox();
  /* 20/11 (testador): da mais nova para a mais velha (notas de dois dias apareciam antes das de minutos) */
  const br=FILTRO[0]==="_"?[]:(FEED.breves||[]).filter(b=>(FILTRO==="tudo"&&!(PREF.ocultas||[]).includes(b.secao||"politica"))||(b.secao||"politica")===FILTRO).map((b,i)=>[b,i]).sort((x,y)=>(tms(y[0].hora)||0)-(tms(x[0].hora)||0)||x[1]-y[1]).map(z=>z[0]);
  const at=new Date(FEED.atualizado_em);
  $("#extra").innerHTML=`<div class="done gut" id="emdia"></div>${br.length?`<div class="sec gut"><h4>Outras notícias</h4><ul class="brv">${(window.BREVES=br,br).map((b,bi)=>`<li><button type="button" class="brv-b" data-breve="${bi}">${b.urgente&&tms(b.hora)&&Date.now()-tms(b.hora)<3*3600e3?`<em class="ug">Urgente</em>`:""}${esc(b.titulo)}</button><span>${esc(secNome(b.secao||"politica"))} · ${esc(nomeFonte(b.fonte))}</span></li>`).join("")}</ul></div>`:""}
  <div class="foot gut"><p><b>Atualizado ${isNaN(at)?"":esc(diaHora(horaEdicaoIso()))}.</b> A edição completa sai às 6h52 e é atualizada de 2 em 2 horas, às 9h48, 11h48, 13h48, 15h48, 17h48, 19h48 e 21h48; manchetes e indicadores são conferidos de hora em hora.</p><p>Os resumos são escritos pelo Prumo a partir das matérias, sem copiar texto. As versões de direita e de esquerda são escritas pelo Prumo com os mesmos fatos. As fotos vêm de acervos de uso livre, sempre com crédito (Agência Brasil, Senado, Câmara e Wikimedia Commons); quando não há foto, o Prumo usa um desenho.</p></div>`;
  atualizarEmDia();
}
function renderPosts(manter){
  if(!FD204_PRONTA)return rp204Base.apply(this,arguments);
  /* 186 */
  nm186EmDia();
  let r;
  /* 113: prateleiras uma vez por desenho; 068: listaFeed passa por pubMistura durante o desenho */
  F113_SH_LIGA=true;try{const lf=listaFeed;listaFeed=function(){return pubMistura(lf.apply(this,arguments))};try{r=rp204Base.apply(this,arguments)}finally{listaFeed=lf}}finally{F113_SH_LIGA=false}
  /* 115 (VN_FASE2, sempre ligado) */
  try{rb115CtxFeed()}catch(e){}
  /* 118: placar */
  try{po118NoFeed()}catch(e){}
  /* 121: só em navegador sem contentvisibilityautostatechange */
  if(FD204_VIGIA121)try{FD204_VIGIA121()}catch(e){}
  /* 156 */
  fd156Mais();
  /* 159 */
  try{ca159VerTudo()}catch(e){}
  /* 167 */
  fd167Rodape();fd167BreveHora();fd167Curtir(document.getElementById("posts"));
  /* 208: "Acabou de sair" no topo */
  try{ac208Feed()}catch(e){}
  return r}

/* ===== carregarMais: o próximo lote do Feed ao rolar =====
   Base no 026; remendos: 103, 108, 115, 118, 121, 148, 156. */
function cm204Base(sync){
  const m=$("#mais");if(!m)return;const prox=LOTE.lista.slice(LOTE.pos,LOTE.pos+(sync?6:LOTE_PASSO));LOTE.pos+=prox.length;
  const tmp=document.createElement("div");tmp.innerHTML=prox.map(postSeguro).join("");const frag=[...tmp.children];
  frag.forEach(el=>m.before(el));prox.forEach(p=>updateSocial(p.id));frag.forEach(el=>wireTracks(el));
  if(LOTE.pos>=LOTE.lista.length){moreIO?.unobserve(m);m.remove();return}
  if(!sync)requestAnimationFrame(()=>{const r=m.getBoundingClientRect();if(r.top<innerHeight+600)carregarMais()});
}
function carregarMais(sync){
  const r=(()=>{
    /* 103: Feed escondido não carrega */
    if(!sync){const v=document.getElementById("v-feed");if(v&&v.hidden)return}
    /* 108: no lote novo, fitTrack só reserva a altura (troca por um instante, como antes: t_qa_producao2 conta as medidas
       pela variável global fitTrack); o resto vem quando o trilho aparece */
    if(sync||typeof FIT_IO==="undefined"||!FIT_IO)return cm204Base.apply(this,arguments);const ft=fitTrack;
    fitTrack=function(t){if(t&&t.classList&&t.classList.contains("track")){fit108Poe(t);return 0}return ft.apply(this,arguments)};try{return cm204Base.apply(this,arguments)}finally{fitTrack=ft}})();
  /* 115 (VN_FASE2, sempre ligado) */
  try{rb115CtxFeed()}catch(e){}
  /* 118 */
  try{po118NoFeed()}catch(e){}
  /* 121 */
  if(FD204_VIGIA121)try{FD204_VIGIA121()}catch(e){}
  /* 148: o próximo lote vem na tarefa seguinte */
  if(!sync)try{lt148Emenda()}catch(e){}
  /* 156 */
  fd156Mais();
  return r}

/* ===== openComments: a folha de comentários =====
   Base no 008; remendos: 067, 099, 108, 109, 126, 134, 156 (2×), 167. */
function oc204Sobre(pid){const b=document.querySelector("#layer .sheet .sh-b");if(!b||b.querySelector(":scope > .oc204-sobre"))return;const id=String(pid||"");let t="";
  if(/^u:/.test(id)){const x=pubDe(id.slice(2));if(x){const tx=String(x.texto||"").replace(/\s+/g," ").trim();t=`Post de ${x.autor===S.uid?"você":nomeDe(x.autor)}`+(tx?`: ${tx.length>70?tx.slice(0,68).trim()+"…":tx}`:"")}}
  else{const p=typeof pautaById==="function"?pautaById(id):null;let tt="";try{tt=p&&typeof versao==="function"?versao(p).titulo||"":""}catch(e){}if(!tt&&p)tt=p.titulo||"";if(tt)t=tt}
  if(!t)return;b.insertAdjacentHTML("afterbegin",`<p class="oc204-sobre">${esc(t)}</p>`)}
function oc204Base(pid){uso("comentarios");
  const draw=()=>{const {cm}=socialOf(pid);return cm.length?`<ul class="clist">${cm.map(c=>`<li>${avatar(c.uid)}<div><span><b>${esc(nomeDe(c.uid))}</b>${typeof debVotoChip==="function"?debVotoChip(pid,c.uid):""} ${esc(c.texto)}</span><i>${esc(quando(c.at))}<button type="button" class="c-a" data-resp="${esc(nomeDe(c.uid))}">Responder</button>${c.uid===S.uid||(typeof cmDono==="function"&&cmDono(pid))?`<button type="button" class="c-a" data-apagar="${esc(c.id)}" data-au="${esc(c.uid)}">Apagar</button>`:""}${c.uid!==S.uid?`<button type="button" class="c-a" data-denc="${esc(c.id)}" data-du="${esc(c.uid)}" data-dp="${esc(pid)}">Denunciar</button>`:""}</i></div></li>`).join("")}</ul>`:`<div class="empty" style="padding:18px 0"><b>Nenhum comentário ainda</b>Escreva o primeiro.</div>`};
  const n=socialOf(pid).cm.length;
  sheet(n?`Comentários (${n})`:"Comentários",`${typeof debCab==="function"?debCab(pid):""}<div id="cbox">${draw()}</div>`,`<form id="cform" class="cform">${S.uid?avatar(S.uid):""}<textarea class="field" id="ctext" rows="1" maxlength="600" autocomplete="off" enterkeyhint="send" placeholder="Escreva um comentário…" aria-label="Comentário"></textarea><button class="sendc" type="submit" aria-label="Publicar" disabled><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg></button></form>`,{focus:!n});
  const box=()=>$("#cbox"),toEnd=()=>{const b=$(".sheet .sh-b");if(b)b.scrollTop=b.scrollHeight};toEnd();
  const inp=$("#ctext"),btn=$("#cform .sendc");inp.addEventListener("input",()=>{btn.disabled=!inp.value.trim()});
  let assin=JSON.stringify(socialOf(pid).cm.map(c=>c.id+c.texto));S._reCmt=forca=>{const b=box();if(!b)return;const k=JSON.stringify(socialOf(pid).cm.map(c=>c.id+c.texto));if(k===assin&&!forca)return;assin=k;const sb=$(".sheet .sh-b");const perto=sb&&sb.scrollHeight-sb.scrollTop-sb.clientHeight<90;b.innerHTML=draw();if(perto)toEnd();const nn=socialOf(pid).cm.length,hh=$(".sheet .sh-h");if(hh&&hh.firstChild&&hh.firstChild.nodeType===3)hh.firstChild.textContent=nn?`Comentários (${nn})`:"Comentários"};onClose=()=>{S._reCmt=null};
  box().addEventListener("click",async e=>{const r=e.target.closest("[data-resp]");if(r){inp.value="@"+r.dataset.resp+" ";btn.disabled=false;inp.focus();return}
    const ap=e.target.closest("[data-apagar]");if(ap){if(!ap.classList.contains("conf")){ap.classList.add("conf");ap.textContent="Toque de novo para apagar";return}
      const cid=ap.dataset.apagar,au=ap.dataset.au||S.uid;CPEND[au+"\u0001"+cid]={v:null,t:Date.now()};S.cmts=montarCmts(S._cmtDocs);
      S._reCmt&&S._reCmt(true);updateSocial(pid);
      try{await gravarMapa("comentarios/"+S.uid,"itens",cid,null)}catch(err){delete CPEND[au+"\u0001"+cid];S.cmts=montarCmts(S._cmtDocs);S._reCmt&&S._reCmt(true);updateSocial(pid);toast("Não deu para apagar agora.")}}});
  $("#cform").addEventListener("submit",async e=>{e.preventDefault();const t=inp.value.trim();if(!t||precisaConta())return;inp.value="";btn.disabled=true;inp.focus();
    const cid=Date.now().toString(36)+Math.random().toString(36).slice(2,6),c={uid:S.uid,texto:t,at:Date.now()};
    const sn=snapById(pid);const v={pid,texto:t,at:c.at,snap:sn?{id:pid,titulo:sn.titulo||"",secao:sn.secao||""}:{id:pid}};
    CPEND[S.uid+"\u0001"+cid]={v,t:Date.now()};S.cmts=montarCmts(S._cmtDocs);S._reCmt&&S._reCmt(true);toEnd();updateSocial(pid);
    try{await gravarMapa("comentarios/"+S.uid,"itens",cid,v)}catch(err){delete CPEND[S.uid+"\u0001"+cid];S.cmts=montarCmts(S._cmtDocs);S._reCmt&&S._reCmt(true);updateSocial(pid);const i=$("#ctext");if(i&&!i.value){i.value=t;const b=$("#cform .sendc");if(b)b.disabled=false}toast("O comentário não foi salvo. O texto voltou para a caixa.")}});
}
function openComments(pid){
  /* 167, 156 e 067: antes de abrir */
  FD167_RESP=null;FD156_PID=pid;CMT_PID=pid;
  const r=oc204Base.apply(this,arguments);
  /* 099 */
  try{vp99Cmts()}catch(e){}
  /* 108: rascunho do comentário */
  try{rs108Poe($("#ctext"),"cm:"+pid)}catch(e){}
  /* 109: comentários pelo SQL v8 */
  try{CC8.pid=pid;if(V8.on){const f=S._reCmt;if(f)S._reCmt=function(){const x=f.apply(this,arguments);cc8Pinta();return x};cc8Pinta();if(Date.now()-CC8.t>800)cc8Carregar()}}catch(e){}
  /* 126: marca as notificações deste comentário como vistas */
  try{const id=String(pid||"");
    if(/^u:/.test(id)){const pub=id.slice(2);qb126MarcaDepois(x=>(x.pub===pub&&nt124Cat(x)==="comentarios")||String(x.k).indexOf("cc8:"+pub+"|")===0)}
    else if(id)qb126MarcaDepois(x=>(x.pid===id&&nt124Cat(x)==="comentarios")||x.cpid===id||(x.msg&&x.msg.pid===id))}catch(e){}
  /* 134: coluna de leitor */
  try{const m=/^u:(.+)$/.exec(String(pid||"")),x=m&&pubDe(m[1]);
  if(x&&cs123Col(x)){LT134.cpid=pid;const rc=S._reCmt;if(rc)S._reCmt=function(){const q=rc.apply(this,arguments);try{lt134CmDecora()}catch(e){}return q};lt134CmDecora();lt134DestCarrega(x.id)}else LT134.cpid=null}catch(e){}
  /* 156 */
  try{fd156Comentarios()}catch(e){}
  /* 19/11 (Pedro): uma linha pequena dizendo de qual notícia (ou de qual post) são os comentários */
  try{oc204Sobre(pid)}catch(e){}
  /* 167 */
  try{fd167Pend();fd167SemMencao();const i=document.getElementById("ctext");if(i&&FD167_TOQUE)i.setAttribute("enterkeyhint","enter")}catch(e){}
  return r}

/* ===== menSugere: sugestões de @menção =====
   Base no 067; remendos: 072, 081, 111, 145, 155. */
function ms204Base(i){const tk=menToken(i);if(!tk||!S.uid||!S.membro){menFecha();return}const n=norm(tk.q);const l=amigosL().filter(u=>!n||norm(nomeDe(u)).split(/\s+/).some(w=>w.startsWith(n))||norm(nomeDe(u)).startsWith(n)).slice(0,5);
  if(!l.length){menFecha();return}if(!MEN_BOX){MEN_BOX=document.createElement("div");MEN_BOX.className="men-box";MEN_BOX.setAttribute("role","listbox");document.body.appendChild(MEN_BOX)}MEN_INP=i;
  MEN_BOX.innerHTML=l.map(u=>`<button type="button" role="option" data-men="${esc(u)}">${avatar(u)}<span>${esc(nomeDe(u))}</span></button>`).join("");
  const r=i.getBoundingClientRect();MEN_BOX.style.left=Math.max(8,r.left)+"px";MEN_BOX.style.width=Math.min(innerWidth-16,Math.max(220,r.width))+"px";MEN_BOX.style.bottom=(innerHeight-r.top+6)+"px"}
function menSugere(i){
  const r=ms204Base(i);
  /* 072: sem espaço em cima, a lista abre embaixo */
  try{if(MEN_BOX&&MEN_BOX.isConnected&&MEN_INP===i){const b=MEN_BOX.getBoundingClientRect(),q=i.getBoundingClientRect();if(b.top<8){MEN_BOX.style.bottom="auto";MEN_BOX.style.top=(q.bottom+6)+"px"}else MEN_BOX.style.top=""}}catch(e){}
  /* 081: comentário de post: só quem pode ver o post */
  try{if(i&&i.id==="ctext"&&String(CMT_PID||"").indexOf("u:")===0&&MEN_BOX){const x=pubDe(String(CMT_PID).slice(2));if(x){const pode=pubPodeVer(x);MEN_BOX.querySelectorAll("[data-men]").forEach(b=>{if(!pode.has(b.dataset.men))b.remove()});if(!MEN_BOX.querySelector("[data-men]"))menFecha()}}}catch(e){}
  /* 111: hashtags */
  try{htSugere(i)}catch(e){}
  /* 145: na legenda do criar, a lista fica logo abaixo do campo */
  try{if(MEN_BOX&&MEN_BOX.isConnected&&MEN_INP===i&&i.id==="ce-leg"){MEN_BOX.classList.add("men-in145");MEN_BOX.style.left=MEN_BOX.style.top=MEN_BOX.style.bottom=MEN_BOX.style.width="";if(i.nextElementSibling!==MEN_BOX)i.insertAdjacentElement("afterend",MEN_BOX)}}catch(e){}
  /* 155 */
  try{if(MEN_BOX&&MEN_BOX.isConnected&&MEN_INP===i&&i.id==="cp152-tx"){MEN_BOX.classList.add("men-in145","cr155-men");MEN_BOX.style.left=MEN_BOX.style.top=MEN_BOX.style.bottom=MEN_BOX.style.width="";if(i.nextElementSibling!==MEN_BOX)i.insertAdjacentElement("afterend",MEN_BOX)}}catch(e){}
  return r}

/* ===== renderSecs: os círculos do topo do Feed (Em 5 min, Últimas, seções, destaques, giros dos amigos) =====
   Base no 005 (vale só na carga, como antes: o 029 desenha o topo antes dos complementos). Depois da carga vale o desenho
   do 054 (que trocou a base inteira; o 051 que vinha antes dele não chegava a rodar e saiu), com os remendos 055, 056,
   058, 060, 068, 074, 086, 093, 101, 102, 104-correcoes-stories, 107, 112 e 156, de dentro para fora.
   Continuam por fora: igPrevia (058) e RF_REAL (151) trocam renderSecs por um instante, como antes. */
function rs204Base(){
  $("#secs").innerHTML=secsStory().map(s=>{const ps=pautasDa(s.id);if(!ps.length)return "";const flags=ps.map(p=>SEEN.has(seenKey(p)));const first=ps.find(p=>!SEEN.has(seenKey(p)))||ps[0];
    const nn=flags.filter(f=>!f).length;
    return `<button type="button" class="sb" data-sec-story="${esc(s.id)}" aria-label="${esc(s.nome)}: ${ps.length} notícias${nn?", "+nn+" não vistas":""}"><span class="wrap">${ringSvg(s.id,flags)}<span class="face paper" data-sec="${esc(s.id)}">${svgOf(first.imagem)}${faceFoto(first)}</span>${nn?`<span class="ncount" style="background:${secCor(s.id)}">${nn}</span>`:""}</span><b>${esc(s.nome)}</b></button>`}).join("");
  const fl=$("#filters");fl.hidden=true;fl.innerHTML="";const bf=$("#b-filtro");if(bf)bf.setAttribute("aria-pressed",String(FILTRO!=="tudo"));
}
function renderSecs(){
  /* 21/11 (corretor): os cartões do topo também leem os números de mercado já em dia (indicadores.json), como renderPosts */
  try{if(typeof nm186EmDia==="function")nm186EmDia()}catch(e){}
  if(!FD204_PRONTA)return rs204Base.apply(this,arguments);
  /* 054: topo no estilo Instagram */
  const c054=()=>{const box=$("#secs");if(!box||!FEED)return;let h="";
  if($("#b-5min"))h+=igCirc('data-5min',"ig-5",`<span class="ig-5c"><b>5</b><small>min</small></span>`,"Em 5 min","O dia em 5 minutos");
  try{const it=tickerItens(15);if(it.length){const hr=it[0].hora?hhmm(it[0].hora):"";h+=igCirc('data-ultimas',"ig-ult",`<span class="ig-uc"><i></i><small>${esc(hr||"Agora")}</small></span>`,"Últimas","Últimas notícias")}}catch(e){}
  h+=secsStory().map(s=>{const ps=pautasDa(s.id);if(!ps.length)return "";const nn=ps.filter(p=>!SEEN.has(seenKey(p))).length;const first=ps.find(p=>!SEEN.has(seenKey(p)))||ps[0];
    return `<button type="button" class="sb ig-s" data-sec-story="${esc(s.id)}" aria-label="${esc(s.nome)}: ${ps.length} notícias${nn?", "+nn+" não vistas":""}"><span class="ig-r${nn?"":" visto"}" style="--c:${secCor(s.id)}"><span class="ig-f paper" data-sec="${esc(s.id)}">${igFace(first)}</span></span><b>${esc(s.nome)}</b></button>`}).join("");
  try{const {H,P}=igAgendaItens();if(H.length||P.length){const d=new Date(hojeSP()+"T12:00:00Z");const wd=d.toLocaleDateString("pt-BR",{weekday:"short",timeZone:"UTC"}).replace(".","");
    h+=igCirc('data-igagenda',"ig-ag"+(H.length?"":" visto"),`<span class="ig-agc"><small>${esc(wd)}</small><b>${d.getUTCDate()}</b></span>`,"Agenda",`Agenda: ${H.length} hoje, ${P.length} nos próximos dias`)}}catch(e){}
  box.innerHTML=h;box.classList.add("ig");
  const fl=$("#filters");if(fl){fl.hidden=true;fl.innerHTML=""}const bf=$("#b-filtro");if(bf)bf.setAttribute("aria-pressed",String(FILTRO!=="tudo"))};
  /* 055: Em 5 min e Últimas ficam "vistos" */
  const c055=()=>{const r=c054();try{
  const c=$("#secs [data-5min] .ig-r");if(c)c.classList.toggle("visto",!ordenadas(visiveis()).some(p=>!lidaAtual(p)));
  const u=$("#secs [data-ultimas] .ig-r");if(u)u.classList.toggle("visto",tickerItens(15).every(i=>ULT_VISTOS.has(ultKey(i))));
  }catch(e){}return r};
  /* 056: Agenda logo depois do Em 5 min; a rolagem dos círculos fica onde estava */
  const c056=()=>{const box=$("#secs");const x=box?box.scrollLeft:0;const r=c055();if(!box)return r;
  try{const ag=box.querySelector("[data-igagenda]"),c5=box.querySelector("[data-5min]");if(ag){if(c5)c5.after(ag);else box.prepend(ag);ag.querySelector(".ig-r")?.classList.toggle("visto",agPaginas().every(p=>AG_VISTOS.has(p.chave)))}}catch(e){}
  box.scrollLeft=x;return r};
  /* 058: destaques no fim */
  const c058=()=>{const r=c056();const box=$("#secs");if(!box||!FEED)return r;
  try{box.querySelectorAll(".ig-div,[data-dest]").forEach(x=>x.remove());const ds=destaques();if(ds.length){const x=box.scrollLeft;
    box.insertAdjacentHTML("beforeend",`<span class="ig-div" aria-hidden="true"></span>`+ds.map(p=>{const f=fotoDe(p);return `<button type="button" class="sb ig-s ig-dest" data-dest="${esc(p.id)}" aria-label="Destaque: ${esc(temaDe(p)||capaChapeu(p))}"><span class="ig-r dest${DEST_VISTOS.has(destChave(p))?" visto":""}"><span class="ig-f paper" data-sec="${esc(secOf(p))}">${f?`<img src="${escU(fotoMini(f.url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`:svgOf(p.imagem)}</span></span><b>${esc(destNome(p))}</b></button>`}).join(""));box.scrollLeft=x}}catch(e){}return r};
  /* 060: com um story aberto, o topo fica para depois (RS_PEND; o closeLayer do 201 redesenha) */
  const c060=()=>{if($("#layer .story")){RS_PEND=true;return}RS_PEND=false;return c058()};
  /* 068: Seu giro e os giros dos amigos no começo */
  const c068=()=>{const r=c060();const box=$("#secs");if(!box||$("#layer .story")||!box.classList.contains("ig"))return r;
  try{box.querySelectorAll("[data-meustory],[data-ustory]").forEach(x=>x.remove());if(!(S.uid&&S.membro&&PUB.on!==false))return r;const x0=box.scrollLeft;
    const meus=pubStoriesDe(S.uid),av=u=>`<span class="ig-f up-avf">${avatar(u)}</span>`;
    let h=`<button type="button" class="sb ig-s" data-meustory aria-label="${meus.length?"Seu giro":"Criar giro"}"><span class="ig-r${meus.length?(meus.every(x=>PUB_VISTOS.has(x.id))?" visto":""):" sem"}">${av(S.uid)}</span><i class="up-mais" data-criarde="story" role="button" aria-label="Criar giro">+</i><b>Seu giro</b></button>`;
    h+=pubAutoresStory().map(a=>`<button type="button" class="sb ig-s" data-ustory="${esc(a.u)}" aria-label="Giro de ${esc(nomeDe(a.u))}"><span class="ig-r${a.novo?"":" visto"}" style="--c:${corDe(a.u)}">${av(a.u)}</span><b>${esc(String(nomeDe(a.u)).split(" ")[0])}</b></button>`).join("");
    box.insertAdjacentHTML("afterbegin",h);box.scrollLeft=x0}catch(e){}return r};
  /* 074: anel dos Melhores amigos */
  const c074=()=>{const r=c068();try{document.querySelectorAll("#secs [data-ustory],#secs [data-meustory]").forEach(b=>{const u=b.dataset.ustory||S.uid;const xs=pubStoriesDe(u);const ult=xs[xs.length-1];
  b.querySelector(".ig-r")?.classList.toggle("ma",!!ult&&ult.publico==="proximos")})}catch(e){}return r};
  /* 086: Sua semana */
  const c086=()=>{const r=c074();try{const box=$("#secs");if(!box||!FEED||box.querySelector("[data-semana]")||!S.uid||!S.membro||!semMostra())return r;
  const n=semDados().l.length;let vis=false;try{vis=localStorage.getItem("prumo-sem-visto")===semChave()}catch(e){}
  const h=igCirc('data-semana',"ig-sem"+(vis?" visto":""),`<span class="ig-semc"><b>${n}</b><small>lidas</small></span>`,"Sua semana","Resumo da sua semana");
  const c5=box.querySelector("[data-5min]");if(c5)c5.insertAdjacentHTML("afterend",h);else box.insertAdjacentHTML("afterbegin",h)}catch(e){}return r};
  /* 093: fila de publicação */
  const c093=()=>{const r=c086();try{if(PQ.jobs.length){pqBox();pqAtualiza()}}catch(e){}return r};
  /* 101: Agenda e Sua semana saem do topo */
  const c101=()=>{const r=c093();
  try{const box=$("#secs");if(box)box.querySelectorAll("[data-igagenda],[data-semana]").forEach(b=>{const sb=b.closest(".sb")||b;sb.remove()})}catch(e){}return r};
  /* 102: barra de publicar */
  const c102=()=>{const r=c101();try{cn102Barra()}catch(e){}return r};
  /* 104 */
  const c104=()=>{const r=c102();try{document.querySelectorAll("#secs [data-ustory]").forEach(b=>{const xs=pubStoriesDe(b.dataset.ustory);
  if(xs.some(x=>x.publico==="proximos"&&!PUB_VISTOS.has(x.id)))b.querySelector(".ig-r")?.classList.add("ma")})}catch(e){}return r};
  /* 107 */
  const c107=()=>{const r=c104();try{fc107Tray()}catch(e){}return r};
  /* 112 */
  const c112=()=>{const r=c107();try{vn112Tiles()}catch(e){console.error(e)}return r};
  /* 156 */
  const r=c112();fd156Rotulos();return r}

/* ===== stories do topo do Feed (círculos de notícia, Em 5 min, Últimas, Agenda, destaques, giros dos amigos) =====
   Só o que o topo do Feed abre; criar giro continua onde estava. */
/* igLista: as páginas de um círculo. Base no 055; remendos: 056, 058 (2×), 068, 086. */
function il204Base(sec){
  if(sec==="_5min"){const ps=cincoLista();return {ps,itens:null}}
  if(sec==="_ult"){const it=tickerItens(15).filter(i=>pautaById(i.pid));return {ps:it.map(i=>pautaById(i.pid)),itens:it}}
  return {ps:pautasDa(sec),itens:null}}
function igLista(sec){
  /* 086: Sua semana */
  if(sec==="_sem"){const fr=semFrames();return {ps:fr,itens:fr}}
  /* 068: giro de um membro */
  if(String(sec).indexOf("_u:")===0){const fr=pubStoriesDe(sec.slice(3));return {ps:fr,itens:fr}}
  /* 058: destaque (capa e marcos) */
  if(String(sec).indexOf("_h:")===0){const p=pautaById(sec.slice(3));if(!p)return {ps:[],itens:[]};const m=destMarcos(p)||[];
  const fr=[{id:"h0",tipo:"capa",p,n:m.length}].concat(m.map((x,k)=>({id:"h"+(k+1),tipo:"marco",p,m:x,k,n:m.length})));return {ps:fr,itens:fr}}
  /* 056: Agenda; base */
  const r=(()=>{if(sec==="_ag"){const pg=agPaginas();return {ps:pg,itens:pg}}return il204Base(sec)})();
  /* 058: telas de gráfico no meio das notícias */
  if(sec==="_ult"||sec==="_ag"||String(sec).indexOf("_h:")===0)return r;return {ps:igComVis(r.ps),itens:r.itens}}

/* igNomeSt: o nome no alto do story. Base no 055; remendos: 056, 058, 068, 084, 086. */
function in204Base(sec){return sec==="_5min"?"Em 5 min":sec==="_ult"?"Últimas":secNome(sec)}
function igNomeSt(sec){
  /* 086 */ if(sec==="_sem")return "Sua semana";
  /* 084: destaque de giro */ if(String(sec).indexOf("_u:~")===0)return (ST&&ST._nome)||"Giro";
  /* 068 */ if(String(sec).indexOf("_u:")===0){const u=sec.slice(3);return u===S.uid?"Seu giro":nomeDe(u)}
  /* 058 */ if(String(sec).indexOf("_h:")===0){const p=pautaById(sec.slice(3));return p?temaDe(p)||capaChapeu(p):"Destaque"}
  /* 056 */ return sec==="_ag"?"Agenda":in204Base(sec)}

/* storyOrdem: a ordem dos círculos ao passar de um para o outro. A base do 007 e a troca do 055 foram trocadas pela do 056
   (que é a que vale aqui); remendos: 058, 068, 080, 084, 086, 104-correcoes-stories (2×). */
function storyOrdem(){
  /* 056: Em 5 min, Agenda, Últimas e as seções */
  const c056=()=>{const base=(ST&&ST.ordem&&ST.ordem.length?ST.ordem:secsStory().map(s=>s.id)).filter(id=>pautasDa(id).length);
  const v=[];if(cincoLista().length)v.push("_5min");if(agPaginas().length)v.push("_ag");try{if(tickerItens(15).length)v.push("_ult")}catch(e){}return v.concat(base)};
  /* 058: destaque aberto sozinho */
  const c058=()=>{if(ST&&ST.sec&&String(ST.sec).indexOf("_h:")===0)return [ST.sec];return c056()};
  /* 068: giros primeiro */
  const c068=()=>{const L=c058();if(ST&&String(ST.sec||"").indexOf("_h:")===0)return L;if(!(S.uid&&S.membro&&PUB.on))return L;
  const us=(pubStoriesDe(S.uid).length?["_u:"+S.uid]:[]).concat(pubAutoresStory().map(a=>"_u:"+a.u));return us.concat(L.filter(x=>String(x).indexOf("_u:")!==0))};
  /* 080: a ordem dos giros fica a da abertura */
  const c080=()=>{const L=c068();if(!ST||String(ST.sec||"").indexOf("_h:")===0)return L;if(!ST._uord)ST._uord=L.filter(x=>String(x).indexOf("_u:")===0);
  const vivos=ST._uord.filter(x=>x===ST.sec||(pubStoriesDe(String(x).slice(3)).length>0));return vivos.concat(L.filter(x=>String(x).indexOf("_u:")!==0))};
  /* 084: destaque de giro aberto sozinho */
  const c084=()=>{if(ST&&String(ST.sec||"").indexOf("_u:~")===0)return [ST.sec];return c080()};
  /* 086: Sua semana sozinha */
  const c086=()=>{if(ST&&ST.sec==="_sem")return ["_sem"];return c084()};
  /* 104: giros na ordem dos círculos do topo */
  const c104=()=>{const novo=!!(ST&&!ST._uord);const L=c086();
  try{if(novo&&ST&&ST._uord&&String(ST.sec||"").indexOf("_u:")===0&&String(ST.sec).indexOf("_u:~")!==0){
    const tr=[...document.querySelectorAll("#secs [data-ustory]")].map(b=>"_u:"+b.dataset.ustory);
    if(tr.includes(ST.sec)){const pos=x=>{const k=tr.indexOf(x);return k<0?1e3:k};const u=ST._uord.slice().sort((a,b)=>pos(a)-pos(b));
      if(ST._uord[0]==="_u:"+S.uid&&u[0]!==ST._uord[0]){u.splice(u.indexOf(ST._uord[0]),1);u.unshift(ST._uord[0])}
      ST._uord=u;return c086()}}}catch(e){}return L};
  /* 104: Em 5 min e Agenda juntos */
  const L=c104();
  try{if(SS104_GRUPO&&ST&&L.includes("_5min")&&L.includes("_ag")&&typeof bt101Cinco==="function"&&bt101Cinco())return L.filter(x=>x!==(ST.sec==="_ag"?"_5min":"_ag"))}catch(e){}return L}

/* drawStory: desenha a página do story. A base do 007 e a troca do 054 foram trocadas pela do 055 (a que vale aqui);
   remendos: 056, 058, 068, 086, 098, 101. */
function drawStory(anim){
  /* 055: notícia (também Em 5 min e Últimas) */
  const c055=()=>{
  const ps=stPs(),p=ps[ST.i];if(!p)return closeLayer();clearTimeout(ST.timer);const vazioS=!$("#layer").innerHTML;
  SEEN.add(seenKey(p));lsSet("radar-vistos",[...SEEN].slice(-400));marcarLida(p.id);
  const vsec=ST.sec,virt=vsec==="_5min"||vsec==="_ult",it=vsec==="_ult"&&ST.itens?ST.itens[ST.i]:null;
  if(it){ULT_VISTOS.add(ultKey(it));try{localStorage.setItem("prumo-ult-vistos",JSON.stringify([...ULT_VISTOS].slice(-200)))}catch(e){}}
  const L=lente(),v=versao(p,L),psec=secOf(p),cor=secCor(psec),f=fotoDe(p);
  const tit=it&&it.txt?it.txt:v.titulo;
  let lin=igLinhas(p,L);if(it){lin=lin.filter(t=>norm(t)!==norm(tit));lin=lin.slice(0,3)}
  let num=null;
  const linHTML=lin.map((t0,k)=>{let t=t0;if(k===0&&!it){const n=ssNumero(t0);if(n&&t0.indexOf(n)===0){let r=t0.slice(n.length).replace(/^\s*:?\s*/,"");if(r.length>8){num=n;t=r.charAt(0).toUpperCase()+r.slice(1)}}}return `<li>${esc(t)}</li>`}).join("");
  const hr=it?it.hora:(ultimaAtualizacao(p)||p.hora);
  const sub=vsec==="_5min"?"":it?(hr&&hhmm(hr)?(dataSP(hr)===hojeSP()?"às "+hhmm(hr):horaDia(hr)):""):(hr?quando(hr):"");
  const kick=it?(it.tag==="Nova"||it.tag==="Atualizada"?`${it.tag} · ${secNome(psec)}`:secNome(psec)):vsec==="_5min"?`${secNome(psec)} · ${capaChapeu(p)}`:capaChapeu(p);
  const av=vsec==="_5min"?`<span class="ph-av sg-av sg-av5"><i>5</i></span>`:vsec==="_ult"?`<span class="ph-av sg-av sg-avu"><b></b></span>`:`<span class="ph-av sg-av" style="--c:${cor}"><i>${esc(secNome(vsec).charAt(0))}</i></span>`;
  ST.palavras=(tit+" "+lin.join(" ")).split(/\s+/).length;
  $("#layer").innerHTML=`<div class="story sg${f?" com-foto":""}${virt?" sg-v":""}" data-sec="${esc(virt?psec:vsec)}" style="--c:${cor}" role="dialog" aria-modal="true" aria-label="${esc(igNomeSt(vsec))}"><div class="story-in">
    <div class="sg-bg paper" data-sec="${esc(psec)}">${f?`<img src="${escU(fotoSrc(f.url))}" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.story').classList.remove('com-foto');this.remove()">`:`<div class="sg-art">${svgOf(p.imagem)}</div>`}</div>
    <div class="sg-sh"></div>
    <div class="bars">${ps.map((_,k)=>`<i class="${k<ST.i||(k===ST.i&&!PREF.storyAuto)?"on":""}">${k===ST.i&&PREF.storyAuto?"<b></b>":""}</i>`).join("")}</div>
    <div class="s-h">${av}<span class="sg-who"><b>${esc(igNomeSt(vsec))}</b>${sub?`<span>${esc(sub)}</span>`:""}</span><span class="s-hb"><button type="button" data-sauto aria-pressed="${!!PREF.storyAuto}" aria-label="${PREF.storyAuto?"Parar de passar sozinho":"Passar sozinho"}">${PREF.storyAuto?'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>'}</button><button type="button" data-close aria-label="Fechar">${ICON.close}</button></span></div>
    <button type="button" class="tap l" data-sgo="-1" aria-label="Anterior"></button><button type="button" class="tap r" data-sgo="1" aria-label="Próxima"></button>
    <div class="sg-body"><span class="sg-k">${esc(kick)}</span><h2>${esc(tit)}</h2>${num?`<b class="sg-n">${esc(num)}</b>`:""}${linHTML?`<ul class="sg-l">${linHTML}</ul>`:""}${f?credHTML(f.credito||"Foto de arquivo","sg-cr"):""}</div>
    <div class="s-f sg-f" id="s-acts" data-pid="${esc(p.id)}">${storyActs(p.id)}</div>
  </div></div>`;
  igWire($("#layer .story"));if(vazioS&&pushH())HST++;storyAuto(p);
  const si=$("#layer .story-in");if(anim&&si){si.classList.add(anim);si.addEventListener("animationend",()=>{si.classList.remove(anim);$("#layer .story")?.classList.remove("flipping")},{once:true});$("#layer .story").classList.add("flipping")}
  igCaber();renderSecs()};
  /* 056: Agenda; animação de entrada */
  const c056=()=>{if(ST&&ST.sec==="_ag"){clearTimeout(ST.timer);return igDrawAgenda(anim)}const r=c055();igEntra();return r};
  /* 058: destaque e telas de gráfico; rodapé e pré-carga */
  const c058=()=>{if(ST&&String(ST.sec||"").indexOf("_h:")===0){clearTimeout(ST.timer);igDrawDest();igRodape();igPreCarrega();return}
  if(ST&&ST.sec!=="_ag"){const p=stPs()[ST.i];if(p&&p.__vis){clearTimeout(ST.timer);igDrawVis(p);igRodape();igPreCarrega();return}}
  const r=c056();igRodape();igPreCarrega();return r};
  /* 068: giro de membro */
  const c068=()=>{if(ST&&String(ST.sec||"").indexOf("_u:")===0){clearTimeout(ST.timer);return igDrawUser()}return c058()};
  /* 086: Sua semana */
  const c086=()=>{if(ST&&ST.sec==="_sem"){clearTimeout(ST.timer);semDraw();return}return c068()};
  /* 098: cabeçalho */
  const c098=()=>{const r=c086();try{vs98Cabecalho()}catch(e){}return r};
  /* 101: barras do Em 5 min com a Agenda */
  const r=c098();
  try{if(ST&&ST.sec==="_5min"){const n=agPaginas().length,b=$("#layer .story .bars");if(n&&b&&!b.querySelector(".bt101"))b.insertAdjacentHTML("beforeend",Array.from({length:n},()=>`<i class="bt101"></i>`).join(""))}
    else if(ST&&ST.sec==="_ag"&&bt101Cinco()){/* Agenda dentro do "Em 5 min": mesmo nome, mesmas barras */
      const st=$("#layer .story.sg-ag");if(st){const n5=bt101N5(),b=st.querySelector(".bars");if(b&&n5)b.insertAdjacentHTML("afterbegin",Array.from({length:n5},()=>`<i class="on bt101"></i>`).join(""));
        const w=st.querySelector(".sg-who b");if(w)w.textContent="Em 5 min";const s=st.querySelector(".sg-who span");if(s)s.textContent="Agenda · "+s.textContent;
        const av=st.querySelector(".sg-avag");if(av){av.className="ph-av sg-av sg-av5";av.innerHTML="<i>5</i>"}
        const nn=st.querySelector(".sga-n");if(nn)nn.textContent="";}}}catch(e){}return r}

/* storyAuto: o story passa sozinho (tempo pela quantidade de palavras; segurar o dedo pausa). A base do 029 era trocada
   inteira pela do 054 (que não chamava a anterior) e saiu; remendos: 058 (pausa enquanto digita um comentário) e 080
   (vídeo de giro: o tempo é o do vídeo). O 077 também tratava vídeo, mas o 080 o chamava já sem o vídeo (ST.sec="__v"):
   aquele ramo nunca rodava e saiu. */
function storyAuto(p){
  /* 054 */
  const c054=()=>{const w=ST.palavras||20;const dur=Math.max(6000,Math.min(16000,1500+w/3.4*1000));
  clearTimeout(ST.timer);if(!PREF.storyAuto)return;const fill=$("#layer .bars b");if(fill)fill.style.animationDuration=dur+"ms";ST.fim=Date.now()+dur;ST.resto=dur;ST.timer=setTimeout(()=>storyGo(1),dur);
  const el=$("#layer .story");if(!el||el._auto)return;el._auto=true;
  el.addEventListener("pointerdown",ev=>{if(ev.target.closest(".s-f,.s-h,.us-it"))return;if(!PREF.storyAuto||!ST.timer)return;clearTimeout(ST.timer);ST.timer=0;ST.resto=Math.max(800,ST.fim-Date.now());const f=$("#layer .bars b");if(f)f.style.animationPlayState="paused"});
  const volta=()=>{if(!PREF.storyAuto||ST.timer||!$("#layer .story")||$("#layer2").innerHTML)return;ST.fim=Date.now()+ST.resto;ST.timer=setTimeout(()=>storyGo(1),ST.resto);const f=$("#layer .bars b");if(f)f.style.animationPlayState="running"};
  el.addEventListener("pointerup",volta);el.addEventListener("pointercancel",volta)};
  /* 058 */
  const c058=()=>{const r=c054();if(IG_DIG)igPausa();return r};
  /* 080: vídeo de giro */
  const x=ST.itens&&ST.itens[ST.i];const vid=x&&x.estilo&&x.estilo.video&&String(ST.sec||"").indexOf("_u:")===0;
  if(!vid)return c058();const pal=ST.palavras,sec=ST.sec;ST.palavras=1;ST.sec="__v";let r;try{r=c058()}finally{ST.palavras=pal;ST.sec=sec}
  const dur=Math.max(2000,Math.min(31000,(+x.estilo.dur||8)*1000+250));clearTimeout(ST.timer);ST.timer=0;if(!PREF.storyAuto)return r;const fill=$("#layer .bars b");if(fill)fill.style.animationDuration=dur+"ms";ST.fim=Date.now()+dur;ST.resto=dur;ST.timer=setTimeout(()=>storyGo(1),dur);return r}
