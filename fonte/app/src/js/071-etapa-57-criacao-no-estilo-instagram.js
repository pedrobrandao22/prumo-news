/* ---------- Etapa 57: criação no estilo Instagram ---------- */
var ED=null;
const ED_CORES=["#ffffff","#111111","#f2c27b","#ff5a5f","#ff9f1c","#ffd23f","#2ec4b6","#3a86ff","#8338ec","#ff66c4"];
const ED_FONTES=[["classico","Clássico"],["moderno","Moderno"],["forte","Forte"],["maquina","Máquina"],["neon","Neon"]];
const ED_EMOJIS="😀 😂 😍 🥹 😎 🤔 😮 😢 😡 👍 👏 🙌 🔥 ❤️ 💯 🎉 ⚽ 🏆 📰 🗳️ 💸 📈 📉 ☕ 🌧️ ☀️ 🇧🇷 ✅ ❌ ⚠️ 👀 🤝".split(" ");
const ED_FILTROS=[["normal","Normal",{}],["clarendon","Clarendon",{c:.18,s:.22,b:.02,w:-.2}],["gingham","Gingham",{c:-.12,s:-.12,f:.08,w:.2}],["juno","Juno",{c:.1,s:.3,w:.4}],["lark","Lark",{b:.06,s:-.08,c:-.04,w:-.3}],["ludwig","Ludwig",{c:.06,s:-.15,b:.03}],["aden","Aden",{w:.3,s:-.15,b:.05,f:.06}],["valencia","Valencia",{w:.6,f:.05,c:-.04,s:.06}],["moon","Moon",{s:-1,c:.18,b:.04}]];
const edNid=()=>Math.random().toString(36).slice(2,9);
function edImg(blob){return new Promise((ok,no)=>{const u=URL.createObjectURL(blob),im=new Image();im.onload=()=>ok({img:im,url:u});im.onerror=()=>no(new Error("foto"));im.src=u})}
async function edCarrega(file,maxL){const b=await pubComprime(file,maxL||2048,0);const {img,url}=await edImg(b);return {blob:b,img,url}}
/* filtro por pixel (o mesmo na prévia e na foto final) */
function edFiltra(c,f,aj){const P=(ED_FILTROS.find(x=>x[0]===f)||ED_FILTROS[0])[2],a=aj||{};const b=(P.b||0)+(a.b||0)/200,ct=(P.c||0)+(a.c||0)/100,sa=(P.s||0)+(a.s||0)/100,w=(P.w||0)+(a.w||0)/50,fa=P.f||0;
  if(!b&&!ct&&!sa&&!w&&!fa)return;const g=c.getContext("2d"),d=g.getImageData(0,0,c.width,c.height),p=d.data,k=1+ct,ks=1+sa;
  for(let i=0;i<p.length;i+=4){let r=p[i]/255,gg=p[i+1]/255,bb=p[i+2]/255;r+=b;gg+=b;bb+=b;r=(r-.5)*k+.5;gg=(gg-.5)*k+.5;bb=(bb-.5)*k+.5;const l=.2126*r+.7152*gg+.0722*bb;r=l+(r-l)*ks;gg=l+(gg-l)*ks;bb=l+(bb-l)*ks;r+=w*.08;bb-=w*.08;
    if(fa){r=fa+r*(1-fa);gg=fa+gg*(1-fa);bb=fa+bb*(1-fa)}p[i]=Math.max(0,Math.min(255,r*255));p[i+1]=Math.max(0,Math.min(255,gg*255));p[i+2]=Math.max(0,Math.min(255,bb*255))}g.putImageData(d,0,0)}
/* desenha a foto com enquadramento (cover + zoom + deslocamento) */
function edCover(g,img,W,H,z,ox,oy){const iw=img.naturalWidth,ih=img.naturalHeight,k=Math.max(W/iw,H/ih)*(z||1),w=iw*k,h=ih*k;g.drawImage(img,(W-w)/2+(ox||0)*W,(H-h)/2+(oy||0)*H,w,h)}
function edAR(ar,img){if(ar==="1:1")return 1;if(ar==="orig"&&img)return Math.max(.8,Math.min(1.91,img.naturalWidth/img.naturalHeight));return .8}

/* ===== abrir ===== */
criarAbrir=function(tipo){if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}uso("criar_"+tipo);if($("#layer").innerHTML)closeLayer();
  ED={modo:tipo==="story"?"story":"post",env:false,st:{bg:{tipo:"grad",g:Math.floor(Math.random()*PUB_FUNDOS.length)},els:[],tracos:[],ferr:null},po:{passo:"fotos",fotos:[],cur:0,ar:"4:5",texto:"",marcados:[],local:"",pid:null,aba:"filtros"}};
  $("#layer").innerHTML=`<div class="ce" role="dialog" aria-modal="true" aria-label="Criar"></div>`;if(pushH())HST++;edDesenha()};
criarMenu=function(){criarAbrir("post")};
function edTemAlgo(){if(!ED)return false;return (ED.st.tx&&String(ED.st.tx.tx||"").trim())||ED.st.els.length||ED.st.tracos.length||ED.st.bg.tipo==="foto"||ED.po.fotos.length||ED.po.texto.trim()||ED.po.pid}
function edModos(){return `<div class="ce-modos" role="tablist"><button type="button" role="tab" data-edmodo="post" aria-selected="${ED.modo==="post"}">POST</button><button type="button" role="tab" data-edmodo="story" aria-selected="${ED.modo==="story"}">STORY</button></div>`}
const EDI={x:'<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',aa:'<b class="ce-aa">Aa</b>',fig:'<svg class="ico" viewBox="0 0 24 24"><path d="M14 3H7a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h7l7-7V7a4 4 0 0 0-4-4z" /><path d="M14 21v-4a3 3 0 0 1 3-3h4"/><circle cx="9" cy="10" r=".8"/><circle cx="14" cy="10" r=".8"/><path d="M8.5 14.2c1.4 1.3 3.6 1.3 5 0"/></svg>',caneta:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M13.5 7.5l3 3"/></svg>',fundo:'<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',gal:'<svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-5 4 4 2.5-2.5L20 17"/></svg>',vol:'<svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',lixo:'<svg class="ico" viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>',desf:'<svg class="ico" viewBox="0 0 24 24"><path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12"/></svg>'};
function edDesenha(){const el=$("#layer .ce");if(!el||!ED)return;el.className="ce ce-"+ED.modo;if(ED.modo==="story")edStory(el);else edPost(el)}

/* ===== STORY ===== */
function edStory(el){const st=ED.st,foto=st.bg.tipo==="foto";
  el.innerHTML=`<div class="ce-palco"><div class="ce-cv" id="ce-cv"><div class="ce-bg" style="${foto?"":"background:"+pubFundo(st.bg.g)}">${foto?`<img id="ce-bgi" alt="" draggable="false">`:""}</div><canvas id="ce-draw" class="ce-draw"></canvas><div class="ce-els" id="ce-els"></div>${!st.els.length&&!st.tracos.length&&!foto?`<div class="ce-dica">Toque em <b>Aa</b> para escrever<br>ou escolha uma foto na galeria</div>`:""}<div class="ce-lixo" id="ce-lixo" hidden>${EDI.lixo}</div></div></div>
    <div class="ce-top"><button type="button" class="ce-b" data-edfechar aria-label="Fechar">${EDI.x}</button><span class="sp"></span>${foto?"":`<button type="button" class="ce-b" data-edfundo aria-label="Trocar o fundo">${EDI.fundo}</button>`}<button type="button" class="ce-b" data-edtexto aria-label="Texto">${EDI.aa}</button><button type="button" class="ce-b" data-edfig aria-label="Figurinhas">${EDI.fig}</button><button type="button" class="ce-b" data-edcaneta aria-label="Desenhar">${EDI.caneta}</button></div>
    <div class="ce-bot"><button type="button" class="ce-gal" data-edgal aria-label="Galeria">${foto?`<img alt="" id="ce-galt">`:EDI.gal}</button>${foto?`<button type="button" class="ce-semf" data-edsemfoto>Sem foto</button>`:""}<span class="sp"></span><button type="button" class="ce-pub" data-edpubst ${ED.env?"disabled":""}>${avatar(S.uid)}<span>${ED.env?"Publicando…":"Seu story"}</span><i>›</i></button></div>
    ${edModos()}<input type="file" id="ce-file" accept="image/*" hidden>`;
  if(foto){$("#ce-bgi").src=st.bg.url;$("#ce-galt").src=st.bg.url}edEncaixa();edEls();edTracos();edGestos();
  $("#ce-file").addEventListener("change",async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;try{const r=await edCarrega(f,2048);st.bg={tipo:"foto",...r,z:1,ox:0,oy:0};edDesenha()}catch(err){toast("Não deu para abrir essa foto.")}})}
