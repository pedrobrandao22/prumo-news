/* ---------- 157: foto que combina com a notícia (revisão de 15/11, pedido do Pedro) ----------
   "Tem umas fotos que não tem nada a ver com o que está sendo dito." Regras novas da foto de arquivo:
   1. retrato de pessoa só se a pessoa está no TÍTULO (nunca pelo subtítulo, nem quando a rodada gravou como foto própria
      um retrato de arquivo de alguém que não está no título); foto de grupo/evento (posse, "X e Y", taças…) não vale
      como retrato.
   2. foto de assunto só pelo que o título diz na frase principal (antes do ";"), e só quando combina com o fato:
      notícia do exterior não usa lugar brasileiro (avião em Guarulhos para voo nos EUA), cúpula/encontro não usa o
      cartão-postal da capital do país (Apec em Shenzhen ≠ Pequim), "COP" não é a sede da ONU, "agro" não é colheita
      de café, "apagão" de voos não é linha de transmissão. Foto de tema da seção só nos temas em que ela é o lugar do
      fato (Congresso, STF, Planalto, Banco Central…); "Empresas" (prédio na Paulista), "Meio ambiente" (enchente),
      os temas de Mundo (Parlamento Europeu…) e o padrão da seção não entram mais por sorteio.
   3. a mesma foto de arquivo não aparece em duas notícias da edição (sem a "repetição de emergência").
   4. na dúvida, nada: fica a ilustração que a pauta já tem.
   Fotos que o testador e o Pedro viram erradas (moedas de réis, astronauta e carro como "B3", cartão-postal do Rio
   como "STF", close de senador como "plenário", mural de vestibular como "Enem", diretoria do Real Madrid como
   "Ancelotti"…) saem do acervo aqui e no robô (tools/fotos_arquivo.py). Créditos do Commons ficam em português e
   sem "from <cidade>, <país>". tools/paginas.py (prévia do WhatsApp) segue as mesmas regras. */
var FT157_PREP=null;
function ft157N(s){try{return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()}catch(e){return String(s||"").toLowerCase()}}
function ft157Arq(f){return ft157N(faNome(f&&f.url)).replace(/_/g," ")}
/* fotos que já apareceram no lugar errado (nome do arquivo, sem acento e minúsculo) */
const FT157_BLOQ=["21449400719","iluminacao lgbtqia","cervejas colorado","buraco tampado da arquibancada","fabrica da gwm brasil","buzios - panoramio","laboratorio de paleontologia","bolsa de valores (17205467578)","bolsa de valores (17391295482)","bolsa de valores (17393276865)","iss-32 american eva b3","alpina b3","casa-da-moeda","avenida central, vendo-se","atual centro cultural da justica federal",
  "plenario do senado (15717805622)","plenario do senado (15687627386)","plenario do senado (15109327665)","vestibular.jpg",
  "ofrenda de la liga","roda viva com senadora","com bandeira do brasil","conselheira tais ferraz","arena corinthians opening",
  "allianz parque - reconhecimento facial","tudo-o-que-voce-sempre-quis-saber","vidpovid to be performing","hibakujumoku",
  "northern door of the assumption cathedral","estacao agrometeorologica","travessia de pedestres no patio da estacao"];
/* acervos históricos (foto do século passado não ilustra fato de hoje) */
const FT157_HIST=/(n[uú]cleo de digitaliza|\bIMS\b|Moreira Salles|Arquivo Nacional|Gaensly|\b(?:PMDB|MDB|PSDB|PSOL|PDT|PSB)\b|\b(?:PT|PL|PP|PSD) (?:Nacional|na C[aâ]mara|no Senado)\b|Partido (?:dos|Liberal|Social|Progressista|Novo)|Uni[aã]o Brasil Nacional)/i;  /* 19/11: e acervo de partido */
function ft157Bloq(f){if(!f||typeof f.url!=="string")return true;const n=ft157Arq(f);return FT157_BLOQ.some(b=>n.indexOf(b)>=0)||FT157_HIST.test(String(f.credito||""))}
/* retrato: 2 = foto de grupo/evento (não serve), 1 = recorte de foto com outra pessoa (só se não houver outra), 0 = retrato */
function ft157Grupo(f){const n=ft157Arq(f),crop=/crop/.test(n);
  if(/(ofrenda|champions|roda viva|bandeira|conselheir|nobel|gift to)/.test(n))return 2;
  if(!crop&&((n.match(/,/g)||[]).length>=2||/\b(posse|cerimonia|almoco|convencao|comitiva|lancamento|inauguracao|votacao|acompanha|visita|meets|with|programa)\b/.test(n)))return 2;
  if(/\b(e|y|and|with|meets|com)\b/.test(n.replace(/\.[a-z]+$/,"")))return crop?1:2;
  return 0}
