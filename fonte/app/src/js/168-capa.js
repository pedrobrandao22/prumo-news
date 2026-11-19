/* ---------- 168: Capa, matéria, busca e coberturas (16/11, noite) — achados do testador. Prefixo cm168. ----------
   1. Selic: o rodapé do gráfico diz desde quando a taxa vale e a última reunião (não mais "dado de 17 set").
      Dólar: o gráfico diz que a linha é a PTAX ("PTAX · último dado") e mostra a cotação de agora com a hora.
   2. "Para acompanhar": a hora é a da última novidade de cada cobertura ("sex (13)"), não a da edição; a lista segue essa ordem.
   3. Notícia sem novidade há mais de 40 h antes da mais nova da edição: o cartão diz "de quinta (12)", desce na sua editoria e o "Em 30 segundos" avisa.
   4. Agenda: evento de hoje cujo horário já passou diz "saiu às 8h25"; "O que vem" escrito antes do dia citado avisa
      de quando é a previsão.
   5. Página do assunto: a linha do tempo junta as versões do mesmo fato (fica a mais nova, com "número corrigido").
      O link da cobertura para o assunto vira "Notícias de Contas públicas", para não parecer outro nome da cobertura.
   6. Matéria: cabeçalho e faixa "Nesta matéria" com fundo sólido; a faixa marca cada seção, inclusive as curtas do fim.
   7. "Próxima" conta como um passo do voltar; o endereço passa a ser o da matéria (#m=…) e, ao recarregar, ela reabre no
      mesmo ponto; girar o celular mantém o parágrafo que estava no alto da tela.
   8. Quem noticiou: um resumo por veículo (o mais novo), resumo de antes de um evento já passado avisa; veículo sem
      resumo mostra a manchete do link; sem nada, vai para "Também noticiaram".
   9. Mandar notícia: "Copiar link" e, com conta, "Mandar para um amigo".
  10. Busca: palavra casa no começo (meia não acha "nomeia"); "de", "da", "do"… não contam; perfis abertos entram em
      "Pessoas" sem repetir; sugestões só com as coberturas desta edição; "dólar", "selic", "ipca"… mostram o indicador.
  11. Seguir cobertura sem conta: avisa que vale neste aparelho e oferece Entrar. */

/* ===== utilidades ===== */
/* hora (ms) da última novidade de verdade: a própria notícia e as atualizações (a troca de título da rodada não conta) */
function cm168Ult(p){let t=tms(p&&p.hora);(Array.isArray(p&&p.atualizacoes)?p.atualizacoes:[]).forEach(u=>{const x=tms(u&&u.hora);if(x>t)t=x});
  /* 19/11 tarde: título reescrito também é novidade */(Array.isArray(p&&p.titulos)?p.titulos:[]).forEach(u=>{const x=tms(u&&u.hora);if(x>t)t=x});return t}
var CM168_SEM=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
/* "hoje, 6h52" / "ontem, 22h28" / "sex (13)" */
function cm168Quando(ms){if(!ms)return "";const iso=new Date(ms).toISOString(),d=dataSP(iso),hj=hojeSP(),h=hhmm(iso).replace(/^0/,"");
  if(d===hj)return "hoje, "+h;if(d===somaDias(hj,-1))return "ontem, "+h;
  const w=new Date(d+"T12:00:00Z");return ["dom","seg","ter","qua","qui","sex","sáb"][w.getUTCDay()]+" ("+w.getUTCDate()+")"}
/* "quinta (12)" */
function cm168Dia(ms){const d=dataSP(new Date(ms).toISOString()),w=new Date(d+"T12:00:00Z");return CM168_SEM[w.getUTCDay()]+" ("+w.getUTCDate()+")"}

