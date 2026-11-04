/* ---------- 123: colunas e seguir ----------
   1. Coluna: um post comum que é o "teaser" (título em serifa, linha fina, capa, uma ou duas frases e "Ler a coluna ›") e abre
      a coluna inteira numa página de leitura no estilo da matéria. Curtidas, comentários e envios são os do post.
      Dados: publicacoes.estilo.coluna = {v:1,tit (até 90),linha (até 160),min}; o texto vai na coluna publicacoes.corpo (até 40.000,
      sql/publicacoes-v9.sql) ou, antes da v9, em estilo.coluna.corpo (até 6.000, para caber no limite de 8 KB do estilo).
      O texto do post continua "título\n\nlinha fina\n\n#hashtags": quem tem a versão antiga do app vê isso como legenda.
      Formatação do texto: cada linha é um parágrafo; "## " no começo vira intertítulo; "> " vira citação; **negrito**, *itálico*,
      [texto](https://link) e links soltos (aparecem como texto, com o domínio ao lado). Nada de HTML.
   2. Seguir (depende do sql/publicacoes-v9.sql; o teste é a tabela seguidores, como a v8 em js/109): Perfil › Conta › "Perfil aberto";
      no perfil aberto de quem não é amigo, "Seguir"/"Seguindo" e os números; público "Seguidores e amigos" ao publicar; os posts para
      seguidores de quem você segue entram no Feed; "X começou a seguir você" na Atividade; perfis abertos na Busca.
      Nome e foto de quem você segue (ou te segue) e não é do seu círculo vêm das funções seg_lista/perfis_abertos (só nome e foto). */

/* ===== 0. estado e detecção da v9 ===== */
var V9={on:null,n:0};
var CS123={uid:null,sigo:new Set(),segs:[],pess:{},aberto:false,perf:{},t:0,carregando:false,ed:null,ler:null,bus:{q:"",l:null}};
const CS123_IC={col:'<path d="M5 4.5h10.5L19 8v11.5H5z"/><path d="M15.5 4.5V8H19"/><path d="M8 9.5h4M8 12.5h8M8 15.5h8"/>',
  foto:'<rect x="3.5" y="5" width="17" height="14" rx="3.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 17l4.5-4.5 4 4 2.5-2.5 4 3.5"/>',
  seg:'<circle cx="10" cy="8.5" r="3.5"/><path d="M3.5 19.5c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5"/><path d="M18.5 8v6M15.5 11h6"/>'};
