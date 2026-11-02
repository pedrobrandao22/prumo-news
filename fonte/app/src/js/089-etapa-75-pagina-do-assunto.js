/* ---------- Etapa 75: página do assunto ---------- */
function asNorm(x){return norm(String(x||""))}
function asDados(sub){const k=asNorm(sub);if(!FEED||!k)return null;
  const agora=(FEED.pautas||[]).filter(p=>asNorm(p.subtema)===k).sort((a,b)=>tms(ultimaAtualizacao(b)||b.hora)-tms(ultimaAtualizacao(a)||a.hora));
  const ids=new Set(agora.map(p=>p.id));const antes=(FEED.dormentes||[]).filter(d=>asNorm(d.subtema)===k&&!ids.has(d.id)).sort((a,b)=>tms(b.ultima)-tms(a.ultima));
  const sec=(agora[0]&&secOf(agora[0]))||(antes[0]&&antes[0].secao)||"politica";
  /* linha do tempo: as manchetes de cada história ao longo dos dias, mais as atualizações das que estão no ar */
  const ev=[];const vistos=new Set();const add=(hora,txt,ref,tema,viva,tit)=>{const t=tms(hora);if(!t||!txt)return;const ch=ref+"|"+String(txt);if(vistos.has(ch))return;vistos.add(ch);ev.push({t,txt:String(txt),ref,tema,viva,tit:!!tit})};
  agora.forEach(p=>{const tm=temaDe(p)||p.tag||"";(Array.isArray(p.titulos)?p.titulos:[]).forEach(x=>x&&add(x.hora,x.titulo,p.id,tm,1,1));(p.atualizacoes||[]).forEach(u=>u&&!/^Correção: /.test(u.texto||"")&&add(u.hora,u.texto,p.id,tm,1));if(!(p.titulos||[]).length)add(p.inicio||p.hora,(p.neutro||{}).titulo,p.id,tm,1,1)});
  antes.forEach(d=>{const tm=d.tema||d.tag||"";(Array.isArray(d.titulos)&&d.titulos.length?d.titulos:[{hora:d.ultima,titulo:d.titulo}]).forEach(x=>x&&add(x.hora,x.titulo,d.id,tm,0,1))});
  ev.sort((a,b)=>b.t-a.t);
  /* manchete da mesma história: só a mais recente de cada dia (as atualizações ficam todas) */
  {const ja=new Set();for(let i=0;i<ev.length;i++){const x=ev[i];if(!x.tit)continue;const k=x.ref+"|"+_FDSP.format(new Date(x.t));if(ja.has(k)){ev.splice(i,1);i--}else ja.add(k)}}
  const lidas=Object.values(HIST||{}).filter(h=>h&&h.tema&&(agora.some(p=>temaDe(p)===h.tema)||antes.some(d=>d.tema===h.tema))).length;
  return {sub,sec,agora,antes,ev:ev.slice(0,40),lidas}}
