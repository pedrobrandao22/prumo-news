/* ---------- Etapa 66 ---------- */
function edGraf(t){try{if(window.Intl&&Intl.Segmenter)return [...new Intl.Segmenter("pt",{granularity:"grapheme"}).segment(t)].map(x=>x.segment)}catch(e){}return [...t]}
function edStOcupado(st){return edStTem(st)&&!(st.bg.tipo==="grad"&&!st.tracos.length&&st.els.length&&st.els.every(e=>e.t==="add"))}
/* vídeo da galeria dentro de uma seleção: não redesenha a cada item */
{const _vp66=edVidPronto;edVidPronto=async function(blob,modo,lote){if(!lote)return _vp66.apply(this,arguments);const d=edDesenha;edDesenha=function(){};try{await _vp66.call(this,blob,modo)}finally{edDesenha=d}}}
/* 1 e 2. antes de publicar: cabe no limite do servidor? animações sobram → viram texto fixo */
function edCabe(st){let it=edItens(st);const tam=()=>JSON.stringify({v:2,itens:it}).length;const ani=st.els.filter(e=>e.t==="texto"&&e.an);let mudou=false;
  while((it.length>=10&&st.els.filter(e=>!edAssa(e)||e.t==="men").length>10||tam()>6000)&&ani.length){ani.pop().an="";mudou=true;it=edItens(st)}
  if(st.els.filter(e=>!edAssa(e)||e.t==="men").length>10||tam()>6000)return "demais";return mudou?"ok-mudou":"ok"}
{const _ps66=edPublicaStory;edPublicaStory=async function(pub){if(!ED||ED.env)return _ps66.apply(this,arguments);if(ED.st.tx)edTextoOk();let aviso=false;
  for(let i=0;i<ED.sts.length;i++){const r=edCabe(ED.sts[i]);if(r==="demais"){ED.si=i;ED.st=ED.sts[i];edDesenha();toast(ED.st.els.filter(e=>!edAssa(e)||e.t==="men").length>10?"Este story tem figurinhas demais. Tire algumas (até 10 tocáveis).":"Este story ficou grande demais para salvar. Tire uma figurinha ou encurte os textos.");return}if(r==="ok-mudou")aviso=true}
  if(aviso)toast("Algumas animações de texto viraram texto fixo para caber no story.");return _ps66.apply(this,arguments)}}
/* 4. ordem dos amigos congelada enquanto você assiste */
{const _so66=storyOrdem;storyOrdem=function(){const L=_so66.apply(this,arguments);if(!ST||String(ST.sec||"").indexOf("_h:")===0)return L;if(!ST._uord)ST._uord=L.filter(x=>String(x).indexOf("_u:")===0);
  const vivos=ST._uord.filter(x=>x===ST.sec||(pubStoriesDe(String(x).slice(3)).length>0));return vivos.concat(L.filter(x=>String(x).indexOf("_u:")!==0))}}
{const _is66=igSet;igSet=function(){const u=ST&&ST._uord;const r=_is66.apply(this,arguments);if(u&&ST&&!ST._uord)ST._uord=u;return r}}
/* 5. vídeo: segurar pausa a barra também (mantém os controles normais do story) */
storyAuto=(function(ant){return function(p){const x=ST.itens&&ST.itens[ST.i];const vid=x&&x.estilo&&x.estilo.video&&String(ST.sec||"").indexOf("_u:")===0;
  if(!vid)return ant.apply(this,arguments);const pal=ST.palavras,sec=ST.sec;ST.palavras=1;ST.sec="__v";let r;try{r=ant.apply(this,arguments)}finally{ST.palavras=pal;ST.sec=sec}
  const dur=Math.max(2000,Math.min(31000,(+x.estilo.dur||8)*1000+250));clearTimeout(ST.timer);ST.timer=0;if(!PREF.storyAuto)return r;const fill=$("#layer .bars b");if(fill)fill.style.animationDuration=dur+"ms";ST.fim=Date.now()+dur;ST.resto=dur;ST.timer=setTimeout(()=>storyGo(1),dur);return r}})(storyAuto);
/* não retomar o story enquanto o dedo segura */
var IG_DEDO=false;document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest("#layer .story"))IG_DEDO=true},true);["pointerup","pointercancel"].forEach(k=>document.addEventListener(k,()=>{IG_DEDO=false},true));
{const _sr66=storyRetoma;storyRetoma=function(){if(IG_DEDO)return;return _sr66.apply(this,arguments)}}
/* 8. sair do Layout com fotos pede confirmação */
window.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer [data-edlaysai]");if(!b||!ED||ED.tela!=="lay")return;if(!ED.st.bg.cel.some(Boolean))return;if(Date.now()-(ED._laysai||0)<3000)return;
  e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();ED._laysai=Date.now();toast("Toque de novo para sair do Layout. As fotos serão descartadas.")},true);
{const _cl66=closeLayer;closeLayer=function(fromPop){if(fromPop===true&&ED&&ED.modo==="story"&&ED.tela==="lay"&&!$("#layer .ce-sel,#layer .ce-fig")&&ED.st.bg.cel&&ED.st.bg.cel.some(Boolean)&&Date.now()-(ED._laysai||0)>3000){ED._laysai=Date.now();if(pushH())HST++;toast("Volte de novo para sair do Layout. As fotos serão descartadas.");return}return _cl66.apply(this,arguments)}}
/* 9. selfie: a câmera volta depois de trocar de app */
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&ED&&$("#layer .ce-selfie")){camMonta();camLiga()}});