const cs123Svg=d=>`<svg class="ico cs123-i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const cs123S=(v,n)=>typeof v==="string"?v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").slice(0,n):"";
const CS123_LIM_V9=40000,CS123_LIM_V8=6000;
const cs123Lim=()=>V9.on?CS123_LIM_V9:CS123_LIM_V8;
const cs123Num=n=>{try{return (+n).toLocaleString("pt-BR")}catch(e){return String(n)}};
async function cs123Testa(){if(V9.on!==null||typeof SB==="undefined"||!SB||!S.uid||!S.membro)return V9.on;
  try{const r=await SB.from("seguidores").select("seguido").limit(1);
    if(!r.error)V9.on=true;else if(/does not exist|PGRST205|PGRST106|42P01|Could not find the table|schema cache/i.test(String(r.error.message||"")+" "+String(r.error.code||"")))V9.on=false}catch(e){}
  if(V9.on)cs123Liga();return V9.on}
setInterval(()=>{if(S.uid!==CS123.uid){CS123.uid=S.uid;CS123.sigo=new Set();CS123.segs=[];CS123.pess={};CS123.perf={};CS123.aberto=false;CS123.t=0}
  if(V9.on===null&&S.uid&&S.membro&&V9.n<40){V9.n++;cs123Testa()}},2500);
function cs123Liga(){try{cs123Ouvir();cs123Carregar()}catch(e){}}
setInterval(()=>{if(V9.on&&S.uid&&S.membro&&!document.hidden&&Date.now()-CS123.t>90e3)cs123Carregar();try{cs123Nomes()}catch(e){}},5000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&V9.on&&S.uid&&S.membro)setTimeout(cs123Carregar,900)});
function cs123Ouvir(){try{if(!SB.channel||cs123Ouvir.ok)return;cs123Ouvir.ok=1;const ch=SB.channel("seg-"+Math.random().toString(36).slice(2,7));
  ch.on("postgres_changes",{event:"INSERT",schema:"public",table:"seguidores"},p=>{if(p&&p.table&&p.table!=="seguidores")return;clearTimeout(cs123Ouvir.t);cs123Ouvir.t=setTimeout(cs123Carregar,500)});ch.subscribe()}catch(e){}}
function cs123Pess(x){if(!x||!x.uid)return;CS123.pess[x.uid]={nome:cs123S(x.nome,40)||"Membro",foto:typeof x.foto==="string"&&x.foto.indexOf(x.uid+"/")===0?x.foto:null,aberto:!!x.aberto}}
/* nome de quem não é do seu círculo: entra em S.achados sem aparecer em "Adicionar amigos" (propriedade não enumerável) */
function cs123Nomes(){if(!S.uid||!S.achados)return;Object.entries(CS123.pess).forEach(([u,p])=>{if(S.membros[u]||Object.prototype.hasOwnProperty.call(S.achados,u))return;
  try{Object.defineProperty(S.achados,u,{value:p.nome,enumerable:false,configurable:true,writable:true})}catch(e){}})}
{const _pn=procurarNome;procurarNome=async function(){const meus=Object.keys(CS123.pess).filter(u=>S.achados&&Object.prototype.hasOwnProperty.call(S.achados,u)&&!Object.prototype.propertyIsEnumerable.call(S.achados,u));
  meus.forEach(u=>{try{delete S.achados[u]}catch(e){}});try{return await _pn.apply(this,arguments)}finally{cs123Nomes()}}}
/* foto de quem só se conhece pelas listas de seguir */
{const _av=av8;av8=function(uid){let r=_av.apply(this,arguments);if(r||!uid||S.membros[uid])return r;const p=CS123.pess[uid];if(!p||!p.foto)return r;
  S.membros[uid]={nome:p.nome,foto:p.foto};try{r=_av.call(this,uid)}finally{delete S.membros[uid]}return r}}
async function cs123Carregar(){if(!V9.on||!SB||!S.uid||!S.membro||CS123.carregando)return;CS123.carregando=true;const eu=S.uid;
  try{const [c,a,b]=await Promise.all([SB.rpc("seg_contagem",{p_uid:eu}),SB.rpc("seg_lista",{p_uid:eu,p_tipo:"seguindo"}),SB.rpc("seg_lista",{p_uid:eu,p_tipo:"seguidores"})]);
    if(S.uid!==eu)return;const antes=[...CS123.sigo].sort().join(),k0=JSON.stringify([CS123.aberto,CS123.segs.map(s=>s.uid)]);
    if(c&&!c.error&&c.data&&c.data.ok){CS123.aberto=!!c.data.aberto;CS123.perf[eu]={...c.data,t:Date.now()}}
    if(a&&!a.error){CS123.sigo=new Set((a.data||[]).map(x=>x.uid));(a.data||[]).forEach(cs123Pess)}
    if(b&&!b.error){CS123.segs=(b.data||[]).map(x=>({uid:x.uid,at:+x.at||0}));(b.data||[]).forEach(cs123Pess)}
    cs123Nomes();CS123.t=Date.now();
    if(antes!==[...CS123.sigo].sort().join()){PUB.sig="";await pubCarregar()}
    if(k0!==JSON.stringify([CS123.aberto,CS123.segs.map(s=>s.uid)])){if(VIEW==="me")renderMe();try{atDot();atRedesenha()}catch(e){}}}
  catch(e){}finally{CS123.carregando=false}}
async function cs123Perf(u,forca){if(!V9.on||!SB||!u)return null;const p=CS123.perf[u];if(p&&!forca&&Date.now()-p.t<60e3)return p;
  try{const r=await SB.rpc("seg_contagem",{p_uid:u});if(r&&!r.error&&r.data){CS123.perf[u]={...r.data,t:Date.now()};if(r.data.ok&&u!==S.uid){if(r.data.sigo)CS123.sigo.add(u);else CS123.sigo.delete(u)}}}catch(e){}
  return CS123.perf[u]||null}

/* ===== 1. posts para seguidores: leitura ===== */
{const _pl=pubLimpa;pubLimpa=function(x){const p=x&&x.publico;const r=_pl.apply(this,arguments);if(p==="seguidores"&&x)x.publico="seguidores";return r}}
const cs123DeSeguido=x=>!!(x&&V9.on&&x.tipo!=="story"&&x.publico==="seguidores"&&!x.arquivado&&x.autor!==S.uid&&CS123.sigo.has(x.autor)&&!(S.bloq||[]).includes(x.autor));
{const _pv=pubVisiveis;pubVisiveis=function(){const base=_pv.apply(this,arguments);if(!V9.on||!CS123.sigo.size)return base;const b=new Set(base);return PUB.itens.filter(x=>b.has(x)||cs123DeSeguido(x))}}
/* Guardadas: post de quem você segue também */
if(typeof vp99ListaSalvos==="function"){const _vl=vp99ListaSalvos;vp99ListaSalvos=function(){const l=_vl.apply(this,arguments);try{if(!V9.on||!CS123.sigo.size)return l;const sv=vp99Sv(),ja=new Set(l.map(x=>x.id));
  const mais=Object.entries(sv).filter(([k,v])=>v&&vp99EhPost(k)).map(([k,v])=>({x:pubDe(k.slice(2)),at:+v.at||0})).filter(o=>o.x&&!ja.has(o.x.id)&&cs123DeSeguido(o.x)).map(o=>o.x);return l.concat(mais)}catch(e){return l}}}

/* ===== 2. coluna: dados e texto ===== */
function cs123Col(x){if(!x||x.tipo!=="post")return null;const es=x.estilo;if(!es||typeof es!=="object")return null;const c=es.coluna;if(!c||typeof c!=="object"||Array.isArray(c))return null;
  const tit=cs123S(c.tit,90).trim();if(!tit)return null;const corpo=typeof x.corpo==="string"&&x.corpo?cs123S(x.corpo,CS123_LIM_V9):cs123S(c.corpo,CS123_LIM_V8);
  return {tit,linha:cs123S(c.linha,160).trim(),corpo}}
/* ênfase dentro de um trecho já sem links */
function cs123Enf(t){return esc(t).replace(/\*\*([^*\n]+?)\*\*/g,"<strong>$1</strong>").replace(/(^|[^\p{L}\p{N}*])\*([^*\n]+?)\*(?![\p{L}\p{N}])/gu,"$1<em>$2</em>").replace(/(^|[^\p{L}\p{N}_])_([^_\n]+?)_(?![\p{L}\p{N}])/gu,"$1<em>$2</em>")}
const cs123A=(u,tx)=>`<a class="cs123-a" href="${esc(u)}" target="_blank" rel="noopener noreferrer nofollow ugc">${tx}</a>`;
function cs123Inline(raw){raw=String(raw||"");const re=/\[([^\]\n]{1,160})\]\(([^\s)]{4,500})\)|((?:https:\/\/|www\.)[^\s<>()]{2,500})/g;let i=0,m,o="";
  while((m=re.exec(raw))){o+=cs123Enf(raw.slice(i,m.index));
    if(m[1]){const u=edUrlOk(m[2]);o+=u?cs123A(u,cs123Enf(m[1]))+`<span class="cs123-dom"> (${esc(edDom(u))})</span>`:cs123Enf(m[0])}
    else{const s=m[3].replace(/[.,;:!?…]+$/,""),u=edUrlOk(s);o+=u?cs123A(u,esc(edDom(u)))+esc(m[3].slice(s.length)):esc(m[3])}
    i=m.index+m[0].length}
  return o+cs123Enf(raw.slice(i))}
function cs123Blocos(corpo){const bl=[];let cit=[];const fecha=()=>{if(cit.length){bl.push({t:"q",x:cit.join(" ")});cit=[]}};
  String(corpo||"").replace(/\r/g,"").split("\n").forEach(l=>{const s=l.trim();if(!s){fecha();return}
    if(/^#{2,3}\s+\S/.test(s)){fecha();bl.push({t:"h",x:s.replace(/^#{2,3}\s+/,"")});return}
    if(/^>\s?/.test(s)){const q=s.replace(/^>\s?/,"").trim();if(q)cit.push(q);return}
    fecha();bl.push({t:"p",x:s})});fecha();return bl}
function cs123CorpoHTML(corpo){return cs123Blocos(corpo).map(b=>b.t==="h"?`<h2>${cs123Inline(b.x)}</h2>`:b.t==="q"?`<blockquote><p>${cs123Inline(b.x)}</p></blockquote>`:`<p>${cs123Inline(b.x)}</p>`).join("")}
const cs123Plano=t=>String(t||"").replace(/\[([^\]\n]+)\]\([^)\s]+\)/g,"$1").replace(/\*\*|__/g,"").replace(/(^|[^\p{L}\p{N}])[*_]([^*_\n]+)[*_](?![\p{L}\p{N}])/gu,"$1$2");
function cs123Teaser(corpo){const ps=cs123Blocos(corpo).filter(b=>b.t==="p").map(b=>cs123Plano(b.x).trim()).filter(Boolean);if(!ps.length)return "";
  const fr=ps.slice(0,2).join(" ").split(/(?<=[.!?…])\s+/).filter(Boolean);let o=fr[0]||"";
  if(o.length<120&&fr[1]&&(o+" "+fr[1]).length<=240)o+=" "+fr[1];
  if(o.length>240)o=o.slice(0,236).replace(/\s+\S*$/,"")+"…";return o}
function cs123Min(corpo){const n=cs123Plano(corpo).split(/\s+/).filter(Boolean).length;return Math.max(1,Math.round(n/200))}
function cs123Tags(t){return typeof htExtrai==="function"?htExtrai(String(t||"").split(/[\s,]+/).filter(Boolean).map(w=>w.charAt(0)==="#"?w:"#"+w).join(" ")).map(o=>o.tag).slice(0,6):[]}
function cs123Data(at){try{return new Date(+at).toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"})}catch(e){return ""}}

/* ===== 3. coluna no Feed (o post é o teaser) ===== */
function cs123CardHTML(x,c){const id=esc(x.id),f=x.fotos[0],u=f&&pubUrl(f),tz=cs123Teaser(c.corpo),min=cs123Min(c.corpo);
  return `<div class="cs123-card gut" data-cs123ler="${id}"><p class="cs123-k">Coluna</p>
    <h3 class="cs123-t"><button type="button" data-cs123ler="${id}">${esc(c.tit)}</button></h3>${c.linha?`<p class="cs123-l">${esc(c.linha)}</p>`:""}
    ${f?`<button type="button" class="cs123-capa" data-cs123ler="${id}" aria-label="Ler a coluna">${u?`<img src="${pubSrc(u)}" alt="${esc((x.estilo.alt||[])[0]||"")}" loading="lazy" decoding="async">`:`<span class="up-sem">Foto indisponível</span>`}</button>`:""}
    ${tz?`<p class="cs123-x">${esc(tz)}</p>`:""}<div class="cs123-r"><span class="cs123-min">${min} min de leitura</span><button type="button" class="cs123-lb" data-cs123ler="${id}">Ler a coluna <i aria-hidden="true">›</i></button></div></div>`}
{const _pp=pubPostHTML;pubPostHTML=function(x){const c=x&&cs123Col(x);let h;
  if(!c)h=_pp.apply(this,arguments);
  else{const y=Object.assign(Object.create(Object.getPrototypeOf(x)),x,{texto:"",fotos:[],pid:null});h=_pp.call(this,y);
    try{const tp=document.createElement("template");tp.innerHTML=String(h||"").trim();const a=tp.content.firstElementChild;
      if(a){a.classList.add("cs123-post");a.querySelectorAll(":scope>.car,:scope>.vn-rpw,.up-leg,.vn-cc-row .up-leg").forEach(e=>e.remove());
        const ph=a.querySelector(":scope>.ph")||a.querySelector(".ph");if(ph)ph.insertAdjacentHTML("afterend",cs123CardHTML(x,c));else a.insertAdjacentHTML("afterbegin",cs123CardHTML(x,c));
        const pg=a.querySelector(".vp99-pg,.pdots");if(pg)pg.remove();h=a.outerHTML}}catch(e){}}
  try{if(h&&x&&x.publico==="seguidores")h=h.replace(/(<span class="ph-sub">[^<]*)/,`$1<span class="cs123-ps"> · seguidores</span>`)}catch(e){}
  return h}}
/* grade do perfil: a capa (ou o título) com o selo "Coluna" */
{const _pt=pfTiles;pfTiles=function(l,aba,u){let h=_pt.apply(this,arguments);try{if(!(l||[]).some(x=>cs123Col(x))||typeof h!=="string")return h;const tp=document.createElement("template");tp.innerHTML=h;
  tp.content.querySelectorAll("[data-pfi]").forEach(b=>{const x=l[+b.dataset.pfi],c=x&&cs123Col(x);if(!c)return;if(!x.fotos.length)b.innerHTML=`<span class="pf-tx cs123-pft"><b>${esc(c.tit)}</b></span>`;b.insertAdjacentHTML("beforeend",`<i class="cs123-pfk">Coluna</i>`)});
  return tp.innerHTML}catch(e){return h}}}
/* a coluna não tem "Editar legenda" (o texto do post é o título e a linha fina) */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-umenu]");if(!b)return;const x=pubDe(b.dataset.umenu);if(!x||!cs123Col(x))return;
  setTimeout(()=>{document.querySelectorAll(`.sheet [data-ueditar="${CSS.escape(x.id)}"]`).forEach(el=>el.remove())},0)},true);

/* ===== 4. página de leitura ===== */
function cs123FimHTML(x){const pid="u:"+x.id,{likes,cm}=socialOf(pid),mine=!!(S.uid&&likes.includes(S.uid)),sv=!!(S.salvos||{})[pid],ot=likes.filter(u=>u!==S.uid);
  let lt="";if(mine&&!ot.length)lt="<b>Você</b> gostou";else if(mine)lt=`<b>Você</b> e ${ot.length===1?`<b>${esc(nomeDe(ot[0]))}</b>`:"mais "+ot.length} gostaram`;else if(ot.length===1)lt=`<b>${esc(nomeDe(ot[0]))}</b> gostou`;else if(ot.length)lt=`<b>${esc(nomeDe(ot[0]))}</b> e mais ${ot.length-1} gostaram`;
  const sem=!!(x.estilo&&x.estilo.semCom),ult=cm.slice(-2);
  return `<p class="cs123-fk">Gostou da coluna?</p><div class="acts cs123-acts"><button type="button" class="act${mine?" on":""}" data-a="like" aria-pressed="${mine}" aria-label="Gostei">${ICON.like}<span>Gostei${likes.length?" · "+likes.length:""}</span></button>${sem?"":`<button type="button" class="act" data-a="cmt" aria-label="Comentar">${ICON.cmt}<span>Comentar${cm.length?" · "+cm.length:""}</span></button>`}<button type="button" class="act" data-usend="${esc(x.id)}" aria-label="Enviar">${ICON.send}<span>Enviar</span></button><button type="button" class="act${sv?" saved":""}" data-a="save" aria-pressed="${sv}" aria-label="Guardar">${ICON.save}<span>${sv?"Guardada":"Guardar"}</span></button></div>
    ${lt?`<p class="cs123-lk">${lt}</p>`:""}${ult.length?`<ul class="cs123-cms">${ult.map(c=>`<li>${avatar(c.uid)}<span><b>${esc(nomeDe(c.uid))}</b> ${esc(String(c.texto||"").slice(0,280))}</span></li>`).join("")}</ul>`:""}
    ${sem?`<p class="hint">Os comentários estão desativados nesta coluna.</p>`:`<button type="button" class="addc" data-a="cmt">${cm.length>2?`Ver os ${cm.length} comentários`:"Adicione um comentário…"}</button>`}`}
function cs123LerHTML(x,c,o){o=o||{};const f=x.fotos&&x.fotos[0],u=o.capa||(f&&pubUrl(f)),min=cs123Min(c.corpo),ult=String(x.texto||"").split("\n\n").pop(),tags=o.prev?cs123Tags(o.tags):/^#/.test(ult)&&String(x.texto||"").indexOf("\n\n")>0?cs123Tags(ult):[];
  return `<div class="cs123-ler${o.prev?" cs123-prev":""}" role="dialog" aria-modal="true" aria-label="${esc("Coluna: "+c.tit)}">
    <div class="cs123-top"><button type="button" class="cs123-v" ${o.prev?"data-cs123prevx":"data-cs123fecha"}>${ICON.back}<span>${o.prev?"Editar":"Voltar"}</span></button><span class="cs123-tk">${o.prev?"Prévia da coluna":"Coluna"}</span>${o.prev?`<button type="button" class="btn cs123-tpub" data-cs123pub>Publicar</button>`:`<button type="button" class="icbtn" data-usend="${esc(x.id)}" aria-label="Enviar a coluna">${ICON.send}</button>`}<i class="cs123-pg" aria-hidden="true"><b></b></i></div>
    <div class="cs123-sc"><article class="cs123-art"><p class="cs123-k">Coluna</p><h1>${esc(c.tit)}</h1>${c.linha?`<p class="cs123-l">${esc(c.linha)}</p>`:""}
      <div class="cs123-by"><button type="button" class="cs123-au" ${o.prev?"":`data-cs123perfil="${esc(x.autor)}"`}>${avatar(x.autor)}<span><b>${esc(nomeDe(x.autor))}</b><small>${esc(cs123Data(x.at))} · ${min} min de leitura</small></span></button></div>
      ${u?`<figure class="cs123-fig"><img src="${pubSrc(u)}" alt="${esc((x.estilo&&x.estilo.alt||[])[0]||"")}"></figure>`:f?`<figure class="cs123-fig"><span class="up-sem">Foto indisponível</span></figure>`:""}
      <div class="cs123-corpo">${cs123CorpoHTML(c.corpo)||`<p class="hint">Escreva o texto da coluna para ver como fica.</p>`}<span class="cs123-ponto" aria-hidden="true"></span></div>
      ${tags.length?`<div class="cs123-hts">${tags.map(t=>`<button type="button" class="cs123-ht" ${o.prev?"":`data-ht="${esc(t)}"`}>${esc(t)}</button>`).join("")}</div>`:""}
      <p class="cs123-aviso">Coluna de ${esc(nomeDe(x.autor))}: a opinião é do autor, separada das notícias da edição do Prumo.</p>
      ${o.prev?"":`<div class="cs123-fim" data-pid="${esc("u:"+x.id)}">${cs123FimHTML(x)}</div>`}</article></div></div>`}
function cs123Progresso(root){const sc=root&&root.querySelector(".cs123-sc"),b=root&&root.querySelector(".cs123-pg b");if(!sc||!b)return;
  const f=()=>{const m=sc.scrollHeight-sc.clientHeight;b.style.width=(m>0?Math.min(100,Math.max(0,sc.scrollTop/m*100)):100).toFixed(1)+"%"};sc.addEventListener("scroll",f,{passive:true});f()}
function cs123Abrir(id){const x=pubDe(id)||pubVisiveis().find(y=>y.id===id),c=x&&cs123Col(x);if(!c){toast("Esta coluna não está disponível para você (ou já foi apagada).");return}uso("coluna_ler");
  const L=$("#layer");let volta=null;
  if($("#layer2")?.innerHTML)closeLayer();
  if(L.innerHTML){if($("#layer .pfv")&&PFV){const sc=$("#layer .pfv-sc");volta={pfv:{...PFV},sc:sc?sc.scrollTop:0};try{pfIdsVolta()}catch(e){}PFV=null;L.innerHTML=""}else closeLayer()}
  const vazio=!L.innerHTML;L.innerHTML=cs123LerHTML(x,c);CS123.ler={id,volta};const r=L.querySelector(".cs123-ler");cs123Progresso(r);
  if((vazio||volta)&&pushH())HST++;try{if(typeof htLinka==="function")r.querySelectorAll(".cs123-corpo p").forEach(htLinka)}catch(e){}}
function cs123FimAtualiza(){const L=CS123.ler,el=L&&document.querySelector("#layer .cs123-ler .cs123-fim");if(!el)return;const x=pubDe(L.id);if(x)el.innerHTML=cs123FimHTML(x)}
{const _us=updateSocial;updateSocial=function(pid){const r=_us.apply(this,arguments);try{if(CS123.ler&&pid==="u:"+CS123.ler.id)cs123FimAtualiza()}catch(e){}return r}}
/* folhas (comentários, enviar) abrem por cima da coluna e do editor, sem fechá-los */
{const _sh=sheet;sheet=function(){const r0=document.querySelector("#layer > .cs123-ler, #layer > .cs123-ed");if(r0&&!$("#layer2")?.innerHTML){r0.classList.add("cria");try{return _sh.apply(this,arguments)}finally{r0.classList.remove("cria")}}return _sh.apply(this,arguments)}}
/* voltar: da coluna para o perfil de onde ela foi aberta; da prévia para o editor */
{const _cl=closeLayer;closeLayer=function(fromPop){const l2=!!($("#layer2")&&$("#layer2").innerHTML);
  if(!l2&&$("#layer .cs123-prev")&&CS123.ed){$("#layer .cs123-prev").remove();if(fromPop===true){if(pushH())HST++;return}if(HST>0){HST--;voltarH(1)}return}
  if(!l2&&$("#layer > .cs123-ed")&&CS123.ed){if(CS123.ed.env&&fromPop!==true){toast("Publicando…");return}cs123RascGuarda(true);CS123.ed=null}
  const ler=!l2&&$("#layer > .cs123-ler")&&CS123.ler,volta=ler&&CS123.ler.volta;const r=_cl.apply(this,arguments);
  if(ler){CS123.ler=null;if(volta&&!$("#layer").innerHTML){PFV=volta.pfv;$("#layer").innerHTML=`<div class="pfv" role="dialog" aria-modal="true" aria-label="Perfil de ${esc(nomeDe(PFV.u))}"></div>`;try{pfvDesenha();const sc=$("#layer .pfv-sc");if(sc)sc.scrollTop=volta.sc}catch(e){}}}
  return r}}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if((b=t.closest("[data-cs123ler]"))&&!t.closest("a")){pare();cs123Abrir(b.dataset.cs123ler);return}
  if(t.closest("[data-cs123fecha]")){pare();history.back();return}
  if(b=t.closest("[data-cs123perfil]")){pare();const u=b.dataset.cs123perfil;if($("#layer2")?.innerHTML)closeLayer();abrirPerfil(u);return}},true);

/* ===== 5. criar a coluna ===== */
/* no "O que você quer publicar?" e nas abas do formulário */
{const _ih=cn102InicioHTML;cn102InicioHTML=function(){let h=_ih.apply(this,arguments);try{const n=cs123RascLe().length;
  h=h.replace(/(<div class="cn102-cards">[\s\S]*?)(<\/div>)/,(m,a,z)=>a+`<button type="button" class="cn102-card cs123-cardc" data-cs123ini>${CN102_SVG(CS123_IC.col)}<b>Escrever coluna</b><small>${n?`${n} ${n===1?"rascunho":"rascunhos"} guardado${n===1?"":"s"}`:"Texto longo com título, como um artigo"}</small></button>`+z)}catch(e){}return h}}
{const _cd=cn102Det;cn102Det=function(el){const r=_cd.apply(this,arguments);try{const ks=el.querySelector(".cn102-ks");if(ks&&!ks.querySelector("[data-cs123ini]"))ks.insertAdjacentHTML("beforeend",`<button type="button" role="tab" data-cs123ini aria-selected="false">${CN102_SVG(CS123_IC.col)}Coluna</button>`)}catch(e){}return r}}
window.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer [data-cs123ini]");if(!b)return;e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();
  if(typeof ED!=="undefined"&&ED&&ED.env)return;const P=ED&&ED.po,pre=P&&P.cn?{tit:String(P.cn.tit||"").slice(0,90),corpo:String(P.cn.corpo||"")}:P?{corpo:String(P.texto||"")}:{};cs123Comeca(pre)},true);
function cs123Comeca(pre){if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}uso("criar_coluna");
  if(typeof ED!=="undefined"&&ED){ED=null;closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}else if($("#layer").innerHTML)closeLayer();
  cs123EdAbre(pre||{})}
function cs123EdNovo(o){return {rid:"c"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),tit:"",linha:"",corpo:"",tags:"",pub:"amigos",capa:null,env:false,...o}}
function cs123EdAbre(pre,rasc){const L=$("#layer");if(L.innerHTML)closeLayer();
  CS123.ed=rasc?cs123EdNovo({...rasc,capa:rasc.capa?{url:rasc.capa,du:rasc.capa}:null}):cs123EdNovo({tit:cs123S(pre.tit,90),corpo:cs123S(pre.corpo,cs123Lim())});CS123.ed.deRasc=!!rasc;
  L.innerHTML=`<div class="cs123-ed" role="dialog" aria-modal="true" aria-label="Nova coluna"></div>`;if(pushH())HST++;cs123EdDesenha();
  setTimeout(()=>{const i=$(CS123.ed&&CS123.ed.tit?"#cs123-corpo":"#cs123-tit");if(i)try{i.focus({preventScroll:true})}catch(e){}},80)}
function cs123PubOpc(){const E=CS123.ed;if(!V9.on||!CS123.aberto){if(E.pub==="seguidores")E.pub="amigos";return ""}
  return `<div class="cs123-pub" role="radiogroup" aria-label="Quem pode ler"><span>Quem pode ler</span><button type="button" role="radio" data-cs123pubv="amigos" aria-checked="${E.pub!=="seguidores"}">Amigos</button><button type="button" role="radio" data-cs123pubv="seguidores" aria-checked="${E.pub==="seguidores"}">Seguidores e amigos</button></div>`}
function cs123Conta(){const E=CS123.ed;if(!E)return;const lim=cs123Lim(),n=E.corpo.length,min=cs123Min(E.corpo);const el=$("#layer [data-cs123n=\"corpo\"]");
  if(el){el.textContent=`${cs123Num(n)} de ${cs123Num(lim)} caracteres${n?" · "+min+" min de leitura":""}${!V9.on?" (por enquanto, o limite é 6.000)":""}`;el.classList.toggle("cs123-quase",n>lim*.95)}
  ["tit","linha"].forEach(k=>{const s=$(`#layer [data-cs123n="${k}"]`);if(s)s.textContent=`${E[k].length}/${k==="tit"?90:160}`})}
