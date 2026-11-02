/* ---------- Etapa 44: Agenda em story, animações e topo sem faixas ---------- */
/* círculos sempre na mesma ordem (o visto fica cinza, não vai para o fim) */
secsStory=function(){return SECS().filter(s=>pautasDa(s.id).length)};
/* Agenda: um dia por tela (até 5 compromissos por tela) */
var AG_VISTOS=new Set((()=>{try{return JSON.parse(localStorage.getItem("prumo-ag-vistos")||"[]")}catch(e){return []}})());
function agPaginas(){let r;try{r=igAgendaItens()}catch(e){return []}const dias={};[...r.H,...r.P].forEach(a=>{(dias[a._d]=dias[a._d]||[]).push(a)});
  const out=[];Object.keys(dias).sort().slice(0,7).forEach(d=>{const ev=dias[d];for(let k=0;k<ev.length;k+=5)out.push({id:"ag|"+d+"|"+k,d,ev:ev.slice(k,k+5),parte:k/5,partes:Math.ceil(ev.length/5),chave:d+"|"+ev.map(a=>a.texto).join("|").slice(0,120)})});return out}
function agDiaNome(d){const hoje=hojeSP();if(d===hoje)return "Hoje";if(d===somaDias(hoje,1))return "Amanhã";const x=new Date(d+"T12:00:00Z");const w=x.toLocaleDateString("pt-BR",{weekday:"long",timeZone:"UTC"});return w.charAt(0).toUpperCase()+w.slice(1)}
function agDataLonga(d){return new Date(d+"T12:00:00Z").toLocaleDateString("pt-BR",{day:"numeric",month:"long",timeZone:"UTC"})}
{const _il=igLista;igLista=function(sec){if(sec==="_ag"){const pg=agPaginas();return {ps:pg,itens:pg}}return _il.apply(this,arguments)}}
{const _sp=stPs;stPs=function(){if(ST&&ST.sec==="_ag")return ST.itens||[];return _sp.apply(this,arguments)}}
{const _io=igNomeSt;igNomeSt=function(sec){return sec==="_ag"?"Agenda":_io.apply(this,arguments)}}
{const _is=igSet;igSet=function(sec,pos){const n=_is.apply(this,arguments);if(sec==="_ag"&&pos==="novo"){const k=ST.itens.findIndex(x=>!AG_VISTOS.has(x.chave));ST.i=k<0?0:k}return n}}
storyOrdem=function(){const base=(ST&&ST.ordem&&ST.ordem.length?ST.ordem:secsStory().map(s=>s.id)).filter(id=>pautasDa(id).length);
  const v=[];if(cincoLista().length)v.push("_5min");if(agPaginas().length)v.push("_ag");try{if(tickerItens(15).length)v.push("_ult")}catch(e){}return v.concat(base)};
function agEvHTML(a){const pid=agPid(a),hr=agHoraTxt(a),est=a._d===hojeSP()?agEstado(a):"";
  const inner=`<span class="sga-h">${est==="agora"?`<em class="sga-live"><i></i>Agora</em>`:hr?esc(hr):`<em class="sga-dia">Sem horário</em>`}</span><span class="sga-t">${esc(a.texto)}</span>${pid?`<span class="sga-c" aria-hidden="true">›</span>`:""}`;
  return `<li class="${est}">${pid?`<button type="button" data-stmat="${esc(pid)}">${inner}</button>`:`<div>${inner}</div>`}</li>`}
function igDrawAgenda(){const pg=ST.itens[ST.i];if(!pg)return closeLayer();const vazioS=!$("#layer").innerHTML;
  AG_VISTOS.add(pg.chave);try{localStorage.setItem("prumo-ag-vistos",JSON.stringify([...AG_VISTOS].slice(-60)))}catch(e){}
  const dn=new Date(pg.d+"T12:00:00Z").getUTCDate(),nome=agDiaNome(pg.d);
  ST.palavras=8+pg.ev.reduce((n,a)=>n+String(a.texto).split(/\s+/).length,0);
  $("#layer").innerHTML=`<div class="story sg sg-ag sg-v" data-sec="_ag" role="dialog" aria-modal="true" aria-label="Agenda"><div class="story-in">
    <div class="sg-bg sga-bg"><b class="sga-num" aria-hidden="true">${dn}</b></div>
    <div class="bars">${ST.itens.map((_,k)=>`<i class="${k<ST.i||(k===ST.i&&!PREF.storyAuto)?"on":""}">${k===ST.i&&PREF.storyAuto?"<b></b>":""}</i>`).join("")}</div>
    <div class="s-h"><span class="ph-av sg-av sg-avag"><i>${dn}</i></span><span class="sg-who"><b>Agenda</b><span>${esc(nome==="Hoje"||nome==="Amanhã"?nome.toLowerCase():agDataLonga(pg.d))}</span></span><span class="s-hb"><button type="button" data-sauto aria-pressed="${!!PREF.storyAuto}" aria-label="${PREF.storyAuto?"Parar de passar sozinho":"Passar sozinho"}">${PREF.storyAuto?'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>'}</button><button type="button" data-close aria-label="Fechar">${ICON.close}</button></span></div>
    <button type="button" class="tap l" data-sgo="-1" aria-label="Anterior"></button><button type="button" class="tap r" data-sgo="1" aria-label="Próxima"></button>
    <div class="sg-body sga-body"><h2>${esc(nome)}<small>${esc(agDataLonga(pg.d))}${pg.partes>1?` · ${pg.parte+1}/${pg.partes}`:""}</small></h2><ul class="sga-l">${pg.ev.map(agEvHTML).join("")}</ul></div>
    <div class="s-f sg-f" id="s-acts" data-pid=""><button type="button" class="sg-ler" data-igagsheet><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>Agenda completa</button><span class="sp"></span><span class="sga-n">${ST.i+1} de ${ST.itens.length}</span></div>
  </div></div>`;
  igWire($("#layer .story"));if(vazioS&&pushH())HST++;storyAuto(null);igEntra();agCaber();renderSecs()}
