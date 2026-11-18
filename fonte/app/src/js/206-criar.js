/* ---------- 206 · Criar (Fase 3): as funções de criar post e notícia comentada, cada uma numa versão só ----------
   Antes: criarAbrir definida no 068 e trocada no 071 e no 074, remendada em 093, 095, 096, 155 e 182; edDesenha definida
   no 071, trocada no 074 e remendada em 077, 100, 155, 164 e 166; edPublicaPost definida no 071, trocada no 076 e
   remendada em 093 (fila de publicar, pqEmbrulha), 095, 102, 105, 108, 113, 123, 152, 155 e 166; cn102Det definida no
   102 e remendada em 105, 106, 122, 123, 152 e 155 (três vezes). Cada função abaixo faz o que a cadeia inteira fazia, na
   mesma ordem; os comentários dizem de onde veio cada passo. Os auxiliares dos outros arquivos (cfp*, cn102*, fc105*,
   f113*, cs123*, cp152*, cr155*, fc164*, cr166*, pq*, ca100*, ft182*) continuam onde estavam: aqui eles só são chamados,
   sempre depois da carga (nenhuma destas funções roda na carga).
   Também aqui: edPost (071, trocada no 076, remendada em 081 e 095), cfpDet (095; 102, 113, 123), cn102Valida (102; 122,
   155, 166), cp152Desenha (152; 155, 164) e cfpAbreGaleria (095; 102 embrulhava e depois trocava por uma que não faz nada).
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
  /* 095 abria a galeria aqui (cfpAbreGaleria); desde o 102 ela não faz nada: o passo saiu */
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

/* ===== cfpAbreGaleria: não faz nada =====
   O 095 abria a galeria ao abrir o editor de post; o 102 (02/11) trocou por uma vazia ("o + abre direto em O que você quer
   publicar?"). O botão de modo (095, [data-edmodo]) ainda chama. */
function cfpAbreGaleria(){}

/* ===== edPost: o editor de post (fotos, editar, detalhes) =====
   Base no 076 (a do 071 era trocada inteira); remendos: 081 (marcações seguem a foto), 095 (telas novas: cfpFotos, cfpEdit,
   cfpDet; se uma delas der erro, volta para a tela antiga com o 081). */
