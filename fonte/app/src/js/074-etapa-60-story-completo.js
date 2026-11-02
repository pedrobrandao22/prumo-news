/* ---------- Etapa 60: story completo ---------- */
var CAM={s:null,sf:null,f:"environment",erro:null,flash:false,pedido:0};
var MA={on:null,set:new Set(),uid:null};
const ED_LAYS={"2v":[[0,0,1,.5],[0,.5,1,.5]],"2h":[[0,0,.5,1],[.5,0,.5,1]],"3":[[0,0,1,1/3],[0,1/3,1,1/3],[0,2/3,1,1/3]],"4":[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]],"6":[[0,0,.5,1/3],[.5,0,.5,1/3],[0,1/3,.5,1/3],[.5,1/3,.5,1/3],[0,2/3,.5,1/3],[.5,2/3,.5,1/3]]};
const ED_LAYO=["2v","2h","3","4","6"];
const ED_ANIMS=[["","Sem animação"],["digitar","Digitar"],["surgir","Surgir"],["pulsar","Pulsar"],["onda","Onda"]];
var ED_VIVOS=["enq","nt"];
Object.assign(EDI,{vira:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 9a8 8 0 0 1 14-3l2 2"/><path d="M20 4v4h-4"/><path d="M20 15a8 8 0 0 1-14 3l-2-2"/><path d="M4 20v-4h4"/></svg>',flash:'<svg class="ico" viewBox="0 0 24 24"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>',lay:'<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 4v16M4 12h8"/></svg>',salvar:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 19h14"/></svg>'});
function edNovoSt(){return {bg:{tipo:"grad",g:Math.floor(Math.random()*PUB_FUNDOS.length)},els:[],tracos:[],ferr:null}}
function edStTem(st){return st.els.length||st.tracos.length||st.bg.tipo!=="grad"}
function edJpeg(c,max){max=max||980000;return (async()=>{let b=null;for(const q of [.86,.8,.72,.64,.56,.48]){b=await new Promise((ok,no)=>c.toBlob(x=>x?ok(x):no(new Error("img")),"image/jpeg",q));if(b.size<=max)return b}return b})()}

/* abrir: o story começa na câmera */
criarAbrir=function(tipo){if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}uso("criar_"+tipo);if($("#layer").innerHTML)closeLayer();
  const st=edNovoSt();ED={modo:tipo==="story"?"story":"post",tela:"cam",env:false,st,sts:[st],si:0,po:{passo:"fotos",fotos:[],cur:0,ar:"4:5",texto:"",marcados:[],local:"",pid:null,aba:"filtros"}};
  $("#layer").innerHTML=`<div class="ce" role="dialog" aria-modal="true" aria-label="Criar"></div>`;if(pushH())HST++;edDesenha()};
edTemAlgo=function(){if(!ED)return false;return (ED.st.tx&&String(ED.st.tx.tx||"").trim())||ED.sts.some(edStTem)||ED.po.fotos.length||ED.po.texto.trim()||ED.po.pid};
edDesenha=function(){const el=$("#layer .ce");if(!el||!ED)return;el.className="ce ce-"+ED.modo+(ED.modo==="story"?" t-"+ED.tela:"");
  if(ED.modo==="story"){if(ED.tela==="cam")edCamTela(el);else if(ED.tela==="lay")edLayTela(el);else{camDesliga();edStory(el)}}else{camDesliga();edPost(el)}};

/* ===== câmera ===== */
async function camLiga(){const v=$("#ce-video");if(!v)return;if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){camErro("sem");return}
  if(CAM.s&&CAM.sf===CAM.f&&CAM.s.getVideoTracks().some(t=>t.readyState==="live")){v.srcObject=CAM.s;v.play().catch(()=>{});return}
  camDesliga();const pedido=CAM.pedido=Date.now();
  try{const vq={facingMode:{ideal:CAM.f},width:{ideal:1920},height:{ideal:1080}};let st;try{st=await navigator.mediaDevices.getUserMedia({video:vq,audio:CAM.mic!==false})}catch(e1){if(CAM.mic===false||e1&&e1.name==="NotFoundError"&&!/audio/i.test(e1.message||""))throw e1;CAM.mic=false;st=await navigator.mediaDevices.getUserMedia({video:vq,audio:false})}
    if(pedido!==CAM.pedido||!ED||!(ED.modo==="reel"?ED.rl&&ED.rl.tela==="cam":ED.modo==="story"&&(ED.tela!=="edit"||$("#layer .ce-selfie")))){st.getTracks().forEach(t=>t.stop());return}
    CAM.s=st;CAM.sf=CAM.f;CAM.erro=null;const vv=$("#ce-video");if(vv){vv.srcObject=st;vv.play().catch(()=>{})}const m=$("#cam-msg");if(m)m.hidden=true}
  catch(e){if(pedido===CAM.pedido)camErro(e&&e.name)}}
function camErro(n){CAM.erro=n||"erro";const m=$("#cam-msg");if(!m)return;m.hidden=false;const bloq=n==="NotAllowedError"||n==="SecurityError";
  m.innerHTML=`<b>${bloq?"Câmera bloqueada":"Câmera indisponível"}</b><span>${bloq?"Libere a câmera para o Prumo nos ajustes do navegador, ou use a galeria.":"Use uma foto da galeria ou o modo Criar."}</span><button type="button" class="ce-chip on" data-edgal>Abrir a galeria</button>`}
function camMonta(){const sl=$("#layer .cam-slot");if(!sl)return;if(!CAM.v){CAM.v=document.createElement("video");CAM.v.id="ce-video";CAM.v.muted=true;CAM.v.playsInline=true;CAM.v.autoplay=true;CAM.v.setAttribute("playsinline","");CAM.v.setAttribute("muted","")}
  CAM.v.classList.toggle("esp",CAM.f==="user");sl.appendChild(CAM.v);if(CAM.v.srcObject)CAM.v.play().catch(()=>{})}
