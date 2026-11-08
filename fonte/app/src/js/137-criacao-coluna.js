/* ---------- 137: criação de coluna revista (escrever no celular como no Substack/Medium/Notion) ----------
   Por cima do editor do 132 (mesmos campos, ids e dados: rascunhos, versões, agendar, séries, pública, importar e exportar
   continuam iguais). O que muda:
   CR01 Atalhos de markdown ao digitar: "## " título, "### " subtítulo, "> " citação, "- " ou "* " lista, "1. " lista
        numerada, "---" separador, **negrito**, *itálico* e _itálico_. Desfazer logo depois volta ao texto digitado.
   CR02 Desfazer e refazer próprios (botões ↶ ↷ na barra, Ctrl/Cmd+Z, Ctrl+Shift+Z, Ctrl+Y): o desfazer do navegador
        se perdia com as correções do 135 e com foto, gráfico e separador (apagava linhas inteiras ou deixava "*").
   CR03 Barra acima do teclado contextual: "+" fixo à esquerda, desfazer/refazer fixos à direita e, no meio, só o que
        serve agora: texto selecionado = negrito, itálico, link, título, subtítulo, citação; linha vazia = foto, gráfico,
        título, citação, listas, separador; no meio do texto = formatação, listas e mover. Some no título e na linha fina.
        Antes a barra tinha 13 botões e escondia foto e gráfico fora da tela (542 px numa tela de 360/390).
   CR04 Botão "+" na linha vazia (como no Medium/Notion), que abre os blocos.
   CR05 Mover bloco: subir/descer o parágrafo, título, citação, lista, foto ou gráfico (barra e folha da foto/gráfico).
   CR06 Tela limpa: a faixa "Editar | Ver como leitor | Importar | contagem" ocupava 2 linhas (80 px) e virou uma linha
        ("Escrever | Prévia", importar só ícone, contagem curta); some com o teclado aberto (modo foco). A capa vira um
        botão discreto acima do título (e aparece também em "Antes de publicar"). A dica que ficava escondida atrás da
        barra em 360 px foi para o texto de exemplo da página vazia.
   CR07 Teclado do celular: o editor acompanha a área visível (visualViewport); o cabeçalho não sai da tela no iPhone e
        a linha em que se escreve rola para ficar acima da barra.
   CR08 "Antes de publicar" na ordem do Substack: prévia do cartão, capa, quem pode ler e quando primeiro; chamada,
        série, hashtags e assuntos depois, em "Detalhes opcionais".
   CR09 Depois de publicar ou salvar: aviso com "Ver" que abre a coluna. Na coluna aberta, a autora tem "Editar".
   CR10 Editar coluna publicada: as mudanças ficam guardadas no aparelho enquanto edita (o app fechado no meio não
        perde nada; ao reabrir, "Recuperar"), e o cabeçalho diz "Alterações não salvas".
   CR11 Minhas colunas: rascunho sem título mostra o começo do texto; colunas publicadas com "Editar"; atalho "Minhas
        colunas" no "O que você quer publicar?". Título com contador quando passa de 70 dos 90 caracteres.
   Nomes globais com o prefixo cr137 / CR137. */

