/* ===== 25/11: regra única de fotos (item 2 do balanço semanal) =====
   App e prévia do link (m/, tools/paginas.py) escolhiam a foto com listas e regras copiadas à mão, e uma correção
   chegava a um lado e não ao outro (Paulista na estreia da Anthropic, taça de 2016). Agora:
   1. bloqueios e condições moram num arquivo só, tools/fotos_regras.json (cópia abaixo; o teste
      tools/test_fotos_regras_2511.py falha se as duas divergirem). 'exige': a foto só entra se o título disser o lugar
      ou a empresa (sede da PF só com PF; avião da Alaska só com Alaska; Casa Branca só com governo dos EUA/Trump);
   2. o robô das páginas grava em m/fotos.json a foto que escolheu para cada notícia; quando esse arquivo é da mesma
      edição que o app abriu, Feed, matéria, giro e prévia usam a mesma escolha;
   3. descrição em inglês do nome do arquivo ("airliner taking off runway", "The White House June 2024") vira
      "Foto de arquivo (assunto da notícia)" para o leitor de tela. */
var FT213_REGRAS={"bloq":["hubbell-white house","hubbell-white_house","douglas tavolaro","luiz-inacio-lula-da-silva-8eb72b38","maidan nezalezhnosti","parque avenida building"],
  "exige":[{"nome":"policia federal","titulo":"policia federal|\\bpf\\b"},{"nome":"alaska airlines","titulo":"alaska"},{"nome":"delta air","titulo":"\\bdelta\\b"},
    {"nome":"united airlines","titulo":"united"},{"nome":"american airlines","titulo":"american airlines"},{"nome":"latam","titulo":"latam"},
    {"nome":"white house","titulo":"casa branca|trump|vance|governo (dos eua|americano|trump)|tarifa|washington"},
    {"nome":"casa branca","titulo":"casa branca|trump|vance|governo (dos eua|americano|trump)|tarifa|washington"}]};

try{FT213_REGRAS.bloq.forEach(b=>{if(FT157_BLOQ.indexOf(b)<0)FT157_BLOQ.push(b)})}catch(e){}
FT213_REGRAS.exige.forEach(r=>{try{r.re=new RegExp(r.titulo)}catch(e){r.re=/$^/}});
function ft213N(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
function ft213Nome(f){try{return ft213N(typeof ft157Arq==="function"?ft157Arq(f):decodeURIComponent(String(f.url).split("/").pop())).replace(/_/g," ")}catch(e){return ""}}
function ft213Ok(f,txt){if(!f||typeof f.url!=="string")return true;const n=ft213Nome(f);return FT213_REGRAS.exige.every(r=>n.indexOf(r.nome)<0||r.re.test(txt))}
{const _fl213=faListas;faListas=function(p,A){const L=_fl213.apply(this,arguments);try{if(!Array.isArray(L)||!p)return L;
  const txt=ft213N(String((p.neutro||{}).titulo||"")+" "+(typeof p.subtitulo==="string"?p.subtitulo:""));
  return L.map(l=>{if(!Array.isArray(l))return l;const r=l.filter(f=>ft213Ok(f,txt));if(r.length===l.length)return l;r.ft157o=l.ft157o;return r}).filter(l=>!Array.isArray(l)||l.length)}catch(e){return L}}}

/* 2. a escolha do robô das páginas */
var FT213_ESC=null;
function ft213Carrega(){try{fetch("m/fotos.json?t="+Math.floor(Date.now()/3e5),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{
  if(d&&typeof d==="object"&&d.mapa&&typeof d.mapa==="object"){FT213_ESC=d;try{for(const k in FA_CACHE)delete FA_CACHE[k]}catch(e){}}}).catch(()=>{})}catch(e){}}
function ft213Vale(){const F=typeof FEED!=="undefined"&&FEED;return !!(FT213_ESC&&F&&FT213_ESC.feed&&F.atualizado_em&&FT213_ESC.feed===F.atualizado_em)}
{const _fm213=faMapa;faMapa=function(){const M=_fm213.apply(this,arguments);try{if(!ft213Vale())return M;
  const E=FT213_ESC.mapa,R=Object.assign({},M||{});(FEED.pautas||[]).forEach(p=>{if(!p||!p.id)return;if(p.id in E)R[p.id]=E[p.id]?Object.assign({arquivo:true},E[p.id]):undefined});return R}catch(e){return M}}}
/* 26/11: a foto escolhida pelo robô que tem cópia no site (banco por assunto, acervo/c/…) abre a cópia do site, leve, em vez de ir buscar na fonte */
{const _al213=acvLocais;acvLocais=function(){const m=_al213.apply(this,arguments);try{const E=FT213_ESC&&FT213_ESC.mapa;if(E)for(const k in E){const f=E[k];
  if(f&&typeof f.url==="string"&&typeof f.local==="string"&&!m.has(f.url)&&/^acervo\/[\w\/.-]+\.(?:webp|jpe?g)$/i.test(f.local)&&!/\.\./.test(f.local)){try{m.set(f.url,new URL(f.local,location.href).href)}catch(e){}}}}catch(e){}return m}}
/* 27/11 (Pedro, opção 3): post só de texto ganha foto ilustrativa no fundo SÓ quando o assunto casa com clareza com o
   banco por assunto (m/acervo-posts.json, feito pelo robô das Páginas). O autor pode tirar no menu do post. */
var IP27=null,IP27_T=0;
function ip27Rx(w){try{w=String(w);if(!w||w.length>120)return null;
  if(w.indexOf("CS:")===0)return {cs:1,r:new RegExp(w.slice(3))};
  if(w.indexOf("UF:")===0){const uf=w.slice(3).replace(/[^A-Z]/g,"");return uf?{cs:1,r:new RegExp("(^|[^A-Za-zÀ-ÿ])"+uf+"($|[^A-Za-zÀ-ÿ])")}:null}
  return {cs:0,r:new RegExp("\\b"+w)}}catch(e){return null}}
function ip27Carrega(){if(IP27||Date.now()-IP27_T<6e4)return;IP27_T=Date.now();
  try{fetch("m/acervo-posts.json?t="+Math.floor(Date.now()/36e5)).then(r=>r.ok?r.json():null).then(d=>{if(!d||!Array.isArray(d.verbetes))return;
    IP27=d.verbetes.filter(v=>v&&typeof v.id==="string"&&Array.isArray(v.p)&&Array.isArray(v.f)).slice(0,400).map(v=>({id:v.id,k:Math.max(0,Math.floor(+v.k)||0),rx:v.p.slice(0,60).map(ip27Rx),
      f:v.f.filter(f=>f&&typeof f.l==="string"&&/^acervo\/[\w\/.-]+\.(?:webp|jpe?g)$/i.test(f.l)&&!/\.\./.test(f.l)).map(f=>({l:f.l,c:typeof f.c==="string"?f.c.slice(0,90):""}))})).filter(v=>v.f.length);
    try{if(document.querySelector(".upost .up-tx")&&typeof renderPosts==="function")renderPosts(true)}catch(e){}}).catch(()=>{})}catch(e){}}
/* o verbete casa se o texto tem uma das k primeiras palavras (o nome) ou 2 palavras diferentes da lista */
function ip27De(x,ignoraTirada){try{if(!x||x.tipo!=="post")return null;const es=x.estilo||{};if(es.semIlu&&!ignoraTirada)return null;
  const bruto=String(x.texto||"");if(bruto.trim().length<25)return null;if(!IP27){ip27Carrega();return null}
  const limpo=bruto.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
  for(const v of IP27){let n=0,nome=false;for(let i=0;i<v.rx.length;i++){const q=v.rx[i];if(!q||!q.r.test(q.cs?bruto:limpo))continue;n++;if(i<v.k){nome=true;break}if(n>=2)break}
    if(nome||n>=2){let h=0;const id=String(x.id||"");for(let i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))>>>0;const f=v.f[h%v.f.length];
      return {src:new URL(f.l,location.href).href,cred:creditoCurto("Foto ilustrativa: "+f.c),verbete:v.id}}}
  return null}catch(e){return null}}