function ed206Post076(el){const P=ED.po;P.rolo=P.rolo||P.fotos.slice();P.tags=P.tags||[];const f=P.fotos[P.cur];
  if(P.passo==="fotos"){
    el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edfechar aria-label="Fechar">${EDI.x}</button><b>Novo post</b><button type="button" class="ce-av" data-edav ${P.fotos.length?"":"disabled"}>Avançar</button></div>
      ${P.rolo.length&&f?`<div class="ce-pvw"><div class="ce-pv" id="ce-pv"><img id="ce-pvi" alt="" draggable="false"></div><button type="button" class="ce-arb" data-edar aria-label="Formato">${P.ar==="orig"?"Original":P.ar}</button><button type="button" class="ce-mlt${P.multi?" on":""}" data-edmulti aria-pressed="${!!P.multi}" aria-label="Selecionar vários">⧉ ${P.multi?"Vários":"Um"}</button>${P.fotos.length>1?`<span class="ce-npg">${P.cur+1}/${P.fotos.length}</span>`:""}</div>
        <div class="ce-gfh"><b>Escolhidas</b><span>${P.multi?"Toque para escolher a ordem":"Arraste e pince a foto para enquadrar"}</span></div>
        <div class="ce-grade">${P.rolo.map((x,i)=>{const n=P.fotos.indexOf(x);return `<button type="button" class="ce-gi${x===f?" on":""}${n>=0?" sel":""}" data-edrolo="${i}"><img alt="" data-ri="${i}">${P.multi?`<i class="ce-num${n>=0?" on":""}">${n>=0?n+1:""}</i>`:""}</button>`}).join("")}<button type="button" class="ce-gi ce-gim" data-edpgal aria-label="Mais fotos">+</button></div>`
      :`<div class="ce-vz"><button type="button" class="ce-big" data-edpgal>${EDI.gal}<b>Escolher fotos</b><span>até 10, da galeria</span></button><div class="ce-vz2"><button type="button" data-edsotexto>Só texto</button><button type="button" data-edsont>Notícia do Prumo</button></div><div id="ce-rascs"></div></div>`}
      ${edModos()}<input type="file" id="ce-pfile" accept="image/*" multiple hidden>`;
    if(f){$("#ce-pvi").src=edUrlF(f);edPvTam();edPvPos();edGestosPv()}el.querySelectorAll(".ce-grade img[data-ri]").forEach(im=>{im.src=edUrlF(P.rolo[+im.dataset.ri])});
    if(!P.rolo.length)rascChip();
    $("#ce-pfile").addEventListener("change",async e=>{const fs=[...e.target.files];e.target.value="";if(!fs.length)return;const novos=[];for(const x of fs.slice(0,30)){try{novos.push(edNovaFoto(await edCarrega(x,2048)))}catch(err){toast("Não deu para abrir uma das fotos.")}}if(!novos.length||!ED)return;
      P.rolo.push(...novos);if(novos.length>1)P.multi=true;if(P.multi){const cabe=novos.slice(0,10-P.fotos.length);if(cabe.length<novos.length)toast("Um post tem no máximo 10 fotos.");P.fotos.push(...cabe);P.cur=Math.max(0,P.fotos.length-cabe.length)}else{P.fotos=[novos[0]];P.cur=0}edDesenha()})}
  else if(P.passo==="filtros"){const fi=f.fi==null?100:f.fi;
    el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="fotos" aria-label="Voltar">${EDI.vol}</button><b>Editar</b><button type="button" class="ce-av" data-edav>Avançar</button></div>
      <div class="ce-pvw"><canvas id="ce-fc" class="ce-fc"></canvas>${P.fotos.length>1?`<button type="button" class="ce-nav l" data-edfn="-1" aria-label="Foto anterior">‹</button><button type="button" class="ce-nav r" data-edfn="1" aria-label="Próxima foto">›</button><span class="ce-npg">${P.cur+1}/${P.fotos.length}</span>`:""}</div>
      <div class="ce-abas2"><button type="button" data-edaba="filtros" aria-selected="${P.aba==="filtros"}">Filtros</button><button type="button" data-edaba="editar" aria-selected="${P.aba==="editar"}">Editar</button></div>
      ${P.aba==="filtros"?(P.fiOn&&f.f!=="normal"?`<div class="ce-fi"><span>${esc((ED_FILTROS.find(x=>x[0]===f.f)||[])[1]||"")}</span><input type="range" min="0" max="100" value="${fi}" data-edaj2="fi" aria-label="Intensidade do filtro"><i id="ce-aj2-fi">${fi}</i><button type="button" class="ce-ok" data-edfiok>Concluir</button></div>`
          :`<div class="ce-flts">${ED_FILTROS.map(([k,n])=>`<button type="button" data-edflt="${k}" class="${k===f.f?"on":""}"><canvas data-fk="${k}" width="72" height="72"></canvas><span>${n}</span></button>`).join("")}</div><p class="ce-dica2 ce-dc">Toque de novo no filtro escolhido para mudar a intensidade.</p>`)
        :`<div class="ce-ajs"><div class="ce-ajt"><button type="button" class="ce-chip" data-edgira>↻ Girar</button><label><span>Endireitar<i id="ce-aj2-str">${f.str||0}°</i></span><input type="range" min="-45" max="45" value="${f.str||0}" data-edaj2="str"></label></div>
          ${ED_AJS.map(([k,n,a,b])=>`<label><span>${n}<i id="ce-aj2-${k}">${f.aj[k]||0}</i></span><input type="range" min="${a}" max="${b}" value="${f.aj[k]||0}" data-edaj2="${k}"></label>`).join("")}<button type="button" class="ce-chip" data-edajzero>Desfazer ajustes desta foto</button></div>`}`;
    edPrevFiltro();if(P.aba==="filtros"&&!(P.fiOn&&f.f!=="normal"))edMiniFiltros()}
  else{const tem=P.fotos.length,nt=P.pid&&pautaById(P.pid),nm=[...new Set(P.tags.map(t=>t.u).concat(P.marcados))];
    el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="${tem?"filtros":"fotos"}" aria-label="Voltar">${EDI.vol}</button><b>Novo post</b><button type="button" class="ce-av" data-edpubpo ${ED.env?"disabled":""}>${ED.env?"Publicando…":"Compartilhar"}</button></div>
      <div class="ce-det"><div class="ce-legr">${tem?`<canvas id="ce-dthumb" width="128" height="160"></canvas>`:`<span class="ce-dsem" style="background:${pubFundo(1)}">Aa</span>`}<textarea id="ce-leg" maxlength="2200" rows="4" placeholder="${tem||P.pid?"Escreva uma legenda…":"Escreva o seu post…"}" aria-label="Legenda">${esc(P.texto)}</textarea></div>
        <button type="button" class="ce-row" ${tem?"data-edtags":"data-edmarcar"}><span>Marcar pessoas</span><em>${nm.length?esc(nm.map(u=>String(nomeDe(u)).split(" ")[0]).join(", ")):""}</em><i>›</i></button>
        <label class="ce-row"><span>Adicionar local</span><input id="ce-local" maxlength="60" placeholder="Ex.: Rio de Janeiro" value="${esc(P.local)}"></label>
        <button type="button" class="ce-row" data-edsont><span>${nt?"Notícia anexada":"Anexar notícia"}</span><em>${nt?esc(versao(nt,lente()).titulo):""}</em><i>›</i></button>
        ${nt?`<button type="button" class="ce-row ce-semnt" data-edsemnt><span>Tirar a notícia</span></button>`:""}
        <button type="button" class="ce-row" data-edavanc aria-expanded="${!!P.avOn}"><span>Configurações avançadas</span><em></em><i>${P.avOn?"⌃":"›"}</i></button>
        ${P.avOn?`<div class="ce-avc"><label class="ce-sw"><span>Ocultar o número de curtidas<small>Só você vê quem curtiu.</small></span><input type="checkbox" data-edsw="semCurt" ${P.semCurt?"checked":""}></label>
          <label class="ce-sw"><span>Desativar comentários<small>Ninguém poderá comentar neste post.</small></span><input type="checkbox" data-edsw="semCom" ${P.semCom?"checked":""}></label>
          ${tem?`<b class="ce-avt">Texto alternativo</b><p class="ce-selh">Descreva cada foto para quem usa leitor de tela.</p>${P.fotos.map((x,i)=>`<div class="ce-altr"><img alt="" data-ai="${i}"><input class="field" maxlength="200" placeholder="Descreva a foto ${i+1}" data-edalt="${i}" value="${esc(x.alt||"")}"></div>`).join("")}`:""}</div>`:""}
        <p class="cr-quem">Seus amigos no Prumo vão ver. Use @ para marcar alguém na legenda.</p></div>`;
    const ta=$("#ce-leg");ta.addEventListener("input",()=>{P.texto=ta.value;if(typeof menSugere==="function")menSugere(ta)});$("#ce-local").addEventListener("input",e=>{P.local=e.target.value});
    el.querySelectorAll("img[data-ai]").forEach(im=>{im.src=edUrlF(P.fotos[+im.dataset.ai])});
    if(tem){const c=$("#ce-dthumb");edRenderFoto(P.fotos[0],c,P.ar)}}};
function ed206Post81(){try{const P=ED.po;(P.tags||[]).forEach(t=>{const i=P.fotos.indexOf(edTagF(t));if(i>=0)t.i=i})}catch(e){}return ed206Post076.apply(this,arguments)}
function edPost(el){const P=ED.po;P.rolo=P.rolo||P.fotos.slice();P.tags=P.tags||[];try{P.tags.forEach(t=>{const i=P.fotos.indexOf(edTagF(t));if(i>=0)t.i=i})}catch(e){}
  if(P.cur>=P.fotos.length)P.cur=Math.max(0,P.fotos.length-1);
  try{if(P.passo==="fotos")cfpFotos(el);else if(P.passo==="filtros"&&P.fotos.length)cfpEdit(el);else cfpDet(el)}catch(e){return ed206Post81.apply(this,arguments)}}

/* ===== cfpDet: o passo de detalhes do post (legenda, público, marcar, local) =====
   Base no 095; remendos (de dentro para fora): 102 (notícia comentada e afins desenham o formulário do cn102Det),
   113 (fio: "Adicionar parte"), 123 (público "seguidores"). */
function cfp206Det0(el){const P=ED.po,tem=P.fotos.length,nt=P.pid&&pautaById(P.pid),nm=[...new Set(P.tags.map(t=>t.u).concat(P.marcados))],alts=P.fotos.filter(x=>String(x.alt||"").trim()).length;
  el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edvolta="${tem?"filtros":"fotos"}" aria-label="Voltar">${EDI.vol}</button><b>Novo post</b><span class="ce-b" aria-hidden="true"></span></div>
    <div class="ce-det cfp-det">${tem?`<div class="cfp-car${tem===1?" um":""}">${P.fotos.map((x,i)=>`<canvas data-cfpc="${i}" width="240" aria-label="Foto ${i+1}"></canvas>`).join("")}</div>`:nt?`<div class="cfp-nt"><small>Notícia anexada</small><b>${esc(versao(nt,lente()).titulo)}</b></div>`:""}
      <textarea id="ce-leg" class="cfp-leg" maxlength="2200" rows="3" placeholder="${tem||P.pid?"Escreva uma legenda…":"Escreva o seu post…"}" aria-label="Legenda">${esc(P.texto)}</textarea>
      <div class="cfp-rows">
      <button type="button" class="ce-row" ${tem?"data-edtags":"data-edmarcar"}><span>Marcar pessoas</span><em>${nm.length?esc(nm.map(u=>String(nomeDe(u)).split(" ")[0]).join(", ")):""}</em><i>›</i></button>
      <label class="ce-row"><span>Adicionar local</span><input id="ce-local" maxlength="60" placeholder="Ex.: Rio de Janeiro" value="${esc(P.local)}"></label>
      ${tem?`<button type="button" class="ce-row" data-cfpalt><span>Texto alternativo</span><em>${alts?`${alts} de ${tem}`:""}</em><i>›</i></button>`:""}
      ${MA.on?`<button type="button" class="ce-row" data-cfppub><span>Público</span><em>${P.pub==="proximos"?"★ Melhores amigos":"Todos os amigos"}</em><i>›</i></button>`:""}
      <button type="button" class="ce-row" data-edsont><span>${nt?"Notícia anexada":"Anexar notícia"}</span><em>${nt?esc(versao(nt,lente()).titulo):""}</em><i>›</i></button>
      ${nt?`<button type="button" class="ce-row ce-semnt" data-edsemnt><span>Tirar a notícia</span></button>`:""}
      <button type="button" class="ce-row" data-edavanc aria-expanded="${!!P.avOn}"><span>Configurações avançadas</span><em></em><i>${P.avOn?"⌃":"›"}</i></button>
      ${P.avOn?`<div class="ce-avc"><label class="ce-sw"><span>Ocultar o número de curtidas<small>Só você vê quem curtiu.</small></span><input type="checkbox" data-edsw="semCurt" ${P.semCurt?"checked":""}></label>
        <label class="ce-sw"><span>Desativar comentários<small>Ninguém poderá comentar neste post.</small></span><input type="checkbox" data-edsw="semCom" ${P.semCom?"checked":""}></label>
        ${tem?`<b class="ce-avt" id="cfp-altt">Texto alternativo</b><p class="ce-selh">Descreva cada foto para quem usa leitor de tela.</p>${P.fotos.map((x,i)=>`<div class="ce-altr"><img alt="" data-ai="${i}"><input class="field" maxlength="200" placeholder="Descreva a foto ${i+1}" data-edalt="${i}" value="${esc(x.alt||"")}"></div>`).join("")}`:""}</div>`:""}</div>
      <p class="cr-quem">${P.pub==="proximos"?"Só os seus Melhores amigos vão ver.":"Seus amigos no Prumo vão ver."} Use @ para marcar alguém na legenda.</p></div>
    <div class="cfp-share"><button type="button" class="cfp-shb" data-edpubpo ${ED.env?"disabled":""}>${ED.env?"Publicando…":"Compartilhar"}</button></div>`;
  const ta=$("#ce-leg");ta.addEventListener("input",()=>{P.texto=ta.value;if(typeof menSugere==="function")menSugere(ta)});$("#ce-local").addEventListener("input",e=>{P.local=e.target.value});
  el.querySelectorAll("img[data-ai]").forEach(im=>{im.src=edUrlF(P.fotos[+im.dataset.ai])});
  el.querySelectorAll("canvas[data-cfpc]").forEach(c=>{try{edRenderFoto(P.fotos[+c.dataset.cfpc],c,P.ar)}catch(e){}})}
function cfpDet(el){
  /* 123: sem poder publicar para seguidores, volta para amigos */
  const P=ED&&ED.po;if(P&&P.pub==="seguidores"&&!cs123PodeSeg())P.pub="amigos";
  /* 102: com um tipo escolhido, o formulário do cn102Det; se ele der erro, o passo comum */
  let r,feito=false;{const P2=ED&&ED.po;if(P2&&P2.cn&&P2.cn.k){try{r=cn102Det(el);feito=true}catch(e){console.error(e)}}}
  if(!feito)r=cfp206Det0.apply(this,arguments);
  /* 113: fio */
  if(VN_FASE2)try{f113EdPoe(el)}catch(e){console.error(e)}
  /* 123: textos do público "seguidores" */
  try{if(P&&P.pub==="seguidores"){const em=el.querySelector("[data-cfppub] em");if(em)em.textContent="Seguidores e amigos";const q=el.querySelector(".cr-quem");if(q&&q.firstChild&&q.firstChild.nodeType===3)q.firstChild.textContent="Quem segue você e seus amigos vão ver. "}}catch(e){}return r}

/* ===== cn102Valida: o que falta para publicar (texto do aviso, ou "" se está tudo certo) =====
   Base no 102; remendos (de dentro para fora): 122 (título do relato), 155 (opções da enquete), 166 (opções repetidas). */
function cn206Valida0(P){const cn=P.cn;cn102Sync();
  if(cn.k==="nt"&&!P.pid)return "Escolha a notícia que você quer comentar.";
  if(cn.k==="rel"&&!String(cn.tit).trim())return "Dê um título curto ao relato.";
  if(cn.k==="ana"&&!String(cn.tit).trim()&&!String(cn.corpo).trim())return "Escreva a sua análise.";
  if(cn.k==="enq"){if(!String(cn.tit).trim())return "Escreva a pergunta.";{const f=cn.o.map(v=>String(v||"").trim()).filter(Boolean);if(!f.length)cn.o=["Sim","Não"];/* opções em branco: vale o Sim/Não que aparece nos campos */else if(f.length<2)return "A pergunta precisa de pelo menos duas opções."}}
  return ""}
function cn102Valida(P){
  /* 155: enquete com pergunta e menos de duas opções escritas: leva ao campo vazio */
  let r;const cn=P&&P.cn;
  if(cn&&cn.k==="enq"&&String(cn.tit||"").trim()&&(cn.o||[]).map(v=>String(v||"").trim()).filter(Boolean).length<2){const f=(cn.o||[]).map(v=>String(v||"").trim()).filter(Boolean);
    setTimeout(()=>{try{const i=[...document.querySelectorAll("#layer [data-cn102o]")].find(x=>!x.value.trim());if(i)i.focus()}catch(_){}},60);r=f.length?"A enquete precisa de pelo menos duas opções.":"Escreva as opções da enquete (por exemplo, Sim e Não)."}
  else{r=cn206Valida0.apply(this,arguments);
    /* 122: o relato não se chama mais "relato" */
    r=r==="Dê um título curto ao relato."?"Dê um título curto ao que você viu.":r}
  /* 166: opções iguais */
  try{const cn=P&&P.cn;if(!r&&cn&&cn.k==="enq"&&cr166Dups(cn).length)return "Duas opções estão iguais. Troque uma delas."}catch(e){}return r}

/* ===== cp152Desenha: a caixa de criar =====
   Base no 152; remendos: 155 (cartão da notícia mais claro), 164 (miniaturas das fotos). */
function cp206Desenha0(){const el=$("#layer > .cp152");if(!el)return;el.innerHTML=cp152HTML();if(CP152.aba==="post"){const t=$("#cp152-tx");if(t){t.addEventListener("input",()=>{CP152.txt=t.value;cp152Ok()});cp152Ok()}const s=$("#cp152-pub");if(s)s.addEventListener("change",()=>{CP152.pub=s.value});cp152RascPosts()}}
function cp152Desenha(){const r=cp206Desenha0.apply(this,arguments);
  try{cr155Clareia($("#layer > .cp152 .cr155-nt"))}catch(e){}
  try{if(fc164Tem())document.querySelectorAll("#layer > .cp152 img[data-fc164i]").forEach(im=>{im.src=fc164Url(CP152.ed.po.fotos[+im.dataset.fc164i])})}catch(e){}
  return r}

/* ===== a caixa de criar (152), com a notícia (155), as fotos (164), o aviso de erro (166), o só seguir (181) e os
   formatos escondidos (182) ===== */
/* cp152Abre: base no 152; 164 (abrir do zero começa sem fotos) e 155 (o que estava guardado volta) */
function cp206Abre0(o){o=o||{};if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}
  const L=$("#layer");if(L.innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}if(typeof ED!=="undefined")ED=null;
  if(o.aba)CP152.aba=o.aba;if(!o.manter&&!o.aba)CP152.aba="post";if(!o.manter)CP152.txt="";
  L.innerHTML=`<div class="cp152" role="dialog" aria-modal="true" aria-label="Publicar"></div>`;if(pushH())HST++;cp152Desenha();uso("criar_caixa");
  if(CP152.aba==="post")setTimeout(()=>{const t=$("#cp152-tx");if(t&&!o.semFoco)try{t.focus({preventScroll:true});t.setSelectionRange(t.value.length,t.value.length)}catch(e){}},120);
  /* rascunhos de coluna guardados na conta (outro aparelho) */
  try{Promise.resolve(ed132Testa()).then(()=>ed132Sinc()).then(ok=>{if(ok&&CP152.aba==="coluna"&&$("#layer > .cp152"))cp152Desenha()}).catch(()=>{})}catch(e){}}