function camDesliga(){CAM.pedido=0;if(CAM.v){try{CAM.v.pause()}catch(e){}CAM.v.srcObject=null}if(CAM.s){CAM.s.getTracks().forEach(t=>{try{t.stop()}catch(e){}});CAM.s=null;CAM.sf=null}}
async function camFoto(W,H){const v=$("#ce-video");if(!v)return null;for(let i=0;i<30&&!v.videoWidth;i++)await sleepMs(50);if(!v.videoWidth)return null;
  if(CAM.flash){if(CAM.f==="user"){const fl=document.createElement("div");fl.className="cam-tela";document.body.appendChild(fl);await sleepMs(260);setTimeout(()=>fl.remove(),120)}
    else{const tr=CAM.s&&CAM.s.getVideoTracks()[0];try{if(tr&&tr.getCapabilities&&tr.getCapabilities().torch){await tr.applyConstraints({advanced:[{torch:true}]});await sleepMs(350);setTimeout(()=>tr.applyConstraints({advanced:[{torch:false}]}).catch(()=>{}),200)}}catch(e){}}}
  const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");if(CAM.f==="user"){g.translate(W,0);g.scale(-1,1)}
  const vw=v.videoWidth,vh=v.videoHeight,k=Math.max(W/vw,H/vh);g.drawImage(v,(W-vw*k)/2,(H-vh*k)/2,vw*k,vh*k);
  const b=await new Promise(ok=>c.toBlob(ok,"image/jpeg",.92));if(!b)return null;const {img,url}=await edImg(b);vibrar(8);return {blob:b,img,url}}
const sleepMs=ms=>new Promise(r=>setTimeout(r,ms));
function edCamTela(el){
  el.innerHTML=`<div class="ce-palco"><div class="ce-cv ce-cam" id="ce-cv"><div class="cam-slot"></div><div class="cam-msg" id="cam-msg" hidden></div></div></div>
    <div class="ce-top"><button type="button" class="ce-b" data-edfechar aria-label="Fechar">${EDI.x}</button><span class="sp"></span><button type="button" class="ce-b ce-flb" data-edflash aria-pressed="${CAM.flash}" aria-label="Flash">${EDI.flash}</button></div>
    <div class="ce-rail"><button type="button" data-edcriar><b class="ce-aa">Aa</b><span>Criar</span></button><button type="button" data-edlayout>${EDI.lay}<span>Layout</span></button></div>
    <div class="ce-cbot"><button type="button" class="ce-gal" data-edgal aria-label="Galeria">${EDI.gal}</button><button type="button" class="ce-shut" data-edfoto aria-label="Tirar foto"><i></i></button><button type="button" class="ce-b ce-vira" data-edvira aria-label="Virar a câmera">${EDI.vira}</button></div>
    ${edModos()}<input type="file" id="ce-file" accept="image/*,video/*" multiple hidden>`;
  camMonta();edEncaixa();edArqStory();if(CAM.erro&&CAM.erro!=="NotReadableError")camErro(CAM.erro);camLiga()}
/* ===== layout ===== */
function edLayTela(el){const b=ED.st.bg,cs=ED_LAYS[b.lay],cheio=b.cel.every(Boolean);
  el.innerHTML=`<div class="ce-palco"><div class="ce-cv ce-lay" id="ce-cv">${cs.map((r,i)=>`<div class="ce-cel${i===b.ativa?" on":""}" data-edcel="${i}" style="left:${r[0]*100}%;top:${r[1]*100}%;width:${r[2]*100}%;height:${r[3]*100}%">${b.cel[i]?`<img alt="" data-ci="${i}">${i===b.ativa?`<i class="ce-celx" data-edcelx="${i}" role="button" aria-label="Tirar a foto">✕</i>`:""}`:i===b.ativa?`<div class="cam-slot"></div>`:`<span>+</span>`}</div>`).join("")}<div class="cam-msg" id="cam-msg" hidden></div></div></div>
    <div class="ce-top"><button type="button" class="ce-b" data-edlaysai aria-label="Sair do Layout">${EDI.x}</button><span class="sp"></span><button type="button" class="ce-b ce-flb" data-edflash aria-pressed="${CAM.flash}" aria-label="Flash">${EDI.flash}</button></div>
    <div class="ce-rail"><button type="button" data-edgrade><i class="ce-gr g${b.lay}"></i><span>Grade</span></button><button type="button" class="on" data-edlaysai>${EDI.lay}<span>Layout</span></button></div>
    <div class="ce-cbot"><button type="button" class="ce-gal" data-edgal aria-label="Galeria">${EDI.gal}</button>${cheio?`<button type="button" class="ce-shut ok" data-edlayok aria-label="Pronto"><i>✓</i></button>`:`<button type="button" class="ce-shut" data-edfoto aria-label="Tirar foto"><i></i></button>`}<button type="button" class="ce-b ce-vira" data-edvira aria-label="Virar a câmera">${EDI.vira}</button></div>
    ${edModos()}<input type="file" id="ce-file" accept="image/*" hidden>`;
  el.querySelectorAll("img[data-ci]").forEach(im=>{im.src=b.cel[+im.dataset.ci].url});camMonta();edEncaixa();edArqStory();if(!b.cel[b.ativa]&&!cheio)camLiga();else if(cheio)camDesliga()}
function edLayProxima(){const b=ED.st.bg;const i=b.cel.findIndex(x=>!x);b.ativa=i<0?b.ativa:i}
/* ===== arquivos da galeria ===== */
function edArqStory(){const f=$("#ce-file");if(!f)return;f.addEventListener("change",async e=>{const fs=[...e.target.files];e.target.value="";if(!fs.length||!ED)return;const ehV=x=>/^video\//.test(x.type)||/\.(mov|mp4|webm|m4v)$/i.test(x.name);if(fs.some(ehV)&&ED.tela!=="lay"){const lim=Math.max(1,10-ED.sts.length+(edStOcupado(ED.st)?0:1));if(fs.length>lim)toast("Dá para mandar até 10 stories de uma vez.");for(const x of fs.slice(0,lim)){if(!ED)return;if(ehV(x))await edVidPronto(x,"story",true);else{try{const r=await edCarrega(x,2048);const st=edNovoSt();st.bg={tipo:"foto",...r,z:1,ox:0,oy:0,f:"normal"};if(edStOcupado(ED.st)){ED.sts.splice(ED.si+1,0,st);ED.si++}else{st.els=ED.st.els;st.tracos=ED.st.tracos;ED.sts.splice(ED.si,1,st)}ED.st=ED.sts[ED.si]}catch(err){toast("Não deu para abrir uma das fotos.")}}}if(ED){ED.tela="edit";edDesenha()}return}
  if(ED.tela==="lay"){try{const r=await edCarrega(fs[0],2048);const b=ED.st.bg;b.cel[b.ativa]={...r,z:1,ox:0,oy:0};edLayProxima();edDesenha()}catch(err){toast("Não deu para abrir essa foto.")}return}
  const tot=fs.length,lim=Math.max(0,10-ED.sts.length+(edStTem(ED.st)?0:1));if(tot>lim)toast("Dá para mandar até 10 stories de uma vez.");
  const novos=[];for(const x of fs.slice(0,lim)){try{const r=await edCarrega(x,2048);const st=edNovoSt();st.bg={tipo:"foto",...r,z:1,ox:0,oy:0,f:"normal"};novos.push(st)}catch(err){toast("Não deu para abrir uma das fotos.")}}
  if(!novos.length||!ED)return;if(edStOcupado(ED.st)){ED.sts.splice(ED.si+1,0,...novos);ED.si=ED.si+1}else{novos[0].els=ED.st.els;novos[0].tracos=ED.st.tracos;ED.sts.splice(ED.si,1,...novos)}
  ED.st=ED.sts[ED.si];ED.tela="edit";edDesenha()})}