function edEncaixa(){const cv=$("#ce-cv"),pl=$("#layer .ce-palco");if(!cv||!pl)return;const r=pl.getBoundingClientRect();const w=Math.min(r.width,r.height*9/16);cv.style.width=w+"px";cv.style.height=(w*16/9)+"px";cv.style.setProperty("--bw",w+"px");
  const d=$("#ce-draw");if(d){const k=Math.min(2,devicePixelRatio||1);d.width=Math.round(w*k);d.height=Math.round(w*16/9*k)}edBgPos()}
function edBgPos(){const i=$("#ce-bgi"),b=ED&&ED.st.bg;if(!i||!b||b.tipo!=="foto")return;const cv=$("#ce-cv");if(cv&&b.img)edLimita(b,cv);edPosImg(i,b,cv)}
function edPosImg(i,f,box){if(!box||!f.img)return;const W=box.clientWidth,H=box.clientHeight,iw=f.img.naturalWidth,ih=f.img.naturalHeight,k=Math.max(W/iw,H/ih)*(f.z||1),w=iw*k,h=ih*k;
  i.style.cssText=`position:absolute;inset:auto;max-width:none;object-fit:fill;transform:none;width:${w}px;height:${h}px;left:${(W-w)/2+(f.ox||0)*W}px;top:${(H-h)/2+(f.oy||0)*H}px`}
function edElHTML(e,vivo){const tr=`left:${e.x*100}%;top:${e.y*100}%;transform:translate(-50%,-50%) rotate(${e.r||0}deg) scale(${e.s||1})`;let c="";
  if(e.t==="texto")c=`<div class="ce-t f-${e.f} al-${e.al||"c"}${e.fd?" fd"+e.fd:""}" style="--cor:${e.cor}"><span>${esc(e.tx).replace(/\n/g,"<br>")}</span></div>`;
  else if(e.t==="emoji")c=`<div class="ce-emo">${esc(e.tx)}</div>`;
  else if(e.t==="hora")c=`<div class="ce-hora">${esc(e.tx)}</div>`;
  else if(e.t==="men")c=`<div class="ce-men">@${esc(String(nomeDe(e.uid)).toUpperCase())}</div>`;
  else if(e.t==="enq")c=`<div class="ce-enq"><b>${esc(e.q||"Enquete")}</b><div class="ce-eo">${(e.o||[]).map((o,i)=>`<span data-i="${i}">${esc(o)}</span>`).join("")}</div></div>`;
  else if(e.t==="nt"){const p=pautaById(e.pid);c=`<div class="ce-nt"><small style="color:${secCor(p?secOf(p):"politica")}">${esc(p?secNome(secOf(p)):"Notícia")}</small><b>${esc(p?versao(p,lente()).titulo:(e.tit||"Notícia"))}</b><i>Ler a matéria ›</i></div>`}
  return `<div class="ce-el" data-eid="${e.id}" style="${tr}">${c}</div>`}
function edEls(){const box=$("#ce-els");if(!box)return;box.innerHTML=ED.st.els.map(e=>edElHTML(e)).join("")}
function edPosEl(e){const d=$(`#ce-els [data-eid="${e.id}"]`);if(d)d.style.transform=`translate(-50%,-50%) rotate(${e.r||0}deg) scale(${e.s||1})`,d.style.left=e.x*100+"%",d.style.top=e.y*100+"%"}
function edTracos(){const c=$("#ce-draw");if(!c)return;const g=c.getContext("2d");g.clearRect(0,0,c.width,c.height);edPintaTracos(g,c.width,c.height)}
function edPintaTracos(g,W,H){ED.st.tracos.forEach(t=>{if(t.pts.length<1)return;g.save();g.lineCap="round";g.lineJoin="round";g.lineWidth=t.w*W;g.globalCompositeOperation=t.bor?"destination-out":"source-over";g.strokeStyle=t.cor;
  if(t.neon){g.shadowColor=t.cor;g.shadowBlur=t.w*W*1.6;g.strokeStyle="#fff"}g.beginPath();t.pts.forEach((p,i)=>i?g.lineTo(p[0]*W,p[1]*H):g.moveTo(p[0]*W,p[1]*H));if(t.pts.length===1)g.lineTo(t.pts[0][0]*W+.1,t.pts[0][1]*H);g.stroke();g.restore()})}
/* gestos no palco: arrastar, pinçar, girar, lixeira; foto de fundo se não pegar num item */
function edGestos(){const cv=$("#ce-cv");if(!cv)return;const pts=new Map();let G=null;
  const xy=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,cx:e.clientX,cy:e.clientY}};
  const base=()=>{const ps=[...pts.values()];if(ps.length<2)return null;const dx=ps[1].cx-ps[0].cx,dy=ps[1].cy-ps[0].cy;return {d:Math.hypot(dx,dy),a:Math.atan2(dy,dx)*180/Math.PI,m:{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2}}};
  cv.addEventListener("pointerdown",e=>{if(ED.st.ferr==="caneta"){edDesenhaIni(e);return}const p=xy(e);pts.set(e.pointerId,p);try{cv.setPointerCapture(e.pointerId)}catch(_){}
    if(pts.size===1){const d=e.target.closest(".ce-el"),el=d&&ED.st.els.find(x=>x.id===d.dataset.eid);G={el,t0:Date.now(),p0:p,mov:false,b:el?{x:el.x,y:el.y,s:el.s||1,r:el.r||0}:{...ED.st.bg}};if(el){ED.st.els.splice(ED.st.els.indexOf(el),1);ED.st.els.push(el);cv.querySelector("#ce-els").appendChild(d)}}
    else if(pts.size===2&&G){G.two=base();G.b2=G.el?{x:G.el.x,y:G.el.y,s:G.el.s||1,r:G.el.r||0}:{...ED.st.bg};G.mov=true}});
  cv.addEventListener("pointermove",e=>{if(ED.st.ferr==="caneta"){edDesenhaMove(e);return}if(!pts.has(e.pointerId)||!G)return;const p=xy(e);pts.set(e.pointerId,p);
    if(pts.size===1&&!G.two){const dx=p.x-G.p0.x,dy=p.y-G.p0.y;if(Math.abs(dx)+Math.abs(dy)>.01)G.mov=true;
      if(G.el){G.el.x=G.b.x+dx;G.el.y=G.b.y+dy;edPosEl(G.el);const lx=$("#ce-lixo");if(lx){lx.hidden=false;const perto=p.y>.86&&Math.abs(p.x-.5)<.14;lx.classList.toggle("on",perto);G.lixo=perto}}
      else if(ED.st.bg.tipo==="foto"){ED.st.bg.ox=G.b.ox+dx;ED.st.bg.oy=G.b.oy+dy;edBgPos()}}
    else if(pts.size>=2&&G.two){const b=base();if(G.lixo){G.lixo=false;const lx=$("#ce-lixo");if(lx)lx.classList.remove("on")}const k=b.d/G.two.d,da=b.a-G.two.a;
      if(G.el){G.el.s=Math.max(.3,Math.min(5,G.b2.s*k));G.el.r=G.b2.r+da;G.el.x=G.b2.x+(b.m.x-G.two.m.x);G.el.y=G.b2.y+(b.m.y-G.two.m.y);edPosEl(G.el)}
      else if(ED.st.bg.tipo==="foto"){ED.st.bg.z=Math.max(1,Math.min(5,G.b2.z*k));ED.st.bg.ox=G.b2.ox+(b.m.x-G.two.m.x);ED.st.bg.oy=G.b2.oy+(b.m.y-G.two.m.y);edBgPos()}}});
  const fim=e=>{if(ED.st.ferr==="caneta"){edDesenhaFim(e);return}if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(pts.size)return;const g=G;G=null;const lx=$("#ce-lixo");if(lx){lx.hidden=true;lx.classList.remove("on")}if(!g)return;
    if(g.el&&g.lixo){ED.st.els=ED.st.els.filter(x=>x!==g.el);vibrar(10);edEls();return}
    if(!g.mov&&Date.now()-g.t0<350){ED._abriu=Date.now();const el=g.el;setTimeout(()=>{if(!ED||ED.env||$("#layer .ce-tx,#layer .ce-sel,#layer .ce-fig"))return;if(el&&el.t==="texto")edTexto(el);else if(el&&el.t==="enq")edEnquete(el);else if(!el)edTexto(null)},60)}};
  cv.addEventListener("pointerup",fim);cv.addEventListener("pointercancel",fim)}
