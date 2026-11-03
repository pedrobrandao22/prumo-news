/* ---------- Criação com foco em notícia e conteúdo ----------
   Pontos de partida de conteúdo (notícia comentada, relato, análise, pergunta), formulário próprio para cada um,
   cartões no Feed, notícia da edição direto no post ou no story, indicador como figurinha e bandeja com o que é de notícia primeiro.
   Dados novos ficam em publicacoes.estilo.cn (e um rascunho guarda o cn em localStorage):
     cn={v:1,k:"nt"|"rel"|"ana"|"enq",tit,q (relato: "AAAA-MM-DDTHH:MM"),fu (fonte: link https ou nome),o:[opções da pergunta],
         d:{tipo:"ind"|"bar"|"lin",tit,un,ind,val,var,dir,dt,s:[números],r:[rótulos]}}
   O texto do post continua sendo "título\n\ncorpo": quem tem a versão antiga do app vê o título no começo da legenda. */

/* ===== 1. dados ===== */
const CN102_KS=[["nt","Notícia","Comentar notícia","Uma notícia da edição com a sua opinião"],["rel","Relato","Aconteceu perto de mim","Foto, local e hora do que você viu"],["ana","Análise","Minha análise","Seu texto, um número ou um gráfico"],["enq","Pergunta","Pergunte aos amigos","Enquete sobre um tema da edição"]];
const CN102_NOME={nt:"Notícia comentada",rel:"Relato",ana:"Análise",enq:"Pergunta"};
const CN102_SVG=d=>`<svg class="cn102-i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const CN102_ICO={nt:'<path d="M5 5h11v14H7a2 2 0 0 1-2-2z"/><path d="M16 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 12.5h5M8 16h3"/>',
  rel:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  ana:'<path d="M4 20h16"/><path d="M6.5 16.5v-4M11 16.5V8.5M15.5 16.5v-6M20 16.5V5"/>',
  enq:'<path d="M5 7h8M5 12h14M5 17h5"/>',
  foto:'<rect x="3.5" y="5" width="17" height="14" rx="3.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 17l4.5-4.5 4 4 2.5-2.5 4 3.5"/>',
  story:'<circle cx="12" cy="12" r="8.5" stroke-dasharray="3 2.2"/><path d="M12 8.5v7M8.5 12h7"/>',
  tx:'<path d="M5 6.5h14M12 6.5V19M9 19h6"/>',
  ind:'<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>',
  mais:'<path d="M12 5v14M5 12h14"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>'};
const cn102S=(v,n)=>typeof v==="string"?v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").slice(0,n):"";
const cn102Num=v=>{if(typeof v==="number")return isFinite(v)?v:NaN;let s=String(v==null?"":v).trim().replace(/\s|R\$|%|US\$/g,"");if(!s)return NaN;
  if(/,/.test(s))s=s.replace(/\./g,"").replace(",",".");else if(/^-?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,"");const n=+s;return isFinite(n)?n:NaN};
const cn102Fmt=(v,max)=>{try{return (+v).toLocaleString("pt-BR",{maximumFractionDigits:max==null?2:max})}catch(e){return String(v)}};
/* fonte: link https vira link; o resto é só o nome da fonte */
function cn102Fonte(fu){fu=cn102S(fu,300).trim();if(!fu)return null;let u=/^www\./i.test(fu)?"https://"+fu:fu;const ok=/^https:\/\//i.test(u)?edUrlOk(u):"";
  return ok?{u:ok,n:edDom(ok)}:{u:"",n:fu.slice(0,80)}}
/* tudo o que vem de outro membro passa por aqui */
function cn102Limpa(c){if(!c||typeof c!=="object"||Array.isArray(c))return null;const k=["nt","rel","ana","enq"].includes(c.k)?c.k:null;if(!k)return null;
  const o={v:1,k,tit:cn102S(c.tit,120).trim(),fu:cn102S(c.fu,300).trim()};
  if(k==="rel"&&typeof c.q==="string"&&/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(c.q))o.q=c.q;
  if(k==="enq"){o.o=(Array.isArray(c.o)?c.o:[]).slice(0,4).map(v=>cn102S(v,40).trim()).filter(Boolean);if(o.o.length<2)o.o=["Sim","Não"]}
  if(k==="ana"&&c.d&&typeof c.d==="object"){const d=c.d,t=["ind","bar","lin"].includes(d.tipo)?d.tipo:null;
    if(t){const s=(Array.isArray(d.s)?d.s:[]).slice(0,60).map(v=>+v).filter(v=>isFinite(v)&&Math.abs(v)<1e15);
      const dd={tipo:t,tit:cn102S(d.tit,60),un:cn102S(d.un,12),s,r:(Array.isArray(d.r)?d.r:[]).slice(0,60).map(v=>cn102S(v,16))};
      if(t==="ind"){dd.ind=cn102S(d.ind,30);dd.val=cn102S(d.val,24);dd.var=cn102S(d.var,16);dd.dir=["sobe","desce","estavel"].includes(d.dir)?d.dir:"";dd.dt=/^\d{4}-\d{2}-\d{2}$/.test(d.dt||"")?d.dt:"";if(!dd.val)dd.val=s.length?cn102Fmt(s[s.length-1]):""}
      if(t==="ind"?dd.val:s.length>=2)o.d=dd}}
  return o}
function cn102De(x){const es=x&&x.estilo;if(!es||typeof es!=="object")return null;if(es._cn102!==undefined)return es._cn102;const c=cn102Limpa(es.cn);
  try{Object.defineProperty(es,"_cn102",{value:c,enumerable:false,configurable:true})}catch(e){}return c}
/* título + corpo no texto do post */
function cn102Texto(cn,corpo){const t=String(cn.tit||"").trim(),c=String(corpo||"").trim();return ((t?t+(c?"\n\n":""):"")+c).slice(0,2200)}
function cn102Corpo(x,cn){const t=String(x.texto||"");if(cn&&cn.tit&&t.indexOf(cn.tit)===0)return t.slice(cn.tit.length).replace(/^\s*\n/,"").replace(/^\n/,"");return t}
const cn102Hoje=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*6e4);return d.toISOString().slice(0,16)};
function cn102Quando(q){if(!q)return "";const m=/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(q);if(!m)return "";const d=new Date(+m[1],+m[2]-1,+m[3]);
  const h0=new Date();h0.setHours(0,0,0,0);const dias=Math.round((h0-d)/864e5);const MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const dia=dias===0?"hoje":dias===1?"ontem":`${+m[3]} ${MES[+m[2]-1]}${+m[1]!==h0.getFullYear()?" "+m[1]:""}`;return m[4]?`${dia}, ${+m[4]}h${m[5]!=="00"?m[5]:""}`:dia}
const cn102Primeiro=u=>String(nomeDe(u)||"").split(" ")[0];

/* ===== 2. gráfico (SVG no Feed e no formulário; canvas na figurinha do story) ===== */
function cn102Serie(d){if(d.tipo==="ind")return (d.s||[]).map((v,i)=>[d.r&&d.r[i]||"",v]);return (d.s||[]).map((v,i)=>[(d.r&&d.r[i])||"",v])}
function cn102Amostra(a,n){if(a.length<=n)return a.slice();const o=[];for(let i=0;i<n;i++)o.push(a[Math.round(i*(a.length-1)/(n-1))]);return o}
function cn102DiaCurto(s){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||"");if(!m)return s||"";return `${+m[3]}/${+m[2]}`}
function cn102Svg(d){const W=320,H=d.tipo==="ind"?150:190,pts=cn102Serie(d),vs=pts.map(p=>p[1]);let g="";
  const un=d.un?esc(d.un):"";
  if(d.tipo==="ind"){const setas={sobe:"▲",desce:"▼",estavel:"▬"};
    g+=`<text x="0" y="16" class="cn102-g-k">${esc((d.tit||"Indicador").toUpperCase())}${d.dt?` · ${esc(cn102DiaCurto(d.dt))}`:""}</text><text x="0" y="56" class="cn102-g-v">${esc(d.val)}</text>`;
    if(d.var)g+=`<text x="${W}" y="56" text-anchor="end" class="cn102-g-var ${esc(d.dir||"")}">${setas[d.dir]||""} ${esc(d.var)}</text>`;
    if(vs.length>=2){const y0=72,y1=H-14,mn=Math.min(...vs),mx=Math.max(...vs),sp=(mx-mn)||1,X=i=>i*W/(vs.length-1),Y=v=>y1-(v-mn)/sp*(y1-y0);
      const l=vs.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");g+=`<polygon class="cn102-g-ar" points="0,${y1} ${l} ${W},${y1}"/><polyline class="cn102-g-ln" points="${l}"/><circle class="cn102-g-pt" cx="${X(vs.length-1).toFixed(1)}" cy="${Y(vs[vs.length-1]).toFixed(1)}" r="3.5"/>`;
      if(d.r&&d.r[0])g+=`<text x="0" y="${H}" class="cn102-g-r">${esc(cn102DiaCurto(d.r[0]))}</text><text x="${W}" y="${H}" text-anchor="end" class="cn102-g-r">${esc(cn102DiaCurto(d.r[d.r.length-1]||""))}</text>`}
    return `<svg class="cn102-g" viewBox="0 0 ${W} ${H+4}" role="img" aria-label="${esc((d.tit||"Indicador")+": "+d.val+(d.var?", "+d.var:""))}">${g}</svg>`}
  const top=d.tit?28:6,bot=H-22,mn=Math.min(0,...vs),mx=Math.max(0,...vs),sp=(mx-mn)||1,Y=v=>bot-(v-mn)/sp*(bot-top-14);
  if(d.tit)g+=`<text x="0" y="14" class="cn102-g-k">${esc(d.tit.toUpperCase())}${un?` (${un})`:""}</text>`;
  g+=`<line class="cn102-g-0" x1="0" x2="${W}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}"/>`;
  const n=pts.length,lab=(t,x)=>`<text x="${x.toFixed(1)}" y="${H}" text-anchor="middle" class="cn102-g-r">${esc(String(t).slice(0,10))}</text>`;
  if(d.tipo==="bar"){const bw=W/n,w=Math.min(46,bw*.62);pts.forEach(([r,v],i)=>{const cx=bw*i+bw/2,y=Y(Math.max(0,v)),h=Math.abs(Y(v)-Y(0));
      g+=`<rect class="cn102-g-b${v<0?" neg":""}" x="${(cx-w/2).toFixed(1)}" y="${(v<0?Y(0):y).toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(1,h).toFixed(1)}" rx="3"/><text x="${cx.toFixed(1)}" y="${(v<0?Y(v)+13:y-5).toFixed(1)}" text-anchor="middle" class="cn102-g-n">${esc(cn102Fmt(v))}</text>`+lab(r,cx)})}
  else{const X=i=>n<2?W/2:12+i*(W-24)/(n-1),l=pts.map(([r,v],i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");g+=`<polyline class="cn102-g-ln" points="${l}"/>`;
    pts.forEach(([r,v],i)=>{g+=`<circle class="cn102-g-pt" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.5"/>`;if(n<=8||i===0||i===n-1)g+=`<text x="${X(i).toFixed(1)}" y="${(Y(v)-8).toFixed(1)}" text-anchor="middle" class="cn102-g-n">${esc(cn102Fmt(v))}</text>`+lab(r,X(i))})}
  return `<svg class="cn102-g" viewBox="0 -2 ${W} ${H+6}" role="img" aria-label="${esc((d.tit||"Gráfico")+": "+pts.map(([r,v])=>(r?r+" ":"")+cn102Fmt(v)).join(", "))}">${g}</svg>`}