function cp152Abre(o){if(!(o&&o.manter))CP152.ed=null;
  o=o||{};const r=cp206Abre0.apply(this,arguments);try{if(!$("#layer > .cp152"))return r;
    if(!o.manter){const g=cr155Le();CR155.pid=null;if(g){if(!o.aba||o.aba==="post")CP152.txt=g.tx;CR155.pid=g.pid&&pautaById(g.pid)?g.pid:null}
      if(o.pid&&pautaById(o.pid))CR155.pid=o.pid;if(CR155.pid||CP152.txt)cp152Desenha()}
    CR155.giro=0;CR155.volta=0}catch(e){}return r}
/* cp152Fecha: base no 152; 164 (com fotos e sem texto pede "Descartar?"; fechou: sem fotos), 155 (fechou: limpa o guardado) */
function cp206Fecha0(){if(CP152.txt.trim()){const b=$("#layer [data-cp152x]");if(b&&!b.classList.contains("conf")){b.classList.add("conf");b.textContent="Descartar?";setTimeout(()=>{if(b.isConnected){b.classList.remove("conf");b.innerHTML=EDI.x}},2600);return}}
  CP152.txt="";closeLayer()}
function cp152Fecha(){if(fc164Tem()&&!CP152.txt.trim()){const b=$("#layer [data-cp152x]");if(b&&!b.classList.contains("conf")){b.classList.add("conf");b.textContent="Descartar?";setTimeout(()=>{if(b.isConnected){b.classList.remove("conf");b.innerHTML=EDI.x}},2600);return}}
  const r=cp206Fecha0.apply(this,arguments);if(!$("#layer > .cp152"))cr155Limpa();
  if(!$("#layer > .cp152"))CP152.ed=null;return r}
