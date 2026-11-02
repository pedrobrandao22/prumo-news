/* ---------- v14 ---------- */
function abrirFiltro(){uso("filtro_sheet");const opc=[{id:"tudo",nome:"Tudo",n:visiveis().length},...SECS().filter(s=>pautasDa(s.id).length).map(s=>({id:s.id,nome:s.nome,n:pautasDa(s.id).length,cor:secCor(s.id)}))];
  if(temAmigos()){const sv=FILTRO;FILTRO="_gostou";const b=listaFeed().length;FILTRO=sv;opc.push({id:"_gostou",nome:"Amigos gostaram",n:b,cor:"var(--bronze)"})}
  const M=PREF.feedModo==="recentes"?"recentes":"voce";
  sheet("Filtrar o feed",`<div class="segs fmodo" role="tablist" aria-label="Ordem do feed"><button type="button" role="tab" data-fmodo="voce" aria-selected="${M==="voce"}">Para você</button><button type="button" role="tab" data-fmodo="recentes" aria-selected="${M==="recentes"}">Mais recentes</button><button type="button" role="tab" data-fmodo="seguindo" aria-selected="${PREF.feedModo==="seguindo"}">Meus temas</button></div><div class="opt fopt">${opc.map(x=>`<button type="button" data-filtro="${esc(x.id)}" aria-pressed="${FILTRO===x.id}">${x.cor?`<i style="background:${x.cor}"></i>`:""}<b>${esc(x.nome)}</b><span>${x.n} ${x.n===1?"notícia":"notícias"}${FILTRO===x.id?" · atual":""}</span></button>`).join("")}</div>`)}
function abrirNovidades(){const l=NOVID.map(pautaById).filter(Boolean);
  sheet("Desde a sua última visita",`${VISITA0?`<p class="hint" style="margin:0">Sua última visita foi ${esc(diaHora(VISITA0))}.</p>`:""}${l.length?"":`<p class="hint">Você já viu todas as novidades.</p>`}<ul class="ult">${l.map(p=>`<li><button type="button" data-goto="${esc(p.id)}"><span class="u-t"><b style="color:${secCor(secOf(p))}">${NOVAS.has(p.id)?"Nova":"Atualizada"}</b> · ${esc(secNome(secOf(p)))}</span><span class="u-x">${esc(p.neutro?.titulo||"")}</span>${lidaAtual(p)?`<span class="u-t">✓ lida</span>`:""}</button></li>`).join("")}</ul>`)}
function atualizarChatPosts(){if(!FEED)return;const ps=new Set(allMsgs().filter(m=>m.pid).map(m=>m.pid));ps.forEach(pid=>{if(document.getElementById("p-"+pid))updateSocial(pid)})}
let RESP=null;
function responderMsg(mid){const m=allMsgs().find(x=>x.id===mid);if(!m)return;RESP={pid:m.pid,snap:m.snap?{id:m.pid,titulo:m.snap.titulo||"",secao:m.snap.secao||""}:{id:m.pid}};$("#respbar")?.remove();const f=$("#mform");if(!f)return;f.insertAdjacentHTML("beforebegin",`<div id="respbar" class="respbar"><span>Respondendo a: <b>${esc(m.snap?.titulo||"notícia")}</b></span><button type="button" data-resp-x aria-label="Cancelar resposta">✕</button></div>`);$("#mtext")?.focus()}
var THREAD_DE=null;
function abrirConversa(uid){const de=VIEW;THREAD=uid;if(VIEW!=="msgs")go("msgs");else renderMsgs();if(pushH()){TST++;TST_AT=Date.now();THREAD_DE=de!=="msgs"?de:null}}

