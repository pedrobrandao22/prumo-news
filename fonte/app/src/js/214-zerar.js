/* ===== 25/11: zerar as pendências do testador (item 3 do balanço semanal e o resto) ===== */

/* ---- item 3: toque duplo (causa toque-duplo-2) ----
   O Guardar do topo da matéria já ignorava o 2º toque; o do cartão do Feed, Curtir, Comentar, Seguir (pessoa e
   cobertura) não. Uma trava só para todos os botões de alternar: o 2º toque no mesmo botão em menos de 0,45 s é
   ignorado. E a folha que acabou de abrir não fecha com o 2º toque que cai no fundo escuro (Comentar). */
var TD214={t:{},aberta:0};
function td214Chave(b){if(!b||!b.attributes)return "";const d=[...b.attributes].filter(a=>/^data-|^aria-pressed$/.test(a.name)&&a.name!=="data-on").map(a=>a.name+"="+a.value).join("&");
  if(d)return d;const t=(b.textContent||"").trim();return /^(Seguir|Seguindo|Deixar de seguir|Seguir de volta)\b/.test(t)?"seg:"+((b.closest("[data-uid],[data-u],[data-pid],li,.card")||{}).outerHTML||"").length:""}
function td214Alterna(b){if(!b)return false;if(b.matches('[data-a="like"],[data-a="save"],[data-a="cmt"],[data-cobseg],[aria-pressed],[data-sg181],[data-seguir],[data-acao="seguindo"]'))return true;
  return /^(Seguir|Seguindo|Deixar de seguir|Guardar|Guardada|Curtir|Comentar)\b/.test((b.textContent||"").trim())&&b.closest("#posts,#layer,#layer2,#v-busca,#v-me,.bs,.sheet")!==null}
document.addEventListener("click",e=>{try{if(!e.isTrusted)return;/* só toque de verdade (clique feito por código não é toque duplo) */
  const sc=e.target&&e.target.closest&&e.target.closest("[data-scrim]");
  if(sc&&e.target===sc&&Date.now()-TD214.aberta<450){e.stopImmediatePropagation();e.preventDefault();return}
  const b=e.target&&e.target.closest&&e.target.closest("button,[role=button]");if(!b||!td214Alterna(b))return;
  const k=td214Chave(b);if(!k)return;const ag=Date.now();if(ag-(TD214.t[k]||0)<450){e.stopImmediatePropagation();e.preventDefault();return}TD214.t[k]=ag}catch(er){}},true);
{const _sh214=sheet;sheet=function(){TD214.aberta=Date.now();return _sh214.apply(this,arguments)}}
if(typeof openComments==="function"){const _oc214=openComments;openComments=function(){TD214.aberta=Date.now();return _oc214.apply(this,arguments)}}

/* ---- Apagar comentário: só um "Apagar mesmo?" armado por vez ---- */
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("button");if(!b)return;
  setTimeout(()=>{try{document.querySelectorAll(".ct210-conf").forEach(x=>{if(x!==b&&!x.contains(b)){x.classList.remove("ct210-conf");if(x.dataset.ct210tx)x.textContent=x.dataset.ct210tx}})}catch(er){}},0)},true);

/* ---- internet de volta: o aviso rosa "Sem conexão. Mostrando a edição…" sai sozinho ---- */
addEventListener("online",()=>setTimeout(()=>{try{if(navigator.onLine===false)return;if(typeof OFFLINE!=="undefined")OFFLINE=false;
  document.querySelectorAll(".late.offl").forEach(x=>x.remove());if(typeof checarFeed==="function"&&typeof FEED!=="undefined"&&FEED)checarFeed(false)}catch(e){}},1800));

/* ---- textos que ainda falavam em amigos e outros textos fixos ---- */
var TX214=[
  [/\bconversar com (os seus )?amigos\b/g,"conversar com quem você segue"],
  [/\bseus amigos tocam e abrem\b/g,"quem segue você toca e abre"],
  [/\bdo Feed dos amigos\b/g,"do Feed de quem segue você"],
  [/\bcom os seus amigos\b/g,"com quem você segue"],
  [/\bAmigos dos seus amigos\b/g,"Pessoas que quem você segue segue"],
  [/^Como seus amigos vão te ver$/,"Como as pessoas vão te ver"],
  [/^Ver mais 1 datas$/,"Ver mais 1 data"]];
function tx214Troca(t){let s=t.nodeValue;if(!s||s.length<6||!/amigos|datas/.test(s))return;let n=s;TX214.forEach(([r,v])=>{n=n.replace(r,v)});if(n!==s)t.nodeValue=n}
function tx214Passa(el){try{if(!el)return;if(el.nodeType===3){tx214Troca(el);return}if(el.nodeType!==1)return;
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode()))tx214Troca(t);
  el.querySelectorAll&&el.querySelectorAll("[placeholder]").forEach(i=>{if(/amigos/.test(i.placeholder))i.placeholder=i.placeholder.replace(/seus amigos/g,"as pessoas")})}catch(e){}}
try{new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes.forEach(tx214Passa))}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}

/* ---- Guardar para depois (post): o aviso diz que fica neste aparelho ---- */
{const _to214=toast;toast=function(m){try{if(typeof m==="string"){if(/^Texto guardado\. Toque em \+/.test(m))arguments[0]=m.replace("Texto guardado.","Texto guardado neste aparelho.");
  if(/^Removido dos guardados$/.test(m))arguments[0]="Removida das guardadas"}}catch(e){}return _to214.apply(this,arguments)}}