/* lugar brasileiro (no nome do arquivo ou no texto alternativo) */
const FT157_BR=/(brasil|brazil|brasilia|sao paulo|guarulhos|rio de janeiro|planalto|congresso nacional|senado federal|camara dos deputados|supremo tribunal|paulista|copacabana|maracana|esplanada|itamaraty|banco central|ministerio d|bovespa|petrobras|policia militar|policia federal|unidade basica|allianz|mineirao|januario|beira-rio|fonte nova|arena mrv|interlagos)/;
function ft157Br(f){return FT157_BR.test(ft157Arq(f)+" "+ft157N(f&&f.alt))}
/* notícia que acontece fora do Brasil */
const FT157_FORA=/(\bEUA\b|Estados Unidos|Miami|Nova York|Nasdaq|Wall Street|\bNYSE\b|Dow Jones|S&P 500|Washington|Casa Branca|China|Shenzhen|Pequim|Apec|Asean|Filipinas|Manila|Turquia|\bCOP ?\d|Jap[aã]o|Singapura|Canad[aá]|Europa|Uni[aã]o Europeia|\bONU\b|\bG20\b|\bG7\b|Brics|[Vv]iagem|[Cc][uú]pula|exterior|Argentina|Venezuela|R[uú]ssia|Ucr[aâ]nia|Israel|Gaza|Ir[aã](?=$|[^A-Za-zÀ-ú])|Fran[cç]a|Alemanha|Reino Unido|Londres|Paris|[ÍI]ndia|Catar)/;
function ft157Fora(p){if(secOf(p)==="mundo")return true;const n=p.neutro||{};return FT157_FORA.test([n.titulo,p.tema,p.tag].filter(x=>typeof x==="string").join(" · "))}
/* assunto citado no título: condições extras (o título precisa dizer isto) */
const FT157_PAISES=["Irã","Israel","Ucrânia","Rússia","China","Venezuela","Argentina","França","Espanha","Alemanha","Reino Unido","Japão","Índia","Catar"];
const FT157_EVENTO=/([Cc][uú]pula|reuni|[Ee]ncontro|[Cc]onfer[eê]ncia|\bCOP ?\d*|Apec|\bG20\b|\bG7\b|Brics|Asean|[Vv]isita|[Vv]iagem|amistoso|[Jj]ogo|partida|Copa)/;
const FT157_EXIGE={"café e agro":/[Cc]af[eé]/,"ONU":/(\bONU\b|Na[cç][oõ]es Unidas)/,"energia":/(energia|[Ll]uz\b|Aneel|hidrel|el[eé]tric)/};
function ft157AssuntoOk(nome,p,tit){const sec=secOf(p);
  if(FT157_PAISES.indexOf(nome)>=0&&(sec==="esportes"||FT157_EVENTO.test(tit)))return false;
  const r=FT157_EXIGE[nome];return !r||r.test(tit)}
/* foto do tema da seção: true = é o lugar do fato; regex = só se o título/tema disser; ausente = não usa */
const FT157_TEMA={"politica/Eleições 2026":1,"politica/Congresso":1,"politica/Planalto e governo":1,"politica/STF e Judiciário":/(STF|Supremo|[Mm]inistr|[Pp]len[aá]rio|[Jj]ulg|Corte|Fachin|Moraes|Dino|Fux|Gilmar|Kassio|Nunes Marques|Mendon[cç]a|Zanin|Toffoli|C[aá]rmen|Barroso|Messias)/,"politica/Partidos":1,
  "politica/Estados":/(S[aã]o Paulo|Rio de Janeiro|Tarc[ií]sio|Cl[aá]udio Castro|Bandeirantes|Guanabara)/,
  "economia/Juros e inflação":1,"economia/Contas públicas":1,"economia/Mercados":1,"economia/Atividade econômica":1,"economia/Trabalho e renda":1,"economia/Seu dinheiro":1,
  "brasil/Segurança":1,"brasil/Justiça e polícia":1,"brasil/Saúde":1,
  "brasil/Meio ambiente e clima":/([Cc]huva|[Ee]nchente|[Aa]laga|[Ii]nunda|[Tt]emporal|[Cc]heia)/,
  "brasil/Infraestrutura e transporte":/([Rr]odovia|[Ee]strada|\bBR-\d|[Mm]etr[oô]|[Tt]r[aâ]nsito|[Tt]ransporte)/,
  "mundo/EUA":/(Casa Branca|Washington|Capit[oó]lio|Congresso (dos EUA|americano))/,"mundo/Europa":/(Parlamento Europeu|Estrasburgo|Bruxelas|Uni[aã]o Europeia)/,
  "mundo/Oriente Médio":/(Knesset|Jerusal[eé]m)/,"mundo/Ásia":/(Tiananmen|Pequim)/,"mundo/América Latina":/(Casa Rosada|Buenos Aires|Milei)/,"mundo/África":/(Uni[aã]o Africana|Adis Abeba)/,
  "educacao/Educação básica":1,"educacao/Ensino superior":1,"educacao/Enem e vestibulares":1,"educacao/Políticas":1,"educacao/Avaliações":1,
  "esportes/Brasileirão":1,"esportes/Série B":1,"esportes/Copa do Brasil":1,"esportes/Libertadores":1,"esportes/Sul-Americana":1,"esportes/Seleção":1,"esportes/Clubes":1,"esportes/Outros esportes":1};
