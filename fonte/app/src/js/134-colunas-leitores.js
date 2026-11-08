/* ---------- 134: colunas, fase 3 — leitores e números ----------
   1. Números da coluna (só a autora; botão "Leitores" na página da coluna e em "Minhas colunas"): leituras (pessoas),
      quantas chegaram ao fim (rolaram 90% do texto), tempo médio, de onde vieram (Feed, perfil, hashtag, série, busca,
      conversa, notificação), curtidas, comentários, reposts, envios, gráfico dos 14 primeiros dias e "Suas colunas mais lidas".
      A leitura é anônima: a autora vê só os totais. Nomes, só de quem já curtiu ou comentou (o app já mostra) e é amigo ou
      segue a autora. Registro: função coluna_leitura() (sql/publicacoes-v13.sql), no máximo ao abrir, ao chegar ao fim e
      ao sair; a da própria autora não conta.
   2. Seguir uma série ou as colunas de alguém, sem seguir a pessoa ("Seguir esta série" / "Avisar sobre novas colunas de X"):
      tabela coluna_assinaturas; coluna nova vira item na Atividade (só das colunas que a pessoa já pode ler) e aviso no
      celular do tipo novo "colunas_seguidas" (liga/desliga em Notificações; no celular, desligado por padrão).
   3. Comentários em destaque: a autora fixa até 3 comentários ("Destaque da autora", no topo dos comentários da coluna) e
      responde; o comentário da autora aparece com o selo "Autora" (este selo não depende da v13).
   4. Citar trecho: selecionar até 280 caracteres do texto mostra "Citar trecho" (post com a citação ligada à coluna, em bloco
      "Coluna de Nome") e "Copiar trecho" ("— Nome, no Prumo"). Não depende da v13.
   Sem a v13 o app detecta e esconde 1, 2 e o fixar. Nomes globais com o prefixo lt134 / LT134. */

var LT134={v13:null,n:0,uid:null,tk:0,ctx:null,notif:null,forca:null,ses:null,assin:[],dest:{},destT:{},mais:null,sel:null,selT:0,selH:0};
const LT134_ORIG=[["feed","Feed"],["perfil","Perfil"],["hashtag","Hashtag"],["serie","Série"],["busca","Busca"],["conversa","Conversa ou envio"],["notificacao","Notificação"],["outro","Outros caminhos"]];
const LT134_IC={num:'<path d="M5 19V11M10 19V5M15 19v-6M20 19V8"/>',pin:'<path d="M9 4h6l-1 5 3 3H7l3-3z"/><path d="M12 12v8"/>'};
const lt134Svg=d=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const lt134Prim=u=>String(nomeDe(u)||"").split(" ")[0]||"a autora";
const lt134N=(n,a,b)=>`${cs123Num(n)} ${n===1?a:b}`;
const lt134Erro=e=>String((e&&(e.code||""))+" "+(e&&e.message||""));

/* ===== 0. detectar a v13 ===== */
async function lt134Testa(){if(LT134.v13!==null||typeof SB==="undefined"||!SB||!S.uid||!S.membro)return LT134.v13;
  try{const r=await SB.from("coluna_assinaturas").select("autor").limit(1);
    if(!r.error)LT134.v13=true;else if(ED132_FALTA.test(lt134Erro(r.error)))LT134.v13=false}catch(e){}
  if(LT134.v13){lt134Assin();lt134PaginaRedesenha()}return LT134.v13}
setInterval(()=>{if(S.uid!==LT134.uid){LT134.uid=S.uid;LT134.v13=null;LT134.n=0;LT134.assin=[];LT134.dest={};LT134.destT={};LT134.mais=null;LT134.ses=null}
  if(++LT134.tk%3===0&&LT134.v13===null&&S.uid&&S.membro&&LT134.n<30){LT134.n++;lt134Testa()}
  if(LT134.tk%300===0&&LT134.v13===true&&!document.hidden)lt134Assin();
  try{lt134Tique()}catch(e){}},1000);

/* ===== 1. de onde a pessoa abriu a coluna ===== */
function lt134Onde(t){if(!t||!t.closest)return "outro";
  if(t.closest(".ed132-nav"))return "serie";
  if(t.closest(".pfv-at,.nt124-desde"))return "notificacao";
  if(t.closest(".ht-pg"))return "hashtag";
  if(t.closest("#v-busca,#sres,#bvres,.cs123-bus"))return "busca";
  if(t.closest("#v-msgs,.dm-m"))return "conversa";
  if(t.closest(".pfv,#v-me"))return "perfil";
  if(t.closest("#v-feed"))return "feed";
  return "outro"}
["pointerdown","click"].forEach(k=>window.addEventListener(k,e=>{LT134.ctx={o:lt134Onde(e.target),t:Date.now()}},true));
/* veio de um aviso (Atividade ou celular) */
if(typeof nt124AbrePub==="function"){const _ap=nt124AbrePub;nt124AbrePub=function(id){LT134.notif={id:String(id||""),t:Date.now()};return _ap.apply(this,arguments)}}
{const _aa=atAcao;atAcao=function(x){if(x&&x.acao==="lt134col"){const id=x.col;if($("#layer .pfv-at"))closeLayer();setTimeout(()=>{LT134.forca="notificacao";cs123Abrir(id)},320);return}
  if(x&&x.pub)LT134.notif={id:String(x.pub),t:Date.now()};return _aa.apply(this,arguments)}}
