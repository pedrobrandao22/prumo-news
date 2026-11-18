/* o carregamento com a edição em cache acontece antes destes complementos: redesenha uma vez com tudo pronto */
cp200Pronta();  /* 200-capa.js: a Capa passa a desenhar com todos os acabamentos */
if(FEED){try{if(VIEW==="feed")renderPosts();else if(VIEW==="capa")renderCapa()}catch(e){}}