/* cartão do dado para o story: o mesmo desenho, em canvas com a fonte do app */
async function cn102DadoCanvas(d){try{await document.fonts.load('800 40px "Public Sans"');await document.fonts.load('600 20px "Public Sans"')}catch(e){}
  const W=960,H=600,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d"),P=56,F='"Public Sans",system-ui,sans-serif';
  g.fillStyle="#ffffff";g.fillRect(0,0,W,H);g.fillStyle="#14213a";g.textBaseline="alphabetic";
  const setas={sobe:"▲",desce:"▼",estavel:"▬"},vs=(d.s||[]).slice(),iw=W-2*P;
  g.font=`800 30px ${F}`;g.fillStyle="#5b6b7f";g.fillText(((d.tit||"Indicador").toUpperCase()+(d.dt?" · "+cn102DiaCurto(d.dt):"")).slice(0,44),P,P+28);
  let y0;if(d.tipo==="ind"){g.font=`800 104px ${F}`;g.fillStyle="#14213a";g.fillText(d.val||"",P,P+140);
    if(d.var){g.font=`800 44px ${F}`;g.fillStyle=d.dir==="sobe"?"#24533c":d.dir==="desce"?"#b3412f":"#5b6b7f";g.textAlign="right";g.fillText(`${setas[d.dir]||""} ${d.var}`,W-P,P+138);g.textAlign="left"}y0=P+190}
  else y0=P+70;
  const y1=H-P-34;if(vs.length>=1){const mn=d.tipo==="ind"?Math.min(...vs):Math.min(0,...vs),mx=d.tipo==="ind"?Math.max(...vs):Math.max(0,...vs),sp=(mx-mn)||1,Y=v=>y1-(v-mn)/sp*(y1-y0-(d.tipo==="ind"?0:40));
    g.lineJoin="round";g.lineCap="round";
    if(d.tipo==="bar"){const n=vs.length,bw=iw/n,w=Math.min(110,bw*.62);g.strokeStyle="#dde2e9";g.lineWidth=3;g.beginPath();g.moveTo(P,Y(0));g.lineTo(W-P,Y(0));g.stroke();
      vs.forEach((v,i)=>{const cx=P+bw*i+bw/2,yy=Y(Math.max(0,v)),h=Math.max(3,Math.abs(Y(v)-Y(0)));g.fillStyle=v<0?"#b3412f":"#24406b";edRR(g,cx-w/2,v<0?Y(0):yy,w,h,8);g.fill();
        g.fillStyle="#14213a";g.font=`800 30px ${F}`;g.textAlign="center";g.fillText(cn102Fmt(v),cx,v<0?Y(v)+36:yy-12);g.fillStyle="#5b6b7f";g.font=`600 26px ${F}`;g.fillText(String((d.r||[])[i]||"").slice(0,10),cx,H-P+4);g.textAlign="left"})}
    else{const n=vs.length,X=i=>n<2?W/2:P+i*iw/(n-1);if(d.tipo==="ind"){g.beginPath();g.moveTo(X(0),y1);vs.forEach((v,i)=>g.lineTo(X(i),Y(v)));g.lineTo(X(n-1),y1);g.closePath();g.fillStyle="rgba(36,64,107,.12)";g.fill()}
      g.strokeStyle="#24406b";g.lineWidth=7;g.beginPath();vs.forEach((v,i)=>i?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v)));g.stroke();
      vs.forEach((v,i)=>{if(d.tipo==="ind"&&i<n-1)return;g.fillStyle="#24406b";g.beginPath();g.arc(X(i),Y(v),11,0,Math.PI*2);g.fill();
        if(d.tipo!=="ind"&&(n<=7||i===0||i===n-1)){g.fillStyle="#14213a";g.font=`800 28px ${F}`;g.textAlign="center";g.fillText(cn102Fmt(v),X(i),Y(v)-22);g.fillStyle="#5b6b7f";g.font=`600 26px ${F}`;g.fillText(String((d.r||[])[i]||"").slice(0,10),X(i),H-P+4);g.textAlign="left"}})
      if(d.tipo==="ind"&&d.r&&d.r.length){g.fillStyle="#5b6b7f";g.font=`600 26px ${F}`;g.fillText(cn102DiaCurto(d.r[0]),P,H-P+4);g.textAlign="right";g.fillText(cn102DiaCurto(d.r[d.r.length-1]),W-P,H-P+4);g.textAlign="left"}}}
  g.fillStyle="#c9822b";g.fillRect(0,0,12,H);return c}

/* ===== 3. começar pelo conteúdo ===== */
var CN102_SEMGAL=0;
{const _ag=cfpAbreGaleria;cfpAbreGaleria=function(){if(CN102_SEMGAL)return;return _ag.apply(this,arguments)}}
function cn102Novo(k){return {v:1,k,tit:"",corpo:"",q:k==="rel"?cn102Hoje():"",fu:"",o:["",""],d:null}}
/* abre o criador já no formulário do tipo escolhido */
function cn102Comeca(k,o){o=o||{};if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}uso("criar_"+k);
  if($("#layer").innerHTML)closeLayer();CN102_SEMGAL=1;try{criarAbrir("post")}finally{CN102_SEMGAL=0}if(!ED||ED.modo!=="post")return;
  const P=ED.po;P.cn=cn102Novo(k);if(o.pid)P.pid=o.pid;P.passo="detalhes";edDesenha();
  if(k==="nt"&&!P.pid)cn102ListaNt("data-edpnt");
  else if(k==="rel"&&!o.semFoto)cn102EscolheFotos();
  else setTimeout(()=>{const i=$(k==="nt"?"#ce-leg":"#cn102-tit");if(i)try{i.focus({preventScroll:true})}catch(e){}},80)}