/* ===== 1. Selic e dólar no gráfico ===== */
{const _ag168=abrirGrafico;abrirGrafico=function(id){const r=_ag168.apply(this,arguments);try{const g=document.querySelector(".gr"),x=indItens().find(o=>o&&o.id===id);if(!g||!x)return r;
    const f=g.querySelector(".gr-fonte");
    if(id==="selic"&&f&&!f.dataset.cm168){const s=ca159Selic(x),d=String(x.data||"").slice(0,10);
      if(s&&/^\d{4}-\d{2}-\d{2}$/.test(d)){f.dataset.cm168="1";const ano=d.slice(0,4);
        f.textContent=`Fonte: Copom/Banco Central · taxa em vigor desde ${ca159DiaMes(d)} de ${ano}; ${s.t==="mantida"?"mantida":"mudou"} na reunião de ${ca159DiaMes(s.d,true)}`}}
    if(id==="dolar"&&typeof x.fonte_serie==="string"&&x.fonte_serie&&!g.querySelector(".cm168-agora")){const hd=g.querySelector(".gr-hd");
      const at=IND_AUTO&&IND_AUTO.atualizado,dd=String(x.data||"").slice(0,10);let qd="";
      if(dd===hojeSP()&&at&&String(at).slice(0,10)===dd){const m=/T(\d{2}):(\d{2})/.exec(String(at));if(m)qd="hoje às "+(+m[1])+"h"+m[2]}else if(dd)qd=cm168Quando(Date.parse(dd+"T18:00:00-03:00"));
      if(hd)hd.insertAdjacentHTML("afterend",`<p class="cm168-agora">${esc(x.valor)} é a cotação comercial${qd?" de "+esc(qd):""}. A linha do gráfico é a PTAX do Banco Central, um valor por dia útil.</p>`)}}catch(e){}return r}}
{const _gro168=grRo;grRo=function(i){let h=_gro168.apply(this,arguments);try{if(GR&&GR.id==="dolar"&&i===GR.d.length-1){const x=indItens().find(o=>o&&o.id==="dolar");if(x&&x.fonte_serie)h=h.replace("último dado","PTAX · último dado")}}catch(e){}return h}}

/* ===== 3. notícia sem novidade há mais de 40 h ===== */
/* comparado com a novidade mais recente da edição (não com o relógio: se a rodada atrasar, não vira tudo "velho"):
   mais de 40 h antes dela = de dois dias antes */
var CM168_VELHA=40*3600e3,CM168_REF={f:null,n:-1,t:0};
function cm168Ref(){const ps=FEED&&FEED.pautas||[];if(CM168_REF.f!==FEED||CM168_REF.n!==ps.length){let t=0;ps.forEach(p=>{const x=cm168Ult(p);if(x>t)t=x});CM168_REF={f:FEED,n:ps.length,t}}return CM168_REF.t}
function cm168Velha(p){const t=cm168Ult(p),ed=cm168Ref();return t&&ed&&ed-t>CM168_VELHA?t:0}
/* ===== 4. Agenda e "O que vem" que já passaram ===== */
/* matéria aberta por um evento da agenda que já passou */
function cm168AgNota(){const n=document.querySelector("#layer .mat .mt158-ag");if(!n||n.dataset.cm168)return;const d=((n.querySelector("b")||{}).textContent||"");const m=/(saiu|foi) às (\d{1,2}h\d{0,2})/.exec(d);if(!m)return;n.dataset.cm168="1";
  const sm=n.querySelector("small"),tema=((sm&&sm.querySelector("b"))||{}).textContent||"";
  if(sm)sm.innerHTML=`Isso ${m[1]==="saiu"?"saiu":"aconteceu"} hoje às ${esc(m[2])}, mas esta edição ainda não traz o resultado. Abaixo, a cobertura ligada a ele${tema?": <b>"+esc(tema)+"</b>":""}.`}
/* "O que vem": previsão escrita antes do dia que ela cita, e esse dia já chegou */
function cm168VemVelho(p){try{const tx=String(p&&p.proximo||"");if(!tx)return 0;const t=cm168Ult(p);if(!t)return 0;const ev=ca159Evento(tx,new Date(t).toISOString());if(!ev||t>=ev.ini)return 0;
  const passou=ev.hora?Date.now()>ev.ini:Date.now()>ev.ini+10*3600e3;return passou?t:0}catch(e){return 0}}
