/* ---------- 205 · Perfil (Fase 3): as funções do Perfil, cada uma numa versão só ----------
   Antes eram definidas no 083 (grade de perfil) e no 084 (destaques) e remendadas em 084, 099, 104-correcoes-feed, 105,
   107, 109, 112, 113, 114, 122, 123, 126, 136, 152, 158, 160, 161, 165, 172, 181 e 182 (nesta ordem de carga: o 182
   carrega antes do 181). Cada função abaixo faz o que a cadeia inteira fazia, na mesma ordem; os comentários dizem de
   onde veio cada passo. Os auxiliares dos outros arquivos (vp99*, fc107*, vn112*, cs123*, sg181*, gd161*, pb136*, …)
   continuam onde estavam: aqui eles só são chamados, sempre depois da carga (nenhuma destas funções roda na carga).
   Também aqui: vn112Resp, vn112Midia, vn112PfAba e vn112Pf (definidas no 112, remendadas no 114 e no 165) e
   cs123Linha (definida no 123, remendada no 181).
   Regra daqui para a frente: corrigir DENTRO destas funções, não embrulhá-las de novo em outro arquivo. */

/* ===== pfLista: as publicações de uma aba do perfil =====
   Base no 083; remendos (de dentro para fora): 084 (fixadas primeiro), 099 (Salvos), 107 (filtro por tipo),
   122 (some o que a pessoa escondeu), 181 (só seguir: posts de quem você vê, não só de quem segue). */
function pf205Lista(u,aba){const vs=pubVisiveis().filter(x=>x.tipo==="post");let l;
  if(aba==="marc")l=vs.filter(x=>x.autor!==u&&((x.estilo&&(x.estilo.tags||[]).some(t=>t.u===u))||(x.estilo&&(x.estilo.marcados||[]).includes(u))));
  else l=vs.filter(x=>x.autor===u&&(aba!=="reels"||(x.estilo&&x.estilo.reel)));return l.sort((a,b)=>b.at-a.at)}
/* 084 + 099: é a lista que o 107 guarda em FC107_PL (as contagens por tipo do perfil) */
function pf205ListaAte99(u,aba){if(aba==="salvos")return vp99ListaSalvos();const l=pf205Lista(u,aba);if(aba!=="posts")return l;
  return l.slice().sort((a,b)=>(+!!b.fixado-+!!a.fixado)||(b.fixado&&a.fixado?b.fixado-a.fixado:0)||(b.at-a.at))}
function pfLista(u,aba){
  /* 181: com o só seguir ligado, pubVisiveis entrega os posts de quem você vê (SG181.todos) enquanto a lista é montada */
  const sg=SG181.on===true&&aba!=="salvos";if(sg)SG181.todos=true;
  try{let l=pf205ListaAte99(u,aba);
    /* 107: filtro por tipo escolhido nas fichas do perfil */
    if(!(aba!=="posts"||FC107_PF.u!==u||!FC107_PF.k)){const f=l.filter(x=>fc107Tipo(x)===FC107_PF.k);l=f.length?f:l}
    /* 122: no perfil dos outros, some o que a pessoa escondeu */
    try{if(aba==="posts"&&Array.isArray(l)&&u!==S.uid)return l.filter(x=>!(x&&x.autor===u&&dc122Some(x)))}catch(e){}return l}
  finally{if(sg)SG181.todos=false}}

/* ===== pfTiles: a grade (ou o aviso de vazio) de uma aba =====
   Base no 083; remendos: 084, 099, 104, 105, 107, 112, 123 (dois), 160, 161, 182, 181. */
function pf205Tiles(l,aba,u){if(!l.length){const eu=u===S.uid;const msg=aba==="reels"?(eu?"Seus reels aparecem aqui.":"Nenhum reel ainda."):aba==="marc"?(eu?"Quando marcarem você numa foto, ela aparece aqui.":"Ninguém marcou "+esc(String(nomeDe(u)).split(" ")[0])+" ainda."):(eu?"Compartilhe sua primeira publicação.":"Nenhuma publicação ainda.");
    return `<div class="pf-vz"><b>${aba==="reels"?"Reels":aba==="marc"?"Fotos com você":"Publicações"}</b><span>${msg}</span>${eu&&aba!=="marc"?`<button type="button" class="btn" data-criarde="${aba==="reels"?"post":"post"}"${aba==="reels"?" data-pfreel":""}>${aba==="reels"?"Criar reel":"Nova publicação"}</button>`:""}</div>`}
  return `<div class="pf-grade">${l.map((x,i)=>{const es=x.estilo||{},f=x.fotos[0],uu=f&&pubUrl(f),nt=x.pid&&pautaById(x.pid);const ic=es.reel?"▶":(x.fotos.length+(x.pid&&x.fotos.length?1:0))>1?"⧉":"";
    const inner=uu?`<img src="${pubSrc(uu)}" alt="${esc((es.alt&&es.alt[0])||x.texto||"Publicação")}" loading="lazy" decoding="async">`:x.pid?`<span class="pf-nt"><small style="color:${secCor(nt?secOf(nt):"politica")}">${esc(nt?secNome(secOf(nt)):"Notícia")}</small><b>${esc(nt?versao(nt,lente()).titulo:(x.snap&&x.snap.titulo)||"Notícia")}</b></span>`:`<span class="pf-tx" style="background:${pubFundo(String(x.id).charCodeAt(0))}">${esc(String(x.texto||"").slice(0,110))}</span>`;
    return `<button type="button" class="pf-t" data-pfi="${i}" aria-label="${esc(es.reel?"Reel":"Publicação")} de ${esc(quando(x.at))}">${inner}${ic?`<i class="pf-ic">${ic}</i>`:""}</button>`}).join("")}</div>`}
