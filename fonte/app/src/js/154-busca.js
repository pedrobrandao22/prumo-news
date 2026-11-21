/* ---------- 154: a aba Buscar acha o que a pessoa procura (15/11, noite) ----------
   1. Comparação: sem acento, sem maiúscula e com "×" igual a "x" (6x1, 5x2, 12x36), na aba Buscar e no "Buscar na edição" do Criar.
   2. Ordem: a palavra no título pesa mais que no assunto (cobertura, tag, subtema), que pesa mais que no subtítulo, que pesa mais
      que no corpo; só depois desempata pela edição de hoje e pela hora. Quando a palavra só aparece no corpo, mostra o trecho.
   3. No topo: cartão da cobertura (com Seguir) quando a busca bate com o nome dela e cartão do Entenda quando bate com o nome
      ou o título do explicador. Depois, o que está passando no "Agora" (com o selo "ainda em apuração").
   4. Pessoas (você, amigos e quem aparece nos posts carregados), posts e colunas dos amigos, quando há conta e dados carregados.
   5. Nada encontrado: sempre uma frase, "você quis dizer" (palavra mais parecida da edição) e sugestões de assuntos.
   6. "Assuntos desta edição": o nome da cobertura vai numa linha pequena acima do título (não colado com dois-pontos), sem
      repetir quando o título já começa com ele, e sem o grupo "Outros".
   7. Adicionar amigos: a busca no servidor continua só pelo nome completo (regra do banco: buscar_membro, para quem não é amigo
      de amigo), mas a tela não se contradiz mais: diz quando as sugestões abaixo têm o nome e oferece "Convidar alguém". */

