/* ---------- 200: Capa (Fase 3) — a Capa num módulo só ----------
   Antes: definida no 031 e remendada em 033, 035, 039, 048, 085, 104, 106, 107, 116, 141, 159, 168, 182, 184 e 186.
   Aqui cada função é a versão final, com o que a cadeia fazia hoje (nada muda para quem usa).
   Fica onde está (é de outras áreas ou dividido com elas): versao/lente/capaSub/capaArte/capaChapeu/fotos (031),
   os cliques da Capa no ouvinte geral do 031, capaNovBar/capaLargo/capaObservar (033), agoraHTML (035), ab141* (141),
   ca159Sino/ca159Lp/ca159Evento (159), cm168Ult/cm168Velha/cm168Quando (168), cp106Coracao, fc107Capa, rc116AvisoCapa,
   nm186EmDia e os remendos de go, atDot, renderPosts e abrirGrafico. Prefixo de nomes novos: cp200. */

/* ===== manchete fixada pelo administrador ===== */
var CAPA_FIXA=null,CAPA_T=0;
async function carregarCapaFixa(forcar){if(!forcar&&Date.now()-CAPA_T<120000)return;CAPA_T=Date.now();
  try{const c=sbCliente();if(!c||typeof c.rpc!=="function")return;const r=await c.rpc("capa_fixa");if(r&&!r.error){const v=r.data;const ant=JSON.stringify(CAPA_FIXA);CAPA_FIXA=v&&v.pid?v:null;if(JSON.stringify(CAPA_FIXA)!==ant&&VIEW==="capa")renderCapa()}}catch(e){}}
function capaAdminHTML(){if(!FEED)return `<p class="hint">As notícias ainda não carregaram.</p>`;const {ord,man,fixa}=capaEscolha();const fx=CAPA_FIXA&&tms(CAPA_FIXA.ate)>Date.now()?CAPA_FIXA:null;
  return `<div class="adm-capa" style="display:flex;flex-direction:column;gap:10px">${fx?`<div class="pin"><b>Manchete fixada</b> até ${esc(cobDH(fx.ate))}${pautaById(fx.pid)?`: ${esc(pautaById(fx.pid).neutro?.titulo)}`:" (essa notícia saiu da edição; a capa usa a escolha da rodada)"}<br><button type="button" class="btn ghost amg-b" data-desfixar style="margin-top:8px">Desfixar</button></div>`:`<p class="hint" style="margin:0">Agora a rodada escolhe a manchete${man?`: <b>${esc(man.neutro?.titulo)}</b>`:""}.</p>`}
    <label class="hint" style="display:flex;align-items:center;gap:8px">Fixar por <select id="admhoras" class="field" style="width:auto;flex:none"><option value="3">3 horas</option><option value="6">6 horas</option><option value="12" selected>12 horas</option><option value="24">24 horas</option></select></label>
    <ul class="adml">${ord.slice(0,15).map(p=>`<li><div><b>${esc(p.neutro?.titulo)}</b><span>${esc(secNome(secOf(p)))} · prioridade ${esc(p.prioridade??"-")}${fx&&fx.pid===p.id?" · fixada":man===p&&!fixa?" · manchete agora":""}</span></div><div class="admb"><button type="button" class="btn ghost amg-b" data-fixar="${esc(p.id)}">Fixar</button></div></li>`).join("")}</ul>
    <p class="hint" style="margin:0">A manchete fixada vale para todos e some sozinha no prazo, ou quando a notícia sai da edição.</p></div>`}

/* ===== escolha do que entra (manchete, destaques e a ordem das seções) ===== */
function capaEscolha(){const r=(()=>{const ps=(FEED?.pautas||[]).filter(p=>!(PREF.ocultas||[]).includes(secOf(p))&&!silenciado(p));const by=id=>ps.find(p=>p.id===id);
  const pr=p=>typeof p.prioridade==="number"?p.prioridade:0;const ord=[...ps].sort((a,b)=>pr(b)-pr(a)||String(b.hora).localeCompare(String(a.hora)));
  const fx=CAPA_FIXA&&CAPA_FIXA.pid&&tms(CAPA_FIXA.ate)>Date.now()?by(CAPA_FIXA.pid):null;const c=FEED?.capa||{};
  const man=fx||by(c.manchete)||ord[0];if(!man)return {ps,ord,man:null,dest:[]};
  let dest=(Array.isArray(c.destaques)?c.destaques:[]).map(by).filter(p=>p&&p!==man);
  if(dest.length<3){const n={};[man,...dest].forEach(p=>n[secOf(p)]=(n[secOf(p)]||0)+1);for(const p of ord){if(dest.length>=4)break;if(p===man||dest.includes(p)||(n[secOf(p)]||0)>=2)continue;dest.push(p);n[secOf(p)]=(n[secOf(p)]||0)+1}}
  return {ps,ord,man,dest:dest.slice(0,5),fixa:!!fx,linha:!fx&&c.manchete===man.id?c.linha_fina:""}})();
  /* 159: chamada de evento que já passou (escrita antes dele) sai das seções e dos destaques (a manchete fica) */
  try{if(r&&Array.isArray(r.ord)){const ag=Date.now(),vel=new Set(r.ord.filter(p=>p!==r.man&&ca159Passou(p,ag)).map(p=>p.id));
    if(vel.size){r.ord=r.ord.filter(p=>!vel.has(p.id));if(Array.isArray(r.dest))r.dest=r.dest.filter(p=>!vel.has(p.id))}}}catch(e){}
  /* 168: na editoria, a notícia velha não abre a lista (com foto grande) se há outra mais nova */
  try{if(r&&Array.isArray(r.ord)){const nova=[],velha=[];r.ord.forEach(p=>(cm168Velha(p)?velha:nova).push(p));r.ord=nova.concat(velha)}}catch(e){}
  return r}
