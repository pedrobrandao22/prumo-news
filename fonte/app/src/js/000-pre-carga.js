/* ---------- pré-carga (no <head>): a edição do dia começa a vir junto com a página ---------- */
/* o pedido do feed-leve.json (a Capa, ~1/3 do feed) sai antes de a página inteira chegar e ser lida; loadFeed usa este
   pedido (uma vez só, ver 119-feed-leve.js). Sem leve (ou leve com problema), loadFeed pede o feed.json inteiro, como antes. */
var FEED_PRE=null,FL119_PRE=null;try{FL119_PRE=fetch("feed-leve.json",{cache:"no-cache"}).then(r=>r.ok?r.text():null,()=>null)}catch(e){}
function feedPedido(){const p=FEED_PRE;FEED_PRE=null;if(!p)return fetch("feed.json",{cache:"no-cache"});return p.then(x=>{if(x.e)throw x.e;return x.r})}