async function ip27Troca(id){const x=pubDe(id);if(!x||x.autor!==S.uid)return;const tirar=!(x.estilo&&x.estilo.semIlu),es={...x.estilo};if(tirar)es.semIlu=true;else delete es.semIlu;
  try{const r=await SB.from("publicacoes").update({estilo:es}).eq("id",id);if(r&&r.error)throw r.error}catch(e){toast("Não deu para salvar agora.");return}
  x.estilo.semIlu=tirar;toast(tirar?"Foto tirada do fundo.":"Foto de volta no fundo.");try{renderPosts(true)}catch(e){}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-uilu]");if(!b)return;e.stopPropagation();const id=b.dataset.uilu;closeLayer();ip27Troca(id)},true);
ft213Carrega();setInterval(ft213Carrega,6e5);

/* 3. descrição em inglês */
var FT213_EN=/\b(the|of|and|in|at|on|with|from|taking|off|view|building|airport|runway|airliner|street|square|house|tower|city|night|sunset|downtown|state|united|states|department|headquarters|kyiv|plaza|bridge|church|palace)\b/i;
function ft213Alt(f,p){try{if(!f||typeof f.alt!=="string")return f;const m=/^\s*foto de arquivo\s*:\s*(.+?)\s*$/i.exec(f.alt);if(!m)return f;
  const A=typeof FOTOS_ARQ!=="undefined"&&FOTOS_ARQ;if(A&&A.pessoas&&A.pessoas[m[1]])return f;
  if(!FT213_EN.test(m[1])||/\b(de|da|do|das|dos|em|na|no)\b/i.test(m[1]))return f;
  const ass=p&&(p.tema||p.subtema||(typeof secNome==="function"?secNome(secOf(p)):""));return Object.assign({},f,{alt:ass?`Foto de arquivo (${ass})`:"Foto de arquivo"})}catch(e){return f}}
{const _fd213=fotoDe;fotoDe=function(p){return ft213Alt(_fd213.apply(this,arguments),p)}}
