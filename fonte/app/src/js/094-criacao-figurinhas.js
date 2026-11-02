/* ---------- Criação: figurinhas editadas no próprio story, bandeja com busca, figurinha de foto e caneta no estilo Instagram ---------- */
/* Tudo aqui só embrulha funções globais anteriores (075, 074, 071). Formato salvo: o mesmo de antes + "cor" (0–4) opcional nas figurinhas tocáveis. */
var FG2=null;
const FG2_NCORES=5;
const FG2_EDITA=["perg","quiz","enq","cont","slid","add","local","hash"];
const FG2_COM_COR=["perg","quiz","enq","cont","slid","add"];
const FG2_SLID=["😍","😂","🔥","😮","😢","👏","💯","🇧🇷"];
const FG2_I=d=>`<svg class="fg2-i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const FG2_ICO={
  local:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  men:'<circle cx="12" cy="12" r="3.6"/><path d="M15.6 12v1.4a2.6 2.6 0 0 0 5.2 0V12a8.8 8.8 0 1 0-3.4 6.9"/>',
  hora:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  foto:'<rect x="3.5" y="5" width="17" height="14" rx="3.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 17l4.5-4.5 4 4 2.5-2.5 4 3.5"/>',
  perg:'<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-7L7.5 21v-3.5H5A1.5 1.5 0 0 1 3.5 16V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M10.3 9.6a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.5-.7 1v.2"/><path d="M12 14.6v.1"/>',
  enq:'<path d="M5 7h8M5 12h14M5 17h5"/>',
  quiz:'<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.5 2.5 4.9-5.2"/>',
  slid:'<path d="M3.5 12h17"/><circle cx="15" cy="12" r="3.4"/>',
  cont:'<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2.2 1.6M9.5 3.5h5"/>',
  link:'<path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M13.5 10.5a4 4 0 0 0-5.7 0L5 13.3a4 4 0 0 0 5.7 5.7l1-1"/>',
  add:'<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  hash:'<path d="M10 4L8 20M16 4l-2 16M5 9h15M4 15h15"/>',
  selfie:'<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8L10 4h4l1.7 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.3"/>',
  nt:'<path d="M5 5h11v14H7a2 2 0 0 1-2-2z"/><path d="M16 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 12.5h5M8 16h3"/>',
  busca:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  cal:'<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>'};
/* ordem e nomes da bandeja (só figurinhas que já existem no Prumo, mais a Foto) */
const FG2_FIGS=[["local","Local","local localizacao lugar cidade onde"],["men","Menção","mencao mencionar marcar amigo amiga pessoa arroba @"],["hora","","hora data dia relogio horario semana"],["foto","Foto","foto imagem galeria recorte"],
  ["perg","Perguntas","perguntas pergunta caixa responder resposta"],["enq","Enquete","enquete votacao votar pesquisa sim nao opiniao"],["quiz","Quiz","quiz teste resposta certa adivinhe"],["slid","Slider de emoji","slider emoji nota avaliar escala"],
  ["cont","Contagem","contagem regressiva data evento lembrete prazo"],["link","Link","link site endereco url pagina"],["add","Adicione o seu","adicione o seu corrente participar desafio"],["hash","Hashtag","hashtag tema # assunto"],
  ["selfie","Selfie","selfie camera rosto foto"],["nt","Notícia","noticia materia prumo jornal manchete"]];
const FG2_EMOJIS=[["😀","sorriso feliz alegre"],["😂","rindo risada chorando de rir"],["🤣","gargalhada rolando de rir"],["😍","apaixonado amor olhos de coracao"],["🥰","carinho fofo amor"],["😘","beijo"],["🥹","emocionado comovido"],["😎","legal oculos escuros"],
  ["🤩","incrivel estrelas"],["🥳","festa comemorar aniversario"],["🤔","pensando duvida hmm"],["🤯","chocado cabeca explodindo"],["😮","surpreso uau"],["😢","triste lagrima"],["😭","chorando muito"],["😡","bravo raiva irritado"],
  ["🙄","revirando os olhos tedio"],["😴","sono dormindo cansado"],["👍","joinha positivo legal"],["👎","negativo nao gostei"],["👏","palmas aplausos parabens"],["🙌","celebrar maos para cima"],["🙏","por favor obrigado reza"],["💪","forca"],
  ["🤝","acordo aperto de mao"],["👀","olhos olhando de olho"],["❤️","coracao amor vermelho"],["💔","coracao partido"],["🔥","fogo quente"],["✨","brilho"],["💯","cem perfeito"],["🎉","festa confete"],
  ["🎂","bolo aniversario"],["⚽","futebol bola jogo"],["🏆","trofeu campeao"],["📰","jornal noticia"],["🗳️","urna voto eleicao"],["💸","dinheiro gasto"],["📈","alta subindo grafico"],["📉","queda descendo grafico"],
  ["☕","cafe"],["🍺","cerveja"],["🍕","pizza comida"],["🌧️","chuva"],["☀️","sol calor"],["🌙","lua noite"],["🇧🇷","brasil bandeira"],["✅","certo feito ok"],["❌","errado nao"],["⚠️","atencao alerta cuidado"],["📍","local pino"],["🎶","musica"]];
const fg2Anim=()=>{try{return typeof ANIM_OK==="function"&&ANIM_OK()}catch(e){return false}};
const fg2CorN=e=>{const n=Math.floor(+(e&&e.cor));return e&&e.t!=="texto"&&n>=1&&n<FG2_NCORES?n:0};
const fg2Pad=n=>String(n).padStart(2,"0");

/* ===== bandeja ===== */
edFigs=function(){if(!ED||$("#layer .ce-fig"))return;const hora=esc(hhmm(new Date().toISOString()).replace("h",":"));
  const ov=document.createElement("div");ov.className="ce-fig fg2"+(fg2Anim()?" anim":"");
  ov.innerHTML=`<div class="ce-figp" role="dialog" aria-label="Figurinhas"><div class="grab"></div>
    <label class="fg2-busca">${FG2_I(FG2_ICO.busca)}<input id="ce-figq" type="search" placeholder="Buscar figurinhas e emojis" autocomplete="off" enterkeyhint="search" aria-label="Buscar figurinhas"></label>
    <div class="ce-figs fg2-chips">${FG2_FIGS.map(([k,n,b])=>`<button type="button" data-edfig="${k}" class="fg2-c fg2-k-${k}" data-busca="${esc(norm(n+" "+b))}">${FG2_I(FG2_ICO[k])}<span>${k==="hora"?hora:esc(n)}</span></button>`).join("")}</div>
    <p class="fg2-h" id="fg2-hemo">Emojis</p><div class="ce-emos fg2-emos">${FG2_EMOJIS.map(([x,b])=>`<button type="button" data-edemo="${x}" data-busca="${esc(b)}" aria-label="${esc(b.split(" ")[0])}">${x}</button>`).join("")}</div>
    <p class="fg2-nada" id="fg2-nada" hidden>Nada encontrado</p></div>`;
  $("#layer .ce").appendChild(ov);
  $("#ce-figq").addEventListener("input",e=>{const n=norm(e.target.value).trim();let vc=0,ve=0;
    ov.querySelectorAll("[data-busca]").forEach(b=>{const v=!n||b.dataset.busca.includes(n);b.hidden=!v;if(v){if(b.dataset.edemo)ve++;else vc++}});
    $("#fg2-hemo").hidden=!ve;ov.querySelector(".fg2-chips").hidden=!vc;$("#fg2-nada").hidden=!!(vc||ve)})};

/* ===== novas figurinhas não caem umas em cima das outras ===== */
{const _ad=edAdd;edAdd=function(e){const o={x:.5,y:.5,...e};let n=0;
  while(n++<6&&ED&&ED.st.els.some(x=>Math.abs((+x.x||0)-o.x)<.14&&Math.abs((+x.y||0)-o.y)<.1)){o.y+=.12;if(o.y>.84)o.y=.2}
  return _ad.call(this,o)}}

/* ===== edição no próprio story ===== */
function fg2Novo(k){const b={id:edNid(),t:k,x:.5,y:.46,s:1,r:0,cor:0};
  if(k==="quiz")return {...b,q:"",o:["",""],c:0};if(k==="enq")return {...b,q:"",o:["",""]};
  if(k==="cont"){const d=new Date(Date.now()+864e5);d.setMinutes(0,0,0);d.setHours(d.getHours()+1);return {...b,q:"",ate:d.getTime()}}
  if(k==="slid")return {...b,q:"",emo:"😍"};if(k==="local"||k==="hash")return {...b,tx:"",y:.3};return {...b,q:""}}
const fg2Ta=(id,v,max,ph)=>`<textarea id="${id}" class="fe-q" rows="1" maxlength="${max}" placeholder="${esc(ph)}" enterkeyhint="done">${esc(v||"")}</textarea>`;
function fg2QuizLinha(e,i){const L="ABCD"[i],certa=i===(+e.c||0);return `<div class="fg-qo fe-qo${certa?" certa":""}" data-i="${i}"><button type="button" data-fqc="${i}" aria-label="Marcar a opção ${L} como certa" aria-pressed="${certa}"><i>${certa?"✓":L}</i></button><input id="fo${i}" maxlength="30" placeholder="Opção ${L}" value="${esc(e.o[i]||"")}" enterkeyhint="next"></div>`}
function fg2EnqLinha(e,i){return `<span class="fe-eo"><input id="fe-o${i}" maxlength="24" placeholder="${["Sim","Não","Opção 3","Opção 4"][i]}" value="${esc(e.o[i]||"")}" aria-label="Opção ${i+1}">${i>1?`<button type="button" data-fedel="${i}" aria-label="Tirar a opção">✕</button>`:""}</span>`}
function fg2Card(e){const c=fg2CorN(e),cc=c?" fgc-"+c:"";
  if(e.t==="perg")return `<div class="fg-c fg-perg${cc}"><b>${fg2Ta("fq",e.q,90,"Faça uma pergunta")}</b><div class="fg-in">Toque para responder</div></div>`;
  if(e.t==="add")return `<div class="fg-c fg-add${cc}"><small>ADICIONE O SEU</small><b>${fg2Ta("fq",e.q,90,"Mostre o seu…")}</b><span class="fg-addb">+ Adicionar o seu</span></div>`;
  if(e.t==="quiz"){let n=2;e.o.forEach((x,i)=>{if(String(x||"").trim())n=Math.max(n,i+2)});n=Math.min(4,Math.max(n,e.o.length,(+e.c||0)+1));
    return `<div class="fg-c fg-quiz${cc}"><b>${fg2Ta("fq",e.q,90,"Faça uma pergunta")}</b><div class="fe-os">${Array.from({length:n},(_,i)=>fg2QuizLinha(e,i)).join("")}</div></div>`}
  if(e.t==="enq")return `<div class="ce-enq fe-enq${cc}"><b>${fg2Ta("ce-eq",e.q,80,"Faça uma pergunta…")}</b><div class="ce-eo">${e.o.map((_,i)=>fg2EnqLinha(e,i)).join("")}</div>${e.o.length<4?`<button type="button" class="fe-add" data-feadd>+ adicionar</button>`:""}</div>`;
  if(e.t==="slid")return `<div class="fg-c fg-slid${cc}"><b>${fg2Ta("fq",e.q,80,"Faça uma pergunta…")}</b><div class="fg-tr"><i class="fg-fill" style="width:50%"></i><span class="fg-emo" style="left:50%">${esc(e.emo||"😍")}</span></div></div>`;
  if(e.t==="cont"){const d=new Date(+e.ate||Date.now()+864e5);
    return `<div class="fg-c fg-cont${cc}"><b><input id="fq" class="fe-q" maxlength="40" placeholder="Nome da contagem" value="${esc(e.q||"")}" enterkeyhint="done"></b><div class="fg-cd" data-ate="${+e.ate||0}">${edCdTxt(e.ate)}</div>
      <div class="fe-dt"><label>${FG2_I(FG2_ICO.cal)}<input type="date" id="fd" aria-label="Dia" value="${d.getFullYear()}-${fg2Pad(d.getMonth()+1)}-${fg2Pad(d.getDate())}"></label><label>${FG2_I(FG2_ICO.hora)}<input type="time" id="fh" aria-label="Hora" value="${fg2Pad(d.getHours())}:${fg2Pad(d.getMinutes())}"></label></div></div>`}
  if(e.t==="local")return `<div class="fg-local fe-pill"><i>📍</i><input id="fq" maxlength="40" placeholder="LOCAL" value="${esc(e.tx||"")}" aria-label="Local" enterkeyhint="done"></div>`;
  if(e.t==="hash")return `<div class="fg-hash fe-pill"><span>#</span><input id="fq" maxlength="40" placeholder="HASHTAG" value="${esc(String(e.tx||"").replace(/^#/,""))}" aria-label="Hashtag" enterkeyhint="done"></div>`;
  return ""}
