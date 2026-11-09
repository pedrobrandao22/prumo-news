/* ---------- Etapa 16 ---------- */
/* abrir só o que aparece: o Feed é desenhado quando for usado (ou num momento ocioso) */
var FEED_ADIADO=!!window.__feedAdiado,RF_REAL=renderFeed;
if(FEED_ADIADO){const f=()=>{if(FEED_ADIADO&&VIEW!=="feed"){FEED_ADIADO=false;try{RF_REAL()}catch(e){}}};window.requestIdleCallback?requestIdleCallback(f,{timeout:3000}):setTimeout(f,1200)}
renderFeed=function(){if(VIEW!=="feed"&&FEED&&document.querySelector("#v-capa .cpi")){if(VIEW==="capa"){try{renderCapa()}catch(e){}}FEED_ADIADO=true;if(!renderFeed._t){const f=()=>{renderFeed._t=0;if(FEED_ADIADO&&VIEW!=="feed"){FEED_ADIADO=false;try{RF_REAL()}catch(e){}}};renderFeed._t=window.requestIdleCallback?requestIdleCallback(f,{timeout:3000}):setTimeout(f,1200)}return}FEED_ADIADO=false;return RF_REAL.apply(this,arguments)};
(function(){const ant=go;go=function(v){if(v==="feed"&&FEED_ADIADO){FEED_ADIADO=false;try{RF_REAL()}catch(e){}}return ant.apply(this,arguments)}})();
/* eventos de uso, anônimos (sem conta, sem nome): aparelho = número aleatório guardado no aparelho */
var EV_FILA=[],EV_OFF=false,EV_SESS=(function(){try{let s=localStorage.getItem("prumo-aparelho");if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("prumo-aparelho",s)}return s}catch(e){return "sem-"+Math.random().toString(36).slice(2)}})();
function evento(tipo,pid,secao){if(EV_OFF||navigator.webdriver&&!window.__evTeste)return;EV_FILA.push({p_sessao:EV_SESS,p_tipo:tipo,p_pid:pid||null,p_secao:secao||null,p_origem:(matchMedia("(display-mode: standalone)").matches||navigator.standalone)?"app":"site"});clearTimeout(evento._t);evento._t=setTimeout(enviarEventos,1500)}
var EV_TENT=0;async function enviarEventos(){if(EV_OFF||!EV_FILA.length)return;let c=null;try{c=typeof sbCliente==="function"?sbCliente():null}catch(e){}
  if(!c||typeof c.rpc!=="function"){if(++EV_TENT<15)evento._t=setTimeout(enviarEventos,4000);return}const l=EV_FILA.splice(0,20);
  for(const a of l){try{const r=await c.rpc("registrar_evento",a);if(r&&r.error)throw r.error}catch(e){const m=String(e&&(e.message||e.code)||"");if(/registrar_evento|PGRST202|42883|function/i.test(m)){EV_OFF=true;EV_FILA=[];return}}}if(EV_FILA.length)evento._t=setTimeout(enviarEventos,1000)}