/* ---- Placar oficial: abre na votação que o texto cita (45 a 32), não sempre na última ---- */
function po214Escolhe(m){try{const sec=m.querySelector(".po118[data-po118]");if(!sec||sec.dataset.po214)return;sec.dataset.po214="1";
  const p=pautaById(sec.dataset.po118),l=p&&typeof po118Da==="function"&&po118Da(p);if(!l||l.length<2)return;
  const v=versao(p,lente()),tx=[v.titulo,typeof p.subtitulo==="string"?p.subtitulo:"",String(v.texto||"").slice(0,500)].join(" ");
  const k=l.findIndex(e=>e&&e.sim!=null&&e.nao!=null&&new RegExp(`\\b${e.sim} a ${e.nao}\\b`).test(tx));if(k<0||k===l.length-1)return;
  const b=sec.querySelector(`[data-po118t="${k}"]`);if(b&&b.getAttribute("aria-pressed")!=="true")setTimeout(()=>{TD214.t={};b.click()},50)}catch(e){}}
(function(){const ob=()=>{const L=document.getElementById("layer");if(!L)return false;new MutationObserver(()=>{const m=L.querySelector(".mat");if(m)po214Escolhe(m)}).observe(L,{childList:true,subtree:true});return true};
  if(!ob())document.addEventListener("DOMContentLoaded",ob)})();

/* ---- Busca (causa busca-ordem voltou em achados soltos) ----
   "13o salario", "décimo terceiro" e "cop 31" (com espaço) não achavam nada; "chuva" não achava os temporais;
   "esportes"/"política" (nome da editoria) não mostravam as notícias dela; o Calendário econômico (Caged, PIB, Copom)
   ficava de fora. */
var BU214_SIN={chuva:["temporal","temporais","tempestade","enchente","alagamento"],chuvas:["temporal","temporais","tempestade","enchente"],
  temporal:["chuva","tempestade"],enchente:["chuva","alagamento","inundacao"],cambio:["dolar"],juros:["selic","copom"],selic:["juros","copom"],
  inflacao:["ipca","focus"],bolsa:["ibovespa"],emprego:["desemprego","caged"],eleicao:["eleicoes","urna"]};
function bu214Indice(){const F=typeof FEED!=="undefined"&&FEED;if(!F)return "";if(F._bu214)return F._bu214;
  const s=bu154N((F.pautas||[]).map(p=>[(p.neutro||{}).titulo,p.tema,p.tag,p.subtema,(p.neutro||{}).texto].join(" ")).join(" ")+" "+(F.calendario||[]).map(c=>c&&c.texto).join(" ")+" "+(F.agenda||[]).map(a=>a&&a.texto).join(" "));
  try{Object.defineProperty(F,"_bu214",{value:s,enumerable:false,configurable:true})}catch(e){}return s}
function bu214Q(q){let s=String(q||"");
  s=s.replace(/\bd[eé]cimo[\s-]+terceiro\b/gi,"13").replace(/\b(\d{1,2})\s*[oºª°](?=\s|$)/gi,"$1");
  const I=bu214Indice();s=s.replace(/\b([A-Za-zÀ-ú]{2,5})\s+(\d{1,3})\b/g,(m,a,b)=>I.indexOf(bu154N(a+b))>=0&&I.indexOf(bu154N(a+" "+b))<0?a+b:m);return s}
{const _co214=bu154Coleta;bu154Coleta=function(q){const q2=bu214Q(q);let R=_co214.call(this,q2);if(!R)return R;
  try{const n=bu154N(q2).trim(),L=lente();
    /* sinônimos: só quando a palavra sozinha acha pouco */
    if(BU214_SIN[n]&&R.not.length<3){const ja=new Set(R.not.map(x=>x.id||x.url));BU214_SIN[n].forEach(w=>{const r=_co214.call(this,w);if(!r)return;
      r.not.forEach(x=>{const k=x.id||x.url;if(!ja.has(k)){ja.add(k);R.not.push(Object.assign({},x,{pt:(x.pt||0)-.5}))}});
      r.cob.forEach(c=>{if(!R.cob.some(y=>(y.p||y.d)===(c.p||c.d))&&R.cob.length<3)R.cob.push(c)})})}
    /* nome da editoria: as notícias dela primeiro */
    const sec=(FEED.secoes||[]).find(s=>s&&(bu154N(s.nome)===n||s.id===n||bu154N(s.nome)+"s"===n));
    if(sec){const ja=new Set(R.not.filter(x=>x.k==="p").map(x=>x.id));
      R.not=R.not.map(x=>x.k==="p"&&(pautaById(x.id)||{}).secao===sec.id?Object.assign({},x,{pt:(x.pt||0)+20}):x);
      (FEED.pautas||[]).filter(p=>p&&p.id&&secOf(p)===sec.id&&!ja.has(p.id)).forEach(p=>R.not.push({k:"p",id:p.id,pt:18,h:bu154Hora(ultimaAtualizacao(p)||p.hora),t:versao(p,L).titulo,tr:"",m:bu154J([secNome(secOf(p)),p.subtema,"esta edição"])}))}
    /* Calendário econômico e de provas: entra em "Na agenda" com a data */
    const hj=hojeSP(),ts=R.ts||bu154Termos(q2);(FEED.calendario||[]).forEach((c,i)=>{if(!c||!c.texto||(c.ate||c.data)<hj)return;
      if(R.agd.some(x=>bu154N(x.a.texto)===bu154N(c.texto)))return;const r=bu154Pontos(ts,{T:bu154J([c.texto,c.tipo])},bu154N(q2));
      if(r)R.agd.push({a:{texto:c.texto,data:c.data,hora:"",secao:c.secao},i:1000+i,d:c.data,pt:r.pt})});
    R.agd.sort((x,y)=>String(x.d).localeCompare(String(y.d)));
    {const K={p:0,d:1,s:1,e:2,b:3};R.not.sort((a,b)=>(K[a.k]??2)-(K[b.k]??2)||b.pt-a.pt||b.h-a.h)}
    R.n=R.cob.length+R.ent.length+R.ag.length+R.not.length+R.pes.length+R.posts.length+R.cols.length+R.agd.length}catch(e){}return R}}

