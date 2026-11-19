/* 158: matéria e coberturas (rodada de correções de 15/11, noite)
   1. "Quem noticiou": um veículo por linha (sigla e nome por extenso viram o mesmo veículo), espectro pela tabela do
      Prumo (veículo fora da tabela fica sem etiqueta, em vez de cair em "Centro"), ninguém em "Noticiaram" e em
      "Não encontramos em" ao mesmo tempo, e quem o quadro "Veículos divergem" cita entra em "Noticiaram".
   2. Cobertura com um nome só: a folha leva o nome da cobertura (ex.: "Caso Master"), não a etiqueta ("STF");
      "Coberturas que eu sigo" no lugar de "Temas que eu sigo"; "Cobertura desde"; cobertura anterior com "de 13/11".
   3. Fim da matéria: "Seguir a cobertura" segue com um toque e vira "Seguindo ✓"; Perfil ganha "Coberturas que sigo".
   4. Seguir/deixar de seguir vai para a conta na hora (e ao sair do app), não 1,5 s depois.
   5. Link de notícia que saiu da edição: abre um cartão com título, foto e resumo da página /m/ e "Ver as notícias de hoje".
   6. "Nesta matéria": marca a seção que está no alto da leitura e rola a faixa sem cortar a aba marcada.
   7. Atualizações quase iguais viram uma só.
   8. Agenda: a matéria aberta por um evento diz que é a cobertura ligada a ele. */

/* ===== 1. Veículos: identidade, nome e espectro ===== */
function mt158N(s){return norm(s).replace(/\(.*?\)/g," ").replace(/[^a-z0-9]+/g,"")}
/* apelidos → veículo (chave curta usada nos dados ou nome normalizado) */
const MT158_ALIAS={cnn:"cnnbrasil",p360:"poder360",met:"metropoles",jp:"jovempan",ab:"agenciabrasil",gp:"gazetadopovo",cc:"cartacapital",
  cb:"correiobraziliense",sbt:"sbtnews",em:"estadodeminas",im:"infomoney",ex:"exame",bbc:"bbcnewsbrasil",dw:"dwbrasil",lance:"lance",
  espn:"espnbrasil",ot:"otempo",nexo:"nexo",r7:"r7",zh:"gzh",jc:"jornaldocommercio",agsenado:"agenciasenado",agcamara:"agenciacamara",
  folha:"folha",folhadespaulo:"folha",bpmoney:"bpmoney",folhape:"folhadepernambuco",timesbrasilcnbc:"timesbrasil",
  revistaoeste:"oeste",revistaforum:"forum",diariodocentrodomundo:"dcm",bbcbrasil:"bbcnewsbrasil",bbc:"bbcnewsbrasil",
  dwbrasil:"dwbrasil",estadao:"estadao",oestadodespaulo:"estadao",valoreconomico:"valor",redebrasilatual:"rba",
  jornaldobrasil:"jb",oglobo:"oglobo",globo:"oglobo",ge:"ge",globoesporte:"ge"};
/* nome de exibição e espectro por veículo. esquerda/direita/publica seguem o que o Prumo já usava (CartaCapital à
   esquerda; Jovem Pan e Gazeta do Povo à direita; Agência Brasil e Agência Senado públicas) */
