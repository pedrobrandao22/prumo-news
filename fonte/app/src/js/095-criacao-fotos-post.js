/* ---------- Criação: filtros rápidos, foto inteira no story e post no fluxo do Instagram ---------- */
/* ===== 1. filtros rápidos: a prévia usa filtro SVG/CSS (GPU); a foto final continua no edFiltra/edAplica =====
   As contas de edFiltra (brilho, contraste, saturação, calor, esmaecer) são afins por canal, então viram uma
   feColorMatrix exata. Realce/sombras viram uma tabela pela luminância; nitidez, feConvolveMatrix; vinheta, um degradê por cima. */
const CFP_NS="http://www.w3.org/2000/svg",CFP_L=[.2126,.7152,.0722];
var CFP_NIT_A=.5,CFP_NIT_S=1;
var CFP_OK=(()=>{try{return !!(window.CSS&&CSS.supports&&CSS.supports("filter","url(#pf)"))}catch(e){return false}})();
function cfpAfim(b,ct,sa,w,fa){const k=1+ct,ks=1+sa,M=[];for(let i=0;i<3;i++){const r=[];for(let j=0;j<3;j++)r.push((1-fa)*k*(ks*(i===j?1:0)+(1-ks)*CFP_L[j]));r.push((1-fa)*(k*b+.5*(1-k)+(i===0?.08*w:i===2?-.08*w:0))+fa);M.push(r)}return M}
const cfpMix=(M,t)=>M.map((r,i)=>r.map((v,j)=>j<3?t*v+(1-t)*(i===j?1:0):t*v));
const cfpEhId=M=>M.every((r,i)=>r.every((v,j)=>Math.abs(v-(j===i?1:0))<1e-4));
const cfpVals=M=>M.map(r=>[r[0],r[1],r[2],0,r[3]].map(v=>+v.toFixed(5)).join(" ")).join(" ")+" 0 0 0 1 0";
const cfpCM=(M,x)=>`<feColorMatrix type="matrix" ${x||""} values="${cfpVals(M)}"/>`;
function cfpPreset(k){const P=(ED_FILTROS.find(x=>x[0]===k)||ED_FILTROS[0])[2];return cfpAfim(P.b||0,P.c||0,P.s||0,P.w||0,P.f||0)}
function cfpPresetHTML(k){const M=cfpPreset(k);return cfpEhId(M)?"":cfpCM(M)}
/* a mesma ordem do edAplica: filtro (com intensidade) → ajustes → nitidez → realce/sombras → esmaecer (a vinheta vai por cima) */
function cfpFiltroHTML(f){const fi=(f.fi==null?100:f.fi)/100,a=f.aj||{};let s="";
  if(f.f&&f.f!=="normal"&&fi>0){const M=cfpMix(cfpPreset(f.f),Math.min(1,fi));if(!cfpEhId(M))s+=cfpCM(M)}
  if(a.b||a.c||a.s||a.w){const M=cfpAfim((a.b||0)/200,(a.c||0)/100,(a.s||0)/100,(a.w||0)/50,0);if(!cfpEhId(M))s+=cfpCM(M)}
  /* nitidez: máscara de nitidez com desfoque (feConvolveMatrix custava ~8x mais sem GPU); é uma aproximação */
  const n=(a.n||0)/100;if(n>0){const c=+(n*1.1*CFP_NIT_A).toFixed(4);s+=`<feColorMatrix type="matrix" result="cfx" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/><feGaussianBlur in="cfx" stdDeviation="${CFP_NIT_S}" edgeMode="duplicate" result="cfb"/><feComposite in="cfx" in2="cfb" operator="arithmetic" k1="0" k2="${1+c}" k3="${-c}" k4="0"/>`}
  /* realce/sombras: somam um valor que depende da luminância (tabela + composição) */
  const h=(a.h||0)/100,sh=(a.sh||0)/100;if(h||sh){const tv=[];for(let i=0;i<=20;i++){const l=i/20;tv.push((.5+h*.3*Math.max(0,l-.45)/.55+sh*.3*Math.max(0,.55-l)/.55).toFixed(4))}const L=CFP_L.join(" ")+" 0 0 ",T=tv.join(" ");
    s+=`<feColorMatrix type="matrix" result="cfa" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/><feColorMatrix in="cfa" type="matrix" values="${L}${L}${L}0 0 0 1 0"/><feComponentTransfer result="cfd"><feFuncR type="table" tableValues="${T}"/><feFuncG type="table" tableValues="${T}"/><feFuncB type="table" tableValues="${T}"/></feComponentTransfer><feComposite in="cfa" in2="cfd" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5"/>`}
  const fd=(a.fd||0)/100;if(fd){const q=fd*.18;s+=cfpCM([[1-q,0,0,q],[0,1-q,0,q],[0,0,1-q,q]])}return s}
