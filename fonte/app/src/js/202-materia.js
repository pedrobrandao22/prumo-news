/* ---------- 202: Matéria (Fase 3) — a tela da notícia aberta num módulo só ----------
   Antes: abrirMateria definida no 031 e remendada em 034, 036, 038, 059, 063, 105, 111, 113, 119, 120, 158, 168, 182 e 186;
   matIr (033, trocada no 034, remendada em 063 e 168); matProx (033 + 063); matTempo (033 + 104, 116, 144);
   matVisuais (033 + 118); f113Caps (113 + 118, 143); f113CapVai/f113CapAtual/f113CapMarca (113 + 158, 168);
   fc105Mat (105 + 106); abrirCobertura, a folha "Quem noticiou" (008, trocada no 158, + 168, 182); abrirPagCob, a página
   da cobertura (031 + 031, 089, 126, 158, 168, 183). Aqui cada uma é a versão final, com o que a cadeia fazia (nada muda para quem usa).
   Ficam onde estão os auxiliares sem remendo (matDesfecho, matCorBloco, matRel, matProgresso, htNaMateria, mt158*,
   cm168*, ft182Linha/ft182Esp0, po118*, mc1111Tempo, rc116Data, cb183Pinta, qb126MarcaDepois…), as variáveis (MAT_PID, MAT_ORIG, MT158_CAPTAP,
   CM168_PILHA, F113_IO…) e os remendos de outras áreas (closeLayer, go). Só declarações function: a posição no
   pagina.html não importa para quem chama (içadas). Prefixo de nomes novos: mt202. */

