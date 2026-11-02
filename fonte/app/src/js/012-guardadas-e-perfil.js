/* ---------- guardadas e perfil ---------- */
let ABA_G=lsGet("prumo-abag","minhas");
function linhaSalva(pid,s,sub,extra=""){return `<li><button type="button" class="svr" data-open="${esc(pid)}"><span class="svt paper" data-sec="${esc(s.secao||"politica")}">${svgOf(s.imagem)}</span><span class="svx"><b>${esc(s.titulo||"Notícia")}</b><span>${sub}</span>${extra}</span></button></li>`}
function itensLista(){const out=[];Object.entries(S.listas||{}).forEach(([u,m])=>Object.entries(m||{}).forEach(([pid,x])=>{if(x&&typeof x==="object")out.push({...x,pid,com:u,uid:x.uid===S.uid?S.uid:u})}));return out.sort((a,b)=>(b.at||0)-(a.at||0))}
function renderSaved(){
  const v=$("#v-saved"),nossa=[],tem=false;if(!tem&&ABA_G==="nossa")ABA_G="minhas";if(tem&&!renderSaved._ok){const nm=Object.values(S.salvos).filter(Boolean).length,nn=nossa.length;if(ABA_G==="minhas"&&!nm&&nn)ABA_G="nossa";else if(ABA_G==="nossa"&&!nn&&nm)ABA_G="minhas"}if(S.amigosOk)renderSaved._ok=true;
  const items=Object.entries(S.salvos).filter(([,x])=>x).sort((a,b)=>b[1].at-a[1].at);
  const abas=tem?`<div class="segs" role="tablist"><button type="button" role="tab" data-abag="minhas" aria-selected="${ABA_G==="minhas"}">Minhas (${items.length})</button><button type="button" role="tab" data-abag="nossa" aria-selected="${ABA_G==="nossa"}">Com amigos (${new Set(nossa.map(x=>x.pid)).size})</button></div>`:"";
  let corpo;
  const porPid=[];{const vis=new Map();nossa.forEach(x=>{let g=vis.get(x.pid);if(!g){g={...x,coms:[]};vis.set(x.pid,g);porPid.push(g)}if(!g.coms.includes(x.com))g.coms.push(x.com)})}
  const comQuem=cs=>{const n=cs.map(nomeDe);return n.length<=2?n.join(" e "):n.slice(0,2).join(", ")+" e mais "+(n.length-2)};
  if(ABA_G==="nossa")corpo=nossa.length?`<ul class="svl">${porPid.map(x=>{const s=x.snap||snapById(x.pid)||{};return linhaSalva(x.pid,s,x.coms.length>1?`${esc(secNome(s.secao||"politica"))} · com ${esc(comQuem(x.coms))}`:`${esc(secNome(s.secao||"politica"))} · com ${esc(nomeDe(x.com))}${esc(x.uid===S.uid?" · você pôs ":", que pôs ")}${esc(quando(x.at))}`)}).join("")}</ul>`:`<div class="empty"><b>Nenhuma lista com amigos ainda</b>No ⋯ de um post, toque em “Pôr numa lista com…” para guardar algo para ler junto com um amigo.</div>`;
  else corpo=items.length?`<ul class="svl">${items.map(([pid,x])=>{const s=x.snap||snapById(pid)||{};return linhaSalva(pid,s,`${esc(secNome(s.secao||"politica"))} · guardada ${esc(quando(x.at))}`,x.nota?`<span class="nt">Nota: ${esc(x.nota)}</span>`:"")}).join("")}</ul>`:`<div class="empty"><b>Nada guardado ainda</b>Toque no alfinete de um post para guardar a notícia aqui.<button type="button" class="btn ghost" data-vgo="feed" style="margin-top:10px">Ver as notícias de hoje</button></div>`;
  v.innerHTML=`<div class="gut"><div class="view-h"><button type="button" class="vback" data-vgo="me" aria-label="Voltar ao Perfil">‹ Perfil</button><h1>Guardadas</h1></div>${abas}${corpo}</div>`;
}
const FZ=[0.9,1,1.12,1.25,1.4];
function renderMe(){
  const v=$("#v-me"),u=S.uid,ok=!!(u&&S.db&&S.membro);
  const likes=ok?Object.values(curtidasDe(u)).filter(Boolean).length:0,cms=todosComentarios().filter(c=>c.uid===u).length,env=S.msgsOut.filter(m=>m.pid&&!m.resp&&m.tipo!=="cutucada").length,na=amigosL().length;
  const er=(S.erros||[]).slice(0,5).map(e=>({...e,...(S.errosResp[e.id]||{})}));
  const stE=e=>e.status==="corrigido"?"Corrigido":e.status==="mantido"?"Conferido, sem erro":e.status==="em_analise"?"Em análise":"Aguardando conferência";
  v.innerHTML=`<div class="gut">${ok?`<div class="me-head">${avatar(u)}<div><b>${esc(nomeDe(u))}</b><span>${na?na+" "+(na===1?"amigo":"amigos"):"Nenhum amigo ainda"}</span></div></div>
    <div class="stats"><button type="button" data-minha="gostei"><b>${likes}</b><span>gostei</span></button><button type="button" data-minha="cmt"><b>${cms}</b><span>${cms===1?"comentário":"comentários"}</span></button><button type="button" data-minha="env"><b>${env}</b><span>${env===1?"enviada":"enviadas"}</span></button></div>`:`<div class="view-h"><h1>Perfil</h1></div>`}
    <div style="display:flex;flex-direction:column;gap:12px;padding-bottom:24px">
    ${!u?`<div class="card"><b>Você está só lendo</b><p>Dá para ler tudo. Entre para gostar, comentar, guardar e conversar com os seus amigos.</p><div class="lbtns"><button type="button" class="btn" data-entrar>Entrar</button><button type="button" class="btn ghost" data-entrar="criar">Criar conta</button></div></div>`:(!INIT_FIM&&!S.membro)?`<div class="card"><b>Conectando à sua conta…</b><p>Só um instante. Se demorar, confira a internet.</p></div>`:S.suspenso?`<div class="card"><b>Conta suspensa</b><p>Dá para ler as notícias, mas não para curtir, comentar ou conversar. Fale com o Pedro.</p><button type="button" class="btn ghost" data-sair>Sair</button></div>`:!S.membro?`<div class="card"><b>Falta só o convite</b><p>Você entrou como ${esc(S.email)}, mas ainda precisa de um convite para participar.</p><button type="button" class="btn" data-entrar>Usar um convite</button></div>`:amigosCardHTML()}
    <div class="card menu"><button type="button" data-vgo="saved"><span>Guardadas</span><em>${Object.values(S.salvos||{}).filter(Boolean).length||""}</em><i>›</i></button><button type="button" data-vgo="play"><span>Quiz e enquetes</span><i>›</i></button></div>
    <div class="card menu"><button type="button" data-ajustes><span>Ajustes do app</span><i>›</i></button><button type="button" data-historico><span>Histórico de leitura</span><em>${Object.keys(HIST).length}</em><i>›</i></button><button type="button" data-rodadas><span>Atualizações do Prumo</span><em class="${estadoRadar().ok?"":"bad"}">${esc(estadoRadar().ok?(FEED?"edição das "+hhmm(FEED.atualizado_em):""):"atrasado")}</em><i>›</i></button></div>
    ${S.membro&&S.membros[u]?.papel==="admin"?`<div class="card menu"><button type="button" data-admin><span>Administração</span><i>›</i></button></div>`:""}
    ${relatorioHTML()}
    ${er.length?`<div class="card"><b>Erros que eu apontei</b><ul class="secpref">${er.map(e=>`<li style="flex-direction:column;align-items:flex-start;gap:2px"><b style="font-size:14.5px">${esc(e.titulo||"")}</b><span class="hint">“${esc(e.texto)}” · ${stE(e)}${e.resposta?" · "+esc(e.resposta):""}</span></li>`).join("")}</ul></div>`:""}
    ${u?contaCardHTML():`<div class="card menu"><button type="button" data-privacidade><span>Política de privacidade</span><i>›</i></button></div>`}
    <details class="card dt"><summary><b>Usar como app no celular</b></summary><p>No iPhone: abra no Safari, toque em Compartilhar e em “Adicionar à Tela de Início”.</p><p>No Android: abra no Chrome, toque nos três pontos e em “Adicionar à tela inicial”.</p></details>
    <details class="card dt"><summary><b>Como o Prumo funciona</b></summary><p>A cada hora, o Prumo lê as matérias de vários veículos, junta as que tratam do mesmo fato e escreve um resumo próprio. Antes de publicar, uma checagem automática procura números sem fonte, links quebrados e notícias repetidas.</p></details>
    </div></div>`;
  const ab=$("#ajbox");if(ab)ab.innerHTML=ajustesHTML();
}
function amigosCardHTML(){const am=amigosL(),pin=S.pedidosIn.filter(x=>S.membros[x]).sort((a,b)=>nomeDe(a).localeCompare(nomeDe(b),"pt-BR"));
  return `<div class="card amg"><b>Amigos</b>
    ${pin.length?`<span class="amg-t">${pin.length===1?"Pedido de amizade":"Pedidos de amizade"}</span><ul class="amgl">${pin.map(x=>`<li>${avatar(x)}<span class="amg-n"><b>${esc(nomeDe(x))}</b></span><button type="button" class="btn amg-b" data-aceitar="${esc(x)}">Aceitar</button><button type="button" class="btn ghost amg-b" data-recusar="${esc(x)}">Recusar</button></li>`).join("")}</ul>${am.length?`<span class="amg-t">Seus amigos</span>`:""}`:""}
    ${am.length?`<ul class="amgl">${am.slice(0,5).map(linhaAmigo).join("")}</ul>${am.length>5?`<button type="button" class="link vertodos" data-veramigos>Ver todos os ${am.length} amigos</button>`:""}`:`<p class="hint">Amigos veem o que você gosta, vota e comenta, e podem conversar com você.</p>`}
    <div class="lbtns"><button type="button" class="btn ghost" data-addamigos>Adicionar amigos</button><button type="button" class="btn ghost" data-convidar>Convidar alguém</button></div></div>`}
