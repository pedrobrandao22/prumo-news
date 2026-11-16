/* 163 · Link da notícia pelo título (decisão do Pedro, 16/11). Prefixo lk163.
   O robô (tools/paginas.py) grava m/<título-da-notícia>.html e m/indice.json ({id: endereço}). Ao compartilhar, o app usa
   o endereço pelo título quando ele já está no índice; senão usa o m/<id>.html, que continua valendo (links antigos). */
var LK163={};
function lk163Carrega(){try{fetch("m/indice.json",{cache:"no-cache"}).then(r=>r.ok?r.json():null).then(j=>{if(j&&typeof j==="object")LK163=j}).catch(()=>{})}catch(e){}}
{const _lm163=linkMateria;linkMateria=function(pid){const l=_lm163.apply(this,arguments);try{const s=LK163[pid];
  if(typeof s==="string"&&/^[a-z0-9-]{8,90}$/.test(s))return l.replace(/\/m\/[^/]+\.html$/,"/m/"+s+".html")}catch(e){}return l}}
setTimeout(lk163Carrega,2500);
addEventListener("online",()=>setTimeout(lk163Carrega,1500));
