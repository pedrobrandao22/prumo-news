/* ---------- 206 · Criar (Fase 3): as funções de criar post e notícia comentada, cada uma numa versão só ----------
   Antes: criarAbrir definida no 068 e trocada no 071 e no 074, remendada em 093, 095, 096, 155 e 182; edDesenha definida
   no 071, trocada no 074 e remendada em 077, 100, 155, 164 e 166; edPublicaPost definida no 071, trocada no 076 e
   remendada em 093 (fila de publicar, pqEmbrulha), 095, 102, 105, 108, 113, 123, 152, 155 e 166; cn102Det definida no
   102 e remendada em 105, 106, 122, 123, 152 e 155 (três vezes). Cada função abaixo faz o que a cadeia inteira fazia, na
   mesma ordem; os comentários dizem de onde veio cada passo. Os auxiliares dos outros arquivos (cfp*, cn102*, fc105*,
   f113*, cs123*, cp152*, cr155*, fc164*, cr166*, pq*, ca100*, ft182*) continuam onde estavam: aqui eles só são chamados,
   sempre depois da carga (nenhuma destas funções roda na carga).
   Fica de fora (de propósito): o 080 troca edDesenha por um instante dentro de edVidPronto (vídeo do giro, Fase 1) e
   continua trocando a global como antes.
   Regra daqui para a frente: corrigir DENTRO destas funções, não embrulhá-las de novo em outro arquivo. */

/* ===== criarAbrir: abre o editor (post ou giro) =====
   Base no 074 (as versões do 068 e do 071 eram trocadas inteiras antes de qualquer uso). */
function cr206Abre(tipo){if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}uso("criar_"+tipo);if($("#layer").innerHTML)closeLayer();
  const st=edNovoSt();ED={modo:tipo==="story"?"story":"post",tela:"cam",env:false,st,sts:[st],si:0,po:{passo:"fotos",fotos:[],cur:0,ar:"4:5",texto:"",marcados:[],local:"",pid:null,aba:"filtros"}};
  $("#layer").innerHTML=`<div class="ce" role="dialog" aria-modal="true" aria-label="Criar"></div>`;if(pushH())HST++;edDesenha()};
function criarAbrir(tipo){
  /* 182: formato escondido (giro) não abre */
  if(tipo==="story"&&ft182Esc("giro"))return;
  /* 155: o giro que veio da caixa de criar */
  const g=CR155.giro;CR155.giro=0;
  /* 096: a câmera do reel volta a aceitar toque */
  RC.ocupado=false;
  /* 093: não abre enquanto publica; animação de entrada */
  if(PQ.atual)toast("Espere terminar de publicar.");
  else{pqAnimCls();cr206Abre.apply(this,arguments);const ce=$("#layer .ce");if(ce&&ANIM_OK()){ce.dataset.anim="entra";setTimeout(()=>{if(ce.dataset.anim==="entra")delete ce.dataset.anim},400)}}
  /* 095: post abre direto na galeria (também depois do aviso do 093, como antes) */
  if(tipo!=="story"&&tipo!=="reel")cfpAbreGaleria();
  /* 155: marca o giro aberto pela caixa */
  try{if(g&&tipo==="story"&&ED&&ED.modo==="story"){ED.cr155caixa=1;$("#layer .ce")?.classList.add("cr155-dacaixa")}}catch(e){}}

/* ===== edDesenha: desenha o editor aberto =====
   Base no 074 (a do 071 era trocada inteira); remendos (de dentro para fora): 077, 100, 155, 164, 166. */
function ed206Desenha0(){const el=$("#layer .ce");if(!el||!ED)return;el.className="ce ce-"+ED.modo+(ED.modo==="story"?" t-"+ED.tela:"");
  if(ED.modo==="story"){if(ED.tela==="cam")edCamTela(el);else if(ED.tela==="lay")edLayTela(el);else{camDesliga();edStory(el)}}else{camDesliga();edPost(el)}};