/* 159: escrito antes do evento e o evento já passou: a chamada está vencida */
function ca159Passou(p,agora){try{const n=p&&p.neutro||{},tit=String(n.titulo||"");if(!tit)return false;
  const ts=(Array.isArray(p.titulos)?p.titulos:[]).filter(x=>x&&x.titulo===tit&&x.hora),esc0=ts.length?ts[0].hora:p.hora;
  const ev=ca159Evento(tit,esc0);if(!ev)return false;const w=tms(esc0);if(!w)return false;
  const antes=ev.hora?w<ev.ini:ca159DiaSP(esc0)<ca159DiaSP(new Date(ev.ini+12*3600e3).toISOString());
  return antes&&(agora||Date.now())>ev.fim}catch(e){return false}}

/* ===== cabeçalho ===== */
/* "Atualizada às 9h12 · ter, 17 de nov" (159; antes "Edição da manhã/noite", que fica só se a hora não puder ser escrita) */
/* causa horario-da-edicao (corretor 20/11): UMA fonte para "de quando é isto" em todo o app — a última coisa que mudou:
   o feed (atualizado_em) ou, depois dele, uma notícia de "Acabou de sair" (208) ou da faixa "Agora" (035). Antes só o topo da
   Capa e o rodapé do Feed somavam as novidades (210, ct210UltMud); o rodapé da Capa, o Perfil, a folha "Atualizações de hoje",
   a faixa "Sem conexão" e a Capa pré-desenhada (121) liam só o atualizado_em e ficavam com a hora da última rodada completa. */
function horaEdicaoMs(){let m=Date.parse((FEED&&FEED.atualizado_em)||"");if(!isFinite(m))return NaN;const ag=Date.now()+60e3;
  try{(typeof ac208Itens==="function"?ac208Itens():[]).forEach(x=>{const h=+(x&&x.h);if(h>m&&h<=ag)m=h})}catch(e){}
  try{(typeof agoraItens==="function"?agoraItens():[]).forEach(x=>{const h=+(x&&x.h);if(h>m&&h<=ag)m=h})}catch(e){}return m}
function horaEdicaoIso(){const m=horaEdicaoMs();return isFinite(m)?new Date(m).toISOString():((FEED&&FEED.atualizado_em)||"")}
/* "edição das 15h43" (hoje) ou "edição de quinta às 21h49" — Perfil e faixa "Sem conexão" */
function horaEdicaoTxt(){const i=horaEdicaoIso();if(!i)return "";return dataSP(i)===hojeSP()?"das "+hhmm(i):"de "+horaDia(i)}
function capaEdicao(){const d=new Date(horaEdicaoMs());if(isNaN(d))return "";
  const hm=()=>d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"America/Sao_Paulo"}).split(":"),
    dia=()=>d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short",timeZone:"America/Sao_Paulo"}).replace(/\./g,"");
  try{const p=hm();return "Atualizada às "+(+p[0])+"h"+p[1]+" · "+dia()}
  catch(e){const p=hm(),m=(+p[0])*60+(+p[1]);return (m>=390&&m<1050?"Edição da manhã":"Edição da noite")+" · "+dia()}}

/* ===== cartões ===== */
var CP_AB=null;
function cpItem(p,o){const L=lente(),v=versao(p,L),ab=CP_AB===p.id,lc=lidaAtual(p)?" lida":"";
  const k=`<span class="cp-k" style="color:${secCor(secOf(p))}">${cpNovo(p)}${esc(capaChapeu(p))}${p.status==="ao_vivo"?" · ao vivo":p.status==="encerrada"?" · encerrada":""}${corRecente(p)?`<span class="cp-corr"> · corrigida</span>`:""}</span>`;
  const marca=v.tem?`<em class="cp-lado ${v.lado}" role="img" aria-label="Versão da ${v.lado}"></em>`:"";
  const sub=o.sub?`<span class="cp-sub">${esc(capaSub(p,L,o.linha))}</span>`:"";
  const arte=o.arte?capaArte(p,o.tam==="man"?"art":"cp-th",o.tam==="man"):"";
  let h=`<article class="cpi cpi-${o.tam}${lc}${ab?" aberto":""}" id="cpi-${esc(p.id)}"><button type="button" class="cpi-b" data-cpx="${esc(p.id)}" aria-expanded="${ab}">${o.tam==="man"?arte:""}<span class="tx">${o.tam==="rel"?"":k}<b class="cp-t">${marca}${esc(v.titulo)}</b>${sub}${o.meta||""}</span>${o.tam!=="man"?arte:""}</button>${ab?cpAberta(p):""}</article>`;
  /* 168: notícia sem novidade há mais de 40 h diz de quando é ("de quinta (12)"), menos na manchete */
  /* 19/11 tarde: frase separada ("Sem novidade desde terça (17)") e nada quando o título já traz um dia, para não ler "…sexta (13) de terça (17)" */
  try{const t=o&&o.tam!=="man"&&cm168Velha(p);const tt=Math.max(0,...(Array.isArray(p.titulos)?p.titulos:[]).map(u=>tms(u&&u.hora)||0));/* título reescrito há pouco: não é "sem novidade" */
    if(t&&!cm168Dias(v.titulo).length&&!(tt&&cm168Ref()-tt<CM168_VELHA)){const i=h.indexOf('<b class="cp-t">'),j=i>=0?h.indexOf("</b>",i):-1;
    if(j>0)h=h.slice(0,j+4)+`<span class="cm168-dia">Sem novidade desde ${esc(cm168Dia(t))}</span>`+h.slice(j+4)}}catch(e){}
  return h}
