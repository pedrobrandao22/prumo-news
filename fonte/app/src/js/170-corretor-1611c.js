/* ---------- 170: corretor 16/11 noite (achado do testador) ----------
   Derrota da Seleção para o Japão abria com o Ancelotti de corpo inteiro, com a camisa do Bayern, e o corte do quadro
   tirava o rosto. 1. a foto sai do acervo (aqui e no robô de fotos, tools/fotos_arquivo.py); 2. retrato de pessoa
   (foto de arquivo de alguém citado no título) mostra a parte de cima da foto, onde fica o rosto, no Feed, na Capa e na
   matéria. Prefixo cr170. */
try{FT157_BLOQ.push("carlo ancelotti 2016 icc")}catch(e){}
function cr170Retrato(u){try{const A=FOTOS_ARQ;if(!A||!A.pessoas||!u)return false;const n=faNome(u);if(!n)return false;
  for(const k in A.pessoas){const x=A.pessoas[k];if(x&&Array.isArray(x.fotos)&&x.fotos.some(g=>g&&(faNome(g.url)===n||g.local&&String(u).indexOf(g.local)>=0)))return true}
  return false}catch(e){return false}}
function cr170Marca(raiz){try{if(typeof FOTOS_ARQ==="undefined"||!FOTOS_ARQ||!FOTOS_ARQ.pessoas)return;(raiz||document).querySelectorAll("img:not([data-cr170])").forEach(im=>{const s=im.getAttribute("src")||"";if(!s||/^data:/.test(s))return;
  im.setAttribute("data-cr170",cr170Retrato(s)?"1":"0")})}catch(e){}}
var CR170_OBS=null;
function cr170Liga(){if(CR170_OBS||typeof MutationObserver==="undefined")return;let t=0;
  CR170_OBS=new MutationObserver(()=>{if(t)return;t=setTimeout(()=>{t=0;cr170Marca()},60)});
  try{CR170_OBS.observe(document.body,{childList:true,subtree:true})}catch(e){}cr170Marca()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",cr170Liga);else cr170Liga();