/* lista de notícias com a arte da edição */
function cn102ListaNt(attr){const ce=$("#layer .ce");if(!ce)return;$("#layer .ce-sel")?.remove();$("#layer .ce-fig")?.remove();
  const ps=ordenadas(visiveis()).slice(0,60),ov=document.createElement("div");ov.className="ce-sel cn102-ntl";
  ov.innerHTML=`<div class="ce-selp" role="dialog" aria-label="Escolher notícia"><b>Notícia da edição</b><input class="field" id="ce-lq" type="search" placeholder="Buscar na edição" autocomplete="off" enterkeyhint="search">
    <ul class="ce-lis">${ps.map(p=>{const v=versao(p,lente());return `<li><button type="button" ${attr}="${esc(p.id)}" data-busca="${esc(norm(v.titulo+" "+(p.tag||"")+" "+secNome(secOf(p))))}">${capaArte(p,"cn102-th")}<span><small style="color:${secCor(secOf(p))}">${esc(secNome(secOf(p)))}${p.tag?" · "+esc(p.tag):""}</small><b>${esc(v.titulo)}</b></span></button></li>`}).join("")||`<li class="hint">A edição ainda não carregou.</li>`}</ul>
    <div class="ce-selb"><button type="button" class="btn ghost" data-edselx>Cancelar</button></div></div>`;
  ce.appendChild(ov);const q=ov.querySelector("#ce-lq");q.addEventListener("input",()=>{const n=norm(q.value).trim();ov.querySelectorAll("[data-busca]").forEach(b=>{b.parentElement.hidden=!!n&&!b.dataset.busca.includes(n)})})}

/* tela vazia do post: o que publicar vem antes da galeria */
function cn102InicioHTML(){return `<div class="cn102-ini"><p class="cn102-h">O que você quer publicar?</p><div class="cn102-cards">${CN102_KS.map(([k,,t,d])=>`<button type="button" class="cn102-card cn102-c-${k}" data-cn102ini="${k}"${k==="nt"?" data-edsont":""}>${CN102_SVG(CN102_ICO[k])}<b>${esc(t)}</b><small>${esc(d)}</small></button>`).join("")}</div>
  <div class="cn102-mais"><button type="button" class="cn102-chip" data-edsotexto>${CN102_SVG(CN102_ICO.tx)}Só texto</button><div id="ce-rascs"></div></div></div>`}
{const _cf=cfpFotos;cfpFotos=function(el){const r=_cf.apply(this,arguments);try{const P=ED.po;if(!(P.rolo&&P.rolo.length&&P.fotos[P.cur])){const o=el.querySelector(".cfp-opc");if(o){o.outerHTML=cn102InicioHTML();if(typeof rascChip==="function")rascChip()}
    const box=$("#cfp-box");if(box){box.style.height="";box.classList.add("cn102-box")}const v=el.querySelector(".cfp-vazio");if(v){const s=v.querySelector("span");if(s)s.textContent="Fotos da galeria, até 10"}}}catch(e){}return r}}

/* ===== 4. formulário de cada tipo ===== */
function cn102Fotos(P){return `<div class="cn102-fts" aria-label="Fotos">${P.fotos.map((f,i)=>`<span class="cn102-ft"><button type="button" data-cn102ed="${i}" aria-label="Editar a foto ${i+1}"><canvas data-cfpc="${i}" width="160"></canvas></button><button type="button" class="cn102-ftx" data-cn102tira="${i}" aria-label="Tirar a foto ${i+1}">${CN102_SVG(CN102_ICO.x)}</button></span>`).join("")}
  ${P.fotos.length<10?`<button type="button" class="cn102-ftm" data-cn102foto>${CN102_SVG(CN102_ICO.foto)}<span>${P.fotos.length?"Mais":"Foto"}</span></button>`:""}</div>`}
function cn102NtCard(p){const v=versao(p,lente()),f=fotoDe(p);return `${capaArte(p,"cn102-nta",1)}<span class="cn102-ntt"><small style="color:${secCor(secOf(p))}">${esc(secNome(secOf(p)))}${p.tag?" · "+esc(p.tag):""}</small><b>${esc(v.titulo)}</b><em>Notícia da edição do Prumo</em></span>`}
function cn102DadoBloco(cn){const d=cn.d;if(!d)return `<button type="button" class="cn102-dadd" data-cn102dado>${CN102_SVG(CN102_ICO.ind)}<span><b>Número ou gráfico</b><small>Um indicador da edição ou os seus próprios números</small></span></button>`;
  return `<div class="cn102-dprev cn102-claro">${cn102Svg(d)}</div><div class="cn102-dbs"><button type="button" class="cn102-chip" data-cn102dado>Trocar</button><button type="button" class="cn102-chip" data-cn102dsem>Tirar</button></div>`}
