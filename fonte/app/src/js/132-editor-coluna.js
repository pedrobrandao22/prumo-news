/* ---------- 132: editor de colunas (fase 1) ----------
   Substitui o formulário de coluna do 123 (e o "Editar a coluna" do 128) por um editor visual, em tela cheia no celular:
   1. Texto com blocos: parágrafo (negrito, itálico, link), título (H2), subtítulo (H3), citação, lista, lista numerada,
      separador, foto (sua, com legenda e crédito; sobe pelo Storage dos posts) e gráfico do acervo do Prumo (séries de js/110).
      Barra de formatação fixa acima do teclado; Ctrl/Cmd+B, I e K no computador; "/" no começo da linha abre o menu de blocos.
      Colar do Google Docs ou do Word mantém só o que o Prumo usa (lista branca; script, style, imagens de fora e on* saem).
   2. O texto vai como HTML limpo (estilo.coluna.f = "h") em publicacoes.corpo (ou em estilo.coluna.corpo antes da v9).
      Quem lê passa o HTML de novo pela mesma lista branca. As colunas antigas (texto com "## " e "> ") continuam iguais.
      As fotos do texto vão na lista fotos do post (depois da capa; estilo.coluna.capa diz se a primeira é capa), porque é
      essa lista que libera o arquivo para quem lê.
   3. Rascunhos: salvam sozinhos (2 s depois de parar de digitar) e ao sair; vários, em "Minhas colunas", com título, data e
      palavras. No aparelho (localStorage) e, com sql/publicacoes-v12.sql, também no banco (abre em outro aparelho).
   4. Ver como leitor (página da coluna e cartão do Feed), contagem de palavras e tempo de leitura ao vivo.
   5. Antes de publicar: chamada do Feed (sugerida do 1º parágrafo), série e número, hashtags, até 3 assuntos do dia,
      quem pode ler e, com a v12, agendar dia e hora (America/Sao_Paulo). A agendada só aparece para a autora (Minhas colunas),
      com editar, publicar agora e cancelar (volta para os rascunhos).
   6. Editar depois de publicada (com "editado" e a data na página) e, com a v12, histórico de versões com "Restaurar".
   Sem a v12 o app detecta o que falta: sem agendar, sem histórico e rascunhos só no aparelho.
   Nomes globais com o prefixo ed132 / ED132. */

var ED132={uid:null,v12:{ag:null,ra:null,ve:null},n:0,E:null,agend:[],urls:{},idx:null,rg:null,lrg:null,fig:null,mi:0,mq:null,gt:0,ct:0};
const ED132_FOTO=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[\w-]{1,80}\.(?:jpe?g|png|webp)$/i;
const ED132_SER=/^[a-z0-9_]{2,30}$/,ED132_PER=/^\d{1,3}[dma]$/;
const ED132_FALTA=/does not exist|42P01|42703|PGRST20[0-9]|PGRST106|Could not find|schema cache/i;
const ED132_RID=()=>"c"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ED132_IC={
  mais:'<path d="M12 5v14M5 12h14"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  aspas:'<path d="M5 17c0-4 1-7 5-9M14 17c0-4 1-7 5-9"/><circle cx="7" cy="16" r="2"/><circle cx="16" cy="16" r="2"/>',
  lista:'<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="4.5" cy="7" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17" r="1"/>',
  num:'<path d="M10 7h10M10 12h10M10 17h10"/><path d="M4 5.5l1.5-1V9M3.8 14.2c.4-.6 2.4-.8 2 .6L4 17.5h2.4"/>',
  sep:'<path d="M4 12h16"/><path d="M8 7h8M8 17h8" opacity=".35"/>',
  foto:'<rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 17l4.5-4.5 4 4 2.5-2.5 4 3.5"/>',
  graf:'<path d="M4 19h16"/><path d="M5 15l4-4 3 3 6-7"/>',par:'<path d="M13 5v14M17 5v14M17 5h-6.5a3.5 3.5 0 0 0 0 7H13"/>'};
const ed132Svg=d=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ED132_BLOCOS_MENU=[["p","Parágrafo","Texto comum","par"],["h2","Título","Intertítulo grande",""],["h3","Subtítulo","Intertítulo menor",""],["q","Citação","Destaque uma fala ou trecho","aspas"],
  ["ul","Lista","Itens com marcador","lista"],["ol","Lista numerada","1, 2, 3…","num"],["hr","Separador","Uma linha entre partes do texto","sep"],["foto","Foto","Sua foto, com legenda e crédito","foto"],
  ["graf","Gráfico do Prumo","Do acervo: Selic, IPCA, dólar…","graf"]];

/* ===== 0. o que a v12 liga (detectado: coluna ou tabela ausente = desligado) ===== */
async function ed132Testa(){if(typeof SB==="undefined"||!SB||!S.uid||!S.membro)return;const V=ED132.v12;
  const t=async(k,f)=>{if(V[k]!==null)return;try{const r=await f();if(!r||!r.error)V[k]=true;else if(ED132_FALTA.test(String(r.error.message||"")+" "+String(r.error.code||"")))V[k]=false}catch(e){}};
  await Promise.all([t("ag",()=>SB.from("publicacoes").select("publicar_em").limit(1)),t("ra",()=>SB.from("coluna_rascunhos").select("rid").limit(1)),t("ve",()=>SB.from("coluna_versoes").select("id").limit(1))])}
setInterval(()=>{if(S.uid!==ED132.uid){ED132.uid=S.uid;ED132.v12={ag:null,ra:null,ve:null};ED132.n=0;ED132.agend=[]}
  const V=ED132.v12;if(S.uid&&S.membro&&(V.ag===null||V.ra===null||V.ve===null)&&ED132.n<30){ED132.n++;ed132Testa()}
  try{if(ED132.agend.some(x=>!ed132Agendada(x))){PUB.sig="";pubCarregar()}}catch(e){}},3000);

/* ===== 1. colunas agendadas: fora do Feed (até da autora); ficam em ED132.agend e em "Minhas colunas" ===== */
const ed132Agendada=x=>!!(x&&x.publicar_em&&Date.parse(x.publicar_em)>Date.now());
/* tira as agendadas de PUB.itens (pubAssinar roda logo depois de cada carga) e guarda as da autora em ED132.agend */
function ed132Separa(){if(!PUB||!Array.isArray(PUB.itens))return false;const ag=PUB.itens.filter(ed132Agendada);if(!ag.length)return false;
  PUB.itens=PUB.itens.filter(x=>!ed132Agendada(x));const m=new Map(ED132.agend.map(x=>[x.id,x]));ag.forEach(x=>{ED132.vistos.add(x.id);if(x.autor===S.uid)m.set(x.id,x)});
  ED132.agend=[...m.values()].sort((a,b)=>Date.parse(a.publicar_em)-Date.parse(b.publicar_em));return true}
ED132.vistos=new Set();
{const _pa=pubAssinar;pubAssinar=function(){ED132.assinou=true;try{ed132Separa()}catch(e){}return _pa.apply(this,arguments)}}
/* depois de uma carga completa: ficam em "Agendadas" só as que o banco ainda devolveu como agendadas */
{const _pc=pubCarregar;pubCarregar=async function(){const livre=!PUB.carregando;if(livre){ED132.vistos=new Set();ED132.assinou=false}const r=await _pc.apply(this,arguments);
  try{const n=PUB.itens.length;ed132Separa();if(livre&&ED132.assinou)ED132.agend=ED132.agend.filter(x=>ED132.vistos.has(x.id)&&ed132Agendada(x));if(n!==PUB.itens.length)pubRedesenha();ed132HubRedesenha()}catch(e){}return r}}
const ed132Pub=id=>pubDe(id)||ED132.agend.find(x=>x.id===id)||null;
const ed132Url=p=>ED132.urls[p]||pubUrl(p)||"";
async function ed132Assina(ps){const now=Date.now(),falta=[...new Set(ps||[])].filter(p=>p&&ED132_FOTO.test(p)&&!ED132.urls[p]&&!((PUB.urls[p]||{}).exp>now+600e3));
  if(!falta.length)return true;if(typeof SB==="undefined"||!SB)return false;
  try{const r=await SB.storage.from("fotos").createSignedUrls(falta,6*3600);let n=0;(r.data||[]).forEach(d=>{if(d&&d.signedUrl){PUB.urls[d.path]={u:d.signedUrl,exp:now+6*3600e3};n++}});return n>0}catch(e){return false}}

/* ===== 2. HTML limpo: lista branca ===== */
const ED132_FORA=new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","TEMPLATE","NOSCRIPT","SVG","MATH","IMG","PICTURE","VIDEO","AUDIO","SOURCE","CANVAS","INPUT","BUTTON","SELECT","OPTION","TEXTAREA",
  "LINK","META","TITLE","HEAD","FORM","FRAME","FRAMESET","APPLET","BASE","MAP","AREA","TRACK","DIALOG","PORTAL","XML","COLGROUP","COL"]);
const ED132_BLOCOS=new Set(["P","DIV","SECTION","ARTICLE","HEADER","FOOTER","MAIN","ASIDE","NAV","CENTER","ADDRESS","PRE","H1","H2","H3","H4","H5","H6","BLOCKQUOTE","UL","OL","LI","HR",
  "FIGURE","FIGCAPTION","TABLE","THEAD","TBODY","TFOOT","TR","TD","TH","DL","DT","DD","BODY","HTML","CAPTION"]);
const ED132_SELB="p,div,section,article,header,footer,main,aside,nav,center,address,pre,h1,h2,h3,h4,h5,h6,blockquote,ul,ol,li,hr,figure,table,tr,dl,dt,dd";
const ed132Vazio=h=>!String(h||"").replace(/<[^>]*>/g,"").replace(/&nbsp;| /g," ").trim();
function ed132Inline(n,o){if(n.nodeType===3)return esc(String(n.nodeValue||"").replace(/[\s ]+/g," "));if(n.nodeType!==1)return "";const t=n.tagName;if(ED132_FORA.has(t))return "";if(t==="BR")return "<br>";
  let h="";n.childNodes.forEach(c=>{h+=ed132Inline(c,o)});if(ed132Vazio(h))return h;
  const st=String(n.getAttribute("style")||"").toLowerCase();let b=t==="STRONG"||t==="B",i=t==="EM"||t==="I";
  /* só a propriedade CSS de verdade (o Word manda "mso-bidi-font-weight:normal" em todo negrito) */
  if(b&&/(?:^|[;\s])font-weight\s*:\s*(normal|[1-4]00)/.test(st))b=false;if(i&&/(?:^|[;\s])font-style\s*:\s*normal/.test(st))i=false;
  if(!b&&/(?:^|[;\s])font-weight\s*:\s*(bold|[6-9]00)/.test(st))b=true;if(!i&&/(?:^|[;\s])font-style\s*:\s*italic/.test(st))i=true;
  if(t==="A"){const u=edUrlOk(String(n.getAttribute("href")||"").slice(0,500));if(u)h=`<a href="${esc(u)}">${h}</a>`}
  if(i)h=`<em>${h}</em>`;if(b)h=`<strong>${h}</strong>`;return h}
const ed132Apara=h=>String(h).replace(/^(?:\s|<br>)+/,"").replace(/(?:\s|<br>)+$/,"");
function ed132Par(buf,out){String(buf).split(/(?:<br>\s*){2,}/).forEach(s=>{s=ed132Apara(s);if(!ed132Vazio(s))out.push(`<p>${s}</p>`)})}
function ed132Filhos(n,o){let h="";n.childNodes.forEach(c=>{h+=ed132Inline(c,o)});return ed132Apara(h)}
function ed132Cap(fig){const c=fig.querySelector("figcaption");if(!c)return {leg:"",cred:""};const sm=c.querySelector("small"),cred=sm?sm.textContent:"";let leg="";
  c.childNodes.forEach(k=>{if(k!==sm&&!(k.nodeType===1&&k.tagName==="BUTTON"))leg+=k.textContent||""});
  return {leg:leg.replace(/\s+/g," ").trim().slice(0,200),cred:String(cred).replace(/\s+/g," ").trim().slice(0,120)}}