/* ===== 1. normalização ===== */
function bu154N(s){return norm(String(s==null?"":s).replace(/[×✕✖]/g,"x"))}
function bu154Termos(q){return rc116Termos(String(q||"").replace(/[×✕✖]/g,"x").replace(/[“”"'‘’«»]/g," "))}
function bu154Casa(t,s){return t.re?t.re.test(s):s.indexOf(t.n)>=0}
/* rc116Hit (usado na busca antiga e no "#tag") passa a tratar × como x */
{const _h=rc116Hit;rc116Hit=function(q){const h=_h.call(this,String(q||"").replace(/[×✕✖]/g,"x"));return t=>h(String(t==null?"":t).replace(/[×✕✖]/g,"x"))}}

/* texto normalizado com o mapa de posições do original (para achar e marcar o trecho) */
function bu154Mapa(s){s=String(s||"");let n="";const m=[];for(let i=0;i<s.length;i++){const c=bu154N(s[i]);for(let j=0;j<c.length;j++){n+=c[j];m.push(i)}}return {n,m,s}}
function bu154Achados(ts,M){const rs=[];ts.forEach(t=>{if(t.n.length<2&&!t.re)return;if(t.re){const g=new RegExp(t.re.source,"g");let x;while((x=g.exec(M.n))){const a=x.index+(x[1]||"").length;rs.push([a,a+t.n.length]);if(g.lastIndex===x.index)g.lastIndex++}}
    else{let i=M.n.indexOf(t.n);while(i>=0){rs.push([i,i+t.n.length]);i=M.n.indexOf(t.n,i+t.n.length)}}});
  rs.sort((a,b)=>a[0]-b[0]);const mg=[];rs.forEach(r=>{const l=mg[mg.length-1];if(l&&r[0]<=l[1])l[1]=Math.max(l[1],r[1]);else mg.push(r.slice())});
  return mg.map(([a,b])=>[M.m[a],(M.m[b-1]==null?M.s.length-1:M.m[b-1])+1])}
function bu154Marca(s,ts){s=String(s||"");const M=bu154Mapa(s),rs=bu154Achados(ts,M);let h="",p=0;rs.forEach(([a,b])=>{if(a<p)return;h+=esc(s.slice(p,a))+"<mark>"+esc(s.slice(a,b))+"</mark>";p=b});return h+esc(s.slice(p))}
function bu154Trecho(s,ts){s=String(s||"").replace(/\s+/g," ");const M=bu154Mapa(s),rs=bu154Achados(ts,M);if(!rs.length)return "";const i=rs[0][0];
  const a=i>60?s.lastIndexOf(" ",i-50)+1:0,b=Math.min(s.length,i+110),e=s.lastIndexOf(" ",b);const fim=b<s.length&&e>i?e:b;
  return (a>0?"…":"")+bu154Marca(s.slice(a,fim),ts)+(fim<s.length?"…":"")}

/* ===== 2. pontuação por campo ===== */
const BU154_P={T:10,A:7,S:3,C:1,H:1};/* H (19/11 tarde): manchetes antigas da cobertura, peso de corpo */
function bu154Pontos(ts,f,frase){/* f: {T,A,S,C} textos já juntados; devolve null se algum termo não casa em nenhum campo */
  const N={};Object.keys(f).forEach(k=>N[k]=bu154N(f[k]));let pt=0,onde={};
  for(const t of ts){let mx=0,k0="";for(const k of ["T","A","S","C","H"]){if(N[k]&&bu154Casa(t,N[k])){if(BU154_P[k]>mx){mx=BU154_P[k];k0=k}}}if(!mx)return null;pt+=mx;onde[k0]=1}
  if(frase&&frase.length>=4&&((N.T||"").indexOf(frase)>=0||(N.A||"").indexOf(frase)>=0))pt+=4;
  return {pt,soCorpo:!onde.T&&!onde.A,soH:!!onde.H&&!onde.T&&!onde.A&&!onde.S&&!onde.C,onde}}
const bu154J=a=>a.filter(x=>typeof x==="string"&&x).join(" · ");
function bu154Hash(p){const h=p&&p.hashtags;return Array.isArray(h)?h.filter(x=>typeof x==="string").join(" "):""}
function bu154Hora(iso){const t=Date.parse(iso||"");return isNaN(t)?0:t}

function bu154Coleta(q){const ts=bu154Termos(q);if(!ts.length||!FEED)return null;const frase=bu154N(q).replace(/\s+/g," ").trim();
  const R={ts,cob:[],ent:[],ag:[],not:[],pes:[],posts:[],cols:[]};const L=lente();
  /* notícias da edição */
  (FEED.pautas||[]).forEach(p=>{if(!p||!p.id)return;const n=p.neutro||{};const v=versao(p,L)||{};
    const tit0=n.titulo||v.titulo||"",ants=(Array.isArray(p.titulos)?p.titulos:[]).filter(x=>x&&x.titulo&&x.titulo!==tit0&&x.titulo!==n.titulo&&x.titulo!==v.titulo);
    const f={T:bu154J([n.titulo,v.titulo]),A:bu154J([p.tema,p.tag,p.subtema,bu154Hash(p)]),S:p.subtitulo||"",
      C:bu154J([n.texto,p.contexto,p.por_que,p.proximo,p.o_que_muda,...(Array.isArray(p.essencial)?p.essencial:[])]),H:ants.map(x=>x.titulo).join(" · ")};
    const r=bu154Pontos(ts,f,frase);if(!r)return;
    /* 19/11 tarde: só bateu numa manchete antiga: diz que é antiga e de quando (sem colar várias, com valores velhos) */
    let tr=r.soH?"":r.soCorpo?bu154Trecho(bu154J([p.subtitulo,f.C]),ts):"";
    if(r.soH){const a=ants.slice().reverse().find(x=>ts.every(t=>bu154Casa(t,bu154N(x.titulo))))||ants.slice().reverse().find(x=>ts.some(t=>bu154Casa(t,bu154N(x.titulo))));
      if(a){const d=a.hora?new Date(a.hora):null;tr=`<span class="bu154-ant">Manchete anterior${d&&!isNaN(d)?" · "+esc(d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",timeZone:"America/Sao_Paulo"})):""}:</span> `+bu154Marca(a.titulo,ts)}}
    R.not.push({k:"p",id:p.id,pt:r.pt+.5-(r.soH?2:0),h:bu154Hora(ultimaAtualizacao(p)||p.hora),t:tit0,tr,/* 19/11: sem os títulos antigos colados (valores velhos) */
      m:bu154J([secNome(secOf(p)),p.subtema,"esta edição"])});
    /* cartão da cobertura: o nome da cobertura (tema) bate com tudo o que foi digitado */
    const tm=temaDe(p);if(tm&&typeof cobTemPagina==="function"&&cobTemPagina(p)&&ts.every(t=>bu154Casa(t,bu154N(tm))))R.cob.push({p,pt:r.pt})});
  /* notas rápidas (breves) */
  (FEED.breves||[]).forEach(b=>{if(!b||!b.titulo)return;const r=bu154Pontos(ts,{T:b.titulo},frase);if(!r)return;
    R.not.push({k:"b",url:b.url,pt:r.pt-1,h:bu154Hora(b.hora),t:b.titulo,m:bu154J([secNome(b.secao||"politica"),"nota de "+nomeFonte(b.fonte)+" · abre o site ↗"])})});
  /* coberturas anteriores */
  (Array.isArray(FEED.dormentes)?FEED.dormentes:[]).forEach(d=>{if(!d||!d.id||pautaById(d.id))return;
    const r=bu154Pontos(ts,{T:d.titulo,A:bu154J([d.tema,d.tag,d.subtema,bu154Hash(d)]),H:(Array.isArray(d.titulos)?d.titulos.map(x=>x&&x.titulo):[]).filter(Boolean).join(" · "),C:d.resumo},frase);if(!r)return;
    R.not.push({k:"d",id:d.id,pt:r.pt-.5,h:bu154Hora(d.ultima),t:d.titulo,tr:r.soCorpo?bu154Trecho(d.resumo,ts):"",m:bu154J([secNome(d.secao||"politica"),"cobertura anterior",cobSP(d.ultima)])});
    const tm=d.tema||d.tag;if(tm&&ts.every(t=>bu154Casa(t,bu154N(tm)))&&R.cob.length<3)R.cob.push({d,pt:r.pt-1})});
  /* guardadas que saíram da edição */
  Object.entries(S.salvos||{}).forEach(([pid,x])=>{if(pautaById(pid)||!x||!x.snap)return;const r=bu154Pontos(ts,{T:x.snap.titulo,C:x.snap.texto},frase);if(!r)return;
    R.not.push({k:"s",id:pid,pt:r.pt-.5,h:bu154Hora(x.snap.hora||x.at),t:x.snap.titulo,tr:r.soCorpo?bu154Trecho(x.snap.texto,ts):"",m:"Guardada"})});
  /* Entenda: cartão quando bate com o nome ou o título; só no texto, vai para a lista */
  Object.entries(FEED.explicadores||{}).forEach(([k,e])=>{e=e||{};const r=bu154Pontos(ts,{A:bu154J([k,e.titulo]),C:e.texto},frase);if(!r)return;
    if(!r.soCorpo)R.ent.push({k,e,pt:r.pt});else R.not.push({k:"e",id:k,pt:r.pt-.5,h:0,t:e.titulo||k,tr:bu154Trecho(e.texto,ts),m:"Entenda · "+k})});
  /* Agora */
  try{(typeof agoraItens==="function"?agoraItens():[]).forEach((x,i)=>{if(!x||!x.t)return;const p=x.pid&&pautaById(x.pid);
    const r=bu154Pontos(ts,{T:x.t,A:p?bu154J([p.neutro&&p.neutro.titulo,temaDe(p)]):""},frase);if(r)R.ag.push({x,i,pt:r.pt})})}catch(e){}
  /* pessoas, posts e colunas (só com conta e o que já está carregado no aparelho) */
  if(S.uid){const vis=(()=>{try{return typeof PUB!=="undefined"&&PUB.on?pubVisiveis():[]}catch(e){return []}})();
    const us=new Set([S.uid,...(S.amigos||[])]);vis.forEach(x=>{if(x&&x.autor)us.add(x.autor)});
    us.forEach(u=>{const nm=u===S.uid?((S.membros[u]||{}).nome||""):nomeDe(u);if(!nm||nm==="Alguém")return;const nn=bu154N(nm);
      if(ts.every(t=>nn.split(/[^a-z0-9]+/).some(w=>w.indexOf(t.n)===0)||(t.n.length>=4&&nn.indexOf(t.n)>=0)))
        R.pes.push({u,nm,d:u===S.uid?"Você":S.amigos&&S.amigos.has(u)?"Amigo":"Aparece nos posts"})});
    R.pes.sort((a,b)=>(a.u===S.uid)-(b.u===S.uid)||a.nm.localeCompare(b.nm,"pt-BR"));
    vis.filter(x=>x&&x.tipo==="post").forEach(x=>{const c=typeof cs123Col==="function"?cs123Col(x):null;
      if(c){const r=bu154Pontos(ts,{T:c.tit,S:c.linha,C:c.corpo&&String(c.corpo).replace(/<[^>]*>/g," ")},frase);if(r)R.cols.push({x,c,pt:r.pt,tr:r.soCorpo?bu154Trecho(String(c.corpo||"").replace(/<[^>]*>/g," "),ts):""});return}
      if(!x.texto)return;const r=bu154Pontos(ts,{C:x.texto},frase);if(r)R.posts.push({x,pt:r.pt})});
    R.cols.sort((a,b)=>b.pt-a.pt||(+b.x.at||0)-(+a.x.at||0));R.posts.sort((a,b)=>(+b.x.at||0)-(+a.x.at||0))}
  const BU_K={p:0,d:1,s:1,e:2,b:3};/* 19/11: o Prumo desta edição antes do resto, e o mais novo antes */
  R.not.sort((a,b)=>(BU_K[a.k]??2)-(BU_K[b.k]??2)||b.pt-a.pt||b.h-a.h);R.cob.sort((a,b)=>b.pt-a.pt);R.ent.sort((a,b)=>b.pt-a.pt);R.ag.sort((a,b)=>b.pt-a.pt);
  R.n=R.cob.length+R.ent.length+R.ag.length+R.not.length+R.pes.length+R.posts.length+R.cols.length;return R}

/* ===== 3. desenho dos resultados ===== */
function bu154CobCard(o){if(o.d){const d=o.d,tm=d.tema||d.tag,seg=!!(PREF.seguindo||{})[norm(tm)];
    return `<div class="bu154-card"><button type="button" class="bu154-cb" data-dorm="${esc(d.id)}"><small>Cobertura anterior</small><b>${esc(tm)}</b><span>${esc(bu154J([d.inicio?"de "+cobSP(d.inicio)+" a "+cobSP(d.ultima):cobSP(d.ultima),"fora da edição"]))}</span></button><button type="button" class="bu154-seg${seg?" on":""}" data-bu154dseg="${esc(d.id)}" aria-pressed="${seg}" title="Avisamos se a cobertura voltar">${seg?"Vou avisar ✓":"Avisar se voltar"}</button></div>`}
  const p=o.p,tm=temaDe(p),seg=seguido(p),nt=(Array.isArray(p.titulos)?p.titulos.length:0),u=ultimaAtualizacao(p)||p.hora;
  return `<div class="bu154-card"><button type="button" class="bu154-cb" data-cobpag="${esc(p.id)}"><small>Cobertura${p.status==="ao_vivo"?" · ao vivo":p.status==="encerrada"?" · encerrada":""}</small><b>${esc(tm)}</b><span>${esc(bu154J([nt>1?nt+" manchetes":"",p.inicio?"desde "+cobSP(p.inicio):"",u?"atualizada "+quando(u):""]))}</span></button><button type="button" class="bu154-seg${seg?" on":""}" data-bu154seg="${esc(p.id)}" aria-pressed="${seg}">${seg?"Seguindo":"Seguir"}</button></div>`}
function bu154EntCard(o){const tx=String(o.e.texto||"");const c=tx.length>150?tx.slice(0,tx.lastIndexOf(" ",150))+"…":tx;
  return `<button type="button" class="bu154-card bu154-ent" data-explica="${esc(o.k)}"><span class="bu154-cb"><small>Entenda</small><b>${esc(o.e.titulo||o.k)}</b>${c?`<span class="bu154-ex">${esc(c)}</span>`:""}</span><span class="chev" aria-hidden="true">›</span></button>`}
function bu154Item(r,ts){const b=`<b>${bu154Marca(r.t,ts)}</b>${r.tr?`<em class="trecho">${r.tr}</em>`:""}<span>${esc(r.m)}</span>`;
  if(r.k==="b")return `<li><a class="bu154-a" href="${escU(r.url)}" target="_blank" rel="noopener">${b}</a></li>`;
  if(r.k==="d")return `<li class="dorm"><button type="button" data-dorm="${esc(r.id)}">${b}</button></li>`;
  if(r.k==="e")return `<li><button type="button" data-explica="${esc(r.id)}">${b}</button></li>`;
  return `<li><button type="button" data-busca="${esc(r.id)}">${b}</button></li>`}
function bu154Html(R,q){const ts=R.ts;let h="";
  /* 19/11 tarde: cobertura encerrada não fica acima das notícias de hoje: vai para o fim, em "Coberturas anteriores" */
  const vivas=R.cob.filter(o=>o.p),ants=R.cob.filter(o=>o.d);
  if(vivas.length||R.ent.length)h+=`<div class="bu154-cards">${vivas.slice(0,2).map(bu154CobCard).join("")}${R.ent.slice(0,2).map(bu154EntCard).join("")}</div>`;
  /* "Agora": o rótulo uma vez só, no cabeçalho; nos itens, só o que é da edição ganha selo */
  if(R.ag.length){const tudoApura=R.ag.every(o=>!o.x.pid);
    h+=`<h3 class="bu154-h">Agora${tudoApura?` <small class="bu154-hs">ainda em apuração</small>`:""}</h3><ul class="bu154-ag">${R.ag.map(o=>`<li><button type="button" data-bu154ag="${o.i}">${!tudoApura?`<span class="bu154-selo">${o.x.pid?"Na edição":"Ainda em apuração"}</span>`:""}<b>${bu154Marca(o.x.t,ts)}</b><span>${esc(quando(new Date(o.x.h).toISOString()))}</span></button></li>`).join("")}</ul>`}
  const pes=R.pes.length?`<h3 class="bu154-h">Pessoas</h3><ul class="amgl bu154-pe">${R.pes.slice(0,6).map(o=>`<li><button type="button" class="amg-r" data-bu154pf="${esc(o.u)}">${avatar(o.u)}<span class="amg-n"><b>${bu154Marca(o.nm,ts)}</b><span>${esc(o.d)}</span></span><i aria-hidden="true">›</i></button></li>`).join("")}</ul>`:"";
  const temNoticiaForte=R.not.some(r=>r.pt>=BU154_P.A*ts.length);
  if(pes&&!temNoticiaForte)h+=pes;
  if(R.not.length)h+=`${h?`<h3 class="bu154-h">Notícias</h3>`:""}<ul class="sres">${R.not.slice(0,40).map(r=>bu154Item(r,ts)).join("")}</ul>`;
  if(pes&&temNoticiaForte)h+=pes;
  if(ants.length)h+=`<h3 class="bu154-h">Coberturas anteriores</h3><div class="bu154-cards bu154-ants">${ants.slice(0,2).map(bu154CobCard).join("")}</div>`;
  if(R.cols.length)h+=`<h3 class="bu154-h">Colunas</h3><ul class="sres bu154-po">${R.cols.slice(0,5).map(o=>`<li><button type="button" data-cs123ler="${esc(o.x.id)}"><b>${bu154Marca(o.c.tit,ts)}</b>${o.tr?`<em class="trecho">${o.tr}</em>`:o.c.linha?`<em class="trecho">${esc(o.c.linha)}</em>`:""}<span>${esc(bu154J(["Coluna de "+(o.x.autor===S.uid?"você":nomeDe(o.x.autor)),quando(new Date(+o.x.at||0).toISOString())]))}</span></button></li>`).join("")}</ul>`;
  if(R.posts.length)h+=`<h3 class="bu154-h">Posts</h3><ul class="sres bu154-po">${R.posts.slice(0,5).map(o=>`<li><button type="button" data-bu154post="${esc(o.x.id)}"><em class="trecho">${bu154Trecho(o.x.texto,ts)||esc(String(o.x.texto).slice(0,140))}</em><span>${esc(bu154J(["Post de "+(o.x.autor===S.uid?"você":nomeDe(o.x.autor)),quando(new Date(+o.x.at||0).toISOString())]))}</span></button></li>`).join("")}</ul>`;
  return h}

/* ===== 5. nada encontrado: frase, "você quis dizer" e sugestões ===== */
function bu154Lev(a,b,mx){if(Math.abs(a.length-b.length)>mx)return mx+1;let p=[];for(let j=0;j<=b.length;j++)p[j]=j;
  for(let i=1;i<=a.length;i++){const c=[i];let mn=i;for(let j=1;j<=b.length;j++){c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));if(c[j]<mn)mn=c[j]}if(mn>mx)return mx+1;p=c}return p[b.length]}
function bu154Vocab(){if(bu154Vocab.f===FEED&&bu154Vocab.v)return bu154Vocab.v;const m=new Map(),pega=s=>bu154N(s).split(/[^a-z0-9]+/).forEach(w=>{if(w.length>=3)m.set(w,(m.get(w)||0)+1)});
  (FEED.pautas||[]).forEach(p=>{const n=p.neutro||{};pega([n.titulo,p.tema,p.tag,p.subtema,p.subtitulo,n.texto].join(" "))});
  (FEED.breves||[]).forEach(b=>pega(b&&b.titulo));(FEED.dormentes||[]).forEach(d=>pega(d&&[d.titulo,d.tema,d.tag].join(" ")));
  Object.entries(FEED.explicadores||{}).forEach(([k,e])=>pega(k+" "+((e||{}).titulo||"")));
  bu154Vocab.f=FEED;bu154Vocab.v=m;return m}
function bu154QuisDizer(q){if(!FEED)return "";const ws=String(q||"").trim().split(/\s+/).filter(Boolean),V=bu154Vocab();let mudou=false;
  const out=ws.map(w=>{const n=bu154N(w);if(n.length<4||V.has(n))return w;let best="",bd=9,bf=0;const mx=n.length<=5?1:2;
    V.forEach((f,v)=>{if(Math.abs(v.length-n.length)>mx)return;const d=bu154Lev(n,v,mx);if(d<=mx&&(d<bd||(d===bd&&f>bf))){best=v;bd=d;bf=f}});
    if(best){mudou=true;return best}return w});
  return mudou?out.join(" "):""}
function bu154Nada(q){const qd=bu154QuisDizer(q);const sug=(typeof sugestoes==="function"?sugestoes():[]).slice(0,8);
  const onde=S.uid?"as notícias desta edição, as coberturas anteriores, o Entenda, o Agora, os amigos e os posts deles":"as notícias desta edição, as coberturas anteriores, o Entenda e o Agora";
  return `<div class="bu154-nada"><p class="hint"><b class="bu154-nt">Nada encontrado para “${esc(q)}”.</b> A busca olha ${onde}. Confira a grafia ou tente uma palavra só.</p>
    ${qd&&qd!==q?`<p class="bu154-qd">Você quis dizer <button type="button" data-bu154q="${esc(qd)}">${esc(qd)}</button>?</p>`:""}
    ${sug.length?`<p class="bu154-sh">Assuntos desta edição</p><div class="bv-chips bu154-sug">${sug.map(t=>`<button type="button" class="chipb" data-bu154q="${esc(t)}">${esc(t)}</button>`).join("")}</div>`:""}</div>`}

/* ===== a busca em si (o "#tag" continua no 111) ===== */
{const _br=buscaRes;buscaRes=function(q){const s=String(q||"").trim();if(s.charAt(0)==="#")return _br.apply(this,arguments);
  if(!FEED)return `<p class="hint">As notícias ainda não carregaram. Verifique a conexão.</p>`;
  try{const R=bu154Coleta(s);if(R&&R.n)return bu154Html(R,s);
    /* nada: se a palavra mais parecida acha algo, mostra já o resultado dela */
    const qd=bu154QuisDizer(s);if(qd&&qd!==s){const R2=bu154Coleta(qd);if(R2&&R2.n)return `<p class="bu154-corr">Nada para “${esc(s)}”. Mostrando resultados para <b>“${esc(qd)}”</b>.</p>`+bu154Html(R2,qd)}
    return bu154Nada(s)}catch(e){return _br.apply(this,arguments)}}}

/* "Perfis abertos" (125) chegam depois: não deixar "Nada encontrado" em cima de um perfil achado */
if(typeof qa125BusPoe==="function"){const _qp=qa125BusPoe;qa125BusPoe=function(){const r=_qp.apply(this,arguments);try{const out=$("#bvres"),b=out&&out.querySelector(".bu154-nada .bu154-nt");
  if(b&&out.querySelector(".qa125-bus")){const q=(($("#bvq")||{}).value||"").trim();b.textContent=`Nenhuma notícia com “${q}”.`}}catch(e){}return r}}

/* campo: sem conta não há pessoas para achar */
{const _rv=renderBuscaView;renderBuscaView=function(){const r=_rv.apply(this,arguments);try{const i=$("#bvq");if(i&&!S.uid)i.placeholder=innerWidth<400?"Buscar notícias":"Buscar notícia ou assunto"}catch(e){}return r}}

/* ===== 6. "Assuntos desta edição" ===== */
function bu154Assuntos(){const ps=visiveis();const L=lente();const sem=s=>bu154N(s).replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
  const it=p=>{const t=(p.neutro||{}).titulo||versao(p,L).titulo||"",tm=temaDe(p);const k=tm&&tm!==p.subtema&&sem(t).indexOf(sem(tm))!==0?tm:"";
    return `<button type="button" class="bv-it" ${cobTemPagina(p)?`data-cobpag`:`data-busca`}="${esc(p.id)}"><span class="bu154-it">${k?`<small>${esc(k)}</small>`:""}<span>${esc(t)}</span></span><span class="chev" aria-hidden="true">›</span></button>`};
  return SECS().map(s=>{const l=ps.filter(p=>secOf(p)===s.id);if(!l.length)return "";const subs={},soltas=[];l.forEach(p=>{if(p.subtema)(subs[p.subtema]=subs[p.subtema]||[]).push(p);else soltas.push(p)});
    const ordem=((FEED.taxonomia||{})[s.id]||[]);const ks=Object.keys(subs).sort((a,b)=>{const ia=ordem.indexOf(a),ib=ordem.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)});
    /* sem subtema: vão junto, sem o rótulo "Outros"; se a seção só tem um grupo, nem rótulo */
    const um=ks.length+(soltas.length?1:0)<=1;
    return `<div class="bv-g"><b><i style="background:${secCor(s.id)}"></i>${esc(s.nome)}</b>${ks.map(k=>`${um?"":`<span class="bv-sub">${esc(k)}</span>`}${subs[k].map(it).join("")}`).join("")}${soltas.length?`${um?"":`<span class="bv-sub">Mais de ${esc(s.nome)}</span>`}${soltas.map(it).join("")}`:""}</div>`}).join("")}
{const _bt=buscaTemas;buscaTemas=function(){const r=_bt.apply(this,arguments);try{if(!FEED)return r;const tp=document.createElement("template");tp.innerHTML=r;
    const h=[...tp.content.querySelectorAll(".bv-sec>h3")].find(x=>x.textContent==="Assuntos desta edição");if(!h)return r;
    const novo=document.createElement("template");novo.innerHTML=`<div class="bv-sec"><h3>Assuntos desta edição</h3>${bu154Assuntos()}</div>`;h.parentElement.replaceWith(novo.content);
    const d=document.createElement("div");d.appendChild(tp.content);return d.innerHTML}catch(e){return r}}}

/* ===== toques ===== */
function bu154Rodar(q){const i=$("#bvq");if(!i)return;i.value=q;i.dispatchEvent(new Event("input",{bubbles:true}));try{i.blur()}catch(e){}window.scrollTo(0,0)}
function bu154AbrePost(id){const x=pubDe(id)||(pubVisiveis()||[]).find(y=>y.id===id);if(!x){toast("Este post não está mais disponível.");return}
  if($("#layer").innerHTML)closeLayer();PFV={u:x.autor,aba:"posts",modo:"posts",lista:[x],i:0,daGrade:false};
  $("#layer").innerHTML=`<div class="pfv" role="dialog" aria-modal="true" aria-label="Publicação"></div>`;if(pushH())HST++;pfvDesenha()}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if((b=t.closest("[data-bu154q]"))){pare();bu154Rodar(b.dataset.bu154q);return}
  if((b=t.closest("#bvres [data-bu154seg]"))){pare();const p=pautaById(b.dataset.bu154seg);if(!p)return;const on=!seguido(p);cobSegue(temaDe(p),on);const rf154=()=>{try{const y=scrollY;renderPosts(true);window.scrollTo(0,y)}catch(_){}const i=$("#bvq");if(i)i.dispatchEvent(new Event("input",{bubbles:true}))};
    /* 20/11 (testador): deixar de seguir com um toque, sem dizer o quê nem desfazer */
    if(on)toast("Seguindo "+temaDe(p));else toast("Deixou de seguir "+temaDe(p),"Desfazer",()=>{cobSegue(temaDe(p),true);rf154()});
    try{const y=scrollY;renderPosts(true);window.scrollTo(0,y)}catch(_){}const i=$("#bvq");if(i)i.dispatchEvent(new Event("input",{bubbles:true}));return}
  if((b=t.closest("#bvres [data-bu154dseg]"))){pare();const d=(FEED.dormentes||[]).find(x=>x.id===b.dataset.bu154dseg);if(!d)return;const tm=d.tema||d.tag;const on=!(PREF.seguindo||{})[norm(tm)];cobSegue(tm,on);if(on)toast("Vamos avisar se voltar");else toast("Não vamos mais avisar sobre "+tm,"Desfazer",()=>{cobSegue(tm,true);const i=$("#bvq");if(i)i.dispatchEvent(new Event("input",{bubbles:true}))});
    const i=$("#bvq");if(i)i.dispatchEvent(new Event("input",{bubbles:true}));return}
  if((b=t.closest("#bvres [data-bu154ag]"))){pare();const x=(agoraItens()||[])[+b.dataset.bu154ag];if(x&&x.pid&&pautaById(x.pid))abrirMateria(x.pid);else abrirAgora();return}
  if((b=t.closest("#bvres [data-bu154pf]"))){pare();abrirPerfil(b.dataset.bu154pf);return}
  if((b=t.closest("#bvres [data-bu154post]"))){pare();bu154AbrePost(b.dataset.bu154post);return}
},true);

