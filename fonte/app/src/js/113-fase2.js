/* ---------- 113: fase 2 do visual novo (teste, para o Pedro aprovar) ----------
   Uma chave só, VN_FASE2, que só vale com o visual novo ligado e fica DESLIGADA por padrão:
   - ?fase2=1 no endereço liga neste aparelho (?fase2=0 desliga); a escolha fica em localStorage "prumo-fase2" e o parâmetro sai do endereço;
   - nos testes automáticos só liga se o teste guardar "prumo-fase2"="1" (e "prumo-teste-visual", como o 112 já pede).
   Com a chave ligada:
   1. Fio (como no X): o post pode ter de 2 a 5 partes. Sem SQL: as partes 2 a 5 ficam em publicacoes.estilo.fio = [textos];
      o texto do post continua sendo a parte 1 (quem está sem a chave vê só a parte 1). No Feed aparece a parte 1 com
      "Fio · 3 partes" e "Ler o fio", que abre as outras partes ali mesmo; aberta numa camada, a publicação mostra o fio inteiro.
      Hashtags e @ valem em todas as partes; "Editar legenda" edita as partes.
   2. Capítulos na matéria (como no YouTube): "Nesta matéria" no alto, com as seções que a matéria tem; tocar rola até a seção e,
      rolando, o capítulo atual fica marcado. A matéria ganha "Perguntas" quando a pauta traz faq (o mesmo da página da cobertura).
   3. Prateleiras no Feed (como no YouTube): a cada ~6 itens, uma fileira "Mais de Economia" (ou "Por seguir #Copom") com
      notícias que estavam mais abaixo no Feed; elas saem da lista principal (sem repetir). No máximo 3 por carga do Feed.
   4. Contexto do Prumo (como as notas da comunidade do X): sob o post de um amigo que cita uma notícia (anexada, do tipo
      Notícia ou por hashtag da pauta), uma caixa com o resumo neutro da pauta e "Ler a matéria ›". Só campos neutros. */
const VN_FASE2=true; /* fase 2 é o único caminho desde 13/11 */
const F113_MAX=5;
const F113_SVG={mais:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',x:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  info:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/></svg>'};
const f113Reduz=()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}};