const MT158_VEIC={
  cnnbrasil:["CNN Brasil","centro"],poder360:["Poder360","centro"],metropoles:["Metrópoles","centro"],correiobraziliense:["Correio Braziliense","centro"],
  sbtnews:["SBT News","centro"],estadodeminas:["Estado de Minas","centro"],infomoney:["InfoMoney","centro"],exame:["Exame","centro"],
  bbcnewsbrasil:["BBC News Brasil","centro"],dwbrasil:["DW Brasil","centro"],lance:["Lance!","centro"],espnbrasil:["ESPN Brasil","centro"],
  otempo:["O Tempo","centro"],nexo:["Nexo","centro"],r7:["R7","centro"],gzh:["GZH","centro"],jornaldocommercio:["Jornal do Commercio","centro"],
  g1:["g1","centro"],ge:["ge","centro"],folha:["Folha","centro"],estadao:["Estadão","centro"],oglobo:["O Globo","centro"],uol:["UOL","centro"],
  valor:["Valor Econômico","centro"],veja:["Veja","centro"],istoe:["IstoÉ","centro"],band:["Band","centro"],jb:["JB","centro"],
  correiodamanha:["Correio da Manhã","centro"],congressoemfoco:["Congresso em Foco","centro"],opovo:["O Povo","centro"],atarde:["A Tarde","centro"],
  oliberal:["O Liberal","centro"],diariodepernambuco:["Diario de Pernambuco","centro"],folhadepernambuco:["Folha de Pernambuco","centro"],
  diariodograndeabc:["Diário do Grande ABC","centro"],moneytimes:["Money Times","centro"],bpmoney:["BP Money","centro"],
  timesbrasil:["Times Brasil","centro"],euronews:["Euronews","centro"],cbnrecife:["CBN Recife","centro"],cbn:["CBN","centro"],
  /* esquerda */
  cartacapital:["CartaCapital","esquerda"],brasil247:["Brasil 247","esquerda"],brasildefato:["Brasil de Fato","esquerda"],
  forum:["Revista Fórum","esquerda"],dcm:["DCM","esquerda"],rba:["Rede Brasil Atual","esquerda"],tvtnews:["TVT News","esquerda"],
  /* direita */
  jovempan:["Jovem Pan","direita"],gazetadopovo:["Gazeta do Povo","direita"],oeste:["Revista Oeste","direita"],
  oantagonista:["O Antagonista","direita"],crusoe:["Crusoé","direita"],plenonews:["Pleno News","direita"],
  /* veículos públicos */
  agenciabrasil:["Agência Brasil","publica"],agenciasenado:["Agência Senado","publica"],agenciacamara:["Agência Câmara","publica"],
  tvsenado:["TV Senado","publica"],radiosenado:["Rádio Senado","publica"],tvcamara:["TV Câmara","publica"],tvbrasil:["TV Brasil","publica"]};
/* identidade do veículo: a chave curta, o nome por extenso e o nome com a republicação entre parênteses dão o mesmo */
function mt158Id(k){const a=mt158N(k);if(MT158_ALIAS[a])return MT158_ALIAS[a];if(MT158_VEIC[a])return a;
  const b=mt158N(nomeFonte(k));if(MT158_ALIAS[b])return MT158_ALIAS[b];return b||a||String(k)}
function mt158Nome(k){const v=MT158_VEIC[mt158Id(k)];if(v)return v[0];const n=String(nomeFonte(k)||k);return n.charAt(0).toUpperCase()===n.charAt(0)||/^[a-z0-9]{1,3}$/.test(n)?n:n.charAt(0).toUpperCase()+n.slice(1)}
/* espectro: a tabela do Prumo; fora dela, só se a edição marcou algo diferente de "centro" (o robô põe "centro" em todo
   veículo novo, então "centro" fora da tabela não quer dizer nada) */
function mt158Esp(k){const v=MT158_VEIC[mt158Id(k)];if(v)return v[1];const e=(FEED&&FEED.espectro||{})[k];return e&&e!=="centro"&&ESPECTRO_NOME[e]?e:""}
/* nomes de veículo citados num texto (o quadro de divergências), do mais longo para o mais curto */
function mt158Citados(txt){if(!txt)return [];let t=" "+norm(txt).replace(/[^a-z0-9!]+/g," ")+" ";const nomes=new Map();
  Object.keys(MT158_VEIC).forEach(id=>nomes.set(norm(MT158_VEIC[id][0]).replace(/[^a-z0-9!]+/g," ").trim(),id));
  Object.keys((FEED&&FEED.fontes)||{}).forEach(k=>{const n=norm(nomeFonte(k)).replace(/\(.*?\)/g," ").replace(/[^a-z0-9!]+/g," ").trim();if(n.length>=3&&!nomes.has(n))nomes.set(n,mt158Id(k))});
  nomes.set("cnn","cnnbrasil");
  const out=[];[...nomes.keys()].filter(n=>n.length>=2).sort((a,b)=>b.length-a.length).forEach(n=>{const s=" "+n+" ";if(t.indexOf(s)>=0){const id=nomes.get(n);if(!out.includes(id))out.push(id);t=t.split(s).join(" # ")}});
  return out}