/* Busca, "Na agenda": "Hoje" e "Amanhã" como na Agenda da Capa, em vez de "21 de novembro" */
if(typeof agDataLonga==="function"){const _dl214=agDataLonga;agDataLonga=function(d){try{const hj=hojeSP();if(d===hj)return "Hoje";if(typeof somaDias==="function"&&d===somaDias(hj,1))return "Amanhã"}catch(e){}return _dl214.apply(this,arguments)}}

/* ---- Coluna: com título e sem texto não abre "Antes de publicar" (coluna-so-com-titulo-vai-para-publicar-agora-com-0-palavras;
   coluna-texto-escrito-na-linha-fina-publica-coluna-vazia: o campo virou "Resumo (opcional)") ---- */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest||!t.closest("#layer > .ed132 [data-ed132painel]"))return;try{const E=ED132.E;if(!E||E.env||!String(E.tit||"").trim())return;
  try{ed132Le()}catch(_){}const tx=ed132Plano(E.html||"").replace(/^(?:## |> |- )/gm,"").replace(/\s+/g," ").trim();
  if(tx.length<2){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();toast("Sua coluna ainda não tem texto: escreva o texto antes de publicar.");
    try{const c=document.querySelector("#layer > .ed132 [contenteditable=true]");c&&c.focus()}catch(_){}}}catch(er){}},true);

/* ---- Editar texto de post: não salva o post em branco (editar-texto-para-vazio-deixa-post-em-branco-no-feed, alta) ---- */
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-uedok]");if(!b)return;try{
  const x=typeof pubDe==="function"&&pubDe(b.dataset.uedok);const sh=b.closest(".sheet")||document;const ta=sh.querySelector("textarea");if(!x||!ta)return;
  const temMais=(x.fotos||[]).length||x.pid||x.noticia||x.coluna;if(!temMais&&!ta.value.trim()){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();
    toast("O post ficaria vazio. Escreva algo ou apague o post no ⋯.");ta.focus()}}catch(er){}},true);

/* ---- Mudar meu nome: limite visível (mudar-meu-nome-corta-o-nome-em-40-letras-sem-avisar) ---- */
document.addEventListener("input",e=>{const i=e.target;if(!i||i.tagName!=="INPUT")return;const sh=i.closest(".sheet");if(!sh||!/Mudar meu nome/.test((sh.getAttribute("aria-label")||"")))return;
  const mx=+i.getAttribute("maxlength")||0;if(!mx)return;let c=sh.querySelector(".nm214-c");if(!c){c=document.createElement("p");c.className="hint nm214-c";c.style.margin="4px 0 0";i.after(c)}
  const n=i.value.length;c.textContent=n>=mx?`Chegou ao limite de ${mx} letras.`:`${n} de ${mx} letras`;c.style.color=n>=mx?"#c92a2a":""},true);

/* ---- endereço escrito no post e no comentário vira link (link-escrito-no-post-nao-vira-link), como nas Conversas ---- */
function lk214Passa(el){try{(el.matches&&el.matches(".up-leg,.up-tx,.us-tx,.up-tudo,.clist li span")?[el]:[...el.querySelectorAll(".up-leg,.up-tx,.us-tx,.up-tudo,.clist li span")]).forEach(b=>{
  if(b.dataset.lk214||!/(https?:\/\/|www\.)\S/.test(b.textContent||""))return;b.dataset.lk214="1";
  const w=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);const ns=[];let t;while((t=w.nextNode()))if(/(https?:\/\/|www\.)\S/.test(t.nodeValue)&&!t.parentElement.closest("a"))ns.push(t);
  ns.forEach(t=>{const s=document.createElement("span");s.innerHTML=dmLinka(esc(t.nodeValue));t.replaceWith(...s.childNodes)})})}catch(e){}}
try{new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)lk214Passa(n)}))}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}

/* ---- descrição do desenho = o que o app desenha (causa descricao-do-desenho: globo descrito como "nuvem de poeira",
   chaveamento como "bola de futebol", prédio de escola como "estudantes com mochilas") ---- */
{const _ia214=illAlt;illAlt=function(img){const a=_ia214.apply(this,arguments);try{if(!img)return a;const d=Object.assign({},img.dados||{},{_alt:img.alt});
  const rot=d.rotulo?`, com a etiqueta ${String(d.rotulo)}`:"";let x="";
  if(img.modelo==="escola")x="prédio de escola com relógio e bandeira";
  else if(img.modelo==="generica"||(typeof ILL!=="undefined"&&!ILL[img.modelo])){const g=gen161Tema(d);
    if(g==="neutro")return a;
    if(g==="bola"){const t=typeof ft169Esporte==="function"?ft169Esporte(d):"";x={chave:"chaveamento dos playoffs com troféu",taca:"taça",tabela:"tabela do campeonato",camisa:"camisa da seleção"}[t]||"bola de futebol em gramado"}
    else x={mundo:"globo terrestre",aviao:"avião",congresso:"prédio do Congresso",floresta:"floresta",tec:"tecnologia"}[g]||""}
  return x?`Ilustração: ${x}${rot} (sem foto desta notícia)`:a}catch(e){return a}}}

