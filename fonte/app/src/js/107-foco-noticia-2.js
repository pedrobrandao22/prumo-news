/* ---------- 107: foco em notícia, 2º passe (Feed, Capa, Perfil, Atividade, stories e acabamentos) ----------
   O Feed lê como "a notícia + o que meus amigos acham dela": os comentários dos amigos sobre uma notícia aparecem logo abaixo dela,
   compactos (sem repetir a arte), e onde não estão ao lado (filtros, Capa) há uma linha discreta "Bia e Carla comentaram" que abre
   o que eles escreveram. A barra de publicar sugere a manchete do dia. Análises e relatos ficam do tamanho do texto.
   Perfil: as contribuições por tipo (notícias comentadas, relatos, análises, perguntas) filtram a grade. Atividade: o que é sobre
   a mesma notícia fica junto, e os comentários dos amigos sobre as notícias entram. Stories: notícias primeiro, depois os amigos.
   Arte das notícias no Feed sem corte (proporção natural), "Análise de" no post e no story, prévia do cartão de texto visível.
   Tudo só no estado de produção (FOCO_LIGADO); nos testes automáticos sem "prumo-teste-foco", nada muda. */

/* ===== 1. comentários dos amigos sobre uma notícia ===== */
const fc107Curto=(s,n)=>{s=String(s||"").trim();return s.length>n?s.slice(0,n-1).replace(/\s+\S*$/,"")+"…":s};
const fc107Prim=u=>String(nomeDe(u)||"").split(" ")[0];
/* "comentar notícia" (ou um post antigo com a notícia anexada); pergunta, relato e análise têm cartão próprio */
function fc107EhTake(x){if(!x||x.tipo!=="post"||!x.pid||String(x.pid).indexOf("u:")===0)return false;const cn=cn102De(x);return cn?cn.k==="nt":true}
function fc107Takes(pid,dias){if(!pid||!PUB||!PUB.on||typeof pubVisiveis!=="function")return [];const ag=Date.now(),lim=(dias||30)*864e5;
  return pubVisiveis().filter(x=>x.pid===pid&&ag-x.at<lim&&fc107EhTake(x)).sort((a,b)=>b.at-a.at)}
function fc107Amigos(pid){return fc107Takes(pid,7).filter(x=>x.autor!==S.uid)}
function fc107Quem(us){const n=us.map(fc107Prim);return n.length===1?n[0]:n.length===2?n[0]+" e "+n[1]:n[0]+", "+n[1]+" e mais "+(n.length-2)}
/* linha discreta: avatares + "Bia e Carla comentaram" */
function fc107Linha(pid,cls){const l=fc107Amigos(pid);if(!l.length)return "";const us=[...new Set(l.map(x=>x.autor))];
  return `<button type="button" class="fc107-amg${cls?" "+cls:""}" data-fc107amg="${esc(pid)}"><span class="fc107-avs" aria-hidden="true">${us.slice(0,3).map(u=>avatar(u)).join("")}</span><span class="fc107-amt">${esc(fc107Quem(us))} ${us.length>1?"comentaram":"comentou"}</span><i aria-hidden="true">›</i></button>`}
/* folha "O que seus amigos acham" */
function fc107Abre(pid){const p=pautaById(pid),l=fc107Takes(pid,30);if(!p||!l.length)return;
  const it=l.map(x=>{const cn=cn102De(x),tx=cn?cn102Corpo(x,cn):String(x.texto||"");return `<li><div class="fc107-tq">${avatar(x.autor)}<span><b>${x.autor===S.uid?"Você":esc(nomeDe(x.autor))}</b><i>${esc(quando(x.at))}</i></span></div>${tx.trim()?`<p>${dmMarcaPub(fc107Curto(tx,600))}</p>`:""}<button type="button" class="fc107-ir" data-fc107ir="${esc(x.id)}">Ver no Feed ›</button></li>`}).join("");
  sheet("O que seus amigos acham",`<button type="button" class="fc107-sn" data-fc107mat="${esc(pid)}"><small style="color:${secCor(secOf(p))}">${esc(secNome(secOf(p)))}</small><b>${esc(versao(p,lente()).titulo)}</b></button><ul class="fc107-tl">${it}</ul>`,
    S.membro&&PUB.on!==false?`<button type="button" class="btn" data-fc107com="${esc(pid)}">Comentar esta notícia</button>`:"")}

