/* ---------- 207 · Colunas (Fase 6, 18/11): achar, guardar e organizar ----------
   Decisões do Pedro (18/11):
   - A Capa continua só com notícia. As colunas continuam no Feed, misturadas, e ganham o filtro "Colunas" (folha de
     filtro do Feed), com escolha por editoria e por autor.
   - Cada coluna tem uma editoria do Prumo (estilo.coluna.ed), obrigatória ao publicar (132); hashtags seguem opcionais.
     Coluna antiga sem editoria: vale a das notícias ligadas a ela, senão uma hashtag com o nome da editoria.
   - Colunas guardadas ficam nos Guardados (aba do Perfil, 161/205), com filtro "Colunas" e "Continuar de onde parei".
   - "Minhas colunas" (132) mostra as publicadas com os números (leituras e quantos chegaram ao fim), agrupadas por mês,
     série ou editoria, na ordem das mais recentes ou das mais lidas.
   Nada aqui embrulha função: listaFeed (001), abrirFiltro (030), rp204Base (204), a aba Guardados (161/205),
   cs123Progresso (123) e ed132HubHTML (132) chamam estas funções. Prefixo col207. */
var COL207={ed:"",au:"",ag:"data",or:"data",minhas:[],nums:null,todos:false,carregado:0};
const COL207_PROG="prumo-col207-prog";

