/* 164 · Foto dentro da caixa de criar (decisão do Pedro, 16/11). Prefixo fc164.
   Antes: "Foto" na caixa abria o editor de fotos antigo (Novo post › Editar › Avançar) e a caixa sumia.
   Agora: escolher a foto volta direto para a caixa, com as miniaturas embaixo do texto. Tocar numa miniatura abre o corte e o
   ajuste (o mesmo editor); "Concluir" (ou ×) volta para a caixa com o texto. "Publicar" publica o texto com as fotos.
   O editor fica guardado em CP152.ed enquanto a caixa está aberta.
   Revisto em 16/11 (noite, testador): a miniatura abre direto Filtros/Editar daquela foto (com a aba Cortar ao lado), sem a
   Galeria, sem Avançar e sem POST/GIRO; "Concluir", × e a seta voltam para a caixa. Notícia com foto escolhe a notícia ali na
   caixa (antes abria a tela da Notícia, que publicava sem a foto); Enquete/Número/De perto ficam apagados com foto e dizem por
   quê embaixo dos botões; "Local e pessoas na foto" é uma folha pequena (Local, Marcar pessoas, Texto alternativo, Pronto). */
CP152.ed=null;
const fc164Tem=()=>!!(CP152.ed&&CP152.ed.po&&CP152.ed.po.fotos&&CP152.ed.po.fotos.length);
function fc164Url(f){try{return edUrlF(f)}catch(e){return ""}}
function fc164Volta(){const E=typeof ED!=="undefined"?ED:null;if(E&&E.fc164){E.fc164novo=false;CP152.ed=E.po.fotos.length?E:null;
    if(CP152.ed){E.po.passo="fotos";E.po.aba="filtros"}}
  ED=null;cp152Abre({manter:true,aba:"post",semFoco:true})}
/* abre o editor (o mesmo de antes) com as fotos que já estão na caixa */
function fc164Edita(i,passo){const E=CP152.ed;if(!E)return;CP152.veio=true;
  if($("#layer").innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}
  ED=E;E.fc164=true;E.fc164novo=false;const P=E.po;P.passo=passo||"filtros";P.aba="filtros";P.fiOn=false;if(typeof i==="number"&&P.fotos[i])P.cur=i;
  $("#layer").innerHTML=`<div class="ce" role="dialog" aria-modal="true" aria-label="Editar fotos"></div>`;if(pushH())HST++;try{edDesenha()}catch(e){}}

/* "Foto" na caixa: escolhe na galeria (no mesmo toque) e volta para a caixa */
/* depois de escolher: o editor ia mostrar o corte; volta para a caixa com as miniaturas */
/* editor aberto pela miniatura: Concluir no alto, abas Cortar · Filtros · Editar, sem Galeria nem POST/GIRO */
function fc164Abas(a){return `<div class="ce-abas2 fc164-abas" role="tablist">${[["cortar","Cortar"],["filtros","Filtros"],["editar","Editar"]].map(([k,n])=>`<button type="button" role="tab" data-fc164aba="${k}" aria-selected="${k===a}">${n}</button>`).join("")}</div>`}
function fc164Ajusta(E){const ce=$("#layer .ce");if(!E||!E.fc164||!E.po||!ce)return;const P=E.po,ps=P.passo;
  const corte=ps==="fotos"&&!E.fc164novo&&P.fotos.length;ce.classList.toggle("fc164-corte",!!corte);
  if(ps!=="filtros"&&ps!=="editar"&&!corte)return;
  const b=ce.querySelector("[data-edav]");if(b){b.textContent="Concluir";b.disabled=false}
  const h=ce.querySelector(".ce-ph b");if(h)h.textContent=corte?"Cortar":"Editar foto";
  const v=ce.querySelector(".ce-ph [data-edvolta]");if(v){v.innerHTML=EDI.x;v.setAttribute("aria-label","Voltar para a publicação")}
  if(corte){const bx=ce.querySelector("#cfp-box");if(bx&&!ce.querySelector(".fc164-abas"))bx.insertAdjacentHTML("afterend",fc164Abas("cortar"))}
  else{const ab=ce.querySelector(".ce-abas2:not(.fc164-abas)");if(ab)ab.outerHTML=fc164Abas(P.aba==="editar"?"editar":"filtros")}}
