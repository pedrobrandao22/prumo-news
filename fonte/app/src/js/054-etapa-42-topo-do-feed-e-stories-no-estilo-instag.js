/* ---------- Etapa 42: topo do Feed e stories no estilo Instagram ---------- */
if(PREF&&PREF.storyAuto===undefined)PREF.storyAuto=true;
function igFace(p){const f=p&&fotoDe(p);return f?`<img src="${escU(fotoMini(f.url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`:`${svgOf(p&&p.imagem)}`}
function igAgendaItens(){const ag=FEED.agenda||[],hoje=hojeSP(),H=[],P=[];ag.forEach(a=>{const d=agData(a,hoje);if(!d||d<hoje)return;(d===hoje?H:P).push({...a,_d:d})});
  const ord=(x,y)=>x._d.localeCompare(y._d)||agMin(x)-agMin(y);H.sort(ord);P.sort(ord);return {H,P}}
function igCirc(attr,cls,face,nome,label){return `<button type="button" class="sb ig-s" ${attr} aria-label="${esc(label||nome)}"><span class="ig-r ${cls}"><span class="ig-f">${face}</span></span><b>${esc(nome)}</b></button>`}
function igAgendaSheet(){uso("agenda");const {H,P}=igAgendaItens();
  sheet("Agenda",`${H.length?`<h4 class="ig-agh">Hoje</h4><ul class="ig-agl">${H.map(a=>agItem(a,false)).join("")}</ul>`:`<p class="hint">Nada marcado para hoje.</p>`}${P.length?`<h4 class="ig-agh">Próximos dias</h4><ul class="ig-agl">${P.map(a=>agItem(a,true)).join("")}</ul>`:""}`)}
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-igagenda]");if(!b)return;e.stopPropagation();if(FEED)igAgendaSheet()},true);
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-stmat]");if(!b)return;e.stopPropagation();igLerMateria(b.dataset.stmat)},true);
function igLerMateria(pid){if(ST){clearTimeout(ST.timer);ST.timer=0}uso("story_materia");abrirMateria(pid)}

/* story em tela cheia */
function igLinhas(p,L){const fr=ssFrasesSociais(p,L).slice(0,4);const tit=norm(versao(p,L).titulo||"");
  return fr.filter(t=>norm(t)!==tit).slice(0,3)}
storyActs=function(pid){const {likes,cm}=socialOf(pid),mine=!!(S.uid&&likes.includes(S.uid));
  return `<button type="button" class="sg-ler" data-stmat="${esc(pid)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg>Ler a matéria</button><span class="sp"></span><button type="button" class="sg-a ${mine?"on":""}" data-a="like" aria-pressed="${mine}" aria-label="Gostei">${ICON.like}${likes.length?`<span>${likes.length}</span>`:""}</button><button type="button" class="sg-a" data-a="cmt" aria-label="Comentar">${ICON.cmt}${cm.length?`<span>${cm.length}</span>`:""}</button><button type="button" class="sg-a" data-a="send" aria-label="Enviar">${ICON.send}</button>`};

function igCaber(){const b=$("#layer .sg-body");if(!b)return;const lim=()=>b.getBoundingClientRect().top<110;let k=1;b.style.setProperty("--sgk","1");for(let n=0;n<6&&lim();n++){k-=.08;b.style.setProperty("--sgk",k.toFixed(2))}
  if(lim()){const li=[...b.querySelectorAll(".sg-l li")];while(li.length>1&&lim())li.pop().remove()}}
function igWire(el){if(!el)return;let x0=0,y0=0,on=false;
  el.addEventListener("touchstart",e=>{if(e.target.closest(".s-f,.s-h,.us-it"))return;const t=e.touches[0];x0=t.clientX;y0=t.clientY;on=true},{passive:true});
  el.addEventListener("touchend",e=>{if(!on)return;on=false;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.3){e.preventDefault();storySec(dx<0?1:-1)}
    else if(dy>110&&Math.abs(dy)>Math.abs(dx)*1.5){e.preventDefault();closeLayer()}
    else if(dy<-80&&Math.abs(dy)>Math.abs(dx)*1.5){e.preventDefault();const pid=$("#s-acts")?.dataset.pid;if(pid)igLerMateria(pid)}},{passive:false})}
storyAuto=(function(ant){return function(p){const w=ST.palavras||20;const dur=Math.max(6000,Math.min(16000,1500+w/3.4*1000));
  clearTimeout(ST.timer);if(!PREF.storyAuto)return;const fill=$("#layer .bars b");if(fill)fill.style.animationDuration=dur+"ms";ST.fim=Date.now()+dur;ST.resto=dur;ST.timer=setTimeout(()=>storyGo(1),dur);
  const el=$("#layer .story");if(!el||el._auto)return;el._auto=true;
  el.addEventListener("pointerdown",ev=>{if(ev.target.closest(".s-f,.s-h,.us-it"))return;if(!PREF.storyAuto||!ST.timer)return;clearTimeout(ST.timer);ST.timer=0;ST.resto=Math.max(800,ST.fim-Date.now());const f=$("#layer .bars b");if(f)f.style.animationPlayState="paused"});
  const volta=()=>{if(!PREF.storyAuto||ST.timer||!$("#layer .story")||$("#layer2").innerHTML)return;ST.fim=Date.now()+ST.resto;ST.timer=setTimeout(()=>storyGo(1),ST.resto);const f=$("#layer .bars b");if(f)f.style.animationPlayState="running"};
  el.addEventListener("pointerup",volta);el.addEventListener("pointercancel",volta)}})(storyAuto);