/* 084: marca as fixadas */
function pf205TilesAte84(l,aba,u){let h=pf205Tiles(l,aba,u);if(aba==="posts")l.forEach((x,i)=>{if(x.fixado)h=h.replace(`data-pfi="${i}"`,`data-pfi="${i}" data-fixo`)});return h}
/* do 099 ao 160 (o 161 chama este pedaço com a aba "posts" para a parte dos posts guardados) */
function pf205TilesAte160(l,aba,u){let h,curto=null;
  /* 123 (o segundo): perfil aberto ainda sem nada para seguidores */
  try{const p=u&&CS123.perf[u];if(V9.on&&u&&u!==S.uid&&!S.amigos.has(u)&&p&&p.ok&&p.aberto&&!(l||[]).length&&aba!=="marc")
    curto=`<div class="pf-vz"><b>${CS123.sigo.has(u)?"Nada para seguidores ainda":"Perfil aberto"}</b><span>${CS123.sigo.has(u)?`Quando ${esc(cs123Prim(u))} publicar para seguidores, aparece aqui e no seu Feed.`:`Siga ${esc(cs123Prim(u))} para ver aqui e no seu Feed o que ${esc(cs123Prim(u))} publica para seguidores.`}</span></div>`}catch(e){}
  if(curto!==null)h=curto;
  else{
    /* 104: quem não é amigo e não tem nada visível */
    if(u&&u!==S.uid&&!S.amigos.has(u)&&!(l||[]).length)h=`<div class="pf-vz"><b>Perfil só para amigos</b><span>Quando vocês forem amigos, as publicações de ${esc(String(nomeDe(u)).split(" ")[0])} aparecem aqui.</span></div>`;
    /* 099: Salvos (notícias guardadas no alto) */
    else if(aba==="salvos"){const sv=vp99Sv(),nn=Object.keys(sv).filter(k=>sv[k]&&!vp99EhPost(k)).length;
      const topo=`<button type="button" class="vp99-gd" data-vgo="saved"><span class="vp99-gdi">${ICON.save}</span><span class="vp99-gdt"><b>Notícias guardadas</b><small>${nn?nn+(nn===1?" notícia":" notícias"):"Nenhuma ainda"}</small></span><i aria-hidden="true">›</i></button>`;
      if(!l.length)h=topo+`<div class="pf-vz"><b>Salvos</b><span>Toque no marcador de um post para guardar aqui. Só você vê o que salvou.</span></div>`;
      else h=topo+pf205TilesAte84(l,"posts",u)+`<p class="hint vp99-so">Só você vê o que salvou.</p>`}
    else h=pf205TilesAte84(l,aba,u);
    /* 105: perfil vazio, o convite fala de conteúdo */
    h=typeof h==="string"?h.replace("Compartilhe sua primeira publicação.","Comente uma notícia ou conte o que aconteceu perto de você."):h;
    /* 107: fichas por tipo e o quadrinho de cada tipo */
    try{if(!(aba!=="posts"||typeof h!=="string"||!(l||[]).length)){
      const tp=document.createElement("template");tp.innerHTML=h;tp.content.querySelectorAll("[data-pfi]").forEach(b=>{const x=l[+b.dataset.pfi],t=x&&fc107PfTile(x),o=b.querySelector(".pf-tx");if(t&&o)o.outerHTML=t});
      h=fc107PfChips(u)+tp.innerHTML}}catch(e){}
    /* 112: repost e citação */
    try{if(!(typeof h!=="string"||!(l||[]).some(vn112Rp))){const tp=document.createElement("template");tp.innerHTML=h;
      tp.content.querySelectorAll("[data-pfi]").forEach(b=>{const x=l[+b.dataset.pfi],rp=x&&vn112Rp(x),o=b.querySelector(".pf-tx");if(!rp||!o)return;const q=rp.k==="pauta"?pautaById(rp.id):vn112Pub(rp.id);
        const t=rp.k==="pauta"?(q?versao(q,lente()).titulo:(x.snap&&x.snap.titulo)||"Notícia"):q?(q.texto||"Publicação de "+nomeDe(q.autor)):"Publicação indisponível";
        o.outerHTML=`<span class="pf-tx vn-pfrp"><small>${VN112_IC.rp}${String(x.texto||"").trim()?"Citação":"Repost"}</small><b>${esc(vn112Curto(String(x.texto||"").trim()||t,90))}</b></span>`});h=tp.innerHTML}}catch(e){}
    /* 123 (o primeiro): colunas na grade */
    h=(h=>{try{if(!(l||[]).some(x=>cs123Col(x))||typeof h!=="string")return h;const tp=document.createElement("template");tp.innerHTML=h;
      tp.content.querySelectorAll("[data-pfi]").forEach(b=>{const x=l[+b.dataset.pfi],c=x&&cs123Col(x);if(!c)return;if(!x.fotos.length)b.innerHTML=`<span class="pf-tx cs123-pft"><b>${esc(c.tit)}</b></span>`;b.insertAdjacentHTML("beforeend",`<i class="cs123-pfk">Coluna</i>`)});
      return tp.innerHTML}catch(e){return h}})(h)}
  /* 160: texto do Salvos vazio */
  try{if(aba==="salvos"&&typeof h==="string")h=h.replace("<b>Salvos</b><span>Toque no marcador de um post para guardar aqui. Só você vê o que salvou.</span>","<b>Posts salvos</b><span>Toque no marcador (Salvar) de um post para ele aparecer aqui. As notícias que você guarda pelo botão “Guardar” ficam em “Notícias guardadas”, logo acima. Só você vê o que salvou.</span>")}catch(e){}
  return h}
