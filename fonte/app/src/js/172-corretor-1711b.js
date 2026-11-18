/* ---------- 172: corretor 17/11 noite (achados do testador) ----------
   1. Fies: a "Vista de Goiânia a partir da Faculdade..." (céu, palmeiras e um estacionamento vazio) sai do acervo, aqui e
      no robô de fotos (tools/fotos_arquivo.py). A Reitoria da UFG continua valendo.
   2. Letra grande no celular pequeno: se mesmo sem os pontinhos (.vn-aperta) "Comentar" e "Repostar" não cabem e viram
      "Come…"/"Repo…", a fileira fica só com ícone + número (o nome continua no aria-label para o leitor de tela).
      Mudar o tamanho da letra mede de novo (antes só a largura da tela fazia isso).
   3. Perfil: "Minhas colunas" e "Coberturas que sigo" lado a lado, numa linha só, para "Nova publicação" do Perfil
      vazio caber acima da barra de baixo já na abertura. */
try{FT157_BLOQ.push("vista de goiania a partir da faculdade")}catch(e){}

/* 2. letra grande: só ícones quando o rótulo não cabe */
function fc172Corta(a){return [...a.querySelectorAll(":scope>.act>span")].some(s=>s.offsetWidth&&s.scrollWidth>s.clientWidth+1)}
if(typeof vn112Aperta==="function"){const _ap172=vn112Aperta;vn112Aperta=function(el,forca){
  const a=el&&el.querySelector&&el.querySelector(".acts");if(a&&forca)a.classList.remove("fc172-ic");
  const r=_ap172.apply(this,arguments);
  try{if(a&&a.isConnected&&!a.classList.contains("fc172-ic")&&a.classList.contains("vn-aperta")&&fc172Corta(a))a.classList.add("fc172-ic")}catch(e){}
  return r}}
function fc172Remede(){try{document.querySelectorAll(".post").forEach(e=>{const a=e.querySelector(".acts");if(a&&a.offsetParent)vn112Aperta(e,true)})}catch(e){}}
if(typeof aplicarFonte==="function"){const _af172=aplicarFonte;aplicarFonte=function(){const r=_af172.apply(this,arguments);
  try{requestAnimationFrame(()=>requestAnimationFrame(fc172Remede))}catch(e){}return r}}

