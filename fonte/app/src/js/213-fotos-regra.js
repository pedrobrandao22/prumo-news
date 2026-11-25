/* ===== 25/11: regra única de fotos (item 2 do balanço semanal) =====
   App e prévia do link (m/, tools/paginas.py) escolhiam a foto com listas e regras copiadas à mão, e uma correção
   chegava a um lado e não ao outro (Paulista na estreia da Anthropic, taça de 2016). Agora:
   1. bloqueios e condições moram num arquivo só, tools/fotos_regras.json (cópia abaixo; o teste
      tools/test_fotos_regras_2511.py falha se as duas divergirem). 'exige': a foto só entra se o título disser o lugar
      ou a empresa (sede da PF só com PF; avião da Alaska só com Alaska; Casa Branca só com governo dos EUA/Trump; MEC
      só com MEC);
   2. o robô das páginas grava em m/fotos.json a foto que escolheu para cada notícia; quando esse arquivo é da mesma
      edição que o app abriu, Feed, matéria, giro e prévia usam a mesma escolha;
   3. descrição em inglês do nome do arquivo ("airliner taking off runway", "The White House June 2024") vira
      "Foto de arquivo (assunto da notícia)" para o leitor de tela. */
var FT213_REGRAS={"bloq":["hubbell-white house","hubbell-white_house","douglas tavolaro","luiz-inacio-lula-da-silva-8eb72b38","maidan nezalezhnosti","parque avenida building"],
  "exige":[{"nome":"policia federal","titulo":"policia federal|\\bpf\\b"},{"nome":"alaska airlines","titulo":"alaska"},{"nome":"delta air","titulo":"\\bdelta\\b"},
    {"nome":"united airlines","titulo":"united"},{"nome":"american airlines","titulo":"american airlines"},{"nome":"latam","titulo":"latam"},
    {"nome":"white house","titulo":"casa branca|trump|vance|governo (dos eua|americano|trump)|tarifa|washington"},
    {"nome":"casa branca","titulo":"casa branca|trump|vance|governo (dos eua|americano|trump)|tarifa|washington"},
    {"nome":"ministerio da educacao","titulo":"\\bmec\\b|ministerio da educacao|camilo santana"}]};

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
ft213Carrega();setInterval(ft213Carrega,6e5);

/* 3. descrição em inglês */
var FT213_EN=/\b(the|of|and|in|at|on|with|from|taking|off|view|building|airport|runway|airliner|street|square|house|tower|city|night|sunset|downtown|state|united|states|department|headquarters|kyiv|plaza|bridge|church|palace)\b/i;
function ft213Alt(f,p){try{if(!f||typeof f.alt!=="string")return f;const m=/^\s*foto de arquivo\s*:\s*(.+?)\s*$/i.exec(f.alt);if(!m)return f;
  const A=typeof FOTOS_ARQ!=="undefined"&&FOTOS_ARQ;if(A&&A.pessoas&&A.pessoas[m[1]])return f;
  if(!FT213_EN.test(m[1])||/\b(de|da|do|das|dos|em|na|no)\b/i.test(m[1]))return f;
  const ass=p&&(p.tema||p.subtema||(typeof secNome==="function"?secNome(secOf(p)):""));return Object.assign({},f,{alt:ass?`Foto de arquivo (${ass})`:"Foto de arquivo"})}catch(e){return f}}
{const _fd213=fotoDe;fotoDe=function(p){return ft213Alt(_fd213.apply(this,arguments),p)}}
