/* ---------- posts ---------- */
const ESPECTRO_NOME={direita:"Mais à direita",centro:"Centro",esquerda:"Mais à esquerda",publica:"Pública"};
const ESPECTRO_COR={direita:"var(--right)",centro:"#8a939c",esquerda:"var(--left)",publica:"#b26b00"};
function espectroHTML(p){
  const map=FEED.espectro||{};const fs=(p.fontes||[]).filter(k=>map[k]);if(!fs.length)return "";
  const c={};fs.forEach(k=>c[map[k]]=(c[map[k]]||0)+1);const ord=["direita","centro","publica","esquerda"].filter(k=>c[k]);
  return `<div class="spec"><span class="lbl">Quem cobriu</span><div class="bar">${ord.map(k=>`<i style="width:${(100*c[k]/fs.length).toFixed(1)}%;background:${ESPECTRO_COR[k]}"></i>`).join("")}</div><div class="lg">${ord.map(k=>`<span><i style="background:${ESPECTRO_COR[k]}"></i>${ESPECTRO_NOME[k]}: ${c[k]}</span>`).join("")}</div><p class="hint">Classificação aproximada do Prumo, pela linha editorial predominante de cada veículo.</p></div>`;
}
function selo(p,big){
  const c=p.checagem;if(!c)return "";
  return `<span class="seal ${c.status==="divergencia"?"div":"ok"}">${c.status==="divergencia"?ICON.warn:ICON.prumo}${c.status==="divergencia"?"Veículos divergem":"No prumo: números conferidos"}</span>${big&&c.texto?`<p class="note">${esc(c.texto)}</p>`:""}`;
}
function visualHTML(v){
  if(!v)return "";
  if(v.tipo==="grafico")return graficoNoticia(v);
  if(v.tipo==="linha_do_tempo")return `<span class="lbl">${esc(v.titulo||"Linha do tempo")}</span><ol class="tl">${(v.itens||[]).slice(0,7).map(i=>`<li><b>${esc(i.quando)}</b><span>${esc(i.texto)}</span></li>`).join("")}</ol>`;
  if(v.tipo==="numeros")return `<span class="lbl">${esc(v.titulo||"Em números")}</span><div class="nums">${(v.itens||[]).slice(0,6).map(i=>`<div class="num"><b>${esc(i.valor)}</b><span>${esc(i.rotulo)}</span></div>`).join("")}</div>${v.fonte?`<p class="hint">Fonte: ${esc(v.fonte)}</p>`:""}`;
  if(v.tipo==="pesquisas")return graficoPesquisas();
  if(v.tipo==="imagem")return `<span class="lbl">${esc(v.titulo||"Infográfico")}</span><div class="art paper" data-sec="${esc(v.secao||"politica")}">${svgOf(v.imagem)}</div>${v.legenda?`<p class="hint">${esc(v.legenda)}</p>`:""}`;
  return "";
}
function slides(p){
  const n=p.neutro||{},sec=secOf(p),out=[];
  const info=(p.imagem?.etiqueta||"").toLowerCase()==="infográfico"||["pesquisa","indicador","dinheiro","plenario"].includes(p.imagem?.modelo);
  const fo=fotoDe(p);
  out.push(`<div class="sl"><div class="cover paper${fo?" fcv":info?" info":""}" data-sec="${esc(sec)}">${fo?`${coverSvg(p.imagem)}${fotoImg(fo,"fcv-i",1)}${fo.credito?credHTML(fo.credito,"fcv-c"):""}`:info?svgOf(p.imagem):coverSvg(p.imagem)}<div class="cv"><span class="kickrow"><button type="button" class="kick kickb" data-tagx>${esc(p.tag||secNome(sec))}</button>${fo?"":`<span class="klab">${esc((p.imagem?.etiqueta||"Ilustração").toLowerCase())}</span>`}</span><h2 class="${(n.titulo||"").length>72?"long":""}">${esc(n.titulo)}</h2></div></div></div>`);
  const ups=(p.atualizacoes||[]).slice().sort((a,b)=>String(b.hora).localeCompare(String(a.hora)));
  out.push(`<div class="sl txs"><button type="button" class="lermais" data-lermais>Continuar lendo</button><span class="lbl">O que aconteceu</span>${ups.length?ups.slice(0,2).map(u=>`<div class="upd"><b>${esc(atualizadoTxt(u.hora))}</b>${esc(u.texto)}</div>`).join(""):""}${(p.correcoes||[]).map(c=>`<div class="upd fix"><b>Correção · ${esc(hhmm(c.hora))}</b>${esc(c.texto)}</div>`).join("")}<p class="lead">${marcarTermos(n.texto||"")}</p>${p.contexto?`<p class="note"><b>Contexto.</b> ${marcarTermos(p.contexto)}</p>`:""}${p.proximo?`<p class="note"><b>O que vem.</b> ${marcarTermos(p.proximo)}</p>`:""}${p.e_o_brasil?`<p class="note"><b>E o Brasil?</b> ${marcarTermos(p.e_o_brasil)}</p>`:""}${(FEED.explicadores||{})[temaDe(p)]?`<button type="button" class="explain" data-explica="${esc(temaDe(p))}">Entenda: ${esc(temaDe(p))}</button>`:""}</div>`);
  if(p.direita||p.esquerda)out.push(`<div class="sl txs"><button type="button" class="lermais" data-lermais>Continuar lendo</button><span class="lbl">A mesma notícia, dois ângulos</span>${p.direita?`<div class="ang r"><span class="lbl">Viés de direita</span><b>${esc(p.direita.titulo)}</b><span class="x">${esc(p.direita.texto)}</span></div>`:""}${p.esquerda?`<div class="ang l"><span class="lbl">Viés de esquerda</span><b>${esc(p.esquerda.titulo)}</b><span class="x">${esc(p.esquerda.texto)}</span></div>`:""}${p.o_que_muda?`<p class="note"><b>O que muda.</b> ${esc(p.o_que_muda)}</p>`:""}<p class="hint">Versões escritas pelo Prumo com os mesmos fatos, mudando só a ênfase e as palavras.</p></div>`);
  const vis=(p.visuais||[]).map(v=>({...v,secao:sec})).sort((a,b)=>(b.tipo==="grafico")-(a.tipo==="grafico")).find(v=>visualHTML(v));
  if(vis)out.push(`<div class="sl txs"><button type="button" class="lermais" data-lermais>Continuar lendo</button>${visualHTML(vis)}</div>`);
  if((p.enquadramentos||[]).length||(p.links||[]).length||p.checagem)out.push(`<div class="sl txs"><button type="button" class="lermais" data-lermais>Continuar lendo</button><span class="lbl">Os veículos</span><div class="cobx" data-a="cob" role="button" tabindex="0">${selo(p,true)}${espectroHTML(p)}<span class="cob-mais">${esc(coberturaTxt(p))} ›</span></div>${(p.enquadramentos||[]).length?`<ul class="enq">${p.enquadramentos.map(e=>`<li><b>${esc(nomeFonte(e.fonte))}</b>${esc(e.descricao)}</li>`).join("")}</ul>`:""}${(p.links||[]).length?`<button type="button" class="link" data-a="links">Ler as matérias originais (${p.links.length} ${p.links.length===1?"link":"links"})</button>`:""}</div>`);
  return out.slice(0,5);
}
function coberturaTxt(p){const n=(p.fontes||[]).length,r=(p.fontes||[]).filter(k=>REGUA().includes(k)).length;return `${n} ${n===1?"veículo noticiou":"veículos noticiaram"}${r&&r<n?` · ${r} dos ${REGUA().length} principais`:""}`}
function postSeguro(p){try{return postHTML(p)}catch(e){return ""}}
function postHTML(p){
  const sec=secOf(p),ss=slidesSociais(p),nv=NOVAS.has(p.id)&&!LIDAS.has(p.id),at=ATUALIZADAS.has(p.id);
  return `<article class="post" id="p-${esc(p.id)}" data-pid="${esc(p.id)}">
    <div class="ph gut"><div class="ph-t"><button type="button" class="ph-sec" data-secfiltro="${esc(sec)}"><span class="ph-av${nv||at?" ph-av-novo":""}" style="--c:${secCor(sec)}"><i>${esc(secNome(sec).slice(0,1))}</i></span><span class="ph-nm"><b>${esc(secNome(sec))}</b><span class="ph-sub">${esc(p.subtema||"")}${seguido(p)?" · seguindo":""}</span></span></button><em class="lida-t"${lidaAtual(p)?"":" hidden"}>✓ lida</em><span data-otr></span></div>${cobStatus(p)}${nv?`<span class="badge-new">Novo</span>`:at?`<span class="badge-new upd2">Atualizado</span>`:""}<button type="button" class="more-btn" data-a="menu" aria-label="Mais opções">${ICON.dots}</button></div>
    <div class="car"><div class="track">${ss.join("")}</div></div>
    <div class="gut">
      <div class="acts"><button type="button" class="act" data-a="like" aria-label="Gostei">${ICON.like}<span>Gostei</span><em class="cnt" data-n="like"></em></button><button type="button" class="act" data-a="cmt" aria-label="Comentar">${ICON.cmt}<span>Comentar</span><em class="cnt" data-n="cmt"></em></button><button type="button" class="act" data-a="send" aria-label="Enviar">${ICON.send}<span>Enviar</span></button><span class="sp"></span>${ss.length>1?`<div class="prog pdots" aria-hidden="true">${ss.map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${ss.length}</span></div>`:""}<button type="button" class="act" data-a="save" aria-label="Guardar">${ICON.save}</button></div>
      <div class="likes" data-likes></div>
      ${legendaPost(p)}
      ${cobBarra(p)}
      <div class="pollbox" data-poll></div>
      <div data-together></div><div data-nchat></div>
      <div class="cmt-area"><div class="cmts" data-cmts></div><button type="button" class="addc" data-a="cmt">Adicione um comentário…</button></div>
      <time class="pt-hora" data-when="${esc(ultimaAtualizacao(p)||p.hora||"")}">${esc(quando(ultimaAtualizacao(p)||p.hora))}</time>
    </div>
  </article>`;
}
function curtidasDe(u){return (S.soc.curtidas||{})[u]||{}}
function socialOf(pid){const likes=Object.entries(S.soc.curtidas||{}).filter(([u,m])=>ehVisivel(u)&&m&&m[pid]).map(([u])=>u);const cm=(S.cmts[pid]||[]).filter(c=>ehVisivel(c.uid)).sort((a,b)=>a.at-b.at);return {likes,cm}}
function todosComentarios(){const out=[];Object.values(S.cmts).forEach(l=>l.forEach(c=>{if(ehVisivel(c.uid))out.push(c)}));return out}
function snapSocial(id){for(const m of Object.values(S.soc.curtidas||{})){const x=m&&m[id];if(x&&x.snap&&x.snap.titulo)return x.snap}return null}
function votosDe(pid){const o={};Object.entries(S.soc.votos||{}).forEach(([u,m])=>{if(ehVisivel(u)&&m&&m[pid]!=null)o[u]=m[pid]});return o}
function meuVoto(pid){const m=S.uid?(S.soc.votos||{})[S.uid]:null;return m?m[pid]:undefined}
function atividadeAmigos(pid){const {likes,cm}=socialOf(pid);return amigosL().map(u=>({u,ac:[likes.includes(u)?"gostou":"",cm.some(c=>c.uid===u)?"comentou":""].filter(Boolean)})).filter(x=>x.ac.length)}
const CPEND={};
function montarCmts(docs){const by={};docs.forEach(([uid,dd])=>Object.entries((dd&&dd.itens)||{}).forEach(([cid,c])=>{const k=uid+"\u0001"+cid,p=CPEND[k];if(p){if(Date.now()-p.t>30000||(p.v?!!c:!c))delete CPEND[k]}if(c&&c.texto&&!(p&&p.v===null))(by[c.pid]=by[c.pid]||[]).push({...c,id:cid,uid})}));
  Object.entries(CPEND).forEach(([k,p])=>{if(Date.now()-p.t>90000){delete CPEND[k];return}if(!p.v)return;const [uid,cid]=k.split("\u0001");const l=(by[p.v.pid]=by[p.v.pid]||[]);if(!l.some(c=>c.id===cid))l.push({...p.v,id:cid,uid})});return by}
function updateSocial(pid){
  const sa=$("#s-acts");if(sa&&sa.dataset.pid===pid)sa.innerHTML=storyActs(pid);
  const el=document.getElementById("p-"+pid);if(!el)return;
  const {likes,cm}=socialOf(pid),mine=!!(S.uid&&likes.includes(S.uid)),others=likes.filter(u=>u!==S.uid);
  const lb=el.querySelector('[data-a="like"]');lb.classList.toggle("on",mine);lb.setAttribute("aria-pressed",String(mine));
  el.querySelector('[data-n="like"]').textContent="";
  el.querySelector('[data-n="cmt"]').textContent="";
  const sb=el.querySelector('[data-a="save"]'),sv=!!S.salvos[pid];sb.classList.toggle("saved",sv);sb.setAttribute("aria-pressed",String(sv));
  let lt="";const n1=others[0]?`<b>${esc(nomeDe(others[0]))}</b>`:"";
  if(mine&&others.length===1)lt=`<b>Você</b> e ${n1} gostaram`;
  else if(mine&&others.length>1)lt=`<b>Você</b> e mais ${others.length} gostaram`;
  else if(others.length===1)lt=`${n1} gostou`;
  else if(others.length>1)lt=`${n1} e mais ${others.length-1} gostaram`;
  {const lk=el.querySelector("[data-likes]");lk.innerHTML=lt;if(lt){lk.dataset.a="quem";lk.setAttribute("role","button");lk.tabIndex=0}else{delete lk.dataset.a;lk.removeAttribute("role");lk.removeAttribute("tabindex")}}
  const pp=pautaById(pid);if(pp){const pl=el.querySelector("[data-poll]");if(pl){const eh=enqueteHTML(pp);pl.innerHTML=eh?`<span class="pb-l">Enquete</span>${eh}`:""}}
  {const ot=el.querySelector("[data-otr]");if(ot){const at=atividadeAmigos(pid);
    if(at.length===1){const {u,ac}=at[0];ot.innerHTML=`<span class="otr" role="button" tabindex="0" ${ac.includes("gostou")?`data-filtro="_gostou"`:`data-otrs="${esc(pid)}"`} title="${esc(nomeDe(u))}" aria-label="${esc(nomeDe(u)+" "+ac.join(", "))}">${avatar(u)}${esc(ac.join(" · "))}</span>`}
    else if(at.length>1)ot.innerHTML=`<span class="otr" role="button" tabindex="0" data-otrs="${esc(pid)}" aria-label="${esc(at.length+" amigos nesta notícia")}">${avatares(at.map(x=>x.u))}${at.length} amigos</span>`;
    else ot.innerHTML=""}}
  {const nc=el.querySelector("[data-nchat]");if(nc){const ms=allMsgs().filter(m=>m.pid===pid&&m.texto);const u=ms[ms.length-1];nc.innerHTML=u?`<button type="button" class="nachat" data-nachat="${esc(u.de===S.uid?u.para:u.de)}">${ICON.cmt}<span><b>Na conversa</b> · ${esc(u.de===S.uid?"Você":nomeDe(u.de))}: ${esc(u.texto)}</span></button>`:""}}
  el.querySelector("[data-together]").innerHTML="";
  el.querySelector("[data-cmts]").innerHTML=(cm.length>2?`<button type="button" class="link" data-a="cmt">Ver os ${cm.length} comentários</button>`:"")+cm.slice(-2).map(c=>`<div class="cmt" data-a="cmt" role="button" tabindex="0"><b>${esc(nomeDe(c.uid))}</b>${esc(c.texto)}</div>`).join("");
}
var FIT_IO=("IntersectionObserver" in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)fitTrack(e.target)}),{rootMargin:"900px 0px"}):null;
function fitTrack(t){const w=t.clientWidth;if(w)t.style.setProperty("--slh",Math.max(300,Math.round(Math.min(w*1.25,innerHeight*0.7)))+"px");t.querySelectorAll(".txs:not(.aberto)").forEach(x=>x.classList.toggle("ovf",x.scrollHeight>x.clientHeight+6));const i=Math.max(0,Math.round(t.scrollLeft/Math.max(1,w)));const s=t.children[i];if(s&&s.offsetHeight>0)t.style.height=s.offsetHeight+"px";return i}
function wireTracks(root){
  root.querySelectorAll(".track").forEach((t,ix)=>{
    if(ix<3||!FIT_IO)fitTrack(t);else FIT_IO.observe(t);let tm=null;t.closest(".post")?.addEventListener("contentvisibilityautostatechange",ev=>{if(!ev.skipped)fitTrack(t)});
    t.addEventListener("scroll",()=>{const post=t.closest(".post");const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth));const pg=post.querySelector(".pg");if(pg)pg.textContent=`${i+1}/${t.children.length}`;post.querySelectorAll(".prog i").forEach((d,k)=>d.classList.toggle("on",k<=i));clearTimeout(tm);tm=setTimeout(()=>{fitTrack(t);if(i>0){marcarLida(post.dataset.pid);const kk=post.dataset.pid+i;if(!SLV.has(kk)){SLV.add(kk);uso("slide_"+(i+1))}}},120)},{passive:true});
    if(io)io.observe(t);
  });
}
addEventListener("resize",()=>document.querySelectorAll(".track").forEach(fitTrack));
function atualizarEmDia(){
  const el=$("#emdia");if(!el)return;
  if(FILTRO[0]==="_"){el.innerHTML="";return}
  const lista=listaFeed();const faltam=lista.filter(p=>!lidaAtual(p)).length;
  el.innerHTML=faltam?`<span>Faltam ${faltam} ${faltam===1?"notícia":"notícias"} para ficar em dia.</span><button type="button" class="btn ghost" data-cinco>Ler as principais em 5 minutos</button>`:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg><b>Você está em dia</b><span>Leu todas as notícias desta edição. Quando houver novidade, ela aparece aqui de novo.</span>${fimExtras()}`;
}
function renderChg(){
  const m=FEED.mudancas;const box=$("#chg");
  if(FILTRO!=="tudo"||!m||!(m.itens||[]).length){box.innerHTML="";return}
  box.innerHTML=`<div class="chg gut"><h4>${esc(m.titulo||"O que mudou")}</h4><ul>${m.itens.slice(0,8).map(i=>`<li><button type="button" data-goto="${esc(i.pid)}"><em class="${esc(i.tipo)}">${i.tipo==="nova"?"Nova":i.tipo==="atualizada"?"Atualizada":"Saiu"}</em><span>${esc(i.texto||pautaById(i.pid)?.neutro?.titulo||"")}</span></button></li>`).join("")}</ul></div>`;
}
function renderPosts(manter){
  AUTO=autoPesos();
  let lista=listaFeed();
  const novas=lista.filter(p=>NOVAS.has(p.id)&&!LIDAS.has(p.id)).length+lista.filter(p=>ATUALIZADAS.has(p.id)).length;
  let h="";
  if(FILTRO!=="tudo"){h+=`<div class="sech gut"><i style="background:${FILTRO[0]==="_"?"var(--bronze)":secCor(FILTRO)}"></i><h4>${esc(nomeFiltro(FILTRO))}</h4><button type="button" class="vertudo" data-filtro="tudo">Ver tudo ✕</button><span>${lista.length} ${lista.length===1?"notícia":"notícias"}${FILTRO==="politica"&&FEED.contagem?" · "+esc(FEED.contagem):""}</span></div>`;h+=secHub(FILTRO)}
  NOVID=lista.filter(p=>(NOVAS.has(p.id)&&!LIDAS.has(p.id))||ATUALIZADAS.has(p.id)).map(p=>p.id);
  if(novas)h+=`<button type="button" class="newbar gut" data-novidades><span class="nb-d"></span>${novas} ${novas===1?"novidade":"novidades"} desde a sua última visita${VISITA0&&hhmm(VISITA0)?` (${esc(diaHora(VISITA0))})`:""}<span class="chev" aria-hidden="true">›</span></button>`;
  if(FILTRO==="tudo"){const u=urgHTML("urg-f");if(u)h=`<div class="gut">${u}</div>`+h}h+=cobSegStrip();
  LOTE={lista,pos:Math.min(manter?Math.max(6,LOTE.pos||0):6,lista.length)};h=avisoAtraso()+h+lista.slice(0,LOTE.pos).map(postSeguro).join("")+(LOTE.pos<lista.length?`<div id="mais" class="empty" style="padding:24px">Carregando mais notícias…</div>`:"");
  $("#posts").innerHTML=lista.length?h:`${h}<div class="empty"><b>${FILTRO==="tudo"&&PREF.feedModo==="seguindo"?"Nada do que você segue nesta edição":FILTRO[0]==="_"?"Nada por aqui ainda":"Nenhuma notícia nesta seção agora"}</b>${FILTRO==="tudo"&&PREF.feedModo==="seguindo"?"Siga uma cobertura (botão Seguir) ou escolha o seu time em Esportes. Para ver tudo, mude a ordem no filtro.":FILTRO[0]==="_"?"Quando isso mudar, as notícias aparecem aqui.":""}<button type="button" class="btn ghost" data-filtro="tudo" style="margin-top:10px">Ver todas as notícias</button></div>`;
  lista.slice(0,LOTE.pos).forEach(p=>updateSocial(p.id));wireTracks($("#posts"));observarMais();
  renderChgBox();
  const br=FILTRO[0]==="_"?[]:(FEED.breves||[]).filter(b=>(FILTRO==="tudo"&&!(PREF.ocultas||[]).includes(b.secao||"politica"))||(b.secao||"politica")===FILTRO);
  const at=new Date(FEED.atualizado_em);
  $("#extra").innerHTML=`<div class="done gut" id="emdia"></div>${br.length?`<div class="sec gut"><h4>Outras notícias</h4><ul class="brv">${(window.BREVES=br,br).map((b,bi)=>`<li><button type="button" class="brv-b" data-breve="${bi}">${b.urgente&&tms(b.hora)&&Date.now()-tms(b.hora)<3*3600e3?`<em class="ug">Urgente</em>`:""}${esc(b.titulo)}</button><span>${esc(secNome(b.secao||"politica"))} · ${esc(nomeFonte(b.fonte))}</span></li>`).join("")}</ul></div>`:""}
  <div class="foot gut"><p><b>Atualizado ${isNaN(at)?"":esc(diaHora(FEED.atualizado_em))}.</b> A edição completa sai às 6h52 e é atualizada às 10h48, 13h48, 17h48 e 21h48; manchetes e indicadores são conferidos de hora em hora.</p><p>Os resumos são escritos pelo Prumo a partir das matérias, sem copiar texto. As versões de direita e de esquerda são escritas pelo Prumo com os mesmos fatos. As fotos vêm de acervos de uso livre, sempre com crédito (Agência Brasil, Senado, Câmara e Wikimedia Commons); quando não há foto, o Prumo usa um desenho.</p></div>`;
  atualizarEmDia();
}
function renderFeed(){
  if(!FEED)return;
  $("#ed").textContent=[FEED.edicao,FEED.contagem].filter(Boolean).join(" · ");
  if(FILTRO!=="tudo"&&FILTRO[0]!=="_"&&!SECS().some(s=>s.id===FILTRO&&pautasDa(s.id).length))FILTRO="tudo";if(FILTRO[0]==="_"&&!temAmigos()&&(S.amigosOk||(SESS_UID!==undefined&&!S.membro)))FILTRO="tudo";
  renderSecs();renderPosts();if(VIEW==="capa")renderCapa();if(VIEW==="busca"&&!($("#bvq")?.value||"").trim())renderBuscaView();
}

