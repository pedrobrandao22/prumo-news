/* ---------- 096: câmera do story — Boomerang, timer, zoom, toque duplo; vídeo refeito com a camada (a criação de Reels saiu em 13/11) ---------- */
var RC={ocupado:false,zoom:null,pinca:false};
const rcAnim=()=>typeof ANIM_OK==="function"?ANIM_OK():true;
const rcSeg=s=>(Math.round(Math.max(0,s)*10)/10).toFixed(1).replace(".",",")+" s";
const rcTempo=s=>{s=Math.max(0,s);const m=Math.floor(s/60),x=s-m*60;return m+":"+(x<10?"0":"")+x.toFixed(1).replace(".",",")};
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


/* ===== 2) publicar mais rápido: sem refazer o vídeo quando não precisa ===== */
function rcPodePular(vd,o){try{if(!vd||!vd.blob||o.mudo||vd.boomF)return false;const dur=+vd.dur||0;if(!dur||!isFinite(dur))return false;
  if((o.ini||0)>.05||(o.fim||0)<dur-.15)return false;if(Math.abs((o.z||1)-1)>.01||Math.abs(o.ox||0)>.004||Math.abs(o.oy||0)>.004)return false;
  const t=String(vd.blob.type||"").split(";")[0],alvo=vidMime().split(";")[0];if(!(t==="video/mp4"||(t&&t===alvo)))return false;
  if(vd.blob.size>vidMB*.9||vd.blob.size/dur>700000)return false;return true}catch(e){return false}}
{const _vf96=vidFinal;vidFinal=async function(vd,o){if(rcPodePular(vd,o))return {blob:vd.blob,mime:String(vd.blob.type||"video/mp4").split(";")[0],ini:0,fim:+vd.dur,orig:true};return _vf96.apply(this,arguments)}}

/* ===== 3) câmera: anel de progresso ao gravar, toque duplo para virar e zoom ===== */
function rcAnel(max){rcAnelFim();const sh=$("#layer .ce-shut");if(!sh)return;const n=max<=1.5?1:Math.min(15,Math.round(max)),Rr=46,C=2*Math.PI*Rr,seg=C/n,gap=n>1?2:0;
  sh.classList.add("rc-anel");sh.insertAdjacentHTML("beforeend",`<svg class="rc-ring" viewBox="0 0 100 100" aria-hidden="true"><defs><mask id="rc-mk" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><circle cx="50" cy="50" r="${Rr}" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="${(seg-gap).toFixed(2)} ${gap}"/></mask></defs><circle class="rc-rt" cx="50" cy="50" r="${Rr}" mask="url(#rc-mk)"/><circle class="rc-rp" cx="50" cy="50" r="${Rr}" mask="url(#rc-mk)" stroke-dasharray="0 ${C.toFixed(1)}"/></svg>`);
  const p=sh.querySelector(".rc-rp"),t0=Date.now();const laco=()=>{if(!p.isConnected)return;const f=Math.min(1,(Date.now()-t0)/(max*1000));p.setAttribute("stroke-dasharray",`${(f*C).toFixed(1)} ${C.toFixed(1)}`);sh.style.setProperty("--rcp",f);if(f<1)requestAnimationFrame(laco)};laco()}
function rcAnelFim(){document.querySelectorAll("#layer .rc-ring").forEach(x=>x.remove());document.querySelectorAll("#layer .ce-shut.rc-anel").forEach(x=>x.classList.remove("rc-anel"))}
{const _gi96=camGravaIni;camGravaIni=function(max){const r=_gi96.apply(this,arguments);if(r){rcAnel(max);$("#layer .ce")?.classList.add("rc-gravando")}return r}}
{const _gf96=camGravaFim;camGravaFim=function(){rcAnelFim();$("#layer .ce")?.classList.remove("rc-gravando");return _gf96.apply(this,arguments)}}
/* aviso curto dentro da câmera (não cobre o botão como o toast) */
function rcAviso(t){const ce=$("#layer .ce");if(!ce)return;ce.querySelector(".rc-aviso")?.remove();const a=document.createElement("div");a.className="rc-aviso";a.setAttribute("role","status");a.textContent=t;ce.appendChild(a);setTimeout(()=>{if(rcAnim()){a.classList.add("sai");setTimeout(()=>a.remove(),300)}else a.remove()},1700)}
/* "Abrindo o vídeo…" some quando o vídeo abre */
{const _vp96=edVidPronto;edVidPronto=async function(){const r=await _vp96.apply(this,arguments);document.querySelectorAll(".toast").forEach(x=>{if(/Abrindo o vídeo/.test(x.textContent))x.remove()});return r}}
/* toque duplo vira a câmera; pinça faz zoom quando o aparelho deixa */
function rcVira(){if(CAM.rec||RC.ocupado)return;const b=$("#layer [data-edvira]");if(!b)return;const v=$("#ce-video");if(v&&rcAnim()){v.classList.remove("rc-gira");void v.offsetWidth;v.classList.add("rc-gira");setTimeout(()=>v.classList.remove("rc-gira"),450)}vibrar(6);b.click()}
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
function rcCamExtra(el){let rail=el.querySelector(".ce-rail");if(!rail){el.insertAdjacentHTML("beforeend",`<div class="ce-rail rc-rail"></div>`);rail=el.querySelector(".ce-rail")}
  el.insertAdjacentHTML("beforeend",`<div class="rc-zoom" id="rc-zoom" hidden><input type="range" min="1" max="2" step="0.1" value="1" aria-label="Zoom"><b id="rc-zl">1×</b></div>`);
  el.querySelector("#rc-zoom input").addEventListener("input",e=>rcZoomPoe(+e.target.value));rcGestosCam(el.querySelector("#ce-cv"));rcZoomUI()}
{const _ct96=edCamTela;edCamTela=function(el){const r=_ct96.apply(this,arguments);rcCamExtra(el);return r}}
{const _ca96=criarAbrir;criarAbrir=function(){RC.ocupado=false;return _ca96.apply(this,arguments)}}