/* ===== "Buscar na edição" do Criar (escolher a notícia) ===== */
function bu154NtFiltra(ov){const q=ov.querySelector("#ce-lq"),ul=ov.querySelector(".ce-lis");if(!q||!ul)return;const ts=bu154Termos(q.value);let n=0;
  /* título, subtítulo, número em destaque, tag e cobertura primeiro; depois as que só citam no texto */
  const lis=[...ul.children].filter(li=>!li.classList.contains("bu154-ntnada")&&li.querySelector("[data-bu154h]"));const fortes=[],fracos=[];
  lis.forEach(li=>{const b=li.querySelector("[data-bu154h]");const f=b.dataset.bu154h,c=b.dataset.bu154c||"";
    const ok=!ts.length||ts.every(t=>bu154Casa(t,f)||bu154Casa(t,c));li.hidden=!ok;if(!ok)return;n++;(!ts.length||ts.every(t=>bu154Casa(t,f))?fortes:fracos).push(li)});
  const ord=ts.length?fortes.concat(fracos):lis.slice().sort((a,b)=>(+a.dataset.bu154i)-(+b.dataset.bu154i));
  ord.forEach(li=>ul.appendChild(li));
  let nd=ul.querySelector(".bu154-ntnada");if(!nd){ul.insertAdjacentHTML("beforeend",`<li class="bu154-ntnada hint" hidden></li>`);nd=ul.querySelector(".bu154-ntnada")}else ul.appendChild(nd);
  nd.hidden=!!n||!ts.length;if(!n&&ts.length)nd.textContent=`Nenhuma notícia desta edição com “${q.value.trim()}”. Tente outra palavra, como o nome de quem está na notícia ou o assunto.`}

