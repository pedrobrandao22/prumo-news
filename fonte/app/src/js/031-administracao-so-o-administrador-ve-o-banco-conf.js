/* ---------- administração (só o administrador vê; o banco confere) ---------- */
const fmtD=t=>t?new Date(t).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",timeZone:"America/Sao_Paulo"}):"";
function abrirAdmin(aba){S._admAba=aba||S._admAba||"pessoas";S.adm=S.adm||{};
  sheet("Administração",`<div class="segs" role="tablist">${[["uso","Uso"],["pessoas","Pessoas"],["convites","Convites"],["capa","Capa"],["denuncias","Denúncias"],["erros","Erros"]].map(([k,l])=>`<button type="button" role="tab" data-admaba="${k}" aria-selected="${S._admAba===k}">${l}</button>`).join("")}</div><div id="admbox"><p class="hint">Carregando…</p></div>`);
  onClose=()=>{S._admAba=null};adminCarregar()}
async function adminCarregar(){const k=S._admAba;if(!k||!S.db)return;if(k==="capa"){await carregarCapaFixa(true);adminDesenhar();return}if(k==="uso"){await usoCarregar();return}const rpc={pessoas:"admin_membros",convites:"admin_convites",denuncias:"admin_denuncias",erros:"admin_erros"}[k];
  try{S.adm[k]=await S.db.rpc(rpc)||[];if(k==="erros")carregarErrosResp()}catch(e){const b=$("#admbox");if(b)b.innerHTML=`<p class="erro-t">Não deu para carregar agora.</p>`;return}adminDesenhar()}
function adminDesenhar(){const b=$("#admbox"),k=S._admAba;if(!b||!k)return;if(k==="uso"){usoDesenhar();return}const L=S.adm[k]||[];const nm=u=>u?esc(S.membros[u]?.nome||"?"):"—";let h="";
  if(k==="pessoas"){const q=norm($("#admq")?.value||"");const l=L.filter(m=>!q||norm(m.nome+" "+(m.email||"")).includes(q));
    h=`<input class="field" id="admq" type="search" placeholder="Buscar nome ou e-mail" value="${esc($("#admq")?.value||"")}"><p class="hint">${L.filter(m=>!m.excluido_em).length} pessoas no Prumo. Para redefinir a senha de alguém, use o e-mail no painel do Supabase (Authentication › Users).</p><ul class="adml">${l.map(m=>`<li><div><b>${esc(m.nome)}</b>${m.papel==="admin"?` <em class="tag">admin</em>`:""}${m.suspenso_em?` <em class="tag bad">suspensa</em>`:""}${m.excluido_em?` <em class="tag">excluída</em>`:""}<span>${esc(m.email||"")}</span><span>entrou ${fmtD(m.criado_em)}${m.convidado_por?" · convite de "+nm(m.convidado_por):""} · ${m.amigos} ${m.amigos===1?"amigo":"amigos"} · convites ${m.convites_usados}/${m.papel==="admin"?"∞":m.cota_convites}</span></div>${m.excluido_em||m.papel==="admin"?"":`<div class="admb"><button type="button" class="btn ghost amg-b" data-admcota="${esc(m.uid)}">+1 convite</button><button type="button" class="btn ghost amg-b ${m.suspenso_em?"":"perigo"}" data-admsusp="${esc(m.uid)}" data-on="${m.suspenso_em?0:1}">${m.suspenso_em?"Reativar":"Suspender"}</button></div>`}</li>`).join("")}</ul>`}
  if(k==="convites"){const ag=Date.now(),ab=L.filter(c=>!c.usado_em&&Date.parse(c.expira_em)>ag),us=L.filter(c=>c.usado_em).slice(0,30);
    h=`<b class="cm-h">Em aberto (${ab.length})</b>${ab.length?`<ul class="adml">${ab.map(c=>`<li><div><b class="cvcod" style="font-size:15px">${esc(c.codigo)}</b><span>de ${nm(c.criado_por)} · vale até ${fmtD(c.expira_em)}</span></div><div class="admb"><button type="button" class="btn ghost amg-b" data-revogar="${esc(c.codigo)}">Cancelar</button></div></li>`).join("")}</ul>`:`<p class="hint">Nenhum.</p>`}
      <b class="cm-h">Usados</b>${us.length?`<ul class="adml">${us.map(c=>`<li><div><b>${nm(c.usado_por)}</b><span>convite de ${nm(c.criado_por)} · ${fmtD(c.usado_em)}</span></div></li>`).join("")}</ul>`:`<p class="hint">Nenhum.</p>`}`}
  if(k==="denuncias")h=L.length?`<ul class="adml">${L.map(d=>`<li class="${d.status==="aberta"?"":"feito"}"><div><b>${d.tipo==="comentario"?"Comentário":d.tipo==="mensagem"?"Mensagem":"Pessoa"} de ${nm(d.alvo)}</b>${d.status!=="aberta"?` <em class="tag">${esc(d.status)}</em>`:""}${d.texto?`<span class="q">“${esc(d.texto)}”</span>`:""}<span>denunciado por ${nm(d.de)} · ${fmtD(d.criado_em)}${d.motivo?" · "+esc(d.motivo):""}</span></div>${d.status==="aberta"?`<div class="admb">${d.tipo==="comentario"?`<button type="button" class="btn ghost amg-b perigo" data-admapag="${esc(d.alvo)}" data-cid="${esc(d.ref)}" data-id="${esc(d.id)}">Apagar comentário</button>`:""}${d.alvo?`<button type="button" class="btn ghost amg-b perigo" data-admsusp="${esc(d.alvo)}" data-on="1">Suspender</button>`:""}<button type="button" class="btn ghost amg-b" data-admden="${esc(d.id)}" data-st="resolvida">Resolvida</button><button type="button" class="btn ghost amg-b" data-admden="${esc(d.id)}" data-st="descartada">Descartar</button></div>`:""}</li>`).join("")}</ul>`:`<div class="empty" style="padding:14px 0"><b>Nenhuma denúncia</b></div>`;
  if(k==="erros")h=L.length?`<ul class="adml">${L.map(e=>{const r=S.errosResp?.[e.id]||{};const st=r.status||e.status;return `<li><div><b>${esc(e.titulo||e.pid||"")}</b><span class="q">“${esc(e.texto)}”</span><span>${nm(e.uid)} · ${fmtD(e.at)} · ${esc(st==="corrigido"?"corrigido":st==="mantido"?"conferido, sem erro":st==="em_analise"?"em análise":"aguardando a rodada")}${r.resposta?" · "+esc(r.resposta):""}</span></div></li>`}).join("")}</ul>`:`<div class="empty" style="padding:14px 0"><b>Nenhum aviso de erro</b></div>`;
  if(k==="capa")h=capaAdminHTML();
  b.innerHTML=h;const q=$("#admq");if(q&&!q._w){q._w=1;q.addEventListener("input",()=>{const p=q.selectionStart;adminDesenhar();const n=$("#admq");if(n){n.focus();try{n.setSelectionRange(p,p)}catch(e){}}})}}
async function adminAcao(rpc,args,ok){try{await S.db.rpc(rpc,args);if(ok)toast(ok);adminCarregar()}catch(e){toast("Não deu agora: "+(e&&e.message||"erro"))}}
async function abrirBloqueados(){if(precisaConta())return;let r=[];try{r=(await S.db.rpc("meus_bloqueios"))||[]}catch(e){toast("Não deu para abrir agora.");return}
  r.forEach(x=>{if(!S.membros[x.uid])S.achados[x.uid]=x.nome});const l=r.map(x=>x.uid);S.bloq=l.slice();
  sheet("Pessoas bloqueadas",l.length?`<ul class="amgl">${l.map(u=>`<li>${avatar(u)}<span class="amg-n"><b>${esc(nomeDe(u))}</b></span><button type="button" class="btn ghost amg-b" data-desbloq="${esc(u)}">Desbloquear</button></li>`).join("")}</ul>`:`<div class="empty" style="padding:14px 0"><b>Ninguém bloqueado</b></div>`)}
async function desbloquear(u,b){if(b)b.disabled=true;try{await S.db.rpc("desbloquear",{p_uid:u});S.bloq=S.bloq.filter(x=>x!==u);toast(nomeDe(u)+" foi desbloqueado.");abrirBloqueados()}catch(e){if(b)b.disabled=false;toast("Não deu para desbloquear agora.")}}
function confirmarDesfazer(u){sheet("Desfazer amizade?",`<p style="margin:0;font-size:15px;line-height:1.5">Você e ${esc(nomeDe(u))} deixam de ver as curtidas, os votos e os comentários um do outro, e não dá mais para trocar mensagens. A conversa antiga continua aqui. Dá para pedir amizade de novo depois.</p><button type="button" class="btn perigo" data-desfazerok="${esc(u)}">Desfazer amizade</button><button type="button" class="btn ghost" data-close>Cancelar</button>`)}
async function desfazerAmizade(u){closeLayer();try{await S.db.rpc("desfazer_amizade",{p_uid:u});S.amigos.delete(u);if(THREAD===u){THREAD=null;if(TST>0){TST--;voltarH(1)}}rerenderAll();toast("Amizade desfeita.")}catch(e){toast("Não deu para desfazer agora.")}}
function abrirConvite(){if(precisaConta())return;
  sheet("Convidar alguém",`<p style="margin:0;font-size:15px;line-height:1.5">Gere um link e mande para a pessoa. Ela cria a conta por ele e vocês já entram como amigos.</p><p class="hint" style="margin:0">Cada convite vale para uma pessoa, por 7 dias.</p><div id="cvcota" class="hint"></div><div id="cvbox" style="display:flex;flex-direction:column;gap:8px"><button type="button" class="btn" data-gerarconvite>Gerar convite</button></div><div id="cvmeus"></div>`);
  carregarMeusConvites()}
