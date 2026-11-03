/* ---------- Criação (rodada 2): figurinhas que não se cobrem, fundo da foto inteira em degradê,
   story respondido com miniatura nas Conversas e menção digitada com "@" ---------- */

/* ===== 1. cada figurinha nova vai para o lugar livre mais perto de onde ela nasceria =====
   O tamanho vem do próprio elemento desenhado (offsetWidth/Height × escala, girado), não da animação de entrada.
   A cascata antiga (093 edLivre) fica desligada; o deslocamento do 094 continua rodando, mas a posição final é esta. */
const CA100_MT=.085,CA100_MB=.13,CA100_ML=.03,CA100_PAD=8;
edLivre=function(x,y){return [x,y]};
function ca100Caixa(n,e,W,H){const s=Math.max(.2,+e.s||1),w=n.offsetWidth*s,h=n.offsetHeight*s,a=(+e.r||0)*Math.PI/180,c=Math.abs(Math.cos(a)),si=Math.abs(Math.sin(a));
  const bw=w*c+h*si,bh=w*si+h*c,cx=(+e.x||0)*W,cy=(+e.y||0)*H;return [cx-bw/2,cy-bh/2,cx+bw/2,cy+bh/2]}
function ca100Lugar(el,alvo){const box=$("#ce-els");if(!box||!ED||!ED.st)return null;const W=box.clientWidth,H=box.clientHeight;if(W<40||H<40)return null;
  const nos={};box.querySelectorAll(":scope>[data-eid]").forEach(n=>{nos[n.dataset.eid]=n});const nn=nos[el.id];if(!nn||!nn.offsetWidth)return null;
  const P=CA100_PAD,outros=ED.st.els.filter(o=>o!==el&&nos[o.id]&&nos[o.id].offsetWidth).map(o=>{const r=ca100Caixa(nos[o.id],o,W,H);return [r[0]-P,r[1]-P,r[2]+P,r[3]+P]});
  const s0=Math.max(.2,+el.s||1),diag=Math.hypot(W,H),lim=(v,a,b)=>Math.max(a,Math.min(b,v));
  const eixo=(t,a,b,p)=>{const l=[t];for(let k=1;k<200;k++){let m=0;if(t+k*p<=b+.5){l.push(t+k*p);m=1}if(t-k*p>=a-.5){l.push(t-k*p);m=1}if(!m)break}return l};
  let melhor=null,sm=1e9;
  /* tamanho normal; se não couber em lugar nenhum, tenta um pouco menor (dá para ampliar com dois dedos); por fim aceita sobrepor o mínimo */
  /* figurinha mais larga que o story (ex.: local comprido) já nasce do tamanho que cabe */
  const b0=ca100Caixa(nn,{...el,x:0,y:0,s:s0},W,H),ff=Math.min(1,W*(1-2*CA100_ML)/Math.max(1,b0[2]-b0[0]),H*(1-CA100_MT-CA100_MB)/Math.max(1,b0[3]-b0[1]));
  for(const f0 of [1,.86,.74]){const f=f0*ff,[x0,y0,x1,y1]=ca100Caixa(nn,{...el,x:0,y:0,s:s0*f},W,H),w=x1-x0,h=y1-y0;
    const xa=Math.min(W/2,w/2+W*CA100_ML),xb=Math.max(W/2,W-w/2-W*CA100_ML),ya=Math.min(H/2,h/2+H*CA100_MT),yb=Math.max(H/2,H-h/2-H*CA100_MB);
    const tx=lim(alvo[0]*W,xa,xb),ty=lim(alvo[1]*H,ya,yb),xs=eixo(tx,xa,xb,Math.max(4,W/32)),ys=eixo(ty,ya,yb,Math.max(4,H/64));
    /* também as posições encostadas nas bordas da tela e nas outras figurinhas (a grade sozinha pode pular a única vaga) */
    xs.push(xa,xb);ys.push(ya,yb);outros.forEach(o=>{xs.push(o[0]-w/2,o[2]+w/2);ys.push(o[1]-h/2,o[3]+h/2)});
    const ok=(v,a,b)=>v>=a-.5&&v<=b+.5;for(let i=xs.length-1;i>=0;i--)if(!ok(xs[i],xa,xb))xs.splice(i,1);for(let i=ys.length-1;i>=0;i--)if(!ok(ys[i],ya,yb))ys.splice(i,1);
    let livre=null,dl=1e9;
    for(const cy of ys)for(const cx of xs){const r=[cx-w/2,cy-h/2,cx+w/2,cy+h/2];let ov=0;
      for(const o of outros){const ix=Math.min(r[2],o[2])-Math.max(r[0],o[0]),iy=Math.min(r[3],o[3])-Math.max(r[1],o[1]);if(ix>0&&iy>0)ov+=ix*iy}
      const d=Math.hypot((cx-tx)*1.15,cy-ty);
      if(!ov){if(d<dl){dl=d;livre=[cx,cy]}}else if(f0===1){const sc=ov/Math.max(1,w*h)+.6*d/diag;if(sc<sm){sm=sc;melhor=[cx,cy]}}}
    if(livre)return [+(livre[0]/W).toFixed(4),+(livre[1]/H).toFixed(4),f===1?null:+(s0*f).toFixed(3)]}
  return melhor?[+(melhor[0]/W).toFixed(4),+(melhor[1]/H).toFixed(4),ff<1?+(s0*ff).toFixed(3):null]:null}