function listaPath(u){return "lista/"+[S.uid,u].sort().join("_")}
async function alternarLista(pid,com){if(precisaConta())return;if(!com){const am=amigosL();if(am.length===1)com=am[0];else{abrirEscolhaLista(pid);return}}
  const on=!(S.listas[com]||{})[pid];const sn=snapById(pid);const val=on?{uid:S.uid,at:Date.now(),snap:sn?{id:pid,titulo:sn.titulo||"",secao:sn.secao||"",imagem:sn.imagem||null}:{id:pid}}:null;
  if(on&&!S.amigos.has(com)){toast("Só dá para pôr na lista de um amigo.");return}
  pend("lista:"+com,pid,val);montarListas();if(VIEW==="saved")renderSaved();
  toast(on?"Na lista com "+nomeDe(com):"Saiu da lista com "+nomeDe(com),on?"Desfazer":"",on?()=>alternarLista(pid,com):null);
  try{await gravarMapa(listaPath(com),"itens",pid,val)}catch(e){delete PEND["lista:"+com+"\u0001"+pid];montarListas();if(VIEW==="saved")renderSaved();toast(S.amigos.has(com)?"Não deu para mudar a lista agora.":"Só dá para mudar a lista de um amigo.")}}
function linkMateria(pid){const o=/^https?:\/\/(localhost|127\.)/.test(location.origin)?location.origin:"https://prumonews.com.br";return `${o}/m/${encodeURIComponent(pid)}.html`}
async function compartilhar(pid){uso("compartilhar");evento("compartilhar",pid);const p=pautaById(pid),s=snapById(pid);const tit=(p?(p.neutro||{}).titulo:s&&s.titulo)||"Prumo News";const url=linkMateria(pid);
  try{if(navigator.share){await navigator.share({title:tit,text:tit,url});return}}catch(e){if(e&&e.name==="AbortError")return}
  const txt=`${tit}\n${url}`;try{await navigator.clipboard.writeText(txt);toast("Link copiado. É só colar no WhatsApp.")}catch(e){sheet("Compartilhar",`<p class="hint" style="margin:0">Copie e cole onde quiser:</p><textarea class="field" rows="3" readonly style="font-family:var(--f-ui)">${esc(txt)}</textarea>`)}}
function sequencia(dias){let n=0;let d=dataSP(FEED?.atualizado_em);if(!dias[d])d=somaDias(d,-1);while(dias[d]){n++;d=somaDias(d,-1)}return n}
function extraQuiz(u){const d=(S.quizDias||{})[u];if(!d)return "";const n=sequencia(d);let a=0,t=0;for(let i=0;i<7;i++){const x=d[somaDias(dataSP(),-i)];if(x){a+=+x.acertos||0;t+=+x.total||0}}return `${n>1?` · ${n} dias seguidos`:""}${t?` · ${a}/${t} na semana`:""}`}
function sequenciasHTML(){const Q=S.quizDias||{};const ids=Object.keys(Q).filter(u=>ehVisivel(u));if(!ids.length)return "";
  const sem=u=>{let a=0,t=0;for(let i=0;i<7;i++){const x=Q[u][somaDias(dataSP(),-i)];if(x){a+=+x.acertos||0;t+=+x.total||0}}return t?`${a}/${t} na semana`:""};
  return `<div class="streak">${ids.map(u=>{const n=sequencia(Q[u]||{});return `<span>${avatar(u)}<b>${esc(u===S.uid?"Você":nomeDe(u))}</b>${n?` · ${n} ${n===1?"dia":"dias"} seguidos`:""}${sem(u)?` · ${sem(u)}`:""}</span>`}).join("")}</div>`}