async function carregarMeusConvites(){if(!S.db)return;let r=null;try{r=await S.db.rpc("meus_convites")}catch(e){return}if(!r)return;S._cv=r;
  const cota=$("#cvcota");const resta=r.admin?null:Math.max(0,(r.cota||0)-(r.usados||0)-(r.abertos||[]).length);
  if(cota)cota.innerHTML=r.admin?"Você é o administrador: convites sem limite.":resta?`Você ainda pode convidar <b>${resta}</b> ${resta===1?"pessoa":"pessoas"}.`:`<b>Seus convites acabaram.</b> Peça mais ao Pedro.`;
  if(!r.admin&&!resta&&!S._cvlink){const bx=$("#cvbox");if(bx)bx.innerHTML=""}
  const mm=$("#cvmeus");if(mm)mm.innerHTML=(r.abertos||[]).length?`<b class="cm-h" style="display:block;margin:6px 0 2px">Convites ainda não usados</b><ul class="amgl">${r.abertos.map(c=>`<li><span class="amg-n"><b class="cvcod" style="font-size:15px">${esc(c.codigo)}</b><span>vale até ${esc(new Date(c.expira_em).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",timeZone:"America/Sao_Paulo"}))}</span></span><button type="button" class="btn ghost amg-b" data-cvlink="${esc(c.codigo)}">Link</button><button type="button" class="btn ghost amg-b" data-revogar="${esc(c.codigo)}">Cancelar</button></li>`).join("")}</ul>`:""}
async function revogarConvite(c,b){if(b)b.disabled=true;try{await S.db.rpc("revogar_convite",{p_codigo:c});toast("Convite cancelado.");carregarMeusConvites();if(S._admAba)adminCarregar()}catch(e){if(b)b.disabled=false;toast("Não deu para cancelar agora.")}}
function linkConvite(c){const link=location.origin+location.pathname+"?convite="+encodeURIComponent(c);S._cvlink=link;const bx=$("#cvbox");if(bx)bx.innerHTML=`<div class="cvlink"><span class="hint">Código do convite</span><b class="cvcod">${esc(c)}</b><input class="field" id="cvurl" readonly value="${esc(link)}" aria-label="Link do convite"></div><button type="button" class="btn" data-cvshare>Enviar o link</button><button type="button" class="btn ghost" data-cvcopy>Copiar o link</button>`}
async function gerarConvite(){const bx=$("#cvbox");if(bx)bx.innerHTML=`<p class="hint" style="margin:0">Gerando o convite…</p>`;
  try{const c=await S.db.rpc("criar_convite");const link=location.origin+location.pathname+"?convite="+encodeURIComponent(c);S._cvlink=link;
    if($("#cvbox"))$("#cvbox").innerHTML=`<div class="cvlink"><span class="hint">Código do convite</span><b class="cvcod">${esc(c)}</b><input class="field" id="cvurl" readonly value="${esc(link)}" aria-label="Link do convite"></div><button type="button" class="btn" data-cvshare>Enviar o link</button><button type="button" class="btn ghost" data-cvcopy>Copiar o link</button>`}
  catch(e){const m=String(e&&(e.message+" "+e.code));if($("#cvbox"))$("#cvbox").innerHTML=/sem convites|54001/.test(m)?`<p class="erro-t">Seus convites acabaram. Peça mais ao Pedro.</p>`:`<p class="erro-t">${/demais|54000/.test(m)?"Você já tem muitos convites sem uso. Espere alguém usar um deles.":"Não deu para gerar o convite agora."}</p><button type="button" class="btn" data-gerarconvite>Tentar de novo</button>`;return}
  carregarMeusConvites()}
async function copiarConvite(){const l=S._cvlink;if(!l)return;try{await navigator.clipboard.writeText(l);toast("Link copiado.")}catch(e){const i=$("#cvurl");if(i){i.focus();i.select()}toast("Selecione e copie o link.")}}
async function enviarConvite(){const l=S._cvlink;if(!l)return;try{if(navigator.share){await navigator.share({title:"Prumo News",text:"Entre no Prumo News com o meu convite:",url:l});return}}catch(e){if(e&&e.name==="AbortError")return}copiarConvite()}
function abrirPrivacidade(){sheet("Política de privacidade",`<div class="priv" style="display:flex;flex-direction:column;gap:8px">
  <h4>O que o Prumo guarda</h4><p>Seu nome e e-mail; suas curtidas, votos, comentários e leituras; o quiz; as mensagens; as guardadas e as notas; o histórico de leitura; as preferências do app; e os avisos de erro que você manda.</p>
  <h4>Quem vê</h4><p>Seus amigos veem suas curtidas, votos e comentários. Mensagens, só quem mandou e quem recebeu. Guardadas, notas, leituras, quiz, histórico e preferências, só você. Seu nome aparece para os seus amigos e para os amigos deles; outras pessoas só te acham digitando o seu nome completo.</p>
  <h4>Administração</h4><p>O Pedro administra o Prumo: ele vê a lista de pessoas (nome, e-mail, quem convidou quem), os avisos de erro e as denúncias, e pode apagar um comentário denunciado ou suspender uma conta. Ele não vê as suas mensagens, a não ser uma que você mesmo denunciar.</p>
  <h4>Bloquear e denunciar</h4><p>Quem você bloqueia deixa de te achar e não pode pedir amizade nem mandar mensagem. Quem é denunciado não fica sabendo quem denunciou.</p>
  <p>O texto dos avisos de erro (sem o nome de quem mandou) é lido pela rodada automática que confere as notícias.</p>
  <h4>Onde fica</h4><p>No Supabase, com servidores em São Paulo.</p>
  <h4>O que o Prumo não faz</h4><p>Não tem anúncios e não vende nem repassa dados.</p>
  <h4>Apagar</h4><p>Excluir a conta apaga tudo o que é seu, na hora e sem volta.</p>
  <p class="hint">Dúvidas: fale com o Pedro.</p></div>`)}
function abrirExcluir(){if(!S.uid)return;sheet("Excluir minha conta",`<p style="margin:0;font-size:15px;line-height:1.5">Isso apaga a sua conta e tudo o que é seu no Prumo: login, curtidas, votos, comentários, quiz, guardadas, notas, histórico e preferências. As mensagens que você trocou continuam com a outra pessoa, com o seu nome trocado por “Conta excluída”.</p><p style="margin:0;font-size:15px"><b>Não tem volta.</b></p><p class="erro-t" id="exerro" role="alert" hidden></p><button type="button" class="btn perigo" data-excluirok>Excluir para sempre</button><button type="button" class="btn ghost" data-close>Cancelar</button>`)}
async function excluirConta(b){if(!S.db)return;if(b)b.disabled=true;
  try{await S.db.rpc("excluir_conta")}catch(e){if(b)b.disabled=false;mostraErro("#exerro","Não deu para excluir agora. Tente de novo.");return}
  try{S.db&&S.db.fechar()}catch(e){}try{await sbCliente()?.auth.signOut({scope:"local"})}catch(e){}
  limparLocalConta();try{localStorage.removeItem("prumo-auth")}catch(e){}
  try{sessionStorage.setItem("prumo-excluida","1")}catch(e){}location.reload()}
function abrirAmigosPost(pid){const at=atividadeAmigos(pid);
  sheet("Amigos nesta notícia",at.length?`<ul class="clist">${at.map(({u,ac})=>`<li>${avatar(u)}<div><span><b>${esc(nomeDe(u))}</b></span><i>${esc(ac.join(" · "))}</i></div><button type="button" class="c-a conv" data-conversa="${esc(u)}">Conversar</button></li>`).join("")}</ul>`:`<div class="empty" style="padding:18px 0"><b>Nenhum amigo por aqui ainda</b></div>`)}
function abrirEscolhaLista(pid){if(precisaConta())return;const am=amigosL();if(!am.length)return;
  sheet("Pôr numa lista com…",`<div class="opt">${am.map(u=>{const na=!!(S.listas[u]||{})[pid];return `<button type="button" data-lista="${esc(pid)}" data-com="${esc(u)}"><span style="display:flex;align-items:center;gap:10px;color:var(--ink);font-size:15.5px">${avatar(u)}${esc(nomeDe(u))}</span><span>${na?"na lista · tirar":"pôr"}</span></button>`}).join("")}</div><p class="hint">Cada lista é só de vocês dois.</p>`)}
function cliqueConta(t){
  const en=t.closest("[data-entrar]");if(en){if(!S.uid)abrirLogin(en.dataset.entrar||"entrar");else if(!S.membro)abrirFaltaConvite();return true}
  const la=t.closest("[data-laba]");if(la){abrirLogin(la.dataset.laba,$("#lcod")?.value);return true}
  if(t.closest("[data-esqueci]")){const p=$("#lesq");if(p)p.hidden=false;return true}
  if(t.closest("[data-sair]")){sair();return true}
  if(t.closest("[data-privacidade]")){abrirPrivacidade();return true}
  if(t.closest("[data-bloqueados]")){abrirBloqueados();return true}
  const db_=t.closest("[data-desbloq]");if(db_){desbloquear(db_.dataset.desbloq,db_);return true}
  const bq=t.closest("[data-bloquear]");if(bq){confirmarBloqueio(bq.dataset.bloquear);return true}
  const bqo=t.closest("[data-bloquearok]");if(bqo){bloquear(bqo.dataset.bloquearok);return true}
  const dp=t.closest("[data-denp]");if(dp){abrirDenuncia("pessoa",dp.dataset.denp);return true}
  const dc=t.closest("[data-denc]");if(dc){abrirDenuncia("comentario",dc.dataset.du,dc.dataset.denc,dc.dataset.dp);return true}
  const rv=t.closest("[data-revogar]");if(rv){revogarConvite(rv.dataset.revogar,rv);return true}
  const cl=t.closest("[data-cvlink]");if(cl){linkConvite(cl.dataset.cvlink);return true}
  if(t.closest("[data-admin]")){abrirAdmin();return true}
  const aa=t.closest("[data-admaba]");if(aa){S._admAba=aa.dataset.admaba;document.querySelectorAll("[data-admaba]").forEach(x=>x.setAttribute("aria-selected",String(x===aa)));const b=$("#admbox");if(b)b.innerHTML=`<p class="hint">Carregando…</p>`;adminCarregar();return true}
  const ac_=t.closest("[data-admcota]");if(ac_){adminAcao("admin_cota",{p_uid:ac_.dataset.admcota,p_delta:1},"+1 convite para "+nomeDe(ac_.dataset.admcota));return true}
  const as_=t.closest("[data-admsusp]");if(as_){const on=as_.dataset.on==="1";if(on&&!as_.classList.contains("conf")){as_.classList.add("conf");as_.textContent="Toque de novo";return true}adminAcao("admin_suspender",{p_uid:as_.dataset.admsusp,p_suspender:on},on?"Conta suspensa.":"Conta reativada.");return true}
  const ap_=t.closest("[data-admapag]");if(ap_){if(!ap_.classList.contains("conf")){ap_.classList.add("conf");ap_.textContent="Toque de novo";return true}(async()=>{try{await S.db.rpc("admin_apagar_comentario",{p_uid:ap_.dataset.admapag,p_cid:ap_.dataset.cid});await S.db.rpc("admin_resolver_denuncia",{p_id:ap_.dataset.id,p_status:"resolvida"});toast("Comentário apagado.");adminCarregar()}catch(e){toast("Não deu agora.")}})();return true}
  const ad_=t.closest("[data-admden]");if(ad_){adminAcao("admin_resolver_denuncia",{p_id:ad_.dataset.admden,p_status:ad_.dataset.st});return true}
  if(t.closest("[data-excluir]")){abrirExcluir();return true}
  const xo=t.closest("[data-excluirok]");if(xo){excluirConta(xo);return true}
  if(t.closest("[data-addamigos]")){abrirAddAmigos();return true}
  if(t.closest("[data-convidar]")){abrirConvite();return true}
  if(t.closest("[data-gerarconvite]")){gerarConvite();return true}
  if(t.closest("[data-cvcopy]")){copiarConvite();return true}
  if(t.closest("[data-cvshare]")){enviarConvite();return true}
  const pe=t.closest("[data-pedir]");if(pe){pedirAmizade(pe.dataset.pedir,pe);return true}
  const ac=t.closest("[data-aceitar]");if(ac){responderAmizade(ac.dataset.aceitar,true);return true}
  const rc=t.closest("[data-recusar]");if(rc){responderAmizade(rc.dataset.recusar,false);return true}
  const cv=t.closest("[data-conversa]");if(cv){const u=cv.dataset.conversa;if(cv.closest(".sheet"))closeLayer();abrirConversa(u);return true}
  if(t.closest("[data-thmenu]")){if(THREAD)abrirThMenu(THREAD);return true}
  const df=t.closest("[data-desfazer]");if(df){confirmarDesfazer(df.dataset.desfazer);return true}
  const dk=t.closest("[data-desfazerok]");if(dk){desfazerAmizade(dk.dataset.desfazerok);return true}
  const ot=t.closest("[data-otrs]");if(ot){abrirAmigosPost(ot.dataset.otrs);return true}
  return false}

/* ================= Etapa 1: visual ================= */
(function(){
  const nav=$(".nav"),topo=$("header.top");if(!nav||!topo)return;
  /* rótulos da barra em <span>, para encolher só o texto */
  nav.querySelectorAll("button").forEach(b=>[...b.childNodes].forEach(n=>{if(n.nodeType===3&&n.textContent.trim()){const sp=document.createElement("span");sp.className="lbl";sp.textContent=n.textContent.trim();n.replaceWith(sp)}}));
  /* reduzir transparência */
  const vidro=()=>document.documentElement.classList.toggle("sem-vidro",!!PREF.semVidro);vidro();window.aplicarVidro=vidro;
  /* barra que encolhe e topo que some ao descer; voltam ao subir */
  let yAnt=scrollY,raf=0;
  const abertaJanela=()=>!!document.querySelector("#layer .scrim,#layer .story");
  const rola=()=>{raf=0;if(Date.now()-(window.PULA_SCROLL||0)<300){yAnt=Math.max(0,scrollY);return}const y=Math.max(0,scrollY),dy=y-yAnt;if(Math.abs(dy)<8&&y>4)return;yAnt=y;
    const desce=dy>0&&y>160&&!abertaJanela();
    nav.classList.toggle("mini",desce);topo.classList.toggle("esconde",desce&&VIEW==="feed");topo.classList.toggle("rolou",y>6)};
  addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(rola)},{passive:true});
  nav.addEventListener("pointerdown",()=>nav.classList.remove("mini"));
  /* troca de aba: some o "encolhido" e a nova tela entra suave */
  const goAnt=go;
  go=function(v,fromPop){const mudou=v!==VIEW;goAnt(v,fromPop);nav.classList.remove("mini");topo.classList.remove("esconde");
    if(mudou&&!matchMedia("(prefers-reduced-motion: reduce)").matches){const sec=document.getElementById("v-"+v);if(sec){try{sec.animate([{opacity:0},{opacity:1}],{duration:150,easing:"ease-out"})}catch(e){}}}};
  /* abrir com transição: o elemento tocado "cresce" até virar a tela nova */
  window.comTransicao=(origem,abre,alvo)=>{
    if(!document.startViewTransition||matchMedia("(prefers-reduced-motion: reduce)").matches||!origem){abre();return}
    try{origem.style.viewTransitionName="abre";
      const vt=document.startViewTransition(()=>{origem.style.viewTransitionName="";abre();const a=document.querySelector(alvo);if(a)a.style.viewTransitionName="abre"});
      vt.finished.catch(()=>{}).then(()=>{const a=document.querySelector(alvo);if(a)a.style.viewTransitionName=""})}
    catch(e){origem.style.viewTransitionName="";abre()}};
  /* puxar para atualizar (no app instalado não existe o do navegador) */
  const ind=document.createElement("div");ind.className="ptr";ind.setAttribute("aria-hidden","true");ind.innerHTML='<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4h-4"/></svg>';document.body.appendChild(ind);
  let p0=null,px=0,pd=0,trava=false;
  const solta=()=>{ind.style.opacity="";ind.style.transform=""};
  addEventListener("touchstart",e=>{p0=null;if(window.PTR_NOVO||trava||(VIEW!=="feed"&&VIEW!=="capa")||scrollY>2||abertaJanela()||e.touches.length>1||e.target.closest(".track,.secs,.tk-vp,input,textarea"))return;p0=e.touches[0].clientY;px=e.touches[0].clientX;pd=0},{passive:true});
  addEventListener("touchmove",e=>{if(p0==null)return;const t=e.touches[0],dy=t.clientY-p0,dx=Math.abs(t.clientX-px);if(scrollY>2||dx>dy){p0=null;solta();return}pd=Math.max(0,dy);
    const k=Math.min(1,pd/96);ind.style.opacity=String(k);ind.style.transform=`translate(-50%,${Math.min(30,pd*.45-60)}px) rotate(${Math.round(pd*2.4)}deg)`},{passive:true});
  addEventListener("touchend",()=>{if(p0==null)return;const ok=pd>96;p0=null;if(!ok){solta();return}
    trava=true;ind.classList.add("gira");vibrar(8);Promise.resolve(checarFeed(true)).catch(()=>{}).then(()=>setTimeout(()=>{ind.classList.remove("gira");solta();trava=false},350))});
})();

/* ================= Etapa 2: coberturas ================= */
function cobSP(iso,o){const d=new Date(iso);return isNaN(d)?"":d.toLocaleDateString("pt-BR",Object.assign({timeZone:"America/Sao_Paulo"},o||{day:"2-digit",month:"2-digit"}))};
function cobDH(iso){const d=cobSP(iso),h=hhmm(iso);return d?d+(h?" · "+h:""):""}
function cobStatus(p,grande){const st=p&&p.status;if(st==="ao_vivo")return `<span class="cst vivo"><i></i>Ao vivo</span>`;if(st==="encerrada")return `<span class="cst enc">${grande?"Cobertura encerrada":"Encerrada"}</span>`;return ""}
function cobEh(p){return p&&p.tipo!=="pontual"}
function cobTemPagina(p){if(!cobEh(p))return false;const t=(p.titulos||[]).length,ini=tms(p.inicio);return t>1||!!(p.etapa&&(p.etapa.passos||[]).length)||!!(p.faq||[]).length||p.status==="ao_vivo"||p.status==="encerrada"||(ini&&Date.now()-ini>20*3600e3)}
function cobEtapaAtual(p){const e=p.etapa;if(!e||!Array.isArray(e.passos)||!e.passos.length)return "";const i=Math.max(0,Math.min(e.passos.length-1,e.atual|0));return e.passos[i]}
function cobBarra(p){if(!cobTemPagina(p))return "";const pt=[];const ini=p.inicio&&dataSP(p.inicio)!==dataSP()?cobSP(p.inicio):"";if(ini)pt.push("desde "+ini);const et=cobEtapaAtual(p);if(et)pt.push("etapa: "+et);const nt=(p.titulos||[]).length;if(nt>1)pt.push(nt+" manchetes");if((p.faq||[]).length)pt.push("Entenda");
  return `<button type="button" class="cobbar" data-cobpag="${esc(p.id)}"><span class="cb-t"><b>Cobertura</b>${pt.length?" · "+esc(pt.join(" · ")):" completa"}</span><span class="chev" aria-hidden="true">›</span></button>`}
function cobPontualSlides(p){const n=p.neutro||{},l=(p.links||[])[0];
  return [`<div class="sl txs pt aberto"><span class="pt-k">${esc(p.tag||secNome(secOf(p)))}</span><h3>${esc(n.titulo)}</h3><p class="lead">${marcarTermos(n.texto||"")}</p>${p.por_que?`<p class="note"><b>Por que importa.</b> ${marcarTermos(p.por_que)}</p>`:""}${(p.correcoes||[]).map(c=>`<div class="upd fix"><b>Correção · ${esc(hhmm(c.hora))}</b>${esc(c.texto)}</div>`).join("")}${l?`<button type="button" class="link" data-a="links">Ler em ${esc(nomeFonte(l.fonte))}${(p.links||[]).length>1?` e mais ${p.links.length-1}`:""} ›</button>`:""}</div>`]}
function cobLinha(p){const it=[];const tt=p.titulos||[];
  tt.forEach((t,i)=>it.push({h:t.hora,c:"tt",k:i?"Manchete mudou":"Começo da cobertura",x:t.titulo,b:1}));
  if(!tt.length&&p.inicio)it.push({h:p.inicio,c:"tt",k:"Começo da cobertura",x:(p.neutro||{}).titulo,b:1});
  (p.atualizacoes||[]).forEach(u=>{if(!/^Correção: /.test(u.texto||""))it.push({h:u.hora,c:"",k:"Atualização",x:u.texto})});
  (p.correcoes||[]).forEach(u=>it.push({h:u.hora,c:"fx",k:"Correção",x:u.texto}));
  it.sort((a,b)=>tms(b.h)-tms(a.h));
  return it.length?`<ol class="pct">${it.map(i=>`<li class="${i.c}"><small>${esc(i.k)} · ${esc(cobDH(i.h))}</small>${i.b?`<b>${esc(i.x)}</b>`:`<span>${esc(i.x)}</span>`}</li>`).join("")}</ol>`:""}
function cobEtapas(p){const e=p.etapa;if(!e||!Array.isArray(e.passos)||e.passos.length<2)return "";const a=Math.max(0,Math.min(e.passos.length-1,e.atual|0));
  return `<ol class="etp" aria-label="Etapas">${e.passos.map((x,i)=>`<li class="${i<a?"ok":i===a?"ok at":""}"${i===a?' aria-current="step"':""}>${esc(x)}</li>`).join("")}</ol>`}
function abrirPagCob(pid){uso("pag_cobertura");const p=pautaById(pid);if(!p){abrirDormente(pid);return}
  const sec=secOf(p),n=p.neutro||{},tema=temaDe(p),seg=seguido(p),ult=ultimaAtualizacao(p)||p.hora,fs=p.fontes||[];
  const ex=(FEED.explicadores||{})[tema];
  sheet(p.tag||"Cobertura",`<div class="pc" data-pc="${esc(pid)}">${fotoDe(p)?capaArte(p,"art pc-foto",true):""}
    <div class="pc-k"><span class="secdot" style="background:${secCor(sec)}"></span>${esc(secNome(sec))}${p.subtema?" · "+esc(p.subtema):""}</div>
    <h2>${esc(n.titulo)}</h2>
    <div class="pc-m">${cobStatus(p,true)}<span>${p.inicio?"Acompanhando desde "+esc(cobSP(p.inicio))+" · ":""}atualizada ${esc(quando(ult))}</span></div>
    ${cobEtapas(p)}
    <div class="pc-a">${tema?`<button type="button" class="btn${seg?" ghost":""}" data-cobseg="${esc(pid)}" aria-pressed="${seg}">${seg?"Seguindo ✓":"Seguir cobertura"}</button>`:""}<button type="button" class="btn ghost" data-cobler="${esc(pid)}">Ler a notícia</button></div>
    <h4>Resumo</h4><p class="lead">${marcarTermos(n.texto||"")}</p>
    ${p.proximo?`<p class="note"><b>O que vem.</b> ${marcarTermos(p.proximo)}</p>`:""}${p.e_o_brasil?`<p class="note"><b>E o Brasil?</b> ${marcarTermos(p.e_o_brasil)}</p>`:""}
    ${(p.faq||[]).length?`<h4>Entenda</h4><div class="faq">${p.faq.filter(q=>q&&q.p).map(q=>`<details><summary>${esc(q.p)}</summary><p>${esc(q.r||"")}</p></details>`).join("")}</div>`:""}
    ${ex?`<button type="button" class="explain" data-explica="${esc(tema)}">Entenda: ${esc(tema)}</button>`:""}
    ${cobLinha(p)?`<h4>Linha do tempo</h4>${cobLinha(p)}`:""}
    ${fs.length?`<button type="button" class="cobx2 cobx2-d" data-cobfontes="${esc(pid)}"><span>Fontes</span><span class="chev" aria-hidden="true">›</span></button>`:""}
    ${seg?`<p class="hint" style="margin:0">Você segue “${esc(tema)}”: ela sobe no feed e aparece em “Do que você segue”.</p>`:`<p class="hint" style="margin:0">Ao seguir, esta cobertura sobe no seu feed e aparece em “Do que você segue”, no topo.</p>`}
  </div>`)}
function abrirDormente(id){const d=(FEED.dormentes||[]).find(x=>x.id===id);if(!d){toast("Esta cobertura não está mais disponível.");return}uso("dormente");
  const tk=norm(d.tema||d.tag||""),seg=!!(PREF.seguindo||{})[tk];const tt=Array.isArray(d.titulos)?d.titulos:[];
  sheet("Cobertura anterior",`<div class="pc"><div class="pc-k"><span class="secdot" style="background:${secCor(d.secao||"politica")}"></span>${esc(secNome(d.secao||"politica"))}${d.subtema?" · "+esc(d.subtema):""}</div>
    <h2>${esc(d.titulo)}</h2><div class="pc-m"><span class="cst enc">Fora da edição</span><span>${d.inicio?esc(cobSP(d.inicio))+" a ":""}${esc(cobSP(d.ultima))}</span></div>
    ${d.resumo?`<p class="lead">${esc(d.resumo)}</p>`:""}
    ${tt.length>1?`<h4>Manchetes</h4><ol class="pct">${tt.slice().reverse().map((t,i)=>`<li class="tt"><small>${esc(cobDH(t.hora))}</small><b>${esc(t.titulo)}</b></li>`).join("")}</ol>`:""}
    ${tk?`<div class="pc-a"><button type="button" class="btn${seg?" ghost":""}" data-dormseg="${esc(id)}">${seg?"Seguindo ✓":"Seguir: avisar se voltar"}</button></div>`:""}
    <p class="hint" style="margin:0">Esta cobertura saiu da edição. Se o assunto voltar, ela reaparece no feed com o histórico.</p></div>`)}
function cobSegue(tema,on){const k=norm(tema);const m=PREF.seguindo||(PREF.seguindo={});if(on)m[k]=tema;else delete m[k];if(on&&PREF.silenciados)delete PREF.silenciados[k];salvarPrefs();uso(on?"seguir_cob":"deixar_cob")}
function cobSegStrip(){if(FILTRO!=="tudo")return "";const ps=(FEED.pautas||[]).filter(p=>seguido(p)&&!silenciado(p)&&!(PREF.ocultas||[]).includes(secOf(p)));if(!ps.length)return "";
  ps.sort((a,b)=>tms(ultimaAtualizacao(b)||b.hora)-tms(ultimaAtualizacao(a)||a.hora));
  return `<div class="gut"><span class="segs-h">Do que você segue</span><div class="segs">${ps.slice(0,12).map(p=>{const nv=(NOVAS.has(p.id)&&!LIDAS.has(p.id))||ATUALIZADAS.has(p.id);return `<button type="button" class="segc" data-cobpag="${esc(p.id)}"><b>${esc((p.neutro||{}).titulo)}</b><span>${nv?"<i></i>":""}${p.status==="ao_vivo"?"Ao vivo · ":""}${esc(quando(ultimaAtualizacao(p)||p.hora))}</span></button>`}).join("")}</div></div>`}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  const cp=t.closest("[data-cobpag]");if(cp){e.stopPropagation();abrirPagCob(cp.dataset.cobpag);return}
  const cs=t.closest("[data-cobseg]");if(cs){const p=pautaById(cs.dataset.cobseg);if(!p)return;const on=!seguido(p);cobSegue(temaDe(p),on);toast(on?"Seguindo "+temaDe(p):"Deixou de seguir");abrirPagCob(p.id);{const y=scrollY;renderPosts(true);window.scrollTo(0,y)}return}
  const ds=t.closest("[data-dormseg]");if(ds){const d=(FEED.dormentes||[]).find(x=>x.id===ds.dataset.dormseg);if(!d)return;const tm=d.tema||d.tag;const on=!(PREF.seguindo||{})[norm(tm)];cobSegue(tm,on);toast(on?"Vamos destacar se voltar":"Deixou de seguir");abrirDormente(d.id);return}
  const cl=t.closest("[data-cobler]");if(cl){const id=cl.dataset.cobler;const mat=!!document.querySelector("#layer .mat");closeLayer();setTimeout(()=>{if(VIEW==="capa"&&pautaById(id)){if(!mat||!document.querySelector("#layer .mat"))abrirMateria(id)}else openSnap(id)},60);return}
  const cf=t.closest("[data-cobfontes]");if(cf){abrirCobertura(cf.dataset.cobfontes);return}
  const dm=t.closest("[data-dorm]");if(dm){abrirDormente(dm.dataset.dorm);return}
},true);