/* ===== 2. Feed: o comentário vem logo depois da notícia ===== */
function fc107Agrupa(){return typeof FILTRO!=="undefined"&&FILTRO==="tudo"&&!!(PUB&&PUB.on)}
function fc107Mistura(out,lista){if(out===lista||!Array.isArray(out))return out;const ids=new Set(out.filter(p=>p&&!p.__pub).map(p=>p.id));
  const tk=out.filter(p=>p&&p.__pub&&ids.has(p.__pub.pid)&&fc107EhTake(p.__pub));if(!tk.length)return out;const fora=new Set(tk),r=out.filter(p=>!fora.has(p)),por={};
  tk.forEach(p=>{(por[p.__pub.pid]=por[p.__pub.pid]||[]).push(p)});
  Object.keys(por).forEach(pid=>{const i=r.findIndex(p=>!p.__pub&&p.id===pid);if(i<0)return;const g=por[pid].sort((a,b)=>b.__pub.at-a.__pub.at);
    r.splice(i+1,0,...g.map((p,k)=>({id:p.id,__pub:p.__pub,__fc107:{k,n:g.length}})))});return r}
/* post de comentário logo abaixo da notícia: compacto, sem repetir a arte da notícia */
function fc107Junto(h,p){const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)return h;const x=p.__pub;
  a.classList.add("fc107-junto");if(p.__fc107.k===0)a.classList.add("fc107-j1");if(p.__fc107.k===p.__fc107.n-1)a.classList.add("fc107-jl");
  if(!(x.fotos||[]).length){a.classList.add("fc107-semcar");const sub=a.querySelector(".ph-sub");if(sub&&!sub.querySelector(".fc107-c"))sub.insertAdjacentHTML("afterbegin",`<span class="fc107-c">comentou · </span>`);
    const leg=a.querySelector(".up-leg"),g=leg&&leg.parentElement,ac=g&&g.querySelector(":scope>.acts");if(leg&&ac){const nb=leg.querySelector(":scope>b:first-child");if(nb){const t=nb.nextSibling;nb.remove();if(t&&t.nodeType===3)t.textContent=t.textContent.replace(/^\s+/,"")}g.insertBefore(leg,ac)}}
  if(p.__fc107.k===0)a.insertAdjacentHTML("afterbegin",`<p class="fc107-gh">${p.__fc107.n>1?"O que seus amigos acham":x.autor===S.uid?"Seu comentário":"O que ${esc(fc107Prim(x.autor))} acha"}</p>`);
  return a.outerHTML}
function fc107NoPost(h,pid){if(fc107Agrupa()&&!/^_/.test(FILTRO))return h;const ln=fc107Linha(pid);if(!ln)return h;
  const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)return h;const ref=a.querySelector(".cmt-area")||a.querySelector("[data-likes]");if(!ref)return h;
  ref.insertAdjacentHTML("beforebegin",ln.replace('class="fc107-amg','class="fc107-amg fc107-fd'));return a.outerHTML}

/* ===== 3. barra de publicar: sugere a manchete (ou o próximo destaque que a pessoa ainda não comentou) ===== */
function fc107Sugestao(){try{if(!FEED)return null;const {man,dest}=capaEscolha();const meus=new Set(pubVisiveis().filter(x=>x.autor===S.uid&&x.pid).map(x=>x.pid));
  return [man,...(dest||[])].filter(Boolean).find(p=>!meus.has(p.id))||null}catch(e){return null}}
