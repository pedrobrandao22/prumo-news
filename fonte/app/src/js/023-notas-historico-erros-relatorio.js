/* ---------- notas, histórico, erros, relatório ---------- */
function abrirNota(pid){uso("nota");
  if(precisaConta())return;const s=S.salvos[pid];const nota=s?.nota||"";
  sheet("Minha nota",`<p class="hint" style="margin:0">Só você vê. A notícia fica guardada junto com a nota.</p><textarea id="nota" class="field" rows="5" maxlength="1000" placeholder="O que você quer lembrar sobre esta notícia?" style="resize:vertical">${esc(nota)}</textarea><button type="button" class="btn" id="nsave" ${nota?"":"disabled"}>Salvar nota</button>`);$("#nota").addEventListener("input",e=>{$("#nsave").disabled=!e.target.value.trim()&&!nota});
  $("#nsave").addEventListener("click",async()=>{const t=$("#nota").value.trim();closeLayer();const val={at:s?.at||Date.now(),snap:s?.snap||snapLeve(pid),nota:t};S.salvos[pid]=val;updateSocial(pid);if(VIEW==="saved")renderSaved();toast("Nota salva");
    try{await gravarMapa(`data/users/${S.uid}/salvos`,"itens",pid,val)}catch(e){toast("Não deu para salvar a nota.")}});
}
let HIST=lsObj("radar-hist");
let histTimer=null,HIST_SUJO=false;
async function enviarHist(){clearTimeout(histTimer);if(!HIST_SUJO||!S.db||!S.uid||!S.membro)return;HIST_SUJO=false;try{await S.db.doc(`data/users/${S.uid}/historico`).set({itens:HIST})}catch(e){HIST_SUJO=true}}
function registrarHistorico(pid){
  const p=pautaById(pid);if(!p)return;HIST[pid]={t:new Date().toISOString(),titulo:p.neutro?.titulo||"",secao:secOf(p),tag:p.tag||"",tema:temaDe(p),imagem:p.imagem||null,link:(p.links||[])[0]||null};
  const ks=Object.keys(HIST);if(ks.length>200)ks.sort((a,b)=>HIST[a].t.localeCompare(HIST[b].t)).slice(0,ks.length-200).forEach(k=>delete HIST[k]);
  lsSet("radar-hist",HIST);HIST_SUJO=true;clearTimeout(histTimer);if(!S.db||!S.uid||!S.membro)return;
  histTimer=setTimeout(enviarHist,30000);
}
function abrirHistorico(){uso("historico");
  const it=Object.entries(HIST).sort((a,b)=>b[1].t.localeCompare(a[1].t));
  const grupos={};it.forEach(([pid,h])=>{const d=new Date(h.t).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit",timeZone:"America/Sao_Paulo"});(grupos[d]=grupos[d]||[]).push([pid,h])});
  sheet("Histórico de leitura",it.length?Object.entries(grupos).map(([d,l])=>`<span class="lbl" style="font-family:var(--f-mono);font-size:12px;color:var(--muted);text-transform:uppercase">${esc(d)}</span><ul class="sres">${l.map(([pid,h])=>`<li><button type="button" data-hist="${esc(pid)}"><b>${esc(h.titulo)}</b><span>${esc(secNome(h.secao))} · ${esc(hhmm(h.t))}</span></button></li>`).join("")}</ul>`).join(""):`<div class="empty"><b>Nada lido ainda</b>As notícias que você ler aparecem aqui.</div>`);
}
function abrirHist(pid){
  if(pautaById(pid)){closeLayer();openSnap(pid);return}
  const h=HIST[pid];if(!h)return;
  sheet(h.tag||"Notícia",`<div class="art paper" data-sec="${esc(h.secao)}">${svgOf(h.imagem)}</div><h3 style="margin:0;font-family:var(--f-display);font-weight:700;letter-spacing:-.01em;font-size:20px;line-height:1.2">${esc(h.titulo)}</h3>${h.link?`<a class="link" href="${escU(h.link.url)}" target="_blank" rel="noopener">Abrir a matéria em ${esc(nomeFonte(h.link.fonte))}</a>`:""}<p class="hint">Lida em ${esc(new Date(h.t).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}))}. Esta notícia não está mais na edição atual.</p>`);
}
function abrirErro(pid){uso("erro");
  if(precisaConta())return;const p=pautaById(pid);
  sheet("Achei um erro",`<p class="hint" style="margin:0">Diga o que parece errado (um número, um nome, uma data). A próxima rodada confere nas fontes e corrige, com uma nota de correção visível.</p><b>${esc(p?.neutro?.titulo||"")}</b><textarea id="etext" class="field" rows="4" maxlength="800" style="resize:vertical" placeholder="Ex.: o placar foi 2 a 1, não 1 a 0"></textarea><button type="button" class="btn" id="esend">Enviar para conferência</button>`);
  $("#esend").addEventListener("click",async()=>{const t=$("#etext").value.trim();if(!t){toast("Escreva o que parece errado.");return}closeLayer();
    try{await S.db.collection("erros").add({pid,titulo:p?.neutro?.titulo||"",texto:t,at:Date.now(),edicao:FEED?.atualizado_em||""});toast("Enviado. A próxima rodada vai conferir.")}catch(e){toast("Não deu para enviar agora.")}});
}
function relatorioHTML(){
  const desde=Date.now()-7*864e5;const it=Object.values(HIST).filter(h=>new Date(h.t).getTime()>=desde);
  const porSec={};it.forEach(h=>porSec[h.secao]=(porSec[h.secao]||0)+1);const max=Math.max(1,...Object.values(porSec));
  const porTema={};it.forEach(h=>{if(h.tema)porTema[h.tema]=(porTema[h.tema]||0)+1});const temas=Object.entries(porTema).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const st=FEED?.estatisticas||{};
  return `<div class="card"><b>Seu Prumo nos últimos 7 dias</b>${it.length?`<p>Você leu <b>${it.length}</b> ${it.length===1?"notícia":"notícias"}.</p><div class="bars2">${Object.entries(porSec).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`<div><span>${esc(secNome(s))}</span><i style="width:${(100*n/max).toFixed(0)}%;background:${secCor(s)}"></i><b>${n}</b></div>`).join("")}</div>${temas.length?`<p class="hint">Assuntos que você mais leu: ${temas.map(([t,n])=>esc(t)+" ("+n+")").join(", ")}.</p>`:""}`:`<p class="hint">Ainda sem leituras registradas nesta semana.</p>`}
    ${false?`<p class="hint" style="margin-top:6px">Na semana do Prumo: ${st.divergencias!=null?`${esc(st.divergencias)} divergências de números entre veículos`:""}${(st.veiculos||[]).length?`; veículos que mais pautaram: ${st.veiculos.slice(0,3).map(v=>esc(nomeFonte(v.fonte))+" ("+esc(v.n)+")").join(", ")}`:""}.</p>`:""}</div>`;
}

function ajustesHTML(){
  const all=ALLSECS(),ord=[...all].sort((a,b)=>{const o=PREF.ordem2||[];const ia=o.indexOf(a.id),ib=o.indexOf(b.id);return (ia<0?99+all.indexOf(a):ia)-(ib<0?99+all.indexOf(b):ib)});
  const aj=[...Object.entries(PREF.ajuste.sec||{}).map(([k,d])=>({t:"sec",k,d,n:secNome(k)})),...Object.entries(PREF.ajuste.tag||{}).map(([k,d])=>({t:"tag",k,d,n:"“"+k+"”"}))];
  const seg=Object.values(PREF.seguindo||{}),sil=Object.values(PREF.silenciados||{});
  const A=PREF.audio||{rate:1};const auto=autoPesos();
  const autoTxt=Object.entries(auto).filter(([,v])=>Math.abs(v)>=1).sort((a,b)=>b[1]-a[1]);
  const T=PREF.tema||"auto";
  return `<div class="card"><b>Aparência</b><div class="segs">${[["auto","Automático"],["claro","Claro"],["escuro","Escuro"]].map(([k,l])=>`<button type="button" data-tema-ui="${k}" aria-selected="${T===k}">${l}</button>`).join("")}</div><p class="hint">No automático, o Prumo segue o modo do celular.</p><label class="chk" style="margin-top:8px"><input type="checkbox" data-semvidro ${PREF.semVidro?"checked":""}> Reduzir transparência</label></div>
    <div class="card"><b>Tamanho da letra</b><div class="fzrow"><button type="button" data-fz="-1" aria-label="Diminuir letra">A−</button><span style="font-size:calc(17px*${PREF.fonte||1})">Texto de exemplo</span><button type="button" data-fz="1" aria-label="Aumentar letra">A+</button></div></div>
    <div class="card"><b>Minhas seções</b><p class="hint">Segure os pontinhos e arraste para mudar a ordem.</p><ul class="secpref">${ord.map((s,i)=>{const off=(PREF.ocultas||[]).includes(s.id);return `<li><span class="hdl" data-hdl="${esc(s.id)}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/></svg></span><i style="background:${secCor(s.id)}"></i><b class="${off?"off":""}">${esc(s.nome)}</b><button type="button" data-hide="${esc(s.id)}" aria-pressed="${off}" style="width:auto;padding:0 10px;font-size:13px">${off?"Mostrar":"Esconder"}</button></li>`}).join("")}</ul></div>
    <div class="card"><b>O Prumo aprende com a sua leitura</b>${PREF.autoOff?`<p class="hint">Desligado. O feed segue só a importância das notícias e os seus ajustes.</p>`:autoTxt.length?`<p class="hint">Pelo que você leu nas últimas duas semanas, o feed dá ${autoTxt.map(([s,v])=>`${v>0?"mais":"menos"} destaque a ${esc(secNome(s))}`).join(", ")}.</p>`:`<p class="hint">Ainda aprendendo. Depois de umas 15 notícias lidas, o feed passa a dar mais destaque às seções que você mais lê.</p>`}<button type="button" class="btn ghost" data-auto>${PREF.autoOff?"Ligar":"Desligar"} o aprendizado</button></div>
    ${aj.length?`<div class="card"><b>Mais e menos disso</b><ul class="secpref">${aj.map(a=>`<li><b>${a.d>0?"Mais":"Menos"} ${esc(a.n)}</b><button type="button" data-unaj="${a.t}" data-k="${esc(a.k)}" style="width:auto;padding:0 10px;font-size:13px">Desfazer</button></li>`).join("")}</ul></div>`:""}
    <div class="card"><b>Temas que eu sigo</b>${seg.length?`<ul class="secpref">${seg.map(t=>`<li><b>${esc(t)}</b><button type="button" data-tema="${esc(t)}" data-acao="seguindo" style="width:auto;padding:0 10px;font-size:13px">Deixar de seguir</button></li>`).join("")}</ul>`:`<p class="hint">Use os três pontinhos de um post para seguir um tema. Ele sobe no feed e marca quando houver atualização.</p>`}</div>
    ${sil.length?`<div class="card"><b>Temas silenciados</b><ul class="secpref">${sil.map(t=>`<li><b>${esc(t)}</b><button type="button" data-tema="${esc(t)}" data-acao="silenciados" style="width:auto;padding:0 10px;font-size:13px">Mostrar de novo</button></li>`).join("")}</ul></div>`:""}
    <div class="card"><b>Áudio</b><p class="hint">Velocidade atual: ${(A.rate||1).toFixed(1).replace(".",",")}×. A voz e a velocidade se ajustam no botão de som, no topo.</p></div>`;
}
function abrirAjustes(){sheet("Ajustes do app",`<div id="ajbox" style="display:flex;flex-direction:column;gap:12px">${ajustesHTML()}</div>`);uso("ajustes")}
function refreshAjustes(){const b=$("#ajbox");if(b)b.innerHTML=ajustesHTML();if(VIEW==="me")renderMe()}