/* caneta */
function edDesenhaIni(e){if(ED._tr)return;ED._trp=e.pointerId;const cv=$("#ce-cv"),r=cv.getBoundingClientRect(),c=ED.st.caneta;ED._tr={cor:c.cor,w:c.w,bor:c.bor,neon:c.neon,pts:[[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]]};ED.st.tracos.push(ED._tr);try{cv.setPointerCapture(e.pointerId)}catch(_){}edTracos()}
function edDesenhaMove(e){if(!ED._tr||e.pointerId!==ED._trp)return;const r=$("#ce-cv").getBoundingClientRect();ED._tr.pts.push([(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]);edTracos()}
function edDesenhaFim(e){if(e&&e.pointerId!==ED._trp)return;ED._tr=null}
function edCaneta(){ED.st.ferr="caneta";ED.st.caneta=ED.st.caneta||{cor:"#ffffff",w:.012,bor:false,neon:false};const c=ED.st.caneta;
  const ov=document.createElement("div");ov.className="ce-cn";ov.innerHTML=`<div class="ce-top"><button type="button" class="ce-b" data-edcndesf aria-label="Desfazer">${EDI.desf}</button><span class="sp"></span><button type="button" class="ce-chip${c.neon?" on":""}" data-edcnneon>Neon</button><button type="button" class="ce-chip${c.bor?" on":""}" data-edcnbor>Borracha</button><button type="button" class="ce-ok" data-edcnok>Concluir</button></div>
    <input type="range" class="ce-esp" id="ce-esp" min="4" max="40" value="${Math.round(c.w*1000)}" aria-label="Espessura"><div class="ce-cores">${ED_CORES.map(x=>`<button type="button" data-edcncor="${x}" style="background:${x}" aria-pressed="${x===c.cor}"></button>`).join("")}</div>`;
  $("#layer .ce").appendChild(ov);$("#layer .ce").classList.add("desenhando");$("#ce-esp").addEventListener("input",e=>{c.w=e.target.value/1000})}
/* texto */
function edTexto(el){const novo=!el;const e=el||{id:edNid(),t:"texto",tx:"",f:"classico",cor:"#ffffff",al:"c",fd:0,x:.5,y:.42,s:1,r:0};if(!novo)e._velho=e.tx;
  const ov=document.createElement("div");ov.className="ce-tx";ov.innerHTML=`<div class="ce-top"><button type="button" class="ce-b" data-edtxal aria-label="Alinhamento">${e.al==="e"?"⇤":e.al==="d"?"⇥":"≡"}</button><button type="button" class="ce-b ce-fd" data-edtxfd aria-label="Fundo do texto"><b class="ce-aa">A</b></button><span class="sp"></span><button type="button" class="ce-ok" data-edtxok>Concluir</button></div>
    <div class="ce-txm"><div class="ce-t f-${e.f} al-${e.al}${e.fd?" fd"+e.fd:""}" style="--cor:${e.cor}"><textarea id="ce-txa" rows="1" maxlength="220" aria-label="Texto do story" placeholder="Escreva…">${esc(e.tx)}</textarea></div></div>
    <div class="ce-fts">${ED_FONTES.map(([k,n])=>`<button type="button" class="ce-chip f-${k}${k===e.f?" on":""}" data-edtxf="${k}">${n}</button>`).join("")}</div>
    <div class="ce-cores">${ED_CORES.map(x=>`<button type="button" data-edtxcor="${x}" style="background:${x}" aria-pressed="${x===e.cor}"></button>`).join("")}</div>`;
  const cvw=$("#ce-cv")?.clientWidth;if(cvw)ov.style.setProperty("--bw",cvw+"px");ov.querySelector("[data-edtxfd]").dataset.fd=e.fd||0;
  ED.st.tx=e;ED.st.txNovo=novo;$("#layer .ce").appendChild(ov);$("#layer .ce").classList.add("tx-on");if(!novo)$(`#ce-els [data-eid="${e.id}"]`)?.classList.add("editando");const ta=$("#ce-txa");const auto=()=>{ta.style.height="auto";ta.style.height=ta.scrollHeight+"px"};ta.addEventListener("input",()=>{e.tx=ta.value;auto();if(typeof menSugere==="function")menSugere(ta)});setTimeout(()=>{auto();ta.focus();try{ta.setSelectionRange(ta.value.length,ta.value.length)}catch(_){}},30)}
function edTextoOk(){const e=ED.st.tx;if(!e)return;e.tx=String(e.tx||"").trim();if(e.tx){if(ED.st.txNovo)ED.st.els.push(e)}else ED.st.els=ED.st.els.filter(x=>x!==e);delete e._velho;ED.st.tx=null;$("#layer .ce-tx")?.remove();$("#layer .ce")?.classList.remove("tx-on");if(typeof menFecha==="function")menFecha();edDesenha()}
function edTxRefaz(){const e=ED.st.tx,box=$("#layer .ce-tx .ce-t");if(!e||!box)return;box.className=`ce-t f-${e.f} al-${e.al}${e.fd?" fd"+e.fd:""}`;box.style.setProperty("--cor",e.cor);
  document.querySelectorAll("#layer .ce-tx [data-edtxf]").forEach(b=>b.classList.toggle("on",b.dataset.edtxf===e.f));document.querySelectorAll("#layer .ce-tx [data-edtxcor]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.edtxcor===e.cor)));
  const fdb=$("#layer [data-edtxfd]");if(fdb)fdb.dataset.fd=e.fd||0;const al=$("#layer [data-edtxal]");if(al)al.textContent=e.al==="e"?"⇤":e.al==="d"?"⇥":"≡";$("#ce-txa")?.focus()}
/* figurinhas */
function edFigs(){const ov=document.createElement("div");ov.className="ce-fig";ov.innerHTML=`<div class="ce-figp"><div class="grab"></div><div class="ce-figs"><button type="button" data-edfig="men" class="fg-men">@MENÇÃO</button><button type="button" data-edfig="enq" class="fg-enq">ENQUETE</button><button type="button" data-edfig="nt" class="fg-nt">📰 NOTÍCIA</button><button type="button" data-edfig="hora" class="fg-hora">${esc(hhmm(new Date().toISOString()).replace("h",":"))}</button></div><div class="ce-emos">${ED_EMOJIS.map(x=>`<button type="button" data-edemo="${x}">${x}</button>`).join("")}</div></div>`;
  $("#layer .ce").appendChild(ov)}
function edAdd(e){ED.st.els.push({id:edNid(),x:.5,y:.5,s:1,r:0,...e});$("#layer .ce-fig")?.remove();$("#layer .ce-sel")?.remove();edDesenha()}
function edEnquete(el){const e=el||{t:"enq",q:"",o:["Sim","Não"]};const ov=document.createElement("div");ov.className="ce-sel";ov.innerHTML=`<div class="ce-selp"><b>Enquete</b><input class="field" id="ce-eq" maxlength="80" placeholder="Faça uma pergunta…" value="${esc(e.q||"")}"><input class="field" id="ce-e0" maxlength="24" value="${esc(e.o[0]||"Sim")}"><input class="field" id="ce-e1" maxlength="24" value="${esc(e.o[1]||"Não")}"><div class="ce-selb"><button type="button" class="btn ghost" data-edselx>Cancelar</button><button type="button" class="btn" data-edenqok>${el?"Salvar":"Pôr no story"}</button></div></div>`;
  ED.st.enqEd=el||null;$("#layer .ce-fig")?.remove();$("#layer .ce").appendChild(ov);setTimeout(()=>$("#ce-eq")?.focus(),40)}
function edLista(tit,itens,attr){const ov=document.createElement("div");ov.className="ce-sel";ov.innerHTML=`<div class="ce-selp"><b>${esc(tit)}</b><input class="field" id="ce-lq" type="search" placeholder="Buscar" autocomplete="off"><ul class="ce-lis">${itens.map(([v,h])=>`<li><button type="button" ${attr}="${esc(v)}">${h}</button></li>`).join("")||`<li class="hint">Nada por aqui</li>`}</ul><div class="ce-selb"><button type="button" class="btn ghost" data-edselx>Cancelar</button></div></div>`;
  $("#layer .ce-fig")?.remove();$("#layer .ce").appendChild(ov);$("#ce-lq").addEventListener("input",e=>{const n=norm(e.target.value).trim();ov.querySelectorAll(".ce-lis li").forEach(li=>li.hidden=!!n&&!norm(li.textContent).includes(n))})}
const edListaNoticias=attr=>edLista("Notícia",ordenadas(visiveis()).slice(0,60).map(p=>[p.id,`<small style="color:${secCor(secOf(p))}">${esc(secNome(secOf(p)))}</small><b>${esc(versao(p,lente()).titulo)}</b>`]),attr);
const edListaAmigos=(attr,tit)=>edLista(tit||"Mencionar",amigosL().map(u=>[u,`${avatar(u)}<b>${esc(nomeDe(u))}</b>`]),attr);
/* exporta o story como imagem 1080×1920 */
function edLinhas(g,tx,max){const out=[];String(tx).split("\n").forEach(par=>{const ws=par.split(" ");let l="";
    ws.forEach(w=>{const t=l?l+" "+w:w;if(g.measureText(t).width<=max){l=t;return}if(l){out.push(l);l=""}
      if(g.measureText(w).width<=max){l=w;return}let p="";for(const ch of w){if(g.measureText(p+ch).width>max&&p){out.push(p);p=ch}else p+=ch}l=p});out.push(l)});return out}
function edFonte(f,px){return f==="moderno"?`italic 600 ${px}px Newsreader, Georgia, serif`:f==="forte"?`900 ${px}px "Public Sans", system-ui, sans-serif`:f==="maquina"?`500 ${px}px "Courier New", ui-monospace, monospace`:`700 ${px}px "Public Sans", system-ui, sans-serif`}
function edRR(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function edPintaEl(g,e,W,H){g.save();g.translate(e.x*W,e.y*H);g.rotate((e.r||0)*Math.PI/180);g.scale(e.s||1,e.s||1);
  if(e.t==="texto"){const px=W*.075,tx=e.f==="forte"?String(e.tx).toUpperCase():e.tx;g.font=edFonte(e.f,px);const ls=edLinhas(g,tx,W*.8-px*.25),lh=px*1.25,h=ls.length*lh;g.textBaseline="middle";
    const al=e.al==="e"?"left":e.al==="d"?"right":"center";g.textAlign=al;const mw=Math.max(...ls.map(l=>g.measureText(l).width));const x0=al==="left"?-mw/2:al==="right"?mw/2:0;
    ls.forEach((l,i)=>{const y=-h/2+lh*(i+.5),w=g.measureText(l).width;if(e.fd){const bx=al==="left"?x0:al==="right"?x0-w:-w/2;g.fillStyle=e.fd===1?e.cor:"rgba(0,0,0,.55)";edRR(g,bx-px*.25,y-lh/2,w+px*.5,lh,px*.22);g.fill()}
      g.fillStyle=e.fd===1?(e.cor==="#ffffff"||e.cor==="#ffd23f"||e.cor==="#f2c27b"?"#111111":"#ffffff"):e.cor;if(e.f==="neon"){g.shadowColor=e.cor;g.shadowBlur=px*.5;g.fillStyle="#ffffff"}else if(!e.fd){g.shadowColor="rgba(0,0,0,.35)";g.shadowBlur=px*.25}g.fillText(l,x0,y);g.shadowBlur=0})}
  else if(e.t==="emoji"){g.font=`${W*.16}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;g.textAlign="center";g.textBaseline="middle";g.fillText(e.tx,0,0)}
  else if(e.t==="hora"){const px=W*.07;g.font=`800 ${px}px "Public Sans", sans-serif`;const w=g.measureText(e.tx).width;g.fillStyle="#ffffff";edRR(g,-w/2-px*.45,-px*.75,w+px*.9,px*1.5,px*.35);g.fill();g.fillStyle="#111";g.textAlign="center";g.textBaseline="middle";g.fillText(e.tx,0,px*.04)}
  else if(e.t==="men"){const px=W*.06,t="@"+String(nomeDe(e.uid)).toUpperCase();g.font=`900 ${px}px "Public Sans", sans-serif`;const w=g.measureText(t).width;g.fillStyle="#ffffff";edRR(g,-w/2-px*.45,-px*.8,w+px*.9,px*1.6,px*.35);g.fill();g.fillStyle="#c2185b";g.textAlign="center";g.textBaseline="middle";g.fillText(t,0,px*.04)}
  g.restore()}
async function edExportaStory(){const W=1080,H=1920,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d"),b=ED.st.bg;
  try{await Promise.all(ED.st.els.filter(e=>e.t==="texto").map(e=>document.fonts.load(edFonte(e.f,40),e.tx)).concat([document.fonts.load('900 40px "Public Sans"'),document.fonts.load('800 40px "Public Sans"')]));await document.fonts.ready}catch(e){}
  if(b.tipo==="foto"){g.fillStyle="#000";g.fillRect(0,0,W,H);edCover(g,b.img,W,H,b.z,b.ox,b.oy)}else{const f=PUB_FUNDOS[(+b.g||0)%PUB_FUNDOS.length],gr=g.createLinearGradient(W*.2,0,W*.8,H);gr.addColorStop(0,f[0]);gr.addColorStop(1,f[1]);g.fillStyle=gr;g.fillRect(0,0,W,H)}
  const d=document.createElement("canvas");d.width=W;d.height=H;edPintaTracos(d.getContext("2d"),W,H);g.drawImage(d,0,0);
  ED.st.els.filter(e=>e.t!=="enq"&&e.t!=="nt").forEach(e=>edPintaEl(g,e,W,H));
  return new Promise((ok,no)=>c.toBlob(x=>x?ok(x):no(new Error("img")),"image/jpeg",.86))}
async function edPublicaStory(){if(!ED||ED.env)return;const st=ED.st;if(!st.els.length&&!st.tracos.length&&st.bg.tipo!=="foto"){toast("Escreva algo, escolha uma foto ou ponha uma figurinha.");return}
  ED.env=true;const ed0=ED;edDesenha();const fotos=[];try{const blob=await edExportaStory();fotos.push(await pubSobe(blob));const at=Date.now();
    const itens=st.els.filter(e=>["enq","nt","men"].includes(e.t)).map(e=>{const o={t:e.t,x:+e.x.toFixed(4),y:+e.y.toFixed(4),s:+(e.s||1).toFixed(3),r:Math.round(e.r||0)};if(e.t==="enq"){o.q=e.q;o.o=e.o}if(e.t==="nt")o.pid=e.pid;if(e.t==="men")o.uid=e.uid;return o}).slice(0,8);
    const nt=st.els.find(e=>e.t==="nt"),texto=st.els.filter(e=>e.t==="texto").map(e=>e.tx).join(" · ").slice(0,300);
    const row={autor:S.uid,tipo:"story",at,expira:at+86400000,texto,fotos,pid:nt?nt.pid:null,snap:nt?pubSnap(nt.pid):null,estilo:{v:2,itens}};
    const r=await SB.from("publicacoes").insert(row).select("id");if(r.error)throw r.error;const id=r.data&&r.data[0]&&r.data[0].id;PUB.itens.unshift({...row,id});PUB.urls[fotos[0]]={u:URL.createObjectURL(blob),exp:Date.now()+3600e3};
    const men=[...new Set(st.els.filter(e=>e.t==="men").map(e=>e.uid).concat(typeof mencionados==="function"?mencionados(texto):[]))].filter(u=>S.amigos.has(u));
    const aqui=ED===ed0&&$("#layer .ce");ED=null;if(aqui){closeLayer._ok=true;closeLayer()}toast("Story publicado. Some em 24 horas.");vibrar(10);
    if(id&&men.length)Promise.all(men.map(u=>dmEnviar(u,{texto:"Mencionou você no story",pid:"u:"+id,snap:{titulo:"Story de "+nomeDe(S.uid),upub:id,story:true},tipo:"mencao"},true)));pubRedesenha();setTimeout(pubCarregar,1500)}
  catch(e){if(fotos.length)try{await SB.storage.from("fotos").remove(fotos)}catch(_){}if(ED===ed0){ED.env=false;edDesenha()}toast("Não deu para publicar. Tente de novo.")}}

/* ===== POST ===== */
function edPost(el){const P=ED.po,f=P.fotos[P.cur];
  if(P.passo==="fotos"){
    el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edfechar aria-label="Fechar">${EDI.x}</button><b>Novo post</b><button type="button" class="ce-av" data-edav ${P.fotos.length?"":"disabled"}>Avançar</button></div>
      ${P.fotos.length?`<div class="ce-pvw"><div class="ce-pv" id="ce-pv"><img id="ce-pvi" alt="" draggable="false"></div><button type="button" class="ce-arb" data-edar>${P.ar==="orig"?"Original":P.ar}</button>${P.fotos.length>1?`<span class="ce-npg">${P.cur+1}/${P.fotos.length}</span>`:""}</div>
        <div class="ce-tira">${P.fotos.map((x,i)=>`<button type="button" class="ce-tb${i===P.cur?" on":""}" data-edcur="${i}"><img alt="" data-i="${i}">${i===P.cur?`<i data-edtira="${i}" role="button" aria-label="Tirar foto">✕</i>`:""}</button>`).join("")}${P.fotos.length<10?`<button type="button" class="ce-tb ce-tbm" data-edpgal aria-label="Mais fotos">+</button>`:""}</div>
        <p class="ce-dica2">Arraste e pince a foto para enquadrar. Toque no formato para trocar.</p>`
      :`<div class="ce-vz"><button type="button" class="ce-big" data-edpgal>${EDI.gal}<b>Escolher fotos</b><span>até 10, da galeria</span></button><div class="ce-vz2"><button type="button" data-edsotexto>Só texto</button><button type="button" data-edsont>Notícia do Prumo</button></div></div>`}
      ${edModos()}<input type="file" id="ce-pfile" accept="image/*" multiple hidden>`;
    if(f){$("#ce-pvi").src=f.url;edPvTam();edPvPos();el.querySelectorAll(".ce-tb img").forEach(im=>{im.src=P.fotos[+im.dataset.i].url});edGestosPv()}
    $("#ce-pfile").addEventListener("change",async e=>{const tot=e.target.files.length,fs=[...e.target.files].slice(0,10-P.fotos.length);e.target.value="";if(tot>fs.length)toast("Um post tem no máximo 10 fotos.");if(!fs.length)return;for(const x of fs){try{const r=await edCarrega(x,2048);P.fotos.push({...r,z:1,ox:0,oy:0,f:"normal",aj:{}})}catch(err){toast("Não deu para abrir uma das fotos.")}}P.cur=Math.max(0,P.fotos.length-fs.length);edDesenha()})}
  else if(P.passo==="filtros"){
    el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="fotos" aria-label="Voltar">${EDI.vol}</button><b>Editar</b><button type="button" class="ce-av" data-edav>Avançar</button></div>
      <div class="ce-pvw"><canvas id="ce-fc" class="ce-fc"></canvas>${P.fotos.length>1?`<button type="button" class="ce-nav l" data-edfn="-1" aria-label="Foto anterior">‹</button><button type="button" class="ce-nav r" data-edfn="1" aria-label="Próxima foto">›</button><span class="ce-npg">${P.cur+1}/${P.fotos.length}</span>`:""}</div>
      <div class="ce-abas2"><button type="button" data-edaba="filtros" aria-selected="${P.aba==="filtros"}">Filtros</button><button type="button" data-edaba="editar" aria-selected="${P.aba==="editar"}">Editar</button></div>
      ${P.aba==="filtros"?`<div class="ce-flts">${ED_FILTROS.map(([k,n])=>`<button type="button" data-edflt="${k}" class="${k===f.f?"on":""}"><canvas data-fk="${k}" width="72" height="72"></canvas><span>${n}</span></button>`).join("")}</div>`
        :`<div class="ce-ajs">${[["b","Brilho"],["c","Contraste"],["s","Saturação"],["w","Calor"]].map(([k,n])=>`<label><span>${n}<i id="ce-aj-${k}">${f.aj[k]||0}</i></span><input type="range" min="-50" max="50" value="${f.aj[k]||0}" data-edaj="${k}"></label>`).join("")}</div>`}`;
    edPrevFiltro();if(P.aba==="filtros")edMiniFiltros()}
  else{const tem=P.fotos.length,nt=P.pid&&pautaById(P.pid);
    el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="${tem?"filtros":"fotos"}" aria-label="Voltar">${EDI.vol}</button><b>Novo post</b><button type="button" class="ce-av" data-edpubpo ${ED.env?"disabled":""}>${ED.env?"Publicando…":"Compartilhar"}</button></div>
      <div class="ce-det"><div class="ce-legr">${tem?`<canvas id="ce-dthumb" width="128" height="160"></canvas>`:`<span class="ce-dsem" style="background:${pubFundo(1)}">Aa</span>`}<textarea id="ce-leg" maxlength="2200" rows="4" placeholder="${tem||P.pid?"Escreva uma legenda…":"Escreva o seu post…"}" aria-label="Legenda">${esc(P.texto)}</textarea></div>
        <button type="button" class="ce-row" data-edmarcar><span>Marcar pessoas</span><em>${P.marcados.length?esc(P.marcados.map(u=>String(nomeDe(u)).split(" ")[0]).join(", ")):""}</em><i>›</i></button>
        <label class="ce-row"><span>Adicionar local</span><input id="ce-local" maxlength="60" placeholder="Ex.: Rio de Janeiro" value="${esc(P.local)}"></label>
        <button type="button" class="ce-row" data-edsont><span>${nt?"Notícia anexada":"Anexar notícia"}</span><em>${nt?esc(versao(nt,lente()).titulo):""}</em><i>›</i></button>
        ${nt?`<button type="button" class="ce-row ce-semnt" data-edsemnt><span>Tirar a notícia</span></button>`:""}
        <p class="cr-quem">Seus amigos no Prumo vão ver. Use @ para marcar alguém na legenda.</p></div>`;
    const ta=$("#ce-leg");ta.addEventListener("input",()=>{P.texto=ta.value;if(typeof menSugere==="function")menSugere(ta)});$("#ce-local").addEventListener("input",e=>{P.local=e.target.value});
    if(tem){const c=$("#ce-dthumb"),x=P.fotos[0];edRenderFoto(x,c,P.ar,false)}}}
function edPvTam(){const pv=$("#ce-pv"),P=ED&&ED.po;if(!pv||!P||!P.fotos.length)return;const k=edAR(P.ar,P.fotos[0].img),W=pv.parentElement.clientWidth||innerWidth,maxH=Math.round(innerHeight*.58);let w=W,h=w/k;if(h>maxH){h=maxH;w=h*k}pv.style.cssText=`width:${Math.round(w)}px;height:${Math.round(h)}px;max-height:none`;P.fotos.forEach(f=>edLimita(f,pv))}
function edPvPos(){const i=$("#ce-pvi"),f=ED&&ED.po.fotos[ED.po.cur];if(!i||!f)return;edPosImg(i,f,$("#ce-pv"))}
function edLimita(f,box){const r=box.getBoundingClientRect(),W=r.width||1,H=r.height||1,iw=f.img.naturalWidth,ih=f.img.naturalHeight,k=Math.max(W/iw,H/ih)*f.z;const lx=Math.max(0,(iw*k-W)/2/W),ly=Math.max(0,(ih*k-H)/2/H);f.ox=Math.max(-lx,Math.min(lx,f.ox));f.oy=Math.max(-ly,Math.min(ly,f.oy))}
function edGestosPv(){const pv=$("#ce-pv");if(!pv)return;const pts=new Map();let G=null;const xy=e=>{const r=pv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,cx:e.clientX,cy:e.clientY}};
  const dist=()=>{const p=[...pts.values()];return p.length<2?0:Math.hypot(p[1].cx-p[0].cx,p[1].cy-p[0].cy)};
  pv.addEventListener("pointerdown",e=>{pts.set(e.pointerId,xy(e));try{pv.setPointerCapture(e.pointerId)}catch(_){}const f=ED.po.fotos[ED.po.cur];G={p0:xy(e),b:{...f},d0:dist()}});
  pv.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId)||!G)return;const p=xy(e);pts.set(e.pointerId,p);const f=ED.po.fotos[ED.po.cur];
    if(pts.size===1){f.ox=G.b.ox+(p.x-G.p0.x);f.oy=G.b.oy+(p.y-G.p0.y)}else{if(!G.d0){G.d0=dist();G.b={...f}}f.z=Math.max(1,Math.min(5,G.b.z*dist()/G.d0))}
    edLimita(f,pv);edPvPos()});
  const fim=e=>{pts.delete(e.pointerId);if(!pts.size)G=null;else G={p0:[...pts.values()][0],b:{...ED.po.fotos[ED.po.cur]},d0:0}};pv.addEventListener("pointerup",fim);pv.addEventListener("pointercancel",fim)}