if(typeof nt124RotaTenta==="function"){const _rt=nt124RotaTenta;nt124RotaTenta=function(n){const nt=NT124.rota;
  if(nt&&/^coluna:[0-9a-f-]{36}$/i.test(nt)&&nt124Pronto()){NT124.rota=null;const id=nt.slice(7);try{if($("#layer2")?.innerHTML||$("#layer").innerHTML)closeLayer()}catch(e){}
    setTimeout(async()=>{try{if(!pubDe(id))await pubCarregar()}catch(e){}if(pubDe(id)){LT134.forca="notificacao";cs123Abrir(id)}else abrirAtividade()},60);return}
  return _rt.apply(this,arguments)}}

/* ===== 2. registrar a leitura (só de quem não é a autora) ===== */
{const _ab=cs123Abrir;cs123Abrir=function(id){const c=LT134.ctx,nf=LT134.notif;let o=c&&Date.now()-c.t<2500?c.o:"outro";
  if(nf&&nf.id===id&&Date.now()-nf.t<120e3){o="notificacao";LT134.notif=null}if(LT134.forca){o=LT134.forca;LT134.forca=null}
  lt134Fim();const r=_ab.apply(this,arguments);try{lt134Comeca(id,o)}catch(e){}return r}}
const lt134Raiz=()=>document.querySelector("#layer > .cs123-ler:not(.cs123-prev)");
function lt134Comeca(id,o){if(!CS123.ler||CS123.ler.id!==id||!lt134Raiz())return;const x=pubDe(id)||pubVisiveis().find(y=>y.id===id);if(!x)return;
  if(LT134.v13===true)lt134DestCarrega(id);
  if(!S.uid||x.autor===S.uid)return;
  const s=LT134.ses={id,o,seg:0,fim:false,ini:false,env:{seg:-1,fim:false,t:0}};const sc=lt134Raiz().querySelector(".cs123-sc");
  if(sc)sc.addEventListener("scroll",()=>lt134Rolou(s),{passive:true});lt134Rolou(s,true);lt134Envia(s,true)}
function lt134Rolou(s,ini){if(s!==LT134.ses||s.fim)return;const r=lt134Raiz(),sc=r&&r.querySelector(".cs123-sc"),cp=r&&r.querySelector(".cs123-corpo");if(!sc||!cp)return;
  const a=cp.getBoundingClientRect(),b=sc.getBoundingClientRect();if(a.height<=0)return;
  if((b.bottom-a.top)/a.height>=.9){s.fim=true;if(!ini)lt134Envia(s,true)}}
function lt134Envia(s,forca){if(!s||LT134.v13!==true||typeof SB==="undefined"||!SB||!S.uid)return;const E=s.env,seg=Math.min(3600,Math.round(s.seg));
  if(s.ini&&E.fim===s.fim&&seg-E.seg<1)return;if(!forca&&Date.now()-E.t<4000)return;
  E.fim=s.fim;E.seg=seg;E.t=Date.now();s.ini=true;s.n=(s.n||0)+1;
  try{Promise.resolve(SB.rpc("coluna_leitura",{p_pub:s.id,p_origem:s.o,p_fim:s.fim,p_segundos:seg})).catch(()=>{})}catch(e){}}
/* a cada segundo: conta o tempo com a coluna aberta e à vista; fechou (ou trocou de coluna) = manda o fim */
function lt134Tique(){const s=LT134.ses;if(!s)return;const aberta=CS123.ler&&CS123.ler.id===s.id&&lt134Raiz();
  if(!aberta){lt134Fim();return}if(!document.hidden)s.seg++;if(!s.ini)lt134Envia(s,true)}
function lt134Fim(){const s=LT134.ses;if(!s)return;LT134.ses=null;lt134Envia(s,true)}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&LT134.ses)lt134Envia(LT134.ses,true)});
addEventListener("pagehide",()=>{if(LT134.ses)lt134Envia(LT134.ses,true)});

/* ===== 3. a página da coluna: "Leitores" (autora), seguir série/autora (leitor), destaques ===== */
{const _lh=cs123LerHTML;cs123LerHTML=function(x,c,o){let h=_lh.apply(this,arguments);try{if(o&&o.prev||!x||!c||LT134.v13!==true||!S.uid)return h;
  if(x.autor===S.uid)h=h.replace(/(<span class="cs123-tk">[^<]*<\/span>(?:<button type="button" class="ex133-eb"[^>]*>[\s\S]*?<\/button>)?)/,`$1<button type="button" class="lt134-lb" data-lt134num="${esc(x.id)}" aria-label="Leitores e números da coluna">${lt134Svg(LT134_IC.num)}<span>Leitores</span></button>`);
  else h=h.replace(/(<p class="cs123-aviso">)/,`<div class="lt134-ass" data-lt134ass="${esc(x.id)}">${lt134AssHTML(x,c)}</div>$1`)}catch(e){}return h}}
