/* ---------- 150: correções do teste no site real (13/11, noite) ----------
   Achados de duas horas usando o prumonews.com.br como leitor (com e sem conta). Nomes com o prefixo sr150.
   1. link de notícia (/m/<id>.html ou #m=<id>): também é tentado quando o Feed é desenhado (antes só a Capa tentava;
      quem abre no Feed ficava sem a matéria);
   2. link de post (#p=<id>) aberto por quem não entrou: diz que precisa entrar (antes esperava em silêncio);
   3. visitante que toca no campo de comentário: abre o entrar dizendo por quê, antes de digitar (antes digitava, tocava
      em enviar e perdia o texto);
   4. visitante que toca em Enviar numa notícia: abre "Mandar notícia" (WhatsApp, outros apps, copiar), como na matéria;
   5. quem já tem conta e chega por um link de convite: depois de entrar, abre "Usar um convite" com o código preenchido;
   6. círculos do topo do Feed: a mesma notícia não abre dois círculos seguidos com a mesma foto (o Em 5 min e a editoria
      da manchete mostravam a mesma arte); a editoria passa a mostrar a próxima notícia dela. */

/* 1 */
{const _rf150=renderFeed;renderFeed=function(){const r=_rf150.apply(this,arguments);try{if(LINK_PID)linkTentar()}catch(e){}return r}}

/* 2 */
(function sr150Post(n){try{if(!VP99_LINK)return;if(INIT_FIM&&!S.uid){const id=VP99_LINK;PC106={k:"post_link",t:Date.now()};abrirLogin();
  /* depois de entrar, o link volta a valer */
  VP99_LINK=id;return}}catch(e){return}if(n<80)setTimeout(()=>sr150Post(n+1),250)})(0);
PC106_TX.post_link="Esse post é de alguém do Prumo: entre na sua conta para ver.";

/* 3 */
PC106_TX.comentar="Para comentar, entre na sua conta.";
function sr150CampoComentario(el){if(!el||!el.matches||!el.matches("textarea,input"))return false;const ph=String(el.getAttribute("placeholder")||"");return /^(Escreva um comentário|Comentar|Responder|Adicione um comentário)/i.test(ph)}
document.addEventListener("focusin",e=>{const el=e.target;if(!sr150CampoComentario(el))return;try{if(S.uid&&S.membro)return}catch(_){return}
  try{el.blur()}catch(_){}PC106={k:"comentar",t:Date.now()};setTimeout(()=>{try{precisaConta()}catch(_){}},0)},true);

/* 4 */
{const _os150=openSend;openSend=function(pid){try{if((!S.uid||!S.membro)&&pid&&(pautaById(pid)||snapById(pid))){compartilhar(pid);return}}catch(e){}return _os150.apply(this,arguments)}}

/* 5 */
{const _ts150=trocarSessao;trocarSessao=async function(user){const r=await _ts150.apply(this,arguments);
  try{if(user&&CONVITE_URL&&!sr150Convite.feito&&!CRIANDO){sr150Convite.feito=1;sr150Convite(0)}}catch(e){}return r}}
function sr150Convite(n){try{if(!S.uid||CRIANDO)return;if(S.membro)return;if(!INIT_FIM||$("#layer .sheet")){if(n<40)setTimeout(()=>sr150Convite(n+1),250);return}
  let nome="";try{nome=(JSON.parse(localStorage.getItem("prumo-convite")||"null")||{}).n||""}catch(_){}abrirFaltaConvite({codigo:CONVITE_URL,nome})}catch(e){}}

/* 6 */
var SR150_USADAS=null;
{const _vp150=vn112Primeira;vn112Primeira=function(sec){const a=_vp150.apply(this,arguments);if(!SR150_USADAS||!a||!a.p)return a;
  if(sec&&sec[0]!=="_"&&SR150_USADAS.has(a.p.id)){try{const r=igLista(sec),q=(r.ps||[]).find(p=>!SR150_USADAS.has(p.id)&&!SEEN.has(seenKey(p)))||(r.ps||[]).find(p=>!SR150_USADAS.has(p.id));
    if(q){SR150_USADAS.add(q.id);return {p:q,t:versao(q,lente()).titulo}}}catch(e){}}
  SR150_USADAS.add(a.p.id);return a}}
/* os círculos de destaque (data-dest) que repetem a notícia de um círculo de editoria somem (o carrossel mostrava a mesma notícia duas vezes) */
{const _vt150=vn112Tiles;vn112Tiles=function(){SR150_USADAS=new Set();try{const r=_vt150.apply(this,arguments);
  try{const box=$("#secs");if(box){const usadas=SR150_USADAS;box.querySelectorAll(":scope>.sb[data-dest]").forEach(b=>{b.classList.toggle("sr150-rep",usadas.has(b.dataset.dest))})}}catch(e){}return r}finally{SR150_USADAS=null}}}

