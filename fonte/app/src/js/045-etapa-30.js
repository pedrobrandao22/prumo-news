/* ---------- Etapa 30 ---------- */
function fotoMini(u){const m=typeof u==="string"&&u.match(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/([a-z]+)\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+\.(?:jpe?g|png|webp))$/i);return m?`https://upload.wikimedia.org/wikipedia/${m[1]}/thumb/${m[2]}/${m[3]}/${m[4]}/250px-${m[4]}`:u}
function faceFoto(p){const f=p&&fotoDe(p);if(!f)return "";return `<img class="face-i" src="${escU(fotoMini(f.url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`}
/* fotos de arquivo chegaram depois do Feed montado (1ª visita): refaz os círculos */
if(!FOTOS_ARQ)(function w(n){if(FOTOS_ARQ&&FEED){try{if(document.querySelector("#secs .sb"))renderSecs();if(document.querySelector("#posts .post")&&(VIEW!=="feed"||scrollY<60)&&!temJanela())renderPosts(true)}catch(e){}return}if(n<60)setTimeout(()=>w(n+1),250)})(0);
/* botão de leitura: só o ícone enquanto rola para baixo */
(function(){let y0=scrollY,t=null;addEventListener("scroll",()=>{const b=document.getElementById("lp");if(!b)return;const y=scrollY;if(Date.now()-(window.PULA_SCROLL||0)<300){y0=y;return}
  if(y>y0+6&&y>120)b.classList.add("lp-mini");else if(y<y0-6)b.classList.remove("lp-mini");y0=y;clearTimeout(t);t=setTimeout(()=>{const c=document.getElementById("lp");if(c&&scrollY<400)c.classList.remove("lp-mini")},1400)},{passive:true})})();