function lt134PaginaRedesenha(){try{const L=CS123.ler,r=lt134Raiz();if(!L||!r||r.querySelector(".lt134-lb,.lt134-ass"))return;const x=pubDe(L.id),c=x&&cs123Col(x);if(!c)return;
  const tp=document.createElement("template");tp.innerHTML=cs123LerHTML(x,c);const n=tp.content.firstElementChild;if(!n)return;
  const lb=n.querySelector(".lt134-lb"),as=n.querySelector(".lt134-ass");if(lb){const ref=r.querySelector(".cs123-top .ex133-eb")||r.querySelector(".cs123-top .cs123-tk");if(ref)ref.after(lb)}
  if(as){const av=r.querySelector(".cs123-art > .cs123-aviso");if(av)av.before(as)}if(LT134.v13===true)lt134DestCarrega(L.id)}catch(e){}}

/* ----- seguir série / colunas da autora ----- */
const lt134SerK=s=>norm(s).trim();
function lt134AssExata(autor,serie){const k=lt134SerK(serie);return LT134.assin.find(a=>a.autor===autor&&lt134SerK(a.serie)===k)||null}
function lt134AssDe(autor,serie){const k=lt134SerK(serie);return (k&&LT134.assin.find(a=>a.autor===autor&&a.serie&&lt134SerK(a.serie)===k))||LT134.assin.find(a=>a.autor===autor&&!a.serie)||null}
function lt134AssHTML(x,c){const u=x.autor,p=esc(lt134Prim(u)),se=c.serie||"",sa=se&&lt134AssExata(u,se),ta=lt134AssExata(u,"");
  const bt=(on,serie,a,b)=>`<button type="button" class="lt134-ab${on?" on":""}" data-lt134assu="${esc(u)}" data-lt134asss="${esc(serie)}" aria-pressed="${!!on}">${on?"✓ ":""}${a}${b?`<small>${b}</small>`:""}</button>`;
  return `${se?bt(sa,se,sa?"Seguindo a série":"Seguir esta série",esc(se)):""}${bt(ta,"",ta?`Avisando sobre as colunas de ${p}`:`Avisar sobre novas colunas de ${p}`,"")}
    <p class="lt134-ah">Sem seguir a pessoa: você é avisado na Atividade quando sair coluna nova${se?" da série":""} (e no celular, se ligar em Perfil › Conta › Notificações).</p>`}
function lt134AssRedesenha(){document.querySelectorAll("[data-lt134ass]").forEach(el=>{const x=pubDe(el.dataset.lt134ass),c=x&&cs123Col(x);if(c)el.innerHTML=lt134AssHTML(x,c)})}
async function lt134Assin(){if(LT134.v13!==true||typeof SB==="undefined"||!SB||!S.uid)return;try{const r=await SB.from("coluna_assinaturas").select("autor,serie,at");if(r.error)return;
  LT134.assin=(r.data||[]).map(a=>({autor:String(a.autor),serie:cs123S(a.serie,60),at:+a.at||0}));lt134AssRedesenha();try{atRedesenha();nt124Pinta()}catch(e){}}catch(e){}}
async function lt134AssTroca(autor,serie,b){if(precisaConta()||LT134.v13!==true||!autor)return;serie=String(serie||"").trim().slice(0,60);const tem=lt134AssExata(autor,serie),p=lt134Prim(autor);if(b)b.disabled=true;
  try{if(tem){const r=await SB.from("coluna_assinaturas").delete().eq("autor",autor).eq("serie",tem.serie);if(r&&r.error)throw r.error;LT134.assin=LT134.assin.filter(a=>a!==tem);
      toast(serie?`Você não segue mais a série “${serie}”.`:`Pronto: sem avisos das colunas de ${p}.`)}
    else{const r=await SB.from("coluna_assinaturas").insert({autor,serie}).select("autor,serie,at");if(r.error)throw r.error;const d=(r.data||[])[0]||{};LT134.assin.push({autor,serie,at:+d.at||Date.now()});
      toast(serie?`Seguindo a série “${serie}”: você é avisado quando sair coluna nova.`:`Pronto: você é avisado quando ${p} publicar coluna nova.`);uso("coluna_assinar")}}
  catch(e){toast(/200/.test(lt134Erro(e))?"Você já segue 200 séries e colunistas. Deixe de seguir algum para seguir este.":"Não deu para mudar agora.")}
  lt134AssRedesenha();try{atRedesenha()}catch(e){}}

