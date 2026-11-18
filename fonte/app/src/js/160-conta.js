/* ---------- 160: conta, convite, entrar e conversas (achados do testador, 15/11 noite) ----------
   Nomes com o prefixo co160.
   1. Link de convite: a folha de criar conta abre com boas-vindas ("Você recebeu um convite…") e, quando o banco tem a
      função convite_info (sql/proposta-2026-11-15-convite.sql), diz de quem é o convite e avisa logo se ele não vale;
      "Criar conta" confere o convite ANTES de criar o login (sem a função, fica como antes).
   2. Link de post sem conta: texto que explica que o post só aparece para quem tem conta e como conseguir convite; com a
      função post_previa (mesma proposta), mostra de quem é o post e a notícia comentada, ou que o post não existe mais.
   3. "Esqueci a senha": manda o e-mail de redefinição do Supabase (resetPasswordForEmail) e, na volta do link, abre
      "Criar uma senha nova".
   4. A folha de entrar sempre diz por que apareceu quando foi aberta por um botão (curtir, repostar, comentar…).
   5. Conversas e Guardadas sem conta: "Criar conta com convite" e como conseguir convite; Perfil sem conta diz "curtir".
   6. Guia da 1ª visita: abre logo na abertura (antes das notícias, no lugar do esqueleto), e não por cima da Capa já
      carregada; deitado, desenho e texto lado a lado (css/64).
   7. Conversas: campo de mensagem que cresce até 5 linhas; "Nova conversa" e a busca sem resultado oferecem
      "Adicionar amigos" e "Convidar alguém"; opções da conversa com "Ver perfil" e rótulos curtos; "Denunciar" não
      aparece para a conta do administrador (era "o Pedro recebe e analisa" sobre o próprio Pedro); cartão de notícia
      com a mesma editoria da Capa.
   8. Perfil: o de um amigo mostra "Amigos ✓" e esconde "0 seguidores · 0 seguindo"; o próprio, sem posts, não repete
      "Nova publicação" na fileira de cima, e a fileira quebra em telas estreitas.
   9. Melhores amigos explica que é para tocar; "Mudar meu nome" avisa com o campo vazio; Salvos explica as duas listas.
  10. Folhas com fundo sólido e a barra de baixo escondida enquanto uma folha está aberta. */

var CO160={rpc:{},cv:{},t:0,el:null,rec:null};
/* a função existe no banco? (PostgREST: PGRST202; Postgres: 42883) */
function co160SemFuncao(e){const m=String(e&&(e.message+" "+e.code+" "+(e.details||"")+" "+(e.hint||""))||"");return /PGRST202|42883|does not exist|Could not find the function|schema cache/i.test(m)}
async function co160Rpc(nome,args){if(CO160.rpc[nome]===false)return {sem:true};const sb=sbCliente();if(!sb)return {sem:true};
  try{const r=await sb.rpc(nome,args);if(r&&r.error){if(co160SemFuncao(r.error)){CO160.rpc[nome]=false;return {sem:true}}return {erro:r.error}}CO160.rpc[nome]=true;return {data:r?r.data:null}}
  catch(e){if(co160SemFuncao(e)){CO160.rpc[nome]=false;return {sem:true}}return {erro:e}}}

/* ---------- 1. convite: boas-vindas e conferência antes de criar a conta ---------- */
function co160LimpaCod(c){return String(c||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,20)}
async function co160Convite(cod){cod=co160LimpaCod(cod);if(!cod)return {vazio:true};if(CO160.cv[cod])return CO160.cv[cod];
  const r=await co160Rpc("convite_info",{p_codigo:cod});if(r.sem||r.erro)return {sem:true};const d=r.data||{};const o={valido:!!d.valido,de:String(d.de||"").slice(0,40),motivo:d.motivo||"",fundador:!!d.fundador};CO160.cv[cod]=o;return o}
function co160CvTexto(o){if(!o||o.sem||o.vazio)return null;if(o.valido)return o.fundador?"":(o.de?`Convite de <b>${esc(o.de)}</b>: está valendo.`:"Convite válido.");
  return o.motivo==="usado"?"Este convite já foi usado. Peça outro a quem te convidou.":o.motivo==="expirado"?"Este convite expirou (vale 7 dias). Peça outro a quem te convidou.":"Este convite não existe ou não vale mais. Confira o código ou peça outro a quem te convidou."}