/* ================= Etapa 3: capa, busca e menu ================= */
var CAPA_FIXA=null,CAPA_T=0;
async function carregarCapaFixa(forcar){if(!forcar&&Date.now()-CAPA_T<120000)return;CAPA_T=Date.now();
  try{const c=sbCliente();if(!c||typeof c.rpc!=="function")return;const r=await c.rpc("capa_fixa");if(r&&!r.error){const v=r.data;const ant=JSON.stringify(CAPA_FIXA);CAPA_FIXA=v&&v.pid?v:null;if(JSON.stringify(CAPA_FIXA)!==ant&&VIEW==="capa")renderCapa()}}catch(e){}}
function capaEdicao(){const d=new Date(FEED?.atualizado_em);if(isNaN(d))return "";const p=d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"America/Sao_Paulo"}).split(":"),m=(+p[0])*60+(+p[1]);
  return (m>=390&&m<1050?"Edição da manhã":"Edição da noite")+" · "+d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short",timeZone:"America/Sao_Paulo"}).replace(/\./g,"")}
function capaEscolha(){const ps=(FEED?.pautas||[]).filter(p=>!(PREF.ocultas||[]).includes(secOf(p))&&!silenciado(p));const by=id=>ps.find(p=>p.id===id);
  const pr=p=>typeof p.prioridade==="number"?p.prioridade:0;const ord=[...ps].sort((a,b)=>pr(b)-pr(a)||String(b.hora).localeCompare(String(a.hora)));
  const fx=CAPA_FIXA&&CAPA_FIXA.pid&&tms(CAPA_FIXA.ate)>Date.now()?by(CAPA_FIXA.pid):null;const c=FEED?.capa||{};
  const man=fx||by(c.manchete)||ord[0];if(!man)return {ps,ord,man:null,dest:[]};
  let dest=(Array.isArray(c.destaques)?c.destaques:[]).map(by).filter(p=>p&&p!==man);
  if(dest.length<3){const n={};[man,...dest].forEach(p=>n[secOf(p)]=(n[secOf(p)]||0)+1);for(const p of ord){if(dest.length>=4)break;if(p===man||dest.includes(p)||(n[secOf(p)]||0)>=2)continue;dest.push(p);n[secOf(p)]=(n[secOf(p)]||0)+1}}
  return {ps,ord,man,dest:dest.slice(0,5),fixa:!!fx,linha:!fx&&c.manchete===man.id?c.linha_fina:""}}
function capaFrase(t,n){t=String(t||"").trim();if(t.length<=n)return t;const fr=t.replace(/([.!?])\s+/g,"$1\u0001").split("\u0001");let o="";for(const f of fr){if((o+" "+f).trim().length>n)break;o=(o+" "+f).trim()}return o||t.slice(0,n).replace(/\s+\S*$/,"")+"…"}
function capaChapeu(p){return p.subtema||p.tag||secNome(secOf(p))}
var FOTO_OK=/^https:\/\/([a-z0-9-]+\.)*(ebc\.com\.br|wikimedia\.org|staticflickr\.com|flickr\.com|unsplash\.com|pexels\.com|senado\.leg\.br|camara\.leg\.br|gov\.br|stf\.jus\.br|tse\.jus\.br)\//i;
function fotoSrc(u){const m=typeof u==="string"&&u.match(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/([a-z]+)\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+\.(?:jpe?g|png|webp))$/i);return m?`https://upload.wikimedia.org/wikipedia/${m[1]}/thumb/${m[2]}/${m[3]}/${m[4]}/960px-${m[4]}`:u}
function fotoErro(img,feed){const o=img.getAttribute("data-orig");if(o&&img.getAttribute("src")!==o){img.removeAttribute("data-orig");img.loading="eager";img.setAttribute("src",o);return}
  if(!img.dataset.arq){try{const alt=fotoReserva(img);if(alt){img.dataset.arq="1";img.loading="eager";img.alt=alt.alt||"";const c=img.parentNode&&img.parentNode.querySelector("[data-credfull]");if(c){c.dataset.credfull=alt.credito;c.dataset.credcurto=creditoCurto(alt.credito);c.textContent=creditoCurto(alt.credito);c.title=alt.credito}img.setAttribute("src",fotoSrc(alt.url));return}}catch(e){}}const c=img.parentNode;if(c){if(feed)c.classList.remove("fcv");else{c.classList.remove("foto");const cr=c.querySelector(".cred");if(cr)cr.remove()}}img.remove()}
function fotoImg(f,cls,feed,cedo){const src=fotoSrc(f.url);return `<img${cls?` class="${cls}"`:""} src="${escU(src)}"${src!==f.url?` data-orig="${escU(f.url)}"`:""} alt="${esc(f.alt||"")}" ${cedo?'loading="eager" fetchpriority="high"':'loading="lazy"'} decoding="async" referrerpolicy="no-referrer" onload="this.classList.add('ok')" onerror="fotoErro(this${feed?",1":""})">`}
function fotoDe(p){const f=p&&p.foto;if(f&&typeof f==="object"&&typeof f.url==="string"&&FOTO_OK.test(f.url))return f;return fotoArquivo(p)}
const APP_VERSAO="%%VERSAO%%";
var FOTOS_ARQ=(function(){try{return JSON.parse(localStorage.getItem("prumo-fotos-arq")||"null")}catch(e){return null}})(),FA_CACHE={};
function hashStr(s){let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)}
var PP_RE=new Map();function posPalavra(t,k){try{let re=PP_RE.get(k);if(!re){re=new RegExp(`(^|[^\\p{L}\\d])${k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=$|[^\\p{L}\\d])`,"u");PP_RE.set(k,re)}if(String(t).indexOf(k)<0&&String(t).toLowerCase().indexOf(String(k).toLowerCase())<0)return -1;const m=re.exec(t);return m?m.index+m[1].length:-1}catch(e){return -1}}
function fotoArquivo(p){const A=FOTOS_ARQ;if(!A||!p||!p.id)return null;const tit=String((p.neutro||{}).titulo||""),ck=p.id+"|"+tit+"|"+(A.gerado||"");if(ck in FA_CACHE)return FA_CACHE[ck];
  let best=null,pos=1e9,len=0;Object.values(A.pessoas||{}).forEach(x=>{(x&&Array.isArray(x.chaves)?x.chaves:[]).forEach(k=>{const i=posPalavra(tit,k);if(i>=0&&(i<pos||(i===pos&&k.length>len))){pos=i;len=k.length;best=x}})});
  let l=best&&Array.isArray(best.fotos)?best.fotos:null;const T=A.temas||{};
  if(!l||!l.length){const sec=secOf(p);l=T[sec+"/"+(p.subtema||"")]||T[(A.padrao||{})[sec]]||null}
  let r=null;if(l&&l.length){const f=l[hashStr(p.id)%l.length];if(f&&typeof f.url==="string"&&FOTO_OK.test(f.url))r={url:f.url,credito:f.credito||"Foto de arquivo: Wikimedia Commons",alt:f.alt||"Foto de arquivo",arquivo:1}}
  return FA_CACHE[ck]=r}
