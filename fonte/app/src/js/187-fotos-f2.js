/* ---------- 187: foto só com confirmação forte (fase 2 do plano "Prumo robusto", 18/11) ----------
   "Foto só entra com confirmação forte de que mostra o fato; sem isso, a ilustração. Melhor menos fotos do que foto
   errada." Troca a lista de exceções caso a caso (157, 169 e os corretores) por duas confirmações positivas:
   1. FOTO PRÓPRIA da rodada (pauta.foto) só aparece com "mostra": o que está na foto, citando a pessoa ou o lugar do
      título (precisa partilhar com o título um nome próprio, sigla ou código: "Lula", "Senado", "COP31"). Sem "mostra"
      (inclusive nas pautas gravadas antes de 18/11), o app ignora a foto e segue a regra 2. O validar.py confere.
   2. ACERVO só em dois casos: retrato da 1ª pessoa citada na frase principal do título (antes do ";"), menos com
      "foto_arquivo":"tema"; ou foto de um LUGAR confirmado pelo NOME DO ARQUIVO da foto: o lugar que a frase principal
      do título diz (Congresso, Senado, STF, Planalto, Banco Central/Copom, B3/Bolsa…) ou o órgão do sujeito (meio-termo
      do Pedro, 18/11: ministro do STF → STF, deputado/senador → plenário da Casa, PEC/CPI/projeto → Congresso, Haddad →
      Fazenda, Galípolo/Selic → Banco Central); ou, no jogo "A x B", o estádio do mandante (nunca em final nem fora do
      Brasil). Lugar brasileiro não entra em notícia que acontece fora do Brasil. Todo o resto (dinheiro, escola,
      hospital, colheita, avião, cartão-postal de país, taça) fica com a ilustração da pauta.
   O resto do 157 continua valendo: acervo limpo (fotos bloqueadas, foto de grupo não é retrato), sem repetir foto na
   edição, a pauta de maior prioridade escolhe primeiro. Igual a tools/paginas.py (prévia do WhatsApp). Prefixo ft187. */

/* [nome, o que o título diz, o que o nome do arquivo diz (sem acento, minúsculo), 1 = lugar no Brasil] — igual a LUGARES em paginas.py */
var FT187_LUGARES=[
  ["Congresso","Congresso(?! dos EUA| americano| argentino| do Peru)|PEC|CPI|CPMI|[Pp]rojeto de lei|PL d[aoe]s?|[Rr]elatora?","congresso nacional|palacio do congresso",1],
  ["Senado","Senado(?! dos EUA| americano)|[Ss]enador(?:a|es|as)?","plenario do senado|senado federal",1],
  ["Câmara","Câmara(?! Municipal| de | Legislativa| dos Comuns)|[Dd]eputad[oa]s?(?! estadua| distrita)","camara dos deputados",1],
  ["Planalto","Planalto|Presidência da República","planalto",1],
  ["STF","STF|Supremo(?! dos EUA| americano| Tribunal de Justiça)|Kassio","supremo tribunal federal",1],
  ["TSE","TSE|Justiça Eleitoral","tribunal superior eleitoral|^tse ",1],
  ["Banco Central","Banco Central(?! Europeu| do Japão| da China| dos EUA| americano)|BC|Copom|Selic","banco central",1],
  ["Itamaraty","Itamaraty","itamaraty",1],
  ["Fazenda","Ministério da Fazenda|Fazenda","ministerio da fazenda",1],
  ["MEC","MEC|Ministério da Educação","ministerio da educacao",1],
  ["Esplanada","Esplanada","esplanada",1],
  ["B3","B3|Bovespa|Ibovespa|Bolsa(?! Família| de estudo| Atleta| Verde)","bovespa",1],
  ["Bandeirantes","Palácio dos Bandeirantes|Bandeirantes","bandeirantes",1],
  ["Guanabara","Palácio Guanabara|Guanabara","guanabara",1],
  ["Maracanã","Maracanã","maracana",1],["Allianz Parque","Allianz Parque|Allianz","allianz",1],
  ["Arena MRV","Arena MRV","arena mrv",1],["Mineirão","Mineirão","mineirao",1],
  ["Beira-Rio","Beira-Rio","beira.rio",1],["São Januário","São Januário","sao januario",1],
  ["Fonte Nova","Fonte Nova","fonte nova",1],["Nilton Santos","Nilton Santos|Engenhão","nilton santos",1],
  ["Arena do Grêmio","Arena do Grêmio","arena do gremio",1],["Arena Corinthians","Arena Corinthians|Neo Química Arena","arena corinthians",1],
  ["Interlagos","Interlagos","interlagos",1],["Ibirapuera","Ibirapuera","ibirapuera",1],
  ["Casa Branca","Casa Branca","white house|casa branca",0],["Capitólio","Capitólio","capitol",0],
  ["Parlamento Europeu","Parlamento Europeu","european parliament",0],["Knesset","Knesset","knesset",0],
  ["Casa Rosada","Casa Rosada","casa rosada",0],
  ["Tiananmen","Tiananmen|Praça da Paz Celestial","tiananmen",0],["União Africana","União Africana","african union",0],
  ["Gaza","Gaza","gaza",0]];
