/* ---------- 156: cartão de notícia do Feed enxuto e acertos do Feed (15/11, pedido do Pedro: "deixar clean as notícias do feed") ----------
   Continua o 153. O cartão de notícia fica: editoria (e subtema) no topo, título, foto/carrossel, ações e uma linha da
   cobertura. Sai o rótulo de assunto em cima da foto (o "STF ›"), o contador "1/5" dentro do carrossel, a tela que só tinha
   a fonte do gráfico (a fonte vai para o pé do gráfico) e o resumo repetido na última tela; a barra de ações perde os "·"
   soltos; Guardar usa o mesmo marcador em todo o app; a curtida aparece de um jeito só (a linha "Ana gostou" embaixo das
   ações; o número some quando a linha já diz quem gostou); a cobertura nunca se chama "Anúncio"/"Patrocinado"/"Publicidade".
   Também: círculos do topo sem repetir a notícia de Últimas/1º cartão, "1 notícia, 1 não vista", "Mais recentes" na ordem
   da hora mostrada e folha que fecha, próximo lote carregado antes do fim (e rodapé só no fim), Em 5 min sem repetir o
   título, comentários (cursor no campo, campo que volta com a altura certa, texto de ajuda curto em tela estreita,
   respostas agrupadas) e avisos de "Sem conexão" com Gostei que é reenviado quando a internet volta. Prefixo fd156. */

/* ---- texto igual ao título (ignora artigo no começo, acentos e pontuação) ---- */
function fd156Norm(s){return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/^(a|o|as|os|um|uma) /,"")}
function fd156IgualTitulo(t,tit){const a=fd156Norm(t),b=fd156Norm(tit);return !!a&&!!b&&a===b}

/* ---- nome de cobertura que parece propaganda: usa o subtema (ou o tema) ---- */
var FD156_ANUNCIO=/^\s*(an[uú]ncio|anunciante|patrocinad[oa]s?|patroc[ií]nio|publicidade|publi|propaganda|publieditorial|informe publicit[aá]rio|conte[uú]do (pago|patrocinado)|ad|ads|sponsored)\s*$/i;
function fd156NomeCob(p){const et=cobEtapaAtual(p)||"";if(!et)return "";if(!FD156_ANUNCIO.test(et))return et;
  const sub=/^Outros/.test(p.subtema||"")?(p.tag||""):(p.subtema||p.tag||"");if(sub&&!FD156_ANUNCIO.test(sub))return sub;return secNome(secOf(p))}
{const _cb156=cobBarra;cobBarra=function(p){const h=_cb156.apply(this,arguments);if(!h||!p)return h;try{const nm=fd156NomeCob(p);
  return h.replace(/<span class="cb-t">[\s\S]*?<\/span>/,`<span class="cb-t"><b>Cobertura completa</b>${nm?" · "+esc(nm):""}</span>`)}catch(e){return h}}}

/* ---- Guardar: um ícone só (o marcador de livro dos posts) ---- */
try{if(typeof VP99_BM==="string")ICON.save=VP99_BM.replace(' aria-hidden="true"',"")}catch(e){}

/* ---- frases do carrossel e do Em 5 min: sem a que só repete o título ---- */
{const _fs156=ssFrasesSociais;ssFrasesSociais=function(p,L){const r=_fs156.apply(this,arguments);try{if(!Array.isArray(r)||r.length<2)return r;const tit=versao(p,L).titulo||"";
  const f=r.filter(t=>!fd156IgualTitulo(t,tit));return f.length?f:r}catch(e){return r}}}
{const _il156=igLinhas;igLinhas=function(p,L){const r=_il156.apply(this,arguments);try{const tit=versao(p,L).titulo||"";return r.filter(t=>!fd156IgualTitulo(t,tit))}catch(e){return r}}}

/* ---- carrossel: a tela que só tinha a fonte vira o pé do gráfico anterior; pontinhos do total real ---- */
function fd156SoFonte(sl){if(!sl||!sl.classList.contains("pag"))return false;const hs=[...sl.querySelectorAll(".hint")];if(!hs.length)return false;
  const k=sl.cloneNode(true);k.querySelectorAll(".hint,.lbl").forEach(x=>x.remove());return !k.textContent.trim()&&!k.querySelector("svg,img,canvas,table,li")}