/* ---- "corrigida" no chapéu só enquanto a correção é a novidade: se a notícia foi atualizada 6 h depois da correção,
   a Capa e o Feed não marcam mais (capa-marca-a-manchete-do-ajuste-como-corrigida-por-correcao-de-sabado), como a matéria ---- */
{const _cr214=corRecente;corRecente=function(p){const r=_cr214.apply(this,arguments);if(!r)return r;try{const c=corUltima(p),us=(p.atualizacoes||[]).map(u=>u&&tms(u.hora)).filter(Boolean);
  if(c&&c.hora&&us.length&&Math.max(...us)-tms(c.hora)>6*3600e3)return false}catch(e){}return r}}

/* ===== 2ª leva 25/11 ===== */
/* sino sem conta: a tela de entrar diz que é a Atividade */
try{PC106_TX.atividade="Para ver a sua Atividade (quem curtiu, comentou ou começou a seguir você) e receber avisos, entre na sua conta.";
  PC106_TX.conversar="Para conversar com quem você segue, entre na sua conta.";PC106_TX.enviar="Para mandar notícias a quem você segue, entre na sua conta."}catch(e){}
document.addEventListener("click",e=>{try{if(e.target&&e.target.closest&&e.target.closest("[data-ativ]")&&(!S.uid||!S.membro))PC106={k:"atividade",t:Date.now()}}catch(er){}},true);

/* convite recusado: os campos de baixo ficam apagados até trocar o código, e há "Ler sem conta" */
function cv214Convite(){try{const er=document.getElementById("lerro"),f=document.getElementById("lform");if(!er||!f)return;
  const ruim=!er.hidden&&/Não achamos este convite|já foi usado|expirou/.test(er.textContent||"");
  f.querySelectorAll("input,button[type=submit]").forEach(i=>{if(i.id==="lcod")return;i.disabled=ruim;i.classList.toggle("cv214-off",ruim)});
  let b=document.getElementById("cv214-ler");if(ruim&&!b){b=document.createElement("button");b.type="button";b.id="cv214-ler";b.className="btn ghost";b.textContent="Ler as notícias sem conta";
    b.addEventListener("click",()=>{try{closeLayer()}catch(e){}});er.after(b)}else if(!ruim&&b)b.remove()}catch(e){}}
try{new MutationObserver(()=>cv214Convite()).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["hidden"]})}catch(e){}

/* guia "Primeira vez aqui?": aparece uma vez só e não depois que a pessoa já está lendo */
if(typeof ct210GuiaChip==="function"){const _gc214=ct210GuiaChip;ct210GuiaChip=function(){try{if(CT210.chip214||scrollY>40)return;CT210.chip214=1}catch(e){}return _gc214.apply(this,arguments)}}

/* ---- Feed de madrugada (decisão do Pedro 25/11, caminho C) ----
   Da meia-noite às 7h a manchete continua no topo, mas o "Acabou de sair" aparece em destaque (letra maior, logo
   abaixo do 1º cartão) e os cartões cuja última novidade é de ontem ganham o selo "de ontem". */
function md214Hora(){try{return +new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",hour:"2-digit",hour12:false}).format(new Date())}catch(e){return 12}}
function md214Passa(){try{const mad=md214Hora()<7;document.documentElement.classList.toggle("madrugada",mad);if(!mad)return;
  const hj=hojeSP();document.querySelectorAll("#posts .post[id^='p-']").forEach(a=>{if(a.dataset.md214)return;a.dataset.md214="1";const p=pautaById(a.id.slice(2));if(!p)return;
    const u=ultimaAtualizacao(p)||p.hora;if(!u||dataSP(u)===hj)return;const t=a.querySelector(".ph-t");if(t&&!t.querySelector(".md214-ontem"))t.insertAdjacentHTML("beforeend",'<span class="md214-ontem">de ontem</span>')});
  const ac=document.querySelector("#posts .ac208"),p1=document.querySelector("#posts .post[id^='p-']");if(ac&&p1&&ac.previousElementSibling!==p1&&p1.parentNode===ac.parentNode)p1.after(ac)}catch(e){}}
try{new MutationObserver(()=>{clearTimeout(md214Passa.t);md214Passa.t=setTimeout(md214Passa,120)}).observe(document.getElementById("posts")||document.body,{childList:true})}catch(e){}
setInterval(md214Passa,300e3);

/* ---- Busca > Na agenda: tocar num item abre uma folha curta com ele (antes abria a agenda inteira, do começo) ---- */
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest(".bu154-agd [data-igagenda]");if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  try{const tx=(b.querySelector("b")||{}).textContent||"",qd=(b.querySelector("span")||{}).textContent||"";
    sheet("Na agenda",`<div class="ag214"><p class="ag214-q">${esc(qd)}</p><p class="ag214-t">${esc(tx)}</p></div>`,`<button type="button" class="btn ghost" data-ag214todas>Ver a agenda toda</button>`)}catch(er){}},true);
