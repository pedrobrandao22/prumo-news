/* ===== QA da noite C (127, 04/11): regressão geral depois do dia cheio (100–124). Detalhes em qa/QA-NOITE-C.md ===== */
/* NC: Safari sem :has() (iPhone com iOS 15.0–15.3): a conversa ficava com as últimas mensagens atrás da barra de
   resposta, o aviso (toast) ia para baixo da criação/do giro e a criação de notícia mostrava o fundo por trás do cartão.
   Só nesses aparelhos, um observador leve põe classes equivalentes (css/42). Nos outros, nada roda. */
var QC127_HAS=(function(){try{return CSS.supports("selector(:has(*))")}catch(e){return false}})();
function qc127HasSync(){const b=document.body;if(!b)return;const L=document.getElementById("layer");
  b.classList.toggle("qc127-respbar",!!document.getElementById("respbar"));b.classList.toggle("qc127-am",!!document.querySelector(".dm104-am"));
  b.classList.toggle("qc127-ce",!!(L&&L.querySelector(":scope>.ce")));b.classList.toggle("qc127-story",!!(L&&L.querySelector(".story")));
  document.querySelectorAll("#layer .ce").forEach(c=>c.classList.toggle("qc127-cs",!!c.querySelector(".fc105-cs")))}
if(!QC127_HAS){try{let qc127T=0;new MutationObserver(()=>{if(qc127T)return;qc127T=requestAnimationFrame(()=>{qc127T=0;qc127HasSync()})}).observe(document.body,{childList:true,subtree:true});qc127HasSync()}catch(e){}}