function fd156Pontos(t){const post=t.closest(".post");const d=post&&post.querySelector(".pdots");if(!d)return;const k=t.children.length;
  if(k<2){d.remove();return}const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth));
  d.innerHTML=Array.from({length:k},(_,j)=>`<i class="${j<=i?"on":""}"></i>`).join("")+`<span class="pg">${Math.min(i+1,k)}/${k}</span>`;try{pgDots(t)}catch(e){}}
function fd156Track(t){try{if(!t||!t.closest(".post.vn-cn"))return;let mudou=false;
  [...t.children].forEach(sl=>{if(!fd156SoFonte(sl))return;const ant=sl.previousElementSibling;
    if(ant){ant.classList.add("fd156-cf");sl.querySelectorAll(".hint").forEach(h=>{if(!ant.querySelector(".fd156-fonte")){h.classList.add("fd156-fonte");ant.appendChild(h)}})}
    sl.remove();mudou=true});
  if(mudou){fd156Pontos(t);const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth)),s0=t.children[Math.min(i,t.children.length-1)];if(s0&&s0.offsetHeight)t.style.height=s0.offsetHeight+"px"}}catch(e){}}
/* antes de paginar: num gráfico com selo (ex.: "Aprovado"), a fonte vai para a linha do selo e não ocupa altura a mais */
function fd156FonteNoSelo(t){try{if(!t||!t.closest(".post.vn-cn"))return;t.querySelectorAll(".acv").forEach(g=>{const r=g.querySelector(":scope>.acv-res"),h=g.querySelector(":scope>.hint:last-child");
  if(r&&h&&/^Fonte/i.test(h.textContent.trim())){const w=document.createElement("span");w.className="fd156-selo";r.before(w);w.appendChild(r);h.classList.add("fd156-fsel");w.appendChild(h)}})}catch(e){}}
{const _pt156=paginarTrack;paginarTrack=function(t){fd156FonteNoSelo(t);const r=_pt156.apply(this,arguments);fd156Track(t);return r}}

/* ---- topo do cartão: o subtema corta com reticências e a hora fica sempre à vista (não passa por baixo do "•••") ---- */
function fd156Cartao(el){try{if(!el||el.dataset.fd156)return;el.dataset.fd156="1";const sub=el.querySelector(":scope>.ph .ph-sub");
  if(sub&&!sub.querySelector(".fd156-st")){const ns=[];for(const n of [...sub.childNodes]){if(n.nodeType===1&&n.classList.contains("vn-hr"))break;ns.push(n)}
    if(ns.length&&ns.some(n=>(n.textContent||"").trim())){const s=document.createElement("span");s.className="fd156-st";sub.insertBefore(s,ns[0]);ns.forEach(n=>s.appendChild(n));sub.classList.add("fd156-sub")}}}catch(e){}}
{const _wt156=wireTracks;wireTracks=function(root){const r=_wt156.apply(this,arguments);try{if(root){const ls=root.matches&&root.matches(".post.vn-cn")?[root]:[...root.querySelectorAll(".post.vn-cn")];ls.forEach(fd156Cartao)}}catch(e){}return r}}

/* ---- curtidas: um jeito só. Amigos: a linha embaixo das ações diz quem gostou (sem o número); só você: só o número ---- */
function fd156Curtidas(pid){try{const el=document.getElementById("p-"+pid);if(!el||!el.classList.contains("vn-c"))return;const lk=el.querySelector("[data-likes]");
  let soEu=false;try{const l=socialOf(pid).likes;soEu=!!S.uid&&l.length===1&&l[0]===S.uid}catch(e){}
  /* só você gostou: fica só o número ao lado do losango (sem a linha "Você gostou"); amigos gostaram: só a linha com o nome */
  el.classList.toggle("fd156-eu",soEu);el.classList.toggle("fd156-lk",!soEu&&!!(lk&&lk.textContent.trim()))}catch(e){}}
{const _us156=updateSocial;updateSocial=function(pid){const r=_us156.apply(this,arguments);fd156Curtidas(pid);return r}}
if(typeof vn112Social==="function"){const _vs156=vn112Social;vn112Social=function(pid){const r=_vs156.apply(this,arguments);fd156Curtidas(pid);return r}}