async function co160ConfereCampo(){const i=$("#lcod");if(!i)return;const cod=co160LimpaCod(i.value),st=$("#co160cvst");if(!st)return;
  if(!cod){st.hidden=true;st.className="co160-cvst";return}const o=await co160Convite(cod);if(!$("#lcod")||co160LimpaCod($("#lcod").value)!==cod)return;
  const t=co160CvTexto(o);if(t==null||t===""){st.hidden=true;return}st.hidden=false;st.className="co160-cvst "+(o.valido?"ok":"no");st.innerHTML=t;
  const bv=$("#layer .co160-bv b");if(bv&&o.valido&&o.de)bv.textContent=o.de+" te convidou para o Prumo"}
{const _cc160=criarConta;criarConta=async function(){const i=$("#lcod");const cod=i?co160LimpaCod(i.value):"";
  if(cod&&$("#lnome")&&$("#lnome").value.trim()){const b=$("#lform [type=submit]");if(b)b.disabled=true;let o;try{o=await co160Convite(cod)}finally{if(b)b.disabled=false}
    if(o&&!o.sem&&!o.vazio&&!o.valido){const st=$("#co160cvst");if(st){st.hidden=false;st.className="co160-cvst no";st.innerHTML=co160CvTexto(o)}mostraErro("#lerro","A conta não foi criada: o convite não vale. "+(o.motivo==="usado"||o.motivo==="expirado"?"Peça outro a quem te convidou.":"Confira o código."));try{i.focus()}catch(e){}return}}
  return _cc160.apply(this,arguments)}}

/* ---------- 2. link de post sem conta ---------- */
PC106_TX.post_link="Esse post é de alguém do Prumo e só aparece para quem tem conta. Entre na sua conta ou, se ainda não tem, peça um convite a quem te mandou o link.";
async function co160PostPrevia(id){const box=$("#layer .co160-pp");if(!box||!id)return;const r=await co160Rpc("post_previa",{p_id:id});const b=$("#layer .co160-pp");if(!b)return;
  if(r.sem||r.erro||!r.data){b.remove();return}const d=r.data;
  if(!d.existe){b.innerHTML=`<b>Este post não está mais disponível.</b><span>Pode ter sido apagado ou arquivado por quem publicou.</span>`;b.classList.add("no");const p=$("#layer .pc106");if(p)p.textContent="Dá para ler as notícias do Prumo sem conta.";return}
  const nt=d.pid&&typeof pautaById==="function"&&pautaById(d.pid);const tit=nt?versao(nt,lente()).titulo:"";
  b.innerHTML=`<b>Post de ${esc(String(d.autor||"alguém do Prumo"))}</b>${nt?`<span>sobre a notícia:</span><button type="button" class="co160-ppn" data-co160lern="${esc(nt.id)}">${esc(tit)}<i aria-hidden="true">›</i></button>`:`<span>Para ver o que ${esc(String(d.autor||"a pessoa"))} escreveu, entre com a sua conta.</span>`}`}

window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-co160lern]");if(!b)return;e.preventDefault();e.stopPropagation();const id=b.dataset.co160lern;
  try{if(typeof VP99_LINK!=="undefined")VP99_LINK=null}catch(_){}closeLayer();setTimeout(()=>{try{abrirMateria(id)}catch(_){}},60)},true);

