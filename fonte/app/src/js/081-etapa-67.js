/* ---------- Etapa 67 ---------- */
const edTagF=t=>t.f||(ED&&ED.po.fotos[t.i])||null;
function edCapa45(c){const o=document.createElement("canvas");o.width=1080;o.height=1350;o.getContext("2d").drawImage(c,0,(c.height-1350*c.width/1080)/2,c.width,1350*c.width/1080,0,0,1080,1350);return o}
/* menção no comentário de um post de membro: só avisa quem consegue abrir o post */
function pubPodeVer(x){const s=new Set([x.autor]);if(x.autor===S.uid&&x.publico!=="proximos")amigosL().forEach(u=>s.add(u));try{const so=socialOf("u:"+x.id);(so.likes||[]).forEach(u=>s.add(u));(so.cm||[]).forEach(c=>s.add(c.uid))}catch(e){}((x.estilo||{}).marcados||[]).forEach(u=>s.add(u));return s}
{const _am67=avisarMencoes;avisarMencoes=async function(pid,t){if(String(pid||"").indexOf("u:")!==0)return _am67.apply(this,arguments);const x=pubDe(String(pid).slice(2));if(!x||!S.uid||!S.membro)return;const pode=pubPodeVer(x),todos=mencionados(t).filter(u=>u!==S.uid),us=todos.filter(u=>pode.has(u)),fora=todos.filter(u=>!pode.has(u));
  if(us.length){const res=await Promise.all(us.map(u=>dmEnviar(u,{texto:String(t).slice(0,1000),pid,snap:{titulo:(x.estilo&&x.estilo.reel?"Reel":"Post")+" de "+nomeDe(x.autor),upub:x.id},tipo:"mencao"},true)));const ok=us.filter((u,i)=>res[i]);if(ok.length)setTimeout(()=>toast(`${ok.map(nomeDe).join(" e ")} ${ok.length>1?"foram avisados":"foi avisado(a)"} por mensagem`),900)}
  if(fora.length)setTimeout(()=>toast(`${fora.map(u=>String(nomeDe(u)).split(" ")[0]).join(" e ")} não ${fora.length>1?"conseguem":"consegue"} abrir este post, então não ${fora.length>1?"foram avisados":"foi avisado(a)"}.`),1700)}}

/* menção: nome inteiro, não pedaço de outro nome; primeiro nome sozinho vale se for único */
mencionados=function(t){const n=norm(t||"");const am=amigosL().map(u=>[u,norm(nomeDe(u)).trim()]).filter(x=>x[1]).sort((a,b)=>b[1].length-a[1].length);let resto=n;const out=[];
  const re=k=>new RegExp("@"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?![a-z0-9\\u00c0-\\u024f])","i");
  am.forEach(([u,nm])=>{const r=re(nm);if(r.test(resto)){out.push(u);resto=resto.replace(r," ")}});
  const pri={};am.forEach(([u,nm])=>{const p=nm.split(/\s+/)[0];(pri[p]=pri[p]||[]).push(u)});Object.entries(pri).forEach(([p,us])=>{if(us.length===1&&!out.includes(us[0])&&re(p).test(resto)){out.push(us[0]);resto=resto.replace(re(p)," ")}});return out};
/* curtir com dois toques nos posts dos amigos */
(function(){let ult=0,alvo=null;document.addEventListener("pointerup",e=>{const sl=e.target.closest&&e.target.closest("#posts .upost .up-sl,#layer .pfv .upost .up-sl");if(!sl||e.target.closest("button,a,.up-ntc"))return;const now=Date.now();
  if(alvo===sl&&now-ult<320){ult=0;alvo=null;const a=sl.closest(".upost"),pid=a.dataset.pid;if(!socialOf(pid).likes.includes(S.uid))toggleLike(pid);const h=document.createElement("span");h.className="up-heart";h.textContent="♥";sl.appendChild(h);setTimeout(()=>h.remove(),900);return}ult=now;alvo=sl},true)})();
