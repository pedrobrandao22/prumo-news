/* ---------- 105: foco em notícia e conteúdo ----------
   O Prumo é para notícia, fato e opinião sobre economia e política, não para entretenimento.
   Sai: Boomerang, Layout (colagem), Timer, emojis da bandeja, figurinhas de brincadeira (slider de emoji, "Adicione o seu",
   selfie, hashtag), Neon (texto e pincel), animação de texto, cores e fundos chamativos, reações bobas.
   Entra: câmera que começa pela notícia (Notícia · Texto · Indicador · Livre), cartão de texto (opinião, análise, relato, citação)
   com tipografia de jornal e crédito automático, fundos sóbrios por editoria, atalhos de contexto na foto (local, hora, fonte, notícia),
   "via Prumo" no cartão da notícia, convite para comentar a notícia no fim da matéria, pedido de fonte na análise.
   Stories antigos com figurinhas que saíram continuam aparecendo para quem vê (nada do visualizador foi tirado).
   Nos testes automáticos tudo continua como antes (o código antigo segue testado), a não ser com localStorage "prumo-teste-foco"="1". */
const FOCO_LIGADO=(()=>{try{return !navigator.webdriver||localStorage.getItem("prumo-teste-foco")==="1"}catch(e){return true}})();

/* ===== 1. listas: o que fica e o que sai ===== */
const FC105_FUNDOS=[["noite","#1f2c45","#0c1322"],["politica","#1d3a63","#0d1d36"],["economia","#24533c","#0f2a1c"],["vinho","#6e2633","#33111a"],["grafite","#3b4048","#15171b"],["terra","#6e4419","#311e0a"]];
var FC105_F0=-1;/* índice do primeiro fundo sóbrio em PUB_FUNDOS */
{const _fo=edFonte;edFonte=function(f,px){return f==="jornal"?`600 ${px}px Newsreader, Georgia, serif`:_fo.apply(this,arguments)}}
function fc105Tira(arr,fn){for(let i=arr.length-1;i>=0;i--)if(fn(arr[i]))arr.splice(i,1)}
function fc105Listas(){
  /* figurinhas */
  fc105Tira(FG2_FIGS,f=>["slid","add","hash","selfie"].includes(f[0]));
  FG2_EMOJIS.length=0;try{ED_EMOJIS.length=0}catch(e){}
  CN102_TRAY.length=0;CN102_TRAY.push(["Notícia e contexto",["nt","link","local","hora","ind"]],["Perguntar",["enq","perg","quiz"]],["Mais",["men","cont","foto"]]);
  /* pincel: caneta, marcador e borracha (para sublinhar e apontar); neon sai */
  fc105Tira(FG2_PEN,p=>p[0]==="neon");
  /* texto: estilos limpos; "Jornal" (serifa reta) entra, Neon sai */
  fc105Tira(ED_FONTES,f=>f[0]==="neon");if(!ED_FONTES.some(f=>f[0]==="jornal"))ED_FONTES.splice(1,0,["jornal","Jornal"]);
  ED_FONTES.forEach(f=>{if(f[0]==="moderno")f[1]="Itálico"});
  /* cores: tons de jornal no lugar do rosa e do roxo */
  const tr={"#ff66c4":"#c9822b","#8338ec":"#5b6b7f","#2ec4b6":"#24533c"};ED_CORES.forEach((c,i)=>{if(tr[c])ED_CORES[i]=tr[c]});
  /* filtros: poucos e documentais */
  const fl={normal:"Normal",clarendon:"Contraste",ludwig:"Suave",aden:"Claro",moon:"P&B"};fc105Tira(ED_FILTROS,f=>!fl[f[0]]);ED_FILTROS.forEach(f=>{f[1]=fl[f[0]]});
  /* reações rápidas: poucas e sóbrias */
  VS98_EMOS.splice(0,VS98_EMOS.length,"👏","👍","🤔","😮","😢");
  VP99_EMOJIS.splice(0,VP99_EMOJIS.length,"❤️","👏","👍","🤔","😮","😢");
  /* fundos do story: os sóbrios entram no fim (os índices antigos não mudam) */
  if(FC105_F0<0){FC105_F0=PUB_FUNDOS.length;FC105_FUNDOS.forEach(f=>PUB_FUNDOS.push([f[1],f[2]]))}}