/* ---------- 3. esqueci a senha ---------- */
function co160Volta(){return location.origin+location.pathname.replace(/\/(m|c)\/[^/]*$/,"/")}
async function co160Esqueci(){const p=$("#lesq"),er=$("#lerro");if(er){er.hidden=true;er.textContent=""}if(!p)return;p.hidden=false;
  const em=($("#lemail")?.value||"").trim();if(!em||!/^\S+@\S+\.\S+$/.test(em)){p.className="hint co160-esq";p.textContent="Escreva o seu e-mail no campo acima e toque de novo em “Esqueci a senha”: mandamos um link para criar uma senha nova.";try{$("#lemail").focus()}catch(e){}return}
  const sb=sbCliente();if(!sb||!sb.auth||typeof sb.auth.resetPasswordForEmail!=="function"){p.textContent="Não deu para mandar o link neste endereço.";return}
  const b=$("[data-esqueci]");if(b)b.disabled=true;p.className="hint co160-esq";p.textContent="Mandando…";
  try{const r=await sb.auth.resetPasswordForEmail(em,{redirectTo:co160Volta()});if(r&&r.error)throw r.error;
    p.className="hint co160-esq ok";p.innerHTML=`Se houver uma conta com <b>${esc(em)}</b>, chega um e-mail com o link para criar uma senha nova. Veja também o spam. O link vale por pouco tempo.`;try{uso("senha_esqueci")}catch(e){}}
  catch(e){const m=String(e&&(e.message+" "+(e.status||"")+" "+(e.code||""))||"");p.className="hint co160-esq no";p.textContent=/rate|too many|429|limit|seconds/i.test(m)?"Já mandamos um link há pouco. Espere alguns minutos e tente de novo.":/fetch|network|failed|offline/i.test(m)?"Sem conexão agora. Tente de novo.":"Não deu para mandar o link agora. Tente de novo daqui a pouco."}
  finally{const b2=$("[data-esqueci]");if(b2)b2.disabled=false}}
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const b=t.closest("[data-esqueci]");if(!b)return;e.preventDefault();e.stopPropagation();co160Esqueci()},true);
/* volta do link do e-mail: #access_token=…&type=recovery (ou #error=… quando o link venceu) */
(function co160LeRecuperacao(){try{const h=location.hash||"";if(!/^#/.test(h)||!/(access_token|error_code|error_description)=/.test(h))return;const q=new URLSearchParams(h.slice(1));
  const tipo=q.get("type")||"",at=q.get("access_token"),rt=q.get("refresh_token"),err=q.get("error_code")||q.get("error");
  if(tipo!=="recovery"&&!err)return;
  history.replaceState(history.state,"",location.pathname+location.search);
  CO160.rec=err?{erro:err,desc:q.get("error_description")||""}:{at,rt}}catch(e){}})();
function co160SenhaNova(){sheet("Criar uma senha nova",`<form id="co160sf" class="lform" novalidate><p class="hint" style="margin:0">Escolha a senha que você vai usar para entrar no Prumo${S.email?` com <b>${esc(S.email)}</b>`:""}.</p>
  <label>Senha nova<input class="field" id="co160s1" type="password" autocomplete="new-password" placeholder="Mínimo de 6 caracteres"></label>
  <label>Repita a senha<input class="field" id="co160s2" type="password" autocomplete="new-password"></label>
  <p class="erro-t" id="co160serr" role="alert" hidden></p><button class="btn" type="submit">Salvar a senha nova</button></form>`);
  $("#co160sf").addEventListener("submit",async e=>{e.preventDefault();const a=$("#co160s1").value,c=$("#co160s2").value,b=e.target.querySelector("[type=submit]");
    if(a.length<6)return mostraErro("#co160serr","A senha precisa ter pelo menos 6 caracteres.");if(a!==c)return mostraErro("#co160serr","As duas senhas não são iguais.");
    const sb=sbCliente();if(!sb)return mostraErro("#co160serr","Não deu agora. Tente de novo.");b.disabled=true;
    try{const r=await sb.auth.updateUser({password:a});if(r&&r.error)throw r.error;closeLayer();toast("Senha nova salva. Você já está dentro do Prumo.");try{uso("senha_nova")}catch(_){}}
    catch(err){b.disabled=false;const m=String(err&&(err.message||err.code)||"");mostraErro("#co160serr",/different|same/i.test(m)?"Essa já é a sua senha. Escolha outra ou só feche.":/session|jwt|expired|auth/i.test(m)?"O link venceu. Peça outro em Entrar › Esqueci a senha.":erroAuth(err))}})}
async function co160Recupera(n){const R=CO160.rec;if(!R)return;
  if(R.erro){if(n<40&&(!INIT_FIM||!FEED)){setTimeout(()=>co160Recupera(n+1),250);return}CO160.rec=null;
    sheet("O link não vale mais",`<p style="margin:0;font-size:15px;line-height:1.5">O link para criar uma senha nova venceu ou já foi usado. Peça outro: em Entrar, escreva o seu e-mail e toque em “Esqueci a senha”.</p><button type="button" class="btn" data-entrar>Entrar</button>`);return}
  if(!window.supabase){if(n<80){setTimeout(()=>co160Recupera(n+1),250);return}}
  const sb=sbCliente();if(!sb){CO160.rec=null;return}
  if(!R.feito){R.feito=1;try{const r=await sb.auth.setSession({access_token:R.at,refresh_token:R.rt});if(r&&r.error)throw r.error;await trocarSessao(r.data&&(r.data.user||r.data.session&&r.data.session.user))}catch(e){CO160.rec={erro:"sessao"};co160Recupera(0);return}}
  if(n<40&&(!INIT_FIM||!S.uid)){setTimeout(()=>co160Recupera(n+1),250);return}
  CO160.rec=null;if($("#layer").innerHTML)closeLayer();co160SenhaNova()}
if(CO160.rec)setTimeout(()=>co160Recupera(0),0);

/* ---------- 4. a folha de entrar diz por que apareceu ---------- */
PC106_TX.repostar="Para repostar, entre na sua conta.";
PC106_TX.conversar="Para conversar com os amigos, entre na sua conta.";
PC106_TX.votar="Para votar, entre na sua conta.";
window.addEventListener("pointerdown",e=>{CO160.el=e.target;CO160.t=Date.now()},true);
window.addEventListener("click",e=>{CO160.el=e.target;CO160.t=Date.now()},true);
function co160Motivo(){const el=CO160.el;if(!el||!el.closest||Date.now()-CO160.t>1500)return "";
  if(el.closest("[data-entrar],[data-laba],#avisoconta,.co160-semconta,[data-pfl],[data-sair]"))return "";
  const b=el.closest("button,[role=button],a,textarea,input");if(!b)return "";const a=((b.getAttribute("aria-label")||"")+" "+(b.dataset.a||"")+" "+b.textContent).toLowerCase();
  if(b.matches("[data-vnrp],[data-a=repost],[data-a=rp]")||/repost/.test(a))return PC106_TX.repostar;
  if(b.matches("[data-a=like]")||/curti|gostei|like/.test(a))return PC106_TX.curtir;
  if(b.matches("[data-a=save]")||/guardar|salvar/.test(a))return PC106_TX.guardar;
  if(/coment|respond/.test(a))return PC106_TX.comentar;
  if(b.matches("[data-voto]")||/vot/.test(a))return PC106_TX.votar;
  if(/mensag|convers/.test(a))return PC106_TX.conversar;
  if(/envia|mandar/.test(a))return PC106_TX.enviar;
  return "Para curtir, comentar e conversar com os amigos, entre na sua conta."}
{const _al160=abrirLogin;abrirLogin=function(aba,cod){const mot=co160Motivo(),postLink=PC106&&PC106.k==="post_link"&&Date.now()-PC106.t<400,pid=postLink?(typeof VP99_LINK!=="undefined"&&VP99_LINK):null;
  const r=_al160.apply(this,arguments);
  try{const body=$("#layer .sheet .sh-b")||$("#layer2 .sheet .sh-b");if(body){
    if(mot&&!body.querySelector(".pc106"))body.insertAdjacentHTML("afterbegin",`<p class="pc106">${esc(mot)}</p>`);
    if(postLink&&pid&&!body.querySelector(".co160-pp")){const pc=body.querySelector(".pc106");(pc||body.firstElementChild).insertAdjacentHTML("afterend",`<div class="co160-pp" aria-live="polite"><span>Procurando o post…</span></div>`);co160PostPrevia(pid)}
    const cria=$("#lcod");
    if(cria){const c=co160LimpaCod(cria.value);
      if(c&&!body.querySelector(".co160-bv,.pc106"))body.insertAdjacentHTML("afterbegin",`<div class="co160-bv"><b>Você recebeu um convite para o Prumo</b><p>As notícias do dia de Política e Economia em resumos curtos e neutros, sempre atualizados, e um lugar para comentar e conversar com os amigos.</p></div>`);
      if(c&&body.querySelector(".co160-bv")){const h=$("#lform > p.hint");if(h)h.hidden=true}
      cria.closest("label").insertAdjacentHTML("afterend",`<p class="co160-cvst" id="co160cvst" role="status" hidden></p>`);
      cria.addEventListener("change",co160ConfereCampo);cria.addEventListener("blur",co160ConfereCampo);if(c)co160ConfereCampo()}}}catch(e){}
  return r}}

/* ---------- 5. Conversas, Guardadas e Perfil sem conta ---------- */
const CO160_COMO="O Prumo é por convite: peça o link a um amigo que já usa o Prumo (em Perfil › Convidar amigo). Enquanto isso, dá para ler tudo sem conta.";
{const _rs160=renderSaved;renderSaved=function(){const r=_rs160.apply(this,arguments);try{const v=$("#v-saved .empty");if(!v||v.querySelector(".co160-semconta"))return r;
  if(!S.uid||!S.membro){if(/Nada guardado/.test(v.textContent))v.innerHTML=`<b>Guardar notícias precisa de conta</b>Com a conta, o botão “Guardar” de cada notícia põe ela aqui para ler depois, em qualquer aparelho.<p class="co160-como">${esc(CO160_COMO)}</p><div class="lbtns co160-semconta"><button type="button" class="btn" data-entrar>Entrar</button><button type="button" class="btn ghost" data-entrar="criar">Criar conta com convite</button></div>`}
  else v.innerHTML=v.innerHTML.replace("Toque no alfinete de um post para guardar a notícia aqui.","Toque em “Guardar” numa notícia para ela aparecer aqui.")}catch(e){}return r}}

/* ---------- 7. Conversas ---------- */
/* campo de mensagem que cresce (até 5 linhas); Enter manda, como antes */
function co160Ajusta(t){if(!t||t.tagName!=="TEXTAREA")return;t.style.height="auto";const h=Math.min(t.scrollHeight+2,132);t.style.height=h+"px";t.style.overflowY=t.scrollHeight+2>132?"auto":"hidden";
  document.documentElement.style.setProperty("--co160-comp",Math.max(0,h-44)+"px")}
function co160Campo(){const t=$("#mtext");if(t)co160Ajusta(t)}
document.addEventListener("input",e=>{const t=e.target;if(!t||t.id!=="mtext"||t.tagName!=="TEXTAREA")return;if(/\n/.test(t.value)){const p=t.selectionStart;t.value=t.value.replace(/\r?\n/g," ");try{t.setSelectionRange(p,p)}catch(_){}}co160Ajusta(t)});
document.addEventListener("keydown",e=>{const t=e.target;if(!t||t.id!=="mtext"||t.tagName!=="TEXTAREA"||e.key!=="Enter"||e.shiftKey||e.isComposing)return;e.preventDefault();const f=t.form,b=f&&f.querySelector("[type=submit]");if(f&&b&&!b.disabled){if(f.requestSubmit)f.requestSubmit(b);else b.click()}});
document.addEventListener("submit",e=>{if(e.target&&e.target.id==="mform")setTimeout(co160Campo,0)});
/* caminhos para quem ainda não é amigo */
const co160Novos=()=>`<div class="co160-novos"><p>Quer falar com alguém que ainda não é seu amigo no Prumo?</p><div class="lbtns"><button type="button" class="btn ghost" data-addamigos>Adicionar amigos</button><button type="button" class="btn ghost" data-convidar>Convidar alguém</button></div></div>`;
function co160SemNome(){const v=$("#v-msgs");if(!v)return;const nada=v.querySelector(".dm-in .empty, .dm-in .dm-nada");if(!nada||!/Ninguém com esse nome/.test(nada.textContent)||v.querySelector(".dm-in .co160-novos"))return;
  const alvo=nada.classList.contains("dm-nada")?nada.closest("ul"):nada;alvo.insertAdjacentHTML("afterend",co160Novos())}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="dmq")setTimeout(co160SemNome,0)});
