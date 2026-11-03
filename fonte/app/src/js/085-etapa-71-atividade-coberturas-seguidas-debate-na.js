/* ---------- Etapa 71: atividade (♥), coberturas seguidas, debate nas enquetes ---------- */
var AT={rows:[],pubs:{},t:0,carregando:false};
const AT_LS="prumo-ativ-1v",AT_VISTO="prumo-ativ-visto";
function atLed(){try{return JSON.parse(localStorage.getItem(AT_LS+":"+S.uid)||"null")}catch(e){return null}}
function atLedSalva(l){try{localStorage.setItem(AT_LS+":"+S.uid,JSON.stringify(l))}catch(e){}}
function atVisto(){try{return +localStorage.getItem(AT_VISTO+":"+S.uid)||0}catch(e){return 0}}
function atMarcaVisto(){try{localStorage.setItem(AT_VISTO+":"+S.uid,String(Date.now()))}catch(e){}}
async function atCarregar(){if(!SB||!S.uid||!S.membro||AT.carregando)return;AT.carregando=true;
  try{const desde=Date.now()-30*864e5;const r=await SB.from("publicacoes").select("id,autor,tipo,texto,fotos,estilo,at,expira").eq("autor",S.uid).gt("at",desde).order("at",{ascending:false}).limit(300);
    if(r.error){AT.t=Date.now();return}const pubs={};(r.data||[]).forEach(x=>{pubs[x.id]=pubNorm(x)});const ids=Object.keys(pubs);let rows=[];
    for(let i=0;i<ids.length;i+=100){const q=await SB.from("pub_reacoes").select("pub,uid,tipo,chave,valor,at").in("pub",ids.slice(i,i+100)).limit(1500);if(q.error)break;rows=rows.concat(q.data||[])}
    AT.pubs=pubs;AT.rows=rows.filter(x=>x.uid!==S.uid&&+x.at>=desde);AT.t=Date.now();
    const usadas=[...new Set(AT.rows.map(x=>x.pub))].map(id=>pubs[id]).filter(Boolean);if(usadas.length)await pubAssinaLista(usadas)}catch(e){}finally{AT.carregando=false;atDot();atRedesenha()}}
/* coisas sem horário (pedido, amizade nova, voto diferente) ganham a hora em que o app viu pela primeira vez */
function atPrimeiraVez(chaves){let l=atLed();const base=!l;l=l||{};const agora=Date.now(),vivas=new Set(chaves);
  chaves.forEach(k=>{if(!(k in l))l[k]=base?0:agora});Object.keys(l).forEach(k=>{if(!vivas.has(k)&&!/^_/.test(k))delete l[k]});l._b=1;atLedSalva(l);return l}