/* ===== 7. Adicionar amigos: mensagens que não se contradizem ===== */
function bu154AmgSheet(){return !!document.querySelector("#pform #pbusca")}
function bu154AmgVazio(){if(!bu154AmgSheet())return;const bx=$("#pbox");if(!bx)return;const em=bx.querySelector(".empty");if(!em||em.classList.contains("bu154-amg"))return;
  const q=(($("#pq")||{}).value||"").trim();if(!q)return;em.classList.add("bu154-amg");
  em.innerHTML=`<b>Nenhuma sugestão com “${esc(q)}”</b><span>Aqui aparecem amigos dos seus amigos. Para achar outra pessoa do Prumo, digite o nome completo dela (nome e sobrenome) e toque em “Procurar”.</span><button type="button" class="btn ghost" data-convidar>Convidar alguém</button>`}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="pq")bu154AmgVazio()});
{const _aa=abrirAddAmigos;abrirAddAmigos=function(){const r=_aa.apply(this,arguments);try{const re=S._reAmg;if(typeof re==="function")S._reAmg=function(){const x=re.apply(this,arguments);try{bu154AmgVazio()}catch(e){}return x}}catch(e){}return r}}
{const _pn=procurarNome;procurarNome=async function(n){const r=await _pn.apply(this,arguments);try{const bx=$("#pbox");if(!bx||!bu154AmgSheet())return r;
    const h=[...bx.querySelectorAll("p.hint")].find(p=>/nome exato/.test(p.textContent)&&!p.classList.contains("bu154-amgh"));if(!h)return r;
    const q=String(n||"").trim(),tem=bx.querySelectorAll("ul.amgl li").length;h.classList.add("bu154-amgh");
    if(tem)h.textContent=`As sugestões com “${q}” estão abaixo. Fora delas, ninguém no Prumo com o nome exato “${q}”: para achar outra pessoa, digite o nome completo dela.`;
    else{bx.querySelector(".empty")?.remove();h.innerHTML=`Ninguém no Prumo com o nome exato “${esc(q)}”. Confira o nome completo (nome e sobrenome), como a pessoa se cadastrou, ou convide-a. <button type="button" class="btn ghost bu154-conv" data-convidar>Convidar alguém</button>`}}catch(e){}return r}}
