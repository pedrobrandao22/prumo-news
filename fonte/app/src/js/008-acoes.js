/* ---------- ações ---------- */
const PEND={};
function pend(col,k,v){PEND[col+"\u0001"+k]={col,k,v,t:Date.now()}}
function desfazPend(col,k){delete PEND[col+"\u0001"+k];if(col.startsWith("lista:"))montarListas();else recalcSoc(col)}
function comPend(col,itens){const out={...(itens||{})};for(const [key,p] of Object.entries(PEND)){if(p.col!==col)continue;const cur=out[p.k];
    const same=p.v==null?cur==null:(col==="votos"?JSON.stringify(cur)===JSON.stringify(p.v):cur!=null);
    if(same||Date.now()-p.t>30000){delete PEND[key];continue}if(p.v==null)delete out[p.k];else out[p.k]=p.v}return out}
function recalcSoc(col){const raw=S.raw[col]||{},o={...raw};if(S.uid)o[S.uid]=comPend(col,raw[S.uid]);S.soc[col]=o}
function derivaJuntos(){const j={};Object.entries(S.soc.juntos||{}).forEach(([u,m])=>Object.entries(m||{}).forEach(([k,v])=>{if(v)(j[k]=j[k]||{})[u]=v}));S.juntos=j}
function montarListas(){const raw=S.raw.listas||{},coms=new Set([...Object.keys(raw),...Object.values(PEND).filter(p=>p.col.startsWith("lista:")).map(p=>p.col.slice(6))]);
  S.listas={};coms.forEach(c=>{S.listas[c]=comPend("lista:"+c,raw[c])});S.lista={};Object.values(S.listas).forEach(m=>Object.entries(m).forEach(([pid,x])=>{if(x)S.lista[pid]=x}))}
const FILA={};
function emFila(k,fn){const p=(FILA[k]||Promise.resolve()).catch(()=>{}).then(fn);FILA[k]=p;return p}
/* update() do banco mescla no servidor (null apaga a chave) e cria o documento se não existir */
async function gravarMapa(path,campo,k,val,corpoPronto){const db=S.db;if(!db)throw new Error("sem conta");const corpo=corpoPronto?{[campo]:corpoPronto}:campo?{[campo]:{[k]:val}}:{[k]:val};return emFila(path,()=>db.doc(path).update(corpo))}
async function toggleLike(pid){uso("curtir");vibrar(8);
  if(precisaConta())return;const on=!socialOf(pid).likes.includes(S.uid);const sn=snapById(pid);
  const val=on?{at:Date.now(),snap:sn?{id:pid,titulo:sn.titulo||"",secao:sn.secao||""}:{id:pid}}:null;
  pend("curtidas",pid,val);recalcSoc("curtidas");updateSocial(pid);refiltrar();
  try{await gravarMapa("curtidas/"+S.uid,"itens",pid,val)}catch(e){desfazPend("curtidas",pid);updateSocial(pid);refiltrar();toast("Não deu para marcar agora. Tente de novo.")}
}