/* ===== editor ===== */
function edFiltSrc(o,f){if(!f||f==="normal")return o.url;o._f=o._f||{};if(o._f[f])return o._f[f];const im=o.img,k=Math.min(1,1280/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);edFiltra(c,f,{});return o._f[f]=c.toDataURL("image/jpeg",.9)}
function edBgSrcs(){const b=ED.st.bg;if(b.tipo==="foto"){const i=$("#ce-bgi");if(i)i.src=edFiltSrc(b,b.f)}else if(b.tipo==="layout")document.querySelectorAll("#ce-cv .ce-bg img[data-ci]").forEach(im=>{const o=b.cel[+im.dataset.ci];if(o)im.src=edFiltSrc(o,b.f)})}
edBgPos=function(){const b=ED&&ED.st.bg;if(!b)return;const cv=$("#ce-cv");if(!cv)return;
  if(b.tipo==="foto"){const i=$("#ce-bgi");if(i&&b.img){edLimita(b,cv);edPosImg(i,b,cv)}}
  else if(b.tipo==="layout")cv.querySelectorAll(".ce-bg img[data-ci]").forEach(im=>{const o=b.cel[+im.dataset.ci];if(o)edPosImg(im,o,im.parentElement)})};
function edTxtHTML(e){const inner=e.an==="digitar"?edGraf(String(e.tx)).map((ch,i)=>ch==="\n"?"<br>":`<i class="ch" style="--i:${i}">${esc(ch)}</i>`).join(""):esc(e.tx).replace(/\n/g,"<br>");
  return `<div class="ce-t f-${e.f} al-${e.al||"c"}${e.fd?" fd"+e.fd:""}${e.an?" an-"+e.an:""}" style="--cor:${e.cor};--tam:${e.tam||1}"><span>${inner}</span></div>`}
{const _eh60=edElHTML;edElHTML=function(e){if(e.t!=="texto")return _eh60.apply(this,arguments);return `<div class="ce-el" data-eid="${e.id}" style="left:${e.x*100}%;top:${e.y*100}%;transform:translate(-50%,-50%) rotate(${e.r||0}deg) scale(${e.s||1})">${edTxtHTML(e)}</div>`}}
edStory=function(el){const st=ED.st,b=st.bg,foto=b.tipo==="foto",lay=b.tipo==="layout",multi=ED.sts.length>1;
  const bgIn=foto?`<img id="ce-bgi" alt="" draggable="false">`:lay?ED_LAYS[b.lay].map((r,i)=>`<div class="ce-cel" style="left:${r[0]*100}%;top:${r[1]*100}%;width:${r[2]*100}%;height:${r[3]*100}%">${b.cel[i]?`<img alt="" data-ci="${i}" draggable="false">`:""}</div>`).join(""):"";
  const n=ED.envN;
  el.innerHTML=`<div class="ce-palco"><div class="ce-cv" id="ce-cv"><div class="ce-bg" style="background:${foto||lay?"#000":pubFundo(b.g)}">${bgIn}</div><canvas id="ce-draw" class="ce-draw"></canvas><div class="ce-els" id="ce-els"></div><i class="ce-gv" id="ce-gv" hidden></i><i class="ce-gh" id="ce-gh" hidden></i><div class="ce-fn" id="ce-fn"></div>${!st.els.length&&!st.tracos.length&&!foto&&!lay?`<div class="ce-dica">Toque para escrever<br><small>arraste para o lado para trocar a cor</small></div>`:""}<div class="ce-lixo" id="ce-lixo" hidden>${EDI.lixo}</div></div></div>
    <div class="ce-top"><button type="button" class="ce-b" data-edfechar aria-label="Fechar">${EDI.x}</button><span class="sp"></span><button type="button" class="ce-b" data-edsalvar aria-label="Salvar no celular">${EDI.salvar}</button><button type="button" class="ce-b" data-edtexto aria-label="Texto">${EDI.aa}</button><button type="button" class="ce-b" data-edfig aria-label="Figurinhas">${EDI.fig}</button><button type="button" class="ce-b" data-edcaneta aria-label="Desenhar">${EDI.caneta}</button></div>
    ${multi?`<div class="ce-sts">${ED.sts.map((x,i)=>`<button type="button" class="ce-stb${i===ED.si?" on":""}" data-edsti="${i}" aria-label="Story ${i+1}"><canvas width="54" height="96" data-stt="${i}"></canvas>${i===ED.si?`<i data-edstx="${i}" role="button" aria-label="Tirar este story">✕</i>`:""}</button>`).join("")}${ED.sts.length<10?`<button type="button" class="ce-stb ce-stm" data-edgal aria-label="Mais fotos">+</button>`:""}</div>`:""}
    <div class="ce-bot"><button type="button" class="ce-gal" data-edgal aria-label="Galeria">${foto?`<img alt="" id="ce-galt">`:EDI.gal}</button><span class="sp"></span>
      ${MA.on?`<button type="button" class="ce-pub ma" data-edpubst="proximos" ${ED.env?"disabled":""} aria-label="Mandar para os Melhores amigos"><i class="ma-ic">★</i><span>Melhores amigos</span></button>`:""}
      <button type="button" class="ce-pub" data-edpubst="amigos" ${ED.env?"disabled":""}>${avatar(S.uid)}<span>${ED.env?(n&&n[1]>1?`Publicando ${Math.min(n[0]+1,n[1])}/${n[1]}…`:"Publicando…"):"Seu story"}</span><i>›</i></button></div>
    ${edModos()}<input type="file" id="ce-file" accept="image/*,video/*" multiple hidden>`;
  if(foto){$("#ce-galt").src=b.url}edBgSrcs();edEncaixa();edEls();edTracos();edGestos();edArqStory();if(multi)edStThumbs()};
