/* ---------- 135: QA das colunas (editor, importar/exportar, leitores) — correções ----------
   QC01 Duas abas no mesmo rascunho: a aba parada, ao fechar ou ficar escondida, regravava o texto velho por cima do novo
        (no aparelho e no banco). Agora o rascunho só é regravado quando muda nesta aba; se outra aba salvar o mesmo
        rascunho e esta não tiver mudança, esta passa a mostrar o texto novo.
   QC02 Sessão que cai no meio da edição: o rascunho ia para uma gaveta sem dono ("…:null") e sumia depois de entrar de
        novo. Agora continua na gaveta de quem estava escrevendo, com aviso.
   QC04 Publicar com a sessão expirada: em vez de "Não deu para publicar agora", diz que é preciso entrar de novo.
   QC07 Contagem de palavras: avisa quando o texto passou do limite de tamanho, antes de tocar em Publicar.
   Nomes globais com o prefixo qx135 / QX135. */

var QX135={uid:null,aviso:false};

/* ===== QC02: a gaveta de rascunhos é sempre a de quem estava escrevendo ===== */
const qx135RK=()=>"prumo-ed132-rasc:"+(S.uid||QX135.uid||"");
setInterval(()=>{if(S.uid){QX135.uid=S.uid;QX135.aviso=false}else if(QX135.uid&&ED132.E&&!QX135.aviso){QX135.aviso=true;
  try{ed132Guarda()}catch(e){}toast("Sua sessão terminou. O texto continua guardado neste aparelho; entre de novo para publicar.")}},1000);
ed132RascLe=function(){if(!S.uid&&!QX135.uid)return [];try{const l=JSON.parse(localStorage.getItem(qx135RK())||"[]");return Array.isArray(l)?l.filter(r=>r&&typeof r.rid==="string"&&/^[a-z0-9]{4,40}$/.test(r.rid)).sort((a,b)=>(b.at||0)-(a.at||0)):[]}catch(e){return []}};
ed132RascGrava=function(l){if(!S.uid&&!QX135.uid)return false;try{localStorage.setItem(qx135RK(),JSON.stringify(l.sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,30)));return true}catch(e){return false}};

/* ===== QC01: só regrava o que mudou nesta aba; outra aba salvou = atualiza esta ===== */
const qx135Sig=E=>{try{const d=ed132Rasc(E);if(!d)return "";delete d.at;delete d.sync;delete d.pal;return JSON.stringify(d)}catch(e){return "?"}};
{const _dr=ed132DoRasc;ed132DoRasc=function(d){const E=_dr.apply(this,arguments);try{E.qxSig=qx135Sig(E);E.qxAt=+d.at||0}catch(e){}return E}}
{const _g=ed132Guarda;ed132Guarda=function(){const E=ED132.E;if(!E||E.modo==="editar"||E.env)return _g.apply(this,arguments);
  try{ed132Le();ed132LePainel()}catch(e){}const sg=qx135Sig(E);
  if(E.salvou&&sg&&E.qxSig===sg){clearTimeout(ED132.gt);return}
  const r=_g.apply(this,arguments);E.qxSig=sg;E.qxAt=Date.now();return r}}
addEventListener("storage",e=>{try{const E=ED132.E;if(!E||E.modo==="editar"||E.env||e.key!==qx135RK())return;
  const d=ed132RascLe().find(r=>r.rid===E.rid);if(!d||(+d.at||0)<=(E.qxAt||0))return;
  ed132Le();ed132LePainel();const sujo=qx135Sig(E)!==E.qxSig;
  if(sujo){if(!E.qxAviso){E.qxAviso=true;toast("Este rascunho também foi mudado em outra aba. O que você salvar aqui fica valendo.")}E.qxAt=+d.at;return}
  if($("#layer > .ed132 .ed132-pp")||$("#layer2")?.innerHTML){E.qxAt=+d.at;return}
  const N=ed132DoRasc(d);Object.assign(E,{tit:N.tit,linha:N.linha,cham:N.cham,html:N.html,tags:N.tags,serie:N.serie,n:N.n,pautas:N.pautas,pub:N.pub,capa:N.capa||E.capa,agendar:N.agendar,qd:N.qd,qh:N.qh,qxSig:N.qxSig,qxAt:N.qxAt});
  ed132Desenha();ed132EdFotos();toast("Rascunho atualizado com o que você escreveu na outra aba.")}catch(err){}});