function cs123EdDesenha(){const el=$("#layer .cs123-ed"),E=CS123.ed;if(!el||!E)return;const rs=E.tit||E.corpo||E.deRasc?[]:cs123RascLe(),lim=cs123Lim();
  el.innerHTML=`<div class="cs123-edh"><button type="button" class="icbtn" data-cs123edx aria-label="Fechar">${ICON.close}</button><b>Nova coluna</b><button type="button" class="cs123-pvb" data-cs123prev>Prévia</button></div>
    <div class="cs123-eds">${rs.length?`<div class="cs123-rs"><b>Rascunhos</b>${rs.map(r=>`<span class="cs123-rc"><button type="button" data-cs123rabre="${esc(r.rid)}"><b>${esc(r.tit||"Sem título")}</b><small>${esc(quando(r.at))}</small></button><button type="button" class="cs123-rx" data-cs123rtira="${esc(r.rid)}" aria-label="Apagar o rascunho">${ICON.close}</button></span>`).join("")}</div>`:""}
      <div class="cs123-capaed">${E.capa?`<img src="${pubSrc(E.capa.url)}" alt=""><button type="button" class="cs123-capax" data-cs123capax>Tirar a foto</button>`:`<button type="button" class="cs123-capab" data-cs123capa>${cs123Svg(CS123_IC.foto)}<span>Foto de capa<small>opcional</small></span></button>`}</div>
      <label class="cs123-f"><textarea id="cs123-tit" class="cs123-tit" data-cs123f="tit" maxlength="90" rows="2" placeholder="Título da coluna" enterkeyhint="next">${esc(E.tit)}</textarea><small data-cs123n="tit"></small></label>
      <label class="cs123-f"><textarea id="cs123-linha" class="cs123-lin" data-cs123f="linha" maxlength="160" rows="2" placeholder="Linha fina: uma frase que resume e chama para a leitura" enterkeyhint="next">${esc(E.linha)}</textarea><small data-cs123n="linha"></small></label>
      <div class="cs123-bar" role="toolbar" aria-label="Formatação"><button type="button" data-cs123fmt="h">Intertítulo</button><button type="button" data-cs123fmt="q">Citação</button><button type="button" data-cs123fmt="b" aria-label="Negrito"><b>N</b></button><button type="button" data-cs123fmt="i" aria-label="Itálico"><i>I</i></button><button type="button" data-cs123fmt="a">Link</button></div>
      <textarea id="cs123-corpo" class="cs123-corpoed" data-cs123f="corpo" maxlength="${lim}" placeholder="Escreva a coluna. Cada parágrafo numa linha." aria-label="Texto da coluna">${esc(E.corpo)}</textarea>
      <p class="cs123-cont" data-cs123n="corpo"></p>
      <p class="cs123-dica">“## ” no começo da linha vira intertítulo e “> ” vira citação. **negrito**, *itálico* e [texto](https://link) também valem.</p>
      <label class="cs123-f cs123-fl"><span>Hashtags</span><input id="cs123-tags" data-cs123f="tags" maxlength="120" placeholder="#Economia #Previdência (opcional)" value="${esc(E.tags)}" autocomplete="off"></label>
      ${cs123PubOpc()}
      <p class="cs123-aviso">Aparece como “Coluna de ${esc(String(nomeDe(S.uid)).split(" ")[0])}”, separada das notícias da edição. ${E.pub==="seguidores"?"Quem segue você e seus amigos podem ler.":"Seus amigos no Prumo podem ler."} Discuta as ideias, com respeito às pessoas.</p></div>
    <div class="cs123-edf"><button type="button" class="btn ghost" data-cs123rasc>Salvar rascunho</button><button type="button" class="btn" data-cs123pub ${E.env?"disabled":""}>${E.env?"Publicando…":"Publicar"}</button></div>`;
  cs123Conta();el.querySelectorAll("textarea.cs123-tit,textarea.cs123-lin").forEach(cs123Cresce)}
