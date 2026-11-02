/* ---------- Etapa 14 ---------- */
/* gráfico dentro da notícia: visual {tipo:"grafico", forma:"barras"|"colunas"|"linha", titulo, unidade?, casas?, fonte, nota?, itens:[{rotulo, valor, destaque?}]} */
function gnNum(v,u,c){const n=grNum(v,c);u=typeof u==="string"?u.trim():"";if(!u)return n;if(u==="%")return n+"%";if(/^R\$/.test(u)){const r=u.slice(2).trim();return "R$ "+n+(r?" "+r:"")}if(/^US\$/.test(u)){const r=u.slice(3).trim();return "US$ "+n+(r?" "+r:"")}return n+" "+u}
function graficoNoticia(v){const its=(Array.isArray(v.itens)?v.itens:[]).filter(i=>i&&typeof i.rotulo==="string"&&isFinite(Number(i.valor))).map(i=>({r:i.rotulo,v:Number(i.valor),on:!!i.destaque}));if(its.length<2)return "";
  const u=v.unidade||"",c=Number.isInteger(v.casas)?Math.max(0,Math.min(2,v.casas)):(its.every(i=>Number.isInteger(i.v))?0:1);const forma=["barras","colunas","linha"].includes(v.forma)?v.forma:"barras";
  const un=u&&u!=="%"&&forma!=="barras"?` <em class="gn-u">em ${esc(u)}</em>`:"";const cab=`<span class="lbl">${esc(v.titulo||"Em gráfico")}${un}</span>`,pe=`${v.nota?`<p class="gn-nota">${esc(v.nota)}</p>`:""}${v.fonte?`<p class="hint">Fonte: ${esc(v.fonte)}</p>`:""}`;
  if(forma==="barras"){const mx=Math.max(...its.map(i=>Math.abs(i.v)))||1;const neg=its.some(i=>i.v<0);
    return `<div class="gn">${cab}<ul class="gn-b">${its.slice(0,12).map(i=>`<li class="${i.on?"on":""}${i.v<0?" neg":""}"><span class="gn-r">${esc(i.r)}</span><span class="gn-t"><i style="width:${Math.max(1.5,Math.abs(i.v)*100/mx).toFixed(1)}%"></i><b>${esc(gnNum(i.v,u,c))}</b></span></li>`).join("")}</ul>${neg?`<p class="hint">Barras claras: valores negativos.</p>`:""}${pe}</div>`}
  const W=320,H=forma==="linha"?170:180,pl=8,pr=8,pt=24,pb=24,cw=W-pl-pr,ch=H-pt-pb;const vs=its.map(i=>i.v);let mn=Math.min(0,...vs),mx=Math.max(0,...vs);
  if(forma==="linha"){mn=Math.min(...vs);mx=Math.max(...vs);const pd=(mx-mn||Math.abs(mx)||1)*.15;mn-=pd;mx+=pd}if(mx-mn<1e-9)mx=mn+1;
  const Y=x=>pt+(mx-x)*ch/(mx-mn);let h=`<svg class="gn-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(v.titulo||"Gráfico")}">`;
  if(forma==="colunas"){const n=Math.min(its.length,14),bw=Math.min(28,cw/n*.62),z=Y(0);
    h+=`<line x1="${pl}" x2="${W-pr}" y1="${z.toFixed(1)}" y2="${z.toFixed(1)}" class="gr-base"/>`;
    its.slice(0,14).forEach((i,k)=>{const cx=pl+cw*(k+.5)/n,y=Y(i.v),top=Math.min(y,z),hh=Math.max(1.5,Math.abs(z-y));
      h+=`<path d="${gnCol(cx-bw/2,top,bw,hh,i.v>=0)}" class="gn-c${i.on?" on":""}${i.v<0?" neg":""}"/><text x="${cx.toFixed(1)}" y="${(i.v>=0?top-6:top+hh+13).toFixed(1)}" text-anchor="middle" class="gn-v">${esc(gnNum(i.v,u==="%"?"%":"",c))}</text><text x="${cx.toFixed(1)}" y="${H-6}" text-anchor="middle" class="gr-xl">${esc(i.r.slice(0,10))}</text>`});
}
  else{const X=k=>pl+(its.length<2?cw:k*cw/(its.length-1));const pts=its.map((i,k)=>X(k).toFixed(1)+","+Y(i.v).toFixed(1));const g="gng"+(++GR.n);const base=(pt+ch).toFixed(1);
    h+=`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.2"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient></defs><line x1="${pl}" x2="${W-pr}" y1="${base}" y2="${base}" class="gr-base"/><path d="M${X(0).toFixed(1)},${base} L${pts.join(" L")} L${X(its.length-1).toFixed(1)},${base} Z" style="fill:url(#${g})"/><polyline points="${pts.join(" ")}" class="gr-ln"/>`;
    const mark=new Set([0,its.length-1]);let imx=0,imn=0;its.forEach((i,k)=>{if(i.v>its[imx].v)imx=k;if(i.v<its[imn].v)imn=k});mark.add(imx);mark.add(imn);its.forEach((i,k)=>{if(i.on)mark.add(k)});
    [...mark].forEach(k=>{const x=X(k),y=Y(its[k].v),anc=k===0?"start":k===its.length-1?"end":"middle";h+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="gr-dot"/><text x="${x.toFixed(1)}" y="${(y-9).toFixed(1)}" text-anchor="${anc}" class="gn-v" dy="${k===imn&&k!==imx&&k!==0&&k!==its.length-1?24:0}">${esc(gnNum(its[k].v,u==="%"?"%":"",c))}</text>`});
    const xs=[0,Math.round((its.length-1)/2),its.length-1].filter((k,i,a)=>a.indexOf(k)===i);xs.forEach((k,i)=>h+=`<text x="${X(k).toFixed(1)}" y="${H-6}" text-anchor="${k===0?"start":k===its.length-1?"end":"middle"}" class="gr-xl">${esc(its[k].r.slice(0,12))}</text>`);
}
  return `<div class="gn">${cab}${h}</svg>${pe}</div>`}
function gnCol(x,y,w,h,cima){const r=Math.min(4,w/2,h);return cima?`M${x.toFixed(1)},${(y+h).toFixed(1)} V${(y+r).toFixed(1)} Q${x.toFixed(1)},${y.toFixed(1)} ${(x+r).toFixed(1)},${y.toFixed(1)} H${(x+w-r).toFixed(1)} Q${(x+w).toFixed(1)},${y.toFixed(1)} ${(x+w).toFixed(1)},${(y+r).toFixed(1)} V${(y+h).toFixed(1)} Z`:`M${x.toFixed(1)},${y.toFixed(1)} V${(y+h-r).toFixed(1)} Q${x.toFixed(1)},${(y+h).toFixed(1)} ${(x+r).toFixed(1)},${(y+h).toFixed(1)} H${(x+w-r).toFixed(1)} Q${(x+w).toFixed(1)},${(y+h).toFixed(1)} ${(x+w).toFixed(1)},${(y+h-r).toFixed(1)} V${y.toFixed(1)} Z`}
function matVisuais(p){return (Array.isArray(p.visuais)?p.visuais:[]).filter(v=>v&&["grafico","numeros","pesquisas"].includes(v.tipo)).map(v=>{let x="";try{x=visualHTML({...v,secao:secOf(p)})}catch(e){}return x?`<div class="mat-vis">${x}</div>`:""}).join("")}
function matTempo(p){const vt=(Array.isArray(p.visuais)?p.visuais:[]).find(v=>v&&v.tipo==="linha_do_tempo"&&Array.isArray(v.itens)&&v.itens.length>=2);let its=[],tit="Como a história andou";
  if(vt){tit=vt.titulo||tit;its=vt.itens.filter(i=>i&&i.texto).map(i=>({q:String(i.quando||""),t:String(i.texto)}))}
  else{const ts=(Array.isArray(p.titulos)?p.titulos:[]).filter(x=>x&&x.titulo&&x.hora);if(ts.length>=3&&tms(ts[ts.length-1].hora)-tms(ts[0].hora)>36*3600e3)its=ts.map(x=>({q:dataCurta(String(x.hora).slice(0,10)),t:x.titulo}))}
  if(its.length<2)return "";return `<div class="mat-tl"><b>${esc(tit)}</b><ol>${its.slice(-7).map((i,k,a)=>`<li${k===a.length-1?' class="ult"':""}><time>${esc(i.q)}</time><span>${esc(i.t)}</span></li>`).join("")}</ol></div>`}
/* próxima matéria, na ordem da Capa (pula as já lidas quando dá) */
var MAT_ORIG=null;
function capaOrdemIds(){const ids=[...document.querySelectorAll("#v-capa .cpi[id^='cpi-']")].map(e=>e.id.slice(4));if(ids.length)return [...new Set(ids)];try{return capaEscolha().ord.map(p=>p.id)}catch(e){return []}}
function matProx(pid){const ids=capaOrdemIds(),i=ids.indexOf(pid);const rest=ids.slice(i+1).concat(i>=0?ids.slice(0,i):[]).map(pautaById).filter(Boolean);return rest.find(p=>!lidaAtual(p))||(i>=0?pautaById(ids[i+1]):null)||null}
function matIr(pid){if(!pautaById(pid))return;if(!MAT_ORIG)MAT_ORIG=MAT_PID;abrirMateria(pid);const m=document.querySelector("#layer .mat");if(m){m.scrollTop=0;m.classList.remove("mat-in");void m.offsetWidth;m.classList.add("mat-in")}}
(function(){const ant=closeLayer;closeLayer=function(){const pid=MAT_PID,orig=MAT_ORIG,eraMat=!!document.querySelector("#layer .mat")&&!(($("#layer2")||{}).innerHTML);const r=ant.apply(this,arguments);
  if(eraMat){MAT_ORIG=null;if(orig&&pid&&pid!==orig&&VIEW==="capa"){const f=()=>{const el=document.getElementById("cpi-"+pid);if(el)window.scrollTo(0,scrollY+el.getBoundingClientRect().top-innerHeight*.28)};f();requestAnimationFrame(f);setTimeout(f,150)}}return r}})();
(function(){let x0=null,y0=0,t0=0,eixo=null,m=null,dx=0;
  document.addEventListener("touchstart",e=>{const mm=e.target&&e.target.closest&&e.target.closest("#layer .mat"),l2=$("#layer2");if(!mm||e.touches.length>1||(l2&&l2.innerHTML)||e.target.closest(".gr-box,.gn,input,textarea")){x0=null;return}m=mm;x0=e.touches[0].clientX;y0=e.touches[0].clientY;t0=Date.now();eixo=null;dx=0},{passive:true});
  document.addEventListener("touchmove",e=>{if(x0==null||!m)return;const t=e.touches[0],ddx=t.clientX-x0,ddy=t.clientY-y0;
    if(!eixo){if(Math.abs(ddx)<10&&Math.abs(ddy)<10)return;eixo=Math.abs(ddx)>Math.abs(ddy)*1.2?"x":"y";if(eixo==="x")m.style.transition="none"}
    if(eixo!=="x")return;dx=ddx;const prox=!!m.querySelector("[data-matprox]");m.style.transform=`translateX(${(dx>0?dx:dx*(prox?.35:.12)).toFixed(1)}px)`},{passive:true});
  document.addEventListener("touchend",()=>{if(x0==null||!m)return;const mm=m,rap=Date.now()-t0<300;x0=null;m=null;
    if(eixo!=="x"){mm.style.transform="";return}
    if(dx>Math.min(110,innerWidth*.28)||(rap&&dx>50)){if(ANIM_OK()){mm.style.transition="transform .2s cubic-bezier(.3,.7,.4,1)";mm.style.transform="translateX(100%)";MAT_ARRASTO=true;setTimeout(()=>{if($("#layer .mat")&&HST>0)history.back();else MAT_ARRASTO=false},190)}else{mm.style.transform="";history.back()}return}
    if(dx<-70||(rap&&dx<-40)){const b=mm.querySelector("[data-matprox]");mm.style.transition="";mm.style.transform="";if(b){matIr(b.dataset.matprox);return}}
    mm.style.transition="transform .22s cubic-bezier(.2,.8,.2,1)";mm.style.transform="";setTimeout(()=>{mm.style.transition=""},240)},{passive:true});
  document.addEventListener("touchcancel",()=>{if(m){m.style.transition="transform .2s";m.style.transform=""}x0=null;m=null},{passive:true})})();
/* desde a sua última visita, na Capa */
var CPV=new Set(),CPV_OBS=null,SAIU_EM=0;
function capaNovas(){if(!FEED)return [];return (FEED.pautas||[]).filter(p=>(NOVAS.has(p.id)||ATUALIZADAS.has(p.id))&&!lidaAtual(p))}
function cpNovo(p){if(lidaAtual(p))return "";if(NOVAS.has(p.id))return `<em class="cp-nv">Novo</em>`;if(ATUALIZADAS.has(p.id))return `<em class="cp-nv up">Atualizado</em>`;return ""}
function capaNovBar(){const l=capaNovas();if(!l.length)return "";const n=l.length;
  return `<button type="button" class="cp-nov" data-cpnov><span class="nb-d"></span><span class="cp-nov-t"><b>${n} ${n===1?"novidade":"novidades"}</b> desde a sua última visita${VISITA0&&hhmm(VISITA0)?` <span>(${esc(diaHora(VISITA0))})</span>`:""}</span><span class="chev" aria-hidden="true">›</span></button>`}
function abrirNovCapa(){const l=capaNovas();const L=lente();
  sheet("Desde a sua última visita",`${VISITA0?`<p class="hint" style="margin:0">Sua última visita foi ${esc(diaHora(VISITA0))}.</p>`:""}${l.length?"":`<p class="hint">Você já viu todas as novidades.</p>`}<ul class="ult">${l.map(p=>`<li><button type="button" data-cpnovir="${esc(p.id)}"><span class="u-t"><b style="color:${secCor(secOf(p))}">${NOVAS.has(p.id)?"Nova":"Atualizada"}</b> · ${esc(secNome(secOf(p)))}</span><span class="u-x">${esc(versao(p,L).titulo||"")}</span></button></li>`).join("")}</ul>`)}
function capaObservar(){if(!("IntersectionObserver" in window))return;if(CPV_OBS)CPV_OBS.disconnect();const tm=new Map();
  CPV_OBS=new IntersectionObserver(es=>es.forEach(en=>{const id=en.target.id.slice(4);if(en.isIntersecting){tm.set(id,setTimeout(()=>CPV.add(id),1200))}else{clearTimeout(tm.get(id));tm.delete(id)}}),{threshold:.6});
  document.querySelectorAll("#v-capa .cpi[id^='cpi-']").forEach(el=>CPV_OBS.observe(el))}
document.addEventListener("visibilitychange",()=>{if(!FEED)return;if(document.hidden){SAIU_EM=Date.now();try{registrarConhecidas()}catch(e){}}
  else if(SAIU_EM&&Date.now()-SAIU_EM>15*60e3){SAIU_EM=0;VISITA0=PREF.visitaAtual||VISITA0;try{calcularNovidades();if(!$("#layer").innerHTML){if(VIEW==="capa")renderCapa();else if(VIEW==="feed")renderFeed()}}catch(e){}}});
/* Capa em 2 colunas em tela larga */
var LARGO_MQ=window.matchMedia?matchMedia("(min-width:1024px)"):null;
function appLargo(){const a=$(".app");if(a)a.classList.toggle("largo",!!(LARGO_MQ&&LARGO_MQ.matches&&VIEW==="capa"))}
function capaLargo(){appLargo();const cp=document.querySelector("#v-capa .cp");if(!cp||!LARGO_MQ||!LARGO_MQ.matches)return;
  const main=document.createElement("div"),side=document.createElement("aside");main.className="cp-main";side.className="cp-side";
  const LADO=new Set(["Para acompanhar","Últimas","Agenda"]);let mover=false;
  [...cp.children].forEach(el=>{if(el.classList.contains("cp-top"))return;
    if(el.classList.contains("cp-h")){const t=(el.querySelector("h3")||{}).textContent||"";mover=LADO.has(t.trim())}
    else if(!(el.matches("ul.cp-l")&&mover))mover=false;
    const lado=mover||el.classList.contains("cp-1m")||el.classList.contains("cp-ind")||el.classList.contains("cp-int");
    (lado?side:main).appendChild(el)});
  const fim=main.querySelector(".cp-fim");if(fim)main.appendChild(fim);
  cp.appendChild(main);cp.appendChild(side);cp.classList.add("cp2")}
(function(){const ant=renderCapa;renderCapa=function(){const r=ant.apply(this,arguments);try{capaLargo();capaObservar()}catch(e){}return r}})();
(function(){const ant=go;go=function(){const r=ant.apply(this,arguments);try{appLargo()}catch(e){}return r}})();
if(LARGO_MQ){const f=()=>{try{if(FEED)renderCapa();appLargo()}catch(e){}};if(LARGO_MQ.addEventListener)LARGO_MQ.addEventListener("change",f);else if(LARGO_MQ.addListener)LARGO_MQ.addListener(f)}