var CR137={E:null,pi:[],i:-1,t:0,mt:0,ocupado:false,bt:0,et:0};
const CR137_IC={undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>',dn:'<path d="M12 5v14M6 13l6 6 6-6"/>',olho:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  lapis:'<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'};
const cr137Coarse=()=>{try{return matchMedia("(pointer:coarse)").matches}catch(e){return false}};
const cr137Cp=()=>document.getElementById("ed132-corpo");

/* ===== CR02: desfazer e refazer (pilha própria) ===== */
/* posição do cursor: [bloco do texto, caracteres dentro dele] (não depende de onde um bloco termina e o outro começa) */
function cr137CaretPos(cp){const s=getSelection();if(!s||!s.rangeCount||!cp.contains(s.anchorNode))return null;let n=s.anchorNode;while(n&&n.parentNode!==cp)n=n.parentNode;if(!n)return null;
  const i=[...cp.childNodes].indexOf(n);try{const r=document.createRange();r.selectNodeContents(n);r.setEnd(s.anchorNode,s.anchorOffset);return {i,o:r.toString().length}}catch(e){return {i,o:0}}}
function cr137CaretPoe(cp,pos){if(!pos)return;const n=cp.childNodes[Math.min(pos.i,cp.childNodes.length-1)];if(!n)return;const sel=getSelection();
  const poe=(no,of)=>{try{const r=document.createRange();r.setStart(no,of);r.collapse(true);sel.removeAllRanges();sel.addRange(r);ED132.rg=r.cloneRange()}catch(e){}};
  if(n.nodeType===3){poe(n,Math.min(pos.o,n.nodeValue.length));return}if(n.tagName==="FIGURE"||n.tagName==="HR"){const p=n.nextElementSibling||n.previousElementSibling;if(p)ed132CaretFim(p);return}
  const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let t,k=pos.o,ult=null;while((t=w.nextNode())){ult=t;if(k<=t.nodeValue.length){poe(t,k);return}k-=t.nodeValue.length}
  if(ult)poe(ult,ult.nodeValue.length);else{const alvo=n.querySelector("li")||n;poe(alvo,0)}}
function cr137Zera(){const cp=cr137Cp();CR137.E=ED132.E;CR137.pi=cp?[{h:cp.innerHTML,c:null}]:[];CR137.i=CR137.pi.length-1;clearTimeout(CR137.t);cr137UndoBt()}
function cr137Marca(){const cp=cr137Cp();if(!cp||!ED132.E)return;clearTimeout(CR137.t);if(CR137.E!==ED132.E){cr137Zera();return}
  const h=cp.innerHTML,top=CR137.pi[CR137.i];if(top&&top.h===h){top.c=cr137CaretPos(cp);return}
  CR137.pi=CR137.pi.slice(0,CR137.i+1);CR137.pi.push({h,c:cr137CaretPos(cp)});if(CR137.pi.length>120)CR137.pi.shift();CR137.i=CR137.pi.length-1;CR137.mt=Date.now();cr137UndoBt()}
function cr137Depois(){clearTimeout(CR137.t);if(Date.now()-CR137.mt>2500&&CR137.pi.length){cr137Marca();return}CR137.t=setTimeout(cr137Marca,450)}
function cr137Vai(d){const cp=cr137Cp();if(!cp||!ED132.E)return;if(CR137.E!==ED132.E)cr137Zera();if(cp.innerHTML!==(CR137.pi[CR137.i]||{}).h)cr137Marca();
  const j=CR137.i+d;if(j<0||j>=CR137.pi.length){toast(d<0?"Nada para desfazer.":"Nada para refazer.");return}CR137.i=j;const o=CR137.pi[j];
  CR137.ocupado=true;try{try{cp.focus({preventScroll:true})}catch(e){}cp.innerHTML=o.h;ed132EdFotos();cr137CaretPoe(cp,o.c);ed132MenuFecha();ed132Mudou()}finally{CR137.ocupado=false}
  cr137UndoBt();cr137BarModo();cr137Caret()}
function cr137UndoBt(){const b=document.querySelector("#layer > .ed132 .ed132-bar");if(!b)return;const u=b.querySelector('[data-ed132cmd="undo"]'),r=b.querySelector('[data-ed132cmd="redo"]');
  if(u)u.setAttribute("aria-disabled",CR137.i>0?"false":"true");if(r)r.setAttribute("aria-disabled",CR137.i<CR137.pi.length-1?"false":"true")}

/* ===== CR05: mover bloco ===== */
function cr137Move(d,el){const cp=cr137Cp();if(!cp)return;const b=el||ed132Topo();if(!b||b.parentNode!==cp){toast("Toque no bloco que quer mover.");return}
  const o=d<0?b.previousElementSibling:b.nextElementSibling;if(!o){toast(d<0?"Este bloco já é o primeiro.":"Este bloco já é o último.");return}
  cr137Marca();let dentro=null;const s=getSelection();if(!el&&s&&s.rangeCount&&b.contains(s.anchorNode))try{const r=document.createRange();r.selectNodeContents(b);r.setEnd(s.anchorNode,s.anchorOffset);dentro=r.toString().length}catch(e){}
  if(d<0)o.before(b);else o.after(b);
  if(dentro!==null)cr137CaretPoe(cp,{i:[...cp.childNodes].indexOf(b),o:dentro});
  ed132Mudou();cr137Marca();try{b.scrollIntoView({block:"nearest"})}catch(e){}cr137BarModo()}
/* foto e gráfico: "Subir" e "Descer" na folha que abre ao tocar */
{const _fe=ed132FigEdita;ed132FigEdita=function(fig){const r=_fe.apply(this,arguments);try{const sh=document.querySelector("#layer2 .sheet");const f=ED132.fig;
  if(sh&&f&&f.isConnected&&!sh.querySelector("[data-cr137fmv]")){const alvo=sh.querySelector(".ed132-lab")||sh.querySelector(".hint");const h=`<div class="cr137-fmv"><button type="button" class="chip" data-cr137fmv="-1"${f.previousElementSibling?"":" disabled"}>${ed132Svg(CR137_IC.up)}Subir</button><button type="button" class="chip" data-cr137fmv="1"${f.nextElementSibling?"":" disabled"}>${ed132Svg(CR137_IC.dn)}Descer</button></div>`;
    if(alvo)alvo.insertAdjacentHTML("beforebegin",h)}}catch(e){}return r}}
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-cr137fmv]");if(!b)return;e.stopPropagation();e.preventDefault();const f=ED132.fig,d=+b.dataset.cr137fmv;closeLayer();if(f&&f.isConnected)cr137Move(d,f)},true);

