/* ---------- 096: Reels e câmera — corte em tira de quadros, capa, texto e figurinhas no vídeo, Boomerang, timer, zoom ---------- */
var RC={boom:false,tm:0,cd:null,ocupado:false,livre:false,zoom:null,pinca:false,jobs:[]};
const RCI={
  boom:'<svg class="ico" viewBox="0 0 24 24"><path d="M7.5 8.5C5.6 8.5 4 10 4 12s1.6 3.5 3.5 3.5c3 0 6-7 9-7 1.9 0 3.5 1.5 3.5 3.5s-1.6 3.5-3.5 3.5c-3 0-6-7-9-7z"/></svg>',
  timer:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 2.2M9.5 3h5M18.5 6.5l1.3-1.3"/></svg>',
  corta:'<svg class="ico" viewBox="0 0 24 24"><circle cx="6.5" cy="6.5" r="2.7"/><circle cx="6.5" cy="17.5" r="2.7"/><path d="M8.6 8.2L20 17M8.6 15.8L20 7"/></svg>',
  capa:'<svg class="ico" viewBox="0 0 24 24"><rect x="4.5" y="3" width="15" height="18" rx="2.5"/><path d="M4.5 16.5l4.2-4.2 3.3 3.3 2.4-2.4 5.1 5"/><circle cx="15" cy="8" r="1.6"/></svg>',
  som:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.4a8 8 0 0 1 0 11.2"/></svg>',
  mudo:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>'};
const rcAnim=()=>typeof ANIM_OK==="function"?ANIM_OK():true;
const rcSeg=s=>(Math.round(Math.max(0,s)*10)/10).toFixed(1).replace(".",",")+" s";
const rcTempo=s=>{s=Math.max(0,s);const m=Math.floor(s/60),x=s-m*60;return m+":"+(x<10?"0":"")+x.toFixed(1).replace(".",",")};
const rcTemOv=st=>!!st&&(st.tracos.length>0||st.els.some(e=>!ED_VIVOS.includes(e.t)));
async function rcFontes(st){try{await Promise.all(st.els.filter(e=>e.t==="texto").map(e=>document.fonts.load(edFonte(e.f,40),e.tx)).concat([document.fonts.load('900 40px "Public Sans"'),document.fonts.load('800 40px "Public Sans"')]));await document.fonts.ready}catch(e){}}
/* quadros de um vídeo com um só elemento (mais rápido que um vídeo por quadro) */
async function rcQuadros(url,ts,W,H,cada,k){const um=async idx=>{const v=document.createElement("video");v.muted=true;v.playsInline=true;v.setAttribute("playsinline","");v.preload="auto";v.src=url;
    await new Promise(r=>{if(v.readyState>=2)return r();v.onloadeddata=r;v.onerror=r;setTimeout(r,5000)});
    try{for(const i of idx){await vidSeek(v,ts[i]);const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.fillStyle="#111";g.fillRect(0,0,W,H);try{edCover(g,v,W,H,1,0,0)}catch(e){}if(cada(c,i)===false)break}}
    finally{v.removeAttribute("src");try{v.load()}catch(e){}}};
  k=Math.max(1,Math.min(k||3,ts.length));await Promise.all([...Array(k)].map((_,j)=>um(ts.map((_,i)=>i).filter(i=>i%k===j))))}
/* tira de quadros: lugares vazios logo, preenchidos conforme chegam */
function rcTira(box,url,ts,W,H){box.innerHTML=ts.map(()=>`<canvas class="ce-trq" width="${W}" height="${H}"></canvas>`).join("");const cs=[...box.children];
  return rcQuadros(url,ts,W,H,(c,i)=>{if(!box.isConnected)return false;const d=cs[i];if(d){d.getContext("2d").drawImage(c,0,0);d.classList.add("ok")}})}
/* ===== 1) cortar: tira de quadros com alças, janela e cursor ===== */
edTrim=function(o,max,vSel){$("#layer .ce-sel")?.remove();const d=Math.max(.5,o.dur||(o.vd&&o.vd.dur)||o.fim||1),url=o.url||(o.vd&&o.vd.url);
  if(o.ini==null)o.ini=0;if(o.fim==null||o.fim>d)o.fim=Math.min(d,max);
  const ov=document.createElement("div");ov.className="ce-sel ce-trim rc-trim";
  ov.innerHTML=`<div class="ce-selp"><div class="rc-tt"><b>Cortar</b><span class="ce-trd" id="ce-trd"></span></div>
    <div class="rc-fs" id="rc-fs"><div class="ce-trs" id="ce-trs"></div><i class="rc-dim rc-dl"></i><i class="rc-dim rc-dr"></i><div class="rc-win"><i class="rc-h rc-hl" data-h="i"></i><i class="rc-h rc-hr" data-h="f"></i></div><i class="rc-ph"></i></div>
    <div class="rc-tms"><span id="rc-ti"></span><span id="rc-tf"></span></div>
    <div class="rc-sr"><label>Início do trecho <input type="range" min="0" max="${d.toFixed(2)}" step="0.1" value="${(+o.ini).toFixed(2)}" data-trini></label><label>Fim do trecho <input type="range" min="0" max="${d.toFixed(2)}" step="0.1" value="${(+o.fim).toFixed(2)}" data-trfim></label></div>
    <p class="ce-selh">Arraste as bordas para escolher o trecho. Até ${max} segundos.</p><div class="ce-selb"><button type="button" class="btn" data-trok>Concluir</button></div></div>`;
  $("#layer .ce").appendChild(ov);
  const fs=ov.querySelector("#rc-fs"),win=ov.querySelector(".rc-win"),dl=ov.querySelector(".rc-dl"),dr=ov.querySelector(".rc-dr"),ph=ov.querySelector(".rc-ph"),ri=ov.querySelector("[data-trini]"),rf=ov.querySelector("[data-trfim]");
  const vid=()=>$(vSel)||$("#ce-bgv");
  const pinta=()=>{const a=o.ini/d*100,b=o.fim/d*100;win.style.left=a+"%";win.style.width=(b-a)+"%";dl.style.width=a+"%";dr.style.left=b+"%";
    $("#ce-trd").textContent=rcSeg(o.fim-o.ini);$("#rc-ti").textContent=rcTempo(o.ini);$("#rc-tf").textContent=rcTempo(o.fim);ri.value=o.ini;rf.value=o.fim;ri.setAttribute("aria-valuetext",rcTempo(o.ini));rf.setAttribute("aria-valuetext",rcTempo(o.fim))};
  const aj=(a,b,k)=>{if(k==="m"){const len=o.fim-o.ini;a=Math.max(0,Math.min(d-len,a));b=a+len}
    else{if(b-a<.5){if(k==="i")a=b-.5;else b=a+.5}if(b-a>max){if(k==="i")b=a+max;else a=b-max}a=Math.max(0,a);b=Math.min(d,b)}
    o.ini=Math.round(a*100)/100;o.fim=Math.round(b*100)/100;pinta()};
  const vai=(t,toca)=>{const v=vid();if(!v)return;if(!toca)v.pause();try{v.currentTime=Math.max(0,t)}catch(e){}if(toca)v.play().catch(()=>{})};
  ri.addEventListener("input",()=>{aj(+ri.value,+rf.value,"i");vai(o.ini,true)});rf.addEventListener("input",()=>{aj(+ri.value,+rf.value,"f");vai(Math.max(o.ini,o.fim-1),true)});
  let G=null;const tx=e=>{const r=fs.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*d};const q=x=>Math.round(x*10)/10;
  const mexe=t=>{if(!G)return;if(G.k==="i")aj(q(t),o.fim,"i");else if(G.k==="f")aj(o.ini,q(t),"f");else aj(q(G.a+t-G.t0),0,"m");vai(G.k==="f"?o.fim:o.ini)};
  fs.addEventListener("pointerdown",e=>{e.preventDefault();const t=tx(e),px=d/Math.max(1,fs.getBoundingClientRect().width),h=e.target.closest(".rc-h");
    const k=h?h.dataset.h:Math.abs(t-o.ini)<20*px?"i":Math.abs(t-o.fim)<20*px?"f":(t>o.ini&&t<o.fim)?"m":t<o.ini?"i":"f";
    G={k,t0:t,a:o.ini,id:e.pointerId};try{fs.setPointerCapture(e.pointerId)}catch(_){}fs.classList.add("arr");if(k!=="m")mexe(t);else vai(o.ini)});
  fs.addEventListener("pointermove",e=>{if(G&&e.pointerId===G.id)mexe(tx(e))});
  const solta=()=>{if(!G)return;G=null;fs.classList.remove("arr");vai(o.ini,true);vibrar(5)};fs.addEventListener("pointerup",solta);fs.addEventListener("pointercancel",solta);
  const laco=()=>{if(!ov.isConnected)return;const v=vid();if(v){if(!G&&!v.paused&&(v.currentTime>=o.fim-.03||v.currentTime<o.ini-.25))try{v.currentTime=o.ini}catch(e){}ph.style.left=Math.max(0,Math.min(100,v.currentTime/d*100))+"%";ph.hidden=!!G}requestAnimationFrame(laco)};
  pinta();laco();const v0=vid();if(v0&&v0.paused)v0.play().catch(()=>{});
  const box=$("#ce-trs");if(box&&url){const n=10;rcTira(box,url,[...Array(n)].map((_,i)=>d*(i+.5)/n),54,96)}};

/* ===== 2) Reels: o editor do story sobre o vídeo (texto, emoji, figurinhas visuais, desenho) ===== */
function rcSt(R){const vd=R.vd;if(!R.st){Object.assign(R,{tipo:"video",url:vd.url,v:vd.v,dur:vd.dur,blob:vd.blob,vw:vd.vw,vh:vd.vh});if(!R.img)R.img=vd.v;R.st={bg:R,els:[],tracos:[],ferr:null,_rl:1}}vd._rl=R;return R.st}
{const _ed96=edDesenha;edDesenha=function(){if(ED){const rv=ED.modo==="reel"&&ED.rl&&ED.rl.vd&&ED.rl.tela==="vid";if(rv)ED.st=rcSt(ED.rl);else if(ED.st&&ED.st._rl)ED.st=ED.sts[ED.si]||ED.sts[0]}return _ed96.apply(this,arguments)}}
rlVid=function(el){const R=ED.rl;ED.st=rcSt(R);edStory(el);
  el.querySelector(".ce-sts")?.remove();el.querySelector(".ce-modos")?.remove();el.querySelector("#ce-file")?.remove();
  const top=el.querySelector(".ce-top");if(top)top.innerHTML=`<button type="button" class="ce-b" data-rlvolta aria-label="Voltar">${EDI.vol}</button><span class="sp"></span>${R.boomF?`<span class="rc-tag">∞ Boomerang</span>`:""}`;
  const fer=[["data-edtexto",EDI.aa,"Texto"],["data-edfig",EDI.fig,"Figurinhas"],["data-edcaneta",EDI.caneta,"Desenhar"],R.boomF?null:["data-rltrim",RCI.corta,"Cortar"],["data-rlcapa",RCI.capa,"Capa"],R.boomF?null:["data-rlsom",R.mudo?RCI.mudo:RCI.som,R.mudo?"Sem som":"Som"]].filter(Boolean);
  const bot=el.querySelector(".ce-bot");const h=`<div class="rc-ferr" role="toolbar" aria-label="Editar o reel">${fer.map(([a,i,n])=>`<button type="button" ${a}${a==="data-rlsom"?` aria-pressed="${!!R.mudo}"`:""}><span class="rc-fi">${i}</span><span class="rc-fn">${n}</span></button>`).join("")}</div>
    <div class="ce-bot rc-bot"><span class="rl-dur">${rcSeg((R.fim||0)-(R.ini||0))}</span><span class="sp"></span><button type="button" class="ce-pub rl-av" data-rlav>Avançar <i>›</i></button></div>`;
  if(bot)bot.outerHTML=h;else el.insertAdjacentHTML("beforeend",h)};
/* figurinhas de resposta (enquete, quiz…) só funcionam nos stories; no reel ficam as visuais */
const RC_FIGS_REEL=["men","local","hash","hora"];
{const _fg96=edFigs;edFigs=function(){const r=_fg96.apply(this,arguments);if(ED&&ED.modo==="reel"){document.querySelectorAll("#layer .ce-fig [data-edfig]").forEach(b=>{if(!RC_FIGS_REEL.includes(b.dataset.edfig))b.remove()});
  $("#layer .ce-fig .ce-figs")?.insertAdjacentHTML("afterend",`<p class="rc-fignota">Enquete, quiz e outras figurinhas de resposta ficam só nos stories.</p>`)}return r}}
/* menção no reel também marca a pessoa */
{const _rp96=rlPublica;rlPublica=async function(){const R=ED&&ED.rl;if(R&&R.st&&!ED.env){const men=R.st.els.filter(e=>e.t==="men"&&e.uid).map(e=>e.uid);if(men.length)R.marcados=[...new Set([...(R.marcados||[]),...men])].slice(0,20)}return _rp96.apply(this,arguments)}}
/* capa e miniaturas do reel com o texto por cima (ou a foto da galeria escolhida como capa) */
{const _vq96=vidQuadro;vidQuadro=async function(vd,t,W,H,f){const R=vd&&vd._rl;if(R&&R.capaImg&&W>=150){const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.fillStyle="#000";g.fillRect(0,0,W,H);edCover(g,R.capaImg.img,W,H,1,0,0);return c}
  const c=await _vq96.apply(this,arguments);if(R&&W>=150&&rcTemOv(R.st)){try{await rcFontes(R.st);c.getContext("2d").drawImage(edOverlayCanvas(R.st,W,H,true),0,0,W,H)}catch(e){}}return c}}
/* a camada é desenhada em cada quadro do vídeo refeito (registro de trabalhos ativos) */
{const _cv96=edCover;edCover=function(g,img,W,H){const r=_cv96.apply(this,arguments);if(RC.jobs.length&&img&&img.tagName==="VIDEO"&&g&&g.canvas)for(const j of RC.jobs){if(g.canvas.width===j.W&&g.canvas.height===j.H&&W===j.W&&H===j.H&&img.src===j.url){try{g.drawImage(j.ov,0,0);j.usou=true}catch(e){}break}}return r}}

/* ===== 5) publicar mais rápido: sem refazer o vídeo quando não precisa ===== */
function rcPodePular(vd,o){try{if(!vd||!vd.blob||o.mudo||vd.boomF)return false;const dur=+vd.dur||0;if(!dur||!isFinite(dur))return false;
  if((o.ini||0)>.05||(o.fim||0)<dur-.15)return false;if(Math.abs((o.z||1)-1)>.01||Math.abs(o.ox||0)>.004||Math.abs(o.oy||0)>.004)return false;
  const t=String(vd.blob.type||"").split(";")[0],alvo=vidMime().split(";")[0];if(!(t==="video/mp4"||(t&&t===alvo)))return false;
  if(vd.blob.size>vidMB*.9||vd.blob.size/dur>700000)return false;return true}catch(e){return false}}
{const _vf96=vidFinal;vidFinal=async function(vd,o){const R=vd&&vd._rl,st=R&&R.st,boom=(R&&R.boomF)||(vd&&vd.boomF),temOv=!!(st&&rcTemOv(st));
  if(!boom&&!temOv&&rcPodePular(vd,o))return {blob:vd.blob,mime:String(vd.blob.type||"video/mp4").split(";")[0],ini:0,fim:+vd.dur,orig:true};
  let ovc=null;if(temOv){await rcFontes(st);ovc=edOverlayCanvas(st,o.W,o.H,true)}
  if(boom){try{const r=await rcBoomEnc(boom,3,o.W,o.H,o,ovc);return {blob:r.blob,mime:r.mime,ini:0,fim:r.dur}}catch(e){}}
  if(!ovc)return _vf96.apply(this,arguments);
  const job={W:o.W,H:o.H,url:new URL(vd.url,location.href).href,ov:ovc,usou:false};RC.jobs.push(job);
  try{const r=await _vf96.apply(this,arguments);if(r&&r.orig&&!job.usou)setTimeout(()=>toast("Este aparelho não conseguiu pôr o texto dentro do vídeo."),300);return r}
  finally{RC.jobs=RC.jobs.filter(x=>x!==job)}}}

/* ===== 3) capa: tira de quadros com seletor, prévia grande e foto da galeria ===== */
function rcCapa(){const R=ED&&ED.rl;if(!R||!R.vd)return;rcSt(R);R.capaOn=true;const ini=R.ini||0,fim=Math.max(ini+.1,R.fim||R.vd.dur||1);R.capa=Math.min(fim,Math.max(ini,R.capa==null?ini:R.capa));const capa0=R.capa,img0=R.capaImg||null;
  $("#layer .ce-sel")?.remove();$("#ce-bgv")?.pause();const ov=document.createElement("div");ov.className="ce-sel rc-capa";ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Escolher a capa");
  ov.innerHTML=`<div class="rc-cpt"><button type="button" class="rc-tl" data-rccapax>Cancelar</button><b>Capa</b><button type="button" class="rc-tl rc-ok" data-trok>Concluir</button></div>
    <div class="rc-cpw"><div class="rc-cpv" id="rc-cpv"><video id="rc-cpvid" muted playsinline preload="auto"></video><img id="rc-cpimg" alt="" hidden><img id="rc-cpov" alt="" hidden><i class="rc-45" aria-hidden="true"></i></div></div>
    <p class="rc-cph">A parte clara é a que aparece no Feed.</p>
    <div class="rc-fs rc-cfs" id="rc-cfs"><div class="ce-trs" id="rc-cts"></div><div class="rc-cbox" id="rc-cbox"><canvas width="96" height="170" id="rc-cbc"></canvas></div></div>
    <label class="rc-sr">Quadro da capa <input type="range" min="${ini.toFixed(2)}" max="${fim.toFixed(2)}" step="0.05" value="${R.capa.toFixed(2)}" data-rlcapat></label>
    <div class="rc-cpb"><button type="button" class="rc-galb" data-rccapagal>${EDI.gal}<span>Escolher da galeria</span></button></div><input type="file" id="rc-cpfile" accept="image/*" hidden>`;
  $("#layer .ce").appendChild(ov);
  const box=ov.querySelector("#rc-cpv"),wr=ov.querySelector(".rc-cpw"),v=ov.querySelector("#rc-cpvid"),im=ov.querySelector("#rc-cpimg"),oi=ov.querySelector("#rc-cpov"),cfs=ov.querySelector("#rc-cfs"),cb=ov.querySelector("#rc-cbox"),cbc=ov.querySelector("#rc-cbc"),rng=ov.querySelector("[data-rlcapat]");
  const enc=()=>{const r=wr.getBoundingClientRect();let h=r.height,w=h*9/16;if(w>r.width){w=r.width;h=w*16/9}box.style.width=w+"px";box.style.height=h+"px";if(v.videoWidth)edPosImg(v,R,box)};enc();
  if(rcTemOv(R.st)){rcFontes(R.st).then(()=>{try{oi.src=edOverlayCanvas(R.st,540,960,true).toDataURL("image/png");oi.hidden=!!R.capaImg}catch(e){}})}
  const modoImg=()=>{const on=!!R.capaImg;im.hidden=!on;v.style.visibility=on?"hidden":"";if(on)im.src=R.capaImg.url;oi.hidden=on||!oi.getAttribute("src");cb.classList.toggle("off",on)};
  const pintaBox=()=>{const g=cbc.getContext("2d");g.fillStyle="#111";g.fillRect(0,0,cbc.width,cbc.height);try{if(v.videoWidth)edCover(g,v,cbc.width,cbc.height,R.z||1,R.ox||0,R.oy||0)}catch(e){}};
  const posBox=()=>{const r=cfs.getBoundingClientRect(),bw=cb.offsetWidth||48,f=(R.capa-ini)/Math.max(.01,fim-ini);cb.style.left=(f*Math.max(0,r.width-bw))+"px";rng.value=R.capa;rng.setAttribute("aria-valuetext",rcTempo(R.capa))};
  let alvo=null;const vai=t=>{alvo=t;if(!v.seeking){try{v.currentTime=t}catch(e){}alvo=null}};
  v.addEventListener("seeked",()=>{if(alvo!=null){const t=alvo;alvo=null;try{v.currentTime=t}catch(e){}return}pintaBox()});
  v.addEventListener("loadedmetadata",()=>{enc();vai(R.capa)},{once:true});v.src=R.vd.url;
  const mostra=t=>{R.capa=Math.round(Math.min(fim,Math.max(ini,t))*100)/100;if(R.capaImg){R.capaImg=null;modoImg()}posBox();vai(R.capa)};
  rng.addEventListener("input",()=>mostra(+rng.value));
  let G=null;const tx=e=>{const r=cfs.getBoundingClientRect(),bw=cb.offsetWidth||48;return ini+Math.max(0,Math.min(1,(e.clientX-r.left-bw/2)/Math.max(1,r.width-bw)))*(fim-ini)};
  cfs.addEventListener("pointerdown",e=>{e.preventDefault();G=e.pointerId;try{cfs.setPointerCapture(e.pointerId)}catch(_){}cfs.classList.add("arr");mostra(tx(e))});
  cfs.addEventListener("pointermove",e=>{if(G===e.pointerId)mostra(tx(e))});["pointerup","pointercancel"].forEach(k=>cfs.addEventListener(k,()=>{if(G!=null){G=null;cfs.classList.remove("arr");vibrar(5)}}));
  ov.querySelector("#rc-cpfile").addEventListener("change",async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;try{const r=await edCarrega(f,1600);if(!ED||ED.rl!==R)return;R.capaImg={img:r.img,url:r.url};modoImg();toast("Capa da galeria escolhida")}catch(err){toast("Não deu para abrir essa foto.")}});
  ov._volta=()=>{R.capa=capa0;R.capaImg=img0};modoImg();posBox();
  requestAnimationFrame(posBox);
  const cts=$("#rc-cts");if(cts){const n=8;rcTira(cts,R.vd.url,[...Array(n)].map((_,i)=>ini+(fim-ini)*(i+.5)/n),54,96)}}

