/* ---------- 210: correções da tarde de 19/11 (achados do testador: navegação, capa, matéria, textos). Prefixo ct210. ---------- */
var CT210={at:null,alvo:null};

/* ===== 1. Atividade: abrir um post ou um perfil e voltar volta para a Atividade (como a cobertura) ===== */
{const _aa=atAcao;atAcao=function(x){try{if($("#layer .pfv-at")&&x&&!(x.acao==="cob"||x.acao==="tl142"||x.acao==="debate"))CT210.at={t:Date.now()}}catch(e){}return _aa.apply(this,arguments)}}
(function(){const vig=()=>{const L=document.getElementById("layer");if(!L)return setTimeout(vig,400);
  new MutationObserver(()=>{try{const el=L.firstElementChild;
    if(CT210.at&&el&&!L.querySelector(".pfv-at")){if(Date.now()-CT210.at.t<2500){CT210.alvo=el;CT210.at=null}else CT210.at=null}
    if(CT210.alvo&&!CT210.alvo.isConnected&&el&&!CT210.at)CT210.alvo=null}catch(e){}}).observe(L,{childList:true})};vig()})();
{const _cl=closeLayer;closeLayer=function(fromPop){
  /* voltar do celular com "Local e pessoas na foto" aberto: fecha só a folha (como o "Pronto") */
  try{if(fromPop===true&&!($("#layer2")||{}).innerHTML){const d=$("#layer > .cp152 .fc164-dsh");if(d){const ok=d.querySelector("[data-fc164detok]");if(ok)ok.click();else d.remove();if(pushH())HST++;return}}}catch(e){}
  const alvo=CT210.alvo,L=$("#layer"),era=L&&L.firstElementChild;const r=_cl.apply(this,arguments);
  try{if(alvo&&era===alvo&&L&&!L.innerHTML&&!closeLayer._ok){CT210.alvo=null;setTimeout(()=>{try{if(!$("#layer").innerHTML&&typeof abrirAtividade==="function")abrirAtividade()}catch(e){}},0)}
    else if(alvo&&!alvo.isConnected)CT210.alvo=null}catch(e){}return r}}

/* ===== 2. link de notícia com o app já aberto (#m=… colado na barra ou tocado num link do Prumo) ===== */
/* (no Chrome, trocar o # também dispara popstate, que fecha a camada aberta: espera ele passar antes de abrir) */
addEventListener("hashchange",e=>{/* o endereço novo vem do evento: fechar a matéria anterior já tira o #m= da barra */const h=String((e&&e.newURL)||location.href).replace(/^[^#]*/,""),m=h.match(/^#m=([\w-]{1,80})$/);if(!m)return;const pid=m[1];setTimeout(()=>{try{
  if(typeof MAT_PID!=="undefined"&&MAT_PID===pid&&$("#layer .mat"))return;
  /* outra matéria aberta: abre a nova no lugar (como o "Próxima") */
  if($("#layer .mat")&&!($("#layer2")||{}).innerHTML&&pautaById(pid)){abrirMateria(pid);return}
  let i=0;while(($("#layer2")&&$("#layer2").innerHTML||$("#layer").innerHTML)&&i++<6){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}
  if(pautaById(pid)){if(VIEW!=="capa"&&VIEW!=="feed")go("capa");abrirMateria(pid);return}
  LINK_PID=pid;LINK_T0=Date.now();if(typeof linkTentar==="function")linkTentar()}catch(e){}},180)});

/* ===== 3. link de notícia em rede lenta: até a matéria abrir, "Abrindo a notícia…" no lugar da Capa ===== */
(function(){try{if(typeof LINK_PID==="undefined"||!LINK_PID||$("#layer .mat"))return;const d=document.createElement("div");d.id="ct210ab";d.className="ct210-ab";d.setAttribute("role","status");
  d.innerHTML=`<div class="ct210-abi"><span class="ct210-sk ct210-sk1"></span><span class="ct210-sk"></span><span class="ct210-sk ct210-sk2"></span><p>Abrindo a notícia…</p></div>`;document.body.appendChild(d);
  const t0=Date.now(),iv=setInterval(()=>{if($("#layer .mat")||(!LINK_PID&&Date.now()-t0>400)||Date.now()-t0>20000){clearInterval(iv);d.remove()}},150)}catch(e){}})();

