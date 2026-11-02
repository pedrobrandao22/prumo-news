/* ---------- Etapa 51: revisão geral ---------- */
function horaDia(iso){const d=new Date(iso);if(isNaN(d))return "";const dia=dataSP(iso),hoje=hojeSP();if(dia===hoje)return hhmm(iso);
  if(dia===somaDias(hoje,-1))return "ontem, "+hhmm(iso);const w=d.toLocaleDateString("pt-BR",{weekday:"short",timeZone:"America/Sao_Paulo"}).replace(".","");return `${w} (${+dia.slice(8,10)}), ${hhmm(iso)}`}
function atualizadoTxt(iso){const t=horaDia(iso);if(!t)return "Atualizado";return dataSP(iso)===hojeSP()?"Atualizado às "+t:"Atualizado "+t.replace(/, /,", às ")}
/* voltar da matéria: diz de onde veio */
var VOLTA_NOME={capa:"Capa",feed:"Feed",busca:"Busca",saved:"Guardadas",me:"Perfil",msgs:"Conversas",play:"Interagir"};
{const _am51=abrirMateria;abrirMateria=function(){const r=_am51.apply(this,arguments);try{if(!document.getElementById("sg-fundo")){const b=$("#layer .mat-v"),n=VOLTA_NOME[VIEW]||"";if(b&&n){b.textContent="‹ "+n;b.setAttribute("aria-label","Voltar para "+(VIEW==="busca"?"a Busca":VIEW==="saved"?"Guardadas":VIEW==="me"?"o Perfil":VIEW==="msgs"?"Conversas":VIEW==="feed"?"o Feed":"a Capa"))}}}catch(e){}return r}}
/* matéria aberta pelo story: a próxima é a próxima notícia do story */
{const _mp51=matProx;matProx=function(pid){if(IG_VOLTA&&document.getElementById("sg-fundo")&&Array.isArray(IG_VOLTA.ids)){const ids=IG_VOLTA.ids.filter(x=>!/#v$/.test(x)&&!/^(ag|h\d)/.test(x));const i=ids.indexOf(pid);const nx=i>=0?ids[i+1]:null;return nx?pautaById(nx):null}return _mp51.apply(this,arguments)}}
{const _mi51=matIr;matIr=function(pid){if(IG_VOLTA&&Array.isArray(IG_VOLTA.ids)){const k=IG_VOLTA.ids.indexOf(pid);if(k>=0)IG_VOLTA.i=k}return _mi51.apply(this,arguments)}}
/* botão das versões: some ao rolar para baixo, volta ao rolar para cima */
(function(){let y0=scrollY,oc=false;addEventListener("scroll",()=>{const y=scrollY,dy=y-y0;if(Math.abs(dy)<6)return;const novo=dy>0&&y>120;if(novo!==oc){oc=novo;document.documentElement.classList.toggle("lp-some",oc)}y0=y},{passive:true})})();
/* indicadores: dia do dado quando não é de hoje */
{const _it51=indTile;indTile=function(x){let h=_it51.apply(this,arguments);try{const d=x&&x.data&&/^\d{4}-\d{2}-\d{2}/.test(x.data)?x.data.slice(0,10):"";if(d&&d!==hojeSP()){const w=new Date(d+"T12:00:00Z").toLocaleDateString("pt-BR",{weekday:"short",timeZone:"UTC"}).replace(".","");h=h.replace(/<\/(button|div)>$/,`<small class="ind-d">${esc(w)} (${+d.slice(8,10)})</small></$1>`)}}catch(e){}return h}}

