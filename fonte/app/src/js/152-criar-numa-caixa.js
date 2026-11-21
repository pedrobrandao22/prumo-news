/* ---------- 152: criar numa caixa só (14/11) ----------
   Pedido do Pedro: "muitas telas diferentes para criar um novo post". Antes o "+" abria cartões de tipo (Comentar notícia,
   De perto, Análise, Pergunta, Coluna, Só texto, fotos, Minhas colunas) e cada formulário repetia a escolha do tipo em abas.
   Agora o "+" abre uma tela só:
   - no alto, Post · Giro · Coluna;
   - Post: uma caixa "Escreva…" e, embaixo, o que dá para juntar: Foto, Notícia, Enquete, Número, De perto. Só texto publica
     dali mesmo; juntar algo abre o formulário daquele tipo já com o texto escrito (sem as abas de tipo repetidas), e
     "voltar" traz de volta para a caixa com o texto;
   - Coluna: continuar um rascunho (os mais recentes) ou começar uma nova; a lista completa ("Minhas colunas") foi para o Perfil.
   Nomes com o prefixo cp152. */
var CP152={aba:"post",txt:"",pub:"amigos",veio:false};
const CP152_IC={foto:CN102_ICO.foto,nt:CN102_ICO.nt,enq:CN102_ICO.enq,ana:CN102_ICO.ind,rel:CN102_ICO.rel};
const CP152_ANEXOS=[["foto","Foto"],["nt","Notícia"],["enq","Enquete"],["ana","Número"],["rel","De perto"]];
function cp152Rascs(){let l=[];try{l=ed132RascLe()}catch(e){}return l}
function cp152ColHTML(){const rs=cp152Rascs();
  return `<div class="cp152-col">
    ${rs.length?`<p class="cp152-h">Continuar escrevendo</p><ul class="cp152-rl">${rs.slice(0,3).map(r=>`<li><button type="button" class="cp152-r" data-cp152rasc="${esc(r.rid)}">${CN102_SVG('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>')}<span><b>${esc(String(r.tit||"").trim()||"Sem título")}</b><small>${esc(quando(r.at))} · ${(+r.pal||0).toLocaleString("pt-BR")} ${+r.pal===1?"palavra":"palavras"}</small></span><i aria-hidden="true">›</i></button></li>`).join("")}</ul>`:""}
    <button type="button" class="btn cp152-nova" data-cp152nova>${CN102_SVG(CN102_ICO.mais)}Nova coluna</button>
    <p class="cp152-dica">Coluna é um texto longo, com título, como um artigo. O que você escreve fica guardado sozinho.${rs.length>3?" Os outros rascunhos estão no seu Perfil, em Minhas colunas.":" Rascunhos, agendadas e publicadas ficam no seu Perfil, em Minhas colunas."}</p></div>`}
/* posts que ficaram nos rascunhos (sem rede, ou "salvar rascunho") */
async function cp152RascPosts(){try{const l=await rascLista();const box=$("#cp152-rascs");if(!box||!l.length)return;box.innerHTML=`<button type="button" class="cp152-rp" data-cp152rascp>${CN102_SVG('<path d="M6 4h9l3 3v13H6z"/><path d="M9 11h6M9 15h4"/>')}<span>Rascunhos de post <b>${l.length}</b></span><i aria-hidden="true">›</i></button>`}catch(e){}}
/* abre o editor de post por baixo (como o "Só texto" fazia) */
function cp152Editor(){if($("#layer").innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}CN102_SEMGAL=1;CP152.interno=1;try{criarAbrir("post")}finally{CN102_SEMGAL=0;CP152.interno=0}return typeof ED!=="undefined"&&ED&&ED.modo==="post"?ED:null}
/* o texto do formulário volta para a caixa */