function cn102Det(el){const P=ED.po,cn=P.cn,k=cn.k,tem=P.fotos.length,nt=P.pid&&pautaById(P.pid),nm=[...new Set((P.tags||[]).map(t=>t.u).concat(P.marcados))],eu=cn102Primeiro(S.uid);
  const campo=(id,f,ph,max,v,x)=>f==="tit"?`<textarea class="cn102-in cn102-tit" id="${id}" data-cn102f="${f}" maxlength="${max}" rows="1" placeholder="${esc(ph)}" ${x||""}>${esc(v||"")}</textarea>`:`<input class="cn102-in" id="${id}" data-cn102f="${f}" maxlength="${max}" placeholder="${esc(ph)}" value="${esc(v||"")}" autocomplete="off" ${x||""}>`;
  let b="";
  if(k==="nt")b=`${nt?`<button type="button" class="cn102-ntc" data-edsont aria-label="Trocar a notícia">${cn102NtCard(nt)}</button>`:`<button type="button" class="cn102-dadd" data-edsont>${CN102_SVG(CN102_ICO.nt)}<span><b>Escolher a notícia</b><small>Uma das notícias da edição de hoje</small></span></button>`}
      ${tem?cn102Fotos(P):""}<textarea id="ce-leg" class="cfp-leg cn102-corpo" data-cn102f="corpo" maxlength="2000" rows="4" placeholder="O que você acha dessa notícia?" aria-label="Seu comentário">${esc(cn.corpo)}</textarea>`;
  if(k==="rel")b=`${cn102Fotos(P)}${campo("cn102-tit","tit","O que aconteceu? (título curto)",120,cn.tit,'enterkeyhint="next"')}
      <textarea id="ce-leg" class="cfp-leg cn102-corpo" data-cn102f="corpo" maxlength="2000" rows="4" placeholder="Conte o que você viu: o quê, onde, como." aria-label="Detalhes">${esc(cn.corpo)}</textarea>
      <div class="cfp-rows cn102-rows"><label class="ce-row"><span>Onde</span><input id="ce-local" data-cn102f="local" maxlength="60" placeholder="Bairro, cidade" value="${esc(P.local)}" autocomplete="off"></label>
        <label class="ce-row"><span>Quando</span><input id="cn102-q" type="datetime-local" lang="pt-BR" data-cn102f="q" value="${esc(cn.q||"")}" max="${cn102Hoje()}"></label>
        <label class="ce-row"><span>Fonte</span><input id="cn102-fu" data-cn102f="fu" maxlength="300" placeholder="Link ou de onde veio (opcional)" value="${esc(cn.fu)}" autocomplete="off" inputmode="url"></label></div>`;
  if(k==="ana")b=`${campo("cn102-tit","tit","Título da sua análise",120,cn.tit,'enterkeyhint="next"')}
      <textarea id="ce-leg" class="cfp-leg cn102-corpo" data-cn102f="corpo" maxlength="2000" rows="6" placeholder="Seu ponto de vista sobre economia ou política. Diga de onde vêm os números." aria-label="Sua análise">${esc(cn.corpo)}</textarea>
      <div class="cn102-dado">${cn102DadoBloco(cn)}</div>${tem?cn102Fotos(P):""}
      <div class="cfp-rows cn102-rows"><label class="ce-row"><span>Fonte</span><input id="cn102-fu" data-cn102f="fu" maxlength="300" placeholder="Link ou nome da fonte (opcional)" value="${esc(cn.fu)}" autocomplete="off" inputmode="url"></label>
        ${tem?"":`<button type="button" class="ce-row" data-cn102foto><span>Adicionar foto</span><em></em><i>›</i></button>`}</div>`;
  if(k==="enq"){const os=cn.o.length?cn.o:["",""];b=`${campo("cn102-tit","tit","Sua pergunta",120,cn.tit,'enterkeyhint="next"')}
      <div class="cn102-ops">${os.map((v,i)=>`<span class="cn102-op"><input data-cn102o="${i}" maxlength="40" placeholder="${["Sim","Não","Opção 3","Opção 4"][i]}" value="${esc(v)}" aria-label="Opção ${i+1}" autocomplete="off">${i>1?`<button type="button" data-cn102otira="${i}" aria-label="Tirar a opção">${CN102_SVG(CN102_ICO.x)}</button>`:""}</span>`).join("")}${os.length<4?`<button type="button" class="cn102-opm" data-cn102omais>${CN102_SVG(CN102_ICO.mais)}Opção</button>`:""}</div>
      <div class="cfp-rows cn102-rows"><button type="button" class="ce-row" data-edsont><span>Sobre a notícia</span><em>${nt?esc(versao(nt,lente()).titulo):"Opcional"}</em><i>›</i></button>${nt?`<button type="button" class="ce-row ce-semnt" data-edsemnt><span>Tirar a notícia</span></button>`:""}</div>
      <textarea id="ce-leg" class="cfp-leg cn102-corpo" data-cn102f="corpo" maxlength="2000" rows="2" placeholder="Contexto (opcional)" aria-label="Contexto">${esc(cn.corpo)}</textarea>`}
  const aviso={nt:"A notícia aparece como da edição do Prumo e o comentário, com o seu nome.",rel:`Aparece como “Relato de ${eu}”. Conte só o que você viu ou confirmou: a redação não checa relatos.`,
    ana:`Aparece como “Opinião de ${eu}”, separada das notícias da edição.`,enq:"Seus amigos votam e veem o resultado, como nas enquetes da edição."}[k];
  el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="fotos" aria-label="Voltar">${EDI.vol}</button><b>${esc(CN102_NOME[k])}</b><span class="ce-b" aria-hidden="true"></span></div>
    <div class="ce-det cfp-det cn102" data-k="${k}"><div class="cn102-ks" role="tablist" aria-label="Tipo de publicação">${CN102_KS.map(([kk,n])=>`<button type="button" role="tab" data-cn102k="${kk}" aria-selected="${kk===k}">${CN102_SVG(CN102_ICO[kk])}${esc(n)}</button>`).join("")}</div>
      ${b}
      <div class="cfp-rows"><button type="button" class="ce-row" ${tem?"data-edtags":"data-edmarcar"}><span>Marcar pessoas</span><em>${nm.length?esc(nm.map(u=>cn102Primeiro(u)).join(", ")):""}</em><i>›</i></button>
        ${MA.on?`<button type="button" class="ce-row" data-cfppub><span>Público</span><em>${P.pub==="proximos"?"★ Melhores amigos":"Todos os amigos"}</em><i>›</i></button>`:""}
        <button type="button" class="ce-row" data-edavanc aria-expanded="${!!P.avOn}"><span>Configurações avançadas</span><em></em><i>${P.avOn?"⌃":"›"}</i></button>
        ${P.avOn?`<div class="ce-avc"><label class="ce-sw"><span>Ocultar o número de curtidas<small>Só você vê quem curtiu.</small></span><input type="checkbox" data-edsw="semCurt" ${P.semCurt?"checked":""}></label>
          <label class="ce-sw"><span>Desativar comentários<small>Ninguém poderá comentar neste post.</small></span><input type="checkbox" data-edsw="semCom" ${P.semCom?"checked":""}></label>
          ${tem?`<b class="ce-avt" id="cfp-altt">Texto alternativo</b>${P.fotos.map((x,i)=>`<div class="ce-altr"><img alt="" data-ai="${i}"><input class="field" maxlength="200" placeholder="Descreva a foto ${i+1}" data-edalt="${i}" value="${esc(x.alt||"")}"></div>`).join("")}`:""}</div>`:""}</div>
      <p class="cn102-aviso">${esc(aviso)}</p></div>
    <div class="cfp-share cn102-share">${k==="nt"&&nt?`<button type="button" class="cn102-st" data-cn102nst>${CN102_SVG(CN102_ICO.story)}Story</button>`:""}<button type="button" class="cfp-shb" data-edpubpo ${ED.env?"disabled":""}>${ED.env?"Publicando…":"Publicar"}</button></div>`;
  el.querySelectorAll("img[data-ai]").forEach(im=>{im.src=edUrlF(P.fotos[+im.dataset.ai])});cn102Cresce($("#cn102-tit"));
  el.querySelectorAll("canvas[data-cfpc]").forEach(c=>{try{edRenderFoto(P.fotos[+c.dataset.cfpc],c,P.ar)}catch(e){}})}
{const _cd=cfpDet;cfpDet=function(el){const P=ED&&ED.po;if(P&&P.cn&&P.cn.k){try{return cn102Det(el)}catch(e){console.error(e)}}return _cd.apply(this,arguments)}}
/* o que se digita vai para o estado (e o texto do post fica sempre pronto, para o rascunho e o "descartar?") */
function cn102Cresce(t){if(!t)return;t.style.height="auto";t.style.height=Math.min(140,t.scrollHeight+2)+"px"}
function cn102Sync(){const P=ED&&ED.po;if(!P||!P.cn)return;P.texto=cn102Texto(P.cn,P.cn.corpo)}
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.closest||!ED||!ED.po||!ED.po.cn||!t.closest("#layer .cn102"))return;const P=ED.po,cn=P.cn;
  if(t.id==="cn102-tit"){if(/\n/.test(t.value))t.value=t.value.replace(/\n+/g," ");cn102Cresce(t)}
  if(t.dataset.cn102f){const f=t.dataset.cn102f;if(f==="local")P.local=t.value;else cn[f]=t.value;if(f==="corpo"&&typeof menSugere==="function")try{menSugere(t)}catch(_){}}
  else if(t.dataset.cn102o!=null){cn.o[+t.dataset.cn102o]=t.value}cn102Sync()},true);
document.addEventListener("keydown",e=>{const t=e.target;if(e.key==="Enter"&&t&&t.id==="cn102-tit"){e.preventDefault();$("#ce-leg")?.focus()}});

/* fotos do relato e da análise */
function cn102EscolheFotos(){const ce=$("#layer .ce");if(!ce)return;$("#cn102-file")?.remove();const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.multiple=true;inp.id="cn102-file";inp.hidden=true;ce.appendChild(inp);
  inp.addEventListener("change",async()=>{const fs=[...(inp.files||[])];inp.remove();if(!fs.length||!ED||!ED.po)return;const P=ED.po,novos=[];
    for(const x of fs.slice(0,10)){try{novos.push(edNovaFoto(await edCarrega(x,2048)))}catch(err){toast("Não deu para abrir uma das fotos.")}}if(!novos.length||!ED||ED.po!==P)return;
    const cabe=novos.slice(0,10-P.fotos.length);if(cabe.length<novos.length)toast("Um post tem no máximo 10 fotos.");P.fotos.push(...cabe);P.rolo=(P.rolo||[]).concat(cabe);P.multi=P.fotos.length>1;edDesenha();
    if(P.cn&&P.cn.k==="rel"&&!P.cn.tit)setTimeout(()=>$("#cn102-tit")?.focus(),60)});
  try{inp.click()}catch(e){}}

/* ===== 5. painel do número ou gráfico ===== */
var CN102_DP=null;
function cn102Inds(){try{return (typeof indItens==="function"?indItens():[]).filter(x=>x&&x.id&&x.valor)}catch(e){return []}}
function cn102IndDado(x){const s=Array.isArray(x.serie)?x.serie.map(Number).filter(isFinite):[],r=Array.isArray(x.rotulos)?x.rotulos:[];const idx=cn102Amostra(s.map((_,i)=>i),30);
  return {tipo:"ind",tit:String(x.nome||"").slice(0,60),un:"",ind:String(x.id).slice(0,30),val:String(x.valor).slice(0,24),var:String(x.variacao||"").slice(0,16),dir:["sobe","desce","estavel"].includes(x.dir)?x.dir:"",dt:/^\d{4}-\d{2}-\d{2}$/.test(x.data||"")?x.data:"",s:idx.map(i=>+(+s[i]).toPrecision(6)),r:idx.map(i=>String(r[i]||"").slice(0,10))}}
function cn102DpDado(){const D=CN102_DP;if(!D)return null;if(D.aba==="ind"){const x=cn102Inds().find(y=>y.id===D.ind);return x?cn102IndDado(x):null}
  const pts=D.l.map(([r,v])=>[String(r||"").trim().slice(0,16),cn102Num(v)]).filter(([r,v])=>isFinite(v));if(pts.length<2)return null;
  return {tipo:D.tipo,tit:String(D.tit||"").trim().slice(0,60),un:String(D.un||"").trim().slice(0,12),s:pts.map(p=>p[1]),r:pts.map(p=>p[0])}}
function cn102DpAbre(destino){const ce=$("#layer .ce");if(!ce)return;$("#layer .ce-sel")?.remove();$("#layer .ce-fig")?.remove();const inds=cn102Inds(),P=ED&&ED.po,d0=destino==="post"&&P&&P.cn&&P.cn.d;
  CN102_DP={dest:destino,aba:d0?(d0.tipo==="ind"?"ind":"meu"):(inds.length?"ind":"meu"),ind:d0&&d0.tipo==="ind"?d0.ind:(inds[0]&&inds[0].id),tipo:d0&&d0.tipo!=="ind"?d0.tipo:"bar",tit:d0&&d0.tipo!=="ind"?d0.tit:"",un:d0&&d0.tipo!=="ind"?d0.un:"",
    l:d0&&d0.tipo!=="ind"?d0.s.map((v,i)=>[d0.r[i]||"",cn102Fmt(v,6)]):[["",""],["",""],["",""]]};
  const ov=document.createElement("div");ov.className="ce-sel cn102-dp";ov.innerHTML=`<div class="ce-selp" role="dialog" aria-label="Número ou gráfico"><b>${destino==="story"?"Indicador":"Número ou gráfico"}</b><div class="ce-abas2 cn102-dab" role="tablist"><button type="button" role="tab" data-cn102dab="ind">Indicador da edição</button><button type="button" role="tab" data-cn102dab="meu">Meus números</button></div><div class="cn102-dcorpo"></div>
    <div class="ce-selb"><button type="button" class="btn ghost" data-edselx>Cancelar</button><button type="button" class="btn" data-cn102dok>Usar</button></div></div>`;
  ce.appendChild(ov);cn102DpDesenha()}
function cn102DpDesenha(){const D=CN102_DP,ov=$("#layer .cn102-dp");if(!D||!ov)return;ov.querySelectorAll("[data-cn102dab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.cn102dab===D.aba)));const box=ov.querySelector(".cn102-dcorpo"),inds=cn102Inds();
  if(D.aba==="ind")box.innerHTML=inds.length?`<div class="cn102-inds" role="listbox">${inds.map(x=>`<button type="button" role="option" data-cn102ind="${esc(x.id)}" aria-selected="${x.id===D.ind}"><span>${esc(x.nome)}</span><b>${esc(x.valor)}</b>${x.variacao?`<em class="${esc(x.dir||"")}">${esc(x.variacao)}</em>`:""}</button>`).join("")}</div><p class="cn102-dica">Valores da edição de hoje${(()=>{const x=inds.find(y=>y.id===D.ind);return x&&x.data?` · dado de ${esc(cn102DiaCurto(x.data))}`:""})()}.</p>`
    :`<p class="cn102-dica">Os indicadores ainda não carregaram. Use “Meus números”.</p>`;
  else box.innerHTML=`<div class="cn102-tipo" role="radiogroup" aria-label="Tipo de gráfico"><button type="button" role="radio" data-cn102tipo="bar" aria-checked="${D.tipo==="bar"}">Barras</button><button type="button" role="radio" data-cn102tipo="lin" aria-checked="${D.tipo==="lin"}">Linha</button></div>
    <div class="cn102-dl"><input class="field" data-cn102dp="tit" maxlength="60" placeholder="Título do gráfico" value="${esc(D.tit)}"><input class="field cn102-un" data-cn102dp="un" maxlength="12" placeholder="Unidade" value="${esc(D.un)}"></div>
    <div class="cn102-linhas">${D.l.map(([r,v],i)=>`<div class="cn102-ln"><input class="field" data-cn102r="${i}" maxlength="16" placeholder="Rótulo ${i+1}" value="${esc(r)}"><input class="field" data-cn102v="${i}" inputmode="decimal" maxlength="16" placeholder="Valor" value="${esc(v)}"></div>`).join("")}</div>
    ${D.l.length<12?`<button type="button" class="cn102-chip" data-cn102lmais>${CN102_SVG(CN102_ICO.mais)}Linha</button>`:""}`;
  cn102DpPrev()}
function cn102DpPrev(){const ov=$("#layer .cn102-dp");if(!ov)return;let pv=ov.querySelector(".cn102-dpv");const d=cn102DpDado();if(!pv){pv=document.createElement("div");pv.className="cn102-dpv cn102-claro";ov.querySelector(".cn102-dcorpo").after(pv)}
  pv.innerHTML=d?cn102Svg(d):`<p class="cn102-dica">Preencha pelo menos dois valores para ver o gráfico.</p>`;ov.querySelector("[data-cn102dok]").disabled=!d}
document.addEventListener("input",e=>{const t=e.target,D=CN102_DP;if(!D||!t.closest||!t.closest("#layer .cn102-dp"))return;
  if(t.dataset.cn102dp)D[t.dataset.cn102dp]=t.value;else if(t.dataset.cn102r!=null)D.l[+t.dataset.cn102r][0]=t.value;else if(t.dataset.cn102v!=null)D.l[+t.dataset.cn102v][1]=t.value;cn102DpPrev()},true);
async function cn102DpOk(){const D=CN102_DP,d=cn102DpDado();if(!D||!d||!ED)return;$("#layer .cn102-dp")?.remove();CN102_DP=null;
  if(D.dest==="post"){ED.po.cn.d=d;edDesenha();return}
  /* story: figurinha de imagem (a mesma da Foto), só que com o cartão do dado */
  try{const c=await cn102DadoCanvas(d),b=await new Promise(ok=>c.toBlob(ok,"image/png"));if(!b||!ED)return;const {img,url}=await edImg(b);
    edAdd({t:"img",ft:1,forma:"rr",src:url,_img:img,ar:+(c.width/c.height).toFixed(3),y:.4,s:1.55,cnd:1});vibrar&&vibrar(8)}catch(e){toast("Não deu para criar o cartão.")}}
/* tocar no cartão do dado não troca o formato (é um cartão, não uma foto) */
{const _te=edToqueEl;edToqueEl=function(el){if(el&&el.t==="img"&&el.cnd)return;return _te.apply(this,arguments)}}

/* ===== 6. cliques ===== */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest||!ED||!$("#layer .ce")||t.closest("#layer2"))return;let b;const P=ED.po;
  const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  if(ED.env&&t.closest("[data-cn102k],[data-cn102ini],[data-cn102foto],[data-cn102tira],[data-cn102ed],[data-cn102dado],[data-cn102dsem],[data-cn102omais],[data-cn102otira],[data-cn102nst]")){pare();return}
  /* começos de conteúdo dentro do criador */
  if(b=t.closest("[data-cn102ini]")){pare();const k=b.dataset.cn102ini;P.cn=P.cn&&P.cn.k===k?P.cn:{...cn102Novo(k),...(P.cn?{tit:P.cn.tit,corpo:P.cn.corpo}:{})};P.passo="detalhes";cn102Sync();edDesenha();
    if(k==="nt"&&!P.pid)cn102ListaNt("data-edpnt");else if(k==="rel"&&!P.fotos.length)cn102EscolheFotos();else setTimeout(()=>$("#cn102-tit")?.focus(),60);return}
  if(b=t.closest("[data-cn102k]")){pare();const k=b.dataset.cn102k;if(P.cn.k===k)return;const ant=P.cn;P.cn={...cn102Novo(k),tit:ant.tit,corpo:ant.corpo,fu:ant.fu,d:ant.d,o:ant.o&&ant.o.some(Boolean)?ant.o:["",""]};if(k==="rel"&&!P.cn.q)P.cn.q=cn102Hoje();cn102Sync();edDesenha();if(k==="nt"&&!P.pid)cn102ListaNt("data-edpnt");return}
  /* notícia: a nossa lista (com a arte), com os mesmos atributos de antes */
  if(t.closest("[data-edsont]")&&!t.closest(".ce-sel")){pare();cn102ListaNt("data-edpnt");return}
  if(t.closest(".ce-fig [data-edfig=\"nt\"]")){pare();cn102ListaNt("data-edntsel");return}
  if(b=t.closest("[data-edpnt]")){if(ED.modo==="post"&&!P.cn&&!P.fotos.length)P.cn=cn102Novo("nt");setTimeout(()=>{if(ED&&ED.po&&ED.po.cn&&$("#ce-leg")&&!$("#layer .ce-sel"))try{$("#ce-leg").focus({preventScroll:true})}catch(_){}},80);return}
  if(t.closest("[data-edsotexto]")&&P.cn){P.texto=String(P.cn.corpo||"");P.cn=null;return}
  if((b=t.closest("[data-edvolta=\"fotos\"]"))&&P.cn&&!P.fotos.length&&!String(P.cn.tit||"").trim()&&!String(P.cn.corpo||"").trim()&&!P.cn.d){P.cn=null;P.pid=null;P.texto="";return}
  if(t.closest("[data-cn102foto]")){pare();cn102EscolheFotos();return}
  if(b=t.closest("[data-cn102tira]")){pare();const i=+b.dataset.cn102tira,f=P.fotos[i];P.fotos.splice(i,1);if(P.tags)P.tags=P.tags.filter(x=>edTagF(x)!==f);P.cur=Math.max(0,Math.min(P.cur,P.fotos.length-1));edDesenha();return}
  if(b=t.closest("[data-cn102ed]")){pare();P.cur=+b.dataset.cn102ed;P.passo="filtros";edDesenha();return}
  if(t.closest("[data-cn102dado]")){pare();cn102DpAbre("post");return}
  if(t.closest("[data-cn102dsem]")){pare();P.cn.d=null;edDesenha();return}
  if(t.closest("[data-cn102omais]")){pare();if(P.cn.o.length<4){P.cn.o.push("");edDesenha();setTimeout(()=>$(`#layer [data-cn102o="${P.cn.o.length-1}"]`)?.focus(),40)}return}
  if(b=t.closest("[data-cn102otira]")){pare();P.cn.o.splice(+b.dataset.cn102otira,1);cn102Sync();edDesenha();return}
  if(t.closest("[data-cn102nst]")){pare();cn102PostParaStory();return}
  /* painel do dado */
  if(b=t.closest("#layer .cn102-dp [data-cn102dab]")){pare();CN102_DP.aba=b.dataset.cn102dab;cn102DpDesenha();return}
  if(b=t.closest("#layer .cn102-dp [data-cn102ind]")){pare();CN102_DP.ind=b.dataset.cn102ind;cn102DpDesenha();return}
  if(b=t.closest("#layer .cn102-dp [data-cn102tipo]")){pare();CN102_DP.tipo=b.dataset.cn102tipo;cn102DpDesenha();return}
  if(t.closest("#layer .cn102-dp [data-cn102lmais]")){pare();CN102_DP.l.push(["",""]);cn102DpDesenha();setTimeout(()=>$(`#layer [data-cn102r="${CN102_DP.l.length-1}"]`)?.focus(),40);return}
  if(t.closest("#layer .cn102-dp [data-cn102dok]")){pare();cn102DpOk();return}
  if(t.closest("#layer .cn102-dp [data-edselx]")){CN102_DP=null;return}
  /* story */
  if(t.closest("[data-cn102stnt]")){pare();cn102ListaNt("data-cn102stsel");return}
  if(b=t.closest("[data-cn102stsel]")){pare();$("#layer .ce-sel")?.remove();cn102StoryComNt(b.dataset.cn102stsel);return}
  if(t.closest(".ce-fig [data-edfig=\"ind\"]")){pare();$("#layer .ce-fig")?.remove();cn102DpAbre("story");return}},true);