function edStThumbs(){document.querySelectorAll("#layer canvas[data-stt]").forEach(c=>{const st=ED.sts[+c.dataset.stt];if(!st)return;const g=c.getContext("2d"),b=st.bg,W=c.width,H=c.height;
  if(b.tipo==="foto")edCover(g,b.img,W,H,b.z,b.ox,b.oy);else if(b.tipo==="layout"){g.fillStyle="#000";g.fillRect(0,0,W,H);ED_LAYS[b.lay].forEach((r,i)=>{const o=b.cel[i];if(!o)return;g.save();g.beginPath();g.rect(r[0]*W,r[1]*H,r[2]*W,r[3]*H);g.clip();g.translate(r[0]*W,r[1]*H);edCover(g,o.img,r[2]*W,r[3]*H,1,0,0);g.restore()})}
  else{const f=PUB_FUNDOS[(+b.g||0)%PUB_FUNDOS.length],gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,f[0]);gr.addColorStop(1,f[1]);g.fillStyle=gr;g.fillRect(0,0,W,H)}})}
function edTrocaFiltro(d){const b=ED.st.bg,fn=$("#ce-fn");let nome="";
  if(b.tipo==="grad"){b.g=((+b.g||0)+d+PUB_FUNDOS.length)%PUB_FUNDOS.length;const bg=$("#ce-cv .ce-bg");if(bg)bg.style.background=pubFundo(b.g);return}
  const i=Math.max(0,ED_FILTROS.findIndex(x=>x[0]===(b.f||"normal")));const j=(i+d+ED_FILTROS.length)%ED_FILTROS.length;b.f=ED_FILTROS[j][0];nome=ED_FILTROS[j][1];edBgSrcs();
  if(fn){fn.textContent=nome;fn.classList.remove("on");void fn.offsetWidth;fn.classList.add("on")}}
function edToqueEl(el){if(!el)return edTexto(null);if(el.t==="texto")return edTexto(el);if(el.t==="enq")return edEnquete(el)}
edGestos=function(){const cv=$("#ce-cv");if(!cv)return;const pts=new Map();let G=null;const gv=$("#ce-gv"),gh=$("#ce-gh");
  const xy=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,cx:e.clientX,cy:e.clientY}};
  const base=()=>{const ps=[...pts.values()];if(ps.length<2)return null;const dx=ps[1].cx-ps[0].cx,dy=ps[1].cy-ps[0].cy;return {d:Math.hypot(dx,dy),a:Math.atan2(dy,dx)*180/Math.PI,m:{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2}}};
  const guias=(x,y)=>{if(gv)gv.hidden=x!==.5;if(gh)gh.hidden=y!==.5};
  cv.addEventListener("pointerdown",e=>{if(ED.env)return;if(ED.st.ferr==="caneta"){edDesenhaIni(e);return}const p=xy(e);pts.set(e.pointerId,p);try{cv.setPointerCapture(e.pointerId)}catch(_){}
    if(pts.size===1){const d=e.target.closest(".ce-el"),el=d&&ED.st.els.find(x=>x.id===d.dataset.eid);G={el,t0:Date.now(),p0:p,mov:false,dx:0,dy:0,b:el?{x:el.x,y:el.y,s:el.s||1,r:el.r||0}:{...ED.st.bg}};if(el){ED.st.els.splice(ED.st.els.indexOf(el),1);ED.st.els.push(el);cv.querySelector("#ce-els").appendChild(d)}}
    else if(pts.size===2&&G){G.two=base();G.b2=G.el?{x:G.el.x,y:G.el.y,s:G.el.s||1,r:G.el.r||0}:{...ED.st.bg};G.mov=true;if(G.lixo){G.lixo=false;$("#ce-lixo")?.classList.remove("on")}}});
  cv.addEventListener("pointermove",e=>{if(ED.st.ferr==="caneta"){edDesenhaMove(e);return}if(!pts.has(e.pointerId)||!G)return;const p=xy(e);pts.set(e.pointerId,p);
    if(pts.size===1&&!G.two){const dx=p.x-G.p0.x,dy=p.y-G.p0.y;G.dx=dx;G.dy=dy;if(Math.abs(dx)+Math.abs(dy)>.012)G.mov=true;
      if(G.el&&G.mov){let nx=G.b.x+dx,ny=G.b.y+dy;if(Math.abs(nx-.5)<.015)nx=.5;if(Math.abs(ny-.5)<.012)ny=.5;G.el.x=nx;G.el.y=ny;edPosEl(G.el);guias(nx,ny);
        const lx=$("#ce-lixo");if(lx){lx.hidden=false;const perto=p.y>.86&&Math.abs(p.x-.5)<.14;lx.classList.toggle("on",perto);if(perto&&!G.lixo)vibrar(6);G.lixo=perto}}}
    else if(pts.size>=2&&G.two){const b=base();const k=b.d/G.two.d,da=b.a-G.two.a;
      if(G.el){G.el.s=Math.max(.3,Math.min(6,G.b2.s*k));let r=G.b2.r+da;const rq=Math.round(r/90)*90;if(Math.abs(r-rq)<4)r=rq;G.el.r=r;G.el.x=G.b2.x+(b.m.x-G.two.m.x);G.el.y=G.b2.y+(b.m.y-G.two.m.y);edPosEl(G.el)}
      else if(ED.st.bg.tipo==="foto"||ED.st.bg.tipo==="video"){const bg=ED.st.bg;bg.z=Math.max(1,Math.min(5,G.b2.z*k));bg.ox=G.b2.ox+(b.m.x-G.two.m.x);bg.oy=G.b2.oy+(b.m.y-G.two.m.y);edBgPos()}}});
  const fim=e=>{if(ED.st.ferr==="caneta"){edDesenhaFim(e);return}if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(pts.size)return;const g=G;G=null;guias(-1,-1);const lx=$("#ce-lixo");if(lx){lx.hidden=true;lx.classList.remove("on")}if(!g)return;
    if(g.el&&g.lixo){ED.st.els=ED.st.els.filter(x=>x!==g.el);vibrar(10);edEls();return}
    if(!g.el&&!g.two&&g.mov){if(Math.abs(g.dx)>.12&&Math.abs(g.dx)>Math.abs(g.dy)*1.4)edTrocaFiltro(g.dx<0?1:-1);return}
    if(!g.mov&&Date.now()-g.t0<350){ED._abriu=Date.now();const el=g.el;setTimeout(()=>{if(!ED||ED.env||$("#layer .ce-tx,#layer .ce-sel,#layer .ce-fig"))return;edToqueEl(el)},60)}};
  cv.addEventListener("pointerup",fim);cv.addEventListener("pointercancel",fim)};
