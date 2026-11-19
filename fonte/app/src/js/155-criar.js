/* ---------- 155: criar, achados do testador (15/11) ----------
   1. Um caminho só: a barra do Feed ("+" e "Comente uma notícia…") abre a caixa; "O que você acha? <manchete>" e
      "Publicar com comentário" abrem o formulário da notícia já escolhida, sem a faixa de tipos, e "voltar" leva à caixa.
      A faixa de tipos (Notícia/De perto/Análise/Pergunta) some de todos os formulários; os nomes seguem os da caixa.
   2. A notícia escolhida fica na caixa (cartão com ×) ao voltar do formulário e publica junto com o texto.
   3. O texto da caixa fica guardado no aparelho: ir ao Giro e voltar, o voltar do celular (que agora pergunta antes)
      e fechar sem querer não apagam; só "Descartar?" ou publicar limpam. O Giro aberto pela caixa não repete POST/GIRO
      e o × dele volta para a caixa quando há texto lá.
   4. @ na caixa sugere amigos. 5. Enquete exige as opções. 6. Publicar legível no escuro.
   7. Sem rede: diz por quê, mostra o começo do post e tenta de novo sozinho quando a internet volta.
   8. Giro sem câmera: aviso abaixo do menu e sem obturador, flash e virar câmera.
   9. Coluna: apagar rascunho pede um 2º toque e dá "Desfazer"; botões da barra com nome; "0 palavras" sem "1 min".
   10. Cores das editorias legíveis na escolha da notícia. 11. Post só de texto: "Editar texto", e "Adicionar parte" explicado.
   12. Feed: análise com gráfico e post com notícia sem foto ficam do tamanho do conteúdo (sem o quadro 4:5 vazio).
   Nomes com o prefixo cr155. */
var CR155={pid:null,volta:0,giro:0};
const cr155K=()=>"prumo-cr155-caixa:"+(S.uid||"");

/* ===== guardar o texto da caixa ===== */
function cr155Le(){try{const o=JSON.parse(localStorage.getItem(cr155K())||"null");if(o&&typeof o.tx==="string"&&Date.now()-(+o.at||0)<14*864e5)return o}catch(e){}return null}
function cr155Guarda(){try{const tx=String(CP152.txt||"");if(tx.trim()||CR155.pid)localStorage.setItem(cr155K(),JSON.stringify({tx:tx.slice(0,2200),pid:CR155.pid||null,at:Date.now()}));else localStorage.removeItem(cr155K())}catch(e){}}
function cr155Limpa(){CP152.txt="";CR155.pid=null;try{localStorage.removeItem(cr155K())}catch(e){}}
var CR155_GT=0;
document.addEventListener("input",e=>{const t=e.target;if(!t||t.id!=="cp152-tx")return;CP152.txt=t.value;clearTimeout(CR155_GT);CR155_GT=setTimeout(cr155Guarda,250);
  try{if(typeof menSugere==="function")menSugere(t)}catch(_){}});

/* a lista de amigos entra logo abaixo do texto (como na legenda do criador, 145), sem cobrir o alto da caixa */

/* abrir a caixa: devolve o texto e a notícia guardados; o={pid} abre já com a notícia */
/* × e "Descartar?": quem descarta limpa o que estava guardado */

/* ===== a notícia na caixa ===== */
function cr155NtHTML(){const p=CR155.pid&&pautaById(CR155.pid);if(!p)return "";const v=versao(p,lente()),s=secOf(p);
  return `<div class="cr155-nt"><button type="button" class="cr155-ntb" data-cr155ntv aria-label="Trocar a notícia">${capaArte(p,"cn102-th")}<span><small style="color:${secCor(s)}">${esc(secNome(s))}${p.tag?" · "+esc(p.tag):""}</small><b>${esc(v.titulo)}</b></span></button><button type="button" class="cr155-ntx" data-cr155ntx aria-label="Tirar a notícia">${CN102_SVG(CN102_ICO.x)}</button></div>`}
/* publicar da caixa: com a notícia, sai como notícia comentada */
/* juntar com a notícia já escolhida: Notícia e Enquete levam a notícia */
/* a notícia escolhida no formulário fica marcada no editor (o 102 tira a notícia ao voltar sem texto) */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer [data-edpnt]");if(!b)return;const pid=b.dataset.edpnt;setTimeout(()=>{try{if(ED&&ED.po&&ED.po.pid===pid)ED.cr155pid=pid}catch(_){}},0)});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer [data-edsemnt]");if(!b)return;try{if(ED)ED.cr155pid=null}catch(_){}},true);
document.addEventListener("click",e=>{const t=e.target;if(!t.closest||!t.closest("#layer > .cp152"))return;
  if(t.closest("[data-cr155ntx]")){e.stopPropagation();e.preventDefault();CR155.pid=null;cr155Guarda();cp152Desenha();return}
  if(t.closest("[data-cr155ntv]")){e.stopPropagation();e.preventDefault();cp152Anexo("nt");setTimeout(()=>{try{if($("#layer .ce")&&!$("#layer .cn102-ntl"))cn102ListaNt("data-edpnt")}catch(_){}},0);return}},true);

