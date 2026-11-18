/* 190 · corretor 18/11 (exceção da Fase 3: o app perdia o que a pessoa escreveu).
   Na tela "Notícia" (aberta pela caixa ou pelo "O que você acha?" do Feed), o botão "Giro" ao lado de "Publicar" fechava a
   tela e tentava abrir o editor de giro, que está escondido desde 17/11 (182, FT182_ESCONDE "giro"): nada era publicado e o
   comentário sumia. Com a criação de giros escondida, o botão sai da tela (fica só "Publicar") e, se algum caminho ainda o
   chamar, nada fecha. O "+" do topo deixa de se chamar "Criar post ou giro" para o leitor de tela. Nomes com o prefixo sg190. */
function sg190Esc(){try{return typeof ft182Esc==="function"&&ft182Esc("giro")}catch(e){return false}}
{const _pp190=cn102PostParaStory;cn102PostParaStory=function(){if(sg190Esc())return;return _pp190.apply(this,arguments)}}
{const _dt190=cn102Det;cn102Det=function(el){const r=_dt190.apply(this,arguments);
  try{if(sg190Esc())[el,document.getElementById("layer")].forEach(r=>{if(r&&r.querySelectorAll)r.querySelectorAll("[data-cn102nst]").forEach(b=>b.remove())})}catch(e){}return r}}
try{if(sg190Esc()){const b=document.getElementById("b-criar");if(b)b.setAttribute("aria-label","Criar publicação")}}catch(e){}
