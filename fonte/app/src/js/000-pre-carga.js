/* ---------- pré-carga (no <head>): a edição do dia começa a vir junto com a página ---------- */
/* o pedido do feed.json sai antes de a página inteira chegar e ser lida; loadFeed usa este pedido (uma vez só) */
var FEED_PRE=null;try{FEED_PRE=fetch("feed.json",{cache:"no-cache"}).then(r=>({r}),e=>({e}))}catch(e){}
function feedPedido(){const p=FEED_PRE;FEED_PRE=null;if(!p)return fetch("feed.json",{cache:"no-cache"});return p.then(x=>{if(x.e)throw x.e;return x.r})}