function cpAberta(p){const L=lente(),id=esc(p.id);const pts=pontosDe(p,L);
  let h=`<div class="cpx"><button type="button" class="cpx-30" data-cpmat="${id}" aria-label="Ler a matéria completa"><b>Em 30 segundos</b><ul>${pts.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><span class="cpx-ir">Ler a matéria completa <i aria-hidden="true">›</i></span></button></div>`;
  /* 168: notícia velha avisa no alto do resumo */
  try{const t=cm168Velha(p);if(t)h=h.replace('<div class="cpx">',`<div class="cpx"><p class="cm168-velha">Notícia de ${esc(cm168Dia(t))}, às ${esc(hhmm(new Date(t).toISOString()).replace(/^0/,""))}, sem novidade desde então.</p>`)}catch(e){}
  /* 182: "Em 30 segundos" vira "Resumo" (com o "Em 1 min" ligado) */
  if(FT182_EM1MIN&&typeof h==="string")h=h.replace("<b>Em 30 segundos</b>","<b>Resumo</b>");
  return h}

/* ===== "Em 1 min" ===== */
/* 182: fica no lugar de sempre, no meio da Capa (Pedro, 17/11: não no topo) */
function ft182Um(){if(!FEED)return "";let ps=[];try{ps=capaEscolha().ps}catch(e){ps=FEED.pautas||[]}
  const rd=FEED.resumo_dia&&Array.isArray(FEED.resumo_dia.itens)?FEED.resumo_dia.itens.filter(x=>x&&typeof x.texto==="string"&&x.texto.trim()):[];
  let it=rd.filter(x=>!x.pid||ps.some(p=>p.id===x.pid)).slice(0,5);
  if(!it.length){const pr=p=>typeof p.prioridade==="number"?p.prioridade:0;it=[...ps].sort((a,b)=>pr(b)-pr(a)).slice(0,5).map(p=>({pid:p.id,texto:versao(p,lente()).titulo||""})).filter(x=>x.texto)}
  if(!it.length)return "";
  return `<section class="cp-1m ft182-1m" aria-label="Em 1 min"><h3><span>Em 1 min</span><button type="button" class="cp-1m-sh" data-1mshare aria-label="Mandar o resumo">${ICON.send}<span>Mandar</span></button></h3><ol>${it.map(x=>`<li>${x.pid?`<button type="button" data-cp1m="${esc(x.pid)}">${esc(x.texto)}</button>`:`<span>${esc(x.texto)}</span>`}</li>`).join("")}</ol></section>`}
function dia1min(ps){if(FT182_EM1MIN){try{return ft182Um()}catch(e){return ""}}  /* 182: "Em 1 min" (ft182Um); sem ele (testes com todos os formatos), o resumo antigo */
  const rd=FEED.resumo_dia&&Array.isArray(FEED.resumo_dia.itens)?FEED.resumo_dia.itens.filter(x=>x&&typeof x.texto==="string"&&x.texto.trim()):[];
  const ok=x=>!x.pid||ps.some(p=>p.id===x.pid);let it=rd.filter(ok).slice(0,6);
  if(!it.length){const pr=p=>typeof p.prioridade==="number"?p.prioridade:0;it=[...ps].sort((a,b)=>pr(b)-pr(a)).slice(0,5).map(p=>({pid:p.id,texto:p.neutro?.titulo||""}))}
  if(!it.length)return "";
  const rt=resumoTitulo();return `<section class="cp-1m" aria-label="${esc(rt)}"><h3><span>${esc(rt)}</span><button type="button" class="cp-1m-sh" data-1mshare aria-label="Mandar o resumo como imagem">${ICON.send}<span>Mandar</span></button></h3><ol>${it.map(x=>`<li>${x.pid?`<button type="button" data-cp1m="${esc(x.pid)}">${esc(x.texto)}</button>`:`<span>${esc(x.texto)}</span>`}</li>`).join("")}</ol></section>`}

