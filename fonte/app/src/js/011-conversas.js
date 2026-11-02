/* ---------- conversas ---------- */
function marcarLidasThread(th){if(document.hidden||!S.db)return;const nl=th.filter(m=>m.para===S.uid&&!m.lida);if(!nl.length)return;nl.forEach(m=>m.lida=true);const de=nl[0].de;S.db.marcarLidas(de).catch(()=>{nl.forEach(m=>m.lida=false);updateBadge()})}
const REAC=[["concordo","👍","Concordo"],["surpreso","😮","Surpreso"],["discordo","👎","Discordo"]];
function minhaReacao(m){return allMsgs().find(x=>x.de===S.uid&&x.para===m.de&&x.tipo==="reacao"&&x.pid===m.pid&&x.at>=m.at)}
function reacHTML(m){const r=minhaReacao(m);if(r)return `<span class="reac-ok">Você reagiu: ${esc(r.texto)}</span>`;
  return `<span class="reacs" role="group" aria-label="Reagir">${REAC.map(([k,e,l])=>`<button type="button" class="reac" data-reac="${esc(m.id)}" data-k="${k}">${e} ${l}</button>`).join("")}</span>`}
async function reagir(mid,k){const m=allMsgs().find(x=>x.id===mid),r=REAC.find(x=>x[0]===k);if(!m||!r||!S.db)return;if(!S.amigos.has(m.de)){toast("Só dá para reagir com amigos.");return}vibrar(8);
  const at=Date.now(),texto=r[1]+" "+r[2];const ext={pid:m.pid,snap:{id:m.pid,titulo:m.snap?.titulo||"",secao:m.snap?.secao||""},resp:true,tipo:"reacao"};
  S.msgsOut.push({id:"tmp"+at,de:S.uid,para:m.de,at,texto,lida:false,...ext});renderMsgs();
  try{await S.db.collection("mensagens").add({de:S.uid,para:m.de,at,texto,lida:false,...ext})}catch(e){S.msgsOut=S.msgsOut.filter(x=>x.id!=="tmp"+at);renderMsgs();toast("Não deu para reagir agora.")}}