var FT187_L="A-Za-zÀ-ÿ0-9";
var FT187_RE=FT187_LUGARES.map(([nome,t,a,br])=>[nome,new RegExp(`(?:^|[^${FT187_L}])(${t})(?![${FT187_L}])`),new RegExp(a),br]);
/* órgão da pessoa (18/11, meio-termo): o grupo do acervo (deputado → Câmara, senador → Senado, STF); os retratos curados
   vêm sem cargo: tabela curta. Igual a ORGAO_GRUPO/ORGAO_NOME em paginas.py */
var FT187_ORG_GRUPO={camara:"Câmara",senado:"Senado",stf:"STF"};
var FT187_ORG_NOME={"Alexandre de Moraes":"STF","Edson Fachin":"STF","Gilmar Mendes":"STF","Flávio Dino":"STF","André Mendonça":"STF",
  "Kassio Nunes Marques":"STF","Cármen Lúcia":"STF","Dias Toffoli":"STF","Luiz Fux":"STF","Cristiano Zanin":"STF",
  "Fernando Haddad":"Fazenda","Gabriel Galípolo":"Banco Central"};
function ft187Orgao(fr,A){const r=ft157Acha(fr,A,false);if(!r)return null;const pos=r[1],best=[r[2],r[0]];const org=FT187_ORG_GRUPO[best[1].grupo]||FT187_ORG_NOME[best[0]];return org?[pos,org]:null}
/* lugares da frase principal do título, na ordem em que aparecem: os que o título diz e o órgão da 1ª pessoa citada */
function ft187Lugares(fr,A){const out=[];FT187_RE.forEach(([nome,rt,ra,br],k)=>{const m=rt.exec(fr);if(m)out.push([m.index+m[0].length-m[1].length,k,nome,ra,br])});
  const og=A?ft187Orgao(fr,A):null;
  if(og&&!out.some(x=>x[2]===og[1])){const k=FT187_RE.findIndex(x=>x[0]===og[1]);if(k>=0)out.push([og[0],k,FT187_RE[k][0],FT187_RE[k][2],FT187_RE[k][3]])}
  return out.sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x.slice(2))}
/* jogo: estádio do mandante (o time citado primeiro em "A x B"); nunca em final/decisão nem em jogo fora do Brasil */
var FT187_FINAL=/[Ff]ina(?:l|is)|[Dd]ecide|[Dd]ecis/;
function ft187Mandante(p,fr,A){if(secOf(p)!=="esportes"||FT187_FINAL.test(fr)||ft157Fora(p))return [];let best=null,pos=1e9;
  Object.values(A.assuntos||{}).forEach(x=>{if(!x||!Array.isArray(x.secoes)||x.secoes.length!==1||x.secoes[0]!=="esportes"||!Array.isArray(x.chaves))return;
    x.chaves.forEach(k=>{if(typeof k!=="string"||!k)return;const i=posPalavra(fr,k);if(i>=0&&i<pos&&fr.slice(i+k.length,i+k.length+3)===" x "){best=x;pos=i}})});
  return ((best&&best.fotos)||[]).filter(f=>faValida(f)&&!ft157Bloq(f))}
/* fotos do acervo (assuntos, depois temas; sem repetir) cujo nome de arquivo diz o lugar */
var FT187_CACHE={};
function ft187FotosLugar(A,nome,ra){const ck=(A.gerado||"")+"|"+nome;if(A===FOTOS_ARQ&&FT187_CACHE[ck])return FT187_CACHE[ck];
  const out=[],vistos=new Set(),listas=Object.values(A.assuntos||{}).map(x=>x&&x.fotos).concat(Object.values(A.temas||{}));
  listas.forEach(l=>{(Array.isArray(l)?l:[]).forEach(f=>{if(faValida(f)&&!ft157Bloq(f)&&ra.test(ft157Arq(f))){const n=faNome(f.url);if(!vistos.has(n)){vistos.add(n);out.push(f)}}})});
  if(A===FOTOS_ARQ)FT187_CACHE[ck]=out;return out}
