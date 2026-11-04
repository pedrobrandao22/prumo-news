/* ---------- Etapa 46: comentar pelo story, telas de gráfico, destaques, pré-carga e cubo no dedo ---------- */
/* ===== telas de gráfico/números/linha do tempo ===== */
function igVisDe(p){const vs=(p&&p.visuais)||[];return vs.find(v=>v.tipo==="grafico"&&(v.itens||[]).length>=2&&(v.itens||[]).every(i=>typeof i.valor==="number"))||vs.find(v=>v.tipo==="numeros"&&(v.itens||[]).length>=2)||vs.find(v=>v.tipo==="linha_do_tempo"&&(v.itens||[]).length>=3)||null}
function igComVis(ps){const out=[];ps.forEach(p=>{out.push(p);if(igVisDe(p))out.push({...p,id:p.id+"#v",__vis:true})});return out}
{const _il46=igLista;igLista=function(sec){const r=_il46.apply(this,arguments);if(sec==="_ult"||sec==="_ag"||String(sec).indexOf("_h:")===0)return r;return {ps:igComVis(r.ps),itens:r.itens}}}
{const _sp46=stPs;stPs=function(){if(ST&&ST.sec&&String(ST.sec).indexOf("_h:")===0)return ST.itens||[];if(ST&&ST.sec==="_ag")return _sp46.apply(this,arguments);
  return (ST.ids||[]).map(id=>{if(/#v$/.test(id)){const p=pautaById(id.slice(0,-2));return p?{...p,id,__vis:true}:null}return pautaById(id)}).filter(Boolean)}}
{const _is46=igSet;igSet=function(sec,pos){const n=_is46.apply(this,arguments);if(pos==="novo"&&sec!=="_ult"&&sec!=="_ag"){const ps=stPs();let k=ps.findIndex(p=>!p.__vis&&!SEEN.has(seenKey(p)));ST.i=k<0?0:k}return n}}
openSecStory=function(sec){uso("story");ST={sec,ordem:secsStory().map(s=>s.id)};igSet(sec,"novo");drawStory()};
function igNum(v,c){return Number(v).toLocaleString("pt-BR",{minimumFractionDigits:c,maximumFractionDigits:c})}
function igVisHTML(v){const t=`<span class="sgv-t">${esc(v.titulo||"")}</span>`;
  if(v.tipo==="grafico"){const it=v.itens.slice(0,8),c=typeof v.casas==="number"?v.casas:(it.some(i=>i.valor%1)?1:0),u=v.unidade||"",mx=Math.max(...it.map(i=>Math.abs(i.valor)))||1;
    const fmt=x=>{if(u==="%")return igNum(x,c)+"%";const mo=/^(R\$|US\$|€|£)\s*(.*)$/.exec(u);if(mo)return mo[1]+" "+igNum(x,c)+(mo[2]?" "+mo[2]:"");return igNum(x,c)+(u?" "+u:"")};
    if(v.forma==="colunas"||v.forma==="linha"){const mn=Math.min(...it.map(i=>i.valor)),base=mn>0&&mn>mx*.6?mn*.96:0;
      return t+`<div class="sgv-col">${it.map((i,k)=>`<div class="${i.destaque?"d":""}" style="--h:${Math.max(4,(i.valor-base)/(mx-base)*100).toFixed(1)}%;--k:${k}"><b>${esc(fmt(i.valor))}</b><i></i><span>${esc(i.rotulo)}</span></div>`).join("")}</div>`+(v.fonte?`<small class="sgv-f">Fonte: ${esc(v.fonte)}</small>`:"")}
    return t+`<div class="sgv-bar">${it.map((i,k)=>`<div class="${i.destaque?"d":""}" style="--w:${Math.max(3,Math.abs(i.valor)/mx*100).toFixed(1)}%;--k:${k}"><span>${esc(i.rotulo)}</span><p><i></i><b>${esc(fmt(i.valor))}</b></p></div>`).join("")}</div>`+(v.nota?`<small class="sgv-f">${esc(v.nota)}</small>`:"")+(v.fonte?`<small class="sgv-f">Fonte: ${esc(v.fonte)}</small>`:"")}
  if(v.tipo==="numeros")return t+`<div class="sgv-num">${v.itens.slice(0,4).map((i,k)=>`<div style="--k:${k}"><b>${esc(i.valor)}</b><span>${esc(i.rotulo)}</span></div>`).join("")}</div>`+(v.fonte?`<small class="sgv-f">Fonte: ${esc(v.fonte)}</small>`:"");
  if(v.tipo==="linha_do_tempo"){const it=v.itens.slice(-5);return t+`<ol class="sgv-tl">${it.map((i,k)=>`<li style="--k:${k}"><b>${esc(i.quando)}</b><span>${esc(i.texto)}</span></li>`).join("")}</ol>`}
  return ""}
function igDrawVis(p){const ps=stPs();const vsec=ST.sec,base=pautaById(p.id.slice(0,-2))||p,v=igVisDe(base),cor=secCor(secOf(base)),vazioS=!$("#layer").innerHTML;
  const nomeTipo=v.tipo==="grafico"?"Em gráfico":v.tipo==="numeros"?"Em números":"Linha do tempo";
  ST.palavras=12+String(JSON.stringify(v.itens||v.titulo||"")).split(/\s+/).length/2;  /* gráfico do acervo (série, sem itens) não tem v.itens */
  const av=vsec==="_5min"?`<span class="ph-av sg-av sg-av5"><i>5</i></span>`:`<span class="ph-av sg-av" style="--c:${cor}"><i>${esc(secNome(secOf(base)).charAt(0))}</i></span>`;
  $("#layer").innerHTML=`<div class="story sg sg-vis" data-sec="${esc(secOf(base))}" style="--c:${cor}" role="dialog" aria-modal="true" aria-label="${esc(igNomeSt(vsec))}"><div class="story-in">
    <div class="sg-bg sgv-bg"></div>
    <div class="bars">${ps.map((_,k)=>`<i class="${k<ST.i||(k===ST.i&&!PREF.storyAuto)?"on":""}">${k===ST.i&&PREF.storyAuto?"<b></b>":""}</i>`).join("")}</div>
    <div class="s-h">${av}<span class="sg-who"><b>${esc(igNomeSt(vsec))}</b><span>${esc(nomeTipo)}</span></span><span class="s-hb"><button type="button" data-sauto aria-pressed="${!!PREF.storyAuto}" aria-label="${PREF.storyAuto?"Parar de passar sozinho":"Passar sozinho"}">${PREF.storyAuto?'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>'}</button><button type="button" data-close aria-label="Fechar">${ICON.close}</button></span></div>
    <button type="button" class="tap l" data-sgo="-1" aria-label="Anterior"></button><button type="button" class="tap r" data-sgo="1" aria-label="Próxima"></button>
    <div class="sg-body sgv-body"><span class="sg-k">${esc(capaChapeu(base))}</span><h3 class="sgv-h">${esc(versao(base,lente()).titulo)}</h3><div class="sgv">${igVisHTML(v)}</div></div>
    <div class="s-f sg-f" id="s-acts" data-pid="${esc(base.id)}">${storyActs(base.id)}</div>
  </div></div>`;
  igWire($("#layer .story"));if(vazioS&&pushH())HST++;storyAuto(base);igEntra();
  const b=$("#layer .sgv-body");if(b){let k=1;for(let n=0;n<6&&b.scrollHeight>b.clientHeight+1;n++){k-=.08;b.style.setProperty("--sgk",k.toFixed(2))}}
  requestAnimationFrame(()=>requestAnimationFrame(()=>$("#layer .story")?.classList.add("sgv-on")));renderSecs()}

/* ===== destaques (coberturas longas) ===== */
var DEST_VISTOS=new Set((()=>{try{return JSON.parse(localStorage.getItem("prumo-dest-vistos")||"[]")}catch(e){return []}})());
function destMarcos(p){const tl=(p.visuais||[]).find(v=>v.tipo==="linha_do_tempo"&&(v.itens||[]).length>=3);
  if(tl)return tl.itens.slice(-8).map(i=>({quando:i.quando,texto:i.texto}));
  const up=(p.atualizacoes||[]).filter(u=>u&&u.texto&&u.hora).slice().sort((a,b)=>String(a.hora).localeCompare(String(b.hora)));
  if(up.length>=3)return up.slice(-8).map(u=>{const d=new Date(u.hora);return {quando:isNaN(d)?"":d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",timeZone:"America/Sao_Paulo"})+" · "+hhmm(u.hora),texto:u.texto}});return null}
function destaques(){if(!FEED)return [];return ordenadas(visiveis()).filter(p=>destMarcos(p)).slice(0,6)}
function destChave(p){const m=destMarcos(p)||[];return p.id+"|"+m.length+"|"+((m[m.length-1]||{}).texto||"").slice(0,30)}
function destNome(p){const t=temaDe(p)||capaChapeu(p);return t.length>14?t.slice(0,13).trim()+"…":t}
{const _il46b=igLista;igLista=function(sec){if(String(sec).indexOf("_h:")===0){const p=pautaById(sec.slice(3));if(!p)return {ps:[],itens:[]};const m=destMarcos(p)||[];
  const fr=[{id:"h0",tipo:"capa",p,n:m.length}].concat(m.map((x,k)=>({id:"h"+(k+1),tipo:"marco",p,m:x,k,n:m.length})));return {ps:fr,itens:fr}}return _il46b.apply(this,arguments)}}
{const _so46=storyOrdem;storyOrdem=function(){if(ST&&ST.sec&&String(ST.sec).indexOf("_h:")===0)return [ST.sec];return _so46.apply(this,arguments)}}
{const _no46=igNomeSt;igNomeSt=function(sec){if(String(sec).indexOf("_h:")===0){const p=pautaById(sec.slice(3));return p?temaDe(p)||capaChapeu(p):"Destaque"}return _no46.apply(this,arguments)}}
function destAbrir(pid){const sec="_h:"+pid,r=igLista(sec);if(!r.ps.length)return;uso("destaque");if($("#layer").innerHTML&&!$("#layer .story"))closeLayer();
  ST={sec,ids:r.ps.map(x=>x.id),itens:r.itens,i:0,ordem:[]};drawStory()}
function igDrawDest(){const fr=ST.itens[ST.i];if(!fr)return closeLayer();const p=fr.p,vazioS=!$("#layer").innerHTML,cor=secCor(secOf(p)),f=fotoDe(p);
  if(ST.i===ST.itens.length-1){DEST_VISTOS.add(destChave(p));try{localStorage.setItem("prumo-dest-vistos",JSON.stringify([...DEST_VISTOS].slice(-60)))}catch(e){}}
  const capa=fr.tipo==="capa";ST.palavras=capa?14:String(fr.m.texto).split(/\s+/).length+6;
  const corpo=capa?`<span class="sg-k">Cobertura · ${esc(secNome(secOf(p)))}</span><h2>${esc(versao(p,lente()).titulo)}</h2><p class="sgd-sub">${fr.n} momentos, do começo até agora. Toque para seguir.</p>`
    :`<span class="sgd-q">${esc(fr.m.quando)}</span><p class="sgd-t">${esc(fr.m.texto)}</p><div class="sgd-dots">${Array.from({length:fr.n},(_,k)=>`<i class="${k<fr.k?"v":k===fr.k?"on":""}"></i>`).join("")}</div>`;
  $("#layer").innerHTML=`<div class="story sg sg-dest${f&&capa?" com-foto":""}" data-sec="${esc(secOf(p))}" style="--c:${cor}" role="dialog" aria-modal="true" aria-label="${esc(igNomeSt(ST.sec))}"><div class="story-in">
    <div class="sg-bg">${f&&capa?`<img src="${escU(fotoSrc(f.url))}" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.story').classList.remove('com-foto');this.remove()">`:`<div class="sgd-bg"></div>`}</div>
    <div class="sg-sh"></div>
    <div class="bars">${ST.itens.map((_,k)=>`<i class="${k<ST.i||(k===ST.i&&!PREF.storyAuto)?"on":""}">${k===ST.i&&PREF.storyAuto?"<b></b>":""}</i>`).join("")}</div>
    <div class="s-h"><span class="ph-av sg-av sg-avd" style="--c:${cor}">${f?`<img src="${escU(fotoMini(f.url))}" alt="" referrerpolicy="no-referrer">`:`<i>${esc((temaDe(p)||"?").charAt(0))}</i>`}</span><span class="sg-who"><b>${esc(igNomeSt(ST.sec))}</b><span>Destaque</span></span><span class="s-hb"><button type="button" data-sauto aria-pressed="${!!PREF.storyAuto}" aria-label="${PREF.storyAuto?"Parar de passar sozinho":"Passar sozinho"}">${PREF.storyAuto?'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>'}</button><button type="button" data-close aria-label="Fechar">${ICON.close}</button></span></div>
    <button type="button" class="tap l" data-sgo="-1" aria-label="Anterior"></button><button type="button" class="tap r" data-sgo="1" aria-label="Próxima"></button>
    <div class="sg-body${capa?"":" sgd-body"}">${corpo}${f&&capa?credHTML(f.credito||"Foto de arquivo","sg-cr"):""}</div>
    <div class="s-f sg-f" id="s-acts" data-pid="${esc(p.id)}">${storyActs(p.id)}</div>
  </div></div>`;
  igWire($("#layer .story"));if(vazioS&&pushH())HST++;storyAuto(p);igEntra();igCaber();renderSecs()}
{const _ds46=drawStory;drawStory=function(anim){if(ST&&String(ST.sec||"").indexOf("_h:")===0){clearTimeout(ST.timer);igDrawDest();igRodape();igPreCarrega();return}
  if(ST&&ST.sec!=="_ag"){const p=stPs()[ST.i];if(p&&p.__vis){clearTimeout(ST.timer);igDrawVis(p);igRodape();igPreCarrega();return}}
  const r=_ds46.apply(this,arguments);igRodape();igPreCarrega();return r}}
{const _rs46=renderSecs;renderSecs=function(){const r=_rs46.apply(this,arguments);const box=$("#secs");if(!box||!FEED)return r;
  try{box.querySelectorAll(".ig-div,[data-dest]").forEach(x=>x.remove());const ds=destaques();if(ds.length){const x=box.scrollLeft;
    box.insertAdjacentHTML("beforeend",`<span class="ig-div" aria-hidden="true"></span>`+ds.map(p=>{const f=fotoDe(p);return `<button type="button" class="sb ig-s ig-dest" data-dest="${esc(p.id)}" aria-label="Destaque: ${esc(temaDe(p)||capaChapeu(p))}"><span class="ig-r dest${DEST_VISTOS.has(destChave(p))?" visto":""}"><span class="ig-f paper" data-sec="${esc(secOf(p))}">${f?`<img src="${escU(fotoMini(f.url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`:svgOf(p.imagem)}</span></span><b>${esc(destNome(p))}</b></button>`}).join(""));box.scrollLeft=x}}catch(e){}return r}}
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("#secs [data-dest]");if(!b)return;e.stopPropagation();(window.comTransicao||((o,f)=>f()))(b.querySelector(".ig-r")||b,()=>destAbrir(b.dataset.dest),".story-in")},true);
{const _cl46=closeLayer;closeLayer=function(){const sec=ST&&ST.sec,era=!!$("#layer .story")&&!($("#layer2")?.innerHTML);const r=_cl46.apply(this,arguments);
  if(era&&sec&&String(sec).indexOf("_h:")===0&&VIEW==="feed"){const b=$(`#secs [data-dest="${CSS.escape(sec.slice(3))}"]`),box=$("#secs");if(b&&box){const want=b.getBoundingClientRect().left-box.getBoundingClientRect().left+box.scrollLeft-(box.clientWidth-b.offsetWidth)/2;box.scrollTo({left:Math.max(0,want),behavior:"smooth"})}}return r}}

/* ===== 1. comentar pelo story ===== */
storyActs=function(pid){const {likes}=socialOf(pid),mine=!!(S.uid&&likes.includes(S.uid));
  return `<button type="button" class="sg-a ${mine?"on":""}" data-a="like" aria-pressed="${mine}" aria-label="Gostei">${ICON.like}${likes.length?`<span>${likes.length}</span>`:""}</button><button type="button" class="sg-a" data-a="send" aria-label="Enviar para alguém">${ICON.send}</button>`};
function igCmtChip(pid){const n=socialOf(pid).cm.length;return n?`<button type="button" class="sg-cc" data-a="cmt">${ICON.cmt}<span>${n} ${n===1?"comentário":"comentários"}</span></button>`:""}
function igRodape(){const sa=$("#layer #s-acts");if(!sa||sa.closest(".sg-f2"))return;const pid=sa.dataset.pid;if(!pid)return;
  const f=document.createElement("div");f.className="s-f sg-f sg-f2";f.dataset.pid=pid;
  f.innerHTML=`<div class="sg-top2"><button type="button" class="sg-ler sg-ler2" data-stmat="${esc(pid)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg>Ler a matéria</button><span class="sg-ccw">${igCmtChip(pid)}</span></div><div class="sg-bot2"><form class="sg-rp" autocomplete="off"><input type="text" maxlength="600" enterkeyhint="send" placeholder="Comentar…" aria-label="Comentar esta notícia"><button type="submit" class="sg-rp-b" aria-label="Publicar o comentário">Publicar</button></form></div>`;
  sa.replaceWith(f);sa.className="sg-acts";sa.removeAttribute("style");f.querySelector(".sg-bot2").appendChild(sa)}
{const _us46=updateSocial;updateSocial=function(pid){const r=_us46.apply(this,arguments);try{const w=$("#layer .sg-f2");if(w&&w.dataset.pid===pid){const c=w.querySelector(".sg-ccw");if(c)c.innerHTML=igCmtChip(pid)}}catch(e){}return r}}
var IG_DIG=false;
function igPausa(){if(!ST)return;if(ST.timer){clearTimeout(ST.timer);ST.timer=0;ST.resto=Math.max(800,(ST.fim||0)-Date.now())}const f=$("#layer .bars b");if(f)f.style.animationPlayState="paused"}
document.addEventListener("focusin",e=>{const i=e.target.closest&&e.target.closest("#layer .sg-rp input");if(!i)return;
  if(precisaConta()){i.blur();return}IG_DIG=true;igPausa();$("#layer .story")?.classList.add("digitando")});
document.addEventListener("focusout",e=>{const i=e.target.closest&&e.target.closest("#layer .sg-rp input");if(!i)return;setTimeout(()=>{if(document.activeElement&&document.activeElement.closest&&document.activeElement.closest(".sg-rp"))return;IG_DIG=false;$("#layer .story")?.classList.remove("digitando");if(!$("#layer2")?.innerHTML)storyRetoma()},120)});
document.addEventListener("input",e=>{const i=e.target.closest&&e.target.closest("#layer .sg-rp input");if(i)i.closest(".sg-rp").classList.toggle("tem",!!i.value.trim())});
document.addEventListener("submit",async e=>{const fm=e.target.closest&&e.target.closest("#layer .sg-rp");if(!fm)return;e.preventDefault();const inp=fm.querySelector("input"),t=inp.value.trim(),pid=fm.closest(".sg-f2")?.dataset.pid;
  if(!t||!pid||precisaConta())return;inp.value="";fm.classList.remove("tem");inp.blur();
  const ok=await igComentar(pid,t);if(ok)toast("Comentário publicado. Ele aparece na notícia, no Feed.");else{if($("#layer .sg-rp input")&&!$("#layer .sg-rp input").value){$("#layer .sg-rp input").value=t;$("#layer .sg-rp").classList.add("tem")}toast("O comentário não foi salvo. O texto voltou para a caixa.")}},true);
async function igComentar(pid,t){uso("story_comentario");const cid=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const sn=snapById(pid);const v={pid,texto:t,at:Date.now(),snap:sn?{id:pid,titulo:sn.titulo||"",secao:sn.secao||""}:{id:pid}};
  CPEND[S.uid+"\u0001"+cid]={v,t:Date.now()};S.cmts=montarCmts(S._cmtDocs);updateSocial(pid);
  try{await gravarMapa("comentarios/"+S.uid,"itens",cid,v);return true}catch(err){delete CPEND[S.uid+"\u0001"+cid];S.cmts=montarCmts(S._cmtDocs);updateSocial(pid);return false}}
/* enquanto digita, toques e gestos não mexem no story */
window.addEventListener("click",e=>{if(!IG_DIG)return;const b=e.target&&e.target.closest&&e.target.closest("#layer .story [data-sgo]");if(b){e.stopPropagation();e.preventDefault();document.activeElement?.blur?.()}},true);
{const _sa46=storyAuto;storyAuto=function(){const r=_sa46.apply(this,arguments);if(IG_DIG)igPausa();return r}}

/* ===== 8. pré-carregar a próxima foto ===== */
var IG_PRE=new Set();
function igPreCarrega(){try{const ps=stPs(),L=storyOrdem(),k=L.indexOf(ST.sec);const alvo=[ps[ST.i+1],ps[ST.i+2]];
  if(ST.i>=ps.length-2&&L[k+1]){const r=igLista(L[k+1]);alvo.push(r.ps[0])}
  alvo.forEach(p=>{const q=p&&(p.p||p);const pp=q&&q.id&&pautaById(String(q.id).replace(/#v$/,""));const f=pp&&fotoDe(pp);if(!f||!f.url)return;const u=fotoSrc(f.url);if(IG_PRE.has(u))return;IG_PRE.add(u);const im=new Image();im.decoding="async";im.referrerPolicy="no-referrer";im.src=u})}catch(e){}}

/* ===== 9. cubo que acompanha o dedo ===== */
function igPrevia(fn){const sv={ml:marcarLida,rs:renderSecs,ph:pushH};const stub=x=>{x.add=function(){return x}};
  [SEEN,ULT_VISTOS,AG_VISTOS,DEST_VISTOS].forEach(stub);marcarLida=()=>{};renderSecs=()=>{};pushH=()=>false;IG_CUBO=true;
  try{fn()}finally{[SEEN,ULT_VISTOS,AG_VISTOS,DEST_VISTOS].forEach(x=>{delete x.add});marcarLida=sv.ml;renderSecs=sv.rs;pushH=sv.ph;IG_CUBO=false;if(ST){clearTimeout(ST.timer);ST.timer=0}}}
function igDragIni(d){const st=$("#layer .story"),old=st&&st.querySelector(".story-in");if(!old||REDUZ.matches||!old.animate)return null;
  const L=storyOrdem(),k=L.indexOf(ST.sec),nx=L[k+d],W=old.getBoundingClientRect().width;igPausa();
  if(!nx)return {nada:true,d,old,W};
  const r0=old.getBoundingClientRect(),clone=old.cloneNode(true);clone.removeAttribute("id");clone.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));
  const antes={...ST,timer:0};igPrevia(()=>{igSet(nx,"novo");drawStory()});
  const st2=$("#layer .story"),nw=st2&&st2.querySelector(".story-in");if(!nw)return null;const rs=st2.getBoundingClientRect();
  clone.style.cssText=`position:absolute;left:${r0.left-rs.left}px;top:${r0.top-rs.top}px;width:${r0.width}px;height:${r0.height}px;margin:0;z-index:5;pointer-events:none`;st2.appendChild(clone);st2.classList.add("sg-cubo");
  const f=nw.querySelector(".bars b");if(f)f.style.animationPlayState="paused";
  return {d,nx,clone,nw,W,antes,st:st2}}
const igTf=(W,a)=>`translateZ(${-W/2}px) rotateY(${a}deg) translateZ(${W/2}px)`;
function igDragProg(dr,dx){return Math.max(0,Math.min(1,dr.d>0?-dx/dr.W:dx/dr.W))}
function igDragMove(dr,dx){if(dr.nada){dr.old.style.transform=`translateX(${dx*.25}px)`;return}const pr=igDragProg(dr,dx),s=dr.d;
  dr.clone.style.transform=igTf(dr.W,-90*s*pr);dr.clone.style.filter=`brightness(${1-.45*pr})`;dr.nw.style.transform=igTf(dr.W,90*s*(1-pr));dr.nw.style.filter=`brightness(${.55+.45*pr})`}
function igDragFim(dr,dx,vel){if(dr.nada){dr.old.animate([{transform:dr.old.style.transform||"none"},{transform:"none"}],{duration:220,easing:"cubic-bezier(.3,.7,.4,1)"});dr.old.style.transform="";
    if(dr.d>0&&-dx>dr.W*.3)igFechar();else storyRetoma();return}
  const pr=igDragProg(dr,dx),s=dr.d,v=dr.d>0?-vel:vel,vai=pr>.33||(v>.45&&pr>.06);VIRANDO=true;
  const dur=Math.round(120+260*(vai?1-pr:pr)),op={duration:dur,easing:"cubic-bezier(.25,.8,.3,1)",fill:"forwards"};
  const a1=dr.clone.animate([{transform:igTf(dr.W,-90*s*pr),filter:`brightness(${1-.45*pr})`},{transform:igTf(dr.W,vai?-90*s:0),filter:`brightness(${vai?.55:1})`}],op);
  dr.nw.animate([{transform:igTf(dr.W,90*s*(1-pr)),filter:`brightness(${.55+.45*pr})`},{transform:igTf(dr.W,vai?0:90*s),filter:`brightness(${vai?1:.55})`}],op);
  dr.clone.style.transform=dr.nw.style.transform="";dr.clone.style.filter=dr.nw.style.filter="";
  a1.onfinish=()=>{VIRANDO=false;if(vai){vibrar(6);IG_CUBO=true;try{drawStory()}finally{IG_CUBO=false}}else{ST=dr.antes;IG_CUBO=true;try{drawStory()}finally{IG_CUBO=false}}$("#layer .story")?.classList.remove("sg-cubo")}}
igWire=function(el){if(!el)return;let x0=0,y0=0,t0=0,on=false,modo="",dr=null,lx=0,lt=0,vel=0;const si=el.querySelector(".story-in");
  el.addEventListener("touchstart",e=>{if(e.target.closest(".s-f,.s-h,.us-it")||IG_DIG||VIRANDO)return;const t=e.touches[0];x0=lx=t.clientX;y0=t.clientY;t0=lt=Date.now();on=true;modo="";dr=null;vel=0},{passive:true});
  el.addEventListener("touchmove",e=>{if(!on)return;const t=e.touches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(!modo&&(Math.abs(dx)>8||Math.abs(dy)>8))modo=Math.abs(dy)>Math.abs(dx)*1.2?(dy>0?"baixo":"cima"):"lado";
    if(modo==="baixo"&&si){if(e.cancelable)e.preventDefault();const k=Math.max(0,dy);si.style.transition="none";si.style.transform=`translateY(${k}px) scale(${Math.max(.85,1-k/1600)})`;el.style.backgroundColor=`rgb(0 0 0 / ${Math.max(.3,1-k/500)})`}
    if(modo==="lado"){e.preventDefault();const now=Date.now();if(now>lt){vel=(t.clientX-lx)/(now-lt);lx=t.clientX;lt=now}
      if(!dr&&Math.abs(dx)>10){dr=igDragIni(dx<0?1:-1)||{falhou:true}}
      if(dr&&!dr.falhou)igDragMove(dr,dx)}},{passive:false});
  el.addEventListener("touchend",e=>{if(!on)return;on=false;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(modo==="baixo"){e.preventDefault();if(dy>110)igFechar();else if(si){si.style.transition="transform .22s cubic-bezier(.3,.7,.4,1)";si.style.transform="";el.style.backgroundColor="";setTimeout(()=>{si.style.transition=""},240);storyRetoma()}return}
    if(modo==="lado"){e.preventDefault();if(dr&&!dr.falhou)igDragFim(dr,dx,vel);else if(Math.abs(dx)>60)storySec(dx<0?1:-1);dr=null;return}
    if(modo==="cima"&&dy<-80){e.preventDefault();const pid=$("#s-acts")?.dataset.pid;if(pid)igLerMateria(pid)}},{passive:false});
  el.addEventListener("touchcancel",()=>{if(dr&&!dr.falhou)igDragFim(dr,0,0);dr=null;on=false},{passive:true})};