function agCaber(){const b=$("#layer .sga-body");if(!b)return;let k=1;b.style.setProperty("--sgk","1");for(let n=0;n<6&&b.scrollHeight>b.clientHeight+1;n++){k-=.08;b.style.setProperty("--sgk",k.toFixed(2))}}
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-igagsheet]");if(!b)return;e.stopPropagation();igAgendaSheet()},true);
/* desenhar: Agenda à parte; troca suave entre notícias */
{const _ds=drawStory;drawStory=function(anim){if(ST&&ST.sec==="_ag"){clearTimeout(ST.timer);return igDrawAgenda(anim)}const r=_ds.apply(this,arguments);igEntra();return r}}
function igEntra(){const st=$("#layer .story.sg");if(!st||REDUZ.matches||IG_CUBO)return;st.classList.remove("sg-anim");void st.offsetWidth;st.classList.add("sg-anim")}
/* troca de seção em cubo: as duas faces giram juntas */
var IG_CUBO=false;
function igCubo(d,render){const st=$("#layer .story"),old=st&&st.querySelector(".story-in");if(!old||REDUZ.matches||!old.animate){render();return}
  const r0=old.getBoundingClientRect(),clone=old.cloneNode(true);clone.removeAttribute("id");clone.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));
  IG_CUBO=true;try{render()}finally{IG_CUBO=false}
  const st2=$("#layer .story"),nw=st2&&st2.querySelector(".story-in");if(!nw)return;const rs=st2.getBoundingClientRect();
  clone.style.cssText=`position:absolute;left:${r0.left-rs.left}px;top:${r0.top-rs.top}px;width:${r0.width}px;height:${r0.height}px;margin:0;z-index:5;pointer-events:none`;st2.appendChild(clone);
  const W=r0.width/2,s=d>0?1:-1,op={duration:420,easing:"cubic-bezier(.32,.72,.24,1)"};
  const tf=a=>`translateZ(${-W}px) rotateY(${a}deg) translateZ(${W}px)`;
  st2.classList.add("sg-cubo");
  clone.animate([{transform:tf(0),filter:"brightness(1)"},{transform:tf(-90*s),filter:"brightness(.55)"}],op);
  const a=nw.animate([{transform:tf(90*s),filter:"brightness(.55)"},{transform:tf(0),filter:"brightness(1)"}],op);
  a.onfinish=a.oncancel=()=>{clone.remove();st2.classList.remove("sg-cubo")}}
storySec=function(d){if(VIRANDO)return;const L=storyOrdem(),k=L.indexOf(ST.sec),nx=L[k+d];if(!nx){if(d>0)igFechar();return}
  VIRANDO=true;vibrar(6);igCubo(d,()=>{igSet(nx,"novo");drawStory()});setTimeout(()=>{VIRANDO=false},380)};
storyGo=function(d){const ps=stPs();const i=ST.i+d;const L=storyOrdem(),k=L.indexOf(ST.sec);
  if(i<0){const prev=L[k-1];if(!prev){ST.i=0;drawStory();return}VIRANDO=true;igCubo(-1,()=>{igSet(prev,"fim");drawStory()});setTimeout(()=>{VIRANDO=false},380);return}
  if(i>=ps.length){const nx=L[k+1];if(!nx)return igFechar();VIRANDO=true;igCubo(1,()=>{igSet(nx,0);drawStory()});setTimeout(()=>{VIRANDO=false},380);return}
  ST.i=i;drawStory()};
/* fechar com animação (e arrastar para baixo acompanha o dedo) */
function igFechar(){const si=$("#layer .story .story-in");if(!si||REDUZ.matches||!si.animate){closeLayer();return}clearTimeout(ST&&ST.timer);
  const a=si.animate([{transform:getComputedStyle(si).transform==="none"?"none":getComputedStyle(si).transform,opacity:1},{transform:"translateY(24%) scale(.82)",opacity:0}],{duration:200,easing:"cubic-bezier(.4,0,1,1)",fill:"forwards"});
  const st=$("#layer .story");if(st)st.animate([{backgroundColor:"rgb(0 0 0 / 1)"},{backgroundColor:"rgb(0 0 0 / 0)"}],{duration:200,fill:"forwards"});
  a.onfinish=()=>closeLayer()}
