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
function atPubNome(x){return !x?"sua publicação":x.tipo==="story"?"seu giro":x.estilo&&x.estilo.reel?"seu reel":"seu post"}
function atJunta(us){const n=[...new Set(us)].map(nomeDe);if(n.length===1)return n[0];if(n.length===2)return n[0]+" e "+n[1];return n[0]+", "+n[1]+" e mais "+(n.length-2)}
function atNovas(){const v=atVisto();return atItens().filter(x=>x.at>v).length}
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
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  if(t.closest("[data-ativ]")){e.stopPropagation();abrirAtividade();return}
  const b=t.closest("#layer .pfv-at [data-ati]");if(b){const x=(AT._l||[])[+b.dataset.ati];if(x)atAcao(x);return}
  const d=t.closest("[data-debate]");if(d){e.stopPropagation();e.preventDefault();debAbrir(d.dataset.debate);return}},true);
/* botão ♥ no topo do Feed e da Capa */
const AT_BTN=()=>`<button type="button" class="icbtn at-b" data-ativ aria-label="Atividade">${ICON.like}<i class="at-dot" hidden></i></button>`;
(function(){const bb=$("#b-busca");if(bb&&!$(".top-in .at-b"))bb.insertAdjacentHTML("beforebegin",AT_BTN())})();
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


