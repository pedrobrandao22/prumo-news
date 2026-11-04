/* ---------- 121: Testes B (amigos, posts, Giro e conversas, 03/11) ----------
   Correções achadas usando o app como quatro pessoas (Pedro, Bia, Carla e Dani) por vários "dias", no estado de produção
   (foco, visual novo com o cartão A, sem reels e fase 2). Detalhes e passos em qa/TESTES-B.md. Nada de SQL novo; nomes com o prefixo tb121.
   TB01 Atividade: voto na enquete do giro ou na Pergunta aparecia como "respondeu ao seu giro/post" (parecia a resposta repetida).
   TB02 Atividade: depois de bloquear alguém, as curtidas, comentários e menções dessa pessoa continuavam lá (e acendiam a bolinha).
   TB03 Cartão A em 360px: "Comentar" e "Repostar" cortados ("Come…", "Repo… 1") nos posts desenhados fora da tela.
   TB04 Conversas: "story" na lista e na conversa (curtiu, respondeu, mencionou, o rótulo do cartão), quando o resto do app diz "giro".
   TB05 Análise no cartão A: "Fonte: …" solta depois das ações; agora fica dentro do cartão da análise.
   TB07 Repost de um post seu que você arquivou: dizia "Publicação indisponível… de alguém que não está entre os seus amigos".
   TB09 Repost/citação de um fio: o cartão citado mostra "Fio · N partes" (antes parecia um post de uma frase só).
   TB10 Citação de uma citação: o cartão citado diz de quem era a publicação de dentro ("citando Bia Souza"). */

/* ===== TB01 + TB02: Atividade ===== */
function tb121Bloq(u){try{return Array.isArray(S.bloq)&&S.bloq.includes(u)}catch(e){return false}}
const TB121_VERBO=[[/\bcurtiram\b/,"curtiu"],[/\bcomentaram\b/,"comentou"],[/\bresponderam\b/,"respondeu"],[/\bvotaram\b/,"votou"],[/\brepostaram\b/,"repostou"]];
function tb121SemBloq(it){if(!Array.isArray(it)||!(S.bloq||[]).length)return it;const out=[];
  it.forEach(x=>{if(!x||typeof x!=="object"){out.push(x);return}
    if(x.msg&&tb121Bloq(x.msg.de))return;const us=Array.isArray(x.us)?x.us:[];const fica=us.filter(u=>!tb121Bloq(u));
    if(us.length&&!fica.length)return;
    if(fica.length!==us.length&&typeof x.txt==="string"){const y={...x,us:fica};y.txt=x.txt.replace(/^<b>[^<]*<\/b>/,`<b>${esc(atJunta(fica))}</b>`);if(fica.length===1)TB121_VERBO.forEach(([r,v])=>{y.txt=y.txt.replace(r,v)});out.push(y);return}
    out.push(x)});return out}
/* o que é votado em cada publicação: enquete do giro (figurinhas) ou a Pergunta (post) */
function tb121Voto(x){if(!x||typeof x!=="object"||typeof x.k!=="string"||x.k.indexOf("voto:")!==0||typeof x.txt!=="string")return x;
  const pb=(AT.pubs||{})[x.pub]||(typeof pubDe==="function"&&pubDe(x.pub));if(!pb)return x;const n=(x.us||[]).length,v=n>1?"votaram":"votou";
  const nm=x.txt.match(/^<b>[^<]*<\/b>/);if(!nm)return x;
  if(pb.tipo==="story"){const its=((pb.estilo||{}).itens||[]).filter(i=>i&&["enq","quiz","slid","perg","cont"].includes(i.t));
    if(!its.length||!its.every(i=>i.t==="enq"))return x;return {...x,ic:"☑",txt:`${nm[0]} ${v} na enquete do seu story`}}
  const cn=typeof cn102De==="function"?cn102De(pb):null;if(!cn||cn.k!=="enq")return x;
  return {...x,ic:"☑",txt:`${nm[0]} ${v} na sua pergunta${cn.tit?` “${esc(String(cn.tit).slice(0,70))}”`:""}`}}
{const _ai121=atItens;atItens=function(){let it=_ai121.apply(this,arguments);try{if(Array.isArray(it))it=tb121SemBloq(it).map(tb121Voto)}catch(e){}return it}}

/* ===== TB03: ações cortadas nos posts desenhados fora da tela ===== */
/* o .post usa content-visibility:auto; fora da tela os rótulos não têm largura e o 112 não conseguia medir. Mede de novo quando o post aparece. */
if(typeof VN112_CT!=="undefined"&&VN112_CT==="a"&&typeof vn112Aperta==="function"){
  document.addEventListener("contentvisibilityautostatechange",e=>{const p=e.target;if(e.skipped||!p||!p.matches||!p.matches(".post.vn-ca"))return;requestAnimationFrame(()=>{try{vn112Aperta(p,true)}catch(_){}})},true);
  /* reserva: navegador sem esse evento mede quando o post entra na tela */
  if(!("oncontentvisibilityautostatechange" in document.documentElement)&&typeof IntersectionObserver==="function"){
    const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)try{vn112Aperta(en.target,true)}catch(_){}}),{rootMargin:"200px 0px"});
    const vigia=()=>document.querySelectorAll(".post.vn-ca:not([data-tb121io])").forEach(p=>{p.dataset.tb121io="1";io.observe(p)});
    {const _rp=renderPosts;renderPosts=function(){const r=_rp.apply(this,arguments);try{vigia()}catch(e){}return r}}
    {const _cm=carregarMais;carregarMais=function(){const r=_cm.apply(this,arguments);try{vigia()}catch(e){}return r}}}}