function fg2Extra(e){if(e.t==="quiz")return `<p class="fe-dica">Toque na letra da resposta certa</p>`;
  if(e.t==="slid")return `<div class="fe-emos" role="radiogroup" aria-label="Emoji do slider">${FG2_SLID.map(x=>`<button type="button" data-femo="${x}" role="radio" aria-checked="${x===(e.emo||"😍")}" class="${x===(e.emo||"😍")?"on":""}">${x}</button>`).join("")}</div>`;
  if(e.t==="cont")return `<p class="fe-dica">Escolha o dia e a hora em que a contagem acaba</p>`;return ""}
function fg2Abre(k,el){if(!ED||!$("#layer .ce"))return;$("#layer .ce-fig")?.remove();$("#layer .ce-sel")?.remove();$("#layer .ce-fe")?.remove();
  const e=el?{...el,o:Array.isArray(el.o)?el.o.slice():el.o}:fg2Novo(k);if(e.t==="quiz"||e.t==="enq"){e.o=(e.o||[]).slice(0,4);while(e.o.length<2)e.o.push("")}
  FG2={e,el:el||null};const cvw=$("#ce-cv")?.clientWidth||Math.min(innerWidth,innerHeight*9/16);
  const ov=document.createElement("div");ov.className="ce-fe"+(fg2Anim()?" anim":"");ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Editar figurinha");ov.style.setProperty("--bw",Math.min(cvw*1.15,innerWidth*.98)+"px");
  ov.innerHTML=`<div class="ce-top fe-top">${FG2_COM_COR.includes(e.t)?`<button type="button" class="fe-cor" data-fecor aria-label="Trocar a cor da figurinha"><i></i></button>`:""}<span class="sp"></span><button type="button" class="ce-ok" data-edfok>Concluído</button></div>
    <div class="fe-box"><div class="fe-card">${fg2Card(e)}</div>${fg2Extra(e)}</div>`;
  $("#layer .ce").appendChild(ov);$("#layer .ce").classList.add("fe-on");if(el)$(`#ce-els [data-eid="${el.id}"]`)?.classList.add("editando");
  fg2Liga(ov);setTimeout(()=>{const f=ov.querySelector("#fq,#ce-eq");if(f){f.focus();try{f.setSelectionRange(f.value.length,f.value.length)}catch(_){}}},40)}
