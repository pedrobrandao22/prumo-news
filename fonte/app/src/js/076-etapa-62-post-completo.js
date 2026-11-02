/* ---------- Etapa 62: post completo ---------- */
const edBase=f=>f.rimg||f.img;
const edWH=i=>[i.naturalWidth||i.videoWidth||i.width||1,i.naturalHeight||i.videoHeight||i.height||1];
edCover=function(g,img,W,H,z,ox,oy,dx,dy){const [iw,ih]=edWH(img),k=Math.max(W/iw,H/ih)*(z||1),w=iw*k,h=ih*k;g.drawImage(img,(dx||0)+(W-w)/2+(ox||0)*W,(dy||0)+(H-h)/2+(oy||0)*H,w,h)};
edLimita=function(f,box){const r=box.getBoundingClientRect(),W=r.width||1,H=r.height||1,[iw,ih]=edWH(edBase(f)),k=Math.max(W/iw,H/ih)*(f.z||1);const lx=Math.max(0,(iw*k-W)/2/W),ly=Math.max(0,(ih*k-H)/2/H);f.ox=Math.max(-lx,Math.min(lx,f.ox||0));f.oy=Math.max(-ly,Math.min(ly,f.oy||0))};
edPosImg=function(i,f,box){const im=edBase(f);if(!box||!im)return;const W=box.clientWidth,H=box.clientHeight,[iw,ih]=edWH(im),k=Math.max(W/iw,H/ih)*(f.z||1),w=iw*k,h=ih*k;
  i.style.cssText=`position:absolute;inset:auto;max-width:none;object-fit:fill;transform:none;width:${w}px;height:${h}px;left:${(W-w)/2+(f.ox||0)*W}px;top:${(H-h)/2+(f.oy||0)*H}px`};
edAR=function(ar,img){if(ar==="1:1")return 1;if(ar==="orig"&&img){const [w,h]=edWH(img);return Math.max(.8,Math.min(1.91,w/h))}return .8};
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
edRenderFoto=function(f,c,ar,filtro){const first=(ED&&ED.po.fotos[0])||f,k=edAR(ar,edBase(first)),W=c.width,H=Math.round(W/k);c.height=H;const g=c.getContext("2d");g.fillStyle="#000";g.fillRect(0,0,W,H);
  const rad=(f.str||0)*Math.PI/180;g.save();if(rad){g.translate(W/2,H/2);g.rotate(rad);const sc=Math.abs(Math.cos(rad))+Math.abs(Math.sin(rad))*Math.max(W/H,H/W);g.scale(sc,sc);g.translate(-W/2,-H/2)}
  edCover(g,edBase(f),W,H,f.z,f.ox,f.oy);g.restore();if(filtro!==false)edAplica(c,f);return c};
edMiniFiltros=function(){const P=ED.po,f=P.fotos[P.cur];const b=document.createElement("canvas");b.width=72;b.height=72;edCover(b.getContext("2d"),edBase(f),72,72,f.z,f.ox,f.oy);
  document.querySelectorAll("#layer [data-fk]").forEach(c=>{c.getContext("2d").drawImage(b,0,0);edFiltra(c,c.dataset.fk,{})})};