function juntosKey(a){return safeId((a._d||"")+"-"+norm(a.texto).replace(/[^a-z0-9]+/g,"-").slice(0,60))}
/* 25. sugestões de busca */
function sugestoes(){if(!FEED)return [];return [...new Set([...Object.keys(FEED.explicadores||{}),...ordenadas(FEED.pautas||[]).map(p=>p.tag).filter(Boolean)])].slice(0,10)}
/* 26. fim do feed */
function fimExtras(){if(!FEED)return "";const enq=visiveis().filter(p=>p.enquete&&(p.enquete.opcoes||[]).length);const pend=S.uid?enq.filter(p=>meuVoto(p.id)==null).length:0;const qz=(FEED.quiz||[]).length&&!(S.quiz||{})[S.uid||"eu"];
  if(!pend&&!qz)return "";return `<div class="fimx">${qz?`<button type="button" class="btn" data-vgo="play">Jogar o quiz do dia</button>`:""}${pend?`<button type="button" class="btn ghost" data-vgo="play">Votar em ${pend} ${pend===1?"enquete":"enquetes"}</button>`:""}</div>`}
/* 28. áudio com barra */
const AUD={it:[],i:0,on:false,pause:false,tok:0};
function vozPT(){const A=PREF.audio||{};const vs=speechSynthesis.getVoices();return vs.find(v=>v.name===A.voz)||vs.find(v=>/pt[-_]BR/i.test(v.lang))||vs.find(v=>/^pt/i.test(v.lang))}
function falarItens(it){if(!("speechSynthesis" in window)){toast("Este navegador não lê texto em voz alta.");return}try{speechSynthesis.resume()}catch(e){}speechSynthesis.cancel();AUD.it=it;AUD.i=0;AUD.on=true;AUD.pause=false;falando=true;AUD.erros=0;$("#b-audio")?.setAttribute("aria-pressed","true");falarAtual()}
function falarAtual(){if(!AUD.on)return;const x=AUD.it[AUD.i];if(!x){pararAudio();return}const tok=++AUD.tok;const u=new SpeechSynthesisUtterance(x.txt);u.lang="pt-BR";const v=vozPT();if(v)u.voice=v;u.rate=(PREF.audio||{}).rate||1;
  u.onend=()=>{if(tok!==AUD.tok||!AUD.on)return;AUD.i++;falarAtual()};u.onerror=ev=>{if(tok!==AUD.tok||!AUD.on||ev&&(ev.error==="interrupted"||ev.error==="canceled"))return;AUD.erros=(AUD.erros||0)+1;if(AUD.erros>2){pararAudio();toast("O celular não conseguiu ler em voz alta agora.");return}AUD.i++;setTimeout(falarAtual,120)};speechSynthesis.speak(u);
  document.querySelectorAll(".post.lendo").forEach(e=>e.classList.remove("lendo"));if(x.pid){marcarLida(x.pid);document.getElementById("p-"+x.pid)?.classList.add("lendo")}barraAudio()}
function pararAudio(){AUD.on=false;AUD.tok++;try{speechSynthesis.resume();speechSynthesis.cancel()}catch(e){}falando=false;$("#b-audio")?.setAttribute("aria-pressed","false");document.querySelectorAll(".post.lendo").forEach(e=>e.classList.remove("lendo"));barraAudio()}
function audCtrl(k){if(k==="stop"){pararAudio();return}if(k==="next"){AUD.tok++;try{speechSynthesis.resume()}catch(e){}speechSynthesis.cancel();AUD.pause=false;AUD.i++;setTimeout(falarAtual,60);return}if(k==="pp"){if(AUD.pause){speechSynthesis.resume();AUD.pause=false}else{speechSynthesis.pause();AUD.pause=true}barraAudio()}}
function barraAudio(){let b=$("#abar");document.body.classList.toggle("aud-on",!!AUD.on);if(!AUD.on){b?.remove();return}if(!b){b=document.createElement("div");b.id="abar";b.className="abar";document.body.appendChild(b)}const x=AUD.it[AUD.i]||{};const n=AUD.it.filter(y=>y.pid).length,k=AUD.it.slice(0,AUD.i+1).filter(y=>y.pid).length;
  b.innerHTML=`<button type="button" class="ab-t" ${x.pid?`data-goto="${esc(x.pid)}"`:""}><span>Ouvindo${x.pid?` · ${k} de ${n}`:""}</span><b>${esc(x.tit||"Prumo News")}</b></button><button type="button" data-aud="pp" aria-label="${AUD.pause?"Continuar":"Pausar"}">${AUD.pause?'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>':'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>'}</button><button type="button" data-aud="next" aria-label="Próxima notícia"><svg viewBox="0 0 24 24"><path d="M6 5.5l9 6.5-9 6.5z"/><rect x="16" y="5.5" width="2.5" height="13" rx="1"/></svg></button><button type="button" data-aud="stop" aria-label="Parar"><svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/></svg></button>`}

