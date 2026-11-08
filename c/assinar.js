/* Prumo News · assinatura das colunas por e-mail (página pública). Só a chave publicável (é pública, como no app). */
(function(){var U="https://kkzcljusiotoklldaupg.supabase.co",K="sb_publishable_s1mSA4gcb2qs6kVRZYQZ-g_BsvwvdIA";
function rpc(n,a){return fetch(U+"/rest/v1/rpc/"+n,{method:"POST",headers:{"apikey":K,"Content-Type":"application/json"},body:JSON.stringify(a)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j})})}
function msg(el,t){var m=el.querySelector(".cp-msg");if(m)m.textContent=t}
document.querySelectorAll("form.cp-form").forEach(function(f){f.addEventListener("submit",function(ev){ev.preventDefault();if(!U||!K)return;
  var em=(f.querySelector("input[type=email]").value||"").trim(),b=f.querySelector("button"),box=f.closest(".cp-box")||f;if(!em)return;b.disabled=true;msg(box,"Enviando…");
  rpc("newsletter_assinar",{p_email:em,p_coluna:f.getAttribute("data-coluna")}).then(function(r){msg(box,r==="limite"?"Muitos pedidos para este e-mail agora. Tente de novo mais tarde.":"Pronto! Mandamos um e-mail para "+em+". Toque no link dele para confirmar.");f.reset()})
  .catch(function(e){msg(box,/invalido/.test(String(e&&e.message))?"Confira o e-mail digitado.":"Não deu para assinar agora. Tente de novo.")}).then(function(){b.disabled=false})})});
var q=new URLSearchParams(location.search),st=document.getElementById("cp-estado");if(!st)return;
var t=q.get("confirmar"),c=q.get("cancelar"),fe=q.get("email"),fc=q.get("coluna");
try{if(t||c||fe)history.replaceState(null,"",location.pathname)}catch(e){}
function mostra(h,p){st.querySelector("h1").textContent=h;st.querySelector("p").textContent=p}
if(!U||!K){mostra("Assinatura","Esta página ainda não está ligada ao Prumo.");return}
if(t)rpc("newsletter_confirmar",{p_token:t}).then(function(r){if(r&&r.ok)mostra("Assinatura confirmada","Você vai receber as colunas de "+(r.nome||"a autora")+" quando saírem. Para sair, use o link “Cancelar” em qualquer e-mail.");else mostra("Link vencido ou inválido",r&&r.motivo==="expirado"?"O link de confirmação vale 7 dias. Peça de novo na página da coluna.":"Peça a assinatura de novo na página da coluna.")}).catch(function(){mostra("Não deu agora","Tente abrir o link de novo daqui a pouco.")});
else if(c)rpc("newsletter_cancelar",{p_token:c}).then(function(r){if(r&&r.ok)mostra("Assinatura cancelada","Você não vai mais receber as colunas de "+(r.nome||"a autora")+" por e-mail.");else mostra("Link inválido","Este link de cancelar não foi reconhecido.")}).catch(function(){mostra("Não deu agora","Tente abrir o link de novo daqui a pouco.")});
else if(fe&&fc)rpc("newsletter_assinar",{p_email:fe,p_coluna:fc}).then(function(r){mostra(r==="limite"?"Muitos pedidos":"Falta confirmar",r==="limite"?"Tente de novo mais tarde.":"Mandamos um e-mail para "+fe+". Toque no link dele para confirmar.")}).catch(function(){mostra("Não deu agora","Confira o e-mail e tente de novo.")});
})();