/* ===== CR03: barra contextual ===== */
/* modos: t = no meio do texto, s = texto selecionado, v = linha vazia */
const CR137_MODOS={b:"t s",i:"t s",a:"t s",h2:"t s v",h3:"t s v",q:"t s v",ul:"t v",ol:"t v",hr:"v",foto:"v",graf:"v",mvup:"t v",mvdn:"t v"};
{const _bh=ed132BarHTML;ed132BarHTML=function(){const tp=document.createElement("template");tp.innerHTML=_bh.apply(this,arguments);
  const bt=(k,ic,lb)=>`<button type="button" data-ed132cmd="${k}" aria-label="${lb}" title="${lb}">${ed132Svg(ic)}</button>`;
  const mais=tp.content.querySelector('[data-ed132cmd="mais"]');const meio=[...tp.content.querySelectorAll("[data-ed132cmd]")].filter(b=>b!==mais);
  const ordem=["b","i","a","foto","graf","h2","h3","q","ul","ol","hr"];meio.sort((a,b)=>ordem.indexOf(a.dataset.ed132cmd)-ordem.indexOf(b.dataset.ed132cmd));
  meio.forEach(b=>b.setAttribute("data-cr137m",CR137_MODOS[b.dataset.ed132cmd]||"t s v"));
  const d=document.createElement("div");meio.forEach(b=>d.appendChild(b));
  return `${mais?mais.outerHTML.replace("<button",'<button class="cr137-bmais"'):""}<div class="cr137-bm">${d.innerHTML}${bt("mvup",CR137_IC.up,"Subir o bloco").replace("<button",'<button data-cr137m="t v"')}${bt("mvdn",CR137_IC.dn,"Descer o bloco").replace("<button",'<button data-cr137m="t v"')}</div>`
    +`<span class="cr137-bd">${bt("undo",CR137_IC.undo,"Desfazer (Ctrl+Z)")}${bt("redo",CR137_IC.redo,"Refazer (Ctrl+Shift+Z)")}</span>`}}
function cr137BarModo(){const el=document.querySelector("#layer > .ed132"),bar=el&&el.querySelector(".ed132-bar"),cp=cr137Cp();if(!bar||!cp)return;
  const a=document.activeElement,fora=!!(a&&(a.id==="ed132-tit"||a.id==="ed132-lin"));el.classList.toggle("cr137-sembar",fora);
  const s=getSelection();let m="t";const dentro=s&&s.rangeCount&&cp.contains(s.anchorNode);
  if(dentro&&!s.isCollapsed)m="s";else{const b=dentro?ed132Topo():null;if(b&&b.tagName==="P"&&!(b.textContent||"").trim()&&!b.querySelector("img"))m="v";else if(!dentro&&ed132Vazio(cp.innerHTML))m="v"}
  if(bar.dataset.cr137!==m){bar.dataset.cr137=m;const bm=bar.querySelector(".cr137-bm");if(bm)bm.scrollLeft=0}
  cr137Mais(dentro&&m==="v"&&a===cp&&!cp.classList.contains("ed132-vz")?ed132Topo():null)}
/* CR04: "+" na linha vazia */
function cr137Mais(b){const ins=document.querySelector("#layer > .ed132 .ed132-sc .ed132-in");if(!ins)return;let p=ins.querySelector(".cr137-pl");
  if(!b||ED132.E&&ED132.E.ver){if(p)p.hidden=true;return}
  if(!p){ins.insertAdjacentHTML("beforeend",`<button type="button" class="cr137-pl" data-ed132cmd="mais" aria-label="Inserir foto, gráfico, citação, lista…" hidden>${ed132Svg(ED132_IC.mais)}</button>`);p=ins.querySelector(".cr137-pl")}
  const ri=ins.getBoundingClientRect(),rb=b.getBoundingClientRect();p.style.top=Math.round(rb.top-ri.top+rb.height/2-17)+"px";p.hidden=false}
{const _be=ed132BarEstado;ed132BarEstado=function(){const r=_be.apply(this,arguments);try{cr137BarModo()}catch(e){}return r}}
document.addEventListener("focusin",e=>{if(e.target&&e.target.closest&&e.target.closest("#layer > .ed132"))setTimeout(()=>{try{cr137BarModo()}catch(_){}},0)});
document.addEventListener("focusout",e=>{if(e.target&&e.target.id==="ed132-corpo")setTimeout(()=>{try{cr137BarModo()}catch(_){}},0)});

