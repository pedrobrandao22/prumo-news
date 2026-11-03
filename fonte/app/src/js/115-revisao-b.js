/* ---------- 115: revisão B (Feed, Giro e criação) com o cartão A e a fase 2 ligados ----------
   Correções pequenas, cada uma embrulhando o que já existe (nomes com o prefixo rb115):
   B02 a notícia citada por um amigo (repost, citação ou notícia anexada) não vai para uma prateleira: ela já aparece no Feed pelo post.
   B03 "Contexto do Prumo" uma vez só por notícia no Feed, e nunca logo abaixo do próprio cartão da notícia.
   B08 no story com cartão de texto, a figurinha nova entra abaixo do texto (e não em cima do título). */

/* ===== B02 ===== */
function rb115Citadas(out){const s=new Set();(out||[]).forEach(p=>{const x=p&&p.__pub;if(!x)return;if(x.pid)s.add(String(x.pid));
  try{const r=typeof vn112Rp==="function"?vn112Rp(x):null;if(r&&r.k==="pauta")s.add(r.id)}catch(e){}});return s}
if(typeof VN_FASE2!=="undefined"&&VN_FASE2&&typeof f113Prat==="function"){
  const _pr115=f113Prat;f113Prat=function(out){let add=[];try{add=[...rb115Citadas(out)].filter(id=>!F113_SOLTA.has(id));add.forEach(id=>F113_SOLTA.add(id))}catch(e){}
    try{return _pr115.apply(this,arguments)}finally{add.forEach(id=>F113_SOLTA.delete(id))}}}

/* ===== B03 ===== */
function rb115CtxFeed(){const box=document.getElementById("posts");if(!box)return;const vistos=new Set();
  box.querySelectorAll(".fs2-ctx").forEach(c=>{const id=c.dataset.f113ctx,post=c.closest(".post");if(!id||!post)return;
    let ant=post.previousElementSibling;while(ant&&!ant.matches(".post,.fs2-sh"))ant=ant.previousElementSibling;
    if(vistos.has(id)||(ant&&ant.id==="p-"+id))c.remove();else vistos.add(id)})}
if(typeof VN_FASE2!=="undefined"&&VN_FASE2){
  {const _rp115=renderPosts;renderPosts=function(){const r=_rp115.apply(this,arguments);try{rb115CtxFeed()}catch(e){}return r}}
  {const _cm115=carregarMais;carregarMais=function(){const r=_cm115.apply(this,arguments);try{rb115CtxFeed()}catch(e){}return r}}
}

/* ===== B08 ===== */
const RB115_Y_CARTAO=.74;
function rb115NoCartao(){try{return !!(ED&&ED.modo==="story"&&ED.st&&ED.st.bg&&ED.st.bg.fc105)}catch(e){return false}}
if(typeof fg2Novo==="function"){const _fn115=fg2Novo;fg2Novo=function(){const e=_fn115.apply(this,arguments);try{if(e&&typeof e==="object"&&rb115NoCartao())e.y=RB115_Y_CARTAO}catch(_){}return e}}
if(typeof edAdd==="function"){const _ea115=edAdd;edAdd=function(e){try{if(e&&typeof e==="object"&&e.y==null&&rb115NoCartao())e={...e,y:RB115_Y_CARTAO}}catch(_){}return _ea115.call(this,e)}}