/* 19/11: ao fechar uma folha por cima da busca (ex.: seguir uma cobertura), os botões Seguir dos cartões de cobertura
   mostram o estado novo (antes continuavam dizendo "Seguir" depois de seguir); só os botões, sem redesenhar a busca */
function bu154SegAtualiza(){try{document.querySelectorAll("#bvres [data-bu154seg]").forEach(b=>{const p=pautaById(b.dataset.bu154seg);if(!p)return;const on=!!seguido(p);b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.textContent=on?"Seguindo":"Seguir"});
  document.querySelectorAll("#bvres [data-bu154dseg]").forEach(b=>{const d=(FEED.dormentes||[]).find(x=>x&&x.id===b.dataset.bu154dseg);if(!d)return;const on=!!(PREF.seguindo||{})[norm(d.tema||d.tag)];b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.textContent=on?"Vou avisar ✓":"Avisar se voltar"})}catch(e){}}
(function(){let ab=false;const vig=()=>{const L=document.getElementById("layer");if(!L)return setTimeout(vig,500);
  new MutationObserver(()=>{const tem=!!L.innerHTML;if(ab&&!tem&&typeof VIEW!=="undefined"&&VIEW==="busca")bu154SegAtualiza();ab=tem}).observe(L,{childList:true})};vig()})();
