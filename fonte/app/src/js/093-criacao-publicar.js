/* ---------- Criação: publicar sem travar, movimento e tela mais limpa ---------- */
/* Publicar em segundo plano: o editor fecha na hora e o envio continua.
   O estado do editor (ED) fica guardado com o envio até ele terminar; as funções de publicar
   de antes (e quem as embrulhou) continuam sendo as mesmas, só que rodando com a tela fechada. */
var PQ={atual:null,jobs:[],t:0,n:0};
const PQ_NOMES={story:"edPublicaStory",post:"edPublicaPost"};
function pqUnidades(tipo,ed){if(tipo==="post")return Math.max(1,ed.po.fotos.length);
  return Math.max(1,(ed.sts||[ed.st]).filter(edStTem).reduce((n,st)=>n+(st.bg.tipo==="video"?4:1),0))}
function pqQuadro(v){if(!v)return "";try{const c=document.createElement("canvas");c.width=72;c.height=128;edCover(c.getContext("2d"),v,72,128,1,0,0);return c.toDataURL("image/jpeg",.7)}catch(e){return ""}}
function pqThumb(tipo,ed){try{
  if(tipo==="post"){const f=ed.po.fotos[0];return f?{img:edUrlF(f)}:{bg:pubFundo(1),aa:1}}
  const st=(ed.sts||[ed.st]).find(edStTem)||ed.st,b=st.bg;
  if(b.tipo==="foto")return {img:b.url};if(b.tipo==="layout"){const o=(b.cel||[]).find(Boolean);return o?{img:o.url}:{bg:"#111"}}
  if(b.tipo==="video")return {img:pqQuadro(b.v||b.img),bg:"#111"};return {bg:pubFundo(b.g),aa:1}}catch(e){return {bg:"#333"}}}
function pqNovo(tipo,ed,args){const j={id:"pq"+(++PQ.n),tipo,ed,args,estado:"env",t0:Date.now(),feito:0,sub:0,disp:0,U:pqUnidades(tipo,ed),th:pqThumb(tipo,ed)};PQ.jobs.push(j);return j}
/* fecha o editor sem perder o ED do envio */
function pqFechaEditor(ed){if(!$("#layer .ce"))return;try{if(ed.st&&ed.st.tx)edTextoOk()}catch(e){}if(CAM&&CAM.rec)try{camGravaFim()}catch(e){}closeLayer._ok=true;closeLayer();closeLayer._ok=false;ED=ed}
function pqComeca(j,p){PQ.atual=j;j.estado="env";j.t0=Date.now();j.feito=0;j.sub=0;j.disp=0;pqDesenha();pqLoop();
  Promise.resolve(p).then(()=>pqFim(j),e=>pqFim(j,e))}
function pqFim(j,err){if(PQ.atual===j)PQ.atual=null;const ed=j.ed;
  if(ED===ed){/* não terminou: guarda para tentar de novo */ed.env=false;ED=null;j.estado="erro";j.err=err||null;
    if(j.tipo==="story"){const resto=(ed.sts||[]).filter(edStTem);if(!resto.length){j.estado="ok"}else{j.U=pqUnidades("story",ed);j.th=pqThumb("story",ed)}}
    if(j.estado==="erro"&&j.tipo==="post"&&(ed.po.fotos.length||ed.po.texto.trim())&&typeof rascSalva==="function"){const s=ED;ED=ed;try{if(!ed.po.rid)ed.po.rid=edNid();rascSalva().catch(()=>{})}catch(e){}finally{ED=s}}}
  else j.estado="ok";
  if(j.estado==="ok"){j.disp=1;vibrar&&vibrar(8);setTimeout(()=>{PQ.jobs=PQ.jobs.filter(x=>x!==j);pqDesenha(true)},ANIM_OK()?900:300)}
  pqDesenha();try{renderSecs()}catch(e){}}
function pqProg(j){if(j.estado!=="env")return j.estado==="ok"?1:j.disp;const real=(j.feito+j.sub)/Math.max(1,j.U),tr=.85*(1-Math.exp(-(Date.now()-j.t0)/3500));j.disp=Math.max(j.disp,Math.min(.96,Math.max(real,tr)));return j.disp}
function pqLoop(){if(PQ.t)return;PQ.t=setInterval(()=>{if(!PQ.atual){clearInterval(PQ.t);PQ.t=0;return}pqAtualiza()},160)}
function pqAtualiza(){PQ.jobs.forEach(j=>{const p=pqProg(j),b=document.querySelector(`#pq [data-pq="${j.id}"] .pq-bar i`);if(b)b.style.width=(p*100).toFixed(1)+"%"});
  const r=document.querySelector("#secs [data-meustory] .ig-r");if(r){const j=PQ.jobs.find(x=>x.tipo==="story"&&x.estado!=="erro");r.classList.toggle("pq-on",!!j);r.classList.toggle("pq-erro",!j&&PQ.jobs.some(x=>x.tipo==="story"&&x.estado==="erro"));if(j)r.style.setProperty("--pq",(pqProg(j)*100).toFixed(1));else r.style.removeProperty("--pq")}}