function ca100Coloca(el,alvo){const p=ca100Lugar(el,alvo);if(!p)return;el.x=p[0];el.y=p[1];if(p[2])el.s=p[2];
  if(typeof edPosEl==="function")edPosEl(el);else{const n=document.querySelector(`#ce-els [data-eid="${el.id}"]`);if(n){n.style.left=el.x*100+"%";n.style.top=el.y*100+"%"}}}
{const _ad100=edAdd;edAdd=function(e){const alvo=[e&&e.x!=null&&isFinite(+e.x)?+e.x:.5,e&&e.y!=null&&isFinite(+e.y)?+e.y:.5];const st=ED&&ED.st,n0=st?st.els.length:0;
  const r=_ad100.apply(this,arguments);try{if(ED&&ED.st===st&&st&&st.els.length>n0)ca100Coloca(st.els[st.els.length-1],alvo)}catch(_){}return r}}

/* no story publicado: tocar na parte "vazia" de uma figurinha que está por cima passa o toque para o botão da que está por baixo */
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const it=t.closest("#layer .us2-its .us-it");if(!it||t.closest("button,a,input,textarea,select,[role=button],[data-usslid]"))return;
  let alvo=null;try{for(const el of document.elementsFromPoint(e.clientX,e.clientY)){if(it.contains(el))continue;const o=el.closest&&el.closest(".us-it");if(!o||o===it)continue;alvo=el.closest("button,a,[role=button]");if(alvo)break}}catch(_){}
  if(!alvo)return;e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();alvo.click()},true);

/* ===== 2. foto inteira no story: o fundo vira um degradê contínuo tirado de várias faixas da foto =====
   Em cima e embaixo a cor encosta na borda da foto (sem emenda) e escurece para as pontas. Editor, miniaturas e
   imagem final usam as mesmas paradas (frações da altura), então o publicado fica igual ao editor. */
const CA100_LN=48;
function ca100Linhas(b){const key=b.f||"normal";if(b._ca100&&b._ca100.k===key&&b._ca100.img===b.img)return b._ca100.v;let v=null;
  try{const c=document.createElement("canvas");c.width=12;c.height=CA100_LN;const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(b.img,0,0,12,CA100_LN);if(key!=="normal")edFiltra(c,key,{});
    const d=g.getImageData(0,0,12,CA100_LN).data;v=[];for(let y=0;y<CA100_LN;y++){let r=0,gg=0,bb=0;for(let x=0;x<12;x++){const i=(y*12+x)*4;r+=d[i];gg+=d[i+1];bb+=d[i+2]}v.push([r/12,gg/12,bb/12])}}catch(e){v=null}
  b._ca100={k:key,img:b.img,v};return v}
