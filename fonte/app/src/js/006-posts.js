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

function postHTML(p){
  const sec=secOf(p),ss=slidesSociais(p),nv=NOVAS.has(p.id)&&!LIDAS.has(p.id),at=ATUALIZADAS.has(p.id);
  return `<article class="post" id="p-${esc(p.id)}" data-pid="${esc(p.id)}">
    <div class="ph gut"><div class="ph-t"><button type="button" class="ph-sec" data-secfiltro="${esc(sec)}"><span class="ph-av${nv||at?" ph-av-novo":""}" style="--c:${secCor(sec)}"><i>${esc(secNome(sec).slice(0,1))}</i></span><span class="ph-nm"><b>${esc(secNome(sec))}</b><span class="ph-sub">${esc(p.tema||(/^Outros/.test(p.subtema||"")?(p.tag||""):(p.subtema||"")))}${seguido(p)?" · seguindo":""}</span></span></button><em class="lida-t"${lidaAtual(p)?"":" hidden"}>✓ lida</em><span data-otr></span></div>${cobStatus(p)}${nv?`<span class="badge-new">Novo</span>`:at?`<span class="badge-new upd2">Atualizado</span>`:""}<button type="button" class="more-btn" data-a="menu" aria-label="Mais opções">${ICON.dots}</button></div>
    <div class="car"><div class="track">${ss.join("")}</div></div>
    <div class="gut">
      <div class="acts"><button type="button" class="act" data-a="like" aria-label="Curtir">${ICON.like}<span>Curtir</span><em class="cnt" data-n="like"></em></button><button type="button" class="act" data-a="cmt" aria-label="Comentar">${ICON.cmt}<span>Comentar</span><em class="cnt" data-n="cmt"></em></button><button type="button" class="act" data-a="send" aria-label="Enviar">${ICON.send}<span>Enviar</span></button><span class="sp"></span>${ss.length>1?`<div class="prog pdots" aria-hidden="true">${ss.map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${ss.length}</span></div>`:""}<button type="button" class="act" data-a="save" aria-label="Guardar">${ICON.save}</button></div>
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
function atividadeAmigos(pid){const {likes,cm}=socialOf(pid);return amigosL().map(u=>({u,ac:[likes.includes(u)?"curtiu":"",cm.some(c=>c.uid===u)?"comentou":""].filter(Boolean)})).filter(x=>x.ac.length)}
const CPEND={};
function montarCmts(docs){const by={};docs.forEach(([uid,dd])=>Object.entries((dd&&dd.itens)||{}).forEach(([cid,c])=>{const k=uid+"\u0001"+cid,p=CPEND[k];if(p){if(Date.now()-p.t>30000||(p.v?!!c:!c))delete CPEND[k]}if(c&&c.texto&&!(p&&p.v===null))(by[c.pid]=by[c.pid]||[]).push({...c,id:cid,uid})}));
  Object.entries(CPEND).forEach(([k,p])=>{if(Date.now()-p.t>90000){delete CPEND[k];return}if(!p.v)return;const [uid,cid]=k.split("\u0001");const l=(by[p.v.pid]=by[p.v.pid]||[]);if(!l.some(c=>c.id===cid))l.push({...p.v,id:cid,uid})});return by}

var FIT_IO=("IntersectionObserver" in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)fitTrack(e.target)}),{rootMargin:"900px 0px"}):null;
/* cartão de notícia do visual novo (112, .vn-cn): mídia mais baixa; a altura já sai certa aqui para as páginas de texto (052) serem cortadas nela */

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
  /* 20/11 (testador): depois de rolar o Feed inteiro, "Faltam 24 notícias para ficar em dia" soava como cobrança sem caminho */
  el.innerHTML=faltam?`<span>Você chegou ao fim do Feed. ${faltam===1?"Uma notícia você ainda não abriu":faltam+" notícias você ainda não abriu"}: o resumo de cada uma está nos cartões acima.</span><button type="button" class="btn ghost" data-cinco>Ler as principais em 5 minutos</button>`:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg><b>Você está em dia</b><span>Leu todas as notícias desta edição. Quando houver novidade, ela aparece aqui de novo.</span>${fimExtras()}`;
}
function renderChg(){
  const m=FEED.mudancas;const box=$("#chg");
  if(FILTRO!=="tudo"||!m||!(m.itens||[]).length){box.innerHTML="";return}
  box.innerHTML=`<div class="chg gut"><h4>${esc(m.titulo||"O que mudou")}</h4><ul>${m.itens.slice(0,8).map(i=>`<li><button type="button" data-goto="${esc(i.pid)}"><em class="${esc(i.tipo)}">${i.tipo==="nova"?"Nova":i.tipo==="atualizada"?"Atualizada":"Saiu"}</em><span>${esc(i.texto||pautaById(i.pid)?.neutro?.titulo||"")}</span></button></li>`).join("")}</ul></div>`;
}

function renderFeed(){
  if(!FEED)return;
  $("#ed").textContent=[FEED.edicao,FEED.contagem].filter(Boolean).join(" · ");
  if(FILTRO!=="tudo"&&FILTRO[0]!=="_"&&!SECS().some(s=>s.id===FILTRO&&pautasDa(s.id).length))FILTRO="tudo";if(FILTRO[0]==="_"&&!temAmigos()&&(S.amigosOk||(SESS_UID!==undefined&&!S.membro)))FILTRO="tudo";
  renderSecs();renderPosts();if(VIEW==="capa")renderCapa();if(VIEW==="busca"&&!($("#bvq")?.value||"").trim())renderBuscaView();
}

