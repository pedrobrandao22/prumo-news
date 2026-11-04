/* ---------- 117: ajustes da Capa e do Relato (03/11) ----------
   1. Aviso de atraso da Capa: não pisca mais na abertura. A correção está na origem (024, 027 e 028): o aviso só é desenhado depois que a
      edição da rede e o rodadas.json chegaram (AVISO_FEED_OK / AVISO_ROD_OK), e entra uma vez só, se o atraso for de verdade (avisoAtrasoDepois).
   2. Relato no cartão A (Jornal): primeiro quem postou (bolinha com a foto ou a inicial e o nome; à direita ou embaixo, quando e onde),
      depois o que a pessoa contou (título e texto), depois a foto ou o carrossel de fotos com os pontinhos. O Contexto do Prumo fica depois
      da mídia e antes das ações, como já estava. Vale no Feed, no perfil e na publicação aberta numa camada (todos usam pubPostHTML).
      Os outros posts de amigo (opinião, análise, foto comum) continuam como nota assinada (o texto primeiro). */
var AC117_REL=true;  /* chave só para as capturas de "antes" nos testes */
const AC117_PIN='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';
function ac117Rel(h,x){if(!AC117_REL||typeof h!=="string"||!h||!x||x.tipo!=="post"||VN112_CT!=="a")return h;
  const cn=typeof cn102De==="function"?cn102De(x):null;if(!cn||cn.k!=="rel")return h;
  const a=vn112Tp(h);if(!a||!a.classList.contains("cn102-rel")||a.classList.contains("vn-rp"))return h;
  const ph=a.querySelector(":scope>.ph"),nm=ph&&ph.querySelector(".ph-nm");if(!ph||!nm)return h;
  a.classList.add("ac117-rel");const es=x.estilo||{};
  /* cabeçalho: nome; ao lado (ou embaixo, se não couber) quando e onde */
  const sub=nm.querySelector(".ph-sub"),lb=sub&&sub.querySelector(".cn102-lb");
  const ed=!!x.editado||!!(sub&&/·\s*editado\s*$/.test(sub.textContent));
  const qd=cn.q?cn102Quando(cn.q):(typeof quando==="function"?quando(x.at):"");
  const meta=document.createElement("span");meta.className="ph-sub ac117-meta";
  meta.innerHTML=`${qd?`<span class="ac117-qd"${cn.q&&typeof quando==="function"?` title="Publicado ${esc(quando(x.at))}"`:""}>${esc(qd)}</span>`:""}${es.local?`<span class="ac117-loc">${AC117_PIN}<span>${esc(es.local)}</span></span>`:""}${ed?`<span class="ac117-ed">editado</span>`:""}`;
  if(sub)sub.replaceWith(meta);else nm.appendChild(meta);
  /* o texto: selo "De perto", título, o que a pessoa contou e a fonte */
  const car=a.querySelector(":scope>.car"),cd=car&&car.querySelector(".cn102-cd");
  let corpo=a.querySelector(":scope>.vn-txt")||a.querySelector(":scope>.up-leg")||a.querySelector(":scope>.gut>.up-leg");
  const ex=cd&&cd.querySelector(".cn102-ex");
  if(!corpo&&ex){corpo=ex;corpo.classList.add("up-leg")}
  const tx=document.createElement("div");tx.className="ac117-tx";
  tx.innerHTML=`${lb?lb.outerHTML:`<span class="cn102-lb cn102-lb-rel">De perto</span>`}<h3 class="ac117-tit">${esc(cn.tit||"De perto")}</h3>`;
  if(corpo){corpo.classList.remove("vn-txt","cn102-ex");corpo.classList.add("ac117-corpo");tx.appendChild(corpo)}
  /* (a linha "Relato pessoal, não checado pela redação do Prumo" saiu em 122, decisão do Pedro) */
  a.querySelectorAll(".cn102-fonte").forEach(f=>tx.appendChild(f));
  a.querySelectorAll(":scope>.gut>.cn102-lt,:scope>.gut>.cn102-lm").forEach(e=>e.remove());
  /* sem foto: o cartão colorido sai (o texto já está em cima); com foto: a mídia vem depois do texto */
  if(car&&cd&&!car.querySelector(".up-img,.up-sem")){car.remove();a.classList.add("ac117-sf")}
  const gh=a.querySelector(":scope>.fc107-gh");if(gh)gh.after(ph);else a.prepend(ph);
  ph.after(tx);const m=a.querySelector(":scope>.car");if(m)tx.after(m);
  return a.outerHTML}
if(VISUAL_NOVO&&VN112_CT==="a"){document.documentElement.classList.add("ac117");
  const _pp117=pubPostHTML;pubPostHTML=function(x){const h=_pp117.apply(this,arguments);try{return ac117Rel(h,x)}catch(e){return h}}}
