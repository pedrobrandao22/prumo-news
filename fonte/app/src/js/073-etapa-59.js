/* ---------- Etapa 59 ---------- */
/* ilustração do story nunca embaixo do texto */
{const _ic59=igCaber;igCaber=function(){const r=_ic59.apply(this,arguments);try{const b=$("#layer .sg-body"),a=$("#layer .sg-art"),si=$("#layer .story-in");if(b&&a&&si){a.style.height="";a.hidden=false;const sv=a.querySelector("svg");if(sv){const bt=b.getBoundingClientRect().top,ab=sv.getBoundingClientRect().bottom;
  if(ab>bt-10){const h=bt-si.getBoundingClientRect().top-12;if(h<190)a.hidden=true;else a.style.height=h+"px"}}}}catch(e){}return r}}
/* post apagado sai do Feed na hora */
{const _pa59=pubApagar;pubApagar=async function(id){const r=await _pa59.apply(this,arguments);if(r){const el=document.getElementById("p-u:"+id);if(el)el.remove()}return r}}
/* curtidas e comentários em posts de amigos ao vivo */
{const _ra59=rerenderAll;rerenderAll=function(){const r=_ra59.apply(this,arguments);try{document.querySelectorAll("#posts .upost[data-pid]").forEach(a=>updateSocial(a.dataset.pid))}catch(e){}return r}}
/* "Visto por" → tocar na pessoa: fecha o story e abre a conversa */
window.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#layer2 [data-conversa]");if(!b||!$("#layer .story"))return;e.stopPropagation();e.preventDefault();const u=b.dataset.conversa;closeLayer();setTimeout(()=>{if($("#layer .story"))closeLayer();setTimeout(()=>abrirConversa(u),80)},40)},true);
/* abrir um post de amigo pela conversa: voltar retorna à conversa */
{const _pi59=pubIrPara;pubIrPara=function(id){const x=pubDe(id);if(!x||x.tipo==="story"||VIEW==="feed")return _pi59.apply(this,arguments);
  closeLayer();if(FILTRO!=="tudo"){if(FST>0){voltarH(FST);FST=0}FILTRO="tudo";ssSet("radar-filtro",FILTRO)}const origem={view:VIEW,thread:THREAD,y:scrollY,at:Date.now()};go("feed",true);if(pushH())JUMPS.push(origem);renderPosts();
  setTimeout(()=>{const el=document.getElementById("p-u:"+id);if(el)el.scrollIntoView({block:"start",behavior:"smooth"})},120)}}