/* caneta com marcador */
edPintaTracos=function(g,W,H){ED_TRACOS_DE(g).forEach(t=>{if(t.pts.length<1)return;g.save();g.lineCap=t.mk?"square":"round";g.lineJoin="round";g.lineWidth=t.w*W*(t.mk?1.6:1);g.globalCompositeOperation=t.bor?"destination-out":"source-over";g.strokeStyle=t.cor;if(t.mk)g.globalAlpha=.45;
  if(t.neon){g.shadowColor=t.cor;g.shadowBlur=t.w*W*1.6;g.strokeStyle="#fff"}g.beginPath();t.pts.forEach((p,i)=>i?g.lineTo(p[0]*W,p[1]*H):g.moveTo(p[0]*W,p[1]*H));if(t.pts.length===1)g.lineTo(t.pts[0][0]*W+.1,t.pts[0][1]*H);g.stroke();g.restore()})};
var ED_TRACOS_ST=null;const ED_TRACOS_DE=()=>(ED_TRACOS_ST||ED.st).tracos;
{const _di60=edDesenhaIni;edDesenhaIni=function(e){const r=_di60.apply(this,arguments);if(ED._tr&&ED.st.caneta){ED._tr.mk=!!ED.st.caneta.mk;if(ED._tr.mk){ED._tr.neon=false;ED._tr.bor=false}}return r}}
{const _cn60=edCaneta;edCaneta=function(){const r=_cn60.apply(this,arguments);const c=ED.st.caneta;const nb=$("#layer .ce-cn [data-edcnneon]");if(nb)nb.insertAdjacentHTML("beforebegin",`<button type="button" class="ce-chip${c.mk?" on":""}" data-edcnmk>Marcador</button>`);return r}}
/* texto: tamanho e animação */
edTexto=function(el){if($("#layer .ce-tx"))return;const novo=!el;const e=el||{id:edNid(),t:"texto",tx:"",f:"classico",cor:"#ffffff",al:"c",fd:0,tam:1,an:"",x:.5,y:.42,s:1,r:0};
  const anN=(ED_ANIMS.find(a=>a[0]===(e.an||""))||ED_ANIMS[0])[1];
  const ov=document.createElement("div");ov.className="ce-tx";ov.innerHTML=`<div class="ce-top"><button type="button" class="ce-b" data-edtxal aria-label="Alinhamento">${e.al==="e"?"⇤":e.al==="d"?"⇥":"≡"}</button><button type="button" class="ce-b ce-fd" data-edtxfd data-fd="${e.fd||0}" aria-label="Fundo do texto"><b class="ce-aa">A</b></button><button type="button" class="ce-b ce-anb${e.an?" on":""}" data-edtxan aria-label="Animação: ${esc(anN)}"><b>✦</b></button><span class="sp"></span><button type="button" class="ce-ok" data-edtxok>Concluir</button></div>
    <input type="range" class="ce-tam" id="ce-tam" min="50" max="260" value="${Math.round((e.tam||1)*100)}" aria-label="Tamanho do texto">
    <div class="ce-txm"><div class="ce-t f-${e.f} al-${e.al}${e.fd?" fd"+e.fd:""}" style="--cor:${e.cor};--tam:${e.tam||1}"><textarea id="ce-txa" rows="1" maxlength="220" aria-label="Texto do story" placeholder="Escreva…">${esc(e.tx)}</textarea></div></div>
    <div class="ce-anl" id="ce-anl" ${e.an?"":"hidden"}>${esc(anN)}</div>
    <div class="ce-fts">${ED_FONTES.map(([k,n])=>`<button type="button" class="ce-chip f-${k}${k===e.f?" on":""}" data-edtxf="${k}">${n}</button>`).join("")}</div>
    <div class="ce-cores">${ED_CORES.map(x=>`<button type="button" data-edtxcor="${x}" style="background:${x}" aria-pressed="${x===e.cor}"></button>`).join("")}</div>`;
  const cvw=$("#ce-cv")?.clientWidth;if(cvw)ov.style.setProperty("--bw",cvw+"px");
  ED.st.tx=e;ED.st.txNovo=novo;$("#layer .ce").appendChild(ov);$("#layer .ce").classList.add("tx-on");if(!novo)$(`#ce-els [data-eid="${e.id}"]`)?.classList.add("editando");
  const ta=$("#ce-txa");const auto=()=>{ta.style.height="auto";ta.style.height=ta.scrollHeight+"px"};ta.addEventListener("input",()=>{e.tx=ta.value;auto();if(typeof menSugere==="function")menSugere(ta)});
  $("#ce-tam").addEventListener("input",ev=>{e.tam=ev.target.value/100;$("#layer .ce-tx .ce-t")?.style.setProperty("--tam",e.tam);auto()});
  setTimeout(()=>{auto();ta.focus();try{ta.setSelectionRange(ta.value.length,ta.value.length)}catch(_){}},30)};
{const _tr60=edTxRefaz;edTxRefaz=function(){const r=_tr60.apply(this,arguments);const e=ED.st.tx;if(!e)return r;const box=$("#layer .ce-tx .ce-t");if(box)box.style.setProperty("--tam",e.tam||1);
  const an=(ED_ANIMS.find(a=>a[0]===(e.an||""))||ED_ANIMS[0]);const l=$("#ce-anl");if(l){l.hidden=!e.an;l.textContent=an[1];l.classList.remove("on");void l.offsetWidth;l.classList.add("on")}$("#layer [data-edtxan]")?.classList.toggle("on",!!e.an);return r}}
