/* ===== Revisão da madrugada 21/11 ===== */

/* testador (materia-deitada-barra-do-topo-some): deitado, a barra de cima da matéria some ao descer e volta ao subir
   um pouco ou perto do começo (o CSS 90 só age com pouca altura) */
var MT211_Y=new WeakMap();
document.addEventListener("scroll",e=>{const m=e.target;if(!m||!m.classList||!m.classList.contains("mat"))return;
  try{if(!matchMedia("(max-height:500px)").matches){m.classList.remove("mt211-ve");return}
    const y=m.scrollTop,a=MT211_Y.has(m)?MT211_Y.get(m):y;
    if(y<80)m.classList.add("mt211-ve");else if(y<a-6)m.classList.add("mt211-ve");else if(y>a+6)m.classList.remove("mt211-ve");
    if(!MT211_Y.has(m)||Math.abs(y-a)>6||y<80)MT211_Y.set(m,y)}catch(er){}},true);
/* matéria aberta (no topo): a barra começa visível */
(function(){const ob=()=>{const L=document.getElementById("layer");if(!L)return false;
  new MutationObserver(()=>{const m=L.querySelector(".mat:not(.mt211-ok)");if(m)m.classList.add("mt211-ok","mt211-ve")}).observe(L,{childList:true,subtree:true});return true};
  if(!ob())document.addEventListener("DOMContentLoaded",ob)})();

/* testador (girar-o-celular-na-materia-perde-o-ponto-de-leitura-2): gráficos e fotos mudam de altura depois do giro;
   o 168 restaurava o ponto até 450 ms. Mais duas tentativas tardias e o bloqueio da âncora vai junto */
addEventListener("resize",()=>{try{if(typeof CM168_ANC==="undefined"||!CM168_ANC)return;const a=CM168_ANC;
  CM168_GIRO=Math.max(CM168_GIRO,Date.now()+1400);
  [800,1250].forEach(t=>setTimeout(()=>{const mm=$("#layer .mat");if(mm&&typeof cm168Restaura==="function")cm168Restaura(mm,a)},t))}catch(e){}});

/* varredura 21/11: no Enviar e nas conversas a notícia aparecia com a ilustração genérica de jornal enquanto o Feed e a
   matéria mostram a foto (6×1 com a foto de Lula). O cartão usa a mesma foto quando a notícia ainda está na edição */
{const _sc211=shareCard;shareCard=function(s,attrs){const h=_sc211.apply(this,arguments);try{const p=s&&s.id&&typeof pautaById==="function"?pautaById(s.id):null;
  const f=p&&typeof fotoDe==="function"?fotoDe(p):null;if(!f||!f.url)return h;
  const i=h.indexOf("<svg"),j=h.indexOf("</svg>",i);if(i<0||j<0)return h;
  /* sem a foto (rede, site da foto fora do ar) volta o desenho */
  return h.slice(0,i)+`<span class="sh211-f"><img src="${esc(f.url)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="var s=this.parentNode;s.nextElementSibling&&(s.nextElementSibling.hidden=false);s.remove()"></span><span class="sh211-d" hidden>${h.slice(i,j+6)}</span>`+h.slice(j+6)}catch(e){return h}}}

/* testador (folha-agora-lista-os-assuntos-fora-da-ordem-de-hora): "há 44 min, há 1 h, há 13 min" parecia bagunça; o peso
   continua escolhendo quais entram, mas a lista (folha e faixa) sai da mais nova para a mais antiga */
{const _ai211=agoraItens;agoraItens=function(){const l=_ai211.apply(this,arguments);try{return Array.isArray(l)?l.slice().sort((a,b)=>(+b.h||0)-(+a.h||0)):l}catch(e){return l}}}

/* testador (atualizar-a-pagina-no-feed-abre-a-capa-ja-rolada-ate-o-meio): ao recarregar (ou o celular reabrir a aba),
   o navegador devolvia a altura do Feed na Capa. Ao terminar de abrir na Capa, volta ao topo (a restauração do navegador
   fica: "manual" quebrava o Feed depois de publicar) */
addEventListener("pageshow",e=>{try{if(e.persisted)return;const vai=()=>{if(!$("#layer").innerHTML&&typeof VIEW!=="undefined"&&VIEW==="capa"&&scrollY>0)scrollTo(0,0)};vai();setTimeout(vai,60);setTimeout(vai,400)}catch(er){}});

/* testador (tamanho-da-letra-fica-aberto-por-cima-do-texto-ao-rolar-2): o 210 só marcava a altura no primeiro "scroll", então
   a primeira rolada não fechava o "Aa". A altura passa a ser marcada ao abrir e depois de cada toque em A−/A+ (a letra
   nova muda a altura do texto sem a pessoa rolar) */
function mt211AaMarca(){try{const ab=$("#layer .mat-aap"),m=$("#layer .mat");if(ab&&m)ab.dataset.ct210y=m.scrollTop}catch(e){}}
{const _ml211=matLetra;matLetra=function(){const r=_ml211.apply(this,arguments);mt211AaMarca();return r}}
document.addEventListener("click",e=>{try{if(e.target&&e.target.closest&&e.target.closest("#layer .mat-aap [data-matfz]"))[60,250].forEach(t=>setTimeout(mt211AaMarca,t))}catch(er){}},true);
