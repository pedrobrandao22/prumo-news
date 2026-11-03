/* ---------- 104: correções dos stories (QA 02/11) ---------- */
/* 1. ordem dos amigos = a ordem que está na bandeja quando você toca (antes era recalculada com os vistos no fim:
   abrir um story já visto pulava os amigos que estavam depois dele na bandeja) */
{const _so104=storyOrdem;storyOrdem=function(){const novo=!!(ST&&!ST._uord);const L=_so104.apply(this,arguments);
  try{if(novo&&ST&&ST._uord&&String(ST.sec||"").indexOf("_u:")===0&&String(ST.sec).indexOf("_u:~")!==0){
    const tr=[...document.querySelectorAll("#secs [data-ustory]")].map(b=>"_u:"+b.dataset.ustory);
    if(tr.includes(ST.sec)){const pos=x=>{const k=tr.indexOf(x);return k<0?1e3:k};const u=ST._uord.slice().sort((a,b)=>pos(a)-pos(b));
      if(ST._uord[0]==="_u:"+S.uid&&u[0]!==ST._uord[0]){u.splice(u.indexOf(ST._uord[0]),1);u.unshift(ST._uord[0])}
      ST._uord=u;return _so104.apply(this,arguments)}}}catch(e){}return L}}
/* 2. deslizar para o lado troca de "bolinha": as telas da Agenda fazem parte do "Em 5 min" (101), então deslizar
   a partir do "Em 5 min" vai para "Últimas" (antes caía na Agenda, que parece o mesmo story) */
let SS104_GRUPO=false;
{const _so104g=storyOrdem;storyOrdem=function(){const L=_so104g.apply(this,arguments);
  try{if(SS104_GRUPO&&ST&&L.includes("_5min")&&L.includes("_ag")&&typeof bt101Cinco==="function"&&bt101Cinco())return L.filter(x=>x!==(ST.sec==="_ag"?"_5min":"_ag"))}catch(e){}return L}}
{const _ss104=storySec;storySec=function(){SS104_GRUPO=true;try{return _ss104.apply(this,arguments)}finally{SS104_GRUPO=false}}}
{const _di104=igDragIni;igDragIni=function(){SS104_GRUPO=true;try{return _di104.apply(this,arguments)}finally{SS104_GRUPO=false}}}
/* 3. story aberto pelo Arquivo ou pelo perfil de um amigo: fechar (✕, deslizar ou voltar do celular) volta para o
   Arquivo / o perfil, e não para o Feed (o story ocupa a mesma camada e antes apagava a tela de onde veio) */
let RET104P=null;
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  const b=t.closest("#layer [data-pfstory]");if(b){const u=b.dataset.pfstory;RET104P={t:Date.now(),abre:()=>abrirPerfil(u)};return}
  if(t.closest("#secs [data-ustory],#secs [data-meustory]")){RET104P=null;if(ST)ST._ret104=null}},true);
{const _ia104=igAbrirUser;igAbrirUser=async function(){const p=RET104P&&Date.now()-RET104P.t<2500?RET104P:null;RET104P=null;if(ST)ST._ret104=null;
  const r=await _ia104.apply(this,arguments);if(p&&ST&&$("#layer .story"))ST._ret104=p.abre;return r}}
{const _sl104=stLista;stLista=function(lista,i,nome,chave){const doArq=chave==="a"&&!!$("#layer .pfv-arq");const r=_sl104.apply(this,arguments);
  if(ST)ST._ret104=doArq&&ST.sec==="_u:~a"?()=>abrirArquivo():null;return r}}
{const _cl104=closeLayer;closeLayer=function(){const ret=!!$("#layer .story")&&!$("#layer2").innerHTML&&ST&&ST._ret104;if(ret)ST._ret104=null;const r=_cl104.apply(this,arguments);
  if(ret){const v=VIEW,th=typeof THREAD!=="undefined"?THREAD:null;setTimeout(()=>{try{if(VIEW===v&&(typeof THREAD==="undefined"||THREAD===th)&&!$("#layer").innerHTML&&!$("#layer2").innerHTML&&!ED&&S.uid)ret()}catch(e){}},420)}return r}}
/* 4. miniaturas do Arquivo e do "Novo destaque": as figurinhas "vivas" (notícia, post compartilhado, enquete, pergunta…)
   não estão na imagem do story, então a miniatura ficava só com o fundo. Agora mostra um cartãozinho com o que é. */
function ar104Rotulo(x){try{const it=(x&&x.estilo&&Array.isArray(x.estilo.itens)?x.estilo.itens:[]);
  for(const e of it){if(e.t==="nt"){let t=e.tit;if(!t)try{const p=e.pid&&pautaById(e.pid);t=p&&versao(p,lente()).titulo}catch(_){}return "📰 "+(t||"Notícia")}if(e.t==="pub")return "Post de "+String(nomeDe(e.au)||"").split(" ")[0];}
  for(const e of it){if(["enq","quiz","perg","slid","cont","add"].includes(e.t)&&e.q)return e.q}}catch(e){}return ""}
function ar104Marca(raiz,sel,achar){if(!raiz)return;raiz.querySelectorAll(sel).forEach(b=>{if(b.querySelector(".ar104"))return;const x=achar(b);const t=ar104Rotulo(x);if(!t)return;
  b.insertAdjacentHTML("beforeend",`<span class="ar104">${esc(String(t).slice(0,70))}</span>`)})}
{const _ad104=arqDesenha;arqDesenha=function(){const r=_ad104.apply(this,arguments);try{ar104Marca($("#layer .pfv-arq"),"[data-arqi]",b=>(ARQ||[])[+b.dataset.arqi])}catch(e){}return r}}
{const _dn104=destNovo;destNovo=async function(){const r=await _dn104.apply(this,arguments);try{ar104Marca(document.querySelector(".sheet .dest-pick")?.closest(".sheet"),"[data-destsel]",b=>(ARQ||[]).find(x=>String(x.id)===b.dataset.destsel))}catch(e){}return r}}
/* 5. anel verde dos Melhores amigos: aparece quando há um story para os Melhores amigos que você ainda não viu
   (antes só olhava o último story; se o amigo postasse outro depois, o verde sumia mesmo sem você ter visto) */
{const _rs104=renderSecs;renderSecs=function(){const r=_rs104.apply(this,arguments);try{document.querySelectorAll("#secs [data-ustory]").forEach(b=>{const xs=pubStoriesDe(b.dataset.ustory);
  if(xs.some(x=>x.publico==="proximos"&&!PUB_VISTOS.has(x.id)))b.querySelector(".ig-r")?.classList.add("ma")})}catch(e){}return r}}
/* 6. apagar story pelo "Mais" (apaga em modo quieto): a bandeja não era redesenhada e o seu anel continuava lá
   (cinza) depois de apagar todos */
{const _pa104=pubApagar;pubApagar=async function(id,quieto){const x=pubDe(id),st=x&&x.tipo==="story";const r=await _pa104.apply(this,arguments);try{if(r&&quieto&&st)pubRedesenha()}catch(e){}return r}}