function pfTiles(l,aba,u){
  /* 181: só seguir — perfil fechado de quem você não vê; vazio de quem você vê */
  try{if(sg181On()&&u&&u!==S.uid&&aba!=="marc"){
    if(!sg181Ve(u)&&!(l||[]).length)return `<div class="pf-vz sg181-vz"><b>Perfil fechado</b><span>${SG181.env.has(u)?`Seu pedido foi enviado. Quando ${esc(sg181Prim(u))} aprovar, as publicações aparecem aqui.`:`Siga ${esc(sg181Prim(u))} para ver as publicações. ${esc(sg181Prim(u))} precisa aprovar.`}</span></div>`;
    if(!(l||[]).length)return `<div class="pf-vz"><b>Publicações</b><span>Nenhuma publicação ainda.</span></div>`}}catch(e){}
  let h;
  /* 161: Guardados (notícias e posts, com as fichas) */
  if(aba!=="salvos")h=pf205TilesAte160(l,aba,u);
  else h=(()=>{try{const nt=gd161Noticias(),nN=nt.length,nP=(l||[]).length;let h=gd161Chips(nN,nP);
      const verN=GD161_F!=="posts",verP=GD161_F!=="noticias";
      if(verN&&nN){if(GD161_F==="tudo"&&nP)h+=`<h3 class="gd161-h">Notícias</h3>`;h+=gd161ListaNoticias(nt)}
      if(verP&&nP){if(GD161_F==="tudo"&&nN)h+=`<h3 class="gd161-h">Posts</h3>`;h+=pf205TilesAte160(l,"posts",u)}
      const vazio=(GD161_F==="tudo"&&!nN&&!nP)||(GD161_F==="noticias"&&!nN)||(GD161_F==="posts"&&!nP);
      if(vazio)h+=`<div class="pf-vz"><b>${GD161_F==="noticias"?"Nenhuma notícia guardada":GD161_F==="posts"?"Nenhum post guardado":"Nada guardado ainda"}</b><span>Toque em “Guardar” (o marcador) numa notícia ou num post para ele aparecer aqui.</span></div>`;
      return h+`<p class="hint vp99-so">Só você vê o que guardou.</p>`}
    catch(e){return pf205TilesAte160(l,aba,u)}})();
  /* 182: com "De perto" escondido, o convite não fala do que aconteceu perto */
  return typeof h==="string"&&ft182Esc("deperto")?h.replace("Comente uma notícia ou conte o que aconteceu perto de você.","Comente uma notícia ou escreva o que você pensa."):h}

/* ===== destRowHTML: a fileira de destaques =====
   Base no 084; remendo do 107 (a fileira vazia "+ Novo" do próprio perfil some até existir um destaque). */
function pf205Dest(u){const ds=DEST[u]||[];const eu=u===S.uid;if(!V5.on||(!ds.length&&!eu))return "";
  return `<div class="pf-dests">${ds.map(d=>`<button type="button" class="pf-d" data-pfdest="${esc(d.id)}" data-dono="${esc(u)}"><span class="pf-dc">${destCapa(d)}</span><b>${esc(d.nome)}</b></button>`).join("")}${eu?`<button type="button" class="pf-d pf-dn" data-destnovo><span class="pf-dc">+</span><b>Novo</b></button>`:""}</div>`}
function destRowHTML(u){const h=pf205Dest(u);try{if(u===S.uid&&!(DEST[u]||[]).length)return ""}catch(e){}return h}

/* ===== pfCab: o cabeçalho do perfil (foto, números, nome, botões) =====
   Base no 083; remendos (de dentro para fora): 084, 104, 109, 114, 123, 136, 152, 158, 172, 182, 181.
   Cada passo abaixo é o corpo do remendo, com o HTML do passo anterior em h. */
