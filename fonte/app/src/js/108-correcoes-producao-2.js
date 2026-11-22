/* ---------- 108: correções da vida de vários dias de um grupo (QA de produção 2, 03/11): o lado da amiga, dois aparelhos, recarregar no meio ---------- */
/* 1. amizade desfeita/bloqueio: o anel e os posts de quem deixou de ser amigo saem do Feed na hora; amigo novo traz os posts dele
   (agora em rerenderAll, no 201-nucleo.js) */

/* 2. post publicado em segundo plano: fica nos rascunhos até o servidor confirmar (fechar o app no meio não perde o post) */
const PQ108_LS="prumo-pq-pend";
function pq108Le(){try{return JSON.parse(localStorage.getItem(PQ108_LS+":"+S.uid)||"[]")||[]}catch(e){return []}}
function pq108Grava(l){try{if(l.length)localStorage.setItem(PQ108_LS+":"+S.uid,JSON.stringify(l.slice(-10)));else localStorage.removeItem(PQ108_LS+":"+S.uid)}catch(e){}}
/* 22/11 (corretor, achado "sem-internet-fechar-o-app-perde-o-post-e-a-curtida-prometidos"): o app aberto SEM internet
   lia a lista, não achava o post no servidor e apagava a lista (o aviso saía com a pessoa offline e depois mais nada).
   Agora espera a internet voltar e cumpre o "vamos publicar quando a internet voltar": post de texto (com ou sem notícia)
   volta para a fila e sai sozinho; post com foto ou formulário (análise, enquete…) avisa com "Publicar agora". */
function pq108Ed(r){const st=edNovoSt();return {modo:"post",tela:"cam",env:false,st,sts:[st],si:0,pq108:1,
  po:{passo:"detalhes",fotos:[],rolo:[],cur:0,ar:r.ar||"4:5",texto:r.texto||"",marcados:r.marcados||[],local:r.local||"",pid:r.pid||null,tags:[],semCom:!!r.semCom,semCurt:!!r.semCurt,aba:"filtros",rid:r.id}}}
function pq108Sozinho(r){try{return !(r.fotos&&r.fotos.length)&&!(typeof cn102RLe==="function"&&cn102RLe()[r.id])&&!!(String(r.texto||"").trim()||r.pid)}catch(e){return false}}
setTimeout(function pq108Aviso(){if(!(S.uid&&S.membro&&S.amigosOk&&PUB.carregou)){setTimeout(pq108Aviso,1500);return}
  const l=pq108Le();if(!l.length||typeof rascLista!=="function")return;
  if(navigator.onLine===false){addEventListener("online",function pq108On(){removeEventListener("online",pq108On);setTimeout(pq108Aviso,1500)});return}
  rascLista().then(rs=>{/* se o servidor recebeu (o app fechou antes da resposta), o rascunho sai sem aviso */
    const ja=r=>PUB.itens.some(x=>x.autor===S.uid&&x.tipo==="post"&&x.texto===r.texto&&+x.at>=r.at-120e3);
    rs.filter(r=>l.includes(r.id)&&ja(r)).forEach(r=>rascApaga(r.id));
    const vivos=rs.filter(r=>l.includes(r.id)&&!ja(r));pq108Grava([]);if(!vivos.length)return;
    const auto=vivos.filter(pq108Sozinho),mao=vivos.filter(r=>!auto.includes(r));
    auto.forEach(r=>{if(PQ.jobs.some(j=>j.ed&&j.ed.po&&j.ed.po.rid===r.id))return;const j=pqNovo("post",pq108Ed(r),[]);j.estado="erro";j.err=new TypeError("Failed to fetch")});
    if(auto.length){pqDesenha();clearTimeout(CR155.rt);CR155.rt=setTimeout(cr155Reenvia,300)}
    if(!mao.length)return;const um=mao.length===1,ult=mao[0].id;
    toast(um?"Um post seu não terminou de publicar.":"Alguns posts não terminaram de publicar. Ficaram nos rascunhos.",um?"Publicar agora":"Ver",()=>{if(ED||$("#layer .ce"))return;criarAbrir("post");setTimeout(()=>{if(ED)rascAbre(ult)},350)})}).catch(()=>{})},2500);

/* 3. rascunho da mensagem e do comentário: recarregar ou o celular fechar o app não apaga o que estava sendo escrito */
const RS108_LS="prumo-rasc-txt";
function rs108Le(){try{return JSON.parse(localStorage.getItem(RS108_LS+":"+S.uid)||"{}")||{}}catch(e){return {}}}
function rs108Grava(k,t){if(!S.uid||!k)return;try{const o=rs108Le();if(t&&t.trim())o[k]=String(t).slice(0,1000);else delete o[k];const ks=Object.keys(o);if(ks.length>40)ks.slice(0,ks.length-40).forEach(x=>delete o[x]);localStorage.setItem(RS108_LS+":"+S.uid,JSON.stringify(o))}catch(e){}}
function rs108Poe(i,k){if(!i||i.value||i._rs108===k)return;i._rs108=k;const t=rs108Le()[k];if(t){i.value=t;i.dispatchEvent(new Event("input",{bubbles:true}))}}
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.id)return;if(t.id==="mtext"&&THREAD)rs108Grava("dm:"+THREAD,t.value);else if(t.id==="ctext"&&CMT_PID)rs108Grava("cm:"+CMT_PID,t.value)});
document.addEventListener("submit",e=>{const f=e.target;if(!f)return;if(f.id==="mform"&&THREAD)rs108Grava("dm:"+THREAD,"");else if(f.id==="cform"&&CMT_PID)rs108Grava("cm:"+CMT_PID,"")},true);

