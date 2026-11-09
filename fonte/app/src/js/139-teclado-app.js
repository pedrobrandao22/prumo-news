/* ---------- 139: teclado do celular em todo o app (iPhone/Safari/PWA e Android) ----------
   O 138 resolveu o editor de coluna; o Pedro viu o mesmo problema nas outras telas com campo de texto (criar post e
   story, comentários, conversas, folhas). Uma solução só, para todas:
   TC01 Área visível: a cada mudança do visualViewport, :root ganha --tc-vh (altura visível), --tc-vt (topo visível,
        quando o Safari "puxa" a tela) e --tc-kb (o que o teclado cobre), e o <html> a classe tc139-kb com o teclado
        aberto. No iPhone o teclado não encolhe a página; no Android (interactive-widget=resizes-content) encolhe e o
        teclado é percebido pela altura.
   TC02 Telas e folhas: com o teclado aberto, a tela fixa de tela cheia que contém o campo (criação de post/story,
        folhas com fundo escurecido etc.) passa a ocupar só a área visível (classe tc139-vv): os botões do rodapé
        (Publicar, Enviar) e a barra de cima ficam acima do teclado; a folha cresce até a altura visível. Dentro delas
        --kb vale 0 (o ajuste antigo de padding pelo teclado não soma duas vezes). Ficam de fora o editor de coluna (138
        cuida) e os stories (o 059/098 já sobem o rodapé de responder/comentar).
   TC03 Linha digitada à vista: ao focar, digitar, colar, trocar a seleção e quando o teclado abre ou muda, o campo
        rola o próprio contêiner (não a janela) para a linha do cursor ficar com folga acima do teclado; se o campo é o
        último do formulário e o botão de enviar cabe junto, o botão também aparece (como no login).
   TC04 A página de baixo não rola: com uma tela/folha aberta e o teclado aberto, o <html> trava; quando o iPhone
        rola a página para "mostrar" o campo, ela volta para onde estava ao fechar o teclado.
   TC05 Sem zoom do iPhone: em telas de toque, campo com fonte menor que 16 px ganha 16 px (classe tc139-16), conferido
        quando a tela muda e no toque, antes do foco.
   TC06 Toques que não fecham o teclado: tocar no botão de enviar/publicar do mesmo formulário do campo, ou nas
        ferramentas do texto do story, não tira o foco do campo (pointerdown/mousedown sem o padrão).
   Nomes globais com o prefixo tc139 / TC139. */

var TC139={hmax:Math.max(window.innerHeight||0,0),w:window.innerWidth||0,kb:false,h:0,t:0,rv:0,rt:[],y:0,trava:false,f16:0};
const TC139_CAMPO='input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]):not([type="image"]),textarea,select,[contenteditable=""],[contenteditable="true"]';
/* telas que já cuidam do próprio teclado */
const TC139_FORA="#layer > .ed132, .story";
const tc139Coarse=()=>{try{return matchMedia("(pointer:coarse)").matches}catch(e){return false}};
const tc139Campo=e=>!!(e&&e.nodeType===1&&e.matches&&e.matches(TC139_CAMPO)&&!e.readOnly&&!e.disabled);
const tc139Ativo=()=>{const a=document.activeElement;return tc139Campo(a)?a:null};
const tc139Aberto=()=>!!(($("#layer2")&&$("#layer2").innerHTML)||($("#layer")&&$("#layer").innerHTML));

/* ===== TC01: área visível ===== */
function tc139Vv(){const v=window.visualViewport,r=document.documentElement;const h=Math.round(v?v.height:innerHeight),t=Math.round(v?Math.max(0,v.offsetTop):0);
  if(innerWidth!==TC139.w){TC139.w=innerWidth;TC139.hmax=0}TC139.hmax=Math.max(TC139.hmax,innerHeight,h);
  r.style.setProperty("--tc-vh",h+"px");r.style.setProperty("--tc-vt",t+"px");r.style.setProperty("--tc-kb",Math.max(0,Math.round(innerHeight-h-t))+"px");
  const kb=tc139Coarse()&&TC139.hmax-h>120,antes=TC139.kb,mudou=kb!==antes||h!==TC139.h||t!==TC139.t;TC139.kb=kb;TC139.h=h;TC139.t=t;
  r.classList.toggle("tc139-kb",kb);tc139Marca();tc139Trava();
  if(antes&&!kb)tc139Volta();
  if(mudou&&kb){tc139Revela();TC139.rt.forEach(clearTimeout);/* o teclado do iPhone anima: confere de novo quando assenta */TC139.rt=[120,360].map(ms=>setTimeout(tc139Revela,ms))}}