/* comandos novos: desfazer, refazer, mover; e marca o desfazer antes e depois de cada comando */
{const _c=ed132Cmd;ed132Cmd=function(k){if(k==="undo"||k==="redo"){cr137Vai(k==="undo"?-1:1);return}if(k==="mvup"||k==="mvdn"){cr137Move(k==="mvup"?-1:1);return}
  const est=k==="mais"||k==="foto"||k==="graf"||k==="a";if(!est&&!CR137.ocupado)cr137Marca();const r=_c.apply(this,arguments);if(!est){cr137Marca();cr137Caret()}return r}}
{const _pb=ed132PoeBloco;ed132PoeBloco=function(){if(!CR137.ocupado)cr137Marca();const r=_pb.apply(this,arguments);cr137Marca();cr137Caret();return r}}

/* ===== CR01: atalhos de markdown ===== */
const CR137_MD=[[/^###[\s ]$/,"h3"],[/^##?[\s ]$/,"h2"],[/^>[\s ]$/,"q"],[/^[-*•][\s ]$/,"ul"],[/^1[.)][\s ]$/,"ol"]];
function cr137Md(e){const cp=cr137Cp();if(!cp||CR137.ocupado)return false;const it=String(e.inputType||"");if(it&&!/^insert(?:Text|CompositionText|ReplacementText)?$/.test(it))return false;
  const s=getSelection();if(!s||!s.rangeCount||!s.isCollapsed||!cp.contains(s.anchorNode))return false;const b=ed132Topo();if(!b||b.tagName==="FIGURE"||b.tagName==="HR")return false;
  let antes;try{const r=document.createRange();r.selectNodeContents(b);r.setEnd(s.anchorNode,s.anchorOffset);antes=r.toString()}catch(_){return false}
  /* blocos: o prefixo no começo da linha (só em parágrafo) */
  if(b.tagName==="P"&&antes.length<=4){const m=CR137_MD.find(([re])=>re.test(antes));if(m){CR137.ocupado=true;try{cr137Marca();const r=document.createRange();r.selectNodeContents(b);r.setEnd(s.anchorNode,s.anchorOffset);r.deleteContents();
      if(!(b.textContent||"").length&&!b.querySelector("br"))b.innerHTML="<br>";const r2=document.createRange();r2.setStart(b,0);r2.collapse(true);s.removeAllRanges();s.addRange(r2);ED132.rg=r2.cloneRange();
      ed132MenuFecha();ed132Cmd(m[1])}finally{CR137.ocupado=false}return true}}
  /* separador: a linha inteira é --- (o iPhone troca -- por —) */
  if(b.tagName==="P"&&/^(?:---|—-|–-|\*\*\*|___)$/.test(antes)&&(b.textContent||"")===antes){CR137.ocupado=true;try{cr137Marca();b.innerHTML="<br>";ed132CaretFim(b);ed132PoeBloco(document.createElement("hr"))}finally{CR137.ocupado=false}return true}
  /* negrito e itálico no texto que acabou de ser digitado */
  const n=s.anchorNode;if(n.nodeType!==3)return false;const tx=n.nodeValue.slice(0,s.anchorOffset);
  let m=/\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/.exec(tx),cmd="bold";
  if(!m){m=/(?:^|[^*\w])\*([^*\s](?:[^*]*[^*\s])?)\*$/.exec(tx)||/(?:^|[^_\w])_([^_\s](?:[^_]*[^_\s])?)_$/.exec(tx);cmd="italic";if(m)m={index:m.index+(m[0].length-m[1].length-2),0:m[0].slice(m[0].length-m[1].length-2),1:m[1]}}
  if(!m)return false;
  CR137.ocupado=true;try{cr137Marca();const ini=m.index,r=document.createRange();r.setStart(n,ini);r.setEnd(n,s.anchorOffset);s.removeAllRanges();s.addRange(r);
    document.execCommand("insertText",false,m[1]);const s2=getSelection(),fim=s2.anchorNode,fo=s2.anchorOffset;
    const r3=document.createRange();r3.setStart(fim,fo-m[1].length);r3.setEnd(fim,fo);s2.removeAllRanges();s2.addRange(r3);document.execCommand(cmd);
    const s3=getSelection();s3.collapseToEnd();try{if(document.queryCommandState(cmd))document.execCommand(cmd)}catch(_){}ED132.rg=s3.rangeCount?s3.getRangeAt(0).cloneRange():null;
    ed132Mudou();cr137Marca()}finally{CR137.ocupado=false}return true}
window.addEventListener("input",e=>{const t=e.target;if(!t||t.id!=="ed132-corpo"||!ED132.E)return;if(CR137.ocupado)return;
  if(CR137.E!==ED132.E)cr137Zera();let feito=false;try{feito=cr137Md(e)}catch(_){CR137.ocupado=false}if(!feito)cr137Depois();cr137Caret()},true);
window.addEventListener("keydown",e=>{const t=e.target;if(!t||t.id!=="ed132-corpo"||!ED132.E)return;
  if((e.ctrlKey||e.metaKey)&&!e.altKey){const k=e.key.toLowerCase();if(k==="z"||k==="y"){e.preventDefault();e.stopPropagation();cr137Vai(k==="y"||e.shiftKey?1:-1);return}}
  if(e.key==="Enter")cr137Marca()},true);
window.addEventListener("beforeinput",e=>{if(!e.target||e.target.id!=="ed132-corpo")return;if(e.inputType==="historyUndo"||e.inputType==="historyRedo"){e.preventDefault();cr137Vai(e.inputType==="historyUndo"?-1:1)}},true);
window.addEventListener("paste",e=>{if(e.target&&e.target.closest&&e.target.closest("#ed132-corpo"))cr137Marca()},true);
document.addEventListener("paste",e=>{if(e.target&&e.target.closest&&e.target.closest("#ed132-corpo"))setTimeout(()=>{cr137Marca();cr137Caret()},0)});

/* ===== CR07: teclado do celular ===== */
function cr137Vv(){const el=document.querySelector("#layer > .ed132");if(!el)return;const v=window.visualViewport;if(!v)return;
  const h=Math.round(v.height),top=Math.round(v.offsetTop);el.style.setProperty("--cr137-vh",h+"px");el.style.setProperty("--cr137-vt",top+"px");el.style.setProperty("--ed132-kb","0px");
  el.classList.toggle("cr137-kb",innerHeight-h>120&&cr137Coarse())}
ed132Kb=function(){cr137Vv()};
if(window.visualViewport){visualViewport.addEventListener("resize",()=>{cr137Vv();setTimeout(cr137Caret,60)});visualViewport.addEventListener("scroll",cr137Vv)}
/* a linha do cursor fica visível, acima da barra */
function cr137Caret(){const el=document.querySelector("#layer > .ed132"),cp=cr137Cp();if(!el||!cp||ED132.E&&ED132.E.ver)return;const sc=el.querySelector(".ed132-sc"),bar=el.querySelector(".ed132-bar"),s=getSelection();
  if(!sc||!s||!s.rangeCount||!cp.contains(s.anchorNode))return;let r;try{const rg=s.getRangeAt(0).cloneRange();rg.collapse(false);r=rg.getClientRects()[0];if(!r||!r.height){const b=ed132Topo();r=b&&b.getBoundingClientRect()}}catch(_){return}if(!r)return;
  const sr=sc.getBoundingClientRect(),lim=Math.min(sr.bottom,bar&&!bar.hidden&&bar.offsetHeight?bar.getBoundingClientRect().top:sr.bottom)-14;
  if(r.bottom>lim)sc.scrollTop+=r.bottom-lim+24;else if(r.top<sr.top+8)sc.scrollTop-=sr.top+8-r.top+24}
document.addEventListener("selectionchange",()=>{clearTimeout(CR137.bt);CR137.bt=setTimeout(()=>{try{if(cr137Cp())cr137BarModo()}catch(e){}},30)});

/* ===== CR06: tela limpa (uma linha de modo; contagem curta; capa discreta) ===== */
{const _d=ed132Desenha;ed132Desenha=function(){const novo=CR137.E!==ED132.E;const r=_d.apply(this,arguments);try{cr137Arruma();if(novo)cr137Zera();else cr137Marca();cr137Vv();cr137BarModo();cr137Tit()}catch(e){}return r}}
function cr137Arruma(){const el=document.querySelector("#layer > .ed132");if(!el)return;
  el.querySelectorAll("[data-ed132modo]").forEach(b=>{b.textContent=b.dataset.ed132modo==="ver"?"Prévia":"Escrever"});
  const imp=el.querySelector(".ed132-m [data-ex133imp]");if(imp){imp.setAttribute("aria-label","Importar texto (.docx, .md, .html ou colado)");imp.title="Importar texto"}
  const m=el.querySelector(".ed132-m");if(m&&!m.querySelector(".cr137-ct"))m.insertAdjacentHTML("beforeend",`<span class="cr137-ct" aria-hidden="true"></span>`);cr137CtCopia();
  const cp=cr137Cp();if(cp)cp.setAttribute("data-ph","Comece a escrever. Toque em + para foto, gráfico, citação ou lista, ou use ## título, > citação, - lista.");
  const t=el.querySelector("#ed132-tit");if(t&&!el.querySelector(".cr137-tl"))t.insertAdjacentHTML("afterend",`<small class="cr137-tl" aria-live="polite" hidden></small>`)}
function cr137CtCopia(){const el=document.querySelector("#layer > .ed132");if(!el)return;const c=el.querySelector("[data-ed132cont]"),k=el.querySelector(".cr137-ct");if(!c||!k)return;
  const n=+c.dataset.n||0,lim=/passou do limite/.test(c.textContent),seis=/até 6\.000/.test(c.textContent);
  k.textContent=`${cs123Num(n)} ${n===1?"palavra":"palavras"} · ${Math.max(1,Math.round(n/200))} min${lim?" · passou do limite":seis?" · até 6.000 caracteres":""}`;k.classList.toggle("cr137-lim",lim)}
{const _ct=ed132Conta;ed132Conta=function(){const r=_ct.apply(this,arguments);clearTimeout(CR137.ct);CR137.ct=setTimeout(cr137CtCopia,260);return r}}
/* título: contador perto do limite de 90 */
function cr137Tit(){const t=document.getElementById("ed132-tit"),l=document.querySelector("#layer > .ed132 .cr137-tl");if(!t||!l)return;const n=t.value.length;l.hidden=n<70;l.textContent=`${n}/90`;l.classList.toggle("cr137-lim",n>=90)}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="ed132-tit")cr137Tit()});