function cs123Cresce(t){if(!t)return;t.style.height="auto";t.style.height=Math.min(170,t.scrollHeight+2)+"px"}
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.dataset||!t.dataset.cs123f||!CS123.ed||!t.closest("#layer .cs123-ed"))return;const k=t.dataset.cs123f;
  if((k==="tit"||k==="linha")&&/\n/.test(t.value))t.value=t.value.replace(/\n+/g," ");CS123.ed[k]=t.value;if(k!=="corpo")cs123Cresce(t);cs123Conta();clearTimeout(cs123EdDesenha.t);cs123EdDesenha.t=setTimeout(()=>cs123RascGuarda(false),700)},true);
document.addEventListener("keydown",e=>{const t=e.target;if(e.key==="Enter"&&t&&(t.id==="cs123-tit"||t.id==="cs123-linha")){e.preventDefault();$(t.id==="cs123-tit"?"#cs123-linha":"#cs123-corpo")?.focus()}});
/* formatação: põe a marcação no começo da linha ou em volta do trecho escolhido */
function cs123Fmt(k){const ta=$("#cs123-corpo"),E=CS123.ed;if(!ta||!E)return;const v=ta.value,a=ta.selectionStart,z=ta.selectionEnd,sel=v.slice(a,z);let nv,ca,cz;
  if(k==="h"||k==="q"){const ini=v.lastIndexOf("\n",a-1)+1,pre=k==="h"?"## ":"> ",lin=v.slice(ini),ja=lin.indexOf(pre)===0;nv=ja?v.slice(0,ini)+lin.slice(3-(k==="q"?1:0)):v.slice(0,ini)+pre+lin;const d=ja?-(pre.length):pre.length;ca=a+d;cz=z+d}
  else if(k==="b"||k==="i"){const m=k==="b"?"**":"*",tx=sel||(k==="b"?"negrito":"itálico");nv=v.slice(0,a)+m+tx+m+v.slice(z);ca=a+m.length;cz=ca+tx.length}
  else{const tx=sel||"texto do link",ins=`[${tx}](https://)`;nv=v.slice(0,a)+ins+v.slice(z);ca=a+tx.length+3;cz=ca+8}
  if(nv.length>cs123Lim()){toast(`A coluna pode ter até ${cs123Num(cs123Lim())} caracteres.`);return}
  ta.value=nv;E.corpo=nv;try{ta.focus();ta.setSelectionRange(ca,cz)}catch(e){}cs123Conta();cs123RascGuarda(false)}
