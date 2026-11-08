/* ---------- 138: editor de coluna no celular de verdade (iPhone/Safari/PWA e Android) ----------
   O Pedro testou no iPhone: o menu Inserir não fechava, a tela não descia com o texto e a linha digitada ficava atrás do
   teclado. Causas e o que muda:
   MB01 Área visível: no iPhone o teclado não encolhe a página (o layout fica com a altura toda e o teclado, com a barra
        ^ v ✓ do Safari, cobre a parte de baixo). O editor passa a ocupar exatamente a área visível (visualViewport:
        topo = offsetTop, altura = height) e a barra de formatação é a última faixa dessa área (não fica mais "solta" por
        cima do texto nem atrás do teclado). Sem a folga da barra de início (safe-area) quando o teclado está aberto.
        No Android (Chrome encolhe a página com interactive-widget=resizes-content) o teclado é percebido pela altura.
        A página por baixo fica travada enquanto o editor está aberto (o iPhone não rola mais o Feed por trás).
   MB02 Linha do cursor sempre à vista: a cada letra, Enter, colar, troca de seleção e abertura do teclado, o editor rola
        a própria área de texto (não a janela) para a linha ficar com folga acima da barra (e acima do menu, se aberto).
        Espaço extra no fim do texto (40% da tela, como Notion/Bear) para a última linha poder subir; tocar nesse espaço
        põe o cursor no fim.
   MB03 Menu Inserir e folhas: fecha ao tocar fora (inclusive no texto), ao arrastar/rolar, com Esc, ao digitar algo que
        não filtra nenhuma opção, ao apagar o "/", ao trocar de linha e no botão × do próprio menu; o "+" abre e fecha.
        Depois de fechado, continuar digitando na mesma linha não o reabre (só um "/" novo). No celular abre como folha
        compacta (grade 3×3) logo acima da barra, e o texto rola para a linha atual ficar acima dela.
   MB04 Blocos como no Notion: Backspace no começo de título, subtítulo, citação ou item de lista volta a parágrafo;
        Enter em item vazio sai da lista; Enter no fim de título/subtítulo abre parágrafo.
   MB05 Acentos e sugestões do teclado: durante a composição (compositionstart…end) nada mexe no texto (atalhos de
        markdown e as correções do 135 esperam), para não quebrar acento, ditado nem a autocorreção do iOS.
   MB06 Toques: tocar em qualquer botão da barra ou do menu não tira o foco do texto (o teclado não fecha); sem zoom do
        iPhone ao tocar nos campos de "Antes de publicar" e das folhas (fonte de 16 px); sem atraso de duplo toque.
   Nomes globais com o prefixo mb138 / MB138. */

var MB138={comp:false,hmax:Math.max(window.innerHeight||0,0),w:window.innerWidth||0,kb:false,h:0,t:-1,rv:0,rt:[],toque:false,prog:0,mbloco:null,desc:null,y:0,trava:false};
const mb138El=()=>document.querySelector("#layer > .ed132");
const mb138Cp=()=>document.getElementById("ed132-corpo");
const mb138Coarse=()=>{try{return matchMedia("(pointer:coarse)").matches}catch(e){return false}};

/* ===== MB01: o editor ocupa a área visível ===== */
function mb138Vv(){const el=mb138El(),v=window.visualViewport;const h=Math.round(v?v.height:innerHeight),t=Math.round(v?Math.max(0,v.offsetTop):0);
  if(innerWidth!==MB138.w){MB138.w=innerWidth;MB138.hmax=0}MB138.hmax=Math.max(MB138.hmax,innerHeight,h);
  if(!el)return;el.style.setProperty("--cr137-vh",h+"px");el.style.setProperty("--cr137-vt",t+"px");el.style.setProperty("--ed132-kb","0px");
  const kb=mb138Coarse()&&MB138.hmax-h>120;el.classList.toggle("cr137-kb",kb);
  const mudou=kb!==MB138.kb||h!==MB138.h;MB138.kb=kb;MB138.h=h;MB138.t=t;
  if(mudou){mb138MenuLugar();mb138Revela();/* o teclado do iPhone anima: confere de novo quando assenta */MB138.rt.forEach(clearTimeout);MB138.rt=[120,360].map(ms=>setTimeout(()=>{mb138MenuLugar();mb138Revela()},ms))}}

