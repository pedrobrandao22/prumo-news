/* ---------- 165: revisão do Perfil (16/11 noite). Nomes com o prefixo pf165. ----------
   1. Fileira de botões do Perfil igual em todas as abas: só "Convidar amigo" e "Editar foto" ("Nova publicação" fica no
      aviso de Posts vazio e no "+" do Feed); a aba marcada fica sempre à vista na faixa de abas (iPhone SE).
   2. Engrenagem: "Conta e ajustes" com título, a tela rola até as abas e a parte "Conta" vem primeiro; sai o que repetia
      (Guardados, que já é aba, e o quadro "Seu Prumo nos últimos 7 dias", igual a "Sua semana"/"Histórico de leitura");
      "gostei" vira "curtidas".
   3. Guardados: a notícia mostra a mesma foto e a mesma editoria da Capa e abre a matéria por cima do Perfil (‹ Guardados).
   4. Atividade: a página de uma cobertura abre por cima da Atividade; fechar ou voltar volta para a Atividade.
   5. Adicionar amigos: quem já é amigo aparece como "Vocês já são amigos · Conversar"; sem resultado, nada de repetir a
      instrução do topo.
   6. Conversas: a fileira de círculos só mostra amigos que ainda não estão na lista de conversas, com o título "Amigos".
   7. Entrar/Criar conta: e-mail sem @ diz "Falta o @ no e-mail."; criar conta sem código fala do código do convite. */
var PF165={};
function pf165EmErro(em){em=String(em||"").trim();if(!em)return "Escreva o seu e-mail.";if(em.indexOf("@")<0)return "Falta o @ no e-mail.";
  if(em.charAt(0)==="@")return "Falta o começo do e-mail, antes do @.";if(!/^\S+@\S+\.\S+$/.test(em))return "Confira o e-mail: falta algo depois do @.";return ""}

/* ---------- 1 e 2: fileira, abas e Conta e ajustes ---------- */
function pf165Abas(root){const ab=root&&root.querySelector(".vn-abas");if(!ab)return;const a=ab.querySelector('[aria-selected="true"]');if(!a)return;
  const l=a.offsetLeft,r=l+a.offsetWidth;if(l<ab.scrollLeft)ab.scrollLeft=Math.max(0,l-8);else if(r>ab.scrollLeft+ab.clientWidth)ab.scrollLeft=r-ab.clientWidth+8}
function pf165Conta(){const c=$("#v-me .pf-conta");if(!c||c.dataset.pf165)return;c.dataset.pf165="1";
  const qs=s=>c.querySelector(s),card=s=>{const e=qs(s);return e&&e.closest(".card")};
  const conta=[...c.querySelectorAll(".card.menu")].find(x=>x.querySelector(".cm-h")),ajus=card("[data-ajustes]"),amg=qs(".card.amg"),cs=qs(".cs123-cfg"),
    menu=card("[data-arquivo]")||card("[data-nt124ativ]"),adm=card("[data-admin]"),st=qs(".stats");
  /* o que já está em outro lugar */
  c.querySelectorAll('.card.menu [data-vgo="saved"]').forEach(b=>b.remove());
  [...c.querySelectorAll(".card")].forEach(x=>{const b=x.querySelector(":scope>b");if(b&&/^Seu Prumo nos últimos 7 dias/.test(b.textContent))x.remove()});
  const sem=qs("[data-semana]"),hi=qs("[data-historico]");if(sem&&hi&&sem.parentElement!==hi.parentElement)hi.before(sem);
  if(st)st.querySelectorAll('[data-minha="gostei"] span').forEach(s=>{if(s.textContent.trim()==="gostei")s.textContent="curtidas"});
  /* ordem: Conta, Ajustes, Amigos, Perfil aberto, o resto */
  const pai=(conta||ajus||amg||{}).parentElement;if(pai){const ord=[conta,ajus,amg,cs,menu,st,adm].filter(x=>x&&x.isConnected);
    let ref=pai.firstElementChild;ord.forEach(x=>{if(x!==ref)pai.insertBefore(x,ref);else ref=ref.nextElementSibling;ref=x.nextElementSibling})}
  if(st)st.classList.add("pf165-st");
  if(!c.querySelector(".pf165-h"))c.insertAdjacentHTML("afterbegin",`<h2 class="pf165-h">Conta e ajustes</h2>`)}
function pf165Guardados(){document.querySelectorAll("#v-me .gd161-nl [data-open]").forEach(b=>{if(b.dataset.pf165)return;b.dataset.pf165="1";const p=pautaById(b.dataset.open);if(!p)return;
  try{const t=b.querySelector(".svt");if(t&&fotoDe(p)){const d=document.createElement("div");d.innerHTML=capaArte(p,"svt",false);const n=d.firstElementChild;if(n)t.replaceWith(n)}}catch(e){}
  try{const s=b.querySelector(".svx>span"),ch=capaChapeu(p);if(s&&ch){const i=s.textContent.indexOf(" · ");if(i>0)s.textContent=ch+s.textContent.slice(i)}}catch(e){}})}