/* ----- Atividade: coluna nova de série/autora assinada (só as que a pessoa já pode ler) ----- */
{const _ai=atItens;atItens=function(){let it=_ai.apply(this,arguments);try{if(LT134.v13!==true||!LT134.assin.length||!Array.isArray(it)||!S.uid)return it;const ag=Date.now(),novos=[],ids=new Set();
    pubVisiveis().forEach(x=>{if(!x||x.autor===S.uid||x.tipo!=="post"||ag-x.at>30*864e5)return;const c=cs123Col(x);if(!c)return;const a=lt134AssDe(x.autor,c.serie);if(!a||x.at<a.at)return;ids.add(x.id);
      const t=c.tit.length>80?c.tit.slice(0,79).trimEnd()+"…":c.tit;
      novos.push({k:"lt134c:"+x.id,at:x.at,us:[x.autor],ic:"✎",txt:`<b>${esc(nomeDe(x.autor))}</b> ${a.serie?`publicou na série “${esc(c.serie)}”`:"publicou uma coluna"}: “${esc(t)}”`,col:x.id,acao:"lt134col"})});
    if(novos.length)it=it.filter(y=>!(y&&/^nt124c:/.test(String(y.k))&&ids.has(String(y.k).slice(7)))).concat(novos).sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}catch(e){}return it}}
/* o tipo novo nas Notificações (só com a v13) */
try{NT124_TIPOS.push(["colunas_seguidas","Séries e colunistas que você assina","Coluna nova de quem você escolheu ser avisado, sem seguir a pessoa","✎",0]);
  NT124_PLURAL.colunas_seguidas=["coluna nova de série assinada","colunas novas de séries assinadas"]}catch(e){}
{const _nt=nt124Tipos;nt124Tipos=function(){const l=_nt.apply(this,arguments);return LT134.v13===true?l:l.filter(t=>t[0]!=="colunas_seguidas")}}
{const _nc=nt124Cat;nt124Cat=function(x){return /^lt134c:/.test(String(x&&x.k||""))?"colunas_seguidas":_nc.apply(this,arguments)}}

/* ===== 4. comentários: selo "Autora" e destaques ===== */
const lt134Au=()=>`<em class="lt134-au">Autora</em>`;
async function lt134DestCarrega(id){if(LT134.v13!==true||typeof SB==="undefined"||!SB||!id)return;if(Date.now()-(LT134.destT[id]||0)<1500)return;LT134.destT[id]=Date.now();
  try{const r=await SB.from("coluna_destaques").select("cautor,cid,txt,nome,at").eq("pub",id);if(r.error)return;
    const l=(r.data||[]).map(d=>({cautor:String(d.cautor),cid:String(d.cid),txt:cs123S(d.txt,600),nome:cs123S(d.nome,80),at:+d.at||0})).sort((a,b)=>a.at-b.at).slice(0,3);
    const k=JSON.stringify(l),mudou=JSON.stringify(LT134.dest[id]||null)!==k;LT134.dest[id]=l;if(mudou){cs123FimAtualiza();lt134CmDecora()}}catch(e){}}
const lt134Nome=d=>S.membros[d.cautor]||d.cautor===S.uid?nomeDe(d.cautor):(d.nome||nomeDe(d.cautor));
function lt134DestHTML(x){const l=LT134.v13===true&&LT134.dest[x.id];if(!l||!l.length)return "";const eu=x.autor===S.uid;
  return `<section class="lt134-dest" aria-label="Destaque da autora"><p class="lt134-dk">${lt134Svg(LT134_IC.pin)}Destaque da autora</p><ul>${l.map(d=>`<li>${avatar(d.cautor)}<div><p><b>${esc(lt134Nome(d))}</b>${d.cautor===x.autor?lt134Au():""} ${esc(d.txt)}</p>
    <span class="lt134-da"><button type="button" data-lt134resp="${esc(x.id)}" data-n="${esc(lt134Nome(d))}">Responder</button>${eu?`<button type="button" data-lt134fix="${esc(x.id)}" data-au="${esc(d.cautor)}" data-cid="${esc(d.cid)}">Desafixar</button>`:""}</span></div></li>`).join("")}</ul></section>`}
{const _fh=cs123FimHTML;cs123FimHTML=function(x){let h=_fh.apply(this,arguments);try{if(!x)return h;
  if(h.indexOf('class="cs123-cms"')>=0){const ult=socialOf("u:"+x.id).cm.slice(-2),tp=document.createElement("template");tp.innerHTML=h;
    tp.content.querySelectorAll(".cs123-cms > li").forEach((li,i)=>{const c=ult[i];if(c&&c.uid===x.autor){const b=li.querySelector("span > b");if(b)b.insertAdjacentHTML("afterend",lt134Au())}});h=tp.innerHTML}
  h=lt134DestHTML(x)+h}catch(e){}return h}}
