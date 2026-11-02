/* ---------- Etapa 72: post no story, "Sua semana", reações de story na Atividade ---------- */
ED_VIVOS.push("pub");PUB_TIPOS_IT.push("pub");
function pubFigHTML(e,vivo){const x=pubDe(e.ref),au=e.au||(x&&x.autor)||"";
  if(!x)return `<div class="fg-pub fg-pub0"><span class="fg-pa">${au?avatar(au):""}<b>${esc(au?nomeDe(au):"Post")}</b></span><p>Post de ${esc(au?String(nomeDe(au)).split(" ")[0]:"um amigo")}. Só os amigos de quem publicou conseguem abrir.</p></div>`;
  const f=x.fotos[0]&&pubUrl(x.fotos[0]);
  return `<${vivo?`button type="button" data-uspub="${esc(x.id)}"`:"div"} class="fg-pub"><span class="fg-pa">${avatar(x.autor)}<b>${esc(nomeDe(x.autor))}</b></span>${f?`<img src="${pubSrc(f)}" alt="">`:`<span class="fg-ptx" style="background:${pubFundo(x.estilo&&x.estilo.fundo)}">${esc(String(x.texto||"").slice(0,80))}</span>`}${x.texto&&f?`<small>${esc(String(x.texto).slice(0,70))}</small>`:""}${vivo?`<i>Ver post ›</i>`:""}</${vivo?"button":"div"}>`}
{const _fh72=edFigHTML;edFigHTML=function(e,vivo){if(e&&e.t==="pub")return pubFigHTML(e,vivo);return _fh72.apply(this,arguments)}}
{const _ie72=edItemExtra;edItemExtra=(e,o)=>{o=_ie72(e,o);if(e.t==="pub"){o.ref=String(e.ref||"");o.au=String(e.au||"")}return o}}
function compStory(id){const x=pubDe(id);if(!x)return;if($("#layer").innerHTML)closeLayer();uso("post_no_story");
  setTimeout(()=>{criarAbrir("story");let n=0;(function w(){if(ED&&ED.modo==="story"&&$("#layer .ce")){ED.st.bg={tipo:"grad",g:Math.floor(Math.random()*PUB_FUNDOS.length)};ED.tela="edit";edAdd({t:"pub",ref:id,au:x.autor,y:.47,s:1});return}if(n++<60)setTimeout(w,50)})()},60)}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  const b=t.closest("[data-upstory]");if(b){e.stopPropagation();compStory(b.dataset.upstory);return}
  const v=t.closest("#layer .story [data-uspub]");if(v){e.stopPropagation();e.preventDefault();const id=v.dataset.uspub;closeLayer();setTimeout(()=>pubIrPara(id),280);return}
  const sm=t.closest("[data-semana]");if(sm){e.stopPropagation();e.preventDefault();if(sm.closest(".pfv,.sheet")&&$("#layer").innerHTML&&!$("#layer .story"))closeLayer();setTimeout(semAbrir,sm.closest("#secs")?0:260);return}},true);
/* Atividade: curtidas e respostas nos meus stories, e amigos que puseram meu post no story */
{const _ai72=atItens;atItens=function(){const it=_ai72.apply(this,arguments);if(!S.uid||!S.membro)return it;const agora=Date.now();
  try{(S.msgsIn||[]).filter(m=>(m.tipo==="curtiu_story"||m.tipo==="resp_story")&&+m.at>agora-30*864e5).forEach(m=>{const st=(m.snap&&m.snap.story)||{};
      it.push({k:"s:"+m.id,at:+m.at,us:[m.de],ic:m.tipo==="curtiu_story"?"♥":"💬",txt:`<b>${esc(nomeDe(m.de))}</b> ${m.tipo==="curtiu_story"?"curtiu seu story":"respondeu ao seu story: “"+esc(String(m.texto||"").slice(0,80))+"”"}${m.tipo==="curtiu_story"&&st.t?` · “${esc(String(st.t).slice(0,50))}”`:""}`,msg:m,acao:"conv"})});
    (PUB.itens||[]).filter(x=>x.tipo==="story"&&x.autor!==S.uid&&x.estilo&&Array.isArray(x.estilo.itens)).forEach(x=>{const f=x.estilo.itens.find(e=>e&&e.t==="pub"&&(e.au===S.uid||(AT.pubs[e.ref]&&1)));if(!f)return;
      it.push({k:"sh:"+x.id,at:+x.at,us:[x.autor],ic:"↗",txt:`<b>${esc(nomeDe(x.autor))}</b> compartilhou seu post no story`,story:x,pub:f.ref,acao:"vstory"})})}catch(e){}
  return it.sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}}
{const _aa72=atAcao;atAcao=function(x){if(x.acao==="conv"){if($("#layer .pfv-at"))closeLayer();setTimeout(()=>abrirConversa(x.msg.de),320);return}
  if(x.acao==="vstory"){stLista([x.story],0,nomeDe(x.story.autor),"sh"+x.story.id);return}return _aa72.apply(this,arguments)}}
{const _th72=atThumb;atThumb=function(x){if(x.acao==="vstory"){const pb=AT.pubs[x.pub];if(pb)return _th72({...x,pub:x.pub})}return _th72.apply(this,arguments)}}
/* ===== Sua semana: story com o resumo dos últimos 7 dias ===== */
function semDados(){const agora=Date.now(),de=agora-7*864e5;
  const l=Object.entries(HIST||{}).map(([pid,h])=>({pid,...h,ts:tms(h&&h.t)})).filter(h=>h.ts>de).sort((a,b)=>b.ts-a.ts);
  const dias=new Set(l.map(h=>_FDSP.format(new Date(h.ts)))).size;const tem={};
  l.forEach(h=>{const k=h.tema||h.tag||secNome(h.secao||"politica");if(!k)return;(tem[k]=tem[k]||{n:0,sec:h.secao||"politica"}).n++});
  const temas=Object.entries(tem).sort((a,b)=>b[1].n-a[1].n).slice(0,4);
  let cm=0;Object.values(S.cmts||{}).forEach(a=>(a||[]).forEach(c=>{if(c.uid===S.uid&&+c.at>de)cm++}));
  const enq=FEED&&S.uid?(FEED.pautas||[]).filter(p=>p.enquete&&meuVoto(p.id)!=null).length:0;
  const comp={};if(S.uid)l.forEach(h=>{try{leram(h.pid).forEach(u=>{if(u!==S.uid&&S.amigos.has(u))comp[u]=(comp[u]||0)+1})}catch(e){}});
  const amg=Object.entries(comp).sort((a,b)=>b[1]-a[1]).slice(0,3);const seg=Object.values(PREF.seguindo||{}).slice(0,5);
  return {l,dias,temas,cm,enq,amg,seg,de}}
