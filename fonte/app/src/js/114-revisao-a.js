/* ---------- 114: revisão A (social e conversas, 03/11) ----------
   Correções achadas usando o app como quatro pessoas (Pedro, Bia, Carla e Dani) ao longo de vários "dias". Detalhes em qa/REVISAO-A.md.
   A01 "Repostar com comentário" avisa quem foi @mencionado (como um post comum).
   A02 Perfil › Conta › "Melhores amigos": ver e mudar a lista sem precisar do toque longo no botão do criador.
   A03 Menção num comentário de post aparece como "Mencionou você num comentário" (não "Marcou você num post") na Atividade,
       na lista de Conversas e na conversa.
   A04 Perfil de quem não é amigo: sem o "0 publicações" (não é verdade, só não dá para ver) e "Perfil só para amigos" também
       em Respostas e Mídia.
   A07 Repost de publicação arquivada: o aviso diz que ela pode ter sido arquivada.
   A09 Sugestão de @ escolhida pelo teclado (Enter/Espaço no botão) também completa o nome.
   Nada de SQL novo. Nomes globais com o prefixo ra114. */

/* ===== A01: repost com comentário avisa as menções ===== */
if(typeof vn112Publica==="function"){
  vn112Publica=async function(k,id,texto){const row={autor:S.uid,tipo:"post",at:Date.now(),texto:String(texto||"").slice(0,2200),fotos:[],pid:null,snap:k==="pauta"?pubSnap(id):null,estilo:{v:2,rp:{k,id}}};
    try{const r=await SB.from("publicacoes").insert(row).select("id");if(r.error)throw r.error;uso(texto?"vn_citar":"vn_repostar");
      const nid=r.data&&r.data[0]&&r.data[0].id;if(nid&&row.texto.trim())try{pubAvisarMencoes(nid,row.texto,"post")}catch(e){}
      await pubCarregar();try{pubRedesenha()}catch(e){}return true}
    catch(e){toast("Não deu para repostar agora.");return false}}}

/* ===== A03: menção em comentário de post ===== */
/* o aviso de menção num comentário leva snap {titulo:"Post de Fulano", upub} e o texto do comentário; o de menção no próprio post
   leva "Post de Fulano: começo do texto", e a marcação na foto vai sem texto */
function ra114MenCmt(m){try{if(!m||m.tipo!=="mencao"||!m.snap||!m.snap.upub||m.snap.story===true||!String(m.texto||"").trim())return false;
  if(!/^(Post|Reel) de [^:]+$/.test(String(m.snap.titulo||"")))return false;const x=typeof pubDe==="function"&&pubDe(m.snap.upub);return !(x&&x.texto===m.texto)}catch(e){return false}}
{const _dp=dmPrevia;dmPrevia=function(m){if(ra114MenCmt(m))return m.de===S.uid?"Você mencionou num comentário":"Mencionou você num comentário";return _dp.apply(this,arguments)}}
{const _th=dmThreadHTML;dmThreadHTML=function(u){const h=_th.apply(this,arguments);try{if(typeof h!=="string"||h.indexOf("num post")<0)return h;
  const ms=allMsgs().filter(ra114MenCmt);if(!ms.length)return h;const t=document.createElement("template");t.innerHTML=h;let mudou=false;
  ms.forEach(m=>{const el=t.content.querySelector(`[data-mid="${CSS.escape(String(m.id))}"] .dm-lb`);if(el&&/ num post$/.test(el.textContent)){el.textContent=el.textContent.replace(/ num post$/," num comentário");mudou=true}});
  return mudou?t.innerHTML:h}catch(e){return h}}}

