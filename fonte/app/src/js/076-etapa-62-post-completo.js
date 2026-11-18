/* ---------- Etapa 62: post completo ---------- */
const edBase=f=>f.rimg||f.img;
const edWH=i=>[i.naturalWidth||i.videoWidth||i.width||1,i.naturalHeight||i.videoHeight||i.height||1];
edCover=function(g,img,W,H,z,ox,oy,dx,dy){const [iw,ih]=edWH(img),k=Math.max(W/iw,H/ih)*(z||1),w=iw*k,h=ih*k;g.drawImage(img,(dx||0)+(W-w)/2+(ox||0)*W,(dy||0)+(H-h)/2+(oy||0)*H,w,h)};
const edUrlF=f=>f.rurl||f.url;
function edGira(f){f.rot=((f.rot||0)+1)%4;edGiraAplica(f);f.z=1;f.ox=0;f.oy=0}
function edGiraAplica(f){const r=f.rot||0;if(!r){f.rimg=null;f.rurl=null;return}const im=f.img,[w,h]=edWH(im),c=document.createElement("canvas");c.width=r%2?h:w;c.height=r%2?w:h;const g=c.getContext("2d");g.translate(c.width/2,c.height/2);g.rotate(r*Math.PI/2);g.drawImage(im,-w/2,-h/2);f.rimg=c;f.rurl=c.toDataURL("image/jpeg",.92)}
function edAjExtra(c,a){a=a||{};const h=(a.h||0)/100,sh=(a.sh||0)/100,fd=(a.fd||0)/100,v=(a.v||0)/100,n=(a.n||0)/100;if(!h&&!sh&&!fd&&!v&&!n)return;const g=c.getContext("2d"),W=c.width,H=c.height,d=g.getImageData(0,0,W,H),p=d.data;
  if(n>0){const src=new Uint8ClampedArray(p),k=n*1.1,L=W*4;for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=(y*W+x)*4;for(let ch=0;ch<3;ch++){const j=i+ch;p[j]=src[j]*(1+4*k)-k*(src[j-4]+src[j+4]+src[j-L]+src[j+L])}}}
  const cx=W/2,cy=H/2,md=Math.hypot(cx,cy);
  for(let i=0,px=0;i<p.length;i+=4,px++){let r=p[i]/255,gg=p[i+1]/255,b=p[i+2]/255;const l=.2126*r+.7152*gg+.0722*b;
    if(h){const m=Math.max(0,l-.45)/.55,ad=h*m*.3;r+=ad;gg+=ad;b+=ad}
    if(sh){const m=Math.max(0,.55-l)/.55,ad=sh*m*.3;r+=ad;gg+=ad;b+=ad}
    if(fd){const f=fd*.18;r=f+r*(1-f);gg=f+gg*(1-f);b=f+b*(1-f)}
    if(v){const x=px%W,y=(px/W)|0,dd=Math.hypot(x-cx,y-cy)/md,k=1-v*Math.pow(dd,2.2)*.85;r*=k;gg*=k;b*=k}
    p[i]=Math.max(0,Math.min(255,r*255));p[i+1]=Math.max(0,Math.min(255,gg*255));p[i+2]=Math.max(0,Math.min(255,b*255))}
  g.putImageData(d,0,0)}
function edAplica(c,f){const fi=(f.fi==null?100:f.fi)/100;if(f.f&&f.f!=="normal"&&fi>0){if(fi>=1)edFiltra(c,f.f,{});else{const g=c.getContext("2d"),o=g.getImageData(0,0,c.width,c.height);edFiltra(c,f.f,{});const d=g.getImageData(0,0,c.width,c.height),p=d.data,q=o.data;for(let i=0;i<p.length;i+=4){p[i]=q[i]+(p[i]-q[i])*fi;p[i+1]=q[i+1]+(p[i+1]-q[i+1])*fi;p[i+2]=q[i+2]+(p[i+2]-q[i+2])*fi}g.putImageData(d,0,0)}}
  const a=f.aj||{};if(a.b||a.c||a.s||a.w)edFiltra(c,"normal",{b:a.b,c:a.c,s:a.s,w:a.w});edAjExtra(c,a)}
