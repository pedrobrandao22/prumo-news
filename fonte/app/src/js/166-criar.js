/* ---------- 166: criar, achados do testador (16/11, noite) ----------
   (as correções da foto na caixa ficaram no próprio 164)
   1. Toque duplo em Publicar: o 2º toque caía no ícone do cabeçalho do Feed (Atividade, Busca). Por 0,7 s depois de
      tocar em Publicar, toques fora da tela de criar são ignorados.
   2. Avisos dos formulários (Enquete, De perto, Número): aparecem embaixo do campo que falta, com borda vermelha, em vez de
      subir no alto da tela por cima da pergunta. Enquete com opções iguais ("Sim" e "sim ") não publica.
   3. Sem internet: o cartão do Feed já diz "vamos publicar quando a internet voltar"; o aviso "Não deu para publicar. Tente
      de novo." não aparece mais junto, e o cartão fica só com "Descartar" (com rede mas falha de conexão: "Publicar agora").
   4. Coluna: a ajuda diz "Toque no texto e depois em +"; sem título, "Publicar" não abre "Antes de publicar": marca o campo
      Título e põe o cursor nele; na prévia, sem título, um link "Escrever o título ›" em vez da frase numa caixa.
   5. Giro: os ícones do menu (Notícia, Texto, Indicador, Livre) acompanham a borda do cartão do giro.
   6. Número: o gráfico do indicador termina no mesmo dia do título (o valor do dia entra como último ponto).
   Nomes com o prefixo cr166. */
var CR166={pubT:0};

/* ===== 1. toque duplo em Publicar ===== */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest("#layer [data-cp152pub],#layer [data-edpubpo],#layer .ce-pub,#layer .cn102-pub,#layer .cfp-shb")){CR166.pubT=Date.now();return}
  if(Date.now()-CR166.pubT<700&&!t.closest("#layer,#layer2,.toast,#pq")){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()}},true);
{const _cp166=cp152Publica;cp152Publica=function(){CR166.pubT=Date.now();return _cp166.apply(this,arguments)}}

/* ===== 2. avisos junto do campo ===== */
const cr166Nm=v=>String(v||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim().toLowerCase();
function cr166Dups(cn){const vs=(cn.o||[]).map(cr166Nm),d=[];vs.forEach((v,i)=>{if(v&&vs.indexOf(v)!==i)d.push(i)});return d}
{const _va166=cn102Valida;cn102Valida=function(P){const r=_va166.apply(this,arguments);try{const cn=P&&P.cn;if(!r&&cn&&cn.k==="enq"&&cr166Dups(cn).length)return "Duas opções estão iguais. Troque uma delas."}catch(e){}return r}}
function cr166Limpa(){document.querySelectorAll("#layer .cr166-er").forEach(x=>x.remove());document.querySelectorAll("#layer .cr166-erc").forEach(x=>x.classList.remove("cr166-erc"))}
function cr166Erro(er,P){const ce=$("#layer .ce");if(!ce||!P||!P.cn)return false;cr166Limpa();let alvo=null,marca=[];
  if(/opç/i.test(er)){alvo=ce.querySelector(".cn102-ops");const ins=[...ce.querySelectorAll("input[data-cn102o]")];
    const d=/iguais/.test(er)?cr166Dups(P.cn):[];marca=d.length?d.map(i=>ins[i]).filter(Boolean):ins.filter(i=>!i.value.trim())}
  else if(/pergunta|título|relato|análise|viu/i.test(er)){alvo=ce.querySelector("#cn102-tit");if(alvo)marca=[alvo]}
  if(!alvo)return false;marca.forEach(i=>(i.closest(".cn102-op")||i).classList.add("cr166-erc"));
  const p=document.createElement("p");p.className="cr166-er";p.setAttribute("role","alert");p.textContent=er;alvo.insertAdjacentElement("afterend",p);
  try{p.scrollIntoView({block:"center",behavior:"smooth"})}catch(e){}
  const f=marca[0]||alvo;setTimeout(()=>{try{if(f.focus)f.focus({preventScroll:true})}catch(e){}},80);return true}
{const _ep166=edPublicaPost;edPublicaPost=async function(){if($("#layer .ce"))CR166.pubT=Date.now();
  try{const P=ED&&ED.po;if(P&&P.cn&&!ED.env&&$("#layer .ce")){const er=cn102Valida(P);if(er&&cr166Erro(er,P))return}}catch(e){}
  return _ep166.apply(this,arguments)}}
document.addEventListener("input",e=>{const t=e.target;if(t&&t.closest&&t.closest("#layer .ce")&&document.querySelector("#layer .cr166-er"))cr166Limpa()},true);

/* ===== 3. sem internet: uma mensagem só ===== */
{const _to166=toast;toast=function(m){try{if(typeof m==="string"&&/^Não deu para publicar\. Tente de novo\.$/.test(m)&&navigator.onLine===false&&typeof PQ!=="undefined"&&(PQ.atual||PQ.jobs.length))return}catch(e){}return _to166.apply(this,arguments)}}
{const _pd166=pqDesenha;pqDesenha=function(){const r=_pd166.apply(this,arguments);try{const box=$("#pq");if(box)PQ.jobs.forEach(j=>{if(j.estado!=="erro"||!cr155SemRede(j))return;const b=box.querySelector(`[data-pqtenta="${j.id}"]`);if(!b)return;
    if(navigator.onLine===false)b.remove();else b.textContent="Publicar agora"})}catch(e){}return r}}
addEventListener("offline",()=>{try{if(PQ.jobs.some(j=>j.estado==="erro"))pqDesenha()}catch(e){}});
addEventListener("online",()=>{try{if(PQ.jobs.some(j=>j.estado==="erro"))pqDesenha()}catch(e){}});

/* ===== 4. coluna ===== */
{const _ar166=cr137Arruma;cr137Arruma=function(){const r=_ar166.apply(this,arguments);try{const cp=cr137Cp();if(cp)cp.setAttribute("data-ph","Comece a escrever. Toque no texto e depois em + para foto, gráfico, citação ou lista, ou use ## título, > citação, - lista.")}catch(e){}return r}}
function cr166ColTit(){const t=$("#layer > .ed132 #ed132-tit");if(!t)return;$("#layer > .ed132 .ed132-pp")?.remove();t.classList.add("cr166-erc");
  let p=$("#layer > .ed132 .cr166-er");if(!p){p=document.createElement("p");p.className="cr166-er";p.setAttribute("role","alert");p.textContent="Dê um título à coluna para publicar.";(t.parentElement.querySelector(".cr137-tl")||t).insertAdjacentElement("afterend",p)}
  try{t.scrollIntoView({block:"center",behavior:"smooth"})}catch(e){}setTimeout(()=>{try{t.focus({preventScroll:true})}catch(e){}},60)}
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest("#layer > .ed132 [data-ed132painel]")){const E=ED132.E;if(!E||E.env)return;try{ed132Le()}catch(_){}if(!String(E.tit||"").trim()){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();cr166ColTit()}return}
  if(t.closest("#layer > .ed132 [data-cr166tit]")){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();cr166ColTit()}},true);