async function carregarFotosArq(){try{const r=await fetch("fotos-arquivo.json",{cache:"no-cache"});if(!r.ok)return;const d=await r.json();if(!d||typeof d!=="object"||!d.temas)return;
  const mud=!FOTOS_ARQ||FOTOS_ARQ.gerado!==d.gerado;FOTOS_ARQ=d;FA_CACHE={};try{localStorage.setItem("prumo-fotos-arq",JSON.stringify(d))}catch(e){}
  if(mud&&FEED&&!$("#layer").innerHTML&&scrollY<40){try{if(VIEW==="capa")renderCapa()}catch(e){}}}catch(e){}}
function capaArte(p,cls,cred){const f=fotoDe(p);if(!f)return `<span class="${cls} paper" data-sec="${esc(secOf(p))}">${svgOf(p.imagem)}</span>`;
  return `<span class="${cls} paper foto" data-sec="${esc(secOf(p))}"><span class="ill">${svgOf(p.imagem)}</span>${fotoImg(f,"",0,!!cred)}${cred&&f.credito?credHTML(f.credito,"cred"):""}</span>`}
function indTile(x){const seta={sobe:"▲",desce:"▼",estavel:"▬"};const em=x.variacao||x.dir?`<em class="${esc(x.dir||"estavel")}">${seta[x.dir]||""} ${esc(x.variacao||"")}</em>`:"";
  const sp=grSpark(x),miolo=`<span>${esc(x.nome)}</span><b>${esc(x.valor)}</b>${em}${sp}`;
  return x.id?`<button type="button" class="ind-t" data-indg="${esc(x.id)}" aria-label="${esc(x.nome)}: ${esc(x.valor)}. Ver gráfico">${miolo}</button>`:`<div class="ind-t">${miolo}</div>`}
function capaIndicadores(){const it=indItens().filter(x=>x&&x.nome&&x.valor);if(!it.length)return "";
  return `<div class="cp-ind" aria-label="Indicadores">${it.slice(0,4).map(indTile).join("")}</div>`}
var CP_AB=null;
function lente(){return PREF.lente==="direita"||PREF.lente==="esquerda"?PREF.lente:"neutro"}
function versao(p,L){L=L||lente();const n=p.neutro||{};const v=L!=="neutro"&&p[L]&&typeof p[L]==="object"&&p[L].titulo?p[L]:null;
  return {titulo:String((v||n).titulo||""),texto:String((v||n).texto||""),lado:v?L:"neutro",tem:!!v}}
function frases(t){return String(t||"").replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"“0-9])/g,"$1\u0001").split("\u0001").map(x=>x.trim()).filter(Boolean)}
function pontosDe(p,L){L=L||lente();const n=p.neutro||{};const v=L!=="neutro"&&p[L]&&typeof p[L]==="object"&&p[L].titulo?p[L]:null;const o=v||n;
  const pt=Array.isArray(o.pontos)?o.pontos.filter(x=>typeof x==="string"&&x.trim()):[];return pt.length?pt.slice(0,4):frases(o.texto).slice(0,3)}
var CP_MAIS=null;
function capaSub(p,L,extra){const v=versao(p,L);if(v.tem)return capaFrase(v.texto,170);return extra||(typeof p.subtitulo==="string"&&p.subtitulo)||p.por_que||capaFrase(p.neutro?.texto,170)}
function lenteHTML(mini){const L=lente();return `<div class="lente${mini?" mini":""}" role="tablist" aria-label="Leitura das notícias">${[["neutro","Neutra"],["direita","Direita"],["esquerda","Esquerda"]].map(([k,n])=>`<button type="button" role="tab" data-lente="${k}" aria-selected="${L===k}">${n}</button>`).join("")}</div>`}
function cpItem(p,o){const L=lente(),v=versao(p,L),ab=CP_AB===p.id,lc=lidaAtual(p)?" lida":"";
  const k=`<span class="cp-k" style="color:${secCor(secOf(p))}">${cpNovo(p)}${esc(capaChapeu(p))}${p.status==="ao_vivo"?" · ao vivo":p.status==="encerrada"?" · encerrada":""}${corRecente(p)?`<span class="cp-corr"> · corrigida</span>`:""}</span>`;
  const marca=v.tem?`<em class="cp-lado ${v.lado}" role="img" aria-label="Versão da ${v.lado}"></em>`:"";
  const sub=o.sub?`<span class="cp-sub">${esc(capaSub(p,L,o.linha))}</span>`:"";
  const arte=o.arte?capaArte(p,o.tam==="man"?"art":"cp-th",o.tam==="man"):"";
  return `<article class="cpi cpi-${o.tam}${lc}${ab?" aberto":""}" id="cpi-${esc(p.id)}"><button type="button" class="cpi-b" data-cpx="${esc(p.id)}" aria-expanded="${ab}">${o.tam==="man"?arte:""}<span class="tx">${o.tam==="rel"?"":k}<b class="cp-t">${marca}${esc(v.titulo)}</b>${sub}${o.meta||""}</span>${o.tam!=="man"?arte:""}</button>${ab?cpAberta(p):""}</article>`}
function cpAberta(p){const L=lente(),id=esc(p.id);const pts=pontosDe(p,L);
  return `<div class="cpx"><button type="button" class="cpx-30" data-cpmat="${id}" aria-label="Ler a matéria completa"><b>Em 30 segundos</b><ul>${pts.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><span class="cpx-ir">Ler a matéria completa <i aria-hidden="true">›</i></span></button></div>`}
function dia1min(ps){const rd=FEED.resumo_dia&&Array.isArray(FEED.resumo_dia.itens)?FEED.resumo_dia.itens.filter(x=>x&&typeof x.texto==="string"&&x.texto.trim()):[];
  const ok=x=>!x.pid||ps.some(p=>p.id===x.pid);let it=rd.filter(ok).slice(0,6);
  if(!it.length){const pr=p=>typeof p.prioridade==="number"?p.prioridade:0;it=[...ps].sort((a,b)=>pr(b)-pr(a)).slice(0,5).map(p=>({pid:p.id,texto:p.neutro?.titulo||""}))}
  if(!it.length)return "";
  const rt=resumoTitulo();return `<section class="cp-1m" aria-label="${esc(rt)}"><h3><span>${esc(rt)}</span><button type="button" class="cp-1m-sh" data-1mshare aria-label="Mandar o resumo como imagem">${ICON.send}<span>Mandar</span></button></h3><ol>${it.map(x=>`<li>${x.pid?`<button type="button" data-cp1m="${esc(x.pid)}">${esc(x.texto)}</button>`:`<span>${esc(x.texto)}</span>`}</li>`).join("")}</ol></section>`}
function lenteBotao(){let b=document.getElementById("lp");
  if(!b){b=document.createElement("button");b.type="button";b.id="lp";b.className="lp";b.setAttribute("aria-haspopup","menu");b.dataset.lpabre="1";document.body.appendChild(b)}
  const L=lente(),N={neutro:"Neutra",direita:"Direita",esquerda:"Esquerda"};
  b.className="lp "+L;b.hidden=VIEW!=="capa"||!FEED;b.setAttribute("aria-label","Leitura das notícias: "+N[L]);
  b.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M5 7h14M7 7l-3 6a3 3 0 0 0 6 0zM17 7l-3 6a3 3 0 0 0 6 0z"/></svg>${L==="neutro"?"":"<i></i>"}${N[L]}`;
  if(b.hidden)lenteMenu(false)}
function lenteMenu(abrir){let m=document.getElementById("lpm");if(!abrir){if(m)m.remove();return}
  if(m){m.remove();return}const L=lente();m=document.createElement("div");m.id="lpm";m.className="lpm";m.setAttribute("role","menu");
  m.innerHTML=`<b>Como ler as notícias</b>${[["neutro","Neutra","Só os fatos"],["direita","Direita","Como a direita conta"],["esquerda","Esquerda","Como a esquerda conta"]].map(([k,n,d])=>`<button type="button" role="menuitemradio" aria-checked="${L===k}" data-lente="${k}"><i class="${k}"></i><span><b>${n}</b><span>${d}</span></span>${L===k?'<em aria-hidden="true">✓</em>':""}</button>`).join("")}`;
  document.body.appendChild(m);uso("lente_menu")}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest("[data-lpabre]")){e.stopPropagation();lenteMenu(true);return}
  if(document.getElementById("lpm")&&!t.closest("#lpm"))lenteMenu(false)},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape")lenteMenu(false)});
var MAT_PID=null;
function abrirMateria(pid,manter){const p=pautaById(pid);if(!p)return;const L=lente(),v=versao(p,L),n=p.neutro||{},id=esc(p.id);
  const Ly=$("#layer");const vazio=!Ly.innerHTML;MAT_PID=pid;if(!manter){uso("materia");evento("materia",pid,secOf(p));try{marcarLida(pid)}catch(e){}}
  const u=ultimaAtualizacao(p)||p.hora,sv=!!(S.salvos||{})[p.id],f=fotoDe(p);
  let h=`<div class="mat" role="dialog" aria-modal="true" aria-label="${esc(v.titulo)}"><div class="mat-top"><button type="button" class="mat-v" data-close aria-label="Voltar para a Capa">‹ Capa</button><span class="mat-k" style="color:${secCor(secOf(p))}">${esc(capaChapeu(p))}</span><button type="button" class="mat-aa" data-mataa aria-label="Tamanho da letra" aria-expanded="false">Aa</button><button type="button" class="mat-sh" data-matshare="${id}" aria-label="Compartilhar">${ICON.send}</button><button type="button" class="mat-g" data-matsalvar="${id}" aria-pressed="${sv}">${sv?"Guardada":"Guardar"}</button></div><article class="mat-c">`;
  h+=`<div class="mat-arte">${capaArte(p,"art",true)}</div>`;
  h+=`<div class="gut mat-tx"><h1>${v.tem?`<em class="cp-lado ${v.lado}" role="img" aria-label="Versão da ${v.lado}"></em>`:""}${esc(v.titulo)}</h1>`;
  const sub=capaSub(p,L,"");if(sub&&sub!==v.titulo&&!(v.tem&&String(v.texto||"").indexOf(String(sub).replace(/…$/,""))===0))h+=`<p class="mat-sub">${esc(sub)}</p>`;
  h+=`<p class="mat-meta">${cobStatus(p)}${u?`<span>${esc(atualizadoTxt(u))}</span>`:""}<span>${minLeitura(p,v)} min de leitura</span>${matCorSelo(p)}</p>`;
  if(L!=="neutro"&&!v.tem)h+=`<p class="cpx-ver">Sem versão da ${L}: os veículos contam do mesmo jeito.</p>`;
  else if(v.tem)h+=`<p class="cpx-ver"><i class="${v.lado}"></i>Versão da ${v.lado} · <button type="button" data-lente="neutro">ver a neutra</button></p>`;
  h+=matDesfecho(p);
  h+=`<div class="cpx-30 mat-30"><b>Em 30 segundos</b><ul>${pontosDe(p,L).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`;
  h+=frases(v.texto).length>3?`<div class="mat-p">${v.texto.split(/\n+/).map(x=>`<p>${marcarTermos(x)}</p>`).join("")}</div>`:`<div class="mat-p"><p>${marcarTermos(v.texto)}</p></div>`;
  h+=matCorBloco(p);h+=matVisuais(p);
  if(v.tem&&n.texto)h+=`<div class="cpx-neutro"><b>O fato, sem enquadramento</b><p>${esc(n.texto)}</p></div>`;
  if(p.o_que_muda&&(p.direita||p.esquerda))h+=`<p class="cpx-c"><b>Como cada lado conta</b>${esc(p.o_que_muda)}</p>`;
  const es=Array.isArray(p.essencial)?p.essencial.filter(x=>typeof x==="string"&&x):[];
  if(es.length)h+=`<div class="cpx-bl"><b>O essencial</b><ul>${es.slice(0,5).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`;
  if(p.contexto)h+=`<p class="cpx-c"><b>Contexto</b>${marcarTermos(p.contexto)}</p>`;
  if(p.proximo)h+=`<p class="cpx-c"><b>O que vem agora</b>${marcarTermos(p.proximo)}</p>`;
  h+=matTempo(p);
  const ups=(Array.isArray(p.atualizacoes)?p.atualizacoes:[]).filter(x=>x&&x.texto).slice().sort((a,b)=>tms(b.hora)-tms(a.hora));
  if(ups.length)h+=`<div class="cpx-bl"><b>Atualizações</b><ul class="cpx-up">${ups.map(x=>`<li><time>${esc(horaDia(x.hora))}</time>${esc(x.texto)}</li>`).join("")}</ul></div>`;
  const nx=matProx(p.id);h+=matRel(p,nx);
  h+=`<div class="mat-pe">${nx?`<button type="button" class="mat-prox" data-matprox="${esc(nx.id)}"><span>Próxima</span><b>${esc(versao(nx,L).titulo)}</b><i aria-hidden="true">›</i></button><small class="mat-dica">ou deslize para o lado</small>`:""}${typeof cobTemPagina==="function"&&cobTemPagina(p)?`<button type="button" class="btn ghost" data-cobpag="${id}">Acompanhar esta cobertura</button>`:""}<div class="mat-rod"><button type="button" class="cpx-fontes" data-cpfontes="${id}">Fontes</button>${f&&f.credito?`<span class="cpx-fontes">${esc(creditoCurto(f.credito))}</span>`:""}<button type="button" class="cpx-fontes" data-capair="${id}">Ver no feed</button></div></div></div></article></div>`;
  Ly.innerHTML=h;const m=Ly.querySelector(".mat");if(!manter&&m)m.scrollTop=0;
  if(vazio&&pushH())HST++}
(function(){const ant=closeLayer;closeLayer=function(fp){const eraMat=!!document.querySelector("#layer .mat")&&!(($("#layer2")||{}).innerHTML);ant.apply(this,arguments);
  if(eraMat&&MAT_PID){const pid=MAT_PID;MAT_PID=null;if(VIEW==="capa"){const el0=document.getElementById("cpi-"+pid);const r0=el0?el0.getBoundingClientRect().top:null;const ab0=CP_AB;CP_AB=null;if(!cpAlternar(ab0,null))renderCapa();
    const el=document.getElementById("cpi-"+pid);if(el&&r0!=null)window.scrollTo(0,scrollY+el.getBoundingClientRect().top-r0)}}}})();