/* ===== 4. depois de comentar uma notícia, a tela para na notícia (com o comentário logo abaixo) ===== */
cp152Mostra=function(id){let n=0;const tenta=()=>{const el=document.getElementById("p-u:"+id);if(el&&el.getClientRects().length){try{
    const hd=((document.querySelector(".top")||{}).offsetHeight||56)+8;let alvo=el;
    if(el.classList.contains("fc107-junto")){const x=typeof pubDe==="function"?pubDe(id):null;const nt=x&&x.pid&&document.getElementById("p-"+x.pid);if(nt&&nt.getClientRects().length)alvo=nt}
    let top=alvo.getBoundingClientRect().top+scrollY-hd;const fim=el.getBoundingClientRect().bottom+scrollY;
    if(alvo!==el&&fim-top>innerHeight-90)top=Math.max(top,fim-innerHeight+90);
    scrollTo({top:Math.max(0,top),behavior:"smooth"});el.classList.add("cp152-novo");setTimeout(()=>el.classList.remove("cp152-novo"),2200)}catch(e){}return}
  if(++n<12)setTimeout(tenta,250)};setTimeout(tenta,300)};

/* ===== 5. "O que você acha?" do Feed abre a mesma caixa do + (Nova publicação), já com a notícia juntada.
   O 107 trata o toque (window, captura, para tudo) e chama uso("barra_sugestao") logo antes do cn102Comeca: é por aí que se sabe ===== */
{const _u=uso;uso=function(k){if(k==="barra_sugestao")CT210.sug=Date.now();return _u.apply(this,arguments)}}
{const _cc=cn102Comeca;cn102Comeca=function(k,o){try{if(k==="nt"&&o&&o.pid&&CT210.sug&&Date.now()-CT210.sug<1500&&typeof cp152Abre==="function"){CT210.sug=0;
    if(typeof precisaConta==="function"&&precisaConta())return;cp152Abre({aba:"post",pid:pautaById(o.pid)?o.pid:undefined});if($("#layer > .cp152"))return}}catch(e){}
  return _cc.apply(this,arguments)}}

/* ===== 6. link de post que não existe: "Ver as notícias de hoje" fecha e fica na Capa ===== */
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-ct210hoje]");if(!b)return;e.preventDefault();e.stopPropagation();
  try{if(typeof VP99_LINK!=="undefined")VP99_LINK=null}catch(_){}closeLayer();setTimeout(()=>{try{go("capa");scrollTo(0,0)}catch(_){}},60)},true);

/* ===== 7. Capa e rodapé do Feed: a hora é a da última coisa que mudou (inclui "Acabou de sair" e "Agora") ===== */
function ct210UltMud(){let m=Date.parse((FEED&&FEED.atualizado_em)||"");if(!isFinite(m))return NaN;const ag=Date.now()+60e3;
  try{(typeof ac208Itens==="function"?ac208Itens():[]).forEach(x=>{if(x&&x.h>m&&x.h<=ag)m=x.h})}catch(e){}
  try{(typeof agoraItens==="function"?agoraItens():[]).forEach(x=>{const h=+(x&&x.h);if(h>m&&h<=ag)m=h})}catch(e){}return m}
{const _ce=capaEdicao;capaEdicao=function(){const s=_ce.apply(this,arguments);try{const a=Date.parse(FEED.atualizado_em||""),m=ct210UltMud();
    if(isFinite(a)&&isFinite(m)&&m-a>60e3&&dataSP(new Date(m).toISOString())===dataSP(new Date(a).toISOString())){const p=new Date(m).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"America/Sao_Paulo"}).split(":");
      return s.replace(/^Atualizada às \d{1,2}h\d{2}/,"Atualizada às "+(+p[0])+"h"+p[1])}}catch(e){}return s}}