/* ===== CR08: "Antes de publicar" na ordem do Substack, com a capa ===== */
{const _pn=ed132Painel;ed132Painel=function(){const r=_pn.apply(this,arguments);try{cr137Painel()}catch(e){}return r}}
function cr137Painel(){const pp=document.querySelector("#layer > .ed132 .ed132-pp"),ins=pp&&pp.querySelector(".ed132-pps .ed132-in"),E=ED132.E;if(!ins||!E)return;
  const sec=q=>{const x=ins.querySelector(q);return x&&x.closest(".ed132-ps")};
  const prev=sec(".ed132-pvf"),pub=sec("[data-ed132pubv]"),qd=sec(".ed132-qv"),ch=sec("#ed132-cham"),se=sec("#ed132-ser"),tg=sec("#ed132-tags"),as=sec(".ed132-ptl");
  let cp=ins.querySelector(".cr137-pc");if(!cp){ins.insertAdjacentHTML("afterbegin",`<section class="ed132-ps cr137-pc"><h3>Capa <small>opcional</small></h3><div class="cr137-pci"></div></section>`);cp=ins.querySelector(".cr137-pc")}
  cp.querySelector(".cr137-pci").innerHTML=ed132CapaHTML();
  let ph=ins.querySelector(".cr137-ph");if(!ph){ins.insertAdjacentHTML("beforeend",`<p class="cr137-ph">Detalhes opcionais</p>`);ph=ins.querySelector(".cr137-ph")}
  [prev,cp,pub,qd,ph,ch,se,tg,as].filter(Boolean).forEach(s=>ins.appendChild(s));if(prev){const h=prev.querySelector("h3");if(h)h.textContent="Como vai aparecer no Feed"}
  ph.hidden=![ch,se,tg,as].some(Boolean)}
{const _cd=ed132CapaDesenha;ed132CapaDesenha=function(){const r=_cd.apply(this,arguments);try{const c=document.querySelector("#layer > .ed132 .ed132-pp .cr137-pci");if(c){c.innerHTML=ed132CapaHTML();ed132PainelCard()}}catch(e){}return r}}
/* a capa no painel: "Tirar" também atualiza a prévia do cartão */
window.addEventListener("click",e=>{if(e.target&&e.target.closest&&e.target.closest("#layer > .ed132 .ed132-pp [data-ed132capax]"))setTimeout(()=>{try{ed132CapaDesenha()}catch(_){}},0)},true);

