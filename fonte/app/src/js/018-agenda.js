/* ---------- agenda ---------- */
const DIAS_SEM=["dom","seg","ter","qua","qui","sex","sab"];
function somaDias(iso,n){const d=new Date(iso+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function agData(a,hoje){
  if(/^\d{4}-\d{2}-\d{2}$/.test(a.data||""))return a.data;
  const t=norm((a.hora||"")+" "+(a.texto||""));
  const m=t.match(/\b(\d{1,2})\/(\d{1,2})\b/);if(m){let y=+hoje.slice(0,4);const mm=+m[2],hm=+hoje.slice(5,7);if(hm>=11&&mm<=2)y++;else if(hm<=2&&mm>=11)y--;return `${y}-${String(mm).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`}
  if(/\bamanha\b/.test(norm(a.hora||"")))return somaDias(hoje,1);
  const w=norm(a.hora||"").match(/\b(dom|seg|ter|qua|qui|sex|sab)/);if(w){const hd=new Date(hoje+"T12:00:00Z").getUTCDay(),k=DIAS_SEM.indexOf(w[1]);let n=(k-hd+7)%7;return somaDias(hoje,n)}
  return hoje;
}
function agHoraTxt(a){const h=String(a.hora||"");const m=h.match(/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);if(m)return m[1]+"h"+(m[2]&&m[2]!=="00"?m[2]:"");const n=norm(h);if(/manha/.test(n))return "Manhã";if(/tarde/.test(n))return "Tarde";if(/noite/.test(n))return "Noite";return ""}
function agMin(a){const h=String(a.hora||""),m=h.match(/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);if(m)return (+m[1])*60+(+(m[2]||0));const n=norm(h);if(/manha/.test(n))return 540;if(/tarde/.test(n))return 840;if(/noite/.test(n))return 1200;return 1500}
const STOP=new Set("para pelo pela pelos pelas como mais sobre entre contra apos depois antes desde ainda sera serao vota votacao hoje amanha jogo partida rodada sessao com sem dos das nos nas que uma uns umas este esta isso".split(" "));
function agPid(a){if(a.pid&&pautaById(a.pid))return a.pid;
  const ws=[...new Set(norm(a.texto).split(/[^a-z0-9]+/).filter(w=>w.length>=4&&!STOP.has(w)))];if(!ws.length)return null;
  let best=null,bs=0;(FEED.pautas||[]).forEach(p=>{const t=norm([p.neutro?.titulo,p.tag,p.tema,(p.neutro?.texto||"").slice(0,240)].join(" "));const sc=ws.filter(w=>t.includes(w)).length;if(sc>bs){bs=sc;best=p.id}});
  return bs>=2?best:null}
var _FHM24=null;function minAgoraSP(){_FHM24=_FHM24||new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"America/Sao_Paulo"});const p=_FHM24.format(new Date()).split(":");return (+p[0])*60+(+p[1])}
function agDur(a){const t=" "+norm(a.texto)+" ";if(/ x |jogo|partida|semifinal|final|rodada|classico/.test(t))return 125;if(/sessao|plenario|votac|vota |julgamento|julga|analisa|cpi|comissao|audiencia/.test(t))return 300;if(/debate|entrevista|sabatina/.test(t))return 150;return 120}
function agEstado(a){if(a._d!==hojeSP())return "";const h=String(a.hora||""),m=h.match(/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);if(!m)return "";const ini=(+m[1])*60+(+(m[2]||0)),now=minAgoraSP();if(now<ini)return "";if(now<ini+agDur(a))return "agora";return /pendente|aguard|sem resultado|em andamento|sem placar|ainda n[aã]o/i.test(a.texto||"")?"aguarda":"passou"}
function agItem(a,comDia){const pid=agPid(a),hr=agHoraTxt(a);const dia=comDia?new Date(a._d+"T12:00:00Z").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit",timeZone:"UTC"}).replace(".","").replace(",",""):"";
  const est=comDia?"":agEstado(a);
  const inner=`<span class="hr">${est==="agora"?`<span class="live"><i></i>Agora</span>`:est==="aguarda"?`<span class="live aw">Aguardando</span>`:""}${esc(comDia?dia:(hr||"Hoje"))}${comDia&&hr?`<br>${esc(hr)}`:""}</span><span class="tx">${esc(a.texto)}</span>${pid?`<span class="chev" aria-hidden="true">›</span>`:""}`;
  const jbtn="";
  return `<li class="${est}${jbtn?" temj":""}">${pid?`<button type="button" class="agi" data-goto="${esc(pid)}">${inner}</button>`:`<div class="agi">${inner}</div>`}${jbtn}</li>`}