function edRenderFoto(f,c,ar,filtro,maxW){const k=edAR(ar,(ED&&ED.po.fotos[0]||f).img),W=c.width,H=Math.round(W/k);c.height=H;const g=c.getContext("2d");g.fillStyle="#000";g.fillRect(0,0,W,H);edCover(g,f.img,W,H,f.z,f.ox,f.oy);if(filtro!==false)edFiltra(c,f.f,f.aj);return c}
let ED_FT=0;function edPrevFiltro(){clearTimeout(ED_FT);ED_FT=setTimeout(()=>{const c=$("#ce-fc"),P=ED&&ED.po;if(!c||!P)return;c.width=Math.min(720,Math.round((c.parentElement.clientWidth||360)*Math.min(2,devicePixelRatio||1)));edRenderFoto(P.fotos[P.cur],c,P.ar)},20)}
function edMiniFiltros(){const P=ED.po,f=P.fotos[P.cur];const b=document.createElement("canvas");b.width=72;b.height=72;const g=b.getContext("2d");edCover(g,f.img,72,72,f.z,f.ox,f.oy);
  document.querySelectorAll("#layer [data-fk]").forEach(c=>{const x=c.getContext("2d");x.drawImage(b,0,0);edFiltra(c,c.dataset.fk,{})})}
