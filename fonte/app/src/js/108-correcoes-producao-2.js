/* ---------- 108: correções da vida de vários dias de um grupo (QA de produção 2, 03/11): o lado da amiga, dois aparelhos, recarregar no meio ---------- */
/* 1. amizade desfeita/bloqueio: o anel e os posts de quem deixou de ser amigo saem do Feed na hora; amigo novo traz os posts dele */
{let k108=null;const _ra108=rerenderAll;rerenderAll=function(){const r=_ra108.apply(this,arguments);
  try{if(S.uid&&S.amigosOk){const k=S.uid+":"+[...S.amigos].sort().join(",");
    if(k108!==null&&k!==k108&&k.split(":")[0]===k108.split(":")[0]&&typeof PUB!=="undefined"&&PUB.on){const ant=new Set(k108.split(":")[1].split(","));
      document.querySelectorAll("#posts .upost[id^='p-u:']").forEach(el=>{const x=pubDe(el.id.slice(4));if(x&&x.autor!==S.uid&&!S.amigos.has(x.autor))el.remove()});
      pubRedesenha();if([...S.amigos].some(u=>!ant.has(u)))setTimeout(pubCarregar,300)}
    k108=k}}catch(e){}return r}}

/* 2. post publicado em segundo plano: fica nos rascunhos até o servidor confirmar (fechar o app no meio não perde o post) */
const PQ108_LS="prumo-pq-pend";
function pq108Le(){try{return JSON.parse(localStorage.getItem(PQ108_LS+":"+S.uid)||"[]")||[]}catch(e){return []}}
function pq108Grava(l){try{if(l.length)localStorage.setItem(PQ108_LS+":"+S.uid,JSON.stringify(l.slice(-10)));else localStorage.removeItem(PQ108_LS+":"+S.uid)}catch(e){}}
{const _pp108=edPublicaPost;edPublicaPost=function(){const ed=ED;const p=_pp108.apply(this,arguments);
  try{const j=PQ.atual;if(ed&&j&&j.ed===ed&&j.tipo==="post"&&typeof rascSalva==="function"){const P=ed.po;if(!P.rid)P.rid=edNid();const rid=P.rid,s=ED;
      ED=ed;try{rascSalva().catch(()=>{})}finally{ED=s}pq108Grava(pq108Le().filter(x=>x!==rid).concat(rid));
      Promise.resolve(p).then(()=>{if(j.estado==="ok"){pq108Grava(pq108Le().filter(x=>x!==rid));setTimeout(()=>rascApaga(rid),1500)}},()=>{})}}catch(e){}
  return p}}
setTimeout(function pq108Aviso(){if(!(S.uid&&S.membro&&S.amigosOk&&PUB.carregou)){setTimeout(pq108Aviso,1500);return}
  const l=pq108Le();if(!l.length||typeof rascLista!=="function")return;
  rascLista().then(rs=>{/* se o servidor recebeu (o app fechou antes da resposta), o rascunho sai sem aviso */
    const ja=r=>PUB.itens.some(x=>x.autor===S.uid&&x.tipo==="post"&&x.texto===r.texto&&+x.at>=r.at-120e3);
    rs.filter(r=>l.includes(r.id)&&ja(r)).forEach(r=>rascApaga(r.id));
    const ids=new Set(rs.filter(r=>!ja(r)).map(r=>r.id)),vivos=l.filter(x=>ids.has(x));pq108Grava([]);if(!vivos.length||PQ.jobs.length)return;
    toast(vivos.length>1?"Alguns posts não terminaram de publicar. Ficaram nos rascunhos.":"Um post não terminou de publicar. Ficou nos rascunhos.","Abrir",()=>{if(ED||$("#layer .ce"))return;criarAbrir("post");setTimeout(()=>{if(ED)rascAbre(vivos[vivos.length-1])},350)})}).catch(()=>{})},2500);