/* ================= conta, convites e amigos ================= */
function mostraErro(sel,msg){const el=$(sel);if(el){el.textContent=msg;el.hidden=false}}
function erroAuth(e){const m=String((e&&(e.message||e.code))||e||"").toLowerCase();
  if(/nome_unico|duplicate key|23505/.test(m))return "Já tem alguém com esse nome no Prumo. Use outro.";
  if(/nome_limpo/.test(m))return "Esse nome tem caracteres que não podem ser usados.";
  if(/invalid login|invalid_credentials|invalid credentials/.test(m))return "E-mail ou senha errados.";
  if(/already|registered|exists/.test(m))return "Este e-mail já tem conta. Use a aba Entrar.";
  if(/password/.test(m)&&/short|least|characters|weak|6/.test(m))return "A senha precisa ter pelo menos 6 caracteres.";
  if(/not confirmed/.test(m))return "Este e-mail ainda não foi confirmado. Fale com o Pedro.";
  if(/convite/.test(m))return "Convite inválido ou já usado.";
  if(/nome/.test(m))return "Escreva um nome de até 40 letras.";
  if(/email/.test(m)&&/invalid|valid|format/.test(m))return "Confira o e-mail.";
  if(/rate|too many|limit/.test(m))return "Muitas tentativas. Espere um pouco e tente de novo.";
  if(/fetch|network|failed|offline/.test(m))return "Sem conexão agora. Tente de novo.";
  return "Não deu certo agora. Tente de novo."}