/* 4. administrador: "Denunciar" não diz "o Pedro recebe e analisa" para o próprio administrador */

/* 5. story que venceu com a pessoa olhando: o anel sai da bandeja (antes ficava lá e o toque não abria nada) */
function st108Vencidos(){try{if(!S.uid||!S.membro||typeof PUB==="undefined"||!PUB.on||$("#layer .story"))return false;
  return [...document.querySelectorAll("#secs [data-ustory]")].some(b=>{const u=b.dataset.ustory;return u&&u.charAt(0)!=="~"&&!pubStoriesDe(u).length})}catch(e){return false}}
setInterval(()=>{if(!document.hidden&&st108Vencidos())pubRedesenha()},20e3);
{const _au108=igAbrirUser;igAbrirUser=function(u){try{if(u&&u!==S.uid&&String(u).charAt(0)!=="~"&&typeof PUB!=="undefined"&&PUB.on&&!pubStoriesDe(u).length){pubRedesenha();toast("Esse giro não está mais disponível.");return Promise.resolve()}}catch(e){}return _au108.apply(this,arguments)}}

/* 6. Atividade: voto na pergunta de um post aparece como voto (não "respondeu ao seu post") */

/* 7. Feed comprido: ao rolar, os posts que chegam ajustam a altura aos poucos (um pedaço por quadro), sem travar a rolagem.
      Antes cada lote de 6 posts media e redesenhava tudo de uma vez (até ~280 ms parado num celular médio). */
var FIT108=[];
function fit108Roda(){const t0=performance.now();while(FIT108.length&&performance.now()-t0<8){const t=FIT108.shift();if(t&&t.isConnected)try{fitTrack(t)}catch(e){}}if(FIT108.length)requestAnimationFrame(fit108Roda)}
function fit108Poe(t){if(FIT108.indexOf(t)>=0)return;FIT108.push(t);if(FIT108.length===1)requestAnimationFrame(fit108Roda)}
if(typeof FIT_IO!=="undefined"&&FIT_IO){try{FIT_IO.disconnect()}catch(e){}FIT_IO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)fit108Poe(e.target)}),{rootMargin:"900px 0px"});document.querySelectorAll(".track").forEach(t=>FIT_IO.observe(t))}

/* 8. destaque aberto pelo perfil de um amigo: fechar (✕, deslizar ou voltar do celular) volta para o perfil, não para o Feed */
{const _ad108=abrirDestaque;abrirDestaque=async function(id,u){const doPerfil=!!$("#layer .pfv:not(.pfv-arq):not(.pfv-at)")&&u!==S.uid;const r=await _ad108.apply(this,arguments);
  try{if(doPerfil&&ST&&$("#layer .story")&&typeof abrirPerfil==="function")ST._ret104=()=>abrirPerfil(u)}catch(e){}return r}}

/* 9. cartão de post/story que não existe mais (apagado, ou story de mais de 24 h): dizia "Só quem é amigo do autor consegue abrir"
      mesmo para quem é amigo, e repetia "Post de Fulano" embaixo do nome */

/* 10. depois de ver todos os stories de um amigo, o anel dele continuava colorido (como "não visto") até a bandeja ser
       redesenhada por outro motivo: ao fechar o story, os anéis da bandeja são atualizados no lugar (a ordem não muda) */
function st108Aneis(){try{document.querySelectorAll("#secs [data-ustory]").forEach(b=>{const u=b.dataset.ustory,r=b.querySelector(".ig-r");if(!r||!u||u.charAt(0)==="~")return;const xs=pubStoriesDe(u);if(!xs.length)return;
  r.classList.toggle("visto",xs.every(x=>PUB_VISTOS.has(x.id)));r.classList.toggle("ma",xs.some(x=>x.publico==="proximos"&&!PUB_VISTOS.has(x.id)))})}catch(e){}}

/* 11. dois aparelhos: story visto no celular aparecia como não visto no computador (o "visto" só ficava no aparelho).
       Ao reler as publicações, confere no servidor quais stories ainda "não vistos" aqui já foram vistos noutro aparelho. */
let VS108_T=0;
{const _pc108=pubCarregar;pubCarregar=async function(){const r=await _pc108.apply(this,arguments);
  try{if(PUB.on&&S.uid&&Date.now()-VS108_T>5e3){const ids=pubVisiveis().filter(x=>x.tipo==="story"&&x.autor!==S.uid&&!PUB_VISTOS.has(x.id)&&(x.expira||0)>Date.now()).map(x=>x.id).slice(0,100);
    if(ids.length){VS108_T=Date.now();const q=await SB.from("pub_vistos").select("pub").eq("uid",S.uid).in("pub",ids);const vs=(q&&q.data||[]).map(x=>x.pub).filter(id=>ids.includes(id));
      if(vs.length){vs.forEach(id=>PUB_VISTOS.add(id));try{localStorage.setItem("prumo-pub-vistos",JSON.stringify([...PUB_VISTOS].slice(-400)))}catch(e){}pubRedesenha()}}}}catch(e){}return r}}