/* 3. rascunho da mensagem e do comentário: recarregar ou o celular fechar o app não apaga o que estava sendo escrito */
const RS108_LS="prumo-rasc-txt";
function rs108Le(){try{return JSON.parse(localStorage.getItem(RS108_LS+":"+S.uid)||"{}")||{}}catch(e){return {}}}
function rs108Grava(k,t){if(!S.uid||!k)return;try{const o=rs108Le();if(t&&t.trim())o[k]=String(t).slice(0,1000);else delete o[k];const ks=Object.keys(o);if(ks.length>40)ks.slice(0,ks.length-40).forEach(x=>delete o[x]);localStorage.setItem(RS108_LS+":"+S.uid,JSON.stringify(o))}catch(e){}}
function rs108Poe(i,k){if(!i||i.value||i._rs108===k)return;i._rs108=k;const t=rs108Le()[k];if(t){i.value=t;i.dispatchEvent(new Event("input",{bubbles:true}))}}
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.id)return;if(t.id==="mtext"&&THREAD)rs108Grava("dm:"+THREAD,t.value);else if(t.id==="ctext"&&CMT_PID)rs108Grava("cm:"+CMT_PID,t.value)});
document.addEventListener("submit",e=>{const f=e.target;if(!f)return;if(f.id==="mform"&&THREAD)rs108Grava("dm:"+THREAD,"");else if(f.id==="cform"&&CMT_PID)rs108Grava("cm:"+CMT_PID,"")},true);
{const _rm108=renderMsgs;renderMsgs=function(){const r=_rm108.apply(this,arguments);try{if(THREAD)rs108Poe($("#mtext"),"dm:"+THREAD)}catch(e){}return r}}
{const _oc108=openComments;openComments=function(pid){const r=_oc108.apply(this,arguments);try{rs108Poe($("#ctext"),"cm:"+pid)}catch(e){}return r}}

/* 4. administrador: "Denunciar" não diz "o Pedro recebe e analisa" para o próprio administrador */
{const _sh108=sheet;sheet=function(t,h){const a=[...arguments];try{if(typeof h==="string"&&S.uid&&(S.membros[S.uid]||{}).papel==="admin")a[1]=h.replace(/<span>o Pedro recebe e analisa<\/span>/g,"<span>fica na sua lista da Administração</span>")}catch(e){}return _sh108.apply(this,a)}}

/* 5. story que venceu com a pessoa olhando: o anel sai da bandeja (antes ficava lá e o toque não abria nada) */
function st108Vencidos(){try{if(!S.uid||!S.membro||typeof PUB==="undefined"||!PUB.on||$("#layer .story"))return false;
  return [...document.querySelectorAll("#secs [data-ustory]")].some(b=>{const u=b.dataset.ustory;return u&&u.charAt(0)!=="~"&&!pubStoriesDe(u).length})}catch(e){return false}}
setInterval(()=>{if(!document.hidden&&st108Vencidos())pubRedesenha()},20e3);
{const _au108=igAbrirUser;igAbrirUser=function(u){try{if(u&&u!==S.uid&&String(u).charAt(0)!=="~"&&typeof PUB!=="undefined"&&PUB.on&&!pubStoriesDe(u).length){pubRedesenha();toast("Esse story não está mais disponível.");return Promise.resolve()}}catch(e){}return _au108.apply(this,arguments)}}

/* 6. Atividade: voto na pergunta de um post aparece como voto (não "respondeu ao seu post") */
{const _ai108=atItens;atItens=function(){const l=_ai108.apply(this,arguments);try{(l||[]).forEach(x=>{if(!x||typeof x.k!=="string"||x.k.indexOf("voto:")!==0)return;const pb=AT.pubs[x.pub],cn=pb&&pb.tipo==="post"&&pb.estilo&&pb.estilo.cn;
  if(cn&&cn.k==="enq"&&typeof x.txt==="string")x.txt=x.txt.replace(/ responderam ao (?:seu post|sua pergunta)( “[^”]*”)?$/," votaram na sua pergunta$1").replace(/ respondeu ao (?:seu post|sua pergunta)( “[^”]*”)?$/," votou na sua pergunta$1")});
  /* concordância: "ao sua análise" → "à sua análise" (nomes do 107) */
  (l||[]).forEach(x=>{if(x&&typeof x.txt==="string")x.txt=x.txt.replace(/ ao sua /g," à sua ")})}catch(e){}return l}}

/* 7. Feed comprido: ao rolar, os posts que chegam ajustam a altura aos poucos (um pedaço por quadro), sem travar a rolagem.
      Antes cada lote de 6 posts media e redesenhava tudo de uma vez (até ~280 ms parado num celular médio). */