/* 18/11 noite, pedido do Pedro: "estamos sendo muito restritivos; se for errar, errar para mais". A ordem é a da
   confiança, e a 1ª lista com foto ganha: (1) retrato da 1ª pessoa da frase principal do título (quem está só no subtítulo ou na 2ª frase não ganha retrato);
   "foto_arquivo":"tema" só tira o retrato quando o título fala de morte, prisão, acidente ou ataque; (2) o lugar da frase
   principal do título ou o órgão da pessoa; (3) o estádio do mandante; (4) o assunto do título, da tag ou do subtítulo; (5) o tema
   da editoria/subtema e a foto padrão da editoria. Lugar ou assunto brasileiro continua fora de notícia de fora do
   Brasil, e as fotos bloqueadas (157) continuam bloqueadas. */
var FT187_TRAGICO=/\b(mort[eoa]s?|morre|morreu|morrem|matou|mata|assassin|pres[oa]s?\b|prisão|prende|detid|acidente|ataque|atentado|tiroteio|velório|enterro|luto|desaparec|internad|cassa|cassação|condena|réu\b|inelegív|denunciad)/i;
/* corretor 19/11 (causa fotos-2): três brechas da regra aberta de 18/11 à noite.
   (a) "Governo Trump", "gestão Lula": o nome é adjetivo do governo, não a pessoa do fato; não dá retrato nem "Quem é".
   (b) quando a frase principal do título diz um lugar (Câmara, B3…), foto de OUTRO lugar com nome (Senado, Banco Central)
       não entra pelo assunto do subtítulo, pelo tema nem pelo padrão; Câmara e Senado aceitam o Congresso por fora.
       Sem foto do lugar dito, fica a foto sem lugar ou a ilustração (MPs da Câmara com o plenário do Senado; Goldman e a
       Bolsa com o prédio do Banco Central).
   (c) Esportes: foto de um jogo de outros times ("America-Pachuca Copa Sudamericana") só quando o título cita um deles. */