function ct210Topo(){try{const e=$("#v-capa .cp-ed");if(!e||!FEED)return;const t=capaEdicao()+(FEED.contagem?" · "+FEED.contagem:"");if(e.textContent!==t)e.textContent=t}catch(e){}}
{const _aa=ac208Atualiza;ac208Atualiza=function(){const r=_aa.apply(this,arguments);ct210Topo();try{fd167Rodape()}catch(e){}return r}}
{const _fr=fd167Rodape;fd167Rodape=function(){const r=_fr.apply(this,arguments);try{const p=document.querySelector("#extra .foot p.fd167-at");if(!p)return r;const a=Date.parse(FEED.atualizado_em||""),m=ct210UltMud();
    if(isFinite(a)&&isFinite(m)&&m-a>60e3){const b=p.querySelector("b");if(b)b.textContent="Atualizado "+diaHora(new Date(m).toISOString())+".";
      p.innerHTML=p.innerHTML.replace(/, sem novidades\./,".")}}catch(e){}return r}}

/* ===== 8. círculo de uma editoria no topo do Feed: o giro começa pela notícia que o círculo mostra ===== */
/* só no toque de verdade no círculo (quem chama openSecStory direto continua começando pela primeira não vista) */
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("#secs [data-sec-story]");CT210.pidAbre=b&&b.dataset.ct210pid||null;if(CT210.pidAbre)setTimeout(()=>{CT210.pidAbre=null},1500)},true);
{const _is=igSet;igSet=function(sec,pos){const n=_is.apply(this,arguments);try{if(CT210.pidAbre&&pos==="novo"){const k=stPs().findIndex(p=>p&&p.id===CT210.pidAbre&&!p.__vis);CT210.pidAbre=null;if(k>=0)ST.i=k}}catch(e){}return n}}

/* ===== 9. fotos: retrato em pé não vira faixa cortada no rosto; na matéria, retrato pequeno não é esticado ===== */
function ct210Foto(img){try{if(img.closest(".story.sg .sg-bg")){img.classList.toggle("ct210-dt",img.naturalWidth>img.naturalHeight*1.15&&innerHeight>innerWidth);return}const c=img.closest(".paper.foto");if(!c||!img.naturalWidth||img.classList.contains("ct210-fd"))return;const pe=img.naturalHeight>img.naturalWidth*1.05,peq=img.naturalWidth<600;
  c.classList.toggle("ct210-pe",pe);
  if(c.closest(".mat-arte")&&(pe||peq)&&!c.querySelector(".ct210-fd")){c.classList.add("ct210-ret");const f=img.cloneNode(false);f.className="ct210-fd";f.removeAttribute("onload");f.removeAttribute("onerror");f.alt="";f.setAttribute("aria-hidden","true");c.insertBefore(f,c.firstChild)}}catch(e){}}
document.addEventListener("load",e=>{const t=e.target;if(t&&t.tagName==="IMG")ct210Foto(t)},true);
(function(){const vig=()=>{const L=document.getElementById("layer");if(!L)return setTimeout(vig,400);new MutationObserver(()=>{L.querySelectorAll(".mat-arte .paper.foto img:not(.ct210-fd)").forEach(i=>{if(i.complete)ct210Foto(i)})}).observe(L,{childList:true,subtree:true})};vig()})();

/* ===== 10. sem internet na matéria: quando a rede volta, a foto que caiu no desenho volta ===== */
addEventListener("online",()=>{setTimeout(()=>{try{const a=$("#layer .mat .mat-arte");if(!a||typeof MAT_PID==="undefined"||!MAT_PID)return;if(a.querySelector("img.ok"))return;const p=pautaById(MAT_PID);if(!p||!fotoDe(p))return;
  a.innerHTML=capaArte(p,"art",true)}catch(e){}},800)});

/* ===== 11. "Aa" da matéria: o quadro fecha ao rolar o texto ou ao tocar fora (a escolha já fica salva) ===== */
function ct210AaFecha(){const ab=$("#layer .mat-aap");if(!ab)return;ab.remove();$("#layer [data-mataa]")?.setAttribute("aria-expanded","false")}
document.addEventListener("scroll",e=>{try{const ab=$("#layer .mat-aap");if(!ab)return;const t=e.target;if(t&&t.nodeType===1&&ab.contains(t))return;
  const sc=t&&t.nodeType===1?t:document.scrollingElement;const y=sc?sc.scrollTop:0;if(ab.dataset.ct210y==null){ab.dataset.ct210y=y;return}if(Math.abs(y-(+ab.dataset.ct210y))>48)ct210AaFecha()}catch(_){}},true);
document.addEventListener("click",e=>{try{const ab=$("#layer .mat-aap");if(!ab)return;const t=e.target;if(!t||!t.closest||ab.contains(t)||t.closest("[data-mataa]"))return;ct210AaFecha()}catch(_){}},true);