/* no editor aberto pela caixa: "Concluir" e × voltam para a caixa (com as fotos e o texto) */
window.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;const E=typeof ED!=="undefined"?ED:null;if(!E||!E.fc164||E.env)return;
  const ps=E.po.passo,ed=ps==="fotos"||ps==="filtros"||ps==="editar";if(!ed||t.closest("#layer .ce-sel"))return;let b;const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  if(t.closest("#layer .ce [data-edav],#layer .ce [data-edfechar],#layer .ce .ce-ph [data-edvolta]")){pare();fc164Volta();return}
  if(b=t.closest("#layer .ce [data-fc164aba]")){pare();const a=b.dataset.fc164aba;if(a==="cortar")E.po.passo="fotos";else{E.po.passo="filtros";E.po.aba=a;E.po.fiOn=false}try{edDesenha()}catch(_){}return}},true);

/* miniaturas na caixa */
function fc164HTML(){if(!fc164Tem())return "";const P=CP152.ed.po;
  return `<div class="fc164" role="group" aria-label="Fotos do post">${P.fotos.map((f,i)=>`<div class="fc164-i"><button type="button" class="fc164-t" data-fc164ed="${i}" aria-label="Foto ${i+1}: toque para cortar e ajustar"><img alt="" data-fc164i="${i}"></button><button type="button" class="fc164-x" data-fc164x="${i}" aria-label="Tirar a foto ${i+1}">${CN102_SVG(CN102_ICO.x)}</button></div>`).join("")}${P.fotos.length<10?`<button type="button" class="fc164-mais" data-cp152ax="foto" aria-label="Mais fotos">${CN102_SVG(CN102_ICO.mais)}</button>`:""}</div>
    <p class="fc164-d">Toque numa foto para cortar, ajustar ou pôr filtro.</p>
    <button type="button" class="fc164-det" data-fc164det>${CN102_SVG('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>')}<span>Local e pessoas na foto${fc164Resumo(P)?`<small>${esc(fc164Resumo(P))}</small>`:""}</span><i aria-hidden="true">›</i></button>`}
function fc164Resumo(P){const m=(P.marcados||[]).map(u=>String(nomeDe(u)).split(" ")[0]),a=P.fotos.filter(x=>String(x.alt||"").trim()).length;
  return [String(P.local||"").trim(),m.join(", "),a?`texto alternativo em ${a} de ${P.fotos.length}`:""].filter(Boolean).join(" · ")}
/* com foto: Enquete, Número e De perto não vão junto (o aviso fica embaixo dos botões, sem cobrir nada) */
const FC164_NAO={enq:"Enquete não vai junto com foto. Tire a foto para fazer uma enquete.",ana:"Número não vai junto com foto. Tire a foto para juntar um número ou gráfico.",rel:"De perto tem as próprias fotos. Tire a foto daqui para usar De perto."};
function fc164Nota(k){const ax=$("#layer > .cp152 .cp152-ax");if(!ax)return;let n=$("#layer > .cp152 .fc164-nota");if(!n){n=document.createElement("p");n.className="fc164-nota";n.setAttribute("role","status");ax.after(n)}
  n.textContent=FC164_NAO[k]||"Isso não vai junto com foto.";clearTimeout(fc164Nota.t);fc164Nota.t=setTimeout(()=>{if(n.isConnected)n.remove()},6000)}
/* Notícia com foto: escolhe a notícia na própria caixa; a foto, o texto e a notícia ficam juntos */
function fc164ListaNt(){const cx=$("#layer > .cp152");if(!cx)return;cx.querySelector(".cn102-ntl")?.remove();
  /* a lista da edição (102, com a busca do 154) é montada dentro de um .ce de passagem e vem para a caixa */
  const tmp=document.createElement("div");tmp.className="ce";tmp.hidden=true;cx.appendChild(tmp);
  try{cn102ListaNt("data-fc164nt")}catch(e){}const ov=tmp.querySelector(".cn102-ntl");tmp.remove();if(!ov)return;ov.classList.add("fc164-ntl");cx.appendChild(ov)}