function pqBox(){let b=$("#pq");if(!b){const s=$("#secs");if(!s)return null;b=document.createElement("div");b.id="pq";b.className="pq gut";b.setAttribute("aria-live","polite");s.after(b)}return b}
function pqDesenha(){const box=pqBox();if(!box){return}const vis=PQ.jobs.filter(j=>j.tipo!=="story"||j.estado==="erro");
  const ant=new Set([...box.children].map(x=>x.dataset.pq));
  box.innerHTML=vis.map(j=>{const er=j.estado==="erro",ok=j.estado==="ok",nm=j.tipo==="reel"?"reel":j.tipo==="story"?"story":"post";
    return `<div class="pq-row${er?" erro":""}${ok?" ok":""}${ant.has(j.id)?"":" novo"}" data-pq="${j.id}"><span class="pq-th${j.th.aa?" aa":""}">${j.th.aa?"Aa":""}${j.tipo==="reel"?`<i class="pq-rl">▶</i>`:""}</span>
      <span class="pq-tx">${er?`<b>Não foi publicado</b><span class="pq-bs"><button type="button" class="pq-b on" data-pqtenta="${j.id}">Tentar de novo</button><button type="button" class="pq-b" data-pqdesc="${j.id}">Descartar</button></span>`
        :`<b>${ok?"Publicado":"Publicando…"}</b><small>${ok?"Já está no Feed":"Seu "+nm+" vai aparecer aqui"}</small>`}</span>${ok?`<i class="pq-ok" aria-hidden="true">✓</i>`:""}${er?"":`<i class="pq-bar" aria-hidden="true"><i style="width:${(pqProg(j)*100).toFixed(1)}%"></i></i>`}</div>`}).join("");
  box.querySelectorAll(".pq-th").forEach((el,i)=>{const t=vis[i].th;if(t.bg)el.style.background=t.bg;if(t.img)el.style.backgroundImage=`url("${String(t.img).replace(/"/g,"%22")}")`});
  box.hidden=!vis.length;pqAtualiza()}
{const _rs93=renderSecs;renderSecs=function(){const r=_rs93.apply(this,arguments);try{if(PQ.jobs.length){pqBox();pqAtualiza()}}catch(e){}return r}}
/* embrulha as três funções de publicar */
function pqEmbrulha(tipo){const nome=PQ_NOMES[tipo],orig=window[nome];if(typeof orig!=="function")return;
  window[nome]=function(){const args=[...arguments];
    if(PQ.retry&&PQ.retry.ed===ED&&PQ.retry.tipo===tipo){const j=PQ.retry;PQ.retry=null;const p=orig.apply(this,args);pqComeca(j,p);return p}
    if(!ED||ED.env||PQ.atual||!$("#layer .ce"))return orig.apply(this,args);const ed=ED;
    if(tipo==="post"){/* a 1ª foto é processada antes do 1º await: fecha antes para não travar */const P=ed.po;if(!P.fotos.length&&!P.texto.trim()&&!P.pid)return orig.apply(this,args);
      if(ed.st&&ed.st.tx)try{edTextoOk()}catch(e){}const j=pqNovo(tipo,ed,args);PQ.atual=j;pqFechaEditor(ed);pqDesenha();
      const p=new Promise(ok=>setTimeout(()=>{if(ED!==ed){ok();return}ok(orig.apply(this,args))},40));pqComeca(j,p);return p}
    const p=orig.apply(this,args);if(ED!==ed||!ed.env)return p;
    const j=pqNovo(tipo,ed,args);PQ.atual=j;pqFechaEditor(ed);pqComeca(j,p);return p}}
pqEmbrulha("story");pqEmbrulha("post");pqEmbrulha("reel");
function pqTenta(id){const j=PQ.jobs.find(x=>x.id===id);if(!j||j.estado!=="erro")return;if(PQ.atual){toast("Espere terminar de publicar.");return}if(ED||$("#layer .ce")){toast("Feche o editor para tentar de novo.");return}
  ED=j.ed;ED.env=false;PQ.retry=j;let p;try{p=window[PQ_NOMES[j.tipo]].apply(null,j.args||[])}catch(e){p=Promise.reject(e)}if(PQ.retry===j){PQ.retry=null;pqComeca(j,p)}}