function semChave(){const d=new Date();const sp=new Date(_FDSP.format(d)+"T12:00:00Z");const dw=sp.getUTCDay();sp.setUTCDate(sp.getUTCDate()-((dw+1)%7));return sp.toISOString().slice(0,10)}
function semMostra(){if(!FEED)return false;let dia;try{dia=new Date().toLocaleDateString("en-US",{weekday:"short",timeZone:"America/Sao_Paulo"})}catch(e){dia=""}
  return (window.SEM_SEMPRE||["Fri","Sat","Sun","Mon"].includes(dia))&&semDados().l.length>=3}
function semFrames(){const d=semDados();const fr=[{id:"w0",tipo:"capa",d}];if(d.temas.length)fr.push({id:"w1",tipo:"temas",d});if(d.l.length)fr.push({id:"w2",tipo:"lidas",d});
  if(d.cm||d.enq||d.amg.length)fr.push({id:"w3",tipo:"amigos",d});fr.push({id:"w4",tipo:"fim",d});return fr}
{const _il72=igLista;igLista=function(sec){if(sec==="_sem"){const fr=semFrames();return {ps:fr,itens:fr}}return _il72.apply(this,arguments)}}
{const _sp72=stPs;stPs=function(){if(ST&&ST.sec==="_sem")return ST.itens||[];return _sp72.apply(this,arguments)}}
{const _so72=storyOrdem;storyOrdem=function(){if(ST&&ST.sec==="_sem")return ["_sem"];return _so72.apply(this,arguments)}}
{const _no72=igNomeSt;igNomeSt=function(sec){if(sec==="_sem")return "Sua semana";return _no72.apply(this,arguments)}}
function semAbrir(){const fr=semFrames();if(!fr.length)return;uso("sua_semana");if($("#layer").innerHTML&&!$("#layer .story"))closeLayer();ST={sec:"_sem",ids:fr.map(f=>f.id),itens:fr,i:0,ordem:[]};drawStory()}
function semFmt(ts){return new Date(ts).toLocaleDateString("pt-BR",{day:"numeric",month:"short",timeZone:"America/Sao_Paulo"}).replace(".","")}
function semCorpo(fr){const d=fr.d;
  if(fr.tipo==="capa")return `<span class="sg-k">${esc(semFmt(d.de))} – ${esc(semFmt(Date.now()))}</span><h2 class="sem-h">Sua semana no Prumo</h2><div class="sem-big"><b>${d.l.length}</b><span>${d.l.length===1?"notícia lida":"notícias lidas"}${d.dias>1?` em ${d.dias} dias`:""}</span></div><p class="sgd-sub">Um resumo só seu. Toque para seguir.</p>`;
  if(fr.tipo==="temas"){const mx=d.temas[0][1].n||1;return `<span class="sg-k">O que você mais acompanhou</span><div class="sem-bars">${d.temas.map(([t,o],k)=>`<div style="--k:${k};--w:${Math.max(8,o.n/mx*100).toFixed(0)}%;--c:${secCor(o.sec)}"><span>${esc(t)}</span><p><i></i><b>${o.n}</b></p></div>`).join("")}</div>`}
  if(fr.tipo==="lidas")return `<span class="sg-k">Algumas que você leu</span><ul class="sem-l">${d.l.slice(0,4).map((h,k)=>`<li style="--k:${k}"><small style="color:${secCor(h.secao||"politica")}">${esc(secNome(h.secao||"politica"))}</small><b>${esc(h.titulo||"")}</b></li>`).join("")}</ul>`;
  if(fr.tipo==="amigos")return `<span class="sg-k">Com os seus amigos</span><div class="sem-num">${d.cm?`<div><b>${d.cm}</b><span>${d.cm===1?"comentário seu":"comentários seus"}</span></div>`:""}${d.enq?`<div><b>${d.enq}</b><span>${d.enq===1?"enquete votada":"enquetes votadas"}</span></div>`:""}</div>${d.amg.length?`<ul class="sem-am">${d.amg.map(([u,n])=>`<li>${avatar(u)}<span><b>${esc(nomeDe(u))}</b> leu ${n} ${n===1?"notícia":"notícias"} que você também leu</span></li>`).join("")}</ul>`:""}`;
  return `<span class="sg-k">Na semana que vem</span><h2 class="sem-h">${d.seg.length?"Você segue estas coberturas":"Até domingo que vem"}</h2>${d.seg.length?`<p class="sem-seg">${d.seg.map(t=>`<span>${esc(t)}</span>`).join("")}</p><p class="sgd-sub">Quando elas mudarem, o ♥ no topo avisa.</p>`:`<p class="sgd-sub">Siga uma cobertura na página dela para ser avisado quando houver novidade.</p>`}`}
