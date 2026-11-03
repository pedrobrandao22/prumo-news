/* ---------- 109: SQL v8 — foto de perfil, arquivar post, curtir comentário ----------
   Tudo aqui depende do sql/publicacoes-v8.sql rodado no Supabase. Antes disso o app segue igual, sem os botões novos
   (o teste é a tabela com_curtidas: sem ela, V8.on fica false; erro de rede deixa em aberto e tenta de novo).
   A limpeza das reações de mensagem apagada (C25) é só do banco: o app já escondia as órfãs. */
var V8={on:null,n:0};
async function v8Testa(){if(V8.on!==null||typeof SB==="undefined"||!SB||!S.uid||!S.membro)return V8.on;
  try{const r=await SB.from("com_curtidas").select("cid").limit(1);
    if(!r.error)V8.on=true;else if(/does not exist|PGRST205|PGRST106|42P01|Could not find the table|schema cache/i.test(String(r.error.message||"")+" "+String(r.error.code||"")))V8.on=false}catch(e){}
  if(V8.on)v8Liga();return V8.on}
function v8Liga(){try{cc8Ouvir();if(VIEW==="me")renderMe();if($("#cbox"))cc8Carregar();clearTimeout(AT._pt);AT._pt=setTimeout(atCarregar,300)}catch(e){}}
setInterval(()=>{if(V8.on===null&&S.uid&&S.membro&&V8.n<40){V8.n++;v8Testa()}},2500);
const v8Erro=r=>{const e=r&&r.error;return e?String(e.code||"")+" "+String(e.message||""):""};

/* ===== 1. foto de perfil ===== */
/* avatar() (js/001) pergunta aqui primeiro: com foto, a foto; sem foto, as iniciais de sempre */
var AV8={pede:new Set(),falhou:{},t:0};
function av8(uid){try{const m=S.membros&&S.membros[uid],f=m&&typeof m.foto==="string"?m.foto:"";if(!f)return "";
    const ini=esc((nomeDe(uid)[0]||"?").toUpperCase()),u=pubUrl(f);
    if(!u){av8Pede(f);return `<span class="av" data-avf="${esc(f)}" style="background:${corDe(uid)}">${ini}</span>`}
    return `<span class="av av8" data-avf="${esc(f)}" style="background:${corDe(uid)}"><img src="${pubSrc(u)}" alt="" decoding="async"></span>`}catch(e){return ""}}
function av8Pede(f){if((AV8.falhou[f]||0)>Date.now()-300e3)return;AV8.pede.add(f);clearTimeout(AV8.t);AV8.t=setTimeout(av8Assina,60)}
async function av8Assina(){const l=[...AV8.pede];AV8.pede.clear();if(!l.length||!SB)return;const now=Date.now();
  try{const r=await SB.storage.from("fotos").createSignedUrls(l,6*3600);(r.data||[]).forEach(d=>{if(d&&d.signedUrl)PUB.urls[d.path]={u:d.signedUrl,exp:now+6*3600e3}})}catch(e){}
  l.forEach(f=>{if(!pubUrl(f))AV8.falhou[f]=now});av8Pinta()}
function av8Pinta(){document.querySelectorAll(".av[data-avf]:not(.av8)").forEach(el=>{const u=pubUrl(el.dataset.avf);if(!u)return;el.classList.add("av8");el.innerHTML=`<img src="${pubSrc(u)}" alt="" decoding="async">`})}
/* Perfil: "Editar foto" ao lado de "Nova publicação" */
{const _pc8=pfCab;pfCab=function(u){let h=_pc8.apply(this,arguments);try{if(u===S.uid&&V8.on)h=h.replace(/(<button type="button" class="btn ghost" data-convidar>[^<]*<\/button>)/,`$1<button type="button" class="btn ghost" data-fp8>Editar foto</button>`)}catch(e){}return h}}
var FP8=null;
function fp8Abrir(){if(!V8.on||!S.uid)return;FP8=null;const tem=!!((S.membros[S.uid]||{}).foto);
  sheet("Foto do perfil",`<div class="fp8"><div class="fp8-prev">${avatar(S.uid)}</div><p class="hint">Quem vê seu nome no Prumo vê a foto.</p></div><input type="file" id="fp8-file" accept="image/*" hidden>`,
    `<button type="button" class="btn" data-fp8esc>${tem?"Trocar foto":"Escolher foto"}</button>${tem?`<button type="button" class="btn ghost perigo" data-fp8tira>Remover foto</button>`:""}`);
  $("#fp8-file")?.addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(f)fp8Recorte(f)})}