/* ===== 4) câmera: Boomerang, timer, toque duplo para virar, zoom e anel de progresso ===== */
function rcAnel(max){rcAnelFim();const sh=$("#layer .ce-shut");if(!sh)return;const n=max<=1.5?1:Math.min(15,Math.round(max)),Rr=46,C=2*Math.PI*Rr,seg=C/n,gap=n>1?2:0;
  sh.classList.add("rc-anel");sh.insertAdjacentHTML("beforeend",`<svg class="rc-ring" viewBox="0 0 100 100" aria-hidden="true"><defs><mask id="rc-mk" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><circle cx="50" cy="50" r="${Rr}" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="${(seg-gap).toFixed(2)} ${gap}"/></mask></defs><circle class="rc-rt" cx="50" cy="50" r="${Rr}" mask="url(#rc-mk)"/><circle class="rc-rp" cx="50" cy="50" r="${Rr}" mask="url(#rc-mk)" stroke-dasharray="0 ${C.toFixed(1)}"/></svg>`);
  const p=sh.querySelector(".rc-rp"),t0=Date.now();const laco=()=>{if(!p.isConnected)return;const f=Math.min(1,(Date.now()-t0)/(max*1000));p.setAttribute("stroke-dasharray",`${(f*C).toFixed(1)} ${C.toFixed(1)}`);sh.style.setProperty("--rcp",f);if(f<1)requestAnimationFrame(laco)};laco()}