/* ===== CR09: depois de publicar, "Ver"; na coluna aberta, "Editar" ===== */
{const _p=ed132Publica;ed132Publica=async function(){const E=ED132.E,modo=E&&E.modo,id0=E&&E.pubId,antes=new Set((PUB.itens||[]).map(x=>x.id));const r=await _p.apply(this,arguments);
  try{if(E&&ED132.E!==E){let id=null;if(modo==="editar")id=id0&&pubDe(id0)?id0:null;else{const x=(PUB.itens||[]).find(x=>x&&x.autor===S.uid&&!antes.has(x.id)&&cs123Col(x));id=x?x.id:null}
    if(id){cr137BackTira(id0);const tx=(document.querySelector(".toast span")||{}).textContent||(modo==="editar"?"Coluna atualizada":"Coluna publicada");toast(tx,"Ver",()=>cs123Abrir(id))}else if(modo==="editar"&&id0)cr137BackTira(id0)}}catch(e){}return r}}
{const _l=cs123LerHTML;cs123LerHTML=function(x,c,o){const h=_l.apply(this,arguments);try{if(!(o&&o.prev)&&x&&S.uid&&x.autor===S.uid&&c&&h.indexOf("data-cr137ed")<0)
  return h.replace(/(<button type="button" class="icbtn" data-usend=)/,`<button type="button" class="icbtn cr137-eb" data-cr137ed="${esc(x.id)}" aria-label="Editar a coluna" title="Editar">${ed132Svg(CR137_IC.lapis)}</button>$1`)}catch(e){}return h}}
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;
  if(b=t.closest("[data-cr137ed]")){e.stopPropagation();e.preventDefault();const id=b.dataset.cr137ed;if($("#layer2")?.innerHTML)closeLayer();ed132Edita(id);return}
  if(b=t.closest("[data-cr137ver]")){e.stopPropagation();e.preventDefault();cs123Abrir(b.dataset.cr137ver);return}
  if(t.closest("[data-cr137hub]")){e.stopPropagation();e.preventDefault();if(typeof ED!=="undefined"&&ED){ED=null;closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}ed132Hub();return}
  if(t.closest("[data-cr137rec]")){e.stopPropagation();e.preventDefault();cr137Recupera();return}},true);