function shareCard(s,attrs=""){return `<button type="button" class="share paper" data-sec="${esc(s?.secao||"politica")}" ${attrs}>${svgOf(s?.imagem)}<div><span>${esc(secNome(s?.secao||"politica"))} · ${esc(s?.tag)}</span><b>${esc(s?.titulo)}</b></div></button>`}
function snapLeve(pid){const s=snapById(pid);if(!s)return {id:pid};return {id:s.id||pid,secao:s.secao||"",tag:s.tag||"",titulo:s.titulo||"",texto:String(s.texto||"").slice(0,320),imagem:s.imagem||null,links:arrL(s.links).slice(0,1)}}
async function toggleSave(pid){uso("guardar");
  if(precisaConta())return;const on=!S.salvos[pid],antS=S.salvos[pid];
  if(on)S.salvos[pid]={at:Date.now(),snap:snapLeve(pid)};else delete S.salvos[pid];
  updateSocial(pid);toast(on?"Guardada":"Removida das guardadas",on?"Desfazer":"",on?()=>toggleSave(pid):null);if(VIEW==="saved")renderSaved();
  try{const val=on?{at:Date.now(),snap:snapLeve(pid)}:null;await gravarMapa(`data/users/${S.uid}/salvos`,"itens",pid,val)}catch(e){if(on)delete S.salvos[pid];else S.salvos[pid]=antS;updateSocial(pid);if(VIEW==="saved")renderSaved();toast("Não deu para guardar agora.")}
}
function openLinks(pid){uso("fontes");const p=pautaById(pid)||{links:arrL(snapById(pid)?.links)};sheet("Ler nas fontes",`<ul class="rows">${arrL(p.links).map(l=>`<li><span>${esc(nomeFonte(l.fonte))}</span><a href="${escU(l.url)}" target="_blank" rel="noopener">${esc(l.titulo)}</a></li>`).join("")}</ul>`)}
function openMenu(pid){uso("menu_post");
  const p=pautaById(pid);if(!p)return;const sec=secOf(p),tema=temaDe(p),tk=norm(tema);
  const as=PREF.ajuste.sec[sec]||0;
  const am=amigosL(),naLista=u=>!!(S.listas[u]||{})[pid];
  sheet("Opções",`<div class="opt">
    ${tema?`<button type="button" data-tema="${esc(tema)}" data-acao="seguindo">${(PREF.seguindo||{})[tk]?"Deixar de seguir":"Seguir"} “${esc(tema)}”<span>${(PREF.seguindo||{})[tk]?"seguindo":"sobe no feed"}</span></button><button type="button" data-tema="${esc(tema)}" data-acao="silenciados">Silenciar “${esc(tema)}”<span>some do feed</span></button>`:""}
    ${as<0?`<button type="button" data-aj="reset" data-k="${esc(sec)}" data-t="${esc(tk)}">Voltar ao normal em ${esc(secNome(sec))}<span>menos ativo</span></button>`:`<button type="button" data-aj="sec" data-k="${esc(sec)}" data-d="-1">Menos notícias de ${esc(secNome(sec))}</button>`}
    <button type="button" data-nota="${esc(pid)}">Guardar com uma nota</button>
    <button type="button" data-compart="${esc(pid)}">Compartilhar fora do Prumo<span>WhatsApp, e-mail…</span></button>
    <button type="button" data-a2="links" data-pid="${esc(pid)}">Abrir as matérias originais</button>
    <button type="button" data-erro="${esc(pid)}">Achei um erro nesta notícia</button></div><p class="hint">Seguir, silenciar e “menos notícias” só mudam o seu feed.</p>`);
}
function ajustar(tipo,k,d){
  const m=PREF.ajuste[tipo]||(PREF.ajuste[tipo]={});m[k]=Math.max(-3,Math.min(3,(m[k]||0)+d));if(!m[k])delete m[k];
  salvarPrefs();renderPosts();toast(d>0?"Vou mostrar mais disso":"Vou mostrar menos disso");
}
function irPara(el){if(!el)return;const f=()=>el.scrollIntoView({block:"start"});f();requestAnimationFrame(f);setTimeout(f,160);setTimeout(f,420)}
function voltarDoSalto(){const o=JUMPS.pop();if(!o)return;if(o.view!=="feed"){THREAD=o.thread||null;go(o.view,true);if(o.view==="msgs")renderMsgs();else if(o.y)requestAnimationFrame(()=>window.scrollTo(0,o.y))}else{requestAnimationFrame(()=>window.scrollTo(0,o.y||0))}}
function openSnap(pid){
  const pp=pautaById(pid);
  if(pp&&!(PREF.ocultas||[]).includes(secOf(pp))&&!silenciado(pp)&&meusTemasOk(pp)){if(FILTRO!=="tudo"&&!listaFeed().some(x=>x.id===pid)){if(FST>0){voltarH(FST);FST=0}FILTRO="tudo";ssSet("radar-filtro",FILTRO);renderFeed()}
    const origem={view:VIEW,thread:THREAD,y:scrollY,at:Date.now()};if(VIEW!=="feed")go("feed",true);
    if(garantirPost(pid)){if(pushH())JUMPS.push(origem);irPara(document.getElementById("p-"+pid));return}}
  const s=snapById(pid);if(!s){toast("Esta notícia não está mais disponível.");return}
  sheet(s.tag||"Notícia",`<div class="art paper" data-sec="${esc(s.secao||"politica")}">${svgOf(s.imagem)}</div><h3 style="margin:0;font-family:var(--f-display);font-weight:700;letter-spacing:-.01em;font-size:21px;line-height:1.2">${esc(s.titulo)}</h3><p class="lead" style="margin:0">${esc(s.texto)}</p>${arrL(s.links).length?`<ul class="rows">${arrL(s.links).map(l=>`<li><span>${esc(nomeFonte(l.fonte))}</span><a href="${escU(l.url)}" target="_blank" rel="noopener">${esc(l.titulo)}</a></li>`).join("")}</ul>`:""}${S.salvos[pid]?.nota?`<p class="note"><b>Sua nota.</b> ${esc(S.salvos[pid].nota)}</p>`:""}<div class="snapacts"><button type="button" class="link" data-nota="${esc(pid)}">${S.salvos[pid]?.nota?"Editar nota":"Adicionar nota"}</button>${S.salvos[pid]?`<button type="button" class="link" data-tirar="${esc(pid)}">Tirar das guardadas</button>`:""}${Object.entries(S.listas||{}).filter(([,m])=>m&&m[pid]).map(([u])=>`<button type="button" class="link" data-tirarl="${esc(pid)}" data-com="${esc(u)}">Tirar da lista com ${esc(nomeDe(u))}</button>`).join("")}</div>${pp?`<p class="hint">${silenciado(pp)?`Esta notícia está escondida porque o tema “${esc(temaDe(pp))}” está silenciado. Dá para mudar isso nos Ajustes do app.`:(PREF.ocultas||[]).includes(secOf(pp))?`Esta notícia está escondida porque a seção ${esc(secNome(secOf(pp)))} está escondida. Dá para mudar isso nos Ajustes do app.`:`Seu feed está em “Meus temas”, que mostra só o que você segue. Para ver tudo, mude a ordem no filtro do feed.`}</p>`:`<p class="hint">Notícia de uma edição anterior do Prumo.</p>`}`);
}
function abrirNome(){if(precisaConta())return;
  sheet("Mudar meu nome",`<p class="hint" style="margin:0;font-size:14.5px">Esse nome aparece para os seus amigos: no "gostei", nos comentários e nas conversas.</p>`,`<form id="nform"><input class="field" id="ntext" maxlength="40" autocomplete="given-name" placeholder="Seu nome" aria-label="Seu nome" value="${esc(S.membros[S.uid]?.nome||"")}"><button class="send" type="submit">Salvar</button></form>`);
  $("#nform").addEventListener("submit",async e=>{e.preventDefault();const n=$("#ntext").value.trim();if(!n)return;closeLayer();const ant=S.membros[S.uid];S.membros[S.uid]={...(ant||{}),nome:n};rerenderAll();
    try{await S.db.doc("pessoas/"+S.uid).set({nome:n});toast("Nome salvo")}catch(err){if(ant)S.membros[S.uid]=ant;rerenderAll();const m=erroAuth(err);toast(/nome/i.test(m)?m:"Não deu para salvar o nome agora.")}});
}