function rcAnelFim(){document.querySelectorAll("#layer .rc-ring").forEach(x=>x.remove());document.querySelectorAll("#layer .ce-shut.rc-anel").forEach(x=>x.classList.remove("rc-anel"))}
{const _gi96=camGravaIni;camGravaIni=function(max){const r=_gi96.apply(this,arguments);if(r){rcAnel(max);$("#layer .ce")?.classList.add("rc-gravando")}return r}}
{const _gf96=camGravaFim;camGravaFim=function(){RC.livre=false;rcAnelFim();$("#layer .ce")?.classList.remove("rc-gravando");return _gf96.apply(this,arguments)}}
/* aviso curto dentro da câmera (não cobre o botão como o toast) */
function rcAviso(t){const ce=$("#layer .ce");if(!ce)return;ce.querySelector(".rc-aviso")?.remove();const a=document.createElement("div");a.className="rc-aviso";a.setAttribute("role","status");a.textContent=t;ce.appendChild(a);setTimeout(()=>{if(rcAnim()){a.classList.add("sai");setTimeout(()=>a.remove(),300)}else a.remove()},1700)}
/* "Abrindo o vídeo…" some quando o vídeo abre */
{const _vp96=edVidPronto;edVidPronto=async function(){const r=await _vp96.apply(this,arguments);document.querySelectorAll(".toast").forEach(x=>{if(/Abrindo o vídeo/.test(x.textContent))x.remove()});return r}}
/* contagem do timer (mãos livres) */
function rcConta(s,fim){rcContaPara();const cv=$("#ce-cv");if(!cv)return;cv.insertAdjacentHTML("beforeend",`<div class="rc-cd" id="rc-cd" role="status" aria-live="assertive"><b></b><small>Toque no botão para cancelar</small></div>`);$("#layer .ce")?.classList.add("rc-contando");
  let n=s;const passo=()=>{const b=$("#rc-cd b");if(!b)return;if(n<=0){rcContaPara();fim();return}b.textContent=n;if(rcAnim()){b.classList.remove("pop");void b.offsetWidth;b.classList.add("pop")}vibrar(4);n--;RC.cd=setTimeout(passo,1000)};passo()}
