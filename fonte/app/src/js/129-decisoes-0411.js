/* ---------- 129: decisões do Pedro (04/11) ----------
   1. Fechar o perfil não apaga seguidores (já era assim: só esconde a lista de quem não é amigo).
   2. A lista de seguidores (e a de quem a pessoa segue) fica visível para os outros membros: no perfil aberto, para qualquer
      membro; no perfil fechado, para os amigos. Números e lista vêm das funções seguidores_contagem/seguidores_lista
      (sql/publicacoes-v11.sql), que tiram quem bloqueou ou foi bloqueado e as contas suspensas ou excluídas.
   3. Repost de NOTÍCIA sem comentário se junta como os posts (122): a notícia aparece uma vez, com a linha "Bia repostou",
      "Bia e Carla repostaram" ou "Você e Bia repostaram" em cima. A citação (com comentário) continua à parte.
   4. Atividade: reposts e citações dos seus posts feitos por quem só segue você (a regra de leitura escondia esses reposts)
      vêm da função reposts_dos_meus_posts (v11) e se juntam aos que o app já via, sem repetir.
   Sem a v11 no banco, 2 e 4 ficam como antes (a função ausente é detectada e o app usa o caminho antigo).
   Nomes globais com o prefixo dz129. */
var DZ129={v11:null,uid:null,rps:[],rt:0,carregando:false};
function dz129Falta(e){return /does not exist|PGRST202|42883|Could not find the function|schema cache/i.test(String(e&&e.message||"")+" "+String(e&&e.code||""))}
/* chama uma função da v11; null = não deu (sem a v11, sem rede ou erro), e o chamador usa o caminho antigo */
async function dz129Rpc(nome,args){if(DZ129.v11===false||typeof SB==="undefined"||!SB||!S.uid)return null;
  try{const r=await SB.rpc(nome,args);if(r&&r.error){if(dz129Falta(r.error))DZ129.v11=false;return null}DZ129.v11=true;return r}catch(e){return null}}
setInterval(()=>{if(S.uid!==DZ129.uid){DZ129.uid=S.uid;DZ129.rps=[];DZ129.rt=0}},2500);

/* ===== 2. listas de seguir visíveis ===== */
if(typeof cs123Perf==="function"){const _pf=cs123Perf;cs123Perf=async function(u,forca){
  if(typeof V9==="undefined"||!V9.on||!u||u===S.uid||DZ129.v11===false)return _pf.apply(this,arguments);
  const p=CS123.perf[u];if(p&&!forca&&Date.now()-p.t<60e3)return p;
  const r=await dz129Rpc("seguidores_contagem",{p_uid:u});const d=r&&r.data;
  if(d&&d.ok){CS123.perf[u]={...d,t:Date.now()};if(d.sigo)CS123.sigo.add(u);else CS123.sigo.delete(u);return CS123.perf[u]}
  return _pf.apply(this,arguments)}}
/* números no perfil de um amigo com o perfil fechado (o 123 só punha no perfil aberto) */
if(typeof cs123PoeNum==="function"){const _pn=cs123PoeNum;cs123PoeNum=function(root,u){const r=_pn.apply(this,arguments);
  try{if(!root||!u||u===S.uid||root.querySelector(".cs123-num"))return r;const p=CS123.perf[u];if(!p||!p.ok||!p.lista)return r;
    const vn=root.querySelector(".vn-pf-num");if(vn){vn.insertAdjacentHTML("beforeend",cs123NumHTML(u,p));return r}
    const nm=root.querySelector(".pf-nome");if(nm)nm.insertAdjacentHTML("afterend",`<p class="cs123-numl">${cs123NumHTML(u,p)}</p>`)}catch(e){}return r}}
function dz129Linha(x,tipo){try{cs123Pess({uid:x.uid,nome:x.nome,foto:x.foto,aberto:x.aberto})}catch(e){}return cs123Linha({uid:x.uid,aberto:!!x.aberto},false,tipo)}
if(typeof cs123Lista==="function"){const _cl=cs123Lista;cs123Lista=async function(u,tipo){
  if(typeof V9==="undefined"||!V9.on||!u||u===S.uid||DZ129.v11===false)return _cl.apply(this,arguments);
  const tp=tipo==="seguindo"?"seguindo":"seguidores";
  const r=await dz129Rpc("seguidores_lista",{p_uid:u,p_tipo:tp});if(!r)return _cl.apply(this,arguments);
  const l=(r.data||[]).filter(x=>x&&x.uid);let h="";
  try{l.forEach(x=>cs123Pess({uid:x.uid,nome:x.nome,foto:x.foto,aberto:x.aberto}));cs123Nomes()}catch(e){}
  h=l.length?`<ul class="amgl cs123-l dz129-l">${l.map(x=>dz129Linha(x,tp)).join("")}</ul>`
    :`<div class="empty" style="padding:14px 0"><b>${tp==="seguindo"?`${esc(cs123Prim(u))} ainda não segue ninguém`:`Ninguém segue ${esc(cs123Prim(u))} ainda`}</b></div>`;
  sheet(tp==="seguindo"?cs123Prim(u)+" segue":"Seguidores de "+cs123Prim(u),`<div id="cs123-lb">${h}</div>`)}}

