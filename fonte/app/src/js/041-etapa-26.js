/* ---------- Etapa 26 ---------- */
function abrirMudou(){if(!FEED)return;const m=FEED.mudancas||{},it=(Array.isArray(m.itens)?m.itens:[]).filter(x=>x&&x.texto);const L=lente();
  const nome={nova:"Nova",atualizada:"Atualizada",virou:"Virou",encerrada:"Encerrada",corrigida:"Correção"};
  sheet("O que mudou",`<p class="hint" style="margin:0">Edição das ${esc(hhmm(FEED.atualizado_em))}${m.titulo?" · "+esc(m.titulo):""}</p><ul class="mud-l">${it.map(x=>{const p=x.pid&&pautaById(x.pid);const k=`<b class="mud-k ${esc(x.tipo||"")}">${esc(nome[x.tipo]||"Novidade")}</b>`;
    return `<li>${p?`<button type="button" data-mudouir="${esc(x.pid)}">${k}<span class="mud-t">${esc(versao(p,L).titulo)}</span><span class="mud-x">${esc(x.texto)}</span></button>`:`<div>${k}<span class="mud-x">${esc(x.texto)}</span></div>`}</li>`}).join("")||`<li><div><span class="mud-x">Sem mudanças listadas nesta edição.</span></div></li>`}</ul>`);uso("o_que_mudou")}
/* janelas por cima: a página de baixo fica parada */
var TRAVA_Y=null;
function travarFundo(){if(TRAVA_Y!==null)return;window.PULA_SCROLL=Date.now();TRAVA_Y=scrollY;const b=document.body;b.style.position="fixed";b.style.top=(-TRAVA_Y)+"px";b.style.left="0";b.style.right="0";b.style.width="100%";document.documentElement.classList.add("travado")}
function destravarFundo(){if(TRAVA_Y===null)return;const y=TRAVA_Y;window.PULA_SCROLL=Date.now();TRAVA_Y=null;const b=document.body;b.style.position="";b.style.top="";b.style.left="";b.style.right="";b.style.width="";document.documentElement.classList.remove("travado");window.scrollTo(0,y)}
function temJanela(){const a=$("#layer"),b=$("#layer2");return !!((a&&a.innerHTML)||(b&&b.innerHTML))}
(function(){const ob=new MutationObserver(()=>{if(temJanela())travarFundo();else destravarFundo()});["#layer","#layer2"].forEach(sel=>{const el=$(sel);if(el)ob.observe(el,{childList:true})})})();
(function(){const ant=closeLayer;closeLayer=function(){const l2=$("#layer2"),l1=$("#layer");const fica=!!(l2&&l2.innerHTML&&l1&&l1.innerHTML);if(!fica)destravarFundo();return ant.apply(this,arguments)}})();
/* segurar o dedo: nada de seleção nem menu do sistema */
document.addEventListener("contextmenu",e=>{if(e.target.closest&&e.target.closest(".cpi-b,.post .cover,.post .sl,.pv,[data-capair],[data-cp1m],.cp-agora,.mat-rel"))e.preventDefault()});
(function(){const ant=abrirPrevia;abrirPrevia=function(){const r=ant.apply(this,arguments);try{const s=getSelection();if(s)s.removeAllRanges()}catch(e){}return r}})();
document.addEventListener("pointerup",()=>{try{const s=getSelection();if(s&&!s.isCollapsed&&$("#layer .pv"))s.removeAllRanges()}catch(e){}},true);