async function edPublicaPost(){if(!ED||ED.env)return;const P=ED.po;if(!P.fotos.length&&!P.texto.trim()&&!P.pid){toast("Escreva algo, escolha fotos ou anexe uma notícia.");return}ED.env=true;const ed0=ED;edDesenha();const fotos=[];
  try{for(const f of P.fotos){const c=document.createElement("canvas");c.width=1080;edRenderFoto(f,c,P.ar);const b=await new Promise((ok,no)=>c.toBlob(x=>x?ok(x):no(new Error("img")),"image/jpeg",.86));fotos.push(await pubSobe(b));PUB.urls[fotos[fotos.length-1]]={u:URL.createObjectURL(b),exp:Date.now()+3600e3}}
    const at=Date.now(),row={autor:S.uid,tipo:"post",at,texto:P.texto.trim().slice(0,2200),fotos,pid:P.pid||null,snap:pubSnap(P.pid),estilo:{v:2,ar:P.ar,arv:P.fotos.length?+edAR(P.ar,P.fotos[0].img).toFixed(3):null,marcados:P.marcados.slice(0,20),local:P.local.trim().slice(0,60)}};
    const r=await SB.from("publicacoes").insert(row).select("id");if(r.error)throw r.error;const id=r.data&&r.data[0]&&r.data[0].id;PUB.itens.unshift({...row,id});
    const txt=row.texto,marc=P.marcados.slice(),aqui=ED===ed0&&$("#layer .ce");ED=null;if(aqui){closeLayer._ok=true;closeLayer()}toast("Post publicado");vibrar(10);
    if(id&&txt)pubAvisarMencoes(id,txt,"post");const mm=marc.filter(u=>S.amigos.has(u)&&!(typeof mencionados==="function"&&mencionados(txt).includes(u)));
    if(id&&mm.length)Promise.all(mm.map(u=>dmEnviar(u,{texto:"",pid:"u:"+id,snap:{titulo:"Post de "+nomeDe(S.uid),upub:id},tipo:"mencao"},true)));pubRedesenha();setTimeout(pubCarregar,1500)}
  catch(e){if(fotos.length)try{await SB.storage.from("fotos").remove(fotos)}catch(_){}if(ED===ed0){ED.env=false;edDesenha()}toast("Não deu para publicar. Tente de novo.")}}