function ca100Cor(rows,a,z,f){let r=0,g=0,b=0;const n=Math.max(1,z-a);for(let i=a;i<z;i++){r+=rows[i][0];g+=rows[i][1];b+=rows[i][2]}r/=n;g/=n;b/=n;
  const l=.2126*r+.7152*g+.0722*b,c=x=>Math.max(0,Math.min(255,Math.round((l+(x-l)*1.12)*f)));return `rgb(${c(r)},${c(g)},${c(b)})`}
function ca100Paradas(b,W,H){const rows=ca100Linhas(b);if(!rows||!b.img)return [[0,"#111"],[1,"#111"]];const N=rows.length;
  const [iw,ih]=edWH(b.img),k=Math.min(W/iw,H/ih)*(b.z||1),h=ih*k,top=(H-h)/2+(b.oy||0)*H,yT=top/H,yB=(top+h)/H;
  const l=[[yT-.42,ca100Cor(rows,0,10,.58)],[yT-.06,ca100Cor(rows,0,3,.9)],[yT,ca100Cor(rows,0,1,.97)]];
  for(let i=1;i<6;i++){const a=Math.floor(N*i/6)-2;l.push([yT+(yB-yT)*i/6,ca100Cor(rows,Math.max(0,a),Math.min(N,a+4),.97)])}
  l.push([yB,ca100Cor(rows,N-1,N,.97)],[yB+.06,ca100Cor(rows,N-3,N,.9)],[yB+.42,ca100Cor(rows,N-10,N,.58)]);
  /* corta em 0–1 (interpolando a cor na ponta não importa: a foto cobre essa parte) e mantém a ordem */
  const o=[];let ult=0;l.forEach(([p,c])=>{p=Math.max(0,Math.min(1,p));if(p<ult)p=ult;ult=p;o.push([+p.toFixed(4),c])});
  if(o[0][0]>0)o.unshift([0,o[0][1]]);if(o[o.length-1][0]<1)o.push([1,o[o.length-1][1]]);return o}
function ca100Css(b,W,H){return `linear-gradient(180deg,${ca100Paradas(b,W,H).map(([p,c])=>`${c} ${(p*100).toFixed(2)}%`).join(",")})`}
function ca100Pinta(g,b,W,H){const gr=g.createLinearGradient(0,0,0,H);ca100Paradas(b,W,H).forEach(([p,c])=>gr.addColorStop(p,c));g.fillStyle=gr;g.fillRect(0,0,W,H)}
function ca100FundoEd(){const b=ED&&ED.st&&ED.st.bg,cv=$("#ce-cv"),bg=cv&&cv.querySelector(".ce-bg");if(!b||b.tipo!=="foto"||!b.cont||!bg)return;bg.style.background=ca100Css(b,cv.clientWidth||360,cv.clientHeight||640)}
cfpFundoCss=function(b){const cv=$("#ce-cv");return ca100Css(b,(cv&&cv.clientWidth)||360,(cv&&cv.clientHeight)||640)};
{const _pi100=edPosImg;edPosImg=function(i,f){const r=_pi100.apply(this,arguments);try{if(i&&i.id==="ce-bgi"&&f&&f.cont&&ED&&f===ED.st.bg)ca100FundoEd()}catch(e){}return r}}
{const _st100=edStThumbs;edStThumbs=function(){const r=_st100.apply(this,arguments);try{document.querySelectorAll("#layer canvas[data-stt]").forEach(c=>{const st=ED.sts[+c.dataset.stt],b=st&&st.bg;if(!b||b.tipo!=="foto"||!b.cont||!b.img)return;
  const g=c.getContext("2d");ca100Pinta(g,b,c.width,c.height);cfpDesenhaCont(g,b.img,c.width,c.height,b)})}catch(e){}return r}}
{const _ex100=edExportaStory;edExportaStory=async function(st0,tudo){const st=st0||ED.st,b=st&&st.bg;if(!b||b.tipo!=="foto"||!b.cont||!b.img)return _ex100.apply(this,arguments);
  try{await Promise.all(st.els.filter(e=>e.t==="texto").map(e=>document.fonts.load(edFonte(e.f,40),e.tx)).concat([document.fonts.load('900 40px "Public Sans"'),document.fonts.load('800 40px "Public Sans"')]));await document.fonts.ready}catch(e){}
  const W=1080,H=1920,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");ca100Pinta(g,b,W,H);
  let src=b.img;if(b.f&&b.f!=="normal"){const [iw,ih]=edWH(b.img),k=Math.min(1,2400/Math.max(iw,ih)),s=document.createElement("canvas");s.width=Math.round(iw*k);s.height=Math.round(ih*k);s.getContext("2d").drawImage(b.img,0,0,s.width,s.height);edFiltra(s,b.f,{});src=s}
  cfpDesenhaCont(g,src,W,H,b);g.drawImage(edOverlayCanvas(st,W,H,tudo),0,0);return edJpeg(c)}}