function renderCapa(){const v=$("#v-capa");if(!v)return;carregarCapaFixa();
  if(!FEED){v.innerHTML=`<div class="gut cp"><div class="cp-top"><span class="word">prumo<small>NEWS</small></span></div><div class="cp-sk"><i style="height:220px"></i><i style="height:22px;width:80%"></i><i style="height:16px;width:60%"></i></div></div>`;return}
  const {ps,ord,man,dest,fixa,linha}=capaEscolha();const L=lente();
  const usados=new Set([man,...dest].filter(Boolean).map(p=>p.id));
  const vivo=ps.filter(p=>p.status==="ao_vivo");
  let h=`<div class="gut cp"><header class="cp-top"><span class="word">prumo<small>NEWS</small></span><span class="cp-ed">${esc(capaEdicao())}${FEED.contagem?" · "+esc(FEED.contagem):""}</span></header>`;
  h+=agoraHTML();h+=capaNovBar();h+=urgHTML();if(vivo.length)h+=`<div class="cp-vivo"><b><i></i>Ao vivo</b>${vivo.map(p=>`<button type="button" data-cobpag="${esc(p.id)}">${esc(capaChapeu(p))}: ${esc(versao(p,L).titulo)} ›</button>`).join("")}</div>`;
  if(man){const u=ultimaAtualizacao(man)||man.hora;
    const meta=`<span class="cp-meta">${cobStatus(man)}${u?`<span>${esc(atualizadoTxt(u))}</span>`:""}${fixa?`<span class="cp-fixa">Fixada</span>`:""}</span>`;
    h+=cpItem(man,{tam:"man",sub:true,arte:true,linha:L==="neutro"?linha:"",meta});
    const tm=temaDe(man);const rel=ps.filter(p=>p!==man&&!usados.has(p.id)&&((tm&&temaDe(p)===tm)||(man.subtema&&p.subtema===man.subtema&&secOf(p)===secOf(man)))).slice(0,2);
    if(rel.length){rel.forEach(p=>usados.add(p.id));h+=`<div class="cp-rel"><span>Relacionadas</span>${rel.map(p=>cpItem(p,{tam:"rel"})).join("")}</div>`}}
  if(dest.length)h+=`<div class="cp-dest">${dest.map((p,i)=>cpItem(p,{tam:i<2?"d1":"d2",sub:true,arte:i>=2})).join("")}</div>`;
  h+=dia1min(ps);h+=instHTML();
  h+=capaIndicadores();
  const NSEC={politica:5,economia:5};
  SECS().forEach(s=>{const l=ord.filter(p=>secOf(p)===s.id&&!usados.has(p.id)).slice(0,NSEC[s.id]||3);if(!l.length)return;
    h+=`<div class="cp-h"><h3><i style="background:${secCor(s.id)}"></i>${esc(s.nome)}</h3><button type="button" data-capasec="${esc(s.id)}">Ver a seção ›</button></div><div class="cp-sl">${l.map((p,i)=>cpItem(p,{tam:i?"li":"um",sub:!i,arte:!i})).join("")}</div>`});
  const acomp=ps.filter(p=>typeof cobTemPagina==="function"&&cobTemPagina(p)).sort((a,b)=>tms(ultimaAtualizacao(b)||b.hora)-tms(ultimaAtualizacao(a)||a.hora)).slice(0,8);
  if(acomp.length)h+=`<div class="cp-h"><h3>Para acompanhar</h3></div><ul class="cp-l">${acomp.map(p=>{const et=cobEtapaAtual(p);return `<li><button type="button" data-cobpag="${esc(p.id)}"><span class="s">${esc(quando(ultimaAtualizacao(p)||p.hora))}</span><b>${esc(temaDe(p)||versao(p,L).titulo)}${et?" · "+esc(et):p.status==="ao_vivo"?" · ao vivo":p.status==="encerrada"?" · encerrada":""}</b></button></li>`}).join("")}</ul>`;
  const ult=tickerItens(8);
  if(ult.length)h+=`<div class="cp-h"><h3>Últimas</h3></div><ul class="cp-l">${ult.map(i=>{const p=pautaById(i.pid);return `<li><button type="button" data-capair="${esc(i.pid)}"><span class="s">${i.hora?esc(horaDia(i.hora))+" · ":""}${esc(p?temaDe(p)||secNome(i.sec):secNome(i.sec))}</span><b>${esc(i.txt)}</b></button></li>`}).join("")}</ul>`;
  const hj=hojeSP(),am=somaDias(hj,1),ag=(FEED.agenda||[]).map(a=>({...a,_d:agData(a,hj)})).filter(a=>a._d===hj||a._d===am||(fimDeSemana()&&a._d>am&&a._d<=somaDias(hj,7))).sort((x,y)=>x._d.localeCompare(y._d)||agMin(x)-agMin(y)).slice(0,fimDeSemana()?8:99);
  if(ag.length)h+=`<div class="cp-h"><h3>${fimDeSemana()?"Agenda da semana":"Agenda"}</h3></div><ul class="cp-l">${ag.map(a=>{const pid=agPid(a);return `<li><button type="button" ${pid?`data-capair="${esc(pid)}"`:"disabled"}><span class="s">${agDiaTxt(a._d,hj,am)}${agHoraTxt(a)?" · "+esc(agHoraTxt(a)):""}</span><b>${esc(a.texto)}</b></button></li>`}).join("")}</ul>`;
  const enq=ps.filter(p=>p.enquete&&(p.enquete.opcoes||[]).length);const pend=S.uid&&S.membro?enq.filter(p=>meuVoto(p.id)==null).length:0;const qz=(FEED.quiz||[]).length&&!(S.quiz||{})[S.uid||"eu"];
  if(qz||pend)h+=`<button type="button" class="cp-int" data-vgo="play"><span><b>${qz?"Quiz do dia":"Enquetes"}</b><span>${[qz?`${FEED.quiz.length} perguntas sobre esta edição`:"",pend?`${pend} ${pend===1?"enquete espera":"enquetes esperam"} o seu voto`:""].filter(Boolean).join(" · ")}</span></span><span class="chev" aria-hidden="true">›</span></button>`;
  const falta=ps.filter(p=>!lidaAtual(p)).length;
  h+=`<div class="cp-fim">${falta?`<b>Faltam ${falta} ${falta===1?"notícia":"notícias"} para ficar em dia</b><button type="button" class="btn ghost" data-vgo="feed" style="margin-top:6px">Abrir o feed</button>`:`<b>Você está em dia</b><span>Leu tudo desta edição. A próxima atualização aparece aqui.</span>`}<span>Atualizado ${esc(diaHora(FEED.atualizado_em))}.</span></div></div>`;
  v.innerHTML=h;lenteBotao()}
/* aba Buscar */
function buscaRes(q){const hit=rc116Hit(q);const res=[];
  (FEED?.pautas||[]).map(p=>[p,hit(p.neutro?.titulo)?2:hit([p.tag,p.tema,p.subtema].join(" "))?1:0]).sort((a,b)=>b[1]-a[1]).forEach(([p])=>{if(hit([p.neutro?.titulo,p.neutro?.texto,p.tag,p.tema,p.subtema,p.contexto,p.por_que].join(" ")))res.push(`<li><button type="button" data-busca="${esc(p.id)}"><b>${esc(p.neutro?.titulo)}</b><span>${esc(secNome(secOf(p)))}${p.subtema?" · "+esc(p.subtema):""} · esta edição</span></button></li>`)});
  (FEED?.breves||[]).forEach(b=>{if(hit(b.titulo))res.push(`<li><a href="${escU(b.url)}" target="_blank" rel="noopener" style="display:flex;flex-direction:column;gap:2px;padding:10px 0;border-bottom:1px solid var(--line);text-decoration:none"><b>${esc(b.titulo)}</b><span>${esc(secNome(b.secao||"politica"))} · ${esc(nomeFonte(b.fonte))}</span></a></li>`)});
  (Array.isArray(FEED?.dormentes)?FEED.dormentes:[]).forEach(d=>{if(d&&d.id&&!pautaById(d.id)&&hit([d.titulo,d.resumo,d.tema,d.tag,d.subtema].join(" ")))res.push(`<li class="dorm"><button type="button" data-dorm="${esc(d.id)}"><b>${esc(d.titulo)}</b><span>${esc(secNome(d.secao||"politica"))} · cobertura anterior · ${esc(cobSP(d.ultima))}</span></button></li>`)});
  Object.entries(S.salvos||{}).forEach(([pid,x])=>{if(!pautaById(pid)&&x?.snap&&hit([x.snap.titulo,x.snap.texto].join(" ")))res.push(`<li><button type="button" data-busca="${esc(pid)}"><b>${esc(x.snap.titulo)}</b><span>Guardada</span></button></li>`)});
  return res.length?`<ul class="sres">${res.slice(0,40).join("")}</ul>`:`<p class="hint">Nada encontrado para “${esc(q)}”.</p>`}
function buscaTemas(){if(!FEED)return `<p class="hint">As notícias ainda não carregaram.</p>`;let h="";const ps=visiveis();
  const grupos=SECS().map(s=>{const l=ps.filter(p=>secOf(p)===s.id);if(!l.length)return "";const subs={};l.forEach(p=>{const k=p.subtema||"Outros";(subs[k]=subs[k]||[]).push(p)});
    const ordem=((FEED.taxonomia||{})[s.id]||[]);const ks=Object.keys(subs).sort((a,b)=>{const ia=ordem.indexOf(a),ib=ordem.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)});
    return `<div class="bv-g"><b><i style="background:${secCor(s.id)}"></i>${esc(s.nome)}</b>${ks.map(k=>`<span class="bv-sub">${esc(k)}</span>${subs[k].map(p=>`<button type="button" class="bv-it" ${cobTemPagina(p)?`data-cobpag`:`data-busca`}="${esc(p.id)}"><span>${esc(temaDe(p)&&temaDe(p)!==p.subtema?temaDe(p)+": ":"")}${esc(p.neutro?.titulo)}</span><span class="chev" aria-hidden="true">›</span></button>`).join("")}`).join("")}</div>`}).join("");
  h+=`<div class="bv-sec"><h3>Assuntos desta edição</h3>${grupos}</div>`;
  const ex=Object.keys(FEED.explicadores||{});if(ex.length)h+=`<div class="bv-sec"><h3>Entenda</h3><div class="bv-chips">${ex.map(t=>`<button type="button" class="chipb" data-explica="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>`;
  const dr=(Array.isArray(FEED.dormentes)?FEED.dormentes:[]).slice(0,10);if(dr.length)h+=`<div class="bv-sec"><h3>Coberturas anteriores</h3>${dr.map(d=>`<button type="button" class="bv-it" data-dorm="${esc(d.id)}"><span>${esc(d.titulo)}</span><span class="chev" aria-hidden="true">›</span></button>`).join("")}</div>`;
  return h}
function renderBuscaView(){const v=$("#v-busca");if(!v)return;const q0=$("#bvq")?.value||"";
  v.innerHTML=`<div class="gut"><form class="bv-f" onsubmit="return false"><input class="field" id="bvq" type="search" autocomplete="off" enterkeyhint="search" placeholder="Buscar notícia, nome ou assunto" aria-label="Buscar" value="${esc(q0)}"></form><div id="bvres"></div></div>`;
  const inp=$("#bvq"),run=()=>{const q=inp.value.trim();$("#bvres").innerHTML=q.length<2?buscaTemas():buscaRes(q)};inp.addEventListener("input",run);run()}