/* trava a página por baixo enquanto o editor está aberto (e devolve a rolagem do Feed ao fechar) */
function mb138Trava(){const on=!!mb138El();if(on===MB138.trava)return;MB138.trava=on;const r=document.documentElement;
  if(on){MB138.y=window.scrollY||0;r.classList.add("mb138-on");MB138.hmax=Math.max(MB138.hmax,innerHeight);mb138Vv()}
  else{r.classList.remove("mb138-on");MB138.desc=null;MB138.mbloco=null;if(Math.abs((window.scrollY||0)-MB138.y)>2)try{window.scrollTo(0,MB138.y)}catch(e){}}}
{const L=document.getElementById("layer");if(L&&window.MutationObserver)new MutationObserver(mb138Trava).observe(L,{childList:true})}
/* o iPhone às vezes rola a página para "mostrar" o cursor: com o editor aberto, ela volta para onde estava */
addEventListener("scroll",()=>{if(MB138.trava&&Math.abs((window.scrollY||0)-MB138.y)>2&&!MB138.kb)try{window.scrollTo(0,MB138.y)}catch(e){}},{passive:true});

/* ===== MB02: a linha do cursor fica à vista, acima da barra (e do menu) ===== */
function mb138CaretRect(s){try{const rg=s.getRangeAt(0).cloneRange();rg.collapse(false);let r=rg.getClientRects()[0];if(r&&(r.height||r.top))return r;
  /* linha vazia (<p><br></p>) não tem retângulo: usa o <br> ou o bloco */
  const c=rg.endContainer;let n=c.nodeType===1?(c.childNodes[rg.endOffset]||c.childNodes[rg.endOffset-1]||c):c.parentNode;if(n&&n.nodeType===3)n=n.parentNode;
  r=n&&n.getBoundingClientRect?n.getBoundingClientRect():null;if(r&&r.height>80){const lh=parseFloat(getComputedStyle(n).lineHeight)||30;return {top:r.bottom-lh,bottom:r.bottom,height:lh}}return r}catch(e){return null}}
function mb138Limites(el,sc){const v=window.visualViewport,sr=sc.getBoundingClientRect();let top=Math.max(sr.top,v?v.offsetTop:0),bot=Math.min(sr.bottom,v?v.offsetTop+v.height:innerHeight);
  const bar=el.querySelector(".ed132-bar");if(bar&&!bar.hidden&&bar.offsetHeight){const b=bar.getBoundingClientRect();if(b.top>top)bot=Math.min(bot,b.top)}
  const m=el.querySelector(".ed132-menu");if(m&&!m.hidden){const b=m.getBoundingClientRect();if(b.top>top+60)bot=Math.min(bot,b.top)}return {top,bot}}
function mb138Rola(sc,d){if(!d)return;MB138.prog=Date.now();sc.scrollTop+=Math.round(d)}
function mb138Revela(){cancelAnimationFrame(MB138.rv);MB138.rv=requestAnimationFrame(mb138RevelaJa)}
function mb138RevelaJa(){const el=mb138El(),cp=mb138Cp();if(!el||!cp||ED132.E&&ED132.E.ver)return;const sc=el.querySelector(".ed132-sc"),s=getSelection();
  if(!sc||sc.hidden||!s||!s.rangeCount||!cp.contains(s.focusNode))return;if(MB138.toque&&!s.isCollapsed)return;
  const r=mb138CaretRect(s);if(!r)return;const L=mb138Limites(el,sc),alto=L.bot-L.top;if(alto<40)return;
  const folga=Math.max(16,Math.min(56,alto/5));
  if(r.bottom>L.bot-folga)mb138Rola(sc,r.bottom-(L.bot-folga));else if(r.top<L.top+8)mb138Rola(sc,r.top-(L.top+8)-Math.min(40,alto/4))}