/* ===== 3. resposta e curtida de story chegam com a miniatura do story =====
   Vai no snap da mensagem: sth={id, p:caminho da 1ª foto do story (pasta do autor)} ou {id, g:fundo}. Quem recebe é o autor,
   que sempre lê os próprios arquivos (e a regra do bucket "fotos" deixa qualquer membro ler). Mensagens antigas, sem sth, ficam como eram. */
function ca100StTh(x){if(!x||x.tipo!=="story")return null;const o={id:String(x.id)};const p=(x.fotos||[])[0];
  if(typeof p==="string"&&p.startsWith(String(x.autor)+"/"))o.p=p;else o.g=Math.floor(+(x.estilo&&x.estilo.fundo)||0);return o}
{const _de100=dmEnviar;dmEnviar=function(para,campos){try{if(campos&&(campos.tipo==="resp_story"||campos.tipo==="curtiu_story")&&campos.snap&&typeof campos.snap==="object"&&!campos.snap.sth){
    const sn=campos.snap,id=sn.story&&typeof sn.story==="object"?sn.story.id:sn.upub,th=id&&ca100StTh(pubDe(id));if(th)campos={...campos,snap:{...sn,sth:th}}}}catch(e){}
  const a=[...arguments];a[1]=campos;return _de100.apply(this,a)}}