function cfpVinheta(v){if(!v)return "";const st=[];for(let i=0;i<=10;i++)st.push(`rgba(0,0,0,${(v*.85*Math.pow(i/10,2.2)).toFixed(3)}) ${i*10}%`);return `radial-gradient(circle farthest-corner at 50% 50%,${st.join(",")})`}
function cfpSvg(){let s=document.getElementById("cfp-svg");if(!s){s=document.createElementNS(CFP_NS,"svg");s.id="cfp-svg";s.setAttribute("aria-hidden","true");s.setAttribute("focusable","false");s.setAttribute("width","0");s.setAttribute("height","0");s.style.cssText="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;left:-9px;top:-9px";document.body.appendChild(s)}return s}
/* define (ou atualiza) um <filter>; filtro vazio vira "none" (um filtro sem primitivas apagaria a imagem) */
function cfpDefine(id,inner){if(!inner||!CFP_OK)return "none";const s=cfpSvg();let f=document.getElementById(id);if(!f){f=document.createElementNS(CFP_NS,"filter");f.id=id;f.setAttribute("color-interpolation-filters","sRGB");s.appendChild(f)}if(f._h!==inner){f.innerHTML=inner;f._h=inner}return `url(#${id})`}
const cfpFiltroPreset=k=>cfpDefine("cfp-t-"+k,cfpPresetHTML(k));

/* ===== 2. story: a foto inteira (contain), centralizada, com fundo das cores da foto; pinçar ainda amplia para preencher ===== */
function cfpMarcaSts(){if(!ED||!ED.sts)return;ED.sts.forEach(st=>{const b=st&&st.bg;if(b&&b.tipo==="foto"&&b.cont==null)b.cont=true})}
function cfpCores(b){const key=b.f||"normal";if(b._cor&&b._cor.k===key&&b._cor.img===b.img)return b._cor.v;let v=["#111","#111"];
  try{const c=document.createElement("canvas");c.width=16;c.height=16;const g=c.getContext("2d");g.drawImage(b.img,0,0,16,16);if(key!=="normal")edFiltra(c,key,{});const d=g.getImageData(0,0,16,16).data;
    const med=(y0,y1)=>{let r=0,gg=0,bb=0,n=0;for(let y=y0;y<y1;y++)for(let x=0;x<16;x++){const i=(y*16+x)*4;r+=d[i];gg+=d[i+1];bb+=d[i+2];n++}r/=n;gg/=n;bb/=n;const l=.2126*r+.7152*gg+.0722*bb,c=x=>Math.max(0,Math.min(255,Math.round((l+(x-l)*1.3)*.86)));return `rgb(${c(r)},${c(gg)},${c(bb)})`};v=[med(0,3),med(13,16)]}catch(e){}
  b._cor={k:key,img:b.img,v};return v}