/* opções da conversa: ver perfil em cima; desfazer, bloquear e denunciar embaixo, com rótulos curtos (abrirThMenu no 203) */
const co160Admin=u=>((S.membros[u]||{}).papel==="admin");
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-co160pf]");if(!b)return;e.preventDefault();e.stopPropagation();const u=b.dataset.co160pf;closeLayer();setTimeout(()=>{try{abrirPerfil(u)}catch(_){}},60)},true);
/* a folha "…" do perfil de um amigo (104): mesmos rótulos curtos e sem denunciar o administrador */

/* ---------- 8. Perfil ---------- */
function co160Pf(root,u){if(!root||!u)return;
  if(u===S.uid){const bts=root.querySelector(".vn-pf .pf-bts, .pf-bts");if(!bts)return;bts.classList.add("co160-bts");
    const vz=root.querySelector(".pf-corpo .pf-vz [data-criarde=post], .pf-vz [data-criarde=post]"),np=bts.querySelector("[data-criarde=post]");if(np)np.hidden=!!vz;return}
  const num=root.querySelector(".vn-pf-num");if(!num)return;
  const cs=num.querySelector(".cs123-num");if(cs){const bs=[...cs.querySelectorAll("b")].map(b=>b.textContent.trim());cs.hidden=bs.length>0&&bs.every(x=>x==="0")}
  if(S.amigos.has(u)&&!num.querySelector(".co160-am"))num.insertAdjacentHTML("afterbegin",`<button type="button" class="co160-am" data-fd104pm="${esc(u)}" aria-label="Vocês são amigos. Opções da amizade">Amigos ✓</button>`);
  if(!S.amigos.has(u))num.querySelector(".co160-am")?.remove()}