/* frase quebrada que o robô às vezes escreve no quadro */
function mt158TextoQuadro(s){return String(s||"").replace(/As fontes são atribuídas (a )?cada número\.?/gi,"Cada número está atribuído à sua fonte.")}
/* a lista de quem noticiou, um por veículo, na ordem: fontes da notícia, links, enquadramentos e citados no quadro */
function mt158Lista(p){const L=[],por={};const add=(k,cit)=>{if(!k)return;const id=mt158Id(k);if(!por[id]){por[id]={id,k,links:[],enq:[],cit:!!cit};L.push(por[id])}return por[id]};
  (p.fontes||[]).forEach(k=>add(k));(p.links||[]).forEach(l=>{const v=add(l.fonte);if(v&&l.url)v.links.push(l)});
  (p.enquadramentos||[]).forEach(e=>{const v=add(e.fonte);if(v&&e.descricao&&!v.enq.includes(e.descricao))v.enq.push(e.descricao)});
  mt158Citados((p.checagem||{}).texto).forEach(id=>{if(!por[id]){const k=Object.keys((FEED&&FEED.fontes)||{}).find(x=>mt158Id(x)===id)||(MT158_VEIC[id]?MT158_VEIC[id][0]:id);add(k,true)}});
  return L}
espectroHTML=function(p){/* 19/11 tarde: a mesma lista de "Noticiaram" (fontes, links, enquadramentos, citados), para a conta bater */const vs=mt158Lista(p).map(v=>mt158Esp(v.k)).filter(Boolean);if(!vs.length)return "";
  const c={};vs.forEach(e=>c[e]=(c[e]||0)+1);const ord=["direita","centro","publica","esquerda"].filter(k=>c[k]);
  return `<div class="spec"><span class="lbl">Quem cobriu</span><div class="bar">${ord.map(k=>`<i style="width:${(100*c[k]/vs.length).toFixed(1)}%;background:${ESPECTRO_COR[k]}"></i>`).join("")}</div><div class="lg">${ord.map(k=>`<span><i style="background:${ESPECTRO_COR[k]}"></i>${ESPECTRO_NOME[k]}: ${c[k]}</span>`).join("")}</div><p class="hint">Classificação aproximada do Prumo, pela linha editorial predominante de cada veículo.</p></div>`};

/* ===== 2. Cobertura com um nome só ===== */
function mt158Titulo(t){const s=document.querySelector("#layer2 .sheet .sh-h")||document.querySelector("#layer .sheet .sh-h");if(!s||!t)return;
  const n=[...s.childNodes].find(x=>x.nodeType===3);if(n)n.nodeValue=t;else s.insertBefore(document.createTextNode(t),s.firstChild);
  const sh=s.closest(".sheet");if(sh)sh.setAttribute("aria-label",t)}
function mt158Periodo(d){const a=d.inicio?cobSP(d.inicio):"",b=d.ultima?cobSP(d.ultima):"";if(a&&b&&a!==b)return a+" a "+b;return (b||a)?"de "+(b||a):""}
{const _ad158=abrirDormente;abrirDormente=function(id){const r=_ad158.apply(this,arguments);try{const d=(FEED.dormentes||[]).find(x=>x.id===id);const box=document.querySelector(".sheet .pc");if(!d||!box)return r;
    mt158Titulo(d.tema||d.tag||"Cobertura anterior");
    const m=box.querySelector(".pc-m");if(m){const s=[...m.querySelectorAll("span")].find(x=>!x.classList.contains("cst"));if(s)s.textContent=mt158Periodo(d)}
    const st=box.querySelector(".pc-m .cst.enc");if(st)st.textContent="Cobertura anterior";
    const h=box.querySelector(".hint:last-child");if(h)h.textContent=`Esta cobertura é ${mt158Periodo(d)||"de outra edição"} e saiu da edição. O resumo fica aqui; se o assunto voltar, ela reaparece no feed com o histórico.`;
    /* foto e resumo da página da notícia (/m/), quando ela existe */
    mt158Pagina(id).then(pg=>{const b=document.querySelector(".sheet .pc");if(!pg||!b||b.dataset.mt158===id)return;b.dataset.mt158=id;
      if(pg.img&&!b.querySelector(".mt158-foto"))b.insertAdjacentHTML("afterbegin",`<img class="mt158-foto" src="${escU(pg.img)}" alt="" loading="lazy" onerror="this.remove()">`);
      if(pg.desc&&(!d.resumo||pg.desc.length>d.resumo.length+20)&&norm(pg.desc)!==norm(d.resumo||"")){const l=b.querySelector(".lead");if(l)l.textContent=pg.desc;else b.querySelector("h2")?.insertAdjacentHTML("afterend",`<p class="lead">${esc(pg.desc)}</p>`)}}).catch(()=>{})
  }catch(e){}return r}}