function rcContaPara(){clearTimeout(RC.cd);RC.cd=null;$("#rc-cd")?.remove();$("#layer .ce")?.classList.remove("rc-contando")}
document.addEventListener("visibilitychange",()=>{if(document.hidden)rcContaPara()});
/* Boomerang: ~1 s de quadros; prévia ida e volta; ao publicar, ida e volta 3 vezes */
async function rcBoomEnc(F,voltas,W,H,o,ovc){const mime=vidMime();if(!mime||!HTMLCanvasElement.prototype.captureStream||!F||!F.length)throw new Error("BOOM");
  const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");const ida=[...F.keys()],volta=ida.slice(1,-1).reverse(),seq=[];for(let i=0;i<voltas;i++)seq.push(...ida,...volta);
  const pinta=k=>{g.fillStyle="#000";g.fillRect(0,0,W,H);edCover(g,F[k],W,H,(o&&o.z)||1,(o&&o.ox)||0,(o&&o.oy)||0);if(ovc)g.drawImage(ovc,0,0,W,H)};pinta(seq[0]);
  const cs=c.captureStream(30);let rec;try{rec=new MediaRecorder(cs,{mimeType:mime,videoBitsPerSecond:2500000})}catch(e){cs.getTracks().forEach(t=>t.stop());throw e}
  const parts=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};const parou=new Promise(r=>rec.onstop=r);rec.start(200);const dt=1000/30,t0=performance.now();
  for(let i=0;i<seq.length;i++){pinta(seq[i]);if(o&&o.prog)o.prog(i/seq.length);const falta=t0+(i+1)*dt-performance.now();if(falta>0)await new Promise(r=>setTimeout(r,falta))}
  await new Promise(r=>setTimeout(r,dt*2));rec.stop();await parou;cs.getTracks().forEach(t=>t.stop());const blob=new Blob(parts,{type:mime.split(";")[0]});if(blob.size<2000)throw new Error("vazio");
  return {blob,mime:mime.split(";")[0],dur:+(seq.length*dt/1000).toFixed(2)}}