function fc107Barra(){const b=$("#cn102-bar");if(!b||b.hidden)return;const p=fc107Sugestao(),k=p?p.id+"|"+lente():"";if(b.dataset.fc107===k&&(!p||b.querySelector(".fc107-barb")))return;b.dataset.fc107=k;
  const av=b.querySelector(".av")?b.querySelector(".av").outerHTML:avatar(S.uid);
  if(!p){b.innerHTML=`${av}<button type="button" class="cn102-barb" data-cn102bar>Comente uma notícia ou conte o que viu…</button>`;return}
  b.innerHTML=`${av}<button type="button" class="cn102-barb fc107-barb" data-fc107sug="${esc(p.id)}"><small>O que você acha?</small><b>${esc(versao(p,lente()).titulo)}</b></button><button type="button" class="fc107-bmais" data-cn102bar aria-label="Publicar outra coisa: notícia, relato, análise ou pergunta">${CN102_SVG(CN102_ICO.mais)}</button>`}

/* ===== 4. Capa: linha discreta na manchete e nos destaques (só se houver comentários de amigos) ===== */
function fc107Capa(){try{const v=$("#v-capa");if(!v)return;v.querySelectorAll(".cpi-man,.cp-dest .cpi").forEach(a=>{const pid=String(a.id||"").replace(/^cpi-/,"");const h=S.membro?fc107Linha(pid,"fc107-cpa"):"";const o=a.querySelector(":scope>.fc107-cpa");
  if(!h){o&&o.remove();return}if(o&&o.outerHTML===h)return;if(o)o.outerHTML=h;else{const b=a.querySelector(":scope>.cpi-b");if(b)b.insertAdjacentHTML("afterend",h)}})}catch(e){}}

/* ===== 5. Perfil: contribuições por tipo, que filtram a grade ===== */
const FC107_PK=[["nt","Notícias comentadas"],["rel","Relatos"],["ana","Análises"],["enq","Perguntas"]];
var FC107_PF={u:null,k:""},FC107_PL=null;
function fc107Tipo(x){const cn=cn102De(x);if(cn)return cn.k;return fc107EhTake(x)?"nt":"outro"}
function fc107PfChips(u){if(!FC107_PL)return "";const l=FC107_PL(u,"posts");if(!l.length)return "";const c={};l.forEach(x=>{const k=fc107Tipo(x);c[k]=(c[k]||0)+1});
  const ks=FC107_PK.filter(([k])=>c[k]);if(!ks.length||(ks.length===1&&!c.outro))return "";const at=FC107_PF.u===u?FC107_PF.k:"";
  return `<div class="fc107-pk" role="group" aria-label="Contribuições"><button type="button" data-fc107pk="" aria-pressed="${!at}">Tudo <b>${l.length}</b></button>${ks.map(([k,n])=>`<button type="button" data-fc107pk="${k}" aria-pressed="${at===k}">${n} <b>${c[k]}</b></button>`).join("")}</div>`}
/* miniatura de análise, relato e pergunta sem foto: tipo + título, no papel da edição (antes: o texto cru sobre um fundo) */
function fc107PfTile(x){const cn=cn102De(x);if(!cn||cn.k==="nt"||(x.fotos||[]).length)return "";const t=cn.tit||cn102Corpo(x,cn);
  return `<span class="pf-tx fc107-pt fc107-pt-${cn.k}"><small>${esc({rel:"Relato",ana:"Análise",enq:"Pergunta"}[cn.k])}</small><b>${esc(fc107Curto(t,90))}</b></span>`}

/* ===== 6. Atividade: o que é da mesma notícia fica junto ===== */
function fc107AtPid(x){if(!x)return "";if(x.acao==="fc107"||x.acao==="debate"||x.acao==="cob")return x.pid||"";if(x.pub){const pb=pubDe(x.pub)||AT.pubs[x.pub];if(pb&&pb.pid&&pautaById(pb.pid))return pb.pid}return ""}
function fc107AtAgrupa(it){const v=AT._visto0||0,ord=[],grupos=new Map();
  it.forEach(x=>{const pid=fc107AtPid(x);if(!pid||x.fixo){ord.push([x]);return}const k=pid+"|"+(x.at>v?1:0);let g=grupos.get(k);if(!g){g=[];grupos.set(k,g);ord.push(g)}g.push(x)});
  const out=[];ord.forEach(g=>{if(g.length>1)g.forEach((x,i)=>{x.fc107g={pid:fc107AtPid(x),i,n:g.length};if(typeof x.txt==="string")x.txt=x.txt.replace(/ sobre “[^”]*”/," sobre esta notícia").replace(/ (a|na) notícia “[^”]*”/," $1 notícia")});else delete g[0].fc107g;out.push(...g)});return out}