function ed132Blocos(root,o,out){let buf="";const fecha=()=>{if(buf){ed132Par(buf,out);buf=""}};
  root.childNodes.forEach(n=>{
    if(n.nodeType===3){buf+=ed132Inline(n,o);return}if(n.nodeType!==1)return;const t=n.tagName;if(ED132_FORA.has(t))return;
    if(!ED132_BLOCOS.has(t)){if(n.querySelector(ED132_SELB)){fecha();ed132Blocos(n,o,out)}else buf+=ed132Inline(n,o);return}
    fecha();
    if(t==="HR"){if(out.length&&out[out.length-1]!=="<hr>")out.push("<hr>");return}
    if(/^H[1-6]$/.test(t)){const x=ed132Filhos(n,o).replace(/<br>/g," ");if(!ed132Vazio(x))out.push(+t[1]<=2?`<h2>${x}</h2>`:`<h3>${x}</h3>`);return}
    if(t==="BLOCKQUOTE"){const sub=[];ed132Blocos(n,o,sub);const ps=[];sub.forEach(b=>{if(/^<(?:p|h2|h3)>/.test(b))ps.push("<p>"+b.replace(/^<(?:p|h2|h3)>|<\/(?:p|h2|h3)>$/g,"")+"</p>");
      else if(/^<[uo]l>/.test(b)){const tp=document.createElement("template");tp.innerHTML=b;tp.content.querySelectorAll("li").forEach(li=>ps.push("<p>"+li.innerHTML+"</p>"))}});
      if(ps.length){const k=out.length-1;if(k>=0&&/^<blockquote>/.test(out[k]))out[k]=out[k].replace(/<\/blockquote>$/,ps.join("")+"</blockquote>");else out.push(`<blockquote>${ps.join("")}</blockquote>`)}return}
    if(t==="UL"||t==="OL"){const its=[];const anda=l=>l.childNodes.forEach(c=>{if(c.nodeType===1&&(c.tagName==="UL"||c.tagName==="OL")){anda(c);return}
        if(c.nodeType===1&&c.tagName==="LI"){let h="";const sub=[];c.childNodes.forEach(k=>{if(k.nodeType===1&&(k.tagName==="UL"||k.tagName==="OL"))sub.push(k);else if(k.nodeType===1&&ED132_BLOCOS.has(k.tagName))h+=(h?" ":"")+ed132Filhos(k,o);else h+=ed132Inline(k,o)});
          h=ed132Apara(h);if(!ed132Vazio(h))its.push(`<li>${h}</li>`);sub.forEach(anda);return}
        const h=ed132Apara(ed132Inline(c,o));if(!ed132Vazio(h))its.push(`<li>${h}</li>`)});anda(n);
      if(its.length)out.push(`<${t.toLowerCase()}>${its.join("")}</${t.toLowerCase()}>`);return}
    if(t==="FIGURE"){const f=String(n.getAttribute("data-f")||""),g=String(n.getAttribute("data-g")||""),p=String(n.getAttribute("data-p")||"");
      if(f&&ED132_FOTO.test(f)){if(o.dono&&f.indexOf(o.dono+"/")!==0)return;const c=ed132Cap(n);out.push(`<figure data-f="${esc(f)}"><figcaption>${esc(c.leg)}${c.cred?`<small>${esc(c.cred)}</small>`:""}</figcaption></figure>`);return}
      if(g&&ED132_SER.test(g)){out.push(`<figure data-g="${esc(g)}" data-p="${ED132_PER.test(p)?p:"24m"}"></figure>`);return}
      ed132Blocos(n,o,out);return}
    if(t==="TR"){const cs=[];n.childNodes.forEach(c=>{if(c.nodeType===1){const h=ed132Filhos(c,o);if(!ed132Vazio(h))cs.push(h)}});if(cs.length)out.push(`<p>${cs.join(" · ")}</p>`);return}
    if(t==="PRE"){String(n.textContent||"").split(/\n+/).forEach(s=>{s=s.trim();if(s)out.push(`<p>${esc(s)}</p>`)});return}
    if(n.querySelector(ED132_SELB)){ed132Blocos(n,o,out);return}
    const h=ed132Filhos(n,o);if(!ed132Vazio(h))ed132Par(h,out)});
  fecha();return out}
function ed132Limpa(html,o){const tp=document.createElement("template");tp.innerHTML=String(html||"");return ed132Blocos(tp.content,o||{},[]).join("")}
/* texto simples (uma linha por bloco; intertítulo com "## " e citação com "> ", como as colunas antigas): teaser, tempo e palavras */
const ED132_PL=new Map();
function ed132Plano(html){html=String(html||"");const k=ED132_PL.get(html);if(k!==undefined)return k;const tp=document.createElement("template");tp.innerHTML=html;const l=[];
  tp.content.childNodes.forEach(n=>{if(n.nodeType!==1)return;const t=n.tagName,tx=e=>String(e.textContent||"").replace(/\s+/g," ").trim();
    if(t==="FIGURE"){const c=n.querySelector("figcaption");return}if(t==="HR")return;
    if(t==="UL"||t==="OL"){n.querySelectorAll("li").forEach(li=>{const s=tx(li);if(s)l.push(s)});return}
    if(t==="BLOCKQUOTE"){n.querySelectorAll("p").forEach(p=>{const s=tx(p);if(s)l.push("> "+s)});return}
    const s=tx(n);if(s)l.push(t==="H2"||t==="H3"?"## "+s:s)});
  const r=l.join("\n");if(ED132_PL.size>300)ED132_PL.clear();ED132_PL.set(html,r);return r}
