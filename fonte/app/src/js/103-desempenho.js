/* ---------- desempenho: abrir e trocar de tela mais rápido ---------- */
/* 1. versão nova vinda do service worker: ele abre a cópia guardada na hora e avisa quando guardou uma página nova.
      Recarrega sozinho se a pessoa ainda não mexeu; senão fica para a volta ao app (o mesmo caminho do versao.json).
      No máximo uma recarga automática dessas a cada 5 minutos (se a rede alternar entre cópias, não fica em ciclo). */
(function(){if(!("serviceWorker" in navigator))return;
  navigator.serviceWorker.addEventListener("message",e=>{const d=e.data;if(!d||d.prumo!=="pagina-nova")return;const v=String(d.v||"sw");
    let ult=0;try{if(sessionStorage.getItem("prumo-recarregou")===v)return;ult=+sessionStorage.getItem("prumo-recarga-sw")||0}catch(_){}
    if(!VERSAO_NOVA)VERSAO_NOVA=v;
    if(Date.now()-ult<5*60e3)return;  // já recarregou há pouco: espera a volta ao app
    if(!MEXEU&&scrollY<40&&!temJanela()){try{sessionStorage.setItem("prumo-recarga-sw",String(Date.now()))}catch(_){}tentarRecarregar(false)}});
})();
/* 2. com o Feed escondido (a pessoa está na Capa), não desenhar o Feed inteiro: só o primeiro lote.
      (escondido, o "#mais" parece estar sempre na tela e o carregamento seguia até o fim; o resto vem ao rolar, como sempre) */
{const _cm102=carregarMais;carregarMais=function(sync){if(!sync){const v=document.getElementById("v-feed");if(v&&v.hidden)return}return _cm102.apply(this,arguments)}}
/* 3. o Feed adiado (desenhado num momento ocioso) não redesenha a Capa se nada nela mudou */
if(typeof RF_REAL==="function"){const _rf102=RF_REAL;RF_REAL=function(){if(VIEW!=="capa")return _rf102.apply(this,arguments);
  const rc=renderCapa;renderCapa=function(){if(!document.querySelector("#v-capa .cpi")||capaSig()!==CAPA_SIG)return rc.apply(this,arguments)};
  try{return _rf102.apply(this,arguments)}finally{renderCapa=rc}}}
/* 4. Capa e Feed já mostrados uma vez ficam montados quando escondidos (ver css/18-desempenho.css): trocar de aba fica leve */
{const _go102=go;go=function(v){const r=_go102.apply(this,arguments);try{const s=(v==="feed"||v==="capa")&&document.getElementById("v-"+v);if(s&&!s.classList.contains("cv-pronto"))requestAnimationFrame(()=>requestAnimationFrame(()=>s.classList.add("cv-pronto")))}catch(e){}return r}}
if(VIEW==="capa"||VIEW==="feed"){const s=document.getElementById("v-"+VIEW);if(s)requestAnimationFrame(()=>requestAnimationFrame(()=>s.classList.add("cv-pronto")))}