/* abrir um post de amigo que está mais abaixo (ou antigo) */
{const _pi67=pubIrPara;pubIrPara=function(id){const r=_pi67.apply(this,arguments);setTimeout(()=>{{const el=document.getElementById("p-u:"+id);if(el){const r=el.getBoundingClientRect();if(r.top<-40||r.top>innerHeight*.6){if(typeof irPara==="function")irPara(el);else el.scrollIntoView({block:"start"})}return}}const x=pubDe(id);if(!x||x.tipo==="story")return;if(typeof garantirPost==="function"&&garantirPost("u:"+id)){const el=document.getElementById("p-u:"+id);if(el){if(typeof irPara==="function")irPara(el);else el.scrollIntoView({block:"start"})}}else toast("Essa publicação é antiga e já não aparece no Feed.")},260);return r}}
/* post apagado, amizade desfeita: some do Feed na hora */
{const _pr67=pubRedesenha;pubRedesenha=function(){const r=_pr67.apply(this,arguments);try{const ok=new Set(pubVisiveis().map(x=>"u:"+x.id));document.querySelectorAll("#posts .upost[data-pid]").forEach(a=>{if(!ok.has(a.dataset.pid))a.remove()})}catch(e){}return r}}
{const _da67=desfazerAmizade;desfazerAmizade=async function(){const r=await _da67.apply(this,arguments);try{pubRedesenha();setTimeout(pubCarregar,600)}catch(e){}return r}}
/* texto do post só de texto: quebras de linha e tamanho conforme o comprimento */
/* convite aberto por quem já é membro */
setInterval(()=>{if(window.__convFeito||!CONVITE_URL||!S.uid||!S.membro||!S.amigosOk)return;window.__convFeito=1;(async()=>{try{const r=await S.db.rpc("convite_amizade",{p_codigo:CONVITE_URL});const d=r&&r.data!==undefined?r.data:r;if(r&&r.error)throw r.error;
  if(d&&d.ok&&d.usado){}else if(d&&d.ok&&d.ja)toast(`Vocês já se seguem no Prumo.`);else if(d&&d.ok){toast(`Pronto! Agora você segue ${nomeDe(d.amigo)} no Prumo.`);if($("#layer #lform"))closeLayer()}else if(d&&d.motivo==="proprio")toast("Esse é o seu próprio convite. Mande o link para um amigo.");else sheet("Convite",`<p style="margin:0;font-size:15px;line-height:1.5">Não achamos este convite. Confira o link ou peça outro a quem te convidou.</p><div class="row" style="margin-top:14px"><button type="button" class="btn" onclick="closeLayer()">OK</button></div>`);  /* 20/11 (testador): aviso de 2 s, e o texto afirmava "já foi usado ou venceu" */setTimeout(()=>{try{pubCarregar()}catch(e){}},1500)}catch(e){toast("Não deu para usar o convite agora.")}})()},1500);
/* foco preso nas janelas (teclado) */
document.addEventListener("keydown",e=>{if(e.key!=="Tab")return;const L=$("#layer2 .sheet")||$("#layer2 [role=dialog]")||$("#layer .sheet")||$("#layer [role=dialog]");if(!L)return;const fs=[...L.querySelectorAll('button:not([disabled]),[href],input:not([type=hidden]),textarea,select,[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);if(!fs.length)return;
  const a=fs[0],z=fs[fs.length-1];if(!L.contains(document.activeElement)){e.preventDefault();a.focus();return}if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});

/* curtidas ocultas: o cabeçalho também não diz quem curtiu */

/* números das marcas acompanham as fotos */
/* post só de texto muito longo: "Ler tudo" */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".upost [data-uptudo]");if(!b)return;e.stopPropagation();e.preventDefault();const x=pubDe(b.dataset.uptudo);if(!x)return;sheet(nomeDe(x.autor),`<p class="up-tudo">${dmMarcaPub(x.texto)}</p>`)},true);