function pf205Cab(u){const eu=u===S.uid,st=pubStoriesDe(u),n=pfLista(u,"posts").length,na=amigosL().length,cm=!eu&&S.comuns?S.comuns[u]:null,vist=st.length&&st.every(x=>PUB_VISTOS.has(x.id));
  return `<div class="pf-cab"><button type="button" class="pf-av${st.length?(vist?" ring visto":" ring"):""}" ${st.length?`data-pfstory="${esc(u)}"`:eu?`data-criarde="story"`:""} aria-label="${st.length?"Ver o giro":"Foto de "+esc(nomeDe(u))}"><span class="pf-avi">${avatar(u)}</span>${eu&&!st.length?`<i class="pf-mais" aria-hidden="true">+</i>`:""}</button>
    <div class="pf-num"><span><b>${n}</b>${n===1?"publicação":"publicações"}</span>${eu?`<span><b>${na}</b>${na===1?"amigo":"amigos"}</span>`:cm!=null?`<span><b>${cm}</b>${cm===1?"amigo em comum":"amigos em comum"}</span>`:""}</div></div>
    <b class="pf-nome">${esc(nomeDe(u))}</b>${eu?`<div class="pf-bts"><button type="button" class="btn ghost" data-criarde="post">Nova publicação</button><button type="button" class="btn ghost" data-convidar>Convidar amigo</button></div>`:S.amigos.has(u)?`<div class="pf-bts"><button type="button" class="btn" data-pfmsg="${esc(u)}">Mensagem</button></div>`:""}`}
function pfCab(u){
  /* 084: destaques */
  let h=pf205Cab(u)+destRowHTML(u);
  /* 104: quem não é amigo — pedir, cancelar ou aceitar amizade */
  h=(h=>{try{if(u&&u!==S.uid&&!S.amigos.has(u)&&!(S.bloq||[]).includes(u)&&S.membro){const rec=(S.pedidosIn||[]).includes(u),env=(S.pedidosOut||[]).includes(u);
    h+=`<div class="pf-bts">${rec?`<button type="button" class="btn" data-aceitar="${esc(u)}">Aceitar pedido de amizade</button>`:env?`<button type="button" class="btn ghost" data-cancelar="${esc(u)}">Cancelar pedido</button>`:`<button type="button" class="btn" data-pedir="${esc(u)}">Pedir amizade</button>`}</div>`}}catch(e){}return h})(h);
  /* 109: Editar foto */
  h=(h=>{try{if(u===S.uid&&V8.on)h=h.replace(/(<button type="button" class="btn ghost" data-convidar>[^<]*<\/button>)/,`$1<button type="button" class="btn ghost" data-fp8>Editar foto</button>`)}catch(e){}return h})(h);
  /* 114: "0 publicações" sai de quem está fora */
  h=(h=>{try{if(ra114Fora(u)&&!pfLista(u,"posts").length)h=h.replace(/<span><b>0<\/b>publicações<\/span>/,"")}catch(e){}return h})(h);
  /* 123: Seguir (perfil aberto) */
  h=(h=>{try{if(!V9.on||!u||u===S.uid||S.amigos.has(u)||(S.bloq||[]).includes(u))return h;const p=CS123.perf[u];
    if(!p){cs123Perf(u).then(()=>{if(PFV&&PFV.u===u&&$("#layer .pfv")&&PFV.modo==="grade")pfvDesenha()});return h}
    if(!p.ok||!p.aberto)return h;const bt=cs123SegBt(u);
    if(/<div class="pf-bts">/.test(h))h=h.replace(/<div class="pf-bts">/,`<div class="pf-bts">${bt}`);else h+=`<div class="pf-bts">${bt}</div>`}catch(e){}return h})(h);
  /* 136: colunas por e-mail */
  h=(h=>{try{if(PB136.v14!==true||!u||u===S.uid||(S.bloq||[]).includes(u))return h;const i=PB136.info[u];
    if(!i||Date.now()-(PB136.infoT[u]||0)>60e3){if(PB136.infoT[u]!==-1)pb136Info(u).then(n=>{if(n&&n.aberta&&(!i||i.aberta!==n.aberta||i.assinando!==n.assinando))pb136Redesenha()});if(!i)return h}
    if(!i.aberta)return h;const bt=`<button type="button" class="btn ghost pb136-pf${i.assinando?" on":""}" data-pb136nl="${esc(u)}" aria-pressed="${!!i.assinando}">${i.assinando?"✓ Por e-mail":"Colunas por e-mail"}</button>`;
    if(/<div class="pf-bts">/.test(h))h=h.replace(/(<div class="pf-bts">[\s\S]*?)(<\/div>)/,`$1${bt}$2`);else h+=`<div class="pf-bts">${bt}</div>`}catch(e){}return h})(h);
  /* 152: Minhas colunas */
  h=(h=>{try{if(u===S.uid&&typeof h==="string"&&h.indexOf("data-cp152cols")<0){const i=h.indexOf('<div class="pf-bts">');if(i>=0){const j=h.indexOf("</div>",i)+6;
    return h.slice(0,j)+`<button type="button" class="pf-cols" data-cp152cols>${CN102_SVG('<path d="M6 4h9l3 3v13H6z"/><path d="M9 11h6M9 15h4"/>')}<span><b>Minhas colunas</b><small>rascunhos, agendadas e publicadas</small></span><i aria-hidden="true">›</i></button>`+h.slice(j)}}}catch(e){}return h})(h);
  /* 158: coberturas que você segue */
  h=(h=>{try{if(u===S.uid&&typeof h==="string"&&h.indexOf("data-mt158cobs")<0){const l=mt158SegLinha();if(!l)return h;
    const i=h.indexOf("data-cp152cols");if(i>=0){const j=h.indexOf("</button>",i)+9;return h.slice(0,j)+l+h.slice(j)}
    const k=h.indexOf('<div class="pf-bts">');if(k>=0){const j=h.indexOf("</div>",k)+6;return h.slice(0,j)+l+h.slice(j)}}}catch(e){}return h})(h);
  /* 172: Minhas colunas e coberturas lado a lado */
  h=(h=>{try{if(typeof h!=="string"||h.indexOf("fc172-dupla")>=0)return h;const i=h.indexOf('<button type="button" class="pf-cols" data-cp152cols');
    const k=h.indexOf('<button type="button" class="pf-cols mt158-pf"');if(i<0||k<0||k<i)return h;
    const j1=h.indexOf("</button>",i)+9;if(h.slice(j1,k).trim())return h;const j2=h.indexOf("</button>",k)+9;
    return h.slice(0,i)+'<div class="fc172-dupla">'+h.slice(i,j2)+"</div>"+h.slice(j2)}catch(e){}return h})(h);
  /* 182: com o Giro escondido, a foto não abre a criação de story */
  if(ft182Esc("giro")&&typeof h==="string")h=h.replace(' data-criarde="story"',"").replace('<i class="pf-mais" aria-hidden="true">+</i>',"");
  /* 181: só seguir — Seguir/Pedido enviado/Seguindo e Mensagem (se puder) no lugar dos botões de amizade */
  h=(h=>{try{if(!sg181On()||!u||u===S.uid)return h;
    h=h.replace(/<div class="pf-bts">[\s\S]*?<\/div>/g,"");if((S.bloq||[]).includes(u))return h;
    h+=`<div class="pf-bts sg181-bts">${sg181Bt(u)}${sg181Msg(u)?`<button type="button" class="btn ghost" data-pfmsg="${esc(u)}">Mensagem</button>`:""}</div>`}catch(e){}return h})(h);
  return h}

