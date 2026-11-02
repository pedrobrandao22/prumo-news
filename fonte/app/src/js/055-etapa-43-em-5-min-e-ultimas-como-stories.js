/* ---------- Etapa 43: "Em 5 min" e "Últimas" como stories ---------- */
var ULT_VISTOS=new Set((()=>{try{return JSON.parse(localStorage.getItem("prumo-ult-vistos")||"[]")}catch(e){return []}})());
function ultKey(i){return i.pid+"|"+(i.hora||"")+"|"+(i.txt||"").slice(0,40)}
function cincoLista(){const top=ordenadas(visiveis()).filter(p=>!lidaAtual(p)).slice(0,5);return top.length?top:ordenadas(visiveis()).slice(0,5)}
function igLista(sec){
  if(sec==="_5min"){const ps=cincoLista();return {ps,itens:null}}
  if(sec==="_ult"){const it=tickerItens(15).filter(i=>pautaById(i.pid));return {ps:it.map(i=>pautaById(i.pid)),itens:it}}
  return {ps:pautasDa(sec),itens:null}}
function igNomeSt(sec){return sec==="_5min"?"Em 5 min":sec==="_ult"?"Últimas":secNome(sec)}
function igSet(sec,pos){const r=igLista(sec);let i;
  if(pos==="fim")i=r.ps.length-1;else if(pos==="novo"){i=sec==="_ult"?r.itens.findIndex(x=>!ULT_VISTOS.has(ultKey(x))):r.ps.findIndex(p=>!SEEN.has(seenKey(p)));if(i<0)i=0}else i=pos||0;
  ST={...(ST||{}),sec,ids:r.ps.map(p=>p.id),itens:r.itens,i};return r.ps.length}
function igAbrir(sec){if(!FEED)return;uso(sec==="_5min"?"5min":"ultimas");if($("#layer").innerHTML&&!$("#layer .story"))closeLayer();
  const r=igLista(sec);if(!r.ps.length){toast("Nada por aqui agora.");return}
  ST={sec,ids:r.ps.map(p=>p.id),itens:r.itens,i:sec==="_5min"?0:0,ordem:secsStory().map(s=>s.id)};
  if(sec==="_ult"){const k=r.itens.findIndex(x=>!ULT_VISTOS.has(ultKey(x)));ST.i=k<0?0:k}
  drawStory()}
abrir5min=function(){igAbrir("_5min")};
abrirUltimas=function(){igAbrir("_ult")};
storyOrdem=function(){const base=(ST&&ST.ordem&&ST.ordem.length?ST.ordem:secsStory().map(s=>s.id)).filter(id=>pautasDa(id).length);
  const v=[];if(cincoLista().length)v.push("_5min");try{if(tickerItens(15).length)v.push("_ult")}catch(e){}return v.concat(base)};
storySec=function(d){if(VIRANDO)return;const L=storyOrdem(),k=L.indexOf(ST.sec),nx=L[k+d];if(!nx){if(d>0)closeLayer();return}
  const go=()=>{VIRANDO=false;VIRA_T=0;if(!$("#layer .story"))return;igSet(nx,"novo");drawStory(REDUZ.matches?null:(d>0?"in-r":"in-l"))};
  const si=$("#layer .story-in");if(!si||REDUZ.matches){go();return}
  VIRANDO=true;vibrar(6);$("#layer .story").classList.add("flipping");si.classList.add(d>0?"out-l":"out-r");VIRA_T=setTimeout(go,260)};
storyGo=function(d){const ps=stPs();ST.i+=d;const L=storyOrdem(),k=L.indexOf(ST.sec);
  if(ST.i<0){const prev=L[k-1];if(prev)igSet(prev,"fim");else ST.i=0}
  else if(ST.i>=ps.length){const nx=L[k+1];if(!nx)return closeLayer();igSet(nx,0)}
  drawStory()};
