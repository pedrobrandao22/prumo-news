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