function cm168VemNota(el,p){if(!el||el.querySelector(".cm168-vem"))return;const t=cm168VemVelho(p);if(!t)return;
  el.insertAdjacentHTML("beforeend",`<small class="cm168-vem">Previsão escrita ${esc(cm168Quando(t).replace(/^hoje/,"hoje").replace(/^(\D{3}) \(/,"na $1 ("))}; ainda sem notícia nova sobre isso nesta edição.</small>`)}

/* ===== 5. Página do assunto e cobertura ===== */
function cm168Dias(s){const o=[];String(s||"").replace(/\((\d{1,2})\)|\b(\d{1,2})\/(\d{1,2})\b/g,(m0,a,b)=>{o.push(+(a||b));return m0});return o}
function cm168Tk(s,re){return String(s||"").match(re)||[]}
var CM168_PCT=/\d+(?:,\d+)?%/g,CM168_RS=/R\$\s?\d+(?:[.,]\d+)*/g;
/* duas linhas contam o mesmo fato: mesma história, mesmo dia citado e o mesmo percentual (ou texto quase igual) */
function cm168Mesmo(f,x){if(f.ref!==x.ref)return false;const da=cm168Dias(f.txt),db=cm168Dias(x.txt);if(da.length&&db.length&&!da.some(n=>db.includes(n)))return false;
  const pa=cm168Tk(f.txt,CM168_PCT),pb=cm168Tk(x.txt,CM168_PCT),sim=mt158Par(f.txt,x.txt);
  if(pa.length&&pb.length)return pa.some(v=>pb.includes(v))&&sim>=.45;return sim>=.75}
{const _ad168=asDados;asDados=function(){const d=_ad168.apply(this,arguments);try{if(!d||!Array.isArray(d.ev))return d;const fica=[];
    /* da mais nova para a mais antiga (já vem assim): some a que conta o mesmo fato de uma que ficou; se o valor em reais mudou, a que ficou leva "número corrigido" */
    d.ev.forEach(x=>{const igual=fica.find(f=>cm168Mesmo(f,x));
      if(igual){const ra=cm168Tk(igual.txt,CM168_RS).map(v=>v.replace(/\s/g,"")),rb=cm168Tk(x.txt,CM168_RS).map(v=>v.replace(/\s/g,""));if(ra.length&&rb.length&&!rb.every(v=>ra.includes(v)))igual.cm168c=1;return}fica.push(x)});
    fica.forEach(x=>{if(x.cm168c&&String(x.tema).indexOf("número corrigido")<0)x.tema=(x.tema?x.tema+" · ":"")+"número corrigido"});d.ev=fica}catch(e){}return d}}
function cm168AsLink(){document.querySelectorAll(".sheet .as-link[data-assunto]").forEach(b=>{if(b.dataset.cm168)return;b.dataset.cm168="1";const n=(b.querySelector("span")||{}).textContent||"";const k=/(\d+)/.exec(n);
  b.innerHTML=`Notícias de ${esc(b.dataset.assunto)} <span>${k?k[1]+" ›":"›"}</span>`;b.setAttribute("aria-label",`Ver as notícias do assunto ${b.dataset.assunto}`)})}
{const _ado168=abrirDormente;abrirDormente=function(){const r=_ado168.apply(this,arguments);try{cm168AsLink()}catch(e){}return r}}

/* ===== 7. Matéria: voltar, endereço, recarregar e girar ===== */
var CM168_PILHA=[];
function cm168Volta(a){try{MAT_ARRASTO=false}catch(e){}MAT_ORIG=CM168_PILHA.length?MAT_ORIG:null;abrirMateria(a.pid);const m=$("#layer .mat");if(!m)return;m.style.transform="";
  const vai=()=>{const mm=$("#layer .mat");if(mm)mm.scrollTop=a.y};vai();requestAnimationFrame(vai);setTimeout(vai,120)}