/* menu, aba inicial e eventos */
(function(){const goAnt=go;
  go=function(v,fromPop){goAnt(v,fromPop);if(typeof lenteBotao==="function")lenteBotao();if(v==="capa"){capaSeMudou();uso("capa")}if(v==="busca"){renderBuscaView();uso("aba_busca");if(!fromPop){const q=$("#bvq");if(q&&!q.value)try{q.focus({preventScroll:true})}catch(e){}}}if(!fromPop&&(v==="feed"||v==="capa"))try{localStorage.setItem("prumo-aba",v);localStorage.setItem("prumo-aba-dia",hojeSP())}catch(e){}};
  let teste=false;try{teste=localStorage.getItem("prumo-teste-capa")==="1"}catch(e){}
  if(!navigator.webdriver||teste){RAIZ="capa";go("capa",true)}
  setInterval(()=>{if(!document.hidden&&VIEW==="capa")carregarCapaFixa()},300000);
})();
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  const cx=t.closest("[data-cpx]");if(cx){e.stopPropagation();const pid=cx.dataset.cpx;const ab0=CP_AB,abrir=CP_AB!==pid;CP_AB=abrir?pid:null;CP_MAIS=null;const elT=document.getElementById("cpi-"+pid),topo0=elT?elT.getBoundingClientRect().top:null;
    if(abrir){try{marcarLida(pid)}catch(_){}uso("capa_abre")}if(!cpAlternar(ab0,CP_AB)){const y=scrollY;renderCapa();window.scrollTo(0,y)}
    {const el=document.getElementById("cpi-"+pid);if(el&&topo0!=null){const d=el.getBoundingClientRect().top-topo0;if(Math.abs(d)>1){window.PULA_SCROLL=Date.now();window.scrollTo(0,scrollY+d)}}
     if(abrir&&el)requestAnimationFrame(()=>mostrarInteiro(el))}return}
  const igr=t.closest("[data-indg]");if(igr){e.stopPropagation();abrirGrafico(igr.dataset.indg);return}
  const gpr=t.closest("[data-grper]");if(gpr){e.stopPropagation();abrirGrafico(GR.id,+gpr.dataset.grper);return}
  const msh=t.closest("[data-matshare]");if(msh){e.stopPropagation();compartilhar(msh.dataset.matshare);return}
  const agb=t.closest("[data-agora]");if(agb){e.stopPropagation();abrirAgora();return}
  const agp=t.closest("[data-agpid]");if(agp){e.stopPropagation();const pid=agp.dataset.agpid;closeLayer();setTimeout(()=>abrirMateria(pid),60);return}
  const maa=t.closest("[data-mataa]");if(maa){e.stopPropagation();matLetra();return}
  const mfz=t.closest("[data-matfz]");if(mfz){e.stopPropagation();let i=FZ.indexOf(PREF.fonte||1);if(i<0)i=1;i=Math.max(0,Math.min(FZ.length-1,i+(+mfz.dataset.matfz)));PREF.fonte=FZ[i];aplicarFonte();salvarPrefs();uso("letra_materia");matLetraAtualiza();return}
  const mzo=t.closest("#layer .mat-arte .foto");if(mzo&&!t.closest(".cred")){e.stopPropagation();matZoom(mzo);return}
  const iok=t.closest("[data-instok]");if(iok){e.stopPropagation();instalar();return}
  const inao=t.closest("[data-instnao]");if(inao){e.stopPropagation();lsSet("prumo-inst",{ate:Date.now()+14*864e5});const c=$("#v-capa .cp-inst");if(c)c.remove();uso("instalar_nao");return}
  const mri=t.closest("[data-matir]");if(mri){e.stopPropagation();matIr(mri.dataset.matir);return}
  const agi=t.closest(".cp-agora .ag-i");if(agi){e.stopPropagation();const ap=agi.dataset.agstrip;if(ap&&pautaById(ap))abrirMateria(ap);else abrirAgora();return}
  if(t.closest(".cp-agora")){e.stopPropagation();abrirAgora();return}
  const mdi=t.closest("[data-mudouir]");if(mdi){e.stopPropagation();const pid=mdi.dataset.mudouir;closeLayer();setTimeout(()=>{if(VIEW!=="capa"&&VIEW!=="feed")go("capa");abrirMateria(pid)},60);return}
  const mpx=t.closest("[data-matprox]");if(mpx){e.stopPropagation();matIr(mpx.dataset.matprox);return}
  const cnv=t.closest("[data-cpnov]");if(cnv){e.stopPropagation();abrirNovCapa();return}
  const cni=t.closest("[data-cpnovir]");if(cni){e.stopPropagation();const pid=cni.dataset.cpnovir;closeLayer();setTimeout(()=>abrirMateria(pid),60);return}
  const cmt=t.closest("[data-cpmat]");if(cmt){e.stopPropagation();abrirMateria(cmt.dataset.cpmat);return}
  const msv=t.closest("[data-matsalvar]");if(msv){e.stopPropagation();const pid=msv.dataset.matsalvar;toggleSave(pid);setTimeout(()=>{if(document.querySelector("#layer .mat"))abrirMateria(pid,true)},80);return}
  const cm=t.closest("[data-cpmais]");if(cm){e.stopPropagation();const pid=cm.dataset.cpmais;CP_MAIS=CP_MAIS===pid?null:pid;const y=scrollY;renderCapa();window.scrollTo(0,y);if(CP_MAIS)uso("capa_mais");return}
  const c1=t.closest("[data-cp1m]");if(c1){e.stopPropagation();const pid=c1.dataset.cp1m;if(pautaById(pid)){uso("capa_1min");abrirMateria(pid);return}CP_AB=pid;CP_MAIS=null;try{marcarLida(pid)}catch(_){}uso("capa_1min");renderCapa();
    const el=document.getElementById("cpi-"+pid);if(el){const f=()=>window.scrollTo(0,scrollY+el.getBoundingClientRect().top-70);f();requestAnimationFrame(f)}else openSnap(pid);return}
  const le=t.closest("[data-lente]");if(le){e.stopPropagation();lenteMenu(false);const k=le.dataset.lente;if(lente()!==k){PREF.lente=k;salvarPrefs();uso("lente_"+k)}
    if(document.querySelector("#layer .mat")&&MAT_PID){const m=document.querySelector("#layer .mat"),y=m.scrollTop;abrirMateria(MAT_PID,true);const m2=document.querySelector("#layer .mat");if(m2)m2.scrollTop=y}
    if(VIEW==="capa"){const an=ancoraCapa(),y=scrollY;renderCapa();window.PULA_SCROLL=Date.now();
      const el2=an&&document.getElementById(an.id);if(el2)window.scrollTo(0,scrollY+el2.getBoundingClientRect().top-an.top);else window.scrollTo(0,y)}return}
  const cf=t.closest("[data-cpfontes]");if(cf){e.stopPropagation();abrirCobertura(cf.dataset.cpfontes);return}
  const cs2=t.closest("[data-cpsalvar]");if(cs2){e.stopPropagation();toggleSave(cs2.dataset.cpsalvar);setTimeout(()=>{if(VIEW==="capa"){const y=scrollY;renderCapa();window.scrollTo(0,y)}},60);return}
  const cil=t.closest("#v-capa .cp-l [data-capair]");if(cil&&!document.querySelector("#layer .mat")){e.stopPropagation();const pid=cil.dataset.capair;if(pautaById(pid)){abrirMateria(pid);return}openSnap(pid);return}
  const ci=t.closest("[data-capair]");if(ci){e.stopPropagation();const pid=ci.dataset.capair;if(document.querySelector("#layer .mat")){MAT_PID=null;closeLayer();setTimeout(()=>openSnap(pid),60)}else openSnap(pid);return}
  const cs=t.closest("[data-capasec]");if(cs){e.stopPropagation();const sec=cs.dataset.capasec;const f0=FILTRO,adiado=typeof FEED_ADIADO!=="undefined"&&FEED_ADIADO;FILTRO=sec;ssSet("radar-filtro",FILTRO);const v0=VST;go("feed");if(f0==="tudo"){if(VST>v0)window.FILTRO_CAPA=1;else if(pushH())FST++}if(!adiado){renderSecs();renderPosts()}window.scrollTo(0,0);return}
  const bb=t.closest("#b-busca");if(bb){e.stopPropagation();go("busca");setTimeout(()=>$("#bvq")?.focus(),60);return}
  const fx=t.closest("[data-fixar]");if(fx){e.stopPropagation();const h=+($("#admhoras")?.value||12);fx.disabled=true;S.db.rpc("admin_fixar_manchete",{p_pid:fx.dataset.fixar,p_horas:h}).then(()=>{toast("Manchete fixada por "+h+" h");return carregarCapaFixa(true)}).catch(err=>toast("Não deu agora: "+(err&&err.message||"erro"))).then(()=>{adminDesenhar();if(VIEW==="capa")renderCapa()});return}
  const dfx=t.closest("[data-desfixar]");if(dfx){e.stopPropagation();S.db.rpc("admin_fixar_manchete",{p_pid:"",p_horas:0}).then(()=>{toast("A rodada volta a escolher a manchete");return carregarCapaFixa(true)}).catch(err=>toast("Não deu agora: "+(err&&err.message||"erro"))).then(()=>{adminDesenhar();if(VIEW==="capa")renderCapa()});return}
},true);
function capaAdminHTML(){if(!FEED)return `<p class="hint">As notícias ainda não carregaram.</p>`;const {ord,man,fixa}=capaEscolha();const fx=CAPA_FIXA&&tms(CAPA_FIXA.ate)>Date.now()?CAPA_FIXA:null;
  return `<div class="adm-capa" style="display:flex;flex-direction:column;gap:10px">${fx?`<div class="pin"><b>Manchete fixada</b> até ${esc(cobDH(fx.ate))}${pautaById(fx.pid)?`: ${esc(pautaById(fx.pid).neutro?.titulo)}`:" (essa notícia saiu da edição; a capa usa a escolha da rodada)"}<br><button type="button" class="btn ghost amg-b" data-desfixar style="margin-top:8px">Desfixar</button></div>`:`<p class="hint" style="margin:0">Agora a rodada escolhe a manchete${man?`: <b>${esc(man.neutro?.titulo)}</b>`:""}.</p>`}
    <label class="hint" style="display:flex;align-items:center;gap:8px">Fixar por <select id="admhoras" class="field" style="width:auto;flex:none"><option value="3">3 horas</option><option value="6">6 horas</option><option value="12" selected>12 horas</option><option value="24">24 horas</option></select></label>
    <ul class="adml">${ord.slice(0,15).map(p=>`<li><div><b>${esc(p.neutro?.titulo)}</b><span>${esc(secNome(secOf(p)))} · prioridade ${esc(p.prioridade??"-")}${fx&&fx.pid===p.id?" · fixada":man===p&&!fixa?" · manchete agora":""}</span></div><div class="admb"><button type="button" class="btn ghost amg-b" data-fixar="${esc(p.id)}">Fixar</button></div></li>`).join("")}</ul>
    <p class="hint" style="margin:0">A manchete fixada vale para todos e some sozinha no prazo, ou quando a notícia sai da edição.</p></div>`}

/* ================= Etapa 4: páginas das seções ================= */
var SECF={sec:"",sub:"",uf:""};
function UFSM(){return window._UFS||(window._UFS={AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",CE:"Ceará",DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Pará",PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondônia",RR:"Roraima",SC:"Santa Catarina",SP:"São Paulo",SE:"Sergipe",TO:"Tocantins"})}
function ufsDe(p){return (Array.isArray(p.uf)?p.uf:p.uf?[p.uf]:[]).filter(u=>UFSM()[u])}
function secFiltroOk(p){if(!SECF||SECF.sec!==FILTRO)return true;if(SECF.sub&&(p.subtema||"Outros")!==SECF.sub)return false;if(SECF.uf&&!ufsDe(p).includes(SECF.uf))return false;return true}
function dataCurta(d){try{return new Date(d+"T12:00:00Z").toLocaleDateString("pt-BR",{day:"numeric",month:"short",timeZone:"UTC"}).replace(".","")}catch(e){return d}}
function calendarioDe(sec,n){const hj=hojeSP();return (Array.isArray(FEED?.calendario)?FEED.calendario:[]).filter(c=>c&&c.secao===sec&&c.data&&((c.ate||c.data)>=hj)).sort((a,b)=>String(a.data).localeCompare(String(b.data))).slice(0,n||8)}
function calPeriodo(c){const a=dataCurta(c.data);if(!c.ate||c.ate===c.data)return a;const b=dataCurta(c.ate),ma=a.split(" de "),mb=b.split(" de ");return ma.length===2&&mb.length===2&&ma[1]===mb[1]?ma[0]+" a "+b:a+" a "+b}
function calHTML(l){return `<ul class="sh4-cal">${l.map(c=>`<li><time>${esc(calPeriodo(c))}</time><span>${esc(c.texto)}${c.tipo?`<em>${esc(c.tipo)}</em>`:""}</span></li>`).join("")}</ul>`}
function sparkSVG(ser){const v=(Array.isArray(ser)?ser:[]).map(Number).filter(n=>!isNaN(n));if(v.length<3)return "";const mn=Math.min(...v),mx=Math.max(...v),r=(mx-mn)||1;const pts=v.map((x,i)=>`${(i*100/(v.length-1)).toFixed(1)},${(26-(x-mn)*22/r).toFixed(1)}`).join(" ");return `<svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`}
function indPainel(){const it=indItens().filter(x=>x&&x.nome&&x.valor);if(!it.length)return "";
  return `<div class="sh4-b"><h5>Indicadores <small>toque para ver o gráfico</small></h5><div class="sh4-ind">${it.map(indTile).join("")}</div></div>`}
function secHub(sec){if(!FEED||FILTRO[0]==="_")return "";if(!SECF||SECF.sec!==sec)SECF={sec,sub:"",uf:""};
  const todas=pautasDa(sec);if(!todas.length)return "";const ordem=((FEED.taxonomia||{})[sec]||[]);
  const cont={};todas.forEach(p=>{const k=p.subtema||"Outros";cont[k]=(cont[k]||0)+1});const ks=Object.keys(cont).sort((a,b)=>{const ia=ordem.indexOf(a),ib=ordem.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)});
  let h=`<div class="sh4 gut">`;
  if(ks.length>1||SECF.sub)h+=`<div class="sh4-chips" role="group" aria-label="Subtemas"><button type="button" data-secsub="" aria-pressed="${!SECF.sub}">Tudo<em>${todas.length}</em></button>${ks.map(k=>`<button type="button" data-secsub="${esc(k)}" aria-pressed="${SECF.sub===k}">${esc(k)}<em>${cont[k]}</em></button>`).join("")}</div>`;
  if(sec==="brasil"){const uc={};todas.forEach(p=>ufsDe(p).forEach(u=>uc[u]=(uc[u]||0)+1));const us=Object.keys(uc).sort((a,b)=>uc[b]-uc[a]||a.localeCompare(b));
    if(us.length)h+=`<div class="sh4-chips" role="group" aria-label="Estados"><button type="button" data-secuf="" aria-pressed="${!SECF.uf}">Todo o Brasil</button>${us.map(u=>`<button type="button" data-secuf="${esc(u)}" aria-pressed="${SECF.uf===u}" title="${esc(UFSM()[u])}">${esc(u)}<em>${uc[u]}</em></button>`).join("")}</div>`}
  if(SECF.sub||SECF.uf)return h+`</div>`;
  const cob=todas.filter(p=>cobTemPagina(p)).slice(0,8);
  if(cob.length)h+=`<div><span class="segs-h" style="padding-top:0">Coberturas ativas</span><div class="segs">${cob.map(p=>{const et=cobEtapaAtual(p);return `<button type="button" class="segc" data-cobpag="${esc(p.id)}"><b>${esc(temaDe(p)||p.neutro?.titulo)}</b><span>${p.status==="ao_vivo"?"Ao vivo":p.status==="encerrada"?"Encerrada":et?esc(et):esc(quando(ultimaAtualizacao(p)||p.hora))}</span></button>`}).join("")}</div></div>`;
  if(sec==="politica"||sec==="educacao"){const tr=todas.filter(p=>p.etapa&&Array.isArray(p.etapa.passos)&&p.etapa.passos.length>1);
    if(tr.length)h+=`<div class="sh4-b"><h5>${sec==="politica"?"Em tramitação":"Leis e normas em andamento"}</h5>${tr.map(p=>`<button type="button" class="sh4-tr" data-cobpag="${esc(p.id)}"><b>${esc(temaDe(p)||p.neutro?.titulo)}</b>${cobEtapas(p)}</button>`).join("")}</div>`}
  if(sec==="economia")h+=indPainel();
  {const cal=calendarioDe(sec,8);if(cal.length)h+=`<div class="sh4-b"><h5>${sec==="economia"?"Calendário econômico":sec==="educacao"?"Provas e inscrições":sec==="politica"?"Calendário":"Datas"}</h5>${calHTML(cal.slice(0,4))}${cal.length>4?`<details class="sh4-mais"><summary>Ver mais ${cal.length-4} datas</summary>${calHTML(cal.slice(4))}</details>`:""}</div>`}
  if(sec==="politica"){const hj=hojeSP(),ag=(FEED.agenda||[]).map(a=>({...a,_d:agData(a,hj)})).filter(a=>a.secao==="politica"&&a._d>=hj).sort((x,y)=>x._d.localeCompare(y._d)||agMin(x)-agMin(y)).slice(0,6);
    if(ag.length)h+=`<div class="sh4-b"><h5>Agenda da semana</h5><ul class="sh4-cal">${ag.map(a=>`<li><time>${a._d===hj?"Hoje":esc(dataCurta(a._d))}${agHoraTxt(a)?" "+esc(agHoraTxt(a)):""}</time><span>${esc(a.texto)}</span></li>`).join("")}</ul></div>`}
  if(sec==="brasil"){const sv=todas.filter(p=>Array.isArray(p.servicos)&&p.servicos.length);
    if(sv.length)h+=`<div class="sh4-b"><h5>Serviços e como ajudar</h5>${sv.map(p=>`<b style="font-size:14.5px">${esc(temaDe(p)||p.neutro?.titulo)}</b>${srvHTML(p)}`).join("")}</div>`}
  if(sec==="mundo"){const cf=todas.filter(p=>cobEh(p)&&(cobTemPagina(p)||p.e_o_brasil||(FEED.explicadores||{})[temaDe(p)]));
    if(cf.length)h+=`<div class="sh4-b"><h5>Conflitos e crises</h5><div class="sh4-cf">${cf.map(p=>`<button type="button" data-cobpag="${esc(p.id)}"><b>${esc(temaDe(p)||p.neutro?.titulo)}</b><span>${esc(p.subtema||"")}${(FEED.explicadores||{})[temaDe(p)]?" · Entenda":""}${p.e_o_brasil?" · E o Brasil?":""}</span></button>`).join("")}</div></div>`}
  return h+`</div>`}
function srvHTML(p){return `<ul class="sh4-srv">${(p.servicos||[]).filter(x=>x&&x.texto).slice(0,6).map(x=>`<li>${esc(x.texto)}${x.url?` · <a href="${escU(x.url)}" target="_blank" rel="noopener">abrir ›</a>`:""}</li>`).join("")}</ul>`}
/* página da cobertura: O essencial (ao vivo), E o Brasil?, Serviços */
(function(){const ant=abrirPagCob;abrirPagCob=function(pid){ant(pid);const p=pautaById(pid);const box=document.querySelector(".sheet .pc[data-pc]");if(!p||!box)return;
  const ess=(Array.isArray(p.essencial)?p.essencial:[]).filter(Boolean).slice(0,3);const meta=box.querySelector(".pc-m"),et=box.querySelector(".etp");
  if(ess.length&&p.status==="ao_vivo")(et||meta).insertAdjacentHTML("afterend",`<div class="pc-ess"><h4>O essencial</h4><ul>${ess.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`);
  const res=[...box.querySelectorAll("h4")].find(x=>x.textContent==="Resumo");const lead=res&&res.nextElementSibling;
  let extra="";if(Array.isArray(p.servicos)&&p.servicos.length)extra+=`<h4>Serviços e como ajudar</h4>${srvHTML(p)}`;
  if(extra&&lead)lead.insertAdjacentHTML("afterend",extra)}})();
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  const sb=t.closest("[data-secsub]");if(sb){e.stopPropagation();SECF={sec:FILTRO,sub:sb.dataset.secsub,uf:SECF.sec===FILTRO?SECF.uf:""};renderPosts();uso("secsub");return}
  const su=t.closest("[data-secuf]");if(su){e.stopPropagation();SECF={sec:FILTRO,sub:SECF.sec===FILTRO?SECF.sub:"",uf:su.dataset.secuf};renderPosts();uso("secuf");return}
},true);