/* ===== abrir a matéria ===== */
function abrirMateria(pid,manter){
  /* 186: números dos indicadores em dia antes de desenhar */
  nm186EmDia();
  /* 158: atualizações com o mesmo texto juntam (só durante o desenho) */
  if(!manter||pid!==MAT_PID)MT158_CAPTAP=null;const p=pautaById(pid);const ups=p&&p.atualizacoes;if(p&&Array.isArray(ups))p.atualizacoes=mt158Ups(ups);
  try{
    /* 038: termos do glossário marcados uma vez por matéria */
    window.MT_USADOS=new Set();
    try{
      const vazio=!$("#layer").innerHTML;
      mt202Monta(pid,manter);
      /* 119: matéria aberta antes do detalhe: sinal de que o resto está chegando */
      {if(FL119.parcial){fl119Completar();const m=document.querySelector("#layer .mat .mat-p");if(m&&!m.querySelector(".fl119-sk"))m.insertAdjacentHTML("beforeend",`<div class="cp-sk fl119-sk" role="status" aria-label="Carregando o resto da matéria"><i style="height:14px;width:92%"></i><i style="height:14px;width:84%"></i><i style="height:14px;width:60%"></i></div>`)}}
      /* 034: entrada animada quando a camada estava vazia */
      {const m=$("#layer .mat");if(m&&vazio&&ANIM_OK())m.classList.add("mat-entra");}
      /* 036: barra de progresso e foco no título */
      {try{matProgresso();if(!manter){const h=$("#layer .mat h1");if(h){h.tabIndex=-1;h.focus({preventScroll:true})}}}catch(e){}}
    }finally{window.MT_USADOS=null}
    /* 059: aberta pelo giro: "‹ Giro" */
    {if(IG_VOLTA&&document.getElementById("sg-fundo")){const b=$("#layer .mat-v");if(b){b.textContent="‹ Giro";b.setAttribute("aria-label","Voltar para o giro")}}}
    /* 063: o botão de voltar diz de onde veio */
    {try{if(!document.getElementById("sg-fundo")){const b=$("#layer .mat-v"),n=VOLTA_NOME[VIEW]||"";if(b&&n){b.textContent="‹ "+n;b.setAttribute("aria-label","Voltar para "+(VIEW==="busca"?"a Busca":VIEW==="saved"?"Guardadas":VIEW==="me"?"o Perfil":VIEW==="msgs"?"Conversas":VIEW==="feed"?"o Feed":"a Capa"))}}}catch(e){}}
    /* 105: convite para comentar no fim */
    {try{fc105Mat(pid)}catch(e){}}
    /* 111: hashtags da notícia */
    {try{htNaMateria(pid)}catch(e){}}
    /* 113: capítulos ("Nesta matéria") e Perguntas */
    {try{f113Caps()}catch(e){console.error(e)}}
    /* 120: tempo de leitura só com o texto (detalhe ainda chegando) */
    {try{if(FL119.parcial)document.querySelectorAll("#layer .mat-meta span").forEach(s=>{if(/min de leitura/.test(s.textContent))s.classList.add("ta120-esp")})}catch(e){}}
  }finally{if(p&&Array.isArray(ups))p.atualizacoes=ups}
  /* 158: seguir a cobertura e a nota da agenda */
  {try{const m=document.querySelector("#layer .mat");if(m&&p){const b=m.querySelector(".mat-pe [data-cobpag]");if(b&&temaDe(p))b.outerHTML=mt158SegBt(p);
    const ag=MT158_AG;MT158_AG=null;if(ag&&ag.pid===pid&&Date.now()-ag.t<4000&&!m.querySelector(".mt158-ag")){const tx=m.querySelector(".mat-tx");const tema=temaDe(p)||capaChapeu(p);
      if(tx)tx.insertAdjacentHTML("afterbegin",`<div class="mt158-ag" role="note"><b>Na agenda${ag.dia?" · "+esc(ag.dia):""}</b><span>${esc(ag.texto)}</span><small>Ainda não há notícia só sobre esse evento. Abaixo, a cobertura ligada a ele: <b>${esc(tema)}</b>.</small></div>`)}}}catch(e){}}
  /* 168: endereço #m=, notas de notícia velha / "o que vem" e volta ao ponto de leitura */
  {try{if($("#layer .mat")&&MAT_PID===pid){cm168Url(pid);cm168MatExtra(pid);
    const ra=CM168_REAB;if(ra&&ra.pid===pid&&Date.now()-ra.t<6*3600e3){CM168_REAB=null;const vai=()=>{const m=$("#layer .mat");if(m&&MAT_PID===pid)cm168Restaura(m,ra.a)};setTimeout(vai,60);setTimeout(vai,400);setTimeout(vai,1200)}
    else if(!manter)CM168_ANC=null}}catch(e){}}
  /* 182: "Resumo" e a linha "Noticiado por" */
  {try{const p=pautaById(pid),m=$("#layer .mat");
    if(p&&m){const b30=m.querySelector(".mat-30>b");if(b30&&FT182_EM1MIN&&/^Em 30 segundos$/.test(b30.textContent))b30.textContent="Resumo";
      m.querySelectorAll(".mat-rod [data-cpfontes]").forEach(b=>b.remove());const tx=ft182Linha(p),meta=m.querySelector(".mat-meta");
      if(tx&&meta&&!m.querySelector(".ft182-qn"))meta.insertAdjacentHTML("afterend",`<button type="button" class="ft182-qn" data-cpfontes="${esc(p.id)}" aria-haspopup="dialog">${esc(tx)}<i aria-hidden="true">›</i></button>`)}}catch(e){}}
}

