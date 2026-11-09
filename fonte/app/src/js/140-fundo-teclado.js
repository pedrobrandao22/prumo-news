/* ===== 140 · Fundo atrás do teclado (iPhone) =====
   O 138 (editor de coluna) e o 139 (telas e folhas com campo de texto) fazem a tela ocupar só a área visível acima do
   teclado. No iOS o teclado é translúcido e fica por cima da página: a faixa entre o fim da tela e o fundo do aparelho
   mostrava o que estava por baixo (fotos do Feed). Aqui a tela "estende" a própria cor de fundo para baixo do teclado
   com uma sombra sólida (box-shadow com spread), que pinta logo abaixo dela e acima da página. */
const FT140={on:new Set(),rt:[]};
function ft140Cor(el){let c="";try{c=getComputedStyle(el).backgroundColor}catch(e){}
  if(!c||c==="transparent"||/rgba\([^)]*,\s*0\)$/.test(c)){try{c=getComputedStyle(document.body).backgroundColor}catch(e){}}
  if(!c||c==="transparent"||/rgba\([^)]*,\s*0\)$/.test(c))c=document.documentElement.classList.contains("dark")?"#111":"#fff";return c}
function ft140Aplica(){const alvo=new Set();const ed=document.querySelector("#layer > .ed132.cr137-kb");if(ed)alvo.add(ed);
  document.querySelectorAll(".tc139-vv").forEach(e=>alvo.add(e));
  FT140.on.forEach(e=>{if(!alvo.has(e)){e.style.removeProperty("box-shadow");FT140.on.delete(e)}});
  alvo.forEach(e=>{e.style.setProperty("box-shadow","0 0 0 100vmax "+ft140Cor(e),"important");FT140.on.add(e)})}
function ft140Agenda(){FT140.rt.forEach(clearTimeout);requestAnimationFrame(ft140Aplica);FT140.rt=[150,400].map(ms=>setTimeout(ft140Aplica,ms))}
if(window.visualViewport){visualViewport.addEventListener("resize",ft140Agenda);visualViewport.addEventListener("scroll",ft140Agenda)}
addEventListener("focusin",ft140Agenda,true);addEventListener("focusout",ft140Agenda,true);addEventListener("resize",ft140Agenda);