async function rcBoom(modo){const v=$("#ce-video");if(!v||!v.videoWidth||!CAM.s){toast("A câmera ainda não abriu.");return}
  if(!window.MediaRecorder||!vidMime()||!HTMLCanvasElement.prototype.captureStream){toast("Este navegador não grava Boomerang. Tire uma foto ou escolha um vídeo.");return}
  RC.ocupado=true;rcAnel(1);$("#layer .ce")?.classList.add("rc-gravando");vibrar(10);const F=[],W=540,H=960,esp=CAM.f==="user",t0=performance.now();let prox=t0;
  while(performance.now()-t0<1000&&F.length<24&&ED&&v.isConnected){const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");if(esp){g.translate(W,0);g.scale(-1,1)}
    const vw=v.videoWidth,vh=v.videoHeight,k=Math.max(W/vw,H/vh);g.drawImage(v,(W-vw*k)/2,(H-vh*k)/2,vw*k,vh*k);F.push(c);prox+=44;await new Promise(r=>setTimeout(r,Math.max(0,prox-performance.now())))}
  rcAnelFim();$("#layer .ce")?.classList.remove("rc-gravando");if(!ED||F.length<4){RC.ocupado=false;return}const sh=$("#layer .ce-shut");sh&&sh.classList.add("rc-proc");toast("Criando o Boomerang…");
  let r;try{r=await rcBoomEnc(F,1,720,1280,null,null)}catch(e){RC.ocupado=false;sh&&sh.classList.remove("rc-proc");toast("Não deu para criar o Boomerang neste navegador.");return}
  RC.ocupado=false;if(!ED)return;await edVidPronto(r.blob,modo);if(!ED)return;
  const bg=modo==="reel"?ED.rl:ED.st&&ED.st.bg,vd=modo==="reel"?bg&&bg.vd:bg;if(!bg||!vd||vd.blob!==r.blob)return;bg.boomF=F;bg.mudo=true;bg.ini=0;bg.fim=vd.dur||r.dur;if(modo!=="reel")vd.boomF=F;uso("boomerang");edDesenha()}
