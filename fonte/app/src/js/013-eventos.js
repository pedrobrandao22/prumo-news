/* ---------- eventos ---------- */
document.addEventListener("click",e=>{
  const t=e.target;if(t.closest("button,[role=button]")&&!t.closest(".tap,.nav"))vibrar(5);
  const nav=t.closest(".nav button");if(nav){if(nav.dataset.v==="msgs")THREAD=null;go(nav.dataset.v);return}
  if(t.closest("[data-close]")||t.matches("[data-scrim]")){closeLayer();return}
  if(cliqueConta(t))return;
  if(t.closest("#b-busca")){abrirBusca();return}
  if(t.closest("#b-audio")){if(FEED)abrirAudio();return}
  if(t.closest("#b-5min")){if(FEED)abrir5min();return}
  const gl=t.closest("[data-gl]");if(gl){abrirTermo(gl.dataset.gl,gl.dataset.k);return}
  const ex=t.closest("[data-explica]");if(ex){abrirExplicador(ex.dataset.explica);return}
  const vt=t.closest("[data-voto]");if(vt){const pid=vt.closest("[data-pid]")?.dataset.pid;if(pid)votar(pid,+vt.dataset.voto);return}
  if(t.closest("#pilula")){if(NOVO){aplicarNovo(NOVO);window.scrollTo({top:0});vibrar();setTimeout(abrirMudou,80)}return}
  const sf=t.closest("[data-secfiltro]");if(sf){if(FILTRO==="tudo"&&pushH())FST++;FILTRO=sf.dataset.secfiltro;ssSet("radar-filtro",FILTRO);renderSecs();renderPosts();window.scrollTo({top:0,behavior:"smooth"});toast("Mostrando só "+secNome(FILTRO)+". Toque em Ver tudo para voltar.");return}
  const tg=t.closest("[data-tagx]");if(tg){const p=pautaById(tg.closest("[data-pid]")?.dataset.pid);if(p){if((FEED.explicadores||{})[temaDe(p)])abrirExplicador(temaDe(p));else abrirBusca(p.tag||temaDe(p))}return}
  const lm=t.closest("[data-lermais]");if(lm){const sl=lm.closest(".txs");sl.classList.add("aberto");sl.classList.remove("ovf");const tr=sl.closest(".track");if(tr)fitTrack(tr);uso("ler_mais");return}
  const tr=t.closest("[data-tirar]");if(tr){const id=tr.dataset.tirar;closeLayer();toggleSave(id);return}
  const trl=t.closest("[data-tirarl]");if(trl){const id=trl.dataset.tirarl,com=trl.dataset.com;closeLayer();alternarLista(id,com);return}
  if(t.closest("[data-topo]")){window.scrollTo({top:0,behavior:"smooth"});return}
  const li=t.closest("[data-minha]");if(li){abrirMinhaLista(li.dataset.minha);return}
  const nl=t.closest("[data-lista]");if(nl){const id=nl.dataset.lista,com=nl.dataset.com;if(nl.closest(".sheet"))closeLayer();alternarLista(id,com);return}
  const lp=t.closest("[data-listapick]");if(lp){abrirEscolhaLista(lp.dataset.listapick);return}
  const cp=t.closest("[data-compart]");if(cp){const id=cp.dataset.compart;if(cp.closest(".sheet"))closeLayer();compartilhar(id);return}
  const ag2=t.closest("[data-abag]");if(ag2){ABA_G=ag2.dataset.abag;lsSet("prumo-abag",ABA_G);renderSaved();return}
  const rsp=t.closest("[data-resp-msg]");if(rsp){responderMsg(rsp.dataset.respMsg);return}
  const rc=t.closest("[data-reac]");if(rc){reagir(rc.dataset.reac,rc.dataset.k);return}
  if(t.closest("[data-novaconv]")){abrirNovaConversa();return}
  if(t.closest("[data-veramigos]")){abrirTodosAmigos();return}
  const cnp=t.closest("[data-cancelar]");if(cnp){cnp.disabled=true;cancelarPedido(cnp.dataset.cancelar);return}
  if(t.closest("[data-resp-x]")){RESP=null;$("#respbar")?.remove();return}
  const nc=t.closest("[data-nachat]");if(nc){abrirConversa(nc.dataset.nachat);return}
  const tm2=t.closest("[data-tema-ui]");if(tm2){PREF.tema=tm2.dataset.temaUi;aplicarTema();salvarPrefs();refreshAjustes();return}
  const fm=t.closest("[data-fmodo]");if(fm){PREF.feedModo=["recentes","seguindo"].includes(fm.dataset.fmodo)?fm.dataset.fmodo:"voce";salvarPrefs();document.querySelectorAll("[data-fmodo]").forEach(x=>x.setAttribute("aria-selected",String(x===fm)));renderPosts();window.scrollTo(0,0);toast(PREF.feedModo==="recentes"?"Feed em ordem de atualização":PREF.feedModo==="seguindo"?"Só o que você segue":"Feed por importância");return}
  const sv=t.closest("[data-semvidro]");if(sv){PREF.semVidro=!PREF.semVidro;salvarPrefs();window.aplicarVidro&&aplicarVidro();refreshAjustes();return}
  const bv=t.closest("[data-breve]");if(bv){abrirBreve(+bv.dataset.breve);return}
  if(t.closest("[data-rodadas]")){abrirRodadas();return}
  if(t.closest("[data-cinco]")){if(FEED)abrir5min();return}
  const vg=t.closest("[data-vgo]");if(vg){closeLayer();go(vg.dataset.vgo);return}
  if(t.closest("[data-sauto]")){PREF.storyAuto=!PREF.storyAuto;salvarPrefs();drawStory();toast(PREF.storyAuto?"O story passa sozinho. Segure o dedo para pausar.":"O story não passa mais sozinho.");return}
  const au=t.closest("[data-aud]");if(au){audCtrl(au.dataset.aud);return}
  if(t.closest("[data-fecharaviso]")){$("#avisoconta")?.remove();try{sessionStorage.setItem("prumo-aviso","1")}catch(e){}return}
  if(t.closest("[data-agtoggle]")){PREF.agendaFechada=PREF.agendaFechada===false;salvarPrefs();renderChgBox();return}
  if(t.closest("[data-ultimas]")){if(FEED)abrirUltimas();return}
  if(t.closest("[data-agenda]")){PREF.agendaAberta=!PREF.agendaAberta;salvarPrefs();renderChgBox();return}
  if(t.closest("[data-quiz]")){abrirQuiz();return}
  const f5=t.closest("[data-5lidas]");if(f5){f5.dataset["5lidas"].split(",").forEach(marcarLida);closeLayer();renderPosts();toast("Marcadas como lidas");return}
  const ou=t.closest("[data-ouvir]");if(ou){closeLayer();ouvirLista(ou.dataset.ouvir);return}
  const rt=t.closest("[data-rate]");if(rt){const A=PREF.audio||(PREF.audio={rate:1,voz:""});A.rate=Math.max(.7,Math.min(1.6,Math.round((A.rate+0.1*(+rt.dataset.rate))*10)/10));$("#rateval").textContent=A.rate.toFixed(1).replace(".",",")+"×";salvarPrefs();return}
  const hi=t.closest("[data-hist]");if(hi){abrirHist(hi.dataset.hist);return}
  const tm=t.closest("button[data-tema]");if(tm){const k=norm(tm.dataset.tema),tipo=tm.dataset.acao;const m=PREF[tipo]||(PREF[tipo]={});if(m[k])delete m[k];else{m[k]=tm.dataset.tema;const outro=tipo==="seguindo"?"silenciados":"seguindo";if(PREF[outro])delete PREF[outro][k]}salvarPrefs();if(!$("#ajbox"))closeLayer();renderFeed();refreshAjustes();uso(tipo);const tmEl=tm.dataset.tema,tmTipo=tipo;toast(tipo==="seguindo"?(m[k]?"Seguindo "+tm.dataset.tema:"Deixou de seguir"):(m[k]?"Tema silenciado":"Tema voltou ao feed"),tipo==="silenciados"&&m[k]?"Desfazer":"",tipo==="silenciados"&&m[k]?()=>{delete (PREF.silenciados||{})[k];salvarPrefs();renderFeed();refreshAjustes()}:null);return}
  const nt=t.closest("[data-nota]");if(nt){const id=nt.dataset.nota;closeLayer();abrirNota(id);return}
  const er=t.closest("[data-erro]");if(er){const id=er.dataset.erro;closeLayer();abrirErro(id);return}
  if(t.closest("[data-historico]")){abrirHistorico();return}
  if(t.closest("[data-ajustes]")){abrirAjustes();return}
  if(t.closest("[data-auto]")){PREF.autoOff=!PREF.autoOff;salvarPrefs();refreshAjustes();if(FEED)renderPosts();return}
  const ss=t.closest("[data-sec-story]");if(ss){const sec=ss.dataset.secStory;(window.comTransicao||((o,f)=>f()))(ss.querySelector(".ig-r,svg.ring")||ss,()=>openSecStory(sec),".story-in");return}
  const fl=t.closest("[data-filtro]");if(fl){uso("filtro");const ant=FILTRO;if(fl.closest(".sheet"))closeLayer();FILTRO=fl.dataset.filtro;ssSet("radar-filtro",FILTRO);if(FILTRO==="tudo"&&FST>0){voltarH(FST);FST=0}else if(ant==="tudo"&&FILTRO!=="tudo"&&pushH())FST++;if(fl.closest(".sheet"))closeLayer();renderSecs();renderPosts();window.scrollTo({top:0});return}
  if(t.closest("[data-abrirfiltro]")){abrirFiltro();return}
  if(t.closest("[data-novidades]")){abrirNovidades();return}
  const sg=t.closest("[data-sgo]");if(sg){storyGo(+sg.dataset.sgo);return}
  const gt=t.closest("[data-goto]");if(gt){const id=gt.dataset.goto;closeLayer();openSnap(id);return}
  const bu=t.closest("[data-busca]");if(bu){const id=bu.dataset.busca;closeLayer();openSnap(id);return}
  const th=t.closest("[data-thread]");if(th){THREAD=th.dataset.thread;if(pushH()){TST++;TST_AT=Date.now()}renderMsgs();return}
  if(t.closest("[data-back]")){THREAD=null;if(TST>0){TST--;voltarH(1)}renderMsgs();return}
  const op=t.closest("[data-open]");if(op){openSnap(op.dataset.open);return}
  const aj=t.closest("[data-aj]");if(aj){closeLayer();if(aj.dataset.aj==="reset"){delete PREF.ajuste.sec[aj.dataset.k];delete PREF.ajuste.tag[aj.dataset.t];salvarPrefs();renderPosts();toast("Voltou ao padrão")}else ajustar(aj.dataset.aj,aj.dataset.k,+aj.dataset.d);return}
  const a2=t.closest("[data-a2]");if(a2){const id=a2.dataset.pid;closeLayer();openLinks(id);return}
  const ua=t.closest("[data-unaj]");if(ua){delete PREF.ajuste[ua.dataset.unaj][ua.dataset.k];salvarPrefs();renderMe();if(FEED)renderPosts();return}
  const fz=t.closest("[data-fz]");if(fz){uso("letra");let i=FZ.indexOf(PREF.fonte||1);if(i<0)i=1;i=Math.max(0,Math.min(FZ.length-1,i+(+fz.dataset.fz)));PREF.fonte=FZ[i];aplicarFonte();salvarPrefs();renderMe();return}
  const mv=t.closest("[data-mv]");if(mv){const all=ALLSECS().map(s=>s.id);let o=(PREF.ordem2||[]).filter(x=>all.includes(x));all.forEach(x=>{if(!o.includes(x))o.push(x)});const i=o.indexOf(mv.dataset.mv),j=i+(+mv.dataset.d);if(j>=0&&j<o.length){[o[i],o[j]]=[o[j],o[i]]}PREF.ordem2=o;salvarPrefs();renderMe();if(FEED)renderFeed();return}
  const hd=t.closest("[data-hide]");if(hd){const id=hd.dataset.hide;const s=new Set(PREF.ocultas||[]);if(s.has(id))s.delete(id);else{if(SECS().length<=1){toast("Deixe pelo menos uma seção visível.");return}s.add(id)}PREF.ocultas=[...s];salvarPrefs();renderMe();if(FEED)renderFeed();return}
  const a=t.closest("[data-a]");if(!a)return;
  const pid=a.closest("[data-pid]")?.dataset.pid;
  switch(a.dataset.a){
    case "like":toggleLike(pid);break;
    case "cob":abrirCobertura(pid);break;
    case "quem":abrirQuem(pid);break;
    case "cmt":openComments(pid);break;
    case "send":openSend(pid);break;
    case "save":toggleSave(pid);break;
    case "links":openLinks(pid);break;
    case "menu":openMenu(pid);break;
    case "conversar":openSend(pid,a.dataset.to);break;
    case "nome":abrirNome();break;
  }
});
document.addEventListener("dblclick",e=>{const c=e.target.closest(".cover");if(c&&!e.target.closest("button"))duploGostei(c)});


/* ================= v6: recursos adicionais ================= */
const lidaAtual=p=>{const t=LIDAS.get(p.id);if(!t)return false;const u=ultimaAtualizacao(p);return !(u&&tms(u)>tms(t))};
const seguido=p=>!!(PREF.seguindo||{})[norm(temaDe(p))];
const silenciado=p=>!!(PREF.silenciados||{})[norm(temaDe(p))];