function asDia(t){const s=new Date(t).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"short",timeZone:"America/Sao_Paulo"}).replace(".","");return s.charAt(0).toUpperCase()+s.slice(1)}
function asDesenha(){const el=$("#layer .pfv-as");if(!el)return;const d=asDados(el.dataset.sub);
  if(!d){el.innerHTML="";return}let dia="";const cor=secCor(d.sec);
  el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-pfvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>${esc(d.sub)}<small>${esc(secNome(d.sec))}</small></b><span class="sp"></span></div>
  <div class="pfv-sc as">
    <p class="as-sub"><span class="secdot" style="background:${cor}"></span>${d.agora.length?`${d.agora.length} ${d.agora.length===1?"história no ar":"histórias no ar"}`:"Nada no ar agora"}${d.antes.length?` · ${d.antes.length} dos últimos dias`:""}${d.lidas?` · você leu ${d.lidas}`:""}</p>
    ${d.agora.length?`<h4 class="as-h">Agora</h4><ul class="as-l">${d.agora.map(p=>`<li><button type="button" data-ascob="${esc(p.id)}"><span class="as-t">${cobStatus(p)}<b>${esc(versao(p,lente()).titulo)}</b></span><small>${esc(temaDe(p)||p.tag||"")} · atualizada ${esc(quando(ultimaAtualizacao(p)||p.hora))}${seguido(p)?" · seguindo":""}</small></button></li>`).join("")}</ul>`:""}
    ${d.ev.length?`<h4 class="as-h">Linha do tempo</h4><ol class="as-tl" style="--c:${cor}">${d.ev.map(x=>{const nd=asDia(x.t);const cab=nd!==dia?`<li class="as-d">${esc(nd)}</li>`:"";dia=nd;
      return cab+`<li><button type="button" ${x.viva?`data-ascob="${esc(x.ref)}"`:`data-asdorm="${esc(x.ref)}"`}><i>${esc(hhmm(new Date(x.t).toISOString()))}</i><span><small>${esc(x.tema)}</small>${esc(x.txt)}</span></button></li>`}).join("")}</ol>`:""}
    ${d.antes.length?`<h4 class="as-h">Dos últimos dias</h4><ul class="as-l">${d.antes.map(x=>`<li><button type="button" data-asdorm="${esc(x.id)}"><span class="as-t">${cobStatus(x)}<b>${esc(x.titulo)}</b></span><small>${esc([x.tema||x.tag||"",x.ultima?quando(x.ultima):""].filter(Boolean).join(" · "))}</small></button></li>`).join("")}</ul>`:""}
  </div>`}
function abrirAssunto(sub){if(!sub||!FEED)return;uso("assunto");if($("#layer").innerHTML)closeLayer();
  $("#layer").innerHTML=`<div class="pfv pfv-as" role="dialog" aria-modal="true" aria-label="${esc(sub)}" data-sub="${esc(sub)}"></div>`;if(pushH())HST++;asDesenha()}
/* entrada: o assunto no topo da página da cobertura vira um link */
{const _pc75=abrirPagCob;abrirPagCob=function(pid){const r=_pc75.apply(this,arguments);try{const p=pautaById(pid);const k=document.querySelector(".sheet .pc[data-pc] .pc-k");
  if(p&&p.subtema&&k&&!k.querySelector("[data-assunto]")&&asNorm(($("#layer .pfv-as")||{dataset:{}}).dataset.sub)!==asNorm(p.subtema)){const n=asDados(p.subtema);const tot=n?n.agora.length+n.antes.length:0;
    if(tot>1)k.insertAdjacentHTML("afterend",`<button type="button" class="as-link" data-assunto="${esc(p.subtema)}">Tudo sobre ${esc(p.subtema)} <span>${tot} histórias ›</span></button>`)}}catch(e){}return r}}
{const _ad75=abrirDormente;abrirDormente=function(id){const r=_ad75.apply(this,arguments);try{const d=(FEED.dormentes||[]).find(x=>x.id===id);const b=document.querySelector(".sheet .sh-b");
  if(d&&d.subtema&&b&&!b.querySelector("[data-assunto]")&&asNorm(($("#layer .pfv-as")||{dataset:{}}).dataset.sub)!==asNorm(d.subtema)){const n=asDados(d.subtema);const tot=n?n.agora.length+n.antes.length:0;
    if(tot>1)b.insertAdjacentHTML("afterbegin",`<button type="button" class="as-link" data-assunto="${esc(d.subtema)}">Tudo sobre ${esc(d.subtema)} <span>${tot} histórias ›</span></button>`)}}catch(e){}return r}}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  const a=t.closest("[data-assunto]");if(a){e.stopPropagation();e.preventDefault();const sub=a.dataset.assunto;if($("#layer").innerHTML)closeLayer();setTimeout(()=>abrirAssunto(sub),$(".sheet")?260:0);return}
  const c=t.closest("#layer .pfv-as [data-ascob]");if(c){e.stopPropagation();abrirPagCob(c.dataset.ascob);return}
  const d=t.closest("#layer .pfv-as [data-asdorm]");if(d){e.stopPropagation();abrirDormente(d.dataset.asdorm);return}},true);


