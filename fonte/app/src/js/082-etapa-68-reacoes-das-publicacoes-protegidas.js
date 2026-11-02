/* ---------- Etapa 68: reações das publicações protegidas ---------- */
var _gm68base;var PS={on:null,lk:{},cm:{},vt:{},cid:{},t:0,uid:null,migrou:false};
const psPub=k=>{const m=/^us?:([0-9a-f-]{36})/i.exec(String(k||""));return m?m[1]:null};
async function psCarregar(){if(!SB||!S.uid||!S.membro)return;try{const r=await SB.from("pub_reacoes").select("pub,uid,tipo,chave,valor,at").limit(5000);if(r.error){PS.on=false;return}
  const lk={},cm={},vt={},cid={};(r.data||[]).forEach(x=>{if(x.tipo==="curtida")(lk[x.pub]=lk[x.pub]||new Set()).add(x.uid);
    else if(x.tipo==="comentario"){const v=x.valor||{};(cm[x.pub]=cm[x.pub]||[]).push({id:x.chave,uid:x.uid,pid:"u:"+x.pub,texto:typeof v.texto==="string"?v.texto.slice(0,2000):"",at:+x.at||0,_ps:1});cid[x.chave]=x.pub}
    else if(x.tipo==="voto"){(vt[x.chave]=vt[x.chave]||{})[x.uid]=x.valor&&x.valor.v!==undefined?x.valor.v:x.valor}});
  Object.assign(PS,{on:true,lk,cm,vt,cid,uid:S.uid,t:Date.now()});psMigra();psRedesenha()}catch(e){PS.on=false}}
function psRedesenha(){try{document.querySelectorAll("#posts .upost[data-pid]").forEach(a=>updateSocial(a.dataset.pid));S._reCmt&&S._reCmt();const b=$("#layer .us2-its"),x=ST&&ST.itens&&ST.itens[ST.i];if(b&&x&&x.estilo)b.innerHTML=usItensHTML(x)}catch(e){}}
function psOuvir(){try{if(!SB.channel||psOuvir.ok)return;psOuvir.ok=1;const ch=SB.channel("reac-"+Math.random().toString(36).slice(2,7));ch.on("postgres_changes",{event:"*",schema:"public",table:"pub_reacoes"},p=>{if(p&&p.table&&p.table!=="pub_reacoes")return;clearTimeout(psOuvir.t);psOuvir.t=setTimeout(psCarregar,500)});ch.subscribe()}catch(e){}}
{const _pc68=pubCarregar;pubCarregar=async function(){const r=await _pc68.apply(this,arguments);if(PUB.on&&PS.on!==false){psOuvir();if(PS.uid!==S.uid||Date.now()-PS.t>8000)await psCarregar()}return r}}
/* leitura: junta o que está na tabela */
{const _so68=socialOf;socialOf=function(pid){const r=_so68.apply(this,arguments);if(!PS.on||String(pid).indexOf("u:")!==0)return r;const id=pid.slice(2);
  const likes=[...new Set([...(r.likes||[]),...[...(PS.lk[id]||[])].filter(u=>ehVisivel(u))])];const ids=new Set((PS.cm[id]||[]).map(c=>c.id));
  const cm=(r.cm||[]).filter(c=>!ids.has(c.id)).concat((PS.cm[id]||[]).filter(c=>ehVisivel(c.uid)&&!(CPEND[c.uid+"\u0001"+c.id]&&CPEND[c.uid+"\u0001"+c.id].v===null))).sort((a,b)=>a.at-b.at);return {likes,cm}}}
{const _vd68=votosDe;votosDe=function(k){const r=_vd68.apply(this,arguments);if(!PS.on||!psPub(k))return r;const o={...r};Object.entries(PS.vt[k]||{}).forEach(([u,v])=>{if(ehVisivel(u))o[u]=v});return o}}
{const _mv68=meuVoto;meuVoto=function(k){if(PS.on&&psPub(k)&&PS.vt[k]&&PS.vt[k][S.uid]!==undefined)return PS.vt[k][S.uid];return _mv68.apply(this,arguments)}}
/* escrita: vai para a tabela */
{const _gm68=gravarMapa;_gm68base=_gm68;gravarMapa=function(path,campo,k,val,corpo){const m=/^(curtidas|comentarios|votos)\/(.+)$/.exec(path||"");if(!m||corpo||!PS.on||m[2]!==S.uid)return _gm68.apply(this,arguments);
  const col=m[1];
  if(col==="curtidas"&&String(k).indexOf("u:")===0)return psCurtir(String(k).slice(2),val!=null);
  if(col==="votos"&&/^us:/.test(String(k)))return psVotar(String(k),val);
  if(col==="comentarios"){if(val&&String(val.pid||"").indexOf("u:")===0)return psComentar(String(k),String(val.pid).slice(2),val);if(val==null&&PS.cid[k])return psApagarCm(String(k))}
  return _gm68.apply(this,arguments)}}