/* Ajustes do app: "Coberturas que eu sigo" */
{const _aj158=ajustesHTML;ajustesHTML=function(){let h=_aj158.apply(this,arguments);try{h=h.replace("<b>Temas que eu sigo</b>","<b>Coberturas que eu sigo</b>").replace("Use os três pontinhos de um post para seguir um tema. Ele sobe no feed e marca quando houver atualização.","Toque em “Seguir a cobertura” numa notícia (ou nos três pontinhos de um post). Ela sobe no feed e marca quando houver atualização.").replace("<b>Temas silenciados</b>","<b>Assuntos silenciados</b>")}catch(e){}return h}}

/* ===== 3. Fim da matéria: seguir com um toque ===== */
function mt158SegBt(p){const tema=temaDe(p),on=seguido(p);
  return `<div class="mt158-seg"><button type="button" class="btn${on?" ghost":""}" data-mt158seg="${esc(p.id)}" aria-pressed="${on}">${on?`Seguindo “${esc(tema)}” ✓`:`Seguir a cobertura “${esc(tema)}”`}</button><button type="button" class="mt158-ver" data-cobpag="${esc(p.id)}">Ver a cobertura ›</button></div>`}
function mt158SegPinta(){document.querySelectorAll("[data-mt158seg]").forEach(b=>{const p=pautaById(b.dataset.mt158seg);if(!p)return;const on=seguido(p),tema=temaDe(p);
  b.setAttribute("aria-pressed",String(on));b.classList.toggle("ghost",on);b.textContent=on?`Seguindo “${tema}” ✓`:`Seguir a cobertura “${tema}”`})}
/* matéria aberta por um evento da agenda */
var MT158_AG=null;
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const b=t.closest("#v-capa .cp-l [data-capair]");if(!b)return;
  const ul=b.closest(".cp-l"),h=ul&&ul.previousElementSibling;if(!h||!/^Agenda/.test(h.textContent||""))return;
  MT158_AG={pid:b.dataset.capair,texto:(b.querySelector("b")||{}).textContent||"",dia:((b.querySelector(".s")||{}).textContent||"").trim(),t:Date.now()}},true);
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const b=t.closest("[data-mt158seg]");if(!b)return;e.stopPropagation();
  const p=pautaById(b.dataset.mt158seg);if(!p)return;const on=!seguido(p);cobSegue(temaDe(p),on);mt158SegPinta();toast(on?"Seguindo “"+temaDe(p)+"”: ela sobe no feed":"Deixou de seguir “"+temaDe(p)+"”");
  try{if(VIEW==="feed"){const y=scrollY;renderPosts(true);window.scrollTo(0,y)}}catch(er){}},true);
/* seguir pela folha também atualiza o botão da matéria por trás */
{const _cs158=cobSegue;cobSegue=function(){const r=_cs158.apply(this,arguments);try{mt158SegPinta();mt158Salva()}catch(e){}return r}}

/* ===== 3b. Perfil: "Coberturas que sigo" ===== */
function mt158Seguidas(){return Object.keys(PREF.seguindo||{}).map(k=>({k,nome:PREF.seguindo[k]}))}
function mt158SegLinha(){const n=mt158Seguidas().length;if(!n)return "";
  return `<button type="button" class="pf-cols mt158-pf" data-mt158cobs><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4z"/></svg><span><b>Coberturas que sigo</b><small>${n} ${n===1?"cobertura":"coberturas"} · sobem no feed</small></span><i aria-hidden="true">›</i></button>`}
