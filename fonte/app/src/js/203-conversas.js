/* ---------- 203 · Conversas (Fase 3): as funções de Conversas, cada uma numa versão só ----------
   Antes eram remendadas em 065, 070, 091, 100, 104-correcoes-conversas, 106, 108, 114, 121, 125, 126, 160, 162, 165 e 181
   (e openSend em 008/066/102/150). Cada função abaixo faz o que a cadeia inteira fazia, na mesma ordem; os comentários dizem
   de onde veio cada passo. As variáveis, ouvintes e gestos que eram do 065 vêm aqui na mesma posição de carga (este arquivo
   entra logo antes do 065). Os auxiliares dos outros arquivos (ca100*, dm104*, dm106*, rs108*, co160*, cv162*, pf165, sg181*)
   continuam onde estavam: aqui eles só são chamados, sempre depois da carga. */
const DM_EMO=["❤️","😂","😮","😢","👍","🔥"];
var RESPM=null,DM_Q="";
const DM_IC={nova:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',busca:'<svg class="ico" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>',env:'<svg class="ico" viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/></svg>',voltar:'<svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>'};
/* todas as mensagens (recebidas e enviadas), sem repetir, em ordem de hora. Na carga (antes do 999) vale só a base, como
   antes: os complementos ainda não existiam (o 029 desenha o Feed com a edição guardada e o cartão pergunta "Na conversa") */
var CV203_PRONTA=false;
function cv203Pronta(){CV203_PRONTA=true}
function allMsgs(){const m=new Map();[...S.msgsIn,...S.msgsOut].forEach(x=>m.set(x.id,x));let l=[...m.values()].sort((a,b)=>a.at-b.at);
  if(!CV203_PRONTA)return l;
  /* 091: quem está bloqueado some de Conversas */
  {const bl=S.bloq||[];if(bl.length)l=l.filter(m=>!bl.includes(m.de===S.uid?m.para:m.de))}
  /* 106: mensagens antigas já carregadas ("Carregar mensagens antigas") */
  if(DM106.uid===S.uid){dm106Desliza();if(DM106.ant.size){const ids=new Set(l.map(m=>m.id)),bl=S.bloq||[],ex=[];DM106.ant.forEach(m=>{if(!ids.has(m.id)&&!bl.includes(m.de===S.uid?m.para:m.de))ex.push(m)});
    if(ex.length)l=l.concat(ex).sort((a,b)=>a.at-b.at)}}
  /* 162: o que você apagou some da lista e da conversa */
  if(PREF.conv)l=l.filter(m=>{const a=+cv162(cv162Outro(m)).apg||0;return !a||(+m.at||0)>a});
  return l}
function marcarLidasThread(th){if(document.hidden||!S.db)return;const nl=th.filter(m=>m.para===S.uid&&!m.lida);if(!nl.length)return;nl.forEach(m=>m.lida=true);const de=nl[0].de;S.db.marcarLidas(de).catch(()=>{nl.forEach(m=>m.lida=false);updateBadge()})}
function dmPar(u){return m=>(m.de===u&&m.para===S.uid)||(m.de===S.uid&&m.para===u)}
function dmCurto(at){const m=(Date.now()-at)/6e4;if(m<1)return "agora";if(m<60)return Math.floor(m)+" min";if(m<1440)return Math.floor(m/60)+" h";if(m<10080)return Math.floor(m/1440)+" d";return Math.floor(m/10080)+" sem"}
/* hora na conversa; depois de uma semana, a data com o mês (104) */
function dmQuando(at){try{const d=dataSP(at),hoje=hojeSP(),dias=Math.round((Date.parse(hoje+"T12:00:00Z")-Date.parse(d+"T12:00:00Z"))/864e5);
  if(dias>=6){const o={day:"numeric",month:"short",timeZone:"America/Sao_Paulo"};if(d.slice(0,4)!==hoje.slice(0,4))o.year="numeric";return new Date(at).toLocaleDateString("pt-BR",o).replace(/\./g,"")+", "+hhmm(at)}}catch(e){}
  const d=dataSP(at),h=hhmm(at),hoje=hojeSP();if(d===hoje)return "Hoje, "+h;if(d===somaDias(hoje,-1))return "Ontem, "+h;const w=new Date(at).toLocaleDateString("pt-BR",{weekday:"short",timeZone:"America/Sao_Paulo"}).replace(".","");return `${w} (${+d.slice(8,10)}), ${h}`}
/* prévia da última mensagem na lista */
function dmPrevia(m){let r;
  /* 114: menção num comentário de post */
  if(ra114MenCmt(m))r=m.de===S.uid?"Você mencionou num comentário":"Mencionou você num comentário";
  /* 104: reação a uma mensagem diz de quem era a mensagem e qual era */
  else if(m&&m.tipo==="reacao_msg"){const eu=m.de===S.uid,e=m.texto||"❤️",alvo=allMsgs().find(x=>x.id===(m.snap&&m.snap.ref)),tr=alvo?dm104Trecho(alvo):"";
  const quem=alvo?(alvo.de===S.uid?"à sua mensagem":(eu?"à mensagem de "+String(nomeDe(alvo.de)).split(" ")[0]:"à própria mensagem")):(eu?"a uma mensagem":"à sua mensagem");
  r=(eu?"Você reagiu ":"Reagiu ")+e+" "+quem+(tr?": “"+tr+"”":"")}
  else{const eu=m.de===S.uid;
    /* 070: posts de membros */
    if(m.tipo==="mencao"&&dmEhPub(m)&&m.snap&&m.snap.upub)r=m.snap.story===true?(eu?"Você mencionou no giro":"Mencionou você no giro"):eu?"Você marcou num post":"Marcou você num post";
    else if(dmEhPub(m)&&!m.texto&&m.tipo!=="mencao")r=eu?"Você enviou um post":"Enviou um post";
    /* 065 */
    else if(m.tipo==="reacao")r=(eu?"Você reagiu ":"Reagiu ")+(m.texto||"")+" a uma notícia";
    else if(m.tipo==="mencao")r=eu?"Você mencionou num comentário":"Mencionou você num comentário";
    else if(m.tipo==="curtiu_story")r=eu?"Você curtiu o giro":"Curtiu seu giro ❤️";
    else if(m.tipo==="resp_story")r=(eu?"Você respondeu ao giro: ":"Respondeu ao seu giro: ")+(m.texto||"");
    else if(m.pid&&!m.texto)r=eu?"Você enviou uma notícia":"Enviou uma notícia";
    else r=(eu?"Você: ":"")+(m.texto||"")}
  /* 121: "giro" no lugar de "story" */
  try{return typeof r==="string"?tb121Giro(r):r}catch(e){return r}}
function dmFotoDe(m){const p=m.pid&&pautaById(m.pid);const f=p&&fotoDe(p);return f&&f.url?f:null}
/* cartão de notícia ou de publicação mandada na conversa */
function dmCard(m){let h;
  if(!dmEhPub(m)){/* 065: notícia */
    /* 19/11: o cartão mostra o título de quando foi enviado; se a matéria mudou depois, avisa em uma linha */
    const s=m.snap||{},p=m.pid&&pautaById(m.pid),tAt=p&&versao(p,lente()).titulo,tit=s.titulo||tAt||"Notícia",mud=!!(s.titulo&&tAt&&s.titulo!==tAt),sec=(p&&secOf(p))||s.secao||"politica",f=dmFotoDe(m);
    h=`<button type="button" class="dm-card" data-open="${esc(m.pid)}"><span class="dm-cf paper" data-sec="${esc(sec)}">${f?`<img src="${escU(fotoSrc(f.url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`:svgOf(s.imagem||(p&&p.imagem))}</span><span class="dm-ct"><small style="color:${secCor(sec)}">${esc(secNome(sec))}</small><b>${esc(tit)}</b>${mud?`<em class="dm-cmud">Atualizada depois · toque para ver a versão de agora</em>`:""}</span></button>`;
    /* 160: a mesma editoria da Capa */
    try{if(typeof h==="string"){const p=m&&m.pid&&pautaById(m.pid);if(p){
      const ch=capaChapeu(p),sec=secOf(p);if(ch)h=h.replace(new RegExp("(<span class=\"dm-ct\"><small[^>]*>)"+esc(secNome(sec)).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"</small>"),"$1"+esc(ch)+"</small>")}}}catch(e){}
    return h}
  /* 070: post ou giro de membro */
  const id=m.pid.slice(2),x=typeof pubDe==="function"&&pubDe(id),s=m.snap||{};
  const u=x&&x.fotos&&x.fotos[0]&&pubUrl(x.fotos[0]),au=x?x.autor:null,tx=x?x.texto:(String(s.titulo||"").replace(/^(Post|Story) de [^:]+:\s*/,""));
    h=`<button type="button" class="dm-card dm-ucard" data-open="${esc(m.pid)}"><span class="dm-uh">${au?avatar(au):""}<b>${esc(au?nomeDe(au):(String(s.titulo||"").match(/^(?:Post|Story|Giro) de ([^:]+)/)||[,"Publicação"])[1])}</b><small>${x?(x.tipo==="story"?"Giro":x.estilo&&x.estilo.reel?"Reel":"Post"):/^Story de /.test(String(s.titulo||""))?"Giro":"Publicação"}</small></span>${u?`<span class="dm-cf"><img src="${pubSrc(u)}" alt="" loading="lazy" decoding="async"></span>`:""}${tx?`<span class="dm-ct"><b class="dm-utx">${esc(String(tx).slice(0,160))}</b></span>`:""}${!x?`<span class="dm-ct"><small class="dm-indisp">Só quem é amigo do autor consegue abrir</small></span>`:""}</button>`;
  /* 108: publicação que não existe mais */
  try{if(typeof h==="string"&&h.indexOf("dm-indisp")>=0&&dmEhPub(m)){const s=m.snap||{},t=String(s.titulo||""),mm=t.match(/^(Post|Story|Reel) de ([^:]+)$/),nome=mm&&mm[2].trim();
    if(mm)h=h.replace(`<span class="dm-ct"><b class="dm-utx">${esc(t.slice(0,160))}</b></span>`,"");
    const story=s.story===true||/^(Story|Giro) de /.test(t),amigo=!!nome&&(nome===nomeDe(S.uid)||amigosL().some(u=>nomeDe(u)===nome));
    if(story||amigo)h=h.replace("Só quem é amigo do autor consegue abrir",story?"Este giro não está mais disponível":"Esta publicação não está mais disponível")}}catch(e){}
  /* 125: coluna */
  try{if(typeof h==="string"){const x=pubDe(String(m.pid).slice(2)),c=x&&cs123Col(x);
    if(c)h=h.replace(/(<span class="dm-uh">[\s\S]*?<small>)Post(<\/small>)/,"$1Coluna$2").replace(/(<b class="dm-utx">)[\s\S]*?(<\/b>)/,`$1${esc(c.tit)}$2`)}}catch(e){}
  return h}
function dmMarca(t){let h=esc(t);amigosL().concat(S.uid?[S.uid]:[]).map(u=>nomeDe(u)).filter(Boolean).sort((a,b)=>b.length-a.length).forEach(n=>{const e=esc("@"+n);if(h.includes(e))h=h.split(e).join(`<b class="dm-at">${e}</b>`)});return h}
function dmSoEmoji(t){try{const x=String(t||"").trim();return x.length>0&&x.length<=12&&/^(\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(x)&&!/^[\d#*\s]+$/.test(x)}catch(e){return false}}
function dmLinka(h){return String(h).replace(/(^|[\s>])((?:https?:\/\/|www\.)[^\s<]{2,300})/gi,(a,pre,u)=>{let tail="";while(/[.,;:!?)\]]$/.test(u)){tail=u.slice(-1)+tail;u=u.slice(0,-1)}const href=(/^www\./i.test(u)?"https://":"")+u.replace(/&amp;/g,"&");return /^https?:\/\//i.test(href)?`${pre}<a href="${esc(href)}" target="_blank" rel="noopener noreferrer nofollow" class="dm-link">${u}</a>${tail}`:a})}
/* a conversa aberta: balões, separadores de hora, reações, citações */
function dmThreadHTML(u){const R=allMsgs();
  /* 106: resposta a uma mensagem que foi apagada não mostra mais o texto apagado */
  let mud=false;const ids=new Set(R.map(m=>m.id));
  const L2=R.map(m=>{if(m&&m.tipo==="resposta"&&m.snap&&m.snap.q&&dm106Apagada(m.snap.q,ids,u)){mud=true;return {...m,snap:{...m.snap,q:{...m.snap.q,t:DM106_APG}}}}return m});
  /* 100: curtida de giro com miniatura vira resposta ao giro */
  const lk=new Set();
  const L1=L2.map(m=>{if(m&&m.tipo==="curtiu_story"&&ca100StInfo(m)){lk.add(m.id);return {...m,tipo:"resp_story",texto:m.texto||"❤️",_ca100lk:1}}return m});
  /* 065 */
  const all=L1.filter(dmPar(u)),reac={},ms=[];
  all.forEach(m=>{if(m.tipo==="reacao_msg"&&m.snap&&m.snap.ref)(reac[m.snap.ref]=reac[m.snap.ref]||[]).push(m);else ms.push(m)});
  let h;if(!ms.length)h=`<div class="dm-vazio">${avatar(u)}<b>${esc(nomeDe(u))}</b><span>Mande uma mensagem ou uma notícia pelo botão Enviar de qualquer post.</span></div>`;
  else{h="";let ant=null;const ultMinha=ms.length&&ms[ms.length-1].de===S.uid?ms[ms.length-1]:null;
  const quebra=(a,b)=>!a||b.at-a.at>3600e3||dataSP(a.at)!==dataSP(b.at);
  ms.forEach((m,i)=>{const nx=ms[i+1],eu=m.de===S.uid;if(quebra(ant,m))h+=`<div class="dm-tm">${esc(dmQuando(m.at))}</div>`;
    const pri=quebra(ant,m)||ant.de!==m.de||m.at-ant.at>300e3,ult=!nx||quebra(m,nx)||nx.de!==m.de||nx.at-m.at>300e3;
    let corpo="";
    if(m.tipo==="curtiu_story"){h+=`<div class="dm-ev">${eu?"Você curtiu o giro de "+esc(nomeDe(m.para)):"❤️ "+esc(nomeDe(m.de))+" curtiu seu giro"}${m.snap&&m.snap.story&&m.snap.story.t?` · “${esc(m.snap.story.t)}”`:""}</div>`;ant=m;return}
    if(m.tipo==="resp_story"){const st=(m.snap&&m.snap.story)||{};corpo+=`<div class="dm-q"><small>${eu?"Você respondeu ao giro de "+esc(nomeDe(m.para)):"Respondeu ao seu giro"}</small><span>${esc(st.t||(st.foto?"📷 Foto":"Giro"))}</span></div>`}
    if(m.tipo==="reacao"){h+=`<div class="dm-ev">${eu?"Você reagiu":esc(nomeDe(m.de))+" reagiu"} ${esc(m.texto||"")} a uma notícia</div>`;ant=m;return}
    if(m.tipo==="mencao")corpo+=`<span class="dm-lb">${eu?"Você mencionou "+esc(nomeDe(m.para)):"Mencionou você"} ${m.snap&&m.snap.story===true?"no giro":"num comentário"}</span>`;
    if(m.tipo==="resposta"&&m.snap&&m.snap.q){const q=m.snap.q;corpo+=`<div class="dm-q"><small>${eu?(q.de===S.uid?"Você respondeu a si mesmo":"Você respondeu a "+esc(nomeDe(q.de))):(q.de===S.uid?"Respondeu a você":"Respondeu a si mesmo")}</small><span>${esc(q.t||"")}</span></div>`}
    else if(m.pid&&m.resp&&m.tipo!=="mencao")corpo+=`<button type="button" class="dm-q" data-open="${esc(m.pid)}"><small>Sobre a notícia</small><span>${esc(m.snap?.titulo||"notícia")}</span></button>`;
    else if(m.pid)corpo+=dmCard(m);
    if(m.texto&&!(m.tipo==="mencao"&&m.snap&&m.snap.upub&&(m.snap.story===true&&/^Mencionou você no (giro|story)$/.test(m.texto)||typeof pubDe==="function"&&(pubDe(m.snap.upub)||{}).texto===m.texto)))corpo+=`<div class="bub${dmSoEmoji(m.texto)?" bub-emo":""}">${dmLinka(m.tipo==="mencao"?dmMarca(m.texto):esc(m.texto))}</div>`;
    const rs=reac[m.id]||[];const pill=rs.length?`<button type="button" class="dm-rx" data-dmacoes="${esc(m.id)}" aria-label="Reações">${[...new Set(rs.map(r=>String(r.texto||"").slice(0,8)))].map(esc).join("")}${rs.length>1?`<i>${rs.length}</i>`:""}</button>`:"";
    h+=`<div class="msg dm-m ${eu?"mine":"theirs"}${pri?" pri":""}${ult?" ult":""}${rs.length?" crx":""}" data-mid="${esc(m.id)}">${!eu?`<span class="dm-av">${ult?avatar(m.de):""}</span>`:""}<div class="dm-c">${corpo}${pill}</div></div>`;
    if(m===ultMinha)h+=`<div class="dm-st">${m.lida?"Visto":String(m.id).startsWith("tmp")?"Enviando…":"Enviada"}</div>`;
    ant=m});}
  /* 070: menção num post (não num comentário) */
  h=h.replace(/(<span class="dm-lb">)(Você mencionou [^<]*|Mencionou você) num comentário(<\/span>)(<button type="button" class="dm-card dm-ucard" data-open="u:([^"]+)")/g,(a,b1,quem,b3,b4,id)=>{const m=L1.find(x=>x.tipo==="mencao"&&x.pid==="u:"+id&&x.snap&&x.snap.upub);return m?b1+quem+" num post"+b3+b4:a});
  /* 100: miniatura do giro */
  try{L2.filter(dmPar(u)).forEach(m0=>{if(m0.tipo!=="resp_story"&&!lk.has(m0.id))return;const inf=ca100StInfo(m0);if(!inf)return;const m=lk.has(m0.id)?{...m0,_ca100lk:1}:m0;
    const k=`data-mid="${esc(m.id)}"`,i=h.indexOf(k);if(i<0)return;const nx=h.indexOf("data-mid=",i+k.length),a=h.indexOf('<div class="dm-q">',i);if(a<0||(nx>=0&&a>nx))return;const z=h.indexOf("</div>",a);if(z<0)return;
    let blk=ca100StHTML(m,inf);
    /* a resposta da pergunta (075) também desenha um cartão de notícia vazio: some */
    let fim=z+6;if(h.startsWith('<button type="button" class="dm-card',fim)){const zz=h.indexOf("</button>",fim);if(zz>0&&(nx<0||zz<nx))fim=zz+9}
    h=h.slice(0,a)+`<div class="ca100-sq${m.de===S.uid?" eu":""}">${blk}</div>`+h.slice(fim)})}catch(e){}
  /* 106: "Carregar mensagens antigas" */
  try{if(dm106TemMais(u)&&h.indexOf('class="dm-vazio"')<0)h=`<div class="dm106-topo"><button type="button" class="btn ghost dm106-mais" data-dm106mais>${DM106.car?"Carregando…":"Carregar mensagens antigas"}</button></div>`+h}catch(e){}
  if(mud)h=h.split(`<span>${DM106_APG}</span>`).join(`<span class="dm106-apg">Mensagem apagada</span>`);
  /* 114: menção num comentário de post */
  try{if(typeof h==="string"&&h.indexOf("num post")>=0){
    const ms=R.filter(ra114MenCmt);if(ms.length){const t=document.createElement("template");t.innerHTML=h;let mudou=false;
    ms.forEach(m=>{const el=t.content.querySelector(`[data-mid="${CSS.escape(String(m.id))}"] .dm-lb`);if(el&&/ num post$/.test(el.textContent)){el.textContent=el.textContent.replace(/ num post$/," num comentário");mudou=true}});
    if(mudou)h=t.innerHTML}}}catch(e){}
  /* 121: "giro" no lugar de "story" */
  if(typeof h==="string"&&h.indexOf("tory")>=0){
    try{const tp=document.createElement("template");tp.innerHTML=h;let mudou=false;
      tp.content.querySelectorAll(".dm-lb,.dm-ev,.dm-q>small,.dm-uh>small,.ca100-stl,.dm-q>span").forEach(el=>{
        const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;const l=[];while(n=w.nextNode())l.push(n);
        l.forEach(n=>{const t=n.nodeValue,v=el.matches(".dm-q>span")?t.replace(/^Story$/,"Giro"):tb121GiroTx(t);if(v!==t){n.nodeValue=v;mudou=true}})});
      if(mudou)h=tp.innerHTML}catch(e){}}
  return h}
function dmInboxHTML(){const msgs0=allMsgs(),ids=new Set(msgs0.map(m=>m.id)),msgs=msgs0.filter(m=>!(m.tipo==="reacao_msg"&&m.snap&&m.snap.ref&&!ids.has(m.snap.ref))),am=amigosL(),ult={};msgs.forEach(m=>{const o=m.de===S.uid?m.para:m.de;if(!o||o===S.uid)return;ult[o]=m});
  const convs=Object.keys(ult).sort((a,b)=>ult[b].at-ult[a].at),n=norm(DM_Q).trim();const ok=u=>!n||norm(nomeDe(u)).includes(n);
  const amigosRow=am.slice().sort((a,b)=>((ult[b]||{}).at||0)-((ult[a]||{}).at||0)).filter(ok);
  const rows=convs.filter(ok).map(u=>{const m=ult[u],un=msgs.filter(x=>x.de===u&&x.para===S.uid&&!x.lida).length;
    return `<li><button type="button" class="dm-row${un?" un":""}" data-thread="${esc(u)}">${avatar(u)}<span class="pt"><b>${esc(nomeDe(u))}</b><span><span class="dm-pv">${esc(dmPrevia(m))}</span><span class="dm-t"> · ${esc(dmCurto(m.at))}</span></span></span>${un?`<span class="dot" aria-label="${un} não ${un===1?"lida":"lidas"}"></span>`:""}</button></li>`}).join("");
  return `<div class="gut dm-in"><div class="view-h dm-h"><h1>Conversas</h1>${am.length?`<button type="button" class="icbtn" data-novaconv aria-label="Nova conversa">${DM_IC.nova}</button>`:""}</div>
    ${am.length||convs.length?`<label class="dm-busca">${DM_IC.busca}<input id="dmq" type="search" autocomplete="off" placeholder="Pesquisar" aria-label="Pesquisar conversas" value="${esc(DM_Q)}"></label>`:""}
    ${amigosRow.length?`<div class="dm-amg" aria-label="Amigos">${amigosRow.map(u=>`<button type="button" data-thread="${esc(u)}">${avatar(u)}<span>${esc(String(nomeDe(u)).split(" ")[0])}</span></button>`).join("")}</div>`:""}
    ${convs.length?`<h3 class="dm-sh">Mensagens</h3><ul class="people dm-lista">${rows||`<li class="dm-nada">Ninguém com esse nome</li>`}</ul>`
      :DM_Q.trim()?`<div class="empty"><b>Ninguém com esse nome</b></div>`:am.length?`<div class="empty"><b>Nenhuma conversa ainda</b>Toque num amigo acima, ou mande uma notícia pelo botão Enviar de um post.</div>`
      :`<div class="empty"><b>Nenhum amigo ainda</b>Adicione amigos no Perfil para conversar.<button type="button" class="btn ghost" data-vgo="me" style="margin-top:10px">Ir ao Perfil</button></div>`}</div>`}
/* troca só os balões que mudaram (antes a conversa inteira era redesenhada a cada mensagem nova) */
function dmPorCorpo(el,html){const t=document.createElement("template");t.innerHTML=html;const nv=[...t.content.childNodes],at=[...el.childNodes];if(!at.length||!nv.length){el.innerHTML=html;return}
  const k=n=>n.nodeType===1?n.outerHTML:"#"+n.textContent,A=at.map(k),B=nv.map(k);let p=0,s=0;while(p<A.length&&p<B.length&&A[p]===B[p])p++;while(s<A.length-p&&s<B.length-p&&A[A.length-1-s]===B[B.length-1-s])s++;
  const ref=at[A.length-s]||null;for(let i=p;i<A.length-s;i++)at[i].remove();const fr=document.createDocumentFragment();for(let i=p;i<B.length-s;i++)fr.appendChild(nv[i]);el.insertBefore(fr,ref)}
/* a tela Conversas: lista ou conversa aberta. Depois de desenhar, os acabamentos na ordem em que entraram */
function renderMsgs(){
  const v=$("#v-msgs");document.body.classList.toggle("dm-conv",!!THREAD&&VIEW==="msgs");
  if(!S.db||!S.uid||!S.membro){v.dataset.thr="";v.innerHTML=`<div class="gut"><div class="view-h"><h1>Conversas</h1></div><div class="empty"><b>Conversas precisam da sua conta</b>${S.uid?"Falta só o convite para você entrar no Prumo.":"Entre para trocar notícias com os seus amigos."}<button type="button" class="btn" data-entrar style="margin-top:10px">${S.uid?"Usar um convite":"Entrar"}</button></div></div>`}
  else if(!THREAD){const foco=document.activeElement&&document.activeElement.id==="dmq",pos=foco?document.activeElement.selectionStart:0;v.dataset.thr="";v.innerHTML=dmInboxHTML();if(foco){const i=$("#dmq");i.focus();try{i.setSelectionRange(pos,pos)}catch(e){}}}
  else{const u=THREAD,amigo=S.amigos.has(u),th=allMsgs().filter(dmPar(u)),corpo=dmThreadHTML(u);
  const ja=v.dataset.thr===u&&v.dataset.am===String(amigo)&&v.querySelector(".thread");
  if(ja){const perto=document.documentElement.scrollHeight-scrollY-innerHeight<200,n0=v.querySelectorAll(".thread .dm-m").length;dmPorCorpo(v.querySelector(".thread"),corpo);marcarLidasThread(th);updateBadge();const n1=v.querySelectorAll(".thread .dm-m").length;if(perto||(n1>n0&&th[th.length-1]?.de===S.uid))window.scrollTo(0,document.body.scrollHeight)}
  else{v.dataset.thr=u;v.dataset.am=String(amigo);RESPM=null;
  v.innerHTML=`<div class="dm-th-h"><button type="button" class="dm-bk" data-back aria-label="Voltar para Conversas">${DM_IC.voltar}</button><button type="button" class="dm-who" ${amigo?"data-thmenu":""}>${avatar(u)}<span><b>${esc(nomeDe(u))}</b><small>${amigo?"Amigo no Prumo":S.membros[u]?.excluido?"Conta excluída":"Não são amigos agora"}</small></span></button>${amigo?`<button type="button" class="icbtn" data-thmenu aria-label="Opções da conversa">${ICON.dots}</button>`:""}</div>
    <div class="gut"><div class="thread dm-thr">${corpo}</div></div>
    <div class="composer gut dm-comp">${amigo?`<form id="mform" class="dm-f" autocomplete="off"><textarea class="field" id="mtext" rows="1" maxlength="1000" autocomplete="off" enterkeyhint="send" placeholder="Mensagem…" aria-label="Mensagem"></textarea><button class="send dm-send" type="submit" aria-label="Enviar" disabled>${DM_IC.env}</button></form>`:`<p class="hint" style="margin:0;padding:8px 0">${S.membros[u]?.excluido?"Esta conta foi excluída. A conversa fica aqui só para leitura.":(S.membros[u]&&!S.membros[u].excluido?"Vocês não são amigos no Prumo agora. Para conversar de novo, peça amizade no Perfil.":"Não dá para conversar com esta pessoa agora.")}</p>`}</div>`;
  if(amigo){const i=$("#mtext"),b=$("#mform .send");i.addEventListener("input",()=>{b.disabled=!i.value.trim()});
    $("#mform").addEventListener("submit",async e=>{e.preventDefault();const t=i.value.trim();if(!t)return;i.value="";b.disabled=true;const rq=RESPM;RESPM=null;$("#respbar")?.remove();
      const extra=rq?{tipo:"resposta",snap:{q:rq}}:{};const ok=await dmEnviar(u,{texto:t,...extra});
      if(!ok){if(!i.value){i.value=t;b.disabled=false}if(rq&&!RESPM){RESPM=rq;dmBarraResp()}}})}
  marcarLidasThread(th);updateBadge();window.scrollTo(0,document.body.scrollHeight)}}
  /* 100: miniaturas dos giros */
  try{if(THREAD)ca100Assina()}catch(e){}
  /* 104: conta excluída; quem deixou de ser amigo pode pedir amizade dali mesmo */
  dm104Excluidas();
  dm104Amizade();
  /* 108: rascunho guardado da mensagem */
  try{if(THREAD)rs108Poe($("#mtext"),"dm:"+THREAD)}catch(e){}
  /* 160: sem conta; "ninguém com esse nome"; campo que cresce */
  try{if(!S.uid){const v=$("#v-msgs .empty");if(v&&!v.querySelector(".co160-semconta"))v.innerHTML=`<b>Conversas precisam da sua conta</b>Com a conta você troca notícias e mensagens com os seus amigos.<p class="co160-como">${esc(CO160_COMO)}</p><div class="lbtns co160-semconta"><button type="button" class="btn" data-entrar>Entrar</button><button type="button" class="btn ghost" data-entrar="criar">Criar conta com convite</button></div>`}
  else if(S.membro&&!THREAD){co160SemNome()}else if(S.membro&&THREAD){co160Campo()}}catch(e){}
  /* 162: conversas silenciadas */
  try{
  document.querySelectorAll('#v-msgs [data-thread]').forEach(b=>{const u=b.dataset.thread;if(!cv162Sil(u))return;
    const d=b.querySelector(".dot");if(d)d.remove();const nm=b.querySelector(".pt b");if(nm&&!nm.querySelector(".cv162-ic")){nm.insertAdjacentHTML("beforeend",CV162_SINO);b.setAttribute("aria-label",(nm.textContent||"")+", conversa silenciada")}
    b.classList.remove("un");const s=b.querySelector(".pt .unread");if(s)s.classList.remove("unread")});
  if(THREAD&&cv162Sil(THREAD)){const h=document.querySelector("#v-msgs .dm-who b, #v-msgs .view-h h1");if(h&&!h.querySelector(".cv162-ic"))h.insertAdjacentHTML("beforeend",CV162_SINO)}}catch(e){}
  /* 165: fileira de amigos sem repetir a lista */
  try{if(S.uid&&S.membro&&!THREAD){const row=$("#v-msgs .dm-amg");if(row){
  const conv=new Set([...document.querySelectorAll("#v-msgs .dm-lista [data-thread]")].map(b=>b.dataset.thread));
  if(conv.size){row.querySelectorAll("[data-thread]").forEach(b=>{if(conv.has(b.dataset.thread))b.remove()});
    if(!row.querySelector("[data-thread]"))row.remove();else if(!(row.previousElementSibling&&row.previousElementSibling.classList.contains("pf165-amh")))row.insertAdjacentHTML("beforebegin",`<h3 class="dm-sh pf165-amh">Amigos</h3>`)}}}}catch(e){}
  /* 181: quem não pode receber mensagem (só seguir) */
  try{if(sg181On())sg181DmAviso()}catch(e){}}
/* conversa com quem deixou de ser amigo: o pedido de amizade sai dali mesmo (104); no modo só seguir, o aviso do 181 */
function dm104Amizade(){if(sg181On()){try{sg181DmAviso()}catch(e){}return}
  try{const u=THREAD;if(!u||VIEW!=="msgs"||S.amigos.has(u)||S.membros[u]?.excluido||!S.membros[u]||(S.bloq||[]).includes(u))return;const h=$("#v-msgs .dm-comp .hint");if(!h||h.querySelector(".dm104-am"))return;
  const rec=(S.pedidosIn||[]).includes(u),env=(S.pedidosOut||[]).includes(u),perto=document.documentElement.scrollHeight-scrollY-innerHeight<200;
  h.insertAdjacentHTML("beforeend",rec?` <button type="button" class="btn dm104-am" data-aceitar="${esc(u)}">Aceitar pedido</button>`:env?` <button type="button" class="btn ghost dm104-am" disabled>Pedido enviado</button>`:` <button type="button" class="btn dm104-am" data-pedir="${esc(u)}">Pedir amizade</button>`);
  if(h.firstChild&&h.firstChild.nodeType===3)h.firstChild.textContent=rec?String(nomeDe(u)).split(" ")[0]+" pediu para ser seu amigo no Prumo. Aceite para conversar de novo.":env?"Você pediu amizade. Quando aceitarem, dá para conversar de novo.":"Vocês não são amigos no Prumo agora. Para conversar de novo, peça amizade.";if(perto)window.scrollTo(0,document.body.scrollHeight)}catch(e){}}
/* manda uma mensagem (aparece na hora, como "Enviando…") */
async function dmEnviar(para,campos,silencioso){
  /* 100: resposta ou curtida de giro leva a miniatura do giro */
  try{if(campos&&(campos.tipo==="resp_story"||campos.tipo==="curtiu_story")&&campos.snap&&typeof campos.snap==="object"&&!campos.snap.sth){
    const sn=campos.snap,id=sn.story&&typeof sn.story==="object"?sn.story.id:sn.upub,th=id&&ca100StTh(pubDe(id));if(th)campos={...campos,snap:{...sn,sth:th}}}}catch(e){}
  /* 065 */
  const at=Date.now(),id="tmp"+at+Math.random().toString(36).slice(2,5);const m={de:S.uid,para,at,texto:"",lida:false,...campos};
  S.msgsOut.push({id,...m});if(VIEW==="msgs")renderMsgs();
  let ok;try{await S.db.collection("mensagens").add(m);ok=true}catch(err){S.msgsOut=S.msgsOut.filter(x=>x.id!==id);if(VIEW==="msgs")renderMsgs();if(!silencioso)toast(err?.code==="permission_denied"?"Só dá para mandar mensagem para amigos.":"A mensagem não foi enviada. Tente de novo.");ok=false}
  /* 091: curtida de giro que não foi enviada não fica marcada */
  try{if(!ok&&campos&&campos.tipo==="curtiu_story"&&campos.snap&&campos.snap.story&&typeof US_CURTI!=="undefined"){US_CURTI.delete(campos.snap.story.id);localStorage.setItem("prumo-us-curti",JSON.stringify([...US_CURTI].slice(-300)));toast("A curtida não foi enviada. Tente de novo.")}}catch(e){}
  return ok}
async function dmApagar(id){/* 106: some também das antigas carregadas */{const m=DM106.ant.get(id);if(m&&m.de===S.uid)DM106.ant.delete(id)}
  const m=allMsgs().find(x=>x.id===id);if(!m||m.de!==S.uid)return;const bk=S.msgsOut.slice();S.msgsOut=S.msgsOut.filter(x=>x.id!==id);if(VIEW==="msgs")renderMsgs();
  try{await S.db.doc("mensagens/"+id).delete()}catch(e){S.msgsOut=bk;if(VIEW==="msgs")renderMsgs();toast("Não deu para apagar agora.")}}
/* reagir a uma mensagem. 104: não reage a mensagem ainda sem id do servidor (criava reação "órfã") nem troca a reação
   enquanto a anterior ainda está a caminho */
async function dmReagir(mid,e){if(String(mid||"").startsWith("tmp")){toast("Espere a mensagem ser enviada para reagir.");return}
  if(allMsgs().some(x=>x.tipo==="reacao_msg"&&x.de===S.uid&&x.snap&&x.snap.ref===mid&&String(x.id).startsWith("tmp")))return;
  const m=allMsgs().find(x=>x.id===mid);if(!m||!THREAD)return;if(!S.amigos.has(THREAD)){toast("Só dá para reagir com amigos.");return}vibrar(8);
  const minhas=allMsgs().filter(x=>x.tipo==="reacao_msg"&&x.de===S.uid&&x.snap&&x.snap.ref===mid);const igual=minhas.find(x=>x.texto===e);
  for(const r of minhas)if(!String(r.id).startsWith("tmp"))await dmApagar(r.id);if(igual)return;
  await dmEnviar(THREAD,{texto:e,tipo:"reacao_msg",snap:{ref:mid}})}
function dmTexto(m){return m.texto||(m.snap&&m.snap.titulo?"📰 "+m.snap.titulo:m.pid?"📰 notícia":"")}
/* barra "Respondendo a…"; 104: a última mensagem não fica escondida atrás dela */
function dmBarraResp(){const perto=document.documentElement.scrollHeight-scrollY-innerHeight<200;
  $("#respbar")?.remove();const f=$("#mform");if(f&&RESPM)f.insertAdjacentHTML("beforebegin",`<div id="respbar" class="respbar dm-rb"><span><small>Respondendo ${RESPM.de===S.uid?"a você mesmo":"a "+esc(nomeDe(RESPM.de))}</small>${esc(RESPM.t)}</span><button type="button" data-dmsemresp aria-label="Cancelar resposta">✕</button></div>`);
  if(perto&&$("#respbar"))requestAnimationFrame(()=>window.scrollTo(0,document.body.scrollHeight))}
function dmResponder(mid){const m=allMsgs().find(x=>x.id===mid);if(!m)return;RESPM={id:m.id,de:m.de,t:dmTexto(m).slice(0,120)};dmBarraResp();$("#mtext")?.focus()}
/* o "Responder" antigo (030) foi trocado pelo do 065 */
function responderMsg(mid){return dmResponder(mid)}
/* segurar uma mensagem: reagir, responder, copiar, abrir, apagar; 104: denunciar a recebida */
function dmAcoes(mid){const m0=allMsgs().find(x=>x.id===mid);if(m0){const m=m0,eu=m.de===S.uid;vibrar(10);
  sheet("Mensagem",`<div class="dm-emo" role="group" aria-label="Reagir">${DM_EMO.map(e=>`<button type="button" data-dmreac="${esc(mid)}" data-e="${e}">${e}</button>`).join("")}</div><div class="opt">${S.amigos.has(THREAD)?`<button type="button" data-dmresp="${esc(mid)}">Responder</button>`:""}${dmTexto(m)?`<button type="button" data-dmcopiar="${esc(mid)}">Copiar texto</button>`:""}${m.pid?`<button type="button" data-open="${esc(m.pid)}">${String(m.pid).indexOf("u:")===0?"Abrir a publicação":"Abrir a notícia"}</button>`:""}${eu?`<button type="button" data-dmapagar="${esc(mid)}" class="perigo">Apagar para todos<span>some para você e para ${esc(nomeDe(m.para))}</span></button>`:""}</div>`)}
  try{const m=allMsgs().find(x=>x.id===mid);const o=$("#layer .sheet .opt")||$("#layer2 .sheet .opt");
  if(m&&o&&m.de!==S.uid&&m.para===S.uid&&!String(m.id).startsWith("tmp")&&!o.querySelector("[data-dm104den]"))o.insertAdjacentHTML("beforeend",`<button type="button" data-dm104den="${esc(mid)}" class="perigo">Denunciar mensagem<span>${S.membros[S.uid]?.papel==="admin"?"fica na sua lista da Administração":"o Pedro recebe e analisa"}</span></button>`)}catch(e){}}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
  if(b=t.closest("[data-dmreac]")){e.stopPropagation();const mid=b.dataset.dmreac,em=b.dataset.e;closeLayer();dmReagir(mid,em);return}
  if(b=t.closest("[data-dmresp]")){e.stopPropagation();const mid=b.dataset.dmresp;closeLayer();setTimeout(()=>dmResponder(mid),60);return}
  if(b=t.closest("[data-dmcopiar]")){e.stopPropagation();const m=allMsgs().find(x=>x.id===b.dataset.dmcopiar);closeLayer();dmCopiar(dmTexto(m));return}
  if(b=t.closest("[data-dmapagar]")){e.stopPropagation();if(!b.classList.contains("conf")){b.classList.add("conf");b.firstChild.textContent="Toque de novo para apagar";return}const mid=b.dataset.dmapagar;closeLayer();dmApagar(mid);return}
  if(b=t.closest("[data-dmacoes]")){e.stopPropagation();dmAcoes(b.dataset.dmacoes);return}
  if(t.closest("[data-dmsemresp]")){e.stopPropagation();RESPM=null;$("#respbar")?.remove();return}},true);
document.addEventListener("input",e=>{if(e.target&&e.target.id==="dmq"){DM_Q=e.target.value;renderMsgs()}});
/* gestos nos balões: dois toques = ❤️, segurar = ações, arrastar para a direita = responder */
(function(){let alvo=null,x0=0,y0=0,lp=0,mov=false,ultT=0,ultId="";
  const m0=e=>e.target.closest&&e.target.closest("#v-msgs .dm-m");
  document.addEventListener("touchstart",e=>{const m=m0(e);alvo=null;if(!m||e.touches.length>1)return;alvo=m;mov=false;x0=e.touches[0].clientX;y0=e.touches[0].clientY;clearTimeout(lp);lp=setTimeout(()=>{if(alvo&&!mov){const id=alvo.dataset.mid;alvo.classList.remove("arr");alvo=null;DM_LP=Date.now();dmAcoes(id)}},480)},{passive:true});
  document.addEventListener("touchmove",e=>{if(!alvo)return;const dx=e.touches[0].clientX-x0,dy=e.touches[0].clientY-y0;if(Math.abs(dx)>8||Math.abs(dy)>8){mov=true;clearTimeout(lp)}
    if(dx>0&&Math.abs(dx)>Math.abs(dy)*1.3&&S.amigos.has(THREAD)){const c=alvo.querySelector(".dm-c");if(c){c.style.transition="none";c.style.transform=`translateX(${Math.min(80,dx*.6)}px)`;alvo.classList.toggle("arr",dx>60)}}},{passive:true});
  document.addEventListener("touchend",e=>{clearTimeout(lp);if(Date.now()-DM_LP<700){e.preventDefault();DM_LP=0;return}const m=alvo;alvo=null;if(!m)return;const c=m.querySelector(".dm-c"),t=e.changedTouches[0],dx=t.clientX-x0;
    if(c&&c.style.transform){c.style.transition="transform .2s cubic-bezier(.3,.7,.4,1)";c.style.transform="";if(dx>60&&S.amigos.has(THREAD)){vibrar(8);dmResponder(m.dataset.mid)}m.classList.remove("arr");return}
    if(!mov&&!e.target.closest("button,a")){const now=Date.now();if(ultId===m.dataset.mid&&now-ultT<320){ultT=0;e.preventDefault();if(S.amigos.has(THREAD)){dmReagir(m.dataset.mid,"❤️");const k=document.createElement("span");k.className="dm-pop";k.textContent="❤️";m.querySelector(".dm-c")?.appendChild(k);setTimeout(()=>k.remove(),800)}}else{ultT=now;ultId=m.dataset.mid}}},{passive:false});
  document.addEventListener("contextmenu",e=>{const m=m0(e);if(!m)return;e.preventDefault();dmAcoes(m.dataset.mid)});
  document.addEventListener("dblclick",e=>{const m=m0(e);if(!m||matchMedia("(pointer:coarse)").matches||e.target.closest("button,a"))return;if(S.amigos.has(THREAD))dmReagir(m.dataset.mid,"❤️")})})();
/* abre a conversa com uid (de qualquer tela); 126: os avisos de mensagem dessa pessoa ficam vistos */
function abrirConversa(uid){const de=VIEW;THREAD=uid;if(VIEW!=="msgs")go("msgs");else renderMsgs();if(pushH()){TST++;TST_AT=Date.now();THREAD_DE=de!=="msgs"?de:null}
  try{if(uid)qb126MarcaDepois(x=>x.msg&&x.msg.de===uid&&!(x.msg.snap&&x.msg.snap.upub))}catch(e){}}
/* nova conversa: escolher o amigo; 160: caminhos para quem ainda não é amigo */
function abrirNovaConversa(){if(!precisaConta())listaPessoasSheet("Nova conversa","",amigosL,linhaAmigo,"Nenhum amigo ainda");
  try{const b=$("#layer .sheet .sh-b");if(b&&$("#layer #pbox")&&!b.querySelector(".co160-novos"))b.insertAdjacentHTML("beforeend",co160Novos())}catch(e){}}
/* "…" da conversa (160: ver perfil em cima; desfazer, bloquear e denunciar embaixo) e 162: silenciar e apagar */
function abrirThMenu(u){if(S.amigos.has(u)){const n1=String(nomeDe(u)||"").split(" ")[0];
  sheet("Conversa com "+n1,`<div class="opt co160-opt"><button type="button" data-co160pf="${esc(u)}">Ver perfil<span>publicações de ${esc(n1)}</span></button></div>
    <div class="opt co160-opt co160-pesado"><button type="button" data-desfazer="${esc(u)}">Desfazer amizade<span>vocês deixam de se ver</span></button><button type="button" data-bloquear="${esc(u)}">Bloquear<span>não pode mais te achar nem pedir amizade</span></button>${co160Admin(u)?"":`<button type="button" data-denp="${esc(u)}">Denunciar<span>o Pedro recebe e analisa</span></button>`}</div>`)}
  try{const g=document.querySelector("#layer .sheet .co160-opt");if(g&&!g.querySelector("[data-cv162sil]")){
  const sil=cv162Sil(u);g.insertAdjacentHTML("beforeend",`<button type="button" data-cv162sil="${esc(u)}">${sil?"Reativar avisos":"Silenciar conversa"}<span>${sil?"volta a avisar quando chegar mensagem":"sem aviso no celular nem bolinha; a conversa continua"}</span></button><button type="button" data-cv162apg="${esc(u)}">Apagar conversa<span>some da sua lista; ${esc(String(nomeDe(u)||"").split(" ")[0])} continua vendo</span></button>`)}}catch(e){}}
/* Enviar uma notícia (ou post) para amigos. 150: sem conta, vai direto para compartilhar fora do Prumo */
function openSend(pid,pre){try{if((!S.uid||!S.membro)&&pid&&(pautaById(pid)||snapById(pid))){compartilhar(pid);return}}catch(e){}
  /* 066: vários amigos de uma vez */
  (()=>{uso("enviar");if(precisaConta())return;const others=amigosL();
  if(!others.length){sheet("Enviar",`<div class="empty" style="padding:18px 0"><b>Nenhum amigo ainda</b>Adicione amigos no Perfil para mandar notícias para eles.</div><button type="button" class="btn ghost" data-vgo="me">Ir ao Perfil</button><button type="button" class="btn ghost" data-compart="${esc(pid)}">Compartilhar fora do Prumo</button>`);return}
  const sel=new Set(pre&&others.includes(pre)?[pre]:others.length===1?[others[0]]:[]);const snap=snapById(pid);
  const ult={};allMsgs().forEach(m=>{const o=m.de===S.uid?m.para:m.de;ult[o]=m.at});const ord=others.slice().sort((a,b)=>(ult[b]||0)-(ult[a]||0));
  const rot=()=>sel.size>1?`Enviar para ${sel.size}`:"Enviar";
  sheet("Enviar",`${others.length>6?`<input class="field" id="pkq" type="search" autocomplete="off" placeholder="Buscar amigo" aria-label="Buscar amigo" style="margin-bottom:10px">`:""}<div class="pick dm-pick" id="pick">${ord.map(u=>`<button type="button" data-pick="${esc(u)}" aria-pressed="${sel.has(u)}">${avatar(u)}<span>${esc(nomeDe(u))}</span><i class="dm-ck" aria-hidden="true"></i></button>`).join("")}</div>${shareCard(snap,'style="width:100%;pointer-events:none" tabindex="-1"')}<button type="button" class="btn ghost" data-compart="${esc(pid)}">Compartilhar fora do Prumo</button>`,
    `<form id="sform"><input class="field" id="stext" maxlength="600" autocomplete="off" placeholder="Escreva uma mensagem (opcional)" aria-label="Mensagem"><button class="send" id="sbtn" type="submit" ${sel.size?"":"disabled"}>${rot()}</button></form>`);
  $("#pkq")?.addEventListener("input",e=>{const n=norm(e.target.value).trim();document.querySelectorAll("#pick [data-pick]").forEach(b=>b.hidden=!!n&&!norm(b.textContent).includes(n))});
  $("#pick")?.addEventListener("click",e=>{const b=e.target.closest("[data-pick]");if(!b)return;const u=b.dataset.pick;if(sel.has(u))sel.delete(u);else sel.add(u);b.setAttribute("aria-pressed",String(sel.has(u)));const bt=$("#sbtn");bt.disabled=!sel.size;bt.textContent=rot()});
  $("#sform").addEventListener("submit",async e=>{e.preventDefault();if(!sel.size)return;const t=$("#stext").value.trim(),bt=$("#sbtn");if(bt.dataset.env)return;bt.disabled=true;bt.dataset.env="1";bt.textContent="Enviando…";
    const alvos=[...sel],res=await Promise.all(alvos.map(u=>S.db.collection("mensagens").add({de:S.uid,para:u,at:Date.now(),texto:t,pid,snap,lida:false}).then(()=>true,err=>err)));
    const ok=alvos.filter((u,i)=>res[i]===true),erro=res.find(x=>x!==true);
    if(ok.length===alvos.length){if($("#sform"))closeLayer();toast(`Enviado para ${ok.length>2?ok.length+" amigos":ok.map(nomeDe).join(" e ")}`)}
    else{ok.forEach(u=>sel.delete(u));document.querySelectorAll("#pick [data-pick]").forEach(x=>x.setAttribute("aria-pressed",String(sel.has(x.dataset.pick))));const b=$("#sbtn");if(b){b.disabled=false;delete b.dataset.env;b.textContent=rot()}
      toast(erro?.code==="permission_denied"?"Só dá para mandar para amigos.":ok.length?`Enviado para ${ok.map(nomeDe).join(" e ")}; o resto não foi. Tente de novo.`:"Não deu para enviar agora. Tente de novo.")}})})();
  /* 102: publicar com comentário ou pôr no giro */
  try{if(pid&&String(pid).indexOf("u:")!==0&&pautaById(pid)&&S.membro&&PUB.on!==false){const b=document.querySelector("#layer .sheet .sh-b,#layer2 .sheet .sh-b");
    if(b&&!b.querySelector(".cn102-env"))b.insertAdjacentHTML("afterbegin",`<div class="cn102-env"><button type="button" data-cn102envp="${esc(pid)}">${CN102_SVG(CN102_ICO.ana)}<span><b>Publicar com comentário</b><small>No seu perfil e no Feed</small></span></button>${typeof ft182Esc==="function"&&ft182Esc("giro")?"":`<button type="button" data-cn102envs="${esc(pid)}">${CN102_SVG(CN102_ICO.story)}<span><b>No seu giro</b><small>Some em 24 horas</small></span></button>`}</div>`)}}catch(e){}}