/* cp152PostHTML: base no 152; 155 (cartão da notícia), 164 (miniaturas das fotos) */
function cp206PostHTML0(){const pubs=cp152Publicos();if(!pubs.some(p=>p[0]===CP152.pub))CP152.pub="amigos";
  return `<div class="cp152-post"><div class="cp152-quem">${avatar(S.uid)}<b>${esc(nomeDe(S.uid))}</b></div>
    <textarea id="cp152-tx" class="cp152-tx" maxlength="2200" rows="5" placeholder="Escreva o que você acha…" aria-label="Seu post">${esc(CP152.txt)}</textarea>
    <p class="cp152-h">Juntar ao post</p>
    <div class="cp152-ax" role="group" aria-label="Juntar ao post">${CP152_ANEXOS.map(([k,n])=>`<button type="button" class="cp152-a cp152-a-${k}" data-cp152ax="${k}">${CN102_SVG(CP152_IC[k])}<span>${n}</span></button>`).join("")}</div>
    <label class="cp152-pub"><span>Público</span><select id="cp152-pub" aria-label="Quem vê">${pubs.map(([k,n])=>`<option value="${k}"${k===CP152.pub?" selected":""}>${esc(n)}</option>`).join("")}</select><i aria-hidden="true">›</i></label>
    <div id="cp152-rascs"></div>
    <p class="cp152-dica">Notícia comenta uma notícia da edição; Enquete pergunta aos amigos; Número junta um indicador ou gráfico; De perto conta o que você viu, com local e hora. Use @ para marcar alguém.</p></div>`}
function cp152PostHTML(){let h=cp206PostHTML0.apply(this,arguments);
  try{const nt=cr155NtHTML();if(nt){const i=h.indexOf("</textarea>");if(i>=0)h=h.slice(0,i+11)+nt+h.slice(i+11);h=h.replace('placeholder="Escreva o que você acha…"','placeholder="O que você acha dessa notícia?"')}}catch(e){}
  try{const f=fc164HTML();if(f){const i=h.indexOf("</textarea>");if(i>=0)h=h.slice(0,i+11)+f+h.slice(i+11);
    h=h.replace(/class="cp152-a cp152-a-(enq|ana|rel)"/g,'class="cp152-a cp152-a-$1 fc164-off" aria-disabled="true"');
    h=h.replace('placeholder="Escreva o que você acha…"','placeholder="Escreva uma legenda…"')}}catch(e){}return h}
/* cp152Ok: base no 152; 155 e 164 (com notícia ou foto, Publicar liga sem texto) */
function cp206Ok0(){const b=$("#layer [data-cp152pub]");if(b)b.disabled=!CP152.txt.trim()}
function cp152Ok(){const r=cp206Ok0.apply(this,arguments);
  try{const b=$("#layer [data-cp152pub]");if(b&&CR155.pid)b.disabled=false}catch(e){}
  try{const b=$("#layer [data-cp152pub]");if(b&&fc164Tem())b.disabled=false}catch(e){}return r}
/* cp152Anexo: base no 152; 155 (cr155Anexo: Notícia e Enquete levam a notícia já escolhida), 164 (fotos na caixa) */
function cp206Anexo0(k){const tx=CP152.txt,pub=CP152.pub;CP152.veio=true;
  if(k==="foto"){const E=cp152Editor();if(!E)return;const P=E.po;P.texto=tx;P.pub=pub;
    /* abre a galeria no mesmo toque (o iPhone só deixa abrir dentro do toque); se a pessoa desistir, volta para a caixa */
    const f=$("#ce-pfile");if(f){f.addEventListener("cancel",()=>{if(ED===E&&!E.po.fotos.length&&!(E.po.rolo&&E.po.rolo.length)){CP152.txt=tx;ED=null;cp152Abre({manter:true,aba:"post",semFoco:true})}},{once:true});try{f.click()}catch(e){}}
    return}
  cn102Comeca(k,k==="rel"?{}:{});const E=typeof ED!=="undefined"&&ED;if(!E||!E.po||!E.po.cn)return;const cn=E.po.cn;E.po.pub=pub;
  if(tx){if(k==="enq"&&tx.length<=120&&!/\n/.test(tx))cn.tit=tx;else cn.corpo=tx}
  try{edDesenha()}catch(e){}
  if(k==="nt"&&!E.po.pid)setTimeout(()=>{try{if(!$("#layer .cn102-ntl"))cn102ListaNt("data-edpnt")}catch(e){}},0);
  if(k==="ana")setTimeout(()=>{try{const b=$("#layer [data-cn102dado]");if(b)b.click()}catch(e){}},120)}
function cr155Anexo(k){const pid=CR155.pid&&pautaById(CR155.pid)?CR155.pid:null;
  if(k==="nt"&&pid){const tx=CP152.txt,pub=CP152.pub;CP152.veio=true;cn102Comeca("nt",{pid});const E=typeof ED!=="undefined"&&ED;if(!E||!E.po||!E.po.cn)return;E.po.pub=pub;E.po.cn.corpo=tx;E.cr155pid=pid;try{edDesenha()}catch(e){}return}
  const r=cp206Anexo0.apply(this,arguments);try{const E=typeof ED!=="undefined"&&ED;if(E&&E.po&&E.po.cn&&pid&&k==="enq"){E.po.pid=pid;E.cr155pid=pid;edDesenha()}}catch(e){}return r}
function cp206Anexo155(k){CR155.anexo=1;try{return cr155Anexo.apply(this,arguments)}finally{CR155.anexo=0}}
function cp152Anexo(k){
  if(k!=="foto"){if(fc164Tem()){if(k==="nt"){fc164ListaNt();return}fc164Nota(k);return}
    return cp206Anexo155.apply(this,arguments)}
  /* mais fotos: junta (não troca) e volta para a caixa; desistir também volta */
  if(fc164Tem()){fc164Edita(undefined,"fotos");const E=ED;if(E){E.po.multi=true;E.fc164novo=true}
    try{const f=$("#ce-pfile");if(f&&E&&E.po.fotos.length<10){f.addEventListener("cancel",()=>{if(ED===E&&E.fc164novo)fc164Volta()},{once:true});f.click()}}catch(e){}return}
  const r=cp206Anexo155.apply(this,arguments);try{if(typeof ED!=="undefined"&&ED&&ED.modo==="post"){ED.fc164=true;ED.fc164novo=true}}catch(e){}return r}