function fg2Auto(ta){if(ta&&ta.tagName==="TEXTAREA"){ta.style.height="auto";ta.style.height=ta.scrollHeight+"px"}}
function fg2Liga(ov){ov.querySelectorAll("textarea.fe-q").forEach(fg2Auto);
  /* botões não tiram o foco do campo (o teclado não fecha) */
  ov.addEventListener("mousedown",e=>{if(e.target.closest("button"))e.preventDefault()});
  ov.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.matches("textarea.fe-q")){e.preventDefault();const nx=ov.querySelector("#fo0,#fe-o0");if(nx)nx.focus();else fg2Ok()}});
  ov.addEventListener("input",e=>{const t=e.target;if(!FG2)return;fg2Auto(t);
    if(FG2.e.t==="quiz"&&/^fo\d$/.test(t.id)){const i=+t.id.slice(2),box=ov.querySelector(".fe-os"),n=box.children.length;if(t.value.trim()&&i===n-1&&n<4){fg2Le();box.insertAdjacentHTML("beforeend",fg2QuizLinha(FG2.e,n))}}
    if(t.id==="fd"||t.id==="fh"){fg2Le();const cd=ov.querySelector(".fg-cd");if(cd){cd.dataset.ate=+FG2.e.ate||0;cd.innerHTML=edCdTxt(FG2.e.ate)}}});
  ov.addEventListener("change",e=>{if(e.target.id==="fd"||e.target.id==="fh"){fg2Le();const cd=ov.querySelector(".fg-cd");if(cd){cd.dataset.ate=+FG2.e.ate||0;cd.innerHTML=edCdTxt(FG2.e.ate)}}})}
