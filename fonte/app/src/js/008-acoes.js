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
function openComments(pid){uso("comentarios");
  const draw=()=>{const {cm}=socialOf(pid);return cm.length?`<ul class="clist">${cm.map(c=>`<li>${avatar(c.uid)}<div><span><b>${esc(nomeDe(c.uid))}</b>${typeof debVotoChip==="function"?debVotoChip(pid,c.uid):""} ${esc(c.texto)}</span><i>${esc(quando(c.at))}<button type="button" class="c-a" data-resp="${esc(nomeDe(c.uid))}">Responder</button>${c.uid===S.uid?`<button type="button" class="c-a" data-apagar="${esc(c.id)}">Apagar</button>`:`<button type="button" class="c-a" data-denc="${esc(c.id)}" data-du="${esc(c.uid)}" data-dp="${esc(pid)}">Denunciar</button>`}</i></div></li>`).join("")}</ul>`:`<div class="empty" style="padding:18px 0"><b>Nenhum comentário ainda</b>Escreva o primeiro.</div>`};
  const n=socialOf(pid).cm.length;
  sheet(n?`Comentários (${n})`:"Comentários",`${typeof debCab==="function"?debCab(pid):""}<div id="cbox">${draw()}</div>`,`<form id="cform" class="cform">${S.uid?avatar(S.uid):""}<input class="field" id="ctext" maxlength="600" autocomplete="off" enterkeyhint="send" placeholder="Escreva um comentário…" aria-label="Comentário"><button class="sendc" type="submit" aria-label="Publicar" disabled><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg></button></form>`,{focus:!n});
  const box=()=>$("#cbox"),toEnd=()=>{const b=$(".sheet .sh-b");if(b)b.scrollTop=b.scrollHeight};toEnd();
  const inp=$("#ctext"),btn=$("#cform .sendc");inp.addEventListener("input",()=>{btn.disabled=!inp.value.trim()});
  let assin=JSON.stringify(socialOf(pid).cm.map(c=>c.id+c.texto));S._reCmt=forca=>{const b=box();if(!b)return;const k=JSON.stringify(socialOf(pid).cm.map(c=>c.id+c.texto));if(k===assin&&!forca)return;assin=k;const sb=$(".sheet .sh-b");const perto=sb&&sb.scrollHeight-sb.scrollTop-sb.clientHeight<90;b.innerHTML=draw();if(perto)toEnd();const nn=socialOf(pid).cm.length,hh=$(".sheet .sh-h");if(hh&&hh.firstChild&&hh.firstChild.nodeType===3)hh.firstChild.textContent=nn?`Comentários (${nn})`:"Comentários"};onClose=()=>{S._reCmt=null};
  box().addEventListener("click",async e=>{const r=e.target.closest("[data-resp]");if(r){inp.value="@"+r.dataset.resp+" ";btn.disabled=false;inp.focus();return}
    const ap=e.target.closest("[data-apagar]");if(ap){if(!ap.classList.contains("conf")){ap.classList.add("conf");ap.textContent="Toque de novo para apagar";return}
      const cid=ap.dataset.apagar;CPEND[S.uid+"\u0001"+cid]={v:null,t:Date.now()};S.cmts=montarCmts(S._cmtDocs);
      S._reCmt&&S._reCmt(true);updateSocial(pid);
      try{await gravarMapa("comentarios/"+S.uid,"itens",cid,null)}catch(err){delete CPEND[S.uid+"\u0001"+cid];S.cmts=montarCmts(S._cmtDocs);S._reCmt&&S._reCmt(true);updateSocial(pid);toast("Não deu para apagar agora.")}}});
  $("#cform").addEventListener("submit",async e=>{e.preventDefault();const t=inp.value.trim();if(!t||precisaConta())return;inp.value="";btn.disabled=true;inp.focus();
    const cid=Date.now().toString(36)+Math.random().toString(36).slice(2,6),c={uid:S.uid,texto:t,at:Date.now()};
    const sn=snapById(pid);const v={pid,texto:t,at:c.at,snap:sn?{id:pid,titulo:sn.titulo||"",secao:sn.secao||""}:{id:pid}};
    CPEND[S.uid+"\u0001"+cid]={v,t:Date.now()};S.cmts=montarCmts(S._cmtDocs);S._reCmt&&S._reCmt(true);toEnd();updateSocial(pid);
    try{await gravarMapa("comentarios/"+S.uid,"itens",cid,v)}catch(err){delete CPEND[S.uid+"\u0001"+cid];S.cmts=montarCmts(S._cmtDocs);S._reCmt&&S._reCmt(true);updateSocial(pid);const i=$("#ctext");if(i&&!i.value){i.value=t;const b=$("#cform .sendc");if(b)b.disabled=false}toast("O comentário não foi salvo. O texto voltou para a caixa.")}});
}
function shareCard(s,attrs=""){return `<button type="button" class="share paper" data-sec="${esc(s?.secao||"politica")}" ${attrs}>${svgOf(s?.imagem)}<div><span>${esc(secNome(s?.secao||"politica"))} · ${esc(s?.tag)}</span><b>${esc(s?.titulo)}</b></div></button>`}
function openSend(pid,pre){uso("enviar");
  if(precisaConta())return;
  const others=amigosL();
  if(!others.length){sheet("Enviar",`<div class="empty" style="padding:18px 0"><b>Nenhum amigo ainda</b>Adicione amigos no Perfil para mandar notícias para eles.</div><button type="button" class="btn ghost" data-vgo="me">Ir ao Perfil</button><button type="button" class="btn ghost" data-compart="${esc(pid)}">Compartilhar fora do Prumo</button>`);return}
  let sel=pre&&others.includes(pre)?pre:(others.length===1?others[0]:null);const snap=snapById(pid);
  const um=others.length===1;
  sheet(um?"Enviar para "+nomeDe(others[0]):"Enviar",`${um?"":`${others.length>6?`<input class="field" id="pkq" type="search" autocomplete="off" placeholder="Buscar amigo" aria-label="Buscar amigo" style="margin-bottom:10px">`:""}<div class="pick" id="pick">${others.map(u=>`<button type="button" data-pick="${esc(u)}" aria-pressed="${u===sel}">${avatar(u)}${esc(nomeDe(u))}</button>`).join("")}</div>`}${shareCard(snap,'style="width:100%;pointer-events:none" tabindex="-1"')}<button type="button" class="btn ghost" data-compart="${esc(pid)}">Compartilhar fora do Prumo</button>`,
    `<form id="sform"><input class="field" id="stext" maxlength="600" autocomplete="off" placeholder="Escreva uma mensagem (opcional)" aria-label="Mensagem"><button class="send" id="sbtn" type="submit" ${sel?"":"disabled"}>Enviar</button></form>`);
  $("#pkq")?.addEventListener("input",e=>{const n=norm(e.target.value).trim();document.querySelectorAll("#pick [data-pick]").forEach(b=>b.hidden=!!n&&!norm(b.textContent).includes(n))});
  $("#pick")?.addEventListener("click",e=>{const b=e.target.closest("[data-pick]");if(!b)return;sel=b.dataset.pick;document.querySelectorAll("[data-pick]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));$("#sbtn").disabled=false});
  $("#sform").addEventListener("submit",async e=>{e.preventDefault();if(!sel)return;const t=$("#stext").value.trim(),bt=$("#sbtn");if(bt.disabled&&bt.dataset.env)return;bt.disabled=true;bt.dataset.env="1";bt.textContent="Enviando…";
    try{await S.db.collection("mensagens").add({de:S.uid,para:sel,at:Date.now(),texto:t,pid,snap,lida:false});if($("#sform"))closeLayer();toast(`Enviado para ${nomeDe(sel)}`)}catch(err){const b=$("#sbtn");if(b){b.disabled=false;delete b.dataset.env;b.textContent="Enviar"}toast(err?.code==="permission_denied"?"Só dá para mandar para amigos.":"Não deu para enviar agora. Tente de novo.")}});
}
function snapLeve(pid){const s=snapById(pid);if(!s)return {id:pid};return {id:s.id||pid,secao:s.secao||"",tag:s.tag||"",titulo:s.titulo||"",texto:String(s.texto||"").slice(0,320),imagem:s.imagem||null,links:arrL(s.links).slice(0,1)}}
async function toggleSave(pid){uso("guardar");
  if(precisaConta())return;const on=!S.salvos[pid],antS=S.salvos[pid];
  if(on)S.salvos[pid]={at:Date.now(),snap:snapLeve(pid)};else delete S.salvos[pid];
  updateSocial(pid);toast(on?"Guardada":"Removida das guardadas",on?"Desfazer":"",on?()=>toggleSave(pid):null);if(VIEW==="saved")renderSaved();
  try{const val=on?{at:Date.now(),snap:snapLeve(pid)}:null;await gravarMapa(`data/users/${S.uid}/salvos`,"itens",pid,val)}catch(e){if(on)delete S.salvos[pid];else S.salvos[pid]=antS;updateSocial(pid);if(VIEW==="saved")renderSaved();toast("Não deu para guardar agora.")}
}
function abrirCobertura(pid){uso("cobertura");const p=pautaById(pid);if(!p)return;
  const map=FEED.espectro||{},fs=p.fontes||[],links=p.links||[],enq=p.enquadramentos||[],reg=REGUA(),c=p.checagem;
  const linha=k=>{const l=links.find(x=>x.fonte===k),e=enq.find(x=>x.fonte===k),sp=map[k];
    return `<li><div class="cv-h"><b>${esc(nomeFonte(k))}</b>${sp?`<span class="cv-e"><i style="background:${ESPECTRO_COR[sp]}"></i>${esc(ESPECTRO_NOME[sp])}</span>`:""}</div>${e?`<p>${esc(e.descricao)}</p>`:""}${l?`<a href="${escU(l.url)}" target="_blank" rel="noopener">Ler a matéria ›</a>`:""}</li>`};
  const fora=reg.filter(k=>!fs.includes(k));
  sheet("Quem noticiou",`${c?`<div class="cv-box">${selo(p,false)}<p>${esc(c.texto||(c.status==="divergencia"?"Os veículos trazem números diferentes.":"Os números principais batem em mais de um veículo."))}</p></div>`:`<p class="hint" style="margin:0">Esta notícia não tem número principal para conferir, por isso não leva selo.</p>`}
    <h4 class="cv-t">Noticiaram (${fs.length})</h4><ul class="cvl">${fs.map(linha).join("")}</ul>
    ${fora.length?`<h4 class="cv-t">Não encontramos em</h4><p class="hint" style="margin:0">${fora.map(k=>esc(nomeFonte(k))).join(", ")}</p>`:""}
    <p class="hint">O selo <b>No prumo</b> aparece quando os números principais da notícia batem em dois ou mais veículos. Quando não batem, aparece <b>Veículos divergem</b> e o texto acima diz quem publicou o quê. A posição de cada veículo no espectro é aproximada.</p>`)}
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