document.addEventListener("input",e=>{const t=e.target;if(t&&t.id==="ed132-tit"&&t.value.trim()){t.classList.remove("cr166-erc");$("#layer > .ed132 .cr166-er")?.remove()}},true);
{const _pc166=ed132PainelCard;ed132PainelCard=function(){const r=_pc166.apply(this,arguments);try{const b=$("#layer > .ed132 .ed132-pp .ed132-pvf");const E=ED132.E;
    if(b&&E&&!String(E.tit||"").trim())b.innerHTML=`<button type="button" class="cr166-lk" data-cr166tit>Escrever o título ›</button>`}catch(e){}return r}}

/* ===== 5. giro: menu dentro do cartão ===== */
function cr166Rail(){const ce=$("#layer .ce.ce-story");if(!ce)return;const rail=ce.querySelector(".ce-rail"),cv=ce.querySelector("#ce-cv");if(!rail||!cv)return;
  const a=cv.getBoundingClientRect(),b=ce.getBoundingClientRect();if(!a.width)return;const l=Math.round(a.left-b.left+12);rail.style.left=l>10?l+"px":""}
{const _ed166=edDesenha;edDesenha=function(){const r=_ed166.apply(this,arguments);try{if(ED&&ED.modo==="story"){cr166Rail();requestAnimationFrame(cr166Rail)}}catch(e){}return r}}
addEventListener("resize",()=>{try{cr166Rail()}catch(e){}});

/* ===== 6. número: a linha vai até o dia do título ===== */
function cr166Num(v){let s=String(v||"").replace(/[^\d,.\-]/g,"");if(!s)return NaN;if(s.indexOf(",")>=0)s=s.replace(/\./g,"").replace(",",".");else if(/^\-?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,"");return parseFloat(s)}
{const _id166=cn102IndDado;cn102IndDado=function(x){const d=_id166.apply(this,arguments);try{const ult=d.r[d.r.length-1]||"",v=cr166Num(d.val);
    if(d.dt&&/^\d{4}-\d{2}-\d{2}$/.test(ult)&&d.dt>ult&&isFinite(v)&&d.s.length>=2){d.s.push(+v.toPrecision(6));d.r.push(d.dt);if(d.s.length>30){d.s.shift();d.r.shift()}}}catch(e){}return d}}