/* ===== breves urgentes (até 3 h) ===== */
function urgentes(){const ag=Date.now();return (FEED?.breves||[]).map((b,i)=>({b,i})).filter(x=>x.b&&x.b.urgente&&tms(x.b.hora)&&ag-tms(x.b.hora)<3*3600e3&&!(PREF.ocultas||[]).includes(x.b.secao||"politica"))}
function urgHTML(extra){const u=urgentes();if(!u.length)return "";return `<div class="urg ${extra||""}"><b>Urgente</b>${u.map(x=>`<button type="button" data-urg="${esc(x.b.url||"")}">${esc(x.b.titulo)}<br><span>${esc(nomeFonte(x.b.fonte))} · ${esc(hhmm(x.b.hora))}</span></button>`).join("")}</div>`}
function abrirUrgente(i){const b=(FEED?.breves||[])[i];if(!b)return;uso("urgente");
  sheet("Urgente",`<h3 style="margin:0;font-family:var(--f-display);font-size:21px;line-height:1.25">${esc(b.titulo)}</h3><p class="hint" style="margin:0">${esc(nomeFonte(b.fonte))} · ${esc(secNome(b.secao||"politica"))} · ${esc(hhmm(b.hora))}</p><a class="btn" href="${escU(b.url)}" target="_blank" rel="noopener">Ler em ${esc(nomeFonte(b.fonte))} ›</a><p class="hint" style="margin:0">Notícia que acabou de sair. Se o assunto continuar, o Prumo abre uma cobertura com mais detalhes.</p>`)}

/* ===== card dos indicadores (184) ===== */
var UI184_IDS=["dolar","selic","ipca12m","ibovespa"];
var UI184_NOME={dolar:"Dólar",selic:"Selic",ipca12m:"IPCA 12 meses",ibovespa:"Ibovespa"};
var UI184_MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
function ui184Itens(){const m={};try{indItens().forEach(x=>{if(x&&x.id&&x.valor)m[x.id]=x})}catch(e){}return UI184_IDS.map(id=>m[id]).filter(Boolean)}
/* "AAAA-MM-DDTHH:MM…" (hora de Brasília, como o robô grava) → {d:"16/11", h:"18h07"} */
function ui184Hora(s){const m=/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(s||""));if(!m)return null;return {d:m[3]+"/"+m[2],h:m[4]?(+m[4])+"h"+m[5]:""}}
function ui184Legenda(it){let s="";try{s=(IND_AUTO&&IND_AUTO.dados_em)||""}catch(e){}
  if(!s){const hs=it.filter(x=>/^(dolar|ibovespa)$/.test(x.id)&&x.hora).map(x=>String(x.hora)).sort();s=hs.pop()||""}
  if(!s){try{s=(IND_AUTO&&IND_AUTO.atualizado)||""}catch(e){}}
  if(!s){const ds=it.map(x=>String(x.data||"")).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort();s=ds.pop()||""}
  const q=ui184Hora(s);return q?"Atualizado em "+q.d+(q.h?" às "+q.h:""):""}
function ui184Sub(x){
  if(x.id==="dolar"||x.id==="ibovespa"){const v=String(x.variacao||"").trim();if(!v)return "";const d=/^(sobe|desce|estavel)$/.test(x.dir||"")?x.dir:"estavel";
    return `<em class="${d}">${{sobe:"▲",desce:"▼",estavel:"="}[d]} ${esc(v.replace(/^\+/,""))}</em>`}
  if(x.id==="selic")return `<small>meta do Copom</small>`;
  const m=/^\d{4}-(\d{2})$/.exec(String(x.ref||""));return `<small>${m?"até "+UI184_MES[+m[1]-1]:"IBGE"}</small>`}
function capaIndicadores(){const it=ui184Itens();if(!it.length)return "";const leg=ui184Legenda(it);
  return `<section class="ui184" aria-label="Indicadores"><button type="button" class="ui184-b" data-ui184 aria-label="Indicadores: ${esc(it.map(x=>UI184_NOME[x.id]+" "+x.valor).join(", "))}. ${esc(leg)}. Toque para saber o que é cada um">`+
    `<span class="ui184-h">Indicadores</span><span class="ui184-g">${it.map(x=>`<span class="ui184-c" data-ui184id="${esc(x.id)}"><span class="ui184-n">${esc(UI184_NOME[x.id])}</span><b>${esc(x.valor)}</b>${ui184Sub(x)}</span>`).join("")}</span>`+
    (leg?`<span class="ui184-at">${esc(leg)}</span>`:"")+`</button></section>`}
function ui184Explica(){try{uso("indicadores")}catch(e){}
  sheet("Indicadores",`<div class="ui184-ex"><p><b>Dólar</b>: cotação comercial no fechamento do dia, com a variação sobre o fechamento anterior.</p>`+
    `<p><b>Selic</b>: a taxa básica de juros, definida pelo Copom do Banco Central.</p><p><b>IPCA 12 meses</b>: a inflação oficial acumulada em 12 meses, medida pelo IBGE (sai uma vez por mês).</p>`+
    `<p><b>Ibovespa</b>: o principal índice da bolsa brasileira (B3) no fechamento, com a variação do dia.</p>`+
    `<p class="hint">Os números são atualizados uma vez por dia útil, depois do fechamento dos mercados. Fontes: Banco Central, IBGE e B3.</p></div>`)}