function abrirLogin(aba,cod){aba=aba==="criar"?"criar":"entrar";const cria=aba==="criar",em=$("#lemail")?.value||"";
  sheet("Entrar no Prumo",`<div class="segs" role="tablist"><button type="button" role="tab" data-laba="entrar" aria-selected="${!cria}">Entrar</button><button type="button" role="tab" data-laba="criar" aria-selected="${cria}">Criar conta</button></div>
    <form id="lform" class="lform" novalidate>${cria?`<p class="hint" style="margin:0">O Prumo é só para convidados. O código vem no link que você recebeu.</p><label>Código do convite<input class="field" id="lcod" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" value="${esc(cod||CONVITE_URL||"")}"></label><label>Seu nome<input class="field" id="lnome" maxlength="40" autocomplete="given-name" placeholder="Como seus amigos vão te ver"></label>`:""}
    <label>E-mail<input class="field" id="lemail" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" value="${esc(em)}"></label>
    <label>Senha<input class="field" id="lsenha" type="password" autocomplete="${cria?"new-password":"current-password"}"${cria?' placeholder="Mínimo de 6 caracteres"':""}></label>
    <p class="erro-t" id="lerro" role="alert" hidden></p>
    <button class="btn" type="submit">${cria?"Criar conta":"Entrar"}</button>
    ${cria?"":`<button type="button" class="link" data-esqueci>Esqueci a senha</button><p class="hint" id="lesq" style="margin:0" hidden>Fale com o Pedro: ele redefine a sua senha.</p>`}</form>`);
  $("#lform").addEventListener("submit",e=>{e.preventDefault();if(cria)criarConta();else entrarConta()})}
async function entrarConta(){const em=$("#lemail").value.trim(),pw=$("#lsenha").value,b=$("#lform [type=submit]");
  if(!em||!pw)return mostraErro("#lerro","Preencha o e-mail e a senha.");
  const sb=sbCliente();if(!sb)return mostraErro("#lerro","O login não está disponível neste endereço.");
  b.disabled=true;try{const r=await sb.auth.signInWithPassword({email:em,password:pw});if(r.error)throw r.error;closeLayer();await trocarSessao(r.data.user||r.data.session?.user);if(S.membro)toast("Olá, "+nomeDe(S.uid)+".")}catch(e){b.disabled=false;mostraErro("#lerro",erroAuth(e))}}
async function criarConta(){const cod=$("#lcod").value.trim().toUpperCase(),nome=$("#lnome").value.trim(),em=$("#lemail").value.trim(),pw=$("#lsenha").value,b=$("#lform [type=submit]");
  if(!nome)return mostraErro("#lerro","Escreva seu nome.");if(!em||!/^\S+@\S+\.\S+$/.test(em))return mostraErro("#lerro","Confira o e-mail.");if(pw.length<6)return mostraErro("#lerro","A senha precisa ter pelo menos 6 caracteres.");
  const sb=sbCliente();if(!sb)return mostraErro("#lerro","O login não está disponível neste endereço.");
  b.disabled=true;CRIANDO=true;
  try{const r=await sb.auth.signUp({email:em,password:pw});if(r.error)throw r.error;let user=r.data.user;
    if(!r.data.session){const r2=await sb.auth.signInWithPassword({email:em,password:pw});if(r2.error){CRIANDO=false;b.disabled=false;return mostraErro("#lerro","A conta foi criada, mas o e-mail precisa ser confirmado antes. Fale com o Pedro.")}user=r2.data.user}
    await trocarSessao(user);
    try{await usarConvite(cod,nome,user)}catch(e){CRIANDO=false;abrirFaltaConvite({codigo:cod,nome,erro:erroAuth(e)});return}
    CRIANDO=false;closeLayer();boasVindas(nome)}
  catch(e){CRIANDO=false;b.disabled=false;mostraErro("#lerro",erroAuth(e))}}
function boasVindas(nome){setTimeout(()=>{sheet("Bem-vindo ao Prumo, "+nome,`<div class="bv">
  <div><b>📰 As notícias do dia, num lugar só</b><p>A cada hora o Prumo lê vários veículos, junta o que fala do mesmo fato e escreve um resumo próprio, com os ângulos de cada lado.</p></div>
  <div><b>👥 Seus amigos</b><p>Quem te convidou já é seu amigo. Amigos veem o que você curte, vota e comenta. Mensagens ficam só entre vocês dois. Para achar mais gente, vá ao Perfil › Adicionar amigos.</p></div>
  <div><b>📲 Use como app</b><p>No celular, adicione o Prumo à tela de início. O passo a passo está no fim do Perfil.</p></div></div>`,`<button type="button" class="btn" data-close>Começar a ler</button>`)},280)}
async function usarConvite(cod,nome,user){const sb=sbCliente();const u=user||S.user;const r=await sb.rpc("entrar",{p_codigo:cod||null,p_nome:nome});if(r.error)throw r.error;await trocarSessao(u,true);return r.data}
function abrirFaltaConvite(o){o=o||{};if(!S.uid)return abrirLogin();
  sheet("Falta só o convite",`<p class="hint" style="margin:0;font-size:14.5px">Você entrou como <b>${esc(S.email)}</b>, mas ainda não faz parte do Prumo. Use o código do convite que você recebeu.</p>
    <form id="fform" class="lform" novalidate><label>Código do convite<input class="field" id="fcod" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" value="${esc(o.codigo||CONVITE_URL||"")}"></label><label>Seu nome<input class="field" id="fnome" maxlength="40" autocomplete="given-name" value="${esc(o.nome||"")}"></label>
    <p class="erro-t" id="ferro" role="alert"${o.erro?"":" hidden"}>${esc(o.erro||"")}</p><button class="btn" type="submit">Entrar no Prumo</button><button type="button" class="link" data-sair>Sair desta conta</button></form>`);
  $("#fform").addEventListener("submit",async e=>{e.preventDefault();const cod=$("#fcod").value.trim().toUpperCase(),nome=$("#fnome").value.trim(),b=e.target.querySelector("[type=submit]");if(!nome)return mostraErro("#ferro","Escreva seu nome.");
    b.disabled=true;try{await usarConvite(cod,nome);closeLayer();boasVindas(nome)}catch(err){b.disabled=false;mostraErro("#ferro",erroAuth(err))}})}
async function sair(){closeLayer();const sb=sbCliente();await trocarSessao(null);try{await sb?.auth.signOut({scope:"local"})}catch(e){}limparLocalConta();toast("Você saiu.")}
/* o que é pessoal e fica no aparelho: some ao sair e quando outra conta entra neste aparelho.
   Fica: radar-feed (edição pública em cache) e a sessão do Supabase (o signOut cuida). */
const CHAVES_CONTA=["radar-prefs","radar-vistos","radar-lidas2","radar-hist","radar-uso","prumo-abag","prumo-cutuc","prumo-dono"];
function limparLocalConta(){CHAVES_CONTA.forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});["radar-filtro","prumo-aviso"].forEach(k=>{try{sessionStorage.removeItem(k)}catch(e){}});
  Object.keys(PREF).forEach(k=>delete PREF[k]);Object.assign(PREF,{ordem:[],ocultas:[],ajuste:{sec:{},tag:{}},fonte:1,conhecidas:{}});normPrefs();
  SEEN.clear();LIDAS.clear();HIST={};USO={};ABA_G="minhas";FILTRO="tudo";VISITA0=null;NOVAS=new Set();ATUALIZADAS=new Set();NOVID=[];QUIZ_LOCAL=null;RESP=null;THREAD=null;
  aplicarFonte();if(FEED){calcularNovidades();renderFeed();renderChgBox()}rerenderAll()}
function listaPessoasSheet(tit,intro,ids,linha,vazio,servidor){
  const draw=q=>{const n=norm(q||"").trim(),todos=ids(),l=todos.filter(u=>!n||norm(nomeDe(u)).includes(n));return l.length?`<ul class="amgl">${l.map(linha).join("")}</ul>`:`<div class="empty" style="padding:14px 0"><b>${n?"Ninguém com esse nome":vazio}</b></div>`};
  sheet(tit,`${intro||""}${servidor?`<form id="pform" class="pbusca"><input class="field" id="pq" type="search" autocomplete="off" enterkeyhint="search" placeholder="Nome da pessoa" aria-label="Nome da pessoa"><button type="submit" class="btn ghost" id="pbusca">Procurar</button></form>`:ids().length>5?`<input class="field" id="pq" type="search" autocomplete="off" enterkeyhint="search" placeholder="Buscar pelo nome" aria-label="Buscar pelo nome">`:""}<div id="pbox">${draw("")}</div>`);
  $("#pform")?.addEventListener("submit",e=>{e.preventDefault();procurarNome($("#pq").value)});
  const i=$("#pq");if(i)i.addEventListener("input",()=>{const b=$("#pbox");if(b)b.innerHTML=draw(i.value)});
  return ()=>{const b=$("#pbox");if(!b)return false;b.innerHTML=draw($("#pq")?.value||"");return true}}
const linhaAmigo=x=>`<li><button type="button" class="amg-r" data-conversa="${esc(x)}">${avatar(x)}<span class="amg-n"><b>${esc(nomeDe(x))}</b><span>Conversar</span></span><i aria-hidden="true">›</i></button></li>`;
function abrirTodosAmigos(){listaPessoasSheet(`Seus amigos (${amigosL().length})`,"",amigosL,linhaAmigo,"Nenhum amigo ainda")}
function abrirNovaConversa(){if(precisaConta())return;listaPessoasSheet("Nova conversa","",amigosL,linhaAmigo,"Nenhum amigo ainda")}
async function cancelarPedido(u){if(precisaConta())return;S.pedidosOut=S.pedidosOut.filter(x=>x!==u);rerenderAll();S._reAmg&&S._reAmg();
  try{await S.db.rpc("desfazer_amizade",{p_uid:u});toast("Pedido cancelado.")}catch(e){toast("Não deu para cancelar agora.");S.db&&S.db.recarregar()}}
function abrirAddAmigos(){if(precisaConta())return;
  const vivo=u=>{const m=S.membros[u];return !m||!(m.excluido||m.suspenso)};
  const ids=()=>[...new Set([...Object.keys(S.membros),...Object.keys(S.achados||{})])].filter(u=>u!==S.uid&&!S.amigos.has(u)&&vivo(u)&&!(S.bloq||[]).includes(u)).sort((a,b)=>(S.pedidosIn.includes(b)-S.pedidosIn.includes(a))||(S.pedidosOut.includes(b)-S.pedidosOut.includes(a))||((S.comuns[b]||0)-(S.comuns[a]||0))||nomeDe(a).localeCompare(nomeDe(b),"pt-BR"));
  const linha=u=>{const env=S.pedidosOut.includes(u),rec=S.pedidosIn.includes(u),cp=S.membros[u]?.convidado_por,nc=S.comuns[u]||0;
    return `<li>${avatar(u)}<span class="amg-n"><b>${esc(nomeDe(u))}</b>${rec?`<span>quer ser seu amigo</span>`:cp===S.uid?`<span>você convidou</span>`:nc?`<span>${nc} ${nc===1?"amigo":"amigos"} em comum</span>`:""}</span>${rec?`<button type="button" class="btn amg-b" data-aceitar="${esc(u)}">Aceitar</button>`:env?`<button type="button" class="btn ghost amg-b" data-cancelar="${esc(u)}">Cancelar pedido</button>`:`<button type="button" class="btn amg-b" data-pedir="${esc(u)}">Pedir amizade</button>`}</li>`};
  const re=listaPessoasSheet("Adicionar amigos",`<p class="hint" style="margin:0">Aqui aparecem amigos dos seus amigos. Para achar outra pessoa do Prumo, digite o nome completo dela e toque em “Procurar”. Para trazer alguém novo, use “Convidar alguém”.</p>`,ids,linha,"Nenhuma sugestão por enquanto",true);
  S._reAmg=()=>{if(!re())S._reAmg=null};
  S.db.rpc("amigos_em_comum").then(r=>{S.comuns={};(r||[]).forEach(x=>S.comuns[x.uid]=x.comuns);S._reAmg&&S._reAmg()}).catch(()=>{})}
async function procurarNome(n){n=String(n||"").trim();if(n.length<2||!S.db)return;const b=$("#pbusca");if(b){b.disabled=true;b.textContent="Procurando…"}
  try{const r=await S.db.rpc("buscar_membro",{p_nome:n});const x=(r||[])[0];
    if(x&&x.uid!==S.uid){S.achados[x.uid]=x.nome;S._reAmg&&S._reAmg()}else{const bx=$("#pbox");if(bx)bx.insertAdjacentHTML("afterbegin",`<p class="hint" style="margin:6px 0">Ninguém no Prumo com o nome exato “${esc(n)}”.</p>`)}}
  catch(e){toast("Não deu para procurar agora.")}
  const b2=$("#pbusca");if(b2){b2.disabled=false;b2.textContent="Procurar"}}
async function pedirAmizade(u,btn){if(precisaConta())return;if(btn){btn.disabled=true;btn.textContent="Enviando…";btn.classList.add("ghost")}
  try{const r=await S.db.rpc("pedir_amizade",{p_uid:u});if(r==="aceita"){S.amigos.add(u);toast("Agora você e "+nomeDe(u)+" são amigos.")}else{if(!S.pedidosOut.includes(u))S.pedidosOut.push(u);toast("Pedido enviado para "+nomeDe(u)+".")}rerenderAll()}
  catch(e){if(btn){btn.disabled=false;btn.textContent="Pedir amizade";btn.classList.remove("ghost")}const m=String(e&&(e.message+" "+e.code));toast(/demais|54000/.test(m)?"Você já tem muitos pedidos esperando resposta.":/invalido|22023/.test(m)?"Não dá para pedir amizade a essa pessoa.":"Não deu para pedir agora.")}}
async function responderAmizade(u,aceitar){if(precisaConta())return;S.pedidosIn=S.pedidosIn.filter(x=>x!==u);if(aceitar)S.amigos.add(u);rerenderAll();
  try{await S.db.rpc("responder_amizade",{p_uid:u,p_aceitar:!!aceitar});toast(aceitar?"Agora você e "+nomeDe(u)+" são amigos.":"Pedido recusado.")}catch(e){toast("Não deu para responder agora.");S.db&&S.db.recarregar()}}
function abrirThMenu(u){if(!S.amigos.has(u))return;sheet("Conversa com "+nomeDe(u),`<div class="opt"><button type="button" data-desfazer="${esc(u)}">Desfazer amizade<span>vocês deixam de se ver</span></button><button type="button" data-bloquear="${esc(u)}">Bloquear ${esc(nomeDe(u))}<span>não pode mais te achar nem pedir amizade</span></button><button type="button" data-denp="${esc(u)}">Denunciar ${esc(nomeDe(u))}<span>o Pedro recebe e analisa</span></button></div>`)}
function abrirDenuncia(tipo,alvo,ref,pid){if(precisaConta())return;
  sheet("Denunciar",`<p style="margin:0;font-size:15px;line-height:1.5">${tipo==="comentario"?"O comentário":"A conta de "+esc(nomeDe(alvo))} vai para o Pedro, que analisa. ${esc(nomeDe(alvo))} não fica sabendo quem denunciou.</p><textarea id="dmot" class="field" rows="3" maxlength="500" placeholder="O que aconteceu? (opcional)"></textarea><p class="erro-t" id="derro" role="alert" hidden></p><button type="button" class="btn" id="dok">Enviar denúncia</button>${S.amigos.has(alvo)||tipo==="pessoa"?`<label class="chk"><input type="checkbox" id="dblq"> Também bloquear ${esc(nomeDe(alvo))}</label>`:""}`);
  $("#dok").addEventListener("click",async e=>{const b=e.currentTarget;b.disabled=true;
    try{await S.db.rpc("denunciar",{p_tipo:tipo,p_alvo:alvo,p_ref:ref||null,p_pid:pid||null,p_motivo:$("#dmot").value.trim()||null});const blq=$("#dblq")?.checked;closeLayer();toast("Denúncia enviada. Obrigado.");if(blq)bloquear(alvo,true)}
    catch(err){b.disabled=false;mostraErro("#derro",/demais|54000/.test(String(err&&(err.message+" "+err.code)))?"Você já mandou muitas denúncias hoje.":"Não deu para enviar agora.")}})}
function confirmarBloqueio(u){sheet("Bloquear "+nomeDe(u)+"?",`<p style="margin:0;font-size:15px;line-height:1.5">A amizade é desfeita, ${esc(nomeDe(u))} deixa de te achar no Prumo e não pode mais pedir amizade nem mandar mensagem. Dá para desbloquear depois no Perfil.</p><button type="button" class="btn perigo" data-bloquearok="${esc(u)}">Bloquear</button><button type="button" class="btn ghost" data-close>Cancelar</button>`)}
async function bloquear(u,sem){if(!sem)closeLayer();try{await S.db.rpc("bloquear",{p_uid:u});S.amigos.delete(u);if(!S.bloq.includes(u))S.bloq.push(u);if(THREAD===u){THREAD=null;if(TST>0){TST--;voltarH(1)}}rerenderAll();toast(nomeDe(u)+" foi bloqueado.")}catch(e){toast("Não deu para bloquear agora.")}}