drawStory=function(anim){
  const ps=stPs(),p=ps[ST.i];if(!p)return closeLayer();clearTimeout(ST.timer);const vazioS=!$("#layer").innerHTML;
  SEEN.add(seenKey(p));lsSet("radar-vistos",[...SEEN].slice(-400));marcarLida(p.id);
  const vsec=ST.sec,virt=vsec==="_5min"||vsec==="_ult",it=vsec==="_ult"&&ST.itens?ST.itens[ST.i]:null;
  if(it){ULT_VISTOS.add(ultKey(it));try{localStorage.setItem("prumo-ult-vistos",JSON.stringify([...ULT_VISTOS].slice(-200)))}catch(e){}}
  const L=lente(),v=versao(p,L),psec=secOf(p),cor=secCor(psec),f=fotoDe(p);
  const tit=it&&it.txt?it.txt:v.titulo;
  let lin=igLinhas(p,L);if(it){lin=lin.filter(t=>norm(t)!==norm(tit));lin=lin.slice(0,3)}
  let num=null;
  const linHTML=lin.map((t0,k)=>{let t=t0;if(k===0&&!it){const n=ssNumero(t0);if(n&&t0.indexOf(n)===0){let r=t0.slice(n.length).replace(/^\s*:?\s*/,"");if(r.length>8){num=n;t=r.charAt(0).toUpperCase()+r.slice(1)}}}return `<li>${esc(t)}</li>`}).join("");
  const hr=it?it.hora:(ultimaAtualizacao(p)||p.hora);
  const sub=vsec==="_5min"?`${ps.slice(0,ST.i+1).filter(x=>!x.__vis).length} de ${ps.filter(x=>!x.__vis).length}`:it?(hr&&hhmm(hr)?(dataSP(hr)===hojeSP()?"às "+hhmm(hr):horaDia(hr)):""):(hr?quando(hr):"");
  const kick=it?(it.tag==="Nova"||it.tag==="Atualizada"?`${it.tag} · ${secNome(psec)}`:secNome(psec)):vsec==="_5min"?`${secNome(psec)} · ${capaChapeu(p)}`:capaChapeu(p);
  const av=vsec==="_5min"?`<span class="ph-av sg-av sg-av5"><i>5</i></span>`:vsec==="_ult"?`<span class="ph-av sg-av sg-avu"><b></b></span>`:`<span class="ph-av sg-av" style="--c:${cor}"><i>${esc(secNome(vsec).charAt(0))}</i></span>`;
  ST.palavras=(tit+" "+lin.join(" ")).split(/\s+/).length;
  $("#layer").innerHTML=`<div class="story sg${f?" com-foto":""}${virt?" sg-v":""}" data-sec="${esc(virt?psec:vsec)}" style="--c:${cor}" role="dialog" aria-modal="true" aria-label="${esc(igNomeSt(vsec))}"><div class="story-in">
    <div class="sg-bg paper" data-sec="${esc(psec)}">${f?`<img src="${escU(fotoSrc(f.url))}" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.story').classList.remove('com-foto');this.remove()">`:`<div class="sg-art">${svgOf(p.imagem)}</div>`}</div>
    <div class="sg-sh"></div>
    <div class="bars">${ps.map((_,k)=>`<i class="${k<ST.i||(k===ST.i&&!PREF.storyAuto)?"on":""}">${k===ST.i&&PREF.storyAuto?"<b></b>":""}</i>`).join("")}</div>
    <div class="s-h">${av}<span class="sg-who"><b>${esc(igNomeSt(vsec))}</b>${sub?`<span>${esc(sub)}</span>`:""}</span><span class="s-hb"><button type="button" data-sauto aria-pressed="${!!PREF.storyAuto}" aria-label="${PREF.storyAuto?"Parar de passar sozinho":"Passar sozinho"}">${PREF.storyAuto?'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>'}</button><button type="button" data-close aria-label="Fechar">${ICON.close}</button></span></div>
    <button type="button" class="tap l" data-sgo="-1" aria-label="Anterior"></button><button type="button" class="tap r" data-sgo="1" aria-label="Próxima"></button>
    <div class="sg-body"><span class="sg-k">${esc(kick)}</span><h2>${esc(tit)}</h2>${num?`<b class="sg-n">${esc(num)}</b>`:""}${linHTML?`<ul class="sg-l">${linHTML}</ul>`:""}${f?credHTML(f.credito||"Foto de arquivo","sg-cr"):""}</div>
    <div class="s-f sg-f" id="s-acts" data-pid="${esc(p.id)}">${storyActs(p.id)}</div>
  </div></div>`;
  igWire($("#layer .story"));if(vazioS&&pushH())HST++;storyAuto(p);
  const si=$("#layer .story-in");if(anim&&si){si.classList.add(anim);si.addEventListener("animationend",()=>{si.classList.remove(anim);$("#layer .story")?.classList.remove("flipping")},{once:true});$("#layer .story").classList.add("flipping")}
  igCaber();renderSecs()};
{const _rs43=renderSecs;renderSecs=function(){const r=_rs43.apply(this,arguments);try{
  const c=$("#secs [data-5min] .ig-r");if(c)c.classList.toggle("visto",!ordenadas(visiveis()).some(p=>!lidaAtual(p)));
  const u=$("#secs [data-ultimas] .ig-r");if(u)u.classList.toggle("visto",tickerItens(15).every(i=>ULT_VISTOS.has(ultKey(i))));
  }catch(e){}return r}}