/* entradas: o "+" e "Nova publicação" abrem a caixa */
{const _cm152=criarMenu;criarMenu=function(){if(precisaConta())return;cp152Abre()}}
/* "Nova publicação" (Perfil) e outros botões data-criarde="post"; criarAbrir("post") chamado pelo código (rascunhos, testes) continua abrindo o editor */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-criarde="post"]');if(!b)return;e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();
  if($("#layer").innerHTML&&!$("#layer > .cp152")){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}setTimeout(()=>cp152Abre(),40)},true);

window.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  /* no editor de giro, "POST" volta para a caixa */
  const md=t.closest("#layer [data-edmodo='post'],#layer [data-crtipo='post']");if(md&&!$("#layer > .cp152")){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();if(typeof ED!=="undefined"&&ED&&ED.env)return;
    ED=null;cp152Abre();return}
  /* voltar de um formulário aberto pela caixa: volta para a caixa, com o texto */
  const vt=t.closest("#layer [data-edvolta]");if(vt&&CP152.veio&&typeof ED!=="undefined"&&ED&&ED.po&&(ED.po.cn||ED.po.passo==="detalhes")&&!ED.env){
    e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();CP152.txt=cp152TextoDe(ED);CP152.veio=false;ED=null;cp152Abre({manter:true,aba:"post"});return}
},true);
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  if(!t.closest("#layer > .cp152"))return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(t.closest("[data-cp152x]")){pare();cp152Fecha();return}
  if(b=t.closest("[data-cp152aba]")){pare();const a=b.dataset.cp152aba;if(a==="giro"){const tx=CP152.txt;ED=null;CP152.txt=tx;if($("#layer").innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}criarAbrir("story");return}
    CP152.aba=a;cp152Desenha();return}
  if(t.closest("[data-cp152pub]")){pare();cp152Publica();return}
  if(b=t.closest("[data-cp152ax]")){pare();cp152Anexo(b.dataset.cp152ax);return}
  if(t.closest("[data-cp152rascp]")){pare();const E=cp152Editor();if(E)setTimeout(()=>{try{rascPainel()}catch(e){}},60);return}
  if(t.closest("[data-cp152nova]")){pare();ed132Abre(ed132Novo());return}
  if(b=t.closest("[data-cp152rasc]")){pare();const d=cp152Rascs().find(r=>r.rid===b.dataset.cp152rasc);if(d)ed132Abre(ed132DoRasc(d));return}
},true);
/* fechar pelo "voltar" do celular */

/* ===== formulários abertos pela caixa: sem a faixa de tipos repetida ===== */

/* ===== Perfil: "Minhas colunas" ao lado de "Nova publicação" ===== */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-cp152cols]");if(!b)return;e.preventDefault();e.stopPropagation();ed132Hub()},true);

/* ===== depois de publicar, o post aparece na tela (14/11, testador: "Já está no Feed", mas ficava abaixo da notícia em destaque) ===== */
function cp152Mostra(id){let n=0;const tenta=()=>{const el=document.getElementById("p-u:"+id);if(el&&el.getClientRects().length){try{const top=el.getBoundingClientRect().top+scrollY-((document.querySelector(".top")||{}).offsetHeight||56)-28;/* 20/11 (testador): o nome do autor ficava cortado na borda */scrollTo({top:Math.max(0,top),behavior:"smooth"});el.classList.add("cp152-novo");setTimeout(()=>el.classList.remove("cp152-novo"),2200)}catch(e){}return}
  if(++n<12)setTimeout(tenta,250)};setTimeout(tenta,300)}

/* trechos citados (Atividade, conversas): corta na palavra e põe "…" (14/11, testador: "a estimativa do Executivo ” há 1 d") */
function cp152Corta(s,n){s=String(s==null?"":s).replace(/\s+/g," ").trim();if(s.length<=n)return s;const c=s.slice(0,n-1),i=c.lastIndexOf(" ");return (i>n*.6?c.slice(0,i):c).replace(/[\s,;:.\-–—]+$/,"")+"…"}