function cfpFundoCss(b){const [a,z]=cfpCores(b);return `linear-gradient(180deg,${a},${z})`}
function cfpDesenhaCont(g,img,W,H,f){const [iw,ih]=edWH(img),k=Math.min(W/iw,H/ih)*(f.z||1),w=iw*k,h=ih*k;g.drawImage(img,(W-w)/2+(f.ox||0)*W,(H-h)/2+(f.oy||0)*H,w,h)}
{const _pi95=edPosImg;edPosImg=function(i,f,box){if(!f||!f.cont)return _pi95.apply(this,arguments);const im=edBase(f);if(!box||!im)return;const W=box.clientWidth,H=box.clientHeight,[iw,ih]=edWH(im),k=Math.min(W/iw,H/ih)*(f.z||1),w=iw*k,h=ih*k;
  i.style.cssText=`position:absolute;inset:auto;max-width:none;object-fit:fill;transform:none;width:${w}px;height:${h}px;left:${(W-w)/2+(f.ox||0)*W}px;top:${(H-h)/2+(f.oy||0)*H}px`}}
{const _li95=edLimita;edLimita=function(f,box){if(!f||!f.cont)return _li95.apply(this,arguments);const r=box.getBoundingClientRect(),W=r.width||1,H=r.height||1,[iw,ih]=edWH(edBase(f)),k=Math.min(W/iw,H/ih)*(f.z||1);
  const lx=Math.abs(iw*k-W)/2/W,ly=Math.abs(ih*k-H)/2/H;f.ox=Math.max(-lx,Math.min(lx,f.ox||0));f.oy=Math.max(-ly,Math.min(ly,f.oy||0))}}
{const _es95=edStory;edStory=function(el){cfpMarcaSts();return _es95.apply(this,arguments)}}
/* filtro do story: aparece na hora (CSS); a versão em pixels (igual à foto final) entra quando o dedo para */
var CFP_ST=0;
{const _bs95=edBgSrcs;edBgSrcs=function(){const b=ED&&ED.st&&ED.st.bg;if(!b||b.tipo!=="foto")return _bs95.apply(this,arguments);cfpMarcaSts();const i=$("#ce-bgi"),bg=$("#ce-cv .ce-bg");if(!i)return;
  if(bg)bg.style.background=b.cont?cfpFundoCss(b):"#000";const f=b.f||"normal";clearTimeout(CFP_ST);
  if(f==="normal"||(b._f&&b._f[f])||!CFP_OK){if(bg)bg.style.setProperty("--cfp","none");if(f==="normal")i.src=b.url;else{try{i.src=edFiltSrc(b,f)}catch(e){i.src=b.url}}return}
  if(i.getAttribute("src")!==b.url)i.src=b.url;if(bg)bg.style.setProperty("--cfp",cfpFiltroPreset(f));
  CFP_ST=setTimeout(()=>{if(!ED||ED.st.bg!==b||b.f!==f)return;let s;try{s=edFiltSrc(b,f)}catch(e){return}const t=new Image();t.src=s;
    (t.decode?t.decode():Promise.resolve()).catch(()=>{}).then(()=>{if(!ED||ED.st.bg!==b||b.f!==f)return;const im=$("#ce-bgi"),g2=$("#ce-cv .ce-bg");if(im)im.src=s;if(g2)g2.style.setProperty("--cfp","none")})},60)}}
{const _st95=edStThumbs;edStThumbs=function(){const r=_st95.apply(this,arguments);try{document.querySelectorAll("#layer canvas[data-stt]").forEach(c=>{const st=ED.sts[+c.dataset.stt],b=st&&st.bg;if(!b||b.tipo!=="foto"||!b.cont)return;const g=c.getContext("2d"),W=c.width,H=c.height,[a,z]=cfpCores(b),gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,a);gr.addColorStop(1,z);g.fillStyle=gr;g.fillRect(0,0,W,H);cfpDesenhaCont(g,b.img,W,H,b)})}catch(e){}return r}}
{const _ex95=edExportaStory;edExportaStory=async function(st0,tudo){const st=st0||ED.st,b=st&&st.bg;if(!b||b.tipo!=="foto"||!b.cont)return _ex95.apply(this,arguments);
  try{await Promise.all(st.els.filter(e=>e.t==="texto").map(e=>document.fonts.load(edFonte(e.f,40),e.tx)).concat([document.fonts.load('900 40px "Public Sans"'),document.fonts.load('800 40px "Public Sans"')]));await document.fonts.ready}catch(e){}
  const W=1080,H=1920,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d"),[a,z]=cfpCores(b),gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,a);gr.addColorStop(1,z);g.fillStyle=gr;g.fillRect(0,0,W,H);
  let src=b.img;if(b.f&&b.f!=="normal"){const [iw,ih]=edWH(b.img),k=Math.min(1,2400/Math.max(iw,ih)),s=document.createElement("canvas");s.width=Math.round(iw*k);s.height=Math.round(ih*k);s.getContext("2d").drawImage(b.img,0,0,s.width,s.height);edFiltra(s,b.f,{});src=s}
  cfpDesenhaCont(g,src,W,H,b);g.drawImage(edOverlayCanvas(st,W,H,tudo),0,0);return edJpeg(c)}}