/* o card apareceu na tela: conta uma vez por abertura do app (o uso de um card que só se lê é vê-lo) */
var UI184_VISTO=false,UI184_OBS=null;
function ui184Observa(){if(UI184_VISTO||typeof IntersectionObserver!=="function")return;const el=document.querySelector("#v-capa .ui184");if(!el)return;
  if(!UI184_OBS)UI184_OBS=new IntersectionObserver(es=>{if(UI184_VISTO)return;if(es.some(x=>x.isIntersecting)){UI184_VISTO=true;try{tl142Conta("indicadores_visto")}catch(e){}UI184_OBS.disconnect()}},{threshold:.6});
  UI184_OBS.disconnect();UI184_OBS.observe(el)}
/* tela larga (Capa em 2 colunas, 033): o card vai para a coluna do lado, como os indicadores antigos */
function ui184Lado(){const sd=document.querySelector("#v-capa .cp-side"),c=document.querySelector("#v-capa .cp-main .ui184");if(sd&&c)sd.insertBefore(c,sd.querySelector(".cp-h")||null)}

/* ===== "Para acompanhar" e agenda (159, 168) ===== */
/* 159: o que mudou por último em cada cobertura */
function ca159Acomp(){const v=document.getElementById("v-capa");if(!v)return;
  v.querySelectorAll(".cp-h").forEach(hh=>{const h3=hh.querySelector("h3");if(!h3||h3.textContent.trim()!=="Para acompanhar")return;const ul=hh.nextElementSibling;if(!ul||!ul.classList.contains("cp-l"))return;
    ul.querySelectorAll("button[data-cobpag]").forEach(b=>{if(b.querySelector(".ca159-mud"))return;const p=pautaById(b.dataset.cobpag);const a=p&&Array.isArray(p.atualizacoes)?p.atualizacoes.filter(x=>x&&typeof x.texto==="string"&&x.texto.trim()):[];
      const u=a.length?a.slice().sort((x,y)=>tms(x.hora)-tms(y.hora)).pop():null;if(u)b.insertAdjacentHTML("beforeend",`<span class="ca159-mud">${esc(capaFrase(u.texto,96))}</span>`)})})}
/* 168: a hora é a da última novidade de cada cobertura; a lista segue essa ordem */
function cm168Acomp(){const v=document.getElementById("v-capa");if(!v)return;
  v.querySelectorAll(".cp-h").forEach(hh=>{const h3=hh.querySelector("h3");if(!h3||h3.textContent.trim()!=="Para acompanhar")return;const ul=hh.nextElementSibling;if(!ul||!ul.classList.contains("cp-l"))return;
    const lis=[...ul.children].map(li=>{const b=li.querySelector("button[data-cobpag]"),p=b&&pautaById(b.dataset.cobpag);const t=p?cm168Ult(p):0;
      const s=b&&b.querySelector(".s");if(s&&t){s.textContent=cm168Quando(t);s.dataset.cm168="1"}return {li,t}});
    lis.sort((a,b)=>b.t-a.t).forEach(o=>ul.appendChild(o.li))})}
/* 168: evento de hoje cujo horário já passou diz "saiu às 8h25" */
/* horário conhecido de divulgações sem hora na agenda */
var CM168_HORAS=[[/boletim focus/i,8*60+25],[/\b(ipca|pnad|pib|ibge)\b/i,9*60]];
function cm168AgMin(a){const h=String(a&&a.hora||"");if(/\d/.test(h))return agMin(a);const t=String(a&&a.texto||"");for(const [re,m] of CM168_HORAS)if(re.test(t))return m;return -1}
function cm168HM(m){return Math.floor(m/60)+"h"+(m%60?String(m%60).padStart(2,"0"):"")}
function cm168Agenda(){const v=document.getElementById("v-capa");if(!v||!FEED)return;const hh=[...v.querySelectorAll(".cp-h")].find(x=>/^Agenda/.test((x.querySelector("h3")||{}).textContent||""));if(!hh)return;
  const ul=hh.nextElementSibling;if(!ul||!ul.classList.contains("cp-l"))return;const hj=hojeSP(),agora=minAgoraSP();
  const hoje=(FEED.agenda||[]).filter(a=>a&&agData(a,hj)===hj);
  ul.querySelectorAll("li").forEach(li=>{const b=li.querySelector("button"),s=b&&b.querySelector(".s"),tx=((b&&b.querySelector("b"))||{}).textContent||"";if(!s)return;
    if(s.dataset.cm168orig==null){if(!/^Hoje/.test(s.textContent))return;s.dataset.cm168orig=s.textContent}
    const a=hoje.find(x=>x.texto===tx),m=a?cm168AgMin(a):-1,passou=m>=0&&agora>=m+5;li.classList.toggle("cm168-passou",passou);
    s.textContent=passou?"Hoje · "+(/divulga|publica|sai\b|resultado/i.test(tx)?"saiu às ":"foi às ")+cm168HM(m):s.dataset.cm168orig})}

/* ===== botão da leitura (balança) ===== */
var CP_MAIS=null;
function lenteBotao(){let b=document.getElementById("lp");
  if(!b){b=document.createElement("button");b.type="button";b.id="lp";b.className="lp";b.setAttribute("aria-haspopup","menu");b.dataset.lpabre="1";document.body.appendChild(b)}
  const L=lente(),N={neutro:"Neutra",direita:"Direita",esquerda:"Esquerda"};
  b.className="lp "+L;b.hidden=VIEW!=="capa"||!FEED;b.setAttribute("aria-label","Leitura das notícias: "+N[L]);
  b.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M5 7h14M7 7l-3 6a3 3 0 0 0 6 0zM17 7l-3 6a3 3 0 0 0 6 0z"/></svg>${L==="neutro"?"":"<i></i>"}${N[L]}`;
  if(b.hidden)lenteMenu(false)}
