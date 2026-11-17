/* ---------- 187: foto só com confirmação forte (fase 2 do plano "Prumo robusto", 18/11) ----------
   "Foto só entra com confirmação forte de que mostra o fato; sem isso, a ilustração. Melhor menos fotos do que foto
   errada." Troca a lista de exceções caso a caso (157, 169 e os corretores) por duas confirmações positivas:
   1. FOTO PRÓPRIA da rodada (pauta.foto) só aparece com "mostra": o que está na foto, citando a pessoa ou o lugar do
      título (precisa partilhar com o título um nome próprio, sigla ou código: "Lula", "Senado", "COP31"). Sem "mostra"
      (inclusive nas pautas gravadas antes de 18/11), o app ignora a foto e segue a regra 2. O validar.py confere.
   2. ACERVO só em dois casos: retrato da 1ª pessoa citada na frase principal do título (antes do ";"), menos com
      "foto_arquivo":"tema"; ou foto de um LUGAR que a frase principal do título diz e que o NOME DO ARQUIVO da foto
      também diz (Congresso, Senado, STF, Planalto, Banco Central/Copom, estádios citados…). Lugar brasileiro não entra
      em notícia que acontece fora do Brasil. Todo o resto (dinheiro, escola, hospital, colheita, avião, cartão-postal
      de país, taça, estádio não citado) fica com a ilustração da pauta.
   O resto do 157 continua valendo: acervo limpo (fotos bloqueadas, foto de grupo não é retrato), sem repetir foto na
   edição, a pauta de maior prioridade escolhe primeiro. Igual a tools/paginas.py (prévia do WhatsApp). Prefixo ft187. */

/* [nome, o que o título diz, o que o nome do arquivo diz (sem acento, minúsculo), 1 = lugar no Brasil] — igual a LUGARES em paginas.py */
var FT187_LUGARES=[
  ["Congresso","Congresso(?! dos EUA| americano| argentino| do Peru)","congresso nacional|palacio do congresso",1],
  ["Senado","Senado(?! dos EUA| americano)|[Ss]enadores","plenario do senado|senado federal",1],
  ["Câmara","Câmara(?! Municipal| de | Legislativa| dos Comuns)","camara dos deputados",1],
  ["Planalto","Planalto|Presidência da República","planalto",1],
  ["STF","STF|Supremo(?! dos EUA| americano| Tribunal de Justiça)","supremo tribunal federal",1],
  ["TSE","TSE|Justiça Eleitoral","tribunal superior eleitoral|^tse ",1],
  ["Banco Central","Banco Central(?! Europeu| do Japão| da China| dos EUA| americano)|BC|Copom","banco central",1],
  ["Itamaraty","Itamaraty","itamaraty",1],
  ["Fazenda","Ministério da Fazenda|Fazenda","ministerio da fazenda",1],
  ["MEC","MEC|Ministério da Educação","ministerio da educacao",1],
  ["Esplanada","Esplanada","esplanada",1],
  ["B3","B3|Bovespa|Ibovespa|Bolsa de Valores|Bolsa brasileira","bovespa",1],
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
/* lugares da frase principal do título, na ordem em que aparecem */
function ft187Lugares(fr){const out=[];FT187_RE.forEach(([nome,rt,ra,br],k)=>{const m=rt.exec(fr);if(m)out.push([m.index+m[0].length-m[1].length,k,nome,ra,br])});
  return out.sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x.slice(2))}
/* fotos do acervo (assuntos, depois temas; sem repetir) cujo nome de arquivo diz o lugar */
var FT187_CACHE={};
function ft187FotosLugar(A,nome,ra){const ck=(A.gerado||"")+"|"+nome;if(A===FOTOS_ARQ&&FT187_CACHE[ck])return FT187_CACHE[ck];
  const out=[],vistos=new Set(),listas=Object.values(A.assuntos||{}).map(x=>x&&x.fotos).concat(Object.values(A.temas||{}));
  listas.forEach(l=>{(Array.isArray(l)?l:[]).forEach(f=>{if(faValida(f)&&!ft157Bloq(f)&&ra.test(ft157Arq(f))){const n=faNome(f.url);if(!vistos.has(n)){vistos.add(n);out.push(f)}}})});
  if(A===FOTOS_ARQ)FT187_CACHE[ck]=out;return out}
faListas=function(p,A){const L=[];if(!A||!p)return L;if(A===FOTOS_ARQ)ft157Prep();const fr=ft157Frase(String((p.neutro||{}).titulo||""));
  if(p.foto_arquivo!=="tema"){const pe=ft157Pessoa(fr,A);if(pe){const ok=pe.fotos.filter(f=>faValida(f)&&!ft157Bloq(f));if(ok.length)L.push(ok)}}
  let fo=null;ft187Lugares(fr).forEach(([nome,ra,br])=>{if(br){if(fo===null)fo=!!ft157Fora(p);if(fo)return}const ok=ft187FotosLugar(A,nome,ra);if(ok.length)L.push(ok)});
  return L};

/* foto própria: "mostra" precisa partilhar um nome (pessoa, lugar, sigla, código) com o título — igual a confirma() em paginas.py */
var FT187_STOP=new Set(["a","o","as","os","e","em","no","na","nos","nas","de","do","da","dos","das","um","uma","com","por","para","pelo","pela",
  "apos","sem","se","ao","aos","que","mais","ja","nao","sob","ate","entre","contra","como","diz","foto","arquivo","durante"]);
function ft187Nomes(t){const out=new Set();(String(t||"").match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g)||[]).forEach(tk=>{if(tk.length<2)return;
  if(/^[A-ZÀ-ÖØ-Þ]/.test(tk)||(/[0-9]/.test(tk)&&/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(tk))){const n=ft157N(tk).replace(/[^\x00-\x7f]/g,"");if(!FT187_STOP.has(n))out.add(n)}});return out}
function ft187Confirma(p,f){const m=f&&f.mostra;if(typeof m!=="string"||!m.trim())return false;const t=ft187Nomes((p&&p.neutro||{}).titulo);
  for(const n of ft187Nomes(m))if(t.has(n))return true;return false}
{const _po187=ft157PropriaOk;ft157PropriaOk=function(p,f){return ft187Confirma(p,f)&&_po187.apply(this,arguments)}}