/* 077: reel vira post; para a gravação */
function ed206Desenha77(){if(!ED)return;if(ED.modo==="reel")ED.modo="post";if(CAM.rec)camGravaFim();return ed206Desenha0.apply(this,arguments)}
function edDesenha(){
  /* 164: foto nova escolhida pela caixa volta para a caixa (não desenha o editor) */
  const E=typeof ED!=="undefined"?ED:null;
  if(E&&E.fc164&&E.fc164novo&&E.po&&E.po.passo==="fotos"&&E.po.fotos.length){E.fc164novo=false;setTimeout(()=>{if(ED===E)fc164Volta()},0)}
  else{ed206Desenha77.apply(this,arguments);
    /* 100: legenda */
    try{if($("#layer #ce-leg"))ca100Leg()}catch(e){}
    /* 155: editor aberto pela caixa */
    try{if(ED&&ED.cr155caixa)$("#layer .ce")?.classList.add("cr155-dacaixa")}catch(e){}
    /* 164: ajustes da foto na caixa */
    try{fc164Ajusta(E)}catch(e){}}
  /* 166: trilho do giro */
  try{if(ED&&ED.modo==="story"){cr166Rail();requestAnimationFrame(cr166Rail)}}catch(e){}}

/* ===== cn102Det: o formulário de notícia comentada, relato, análise e enquete =====
   Base no 102; remendos (de dentro para fora): 105, 106, 122, 123, 152, 155 (três). */
