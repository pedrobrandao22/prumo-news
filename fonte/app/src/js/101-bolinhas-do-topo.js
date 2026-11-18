/* ---------- 101: só duas bolinhas de abertura no topo do Feed ("Em 5 min" e "Últimas"), depois os temas ---------- */
/* "Sua semana" sai da fileira (continua em Perfil › Conta). A Agenda deixa de ter bolinha própria
   e vira as últimas telas do "Em 5 min" (hoje e o próximo dia com compromissos: no máximo 2 telas). */
{const _agp101=agPaginas;agPaginas=function(){const l=_agp101.apply(this,arguments);return l.slice(0,2)}}

function bt101Cinco(){try{return cincoLista().length>0}catch(e){return false}}
function bt101N5(){try{return igLista("_5min").ps.length}catch(e){return 0}}
/* "Em 5 min": a barra de progresso já mostra as telas da Agenda que vêm em seguida */