/* ===== 7. publicar: valida e grava o cn no estilo ===== */
function cn102Valida(P){const cn=P.cn;cn102Sync();
  if(cn.k==="nt"&&!P.pid)return "Escolha a notícia que você quer comentar.";
  if(cn.k==="rel"&&!String(cn.tit).trim())return "Dê um título curto ao relato.";
  if(cn.k==="ana"&&!String(cn.tit).trim()&&!String(cn.corpo).trim())return "Escreva a sua análise.";
  if(cn.k==="enq"){if(!String(cn.tit).trim())return "Escreva a pergunta.";if(cn.o.map(v=>String(v||"").trim()).filter(Boolean).length<2)return "A pergunta precisa de pelo menos duas opções."}
  return ""}
function cn102Grava(P){const cn=P.cn,o={v:1,k:cn.k};const t=String(cn.tit||"").trim().slice(0,120);if(t&&cn.k!=="nt")o.tit=t;
  const f=cn102Fonte(cn.fu);if(f&&cn.k!=="nt"&&cn.k!=="enq")o.fu=f.u||f.n;if(cn.k==="rel"&&cn.q)o.q=String(cn.q).slice(0,16);
  if(cn.k==="enq")o.o=cn.o.map(v=>String(v||"").trim().slice(0,40)).filter(Boolean).slice(0,4);if(cn.k==="ana"&&cn.d)o.d=cn.d;return o}
{const _pp=edPublicaPost;edPublicaPost=async function(){const P=ED&&ED.po;if(!P||!P.cn||ED.env||!SB)return _pp.apply(this,arguments);
  const er=cn102Valida(P);if(er){toast(er);return}const cn=cn102Grava(P);
  P.texto=cn102Texto(cn.k==="nt"?{tit:""}:P.cn,P.cn.corpo);if(!P.texto.trim()&&!P.pid&&!P.fotos.length){toast("Escreva algo antes de publicar.");return}
  const _from=SB.from;SB.from=function(tb){const q=_from.apply(this,arguments);if(tb==="publicacoes"&&q&&typeof q.insert==="function"&&!q._cn102){const ins=q.insert;q._cn102=1;q.insert=function(row){try{if(row&&row.tipo==="post"&&row.estilo&&typeof row.estilo==="object")row.estilo.cn=cn}catch(e){}return ins.apply(this,arguments)}}return q};
  try{return await _pp.apply(this,arguments)}finally{SB.from=_from}}}
