/* ---------- 201: núcleo (Fase 3) — as funções que todas as áreas usam, cada uma num lugar só ----------
   Antes, cada uma era definida num arquivo antigo e remendada em vários outros ({const _x=f;f=function(){… _x() …}}).
   Aqui está a versão final de cada uma, com o que a cadeia inteira fazia hoje (nada muda para quem usa). Os comentários
   [NNN] dizem de que arquivo veio cada pedaço; a ordem dos pedaços é a ordem em que rodavam.
   Carregamento: este arquivo vem no fim (antes do 999), quando todas as variáveis já existem. As declarações function são
   içadas, então quem chama estas funções antes daqui já encontra a versão final; quem chama DURANTE o carregamento
   (o 031 abre a Capa com go("capa",true)) usa só a parte que existia naquele ponto, como antes: NUC_PRONTO só vira true
   no 999 (nucPronto()).
   Dentro: closeLayer (+clMiolo), go (+goTroca, goMostra), sheet, toast, pubPostHTML (+ppMeio, ppCartao, ppBase), atItens
   (+atItensBase), atAcao (+atAcaoBase), atThumb (+atThumb086, atThumbBase), atDot, updateBadge, rerenderAll, renderMe
   (+renderMeMiolo). Regra daqui para a frente: corrigir DENTRO destas funções, não embrulhá-las de novo em outro arquivo. */
var NUC_PRONTO;  /* sem valor (falso) até o 999 */
function nucPronto(){NUC_PRONTO=true}

/* ===== closeLayer: fecha a janela de cima (#layer2, senão #layer) =====
   Antes: definida no 007 e remendada em 031, 033, 034, 041, 047, 056, 057, 058, 059, 060 (2×), 068, 070, 071, 074, 078,
   080, 083, 084, 093, 094, 100, 104-feed, 104-stories, 106-pendências (2×), 106-produção, 108, 111, 113, 123, 125, 132,
   137, 152, 155, 167, 168 e 189 (38 remendos).
   Camadas de fora para dentro: 189 → 168 → 167 → 155 (aqui em closeLayer) → 152 … 031 → 007 (em clMiolo). O 155 pode
   chamar o miolo duas vezes (se o miolo der erro dentro do try dele, chamava de novo): por isso o miolo é uma função. */
function closeLayer(fromPop){
  /* [189] voltar do celular no "Detalhes" de um post que veio da caixa: volta para a caixa com o texto */
  try{
    if(fromPop===true&&typeof ED!=="undefined"&&ED&&ED.po&&(ED.po.cn||ED.po.passo==="detalhes")&&!ED.env&&CP152.veio&&$("#layer > .ce")&&!($("#layer2")?.innerHTML)
      &&!$("#layer .ce-sel,#layer .ce-fig,#layer .ce-tx,#layer .ce-cn,#layer .ce-selfie,#layer .ce-tagov,#layer .ce-fe,#layer .ca100-men")){
      const b=$("#layer > .ce .ce-ph [data-edvolta]");
      if(b){if(pushH())HST++;b.click();if(!$("#layer > .cp152")&&ED){CP152.txt=cp152TextoDe(ED);CP152.veio=false;ED=null;cp152Abre({manter:true,aba:"post"})}return}}
  }catch(e){}
  /* [168] matéria aberta pelo "Próxima": voltar desfaz um passo; fechar de vez desfaz todos */
  try{const mat=$("#layer .mat"),l2=($("#layer2")||{}).innerHTML;
    if(mat&&!l2&&CM168_PILHA.length){if(fromPop===true){cm168Volta(CM168_PILHA.pop());return}
      /* fechar de vez ("‹ Capa", Esc, arrastar): desfaz também os passos do "Próxima" */
      const k=Math.min(CM168_PILHA.length,HST-1);CM168_PILHA=[];if(k>0){HST-=k;voltarH(k)}}
    else if(!mat)CM168_PILHA=[]}catch(e){}
  /* [167] fechar um story aberto pela faixa: a faixa fica onde estava (sem rolar sozinha) */
  const eraStory=!!document.querySelector("#layer .story")&&FD167_FILA!=null,x=FD167_FILA;const b=document.getElementById("secs");let st=null;
  if(eraStory&&b){st=b.scrollTo;b.scrollTo=function(){}}
  try{
    /* [155] voltar do celular na caixa de criar: o texto fica guardado */
    let feito=false;
    try{if(fromPop===true&&$("#layer > .cp152")&&!$("#layer2")?.innerHTML){
      if(String(CP152.txt||"").trim()||CR155.pid){cr155Guarda();if(Date.now()-CR155.volta>3000){CR155.volta=Date.now();if(pushH())HST++;
        /* 19/11: o voltar não arma mais o "Descartar?" (o aviso diz que o texto fica guardado; descartar é só pelo Cancelar) */
        toast((typeof fc164Tem==="function"&&fc164Tem())?"Volte de novo para sair. O texto fica guardado; a foto, não.":"Volte de novo para sair. O texto fica guardado.");feito=true}
        else{clMiolo(fromPop);toast("Seu texto ficou guardado. Toque em + para continuar.");feito=true}}}}catch(e){}
    if(!feito)clMiolo(fromPop);
  }finally{if(eraStory&&b){try{delete b.scrollTo}catch(e){}if(b.scrollTo!==Element.prototype.scrollTo)b.scrollTo=st;
    if(!document.querySelector("#layer .story")){FD167_FILA=null;b.scrollLeft=x;requestAnimationFrame(()=>{try{b.scrollLeft=x}catch(e){}})}}}
  /* [168] sem matéria aberta: zera a pilha e tira o #m= do endereço */
  try{if(!$("#layer .mat")){CM168_PILHA=[];cm168Url(null)}}catch(e){}
}
/* Miolo do closeLayer: do 152 até o 007. Cada remendo podia parar antes de fechar (return); quando parava, os acabamentos
   dos remendos de FORA dele ainda rodavam, os de dentro não. Aqui: "fim" guarda onde parou (0 = fechou de verdade) e cada
   acabamento confere se o seu remendo chegou a chamar o de dentro (fim menor que o número dele). */