/* depois de cada mudança no texto e de cada troca de seleção (sem brigar com quem arrasta as alças da seleção) */
window.addEventListener("input",e=>{if(e.target&&e.target.id==="ed132-corpo")mb138Revela()});
document.addEventListener("selectionchange",()=>{const cp=mb138Cp();if(!cp)return;const s=getSelection();if(!s||!s.rangeCount||!cp.contains(s.focusNode))return;
  mb138MenuLinha();if(s.isCollapsed)mb138Revela()});
document.addEventListener("focusin",e=>{if(e.target&&e.target.id==="ed132-corpo")mb138Revela()});
document.addEventListener("touchstart",e=>{if(e.target&&e.target.closest&&e.target.closest("#layer > .ed132 .ed132-sc"))MB138.toque=true},{passive:true,capture:true});
["touchend","touchcancel"].forEach(k=>document.addEventListener(k,()=>{MB138.toque=false},{passive:true,capture:true}));
/* tocar no espaço extra abaixo do texto põe o cursor no fim (como no Notion) */
window.addEventListener("click",e=>{const t=e.target,cp=mb138Cp();if(!cp||!t||!t.closest||!t.closest("#layer > .ed132 .ed132-sc"))return;if(t.closest("#ed132-corpo,textarea,input,button,figure,.ed132-capa,a"))return;
  const r=cp.getBoundingClientRect();if(e.clientY<r.bottom)return;try{cp.focus({preventScroll:true})}catch(_){}const u=cp.lastElementChild;
  ed132CaretFim(u&&u.tagName!=="FIGURE"&&u.tagName!=="HR"?u:cp);mb138Revela()});
/* "Antes de publicar": o campo tocado não fica atrás do botão do rodapé nem do teclado */
document.addEventListener("focusin",e=>{const t=e.target,pps=t&&t.closest&&t.closest("#layer > .ed132 .ed132-pps");if(!pps||!t.matches("input,textarea"))return;
  const vai=()=>{if(!t.isConnected||document.activeElement!==t)return;const a=pps.getBoundingClientRect(),v=window.visualViewport,b=t.getBoundingClientRect();
    const bot=Math.min(a.bottom,v?v.offsetTop+v.height:innerHeight)-16,top=a.top+8;if(b.bottom>bot)pps.scrollTop+=b.bottom-bot;else if(b.top<top)pps.scrollTop-=top-b.top};
  [60,360].forEach(ms=>setTimeout(vai,ms))});