/* na folha de comentários da coluna: "Autora", "Fixar"/"Desafixar" e o selo "Fixado" */
function lt134CmDo(li){const a=li.querySelector("[data-apagar]"),d=li.querySelector("[data-denc]");if(a)return {cid:a.dataset.apagar,autor:a.dataset.au||S.uid};if(d)return {cid:d.dataset.denc,autor:d.dataset.du};return null}
function lt134CmDecora(){const pid=LT134.cpid,m=/^u:(.+)$/.exec(String(pid||"")),x=m&&pubDe(m[1]),box=$("#cbox");if(!x||!box||!cs123Col(x)||typeof CMT_PID!=="undefined"&&CMT_PID!==pid)return;
  const l=LT134.dest[x.id]||[],eu=x.autor===S.uid&&LT134.v13===true;
  box.querySelectorAll(".clist > li").forEach(li=>{const c=lt134CmDo(li);if(!c)return;const sp=li.querySelector(":scope > div > span");
    if(c.autor===x.autor&&sp&&!sp.querySelector(".lt134-au")){const b=sp.querySelector("b");if(b)b.insertAdjacentHTML("afterend",lt134Au())}
    const fx=l.some(d=>d.cautor===c.autor&&d.cid===c.cid);li.classList.toggle("lt134-fx",fx);
    let k=li.querySelector(".lt134-fk");if(fx&&!k&&sp)sp.insertAdjacentHTML("beforebegin",`<small class="lt134-fk">${lt134Svg(LT134_IC.pin)}Fixado pela autora</small>`);else if(!fx&&k)k.remove();
    const ac=li.querySelector(":scope > div > i");if(!eu||!ac)return;let b=ac.querySelector("[data-lt134fix]");
    if(!b){ac.insertAdjacentHTML("beforeend",`<button type="button" class="c-a" data-lt134fix="${esc(x.id)}" data-au="${esc(c.autor)}" data-cid="${esc(c.cid)}"></button>`);b=ac.querySelector("[data-lt134fix]")}
    b.textContent=fx?"Desafixar":"Fixar"});
  /* os fixados vão para o topo, na ordem em que foram fixados */
  const ul=box.querySelector(".clist");if(ul)l.slice().reverse().forEach(d=>{const li=[...ul.children].find(li=>{const c=lt134CmDo(li);return c&&c.autor===d.cautor&&c.cid===d.cid});if(li&&ul.firstElementChild!==li)ul.prepend(li)})}
{const _oc=openComments;openComments=function(pid){const r=_oc.apply(this,arguments);try{const m=/^u:(.+)$/.exec(String(pid||"")),x=m&&pubDe(m[1]);
  if(x&&cs123Col(x)){LT134.cpid=pid;const rc=S._reCmt;if(rc)S._reCmt=function(){const q=rc.apply(this,arguments);try{lt134CmDecora()}catch(e){}return q};lt134CmDecora();lt134DestCarrega(x.id)}else LT134.cpid=null}catch(e){}return r}}
async function lt134Fixa(id,cautor,cid,b){if(LT134.v13!==true||typeof SB==="undefined"||!SB)return;const l=LT134.dest[id]||[],ja=l.find(d=>d.cautor===cautor&&d.cid===cid);if(b)b.disabled=true;
  try{if(ja){const r=await SB.from("coluna_destaques").delete().eq("pub",id).eq("cautor",cautor).eq("cid",cid);if(r&&r.error)throw r.error;toast("Comentário desafixado")}
    else{if(l.length>=3){toast("Você já fixou 3 comentários. Desafixe um para fixar outro.");return}const r=await SB.from("coluna_destaques").insert({pub:id,cautor,cid}).select("cid");if(r.error)throw r.error;toast("Comentário fixado no topo da coluna");uso("coluna_fixar")}
    LT134.destT[id]=0;await lt134DestCarrega(id)}
  catch(e){const s=lt134Erro(e);toast(/3 destaques/.test(s)?"Você já fixou 3 comentários. Desafixe um para fixar outro.":"Não deu para fixar agora.");LT134.destT[id]=0;lt134DestCarrega(id)}
  finally{if(b&&b.isConnected)b.disabled=false}}
function lt134Responde(id,nome){const pid="u:"+id;try{openComments(pid)}catch(e){return}setTimeout(()=>{const i=$("#ctext"),bt=$("#cform .sendc");if(!i)return;i.value="@"+nome+" ";if(bt)bt.disabled=false;try{i.focus()}catch(e){}},80)}

/* ===== 5. números para a autora ===== */
function lt134Tempo(s){s=Math.round(+s||0);if(!s)return "—";if(s<60)return s+" s";const m=Math.floor(s/60),r=s%60;return r?`${m} min ${r} s`:`${m} min`}
function lt134Barras(tit,l){const mx=Math.max(1,...l.map(i=>i.v));return `<div class="gn lt134-gn"><span class="lbl">${esc(tit)}</span><ul class="gn-b">${l.map(i=>`<li><span class="gn-r">${esc(i.r)}</span><span class="gn-t"><i style="width:${Math.max(1.5,i.v*100/mx).toFixed(1)}%"></i><b>${cs123Num(i.v)}</b></span></li>`).join("")}</ul></div>`}
function lt134Conhece(u){return !!u&&u!==S.uid&&(S.amigos.has(u)||(CS123.segs||[]).some(s=>s.uid===u))}
function lt134MaisHTML(l){l=(l||[]).filter(o=>o&&o.pub);if(!l.length)return `<p class="hint">Quando alguém ler as suas colunas, as mais lidas aparecem aqui.</p>`;
  return `<ol class="lt134-ml">${l.slice(0,10).map(o=>{const x=ed132Pub(String(o.pub)),c=x&&cs123Col(x);return `<li><button type="button" data-lt134num="${esc(String(o.pub))}"><b>${esc(c?c.tit:"Coluna")}</b><small>${lt134N(+o.leituras||0,"leitura","leituras")} · ${cs123Num(+o.fim||0)} até o fim</small><i aria-hidden="true">›</i></button></li>`}).join("")}</ol>`}