/* sem conta: o Perfil não tem cabeçalho, então a linha entra no alto da tela */
function mt158AbreSeguidas(){const l=mt158Seguidas();uso("coberturas_seguidas");
  const ps=FEED&&FEED.pautas||[],dm=FEED&&FEED.dormentes||[];
  sheet("Coberturas que sigo",l.length?`<ul class="mt158-cl">${l.map(x=>{const p=ps.find(q=>norm(temaDe(q))===x.k),d=!p&&dm.find(q=>norm(q.tema||q.tag||"")===x.k);
    return `<li><span>${p?`<button type="button" class="mt158-cn" data-cobpag="${esc(p.id)}">${esc(x.nome)}</button><small>no ar · ${esc(quando(ultimaAtualizacao(p)||p.hora))}</small>`:d?`<button type="button" class="mt158-cn" data-dorm="${esc(d.id)}">${esc(x.nome)}</button><small>fora da edição: avisamos se voltar</small>`:`<b>${esc(x.nome)}</b><small>fora da edição: avisamos se voltar</small>`}</span><button type="button" class="btn ghost" data-mt158des="${esc(x.k)}">Deixar de seguir</button></li>`}).join("")}</ul><p class="hint">As coberturas que você segue sobem no feed e aparecem em “Do que você segue”.</p>`:`<p class="hint">Você ainda não segue nenhuma cobertura. No fim de uma notícia, toque em “Seguir a cobertura”.</p>`)}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest("[data-mt158cobs]")){e.preventDefault();e.stopPropagation();mt158AbreSeguidas();return}
  const d=t.closest("[data-mt158des]");if(d){e.stopPropagation();const k=d.dataset.mt158des,nome=(PREF.seguindo||{})[k];if(PREF.seguindo)delete PREF.seguindo[k];salvarPrefs();mt158Salva();uso("deixar_cob");
    const li=d.closest("li");if(li)li.remove();toast(nome?"Deixou de seguir “"+nome+"”":"Deixou de seguir");mt158SegPinta();try{if(VIEW==="me")renderMe()}catch(er){}
    if(!document.querySelector(".mt158-cl li"))mt158AbreSeguidas()}},true);

/* ===== 4. Preferências vão para a conta na hora ===== */
var MT158_PEND=false;
{const _sp158=salvarPrefs;salvarPrefs=function(){const r=_sp158.apply(this,arguments);try{MT158_PEND=!!(S.db&&S.uid&&S.membro)}catch(e){}return r}}
/* grava agora o que estava esperando os 1,5 s do salvarPrefs */
function mt158Salva(){if(!MT158_PEND)return Promise.resolve(false);MT158_PEND=false;try{clearTimeout(prefTimer)}catch(e){}
  if(!S.db||!S.uid||!S.membro)return Promise.resolve(false);
  try{return Promise.resolve(S.db.doc(`data/users/${S.uid}/prefs`).set(JSON.parse(JSON.stringify(PREF)))).then(()=>true,()=>{MT158_PEND=true;return false})}catch(e){return Promise.resolve(false)}}
/* seguir/deixar de seguir/silenciar pelos botões antigos (três pontinhos, Ajustes) também grava na hora */
document.addEventListener("click",e=>{const t=e.target;if(t&&t.closest&&t.closest("button[data-tema],[data-cobseg],[data-dormseg]"))setTimeout(mt158Salva,0)});
document.addEventListener("visibilitychange",()=>{if(document.hidden)mt158Salva()});
window.addEventListener("pagehide",()=>{mt158Salva()});

