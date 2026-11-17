/* ---------- 169: fotos e ilustrações, segunda rodada (16/11, noite; achados do testador) ----------
   Regra do Pedro: a foto tem que mostrar o fato, o lugar ou a pessoa da notícia; na dúvida, ilustração.
   1. foto do tema da seção só quando o título diz o lugar: "Juros e inflação" só com juros/Selic/Copom/BC (tomate não
      é o prédio do Banco Central nem a fachada de um supermercado); Esportes só com o estádio citado ou, na Sul-Americana
      e na Libertadores, a taça quando é final/decisão. Nada de árbitro de outro jogo para a Série B.
   2. jogo fora do Brasil (o resumo diz "em Barranquilla, na Colômbia") não usa estádio brasileiro (Arena MRV).
   3. "incêndio" em fábrica/prédio não usa foto de queimada no mato nem de simulação de queda de avião.
   4. selo postal antigo ("Barragem de 3 Marias", Minas Gerais) sai do acervo; páginas antigas (/m/…) com foto
      bloqueada abrem sem ela.
   5. texto alternativo da foto de arquivo vem da própria foto (não de outra candidata do tema: "Banco Central" no
      supermercado).
   6. crédito curto sem apelido de usuário do acervo: "Adam Moreira (AEMoreira042281)" → "Adam Moreira";
      "EDUARDOFSLIMA", "Wilfredor" → "Wikimedia Commons" (o crédito completo, com o autor e a licença, continua no toque).
   7. Esportes: a ilustração muda com a competição (taça na final, chave nos playoffs, tabela no campeonato, camisa
      na Seleção); etiqueta das ilustrações sempre em maiúsculas.
   8. Feed: a ilustração ocupa o quadro inteiro (centralizada, chão e céu continuam até as bordas), sem a faixa vazia
      embaixo. Prefixo ft169. */

/* ===== 1–3. regras da foto de arquivo ===== */
var FT169_TEMA={"economia/Juros e inflação":/(\b[Jj]uros|Selic|Copom|Banco Central|\bBC\b|Gal[ií]polo)/,
  "esportes/Brasileirão":/(Maracan[aã]|Allianz)/,"esportes/Série B":null,"esportes/Copa do Brasil":/Maracan[aã]/,"esportes/Clubes":/Maracan[aã]/,
  "esportes/Libertadores":/([Ff]inal|[Dd]ecid|[Dd]ecis|[Cc]ampe[aã]|[Tt][ií]tulo|[Tt]a[cç]a)/,"esportes/Sul-Americana":/([Ff]inal|[Dd]ecid|[Dd]ecis|[Cc]ampe[aã]|[Tt][ií]tulo|[Tt]a[cç]a)/,
  "esportes/Seleção":null,"esportes/Outros esportes":/Ibirapuera/};
try{Object.keys(FT169_TEMA).forEach(k=>{if(FT169_TEMA[k])FT157_TEMA[k]=FT169_TEMA[k];else delete FT157_TEMA[k]})}catch(e){}
/* fotos que apareceram no lugar errado nesta rodada (nome do arquivo sem acento, minúsculo) */
try{FT157_BLOQ.push("brasil barragem de 3 marias","selo postal","postage stamp","stamp of ","francobollo","arbitro futebol apontando estadio")}catch(e){}
/* jogo fora do Brasil: o resumo diz onde é */
var FT169_FORA_ESP=/(Col[oô]mbia|Barranquilla|Bogot[aá]|Medell[ií]n|Uruguai|Montevid[eé]u|Paraguai|Assun[cç][aã]o|Chile|Santiago do Chile|Peru\b|Lima\b|Equador|Quito|Guayaquil|Bol[ií]via|La Paz|M[eé]xico|Arábia|Riad|Catar|Doha|Singapura|Jap[aã]o|T[oó]quio|Estados Unidos|\bEUA\b|Espanha|Madri|Portugal|Lisboa|Inglaterra|Londres|It[aá]lia|Fran[cç]a|Alemanha|Argentina|Buenos Aires|Avellaneda|La Bombonera)/;
{const _fo169=ft157Fora;ft157Fora=function(p){if(_fo169.apply(this,arguments))return true;
  try{if(secOf(p)!=="esportes")return false;const n=p.neutro||{};return FT169_FORA_ESP.test([n.titulo,p.subtitulo].filter(x=>typeof x==="string").join(" · "))}catch(e){return false}}}