document.addEventListener("click",e=>{if(!(e.target&&e.target.closest&&e.target.closest("[data-ag214todas]")))return;try{closeLayer()}catch(_){}
  setTimeout(()=>{try{if(typeof igAgendaSheet==="function")igAgendaSheet()}catch(_){}},250)});

/* ---- Conversa: a caixa de mensagem que cresce empurra a conversa junto (o "Visto" não fica cortado) ---- */
var DM214_H=0;
document.addEventListener("input",e=>{if(!e.target||e.target.id!=="mtext")return;requestAnimationFrame(()=>{try{const c=document.querySelector("#v-msgs .dm-comp"),v=document.getElementById("v-msgs");if(!c||!v)return;
  const h=c.getBoundingClientRect().height;if(!DM214_H)DM214_H=h;const d=h-DM214_H;DM214_H=h;v.style.paddingBottom=Math.round(h+12)+"px";if(d>0)scrollBy(0,d)}catch(er){}})},true);

/* ---- Coluna aberta pela Nova publicação: fechar no X volta para a Nova publicação (não cai no Feed) ---- */
var CL214_E=null;
window.addEventListener("click",e=>{if(e.target&&e.target.closest&&e.target.closest("#layer [data-cs123ini]"))setTimeout(()=>{try{CL214_E=ED132.E}catch(_){}},300)},true);
window.addEventListener("click",e=>{if(!(e.target&&e.target.closest&&e.target.closest("[data-ed132x]")))return;let meu=false;try{meu=!!CL214_E&&ED132.E===CL214_E}catch(_){}if(!meu)return;
  setTimeout(()=>{try{if(ED132.E||document.querySelector("#layer > .ed132"))return;CL214_E=null;if(!document.getElementById("layer").innerHTML)cn102AbreInicio()}catch(er){}},350)},true);

/* ---- Sem internet: guardar (ou qualquer redesenho da barra) não apaga a curtida que está na fila ---- */
function lk214Repoe(){try{if(typeof FD156_GOSTEI==="undefined")return;Object.keys(FD156_GOSTEI).forEach(pid=>fd156Marca(pid,!!FD156_GOSTEI[pid]))}catch(e){}}
document.addEventListener("click",e=>{if(!(e.target&&e.target.closest&&e.target.closest('[data-a="save"],[data-a="like"]')))return;if(typeof FD156_GOSTEI==="undefined"||!Object.keys(FD156_GOSTEI).length)return;
  [60,300,900].forEach(t=>setTimeout(lk214Repoe,t))});