/* ===== 7. cartão de texto do story: a prévia aparece inteira acima da folha ===== */
function fc107CsEncaixa(){const cv=$("#layer #ce-cv");if(!cv)return;const p=$("#layer .fc105-cs .ce-selp");cv.style.transform="";cv.style.transformOrigin="";cv.classList.remove("fc107-mini");if(!p)return;
  const r=cv.getBoundingClientRect(),topo=Math.max(8,(($("#layer .ce-top")||{}).getBoundingClientRect?.()?.bottom||48)+6),ov=p.closest(".ce-sel")||p,orr=ov.getBoundingClientRect(),fim=orr.bottom-(parseFloat(getComputedStyle(ov).paddingBottom)||0)-p.offsetHeight,alto=fim-topo-10,k=Math.min(1,alto/r.height);
  if(k<.2||!r.height)return;cv.style.transformOrigin="50% 0";cv.style.transform=`translateY(${Math.round(topo-r.top)}px) scale(${k.toFixed(3)})`;cv.classList.add("fc107-mini")}

/* ===== 8. stories: notícias primeiro, depois os amigos; selo discreto em quem publicou notícia ou cartão ===== */
function fc107StNoticia(x){const es=x&&x.estilo||{};return !!(x.pid||(es.itens||[]).some(e=>e&&e.t==="nt")||/^(Opinião|Análise|Relato) de |^Citação:/.test(String(x.texto||"")))}
function fc107Tray(){const box=$("#secs");if(!box)return;const us=[...box.querySelectorAll(":scope>[data-ustory]")];if(!us.length)return;
  const ref=box.querySelector(":scope>[data-ultimas]")||box.querySelector(":scope>[data-5min]");if(ref&&ref.compareDocumentPosition(us[0])&Node.DOCUMENT_POSITION_PRECEDING){let a=ref;us.forEach(b=>{a.after(b);a=b})}
  us.forEach(b=>{const u=b.dataset.ustory,tem=pubStoriesDe(u).some(fc107StNoticia),r=b.querySelector(".ig-r");if(!r)return;const s=r.querySelector(".fc107-stn");
    if(tem&&!s)r.insertAdjacentHTML("beforeend",`<i class="fc107-stn" aria-hidden="true">${CN102_SVG(CN102_ICO.nt)}</i>`);else if(!tem&&s)s.remove();
    if(tem&&!/notícia/.test(b.getAttribute("aria-label")||""))b.setAttribute("aria-label",(b.getAttribute("aria-label")||"")+", com notícia ou análise")})}