/* ===== CR10: edição de coluna publicada guardada no aparelho até salvar ===== */
const cr137BK=()=>"prumo-cr137-ed:"+(S.uid||"");
function cr137BackLe(){try{const o=JSON.parse(localStorage.getItem(cr137BK())||"{}");return o&&typeof o==="object"&&!Array.isArray(o)?o:{}}catch(e){return {}}}
function cr137BackGrava(o){try{const l=Object.entries(o).sort((a,b)=>(b[1].at||0)-(a[1].at||0)).slice(0,5);localStorage.setItem(cr137BK(),JSON.stringify(Object.fromEntries(l)))}catch(e){}}
function cr137BackTira(id){if(!id)return;const o=cr137BackLe();if(o[id]){delete o[id];cr137BackGrava(o)}}
function cr137BackPoe(){const E=ED132.E;if(!E||E.modo!=="editar"||!E.pubId||E.env)return;let suj=false;try{suj=ed132Sujo(E)}catch(e){}const o=cr137BackLe();
  if(!suj){if(o[E.pubId]){delete o[E.pubId];cr137BackGrava(o)}}else{try{ed132LePainel()}catch(e){}o[E.pubId]={at:Date.now(),tit:E.tit,linha:E.linha,cham:E.cham,html:E.html,tags:E.tags,serie:E.serie,n:E.n,pautas:E.pautas};cr137BackGrava(o)}
  E.cr137suj=suj;ed132St()}
{const _st=ed132StTx;ed132StTx=function(){const E=ED132.E;if(E&&E.modo==="editar"&&!E.ag&&E.cr137suj)return "Publicada · alterações não salvas";return _st.apply(this,arguments)}}
document.addEventListener("input",e=>{if(!ED132.E||ED132.E.modo!=="editar"||!e.target.closest||!e.target.closest("#layer > .ed132"))return;clearTimeout(CR137.et);CR137.et=setTimeout(cr137BackPoe,900)});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&ED132.E&&ED132.E.modo==="editar")try{cr137BackPoe()}catch(e){}});
addEventListener("pagehide",()=>{if(ED132.E&&ED132.E.modo==="editar")try{cr137BackPoe()}catch(e){}});
{const _ed=ed132Edita;ed132Edita=function(id){const r=_ed.apply(this,arguments);try{const E=ED132.E,k=cr137BackLe()[id],x=ed132Pub(id);
  if(E&&E.modo==="editar"&&E.pubId===id&&k&&(+k.at||0)>Math.max(+(x&&x.editado)||0,+(x&&x.at)||0)&&(k.html!==E.html||k.tit!==E.tit||k.linha!==E.linha)){CR137.rec={id,k};
    setTimeout(()=>{if(ED132.E===E)toast("Você tinha alterações não salvas nesta coluna.","Recuperar",cr137Recupera)},250)}}catch(e){}return r}}
function cr137Recupera(){const E=ED132.E,R=CR137.rec;if(!E||!R||E.pubId!==R.id)return;const k=R.k;CR137.rec=null;
  Object.assign(E,{tit:cs123S(k.tit,90),linha:cs123S(k.linha,160),cham:cs123S(k.cham,240),html:ed132Limpa(k.html,{dono:S.uid}),tags:cs123S(k.tags,120),serie:cs123S(k.serie,60),n:Math.max(0,Math.floor(+k.n)||0),pautas:Array.isArray(k.pautas)?k.pautas.slice(0,3):E.pautas});
  E.ver=false;ed132Desenha();ed132EdFotos();cr137BackPoe();toast("Alterações recuperadas. Toque em Salvar para publicar.")}