function lenteMenu(abrir){let m=document.getElementById("lpm");if(!abrir){if(m)m.remove();return}
  if(m){m.remove();return}const L=lente();m=document.createElement("div");m.id="lpm";m.className="lpm";m.setAttribute("role","menu");
  m.innerHTML=`<b>Como ler as notícias</b>${[["neutro","Neutra","Só os fatos"],["direita","Direita","Como a direita conta"],["esquerda","Esquerda","Como a esquerda conta"]].map(([k,n,d])=>`<button type="button" role="menuitemradio" aria-checked="${L===k}" data-lente="${k}"><i class="${k}"></i><span><b>${n}</b><span>${d}</span></span>${L===k?'<em aria-hidden="true">✓</em>':""}</button>`).join("")}`;
  document.body.appendChild(m);uso("lente_menu")}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest("[data-lpabre]")){e.stopPropagation();lenteMenu(true);return}
  if(document.getElementById("lpm")&&!t.closest("#lpm"))lenteMenu(false)},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape")lenteMenu(false)});

/* ===== assinatura: trocar de aba não remonta a Capa se nada mudou (048) ===== */
/* abre/fecha o quadro de um cartão sem remontar a Capa; devolve false se não deu (aí remonta) */
function cpAlternar(antigo,novo){try{if(VIEW!=="capa")return false;
  if(antigo&&antigo!==novo){const el=document.getElementById("cpi-"+antigo);if(!el)return false;el.querySelector(":scope > .cpx")?.remove();el.classList.remove("aberto");el.querySelector(".cpi-b")?.setAttribute("aria-expanded","false")}
  if(novo){const el=document.getElementById("cpi-"+novo),p=pautaById(novo);if(!el||!p)return false;if(!el.querySelector(":scope > .cpx"))el.insertAdjacentHTML("beforeend",cpAberta(p));el.classList.add("aberto");el.querySelector(".cpi-b")?.setAttribute("aria-expanded","true");if(lidaAtual(p))el.classList.add("lida");const nv=el.querySelector(".cp-nv");if(nv&&lidaAtual(p))nv.remove()}
  CAPA_SIG=capaSig();return true}catch(e){return false}}
/* assinatura do que a Capa mostra: se não mudou, trocar de aba não remonta */
var CAPA_SIG="";
/* 20/11: largura guardada (ler innerWidth logo depois de mexer na página obriga o navegador a recalcular tudo na hora) */
var CP_LARGA=innerWidth>=900;addEventListener("resize",()=>{CP_LARGA=innerWidth>=900});
function capaSig(){try{return [FEED&&FEED.atualizado_em,FEED&&FEED.pautas&&FEED.pautas.length,lente(),CP_AB,NOVAS.size,ATUALIZADAS.size,LIDAS.size,(PREF.ocultas||[]).join(),FOTOS_ARQ&&FOTOS_ARQ.gerado,typeof NOVID_AG!=="undefined"&&NOVID_AG&&NOVID_AG.gerado,Math.floor(Date.now()/300000),S.uid||"",S.membro?1:0,CP_LARGA,typeof CAPA_FIXA!=="undefined"?JSON.stringify(CAPA_FIXA):"",capaPrefSig(),JSON.stringify(((S.quiz||{})[S.uid||"eu"]||{}).at||"")].join("|")}catch(e){return String(Math.random())}}
function capaSeMudou(){const v=$("#v-capa");if(!v||!v.querySelector(".cpi")||capaSig()!==CAPA_SIG)renderCapa();else{try{lenteBotao()}catch(e){}}}

/* ===== desenho ===== */
/* A Capa. Ordem de hoje (antes eram 14 remendos em cima do 031):
   186 confere os números antes; o desenho do 031 e os acabamentos de 033 (2 colunas na tela larga, novidades vistas),
   035 (link aberto de fora), 039 (sem conexão), 048 (assinatura), 085/106 (botão de atividade), 104 (aviso de atraso),
   107 (comentários de amigos), 116 (aviso da rodada); 141 troca no lugar só o que mudou (a Capa não pisca);
   depois 159 ("Para acompanhar", sino, balança), 168 (hora da última novidade, agenda que já passou) e 184 (card dos
   indicadores na coluna do lado, contagem do card visto). */
