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
  v.innerHTML=`<div class="gut"><div class="view-h"><button type="button" class="vback" data-vgo="me" aria-label="Voltar ao Perfil">‹ Perfil</button><h1>Guardados</h1></div>${abas}${corpo}</div>`;
}
const FZ=[0.9,1,1.12,1.25,1.4];
function amigosCardHTML(){const am=amigosL(),pin=S.pedidosIn.filter(x=>S.membros[x]).sort((a,b)=>nomeDe(a).localeCompare(nomeDe(b),"pt-BR"));
  return `<div class="card amg"><b>Amigos</b>
    ${pin.length?`<span class="amg-t">${pin.length===1?"Pedido de amizade":"Pedidos de amizade"}</span><ul class="amgl">${pin.map(x=>`<li>${avatar(x)}<span class="amg-n"><b>${esc(nomeDe(x))}</b></span><button type="button" class="btn amg-b" data-aceitar="${esc(x)}">Aceitar</button><button type="button" class="btn ghost amg-b" data-recusar="${esc(x)}">Recusar</button></li>`).join("")}</ul>${am.length?`<span class="amg-t">Seus amigos</span>`:""}`:""}
    ${am.length?`<ul class="amgl">${am.slice(0,5).map(linhaAmigo).join("")}</ul>${am.length>5?`<button type="button" class="link vertodos" data-veramigos>Ver todos os ${am.length} amigos</button>`:""}`:`<p class="hint">Amigos veem o que você gosta, vota e comenta, e podem conversar com você.</p>`}
    <div class="lbtns"><button type="button" class="btn ghost" data-addamigos>Adicionar amigos</button><button type="button" class="btn ghost" data-convidar>Convidar alguém</button></div></div>`}
function contaCardHTML(){return `<div class="card menu"><b class="cm-h">Conta</b><div class="cm-email"><span>E-mail</span><b>${esc(S.email||"")}</b></div>${S.membro?`<button type="button" data-a="nome"><span>Mudar meu nome</span><i>›</i></button>`:""}${S.membro?`<button type="button" data-bloqueados><span>Pessoas bloqueadas</span><i>›</i></button>`:""}<button type="button" data-privacidade><span>Política de privacidade</span><i>›</i></button><button type="button" data-sair><span>Sair</span><i>›</i></button><button type="button" class="perigo" data-excluir><span>Excluir minha conta</span><i>›</i></button></div>`}
let RRT=0;function refiltrar(){if(FILTRO[0]!=="_"||VIEW!=="feed")return;clearTimeout(RRT);RRT=setTimeout(()=>{const y=scrollY;renderPosts();window.scrollTo(0,y)},400)}
var SUBV=0;