/* rascunho: o cn fica guardado ao lado (por id do rascunho) */
const CN102_RK="prumo-cn102-rasc";
function cn102RLe(){try{return JSON.parse(localStorage.getItem(CN102_RK)||"{}")||{}}catch(e){return {}}}
{const _rs=rascSalva;rascSalva=async function(){const P=ED&&ED.po;if(P&&P.cn){if(!P.rid)P.rid=edNid();const m=cn102RLe();m[P.rid]={...P.cn,d:P.cn.d||null};try{const ks=Object.keys(m);if(ks.length>30)ks.slice(0,ks.length-30).forEach(k=>delete m[k]);localStorage.setItem(CN102_RK,JSON.stringify(m))}catch(e){}}return _rs.apply(this,arguments)}}
{const _ra=rascAbre;rascAbre=async function(id){const r=await _ra.apply(this,arguments);try{const c=cn102RLe()[id];if(c&&ED&&ED.po&&c.k){ED.po.cn={...cn102Novo(c.k),...c};ED.po.passo="detalhes";edDesenha()}}catch(e){}return r}}

/* ===== 8. no Feed ===== */
function cn102Kick(k,au){return {rel:`Relato de ${esc(nomeDe(au))}`,ana:`Opinião de ${esc(nomeDe(au))}`,enq:`Pergunta de ${esc(cn102Primeiro(au))}`,nt:"Notícia comentada"}[k]}
function cn102FonteHTML(fu){const f=cn102Fonte(fu);if(!f)return "";return f.u?`<a class="cn102-fonte" href="${esc(f.u)}" target="_blank" rel="noopener noreferrer nofollow ugc">Fonte: ${esc(f.n)} <span aria-hidden="true">↗</span></a>`:`<p class="cn102-fonte">Fonte: ${esc(f.n)}</p>`}
function cn102NtSlide(x){const p=pautaById(x.pid),sn=x.snap||{},sec=p?secOf(p):(sn.secao||"politica"),tit=p?versao(p,lente()).titulo:(sn.titulo||"Notícia");
  return `<div class="sl up-sl up-nt cn102-ntsl"><button type="button" class="up-ntc cn102-ntb" data-capmat="${esc(x.pid)}">${p?capaArte(p,"cn102-nta",1):""}<span class="cn102-ntt"><small style="color:${secCor(sec)}">${esc(secNome(sec))}${(p&&p.tag)||sn.tag?" · "+esc((p&&p.tag)||sn.tag):""}</small><b>${esc(tit)}</b><span class="cn102-ntp"><span>Ler a matéria ›</span><em class="cn102-via">via Prumo</em></span></span></button></div>`}
function cn102EnqKey(id){return "us:"+id+"#p"}
function cn102EnqHTML(x,cn){const key=cn102EnqKey(x.id),vs=votosDe(key),mv=meuVoto(key),eu=x.autor===S.uid,os=cn.o||[],cont=os.map((_,i)=>Object.values(vs).filter(v=>v===i).length),tot=cont.reduce((a,b)=>a+b,0),res=mv!=null||(eu&&tot>0);
  const ent=Object.entries(vs).filter(([,v])=>typeof v==="number"),nt=x.pid&&pautaById(x.pid);
  return `<div class="cn102-enq" data-cn102enq="${esc(x.id)}"><p class="cn102-k">${cn102Kick("enq",x.autor)}</p><b class="cn102-q">${esc(cn.tit||"Pergunta")}</b>
    <div class="cn102-eos">${os.map((o,i)=>{const pc=tot?Math.round(cont[i]/tot*100):0,quem=ent.filter(([,v])=>v===i).map(([u])=>u);return `<button type="button" class="cn102-eo${res?" res":""}${mv===i?" mine":""}" data-cn102voto="${i}" aria-pressed="${mv===i}"><i style="width:${res?pc:0}%"></i><span>${esc(o)}</span>${res?`<em>${pc}%</em>`:""}${res&&quem.length?`<small>${esc(quemVotou(quem))}</small>`:""}</button>`}).join("")}</div>
    <p class="cn102-et">${tot?`${tot} ${tot===1?"voto":"votos"}`:"Ninguém votou ainda"}${res||eu?"":" · vote para ver o resultado"}</p>
    ${nt?`<button type="button" class="cn102-sobre" data-capmat="${esc(x.pid)}">${CN102_SVG(CN102_ICO.nt)}<span>${esc(versao(nt,lente()).titulo)}</span><i>›</i></button>`:""}</div>`}