/* lê o sth de uma mensagem (dado de outro membro: tudo validado) */
function ca100StInfo(m){const s=m&&m.snap,th=s&&s.sth;if(!th||typeof th!=="object"||Array.isArray(th))return null;const au=String(m.para||"");if(!au)return null;
  const id=typeof th.id==="string"?th.id.slice(0,80):"";if(!id)return null;const o={id,au};
  if(typeof th.p==="string"&&th.p.length<300&&th.p.startsWith(au+"/")&&!/\.\.|[?#]/.test(th.p))o.p=th.p;else o.g=Math.floor(+th.g||0);return o}
function ca100StHTML(m,inf){const eu=m.de===S.uid,lk=m._ca100lk,perg=m.snap&&m.snap.q!=null&&!lk;
  const lb=lk?(eu?"Você curtiu o story de "+nomeDe(m.para):"Curtiu seu story"):perg?(eu?"Você respondeu à pergunta de "+nomeDe(m.para):"Respondeu à sua pergunta"):(eu?"Você respondeu ao story de "+nomeDe(m.para):"Respondeu ao seu story");
  const u=inf.p?pubUrl(inf.p):"";
  return `<span class="ca100-stl">${esc(lb)}</span><button type="button" class="ca100-st" data-ca100st="${esc(inf.id)}" data-au="${esc(inf.au)}" aria-label="Ver o story" style="background:${inf.p?"#1b1d22":pubFundo(inf.g)}">${inf.p?`<img alt="" ${u?`src="${pubSrc(u)}"`:""} data-ca100p="${esc(inf.p)}" onerror="this.remove()">`:""}</button>${perg?`<span class="ca100-stq">${esc(String(m.snap.q).slice(0,80))}</span>`:""}`}
{const _th100=dmThreadHTML;dmThreadHTML=function(u){const am=allMsgs,lk=new Set();
  allMsgs=function(){return am.apply(this,arguments).map(m=>{if(m&&m.tipo==="curtiu_story"&&ca100StInfo(m)){lk.add(m.id);return {...m,tipo:"resp_story",texto:m.texto||"❤️",_ca100lk:1}}return m})};
  let h;try{h=_th100.apply(this,arguments)}finally{allMsgs=am}
  try{am().filter(dmPar(u)).forEach(m0=>{if(m0.tipo!=="resp_story"&&!lk.has(m0.id))return;const inf=ca100StInfo(m0);if(!inf)return;const m=lk.has(m0.id)?{...m0,_ca100lk:1}:m0;
    const k=`data-mid="${esc(m.id)}"`,i=h.indexOf(k);if(i<0)return;const nx=h.indexOf("data-mid=",i+k.length),a=h.indexOf('<div class="dm-q">',i);if(a<0||(nx>=0&&a>nx))return;const z=h.indexOf("</div>",a);if(z<0)return;
    let blk=ca100StHTML(m,inf);
    /* a resposta da pergunta (075) também desenha um cartão de notícia vazio: some */
    let fim=z+6;if(h.startsWith('<button type="button" class="dm-card',fim)){const zz=h.indexOf("</button>",fim);if(zz>0&&(nx<0||zz<nx))fim=zz+9}
    h=h.slice(0,a)+`<div class="ca100-sq${m.de===S.uid?" eu":""}">${blk}</div>`+h.slice(fim)})}catch(e){}
  return h}}
async function ca100Assina(){const v=$("#v-msgs");if(!v)return;const ims=[...v.querySelectorAll("img[data-ca100p]:not([src])")];if(!ims.length||typeof pubAssinaLista!=="function")return;
  const ps=[...new Set(ims.map(i=>i.dataset.ca100p))];try{await pubAssinaLista([{fotos:ps}])}catch(e){}
  v.querySelectorAll("img[data-ca100p]:not([src])").forEach(i=>{const u=pubUrl(i.dataset.ca100p);if(u)i.src=pubSrc(u);else i.remove()})}
{const _rm100=renderMsgs;renderMsgs=function(){const r=_rm100.apply(this,arguments);try{if(THREAD)ca100Assina()}catch(e){}return r}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#v-msgs [data-ca100st]");if(!b)return;e.stopPropagation();e.preventDefault();
  const x=pubDe(b.dataset.ca100st),agora=Date.now();if(!x||x.tipo!=="story"||!((x.expira||0)>agora)){toast("Este story não está mais disponível.");return}
  const l=(typeof pubStoriesDe==="function"?pubStoriesDe(x.autor):[]).filter(y=>(y.expira||0)>agora),i=l.indexOf(x);
  vibrar&&vibrar(6);if(i>=0)stLista(l,i,nomeDe(x.autor),"dm"+x.autor);else stLista([x],0,nomeDe(x.autor),"dm"+x.id)},true);

/* ===== 4. menção: digita "@" na própria figurinha e escolhe o amigo nas sugestões (grava o mesmo {t:"men",uid}) ===== */
var CA100_MEN=null;
function ca100MenSug(q){const n=norm(String(q||"").replace(/^@+/,"")).trim(),am=amigosL();
  const l=n?am.filter(u=>{const k=norm(nomeDe(u));return k.startsWith(n)||k.split(/\s+/).some(p=>p.startsWith(n))}).concat(am.filter(u=>{const k=norm(nomeDe(u));return k.includes(n)&&!(k.startsWith(n)||k.split(/\s+/).some(p=>p.startsWith(n)))})):am;return l.slice(0,12)}
function ca100MenLista(){const ov=$("#layer .ca100-men");if(!ov||!CA100_MEN)return;const i=ov.querySelector("#ca100-mq"),l=ca100MenSug(i.value),box=ov.querySelector(".ca100-sug");CA100_MEN.l=l;
  box.innerHTML=l.length?l.map((u,k)=>`<button type="button" role="option" data-ca100mu="${esc(u)}" data-edmensel="${esc(u)}" class="${k===0&&i.value.trim()?"on":""}">${avatar(u)}<span>${esc(nomeDe(u))}</span></button>`).join(""):`<p class="ca100-nada">Nenhum amigo com esse nome</p>`;
  const w=ov.querySelector(".ca100-mw");if(w)w.dataset.v=i.value?"":"1"}
function ca100MenAbre(el){if(!ED||!$("#layer .ce"))return;if(!amigosL().length){toast("Você ainda não tem amigos no Prumo.");return}
  $("#layer .ce-fig")?.remove();$("#layer .ce-sel")?.remove();$("#layer .ca100-men")?.remove();CA100_MEN={el:el||null,l:[]};
  const cvw=$("#ce-cv")?.clientWidth||Math.min(innerWidth,innerHeight*9/16),ov=document.createElement("div");
  ov.className="ca100-men"+(ANIM_OK()?" anim":"");ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Mencionar um amigo");ov.style.setProperty("--bw",cvw+"px");
  const v=el?String(nomeDe(el.uid)):"";
  ov.innerHTML=`<div class="ce-top fe-top"><span class="sp"></span><button type="button" class="ce-ok" data-ca100mok>Concluído</button></div>
    <div class="fe-box"><div class="fe-card"><label class="ce-men ca100-mw"><span aria-hidden="true">@</span><input id="ca100-mq" value="${esc(v)}" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done" placeholder="MENÇÃO" aria-label="Nome do amigo"></label></div>
      <div class="ca100-sug" role="listbox" aria-label="Amigos"></div></div>`;
  $("#layer .ce").appendChild(ov);$("#layer .ce").classList.add("fe-on");if(el)$(`#ce-els [data-eid="${el.id}"]`)?.classList.add("editando");
  const i=ov.querySelector("#ca100-mq");ca100MenLista();
  i.addEventListener("input",()=>{if(/^@/.test(i.value))i.value=i.value.replace(/^@+/,"");ca100MenLista()});
  i.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();ca100MenOk()}});
  ov.addEventListener("mousedown",e=>{if(e.target.closest("button"))e.preventDefault()});
  setTimeout(()=>{try{i.focus();i.setSelectionRange(i.value.length,i.value.length)}catch(_){}},40)}