/* incêndio em fábrica/prédio/casa: sem queimada no mato nem simulação de acidente aéreo */
var FT169_INC_MATO=/(florest|queimad|wildfire|forest|bush ?fire|cerrado|vegetac|brigadist|crash|hercules|c-130|aircraft)/;
function ft169IncOk(f,tit){return /([Ff]loresta|[Qq]ueimad|[Mm]ato\b|[Vv]egeta|[Cc]errado|[Pp]antanal|[Aa]maz[oô]nia|[Rr]eserva)/.test(tit)||!FT169_INC_MATO.test(ft157Arq(f)+" "+ft157N(f.alt))}
{const _fl169=faListas;faListas=function(p,A){const L=_fl169.apply(this,arguments);try{
  const inc=A&&A.assuntos&&A.assuntos["incêndio"],tit=String(((p&&p.neutro)||{}).titulo||"");if(!inc||!Array.isArray(inc.fotos))return L;
  return L.map(l=>{if(l.ft157o!==inc.fotos)return l;const r=l.filter(f=>ft169IncOk(f,tit));r.ft157o=l.ft157o;return r}).filter(l=>l.length)}catch(e){return L}}}

/* ===== 5. texto alternativo da própria foto ===== */
function ft169NomeFoto(u){try{u=String(u||"").split("?")[0];const m=u.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//i);return decodeURIComponent(m?m[1]:u.split("/").pop())}catch(e){return ""}}
function ft169Legenda(u){let t=ft169NomeFoto(u).replace(/\.[A-Za-z0-9]{2,5}$/,"").replace(/_/g," ")
  .replace(/\s*\((?:\d{6,}|cropped\d*|square cropped|crop)\)/gi,"").replace(/\s+-\s+panoramio\b/i,"").replace(/\s+(?:cropped\d*|\d{1,2})$/i,"").replace(/\s{2,}/g," ").trim();
  return t.length>110?t.slice(0,109).replace(/\s+\S*$/,"")+"…":t}
function ft169Alt(f){try{if(!f||!f.arquivo||typeof f.url!=="string")return f;const m=/^\s*foto de arquivo\s*:\s*(.+?)\s*$/i.exec(String(f.alt||""));
  const A=FOTOS_ARQ;if(m&&A&&A.pessoas&&A.pessoas[m[1]])return f;
  const arq=ft157N(ft169NomeFoto(f.url)).replace(/_/g," ");
  if(m){const pal=ft157N(m[1]).split(/[^a-z0-9]+/).filter(w=>w.length>=4&&!/^(foto|arquivo|brasil|brazil|predio|edificio)$/.test(w));if(pal.length&&pal.some(w=>arq.indexOf(w)>=0))return f}
  const leg=ft169Legenda(f.url);return leg?Object.assign({},f,{alt:"Foto de arquivo: "+leg}):f}catch(e){return f}}
{const _fd169=fotoDe;fotoDe=function(){return ft169Alt(_fd169.apply(this,arguments))}}
{const _fa169=fotoArquivo;fotoArquivo=function(){return ft169Alt(_fa169.apply(this,arguments))}}

/* ===== 6. crédito curto sem apelido de usuário ===== */
var FT169_ORG=/^(ABr|EBC|MEC|STF|STJ|TSE|TCU|PF|PRF|NASA|ESA|ONU|OMS|OEA|Unesco|Unicef|FAO|OTAN|Petrobras|Embraer|Embrapa|Fiocruz|Itamaraty|Senado|Câmara|Planalto|Presidência|Governo|Marinha|Exército|Prefeitura|Infraero|Anac|Anatel|Aneel|Ibama|ICMBio|Funai|Inmet|BNDES|Caixa|CBF|Fifa|Conmebol|UEFA|Reuters|AFP|Wikimedia|Commons|Flickr|Agência|Kremlin)$/i;
function ft169Apelido(s){const t=String(s||"").trim();if(!t)return true;if(FT169_ORG.test(t))return false;
  const ws=t.split(/\s+/);if(ws.some(w=>/\d/.test(w)||/^[A-Za-z]*[a-z]{2,}[A-Z]/.test(w)&&!/^(Mc|Mac)[A-Z]/.test(w)||/^[A-Z]{2,}[a-z]/.test(w)))return true;
  if(ws.length>1)return false;
  return /^[A-Za-zÀ-ÿ'.-]+$/.test(t)}
function ft169Nome(s){const t=String(s||"").trim();if(t===t.toUpperCase()&&/[A-ZÀ-Ý]{3}/.test(t)&&/\s/.test(t))return t.toLowerCase().replace(/(^|[\s'-])(\S)/g,(a,b,c)=>b+c.toUpperCase()).replace(/\b(De|Da|Do|Dos|Das|E)\b/g,x=>x.toLowerCase());return t}
var FT169_TRAD=[[/總統府|总统府/g,"Presidência de Taiwan"]];
function ft169Curto(r,c){const m=/^(Arquivo · |Foto: )(.*)$/.exec(String(r||""));if(!m||!/Wikimedia|Commons/i.test(String(c||"")))return r;let t=m[2],cort=/…$/.test(t);t=t.replace(/…$/,"");
  FT169_TRAD.forEach(([a,b])=>{t=t.replace(a,b)});
  /* "Nome (apelido)" → "Nome" */
  t=t.replace(/\s*\(([^()\s]+)\)?/g,(x,ap)=>ft169Apelido(ap)?"":x).trim();
  const partes=t.split(/\s*\/\s*/).map(s=>s.replace(/[,;]+$/,"").trim()).filter(Boolean),bons=[];
  partes.forEach((s,i)=>{const so=s.split(/\s*,\s*/);/* "Eugenio Hansen, OFS": a sigla da ordem religiosa fica */
    if(ft169Apelido(so[0])&&!(cort&&i===partes.length-1&&so[0].length<4))return;bons.push(ft169Nome(s))});
  t=bons.length?bons.join("/"):"Wikimedia Commons";if(cort&&bons.length&&t.length>=32)t+="…";
  return m[1]+t}
{const _cc169=creditoCurto;creditoCurto=function(c){return ft169Curto(_cc169.apply(this,arguments),c)}}

/* ===== 4. página antiga (/m/…) com foto bloqueada: o cartão "Notícia de outra edição" abre sem ela ===== */
{const _pg169=mt158Pagina;mt158Pagina=function(id){const r=_pg169.apply(this,arguments);try{return Promise.resolve(r).then(pg=>{
  if(pg&&pg.img&&(ft157Bloq({url:pg.img})||/[Ii]nc[eê]ndio/.test(pg.titulo||"")&&!ft169IncOk({url:pg.img,alt:""},String(pg.titulo||""))))pg.img="";return pg})}catch(e){return r}}}

/* ===== 7. ilustrações de Esportes por competição; etiqueta em maiúsculas ===== */
function ft169Esporte(d){const r=ft157N(String((d&&d.rotulo)||"")+" "+String((d&&d._alt)||""));
  if(/selecao|amistoso|eliminatoria|copa do mundo/.test(r))return "camisa";
  if(/playoff|mata-mata|chaveamento|\bchave\b|acesso|repescagem/.test(r))return "chave";
  if(/\bfina(l|is)\b|campea|titulo|\btaca\b|decis|decide/.test(r))return "taca";
  if(/brasileirao|rodada|tabela|lider|\bz-4\b|\bg4\b|classifica|pontos/.test(r))return "tabela";
  return ""}
function ft169Gramado(y){let s=`<rect class="ia" x="0" y="${y}" width="400" height="${240-y}" opacity=".9"/>`;for(let i=0;i<8;i++)s+=`<rect class="ic" x="${i*50}" y="${y}" width="25" height="${240-y}" opacity=".07"/>`;return s}
function ft169Bola(x,y,r){const k=r/44;const P=(a,b)=>`${(x+a*k).toFixed(1)},${(y+b*k).toFixed(1)}`;
  return `<circle class="ic" cx="${x}" cy="${y}" r="${r}"/><circle class="nf si" stroke-width="2" cx="${x}" cy="${y}" r="${r}"/><polygon class="ii" points="${P(0,-20)} ${P(18,-7)} ${P(11,14)} ${P(-11,14)} ${P(-18,-7)}"/>`}
function ft169Cena(tipo,d){const rot=d&&d.rotulo?chip(16,12,String(d.rotulo),"ii","ic"):"";let s="";
  if(tipo==="taca"){s+=ft169Gramado(204);
    [[70,60,"iy"],[96,104,"ic"],[318,70,"ia"],[338,118,"iy"],[120,40,"ia"],[290,40,"ic"],[60,150,"ia"],[344,164,"ic"]].forEach(([x,y,c],i)=>{s+=`<rect class="${c}" x="${x}" y="${y}" width="9" height="5" rx="1" transform="rotate(${(i*37)%90-45} ${x} ${y})"/>`});
    s+=`<path class="nf sy" stroke-width="9" stroke-linecap="round" d="M166 74 Q128 74 136 104 Q142 122 170 124 M234 74 Q272 74 264 104 Q258 122 230 124"/>`;
    s+=`<path class="iy" d="M158 52 H242 Q244 138 200 150 Q156 138 158 52 Z"/><rect class="iy" x="191" y="148" width="18" height="24"/>`;
    s+=`<rect class="ii" x="166" y="170" width="68" height="16" rx="2"/><rect class="ia" x="154" y="184" width="92" height="20" rx="2"/><rect class="iy" x="176" y="190" width="48" height="6" rx="2" opacity=".85"/>`;
    s+=`<polygon class="ic" opacity=".9" points="200,72 205,86 220,86 208,95 212,109 200,100 188,109 192,95 180,86 195,86"/>`;
    return s+rot}
  if(tipo==="camisa"){s+=ft169Gramado(206);
    s+=`<path class="iy" d="M160 52 L124 66 L94 108 L122 128 L144 112 L144 202 L256 202 L256 112 L278 128 L306 108 L276 66 L240 52 Q200 80 160 52 Z"/>`;
    s+=`<path class="nf sa" stroke-width="6" stroke-linejoin="round" d="M160 52 Q200 80 240 52"/><path class="nf sa" stroke-width="5" d="M100 100 L126 120 M300 100 L274 120"/>`;
    s+=T(200,168,52,"10","ia","middle",800);s+=ft169Bola(332,190,22);
    return s+rot}
  if(tipo==="tabela"){s+=`<rect class="id" x="0" y="214" width="400" height="26"/>`;
    s+=`<rect class="ic" x="92" y="42" width="216" height="176" rx="6"/><rect class="nf sm" stroke-width="1.5" x="92" y="42" width="216" height="176" rx="6"/>`;
    for(let k=0;k<8;k++){const y=52+k*20,top=k<2,fim=k>5;
      s+=`<rect class="${top?"ia":fim?"iy":"im"}" x="100" y="${y}" width="4" height="14" rx="1"/>`+T(116,y+11,10,String(k+1),"ii","middle",700);
      s+=`<circle class="${k%2?"id":"im"}" cx="134" cy="${y+7}" r="6"/><rect class="im" x="146" y="${y+4}" width="${86-((k*13)%30)}" height="6" rx="3" opacity=".8"/>`;
      s+=`<rect class="${top?"ia":"id"}" x="${262}" y="${y+1}" width="34" height="12" rx="3"/>`}
    s+=ft169Bola(338,192,24);
    return s+rot}
  if(tipo==="chave"){s+=`<rect class="id" x="0" y="214" width="400" height="26"/>`;
    const caixa=(x,y,c)=>`<rect class="${c}" x="${x}" y="${y}" width="76" height="26" rx="5"/><rect class="nf sm" stroke-width="1.5" x="${x}" y="${y}" width="76" height="26" rx="5"/><circle class="im" cx="${x+14}" cy="${y+13}" r="6"/><rect class="im" x="${x+26}" y="${y+10}" width="40" height="6" rx="3"/>`;
    s+=`<path class="nf sa" stroke-width="3" d="M126 63 H150 V100 H174 M126 113 H150 V100 M126 151 H150 V176 H174 M126 201 H150 V176 M250 100 H266 V138 H282 M250 176 H266 V138"/>`;
    [50,100,138,188].forEach(y=>{s+=caixa(50,y,"ic")});[87,163].forEach(y=>{s+=caixa(174,y,"ic")});
    s+=`<rect class="ia" x="282" y="114" width="76" height="48" rx="6"/>`;
    s+=`<path class="iy" d="M306 124 H334 Q334 146 320 149 Q306 146 306 124 Z"/><rect class="iy" x="316" y="148" width="8" height="6"/><rect class="ic" x="310" y="153" width="20" height="4" rx="1"/>`;
    return s+rot}
  if(tipo==="feira"){s+=`<rect class="id" x="0" y="206" width="400" height="34"/>`;
    s+=`<rect class="ii" x="70" y="58" width="6" height="150"/><rect class="ii" x="324" y="58" width="6" height="150"/>`;
    for(let i=0;i<8;i++)s+=`<path class="${i%2?"ic":"ia"}" d="M${56+i*36} 44 h36 v22 q-18 12 -36 0z"/>`;
    s+=`<rect class="iy" x="62" y="150" width="276" height="12" rx="2"/>`;
    [[82,"t"],[166,"v"],[250,"t"]].forEach(([x,k])=>{s+=`<rect class="iy" x="${x}" y="162" width="70" height="40" rx="3" opacity=".85"/><path class="nf si" stroke-width="1.5" opacity=".35" d="M${x} 176 h70 M${x} 190 h70"/>`;
      const bs=[[x+14,152],[x+35,150],[x+56,152],[x+24,140],[x+46,140],[x+35,130]];
      bs.forEach(([cx,cy])=>{s+=k==="t"?`<circle fill="#c8452f" cx="${cx}" cy="${cy}" r="11"/><path fill="#4f8a3c" d="M${cx-5} ${cy-10} l5 3 l5 -3 l-2 5 h-6z"/>`:`<ellipse fill="#5b8f3e" cx="${cx}" cy="${cy}" rx="12" ry="9"/><path class="nf sc" stroke-width="1.2" opacity=".6" d="M${cx-8} ${cy} h16"/>`})});
    s+=`<rect class="ic" x="186" y="96" width="62" height="34" rx="4" transform="rotate(-6 217 113)"/>`+`<g transform="rotate(-6 217 113)">${T(217,119,15,"R$ ↑","ia","middle",800)}</g>`;
    return s+rot}
  return ""}
/* o 161 (corretor) troca ILL.generica depois deste arquivo: a troca passa por aqui e o desenho de Esportes vale
   por cima de qualquer versão (cada leitura devolve a camada sobre a versão daquele momento, sem laço) */
var FT169_GEN=ILL.generica;
function ft169Camada(b){return function(d){try{if(typeof gen161Tema==="function"){const g=gen161Tema(d||{});
  if(g==="bola"){const t=ft169Esporte(d||{});if(t){const s=ft169Cena(t,d||{});if(s)return s}}
  if(g==="neutro"&&FT169_FEIRA.test(ft157N(String((d&&d._alt)||"")+" "+String((d&&d.rotulo)||""))))return ft169Cena("feira",d||{})}}catch(e){}return b.apply(this,arguments)}}
try{Object.defineProperty(ILL,"generica",{configurable:true,enumerable:true,get(){return ft169Camada(FT169_GEN)},set(v){if(typeof v==="function")FT169_GEN=v}})}catch(e){}
/* etiqueta em maiúsculas: no próprio feed, ao carregar (vale para Feed, Capa, Giro e matéria) */
function ft169Maiusc(s){try{return String(s).toLocaleUpperCase("pt-BR")}catch(e){return String(s).toUpperCase()}}
function ft169Rotulos(f){try{(Array.isArray(f&&f.pautas)?f.pautas:[]).forEach(p=>{const ims=[p&&p.imagem].concat((Array.isArray(p&&p.visuais)?p.visuais:[]).map(v=>v&&v.imagem));
  ims.forEach(im=>{const d=im&&im.dados;if(d&&typeof d.rotulo==="string"&&/[a-zà-ÿ]/.test(d.rotulo))d.rotulo=ft169Maiusc(d.rotulo)})})}catch(e){}return f}
/* notícia de preço de alimento sem imagem (tomate): ilustração de feira em vez do desenho neutro de jornal */
var FT169_FEIRA=/(tomate|feira|hortifr|alimento|verdura|legume|cesta basica|\bfrutas?\b)/;
var FT169_FEIRA_TIT=/([Tt]omate|[Ff]eira|[Hh]ortifr|[Aa]limentos|[Vv]erduras|[Ll]egumes|[Cc]esta b[aá]sica|[Ff]eij[aã]o|[Aa]rroz|[Bb]atata|[Cc]ebola)/;
function ft169SemImagem(f){try{(Array.isArray(f&&f.pautas)?f.pautas:[]).forEach(p=>{if(!p||p.imagem||secOf(p)!=="economia")return;const t=String((p.neutro||{}).titulo||"");
  if(FT169_FEIRA_TIT.test(t))p.imagem={modelo:"generica",etiqueta:"Ilustração",alt:"Ilustração de banca de feira com tomates e verduras",dados:{rotulo:p.subtema==="Juros e inflação"?"INFLAÇÃO DOS ALIMENTOS":"ALIMENTOS"}}})}catch(e){}return f}
{const _sn169=sanear;sanear=function(){return ft169Rotulos(ft169SemImagem(_sn169.apply(this,arguments)))}}

/* ===== 8. Feed: a ilustração preenche o quadro ===== */
/* o desenho (400×240) fica no meio de uma área alta; a última linha do desenho (chão) se estende até embaixo e o céu
   até em cima; com "slice" a largura sempre cabe inteira (a etiqueta da esquerda não é cortada) */
function ft169Cover(h){if(typeof h!=="string"||h.indexOf('preserveAspectRatio="xMidYMin slice"')<0)return h;
  const ini=h.indexOf('<svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMin slice"');if(ini<0)return h;
  const g0='<g transform="translate(0,6)">',gi=h.indexOf(g0,ini),fim=h.indexOf("</g></svg>",gi);if(gi<0||fim<0)return h;
  const cena=h.slice(gi+g0.length,fim),ab=h.slice(ini,gi).replace('viewBox="0 0 400 320" preserveAspectRatio="xMidYMin slice"','viewBox="0 -200 400 640" preserveAspectRatio="xMidYMid slice" data-ft169=""').replace('<rect class="ib" width="400" height="320"/>','<rect class="ib" y="-200" width="400" height="640"/>');
  return h.slice(0,ini)+ab+`<svg x="0" y="239.5" width="400" height="200" viewBox="0 239 400 1" preserveAspectRatio="none" aria-hidden="true">${cena}</svg><g>${cena}</g></svg>`+h.slice(fim+"</g></svg>".length)}
{const _sl169=slides;slides=function(){const r=_sl169.apply(this,arguments);try{if(Array.isArray(r)&&typeof r[0]==="string")r[0]=ft169Cover(r[0])}catch(e){}return r}}