function renderCapa(){nm186EmDia();
  const desenha=()=>{const v=$("#v-capa");if(!v)return;carregarCapaFixa();
  if(!FEED){if(v.querySelector(".cp.f4-pre"))return;  /* 121: o alto da Capa já desenhado com o feed-leve fica até a Capa de verdade */
  if(v.querySelector(".cp-sk.ab141-sk")&&!v.querySelector(".cpi"))return;v.innerHTML=`<div class="gut cp"><div class="cp-top"><span class="word">prumo<small>NEWS</small></span><span class="cp-ed ab141-sk-ed" aria-hidden="true">Edição da noite · dom, 00 de nov</span></div><div class="cp-sk ab141-sk" role="status" aria-label="Carregando a Capa"><i class="ab141-sk-art"></i><i style="height:11px;width:34%"></i><i style="height:26px;width:94%"></i><i style="height:26px;width:88%"></i><i style="height:26px;width:52%"></i><i style="height:14px;width:97%"></i><i style="height:14px;width:91%"></i><i style="height:14px;width:62%"></i></div></div>`;return}
  const {ps,ord,man,dest,fixa,linha}=capaEscolha();const L=lente();
  const usados=new Set([man,...dest].filter(Boolean).map(p=>p.id));
  const vivo=ps.filter(p=>p.status==="ao_vivo");
  let h=`<div class="gut cp"><header class="cp-top"><span class="word">prumo<small>NEWS</small></span><span class="cp-ed">${esc(capaEdicao())}${FEED.contagem?" · "+esc(FEED.contagem):""}</span></header>`;
  h+=agoraHTML();h+=capaNovBar();h+=urgHTML();if(vivo.length)h+=`<div class="cp-vivo"><b><i></i>Ao vivo</b>${vivo.map(p=>`<button type="button" data-cobpag="${esc(p.id)}">${esc(capaChapeu(p))}: ${esc(versao(p,L).titulo)} ›</button>`).join("")}</div>`;
  if(man){const u=ultimaAtualizacao(man)||man.hora;
    const meta=`<span class="cp-meta">${cobStatus(man)}${u?`<span>${esc(atualizadoTxt(u))}</span>`:""}${fixa?`<span class="cp-fixa">Fixada</span>`:""}</span>`;
    h+=cpItem(man,{tam:"man",sub:true,arte:true,linha:L==="neutro"?linha:"",meta});
    const tm=temaDe(man);const rel=ps.filter(p=>p!==man&&!usados.has(p.id)&&(tm&&temaDe(p)===tm)/* 25/11: só o mesmo assunto (o subtema juntava a posse com a 6×1) */).slice(0,2);
    if(rel.length){rel.forEach(p=>usados.add(p.id));h+=`<div class="cp-rel"><span>Relacionadas</span>${rel.map(p=>cpItem(p,{tam:"rel"})).join("")}</div>`}}
  /* 208: "Acabou de sair" logo depois da manchete */
  try{h+=ac208HTML("capa")}catch(e){}
  if(dest.length)h+=`<div class="cp-dest">${dest.map((p,i)=>cpItem(p,{tam:i<2?"d1":"d2",sub:true,arte:i>=2})).join("")}</div>`;
  h+=dia1min(ps);h+=instHTML();
  h+=capaIndicadores();
  const NSEC={politica:5,economia:5};
  SECS().forEach(s=>{const l=ord.filter(p=>secOf(p)===s.id&&!usados.has(p.id)).slice(0,NSEC[s.id]||3);if(!l.length)return;
    h+=`<div class="cp-h"><h3><i style="background:${secCor(s.id)}"></i>${esc(s.nome)}</h3><button type="button" data-capasec="${esc(s.id)}">Ver a seção ›</button></div><div class="cp-sl">${l.map((p,i)=>cpItem(p,{tam:i?"li":"um",sub:!i,arte:!i})).join("")}</div>`});
  const acomp=ps.filter(p=>typeof cobTemPagina==="function"&&cobTemPagina(p)).sort((a,b)=>tms(ultimaAtualizacao(b)||b.hora)-tms(ultimaAtualizacao(a)||a.hora)).slice(0,8);
  if(acomp.length)h+=`<div class="cp-h"><h3>Para acompanhar</h3></div><ul class="cp-l">${acomp.map(p=>{const et=cobEtapaAtual(p);return `<li><button type="button" data-cobpag="${esc(p.id)}"><span class="s">${esc(quando(ultimaAtualizacao(p)||p.hora))}</span><b>${esc(temaDe(p)||versao(p,L).titulo)}${et?" · "+esc(et):p.status==="ao_vivo"?" · ao vivo":p.status==="encerrada"?" · encerrada":""}</b></button></li>`}).join("")}</ul>`;
  const ult=tickerItens(8);
  if(ult.length)h+=`<div class="cp-h"><h3>Últimas</h3></div><ul class="cp-l">${ult.map(i=>{const p=pautaById(i.pid);return `<li><button type="button" data-capair="${esc(i.pid)}"><span class="s">${i.hora?esc(horaDia(i.hora))+" · ":""}${esc(p?temaDe(p)||secNome(i.sec):secNome(i.sec))}</span><b>${esc(i.txt)}</b></button></li>`}).join("")}</ul>`;
  const hj=hojeSP(),am=somaDias(hj,1),ag=(FEED.agenda||[]).map(a=>({...a,_d:agData(a,hj)})).filter(a=>a._d===hj||a._d===am||(fimDeSemana()&&a._d>am&&a._d<=somaDias(hj,7))).sort((x,y)=>x._d.localeCompare(y._d)||agMin(x)-agMin(y)).slice(0,fimDeSemana()?14:99);
  if(ag.length)h+=`<div class="cp-h"><h3>${fimDeSemana()?"Agenda da semana":"Agenda"}</h3></div><ul class="cp-l">${ag.map(a=>{const pid=agPid(a);return `<li><button type="button" ${pid?`data-capair="${esc(pid)}"`:"disabled"}><span class="s">${agDiaTxt(a._d,hj,am)}${agHoraTxt(a)?" · "+esc(agHoraTxt(a)):""}</span><b>${esc(a.texto)}</b></button></li>`}).join("")}</ul>`;
  const enq=ps.filter(p=>p.enquete&&(p.enquete.opcoes||[]).length);const pend=S.uid&&S.membro?enq.filter(p=>meuVoto(p.id)==null).length:0;const qz=(FEED.quiz||[]).length&&!(S.quiz||{})[S.uid||"eu"];
  if(qz||pend)h+=`<button type="button" class="cp-int" data-vgo="play"><span><b>${qz?"Quiz do dia":"Enquetes"}</b><span>${[qz?`${FEED.quiz.length} perguntas sobre esta edição`:"",pend?`${pend} ${pend===1?"enquete espera":"enquetes esperam"} o seu voto`:""].filter(Boolean).join(" · ")}</span></span><span class="chev" aria-hidden="true">›</span></button>`;
  const falta=ps.filter(p=>!lidaAtual(p)).length;
  h+=`<div class="cp-fim">${falta?`<b>Faltam ${falta} ${falta===1?"notícia":"notícias"} para ficar em dia</b><button type="button" class="btn ghost" data-vgo="feed" style="margin-top:6px">Abrir o feed</button>`:`<b>Você está em dia</b><span>Leu tudo desta edição. A próxima atualização aparece aqui.</span>`}<span class="cp-fim-at">Atualizado ${esc(diaHora(horaEdicaoIso()))}.</span></div></div>`;
  v.innerHTML=h;lenteBotao()};
  if(!CP200_PRONTA){desenha();return}  /* ainda carregando (edição guardada, 029): só o desenho, como antes dos complementos */
  const monta=()=>{desenha();
    try{capaLargo();capaObservar()}catch(e){}
    try{linkTentar()}catch(e){}
    try{if(!FEED&&OFFLINE){const v=$("#v-capa");if(v&&!v.querySelector(".cp-off"))v.innerHTML=`<div class="gut cp cp-direto"><div class="cp-off"><b>Sem conexão agora</b><span>Não consegui baixar as notícias. Assim que a internet voltar, o Prumo atualiza sozinho.</span><button type="button" class="btn" data-retry>Tentar de novo</button></div></div>`}}catch(e){}
    CAPA_SIG=capaSig();
    try{const h=$("#v-capa .cp-top");if(h&&!h.querySelector(".at-b")&&S.uid&&S.membro)h.insertAdjacentHTML("beforeend",AT_BTN());atDot()}catch(e){}
    try{const top=document.querySelector("#v-capa .cp-top");const h=FEED&&typeof avisoAtraso==="function"?avisoAtraso():"";
      if(top&&h&&!document.querySelector("#v-capa .late")){top.insertAdjacentHTML("afterend",h);const l=document.querySelector("#v-capa .late");if(l)l.classList.remove("gut")}}catch(e){}
    cp106Coracao();fc107Capa();rc116AvisoCapa()};
  const v=document.getElementById("v-capa");
  if(!v)monta();
  else{const vivo=ab141Raiz(v);monta();const novo=ab141Raiz(v);
    if(novo){
      if(vivo&&novo!==vivo&&ab141Chave(vivo)===ab141Chave(novo)){const base=ab141Base;ab141Base=novo.cloneNode(true);
        try{ab141Mescla(vivo,base,novo);v.replaceChild(vivo,novo)}catch(e){ab141Base=novo.cloneNode(true);if(vivo.parentNode!==v&&novo.parentNode!==v)v.appendChild(novo)}
        try{if(typeof capaObservar==="function")capaObservar()}catch(e){}}
      else if(novo!==vivo){ab141Base=novo.cloneNode(true);ab141Marca(novo)}}}
  try{ca159Acomp();ca159Sino();requestAnimationFrame(()=>{try{ca159Lp()}catch(e){}})}catch(e){}/* 20/11: ca159Lp lê scrollY (força o navegador a calcular a página no meio do desenho); no próximo quadro sai de graça */
  try{cm168Acomp();cm168Agenda()}catch(e){}
  try{ui184Lado();ui184Observa()}catch(e){}}

/* ===== fim do carregamento (chamado pelo 999) =====
   Enquanto o código carrega, a Capa desenhada com a edição guardada (loadFeed do 029) é só o desenho, como era antes dos
   complementos; o 999 chama cp200Pronta() e redesenha com tudo. Aqui também entram os dois ajustes do 039 (sem conexão),
   que valem depois da primeira chamada de loadFeed (029), como antes. */
var CP200_PRONTA=false;
function cp200Pronta(){if(CP200_PRONTA)return;CP200_PRONTA=true;
(function(){const ant=loadFeed;loadFeed=async function(){const r=await ant.apply(this,arguments);try{if(!FEED&&OFFLINE&&VIEW==="capa")renderCapa()}catch(e){}return r}})();
(function(){let n=0;const t=setInterval(()=>{n++;if(FEED||n>60){clearInterval(t);return}if(OFFLINE&&VIEW==="capa"&&!document.querySelector("#v-capa .cp-off"))renderCapa()},1000)})();}