/* capa */
function cs123Capa(){const ed=$("#layer .cs123-ed");if(!ed)return;$("#cs123-file")?.remove();const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.id="cs123-file";inp.hidden=true;ed.appendChild(inp);
  inp.addEventListener("change",async()=>{const f=inp.files&&inp.files[0];inp.remove();if(!f||!CS123.ed)return;const E=CS123.ed;
    try{const b=await pubComprime(f,1600);if(CS123.ed!==E)return;E.capa={blob:b,url:URL.createObjectURL(b)};cs123EdDesenha();cs123RascGuarda(false)}catch(e){toast("Não deu para abrir essa foto.")}});
  try{inp.click()}catch(e){}}
/* rascunhos: ficam no aparelho (até 10), com a foto de capa se ela for pequena */
const cs123RK=()=>"prumo-cs123-rasc:"+S.uid;
function cs123RascLe(){try{const l=JSON.parse(localStorage.getItem(cs123RK())||"[]");return Array.isArray(l)?l.filter(r=>r&&r.rid).sort((a,b)=>(b.at||0)-(a.at||0)):[]}catch(e){return []}}
function cs123RascGrava(l){try{localStorage.setItem(cs123RK(),JSON.stringify(l.slice(0,10)))}catch(e){try{localStorage.setItem(cs123RK(),JSON.stringify(l.slice(0,10).map(r=>({...r,capa:null}))))}catch(_){}}}
function cs123RascGuarda(aviso){const E=CS123.ed;if(!E)return;const tem=!!(E.tit.trim()||E.linha.trim()||E.corpo.trim());let l=cs123RascLe().filter(r=>r.rid!==E.rid);
  if(tem){l.unshift({rid:E.rid,tit:E.tit,linha:E.linha,corpo:E.corpo,tags:E.tags,pub:E.pub,capa:E.capa&&E.capa.du||null,at:Date.now()});
    if(E.capa&&E.capa.blob&&!E.capa.du&&!E.capa.lendo&&E.capa.blob.size<260e3){E.capa.lendo=1;const fr=new FileReader();fr.onload=()=>{if(E.capa){E.capa.du=String(fr.result);if(CS123.ed===E)cs123RascGuarda(false);else{const m=cs123RascLe();const r=m.find(x=>x.rid===E.rid);if(r){r.capa=E.capa.du;cs123RascGrava(m)}}}};fr.readAsDataURL(E.capa.blob)}}
  cs123RascGrava(l);if(aviso&&tem)setTimeout(()=>toast("Rascunho da coluna guardado"),60)}
function cs123RascTira(rid){cs123RascGrava(cs123RascLe().filter(r=>r.rid!==rid))}
/* prévia e publicação */
function cs123Valida(E){if(!E.tit.trim())return "Dê um título à coluna.";const n=E.corpo.trim().length;if(n<40)return "Escreva o texto da coluna antes de publicar.";
  if(E.corpo.length>cs123Lim())return V9.on?"A coluna pode ter até 40.000 caracteres. Encurte um pouco o texto.":"Por enquanto, a coluna pode ter até 6.000 caracteres. Encurte um pouco o texto.";return ""}
