/* ---------- 146: o Feed não baixa o texto inteiro das colunas (13/11) ----------
   Antes, a lista de publicações vinha com select("*"), e cada coluna trazia o texto longo (publicacoes.corpo, até 40.000
   caracteres) a cada atualização do Feed, mesmo sem ninguém abrir. Agora:
   - a lista vem sem o corpo (PUB_SEL, no 068); se o banco não tiver alguma das colunas da lista, volta para "*";
   - o cartão no Feed usa a chamada e o tempo de leitura guardados no aparelho (cl146 no localStorage, por coluna e
     versão); só a coluna que o aparelho nunca viu busca o corpo, uma vez, num pedido só para todas as novas;
   - quem já tinha o corpo (mesma coluna, mesma versão) herda de uma atualização para a outra;
   - ler, editar, exportar ou cancelar o agendamento buscam o corpo antes de abrir (rápido; sem rede, um aviso).
   Colunas antigas (antes da v9) guardam o texto em estilo.coluna.corpo e não mudam. Nomes com o prefixo cl146. */
PUB_SEL="id,autor,tipo,at,expira,texto,fotos,pid,snap,estilo,agenda_aviso,arquivado,editado,fixado,publicar_em,publico";
const CL146_K="prumo-col146",CL146={c:null,busca:null};
function cl146Le(){if(CL146.c)return CL146.c;try{const o=JSON.parse(localStorage.getItem(CL146_K)||"{}");CL146.c=o&&typeof o==="object"&&!Array.isArray(o)?o:{}}catch(e){CL146.c={}}return CL146.c}
function cl146Grava(){try{const c=cl146Le(),ks=Object.keys(c);if(ks.length>400)ks.sort((a,b)=>(c[a].t||0)-(c[b].t||0)).slice(0,ks.length-300).forEach(k=>delete c[k]);localStorage.setItem(CL146_K,JSON.stringify(c))}catch(e){}}
const cl146Ver=x=>String(+x.editado||+x.at||0);
/* a coluna veio sem o texto longo? (só as colunas novas, com o texto em publicacoes.corpo) */
function cl146Falta(x){try{if(!x||x.tipo!=="post"||("corpo" in x))return false;const k=x.estilo&&x.estilo.coluna;return !!(k&&typeof k==="object"&&!Array.isArray(k)&&!k.corpo&&k.tit)}catch(e){return false}}
/* guarda a chamada e os minutos de quem tem o corpo */
function cl146Anota(x){try{if(!x||typeof x.corpo!=="string"||!x.corpo)return;const c=cs123Col(x);if(!c)return;const m=cl146Le(),v=cl146Ver(x),o=m[x.id];
  if(o&&o.v===v)return;m[x.id]={v,tz:cs123Teaser(c.corpo)||"",min:(typeof ed132Min==="function"?ed132Min:cs123Min)(c.corpo),t:Date.now()};cl146Grava()}catch(e){}}
function cl146Herda(novos,velhos){const by=new Map((velhos||[]).map(y=>[y.id,y]));
  (novos||[]).forEach(x=>{if(!cl146Falta(x))return;const y=by.get(x.id);if(y&&typeof y.corpo==="string"&&cl146Ver(y)===cl146Ver(x))x.corpo=y.corpo});
  setTimeout(cl146Completa,0)}
/* busca o corpo de algumas colunas e põe nas publicações (PUB.itens e as agendadas) */
async function cl146Busca(ids){ids=[...new Set(ids)].filter(Boolean).slice(0,60);if(!ids.length||typeof SB==="undefined"||!SB)return false;
  try{const r=await SB.from("publicacoes").select("id,corpo,editado,at").in("id",ids);if(r.error)return false;
    (r.data||[]).forEach(d=>{const l=[pubDe(d.id)];try{if(typeof ED132!=="undefined"&&ED132.agend)l.push(ED132.agend.find(x=>x.id===d.id))}catch(e){}
      l.forEach(x=>{if(x&&cl146Falta(x)){x.corpo=typeof d.corpo==="string"?d.corpo:null;cl146Anota(x)}})});return true}catch(e){return false}}