/* 7. miniaturas (Capa e círculos do topo, ~90–110 px na tela) pediam a foto da Wikimedia com 960 px (até 250 KB cada);
      agora pedem a de 330 px (nítida em tela 3×) */
{const _ca150=capaArte;capaArte=function(p,cls){const r=_ca150.apply(this,arguments);return /^(cp-th|vn-tl-art)$/.test(cls||"")?r.replace(/(upload\.wikimedia\.org\/wikipedia\/[a-z]+\/thumb\/[^"']+?\/)960px-/g,"$1330px-"):r}}

/* 8. "Do que você segue" com uma cobertura só: a faixa repetia o cartão logo abaixo (a cobertura seguida já sobe para o
      topo do Feed); com duas ou mais, a faixa continua como atalho */
{const _cs150=cobSegStrip;cobSegStrip=function(){try{if(FILTRO==="tudo"&&(FEED.pautas||[]).filter(p=>seguido(p)&&!silenciado(p)&&!(PREF.ocultas||[]).includes(secOf(p))).length<2)return ""}catch(e){}return _cs150.apply(this,arguments)}}

/* 9. dólar e Ibovespa do dia mostram a hora da cotação ("hoje, 18h56"): o indicador é a última cotação e a notícia pode
      trazer o fechamento, então os dois números podem diferir no centavo */
{const _it150=indTile;indTile=function(x){const h=_it150.apply(this,arguments);try{const at=IND_AUTO&&IND_AUTO.atualizado;
  if(x&&/^(dolar|ibovespa|euro)$/.test(x.id||"")&&at&&String(at).slice(0,10)===hojeSP()){const m=String(at).match(/T(\d{2}):(\d{2})/);if(m)return h.replace('<small class="ind-d">hoje</small>',`<small class="ind-d">hoje, ${+m[1]}h${m[2]}</small>`)}}catch(e){}return h}}

/* 10. botão "Instalar o Prumo" (Android/Chrome): o navegador avisa que dá para instalar (beforeinstallprompt) e o Perfil
       ganha o botão na parte "Usar como app no celular"; no iPhone continua o passo a passo */
var SR150_INST=null;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();SR150_INST=e;try{sr150Instalar()}catch(_){}});
addEventListener("appinstalled",()=>{SR150_INST=null;document.querySelectorAll(".sr150-inst").forEach(b=>b.remove());try{toast("O Prumo foi para a tela de início.")}catch(_){}});
function sr150Instalar(){if(!SR150_INST)return;document.querySelectorAll("#v-me details.card.dt").forEach(d=>{if(!/Usar como app/.test((d.querySelector("summary")||{}).textContent||"")||d.querySelector(".sr150-inst"))return;
  d.insertAdjacentHTML("beforeend",`<button type="button" class="btn sr150-inst" data-sr150inst>Instalar o Prumo neste celular</button>`)})}
{const _rm150=renderMe;renderMe=function(){const r=_rm150.apply(this,arguments);try{sr150Instalar()}catch(e){}return r}}
document.addEventListener("click",async e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-sr150inst]");if(!b||!SR150_INST)return;e.preventDefault();
  const ev=SR150_INST;try{uso("instalar")}catch(_){}try{await ev.prompt();const r=await ev.userChoice;if(r&&r.outcome==="accepted"){SR150_INST=null;b.remove()}}catch(_){}},true);

/* 11. primeira visita sem conta: um guia curto (Capa e lentes, Feed, usar como app) — antes só quem criava conta via.
       Não aparece para quem chega por link de notícia, de post ou de convite, nem nos testes automáticos. */
function sr150TelasVisitante(orig){const t=(orig||tourTelas)("");return [t[0],Object.assign({},t[1],{p:"No Feed, as notícias viram posts e giros. Para curtir, comentar, votar e conversar com amigos, entre com o convite de alguém do Prumo."}),t[3]]}
(function sr150Guia(n){try{if(!INIT_FIM||!FEED){if(n<80)setTimeout(()=>sr150Guia(n+1),250);return}
  if(S.uid||LINK_PID||VP99_LINK||CONVITE_URL)return;let visto=false,teste=false;try{visto=!!localStorage.getItem("prumo-tour-visto");teste=navigator.webdriver&&localStorage.getItem("prumo-teste-tourvis")!=="1"}catch(_){return}
  if(visto||teste)return;setTimeout(()=>{try{if(S.uid||$("#layer").innerHTML||document.visibilityState!=="visible")return;const _tt=tourTelas;tourTelas=()=>sr150TelasVisitante(_tt);try{abrirTour("")}finally{tourTelas=_tt}}catch(_){}},1500)}catch(e){}})(0);