/* cp152TextoDe: base no 152; 164 (fotos escolhidas voltam para a caixa), 155 (a notícia e o texto ficam guardados) */
function cp206TextoDe0(E){try{const P=E&&E.po;if(!P)return CP152.txt;const cn=P.cn;if(!cn)return String(P.texto||"");return [cn.tit,cn.corpo].map(s=>String(s||"").trim()).filter(Boolean).join("\n\n")}catch(e){return CP152.txt}}
function cp152TextoDe(E){try{if(E&&E.fc164&&E.po&&E.po.fotos&&E.po.fotos.length){E.po.passo="fotos";CP152.ed=E}}catch(e){}
  const r=cp206TextoDe0.apply(this,arguments);try{const P=E&&E.po;if(P){const k=P.cn&&P.cn.k;
    if(P.pid)CR155.pid=P.pid;else if(!P.cn&&E.cr155pid)CR155.pid=E.cr155pid;else if(k==="nt"||k==="enq")CR155.pid=null;CP152.txt=r;cr155Guarda()}}catch(e){}return r}
/* cp152Publica: a do 152 era trocada inteira pela do 155 (com a notícia, sai como notícia comentada); 164 (com fotos);
   166 (marca a hora do toque em Publicar) */
async function cp206Publica155(){const tx=CP152.txt.trim(),pid=CR155.pid&&pautaById(CR155.pid)?CR155.pid:null;if(!tx&&!pid){toast("Escreva algo para publicar.");return}const pub=CP152.pub;
  const E=cp152Editor();if(!E){toast("Não deu para abrir agora. Tente de novo.");return}const P=E.po;P.texto=tx;P.pub=pub;P.passo="detalhes";
  if(pid){P.pid=pid;P.cn=cn102Novo("nt");P.cn.corpo=tx}try{edDesenha()}catch(e){}
  CP152.direto=true;try{await edPublicaPost()}catch(e){}
  /* foi para a fila (o editor fechou): a caixa começa vazia da próxima vez; se não saiu, o texto fica no editor */
  if(!$("#layer .ce"))cr155Limpa();else{CP152.txt=tx;cr155Guarda()}};
async function cp206Publica164(){if(!fc164Tem())return cp206Publica155.apply(this,arguments);
  const E=CP152.ed,P=E.po,tx=CP152.txt.trim();let pid=null;try{pid=CR155.pid&&pautaById(CR155.pid)?CR155.pid:null}catch(e){}
  if($("#layer").innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}
  ED=E;E.fc164=false;P.texto=tx;P.pub=CP152.pub;if(pid)P.pid=pid;P.passo="detalhes";
  $("#layer").innerHTML=`<div class="ce" role="dialog" aria-modal="true" aria-label="Criar"></div>`;if(pushH())HST++;try{edDesenha()}catch(e){}
  CP152.ed=null;CP152.txt="";CP152.direto=true;try{await edPublicaPost()}catch(e){}
  if(!$("#layer .ce")){try{cr155Limpa()}catch(e){}}}
function cp152Publica(){CR166.pubT=Date.now();return cp206Publica164.apply(this,arguments)}
/* cp152HTML: base no 152; 182 (sem a aba Giro quando escondida; dica dos formatos) */
function cp206HTML0(){const a=CP152.aba;
  return `<div class="cp152-hd"><button type="button" class="cp152-b" data-cp152x aria-label="Fechar">${EDI.x}</button><b>Nova publicação</b>${a==="post"?`<button type="button" class="cp152-ok" data-cp152pub>Publicar</button>`:`<span class="cp152-b" aria-hidden="true"></span>`}</div>
    <div class="cp152-abas" role="tablist" aria-label="O que publicar">${[["post","Post"],["giro","Giro"],["coluna","Coluna"]].map(([k,n])=>`<button type="button" role="tab" data-cp152aba="${k}" aria-selected="${a===k}">${n}</button>`).join("")}</div>
    <div class="cp152-sc">${a==="coluna"?cp152ColHTML():cp152PostHTML()}</div>`}
function cp152HTML(){let h=cp206HTML0.apply(this,arguments);try{
    if(ft182Esc("giro"))h=h.replace(/<button type="button" role="tab" data-cp152aba="giro"[^>]*>[^<]*<\/button>/,"");
    if(CP152_ANEXOS.length<5)h=h.replace(/(<p class="cp152-dica">)Notícia comenta[^<]*(<\/p>)/,"$1"+ft182Dica()+"$2")}catch(e){}return h}
/* cp152Publicos: base no 152; 181 (só seguir: só "Todos") */
function cp206Publicos0(){const l=[["amigos","Todos os amigos"]];try{if(MA.on)l.push(["proximos","★ Melhores amigos"])}catch(e){}try{if(typeof cs123PodeSeg==="function"&&cs123PodeSeg())l.push(["seguidores","Seguidores e amigos"])}catch(e){}return l}
function cp152Publicos(){const l=cp206Publicos0.apply(this,arguments);return sg181On()?[["amigos","Todos"]]:l}

/* ===== a fila de publicar (093) ===== */
/* pqDesenha: base no 093; 155 (sem conexão: o aviso e o começo do texto), 166 (sem conexão: "Publicar agora") */
function pq206Desenha0(){const box=pqBox();if(!box){return}const vis=PQ.jobs.filter(j=>j.tipo!=="story"||j.estado==="erro");
  const ant=new Set([...box.children].map(x=>x.dataset.pq));
  box.innerHTML=vis.map(j=>{const er=j.estado==="erro",ok=j.estado==="ok",nm=j.tipo==="reel"?"reel":j.tipo==="story"?"story":"post";
    return `<div class="pq-row${er?" erro":""}${ok?" ok":""}${ant.has(j.id)?"":" novo"}" data-pq="${j.id}"><span class="pq-th${j.th.aa?" aa":""}">${j.th.aa?"Aa":""}${j.tipo==="reel"?`<i class="pq-rl">▶</i>`:""}</span>
      <span class="pq-tx">${er?`<b>Não foi publicado</b><span class="pq-bs"><button type="button" class="pq-b on" data-pqtenta="${j.id}">Tentar de novo</button><button type="button" class="pq-b" data-pqdesc="${j.id}">Descartar</button></span>`
        :`<b>${ok?"Publicado":"Publicando…"}</b><small>${ok?"Já está no Feed":"Seu "+nm+" vai aparecer aqui"}</small>`}</span>${ok?`<i class="pq-ok" aria-hidden="true">✓</i>`:""}${er?"":`<i class="pq-bar" aria-hidden="true"><i style="width:${(pqProg(j)*100).toFixed(1)}%"></i></i>`}</div>`}).join("");
  box.querySelectorAll(".pq-th").forEach((el,i)=>{const t=vis[i].th;if(t.bg)el.style.background=t.bg;if(t.img)el.style.backgroundImage=`url("${String(t.img).replace(/"/g,"%22")}")`});
  box.hidden=!vis.length;pqAtualiza()}