const ed132Palavras=t=>(String(t||"").replace(/^(?:## |> )/gm,"").match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)||[]).length;
const ed132Min=t=>Math.max(1,Math.round(ed132Palavras(t)/200));
function ed132DeTexto(t){return String(t||"").replace(/\r/g,"").split(/\n+/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join("")}
/* texto das colunas antigas ("## ", "> ", **negrito**, [link](https://…)) para o editor novo */
function ed132DeMarkdown(t){try{const tp=document.createElement("template");tp.innerHTML=cs123CorpoHTML(String(t||""));tp.content.querySelectorAll(".cs123-dom").forEach(e=>e.remove());return ed132Limpa(tp.innerHTML)}catch(e){return ed132DeTexto(t)}}
function ed132FotosDo(html){const tp=document.createElement("template");tp.innerHTML=String(html||"");return [...tp.content.querySelectorAll("figure[data-f]")].map(f=>f.getAttribute("data-f")).filter(p=>ED132_FOTO.test(p))}
function ed132Grafico(s,p){try{const h=typeof acvGrafico==="function"?acvGrafico({tipo:"grafico",forma:"linha",serie:s,periodo:ED132_PER.test(p||"")?p:"24m"}):"";return h||`<p class="hint">Gráfico indisponível agora.</p>`}catch(e){return `<p class="hint">Gráfico indisponível agora.</p>`}}

/* ===== 3. leitura: o HTML guardado passa de novo pela lista branca ===== */
function ed132CorpoHTML(html,x,o){o=o||{};const tp=document.createElement("template");tp.innerHTML=ed132Limpa(html);const fotos=new Set((x&&x.fotos)||[]),faltam=[];
  /* links: abrem fora e mostram o domínio ao lado (como nas colunas antigas), menos quando o texto já é o domínio */
  tp.content.querySelectorAll("a").forEach(a=>{a.className="cs123-a";a.target="_blank";a.rel="noopener noreferrer nofollow ugc";const d=edDom(a.getAttribute("href")||"");
    if(d&&norm(a.textContent).indexOf(norm(d).replace(/^www\./,""))<0){const s=document.createElement("span");s.className="cs123-dom";s.textContent=` (${d})`;a.after(s)}});
  tp.content.querySelectorAll("hr").forEach(h=>{h.className="ed132-hr"});
  tp.content.querySelectorAll("figure[data-f]").forEach(f=>{const p=f.getAttribute("data-f"),c=ed132Cap(f),ok=o.prev||fotos.has(p),u=ok?ed132Url(p):"";if(ok&&!u)faltam.push(p);
    const n=document.createElement("figure");n.className="ed132-ff";n.setAttribute("data-ed132ff",p);n.setAttribute("data-alt",c.leg);
    n.innerHTML=(u?`<img src="${pubSrc(u)}" alt="${esc(c.leg)}" loading="lazy" decoding="async">`:`<span class="up-sem">Foto indisponível</span>`)+(c.leg||c.cred?`<figcaption>${esc(c.leg)}${c.cred?` <small>${esc(c.cred)}</small>`:""}</figcaption>`:"");f.replaceWith(n)});
  tp.content.querySelectorAll("figure[data-g]").forEach(f=>{const d=document.createElement("div");d.className="ed132-fg";d.innerHTML=ed132Grafico(f.getAttribute("data-g"),f.getAttribute("data-p"));f.replaceWith(d)});
  if(faltam.length)ed132Assina(faltam).then(ok=>{if(ok)ed132PoeFotos()});return tp.innerHTML}
function ed132PoeFotos(){document.querySelectorAll("[data-ed132ff]").forEach(f=>{if(f.querySelector("img"))return;const u=ed132Url(f.getAttribute("data-ed132ff"));if(!u)return;const s=f.querySelector(".up-sem");
  const im=document.createElement("img");im.src=u;im.alt=f.getAttribute("data-alt")||"";im.loading="lazy";if(s)s.replaceWith(im);else f.prepend(im)})}
/* dados novos da coluna (série, chamada, capa, assuntos, HTML) */
{const _cc=cs123Col;cs123Col=function(x){const c=_cc.apply(this,arguments);if(!c)return c;try{const k=x.estilo.coluna;
  if(k.f==="h"){c.html=c.corpo;c.corpo=ed132Plano(c.html)}
  const se=cs123S(k.serie,60).trim();if(se){c.serie=se;const n=Math.floor(+k.n);if(n>0&&n<10000)c.n=n}
  const ch=cs123S(k.cham,280).trim();if(ch)c.cham=ch;if(k.capa===false)c.capa=false;
  if(Array.isArray(k.pautas)){const p=k.pautas.slice(0,3).filter(p=>p&&typeof p.id==="string"&&p.id&&p.id.length<=200).map(p=>({id:p.id,t:cs123S(p.t,140).trim()})).filter(p=>p.t);if(p.length)c.pautas=p}}catch(e){}return c}}
const ed132Editado=x=>!!(x&&+x.editado>0&&+x.editado>(+x.at||0)+2e3);
function ed132DataHora(ms){try{const d=new Date(+ms),z="America/Sao_Paulo";return d.toLocaleDateString("pt-BR",{timeZone:z,day:"numeric",month:"short"})+" às "+d.toLocaleTimeString("pt-BR",{timeZone:z,hour:"2-digit",minute:"2-digit"})}catch(e){return ""}}
const ed132Kick=c=>`Coluna${c.n?" "+c.n:""}${c.serie?" · "+c.serie:""}`;
function ed132DaSerie(autor,serie){const k=norm(serie).trim();if(!k)return [];const l=[];const ja=new Set();
  (typeof pubVisiveis==="function"?pubVisiveis():[]).forEach(x=>{if(!x||x.autor!==autor||ja.has(x.id)||ed132Agendada(x))return;const c=cs123Col(x);if(c&&c.serie&&norm(c.serie).trim()===k){ja.add(x.id);l.push({id:x.id,n:c.n||0,at:+x.at||0,tit:c.tit})}});
  return l.sort((a,b)=>(a.n&&b.n?a.n-b.n:0)||a.at-b.at)}
function ed132NavHTML(x,c){const l=ed132DaSerie(x.autor,c.serie),i=l.findIndex(o=>o.id===x.id);const ant=i>0?l[i-1]:null,prox=i>=0&&i<l.length-1?l[i+1]:null;
  const bt=(o,k)=>`<button type="button" class="ed132-na ed132-na-${k}" data-cs123ler="${esc(o.id)}"><small>${k==="a"?"‹ Anterior":"Próxima ›"}${o.n?` · Coluna ${o.n}`:""}</small><span>${esc(o.tit)}</span></button>`;
  return `<nav class="ed132-nav" aria-label="${esc("Série "+c.serie)}"><p class="ed132-nk">Série</p><b>${esc(c.serie)}</b><small>${l.length>1?`${l.length} colunas`:"Primeira coluna da série"}</small>${ant||prox?`<div class="ed132-nb">${ant?bt(ant,"a"):"<span></span>"}${prox?bt(prox,"p"):""}</div>`:""}</nav>`}
function ed132ArtHTML(x,c,o){o=o||{};const f=c.capa!==false&&x.fotos&&x.fotos[0],u=o.capa||(f&&ed132Url(f)),min=ed132Min(c.corpo),txt=String(x.texto||""),ult=txt.split("\n\n").pop(),
  tags=o.prev?cs123Tags(o.tags):/^#/.test(ult)&&txt.indexOf("\n\n")>0?cs123Tags(ult):[];
  const corpo=c.html?ed132CorpoHTML(c.html,x,o):cs123CorpoHTML(c.corpo),ed=ed132Editado(x)?` · editado em ${esc(ed132DataHora(x.editado))}`:"";
  const pts=(c.pautas||[]).length?`<div class="ed132-pts"><p class="ed132-nk">Assuntos do dia nesta coluna</p>${c.pautas.map(p=>!o.prev&&typeof pautaById==="function"&&pautaById(p.id)?`<button type="button" class="ed132-pt" data-ed132abre="${esc(p.id)}">${esc(p.t)}<i aria-hidden="true">›</i></button>`:`<span class="ed132-pt">${esc(p.t)}</span>`).join("")}</div>`:"";
  return `<article class="cs123-art"><p class="cs123-k">${esc(ed132Kick(c))}</p><h1>${esc(c.tit)}</h1>${c.linha?`<p class="cs123-l">${esc(c.linha)}</p>`:""}
      <div class="cs123-by"><button type="button" class="cs123-au" ${o.prev?"":`data-cs123perfil="${esc(x.autor)}"`}>${avatar(x.autor)}<span><b>${esc(nomeDe(x.autor))}</b><small>${esc(cs123Data(x.at))} · ${min} min de leitura${ed}</small></span></button></div>
      ${u?`<figure class="cs123-fig"><img src="${pubSrc(u)}" alt="${esc((x.estilo&&x.estilo.alt||[])[0]||"")}"></figure>`:f?`<figure class="cs123-fig"><span class="up-sem">Foto indisponível</span></figure>`:""}
      <div class="cs123-corpo">${corpo||`<p class="hint">Escreva o texto da coluna para ver como fica.</p>`}<span class="cs123-ponto" aria-hidden="true"></span></div>
      ${c.serie?ed132NavHTML(x,c):""}${pts}
      ${tags.length?`<div class="cs123-hts">${tags.map(t=>`<button type="button" class="cs123-ht" ${o.prev?"":`data-ht="${esc(t)}"`}>${esc(t)}</button>`).join("")}</div>`:""}
      <p class="cs123-aviso">Coluna de ${esc(nomeDe(x.autor))}: a opinião é do autor, separada das notícias da edição do Prumo.</p>
      ${o.prev?"":`<div class="cs123-fim" data-pid="${esc("u:"+x.id)}">${cs123FimHTML(x)}</div>`}</article>`}
{const _lh=cs123LerHTML;cs123LerHTML=function(x,c,o){o=o||{};if(!c||(!c.html&&!c.serie&&!c.pautas&&!c.cham&&c.capa!==false&&!ed132Editado(x)))return _lh.apply(this,arguments);
  try{return `<div class="cs123-ler${o.prev?" cs123-prev":""}" role="dialog" aria-modal="true" aria-label="${esc("Coluna: "+c.tit)}">
    <div class="cs123-top"><button type="button" class="cs123-v" ${o.prev?"data-cs123prevx":"data-cs123fecha"}>${ICON.back}<span>${o.prev?"Editar":"Voltar"}</span></button><span class="cs123-tk">${o.prev?"Prévia da coluna":"Coluna"}</span>${o.prev?"":`<button type="button" class="icbtn" data-usend="${esc(x.id)}" aria-label="Enviar a coluna">${ICON.send}</button>`}<i class="cs123-pg" aria-hidden="true"><b></b></i></div>
    <div class="cs123-sc">${ed132ArtHTML(x,c,o)}</div></div>`}catch(e){return _lh.apply(this,arguments)}}}
/* cartão do Feed: chamada escolhida, série e capa opcional */
function ed132CardHTML(x,c){const id=esc(x.id),f=c.capa!==false&&x.fotos[0],u=f&&ed132Url(f),tz=c.cham||cs123Teaser(c.corpo),min=ed132Min(c.corpo);
  return `<div class="cs123-card gut" data-cs123ler="${id}"><p class="cs123-k">${esc(ed132Kick(c))}</p>
    <h3 class="cs123-t"><button type="button" data-cs123ler="${id}">${esc(c.tit)}</button></h3>${c.linha?`<p class="cs123-l">${esc(c.linha)}</p>`:""}
    ${f?`<button type="button" class="cs123-capa" data-cs123ler="${id}" aria-label="Ler a coluna">${u?`<img src="${pubSrc(u)}" alt="${esc((x.estilo.alt||[])[0]||"")}" loading="lazy" decoding="async">`:`<span class="up-sem">Foto indisponível</span>`}</button>`:""}
    ${tz?`<p class="cs123-x">${esc(tz)}</p>`:""}<div class="cs123-r"><span class="cs123-min">${min} min de leitura</span><button type="button" class="cs123-lb" data-cs123ler="${id}">Ler a coluna <i aria-hidden="true">›</i></button></div></div>`}
{const _ch=cs123CardHTML;cs123CardHTML=function(x,c){if(!c||(!c.html&&!c.cham&&!c.serie&&c.capa!==false))return _ch.apply(this,arguments);try{return ed132CardHTML(x,c)}catch(e){return _ch.apply(this,arguments)}}}
/* assunto do dia ligado: fecha a coluna e abre a notícia */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-ed132abre]");if(!b)return;e.stopPropagation();e.preventDefault();const id=b.dataset.ed132abre;closeLayer();setTimeout(()=>{try{openSnap(id)}catch(_){}},80)},true);

/* ===== 4. rascunhos: no aparelho e (v12) no banco ===== */
const ed132RK=()=>"prumo-ed132-rasc:"+S.uid;
function ed132RascLe(){try{const l=JSON.parse(localStorage.getItem(ed132RK())||"[]");return Array.isArray(l)?l.filter(r=>r&&typeof r.rid==="string"&&/^[a-z0-9]{4,40}$/.test(r.rid)).sort((a,b)=>(b.at||0)-(a.at||0)):[]}catch(e){return []}}
function ed132RascGrava(l){try{localStorage.setItem(ed132RK(),JSON.stringify(l.sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,30)));return true}catch(e){return false}}
function ed132RascPoe(d){const l=ed132RascLe().filter(r=>r.rid!==d.rid);l.unshift(d);return ed132RascGrava(l)}
function ed132RascTira(rid){ed132RascGrava(ed132RascLe().filter(r=>r.rid!==rid));ed132RemTira(rid)}
async function ed132RemPoe(d){if(ED132.v12.ra!==true||typeof SB==="undefined"||!SB||!S.uid)return false;const dados={...d};delete dados.sync;
  try{let r=await SB.from("coluna_rascunhos").update({dados}).eq("rid",d.rid).select("rid");if(r.error)throw r.error;
    if(!(r.data||[]).length){r=await SB.from("coluna_rascunhos").insert({autor:S.uid,rid:d.rid,dados}).select("rid");if(r.error)throw r.error}
    const l=ed132RascLe(),k=l.find(x=>x.rid===d.rid);if(k&&(k.at||0)<=(d.at||0)){k.sync=true;ed132RascGrava(l)}return true}catch(e){return false}}
async function ed132RemTira(rid){if(ED132.v12.ra!==true||typeof SB==="undefined"||!SB)return;try{await SB.from("coluna_rascunhos").delete().eq("rid",rid)}catch(e){}}
async function ed132Sinc(){if(ED132.v12.ra===null)await ed132Testa();if(ED132.v12.ra!==true||!SB)return false;let rem;
  try{const r=await SB.from("coluna_rascunhos").select("rid,dados,at").order("at",{ascending:false}).limit(30);if(r.error)return false;rem=(r.data||[]).map(x=>({...(x.dados&&typeof x.dados==="object"?x.dados:{}),rid:x.rid,at:Math.max(+x.at||0,+(x.dados&&x.dados.at)||0),sync:true}))}catch(e){return false}
  const loc=ed132RascLe(),ids=new Set(rem.map(r=>r.rid)),aberto=ED132.E&&ED132.E.rid,sobe=[];
  const out=rem.map(r=>{const l=loc.find(x=>x.rid===r.rid);if(l&&(!l.sync&&(l.at||0)>=(r.at||0)||r.rid===aberto)){if(!l.sync)sobe.push(l);return l}return r});
  loc.forEach(l=>{if(ids.has(l.rid))return;if(l.sync&&l.rid!==aberto)return;/* sync e sumiu do banco = apagado em outro aparelho */out.push(l);sobe.push(l)});
  ed132RascGrava(out);for(const l of sobe)await ed132RemPoe(l);return true}
/* os rascunhos do editor antigo (123) viram rascunhos do novo */
function ed132Migra(){if(!S.uid)return;let l;try{l=JSON.parse(localStorage.getItem("prumo-cs123-rasc:"+S.uid)||"null")}catch(e){l=null}if(!Array.isArray(l))return;
  const meus=ed132RascLe();l.forEach(r=>{if(!r||!r.rid||meus.some(m=>m.rid===String(r.rid).toLowerCase()))return;const rid=/^[a-z0-9]{4,40}$/.test(String(r.rid))?String(r.rid):ED132_RID();
    meus.push({rid,at:+r.at||Date.now(),tit:cs123S(r.tit,90),linha:cs123S(r.linha,160),cham:"",html:ed132DeMarkdown(r.corpo),tags:cs123S(r.tags,120),serie:"",n:0,pautas:[],pub:r.pub==="seguidores"?"seguidores":"amigos",capa:null,
      capaDu:typeof r.capa==="string"&&/^data:image\//.test(r.capa)?r.capa:null,pal:ed132Palavras(r.corpo),sync:false})});
  if(ed132RascGrava(meus))try{localStorage.removeItem("prumo-cs123-rasc:"+S.uid)}catch(e){}}
/* o cartão "Escrever coluna" conta os rascunhos novos */
cs123RascLe=function(){try{ed132Migra()}catch(e){}return ed132RascLe()};

/* ===== 5. abrir o editor ===== */
function ed132Novo(o){return {rid:ED132_RID(),modo:"novo",pubId:null,ag:false,tit:"",linha:"",cham:"",html:"",tags:"",serie:"",n:0,pautas:[],pub:"amigos",capa:null,agendar:false,qd:"",qh:"",
  env:false,ver:false,pvAba:"pag",st:"",subindo:0,salvou:false,descartar:false,...o}}
function ed132DoRasc(d){const E=ed132Novo({rid:d.rid,tit:cs123S(d.tit,90),linha:cs123S(d.linha,160),cham:cs123S(d.cham,240),html:ed132Limpa(d.html,{dono:S.uid}),tags:cs123S(d.tags,120),serie:cs123S(d.serie,60),
  n:Math.max(0,Math.floor(+d.n)||0),pautas:Array.isArray(d.pautas)?d.pautas.slice(0,3).filter(p=>p&&p.id&&p.t):[],pub:d.pub==="seguidores"?"seguidores":"amigos",capa:typeof d.capa==="string"&&ED132_FOTO.test(d.capa)&&d.capa.indexOf(S.uid+"/")===0?{p:d.capa}:null,salvou:true});
  if(d.quando&&typeof d.quando==="object"&&/^\d{4}-\d{2}-\d{2}$/.test(d.quando.d||"")&&/^\d{2}:\d{2}$/.test(d.quando.h||"")){E.agendar=true;E.qd=d.quando.d;E.qh=d.quando.h}
  if(!E.capa&&d.capaDu){E.subindo++;fetch(d.capaDu).then(r=>r.blob()).then(b=>pubSobe(b)).then(p=>{ED132.urls[p]=d.capaDu;if(ED132.E===E){E.capa={p};ed132CapaDesenha();ed132Agenda()}}).catch(()=>{}).finally(()=>{E.subindo--})}
  return E}
function ed132Abre(E){if(precisaConta())return;const L=$("#layer");if(L.innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}
  ED132.E=E;L.innerHTML=`<div class="ed132" role="dialog" aria-modal="true" aria-label="${E.modo==="editar"?"Editar coluna":"Nova coluna"}"></div>`;if(pushH())HST++;
  ed132Desenha();ed132Kb();const ps=ed132FotosDo(E.html);if(E.capa)ps.push(E.capa.p);if(ps.length)ed132Assina(ps).then(()=>{if(ED132.E===E){ed132EdFotos();ed132CapaDesenha()}});
  if(ED132.v12.ag===null||ED132.v12.ve===null)ed132Testa().then(()=>{if(ED132.E===E&&!$("#layer2")?.innerHTML)ed132Cab()});
  setTimeout(()=>{if(ED132.E!==E)return;const i=E.tit?$("#ed132-corpo"):$("#ed132-tit");try{if(i){i.focus({preventScroll:true});if(i.id==="ed132-corpo")ed132CaretFim(i,true)}}catch(e){}},80)}
cs123EdAbre=function(pre){pre=pre||{};try{ed132Migra()}catch(e){}const tem=!!(pre.tit||pre.corpo);
  if(!tem&&(ed132RascLe().length||ED132.agend.length))return ed132Hub();
  ed132Abre(ed132Novo({tit:cs123S(pre.tit,90),html:pre.corpo?ed132DeTexto(String(pre.corpo)):""}))};
function ed132Tags(x){const t=String(x.texto||""),i=t.indexOf("\n\n");if(i<0)return "";const ult=t.split("\n\n").pop();return /^#/.test(ult)?ult:""}
function ed132Edita(id){const x=ed132Pub(id),c=x&&cs123Col(x);if(!x||!c||x.autor!==S.uid){toast("Esta coluna não está disponível para editar.");return}
  if(typeof ED!=="undefined"&&ED){ED=null}
  const ag=ed132Agendada(x),E=ed132Novo({modo:"editar",pubId:x.id,ag,tit:c.tit,linha:c.linha,cham:c.cham||"",html:c.html?ed132Limpa(c.html):ed132DeMarkdown(c.corpo),tags:ed132Tags(x),serie:c.serie||"",n:c.n||0,
    pautas:c.pautas||[],pub:x.publico==="seguidores"?"seguidores":"amigos",capa:c.capa!==false&&x.fotos&&x.fotos[0]?{p:x.fotos[0]}:null});
  if(ag){const p=ed132SpPartes(Date.parse(x.publicar_em));E.agendar=true;E.qd=p.d;E.qh=p.h}
  ed132Abre(E);if(ED132.E===E){ed132Le();E.html0=E.html;E.orig=ed132Assin(E)}}
mc1104Abre=function(id){ed132Edita(id)};
const ed132Assin=E=>JSON.stringify([E.tit,E.linha,E.cham,E.html,E.tags,E.serie,E.n,(E.pautas||[]).map(p=>p.id),E.capa&&E.capa.p,E.agendar,E.qd,E.qh]);
const ed132Sujo=E=>!!(E&&E.modo==="editar"&&(ed132Le(),ed132Assin(E)!==E.orig));

/* ===== 6. desenho do editor ===== */
function ed132StTx(){const E=ED132.E;if(!E)return "";if(E.modo==="editar")return E.ag?"Agendada para "+ed132Quando(ed132DeSp(E.qd,E.qh)):"Publicada";
  return {salvando:"Salvando…",salvo:"Rascunho salvo",local:"Salvo neste aparelho",erro:"Não deu para salvar neste aparelho"}[E.st]||"Rascunho"}
function ed132St(){const s=$("#layer > .ed132 .ed132-st");if(s)s.textContent=ed132StTx()}
function ed132Cab(){const E=ED132.E,h=$("#layer > .ed132 > .ed132-h");if(!E||!h)return;const ed=E.modo==="editar";
  h.innerHTML=`<button type="button" class="icbtn ed132-x${E.descartar?" conf":""}" data-ed132x aria-label="Fechar">${E.descartar?"Descartar?":ICON.close}</button>
    <div class="ed132-ht"><b>${ed?(E.ag?"Coluna agendada":"Editar coluna"):"Nova coluna"}</b><small class="ed132-st" aria-live="polite">${esc(ed132StTx())}</small></div>
    <button type="button" class="icbtn" data-ed132mais aria-label="Mais opções">${ICON.dots}</button>
    ${ed?`<button type="button" class="btn ed132-pb" data-ed132salva ${E.env?"disabled":""}>${E.env?"Salvando…":"Salvar"}</button>`:`<button type="button" class="btn ed132-pb" data-ed132painel ${E.env?"disabled":""}>${E.env?"Publicando…":"Publicar"}</button>`}`}
function ed132CapaHTML(){const E=ED132.E,u=E&&E.capa&&ed132Url(E.capa.p);
  return E&&E.capa?`<div class="ed132-cpi">${u?`<img src="${pubSrc(u)}" alt="">`:`<span class="up-sem">Carregando a foto…</span>`}<span class="ed132-cpb"><button type="button" data-ed132capa>Trocar</button><button type="button" data-ed132capax>Tirar</button></span></div>`
    :`<button type="button" class="ed132-cpa" data-ed132capa>${ed132Svg(ED132_IC.foto)}<span>Foto de capa<small>opcional · sua foto ou de fonte livre, com crédito</small></span></button>`}
function ed132CapaDesenha(){const c=$("#layer > .ed132 .ed132-capa");if(c)c.innerHTML=ed132CapaHTML()}
function ed132BarHTML(){const b=(k,ic,lb,tx)=>`<button type="button" data-ed132cmd="${k}" aria-label="${lb}" title="${lb}">${ic?ed132Svg(ic):""}${tx||""}</button>`;
  return b("mais",ED132_IC.mais,"Inserir bloco")+b("b","","Negrito (Ctrl+B)","<b>N</b>")+b("i","","Itálico (Ctrl+I)","<i>I</i>")+b("a",ED132_IC.link,"Link (Ctrl+K)")+b("h2","","Título","<span class=\"ed132-bt\">T</span>")+b("h3","","Subtítulo","<span class=\"ed132-bt ed132-bt3\">T</span>")
    +b("q",ED132_IC.aspas,"Citação")+b("ul",ED132_IC.lista,"Lista")+b("ol",ED132_IC.num,"Lista numerada")+b("hr",ED132_IC.sep,"Separador")+b("foto",ED132_IC.foto,"Foto")+b("graf",ED132_IC.graf,"Gráfico do Prumo")}
function ed132Desenha(){const el=$("#layer > .ed132"),E=ED132.E;if(!el||!E)return;
  el.classList.toggle("ed132-vendo",!!E.ver);
  el.innerHTML=`<div class="ed132-h"></div>
    <div class="ed132-m"><div class="ed132-seg" role="tablist" aria-label="Modo"><button type="button" role="tab" data-ed132modo="ed" aria-selected="${!E.ver}">Editar</button><button type="button" role="tab" data-ed132modo="ver" aria-selected="${!!E.ver}">Ver como leitor</button></div><span class="ed132-cont" data-ed132cont aria-live="polite"></span></div>
    <div class="ed132-sc"${E.ver?" hidden":""}><div class="ed132-in">
      <div class="ed132-capa">${ed132CapaHTML()}</div>
      <textarea id="ed132-tit" class="ed132-tit" data-ed132f="tit" maxlength="90" rows="1" placeholder="Título" enterkeyhint="next" aria-label="Título da coluna">${esc(E.tit)}</textarea>
      <textarea id="ed132-lin" class="ed132-lin" data-ed132f="linha" maxlength="160" rows="1" placeholder="Linha fina: uma frase que resume e chama para a leitura" enterkeyhint="next" aria-label="Linha fina">${esc(E.linha)}</textarea>
      <div id="ed132-corpo" class="ed132-txt" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Texto da coluna" spellcheck="true" data-ph="Escreva a coluna. Digite / para inserir título, citação, lista, foto ou gráfico."></div>
      <p class="ed132-dica">Dica: no começo de uma linha, digite <b>/</b> para escolher o bloco. No computador, Ctrl+B, Ctrl+I e Ctrl+K.</p></div></div>
    <div class="ed132-ver"${E.ver?"":" hidden"}></div>
    <div class="ed132-bar" role="toolbar" aria-label="Formatação"${E.ver?" hidden":""}>${ed132BarHTML()}</div>
    <div class="ed132-menu" role="listbox" aria-label="Inserir bloco" hidden></div>`;
  ed132Cab();const cp=$("#ed132-corpo");cp.innerHTML=ed132ParaEditor(E.html)||"<p><br></p>";ed132Vazia(cp);
  el.querySelectorAll("textarea.ed132-tit,textarea.ed132-lin").forEach(ed132Cresce);ed132Conta(true);if(E.ver)ed132Ver()}
function ed132Cresce(t){if(!t)return;t.style.height="auto";t.style.height=(t.scrollHeight+2)+"px"}
function ed132Vazia(cp){cp=cp||$("#ed132-corpo");if(cp)cp.classList.toggle("ed132-vz",!cp.textContent.trim()&&!cp.querySelector("figure,hr,li"))}
function ed132FigFoto(p,leg,cred){const f=document.createElement("figure");f.className="ed132-fe";f.contentEditable="false";f.setAttribute("data-f",p);const u=ed132Url(p);
  f.innerHTML=`${u?`<img src="${pubSrc(u)}" alt="">`:`<span class="up-sem">Carregando a foto…</span>`}<figcaption>${esc(leg||"")}${cred?`<small>${esc(cred)}</small>`:""}</figcaption><button type="button" class="ed132-fb" data-ed132fig>Legenda e crédito</button>`;return f}
function ed132FigGraf(s,per){const f=document.createElement("figure");f.className="ed132-fe ed132-feg";f.contentEditable="false";f.setAttribute("data-g",s);f.setAttribute("data-p",ED132_PER.test(per||"")?per:"24m");
  f.innerHTML=`<div class="ed132-fg">${ed132Grafico(s,per)}</div><button type="button" class="ed132-fb" data-ed132fig>Trocar ou tirar o gráfico</button>`;return f}
function ed132ParaEditor(html){const tp=document.createElement("template");tp.innerHTML=ed132Limpa(html);
  tp.content.querySelectorAll("figure[data-f]").forEach(f=>{const c=ed132Cap(f);f.replaceWith(ed132FigFoto(f.getAttribute("data-f"),c.leg,c.cred))});
  tp.content.querySelectorAll("figure[data-g]").forEach(f=>f.replaceWith(ed132FigGraf(f.getAttribute("data-g"),f.getAttribute("data-p"))));
  const d=document.createElement("div");d.appendChild(tp.content);return d.innerHTML}
function ed132EdFotos(){document.querySelectorAll("#ed132-corpo figure[data-f]").forEach(f=>{if(f.querySelector("img"))return;const u=ed132Url(f.getAttribute("data-f"));if(!u)return;const s=f.querySelector(".up-sem");const im=document.createElement("img");im.src=u;im.alt="";if(s)s.replaceWith(im)})}
/* lê o editor para E (o HTML passa pela lista branca) */
function ed132Le(){const E=ED132.E,cp=$("#ed132-corpo");if(!E)return E;if(cp)E.html=ed132Limpa(cp.innerHTML,{dono:S.uid});const t=$("#ed132-tit"),l=$("#ed132-lin");if(t)E.tit=t.value.replace(/\n+/g," ");if(l)E.linha=l.value.replace(/\n+/g," ");return E}
function ed132Conta(ja){const f=()=>{const E=ED132.E,el=$("#layer > .ed132 [data-ed132cont]"),cp=$("#ed132-corpo");if(!E||!el)return;const pl=cp?ed132Plano(ed132Limpa(cp.innerHTML)):ed132Plano(E.html);const n=ed132Palavras(pl);
    el.textContent=`${cs123Num(n)} ${n===1?"palavra":"palavras"} · ${Math.max(1,Math.round(n/200))} min de leitura${typeof V9!=="undefined"&&V9.on===false?" · por enquanto, até 6.000 caracteres":""}`;el.dataset.n=n};clearTimeout(ED132.ct);if(ja)f();else ED132.ct=setTimeout(f,180)}
/* salvar sozinho: 2 s depois da última mudança */
function ed132Agenda(){const E=ED132.E;if(!E||E.modo==="editar")return;clearTimeout(ED132.gt);ED132.gt=setTimeout(()=>ed132Guarda(),2000)}
function ed132Mudou(){ed132Vazia();ed132Conta();ed132Agenda();const E=ED132.E;if(E&&E.descartar){E.descartar=false;ed132Cab()}}
function ed132Rasc(E){const tem=!!(E.tit.trim()||E.linha.trim()||!ed132Vazio(E.html)||E.capa);if(!tem)return null;
  return {rid:E.rid,at:Date.now(),tit:E.tit,linha:E.linha,cham:E.cham,html:E.html,tags:E.tags,serie:E.serie,n:E.n||0,pautas:E.pautas,pub:E.pub,capa:E.capa&&E.capa.p||null,
    quando:E.agendar&&E.qd&&E.qh?{d:E.qd,h:E.qh}:null,pal:ed132Palavras(ed132Plano(E.html)),sync:false}}
function ed132Guarda(){const E=ED132.E;if(!E||E.modo==="editar"||E.env)return;clearTimeout(ED132.gt);ed132Le();ed132LePainel();const d=ed132Rasc(E);
  if(!d){if(E.salvou){ed132RascTira(E.rid);E.salvou=false}return}
  const ok=ed132RascPoe(d);E.salvou=true;E.st=ok?"local":"erro";
  if(ED132.v12.ra===true){E.st="salvando";ed132RemPoe(d).then(r=>{if(ED132.E===E){E.st=r?"salvo":ok?"local":"erro";ed132St()}})}ed132St()}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&ED132.E)try{ed132Guarda()}catch(e){}});
addEventListener("pagehide",()=>{if(ED132.E)try{ed132Guarda()}catch(e){}});

/* ===== 7. teclado, seleção e comandos ===== */
function ed132Kb(){const el=$("#layer > .ed132");if(!el)return;const v=window.visualViewport;const kb=v?Math.max(0,innerHeight-v.height-v.offsetTop):0;el.style.setProperty("--ed132-kb",Math.round(kb)+"px")}
if(window.visualViewport){visualViewport.addEventListener("resize",ed132Kb);visualViewport.addEventListener("scroll",ed132Kb)}
document.addEventListener("selectionchange",()=>{const cp=$("#ed132-corpo");if(!cp)return;const s=getSelection();if(s&&s.rangeCount&&cp.contains(s.anchorNode)){ED132.rg=s.getRangeAt(0).cloneRange();ed132BarEstado()}});
function ed132BarEstado(){const b=$("#layer > .ed132 .ed132-bar");if(!b)return;const q=k=>{try{return document.queryCommandState(k)}catch(e){return false}},tp=ed132Topo()?.tagName||"";
  const st={b:q("bold"),i:q("italic"),h2:tp==="H2",h3:tp==="H3",q:tp==="BLOCKQUOTE",ul:tp==="UL",ol:tp==="OL"};
  b.querySelectorAll("[data-ed132cmd]").forEach(x=>{const k=x.dataset.ed132cmd;if(k in st)x.setAttribute("aria-pressed",st[k]?"true":"false")})}
function ed132Topo(n){const cp=$("#ed132-corpo");if(!cp)return null;if(!n){const s=getSelection();n=s&&s.rangeCount?s.anchorNode:null}while(n&&n.parentNode!==cp){if(n===cp||!n.parentNode)return null;n=n.parentNode}return n&&n.nodeType===1?n:null}
function ed132CaretFim(el){try{const r=document.createRange();r.selectNodeContents(el);r.collapse(false);const s=getSelection();s.removeAllRanges();s.addRange(r);ED132.rg=r.cloneRange()}catch(e){}}
function ed132Foco(){const cp=$("#ed132-corpo");if(!cp)return null;const s=getSelection();
  if(!(s&&s.rangeCount&&cp.contains(s.anchorNode))){try{cp.focus({preventScroll:true})}catch(e){}if(ED132.rg&&cp.contains(ED132.rg.startContainer)){s.removeAllRanges();s.addRange(ED132.rg)}else{const u=cp.lastElementChild;ed132CaretFim(u&&u.tagName==="P"?u:cp)}}
  try{document.execCommand("defaultParagraphSeparator",false,"p");document.execCommand("styleWithCSS",false,false)}catch(e){}return cp}
/* blocos: título, subtítulo, citação, parágrafo e listas (tocar de novo no mesmo bloco volta a parágrafo) */
function ed132TiraCitacao(b){const fr=document.createDocumentFragment();let p0=null,txt=null;
  [...b.childNodes].forEach(n=>{if(n.nodeType===1&&ED132_BLOCOS.has(n.tagName)){fr.appendChild(n);p0=p0||n;txt=null}else{if(!txt){txt=document.createElement("p");fr.appendChild(txt);p0=p0||txt}txt.appendChild(n)}});
  if(!p0){p0=document.createElement("p");p0.innerHTML="<br>";fr.appendChild(p0)}b.replaceWith(fr);ed132CaretFim(p0);return p0}
function ed132Bloco(tag){const cp=ed132Foco();if(!cp)return;let b=ed132Topo();if(b&&(b.tagName==="FIGURE"||b.tagName==="HR"))return;let cur=b?b.tagName.toLowerCase():"p";
  if(tag==="ul"||tag==="ol"){if(cur==="blockquote")ed132TiraCitacao(b);document.execCommand(tag==="ul"?"insertUnorderedList":"insertOrderedList");return}
  if(cur==="ul"||cur==="ol"){document.execCommand(cur==="ul"?"insertUnorderedList":"insertOrderedList");b=ed132Topo();cur=b?b.tagName.toLowerCase():"p"}
  if(cur==="blockquote"){ed132TiraCitacao(b);if(tag==="blockquote"||tag==="p")return}
  document.execCommand("formatBlock",false,"<"+(cur===tag?"p":tag)+">")}
function ed132PoeBloco(el){const cp=ed132Foco();if(!cp)return;let b=ed132Topo();if(!b){cp.appendChild(el)}else if(b.tagName==="P"&&!b.textContent.trim()&&!b.querySelector("img"))b.replaceWith(el);else b.after(el);
  let nx=el.nextElementSibling;if(!nx||nx.tagName!=="P"){nx=document.createElement("p");nx.innerHTML="<br>";el.after(nx)}ed132CaretFim(nx);ed132Mudou()}
function ed132Cmd(k){if(k==="mais"){ed132MenuAbre("",false);return}if(k==="foto"){ed132Foto(false);return}if(k==="graf"){ed132Graf(null);return}if(k==="a"){ed132Link();return}
  const cp=ed132Foco();if(!cp)return;
  if(k==="b")document.execCommand("bold");else if(k==="i")document.execCommand("italic");else if(k==="hr")ed132PoeBloco(document.createElement("hr"));
  else ed132Bloco(k==="q"?"blockquote":k);ed132Mudou();ed132BarEstado()}
/* menu de blocos ("/" no começo da linha ou o botão +) */
function ed132MenuItens(q){const n=norm(q||"").trim();return ED132_BLOCOS_MENU.filter(([k,t,d])=>!n||norm(t).indexOf(n)>=0||norm(d).indexOf(n)>=0||k===n)}
function ed132MenuAbre(q,barra){const m=$("#layer > .ed132 .ed132-menu");if(!m)return;const its=ed132MenuItens(q);if(!its.length){ed132MenuFecha();return}
  if(ED132.mq===null||ED132.mq!==q)ED132.mi=0;ED132.mq=q;ED132.mbar=!!barra;ED132.mi=Math.min(ED132.mi,its.length-1);
  m.innerHTML=`<p class="ed132-mt">Inserir</p>${its.map(([k,t,d,ic],i)=>`<button type="button" role="option" data-ed132bl="${k}" aria-selected="${i===ED132.mi}"><span class="ed132-mi">${ic?ed132Svg(ED132_IC[ic]):`<b class="ed132-bt${k==="h3"?" ed132-bt3":""}">T</b>`}</span><span><b>${t}</b><small>${d}</small></span></button>`).join("")}`;
  m.hidden=false}
function ed132MenuFecha(){const m=$("#layer > .ed132 .ed132-menu");if(m){m.hidden=true;m.innerHTML=""}ED132.mq=null;ED132.mbar=false}
function ed132MenuEscolhe(k){const barra=ED132.mbar;ed132MenuFecha();if(barra){const b=ed132Topo();if(b&&/^\//.test(b.textContent)){b.innerHTML="<br>";ed132CaretFim(b)}}ed132Cmd(k)}
/* link */
function ed132Link(){const cp=ed132Foco();if(!cp)return;const s=getSelection(),rg=s.rangeCount?s.getRangeAt(0).cloneRange():null;let a=rg&&rg.startContainer;while(a&&a!==cp&&!(a.nodeType===1&&a.tagName==="A"))a=a.parentNode;if(a===cp)a=null;
  ED132.lrg=rg;ED132.la=a||null;
  sheet("Link",`<label class="ed132-lab">Endereço<input id="ed132-url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" placeholder="https://" value="${esc(a?a.getAttribute("href"):"")}"></label>
    ${rg&&rg.collapsed&&!a?`<label class="ed132-lab">Texto do link<input id="ed132-urlt" maxlength="160" placeholder="O texto que aparece"></label>`:""}<p class="hint">Só endereços seguros (https://). Para a notícia, prefira o link da fonte.</p>`,
    `${a?`<button type="button" class="btn ghost" data-ed132linkx>Tirar o link</button>`:""}<button type="button" class="btn" data-ed132linkok>Pôr o link</button>`,{focus:true})}
function ed132LinkPoe(tira){const v=String(($("#ed132-url")||{}).value||"").trim(),tx=String(($("#ed132-urlt")||{}).value||"").trim();let u="";
  if(!tira){u=edUrlOk(/^https?:\/\//i.test(v)?v.replace(/^http:/i,"https:"):"https://"+v);if(!u||!/\./.test(v)){toast("Use um endereço que comece com https://");return}}
  closeLayer();const cp=$("#ed132-corpo");if(!cp)return;try{cp.focus({preventScroll:true})}catch(e){}const s=getSelection();if(ED132.lrg&&cp.contains(ED132.lrg.startContainer)){s.removeAllRanges();s.addRange(ED132.lrg)}
  if(tira){if(ED132.la){const a=ED132.la;a.replaceWith(...a.childNodes)}else document.execCommand("unlink")}
  else if(ED132.la){ED132.la.setAttribute("href",u)}
  else if(ED132.lrg&&!ED132.lrg.collapsed)document.execCommand("createLink",false,u);
  else document.execCommand("insertHTML",false,`<a href="${esc(u)}">${esc(tx||edDom(u))}</a>&nbsp;`);
  ED132.la=null;ed132Mudou()}
/* fotos (capa e do texto): sobem para a pasta da pessoa no Storage dos posts */
function ed132Foto(capa){const root=$("#layer > .ed132");if(!root)return;if(!capa)ED132.rg=ED132.rg||null;$("#ed132-file")?.remove();const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.id="ed132-file";inp.hidden=true;inp.dataset.capa=capa?"1":"";root.appendChild(inp);
  inp.addEventListener("change",async()=>{const f=inp.files&&inp.files[0];inp.remove();const E=ED132.E;if(!f||!E)return;E.subindo++;toast("Enviando a foto…");
    try{const b=await pubComprime(f,1600);const u=URL.createObjectURL(b);const p=await pubSobe(b);ED132.urls[p]=u;PUB.urls[p]={u,exp:Date.now()+3600e3};if(ED132.E!==E)return;
      document.querySelectorAll(".toast").forEach(t=>t.remove());
      if(capa){E.capa={p};ed132CapaDesenha();ed132Mudou()}else{const fig=ed132FigFoto(p,"","");ed132PoeBloco(fig);setTimeout(()=>ed132FigEdita(fig,true),120)}}
    catch(e){toast("Não deu para enviar essa foto. Tente outra.")}finally{E.subindo=Math.max(0,E.subindo-1)}});
  try{inp.click()}catch(e){}}
function ed132FigEdita(fig,nova){if(!fig||!fig.isConnected)return;ED132.fig=fig;
  if(fig.hasAttribute("data-g")){sheet("Gráfico",`<p class="hint">O gráfico mostra sempre o dado mais novo do acervo do Prumo.</p>`,`<button type="button" class="btn ghost" data-ed132figx>Tirar o gráfico</button><button type="button" class="btn" data-ed132figg>Trocar o gráfico</button>`);return}
  const c=ed132Cap(fig);
  sheet(nova?"Foto no texto":"Foto",`<label class="ed132-lab">Legenda<input id="ed132-leg" maxlength="200" value="${esc(c.leg)}" placeholder="O que a foto mostra"></label>
    <label class="ed132-lab">Crédito<input id="ed132-cred" maxlength="120" value="${esc(c.cred)}" placeholder="Ex.: Foto: Ana Lima ou Agência Brasil (licença livre)"></label>
    <p class="hint">Só fotos suas ou de fontes livres, sempre com o crédito. Nada de imagem feita por IA de pessoa real.</p>`,
    `<button type="button" class="btn ghost" data-ed132figx>Tirar a foto</button><button type="button" class="btn" data-ed132figok>Pronto</button>`,{focus:true})}
/* gráfico do acervo (séries de series/index.json, as mesmas do js/110) */
async function ed132Indice(){if(ED132.idx&&ED132.idx.length)return ED132.idx;try{const r=await fetch("series/index.json",{cache:"no-cache"});const d=await r.json();ED132.idx=(d&&Array.isArray(d.series)?d.series:[]).filter(s=>s&&ED132_SER.test(s.id||"")&&s.nome).slice(0,40)}catch(e){ED132.idx=[]}return ED132.idx}
async function ed132Graf(fig){ED132.figG=fig||null;const l=await ed132Indice();if(!ED132.E)return;if(!l.length){toast("O acervo de gráficos não abriu agora. Tente de novo.");return}
  sheet("Gráfico do Prumo",`<p class="hint">Séries do acervo do Prumo, atualizadas pelos robôs. O gráfico fica sempre com o dado mais novo.</p><div class="ed132-gl">${l.map(s=>`<div class="ed132-gi"><b>${esc(s.nome)}</b><small>${esc(s.fonte||"")}</small><span>${[["24m","2 anos"],["5a","5 anos"],["10a","10 anos"]].map(([p,t])=>`<button type="button" class="chip" data-ed132gs="${esc(s.id)}" data-ed132gp="${p}">${t}</button>`).join("")}</span></div>`).join("")}</div>`)}

/* ===== 8. colar e soltar: só a formatação que o Prumo usa ===== */
document.addEventListener("paste",e=>{const cp=e.target&&e.target.closest&&e.target.closest("#ed132-corpo");if(!cp)return;e.preventDefault();const dt=e.clipboardData;if(!dt)return;
  const h=dt.getData("text/html"),t=dt.getData("text/plain");let l=h?ed132Limpa(h,{dono:S.uid}):"";if(!l&&t)l=ed132DeTexto(t);if(!l)return;
  if(/^<p>(?:(?!<\/?p>)[\s\S])*<\/p>$/.test(l))l=l.slice(3,-4);ed132Foco();document.execCommand("insertHTML",false,l);
  cp.querySelectorAll("figure:not(.ed132-fe)").forEach(f=>{if(f.hasAttribute("data-f")){const c=ed132Cap(f);f.replaceWith(ed132FigFoto(f.getAttribute("data-f"),c.leg,c.cred))}else if(f.hasAttribute("data-g"))f.replaceWith(ed132FigGraf(f.getAttribute("data-g"),f.getAttribute("data-p")));else f.remove()});
  cp.querySelectorAll("script,style,iframe,object,embed,img,[style]").forEach(x=>{if(x.tagName==="IMG"&&x.closest("figure.ed132-fe"))return;if(/^(?:IMG|SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(x.tagName))x.remove();else x.removeAttribute("style")});
  cp.querySelectorAll("*").forEach(x=>{[...x.attributes].forEach(a=>{if(/^on/i.test(a.name))x.removeAttribute(a.name)})});ed132EdFotos();ed132Mudou()},true);
document.addEventListener("drop",e=>{const cp=e.target&&e.target.closest&&e.target.closest("#ed132-corpo");if(!cp)return;e.preventDefault()},true);

/* ===== 9. eventos do editor ===== */
document.addEventListener("input",e=>{const t=e.target;if(!t||!ED132.E||!t.closest||!t.closest("#layer > .ed132"))return;const E=ED132.E;
  if(t.id==="ed132-corpo"){ed132Mudou();const b=ed132Topo();const tx=b&&b.tagName==="P"?b.textContent:"";if(/^\/[\p{L}\p{N} ]{0,20}$/u.test(tx))ed132MenuAbre(tx.slice(1),true);else if(ED132.mbar)ed132MenuFecha();return}
  if(t.dataset.ed132f==="tit"||t.dataset.ed132f==="linha"){if(/\n/.test(t.value))t.value=t.value.replace(/\n+/g," ");E[t.dataset.ed132f]=t.value;ed132Cresce(t);ed132Mudou();return}
  if(t.id==="ed132-cham"){E.cham=t.value.replace(/\n+/g," ");ed132PainelCard();ed132Agenda();return}
  if(t.id==="ed132-ser"){E.serie=t.value;const nn=$("#ed132-num");if(nn&&!nn.value&&E.serie.trim()){const m=ed132DaSerie(S.uid,E.serie).reduce((a,o)=>Math.max(a,o.n||0),0);nn.placeholder=String(m+1)}ed132PainelCard();ed132Agenda();return}
  if(t.id==="ed132-num"){E.n=Math.max(0,Math.min(9999,Math.floor(+t.value)||0));ed132PainelCard();ed132Agenda();return}
  if(t.id==="ed132-tags"){E.tags=t.value;try{htSugere(t)}catch(_){}ed132Agenda();return}
  if(t.id==="ed132-qd"||t.id==="ed132-qh"){E[t.id==="ed132-qd"?"qd":"qh"]=t.value;ed132PainelBotao();ed132Agenda();return}},true);
document.addEventListener("keydown",e=>{const t=e.target;if(!t||!ED132.E||!t.closest||!t.closest("#layer > .ed132"))return;
  if(e.key==="Enter"&&(t.id==="ed132-tit"||t.id==="ed132-lin")){e.preventDefault();if(t.id==="ed132-tit")$("#ed132-lin")?.focus();else{const cp=$("#ed132-corpo");if(cp){cp.focus();const p=cp.firstElementChild;if(p)try{const r=document.createRange();r.setStart(p,0);r.collapse(true);const s=getSelection();s.removeAllRanges();s.addRange(r)}catch(_){}}}return}
  if(t.id!=="ed132-corpo")return;const m=$("#layer > .ed132 .ed132-menu"),aberto=m&&!m.hidden;
  if(aberto){const n=m.querySelectorAll("[data-ed132bl]").length;
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();ED132.mi=(ED132.mi+(e.key==="ArrowDown"?1:n-1))%n;ed132MenuAbre(ED132.mq,ED132.mbar);return}
    if(e.key==="Enter"){e.preventDefault();const b=m.querySelectorAll("[data-ed132bl]")[ED132.mi];if(b)ed132MenuEscolhe(b.dataset.ed132bl);return}
    if(e.key==="Escape"){e.preventDefault();e.stopPropagation();ed132MenuFecha();return}}
  /* Enter numa linha vazia da citação sai da citação */
  if(e.key==="Enter"&&!e.shiftKey){const b=ed132Topo();if(b&&b.tagName==="BLOCKQUOTE"&&!(b.textContent||"").trim()){e.preventDefault();const p=document.createElement("p");p.innerHTML="<br>";b.replaceWith(p);ed132CaretFim(p);ed132Mudou();return}
    if(b&&b.tagName==="BLOCKQUOTE"){const s=getSelection();let n=s&&s.anchorNode;while(n&&n.parentNode!==b)n=n.parentNode;
    if(n&&n.nodeType===1&&!(n.textContent||"").trim()&&(b.textContent||"").trim()){e.preventDefault();n.remove();const p=document.createElement("p");p.innerHTML="<br>";b.after(p);ed132CaretFim(p);ed132Mudou();return}}}
  if((e.ctrlKey||e.metaKey)&&!e.altKey){const k=e.key.toLowerCase();if(k==="b"||k==="i"||k==="k"){e.preventDefault();ed132Cmd(k==="k"?"a":k);return}}
  if(e.key==="Escape"){e.stopPropagation()}});
/* a barra não tira o foco do texto */
["pointerdown","mousedown"].forEach(k=>document.addEventListener(k,e=>{const b=e.target.closest&&e.target.closest("#layer > .ed132 .ed132-bar button,#layer > .ed132 .ed132-menu button");if(b)e.preventDefault()},true));
document.addEventListener("focusin",e=>{if(e.target&&e.target.id==="ed132-corpo"){try{document.execCommand("defaultParagraphSeparator",false,"p")}catch(_){}}});
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  /* folhas do editor (em #layer2) */
  if(t.closest("[data-ed132linkok]")){pare();ed132LinkPoe(false);return}
  if(t.closest("[data-ed132linkx]")){pare();ed132LinkPoe(true);return}
  if(t.closest("[data-ed132figok]")){pare();const f=ED132.fig;if(f&&f.isConnected){const leg=String(($("#ed132-leg")||{}).value||"").trim().slice(0,200),cred=String(($("#ed132-cred")||{}).value||"").trim().slice(0,120);
    const c=f.querySelector("figcaption");if(c)c.innerHTML=esc(leg)+(cred?`<small>${esc(cred)}</small>`:"")}closeLayer();ed132Mudou();return}
  if(t.closest("[data-ed132figx]")){pare();const f=ED132.fig;closeLayer();if(f&&f.isConnected){const nx=f.nextElementSibling;f.remove();if(nx)ed132CaretFim(nx)}ed132Mudou();return}
  if(t.closest("[data-ed132figg]")){pare();const f=ED132.fig;closeLayer();setTimeout(()=>ed132Graf(f),60);return}
  if(b=t.closest("[data-ed132gs]")){pare();const s=b.dataset.ed132gs,p=b.dataset.ed132gp,f=ED132.figG;closeLayer();ED132.figG=null;const n=ed132FigGraf(s,p);if(f&&f.isConnected){f.replaceWith(n);ed132Mudou()}else ed132PoeBloco(n);return}
  if(b=t.closest("[data-ed132vr]")){pare();ed132Restaura(+b.dataset.ed132vr);return}
  if(t.closest("[data-ed132hub]")){pare();closeLayer();setTimeout(()=>{if(ED132.E)ed132Guarda();ed132Hub()},60);return}
  if(t.closest("[data-ed132hist]")){pare();closeLayer();setTimeout(ed132Historico,60);return}
  if(t.closest("[data-ed132det]")){pare();closeLayer();setTimeout(ed132Painel,60);return}
  if(t.closest("[data-ed132rapaga]")){pare();const E=ED132.E;closeLayer();if(E){ed132RascTira(E.rid);E.salvou=false;ED132.E=null;closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}toast("Rascunho apagado")}return}
  if(t.closest("[data-ed132desc]")){pare();closeLayer();const E=ED132.E;if(E){E.descartar=true;ED132.E=null;closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}return}
  if(t.closest("#layer2"))return;
  /* Minhas colunas */
  if(t.closest("#layer > .ed132-hubr")){
    if(t.closest("[data-ed132x]")){pare();history.back();return}
    if(t.closest("[data-ed132nova]")){pare();ed132Abre(ed132Novo({}));return}
    if(b=t.closest("[data-ed132rabre]")){pare();const d=ed132RascLe().find(r=>r.rid===b.dataset.ed132rabre);if(d)ed132Abre(ed132DoRasc(d));return}
    if(b=t.closest("[data-ed132rx]")){pare();if(!b.classList.contains("conf")){b.classList.add("conf");b.textContent="Apagar mesmo?";setTimeout(()=>{if(b.isConnected){b.classList.remove("conf");b.textContent="Apagar"}},3000);return}
      ed132RascTira(b.dataset.ed132rx);ed132HubRedesenha();toast("Rascunho apagado");return}
    if(b=t.closest("[data-ed132agedit]")){pare();ed132Edita(b.dataset.ed132agedit);return}
    if(b=t.closest("[data-ed132agja]")){pare();ed132AgoraAg(b.dataset.ed132agja);return}
    if(b=t.closest("[data-ed132agx]")){pare();if(!b.classList.contains("conf")){b.classList.add("conf");b.textContent="Cancelar mesmo?";setTimeout(()=>{if(b.isConnected){b.classList.remove("conf");b.textContent="Cancelar"}},3000);return}ed132CancelaAg(b.dataset.ed132agx);return}
    return}
  const root=t.closest("#layer > .ed132");if(!root||!ED132.E)return;const E=ED132.E;
  if(t.closest("[data-ed132pub]")){pare();ed132Publica();return}
  if(t.closest("[data-ed132salva]")){pare();ed132Publica();return}
  if(E.env&&t.closest("button")){pare();return}
  if(t.closest("[data-ed132x]")){pare();if(E.modo==="editar"&&ed132Sujo(E)&&!E.descartar){E.descartar=true;ed132Cab();toast("Alterações não salvas. Toque de novo para descartar, ou em Salvar.");return}if(E.descartar)E.descartar="sim";history.back();return}
  if(t.closest("[data-ed132ppx]")){pare();$("#layer > .ed132 .ed132-pp")?.remove();return}
  if(t.closest("[data-ed132painel]")){pare();ed132Painel();return}
  if(t.closest("[data-ed132mais]")){pare();ed132Mais();return}
  if(b=t.closest("[data-ed132modo]")){pare();ed132Modo(b.dataset.ed132modo==="ver");return}
  if(b=t.closest("[data-ed132pva]")){pare();E.pvAba=b.dataset.ed132pva==="feed"?"feed":"pag";ed132Ver();return}
  if(t.closest("[data-ed132capa]")){pare();ed132Foto(true);return}
  if(t.closest("[data-ed132capax]")){pare();E.capa=null;ed132CapaDesenha();ed132Mudou();return}
  if(b=t.closest("[data-ed132cmd]")){pare();ed132Cmd(b.dataset.ed132cmd);return}
  if(b=t.closest("[data-ed132bl]")){pare();ed132MenuEscolhe(b.dataset.ed132bl);return}
  if(b=t.closest("[data-ed132fig]")){pare();ed132FigEdita(b.closest("figure"));return}
  if(b=t.closest("#ed132-corpo figure.ed132-fe")){pare();ed132FigEdita(b);return}
  if(b=t.closest("[data-ed132pt]")){pare();const id=b.dataset.ed132pt,tx=b.dataset.t||"";const i=E.pautas.findIndex(p=>p.id===id);if(i>=0)E.pautas.splice(i,1);else if(E.pautas.length>=3){toast("Até 3 assuntos por coluna.");return}else E.pautas.push({id,t:tx});
    b.setAttribute("aria-pressed",i<0?"true":"false");ed132Agenda();return}
  if(b=t.closest("[data-ed132pubv]")){pare();E.pub=b.dataset.ed132pubv==="seguidores"?"seguidores":"amigos";root.querySelectorAll("[data-ed132pubv]").forEach(x=>x.setAttribute("aria-checked",x===b?"true":"false"));const ph=root.querySelector("[data-ed132pubh]");if(ph)ph.textContent=ed132PubTx(E.pub);ed132Agenda();return}
  if(b=t.closest("[data-ed132qv]")){pare();E.agendar=b.dataset.ed132qv==="ag";if(E.agendar&&!E.qd){const p=ed132SpPartes(Math.ceil((Date.now()+3600e3)/9e5)*9e5);E.qd=p.d;E.qh=p.h}ed132Painel(true);ed132Agenda();return}
  if(!t.closest("#layer > .ed132 .ed132-menu")&&!t.closest("#ed132-corpo"))ed132MenuFecha()},true);
function ed132Mais(){const E=ED132.E;if(!E)return;const ed=E.modo==="editar";
  sheet("Coluna",`<div class="opt">${ed?`<button type="button" data-ed132det>Chamada, série e hashtags<span>como a coluna aparece no Feed${E.ag?" e quando sai":""}</span></button>`:""}
    ${ed&&ED132.v12.ve===true?`<button type="button" data-ed132hist>Histórico de versões<span>ver e restaurar uma versão anterior</span></button>`:""}
    <button type="button" data-ed132hub>Minhas colunas<span>rascunhos${ED132.v12.ag===true?" e agendadas":""}</span></button>
    ${!ed&&E.salvou?`<button type="button" class="dang" data-ed132rapaga>Apagar este rascunho</button>`:""}${ed?`<button type="button" data-ed132desc>Descartar as alterações</button>`:""}</div>`)}
function ed132Modo(ver){const E=ED132.E,el=$("#layer > .ed132");if(!E||!el)return;if(ver)ed132Le();E.ver=!!ver;ed132MenuFecha();el.classList.toggle("ed132-vendo",E.ver);
  el.querySelectorAll("[data-ed132modo]").forEach(b=>b.setAttribute("aria-selected",(b.dataset.ed132modo==="ver")===E.ver?"true":"false"));
  el.querySelector(".ed132-sc").hidden=E.ver;el.querySelector(".ed132-bar").hidden=E.ver;el.querySelector(".ed132-ver").hidden=!E.ver;if(E.ver)ed132Ver();else{ed132Conta(true)}}

/* ===== 10. ver como leitor (página da coluna e cartão do Feed, como vão sair) ===== */
function ed132Falsa(E){const P=ed132Monta(E),q=E.agendar&&ED132.v12.ag===true?ed132DeSp(E.qd,E.qh):NaN,x0=E.pubId?ed132Pub(E.pubId):null;
  const x={id:E.pubId||"ed132-previa",autor:S.uid,tipo:"post",at:x0?(isFinite(q)&&E.ag?q:+x0.at||Date.now()):isFinite(q)?q:Date.now(),editado:x0&&!E.ag&&ed132Editado(x0)?x0.editado:null,texto:P.texto,fotos:P.fotos,
    estilo:{v:2,alt:[],coluna:P.col},publico:E.pub,corpo:P.html};return x}
function ed132CardFeed(x){let h="";try{const y={...x,estilo:{...x.estilo}};pubLimpa(y);const c=cs123Col(y);h=pubPostHTML(y);if(!h||h.indexOf("cs123-card")<0)h=`<article class="post">${ed132CardHTML(y,c)}</article>`}catch(e){try{h=`<article class="post">${ed132CardHTML(x,cs123Col(x))}</article>`}catch(_){h=""}}return h}
function ed132Ver(){const E=ED132.E,v=$("#layer > .ed132 .ed132-ver");if(!E||!v)return;const x=ed132Falsa(E),c=cs123Col(x);
  if(!c){v.innerHTML=`<p class="hint ed132-pvv">Dê um título à coluna para ver como ela fica.</p>`;return}
  v.innerHTML=`<div class="ed132-vt" role="tablist" aria-label="O que ver"><button type="button" role="tab" data-ed132pva="pag" aria-selected="${E.pvAba!=="feed"}">Página da coluna</button><button type="button" role="tab" data-ed132pva="feed" aria-selected="${E.pvAba==="feed"}">Cartão no Feed</button></div>
    <div class="ed132-vp">${E.pvAba==="feed"?`<div class="ed132-pvf" inert>${ed132CardFeed(x)}</div><p class="hint ed132-pvh">É assim que a coluna aparece no Feed de quem pode ler.</p>`:`<div class="ed132-pvp" inert>${ed132ArtHTML(x,c,{prev:true,tags:E.tags})}</div>`}</div>`}

/* ===== 11. antes de publicar: chamada, série, hashtags, assuntos, público e quando ===== */
function ed132SpPartes(ms){const o={};try{new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date(ms)).forEach(p=>{o[p.type]=p.value})}catch(e){}
  return {d:`${o.year}-${o.month}-${o.day}`,h:`${o.hour==="24"?"00":o.hour}:${o.minute}`}}
function ed132DeSp(d,h){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||""),n=/^(\d{2}):(\d{2})$/.exec(h||"");if(!m||!n)return NaN;const g=Date.UTC(+m[1],+m[2]-1,+m[3],+n[1],+n[2]),p=ed132SpPartes(g);
  const g2=Date.UTC(+p.d.slice(0,4),+p.d.slice(5,7)-1,+p.d.slice(8,10),+p.h.slice(0,2),+p.h.slice(3,5));return g+(g-g2)}
function ed132Quando(ms){if(!isFinite(ms))return "";try{return new Date(ms).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}catch(e){return ""}}
function ed132Assuntos(E){const ps=(typeof FEED!=="undefined"&&FEED&&Array.isArray(FEED.pautas)?(typeof ordenadas==="function"?ordenadas(FEED.pautas):FEED.pautas):[]).filter(p=>p&&p.id!=null);
  const tx=norm(E.tit+" "+E.linha+" "+ed132Plano(E.html).slice(0,4000)),pal=new Set(tx.match(/[a-z0-9]{5,}/g)||[]);
  return ps.map((p,i)=>{const t=String(p.neutro&&p.neutro.titulo||p.titulo||"");let s=0;(norm(t).match(/[a-z0-9]{5,}/g)||[]).forEach(w=>{if(pal.has(w))s++});return {id:String(p.id),t:t.slice(0,140),s,i}})
    .filter(o=>o.t).sort((a,b)=>b.s-a.s||a.i-b.i).slice(0,3).map(o=>({id:o.id,t:o.t}))}
function ed132SugCham(E){return cs123Teaser(ed132Plano(E.html))}
function ed132Painel(re){const E=ED132.E,root=$("#layer > .ed132");if(!E||!root)return;ed132Le();ed132MenuFecha();const ed=E.modo==="editar",sug=ed132SugCham(E),ag=ED132.v12.ag===true&&(!ed||E.ag);
  const pts=ed132Assuntos(E),todos=[...E.pautas,...pts.filter(p=>!E.pautas.some(q=>q.id===p.id))].slice(0,6);
  const sers=[...new Set((typeof pubVisiveis==="function"?pubVisiveis():[]).concat(ED132.agend).filter(x=>x&&x.autor===S.uid).map(x=>{const c=cs123Col(x);return c&&c.serie}).filter(Boolean))];
  const pub=typeof V9!=="undefined"&&V9.on&&CS123.aberto&&!ed;
  const sc=root.querySelector(".ed132-pp .ed132-pps"),top=sc?sc.scrollTop:0;root.querySelector(".ed132-pp")?.remove();
  root.insertAdjacentHTML("beforeend",`<div class="ed132-pp" role="dialog" aria-modal="true" aria-label="${ed?"Detalhes da coluna":"Publicar coluna"}">
    <div class="ed132-h"><button type="button" class="cs123-v" data-ed132ppx>${ICON.back}<span>Texto</span></button><div class="ed132-ht"><b>${ed?"Detalhes da coluna":"Antes de publicar"}</b></div></div>
    <div class="ed132-pps"><div class="ed132-in">
      <section class="ed132-ps"><h3>Chamada no Feed</h3><textarea id="ed132-cham" maxlength="240" rows="3" placeholder="${esc(sug||"Uma ou duas frases que chamam para a leitura")}">${esc(E.cham)}</textarea>
        <p class="hint">${sug?"Vazia, o Feed usa o começo do texto (o que aparece acima, em cinza).":"Vazia, o Feed usa o começo do texto."}</p></section>
      <section class="ed132-ps"><h3>Série <small>opcional</small></h3><div class="ed132-sr"><input id="ed132-ser" list="ed132-sers" maxlength="60" autocomplete="off" placeholder="Ex.: Bastidores de Brasília" value="${esc(E.serie)}">
        <label class="ed132-nl">Nº<input id="ed132-num" type="number" inputmode="numeric" min="1" max="9999" value="${E.n||""}" placeholder="${E.serie?String(ed132DaSerie(S.uid,E.serie).reduce((a,o)=>Math.max(a,o.n||0),0)+1):""}"></label></div>
        <datalist id="ed132-sers">${sers.map(s=>`<option value="${esc(s)}">`).join("")}</datalist><p class="hint">A página da coluna mostra a série e leva à anterior e à próxima.</p></section>
      <section class="ed132-ps"><h3>Hashtags <small>opcional</small></h3><input id="ed132-tags" maxlength="120" autocomplete="off" placeholder="#Economia #Previdência" value="${esc(E.tags)}"></section>
      ${todos.length?`<section class="ed132-ps"><h3>Assuntos do dia <small>até 3</small></h3><p class="hint">Ligue a coluna às notícias de hoje; quem lê chega à notícia pela coluna.</p><div class="ed132-ptl">${todos.map(p=>`<button type="button" class="ed132-pc" data-ed132pt="${esc(p.id)}" data-t="${esc(p.t)}" aria-pressed="${E.pautas.some(q=>q.id===p.id)}">${esc(p.t)}</button>`).join("")}</div></section>`:""}
      ${pub?`<section class="ed132-ps"><h3>Quem pode ler</h3><div class="cs123-pub" role="radiogroup" aria-label="Quem pode ler"><button type="button" role="radio" data-ed132pubv="amigos" aria-checked="${E.pub!=="seguidores"}">Amigos</button><button type="button" role="radio" data-ed132pubv="seguidores" aria-checked="${E.pub==="seguidores"}">Seguidores e amigos</button></div><p class="hint" data-ed132pubh>${ed132PubTx(E.pub)}</p></section>`:""}
      ${ag?`<section class="ed132-ps"><h3>Quando publicar</h3><div class="ed132-qv" role="radiogroup" aria-label="Quando publicar"><button type="button" role="radio" data-ed132qv="ja" aria-checked="${!E.agendar}">${ed?"Publicar agora":"Agora"}</button><button type="button" role="radio" data-ed132qv="ag" aria-checked="${!!E.agendar}">Agendar</button></div>
        ${E.agendar?`<div class="ed132-qq"><label class="ed132-lab">Dia<input id="ed132-qd" type="date" value="${esc(E.qd)}" min="${ed132SpPartes(Date.now()).d}"></label><label class="ed132-lab">Hora<input id="ed132-qh" type="time" step="300" value="${esc(E.qh)}"></label></div><p class="hint">Horário de Brasília. Até a hora, só você vê a coluna (em Minhas colunas).</p>`:""}</section>`:""}
      <section class="ed132-ps"><h3>Como aparece no Feed</h3><div class="ed132-pvf" inert></div></section>
    </div></div>
    <div class="ed132-ppf"><button type="button" class="btn" data-ed132pub></button></div></div>`);
  ed132PainelCard();ed132PainelBotao();const ns=root.querySelector(".ed132-pp .ed132-pps");if(ns&&re)ns.scrollTop=top}
const ed132PubTx=p=>p==="seguidores"?"Quem segue você e seus amigos podem ler.":"Seus amigos no Prumo podem ler.";
function ed132LePainel(){const E=ED132.E;if(!E)return;const g=id=>{const el=document.getElementById(id);return el?el.value:null};let v;
  if((v=g("ed132-cham"))!==null)E.cham=v.replace(/\n+/g," ");if((v=g("ed132-ser"))!==null)E.serie=v;if((v=g("ed132-num"))!==null)E.n=Math.max(0,Math.min(9999,Math.floor(+v)||0));
  if((v=g("ed132-tags"))!==null)E.tags=v;if((v=g("ed132-qd"))!==null)E.qd=v;if((v=g("ed132-qh"))!==null)E.qh=v}
function ed132PainelCard(){const E=ED132.E,b=$("#layer > .ed132 .ed132-pp .ed132-pvf");if(!E||!b)return;ed132LePainel();const x=ed132Falsa(E);b.innerHTML=cs123Col(x)?ed132CardFeed(x):`<p class="hint">Dê um título à coluna.</p>`}
function ed132PainelBotao(){const E=ED132.E,b=$("#layer > .ed132 .ed132-pp [data-ed132pub]");if(!E||!b)return;const ed=E.modo==="editar",ag=E.agendar&&ED132.v12.ag===true;
  b.disabled=!!E.env;b.textContent=E.env?(ed?"Salvando…":"Publicando…"):ed?(E.ag&&!E.agendar?"Publicar agora":"Salvar"):ag?`Agendar para ${ed132Quando(ed132DeSp(E.qd,E.qh))||"…"}`:"Publicar agora"}

/* ===== 12. publicar, salvar e agendar ===== */
function ed132Monta(E){const tags=cs123Tags(E.tags),tit=E.tit.trim().slice(0,90),linha=E.linha.trim().slice(0,160),html=E.html,pl=ed132Plano(html);
  const col={v:1,f:"h",tit,linha,min:ed132Min(pl),capa:!!(E.capa&&E.capa.p)};const ch=String(E.cham||"").trim().slice(0,240);if(ch)col.cham=ch;
  const se=String(E.serie||"").trim().slice(0,60);if(se){col.serie=se;if(E.n>0)col.n=Math.min(9999,Math.floor(E.n))}
  if(E.pautas.length)col.pautas=E.pautas.slice(0,3).map(p=>({id:String(p.id).slice(0,200),t:String(p.t||"").slice(0,140)}));
  const fotos=[];if(E.capa&&E.capa.p)fotos.push(E.capa.p);ed132FotosDo(html).forEach(p=>{if(!fotos.includes(p))fotos.push(p)});
  return {col,html,fotos,texto:(tit+(linha?"\n\n"+linha:"")+(tags.length?"\n\n"+tags.join(" "):"")).slice(0,2200)}}
function ed132Valida(E,P){if(!E.tit.trim())return "Dê um título à coluna.";if(ed132Plano(E.html).replace(/^(?:## |> )/gm,"").replace(/\s+/g," ").trim().length<40)return "Escreva o texto da coluna antes de publicar.";
  if(E.subindo>0)return "Espere a foto terminar de enviar.";if(P.fotos.length>10)return "A coluna pode ter até 10 fotos (com a capa).";
  const lim=cs123Lim();if(P.html.length>lim)return V9.on?"A coluna passou de 40.000 caracteres (contando a formatação). Encurte um pouco o texto.":"Por enquanto, a coluna pode ter até 6.000 caracteres (contando a formatação). Encurte um pouco o texto.";return ""}
const ed132Bytes=o=>{try{return new TextEncoder().encode(JSON.stringify(o)).length}catch(e){return JSON.stringify(o).length*2}};
function ed132Fecha(){ED132.E=null;if($("#layer > .ed132")){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}}
function ed132Erro(e){const m=String((e&&(e.code||""))+" "+(e&&e.message||""));return /agendamento longe/.test(m)?"Escolha uma data dentro de um ano.":/estilo|corpo|tamanho|23514|22023|check/i.test(m)?"A coluna passou do limite de tamanho do servidor. Encurte o texto e tente de novo.":""}
async function ed132Publica(){const E=ED132.E;if(!E||E.env||typeof SB==="undefined"||!SB)return;ed132Le();ed132LePainel();const P=ed132Monta(E),er=ed132Valida(E,P);if(er){toast(er);return}
  if(E.modo==="editar")return ed132Salva(P);
  if(!$("#layer > .ed132 .ed132-pp")){ed132Painel();return}
  let q=null;if(E.agendar&&ED132.v12.ag===true){q=ed132DeSp(E.qd,E.qh);if(!isFinite(q)){toast("Escolha o dia e a hora.");return}if(q<Date.now()+4*60e3){toast("Escolha um horário daqui a pelo menos 5 minutos.");return}if(q>Date.now()+365*864e5){toast("Escolha uma data dentro de um ano.");return}}
  const estilo={v:2,coluna:P.col};if(!V9.on){P.col.corpo=P.html;if(ed132Bytes(estilo)>7600){toast("Por enquanto, a coluna precisa ser um pouco menor (o limite é de cerca de 6.000 caracteres). Encurte o texto.");return}}
  E.env=true;ed132Cab();ed132PainelBotao();clearTimeout(ED132.gt);
  try{const row={autor:S.uid,tipo:"post",texto:P.texto,fotos:P.fotos,estilo,publico:typeof V9!=="undefined"&&V9.on&&CS123.aberto&&E.pub==="seguidores"?"seguidores":"amigos"};if(V9.on)row.corpo=P.html;if(q)row.publicar_em=new Date(q).toISOString();
    const r=await SB.from("publicacoes").insert(row).select("id");if(r.error)throw r.error;const id=r.data&&r.data[0]&&r.data[0].id;
    P.fotos.forEach(p=>{const u=ED132.urls[p];if(u&&!PUB.urls[p])PUB.urls[p]={u,exp:Date.now()+3600e3}});
    if(id){const z={...row,id,at:q||Date.now()};try{pubLimpa(z)}catch(e){}if(q)ED132.agend=[...ED132.agend.filter(x=>x.id!==id),z].sort((a,b)=>Date.parse(a.publicar_em)-Date.parse(b.publicar_em));else if(!pubDe(id))PUB.itens.unshift(z)}
    ed132RascTira(E.rid);ed132Fecha();
    if(q)toast(`Coluna agendada para ${ed132Quando(q)}. Até lá, só você vê.`,"Ver",()=>ed132Hub());else{toast("Coluna publicada");try{vibrar(10)}catch(e){}}
    uso(q?"coluna_agendada":"coluna_publicada");try{pubRedesenha()}catch(e){}setTimeout(()=>{try{pubCarregar()}catch(e){}},400)}
  catch(e){E.env=false;if(ED132.E===E){ed132Cab();ed132PainelBotao()}toast(ed132Erro(e)||"Não deu para publicar agora. O texto continua aqui.")}}
/* editar a coluna publicada (ou agendada): título, linha fina, texto, fotos (v12), chamada, série, hashtags e assuntos */
async function ed132Salva(P){const E=ED132.E;if(!E||E.env||!SB)return;const id=E.pubId,x=ed132Pub(id);if(!x){toast("Esta coluna já foi apagada.");return}
  let q;if(E.ag&&ED132.v12.ag===true){if(E.agendar){q=ed132DeSp(E.qd,E.qh);if(!isFinite(q)||q<Date.now()+60e3){toast("Escolha um horário mais à frente (ou “Publicar agora”).");return}}else q=null}
  E.env=true;ed132Cab();ed132PainelBotao();const falha=m=>{E.env=false;if(ED132.E===E){ed132Cab();ed132PainelBotao()}toast(m)};
  try{const s=await SB.from("publicacoes").select("estilo,corpo,fotos").eq("id",id).limit(1);if(s.error)throw s.error;const raw=s.data&&s.data[0];if(!raw){falha("Esta coluna já foi apagada.");return}
    const es0=raw.estilo&&typeof raw.estilo==="object"&&!Array.isArray(raw.estilo)?raw.estilo:{},c0=es0.coluna&&typeof es0.coluna==="object"?es0.coluna:{};
    const naColuna=typeof raw.corpo==="string"&&raw.corpo.length>0,col={...c0,...P.col};["cham","serie","n","pautas"].forEach(k=>{if(!(k in P.col))delete col[k]});
    /* texto igual ao que abriu: a coluna antiga (com "## " e "> ") fica no formato antigo, sem regravar o texto */
    const mudouTexto=P.html!==E.html0,velha=c0.f!=="h";if(!mudouTexto&&velha){delete col.f;col.min=c0.min||col.min}
    const upd={texto:P.texto,estilo:{...es0,coluna:col}};
    if(naColuna){delete col.corpo;if(mudouTexto&&P.html!==raw.corpo)upd.corpo=P.html}
    else if(mudouTexto||!velha){if(P.html.length>CS123_LIM_V8){falha("Por enquanto, esta coluna pode ter até 6.000 caracteres (contando a formatação). Encurte um pouco o texto.");return}col.corpo=P.html}else col.corpo=c0.corpo
    const f0=Array.isArray(raw.fotos)?raw.fotos:[];if(JSON.stringify(f0)!==JSON.stringify(P.fotos)){if(ED132.v12.ag!==true){falha("Trocar ou incluir fotos numa coluna já publicada ainda não está ligado no servidor. O resto do texto continua aqui.");return}upd.fotos=P.fotos}
    if(q!==undefined&&(q===null||Math.abs(q-Date.parse(x.publicar_em))>30e3))upd.publicar_em=q===null?null:new Date(q).toISOString();
    if(ed132Bytes(upd.estilo)>7600){falha("Por enquanto, esta coluna precisa ser um pouco menor (o limite é de cerca de 6.000 caracteres). Encurte o texto.");return}
    let r=await SB.from("publicacoes").update(upd).eq("id",id).select("id");let semCorpo=false;
    if(r.error&&upd.corpo!==undefined&&/42501|permission|privileg/i.test(String(r.error.code||"")+" "+String(r.error.message||""))){
      /* o servidor ainda não deixa mudar o texto longo: salva o resto (no formato em que o texto está) e avisa */
      const c2={...col};if(velha){delete c2.f;c2.min=c0.min||c2.min}const sem=o=>{const z={...o};["corpo","min","capa","f"].forEach(k=>delete z[k]);return JSON.stringify(Object.keys(z).sort().map(k=>[k,z[k]]))};
      if(upd.texto===x.texto&&sem(c2)===sem(c0)){falha("Mudar o texto da coluna ainda não está ligado no servidor. Por enquanto, dá para mudar o título, a linha fina e as hashtags.");return}
      delete upd.corpo;upd.estilo={...es0,coluna:c2};Object.keys(col).forEach(k=>delete col[k]);Object.assign(col,c2);semCorpo=true;r=await SB.from("publicacoes").update(upd).eq("id",id).select("id")}
    if(r.error)throw r.error;if(!(r.data||[]).length){falha("Não deu para salvar agora. O texto continua aqui.");return}
    x.texto=upd.texto;if(x.estilo&&typeof x.estilo==="object")x.estilo.coluna={...col};if(upd.corpo!==undefined)x.corpo=upd.corpo;if(upd.fotos)x.fotos=upd.fotos.slice();
    P.fotos.forEach(p=>{const u=ED132.urls[p];if(u&&!PUB.urls[p])PUB.urls[p]={u,exp:Date.now()+3600e3}});
    let saiu=false;if(upd.publicar_em!==undefined){if(upd.publicar_em===null){x.publicar_em=new Date().toISOString();x.at=Date.now();saiu=true}else{x.publicar_em=upd.publicar_em;x.at=q}}
    if(!E.ag)x.editado=Date.now();
    if(saiu){ED132.agend=ED132.agend.filter(y=>y.id!==id);if(!pubDe(id))PUB.itens.unshift(x)}
    ed132Fecha();toast(saiu?"Coluna publicada":semCorpo?"Título e linha fina salvos. Mudar o texto da coluna ainda não está ligado no servidor.":E.ag?"Coluna agendada atualizada":"Coluna atualizada");uso("coluna_editada");
    try{VN112_Q&&VN112_Q.delete&&VN112_Q.delete(id)}catch(e){}try{pubRedesenha()}catch(e){}try{if(VIEW==="me")renderMe()}catch(e){}setTimeout(()=>{try{pubCarregar()}catch(e){}},400)}
  catch(e){falha(ed132Erro(e)||"Não deu para salvar agora. O texto continua aqui.")}}
async function ed132AgoraAg(id){const x=ED132.agend.find(y=>y.id===id);if(!x||!SB)return;try{const r=await SB.from("publicacoes").update({publicar_em:null}).eq("id",id).select("id");if(r.error)throw r.error;if(!(r.data||[]).length)throw new Error("nada");
    x.publicar_em=new Date().toISOString();x.at=Date.now();ED132.agend=ED132.agend.filter(y=>y.id!==id);if(!pubDe(id))PUB.itens.unshift(x);toast("Coluna publicada");ed132HubRedesenha();try{pubRedesenha()}catch(e){}setTimeout(()=>{try{PUB.sig="";pubCarregar()}catch(e){}},400)}
  catch(e){toast("Não deu para publicar agora. Tente de novo.")}}
async function ed132CancelaAg(id){const x=ED132.agend.find(y=>y.id===id),c=x&&cs123Col(x);if(!x||!c||!SB)return;
  const d={rid:ED132_RID(),at:Date.now(),tit:c.tit,linha:c.linha,cham:c.cham||"",html:c.html?ed132Limpa(c.html):ed132DeMarkdown(c.corpo),tags:ed132Tags(x),serie:c.serie||"",n:c.n||0,pautas:c.pautas||[],
    pub:x.publico==="seguidores"?"seguidores":"amigos",capa:c.capa!==false&&x.fotos[0]||null,quando:null,pal:ed132Palavras(c.corpo),sync:false};
  if(!ed132RascPoe(d)){toast("Não deu para guardar o rascunho neste aparelho. Nada foi apagado.");return}
  try{const r=await SB.from("publicacoes").delete().eq("id",id);if(r&&r.error)throw r.error;ED132.agend=ED132.agend.filter(y=>y.id!==id);ed132RemPoe(d);ed132HubRedesenha();toast("Agendamento cancelado. A coluna voltou para os rascunhos.")}
  catch(e){ed132RascGrava(ed132RascLe().filter(r=>r.rid!==d.rid));toast("Não deu para cancelar agora. Tente de novo.")}}

/* ===== 13. histórico de versões (v12) ===== */
async function ed132Historico(){const E=ED132.E;if(!E||!E.pubId||!SB)return;let l=[];
  try{const r=await SB.from("coluna_versoes").select("id,at,tit,linha,corpo,coluna").eq("pub",E.pubId).order("at",{ascending:false}).limit(30);if(r.error)throw r.error;l=r.data||[]}catch(e){toast("O histórico não abriu agora.");return}
  ED132.vers=l;if(ED132.E!==E)return;
  sheet("Histórico de versões",l.length?`<p class="hint">Cada vez que a coluna foi publicada ou salva. Restaurar põe a versão no editor; ela só vale depois de Salvar.</p><ul class="ed132-vl">${l.map((v,i)=>{const html=v.coluna&&v.coluna.f==="h"?v.corpo:ed132DeMarkdown(v.corpo),n=ed132Palavras(ed132Plano(html));
      return `<li><span><b>${esc(ed132DataHora(+v.at))}${i===0?" · atual":""}</b><small>${esc(v.tit)} · ${cs123Num(n)} palavras</small></span>${i===0?"":`<button type="button" class="btn ghost" data-ed132vr="${i}">Restaurar</button>`}</li>`}).join("")}</ul>`
    :`<p class="hint">Ainda não há versões guardadas desta coluna. Elas começam a aparecer depois da próxima vez que você salvar.</p>`)}
function ed132Restaura(i){const E=ED132.E,v=(ED132.vers||[])[i];if(!E||!v)return;const k=v.coluna&&typeof v.coluna==="object"?v.coluna:{};
  E.tit=cs123S(v.tit,90);E.linha=cs123S(v.linha,160);E.html=k.f==="h"?ed132Limpa(v.corpo):ed132DeMarkdown(v.corpo);E.cham=cs123S(k.cham,240);E.serie=cs123S(k.serie,60);E.n=Math.max(0,Math.floor(+k.n)||0);
  if(Array.isArray(k.pautas))E.pautas=k.pautas.slice(0,3).filter(p=>p&&p.id&&p.t);closeLayer();E.ver=false;ed132Desenha();ed132EdFotos();
  toast(`Versão de ${ed132DataHora(+v.at)} no editor. Toque em Salvar para manter.`)}

/* ===== 14. Minhas colunas: rascunhos e agendadas ===== */
function ed132HubHTML(){const rs=ed132RascLe(),ag=ED132.agend,ra=ED132.v12.ra===true;
  return `<div class="ed132-h"><button type="button" class="icbtn" data-ed132x aria-label="Fechar">${ICON.close}</button><div class="ed132-ht"><b>Minhas colunas</b></div><span class="ed132-hs"></span></div>
    <div class="ed132-sc"><div class="ed132-in">
      <button type="button" class="btn ed132-nova" data-ed132nova>${ed132Svg(ED132_IC.mais)}Escrever nova coluna</button>
      ${ag.length?`<h3 class="ed132-hh">Agendadas <small>só você vê até a hora</small></h3><ul class="ed132-hl">${ag.map(x=>{const c=cs123Col(x);return `<li class="ed132-ag"><span class="ed132-hi"><b>${esc(c?c.tit:"Coluna")}</b><small>Sai ${esc(ed132Quando(Date.parse(x.publicar_em)))}</small></span>
        <span class="ed132-hb"><button type="button" class="btn ghost" data-ed132agedit="${esc(x.id)}">Editar</button><button type="button" class="btn ghost" data-ed132agja="${esc(x.id)}">Publicar agora</button><button type="button" class="btn ghost ed132-dg" data-ed132agx="${esc(x.id)}">Cancelar</button></span></li>`}).join("")}</ul>`:""}
      <h3 class="ed132-hh">Rascunhos <small>${ra?"na sua conta: abrem em qualquer aparelho":"guardados neste aparelho"}</small></h3>
      ${rs.length?`<ul class="ed132-hl">${rs.map(r=>`<li><button type="button" class="ed132-hi" data-ed132rabre="${esc(r.rid)}"><b>${esc(String(r.tit||"").trim()||"Sem título")}</b><small>${esc(quando(r.at))} · ${cs123Num(+r.pal||0)} ${+r.pal===1?"palavra":"palavras"}${r.quando?" · com data marcada":""}</small></button>
        <span class="ed132-hb"><button type="button" class="btn ghost" data-ed132rabre="${esc(r.rid)}">Continuar</button><button type="button" class="btn ghost ed132-dg" data-ed132rx="${esc(r.rid)}">Apagar</button></span></li>`).join("")}</ul>`
        :`<p class="hint ed132-hv">Nenhum rascunho. O que você escreve fica guardado sozinho enquanto escreve.</p>`}
    </div></div>`}
function ed132HubRedesenha(){const el=$("#layer > .ed132-hubr");if(el)el.innerHTML=ed132HubHTML()}
function ed132Hub(){if(precisaConta())return;const L=$("#layer");if(L.innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}try{ed132Migra()}catch(e){}
  L.innerHTML=`<div class="ed132-hubr" role="dialog" aria-modal="true" aria-label="Minhas colunas">${ed132HubHTML()}</div>`;if(pushH())HST++;
  Promise.resolve(ed132Testa()).then(()=>ed132Sinc()).then(ok=>{if(ok)ed132HubRedesenha()}).catch(()=>{})}

/* ===== 15. camadas: folhas por cima do editor; voltar salva o rascunho ===== */
{const _sh=sheet;sheet=function(){const r0=document.querySelector("#layer > .ed132, #layer > .ed132-hubr");if(r0&&!$("#layer2")?.innerHTML){r0.classList.add("cria");try{return _sh.apply(this,arguments)}finally{r0.classList.remove("cria")}}return _sh.apply(this,arguments)}}
{const _cl=closeLayer;closeLayer=function(fromPop){const l2=!!($("#layer2")&&$("#layer2").innerHTML),root=!l2&&$("#layer > .ed132");
  if(root&&!closeLayer._ok&&ED132.E){const E=ED132.E;
    const pp=root.querySelector(".ed132-pp");if(pp){pp.remove();if(fromPop===true&&pushH())HST++;return}
    if(E.env&&fromPop!==true){toast(E.modo==="editar"?"Salvando…":"Publicando…");return}
    if(E.modo==="editar"&&E.descartar!=="sim"&&ed132Sujo(E)){if(fromPop===true&&pushH())HST++;E.descartar=true;ed132Cab();toast("Alterações não salvas. Toque em Salvar, ou no × de novo para descartar.");return}
    if(E.modo!=="editar")try{ed132Guarda()}catch(e){}
    ED132.E=null;try{htFecha()}catch(e){}}
  else if(root&&closeLayer._ok)ED132.E=null;
  return _cl.apply(this,arguments)}}
