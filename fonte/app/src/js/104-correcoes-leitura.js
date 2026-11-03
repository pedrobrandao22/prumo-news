/* ---------- 104: correções da leitura (QA de 02/11) ---------- */
/* Busca: tocar num resultado da edição abre a matéria (como na Capa), sem pular para o Feed */
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const b=t.closest("#v-busca #bvres [data-busca]");if(!b||$("#layer").innerHTML)return;
  const id=b.dataset.busca;if(!pautaById(id))return;e.stopPropagation();e.preventDefault();abrirMateria(id)},true);
/* Quiz e Guardadas abertos fora do Perfil: o "‹ Perfil" do topo vira "‹ Capa" (ou de onde veio) e volta para lá */
var VOLTA_DE=null;
function vbackAjusta(){const n={capa:"Capa",feed:"Feed",busca:"Busca",msgs:"Conversas"}[VOLTA_DE];if(!n)return;
  ["#v-play","#v-saved"].forEach(s=>{const b=document.querySelector(s+" .vback");if(b){b.textContent="‹ "+n;b.dataset.vgo=VOLTA_DE;b.setAttribute("aria-label","Voltar para "+n)}})}
{const _go104=go;go=function(v,fromPop){const de=VIEW;
  if(v==="play"||v==="saved"){if(!fromPop&&de!==v&&de!=="play"&&de!=="saved")VOLTA_DE=de==="me"?null:de}else VOLTA_DE=null;
  if(v==="capa"&&window.FILTRO_CAPA){window.FILTRO_CAPA=0;if(FILTRO!=="tudo"){FILTRO="tudo";ssSet("radar-filtro",FILTRO);try{renderSecs();renderPosts()}catch(e){}}}
  const r=_go104.apply(this,arguments);try{vbackAjusta()}catch(e){}return r}}
{const _rp104=renderPlay;renderPlay=function(){const r=_rp104.apply(this,arguments);try{vbackAjusta()}catch(e){}return r}}
{const _rs104=renderSaved;renderSaved=function(){const r=_rs104.apply(this,arguments);try{vbackAjusta()}catch(e){}return r}}
/* Capa: o aviso de edição atrasada ou sem conexão também aparece no topo da Capa (antes só no Feed) */
{const _rc104=renderCapa;renderCapa=function(){const r=_rc104.apply(this,arguments);
  try{const top=document.querySelector("#v-capa .cp-top");const h=FEED&&typeof avisoAtraso==="function"?avisoAtraso():"";
    if(top&&h&&!document.querySelector("#v-capa .late")){top.insertAdjacentHTML("afterend",h);const l=document.querySelector("#v-capa .late");if(l)l.classList.remove("gut")}}catch(e){}return r}}
/* Perfil: depois de sair da conta, a tela volta ao topo (onde está o "Entrar") */
{const _sa104=sair;sair=async function(){const r=await _sa104.apply(this,arguments);try{if(VIEW==="me")window.scrollTo(0,0)}catch(e){}return r}}
/* foto que não carrega (sem internet): a bolinha do story mostra a ilustração em vez de um círculo vazio */
document.addEventListener("error",e=>{const im=e.target;if(!im||im.tagName!=="IMG")return;const f=im.closest&&im.closest("#secs .ig-f.paper");if(!f)return;
  const sec=(f.closest("[data-sec-story]")||{dataset:{}}).dataset.secStory;try{const p=sec&&(pautasDa(sec).find(x=>!SEEN.has(seenKey(x)))||pautasDa(sec)[0]);if(p&&!f.querySelector("svg"))f.insertAdjacentHTML("beforeend",svgOf(p.imagem))}catch(_){}},true);
/* linha do tempo da matéria: data que ainda vai acontecer (ex.: votação amanhã) aparece como "próximo passo", não como o ponto atual */
{const _mt104=matTempo;matTempo=function(p){const h=_mt104.apply(this,arguments);if(!h)return h;try{const tp=document.createElement("template");tp.innerHTML=h;
  const hj=hojeSP(),ano=hj.slice(0,4),lis=[...tp.content.querySelectorAll("li")];let fut=0;
  lis.forEach(li=>{const m=String(li.querySelector("time")?.textContent||"").trim().match(/^(\d{1,2})\/(\d{1,2})$/);if(m&&`${ano}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`>hj){li.classList.add("fut");li.classList.remove("ult");fut++}});
  if(fut){const pas=lis.filter(li=>!li.classList.contains("fut"));if(pas.length)pas[pas.length-1].classList.add("ult")}
  return fut?tp.innerHTML:h}catch(e){return h}}}
