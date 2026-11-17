/* ---------- 186: Números de mercado por referência (Fase 2, 18/11). Prefixo nm186/NM186. ----------
   As rodadas escrevem uma MARCA no lugar da cotação/taxa e o app põe o valor atual de indicadores.json (o mesmo do card da
   Capa, js/184), em qualquer texto do feed: título, subtítulo, pontos, texto, social, Entenda, quadro "numeros",
   ilustração "dinheiro", linha fina, resumo do dia. Assim o mesmo dado não aparece com dois valores na mesma edição.
     {dolar} R$ 5,78 · {dolar.var} -0,16% · {dolar.dia} terça (17)
     {ibovespa} ou {ibov} 170.634 · {ibovespa.var} · {ibovespa.dia}
     {selic} 13,75% · {ipca12m} ou {ipca} 4,63% · {ipca.mes} outubro · {desemprego} 5,2% · {desemprego.mes}
   Valor: indicadores.json (IND_AUTO); sem ele, o indicadores do feed (reserva). Sem nenhum dos dois, a frase com a marca
   sai do texto (sem "{dolar}" na tela). A mesma regra está em tools/validar.py (marcas_resolver), que o aplicar.py e o
   paginas.py (prévia do WhatsApp, m/) também usam.
   O texto com a marca fica guardado no próprio objeto (campo "_m186": {caminho: texto original}), que vai junto para a
   edição guardada no aparelho: quando o indicadores.json muda (fechamento das 18h30), o app troca o número de novo. */
var NM186_RE=/\{(dolar|ibov|ibovespa|selic|ipca|ipca12m|desemprego)(?:\.(var|dia|mes))?\}/g;
var NM186_ALIAS={ibov:"ibovespa",ipca:"ipca12m"};
var NM186_DIAS=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
var NM186_MESES=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
var NM186_SIG=new WeakMap();
/* {id: item} — o do feed (reserva) por baixo, o de indicadores.json por cima (como indItens) */
function nm186Mapa(f){const m={};const add=l=>{(Array.isArray(l)?l:[]).forEach(x=>{if(x&&typeof x==="object"&&x.id&&x.valor)m[x.id]=x})};
  try{add(f&&f.indicadores&&f.indicadores.itens)}catch(e){}
  try{add(IND_AUTO&&IND_AUTO.itens)}catch(e){}
  return m}
function nm186Valor(id,v,x){if(!x)return "";
  if(!v)return String(x.valor||"").trim();
  const mercado=id==="dolar"||id==="ibovespa";
  if(v==="var")return mercado?String(x.variacao||"").trim():"";
  if(v==="dia"){if(!mercado)return "";const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(x.data||""));if(!m)return "";
    return NM186_DIAS[new Date(Date.UTC(+m[1],+m[2]-1,+m[3])).getUTCDay()]+" ("+(+m[3])+")"}
  if(v==="mes"){if(mercado||id==="selic")return "";const m=/^\d{4}-(\d{2})/.exec(String(x.ref||""));return m?NM186_MESES[+m[1]-1]||"":""}
  return ""}
/* troca as marcas de um texto; marca sem valor tira a frase inteira (ou só a marca, se o texto é uma frase só; texto em que
   toda frase tinha marca sem valor fica vazio) */
function nm186Texto(s,M){if(typeof s!=="string"||s.indexOf("{")<0)return s;let falta=false;
  const r=s.replace(NM186_RE,(_,id,v)=>{id=NM186_ALIAS[id]||id;const t=nm186Valor(id,v||"",M[id]);if(!t){falta=true;return "\u0000"}return t});
  if(!falta)return r;
  const fr=r.match(/[^.!?]*(?:[.!?]+|$)\s*/g)||[r];const fica=fr.filter(x=>x&&x.indexOf("\u0000")<0);
  if(fica.length&&fica.join("").trim())return fica.join("").trim();
  if(fr.filter(x=>x.trim()).length>1)return "";
  return r.replace(/\s*\u0000\s*/g," ").replace(/\(\s*\)/g,"").replace(/\s+([,.;:!?])/g,"$1").replace(/\s{2,}/g," ").trim()}
function nm186Tem(s){NM186_RE.lastIndex=0;const r=typeof s==="string"&&s.indexOf("{")>=0&&NM186_RE.test(s);NM186_RE.lastIndex=0;return r}
/* percorre o objeto: o: objeto que guarda os originais; c: contêiner atual; pre: caminho relativo ao o */
function nm186Anda(o,c,pre,M,cont){
  const ks=Array.isArray(c)?c.map((_,i)=>i):Object.keys(c);
  for(const k of ks){if(k==="_m186")continue;const v=c[k];const cam=pre+(pre?".":"")+k;
    if(typeof v==="string"){if(nm186Tem(v)){(o._m186=o._m186||{})[cam]=v;c[k]=nm186Texto(v,M);cont.n++}}
    else if(v&&typeof v==="object"){if(Array.isArray(v))nm186Anda(o,v,cam,M,cont);else nm186Obj(v,M,cont)}}}
function nm186Obj(o,M,cont){
  /* volta os textos originais (com marca) antes de trocar de novo */
  const t=o._m186;if(t&&typeof t==="object"){delete o._m186;
    for(const cam in t){const ps=cam.split(".");let c=o;for(let i=0;i<ps.length-1&&c&&typeof c==="object";i++)c=c[ps[i]];
      const u=ps[ps.length-1];if(c&&typeof c==="object"&&typeof c[u]==="string"&&typeof t[cam]==="string")c[u]=t[cam]}}
  nm186Anda(o,o,"",M,cont)}
function nm186Assina(f){const M=nm186Mapa(f);return ["dolar","ibovespa","selic","ipca12m","desemprego"].map(id=>{const x=M[id];return x?[x.valor,x.variacao,x.data,x.ref].join("|"):""}).join("#")}
/* resolve um feed inteiro (no lugar); devolve quantas marcas trocou */
function nm186Resolver(f){if(!f||typeof f!=="object")return 0;const cont={n:0};
  try{nm186Obj(f,nm186Mapa(f),cont);NM186_SIG.set(f,nm186Assina(f))}catch(e){}
  return cont.n}
/* indicadores.json mudou depois que o feed foi resolvido: troca de novo (barato quando nada mudou) */
function nm186EmDia(){try{if(FEED&&NM186_SIG.get(FEED)!==nm186Assina(FEED)){nm186Resolver(FEED);return true}}catch(e){}return false}
{const _sa186=sanear;sanear=function(){const r=_sa186.apply(this,arguments);if(r)nm186Resolver(r);return r}}
{const _rc186=renderCapa;renderCapa=function(){nm186EmDia();return _rc186.apply(this,arguments)}}
{const _rp186=renderPosts;renderPosts=function(){nm186EmDia();return _rp186.apply(this,arguments)}}
{const _am186=abrirMateria;abrirMateria=function(){nm186EmDia();return _am186.apply(this,arguments)}}
/* indicadores.json chegou com outro fechamento: o 031 redesenha a Capa; o Feed aberto também ganha os números novos */
{const _ci186=carregarIndAuto;carregarIndAuto=async function(){const r=await _ci186.apply(this,arguments);
  try{if(nm186EmDia()&&VIEW==="feed"&&typeof FILTRO!=="undefined"&&FILTRO!=="economia"){const y=scrollY;renderPosts(true);window.scrollTo(0,y)}}catch(e){}
  return r}}