var EV_ABRIU=0;function eventoAbrir(){if(Date.now()-EV_ABRIU<15*60e3)return;EV_ABRIU=Date.now();evento(LINK_PID?"link":"abrir",LINK_PID||null)}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)eventoAbrir();else if(EV_FILA.length)enviarEventos()});
/* link de matéria: /m/<id>.html ou #m=<id> abre a matéria */
var LINK_PID=(function(){let pid=null;const h=location.hash.match(/^#m=([\w-]{1,80})$/);if(h)pid=h[1];else{const m=location.pathname.match(/\/m\/([\w-]{1,80})\.html$/);if(m)pid=m[1]}
  if(pid){try{history.replaceState(history.state,"",location.pathname.replace(/\/m\/[\w-]+\.html$/,"/")+location.search)}catch(e){}}return pid})(),LINK_T0=Date.now();
eventoAbrir();
function linkTentar(){if(!LINK_PID||!FEED)return;const pid=LINK_PID;if(pautaById(pid)){LINK_PID=null;setTimeout(()=>{if(VIEW!=="capa")go("capa");if(!$("#layer").innerHTML)abrirMateria(pid)},60);return}
  if(Date.now()-LINK_T0>8000){LINK_PID=null;setTimeout(()=>toast("Essa notícia já saiu da edição. Veja as de agora."),300)}}
/* faixa Agora: assuntos do momento (novidades.json, de hora em hora pelo GitHub) */
/* 141: a última faixa fica guardada no aparelho (a Capa da volta ao app já sai com ela, em vez de a faixa entrar depois e empurrar
   a Capa) e o primeiro pedido é o da pré-carga do <head> */
var NOVID_AG=(function(){try{const d=JSON.parse(localStorage.getItem("prumo-novid")||"null");return d&&typeof d==="object"?d:null}catch(e){return null}})(),AG_ROT=0;
async function carregarAgora(){try{const pre=typeof ab141Pre!=="undefined"&&ab141Pre.novid;let d;if(pre){ab141Pre.novid=null;d=await pre}
  if(!d){const r=await fetch("novidades.json?t="+Math.floor(Date.now()/6e4),{cache:"no-store"});if(!r.ok)return;d=await r.json()}
  if(d&&typeof d==="object"){NOVID_AG=d;try{localStorage.setItem("prumo-novid",JSON.stringify(d))}catch(e){}atualizarAgora()}}catch(e){}}
function agHoraMs(h){const m=typeof h==="string"&&h.match(/^(\d{2})\/(\d{2}) (\d{2})h(\d{2})$/);if(!m)return 0;const agora=new Date();let ano=agora.getFullYear();let t=Date.parse(`${ano}-${m[2]}-${m[1]}T${m[3]}:${m[4]}:00-03:00`);if(t>Date.now()+864e5)t=Date.parse(`${ano-1}-${m[2]}-${m[1]}T${m[3]}:${m[4]}:00-03:00`);return t||0}
function assuntoCurto(t){let s=String(t||"").replace(/\s+/g," ").trim();s=s.replace(/[;,.:–-]?\s*\b(veja|entenda|saiba|confira|assista|ao vivo)\b.*$/i,"").trim();s=s.replace(/[\s;,:–-]+$/,"");
  if(s.length>170){const c=s.slice(0,170);s=c.replace(/\s+\S*$/,"")+"…"}return s}
/* vídeos, programas e edições de telejornal não são notícia para o "Agora" */
const AG_LIXO=/^\s*(?:v[íi]deos?|assista|ou[çc]a|podcast|ao vivo|programa)\b|jornal d[aoe]s?\s|\bedi[çc][ãa]o d[aoe]\b|\bde (?:segunda|ter[çc]a|quarta|quinta|sexta)-feira,\s*\d/i;
function agoraItens(){const d=NOVID_AG;if(!d||!FEED)return [];const g=Date.parse(d.gerado||"");if(g&&Date.now()-g>4*3600e3)return [];const ag=Date.now(),out=[],vistos=new Set();
  const hMax=ms=>{const hs=(Array.isArray(ms)?ms:[]).map(m=>agHoraMs(m&&m.hora)).filter(Boolean);return hs.length?Math.max(...hs):0};
  (Array.isArray(d.novos)?d.novos:[]).forEach(n=>{if(!n||!n.assunto)return;if(!(n.relevante||(n.n_fontes||0)>=2))return;const h=hMax(n.manchetes);if(!h||ag-h>3*3600e3)return;const t=[n.assunto,...(Array.isArray(n.manchetes)?n.manchetes.map(m=>m&&m.titulo):[])].map(assuntoCurto).find(x=>x&&x.replace("…","").length>=24);if(!t||vistos.has(t)||AG_LIXO.test(t)||AG_LIXO.test(String(n.assunto)))return;vistos.add(t);
    out.push({t,h,peso:(n.relevante?10:0)+(n.n_fontes||0)+(["politica","economia"].includes(n.secao)?3:0)})});
  const ep=d.em_pautas&&typeof d.em_pautas==="object"&&!Array.isArray(d.em_pautas)?d.em_pautas:{};
  Object.entries(ep).forEach(([pid,x])=>{const p=pautaById(pid);if(!p||!x)return;const n=x.n_fontes||(Array.isArray(x.fontes)?x.fontes.length:0);if(n<3)return;const h=hMax(x.manchetes);if(!h||ag-h>3*3600e3)return;
    const ms=(Array.isArray(x.manchetes)?x.manchetes:[]).filter(m=>m&&m.titulo&&!AG_LIXO.test(m.titulo)).sort((a,b)=>agHoraMs(b.hora)-agHoraMs(a.hora));
    const tt=ms.map(m=>assuntoCurto(m.titulo)).find(t=>t&&t.replace("…","").length>=24);
    out.push({t:tt||temaDe(p)||versao(p,lente()).titulo,h,pid,peso:8+n})});
  return out.sort((a,b)=>b.peso-a.peso||b.h-a.h).slice(0,4)}
function agoraHTML(){const l=agoraItens();if(!l.length)return "";
  const um=l.map((x,i)=>`<span class="ag-i" data-agi="${i}" data-agstrip="${esc(x.pid||"")}"><time>${esc(quando(new Date(x.h).toISOString()).replace("há ",""))}</time>${esc(x.t)}</span><i class="ag-sep" aria-hidden="true"></i>`).join("");
  const n=l.reduce((a,x)=>a+x.t.length+12,0);
  return `<div class="cp-agora" role="region" aria-label="Agora: ${esc(l.map(x=>x.t).join("; "))}"><button type="button" class="ag-lbl" data-agora><i></i>Agora</button><div class="ag-vp"><div class="ag-run" style="animation-duration:${Math.max(18,Math.round(n*.17))}s">${um}${um}</div></div></div>`}
function atualizarAgora(){if(VIEW!=="capa")return;const old=$("#v-capa .cp-agora"),nh=agoraHTML(),cp=$("#v-capa .cp");
  if(old){if(nh&&old.outerHTML===nh)return;if(nh){const w=document.createElement("div");w.innerHTML=nh;old.replaceWith(w.firstElementChild)}else{const h=old.offsetHeight;old.remove();if(scrollY>=40)window.scrollBy(0,-h)}return}
  if(!nh||!cp)return;const w=document.createElement("div");w.innerHTML=nh;const el=w.firstElementChild;const tp=cp.querySelector(":scope>.cp-top");cp.insertBefore(el,tp?tp.nextSibling:cp.firstChild);
  const cs=getComputedStyle(el),alt=el.offsetHeight+parseFloat(cs.marginTop)+parseFloat(cs.marginBottom);
  if(scrollY>=40||$("#layer").innerHTML)window.scrollBy(0,alt);else if(ANIM_OK())el.classList.add("ag-entra")}
setInterval(()=>{if(1)return;const b=null;if(!b)return;const it=[];if(it.length<2)return;AG_ROT=(it.findIndex(x=>x.classList.contains("on"))+1)%it.length;it.forEach((x,i)=>x.classList.toggle("on",i===AG_ROT));const em=b.querySelector("em");if(em)em.textContent=quando(new Date(+it[AG_ROT].dataset.h).toISOString())},5000);
function abrirAgora(){const l=agoraItens();
  sheet("Agora",`<p class="hint" style="margin:0">Assuntos que acabaram de aparecer nos noticiários. O Prumo confere e traz na próxima atualização.</p><ul class="ag-l">${l.map(x=>`<li>${x.pid?`<button type="button" data-agpid="${esc(x.pid)}"><span>${esc(x.t)}</span><em>${esc(quando(new Date(x.h).toISOString()))} · ler ›</em></button>`:`<div><span>${esc(x.t)}</span><em>${esc(quando(new Date(x.h).toISOString()))}</em></div>`}</li>`).join("")}</ul>`)}
carregarAgora();setInterval(()=>{if(!document.hidden)carregarAgora()},10*6e4);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)carregarAgora()});
(function(){const ant=renderCapa;renderCapa=function(){const r=ant.apply(this,arguments);try{linkTentar()}catch(e){}return r}})();
/* painel de uso (Administração › Uso) */
var USO_DIAS=14;
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-usodias]");if(b){USO_DIAS=+b.dataset.usodias||14;S.adm.uso=null;usoDesenhar();usoCarregar()}});
async function usoCarregar(){const b=$("#admbox");try{S.adm.uso=await S.db.rpc("admin_painel",{p_dias:USO_DIAS})}catch(e){S.adm.uso={erro:String(e&&(e.message||e.code)||"")}}usoDesenhar()}
function usoBarras(l,rot,val,fmt){const mx=Math.max(1,...l.map(val));return `<ul class="uso-b">${l.map(x=>`<li><span>${esc(rot(x))}</span><i style="width:${(val(x)*100/mx).toFixed(1)}%"></i><b>${esc(fmt?fmt(val(x)):String(val(x)))}</b></li>`).join("")}</ul>`}
function usoDesenhar(){const b=$("#admbox");if(!b||S._admAba!=="uso")return;const d=S.adm.uso;
  if(!d){b.innerHTML=`<p class="hint">Carregando…</p>`;return}
  if(d.erro){b.innerHTML=/admin_painel|PGRST202|42883|function/i.test(d.erro)?`<p class="hint">O painel ainda não está ligado no banco. Rode uma vez o arquivo <b>tools/painel-uso.sql</b> do repositório no Supabase (SQL Editor › New query › colar › Run). Depois disso os números começam a aparecer.</p>`:`<p class="erro-t">Não deu para carregar agora.</p>`;return}
  const dias=Array.isArray(d.dias)?d.dias:[],hj=hojeSP(),dh=dias.find(x=>x.dia===hj)||{aparelhos:0,aberturas:0,materias:0};const u7=dias.filter(x=>x.dia>=somaDias(hj,-6));
  const s7=k=>u7.reduce((a,x)=>a+(+x[k]||0),0);const media=u7.length?Math.round(s7("aparelhos")/7*10)/10:0;
  let h=`<div class="segs uso-per" role="tablist">${[7,14,30].map(n=>`<button type="button" data-usodias="${n}" aria-selected="${USO_DIAS===n}">${n} dias</button>`).join("")}</div>`;
  h+=`<div class="uso-k"><div><span>Hoje</span><b>${dh.aparelhos}</b><em>${dh.aparelhos===1?"aparelho":"aparelhos"}</em></div><div><span>Aberturas hoje</span><b>${dh.aberturas}</b><em>${dh.materias} matérias lidas</em></div><div><span>Média 7 dias</span><b>${String(media).replace(".",",")}</b><em>aparelhos por dia</em></div><div><span>No período</span><b>${d.total_aparelhos||0}</b><em>aparelhos diferentes</em></div></div>`;
  h+=`<b class="cm-h">Por dia · aparelhos</b>${dias.length?usoBarras(dias.slice().reverse(),x=>dataCurta(x.dia),x=>+x.aparelhos||0):`<p class="hint">Sem dados ainda.</p>`}`;
  const hs=Array.isArray(d.horas)?d.horas:[];if(hs.length){const mx=Math.max(1,...hs.map(x=>+x.n||0));h+=`<b class="cm-h">Horário das aberturas</b><div class="uso-h">${Array.from({length:24},(_,i)=>{const x=hs.find(y=>+y.hora===i);const n=x?+x.n:0;return `<i title="${i}h: ${n}" style="height:${(4+n*56/mx).toFixed(0)}px"></i>`}).join("")}</div><div class="uso-hx"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>`}
  const sc=Array.isArray(d.secoes)?d.secoes:[];if(sc.length)h+=`<b class="cm-h">Matérias lidas por seção</b>${usoBarras(sc,x=>secNome(x.secao||"politica"),x=>+x.n||0)}`;
  const tp=Array.isArray(d.top)?d.top:[];if(tp.length)h+=`<b class="cm-h">Mais lidas</b><ol class="uso-t">${tp.map(x=>{const p=pautaById(x.pid);return `<li><span>${esc(p?(p.neutro||{}).titulo:x.pid)}</span><b>${x.n}</b></li>`}).join("")}</ol>`;
  const org=Array.isArray(d.origem)?d.origem:[];if(org.length)h+=`<p class="hint">Como abrem: ${org.map(x=>`${x.origem==="app"?"app instalado":x.origem==="site"?"navegador":x.origem==="link"?"link compartilhado":esc(x.origem||"?")} ${x.n}`).join(" · ")}. Compartilhamentos no período: ${d.compartilhamentos||0}.</p>`;
  h+=`<p class="hint">Contagem anônima: o Prumo não guarda quem leu, só um número aleatório por aparelho.</p>`;b.innerHTML=h}