/* ================= Etapa 5: esportes ================= */
function espD(){const e=FEED&&FEED.esportes;return e&&typeof e==="object"?e:{}}
function espComps(){return (Array.isArray(espD().competicoes)?espD().competicoes:[]).filter(c=>c&&c.id&&c.nome)}
function espJogos(){return (Array.isArray(espD().jogos)?espD().jogos:[]).filter(j=>j&&j.a&&j.b&&j.data)}
function espComp(id){return espComps().find(c=>c.id===id)}
function espTimes(){const s=new Set();espJogos().forEach(j=>{s.add(j.a);s.add(j.b)});espComps().forEach(c=>(c.tabela||[]).forEach(t=>t&&t.time&&s.add(t.time)));return [...s].sort((a,b)=>a.localeCompare(b,"pt-BR"))}
function espEh(t,n){return norm(t)===norm(n)}
function espJogoHTML(j,opts){opts=opts||{};const enc=j.estado==="encerrado",viv=j.estado==="ao_vivo",pl=(enc||viv)&&j.ga!=null&&j.gb!=null&&j.ga!==""&&j.gb!=="";const ga=+j.ga,gb=+j.gb;
  const mt=PREF.meuTime,cls=x=>enc&&pl?((x==="a"?ga>gb:gb>ga)?"w":(ga===gb?"":"l")):"";
  const meio=pl?`<span class="m${viv?" v":""}">${esc(j.ga)} × ${esc(j.gb)}</span>`:`<span class="m h">${esc(j.hora||"a definir")}</span>`;
  const comp=espComp(j.comp);const info=[opts.dia?dataCurta(j.data):"",opts.comp&&comp?comp.nome:"",j.fase||"",viv?`ao vivo${j.atualizado?" · atualizado às "+hhmm(j.atualizado):""}`:"",!pl&&j.local?j.local:"",!pl&&j.tv?j.tv:""].filter(Boolean).join(" · ");
  const inner=`<span class="a ${cls("a")}">${esc(j.a)}</span>${meio}<span class="b ${cls("b")}">${esc(j.b)}</span>${info?`<span class="info">${esc(info)}</span>`:""}`;
  return `<li>${j.pid&&pautaById(j.pid)?`<button type="button" data-goto="${esc(j.pid)}">${inner}</button>`:`<div class="r">${inner}</div>`}</li>`}
function espLinha(time){for(const c of espComps()){const t=(c.tabela||[]).find(x=>x&&espEh(x.time,time));if(t)return {c,t}}return null}
function espVDE(time){return espJogos().filter(j=>j.estado==="encerrado"&&j.ga!=null&&j.gb!=null&&(espEh(j.a,time)||espEh(j.b,time))).sort((x,y)=>String(y.data).localeCompare(String(x.data))).slice(0,5).reverse().map(j=>{const g=espEh(j.a,time)?[+j.ga,+j.gb]:[+j.gb,+j.ga];return g[0]>g[1]?"V":g[0]<g[1]?"D":"E"})}
function espProx(time){const hj=hojeSP();return espJogos().filter(j=>j.estado!=="encerrado"&&j.data>=hj&&(espEh(j.a,time)||espEh(j.b,time))).sort((x,y)=>(x.data+(x.hora||"")).localeCompare(y.data+(y.hora||"")))[0]}
function espUlt(time){return espJogos().filter(j=>j.estado==="encerrado"&&(espEh(j.a,time)||espEh(j.b,time))).sort((x,y)=>String(y.data).localeCompare(String(x.data)))[0]}
function espNoticias(time){const n=norm(time);return (FEED?.pautas||[]).filter(p=>secOf(p)==="esportes"&&((Array.isArray(p.times)&&p.times.some(t=>espEh(t,time)))||norm([p.neutro?.titulo,p.tag,p.tema].join(" ")).includes(n)))}
function tabelaHTML(c,max){const tb=(c.tabela||[]).filter(x=>x&&x.time);if(!tb.length)return "";const mt=PREF.meuTime;
  return `<table class="tab"><thead><tr><th>#</th><th>Time</th><th>Pts</th><th>J</th><th>V</th><th>SG</th></tr></thead><tbody>${tb.slice(0,max||99).map(t=>`<tr class="${mt&&espEh(t.time,mt)?"meu":""}"><td>${esc(t.pos)}</td><td><button type="button" data-time="${esc(t.time)}">${esc(t.time)}</button></td><td><b>${esc(t.pts)}</b></td><td>${esc(t.j??"")}</td><td>${esc(t.v??"")}</td><td>${esc(t.sg??"")}</td></tr>`).join("")}</tbody></table>${c.tabela_ate?`<p class="hint" style="margin:4px 0 0">Classificação ${esc(c.tabela_ate)}.</p>`:""}`}
function chaveHTML(c){const ch=(Array.isArray(c.chave)?c.chave:[]).filter(f=>f&&f.fase);if(!ch.length)return "";
  return `<div class="chv">${ch.map(f=>`<span class="cf">${esc(f.fase)}</span>${(f.confrontos||[]).map(x=>`<div class="cj"><b>${esc(x.a)} × ${esc(x.b)}</b><span>${[x.ida?"ida "+x.ida:"",x.volta?"volta "+x.volta:"",x.agregado?"agregado "+x.agregado:"",x.classificado?"classificado: "+x.classificado:""].filter(Boolean).join(" · ")||"a jogar"}</span></div>`).join("")}`).join("")}</div>`}
function meuTimeHTML(){const mt=PREF.meuTime;if(!mt){const ts=espTimes();return ts.length?`<button type="button" class="esp-cta" data-escolhertime><span>Escolha o seu time para ver próximo jogo, resultados e notícias</span><span aria-hidden="true">›</span></button>`:""}
  const ln=espLinha(mt),px=espProx(mt),ul=espUlt(mt),vde=espVDE(mt),nt=espNoticias(mt).slice(0,3);
  return `<div class="esp-mt"><div class="hd"><button type="button" data-time="${esc(mt)}" style="text-align:left"><b>${esc(mt)} ›</b></button><span>${ln?`${esc(ln.t.pos)}º · ${esc(ln.t.pts)} pts`:""}</span></div>
    ${vde.length?`<div class="vde" aria-label="Últimos resultados">${vde.map(r=>`<i class="${r}">${r}</i>`).join("")}</div>`:""}
    ${px?`<span class="esp-sub">${px.estado==="ao_vivo"?"Jogando agora":"Próximo jogo"}</span><ul class="jg">${espJogoHTML(px,{dia:1,comp:1})}</ul>`:""}
    ${ul?`<span class="esp-sub">Último resultado</span><ul class="jg">${espJogoHTML(ul,{dia:1,comp:1})}</ul>`:""}
    ${nt.length?`<span class="esp-sub">Notícias</span>${nt.map(p=>`<button type="button" class="bv-it" data-goto="${esc(p.id)}"><span>${esc(p.neutro?.titulo)}</span><span class="chev" aria-hidden="true">›</span></button>`).join("")}`:""}
    ${!ln&&!px&&!ul&&!nt.length?`<p class="hint" style="margin:0">Sem jogos ou notícias do ${esc(mt)} nesta edição.</p>`:""}
    <button type="button" class="tr" data-escolhertime style="align-self:flex-start">Trocar de time</button></div>`}
function esportesHub(sub){const comps=espComps(),js=espJogos(),hj=hojeSP();
  const compSub=sub?comps.find(c=>(c.subtema||c.nome)===sub||c.nome===sub):null;
  if(sub&&!compSub)return "";
  let h=`<div class="esp gut">`;
  if(!sub)h+=meuTimeHTML();
  const filtra=j=>!compSub||j.comp===compSub.id;
  const hoje=js.filter(j=>j.data===hj&&filtra(j)).sort((x,y)=>(x.estado==="ao_vivo"?-1:0)-(y.estado==="ao_vivo"?-1:0)||String(x.hora).localeCompare(String(y.hora)));
  if(hoje.length){const por={};hoje.forEach(j=>(por[j.comp]=por[j.comp]||[]).push(j));
    h+=`<div class="sh4-b"><h5>Jogos de hoje</h5>${Object.entries(por).map(([k,l])=>`${!compSub?`<span class="esp-sub">${esc(espComp(k)?.nome||k)}</span>`:""}<ul class="jg">${l.map(j=>espJogoHTML(j)).join("")}</ul>`).join("")}</div>`}
  const prox=js.filter(j=>j.data>hj&&j.estado!=="encerrado"&&filtra(j)).sort((x,y)=>(x.data+(x.hora||"")).localeCompare(y.data+(y.hora||""))).slice(0,compSub?10:6);
  if(prox.length)h+=`<div class="sh4-b"><h5>Próximos jogos</h5><ul class="jg">${prox.map(j=>espJogoHTML(j,{dia:1,comp:!compSub})).join("")}</ul></div>`;
  const res=js.filter(j=>j.estado==="encerrado"&&j.data<hj&&filtra(j)).sort((x,y)=>String(y.data).localeCompare(String(x.data))).slice(0,compSub?10:4);
  if(res.length&&compSub)h+=`<div class="sh4-b"><h5>Resultados</h5><ul class="jg">${res.map(j=>espJogoHTML(j,{dia:1})).join("")}</ul></div>`;
  const dest=compSub||comps.find(c=>c.destaque&&((c.tabela||[]).length||(c.chave||[]).length))||comps.find(c=>(c.tabela||[]).length);
  if(dest){const tb=tabelaHTML(dest,compSub?99:6),ch=chaveHTML(dest);if(tb||ch)h+=`<div class="sh4-b"><h5>${esc(dest.nome)}${dest.fase?" · "+esc(dest.fase):""}${!compSub?`<button type="button" data-comp="${esc(dest.id)}" style="font-family:var(--f-ui);text-transform:none;letter-spacing:0;color:var(--accent)">Ver ${tb?"tabela":"chave"} ›</button>`:""}</h5>${ch&&!tb?ch:tb}${compSub&&ch&&tb?ch:""}</div>`}
  if(!compSub&&comps.length>1)h+=`<div class="sh4-b"><h5>Campeonatos</h5><div class="sh4-cf">${comps.map(c=>`<button type="button" data-comp="${esc(c.id)}"><b>${esc(c.nome)}</b><span>${esc(c.fase||"")}</span></button>`).join("")}</div></div>`;
  return h+`</div>`}
function abrirComp(id){const c=espComp(id);if(!c)return;uso("campeonato");const hj=hojeSP();const js=espJogos().filter(j=>j.comp===id);
  const abas=[["jogos","Jogos"],[(c.tabela||[]).length?"tabela":"chave",(c.tabela||[]).length?"Tabela":"Chave"],["noticias","Notícias"]].filter(([k])=>k!=="chave"||(c.chave||[]).length);
  const draw=k=>{let b="";
    if(k==="jogos"){const fut=js.filter(j=>j.estado!=="encerrado").sort((x,y)=>(x.data+(x.hora||"")).localeCompare(y.data+(y.hora||""))),pas=js.filter(j=>j.estado==="encerrado").sort((x,y)=>String(y.data).localeCompare(String(x.data)));
      b=(fut.length?`<span class="esp-sub">Próximos</span><ul class="jg">${fut.map(j=>espJogoHTML(j,{dia:1})).join("")}</ul>`:"")+(pas.length?`<span class="esp-sub">Resultados</span><ul class="jg">${pas.map(j=>espJogoHTML(j,{dia:1})).join("")}</ul>`:"")||`<p class="hint">Sem jogos na edição.</p>`}
    if(k==="tabela")b=tabelaHTML(c)+(chaveHTML(c)?`<span class="esp-sub">Mata-mata</span>${chaveHTML(c)}`:"");
    if(k==="chave")b=chaveHTML(c);
    if(k==="noticias"){const ps=(FEED.pautas||[]).filter(p=>secOf(p)==="esportes"&&(p.subtema===(c.subtema||c.nome)||p.subtema===c.nome));b=ps.length?ps.map(p=>`<button type="button" class="bv-it" data-goto="${esc(p.id)}"><span>${esc(p.neutro?.titulo)}</span><span class="chev" aria-hidden="true">›</span></button>`).join(""):`<p class="hint">Sem notícias deste campeonato nesta edição.</p>`}
    const box=$("#compbox");if(box)box.innerHTML=b;document.querySelectorAll("[data-compaba]").forEach(x=>x.setAttribute("aria-selected",String(x.dataset.compaba===k)))};
  sheet(c.nome,`${c.fase?`<p class="hint" style="margin:0">${esc(c.fase)}</p>`:""}<div class="segs" role="tablist">${abas.map(([k,l])=>`<button type="button" role="tab" data-compaba="${k}">${l}</button>`).join("")}</div><div id="compbox"></div>`);
  $(".sheet .segs").addEventListener("click",e=>{const b=e.target.closest("[data-compaba]");if(b)draw(b.dataset.compaba)});draw(js.length?"jogos":abas[1][0])}