function lt134PainelHTML(x,c,d,mais){d=d||{};const L=+d.leituras||0,F=+d.fim||0,pc=L?Math.round(F*100/L):0,o=d.origens&&typeof d.origens==="object"?d.origens:{},dias=Array.isArray(d.dias)?d.dias.slice(0,14).map(v=>+v||0):[];
  const ori=LT134_ORIG.map(([k,t])=>({r:t,v:+o[k]||0})).filter(i=>i.v>0),pid="u:"+x.id,{likes,cm}=socialOf(pid);
  const cur=likes.filter(lt134Conhece),com=[...new Set(cm.map(z=>z.uid))].filter(lt134Conhece),nm=l=>l.slice(0,6).map(u=>esc(nomeDe(u))).join(", ")+(l.length>6?` e mais ${l.length-6}`:"");
  const hoje=Math.floor((Date.now()-(+d.at||+x.at||0))/864e5);
  let graf="";try{graf=dias.length===14&&typeof graficoNoticia==="function"?graficoNoticia({forma:"colunas",titulo:"Leituras nos primeiros 14 dias",itens:dias.map((v,i)=>({rotulo:String(i+1),valor:v,destaque:i===hoje}))}):""}catch(e){graf=""}
  return `<p class="lt134-tt">${esc(c.tit)}</p><p class="hint lt134-pr">A leitura é anônima: você vê só os totais, nunca quem leu. Cada pessoa conta uma vez; a sua leitura não conta.</p>
    <div class="lt134-k" role="list"><div role="listitem"><b data-lt134v="leituras">${cs123Num(L)}</b><span>${L===1?"leitura":"leituras"}</span><small>pessoas que abriram</small></div>
      <div role="listitem"><b data-lt134v="fim">${cs123Num(F)}</b><span>chegaram ao fim</span><small>${L?pc+"% de quem abriu":"rolaram 90% do texto"}</small></div>
      <div role="listitem"><b data-lt134v="tempo">${esc(lt134Tempo(d.seg_medio))}</b><span>tempo médio</span><small>de leitura</small></div></div>
    <h4 class="lt134-h">De onde vieram</h4>${ori.length?lt134Barras("Leituras por caminho",ori):`<p class="hint">Ninguém leu ainda.</p>`}
    <h4 class="lt134-h">Reações</h4><ul class="lt134-re"><li><b data-lt134v="curtidas">${cs123Num(+d.curtidas||0)}</b> ${+d.curtidas===1?"curtida":"curtidas"}</li><li><b data-lt134v="comentarios">${cs123Num(+d.comentarios||0)}</b> ${+d.comentarios===1?"comentário":"comentários"}</li>
      <li><b data-lt134v="reposts">${cs123Num((+d.reposts||0)+(+d.citacoes||0))}</b> ${(+d.reposts||0)+(+d.citacoes||0)===1?"repost":"reposts"}${+d.citacoes?` <small>(${cs123Num(+d.citacoes)} com comentário)</small>`:""}</li><li><b data-lt134v="envios">${cs123Num(+d.envios||0)}</b> ${+d.envios===1?"envio":"envios"}</li></ul>
    ${graf?`<div class="lt134-g">${graf}<p class="hint">Dia 1 é o dia da publicação.</p></div>`:""}
    ${cur.length||com.length?`<h4 class="lt134-h">Quem você conhece</h4><div class="lt134-nm">${cur.length?`<p><b>Curtiram:</b> ${nm(cur)}</p>`:""}${com.length?`<p><b>Comentaram:</b> ${nm(com)}</p>`:""}<p class="hint">Só amigos e seguidores que curtiram ou comentaram. Quem só leu não aparece.</p></div>`:""}
    <h4 class="lt134-h">Suas colunas mais lidas</h4>${lt134MaisHTML(mais)}`}
async function lt134Numeros(id){if(precisaConta()||LT134.v13!==true||typeof SB==="undefined"||!SB)return;const x=ed132Pub(id)||pubDe(id),c=x&&cs123Col(x);if(!c||x.autor!==S.uid){toast("Só a autora vê os números da coluna.");return}
  ex133Folha("Leitores",`<div id="lt134-np" class="lt134-np" data-pub="${esc(id)}"><p class="hint">Carregando…</p></div>`);uso("coluna_numeros");
  try{const [r,m]=await Promise.all([SB.rpc("coluna_numeros",{p_pub:id}),SB.rpc("coluna_mais_lidas")]);if(r.error)throw r.error;if(m&&!m.error)LT134.mais=m.data||[];
    const box=$("#lt134-np");if(box&&box.dataset.pub===id)box.innerHTML=lt134PainelHTML(x,c,r.data,LT134.mais)}
  catch(e){const box=$("#lt134-np");if(box)box.innerHTML=`<p class="erro-t">Não deu para carregar os números agora.</p>`}}