/* ---- círculos do topo: a editoria não repete a notícia de Últimas nem a do 1º cartão do Feed; "1 notícia, 1 não vista" ---- */
var FD156_EXCL=null;
function fd156Id(id){return String(id||"").split("#")[0]}
{const _vp156=vn112Primeira;vn112Primeira=function(sec){const r=_vp156.apply(this,arguments);try{
  if(!FD156_EXCL||!sec||sec[0]==="_"||!r||!r.p||!FD156_EXCL.has(fd156Id(r.p.id)))return r;
  const ps=(igLista(sec).ps||[]).filter(p=>!FD156_EXCL.has(fd156Id(p.id)));const p=ps.find(p=>!SEEN.has(seenKey(p)))||ps[0];
  if(p){FD156_EXCL.add(fd156Id(p.id));return {p,t:versao(p,lente()).titulo}}}catch(e){}return r}}
{const _tl156=vn112Tiles;vn112Tiles=function(){FD156_EXCL=new Set();try{const u=_vp156Ult();if(u)FD156_EXCL.add(fd156Id(u));if(VIEW==="feed"||!document.getElementById("v-feed")?.hidden){const l=(LOTE&&LOTE.lista&&LOTE.lista.length?LOTE.lista:listaFeed())||[];const f=l.find(x=>x&&x.id&&pautaById(x.id));if(f)FD156_EXCL.add(fd156Id(f.id))}}catch(e){}
  try{return _tl156.apply(this,arguments)}finally{FD156_EXCL=null}}}
function _vp156Ult(){try{const r=igLista("_ult");const i=r.itens.find(x=>!ULT_VISTOS.has(ultKey(x)))||r.itens[0];return i&&i.pid}catch(e){return null}}
function fd156Rotulos(){try{document.querySelectorAll("#secs [data-sec-story][aria-label]").forEach(b=>{const a=b.getAttribute("aria-label");
  const n=a.replace(/\b1 notícias\b/,"1 notícia").replace(/\b1 não vistas\b/,"1 não vista");if(n!==a)b.setAttribute("aria-label",n)})}catch(e){}}
{const _rs156=renderSecs;renderSecs=function(){const r=_rs156.apply(this,arguments);fd156Rotulos();return r}}

/* ---- "Mais recentes": a mesma hora que o cartão mostra (atualização mais recente ou publicação), da mais nova para a mais velha ---- */
function fd156Hora(p){try{return tms(ultimaAtualizacao(p)||p.hora)||0}catch(e){return 0}}
{const _lf156=listaFeed;listaFeed=function(){const l=_lf156.apply(this,arguments);try{if(PREF.feedModo==="recentes"&&Array.isArray(l)&&(FILTRO==="tudo"||FILTRO==="_gostou"))
  return l.map((p,i)=>({p,i,h:fd156Hora(p)})).sort((a,b)=>(b.h-a.h)||(a.i-b.i)).map(x=>x.p)}catch(e){}return l}}
/* escolher a ordem fecha a folha "Filtrar o feed", como já acontece ao tocar numa editoria */
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("#layer [data-fmodo]");if(!b)return;setTimeout(()=>{try{if(document.querySelector("#layer .sheet"))closeLayer()}catch(_){}},180)});

/* ---- rolar rápido: o próximo lote vem bem antes do fim; esqueleto no lugar do "Carregando…"; Outras notícias e rodapé só no fim ---- */
var FD156_IO=("IntersectionObserver" in window)?new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))try{carregarMais()}catch(_){}},{rootMargin:"0px 0px 2200px 0px"}):null;
function fd156Mais(){try{const m=document.getElementById("mais"),ex=document.getElementById("extra");if(ex)ex.classList.toggle("fd156-espera",!!m);
  if(m&&!m.dataset.fd156){m.dataset.fd156="1";m.classList.add("fd156-mais");m.setAttribute("role","status");m.setAttribute("aria-label","Carregando mais notícias…");
    m.innerHTML=`<span class="fd156-vh">Carregando mais notícias…</span><div class="fd156-sk" aria-hidden="true"><i class="a"></i><i class="b"></i><i class="c"></i></div>`;if(FD156_IO)FD156_IO.observe(m)}}catch(e){}}
{const _rp156=renderPosts;renderPosts=function(){const r=_rp156.apply(this,arguments);fd156Mais();return r}}
{const _cm156=carregarMais;carregarMais=function(){const r=_cm156.apply(this,arguments);fd156Mais();return r}}
lt148Emenda=function(){if(lt148Emenda.t)return;lt148Emenda.t=1;
  requestAnimationFrame(()=>setTimeout(()=>{lt148Emenda.t=0;const m=document.getElementById("mais");if(!m)return;const v=document.getElementById("v-feed");if(v&&v.hidden)return;
    try{if(m.getBoundingClientRect().top<innerHeight*3+600)carregarMais()}catch(e){}},0))};