/* ===== 3. post no fluxo do Instagram: galeria → editar (deslizar entre fotos) → legenda e Compartilhar ===== */
Object.assign(EDI,{ar:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 3v14h14"/><path d="M3 7h14v14"/></svg>',mlt:'<svg class="ico" viewBox="0 0 24 24"><rect x="8" y="3.5" width="12.5" height="12.5" rx="2.5"/><path d="M4 8v10a2.5 2.5 0 0 0 2.5 2.5H16"/></svg>',mais:'<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'});
const CFP_TOOLS=[["aj","Ajustar",'<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/>'],["b","Brilho",'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'],["c","Contraste",'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>'],["s","Saturação",'<path d="M12 3s6.5 7.2 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.2 12 3 12 3z"/>'],["w","Calor",'<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>'],["h","Realce",'<circle cx="12" cy="12" r="8.5"/><path d="M4 10h16M5.2 7h13.6M8 4.6h8"/>'],["sh","Sombras",'<circle cx="12" cy="12" r="8.5"/><path d="M4 14h16M5.2 17h13.6M8 19.4h8"/>'],["fd","Esmaecer",'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 9h16" opacity=".8"/><path d="M4 14h16" opacity=".5"/>'],["v","Vinheta",'<rect x="3.5" y="5" width="17" height="14" rx="3"/><ellipse cx="12" cy="12" rx="5" ry="4"/>'],["n","Nitidez",'<path d="M12 4l8.5 15h-17z"/>']];
var CFP_RASC=null,CFP_RAF=0,CFP_SC=0;
{const _rl95=rascLista;rascLista=async function(){const l=await _rl95.apply(this,arguments);CFP_RASC=(l||[]).length;return l}}
setTimeout(()=>{try{if(S&&S.uid)rascLista()}catch(e){}},2500);
function cfpAbreGaleria(){const P=ED&&ED.po;if(!P||ED.modo!=="post"||P.fotos.length||P.rolo&&P.rolo.length||P.passo!=="fotos"||CFP_RASC>0)return;const f=$("#ce-pfile");if(f)try{f.click()}catch(e){}}
/* abrir o post já abre a galeria (sem o toque a mais em "Escolher fotos") */
{const _ca95=criarAbrir;criarAbrir=function(tipo){const r=_ca95.apply(this,arguments);if(tipo!=="story"&&tipo!=="reel")cfpAbreGaleria();return r}}

edPvTam=function(){const pv=$("#ce-pv"),P=ED&&ED.po;if(!pv||!P||!P.fotos.length)return;const box=pv.parentElement,k=edAR(P.ar,edBase(P.fotos[0])),W=box.clientWidth||innerWidth;
  const bh=Math.round(Math.min(innerHeight*.6,W*Math.max(1,1/k)));if(box.classList.contains("cfp-box"))box.style.height=bh+"px";let w=W,h=w/k;if(h>bh){h=bh;w=h*k}
  pv.style.cssText=`width:${Math.round(w)}px;height:${Math.round(h)}px;max-height:none`;P.fotos.forEach(f=>edLimita(f,pv))};

function cfpFotos(el){const P=ED.po,f=P.fotos[P.cur],tem=!!(P.rolo.length&&f),arN=P.ar==="orig"?"Original":P.ar;
  el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edfechar aria-label="Fechar">${EDI.x}</button><b>Novo post</b><button type="button" class="ce-av" data-edav ${P.fotos.length?"":"disabled"}>Avançar</button></div>
    <div class="cfp-box" id="cfp-box">${tem?`<div class="ce-pv" id="ce-pv"><img id="ce-pvi" alt="" draggable="false"></div>
        <button type="button" class="cfp-ar" data-edar aria-label="Formato ${esc(arN)}. Toque para trocar">${EDI.ar}<span>${esc(arN)}</span></button>
        <button type="button" class="cfp-mlt${P.multi?" on":""}" data-edmulti aria-pressed="${!!P.multi}" aria-label="Selecionar várias fotos">${EDI.mlt}</button>${P.fotos.length>1?`<span class="ce-npg">${P.cur+1}/${P.fotos.length}</span>`:""}`
      :`<button type="button" class="cfp-vazio ce-big" data-edpgal>${EDI.gal}<b>Escolher fotos</b><span>Até 10 fotos da galeria</span></button>`}</div>
    ${tem?`<div class="cfp-gh"><b>Galeria</b><span>${P.multi?`${P.fotos.length} de 10`:""}</span></div>
      <div class="ce-grade cfp-grade"><button type="button" class="ce-gi ce-gim" data-edpgal aria-label="Mais fotos da galeria">${EDI.mais}</button>${P.rolo.map((x,i)=>{const n=P.fotos.indexOf(x);return `<button type="button" class="ce-gi${x===f?" on":""}${n>=0?" sel":""}" data-edrolo="${i}" aria-label="Foto ${i+1}${n>=0?", escolhida":""}"><img alt="" data-ri="${i}">${P.multi?`<i class="ce-num${n>=0?" on":""}">${n>=0?n+1:""}</i>`:""}</button>`}).join("")}</div>`
      :`<div class="cfp-opc"><span>Ou comece com</span><div class="ce-vz2"><button type="button" data-edsotexto>Só texto</button><button type="button" data-edsont>Notícia do Prumo</button></div><div id="ce-rascs"></div></div>`}
    ${edModos()}<input type="file" id="ce-pfile" accept="image/*" multiple hidden>`;
  const box=$("#cfp-box");if(!tem)box.style.height=Math.round(Math.min(innerHeight*.6,box.clientWidth||innerWidth))+"px";
  if(tem){$("#ce-pvi").src=edUrlF(f);edPvTam();edPvPos();edGestosPv()}el.querySelectorAll(".ce-grade img[data-ri]").forEach(im=>{im.src=edUrlF(P.rolo[+im.dataset.ri])});
  if(!tem)rascChip();
  $("#ce-pfile").addEventListener("change",async e=>{const fs=[...e.target.files];e.target.value="";if(!fs.length)return;const novos=[];for(const x of fs.slice(0,30)){try{novos.push(edNovaFoto(await edCarrega(x,2048)))}catch(err){toast("Não deu para abrir uma das fotos.")}}if(!novos.length||!ED)return;
    P.rolo.push(...novos);if(novos.length>1)P.multi=true;if(P.multi){const cabe=novos.slice(0,10-P.fotos.length);if(cabe.length<novos.length)toast("Um post tem no máximo 10 fotos.");P.fotos.push(...cabe);P.cur=Math.max(0,P.fotos.length-cabe.length)}else{P.fotos=[novos[0]];P.cur=0}edDesenha()})}

/* editar: prévia grande, deslizar entre as fotos, pontinhos, Filtros / Editar */
function cfpPos(im,f,W,H){const [iw,ih]=edWH(edBase(f)),k=Math.max(W/iw,H/ih)*(f.z||1),w=iw*k,h=ih*k;im.style.cssText=`width:${w}px;height:${h}px;left:${(W-w)/2+(f.ox||0)*W}px;top:${(H-h)/2+(f.oy||0)*H}px`}
function cfpAtualiza(i){const P=ED&&ED.po;if(!P)return;const f=P.fotos[i],sl=document.querySelector(`#cfp-trk [data-cfpsl="${i}"]`);if(!f||!sl)return;const fr=sl.querySelector(".cfp-fr"),inn=fr.querySelector(".cfp-in"),im=inn.querySelector("img"),W=fr.clientWidth,H=fr.clientHeight;
  const u=edUrlF(f);if(im.getAttribute("src")!==u)im.src=u;cfpPos(im,f,W,H);const st=f.str||0,rad=st*Math.PI/180,sc=Math.abs(Math.cos(rad))+Math.abs(Math.sin(rad))*Math.max(W/H,H/W);
  inn.style.transform=st?`rotate(${st}deg) scale(${sc})`:"";inn.style.filter=cfpDefine("cfp-f"+i,cfpFiltroHTML(f));fr.querySelector(".cfp-vg").style.background=cfpVinheta(((f.aj&&f.aj.v)||0)/100)}
function cfpTam(){const P=ED.po,trk=$("#cfp-trk"),pw=$("#layer .cfp-pw");if(!trk||!pw)return;const W=pw.clientWidth||innerWidth,k=edAR(P.ar,edBase(P.fotos[0])),maxH=Math.max(240,innerHeight-290);let w=W,h=W/k;if(h>maxH){h=maxH;w=h*k}
  pw.style.height=Math.round(h)+"px";trk.querySelectorAll(".cfp-fr").forEach(fr=>{fr.style.width=Math.round(w)+"px";fr.style.height=Math.round(h)+"px"})}
function cfpDots(){const P=ED&&ED.po;document.querySelectorAll("#layer .cfp-dots i").forEach((d,i)=>d.classList.toggle("on",i===P.cur))}
function cfpPainel(){const P=ED.po,box=$("#cfp-pn"),f=P.fotos[P.cur];if(!box||!f)return;const fi=f.fi==null?100:f.fi;P.tool=P.tool||"aj";
  if(P.aba!=="editar"){
    if(P.fiOn&&f.f!=="normal")box.innerHTML=`<div class="ce-fi cfp-fi"><span>${esc((ED_FILTROS.find(x=>x[0]===f.f)||[])[1]||"")}</span><input type="range" min="0" max="100" value="${fi}" data-edaj2="fi" aria-label="Intensidade do filtro"><i id="ce-aj2-fi">${fi}</i><button type="button" class="ce-ok" data-edfiok>Concluir</button></div>`;
    else{box.innerHTML=`<div class="cfp-flts" role="listbox" aria-label="Filtros">${ED_FILTROS.map(([k,n])=>`<button type="button" role="option" aria-selected="${k===f.f}" data-edflt="${k}" class="${k===f.f?"on":""}"><span>${esc(n)}</span><i class="cfp-th"><img alt="" draggable="false" style="filter:${cfpFiltroPreset(k)}"></i></button>`).join("")}</div>`;
      const u=edUrlF(f);box.querySelectorAll(".cfp-th img").forEach(im=>{im.src=u});const on=box.querySelector("button.on");if(on)on.scrollIntoView({block:"nearest",inline:"center"})}}
  else{const ajs={str:["Endireitar",-45,45]};ED_AJS.forEach(([k,n,a,b])=>{ajs[k]=[n,a,b]});const val=k=>k==="str"?(f.str||0):(f.aj[k]||0);
    box.innerHTML=`<div class="cfp-tools" role="tablist" aria-label="Ajustes">${CFP_TOOLS.map(([k,n,ic])=>`<button type="button" role="tab" class="cfp-tl${k===P.tool?" on":""}${(k==="aj"?(f.str||f.rot):val(k))?" mud":""}" data-cfptool="${k}" aria-selected="${k===P.tool}"><i class="cfp-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg></i><span>${n}</span></button>`).join("")}</div>
      <div class="cfp-ajs"><div class="cfp-aj" data-cfpaj="aj" ${P.tool==="aj"?"":"hidden"}><div class="cfp-ajr"><button type="button" class="ce-chip" data-edgira>↻ Girar</button><button type="button" class="ce-chip cfp-zero" data-edajzero>Desfazer ajustes</button></div><label><span>Endireitar<i id="ce-aj2-str">${f.str||0}°</i></span><input type="range" min="-45" max="45" value="${f.str||0}" data-edaj2="str"></label></div>
      ${ED_AJS.map(([k,n,a,b])=>`<div class="cfp-aj" data-cfpaj="${k}" ${P.tool===k?"":"hidden"}><label><span>${n}<i id="ce-aj2-${k}">${f.aj[k]||0}</i></span><input type="range" min="${a}" max="${b}" value="${f.aj[k]||0}" data-edaj2="${k}"></label></div>`).join("")}</div>`;
    const on=box.querySelector(".cfp-tl.on");if(on)on.scrollIntoView({block:"nearest",inline:"center"})}}
function cfpEdit(el){const P=ED.po,n=P.fotos.length;
  el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="fotos" aria-label="Voltar">${EDI.vol}</button><b>Editar</b><button type="button" class="ce-av" data-edav>Avançar</button></div>
    <div class="cfp-pw"><div class="cfp-trk" id="cfp-trk" aria-label="Fotos do post">${P.fotos.map((x,i)=>`<div class="cfp-sl" data-cfpsl="${i}" role="group" aria-roledescription="foto" aria-label="Foto ${i+1} de ${n}"><div class="cfp-fr"><div class="cfp-in"><img alt="" draggable="false"></div><div class="cfp-vg"></div></div></div>`).join("")}</div>
      ${n>1?`<button type="button" class="ce-nav l cfp-sr" data-edfn="-1" aria-label="Foto anterior">‹</button><button type="button" class="ce-nav r cfp-sr" data-edfn="1" aria-label="Próxima foto">›</button>`:""}</div>
    ${n>1?`<div class="cfp-dots" aria-hidden="true">${P.fotos.map((x,i)=>`<i class="${i===P.cur?"on":""}"></i>`).join("")}</div>`:""}
    <div class="ce-abas2" role="tablist"><button type="button" role="tab" data-edaba="filtros" aria-selected="${P.aba!=="editar"}">Filtros</button><button type="button" role="tab" data-edaba="editar" aria-selected="${P.aba==="editar"}">Editar</button></div>
    <div class="cfp-pn" id="cfp-pn"></div>`;
  cfpTam();P.fotos.forEach((x,i)=>cfpAtualiza(i));const trk=$("#cfp-trk");trk.scrollLeft=P.cur*trk.clientWidth;cfpPainel();
  trk.addEventListener("scroll",()=>{const i=Math.round(trk.scrollLeft/Math.max(1,trk.clientWidth));if(!ED||ED.po!==P||i<0||i>=P.fotos.length)return;if(i!==P.cur){P.cur=i;P.fiOn=false;cfpDots();clearTimeout(CFP_SC);CFP_SC=setTimeout(()=>{if(ED&&ED.po===P&&P.cur===i)cfpPainel()},80)}},{passive:true})}
{const _pf95=edPrevFiltro;edPrevFiltro=function(){if(!document.getElementById("cfp-trk"))return _pf95.apply(this,arguments);cancelAnimationFrame(CFP_RAF);CFP_RAF=requestAnimationFrame(()=>{const P=ED&&ED.po;if(P)cfpAtualiza(P.cur)})}}

/* final: fotos, legenda, Marcar pessoas, Texto alternativo, Público… e Compartilhar grande */
function cfpDet(el){const P=ED.po,tem=P.fotos.length,nt=P.pid&&pautaById(P.pid),nm=[...new Set(P.tags.map(t=>t.u).concat(P.marcados))],alts=P.fotos.filter(x=>String(x.alt||"").trim()).length;
  el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="${tem?"filtros":"fotos"}" aria-label="Voltar">${EDI.vol}</button><b>Novo post</b><span class="ce-b" aria-hidden="true"></span></div>
    <div class="ce-det cfp-det">${tem?`<div class="cfp-car${tem===1?" um":""}">${P.fotos.map((x,i)=>`<canvas data-cfpc="${i}" width="240" aria-label="Foto ${i+1}"></canvas>`).join("")}</div>`:nt?`<div class="cfp-nt"><small>Notícia anexada</small><b>${esc(versao(nt,lente()).titulo)}</b></div>`:""}
      <textarea id="ce-leg" class="cfp-leg" maxlength="2200" rows="3" placeholder="${tem||P.pid?"Escreva uma legenda…":"Escreva o seu post…"}" aria-label="Legenda">${esc(P.texto)}</textarea>
      <div class="cfp-rows">
      <button type="button" class="ce-row" ${tem?"data-edtags":"data-edmarcar"}><span>Marcar pessoas</span><em>${nm.length?esc(nm.map(u=>String(nomeDe(u)).split(" ")[0]).join(", ")):""}</em><i>›</i></button>
      <label class="ce-row"><span>Adicionar local</span><input id="ce-local" maxlength="60" placeholder="Ex.: Rio de Janeiro" value="${esc(P.local)}"></label>
      ${tem?`<button type="button" class="ce-row" data-cfpalt><span>Texto alternativo</span><em>${alts?`${alts} de ${tem}`:""}</em><i>›</i></button>`:""}
      ${MA.on?`<button type="button" class="ce-row" data-cfppub><span>Público</span><em>${P.pub==="proximos"?"★ Melhores amigos":"Todos os amigos"}</em><i>›</i></button>`:""}
      <button type="button" class="ce-row" data-edsont><span>${nt?"Notícia anexada":"Anexar notícia"}</span><em>${nt?esc(versao(nt,lente()).titulo):""}</em><i>›</i></button>
      ${nt?`<button type="button" class="ce-row ce-semnt" data-edsemnt><span>Tirar a notícia</span></button>`:""}
      <button type="button" class="ce-row" data-edavanc aria-expanded="${!!P.avOn}"><span>Configurações avançadas</span><em></em><i>${P.avOn?"⌃":"›"}</i></button>
      ${P.avOn?`<div class="ce-avc"><label class="ce-sw"><span>Ocultar o número de curtidas<small>Só você vê quem curtiu.</small></span><input type="checkbox" data-edsw="semCurt" ${P.semCurt?"checked":""}></label>
        <label class="ce-sw"><span>Desativar comentários<small>Ninguém poderá comentar neste post.</small></span><input type="checkbox" data-edsw="semCom" ${P.semCom?"checked":""}></label>
        ${tem?`<b class="ce-avt" id="cfp-altt">Texto alternativo</b><p class="ce-selh">Descreva cada foto para quem usa leitor de tela.</p>${P.fotos.map((x,i)=>`<div class="ce-altr"><img alt="" data-ai="${i}"><input class="field" maxlength="200" placeholder="Descreva a foto ${i+1}" data-edalt="${i}" value="${esc(x.alt||"")}"></div>`).join("")}`:""}</div>`:""}</div>
      <p class="cr-quem">${P.pub==="proximos"?"Só os seus Melhores amigos vão ver.":"Seus amigos no Prumo vão ver."} Use @ para marcar alguém na legenda.</p></div>
    <div class="cfp-share"><button type="button" class="cfp-shb" data-edpubpo ${ED.env?"disabled":""}>${ED.env?"Publicando…":"Compartilhar"}</button></div>`;
  const ta=$("#ce-leg");ta.addEventListener("input",()=>{P.texto=ta.value;if(typeof menSugere==="function")menSugere(ta)});$("#ce-local").addEventListener("input",e=>{P.local=e.target.value});
  el.querySelectorAll("img[data-ai]").forEach(im=>{im.src=edUrlF(P.fotos[+im.dataset.ai])});
  el.querySelectorAll("canvas[data-cfpc]").forEach(c=>{try{edRenderFoto(P.fotos[+c.dataset.cfpc],c,P.ar)}catch(e){}})}

{const _ep95=edPost;edPost=function(el){const P=ED.po;P.rolo=P.rolo||P.fotos.slice();P.tags=P.tags||[];try{P.tags.forEach(t=>{const i=P.fotos.indexOf(edTagF(t));if(i>=0)t.i=i})}catch(e){}
  if(P.cur>=P.fotos.length)P.cur=Math.max(0,P.fotos.length-1);
  try{if(P.passo==="fotos")cfpFotos(el);else if(P.passo==="filtros"&&P.fotos.length)cfpEdit(el);else cfpDet(el)}catch(e){return _ep95.apply(this,arguments)}}}
addEventListener("resize",()=>{if(ED&&ED.modo==="post"&&$("#cfp-trk")){cfpTam();ED.po.fotos.forEach((x,i)=>cfpAtualiza(i));const t=$("#cfp-trk");t.scrollLeft=ED.po.cur*t.clientWidth}});

/* público do post (quando a lista de Melhores amigos existe) */
function cfpPublico(){const P=ED.po;const ov=document.createElement("div");ov.className="ce-sel";
  ov.innerHTML=`<div class="ce-selp"><b>Quem pode ver</b><div class="cfp-pubs"><button type="button" data-cfppubv="amigos" aria-pressed="${P.pub!=="proximos"}"><span>Todos os amigos</span><small>Seus amigos no Prumo</small></button><button type="button" data-cfppubv="proximos" aria-pressed="${P.pub==="proximos"}"><span>★ Melhores amigos</span><small>${MA.set.size?`${MA.set.size} ${MA.set.size===1?"pessoa":"pessoas"}`:"Lista vazia"}</small></button></div><div class="ce-selb"><button type="button" class="btn ghost" data-cfpmaed>Editar a lista</button><button type="button" class="btn" data-edselx>Concluir</button></div></div>`;$("#layer .ce").appendChild(ov)}
{const _pp95=edPublicaPost;edPublicaPost=async function(){const pub=ED&&ED.po&&MA.on&&ED.po.pub==="proximos"?"proximos":null;if(!pub||!SB)return _pp95.apply(this,arguments);if(!ED.env&&!MA.set.size){edMaLista(true);return}const _from=SB.from;
  SB.from=function(t){const q=_from.apply(this,arguments);if(t==="publicacoes"&&q&&typeof q.insert==="function"){const ins=q.insert;q.insert=function(row){if(row&&row.tipo==="post")row.publico=pub;return ins.apply(this,arguments)}}return q};
  try{return await _pp95.apply(this,arguments)}finally{SB.from=_from}}}

/* cliques novos */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest||!ED||!$("#layer .ce")||t.closest("#layer2"))return;let b;const P=ED.po;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(b=t.closest("[data-edmodo]")){if(b.dataset.edmodo==="post")cfpAbreGaleria();return}
  if(ED.env&&t.closest("[data-cfptool],[data-cfpalt],[data-cfppub],[data-cfppubv],[data-cfpmaed]")){pare();return}
  if(b=t.closest("[data-cfptool]")){pare();P.tool=b.dataset.cfptool;document.querySelectorAll("#layer [data-cfptool]").forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-selected",String(on))});document.querySelectorAll("#layer [data-cfpaj]").forEach(x=>{x.hidden=x.dataset.cfpaj!==P.tool});return}
  if(t.closest("[data-cfpalt]")){pare();P.avOn=true;edDesenha();setTimeout(()=>{const i=$("#layer [data-edalt]");if(i){$("#cfp-altt")?.scrollIntoView({block:"start",behavior:"smooth"});i.focus({preventScroll:true})}},60);return}
  if(t.closest("[data-cfppub]")){pare();cfpPublico();return}
  if(b=t.closest("[data-cfppubv]")){pare();const v=b.dataset.cfppubv;if(v==="proximos"&&!MA.set.size){$("#layer .ce-sel")?.remove();P.pub="proximos";edMaLista(true);return}P.pub=v;$("#layer .ce-sel")?.remove();edDesenha();return}
  if(t.closest("[data-cfpmaed]")){pare();$("#layer .ce-sel")?.remove();edMaLista(false);return}},true);
/* o pontinho do ajuste mexido acompanha o slider */
document.addEventListener("input",e=>{const r=e.target.closest&&e.target.closest("#layer .cfp-ajs [data-edaj2]");if(!r||!ED)return;const k=r.dataset.edaj2,tl=$(`#layer [data-cfptool="${k==="str"?"aj":k}"]`),f=ED.po.fotos[ED.po.cur];if(tl&&f)tl.classList.toggle("mud",k==="str"?!!(f.str||f.rot):+r.value!==0)});