/* ===== TB04: "giro" também nas Conversas ===== */
function tb121Giro(s){return String(s).replace(/^(Você curtiu o|Curtiu seu|Você respondeu ao|Respondeu ao seu|Você mencionou no|Mencionou você no) story/,"$1 giro")}
if(typeof VISUAL_NOVO!=="undefined"&&VISUAL_NOVO){
  {const _dp=dmPrevia;dmPrevia=function(){const r=_dp.apply(this,arguments);try{return typeof r==="string"?tb121Giro(r):r}catch(e){return r}}}
  {const _th=dmThreadHTML;dmThreadHTML=function(){const h=_th.apply(this,arguments);if(typeof h!=="string"||h.indexOf("tory")<0)return h;
    try{const tp=document.createElement("template");tp.innerHTML=h;let mudou=false;
      tp.content.querySelectorAll(".dm-lb,.dm-ev,.dm-q>small,.dm-uh>small,.ca100-stl,.dm-q>span").forEach(el=>{
        const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;const l=[];while(n=w.nextNode())l.push(n);
        l.forEach(n=>{const t=n.nodeValue,v=el.matches(".dm-q>span")?t.replace(/^Story$/,"Giro"):tb121GiroTx(t);if(v!==t){n.nodeValue=v;mudou=true}})});
      return mudou?tp.innerHTML:h}catch(e){return h}}}}
/* só o rótulo (antes das aspas com o texto do giro) */
function tb121GiroTx(t){const i=t.indexOf("“"),a=i<0?t:t.slice(0,i),b=i<0?"":t.slice(i);return a.replace(/([Cc]urtiu o|[Cc]urtiu seu|[Rr]espondeu ao seu|[Rr]espondeu ao|no) story\b/g,"$1 giro").replace(/^\s*Story\s*$/,"Giro")+b}

/* ===== TB05: Fonte da análise dentro do cartão (cartão A) ===== */
function tb121Fonte(h,x){if(typeof h!=="string"||h.indexOf("cn102-fonte")<0||!x||x.tipo!=="post")return h;
  const cn=typeof cn102De==="function"?cn102De(x):null;if(!cn||cn.k!=="ana")return h;
  const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a||!a.classList.contains("vn-ca"))return h;
  const fo=[...a.querySelectorAll(".cn102-fonte")].filter(f=>!f.closest(".cn102-cd,.ac117-tx"));const cd=a.querySelector(".car .cn102-cd");if(!fo.length||!cd)return h;
  fo.forEach(f=>{f.classList.add("tb121-fonte");cd.appendChild(f)});return a.outerHTML}
if(typeof VISUAL_NOVO!=="undefined"&&VISUAL_NOVO&&typeof VN112_CT!=="undefined"&&VN112_CT==="a"){
  const _pp121=pubPostHTML;pubPostHTML=function(x){const h=_pp121.apply(this,arguments);try{return tb121Fonte(h,x)}catch(e){return h}}}

/* ===== TB07, TB09, TB10: cartão citado ===== */
function tb121MeuArq(id){try{const x=(typeof pubDe==="function"&&pubDe(id))||(typeof ARQ8!=="undefined"&&ARQ8||[]).find(y=>y.id===id);return !!x&&x.autor===S.uid&&!!x.arquivado}catch(e){return false}}
if(typeof vn112Quote==="function"){const _q121=vn112Quote;vn112Quote=function(rp){let h=_q121.apply(this,arguments);try{
    if(!rp||rp.k!=="pub"||typeof h!=="string")return h;
    if(h.indexOf("vn-q0")>=0&&h.indexOf("data-vnqesp")<0&&tb121MeuArq(rp.id))
      return `<div class="vn-q vn-q0 tb121-arq" role="note"><b>Você arquivou esta publicação</b><span>Só você vê. Para mostrar de novo: Perfil › Conta › Posts arquivados.</span></div>`;
    const x=h.indexOf("data-vnqpub")>=0?vn112Pub(rp.id):null;if(!x)return h;
    /* fio: "Fio · N partes" logo abaixo do nome */
    const f=typeof f113Fio==="function"&&typeof f113PodeFio==="function"&&f113PodeFio(x)?f113Fio(x):null;
    let marca="";if(f&&f.length)marca=`<span class="vn-q-k tb121-fio">Fio · ${f.length+1} partes</span>`;
    /* citação de citação: de quem era a publicação de dentro */
    const r2=vn112Rp(x);if(r2&&r2.k==="pub"&&String(x.texto||"").trim()){const y=vn112Pub(r2.id),quem=y?"citando "+nomeDe(y.autor):"citando uma publicação";
      marca+=`<span class="vn-q-k tb121-cit">${VN112_IC.rp}${esc(quem)}</span>`}
    if(!marca)return h;const tp=document.createElement("template");tp.innerHTML=h;const au=tp.content.querySelector(".vn-q-au");if(!au)return h;
    au.insertAdjacentHTML("afterend",marca);return tp.innerHTML}catch(e){return h}}}