/* ---- comentários ---- */
var FD156_FOCO=0;
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest('.acts [data-a="cmt"],.addc,.sg-a[data-a="cmt"]');if(b)FD156_FOCO=Date.now()},true);
function fd156Agrupa(){try{const ul=document.querySelector("#cbox .clist");if(!ul||ul._fd156)return;ul._fd156=1;
  const lis=[...ul.children].filter(x=>x.tagName==="LI");const ultimo={};/* nome -> último li de topo desse nome */const fimDe=new Map();
  lis.forEach(li=>{const sp=li.querySelector(":scope>div>span");const b=sp&&sp.querySelector("b");if(!sp||!b)return;const nm=b.textContent.trim();
    const tx=sp.textContent.slice(b.textContent.length).replace(/^\s+/,"");const m=/^@(.+?)\s/.exec(tx+" ");let alvo=null,quem="";
    if(m){const cands=Object.keys(ultimo).filter(n=>(m[1]+" "+tx.slice(m[0].length)).indexOf(n)===0||n===m[1]).sort((a,c)=>c.length-a.length);if(cands.length){quem=cands[0];alvo=ultimo[quem]}}
    if(alvo&&alvo!==li){const fim=fimDe.get(alvo)||alvo;fim.after(li);fimDe.set(alvo,li);li.classList.add("fd156-resp");
      if(!li.querySelector(".fd156-rt")){const i=li.querySelector(":scope>div");if(i)i.insertAdjacentHTML("afterbegin",`<small class="fd156-rt">respondendo a ${esc(quem)}</small>`)}}
    else{ultimo[nm]=li}})}catch(e){}}
function fd156Comentarios(){const inp=document.getElementById("ctext");if(!inp)return;
  try{if(innerWidth<360&&/^Escreva um comentário/.test(inp.getAttribute("placeholder")||""))inp.setAttribute("placeholder","Comentar…")}catch(e){}
  if(Date.now()-FD156_FOCO<2000){FD156_FOCO=0;try{inp.focus({preventScroll:true})}catch(e){try{inp.focus()}catch(_){}}}
  fd156Agrupa();const box=document.getElementById("cbox");
  if(box&&!box._fd156&&"MutationObserver" in window){box._fd156=new MutationObserver(()=>fd156Agrupa());box._fd156.observe(box,{childList:true,subtree:true})}}
{const _oc156=openComments;openComments=function(pid){const r=_oc156.apply(this,arguments);try{fd156Comentarios()}catch(e){}return r}}

/* ---- sem internet: o aviso diz que é a conexão; o Gostei é reenviado quando a internet volta ---- */
var FD156_GOSTEI={};
function fd156Offline(){return typeof navigator!=="undefined"&&navigator.onLine===false}
{const _tl156b=toast;toast=function(m){const a=[...arguments];try{if(typeof m==="string"){
  if(/^O comentário não foi salvo/.test(m)){if(fd156Offline())a[0]="Sem conexão: o comentário não foi enviado. O texto ficou na caixa; toque na seta quando a internet voltar.";
    setTimeout(()=>{const i=document.getElementById("ctext");if(!i)return;try{if(typeof cm106Ajusta==="function")cm106Ajusta(i)}catch(e){}try{const n=i.value.length;i.setSelectionRange(n,n)}catch(e){}},0)}
  else if(/^Não deu para marcar agora/.test(m)&&fd156Offline())a[0]="Sem conexão: o Gostei vai ser enviado quando a internet voltar."}}catch(e){}return _tl156b.apply(this,a)}}
{const _tk156=toggleLike;toggleLike=function(pid){let quer=null;try{if(S.uid)quer=!socialOf(pid).likes.includes(S.uid)}catch(e){}
  const r=_tk156.apply(this,arguments);try{if(quer!==null&&fd156Offline())FD156_GOSTEI[pid]=quer}catch(e){}return r}}
addEventListener("online",()=>{const ps=Object.keys(FD156_GOSTEI);if(!ps.length)return;setTimeout(()=>{let n=0;ps.forEach(pid=>{const q=FD156_GOSTEI[pid];delete FD156_GOSTEI[pid];
  try{if(S.uid&&socialOf(pid).likes.includes(S.uid)!==q){toggleLike(pid);n++}}catch(e){}});if(n)try{toast(n===1?"Conexão de volta: o Gostei foi enviado.":"Conexão de volta: os Gostei foram enviados.")}catch(e){}},600)});