/* ===== 3. repost de notícia sem comentário: a notícia uma vez, com "Bia repostou" ===== */
function dz129Simples(x){const r=x&&typeof vn112Rp==="function"?vn112Rp(x):null;return r&&r.k==="pauta"&&!String(x.texto||"").trim()?r:null}
function dz129Feed(out){if(!Array.isArray(out)||!out.length)return out;const gr=new Map(),pos=new Map();
  out.forEach((p,i)=>{if(!p)return;if(p.__pub){const r=dz129Simples(p.__pub);if(r){if(!gr.has(r.id))gr.set(r.id,[]);gr.get(r.id).push(i)}return}
    if(p.id!=null&&!p.__fc107&&!pos.has(p.id)&&typeof pautaById==="function"&&pautaById(p.id))pos.set(p.id,i)});
  if(!gr.size)return out;const tira=new Set(),troca=new Map();
  gr.forEach((is,id)=>{const rps=is.map(i=>out[i].__pub).sort((a,b)=>b.at-a.at),us=[...new Set(rps.map(y=>y.autor))],io=pos.get(id);
    if(io==null){/* a notícia não está nesta lista (saiu da edição ou está noutro filtro): fica o repost mais recente, com a linha se houver mais de um */
      const i0=is.find(i=>out[i].__pub===rps[0]);is.forEach(i=>{if(i!==i0)tira.add(i)});if(us.length>1)troca.set(i0,{...out[i0],__dc122:{us}});return}
    /* a notícia uma vez: onde está o repost mais recente; se ela tem "O que seus amigos acham" logo abaixo, fica no lugar dela */
    const junto=!!(out[io+1]&&out[io+1].__fc107),alvo=junto?io:Math.min(io,...is);
    is.concat(io).forEach(i=>{if(i!==alvo)tira.add(i)});troca.set(alvo,{...out[io],__dc122:{us},__dz129:1})});
  const res=[];out.forEach((p,i)=>{if(troca.has(i))res.push(troca.get(i));else if(!tira.has(i))res.push(p)});return res}
if(typeof pubMistura==="function"){const _pm=pubMistura;pubMistura=function(lista){const out=_pm.apply(this,arguments);try{return dz129Feed(out)}catch(e){console.error(e);return out}}}
{const _ps=postSeguro;postSeguro=function(p){const h=_ps.apply(this,arguments);try{if(p&&p.__dz129&&typeof h==="string"&&h){const a=vn112Tp(h);if(a&&!a.classList.contains("dz129-nt")){a.classList.add("dz129-nt");return a.outerHTML}}}catch(e){}return h}}

/* ===== 4. Atividade: reposts de quem só segue você ===== */
async function dz129AtCarrega(){if(DZ129.v11===false||DZ129.carregando||typeof SB==="undefined"||!SB||!S.uid||!S.membro)return;DZ129.carregando=true;const eu=S.uid;
  try{const r=await dz129Rpc("reposts_dos_meus_posts",{p_desde:Date.now()-30*864e5});if(!r||S.uid!==eu)return;
    DZ129.rps=(r.data||[]).filter(x=>x&&x.id&&x.autor&&x.orig);DZ129.rt=Date.now();
    try{DZ129.rps.forEach(x=>{if(!S.membros[x.autor]&&!CS123.pess[x.autor])cs123Pess({uid:x.autor,nome:x.nome,foto:x.foto,aberto:false})});cs123Nomes()}catch(e){}
    atDot();atRedesenha()}catch(e){}finally{DZ129.carregando=false}}
{const _ac=atCarregar;atCarregar=async function(){let r;try{r=await _ac.apply(this,arguments)}finally{try{await dz129AtCarrega()}catch(e){}}return r}}
function dz129AtRp(){const out=[];if(!DZ129.v11||!DZ129.rps.length||!S.uid)return out;const ag=Date.now(),bl=S.bloq||[];
  DZ129.rps.forEach(r=>{const at=+r.at||0;if(!at||ag-at>30*864e5||bl.includes(r.autor))return;const nm=r.nome||nomeDe(r.autor),tr=String(r.trecho||"").trim();
    const abre=r.visivel&&(pubVisiveis().some(y=>y.id===r.id)||(typeof VN112_Q!=="undefined"&&VN112_Q.get(r.id)))?r.id:r.orig;
    out.push({k:"vn112:"+r.id,at,us:[r.autor],ic:"↻",txt:r.citacao&&!tr?`<b>${esc(nm)}</b> citou sua publicação`:`<b>${esc(nm)}</b> repostou sua publicação${tr?`: “${esc(vn112Curto(tr,80))}”`:""}`,pub:r.orig,acao:"vnrp",vnrp:abre,dz129:1})});return out}
{const _ai=atItens;atItens=function(){const it=_ai.apply(this,arguments);try{if(!Array.isArray(it))return it;const n=dz129AtRp();if(!n.length)return it;const ja=new Set(it.map(x=>x.k));
  const mais=n.filter(x=>!ja.has(x.k));if(!mais.length)return it;return it.concat(mais).sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}catch(e){return it}}}
/* para o número e a bolinha: busca de vez em quando, como o resto da Atividade */
setInterval(()=>{if(DZ129.v11!==false&&S.uid&&S.membro&&!document.hidden&&Date.now()-DZ129.rt>180e3)dz129AtCarrega()},5000);