/* ===== pfAbas: os ícones das abas (base no 083; o 099 tira "Salvos" do perfil dos outros) ===== */
function pf205Abas(u,aba){return `<div class="pf-abas" role="tablist">${PF_ABAS.filter(a=>a[0]!=="conta"||u===S.uid).map(([k,n,ic])=>`<button type="button" role="tab" data-pfaba="${k}" aria-selected="${aba===k}" aria-label="${n}">${ic}</button>`).join("")}</div>`}
function pfAbas(u){const h=pf205Abas.apply(this,arguments);return u===S.uid?h:h.replace(/<button[^>]*data-pfaba="salvos"[^>]*>[\s\S]*?<\/button>/,"")}

/* ===== pfCarregar: busca as publicações da pessoa (base no 083; o 084 busca os destaques depois) ===== */
async function pf205Carregar(u){if(!SB||!S.uid||!S.membro||PUB.on===false)return;if(Date.now()-(PF_T[u]||0)<45000)return;PF_T[u]=Date.now();
  try{const r=await SB.from("publicacoes").select("*").eq("autor",u).eq("tipo","post").order("at",{ascending:false}).limit(90);if(r.error)return;const ids=new Set(PUB.itens.map(x=>x.id));
    (r.data||[]).forEach(x=>{x.fotos=Array.isArray(x.fotos)?x.fotos:[];try{pubLimpa(x)}catch(e){}if(!ids.has(x.id))PUB.itens.push(x)});await pubAssinar()}catch(e){}}
async function pfCarregar(u){const r=await pf205Carregar.apply(this,arguments);if(await v5Testa())await destCarregar(u);return r}

/* ===== abrirPerfil: abre o perfil de alguém numa camada (o seu, na aba Perfil) =====
   Base no 083; remendos: 107 (zera o filtro por tipo), 112 (o seu abre em Publicações), 126 (marca a atividade como vista). */
function pf205Abrir(u){if(!u||!S.uid)return;if(u===S.uid){if($("#layer").innerHTML)closeLayer();setTimeout(()=>{go("me");PF_ABA="posts";renderMe();scrollTo(0,0)},60);return}
  if($("#layer").innerHTML)closeLayer();PFV={u,aba:"posts",modo:"grade"};$("#layer").innerHTML=`<div class="pfv" role="dialog" aria-modal="true" aria-label="Perfil de ${esc(nomeDe(u))}"></div>`;if(pushH())HST++;uso("perfil");
  pfvDesenha();pfCarregar(u).then(()=>{if(PFV&&PFV.u===u&&PFV.modo==="grade")pfvDesenha()})}