if(window.visualViewport){visualViewport.addEventListener("resize",tc139Vv);visualViewport.addEventListener("scroll",tc139Vv)}
addEventListener("resize",tc139Vv);
addEventListener("orientationchange",()=>setTimeout(()=>{TC139.hmax=0;tc139Vv()},300));

/* ===== TC02: a tela/folha do campo ocupa a área visível ===== */
/* o contêiner fixo de tela cheia que contém o campo (a .scrim da folha, a .ce da criação…) */
function tc139Tela(f){let e=f&&f.parentElement;while(e&&e!==document.body&&e!==document.documentElement){
    if(e.classList.contains("tc139-vv"))return e;
    const cs=getComputedStyle(e);if(cs.position==="fixed"){const b=e.getBoundingClientRect();if(b.top<=2&&b.bottom>=innerHeight-2&&b.height>=innerHeight*.9)return e;}
    e=e.parentElement}return null}
function tc139Marca(){const f=TC139.kb?tc139Ativo():null;let alvo=null;
  if(f&&!f.closest(TC139_FORA)){alvo=tc139Tela(f)}
  document.querySelectorAll(".tc139-vv").forEach(e=>{if(e!==alvo)e.classList.remove("tc139-vv")});
  if(alvo&&!alvo.classList.contains("tc139-vv"))alvo.classList.add("tc139-vv")}

/* ===== TC03: a linha do cursor fica à vista ===== */
/* posição da linha do cursor: espelho do campo (input/textarea) ou Range (contenteditable) */
function tc139Cursor(f){try{const fr=f.getBoundingClientRect();
  if(f.isContentEditable){const s=getSelection();if(s&&s.rangeCount&&f.contains(s.focusNode)){const rg=s.getRangeAt(0).cloneRange();rg.collapse(false);const b=rg.getClientRects()[0];if(b&&b.height)return {top:b.top,bottom:b.bottom}}return {top:fr.top,bottom:Math.min(fr.bottom,fr.top+40)}}
  if(f.tagName!=="TEXTAREA")return {top:fr.top,bottom:fr.bottom};
  const cs=getComputedStyle(f),m=document.createElement("div");
  ["boxSizing","width","paddingTop","paddingRight","paddingBottom","paddingLeft","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth","fontFamily","fontSize","fontWeight","fontStyle","lineHeight","letterSpacing","textTransform","wordSpacing","textIndent","tabSize","textAlign"].forEach(k=>{m.style[k]=cs[k]});
  m.style.cssText+=";position:absolute;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;border-style:solid;top:0;left:-9999px;height:auto";
  const fim=typeof f.selectionEnd==="number"?f.selectionEnd:f.value.length;m.textContent=f.value.slice(0,fim);const sp=document.createElement("span");sp.textContent="​";m.appendChild(sp);document.body.appendChild(m);
  const y=sp.offsetTop-f.scrollTop,lh=sp.offsetHeight||parseFloat(cs.lineHeight)||20;m.remove();
  const top=Math.max(fr.top,Math.min(fr.bottom-lh,fr.top+y));return {top,bottom:Math.min(fr.bottom,top+lh+parseFloat(cs.paddingBottom||0))}}catch(e){const r=f.getBoundingClientRect();return {top:r.top,bottom:r.bottom}}}
function tc139Rolavel(e){const cs=getComputedStyle(e);return /(auto|scroll)/.test(cs.overflowY)&&e.scrollHeight>e.clientHeight+1}
function tc139Revela(){cancelAnimationFrame(TC139.rv);TC139.rv=requestAnimationFrame(tc139RevelaJa)}
function tc139RevelaJa(){const f=tc139Ativo();if(!f||!TC139.kb||f.closest(TC139_FORA))return;
  const v=window.visualViewport,vt=v?v.offsetTop:0,vb=v?v.offsetTop+v.height:innerHeight;
  let c=tc139Cursor(f);
  /* último campo do formulário: o botão de enviar vem junto, se couber */
  const fm=f.form||f.closest("form");if(fm){const bs=[...fm.querySelectorAll('button[type="submit"],button:not([type]),input[type="submit"]')].filter(b=>b.offsetHeight&&(f.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING));
    const b=bs[bs.length-1];if(b){const br=b.getBoundingClientRect();if(br.bottom>c.bottom&&br.bottom-c.top<(vb-vt)*.7)c={top:c.top,bottom:br.bottom}}}
  const tela=tc139Tela(f);let e=f.parentElement,n=0;
  while(e&&e!==document.body&&n++<30){
    if(tc139Rolavel(e)){const r=e.getBoundingClientRect(),top=Math.max(r.top,vt)+8,bot=Math.min(r.bottom,vb),alto=bot-top;
      if(alto>40){const folga=Math.max(10,Math.min(28,alto/8));let d=0;
        if(c.bottom>bot-folga)d=c.bottom-(bot-folga);else if(c.top<top)d=c.top-top;
        /* não passa o topo do campo para cima da área (campo maior que a área: fica a linha do cursor) */
        if(d){const antes=e.scrollTop;e.scrollTop+=Math.round(d);const feito=e.scrollTop-antes;c={top:c.top-feito,bottom:c.bottom-feito}}}}
    if(e===tela)break;e=e.parentElement}}
