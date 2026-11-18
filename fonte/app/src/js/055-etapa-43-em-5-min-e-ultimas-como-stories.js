/* ---------- Etapa 43: "Em 5 min" e "Últimas" como stories ---------- */
var ULT_VISTOS=new Set((()=>{try{return JSON.parse(localStorage.getItem("prumo-ult-vistos")||"[]")}catch(e){return []}})());
function ultKey(i){return i.pid+"|"+(i.hora||"")+"|"+(i.txt||"").slice(0,40)}
function cincoLista(){const top=ordenadas(visiveis()).filter(p=>!lidaAtual(p)).slice(0,5);return top.length?top:ordenadas(visiveis()).slice(0,5)}

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

storySec=function(d){if(VIRANDO)return;const L=storyOrdem(),k=L.indexOf(ST.sec),nx=L[k+d];if(!nx){if(d>0)closeLayer();return}
  const go=()=>{VIRANDO=false;VIRA_T=0;if(!$("#layer .story"))return;igSet(nx,"novo");drawStory(REDUZ.matches?null:(d>0?"in-r":"in-l"))};
  const si=$("#layer .story-in");if(!si||REDUZ.matches){go();return}
  VIRANDO=true;vibrar(6);$("#layer .story").classList.add("flipping");si.classList.add(d>0?"out-l":"out-r");VIRA_T=setTimeout(go,260)};
storyGo=function(d){const ps=stPs();ST.i+=d;const L=storyOrdem(),k=L.indexOf(ST.sec);
  if(ST.i<0){const prev=L[k-1];if(prev)igSet(prev,"fim");else ST.i=0}
  else if(ST.i>=ps.length){const nx=L[k+1];if(!nx)return closeLayer();igSet(nx,0)}
  drawStory()};