/* ===== o desenho (o que o 031 fazia) ===== */
function mt202Monta(pid,manter){const p=pautaById(pid);if(!p)return;const L=lente(),v=versao(p,L),n=p.neutro||{},id=esc(p.id);
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
  /* 19/11 noite (Pedro): o "Em 30 segundos" já aparece na Capa ao abrir a notícia; na matéria, só enquanto o texto ainda carrega */
  if(!String(v.texto||"").trim())h+=`<div class="cpx-30 mat-30"><b>Em 30 segundos</b><ul>${pontosDe(p,L).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`;
  h+=frases(v.texto).length>3?`<div class="mat-p">${v.texto.split(/\n+/).map(x=>`<p>${marcarTermos(x)}</p>`).join("")}</div>`:`<div class="mat-p"><p>${marcarTermos(v.texto)}</p></div>`;
  h+=matCorBloco(p);h+=matVisuais(p);
  if(v.tem&&n.texto)h+=`<div class="cpx-neutro"><b>O fato, sem enquadramento</b><p>${esc(n.texto)}</p></div>`;
  /* 19/11 noite: "Como cada lado conta" desceu para o fim da matéria (ct210LadosHTML) */
  const es=Array.isArray(p.essencial)?p.essencial.filter(x=>typeof x==="string"&&x):[];
  if(es.length)h+=`<div class="cpx-bl"><b>O essencial</b><ul>${es.slice(0,5).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`;
  if(p.contexto)h+=`<p class="cpx-c"><b>Contexto</b>${marcarTermos(p.contexto)}</p>`;
  if(p.proximo)h+=`<p class="cpx-c"><b>O que vem agora</b>${marcarTermos(p.proximo)}</p>`;
  h+=matTempo(p);
  try{h+=ct210LadosHTML(p,L)}catch(e){}
  const ups=(Array.isArray(p.atualizacoes)?p.atualizacoes:[]).filter(x=>x&&x.texto).slice().sort((a,b)=>tms(b.hora)-tms(a.hora));
  if(ups.length)h+=`<div class="cpx-bl"><b>Atualizações</b><ul class="cpx-up">${ups.map(x=>`<li><time>${esc(horaDia(x.hora))}</time>${esc(x.texto)}</li>`).join("")}</ul></div>`;
  const nx=matProx(p.id);h+=matRel(p,nx);
  h+=`<div class="mat-pe">${nx?`<button type="button" class="mat-prox" data-matprox="${esc(nx.id)}"><span>Próxima</span><b>${esc(versao(nx,L).titulo)}</b><i aria-hidden="true">›</i></button><small class="mat-dica">ou deslize para o lado</small>`:""}${typeof cobTemPagina==="function"&&cobTemPagina(p)?`<button type="button" class="btn ghost" data-cobpag="${id}">Acompanhar esta cobertura</button>`:""}<div class="mat-rod"><button type="button" class="cpx-fontes" data-cpfontes="${id}">Fontes e quem noticiou ›</button>${f&&f.credito?`<span class="cpx-fontes">${esc(creditoCurto(f.credito))}</span>`:""}<button type="button" class="cpx-fontes" data-capair="${id}">Ver no feed</button></div></div></div></article></div>`;
  Ly.innerHTML=h;const m=Ly.querySelector(".mat");if(!manter&&m)m.scrollTop=0;
  if(vazio&&pushH())HST++
  /* 19/11: a arte espera a foto (ver mt202Espera, no fim) */
  try{mt202Espera()}catch(e){}}

/* ===== Próxima / deslizar ===== */
function matIr(pid){
  /* 168: guarda de onde veio (o voltar do celular volta para ela) */
  try{const m=$("#layer .mat"),de=MAT_PID;if(m&&de&&pid!==de&&pautaById(pid)&&!(($("#layer2")||{}).innerHTML)){CM168_PILHA.push({pid:de,y:m.scrollTop});if(pushH())HST++}}catch(e){}
  /* 063: aberta pelo giro: o giro anda junto */
  if(IG_VOLTA&&Array.isArray(IG_VOLTA.ids)){const k=IG_VOLTA.ids.indexOf(pid);if(k>=0)IG_VOLTA.i=k}
  /* 034: a anterior sai para a esquerda e a nova entra */
  if(!pautaById(pid))return;if(!MAT_ORIG)MAT_ORIG=MAT_PID;const old=$("#layer .mat");if(old&&ANIM_OK()){old.style.transform="";saidaClone(old,"sai-esq",360)}
  abrirMateria(pid);const m=$("#layer .mat");if(m){m.scrollTop=0;m.style.transform="";if(ANIM_OK()){m.classList.remove("mat-entra");void m.offsetWidth;m.classList.add("mat-entra")}}}