/* fundos antigos (0–5) seguem iguais para publicações antigas; no editor, viram os sóbrios */
function fc105Sobrio(g){const n=FC105_FUNDOS.length;g=+g||0;return g>=FC105_F0&&g<FC105_F0+n?g:FC105_F0+((g%n)+n)%n}
function fc105FundoSec(sec){const k={politica:"politica",economia:"economia",educacao:"vinho",brasil:"terra"}[sec]||"noite";return FC105_F0+FC105_FUNDOS.findIndex(f=>f[0]===k)}

/* ===== 2. ícones ===== */
const FC105_ICO={tx:'<path d="M5 5.5h14M5 9.5h14M5 13.5h9M5 17.5h6"/>',livre:'<path d="M5 6.5h14M12 6.5V19M9 19h6"/>',ed:'<path d="M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5z"/>',
  local:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',hora:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'};
const fc105Svg=d=>`<svg class="cn102-i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

/* ===== 3. câmera do story: começa pela notícia ===== */
function fc105Rail(el){const rail=el&&el.querySelector(".ce-rail");if(!rail||ED.modo!=="story")return;
  rail.querySelectorAll("[data-edlayout],[data-rcboom],[data-rctimer]").forEach(b=>b.remove());
  if(typeof RC!=="undefined"){RC.boom=false;RC.tm=0;try{rcRail()}catch(e){}}
  const nt=rail.querySelector("[data-cn102stnt]"),cr=rail.querySelector("[data-edcriar]");
  if(cr){const s=cr.querySelector("span");if(s)s.textContent="Livre";cr.setAttribute("aria-label","Texto livre sobre um fundo")}
  if(!rail.querySelector("[data-fc105txt]"))rail.insertAdjacentHTML("afterbegin",`<button type="button" data-fc105txt>${fc105Svg(FC105_ICO.tx)}<span>Texto</span></button><button type="button" data-fc105ind>${fc105Svg(CN102_ICO.ind)}<span>Indicador</span></button>`);
  if(nt)rail.prepend(nt);if(cr)rail.appendChild(cr);rail.classList.add("fc105-rail")}
/* sai da câmera para a tela de edição com um fundo sóbrio */
function fc105ParaEdicao(g){if(!ED||ED.modo!=="story")return;const st=ED.st;if(st.bg.tipo!=="foto"&&st.bg.tipo!=="video")st.bg={tipo:"grad",g:g==null?FC105_F0:g};ED.tela="edit";try{camDesliga()}catch(e){}edDesenha()}

/* ===== 4. cartão de texto (opinião, análise, relato, citação) ===== */
const FC105_KS=[["opi","Opinião"],["ana","Análise"],["rel","Relato"],["cit","Citação"]];
const FC105_TEMAS=[["papel","Papel","#f4efe4","#14213a","#8a5313","#c9822b","#5b6370"],["noite","Noite","#14213a","#ffffff","#e3ad62","#c9822b","#aab4c4"],
  ["politica","Política","#1d3a63","#ffffff","#b9cbe6","#8fb0dc","#b9c6d8"],["economia","Economia","#24533c","#ffffff","#bfe0cb","#8cc4a2","#b9d2c3"]];
var FC105_C=null,FC105_ST=null;
function fc105Alt(c){return [fc105Kicker(c),c.tit,c.k==="cit"&&c.quem?"— "+c.quem:c.tx].map(x=>String(x||"").trim()).filter(Boolean).join(": ").slice(0,300)}
function fc105CNovo(){return {k:"opi",tit:"",tx:"",quem:"",onde:"",fu:"",tema:"papel",at:Date.now()}}
function fc105Kicker(c,nome){nome=nome||nomeDe(S.uid)||"";return c.k==="cit"?"Citação":(({opi:"Opinião de ",ana:"Análise de ",rel:"Relato de "})[c.k]||"")+nome}
function fc105Quando(at){const d=new Date(at||Date.now());const h=String(d.getHours()),m=String(d.getMinutes()).padStart(2,"0");return `hoje, ${h}h${m!=="00"?m:""}`}
/* desenha o cartão 1080×1920 (as bordas de cima e de baixo ficam livres para a barra do story) */
async function fc105CartaoCanvas(c,esc2){try{await Promise.all(['600 80px Newsreader','italic 500 80px Newsreader','400 40px "Public Sans"','800 30px "Public Sans"','600 30px "Public Sans"'].map(f=>document.fonts.load(f)))}catch(e){}
  const k=esc2||1,W=Math.round(1080*k),H=Math.round(1920*k),cv=document.createElement("canvas");cv.width=W;cv.height=H;const g=cv.getContext("2d");g.scale(k,k);
  const T=FC105_TEMAS.find(t=>t[0]===c.tema)||FC105_TEMAS[0],[,,bg,tx,kc,ac,mu]=T,X=104,LW=1080-2*X,SER="Newsreader, Georgia, serif",SANS='"Public Sans", system-ui, sans-serif';
  g.fillStyle=bg;g.fillRect(0,0,1080,1920);g.textBaseline="alphabetic";
  const cit=c.k==="cit",tit=String(c.tit||"").trim(),corpo=String(cit?"":c.tx||"").trim(),quem=String(c.quem||"").trim(),f=cn102Fonte(c.fu);
  const meta=c.k==="rel"?[String(c.onde||"").trim(),fc105Quando(c.at)].filter(Boolean).join(" · "):"";
  /* mede: título encolhe até caber; corpo idem */
  const topo=300,base=1600;let ts=cit?92:96,bs=46,tl=[],bl=[];
  const lh=(s,m)=>Math.round(s*m);
  const alt=()=>{let h=8+40+46;/* barrinha + chapéu */if(cit)h+=150;h+=tl.length*lh(ts,1.16);if(bl.length)h+=36+bl.length*lh(bs,1.45);if(meta)h+=30+44;if(cit&&quem)h+=40+50;if(f&&!f.u)h+=60+36;return h};
  const mede=()=>{g.font=cit?`italic 500 ${ts}px ${SER}`:`600 ${ts}px ${SER}`;tl=tit?edLinhas(g,tit,LW):[];g.font=`400 ${bs}px ${SANS}`;bl=corpo?edLinhas(g,corpo,LW):[];return alt()};
  let h=mede();while(h>base-topo&&(ts>56||bs>34)){if(ts>56&&(tl.length*lh(ts,1.16)>=bl.length*lh(bs,1.45)||bs<=34))ts-=4;else bs-=2;h=mede()}
  if(h>base-topo&&bl.length){const sobra=base-topo-(h-bl.length*lh(bs,1.45)),max=Math.max(1,Math.floor(sobra/lh(bs,1.45)));if(bl.length>max){bl=bl.slice(0,max);bl[max-1]=bl[max-1].replace(/\s+\S*$/,"")+"…"}h=alt()}
  let y=Math.max(topo,Math.round((topo+base)/2-h/2-40));
  g.fillStyle=ac;g.fillRect(X,y,72,8);y+=8+40+30;
  g.font=`800 30px ${SANS}`;try{g.letterSpacing="3px"}catch(e){}g.fillStyle=kc;g.fillText(fc105Kicker(c).toUpperCase().slice(0,44),X,y);try{g.letterSpacing="0px"}catch(e){}y+=16;
  if(cit){g.font=`600 220px ${SER}`;g.fillStyle=ac;g.fillText("“",X-14,y+190);y+=150}
  g.fillStyle=tx;g.font=cit?`italic 500 ${ts}px ${SER}`:`600 ${ts}px ${SER}`;tl.forEach(l=>{y+=lh(ts,1.16);g.fillText(l,X,y-lh(ts,.24))});
  if(meta){y+=30+44;g.font=`600 36px ${SANS}`;g.fillStyle=mu;g.fillText(meta.slice(0,60),X,y-8)}
  if(cit&&quem){y+=40+50;g.font=`700 38px ${SANS}`;g.fillStyle=tx;g.fillText("— "+quem.slice(0,40),X,y-8)}
  if(bl.length){y+=36;g.font=`400 ${bs}px ${SANS}`;g.fillStyle=tx;g.globalAlpha=.92;bl.forEach(l=>{y+=lh(bs,1.45);g.fillText(l,X,y-lh(bs,.4))});g.globalAlpha=1}
  if(f&&!f.u){y+=64;g.fillStyle=ac;g.fillRect(X,y-36,5,44);g.font=`600 34px ${SANS}`;g.fillStyle=mu;g.fillText(("Fonte: "+f.n).slice(0,52),X+24,y-1);y+=36}
  return cv}
function fc105CsHTML(){const c=FC105_C,cit=c.k==="cit";
  return `<div class="ce-selp fc105-csp" role="dialog" aria-label="Cartão de texto"><div class="fc105-csh"><b>Cartão de texto</b><small>A prévia aparece no story, acima</small></div>
    <div class="fc105-ks" role="tablist" aria-label="Tipo">${FC105_KS.map(([k,n])=>`<button type="button" role="tab" data-fc105k="${k}" aria-selected="${k===c.k}">${n}</button>`).join("")}</div>
    <textarea class="field fc105-tit" id="fc105-tit" data-fc105c="tit" rows="2" maxlength="${cit?200:140}" placeholder="${cit?"A frase, entre aspas":"Título"}">${esc(c.tit)}</textarea>
    ${cit?`<input class="field" id="fc105-quem" data-fc105c="quem" maxlength="40" placeholder="Quem disse (ex.: ministro da Fazenda)" value="${esc(c.quem)}" autocomplete="off">`
      :`<textarea class="field" id="fc105-tx" data-fc105c="tx" rows="3" maxlength="600" placeholder="${{opi:"O que você pensa, em poucas linhas",ana:"Os fatos, os números e o que eles indicam",rel:"O que você viu: o quê, onde, como"}[c.k]}">${esc(c.tx)}</textarea>`}
    ${c.k==="rel"?`<input class="field" id="fc105-onde" data-fc105c="onde" maxlength="40" placeholder="Onde (bairro, cidade)" value="${esc(c.onde)}" autocomplete="off">`:""}
    <input class="field" id="fc105-fu" data-fc105c="fu" maxlength="300" placeholder="${c.k==="rel"?"Fonte (opcional)":"Fonte: link ou nome (recomendado)"}" value="${esc(c.fu)}" autocomplete="off" inputmode="url">
    <div class="fc105-temas" role="radiogroup" aria-label="Fundo">${FC105_TEMAS.map(t=>`<button type="button" role="radio" data-fc105tema="${t[0]}" aria-checked="${t[0]===c.tema}" style="--a:${t[2]};--b:${t[3]};--c:${t[5]}"><i>Aa</i><span>${t[1]}</span></button>`).join("")}</div>
    <p class="fc105-cr">Aparece como “${esc(fc105Kicker(c))}”.</p>
    <div class="ce-selb"><button type="button" class="btn ghost" data-fc105csx>Cancelar</button><button type="button" class="btn" data-fc105csok>Usar</button></div></div>`}
function fc105CsAbre(dados){const ce=$("#layer .ce");if(!ce||!ED||ED.modo!=="story")return;$("#layer .ce-sel")?.remove();$("#layer .ce-fig")?.remove();
  FC105_C={...fc105CNovo(),...(dados||{})};
  if(ED.tela==="cam"){FC105_C.deCam=1;ED.st.bg={tipo:"grad",g:FC105_F0};ED.tela="edit";try{camDesliga()}catch(e){}edDesenha()}
  const ov=document.createElement("div");ov.className="ce-sel fc105-cs";ov.innerHTML=fc105CsHTML();ce.appendChild(ov);fc105CsPv();
  setTimeout(()=>{try{$("#fc105-tit")?.focus({preventScroll:true})}catch(e){}},60)}
function fc105CsRefaz(){const ov=$("#layer .fc105-cs");if(!ov)return;const a=document.activeElement&&document.activeElement.id;ov.innerHTML=fc105CsHTML();fc105CsPv();if(a)$("#"+a)?.focus()}
var FC105_PVT=0,FC105_PVN=0;
function fc105CsPv(){clearTimeout(FC105_PVT);FC105_PVT=setTimeout(async()=>{if(!FC105_C)return;const n=++FC105_PVN,v=await fc105CartaoCanvas(FC105_C,.4);if(n!==FC105_PVN||!FC105_C)return;
  const bg=$("#ce-cv .ce-bg");if(bg){bg.style.background=`url(${v.toDataURL("image/jpeg",.85)}) center/cover no-repeat`;bg.classList.add("fc105-pvbg")}
  const cr=$("#layer .fc105-cr");if(cr)cr.textContent=`Aparece como “${fc105Kicker(FC105_C)}”.`},80)}
function fc105CsSai(){const c=FC105_C;FC105_C=null;$("#layer .fc105-cs")?.remove();if(!ED)return;if(c&&c.deCam&&!ED.st.bg.fc105){ED.st.bg={tipo:"grad",g:FC105_F0};ED.tela="cam"}edDesenha()}
async function fc105CsOk(){const c=FC105_C;if(!c||!ED)return;if(!String(c.tit||"").trim()&&!String(c.tx||"").trim()){toast(c.k==="cit"?"Escreva a frase.":"Escreva o título ou o texto.");$("#fc105-tit")?.focus();return}
  const b=$("#layer [data-fc105csok]");if(b)b.disabled=true;
  try{const cv=await fc105CartaoCanvas(c),blob=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.9));const {img,url}=await edImg(blob);if(!ED||ED.modo!=="story")return;
    const st=ED.st;const c2={...c};delete c2.deCam;st.bg={tipo:"foto",blob,img,url,z:1,ox:0,oy:0,f:"normal",fc105:c2};
    /* fonte com link: vira a figurinha de link (dá para tocar); sem link, já está escrita no cartão */
    st.els=st.els.filter(e=>!e.fc105);const f=cn102Fonte(c.fu);if(f&&f.u)st.els.push({id:edNid(),t:"link",url:f.u,tit:("Fonte: "+f.n.replace(/^www\d*\./i,"")).slice(0,30),x:.5,y:.85,s:.8,r:0,fc105:1});
    FC105_C=null;$("#layer .fc105-cs")?.remove();ED.tela="edit";try{camDesliga()}catch(e){}edDesenha();vibrar&&vibrar(8)}
  catch(e){toast("Não deu para criar o cartão.");if(b)b.disabled=false}}
document.addEventListener("input",e=>{const t=e.target;if(!FC105_C||!t.closest||!t.closest("#layer .fc105-cs"))return;if(t.dataset.fc105c){FC105_C[t.dataset.fc105c]=t.value;fc105CsPv()}},true);

/* ===== 5. foto do que aconteceu: atalhos de contexto ===== */
const FC105_CTX=[["local","Local",FC105_ICO.local],["hora","Hora",FC105_ICO.hora],["link","Fonte",FC105_ICO.link],["nt","Notícia",CN102_ICO.nt]];
function fc105Ctx(el){const st=ED&&ED.st;if(!st||ED.tela==="cam")return;const b=st.bg;el.querySelector(".fc105-ctx")?.remove();
  if(!(b.tipo==="foto"||b.tipo==="video")||b.fc105||st.tx)return;const tem=new Set(st.els.map(e=>e.t)),ks=FC105_CTX.filter(([k])=>!tem.has(k));if(!ks.length)return;
  const bot=el.querySelector(".ce-bot");if(!bot)return;bot.insertAdjacentHTML("beforebegin",`<div class="fc105-ctx" role="group" aria-label="Contexto do que aconteceu">${ks.map(([k,n,d])=>`<button type="button" data-fc105ctx="${k}">${fc105Svg(d)}${n}</button>`).join("")}</div>`)}
function fc105CtxAbre(k){if(!ED||!$("#layer .ce"))return;edFigs();const b=$(`#layer .ce-fig [data-edfig="${k}"]`);if(b)b.click();else $("#layer .ce-fig")?.remove()}

