/* ---------- 104: correções do Feed, dos posts e do perfil (revisão de uso real) ---------- */
/* curtidas dos posts dos membros no jeito do Instagram: "Curtido por …" (as notícias seguem com "gostou") */
function fd104Curtidas(pid){const el=document.getElementById("p-"+pid);if(!el||String(pid).indexOf("u:")!==0)return;const lk=el.querySelector("[data-likes]");if(!lk)return;
  const {likes}=socialOf(pid),eu=!!(S.uid&&likes.includes(S.uid)),ou=likes.filter(u=>u!==S.uid),n1=ou[0]?`<b>${esc(nomeDe(ou[0]))}</b>`:"";
  const outras=k=>k===1?"outra pessoa":`outras ${k} pessoas`;let t="";
  if(eu&&!ou.length)t=`Curtido por <b>você</b>`;else if(eu&&ou.length===1)t=`Curtido por <b>você</b> e ${n1}`;else if(eu)t=`Curtido por <b>você</b> e ${outras(ou.length)}`;
  else if(ou.length===1)t=`Curtido por ${n1}`;else if(ou.length>1)t=`Curtido por ${n1} e ${outras(ou.length-1)}`;
  if(lk.innerHTML!==t)lk.innerHTML=t;if(t){lk.dataset.a="quem";lk.setAttribute("role","button");lk.tabIndex=0}}
{const _us104=updateSocial;updateSocial=function(pid){const r=_us104.apply(this,arguments);try{fd104Curtidas(pid)}catch(e){}return r}}

/* quem publicou o post pode apagar comentários dos outros no próprio post (o servidor já permite) */
function cmDono(pid){if(String(pid||"").indexOf("u:")!==0||!S.uid)return false;const x=typeof pubDe==="function"&&pubDe(String(pid).slice(2));return !!(x&&x.autor===S.uid)}

/* post editado (legenda, fixado) ou nome de amigo mudado: redesenha no lugar os posts que já estão na tela */
function fd104Troca(id){const x=pubDe(id);if(!x)return;document.querySelectorAll(`#posts [id="p-u:${id}"]`).forEach(el=>{try{const t=document.createElement("div");t.innerHTML=pubPostHTML(x);const n=t.firstElementChild;if(!n)return;
  const ab=el.querySelector(".up-leg:not(.up-curta)");el.replaceWith(n);if(ab){const l=n.querySelector(".up-leg.up-curta");if(l)l.classList.remove("up-curta")}wireTracks(n);updateSocial("u:"+id)}catch(e){}})}
const fd104Sig=x=>[x.texto||"",x.editado||"",x.fixado||"",JSON.stringify(x.estilo||"").length].join("\u0001");
{const _pc104=pubCarregar;pubCarregar=async function(){const antes={};try{(PUB.itens||[]).forEach(x=>{if(x&&x.tipo==="post")antes[x.id]=fd104Sig(x)})}catch(e){}const r=await _pc104.apply(this,arguments);
  try{(PUB.itens||[]).forEach(x=>{if(x&&x.tipo==="post"&&antes[x.id]!=null&&antes[x.id]!==fd104Sig(x))fd104Troca(x.id)})}catch(e){}return r}}

