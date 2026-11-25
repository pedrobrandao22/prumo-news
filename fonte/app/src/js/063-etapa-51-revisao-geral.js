/* ---------- Etapa 51: revisão geral ---------- */
function horaDia(iso){const d=new Date(iso);if(isNaN(d))return "";const dia=dataSP(iso),hoje=hojeSP();if(dia===hoje)return hhmm(iso);
  if(dia===somaDias(hoje,-1))return "ontem, "+hhmm(iso);const w=d.toLocaleDateString("pt-BR",{weekday:"short",timeZone:"America/Sao_Paulo"}).replace(".","");return `${w} (${+dia.slice(8,10)}), ${hhmm(iso)}`}
function atualizadoTxt(iso){const t=horaDia(iso);if(!t)return "Atualizado";return dataSP(iso)===hojeSP()?"Atualizado às "+t:"Atualizado "+t.replace(/, /,", às ")}
/* voltar da matéria: diz de onde veio */
var VOLTA_NOME={capa:"Capa",feed:"Feed",busca:"Busca",saved:"Guardados",me:"Perfil",msgs:"Conversas",play:"Interagir"};
/* botão das versões: some ao rolar para baixo, volta ao rolar para cima */
(function(){let y0=scrollY,oc=false;addEventListener("scroll",()=>{const y=scrollY,dy=y-y0;if(Math.abs(dy)<6)return;const novo=dy>0&&y>120;if(novo!==oc){oc=novo;document.documentElement.classList.toggle("lp-some",oc)}y0=y},{passive:true})})();
/* indicadores: dia do dado quando não é de hoje */
{const _it51=indTile;indTile=function(x){let h=_it51.apply(this,arguments);try{const d=x&&x.data&&/^\d{4}-\d{2}-\d{2}/.test(x.data)?x.data.slice(0,10):"";if(d){const w=new Date(d+"T12:00:00Z").toLocaleDateString("pt-BR",{weekday:"short",timeZone:"UTC"}).replace(".","");const dias=Math.round((Date.parse(hojeSP()+"T12:00:00Z")-Date.parse(d+"T12:00:00Z"))/864e5);const lab=d===hojeSP()?"hoje":dias<7?`${w} (${+d.slice(8,10)})`:new Date(d+"T12:00:00Z").toLocaleDateString("pt-BR",{day:"numeric",month:"short",timeZone:"UTC"}).replace(".","").replace(" de "," ");h=h.replace(/<\/(button|div)>$/,`<small class="ind-d">${esc(lab)}</small></$1>`)}}catch(e){}return h}}

