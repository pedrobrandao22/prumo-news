/* ---------- Etapa 42: topo do Feed e stories no estilo Instagram ---------- */
if(PREF&&PREF.storyAuto===undefined)PREF.storyAuto=true;
function igFace(p){const f=p&&fotoDe(p);return f?`<img src="${escU(fotoMini(f.url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`:`${svgOf(p&&p.imagem)}`}
function igAgendaItens(){const ag=FEED.agenda||[],hoje=hojeSP(),H=[],P=[];ag.forEach(a=>{const d=agData(a,hoje);if(!d||d<hoje)return;(d===hoje?H:P).push({...a,_d:d})});
  const ord=(x,y)=>x._d.localeCompare(y._d)||agMin(x)-agMin(y);H.sort(ord);P.sort(ord);return {H,P}}
function igCirc(attr,cls,face,nome,label){return `<button type="button" class="sb ig-s" ${attr} aria-label="${esc(label||nome)}"><span class="ig-r ${cls}"><span class="ig-f">${face}</span></span><b>${esc(nome)}</b></button>`}
renderSecs=function(){const box=$("#secs");if(!box||!FEED)return;let h="";
  if($("#b-5min"))h+=igCirc('data-5min',"ig-5",`<span class="ig-5c"><b>5</b><small>min</small></span>`,"Em 5 min","O dia em 5 minutos");
  try{const it=tickerItens(15);if(it.length){const hr=it[0].hora?hhmm(it[0].hora):"";h+=igCirc('data-ultimas',"ig-ult",`<span class="ig-uc"><i></i><small>${esc(hr||"Agora")}</small></span>`,"Últimas","Últimas notícias")}}catch(e){}
  h+=secsStory().map(s=>{const ps=pautasDa(s.id);if(!ps.length)return "";const nn=ps.filter(p=>!SEEN.has(seenKey(p))).length;const first=ps.find(p=>!SEEN.has(seenKey(p)))||ps[0];
    return `<button type="button" class="sb ig-s" data-sec-story="${esc(s.id)}" aria-label="${esc(s.nome)}: ${ps.length} notícias${nn?", "+nn+" não vistas":""}"><span class="ig-r${nn?"":" visto"}" style="--c:${secCor(s.id)}"><span class="ig-f paper" data-sec="${esc(s.id)}">${igFace(first)}</span></span><b>${esc(s.nome)}</b></button>`}).join("");
  try{const {H,P}=igAgendaItens();if(H.length||P.length){const d=new Date(hojeSP()+"T12:00:00Z");const wd=d.toLocaleDateString("pt-BR",{weekday:"short",timeZone:"UTC"}).replace(".","");
    h+=igCirc('data-igagenda',"ig-ag"+(H.length?"":" visto"),`<span class="ig-agc"><small>${esc(wd)}</small><b>${d.getUTCDate()}</b></span>`,"Agenda",`Agenda: ${H.length} hoje, ${P.length} nos próximos dias`)}}catch(e){}
  box.innerHTML=h;box.classList.add("ig");
  const fl=$("#filters");if(fl){fl.hidden=true;fl.innerHTML=""}const bf=$("#b-filtro");if(bf)bf.setAttribute("aria-pressed",String(FILTRO!=="tudo"))};
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
drawStory=function(anim){
  const ps=stPs(),p=ps[ST.i];if(!p)return closeLayer();clearTimeout(ST.timer);const vazioS=!$("#layer").innerHTML;
  SEEN.add(seenKey(p));lsSet("radar-vistos",[...SEEN].slice(-400));marcarLida(p.id);
  const L=lente(),v=versao(p,L),sec=ST.sec,cor=secCor(sec),f=fotoDe(p);
  const lin=igLinhas(p,L);let num=null;
  const linHTML=lin.map((t0,k)=>{let t=t0;if(k===0){const n=ssNumero(t0);if(n&&t0.indexOf(n)===0){let r=t0.slice(n.length).replace(/^\s*:?\s*/,"");if(r.length>8){num=n;t=r.charAt(0).toUpperCase()+r.slice(1)}}}return `<li>${esc(t)}</li>`}).join("");
  const hr=ultimaAtualizacao(p)||p.hora;const qd=hr?quando(hr):"";
  ST.palavras=(v.titulo+" "+lin.join(" ")).split(/\s+/).length;
  $("#layer").innerHTML=`<div class="story sg${f?" com-foto":""}" data-sec="${esc(sec)}" style="--c:${cor}" role="dialog" aria-modal="true" aria-label="${esc(secNome(sec))}"><div class="story-in">
    <div class="sg-bg paper" data-sec="${esc(sec)}">${f?`<img src="${escU(fotoSrc(f.url))}" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.story').classList.remove('com-foto');this.remove()">`:`<div class="sg-art">${svgOf(p.imagem)}</div>`}</div>
    <div class="sg-sh"></div>
    <div class="bars">${ps.map((_,k)=>`<i class="${k<ST.i||(k===ST.i&&!PREF.storyAuto)?"on":""}">${k===ST.i&&PREF.storyAuto?"<b></b>":""}</i>`).join("")}</div>
    <div class="s-h"><span class="ph-av sg-av" style="--c:${cor}"><i>${esc(secNome(sec).charAt(0))}</i></span><span class="sg-who"><b>${esc(secNome(sec))}</b>${qd?`<span>${esc(qd)}</span>`:""}</span><span class="s-hb"><button type="button" data-sauto aria-pressed="${!!PREF.storyAuto}" aria-label="${PREF.storyAuto?"Parar de passar sozinho":"Passar sozinho"}">${PREF.storyAuto?'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>'}</button><button type="button" data-close aria-label="Fechar">${ICON.close}</button></span></div>
    <button type="button" class="tap l" data-sgo="-1" aria-label="Notícia anterior"></button><button type="button" class="tap r" data-sgo="1" aria-label="Próxima notícia"></button>
    <div class="sg-body"><span class="sg-k">${esc(capaChapeu(p))}</span><h2>${esc(v.titulo)}</h2>${num?`<b class="sg-n">${esc(num)}</b>`:""}${linHTML?`<ul class="sg-l">${linHTML}</ul>`:""}${f?credHTML(f.credito||"Foto de arquivo","sg-cr"):""}</div>
    <div class="s-f sg-f" id="s-acts" data-pid="${esc(p.id)}">${storyActs(p.id)}</div>
  </div></div>`;
  igWire($("#layer .story"));if(vazioS&&pushH())HST++;storyAuto(p);
  const si=$("#layer .story-in");if(anim&&si){si.classList.add(anim);si.addEventListener("animationend",()=>{si.classList.remove(anim);$("#layer .story")?.classList.remove("flipping")},{once:true});$("#layer .story").classList.add("flipping")}
  igCaber();renderSecs()};
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