/* ===== qual é a próxima ===== */
function matProx(pid){/* 063: aberta pelo giro: a próxima é a próxima do giro */
  if(IG_VOLTA&&document.getElementById("sg-fundo")&&Array.isArray(IG_VOLTA.ids)){const ids=IG_VOLTA.ids.filter(x=>!/#v$/.test(x)&&!/^(ag|h\d)/.test(x));const i=ids.indexOf(pid);const nx=i>=0?ids[i+1]:null;return nx?pautaById(nx):null}
  const ids=capaOrdemIds(),i=ids.indexOf(pid);const rest=ids.slice(i+1).concat(i>=0?ids.slice(0,i):[]).map(pautaById).filter(Boolean);return rest.find(p=>!lidaAtual(p))||(i>=0?pautaById(ids[i+1]):null)||null}

/* ===== quadro de números, gráficos e pesquisas ===== */
function matVisuais(p){const o=(Array.isArray(p.visuais)?p.visuais:[]).filter(v=>v&&["grafico","numeros","pesquisas"].includes(v.tipo)).map(v=>{let x="";try{x=visualHTML({...v,secao:secOf(p)})}catch(e){}return x?`<div class="mat-vis">${x}</div>`:""}).join("");
  /* 118: o placar oficial vem antes dos outros gráficos */
  let h="";try{h=po118MatHTML(p)}catch(e){h=""}return h+o}

/* ===== linha do tempo ===== */
function matTempo(p){
  /* 144: data futura que já ficou para trás vira data com ano (só para a linha do tempo) */
  try{p=mc1111Tempo(p)}catch(e){}
  const h0=(()=>{const vt=(Array.isArray(p.visuais)?p.visuais:[]).find(v=>v&&v.tipo==="linha_do_tempo"&&Array.isArray(v.itens)&&v.itens.length>=2);let its=[],tit="Como a história andou";
  if(vt){tit=vt.titulo||tit;its=vt.itens.filter(i=>i&&i.texto).map(i=>({q:String(i.quando||""),t:String(i.texto)}))}
  else{const ts=(Array.isArray(p.titulos)?p.titulos:[]).filter(x=>x&&x.titulo&&x.hora);if(ts.length>=3&&tms(ts[ts.length-1].hora)-tms(ts[0].hora)>36*3600e3)its=ts.map(x=>({q:dataCurta(String(x.hora).slice(0,10)),t:x.titulo}))}
  if(its.length<2)return "";return `<div class="mat-tl"><b>${esc(tit)}</b><ol>${its.slice(-7).map((i,k,a)=>`<li${k===a.length-1?' class="ult"':""}><time>${esc(i.q)}</time><span>${esc(i.t)}</span></li>`).join("")}</ol></div>`})();
  /* 104: data que ainda vai acontecer aparece como próximo passo */
  const h1=(h=>{if(!h)return h;try{const tp=document.createElement("template");tp.innerHTML=h;
  const hj=hojeSP(),ano=hj.slice(0,4),lis=[...tp.content.querySelectorAll("li")];let fut=0;
  lis.forEach(li=>{const m=String(li.querySelector("time")?.textContent||"").trim().match(/^(\d{1,2})\/(\d{1,2})$/);if(m&&`${ano}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`>hj){li.classList.add("fut");li.classList.remove("ult");fut++}});
  if(fut){const pas=lis.filter(li=>!li.classList.contains("fut"));if(pas.length)pas[pas.length-1].classList.add("ult")}
  return fut?tp.innerHTML:h}catch(e){return h}})(h0);
  /* 116: datas por extenso, datetime e o ponto atual */
  return (h=>{if(!h)return h;try{const tp=document.createElement("template");tp.innerHTML=h;
  const hj=hojeSP(),ano=hj.slice(0,4),lis=[...tp.content.querySelectorAll(".mat-tl li")];if(!lis.length)return h;let mudou=false;
  lis.forEach(li=>{const t=li.querySelector("time");if(!t)return;const d=rc116Data(t.textContent,hj);if(!d)return;
    if((d.ini||d.iso)>hj&&!li.classList.contains("fut")){li.classList.add("fut");mudou=true}
    /* período que já começou ("16 a 20/11" em 18/11): acontecendo, não futuro */
    if(d.ini&&d.ini<=hj&&li.classList.contains("fut")){li.classList.remove("fut");mudou=true}
    if(d.so){const tx=dataCurta(d.iso)+(d.iso.slice(0,4)!==ano?" de "+d.iso.slice(0,4):"");if(tx&&tx!==t.textContent){t.textContent=tx;mudou=true}}
    if(!t.hasAttribute("datetime")){t.setAttribute("datetime",d.iso);mudou=true}});
  if(!mudou)return h;
  /* o ponto atual é o último que já aconteceu */
  lis.forEach(li=>li.classList.remove("ult"));{let vf=false;lis.forEach(li=>{const tm=li.querySelector("time");if(li.classList.contains("fut"))vf=true;else if(vf&&tm&&!tm.getAttribute("datetime"))li.classList.add("fut")})}/* rótulo sem data ("Depois") depois de um ponto futuro também é futuro */const pas=lis.filter(li=>!li.classList.contains("fut"));(pas.length?pas[pas.length-1]:null)?.classList.add("ult");
  return tp.innerHTML}catch(e){return h}})(h1)}

/* ===== índice de capítulos ("Nesta matéria") ===== */
function f113Caps(){(()=>{if(F113_IO){try{F113_IO.disconnect()}catch(e){}F113_IO=null}const m=$("#layer .mat"),c=m&&m.querySelector(".mat-c"),p=typeof MAT_PID!=="undefined"&&pautaById(MAT_PID);if(!c||!p)return;
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
  /* a lista de atualizações vem depois das Perguntas: sem capítulo próprio, o fim da matéria ficava marcado como "Perguntas" (14/11) */
  add([...c.querySelectorAll(".cpx-bl")].find(e=>/^Atualizações/.test((e.querySelector("b")||{}).textContent||"")),"Atualizações");
  if(caps.length<2)return;
  caps.sort((x,y)=>x.el.compareDocumentPosition(y.el)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
  caps.forEach((x,i)=>{x.el.id="fs2c-"+i;x.el.classList.add("fs2-alvo");if(!x.el.hasAttribute("tabindex"))x.el.tabIndex=-1});
  caps[0].el.insertAdjacentHTML("beforebegin",`<nav class="fs2-cap" aria-label="Nesta matéria"><span class="fs2-cap-k" aria-hidden="true">Nesta matéria</span><ol class="fs2-cap-l">${caps.map((x,i)=>`<li><button type="button" class="fs2-cap-b" data-f113cap="${i}" aria-controls="fs2c-${i}"${i===0?' aria-current="true"':""}><i aria-hidden="true">${i+1}</i>${esc(x.nome)}</button></li>`).join("")}</ol></nav>`);
  if("IntersectionObserver" in window){const off=f113Off(m);
    F113_IO=new IntersectionObserver(()=>f113CapAtual(),{root:m,rootMargin:`-${off}px 0px -55% 0px`,threshold:[0,1]});caps.forEach(x=>F113_IO.observe(x.el))}
  /* saltos grandes de rolagem (topo/fim) podem não cruzar a faixa observada: confere também no fim da rolagem, uma vez por quadro */
  if(!m.__f113s){m.__f113s=1;let pend=0;m.addEventListener("scroll",()=>{if(pend)return;pend=requestAnimationFrame(()=>{pend=0;f113CapAtual()})},{passive:true})}})();
  /* 118: o bloco do placar ganha o nome certo; 143: o capítulo da linha do tempo leva o nome da seção */
  try{po118Caps()}catch(e){}try{mc143NomeTl()}catch(e){}}
/* 143: o capítulo da linha do tempo no "Nesta matéria" leva o mesmo nome da seção
   ("Como a história andou" ou o título próprio da linha do tempo), em vez do fixo "Linha do tempo". */
function mc143NomeTl(){const m=$("#layer .mat");if(!m)return;const tl=m.querySelector(".mat-tl.fs2-alvo");if(!tl||!tl.id)return;
  const bt=m.querySelector(`.fs2-cap-b[aria-controls="${tl.id}"]`);if(!bt)return;
  const b=tl.querySelector(":scope > b"),nome=((b&&b.textContent)||"").replace(/\s+/g," ").trim();
  const t=[...bt.childNodes].filter(n=>n.nodeType===3).pop();if(t&&nome.length>=3&&nome.length<=32)t.textContent=nome}
function f113CapVai(i){/* 158: o capítulo tocado fica marcado até a pessoa rolar */
  MT158_CAPTAP=null;try{const m=$("#layer .mat"),el=m&&m.querySelector("#fs2c-"+i);if(el){const y=el.getBoundingClientRect().top-m.getBoundingClientRect().top+m.scrollTop-f113Off(m);
  MT158_CAPTAP={i:+i,t:Date.now(),s0:m.scrollTop,y:Math.max(0,Math.min(y,m.scrollHeight-m.clientHeight))}}}catch(e){}
  const m=$("#layer .mat"),el=m&&m.querySelector("#fs2c-"+i),nav=m&&m.querySelector(".fs2-cap");if(!el)return;uso("fase2_capitulo");
  const y=el.getBoundingClientRect().top-m.getBoundingClientRect().top+m.scrollTop-f113Off(m);
  F113_CAPFIXO=Date.now()+(f113Reduz()?60:700);if(nav)f113CapMarca(nav,i);
  try{m.scrollTo({top:Math.max(0,y),behavior:f113Reduz()?"auto":"smooth"})}catch(e){m.scrollTop=Math.max(0,y)}
  try{el.focus({preventScroll:true})}catch(e){}setTimeout(()=>{F113_CAPFIXO=0},720)}
/* 168: linha de leitura no terço de cima; na última tela ela desce até o fim */
function f113CapAtual(){const m=$("#layer .mat");if(!m||Date.now()<F113_CAPFIXO)return;const nav=m.querySelector(".fs2-cap");if(!nav)return;
  const tp=MT158_CAPTAP;if(tp&&nav.querySelector(`[data-f113cap="${tp.i}"]`)&&(Math.abs(m.scrollTop-tp.y)<30||(Date.now()-tp.t<1600&&m.scrollTop>=Math.min(tp.s0,tp.y)-30&&m.scrollTop<=Math.max(tp.s0,tp.y)+30))){f113CapMarca(nav,tp.i);return}MT158_CAPTAP=null;
  const off=f113Off(m),top=m.getBoundingClientRect().top,H=Math.max(1,m.clientHeight-off),els=[...m.querySelectorAll(".fs2-alvo[id^='fs2c-']")];if(!els.length)return;
  let lim=off+Math.max(60,H*.33);const resta=m.scrollHeight-m.clientHeight-m.scrollTop;if(resta<H){const f=1-Math.max(0,resta)/H;lim+=(m.clientHeight-24-lim)*f}
  let i=0;els.forEach((e,k)=>{if(e.getBoundingClientRect().top-top<=lim)i=k});f113CapMarca(nav,i)}
/* 158: rola a faixa pela posição real da aba */
function f113CapMarca(nav,i){nav.querySelectorAll("[data-f113cap]").forEach(b=>{if(+b.dataset.f113cap===i)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current")});
  const b=nav.querySelector(`[data-f113cap="${i}"]`),l=nav.querySelector(".fs2-cap-l");if(!b||!l)return;
  const lr=l.getBoundingClientRect(),br=b.getBoundingClientRect(),esq=br.left-lr.left+l.scrollLeft,M=16;
  let x=null;if(br.left<lr.left+M)x=esq-M;else if(br.right>lr.right-M)x=Math.min(esq-M,esq+br.width-l.clientWidth+M);
  if(x!=null){x=Math.max(0,x);try{l.scrollTo({left:x,behavior:f113Reduz()?"auto":"smooth"})}catch(e){l.scrollLeft=x}}}

/* ===== convite para comentar no fim ===== */
function fc105Mat(pid){(()=>{const m=$("#layer .mat");if(!m||m.querySelector(".fc105-mc")||!S.membro||PUB.on===false||!pautaById(pid))return;const ref=m.querySelector(".mat-pe,.mat-prox,.mat-rod");if(!ref)return;
  ref.insertAdjacentHTML("beforebegin",`<div class="fc105-mc gut"><p><b>O que você acha?</b> Comente esta notícia com seus amigos.</p><div class="fc105-mcb"><button type="button" class="btn" data-cn102envp="${esc(pid)}">${fc105Svg(CN102_ICO.ana)}Publicar comentário</button><button type="button" class="btn ghost" data-cn102envs="${esc(pid)}">${fc105Svg(CN102_ICO.story)}No giro</button></div></div>`)})();
  /* 106: o ícone de comentar */
  try{const b=$("#layer .fc105-mc [data-cn102envp] .cn102-i");if(b)b.innerHTML=ICON.cmt.replace(/^<svg[^>]*>|<\/svg>$/g,"")}catch(e){}}

/* ===== "Quem noticiou" (a folha da linha "Noticiado por") =====
   Antes: 008 (anulada pela troca do 158), 158, 168 e 182. */
function abrirCobertura(pid){(()=>{uso("cobertura");const p=pautaById(pid);if(!p)return;const c=p.checagem;
  const lista=mt158Lista(p),ids=new Set(lista.map(v=>v.id));
  const linha=v=>{const sp=mt158Esp(v.k),l=v.links[0];
    return `<li><div class="cv-h"><b>${esc(mt158Nome(v.k))}</b>${sp?`<span class="cv-e"><i style="background:${ESPECTRO_COR[sp]}"></i>${esc(ESPECTRO_NOME[sp])}</span>`:""}</div>${v.enq.map(d=>`<p>${esc(d)}</p>`).join("")}${!v.enq.length&&v.cit?`<p>Citado no quadro acima.</p>`:""}${l?`<a href="${escU(l.url)}" target="_blank" rel="noopener">Ler a matéria ›</a>`:""}</li>`};
  const vistos=new Set(),fora=REGUA().filter(k=>{const id=mt158Id(k);if(ids.has(id)||vistos.has(id))return false;vistos.add(id);return true});
  sheet("Quem noticiou",`${c?`<div class="cv-box">${selo(p,false)}<p>${esc(mt158TextoQuadro(c.texto||(c.status==="divergencia"?"Os veículos trazem números diferentes.":"Os números principais batem em mais de um veículo.")))}</p></div>`:`<p class="hint" style="margin:0">Esta notícia não tem número principal para conferir, por isso não leva selo.</p>`}
    <h4 class="cv-t">Noticiaram (${lista.length})</h4><ul class="cvl">${lista.map(linha).join("")}</ul>
    ${fora.length?`<h4 class="cv-t">Não encontramos em</h4><p class="hint" style="margin:0">${fora.map(k=>esc(mt158Nome(k))).join(", ")}</p>`:""}
    <p class="hint">O selo <b>No prumo</b> aparece quando os números principais da notícia batem em dois ou mais veículos. Quando não batem, aparece <b>Veículos divergem</b> e o texto acima diz quem publicou o quê. A posição de cada veículo no espectro é aproximada; veículo sem etiqueta ainda não foi classificado.</p>`)})();
  /* 168: um resumo por veículo, "Antes de…" no resumo vencido e "Também noticiaram" sem link */
  (()=>{try{const p=pautaById(pid),ul=document.querySelector(".sheet .cvl");if(!p||!ul||ul.dataset.cm168)return;ul.dataset.cm168="1";
    const lista=mt158Lista(p),por={};lista.forEach(v=>por[mt158Nome(v.k)]=v);const tambem=[];
    [...ul.children].forEach(li=>{const nome=((li.querySelector(".cv-h b"))||{}).textContent||"",v=por[nome];const ps=[...li.querySelectorAll(":scope>p")];
      /* um resumo por veículo: o mais novo (o robô acrescenta no fim) */
      if(ps.length>1)ps.slice(0,-1).forEach(x=>x.remove());const pr=li.querySelector(":scope>p");
      if(pr&&!/^Citado no quadro/.test(pr.textContent)){const ve=cm168ResumoVelho(pr.textContent);if(ve)pr.insertAdjacentHTML("afterbegin",`<small class="cm168-antes">Antes de ${esc(ve)} · </small>`)}
      const a=li.querySelector("a");
      if(!pr&&v&&v.links&&v.links[0]&&v.links[0].titulo)li.querySelector(".cv-h").insertAdjacentHTML("afterend",`<p class="cm168-man">“${esc(v.links[0].titulo)}”</p>`);
      else if(!pr&&!a){tambem.push(li)}});
    if(tambem.length){const nomes=tambem.map(li=>((li.querySelector(".cv-h b"))||{}).textContent||"").filter(Boolean);tambem.forEach(li=>li.remove());
      ul.insertAdjacentHTML("afterend",`<p class="hint cm168-tb"><b>Também noticiaram</b> (sem link nesta edição): ${nomes.map(esc).join(", ")}</p>`)}}catch(e){}})();
  /* 182: a barra do espectro fica na folha */
  {try{const p=pautaById(pid),h=document.querySelector(".sheet h4.cv-t");
    if(p&&h&&!document.querySelector(".sheet .ft182-sp")){const s=ft182Esp0(p);if(s)h.insertAdjacentHTML("beforebegin",`<div class="ft182-sp">${s}</div>`)}}catch(e){}}}

/* ===== página da cobertura =====
   Antes: 031 (+ remendo no próprio 031), 089, 126, 158, 168 e 183. */
function abrirPagCob(pid){
  /* 158: atualizações quase iguais viram uma só também na linha do tempo da cobertura (só durante o desenho) */
  const p=pautaById(pid);const ups=p&&p.atualizacoes;if(p&&Array.isArray(ups))p.atualizacoes=mt158Ups(ups);
  try{
    (()=>{uso("pag_cobertura");const p=pautaById(pid);if(!p){abrirDormente(pid);return}
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
  </div>`)})();
    /* 031: O essencial (ao vivo) e Serviços */
    (()=>{const p=pautaById(pid);const box=document.querySelector(".sheet .pc[data-pc]");if(!p||!box)return;
  const ess=(Array.isArray(p.essencial)?p.essencial:[]).filter(Boolean).slice(0,3);const meta=box.querySelector(".pc-m"),et=box.querySelector(".etp");
  if(ess.length&&p.status==="ao_vivo")(et||meta).insertAdjacentHTML("afterend",`<div class="pc-ess"><h4>O essencial</h4><ul>${ess.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`);
  const res=[...box.querySelectorAll("h4")].find(x=>x.textContent==="Resumo");const lead=res&&res.nextElementSibling;
  let extra="";if(Array.isArray(p.servicos)&&p.servicos.length)extra+=`<h4>Serviços e como ajudar</h4>${srvHTML(p)}`;
  if(extra&&lead)lead.insertAdjacentHTML("afterend",extra)})();
    /* 089: "Tudo sobre <assunto>" */
    {try{const p=pautaById(pid);const k=document.querySelector(".sheet .pc[data-pc] .pc-k");
  if(p&&p.subtema&&k&&!k.querySelector("[data-assunto]")&&asNorm(($("#layer .pfv-as")||{dataset:{}}).dataset.sub)!==asNorm(p.subtema)){const n=asDados(p.subtema);const tot=n?n.agora.length+n.antes.length:0;
    if(tot>1)k.insertAdjacentHTML("afterend",`<button type="button" class="as-link" data-assunto="${esc(p.subtema)}">Tudo sobre ${esc(p.subtema)} <span>${tot} histórias ›</span></button>`)}}catch(e){}}
    /* 126: a novidade da cobertura conta como vista */
    {try{if(pid)qb126MarcaDepois(x=>String(x.k).indexOf("cob:"+pid+":")===0)}catch(e){}}
  }finally{if(p&&Array.isArray(ups))p.atualizacoes=ups}
  /* 158: "Cobertura desde" e o título do tema */
  {try{if(p){const tema=temaDe(p);if(tema)mt158Titulo(tema);const m=document.querySelector(".sheet .pc[data-pc] .pc-m span:not(.cst)");if(m)m.innerHTML=m.innerHTML.replace("Acompanhando desde","Cobertura desde")}}catch(e){}}
  /* 168: assunto como link e a nota do "O que vem" */
  {try{cm168AsLink();const p=pautaById(pid),n=document.querySelector(".sheet .pc[data-pc] .note");
    if(p&&n&&/^O que vem/.test((n.querySelector("b")||{}).textContent||""))cm168VemNota(n,p)}catch(e){}}
  /* 183: fim, encerrada e o interruptor de avisos */
  {try{cb183Pinta(pid)}catch(e){}}}
/* 19/11 (testador): matéria aberta por link antes de chegarem o detalhe do feed e as fotos de arquivo: a arte espera
   num fundo neutro (sem a ilustração que depois pulava para a foto) e a foto entra no lugar assim que der (até 20 s) */
function mt202Espera(){const ma=document.querySelector("#layer .mat-arte");if(!ma||ma.querySelector(".foto"))return;const pid=MAT_PID;
  const cedo=()=>{try{return document.documentElement.classList.contains("ab141-sem-arq")||!!(typeof FL119!=="undefined"&&FL119.parcial)}catch(e){return false}};
  if(cedo())ma.classList.add("mt202-esp");const t0=Date.now();
  (function w(){const a=document.querySelector("#layer .mat-arte");if(!a||MAT_PID!==pid)return;
    try{const p=pautaById(pid);const h=p&&capaArte(p,"art",true);if(h&&/class="[^"]*\bfoto\b/.test(h)){a.innerHTML=h;a.classList.remove("mt202-esp");return}}catch(e){}
    if(Date.now()-t0>20000||(!cedo()&&Date.now()-t0>1500)){a.classList.remove("mt202-esp");return}setTimeout(w,400)})()}