/* Local e pessoas: uma folha pequena por cima da caixa */
function fc164Detalhes(){const E=CP152.ed,cx=$("#layer > .cp152");if(!E||!cx)return;const P=E.po;P.marcados=P.marcados||[];cx.querySelector(".fc164-dsh")?.remove();const am=amigosL();
  const ov=document.createElement("div");ov.className="ce-sel fc164-dsh";
  ov.innerHTML=`<div class="ce-selp" role="dialog" aria-label="Local e pessoas na foto"><b>Local e pessoas na foto</b>
    <label class="fc164-lb"><span>Local</span><input class="field" id="fc164-local" maxlength="60" placeholder="Ex.: Rio de Janeiro" value="${esc(P.local||"")}" enterkeyhint="done"></label>
    <p class="fc164-st">Marcar pessoas</p>${am.length?`<div class="pick dm-pick fc164-pick">${am.map(u=>`<button type="button" data-fc164marca="${esc(u)}" aria-pressed="${P.marcados.includes(u)}">${avatar(u)}<span>${esc(nomeDe(u))}</span><i class="dm-ck" aria-hidden="true"></i></button>`).join("")}</div>`:`<p class="ce-selh">Quando tiver amigos no Prumo, eles aparecem aqui. Você também pode usar @ no texto.</p>`}
    <p class="fc164-st">Texto alternativo</p><p class="ce-selh">Descreva cada foto para quem usa leitor de tela.</p>
    ${P.fotos.map((x,i)=>`<div class="ce-altr"><img alt="" data-fc164ai="${i}"><input class="field" maxlength="200" placeholder="Descreva a foto ${i+1}" data-fc164alt="${i}" value="${esc(x.alt||"")}"></div>`).join("")}
    <div class="ce-selb"><button type="button" class="btn" data-fc164detok>Pronto</button></div></div>`;
  cx.appendChild(ov);ov.querySelectorAll("img[data-fc164ai]").forEach(im=>{im.src=fc164Url(P.fotos[+im.dataset.fc164ai])})}
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.closest||!t.closest("#layer > .cp152 .fc164-dsh"))return;const P=CP152.ed&&CP152.ed.po;if(!P)return;
  if(t.id==="fc164-local")P.local=t.value;else if(t.dataset.fc164alt!=null&&P.fotos[+t.dataset.fc164alt])P.fotos[+t.dataset.fc164alt].alt=t.value});
/* o "voltar" dos detalhes (152) traz o texto de volta; as fotos ficam guardadas na caixa */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest||!t.closest("#layer > .cp152"))return;let b;
  if(t.closest("[data-fc164det]")){e.stopPropagation();e.preventDefault();fc164Detalhes();return}
  if(b=t.closest("[data-fc164nt]")){e.stopPropagation();e.preventDefault();CR155.pid=b.dataset.fc164nt;try{cr155Guarda()}catch(_){}cp152Desenha();return}
  if(t.closest(".fc164-ntl [data-edselx]")||(t.classList&&t.classList.contains("fc164-ntl"))){e.stopPropagation();e.preventDefault();t.closest(".fc164-ntl").remove();return}
  if(b=t.closest("[data-fc164marca]")){e.stopPropagation();e.preventDefault();const P=CP152.ed&&CP152.ed.po;if(!P)return;const u=b.dataset.fc164marca,i=P.marcados.indexOf(u);if(i>=0)P.marcados.splice(i,1);else P.marcados.push(u);b.setAttribute("aria-pressed",String(i<0));return}
  if(t.closest("[data-fc164detok]")||(t.classList&&t.classList.contains("fc164-dsh"))){e.stopPropagation();e.preventDefault();cp152Desenha();return}
  if(b=t.closest("[data-fc164ed]")){e.stopPropagation();e.preventDefault();fc164Edita(+b.dataset.fc164ed);return}
  if(b=t.closest("[data-fc164x]")){e.stopPropagation();e.preventDefault();const P=CP152.ed&&CP152.ed.po;if(!P)return;const i=+b.dataset.fc164x,f=P.fotos[i];P.fotos.splice(i,1);
    if(P.rolo){const j=P.rolo.indexOf(f);if(j>=0)P.rolo.splice(j,1)}P.cur=0;if(!P.fotos.length)CP152.ed=null;cp152Desenha();return}},true);

/* publicar: texto + fotos (e a notícia, se houver) */
/* descartar a caixa descarta também as fotos */
/* abrir a caixa do zero (não "manter") começa sem fotos */