function clMiolo(fromPop){
  let fim=0,E137,ht125,ler123,volta123,eraHt111,eraMat111,st108,ed106c,ce106,ret104,n093;
  pre:{
    /* [152] voltar do celular com texto na caixa: guarda o texto (abrir de novo traz de volta) */
    if(fromPop===true&&$("#layer > .cp152")&&CP152.txt.trim()&&!$("#layer2")?.innerHTML){CP152.guardado=CP152.txt}
    /* [137] */
    E137=ED132.E;
    /* [132] editor de coluna: menu aberto, publicando, alterações não salvas */
    {const l2=!!($("#layer2")&&$("#layer2").innerHTML),root=!l2&&$("#layer > .ed132");
    if(root&&!closeLayer._ok&&ED132.E){const E=ED132.E;
      const pp=root.querySelector(".ed132-pp");if(pp){pp.remove();if(fromPop===true&&pushH())HST++;fim=132;break pre}
      if(E.env&&fromPop!==true){toast(E.modo==="editar"?"Salvando…":"Publicando…");fim=132;break pre}
      if(E.modo==="editar"&&E.descartar!=="sim"&&ed132Sujo(E)){if(fromPop===true&&pushH())HST++;E.descartar=true;ed132Cab();toast("Alterações não salvas. Toque em Salvar, ou no × de novo para descartar.");fim=132;break pre}
      if(E.modo!=="editar")try{ed132Guarda()}catch(e){}
      ED132.E=null;try{htFecha()}catch(e){}}
    else if(root&&closeLayer._ok)ED132.E=null;}
    /* [125] */
    {const l2=!!($("#layer2")&&$("#layer2").innerHTML);ht125=!l2&&$("#layer > .cs123-ler")&&CS123.ler&&CS123.ler.ht;}
    /* [123] colunas: prévia, editor publicando, leitura que volta ao perfil */
    {const l2=!!($("#layer2")&&$("#layer2").innerHTML);
    if(!l2&&$("#layer .cs123-prev")&&CS123.ed){$("#layer .cs123-prev").remove();if(fromPop===true){if(pushH())HST++;fim=123;break pre}if(HST>0){HST--;voltarH(1)}fim=123;break pre}
    if(!l2&&$("#layer > .cs123-ed")&&CS123.ed){if(CS123.ed.env&&fromPop!==true){toast("Publicando…");fim=123;break pre}cs123RascGuarda(true);CS123.ed=null}
    ler123=!l2&&$("#layer > .cs123-ler")&&CS123.ler;volta123=ler123&&CS123.ler.volta;}
    /* [111] */
    {const l2=!!($("#layer2")&&$("#layer2").innerHTML);eraHt111=!l2&&!!$("#layer .pfv-ht");eraMat111=!l2&&!!$("#layer .mat");}
    /* [108] */ st108=!!$("#layer .story");
    /* [106-produção] */ ed106c=!!$("#layer > .ce");
    /* [106-pendências] */ ce106=!!$("#layer .ce")&&!($("#layer2")?.innerHTML);
    /* [106-pendências] voltar do celular com o "Aa" da matéria aberto: só fecha o "Aa" */
    {const ab=$("#layer .mat-aap");if(fromPop===true&&ab&&!($("#layer2")?.innerHTML)){ab.remove();$("#layer [data-mataa]")?.setAttribute("aria-expanded","false");if(pushH())HST++;fim=106;break pre}}
    /* [104-stories] */
    ret104=!!$("#layer .story")&&!$("#layer2").innerHTML&&ST&&ST._ret104;if(ret104)ST._ret104=null;
    /* [100] menu do editor aberto */
    if($("#layer .ca100-men")){if(fromPop===true&&ED&&!($("#layer2")?.innerHTML)){ca100MenFecha();if(pushH())HST++;fim=100;break pre}ca100MenFecha()}
    /* [094] figurinha sendo editada */
    if(fromPop===true&&ED&&$("#layer .ce-fe")&&!($("#layer2")?.innerHTML)){fg2Ok();if(pushH())HST++;fim=94;break pre}if(!$("#layer .ce-fe"))FG2=null;
    /* [093] */ n093=$("#layer > .ce");
    /* [083] grade do perfil: voltar dos posts volta para a grade */
    if(fromPop===true&&PFV&&PFV.modo==="posts"&&PFV.daGrade&&$("#layer .pfv")&&!($("#layer2")?.innerHTML)){pfIdsVolta();PFV={...PFV,modo:"grade",lista:null};pfvDesenha();fim=83;break pre}
    /* [080] sair do Layout com fotos: pede para voltar de novo */
    if(fromPop===true&&ED&&ED.modo==="story"&&ED.tela==="lay"&&!$("#layer .ce-sel,#layer .ce-fig")&&ED.st.bg.cel&&ED.st.bg.cel.some(Boolean)&&Date.now()-(ED._laysai||0)>3000){ED._laysai=Date.now();if(pushH())HST++;toast("Volte de novo para sair do Layout. As fotos serão descartadas.");fim=80;break pre}
    /* [078] editor: voltar do celular desfaz um passo */
    if(fromPop===true&&ED&&$("#layer .ce")&&!($("#layer2")?.innerHTML)&&!ED.env){const fica=()=>{if(pushH())HST++};
      if($("#layer .ce-selfie")){camDesliga();CAM.f=ED._selfieF||"environment";$("#layer .ce-selfie").remove();fica();fim=78;break pre}
      if($("#layer .ce-tagov")){$("#layer .ce-tagov").remove();edDesenha();fica();fim=78;break pre}
      if(!$("#layer .ce-sel,#layer .ce-fig,#layer .ce-tx,#layer .ce-cn")){
        if(ED.modo==="story"&&ED.tela==="lay"){ED.st.bg={tipo:"grad",g:Math.floor(Math.random()*PUB_FUNDOS.length)};ED.tela="cam";edDesenha();fica();fim=78;break pre}
        if(ED.modo==="post"&&ED.po.passo==="fotos"&&ED.po.fotos.length+ED.po.texto.trim().length>0){edFechar();fica();fim=78;break pre}}}
    /* [071] editor no estilo Instagram */
    if($("#layer .ce")&&!($("#layer2")?.innerHTML)){
      if(fromPop===true&&ED){const fica=()=>{if(pushH())HST++};
        if(ED.env){fica();toast("Publicando…");fim=71;break pre}
        if($("#layer .ce-sel")){$("#layer .ce-sel").remove();fica();fim=71;break pre}
        if($("#layer .ce-fig")){$("#layer .ce-fig").remove();fica();fim=71;break pre}
        if(ED.st.tx||$("#layer .ce-tx")){edTextoOk();fica();fim=71;break pre}
        if(ED.st.ferr==="caneta"){ED.st.ferr=null;$("#layer .ce-cn")?.remove();$("#layer .ce").classList.remove("desenhando");edDesenha();fica();fim=71;break pre}
        if(ED.modo==="post"&&ED.po.passo!=="fotos"){ED.po.passo=ED.po.passo==="detalhes"&&ED.po.fotos.length?"filtros":"fotos";edDesenha();fica();fim=71;break pre}
        if(edTemAlgo()&&Date.now()-(ED._volta||0)>3000){ED._volta=Date.now();fica();toast("Volte de novo para descartar o que você fez.");fim=71;break pre}}
      if(ED&&(ED.st.tx||$("#layer .ce-tx"))&&fromPop!==true&&!closeLayer._ok){edTextoOk();fim=71;break pre}
      ED=null;closeLayer._ok=false}
    /* [070] criação antiga: voltar do celular com algo feito pede para voltar de novo */
    if(fromPop===true&&$("#layer .cria")&&!($("#layer2")?.innerHTML)&&CR&&!CR.env&&(CR.fotos.length||CR.texto.trim()||CR.pid)&&Date.now()-CR_VOLTA>3000){CR_VOLTA=Date.now();if(pushH())HST++;toast("Volte de novo para descartar o que você fez.");fim=70;break pre}
    /* [068] criação antiga: confirma descartar */
    if($("#layer .cria")&&CR&&!CR.env&&(CR.fotos.length||CR.texto.trim()||CR.pid)&&!fromPop&&!closeLayer._ok&&!($("#layer2")?.innerHTML)){if(!confirmaDescartar()){fim=68;break pre}}closeLayer._ok=false;if($("#layer .cria")&&!($("#layer2")?.innerHTML))CR=null;
    /* daqui para dentro nenhum remendo para antes de fechar */
    /* [060], [058], [057], [056] */
    const sec=ST&&ST.sec,eraStory=!!$("#layer .story")&&!($("#layer2")?.innerHTML),tinhaMat=!!$("#layer .mat")&&!($("#layer2")?.innerHTML);
    /* [041] janelas por cima: a página de baixo volta a rolar */
    {const l2=$("#layer2"),l1=$("#layer");const fica=!!(l2&&l2.innerHTML&&l1&&l1.innerHTML);if(!fica)destravarFundo();}
    /* [034] transição de saída */
    try{if(ANIM_OK()&&!MAT_ARRASTO){const l2=$("#layer2"),L=l2&&l2.innerHTML?l2:$("#layer"),n=L&&L.firstElementChild;
      if(n&&n.classList.contains("mat")){n.style.transform="";saidaClone(n,"sai-mat",300)}else if(n&&n.classList.contains("scrim"))saidaClone(n,"sai-sheet",280)}}catch(e){}
    MAT_ARRASTO=false;
    /* [033], [031] */
    const pid033=MAT_PID,orig033=MAT_ORIG,eraMat=!!document.querySelector("#layer .mat")&&!(($("#layer2")||{}).innerHTML);
    /* [007] o fechar de sempre */
    base:{if(QUIZ_ON&&$(".qopts")){QUIZ_ON=false;setTimeout(()=>toast("Quiz interrompido. Dá para refazer em Interagir."),50)}const had=($("#layer2")?.innerHTML)||$("#layer").innerHTML;if(had&&!fromPop&&HST>0){HST--;voltarH(1)}const l2=$("#layer2");if(l2&&l2.innerHTML){l2.innerHTML="";const c2=onClose;onClose=null;c2&&c2();storyRetoma();break base}clearTimeout(ST?.timer);if(ST)ST.timer=0;clearTimeout(VIRA_T);VIRANDO=false;$("#layer").innerHTML="";const c=onClose;onClose=null;c&&c()}
    /* [031] matéria fechada na Capa: a Capa fica no mesmo lugar */
    if(eraMat&&MAT_PID){const pid=MAT_PID;MAT_PID=null;if(VIEW==="capa"){const el0=document.getElementById("cpi-"+pid);const r0=el0?el0.getBoundingClientRect().top:null;const ab0=CP_AB;CP_AB=null;if(!cpAlternar(ab0,null))renderCapa();
      const el=document.getElementById("cpi-"+pid);if(el&&r0!=null)window.scrollTo(0,scrollY+el.getBoundingClientRect().top-r0)}}
    /* [033] veio pelo "Próxima": a Capa mostra a última lida */
    if(eraMat){MAT_ORIG=null;if(orig033&&pid033&&pid033!==orig033&&VIEW==="capa"){const f=()=>{const el=document.getElementById("cpi-"+pid033);if(el)window.scrollTo(0,scrollY+el.getBoundingClientRect().top-innerHeight*.28)};f();requestAnimationFrame(f);setTimeout(f,150)}}
    /* [047] versão nova esperando: recarrega quando não há janela aberta */
    if(window.RECARGA_PEND&&VERSAO_NOVA)setTimeout(()=>{if(!temJanela()){try{sessionStorage.setItem("prumo-recarregou",VERSAO_NOVA)}catch(e){}location.reload()}},400);
    /* [056] story fechado: a bolinha dele fica à vista na faixa */
    if(eraStory&&sec&&VIEW==="feed"){const box=$("#secs");const sel=sec==="_5min"?"[data-5min]":sec==="_ult"?"[data-ultimas]":sec==="_ag"?"[data-igagenda]":`[data-sec-story="${CSS.escape(sec)}"]`;const b=box&&box.querySelector(sel);
      if(b){const L=b.getBoundingClientRect().left-box.getBoundingClientRect().left+box.scrollLeft,want=Math.max(0,L-(box.clientWidth-b.offsetWidth)/2);if(Math.abs(box.scrollLeft-want)>8)box.scrollTo({left:want,behavior:REDUZ.matches?"auto":"smooth"})}}
    /* [057] matéria aberta de dentro de um story: volta ao story */
    if(tinhaMat&&IG_VOLTA&&!$("#layer").innerHTML){const v=IG_VOLTA;IG_VOLTA=null;if(fromPop===true||Date.now()-IG_XMAT<1500){ST=v;IG_MATPUSH=false;const _ph=pushH;pushH=()=>false;try{drawStory()}catch(e){}finally{pushH=_ph}}}
    else if(eraStory&&!$("#layer .story")){C5=null}
    /* [058] */
    if(eraStory&&sec&&String(sec).indexOf("_h:")===0&&VIEW==="feed"){const b=$(`#secs [data-dest="${CSS.escape(sec.slice(3))}"]`),box=$("#secs");if(b&&box){const want=b.getBoundingClientRect().left-box.getBoundingClientRect().left+box.scrollLeft-(box.clientWidth-b.offsetWidth)/2;box.scrollTo({left:Math.max(0,want),behavior:"smooth"})}}
    /* [059] */
    if(!$("#layer .mat"))setTimeout(igFundoTira,$("#layer .story")?60:320);
    /* [060] */
    if(tinhaMat&&IG_MATPUSH&&!$("#layer .story")&&!$("#layer .mat")){IG_MATPUSH=false;if(HST>0){HST--;voltarH(1)}}
    /* [060] faixa de stories redesenhada depois de fechar o story */
    if(RS_PEND&&!$("#layer .story")){try{renderSecs();const box=$("#secs");if(box&&sec&&VIEW==="feed"){const sel=sec==="_5min"?"[data-5min]":sec==="_ult"?"[data-ultimas]":sec==="_ag"?"[data-igagenda]":String(sec).indexOf("_h:")===0?`[data-dest="${CSS.escape(sec.slice(3))}"]`:`[data-sec-story="${CSS.escape(sec)}"]`;const b=box.querySelector(sel);
      if(b){const want=Math.max(0,b.getBoundingClientRect().left-box.getBoundingClientRect().left+box.scrollLeft-(box.clientWidth-b.offsetWidth)/2);if(Math.abs(box.scrollLeft-want)>8)box.scrollTo({left:want,behavior:REDUZ.matches?"auto":"smooth"})}}}catch(e){}}
  }
  /* acabamentos dos remendos de fora (rodam se o remendo chegou a chamar o de dentro: fim < número dele) */
  /* [074] câmera desligada fora do editor */
  if(fim<74){if(!$("#layer .ce"))camDesliga()}
  /* [083] */
  if(fim<83){if(!$("#layer .pfv")){if(PFV){pfIdsVolta();PFV=null}}}
  /* [084] */
  if(fim<84){if(!$("#layer .pfv-arq")&&PFV&&PFV.modo==="arq")PFV=null}
  /* [093] editor sai com animação */
  if(fim<93&&n093&&!n093.isConnected&&ANIM_OK()){try{if(CAM.v&&n093.contains(CAM.v))CAM.v.remove();n093.querySelectorAll("video").forEach(v=>{v.muted=true;try{v.pause()}catch(_){}});n093.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));
    n093.classList.add("ce-sai");n093.setAttribute("aria-hidden","true");n093.inert=true;delete n093.dataset.anim;document.body.appendChild(n093);setTimeout(()=>n093.remove(),260)}catch(e){n093.remove()}}
  if(fim<=100){
  /* [104-feed] */
  if(FD104_ME)setTimeout(()=>{try{if(!$("#layer").innerHTML)fd104Me()}catch(e){}},80);
  /* [104-stories] story aberto de um aviso: volta para onde estava */
  if(ret104){const v=VIEW,th=typeof THREAD!=="undefined"?THREAD:null;setTimeout(()=>{try{if(VIEW===v&&(typeof THREAD==="undefined"||THREAD===th)&&!$("#layer").innerHTML&&!$("#layer2").innerHTML&&!ED&&S.uid)ret104()}catch(e){}},420)}}
  if(fim<=106){
  /* [106-pendências] depois de publicar, abre o perfil de quem foi marcado */
  try{if(AD106&&ce106&&!$("#layer .ce")){const a=AD106;AD106=null;const pub=typeof ED!=="undefined"&&ED&&ED.env;if(!pub&&Date.now()-a.t<30*60e3&&typeof igAbrirUser==="function"&&pubDe(a.id))setTimeout(()=>{if(!$("#layer").innerHTML){document.querySelectorAll(".toast").forEach(x=>{if(!x.querySelector(".toast-a"))x.remove()});igAbrirUser(a.autor,a.id)}},260)}}catch(e){}
  /* [106-produção] criou a partir da matéria e desistiu: volta para a matéria */
  try{if(ed106c&&MC106&&!$("#layer > .ce")){const m=MC106;MC106=null;if(!m.pub&&!(typeof PQ!=="undefined"&&PQ.atual)&&Date.now()-m.t<36e5&&pautaById(m.pid))setTimeout(()=>{try{if(!$("#layer").innerHTML&&!ED){abrirMateria(m.pid);$("#layer .fc105-mc")?.scrollIntoView({block:"center"})}}catch(e){}},ANIM_OK()?260:40)}}catch(e){}
  /* [108] anéis da faixa */
  if(st108&&!$("#layer .story"))requestAnimationFrame(st108Aneis);
  /* [111] página de hashtag e matéria aberta dela: volta para a hashtag */
  try{if(!$("#layer").innerHTML&&(eraHt111||eraMat111)){const user=fromPop===true||Date.now()-HT_CLK<800;
    if(eraHt111){try{pfIdsVolta()}catch(e){}if(!HT_FECHANDO){const o=HT_PILHA.pop();if(user)htRestaura(o);else HT_PILHA=[]}}
    else if(HT_MAT_VOLTA){const v=HT_MAT_VOLTA;HT_MAT_VOLTA=null;if(!HT_FECHANDO&&user)abrirHashtag(v,{reabre:true})}}}catch(e){}
  /* [113] */
  try{if(F113_IO&&!$("#layer .mat")){F113_IO.disconnect();F113_IO=null}}catch(e){}}
  /* [123] coluna lida a partir do perfil: volta ao perfil */
  if(fim<123){if(ler123){CS123.ler=null;if(volta123&&!$("#layer").innerHTML){PFV=volta123.pfv;$("#layer").innerHTML=`<div class="pfv" role="dialog" aria-modal="true" aria-label="Perfil de ${esc(nomeDe(PFV.u))}"></div>`;try{pfvDesenha();const sc=$("#layer .pfv-sc");if(sc)sc.scrollTop=volta123.sc}catch(e){}}}}
  /* [125] coluna lida a partir de uma hashtag: volta à hashtag */
  if(fim<132){try{if(ht125&&fromPop===true&&!$("#layer").innerHTML)setTimeout(()=>{if(!$("#layer").innerHTML)abrirHashtag(ht125,{reabre:true})},0)}catch(e){}}
  /* [137] */
  try{if(E137&&E137.modo==="editar"&&E137.descartar==="sim"&&ED132.E!==E137)cr137BackTira(E137.pubId)}catch(e){}
}

/* ===== go: troca de aba (capa, feed, msgs, busca, saved, play, me) =====
   Antes: definida no 012 e remendada em 031 (2×), 033, 035, 057, 059, 065, 070, 083, 103, 104-leitura, 111, 112, 120,
   139, 142, 151, 159, 167 e 182 (20 remendos). Camadas: go (182, 167) → goTroca (151 … 035 e, depois, 033 … 159) →
   goMostra (031, 031, 012). O 167 podia chamar o de dentro duas vezes (erro dentro do try dele): por isso goTroca é uma
   função. Na carga, o 031 chama go("capa",true) quando só existiam o 012 e os dois remendos do 031: goMostra. */
