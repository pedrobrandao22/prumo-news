/* 164 · Foto dentro da caixa de criar (decisão do Pedro, 16/11). Prefixo fc164.
   Antes: "Foto" na caixa abria o editor de fotos antigo (Novo post › Editar › Avançar) e a caixa sumia.
   Agora: escolher a foto volta direto para a caixa, com as miniaturas embaixo do texto. Tocar numa miniatura abre o corte e o
   ajuste (o mesmo editor); "Concluir" (ou ×) volta para a caixa com o texto. "Publicar" publica o texto com as fotos.
   O editor fica guardado em CP152.ed enquanto a caixa está aberta. */
CP152.ed=null;
const fc164Tem=()=>!!(CP152.ed&&CP152.ed.po&&CP152.ed.po.fotos&&CP152.ed.po.fotos.length);
function fc164Url(f){try{return edUrlF(f)}catch(e){return ""}}
function fc164Volta(){const E=typeof ED!=="undefined"?ED:null;if(E&&E.fc164){E.fc164novo=false;CP152.ed=E.po.fotos.length?E:null;
    if(CP152.ed){E.po.passo="fotos";E.po.aba="filtros"}}
  ED=null;cp152Abre({manter:true,aba:"post",semFoco:true})}
/* abre o editor (o mesmo de antes) com as fotos que já estão na caixa */
function fc164Edita(i){const E=CP152.ed;if(!E)return;CP152.veio=true;
  if($("#layer").innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}
  ED=E;E.fc164=true;E.fc164novo=false;const P=E.po;P.passo="fotos";if(typeof i==="number"&&P.fotos[i])P.cur=i;
  $("#layer").innerHTML=`<div class="ce" role="dialog" aria-modal="true" aria-label="Editar fotos"></div>`;if(pushH())HST++;try{edDesenha()}catch(e){}}

/* "Foto" na caixa: escolhe na galeria (no mesmo toque) e volta para a caixa */
{const _an164=cp152Anexo;cp152Anexo=function(k){
  if(k!=="foto"){if(fc164Tem()){toast("Um post com foto junta só uma notícia. Tire as fotos para usar "+({enq:"Enquete",ana:"Número",rel:"De perto"}[k]||"essa opção")+".");if(k!=="nt")return}
    return _an164.apply(this,arguments)}
  /* mais fotos: junta (não troca) e volta para a caixa; desistir também volta */
  if(fc164Tem()){fc164Edita();const E=ED;if(E){E.po.multi=true;E.fc164novo=true}
    try{const f=$("#ce-pfile");if(f&&E&&E.po.fotos.length<10){f.addEventListener("cancel",()=>{if(ED===E&&E.fc164novo)fc164Volta()},{once:true});f.click()}}catch(e){}return}
  const r=_an164.apply(this,arguments);try{if(typeof ED!=="undefined"&&ED&&ED.modo==="post"){ED.fc164=true;ED.fc164novo=true}}catch(e){}return r}}
/* depois de escolher: o editor ia mostrar o corte; volta para a caixa com as miniaturas */
{const _ed164=edDesenha;edDesenha=function(){const E=typeof ED!=="undefined"?ED:null;
  if(E&&E.fc164&&E.fc164novo&&E.po&&E.po.passo==="fotos"&&E.po.fotos.length){E.fc164novo=false;setTimeout(()=>{if(ED===E)fc164Volta()},0);return}
  const r=_ed164.apply(this,arguments);
  try{if(E&&E.fc164&&E.po&&(E.po.passo==="filtros"||E.po.passo==="editar")){const b=$("#layer .ce [data-edav]");if(b)b.textContent="Concluir"}
    if(E&&E.fc164&&E.po&&E.po.passo==="fotos"){const h=$("#layer .ce .ce-ph b");if(h)h.textContent="Fotos do post"}}catch(e){}
  return r}}
/* no editor aberto pela caixa: "Concluir" e × voltam para a caixa (com as fotos e o texto) */
window.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;const E=typeof ED!=="undefined"?ED:null;if(!E||!E.fc164||E.env)return;
  const av=t.closest("#layer .ce [data-edav]");if(av&&(E.po.passo==="filtros"||E.po.passo==="editar")){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();fc164Volta();return}
  const x=t.closest("#layer .ce [data-edfechar]");if(x&&(E.po.passo==="fotos"||E.po.passo==="filtros"||E.po.passo==="editar")){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();
    if(E.po.passo!=="fotos"){E.po.passo="fotos";try{edDesenha()}catch(_){}return}fc164Volta();return}},true);