function ca100MenFecha(){$("#layer .ca100-men")?.remove();if(!$("#layer .ce-fe"))$("#layer .ce")?.classList.remove("fe-on");document.querySelectorAll("#ce-els .editando").forEach(x=>x.classList.remove("editando"));CA100_MEN=null}
function ca100MenEscolhe(u){const M=CA100_MEN;ca100MenFecha();if(!M||!ED)return;if(!u||!S.amigos.has(u))return;
  if(M.el){M.el.uid=u;edDesenha()}else edAdd({t:"men",uid:u,y:.25});vibrar&&vibrar(6)}
function ca100MenOk(){const M=CA100_MEN,i=$("#ca100-mq");if(!M)return;const q=norm((i&&i.value)||"").trim();
  if(!q){if(M.el){ED.st.els=ED.st.els.filter(x=>x!==M.el);ca100MenFecha();edDesenha();return}ca100MenFecha();return}
  const exato=amigosL().find(u=>norm(nomeDe(u))===q);const u=exato||(M.l&&M.l[0]);if(!u){toast("Escolha um amigo da lista.");return}ca100MenEscolhe(u)}
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest||!ED||!$("#layer .ce")||t.closest("#layer2"))return;let b;const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  if(t.closest(".ce-fig [data-edfig=\"men\"]")){pare();ca100MenAbre(null);return}
  const ov=t.closest("#layer .ca100-men");if(!ov)return;pare();
  if(b=t.closest("[data-ca100mu]")){ca100MenEscolhe(b.dataset.ca100mu);return}
  if(t.closest("[data-ca100mok]")){ca100MenOk();return}
  if(t===ov||t.classList.contains("fe-box")){ca100MenOk();return}
  if(t.closest(".ca100-mw"))$("#ca100-mq")?.focus()},true);
{const _te100=edToqueEl;edToqueEl=function(el){if($("#layer .ca100-men"))return;if(el&&el.t==="men")return ca100MenAbre(el);return _te100.apply(this,arguments)}}
{const _cl100=closeLayer;closeLayer=function(fromPop){if($("#layer .ca100-men")){if(fromPop===true&&ED&&!($("#layer2")?.innerHTML)){ca100MenFecha();if(pushH())HST++;return}ca100MenFecha()}return _cl100.apply(this,arguments)}}