/* ===== cliques do editor ===== */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest||!$("#layer .ce")||!ED)return;if(t.closest("#layer2"))return;let b;const st=ED.st,P=ED.po;
  const pare=()=>{e.stopPropagation();e.preventDefault()};ED._volta=0;
  if(ED.env){pare();toast("Publicando…");return}
  if(b=t.closest("[data-edmodo]")){pare();if(!ED.env){ED.modo=b.dataset.edmodo;edDesenha()}return}
  if(t.closest("[data-edfechar]")){pare();edFechar();return}
  if(t.closest("[data-edgal]")){pare();const f=$("#ce-file");if(f){f.multiple=ED.modo==="story"&&ED.tela!=="lay";f.click()}return}
  if(t.closest("[data-edsemfoto]")){pare();st.bg={tipo:"grad",g:Math.floor(Math.random()*PUB_FUNDOS.length)};edDesenha();return}
  if(t.closest("[data-edfundo]")){pare();st.bg.g=((+st.bg.g||0)+1)%PUB_FUNDOS.length;edDesenha();return}
  if(t.closest("[data-edtexto]")){pare();edTexto(null);return}
  if(t.closest("[data-edfig]")&&!t.closest(".ce-fig")){pare();edFigs();return}
  if(t.closest("[data-edcaneta]")){pare();edCaneta();return}
  if(t.closest("[data-edpubst]")){pare();edPublicaStory(t.closest("[data-edpubst]").dataset.edpubst);return}
  /* texto */
  if(b=t.closest("[data-edtxf]")){pare();st.tx.f=b.dataset.edtxf;edTxRefaz();return}
  if(b=t.closest("[data-edtxcor]")){pare();st.tx.cor=b.dataset.edtxcor;edTxRefaz();return}
  if(t.closest("[data-edtxal]")){pare();st.tx.al=st.tx.al==="c"?"e":st.tx.al==="e"?"d":"c";edTxRefaz();return}
  if(t.closest("[data-edtxfd]")){pare();st.tx.fd=((st.tx.fd||0)+1)%3;edTxRefaz();return}
  if(t.closest("[data-edtxok]")){pare();edTextoOk();return}
  if(t.matches(".ce-tx,.ce-txm")&&Date.now()-(ED._abriu||0)>500){pare();edTextoOk();return}
  /* caneta */
  if(b=t.closest("[data-edcncor]")){pare();st.caneta.cor=b.dataset.edcncor;st.caneta.bor=false;document.querySelectorAll("#layer [data-edcncor]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));$("#layer [data-edcnbor]")?.classList.remove("on");return}
  if(t.closest("[data-edcnbor]")){pare();st.caneta.bor=!st.caneta.bor;t.closest("[data-edcnbor]").classList.toggle("on",st.caneta.bor);return}
  if(t.closest("[data-edcnneon]")){pare();st.caneta.neon=!st.caneta.neon;t.closest("[data-edcnneon]").classList.toggle("on",st.caneta.neon);return}
  if(t.closest("[data-edcndesf]")){pare();st.tracos.pop();edTracos();return}
  if(t.closest("[data-edcnok]")){pare();st.ferr=null;$("#layer .ce-cn")?.remove();$("#layer .ce").classList.remove("desenhando");edDesenha();return}
  /* figurinhas */
  if(b=t.closest("[data-edemo]")){pare();edAdd({t:"emoji",tx:b.dataset.edemo,x:.3+Math.random()*.4,y:.3+Math.random()*.3});return}
  if(b=t.closest(".ce-fig [data-edfig]")){pare();const k=b.dataset.edfig;if(k==="hora")edAdd({t:"hora",tx:hhmm(new Date().toISOString()).replace("h",":"),y:.3});else if(k==="enq")edEnquete(null);else if(k==="nt")edListaNoticias("data-edntsel");else if(k==="men"){if(!amigosL().length){toast("Você ainda não tem amigos no Prumo.");return}edListaAmigos("data-edmensel")}return}
  if(t.closest(".ce-fig")&&!t.closest(".ce-figp")){pare();$("#layer .ce-fig")?.remove();return}
  if(t.closest("[data-edselx]")){pare();$("#layer .ce-sel")?.remove();return}
  if(t.closest("[data-edenqok]")){pare();const q=$("#ce-eq").value.trim()||"Enquete",o=[$("#ce-e0").value.trim()||"Sim",$("#ce-e1").value.trim()||"Não"];if(st.enqEd){st.enqEd.q=q;st.enqEd.o=o;$("#layer .ce-sel")?.remove();edDesenha()}else edAdd({t:"enq",q,o,y:.62});return}
  if(b=t.closest("[data-edntsel]")){pare();const p=pautaById(b.dataset.edntsel);edAdd({t:"nt",pid:b.dataset.edntsel,tit:p?versao(p,lente()).titulo:"",y:.68,s:.9});return}
  if(b=t.closest("[data-edmensel]")){pare();edAdd({t:"men",uid:b.dataset.edmensel,y:.25});return}
  /* post */
  if(t.closest("[data-edpgal]")){pare();$("#ce-pfile")?.click();return}
  if(b=t.closest("[data-edtira]")){pare();P.fotos.splice(+b.dataset.edtira,1);P.cur=Math.max(0,Math.min(P.cur,P.fotos.length-1));edDesenha();return}
  if(b=t.closest("[data-edcur]")){pare();P.cur=+b.dataset.edcur;edDesenha();return}
  if(t.closest("[data-edar]")){pare();P.ar=P.ar==="4:5"?"1:1":P.ar==="1:1"?"orig":"4:5";edDesenha();return}
  if(t.closest("[data-edav]")){pare();P.passo=P.passo==="fotos"?(P.fotos.length?"filtros":"detalhes"):"detalhes";edDesenha();return}
  if(b=t.closest("[data-edvolta]")){pare();P.passo=b.dataset.edvolta;edDesenha();return}
  if(t.closest("[data-edsotexto]")){pare();P.passo="detalhes";edDesenha();setTimeout(()=>$("#ce-leg")?.focus(),60);return}
  if(t.closest("[data-edsont]")){pare();edListaNoticias("data-edpnt");return}
  if(b=t.closest("[data-edpnt]")){pare();P.pid=b.dataset.edpnt;$("#layer .ce-sel")?.remove();if(P.passo==="fotos"&&!P.fotos.length)P.passo="detalhes";edDesenha();return}
  if(t.closest("[data-edsemnt]")){pare();P.pid=null;edDesenha();return}
  if(t.closest("[data-edmarcar]")){pare();edMarcar();return}
  if(b=t.closest("[data-edmarca]")){pare();const u=b.dataset.edmarca;const i=P.marcados.indexOf(u);if(i>=0)P.marcados.splice(i,1);else P.marcados.push(u);b.setAttribute("aria-pressed",String(i<0));return}
  if(t.closest("[data-edmarcaok]")){pare();$("#layer .ce-sel")?.remove();edDesenha();return}
  if(b=t.closest("[data-edfn]")){pare();P.cur=(P.cur+(+b.dataset.edfn)+P.fotos.length)%P.fotos.length;edDesenha();return}
  if(b=t.closest("[data-edaba]")){pare();P.aba=b.dataset.edaba;edDesenha();return}
  if(b=t.closest("[data-edflt]")){pare();P.fotos[P.cur].f=b.dataset.edflt;document.querySelectorAll("#layer [data-edflt]").forEach(x=>x.classList.toggle("on",x===b));edPrevFiltro();return}
  if(t.closest("[data-edpubpo]")){pare();edPublicaPost();return}},true);