/* exporta (com filtro, layout, tamanho do texto; textos animados ficam vivos no story) */
const edAssa=e=>!ED_VIVOS.includes(e.t)&&!(e.t==="texto"&&e.an);
function edPintaTexto(g,e,W,H){const tam=e.tam||1;g.save();g.translate(e.x*W,e.y*H);g.rotate((e.r||0)*Math.PI/180);g.scale(e.s||1,e.s||1);
  const px=W*.075*tam,tx=e.f==="forte"?String(e.tx).toUpperCase():e.tx;g.font=edFonte(e.f,px);const ls=edLinhas(g,tx,W*.8-px*.25),lh=px*1.25,h=ls.length*lh;g.textBaseline="middle";
  const al=e.al==="e"?"left":e.al==="d"?"right":"center";g.textAlign=al;const mw=Math.max(...ls.map(l=>g.measureText(l).width));const x0=al==="left"?-mw/2:al==="right"?mw/2:0;
  ls.forEach((l,i)=>{const y=-h/2+lh*(i+.5),w=g.measureText(l).width;if(e.fd){const bx=al==="left"?x0:al==="right"?x0-w:-w/2;g.fillStyle=e.fd===1?e.cor:"rgba(0,0,0,.55)";edRR(g,bx-px*.25,y-lh/2,w+px*.5,lh,px*.22);g.fill()}
    g.fillStyle=e.fd===1?(e.cor==="#ffffff"||e.cor==="#ffd23f"||e.cor==="#f2c27b"?"#111111":"#ffffff"):e.cor;if(e.f==="neon"){g.shadowColor=e.cor;g.shadowBlur=px*.5;g.fillStyle="#ffffff"}else if(!e.fd){g.shadowColor="rgba(0,0,0,.35)";g.shadowBlur=px*.25}g.fillText(l,x0,y);g.shadowBlur=0});g.restore()}
{const _pe60=edPintaEl;edPintaEl=function(g,e,W,H){if(e.t==="texto")return edPintaTexto(g,e,W,H);return _pe60.apply(this,arguments)}}
edExportaStory=async function(st0,tudo){const st=st0||ED.st;const W=1080,H=1920,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d"),b=st.bg;
  try{await Promise.all(st.els.filter(e=>e.t==="texto").map(e=>document.fonts.load(edFonte(e.f,40),e.tx)).concat([document.fonts.load('900 40px "Public Sans"'),document.fonts.load('800 40px "Public Sans"')]));await document.fonts.ready}catch(e){}
  if(b.tipo==="foto"){g.fillStyle="#000";g.fillRect(0,0,W,H);edCover(g,b.img,W,H,b.z,b.ox,b.oy)}
  else if(b.tipo==="layout"){g.fillStyle="#000";g.fillRect(0,0,W,H);ED_LAYS[b.lay].forEach((r,i)=>{const o=b.cel[i];if(!o)return;g.save();g.beginPath();g.rect(r[0]*W,r[1]*H,r[2]*W,r[3]*H);g.clip();g.translate(r[0]*W,r[1]*H);edCover(g,o.img,r[2]*W,r[3]*H,o.z||1,o.ox||0,o.oy||0);g.restore()});}
  else{const f=PUB_FUNDOS[(+b.g||0)%PUB_FUNDOS.length],gr=g.createLinearGradient(W*.2,0,W*.8,H);gr.addColorStop(0,f[0]);gr.addColorStop(1,f[1]);g.fillStyle=gr;g.fillRect(0,0,W,H)}
  if(b.f&&b.f!=="normal"&&b.tipo!=="grad")edFiltra(c,b.f,{});
  const d=document.createElement("canvas");d.width=W;d.height=H;ED_TRACOS_ST=st;try{edPintaTracos(d.getContext("2d"),W,H)}finally{ED_TRACOS_ST=null}g.drawImage(d,0,0);
  st.els.filter(e=>tudo?!ED_VIVOS.includes(e.t):edAssa(e)).forEach(e=>edPintaEl(g,e,W,H));
  return edJpeg(c)};
function edItens(st){return st.els.filter(e=>!edAssa(e)||e.t==="men").map(e=>{const o={t:e.t,x:+e.x.toFixed(4),y:+e.y.toFixed(4),s:+(e.s||1).toFixed(3),r:Math.round(e.r||0)};
  if(e.t==="enq"){o.q=e.q;o.o=e.o}if(e.t==="nt")o.pid=e.pid;if(e.t==="men")o.uid=e.uid;if(e.t==="texto"){o.tx=String(e.tx).slice(0,220);o.f=e.f;o.cor=e.cor;o.al=e.al;o.fd=e.fd||0;o.tam=+(e.tam||1).toFixed(2);o.an=e.an}
  return edItemExtra(e,o)}).slice(0,10)}
var edItemExtra=(e,o)=>o;
edPublicaStory=async function(pub){if(!ED||ED.env)return;const lista=ED.sts.filter(edStTem);if(!lista.length){toast("Tire uma foto, escreva algo ou ponha uma figurinha.");return}
  if(pub==="proximos"&&!MA.set.size){edMaLista(true);return}
  if(ED.st.tx)edTextoOk();ED.env=true;ED._pubq=pub==="proximos"?"proximos":"amigos";const ed0=ED;ED.envN=[0,lista.length];edDesenha();const feitos=[];let erro=false;
  for(const st of lista){const fotos=[];try{const blob=await edExportaStory(st);fotos.push(await pubSobe(blob));const at=Date.now();
      const nt=st.els.find(e=>e.t==="nt"),texto=st.els.filter(e=>e.t==="texto").map(e=>e.tx).join(" · ").slice(0,300);
      const row={autor:S.uid,tipo:"story",at,expira:at+86400000,texto,fotos,pid:nt?nt.pid:null,snap:nt?pubSnap(nt.pid):null,estilo:{v:2,itens:edItens(st)}};if(st.bg.tipo==="video")await edVidStory(st,row,fotos);if(MA.on)row.publico=pub==="proximos"?"proximos":"amigos";
      const r=await SB.from("publicacoes").insert(row).select("id");if(r.error)throw r.error;const id=r.data&&r.data[0]&&r.data[0].id;PUB.itens.unshift({...row,id});PUB.urls[fotos[0]]={u:URL.createObjectURL(blob),exp:Date.now()+3600e3};
      const men=[...new Set(st.els.filter(e=>e.t==="men").map(e=>e.uid).concat(typeof mencionados==="function"?mencionados(texto):[]))].filter(u=>S.amigos.has(u)&&(pub!=="proximos"||MA.set.has(u)));
      if(id&&men.length)Promise.all(men.map(u=>dmEnviar(u,{texto:"Mencionou você no story",pid:"u:"+id,snap:{titulo:"Story de "+nomeDe(S.uid),upub:id,story:true},tipo:"mencao"},true)));
      feitos.push(st);ED.envN[0]++;if(ED===ed0&&lista.length>1){const sp=$("#layer [data-edpubst='"+((ED&&ED._pubq)||"amigos")+"'] > span:not(.av)");if(sp)sp.textContent=`Publicando ${Math.min(ED.envN[0]+1,lista.length)}/${lista.length}…`}}
    catch(e){if(fotos.length)try{await SB.storage.from("fotos").remove(fotos)}catch(_){}if(st._vp){try{await SB.storage.from("videos").remove([st._vp])}catch(_){}st._vp=null}erro=true;break}}
  pubRedesenha();setTimeout(pubCarregar,1500);
  if(erro){if(ED===ed0){ED.sts=ED.sts.filter(x=>!feitos.includes(x));if(!ED.sts.length)ED.sts=[edNovoSt()];ED.si=0;ED.st=ED.sts[0];ED.env=false;edDesenha()}toast(feitos.length?`${feitos.length} publicado(s); o resto não foi. Tente de novo.`:"Não deu para publicar. Tente de novo.");return}
  const aqui=ED===ed0&&$("#layer .ce");ED=null;if(aqui){closeLayer._ok=true;closeLayer()}toast(feitos.length>1?`${feitos.length} stories publicados. Somem em 24 horas.`:pub==="proximos"?"Story publicado para os Melhores amigos.":"Story publicado. Some em 24 horas.");vibrar(10)};