function abrirPerfil(u){
  /* 112 */ if(u===S.uid)VN112_PF.me="posts";
  /* 107 */ FC107_PF={u:null,k:""};
  const r=pf205Abrir.apply(this,arguments);
  /* 126 */ try{if(u&&u!==S.uid)qb126MarcaDepois(x=>x.k==="a:"+u||(nt124Cat(x)==="seguidores"&&(x.us||[]).includes(u)))}catch(e){}
  return r}

/* ===== pfvDesenha: desenha a camada do perfil (grade ou lista de publicações) =====
   Base no 083; remendos (de dentro para fora): 104, 109, 112, 113, 123, 160, 165, 181. */
function pf205Desenha(){const el=$("#layer .pfv");if(!el||!PFV)return;if(PFV.modo==="posts")return pfvPosts(el);
  el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-pfvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>${esc(nomeDe(PFV.u))}</b><span class="sp"></span></div><div class="pfv-sc">${pfCab(PFV.u)}${pfAbas(PFV.u,PFV.aba)}${pfTiles(pfLista(PFV.u,PFV.aba),PFV.aba,PFV.u)}</div>`}
function pfvDesenha(){let r;
  /* 109: a aba Arquivo tem desenho próprio (os remendos de fora continuam valendo) */
  if(PFV&&PFV.aba==="arq8"&&PFV.modo!=="posts")r=arq8Desenha();
  else{r=pf205Desenha.apply(this,arguments);
    /* 104: "⋯" no perfil de amigo */
    try{if(PFV&&PFV.modo==="grade"&&S.amigos.has(PFV.u)){const sp=document.querySelector("#layer .pfv .pfv-h .sp");
      if(sp&&!sp.nextElementSibling)sp.insertAdjacentHTML("afterend",`<button type="button" class="icbtn fd104-pm" data-fd104pm="${esc(PFV.u)}" aria-label="Mais opções"><svg class="ico" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg></button>`)}}catch(e){}
    /* 109: publicações arquivadas abertas */
    try{if(PFV&&PFV.aba==="arq8"&&PFV.modo==="posts"){const el=$("#layer .pfv");const h=el&&el.querySelector(".pfv-h b");if(h)h.innerHTML=`Arquivados<small>só você vê</small>`;
      el&&el.querySelectorAll(".upost[data-pid]").forEach(a=>{const id=String(a.dataset.pid).slice(2);const ph=a.querySelector(".ph");if(ph&&!a.querySelector(".arq8-bar"))ph.insertAdjacentHTML("afterend",`<div class="arq8-bar gut"><span>Arquivado · só você vê</span><button type="button" class="btn ghost" data-u8arq="${esc(id)}" data-on="0">Mostrar no perfil</button></div>`)})}}catch(e){}}
  /* 112: visual novo do perfil */
  try{if(PFV&&PFV.modo==="grade"){if(PFV.aba!=="posts")PFV.vnAba=PFV.aba;else if(!["posts","resp","midia"].includes(PFV.vnAba))PFV.vnAba="posts";vn112Pf($("#layer .pfv .pfv-sc"),PFV.u,PFV.vnAba)}}catch(e){console.error(e)}
  /* 113: publicação aberta mostra o fio inteiro */
  try{if(PFV&&PFV.modo!=="grade")f113AbreTudo($("#layer .pfv"))}catch(e){}
  /* 123: números de seguidores e "Perfil aberto" */
  try{if(PFV&&PFV.modo==="grade"){const sc=$("#layer .pfv .pfv-sc");cs123PoeNum(sc,PFV.u);
    const p=CS123.perf[PFV.u];if(sc&&p&&p.ok&&p.aberto&&!S.amigos.has(PFV.u)&&!sc.querySelector(".cs123-ab")){const cab=sc.querySelector(".vn-pf-desde,.cs123-numl,.vn-pf-num");if(cab)cab.insertAdjacentHTML("afterend",`<p class="cs123-ab">${cs123Svg(CS123_IC.seg)}Perfil aberto${p.me_segue?" · segue você":""}</p>`)}}}catch(e){}
  /* 160: conta (amizade e opções) */
  try{if(typeof PFV!=="undefined"&&PFV&&PFV.u)co160Pf($("#layer .pfv"),PFV.u)}catch(e){}
  /* 165: abas do perfil */
  try{pf165Abas($("#layer .pfv"))}catch(e){}
  /* 181: só seguir */
  try{if(PFV&&PFV.modo==="grade")sg181Pf($("#layer .pfv"),PFV.u)}catch(e){}
  return r}

/* ===== pfvPosts: a lista de publicações aberta a partir da grade (base no 083; o 099 dá título aos Guardados) ===== */
function pf205Posts(el){const l=PFV.lista||[];el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-pfvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>${PFV.aba==="reels"?"Reels":PFV.aba==="marc"?"Marcações":"Publicações"}<small>${esc(nomeDe(PFV.u))}</small></b><span class="sp"></span></div><div class="pfv-sc pfv-posts">${l.map(x=>{try{return pubPostHTML(x)}catch(e){return ""}}).join("")}</div>`;
  pfIdsTroca(l);const sc=el.querySelector(".pfv-sc");try{wireTracks(sc)}catch(e){}l.forEach(x=>{try{updateSocial("u:"+x.id)}catch(e){}});const a=l[PFV.i];const alvo=a&&el.querySelector(`[id="p-u:${a.id}"]`);if(alvo){sc.scrollTop=alvo.offsetTop-sc.offsetTop;requestAnimationFrame(()=>{sc.scrollTop=alvo.offsetTop-sc.offsetTop})}}