document.addEventListener("input",e=>{const r=e.target.closest&&e.target.closest("#layer [data-edaj]");if(!r||!ED)return;const f=ED.po.fotos[ED.po.cur];f.aj[r.dataset.edaj]=+r.value;const i=$("#ce-aj-"+r.dataset.edaj);if(i)i.textContent=r.value;edPrevFiltro()});
function edMarcar(){const P=ED.po,am=amigosL();if(!am.length){toast("Você ainda não tem amigos no Prumo.");return}const ov=document.createElement("div");ov.className="ce-sel";
  ov.innerHTML=`<div class="ce-selp"><b>Marcar pessoas</b><div class="pick dm-pick">${am.map(u=>`<button type="button" data-edmarca="${esc(u)}" aria-pressed="${P.marcados.includes(u)}">${avatar(u)}<span>${esc(nomeDe(u))}</span><i class="dm-ck" aria-hidden="true"></i></button>`).join("")}</div><div class="ce-selb"><button type="button" class="btn" data-edmarcaok>Concluir</button></div></div>`;$("#layer .ce").appendChild(ov)}
function edFechar(){if(ED&&ED.env){toast("Publicando…");return}if(edTemAlgo()){const b=$("#layer [data-edfechar]");if(b&&!b.classList.contains("conf")){b.classList.add("conf");b.innerHTML="Descartar?";setTimeout(()=>{if(b.isConnected){b.classList.remove("conf");b.innerHTML=EDI.x}},2500);return}}ED=null;closeLayer._ok=true;closeLayer()}
{const _cl57=closeLayer;closeLayer=function(fromPop){if($("#layer .ce")&&!($("#layer2")?.innerHTML)){
    if(fromPop===true&&ED){const fica=()=>{if(pushH())HST++};
      if(ED.env){fica();toast("Publicando…");return}
      if($("#layer .ce-sel")){$("#layer .ce-sel").remove();fica();return}
      if($("#layer .ce-fig")){$("#layer .ce-fig").remove();fica();return}
      if(ED.st.tx||$("#layer .ce-tx")){edTextoOk();fica();return}
      if(ED.st.ferr==="caneta"){ED.st.ferr=null;$("#layer .ce-cn")?.remove();$("#layer .ce").classList.remove("desenhando");edDesenha();fica();return}
      if(ED.modo==="post"&&ED.po.passo!=="fotos"){ED.po.passo=ED.po.passo==="detalhes"&&ED.po.fotos.length?"filtros":"fotos";edDesenha();fica();return}
      if(edTemAlgo()&&Date.now()-(ED._volta||0)>3000){ED._volta=Date.now();fica();toast("Volte de novo para descartar o que você fez.");return}}
    if(ED&&(ED.st.tx||$("#layer .ce-tx"))&&fromPop!==true&&!closeLayer._ok){edTextoOk();return}
    ED=null;closeLayer._ok=false}return _cl57.apply(this,arguments)}}
