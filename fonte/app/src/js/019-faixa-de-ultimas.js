/* ---------- faixa de últimas ---------- */
function tickerItens(lim=10){
  if(!FEED)return [];const out=[],vis=new Set(),ocultas=PREF.ocultas||[];
  const ref=new Date(FEED.atualizado_em).getTime()||Date.now(),dia=864e5;
  const ok=p=>p&&!ocultas.includes(secOf(p))&&!silenciado(p);
  const ultimaUpd=p=>(p.atualizacoes||[]).slice().sort((a,b)=>String(b.hora).localeCompare(String(a.hora)))[0];
  ((FEED.mudancas||{}).itens||[]).forEach(i=>{const p=pautaById(i.pid);if(!ok(p)||vis.has(p.id)||!(i.tipo==="nova"||i.tipo==="atualizada"))return;vis.add(p.id);const u=ultimaUpd(p);
    out.push({pid:p.id,tag:i.tipo==="nova"?"Nova":"Atualizada",txt:i.texto||p.neutro?.titulo||"",hora:(i.tipo==="atualizada"&&u?u.hora:p.hora),sec:secOf(p)})});
  const porPrio=[...(FEED.pautas||[])].filter(ok).sort((a,b)=>(b.prioridade||0)-(a.prioridade||0));
  const add=p=>{if(vis.has(p.id)||out.length>=lim)return;vis.add(p.id);const u=ultimaUpd(p);const recente=u&&ref-new Date(u.hora).getTime()<dia;
    out.push({pid:p.id,tag:secNome(secOf(p)),txt:recente?u.texto:(p.neutro?.titulo||""),hora:recente?u.hora:p.hora,sec:secOf(p)})};
  porPrio.filter(p=>{const h=new Date(p.hora).getTime();return h&&ref-h<dia}).forEach(add);
  porPrio.forEach(add);
  return out.slice(0,lim).sort((a,b)=>tms(b.hora)-tms(a.hora));
}
function abrirUltimas(){uso("ultimas");const it=tickerItens(15);const at=new Date(FEED.atualizado_em);
  sheet("Últimas notícias",`<p class="hint" style="margin:0">Atualizado ${isNaN(at)?"":esc(diaHora(FEED.atualizado_em))}. O Prumo confere os veículos de hora em hora. ${proximaRodadaTxt()}</p><ul class="ult">${it.map(i=>`<li><button type="button" data-goto="${esc(i.pid)}"><span class="u-t"><b style="color:${secCor(i.sec)}">${esc(i.tag)}</b>${i.hora?` · ${esc(hhmm(i.hora))}`:""}</span><span class="u-x">${esc(i.txt)}</span></button></li>`).join("")}</ul>`)}
function renderTicker(){
  const tk=$("#ticker"),run=$("#tkrun");if(!tk||!run)return;const it=tickerItens();
  if(!it.length){tk.hidden=true;return}tk.hidden=false;
  const at=new Date(FEED.atualizado_em);const th=$("#tkhora");if(th)th.textContent=isNaN(at)?"":"às "+at.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"}).replace(":","h");
  const one=it.map(i=>`<button type="button" class="tk-i" data-tk="${esc(i.pid)}" tabindex="-1"><b>${esc(i.tag)}</b>${i.hora?`<time>${esc(hhmm(i.hora))}</time>`:""}<span>${esc(i.txt)}</span></button><i class="tk-sep" aria-hidden="true"></i>`).join("");
  run.innerHTML=one+one.replace(/tabindex="-1"/g,'tabindex="-1" aria-hidden="true"');run.querySelectorAll('.tk-i:not([aria-hidden])').forEach(b=>b.tabIndex=0);
  requestAnimationFrame(()=>{TK.w=run.scrollWidth/2;if(!TK.raf)TK.raf=requestAnimationFrame(tkLoop)});
  wireTicker();
}
const TK={x:0,w:0,v:60,paused:false,drag:null,last:0,raf:0,hold:0,wired:false};
const REDUZ=matchMedia("(prefers-reduced-motion: reduce)");
function tkStart(){if(!TK.raf&&$("#tkrun")){TK.last=0;TK.raf=requestAnimationFrame(tkLoop)}}
function tkLoop(ts){const run=$("#tkrun");if(!run||VIEW!=="feed"||document.hidden||$("#ticker")?.hidden){TK.raf=0;TK.last=0;return}if(!(TK.w>0))TK.w=run.scrollWidth/2;
  const dt=TK.last?Math.min(64,ts-TK.last):0;TK.last=ts;
  if(!TK.paused&&!TK.drag&&Date.now()>TK.hold&&!REDUZ.matches&&VIEW==="feed"&&!document.hidden)TK.x-=TK.v*dt/1000;
  if(TK.w>0){while(TK.x<=-TK.w)TK.x+=TK.w;while(TK.x>0)TK.x-=TK.w}
  run.style.transform=`translate3d(${TK.x.toFixed(1)}px,0,0)`;TK.raf=requestAnimationFrame(tkLoop)}
function wireTicker(){if(TK.wired)return;const vp=$(".tk-vp");if(!vp)return;TK.wired=true;
  vp.addEventListener("pointerdown",e=>{TK.drag={x0:e.clientX,start:TK.x,t:Date.now(),moved:false,id:e.pointerId};try{vp.setPointerCapture(e.pointerId)}catch(_){}});
  vp.addEventListener("pointermove",e=>{const d=TK.drag;if(!d)return;const dx=e.clientX-d.x0;if(!d.moved&&Math.abs(dx)>6){d.moved=true;vp.classList.add("drag")}if(d.moved)TK.x=d.start+dx});
  const fim=e=>{const d=TK.drag;if(!d)return;TK.drag=null;vp.classList.remove("drag");
    if(e.type==="pointerup"&&!d.moved&&Date.now()-d.t<350){const el=document.elementFromPoint(e.clientX,e.clientY);
      const pid=(el?.closest(".tk-i")||e.target.closest?.(".tk-i"))?.dataset.tk;if(pid){uso("faixa");vibrar(6);openSnap(pid)}return}
    TK.hold=Date.now()+150};
  vp.addEventListener("pointerup",fim);vp.addEventListener("pointercancel",fim);
  vp.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse")TK.paused=true});vp.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse")TK.paused=false});
}