/* perfil: tocar em "N amigos" abre a lista de amigos */
/* perfil de um amigo: menu "…" com desfazer amizade, bloquear e denunciar */
{const _pv104=pfvDesenha;pfvDesenha=function(){const r=_pv104.apply(this,arguments);try{if(PFV&&PFV.modo==="grade"&&S.amigos.has(PFV.u)){const sp=document.querySelector("#layer .pfv .pfv-h .sp");
  if(sp&&!sp.nextElementSibling)sp.insertAdjacentHTML("afterend",`<button type="button" class="icbtn fd104-pm" data-fd104pm="${esc(PFV.u)}" aria-label="Mais opções"><svg class="ico" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg></button>`)}}catch(e){}return r}}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
  if(b=t.closest("[data-fd104am]")){e.stopPropagation();abrirTodosAmigos();return}
  if(b=t.closest("[data-fd104pm]")){e.stopPropagation();const u=b.dataset.fd104pm,n=esc(nomeDe(u));
    sheet(nomeDe(u),`<div class="opt"><button type="button" data-desfazer="${esc(u)}">Desfazer amizade<span>vocês deixam de se ver</span></button><button type="button" data-bloquear="${esc(u)}">Bloquear ${n}<span>não pode mais te achar nem pedir amizade</span></button><button type="button" data-denp="${esc(u)}">Denunciar ${n}<span>o Pedro recebe e analisa</span></button></div>`);return}},true);
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.closest&&e.target.closest("[data-fd104am]")){e.preventDefault();abrirTodosAmigos()}});
/* comentário que eu fiz num post e o dono apagou: a cópia "pendente" (até 90 s) não o traz de volta */
{const _ps104=psCarregar;psCarregar=async function(){const r=await _ps104.apply(this,arguments);try{if(PS.on){let m=0;Object.entries(CPEND).forEach(([k,p])=>{const v=p&&p.v,cid=k.split("\u0001")[1];
  if(v&&String(v.pid||"").indexOf("u:")===0&&Date.now()-p.t>5000&&!(PS.cm[String(v.pid).slice(2)]||[]).some(c=>c.id===cid)){delete CPEND[k];m=1}});if(m){S.cmts=montarCmts(S._cmtDocs);psRedesenha()}}}catch(e){}return r}}
/* post só para os Melhores amigos: selo verde no cabeçalho (como nos stories) */
/* publicou (ou apagou) com o Perfil aberto: a grade e o número de publicações acompanham */
var FD104_ME=false;function fd104Me(){if(VIEW!=="me"||PF_ABA==="conta")return;if($("#layer").innerHTML){FD104_ME=true;return}FD104_ME=false;const y=scrollY;renderMe();scrollTo(0,y)}
{const _pr104=pubRedesenha;pubRedesenha=function(){const r=_pr104.apply(this,arguments);clearTimeout(pubRedesenha.t104);pubRedesenha.t104=setTimeout(()=>{try{fd104Me()}catch(e){}},60);return r}}
/* quem curtiu um post: "Curtidas" (as notícias seguem com "Quem gostou") */
{const _aq104=abrirQuem;abrirQuem=function(pid){const r=_aq104.apply(this,arguments);try{if(String(pid).indexOf("u:")===0){const h=$(".sheet .sh-h");if(h&&h.firstChild&&h.firstChild.nodeType===3)h.firstChild.textContent="Curtidas"}}catch(e){}return r}}
/* perfil de quem não é (mais) amigo: botão de pedir/aceitar amizade; e o perfil aberto acompanha desfazer amizade/bloquear */
{const _pc104=pfCab;pfCab=function(u){let h=_pc104.apply(this,arguments);try{if(u&&u!==S.uid&&!S.amigos.has(u)&&!(S.bloq||[]).includes(u)&&S.membro){const rec=(S.pedidosIn||[]).includes(u),env=(S.pedidosOut||[]).includes(u);
  h+=`<div class="pf-bts">${rec?`<button type="button" class="btn" data-aceitar="${esc(u)}">Aceitar pedido de amizade</button>`:env?`<button type="button" class="btn ghost" data-cancelar="${esc(u)}">Cancelar pedido</button>`:`<button type="button" class="btn" data-pedir="${esc(u)}">Pedir amizade</button>`}</div>`}}catch(e){}return h}}
{const _pt104=pfTiles;pfTiles=function(l,aba,u){if(u&&u!==S.uid&&!S.amigos.has(u)&&!(l||[]).length)return `<div class="pf-vz"><b>Perfil só para amigos</b><span>Quando vocês forem amigos, as publicações de ${esc(String(nomeDe(u)).split(" ")[0])} aparecem aqui.</span></div>`;return _pt104.apply(this,arguments)}}