/* ---- Link de post incompleto (#p=abc123, cortado pelo WhatsApp): avisa e limpa o endereço, em vez de cair calado na Capa ---- */
function lk214Incompleto(){try{const h=location.hash||"";if(!/^#p=/i.test(h)||/^#p=[0-9a-f-]{36}$/i.test(h))return false;
  history.replaceState(history.state,"",location.pathname+location.search);let n=0;
  const w=()=>{if(!window.__prumoPronto&&n++<60)return setTimeout(w,300);try{sheet("Post não encontrado",`<div class="ct210-pnx"><p><b>Não achamos este post.</b></p><p>O link pode estar incompleto (alguns aplicativos cortam o fim). Peça a quem mandou para enviar de novo. Dá para ler as notícias do Prumo sem conta.</p><button type="button" class="btn ct210-hoje" data-ct210hoje>Ver as notícias de hoje</button></div>`)}catch(e){}};
  setTimeout(w,200);return true}catch(e){return false}}
lk214Incompleto();addEventListener("hashchange",lk214Incompleto);

/* ---- Link de post/coluna sem conta: não chama coluna de "post" nem promete que basta ter conta (a pessoa pode ter
   escolhido "só quem me segue") ---- */
try{PC106_TX.post_link="Esta publicação (post ou coluna) é de alguém do Prumo e só aparece para quem tem conta; algumas são só para quem segue a pessoa. Entre na sua conta ou, se ainda não tem, peça um convite a quem te mandou o link."}catch(e){}
new MutationObserver(()=>{try{document.querySelectorAll("#layer .co160-pp > b").forEach(b=>{if(/^Post de /.test(b.textContent))b.textContent=b.textContent.replace(/^Post de /,"Publicação de ")});
  document.querySelectorAll("#layer .co160-pp > span").forEach(s=>{if(/^Para ver o que .+ escreveu, entre com a sua conta\.$/.test(s.textContent)&&!s.dataset.l214){s.dataset.l214=1;s.textContent=s.textContent.replace(/entre com a sua conta\./,"entre com a sua conta (se for só para seguidores, siga a pessoa).")}})}catch(e){}}).observe(document.getElementById("layer"),{childList:true,subtree:true,characterData:false});

/* ---- Editor de coluna: o 2º Enter para sair da citação/lista não cria mais uma linha vazia (o cursor fica na linha nova) ---- */
window.addEventListener("keydown",e=>{if(e.key!=="Enter"||e.shiftKey||e.isComposing)return;const cp=document.getElementById("ed132-corpo");if(!cp||!cp.contains(e.target===cp?cp:e.target))return;
  try{const s=getSelection();if(!s||!s.rangeCount||!s.isCollapsed)return;let n=s.anchorNode;while(n&&n.parentNode!==cp)n=n.parentNode;
    if(!n||n.nodeType!==1||n.tagName!=="P"||(n.textContent||"").replace(/​/g,"").trim()||n.querySelector("img,figure"))return;
    const ant=n.previousElementSibling;if(ant&&/^(BLOCKQUOTE|UL|OL)$/.test(ant.tagName)){e.preventDefault();e.stopImmediatePropagation()}}catch(er){}},true);

/* ---- Resumo cortado ("reabre na segunda…"): troca as datas relativas ANTES de cortar, para o "(23)" não ficar de fora
   e a troca por "hoje" acontecer (Para acompanhar da Capa e os demais resumos) ---- */
{const _cf=capaFrase;capaFrase=function(t,n){try{if(typeof dt185Rel==="function"&&t)t=dt185Rel(String(t))}catch(e){}return _cf.call(this,t,n)}}

/* ---- Post com foto logo abaixo da própria notícia ("Seu comentário"): sem o 2º quadro que repete a notícia de cima ---- */
{const _j=fc107Junto;fc107Junto=function(h,p){let r=_j.apply(this,arguments);try{if(!((p.__pub||{}).fotos||[]).length)return r;const tp=document.createElement("template");tp.innerHTML=r.trim();const a=tp.content.firstElementChild;
  const nt=a&&a.querySelector(".track > .up-nt");if(!nt)return r;nt.remove();const n=a.querySelectorAll(".track > .sl").length;const pd=a.querySelector(".pdots");
  if(pd){if(n<=1)pd.remove();else{const is=pd.querySelectorAll("i");if(is.length>n)is[is.length-1].remove();const pg=pd.querySelector(".pg");if(pg)pg.textContent="1/"+n}}
  r=a.outerHTML}catch(e){}return r}}

/* ---- Seguidores/Seguindo: abrir um perfil da lista e voltar reabre a lista (na mesma rolagem), não o Perfil sem ela ---- */
var SG214={ult:null,volta:null,obs:null};
{const _l=cs123Lista;cs123Lista=function(u,tipo){SG214.ult={u,tipo};return _l.apply(this,arguments)}}
{const _a=abrirPerfil;abrirPerfil=function(u){try{const lb=document.getElementById("cs123-lb");if(lb&&SG214.ult&&u!==SG214.ult.u){const sc=lb.closest(".sheet");SG214.volta={...SG214.ult,y:sc?sc.scrollTop:0}}else if(!lb)SG214.volta=null}catch(e){}
  const r=_a.apply(this,arguments);
  try{if(SG214.volta&&!SG214.obs){const L=document.getElementById("layer");SG214.obs=new MutationObserver(()=>{if(L.querySelector(".pfv"))return;SG214.obs.disconnect();SG214.obs=null;const v=SG214.volta;SG214.volta=null;
      if(!v||L.innerHTML.trim())return;setTimeout(()=>{try{if(document.getElementById("layer").innerHTML.trim())return;cs123Lista(v.u,v.tipo).then(()=>{const sc=document.querySelector("#cs123-lb")?.closest(".sheet");if(sc)sc.scrollTop=v.y})}catch(e){}},120)});
    setTimeout(()=>{try{if(SG214.obs)SG214.obs.observe(L,{childList:true})}catch(e){}},400)}}catch(e){}
  return r}}

/* ---- Perfil com novidade: a bolinha do Perfil leva a uma linha "Atividade · N novidades" no alto (antes era preciso
   achar a Atividade no fim dos ajustes da engrenagem) ---- */
function pf214Ativ(){try{const m=document.querySelector("#v-me .pf-me");if(!m)return;let b=m.querySelector(".pf214-at");const n=S.uid&&S.membro&&typeof atNovas==="function"?atNovas():0;
  if(!n){if(b)b.remove();return}const tx=`${ICON.like}<span>Atividade · ${n===1?"1 novidade":(n>9?"9+":n)+" novidades"}</span><i aria-hidden="true">›</i>`;
  if(!b){m.insertAdjacentHTML("afterbegin",`<button type="button" class="pf214-at" data-ativ>${tx}</button>`)}else if(b.dataset.n!=String(n))b.innerHTML=tx;m.querySelector(".pf214-at").dataset.n=n}catch(e){}}
{const _r=renderMe;renderMe=function(){const r=_r.apply(this,arguments);pf214Ativ();return r}}
{const _d=atDot;atDot=function(){const r=_d.apply(this,arguments);pf214Ativ();return r}}

/* ---- Nova publicação › Foto: a tela antiga "Novo post" não aparece por trás da galeria; desistir volta para a caixa ---- */
{const _an=cp206Anexo0;cp206Anexo0=function(k){if(k!=="foto")return _an.apply(this,arguments);const tx=CP152.txt,de=document.documentElement;de.classList.add("cp214-gal");
  const tira=()=>de.classList.remove("cp214-gal");let feito=false;
  const r=_an.apply(this,arguments);
  try{const f=document.getElementById("ce-pfile");if(!f){tira();return r}
    f.addEventListener("change",()=>{feito=true;setTimeout(tira,60)},{once:true});f.addEventListener("cancel",()=>{feito=true;setTimeout(tira,60)},{once:true});
    const fo=()=>{removeEventListener("focus",fo);setTimeout(()=>{if(feito)return;const E=typeof ED!=="undefined"&&ED;
      if(E&&E.po&&!(E.po.fotos||[]).length&&!(E.po.rolo&&E.po.rolo.length)){try{CP152.txt=tx;ED=null;cp152Abre({manter:true,aba:"post",semFoco:true})}catch(e){}}tira()},1500)};
    setTimeout(()=>addEventListener("focus",fo),300);setTimeout(()=>{if(!feito)tira()},120000)}catch(e){tira()}
  return r}}
/* publicar pela caixa: a tela antiga do editor não pisca por cima do Feed enquanto sai */
document.addEventListener("click",e=>{if(!(e.target&&e.target.closest&&e.target.closest("#layer [data-cp152pub],#layer [data-edpub]")))return;const de=document.documentElement;de.classList.add("cp214-pub");setTimeout(()=>de.classList.remove("cp214-pub"),1400)},true);

/* ---- Link de post sem conta › abrir a notícia › Voltar: reabre a folha "Publicação de …" (antes caía na Capa sem ela) ---- */
var PP214={id:null,volta:null};
{const _pp=co160PostPrevia;co160PostPrevia=function(id){PP214.id=id;return _pp.apply(this,arguments)}}
window.addEventListener("click",e=>{if(!(e.target&&e.target.closest&&e.target.closest("[data-co160lern]"))||!PP214.id)return;const pid=PP214.id;
  setTimeout(()=>{const L=document.getElementById("layer");let viu=false;const ob=new MutationObserver(()=>{const tem=!!L.querySelector(".mat,.mat-top,[data-mat]");if(tem){viu=true;return}
    if(viu&&!L.innerHTML.trim()){ob.disconnect();setTimeout(()=>{try{if(S.uid||document.getElementById("layer").innerHTML.trim())return;VP99_LINK=pid;PC106={k:"post_link",t:Date.now()};abrirLogin()}catch(er){}},150)}});
    ob.observe(L,{childList:true,subtree:false});setTimeout(()=>ob.disconnect(),30*60e3)},40)},true);

/* ---- Cartão do Feed: o assunto aparece uma vez só. Com a linha da cobertura no pé ("Ajuste fiscal · Câmara ›"), o topo
   fica só com a editoria e a hora ---- */
function fc214Topo(el){try{if(!el||el.dataset.fc214)return;const cb=el.querySelector(".cobbar[data-cobpag] .cb-t b");if(!cb)return;const nm=norm(cb.textContent||"");if(!nm)return;
  const st=el.querySelector(":scope>.ph .ph-sub .fd156-st")||el.querySelector(":scope>.ph .ph-sub");if(!st)return;
  [...st.childNodes].forEach(n=>{if(n.nodeType===3&&norm(n.textContent).trim()===nm)n.textContent=""});
  const s0=st.firstChild;if(s0&&s0.nodeType===3)s0.textContent=s0.textContent.replace(/^\s*·\s*/,"");el.dataset.fc214="1";
  const hr=el.querySelector(":scope>.ph .ph-sub .vn-hr");if(hr&&!(st.textContent||"").trim())hr.textContent=hr.textContent.replace(/^\s*·\s*/,"")}catch(e){}}
{const _wt=wireTracks;wireTracks=function(root){const r=_wt.apply(this,arguments);try{if(root){const ls=root.matches&&root.matches(".post.vn-cn")?[root]:[...root.querySelectorAll(".post.vn-cn")];ls.forEach(fc214Topo)}}catch(e){}return r}}

/* ---- Matéria com cotação ao vivo ({dolar} no título ou no texto): diz de quando é o número, não só a hora da rodada
   ("Atualizado às 06h52" num título de fechamento) ---- */
var MD214_PID=null;{const _am=abrirMateria;abrirMateria=function(pid){MD214_PID=pid;return _am.apply(this,arguments)}}
function md214Cot(){try{const L=document.getElementById("layer"),meta=L&&L.querySelector(".mat-meta");if(!meta||meta.querySelector(".md214-cot"))return;
  const p=MD214_PID&&pautaById(MD214_PID);if(!p)return;const tem=o=>!!(o&&typeof o==="object"&&o._m186&&Object.keys(o._m186).length);
  let viva=tem(p);if(!viva)for(const k in p){const v=p[k];if(v&&typeof v==="object"&&(tem(v)||(Array.isArray(v)&&v.some(tem)))){viva=true;break}}
  if(!viva)return;const lg=typeof ui184Legenda==="function"&&typeof ui184Itens==="function"?ui184Legenda(ui184Itens()):"";if(!lg)return;
  meta.insertAdjacentHTML("beforeend",`<span class="md214-cot"> · cotação: ${esc(lg.replace(/^Atualizad[oa]\s+/i,""))}</span>`)}catch(e){}}
new MutationObserver(md214Cot).observe(document.getElementById("layer"),{childList:true});

/* ---- Voltar para a matéria anterior: volta onde a pessoa parou, mesmo quando a matéria termina de montar depois
   (fotos, placar e quadros chegam depois dos 120 ms e a página voltava ao topo) ---- */
{const _cv=cm168Volta;cm168Volta=function(a){const r=_cv.apply(this,arguments);try{const y=a&&a.y;if(!(y>40))return r;let ult=y;
  const vai=()=>{const mm=document.querySelector("#layer .mat");if(!mm)return;const cur=mm.scrollTop;if(Math.abs(cur-ult)>30&&Math.abs(cur-y)>30&&cur>40)return;/* a pessoa já rolou: não puxa */
    mm.scrollTop=y;ult=mm.scrollTop};[250,500,900,1500,2400].forEach(t=>setTimeout(vai,t))}catch(e){}return r}}

/* ---- Depois de publicar (texto ou foto): o post fica no alto do Feed, acima da 1ª notícia, e a tela para no nome de quem
   publicou (a foto carregando empurrava o post e a tela parava no meio dele) ---- */
{const _fm=fc107Mistura;fc107Mistura=function(out,lista){const r=_fm.apply(this,arguments);try{if(!Array.isArray(r)||!S||!S.uid)return r;const ag=Date.now();
  let j=-1,at=0;r.forEach((p,i)=>{const x=p&&p.__pub;if(x&&!p.__fc107&&x.autor===S.uid&&ag-(x.at||0)<PC162_JANELA&&(x.at||0)>at){j=i;at=x.at||0}});
  if(j>0){const c=r===lista?r.slice():r;const [b]=c.splice(j,1);c.unshift(b);return c}return r}catch(e){return r}}}
{const _mo=cp152Mostra;cp152Mostra=function(id){const r=_mo.apply(this,arguments);
  const acerta=()=>{try{const el=document.getElementById("p-u:"+id);if(!el||!el.getClientRects().length)return;const top=el.getBoundingClientRect().top+scrollY-((document.querySelector(".top")||{}).offsetHeight||56)-28;
    if(Math.abs(top-scrollY)>24)scrollTo({top:Math.max(0,top),behavior:"auto"})}catch(e){}};[1300,2200,3400].forEach(t=>setTimeout(acerta,t));return r}}

/* ---- Nova conversa › Procurar pessoas: cada pessoa ganha "Conversar" (antes só "Seguir"; quem veio mandar mensagem
   tinha de seguir, fechar e voltar ao lápis) ---- */
var NC214=0;
window.addEventListener("click",e=>{if(e.target&&e.target.closest&&e.target.closest(".co160-novos [data-addamigos]"))NC214=Date.now()},true);
function nc214Pinta(){try{if(!NC214||Date.now()-NC214>10*60e3)return;const L=document.querySelector("#layer .sheet,#layer2 .sheet");if(!L)return;
  const bs=[...L.querySelectorAll("[data-sg181seg]")];if(!bs.length)return;
  const hd=L.querySelector(".sh-b")||L;if(!hd.querySelector(".nc214-h"))hd.insertAdjacentHTML("afterbegin",`<p class="hint nc214-h">Toque em <b>Conversar</b> para mandar mensagem. Perfil fechado: a pessoa vê a mensagem depois de aprovar o seu pedido para seguir.</p>`);
  bs.forEach(b=>{if(b.parentElement.querySelector("[data-nc214]"))return;b.insertAdjacentHTML("beforebegin",`<button type="button" class="btn nc214-c" data-nc214="${esc(b.dataset.sg181seg)}">Conversar</button>`)})}catch(e){}}
new MutationObserver(()=>nc214Pinta()).observe(document.body,{childList:true,subtree:true});
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-nc214]");if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const u=b.dataset.nc214;NC214=0;
  try{while(document.querySelector("#layer").innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}if(document.querySelector("#layer").innerHTML)break}}catch(_){}
  setTimeout(()=>{try{abrirConversa(u)}catch(er){}},120)},true);