function allMsgs(){const m=new Map();[...S.msgsIn,...S.msgsOut].forEach(x=>m.set(x.id,x));return [...m.values()].sort((a,b)=>a.at-b.at)}
function updateBadge(){const n=S.msgsIn.filter(m=>!m.lida).length,b=$("#badge");b.hidden=!n;b.textContent=n>9?"9+":n;const mb=$("#mbadge");if(mb){const p=S.pedidosIn.length;mb.hidden=!p;mb.setAttribute("aria-label",p?(p===1?"1 pedido de amizade":p+" pedidos de amizade"):"")}}
function renderMsgs(){
  const v=$("#v-msgs");
  if(!S.db||!S.uid||!S.membro){v.dataset.thr="";v.innerHTML=`<div class="gut"><div class="view-h"><h1>Conversas</h1></div><div class="empty"><b>Conversas precisam da sua conta</b>${S.uid?"Falta só o convite para você entrar no Prumo.":"Entre para trocar notícias com os seus amigos."}<button type="button" class="btn" data-entrar style="margin-top:10px">${S.uid?"Usar um convite":"Entrar"}</button></div></div>`;return}
  const msgs=allMsgs(),am=amigosL();
  if(THREAD){const amigo=S.amigos.has(THREAD);
    const th=msgs.filter(m=>(m.de===THREAD&&m.para===S.uid)||(m.de===S.uid&&m.para===THREAD));
    let diaAnt="";const thrHTML=th.length?th.map(m=>{const dd=dataSP(m.at),sep=dd!==diaAnt?(diaAnt=dd,`<div class="dia">${esc(dd===dataSP()?"Hoje":dd===somaDias(dataSP(),-1)?"Ontem":new Date(m.at).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit",timeZone:"America/Sao_Paulo"}))}</div>`):"";return sep+`<div class="msg ${m.de===S.uid?"mine":""}">${m.pid&&m.resp?`<button type="button" class="quote" data-open="${esc(m.pid)}">↪ ${esc(m.snap?.titulo||"notícia")}</button>`:m.pid?shareCard(m.snap,`data-open="${esc(m.pid)}"`).replace('class="share paper"','class="share paper mini"'):""}${m.texto?`<div class="bub">${esc(m.texto)}</div>`:""}<span class="mrow"><span class="mt">${esc(quando(m.at))}</span>${m.pid&&!m.resp?`<button type="button" class="c-a rspm" data-resp-msg="${esc(m.id)}">Responder</button>`:""}</span>${m.pid&&!m.resp&&m.de!==S.uid&&amigo?reacHTML(m):""}</div>`}).join(""):`<div class="empty"><b>Comece a conversa</b>Envie uma notícia pelo botão Enviar de qualquer post, ou escreva abaixo.</div>`;
    const ja=v.dataset.thr===THREAD&&v.dataset.am===String(amigo)&&v.querySelector(".thread");
    if(ja){const perto=document.documentElement.scrollHeight-scrollY-innerHeight<160,n0=v.querySelectorAll(".thread .msg").length;v.querySelector(".thread").innerHTML=thrHTML;marcarLidasThread(th);updateBadge();if(perto||th.length>n0&&th[th.length-1]?.de===S.uid)window.scrollTo(0,document.body.scrollHeight);return}
    v.dataset.thr=THREAD;v.dataset.am=String(amigo);RESP=null;
    v.innerHTML=`<div class="gut"><div class="view-h">${am.length>1||!amigo?`<button type="button" data-back aria-label="Voltar" style="margin-left:-8px;width:40px;height:44px;display:flex;align-items:center;justify-content:center">${ICON.back}</button>`:""}${avatar(THREAD)}<h1 style="font-size:19px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(nomeDe(THREAD))}</h1>${amigo?`<button type="button" class="icbtn" data-thmenu aria-label="Opções da conversa">${ICON.dots}</button>`:""}</div>
      <div class="thread">${thrHTML}</div></div>
      <div class="composer gut">${amigo?`<form id="mform"><input class="field" id="mtext" maxlength="1000" autocomplete="off" placeholder="Mensagem…" aria-label="Mensagem"><button class="send" type="submit">Enviar</button></form>`:`<p class="hint" style="margin:0;padding:8px 0;max-width:560px;margin-inline:auto">${S.membros[THREAD]?.excluido?"Esta conta foi excluída. A conversa fica aqui só para leitura.":"Vocês não são amigos no Prumo agora. Para conversar de novo, peça amizade no Perfil."}</p>`}</div>`;
    if(amigo)
    $("#mform").addEventListener("submit",async e=>{e.preventDefault();const t=$("#mtext").value.trim();if(!t)return;$("#mtext").value="";
      const at=Date.now(),para=THREAD,rp=RESP;RESP=null;const extra=rp?{pid:rp.pid,snap:rp.snap,resp:true}:{};S.msgsOut.push({id:"tmp"+at,de:S.uid,para,at,texto:t,lida:false,...extra});renderMsgs();$("#respbar")?.remove();
      try{await S.db.collection("mensagens").add({de:S.uid,para,at,texto:t,lida:false,...extra})}catch(err){S.msgsOut=S.msgsOut.filter(m=>m.id!=="tmp"+at);renderMsgs();const i=$("#mtext");if(i&&!i.value)i.value=t;if(rp&&!RESP){const mm=allMsgs().find(x=>x.pid===rp.pid&&!x.resp);if(mm)responderMsg(mm.id);else RESP=rp}toast(err?.code==="permission_denied"?"Só dá para mandar mensagem para amigos.":"A mensagem não foi enviada. O texto voltou para a caixa.")}});
    marcarLidasThread(th);updateBadge();
    window.scrollTo(0,document.body.scrollHeight);return;
  }
  const ult=u=>{const l=msgs.filter(m=>m.de===u||m.para===u);return l.length?l[l.length-1].at:0};
  const others=[...new Set(msgs.map(m=>m.de===S.uid?m.para:m.de))].filter(u=>u&&u!==S.uid).sort((a,b)=>ult(b)-ult(a));if(am.length===1&&others.every(u=>u===am[0])){THREAD=am[0];return renderMsgs()}v.dataset.thr="";
  v.innerHTML=`<div class="gut"><div class="view-h"><h1>Conversas</h1>${am.length&&others.length?`<button type="button" class="btn ghost nconv" data-novaconv>Nova conversa</button>`:""}</div>${others.length?`<ul class="people">${others.map(u=>{const th=msgs.filter(m=>m.de===u||m.para===u),last=th[th.length-1],un=th.filter(m=>m.para===S.uid&&!m.lida).length;
      return `<li><button type="button" data-thread="${esc(u)}">${avatar(u)}<span class="pt"><b>${esc(nomeDe(u))}</b><span class="${un?"unread":""}">${last?esc((last.de===S.uid?"Você: ":"")+(last.texto||("enviou: "+(last.snap?.titulo||"uma notícia"))))+" · "+esc(quando(last.at)):"Toque para conversar"}</span></span>${un?`<span class="dot" aria-label="${un} não lidas"></span>`:""}</button></li>`}).join("")}</ul>`
      :am.length?`<div class="empty"><b>Nenhuma conversa ainda</b>Mande uma notícia pelo botão Enviar de um post, ou comece uma conversa com um amigo.<button type="button" class="btn" data-novaconv style="margin-top:10px">Nova conversa</button></div>`:`<div class="empty"><b>Nenhum amigo ainda</b>Adicione amigos no Perfil para conversar.<button type="button" class="btn ghost" data-vgo="me" style="margin-top:10px">Ir ao Perfil</button></div>`}</div>`;
}