function go(v,fromPop){
  /* 18/11 (Pedro): a busca guarda de onde veio, para "Cancelar" voltar à mesma tela e ao mesmo ponto */
  if(v==="busca"&&typeof VIEW==="string"&&VIEW!=="busca")BV_DE={v:VIEW,y:scrollY};
  if(!NUC_PRONTO){goMostra(v,fromPop);return}
  /* [182] Quiz e Enquete escondidos: "Interagir" vira Capa */
  if(v==="play"&&ft182Esc("quiz")&&ft182Esc("enquete"))v="capa";
  /* [167] trocar de aba pela barra entra no histórico (voltar do celular volta à aba anterior) */
  let feito=false;
  try{
  /* o voltar já tirou um passo (VST--) e pede a raiz: vai para a aba guardada nesse passo */
  if(fromPop&&v===RAIZ&&FD167_PILHA.length===VST+1){const alvo=FD167_PILHA[VST];FD167_PILHA.length=VST;if(alvo&&FD167_ABAS.includes(alvo))v=alvo;goTroca(v,fromPop);feito=true}
  else{
  if(FD167_PILHA.length>VST)FD167_PILHA.length=Math.max(0,VST);
  const simples=!fromPop&&v!==VIEW&&FD167_ABAS.includes(v)&&FD167_ABAS.includes(VIEW)&&!(JUMPS&&JUMPS.length)&&!TST&&!SUBV;
  if(simples){
    if(v===RAIZ){if(VST>1){voltarH(VST-1);VST=1}FD167_PILHA.length=0}
    else if(VIEW===RAIZ){FD167_PILHA=[RAIZ]}/* o go de sempre guarda esta entrada (VST 0 → 1) */
    else if(FD167_PILHA.length===VST&&VST>0){
      /* voltar pela barra para a aba anterior = um passo para trás; senão, um passo novo */
      if(FD167_PILHA[VST-1]===v&&VST>1){FD167_PILHA.length=VST-1;VST--;voltarH(1)}
      else if(VST<8&&pushH()){FD167_PILHA.push(VIEW);VST++}}}}}catch(e){}
  if(!feito)goTroca(v,fromPop);
}
function goTroca(v,fromPop){
  /* [151] o feed adiado em pedaços termina antes de trocar */
  if(PF151.fila.length)pf151Tudo();
  /* [142] */
  const ant142=typeof VIEW==="string"?VIEW:"";
  /* [112] saindo do perfil */
  if(v!=="me"&&VIEW==="me"&&!(PFV&&$("#layer .pfv")))try{pfIdsVolta()}catch(e){}
  /* [111] */
  HT_PILHA=[];HT_MAT_VOLTA=null;htFecha();
  /* [104-leitura] "voltar" de Interagir/Guardadas e filtro da Capa */
  const de=VIEW;
  if(v==="play"||v==="saved"){if(!fromPop&&de!==v&&de!=="play"&&de!=="saved")VOLTA_DE=de==="me"?null:de}else VOLTA_DE=null;
  if(v==="capa"&&window.FILTRO_CAPA){window.FILTRO_CAPA=0;if(FILTRO!=="tudo"){FILTRO="tudo";ssSet("radar-filtro",FILTRO);try{renderSecs();renderPosts()}catch(e){}}}
  /* [059] */
  igFundoTira();
  /* [057] */
  IG_VOLTA=null;
  /* [035] feed adiado: desenha ao entrar */
  if(v==="feed"&&FEED_ADIADO){FEED_ADIADO=false;try{RF_REAL()}catch(e){}}
  goMostra(v,fromPop);
  /* [033] */
  try{appLargo()}catch(e){}
  /* [065] */
  document.body.classList.toggle("dm-conv",VIEW==="msgs"&&!!THREAD);
  /* [070] posts novos que chegaram fora do feed */
  if(v==="feed"&&typeof PUB_FEED_PEND!=="undefined"&&PUB_FEED_PEND){PUB_FEED_PEND=false;try{renderPosts(true)}catch(e){}}
  /* [083] */
  if(v==="me"&&S.uid&&S.membro)pfCarregar(S.uid).then(()=>{if(VIEW==="me")renderMe()});
  /* [103] */
  try{const s=(v==="feed"||v==="capa")&&document.getElementById("v-"+v);if(s&&!s.classList.contains("cv-pronto"))requestAnimationFrame(()=>requestAnimationFrame(()=>s.classList.add("cv-pronto")))}catch(e){}
  /* [104-leitura] */
  try{vbackAjusta()}catch(e){}
  /* [120] */
  if(v==="feed"&&typeof po118NoFeed==="function")try{po118NoFeed()}catch(e){}
  /* [139] */
  try{tc139F16Tudo()}catch(e){}
  /* [142] telemetria */
  try{if(typeof v==="string"&&/^[a-z]{2,12}$/.test(v)){tl142Acao("go:"+v);if(v!==ant142)tl142Conta("tela_"+v)}}catch(e){}
  /* [159] */
  try{ca159Lp()}catch(e){}
}
function goMostra(v,fromPop){
  /* [031] */
  const mudou=v!==VIEW;
  /* [012] a troca de sempre */
  let naRaiz=false;if(!fromPop&&JUMPS.length){let n=JUMPS.length;if(JUMPS[0].view!==RAIZ){n+=VST+SUBV;VST=0;SUBV=0}naRaiz=true;JUMPS=[];voltarH(n)}
  if(!fromPop){if(VIEW==="me"&&(v==="saved"||v==="play")){if(pushH())SUBV++}else if(SUBV>0&&(VIEW==="saved"||VIEW==="play")){voltarH(SUBV);SUBV=0}}
  if(!fromPop&&TST>0&&(v!=="msgs"||!THREAD)){voltarH(TST);TST=0}
  if(!fromPop){if(v!==RAIZ&&(VIEW===RAIZ||naRaiz)){if(pushH())VST++}else if(v===RAIZ&&VST>0){VST--;voltarH(1)}}
  const yAlvo=v==="feed"?(VIEW==="feed"?0:FEED_Y):0;if(VIEW==="feed"&&v!=="feed")FEED_Y=scrollY;
  const pl=$("#pilula");if(pl)pl.hidden=v!=="feed"&&v!=="capa";if(v!==VIEW)document.querySelectorAll(".toast").forEach(x=>x.remove());
  VIEW=v;["feed","capa","msgs","busca","saved","play","me"].forEach(k=>{const sv=$("#v-"+k);if(sv)sv.hidden=k!==v});{const tab={saved:"me",play:"me"}[v]||v;document.querySelectorAll(".nav button[data-v]").forEach(b=>{if(b.dataset.v===tab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
  $("header.top").hidden=v!=="feed";if(v!=="msgs")THREAD=null;
  if(v==="msgs")renderMsgs();if(v==="saved")renderSaved();if(v==="play")renderPlay();if(v==="me"){renderMe();carregarRodadas();carregarErrosResp()}
  if(v==="feed"){requestAnimationFrame(()=>document.querySelectorAll(".track").forEach(t=>{if(FIT_IO){FIT_IO.unobserve(t);FIT_IO.observe(t)}else fitTrack(t)}));tkStart()}
  window.scrollTo(0,yAlvo);
  /* [031] troca de aba: some o "encolhido" e a nova tela entra suave (só quando a pessoa troca; não na abertura) */
  {const nav=$(".nav"),topo=$("header.top");if(nav&&topo){nav.classList.remove("mini");topo.classList.remove("esconde");
    if(mudou&&document.readyState!=="loading"&&!document.documentElement.classList.contains("ab141-abrindo")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){const sec=document.getElementById("v-"+v);if(sec){try{sec.animate([{opacity:0},{opacity:1}],{duration:150,easing:"ease-out"})}catch(e){}}}}}
  /* [031] lente, Capa, Busca e aba guardada */
  if(typeof lenteBotao==="function")lenteBotao();if(v==="capa"){capaSeMudou();uso("capa")}if(v==="busca"){renderBuscaView();uso("aba_busca");if(!fromPop){const q=$("#bvq");if(q&&!q.value)try{q.focus({preventScroll:true})}catch(e){}}}if(!fromPop&&(v==="feed"||v==="capa"))try{localStorage.setItem("prumo-aba",v);localStorage.setItem("prumo-aba-dia",hojeSP())}catch(e){}
}

/* ===== sheet: folha que sobe de baixo (título, corpo, rodapé) =====
   Antes: definida no 007 e remendada em 106, 108, 112, 123, 132, 155 e 160 (7 remendos).
   Camadas de fora para dentro: 160 → 155 → 132 → 123 → 112 → 108 → 106 → 007. */
function sheet(title,body,foot="",opt={}){
  /* [160] denúncia: textos curtos e sem "Denunciar" para o administrador */
  try{if(typeof body==="string"&&/data-denp="/.test(body)){const m=body.match(/data-denp="([^"]+)"/),u=m&&m[1];
    let x=body.replace(/(data-bloquear="[^"]+">)Bloquear [^<]*</,"$1Bloquear<").replace(/(data-denp="[^"]+">)Denunciar [^<]*</,"$1Denunciar<");if(!co160Admin(S.uid))x=x.replace("<span>o Pedro recebe e analisa</span>","<span>o administrador do Prumo analisa</span>");
    if(u&&co160Admin(u))x=x.replace(/<button type="button" data-denp="[^"]+">[\s\S]*?<\/button>/,"");body=x}}catch(e){}
  /* [155] post sem foto: "Editar texto" em vez de "Editar legenda" */
  try{if(title==="Editar legenda"){const m=/data-uedok="([^"]+)"/.exec(String(foot||""));const x=m&&pubDe(m[1]);if(x&&!(x.fotos||[]).length)title="Editar texto"}
    else if(typeof body==="string"&&body.indexOf("data-ueditar=")>=0){const m=/data-ueditar="([^"]+)"/.exec(body);const x=m&&pubDe(m[1]);if(x&&!(x.fotos||[]).length)body=body.replace(">Editar legenda<",">Editar texto<")}}catch(e){}
  /* [132], [123] folha aberta sobre o editor/leitura de coluna: a coluna fica com a classe "cria" enquanto a folha monta */
  const r132=document.querySelector("#layer > .ed132, #layer > .ed132-hubr"),c132=!!(r132&&!$("#layer2")?.innerHTML);if(c132)r132.classList.add("cria");
  try{
    const r123=document.querySelector("#layer > .cs123-ler, #layer > .cs123-ed"),c123=!!(r123&&!$("#layer2")?.innerHTML);if(c123)r123.classList.add("cria");
    try{
      /* [108] administrador: a denúncia fica na lista dele */
      try{if(typeof body==="string"&&S.uid&&(S.membros[S.uid]||{}).papel==="admin")body=body.replace(/<span>o Pedro recebe e analisa<\/span>/g,"<span>fica na sua lista da Administração</span>")}catch(e){}
      /* [007] a folha de sempre */
      const L=$(".story")||$("#layer .mat")||$("#layer .pv.pv-sob")||$("#layer .cria")||$("#layer .ce")||$("#layer .pfv")?$("#layer2"):$("#layer");const vazio=!L.innerHTML;if(L.id==="layer2"&&ST.timer){clearTimeout(ST.timer);ST.timer=0;ST.resto=Math.max(800,(ST.fim||0)-Date.now());const fb=$("#layer .bars b");if(fb)fb.style.animationPlayState="paused"}
      L.innerHTML=`<div class="scrim" data-scrim><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div><div class="sh-h">${esc(title)}<button type="button" class="sh-x" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="sh-b gut">${body}</div>${foot?`<div class="sh-f gut">${foot}</div>`:""}</div></div>`;
      const f=L.querySelector("input");if(f&&(opt.focus||matchMedia("(pointer:fine)").matches))f.focus();
      if(vazio&&pushH())HST++;wireSheetDrag(L.querySelector(".sheet"));
      /* [106] avisos sem botão somem quando a folha abre */
      try{document.querySelectorAll(".toast").forEach(x=>{if(!x.querySelector(".toast-a")&&Date.now()-(x._t106||0)>400)x.remove()})}catch(e){}
      /* [112] nomes novos (Giro, Destaque) nos textos da folha */
      try{vn112Nomes($("#layer2")&&$("#layer2").innerHTML?$("#layer2"):$("#layer"))}catch(e){}
    }finally{if(c123)r123.classList.remove("cria")}
  }finally{if(c132)r132.classList.remove("cria")}
}

/* ===== toast: aviso curto embaixo da tela (com botão opcional) =====
   Antes: definida no 001 e remendada em 077, 099, 106, 112, 156, 161, 166 e 167 (8 remendos).
   Camadas de fora para dentro: 167 → 166 → 161 → 156 → 112 → 106 → 099 → 077 → 001. */
function toast(t,acao,fn){
  /* [167] "Gostei" vira "curtida" nos avisos */
  try{if(typeof t==="string")t=t.replace("o Gostei vai ser enviado","a curtida vai ser enviada").replace("o Gostei foi enviado","a curtida foi enviada").replace("os Gostei foram enviados","as curtidas foram enviadas")}catch(e){}
  /* [166] sem internet com publicação na fila: não avisa que falhou */
  try{if(typeof t==="string"&&/^Não deu para publicar\. Tente de novo\.$/.test(t)&&navigator.onLine===false&&typeof PQ!=="undefined"&&(PQ.atual||PQ.jobs.length))return}catch(e){}
  /* [161] "salvos" viram "guardados" */
  try{if(t==="Salvo"){t="Guardado";if(acao==="Ver salvos"){acao="Ver guardados";fn=()=>gd161Abre("posts")}}
    else if(t==="Removido dos salvos")t="Removido dos guardados";else if(t==="Não deu para salvar agora.")t="Não deu para guardar agora."}catch(e){}
  /* [156] sem conexão: comentário e Gostei ficam na fila */
  try{if(typeof t==="string"){
    if(/^O comentário não foi salvo/.test(t)){
      if(fd156Offline()&&fd156CmtGuarda()){t="Sem conexão: o comentário vai ser enviado quando a internet voltar.";acao="Cancelar";fn=fd156CmtCancela}
      else setTimeout(()=>{const i=document.getElementById("ctext");if(!i)return;try{if(typeof cm106Ajusta==="function")cm106Ajusta(i)}catch(e){}try{const n=i.value.length;i.setSelectionRange(n,n)}catch(e){}},0)}
    else if(/^Não deu para marcar agora/.test(t)&&fd156Offline())t="Sem conexão: a curtida vai ser enviada quando a internet voltar."}}catch(e){}
  /* [112] nomes novos (Giro, Destaque) */
  try{if(typeof t==="string"&&VN112_NOMES_T.test(t))t=vn112Troca(t)}catch(e){}
  aviso:{
    /* [099] "fulano foi avisado por mensagem" vira a pílula de confirmação */
    if(typeof t==="string"){const k=/^(.+?) (foi avisado\(a\)|foram avisados|recebeu a notícia|receberam a notícia) por mensagem$/.exec(t);if(k){vp99Pilula(`✓ ${k[1]} ${k[2]}`);break aviso}}
    /* [077] erro do vídeo no lugar do aviso genérico */
    if(/Não deu para publicar/.test(t||"")&&window.__vErr)t=window.__vErr;
    /* [001] o aviso de sempre */
    document.querySelectorAll(".toast").forEach(x=>x.remove());const el=document.createElement("div");el.className="toast";el.setAttribute("role","status");const sp=document.createElement("span");sp.textContent=t;el.appendChild(sp);if(acao&&fn){const b=document.createElement("button");b.type="button";b.className="toast-a";b.textContent=acao;b.addEventListener("click",ev=>{ev.stopPropagation();el.remove();fn()});el.appendChild(b)}document.body.appendChild(el);setTimeout(()=>el.remove(),acao?4200:2600)
  }
  /* [106] marca a hora do aviso (a folha que abre logo depois não o apaga) */
  const el=[...document.querySelectorAll(".toast")].pop();if(el)el._t106=Date.now();
}

/* ===== pubPostHTML: o cartão de um post de membro (Feed, Perfil, Criar) =====
   Antes: definida no 068 e remendada em 071, 076, 077, 078, 079, 081, 084, 099, 102, 104-feed, 107, 112 (2×), 113, 117,
   121, 122, 123, 125, 134 e 155 (20 remendos). Quase todos acabam o HTML do de dentro; dois trocam o post que vai para
   dentro (a coluna do 123 e o post com formato do 102 desenham uma cópia com outro texto). Por isso três funções, uma por
   "post que entra": pubPostHTML (155, 134, 125, 123) → ppMeio (122 … 102) → ppCartao (099 … 071 e o 068 em ppBase). */
function pubPostHTML(x){
  /* [123] coluna: o cartão sem texto nem fotos, com o cartão da coluna no lugar */
  const c=x&&cs123Col(x);let h;
  if(!c)h=ppMeio(x);
  else{const y=Object.assign(Object.create(Object.getPrototypeOf(x)),x,{texto:"",fotos:[],pid:null});h=ppMeio(y);
    try{const tp=document.createElement("template");tp.innerHTML=String(h||"").trim();const a=tp.content.firstElementChild;
      if(a){a.classList.add("cs123-post");a.querySelectorAll(":scope>.car,:scope>.vn-rpw,.up-leg,.vn-cc-row .up-leg").forEach(e=>e.remove());
        const ph=a.querySelector(":scope>.ph")||a.querySelector(".ph");if(ph)ph.insertAdjacentHTML("afterend",cs123CardHTML(x,c));else a.insertAdjacentHTML("afterbegin",cs123CardHTML(x,c));
        const pg=a.querySelector(".vp99-pg,.pdots");if(pg)pg.remove();h=a.outerHTML}}catch(e){}}
  try{if(h&&x&&x.publico==="seguidores")h=h.replace(/(<span class="ph-sub">[^<]*)/,`$1<span class="cs123-ps"> · seguidores</span>`)}catch(e){}
  /* [125] "seguidores" também no cabeçalho do relato */
  p125:{try{if(!x||x.publico!=="seguidores"||typeof h!=="string"||h.indexOf("ac117-meta")<0)break p125;
    const a=vn112Tp(h),m=a&&a.querySelector(".ph .ac117-meta");if(!m||m.querySelector(".cs123-ps"))break p125;m.insertAdjacentHTML("beforeend",`<span class="cs123-ps">seguidores</span>`);h=a.outerHTML}catch(e){}}
  /* [134] repost com trecho citado de coluna */
  p134:{try{const tr=lt134Trecho(x),rp=tr&&vn112Rp(x);if(!tr||typeof h!=="string"||!h)break p134;
    const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)break p134;a.classList.remove("vn-rp-so");a.classList.add("lt134-pc");
    a.querySelectorAll(".vn-rpk").forEach(k=>{const n=k.nextSibling;if(n&&n.nodeType===3&&/^\s*·\s*$/.test(n.nodeValue))n.remove();k.remove()});
    const blk=lt134CitHTML(tr,rp&&rp.k==="pub"?rp.id:""),w=a.querySelector(".vn-rpw"),q=w&&w.querySelector(".vn-q");
    if(q)q.insertAdjacentHTML("beforebegin",blk);else if(w)w.insertAdjacentHTML("beforeend",blk);else{const ph=a.querySelector(":scope>.ph");if(ph)ph.insertAdjacentHTML("afterend",`<div class="gut">${blk}</div>`);else a.insertAdjacentHTML("afterbegin",blk)}
    h=a.outerHTML}catch(e){}}
  /* [155] post sem foto com um slide só (gráfico, notícia, cartão): classe cr155-auto */
  p155:{try{if(typeof h!=="string"||!h||!x||x.tipo!=="post"||(x.fotos||[]).length||h.indexOf("cr155-auto")>=0)break p155;
    const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild,tr=a&&a.querySelector(".car .track");if(!tr||tr.children.length!==1)break p155;
    const s=tr.firstElementChild;if(!s.matches(".cn102-dsl,.cn102-ntsl,.up-nt,.cn102-sl"))break p155;a.classList.add("cr155-auto");h=a.outerHTML}catch(e){}}
  return h;
}
function ppMeio(x){
  let h;
  /* [102] formatos da criação (relato, análise, pergunta, notícia comentada): o cartão próprio de cada um */
  n102:{
    try{if(x)pubLimpa(x)}catch(e){h="";break n102}const cn=x&&x.tipo==="post"?cn102De(x):null;
    if(!cn){h=ppCartao(x);if(h&&x&&x.pid&&!(x.fotos||[]).length)try{h=cn102TrocaNt(h,x)}catch(e){}break n102}
    const corpo=cn102Corpo(x,cn),y=Object.assign(Object.create(Object.getPrototypeOf(x)),x,{texto:corpo});h=ppCartao(y);if(!h)break n102;
    try{const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)break n102;a.classList.add("cn102-post","cn102-"+cn.k);a.dataset.cn102k=cn.k;
      /* rótulo no cabeçalho */
      const sub=cn.k!=="nt"&&a.querySelector(".ph-sub");if(sub)sub.insertAdjacentHTML("afterbegin",`<span class="cn102-lb cn102-lb-${cn.k}">${esc({rel:"Relato",ana:"Opinião",enq:"Pergunta",nt:"Comentário"}[cn.k])}</span>`);
      const tr=a.querySelector(".car .track");
      if(tr){const tx=tr.querySelector(".up-tx");if(tx)tx.remove();const ntsl=tr.querySelector(".up-nt");
        if(cn.k==="enq"&&ntsl)ntsl.remove();if(ntsl&&cn.k!=="enq")ntsl.outerHTML=cn102NtSlide(x);
        const card=cn102CardHTML(x,cn,corpo);const fotos=!!tr.querySelector(".up-img,.up-sem,.up-vid");
        if(card&&!(cn.k==="rel"&&fotos))tr.insertAdjacentHTML("afterbegin",card);
        if(cn.k==="ana"&&cn.d&&String(corpo).trim())tr.children[0].insertAdjacentHTML("afterend",`<div class="sl up-sl cn102-sl cn102-dsl"><div class="cn102-cd">${cn102Svg(cn.d)}${cn.d.tipo==="ind"?`<p class="cn102-dfo">Indicador da edição do Prumo</p>`:cn.fu?`<p class="cn102-dfo">${esc("Fonte: "+((cn102Fonte(cn.fu)||{}).n||""))}</p>`:`<p class="cn102-dfo">Números informados por ${esc(cn102Primeiro(x.autor))}</p>`}</div></div>`);
        /* pontinhos e contador com o novo número de slides */
        const n=tr.children.length,dots=a.querySelector(".pdots");if(dots){if(n>1)dots.outerHTML=`<div class="prog pdots" aria-hidden="true">${[...Array(n)].map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${n}</span></div>`;else dots.remove()}
        else if(n>1){const sp=a.querySelector(".acts .sp");if(sp)sp.insertAdjacentHTML("afterend",`<div class="prog pdots" aria-hidden="true">${[...Array(n)].map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${n}</span></div>`)}
        const pg=a.querySelector(".vp99-pg");if(pg){if(n>1)pg.textContent="1/"+n;else pg.remove()}else if(n>1){const car=a.querySelector(".car");car.classList.add("vp99-car");car.insertAdjacentHTML("afterbegin",`<span class="vp99-pg" aria-hidden="true">1/${n}</span>`)}}
      /* legenda: título e local/hora do relato com foto; o corpo inteiro da análise e do relato sem foto; fonte */
      let leg=a.querySelector(".up-leg");const lk=a.querySelector("[data-likes]");
      if(!leg&&String(corpo).trim().length>CN102_CURTO&&cn.k!=="enq"&&lk){lk.insertAdjacentHTML("afterend",`<p class="up-leg${corpo.length>160||/\n.*\n/.test(corpo)?" up-curta\" data-upmais role=\"button\" tabindex=\"0":""}"><b>${esc(nomeDe(x.autor))}</b> ${dmMarcaPub(corpo)}</p>`);leg=a.querySelector(".up-leg")}
      if(!leg&&cn.k==="enq"&&String(corpo).trim()&&lk){lk.insertAdjacentHTML("afterend",`<p class="up-leg"><b>${esc(nomeDe(x.autor))}</b> ${dmMarcaPub(corpo)}</p>`);leg=a.querySelector(".up-leg")}
      const extra=cn102Leg(x,cn,corpo);if(extra){if(leg)leg.insertAdjacentHTML("beforebegin",extra);else if(lk)lk.insertAdjacentHTML("afterend",extra)}
      const fo=cn.k==="rel"||cn.k==="ana"?cn102FonteHTML(cn.fu):"";if(fo){const ref=leg||a.querySelector(".cn102-lm,.cn102-lt")||lk;if(ref)ref.insertAdjacentHTML("afterend",fo)}
      h=a.outerHTML}catch(e){}
  }
  /* [104-feed] estrela dos Melhores amigos */
  try{if(x&&x.tipo==="post"&&x.publico==="proximos")h=h.replace(/<span data-otr(="")?>/,m=>`<i class="fd104-ma" role="img" aria-label="Só para os Melhores amigos" title="Melhores amigos">★</i>`+m)}catch(e){}
  /* [107] "Opinião" vira "Análise"; formato com um slide só: fc107-auto */
  try{if(typeof h==="string"&&h&&x&&x.tipo==="post"){
      h=h.replace('cn102-lb-ana">Opinião<','cn102-lb-ana">Análise<');const cn=cn102De(x);
      if(cn&&["ana","rel","enq"].includes(cn.k)){const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild,tr=a&&a.querySelector(".car .track");
        if(tr&&tr.children.length===1&&tr.firstElementChild.classList.contains("cn102-sl")){a.classList.add("fc107-auto");h=a.outerHTML}}}}catch(e){}
  /* [112] repost */
  try{h=vn112RpHTML(h,x)}catch(e){}
  /* [112] cartão do visual novo */
  p112:{try{if(typeof h!=="string"||!h||!x||x.tipo!=="post")break p112;
    const a=vn112Tp(h);if(a){const r=vn112Rp(x);const alvo=r&&!String(x.texto||"").trim()?r:{k:"pub",id:x.id};vn112PoeRp(a,alvo.k,alvo.id);h=a.outerHTML}
    h=VN112_CT?vn112CtPub(h,x):h}catch(e){}}
  /* [113] fio e contexto */
  p113:{if(typeof h!=="string"||!h||!x||x.tipo!=="post")break p113;try{const a=vn112Tp(h);if(!a)break p113;
    const parts=f113PodeFio(x)?f113Fio(x):null;if(parts)f113PoeFio(a,x,parts);f113PoeCtx(a,x);h=a.outerHTML}catch(e){}}
  /* [117] relato */
  try{h=ac117Rel(h,x)}catch(e){}
  /* [121] fonte do gráfico */
  try{h=tb121Fonte(h,x)}catch(e){}
  /* [122] */
  try{h=dc122Hf(h,x)}catch(e){}try{h=dc122Nome(h)}catch(e){}
  return h;
}
function ppCartao(x){
  let h;
  /* [079] dados de outros membros sempre normalizados (se não der, cartão vazio) */
  c079:{try{pubLimpa(x)}catch(e){h="";break c079}
    h=ppBase(x);
    /* [071] local, marcados ("com fulano") e proporção da foto */
    p071:{const es=x.estilo||{};if(es.v!==2)break p071;
      const sub=[es.local?esc(es.local):"",esc(quando(x.at))].filter(Boolean).join(" · ");const com=(es.marcados||[]).filter(u=>S.membros[u]||S.amigos.has(u));
      h=h.replace(/(<span class="ph-nm"><b>)([^<]*)(<\/b><span class="ph-sub">)[^<]*(<\/span>)/,(a,b1,nm,b3,b4)=>b1+nm+(com.length?` <span class="up-com">com ${com.slice(0,2).map(u=>esc(String(nomeDe(u)).split(" ")[0])).join(" e ")}${com.length>2?` e mais ${com.length-2}`:""}</span>`:"")+b3+sub+b4);
      if(es.arv&&x.fotos.length&&Math.abs(es.arv-.8)>.01)h=h.replace('class="post upost"',`class="post upost up-ar" data-ar="${+es.arv}"`)}
    /* [076] marcações nas fotos, texto alternativo, sem comentários/curtidas */
    p076:{const es=x.estilo||{};if(es.v!==2||!(es.tags&&es.tags.length||es.alt||es.semCom||es.semCurt))break p076;
      try{const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)break p076;
        if(es.semCom)a.classList.add("sem-com");if(es.semCurt&&x.autor!==S.uid)a.classList.add("sem-curt");
        const sl=[...a.querySelectorAll(".track > .up-sl")].slice(0,x.fotos.length);
        sl.forEach((s,i)=>{const im=s.querySelector("img.up-img");if(im&&es.alt&&es.alt[i])im.alt=es.alt[i];const ts=(es.tags||[]).filter(t=>t.i===i&&(S.membros&&S.membros[t.u]||S.amigos.has(t.u)||t.u===S.uid));
          if(ts.length){s.insertAdjacentHTML("beforeend",`<button type="button" class="up-tgb" data-uptags aria-label="Ver quem está marcado">👤</button>${ts.map(t=>`<span class="up-tg" style="--tx:${t.x<.22?"-12%":t.x>.78?"-88%":"-50%"};--ty:${t.y>.82?"calc(-100% - 8px)":"8px"};left:${Math.max(5,Math.min(95,t.x*100))}%;top:${Math.max(5,Math.min(95,t.y*100))}%">${esc(nomeDe(t.u))}</span>`).join("")}`)}});
        h=a.outerHTML}catch(e){}}
    /* [077] reels */
    p077:{const es=x.estilo||{};if(!es.reel||!es.video)break p077;
      const poster=pubSrc(pubUrl(x.fotos[0])),vu=vidSrc(pubUrl(es.video));h=h.replace(/<img class="up-img"[^>]*>/,`<video class="up-img up-vid" muted loop playsinline preload="none" poster="${poster}" data-vsrc="${vu}" data-ini="${+es.ini||0}" data-fim="${+es.fim||0}"></video><span class="up-rl">▶ Reels</span>${es.mudo?"":`<button type="button" class="up-som" data-upsom aria-label="Ligar o som">🔇</button>`}`);
      h=h.replace('class="post upost','class="post upost up-reel')}
    /* [078] legenda longa: "mais" */
    h=String(x.texto||"").length>160||/\n.*\n/.test(x.texto||"")?h.replace('<p class="up-leg">','<p class="up-leg up-curta" data-upmais role="button" tabindex="0">'):h;
  }
  /* [081] texto grande: letra menor e "Ler tudo" */
  p081:{const n=String(x.texto||"").length;if(!/up-tx/.test(h))break p081;let o=h.replace('class="sl up-sl up-tx"',`class="sl up-sl up-tx${n>600?" up-txg":n>240?" up-txm":""}"`);if(n>600)o=o.replace(/(<div class="sl up-sl up-tx up-txg"[^>]*><p>[\s\S]*?<\/p>)/,`$1<button type="button" class="up-tudo-b" data-uptudo="${esc(x.id)}">Ler tudo</button>`);h=o}
  /* [084] editado */
  h=x.editado&&x.tipo==="post"?h.replace(/(<span class="ph-sub">)([^<]*)(<\/span>)/,(a,b1,t,b3)=>b1+t+" · editado"+b3):h;
  /* [099] guardar, local · hora e contador 1/N */
  p099:{if(!h||!x)break p099;try{
    /* marcador de salvar (o botão já existia, escondido) */
    h=h.replace(/<button[^>]*data-a="save"[^>]*>[\s\S]*?<\/button>/,`<button type="button" class="act vp99-sv" data-a="save" aria-label="Guardar" aria-pressed="false">${VP99_BM}</button>`);
    /* local · hora: o local encolhe, a hora fica inteira */
    const es=x.estilo||{};
    if(es.local){const loc=esc(es.local);h=h.replace(/<span class="ph-sub">([^<]*)<\/span>/,(a,c)=>c.indexOf(loc+" · ")===0?`<span class="ph-sub vp99-sub"><span class="vp99-loc">${loc}</span><span class="vp99-qd">&nbsp;· ${c.slice(loc.length+3)}</span></span>`:a)}
    /* contador 1/N em cima da foto enquanto desliza */
    const n=(h.match(/class="sl /g)||[]).length;if(n>1)h=h.replace('<div class="car">',`<div class="car vp99-car"><span class="vp99-pg" aria-hidden="true">1/${n}</span>`);
  }catch(e){}}
  return h;
}
/* [068] o cartão de sempre */
function ppBase(x){const id="u:"+x.id,eu=x.autor===S.uid,fs=x.fotos.map(pubUrl),nt=x.pid&&pautaById(x.pid);
  let sl=fs.map(u=>`<div class="sl up-sl">${u?`<img class="up-img" src="${pubSrc(u)}" alt="" loading="lazy" decoding="async">`:`<div class="up-sem">Foto indisponível</div>`}</div>`);
  const ntSl=x.pid?`<div class="sl up-sl up-nt"><button type="button" class="up-ntc" data-capmat="${esc(x.pid)}"><small style="color:${secCor(nt?secOf(nt):(x.snap&&x.snap.secao)||"politica")}">${esc(secNome(nt?secOf(nt):(x.snap&&x.snap.secao)||"politica"))}</small><b>${esc(nt?versao(nt,lente()).titulo:(x.snap&&x.snap.titulo)||"Notícia")}</b><span>Ler a matéria ›</span></button></div>`:"";
  if(ntSl)sl.push(ntSl);const soTexto=!sl.length;if(soTexto)sl=[`<div class="sl up-sl up-tx" style="background:${pubFundo(String(x.id).charCodeAt(0))}"><p>${dmMarcaPub(x.texto)}</p></div>`];
  return `<article class="post upost" id="p-${esc(id)}" data-pid="${esc(id)}">
    <div class="ph gut"><div class="ph-t"><span class="up-au">${avatar(x.autor)}<span class="ph-nm"><b>${esc(nomeDe(x.autor))}</b><span class="ph-sub">${esc(quando(x.at))}${x.pid&&x.fotos.length?" · com notícia":""}</span></span></span><span data-otr></span></div><button type="button" class="more-btn" data-umenu="${esc(x.id)}" aria-label="Mais opções">${ICON.dots}</button></div>
    <div class="car"><div class="track">${sl.join("")}</div></div>
    <div class="gut">
      <div class="acts"><button type="button" class="act" data-a="like" aria-label="Curtir">${ICON.like}<span>Curtir</span><em class="cnt" data-n="like"></em></button><button type="button" class="act" data-a="cmt" aria-label="Comentar">${ICON.cmt}<span>Comentar</span><em class="cnt" data-n="cmt"></em></button><button type="button" class="act" data-usend="${esc(x.id)}" aria-label="Enviar">${ICON.send}<span>Enviar</span></button><span class="sp"></span>${sl.length>1?`<div class="prog pdots" aria-hidden="true">${sl.map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${sl.length}</span></div>`:""}<button type="button" class="act" data-a="save" hidden aria-hidden="true">${ICON.save}</button></div>
      <div class="likes" data-likes></div>
      ${x.texto&&!soTexto?`<p class="up-leg"><b>${esc(nomeDe(x.autor))}</b> ${dmMarcaPub(x.texto)}</p>`:""}
      <div class="pollbox" data-poll hidden></div><div data-together></div><div data-nchat></div>
      <div class="cmt-area"><div class="cmts" data-cmts></div><button type="button" class="addc" data-a="cmt">Adicione um comentário…</button></div>
    </div></article>`}

/* ===== Atividade (o sino) e bolinhas: atItens, atAcao, atThumb, atDot, updateBadge =====
   Antes: definidas no 085 (updateBadge no 011) e remendadas em 18 (atItens), 8 (atAcao), 5 (atThumb), 3 (atDot) e
   4 (updateBadge) arquivos. A parte "de sempre" de atItens, atAcao e atThumb continua como era, em atItensBase,
   atAcaoBase e atThumbBase (copiadas do 085); aqui ficam os acréscimos, na ordem em que rodavam. */

/* lista da Atividade. Camadas: 181 → 183 → 142 → 134 → 130 → 129 → 126 → 125 (nomes de quem não é membro, só durante
   a montagem) → 124 … 086 → 085 */
function atOrdem(a,b){return (b.fixo||0)-(a.fixo||0)||b.at-a.at}
function atItens(){
  /* [125] quem não é membro mas é conhecido ganha nome enquanto a lista é montada */
  const pus=[];try{if(typeof AT!=="undefined"&&Array.isArray(AT.rows))AT.rows.forEach(x=>{const u=x&&x.uid;if(u&&!S.membros[u]&&!S.amigos.has(u)&&qa125Conhece(u)&&!pus.includes(u)){const p=CS123.pess[u]||{};S.membros[u]={uid:u,nome:p.nome||nomeDe(u),foto:p.foto||null};pus.push(u)}})}catch(e){}
  let it;
  try{
    it=atItensBase();
    /* [086] curtidas e respostas aos seus giros; seu post compartilhado num giro */
    if(S.uid&&S.membro){const agora=Date.now();
      try{(S.msgsIn||[]).filter(m=>(m.tipo==="curtiu_story"||m.tipo==="resp_story")&&+m.at>agora-30*864e5).forEach(m=>{const st=(m.snap&&m.snap.story)||{};
          it.push({k:"s:"+m.id,at:+m.at,us:[m.de],ic:m.tipo==="curtiu_story"?"♥":"💬",txt:`<b>${esc(nomeDe(m.de))}</b> ${m.tipo==="curtiu_story"?"curtiu seu giro":"respondeu ao seu giro: “"+esc(cp152Corta(m.texto,80))+"”"}${m.tipo==="curtiu_story"&&st.t?` · “${esc(cp152Corta(st.t,50))}”`:""}`,msg:m,acao:"conv"})});
        (PUB.itens||[]).filter(x=>x.tipo==="story"&&x.autor!==S.uid&&x.estilo&&Array.isArray(x.estilo.itens)).forEach(x=>{const f=x.estilo.itens.find(e=>e&&e.t==="pub"&&(e.au===S.uid||(AT.pubs[e.ref]&&1)));if(!f)return;
          it.push({k:"sh:"+x.id,at:+x.at,us:[x.autor],ic:"↗",txt:`<b>${esc(nomeDe(x.autor))}</b> compartilhou seu post no giro`,story:x,pub:f.ref,acao:"vstory"})})}catch(e){}
      it=it.sort(atOrdem).slice(0,80)}
    /* [088] menção num comentário que já aparece como comentário: some */
    {const cm=new Set(it.filter(x=>x.acao==="cmt").map(x=>x.us[0]+"|"+x.pub));
    it=it.filter(x=>!(x.acao==="men"&&x.msg&&/^u:/.test(String(x.msg.pid||""))&&cm.has(x.msg.de+"|"+String(x.msg.pid).slice(2))))}
    /* [106] a mesma pessoa duas vezes no mesmo post: uma só, e o verbo no singular */
    try{(it||[]).forEach(x=>{if(!x||!Array.isArray(x.us)||x.acao!=="pub")return;const u=[...new Set(x.us)];if(u.length===x.us.length)return;x.us=u;
      if(u.length===1&&typeof x.txt==="string")x.txt=x.txt.replace("</b> curtiram ","</b> curtiu ").replace("</b> responderam ao ","</b> respondeu ao ")})}catch(e){}
    /* [107] amigos que comentaram uma notícia */
    try{if(S.uid&&S.membro&&Array.isArray(it)){const ag=Date.now(),g={};
        pubVisiveis().forEach(x=>{if(x.autor===S.uid||ag-x.at>3*864e5||!fc107EhTake(x)||!pautaById(x.pid))return;(g[x.pid]=g[x.pid]||[]).push(x)});
        Object.entries(g).forEach(([pid,l])=>{l.sort((a,b)=>b.at-a.at);const us=[...new Set(l.map(x=>x.autor))],p=pautaById(pid);
          it.push({k:"fc107:"+pid,at:l[0].at,us,ic:"💬",txt:`<b>${esc(atJunta(us))}</b> ${us.length>1?"comentaram":"comentou"} a notícia “${esc(fc107Curto(versao(p,lente()).titulo,80))}”`,pid,acao:"fc107"})});
        it=it.sort(atOrdem).slice(0,80);it=fc107AtAgrupa(it)}}catch(e){}
    /* [108] votos na pergunta; "ao sua" → "à sua" */
    try{(it||[]).forEach(x=>{if(!x||typeof x.k!=="string"||x.k.indexOf("voto:")!==0)return;const pb=AT.pubs[x.pub],cn=pb&&pb.tipo==="post"&&pb.estilo&&pb.estilo.cn;
      if(cn&&cn.k==="enq"&&typeof x.txt==="string")x.txt=x.txt.replace(/ responderam ao (?:seu post|sua pergunta)( “[^”]*”)?$/," votaram na sua pergunta$1").replace(/ respondeu ao (?:seu post|sua pergunta)( “[^”]*”)?$/," votou na sua pergunta$1")});
      /* concordância: "ao sua análise" → "à sua análise" (nomes do 107) */
      (it||[]).forEach(x=>{if(x&&typeof x.txt==="string")x.txt=x.txt.replace(/ ao sua /g," à sua ")})}catch(e){}
    /* [109] curtidas nos seus comentários */
    if(V8.on&&S.uid&&S.membro&&(AT.cc8||[]).length){
      try{const g={};AT.cc8.forEach(x=>{if(!S.amigos.has(x.uid)&&!S.membros[x.uid])return;const k=(x.pub||"")+"|"+x.cid;(g[k]=g[k]||{x,us:[],at:0}).us.push([x.uid,+x.at]);g[k].at=Math.max(g[k].at,+x.at)});
        Object.entries(g).forEach(([k,o])=>{const c=at8Coment(o.x);if(!c)return;const us=o.us.sort((a,b)=>b[1]-a[1]).map(a=>a[0]);const t=String(c.texto||"");
          it.push({k:"cc8:"+k,at:o.at,us,ic:"♥",txt:`<b>${esc(atJunta(us))}</b> ${us.length>1?"curtiram":"curtiu"} seu comentário${t?`: “${esc(t.length>80?t.slice(0,79).trimEnd()+"…":t)}”`:""}`,cpid:c.pid,acao:"cc8"})})}catch(e){}
      it=it.sort(atOrdem).slice(0,80)}
    /* [112] reposts */
    try{if(Array.isArray(it)){const n=vn112AtRp();if(n.length)it=it.concat(n).sort(atOrdem).slice(0,80)}}catch(e){}
    /* [121] sem bloqueados; votos */
    try{if(Array.isArray(it))it=tb121SemBloq(it).map(tb121Voto)}catch(e){}
    /* [123] quem começou a seguir você */
    if(V9.on&&S.uid&&S.membro&&CS123.segs.length&&Array.isArray(it)){
      try{const lim=Date.now()-30*864e5;CS123.segs.filter(s=>s.at>lim&&s.uid!==S.uid).forEach(s=>it.push({k:"sg:"+s.uid,at:s.at,us:[s.uid],ic:"+",txt:`<b>${esc(nomeDe(s.uid))}</b> começou a seguir você`,u:s.uid,acao:"perfil"}))}catch(e){}
      it=it.sort(atOrdem).slice(0,80)}
    /* [124] seguidores novos e posts de quem você segue */
    try{if(NT124.v9&&S.uid&&S.membro&&Array.isArray(it)){const ag=Date.now(),novos=[];
        const semHora=NT124.seguidores.filter(s=>!s.at).map(s=>"nt124s:"+s.u);const L=semHora.length?nt124PrimeiraVez(semHora):{};
        NT124.seguidores.forEach(s=>{if(!S.membros[s.u]||(S.bloq||[]).includes(s.u))return;const at=s.at||L["nt124s:"+s.u]||0;if(!at)return;
          novos.push({k:"nt124s:"+s.u,at,us:[s.u],ic:"👤",txt:`<b>${esc(nomeDe(s.u))}</b> começou a seguir você`,u:s.u,acao:"perfil"})});
        if(NT124.seguindo.size)pubVisiveis().filter(x=>NT124.seguindo.has(x.autor)&&x.autor!==S.uid&&x.tipo!=="story"&&ag-x.at<30*864e5&&!(NT124.segDesde&&x.at<(NT124.segDesde[x.autor]||0))&&!nt124RpMeu(x)).sort((a,b)=>b.at-a.at).slice(0,12).forEach(x=>{const col=nt124EhColuna(x);
          const tt=String((x.estilo&&x.estilo.titulo)||x.texto||"").trim();
          novos.push({k:(col?"nt124c:":"nt124p:")+x.id,at:x.at,us:[x.autor],ic:col?"✎":"▤",txt:`<b>${esc(nomeDe(x.autor))}</b> ${col?"publicou uma coluna":"publicou"}${tt?`: “${esc(tt.length>80?tt.slice(0,79).trimEnd()+"…":tt)}”`:""}`,pub:x.id,acao:"nt124pub"})});
        if(novos.length)it=it.concat(novos).sort(atOrdem).slice(0,80)}}catch(e){}
  }finally{pus.forEach(u=>{delete S.membros[u]})}
  /* [126] "começou a seguir" uma vez só; título da coluna */
  try{if(Array.isArray(it)){
    const sg=new Set(it.filter(x=>x&&/^sg:/.test(String(x.k||""))).map(x=>String(x.k).slice(3)));
    if(sg.size)it=it.filter(x=>!(x&&/^nt124s:/.test(String(x.k||""))&&sg.has(String(x.k).slice(7))));
    it.forEach(x=>{if(!x||!/^nt124c:/.test(String(x.k||"")))return;const pb=pubDe(x.pub),tit=qb126TitCol(pb);
      if(tit)x.txt=`<b>${esc(nomeDe(pb.autor))}</b> publicou uma coluna: “${esc(tit.length>80?tit.slice(0,79).trimEnd()+"…":tit)}”`});
    if(typeof tb121SemBloq==="function")it=tb121SemBloq(it)}}catch(e){}
  /* [129] reposts (decisões de 04/11) */
  try{if(Array.isArray(it)){const n=dz129AtRp();if(n.length){const ja=new Set(it.map(x=>x.k));
    const mais=n.filter(x=>!ja.has(x.k));if(mais.length)it=it.concat(mais).sort(atOrdem).slice(0,80)}}}catch(e){}
  /* [130] junta itens parecidos */
  try{it=aj130Junta(it)}catch(e){}
  /* [134] colunas de quem você assina */
  try{if(LT134.v13===true&&LT134.assin.length&&Array.isArray(it)&&S.uid){const ag=Date.now(),novos=[],ids=new Set();
    pubVisiveis().forEach(x=>{if(!x||x.autor===S.uid||x.tipo!=="post"||ag-x.at>30*864e5)return;const c=cs123Col(x);if(!c)return;const a=lt134AssDe(x.autor,c.serie);if(!a||x.at<a.at)return;ids.add(x.id);
      const t=c.tit.length>80?c.tit.slice(0,79).trimEnd()+"…":c.tit;
      novos.push({k:"lt134c:"+x.id,at:x.at,us:[x.autor],ic:"✎",txt:`<b>${esc(nomeDe(x.autor))}</b> ${a.serie?`publicou na série “${esc(c.serie)}”`:"publicou uma coluna"}: “${esc(t)}”`,col:x.id,acao:"lt134col"})});
    if(novos.length)it=it.filter(y=>!(y&&/^nt124c:/.test(String(y.k))&&ids.has(String(y.k).slice(7)))).concat(novos).sort(atOrdem).slice(0,80)}}catch(e){}
  /* [142] alertas de erro (administrador) */
  try{if(Array.isArray(it)&&TL142.alertas.length&&tl142SouAdm()){
    const n=TL142.alertas.map(a=>{const m=String(a.mensagem||"");return {k:"tl142:"+a.id+":"+a.alerta_em,at:Date.parse(a.alerta_em)||Date.now(),us:[],ic:"⚠",acao:"tl142",tl142:+a.id,
      txt:`<b>Erro novo frequente no app</b>: “${esc(m.length>90?m.slice(0,89)+"…":m)}” · ${+a.alerta_n||0} aparelhos em 1 hora`}});
    it=it.concat(n).sort(atOrdem).slice(0,80)}}catch(e){}
  /* [183] coberturas silenciadas */
  try{if(Array.isArray(it)){const m=cb183Mudas();
    if(Object.keys(m).length)it=it.filter(x=>!(x&&x.acao==="cob"&&x.pid&&m[x.pid]))}}catch(e){}
  /* [181] pedidos para seguir */
  if(sg181On()&&Array.isArray(it)){
    try{SG181.rec.forEach(x=>it.push({k:"sp:"+x.uid,at:x.at,us:[x.uid],ic:"+",txt:`<b>${esc(nomeDe(x.uid))}</b> pediu para seguir você`,u:S.uid,acao:"perfil"}))}catch(e){}
    it=it.sort(atOrdem).slice(0,80)}
  return it;
}

/* tocar num item da Atividade. Camadas: 165 → 142 → 134 → 124 → 112 → 109 → 107 → 086 → 085 */
function atAcao(x){
  /* [165] cobertura: abre a página dela por cima da Atividade */
  if(x&&x.acao==="cob"&&x.pid&&$("#layer .pfv-at")&&pautaById(x.pid)){abrirPagCob(x.pid);return}
  /* [142] alerta de erro: abre a Administração */
  if(x&&x.acao==="tl142"){if($("#layer").innerHTML)closeLayer();const id=x.tl142;setTimeout(()=>{TL142.adm.sub="erros";TL142.adm.abre=id;abrirAdmin("app")},320);return}
  /* [134] coluna */
  if(x&&x.acao==="lt134col"){const id=x.col;if($("#layer .pfv-at"))closeLayer();setTimeout(()=>{LT134.forca="notificacao";cs123Abrir(id)},320);return}
  if(x&&x.pub)LT134.notif={id:String(x.pub),t:Date.now()};
  /* [124] post de quem você segue */
  if(x&&x.acao==="nt124pub"){const id=x.pub;if($("#layer .pfv-at"))closeLayer();setTimeout(()=>nt124AbrePub(id),320);return}
  /* [112] repost */
  if(x&&x.acao==="vnrp"){const id=x.vnrp;if($("#layer .pfv-at"))closeLayer();setTimeout(()=>vn112AbrePub(id),320);return}
  /* [109] curtida no seu comentário */
  if(x&&x.acao==="cc8"){if($("#layer .pfv-at"))closeLayer();setTimeout(()=>openComments(x.cpid),320);return}
  /* [107] amigos comentaram a notícia */
  if(x&&x.acao==="fc107"){const pid=x.pid;if($("#layer .pfv-at"))closeLayer();setTimeout(()=>fc107Abre(pid),320);return}
  /* [086] conversa; giro */
  if(x.acao==="conv"){if($("#layer .pfv-at"))closeLayer();setTimeout(()=>abrirConversa(x.msg.de),320);return}
  if(x.acao==="vstory"){stLista([x.story],0,nomeDe(x.story.autor),"sh"+x.story.id);return}
  return atAcaoBase(x);
}

/* miniatura de um item da Atividade. Camadas: 142 → 124 → 107 → 106 → 086 → 085 */
function atThumb(x){
  /* [142] */
  if(x&&x.acao==="tl142")return "";
  /* [124] post de quem você segue: a miniatura usa o post (só enquanto desenha) */
  let novo124=false;
  if(x&&x.acao==="nt124pub"){const pb=pubDe(x.pub);if(!pb)return "";novo124=!AT.pubs[x.pub];AT.pubs[x.pub]=pb}
  let h;
  m107:{
    /* [107] notícia comentada: a arte da notícia */
    if(x&&(x.acao==="fc107"||x.pub)){const pb=x.pub&&(pubDe(x.pub)||AT.pubs[x.pub]),p=pautaById(x.acao==="fc107"?x.pid:pb&&!(pb.fotos||[]).length&&fc107EhTake(pb)?pb.pid:"");if(p)try{h=`<span class="at-th fc107-atn">${capaArte(p,"fc107-ata")}</span>`;break m107}catch(e){}}
    /* [106] post só de texto: a miniatura com o fundo dele */
    const k=x&&x.pub,pb=k&&AT.pubs[k];
    if(!pb||pb.tipo==="story"||(pb.fotos&&pb.fotos.length)||(pb.estilo&&pb.estilo.fundo))h=atThumb086(x);
    else{AT.pubs[k]={...pb,estilo:{...(pb.estilo||{}),fundo:String(pb.id).charCodeAt(0)}};try{h=atThumb086(x)}finally{AT.pubs[k]=pb}}
  }
  if(novo124)delete AT.pubs[x.pub];
  return h;
}
/* [086] giro com o seu post: a miniatura do post */
function atThumb086(x){if(x.acao==="vstory"){const pb=AT.pubs[x.pub];if(pb)return atThumbBase({...x,pub:x.pub})}return atThumbBase(x)}

/* bolinha da Atividade. Camadas: 159 → 124 → 106 → 085 */
function atDot(){
  /* [106] coração da Capa */
  cp106Coracao();
  /* [085] */
  const n=S.uid&&S.membro?atNovas():0;document.querySelectorAll(".at-dot").forEach(d=>{d.hidden=!n});
  /* [124] */
  nt124Pinta();
  /* [159] sino da Capa */
  try{ca159Sino()}catch(e){}
}

/* contador de conversas não lidas. Camadas: 162 → 124 → 091 → 085 → 011 */
function updateBadge(){
  /* [162] conversas: só contam as que entram na conta (enquanto conta) */
  const real=S.msgsIn,filtra=!!PREF.conv&&Array.isArray(real);if(filtra)S.msgsIn=real.filter(cv162Conta);
  try{
    /* [011] */
    {const n=S.msgsIn.filter(m=>!m.lida).length,b=$("#badge");b.hidden=!n;b.textContent=n>9?"9+":n;const mb=$("#mbadge");if(mb){const p=S.pedidosIn.length;mb.hidden=!p;mb.setAttribute("aria-label",p?(p===1?"1 pedido de amizade":p+" pedidos de amizade"):"")}}
    /* [085] */
    atDot();atRedesenha();
    /* [091] bloqueados não contam */
    try{const bl=S.bloq||[];if(bl.length){const n=S.msgsIn.filter(m=>!m.lida&&!bl.includes(m.de)).length,b=$("#badge");if(b){b.hidden=!n;b.textContent=n>9?"9+":n}}}catch(e){}
    /* [124] */
    nt124Pinta();
  }finally{if(filtra&&Array.isArray(S.msgsIn)&&S.msgsIn!==real)S.msgsIn=real}
}

/* ===== rerenderAll: redesenha o que depende da conta (depois de entrar, sair, chegar amigo…) =====
   Antes: definida no 012 e remendada em 073, 085, 104-feed (2×), 106 e 108 (6 remendos).
   Camadas: 108 → 106 → 104 → 104 → 085 → 073 → 012. */
let RR104_NOMES="",RR104_K="",RR108_K=null;  /* eram variáveis dos blocos do 104 e do 108 */
function rerenderAll(){
  /* [106] pedidos aceitos */
  at106Aceitos();
  /* [012] */
  refiltrar();if(FEED)renderChgBox();if(FEED)(FEED.pautas||[]).forEach(p=>updateSocial(p.id));if(VIEW==="msgs")renderMsgs();if(VIEW==="saved")renderSaved();if(VIEW==="play")renderPlay();if(VIEW==="me")renderMe();updateBadge();S._reAmg&&S._reAmg();
  /* [073] curtidas e comentários dos posts de membros */
  try{document.querySelectorAll("#posts .upost[data-pid]").forEach(a=>updateSocial(a.dataset.pid))}catch(e){}
  /* [085] */
  atDot();atRedesenha();
  /* [104] nomes dos membros mudaram: redesenha os posts */
  try{const k=Object.keys(S.membros||{}).sort().map(u=>u+"="+((S.membros[u]||{}).nome||"")).join("|");
    if(RR104_NOMES&&k!==RR104_NOMES)document.querySelectorAll("#posts .upost[data-pid]").forEach(a=>fd104Troca(String(a.dataset.pid).slice(2)));RR104_NOMES=k}catch(e){}
  /* [104] perfil aberto em grade: amizade mudou, redesenha */
  try{if(PFV&&PFV.modo==="grade"&&$("#layer .pfv")){const k=[S.amigos.has(PFV.u),(S.pedidosIn||[]).includes(PFV.u),(S.pedidosOut||[]).includes(PFV.u),(S.bloq||[]).includes(PFV.u)].join();if(k!==RR104_K){RR104_K=k;const sc=$("#layer .pfv-sc"),y=sc?sc.scrollTop:0;pfvDesenha();const s2=$("#layer .pfv-sc");if(s2)s2.scrollTop=y}}else RR104_K=""}catch(e){}
  /* [108] amigos mudaram: tira posts de quem não é mais amigo e busca os dos novos */
  try{if(S.uid&&S.amigosOk){const k=S.uid+":"+[...S.amigos].sort().join(",");
    if(RR108_K!==null&&k!==RR108_K&&k.split(":")[0]===RR108_K.split(":")[0]&&typeof PUB!=="undefined"&&PUB.on){const ant=new Set(RR108_K.split(":")[1].split(","));
      document.querySelectorAll("#posts .upost[id^='p-u:']").forEach(el=>{const x=pubDe(el.id.slice(4));if(x&&x.autor!==S.uid&&!S.amigos.has(x.autor))el.remove()});
      pubRedesenha();if([...S.amigos].some(u=>!ant.has(u)))setTimeout(pubCarregar,300)}
    RR108_K=k}}catch(e){}
}

/* [085] a parte de sempre da Atividade (era a definição de atItens, atAcao e atThumb) */
function atItensBase(){if(!S.uid||!S.membro)return [];const it=[],agora=Date.now();
  // reações às minhas publicações
  const g={};AT.rows.forEach(x=>{if(!S.amigos.has(x.uid)&&!S.membros[x.uid])return;if(x.tipo==="comentario"){const v=x.valor||{};it.push({k:"c:"+x.chave,at:+x.at,us:[x.uid],ic:"💬",txt:`<b>${esc(nomeDe(x.uid))}</b> comentou: “${esc((t=>t.length>90?t.slice(0,89).trimEnd()+"…":t)(String(v.texto||"")))}”`,pub:x.pub,acao:"cmt"});return}
    const k=x.tipo+":"+x.pub;(g[k]=g[k]||{tipo:x.tipo,pub:x.pub,us:[],at:0}).us.push([x.uid,+x.at]);g[k].at=Math.max(g[k].at,+x.at)});
  Object.entries(g).forEach(([k,o])=>{const us=o.us.sort((a,b)=>b[1]-a[1]).map(a=>a[0]);const pb=AT.pubs[o.pub];
    it.push({k,at:o.at,us,ic:o.tipo==="curtida"?"♥":"✋",txt:`<b>${esc(atJunta(us))}</b> ${o.tipo==="curtida"?(us.length>1?"curtiram ":"curtiu ")+atPubNome(pb):(us.length>1?"responderam ao ":"respondeu ao ")+(pb&&pb.tipo==="story"?"seu giro":atPubNome(pb))}`,pub:o.pub,acao:"pub"})});
  // menções e marcações
  (S.msgsIn||[]).filter(m=>m.tipo==="mencao"&&+m.at>agora-30*864e5).forEach(m=>{let t;try{t=dmPrevia(m)}catch(e){t="Mencionou você"}
    it.push({k:"m:"+m.id,at:+m.at,us:[m.de],ic:"@",txt:`<b>${esc(nomeDe(m.de))}</b> ${esc(String(t).charAt(0).toLowerCase()+String(t).slice(1))}${m.texto&&!/^Mencionou você no (story|giro)$/.test(m.texto)?`: “${esc((t=>t.length>80?t.slice(0,79).trimEnd()+"…":t)(String(m.texto)))}”`:""}`,msg:m,acao:"men"})});
  // amizades: pedidos e novas
  const pin=(S.pedidosIn||[]).filter(u=>S.membros[u]),am=amigosL();const chaves=pin.map(u=>"p:"+u).concat(am.map(u=>"a:"+u));
  // enquetes: amigos que votaram diferente de mim
  const enqs=FEED?(FEED.pautas||[]).filter(p=>p.enquete&&(p.enquete.opcoes||[]).length):[];const difs={};
  enqs.forEach(p=>{const meu=meuVoto(p.id);if(meu==null)return;const vs=votosDe(p.id);Object.entries(vs).forEach(([u,v])=>{if(u!==S.uid&&v!==meu&&v!=null){chaves.push("v:"+p.id+":"+u);(difs[p.id]=difs[p.id]||[]).push(u)}})});
  const L=atPrimeiraVez(chaves);
  pin.forEach(u=>it.push({k:"p:"+u,at:L["p:"+u]||0,us:[u],ic:"+",txt:`<b>${esc(nomeDe(u))}</b> quer ser seu amigo`,ped:u,fixo:1}));
  am.forEach(u=>{const t=L["a:"+u];if(t)it.push({k:"a:"+u,at:t,us:[u],ic:"🤝",txt:`Você e <b>${esc(nomeDe(u))}</b> agora são amigos`,u,acao:"perfil"})});
  Object.entries(difs).forEach(([pid,us])=>{const p=pautaById(pid);const at=Math.max(...us.map(u=>L["v:"+pid+":"+u]||0));if(!at||!p)return;
    it.push({k:"vd:"+pid,at,us,ic:"⚖",txt:`<b>${esc(atJunta(us))}</b> ${us.length>1?"votaram":"votou"} diferente de você em “${esc(p.enquete.pergunta)}”`,pid,acao:"debate"})});
  // comentários de amigos onde eu comentei ou votei
  enqs.concat(FEED?(FEED.pautas||[]):[]).forEach(p=>{if(it.some(x=>x.k==="cn:"+p.id))return;const {cm}=socialOf(p.id);const meus=cm.filter(c=>c.uid===S.uid);const votei=p.enquete&&meuVoto(p.id)!=null;if(!meus.length&&!votei)return;
    const desde=meus.length?Math.min(...meus.map(c=>c.at)):0;const outros=cm.filter(c=>c.uid!==S.uid&&c.at>desde&&c.at>agora-7*864e5);if(!outros.length)return;
    const us=[...new Set(outros.slice().reverse().map(c=>c.uid))];const ult=outros[outros.length-1];
    it.push({k:"cn:"+p.id,at:ult.at,us,ic:"💬",txt:`<b>${esc(atJunta(us))}</b> ${us.length>1?"comentaram":"comentou"} ${p.enquete?"na enquete":"na notícia"} “${esc(p.enquete?p.enquete.pergunta:(versao(p,lente()).titulo||temaDe(p)))}”: “${esc(cp152Corta(ult.texto,70))}”`,pid:p.id,acao:"debate"})});
  // coberturas seguidas: atualizações dos últimos 3 dias
  if(FEED)(FEED.pautas||[]).filter(p=>seguido(p)).forEach(p=>{const ups=(p.atualizacoes||[]).filter(u=>u&&u.texto&&tms(u.hora)>agora-3*864e5).sort((a,b)=>tms(b.hora)-tms(a.hora));if(!ups.length)return;
    it.push({k:"cob:"+p.id+":"+ups[0].hora,at:tms(ups[0].hora),us:[],ic:"📌",txt:`<b>${esc(temaDe(p))}</b>, que você segue, teve ${ups.length>1?ups.length+" atualizações":"uma atualização"}: “${esc(cp152Corta(ups[0].texto,90))}”`,pid:p.id,acao:"cob"})});
  return it.filter(x=>x.fixo||x.at>agora-30*864e5).sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}
function atAcaoBase(x){const fecha=()=>{if($("#layer .pfv-at"))closeLayer()};
  if(x.acao==="perfil"){abrirPerfil(x.u);return}
  if(x.acao==="men"){const m=x.msg;fecha();setTimeout(()=>{if(m.snap&&m.snap.upub){if(m.snap.story)abrirConversa(m.de);else pubIrPara(m.snap.upub)}else if(m.pid&&!/^u:/.test(m.pid)&&pautaById(m.pid))openComments(m.pid);else abrirConversa(m.de)},320);return}
  if(x.acao==="cob"){fecha();setTimeout(()=>abrirPagCob(x.pid),320);return}
  if(x.acao==="debate"){fecha();setTimeout(()=>debAbrir(x.pid),320);return}
  if(x.pub){const pb=AT.pubs[x.pub];if(!pb)return;if(pb.tipo==="story"){stLista([pb],0,"Seu giro","at");return}
    fecha();setTimeout(()=>{if(x.acao==="cmt"&&pubDe(x.pub))openComments("u:"+x.pub);else pubIrPara(x.pub)},320)}}
function atThumbBase(x){const pb=x.pub&&AT.pubs[x.pub];if(!pb)return "";const f=pb.fotos[0]&&pubUrl(pb.fotos[0]);
  return `<span class="at-th${pb.tipo==="story"?" st":""}">${f?`<img src="${pubSrc(f)}" alt="" loading="lazy">`:`<i style="background:${pubFundo(pb.estilo&&pb.estilo.fundo)}">${esc(String(pb.texto||"").slice(0,24))}</i>`}</span>`}

/* ===== renderMe: a aba Perfil (a sua) =====
   Antes: definida no 012 e remendada em 083, 084, 086, 090, 099, 104-feed, 109, 112, 114, 123, 124, 150, 158, 160, 161,
   165 e 181 (17 remendos). É do Perfil, mas fica no núcleo porque todo mundo a chama (go, rerenderAll, conta…).
   Camadas: renderMe (181 … 104, e o 112 antes) → o 099 monta o miolo sem os posts guardados em S.salvos →
   renderMeMiolo (090, 086, 084, 083 e o 012). */
function renderMe(){
  /* [112] aba do perfil no visual novo */
  if(PF_ABA==="posts"&&!["posts","resp","midia"].includes(VN112_PF.me))VN112_PF.me="posts";if(PF_ABA!=="posts")VN112_PF.me=PF_ABA;
  /* [099] o miolo vê só as notícias guardadas; os posts guardados chegam depois e redesenham */
  vp99SemPosts(renderMeMiolo,this,arguments);if(PF_ABA==="salvos"&&!vp99RM&&S.uid&&S.membro)vp99CarregaSalvos().then(n=>{if(n&&VIEW==="me"&&PF_ABA==="salvos"){vp99RM=1;try{renderMe()}finally{vp99RM=0}}});
  /* [104-feed] número de amigos abre a lista */
  try{const s=document.querySelector("#v-me .pf-me .pf-num span:nth-child(2)");if(s&&typeof abrirTodosAmigos==="function"){s.setAttribute("role","button");s.tabIndex=0;s.dataset.fd104am="";s.setAttribute("aria-label",s.textContent.replace(/(\d+)/,"$1 ")+": ver a lista")}}catch(e){}
  /* [109] posts arquivados */
  try{if(V8.on){const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-arq8]")){const h=`<button type="button" data-arq8><span>Posts arquivados</span><i>›</i></button>`;const a=m.querySelector("[data-arquivo]");if(a)a.insertAdjacentHTML("afterend",h);else m.insertAdjacentHTML("afterbegin",h)}}}catch(e){}
  /* [112] */
  try{const m=$("#v-me .pf-me");if(m)vn112Pf(m,S.uid,VN112_PF.me)}catch(e){console.error(e)}
  /* [114] Melhores amigos */
  try{if(S.membro&&PUB.on!==false){const b=$("#v-me [data-bloqueados]");
    if(b&&!$("#v-me [data-ra114maa]"))b.insertAdjacentHTML("beforebegin",`<button type="button" data-ra114maa><span>Melhores amigos</span><i>›</i></button>`)}}catch(e){}
  /* [123] seguidores e seguindo */
  try{if(V9.on&&S.uid&&S.membro){const m=$("#v-me .pf-me");if(m&&PF_ABA!=="conta")cs123PoeNum(m,S.uid);if(PF_ABA==="conta")cs123Conta9()}}catch(e){}
  /* [124] Atividade e Notificações no menu */
  try{if(S.uid&&S.membro){
      const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-nt124ativ]"))m.insertAdjacentHTML("afterbegin",`<button type="button" data-nt124ativ><span>Atividade</span><em></em><i>›</i></button>`);
      const cc=[...document.querySelectorAll("#v-me .pf-conta .card.menu")].find(x=>x.querySelector(".cm-h"))||m;
      if(cc&&!cc.querySelector("[data-nt124abrir]")){const h=`<button type="button" data-nt124abrir><span>Notificações</span><i>›</i></button>`;const em=cc.querySelector(".cm-email");if(em)em.insertAdjacentHTML("afterend",h);else cc.insertAdjacentHTML("afterbegin",h)}}
    nt124PintaJa()}catch(e){}
  /* [150] */
  try{sr150Instalar()}catch(e){}
  /* [158] coberturas seguidas (sem conta) */
  try{const v=$("#v-me");if(v&&!(S.uid&&S.membro)&&!v.querySelector("[data-mt158cobs]")){const l=mt158SegLinha();if(l){const g=v.querySelector(".gut")||v;g.insertAdjacentHTML("afterbegin",`<div class="mt158-pfw">${l}</div>`)}}}catch(e){}
  /* [160] conta */
  try{if(S.uid&&S.membro)co160Pf($("#v-me"),S.uid);
    else if(!S.uid){const p=[...document.querySelectorAll("#v-me .card p")].find(p=>/Entre para gostar/.test(p.textContent));if(p)p.textContent="Dá para ler tudo. Entre para curtir, comentar, guardar e conversar. A conta é por convite de quem já usa o Prumo."}}catch(e){}
  /* [161] "Guardadas" vira "Guardados" */
  try{const b=document.querySelector('#v-me .card.menu [data-vgo="saved"] span');if(b&&b.textContent==="Guardadas")b.textContent="Guardados"}catch(e){}
  /* [165] */
  try{if(S.uid&&S.membro){const v=$("#v-me");
      v.querySelectorAll('.pf-bts [data-criarde="post"]').forEach(b=>b.remove());
      if(PF_ABA==="conta")pf165Conta();if(PF_ABA==="salvos")pf165Guardados();pf165Abas(v)}}catch(e){console.error(e)}
  /* [181] só seguir */
  try{if(sg181On()){const v=$("#v-me");sg181Pf(v,S.uid);
      if(PF_ABA==="conta"){const c=v.querySelector(".pf-conta");if(c){c.querySelectorAll(".card.amg,.cs123-cfg").forEach(x=>x.remove());
        c.querySelectorAll(".card.menu button, .card.menu a").forEach(b=>{if(/^\s*Melhores amigos/.test(b.textContent))b.remove()})}}
      else{const corpo=v.querySelector(".pf-corpo");if(corpo&&!corpo.querySelector(".sg181-ped")){const h=sg181PedHTML();if(h)corpo.insertAdjacentHTML("afterbegin",h)}}}}catch(e){console.error(e)}
}
/* miolo da aba Perfil: o 012 e os acabamentos do 083, 084, 086 e 090 */
function renderMeMiolo(){
  /* [012] */
  const v=$("#v-me"),u=S.uid,ok=!!(u&&S.db&&S.membro);
  const likes=ok?Object.values(curtidasDe(u)).filter(Boolean).length:0,cms=todosComentarios().filter(c=>c.uid===u).length,env=S.msgsOut.filter(m=>m.pid&&!m.resp&&m.tipo!=="cutucada").length,na=amigosL().length;
  const er=(S.erros||[]).slice(0,5).map(e=>({...e,...(S.errosResp[e.id]||{})}));
  const stE=e=>e.status==="corrigido"?"Corrigido":e.status==="mantido"?"Conferido, sem erro":e.status==="em_analise"?"Em análise":"Aguardando conferência";
  v.innerHTML=`<div class="gut">${ok?`<div class="me-head">${avatar(u)}<div><b>${esc(nomeDe(u))}</b><span>${na?na+" "+(na===1?"amigo":"amigos"):"Nenhum amigo ainda"}</span></div></div>
    <div class="stats"><button type="button" data-minha="gostei"><b>${likes}</b><span>curtidas</span></button><button type="button" data-minha="cmt"><b>${cms}</b><span>${cms===1?"comentário":"comentários"}</span></button><button type="button" data-minha="env"><b>${env}</b><span>${env===1?"enviada":"enviadas"}</span></button></div>`:`<div class="view-h"><h1>Perfil</h1></div>`}
    <div style="display:flex;flex-direction:column;gap:12px;padding-bottom:24px">
    ${!u?`<div class="card"><b>Você está só lendo</b><p>Dá para ler tudo. Entre para curtir, comentar, guardar e conversar com os seus amigos.</p><div class="lbtns"><button type="button" class="btn" data-entrar>Entrar</button><button type="button" class="btn ghost" data-entrar="criar">Criar conta</button></div></div>`:(!INIT_FIM&&!S.membro)?`<div class="card"><b>Conectando à sua conta…</b><p>Só um instante. Se demorar, confira a internet.</p></div>`:S.suspenso?`<div class="card"><b>Conta suspensa</b><p>Dá para ler as notícias, mas não para curtir, comentar ou conversar. Fale com o Pedro.</p><button type="button" class="btn ghost" data-sair>Sair</button></div>`:!S.membro?`<div class="card"><b>Falta só o convite</b><p>Você entrou como ${esc(S.email)}, mas ainda precisa de um convite para participar.</p><button type="button" class="btn" data-entrar>Usar um convite</button></div>`:amigosCardHTML()}
    <div class="card menu"><button type="button" data-vgo="saved"><span>Guardadas</span><em>${Object.values(S.salvos||{}).filter(Boolean).length||""}</em><i>›</i></button><button type="button" data-vgo="play"><span>Quiz e enquetes</span><i>›</i></button></div>
    <div class="card menu"><button type="button" data-ajustes><span>Ajustes do app</span><i>›</i></button><button type="button" data-historico><span>Histórico de leitura</span><em>${Object.keys(HIST).length}</em><i>›</i></button><button type="button" data-rodadas><span>Atualizações do Prumo</span><em class="${estadoRadar().ok?"":"bad"}">${esc(estadoRadar().ok?(FEED?"edição "+horaEdicaoTxt():""):"atrasado")}</em><i>›</i></button></div>
    ${S.membro&&S.membros[u]?.papel==="admin"?`<div class="card menu"><button type="button" data-admin><span>Administração</span><i>›</i></button></div>`:""}
    ${relatorioHTML()}
    ${er.length?`<div class="card"><b>Erros que eu apontei</b><ul class="secpref">${er.map(e=>`<li style="flex-direction:column;align-items:flex-start;gap:2px"><b style="font-size:14.5px">${esc(e.titulo||"")}</b><span class="hint">“${esc(e.texto)}” · ${stE(e)}${e.resposta?" · "+esc(e.resposta):""}</span></li>`).join("")}</ul></div>`:""}
    ${u?contaCardHTML():`<div class="card menu"><button type="button" data-privacidade><span>Política de privacidade</span><i>›</i></button></div>`}
    <details class="card dt"><summary><b>Usar como app no celular</b></summary><p>No iPhone: abra no Safari, toque em Compartilhar e em “Adicionar à Tela de Início”.</p><p>No Android: abra no Chrome, toque nos três pontos e em “Adicionar à tela inicial”.</p></details>
    <details class="card dt"><summary><b>Como o Prumo funciona</b></summary><p>Várias vezes ao dia (a edição completa às 6h52 e atualizações de 2 em 2 horas até as 21h48), o Prumo lê as matérias de vários veículos, junta as que tratam do mesmo fato e escreve um resumo próprio. Antes de publicar, uma checagem automática procura números sem fonte, links quebrados e notícias repetidas.</p></details>
    </div></div>`;
  const ab=$("#ajbox");if(ab)ab.innerHTML=ajustesHTML();

  /* [083] perfil em grade (cabeçalho, abas e posts); o resto vai para a aba Conta */
  p083:{try{if(!(S.uid&&S.db&&S.membro)||PUB.on===false)break p083;const v=$("#v-me"),gut=v&&v.querySelector(".gut"),head=gut&&gut.querySelector(".me-head");if(!head)break p083;
    const resto=document.createElement("div");resto.className="pf-conta";[...gut.children].forEach(c=>{if(c!==head)resto.appendChild(c)});
    gut.innerHTML=`<div class="pf-me">${pfCab(S.uid)}${pfAbas(S.uid,PF_ABA)}<div class="pf-corpo"></div></div>`;const corpo=gut.querySelector(".pf-corpo");
    if(PF_ABA==="conta")corpo.appendChild(resto);else{const pin=(S.pedidosIn||[]).filter(x=>S.membros[x]);/* 18/11 noite: o pedido de amizade aparece só na aba Posts (antes repetia em todas as abas) */corpo.innerHTML=(pin.length&&(PF_ABA==="posts"||!PF_ABA)&&!(typeof VN112_PF!=="undefined"&&VN112_PF.me&&VN112_PF.me!=="posts")?`<div class="card amg pf-ped"><span class="amg-t">${pin.length===1?"Pedido de amizade":"Pedidos de amizade"}</span><ul class="amgl">${pin.map(x=>`<li>${avatar(x)}<span class="amg-n"><b>${esc(nomeDe(x))}</b></span><button type="button" class="btn amg-b" data-aceitar="${esc(x)}">Aceitar</button><button type="button" class="btn ghost amg-b" data-recusar="${esc(x)}">Recusar</button></li>`).join("")}</ul></div>`:"")+pfTiles(pfLista(S.uid,PF_ABA),PF_ABA,S.uid)}}catch(e){}}
  /* [084] arquivo de giros */
  try{if(V5.on){const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-arquivo]"))m.insertAdjacentHTML("afterbegin",`<button type="button" data-arquivo><span>Arquivo de giros</span><i>›</i></button>`)}}catch(e){}
  /* [086] sua semana */
  try{const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-semana]")&&semDados().l.length)m.insertAdjacentHTML("afterbegin",`<button type="button" data-semana><span>Sua semana no Prumo</span><em>${semDados().l.length}</em><i>›</i></button>`)}catch(e){}
  /* [090] como usar */
  try{const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-tourver]"))m.insertAdjacentHTML("beforeend",`<button type="button" data-tourver><span>Como usar o Prumo</span><i>›</i></button>`)}catch(e){}
}
