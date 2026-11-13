/* ---------- 149: montar o cartão do Feed com menos trabalho repetido (NC05, 13/11) ----------
   Perfil com CPU 4× (32 cartões, 5 passadas): ~13 ms por cartão de notícia. Duas contas eram refeitas em todo cartão com
   o mesmo resultado:
   - marcarTermos (014) montava e ordenava a lista de pessoas e termos do glossário e a expressão regular a cada texto;
     agora isso é feito uma vez por edição (muda quando FEED.pessoas ou FEED.glossario mudam);
   - faPessoa (043) procurava, a cada cartão, todas as chaves de todas as pessoas do acervo no título; agora guarda a
     resposta por título enquanto o acervo for o mesmo.
   O resultado de cada chamada é o mesmo de antes (inclusive o "cada termo marcado uma vez só" do MT_USADOS).
   Nomes com o prefixo mt149. */
const MT149={p:null,g:null,v:null},MT149_FA=new WeakMap();
function mt149Base(){const P=FEED&&FEED.pessoas||null,G=FEED&&FEED.glossario||null;if(MT149.v&&MT149.p===P&&MT149.g===G)return MT149.v;
  const lista=[...Object.keys(P||{}).map(k=>["p",k]),...Object.keys(G||{}).map(k=>["g",k])].filter(([,k])=>k).sort((a,b)=>b[1].length-a[1].length);
  let v=null;if(lista.length){const tipo=new Map();lista.forEach(([t,k])=>{if(!tipo.has(k))tipo.set(k,t)});
    const fonte=`(^|[^\\p{L}\\d])(${[...tipo.keys()].map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})(?=$|[^\\p{L}\\d])`;v={tipo,fonte}}
  MT149.p=P;MT149.g=G;MT149.v=v||{vazio:true};return MT149.v}
marcarTermos=function(txt){txt=String(txt??"");const b=mt149Base();if(b.vazio)return esc(txt);const tipo=b.tipo,re=new RegExp(b.fonte,"gu");
  const usados=window.MT_USADOS||new Set();let out="",last=0,m;
  while((m=re.exec(txt))){const k=m[2],ini=m.index+m[1].length;if(usados.has(k))continue;usados.add(k);const t=tipo.get(k);
    out+=esc(txt.slice(last,ini))+`<button type="button" class="gl ${t==="p"?"gp":""}" data-gl="${t}" data-k="${esc(k)}">${esc(k)}</button>`;last=ini+k.length}
  return out+esc(txt.slice(last))};
{const _fa=faPessoa;faPessoa=function(tit,A){if(!A||typeof A!=="object"||typeof tit!=="string")return _fa.apply(this,arguments);
  let m=MT149_FA.get(A);if(!m){m=new Map();MT149_FA.set(A,m)}const pes=A.pessoas;if(m.pes!==pes){m.clear();m.pes=pes}
  if(m.has(tit))return m.get(tit);const r=_fa.call(this,tit,A);if(m.size>600)m.clear();m.set(tit,r);return r}}
/* números e datas: o mesmo formatador (Intl) para todas as chamadas, em vez de criar um a cada número/data
   (toLocaleString/toLocaleDateString criam um por chamada); a saída é a mesma. Data sem dia/mês/ano/semana nas opções
   fica com o caminho antigo (toLocaleDateString põe a data junto nesse caso). */
const MT149_NF=new Map(),MT149_DF=new Map();
function mt149Df(o){const k=JSON.stringify(o);let f=MT149_DF.get(k);if(!f){f=new Intl.DateTimeFormat("pt-BR",o);MT149_DF.set(k,f)}return f}
{const _gn=grNum;grNum=function(v,c){try{const k=c===undefined?"u":String(c);let f=MT149_NF.get(k);if(!f){f=new Intl.NumberFormat("pt-BR",{minimumFractionDigits:c,maximumFractionDigits:c});MT149_NF.set(k,f)}return f.format(Number(v))}catch(e){return _gn.apply(this,arguments)}}}
{const _cs=cobSP;cobSP=function(iso,o){if(o&&!["weekday","year","month","day"].some(k=>k in o))return _cs.apply(this,arguments);const d=new Date(iso);if(isNaN(d))return "";try{return mt149Df(Object.assign({timeZone:"America/Sao_Paulo"},o||{day:"2-digit",month:"2-digit"})).format(d)}catch(e){return _cs.apply(this,arguments)}}}