function abrirTime(t){uso("time");const ln=espLinha(t),px=espProx(t),vde=espVDE(t),nt=espNoticias(t),mt=PREF.meuTime&&espEh(PREF.meuTime,t);
  const js=espJogos().filter(j=>espEh(j.a,t)||espEh(j.b,t)).sort((x,y)=>String(y.data).localeCompare(String(x.data)));
  sheet(t,`${ln?`<p style="margin:0;font-size:15px"><b>${esc(ln.t.pos)}º</b> no ${esc(ln.c.nome)} · ${esc(ln.t.pts)} pts${ln.t.j!=null?" em "+esc(ln.t.j)+" jogos":""}</p>`:""}
    ${vde.length?`<div class="vde" aria-label="Últimos resultados">${vde.map(r=>`<i class="${r}">${r}</i>`).join("")}</div>`:""}
    ${px?`<span class="esp-sub">${px.estado==="ao_vivo"?"Jogando agora":"Próximo jogo"}</span><ul class="jg">${espJogoHTML(px,{dia:1,comp:1})}</ul>`:""}
    ${js.filter(j=>j.estado==="encerrado").length?`<span class="esp-sub">Últimos jogos</span><ul class="jg">${js.filter(j=>j.estado==="encerrado").slice(0,5).map(j=>espJogoHTML(j,{dia:1,comp:1})).join("")}</ul>`:""}
    <span class="esp-sub">Notícias</span>${nt.length?nt.map(p=>`<button type="button" class="bv-it" data-goto="${esc(p.id)}"><span>${esc(p.neutro?.titulo)}</span><span class="chev" aria-hidden="true">›</span></button>`).join(""):`<p class="hint" style="margin:0">Sem notícias do ${esc(t)} nesta edição.</p>`}
    <button type="button" class="btn${mt?" ghost":""}" data-meutime="${esc(t)}">${mt?"É o seu time ✓":"Este é o meu time"}</button>`)}
function abrirEscolhaTime(){const ts=espTimes();
  sheet("Meu time",ts.length?`<p class="hint" style="margin:0">Fica salvo na sua conta e vale em todos os aparelhos.</p><div class="tpick">${ts.map(t=>`<button type="button" data-meutime="${esc(t)}" aria-pressed="${!!(PREF.meuTime&&espEh(PREF.meuTime,t))}">${esc(t)}</button>`).join("")}</div>${PREF.meuTime?`<button type="button" class="link" data-meutime="">Não acompanhar nenhum time</button>`:""}`:`<p class="hint">A lista de times aparece quando a rodada publicar jogos e tabela.</p>`)}
(function(){const ant=secHub;secHub=function(sec){let h=ant(sec);if(sec==="esportes"&&FILTRO==="esportes"){const x=esportesHub(SECF&&SECF.sec==="esportes"?SECF.sub:"");if(x)h+=x}return h}})();
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  const c=t.closest("[data-comp]");if(c){e.stopPropagation();abrirComp(c.dataset.comp);return}
  const tm=t.closest("[data-time]");if(tm){e.stopPropagation();abrirTime(tm.dataset.time);return}
  if(t.closest("[data-escolhertime]")){e.stopPropagation();abrirEscolhaTime();return}
  const mt=t.closest("[data-meutime]");if(mt){e.stopPropagation();const v=mt.dataset.meutime;if(v)PREF.meuTime=v;else delete PREF.meuTime;salvarPrefs();uso("meu_time");closeLayer();toast(v?"Meu time: "+v:"Você não acompanha nenhum time");if(FEED)renderPosts();return}
},true);

/* ================= Etapa 6: acabamentos ================= */
/* breves urgentes (até 3 h) */
function urgentes(){const ag=Date.now();return (FEED?.breves||[]).map((b,i)=>({b,i})).filter(x=>x.b&&x.b.urgente&&tms(x.b.hora)&&ag-tms(x.b.hora)<3*3600e3&&!(PREF.ocultas||[]).includes(x.b.secao||"politica"))}
function urgHTML(extra){const u=urgentes();if(!u.length)return "";return `<div class="urg ${extra||""}"><b>Urgente</b>${u.map(x=>`<button type="button" data-urg="${esc(x.b.url||"")}">${esc(x.b.titulo)}<br><span>${esc(nomeFonte(x.b.fonte))} · ${esc(hhmm(x.b.hora))}</span></button>`).join("")}</div>`}
function abrirUrgente(i){const b=(FEED?.breves||[])[i];if(!b)return;uso("urgente");
  sheet("Urgente",`<h3 style="margin:0;font-family:var(--f-display);font-size:21px;line-height:1.25">${esc(b.titulo)}</h3><p class="hint" style="margin:0">${esc(nomeFonte(b.fonte))} · ${esc(secNome(b.secao||"politica"))} · ${esc(hhmm(b.hora))}</p><a class="btn" href="${escU(b.url)}" target="_blank" rel="noopener">Ler em ${esc(nomeFonte(b.fonte))} ›</a><p class="hint" style="margin:0">Notícia que acabou de sair. Se o assunto continuar, o Prumo abre uma cobertura com mais detalhes.</p>`)}
/* feed "Meus temas" */
function meusTemasOk(p){if(PREF.feedModo!=="seguindo")return true;if(seguido(p))return true;const mt=PREF.meuTime;if(mt&&secOf(p)==="esportes"&&((Array.isArray(p.times)&&p.times.some(t=>norm(t)===norm(mt)))||norm([p.neutro?.titulo,p.tag,p.tema].join(" ")).includes(norm(mt))))return true;return false}
/* pastas das guardadas */
var PASTA_G="";
function pastasSalvas(){const c={};Object.values(S.salvos||{}).forEach(x=>{if(x&&x.pasta)c[x.pasta]=(c[x.pasta]||0)+1});return c}
async function moverPasta(pid,nome){const x=S.salvos[pid];if(!x||!S.uid)return;nome=String(nome||"").trim().slice(0,30);const val={...x};if(nome)val.pasta=nome;else delete val.pasta;S.salvos[pid]=val;if(VIEW==="saved")renderSaved();uso("pasta");
  try{await gravarMapa(`data/users/${S.uid}/salvos`,"itens",pid,val);toast(nome?"Na pasta "+nome:"Fora das pastas")}catch(e){if(S.salvos[pid]===val){S.salvos[pid]=x;if(VIEW==="saved")renderSaved()}toast("Não deu para mudar a pasta agora.")}}
(function(){const ant=renderSaved;renderSaved=function(){ant();if(ABA_G!=="minhas")return;const v=$("#v-saved");const ul=v&&v.querySelector(".svl");if(!ul)return;
  const ps=pastasSalvas(),ks=Object.keys(ps).sort((a,b)=>a.localeCompare(b,"pt-BR"));if(PASTA_G&&!ps[PASTA_G])PASTA_G="";
  ul.querySelectorAll("[data-open]").forEach(b=>{const x=S.salvos[b.dataset.open];if(x&&x.pasta){const sx=b.querySelector(".svx");if(sx)sx.insertAdjacentHTML("beforeend",`<span class="pst">▸ ${esc(x.pasta)}</span>`)}if(PASTA_G&&(!x||x.pasta!==PASTA_G))b.closest("li").hidden=true});
  const tot=Object.values(S.salvos).filter(Boolean).length;
  ul.insertAdjacentHTML("beforebegin",`<div class="sh4-chips" role="group" aria-label="Pastas" style="margin:2px 0 6px">${ks.length?`<button type="button" data-pasta="" aria-pressed="${!PASTA_G}">Todas<em>${tot}</em></button>${ks.map(k=>`<button type="button" data-pasta="${esc(k)}" aria-pressed="${PASTA_G===k}">${esc(k)}<em>${ps[k]}</em></button>`).join("")}`:""}</div>${ks.length?"":`<p class="hint" style="margin:0 0 6px">Dica: segure o dedo numa notícia para pôr numa pasta, como “Ler depois”.</p>`}`)}})();
/* prévia ao segurar o dedo */
function abrirPrevia(pid){const p=pautaById(pid),s=p?snapOf(p):snapById(pid);if(!s){openSnap(pid);return}uso("previa");vibrar(12);
  const sv=S.salvos[pid],logado=!!(S.uid&&S.membro),ps=Object.keys(pastasSalvas()).sort((a,b)=>a.localeCompare(b,"pt-BR"));if(!ps.includes("Ler depois"))ps.unshift("Ler depois");
  sheet("Prévia",`<div class="pv">${p&&fotoDe(p)?capaArte(p,"art",true):`<div class="art paper" data-sec="${esc(s.secao||"politica")}">${svgOf(s.imagem)}</div>`}<span class="cp-k" style="color:${secCor(s.secao||"politica")}">${esc(p?capaChapeu(p):(s.tag||secNome(s.secao||"politica")))}</span><h3>${esc(s.titulo)}</h3><p>${esc(capaFrase(s.texto,260))}</p>
    <div class="pv-a"><button type="button" class="btn" data-pvabrir="${esc(pid)}">Abrir</button>${logado?`<button type="button" class="btn ghost" data-pvsalvar="${esc(pid)}">${sv?"Guardada ✓":"Guardar"}</button>`:""}${p&&cobTemPagina(p)?`<button type="button" class="btn ghost" data-cobpag="${esc(pid)}">Cobertura</button>`:""}${p?`<button type="button" class="btn ghost" data-pvshare="${esc(pid)}">Compartilhar</button>`:""}</div>
    ${logado&&sv?`<div class="pv-p"><b>Pasta</b><div class="sh4-chips">${ps.map(k=>`<button type="button" data-pvpasta="${esc(k)}" data-pid="${esc(pid)}" aria-pressed="${sv.pasta===k}">${esc(k)}</button>`).join("")}${sv.pasta?`<button type="button" data-pvpasta="" data-pid="${esc(pid)}">Tirar da pasta</button>`:""}</div><form id="pvnova"><input class="field" id="pvnome" maxlength="30" placeholder="Nova pasta" aria-label="Nova pasta"><button class="btn ghost" type="submit">Criar</button></form></div>`:""}</div>`);
  const f=$("#pvnova");if(f)f.addEventListener("submit",e=>{e.preventDefault();const n=$("#pvnome").value.trim();if(n){moverPasta(pid,n);abrirPrevia(pid)}})}
(function(){const SEL=".cpi-b[data-cpx],[data-capair],[data-busca],[data-goto],.svr[data-open],.segc[data-cobpag],.bv-it[data-cobpag]";let tm=0,el=null,x0=0,y0=0,preso=0,engole=0;
  const pidDe=e=>e.dataset.cpx||e.dataset.capair||e.dataset.busca||e.dataset.goto||e.dataset.open||e.dataset.cobpag;
  const solta=()=>{clearTimeout(tm);tm=0;if(el)el.classList.remove("segurando");el=null};
  document.addEventListener("pointerdown",e=>{if(e.button>0)return;const t=e.target.closest&&e.target.closest(SEL);if(!t||t.closest(".tk-vp"))return;preso=0;el=t;x0=e.clientX;y0=e.clientY;
    tm=setTimeout(()=>{const p=pidDe(el);solta();if(!p)return;preso=1;abrirPrevia(p)},480);setTimeout(()=>{if(el===t&&tm)t.classList.add("segurando")},150)},{passive:true});
  document.addEventListener("pointermove",e=>{if(tm&&Math.hypot(e.clientX-x0,e.clientY-y0)>10)solta()},{passive:true});
  ["pointerup","pointercancel","scroll"].forEach(k=>document.addEventListener(k,solta,{passive:true,capture:true}));
  window.addEventListener("pointerup",()=>{if(preso){preso=0;engole=Date.now()}},true);
  window.addEventListener("pointercancel",()=>{preso=0},true);
  window.addEventListener("click",e=>{if(engole&&Date.now()-engole<600){engole=0;e.stopPropagation();e.preventDefault()}},true);
  document.addEventListener("contextmenu",e=>{if(e.target.closest&&e.target.closest(SEL))e.preventDefault()});})();
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  const ug=t.closest("[data-urg]");if(ug){e.stopPropagation();abrirUrgente((FEED?.breves||[]).findIndex(b=>b&&b.url===ug.dataset.urg));return}
  const pa=t.closest("[data-pasta]");if(pa){e.stopPropagation();PASTA_G=pa.dataset.pasta;renderSaved();return}
  const pvs=t.closest("[data-pvshare]");if(pvs){e.stopPropagation();compartilhar(pvs.dataset.pvshare);return}
  const pv=t.closest("[data-pvabrir]");if(pv){e.stopPropagation();const id=pv.dataset.pvabrir;closeLayer();setTimeout(()=>{if(VIEW==="capa"&&pautaById(id))abrirMateria(id);else openSnap(id)},30);return}
  const ps=t.closest("[data-pvsalvar]");if(ps){e.stopPropagation();const id=ps.dataset.pvsalvar;toggleSave(id).then(()=>{});setTimeout(()=>{if($(".pv"))abrirPrevia(id)},60);return}
  const pp=t.closest("[data-pvpasta]");if(pp){e.stopPropagation();const id=pp.dataset.pid;moverPasta(id,pp.dataset.pvpasta);setTimeout(()=>abrirPrevia(id),40);return}
},true);

/* ================= Etapa 8: indicadores automáticos (indicadores.json, gravado pelo GitHub) ================= */
var IND_AUTO=null;try{IND_AUTO=JSON.parse(localStorage.getItem("prumo-ind")||"null")}catch(e){}
var IND_ORD=["dolar","ibovespa","selic","ipca12m","desemprego"];
function indItens(){const base=((FEED&&FEED.indicadores&&Array.isArray(FEED.indicadores.itens))?FEED.indicadores.itens:[]).filter(x=>x&&typeof x==="object");
  const auto=(IND_AUTO&&Array.isArray(IND_AUTO.itens))?IND_AUTO.itens.filter(x=>x&&typeof x==="object"&&x.id&&x.valor):[];
  if(!auto.length)return base;const m=new Map(base.map(x=>[x.id,x]));
  auto.forEach(x=>{const a=m.get(x.id);m.set(x.id,Object.assign({},x,{serie:Array.isArray(x.serie)?x.serie:(a&&a.serie)}))});
  return [...m.values()].sort((a,b)=>{const i=IND_ORD.indexOf(a.id),j=IND_ORD.indexOf(b.id);return (i<0?99:i)-(j<0?99:j)})}
function rodadaRecenteMin(){try{const r=(typeof S!=="undefined"&&S)?S.rodadas:null;if(!r||!r.itens||r.dia!==hojeSP())return 1e9;
  const ag=minAgoraSP();let melhor=1e9;Object.keys(r.itens).forEach(k=>{const m=/^(\d{1,2})h(\d{2})$/.exec(k);if(m){const d=ag-(+m[1]*60+ +m[2]);if(d>=0&&d<melhor)melhor=d}});return melhor}catch(e){return 1e9}}
var IND_T=0;
async function carregarIndAuto(){if(Date.now()-IND_T<60000)return;IND_T=Date.now();
  try{const r=await fetch("indicadores.json",{cache:"no-cache"});if(!r.ok)return;const j=await r.json();if(!j||!Array.isArray(j.itens))return;
    const mudou=JSON.stringify(j)!==JSON.stringify(IND_AUTO);IND_AUTO=j;try{localStorage.setItem("prumo-ind",JSON.stringify(j))}catch(e){}
    if(mudou&&FEED){try{if(VIEW==="capa")renderCapa();else if(VIEW==="feed"&&FILTRO==="economia"){const y=scrollY;renderPosts(true);window.scrollTo(0,y)}}catch(e){}}}catch(e){}}
(function(){const ant=checarFeed;checarFeed=function(x){carregarIndAuto();return ant.apply(this,arguments)}})();
carregarIndAuto();

