/* ---------- aba Interagir ---------- */
function renderPlay(){
  const v=$("#v-play");if(!v)return;if(!FEED){v.innerHTML=`<div class="gut"><div class="view-h"><button type="button" class="vback" data-vgo="me" aria-label="Voltar ao Perfil">‹ Perfil</button><h1>Quiz e enquetes</h1></div><div class="empty"><b>As notícias ainda não carregaram</b>Quiz e enquetes aparecem quando a edição chegar.<button type="button" class="btn" data-retry style="margin-top:12px">Tentar de novo</button></div></div>`;return}
  const enq=ordenadas(visiveis()).filter(p=>p.enquete&&(p.enquete.opcoes||[]).length);
  const pend=enq.filter(p=>meuVoto(p.id)==null).length;
  const meu=S.quiz?.[S.uid||"eu"];const temas=Object.keys(FEED.explicadores||{});
  v.innerHTML=`<div class="gut"><div class="view-h"><button type="button" class="vback" data-vgo="me" aria-label="Voltar ao Perfil">‹ Perfil</button><h1>Quiz e enquetes</h1></div><div style="display:flex;flex-direction:column;gap:12px;padding-bottom:24px">
    ${(FEED.quiz||[]).length?`<div class="card"><b>Quiz do dia</b><p class="hint">${FEED.quiz.length} perguntas sobre as notícias desta edição.</p>${placarQuiz()}<button type="button" class="btn ${meu?"ghost":""}" data-quiz>${meu?"Refazer o quiz":"Jogar agora"}</button></div>`:""}
    ${enq.length?`<div class="view-sub"><h2>Enquetes</h2><span class="hint">${S.uid&&S.membro?(pend?`${pend} sem o seu voto`:"Você votou em todas"):""}</span></div>${enq.map(p=>`<div class="card pl" data-pid="${esc(p.id)}"><button type="button" class="pl-h" data-goto="${esc(p.id)}"><span class="kick" style="color:${secCor(secOf(p))}">${esc(secNome(secOf(p)))}${p.tag?" · "+esc(p.tag):""}</span><span>${esc(p.neutro?.titulo||"")}</span></button>${enqueteHTML(p)}</div>`).join("")}`:`<div class="empty"><b>Sem enquetes nesta edição</b>Elas aparecem aqui e junto das notícias.<button type="button" class="btn ghost" data-vgo="feed" style="margin-top:10px">Ver as notícias de hoje</button></div>`}
    ${temas.length?`<div class="view-sub"><h2>Entenda os temas</h2></div><div class="card"><p class="hint">Explicações curtas dos assuntos que se arrastam há dias.</p><div class="tm">${temas.map(t=>`<button type="button" class="chipb" data-explica="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>`:""}
  </div></div>`;
}