/* ===== 9. instala ===== */
if(FOCO_LIGADO){
  document.documentElement.classList.add("foco2");
  /* Feed */
  {const _pm107=pubMistura;pubMistura=function(lista){const out=_pm107.apply(this,arguments);try{return fc107Mistura(out,lista)}catch(e){return out}}}
  {const _ps107=postSeguro;postSeguro=function(p){const h=_ps107.apply(this,arguments);try{if(typeof h!=="string"||!h||!p)return h;if(p.__fc107)return fc107Junto(h,p);if(!p.__pub)return fc107NoPost(h,p.id)}catch(e){}return h}}
  /* post de membro: "Análise de" (como no cartão do story); análise e relato sem foto ficam do tamanho do texto */
  {const _ck107=cn102Kick;cn102Kick=function(k,au){return k==="ana"?`Análise de ${esc(nomeDe(au))}`:_ck107.apply(this,arguments)}}
  {const _pp107=pubPostHTML;pubPostHTML=function(x){let h=_pp107.apply(this,arguments);try{if(typeof h!=="string"||!h||!x||x.tipo!=="post")return h;
      h=h.replace('cn102-lb-ana">Opinião<','cn102-lb-ana">Análise<');const cn=cn102De(x);
      if(cn&&["ana","rel","enq"].includes(cn.k)){const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild,tr=a&&a.querySelector(".car .track");
        if(tr&&tr.children.length===1&&tr.firstElementChild.classList.contains("cn102-sl")){a.classList.add("fc107-auto");h=a.outerHTML}}}catch(e){}return h}}
  /* barra de publicar */
  {const _cb107=cn102Barra;cn102Barra=function(){const r=_cb107.apply(this,arguments);try{fc107Barra()}catch(e){}return r}}
  /* Capa */
  {const _rc107=renderCapa;renderCapa=function(){const r=_rc107.apply(this,arguments);fc107Capa();return r}}
  {const _pc107=pubCarregar;pubCarregar=async function(){const r=await _pc107.apply(this,arguments);try{fc107Capa();fc107Barra()}catch(e){}return r}}
  /* Perfil */
  {FC107_PL=pfLista;const _pl107=pfLista;pfLista=function(u,aba){const l=_pl107.apply(this,arguments);if(aba!=="posts"||FC107_PF.u!==u||!FC107_PF.k)return l;const f=l.filter(x=>fc107Tipo(x)===FC107_PF.k);return f.length?f:l}}
  {const _pt107=pfTiles;pfTiles=function(l,aba,u){let h=_pt107.apply(this,arguments);try{if(aba!=="posts"||typeof h!=="string"||!(l||[]).length)return h;
      const tp=document.createElement("template");tp.innerHTML=h;tp.content.querySelectorAll("[data-pfi]").forEach(b=>{const x=l[+b.dataset.pfi],t=x&&fc107PfTile(x),o=b.querySelector(".pf-tx");if(t&&o)o.outerHTML=t});
      h=fc107PfChips(u)+tp.innerHTML}catch(e){}return h}}
  {const _ap107=abrirPerfil;abrirPerfil=function(){FC107_PF={u:null,k:""};return _ap107.apply(this,arguments)}}
  /* fileira de destaques vazia ("+ Novo") no próprio perfil: some até existir um destaque (dá para destacar pelo story) */
  {const _dr107=destRowHTML;destRowHTML=function(u){const h=_dr107.apply(this,arguments);try{if(u===S.uid&&!(DEST[u]||[]).length)return ""}catch(e){}return h}}
  /* Atividade */
  {const _apn107=atPubNome;atPubNome=function(x){const n=_apn107.apply(this,arguments);try{if(!x||x.tipo!=="post")return n;const cn=cn102De(x),full=pubDe(x.id)||x,k=cn?cn.k:fc107EhTake(full)?"nt":"";
      if(k==="nt"){const p=pautaById(full.pid);return p?`seu comentário sobre “${esc(fc107Curto(versao(p,lente()).titulo,70))}”`:"seu comentário sobre uma notícia"}
      if(k==="ana"||k==="rel"||k==="enq"){const nm={ana:"sua análise",rel:"seu relato",enq:"sua pergunta"}[k];return cn.tit?`${nm} “${esc(fc107Curto(cn.tit,60))}”`:nm}}catch(e){}return n}}
  {const _ai107=atItens;atItens=function(){let it=_ai107.apply(this,arguments);try{if(!S.uid||!S.membro||!Array.isArray(it))return it;const ag=Date.now(),g={};
      pubVisiveis().forEach(x=>{if(x.autor===S.uid||ag-x.at>3*864e5||!fc107EhTake(x)||!pautaById(x.pid))return;(g[x.pid]=g[x.pid]||[]).push(x)});
      Object.entries(g).forEach(([pid,l])=>{l.sort((a,b)=>b.at-a.at);const us=[...new Set(l.map(x=>x.autor))],p=pautaById(pid);
        it.push({k:"fc107:"+pid,at:l[0].at,us,ic:"💬",txt:`<b>${esc(atJunta(us))}</b> ${us.length>1?"comentaram":"comentou"} a notícia “${esc(fc107Curto(versao(p,lente()).titulo,80))}”`,pid,acao:"fc107"})});
      it=it.sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80);return fc107AtAgrupa(it)}catch(e){}return it}}
  {const _al107=atLiHTML;atLiHTML=function(x,i){let h=_al107.apply(this,arguments);try{const g=x&&x.fc107g;if(!g)return h;h=h.replace(/^<li>/,`<li class="fc107-atg${g.i===g.n-1?" fc107-atgl":""}">`);
      if(g.i===0){const p=pautaById(g.pid);if(p)h=`<li class="fc107-ath"><button type="button" data-fc107mat="${esc(g.pid)}"><small style="color:${secCor(secOf(p))}">${esc(secNome(secOf(p)))}</small><b>${esc(versao(p,lente()).titulo)}</b></button></li>`+h}}catch(e){}return h}}
  {const _at107=atThumb;atThumb=function(x){if(x&&(x.acao==="fc107"||x.pub)){const pb=x.pub&&(pubDe(x.pub)||AT.pubs[x.pub]),p=pautaById(x.acao==="fc107"?x.pid:pb&&!(pb.fotos||[]).length&&fc107EhTake(pb)?pb.pid:"");if(p)try{return `<span class="at-th fc107-atn">${capaArte(p,"fc107-ata")}</span>`}catch(e){}}return _at107.apply(this,arguments)}}
  {const _aa107=atAcao;atAcao=function(x){if(x&&x.acao==="fc107"){const pid=x.pid;if($("#layer .pfv-at"))closeLayer();setTimeout(()=>fc107Abre(pid),320);return}return _aa107.apply(this,arguments)}}
  {const _ad107=atDesenha;atDesenha=function(){const r=_ad107.apply(this,arguments);try{const v=$("#layer .pfv-at .pf-vz span");if(v)v.textContent="Aqui aparecem os comentários dos seus amigos sobre as notícias, as reações ao que você publica, os pedidos de amizade e as novidades das coberturas que você segue."}catch(e){}return r}}
  /* stories */
  {const _rs107=renderSecs;renderSecs=function(){const r=_rs107.apply(this,arguments);try{fc107Tray()}catch(e){}return r}}
  /* cartão de texto */
  {const _ca107=fc105CsAbre;fc105CsAbre=function(){const r=_ca107.apply(this,arguments);requestAnimationFrame(fc107CsEncaixa);return r}}
  {const _cr107=fc105CsRefaz;fc105CsRefaz=function(){const r=_cr107.apply(this,arguments);requestAnimationFrame(fc107CsEncaixa);return r}}
  {const _cs107=fc105CsSai;fc105CsSai=function(){const r=_cs107.apply(this,arguments);fc107CsEncaixa();return r}}
  window.addEventListener("resize",()=>{if($("#layer .fc105-cs"))requestAnimationFrame(fc107CsEncaixa)});
  try{window.visualViewport&&visualViewport.addEventListener("resize",()=>{if($("#layer .fc105-cs"))setTimeout(fc107CsEncaixa,60)})}catch(e){}
}