const ED_AJS=[["b","Brilho",-50,50],["c","Contraste",-50,50],["s","Saturação",-50,50],["w","Calor",-50,50],["h","Realce",-50,50],["sh","Sombras",-50,50],["fd","Esmaecer",0,100],["v","Vinheta",0,100],["n","Nitidez",0,100]];
function edNovaFoto(r){return {...r,z:1,ox:0,oy:0,f:"normal",fi:100,aj:{},rot:0,str:0,alt:""}}
/* marcar pessoas na foto */
function edTags(){const P=ED.po;P.ti=Math.min(P.ti||0,P.fotos.length-1);$("#layer .ce-tagov")?.remove();const ov=document.createElement("div");ov.className="ce-tagov";
  ov.innerHTML=`<div class="ce-ph"><span class="ce-b"></span><b>Marcar pessoas</b><button type="button" class="ce-av" data-edtagok>Concluir</button></div><div class="ce-tgw"><div class="ce-tgb" id="ce-tgb"><canvas id="ce-tgc"></canvas>${P.tags.map((t,k)=>edTagF(t)===P.fotos[P.ti]?`<button type="button" class="ce-tg" data-edtagx="${k}" style="left:${t.x*100}%;top:${t.y*100}%;--tx:${t.x<.22?"-12%":t.x>.78?"-88%":"-50%"};--ty:${t.y>.82?"calc(-100% - 8px)":"8px"}">${esc(nomeDe(t.u))} <i>✕</i></button>`:"").join("")}</div>
    ${P.fotos.length>1?`<button type="button" class="ce-nav l" data-edtgn="-1" aria-label="Foto anterior">‹</button><button type="button" class="ce-nav r" data-edtgn="1" aria-label="Próxima foto">›</button><span class="ce-npg">${P.ti+1}/${P.fotos.length}</span>`:""}</div><p class="ce-dica2 ce-dc">Toque na foto para marcar alguém. Toque numa marca para tirar.</p>`;
  $("#layer .ce").appendChild(ov);const c=$("#ce-tgc");c.width=Math.min(720,Math.round(innerWidth*Math.min(2,devicePixelRatio||1)));edRenderFoto(P.fotos[P.ti],c,P.ar);
  $("#ce-tgb").addEventListener("click",e=>{if(e.target.closest(".ce-tg"))return;const r=$("#ce-tgb").getBoundingClientRect();P._tp={x:+((e.clientX-r.left)/r.width).toFixed(3),y:+((e.clientY-r.top)/r.height).toFixed(3)};const am=amigosL();if(!am.length){toast("Você ainda não tem amigos no Prumo.");return}edListaAmigos("data-edtagu","Marcar quem?")})}
/* rascunhos guardados no aparelho */
const RASC={db:null};
function rascDb(){return new Promise((ok,no)=>{if(RASC.db)return ok(RASC.db);if(!window.indexedDB)return no(new Error("sem idb"));const r=indexedDB.open("prumo-rascunhos",1);r.onupgradeneeded=()=>r.result.createObjectStore("r",{keyPath:"id"});r.onsuccess=()=>{RASC.db=r.result;ok(r.result)};r.onerror=()=>no(r.error)})}
const rascTx=(m,fn)=>rascDb().then(db=>new Promise((ok,no)=>{const t=db.transaction("r",m),q=fn(t.objectStore("r"));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)}));
async function rascApaga(id){try{await rascTx("readwrite",s=>s.delete(id))}catch(e){}}
async function rascChip(){const l=await rascLista();const box=$("#ce-rascs");if(!box||!l.length)return;box.innerHTML=`<button type="button" class="ce-rch" data-edrascs>Rascunhos (${l.length})</button>`}
async function rascPainel(){const l=await rascLista();l.forEach(x=>{x._u=x.fotos[0]?URL.createObjectURL(x.fotos[0].blob):""});const ov=document.createElement("div");ov.className="ce-sel";
  ov.innerHTML=`<div class="ce-selp"><b>Rascunhos</b><ul class="ce-lis ce-rl">${l.map(x=>`<li><button type="button" data-edrasc="${esc(x.id)}">${x._u?`<img alt="" src="${x._u}">`:`<span class="ce-dsem" style="background:${pubFundo(1)}">Aa</span>`}<span><b>${esc(String(x.texto||"Sem legenda").slice(0,60))}</b><small>${x.fotos.length} ${x.fotos.length===1?"foto":"fotos"} · ${esc(quando(x.at))}</small></span></button><button type="button" class="ce-rx" data-edrascx="${esc(x.id)}" aria-label="Apagar rascunho">✕</button></li>`).join("")||`<li class="hint">Nenhum rascunho</li>`}</ul><div class="ce-selb"><button type="button" class="btn ghost" data-edselx>Fechar</button></div></div>`;$("#layer .ce").appendChild(ov)}
{const _ef62=edFechar;edFechar=function(){if(ED&&!ED.env&&ED.po&&(ED.modo==="post"||ED.po.fotos.length)&&(ED.modo!=="post"||edTemAlgo())&&ED.po.fotos.length+ED.po.texto.trim().length>0){if($("#layer .ce-sel.ce-sair"))return;const ov=document.createElement("div");ov.className="ce-sel ce-sair";
    ov.innerHTML=`<div class="ce-selp"><b>Salvar como rascunho?</b><p class="ce-selh">O rascunho fica guardado neste aparelho para você continuar depois.</p><button type="button" class="btn" data-edrsalva>Salvar rascunho</button><button type="button" class="btn ghost ce-desc" data-edrdesc>Descartar</button><button type="button" class="btn ghost" data-edselx>Continuar editando</button></div>`;$("#layer .ce").appendChild(ov);return}
  return _ef62.apply(this,arguments)}}