/* Minhas colunas: "Suas colunas mais lidas" com "Leitores" em cada uma */
{const _hh=ed132HubHTML;ed132HubHTML=function(){let h=_hh.apply(this,arguments);try{if(LT134.v13!==true)return h;
  const minhas=PUB.itens.filter(x=>x&&x.autor===S.uid&&cs123Col(x)&&!ed132Agendada(x)),lidas=new Map((LT134.mais||[]).map(o=>[String(o.pub),o]));if(!minhas.length)return h;
  const l=minhas.map(x=>({x,o:lidas.get(x.id)})).sort((a,b)=>((b.o&&+b.o.leituras)||0)-((a.o&&+a.o.leituras)||0)||b.x.at-a.x.at).slice(0,10);
  const sec=`<h3 class="ed132-hh">Suas colunas mais lidas <small>só você vê os números</small></h3><ul class="ed132-hl lt134-hub">${l.map(({x,o})=>`<li><span class="ed132-hi"><b>${esc(cs123Col(x).tit)}</b><small>${o?`${lt134N(+o.leituras||0,"leitura","leituras")} · ${cs123Num(+o.fim||0)} até o fim`:"Ninguém leu ainda"}</small></span><span class="ed132-hb"><button type="button" class="btn ghost" data-lt134num="${esc(x.id)}">${lt134Svg(LT134_IC.num)}Leitores</button></span></li>`).join("")}</ul>`;
  const i=h.lastIndexOf("</div></div>");return i>0?h.slice(0,i)+sec+h.slice(i):h+sec}catch(e){return h}}}
{const _hb=ed132Hub;ed132Hub=function(){const r=_hb.apply(this,arguments);try{if(LT134.v13===true&&SB)Promise.resolve(SB.rpc("coluna_mais_lidas")).then(m=>{if(m&&!m.error){LT134.mais=m.data||[];ed132HubRedesenha()}}).catch(()=>{});else if(LT134.v13===null)lt134Testa().then(v=>{if(v)ed132HubRedesenha()})}catch(e){}return r}}

/* ===== 6. citar e copiar um trecho ===== */
function lt134Trecho(x){const t=x&&x.estilo&&x.estilo.trecho;if(!t||typeof t!=="object"||Array.isArray(t))return null;const s=cs123S(t.t,300).replace(/\s+/g," ").trim();if(!s)return null;
  return {t:s,au:/^[0-9a-f-]{36}$/i.test(String(t.au||""))?String(t.au):"",n:cs123S(t.n,60).trim()}}
const lt134TrNome=tr=>tr.au&&(S.membros[tr.au]||tr.au===S.uid||(CS123.pess||{})[tr.au])?nomeDe(tr.au):(tr.n||"Membro");
function lt134CitHTML(tr,id){return `<blockquote class="lt134-cit"${id?` data-cs123ler="${esc(id)}"`:""}><p>“${esc(tr.t)}”</p><cite>Coluna de ${esc(lt134TrNome(tr))}</cite></blockquote>`}
{const _pp=pubPostHTML;pubPostHTML=function(x){const h=_pp.apply(this,arguments);try{const tr=lt134Trecho(x),rp=tr&&vn112Rp(x);if(!tr||typeof h!=="string"||!h)return h;
  const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)return h;a.classList.remove("vn-rp-so");a.classList.add("lt134-pc");
  a.querySelectorAll(".vn-rpk").forEach(k=>{const n=k.nextSibling;if(n&&n.nodeType===3&&/^\s*·\s*$/.test(n.nodeValue))n.remove();k.remove()});
  const blk=lt134CitHTML(tr,rp&&rp.k==="pub"?rp.id:""),w=a.querySelector(".vn-rpw"),q=w&&w.querySelector(".vn-q");
  if(q)q.insertAdjacentHTML("beforebegin",blk);else if(w)w.insertAdjacentHTML("beforeend",blk);else{const ph=a.querySelector(":scope>.ph");if(ph)ph.insertAdjacentHTML("afterend",`<div class="gut">${blk}</div>`);else a.insertAdjacentHTML("afterbegin",blk)}
  return a.outerHTML}catch(e){return h}}}
/* a citação com trecho não é "repost simples" (não some nem se junta no Feed) */
if(typeof dc122Simples==="function"){const _ds=dc122Simples;dc122Simples=function(x){return lt134Trecho(x)?null:_ds.apply(this,arguments)}}
/* seleção dentro do texto da coluna */
document.addEventListener("selectionchange",()=>{clearTimeout(LT134.selT);LT134.selT=setTimeout(lt134Sel,120)});
function lt134Sel(){let t="",id=null;try{const s=getSelection();if(s&&s.rangeCount&&!s.isCollapsed&&CS123.ler){const el=n=>n&&(n.nodeType===1?n:n.parentElement),a=el(s.anchorNode),f=el(s.focusNode),cp=a&&a.closest("#layer > .cs123-ler:not(.cs123-prev) .cs123-corpo");
    if(cp&&f&&cp.contains(f)){t=String(s.toString()).replace(/\s+/g," ").trim();id=CS123.ler.id}}}catch(e){}
  if(t.length>=3&&id){clearTimeout(LT134.selH);const longo=t.length>280;LT134.sel={id,t:longo?t.slice(0,279).replace(/\s+\S*$/,"").replace(/[\s,;:.–—-]+$/,"")+"…":t,longo};lt134Barra();return}
  if(LT134.sel){clearTimeout(LT134.selH);LT134.selH=setTimeout(()=>{const s2=getSelection();if(!s2||s2.isCollapsed){LT134.sel=null;lt134Barra()}},600)}}
