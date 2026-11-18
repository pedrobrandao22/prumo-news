/* ---------- Etapa 15: transições ---------- */
var MAT_ARRASTO=false;
function ANIM_OK(){try{if(REDUZ.matches)return false;if(navigator.webdriver&&localStorage.getItem("prumo-teste-anim")!=="1")return false}catch(e){}return true}
function saidaClone(node,cls,ms){if(!node)return;const w=document.createElement("div");w.className="saida "+cls;w.setAttribute("aria-hidden","true");w.inert=true;
  const c=node.cloneNode(true);c.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));c.removeAttribute("id");w.appendChild(c);document.body.appendChild(w);
  if(node.scrollTop)c.scrollTop=node.scrollTop;const b=node.querySelector(".sh-b"),cb=c.querySelector(".sh-b");if(b&&cb&&b.scrollTop)cb.scrollTop=b.scrollTop;
  setTimeout(()=>w.remove(),ms||320)}