function cn206Det0(el){const P=ED.po,cn=P.cn,k=cn.k,tem=P.fotos.length,nt=P.pid&&pautaById(P.pid),nm=[...new Set((P.tags||[]).map(t=>t.u).concat(P.marcados))],eu=cn102Primeiro(S.uid);
  const campo=(id,f,ph,max,v,x)=>f==="tit"?`<textarea class="cn102-in cn102-tit" id="${id}" data-cn102f="${f}" maxlength="${max}" rows="1" placeholder="${esc(ph)}" ${x||""}>${esc(v||"")}</textarea>`:`<input class="cn102-in" id="${id}" data-cn102f="${f}" maxlength="${max}" placeholder="${esc(ph)}" value="${esc(v||"")}" autocomplete="off" ${x||""}>`;
  let b="";
  if(k==="nt")b=`${nt?`<button type="button" class="cn102-ntc" data-edsont aria-label="Trocar a notícia">${cn102NtCard(nt)}</button>`:`<button type="button" class="cn102-dadd" data-edsont>${CN102_SVG(CN102_ICO.nt)}<span><b>Escolher a notícia</b><small>Uma das notícias da edição de hoje</small></span></button>`}
      ${tem?cn102Fotos(P):""}<textarea id="ce-leg" class="cfp-leg cn102-corpo" data-cn102f="corpo" maxlength="2000" rows="4" placeholder="O que você acha dessa notícia?" aria-label="Seu comentário">${esc(cn.corpo)}</textarea>`;
  if(k==="rel")b=`${cn102Fotos(P)}${campo("cn102-tit","tit","O que aconteceu? (título curto)",120,cn.tit,'enterkeyhint="next"')}
      <textarea id="ce-leg" class="cfp-leg cn102-corpo" data-cn102f="corpo" maxlength="2000" rows="4" placeholder="Conte o que você viu: o quê, onde, como." aria-label="Detalhes">${esc(cn.corpo)}</textarea>
      <div class="cfp-rows cn102-rows"><label class="ce-row"><span>Onde</span><input id="ce-local" data-cn102f="local" maxlength="60" placeholder="Bairro, cidade" value="${esc(P.local)}" autocomplete="off"></label>
        <label class="ce-row"><span>Quando</span><input id="cn102-q" type="datetime-local" lang="pt-BR" data-cn102f="q" value="${esc(cn.q||"")}" max="${cn102Hoje()}"></label>
        <label class="ce-row"><span>Fonte</span><input id="cn102-fu" data-cn102f="fu" maxlength="300" placeholder="Link ou de onde veio (opcional)" value="${esc(cn.fu)}" autocomplete="off" inputmode="url"></label></div>`;
  if(k==="ana")b=`${campo("cn102-tit","tit","Título da sua análise",120,cn.tit,'enterkeyhint="next"')}
      <textarea id="ce-leg" class="cfp-leg cn102-corpo" data-cn102f="corpo" maxlength="2000" rows="6" placeholder="Seu ponto de vista sobre economia ou política. Diga de onde vêm os números." aria-label="Sua análise">${esc(cn.corpo)}</textarea>
      <div class="cn102-dado">${cn102DadoBloco(cn)}</div>${tem?cn102Fotos(P):""}
      <div class="cfp-rows cn102-rows"><label class="ce-row"><span>Fonte</span><input id="cn102-fu" data-cn102f="fu" maxlength="300" placeholder="Link ou nome da fonte (opcional)" value="${esc(cn.fu)}" autocomplete="off" inputmode="url"></label>
        ${tem?"":`<button type="button" class="ce-row" data-cn102foto><span>Adicionar foto</span><em></em><i>›</i></button>`}</div>`;
  if(k==="enq"){const os=cn.o.length?cn.o:["",""];b=`${campo("cn102-tit","tit","Sua pergunta",120,cn.tit,'enterkeyhint="next"')}
      <div class="cn102-ops">${os.map((v,i)=>`<span class="cn102-op"><input data-cn102o="${i}" maxlength="40" placeholder="${["Sim","Não","Opção 3","Opção 4"][i]}" value="${esc(v)}" aria-label="Opção ${i+1}" autocomplete="off">${i>1?`<button type="button" data-cn102otira="${i}" aria-label="Tirar a opção">${CN102_SVG(CN102_ICO.x)}</button>`:""}</span>`).join("")}${os.length<4?`<button type="button" class="cn102-opm" data-cn102omais>${CN102_SVG(CN102_ICO.mais)}Opção</button>`:""}</div>
      <div class="cfp-rows cn102-rows"><button type="button" class="ce-row" data-edsont><span>Sobre a notícia</span><em>${nt?esc(versao(nt,lente()).titulo):"Opcional"}</em><i>›</i></button>${nt?`<button type="button" class="ce-row ce-semnt" data-edsemnt><span>Tirar a notícia</span></button>`:""}</div>
      <textarea id="ce-leg" class="cfp-leg cn102-corpo" data-cn102f="corpo" maxlength="2000" rows="2" placeholder="Contexto (opcional)" aria-label="Contexto">${esc(cn.corpo)}</textarea>`}
  const aviso={nt:"A notícia aparece como da edição do Prumo e o comentário, com o seu nome.",rel:`Aparece como “Relato de ${eu}”. Conte só o que você viu ou confirmou: a redação não checa relatos.`,
    ana:`Aparece como “Opinião de ${eu}”, separada das notícias da edição.`,enq:"Seus amigos votam e veem o resultado, como nas enquetes da edição."}[k];
  el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="fotos" aria-label="Voltar">${EDI.vol}</button><b>${esc(CN102_NOME[k])}</b><span class="ce-b" aria-hidden="true"></span></div>
    <div class="ce-det cfp-det cn102" data-k="${k}"><div class="cn102-ks" role="tablist" aria-label="Tipo de publicação">${CN102_KS.map(([kk,n])=>`<button type="button" role="tab" data-cn102k="${kk}" aria-selected="${kk===k}">${CN102_SVG(CN102_ICO[kk])}${esc(n)}</button>`).join("")}</div>
      ${b}
      <div class="cfp-rows"><button type="button" class="ce-row" ${tem?"data-edtags":"data-edmarcar"}><span>Marcar pessoas</span><em>${nm.length?esc(nm.map(u=>cn102Primeiro(u)).join(", ")):""}</em><i>›</i></button>
        ${MA.on?`<button type="button" class="ce-row" data-cfppub><span>Público</span><em>${P.pub==="proximos"?"★ Melhores amigos":"Todos os amigos"}</em><i>›</i></button>`:""}
        <button type="button" class="ce-row" data-edavanc aria-expanded="${!!P.avOn}"><span>Configurações avançadas</span><em></em><i>${P.avOn?"⌃":"›"}</i></button>
        ${P.avOn?`<div class="ce-avc"><label class="ce-sw"><span>Ocultar o número de curtidas<small>Só você vê quem curtiu.</small></span><input type="checkbox" data-edsw="semCurt" ${P.semCurt?"checked":""}></label>
          <label class="ce-sw"><span>Desativar comentários<small>Ninguém poderá comentar neste post.</small></span><input type="checkbox" data-edsw="semCom" ${P.semCom?"checked":""}></label>
          ${tem?`<b class="ce-avt" id="cfp-altt">Texto alternativo</b>${P.fotos.map((x,i)=>`<div class="ce-altr"><img alt="" data-ai="${i}"><input class="field" maxlength="200" placeholder="Descreva a foto ${i+1}" data-edalt="${i}" value="${esc(x.alt||"")}"></div>`).join("")}`:""}</div>`:""}</div>
      <p class="cn102-aviso">${esc(aviso)}</p></div>
    <div class="cfp-share cn102-share">${k==="nt"&&nt?`<button type="button" class="cn102-st" data-cn102nst>${CN102_SVG(CN102_ICO.story)}Giro</button>`:""}<button type="button" class="cfp-shb" data-edpubpo ${ED.env?"disabled":""}>${ED.env?"Publicando…":"Publicar"}</button></div>`;
  el.querySelectorAll("img[data-ai]").forEach(im=>{im.src=edUrlF(P.fotos[+im.dataset.ai])});cn102Cresce($("#cn102-tit"));
  el.querySelectorAll("canvas[data-cfpc]").forEach(c=>{try{edRenderFoto(P.fotos[+c.dataset.cfpc],c,P.ar)}catch(e){}})}
function cn102Det(el){const r=cn206Det0.apply(this,arguments);
  /* 105: regra da casa no aviso e pedido de fonte na análise */
  if(FOCO_LIGADO)try{const a=el.querySelector(".cn102-aviso");if(a&&!a.querySelector(".fc105-regra"))a.insertAdjacentHTML("beforeend",`<span class="fc105-regra">Discuta as ideias, com respeito às pessoas.</span>`);
      const fu=el.querySelector("#cn102-fu");const P=ED&&ED.po;if(fu&&P&&P.cn&&P.cn.k==="ana"){fu.placeholder="Link ou nome da fonte (recomendado)";if(P._fc105fu)fu.closest(".ce-row")?.classList.add("fc105-pede")}}catch(e){}
  /* 106: texto curto do pedido de fonte */
  try{const fu=el.querySelector("#cn102-fu");if(FOCO_LIGADO&&fu&&/recomendado/.test(fu.placeholder))fu.placeholder="Link ou nome (recomendado)"}catch(e){}
  /* 122: aviso do relato com o nome do tipo */
  try{const P=ED&&ED.po;if(P&&P.cn&&P.cn.k==="rel"&&el){const av=el.querySelector(".cn102-aviso");
    if(av)av.textContent=`Aparece como “${DC122_DP} · ${cn102Primeiro(S.uid)}”. Conte só o que você viu ou confirmou: a redação não checa estes posts.`}}catch(e){}
  /* 123: aba Coluna na faixa de tipos */
  try{const ks=el.querySelector(".cn102-ks");if(ks&&!ks.querySelector("[data-cs123ini]"))ks.insertAdjacentHTML("beforeend",`<button type="button" role="tab" data-cs123ini aria-selected="false">${CN102_SVG(CS123_IC.col)}Coluna</button>`)}catch(e){}
  /* 152: veio da caixa: sem a faixa de tipos */
  try{if(CP152.veio){const ks=el.querySelector(".cn102-ks");if(ks)ks.hidden=true}}catch(e){}
  /* 155: faixa de tipos sempre escondida; opções da enquete numeradas; cartão da notícia mais claro */
  try{const ks=el.querySelector(".cn102-ks");if(ks)ks.hidden=true}catch(e){}
  try{el.querySelectorAll("input[data-cn102o]").forEach(i=>{i.placeholder="Opção "+(+i.dataset.cn102o+1)})}catch(e){}
  try{cr155Clareia(el.querySelector(".cn102-ntc"))}catch(e){}
  return r}

/* ===== edPublicaPost: publica o post (texto, fotos, notícia comentada, análise, relato, enquete, fio) =====
   Base no 076 (a do 071 era trocada inteira); camadas (de dentro para fora): 093 (fila de publicar), 095, 102, 105, 108,
   113, 123, 152, 155, 166. Os remendos 095, 102, 113 e 123 trocavam SB.from durante a publicação para mexer na linha
   gravada; aqui eles marcam ED206_LINHA enquanto a publicação corre e ed206Linha aplica as marcas na mesma ordem
   (095, 102, 113, 123) logo antes de cada insert, como faziam os SB.from trocados. */
var ED206_LINHA={};
function ed206Linha(row){const L=ED206_LINHA;
  /* 095: público "próximos" */
  if(L.pub095&&row&&row.tipo==="post")row.publico=L.pub095;
  /* 102: notícia comentada, relato, análise, enquete */
  if(L.cn102)try{if(row&&row.tipo==="post"&&row.estilo&&typeof row.estilo==="object")row.estilo.cn=L.cn102}catch(e){}
  /* 113: fio (as partes) */
  if(L.fio113)try{if(row&&row.tipo==="post"&&row.estilo&&typeof row.estilo==="object")row.estilo.fio=L.fio113}catch(e){}
  /* 123: só para seguidores */
  if(L.seg123)try{if(row&&row.tipo==="post")row.publico="seguidores"}catch(e){}
  return row}
/* marca de 095/102/113/123 válida enquanto a publicação corre (como o SB.from trocado, que voltava no finally) */
async function ed206ComLinha(k,v,fn){const o=ED206_LINHA[k];ED206_LINHA[k]=v;try{return await fn()}finally{ED206_LINHA[k]=o}}
async function ed206Pub076(){if(!ED||ED.env)return;const P=ED.po;if(!P.fotos.length&&!P.texto.trim()&&!P.pid){toast("Escreva algo, escolha fotos ou anexe uma notícia.");return}ED.env=true;const ed0=ED;edDesenha();const fotos=[];
  try{for(const f of P.fotos){const c=document.createElement("canvas");c.width=1080;edRenderFoto(f,c,P.ar);const b=await edJpeg(c);fotos.push(await pubSobe(b));PUB.urls[fotos[fotos.length-1]]={u:URL.createObjectURL(b),exp:Date.now()+3600e3}}
    const tags=(P.tags||[]).map(t=>{const i=P.fotos.indexOf(edTagF(t));return i>=0?{u:t.u,i,x:+(+t.x).toFixed(3),y:+(+t.y).toFixed(3)}:null}).filter(Boolean).slice(0,30),marc=[...new Set(tags.map(t=>t.u).concat(P.marcados))].slice(0,20);
    const at=Date.now(),row={autor:S.uid,tipo:"post",at,texto:P.texto.trim().slice(0,2200),fotos,pid:P.pid||null,snap:pubSnap(P.pid),estilo:{v:2,ar:P.ar,arv:P.fotos.length?+edAR(P.ar,edBase(P.fotos[0])).toFixed(3):null,marcados:marc,local:P.local.trim().slice(0,60),tags,alt:P.fotos.map(f=>String(f.alt||"").slice(0,200)),semCom:!!P.semCom,semCurt:!!P.semCurt}};
    let r=await SB.from("publicacoes").insert(ed206Linha(row)).select("id");if(r.error&&/estilo/i.test(JSON.stringify(r.error))){row.estilo.alt=row.estilo.alt.map(a=>a.slice(0,40));row.estilo.tags=tags.slice(0,10);row.estilo.marcados=row.estilo.marcados.slice(0,10);r=await SB.from("publicacoes").insert(ed206Linha(row)).select("id");if(r.error&&/estilo/i.test(JSON.stringify(r.error))){row.estilo.alt=[];row.estilo.tags=tags.slice(0,4);r=await SB.from("publicacoes").insert(ed206Linha(row)).select("id");if(!r.error)setTimeout(()=>toast("Publicado, mas algumas marcações e textos alternativos ficaram de fora (limite do servidor)."),1200)}}if(r.error)throw r.error;const id=r.data&&r.data[0]&&r.data[0].id;PUB.itens.unshift({...row,id});if(P.rid)rascApaga(P.rid);
    const txt=row.texto,aqui=ED===ed0&&$("#layer .ce");ED=null;if(aqui){closeLayer._ok=true;closeLayer()}toast("Post publicado");vibrar(10);
    if(id&&txt)pubAvisarMencoes(id,txt,"post");const mm=marc.filter(u=>S.amigos.has(u)&&!(typeof mencionados==="function"&&mencionados(txt).includes(u)));
    if(id&&mm.length)Promise.all(mm.map(u=>dmEnviar(u,{texto:"",pid:"u:"+id,snap:{titulo:"Post de "+nomeDe(S.uid),upub:id},tipo:"mencao"},true)));pubRedesenha();setTimeout(pubCarregar,1500)}
  catch(e){if(fotos.length)try{await SB.storage.from("fotos").remove(fotos)}catch(_){}if(ED===ed0){ED.env=false;edDesenha()}toast("Não deu para publicar. Tente de novo.")}};
/* 093: a fila de publicar (barra "Publicando…", tentar de novo) em volta da base; a mesma camada do pqEmbrulha */
const ED206_PQ=pqCamada("post",ed206Pub076);
/* 105, 102 e 095 (de fora para dentro) */
async function ed206Pub105(){
  /* 105: análise sem fonte: pede a fonte uma vez antes de publicar */
  if(FOCO_LIGADO){const P=ED&&ED.po;try{if(P&&P.cn&&P.cn.k==="ana"&&!ED.env&&!P._fc105fu&&!String(P.cn.fu||"").trim()&&!(P.cn.d&&P.cn.d.tipo==="ind")&&!cn102Valida(P)){
      P._fc105fu=1;edDesenha();const i=$("#cn102-fu"),row=i&&i.closest(".ce-row");if(row){row.insertAdjacentHTML("afterend",`<p class="fc105-pedet" role="status">De onde vêm as informações? Uma fonte dá mais confiança a quem lê. Se não tiver, toque em Publicar de novo.</p>`);row.scrollIntoView({block:"center"});try{i.focus({preventScroll:true})}catch(e){}}return}}catch(e){}}
  /* 102: notícia comentada e afins: valida, grava os campos e monta o texto */
  const P=ED&&ED.po;if(!P||!P.cn||ED.env||!SB)return ed206Pub095.apply(this,arguments);
  const er=cn102Valida(P);if(er){toast(er);return}const cn=cn102Grava(P);
  P.texto=cn102Texto(cn.k==="nt"?{tit:""}:P.cn,P.cn.corpo);if(!P.texto.trim()&&!P.pid&&!P.fotos.length){toast("Escreva algo antes de publicar.");return}
  return ed206ComLinha("cn102",cn,()=>ed206Pub095.apply(this,arguments))}
async function ed206Pub095(){
  /* 095: público "próximos" (melhores amigos): sem ninguém escolhido abre a lista */
  const pub=ED&&ED.po&&MA.on&&ED.po.pub==="proximos"?"proximos":null;if(!pub||!SB)return ED206_PQ.apply(this,arguments);if(!ED.env&&!MA.set.size){edMaLista(true);return}
  return ed206ComLinha("pub095",pub,()=>ED206_PQ.apply(this,arguments))}
/* 108 (síncrono, como era): guarda o rascunho enquanto publica e apaga quando dá certo */
function ed206Pub108(){const ed=ED;const p=ed206Pub105.apply(this,arguments);
  try{const j=PQ.atual;if(ed&&j&&j.ed===ed&&j.tipo==="post"&&typeof rascSalva==="function"){const P=ed.po;if(!P.rid)P.rid=edNid();const rid=P.rid,s=ED;
      ED=ed;try{rascSalva().catch(()=>{})}finally{ED=s}pq108Grava(pq108Le().filter(x=>x!==rid).concat(rid));
      Promise.resolve(p).then(()=>{if(j.estado==="ok"){pq108Grava(pq108Le().filter(x=>x!==rid));setTimeout(()=>rascApaga(rid),1500)}},()=>{})}}catch(e){}
  return p}
/* 113: fio (várias partes) */
async function ed206Pub113(){const P=ED&&ED.po;if(!VN_FASE2||!P||ED.env||!SB||!f113PodeCompor(P))return ed206Pub108.apply(this,arguments);
  const parts=f113Limpa(P.f113fio);if(!parts.length)return ed206Pub108.apply(this,arguments);
  const p1=P.cn?String(P.cn.corpo||"").trim()||String(P.cn.tit||"").trim():String(P.texto||"").trim();if(!p1){toast("Escreva a primeira parte do fio.");try{$("#ce-leg")?.focus()}catch(e){}return}
  const r=await ed206ComLinha("fio113",parts,()=>ed206Pub108.apply(this,arguments));
  try{const x=(PUB.itens||[]).find(y=>y&&y.autor===S.uid&&y.estilo&&y.estilo.fio===parts);if(x&&x.id){uso("fase2_fio");f113AvisaPartes(x.id,x.texto,parts)}}catch(e){}return r}
async function edPublicaPost(){
  /* 166: erro do formulário aparece no campo, sem publicar */
  if($("#layer .ce"))CR166.pubT=Date.now();
  try{const P=ED&&ED.po;if(P&&P.cn&&!ED.env&&$("#layer .ce")){const er=cn102Valida(P);if(er&&cr166Erro(er,P))return}}catch(e){}
  /* 155 e 152: publicado pela caixa de criar */
  const cx155=CP152.direto||CP152.veio;
  const cx152=CP152.direto||CP152.veio;CP152.direto=false;CP152.veio=false;
  const antes=cx152?new Set((PUB.itens||[]).filter(x=>x.autor===S.uid).map(x=>x.id)):null;
  /* 123: só para seguidores */
  const P=ED&&ED.po;
  const r=await (!P||P.pub!=="seguidores"||!cs123PodeSeg()||!SB||ED.env?ed206Pub113.apply(this,arguments):ed206ComLinha("seg123",1,()=>ed206Pub113.apply(this,arguments)));
  /* 152: o post novo aparece na tela do Feed */
  if(cx152)try{const novo=(PUB.itens||[]).find(x=>x.autor===S.uid&&x.tipo==="post"&&x.id&&!antes.has(x.id));if(novo){if(VIEW!=="feed")go("feed");cp152Mostra(novo.id)}}catch(e){}
  /* 155: limpa a caixa depois de publicar */
  try{if(cx155&&!$("#layer .ce"))cr155Limpa()}catch(e){}
  return r}
