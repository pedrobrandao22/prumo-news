/* ---------- Enviar: vários amigos de uma vez ---------- */
openSend=function(pid,pre){uso("enviar");if(precisaConta())return;const others=amigosL();
  if(!others.length){sheet("Enviar",`<div class="empty" style="padding:18px 0"><b>Nenhum amigo ainda</b>Adicione amigos no Perfil para mandar notícias para eles.</div><button type="button" class="btn ghost" data-vgo="me">Ir ao Perfil</button><button type="button" class="btn ghost" data-compart="${esc(pid)}">Compartilhar fora do Prumo</button>`);return}
  const sel=new Set(pre&&others.includes(pre)?[pre]:others.length===1?[others[0]]:[]);const snap=snapById(pid);
  const ult={};allMsgs().forEach(m=>{const o=m.de===S.uid?m.para:m.de;ult[o]=m.at});const ord=others.slice().sort((a,b)=>(ult[b]||0)-(ult[a]||0));
  const rot=()=>sel.size>1?`Enviar para ${sel.size}`:"Enviar";
  sheet("Enviar",`${others.length>6?`<input class="field" id="pkq" type="search" autocomplete="off" placeholder="Buscar amigo" aria-label="Buscar amigo" style="margin-bottom:10px">`:""}<div class="pick dm-pick" id="pick">${ord.map(u=>`<button type="button" data-pick="${esc(u)}" aria-pressed="${sel.has(u)}">${avatar(u)}<span>${esc(nomeDe(u))}</span><i class="dm-ck" aria-hidden="true"></i></button>`).join("")}</div>${shareCard(snap,'style="width:100%;pointer-events:none" tabindex="-1"')}<button type="button" class="btn ghost" data-compart="${esc(pid)}">Compartilhar fora do Prumo</button>`,
    `<form id="sform"><input class="field" id="stext" maxlength="600" autocomplete="off" placeholder="Escreva uma mensagem (opcional)" aria-label="Mensagem"><button class="send" id="sbtn" type="submit" ${sel.size?"":"disabled"}>${rot()}</button></form>`);
  $("#pkq")?.addEventListener("input",e=>{const n=norm(e.target.value).trim();document.querySelectorAll("#pick [data-pick]").forEach(b=>b.hidden=!!n&&!norm(b.textContent).includes(n))});
  $("#pick")?.addEventListener("click",e=>{const b=e.target.closest("[data-pick]");if(!b)return;const u=b.dataset.pick;if(sel.has(u))sel.delete(u);else sel.add(u);b.setAttribute("aria-pressed",String(sel.has(u)));const bt=$("#sbtn");bt.disabled=!sel.size;bt.textContent=rot()});
  $("#sform").addEventListener("submit",async e=>{e.preventDefault();if(!sel.size)return;const t=$("#stext").value.trim(),bt=$("#sbtn");if(bt.dataset.env)return;bt.disabled=true;bt.dataset.env="1";bt.textContent="Enviando…";
    const alvos=[...sel],res=await Promise.all(alvos.map(u=>S.db.collection("mensagens").add({de:S.uid,para:u,at:Date.now(),texto:t,pid,snap,lida:false}).then(()=>true,err=>err)));
    const ok=alvos.filter((u,i)=>res[i]===true),erro=res.find(x=>x!==true);
    if(ok.length===alvos.length){if($("#sform"))closeLayer();toast(`Enviado para ${ok.length>2?ok.length+" amigos":ok.map(nomeDe).join(" e ")}`)}
    else{ok.forEach(u=>sel.delete(u));document.querySelectorAll("#pick [data-pick]").forEach(x=>x.setAttribute("aria-pressed",String(sel.has(x.dataset.pick))));const b=$("#sbtn");if(b){b.disabled=false;delete b.dataset.env;b.textContent=rot()}
      toast(erro?.code==="permission_denied"?"Só dá para mandar para amigos.":ok.length?`Enviado para ${ok.map(nomeDe).join(" e ")}; o resto não foi. Tente de novo.`:"Não deu para enviar agora. Tente de novo.")}})};