/* descartar as alterações apaga a cópia */
["pointerdown","mousedown"].forEach(k=>window.addEventListener(k,e=>{const t=e.target;if(t&&t.closest&&t.closest("[data-ed132desc]")){const E=ED132.E;if(E&&E.pubId)CR137.desc=E.pubId}},true));
window.addEventListener("click",e=>{const t=e.target;if(t&&t.closest&&t.closest("[data-ed132desc]")){const id=(ED132.E&&ED132.E.pubId)||CR137.desc;if(id)cr137BackTira(id);CR137.desc=null}},true);
{const _cl=closeLayer;closeLayer=function(){const E=ED132.E;const r=_cl.apply(this,arguments);try{if(E&&E.modo==="editar"&&E.descartar==="sim"&&ED132.E!==E)cr137BackTira(E.pubId)}catch(e){}return r}}

/* ===== CR11: Minhas colunas ===== */
{const _hh=ed132HubHTML;ed132HubHTML=function(){let h=_hh.apply(this,arguments);try{const tp=document.createElement("template");tp.innerHTML=h;const rs=ed132RascLe();
  tp.content.querySelectorAll("button.ed132-hi[data-ed132rabre]").forEach(b=>{const d=rs.find(r=>r.rid===b.dataset.ed132rabre);if(!d)return;const pl=ed132Plano(ed132Limpa(d.html||"")).replace(/^(?:## |> )/gm,"").replace(/\s+/g," ").trim();
    if(pl){const s=document.createElement("span");s.className="cr137-tr";s.textContent=pl.length>110?pl.slice(0,108).replace(/\s+\S*$/,"")+"…":pl;b.querySelector("small")?.before(s)}});
  const minhas=(PUB.itens||[]).filter(x=>x&&x.autor===S.uid&&!ed132Agendada(x)&&cs123Col(x)).sort((a,b)=>(+b.at||0)-(+a.at||0));
  tp.content.querySelectorAll(".lt134-hub li").forEach(li=>{const b=li.querySelector("[data-lt134num]");const hb=li.querySelector(".ed132-hb");if(b&&hb&&!hb.querySelector("[data-cr137ed]"))hb.insertAdjacentHTML("afterbegin",`<button type="button" class="btn ghost" data-cr137ed="${esc(b.dataset.lt134num)}">Editar</button>`)});
  if(minhas.length&&!tp.content.querySelector(".lt134-hub")){const ins=tp.content.querySelector(".ed132-in");if(ins){const pos=tp.content.querySelector(".pb136-hub");
    const html=`<h3 class="ed132-hh">Publicadas <small>${minhas.length} ${minhas.length===1?"coluna":"colunas"}</small></h3><ul class="ed132-hl cr137-pubs">${minhas.slice(0,10).map(x=>{const c=cs123Col(x);return `<li><button type="button" class="ed132-hi" data-cr137ver="${esc(x.id)}"><b>${esc(c.tit)}</b><small>${esc(quando(+x.at||Date.now()))}${c.serie?" · "+esc(c.serie):""}</small></button><span class="ed132-hb"><button type="button" class="btn ghost" data-cr137ver="${esc(x.id)}">Abrir</button><button type="button" class="btn ghost" data-cr137ed="${esc(x.id)}">Editar</button></span></li>`}).join("")}</ul>`;
    if(pos)pos.insertAdjacentHTML("beforebegin",html);else ins.insertAdjacentHTML("beforeend",html)}}
  const d=document.createElement("div");d.appendChild(tp.content);h=d.innerHTML}catch(e){}return h}}
/* atalho "Minhas colunas" no "O que você quer publicar?" (para quem já tem rascunho ou coluna) */
{const _ih=cn102InicioHTML;cn102InicioHTML=function(){let h=_ih.apply(this,arguments);try{const tem=ed132RascLe().length||ED132.agend.length||(PUB.itens||[]).some(x=>x&&x.autor===S.uid&&cs123Col(x));
  if(tem&&h.indexOf("data-cr137hub")<0)h=h.replace(/(<button type="button" class="cn102-card cs123-cardc"[\s\S]*?<\/button>)/,`$1<button type="button" class="cr137-hubl" data-cr137hub>Minhas colunas <small>rascunhos, agendadas e publicadas</small><i aria-hidden="true">›</i></button>`)}catch(e){}return h}}
/* o "+" da linha vazia não tira o foco do texto */
["pointerdown","mousedown"].forEach(k=>document.addEventListener(k,e=>{if(e.target&&e.target.closest&&e.target.closest("#layer > .ed132 .cr137-pl"))e.preventDefault()},true));