/* toque duplo vira a câmera; pinça faz zoom quando o aparelho deixa */
function rcVira(){if(CAM.rec||RC.ocupado||$("#rc-cd"))return;const b=$("#layer [data-edvira]");if(!b)return;const v=$("#ce-video");if(v&&rcAnim()){v.classList.remove("rc-gira");void v.offsetWidth;v.classList.add("rc-gira");setTimeout(()=>v.classList.remove("rc-gira"),450)}vibrar(6);b.click()}
function rcGestosCam(cv){if(!cv||cv._rc)return;cv._rc=1;let ult=0,px=0,py=0;const pts=new Map();let z0=null,d0=0;
  const dist=()=>{const [a,b]=[...pts.values()];return Math.hypot(a.x-b.x,a.y-b.y)||1};
  cv.addEventListener("pointerdown",e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2&&RC.zoom){d0=dist();z0=RC.zoom.v;RC.pinca=true}});
  cv.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2&&z0!=null)rcZoomPoe(z0*dist()/d0)});
  const fim=e=>{pts.delete(e.pointerId);if(pts.size<2&&z0!=null){z0=null;setTimeout(()=>{RC.pinca=false},350)}};cv.addEventListener("pointercancel",fim);
  cv.addEventListener("pointerup",e=>{fim(e);if(e.target.closest("button,input,.cam-msg")||RC.pinca)return;const n=Date.now();if(n-ult<330&&Math.hypot(e.clientX-px,e.clientY-py)<40){ult=0;rcVira();return}ult=n;px=e.clientX;py=e.clientY})}