async function edSalvar(){if(!ED)return;if(ED.st.tx)edTextoOk();try{const b=await edExportaStory(ED.st,true);const f=new File([b],"prumo-story.jpg",{type:"image/jpeg"});
  if(navigator.canShare&&navigator.canShare({files:[f]})&&/iP(hone|ad)|Android/i.test(navigator.userAgent)){try{await navigator.share({files:[f]});return}catch(e){if(e&&e.name==="AbortError")return}}
  const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="prumo-story.jpg";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);toast("Imagem salva")}catch(e){toast("Não deu para salvar a imagem.")}}
/* ===== Melhores amigos ===== */
async function maCarregar(){if(!S.uid||!SB)return;try{const r=await SB.from("melhores_amigos").select("amigo").eq("dono",S.uid);if(r.error){MA.on=false;return}MA.on=true;MA.uid=S.uid;MA.set=new Set((r.data||[]).map(x=>x.amigo))}catch(e){MA.on=false}}
{const _pc60=pubCarregar;pubCarregar=async function(){const r=await _pc60.apply(this,arguments);if(PUB.on&&(MA.uid!==S.uid||MA.on===null||Date.now()-(MA.t||0)>120000)){MA.t=Date.now();await maCarregar()}return r}}
function edMaLista(aviso){const am=amigosL();if(!am.length){toast("Você ainda não tem amigos no Prumo.");return}const ov=document.createElement("div");ov.className="ce-sel";
  ov.innerHTML=`<div class="ce-selp"><b>Melhores amigos</b><p class="ce-selh">${aviso?"Escolha quem entra na sua lista. ":""}Só eles veem os stories que você manda para os Melhores amigos. Ninguém é avisado quando entra ou sai.</p><div class="pick dm-pick">${am.map(u=>`<button type="button" data-edma="${esc(u)}" aria-pressed="${MA.set.has(u)}">${avatar(u)}<span>${esc(nomeDe(u))}</span><i class="dm-ck" aria-hidden="true"></i></button>`).join("")}</div><div class="ce-selb"><button type="button" class="btn" data-edmaok>Concluir</button></div></div>`;$("#layer .ce").appendChild(ov)}
async function maTroca(u,b){const on=!MA.set.has(u);if(on)MA.set.add(u);else MA.set.delete(u);b.setAttribute("aria-pressed",String(on));
  try{const r=on?await SB.from("melhores_amigos").insert({dono:S.uid,amigo:u}):await SB.from("melhores_amigos").delete().eq("dono",S.uid).eq("amigo",u);if(r&&r.error)throw r.error}
  catch(e){if(on)MA.set.delete(u);else MA.set.add(u);b.setAttribute("aria-pressed",String(!on));toast("Não deu para salvar agora.")}}
/* anel verde e selo nos stories para Melhores amigos */
{const _rs60=renderSecs;renderSecs=function(){const r=_rs60.apply(this,arguments);try{document.querySelectorAll("#secs [data-ustory],#secs [data-meustory]").forEach(b=>{const u=b.dataset.ustory||S.uid;const xs=pubStoriesDe(u);const ult=xs[xs.length-1];
  b.querySelector(".ig-r")?.classList.toggle("ma",!!ult&&ult.publico==="proximos")})}catch(e){}return r}}
{const _du60=igDrawUser;igDrawUser=function(){const r=_du60.apply(this,arguments);try{const x=ST.itens[ST.i];if(x&&x.publico==="proximos"){const w=$("#layer .story .sg-who span");if(w&&!w.querySelector(".us-ma"))w.insertAdjacentHTML("beforeend",` <i class="us-ma">★ Melhores amigos</i>`)}}catch(e){}return r}}
/* textos animados no story publicado */
{const _ui60=usItensHTML;usItensHTML=function(x){const it=(x.estilo&&x.estilo.itens)||[];const txs=it.filter(e=>e.t==="texto");if(!txs.length)return _ui60.apply(this,arguments);
  return _ui60.call(this,{...x,estilo:{...x.estilo,itens:it.filter(e=>e.t!=="texto")}})+txs.map(e=>`<div class="ce-el us-it us-tx" style="left:${e.x*100}%;top:${e.y*100}%;transform:translate(-50%,-50%) rotate(${e.r||0}deg) scale(${e.s||1})">${edTxtHTML({...e,f:String(e.f||"classico").replace(/[^a-z]/g,""),cor:/^#[0-9a-f]{6}$/i.test(e.cor||"")?e.cor:"#ffffff",al:String(e.al||"c").replace(/[^a-z]/g,""),an:String(e.an||"").replace(/[^a-z]/g,""),fd:+e.fd||0,tam:Math.max(.5,Math.min(2.6,+e.tam||1))})}</div>`).join("")}}