/* ===== 6. instala ===== */
if(FOCO_LIGADO){
  document.documentElement.classList.add("foco");
  try{fc105Listas()}catch(e){console.error(e)}
  {const _pf=pubFundo;pubFundo=function(i){const n=+i||0;if(FC105_F0>=0&&n>=FC105_F0&&n<PUB_FUNDOS.length){const f=PUB_FUNDOS[n];return `linear-gradient(160deg,${f[0]},${f[1]})`}
    const f=PUB_FUNDOS[n%(FC105_F0>0?FC105_F0:PUB_FUNDOS.length)];return f?`linear-gradient(160deg,${f[0]},${f[1]})`:_pf.apply(this,arguments)}}
  {const _ns=edNovoSt;edNovoSt=function(){const s=_ns.apply(this,arguments);if(s&&s.bg&&s.bg.tipo==="grad")s.bg.g=FC105_F0;return s}}
  {const _ct=edCamTela;edCamTela=function(el){const r=_ct.apply(this,arguments);try{fc105Rail(el)}catch(e){console.error(e)}return r}}
  {const _es=edStory;edStory=function(el){const st=ED&&ED.st;if(st&&st.bg&&st.bg.tipo==="grad")st.bg.g=fc105Sobrio(st.bg.g);const r=_es.apply(this,arguments);
    try{if(st&&st.bg&&st.bg.fc105){const sp=el.querySelector(".ce-top .sp");if(sp&&!el.querySelector("[data-fc105ed]"))sp.insertAdjacentHTML("beforebegin",`<button type="button" class="ce-chip fc105-edc" data-fc105ed>${fc105Svg(FC105_ICO.ed)}Editar cartão</button>`);
        el.querySelector("[data-edsemfoto]")?.remove()}
      fc105Ctx(el)}catch(e){console.error(e)}return r}}
  /* notícia no story: fundo da editoria */
  {const _sn=cn102StoryComNt;cn102StoryComNt=function(pid){const r=_sn.apply(this,arguments);try{const p=pautaById(pid);if(p&&ED&&ED.st&&ED.st.bg.tipo==="grad"){ED.st.bg.g=fc105FundoSec(secOf(p));edDesenha()}}catch(e){}return r}}
  /* texto do cartão vai junto (acessibilidade, busca e avisos) */
  {const _ex=edExportaStory;edExportaStory=function(st){FC105_ST=st||(ED&&ED.st)||null;return _ex.apply(this,arguments)}}
  {const _ps=edPublicaStory;edPublicaStory=async function(){if(!ED||!SB||!(ED.sts||[ED.st]).some(s=>s&&s.bg&&s.bg.fc105))return _ps.apply(this,arguments);
    const _from=SB.from;SB.from=function(tb){const q=_from.apply(this,arguments);if(tb==="publicacoes"&&q&&typeof q.insert==="function"&&!q._fc105){const ins=q.insert;q._fc105=1;q.insert=function(row){try{const c=FC105_ST&&FC105_ST.bg&&FC105_ST.bg.fc105;
      if(c)(Array.isArray(row)?row:[row]).forEach(r=>{if(r&&r.tipo==="story"&&!String(r.texto||"").trim())r.texto=fc105Alt(c)})}catch(e){}return ins.apply(this,arguments)}}return q};
    try{return await _ps.apply(this,arguments)}finally{SB.from=_from}}}
  /* post: aviso com a regra da casa e pedido de fonte na análise */
  {const _cd=cn102Det;cn102Det=function(el){const r=_cd.apply(this,arguments);try{const a=el.querySelector(".cn102-aviso");if(a&&!a.querySelector(".fc105-regra"))a.insertAdjacentHTML("beforeend",`<span class="fc105-regra">Discuta as ideias, com respeito às pessoas.</span>`);
      const fu=el.querySelector("#cn102-fu");const P=ED&&ED.po;if(fu&&P&&P.cn&&P.cn.k==="ana"){fu.placeholder="Link ou nome da fonte (recomendado)";if(P._fc105fu)fu.closest(".ce-row")?.classList.add("fc105-pede")}}catch(e){}return r}}
  {const _pp=edPublicaPost;edPublicaPost=async function(){const P=ED&&ED.po;try{if(P&&P.cn&&P.cn.k==="ana"&&!ED.env&&!P._fc105fu&&!String(P.cn.fu||"").trim()&&!(P.cn.d&&P.cn.d.tipo==="ind")&&!cn102Valida(P)){
      P._fc105fu=1;edDesenha();const i=$("#cn102-fu"),row=i&&i.closest(".ce-row");if(row){row.insertAdjacentHTML("afterend",`<p class="fc105-pedet" role="status">De onde vêm as informações? Uma fonte dá mais confiança a quem lê. Se não tiver, toque em Publicar de novo.</p>`);row.scrollIntoView({block:"center"});try{i.focus({preventScroll:true})}catch(e){}}return}}catch(e){}
    return _pp.apply(this,arguments)}}
  /* bandeja: busca só de figurinhas */
  {const _fg=edFigs;edFigs=function(){const r=_fg.apply(this,arguments);try{const q=$("#ce-figq");if(q)q.placeholder="Buscar figurinhas"}catch(e){}return r}}
  /* perfil vazio: o convite fala de conteúdo */
  {const _pt=pfTiles;pfTiles=function(){const h=_pt.apply(this,arguments);return typeof h==="string"?h.replace("Compartilhe sua primeira publicação.","Comente uma notícia ou conte o que aconteceu perto de você."):h}}
  /* matéria: convite para comentar no fim */
  {const _am=abrirMateria;abrirMateria=function(pid){const r=_am.apply(this,arguments);try{fc105Mat(pid)}catch(e){}return r}}
}
function fc105Mat(pid){const m=$("#layer .mat");if(!m||m.querySelector(".fc105-mc")||!S.membro||PUB.on===false||!pautaById(pid))return;const ref=m.querySelector(".mat-pe,.mat-prox,.mat-rod");if(!ref)return;
  ref.insertAdjacentHTML("beforebegin",`<div class="fc105-mc gut"><p><b>O que você acha?</b> Comente esta notícia com seus amigos.</p><div class="fc105-mcb"><button type="button" class="btn" data-cn102envp="${esc(pid)}">${fc105Svg(CN102_ICO.ana)}Publicar comentário</button><button type="button" class="btn ghost" data-cn102envs="${esc(pid)}">${fc105Svg(CN102_ICO.story)}No story</button></div></div>`)}