/* recorte quadrado: arrastar para enquadrar e aproximar com a barra */
const FP8_Q=240;
function fp8Recorte(file){if(!/^image\//.test(file.type)&&!/\.(jpe?g|png|webp|heic)$/i.test(file.name)){toast("Escolha uma foto.");return}
  const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{const w=im.naturalWidth,h=im.naturalHeight;if(!w||!h){toast("Não deu para abrir essa foto.");return}
    const s0=FP8_Q/Math.min(w,h);FP8={im,url,w,h,s0,z:1,ox:(FP8_Q-w*s0)/2,oy:(FP8_Q-h*s0)/2};
    const b=$(".sheet .sh-b"),f=$(".sheet .sh-f");if(!b||!f)return;
    b.innerHTML=`<div class="fp8"><div class="fp8-cx" aria-label="Arraste para enquadrar"><img alt="" src="${pubSrc(url)}" draggable="false"></div><label class="fp8-z"><span>Aproximar</span><input type="range" id="fp8-z" min="1" max="3" step="0.01" value="1" aria-label="Aproximar"></label></div>`;
    f.innerHTML=`<button type="button" class="btn" data-fp8ok>Salvar foto</button><button type="button" class="btn ghost" data-close>Cancelar</button>`;
    fp8Poe();fp8Arrasto($(".sheet .fp8-cx"));$("#fp8-z").addEventListener("input",e=>{const s=FP8.s0*FP8.z,cx=(FP8_Q/2-FP8.ox)/s,cy=(FP8_Q/2-FP8.oy)/s;FP8.z=+e.target.value;const s2=FP8.s0*FP8.z;FP8.ox=FP8_Q/2-cx*s2;FP8.oy=FP8_Q/2-cy*s2;fp8Poe()})};
  im.onerror=()=>{URL.revokeObjectURL(url);toast("Não deu para abrir essa foto.")};im.src=url}
function fp8Poe(){if(!FP8)return;const s=FP8.s0*FP8.z,W=FP8.w*s,H=FP8.h*s;FP8.ox=Math.min(0,Math.max(FP8_Q-W,FP8.ox));FP8.oy=Math.min(0,Math.max(FP8_Q-H,FP8.oy));
  const i=$(".sheet .fp8-cx img");if(i){i.style.width=W+"px";i.style.height=H+"px";i.style.transform=`translate(${FP8.ox}px,${FP8.oy}px)`}}
function fp8Arrasto(el){if(!el)return;let p=null;el.addEventListener("pointerdown",e=>{p={x:e.clientX,y:e.clientY,ox:FP8.ox,oy:FP8.oy};try{el.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
  el.addEventListener("pointermove",e=>{if(!p||!FP8)return;FP8.ox=p.ox+e.clientX-p.x;FP8.oy=p.oy+e.clientY-p.y;fp8Poe()});["pointerup","pointercancel"].forEach(k=>el.addEventListener(k,()=>{p=null}))}
function fp8Blob(){return new Promise((ok,no)=>{const s=FP8.s0*FP8.z,c=document.createElement("canvas");c.width=c.height=400;const g=c.getContext("2d");
  g.drawImage(FP8.im,-FP8.ox/s,-FP8.oy/s,FP8_Q/s,FP8_Q/s,0,0,400,400);c.toBlob(b=>b?ok(b):no(new Error("foto")),"image/jpeg",.85)})}
async function fp8Grava(novo,blobUrl){const ant=(S.membros[S.uid]||{}).foto||null;const r=await SB.rpc("mudar_foto",{p_foto:novo});if(r&&r.error)throw r.error;
  if(novo&&blobUrl)PUB.urls[novo]={u:blobUrl,exp:Date.now()+3600e3};S.membros[S.uid]={...(S.membros[S.uid]||{}),foto:novo};
  if(ant&&ant!==novo&&ant.indexOf(S.uid+"/")===0&&!PUB.itens.some(x=>(x.fotos||[]).includes(ant)))try{await SB.storage.from("fotos").remove([ant])}catch(e){}
  rerenderAll();if(VIEW==="me")renderMe()}
async function fp8Salvar(b){if(!FP8)return;if(b)b.disabled=true;let p=null;
  try{const blob=await fp8Blob();p=await pubSobe(blob);const u=URL.createObjectURL(blob);await fp8Grava(p,u);try{URL.revokeObjectURL(FP8.url)}catch(e){}FP8=null;closeLayer();toast("Foto atualizada")}
  catch(e){if(p)try{await SB.storage.from("fotos").remove([p])}catch(_){}if(b)b.disabled=false;toast("Não deu para salvar a foto. Tente de novo.")}}
async function fp8Tirar(b){if(b)b.disabled=true;try{await fp8Grava(null);closeLayer();toast("Foto removida")}catch(e){if(b)b.disabled=false;toast("Não deu para remover agora.")}}

/* ===== 2. arquivar post ===== */
{const _pv8=pubVisiveis;pubVisiveis=function(){return _pv8.apply(this,arguments).filter(x=>!x.arquivado)}}
var ARQ8=null;
/* menu ⋯ do próprio post: Arquivar / Mostrar no perfil (antes de "Apagar post") */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;const b=t.closest("[data-umenu]");if(!b||!V8.on)return;
  const id=b.dataset.umenu,x=pubDe(id)||(ARQ8||[]).find(y=>y.id===id);if(!x||x.autor!==S.uid||x.tipo==="story")return;
  const ap=document.querySelector(`.sheet [data-uapagar="${CSS.escape(id)}"]`);if(!ap||ap.parentNode.querySelector("[data-u8arq]"))return;
  if(x.arquivado)ap.parentNode.querySelectorAll("[data-ufixar],[data-upstory],[data-ueditar]").forEach(o=>o.remove());
  ap.insertAdjacentHTML("beforebegin",x.arquivado?`<button type="button" data-u8arq="${esc(id)}" data-on="0">Mostrar no perfil<span>volta para o seu perfil e para o Feed dos amigos</span></button>`
    :`<button type="button" data-u8arq="${esc(id)}" data-on="1">Arquivar<span>sai do perfil e do Feed dos amigos, sem apagar</span></button>`)},true);
async function pub8Arquivar(id,on){const x=pubDe(id)||(ARQ8||[]).find(y=>y.id===id);if(!x)return false;
  const r=await SB.rpc("pub_arquivar",{p_id:id,p_arquivar:on});if(r&&r.error||!(r&&r.data)){toast(on?"Não deu para arquivar agora.":"Não deu para mostrar agora.");return false}
  x.arquivado=on;if(on)x.fixado=null;const y=pubDe(id);if(y&&y!==x){y.arquivado=on;if(on)y.fixado=null}
  if(!PUB.itens.some(z=>z.id===id))PUB.itens.push(x);
  if(ARQ8){ARQ8=on?[x].concat(ARQ8.filter(z=>z.id!==id)):ARQ8.filter(z=>z.id!==id)}
  /* tira o post das listas abertas (Feed, perfil, Arquivados) */
  document.querySelectorAll(`.upost[data-pid="u:${CSS.escape(id)}"]`).forEach(el=>{if(on?!el.closest(".pfv-arq8"):!!el.closest(".pfv-arq8"))el.remove()});
  if(PFV&&Array.isArray(PFV.lista))PFV.lista=PFV.lista.filter(z=>z.id!==id);
  pubRedesenha();if(VIEW==="me")renderMe();if($("#layer .pfv-arq8")&&PFV&&PFV.modo!=="posts")arq8Desenha();
  toast(on?"Post arquivado. Só você vê.":"Post de volta no seu perfil");return true}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(b=t.closest("[data-u8arq]")){pare();const id=b.dataset.u8arq,on=b.dataset.on==="1";if(b.closest(".sheet"))closeLayer();
    pub8Arquivar(id,on).then(ok=>{if(ok&&!on&&PFV&&PFV.aba==="arq8"&&PFV.modo==="posts"&&!(PFV.lista||[]).length)history.back()});return}
  if(t.closest("[data-arq8]")){pare();arq8Abrir();return}
  if(b=t.closest("[data-arq8i]")){pare();const i=+b.dataset.arq8i,l=ARQ8||[];if(!l[i])return;PFV={u:S.uid,aba:"arq8",modo:"posts",lista:l.slice(),i,daGrade:true};if(pushH())HST++;pfvDesenha();return}
  if(t.closest("[data-fp8]")){pare();fp8Abrir();return}
  if(t.closest("[data-fp8esc]")){pare();$("#fp8-file")?.click();return}
  if(b=t.closest("[data-fp8ok]")){pare();fp8Salvar(b);return}
  if(b=t.closest("[data-fp8tira]")){pare();if(!b.classList.contains("conf")){b.classList.add("conf");b.textContent="Toque de novo para remover";return}fp8Tirar(b);return}},true);