/* cliques novos */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest||!$("#layer .ce")||!ED||t.closest("#layer2"))return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(ED.env&&t.closest("[data-edfoto],[data-edvira],[data-edflash],[data-edcriar],[data-edlayout],[data-edgrade],[data-edcel],[data-edcelx],[data-edlayok],[data-edlaysai],[data-edsalvar],[data-edsti],[data-edstx],[data-edtxan],[data-edma],[data-edmaok],[data-edcnmk]")){pare();return}
  if(t.closest("[data-edfoto]")){pare();(async()=>{if(!CAM.s){$("#ce-file")?.click();return}const lay=ED.tela==="lay";const b=ED.st.bg;let W=1080,H=1920;if(lay){const r=ED_LAYS[b.lay][b.ativa];W=Math.round(1080*r[2]);H=Math.round(1920*r[3])}
    const f=await camFoto(W,H);if(!f||!ED)return;if(lay){b.cel[b.ativa]={...f,z:1,ox:0,oy:0};edLayProxima();edDesenha()}else{ED.st.bg={tipo:"foto",...f,z:1,ox:0,oy:0,f:"normal"};ED.tela="edit";edDesenha()}})();return}
  if(t.closest("[data-edvira]")){pare();CAM.f=CAM.f==="user"?"environment":"user";camDesliga();const v=$("#ce-video");if(v)v.classList.toggle("esp",CAM.f==="user");camLiga();return}
  if(b=t.closest("[data-edflash]")){pare();CAM.flash=!CAM.flash;b.setAttribute("aria-pressed",String(CAM.flash));toast(CAM.flash?"Flash ligado":"Flash desligado");return}
  if(t.closest("[data-edcriar]")){pare();ED.st.bg={tipo:"grad",g:Math.floor(Math.random()*PUB_FUNDOS.length)};ED.tela="edit";edDesenha();setTimeout(()=>{if(ED&&!ED.st.tx)edTexto(null)},80);return}
  if(t.closest("[data-edlayout]")){pare();ED.st.bg={tipo:"layout",lay:"2v",cel:[null,null],ativa:0,f:"normal"};ED.tela="lay";edDesenha();return}
  if(t.closest("[data-edlaysai]")){pare();ED.st.bg={tipo:"grad",g:Math.floor(Math.random()*PUB_FUNDOS.length)};ED.tela="cam";edDesenha();return}
  if(t.closest("[data-edgrade]")){pare();const bg=ED.st.bg;const tem=[...bg.cel.filter(Boolean),...(bg.pool||[]).filter(x=>!bg.cel.includes(x))];bg.pool=tem;bg.lay=ED_LAYO[(ED_LAYO.indexOf(bg.lay)+1)%ED_LAYO.length];const n=ED_LAYS[bg.lay].length;bg.cel=Array.from({length:n},(_,i)=>tem[i]||null);edLayProxima();if(bg.cel.every(Boolean))bg.ativa=n-1;edDesenha();return}
  if(b=t.closest("[data-edcelx]")){pare();const bg=ED.st.bg;bg.cel[+b.dataset.edcelx]=null;bg.ativa=+b.dataset.edcelx;edDesenha();return}
  if(b=t.closest("[data-edcel]")){pare();ED.st.bg.ativa=+b.dataset.edcel;edDesenha();return}
  if(t.closest("[data-edlayok]")){pare();ED.tela="edit";edDesenha();return}
  if(t.closest("[data-edsalvar]")){pare();edSalvar();return}
  if(b=t.closest("[data-edstx]")){pare();const i=+b.dataset.edstx;ED.sts.splice(i,1);if(!ED.sts.length)ED.sts=[edNovoSt()];ED.si=Math.min(i,ED.sts.length-1);ED.st=ED.sts[ED.si];if(!edStTem(ED.st)&&ED.sts.length===1)ED.tela="cam";edDesenha();return}
  if(b=t.closest("[data-edsti]")){pare();if(ED.st.tx)edTextoOk();ED.si=+b.dataset.edsti;ED.st=ED.sts[ED.si];edDesenha();return}
  if(t.closest("[data-edtxan]")){pare();const x=ED.st.tx;if(!x)return;const i=ED_ANIMS.findIndex(a=>a[0]===(x.an||""));x.an=ED_ANIMS[(i+1)%ED_ANIMS.length][0];edTxRefaz();return}
  if(b=t.closest("[data-edma]")){pare();maTroca(b.dataset.edma,b);return}
  if(t.closest("[data-edmaok]")){pare();$("#layer .ce-sel")?.remove();edDesenha();return}
  if(t.closest("[data-edcnmk]")){pare();const c=ED.st.caneta;c.mk=!c.mk;if(c.mk){c.neon=false;c.bor=false;$("#layer [data-edcnneon]")?.classList.remove("on");$("#layer [data-edcnbor]")?.classList.remove("on")}t.closest("[data-edcnmk]").classList.toggle("on",c.mk);return}},true);
/* neon/borracha desligam o marcador */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest||!ED||!ED.st.caneta)return;if(t.closest("#layer [data-edcnneon],#layer [data-edcnbor]")){ED.st.caneta.mk=false;$("#layer [data-edcnmk]")?.classList.remove("on")}},true);
/* ligar a lista dos Melhores amigos pelo toque longo no botão */
(function(){let lp=0;document.addEventListener("pointerdown",e=>{const b=e.target.closest&&e.target.closest("#layer [data-edpubst='proximos']");if(!b)return;lp=setTimeout(()=>{lp=0;ED._malp=Date.now();edMaLista(false)},550)},true);
  ["pointerup","pointercancel","pointerleave"].forEach(k=>document.addEventListener(k,()=>{if(lp){clearTimeout(lp);lp=0}},true));
  document.addEventListener("click",e=>{if(ED&&Date.now()-(ED._malp||0)<700&&e.target.closest&&e.target.closest("#layer [data-edpubst]")){e.stopPropagation();e.preventDefault()}},true)})();
/* câmera desligada ao fechar, ao trocar de app ou de modo */
{const _cl60=closeLayer;closeLayer=function(){const r=_cl60.apply(this,arguments);if(!$("#layer .ce"))camDesliga();return r}}
document.addEventListener("visibilitychange",()=>{if(document.hidden)camDesliga();else if(ED&&ED.modo==="story"&&(ED.tela==="cam"||ED.tela==="lay")&&$("#ce-video"))camLiga()});
/* voltar do celular: no editor com foto/texto volta à câmera como no Instagram (com confirmação se houver algo) */

