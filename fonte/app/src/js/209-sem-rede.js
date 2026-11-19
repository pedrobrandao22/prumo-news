/* 19/11 — Sem internet com o app aberto: uma faixa discreta no topo diz que o que aparece é o que já foi baixado,
   e o fim do Feed deixa de dizer "Carregando mais notícias…" para sempre. Some sozinha quando a internet volta.
   Prefixo sr209. */
function sr209Faixa(off){try{let f=document.getElementById("sr209");
  if(off){if(!f){f=document.createElement("div");f.id="sr209";f.setAttribute("role","status");document.body.appendChild(f)}
    f.className="sr209";f.textContent="Sem conexão · mostrando o que já foi baixado"}
  else if(f){f.className="sr209 volta";f.textContent="Conexão de volta";clearTimeout(sr209Faixa.t);sr209Faixa.t=setTimeout(()=>{try{f.remove()}catch(e){}},2200)}
  document.body.classList.toggle("sr209-off",!!off);sr209Mais()}catch(e){}}
function sr209Mais(){try{const m=document.getElementById("mais");if(!m)return;let s=m.querySelector(".sr209-m");
  if(document.body.classList.contains("sr209-off")){if(!s){s=document.createElement("p");s.className="sr209-m";s.textContent="Sem conexão. Mais notícias quando a internet voltar.";m.appendChild(s)}}
  else if(s)s.remove()}catch(e){}}
addEventListener("offline",()=>sr209Faixa(true));
addEventListener("online",()=>sr209Faixa(false));
try{if(navigator.onLine===false)setTimeout(()=>sr209Faixa(true),0)}catch(e){}
try{new MutationObserver(()=>{if(document.body.classList.contains("sr209-off"))sr209Mais()}).observe(document.getElementById("posts")||document.body,{childList:true})}catch(e){}