/* ===== 12. rede lenta, primeira visita: a manchete já estava na tela havia mais de 2 s (o 121 desenhou cedo) quando o app ficou pronto:
   quem já está lendo não é interrompido pelo guia em tela cheia; aparece um convite pequeno para ver o guia ===== */
{const _at=abrirTour;abrirTour=function(nome){try{if(nome===""&&!S.uid&&!CT210.tourSim&&window.__f4&&performance.now()-window.__f4.t>2000&&$("#v-capa .cpi-man")&&!$("#layer").innerHTML){ct210GuiaChip();return}}catch(e){}return _at.apply(this,arguments)}}
function ct210GuiaChip(){if(document.getElementById("ct210gc"))return;const d=document.createElement("div");d.id="ct210gc";d.className="ct210-gc";d.setAttribute("role","status");
  d.innerHTML=`<button type="button" class="ct210-gcb" data-ct210gv>Primeira vez aqui? Veja como funciona</button><button type="button" class="ct210-gcx" data-ct210gx aria-label="Fechar">×</button>`;document.body.appendChild(d);
  setTimeout(()=>{try{d.remove()}catch(e){}},15000)}
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest("[data-ct210gv]")){e.preventDefault();e.stopPropagation();document.getElementById("ct210gc")?.remove();CT210.tourSim=1;try{const _tt=tourTelas;tourTelas=()=>sr150TelasVisitante(_tt);try{abrirTour("")}finally{tourTelas=_tt}}catch(_){abrirTour()}finally{CT210.tourSim=0}return}
  if(t.closest("[data-ct210gx]")){e.preventDefault();e.stopPropagation();document.getElementById("ct210gc")?.remove();try{localStorage.setItem("prumo-tour-visto","1")}catch(_){}}},true);

/* ===== 13. Conversas: mensagem escrita e não enviada aparece na lista como "Rascunho: …" ===== */
function ct210Rascs(){try{if(!S.uid||THREAD)return;const o=rs108Le();document.querySelectorAll("#v-msgs [data-thread]").forEach(b=>{const t=String(o["dm:"+b.dataset.thread]||"").trim(),pv=b.querySelector(".dm-pv");if(!pv)return;
  if(t){if(!pv.dataset.ct210)pv.dataset.ct210=pv.textContent;pv.innerHTML=`<em class="ct210-rasc">Rascunho:</em> ${esc(t.replace(/\s+/g," ").slice(0,60))}`}else if(pv.dataset.ct210){pv.textContent=pv.dataset.ct210;delete pv.dataset.ct210}})}catch(e){}}
{const _rm=renderMsgs;renderMsgs=function(){const r=_rm.apply(this,arguments);ct210Rascs();return r}}

/* ===== 14. Entrar: o aviso do "Esqueci a senha" (ex.: "Falta o @") some assim que o e-mail muda ou ao tocar em Entrar ===== */
function ct210EsqLimpa(){try{document.querySelectorAll("#layer #lesq").forEach(p=>{if(/^(Falta o @|Escreva o seu e-mail|Confira o e-mail)/.test(p.textContent.trim())){p.textContent="";p.hidden=true}})}catch(e){}}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="lemail")ct210EsqLimpa()});
document.addEventListener("submit",e=>{if(e.target&&e.target.id==="lform")ct210EsqLimpa()},true);

/* ===== 15. quadro do dólar: "Alta na seg. (16) +2,17%" ao lado do fechamento de terça vira a variação do mesmo dia do valor ===== */
{const _nr=nm186Resolver;nm186Resolver=function(f){const n=_nr.apply(this,arguments);try{const x=nm186Mapa(f).dolar,dd=x&&/^\d{4}-\d{2}-(\d{2})/.exec(String(x.data||""));if(!dd||!x.variacao)return n;const dia=+dd[1];
  (f.pautas||[]).forEach(p=>{const d=p&&p.imagem&&p.imagem.dados;if(!d||!Array.isArray(d.itens))return;const orig=String(((d._m186||{}).valor)||d.valor||"");if(!/\{dolar\}/.test(orig))return;
    d.itens=d.itens.map(it=>{if(!Array.isArray(it))return it;const m=/^(alta|queda|varia[çc][ãa]o|subiu|caiu|sobe|cai)\b[^()]*\((\d{1,2})\)/i.exec(String(it[0]||""));
      return m&&+m[2]!==dia?["Variação de "+nm186Valor("dolar","dia",x),String(x.variacao)]:it})})}catch(e){}return n}}