/* ===== outros caminhos de criar ===== */
window.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
  /* barra do Feed: "Comente uma notícia…" e o "+" ao lado da manchete abrem a caixa */
  if(t.closest("[data-cn102bar]")){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();if(typeof PQ!=="undefined"&&PQ.atual){toast("Espere terminar de publicar.");return}cp152Abre();return}
},true);
/* "O que você acha? <manchete>", "Publicar com comentário" e outros: o formulário da notícia já escolhida, sem a faixa de tipos,
   com o texto guardado da caixa e com "voltar" levando para a caixa */
/* a faixa de tipos sai de todos os formulários (a escolha do tipo fica só na caixa) */
/* nomes iguais aos da caixa (Notícia, Enquete, Número, De perto) */
try{Object.assign(CN102_NOME,{nt:"Notícia",rel:"De perto",ana:"Número",enq:"Enquete"});
  CN102_KS.forEach(k=>{const n={nt:["Notícia","Notícia","Sua opinião sobre uma notícia da edição"],rel:["De perto","De perto","Foto, local e hora do que você viu"],ana:["Número","Número ou análise","Seu texto, um indicador ou um gráfico"],enq:["Enquete","Enquete","Uma pergunta para os amigos votarem"]}[k[0]];if(n){k[1]=n[0];k[2]=n[1];k[3]=n[2]}})}catch(e){}

/* ===== Giro a partir da caixa ===== */
window.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  if(t.closest("#layer > .cp152 [data-cp152aba='giro']")){cr155Guarda();CR155.giro=1;return}
  /* × do giro aberto pela caixa, sem nada feito no giro: volta para a caixa, onde está o texto */
  const x=t.closest("#layer .ce [data-edfechar]");if(x&&typeof ED!=="undefined"&&ED&&ED.cr155caixa&&ED.modo==="story"&&!ED.env){let algo=true;try{algo=!!edTemAlgo()}catch(_){}
    const g=cr155Le();if(!algo&&g&&(g.tx.trim()||g.pid)){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();try{camDesliga()}catch(_){}ED=null;cp152Abre()}}},true);

/* ===== voltar do celular com texto na caixa: pergunta antes (como o editor), e o texto fica guardado ===== */

/* ===== publicar pelo formulário que veio da caixa: a caixa começa vazia depois ===== */

/* ===== Enquete: as opções são da pessoa ===== */

/* ===== cores das editorias no fundo escuro ===== */
/* 19/11 madrugada (testador): a caixa agora segue o tema do celular (86-criar-limpo), e as cores das editorias já mudam
   com o tema; clarear de novo deixava os rótulos quase apagados no fundo branco (contraste ~2,7:1). Não clareia mais. */
function cr155Clareia(raiz){return;if(!raiz)return;raiz.querySelectorAll("small[style*='color']").forEach(s=>{if(s.dataset.cr155)return;const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(s).color);if(!m)return;
  const k=.5,f=v=>Math.round(+v+(255-v)*k);s.style.color=`rgb(${f(m[1])},${f(m[2])},${f(m[3])})`;s.dataset.cr155=1})}

/* ===== sem rede: diz por quê, mostra o começo e tenta de novo sozinho ===== */
function cr155SemRede(j){const m=String(j&&j.err&&(j.err.message||j.err)||"");return navigator.onLine===false||/fetch|network|rede|offline|conex|Load failed/i.test(m)}
function cr155Reenvia(){if(navigator.onLine===false)return;const j=PQ.jobs.find(x=>x.estado==="erro"&&(x.cr155n||0)<3);if(!j)return;
  if(PQ.atual||(typeof ED!=="undefined"&&ED)||$("#layer .ce")){clearTimeout(CR155.rt);CR155.rt=setTimeout(cr155Reenvia,4000);return}
  j.cr155n=(j.cr155n||0)+1;try{pqTenta(j.id)}catch(e){}}
addEventListener("online",()=>{clearTimeout(CR155.rt);CR155.rt=setTimeout(cr155Reenvia,800)});

