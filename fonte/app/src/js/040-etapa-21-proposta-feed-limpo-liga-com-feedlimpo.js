/* ---------- Etapa 21: proposta "Feed limpo" (liga com ?feedlimpo=1) ---------- */
(function(){try{const q=new URLSearchParams(location.search).get("feedlimpo");if(q==="1")localStorage.setItem("prumo-feed-limpo","1");else if(q==="0")localStorage.removeItem("prumo-feed-limpo");
  if(q!==null)history.replaceState(history.state,"",location.pathname+location.hash);
  document.documentElement.classList.toggle("feed-limpo",localStorage.getItem("prumo-feed-limpo")==="1")}catch(e){}})();

