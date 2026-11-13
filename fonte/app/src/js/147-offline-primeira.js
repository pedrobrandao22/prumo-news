/* ---------- 147: primeira visita que fecha o app antes do detalhe chegar (13/11) ----------
   Na primeira visita, a Capa sai do feed-leve.json e o detalhe (feed-det/<v>.json) só era pedido depois do primeiro
   desenho, quando o aparelho ficava ocioso; a edição só ia para o aparelho (radar-feed) com o detalhe junto. Quem fechava
   o app nesse meio-tempo ficava sem nada para ler sem internet. Agora:
   1. o detalhe começa a baixar junto com o desenho da Capa (só o download; juntar continua para o ocioso); se esse
      download não responder em 8 s, o app pede de novo do jeito antigo;
   2. o leve fica guardado no aparelho (prumo-fl-leve) até a edição inteira ser guardada;
   3. ao sair do app (aba escondida) com o detalhe pendente, ele é completado;
   4. abrindo sem internet e sem edição guardada, a Capa sai do leve guardado; o resto chega quando a conexão voltar.
   Fica logo depois do 119 (antes do 029, que chama loadFeed na abertura). Nomes com o prefixo fl147. */
const FL147_K="prumo-fl-leve",FL147={pre:null};
{const _p=fl119Pintar;fl119Pintar=function(x){const L=x&&x.leve;
  try{if(L&&L.det&&!FL147.pre)FL147.pre={det:L.det,d:fetch(L.det).then(r=>r.ok?r.json():null).catch(()=>null)}}catch(e){}
  try{if(L&&L.txt)localStorage.setItem(FL147_K,L.txt)}catch(e){}
  const r=_p.apply(this,arguments);if(FL147.off){FL147.off=false;try{OFFLINE=true}catch(e){}}return r}}
{const _j=fl119Juntar;fl119Juntar=async function(L){const P=FL147.pre;
  if(P&&L&&P.det===L.det){FL147.pre=null;try{const d=await Promise.race([P.d,new Promise(ok=>setTimeout(()=>ok(null),8000))]);if(d){const f=fl119Montar(JSON.parse(L.txt),d);FL119.v.set(f,L.v);return f}}catch(e){}}
  return _j.apply(this,arguments)}}
{const _g=fl119Guardar;fl119Guardar=function(f){const r=_g.apply(this,arguments);try{if(localStorage.getItem("radar-feed"))localStorage.removeItem(FL147_K)}catch(e){}return r}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"&&FL119.parcial)try{fl119Completar()}catch(e){}});
{const _o=fl119Obter;fl119Obter=async function(atual){try{return await _o.apply(this,arguments)}catch(e){if(atual)throw e;let t=null;try{t=localStorage.getItem(FL147_K)}catch(_){}
  const L=fl119Ler(t);if(!L)throw e;let j=null;try{j=JSON.parse(L.txt)}catch(_){}if(!j||typeof j!=="object"||!Array.isArray(j.pautas)||!j._leve||j._leve.v!==L.v)throw e;FL147.off=true;return {leve:L,j}}}}
