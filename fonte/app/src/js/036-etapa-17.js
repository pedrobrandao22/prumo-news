/* ---------- Etapa 17 ---------- */
function minLeitura(p,v){const t=[v&&v.texto,p.contexto,p.proximo,...(pontosDe(p,lente())||[]),...(Array.isArray(p.essencial)?p.essencial:[]),...(Array.isArray(p.atualizacoes)?p.atualizacoes.map(x=>x&&x.texto):[])].filter(x=>typeof x==="string").join(" ");
  return Math.max(1,Math.round(t.split(/\s+/).filter(Boolean).length/200))}
function matRel(p,nx){if(!FEED)return "";const tm=temaDe(p),sec=secOf(p),L=lente();
  const l=(FEED.pautas||[]).filter(q=>q&&q.id!==p.id&&(!nx||q.id!==nx.id)).map(q=>{let s=0;if(tm&&temaDe(q)===tm)s+=4;if(p.subtema&&q.subtema===p.subtema&&secOf(q)===sec)s+=2;if(secOf(q)===sec)s+=1;return [q,s+(q.prioridade||0)/1000]}).filter(x=>x[1]>=2).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
  if(!l.length)return "";
  return `<div class="mat-rel"><b>Relacionadas</b><ul>${l.map(q=>`<li><button type="button" data-matir="${esc(q.id)}">${capaArte(q,"mr-th")}<span><em style="color:${secCor(secOf(q))}">${esc(capaChapeu(q))}</em><b>${esc(versao(q,L).titulo)}</b></span></button></li>`).join("")}</ul></div>`}
function matProgresso(){const m=$("#layer .mat");if(!m||m._prog)return;m._prog=1;const top=m.querySelector(".mat-top");if(!top)return;const b=document.createElement("i");b.className="mat-prog";b.setAttribute("aria-hidden","true");top.appendChild(b);
  let raf=0;const f=()=>{raf=0;const max=m.scrollHeight-m.clientHeight;b.style.transform=`scaleX(${max>0?Math.min(1,m.scrollTop/max).toFixed(3):0})`};m.addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(f)},{passive:true});f()}
(function(){const ant=abrirMateria;abrirMateria=function(pid,manter){const vazio=!$("#layer").innerHTML;const r=ant.apply(this,arguments);try{matProgresso();if(!manter){const h=$("#layer .mat h1");if(h){h.tabIndex=-1;h.focus({preventScroll:true})}}}catch(e){}return r}})();