function pfvPosts(el){const r=pf205Posts.apply(this,arguments);try{if(PFV&&PFV.aba==="salvos"){const b=el.querySelector(".pfv-h b");if(b&&b.firstChild&&b.firstChild.nodeType===3)b.firstChild.textContent="Guardados";const sm=b&&b.querySelector("small");if(sm)sm.textContent="Só você vê"}vp99Ancora(el)}catch(e){}return r}

/* ===== perfil no visual novo (112): abas Respostas e Mídia, troca de aba e o cabeçalho novo =====
   Bases no 112; remendos: 114 (quem está fora vê "Perfil só para amigos" e não vê "0 publicações"), 165 (a aba Ajustes
   do próprio perfil rola até as abas). */
function pf205Resp(u){const l=todosComentarios().filter(c=>c.uid===u).sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,60);
  if(!l.length)return `<div class="pf-vz"><b>Respostas</b><span>${u===S.uid?"Seus comentários nas notícias e nas publicações aparecem aqui.":"Nenhum comentário ainda."}</span></div>`;
  return `<ul class="vn-resp">${l.map(c=>{const m=/^u:(.+)$/.exec(String(c.pid||"")),p=!m&&pautaById(c.pid),x=m&&(pubVisiveis().find(y=>y.id===m[1]));const ctx=p?versao(p,lente()).titulo:x?"publicação de "+nomeDe(x.autor):"";
    return `<li><button type="button" data-vnresp="${esc(c.pid)}">${avatar(u)}<span class="vn-resp-c"><span class="vn-resp-h"><b>${esc(nomeDe(u))}</b><i>· ${esc(quando(c.at))}</i></span>${ctx?`<small>Em resposta a ${p?"“"+esc(vn112Curto(ctx,90))+"”":esc(ctx)}</small>`:""}<span class="vn-resp-t">${esc(vn112Curto(c.texto,400))}</span></span></button></li>`}).join("")}</ul>`}
function vn112Resp(u){return ra114Fora(u)?ra114SoAmigos(u):pf205Resp.apply(this,arguments)}
function pf205Midia(u){const l=pfLista(u,"posts").filter(x=>x.fotos.length);if(!l.length)return `<div class="pf-vz"><b>Mídia</b><span>${u===S.uid?"As fotos que você publicar aparecem aqui.":"Nenhuma foto ainda."}</span></div>`;
  return `<div class="pf-grade vn-mid">${l.map(x=>{const f=pubUrl(x.fotos[0]);return `<button type="button" class="pf-t" data-vnmid="${esc(x.id)}" aria-label="Foto de ${esc(quando(x.at))}">${f?`<img src="${pubSrc(f)}" alt="${esc((x.estilo.alt&&x.estilo.alt[0])||x.texto||"Foto")}" loading="lazy" decoding="async">`:""}${x.fotos.length>1?`<i class="pf-ic">⧉</i>`:""}</button>`}).join("")}</div>`}
function vn112Midia(u){return ra114Fora(u)&&!pfLista(u,"posts").length?ra114SoAmigos(u):pf205Midia.apply(this,arguments)}
function pf205PfAba(k,camada){const proprio=["posts","resp","midia"].includes(k);
  if(camada){if(!PFV)return;PFV.vnAba=k;PFV.aba=proprio?"posts":k;pfvDesenha();const sc=$("#layer .pfv-sc"),ab=sc&&sc.querySelector(".vn-abas");if(sc&&ab&&sc.scrollTop>ab.offsetTop)sc.scrollTop=ab.offsetTop;return}
  VN112_PF.me=k;PF_ABA=proprio?"posts":k;renderMe();const ab=$("#v-me .vn-abas");if(ab){const y=ab.getBoundingClientRect().top+scrollY-60;if(scrollY>y)scrollTo(0,y)}}
function vn112PfAba(k,camada){const r=pf205PfAba.apply(this,arguments);
  try{if(!camada&&k==="conta"){const ab=$("#v-me .vn-abas");if(ab){const y=ab.getBoundingClientRect().top+scrollY-6;scrollTo(0,Math.max(0,y))}}}catch(e){}return r}