function cs123Previa(){const E=CS123.ed;if(!E)return;if(!E.tit.trim()&&!E.corpo.trim()){toast("Escreva a coluna para ver a prévia.");return}
  const x={id:"previa",autor:S.uid,at:Date.now(),fotos:[],estilo:{alt:[]},texto:""},c={tit:E.tit.trim()||"Sem título",linha:E.linha.trim(),corpo:E.corpo};
  $("#layer .cs123-prev")?.remove();$("#layer").insertAdjacentHTML("beforeend",cs123LerHTML(x,c,{prev:true,capa:E.capa&&E.capa.url,tags:E.tags}));cs123Progresso($("#layer .cs123-prev"))}
async function cs123Publicar(){const E=CS123.ed;if(!E||E.env||!SB)return;const er=cs123Valida(E);if(er){toast(er);return}
  const tags=cs123Tags(E.tags),tit=E.tit.trim().slice(0,90),linha=E.linha.trim().slice(0,160),corpo=E.corpo.replace(/\r/g,"").trim();
  const col={v:1,tit,linha,min:cs123Min(corpo)};if(!V9.on)col.corpo=corpo;const estilo={v:2,coluna:col};
  if(!V9.on){let n=0;try{n=new TextEncoder().encode(JSON.stringify(estilo)).length}catch(e){n=JSON.stringify(estilo).length*2}if(n>7600){toast("Por enquanto, a coluna precisa ser um pouco menor (o limite é de cerca de 6.000 caracteres). Encurte o texto.");return}}
  E.env=true;$("#layer .cs123-prev")?.remove();cs123EdDesenha();let foto=null;
  try{if(E.capa){const b=E.capa.blob||await (await fetch(E.capa.url)).blob();foto=await pubSobe(b);PUB.urls[foto]={u:E.capa.url,exp:Date.now()+3600e3}}
    const row={autor:S.uid,tipo:"post",texto:(tit+(linha?"\n\n"+linha:"")+(tags.length?"\n\n"+tags.join(" "):"")).slice(0,2200),fotos:foto?[foto]:[],estilo,publico:V9.on&&CS123.aberto&&E.pub==="seguidores"?"seguidores":"amigos"};
    if(V9.on)row.corpo=corpo;
    const r=await SB.from("publicacoes").insert(row).select("id");if(r.error)throw r.error;const id=r.data&&r.data[0]&&r.data[0].id;
    if(id&&!pubDe(id)){const z={...row,id,at:Date.now()};try{pubLimpa(z)}catch(e){}PUB.itens.unshift(z)}
    cs123RascTira(E.rid);CS123.ed=null;if($("#layer > .cs123-ed")){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}
    toast("Coluna publicada");vibrar&&vibrar(10);uso("coluna_publicada");try{pubRedesenha()}catch(e){}setTimeout(()=>{try{pubCarregar()}catch(e){}},400)}
  catch(e){if(foto)try{await SB.storage.from("fotos").remove([foto])}catch(_){}E.env=false;if(CS123.ed===E)cs123EdDesenha();const m=String((e&&(e.code||""))+" "+(e&&e.message||""));
    toast(/estilo|corpo|tamanho|23514|22023|check/i.test(m)?"A coluna passou do limite de tamanho do servidor. Encurte o texto e tente de novo.":"Não deu para publicar agora. O texto continua aqui.")}}
/* cliques do editor */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest||!CS123.ed||t.closest("#layer2"))return;if(!t.closest("#layer .cs123-ed,#layer .cs123-prev"))return;let b;
  const pare=()=>{e.stopPropagation();e.preventDefault()};const E=CS123.ed;
  if(t.closest("[data-cs123pub]")){pare();cs123Publicar();return}
  if(E.env&&t.closest("button")){pare();return}
  if(t.closest("[data-cs123edx]")){pare();history.back();return}
  if(t.closest("[data-cs123prev]")){pare();cs123Previa();return}
  if(t.closest("[data-cs123prevx]")){pare();$("#layer .cs123-prev")?.remove();return}
  if(t.closest("[data-cs123rasc]")){pare();cs123RascGuarda(false);toast(E.tit.trim()||E.corpo.trim()?"Rascunho guardado neste aparelho":"Escreva algo antes de guardar.");return}
  if(t.closest("[data-cs123capa]")){pare();cs123Capa();return}
  if(t.closest("[data-cs123capax]")){pare();E.capa=null;cs123EdDesenha();cs123RascGuarda(false);return}
  if(b=t.closest("[data-cs123fmt]")){pare();cs123Fmt(b.dataset.cs123fmt);return}
  if(b=t.closest("[data-cs123pubv]")){pare();E.pub=b.dataset.cs123pubv==="seguidores"?"seguidores":"amigos";cs123EdDesenha();return}
  if(b=t.closest("[data-cs123rabre]")){pare();const r=cs123RascLe().find(x=>x.rid===b.dataset.cs123rabre);if(!r)return;CS123.ed=cs123EdNovo({...r,capa:r.capa?{url:r.capa,du:r.capa}:null,deRasc:true});cs123EdDesenha();return}
  if(b=t.closest("[data-cs123rtira]")){pare();cs123RascTira(b.dataset.cs123rtira);cs123EdDesenha();return}},true);

/* ===== 6. seguir: perfil, números e listas ===== */
const cs123Prim=u=>String(nomeDe(u)||"").split(" ")[0];
function cs123SegBt(u){const sigo=CS123.sigo.has(u);return `<button type="button" class="btn${sigo?" ghost":""} cs123-sg" data-cs123seg="${esc(u)}" aria-pressed="${sigo}">${sigo?"Seguindo":"Seguir"}</button>`}
/* o botão: no perfil aberto de quem não é amigo */
{const _pc=pfCab;pfCab=function(u){let h=_pc.apply(this,arguments);try{if(!V9.on||!u||u===S.uid||S.amigos.has(u)||(S.bloq||[]).includes(u))return h;const p=CS123.perf[u];
  if(!p){cs123Perf(u).then(()=>{if(PFV&&PFV.u===u&&$("#layer .pfv")&&PFV.modo==="grade")pfvDesenha()});return h}
  if(!p.ok||!p.aberto)return h;const bt=cs123SegBt(u);
  if(/<div class="pf-bts">/.test(h))h=h.replace(/<div class="pf-bts">/,`<div class="pf-bts">${bt}`);else h+=`<div class="pf-bts">${bt}</div>`}catch(e){}return h}}
