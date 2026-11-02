/* ---------- Etapa 55 ---------- */
var IG_PREVIA=false;
{const _pv55=igPrevia;igPrevia=function(fn){IG_PREVIA=true;try{return _pv55.apply(this,arguments)}finally{IG_PREVIA=false}}}
{const _ml55=marcarLida;marcarLida=function(pid){if(String(pid||"").indexOf("u:")===0)return;return _ml55.apply(this,arguments)}}
{const LF0=listaFeed,_ad55=atualizarEmDia;atualizarEmDia=function(){const lf=listaFeed;listaFeed=LF0;try{return _ad55.apply(this,arguments)}finally{listaFeed=lf}}}