function atPubNome(x){return !x?"sua publicação":x.tipo==="story"?"seu story":x.estilo&&x.estilo.reel?"seu reel":"seu post"}
function atJunta(us){const n=[...new Set(us)].map(nomeDe);if(n.length===1)return n[0];if(n.length===2)return n[0]+" e "+n[1];return n[0]+", "+n[1]+" e mais "+(n.length-2)}
function atItens(){if(!S.uid||!S.membro)return [];const it=[],agora=Date.now();
  // reações às minhas publicações
  const g={};AT.rows.forEach(x=>{if(!S.amigos.has(x.uid)&&!S.membros[x.uid])return;if(x.tipo==="comentario"){const v=x.valor||{};it.push({k:"c:"+x.chave,at:+x.at,us:[x.uid],ic:"💬",txt:`<b>${esc(nomeDe(x.uid))}</b> comentou: “${esc((t=>t.length>90?t.slice(0,89).trimEnd()+"…":t)(String(v.texto||"")))}”`,pub:x.pub,acao:"cmt"});return}
    const k=x.tipo+":"+x.pub;(g[k]=g[k]||{tipo:x.tipo,pub:x.pub,us:[],at:0}).us.push([x.uid,+x.at]);g[k].at=Math.max(g[k].at,+x.at)});
  Object.entries(g).forEach(([k,o])=>{const us=o.us.sort((a,b)=>b[1]-a[1]).map(a=>a[0]);const pb=AT.pubs[o.pub];
    it.push({k,at:o.at,us,ic:o.tipo==="curtida"?"♥":"✋",txt:`<b>${esc(atJunta(us))}</b> ${o.tipo==="curtida"?(us.length>1?"curtiram ":"curtiu ")+atPubNome(pb):(us.length>1?"responderam ao ":"respondeu ao ")+(pb&&pb.tipo==="story"?"seu story":atPubNome(pb))}`,pub:o.pub,acao:"pub"})});
  // menções e marcações
  (S.msgsIn||[]).filter(m=>m.tipo==="mencao"&&+m.at>agora-30*864e5).forEach(m=>{let t;try{t=dmPrevia(m)}catch(e){t="Mencionou você"}
    it.push({k:"m:"+m.id,at:+m.at,us:[m.de],ic:"@",txt:`<b>${esc(nomeDe(m.de))}</b> ${esc(String(t).charAt(0).toLowerCase()+String(t).slice(1))}${m.texto&&!/^Mencionou você no story$/.test(m.texto)?`: “${esc((t=>t.length>80?t.slice(0,79).trimEnd()+"…":t)(String(m.texto)))}”`:""}`,msg:m,acao:"men"})});
  // amizades: pedidos e novas
  const pin=(S.pedidosIn||[]).filter(u=>S.membros[u]),am=amigosL();const chaves=pin.map(u=>"p:"+u).concat(am.map(u=>"a:"+u));
  // enquetes: amigos que votaram diferente de mim
  const enqs=FEED?(FEED.pautas||[]).filter(p=>p.enquete&&(p.enquete.opcoes||[]).length):[];const difs={};
  enqs.forEach(p=>{const meu=meuVoto(p.id);if(meu==null)return;const vs=votosDe(p.id);Object.entries(vs).forEach(([u,v])=>{if(u!==S.uid&&v!==meu&&v!=null){chaves.push("v:"+p.id+":"+u);(difs[p.id]=difs[p.id]||[]).push(u)}})});
  const L=atPrimeiraVez(chaves);
  pin.forEach(u=>it.push({k:"p:"+u,at:L["p:"+u]||0,us:[u],ic:"+",txt:`<b>${esc(nomeDe(u))}</b> quer ser seu amigo`,ped:u,fixo:1}));
  am.forEach(u=>{const t=L["a:"+u];if(t)it.push({k:"a:"+u,at:t,us:[u],ic:"🤝",txt:`Você e <b>${esc(nomeDe(u))}</b> agora são amigos`,u,acao:"perfil"})});
  Object.entries(difs).forEach(([pid,us])=>{const p=pautaById(pid);const at=Math.max(...us.map(u=>L["v:"+pid+":"+u]||0));if(!at||!p)return;
    it.push({k:"vd:"+pid,at,us,ic:"⚖",txt:`<b>${esc(atJunta(us))}</b> ${us.length>1?"votaram":"votou"} diferente de você em “${esc(p.enquete.pergunta)}”`,pid,acao:"debate"})});
  // comentários de amigos onde eu comentei ou votei
  enqs.concat(FEED?(FEED.pautas||[]):[]).forEach(p=>{if(it.some(x=>x.k==="cn:"+p.id))return;const {cm}=socialOf(p.id);const meus=cm.filter(c=>c.uid===S.uid);const votei=p.enquete&&meuVoto(p.id)!=null;if(!meus.length&&!votei)return;
    const desde=meus.length?Math.min(...meus.map(c=>c.at)):0;const outros=cm.filter(c=>c.uid!==S.uid&&c.at>desde&&c.at>agora-7*864e5);if(!outros.length)return;
    const us=[...new Set(outros.slice().reverse().map(c=>c.uid))];const ult=outros[outros.length-1];
    it.push({k:"cn:"+p.id,at:ult.at,us,ic:"💬",txt:`<b>${esc(atJunta(us))}</b> ${us.length>1?"comentaram":"comentou"} ${p.enquete?"na enquete":"na notícia"} “${esc(p.enquete?p.enquete.pergunta:(versao(p,lente()).titulo||temaDe(p)))}”: “${esc(String(ult.texto).slice(0,70))}”`,pid:p.id,acao:"debate"})});
  // coberturas seguidas: atualizações dos últimos 3 dias
  if(FEED)(FEED.pautas||[]).filter(p=>seguido(p)).forEach(p=>{const ups=(p.atualizacoes||[]).filter(u=>u&&u.texto&&tms(u.hora)>agora-3*864e5).sort((a,b)=>tms(b.hora)-tms(a.hora));if(!ups.length)return;
    it.push({k:"cob:"+p.id+":"+ups[0].hora,at:tms(ups[0].hora),us:[],ic:"📌",txt:`<b>${esc(temaDe(p))}</b>, que você segue, teve ${ups.length>1?ups.length+" atualizações":"uma atualização"}: “${esc(String(ups[0].texto).slice(0,90))}”`,pid:p.id,acao:"cob"})});
  return it.filter(x=>x.fixo||x.at>agora-30*864e5).sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}