function pf205VnPf(root,u,ab){if(!root||!u)return;const eu=u===S.uid,cab=root.querySelector(".pf-cab");if(!cab||root.querySelector(".vn-pf"))return;
  const avb=cab.querySelector(".pf-av"),bts=root.querySelector(".pf-bts"),num=cab.querySelector(".pf-num"),abas=root.querySelector(".pf-abas");
  const orig=abas?[...abas.querySelectorAll("[data-pfaba]")].map(b=>b.dataset.pfaba):[];
  const n=pfLista(u,"posts").length,na=amigosL().length,cm=!eu&&S.comuns?S.comuns[u]:null,ds=vn112Desde(u);
  const f=(S.membros[u]||{}).foto&&avb&&avb.querySelector("img");
  const h=document.createElement("div");h.className="vn-pf";h.style.setProperty("--vn-band",vn112Cor(u));
  h.innerHTML=`<div class="vn-pf-band" aria-hidden="true">${f?`<img src="${esc(f.getAttribute("src"))}" alt="">`:""}</div><div class="vn-pf-row"></div><h2 class="vn-pf-nome">${esc(nomeDe(u))}</h2>${ds?`<p class="vn-pf-desde"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>${esc(ds)}</p>`:""}
    <p class="vn-pf-num">${eu?`<span role="button" tabindex="0" data-fd104am aria-label="${na} ${na===1?"amigo":"amigos"}: ver a lista"><b>${na}</b> ${na===1?"amigo":"amigos"}</span>`:cm!=null?`<span><b>${cm}</b> ${cm===1?"amigo em comum":"amigos em comum"}</span>`:""}<span><b>${n}</b> ${n===1?"publicação":"publicações"}</span></p>`;
  const row=h.querySelector(".vn-pf-row");if(avb)row.appendChild(avb);if(bts){if(bts.children.length>1)h.appendChild(bts);else row.appendChild(bts)}
  cab.before(h);cab.remove();root.querySelector(".pf-nome")?.remove();num?.remove();
  const meu=["posts","resp","midia"].includes(ab);
  if(abas)abas.outerHTML=vn112Abas(u,ab,eu,orig);
  if(meu){root.querySelectorAll(".fc107-pk,.pf-grade,.pf-vz").forEach(e=>{if(!e.closest(".pf-ped"))e.remove()});
    const corpo=root.querySelector(".pf-corpo")||root.querySelector(".vn-abas");const html=ab==="resp"?vn112Resp(u):ab==="midia"?vn112Midia(u):vn112Posts(u);
    if(corpo.classList.contains("pf-corpo"))corpo.insertAdjacentHTML("beforeend",html);else corpo.insertAdjacentHTML("afterend",html);
    if(ab==="posts"){const l=pfLista(u,"posts");if(!eu||VIEW==="me")try{pfIdsTroca(l)}catch(e){}const pl=root.querySelector(".vn-pl");if(pl){try{wireTracks(pl)}catch(e){}l.forEach(x=>{try{updateSocial("u:"+x.id)}catch(e){}})}}}
  vn112Nomes(root)}
function vn112Pf(root,u){const r=pf205VnPf.apply(this,arguments);try{if(ra114Fora(u)&&root&&!pfLista(u,"posts").length)root.querySelectorAll(".vn-pf-num span").forEach(s=>{if(/publicaç/.test(s.textContent))s.remove()})}catch(e){}return r}

/* ===== cs123Linha: uma pessoa nas listas de seguidores/seguindo =====
   Base no 123; o 181 (só seguir) troca a linha: "perfil fechado", Remover (seus seguidores) ou Seguir/Pedido enviado/Seguindo. */
function pf205Linha(x,meu,tipo){const u=x.uid,eu=u===S.uid,am=S.amigos.has(u);
  return `<li><button type="button" class="amg-r cs123-lr" data-cs123perfil="${esc(u)}">${avatar(u)}<span class="amg-n"><b>${esc(eu?"Você":nomeDe(u))}</b><span>${am?"amigo":x.aberto?"perfil aberto":""}</span></span></button>${meu&&tipo==="seguidores"?`<button type="button" class="btn ghost amg-b" data-cs123tira="${esc(u)}">Remover</button>`:!eu&&!am&&x.aberto?cs123SegBt(u):""}</li>`}
function cs123Linha(x,meu,tipo){if(!sg181On())return pf205Linha.apply(this,arguments);const u=x.uid,eu=u===S.uid;
  return `<li><button type="button" class="amg-r cs123-lr" data-cs123perfil="${esc(u)}">${avatar(u)}<span class="amg-n"><b>${esc(eu?"Você":nomeDe(u))}</b><span>${eu?"":SG181.fech.has(u)?"perfil fechado":""}</span></span></button>${meu&&tipo==="seguidores"?`<button type="button" class="btn ghost amg-b" data-cs123tira="${esc(u)}">Remover</button>`:eu?"":sg181Bt(u,"amg-b")}</li>`}