/* ===== 16. Busca em celular estreito (até 360 px): placeholder curto, sem cortar no meio da palavra ===== */
{const _rv=renderBuscaView;renderBuscaView=function(){const r=_rv.apply(this,arguments);try{const i=$("#bvq");if(i&&innerWidth<=360)i.placeholder="Buscar"}catch(e){}return r}}

/* ===== 17. Perfil escondido: a cópia dos próprios posts fica com outro id fora do Perfil (o id "p-u:…" é só do Feed) ===== */
function ct210IdsPerfil(){try{const me=document.getElementById("v-me");if(!me)return;const ver=VIEW==="me";
  me.querySelectorAll(ver?'[id$="~m"]':'[id^="p-u:"]').forEach(el=>{if(ver)el.id=el.id.replace(/~m$/,"");else if(!/~[a-z]$/.test(el.id))el.id=el.id+"~m"})}catch(e){}}
{const _go=go;go=function(){const r=_go.apply(this,arguments);ct210IdsPerfil();return r}}

/* ===== 18. o app agora é "seguir": os textos que ainda falavam em "amigos" (sem conta, Conversas, convite, Perfil) ===== */
var CT210_TX=[
  [/Quer falar com alguém que ainda não é seu amigo no Prumo\?/g,"Quer falar com alguém que você ainda não segue?"],
  [/^Adicionar amigos$/g,"Procurar pessoas"],
  [/Perfil › Adicionar amigos/g,"Perfil › Procurar pessoas"],
  [/vocês já entram como amigos\./g,"vocês já começam seguindo um ao outro."],
  [/conversar com (os seus |os )?amigos/g,"conversar com quem você segue"],
  [/(trocar notícias|notícias e mensagens) com os seus amigos/g,"$1 com quem você segue"],
  [/[Pp]eça o link a um amigo que já usa o Prumo/g,m=>(m[0]==="P"?"P":"p")+"eça o link a alguém que já usa o Prumo"],
  [/de alguém que não está entre os seus amigos/g,"de alguém que você não segue"],
  [/só para quem é amigo de /g,"só para quem pode ver os posts de "]];
function ct210Textos(root){try{if(typeof sg181On==="function"&&!sg181On()&&S.uid)return;const w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode())){const v=n.nodeValue;if(!v||v.indexOf("amig")<0)continue;let t=v;CT210_TX.forEach(([re,s])=>{t=re.source.charAt(0)==="^"?(t.trim().match(re)?t.replace(t.trim(),s):t):t.replace(re,s)});if(t!==v)n.nodeValue=t}
  (root||document).querySelectorAll&&(root||document).querySelectorAll('input[placeholder*="amigos"]').forEach(i=>{if(/Como seus amigos vão te ver/.test(i.placeholder))i.placeholder="Como as pessoas vão te ver"})}catch(e){}}
(function(){let ag=0;const roda=()=>{ag=0;["layer","layer2","v-msgs","v-me"].forEach(id=>{const e=document.getElementById(id);if(e)ct210Textos(e)});document.querySelectorAll(".toast").forEach(e=>ct210Textos(e))};
  new MutationObserver(()=>{if(!ag)ag=requestAnimationFrame(roda)}).observe(document.body,{childList:true,subtree:true});roda()})();

/* ===== 19. apagar comentário: a confirmação fica no lugar do "Apagar", com cara de botão e "Cancelar" ao lado ===== */
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  const c=t.closest("[data-ct210canc]");if(c){e.stopPropagation();e.preventDefault();const ap=c.previousElementSibling;if(ap&&ap.matches("[data-apagar]")){ap.classList.remove("conf","ct210-conf");ap.textContent=ap.dataset.ct210tx||"Apagar"}c.remove();return}
  const ap=t.closest(".sheet [data-apagar]");if(!ap||!ap.isConnected||!ap.classList.contains("conf")||ap.classList.contains("ct210-conf"))return;
  ap.classList.add("ct210-conf");ap.dataset.ct210tx=ap.dataset.ct210tx||"Apagar";ap.textContent="Apagar mesmo?";
  ap.insertAdjacentHTML("afterend",`<button type="button" class="c-a ct210-canc" data-ct210canc>Cancelar</button>`);
  setTimeout(()=>{try{if(ap.isConnected&&ap.classList.contains("ct210-conf")){ap.classList.remove("conf","ct210-conf");ap.textContent=ap.dataset.ct210tx;const n=ap.nextElementSibling;if(n&&n.matches("[data-ct210canc]"))n.remove()}}catch(_){}},6000)});