function ft187SemGoverno(t){return String(t||"").replace(/(^|[^A-Za-zÀ-ÿ])((?:[Gg]overno|[Gg]est[aã]o|[Aa]dministra[cç][aã]o|[Ee]ra)\s+)([A-ZÀ-Ý][A-Za-zÀ-ÿ'-]+)/g,(m,a,b,c)=>a+b+" ".repeat(c.length))}
var FT187_DENTRO={"Câmara":["Congresso"],"Senado":["Congresso"]};
function ft187OutroLugar(f,nomes){if(!nomes||!nomes.size)return false;const a=ft157Arq(f);return FT187_RE.some(x=>x[2].test(a)&&!nomes.has(x[0]))}
var FT187_COMPOSTO=/^(sul-americana|beira-rio|atletico-mg|atletico-pr|sao-paulo|fla-flu|neo-quimica|mato-grosso|rio-grandense)$/;
function ft187JogoAlheio(f,tit){const a=ft157Arq(f).replace(/\.[a-z]+$/,"");const m=/(?:^|[^a-z])([a-z]{3,})(?:-| vs\.? | versus )([a-z]{3,})(?=[^a-z]|$)/.exec(a);
  if(!m||FT187_COMPOSTO.test(m[1]+"-"+m[2])||!/(copa|sudamericana|libertadores|campeonato|liga|match|jogo|partida| vs\.? | versus )/.test(a))return false;
  const t=" "+ft157N(tit).replace(/[^a-z0-9]+/g," ")+" ";return !(t.indexOf(" "+m[1]+" ")>=0||t.indexOf(" "+m[2]+" ")>=0)}
faListas=function(p,A){const L=[];if(!A||!p)return L;if(A===FOTOS_ARQ)ft157Prep();const n=p.neutro||{},tit=String(n.titulo||""),fr=ft157Frase(tit),
    sub=typeof p.subtitulo==="string"?p.subtitulo:"",extra=[p.tag,p.tema].filter(x=>typeof x==="string"&&x).join(" · "),sec=secOf(p),T=A.temas||{};
  let fo=null;const fora=()=>{if(fo===null)fo=!!ft157Fora(p);return fo};
  const ditos=new Set(),esp=sec==="esportes";const pega=(l,lugar)=>{if(!Array.isArray(l))return;const k=l.map(f=>f&&f.url).sort().join("|");const ok=l.filter(f=>faValida(f)&&!ft157Bloq(f)&&!(lugar&&fora()&&ft157Br(f))&&!(lugar&&ft187OutroLugar(f,ditos))&&!(esp&&ft187JogoAlheio(f,tit)));if(ok.length&&!L.some(x=>x.ft187o===k)){ok.ft187o=k;L.push(ok)}};
  if(p.foto_arquivo!=="tema"||!FT187_TRAGICO.test(tit)){const pe=ft157Pessoa(ft187SemGoverno(fr),A);if(pe)pega(pe.fotos,false)}
  ft187Lugares(ft187SemGoverno(fr),A).forEach(([nome,ra,br])=>{if(br&&fora())return;ditos.add(nome);(FT187_DENTRO[nome]||[]).forEach(x=>ditos.add(x));const ok=ft187FotosLugar(A,nome,ra).filter(f=>!(esp&&ft187JogoAlheio(f,tit)));if(ok.length&&!L.some(x=>x.ft187n===nome)){ok.ft187n=nome;L.push(ok)}});
  const md=ft187Mandante(p,fr,A).filter(f=>!ft187JogoAlheio(f,tit));if(md.length)L.push(md);
  /* assunto: em Esportes, só assunto de esporte (Japão no jogo da Seleção não é Tóquio) e nunca o clube numa final (campo neutro) */
  const asOk=x=>x&&(sec!=="esportes"||(Array.isArray(x.secoes)&&x.secoes.includes("esportes")&&!FT187_FINAL.test(fr)));
  try{for(const t of [fr,extra,sub]){if(!t)continue;const as=faAssunto(t,A,sec);if(asOk(as)){pega(as.fotos,true);break}}}catch(e){}
  /* tema e padrão da editoria: foto de lugar com nome (Banco Central, Senado) vai por último, para sobrar para a notícia
     que diz esse lugar (o tomate fica com o supermercado e o Copom com o Banco Central) */
  const deLugar=f=>FT187_RE.some(x=>x[2].test(ft157Arq(f)));const fin=sec==="esportes"&&FT187_FINAL.test(fr);
  /* final (campo neutro): nenhum estádio */const tm=l=>Array.isArray(l)?l.filter(f=>!deLugar(f)).concat(fin?[]:l.filter(deLugar)):l;
  /* 20/11 noite: notícia trágica com o retrato tirado (internação, morte, prisão) não cai na foto genérica da editoria
     (Bolsonaro internado com a foto do Congresso): fica a ilustração */
  const semGen=p.foto_arquivo==="tema"&&FT187_TRAGICO.test(tit)&&!L.length;
  if(!semGen){pega(tm(T[sec+"/"+(p.subtema||"")]),true);pega(tm(T[(A.padrao||{})[sec]]),true)}
  /* 20/11 (testador): Capitólio só em notícia do Congresso dos EUA (a licença de chips era do Departamento de Comércio);
     foto em tira (640×174) fica borrada no quadro. Vale para todas as listas (lugar e mandante também), igual a paginas.py */
  const cong=/Congresso|Capit[óo]lio|Senado (?:americano|dos EUA)|C[âa]mara dos (?:EUA|Representantes)/.test(tit);
  const ruim=f=>(!cong&&/capitol/i.test(ft157Arq(f)))||!!(f&&f.w&&f.h&&(f.h<280||f.w/f.h>2.3));
  return L.map(l=>{const o=l.filter(f=>!ruim(f));["ft187o","ft187n"].forEach(k=>{if(l[k])o[k]=l[k]});return o}).filter(l=>l.length)};

/* foto própria: "mostra" precisa partilhar um nome (pessoa, lugar, sigla, código) com o título — igual a confirma() em paginas.py */
var FT187_STOP=new Set(["a","o","as","os","e","em","no","na","nos","nas","de","do","da","dos","das","um","uma","com","por","para","pelo","pela",
  "apos","sem","se","ao","aos","que","mais","ja","nao","sob","ate","entre","contra","como","diz","foto","arquivo","durante"]);
function ft187Nomes(t){const out=new Set();(String(t||"").match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g)||[]).forEach(tk=>{if(tk.length<2)return;
  if(/^[A-ZÀ-ÖØ-Þ]/.test(tk)||(/[0-9]/.test(tk)&&/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(tk))){const n=ft157N(tk).replace(/[^\x00-\x7f]/g,"");if(!FT187_STOP.has(n))out.add(n)}});return out}
/* 18/11 noite: foto própria sem "mostra" volta a valer (errar para mais); com "mostra", ainda precisa bater com o título */
function ft187Confirma(p,f){const m=f&&f.mostra;if(typeof m!=="string"||!m.trim())return true;const t=ft187Nomes((p&&p.neutro||{}).titulo);
  for(const n of ft187Nomes(m))if(t.has(n))return true;return false}
{const _po187=ft157PropriaOk;ft157PropriaOk=function(p,f){return ft187Confirma(p,f)&&_po187.apply(this,arguments)}}