/* ===== 1. Fio ===== */
/* as partes 2..5 (limpas: só texto, sem vazias) */
function f113Fio(x){const es=x&&x.tipo==="post"&&x.estilo;const l=es&&Array.isArray(es.fio)?es.fio:null;if(!l)return null;
  const o=l.slice(0,F113_MAX-1).map(t=>typeof t==="string"?t.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").trim().slice(0,2000):"").filter(Boolean);return o.length?o:null}
/* quem pode ter fio: post comum (com ou sem foto) e Opinião/Análise; repost não */
function f113PodeFio(x,cn){if(!x||x.tipo!=="post")return false;if(typeof vn112Rp==="function"&&vn112Rp(x))return false;const c=cn!==undefined?cn:(typeof cn102De==="function"?cn102De(x):null);return !c||c.k==="ana"}
function f113Tudo(x){const f=f113Fio(x);return f?String(x.texto||"")+"\n\n"+f.join("\n\n"):String(x.texto||"")}
function f113FioHTML(x,parts,aberto){const n=parts.length+1,id="fs2f-"+String(x.id).replace(/[^\w-]/g,"");
  return `<div class="fs2-fio${aberto?" on":""}" data-f113fio="${esc(x.id)}"><ol class="fs2-fio-l" id="${id}"${aberto?"":" hidden"} aria-label="Fio de ${esc(nomeDe(x.autor))}, partes 2 a ${n}">${parts.map((t,i)=>`<li><span class="fs2-n" aria-hidden="true">${i+2}/${n}</span><p class="fs2-fio-tx"><span class="ht-cm-tx">${dmMarcaPub(t)}</span></p></li>`).join("")}</ol>
    <div class="fs2-fio-bar"><span class="fs2-fio-k">Fio · ${n} partes</span><button type="button" class="fs2-fio-b" data-f113ver aria-expanded="${!!aberto}" aria-controls="${id}">${aberto?"Recolher":"Ler o fio"}</button></div></div>`}
function f113PoeFio(a,x,parts){const tx=a.querySelector(":scope>.vn-txt")||a.querySelector(".up-leg");const alvo=tx||a.querySelector(":scope>.car");if(!alvo)return;
  a.classList.add("fs2-temfio");if(tx&&!tx.querySelector(".fs2-n1"))tx.insertAdjacentHTML("beforeend",`<span class="fs2-n1" aria-hidden="true"> 1/${parts.length+1}</span>`);
  alvo.insertAdjacentHTML("afterend",f113FioHTML(x,parts,false))}
function f113Abre(box,on){if(!box)return;const l=box.querySelector(".fs2-fio-l"),b=box.querySelector("[data-f113ver]");box.classList.toggle("on",on);if(l)l.hidden=!on;
  if(b){b.setAttribute("aria-expanded",String(on));b.textContent=on?"Recolher":"Ler o fio"}
  /* a parte 1 aparece inteira quando o fio está aberto */
  const a=box.closest(".post"),p1=a&&a.querySelector(":scope>.vn-txt.up-curta");if(on&&p1){p1.classList.remove("up-curta");p1.removeAttribute("data-upmais");p1.removeAttribute("role");p1.removeAttribute("tabindex")}}
function f113AbreTudo(root){if(!root)return;root.querySelectorAll(".fs2-fio:not(.on)").forEach(b=>f113Abre(b,true))}

/* ===== 4. Contexto do Prumo ===== */
/* a frase neutra da pauta: o 1º ponto neutro, ou a linha fina, ou a 1ª frase do texto neutro */
function f113Neutro(p){if(!p)return "";const n=p.neutro||{};const pt=Array.isArray(n.pontos)?n.pontos.find(s=>typeof s==="string"&&s.trim()):"";
  let t=pt||(typeof p.subtitulo==="string"&&p.subtitulo.trim())||"";if(!t&&n.texto)try{t=capaFrase(String(n.texto),170)}catch(e){t=""}return String(t||"").trim()}
/* a pauta que o post cita: a notícia anexada (ou do tipo Notícia) ou a hashtag oficial de uma pauta */
function f113CtxPauta(x){if(!x||x.tipo!=="post"||x.autor===S.uid)return null;if(typeof vn112Rp==="function"&&vn112Rp(x))return null;
  if(x.pid){const p=pautaById(x.pid);return p||null}
  if(typeof htExtrai!=="function")return null;for(const t of htExtrai(f113Tudo(x))){const p=htNoticias(t.k).find(q=>htNotCasa(q,t.k)>=2);if(p)return p}return null}
function f113CtxHTML(p){const tx=f113Neutro(p);if(!tx)return "";const s=secOf(p);
  return `<aside class="fs2-ctx" aria-label="Contexto do Prumo" data-f113ctx="${esc(p.id)}" style="--fs2-c:${secCor(s)}"><p class="fs2-ctx-k">${F113_SVG.info}<span>Contexto do Prumo</span><i>· ${esc(secNome(s))}</i></p><p class="fs2-ctx-t">${esc(tx)}</p><button type="button" class="fs2-ctx-b" data-capmat="${esc(p.id)}">Ler a matéria ›</button></aside>`}
function f113PoeCtx(a,x){const p=f113CtxPauta(x);if(!p)return;
  /* o post já mostra o cartão inteiro da notícia de cara: não repete */
  const sl=a.querySelector(".car .track>.sl:first-child");if(sl&&sl.matches(".up-nt,.cn102-ntsl"))return;if(a.querySelector(".vn-qn"))return;
  const h=f113CtxHTML(p);if(!h)return;const g=a.querySelector(":scope>.gut:not(.ph)");if(g)g.insertAdjacentHTML("beforebegin",h);else a.insertAdjacentHTML("beforeend",h)}

/* ===== 2. Capítulos na matéria ===== */
var F113_IO=null;
const F113_VIS={numeros:"Os números",grafico:"O gráfico",pesquisas:"As pesquisas"};
function f113FaqHTML(p){const fq=(Array.isArray(p.faq)?p.faq:[]).filter(q=>q&&typeof q.p==="string"&&q.p.trim()).slice(0,6);if(!fq.length)return "";
  return `<div class="fs2-faq"><b>Perguntas</b>${fq.map(q=>`<details><summary>${esc(q.p)}</summary><p>${esc(typeof q.r==="string"?q.r:"")}</p></details>`).join("")}</div>`}
function f113Caps(){if(F113_IO){try{F113_IO.disconnect()}catch(e){}F113_IO=null}const m=$("#layer .mat"),c=m&&m.querySelector(".mat-c"),p=typeof MAT_PID!=="undefined"&&pautaById(MAT_PID);if(!c||!p)return;
  c.querySelector(".fs2-cap")?.remove();
  /* Perguntas: as mesmas da página da cobertura, depois da linha do tempo / do que vem agora */
  if(!c.querySelector(".fs2-faq")){const h=f113FaqHTML(p);if(h){const vem=[...c.querySelectorAll(".cpx-c")].filter(e=>/^O que vem agora/.test((e.querySelector("b")||{}).textContent||"")).pop();
    const ref=c.querySelector(".mat-tl")||vem||[...c.querySelectorAll(".mat-vis")].pop()||c.querySelector(".mat-p");if(ref)ref.insertAdjacentHTML("afterend",h)}}
  const caps=[];const add=(el,nome)=>{if(el&&!caps.some(x=>x.el===el))caps.push({el,nome})};
  add(c.querySelector(".mat-30")||c.querySelector(".mat-p"),"O que aconteceu");
  /* um capítulo para cada bloco de visual (placar oficial, números, gráfico, pesquisas), na ordem em que aparecem */
  {const vt=(Array.isArray(p.visuais)?p.visuais:[]).filter(v=>v&&F113_VIS[v.tipo]);let k=0;
    c.querySelectorAll(".mat-vis").forEach(el=>{if(el.classList.contains("po118"))add(el,"Placar oficial");else{const t=vt[k++];add(el,t?F113_VIS[t.tipo]:"Os números")}})}
  add(c.querySelector(".mat-tl"),"Linha do tempo");
  add([...c.querySelectorAll(".cpx-c")].find(e=>/^O que vem agora/.test((e.querySelector("b")||{}).textContent||"")),"O que vem agora");
  add(c.querySelector(".fs2-faq"),"Perguntas");
  if(caps.length<2)return;
  caps.sort((x,y)=>x.el.compareDocumentPosition(y.el)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
  caps.forEach((x,i)=>{x.el.id="fs2c-"+i;x.el.classList.add("fs2-alvo");if(!x.el.hasAttribute("tabindex"))x.el.tabIndex=-1});
  caps[0].el.insertAdjacentHTML("beforebegin",`<nav class="fs2-cap" aria-label="Nesta matéria"><span class="fs2-cap-k" aria-hidden="true">Nesta matéria</span><ol class="fs2-cap-l">${caps.map((x,i)=>`<li><button type="button" class="fs2-cap-b" data-f113cap="${i}" aria-controls="fs2c-${i}"${i===0?' aria-current="true"':""}><i aria-hidden="true">${i+1}</i>${esc(x.nome)}</button></li>`).join("")}</ol></nav>`);
  if("IntersectionObserver" in window){const off=f113Off(m);
    F113_IO=new IntersectionObserver(()=>f113CapAtual(),{root:m,rootMargin:`-${off}px 0px -55% 0px`,threshold:[0,1]});caps.forEach(x=>F113_IO.observe(x.el))}
  /* saltos grandes de rolagem (topo/fim) podem não cruzar a faixa observada: confere também no fim da rolagem, uma vez por quadro */
  if(!m.__f113s){m.__f113s=1;let pend=0;m.addEventListener("scroll",()=>{if(pend)return;pend=requestAnimationFrame(()=>{pend=0;f113CapAtual()})},{passive:true})}}
/* altura do topo fixo da matéria + o índice grudado */
function f113Off(m){const t=m.querySelector(".mat-top"),n=m.querySelector(".fs2-cap");return Math.round((t?t.getBoundingClientRect().height:52)+(n?n.getBoundingClientRect().height:44)+8)}
var F113_CAPFIXO=0;
function f113CapAtual(){const m=$("#layer .mat");if(!m||Date.now()<F113_CAPFIXO)return;const nav=m.querySelector(".fs2-cap");if(!nav)return;const off=f113Off(m),top=m.getBoundingClientRect().top;
  const els=[...m.querySelectorAll(".fs2-alvo[id^='fs2c-']")];let i=0;els.forEach((e,k)=>{if(e.getBoundingClientRect().top-top<=off+40)i=k});
  /* no fim da matéria, o último capítulo */
  if(m.scrollTop+m.clientHeight>=m.scrollHeight-4&&els.length){const ul=els[els.length-1];if(ul.getBoundingClientRect().top<top+m.clientHeight)i=els.length-1}
  f113CapMarca(nav,i)}
function f113CapMarca(nav,i){nav.querySelectorAll("[data-f113cap]").forEach(b=>{const on=+b.dataset.f113cap===i;if(on)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current")});
  const b=nav.querySelector(`[data-f113cap="${i}"]`),l=nav.querySelector(".fs2-cap-l");if(b&&l){const x=b.offsetLeft-12;if(x<l.scrollLeft||b.offsetLeft+b.offsetWidth>l.scrollLeft+l.clientWidth)try{l.scrollTo({left:Math.max(0,x),behavior:f113Reduz()?"auto":"smooth"})}catch(e){l.scrollLeft=Math.max(0,x)}}}
function f113CapVai(i){const m=$("#layer .mat"),el=m&&m.querySelector("#fs2c-"+i),nav=m&&m.querySelector(".fs2-cap");if(!el)return;uso("fase2_capitulo");
  const y=el.getBoundingClientRect().top-m.getBoundingClientRect().top+m.scrollTop-f113Off(m);
  F113_CAPFIXO=Date.now()+(f113Reduz()?60:700);if(nav)f113CapMarca(nav,i);
  try{m.scrollTo({top:Math.max(0,y),behavior:f113Reduz()?"auto":"smooth"})}catch(e){m.scrollTop=Math.max(0,y)}
  try{el.focus({preventScroll:true})}catch(e){}setTimeout(()=>{F113_CAPFIXO=0},720)}

/* ===== 3. Prateleiras no Feed ===== */
var F113_SH_LIGA=false,F113_NAPRAT=new Set();const F113_SOLTA=new Set();
/* os temas, na ordem: hashtags seguidas, editorias das coberturas seguidas, Economia, Política e o resto */
function f113Temas(){const l=[],ja=new Set(),add=t=>{if(!ja.has(t.k)){ja.add(t.k);l.push(t)}};
  try{const sg=typeof htSeguidas==="function"?htSeguidas():{};Object.keys(sg).forEach(k=>{const tag=htLimpa(sg[k]);if(tag)add({k:"ht:"+k,nome:"Por seguir "+tag,ht:tag,f:p=>htNotCasa(p,k)>=2})})}catch(e){}
  const ps=visiveis(),secs=[];const sec=s=>({k:"sec:"+s,nome:"Mais de "+secNome(s),sec:s,f:p=>secOf(p)===s});
  try{ps.filter(p=>typeof seguido==="function"&&seguido(p)).forEach(p=>secs.push(secOf(p)))}catch(e){}
  secs.push("economia","politica");const cont={};ps.forEach(p=>{const s=secOf(p);cont[s]=(cont[s]||0)+1});Object.keys(cont).sort((a,b)=>cont[b]-cont[a]).forEach(s=>secs.push(s));
  secs.forEach(s=>{if(cont[s])add(sec(s))});return l}
function f113Prat(out){F113_NAPRAT=new Set();if(!Array.isArray(out)||out.length<10)return out;const res=out.slice(),temas=f113Temas(),usados=new Set();
  const comTake=new Set(res.filter(p=>p&&p.__fc107&&p.__pub).map(p=>p.__pub.pid));let n=0;
  for(const base of [6,12,18]){if(n>=3)break;const i=base+n;if(i>=res.length-1)break;
    const abaixo=res.slice(i).filter(p=>p&&!p.__pub&&!p.__fc107&&!p.__f113&&!F113_SOLTA.has(p.id)&&!comTake.has(p.id)&&pautaById(p.id)&&!(typeof seguido==="function"&&seguido(pautaById(p.id))));
    for(const t of temas){if(usados.has(t.k))continue;let c=abaixo.filter(p=>{try{return t.f(pautaById(p.id))}catch(e){return false}});if(c.length<4)continue;
      /* as não lidas primeiro, na ordem do Feed */
      c=c.filter(p=>!LIDAS.has(p.id)).concat(c.filter(p=>LIDAS.has(p.id))).slice(0,6);usados.add(t.k);
      c.forEach(p=>{const j=res.indexOf(p);if(j>=0)res.splice(j,1);F113_NAPRAT.add(p.id)});
      res.splice(i,0,{id:"_fs2-"+t.k.replace(/[^\w-]/g,"_"),__f113:{t,ps:c.map(p=>pautaById(p.id))}});n++;break}}
  return res}
function f113PratHTML(sh){const t=sh.t,id="fs2sh-"+t.k.replace(/[^\w-]/g,"_"),c=t.sec?secCor(t.sec):"var(--bronze)";
  return `<section class="fs2-sh" id="${esc(id)}" aria-labelledby="${esc(id)}-t" data-f113sh="${esc(t.k)}" style="--fs2-c:${c}"><div class="fs2-sh-h gut"><h3 id="${esc(id)}-t">${esc(t.nome)}</h3>${t.sec?`<button type="button" class="fs2-sh-v" data-filtro="${esc(t.sec)}" aria-label="Ver tudo de ${esc(secNome(t.sec))}">Ver tudo ›</button>`:t.ht?`<button type="button" class="fs2-sh-v" data-ht="${esc(t.ht)}" aria-label="Ver tudo de ${esc(t.ht)}">Ver tudo ›</button>`:""}</div>
    <ul class="fs2-sh-l">${sh.ps.map(p=>{const v=versao(p,lente()),s=secOf(p);return `<li><button type="button" class="fs2-mc" data-capmat="${esc(p.id)}" data-f113mc="${esc(p.id)}"><span class="fs2-mc-a">${vn112Corta(capaArte(p,"fs2-mc-art"))}</span><small style="color:${secCor(s)}">${esc(p.tag||secNome(s))}</small><b>${esc(v.titulo)}</b></button></li>`}).join("")}</ul></section>`}

/* ===== 1b. criar e editar o fio ===== */
function f113PodeCompor(P){return !!P&&(!P.cn||P.cn.k==="ana")}
function f113EdHTML(parts,attr,ed){const n=parts.length+1;
  return `${parts.map((t,i)=>`<div class="fs2-ed-p"><span class="fs2-ed-n" aria-hidden="true">${i+2}/${n}</span><textarea class="fs2-ed-tx${ed?" field":""}" data-${attr}parte="${i}" maxlength="2000" rows="3" placeholder="Continue o fio" aria-label="Parte ${i+2} de ${n}">${esc(t)}</textarea><button type="button" class="fs2-ed-x" data-${attr}tira="${i}" aria-label="Tirar a parte ${i+2}">${F113_SVG.x}</button></div>`).join("")}
    ${n<F113_MAX?`<button type="button" class="fs2-ed-add" data-${attr}mais>${F113_SVG.mais}Adicionar parte</button>`:""}${parts.length?`<p class="fs2-ed-d">Fio com ${n} partes. Seus amigos veem a primeira e tocam em “Ler o fio” para ver o resto.</p>`:""}`}
function f113EdPoe(el){const P=ED&&ED.po;if(!P||!f113PodeCompor(P))return;const leg=el.querySelector("#ce-leg");if(!leg)return;if(!Array.isArray(P.f113fio))P.f113fio=[];
  el.querySelector(".fs2-ed")?.remove();el.querySelector(".fs2-ed-n1")?.remove();
  if(P.f113fio.length)leg.insertAdjacentHTML("beforebegin",`<span class="fs2-ed-n fs2-ed-n1" aria-hidden="true">1/${P.f113fio.length+1}</span>`);
  leg.classList.toggle("fs2-ed-1",!!P.f113fio.length);
  leg.insertAdjacentHTML("afterend",`<div class="fs2-ed${P.f113fio.length?" tem":""}" role="group" aria-label="Fio: partes do post">${f113EdHTML(P.f113fio,"f113",false)}</div>`)}
function f113Limpa(l){return (Array.isArray(l)?l:[]).map(t=>String(t||"").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").trim().slice(0,2000)).filter(Boolean).slice(0,F113_MAX-1)}
/* avisa quem foi marcado só nas outras partes (quem está na parte 1 já recebeu) */
async function f113AvisaPartes(id,texto,parts){try{if(typeof mencionados!=="function"||typeof pubAvisarMencoes!=="function")return;const ja=new Set(mencionados(texto||"")),t=parts.join("\n\n");
  if(!mencionados(t).some(u=>!ja.has(u)))return;const _m=mencionados;mencionados=s=>_m(s).filter(u=>!ja.has(u));try{await pubAvisarMencoes(id,t,"post")}finally{mencionados=_m}}catch(e){}}
var F113_ED=null;
function f113EdSheet(id){const t=$("#ed-leg"),x=pubDe(id);if(!t||!x||!f113PodeFio(x))return;F113_ED={id,parts:(f113Fio(x)||[]).slice(),ok:false};f113EdSheetDesenha()}
function f113EdSheetDesenha(){const t=$("#ed-leg");if(!t||!F113_ED)return;let b=$("#fs2-edb");if(!b){t.insertAdjacentHTML("afterend",`<div class="fs2-ed fs2-ed-sh" id="fs2-edb" role="group" aria-label="Fio: partes do post"></div>`);b=$("#fs2-edb")}
  b.classList.toggle("tem",!!F113_ED.parts.length);b.innerHTML=f113EdHTML(F113_ED.parts,"f113e",true);t.classList.toggle("fs2-ed-1",!!F113_ED.parts.length);
  let n1=document.querySelector(".fs2-ed-n1e");if(F113_ED.parts.length){if(!n1){t.insertAdjacentHTML("beforebegin",`<span class="fs2-ed-n fs2-ed-n1 fs2-ed-n1e" aria-hidden="true"></span>`);n1=document.querySelector(".fs2-ed-n1e")}n1.textContent="1/"+(F113_ED.parts.length+1)}else n1?.remove()}
function f113EdLe(){document.querySelectorAll("#fs2-edb [data-f113eparte]").forEach(t=>{if(F113_ED)F113_ED.parts[+t.dataset.f113eparte]=t.value})}

/* ===== 5. instala ===== */
if(VN_FASE2){
  document.documentElement.classList.add("fs2");
  /* post: fio e contexto */
  {const _pp113=pubPostHTML;pubPostHTML=function(x){const h=_pp113.apply(this,arguments);if(typeof h!=="string"||!h||!x||x.tipo!=="post")return h;try{const a=vn112Tp(h);if(!a)return h;
    const parts=f113PodeFio(x)?f113Fio(x):null;if(parts)f113PoeFio(a,x,parts);f113PoeCtx(a,x);return a.outerHTML}catch(e){return h}}}
  /* o comentário logo abaixo da notícia já está junto dela: sem caixa de contexto; prateleira */
  {const _ps113=postSeguro;postSeguro=function(p){if(p&&p.__f113)try{return f113PratHTML(p.__f113)}catch(e){return ""}
    let h=_ps113.apply(this,arguments);try{if(p&&p.__fc107&&typeof h==="string"&&h.indexOf("fs2-ctx")>=0){const a=vn112Tp(h);if(a){a.querySelectorAll(".fs2-ctx").forEach(e=>e.remove());h=a.outerHTML}}}catch(e){}return h}}
  /* publicação aberta numa camada (e a página da hashtag): o fio inteiro */
  {const _pv113=pfvDesenha;pfvDesenha=function(){const r=_pv113.apply(this,arguments);try{if(PFV&&PFV.modo!=="grade")f113AbreTudo($("#layer .pfv"))}catch(e){}return r}}
  {const _hd113=htDesenha;htDesenha=function(){const r=_hd113.apply(this,arguments);try{f113AbreTudo($("#layer .pfv-ht"))}catch(e){}return r}}
  /* hashtags de todas as partes contam (página da hashtag, em alta, seguir) */
  {const _hp113=htPubs;htPubs=function(){const l=_hp113.apply(this,arguments);try{const ex=pubVisiveis().filter(x=>x&&!x.texto&&f113Fio(x));
    return l.concat(ex).map(x=>{if(!f113Fio(x))return x;const y=Object.assign(Object.create(Object.getPrototypeOf(x)),x,{texto:f113Tudo(x)});try{Object.defineProperty(y,"__f113o",{value:x})}catch(e){}return y})}catch(e){return l}}}
  {const _hc113=htPostsCom;htPostsCom=function(){const l=_hc113.apply(this,arguments);return Array.isArray(l)?l.map(x=>x&&x.__f113o||x):l}}
  {const _hs113=htSeguidaDePost;htSeguidaDePost=function(x){if(x&&f113Fio(x))try{return _hs113.call(this,{texto:f113Tudo(x)})}catch(e){}return _hs113.apply(this,arguments)}}
  /* matéria */
  {const _am113=abrirMateria;abrirMateria=function(){const r=_am113.apply(this,arguments);try{f113Caps()}catch(e){console.error(e)}return r}}
  {const _cl113=closeLayer;closeLayer=function(){const r=_cl113.apply(this,arguments);try{if(F113_IO&&!$("#layer .mat")){F113_IO.disconnect();F113_IO=null}}catch(e){}return r}}
  /* Feed: prateleiras só na lista principal ("Tudo"), uma vez por desenho; a contagem "faltam N" fica como antes */
  {const _rp113=renderPosts;renderPosts=function(){F113_SH_LIGA=true;try{return _rp113.apply(this,arguments)}finally{F113_SH_LIGA=false}}}
  {const _ae113=atualizarEmDia;atualizarEmDia=function(){const o=F113_SH_LIGA;F113_SH_LIGA=false;try{return _ae113.apply(this,arguments)}finally{F113_SH_LIGA=o}}}
  {const _pm113=pubMistura;pubMistura=function(){const out=_pm113.apply(this,arguments);if(!F113_SH_LIGA||FILTRO!=="tudo")return out;F113_SH_LIGA=false;try{return f113Prat(out)}catch(e){console.error(e);return out}}}
  /* "Ver no Feed" de uma notícia que está numa prateleira: ela volta para a lista */
  {const _gp113=garantirPost;garantirPost=function(pid){const r=_gp113.apply(this,arguments);if(r||!F113_NAPRAT.has(pid))return r;F113_SOLTA.add(pid);try{renderPosts(true)}catch(e){}return _gp113.apply(this,arguments)}}
  /* criar: "Adicionar parte" no passo do texto */
  {const _cd113=cfpDet;cfpDet=function(el){const r=_cd113.apply(this,arguments);try{f113EdPoe(el)}catch(e){console.error(e)}return r}}
  {const _ep113=edPublicaPost;edPublicaPost=async function(){const P=ED&&ED.po;if(!P||ED.env||!SB||!f113PodeCompor(P))return _ep113.apply(this,arguments);
    const parts=f113Limpa(P.f113fio);if(!parts.length)return _ep113.apply(this,arguments);
    const p1=P.cn?String(P.cn.corpo||"").trim()||String(P.cn.tit||"").trim():String(P.texto||"").trim();if(!p1){toast("Escreva a primeira parte do fio.");try{$("#ce-leg")?.focus()}catch(e){}return}
    const _from=SB.from;SB.from=function(tb){const q=_from.apply(this,arguments);if(tb==="publicacoes"&&q&&typeof q.insert==="function"&&!q._f113){const ins=q.insert;q._f113=1;q.insert=function(row){try{if(row&&row.tipo==="post"&&row.estilo&&typeof row.estilo==="object")row.estilo.fio=parts}catch(e){}return ins.apply(this,arguments)}}return q};
    let r;try{r=await _ep113.apply(this,arguments)}finally{SB.from=_from}
    try{const x=(PUB.itens||[]).find(y=>y&&y.autor===S.uid&&y.estilo&&y.estilo.fio===parts);if(x&&x.id){uso("fase2_fio");f113AvisaPartes(x.id,x.texto,parts)}}catch(e){}return r}}
  /* editar: as partes aparecem embaixo da legenda */
  {const _pe113=pubEditar;pubEditar=async function(id,txt){const E=F113_ED,x=pubDe(id);F113_ED=null;if(!E||!E.ok||E.id!==id||!x)return _pe113.apply(this,arguments);
    const parts=f113Limpa(E.parts),ant=f113Fio(x)||[];
    if(JSON.stringify(parts)!==JSON.stringify(ant)){const es={...x.estilo};if(parts.length)es.fio=parts;else delete es.fio;
      try{const r=await SB.from("publicacoes").update({estilo:es}).eq("id",id);if(r&&r.error)throw r.error}catch(e){toast("Não deu para salvar o fio agora.");return}
      if(parts.length)x.estilo.fio=parts;else delete x.estilo.fio;f113AvisaPartes(id,txt,parts.filter(t=>!ant.includes(t)))}
    return _pe113.apply(this,arguments)}}
}

/* ===== 6. toques e digitação ===== */
window.addEventListener("click",e=>{if(!VN_FASE2)return;const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  if(b=t.closest("[data-f113ver]")){pare();const box=b.closest(".fs2-fio");const on=!box.classList.contains("on");f113Abre(box,on);if(on)uso("fase2_ler_fio");return}
  if(b=t.closest("[data-f113cap]")){pare();f113CapVai(+b.dataset.f113cap);return}
  if(t.closest("#layer .ce")&&ED&&ED.po){const P=ED.po;
    if(t.closest("[data-f113mais]")){pare();if(ED.env)return;if(!Array.isArray(P.f113fio))P.f113fio=[];if(P.f113fio.length<F113_MAX-1){P.f113fio.push("");edDesenha();setTimeout(()=>{const l=document.querySelectorAll("#layer [data-f113parte]");const u=l[l.length-1];if(u)try{u.focus({preventScroll:false})}catch(_){}},40)}return}
    if(b=t.closest("[data-f113tira]")){pare();if(ED.env)return;P.f113fio.splice(+b.dataset.f113tira,1);edDesenha();return}}
  if(t.closest("#fs2-edb")&&F113_ED){
    if(t.closest("[data-f113emais]")){pare();f113EdLe();if(F113_ED.parts.length<F113_MAX-1){F113_ED.parts.push("");f113EdSheetDesenha();const l=document.querySelectorAll("#fs2-edb [data-f113eparte]");try{l[l.length-1].focus()}catch(_){}}return}
    if(b=t.closest("[data-f113etira]")){pare();f113EdLe();F113_ED.parts.splice(+b.dataset.f113etira,1);f113EdSheetDesenha();return}}
  if(b=t.closest("[data-ueditar]")){const id=b.dataset.ueditar;F113_ED=null;setTimeout(()=>{try{f113EdSheet(id)}catch(_){}},200);return}
  if(b=t.closest("[data-uedok]")){if(F113_ED&&F113_ED.id===b.dataset.uedok){f113EdLe();F113_ED.ok=true}return}},true);
document.addEventListener("input",e=>{if(!VN_FASE2)return;const t=e.target;if(!t||!t.dataset)return;
  if(t.dataset.f113parte!=null&&ED&&ED.po&&Array.isArray(ED.po.f113fio)){ED.po.f113fio[+t.dataset.f113parte]=t.value;try{menSugere(t)}catch(_){}return}
  if(t.dataset.f113eparte!=null&&F113_ED){F113_ED.parts[+t.dataset.f113eparte]=t.value;try{menSugere(t)}catch(_){}}},true);
