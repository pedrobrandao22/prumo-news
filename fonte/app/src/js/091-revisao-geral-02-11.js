/* ---------- Revisão geral de 02/11: correções que tocam vários pontos ---------- */
/* figurinha de notícia de um story antigo: a matéria saiu do ar, mostra o resumo guardado */
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  const s=t.closest("#layer [data-stsnap]");if(s){e.stopPropagation();e.preventDefault();const x=pubDe(s.dataset.stsnap);const sn=(x&&x.snap)||{};if(typeof igPausa==="function")igPausa();
    sheet("Notícia",`<p class="hint" style="margin:0">${esc(sn.secao?secNome(sn.secao):"Notícia")}</p><h3 style="margin:4px 0 8px;font:700 19px/1.25 var(--f-display,var(--f-ui))">${esc(sn.titulo||"Notícia")}</h3><p class="hint">Esta notícia já saiu da edição do dia. Procure o assunto na Busca para ver o que saiu depois.</p>`,`<button type="button" class="btn ghost" data-close>Fechar</button>`);return}
  if(t.closest("#layer [data-stfora]")){e.stopPropagation();e.preventDefault();toast("Esta notícia já saiu da edição do dia.");return}},true);
/* quem está bloqueado some de Conversas e do contador */
{const _am=allMsgs;allMsgs=function(){const bl=S.bloq||[];const l=_am.apply(this,arguments);return bl.length?l.filter(m=>!bl.includes(m.de===S.uid?m.para:m.de)):l}}
{const _ub=updateBadge;updateBadge=function(){const r=_ub.apply(this,arguments);try{const bl=S.bloq||[];if(bl.length){const n=S.msgsIn.filter(m=>!m.lida&&!bl.includes(m.de)).length,b=$("#badge");if(b){b.hidden=!n;b.textContent=n>9?"9+":n}}}catch(e){}return r}}
/* trocar de conta no mesmo aparelho: a curtida de story da conta anterior não fica marcada */
{const _lc=limparLocalConta;limparLocalConta=function(){const r=_lc.apply(this,arguments);try{if(typeof US_CURTI!=="undefined")US_CURTI.clear()}catch(e){}return r}}
/* curtida de story que não foi enviada não fica marcada */
{const _de=dmEnviar;dmEnviar=async function(para,campos){const ok=await _de.apply(this,arguments);try{if(!ok&&campos&&campos.tipo==="curtiu_story"&&campos.snap&&campos.snap.story&&typeof US_CURTI!=="undefined"){US_CURTI.delete(campos.snap.story.id);localStorage.setItem("prumo-us-curti",JSON.stringify([...US_CURTI].slice(-300)));toast("A curtida não foi enviada. Tente de novo.")}}catch(e){}return ok}}
/* curtidas e comentários apagados em publicações chegam aos outros aparelhos (o tempo real não manda exclusões) */
setInterval(()=>{try{if(!document.hidden&&S.uid&&S.membro&&typeof psCarregar==="function"&&PS&&PS.on)psCarregar()}catch(e){}},90e3);
document.addEventListener("visibilitychange",()=>{try{if(!document.hidden&&S.uid&&S.membro&&PS&&PS.on&&Date.now()-(PS.t||0)>30e3)psCarregar()}catch(e){}});
/* excluir a conta: apaga antes as próprias fotos e vídeos (o banco não consegue apagar os arquivos) */
async function apagarMeusArquivos(){if(!SB||!S.uid)return;for(const bk of ["fotos","videos"]){try{for(let v=0;v<20;v++){const r=await SB.storage.from(bk).list(S.uid,{limit:100});const l=(r&&r.data)||[];if(!l.length)break;
  const ns=l.filter(f=>f&&f.name&&f.id!==null).map(f=>S.uid+"/"+f.name);if(!ns.length)break;const d=await SB.storage.from(bk).remove(ns);if(d&&d.error)break}}catch(e){}}}
{const _ex=excluirConta;excluirConta=async function(b){if(!S.db)return;if(b)b.disabled=true;await apagarMeusArquivos();return _ex.apply(this,arguments)}}
/* acessibilidade: cores do editor com nome, figurinha de link alcançável pelo teclado */
new MutationObserver(()=>{try{document.querySelectorAll("#layer .ce [data-edtxcor]:not([aria-label]),#layer .ce [data-edcncor]:not([aria-label])").forEach(b=>{b.setAttribute("aria-label","Cor "+(b.dataset.edtxcor||b.dataset.edcncor||""))});
  document.querySelectorAll("#layer [data-uslink]:not([tabindex])").forEach(b=>{b.setAttribute("tabindex","0")})}catch(e){}}).observe(document.getElementById("layer")||document.body,{childList:true,subtree:true});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target&&e.target.matches&&e.target.matches("#layer [data-uslink]")){e.preventDefault();e.target.click()}});
/* conta ainda sendo conferida (rede lenta): não diz que falta convite */
{const _fc=abrirFaltaConvite;abrirFaltaConvite=function(){if(S.uid&&!INIT_FIM){toast("Conectando à sua conta… tente de novo em alguns segundos.");return}return _fc.apply(this,arguments)}}