edPvTam=function(){const pv=$("#ce-pv"),P=ED&&ED.po;if(!pv||!P||!P.fotos.length)return;const k=edAR(P.ar,edBase(P.fotos[0])),W=pv.parentElement.clientWidth||innerWidth,maxH=Math.round(innerHeight*.5);let w=W,h=w/k;if(h>maxH){h=maxH;w=h*k}pv.style.cssText=`width:${Math.round(w)}px;height:${Math.round(h)}px;max-height:none`;P.fotos.forEach(f=>edLimita(f,pv))};
const ED_AJS=[["b","Brilho",-50,50],["c","Contraste",-50,50],["s","Saturação",-50,50],["w","Calor",-50,50],["h","Realce",-50,50],["sh","Sombras",-50,50],["fd","Esmaecer",0,100],["v","Vinheta",0,100],["n","Nitidez",0,100]];
function edNovaFoto(r){return {...r,z:1,ox:0,oy:0,f:"normal",fi:100,aj:{},rot:0,str:0,alt:""}}
edPost=function(el){const P=ED.po;P.rolo=P.rolo||P.fotos.slice();P.tags=P.tags||[];const f=P.fotos[P.cur];
  if(P.passo==="fotos"){
    el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edfechar aria-label="Fechar">${EDI.x}</button><b>Novo post</b><button type="button" class="ce-av" data-edav ${P.fotos.length?"":"disabled"}>Avançar</button></div>
      ${P.rolo.length&&f?`<div class="ce-pvw"><div class="ce-pv" id="ce-pv"><img id="ce-pvi" alt="" draggable="false"></div><button type="button" class="ce-arb" data-edar aria-label="Formato">${P.ar==="orig"?"Original":P.ar}</button><button type="button" class="ce-mlt${P.multi?" on":""}" data-edmulti aria-pressed="${!!P.multi}" aria-label="Selecionar vários">⧉ ${P.multi?"Vários":"Um"}</button>${P.fotos.length>1?`<span class="ce-npg">${P.cur+1}/${P.fotos.length}</span>`:""}</div>
        <div class="ce-gfh"><b>Escolhidas</b><span>${P.multi?"Toque para escolher a ordem":"Arraste e pince a foto para enquadrar"}</span></div>
        <div class="ce-grade">${P.rolo.map((x,i)=>{const n=P.fotos.indexOf(x);return `<button type="button" class="ce-gi${x===f?" on":""}${n>=0?" sel":""}" data-edrolo="${i}"><img alt="" data-ri="${i}">${P.multi?`<i class="ce-num${n>=0?" on":""}">${n>=0?n+1:""}</i>`:""}</button>`}).join("")}<button type="button" class="ce-gi ce-gim" data-edpgal aria-label="Mais fotos">+</button></div>`
      :`<div class="ce-vz"><button type="button" class="ce-big" data-edpgal>${EDI.gal}<b>Escolher fotos</b><span>até 10, da galeria</span></button><div class="ce-vz2"><button type="button" data-edsotexto>Só texto</button><button type="button" data-edsont>Notícia do Prumo</button></div><div id="ce-rascs"></div></div>`}
      ${edModos()}<input type="file" id="ce-pfile" accept="image/*" multiple hidden>`;
    if(f){$("#ce-pvi").src=edUrlF(f);edPvTam();edPvPos();edGestosPv()}el.querySelectorAll(".ce-grade img[data-ri]").forEach(im=>{im.src=edUrlF(P.rolo[+im.dataset.ri])});
    if(!P.rolo.length)rascChip();
    $("#ce-pfile").addEventListener("change",async e=>{const fs=[...e.target.files];e.target.value="";if(!fs.length)return;const novos=[];for(const x of fs.slice(0,30)){try{novos.push(edNovaFoto(await edCarrega(x,2048)))}catch(err){toast("Não deu para abrir uma das fotos.")}}if(!novos.length||!ED)return;
      P.rolo.push(...novos);if(novos.length>1)P.multi=true;if(P.multi){const cabe=novos.slice(0,10-P.fotos.length);if(cabe.length<novos.length)toast("Um post tem no máximo 10 fotos.");P.fotos.push(...cabe);P.cur=Math.max(0,P.fotos.length-cabe.length)}else{P.fotos=[novos[0]];P.cur=0}edDesenha()})}
  else if(P.passo==="filtros"){const fi=f.fi==null?100:f.fi;
    el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="fotos" aria-label="Voltar">${EDI.vol}</button><b>Editar</b><button type="button" class="ce-av" data-edav>Avançar</button></div>
      <div class="ce-pvw"><canvas id="ce-fc" class="ce-fc"></canvas>${P.fotos.length>1?`<button type="button" class="ce-nav l" data-edfn="-1" aria-label="Foto anterior">‹</button><button type="button" class="ce-nav r" data-edfn="1" aria-label="Próxima foto">›</button><span class="ce-npg">${P.cur+1}/${P.fotos.length}</span>`:""}</div>
      <div class="ce-abas2"><button type="button" data-edaba="filtros" aria-selected="${P.aba==="filtros"}">Filtros</button><button type="button" data-edaba="editar" aria-selected="${P.aba==="editar"}">Editar</button></div>
      ${P.aba==="filtros"?(P.fiOn&&f.f!=="normal"?`<div class="ce-fi"><span>${esc((ED_FILTROS.find(x=>x[0]===f.f)||[])[1]||"")}</span><input type="range" min="0" max="100" value="${fi}" data-edaj2="fi" aria-label="Intensidade do filtro"><i id="ce-aj2-fi">${fi}</i><button type="button" class="ce-ok" data-edfiok>Concluir</button></div>`
          :`<div class="ce-flts">${ED_FILTROS.map(([k,n])=>`<button type="button" data-edflt="${k}" class="${k===f.f?"on":""}"><canvas data-fk="${k}" width="72" height="72"></canvas><span>${n}</span></button>`).join("")}</div><p class="ce-dica2 ce-dc">Toque de novo no filtro escolhido para mudar a intensidade.</p>`)
        :`<div class="ce-ajs"><div class="ce-ajt"><button type="button" class="ce-chip" data-edgira>↻ Girar</button><label><span>Endireitar<i id="ce-aj2-str">${f.str||0}°</i></span><input type="range" min="-45" max="45" value="${f.str||0}" data-edaj2="str"></label></div>
          ${ED_AJS.map(([k,n,a,b])=>`<label><span>${n}<i id="ce-aj2-${k}">${f.aj[k]||0}</i></span><input type="range" min="${a}" max="${b}" value="${f.aj[k]||0}" data-edaj2="${k}"></label>`).join("")}<button type="button" class="ce-chip" data-edajzero>Desfazer ajustes desta foto</button></div>`}`;
    edPrevFiltro();if(P.aba==="filtros"&&!(P.fiOn&&f.f!=="normal"))edMiniFiltros()}
  else{const tem=P.fotos.length,nt=P.pid&&pautaById(P.pid),nm=[...new Set(P.tags.map(t=>t.u).concat(P.marcados))];
    el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="${tem?"filtros":"fotos"}" aria-label="Voltar">${EDI.vol}</button><b>Novo post</b><button type="button" class="ce-av" data-edpubpo ${ED.env?"disabled":""}>${ED.env?"Publicando…":"Compartilhar"}</button></div>
      <div class="ce-det"><div class="ce-legr">${tem?`<canvas id="ce-dthumb" width="128" height="160"></canvas>`:`<span class="ce-dsem" style="background:${pubFundo(1)}">Aa</span>`}<textarea id="ce-leg" maxlength="2200" rows="4" placeholder="${tem||P.pid?"Escreva uma legenda…":"Escreva o seu post…"}" aria-label="Legenda">${esc(P.texto)}</textarea></div>
        <button type="button" class="ce-row" ${tem?"data-edtags":"data-edmarcar"}><span>Marcar pessoas</span><em>${nm.length?esc(nm.map(u=>String(nomeDe(u)).split(" ")[0]).join(", ")):""}</em><i>›</i></button>
        <label class="ce-row"><span>Adicionar local</span><input id="ce-local" maxlength="60" placeholder="Ex.: Rio de Janeiro" value="${esc(P.local)}"></label>
        <button type="button" class="ce-row" data-edsont><span>${nt?"Notícia anexada":"Anexar notícia"}</span><em>${nt?esc(versao(nt,lente()).titulo):""}</em><i>›</i></button>
        ${nt?`<button type="button" class="ce-row ce-semnt" data-edsemnt><span>Tirar a notícia</span></button>`:""}
        <button type="button" class="ce-row" data-edavanc aria-expanded="${!!P.avOn}"><span>Configurações avançadas</span><em></em><i>${P.avOn?"⌃":"›"}</i></button>
        ${P.avOn?`<div class="ce-avc"><label class="ce-sw"><span>Ocultar o número de curtidas<small>Só você vê quem curtiu.</small></span><input type="checkbox" data-edsw="semCurt" ${P.semCurt?"checked":""}></label>
          <label class="ce-sw"><span>Desativar comentários<small>Ninguém poderá comentar neste post.</small></span><input type="checkbox" data-edsw="semCom" ${P.semCom?"checked":""}></label>
          ${tem?`<b class="ce-avt">Texto alternativo</b><p class="ce-selh">Descreva cada foto para quem usa leitor de tela.</p>${P.fotos.map((x,i)=>`<div class="ce-altr"><img alt="" data-ai="${i}"><input class="field" maxlength="200" placeholder="Descreva a foto ${i+1}" data-edalt="${i}" value="${esc(x.alt||"")}"></div>`).join("")}`:""}</div>`:""}
        <p class="cr-quem">Seus amigos no Prumo vão ver. Use @ para marcar alguém na legenda.</p></div>`;
    const ta=$("#ce-leg");ta.addEventListener("input",()=>{P.texto=ta.value;if(typeof menSugere==="function")menSugere(ta)});$("#ce-local").addEventListener("input",e=>{P.local=e.target.value});
    el.querySelectorAll("img[data-ai]").forEach(im=>{im.src=edUrlF(P.fotos[+im.dataset.ai])});
    if(tem){const c=$("#ce-dthumb");edRenderFoto(P.fotos[0],c,P.ar)}}};
edPrevFiltro=function(){clearTimeout(ED_FT);ED_FT=setTimeout(()=>{const c=$("#ce-fc"),P=ED&&ED.po;if(!c||!P||!P.fotos[P.cur])return;c.width=Math.min(720,Math.round((c.parentElement.clientWidth||360)*Math.min(2,devicePixelRatio||1)));edRenderFoto(P.fotos[P.cur],c,P.ar)},30)};
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
async function rascLista(){try{const l=await rascTx("readonly",s=>s.getAll());return (l||[]).filter(x=>x.uid===S.uid).sort((a,b)=>b.at-a.at)}catch(e){return []}}
async function rascSalva(){const P=ED.po;const r={id:P.rid||edNid(),uid:S.uid,at:Date.now(),ar:P.ar,texto:P.texto,local:P.local,pid:P.pid,marcados:P.marcados,tags:(P.tags||[]).map(t=>({u:t.u,i:P.fotos.indexOf(edTagF(t)),x:t.x,y:t.y})).filter(t=>t.i>=0),semCom:!!P.semCom,semCurt:!!P.semCurt,
  fotos:P.fotos.map(f=>({blob:f.blob,z:f.z,ox:f.ox,oy:f.oy,f:f.f,fi:f.fi,aj:f.aj,rot:f.rot||0,str:f.str||0,alt:f.alt||""}))};await rascTx("readwrite",s=>s.put(r));const l=await rascLista();for(const x of l.slice(20))await rascTx("readwrite",s=>s.delete(x.id))}
async function rascApaga(id){try{await rascTx("readwrite",s=>s.delete(id))}catch(e){}}
async function rascAbre(id){const r=(await rascLista()).find(x=>x.id===id);if(!r||!ED)return;const fotos=[];for(const x of r.fotos){const {img,url}=await edImg(x.blob);const f={...edNovaFoto({blob:x.blob,img,url}),...x,blob:x.blob,img,url};edGiraAplica(f);fotos.push(f)}
  Object.assign(ED.po,{rid:r.id,ar:r.ar,texto:r.texto||"",local:r.local||"",pid:r.pid||null,marcados:r.marcados||[],tags:(r.tags||[]).map(t=>({...t,f:fotos[t.i]})).filter(t=>t.f),semCom:r.semCom,semCurt:r.semCurt,fotos,rolo:fotos.slice(),cur:0,multi:fotos.length>1,passo:fotos.length?"fotos":"detalhes"});$("#layer .ce-sel")?.remove();edDesenha()}
async function rascChip(){const l=await rascLista();const box=$("#ce-rascs");if(!box||!l.length)return;box.innerHTML=`<button type="button" class="ce-rch" data-edrascs>Rascunhos (${l.length})</button>`}
async function rascPainel(){const l=await rascLista();l.forEach(x=>{x._u=x.fotos[0]?URL.createObjectURL(x.fotos[0].blob):""});const ov=document.createElement("div");ov.className="ce-sel";
  ov.innerHTML=`<div class="ce-selp"><b>Rascunhos</b><ul class="ce-lis ce-rl">${l.map(x=>`<li><button type="button" data-edrasc="${esc(x.id)}">${x._u?`<img alt="" src="${x._u}">`:`<span class="ce-dsem" style="background:${pubFundo(1)}">Aa</span>`}<span><b>${esc(String(x.texto||"Sem legenda").slice(0,60))}</b><small>${x.fotos.length} ${x.fotos.length===1?"foto":"fotos"} · ${esc(quando(x.at))}</small></span></button><button type="button" class="ce-rx" data-edrascx="${esc(x.id)}" aria-label="Apagar rascunho">✕</button></li>`).join("")||`<li class="hint">Nenhum rascunho</li>`}</ul><div class="ce-selb"><button type="button" class="btn ghost" data-edselx>Fechar</button></div></div>`;$("#layer .ce").appendChild(ov)}
{const _ef62=edFechar;edFechar=function(){if(ED&&!ED.env&&ED.po&&(ED.modo==="post"||ED.po.fotos.length)&&(ED.modo!=="post"||edTemAlgo())&&ED.po.fotos.length+ED.po.texto.trim().length>0){if($("#layer .ce-sel.ce-sair"))return;const ov=document.createElement("div");ov.className="ce-sel ce-sair";
    ov.innerHTML=`<div class="ce-selp"><b>Salvar como rascunho?</b><p class="ce-selh">O rascunho fica guardado neste aparelho para você continuar depois.</p><button type="button" class="btn" data-edrsalva>Salvar rascunho</button><button type="button" class="btn ghost ce-desc" data-edrdesc>Descartar</button><button type="button" class="btn ghost" data-edselx>Continuar editando</button></div>`;$("#layer .ce").appendChild(ov);return}
  return _ef62.apply(this,arguments)}}
/* publicar o post */
edPublicaPost=async function(){if(!ED||ED.env)return;const P=ED.po;if(!P.fotos.length&&!P.texto.trim()&&!P.pid){toast("Escreva algo, escolha fotos ou anexe uma notícia.");return}ED.env=true;const ed0=ED;edDesenha();const fotos=[];
  try{for(const f of P.fotos){const c=document.createElement("canvas");c.width=1080;edRenderFoto(f,c,P.ar);const b=await edJpeg(c);fotos.push(await pubSobe(b));PUB.urls[fotos[fotos.length-1]]={u:URL.createObjectURL(b),exp:Date.now()+3600e3}}
    const tags=(P.tags||[]).map(t=>{const i=P.fotos.indexOf(edTagF(t));return i>=0?{u:t.u,i,x:+(+t.x).toFixed(3),y:+(+t.y).toFixed(3)}:null}).filter(Boolean).slice(0,30),marc=[...new Set(tags.map(t=>t.u).concat(P.marcados))].slice(0,20);
    const at=Date.now(),row={autor:S.uid,tipo:"post",at,texto:P.texto.trim().slice(0,2200),fotos,pid:P.pid||null,snap:pubSnap(P.pid),estilo:{v:2,ar:P.ar,arv:P.fotos.length?+edAR(P.ar,edBase(P.fotos[0])).toFixed(3):null,marcados:marc,local:P.local.trim().slice(0,60),tags,alt:P.fotos.map(f=>String(f.alt||"").slice(0,200)),semCom:!!P.semCom,semCurt:!!P.semCurt}};
    let r=await SB.from("publicacoes").insert(row).select("id");if(r.error&&/estilo/i.test(JSON.stringify(r.error))){row.estilo.alt=row.estilo.alt.map(a=>a.slice(0,40));row.estilo.tags=tags.slice(0,10);row.estilo.marcados=row.estilo.marcados.slice(0,10);r=await SB.from("publicacoes").insert(row).select("id");if(r.error&&/estilo/i.test(JSON.stringify(r.error))){row.estilo.alt=[];row.estilo.tags=tags.slice(0,4);r=await SB.from("publicacoes").insert(row).select("id");if(!r.error)setTimeout(()=>toast("Publicado, mas algumas marcações e textos alternativos ficaram de fora (limite do servidor)."),1200)}}if(r.error)throw r.error;const id=r.data&&r.data[0]&&r.data[0].id;PUB.itens.unshift({...row,id});if(P.rid)rascApaga(P.rid);
    const txt=row.texto,aqui=ED===ed0&&$("#layer .ce");ED=null;if(aqui){closeLayer._ok=true;closeLayer()}toast("Post publicado");vibrar(10);
    if(id&&txt)pubAvisarMencoes(id,txt,"post");const mm=marc.filter(u=>S.amigos.has(u)&&!(typeof mencionados==="function"&&mencionados(txt).includes(u)));
    if(id&&mm.length)Promise.all(mm.map(u=>dmEnviar(u,{texto:"",pid:"u:"+id,snap:{titulo:"Post de "+nomeDe(S.uid),upub:id},tipo:"mencao"},true)));pubRedesenha();setTimeout(pubCarregar,1500)}
  catch(e){if(fotos.length)try{await SB.storage.from("fotos").remove(fotos)}catch(_){}if(ED===ed0){ED.env=false;edDesenha()}toast("Não deu para publicar. Tente de novo.")}};
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
{const _pp62=pubPostHTML;pubPostHTML=function(x){const h=_pp62.apply(this,arguments);const es=x.estilo||{};if(es.v!==2||!(es.tags&&es.tags.length||es.alt||es.semCom||es.semCurt))return h;
  try{const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)return h;
    if(es.semCom)a.classList.add("sem-com");if(es.semCurt&&x.autor!==S.uid)a.classList.add("sem-curt");
    const sl=[...a.querySelectorAll(".track > .up-sl")].slice(0,x.fotos.length);
    sl.forEach((s,i)=>{const im=s.querySelector("img.up-img");if(im&&es.alt&&es.alt[i])im.alt=es.alt[i];const ts=(es.tags||[]).filter(t=>t.i===i&&(S.membros&&S.membros[t.u]||S.amigos.has(t.u)||t.u===S.uid));
      if(ts.length){s.insertAdjacentHTML("beforeend",`<button type="button" class="up-tgb" data-uptags aria-label="Ver quem está marcado">👤</button>${ts.map(t=>`<span class="up-tg" style="--tx:${t.x<.22?"-12%":t.x>.78?"-88%":"-50%"};--ty:${t.y>.82?"calc(-100% - 8px)":"8px"};left:${Math.max(5,Math.min(95,t.x*100))}%;top:${Math.max(5,Math.min(95,t.y*100))}%">${esc(nomeDe(t.u))}</span>`).join("")}`)}});
    return a.outerHTML}catch(e){return h}}}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;const b=t.closest(".upost [data-uptags]");if(b){e.stopPropagation();e.preventDefault();b.closest(".upost").classList.toggle("tags-on");return}
  if(t.closest(".upost.sem-com [data-a='cmt']")){e.stopPropagation();e.preventDefault();toast("Os comentários deste post estão desativados.")}},true);