/* ===== 5. ajustes rápidos ===== */
/* campos de uma linha nas figurinhas (local, hashtag, menção) crescem com o texto em vez de rolar e cortar o começo */
var CA100_CTX=null;
function ca100Larg(i){if(!i||!i.isConnected)return;try{const box=i.closest(".fe-pill,.ca100-mw")||i.parentElement;box.style.fontSize="";i.style.width="";
  const cs=getComputedStyle(i),f0=parseFloat(cs.fontSize)||20;CA100_CTX=CA100_CTX||document.createElement("canvas").getContext("2d");
  CA100_CTX.font=`${cs.fontStyle} ${cs.fontWeight} ${f0}px ${cs.fontFamily}`;let t=i.value||i.placeholder||"";if(cs.textTransform==="uppercase")t=t.toUpperCase();
  const w=CA100_CTX.measureText(t).width+f0*.15+2,resto=box.offsetWidth-i.offsetWidth,max=Math.max(60,innerWidth-24-resto);
  /* texto comprido: a pílula inteira diminui a letra (como no Instagram) em vez de rolar */
  if(w>max){const k=Math.max(.5,max/w);box.style.fontSize=(parseFloat(getComputedStyle(box).fontSize)*k).toFixed(2)+"px";i.style.width=Math.ceil(w*k)+"px"}else i.style.width=Math.ceil(w)+"px"}catch(e){}}
document.addEventListener("input",e=>{const t=e.target;if(t&&t.matches&&t.matches("#layer .fe-pill input,#ca100-mq"))ca100Larg(t)},true);
{const _ab100=fg2Abre;fg2Abre=function(){const r=_ab100.apply(this,arguments);try{document.querySelectorAll("#layer .ce-fe .fe-pill input").forEach(ca100Larg)}catch(e){}return r}}
{const _ma100=ca100MenAbre;ca100MenAbre=function(){const r=_ma100.apply(this,arguments);ca100Larg($("#ca100-mq"));return r}}
/* legenda do post: cresce com o texto (até 8 linhas) e, passando disso, rola com a última linha esmaecida (nada de linha cortada ao meio) */
function ca100Leg(){const t=$("#layer #ce-leg");if(!t)return;const cs=getComputedStyle(t),lh=parseFloat(cs.lineHeight)||23,max=Math.round(lh*8+parseFloat(cs.paddingTop||0)+parseFloat(cs.paddingBottom||0));
  t.style.height="auto";const h=t.scrollHeight;t.style.height=Math.min(h,max)+"px";t.classList.toggle("ca100-mais",h>max+2)}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="ce-leg")ca100Leg()},true);
{const _dz100=edDesenha;edDesenha=function(){const r=_dz100.apply(this,arguments);try{if($("#layer #ce-leg"))ca100Leg()}catch(e){}return r}}