function pqDescarta(id){const j=PQ.jobs.find(x=>x.id===id);if(!j||j.estado!=="erro")return;PQ.jobs=PQ.jobs.filter(x=>x!==j);if(j.tipo==="post"&&j.ed.po.rid&&typeof rascApaga==="function")rascApaga(j.ed.po.rid);j.ed=null;pqDesenha();try{renderSecs()}catch(e){}}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
  if(b=t.closest("#pq [data-pqtenta]")){e.stopPropagation();e.preventDefault();pqTenta(b.dataset.pqtenta);return}
  if(b=t.closest("#pq [data-pqdesc]")){e.stopPropagation();e.preventDefault();pqDescarta(b.dataset.pqdesc);return}},true);
/* contadores de progresso */
{const _s93=pubSobe;pubSobe=async function(){const j=PQ.atual;const r=await _s93.apply(this,arguments);if(j&&PQ.atual===j)j.feito+=1;return r}}
{const _v93=vidSobe;vidSobe=async function(){const j=PQ.atual;const r=await _v93.apply(this,arguments);if(j&&PQ.atual===j){j.feito+=3;j.sub=0}return r}}
{const _f93=vidFinal;vidFinal=function(vd,o){const j=PQ.atual;if(j&&o){const p0=o.prog;o=Object.assign({},o,{prog:p=>{try{p0&&p0(p)}catch(e){}j.sub=Math.max(0,Math.min(1,+p||0))*2.5}})}return _f93.call(this,vd,o)}}
/* enquanto um envio roda, o editor não abre de novo (o envio usa o estado dele) */
{const _ca93=criarAbrir;criarAbrir=function(){if(PQ.atual){toast("Espere terminar de publicar.");return}pqAnimCls();const r=_ca93.apply(this,arguments);const ce=$("#layer .ce");if(ce&&ANIM_OK()){ce.dataset.anim="entra";setTimeout(()=>{if(ce.dataset.anim==="entra")delete ce.dataset.anim},400)}return r}}
window.addEventListener("click",e=>{if(!PQ.atual||!e.target.closest)return;if(e.target.closest("[data-pfreel],#layer [data-usadd],[data-upstory],[data-criarde],#b-criar")){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();toast("Espere terminar de publicar.")}},true);
addEventListener("beforeunload",e=>{if(PQ.atual&&!navigator.webdriver){e.preventDefault();e.returnValue=""}});

/* ===== movimento ===== */
function pqAnimCls(){document.documentElement.classList.toggle("ce-anim",ANIM_OK())}
pqAnimCls();try{REDUZ.addEventListener("change",pqAnimCls)}catch(e){}
/* fechar o editor: desliza para baixo e some */
{const _cl93=closeLayer;closeLayer=function(){const n=$("#layer > .ce");const r=_cl93.apply(this,arguments);
  if(n&&!n.isConnected&&ANIM_OK()){try{if(CAM.v&&n.contains(CAM.v))CAM.v.remove();n.querySelectorAll("video").forEach(v=>{v.muted=true;try{v.pause()}catch(_){}});n.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));
    n.classList.add("ce-sai");n.setAttribute("aria-hidden","true");n.inert=true;delete n.dataset.anim;document.body.appendChild(n);setTimeout(()=>n.remove(),260)}catch(e){n.remove()}}return r}}
function edPop(id){if(!id||!ANIM_OK())return;const d=document.querySelector(`#ce-els [data-eid="${id}"]`);if(!d)return;d.classList.add("ce-pop");setTimeout(()=>d.classList.remove("ce-pop"),400)}
/* figurinhas novas não nascem empilhadas: cada uma desce um pouco */
const ED_CASCATA=[[0,0]].concat(...[1,2,3,4,5,6,7,8].map(k=>[[0,.07*k],[0,-.07*k],[.06*k,.07*k],[-.06*k,.07*k]]));
function edLivre(x,y,els){const perto=(a,b)=>els.some(o=>Math.abs((o.x==null?.5:o.x)-a)<.035&&Math.abs((o.y==null?.5:o.y)-b)<.035);
  for(const [dx,dy] of ED_CASCATA){const a=x+dx,b=y+dy;if(a<.12||a>.88||b<.1||b>.9)continue;if(!perto(a,b))return [a,b]}return [x,y]}
{const _ad93=edAdd;edAdd=function(e){try{if(ED&&ED.st&&e){const [x,y]=edLivre(e.x==null?.5:e.x,e.y==null?.5:e.y,ED.st.els);e={...e,x:+x.toFixed(4),y:+y.toFixed(4)}}}catch(_){}
  const n0=ED&&ED.st?ED.st.els.length:0;const r=_ad93.call(this,e);try{if(ED&&ED.st&&ED.st.els.length>n0)edPop(ED.st.els[ED.st.els.length-1].id)}catch(_){}return r}}
{const _to93=edTextoOk;edTextoOk=function(){const x=ED&&ED.st&&ED.st.tx,novo=ED&&ED.st&&ED.st.txNovo;const r=_to93.apply(this,arguments);try{if(x&&novo&&ED&&ED.st.els.includes(x))edPop(x.id)}catch(e){}return r}}

