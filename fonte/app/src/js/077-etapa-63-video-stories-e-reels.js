/* ---------- Etapa 63: vídeo no story (e a exibição dos Reels já publicados) ---------- */
const VID_MIMES=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=avc1","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];
function vidMime(){if(!window.MediaRecorder||!MediaRecorder.isTypeSupported)return "";for(const m of VID_MIMES){try{if(MediaRecorder.isTypeSupported(m))return m}catch(e){}}return ""}
const vidExt=m=>/webm/.test(m)?"webm":/quicktime/.test(m)?"mov":"mp4";
const vidSrc=u=>{const t=String(u||"");return /^https:\/\//i.test(t)||/^data:video\//i.test(t)||/^blob:/i.test(t)?esc(t):""};
const vidMB=15*1048576;
async function vidCarrega(blob){const url=URL.createObjectURL(blob);const v=document.createElement("video");v.muted=true;v.playsInline=true;v.setAttribute("playsinline","");v.preload="auto";v.src=url;
  await new Promise((ok,no)=>{v.onloadedmetadata=ok;v.onerror=()=>no(new Error("video"));setTimeout(()=>no(new Error("tempo")),15000)});
  if(!isFinite(v.duration)||!v.duration){v.currentTime=1e7;await new Promise(r=>{const f=()=>{v.removeEventListener("timeupdate",f);r()};v.addEventListener("timeupdate",f);setTimeout(r,3000)});v.currentTime=0}
  await new Promise(r=>{if(v.readyState>=2)return r();v.onloadeddata=r;setTimeout(r,3000)});
  return {blob,url,v,dur:isFinite(v.duration)?v.duration:0,vw:v.videoWidth,vh:v.videoHeight}}
function vidSeek(v,t){return new Promise(r=>{const f=()=>{v.removeEventListener("seeked",f);r()};v.addEventListener("seeked",f);try{v.currentTime=Math.max(0,t)}catch(e){r()}setTimeout(r,2500)})}
async function vidQuadro(vd,t,W,H,f){const v=document.createElement("video");v.muted=true;v.playsInline=true;v.preload="auto";v.src=vd.url;await new Promise(r=>{v.onloadeddata=r;v.onerror=r;setTimeout(r,5000)});await vidSeek(v,(t||0)+.02);
  const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.fillStyle="#000";g.fillRect(0,0,W,H);try{edCover(g,v,W,H,(f&&f.z)||1,(f&&f.ox)||0,(f&&f.oy)||0)}catch(e){}v.removeAttribute("src");try{v.load()}catch(e){}return c}
/* refaz o vídeo no aparelho: recorte 9:16, trecho, com ou sem som */
async function vidFinal(vd,o){const mime=vidMime();const fim0=Math.min(o.fim,vd.dur||o.fim);const orig=()=>({blob:vd.blob,mime:(vd.blob.type||"video/mp4").split(";")[0],ini:o.ini,fim:fim0,orig:true});
  if(!mime||!HTMLCanvasElement.prototype.captureStream)return orig();
  let ms=null;try{const v=o.v||document.createElement("video");v.playsInline=true;v.setAttribute("playsinline","");v.preload="auto";if(v.src!==vd.url)v.src=vd.url;v.muted=!!o.mudo;v.volume=1;
    await new Promise((ok,no)=>{if(v.readyState>=2)return ok();v.onloadeddata=ok;v.onerror=()=>no(new Error("v"));setTimeout(ok,6000)});
    const c=document.createElement("canvas");c.width=o.W;c.height=o.H;const g=c.getContext("2d");const cs=c.captureStream(30);let at=[];
    if(!o.mudo){try{const ac=o.actx||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==="suspended")await ac.resume();if(!v._src){v._src=ac.createMediaElementSource(v);v._ac=ac}const dst=ac.createMediaStreamDestination();v._src.connect(dst);at=dst.stream.getAudioTracks()}catch(e){at=[]}}
    ms=new MediaStream([...cs.getVideoTracks(),...at]);const rec=new MediaRecorder(ms,{mimeType:mime,videoBitsPerSecond:2400000,audioBitsPerSecond:96000});const parts=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};
    await vidSeek(v,o.ini);const desenha=()=>{g.fillStyle="#000";g.fillRect(0,0,o.W,o.H);edCover(g,v,o.W,o.H,o.z||1,o.ox||0,o.oy||0)};desenha();
    const parou=new Promise(r=>rec.onstop=r);rec.start(250);
    try{await v.play()}catch(e){if(!v.muted){v.muted=true;await v.play()}else throw e}
    await new Promise(res=>{let ok=false;const fimJa=()=>{if(!ok){ok=true;res()}};const passo=()=>{if(ok)return;desenha();if(o.prog)o.prog(Math.min(1,(v.currentTime-o.ini)/Math.max(.1,fim0-o.ini)));if(v.currentTime>=fim0-.04||v.ended){fimJa();return}requestAnimationFrame(passo)};passo();v.addEventListener("ended",fimJa,{once:true});setTimeout(fimJa,(fim0-o.ini)*1000+5000)});
    v.pause();rec.stop();await parou;ms.getTracks().forEach(t=>t.stop());
    const blob=new Blob(parts,{type:mime.split(";")[0]});if(blob.size<15000)throw new Error("vazio");return {blob,mime:mime.split(";")[0],ini:0,fim:fim0-o.ini}}
  catch(e){try{ms&&ms.getTracks().forEach(t=>t.stop())}catch(_){}return orig()}}