function agendaHTML(){
  const ag=FEED.agenda||[];if(!ag.length)return "";const hoje=hojeSP(),H=[],P=[];
  ag.forEach(a=>{const d=agData(a,hoje);if(!d||d<hoje)return;(d===hoje?H:P).push({...a,_d:d})});
  const ord=(x,y)=>x._d.localeCompare(y._d)||agMin(x)-agMin(y);H.sort(ord);P.sort(ord);
  if(!H.length&&!P.length)return "";const aberto=!!PREF.agendaAberta;
  if(PREF.agendaFechada!==false){const vivo=H.find(a=>agEstado(a)==="agora"),prox=H.find(a=>!agEstado(a)),dest=vivo||prox||P[0];const resto=H.length+P.length-(dest?1:0);
    return `<div class="chg gut ag agmin"><button type="button" class="agh agt" data-agtoggle aria-expanded="false"><span class="agl">${dest?`${vivo?`<span class="live"><i></i>Agora</span>`:`<b class="agk">${esc(prox?(agHoraTxt(prox)||"Hoje"):"Próximos dias")}</b>`} <span class="agx">${esc(dest.texto)}</span>`:`<b class="agk">Agenda</b>`}</span><span class="agc">${resto>0?`+${resto} ▾`:"▾"}</span></button></div>`}
  const ag2=H.filter(a=>agEstado(a)!=="passou").concat(H.filter(a=>agEstado(a)==="passou"));H.length=0;H.push(...ag2);
  return `<div class="chg gut ag"><button type="button" class="agh agt" data-agtoggle aria-expanded="true"><h4>Agenda de hoje</h4><span class="agc">▴</span></button>${H.length?`<ul>${H.map(a=>agItem(a,false)).join("")}</ul>`:`<p class="hint" style="margin:0">Nada marcado para hoje.</p>`}
    ${P.length?`<button type="button" class="agnext" data-agenda aria-expanded="${aberto}">Próximos dias (${P.length})<span aria-hidden="true">${aberto?"▴":"▾"}</span></button>${aberto?`<ul>${P.map(a=>agItem(a,true)).join("")}</ul>`:""}`:""}</div>`;
}
function placarQuiz(){
  const q=S.quiz||{};const ids=Object.keys(q).filter(u=>q[u]&&typeof q[u].acertos==="number"&&(u==="eu"||ehVisivel(u)));if(!ids.length)return "";
  return `<div class="score">${ids.sort((a,b)=>(b===S.uid||b==="eu")-(a===S.uid||a==="eu")).map(u=>`<span>${avatar(u)}<b>${esc(u===S.uid||u==="eu"?"Você":nomeDe(u))}</b> ${esc(q[u].acertos)}/${esc(q[u].total||FEED.quiz.length)}${extraQuiz(u)}</span>`).join("")}</div>`;
}
var QUIZ_ON=false;
function abrirQuiz(){uso("quiz");QUIZ_ON=true;
  const Q=(FEED.quiz||[]).filter(q=>q&&q.pergunta&&Array.isArray(q.opcoes)&&q.opcoes.length>1);if(!Q.length){toast("O quiz desta edição não está disponível.");return}let i=0,ac=0;const resp=[];
  const draw=()=>{
    if(i>=Q.length){salvarQuiz(ac,resp);QUIZ_ON=false;sheet("Quiz do dia",`<div class="empty"><b>Você acertou ${ac} de ${Q.length}</b>${ac===Q.length?"Leitura em dia!":"Os resumos explicam as respostas."}</div>${placarQuiz()}`);return}
    const q=Q[i];
    sheet(`Quiz · ${i+1} de ${Q.length}`,`<b style="font-size:18px;line-height:1.3">${esc(q.pergunta)}</b><div class="poll qopts">${q.opcoes.map((o,k)=>`<button type="button" data-qr="${k}"><span>${esc(o)}</span></button>`).join("")}</div><div id="qexp"></div>`);
    document.querySelectorAll("[data-qr]").forEach(b=>b.addEventListener("click",()=>{
      const k=+b.dataset.qr,ok=k===q.correta;if(ok)ac++;resp.push(k);
      document.querySelectorAll("[data-qr]").forEach(x=>{x.disabled=true;const kk=+x.dataset.qr;if(kk===q.correta)x.classList.add("right");else if(kk===k)x.classList.add("wrong")});
      $("#qexp").innerHTML=`<p class="note"><b>${ok?"Acertou.":"Não foi dessa vez."}</b> ${esc(q.explicacao||"")}</p><button type="button" class="btn" id="qnext">${i+1<Q.length?"Próxima":"Ver resultado"}</button>`;
      $("#qnext").addEventListener("click",()=>{i++;draw()});
    },{once:true}));
  };
  draw();
}
let QUIZ_LOCAL=null;
async function salvarQuiz(ac,resp){
  const val={acertos:ac,respostas:resp,total:resp.length,at:Date.now()},qid=quizId();QUIZ_LOCAL={qid,val};
  S.quiz={...(S.quiz||{}),[S.uid||"eu"]:val};renderChgBox();
  if(!S.db||!S.uid||!S.membro)return;
  const doc=(S.quizDocs||{})[S.uid]||{},patch={ed:{[qid]:val}};
  const eds=Object.entries(doc.ed||{}).filter(([k,x])=>k!==qid&&x).sort((a,b)=>(b[1].at||0)-(a[1].at||0));if(eds.length>=30)eds.slice(29).forEach(([k])=>patch.ed[k]=null);
  const hoje=dataSP(FEED?.atualizado_em),dias=doc.dias||{},ant=dias[hoje];if(!ant||ac>=(ant.acertos||0)){patch.dias={[hoje]:{acertos:ac,total:resp.length}};const ks=Object.keys(dias).filter(k=>k!==hoje).sort();if(ks.length>=90)ks.slice(0,ks.length-89).forEach(k=>patch.dias[k]=null)}
  try{await emFila("quiz/"+S.uid,()=>S.db.doc("quiz/"+S.uid).update(patch))}catch(e){}
}
function derivaQuiz(){const qid=FEED?quizId():"",q={},d={};Object.entries(S.quizDocs||{}).forEach(([u,x])=>{if(!ehVisivel(u)||!x)return;const e=(x.ed||{})[qid];if(e&&typeof e.acertos==="number")q[u]=e;d[u]=x.dias||{}});
  const me=S.uid||"eu";if(QUIZ_LOCAL&&QUIZ_LOCAL.qid===qid&&(!q[me]||(q[me].at||0)<QUIZ_LOCAL.val.at))q[me]=QUIZ_LOCAL.val;S.quiz=q;S.quizDias=d}
function renderChgBox(){const b=$("#chg");if(b&&FEED)b.innerHTML=topoHTML();renderTicker();if(VIEW==="play")renderPlay();updatePlayBadge()}

