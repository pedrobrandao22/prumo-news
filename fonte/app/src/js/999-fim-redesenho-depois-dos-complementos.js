/* o carregamento com a edição em cache acontece antes destes complementos: redesenha uma vez com tudo pronto */
nucPronto();  /* 201-nucleo.js: go passa a fazer tudo (na carga o 031 abriu a Capa só com a parte de então) */
cp200Pronta();  /* 200-capa.js: a Capa passa a desenhar com todos os acabamentos */
if(FEED){try{if(VIEW==="feed")renderPosts();else if(VIEW==="capa")renderCapa()}catch(e){}}