function pqDesenha(){const r=pq206Desenha0.apply(this,arguments);
  try{const box=$("#pq");if(box)
    PQ.jobs.forEach(j=>{if(j.estado!=="erro")return;const row=box.querySelector(`[data-pq="${j.id}"]`);if(!row)return;const tx=row.querySelector(".pq-tx>b");
      if(tx)tx.textContent=cr155SemRede(j)?"Sem conexão: vamos publicar quando a internet voltar":"Não foi publicado";
      const ini=j.tipo==="post"&&j.ed&&j.ed.po?String(j.ed.po.texto||"").replace(/\s+/g," ").trim():"";
      if(ini&&!row.querySelector(".cr155-ini")&&tx)tx.insertAdjacentHTML("afterend",`<small class="cr155-ini">“${esc(cp152Corta(ini,60))}”</small>`)})}catch(e){}
  try{const box=$("#pq");if(box)PQ.jobs.forEach(j=>{if(j.estado!=="erro"||!cr155SemRede(j))return;const b=box.querySelector(`[data-pqtenta="${j.id}"]`);if(!b)return;
    if(navigator.onLine===false)b.remove();else b.textContent="Publicar agora"})}catch(e){}return r}
/* pqFim: base no 093; 155 (deu certo e há outro com erro: tenta de novo) */
function pq206Fim0(j,err){if(PQ.atual===j)PQ.atual=null;const ed=j.ed;
  if(ED===ed){/* não terminou: guarda para tentar de novo */ed.env=false;ED=null;j.estado="erro";j.err=err||null;
    if(j.tipo==="story"){const resto=(ed.sts||[]).filter(edStTem);if(!resto.length){j.estado="ok"}else{j.U=pqUnidades("story",ed);j.th=pqThumb("story",ed)}}
    if(j.estado==="erro"&&j.tipo==="post"&&(ed.po.fotos.length||ed.po.texto.trim())&&typeof rascSalva==="function"){const s=ED;ED=ed;try{if(!ed.po.rid)ed.po.rid=edNid();rascSalva().catch(()=>{})}catch(e){}finally{ED=s}}}
  else j.estado="ok";
  if(j.estado==="ok"){j.disp=1;vibrar&&vibrar(8);setTimeout(()=>{PQ.jobs=PQ.jobs.filter(x=>x!==j);pqDesenha(true)},ANIM_OK()?900:300)}
  pqDesenha();try{renderSecs()}catch(e){}}
function pqFim(j){const r=pq206Fim0.apply(this,arguments);try{if(j&&j.estado==="ok"&&PQ.jobs.some(x=>x.estado==="erro")){clearTimeout(CR155.rt);CR155.rt=setTimeout(cr155Reenvia,800)}}catch(e){}return r}

/* ===== o formulário de notícia comentada (102) ===== */
/* cn102ListaNt: base no 102; 154 (busca na lista), 155 (cartões mais claros) */
function cn206ListaNt0(attr){const ce=$("#layer .ce");if(!ce)return;$("#layer .ce-sel")?.remove();$("#layer .ce-fig")?.remove();
  const ps=ordenadas(visiveis()).slice(0,60),ov=document.createElement("div");ov.className="ce-sel cn102-ntl";
  ov.innerHTML=`<div class="ce-selp" role="dialog" aria-label="Escolher notícia"><b>Notícia da edição</b><input class="field" id="ce-lq" type="search" placeholder="Buscar na edição" autocomplete="off" enterkeyhint="search">
    <ul class="ce-lis">${ps.map(p=>{const v=versao(p,lente());return `<li><button type="button" ${attr}="${esc(p.id)}" data-busca="${esc(norm(v.titulo+" "+(p.tag||"")+" "+secNome(secOf(p))))}">${capaArte(p,"cn102-th")}<span><small style="color:${secCor(secOf(p))}">${esc(secNome(secOf(p)))}${p.tag?" · "+esc(p.tag):""}</small><b>${esc(v.titulo)}</b></span></button></li>`}).join("")||`<li class="hint">A edição ainda não carregou.</li>`}</ul>
    <div class="ce-selb"><button type="button" class="btn ghost" data-edselx>Cancelar</button></div></div>`;
  ce.appendChild(ov);const q=ov.querySelector("#ce-lq");q.addEventListener("input",()=>{const n=norm(q.value).trim();ov.querySelectorAll("[data-busca]").forEach(b=>{b.parentElement.hidden=!!n&&!b.dataset.busca.includes(n)})})}
function cn102ListaNt(attr){const r=cn206ListaNt0.apply(this,arguments);
  try{const ov=$("#layer .cn102-ntl");if(ov){
    ov.querySelectorAll(".ce-lis [data-busca]").forEach((b,i)=>{const p=pautaById(b.getAttribute(attr)||"");const n=p&&p.neutro||{};if(b.parentElement)b.parentElement.dataset.bu154i=i;
      b.dataset.bu154h=bu154N([b.textContent,n.titulo,p&&p.subtitulo,p&&p.tag,p&&p.tema,p&&p.subtema,p&&bu154Hash(p),p&&secNome(secOf(p))].filter(Boolean).join(" "));
      if(p)b.dataset.bu154c=bu154N([n.texto,p.contexto].filter(Boolean).join(" ")).slice(0,6000)});
    const q=ov.querySelector("#ce-lq");if(q){q.addEventListener("input",()=>bu154NtFiltra(ov));if(q.value)bu154NtFiltra(ov)}}}catch(e){}
  try{cr155Clareia($("#layer .cn102-ntl"))}catch(e){}return r}
/* cn102Comeca: base no 102; 155 (aberto com a notícia fora da caixa: o texto guardado vai junto) */
function cn206Comeca0(k,o){o=o||{};if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}uso("criar_"+k);
  if($("#layer").innerHTML)closeLayer();CN102_SEMGAL=1;try{criarAbrir("post")}finally{CN102_SEMGAL=0}if(!ED||ED.modo!=="post")return;
  const P=ED.po;P.cn=cn102Novo(k);if(o.pid)P.pid=o.pid;P.passo="detalhes";edDesenha();
  if(k==="nt"&&!P.pid)cn102ListaNt("data-edpnt");
  else if(k==="rel"&&!o.semFoto)cn102EscolheFotos();
  else setTimeout(()=>{const i=$(k==="nt"?"#ce-leg":"#cn102-tit");if(i)try{i.focus({preventScroll:true})}catch(e){}},80)}
function cn102Comeca(k,o){const anexo=CR155.anexo;const r=cn206Comeca0.apply(this,arguments);try{const E=typeof ED!=="undefined"&&ED;
    if(!anexo&&E&&E.po&&E.po.cn&&k==="nt"&&o&&o.pid){CP152.veio=true;E.cr155pid=o.pid;const g=cr155Le();if(g&&g.tx.trim()&&!E.po.cn.corpo){E.po.cn.corpo=g.tx;try{cn102Sync();edDesenha()}catch(_){}}}}catch(e){}return r}
/* cn102IndDado: base no 102; 166 (o valor de hoje entra no fim da série) */
function cn206IndDado0(x){const s=Array.isArray(x.serie)?x.serie.map(Number).filter(isFinite):[],r=Array.isArray(x.rotulos)?x.rotulos:[];const idx=cn102Amostra(s.map((_,i)=>i),30);
  return {tipo:"ind",tit:String(x.nome||"").slice(0,60),un:"",ind:String(x.id).slice(0,30),val:String(x.valor).slice(0,24),var:String(x.variacao||"").slice(0,16),dir:["sobe","desce","estavel"].includes(x.dir)?x.dir:"",dt:/^\d{4}-\d{2}-\d{2}$/.test(x.data||"")?x.data:"",s:idx.map(i=>+(+s[i]).toPrecision(6)),r:idx.map(i=>String(r[i]||"").slice(0,10))}}
function cn102IndDado(x){const d=cn206IndDado0.apply(this,arguments);try{const ult=d.r[d.r.length-1]||"",v=cr166Num(d.val);
    if(d.dt&&/^\d{4}-\d{2}-\d{2}$/.test(ult)&&d.dt>ult&&isFinite(v)&&d.s.length>=2){d.s.push(+v.toPrecision(6));d.r.push(d.dt);if(d.s.length>30){d.s.shift();d.r.shift()}}}catch(e){}return d}