/* Conta › Posts arquivados (junto do Arquivo de stories) */
{const _rm8=renderMe;renderMe=function(){const r=_rm8.apply(this,arguments);try{if(V8.on){const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-arq8]")){const h=`<button type="button" data-arq8><span>Posts arquivados</span><i>›</i></button>`;const a=m.querySelector("[data-arquivo]");if(a)a.insertAdjacentHTML("afterend",h);else m.insertAdjacentHTML("afterbegin",h)}}}catch(e){}return r}}
async function arq8Carregar(){try{const r=await SB.from("publicacoes").select("*").eq("autor",S.uid).eq("arquivado",true).order("at",{ascending:false}).limit(200);if(r.error)return ARQ8||[];
    ARQ8=(r.data||[]).map(pubNorm).filter(x=>x.tipo!=="story");const ids=new Set(PUB.itens.map(x=>x.id));ARQ8.forEach(x=>{if(!ids.has(x.id))PUB.itens.push(x);else{const y=pubDe(x.id);if(y)y.arquivado=true}});await pubAssinaLista(ARQ8);return ARQ8}catch(e){return ARQ8||[]}}
async function arq8Abrir(){if(!V8.on)return;if($("#layer").innerHTML)closeLayer();PFV={u:S.uid,aba:"arq8",modo:"grade"};ARQ8=null;
  $("#layer").innerHTML=`<div class="pfv pfv-arq8" role="dialog" aria-modal="true" aria-label="Posts arquivados"></div>`;if(pushH())HST++;uso("arquivados");arq8Desenha();await arq8Carregar();arq8Desenha()}
function arq8Desenha(){const el=$("#layer .pfv-arq8");if(!el)return;const l=ARQ8||[];
  let g=l.length?pfTiles(l,"posts",S.uid).replace(/data-pfi="/g,'data-arq8i="').replace(/ data-fixo/g,""):"";
  el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-pfvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>Posts arquivados<small>só você vê</small></b><span class="sp"></span></div>
    <div class="pfv-sc">${ARQ8===null?`<p class="hint" style="padding:20px">Carregando…</p>`:!l.length?`<div class="pf-vz"><b>Nenhum post arquivado</b><span>No menu ⋯ de um post seu, “Arquivar” tira o post do perfil e do Feed dos amigos sem apagar. Ele fica aqui, e você pode mostrar de novo quando quiser.</span></div>`:`<p class="arq8-dica">Só você vê estes posts. Toque em um para mostrar de novo no perfil.</p>${g}`}</div>`}
/* lista dos arquivados aberta como posts: faixa "Mostrar no perfil" em cada um; voltar leva à grade dos arquivados */
{const _pd8=pfvDesenha;pfvDesenha=function(){if(PFV&&PFV.aba==="arq8"&&PFV.modo!=="posts")return arq8Desenha();const r=_pd8.apply(this,arguments);
  try{if(PFV&&PFV.aba==="arq8"&&PFV.modo==="posts"){const el=$("#layer .pfv");const h=el&&el.querySelector(".pfv-h b");if(h)h.innerHTML=`Arquivados<small>só você vê</small>`;
    el&&el.querySelectorAll(".upost[data-pid]").forEach(a=>{const id=String(a.dataset.pid).slice(2);const ph=a.querySelector(".ph");if(ph&&!a.querySelector(".arq8-bar"))ph.insertAdjacentHTML("afterend",`<div class="arq8-bar gut"><span>Arquivado · só você vê</span><button type="button" class="btn ghost" data-u8arq="${esc(id)}" data-on="0">Mostrar no perfil</button></div>`)})}}catch(e){}return r}}

/* ===== 3. curtir comentário (posts de membros e notícias: a mesma folha de comentários) ===== */
var CC8={m:{},pid:null,t:0,carregando:false};
const cc8K=(autor,cid)=>autor+"\u0001"+cid;
async function cc8Carregar(){if(!V8.on||!SB||!S.uid||CC8.carregando)return;CC8.carregando=true;
  try{const r=await SB.from("com_curtidas").select("autor,cid,pub,uid").limit(5000);if(!r.error){const m={};(r.data||[]).forEach(x=>{(m[cc8K(x.autor,x.cid)]=m[cc8K(x.autor,x.cid)]||new Set()).add(x.uid)});CC8.m=m;CC8.t=Date.now()}}catch(e){}
  finally{CC8.carregando=false}cc8Pinta()}
function cc8Do(li){const a=li.querySelector("[data-apagar]"),d=li.querySelector("[data-denc]");if(a)return {cid:a.dataset.apagar,autor:a.dataset.au||S.uid};if(d)return {cid:d.dataset.denc,autor:d.dataset.du};return null}
function cc8Pinta(){if(!V8.on)return;const box=$("#cbox");if(!box)return;
  box.querySelectorAll(".clist > li").forEach(li=>{const c=cc8Do(li);if(!c||!c.cid||!c.autor)return;const s=CC8.m[cc8K(c.autor,c.cid)],n=s?s.size:0,on=!!(s&&s.has(S.uid));
    let b=li.querySelector(":scope > .cc8");if(!b){li.insertAdjacentHTML("beforeend",`<button type="button" class="cc8" data-cc8 aria-pressed="false" aria-label="Curtir comentário">${ICON.like}<em></em></button>`);b=li.querySelector(":scope > .cc8")}
    b.dataset.cid=c.cid;b.dataset.autor=c.autor;b.setAttribute("aria-pressed",String(on));b.classList.toggle("on",on);b.setAttribute("aria-label",(on?"Tirar curtida":"Curtir comentário")+(n?` · ${n} ${n===1?"curtida":"curtidas"}`:""));b.querySelector("em").textContent=n?String(n):""})}
async function cc8Alterna(b){if(precisaConta())return;const cid=b.dataset.cid,autor=b.dataset.autor,pid=CC8.pid||"";if(!cid||!autor)return;
  const k=cc8K(autor,cid),s=CC8.m[k]=CC8.m[k]||new Set(),on=!s.has(S.uid);if(on)s.add(S.uid);else s.delete(S.uid);cc8Pinta();vibrar(8);
  try{let r;if(on)r=await SB.from("com_curtidas").insert({autor,cid,pub:/^u:[0-9a-f-]{36}$/i.test(pid)?pid.slice(2):null,uid:S.uid});
    else r=await SB.from("com_curtidas").delete().eq("autor",autor).eq("cid",cid).eq("uid",S.uid);
    if(r&&r.error&&!(on&&/23505/.test(v8Erro(r))))throw r.error}
  catch(e){if(on)s.delete(S.uid);else s.add(S.uid);cc8Pinta();const m=String((e&&(e.code||""))+" "+(e&&e.message||""));
    toast(/54000|demais/.test(m)?"Muitas curtidas seguidas. Espere um minuto.":/42501|row-level|policy/i.test(m)?"Este comentário não está mais disponível.":"Não deu para curtir agora. Tente de novo.")}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#cbox [data-cc8]");if(!b)return;e.stopPropagation();e.preventDefault();cc8Alterna(b)},true);
{const _oc8=openComments;openComments=function(pid){const r=_oc8.apply(this,arguments);try{CC8.pid=pid;if(V8.on){const f=S._reCmt;if(f)S._reCmt=function(){const x=f.apply(this,arguments);cc8Pinta();return x};cc8Pinta();if(Date.now()-CC8.t>800)cc8Carregar()}}catch(e){}return r}}
function cc8Ouvir(){try{if(!SB.channel||cc8Ouvir.ok)return;cc8Ouvir.ok=1;const ch=SB.channel("cc8-"+Math.random().toString(36).slice(2,7));
  ch.on("postgres_changes",{event:"INSERT",schema:"public",table:"com_curtidas"},p=>{if(p&&p.table&&p.table!=="com_curtidas")return;clearTimeout(cc8Ouvir.t);cc8Ouvir.t=setTimeout(()=>{if($("#cbox"))cc8Carregar();at8Carregar().then(()=>{atDot();atRedesenha()})},500)});ch.subscribe()}catch(e){}}

/* ===== 4. Atividade: "Bia curtiu seu comentário: “…”" ===== */
AT.cc8=[];
async function at8Carregar(){if(!V8.on||!SB||!S.uid)return;try{const desde=Date.now()-30*864e5;const r=await SB.from("com_curtidas").select("autor,cid,pub,uid,at").eq("autor",S.uid).gt("at",desde).order("at",{ascending:false}).limit(500);
  if(!r.error)AT.cc8=(r.data||[]).filter(x=>x.uid!==S.uid)}catch(e){}}
{const _ac8=atCarregar;atCarregar=async function(){const r=await _ac8.apply(this,arguments);if(V8.on){await at8Carregar();atDot();atRedesenha()}return r}}
function at8Coment(x){if(x.pub){const c=(PS.cm&&PS.cm[x.pub]||[]).find(c=>c.id===x.cid&&c.uid===S.uid);return c?{texto:c.texto,pid:"u:"+x.pub}:{texto:"",pid:"u:"+x.pub}}
  const d=(S._cmtDocs||[]).find(([u])=>u===S.uid),v=d&&d[1]&&d[1].itens&&d[1].itens[x.cid];return v&&v.pid?{texto:String(v.texto||""),pid:v.pid}:null}
{const _ai8=atItens;atItens=function(){const it=_ai8.apply(this,arguments);if(!V8.on||!S.uid||!S.membro||!(AT.cc8||[]).length)return it;
  try{const g={};AT.cc8.forEach(x=>{if(!S.amigos.has(x.uid)&&!S.membros[x.uid])return;const k=(x.pub||"")+"|"+x.cid;(g[k]=g[k]||{x,us:[],at:0}).us.push([x.uid,+x.at]);g[k].at=Math.max(g[k].at,+x.at)});
    Object.entries(g).forEach(([k,o])=>{const c=at8Coment(o.x);if(!c)return;const us=o.us.sort((a,b)=>b[1]-a[1]).map(a=>a[0]);const t=String(c.texto||"");
      it.push({k:"cc8:"+k,at:o.at,us,ic:"♥",txt:`<b>${esc(atJunta(us))}</b> ${us.length>1?"curtiram":"curtiu"} seu comentário${t?`: “${esc(t.length>80?t.slice(0,79).trimEnd()+"…":t)}”`:""}`,cpid:c.pid,acao:"cc8"})})}catch(e){}
  return it.sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}}
{const _aa8=atAcao;atAcao=function(x){if(x&&x.acao==="cc8"){if($("#layer .pfv-at"))closeLayer();setTimeout(()=>openComments(x.cpid),320);return}return _aa8.apply(this,arguments)}}

/* ===== 5. acabamentos ===== */
/* post arquivado ou mostrado em outro aparelho: o Feed e o perfil se redesenham na próxima leitura */
{const _pca8=pubCarregar;pubCarregar=async function(){const r=await _pca8.apply(this,arguments);try{const k=PUB.itens.filter(x=>x.arquivado).map(x=>x.id).sort().join();if(k!==PUB.arq8k){const ant=PUB.arq8k;PUB.arq8k=k;if(ant!==undefined){pubRedesenha();if(VIEW==="me")renderMe()}}}catch(e){}return r}}
/* Administração › Uso: nome da tabela nova */
try{ESP_NOMES.com_curtidas="Curtidas em comentários"}catch(e){}