/* ===== 5. Link de notícia que saiu da edição ===== */
const MT158_PAG={};
/* título, resumo e foto da página /m/<id>.html (a mesma da prévia do WhatsApp); null se não existe */
function mt158Pagina(id){if(!/^[\w-]{1,80}$/.test(String(id||"")))return Promise.resolve(null);if(MT158_PAG[id])return MT158_PAG[id];
  MT158_PAG[id]=fetch("m/"+id+".html",{cache:"no-cache"}).then(r=>r.ok?r.text():null).then(tx=>{if(!tx||!/og:title/.test(tx))return null;
    const d=new DOMParser().parseFromString(tx,"text/html"),mt=n=>((d.querySelector(`meta[property="${n}"]`)||{}).content||"").trim();
    const desc=mt("og:description").replace(/\s*\((?:Foto|Imagem)[^)]*\)\s*$/i,"").replace(/\s*\((?:Foto|Imagem)[^()]*\([^)]*\)\)\s*$/i,"").trim();
    const img=mt("og:image");return {titulo:mt("og:title"),desc,img:/^https:\/\//.test(img)&&!/og-padrao/.test(img)?img:""}}).catch(()=>null);
  return MT158_PAG[id]}
var MT158_LINK=null;
function mt158Fora(pid){if(MT158_LINK===pid)return;MT158_LINK=pid;
  const dm=(FEED&&FEED.dormentes||[]).find(x=>x.id===pid);
  if(dm){if(VIEW!=="capa")go("capa");setTimeout(()=>{if(!$("#layer").innerHTML)abrirDormente(pid)},80);return}
  mt158Pagina(pid).then(pg=>{if(pautaById(pid)){if(!$("#layer").innerHTML)abrirMateria(pid);return}if($("#layer").innerHTML)return;uso("link_fora");
    sheet(pg?"Notícia de outra edição":"Notícia não encontrada",pg?`<div class="mt158-fora">${pg.img?`<img class="mt158-foto" src="${escU(pg.img)}" alt="" onerror="this.remove()">`:""}<h3>${esc(pg.titulo)}</h3>${pg.desc?`<p class="lead">${esc(pg.desc)}</p>`:""}<p class="hint">Esta notícia é de uma edição anterior e saiu da Capa. Procure o assunto na Busca para ver o que saiu depois.</p></div>`
      :`<p class="hint" style="margin:0">Não encontramos a notícia deste link. Ela pode ser antiga ou o link pode estar incompleto.</p>`,
      `<button type="button" class="btn" data-mt158hoje>Ver as notícias de hoje</button>${pg?`<button type="button" class="btn ghost" data-mt158busca="${esc(pg.titulo)}">Buscar o assunto</button>`:""}`)})}
{const _lt158=linkTentar;linkTentar=function(){const pid=LINK_PID;const r=_lt158.apply(this,arguments);
  try{if(pid&&LINK_PID===pid&&FEED&&!pautaById(pid)){
    /* a edição em mãos não tem a notícia: espera um pouco a edição nova (o feed inteiro), depois mostra o cartão */
    if(!mt158LinkTentar._t)mt158LinkTentar._t=setInterval(mt158LinkTentar,400);mt158Pagina(pid)}
    else if(pid&&!LINK_PID)MT158_LINK=pid}catch(e){}return r}}
function mt158LinkTentar(){const pid=LINK_PID;if(!pid){clearInterval(mt158LinkTentar._t);mt158LinkTentar._t=0;return}
  if(FEED&&pautaById(pid)){linkTentar();return}
  const espera=(typeof FL119!=="undefined"&&FL119&&FL119.parcial)?5000:2500;
  if(Date.now()-LINK_T0>espera&&FEED){LINK_PID=null;clearInterval(mt158LinkTentar._t);mt158LinkTentar._t=0;mt158Fora(pid)}}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest("[data-mt158hoje]")){e.stopPropagation();closeLayer();if(VIEW!=="capa")go("capa");return}
  const b=t.closest("[data-mt158busca]");if(b){e.stopPropagation();const q=b.dataset.mt158busca;closeLayer();setTimeout(()=>{try{go("busca");const i=document.querySelector("#v-busca input[type=search],#v-busca input");if(i){i.value=q.split(/[;:,]/)[0];i.dispatchEvent(new Event("input",{bubbles:true}))}}catch(er){}},120)}},true);

/* ===== 6. "Nesta matéria": seção marcada e faixa ===== */
/* marca a última seção cujo começo já chegou ao terço de cima da área de leitura (antes: a 40 px da faixa, e a seção
   anterior ficava marcada enquanto a seguinte já ocupava a tela) */
/* depois de tocar num capítulo, ele fica marcado até a pessoa rolar por conta própria (no fim da matéria o seguinte também
   cabe no terço de cima e roubava a marca) */
var MT158_CAPTAP=null;

/* ===== 7. Atualizações quase iguais ===== */
function mt158Pal(s){return new Set(norm(s).replace(/[^a-z0-9]+/g," ").split(" ").filter(w=>w.length>2))}
function mt158Par(a,b){const A=mt158Pal(a),B=mt158Pal(b);if(!A.size||!B.size)return 0;let n=0;A.forEach(w=>{if(B.has(w))n++});return n/Math.min(A.size,B.size)}
/* da mais nova para a mais antiga: some a que repete quase tudo de uma mais nova que ficou (a mais nova já traz o que mudou) */
function mt158Ups(arr){if(!Array.isArray(arr)||arr.length<2)return arr;const ord=arr.filter(x=>x&&x.texto).slice().sort((a,b)=>tms(b.hora)-tms(a.hora));const fica=[];
  ord.forEach(u=>{if(/^Correção: /.test(u.texto)||!fica.some(f=>!/^Correção: /.test(f.texto)&&mt158Par(f.texto,u.texto)>=.75))fica.push(u)});
  return fica.length===ord.length?arr:arr.filter(u=>fica.includes(u))}