/* os números (seguidores · seguindo), depois do perfil montado (no visual novo e no de hoje) */
function cs123NumHTML(u,p){return `<span class="cs123-num"><button type="button" data-cs123lista="seguidores" data-u="${esc(u)}"><b>${cs123Num(p.seguidores||0)}</b> ${p.seguidores===1?"seguidor":"seguidores"}</button><button type="button" data-cs123lista="seguindo" data-u="${esc(u)}"><b>${cs123Num(p.seguindo||0)}</b> seguindo</button></span>`}
function cs123PoeNum(root,u){if(!root||!V9.on||!u||root.querySelector(".cs123-num"))return;const p=CS123.perf[u];
  if(!p){cs123Perf(u).then(()=>{if(u===S.uid){if(VIEW==="me")renderMe()}else if(PFV&&PFV.u===u&&$("#layer .pfv")&&PFV.modo==="grade")pfvDesenha()});return}
  if(!p.ok||(u!==S.uid&&!p.aberto)||(u===S.uid&&!p.aberto&&!p.seguidores&&!p.seguindo))return;
  const vn=root.querySelector(".vn-pf-num");if(vn){vn.insertAdjacentHTML("beforeend",cs123NumHTML(u,p));return}
  const nm=root.querySelector(".pf-nome");if(nm)nm.insertAdjacentHTML("afterend",`<p class="cs123-numl">${cs123NumHTML(u,p)}</p>`)}
{const _pv=pfvDesenha;pfvDesenha=function(){const r=_pv.apply(this,arguments);try{if(PFV&&PFV.modo==="grade"){const sc=$("#layer .pfv .pfv-sc");cs123PoeNum(sc,PFV.u);
  const p=CS123.perf[PFV.u];if(sc&&p&&p.ok&&p.aberto&&!S.amigos.has(PFV.u)&&!sc.querySelector(".cs123-ab")){const cab=sc.querySelector(".vn-pf-desde,.cs123-numl,.vn-pf-num");if(cab)cab.insertAdjacentHTML("afterend",`<p class="cs123-ab">${cs123Svg(CS123_IC.seg)}Perfil aberto${p.me_segue?" · segue você":""}</p>`)}}}catch(e){}return r}}
{const _rm=renderMe;renderMe=function(){const r=_rm.apply(this,arguments);try{if(V9.on&&S.uid&&S.membro){const m=$("#v-me .pf-me");if(m&&PF_ABA!=="conta")cs123PoeNum(m,S.uid);if(PF_ABA==="conta")cs123Conta9()}}catch(e){}return r}}
/* perfil aberto sem nada para mostrar: o que fazer, no lugar de "Perfil só para amigos" */
{const _pt=pfTiles;pfTiles=function(l,aba,u){try{const p=u&&CS123.perf[u];if(V9.on&&u&&u!==S.uid&&!S.amigos.has(u)&&p&&p.ok&&p.aberto&&!(l||[]).length&&aba!=="marc")
  return `<div class="pf-vz"><b>${CS123.sigo.has(u)?"Nada para seguidores ainda":"Perfil aberto"}</b><span>${CS123.sigo.has(u)?`Quando ${esc(cs123Prim(u))} publicar para seguidores, aparece aqui e no seu Feed.`:`Siga ${esc(cs123Prim(u))} para ver aqui e no seu Feed o que ${esc(cs123Prim(u))} publica para seguidores.`}</span></div>`}catch(e){}return _pt.apply(this,arguments)}}
async function cs123Seguir(u,b){if(precisaConta()||!V9.on||!u)return;
  if(CS123.sigo.has(u)){sheet("Seguindo "+nomeDe(u),`<div class="opt"><button type="button" data-cs123deixa="${esc(u)}">Deixar de seguir<span>o que ${esc(cs123Prim(u))} publica para seguidores sai do seu Feed</span></button></div>`);return}
  if(b){b.disabled=true;b.textContent="Seguindo…"}
  try{const r=await SB.rpc("seguir",{p_uid:u});if(r&&r.error)throw r.error;CS123.sigo.add(u);const p=CS123.perf[u];if(p&&r.data!=="ja"){p.sigo=true;p.seguidores=(p.seguidores||0)+1}
    toast("Você está seguindo "+nomeDe(u));vibrar&&vibrar(8);uso("seguir");cs123Redesenha(u);PUB.sig="";PF_T[u]=0;await pubCarregar();await pfCarregar(u);cs123Redesenha(u);cs123Carregar()}
  catch(e){const m=String((e&&(e.code||""))+" "+(e&&e.message||""));toast(/54000|demais/.test(m)?"Você seguiu muita gente hoje. Tente amanhã.":/42501|fechado/.test(m)?nomeDe(u)+" fechou o perfil.":"Não deu para seguir agora.");delete CS123.perf[u];cs123Redesenha(u)}}
async function cs123Deixa(u){try{const r=await SB.rpc("deixar_de_seguir",{p_uid:u});if(r&&r.error)throw r.error;CS123.sigo.delete(u);const p=CS123.perf[u];if(p&&p.sigo){p.sigo=false;p.seguidores=Math.max(0,(p.seguidores||1)-1)}
  toast("Você deixou de seguir "+nomeDe(u));PUB.itens=PUB.itens.filter(x=>!(x.autor===u&&x.publico==="seguidores"&&!S.amigos.has(u)));pubRedesenha();cs123Redesenha(u);cs123Carregar()}catch(e){toast("Não deu para deixar de seguir agora.")}}
async function cs123Tira(u,b){if(b){b.disabled=true}try{const r=await SB.rpc("tirar_seguidor",{p_uid:u});if(r&&r.error)throw r.error;CS123.segs=CS123.segs.filter(s=>s.uid!==u);const p=CS123.perf[S.uid];if(p)p.seguidores=Math.max(0,(p.seguidores||1)-1);
  const li=b&&b.closest("li");if(li)li.remove();toast(nomeDe(u)+" não segue mais você");if(VIEW==="me")renderMe()}catch(e){if(b)b.disabled=false;toast("Não deu para tirar agora.")}}
function cs123Redesenha(u){try{if(PFV&&PFV.u===u&&$("#layer .pfv")&&PFV.modo==="grade")pfvDesenha();if(VIEW==="me")renderMe();document.querySelectorAll(`[data-cs123seg="${CSS.escape(u)}"]`).forEach(b=>{if(!b.closest(".pf-bts"))b.outerHTML=cs123SegBt(u)})}catch(e){}}
function cs123Linha(x,meu,tipo){const u=x.uid,eu=u===S.uid,am=S.amigos.has(u);
  return `<li><button type="button" class="amg-r cs123-lr" data-cs123perfil="${esc(u)}">${avatar(u)}<span class="amg-n"><b>${esc(eu?"Você":nomeDe(u))}</b><span>${am?"amigo":x.aberto?"perfil aberto":""}</span></span></button>${meu&&tipo==="seguidores"?`<button type="button" class="btn ghost amg-b" data-cs123tira="${esc(u)}">Remover</button>`:!eu&&!am&&x.aberto?cs123SegBt(u):""}</li>`}
async function cs123Lista(u,tipo){if(!V9.on||!u)return;const meu=u===S.uid,tit=tipo==="seguindo"?(meu?"Quem você segue":cs123Prim(u)+" segue"):(meu?"Seus seguidores":"Seguidores de "+cs123Prim(u));
  sheet(tit,`<div id="cs123-lb"><p class="hint">Carregando…</p></div>`);
  try{const r=await SB.rpc("seg_lista",{p_uid:u,p_tipo:tipo==="seguindo"?"seguindo":"seguidores"});if(r&&r.error)throw r.error;const l=(r.data||[]);l.forEach(cs123Pess);cs123Nomes();
    const box=$("#cs123-lb");if(!box)return;const p=CS123.perf[u];const n=p&&(tipo==="seguindo"?p.seguindo:p.seguidores)||l.length;
    box.innerHTML=l.length?`<ul class="amgl cs123-l">${l.map(x=>cs123Linha(x,meu,tipo)).join("")}</ul>${n>l.length?`<p class="hint">${n-l.length===1?"Mais 1 pessoa que você não vê no Prumo.":`Mais ${n-l.length} pessoas que você não vê no Prumo.`}</p>`:""}`
      :`<div class="empty" style="padding:14px 0"><b>${tipo==="seguindo"?(meu?"Você ainda não segue ninguém":"Ninguém por aqui"):(meu?"Ninguém segue você ainda":"Ninguém que você vê")}</b>${meu&&tipo==="seguidores"&&!CS123.aberto?`Ligue “Perfil aberto” em Perfil › Conta para que outras pessoas possam seguir você.`:""}</div>`}
  catch(e){const box=$("#cs123-lb");if(box)box.innerHTML=`<p class="erro-t">Não deu para carregar agora.</p>`}}
/* descobrir perfis abertos (Perfil › Conta e Busca) */
async function cs123Abertos(q){try{const r=await SB.rpc("perfis_abertos",{p_busca:String(q||"").trim().slice(0,40)});if(r&&r.error)return null;const l=r.data||[];
  l.forEach(x=>{cs123Pess({...x,aberto:true});if(x.sigo)CS123.sigo.add(x.uid)});cs123Nomes();return l}catch(e){return null}}