/* ---- Nova publicação: a miniatura mostra a foto com o corte e o formato que vão ser publicados (mesma função que gera
   a imagem final), não a foto original inteira ---- */
function fc214Mini(){try{const E=CP152&&CP152.ed;const P=E&&E.po;if(!P||!Array.isArray(P.fotos)||!P.fotos.length)return;
  document.querySelectorAll("#layer > .cp152 img[data-fc164i]").forEach(im=>{const i=+im.dataset.fc164i,f=P.fotos[i];if(!f)return;
    const sig=JSON.stringify([P.ar,f.z||1,f.ox||0,f.oy||0,f.r||0,f.fl||"",f.b||0,f.c||0,f.s||0,i]);if(im.dataset.fc214===sig&&/^data:/.test(im.src))return;try{const bs=edBase(f);if(bs&&bs.tagName==="IMG"&&!(bs.complete&&bs.naturalWidth)){if((fc214Mini.n=(fc214Mini.n||0)+1)<30)setTimeout(fc214Mini,400);return}}catch(_){return}
    const c=document.createElement("canvas");c.width=168;try{edRenderFoto(f,c,P.ar,f.fl)}catch(e){return}
    try{const u=c.toDataURL("image/jpeg",.82);if(u&&u.length>200){im.src=u;im.dataset.fc214=sig;const t=im.closest(".fc164-t");if(t)t.style.height=Math.round(84*c.height/c.width)+"px"}}catch(e){}})}catch(e){}}
{const L=document.getElementById("layer");let tm=0;new MutationObserver(()=>{if(!L.querySelector(".cp152 img[data-fc164i]"))return;clearTimeout(tm);tm=setTimeout(fc214Mini,120)}).observe(L,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]})}

/* ---- Capa em rede lenta (1ª visita): enquanto a lista de fotos de arquivo não chega, o quadro da notícia fica só com o
   fundo; não passa pelo desenho para depois trocar pela foto (a imagem trocava duas vezes) ---- */
(function(){try{if(typeof FOTOS_ARQ!=="undefined"&&FOTOS_ARQ)return;const de=document.documentElement;de.classList.add("fa214-esp");const t0=Date.now();
  const v=()=>{if((typeof FOTOS_ARQ!=="undefined"&&FOTOS_ARQ)||Date.now()-t0>9000){setTimeout(()=>de.classList.remove("fa214-esp"),FOTOS_ARQ?250:0);return}setTimeout(v,200)};v()}catch(e){}})();
