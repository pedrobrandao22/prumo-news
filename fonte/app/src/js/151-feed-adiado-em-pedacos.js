/* ---------- 151: o Feed desenhado "no ocioso" sai em pedaços (14/11) ----------
   Quem abre na Capa tem o Feed desenhado logo depois, num momento ocioso (035/103). Medido com CPU 4×: esse desenho era a
   maior tarefa da abertura (300–600 ms de uma vez, ~1 s depois da Capa aparecer), somando a Capa de novo (quando as fotos
   de arquivo chegam), os círculos do topo e os posts; um toque nesse meio-tempo esperava tudo. Agora, quando o Feed é
   desenhado sem estar na tela, a Capa e os círculos vão para tarefas seguintes (o toque passa no meio). Ir para o Feed
   antes disso desenha o que faltar na hora. Nomes com o prefixo pf151. */
var PF151={fila:[],t:0};
function pf151Roda(){PF151.t=0;const f=PF151.fila.shift();if(!f)return;try{f()}catch(e){}if(PF151.fila.length)PF151.t=setTimeout(pf151Roda,0)}
function pf151Tudo(){if(PF151.t){clearTimeout(PF151.t);PF151.t=0}while(PF151.fila.length){const f=PF151.fila.shift();try{f()}catch(e){}}}
{const _rf151=RF_REAL;RF_REAL=function(){if(VIEW==="feed")return _rf151.apply(this,arguments);
  const rc=renderCapa,rs=renderSecs;let capa=null,secs=null;
  renderCapa=function(){const a=arguments,t=this;capa=()=>rc.apply(t,a)};renderSecs=function(){const a=arguments,t=this;secs=()=>rs.apply(t,a)};
  try{return _rf151.apply(this,arguments)}finally{renderCapa=rc;renderSecs=rs;
    /* a Capa (que está na tela) primeiro; os círculos do Feed depois */
    if(capa)PF151.fila.push(capa);if(secs)PF151.fila.push(secs);if(PF151.fila.length&&!PF151.t)PF151.t=setTimeout(pf151Roda,0)}}}
{const _go151=go;go=function(v){if(PF151.fila.length)pf151Tudo();return _go151.apply(this,arguments)}}