/* ===== o editor de post (095) ===== */
/* cfpFotos: base no 095; 102 (sem fotos: o início com os tipos de publicação) */
function cfp206Fotos0(el){const P=ED.po,f=P.fotos[P.cur],tem=!!(P.rolo.length&&f),arN=P.ar==="orig"?"Original":P.ar;
  el.innerHTML=`<div class="ce-ph"><button type="button" class="ce-b" data-edfechar aria-label="Fechar">${EDI.x}</button><b>Novo post</b><button type="button" class="ce-av" data-edav ${P.fotos.length?"":"disabled"}>Avançar</button></div>
    <div class="cfp-box" id="cfp-box">${tem?`<div class="ce-pv" id="ce-pv"><img id="ce-pvi" alt="" draggable="false"></div>
        <button type="button" class="cfp-ar" data-edar aria-label="Formato ${esc(arN)}. Toque para trocar">${EDI.ar}<span>${esc(arN)}</span></button>
        <button type="button" class="cfp-mlt${P.multi?" on":""}" data-edmulti aria-pressed="${!!P.multi}" aria-label="Selecionar várias fotos">${EDI.mlt}</button>${P.fotos.length>1?`<span class="ce-npg">${P.cur+1}/${P.fotos.length}</span>`:""}`
      :`<button type="button" class="cfp-vazio ce-big" data-edpgal>${EDI.gal}<b>Escolher fotos</b><span>Até 10 fotos da galeria</span></button>`}</div>
    ${tem?`<div class="cfp-gh"><b>Galeria</b><span>${P.multi?`${P.fotos.length} de 10`:""}</span></div>
      <div class="ce-grade cfp-grade"><button type="button" class="ce-gi ce-gim" data-edpgal aria-label="Mais fotos da galeria">${EDI.mais}</button>${P.rolo.map((x,i)=>{const n=P.fotos.indexOf(x);return `<button type="button" class="ce-gi${x===f?" on":""}${n>=0?" sel":""}" data-edrolo="${i}" aria-label="Foto ${i+1}${n>=0?", escolhida":""}"><img alt="" data-ri="${i}">${P.multi?`<i class="ce-num${n>=0?" on":""}">${n>=0?n+1:""}</i>`:""}</button>`}).join("")}</div>`
      :`<div class="cfp-opc"><span>Ou comece com</span><div class="ce-vz2"><button type="button" data-edsotexto>Só texto</button><button type="button" data-edsont>Notícia do Prumo</button></div><div id="ce-rascs"></div></div>`}
    ${edModos()}<input type="file" id="ce-pfile" accept="image/*" multiple hidden>`;
  const box=$("#cfp-box");if(!tem)box.style.height=Math.round(Math.min(innerHeight*.6,box.clientWidth||innerWidth))+"px";
  if(tem){$("#ce-pvi").src=edUrlF(f);edPvTam();edPvPos();edGestosPv()}el.querySelectorAll(".ce-grade img[data-ri]").forEach(im=>{im.src=edUrlF(P.rolo[+im.dataset.ri])});
  if(!tem)rascChip();
  $("#ce-pfile").addEventListener("change",async e=>{const fs=[...e.target.files];e.target.value="";if(!fs.length)return;const novos=[];for(const x of fs.slice(0,30)){try{novos.push(edNovaFoto(await edCarrega(x,2048)))}catch(err){toast("Não deu para abrir uma das fotos.")}}if(!novos.length||!ED)return;
    P.rolo.push(...novos);if(novos.length>1)P.multi=true;if(P.multi){const cabe=novos.slice(0,10-P.fotos.length);if(cabe.length<novos.length)toast("Um post tem no máximo 10 fotos.");P.fotos.push(...cabe);P.cur=Math.max(0,P.fotos.length-cabe.length)}else{P.fotos=[novos[0]];P.cur=0}edDesenha()})}
function cfpFotos(el){const r=cfp206Fotos0.apply(this,arguments);try{const P=ED.po;if(!(P.rolo&&P.rolo.length&&P.fotos[P.cur])){const o=el.querySelector(".cfp-opc");if(o){o.outerHTML=cn102InicioHTML();if(typeof rascChip==="function")rascChip()}
    const box=$("#cfp-box");if(box){box.style.height="";box.classList.add("cn102-box")}const v=el.querySelector(".cfp-vazio");if(v){const s=v.querySelector("span");if(s)s.textContent="Fotos da galeria, até 10"}}}catch(e){}return r}
/* cfpPublico: base no 095; 123 (opção "Seguidores e amigos") */
function cfp206Publico0(){const P=ED.po;const ov=document.createElement("div");ov.className="ce-sel";
  ov.innerHTML=`<div class="ce-selp"><b>Quem pode ver</b><div class="cfp-pubs"><button type="button" data-cfppubv="amigos" aria-pressed="${P.pub!=="proximos"}"><span>Todos os amigos</span><small>Seus amigos no Prumo</small></button><button type="button" data-cfppubv="proximos" aria-pressed="${P.pub==="proximos"}"><span>★ Melhores amigos</span><small>${MA.set.size?`${MA.set.size} ${MA.set.size===1?"pessoa":"pessoas"}`:"Lista vazia"}</small></button></div><div class="ce-selb"><button type="button" class="btn ghost" data-cfpmaed>Editar a lista</button><button type="button" class="btn" data-edselx>Concluir</button></div></div>`;$("#layer .ce").appendChild(ov)}