function atNovas(){const v=atVisto();return atItens().filter(x=>x.at>v).length}
function atDot(){const n=S.uid&&S.membro?atNovas():0;document.querySelectorAll(".at-dot").forEach(d=>{d.hidden=!n})}
function atThumb(x){const pb=x.pub&&AT.pubs[x.pub];if(!pb)return "";const f=pb.fotos[0]&&pubUrl(pb.fotos[0]);
  return `<span class="at-th${pb.tipo==="story"?" st":""}">${f?`<img src="${pubSrc(f)}" alt="" loading="lazy">`:`<i style="background:${pubFundo(pb.estilo&&pb.estilo.fundo)}">${esc(String(pb.texto||"").slice(0,24))}</i>`}</span>`}
function atLiHTML(x,i){const av=x.us.length?`<span class="at-av${x.us.length>1?" dois":""}">${x.us.slice(0,2).map(u=>avatar(u)).join("")}</span>`:`<span class="at-av at-ic">${esc(x.ic)}</span>`;
  const dir=x.ped?`<span class="at-bt"><button type="button" class="btn amg-b" data-aceitar="${esc(x.ped)}">Aceitar</button><button type="button" class="btn ghost amg-b" data-recusar="${esc(x.ped)}">Recusar</button></span>`:atThumb(x);
  return `<li><button type="button" class="at-it" data-ati="${i}">${av}<span class="at-tx">${x.txt} <i>${x.at?esc(quando(x.at)):""}</i></span></button>${dir}</li>`}