function rcZoomUI(){const box=$("#rc-zoom");let tr=null,cap=null;try{tr=CAM.s&&CAM.s.getVideoTracks()[0];cap=tr&&tr.getCapabilities&&tr.getCapabilities().zoom}catch(e){}
  if(!tr||!cap||!(cap.max>cap.min)){RC.zoom=null;if(box)box.hidden=true;return}
  let z=cap.min;try{z=(tr.getSettings&&tr.getSettings().zoom)||cap.min}catch(e){}RC.zoom={tr,min:cap.min,max:Math.min(cap.max,cap.min*10),step:cap.step||.1,v:z};
  if(box){const r=box.querySelector("input");r.min=RC.zoom.min;r.max=RC.zoom.max;r.step=RC.zoom.step;r.value=z;box.hidden=false;rcZoomRotulo()}}
function rcZoomRotulo(){const l=$("#rc-zl");if(l&&RC.zoom)l.textContent=(RC.zoom.v/(RC.zoom.min||1)).toFixed(1).replace(".",",").replace(",0","")+"×"}
function rcZoomPoe(z){const Z=RC.zoom;if(!Z)return;Z.v=Math.max(Z.min,Math.min(Z.max,z));const r=$("#rc-zoom input");if(r)r.value=Z.v;rcZoomRotulo();if(Z.pend)return;Z.pend=true;
  requestAnimationFrame(()=>{Z.pend=false;try{Z.tr.applyConstraints({advanced:[{zoom:Z.v}]}).catch(()=>{})}catch(e){}})}
{const _cl96=camLiga;camLiga=async function(){const r=await _cl96.apply(this,arguments);try{rcZoomUI()}catch(e){}return r}}
function rcRail(){document.querySelectorAll("#layer [data-rcboom]").forEach(b=>{b.classList.toggle("on",RC.boom);b.setAttribute("aria-pressed",String(RC.boom))});
  document.querySelectorAll("#layer [data-rctimer]").forEach(b=>{b.classList.toggle("on",!!RC.tm);b.setAttribute("aria-label",RC.tm?`Timer de ${RC.tm} segundos`:"Timer desligado");b.firstElementChild.outerHTML=RC.tm?`<b class="rc-tmb">${RC.tm}s</b>`:RCI.timer});
  const sh=$("#layer .ce.t-cam [data-edfoto],#layer .ce.t-rcam [data-rlgrava]");if(sh){sh.classList.toggle("rc-boom",RC.boom);const i=sh.querySelector("i");if(i)i.innerHTML=RC.boom?RCI.boom:"";sh.setAttribute("aria-label",RC.boom?"Gravar Boomerang":sh.hasAttribute("data-rlgrava")?"Gravar":"Tirar foto")}}