/* ===== Giro sem câmera ===== */
function cr155Cam(){const ce=$("#layer .ce"),m=$("#cam-msg");if(!ce)return;const sem=!!(m&&!m.hidden&&CAM&&CAM.erro);ce.classList.toggle("cr155-semcam",sem);if(!m)return;
  if(!sem){m.style.top="";return}const rail=ce.querySelector(".ce-rail"),cv=m.offsetParent||m.parentElement;if(!rail||!cv)return;
  const rb=rail.getBoundingClientRect(),cb=cv.getBoundingClientRect(),mb=m.getBoundingClientRect();if(!rb.height)return;
  if(mb.top<rb.bottom+12)m.style.top=Math.round(rb.bottom-cb.top+16)+"px"}
{const _ce155=camErro;camErro=function(){const r=_ce155.apply(this,arguments);try{cr155Cam()}catch(e){}return r}}
{const _cg155=camLiga;camLiga=async function(){const r=await _cg155.apply(this,arguments);try{cr155Cam()}catch(e){}return r}}
{const _ct155=edCamTela;edCamTela=function(){const r=_ct155.apply(this,arguments);setTimeout(()=>{try{cr155Cam()}catch(e){}},0);return r}}
addEventListener("resize",()=>{try{if($("#layer .ce.cr155-semcam"))cr155Cam()}catch(e){}});

/* ===== Coluna: apagar o rascunho pede um 2º toque e dá "Desfazer" ===== */
{const _mx155=ed132Mais;ed132Mais=function(){const r=_mx155.apply(this,arguments);try{document.querySelectorAll("[data-ed132rapaga]").forEach(b=>{b.removeAttribute("data-ed132rapaga");b.setAttribute("data-cr155rapaga","")})}catch(e){}return r}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-cr155rapaga]");if(!b)return;e.stopPropagation();e.preventDefault();const E=ED132.E;
  if(!b.classList.contains("cr155-conf")){b.classList.add("cr155-conf");const t=String(E&&E.tit||"").trim();
    b.textContent=`Apagar ${t?"“"+cp152Corta(t,40)+"”":"este rascunho"}? Toque de novo`;setTimeout(()=>{if(b.isConnected){b.classList.remove("cr155-conf");b.textContent="Apagar este rascunho"}},4000);return}
  const d=E&&ed132RascLe().find(r=>r.rid===E.rid),copia=d?JSON.parse(JSON.stringify(d)):null;
  /* o 2º toque apaga pelo caminho de sempre (132) */
  b.removeAttribute("data-cr155rapaga");b.setAttribute("data-ed132rapaga","");b.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));
  if(copia)setTimeout(()=>{toast("Rascunho apagado","Desfazer",()=>{const n={...copia,at:Date.now(),sync:false};ed132RascPoe(n);try{ed132RemPoe(n)}catch(_){}toast("Rascunho de volta em Minhas colunas","Abrir",()=>{try{ed132Abre(ed132DoRasc(n))}catch(_){}})})},30)},true);
/* barra do editor: o nome embaixo de cada botão */
const CR155_BN={b:"Negrito",i:"Itálico",a:"Link",h2:"Título",h3:"Subtítulo",q:"Citação",ul:"Lista",ol:"Numerada",hr:"Linha",foto:"Foto",graf:"Gráfico",mvup:"Subir",mvdn:"Descer"};
{const _bh155=ed132BarHTML;ed132BarHTML=function(){const h=_bh155.apply(this,arguments);try{return h.replace(/data-ed132cmd="([a-z0-9]+)"/g,(s,k)=>CR155_BN[k]?`${s} data-cr155n="${CR155_BN[k]}"`:s)}catch(e){return h}}}
/* contagem: "0 palavras" sem "1 min" */
function cr155Conta(){const k=$("#layer > .ed132 .cr137-ct");if(k&&/^0 palavras/.test(k.textContent))k.textContent=k.textContent.replace(/ · 1 min( de leitura)?/,"")}
{const _cc155=cr137CtCopia;cr137CtCopia=function(){const r=_cc155.apply(this,arguments);try{cr155Conta()}catch(e){}return r}}

/* ===== post só de texto: "Editar texto"; "Adicionar parte" explicado ===== */
{const _fh155=f113EdHTML;f113EdHTML=function(parts){let h=_fh155.apply(this,arguments);try{h=h.replace("Adicionar parte</button>","Continuar em outra parte</button>");if(!(parts||[]).length&&h.indexOf("fs2-ed-add")>=0)h+=`<p class="fs2-ed-d cr155-fio">Para um texto longo: divida em partes, como um fio. Seus amigos veem a primeira e tocam em “Ler o fio”.</p>`}catch(e){}return h}}

/* ===== Feed: cartão do tamanho do conteúdo quando o post não tem foto ===== */