function cfpPublico(){const r=cfp206Publico0.apply(this,arguments);try{if(!cs123PodeSeg()||!ED||!ED.po)return r;const P=ED.po,box=$("#layer .ce-sel .cfp-pubs");if(!box||box.querySelector('[data-cfppubv="seguidores"]'))return r;
  const am=box.querySelector('[data-cfppubv="amigos"]');if(am)am.insertAdjacentHTML("afterend",`<button type="button" data-cfppubv="seguidores" aria-pressed="false"><span>Seguidores e amigos</span><small>Quem segue você e seus amigos</small></button>`);
  box.querySelectorAll("[data-cfppubv]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.cfppubv===(P.pub==="proximos"||P.pub==="seguidores"?P.pub:"amigos"))))}catch(e){}return r}

/* ===== rascunhos do post (076) ===== */
/* rascSalva: base no 076; 102 (o formulário de notícia comentada fica guardado ao lado) */
async function rasc206Salva0(){const P=ED.po;const r={id:P.rid||edNid(),uid:S.uid,at:Date.now(),ar:P.ar,texto:P.texto,local:P.local,pid:P.pid,marcados:P.marcados,tags:(P.tags||[]).map(t=>({u:t.u,i:P.fotos.indexOf(edTagF(t)),x:t.x,y:t.y})).filter(t=>t.i>=0),semCom:!!P.semCom,semCurt:!!P.semCurt,
  fotos:P.fotos.map(f=>({blob:f.blob,z:f.z,ox:f.ox,oy:f.oy,f:f.f,fi:f.fi,aj:f.aj,rot:f.rot||0,str:f.str||0,alt:f.alt||""}))};await rascTx("readwrite",s=>s.put(r));const l=await rascLista();for(const x of l.slice(20))await rascTx("readwrite",s=>s.delete(x.id))}
async function rascSalva(){const P=ED&&ED.po;if(P&&P.cn){if(!P.rid)P.rid=edNid();const m=cn102RLe();m[P.rid]={...P.cn,d:P.cn.d||null};try{const ks=Object.keys(m);if(ks.length>30)ks.slice(0,ks.length-30).forEach(k=>delete m[k]);localStorage.setItem(CN102_RK,JSON.stringify(m))}catch(e){}}return rasc206Salva0.apply(this,arguments)}
/* rascAbre: base no 076; 102 (volta o formulário guardado) */
async function rasc206Abre0(id){const r=(await rascLista()).find(x=>x.id===id);if(!r||!ED)return;const fotos=[];for(const x of r.fotos){const {img,url}=await edImg(x.blob);const f={...edNovaFoto({blob:x.blob,img,url}),...x,blob:x.blob,img,url};edGiraAplica(f);fotos.push(f)}
  Object.assign(ED.po,{rid:r.id,ar:r.ar,texto:r.texto||"",local:r.local||"",pid:r.pid||null,marcados:r.marcados||[],tags:(r.tags||[]).map(t=>({...t,f:fotos[t.i]})).filter(t=>t.f),semCom:r.semCom,semCurt:r.semCurt,fotos,rolo:fotos.slice(),cur:0,multi:fotos.length>1,passo:fotos.length?"fotos":"detalhes"});$("#layer .ce-sel")?.remove();edDesenha()}
async function rascAbre(id){const r=await rasc206Abre0.apply(this,arguments);try{const c=cn102RLe()[id];if(c&&ED&&ED.po&&c.k){ED.po.cn={...cn102Novo(c.k),...c};ED.po.passo="detalhes";edDesenha()}}catch(e){}return r}
/* rascLista: base no 076; 095 (quantos rascunhos há) */
async function rasc206Lista0(){try{const l=await rascTx("readonly",s=>s.getAll());return (l||[]).filter(x=>x.uid===S.uid).sort((a,b)=>b.at-a.at)}catch(e){return []}}
async function rascLista(){const l=await rasc206Lista0.apply(this,arguments);CFP_RASC=(l||[]).length;return l}

/* ===== as fotos do post (071 → 076 → 095) =====
   As versões do 071 eram trocadas inteiras pelas do 076 antes de qualquer uso. */
/* edAR, edRenderFoto, edMiniFiltros: as do 076 */
function edAR(ar,img){if(ar==="1:1")return 1;if(ar==="orig"&&img){const [w,h]=edWH(img);return Math.max(.8,Math.min(1.91,w/h))}return .8}
function edRenderFoto(f,c,ar,filtro){const first=(ED&&ED.po.fotos[0])||f,k=edAR(ar,edBase(first)),W=c.width,H=Math.round(W/k);c.height=H;const g=c.getContext("2d");g.fillStyle="#000";g.fillRect(0,0,W,H);
  const rad=(f.str||0)*Math.PI/180;g.save();if(rad){g.translate(W/2,H/2);g.rotate(rad);const sc=Math.abs(Math.cos(rad))+Math.abs(Math.sin(rad))*Math.max(W/H,H/W);g.scale(sc,sc);g.translate(-W/2,-H/2)}
  edCover(g,edBase(f),W,H,f.z,f.ox,f.oy);g.restore();if(filtro!==false)edAplica(c,f);return c}
function edMiniFiltros(){const P=ED.po,f=P.fotos[P.cur];const b=document.createElement("canvas");b.width=72;b.height=72;edCover(b.getContext("2d"),edBase(f),72,72,f.z,f.ox,f.oy);
  document.querySelectorAll("#layer [data-fk]").forEach(c=>{c.getContext("2d").drawImage(b,0,0);edFiltra(c,c.dataset.fk,{})})}
/* edPvTam: a do 095 (a do 076 era trocada inteira) */
function edPvTam(){const pv=$("#ce-pv"),P=ED&&ED.po;if(!pv||!P||!P.fotos.length)return;const box=pv.parentElement,k=edAR(P.ar,edBase(P.fotos[0])),W=box.clientWidth||innerWidth;
  const bh=Math.round(Math.min(innerHeight*.6,W*Math.max(1,1/k)));if(box.classList.contains("cfp-box"))box.style.height=bh+"px";let w=W,h=w/k;if(h>bh){h=bh;w=h*k}
  pv.style.cssText=`width:${Math.round(w)}px;height:${Math.round(h)}px;max-height:none`;P.fotos.forEach(f=>edLimita(f,pv))}
/* edLimita: base no 076; 095 (foto inteira, sem cortar: limites do "conter") */
function ed206Limita0(f,box){const r=box.getBoundingClientRect(),W=r.width||1,H=r.height||1,[iw,ih]=edWH(edBase(f)),k=Math.max(W/iw,H/ih)*(f.z||1);const lx=Math.max(0,(iw*k-W)/2/W),ly=Math.max(0,(ih*k-H)/2/H);f.ox=Math.max(-lx,Math.min(lx,f.ox||0));f.oy=Math.max(-ly,Math.min(ly,f.oy||0))}
function edLimita(f,box){if(!f||!f.cont)return ed206Limita0.apply(this,arguments);const r=box.getBoundingClientRect(),W=r.width||1,H=r.height||1,[iw,ih]=edWH(edBase(f)),k=Math.min(W/iw,H/ih)*(f.z||1);
  const lx=Math.abs(iw*k-W)/2/W,ly=Math.abs(ih*k-H)/2/H;f.ox=Math.max(-lx,Math.min(lx,f.ox||0));f.oy=Math.max(-ly,Math.min(ly,f.oy||0))}
/* edPosImg: base no 076; 095 (foto inteira), 100 (fundo do giro com foto inteira) */
function ed206PosImg0(i,f,box){const im=edBase(f);if(!box||!im)return;const W=box.clientWidth,H=box.clientHeight,[iw,ih]=edWH(im),k=Math.max(W/iw,H/ih)*(f.z||1),w=iw*k,h=ih*k;
  i.style.cssText=`position:absolute;inset:auto;max-width:none;object-fit:fill;transform:none;width:${w}px;height:${h}px;left:${(W-w)/2+(f.ox||0)*W}px;top:${(H-h)/2+(f.oy||0)*H}px`}
function edPosImg(i,f,box){let r;
  if(!f||!f.cont)r=ed206PosImg0.apply(this,arguments);
  else{const im=edBase(f);if(box&&im){const W=box.clientWidth,H=box.clientHeight,[iw,ih]=edWH(im),k=Math.min(W/iw,H/ih)*(f.z||1),w=iw*k,h=ih*k;
    i.style.cssText=`position:absolute;inset:auto;max-width:none;object-fit:fill;transform:none;width:${w}px;height:${h}px;left:${(W-w)/2+(f.ox||0)*W}px;top:${(H-h)/2+(f.oy||0)*H}px`}}
  try{if(i&&i.id==="ce-bgi"&&f&&f.cont&&ED&&f===ED.st.bg)ca100FundoEd()}catch(e){}return r}
/* edPrevFiltro: base no 076; 095 (no editor novo, atualiza a foto da trilha) */
function ed206PrevFiltro0(){clearTimeout(ED_FT);ED_FT=setTimeout(()=>{const c=$("#ce-fc"),P=ED&&ED.po;if(!c||!P||!P.fotos[P.cur])return;c.width=Math.min(720,Math.round((c.parentElement.clientWidth||360)*Math.min(2,devicePixelRatio||1)));edRenderFoto(P.fotos[P.cur],c,P.ar)},30)}
function edPrevFiltro(){if(!document.getElementById("cfp-trk"))return ed206PrevFiltro0.apply(this,arguments);cancelAnimationFrame(CFP_RAF);CFP_RAF=requestAnimationFrame(()=>{const P=ED&&ED.po;if(P)cfpAtualiza(P.cur)})}