/* miniaturas na caixa */
function fc164HTML(){if(!fc164Tem())return "";const P=CP152.ed.po;
  return `<div class="fc164" role="group" aria-label="Fotos do post">${P.fotos.map((f,i)=>`<div class="fc164-i"><button type="button" class="fc164-t" data-fc164ed="${i}" aria-label="Foto ${i+1}: toque para cortar e ajustar"><img alt="" data-fc164i="${i}"></button><button type="button" class="fc164-x" data-fc164x="${i}" aria-label="Tirar a foto ${i+1}">${CN102_SVG(CN102_ICO.x)}</button></div>`).join("")}${P.fotos.length<10?`<button type="button" class="fc164-mais" data-cp152ax="foto" aria-label="Mais fotos">${CN102_SVG(CN102_ICO.mais)}</button>`:""}</div>
    <p class="fc164-d">Toque numa foto para cortar, ajustar ou pôr filtro.</p>
    <button type="button" class="fc164-det" data-fc164det>${CN102_SVG('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>')}<span>Local e pessoas na foto</span><i aria-hidden="true">›</i></button>`}
/* "Local e pessoas na foto": abre a tela de detalhes do editor (legenda = o texto da caixa); voltar traz de volta para a caixa */
function fc164Detalhes(){const E=CP152.ed;if(!E)return;fc164Edita();const P=E.po;P.texto=CP152.txt;P.pub=CP152.pub;
  try{if(CR155.pid&&pautaById(CR155.pid))P.pid=CR155.pid}catch(e){}P.passo="detalhes";try{edDesenha()}catch(e){}}
/* o "voltar" dos detalhes (152) traz o texto de volta; as fotos ficam guardadas na caixa */
{const _td164=cp152TextoDe;cp152TextoDe=function(E){try{if(E&&E.fc164&&E.po&&E.po.fotos&&E.po.fotos.length){E.po.passo="fotos";CP152.ed=E}}catch(e){}return _td164.apply(this,arguments)}}
{const _ph164=cp152PostHTML;cp152PostHTML=function(){let h=_ph164.apply(this,arguments);try{const f=fc164HTML();if(f){const i=h.indexOf("</textarea>");if(i>=0)h=h.slice(0,i+11)+f+h.slice(i+11);
    h=h.replace('placeholder="Escreva o que você acha…"','placeholder="Escreva uma legenda…"')}}catch(e){}return h}}
{const _de164=cp152Desenha;cp152Desenha=function(){const r=_de164.apply(this,arguments);try{if(fc164Tem())document.querySelectorAll("#layer > .cp152 img[data-fc164i]").forEach(im=>{im.src=fc164Url(CP152.ed.po.fotos[+im.dataset.fc164i])})}catch(e){}return r}}
{const _ok164=cp152Ok;cp152Ok=function(){const r=_ok164.apply(this,arguments);try{const b=$("#layer [data-cp152pub]");if(b&&fc164Tem())b.disabled=false}catch(e){}return r}}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest||!t.closest("#layer > .cp152"))return;let b;
  if(t.closest("[data-fc164det]")){e.stopPropagation();e.preventDefault();fc164Detalhes();return}
  if(b=t.closest("[data-fc164ed]")){e.stopPropagation();e.preventDefault();fc164Edita(+b.dataset.fc164ed);return}
  if(b=t.closest("[data-fc164x]")){e.stopPropagation();e.preventDefault();const P=CP152.ed&&CP152.ed.po;if(!P)return;const i=+b.dataset.fc164x,f=P.fotos[i];P.fotos.splice(i,1);
    if(P.rolo){const j=P.rolo.indexOf(f);if(j>=0)P.rolo.splice(j,1)}P.cur=0;if(!P.fotos.length)CP152.ed=null;cp152Desenha();return}},true);

/* publicar: texto + fotos (e a notícia, se houver) */
{const _pu164=cp152Publica;cp152Publica=async function(){if(!fc164Tem())return _pu164.apply(this,arguments);
  const E=CP152.ed,P=E.po,tx=CP152.txt.trim();let pid=null;try{pid=CR155.pid&&pautaById(CR155.pid)?CR155.pid:null}catch(e){}
  if($("#layer").innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}
  ED=E;E.fc164=false;P.texto=tx;P.pub=CP152.pub;if(pid)P.pid=pid;P.passo="detalhes";
  $("#layer").innerHTML=`<div class="ce" role="dialog" aria-modal="true" aria-label="Criar"></div>`;if(pushH())HST++;try{edDesenha()}catch(e){}
  CP152.ed=null;CP152.txt="";CP152.direto=true;try{await edPublicaPost()}catch(e){}
  if(!$("#layer .ce")){try{cr155Limpa()}catch(e){}}}}
/* descartar a caixa descarta também as fotos */
{const _fe164=cp152Fecha;cp152Fecha=function(){if(fc164Tem()&&!CP152.txt.trim()){const b=$("#layer [data-cp152x]");if(b&&!b.classList.contains("conf")){b.classList.add("conf");b.textContent="Descartar?";setTimeout(()=>{if(b.isConnected){b.classList.remove("conf");b.innerHTML=EDI.x}},2600);return}}
  const r=_fe164.apply(this,arguments);if(!$("#layer > .cp152"))CP152.ed=null;return r}}
/* abrir a caixa do zero (não "manter") começa sem fotos */
{const _ab164=cp152Abre;cp152Abre=function(o){if(!(o&&o.manter))CP152.ed=null;return _ab164.apply(this,arguments)}}