function lt134Barra(){const r=lt134Raiz();document.querySelectorAll(".lt134-bar").forEach(b=>{if(!r||!LT134.sel||b.parentNode!==r)b.remove()});const S0=LT134.sel;if(!r||!S0)return;
  let b=r.querySelector(":scope > .lt134-bar");if(!b){r.insertAdjacentHTML("beforeend",`<div class="lt134-bar" role="toolbar" aria-label="Trecho selecionado"><small></small><button type="button" data-lt134cit>Citar trecho</button><button type="button" data-lt134cop>Copiar trecho</button></div>`);b=r.querySelector(":scope > .lt134-bar")}
  b.querySelector("small").textContent=S0.longo?"Vão os primeiros 280 caracteres":`${S0.t.length} de 280 caracteres`}
["pointerdown","mousedown"].forEach(k=>document.addEventListener(k,e=>{if(e.target.closest&&e.target.closest(".lt134-bar button"))e.preventDefault()},true));
const lt134Assina=id=>{const x=pubDe(id);return "— "+(x?nomeDe(x.autor):"Autora")+", no Prumo"};
function lt134CopiaTxt(sel){return `“${sel.t}”\n\n${lt134Assina(sel.id)}`}
function lt134Citar(){const s0=LT134.sel,x=s0&&pubDe(s0.id),c=x&&cs123Col(x);if(!c){toast("Esta coluna não está disponível.");return}if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}
  if(x.publico==="proximos"){toast("Esta coluna não pode ser citada.");return}
  LT134.cit={id:x.id,t:s0.t,au:x.autor,n:String(nomeDe(x.autor)).slice(0,60)};uso("coluna_citar_trecho");
  ex133Folha("Citar trecho",`<label class="vn-rpl" for="lt134-ct">Seu comentário <small>(opcional)</small></label><textarea class="field vn-rpt" id="lt134-ct" rows="3" maxlength="1800" placeholder="O que você acha deste trecho?"></textarea>
    <div class="lt134-pv">${lt134CitHTML(LT134.cit)}${typeof vn112Quote==="function"?vn112Quote({k:"pub",id:x.id}):""}</div>`,`<button type="button" class="btn" data-lt134pub>Publicar</button>`);
  setTimeout(()=>{try{$("#lt134-ct")?.focus({preventScroll:true})}catch(e){}},80)}
async function lt134CitPublica(b){const C=LT134.cit;if(!C||!SB||(b&&b.disabled))return;if(b)b.disabled=true;const texto=String(($("#lt134-ct")||{}).value||"").trim().slice(0,2000);
  const row={autor:S.uid,tipo:"post",at:Date.now(),texto,fotos:[],pid:null,snap:null,estilo:{v:2,rp:{k:"pub",id:C.id},trecho:{t:C.t,au:C.au,n:C.n}}};
  try{const r=await SB.from("publicacoes").insert(row).select("id");if(r.error)throw r.error;const nid=r.data&&r.data[0]&&r.data[0].id;if(nid&&texto)try{pubAvisarMencoes(nid,texto,"post")}catch(e){}
    LT134.cit=null;closeLayer();toast("Publicado com o trecho da coluna");try{await pubCarregar();pubRedesenha()}catch(e){}}
  catch(e){if(b&&b.isConnected)b.disabled=false;toast("Não deu para publicar agora.")}}

/* ===== 7. cliques ===== */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(b=t.closest("[data-lt134num]")){pare();lt134Numeros(b.dataset.lt134num);return}
  if(b=t.closest("[data-lt134assu]")){pare();if(!b.disabled)lt134AssTroca(b.dataset.lt134assu,b.dataset.lt134asss||"",b);return}
  if(b=t.closest("[data-lt134fix]")){pare();if(!b.disabled)lt134Fixa(b.dataset.lt134fix,b.dataset.au,b.dataset.cid,b);return}
  if(b=t.closest("[data-lt134resp]")){pare();lt134Responde(b.dataset.lt134resp,b.dataset.n||"");return}
  if(t.closest("[data-lt134cit]")){pare();lt134Citar();return}
  if(b=t.closest("[data-lt134cop]")){pare();const s0=LT134.sel;if(!s0)return;ex133Copia(lt134CopiaTxt(s0),null,b);uso("coluna_copiar_trecho");return}
  if(b=t.closest("[data-lt134pub]")){pare();lt134CitPublica(b);return}},true);