if(typeof vn112PfAba==="function"){const _pa165=vn112PfAba;vn112PfAba=function(k,camada){const r=_pa165.apply(this,arguments);
  try{if(!camada&&k==="conta"){const ab=$("#v-me .vn-abas");if(ab){const y=ab.getBoundingClientRect().top+scrollY-6;scrollTo(0,Math.max(0,y))}}}catch(e){}return r}}

/* ---------- 3. Guardados: abre a matéria por cima do Perfil ---------- */
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("#v-me .gd161-nl [data-open]");if(!b)return;const pid=b.dataset.open;if(!pautaById(pid))return;
  e.preventDefault();e.stopPropagation();abrirMateria(pid);try{const v=$("#layer .mat-v");if(v){v.textContent="‹ Guardados";v.setAttribute("aria-label","Voltar para Guardados")}}catch(_){}},true);

/* ---------- 4. Atividade: cobertura por cima, fechar volta para a Atividade ---------- */
/* "Ler a notícia" na cobertura aberta por cima da Atividade: fecha as duas e abre a matéria */
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("#layer2 [data-cobler]");if(!b||!$("#layer .pfv-at"))return;e.preventDefault();e.stopPropagation();
  const id=b.dataset.cobler;closeLayer();closeLayer();setTimeout(()=>{try{if(pautaById(id))abrirMateria(id);else openSnap(id)}catch(_){}},80)},true);

/* ---------- 5. Adicionar amigos ---------- */
function pf165Amg(){const bx=$("#pbox");if(!bx||!$("#pform #pbusca"))return;const q=String(($("#pq")||{}).value||"").trim();
  const em=bx.querySelector(".bu154-amg span");if(em&&q){em.textContent=`Toque em “Procurar” para buscar “${q}” entre todas as pessoas do Prumo (pelo nome completo).`}
  const h=bx.querySelector("p.hint.bu154-amgh");if(h&&!h.dataset.pf165&&/^Ninguém no Prumo/.test(h.textContent)){h.dataset.pf165="1";
    h.innerHTML=`Ninguém no Prumo com o nome exato “${esc(q)}”. Confira a grafia ou convide a pessoa. <button type="button" class="btn ghost bu154-conv" data-convidar>Convidar alguém</button>`}
  let ja=bx.querySelector(".pf165-ja");const ts=norm(q).trim().split(/\s+/).filter(Boolean);
  const l=q.length<2?[]:amigosL().filter(u=>{const n=norm(nomeDe(u));return ts.every(t=>n.indexOf(t)>=0)});
  if(!l.length){if(ja)ja.remove();return}
  const html=`<p class="pf165-jah">${l.length===1?"Já é seu amigo":"Já são seus amigos"}</p><ul class="amgl">${l.map(u=>`<li>${avatar(u)}<span class="amg-n"><b>${esc(nomeDe(u))}</b><span>Vocês já são amigos</span></span><button type="button" class="btn ghost amg-b" data-pf165conv="${esc(u)}">Conversar</button></li>`).join("")}</ul>`;
  if(!ja){bx.insertAdjacentHTML("afterbegin",`<div class="pf165-ja"></div>`);ja=bx.querySelector(".pf165-ja")}if(ja.innerHTML!==html)ja.innerHTML=html;
  /* com o amigo na tela, "nenhuma sugestão" e "ninguém com esse nome" não fazem sentido */
  bx.querySelectorAll(".empty,p.hint").forEach(x=>{if(/Nenhuma sugestão|Ninguém no Prumo/.test(x.textContent))x.remove()})}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="pq")setTimeout(pf165Amg,0)});
if(typeof procurarNome==="function"){const _pn165=procurarNome;procurarNome=async function(){const r=await _pn165.apply(this,arguments);try{pf165Amg()}catch(e){}return r}}
if(typeof abrirAddAmigos==="function"){const _ad165=abrirAddAmigos;abrirAddAmigos=function(){const r=_ad165.apply(this,arguments);try{const re=S._reAmg;if(typeof re==="function")S._reAmg=function(){const x=re.apply(this,arguments);try{pf165Amg()}catch(e){}return x}}catch(e){}return r}}
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-pf165conv]");if(!b)return;e.preventDefault();e.stopPropagation();const u=b.dataset.pf165conv;
  closeLayer();setTimeout(()=>{try{go("msgs");abrirConversa(u)}catch(_){}},80)},true);


/* ---------- 7. Entrar e criar conta: avisos na ordem da tela ---------- */
{const _ec165=entrarConta;entrarConta=function(){try{const em=($("#lemail")||{}).value||"",pw=($("#lsenha")||{}).value||"";if(em.trim()&&pw){const m=pf165EmErro(em);if(m)return mostraErro("#lerro",m)}}catch(e){}return _ec165.apply(this,arguments)}}
{const _cc165=criarConta;criarConta=function(){try{const v=s=>String(($(s)||{}).value||""),cod=v("#lcod").trim(),nome=v("#lnome").trim(),em=v("#lemail"),pw=v("#lsenha");
  if(!cod&&(!nome||pf165EmErro(em)||pw.length<6))return mostraErro("#lerro","Falta o código do convite. Não tem? Peça o link a um amigo que já usa o Prumo.");
  if(nome){const m=pf165EmErro(em);if(m)return mostraErro("#lerro",m)}}catch(e){}return _cc165.apply(this,arguments)}}