/* lê o que está nos campos */
function fg2Le(){const F=FG2;if(!F)return;const e=F.e,ov=$("#layer .ce-fe");if(!ov)return;const v=s=>ov.querySelector(s);
  if(e.t==="enq"){if(v("#ce-eq"))e.q=v("#ce-eq").value;e.o=e.o.map((x,i)=>v("#fe-o"+i)?v("#fe-o"+i).value:x)}
  else if(e.t==="local"||e.t==="hash"){if(v("#fq"))e.tx=v("#fq").value}
  else if(v("#fq"))e.q=v("#fq").value;
  if(e.t==="quiz"){const n=ov.querySelectorAll(".fe-os input").length;const o=[];for(let i=0;i<Math.max(n,e.o.length);i++)o.push(v("#fo"+i)?v("#fo"+i).value:(e.o[i]||""));e.o=o.slice(0,4)}
  if(e.t==="cont"){const d=v("#fd")&&v("#fd").value,h=v("#fh")&&v("#fh").value;if(d){const t=new Date(d+"T"+(h||"00:00")).getTime();if(t)e.ate=t}}}
function fg2RefazCard(foco){const ov=$("#layer .ce-fe");if(!ov||!FG2)return;ov.querySelector(".fe-card").innerHTML=fg2Card(FG2.e);ov.querySelectorAll("textarea.fe-q").forEach(fg2Auto);if(foco){const f=ov.querySelector(foco);if(f)f.focus()}}
function fg2Fecha(){$("#layer .ce-fe")?.remove();$("#layer .ce")?.classList.remove("fe-on");FG2=null}
/* Concluído: valida, grava no story; figurinha vazia é descartada */
function fg2Ok(){const F=FG2;if(!F||!ED)return fg2Fecha();fg2Le();const e=F.e,k=e.t,q=String(e.q||"").trim();let v=null;
  if(k==="perg"||k==="add"){if(q)v={q}}
  else if(k==="slid"){if(q)v={q,emo:e.emo||"😍"}}
  else if(k==="quiz"){const os=e.o.map(x=>String(x||"").trim());const keep=os.map((x,i)=>[x,i]).filter(x=>x[0]);
    if(q||keep.length){if(keep.length<2){toast("Escreva pelo menos duas opções.");return false}if(!os[+e.c||0]){toast("A resposta certa precisa ter texto. Toque na letra dela.");return false}
      v={q:q||"Quiz",o:keep.map(x=>x[0]),c:keep.findIndex(x=>x[1]===(+e.c||0))}}}
  else if(k==="enq"){const os=e.o.map(x=>String(x||"").trim());if(q||os.some(Boolean)){const o=os.map((x,i)=>x||(i===0?"Sim":i===1?"Não":"")).filter(Boolean);v={q,o}}}
  else if(k==="cont"){if(q){const t=+e.ate||0;if(!t||t<Date.now()+60000){toast("Escolha uma data no futuro.");return false}v={q,ate:t}}}
  else if(k==="local"||k==="hash"){let tx=String(e.tx||"").trim();if(k==="hash")tx=tx.replace(/[#\s]/g,"");if(tx)v={tx}}
  if(v&&FG2_COM_COR.includes(k))v.cor=fg2CorN(e);
  fg2Fecha();
  if(v){if(F.el){Object.assign(F.el,v);if(!v.cor)delete F.el.cor;edDesenha()}else{const n={id:e.id,t:k,x:e.x,y:e.y,s:1,r:0,...v};if(!n.cor)delete n.cor;edAdd(n)}}
  else{if(F.el)ED.st.els=ED.st.els.filter(x=>x!==F.el);edDesenha()}
  return true}
/* tocar numa figurinha: volta a editar; foto troca o formato; hora troca para data */
const FG2_FORMAS=["rr","circ","coracao","estrela"];
function fg2Hora(f){const d=new Date();try{if(f===1)return d.toLocaleDateString("pt-BR",{day:"numeric",month:"short",timeZone:"America/Sao_Paulo"}).replace(/\./g,"").replace(" de "," ").toUpperCase();
  if(f===2)return d.toLocaleDateString("pt-BR",{weekday:"long",timeZone:"America/Sao_Paulo"}).split("-")[0].toUpperCase()}catch(e){}return hhmm(d.toISOString()).replace("h",":")}
{const _te=edToqueEl;edToqueEl=function(el){if($("#layer .ce-fe"))return;
  if(el&&FG2_EDITA.includes(el.t)){if(el.t==="add"&&el.ref)return;return fg2Abre(el.t,el)}
  if(el&&el.t==="img"&&el.ft){el.forma=FG2_FORMAS[(FG2_FORMAS.indexOf(el.forma)+1)%FG2_FORMAS.length];edEls();vibrar(6);return}
  if(el&&el.t==="hora"){el.fmt=((+el.fmt||0)+1)%3;el.tx=fg2Hora(el.fmt);edEls();vibrar(6);return}
  return _te.apply(this,arguments)}}

/* ===== cor das figurinhas: no editor, no story publicado e no que vai para o servidor ===== */
{const _fh=edFigHTML;edFigHTML=function(e){if(e&&e.t==="img"&&e.ft)return fg2ImgHTML(e);let h=_fh.apply(this,arguments);const c=fg2CorN(e);if(c&&h)h=h.replace('class="fg-c ',`class="fg-c fgc-${c} `);return h}}
{const _eh=edElHTML;edElHTML=function(e){let h=_eh.apply(this,arguments);const c=fg2CorN(e);if(c&&e.t==="enq")h=h.replace('class="ce-enq"',`class="ce-enq fgc-${c}"`);return h}}
{const _ie=edItemExtra;edItemExtra=(e,o)=>{o=_ie(e,o);const c=fg2CorN(e);if(c&&FG2_COM_COR.includes(e.t))o.cor=c;if(e.t==="enq"){o.q=String(e.q||"").slice(0,80);o.o=(e.o||[]).slice(0,4).map(x=>String(x).slice(0,24))}return o}}
{const _pl=pubLimpa;pubLimpa=function(x){const es=x&&x.estilo,cs=es&&!es.__ok&&Array.isArray(es.itens)?es.itens.slice(0,12).map(e=>e&&typeof e==="object"&&e.t!=="texto"?e.cor:null):null;const r=_pl.apply(this,arguments);
  try{if(cs&&x.estilo&&Array.isArray(x.estilo.itens))x.estilo.itens.forEach((e,i)=>{const n=Math.floor(+cs[i]);if(e&&FG2_COM_COR.includes(e.t)&&n>=1&&n<FG2_NCORES)e.cor=n})}catch(e){}return r}}
/* enquete no story publicado: até 4 opções e com cor (as chaves dos votos são as mesmas de antes) */
function fg2EnqVivo(x,e,n){const key=n?"us:"+x.id+"#e"+n:"us:"+x.id,vs=votosDe(key),mv=meuVoto(key),os=(Array.isArray(e.o)?e.o:[]).slice(0,4),fora=mv!=null&&!(S.uid in vs);
  const tot=Object.keys(vs).length+(fora?1:0),cont=os.map((_,i)=>Object.values(vs).filter(v=>v===i).length+(fora&&mv===i?1:0)),res=mv!=null||x.autor===S.uid,c=fg2CorN(e);
  const tr=`left:${(+e.x||0)*100}%;top:${(+e.y||0)*100}%;transform:translate(-50%,-50%) rotate(${+e.r||0}deg) scale(${Math.max(.2,Math.min(6,+e.s||1))})`;
  return `<div class="ce-el us-it" style="${tr}"><div class="ce-enq us-enq${res?" res":""}${c?" fgc-"+c:""}"><b>${esc(e.q||"")}</b><div class="ce-eo">${os.map((o,i)=>{const p=tot?Math.round(cont[i]/tot*100):0;return `<button type="button" data-usvoto="${esc(x.id)}" data-n="${n}" data-i="${i}" class="${mv===i?"meu":""}" style="--p:${p}%"><span>${esc(o)}</span>${res?`<i>${p}%</i>`:""}</button>`}).join("")}</div>${x.autor===S.uid?`<small>${tot} ${tot===1?"voto":"votos"}</small>`:""}</div></div>`}
{const _ui=usItensHTML;usItensHTML=function(x){const it=(x&&x.estilo&&x.estilo.itens)||[];if(!it.some(e=>e&&e.t==="enq"&&((Array.isArray(e.o)&&e.o.length>2)||fg2CorN(e))))return _ui.apply(this,arguments);
  let ne=0;const meus=[];const it2=it.map(e=>{if(e&&e.t==="enq"){meus.push([e,ne++]);return {t:"_enq",x:.5,y:.5,s:1,r:0}}return e});
  const h=_ui.call(this,{...x,estilo:{...x.estilo,itens:it2}});return h+meus.map(([e,n])=>fg2EnqVivo(x,e,n)).join("")}}

/* ===== figurinha de foto (fica gravada na imagem do story) ===== */
const FG2_PATHS={coracao:"M50 90C22 70 4 53 4 32 4 16 16 6 29 6c9 0 16 5 21 13C55 11 62 6 71 6c13 0 25 10 25 26 0 21-18 38-46 58z",
  estrela:(()=>{let d="";for(let i=0;i<10;i++){const a=(-90+i*36)*Math.PI/180,r=i%2?21:49;d+=(i?"L":"M")+(50+r*Math.cos(a)).toFixed(1)+" "+(53+r*Math.sin(a)).toFixed(1)}return d+"Z"})()};
const fg2Mask=f=>{const d=FG2_PATHS[f];if(!d)return "";const u=`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='${d}'/></svg>`)}")`;return `-webkit-mask:${u} center/100% 100% no-repeat;mask:${u} center/100% 100% no-repeat`};
function fg2ImgTam(e){const d=.46;if(e.forma&&e.forma!=="rr")return [d*.86,d*.86];const ar=Math.max(.6,Math.min(1.6,+e.ar||1));return ar>=1?[d,d/ar]:[d*ar,d]}
function fg2ImgHTML(e){const [w,h]=fg2ImgTam(e),f=FG2_FORMAS.includes(e.forma)?e.forma:"rr";
  return `<div class="fg-img fgi fgi-${f}" style="width:calc(var(--bw,360px)*${w.toFixed(4)});height:calc(var(--bw,360px)*${h.toFixed(4)})"><img alt="" draggable="false" src="${esc(e.src||"")}" style="${esc(fg2Mask(f))}"></div>`}
function fg2ImgPath(f,w,h){const p=new Path2D();
  if(f==="circ")p.arc(0,0,w/2,0,Math.PI*2);
  else if(FG2_PATHS[f])p.addPath(new Path2D(FG2_PATHS[f]),new DOMMatrix().translate(-w/2,-h/2).scale(w/100,h/100));
  else{const r=Math.min(w,h)*.087,x=-w/2,y=-h/2;p.moveTo(x+r,y);p.arcTo(x+w,y,x+w,y+h,r);p.arcTo(x+w,y+h,x,y+h,r);p.arcTo(x,y+h,x,y,r);p.arcTo(x,y,x+w,y,r);p.closePath()}return p}
{const _pe=edPintaEl;edPintaEl=function(g,e,W,H){if(!(e&&e.t==="img"&&e.ft))return _pe.apply(this,arguments);if(!e._img)return;
  const [w0,h0]=fg2ImgTam(e),w=w0*W,h=h0*W,f=FG2_FORMAS.includes(e.forma)?e.forma:"rr",p=fg2ImgPath(f,w,h);
  g.save();g.translate(e.x*W,e.y*H);g.rotate((e.r||0)*Math.PI/180);g.scale(e.s||1,e.s||1);
  g.save();g.shadowColor="rgba(0,0,0,.32)";g.shadowBlur=W*.03;g.shadowOffsetY=W*.008;g.fillStyle="#000";g.fill(p);g.restore();
  g.save();g.clip(p);const iw=e._img.naturalWidth||e._img.width,ih=e._img.naturalHeight||e._img.height,k=Math.max(w/iw,h/ih);g.drawImage(e._img,-iw*k/2,-ih*k/2,iw*k,ih*k);g.restore();g.restore()}}
function fg2Foto(){const ce=$("#layer .ce");if(!ce)return;$("#ce-figfoto")?.remove();const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.id="ce-figfoto";inp.hidden=true;ce.appendChild(inp);
  inp.addEventListener("change",async()=>{const f=inp.files&&inp.files[0];inp.remove();if(!f||!ED)return;try{const r=await edCarrega(f,1080);if(!ED)return;const iw=r.img.naturalWidth,ih=r.img.naturalHeight;
    edAdd({t:"img",ft:1,forma:"rr",src:r.url,_img:r.img,ar:+(iw/ih).toFixed(3),y:.42,s:1});vibrar(8)}catch(e){toast("Não deu para abrir essa foto.")}});
  inp.click()}

/* ===== caneta ===== */
const FG2_PEN=[["caneta","Caneta",'<path d="M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5z"/><path d="M14 7l3 3"/>'],
  ["mk","Marcador",'<path d="M13.2 4.6l6.2 6.2-6.9 6.9H7.3v-6.2z"/><path d="M7.3 17.7L4.5 20.5h5.2l2-2"/><path d="M10.4 8.5l5.1 5.1"/>'],
  ["neon","Neon",'<path d="M5 19.5l.9-3.6L14.8 7a1.9 1.9 0 0 1 2.7 2.7L8.6 18.6z"/><path d="M18.5 3v2.6M17.2 4.3h2.6M20.5 9.5v1.6M19.7 10.3h1.6"/>'],
  ["bor","Borracha",'<path d="M9 19.5h11"/><path d="M4.9 14.6l8.5-8.5a2 2 0 0 1 2.8 0l2.7 2.7a2 2 0 0 1 0 2.8l-7.4 7.4H9.4z"/><path d="M8.6 10.9l5.6 5.6"/>']];
const fg2Ferr=c=>c.bor?"bor":c.mk?"mk":c.neon?"neon":"caneta";
edCaneta=function(){if(!ED||$("#layer .ce-cn"))return;ED.st.ferr="caneta";const c=ED.st.caneta=ED.st.caneta||{cor:"#ffffff",w:.012,bor:false,neon:false,mk:false};
  const ov=document.createElement("div");ov.className="ce-cn cn2"+(c.bor?" bor":"")+(fg2Anim()?" anim":"");
  ov.innerHTML=`<div class="ce-top"><button type="button" class="ce-b" data-edcndesf aria-label="Desfazer">${EDI.desf}</button><span class="sp"></span>
      <div class="cn2-ferr" role="radiogroup" aria-label="Pincel">${FG2_PEN.map(([k,n,d])=>`<button type="button" class="cn2-f" data-edcnt="${k}" role="radio" aria-checked="${fg2Ferr(c)===k}" aria-label="${n}" title="${n}">${FG2_I(d)}</button>`).join("")}</div>
      <span class="sp"></span><button type="button" class="ce-ok" data-edcnok>Concluído</button></div>
    <div class="cn2-tam" id="cn2-tam" role="slider" tabindex="0" aria-orientation="vertical" aria-label="Espessura" aria-valuemin="4" aria-valuemax="40" aria-valuenow="${Math.round(c.w*1000)}"><svg class="cn2-tr" viewBox="0 0 24 200" preserveAspectRatio="none" aria-hidden="true"><path d="M1.5 4a10.5 3 0 0 1 21 0L13.6 196a1.6 1.6 0 0 1-3.2 0z" vector-effect="non-scaling-stroke"/></svg><i class="cn2-pt" id="cn2-pt"></i></div>
    <i class="cn2-dot" id="cn2-dot" hidden></i>
    ${ED._cnDica?"":`<p class="cn2-dica" id="cn2-dica">Segure no story para pintar o fundo</p>`}
    <div class="ce-cores">${ED_CORES.map(x=>`<button type="button" data-edcncor="${x}" style="background:${x}" aria-label="Cor ${x}" aria-pressed="${x===c.cor}"></button>`).join("")}</div>`;
  $("#layer .ce").appendChild(ov);$("#layer .ce").classList.add("desenhando");if(!ED._cnDica){ED._cnDica=1;setTimeout(()=>{const d=$("#cn2-dica");if(d)d.classList.add("some")},3200)}
  fg2TamPos();fg2Tam()};
function fg2TamPos(){const c=ED&&ED.st.caneta,pt=$("#cn2-pt"),sl=$("#cn2-tam");if(!c||!pt)return;const f=(40-Math.round(c.w*1000))/36;pt.style.top=(Math.max(0,Math.min(1,f))*100)+"%";if(sl)sl.setAttribute("aria-valuenow",String(Math.round(c.w*1000)))}
function fg2Dot(mostra){const d=$("#cn2-dot"),c=ED&&ED.st.caneta,cv=$("#ce-cv");if(!d||!c)return;if(!mostra){d.hidden=true;return}
  const px=Math.max(4,c.w*(cv?cv.clientWidth:360)*(c.mk?1.6:1));d.hidden=false;d.style.setProperty("--d",px+"px");d.className="cn2-dot "+fg2Ferr(c);d.style.setProperty("--c",c.cor)}
var FG2_DOT_T=0;const fg2DotPisca=ms=>{clearTimeout(FG2_DOT_T);FG2_DOT_T=setTimeout(()=>fg2Dot(false),ms)};
function fg2Tam(){const sl=$("#cn2-tam");if(!sl)return;let ativo=null;
  const poe=e=>{const r=sl.getBoundingClientRect(),f=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),c=ED.st.caneta;c.w=Math.round(40-36*f)/1000;fg2TamPos();fg2Dot(true)};
  sl.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();ativo=e.pointerId;clearTimeout(FG2_DOT_T);try{sl.setPointerCapture(e.pointerId)}catch(_){}poe(e)});
  sl.addEventListener("pointermove",e=>{if(ativo!==e.pointerId)return;poe(e)});
  const fim=e=>{if(ativo!==e.pointerId)return;ativo=null;fg2DotPisca(450)};sl.addEventListener("pointerup",fim);sl.addEventListener("pointercancel",fim);
  sl.addEventListener("keydown",e=>{const c=ED.st.caneta,d=e.key==="ArrowUp"||e.key==="ArrowRight"?2:e.key==="ArrowDown"||e.key==="ArrowLeft"?-2:0;if(!d)return;e.preventDefault();c.w=Math.max(4,Math.min(40,Math.round(c.w*1000)+d))/1000;fg2TamPos();fg2Dot(true);fg2DotPisca(700)})}
