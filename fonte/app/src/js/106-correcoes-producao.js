/* ---------- 106: correções do app como chega ao usuário (QA de produção 03/11: foco em notícia, sem Reels, Capa, guia, animações) ---------- */
/* 1. guia da primeira abertura: "Boas-vindas" (vale para todos) e a tela do Feed fala de conversar sobre notícias, não de "curtir" */
{const _tt106=tourTelas;tourTelas=function(nome){const ts=_tt106.apply(this,arguments);
  try{if(FOCO_LIGADO){if(nome)ts[0].t=`Boas-vindas, ${nome}`;const f=ts.find(x=>x.ic==="feed");
    if(f){f.t="Notícias para conversar";f.p="No Feed, as notícias da edição viram posts e stories, junto com o que seus amigos publicam: comentários, relatos do que viram e análises. Comente, vote nas enquetes e mande para quem quiser."}}}catch(e){}return ts}}
/* 2. endereço sem "https://" (ex.: g1.globo.com) vale como link; o atalho "Fonte" da foto abre a folha com o nome "Fonte" */
{const _uo106=edUrlOk;edUrlOk=function(u){let s=String(u==null?"":u).trim();if(s&&!/^[a-z][a-z0-9+.-]*:/i.test(s)&&/^[^\s\/@]+\.[a-z]{2,}(?:[\/?#]\S*)?$/i.test(s))s="https://"+s;return _uo106.call(this,s)}}
{const _ca106=fc105CtxAbre;fc105CtxAbre=function(k){const r=_ca106.apply(this,arguments);
  try{if(k==="link"){const p=$("#layer .ce-sel .ce-selp");const t=p&&p.querySelector(":scope>b");if(t)t.textContent="Fonte";const i=$("#layer .ce-sel #fu");if(i)i.placeholder="Endereço do site (ex.: g1.globo.com)"}}catch(e){}return r}}
/* 3. eixo dos gráficos de indicador: séries mensais ("2024-12") viram "dez/24", como as diárias viram "2/11" */
{const _dc106=cn102DiaCurto;const M106=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  cn102DiaCurto=function(s){const m=/^(\d{4})-(\d{2})$/.exec(String(s||"").trim());if(m&&+m[2]>=1&&+m[2]<=12)return `${M106[+m[2]-1]}/${m[1].slice(2)}`;return _dc106.apply(this,arguments)}}
/* 4. ♥ da Atividade na Capa: aparecia só se a Capa fosse desenhada depois de a conta carregar (logo após entrar, faltava) */
function cp106Coracao(){try{const h=$("#v-capa .cp-top");if(h&&!h.querySelector(".at-b")&&S.uid&&S.membro)h.insertAdjacentHTML("beforeend",AT_BTN())}catch(e){}}
{const _rc106=renderCapa;renderCapa=function(){const r=_rc106.apply(this,arguments);cp106Coracao();return r}}
{const _ad106=atDot;atDot=function(){cp106Coracao();return _ad106.apply(this,arguments)}}
/* 5. cartão de texto: nome comprido não é cortado no meio ("…DE ALBUQUERQUE CA"); usa o primeiro e o último nome */
{const _ck106=fc105Kicker;fc105Kicker=function(c,nome){const k=_ck106.apply(this,arguments);if(k.length<=40||c.k==="cit")return k;
  const n=String(nome||nomeDe(S.uid)||"").trim(),p=n.split(/\s+/);if(n.length>=40&&p.length>2)p.pop();/* nome com 40 letras foi cortado no cadastro: a última palavra pode estar pela metade */return _ck106.call(this,c,p.length>1?p[0]+" "+p[p.length-1]:p[0])}}
/* 6. "O que você acha?" no fim da matéria: ícone de comentário; e, se a pessoa desistir do post ou do story, volta para a matéria
   (antes o editor fechava a matéria e o ✕ levava para a Capa) */
var MC106=null;
{const _fm106=fc105Mat;fc105Mat=function(pid){const r=_fm106.apply(this,arguments);try{const b=$("#layer .fc105-mc [data-cn102envp] .cn102-i");if(b)b.innerHTML=ICON.cmt.replace(/^<svg[^>]*>|<\/svg>$/g,"")}catch(e){}return r}}
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const b=t.closest("#layer .fc105-mc [data-cn102envp],#layer .fc105-mc [data-cn102envs]");
  if(b){MC106={pid:b.dataset.cn102envp||b.dataset.cn102envs,t:Date.now()};return}
  if(t.closest("[data-edpubpo],[data-edpubst]")&&MC106)MC106.pub=1},true);
{const _cl106=closeLayer;closeLayer=function(){const ed=!!$("#layer > .ce");const r=_cl106.apply(this,arguments);
  try{if(ed&&MC106&&!$("#layer > .ce")){const m=MC106;MC106=null;if(!m.pub&&!(typeof PQ!=="undefined"&&PQ.atual)&&Date.now()-m.t<36e5&&pautaById(m.pid))setTimeout(()=>{try{if(!$("#layer").innerHTML&&!ED){abrirMateria(m.pid);$("#layer .fc105-mc")?.scrollIntoView({block:"center"})}}catch(e){}},ANIM_OK()?260:40)}}catch(e){}return r}}
/* 7. análise: o texto do campo de fonte cabia só pela metade em telas de 360px */
{const _cd106=cn102Det;cn102Det=function(el){const r=_cd106.apply(this,arguments);try{const fu=el.querySelector("#cn102-fu");if(FOCO_LIGADO&&fu&&/recomendado/.test(fu.placeholder))fu.placeholder="Link ou nome (recomendado)"}catch(e){}return r}}
/* 8. Local e Menção vão "assados" na foto do story com roxo e rosa fixos; no foco, saem com os tons de jornal (como na tela) */
{const _pe106=edPintaEl;const T106={"#8338ec":"#1d3a63","#c2185b":"#6e2633"};edPintaEl=function(g,e){if(!FOCO_LIGADO||!g||!e||!["local","men"].includes(e.t))return _pe106.apply(this,arguments);
  const d=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,"fillStyle");try{Object.defineProperty(g,"fillStyle",{configurable:true,get(){return d.get.call(g)},set(v){d.set.call(g,typeof v==="string"&&T106[v.toLowerCase()]||v)}})}catch(x){return _pe106.apply(this,arguments)}
  try{return _pe106.apply(this,arguments)}finally{delete g.fillStyle}}}
/* 9. fundos sorteados pelo id da publicação (post "só texto", miniaturas do perfil, dos Salvos e da Atividade) saíam roxo/rosa;
   no foco, viram os fundos sóbrios. Fundos escolhidos (índices baixos, 0–11) não mudam. */
{const _pf106=pubFundo;pubFundo=function(i){try{if(FOCO_LIGADO&&FC105_F0>0){const n=Math.floor(+i);if(i==null||i===""||n>=40){const k=FC105_F0+((isFinite(n)?n:0)%FC105_FUNDOS.length);const f=PUB_FUNDOS[k];if(f)return `linear-gradient(160deg,${f[0]},${f[1]})`}}}catch(e){}return _pf106.apply(this,arguments)}}
/* 10. fonte escrita só com o domínio ("g1.globo.com/economia") vira link no post, como "www." já virava */
{const _fo106=cn102Fonte;cn102Fonte=function(fu){const s=String(fu==null?"":fu).trim();if(s&&!/^[a-z][a-z0-9+.-]*:/i.test(s)&&!/^www\./i.test(s)&&/^[^\s\/@]+\.[a-z]{2,}(?:[\/?#]\S*)?$/i.test(s))return _fo106.call(this,"https://"+s);return _fo106.apply(this,arguments)}}
/* 11. Atividade: a mesma pessoa que votou e respondeu no story contava duas vezes ("Bia Souza responderam", dois avatares iguais) */
{const _ai106=atItens;atItens=function(){const l=_ai106.apply(this,arguments);try{(l||[]).forEach(x=>{if(!x||!Array.isArray(x.us)||x.acao!=="pub")return;const u=[...new Set(x.us)];if(u.length===x.us.length)return;x.us=u;
  if(u.length===1&&typeof x.txt==="string")x.txt=x.txt.replace("</b> curtiram ","</b> curtiu ").replace("</b> responderam ao ","</b> respondeu ao ")})}catch(e){}return l}}
/* 12. miniatura de post sem foto na Atividade: mesmo fundo do post no Feed e no perfil (sorteado pelo id), e não o fundo 0 (laranja/rosa) */
{const _at106=atThumb;atThumb=function(x){const k=x&&x.pub,pb=k&&AT.pubs[k];if(!pb||pb.tipo==="story"||(pb.fotos&&pb.fotos.length)||(pb.estilo&&pb.estilo.fundo))return _at106.apply(this,arguments);
  AT.pubs[k]={...pb,estilo:{...(pb.estilo||{}),fundo:String(pb.id).charCodeAt(0)}};try{return _at106.apply(this,arguments)}finally{AT.pubs[k]=pb}}}