/* ===== editoria ===== */
function col207EdOpc(){try{return ALLSECS().filter(s=>s&&s.id&&s.nome)}catch(e){return []}}
const col207EdOk=id=>!!id&&col207EdOpc().some(s=>s.id===id);
function col207EdTag(t){t=norm(String(t||"")).replace(/[#\s]+/g," ");const s=col207EdOpc().find(s=>{const n=norm(s.nome);return (" "+t+" ").indexOf(" "+n+" ")>=0||t.replace(/\s/g,"").indexOf(n.replace(/\s/g,""))>=0});return s?s.id:""}
/* sugestão no "Antes de publicar": a editoria das notícias ligadas, senão uma hashtag ou o título */
function col207EdSug(E){try{for(const p of (E.pautas||[])){const q=pautaById(p.id);if(q&&col207EdOk(secOf(q)))return secOf(q)}return col207EdTag(String(E.tags||""))}catch(e){return ""}}
function col207Ed(x,c){c=c||cs123Col(x);if(!c)return "";if(col207EdOk(c.ed))return c.ed;
  try{for(const p of (c.pautas||[])){const q=pautaById(p.id);if(q&&col207EdOk(secOf(q)))return secOf(q)}}catch(e){}
  try{const ult=String(x.texto||"").split("\n\n").pop();if(/^#/.test(ult))return col207EdTag(ult)}catch(e){}return ""}

/* ===== Feed: filtro Colunas ===== */
function col207Todas(){if(typeof pubVisiveis!=="function")return [];
  return pubVisiveis().filter(x=>x&&cs123Col(x)&&!(typeof ed132Agendada==="function"&&ed132Agendada(x))).sort((a,b)=>(+b.at||0)-(+a.at||0))}
function col207Passa(x){if(COL207.au&&x.autor!==COL207.au)return false;if(!COL207.ed)return true;const e=col207Ed(x);return COL207.ed==="_sem"?!e:e===COL207.ed}
function col207Lista(){return col207Todas().filter(col207Passa).map(x=>({id:"u:"+x.id,__pub:x}))}
function col207Cab(lista){const t=col207Todas(),n=lista.length;
  const eds=new Map();t.forEach(x=>{if(COL207.au&&x.autor!==COL207.au)return;const e=col207Ed(x)||"_sem";eds.set(e,(eds.get(e)||0)+1)});
  const ord=col207EdOpc().map(s=>s.id).filter(id=>eds.has(id));if(eds.has("_sem"))ord.push("_sem");
  const aus=new Map();t.forEach(x=>{if(COL207.ed&&!(COL207.ed==="_sem"?!col207Ed(x):col207Ed(x)===COL207.ed))return;aus.set(x.autor,(aus.get(x.autor)||0)+1)});
  const chip=(k,v,tx,c,on)=>`<button type="button" data-${k}="${esc(v)}" aria-pressed="${on}">${esc(tx)}${c?` <em>${c}</em>`:""}</button>`;
  let h=`<div class="sech gut"><i style="background:var(--bronze)"></i><h4>Colunas</h4><button type="button" class="vertudo" data-filtro="tudo">Ver tudo ✕</button><span>${n} ${n===1?"coluna":"colunas"}</span></div>`;
  if(ord.length>1||COL207.ed)h+=`<div class="col207-f gut" role="group" aria-label="Editoria">${chip("col207fe","","Todas",0,!COL207.ed)}${ord.map(e=>chip("col207fe",e,e==="_sem"?"Sem editoria":secNome(e),eds.get(e),COL207.ed===e)).join("")}</div>`;
  if(aus.size>1||COL207.au)h+=`<div class="col207-f gut" role="group" aria-label="Quem escreveu">${chip("col207fa","","Todos",0,!COL207.au)}${[...aus.entries()].sort((a,b)=>b[1]-a[1]).map(([u,c])=>chip("col207fa",u,nomeDe(u),c,COL207.au===u)).join("")}</div>`;
  return h}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;
  if(b=t.closest("[data-col207fe]")){e.preventDefault();e.stopPropagation();COL207.ed=b.dataset.col207fe;try{renderPosts()}catch(_){}return}
  if(b=t.closest("[data-col207fa]")){e.preventDefault();e.stopPropagation();COL207.au=b.dataset.col207fa;try{renderPosts()}catch(_){}return}
  /* escolher "Colunas" na folha de filtro começa sem editoria nem autor */
  if((b=t.closest('[data-filtro="_colunas"]'))&&FILTRO!=="_colunas"){COL207.ed="";COL207.au=""}
  if(b=t.closest("[data-col207cont]")){e.preventDefault();e.stopPropagation();col207Continuar(b.dataset.col207cont)}},true);

/* ===== até onde leu ===== */
function col207ProgLe(){let o={};try{const x=JSON.parse(localStorage.getItem(COL207_PROG)||"{}");if(x&&typeof x==="object"&&!Array.isArray(x))o=x}catch(e){}
  /* 19/11: o ponto de leitura das colunas guardadas também vai na conta (junto com o guardado): vale em outro aparelho */
  try{Object.entries(S.salvos||{}).forEach(([k,v])=>{const pr=v&&v.prog;if(!pr||!(+pr.at>0))return;const id=String(k).replace(/^u:/,"");if(!o[id]||(+o[id].at||0)<+pr.at)o[id]=pr})}catch(e){}
  return o}
var COL207_CONTA={};
function col207NaConta(id,pr){try{if(!S.uid||!S.db)return;const k=String(id).startsWith("u:")?String(id):"u:"+id,v=S.salvos&&S.salvos[k];if(!v)return;const ag=Date.now();if(ag-(COL207_CONTA[id]||0)<15000)return;COL207_CONTA[id]=ag;
  const nv={...v,prog:pr};S.salvos[k]=nv;gravarMapa(`data/users/${S.uid}/salvos`,"itens",k,nv).catch(()=>{})}catch(e){}}
let COL207_PEND=null,COL207_TM=0;
/* f = onde parou (0 a 1), m = até onde chegou; o começo (0) não apaga o lugar guardado */
function col207Marca(id,fr){if(!id||!(fr>=0.01))return;COL207_PEND={id:String(id),fr:Math.min(1,fr)};clearTimeout(COL207_TM);COL207_TM=setTimeout(col207Grava,700)}
function col207Grava(){const p=COL207_PEND;COL207_PEND=null;if(!p)return;try{const o=col207ProgLe(),v=o[p.id]||{};o[p.id]={f:+p.fr.toFixed(3),m:+Math.max(+v.m||0,p.fr).toFixed(3),at:Date.now()};
  const ks=Object.keys(o);if(ks.length>300)ks.sort((a,b)=>(o[a].at||0)-(o[b].at||0)).slice(0,ks.length-300).forEach(k=>delete o[k]);localStorage.setItem(COL207_PROG,JSON.stringify(o));col207NaConta(p.id,o[p.id])}catch(e){}}
window.addEventListener("pagehide",()=>{try{col207Grava()}catch(e){}});
function col207Continuar(id){const p=col207ProgLe()[id];cs123Abrir(id);if(!p||!(p.f>0))return;let n=0;
  const t=setInterval(()=>{const sc=document.querySelector("#layer .cs123-ler .cs123-sc");if(sc&&sc.querySelector(".cs123-corpo")&&sc.scrollHeight>sc.clientHeight+40){clearInterval(t);sc.scrollTop=Math.round(p.f*(sc.scrollHeight-sc.clientHeight))}else if(++n>60)clearInterval(t)},80)}

/* ===== Guardados: lista das colunas guardadas ===== */
function col207Guardadas(cl){const o=col207ProgLe();
  const est=x=>{const p=o[x.id];return p&&+p.m>=0.9?2:p&&+p.f>0.05?0:1};
  const l=cl.slice().sort((a,b)=>est(a)-est(b)||((o[b.id]&&o[b.id].at)||0)-((o[a.id]&&o[a.id].at)||0)||(+b.at||0)-(+a.at||0));
  return `<ul class="col207-gl">${l.map(x=>{const c=cs123Col(x),p=o[x.id],s=est(x),ed=col207Ed(x,c);
    return `<li><button type="button" class="col207-gi" data-cs123ler="${esc(x.id)}"><small class="col207-k">Coluna${ed?" · "+esc(secNome(ed)):""}</small><b>${esc(c.tit)}</b><small>${esc(nomeDe(x.autor))} · ${s===2?"lida até o fim":s===0?`você parou em ${Math.round(p.f*100)}%`:"ainda não lida"}</small>${s===0?`<i class="col207-pb" aria-hidden="true"><b style="width:${Math.round(p.f*100)}%"></b></i>`:""}</button>${s===0?`<button type="button" class="btn col207-cont" data-col207cont="${esc(x.id)}">Continuar de onde parei</button>`:""}</li>`}).join("")}</ul>`}

/* ===== Minhas colunas: todas as publicadas, com os números ===== */
async function col207Minhas(){if(typeof SB==="undefined"||!SB||!S.uid||!S.membro)return;if(Date.now()-COL207.carregado<30e3)return;COL207.carregado=Date.now();
  /* só os posts da própria pessoa (sem o texto longo); as colunas são separadas aqui, pelo estilo */
  try{const sel=typeof PUB_SEL==="string"?PUB_SEL:"*",q=c=>SB.from("publicacoes").select(c).eq("autor",S.uid).eq("tipo","post").order("at",{ascending:false}).limit(500);let r=await q(sel);
    if(r.error&&sel!=="*")r=await q("*");
    if(!r.error&&Array.isArray(r.data))COL207.minhas=r.data.map(x=>{const y={...x,fotos:Array.isArray(x.fotos)?x.fotos:[]};try{pubLimpa(y)}catch(e){}return y}).filter(x=>cs123Col(x))}catch(e){}
  try{if(typeof lt134Testa==="function"&&LT134.v13===null)await lt134Testa();if(LT134.v13===true){let r=await SB.rpc("coluna_minhas_numeros");
    if(r&&!r.error&&Array.isArray(r.data)){COL207.nums=r.data;COL207.todos=true}
    else{r=await SB.rpc("coluna_mais_lidas");if(r&&!r.error&&Array.isArray(r.data)){COL207.nums=r.data;COL207.todos=false;LT134.mais=r.data}}}}catch(e){}}
function col207Mes(at){try{return new Date(+at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo",month:"long",year:"numeric"})}catch(e){return ""}}
function col207PubHTML(){if(typeof S==="undefined"||!S.uid)return "";const ids=new Set(),l=[];
  const add=x=>{if(x&&x.autor===S.uid&&!ids.has(x.id)&&cs123Col(x)&&!(typeof ed132Agendada==="function"&&ed132Agendada(x))){ids.add(x.id);l.push(x)}};
  (typeof PUB!=="undefined"&&PUB.itens||[]).forEach(add);COL207.minhas.forEach(add);
  if(!l.length)return `<h3 class="ed132-hh">Publicadas</h3><p class="hint ed132-hv">${COL207.carregado?"Você ainda não publicou colunas.":"Carregando…"}</p>`;
  const nl=COL207.nums||(typeof LT134!=="undefined"&&LT134.mais)||null,nums=new Map((nl||[]).map(o=>[String(o.pub),o])),tem=!!nl;
  const lei=x=>{const o=nums.get(String(x.id));return o?+o.leituras||0:0};
  if(COL207.or==="lidas"&&!tem)COL207.or="data";
  l.sort((a,b)=>COL207.or==="lidas"?lei(b)-lei(a)||(+b.at||0)-(+a.at||0):(+b.at||0)-(+a.at||0));
  const grupo=x=>{const c=cs123Col(x);if(COL207.ag==="serie")return c.serie||"Fora de série";if(COL207.ag==="ed"){const e=col207Ed(x,c);return e?secNome(e):"Sem editoria"}return col207Mes(x.at)};
  const gs=new Map();l.forEach(x=>{const g=grupo(x);if(!gs.has(g))gs.set(g,[]);gs.get(g).push(x)});
  /* em série e editoria, os grupos maiores primeiro; "Fora de série" e "Sem editoria" no fim */
  let ord=[...gs.keys()];if(COL207.ag!=="data")ord.sort((a,b)=>(/^(Fora de série|Sem editoria)$/.test(a)?1:0)-(/^(Fora de série|Sem editoria)$/.test(b)?1:0)||gs.get(b).length-gs.get(a).length||a.localeCompare(b,"pt-BR"));
  const seg=(k,v,tx,on)=>`<button type="button" data-${k}="${v}" aria-pressed="${on}">${tx}</button>`;
  const item=x=>{const c=cs123Col(x),o=nums.get(String(x.id)),e=col207Ed(x,c),L=o?+o.leituras||0:0,F=o?+o.fim||0:0;
    const meta=[cs123Data(x.at),COL207.ag!=="ed"&&e?secNome(e):"",COL207.ag!=="serie"&&c.serie?c.serie+(c.n?" nº "+c.n:""):""].filter(Boolean).join(" · ");
    const nn=o?`${lt134N(L,"leitura","leituras")} · ${cs123Num(F)} até o fim${L?` (${Math.round(F*100/L)}%)`:""}`:tem&&COL207.todos?"Ninguém leu ainda":"";
    return `<li><span class="ed132-hi"><b>${esc(c.tit)}</b><small>${esc(meta)}</small>${nn?`<small class="col207-n">${esc(nn)}</small>`:""}</span>
      <span class="ed132-hb"><button type="button" class="btn ghost" data-cs123ler="${esc(x.id)}">Abrir</button>${typeof LT134!=="undefined"&&LT134.v13===true?`<button type="button" class="btn ghost" data-lt134num="${esc(x.id)}">Leitores</button>`:""}<button type="button" class="btn ghost" data-col207edita="${esc(x.id)}">Editar</button></span></li>`};
  return `<h3 class="ed132-hh">Publicadas <small>${l.length} ${l.length===1?"coluna":"colunas"}${tem?" · só você vê os números":""}</small></h3>
    <div class="col207-ctl"><div class="col207-f col207-seg" role="group" aria-label="Agrupar por"><span>Agrupar</span>${seg("col207ag","data","Mês",COL207.ag==="data")}${seg("col207ag","serie","Série",COL207.ag==="serie")}${seg("col207ag","ed","Editoria",COL207.ag==="ed")}</div>
      ${tem?`<div class="col207-f col207-seg" role="group" aria-label="Ordem"><span>Ordem</span>${seg("col207or","data","Recentes",COL207.or==="data")}${seg("col207or","lidas","Mais lidas",COL207.or==="lidas")}</div>`:""}</div>
    ${ord.map(g=>`<h4 class="col207-gh">${esc(g)} <small>${gs.get(g).length}</small></h4><ul class="ed132-hl col207-pl">${gs.get(g).map(item).join("")}</ul>`).join("")}
    ${tem&&!COL207.todos&&l.length>10?`<p class="hint">Os números aparecem nas 10 colunas mais lidas. Para ver os de todas, falta rodar sql/proposta-2026-11-18-colunas.sql.</p>`:""}`}
