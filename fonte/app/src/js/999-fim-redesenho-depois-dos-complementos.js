/* o carregamento com a edição em cache acontece antes destes complementos: redesenha uma vez com tudo pronto */
nucPronto();  /* 201-nucleo.js: go passa a fazer tudo (na carga o 031 abriu a Capa só com a parte de então) */
cp200Pronta();  /* 200-capa.js: a Capa passa a desenhar com todos os acabamentos */
cv203Pronta();  /* 203-conversas.js: allMsgs passa a valer com bloqueados, antigas carregadas e conversas apagadas */
fd204Pronta();  /* 204-feed.js: as funções do Feed passam a fazer tudo (na carga o 029 desenhou o Feed só com a base) */
if(FEED){try{if(VIEW==="feed")renderPosts();else if(VIEW==="capa")renderCapa()}catch(e){}}
/* 19/11: o toque feito antes de o app ficar pronto (000) */
window.__prumoPronto=true;
(function tc999(n){try{const T=TOQUE_CEDO;if(!T){document.querySelectorAll(".toque-cedo-b").forEach(b=>b.classList.remove("toque-cedo-b"));return}
  if(!FEED&&n<60){setTimeout(()=>tc999(n+1),250);return}TOQUE_CEDO=null;document.querySelectorAll(".toque-cedo-b").forEach(b=>b.classList.remove("toque-cedo-b"));
  if(Date.now()-T.t>30000)return;
  if(T.v){const b=document.querySelector(`.nav [data-v="${T.v}"]`);if(b)b.click()}
  else if(T.cpx){const b=document.querySelector(`#v-capa [data-cpx="${CSS.escape(T.cpx)}"]`);if(b)b.click()}}catch(e){}})(0);