/* ===== 7. cliques ===== */
window.addEventListener("click",e=>{if(!FOCO_LIGADO)return;const t=e.target;if(!t||!t.closest||!ED||!$("#layer .ce")||t.closest("#layer2"))return;let b;
  const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  if(ED.env&&t.closest("[data-fc105txt],[data-fc105ind],[data-fc105ed],[data-fc105ctx]")){pare();return}
  if(t.closest("[data-fc105txt]")){pare();fc105CsAbre(null);return}
  if(t.closest("[data-fc105ed]")){pare();fc105CsAbre(ED.st.bg.fc105);return}
  if(t.closest("[data-fc105ind]")){pare();fc105ParaEdicao(FC105_F0);setTimeout(()=>cn102DpAbre("story"),30);return}
  if(b=t.closest("[data-fc105ctx]")){pare();fc105CtxAbre(b.dataset.fc105ctx);return}
  if(t.closest("#layer .fc105-cs")){
    if(b=t.closest("[data-fc105k]")){pare();const ant=FC105_C.k;FC105_C.k=b.dataset.fc105k;if(FC105_C.k==="cit"&&ant!=="cit"&&!FC105_C.quem&&FC105_C.tx.length<40)FC105_C.quem=FC105_C.tx;fc105CsRefaz();return}
    if(b=t.closest("[data-fc105tema]")){pare();FC105_C.tema=b.dataset.fc105tema;fc105CsRefaz();return}
    if(t.closest("[data-fc105csok]")){pare();fc105CsOk();return}
    if(t.closest("[data-fc105csx]")){pare();fc105CsSai();return}
    if(t===t.closest(".fc105-cs")){pare();fc105CsSai();return}}},true);