function ft157TemaOk(k,p){const r=FT157_TEMA[k];if(!r)return false;if(r===1)return true;const n=p.neutro||{};return r.test([n.titulo,p.tema].filter(x=>typeof x==="string").join(" · "))}

/* nomes de órgãos estrangeiros mais comuns nos créditos do Commons */
const FT157_TRAD=[[/https?:\/\/www\.president\.gov\.ua\/?/,"Presidência da Ucrânia"],[/(?:The )?Presidential Administration of Ukraine/,"Presidência da Ucrânia"],
  [/(?:The |Russian )?Presidential Press [Aa]nd Information Office/,"Serviço de imprensa da Presidência da Rússia"],[/Presidential Communications Office/,"Comunicação da Presidência"],
  [/Prime Minister's Office/,"Gabinete do primeiro-ministro"],[/\bThe White House\b/,"Casa Branca"],[/U\.S\. Department of Defense/,"Departamento de Defesa dos EUA"],
  [/U\.S\. Department of Transportation/,"Departamento de Transportes dos EUA"],[/U\.S\. Secretary of Defense/,"Secretaria de Defesa dos EUA"],
  [/U\.S\. Embassy (?:in )?([A-Z][A-Za-z ]+?)(?=\/|$)/,"Embaixada dos EUA em $1"],[/^(Foto de arquivo:\s*)Photo\s+/,"$1"]];
/* crédito do Commons em português, sem "from <cidade>, <país>", e-mail, CSS ou "Template:" */
function ft157Cred(c){let t=String(c==null?"":c);if(!t)return t;
  FT157_TRAD.forEach(([a,b])=>{t=t.replace(a,b)});
  t=t.replace(/[\u200e\u200f\u202a-\u202e]/g,"").replace(/\s*\.mw-parser-output[^/]*/i,"")
   .replace(/\s+from\s+[^/()]+?(?=\s*\/\s*(?:Wikimedia|Commons)|\s*\(|\s*$)/gi,"")
   .replace(/Taken by\s+(.+?)\s+in\s+[A-Z][a-z]+\s+\d{4}[^/]*/,"$1").replace(/Photograph by\s+/i,"")
   .replace(/\s*\([^()/]*?(?:www\.|https?:|on commons|wikipedia|flickr)[^()/]*\)?/gi,"")
   .replace(/Contato:\s*/i,"").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,"").replace(/Template:\S*/g,"")
   .replace(/(Unknown author)+/gi,"autor desconhecido").replace(/\b(?:Staff |Tech\. |Master )?Sgt\.\s*/g,"")
   .replace(/,?\s*U\.S\. Air Force/g,"/Força Aérea dos EUA").replace(/,?\s*U\.S\. Navy/g,"/Marinha dos EUA").replace(/,?\s*U\.S\. Army/g,"/Exército dos EUA")
   .replace(/Brazilian Government/g,"Governo Federal").replace(/State Government Photographer/g,"Governo estadual")
   .replace(/\s+at\s+\w+\s+Wikipedia/g,"").replace(/\s+in contract with a local company/g,"").replace(/\s+edit by\s+/g," (edição de ")
   .replace(/\(Public domain\)/gi,"(domínio público)").replace(/\.\s*(?=\/)/,"");
  t=t.replace(/(\(edição de [^()/]*)(?=\/)/,"$1)").replace(/:\s*\/\s*(Wikimedia|Commons)/,": autor desconhecido/$1").replace(/\s{2,}/g," ").replace(/\s+\//g,"/").replace(/\/\s+/g,"/").trim();
  return t}

/* limpa o acervo carregado uma vez por versão (mesmos objetos: quem guardou a pessoa continua achando) */
function ft157Prep(){const A=FOTOS_ARQ;if(!A||typeof A!=="object")return A;if(FT157_PREP===A)return A;FT157_PREP=A;
  const fix=f=>{if(f&&typeof f.credito==="string")f.credito=ft157Cred(f.credito);return f};
  const lista=l=>Array.isArray(l)?l.filter(f=>f&&!ft157Bloq(f)).map(fix):l;
  try{Object.values(A.pessoas||{}).forEach(x=>{if(!x||!Array.isArray(x.fotos))return;const l=lista(x.fotos),bons=l.filter(f=>ft157Grupo(f)===0);x.fotos=bons.length?bons:l.filter(f=>ft157Grupo(f)===1)});
    Object.values(A.assuntos||{}).forEach(x=>{if(x&&Array.isArray(x.fotos))x.fotos=lista(x.fotos)});
    const T=A.temas||{};Object.keys(T).forEach(k=>{T[k]=lista(T[k])})}catch(e){}
  FA_MAP=null;FA_MAPK="";FA_CACHE={};return A}
try{ft157Prep()}catch(e){}

/* pessoa citada no título com retrato que serve (a 1ª citada; tie = nome mais longo) */
function ft157Pessoa(tit,A){let best=null,pos=1e9,len=0;Object.values(A.pessoas||{}).forEach(x=>{if(!x||!Array.isArray(x.chaves)||!Array.isArray(x.fotos)||!x.fotos.some(faValida))return;
  x.chaves.forEach(k=>{if(typeof k!=="string"||!k)return;const i=posPalavra(tit,k);if(i>=0&&(i<pos||(i===pos&&k.length>len))){pos=i;len=k.length;best=x}})});return best}
/* assuntos da frase principal do título, na ordem em que aparecem */
function ft157Assuntos(t,A,sec){const out=[];Object.keys(A.assuntos||{}).forEach(nome=>{const x=A.assuntos[nome];if(!x||!Array.isArray(x.chaves))return;
  if(Array.isArray(x.secoes)&&x.secoes.indexOf(sec)<0)return;let pos=1e9,len=0;
  x.chaves.forEach(k=>{if(typeof k!=="string"||!k)return;let i=posPalavra(t,k);
    /* palavra comum no começo do título vem com maiúscula ("Queimadas no Amazonas…", "Aviões colidem…") */
    if(i<0&&k[0]!==k[0].toUpperCase()&&posPalavra(t,k[0].toUpperCase()+k.slice(1))===0)i=0;
    if(i>=0&&(i<pos||(i===pos&&k.length>len))){pos=i;len=k.length}});
  if(pos<1e9)out.push([pos,-len,nome,x])});
  return out.sort((a,b)=>a[0]-b[0]||a[1]-b[1]||(a[2]<b[2]?-1:1)).map(z=>[z[2],z[3]])}
function ft157Frase(tit){return String(tit||"").split(/;|\s[—–]\s/)[0]}

faListas=function(p,A){if(A&&A===FOTOS_ARQ)ft157Prep();const L=[],T=(A&&A.temas)||{},sec=secOf(p),tit=String((p.neutro||{}).titulo||""),fora=ft157Fora(p);
  const pega=(l,lugar)=>{if(!Array.isArray(l))return;const ok=l.filter(f=>faValida(f)&&!ft157Bloq(f)&&!(lugar&&fora&&ft157Br(f)));if(ok.length&&!L.some(x=>x.ft157o===l)){ok.ft157o=l;L.push(ok)}};
  if(!A)return L;
  if(p.foto_arquivo!=="tema"){const pe=ft157Pessoa(tit,A);if(pe)pega(pe.fotos,false)}
  const fr=ft157Frase(tit);ft157Assuntos(fr,A,sec).forEach(([nome,x])=>{if(ft157AssuntoOk(nome,p,fr))pega(x.fotos,true)});
  const k=sec+"/"+(p.subtema||"");if(ft157TemaOk(k,p))pega(T[k],true);
  return L};

/* foto própria da pauta que é retrato de arquivo de quem não está no título (ou com "foto_arquivo":"tema") não vale */
function ft157PessoaDaFoto(f){const A=ft157Prep();const nm=faNome(f.url);
  if(A&&A.pessoas){for(const k in A.pessoas){const x=A.pessoas[k];if(x&&(x.fotos||[]).some(g=>g&&faNome(g.url)===nm))return {nome:k,chaves:x.chaves||[]}}}
  const m=/^\s*foto de arquivo\s*:\s*(.+?)\s*$/i.exec(String(f.alt||""));if(m){const nome=m[1];const x=A&&A.pessoas&&A.pessoas[nome];
    if(x)return {nome,chaves:x.chaves||[]};if(FEED&&FEED.pessoas&&FEED.pessoas[nome])return {nome,chaves:[nome]}}
  return null}
function ft157PropriaOk(p,f){if(!f||!faValida(f))return false;if(ft157Bloq(f))return false;
  const pe=ft157PessoaDaFoto(f);if(!pe)return true;if(p.foto_arquivo==="tema")return false;
  const tit=String((p.neutro||{}).titulo||"");return [pe.nome].concat(pe.chaves).some(k=>typeof k==="string"&&k&&posPalavra(tit,k)>=0)}

/* sem repetir foto na edição; a de maior prioridade escolhe primeiro; sem foto que sirva, fica a ilustração */
faMapa=function(){const A=ft157Prep();if(!A||!FEED||!Array.isArray(FEED.pautas))return null;
  const k="157|"+(A.gerado||"")+"|"+(FEED.atualizado_em||"")+"|"+FEED.pautas.map(p=>p.id+":"+(p.prioridade||0)+":"+((p.neutro||{}).titulo||"")+":"+(p.foto_arquivo||"")+":"+((p.foto&&p.foto.url)||"")).join(",");
  if(FA_MAP&&FA_MAPK===k)return FA_MAP;
  const usados=new Set(),M={},pr=p=>typeof p.prioridade==="number"?p.prioridade:0;
  const ord=FEED.pautas.map((p,i)=>[p,i]).sort((a,b)=>pr(b[0])-pr(a[0])||a[1]-b[1]).map(x=>x[0]),dup=new Set(),prop=new Set();
  ord.forEach(p=>{const f=p&&p.foto;if(f&&ft157PropriaOk(p,f)){const n=faNome(f.url);if(usados.has(n))dup.add(p.id);else{usados.add(n);prop.add(p.id)}}});
  ord.forEach(p=>{if(!p||!p.id||prop.has(p.id))return;
    const L=faListas(p,A),h=hashStr(p.id);let e=null;
    for(const l of L){for(let j=0;j<l.length;j++){const f=l[(h+j)%l.length];if(faValida(f)&&!usados.has(faNome(f.url))){e=f;break}}if(e)break}
    if(e){usados.add(faNome(e.url));M[p.id]={url:e.url,credito:e.credito||"Foto de arquivo: Wikimedia Commons",alt:e.alt||"Foto de arquivo",arquivo:1}}});
  FA_MAP=M;FA_MAPK=k;return M};
function ft157DoFeed(p){return !!(FEED&&Array.isArray(FEED.pautas)&&FEED.pautas.some(q=>q===p||q.id===p.id&&((q.neutro||{}).titulo===(p.neutro||{}).titulo)))}
fotoArquivo=function(p){if(!p||!p.id)return null;const M=faMapa();if(M&&ft157DoFeed(p))return M[p.id]||null;
  const A=ft157Prep();if(!A)return null;const L=faListas(p,A),h=hashStr(p.id);
  for(const l of L){const f=l[h%l.length];if(faValida(f))return {url:f.url,credito:f.credito||"Foto de arquivo: Wikimedia Commons",alt:f.alt||"Foto de arquivo",arquivo:1}}
  return null};
fotoDe=function(p){const f=p&&p.foto;if(f&&typeof f==="object"&&faValida(f)&&ft157PropriaOk(p,f)){const M=faMapa();if(M&&p.id&&M[p.id]&&FEED.pautas.some(q=>q===p))return M[p.id];return f}return fotoArquivo(p)};

/* retrato do carrossel ("Quem é") e página da pessoa: acervo já limpo */
{const _fp=faPessoa;faPessoa=function(t,A){if(A&&A===FOTOS_ARQ)ft157Prep();return _fp.apply(this,arguments)}}
{const _pa=pessoaArq;pessoaArq=function(){ft157Prep();return _pa.apply(this,arguments)}}
/* créditos (inclusive os de foto própria gravados pela rodada) */
{const _cc=creditoCurto;creditoCurto=function(c){return _cc.call(this,ft157Cred(c))}}
{const _ch=credHTML;credHTML=function(c,cls){return _ch.call(this,ft157Cred(c),cls)}}