if(typeof pfvDesenha==="function"){const _pv160=pfvDesenha;pfvDesenha=function(){const r=_pv160.apply(this,arguments);try{if(typeof PFV!=="undefined"&&PFV&&PFV.u)co160Pf($("#layer .pfv"),PFV.u)}catch(e){}return r}}

/* ---------- 9. Melhores amigos, nome, Salvos ---------- */
{const _md160=ra114MaDesenha;ra114MaDesenha=function(){const r=_md160.apply(this,arguments);try{const box=$("#ra114ma");if(box&&box.querySelector("[data-ra114ma]")&&!$("#layer .co160-madica"))box.insertAdjacentHTML("beforebegin",`<p class="co160-madica">Toque em quem você quer pôr na lista. Toque de novo para tirar.</p>`)}catch(e){}return r}}
{const _an160=abrirNome;abrirNome=function(){const r=_an160.apply(this,arguments);try{const f=$("#nform"),i=$("#ntext"),b=f&&f.querySelector("[type=submit]");if(!f||!i)return r;
  const h=$("#layer .sheet .sh-b .hint");if(h)h.textContent=h.textContent.replace('no "gostei"',"nas curtidas");
  f.insertAdjacentHTML("afterend",`<p class="erro-t co160-nerr" id="co160nerr" role="alert" hidden></p>`);
  const vale=()=>{const ok=!!i.value.trim();if(b)b.disabled=!ok;if(ok){const e=$("#co160nerr");if(e)e.hidden=true}};i.addEventListener("input",vale);vale();
  f.addEventListener("submit",e=>{if(!i.value.trim()){e.preventDefault();e.stopImmediatePropagation();mostraErro("#co160nerr","Escreva seu nome.");try{i.focus()}catch(_){}}},true)}catch(e){}return r}}
{const _pt160=pfTiles;pfTiles=function(l,aba){let h=_pt160.apply(this,arguments);try{if(aba==="salvos"&&typeof h==="string")h=h.replace("<b>Salvos</b><span>Toque no marcador de um post para guardar aqui. Só você vê o que salvou.</span>","<b>Posts salvos</b><span>Toque no marcador (Salvar) de um post para ele aparecer aqui. As notícias que você guarda pelo botão “Guardar” ficam em “Notícias guardadas”, logo acima. Só você vê o que salvou.</span>")}catch(e){}return h}}