igWire=function(el){if(!el)return;let x0=0,y0=0,on=false,modo="";const si=el.querySelector(".story-in");
  el.addEventListener("touchstart",e=>{if(e.target.closest(".s-f,.s-h,.us-it"))return;const t=e.touches[0];x0=t.clientX;y0=t.clientY;on=true;modo=""},{passive:true});
  el.addEventListener("touchmove",e=>{if(!on)return;const t=e.touches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(!modo&&(Math.abs(dx)>8||Math.abs(dy)>8))modo=Math.abs(dy)>Math.abs(dx)*1.2&&dy>0?"baixo":"lado";
    if(modo==="baixo"&&si){if(e.cancelable)e.preventDefault();const k=Math.max(0,dy);si.style.transition="none";si.style.transform=`translateY(${k}px) scale(${Math.max(.85,1-k/1600)})`;el.style.backgroundColor=`rgb(0 0 0 / ${Math.max(.3,1-k/500)})`}},{passive:false});
  el.addEventListener("touchend",e=>{if(!on)return;on=false;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(modo==="baixo"){e.preventDefault();if(dy>110)igFechar();else if(si){si.style.transition="transform .22s cubic-bezier(.3,.7,.4,1)";si.style.transform="";el.style.backgroundColor="";setTimeout(()=>{si.style.transition=""},240)}return}
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.3){e.preventDefault();storySec(dx<0?1:-1)}
    else if(dy<-80&&Math.abs(dy)>Math.abs(dx)*1.5){e.preventDefault();const pid=$("#s-acts")?.dataset.pid;if(pid)igLerMateria(pid)}},{passive:false})};
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("#layer .story [data-close]");if(!b)return;e.stopPropagation();igFechar()},true);
/* abrir os círculos especiais crescendo do círculo, como as seções */
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("#secs [data-5min],#secs [data-ultimas],#secs [data-igagenda]");if(!b)return;e.stopPropagation();if(!FEED)return;
  const sec=b.matches("[data-5min]")?"_5min":b.matches("[data-ultimas]")?"_ult":"_ag";(window.comTransicao||((o,f)=>f()))(b.querySelector(".ig-r")||b,()=>igAbrir(sec),".story-in")},true);
{const _ia=igAbrir;igAbrir=function(sec){if(sec==="_ag"){if(!FEED)return;uso("agenda");const pg=agPaginas();if(!pg.length){toast("Nada na agenda agora.");return}
  if($("#layer").innerHTML&&!$("#layer .story"))closeLayer();const k=pg.findIndex(x=>!AG_VISTOS.has(x.chave));ST={sec:"_ag",ids:pg.map(x=>x.id),itens:pg,i:k<0?0:k,ordem:secsStory().map(s=>s.id)};drawStory();return}return _ia.apply(this,arguments)}}
/* fileira: Agenda logo depois do "Em 5 min"; não redesenha (nem pula) se nada mudou; volta mostrando o último círculo visto */
{const _rs44=renderSecs;renderSecs=function(){const box=$("#secs");const x=box?box.scrollLeft:0;const r=_rs44.apply(this,arguments);if(!box)return r;
  try{const ag=box.querySelector("[data-igagenda]"),c5=box.querySelector("[data-5min]");if(ag){if(c5)c5.after(ag);else box.prepend(ag);ag.querySelector(".ig-r")?.classList.toggle("visto",agPaginas().every(p=>AG_VISTOS.has(p.chave)))}}catch(e){}
  box.scrollLeft=x;return r}}
{const _cl44=closeLayer;closeLayer=function(){const sec=ST&&ST.sec,eraStory=!!$("#layer .story")&&!($("#layer2")?.innerHTML);const r=_cl44.apply(this,arguments);
  if(eraStory&&sec&&VIEW==="feed"){const box=$("#secs");const sel=sec==="_5min"?"[data-5min]":sec==="_ult"?"[data-ultimas]":sec==="_ag"?"[data-igagenda]":`[data-sec-story="${CSS.escape(sec)}"]`;const b=box&&box.querySelector(sel);
    if(b){const L=b.getBoundingClientRect().left-box.getBoundingClientRect().left+box.scrollLeft,want=Math.max(0,L-(box.clientWidth-b.offsetWidth)/2);if(Math.abs(box.scrollLeft-want)>8)box.scrollTo({left:want,behavior:REDUZ.matches?"auto":"smooth"})}}return r}}
/* nada de faixa de novidades no Feed nem pílula: a edição nova entra quando a pessoa está no topo */
mostrarPilula=function(){$("#pilula")?.remove()};
function igAplicaNovo(){if(!NOVO)return;if((VIEW==="feed"||VIEW==="capa")&&scrollY<60&&!$("#layer").innerHTML)aplicarNovo(NOVO)}
addEventListener("scroll",()=>{if(NOVO&&scrollY<60)setTimeout(igAplicaNovo,250)},{passive:true});
setInterval(igAplicaNovo,4000);