addEventListener("resize",()=>{if($("#layer .ce-st")||$("#ce-cv")){edEncaixa();edTracos()}});

/* ===== ver o story novo (imagem + enquete/notícia/menção tocáveis) ===== */
function usItensHTML(x){const it=(x.estilo&&x.estilo.itens)||[];return it.map((e,k)=>{const tr=`left:${e.x*100}%;top:${e.y*100}%;transform:translate(-50%,-50%) rotate(${e.r||0}deg) scale(${e.s||1})`;
  if(e.t==="enq"){const key="us:"+x.id,vs=votosDe(key),mv=meuVoto(key),tot=Object.keys(vs).length+(mv!=null&&!(S.uid in vs)?1:0),cont=[0,1].map(i=>Object.values(vs).filter(v=>v===i).length+(mv===i&&!(S.uid in vs)?1:0));const res=mv!=null||x.autor===S.uid;
    return `<div class="ce-el us-it" style="${tr}"><div class="ce-enq us-enq${res?" res":""}"><b>${esc(e.q||"")}</b><div class="ce-eo">${(e.o||[]).map((o,i)=>`<button type="button" data-usvoto="${esc(x.id)}" data-i="${i}" class="${mv===i?"meu":""}" style="--p:${tot?Math.round(cont[i]/tot*100):0}%"><span>${esc(o)}</span>${res?`<i>${tot?Math.round(cont[i]/tot*100):0}%</i>`:""}</button>`).join("")}</div>${x.autor===S.uid?`<small>${tot} ${tot===1?"voto":"votos"}</small>`:""}</div></div>`}
  if(e.t==="nt"){const p=pautaById(e.pid);return `<div class="ce-el us-it" style="${tr}"><button type="button" class="ce-nt" data-stmat="${esc(e.pid)}"><small style="color:${secCor(p?secOf(p):"politica")}">${esc(p?secNome(secOf(p)):"Notícia")}</small><b>${esc(p?versao(p,lente()).titulo:"Notícia")}</b><i>Ler a matéria ›</i></button></div>`}
  if(e.t==="men")return `<div class="ce-el us-it us-menh" style="${tr}"><button type="button" class="ce-men us-menb" ${e.uid!==S.uid&&S.amigos.has(e.uid)?`data-conversa="${esc(e.uid)}"`:""} aria-label="${esc(nomeDe(e.uid))}">@${esc(String(nomeDe(e.uid)).toUpperCase())}</button></div>`;return ""}).join("")}
{const _du57=igDrawUser;igDrawUser=function(){const r=_du57.apply(this,arguments);try{const x=ST.itens[ST.i];if(!x||!x.estilo||x.estilo.v!==2)return r;const st=$("#layer .story.sg-user"),si=st&&st.querySelector(".story-in");if(!si)return r;
    st.classList.add("us2");const u=x.fotos[0]&&pubUrl(x.fotos[0]);si.querySelector(".us-body")?.remove();si.querySelector(".us-sh")?.remove();
    const bg=si.querySelector(".sg-bg");bg.removeAttribute("style");bg.innerHTML=u?`<img class="us2-blur" src="${pubSrc(u)}" alt="">`:"";
    const rr=si.getBoundingClientRect(),w=Math.min(rr.width,rr.height*9/16),h=w*16/9;
    bg.insertAdjacentHTML("afterend",`<div class="us2-box" style="width:${w}px;height:${h}px">${u?`<img class="us2-img" src="${pubSrc(u)}" alt="${esc(x.texto||"Story")}">`:""}</div><div class="us2-box us2-ov" style="width:${w}px;height:${h}px;--bw:${w}px"><div class="us2-its">${usItensHTML(x)}</div></div>`)}catch(e){}return r}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer [data-usvoto]");if(!b)return;e.stopPropagation();const id=b.dataset.usvoto,i=+b.dataset.i;const x=pubDe(id);if(!x||x.autor===S.uid||meuVoto("us:"+id)!=null)return;
  if(typeof igPausa==="function")igPausa();Promise.resolve(votar("us:"+id,i)).then(()=>{const box=$("#layer .us2-its");if(box)box.innerHTML=usItensHTML(x);setTimeout(()=>{if(typeof storyRetoma==="function")storyRetoma()},900)});setTimeout(()=>{const box=$("#layer .us2-its");if(box)box.innerHTML=usItensHTML(x)},60)},true);

document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer .story [data-conversa]");if(!b)return;e.stopPropagation();const u=b.dataset.conversa;closeLayer();setTimeout(()=>abrirConversa(u),60)},true);
/* ===== post novo no Feed: formato, local e marcados ===== */
{const _pp57=pubPostHTML;pubPostHTML=function(x){let h=_pp57.apply(this,arguments);const es=x.estilo||{};if(es.v!==2)return h;
  const sub=[es.local?esc(es.local):"",esc(quando(x.at))].filter(Boolean).join(" · ");const com=(es.marcados||[]).filter(u=>S.membros[u]||S.amigos.has(u));
  h=h.replace(/(<span class="ph-nm"><b>)([^<]*)(<\/b><span class="ph-sub">)[^<]*(<\/span>)/,(a,b1,nm,b3,b4)=>b1+nm+(com.length?` <span class="up-com">com ${com.slice(0,2).map(u=>esc(String(nomeDe(u)).split(" ")[0])).join(" e ")}${com.length>2?` e mais ${com.length-2}`:""}</span>`:"")+b3+sub+b4);
  if(es.arv&&x.fotos.length&&Math.abs(es.arv-.8)>.01)h=h.replace('class="post upost"',`class="post upost up-ar" data-ar="${+es.arv}"`);return h}}