/* ===== A04: perfil de quem não é amigo ===== */
function ra114Fora(u){return !!u&&u!==S.uid&&!S.amigos.has(u)}
function ra114SoAmigos(u){return `<div class="pf-vz"><b>Perfil só para amigos</b><span>Quando vocês forem amigos, as publicações de ${esc(String(nomeDe(u)).split(" ")[0])} aparecem aqui.</span></div>`}
if(typeof vn112Resp==="function"){const _r=vn112Resp;vn112Resp=function(u){return ra114Fora(u)?ra114SoAmigos(u):_r.apply(this,arguments)}}
if(typeof vn112Midia==="function"){const _m=vn112Midia;vn112Midia=function(u){return ra114Fora(u)&&!pfLista(u,"posts").length?ra114SoAmigos(u):_m.apply(this,arguments)}}
if(typeof vn112Pf==="function"){const _p=vn112Pf;vn112Pf=function(root,u){const r=_p.apply(this,arguments);try{if(ra114Fora(u)&&root&&!pfLista(u,"posts").length)root.querySelectorAll(".vn-pf-num span").forEach(s=>{if(/publicaç/.test(s.textContent))s.remove()})}catch(e){}return r}}
{const _pc=pfCab;pfCab=function(u){let h=_pc.apply(this,arguments);try{if(ra114Fora(u)&&!pfLista(u,"posts").length)h=h.replace(/<span><b>0<\/b>publicações<\/span>/,"")}catch(e){}return h}}

/* ===== A02: Melhores amigos no Perfil › Conta ===== */
function ra114MaDesenha(){const box=$("#ra114ma");if(!box)return;const am=amigosL();
  box.innerHTML=am.length?`<div class="pick dm-pick ra114-ma">${am.map(u=>`<button type="button" data-ra114ma="${esc(u)}" aria-pressed="${MA.set.has(u)}">${avatar(u)}<span>${esc(nomeDe(u))}</span><i class="dm-ck" aria-hidden="true"></i></button>`).join("")}</div>`
    :`<div class="empty" style="padding:14px 0"><b>Você ainda não tem amigos no Prumo</b></div>`;
  const n=am.filter(u=>MA.set.has(u)).length,c=$("#ra114man");if(c)c.textContent=n?(n===1?"1 pessoa na lista":n+" pessoas na lista"):"Ninguém na lista ainda"}
async function ra114MaAbrir(){if(precisaConta())return;
  sheet("Melhores amigos",`<p class="hint" style="margin:0 0 4px">Só eles veem os stories e posts que você manda para os Melhores amigos. Ninguém é avisado quando entra ou sai.</p><p class="ra114-man" id="ra114man" aria-live="polite"></p><div id="ra114ma"><div class="empty" style="padding:14px 0"><b>Carregando…</b></div></div>`);
  if(MA.uid!==S.uid||MA.on!==true){MA.t=Date.now();try{await maCarregar()}catch(e){}}
  if(MA.on!==true){const b=$("#ra114ma");if(b)b.innerHTML=`<div class="empty" style="padding:14px 0"><b>A lista ainda não está disponível no Prumo.</b></div>`;return}
  ra114MaDesenha()}
{const _rm=renderMe;renderMe=function(){const r=_rm.apply(this,arguments);try{if(S.membro&&PUB.on!==false){const b=$("#v-me [data-bloqueados]");
  if(b&&!$("#v-me [data-ra114maa]"))b.insertAdjacentHTML("beforebegin",`<button type="button" data-ra114maa><span>Melhores amigos</span><i>›</i></button>`)}}catch(e){}return r}}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;
  if(t.closest("[data-ra114maa]")){e.stopPropagation();e.preventDefault();ra114MaAbrir();return}
  if(b=t.closest("[data-ra114ma]")){e.stopPropagation();e.preventDefault();if(b.disabled)return;b.disabled=true;Promise.resolve(maTroca(b.dataset.ra114ma,b)).finally(()=>{b.disabled=false;const c=$("#ra114man");if(c){const n=amigosL().filter(u=>MA.set.has(u)).length;c.textContent=n?(n===1?"1 pessoa na lista":n+" pessoas na lista"):"Ninguém na lista ainda"}});return}},true);

/* ===== A07: repost de publicação que não está mais visível ===== */
if(typeof vn112Quote==="function"){const _q=vn112Quote;vn112Quote=function(){const h=_q.apply(this,arguments);return typeof h==="string"?h.replace("Ela foi apagada ou é de alguém que não está entre os seus amigos.","Ela foi apagada, arquivada ou é de alguém que não está entre os seus amigos."):h}}

/* ===== A09: sugestão de @ pelo teclado ===== */
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest(".men-box [data-men]");if(!b||e.detail!==0)return;e.preventDefault();e.stopPropagation();
  try{b.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true}))}catch(_){}},true);
