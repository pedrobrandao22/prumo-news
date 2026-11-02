/* ---------- Etapa 15: transições ---------- */
var MAT_ARRASTO=false;
function ANIM_OK(){try{if(REDUZ.matches)return false;if(navigator.webdriver&&localStorage.getItem("prumo-teste-anim")!=="1")return false}catch(e){}return true}
function saidaClone(node,cls,ms){if(!node)return;const w=document.createElement("div");w.className="saida "+cls;w.setAttribute("aria-hidden","true");w.inert=true;
  const c=node.cloneNode(true);c.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));c.removeAttribute("id");w.appendChild(c);document.body.appendChild(w);
  if(node.scrollTop)c.scrollTop=node.scrollTop;const b=node.querySelector(".sh-b"),cb=c.querySelector(".sh-b");if(b&&cb&&b.scrollTop)cb.scrollTop=b.scrollTop;
  setTimeout(()=>w.remove(),ms||320)}
(function(){const ant=closeLayer;closeLayer=function(){try{if(ANIM_OK()&&!MAT_ARRASTO){const l2=$("#layer2"),L=l2&&l2.innerHTML?l2:$("#layer"),n=L&&L.firstElementChild;
    if(n&&n.classList.contains("mat")){n.style.transform="";saidaClone(n,"sai-mat",300)}else if(n&&n.classList.contains("scrim"))saidaClone(n,"sai-sheet",280)}}catch(e){}
  MAT_ARRASTO=false;return ant.apply(this,arguments)}})();
(function(){const ant=abrirMateria;abrirMateria=function(pid,manter){const vazio=!$("#layer").innerHTML;const r=ant.apply(this,arguments);const m=$("#layer .mat");if(m&&vazio&&ANIM_OK())m.classList.add("mat-entra");return r}})();
matIr=function(pid){if(!pautaById(pid))return;if(!MAT_ORIG)MAT_ORIG=MAT_PID;const old=$("#layer .mat");if(old&&ANIM_OK()){old.style.transform="";saidaClone(old,"sai-esq",360)}
  abrirMateria(pid);const m=$("#layer .mat");if(m){m.scrollTop=0;m.style.transform="";if(ANIM_OK()){m.classList.remove("mat-entra");void m.offsetWidth;m.classList.add("mat-entra")}}};