function cn102Ex(corpo){const c=String(corpo||"").trim();if(c.length<=CN102_CURTO)return c;const f=capaFrase(c,220);return (f.length<60?c.slice(0,220):f).replace(/\s+\S*$/,"")+"…"}
const CN102_CURTO=280;
function cn102CardHTML(x,cn,corpo){const ex=cn102Ex(corpo);
  if(cn.k==="ana")return `<div class="sl up-sl cn102-sl cn102-ana"><div class="cn102-cd"><p class="cn102-k">${cn102Kick("ana",x.autor)}</p>${cn.tit?`<h3>${esc(cn.tit)}</h3>`:""}${ex?`<p class="cn102-ex">${dmMarcaPub(ex)}</p>`:""}${cn.d&&!ex?`<div class="cn102-dmini">${cn102Svg(cn.d)}</div>`:""}<span class="cn102-ass">${avatar(x.autor)}<b>${esc(nomeDe(x.autor))}</b></span></div></div>`;
  if(cn.k==="rel"){const es=x.estilo||{};return `<div class="sl up-sl cn102-sl cn102-rel"><div class="cn102-cd"><p class="cn102-k">${cn102Kick("rel",x.autor)}</p><h3>${esc(cn.tit||"Relato")}</h3><p class="cn102-meta">${es.local?`<span>${CN102_SVG(CN102_ICO.rel)}${esc(es.local)}</span>`:""}${cn.q?`<span>${CN102_SVG('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>')}${esc(cn102Quando(cn.q))}</span>`:""}</p>${ex?`<p class="cn102-ex">${dmMarcaPub(ex)}</p>`:""}<p class="cn102-nchk">Relato pessoal, não checado pela redação do Prumo</p></div></div>`}
  if(cn.k==="enq")return `<div class="sl up-sl cn102-sl cn102-enqsl">${cn102EnqHTML(x,cn)}</div>`;return ""}
function cn102Leg(x,cn,corpo){const es=x.estilo||{};let h="";
  if(cn.k==="rel"&&x.fotos.length){h+=`<p class="cn102-lt"><b>${esc(cn.tit||"Relato")}</b></p>`;const m=[es.local,cn.q?cn102Quando(cn.q):""].filter(Boolean);h+=`<p class="cn102-lm">${m.length?esc(m.join(" · "))+" · ":""}<span>relato pessoal, não checado pela redação</span></p>`}
  return h}
{const _pp=pubPostHTML;pubPostHTML=function(x){try{if(x)pubLimpa(x)}catch(e){return ""}const cn=x&&x.tipo==="post"?cn102De(x):null;
  if(!cn){let h=_pp.apply(this,arguments);if(h&&x&&x.pid&&!(x.fotos||[]).length)try{h=cn102TrocaNt(h,x)}catch(e){}return h}
  const corpo=cn102Corpo(x,cn),y=Object.assign(Object.create(Object.getPrototypeOf(x)),x,{texto:corpo});let h=_pp.call(this,y);if(!h)return h;
  try{const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)return h;a.classList.add("cn102-post","cn102-"+cn.k);a.dataset.cn102k=cn.k;
    /* rótulo no cabeçalho */
    const sub=cn.k!=="nt"&&a.querySelector(".ph-sub");if(sub)sub.insertAdjacentHTML("afterbegin",`<span class="cn102-lb cn102-lb-${cn.k}">${esc({rel:"Relato",ana:"Opinião",enq:"Pergunta",nt:"Comentário"}[cn.k])}</span>`);
    const tr=a.querySelector(".car .track");
    if(tr){const tx=tr.querySelector(".up-tx");if(tx)tx.remove();const ntsl=tr.querySelector(".up-nt");
      if(cn.k==="enq"&&ntsl)ntsl.remove();if(ntsl&&cn.k!=="enq")ntsl.outerHTML=cn102NtSlide(x);
      const card=cn102CardHTML(x,cn,corpo);const fotos=!!tr.querySelector(".up-img,.up-sem,.up-vid");
      if(card&&!(cn.k==="rel"&&fotos))tr.insertAdjacentHTML("afterbegin",card);
      if(cn.k==="ana"&&cn.d&&String(corpo).trim())tr.children[0].insertAdjacentHTML("afterend",`<div class="sl up-sl cn102-sl cn102-dsl"><div class="cn102-cd">${cn102Svg(cn.d)}${cn.d.tipo==="ind"?`<p class="cn102-dfo">Indicador da edição do Prumo</p>`:cn.fu?`<p class="cn102-dfo">${esc("Fonte: "+((cn102Fonte(cn.fu)||{}).n||""))}</p>`:`<p class="cn102-dfo">Números informados por ${esc(cn102Primeiro(x.autor))}</p>`}</div></div>`);
      /* pontinhos e contador com o novo número de slides */
      const n=tr.children.length,dots=a.querySelector(".pdots");if(dots){if(n>1)dots.outerHTML=`<div class="prog pdots" aria-hidden="true">${[...Array(n)].map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${n}</span></div>`;else dots.remove()}
      else if(n>1){const sp=a.querySelector(".acts .sp");if(sp)sp.insertAdjacentHTML("afterend",`<div class="prog pdots" aria-hidden="true">${[...Array(n)].map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${n}</span></div>`)}
      const pg=a.querySelector(".vp99-pg");if(pg){if(n>1)pg.textContent="1/"+n;else pg.remove()}else if(n>1){const car=a.querySelector(".car");car.classList.add("vp99-car");car.insertAdjacentHTML("afterbegin",`<span class="vp99-pg" aria-hidden="true">1/${n}</span>`)}}
    /* legenda: título e local/hora do relato com foto; o corpo inteiro da análise e do relato sem foto; fonte */
    let leg=a.querySelector(".up-leg");const lk=a.querySelector("[data-likes]");
    if(!leg&&String(corpo).trim().length>CN102_CURTO&&cn.k!=="enq"&&lk){lk.insertAdjacentHTML("afterend",`<p class="up-leg${corpo.length>160||/\n.*\n/.test(corpo)?" up-curta\" data-upmais role=\"button\" tabindex=\"0":""}"><b>${esc(nomeDe(x.autor))}</b> ${dmMarcaPub(corpo)}</p>`);leg=a.querySelector(".up-leg")}
    if(!leg&&cn.k==="enq"&&String(corpo).trim()&&lk){lk.insertAdjacentHTML("afterend",`<p class="up-leg"><b>${esc(nomeDe(x.autor))}</b> ${dmMarcaPub(corpo)}</p>`);leg=a.querySelector(".up-leg")}
    const extra=cn102Leg(x,cn,corpo);if(extra){if(leg)leg.insertAdjacentHTML("beforebegin",extra);else if(lk)lk.insertAdjacentHTML("afterend",extra)}
    const fo=cn.k==="rel"||cn.k==="ana"?cn102FonteHTML(cn.fu):"";if(fo){const ref=leg||a.querySelector(".cn102-lm,.cn102-lt")||lk;if(ref)ref.insertAdjacentHTML("afterend",fo)}
    return a.outerHTML}catch(e){return h}}}
/* post antigo com notícia e sem foto: o cartão novo da notícia (com a arte, crédito e "via Prumo") */
function cn102TrocaNt(h,x){const i=h.indexOf('<div class="sl up-sl up-nt">');if(i<0)return h;const z=h.indexOf("</button></div>",i);if(z<0)return h;return h.slice(0,i)+cn102NtSlide(x)+h.slice(z+15)}
/* votar na pergunta */
async function cn102Vota(id,i){const key=cn102EnqKey(id),x=pubDe(id);if(!x)return;if(x.autor===S.uid){toast("Seus amigos votam; você vê o resultado.");return}const v=meuVoto(key)===i?null:i;
  vibrar&&vibrar(8);const p=votarValor(key,v);cn102EnqRedesenha(id);await p;cn102EnqRedesenha(id)}
function cn102EnqRedesenha(id){const x=pubDe(id),cn=x&&cn102De(x);if(!cn||cn.k!=="enq")return;document.querySelectorAll(`.cn102-enq[data-cn102enq="${CSS.escape(String(id))}"]`).forEach(el=>{el.outerHTML=cn102EnqHTML(x,cn)})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".cn102-enq [data-cn102voto]");if(!b)return;e.stopPropagation();e.preventDefault();if(precisaConta())return;cn102Vota(b.closest("[data-cn102enq]").dataset.cn102enq,+b.dataset.cn102voto)},true);
{const _us=updateSocial;updateSocial=function(pid){const r=_us.apply(this,arguments);try{const m=/^u:(.+)$/.exec(String(pid||""));if(m&&document.querySelector(`.cn102-enq[data-cn102enq="${CSS.escape(m[1])}"]`))cn102EnqRedesenha(m[1])}catch(e){}return r}}