function rcCamExtra(el){let rail=el.querySelector(".ce-rail");if(!rail){el.insertAdjacentHTML("beforeend",`<div class="ce-rail rc-rail"></div>`);rail=el.querySelector(".ce-rail")}
  rail.insertAdjacentHTML("beforeend",`<button type="button" data-rcboom aria-pressed="false">${RCI.boom}<span>Boomerang</span></button><button type="button" data-rctimer>${RCI.timer}<span>Timer</span></button>`);
  el.insertAdjacentHTML("beforeend",`<div class="rc-zoom" id="rc-zoom" hidden><input type="range" min="1" max="2" step="0.1" value="1" aria-label="Zoom"><b id="rc-zl">1×</b></div>`);
  el.querySelector("#rc-zoom input").addEventListener("input",e=>rcZoomPoe(+e.target.value));rcGestosCam(el.querySelector("#ce-cv"));rcRail();rcZoomUI()}
{const _ct96=edCamTela;edCamTela=function(el){const r=_ct96.apply(this,arguments);rcContaPara();rcCamExtra(el);return r}}
rlCam=(function(ant){return function(el){const r=ant.apply(this,arguments);rcContaPara();rcCamExtra(el);return r}})(rlCam);
{const _ca96=criarAbrir;criarAbrir=function(){RC.boom=false;RC.tm=0;RC.livre=false;RC.ocupado=false;rcContaPara();return _ca96.apply(this,arguments)}}
/* Boomerang no story: sem corte e sem som */
{const _es96=edStory;edStory=function(el){const r=_es96.apply(this,arguments);const b=ED&&ED.st&&ED.st.bg;if(b&&b.tipo==="video"&&b.boomF&&!ED.st._rl){el.querySelector("[data-edtrim]")?.remove();el.querySelector("[data-edmudo]")?.remove();el.querySelector(".ce-top .sp")?.insertAdjacentHTML("afterend",`<span class="rc-tag">∞ Boomerang</span>`)}return r}}
/* o botão da câmera no modo Boomerang/timer não grava ao segurar */
window.addEventListener("pointerdown",e=>{const b=e.target.closest&&e.target.closest("#layer .ce.t-cam [data-edfoto]");if(!b||!ED)return;if(RC.livre&&CAM.rec){e.stopPropagation();ED._gravou=Date.now();camGravaFim();return}if(RC.boom||RC.tm||RC.livre||RC.ocupado||$("#rc-cd"))e.stopPropagation()},true);
window.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&RC.livre&&CAM.rec&&e.target.closest&&e.target.closest("#layer .ce.t-cam [data-edfoto]")){e.preventDefault();e.stopPropagation();if(ED)ED._gravou=Date.now();camGravaFim()}},true);
/* cliques (antes dos cliques antigos, para poder trocar o comportamento) */
window.addEventListener("click",e=>{const t=e.target;if(!t.closest||!ED||!$("#layer .ce")||t.closest("#layer2"))return;let b;const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  const cam=$("#layer .ce.t-cam,#layer .ce.t-rcam");
  if(cam&&(b=t.closest("[data-edfoto],[data-rlgrava]"))&&cam.contains(b)){const modo=ED.modo==="reel"?"reel":"story";
    if($("#rc-cd")){pare();rcContaPara();rcAviso("Timer cancelado");return}
    if(RC.ocupado){pare();return}
    if(CAM.rec){if(RC.livre||modo==="reel"){pare();camGravaFim()}return}
    if(RC.boom){pare();if(!CAM.s){toast("A câmera ainda não abriu.");return}if(RC.tm)rcConta(RC.tm,()=>{if(ED)rcBoom(modo)});else rcBoom(modo);return}
    if(RC.tm){pare();if(!CAM.s){$(modo==="reel"?"#rl-file":"#ce-file")?.click();return}rcConta(RC.tm,()=>{if(!ED||!CAM.s)return;if(camGravaIni(modo==="reel"?30:15,bl=>edVidPronto(bl,modo)))RC.livre=true});return}
    return}
  if(t.closest("[data-rcboom]")){pare();if(CAM.rec||RC.ocupado)return;RC.boom=!RC.boom;rcRail();rcAviso(RC.boom?"Boomerang: toque no botão para gravar":"Boomerang desligado");return}
  if(t.closest("[data-rctimer]")){pare();if(CAM.rec||RC.ocupado)return;RC.tm=RC.tm===0?3:RC.tm===3?10:0;rcRail();rcAviso(RC.tm?`Timer de ${RC.tm} s: a gravação começa sozinha`:"Timer desligado");return}
  if(ED.modo==="reel"&&ED.rl&&ED.rl.tela==="vid"){if(ED.env&&t.closest("[data-rlsom],[data-rlcapa],[data-rccapax],[data-rccapagal]")){pare();return}
    if(b=t.closest("[data-rlsom]")){pare();const R=ED.rl;R.mudo=!R.mudo;ED._mPrev=false;const v=$("#ce-bgv");if(v){v.muted=R.mudo;v.play().catch(()=>{})}b.setAttribute("aria-pressed",String(R.mudo));const fi=b.querySelector(".rc-fi"),fn=b.querySelector(".rc-fn");if(fi)fi.innerHTML=R.mudo?RCI.mudo:RCI.som;if(fn)fn.textContent=R.mudo?"Sem som":"Som";toast(R.mudo?"Reel sem som":"Reel com som");return}
    if(t.closest("[data-rlcapa]")){pare();rcCapa();return}
    if(t.closest("[data-rccapax]")){pare();const ov=$("#layer .rc-capa");if(ov&&ov._volta)ov._volta();ov?.remove();ED.rl.capaOn=false;edDesenha();return}
    if(t.closest("[data-rccapagal]")){pare();$("#rc-cpfile")?.click();return}}},true);