/* ---------- 6. guia da primeira visita: antes das notícias, não por cima delas ---------- */
(function co160GuiaCedo(){try{if(typeof abrirTour!=="function"||typeof sr150TelasVisitante!=="function")return;
  if(navigator.webdriver&&localStorage.getItem("prumo-teste-tourvis")!=="1")return;if(localStorage.getItem("prumo-tour-visto"))return;
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||"";if(/^prumo-auth|^sb-/.test(k))return}
  if(CO160.rec||CONVITE_URL||LINK_PID||(typeof VP99_LINK!=="undefined"&&VP99_LINK)||/^#(p|m)=/.test(location.hash)||/\/(m|c)\//.test(location.pathname))return}catch(e){return}
  const abre=()=>{try{if($("#layer").innerHTML||S.uid)return;const _tt=tourTelas;tourTelas=()=>sr150TelasVisitante(_tt);try{abrirTour("")}finally{tourTelas=_tt}}catch(e){}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",abre,{once:true});else abre()})();
/* quem chegou para criar a senha nova não vê o guia por cima */
{const _at160=abrirTour;abrirTour=function(){if(CO160.rec)return;return _at160.apply(this,arguments)}}

/* ---------- 10. folha aberta: barra de baixo escondida ---------- */
function co160Folha(){try{const l=$("#layer"),l2=$("#layer2");document.body.classList.toggle("co160-folha",!!((l&&l.querySelector(".sheet"))||(l2&&l2.querySelector(".sheet"))))}catch(e){}}
try{const mo=new MutationObserver(co160Folha);["#layer","#layer2"].forEach(s=>{const el=$(s);if(el)mo.observe(el,{childList:true})});co160Folha()}catch(e){}
