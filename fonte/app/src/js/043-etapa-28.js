/* ---------- Etapa 28 ---------- */
/* fotos de arquivo sem repetir na edição: a de maior prioridade escolhe primeiro */
var FA_MAP=null,FA_MAPK="";
function faNome(u){try{u=String(u||"").split("?")[0];const m=u.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//i);return decodeURIComponent(m?m[1]:u.split("/").pop()).toLowerCase()}catch(e){return String(u).split("?")[0].split("/").pop().toLowerCase()}}
function faPessoa(tit,A){let best=null,pos=1e9,len=0;Object.values(A.pessoas||{}).forEach(x=>{(x&&Array.isArray(x.chaves)?x.chaves:[]).forEach(k=>{if(typeof k!=="string"||!k)return;const i=posPalavra(tit,k);if(i>=0&&(i<pos||(i===pos&&k.length>len))){pos=i;len=k.length;best=x}})});return best}
function faListas(p,A){const L=[],T=A.temas||{},sec=secOf(p),tit=String((p.neutro||{}).titulo||"");
  const pe=p.foto_arquivo==="tema"?null:faPessoa(tit,A);if(pe&&Array.isArray(pe.fotos)&&pe.fotos.length)L.push(pe.fotos);
  const as=faAssunto(tit,A,sec);if(as&&Array.isArray(as.fotos)&&as.fotos.length)L.push(as.fotos);
  const t=T[sec+"/"+(p.subtema||"")];if(Array.isArray(t)&&t.length)L.push(t);
  const d=T[(A.padrao||{})[sec]];if(Array.isArray(d)&&d.length&&d!==t)L.push(d);return L}
function faValida(f){return f&&typeof f.url==="string"&&FOTO_OK.test(f.url)}
function faMapa(){const A=FOTOS_ARQ;if(!A||!FEED||!Array.isArray(FEED.pautas))return null;
  const k=(A.gerado||"")+"|"+(FEED.atualizado_em||"")+"|"+FEED.pautas.map(p=>p.id+":"+(p.prioridade||0)+":"+((p.neutro||{}).titulo||"")).join(",");
  if(FA_MAP&&FA_MAPK===k)return FA_MAP;
  const usados=new Set(),M={},pr=p=>typeof p.prioridade==="number"?p.prioridade:0;
  const ord=FEED.pautas.map((p,i)=>[p,i]).sort((a,b)=>pr(b[0])-pr(a[0])||a[1]-b[1]).map(x=>x[0]),dup=new Set();
  ord.forEach(p=>{const f=p&&p.foto;if(f&&faValida(f)){const n=faNome(f.url);if(usados.has(n))dup.add(p.id);else usados.add(n)}});
  ord.forEach(p=>{if(!p||!p.id||(p.foto&&faValida(p.foto)&&!dup.has(p.id)))return;
    const L=faListas(p,A),h=hashStr(p.id);let esc=null;
    for(const l of L){for(let j=0;j<l.length;j++){const f=l[(h+j)%l.length];if(faValida(f)&&!usados.has(faNome(f.url))){esc=f;break}}if(esc)break}
    if(!esc&&L.length){const f=L[0][h%L[0].length];if(faValida(f))esc=f}
    if(!esc&&dup.has(p.id))return;
    if(esc){usados.add(faNome(esc.url));M[p.id]={url:esc.url,credito:esc.credito||"Foto de arquivo: Wikimedia Commons",alt:esc.alt||"Foto de arquivo",arquivo:1}}});
  FA_MAP=M;FA_MAPK=k;return M}
const _fotoDe27=fotoDe;
fotoDe=function(p){const f=p&&p.foto;if(f&&typeof f==="object"&&faValida(f)){const M=faMapa();if(M&&p.id&&M[p.id]&&FEED.pautas.some(q=>q===p))return M[p.id];return f}return fotoArquivo(p)};
const _fotoArquivo27=fotoArquivo;
fotoArquivo=function(p){if(!p||!p.id)return null;const M=faMapa();
  if(M&&FEED.pautas.some(q=>q===p||q.id===p.id&&((q.neutro||{}).titulo===(p.neutro||{}).titulo)))return M[p.id]||null;
  if(p.foto_arquivo==="tema")return _fotoArquivo27({...p,neutro:{...(p.neutro||{}),titulo:""}});
  return _fotoArquivo27(p)};

/* crédito curto; um toque mostra o crédito completo (autor, acervo e licença) */
function creditoCurto(c){c=String(c||"").trim();const arq=/^foto de arquivo/i.test(c);
  let t=c.replace(/^foto( de arquivo)?\s*:\s*/i,"").replace(/\s*\([^()]*\)\s*$/,"").replace(/\s*(via|\/)\s*Wikimedia Commons\s*$/i,"").replace(/\s*\/\s*Commons\s*$/i,"").trim();
  if(!t)t="Wikimedia Commons";if(t.length>34)t=t.slice(0,33).replace(/[\s/,.;-]+$/,"")+"…";
  return (arq?"Arquivo · ":"Foto: ")+t}
function credHTML(c,cls){return `<small class="${cls}" data-credfull="${esc(c)}" data-credcurto="${esc(creditoCurto(c))}" title="${esc(c)}">${esc(creditoCurto(c))}</small>`}
window.addEventListener("click",e=>{const el=e.target&&e.target.closest&&e.target.closest("[data-credfull]");if(!el)return;e.stopPropagation();e.preventDefault();
  const longo=el.classList.toggle("cred-longo");el.textContent=longo?el.dataset.credfull:el.dataset.credcurto},true);

/* correções visíveis */
function corUltima(p){const c=(p&&p.correcoes||[]).filter(x=>x&&x.texto);if(!c.length)return null;return c.reduce((a,b)=>tms(b.hora)>tms(a.hora)?b:a)}
function corRecente(p){const c=corUltima(p);return !!(c&&c.hora&&Date.now()-tms(c.hora)<48*3600e3)}
function matCorSelo(p){const c=corUltima(p);if(!c)return "";return `<button type="button" class="mat-corr" data-matcorr>${c.hora?"Corrigida "+esc(diaHora(c.hora)):"Corrigida"}</button>`}
function matCorBloco(p){const c=(p.correcoes||[]).filter(x=>x&&x.texto);if(!c.length)return "";
  return `<div class="mat-fix" id="mat-fix"><b>${c.length>1?"Correções":"Correção"}</b>${c.map(x=>`<p>${x.hora?`<span>${esc(diaHora(x.hora))}</span> `:""}${esc(x.texto)}</p>`).join("")}</div>`}
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-matcorr]");if(!b)return;e.stopPropagation();const el=document.getElementById("mat-fix");if(el)el.scrollIntoView({behavior:"smooth",block:"center"})});

/* resumo com título próprio (fechamento da noite, semana no fim de semana) */
function resumoTitulo(){const t=FEED&&FEED.resumo_dia&&FEED.resumo_dia.titulo;return typeof t==="string"&&t.trim().length>=3&&t.trim().length<=40?t.trim():"O dia em 1 minuto"}
/* agenda da semana no fim de semana */
function fimDeSemana(){const d=new Date(hojeSP()+"T12:00:00Z").getUTCDay();return d===0||d===6}
function agDiaTxt(d,hj,am){if(d===hj)return "Hoje";if(d===am)return "Amanhã";const x=new Date(d+"T12:00:00Z");return ["dom","seg","ter","qua","qui","sex","sáb"][x.getUTCDay()]+" ("+x.getUTCDate()+")"}

/* "desde a sua última visita": novas e atualizadas, com a última atualização de cada uma */
function capaNovBar(){const l=capaNovas();if(!l.length)return "";const nv=l.filter(p=>NOVAS.has(p.id)).length,up=l.length-nv;
  const t=[nv?`${nv} ${nv===1?"nova":"novas"}`:"",up?`${up} ${up===1?"atualizada":"atualizadas"}`:""].filter(Boolean).join(" · ");
  return `<button type="button" class="cp-nov" data-cpnov aria-label="${esc(t)} desde a sua última visita"><span class="nb-d"></span><span class="cp-nov-t"><b>${t}</b>${VISITA0&&hhmm(VISITA0)?` desde ${esc(desdeCurto(VISITA0))}`:" desde a última visita"}</span><span class="chev" aria-hidden="true">›</span></button>`}
function desdeCurto(iso){const d=new Date(iso);if(isNaN(d))return "";const hj=dataSP(),dd=dataSP(iso),h=hhmm(iso);if(dd===hj)return "as "+h;
  const ont=somaDias(hj,-1);if(dd===ont)return "ontem, "+h;return d.toLocaleDateString("pt-BR",{weekday:"short",timeZone:"America/Sao_Paulo"}).replace(".","")+", "+h}
function abrirNovCapa(){const l=capaNovas();const L=lente();const pr=p=>typeof p.prioridade==="number"?p.prioridade:0;l.sort((a,b)=>(NOVAS.has(b.id)-NOVAS.has(a.id))||pr(b)-pr(a));
  sheet("Desde a sua última visita",`${VISITA0?`<p class="hint" style="margin:0">Sua última visita foi ${esc(diaHora(VISITA0))}.</p>`:""}${l.length?"":`<p class="hint">Você já viu todas as novidades.</p>`}<ul class="mud-l">${l.map(p=>{const nv=NOVAS.has(p.id);const ups=(p.atualizacoes||[]).filter(u=>u&&u.texto&&(!VISITA0||tms(u.hora)>tms(VISITA0)));const u=ups.length?ups.reduce((a,b)=>tms(b.hora)>tms(a.hora)?b:a):null;
    return `<li><button type="button" data-cpnovir="${esc(p.id)}"><b class="mud-k ${nv?"nova":"atualizada"}">${nv?"Nova":"Atualizada"}</b><span class="mud-t">${esc(versao(p,L).titulo||"")}</span>${u?`<span class="mud-x">${u.hora?esc(hhmm(u.hora))+" · ":""}${esc(u.texto)}</span>`:""}</button></li>`}).join("")}</ul>`);uso("capa_desde")}

/* versão nova do app já na primeira abertura: se ninguém mexeu ainda, recarrega na hora;
   senão, quando a pessoa voltar ao app depois de alguns minutos */
var VERSAO_NOVA=null,MEXEU=0,SAIU_V=0;
["pointerdown","keydown","wheel","touchstart"].forEach(ev=>addEventListener(ev,()=>{MEXEU=1},{capture:true,passive:true}));
function tentarRecarregar(voltou){if(!VERSAO_NOVA)return;if(voltou&&temJanela()){window.RECARGA_PEND=1;return}if(voltou||(!MEXEU&&scrollY<40&&!temJanela())){try{sessionStorage.setItem("prumo-recarregou",VERSAO_NOVA)}catch(e){}location.reload()}}
async function checarVersao(){try{if(!/^[0-9a-f]{12}$/.test(APP_VERSAO))return;if(navigator.webdriver&&localStorage.getItem("prumo-teste-versao")!=="1")return;
  const r=await fetch("versao.json",{cache:"no-cache"});if(!r.ok)return;const d=await r.json();const v=d&&d.v;
  if(typeof v!=="string"||!/^[0-9a-f]{12}$/.test(v)||v===APP_VERSAO)return;
  try{if(sessionStorage.getItem("prumo-recarregou")===v)return}catch(e){}
  if("caches" in window){const resp=await fetch("./",{cache:"no-cache"});if(!resp.ok)return;const txt=await resp.clone().text();if(txt.indexOf('"'+v+'"')<0)return;
    try{const c=await caches.open("prumo-v1");await c.put("./",resp)}catch(e){}}
  VERSAO_NOVA=v;tentarRecarregar(false)}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.hidden){SAIU_V=Date.now();return}if(VERSAO_NOVA&&SAIU_V&&Date.now()-SAIU_V>30e3)tentarRecarregar(true);else if(!VERSAO_NOVA&&SAIU_V&&Date.now()-SAIU_V>30e3&&Date.now()-(window.VER_CHK||0)>120e3){window.VER_CHK=Date.now();checarVersao().then(()=>{if(VERSAO_NOVA)tentarRecarregar(true)})}});
setTimeout(checarVersao,1200);