/* ===== 21 (noite). "Acabou de sair" não repete notícia que já entrou na edição (manchete igual a um link de alguma pauta) ===== */
function ct210LinksEd(){if(ct210LinksEd.f===FEED)return ct210LinksEd.s;const u=new Set(),t=new Set();
  (FEED&&FEED.pautas||[]).forEach(p=>(Array.isArray(p&&p.links)?p.links:[]).forEach(l=>{if(!l)return;if(l.url)u.add(String(l.url).replace(/[?#].*$/,"").replace(/\/$/,""));if(l.titulo)t.add(norm(String(l.titulo)).replace(/\s+/g," ").trim())}));
  ct210LinksEd.f=FEED;ct210LinksEd.s={u,t};return ct210LinksEd.s}
{const _ai=ac208Itens;ac208Itens=function(){const l=_ai.apply(this,arguments);try{const {u,t}=ct210LinksEd();if(!u.size&&!t.size)return l;
  return l.filter(x=>!(x.ms||[]).some(m=>(m.url&&u.has(String(m.url).replace(/[?#].*$/,"").replace(/\/$/,"")))||(m.titulo&&t.has(norm(String(m.titulo)).replace(/\s+/g," ").trim()))))}catch(e){return l}}}

/* ===== 22 (noite). post que só junta a notícia, sem texto nem foto: não vira um "Seu comentário" vazio no Feed ===== */
{const _fj=fc107Junto;fc107Junto=function(h,p){try{const x=p&&p.__pub;if(x&&!String(x.texto||"").trim()&&!(x.fotos||[]).length)return ""}catch(e){}return _fj.apply(this,arguments)}}
{const _cm=cp152Mostra;cp152Mostra=function(id){_cm.apply(this,arguments);setTimeout(()=>{try{if(document.getElementById("p-u:"+id))return;const x=pubDe(id),nt=x&&x.pid&&document.getElementById("p-"+x.pid);
  if(nt)scrollTo({top:Math.max(0,nt.getBoundingClientRect().top+scrollY-(((document.querySelector(".top")||{}).offsetHeight||56)+8)),behavior:"smooth"})}catch(e){}},3400)}}

/* ===== 23 (noite). Cancelar a Nova publicação com texto: "Guardar para depois", "Descartar" ou "Continuar escrevendo" ===== */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;
  if((b=t.closest("#layer > .cp152 [data-cp152x]"))&&String(CP152.txt||"").trim()&&!$("#layer .ct210-sai")){e.stopPropagation();e.preventDefault();
    const ov=document.createElement("div");ov.className="ce-sel ct210-sai";ov.innerHTML=`<div class="ce-selp" role="dialog" aria-label="Sair da publicação"><b>Sair sem publicar?</b>
      <button type="button" class="btn" data-ct210sai="g">Guardar para depois</button><button type="button" class="btn ghost ct210-desc" data-ct210sai="d">Descartar</button><button type="button" class="btn ghost" data-ct210sai="c">Continuar escrevendo</button></div>`;
    $("#layer > .cp152").appendChild(ov);return}
  if((b=t.closest("[data-ct210sai]"))){e.stopPropagation();e.preventDefault();const k=b.dataset.ct210sai;$("#layer .ct210-sai")?.remove();if(k==="c")return;
    if(k==="g"){try{cr155Guarda()}catch(_){}CT210.guarda=1;try{closeLayer()}finally{CT210.guarda=0}try{cr155Guarda()}catch(_){}toast("Texto guardado. Toque em + para continuar.");return}
    try{cr155Limpa()}catch(_){}CP152.txt="";closeLayer()}},true);
{const _cl155=cr155Limpa;cr155Limpa=function(){if(CT210.guarda){CP152.txt="";return}return _cl155.apply(this,arguments)}}