function semDraw(){const fr=ST.itens[ST.i];if(!fr)return closeLayer();const vazioS=!$("#layer").innerHTML;
  if(ST.i===ST.itens.length-1){try{localStorage.setItem("prumo-sem-visto",semChave())}catch(e){}}
  const txt=semCorpo(fr);ST.palavras=12+txt.replace(/<[^>]+>/g," ").split(/\s+/).length/2;
  $("#layer").innerHTML=`<div class="story sg sg-sem" role="dialog" aria-modal="true" aria-label="Sua semana"><div class="story-in">
    <div class="sg-bg"><div class="sem-bg sem-bg${ST.i%3}"></div></div>
    <div class="bars">${ST.itens.map((_,k)=>`<i class="${k<ST.i||(k===ST.i&&!PREF.storyAuto)?"on":""}">${k===ST.i&&PREF.storyAuto?"<b></b>":""}</i>`).join("")}</div>
    <div class="s-h"><span class="ph-av sg-av sem-av">${S.uid?avatar(S.uid):"<i>P</i>"}</span><span class="sg-who"><b>Sua semana</b><span>Só você vê</span></span><span class="s-hb"><button type="button" data-sauto aria-pressed="${!!PREF.storyAuto}" aria-label="${PREF.storyAuto?"Parar de passar sozinho":"Passar sozinho"}">${PREF.storyAuto?'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5z"/></svg>'}</button><button type="button" data-close aria-label="Fechar">${ICON.close}</button></span></div>
    <button type="button" class="tap l" data-sgo="-1" aria-label="Anterior"></button><button type="button" class="tap r" data-sgo="1" aria-label="Próxima"></button>
    <div class="sg-body sem-body">${txt}</div>
    <div class="s-f sg-f" id="s-acts"></div>
  </div></div>`;
  igWire($("#layer .story"));if(vazioS&&pushH())HST++;storyAuto({neutro:{titulo:"",texto:txt.replace(/<[^>]+>/g," ")}});igEntra();renderSecs()}
{const _ds72=drawStory;drawStory=function(){if(ST&&ST.sec==="_sem"){clearTimeout(ST.timer);semDraw();return}return _ds72.apply(this,arguments)}}
{const _rs72=renderSecs;renderSecs=function(){const r=_rs72.apply(this,arguments);try{const box=$("#secs");if(!box||!FEED||box.querySelector("[data-semana]")||!S.uid||!S.membro||!semMostra())return r;
  const n=semDados().l.length;let vis=false;try{vis=localStorage.getItem("prumo-sem-visto")===semChave()}catch(e){}
  const h=igCirc('data-semana',"ig-sem"+(vis?" visto":""),`<span class="ig-semc"><b>${n}</b><small>lidas</small></span>`,"Sua semana","Resumo da sua semana");
  const c5=box.querySelector("[data-5min]");if(c5)c5.insertAdjacentHTML("afterend",h);else box.insertAdjacentHTML("afterbegin",h)}catch(e){}return r}}
{const _rm72=renderMe;renderMe=function(){const r=_rm72.apply(this,arguments);try{const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-semana]")&&semDados().l.length)m.insertAdjacentHTML("afterbegin",`<button type="button" data-semana><span>Sua semana no Prumo</span><em>${semDados().l.length}</em><i>›</i></button>`)}catch(e){}return r}}