/* ===== MB03: menu Inserir ===== */
const MB138_CURTO={p:"Parágrafo",h2:"Título",h3:"Subtítulo",q:"Citação",ul:"Lista",ol:"Numerada",hr:"Separador",foto:"Foto",graf:"Gráfico"};
const mb138MenuAberto=()=>{const m=document.querySelector("#layer > .ed132 .ed132-menu");return !!(m&&!m.hidden)};
function mb138MenuLugar(){const el=mb138El(),m=el&&el.querySelector(".ed132-menu");if(!m||m.hidden)return;const bar=el.querySelector(".ed132-bar"),er=el.getBoundingClientRect();
  if(innerWidth>=760){m.style.removeProperty("--mb138-mb");m.style.removeProperty("--mb138-mh");return}
  const bt=bar&&!bar.hidden&&bar.offsetHeight?bar.getBoundingClientRect().top:er.bottom,hd=el.querySelector(".ed132-h"),ht=hd?hd.getBoundingClientRect().bottom:er.top;
  m.style.setProperty("--mb138-mb",Math.max(0,Math.round(er.bottom-bt+6))+"px");
  /* deixa pelo menos duas linhas de texto à vista entre o cabeçalho e o menu (a linha atual rola para lá) */
  m.style.setProperty("--mb138-mh",Math.max(112,Math.min(260,Math.round(bt-ht-84)))+"px")}
{const _ma=ed132MenuAbre;ed132MenuAbre=function(q,barra){
  /* fechado na mão: digitar mais na mesma linha não reabre (só um "/" novo) */
  if(barra&&MB138.desc&&MB138.desc===ed132Topo()&&MB138.desc.isConnected&&/^\//.test(MB138.desc.textContent||""))return;
  MB138.desc=null;const r=_ma.apply(this,arguments);try{const m=document.querySelector("#layer > .ed132 .ed132-menu");if(m&&!m.hidden){
    if(!m.querySelector(".mb138-mh")){const t=m.querySelector(".ed132-mt");const its=[...m.querySelectorAll("[data-ed132bl]")];const g=document.createElement("div");g.className="mb138-g";its.forEach(b=>g.appendChild(b));
      const h=document.createElement("div");h.className="mb138-mh";h.innerHTML=`<p class="ed132-mt">${q?"Inserir · “"+esc(q)+"”":"Inserir"}</p><button type="button" class="mb138-mx" data-mb138mx aria-label="Fechar o menu">${ed132Svg('<path d="M6 6l12 12M18 6L6 18"/>')}</button>`;
      if(t)t.remove();m.prepend(h);m.appendChild(g);
      /* nomes curtos para a grade do celular */
      g.querySelectorAll("[data-ed132bl]").forEach(b=>{const c=MB138_CURTO[b.dataset.ed132bl];const sp=b.querySelector("span:last-child");if(c&&sp&&!sp.querySelector(".mb138-c"))sp.insertAdjacentHTML("beforeend",`<i class="mb138-c">${c}</i>`)})}
    MB138.mbloco=ed132Topo();mb138MenuLugar();mb138Revela()}}catch(e){}return r}}
{const _mf=ed132MenuFecha;ed132MenuFecha=function(manual){const barra=ED132.mbar,aberto=mb138MenuAberto();const r=_mf.apply(this,arguments);
  if(manual===true&&aberto&&barra){const b=ed132Topo();if(b&&/^\//.test(b.textContent||""))MB138.desc=b}MB138.mbloco=null;try{mb138Revela()}catch(e){}return r}}
function mb138MenuFechaMao(){if(mb138MenuAberto())ed132MenuFecha(true)}
/* trocou de linha: fecha */
function mb138MenuLinha(){if(!mb138MenuAberto())return;const b=ed132Topo();if(b&&MB138.mbloco&&b!==MB138.mbloco)mb138MenuFechaMao()}
/* tocar fora (inclusive no texto) fecha; o "+" abre e fecha */
document.addEventListener("pointerdown",e=>{if(!mb138MenuAberto())return;const t=e.target;if(!t||!t.closest)return;
  if(t.closest("#layer > .ed132 .ed132-menu")||t.closest('#layer > .ed132 [data-ed132cmd="mais"]'))return;mb138MenuFechaMao()},true);
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-mb138mx]");if(!b)return;e.stopPropagation();e.preventDefault();mb138MenuFechaMao()},true);
{const _c=ed132Cmd;ed132Cmd=function(k){if(k==="mais"&&mb138MenuAberto()){mb138MenuFechaMao();return}return _c.apply(this,arguments)}}
/* arrastar ou rolar o texto fecha */
["touchmove","wheel"].forEach(k=>document.addEventListener(k,e=>{if(mb138MenuAberto()&&e.target&&e.target.closest&&e.target.closest("#layer > .ed132 .ed132-sc"))mb138MenuFechaMao()},{passive:true,capture:true}));
document.addEventListener("scroll",e=>{if(mb138MenuAberto()&&e.target&&e.target.classList&&e.target.classList.contains("ed132-sc")&&Date.now()-MB138.prog>250)mb138MenuFechaMao()},true);
/* Esc fecha o menu (e não o editor) */
window.addEventListener("keydown",e=>{if(e.key==="Escape"&&mb138MenuAberto()){e.preventDefault();e.stopPropagation();mb138MenuFechaMao()}},true);
/* aberto pelo "+": digitar texto fecha (o "/" filtra; o "+" não). A linha cujo "/" foi apagado volta a poder abrir o menu */
window.addEventListener("input",e=>{if(!e.target||e.target.id!=="ed132-corpo")return;const d=MB138.desc;if(d&&(!d.isConnected||!/^\//.test(d.textContent||"")))MB138.desc=null;
  if(mb138MenuAberto()&&!ED132.mbar)mb138MenuFechaMao()},true);

/* ===== MB04: Enter e Backspace nos blocos ===== */
function mb138NoInicio(b){const s=getSelection();if(!s||!s.rangeCount||!s.isCollapsed||!b.contains(s.anchorNode))return false;try{const r=document.createRange();r.selectNodeContents(b);r.setEnd(s.anchorNode,s.anchorOffset);
  return !r.toString().replace(/​/g,"").length&&!r.cloneContents().querySelector("img,figure,hr")}catch(e){return false}}
function mb138NoFim(b){const s=getSelection();if(!s||!s.rangeCount||!s.isCollapsed||!b.contains(s.anchorNode))return false;try{const r=document.createRange();r.selectNodeContents(b);r.setStart(s.anchorNode,s.anchorOffset);
  return !r.toString().replace(/​/g,"").trim().length}catch(e){return false}}
function mb138Inicio(el){try{const r=document.createRange();const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const t=w.nextNode();if(t)r.setStart(t,0);else r.setStart(el,0);r.collapse(true);const s=getSelection();s.removeAllRanges();s.addRange(r);ED132.rg=r.cloneRange()}catch(e){}}
function mb138ViraP(el){const p=document.createElement("p");while(el.firstChild)p.appendChild(el.firstChild);if(!(p.textContent||"").length&&!p.querySelector("br"))p.innerHTML="<br>";el.replaceWith(p);return p}
/* item de lista vira parágrafo no lugar dele (a lista se divide em duas, se preciso) */
function mb138LiParaP(li){const l=li.parentNode,irm=[...l.children],i=irm.indexOf(li),depois=irm.slice(i+1);const p=document.createElement("p");
  [...li.childNodes].forEach(n=>{if(!(n.nodeType===1&&(n.tagName==="UL"||n.tagName==="OL")))p.appendChild(n)});if(!(p.textContent||"").length&&!p.querySelector("br"))p.innerHTML="<br>";
  li.remove();if(depois.length){const l2=document.createElement(l.tagName);depois.forEach(x=>l2.appendChild(x));l.after(l2)}
  if(i===0&&l.children.length===0){l.replaceWith(p)}else if(i===0){l.before(p)}else l.after(p);return p}
function mb138Faz(fn){cr137Marca();CR137.ocupado=true;let el=null;try{el=fn()}finally{CR137.ocupado=false}if(el)mb138Inicio(el);ed132Mudou();cr137Marca();try{cr137BarModo();ed132BarEstado()}catch(e){}mb138Revela();return true}
function mb138Bloco(tipo){const cp=mb138Cp(),s=getSelection();if(!cp||!s||!s.rangeCount||!s.isCollapsed||!cp.contains(s.anchorNode))return false;const b=ed132Topo();if(!b)return false;
  if(tipo==="apaga"){
    if((b.tagName==="H2"||b.tagName==="H3")&&mb138NoInicio(b))return mb138Faz(()=>mb138ViraP(b));
    if(b.tagName==="BLOCKQUOTE"){let n=s.anchorNode;while(n&&n.parentNode!==b)n=n.parentNode;if(n&&n===b.firstChild&&mb138NoInicio(n.nodeType===1?n:b))return mb138Faz(()=>{
      let p;if(n.nodeType===1&&n.tagName==="P"){p=n;b.before(p)}else{p=document.createElement("p");while(b.firstChild&&!(b.firstChild.nodeType===1&&ED132_BLOCOS.has(b.firstChild.tagName)))p.appendChild(b.firstChild);if(!p.firstChild)p.innerHTML="<br>";b.before(p)}
      if(!(b.textContent||"").trim()&&!b.querySelector("br"))b.remove();else if(!(b.textContent||"").trim())b.remove();return p})}
    if(b.tagName==="UL"||b.tagName==="OL"){let li=s.anchorNode;while(li&&!(li.nodeType===1&&li.tagName==="LI"))li=li.parentNode;if(li&&b.contains(li)&&mb138NoInicio(li))return mb138Faz(()=>mb138LiParaP(li))}
    return false}
  if(tipo==="enter"){
    if(b.tagName==="UL"||b.tagName==="OL"){let li=s.anchorNode;while(li&&!(li.nodeType===1&&li.tagName==="LI"))li=li.parentNode;if(li&&b.contains(li)&&!(li.textContent||"").replace(/​/g,"").trim()&&!li.querySelector("img"))return mb138Faz(()=>mb138LiParaP(li));return false}
    if((b.tagName==="H2"||b.tagName==="H3")&&(b.textContent||"").trim()&&mb138NoFim(b))return mb138Faz(()=>{const p=document.createElement("p");p.innerHTML="<br>";b.after(p);return p});
    return false}
  return false}
window.addEventListener("beforeinput",e=>{if(!e.target||e.target.id!=="ed132-corpo"||!ED132.E||MB138.comp||e.isComposing)return;
  const it=e.inputType;let feito=false;try{if(it==="deleteContentBackward")feito=mb138Bloco("apaga");else if(it==="insertParagraph")feito=mb138Bloco("enter")}catch(_){CR137.ocupado=false}
  if(feito){e.preventDefault();e.stopImmediatePropagation()}},true);
/* teclado de computador: o mesmo pelo keydown (vem antes do beforeinput e das regras do 132) */
window.addEventListener("keydown",e=>{if(!e.target||e.target.id!=="ed132-corpo"||!ED132.E||MB138.comp||e.isComposing||e.ctrlKey||e.metaKey||e.altKey||mb138MenuAberto())return;
  let feito=false;try{if(e.key==="Backspace")feito=mb138Bloco("apaga");else if(e.key==="Enter"&&!e.shiftKey)feito=mb138Bloco("enter")}catch(_){CR137.ocupado=false}
  if(feito){e.preventDefault();e.stopImmediatePropagation()}},true);

/* ===== MB05: acentos, ditado e autocorreção ===== */
window.addEventListener("compositionstart",e=>{if(e.target&&e.target.closest&&e.target.closest("#ed132-corpo"))MB138.comp=true},true);
window.addEventListener("compositionend",e=>{if(e.target&&e.target.closest&&e.target.closest("#ed132-corpo")){MB138.comp=false;setTimeout(()=>{try{if(!MB138.comp){qx135Norm();cr137Depois();mb138Revela()}}catch(_){}},0)}},true);
{const _md=cr137Md;cr137Md=function(e){if(MB138.comp||e&&e.isComposing)return false;return _md.apply(this,arguments)}}
{const _n=qx135Norm;qx135Norm=function(){if(MB138.comp)return;return _n.apply(this,arguments)}}
{const _d=qx135DivP;qx135DivP=function(){if(MB138.comp)return;return _d.apply(this,arguments)}}

/* ===== MB06: toques que não fecham o teclado ===== */
["pointerdown","mousedown"].forEach(k=>document.addEventListener(k,e=>{const t=e.target;if(t&&t.closest&&t.closest("#layer > .ed132 .ed132-bar,#layer > .ed132 .ed132-menu,#layer > .ed132 .cr137-pl")&&!t.closest("input,textarea"))e.preventDefault()},true));
/* se mesmo assim o foco sair do texto por um botão da barra, volta para onde estava */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest||!t.closest("#layer > .ed132 .ed132-bar button"))return;const cp=mb138Cp();if(!cp||document.activeElement===cp)return;
  const k=(t.closest("[data-ed132cmd]")||{}).dataset;if(k&&/^(?:foto|graf|a)$/.test(k.ed132cmd||""))return;setTimeout(()=>{if(document.activeElement===document.body&&mb138Cp()&&!$("#layer2")?.innerHTML)try{mb138Cp().focus({preventScroll:true});if(ED132.rg){const s=getSelection();s.removeAllRanges();s.addRange(ED132.rg)}}catch(_){}},0)},true);

/* novo desenho do editor (abrir, Prévia ↔ Escrever, recuperar): dimensiona de novo */
{const _d=ed132Desenha;ed132Desenha=function(){const r=_d.apply(this,arguments);try{mb138Trava();mb138Vv()}catch(e){}return r}}
if(window.visualViewport)addEventListener("orientationchange",()=>setTimeout(()=>{MB138.hmax=0;mb138Vv()},300));