var FIT108=[];
function fit108Roda(){const t0=performance.now();while(FIT108.length&&performance.now()-t0<8){const t=FIT108.shift();if(t&&t.isConnected)try{fitTrack(t)}catch(e){}}if(FIT108.length)requestAnimationFrame(fit108Roda)}
function fit108Poe(t){if(FIT108.indexOf(t)>=0)return;FIT108.push(t);if(FIT108.length===1)requestAnimationFrame(fit108Roda)}
if(typeof FIT_IO!=="undefined"&&FIT_IO){try{FIT_IO.disconnect()}catch(e){}FIT_IO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)fit108Poe(e.target)}),{rootMargin:"900px 0px"});document.querySelectorAll(".track").forEach(t=>FIT_IO.observe(t))}
{const _cm108=carregarMais;carregarMais=function(sync){if(sync||typeof FIT_IO==="undefined"||!FIT_IO)return _cm108.apply(this,arguments);const ft=fitTrack;
  fitTrack=function(t){if(t&&t.classList&&t.classList.contains("track")){fit108Poe(t);return 0}return ft.apply(this,arguments)};try{return _cm108.apply(this,arguments)}finally{fitTrack=ft}}}

/* 8. destaque aberto pelo perfil de um amigo: fechar (✕, deslizar ou voltar do celular) volta para o perfil, não para o Feed */
{const _ad108=abrirDestaque;abrirDestaque=async function(id,u){const doPerfil=!!$("#layer .pfv:not(.pfv-arq):not(.pfv-at)")&&u!==S.uid;const r=await _ad108.apply(this,arguments);
  try{if(doPerfil&&ST&&$("#layer .story")&&typeof abrirPerfil==="function")ST._ret104=()=>abrirPerfil(u)}catch(e){}return r}}

/* 9. cartão de post/story que não existe mais (apagado, ou story de mais de 24 h): dizia "Só quem é amigo do autor consegue abrir"
      mesmo para quem é amigo, e repetia "Post de Fulano" embaixo do nome */
{const _dc108=dmCard;dmCard=function(m){let h=_dc108.apply(this,arguments);
  try{if(typeof h==="string"&&h.indexOf("dm-indisp")>=0&&dmEhPub(m)){const s=m.snap||{},t=String(s.titulo||""),mm=t.match(/^(Post|Story|Reel) de ([^:]+)$/),nome=mm&&mm[2].trim();
    if(mm)h=h.replace(`<span class="dm-ct"><b class="dm-utx">${esc(t.slice(0,160))}</b></span>`,"");
    const story=s.story===true||/^Story de /.test(t),amigo=!!nome&&(nome===nomeDe(S.uid)||amigosL().some(u=>nomeDe(u)===nome));
    if(story||amigo)h=h.replace("Só quem é amigo do autor consegue abrir",story?"Este story não está mais disponível":"Esta publicação não está mais disponível")}}catch(e){}return h}}

/* 10. depois de ver todos os stories de um amigo, o anel dele continuava colorido (como "não visto") até a bandeja ser
       redesenhada por outro motivo: ao fechar o story, os anéis da bandeja são atualizados no lugar (a ordem não muda) */
function st108Aneis(){try{document.querySelectorAll("#secs [data-ustory]").forEach(b=>{const u=b.dataset.ustory,r=b.querySelector(".ig-r");if(!r||!u||u.charAt(0)==="~")return;const xs=pubStoriesDe(u);if(!xs.length)return;
  r.classList.toggle("visto",xs.every(x=>PUB_VISTOS.has(x.id)));r.classList.toggle("ma",xs.some(x=>x.publico==="proximos"&&!PUB_VISTOS.has(x.id)))})}catch(e){}}
{const _cl108=closeLayer;closeLayer=function(){const st=!!$("#layer .story");const r=_cl108.apply(this,arguments);if(st&&!$("#layer .story"))requestAnimationFrame(st108Aneis);return r}}

/* 11. dois aparelhos: story visto no celular aparecia como não visto no computador (o "visto" só ficava no aparelho).
       Ao reler as publicações, confere no servidor quais stories ainda "não vistos" aqui já foram vistos noutro aparelho. */
let VS108_T=0;
{const _pc108=pubCarregar;pubCarregar=async function(){const r=await _pc108.apply(this,arguments);
  try{if(PUB.on&&S.uid&&Date.now()-VS108_T>5e3){const ids=pubVisiveis().filter(x=>x.tipo==="story"&&x.autor!==S.uid&&!PUB_VISTOS.has(x.id)&&(x.expira||0)>Date.now()).map(x=>x.id).slice(0,100);
    if(ids.length){VS108_T=Date.now();const q=await SB.from("pub_vistos").select("pub").eq("uid",S.uid).in("pub",ids);const vs=(q&&q.data||[]).map(x=>x.pub).filter(id=>ids.includes(id));
      if(vs.length){vs.forEach(id=>PUB_VISTOS.add(id));try{localStorage.setItem("prumo-pub-vistos",JSON.stringify([...PUB_VISTOS].slice(-400)))}catch(e){}pubRedesenha()}}}}catch(e){}return r}}