document.addEventListener("focusin",e=>{if(!tc139Campo(e.target))return;tc139F16(e.target);if(!TC139.kb){tc139Vv();return}tc139Marca();tc139Trava();tc139Revela();[120,360].forEach(ms=>setTimeout(tc139Revela,ms))});
/* caixa de texto com rolagem própria: escrevendo no fim, a última linha fica à vista dentro da caixa (o Safari às vezes não rola) */
window.addEventListener("input",e=>{const t=e.target;try{if(t&&t.tagName==="TEXTAREA"&&t.scrollHeight>t.clientHeight+2&&t.selectionEnd>=t.value.length)t.scrollTop=t.scrollHeight}catch(x){}
  if(TC139.kb&&tc139Campo(t)&&t===document.activeElement)tc139Revela()});
document.addEventListener("selectionchange",()=>{if(TC139.kb&&tc139Ativo())tc139Revela()});
document.addEventListener("focusout",()=>setTimeout(()=>{if(!tc139Ativo()){tc139Marca();tc139Trava()}},0));
/* a tela redesenhou (criação, folha nova): marca de novo */
{const ob=()=>{if(TC139.kb)setTimeout(()=>{tc139Marca();tc139Trava();tc139Revela()},0);tc139F16Tudo()};
  ["layer","layer2"].forEach(id=>{const L=document.getElementById(id);if(L&&window.MutationObserver)new MutationObserver(ob).observe(L,{childList:true})})}

/* ===== TC04: a página de baixo não rola ===== */
function tc139Trava(){const on=TC139.kb&&tc139Aberto()&&!!tc139Ativo();if(on===TC139.trava)return;TC139.trava=on;const r=document.documentElement;
  if(on){TC139.y=window.scrollY||0;r.classList.add("tc139-trava")}else{r.classList.remove("tc139-trava");tc139Volta()}}
function tc139Volta(){if(!tc139Aberto())return;if(Math.abs((window.scrollY||0)-TC139.y)>2)try{window.scrollTo(0,TC139.y)}catch(e){}}
addEventListener("scroll",()=>{if(TC139.trava&&!TC139.kb&&Math.abs((window.scrollY||0)-TC139.y)>2)try{window.scrollTo(0,TC139.y)}catch(e){}},{passive:true});

/* ===== TC05: 16 px nos campos em telas de toque (o iPhone dá zoom abaixo disso) ===== */
function tc139F16(f){if(!f||!tc139Coarse()||f.classList.contains("tc139-16")||f.closest("#layer > .ed132"))return;try{if(parseFloat(getComputedStyle(f).fontSize)<15.9)f.classList.add("tc139-16")}catch(e){}}
function tc139F16Tudo(){if(!tc139Coarse())return;cancelAnimationFrame(TC139.f16);TC139.f16=requestAnimationFrame(()=>{document.querySelectorAll(TC139_CAMPO).forEach(tc139F16)})}
/* no toque, antes do foco (vale também para campos fora das camadas) */
document.addEventListener("touchstart",e=>{const t=e.target;if(!t||!t.closest)return;const l=t.closest("label");const f=tc139Campo(t)?t:(l?l.querySelector(TC139_CAMPO):null);if(f)tc139F16(f)},{passive:true,capture:true});
if(document.readyState!=="loading")tc139F16Tudo();else document.addEventListener("DOMContentLoaded",tc139F16Tudo);
{const _g=typeof go==="function"?go:null;if(_g)go=function(){const r=_g.apply(this,arguments);try{tc139F16Tudo()}catch(e){}return r}}

/* ===== TC06: tocar em enviar/publicar e nas ferramentas do texto não fecha o teclado ===== */
["pointerdown","mousedown"].forEach(k=>document.addEventListener(k,e=>{const f=tc139Ativo(),t=e.target;if(!f||!t||!t.closest||f.closest("#layer > .ed132"))return;
  const b=t.closest("button");if(!b||b.disabled)return;
  const fm=f.form||f.closest("form");if((fm&&fm.contains(b))||(b.closest(".ce-tx")&&f.closest(".ce-tx")&&!b.closest("[data-edtxok]")))e.preventDefault()},true));

tc139Vv();