function atDesenha(){const el=$("#layer .pfv-at");if(!el)return;const l=atItens();AT._l=l;const v=AT._visto0||0;
  const novas=l.filter(x=>x.fixo||x.at>v),velhas=l.filter(x=>!(x.fixo||x.at>v));
  const seg=Object.values(PREF.seguindo||{});
  el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-pfvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>Atividade</b><span class="sp"></span></div>
    <div class="pfv-sc">${!l.length?`<div class="pf-vz"><b>Nada por aqui ainda</b><span>Curtidas e comentários nas suas publicações, menções, pedidos de amizade e novidades das coberturas que você segue aparecem aqui.</span></div>`:""}
    ${novas.length?`<h4 class="at-h">Novas</h4><ul class="at-l">${novas.map(x=>atLiHTML(x,l.indexOf(x))).join("")}</ul>`:""}
    ${velhas.length?`<h4 class="at-h">Últimos 30 dias</h4><ul class="at-l">${velhas.map(x=>atLiHTML(x,l.indexOf(x))).join("")}</ul>`:""}
    <div class="at-seg"><h4 class="at-h">Coberturas que você segue</h4>${seg.length?`<p>${seg.map(t=>`<span class="at-chip">${esc(t)}</span>`).join("")}</p><span class="hint">Quando uma delas for atualizada, você vê aqui.</span>`:`<span class="hint">Nenhuma ainda. Na página de uma cobertura, toque em “Seguir cobertura” para ser avisado das atualizações.</span>`}</div></div>`}
function atRedesenha(){if($("#layer .pfv-at"))atDesenha()}
async function abrirAtividade(){if(precisaConta())return;if($("#layer").innerHTML)closeLayer();AT._visto0=atVisto();
  $("#layer").innerHTML=`<div class="pfv pfv-at" role="dialog" aria-modal="true" aria-label="Atividade"></div>`;if(pushH())HST++;atDesenha();atMarcaVisto();atDot();uso("atividade");
  if(Date.now()-AT.t>20e3)atCarregar()}
function atAcao(x){const fecha=()=>{if($("#layer .pfv-at"))closeLayer()};
  if(x.acao==="perfil"){abrirPerfil(x.u);return}
  if(x.acao==="men"){const m=x.msg;fecha();setTimeout(()=>{if(m.snap&&m.snap.upub){if(m.snap.story)abrirConversa(m.de);else pubIrPara(m.snap.upub)}else if(m.pid&&!/^u:/.test(m.pid)&&pautaById(m.pid))openComments(m.pid);else abrirConversa(m.de)},320);return}
  if(x.acao==="cob"){fecha();setTimeout(()=>abrirPagCob(x.pid),320);return}
  if(x.acao==="debate"){fecha();setTimeout(()=>debAbrir(x.pid),320);return}
  if(x.pub){const pb=AT.pubs[x.pub];if(!pb)return;if(pb.tipo==="story"){stLista([pb],0,"Seu story","at");return}
    fecha();setTimeout(()=>{if(x.acao==="cmt"&&pubDe(x.pub))openComments("u:"+x.pub);else pubIrPara(x.pub)},320)}}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  if(t.closest("[data-ativ]")){e.stopPropagation();abrirAtividade();return}
  const b=t.closest("#layer .pfv-at [data-ati]");if(b){const x=(AT._l||[])[+b.dataset.ati];if(x)atAcao(x);return}
  const d=t.closest("[data-debate]");if(d){e.stopPropagation();e.preventDefault();debAbrir(d.dataset.debate);return}},true);
/* botão ♥ no topo do Feed e da Capa */
const AT_BTN=()=>`<button type="button" class="icbtn at-b" data-ativ aria-label="Atividade">${ICON.like}<i class="at-dot" hidden></i></button>`;
(function(){const bb=$("#b-busca");if(bb&&!$(".top-in .at-b"))bb.insertAdjacentHTML("beforebegin",AT_BTN())})();
{const _rc71=renderCapa;renderCapa=function(){const r=_rc71.apply(this,arguments);try{const h=$("#v-capa .cp-top");if(h&&!h.querySelector(".at-b")&&S.uid&&S.membro)h.insertAdjacentHTML("beforeend",AT_BTN());atDot()}catch(e){}return r}}
{const _ub71=updateBadge;updateBadge=function(){const r=_ub71.apply(this,arguments);atDot();atRedesenha();return r}}
{const _ra71=rerenderAll;rerenderAll=function(){const r=_ra71.apply(this,arguments);atDot();atRedesenha();return r}}
{const _ps71=psCarregar;psCarregar=async function(){const r=await _ps71.apply(this,arguments);clearTimeout(AT._pt);AT._pt=setTimeout(atCarregar,700);return r}}
setInterval(()=>{if(S.uid&&S.membro&&!document.hidden){atDot();if(Date.now()-AT.t>120e3)atCarregar()}},30e3);
setTimeout(function at0(){if(S.uid&&S.membro&&S.amigosOk){atCarregar()}else setTimeout(at0,1500)},2500);
/* debate dos amigos na enquete */
function debAbrir(pid){const p=pautaById(pid);if(!p)return;openComments(pid);
  const meu=meuVoto(pid),eu=socialOf(pid).cm.some(c=>c.uid===S.uid);const i=$("#ctext");
  if(i&&!i.value&&meu!=null&&!eu&&p.enquete&&p.enquete.opcoes[meu]!=null){i.value=`Votei “${p.enquete.opcoes[meu]}” porque `;const b=$("#cform .sendc");if(b)b.disabled=false}}
function debCab(pid){const p=pautaById(pid);if(!p||!p.enquete||!(p.enquete.opcoes||[]).length||!S.uid||!S.membro)return "";const meu=meuVoto(pid);
  if(meu==null)return `<div class="deb-c"><b>${esc(p.enquete.pergunta)}</b><span class="hint">Vote na enquete para ver em que cada amigo votou.</span></div>`;
  const vs=votosDe(pid),tot=Object.keys(vs).length||1;
  return `<div class="deb-c"><b>${esc(p.enquete.pergunta)}</b>${p.enquete.opcoes.map((o,i)=>{const us=Object.entries(vs).filter(([,v])=>v===i).map(([u])=>u);const pc=Math.round(us.length/tot*100);
    return `<div class="deb-o${i===meu?" eu":""}"><i style="width:${pc}%"></i><span>${esc(o)}</span><em>${us.length?esc(quemVotou(us)):"ninguém"}</em></div>`}).join("")}</div>`}
function debVotoChip(pid,u){const p=pautaById(pid);if(!p||!p.enquete||meuVoto(pid)==null)return "";const v=votosDe(pid)[u];if(v==null||p.enquete.opcoes[v]==null)return "";
  return ` <em class="deb-v${v===meuVoto(pid)?" ig":""}">${esc(String(p.enquete.opcoes[v]).slice(0,28))}</em>`}
{const _eq71=enqueteHTML;enqueteHTML=function(p){let h=_eq71.apply(this,arguments);try{if(!h||!S.uid||!S.membro||meuVoto(p.id)==null||!amigosL().length)return h;
  const n=socialOf(p.id).cm.length,vs=votosDe(p.id),meu=meuVoto(p.id),dif=Object.entries(vs).filter(([u,v])=>u!==S.uid&&v!==meu).length;
  const lab=n?`Ver o debate · ${n} ${n===1?"comentário":"comentários"}`:dif?`${dif===1?"1 amigo votou":dif+" amigos votaram"} diferente. Debater`:"Comentar seu voto";
  h=h.replace(/<\/div>$/,`<button type="button" class="deb-b" data-debate="${esc(p.id)}">💬 ${esc(lab)}</button></div>`)}catch(e){}return h}}