/* ===== 10. cliques ===== */
window.addEventListener("click",e=>{if(!FOCO_LIGADO)return;const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  if(b=t.closest("[data-fc107amg]")){pare();fc107Abre(b.dataset.fc107amg);return}
  if(b=t.closest("[data-fc107ir]")){pare();const id=b.dataset.fc107ir;closeLayer();setTimeout(()=>pubIrPara(id),60);return}
  if(b=t.closest("[data-fc107mat]")){pare();const pid=b.dataset.fc107mat;if($("#layer").innerHTML)closeLayer();setTimeout(()=>abrirMateria(pid),60);return}
  if(b=t.closest("[data-fc107com]")){pare();const pid=b.dataset.fc107com;closeLayer();setTimeout(()=>cn102Comeca("nt",{pid}),60);return}
  if(b=t.closest("[data-fc107sug]")){pare();if(typeof PQ!=="undefined"&&PQ.atual){toast("Espere terminar de publicar.");return}uso("barra_sugestao");cn102Comeca("nt",{pid:b.dataset.fc107sug});return}
  if(b=t.closest("[data-fc107pk]")){pare();const k=b.dataset.fc107pk,naCamada=!!t.closest("#layer .pfv"),u=naCamada?PFV&&PFV.u:S.uid;if(!u)return;FC107_PF={u,k};if(naCamada)pfvDesenha();else renderMe();return}},true);