const cs123LinhaAb=x=>cs123Linha({...x,aberto:true},false,"");
function cs123Descobre(){if(precisaConta()||!V9.on)return;sheet("Perfis abertos",`<p class="hint" style="margin:0 0 8px">Pessoas do Prumo que deixam qualquer membro seguir. Você vê o que elas publicam para seguidores.</p><input class="field" id="cs123-dq" type="search" autocomplete="off" enterkeyhint="search" placeholder="Buscar pelo nome" aria-label="Buscar pelo nome"><div id="cs123-db"><p class="hint">Carregando…</p></div>`);
  const roda=async()=>{const q=($("#cs123-dq")||{}).value||"";const l=await cs123Abertos(q);const box=$("#cs123-db");if(!box||(($("#cs123-dq")||{}).value||"")!==q)return;
    box.innerHTML=l==null?`<p class="erro-t">Não deu para carregar agora.</p>`:l.length?`<ul class="amgl cs123-l">${l.map(cs123LinhaAb).join("")}</ul>`:`<div class="empty" style="padding:14px 0"><b>${q.trim()?"Ninguém com esse nome":"Nenhum perfil aberto ainda"}</b></div>`};
  $("#cs123-dq")?.addEventListener("input",()=>{clearTimeout(cs123Descobre.t);cs123Descobre.t=setTimeout(roda,300)});roda()}
/* Busca: perfis abertos com o nome digitado, antes das notícias */
document.addEventListener("input",e=>{const t=e.target;if(!t||t.id!=="btext"||!V9.on||!S.uid||!S.membro)return;const q=t.value.trim();cs123BusPoe();clearTimeout(cs123BusPoe.t);
  if(q.length<2)return;cs123BusPoe.t=setTimeout(async()=>{const l=await cs123Abertos(q);if(l&&($("#btext")||{}).value.trim()===q){CS123.bus={q,l};cs123BusPoe()}},300)});
function cs123BusPoe(){const out=$("#sres"),q=(($("#btext")||{}).value||"").trim();if(!out)return;out.querySelector(".cs123-bus")?.remove();const B=CS123.bus;if(!B.l||B.q!==q||!B.l.length||q.length<2)return;
  out.insertAdjacentHTML("afterbegin",`<li class="cs123-bus"><b class="cs123-bh">Perfis abertos</b><ul class="amgl cs123-l">${B.l.slice(0,5).map(cs123LinhaAb).join("")}</ul></li>`)}
/* Perfil › Conta: "Perfil aberto" */
function cs123Conta9(){const m=$("#v-me .pf-conta .card.menu")||$("#v-me .card.menu");if(!m||$("#v-me .cs123-cfg"))return;const on=CS123.aberto,p=CS123.perf[S.uid]||{};
  m.insertAdjacentHTML("beforebegin",`<div class="card cs123-cfg"><label class="cs123-sw"><span><b>Perfil aberto</b><small>Quem não é seu amigo pode seguir e ver o que você publicar para seguidores.</small></span><input type="checkbox" role="switch" data-cs123aberto ${on?"checked":""} aria-label="Perfil aberto"></label>
    ${on?`<p class="hint cs123-cfgh">Para chegar aos seguidores, escolha “Seguidores e amigos” ao publicar. O resto (stories, Melhores amigos, posts para amigos) continua só com os amigos.</p>`:""}
    <div class="cs123-cfgb"><button type="button" data-cs123lista="seguidores" data-u="${esc(S.uid)}"><b>${cs123Num(p.seguidores||0)}</b> ${p.seguidores===1?"seguidor":"seguidores"}</button><button type="button" data-cs123lista="seguindo" data-u="${esc(S.uid)}"><b>${cs123Num(p.seguindo||0)}</b> seguindo</button><button type="button" data-cs123descobre>Descobrir perfis abertos <i aria-hidden="true">›</i></button></div></div>`)}
async function cs123MudaAberto(on,inp){if(inp)inp.disabled=true;try{const r=await SB.rpc("mudar_perfil_aberto",{p_aberto:!!on});if(r&&r.error)throw r.error;CS123.aberto=!!on;const p=CS123.perf[S.uid];if(p)p.aberto=!!on;
  toast(on?"Perfil aberto: quem não é seu amigo pode seguir você":"Perfil fechado: só os amigos veem o que você publica");if(VIEW==="me")renderMe()}catch(e){if(inp){inp.disabled=false;inp.checked=!on}toast("Não deu para mudar agora.")}}
document.addEventListener("change",e=>{const t=e.target;if(t&&t.matches&&t.matches("[data-cs123aberto]"))cs123MudaAberto(t.checked,t)});
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(b=t.closest("[data-cs123seg]")){pare();cs123Seguir(b.dataset.cs123seg,b);return}
  if(b=t.closest("[data-cs123deixa]")){pare();const u=b.dataset.cs123deixa;closeLayer();cs123Deixa(u);return}
  if(b=t.closest("[data-cs123tira]")){pare();cs123Tira(b.dataset.cs123tira,b);return}
  if(b=t.closest("[data-cs123lista]")){pare();cs123Lista(b.dataset.u,b.dataset.cs123lista);return}
  if(t.closest("[data-cs123descobre]")){pare();cs123Descobre();return}},true);
/* bloquear: some do seguir na hora (o banco já desfez) */
{const _bl=typeof bloquear==="function"?bloquear:null;if(_bl)bloquear=async function(u){const r=await _bl.apply(this,arguments);try{CS123.sigo.delete(u);CS123.segs=CS123.segs.filter(s=>s.uid!==u);delete CS123.perf[u];setTimeout(cs123Carregar,400)}catch(e){}return r}}

/* ===== 7. público "Seguidores e amigos" no post ===== */
const cs123PodeSeg=()=>!!(V9.on&&CS123.aberto);
{const _cp=cfpPublico;cfpPublico=function(){const r=_cp.apply(this,arguments);try{if(!cs123PodeSeg()||!ED||!ED.po)return r;const P=ED.po,box=$("#layer .ce-sel .cfp-pubs");if(!box||box.querySelector('[data-cfppubv="seguidores"]'))return r;
  const am=box.querySelector('[data-cfppubv="amigos"]');if(am)am.insertAdjacentHTML("afterend",`<button type="button" data-cfppubv="seguidores" aria-pressed="false"><span>Seguidores e amigos</span><small>Quem segue você e seus amigos</small></button>`);
  box.querySelectorAll("[data-cfppubv]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.cfppubv===(P.pub==="proximos"||P.pub==="seguidores"?P.pub:"amigos"))))}catch(e){}return r}}
{const _cd=cfpDet;cfpDet=function(el){const P=ED&&ED.po;if(P&&P.pub==="seguidores"&&!cs123PodeSeg())P.pub="amigos";const r=_cd.apply(this,arguments);
  try{if(P&&P.pub==="seguidores"){const em=el.querySelector("[data-cfppub] em");if(em)em.textContent="Seguidores e amigos";const q=el.querySelector(".cr-quem");if(q&&q.firstChild&&q.firstChild.nodeType===3)q.firstChild.textContent="Quem segue você e seus amigos vão ver. "}}catch(e){}return r}}
{const _ep=edPublicaPost;edPublicaPost=async function(){const P=ED&&ED.po;if(!P||P.pub!=="seguidores"||!cs123PodeSeg()||!SB||ED.env)return _ep.apply(this,arguments);const _from=SB.from;
  SB.from=function(t){const q=_from.apply(this,arguments);if(t==="publicacoes"&&q&&typeof q.insert==="function"&&!q._cs123){q._cs123=1;const ins=q.insert;q.insert=function(row){try{if(row&&row.tipo==="post")row.publico="seguidores"}catch(e){}return ins.apply(this,arguments)}}return q};
  try{return await _ep.apply(this,arguments)}finally{SB.from=_from}}}

/* ===== 8. Atividade: "Bia começou a seguir você" ===== */
{const _ai=atItens;atItens=function(){const it=_ai.apply(this,arguments);if(!V9.on||!S.uid||!S.membro||!CS123.segs.length||!Array.isArray(it))return it;
  try{const lim=Date.now()-30*864e5;CS123.segs.filter(s=>s.at>lim&&s.uid!==S.uid).forEach(s=>it.push({k:"sg:"+s.uid,at:s.at,us:[s.uid],ic:"+",txt:`<b>${esc(nomeDe(s.uid))}</b> começou a seguir você`,u:s.uid,acao:"perfil"}))}catch(e){}
  return it.sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}}
try{ESP_NOMES.seguidores="Quem segue quem"}catch(e){}