function fg2CnUI(){const c=ED&&ED.st.caneta,ov=$("#layer .ce-cn");if(!c||!ov)return;const k=fg2Ferr(c);ov.classList.toggle("bor",!!c.bor);
  ov.querySelectorAll("[data-edcnt]").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.edcnt===k)));ov.querySelectorAll("[data-edcncor]").forEach(b=>b.setAttribute("aria-pressed",String(!c.bor&&b.dataset.edcncor===c.cor)))}
/* segurar parado no story pinta o fundo inteiro (com o marcador fica translúcido; com a borracha, apaga tudo) */
var FG2_SEG={t:0};
{const _di=edDesenhaIni,_dm=edDesenhaMove,_df=edDesenhaFim;
  edDesenhaIni=function(e){const r=_di.apply(this,arguments);clearTimeout(FG2_SEG.t);const tr=ED&&ED._tr;if(!tr)return r;FG2_SEG={x:e.clientX,y:e.clientY,tr,
      t:setTimeout(()=>{if(!ED||ED._tr!==tr)return;if(tr.bor){ED.st.tracos=[]}else{tr.pts=[[.5,.5]];tr.w=3;tr.neon=false}ED._tr=null;edTracos();vibrar(15)},600)};return r};
  edDesenhaMove=function(e){if(FG2_SEG.t&&Math.hypot(e.clientX-FG2_SEG.x,e.clientY-FG2_SEG.y)>10){clearTimeout(FG2_SEG.t);FG2_SEG.t=0}return _dm.apply(this,arguments)};
  edDesenhaFim=function(e){if(!e||e.pointerId===ED._trp){clearTimeout(FG2_SEG.t);FG2_SEG.t=0}return _df.apply(this,arguments)}}