function contaCardHTML(){return `<div class="card menu"><b class="cm-h">Conta</b><div class="cm-email"><span>E-mail</span><b>${esc(S.email||"")}</b></div>${S.membro?`<button type="button" data-a="nome"><span>Mudar meu nome</span><i>›</i></button>`:""}${S.membro?`<button type="button" data-bloqueados><span>Pessoas bloqueadas</span><i>›</i></button>`:""}<button type="button" data-privacidade><span>Política de privacidade</span><i>›</i></button><button type="button" data-sair><span>Sair</span><i>›</i></button><button type="button" class="perigo" data-excluir><span>Excluir minha conta</span><i>›</i></button></div>`}
let RRT=0;function refiltrar(){if(FILTRO[0]!=="_"||VIEW!=="feed")return;clearTimeout(RRT);RRT=setTimeout(()=>{const y=scrollY;renderPosts();window.scrollTo(0,y)},400)}
function rerenderAll(){refiltrar();if(FEED)renderChgBox();if(FEED)(FEED.pautas||[]).forEach(p=>updateSocial(p.id));if(VIEW==="msgs")renderMsgs();if(VIEW==="saved")renderSaved();if(VIEW==="play")renderPlay();if(VIEW==="me")renderMe();updateBadge();S._reAmg&&S._reAmg()}
var SUBV=0;
function go(v,fromPop){
  let naRaiz=false;if(!fromPop&&JUMPS.length){let n=JUMPS.length;if(JUMPS[0].view!==RAIZ){n+=VST+SUBV;VST=0;SUBV=0}naRaiz=true;JUMPS=[];voltarH(n)}
  if(!fromPop){if(VIEW==="me"&&(v==="saved"||v==="play")){if(pushH())SUBV++}else if(SUBV>0&&(VIEW==="saved"||VIEW==="play")){voltarH(SUBV);SUBV=0}}
  if(!fromPop&&TST>0&&(v!=="msgs"||!THREAD)){voltarH(TST);TST=0}
  if(!fromPop){if(v!==RAIZ&&(VIEW===RAIZ||naRaiz)){if(pushH())VST++}else if(v===RAIZ&&VST>0){VST--;voltarH(1)}}
  const yAlvo=v==="feed"?(VIEW==="feed"?0:FEED_Y):0;if(VIEW==="feed"&&v!=="feed")FEED_Y=scrollY;
  const pl=$("#pilula");if(pl)pl.hidden=v!=="feed"&&v!=="capa";if(v!==VIEW)document.querySelectorAll(".toast").forEach(x=>x.remove());
  VIEW=v;["feed","capa","msgs","busca","saved","play","me"].forEach(k=>{const sv=$("#v-"+k);if(sv)sv.hidden=k!==v});{const tab={saved:"me",play:"me"}[v]||v;document.querySelectorAll(".nav button[data-v]").forEach(b=>{if(b.dataset.v===tab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
  $("header.top").hidden=v!=="feed";if(v!=="msgs")THREAD=null;
  if(v==="msgs")renderMsgs();if(v==="saved")renderSaved();if(v==="play")renderPlay();if(v==="me"){renderMe();carregarRodadas();carregarErrosResp()}
  if(v==="feed"){requestAnimationFrame(()=>document.querySelectorAll(".track").forEach(t=>{if(FIT_IO){FIT_IO.unobserve(t);FIT_IO.observe(t)}else fitTrack(t)}));tkStart()}
  window.scrollTo(0,yAlvo);
}