async function vidSobe(blob,mime){const p=`${S.uid}/${(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2))}.${vidExt(mime)}`;
  const ct=/^video\/(mp4|webm|quicktime)$/.test(mime)?mime:"video/mp4";const r=await SB.storage.from("videos").upload(p,blob,{contentType:ct,upsert:false});if(r.error){const m=String(r.error.message||r.error.error||r.error);if(/bucket/i.test(m)&&/not.?found/i.test(m))throw new Error("SEM_VIDEOS");throw r.error}return p}
async function pubSobePng(blob){const p=`${S.uid}/${(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2))}.png`;const r=await SB.storage.from("fotos").upload(p,blob,{contentType:"image/png",upsert:false});if(r.error)throw r.error;return p}
/* gravar com a câmera */
function camGravaIni(max,pronto){if(!CAM.s)return false;const mime=vidMime();if(!mime){toast("Este navegador não grava vídeo. Escolha um da galeria.");return false}
  const parts=[];let rec;try{rec=new MediaRecorder(CAM.s,{mimeType:mime,videoBitsPerSecond:4000000})}catch(e){return false}rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};
  rec.onstop=()=>{CAM.rec=null;clearInterval(CAM.recI);const b=new Blob(parts,{type:mime.split(";")[0]});if(b.size>2000)pronto(b)};rec.start(250);CAM.rec=rec;CAM.recT0=Date.now();
  const sh=$("#layer .ce-shut");if(sh){sh.classList.add("grava");sh.style.setProperty("--dur",max+"s")}const tm=$("#rl-tempo");if(tm)tm.hidden=false;
  CAM.recI=setInterval(()=>{const s=(Date.now()-CAM.recT0)/1000;const tm=$("#rl-tempo");if(tm)tm.textContent=`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;if(s>=max)camGravaFim()},200);vibrar(15);return true}
function camGravaFim(){clearInterval(CAM.recI);if(CAM.rec&&CAM.rec.state!=="inactive")try{CAM.rec.stop()}catch(e){}$("#layer .ce-shut")?.classList.remove("grava")}
async function edVidPronto(blob,modo){if(!ED)return;toast("Abrindo o vídeo…");let vd;try{vd=await vidCarrega(blob)}catch(e){toast("Não deu para abrir esse vídeo.");return}if(!ED)return;
  if(!vidMime()&&blob.size>vidMB){toast("Vídeo grande demais para este aparelho. Escolha um mais curto.");return}camDesliga();
  if(edStOcupado(ED.st)){const st=edNovoSt();ED.sts.splice(ED.si+1,0,st);ED.si++;ED.st=st}
  ED.st.bg={tipo:"video",...vd,img:vd.v,z:1,ox:0,oy:0,ini:0,fim:Math.min(15,vd.dur||15),mudo:false};ED.tela="edit";edDesenha()}
/* story com vídeo no editor */
{const _es63=edStory;edStory=function(el){const b=ED.st.bg;if(b.tipo!=="video")return _es63.apply(this,arguments);_es63.apply(this,arguments);
  const bg=el.querySelector(".ce-bg");bg.style.background="#000";bg.innerHTML=`<video id="ce-bgv" playsinline loop autoplay preload="auto"></video>`;const v=$("#ce-bgv");v.src=b.url;v.muted=b.mudo||!!ED._mPrev;v.currentTime=b.ini||0;
  v.addEventListener("timeupdate",()=>{if(v.currentTime>=(b.fim||1e9)-.05||v.currentTime<(b.ini||0)-.3)v.currentTime=b.ini||0});v.play().catch(()=>{v.muted=true;ED._mPrev=true;v.play().catch(()=>{})});
  v.addEventListener("loadedmetadata",()=>edBgPos(),{once:true});edBgPos();
  el.querySelector("[data-edsalvar]")?.remove();el.querySelector(".ce-dica")?.remove();
  el.querySelector(".ce-top [data-edtexto]")?.insertAdjacentHTML("beforebegin",`<button type="button" class="ce-b" data-edmudo aria-pressed="${!!b.mudo}" aria-label="${b.mudo?"Ligar o som":"Tirar o som"}">${b.mudo?"🔇":"🔊"}</button><button type="button" class="ce-b ce-trb" data-edtrim aria-label="Cortar o vídeo">✂</button>`);
  const g=el.querySelector("#ce-galt");if(g)g.remove()}}
{const _bp63=edBgPos;edBgPos=function(){const b=ED&&ED.st.bg;if(b&&b.tipo==="video"){const v=$("#ce-bgv"),cv=$("#ce-cv");if(v&&cv&&b.img){edLimita(b,cv);edPosImg(v,b,cv)}return}return _bp63.apply(this,arguments)}}
{const _tf63=edTrocaFiltro;edTrocaFiltro=function(){if(ED.st.bg.tipo==="video")return;return _tf63.apply(this,arguments)}}
{const _st63=edStThumbs;edStThumbs=function(){_st63.apply(this,arguments);document.querySelectorAll("#layer canvas[data-stt]").forEach(c=>{const st=ED.sts[+c.dataset.stt];if(st&&st.bg.tipo==="video"&&st.bg.v){try{const g=c.getContext("2d");edCover(g,st.bg.v,c.width,c.height,1,0,0)}catch(e){}}})}}
function edOverlayCanvas(st,W,H,tudo){const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");const d=document.createElement("canvas");d.width=W;d.height=H;ED_TRACOS_ST=st;try{edPintaTracos(d.getContext("2d"),W,H)}finally{ED_TRACOS_ST=null}g.drawImage(d,0,0);
  st.els.filter(e=>tudo?!ED_VIVOS.includes(e.t):edAssa(e)).forEach(e=>edPintaEl(g,e,W,H));return c}
{const _ex63=edExportaStory;edExportaStory=async function(st0,tudo){const st=st0||ED.st;if(st.bg.tipo!=="video")return _ex63.apply(this,arguments);const b=st.bg;
  try{await Promise.all(st.els.filter(e=>e.t==="texto").map(e=>document.fonts.load(edFonte(e.f,40),e.tx)));await document.fonts.ready}catch(e){}
  const c=await vidQuadro(b,b.ini||0,1080,1920,b);c.getContext("2d").drawImage(edOverlayCanvas(st,1080,1920,tudo),0,0);return edJpeg(c)}}
async function edVidStory(st,row,fotos){const b=st.bg;const sp=()=>$("#layer [data-edpubst='"+((ED&&ED._pubq)||"amigos")+"'] > span:not(.av)");
  const r=await vidFinal(b,{W:720,H:1280,ini:b.ini||0,fim:b.fim||Math.min(15,b.dur||15),mudo:!!b.mudo,ox:b.ox,oy:b.oy,z:b.z,actx:ED&&ED._actx,v:ED&&ED._vu,prog:p=>{const s=sp();if(s)s.textContent=`Preparando o vídeo ${Math.round(p*100)}%`}});
  if(r.blob.size>vidMB)throw new Error("GRANDE");const s=sp();if(s)s.textContent="Enviando o vídeo…";const vp=await vidSobe(r.blob,r.mime);st._vp=vp;
  row.estilo.video=vp;row.estilo.dur=+Math.max(1,r.fim-r.ini).toFixed(2);if(r.orig){row.estilo.ini=+r.ini.toFixed(2);row.estilo.fim=+r.fim.toFixed(2)}row.estilo.mudo=!!b.mudo;
  if(st.tracos.length||st.els.some(edAssa)){let pb=await new Promise(ok=>edOverlayCanvas(st,720,1280).toBlob(ok,"image/png"));if(pb&&pb.size>950000)pb=await new Promise(ok=>{const c2=document.createElement("canvas");c2.width=540;c2.height=960;c2.getContext("2d").drawImage(edOverlayCanvas(st,720,1280),0,0,540,960);c2.toBlob(ok,"image/png")});fotos.push(await pubSobePng(pb));row.estilo.ov=1}}
/* desbloqueia som e vídeo no toque de publicar (iPhone) */
document.addEventListener("click",e=>{if(!ED||!e.target.closest||!e.target.closest("#layer [data-edpubst]"))return;try{if(!ED._actx)ED._actx=new (window.AudioContext||window.webkitAudioContext)();ED._actx.resume&&ED._actx.resume()}catch(_){}
  const vd=(ED.sts.find(s=>s.bg.tipo==="video")||{}).bg;if(vd&&vd.url&&!ED._vu){const v=document.createElement("video");v.playsInline=true;v.setAttribute("playsinline","");v.src=vd.url;v.muted=false;const p=v.play();if(p&&p.then)p.then(()=>v.pause()).catch(()=>{});ED._vu=v}},true);
/* cortar */
function edTrim(o,max,vSel){$("#layer .ce-sel")?.remove();const ov=document.createElement("div");ov.className="ce-sel ce-trim";const d=Math.max(.5,o.dur||(o.vd&&o.vd.dur)||o.fim||1);
  ov.innerHTML=`<div class="ce-selp"><b>Cortar <span class="ce-trd" id="ce-trd"></span></b><div class="ce-trs" id="ce-trs"></div><label class="ce-trl"><span>Início</span><input type="range" min="0" max="${d.toFixed(2)}" step="0.1" value="${(o.ini||0).toFixed(2)}" data-trini></label><label class="ce-trl"><span>Fim</span><input type="range" min="0" max="${d.toFixed(2)}" step="0.1" value="${(o.fim||d).toFixed(2)}" data-trfim></label><p class="ce-selh">Até ${max} segundos.</p><div class="ce-selb"><button type="button" class="btn" data-trok>Concluir</button></div></div>`;
  $("#layer .ce").appendChild(ov);const lb=()=>{const x=$("#ce-trd");if(x)x.textContent=`${(o.fim-o.ini).toFixed(1)} s`};lb();
  const ri=ov.querySelector("[data-trini]"),rf=ov.querySelector("[data-trfim]");const aj=(qual)=>{let a=+ri.value,b=+rf.value;if(b-a<.5){if(qual==="i")a=b-.5;else b=a+.5}if(b-a>max){if(qual==="i")b=a+max;else a=b-max}a=Math.max(0,a);b=Math.min(d,b);ri.value=a;rf.value=b;o.ini=a;o.fim=b;lb();const v=$(vSel);if(v){v.currentTime=qual==="i"?a:Math.max(a,b-1)}};
  ri.addEventListener("input",()=>aj("i"));rf.addEventListener("input",()=>aj("f"));
  (async()=>{const box=$("#ce-trs");if(!box||!o.url)return;for(let i=0;i<8;i++){if(!$("#ce-trs"))return;const c=await vidQuadro(o,d*i/8,45,80,null);c.className="ce-trq";box.appendChild(c)}})()}
/* ===== modos do editor: POST e STORY (a criação de Reels saiu em 13/11; os Reels já publicados continuam tocando no Feed) ===== */
edModos=function(){return `<div class="ce-modos" role="tablist">${[["post","POST"],["story","STORY"]].map(([k,n])=>`<button type="button" role="tab" data-edmodo="${k}" aria-selected="${ED.modo===k}">${n}</button>`).join("")}</div>`};
{const _ed63=edDesenha;edDesenha=function(){if(!ED)return;if(ED.modo==="reel")ED.modo="post";if(CAM.rec)camGravaFim();return _ed63.apply(this,arguments)}}
/* cliques do vídeo no story */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest||!$("#layer .ce")||!ED||t.closest("#layer2"))return;let b;const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  if(Date.now()-(ED._gravou||0)<900&&t.closest("[data-edfoto]")){pare();return}
  if(ED.env&&t.closest("[data-edmudo],[data-edtrim],[data-trok]")){pare();return}
  if(b=t.closest("[data-edmudo]")){pare();const bg=ED.st.bg;bg.mudo=!bg.mudo;ED._mPrev=false;b.textContent=bg.mudo?"🔇":"🔊";b.setAttribute("aria-pressed",String(bg.mudo));const v=$("#ce-bgv");if(v){v.muted=bg.mudo;v.play().catch(()=>{})}toast(bg.mudo?"Story sem som":"Story com som");return}
  if(t.closest("[data-edtrim]")){pare();edTrim(ED.st.bg,15,"#ce-bgv");return}
  if(t.closest("[data-trok]")){pare();$("#layer .ce-sel")?.remove();return}},true);
/* segurar o botão da câmera do story grava vídeo (até 15 s) */
(function(){let lp=0;document.addEventListener("pointerdown",e=>{const b=e.target.closest&&e.target.closest("#layer .ce.t-cam [data-edfoto]");if(!b||!ED||!CAM.s)return;lp=setTimeout(()=>{lp=0;if(camGravaIni(15,bl=>edVidPronto(bl,"story")))ED._gravando=true},320)},true);
  const solta=()=>{if(lp){clearTimeout(lp);lp=0}if(ED&&ED._gravando){ED._gravando=false;ED._gravou=Date.now();camGravaFim()}};document.addEventListener("pointerup",solta,true);document.addEventListener("pointercancel",solta,true)})();
/* ===== ver: story em vídeo ===== */
var US_MUDO=false;
{const _du63=igDrawUser;igDrawUser=function(){const r=_du63.apply(this,arguments);try{const x=ST.itens[ST.i];const es=x&&x.estilo;if(!es||!es.video)return r;const box=$("#layer .us2-box:not(.us2-ov)"),si=$("#layer .story-in");if(!box||!si)return r;
    const vu=pubUrl(es.video);box.innerHTML=`<video class="us2-vid" playsinline autoplay preload="auto" poster="${pubSrc(pubUrl(x.fotos[0]))}" src="${vidSrc(vu)}"></video>${es.ov&&x.fotos[1]?`<img class="us2-ovi" src="${pubSrc(pubUrl(x.fotos[1]))}" alt="">`:""}`;
    const v=box.querySelector("video");v.muted=US_MUDO||!!es.mudo;if(es.ini)v.currentTime=es.ini;if(es.fim)v.addEventListener("timeupdate",()=>{if(v.currentTime>=es.fim)v.pause()});
    v.play().catch(()=>{v.muted=true;v.play().catch(()=>{});const sb=$("#layer [data-usom]");if(sb)sb.textContent="🔇"});
    if(!es.mudo)si.insertAdjacentHTML("beforeend",`<button type="button" class="us-som" data-usom aria-label="Som">${v.muted?"🔇":"🔊"}</button>`);
    ST.palavras=Math.round((es.dur||8)*3.4)}catch(e){}return r}}
storyAuto=(function(ant){return function(p){const x=ST.itens&&ST.itens[ST.i];if(!(x&&x.estilo&&x.estilo.video&&String(ST.sec||"").indexOf("_u:")===0))return ant.apply(this,arguments);
  const dur=Math.max(2000,Math.min(31000,(x.estilo.dur||8)*1000+250));clearTimeout(ST.timer);if(!PREF.storyAuto)return;const fill=$("#layer .bars b");if(fill)fill.style.animationDuration=dur+"ms";ST.fim=Date.now()+dur;ST.resto=dur;ST.timer=setTimeout(()=>storyGo(1),dur)}})(storyAuto);
{const _ip63=igPausa;igPausa=function(){const r=_ip63.apply(this,arguments);const v=$("#layer .us2-vid");if(v)v.pause();return r}}
{const _sr63=storyRetoma;storyRetoma=function(){const r=_sr63.apply(this,arguments);const v=$("#layer .us2-vid");if(v&&v.paused&&ST.timer)v.play().catch(()=>{});return r}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer [data-usom]");if(!b)return;e.stopPropagation();e.preventDefault();US_MUDO=!US_MUDO;const v=$("#layer .us2-vid");if(v){v.muted=US_MUDO;if(!US_MUDO)v.play().catch(()=>{})}b.textContent=US_MUDO?"🔇":"🔊"},true);
/* ===== Feed: Reels tocando sozinhos ===== */
{const _pp63=pubPostHTML;pubPostHTML=function(x){let h=_pp63.apply(this,arguments);const es=x.estilo||{};if(!es.reel||!es.video)return h;
  const poster=pubSrc(pubUrl(x.fotos[0])),vu=vidSrc(pubUrl(es.video));h=h.replace(/<img class="up-img"[^>]*>/,`<video class="up-img up-vid" muted loop playsinline preload="none" poster="${poster}" data-vsrc="${vu}" data-ini="${+es.ini||0}" data-fim="${+es.fim||0}"></video><span class="up-rl">▶ Reels</span>${es.mudo?"":`<button type="button" class="up-som" data-upsom aria-label="Ligar o som">🔇</button>`}`);
  return h.replace('class="post upost','class="post upost up-reel')}}
setInterval(()=>{if(document.hidden)return;const vs=document.querySelectorAll("#posts .up-vid");const H=innerHeight;vs.forEach(v=>{const r=v.getBoundingClientRect();const vis=r.height>0&&r.top<H*.75&&r.bottom>H*.25&&!$("#layer").innerHTML;
  if(vis){if(!v.src&&v.dataset.vsrc){v.src=v.dataset.vsrc;if(+v.dataset.ini)v.currentTime=+v.dataset.ini}if(+v.dataset.fim&&v.currentTime>=+v.dataset.fim)v.currentTime=+v.dataset.ini||0;if(v.paused)v.play().catch(()=>{})}else if(!v.paused)v.pause()})},500);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".upost [data-upsom]");if(!b)return;e.stopPropagation();e.preventDefault();const v=b.closest(".up-sl").querySelector(".up-vid");if(!v)return;
  const ligar=v.muted;document.querySelectorAll("#posts .up-vid").forEach(x=>{x.muted=true});document.querySelectorAll("#posts [data-upsom]").forEach(x=>x.textContent="🔇");v.muted=!ligar;b.textContent=ligar?"🔊":"🔇";if(ligar)v.play().catch(()=>{})},true);
/* links assinados dos vídeos, e limpeza ao apagar */
{const _pa63=pubAssinar;pubAssinar=async function(){const r=await _pa63.apply(this,arguments);try{const now=Date.now(),falta=[];pubVisiveis().forEach(x=>{const p=x.estilo&&x.estilo.video;if(p){const c=PUB.urls[p];if(!c||c.exp<now+600e3)falta.push(p)}});
  if(falta.length){const q=await SB.storage.from("videos").createSignedUrls(falta,6*3600);(q.data||[]).forEach(d=>{if(d&&d.signedUrl)PUB.urls[d.path]={u:d.signedUrl,exp:now+6*3600e3}})}}catch(e){}return r}}
{const _ap63=pubApagar;pubApagar=async function(id){const x=pubDe(id),vp=x&&x.estilo&&x.estilo.video;const r=await _ap63.apply(this,arguments);if(r&&vp)try{await SB.storage.from("videos").remove([vp])}catch(e){}return r}}
{const _lm63=pubLimparMeus;pubLimparMeus=async function(){const now=Date.now();const vs=PUB.itens.filter(x=>x.autor===S.uid&&x.tipo==="story"&&(x.expira||0)<now&&x.estilo&&x.estilo.video).map(x=>x.estilo.video);const r=await _lm63.apply(this,arguments);if(vs.length)try{await SB.storage.from("videos").remove(vs)}catch(e){}return r}}
/* mensagens de erro do vídeo no story */
{const _t63=toast;toast=function(m){if(/Não deu para publicar/.test(m||"")&&window.__vErr)m=window.__vErr;return _t63.apply(this,[m,...[].slice.call(arguments,1)])}}
{const _vs63=edVidStory;edVidStory=async function(){try{return await _vs63.apply(this,arguments)}catch(e){window.__vErr=String(e&&e.message)==="SEM_VIDEOS"?"Os vídeos ainda não estão ligados no Prumo (falta rodar o SQL novo).":String(e&&e.message)==="GRANDE"?"O vídeo ficou grande demais. Corte um trecho menor.":null;setTimeout(()=>{window.__vErr=null},4000);throw e}}}

