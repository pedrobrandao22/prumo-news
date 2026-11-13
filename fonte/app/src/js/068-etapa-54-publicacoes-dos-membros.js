/* ---------- Etapa 54: publicações dos membros ---------- */
var PUB={on:null,itens:[],urls:{},carregou:false,uid:null};
var PUB_VISTOS=new Set((()=>{try{return JSON.parse(localStorage.getItem("prumo-pub-vistos")||"[]")}catch(e){return []}})());
const PUB_FUNDOS=[["#ff8a5b","#c2185b"],["#5b8cff","#2a2f86"],["#1db58a","#0c5d63"],["#f6c344","#e2572c"],["#8e5bff","#d14fb3"],["#242a38","#0d1119"]];
const pubSrc=u=>{const t=String(u||"");return /^https:\/\//i.test(t)||/^data:image\//i.test(t)||/^blob:/i.test(t)?esc(t):""};
function pubFundo(i){const f=PUB_FUNDOS[(+i||0)%PUB_FUNDOS.length];return `linear-gradient(160deg,${f[0]},${f[1]})`}
function pubDe(id){return PUB.itens.find(x=>x.id===id)}
function pubVisiveis(){const now=Date.now();return PUB.itens.filter(x=>x&&(x.autor===S.uid||S.amigos.has(x.autor))&&(x.tipo==="post"||(x.expira||0)>now))}
/* PUB_SEL: as colunas da lista do Feed; o 146 tira o texto longo das colunas (corpo) */
var PUB_SEL="*";
async function pubCarregar(){if(typeof SB==="undefined"||!SB||!S.uid||!S.membro)return;if(PUB.carregando)return;PUB.carregando=true;
  try{const sel=q=>SB.from("publicacoes").select(q).order("at",{ascending:false}).limit(300);let r=await sel(typeof PUB_SEL==="string"?PUB_SEL:"*");if(r.error&&PUB_SEL!=="*"&&/42703|column/i.test(String(r.error.code||"")+" "+String(r.error.message||""))){PUB_SEL="*";r=await sel("*")}
    if(r.error){if(/publicacoes|does not exist|42P01|schema cache|relation/i.test((r.error.message||"")+(r.error.code||"")))PUB.on=false;return}
    PUB.on=true;PUB.uid=S.uid;const novos=(r.data||[]).map(x=>({...x,fotos:Array.isArray(x.fotos)?x.fotos:[]}));const sig=novos.map(x=>x.id+":"+x.at+":"+(x.editado||"")+":"+(x.fixado||"")+":"+JSON.stringify(x.estilo||"").length).join(",")+"|"+[...S.amigos].sort().join(",");const mudou=sig!==PUB.sig;PUB.sig=sig;novos.forEach(x=>{try{pubLimpa(x)}catch(e){}});try{if(typeof cl146Herda==="function")cl146Herda(novos,PUB.itens)}catch(e){}PUB.itens=novos;await pubAssinar();pubLimparMeus();if(mudou)pubRedesenha()}
  catch(e){}finally{PUB.carregando=false;PUB.carregou=true}}
async function pubAssinar(){const now=Date.now(),falta=[];pubVisiveis().forEach(x=>x.fotos.forEach(p=>{const c=PUB.urls[p];if(!c||c.exp<now+600e3)falta.push(p)}));if(!falta.length)return;
  try{const r=await SB.storage.from("fotos").createSignedUrls(falta,6*3600);(r.data||[]).forEach(d=>{if(d&&d.signedUrl)PUB.urls[d.path]={u:d.signedUrl,exp:now+6*3600e3}})}catch(e){}}
const pubUrl=p=>(PUB.urls[p]||{}).u||"";
async function pubLimparMeus(){const now=Date.now();const velhos=PUB.itens.filter(x=>x.autor===S.uid&&x.tipo==="story"&&(x.expira||0)<now);for(const x of velhos)await pubApagar(x.id,true)}
async function pubApagar(id,quieto){const x=pubDe(id);if(!x||x.autor!==S.uid)return false;try{const r=await SB.from("publicacoes").delete().eq("id",id);if(r&&r.error)throw r.error;if(x.fotos.length)try{await SB.storage.from("fotos").remove(x.fotos)}catch(e){}
    PUB.itens=PUB.itens.filter(y=>y.id!==id);if(!quieto){pubRedesenha();toast(x.tipo==="story"?"Story apagado":x.estilo&&x.estilo.reel?"Reel apagado":"Post apagado")}return true}catch(e){if(!quieto)toast("Não deu para apagar agora.");return false}}
let PUB_T=0,PUB_FEED_PEND=false;function pubRedesenha(){clearTimeout(PUB_T);PUB_T=setTimeout(()=>{try{renderSecs();if(VIEW==="feed"&&!$("#layer").innerHTML&&scrollY<300){PUB_FEED_PEND=false;renderPosts(true)}else PUB_FEED_PEND=true}catch(e){}},30)}
addEventListener("scroll",()=>{if(PUB_FEED_PEND&&VIEW==="feed"&&scrollY<300&&!$("#layer").innerHTML){PUB_FEED_PEND=false;setTimeout(()=>{try{renderPosts(true)}catch(e){}},200)}},{passive:true});
(function(){let uid=null;setInterval(()=>{if(S.uid&&S.membro&&SB&&uid!==S.uid){uid=S.uid;PUB.itens=[];pubCarregar();pubOuvir()}if(!S.uid&&uid){uid=null;PUB.itens=[];PUB.on=null}},1500);
  setInterval(()=>{if(!document.hidden&&S.uid&&S.membro)pubCarregar()},180000);document.addEventListener("visibilitychange",()=>{if(!document.hidden&&S.uid&&S.membro)setTimeout(pubCarregar,800)})})();
function pubOuvir(){try{if(!SB.channel)return;const ch=SB.channel("pub-"+Math.random().toString(36).slice(2,7));ch.on("postgres_changes",{event:"*",schema:"public",table:"publicacoes"},p=>{if(p&&p.table&&p.table!=="publicacoes")return;clearTimeout(pubOuvir.t);pubOuvir.t=setTimeout(pubCarregar,600)});ch.subscribe()}catch(e){}}

/* ---- comprimir foto no celular ---- */
function pubComprime(file,maxL,maxS){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{try{let w=im.naturalWidth,h=im.naturalHeight;const k=Math.min(1,maxL/Math.max(w,h),maxS?maxS/Math.min(w,h):1);w=Math.round(w*k);h=Math.round(h*k);
  const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");g.drawImage(im,0,0,w,h);URL.revokeObjectURL(u);c.toBlob(b=>b?ok(b):no(new Error("foto")),"image/jpeg",.82)}catch(e){no(e)}};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error("foto"))};im.src=u})}
async function pubSobe(blob){const p=`${S.uid}/${(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2))}.jpg`;
  const r=await SB.storage.from("fotos").upload(p,blob,{contentType:"image/jpeg",upsert:false});if(r.error)throw r.error;return p}
function pubSnap(pid){const s=pid&&snapById(pid);return s?{id:pid,titulo:s.titulo||"",secao:s.secao||"",tag:s.tag||""}:null}

/* ---- criar ---- */
var CR=null;
function criarAbrir(tipo){if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}uso("criar_"+tipo);
  CR={tipo,fotos:[],pid:null,texto:"",fundo:Math.floor(Math.random()*PUB_FUNDOS.length),caixa:false,env:false};const vazio=!$("#layer").innerHTML;if(!vazio)closeLayer();
  $("#layer").innerHTML=`<div class="cria" role="dialog" aria-modal="true" aria-label="${tipo==="story"?"Novo story":"Novo post"}"></div>`;if(pushH())HST++;criarDesenha()}
function criarDesenha(){const el=$("#layer .cria");if(!el||!CR)return;const st=CR.tipo==="story",pode=CR.fotos.length||CR.texto.trim()||CR.pid;
  const nt=CR.pid&&pautaById(CR.pid),ntHTML=nt?`<div class="cr-nt"><small style="color:${secCor(secOf(nt))}">${esc(secNome(secOf(nt)))}</small><b>${esc(versao(nt,lente()).titulo)}</b><button type="button" data-crsemnt aria-label="Tirar a notícia">✕</button></div>`:"";
  const abas=`<div class="cr-abas" role="tablist"><button type="button" role="tab" data-crtipo="post" aria-selected="${!st}">Post</button><button type="button" role="tab" data-crtipo="story" aria-selected="${st}">Story</button></div>`;
  const topo=`<div class="cr-top"><button type="button" class="cr-x" data-close aria-label="Cancelar">${ICON.close}</button>${abas}<button type="button" class="cr-pub" data-crpub ${pode&&!CR.env?"":"disabled"}>${CR.env?"Publicando…":st?"Seu story":"Publicar"}</button></div>`;
  const inp=`<input type="file" id="cr-file" accept="image/*" ${st?"":"multiple"} hidden>`;
  if(st){const f=CR.fotos[0];
    el.innerHTML=`${topo}<div class="cr-st"><div class="cr-tela${f?" com-foto":""}" style="${f?"":"background:"+pubFundo(CR.fundo)}">${f?`<img class="cr-ft" alt="">`:""}<div class="cr-meio"><textarea id="cr-txt" class="cr-stx${CR.caixa?" caixa":""}" maxlength="300" rows="1" placeholder="${f?"Escreva algo…":"Toque para escrever"}" aria-label="Texto do story">${esc(CR.texto)}</textarea>${ntHTML}</div></div>
      <div class="cr-ferr"><button type="button" data-crfoto>${f?"Trocar foto":"Foto"}</button>${f?`<button type="button" data-crsemfoto>Sem foto</button>`:`<span class="cr-cores">${PUB_FUNDOS.map((x,i)=>`<button type="button" data-crfundo="${i}" aria-label="Fundo ${i+1}" aria-pressed="${i===CR.fundo}" style="background:${pubFundo(i)}"></button>`).join("")}</span>`}<button type="button" data-crcaixa aria-pressed="${CR.caixa}">Aa</button><button type="button" data-crnt>${CR.pid?"Trocar notícia":"Notícia"}</button></div></div>${inp}`;
    if(f){const im=el.querySelector(".cr-ft");im.src=f.prev}}
  else{el.innerHTML=`${topo}<div class="cr-post"><div class="cr-midia">${CR.fotos.length?`<div class="cr-fotos">${CR.fotos.map((f,i)=>`<div class="cr-fi"><img alt="" data-i="${i}"><button type="button" data-crtira="${i}" aria-label="Tirar foto">✕</button></div>`).join("")}${CR.fotos.length<10?`<button type="button" class="cr-mais" data-crfoto aria-label="Mais fotos">+</button>`:""}</div><small class="cr-n">${CR.fotos.length}/10 fotos</small>`
      :`<div class="cr-vz"><button type="button" class="cr-big" data-crfoto><svg class="ico" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>Fotos</button><button type="button" class="cr-big" data-crnt><svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>Notícia do Prumo</button></div>`}${ntHTML}</div>
      <div class="cr-leg">${avatar(S.uid)}<textarea id="cr-txt" maxlength="2200" rows="4" placeholder="Escreva uma legenda… (use @ para marcar amigos)" aria-label="Legenda">${esc(CR.texto)}</textarea></div>
      ${CR.fotos.length||!CR.pid?`<div class="cr-ferr">${CR.fotos.length?`<button type="button" data-crfoto>Adicionar fotos</button>`:""}<button type="button" data-crnt>${CR.pid?"Trocar notícia":"Anexar notícia"}</button></div>`:""}<p class="cr-quem">Seus amigos no Prumo vão ver.</p></div>${inp}`;
    el.querySelectorAll(".cr-fi img").forEach(im=>{im.src=CR.fotos[+im.dataset.i].prev})}
  const t=$("#cr-txt");const auto=()=>{if(!st)return;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,360)+"px"};auto();t.addEventListener("input",()=>{auto();CR.texto=t.value;const b=$("#layer [data-crpub]");if(b)b.disabled=!(CR.fotos.length||CR.texto.trim()||CR.pid)||CR.env;if(typeof menSugere==="function")menSugere(t)});
  $("#cr-file").addEventListener("change",async e=>{const fs=[...e.target.files].slice(0,st?1:10-CR.fotos.length);e.target.value="";if(!fs.length)return;
    for(const f of fs){if(!/^image\//.test(f.type)&&!/\.(jpe?g|png|heic|webp)$/i.test(f.name))continue;try{const b=await pubComprime(f,st?1920:1440,st?1080:0);const it={blob:b,prev:URL.createObjectURL(b)};if(st){if(CR.fotos.length)CR.fotos[0]=it;else CR.fotos.push(it)}else CR.fotos.push(it)}catch(err){toast("Não deu para abrir essa foto.")}}criarDesenha()})}
function criarNoticia(){const ps=ordenadas(visiveis()).slice(0,60);
  sheet("Anexar notícia",`<input class="field" id="crq" type="search" autocomplete="off" placeholder="Buscar notícia" aria-label="Buscar notícia" style="margin-bottom:10px"><ul class="cr-nl">${ps.map(p=>`<li><button type="button" data-crnts="${esc(p.id)}"><small style="color:${secCor(secOf(p))}">${esc(secNome(secOf(p)))}</small><b>${esc(versao(p,lente()).titulo)}</b></button></li>`).join("")}</ul>`);
  $("#crq")?.addEventListener("input",e=>{const n=norm(e.target.value).trim();document.querySelectorAll(".cr-nl li").forEach(li=>li.hidden=!!n&&!norm(li.textContent).includes(n))})}
async function criarPublicar(){if(!CR||CR.env)return;const st=CR.tipo==="story";if(!(CR.fotos.length||CR.texto.trim()||CR.pid))return;CR.env=true;criarDesenha();
  const fotos=[];try{for(const f of (st?CR.fotos.slice(0,1):CR.fotos))fotos.push(await pubSobe(f.blob));const at=Date.now();
    const row={autor:S.uid,tipo:CR.tipo,at,texto:CR.texto.trim().slice(0,st?300:2200),fotos,pid:CR.pid||null,snap:pubSnap(CR.pid),estilo:st?{fundo:CR.fundo,caixa:!!CR.caixa}:null};if(st)row.expira=at+86400000;
    const r=await SB.from("publicacoes").insert(row).select("id");if(r.error){try{await SB.storage.from("fotos").remove(fotos)}catch(e){}throw r.error}
    const id=r.data&&r.data[0]&&r.data[0].id;PUB.itens.unshift({...row,id});fotos.forEach((p,i)=>{PUB.urls[p]={u:CR.fotos[i].prev,exp:Date.now()+3600e3}});
    const txt=row.texto,tipo=CR.tipo;CR.fotos.forEach(f=>{});CR=null;closeLayer();toast(tipo==="story"?"Story publicado. Some em 24 horas.":"Post publicado");vibrar(10);
    if(id&&txt)pubAvisarMencoes(id,txt,tipo);pubRedesenha();setTimeout(pubCarregar,1500)}
  catch(e){if(fotos.length&&!PUB.itens.some(x=>x.fotos&&x.fotos.includes(fotos[0])))try{await SB.storage.from("fotos").remove(fotos)}catch(_){}if(CR){CR.env=false;criarDesenha()}toast(/permission|42501|row-level/i.test(String(e&&(e.message||e.code)))?"Sem permissão para publicar agora.":"Não deu para publicar. Tente de novo.")}}
async function pubAvisarMencoes(id,t,tipo){if(typeof mencionados!=="function")return;const us=mencionados(t);if(!us.length)return;const snap={titulo:(tipo==="story"?"Story":"Post")+" de "+nomeDe(S.uid)+": "+String(t).slice(0,90),upub:id};
  const res=await Promise.all(us.map(u=>dmEnviar(u,{texto:String(t).slice(0,1000),pid:"u:"+id,snap,tipo:"mencao"},true)));const ok=us.filter((u,i)=>res[i]);if(ok.length)setTimeout(()=>toast(`${ok.map(nomeDe).join(" e ")} ${ok.length>1?"foram avisados":"foi avisado(a)"} por mensagem`),900)}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
  if(t.closest("[data-criar]")){e.stopPropagation();criarMenu();return}
  if(b=t.closest("[data-criarde]")){e.stopPropagation();const tp=b.dataset.criarde;closeLayer();setTimeout(()=>criarAbrir(tp),40);return}
  if(!$("#layer .cria")&&!t.closest("[data-crnts]"))return;
  if(b=t.closest("[data-crtipo]")){e.stopPropagation();if(CR&&!CR.env){CR.tipo=b.dataset.crtipo;if(CR.tipo==="story"&&CR.fotos.length>1)toast("O story usa só a primeira foto; as outras voltam se você voltar para Post.");criarDesenha()}return}
  if(t.closest("[data-crfoto]")){e.stopPropagation();$("#cr-file")?.click();return}
  if(t.closest("[data-crsemfoto]")){e.stopPropagation();CR.fotos.shift();criarDesenha();return}
  if(b=t.closest("[data-crtira]")){e.stopPropagation();CR.fotos.splice(+b.dataset.crtira,1);criarDesenha();return}
  if(b=t.closest("[data-crfundo]")){e.stopPropagation();CR.fundo=+b.dataset.crfundo;criarDesenha();return}
  if(t.closest("[data-crcaixa]")){e.stopPropagation();CR.caixa=!CR.caixa;criarDesenha();return}
  if(t.closest("[data-crnt]")){e.stopPropagation();criarNoticia();return}
  if(t.closest("[data-crsemnt]")){e.stopPropagation();CR.pid=null;criarDesenha();return}
  if(b=t.closest("[data-crnts]")){e.stopPropagation();if(CR){CR.pid=b.dataset.crnts;closeLayer();setTimeout(criarDesenha,30)}return}
  if(t.closest("[data-crpub]")){e.stopPropagation();criarPublicar();return}},true);
function criarMenu(){if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}sheet("Criar",`<div class="opt cr-menu"><button type="button" data-criarde="post">Post<span>fotos, texto ou uma notícia, no Feed dos seus amigos</span></button><button type="button" data-criarde="story">Story<span>some em 24 horas</span></button></div>`)}
/* fechar o criador com algo escrito: pergunta antes */
{const _cl54=closeLayer;closeLayer=function(fromPop){if($("#layer .cria")&&CR&&!CR.env&&(CR.fotos.length||CR.texto.trim()||CR.pid)&&!fromPop&&!closeLayer._ok&&!($("#layer2")?.innerHTML)){if(!confirmaDescartar())return}closeLayer._ok=false;if($("#layer .cria")&&!($("#layer2")?.innerHTML))CR=null;return _cl54.apply(this,arguments)}}
function confirmaDescartar(){const b=$("#layer .cr-x");if(b&&!b.classList.contains("conf")){b.classList.add("conf");b.innerHTML="Descartar?";setTimeout(()=>{if(b.isConnected){b.classList.remove("conf");b.innerHTML=ICON.close}},2500);return false}closeLayer._ok=true;return true}
/* botão + no topo do Feed */
(function(){const f=document.querySelector(".top-in .brand");if(f&&!document.getElementById("b-criar")){f.insertAdjacentHTML("beforebegin",`<button type="button" class="icbtn" id="b-criar" data-criar aria-label="Criar post ou story" hidden><svg class="ico" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5.5"/><path d="M12 7.8v8.4M7.8 12h8.4"/></svg></button>`)}
  setInterval(()=>{const b=document.getElementById("b-criar");if(b)b.hidden=!(S.uid&&S.membro&&PUB.on!==false)},1000)})();

/* ---- posts no Feed ---- */
function pubPostHTML(x){const id="u:"+x.id,eu=x.autor===S.uid,fs=x.fotos.map(pubUrl),nt=x.pid&&pautaById(x.pid);
  let sl=fs.map(u=>`<div class="sl up-sl">${u?`<img class="up-img" src="${pubSrc(u)}" alt="" loading="lazy" decoding="async">`:`<div class="up-sem">Foto indisponível</div>`}</div>`);
  const ntSl=x.pid?`<div class="sl up-sl up-nt"><button type="button" class="up-ntc" data-capmat="${esc(x.pid)}"><small style="color:${secCor(nt?secOf(nt):(x.snap&&x.snap.secao)||"politica")}">${esc(secNome(nt?secOf(nt):(x.snap&&x.snap.secao)||"politica"))}</small><b>${esc(nt?versao(nt,lente()).titulo:(x.snap&&x.snap.titulo)||"Notícia")}</b><span>Ler a matéria ›</span></button></div>`:"";
  if(ntSl)sl.push(ntSl);const soTexto=!sl.length;if(soTexto)sl=[`<div class="sl up-sl up-tx" style="background:${pubFundo(String(x.id).charCodeAt(0))}"><p>${dmMarcaPub(x.texto)}</p></div>`];
  return `<article class="post upost" id="p-${esc(id)}" data-pid="${esc(id)}">
    <div class="ph gut"><div class="ph-t"><span class="up-au">${avatar(x.autor)}<span class="ph-nm"><b>${esc(nomeDe(x.autor))}</b><span class="ph-sub">${esc(quando(x.at))}${x.pid&&x.fotos.length?" · com notícia":""}</span></span></span><span data-otr></span></div><button type="button" class="more-btn" data-umenu="${esc(x.id)}" aria-label="Mais opções">${ICON.dots}</button></div>
    <div class="car"><div class="track">${sl.join("")}</div></div>
    <div class="gut">
      <div class="acts"><button type="button" class="act" data-a="like" aria-label="Gostei">${ICON.like}<span>Gostei</span><em class="cnt" data-n="like"></em></button><button type="button" class="act" data-a="cmt" aria-label="Comentar">${ICON.cmt}<span>Comentar</span><em class="cnt" data-n="cmt"></em></button><button type="button" class="act" data-usend="${esc(x.id)}" aria-label="Enviar">${ICON.send}<span>Enviar</span></button><span class="sp"></span>${sl.length>1?`<div class="prog pdots" aria-hidden="true">${sl.map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${sl.length}</span></div>`:""}<button type="button" class="act" data-a="save" hidden aria-hidden="true">${ICON.save}</button></div>
      <div class="likes" data-likes></div>
      ${x.texto&&!soTexto?`<p class="up-leg"><b>${esc(nomeDe(x.autor))}</b> ${dmMarcaPub(x.texto)}</p>`:""}
      <div class="pollbox" data-poll hidden></div><div data-together></div><div data-nchat></div>
      <div class="cmt-area"><div class="cmts" data-cmts></div><button type="button" class="addc" data-a="cmt">Adicione um comentário…</button></div>
    </div></article>`}
function dmMarcaPub(t){return typeof dmMarca==="function"?dmMarca(t||""):esc(t||"")}
{const _ps54=postSeguro;postSeguro=function(p){if(p&&p.__pub)try{return pubPostHTML(p.__pub)}catch(e){return ""}return _ps54.apply(this,arguments)}}
function pubMistura(lista){if(FILTRO!=="tudo"||!PUB.on)return lista;const now=Date.now();const ps=pubVisiveis().filter(x=>x.tipo==="post"&&now-x.at<30*864e5).sort((a,b)=>b.at-a.at);if(!ps.length)return lista;
  const out=lista.slice();let k=0;ps.forEach(x=>{const novo=now-x.at<48*3600e3;const pos=novo?1+k*3:Math.min(out.length,8+k*4);out.splice(Math.min(out.length,pos),0,{id:"u:"+x.id,__pub:x});k++});return out}
{const _rp54=renderPosts;renderPosts=function(){const lf=listaFeed;listaFeed=function(){return pubMistura(lf.apply(this,arguments))};try{return _rp54.apply(this,arguments)}finally{listaFeed=lf}}}
/* menu e enviar dos posts */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
  if(b=t.closest("[data-umenu]")){e.stopPropagation();const x=pubDe(b.dataset.umenu);if(!x)return;
    sheet(x.autor===S.uid?"Seu post":"Post de "+nomeDe(x.autor),`<div class="opt">${x.tipo==="post"&&x.publico!=="proximos"?`<button type="button" data-upstory="${esc(x.id)}">Compartilhar no seu story<span>${x.autor===S.uid?"seus amigos tocam e abrem o post":"só quem é amigo de "+esc(String(nomeDe(x.autor)).split(" ")[0])+" consegue abrir o post"}</span></button>`:""}${x.autor===S.uid?`${V5.on&&x.tipo==="post"?`<button type="button" data-ueditar="${esc(x.id)}">Editar legenda</button><button type="button" data-ufixar="${esc(x.id)}">${x.fixado?"Desafixar do perfil":"Fixar no perfil"}<span>até 3 aparecem primeiro na sua grade</span></button>`:""}<button type="button" data-uapagar="${esc(x.id)}" class="perigo">Apagar post<span>some para todos</span></button>`:`<button type="button" data-conversa="${esc(x.autor)}">Mandar mensagem para ${esc(nomeDe(x.autor))}</button><button type="button" data-denp="${esc(x.autor)}">Denunciar<span>o Pedro recebe e analisa</span></button>`}${x.pid?`<button type="button" data-capmat="${esc(x.pid)}">Abrir a notícia anexada</button>`:""}</div>`);return}
  if(b=t.closest("[data-uapagar]")){e.stopPropagation();if(!b.classList.contains("conf")){b.classList.add("conf");b.firstChild.textContent="Toque de novo para apagar";return}const id=b.dataset.uapagar;closeLayer();pubApagar(id);return}
  if(b=t.closest("[data-usend]")){e.stopPropagation();const x=pubDe(b.dataset.usend);if(!x)return;pubEnviar(x);return}
  if(b=t.closest("[data-open]")){const v=b.dataset.open||"";if(v.indexOf("u:")===0){e.stopPropagation();pubIrPara(v.slice(2))}}},true);
function pubEnviar(x){if(precisaConta())return;if(x.publico==="proximos"&&x.autor!==S.uid){toast(`Este post é só para os Melhores amigos de ${String(nomeDe(x.autor)).split(" ")[0]}: não dá para enviar.`);return}
  let am=amigosL().filter(u=>u!==x.autor);if(!am.length&&S.amigos.has(x.autor))am=[x.autor];if(x.publico==="proximos"&&typeof MA!=="undefined"&&MA.set)am=am.filter(u=>MA.set.has(u));if(!am.length){toast(x.publico==="proximos"?"Só dá para mandar este post para os seus Melhores amigos.":"Adicione amigos no Perfil para mandar.");return}const snap={titulo:"Post de "+nomeDe(x.autor),upub:x.id};
  sheet("Enviar",`<div class="pick dm-pick" id="pick">${am.map(u=>`<button type="button" data-pick="${esc(u)}" aria-pressed="false">${avatar(u)}<span>${esc(nomeDe(u))}</span><i class="dm-ck" aria-hidden="true"></i></button>`).join("")}</div><p class="hint">${x.autor===S.uid?"Seus amigos conseguem abrir o post.":am.length===1&&am[0]===x.autor?`${esc(nomeDe(x.autor))} recebe o próprio post na conversa de vocês.`:`Só quem também é amigo de ${esc(nomeDe(x.autor))} consegue abrir o post.`}</p>`,`<form id="sform"><input class="field" id="stext" maxlength="600" autocomplete="off" placeholder="Escreva uma mensagem (opcional)"><button class="send" id="sbtn" type="submit" disabled>Enviar</button></form>`);
  const sel=new Set();$("#pick").addEventListener("click",e=>{const b=e.target.closest("[data-pick]");if(!b)return;const u=b.dataset.pick;sel.has(u)?sel.delete(u):sel.add(u);b.setAttribute("aria-pressed",String(sel.has(u)));$("#sbtn").disabled=!sel.size;$("#sbtn").textContent=sel.size>1?"Enviar para "+sel.size:"Enviar"});
  $("#sform").addEventListener("submit",async e=>{e.preventDefault();if(!sel.size)return;const t=$("#stext").value.trim();$("#sbtn").disabled=true;const us=[...sel];const r=await Promise.all(us.map(u=>dmEnviar(u,{texto:t,pid:"u:"+x.id,snap},true)));closeLayer();const ok=us.filter((u,i)=>r[i]);toast(ok.length===us.length?`Enviado para ${ok.length>2?ok.length+" amigos":ok.map(nomeDe).join(" e ")}`:ok.length?`Enviado para ${ok.map(nomeDe).join(" e ")}; o resto não foi.`:"Não deu para enviar agora. Tente de novo.")})}
function pubIrPara(id){const x=pubDe(id);if(!x){toast("Esta publicação não está disponível para você (ou já foi apagada).");return}
  if(x.tipo==="story"){igAbrirUser(x.autor,id);return}closeLayer();FILTRO="tudo";go("feed");renderPosts();setTimeout(()=>{const el=document.getElementById("p-u:"+id);if(el)el.scrollIntoView({block:"start",behavior:"smooth"})},120)}

/* ---- stories dos amigos ---- */
function pubStoriesDe(u){const now=Date.now();return pubVisiveis().filter(x=>x.tipo==="story"&&x.autor===u&&(x.expira||0)>now).sort((a,b)=>a.at-b.at)}
function pubAutoresStory(){const now=Date.now(),m={};pubVisiveis().forEach(x=>{if(x.tipo==="story"&&(x.expira||0)>now&&x.autor!==S.uid)(m[x.autor]=m[x.autor]||[]).push(x)});
  return Object.keys(m).map(u=>({u,ult:Math.max(...m[u].map(x=>x.at)),novo:m[u].some(x=>!PUB_VISTOS.has(x.id))})).sort((a,b)=>(b.novo-a.novo)||(b.ult-a.ult))}
{const _rs54=renderSecs;renderSecs=function(){const r=_rs54.apply(this,arguments);const box=$("#secs");if(!box||$("#layer .story")||!box.classList.contains("ig"))return r;
  try{box.querySelectorAll("[data-meustory],[data-ustory]").forEach(x=>x.remove());if(!(S.uid&&S.membro&&PUB.on!==false))return r;const x0=box.scrollLeft;
    const meus=pubStoriesDe(S.uid),av=u=>`<span class="ig-f up-avf">${avatar(u)}</span>`;
    let h=`<button type="button" class="sb ig-s" data-meustory aria-label="${meus.length?"Seu story":"Criar story"}"><span class="ig-r${meus.length?(meus.every(x=>PUB_VISTOS.has(x.id))?" visto":""):" sem"}">${av(S.uid)}</span><i class="up-mais" data-criarde="story" role="button" aria-label="Criar story">+</i><b>Seu story</b></button>`;
    h+=pubAutoresStory().map(a=>`<button type="button" class="sb ig-s" data-ustory="${esc(a.u)}" aria-label="Story de ${esc(nomeDe(a.u))}"><span class="ig-r${a.novo?"":" visto"}" style="--c:${corDe(a.u)}">${av(a.u)}</span><b>${esc(String(nomeDe(a.u)).split(" ")[0])}</b></button>`).join("");
    box.insertAdjacentHTML("afterbegin",h);box.scrollLeft=x0}catch(e){}return r}}
{const _il54=igLista;igLista=function(sec){if(String(sec).indexOf("_u:")===0){const fr=pubStoriesDe(sec.slice(3));return {ps:fr,itens:fr}}return _il54.apply(this,arguments)}}
{const _sp54=stPs;stPs=function(){if(ST&&String(ST.sec||"").indexOf("_u:")===0)return ST.itens||[];return _sp54.apply(this,arguments)}}
{const _no54=igNomeSt;igNomeSt=function(sec){if(String(sec).indexOf("_u:")===0){const u=sec.slice(3);return u===S.uid?"Seu story":nomeDe(u)}return _no54.apply(this,arguments)}}
{const _so54=storyOrdem;storyOrdem=function(){const L=_so54.apply(this,arguments);if(ST&&String(ST.sec||"").indexOf("_h:")===0)return L;if(!(S.uid&&S.membro&&PUB.on))return L;
  const us=(pubStoriesDe(S.uid).length?["_u:"+S.uid]:[]).concat(pubAutoresStory().map(a=>"_u:"+a.u));return us.concat(L.filter(x=>String(x).indexOf("_u:")!==0))}}
{const _is54=igSet;igSet=function(sec,pos){if(String(sec).indexOf("_u:")===0){const fr=pubStoriesDe(sec.slice(3));let i=pos==="fim"?fr.length-1:pos==="novo"?Math.max(0,fr.findIndex(x=>!PUB_VISTOS.has(x.id))):pos||0;ST={...(ST||{}),sec,ids:fr.map(x=>"us:"+x.id),itens:fr,i:Math.max(0,i)};return fr.length}return _is54.apply(this,arguments)}}
async function igAbrirUser(u,id){await pubAssinar();const fr=pubStoriesDe(u);if(!fr.length){if(u===S.uid)criarAbrir("story");return}if($("#layer").innerHTML&&!$("#layer .story"))closeLayer();uso("story_amigo");
  let i=id?fr.findIndex(x=>x.id===id):fr.findIndex(x=>!PUB_VISTOS.has(x.id));ST={sec:"_u:"+u,ids:fr.map(x=>"us:"+x.id),itens:fr,i:Math.max(0,i),ordem:secsStory().map(s=>s.id)};drawStory()}
window.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;if(t.closest("#secs [data-criarde]")){e.stopPropagation();criarAbrir("story");return}
  const b=t.closest("#secs [data-meustory],#secs [data-ustory]");if(!b)return;e.stopPropagation();const u=b.matches("[data-meustory]")?S.uid:b.dataset.ustory;
  if(u===S.uid&&!pubStoriesDe(u).length){criarAbrir("story");return}(window.comTransicao||((o,f)=>f()))(b.querySelector(".ig-r")||b,()=>igAbrirUser(u),".story-in")},true);
function igDrawUser(){const x=ST.itens[ST.i];if(!x)return closeLayer();const u=x.autor,eu=u===S.uid,vazioS=!$("#layer").innerHTML,f=x.fotos[0]&&pubUrl(x.fotos[0]),es=x.estilo||{},nt=x.pid&&pautaById(x.pid);
  if(!IG_PREVIA&&!PUB_VISTOS.has(x.id)){PUB_VISTOS.add(x.id);try{localStorage.setItem("prumo-pub-vistos",JSON.stringify([...PUB_VISTOS].slice(-400)))}catch(e){}if(!eu)SB.from("pub_vistos").insert({pub:x.id,uid:S.uid}).then(()=>{},()=>{})}
  ST.palavras=Math.max(10,String(x.texto||"").split(/\s+/).length+(f?8:4)+(x.pid?8:0));
  const ntHTML=x.pid?`<button type="button" class="us-nt" data-stmat="${esc(x.pid)}"><small style="color:${secCor(nt?secOf(nt):"politica")}">${esc(nt?secNome(secOf(nt)):(x.snap&&x.snap.secao?secNome(x.snap.secao):"Notícia"))}</small><b>${esc(nt?versao(nt,lente()).titulo:(x.snap&&x.snap.titulo)||"Notícia")}</b><span>Ler a matéria ›</span></button>`:"";
  $("#layer").innerHTML=`<div class="story sg sg-user${f?" com-foto":""}" data-sec="_u" role="dialog" aria-modal="true" aria-label="Story de ${esc(nomeDe(u))}"><div class="story-in">
    <div class="sg-bg" style="${f?"":"background:"+pubFundo(es.fundo)}">${f?`<img src="${pubSrc(f)}" alt="" decoding="async">`:""}</div>
    ${f?`<div class="sg-sh us-sh"></div>`:""}
    <div class="bars">${ST.itens.map((_,k)=>`<i class="${k<ST.i||(k===ST.i&&!PREF.storyAuto)?"on":""}">${k===ST.i&&PREF.storyAuto?"<b></b>":""}</i>`).join("")}</div>
    <div class="s-h"><span class="sg-av us-av">${avatar(u)}</span><span class="sg-who"><b>${esc(eu?"Seu story":nomeDe(u))}</b><span>${esc(dmCurto(x.at))}</span></span><span class="s-hb"><button type="button" data-sauto aria-pressed="${!!PREF.storyAuto}" aria-label="${PREF.storyAuto?"Parar de passar sozinho":"Passar sozinho"}">${PREF.storyAuto?'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>'}</button><button type="button" data-close aria-label="Fechar">${ICON.close}</button></span></div>
    <button type="button" class="tap l" data-sgo="-1" aria-label="Anterior"></button><button type="button" class="tap r" data-sgo="1" aria-label="Próximo"></button>
    <div class="us-body">${x.texto?`<p class="us-tx${es.caixa?" caixa":""}">${dmMarcaPub(x.texto)}</p>`:""}${ntHTML}</div>
    <div class="s-f sg-f us-f">${eu?`<button type="button" class="us-vis" data-usvistos="${esc(x.id)}"><svg class="ico" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><span>Visto por…</span></button><span class="sp"></span><button type="button" class="sg-ler" data-criarde="story">+ Novo</button><button type="button" class="sg-a" data-usapagar="${esc(x.id)}" aria-label="Apagar este story"><svg class="ico" viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg></button>`
      :`<form class="sg-rp us-rp" autocomplete="off"><input type="text" maxlength="600" enterkeyhint="send" placeholder="Responder a ${esc(String(nomeDe(u)).split(" ")[0])}…" aria-label="Responder ao story"><button type="submit" class="sg-rp-b">Enviar</button></form><button type="button" class="sg-a" data-uscurtir="${esc(x.id)}" aria-label="Curtir o story">${ICON.like}</button>`}</div>
  </div></div>`;
  igWire($("#layer .story"));if(vazioS&&pushH())HST++;storyAuto(null);igEntra();
  if(eu)pubContaVistos(x.id);igPreCarrega()}
async function pubContaVistos(id){try{const r=await SB.from("pub_vistos").select("uid,at").eq("pub",id);const n=(r.data||[]).filter(v=>v.uid!==S.uid).length;const b=$(`#layer [data-usvistos="${CSS.escape(id)}"] span`);if(b)b.textContent=n?`Visto por ${n}`:"Ninguém viu ainda"}catch(e){}}
{const _ds54=drawStory;drawStory=function(){if(ST&&String(ST.sec||"").indexOf("_u:")===0){clearTimeout(ST.timer);return igDrawUser()}return _ds54.apply(this,arguments)}}
document.addEventListener("click",async e=>{const t=e.target;if(!t.closest)return;let b;
  if(b=t.closest("#layer [data-usvistos]")){e.stopPropagation();igPausa();const r=await SB.from("pub_vistos").select("uid,at").eq("pub",b.dataset.usvistos);const vs=(r.data||[]).filter(v=>v.uid!==S.uid).sort((a,c)=>c.at-a.at);
    sheet(vs.length?`Visto por ${vs.length}`:"Visto por",vs.length?`<ul class="amgl">${vs.map(v=>`<li><button type="button" class="amg-r" data-conversa="${esc(v.uid)}">${avatar(v.uid)}<span class="amg-n"><b>${esc(nomeDe(v.uid))}</b><span>${esc(dmCurto(+v.at))}</span></span></button></li>`).join("")}</ul>`:`<div class="empty" style="padding:14px 0"><b>Ninguém viu ainda</b></div>`);return}
  if(b=t.closest("#layer [data-usapagar]")){e.stopPropagation();if(!b.classList.contains("conf")){b.classList.add("conf");igPausa();toast("Toque de novo na lixeira para apagar");setTimeout(()=>b.classList.remove("conf"),3000);return}const id=b.dataset.usapagar;const ok=await pubApagar(id,true);if(ok){toast("Story apagado");const fr=pubStoriesDe(S.uid);if(!fr.length)igFechar();else{ST.itens=fr;ST.ids=fr.map(x=>"us:"+x.id);ST.i=Math.min(ST.i,fr.length-1);drawStory()}}return}
  if(b=t.closest("#layer [data-uscurtir]")){e.stopPropagation();const x=pubDe(b.dataset.uscurtir);if(!x||b.classList.contains("on"))return;b.classList.add("on","anel");vibrar(8);
    dmEnviar(x.autor,{texto:"❤️",tipo:"curtiu_story",snap:{story:{id:x.id,t:String(x.texto||"").slice(0,80),foto:!!x.fotos.length}}},true).then(ok=>{if(ok)toast("Curtida enviada para "+nomeDe(x.autor))});return}},true);
document.addEventListener("submit",async e=>{const fm=e.target.closest&&e.target.closest("#layer .us-rp");if(!fm)return;e.preventDefault();e.stopImmediatePropagation();const i=fm.querySelector("input"),t=i.value.trim();const x=ST&&ST.itens&&ST.itens[ST.i];if(!t||!x)return;
  if(precisaConta())return;i.value="";fm.classList.remove("tem");i.blur();const ok=await dmEnviar(x.autor,{texto:t,tipo:"resp_story",snap:{story:{id:x.id,t:String(x.texto||"").slice(0,80),foto:!!x.fotos.length}}},true);toast(ok?"Resposta enviada para "+nomeDe(x.autor):"Não deu para enviar. Tente de novo.")},true);

