/* ---------- 201: núcleo (Fase 3) — as funções que todas as áreas usam, cada uma num lugar só ----------
   Antes, cada uma era definida num arquivo antigo e remendada em vários outros ({const _x=f;f=function(){… _x() …}}).
   Aqui está a versão final de cada uma, com o que a cadeia inteira fazia hoje (nada muda para quem usa). Os comentários
   [NNN] dizem de que arquivo veio cada pedaço; a ordem dos pedaços é a ordem em que rodavam.
   Carregamento: este arquivo vem no fim (antes do 999), quando todas as variáveis já existem. As declarações function são
   içadas, então quem chama estas funções antes daqui já encontra a versão final; quem chama DURANTE o carregamento
   (o 031 abre a Capa com go("capa",true)) usa só a parte que existia naquele ponto, como antes: NUC_PRONTO só vira true
   no 999 (nucPronto()). */
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
        const b=$("#layer [data-cp152x]");if(b&&!b.classList.contains("conf")){b.classList.add("conf");b.textContent="Descartar?";setTimeout(()=>{if(b.isConnected){b.classList.remove("conf");b.innerHTML=EDI.x}},3000)}
        toast("Volte de novo para sair. O texto fica guardado.");feito=true}
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
      L.innerHTML=`<div class="scrim" data-scrim><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div><div class="sh-h">${esc(title)}<button type="button" data-close>Fechar</button></div><div class="sh-b gut">${body}</div>${foot?`<div class="sh-f gut">${foot}</div>`:""}</div></div>`;
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
    else if(/^Não deu para marcar agora/.test(t)&&fd156Offline())t="Sem conexão: o Gostei vai ser enviado quando a internet voltar."}}catch(e){}
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
      <div class="acts"><button type="button" class="act" data-a="like" aria-label="Gostei">${ICON.like}<span>Gostei</span><em class="cnt" data-n="like"></em></button><button type="button" class="act" data-a="cmt" aria-label="Comentar">${ICON.cmt}<span>Comentar</span><em class="cnt" data-n="cmt"></em></button><button type="button" class="act" data-usend="${esc(x.id)}" aria-label="Enviar">${ICON.send}<span>Enviar</span></button><span class="sp"></span>${sl.length>1?`<div class="prog pdots" aria-hidden="true">${sl.map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${sl.length}</span></div>`:""}<button type="button" class="act" data-a="save" hidden aria-hidden="true">${ICON.save}</button></div>
      <div class="likes" data-likes></div>
      ${x.texto&&!soTexto?`<p class="up-leg"><b>${esc(nomeDe(x.autor))}</b> ${dmMarcaPub(x.texto)}</p>`:""}
      <div class="pollbox" data-poll hidden></div><div data-together></div><div data-nchat></div>
      <div class="cmt-area"><div class="cmts" data-cmts></div><button type="button" class="addc" data-a="cmt">Adicione um comentário…</button></div>
    </div></article>`}