/* ===== QC04: sessão expirada ao publicar ou salvar ===== */
{const _er=ed132Erro;ed132Erro=function(e){const m=String((e&&(e.code||""))+" "+(e&&e.message||""));
  if(/JWT|PGRST30[0-9]|\b401\b|invalid claim|not authenticated|sess[aã]o/i.test(m))return "Sua sessão expirou. Entre de novo para publicar; o texto continua guardado neste aparelho.";return _er.apply(this,arguments)}}

/* ===== QC07: a contagem avisa quando passou do limite ===== */
{const _ct=ed132Conta;ed132Conta=function(ja){const r=_ct.apply(this,arguments);clearTimeout(QX135.ct);QX135.ct=setTimeout(()=>{try{const E=ED132.E,el=$("#layer > .ed132 [data-ed132cont]"),cp=$("#ed132-corpo");if(!E||!el||!cp)return;
    const n=ed132Limpa(cp.innerHTML).length,lim=cs123Lim(),mais=n>lim;el.classList.toggle("qx135-lim",mais);
    if(mais&&el.textContent.indexOf("passou do limite")<0)el.textContent+=` · passou do limite${/até 6\.000/.test(el.textContent)?"":` de ${cs123Num(lim)} caracteres`}`}catch(e){}},ja?0:200);return r}}

/* ===== QC05: a linha depois de uma lista (Enter duas vezes) vinha como <div>: o "/" não abria o menu de blocos ali =====
   (o Chrome ignora o separador de parágrafo ao sair da lista). A linha vira <p> antes do 132 olhar o "/". */
function qx135DivP(){const cp=$("#ed132-corpo"),s=getSelection();if(!cp||!s||!s.rangeCount)return;const b=ed132Topo();if(!b||b.tagName!=="DIV"||b.parentNode!==cp)return;
  const an=s.anchorNode,of=s.anchorOffset,p=document.createElement("p");while(b.firstChild)p.appendChild(b.firstChild);if(!p.firstChild)p.innerHTML="<br>";b.replaceWith(p);
  try{const r=document.createRange();if(an&&an!==b&&p.contains(an))r.setStart(an,Math.min(of,an.nodeType===3?an.length:an.childNodes.length));else r.setStart(p,Math.min(of,p.childNodes.length));r.collapse(true);s.removeAllRanges();s.addRange(r);ED132.rg=r.cloneRange()}catch(e){}}
/* lista criada pelo "/" (ou pela barra) numa linha: o Chrome punha a lista DENTRO do parágrafo (<p><ul>…</ul><p>…</p></p>);
   a linha seguinte ficava presa nele e o "/" não abria o menu. O parágrafo que tem blocos dentro é desfeito. */
const QX135_BL=/^(?:UL|OL|P|H2|H3|BLOCKQUOTE|DIV|HR|FIGURE)$/;
function qx135Norm(){const cp=$("#ed132-corpo");if(!cp)return;const ruins=[...cp.children].filter(p=>p.tagName==="P"&&[...p.children].some(c=>QX135_BL.test(c.tagName)));if(!ruins.length)return;
  const s=getSelection(),an=s&&s.rangeCount?s.anchorNode:null,of=s&&s.rangeCount?s.anchorOffset:0;
  ruins.forEach(p=>{const fr=document.createDocumentFragment();let run=null;
    [...p.childNodes].forEach(n=>{if(n.nodeType===1&&QX135_BL.test(n.tagName)){run=null;if(n.tagName==="DIV"){const q=document.createElement("p");while(n.firstChild)q.appendChild(n.firstChild);if(!q.firstChild)q.innerHTML="<br>";fr.appendChild(q)}else fr.appendChild(n);return}
      if(!run){if(n.nodeType===3&&!String(n.nodeValue).trim())return;if(n.nodeType===1&&n.tagName==="BR")return;run=document.createElement("p");fr.appendChild(run)}run.appendChild(n)});
    p.replaceWith(fr)});
  if(an&&an.isConnected&&cp.contains(an))try{const r=document.createRange();r.setStart(an,Math.min(of,an.nodeType===3?an.length:an.childNodes.length));r.collapse(true);s.removeAllRanges();s.addRange(r);ED132.rg=r.cloneRange()}catch(e){}}
window.addEventListener("input",e=>{if(e.target&&e.target.id==="ed132-corpo")try{qx135Norm();qx135DivP()}catch(_){}},true);
{const _c=ed132Cmd;ed132Cmd=function(){const r=_c.apply(this,arguments);try{qx135Norm();ed132BarEstado()}catch(e){}return r}}