const psErro=r=>{if(r&&r.error){const e=new Error(r.error.message||"erro");e.code=r.error.code;throw e}};
async function psCurtir(id,on){const s=PS.lk[id]=PS.lk[id]||new Set();if(on){s.add(S.uid);const r=await SB.from("pub_reacoes").insert({pub:id,uid:S.uid,tipo:"curtida",chave:"",valor:{}});if(r.error&&String(r.error.code)!=="23505"){s.delete(S.uid);psErro(r)}}
  else{s.delete(S.uid);const r=await SB.from("pub_reacoes").delete().eq("pub",id).eq("uid",S.uid).eq("tipo","curtida");if(r&&r.error){s.add(S.uid);psErro(r)}}}
async function psVotar(k,val){const id=psPub(k);if(!id)return;const o=PS.vt[k]=PS.vt[k]||{},ant=o[S.uid];
  if(val==null)delete o[S.uid];else o[S.uid]=val;try{const d=await SB.from("pub_reacoes").delete().eq("pub",id).eq("uid",S.uid).eq("tipo","voto").eq("chave",k);psErro(d);
    if(val!=null){const r=await SB.from("pub_reacoes").insert({pub:id,uid:S.uid,tipo:"voto",chave:k,valor:{v:val}});psErro(r)}}catch(e){if(ant===undefined)delete o[S.uid];else o[S.uid]=ant;throw e}}
async function psComentar(cid,id,v){const c={id:cid,uid:S.uid,pid:"u:"+id,texto:String(v.texto||"").slice(0,2000),at:Date.now(),_ps:1};(PS.cm[id]=PS.cm[id]||[]).push(c);PS.cid[cid]=id;
  const r=await SB.from("pub_reacoes").insert({pub:id,uid:S.uid,tipo:"comentario",chave:cid,valor:{texto:c.texto}});if(r.error){PS.cm[id]=PS.cm[id].filter(x=>x!==c);delete PS.cid[cid];if(/row-level|policy|42501/i.test(JSON.stringify(r.error)))setTimeout(()=>toast("Os comentários deste post estão desativados."),50);psErro(r)}}
async function psApagarCm(cid){const id=PS.cid[cid];const l=PS.cm[id]||[],c=l.find(x=>x.id===cid);PS.cm[id]=l.filter(x=>x.id!==cid);
  const r=await SB.from("pub_reacoes").delete().eq("pub",id).eq("uid",(c&&c.uid)||S.uid).eq("tipo","comentario").eq("chave",cid);if(r&&r.error){if(c)PS.cm[id].push(c);psErro(r)}}
/* o que já estava nos documentos antigos passa para a tabela (uma vez) */
async function psMigra(){if(PS.migrou||!PS.on||!S.uid)return;PS.migrou=true;try{const meu=k=>(S.raw[k]||{})[S.uid]||{};
  for(const [pid,v] of Object.entries(meu("curtidas"))){if(String(pid).indexOf("u:")!==0||!v)continue;const id=pid.slice(2);if(!pubDe(id))continue;try{await psCurtir(id,true);await _gm68base("curtidas/"+S.uid,"itens",pid,null)}catch(e){}}
  for(const [k,v] of Object.entries(meu("votos"))){if(!/^us:/.test(k)||v==null)continue;if(!pubDe(psPub(k)))continue;try{await psVotar(k,v);await _gm68base("votos/"+S.uid,"itens",k,null)}catch(e){}}
  const cs=(S._cmtDocs||[]).find(([u])=>u===S.uid);const itens=cs&&cs[1]&&cs[1].itens||{};for(const [cid,v] of Object.entries(itens)){if(!v||String(v.pid||"").indexOf("u:")!==0)continue;const id=String(v.pid).slice(2);if(!pubDe(id))continue;try{await psComentar(cid,id,v);await _gm68base("comentarios/"+S.uid,"itens",cid,null)}catch(e){}}}catch(e){}}