/* endereço da matéria aberta (#m=<id>): copiar a barra manda a notícia, recarregar reabre */
function cm168Url(pid){try{const base=location.pathname+location.search,h=pid?"#m="+pid:"";if(location.hash===h||(!pid&&!/^#m=/.test(location.hash)))return;history.replaceState(history.state,"",base+h)}catch(e){}}
/* ponto de leitura: o bloco que está no alto da tela e quanto dele já passou */
function cm168Blocos(m){return [...m.querySelectorAll(".mat-c h1,.mat-c p,.mat-c li,.mat-c h2,.mat-c h3,.mat-c h4,.mat-c figure,.mat-c .fs2-alvo,.mat-c .art")].filter(e=>e.offsetHeight>0)}
function cm168Ancora(m){const off=typeof f113Off==="function"?f113Off(m):60,lin=m.getBoundingClientRect().top+off;const bs=cm168Blocos(m);
  for(let i=0;i<bs.length;i++){const r=bs[i].getBoundingClientRect();if(r.bottom>lin+2)return {i,f:r.height?Math.max(0,Math.min(1,(lin-r.top)/r.height)):0,n:bs.length,y:m.scrollTop}}return null}
function cm168Restaura(m,a){if(!m||!a)return;const bs=cm168Blocos(m);if(!bs.length)return;const e=bs[Math.min(a.i,bs.length-1)];if(!e)return;
  const off=typeof f113Off==="function"?f113Off(m):60,r=e.getBoundingClientRect(),lin=m.getBoundingClientRect().top+off;m.scrollTop+=r.top+a.f*r.height-lin}
var CM168_ANC=null,CM168_GIRO=0,CM168_W=innerWidth,CM168_RT=0;
document.addEventListener("scroll",e=>{const m=e.target;if(!m||!m.classList||!m.classList.contains("mat")||Date.now()<CM168_GIRO)return;if(CM168_RT)return;
  CM168_RT=requestAnimationFrame(()=>{CM168_RT=0;try{if(Date.now()<CM168_GIRO)return;CM168_ANC=cm168Ancora(m);if(MAT_PID&&CM168_ANC)ssSet("cm168-pos",{pid:MAT_PID,a:CM168_ANC,t:Date.now()})}catch(er){}})},true);
addEventListener("resize",()=>{if(innerWidth===CM168_W)return;CM168_W=innerWidth;const m=$("#layer .mat"),a=CM168_ANC;if(!m||!a)return;CM168_GIRO=Date.now()+700;
  const vai=()=>{const mm=$("#layer .mat");if(mm)cm168Restaura(mm,a)};requestAnimationFrame(vai);setTimeout(vai,180);setTimeout(vai,450)});
/* recarregar a página com a matéria aberta: volta ao mesmo ponto */
/* (o 035 já tirou o #m= do endereço e guardou a notícia em LINK_PID) */
var CM168_REAB=(function(){try{const a=LINK_PID?ssGet("cm168-pos",null):null;return a&&a.pid===LINK_PID?a:null}catch(e){return null}})();
function cm168MatExtra(pid){const m=$("#layer .mat"),p=pautaById(pid);if(!m||!p)return;cm168AgNota();
  const t=cm168Velha(p),meta=m.querySelector(".mat-meta");if(t&&meta&&!m.querySelector(".cm168-velha"))meta.insertAdjacentHTML("afterend",`<p class="cm168-velha">Notícia de ${esc(cm168Dia(t))}, sem novidade desde então.</p>`);
  const vem=[...m.querySelectorAll(".cpx-c")].find(e=>/^O que vem agora/.test((e.querySelector("b")||{}).textContent||""));if(vem)cm168VemNota(vem,p)}

/* ===== 8. Quem noticiou ===== */
var CM168_FUT=/\b(prevista?s? para|pode(m)? ser|deve(m)? ser|vai ser|ser[áã]o?|marcad[ao]s? para|está previst|espera)\b/i;
/* resumo que fala de um evento futuro numa data que já passou: "pode ser votado na quinta (12)" no dia 16 */
function cm168ResumoVelho(s){const tx=String(s||"");if(!CM168_FUT.test(tx))return "";const m=/(segunda|terça|quarta|quinta|sexta|sábado|domingo)(?:-feira)?\s*\((\d{1,2})\)/i.exec(tx);if(!m)return "";
  const hj=hojeSP();for(let k=1;k<=10;k++){const d=somaDias(hj,-k);if(+d.slice(8,10)===+m[2]&&CM168_SEM[new Date(d+"T12:00:00Z").getUTCDay()]===m[1].toLowerCase())return m[1].toLowerCase()+" ("+(+m[2])+")"}return ""}

/* ===== 9. Mandar notícia: copiar link e mandar para um amigo ===== */
var CM168_ENV=null;
{const _cp168=compartilhar;compartilhar=function(pid){CM168_ENV=pid;return _cp168.apply(this,arguments)}}
{const _ef168=abrirEnvioFora;abrirEnvioFora=function(o){const r=_ef168.apply(this,arguments);try{const bts=document.querySelector(".sheet .env .env-bts");
    if(bts&&o&&o.url&&o.titulo==="Mandar notícia"&&!bts.querySelector("[data-cm168link]")){const pid=CM168_ENV;
      const cp=bts.querySelector("[data-envcopia]");const lk=`<button type="button" class="env-b" data-cm168link><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg><span>Copiar link</span></button>`;
      if(cp)cp.insertAdjacentHTML("beforebegin",lk);else bts.insertAdjacentHTML("beforeend",lk);
      if(pid&&pautaById(pid)&&S.uid&&S.membro)bts.insertAdjacentHTML("afterbegin",`<button type="button" class="env-b cm168-amg" data-cm168amg="${esc(pid)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg><span>Para um amigo</span></button>`);
      bts.dataset.cm168url=o.url}}catch(e){}CM168_ENV=null;return r}}
document.addEventListener("click",async e=>{const t=e.target;if(!t||!t.closest)return;let b;
  if((b=t.closest("[data-cm168link]"))){e.preventDefault();e.stopPropagation();const u=(b.closest(".env-bts")||{dataset:{}}).dataset.cm168url||"";if(!u)return;uso("copiar_link");
    try{await navigator.clipboard.writeText(u);toast("Link copiado");closeLayer()}catch(er){prompt("Copie o link:",u)}return}
  if((b=t.closest("[data-cm168amg]"))){e.preventDefault();e.stopPropagation();const pid=b.dataset.cm168amg;closeLayer();setTimeout(()=>openSend(pid),60)}},true);

/* ===== 10. Busca ===== */
var CM168_VAZIAS=new Set(["de","da","do","das","dos","e","a","o","as","os","em","no","na","nos","nas","um","uma","para","por","com","ao","que"]);
/* palavra só de letras e números casa no começo de uma palavra do texto ("meia" não acha "nomeia"); palavras vazias não contam */
{const _bt168=bu154Termos;bu154Termos=function(q){const ts=_bt168.apply(this,arguments);try{const cheias=ts.filter(t=>!CM168_VAZIAS.has(t.n));const l=cheias.length?cheias:ts;
    return l.map(t=>t.re||!/^[a-z0-9]+$/.test(t.n)?t:{n:t.n,re:new RegExp("(^|[^a-z0-9])"+t.n)})}catch(e){return ts}}}
/* indicador: quem busca "dólar" ou "selic" quer saber quanto está */
var CM168_IND={dolar:/^(dolar|dolares|cambio|usd)$/,ibovespa:/^(ibovespa|ibov|bolsa|b3)$/,selic:/^(selic|juros|copom)$/,ipca12m:/^(ipca|inflacao)$/,desemprego:/^(desemprego|pnad|desocupacao)$/};
function cm168IndBusca(q){const ws=bu154N(q).split(/[^a-z0-9]+/).filter(w=>w&&!CM168_VAZIAS.has(w));if(!ws.length||ws.length>2)return "";
  const its=indItens().filter(x=>x&&x.id&&x.nome&&x.valor);const ids=Object.keys(CM168_IND).filter(id=>ws.some(w=>CM168_IND[id].test(w)));
  const l=ids.map(id=>its.find(x=>x.id===id)).filter(Boolean);if(!l.length)return "";
  return `<div class="cm168-ind">${l.map(x=>`<div class="cm168-indc"><small>Indicador</small>${indTile(x)}<button type="button" class="cm168-indg" data-indg="${esc(x.id)}">Ver gráfico ›</button></div>`).join("")}</div>`}
{const _br168=buscaRes;buscaRes=function(q){let h=_br168.apply(this,arguments);try{const s=String(q||"").trim();if(s.charAt(0)!=="#"&&FEED){const ind=cm168IndBusca(s);
    if(ind){if(/class="bu154-nada"/.test(h))h=h.replace(/<b class="bu154-nt">[^<]*<\/b>/,`<b class="bu154-nt">Nenhuma notícia com “${esc(s)}”.</b>`);h=ind+h}}}catch(e){}return h}}
/* sugestões quando nada é achado: só as coberturas desta edição (as de "Para acompanhar") */
function cm168Sugestoes(){const ps=(FEED&&FEED.pautas||[]).filter(p=>typeof cobTemPagina==="function"&&cobTemPagina(p)&&temaDe(p)&&p.status!=="encerrada");
  return [...new Set(ps.sort((a,b)=>cm168Ult(b)-cm168Ult(a)).map(p=>temaDe(p)))].slice(0,8)}
{const _bn168=bu154Nada;bu154Nada=function(q){let h=_bn168.apply(this,arguments);try{const sug=cm168Sugestoes();const i=h.indexOf('<p class="bu154-sh">');
    if(i<0)return h;
    /* poucas coberturas no ar: ficam as sugestões antigas, com um rótulo que não promete "desta edição" */
    if(sug.length<2)return h.replace('<p class="bu154-sh">Assuntos desta edição</p>','<p class="bu154-sh">Assuntos para explorar</p>');
    const j=h.indexOf("</div>",h.indexOf('class="bv-chips',i))+6;h=h.slice(0,i)+`<p class="bu154-sh">Coberturas desta edição</p><div class="bv-chips bu154-sug">${sug.map(t=>`<button type="button" class="chipb" data-bu154q="${esc(t)}">${esc(t)}</button>`).join("")}</div>`+h.slice(j)}catch(e){}return h}}
/* perfis abertos entram em "Pessoas" sem repetir quem já está lá */
function cm168Pessoas(){const out=$("#bvres");if(!out)return;const ab=out.querySelector(".qa125-bus");if(!ab)return;const pe=out.querySelector(".bu154-pe");
  if(pe){const ja=new Set([...pe.querySelectorAll("[data-bu154pf]")].map(b=>b.dataset.bu154pf));
    ab.querySelectorAll("li").forEach(li=>{const b=li.querySelector("[data-cs123perfil]"),u=b&&b.dataset.cs123perfil;if(!u)return;
      if(ja.has(u)){const x=pe.querySelector(`[data-bu154pf="${CSS.escape(u)}"] .amg-n>span`);if(x&&!/aberto/.test(x.textContent)&&!S.amigos.has(u))x.textContent+=" · perfil aberto";return}
      li.classList.add("cm168-pa");pe.appendChild(li)});ab.remove();return}
  const h=ab.querySelector(".cs123-bh");if(h)h.textContent="Pessoas";ab.classList.add("cm168-pes")}
if(typeof qa125BusPoe==="function"){const _qp168=qa125BusPoe;qa125BusPoe=function(){const r=_qp168.apply(this,arguments);try{cm168Pessoas()}catch(e){}return r}}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="bvq")setTimeout(()=>{try{cm168Pessoas()}catch(er){}},0)});

/* ===== 11. Seguir sem conta ===== */
var CM168_SEGAVISO=0;
{const _cs168=cobSegue;cobSegue=function(tema,on){const r=_cs168.apply(this,arguments);try{if(on&&!(S.uid&&S.membro)&&Date.now()-CM168_SEGAVISO>1500){CM168_SEGAVISO=Date.now();
    setTimeout(()=>toast("Seguindo neste aparelho. Entre para levar a qualquer celular e ver em “Coberturas que sigo”.","Entrar",()=>{try{closeLayer()}catch(e){}abrirLogin()}),30)}}catch(e){}return r}}
