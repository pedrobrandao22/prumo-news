/* Pendências pequenas 12/11/2026 (145).
   Sugestões de @ na legenda do criador (post, reel, fotos): a caixa flutuava por cima da linha "Marcar pessoas".
   Agora ela entra logo abaixo da legenda, empurrando as linhas para baixo; nada fica coberto. */
{const _ms145=menSugere;menSugere=function(i){const r=_ms145.apply(this,arguments);
  try{if(MEN_BOX&&MEN_BOX.isConnected&&MEN_INP===i&&i.id==="ce-leg"){MEN_BOX.classList.add("men-in145");MEN_BOX.style.left=MEN_BOX.style.top=MEN_BOX.style.bottom=MEN_BOX.style.width="";if(i.nextElementSibling!==MEN_BOX)i.insertAdjacentElement("afterend",MEN_BOX)}}catch(e){}return r}}