/* cartões das colunas que este aparelho nunca viu: busca o corpo delas de uma vez e acerta só aquele cartão */
async function cl146Completa(){if(CL146.busca)return;const m=cl146Le(),falta=[];
  try{pubVisiveis().forEach(x=>{if(typeof x.corpo==="string")cl146Anota(x);else if(cl146Falta(x)){const o=m[x.id];if(!o||o.v!==cl146Ver(x))falta.push(x.id)}})}catch(e){}
  if(!falta.length)return;CL146.busca=cl146Busca(falta);try{if(await CL146.busca)falta.forEach(cl146Acerta)}finally{CL146.busca=null}}
function cl146Acerta(id){const x=pubDe(id),c=x&&cs123Col(x);if(!c)return;
  document.querySelectorAll(`.cs123-card[data-cs123ler="${CSS.escape(id)}"]`).forEach(el=>{try{const tp=document.createElement("template");tp.innerHTML=cs123CardHTML(x,c).trim();const n=tp.content.firstElementChild;if(n)el.replaceWith(n)}catch(e){}})}
/* cartão sem o corpo: chamada e minutos guardados (ou só a linha fina, até o corpo chegar) */
{const _ch=cs123CardHTML;cs123CardHTML=function(x,c){if(!cl146Falta(x))return _ch.apply(this,arguments);
  const o=cl146Le()[x.id],ok=o&&o.v===cl146Ver(x);let h=_ch.call(this,x,{...c,corpo:"",html:x.estilo.coluna.f==="h"?"<p></p>":c.html});
  try{const tp=document.createElement("template");tp.innerHTML=String(h).trim();const a=tp.content.firstElementChild;if(!a)return h;
    const mi=a.querySelector(".cs123-min");if(mi){if(ok)mi.textContent=o.min+" min de leitura";else mi.textContent=""}
    if(ok&&o.tz&&!c.cham&&!a.querySelector(".cs123-x")){const r=a.querySelector(".cs123-r"),p=document.createElement("p");p.className="cs123-x";p.textContent=o.tz;if(r)r.before(p)}
    return a.outerHTML}catch(e){return h}}}
/* abrir, editar, exportar e cancelar o agendamento precisam do texto */
async function cl146Garante(id){let x=pubDe(id);try{if(!x&&typeof ed132Pub==="function")x=ed132Pub(id)}catch(e){}if(!x||!cl146Falta(x))return true;
  if(CL146.busca)try{await CL146.busca}catch(e){}if(!cl146Falta(x))return true;
  const ok=await cl146Busca([id]);if(!ok||cl146Falta(x)){toast("Sem conexão para abrir a coluna agora. Tente de novo em instantes.");return false}return true}
{const _ab=cs123Abrir;cs123Abrir=function(id){const x=pubDe(id)||(typeof pubVisiveis==="function"?pubVisiveis().find(y=>y.id===id):null);if(!cl146Falta(x))return _ab.apply(this,arguments);
  const a=arguments,t=this;cl146Garante(id).then(ok=>{if(ok)_ab.apply(t,a)})}}
{const _ed=ed132Edita;ed132Edita=function(id){const x=ed132Pub(id);if(!cl146Falta(x))return _ed.apply(this,arguments);const a=arguments,t=this;cl146Garante(id).then(ok=>{if(ok)_ed.apply(t,a)})}}
{const _ca=ed132CancelaAg;ed132CancelaAg=async function(id){const x=(ED132.agend||[]).find(y=>y.id===id);if(cl146Falta(x)&&!(await cl146Garante(id)))return;return _ca.apply(this,arguments)}}
window.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-ex133exp]");if(!b)return;const id=b.dataset.ex133exp,x=(typeof ed132Pub==="function"?ed132Pub(id):pubDe(id));if(!cl146Falta(x))return;
  e.stopPropagation();e.preventDefault();cl146Garante(id).then(ok=>{if(ok)ex133Exportar(ex133DaPub(id))})},true);
