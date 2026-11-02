/* ---------- enquete ---------- */
function enqueteHTML(p){
  const e=p.enquete;if(!e||!(e.opcoes||[]).length)return "";
  const votos=votosDe(p.id);const meu=S.uid?votos[S.uid]:undefined;const vals=Object.entries(votos);
  const votou=meu!==undefined&&meu!==null;const faltam=votou?amigosL().filter(u=>votos[u]==null):[];
  return `<div class="poll"><b>${esc(e.pergunta)}</b>${e.opcoes.map((o,i)=>{const quem=vals.filter(([,v])=>v===i).map(([u])=>u).sort((a,b)=>(b===S.uid)-(a===S.uid));
    return `<button type="button" class="${votou&&meu===i?"mine":""}" data-voto="${i}" aria-pressed="${votou&&meu===i}"><span>${esc(o)}</span>${votou&&quem.length?`<em>${esc(quemVotou(quem))}</em>`:""}</button>`}).join("")}${votou?(faltam.length?`<span class="hint">${esc(faltam.length===1?nomeDe(faltam[0])+" ainda não votou.":faltam.length+" amigos ainda não votaram.")}</span>`:""):`<span class="hint">${esc(dicaVoto(vals))}</span>`}</div>`;
}
function quemVotou(us){const n=us.map(u=>u===S.uid?"você":nomeDe(u));if(n.length>3)return n.slice(0,2).join(", ")+" e mais "+(n.length-2);return n.length<2?n[0]:n.slice(0,-1).join(", ")+" e "+n[n.length-1]}
function dicaVoto(vals){if(!S.uid||!S.membro)return "Entre para votar e ver o que seus amigos acham.";const am=amigosL(),ja=vals.map(([u])=>u).filter(u=>u!==S.uid);if(ja.length===1)return nomeDe(ja[0])+" já votou. Vote para ver.";if(ja.length>1)return ja.length+" amigos já votaram. Vote para ver.";if(am.length===1)return "Vote e veja depois o que "+nomeDe(am[0])+" acha.";if(am.length>1)return "Vote e veja depois o que seus amigos acham.";return "Toque numa opção para votar."}
async function votar(pid,i){uso("enquete");vibrar(8);
  if(precisaConta())return;const atual=meuVoto(pid);const val=atual===i?null:i;
  pend("votos",pid,val);recalcSoc("votos");setTimeout(updatePlayBadge,0);if(val===null)toast("Voto retirado.");updateSocial(pid);if(VIEW==="play")renderPlay();
  try{await gravarMapa("votos/"+S.uid,"itens",pid,val)}catch(e){desfazPend("votos",pid);updateSocial(pid);updatePlayBadge();if(VIEW==="play")renderPlay();toast("Não deu para votar agora.")}
}
