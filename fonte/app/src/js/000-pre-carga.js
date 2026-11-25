/* ---------- pré-carga (no <head>): a edição do dia começa a vir junto com a página ---------- */
/* o pedido do feed-leve.json (a Capa, ~1/3 do feed) sai antes de a página inteira chegar e ser lida; loadFeed usa este
   pedido (uma vez só, ver 119-feed-leve.js). Sem leve (ou leve com problema), loadFeed pede o feed.json inteiro, como antes. */
var FEED_PRE=null,FL119_PRE=null;try{FL119_PRE=fetch("feed-leve.json",{cache:"no-cache"}).then(r=>r.ok?r.text():null,()=>null)}catch(e){}
function feedPedido(){const p=FEED_PRE;FEED_PRE=null;if(!p)return fetch("feed.json",{cache:"no-cache"});return p.then(x=>{if(x.e)throw x.e;return x.r})}
/* 141 (abertura estável): antes da primeira pintura.
   - tema, tamanho da letra e "sem vidro" escolhidos pela pessoa já valem no esqueleto (antes, o esqueleto saía no tema do
     sistema e a Capa trocava de claro para escuro, ou o contrário, quando o código rodava);
   - "ab141-abrindo" desliga as transições da barra de abas até a Capa assentar (a pílula não desliza de "Feed" para "Capa");
   - a faixa "Agora" (novidades.json, ~9 KB gzip) começa a vir junto com o feed-leve: chega antes de o código terminar de ler a
     página, e a Capa já sai com a faixa (antes, ela chegava depois e empurrava a Capa já desenhada). carregarAgora usa este
     pedido uma vez só;
   - primeira visita (sem as fotos de arquivo no aparelho): "ab141-sem-arq" deixa a arte da manchete no formato da foto (4:3)
     até o fotos-arquivo.json chegar, para a foto entrar no mesmo lugar sem empurrar a Capa (o arquivo, ~60 KB gzip, não vem
     junto na pré-carga: na 1ª visita em 4G isso atrasava a Capa em ~0,5 s). carregarFotosArq tira a classe. */
var ab141Pre={};
(function(){try{var r=document.documentElement,P=null;r.classList.add("ab141-abrindo");
  try{P=JSON.parse(localStorage.getItem("radar-prefs")||"null")}catch(e){}
  if(P&&typeof P==="object"){var t=P.tema;if(t==="claro"||t==="escuro")r.setAttribute("data-aparencia",t);
    var z=+P.fonte||1;if(z!==1)r.style.setProperty("--fz",String(z));if(z>=1.2)r.classList.add("fzg");if(P.semVidro)r.classList.add("sem-vidro");
    var esc=t==="escuro"||(t!=="claro"&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches),m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",esc?"#000000":"#f3f4f6")}
  ab141Pre.novid=fetch("novidades.json?t="+Math.floor(Date.now()/6e4),{cache:"no-store"}).then(function(x){return x.ok?x.json():null}).catch(function(){return null});
  var fa=null;try{fa=localStorage.getItem("prumo-fotos-arq")}catch(e){}
  if(!fa)r.classList.add("ab141-sem-arq")}catch(e){}})();
/* 19/11 (testador, rede lenta na 1ª visita): o alto da Capa aparece em ~3 s, mas o código chega bem depois. Um toque na
   barra de baixo ou na manchete nesse meio-tempo fica guardado (o botão esmaece, sinal de que pegou) e é feito quando o
   app fica pronto (999); quem já tocou ou rolou não recebe o guia por cima do que está lendo (160 e 150). */
var TOQUE_CEDO=null,MEXEU_CEDO=false;
(function(){try{var m=function(){if(!window.__prumoPronto)MEXEU_CEDO=true};
  addEventListener("pointerdown",m,{passive:true});addEventListener("wheel",m,{passive:true});addEventListener("touchmove",m,{passive:true});
  document.addEventListener("click",function(e){if(window.__prumoPronto)return;MEXEU_CEDO=true;var b=e.target&&e.target.closest&&e.target.closest(".nav [data-v], .cp.f4-pre [data-cpx]");if(!b)return;
    try{var o=document.querySelector(".toque-cedo-b");if(o)o.classList.remove("toque-cedo-b")}catch(_){}
    TOQUE_CEDO={v:b.getAttribute("data-v"),cpx:b.getAttribute("data-cpx"),t:Date.now()};b.classList.add("toque-cedo-b");
    /* 25/11 (testador): sinal claro de que o toque pegou: o botão da barra fica marcado e aparece "Carregando…" */
    try{var v=b.getAttribute("data-v");if(v){document.querySelectorAll(".nav [data-v]").forEach(function(x){if(x===b)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current")})}
      var pl=document.getElementById("tc214");if(!pl){pl=document.createElement("div");pl.id="tc214";pl.setAttribute("role","status");document.body.appendChild(pl)}
      var nm={feed:"o Feed",msgs:"as Conversas",me:"o Perfil",capa:"a Capa"}[v]||"a notícia";pl.textContent="Carregando "+nm+"…";pl.className="on";
      var t0=Date.now(),fim=function(){if((window.__prumoPronto&&!TOQUE_CEDO)||Date.now()-t0>40000){pl.className="";setTimeout(function(){try{pl.remove()}catch(_){}},400);return}setTimeout(fim,250)};fim()}catch(_){}},true)}catch(e){}})();