/* publicar o post */
/* cliques do post */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest||!$("#layer .ce")||!ED)return;if(t.closest("#layer2"))return;let b;const P=ED.po;const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  if(ED.env&&t.closest("[data-edrolo],[data-edmulti],[data-edgira],[data-edfiok],[data-edtags],[data-edtagx],[data-edtagu],[data-edtagok],[data-edtgn],[data-edavanc],[data-edrasc],[data-edrascx],[data-edrascs],[data-edrsalva],[data-edrdesc],[data-edajzero]")){pare();return}
  if(b=t.closest("[data-edrolo]")){pare();const x=P.rolo[+b.dataset.edrolo];if(!x)return;const n=P.fotos.indexOf(x);
    if(P.multi){if(n>=0){if(P.fotos[P.cur]===x&&P.fotos.length>1){P.fotos.splice(n,1);P.cur=Math.min(P.cur,P.fotos.length-1)}else P.cur=n}else{if(P.fotos.length>=10){toast("Um post tem no máximo 10 fotos.");return}P.fotos.push(x);P.cur=P.fotos.length-1}}
    else{P.fotos=[x];P.cur=0}edDesenha();return}
  if(t.closest("[data-edmulti]")){pare();P.multi=!P.multi;if(!P.multi){P.fotos=[P.fotos[P.cur]||P.fotos[0]].filter(Boolean);P.cur=0}edDesenha();return}
  if(b=t.closest("[data-edflt]")){const k=b.dataset.edflt,f=P.fotos[P.cur];if(!f)return;const ult=f._fu==null?"normal":f._fu;f._fu=k;if(ult===k&&k!=="normal"){pare();f.f=k;P.fiOn=true;edDesenha();return}f.fi=100}
  if(t.closest("[data-edfiok]")){pare();P.fiOn=false;edDesenha();return}
  if(t.closest("[data-edgira]")){pare();edGira(P.fotos[P.cur]);edPrevFiltro();return}
  if(t.closest("[data-edajzero]")){pare();const f=P.fotos[P.cur];f.aj={};f.str=0;edDesenha();return}
  if(b=t.closest("[data-edaba]")){P.fiOn=false}
  if(t.closest("[data-edtags]")){pare();edTags();return}
  if(t.closest("[data-edtagok]")){pare();$("#layer .ce-tagov")?.remove();edDesenha();return}
  if(b=t.closest("[data-edtagx]")){pare();P.tags.splice(+b.dataset.edtagx,1);edTags();return}
  if(b=t.closest("[data-edtgn]")){pare();P.ti=(P.ti+(+b.dataset.edtgn)+P.fotos.length)%P.fotos.length;edTags();return}
  if(b=t.closest("[data-edtagu]")){pare();const u=b.dataset.edtagu;$("#layer .ce-sel")?.remove();if(P._tp){const fo=P.fotos[P.ti];P.tags=P.tags.filter(x=>!(x.u===u&&edTagF(x)===fo));P.tags.push({u,i:P.ti,f:fo,...P._tp})}edTags();return}
  if(t.closest("[data-edavanc]")){pare();P.avOn=!P.avOn;edDesenha();return}
  if(t.closest("[data-edrascs]")){pare();rascPainel();return}
  if(b=t.closest("[data-edrascx]")){pare();rascApaga(b.dataset.edrascx).then(()=>{$("#layer .ce-sel")?.remove();rascPainel();rascChip()});return}
  if(b=t.closest("[data-edrasc]")){pare();rascAbre(b.dataset.edrasc);return}
  if(t.closest("[data-edrsalva]")){pare();rascSalva().then(()=>{toast("Rascunho salvo");ED=null;closeLayer._ok=true;closeLayer()}).catch(()=>toast("Não deu para salvar o rascunho neste aparelho."));return}
  if(t.closest("[data-edrdesc]")){pare();ED=null;closeLayer._ok=true;closeLayer();return}},true);
document.addEventListener("input",e=>{const t=e.target;if(!ED||!t.closest)return;const P=ED.po,f=P.fotos[P.cur];let r;
  if(r=t.closest("#layer [data-edaj2]")){const k=r.dataset.edaj2,v=+r.value;if(k==="fi")f.fi=v;else if(k==="str")f.str=v;else f.aj[k]=v;const i=$("#ce-aj2-"+k);if(i)i.textContent=v+(k==="str"?"°":"");edPrevFiltro();return}
  if(r=t.closest("#layer [data-edalt]")){const x=P.fotos[+r.dataset.edalt];if(x)x.alt=r.value;return}},true);
document.addEventListener("change",e=>{const r=e.target.closest&&e.target.closest("#layer [data-edsw]");if(!r||!ED)return;ED.po[r.dataset.edsw]=r.checked},true);
/* no Feed: marcas na foto, texto alternativo, sem comentários, curtidas ocultas */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;const b=t.closest(".upost [data-uptags]");if(b){e.stopPropagation();e.preventDefault();b.closest(".upost").classList.toggle("tags-on");return}
  if(t.closest(".upost.sem-com [data-a='cmt']")){e.stopPropagation();e.preventDefault();toast("Os comentários deste post estão desativados.")}},true);