/* ===== cliques (na janela, antes dos cliques antigos do documento) ===== */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest||!ED||!$("#layer .ce")||t.closest("#layer2"))return;let b;const pare=()=>{e.stopPropagation();e.stopImmediatePropagation()};
  /* bandeja */
  if(b=t.closest(".ce-fig [data-edfig]")){const k=b.dataset.edfig;
    if(FG2_EDITA.includes(k)){pare();e.preventDefault();$("#layer .ce-fig")?.remove();fg2Abre(k,null);return}
    if(k==="foto"){pare();e.preventDefault();$("#layer .ce-fig")?.remove();fg2Foto();return}return}
  /* editor da figurinha */
  const fe=t.closest("#layer .ce-fe");
  if(fe){pare();if(!FG2){fg2Fecha();return}const F=FG2;
    if(t.closest("[data-edfok]")){e.preventDefault();fg2Ok();return}
    if(t.closest("[data-fecor]")){e.preventDefault();fg2Le();F.e.cor=(fg2CorN(F.e)+1)%FG2_NCORES;const card=fe.querySelector(".fe-card>*");if(card){for(let i=1;i<FG2_NCORES;i++)card.classList.remove("fgc-"+i);if(F.e.cor)card.classList.add("fgc-"+F.e.cor)}vibrar(5);return}
    if(b=t.closest("[data-fqc]")){e.preventDefault();fg2Le();F.e.c=+b.dataset.fqc;fe.querySelectorAll(".fe-qo").forEach(r=>{const i=+r.dataset.i,on=i===F.e.c;r.classList.toggle("certa",on);const bt=r.querySelector("[data-fqc]");bt.setAttribute("aria-pressed",String(on));bt.querySelector("i").textContent=on?"✓":"ABCD"[i]});vibrar(5);return}
    if(b=t.closest("[data-femo]")){e.preventDefault();F.e.emo=b.dataset.femo;fe.querySelectorAll("[data-femo]").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-checked",String(x===b))});const em=fe.querySelector(".fg-emo");if(em)em.textContent=F.e.emo;return}
    if(t.closest("[data-feadd]")){e.preventDefault();fg2Le();if(F.e.o.length<4){F.e.o.push("");fg2RefazCard("#fe-o"+(F.e.o.length-1))}return}
    if(b=t.closest("[data-fedel]")){e.preventDefault();fg2Le();F.e.o.splice(+b.dataset.fedel,1);fg2RefazCard(null);return}
    if(t===fe||t.classList.contains("fe-box")){e.preventDefault();fg2Ok();return}
    return}
  /* caneta */
  if(b=t.closest("#layer .ce-cn [data-edcnt]")){pare();e.preventDefault();const c=ED.st.caneta,k=b.dataset.edcnt;c.mk=k==="mk";c.neon=k==="neon";c.bor=k==="bor";fg2CnUI();fg2Dot(true);fg2DotPisca(500);return}
  if(b=t.closest("#layer .ce-cn [data-edcncor]")){pare();e.preventDefault();const c=ED.st.caneta;c.cor=b.dataset.edcncor;if(c.bor)c.bor=false;fg2CnUI();return}},true);
/* voltar do celular com a figurinha aberta: conclui e fica no editor */
{const _cl=closeLayer;closeLayer=function(fromPop){if(fromPop===true&&ED&&$("#layer .ce-fe")&&!($("#layer2")?.innerHTML)){fg2Ok();if(pushH())HST++;return}if(!$("#layer .ce-fe"))FG2=null;return _cl.apply(this,arguments)}}
/* folhas que continuam (link, menção, notícia): mesmo visual da bandeja */
{const _fo=edForm;edForm=function(){const r=_fo.apply(this,arguments);$("#layer .ce-sel")?.classList.add("fg2-sel");return r}}
{const _li=edLista;edLista=function(){const r=_li.apply(this,arguments);$("#layer .ce-sel")?.classList.add("fg2-sel");return r}}