/* ===== tela mais limpa ===== */
/* depois de tirar ou escolher a foto, some o seletor POST/STORY/REELS */
{const _md93=edModos;edModos=function(){if(ED&&ED.modo==="story"&&ED.tela==="edit")return "";return _md93.apply(this,arguments)}}
/* arrastando um item: somem as barras, fica só a lixeira; o item encolhe sobre a lixeira */
(function(){let on=false;const lig=v=>{const ce=$("#layer .ce");if(!ce)return;if(v)ce.dataset.arr="1";else delete ce.dataset.arr};
  document.addEventListener("pointermove",()=>{if(!ED||!$("#layer .ce"))return;const lx=$("#ce-lixo");const ag=!!lx&&!lx.hidden;if(ag!==on){on=ag;lig(ag)}
    if(ag){const box=$("#ce-els"),el=box&&box.lastElementChild;if(el){el.classList.add("ce-arr");el.classList.toggle("ce-nolixo",lx.classList.contains("on"))}}},{passive:true});
  const fim=()=>{if(!on)return;on=false;lig(false);document.querySelectorAll("#ce-els .ce-arr").forEach(x=>x.classList.remove("ce-arr","ce-nolixo"))};
  document.addEventListener("pointerup",()=>setTimeout(fim,0));document.addEventListener("pointercancel",()=>setTimeout(fim,0))})();

/* ===== texto: botões rápidos de alinhamento e fundo com ícones claros ===== */
const ED_ICO_AL={c:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 6h16M7 10h10M4 14h16M7 18h10"/></svg>',e:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 6h16M4 10h10M4 14h16M4 18h10"/></svg>',d:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 6h16M10 10h10M4 14h16M10 18h10"/></svg>'};
const ED_AL_N={c:"centro",e:"esquerda",d:"direita"},ED_FD_N=["sem fundo","fundo sólido","fundo translúcido"];
function edTxIcones(lbl){const e=ED&&ED.st&&ED.st.tx;if(!e)return;const al=$("#layer .ce-tx [data-edtxal]");if(al){al.innerHTML=ED_ICO_AL[e.al||"c"]||ED_ICO_AL.c;al.setAttribute("aria-label","Alinhamento: "+ED_AL_N[e.al||"c"])}
  const fd=$("#layer .ce-tx [data-edtxfd]");if(fd){fd.dataset.fd=e.fd||0;fd.setAttribute("aria-label","Fundo do texto: "+ED_FD_N[e.fd||0])}
  if(lbl){const ov=$("#layer .ce-tx");if(!ov)return;let l=ov.querySelector(".ce-txlbl");if(!l){l=document.createElement("div");l.className="ce-txlbl";l.setAttribute("aria-hidden","true");ov.appendChild(l)}
    l.textContent=lbl==="al"?({c:"Centralizado",e:"Alinhado à esquerda",d:"Alinhado à direita"})[e.al||"c"]:ED_FD_N[e.fd||0].replace(/^./,c=>c.toUpperCase());l.classList.remove("on");void l.offsetWidth;l.classList.add("on");clearTimeout(l._t);l._t=setTimeout(()=>l.classList.remove("on"),900)}}
{const _tx93=edTexto;edTexto=function(){const r=_tx93.apply(this,arguments);edTxIcones();return r}}
{const _rf93=edTxRefaz;edTxRefaz=function(){const r=_rf93.apply(this,arguments);edTxIcones(PQ._lbl);PQ._lbl=null;return r}}
window.addEventListener("click",e=>{const t=e.target;if(!t.closest||!ED)return;if(t.closest("#layer .ce-tx [data-edtxal]"))PQ._lbl="al";else if(t.closest("#layer .ce-tx [data-edtxfd]"))PQ._lbl="fd"},true);