/* ===== 9. notícia da edição: do "Enviar" direto para post ou story ===== */
function cn102StoryComNt(pid,tx){const p=pautaById(pid);if(!p||!ED||ED.modo!=="story")return;const st=ED.st;if(st.bg.tipo!=="foto"&&st.bg.tipo!=="video")st.bg={tipo:"grad",g:5};ED.tela="edit";camDesliga&&camDesliga();
  if(tx){st.els.push({id:edNid(),t:"texto",tx:String(tx).slice(0,220),f:"moderno",cor:"#ffffff",al:"c",fd:0,x:.5,y:.2,s:.85,r:0})}
  edDesenha();edAdd({t:"nt",pid,tit:versao(p,lente()).titulo,y:tx?.52:.45,s:1.15});vibrar&&vibrar(6)}
function cn102StoryNt(pid,tx){if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}if($("#layer").innerHTML)closeLayer();uso("noticia_no_story");
  setTimeout(()=>{criarAbrir("story");let n=0;(function w(){if(ED&&ED.modo==="story"&&$("#layer .ce")){cn102StoryComNt(pid,tx);return}if(n++<60)setTimeout(w,50)})()},60)}
function cn102PostParaStory(){const P=ED&&ED.po;if(!P||!P.pid)return;const pid=P.pid,tx=String(P.cn&&P.cn.corpo||"").trim();ED=null;closeLayer._ok=true;closeLayer();closeLayer._ok=false;cn102StoryNt(pid,tx)}
{const _os=openSend;openSend=function(pid){const r=_os.apply(this,arguments);try{if(pid&&String(pid).indexOf("u:")!==0&&pautaById(pid)&&S.membro&&PUB.on!==false){const b=document.querySelector("#layer .sheet .sh-b,#layer2 .sheet .sh-b");
    if(b&&!b.querySelector(".cn102-env"))b.insertAdjacentHTML("afterbegin",`<div class="cn102-env"><button type="button" data-cn102envp="${esc(pid)}">${CN102_SVG(CN102_ICO.ana)}<span><b>Publicar com comentário</b><small>No seu perfil e no Feed</small></span></button><button type="button" data-cn102envs="${esc(pid)}">${CN102_SVG(CN102_ICO.story)}<span><b>No seu story</b><small>Some em 24 horas</small></span></button></div>`)}}catch(e){}return r}}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
  if(b=t.closest("[data-cn102envp]")){e.stopPropagation();e.preventDefault();const pid=b.dataset.cn102envp;closeLayer();setTimeout(()=>cn102Comeca("nt",{pid}),$("#layer .story")?280:60);return}
  if(b=t.closest("[data-cn102envs]")){e.stopPropagation();e.preventDefault();const pid=b.dataset.cn102envs;closeLayer();setTimeout(()=>cn102StoryNt(pid),60);return}},true);

/* ===== 10. story: "Notícia" na câmera e bandeja com o que é de notícia primeiro ===== */
{const _ct=edCamTela;edCamTela=function(el){const r=_ct.apply(this,arguments);try{const rail=el.querySelector(".ce-rail"),c=rail&&rail.querySelector("[data-edcriar]");
  if(c&&!rail.querySelector("[data-cn102stnt]"))c.insertAdjacentHTML("afterend",`<button type="button" data-cn102stnt>${CN102_SVG(CN102_ICO.nt)}<span>Notícia</span></button>`)}catch(e){}return r}}
const CN102_TRAY=[["Notícia e contexto",["nt","link","local","hora","ind","enq","perg","quiz"]],["Pessoas e diversão",["men","slid","cont","add","hash","foto","selfie"]]];
{const _fg=edFigs;edFigs=function(){const r=_fg.apply(this,arguments);try{const box=$("#layer .ce-fig .fg2-chips");if(!box||box.querySelector(".cn102-fh"))return r;
  const reel=ED&&ED.modo==="reel";if(!reel&&!box.querySelector('[data-edfig="ind"]')){const nt=box.querySelector('[data-edfig="nt"]');const h=`<button type="button" data-edfig="ind" class="fg2-c fg2-k-ind" data-busca="${esc(norm("Indicador numero grafico dolar selic ipca inflacao juros economia dado"))}">${FG2_I(CN102_ICO.ind)}<span>Indicador</span></button>`;if(nt)nt.insertAdjacentHTML("afterend",h);else box.insertAdjacentHTML("beforeend",h)}
  const lk=box.querySelector('[data-edfig="link"] span');if(lk)lk.textContent="Fonte / link";const lb=box.querySelector('[data-edfig="link"]');if(lb)lb.dataset.busca+=" fonte origem materia";
  const nb=box.querySelector('[data-edfig="nt"]');if(nb)nb.classList.add("cn102-fnt");
  const usados=new Set();CN102_TRAY.forEach(([tit,ks])=>{const bs=ks.map(k=>box.querySelector(`[data-edfig="${k}"]`)).filter(Boolean);if(!bs.length)return;const hd=document.createElement("p");hd.className="cn102-fh";hd.textContent=tit;box.appendChild(hd);bs.forEach(b=>{box.appendChild(b);usados.add(b)})});
  [...box.querySelectorAll("[data-edfig]")].filter(b=>!usados.has(b)).forEach(b=>box.appendChild(b));
  const q=$("#ce-figq");if(q)q.addEventListener("input",()=>{const v=!!q.value.trim();box.querySelectorAll(".cn102-fh").forEach(h=>h.hidden=v)})}catch(e){}return r}}

/* ===== 11. no Feed, uma linha para publicar conteúdo (sem abrir a galeria) ===== */
function cn102Barra(){const s=$("#secs");if(!s)return;let b=$("#cn102-bar");const pode=!!(S.uid&&S.membro&&PUB.on===true);
  if(!b){if(!pode)return;b=document.createElement("div");b.id="cn102-bar";b.className="cn102-bar gut";s.after(b)}
  b.hidden=!pode;if(!pode)return;const k=S.uid+"|"+nomeDe(S.uid);if(b.dataset.k===k)return;b.dataset.k=k;
  b.innerHTML=`${avatar(S.uid)}<button type="button" class="cn102-barb" data-cn102bar>Comente uma notícia ou conte o que viu…</button>`}
function cn102AbreInicio(k){if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}if(k){cn102Comeca(k);return}
  if($("#layer").innerHTML)closeLayer();CN102_SEMGAL=1;try{criarAbrir("post")}finally{CN102_SEMGAL=0}}
{const _rs=renderSecs;renderSecs=function(){const r=_rs.apply(this,arguments);try{cn102Barra()}catch(e){}return r}}
{const _pc=pubCarregar;pubCarregar=async function(){const r=await _pc.apply(this,arguments);try{cn102Barra()}catch(e){}return r}}
setInterval(()=>{try{const b=$("#cn102-bar");if(b||(S.uid&&S.membro&&PUB.on===true))cn102Barra()}catch(e){}},1500);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-cn102bar]");if(!b)return;e.stopPropagation();e.preventDefault();if(typeof PQ!=="undefined"&&PQ.atual){toast("Espere terminar de publicar.");return}cn102AbreInicio(b.dataset.cn102bar||"")},true);

/* ===== 12. editar a legenda de um post com título: edita só o texto, o título fica ===== */
var CN102_EDC=null;
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-ueditar]");if(!b)return;const x=pubDe(b.dataset.ueditar),cn=x&&cn102De(x);CN102_EDC=null;
  if(!cn||!cn.tit||String(x.texto||"").indexOf(cn.tit)!==0)return;const id=x.id;
  setTimeout(()=>{const t=$("#ed-leg");if(!t)return;CN102_EDC=id;t.value=cn102Corpo(x,cn);t.insertAdjacentHTML("beforebegin",`<p class="hint cn102-edt">${esc(cn.k==="enq"?"Pergunta":"Título")}: <b>${esc(cn.tit)}</b></p>`)},140)},true);
{const _pe=pubEditar;pubEditar=function(id,txt){const x=pubDe(id),cn=x&&cn102De(x);if(CN102_EDC===id&&cn&&cn.tit){CN102_EDC=null;txt=cn102Texto(cn,txt)}return _pe.call(this,id,txt)}}
/* o "+" abre direto em "O que você quer publicar?" (a galeria fica a um toque, em "Escolher fotos") */
cfpAbreGaleria=function(){};
