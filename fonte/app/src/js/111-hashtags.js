/* ---------- 111: hashtags (#) em posts, stories, comentários e notícias ----------
   Regras: # + 2 a 30 letras/números/_ (com acento), com pelo menos uma letra; não vale dentro de link nem colada em
   outra palavra; no máximo HT_MAX por texto. A chave ignora maiúsculas, acentos e "_" (#Previdência = #previdencia).
   Seguir hashtag fica em PREF.hashtags (o mesmo documento de preferências do usuário; sem SQL novo). */
var HT_MAX=10,HT_PILHA=[],HT_MAT_VOLTA=null,HT_FECHANDO=false,HT_CLK=0,HT_BOX=null,HT_INP=null;
const HT_CORPO="[\\p{L}\\p{N}_]",HT_ANTES="(^|[^\\p{L}\\p{N}_&#/=?.:@-])";
const HT_LETRA=/\p{L}/u,HT_SO=new RegExp("^"+HT_CORPO+"{2,30}$","u");
const HT_LIGA=new Set(["e","da","de","do","das","dos","a","o","em","no","na","nos","nas","para","por","com"]);
function htRe(){return new RegExp(HT_ANTES+"#("+HT_CORPO+"{2,30})(?!"+HT_CORPO+")","gu")}
function htChave(t){return norm(String(t||"").replace(/^#+/,"")).replace(/[^\p{L}\p{N}]/gu,"")}
function htLimpa(t){const b=String(t||"").trim().replace(/^#+/,"");return HT_SO.test(b)&&HT_LETRA.test(b)?"#"+b:""}
function htExtrai(t){const out=[],ja=new Set(),re=htRe(),s=String(t||"");let m;if(s.indexOf("#")<0)return out;
  while((m=re.exec(s))){const b=m[2];if(!HT_LETRA.test(b))continue;const k=htChave(b);if(!k||ja.has(k))continue;ja.add(k);out.push({tag:"#"+b,k});if(out.length>=HT_MAX)break}return out}
/* ---- notícias: campo hashtags da pauta; sem ele, deriva de tag, tema e subtema ---- */
function htCamel(s){const ws=String(s||"").replace(/[ºª°]/g,"").split(/[^\p{L}\p{N}]+/u).filter(Boolean);if(!ws.length)return "";
  const r=ws.map((w,i)=>i&&HT_LIGA.has(w.toLowerCase())?w.toLowerCase():w.charAt(0).toUpperCase()+w.slice(1)).join("");return htLimpa(r)}
const HT_CACHE=new WeakMap();
function htDaPauta(p){if(!p||typeof p!=="object")return [];if(HT_CACHE.has(p))return HT_CACHE.get(p);const l=[],ja=new Set();
  const add=t=>{const x=htLimpa(t);if(!x)return;const k=htChave(x);if(ja.has(k))return;ja.add(k);l.push(x)};
  if(Array.isArray(p.hashtags)&&p.hashtags.length)p.hashtags.slice(0,6).forEach(add);
  else{add(htCamel(p.tag));add(htCamel(p.tema));if(l.length<2&&p.subtema&&!/^outros/i.test(p.subtema))add(htCamel(p.subtema))}
  const r=l.slice(0,4);HT_CACHE.set(p,r);return r}
function htNotCasa(p,k){if(!p||!k)return 0;if(htDaPauta(p).some(t=>htChave(t)===k))return 3;if([p.tag,p.tema,p.subtema].some(x=>x&&htChave(x)===k))return 2;
  if(k.length<4)return 0;const tt=norm([(p.neutro||{}).titulo||p.titulo,p.tag,p.tema].join(" "));if(tt.split(/[^\p{L}\p{N}]+/u).includes(k))return 1;
  if(k.length>=7&&tt.replace(/[^\p{L}\p{N}]/gu,"").includes(k))return 1;return 0}
function htNoticias(k){return (FEED&&FEED.pautas||[]).map(p=>[p,htNotCasa(p,k)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]||(b[0].prioridade||0)-(a[0].prioridade||0)).map(x=>x[0])}
function htDormentes(k){return (Array.isArray(FEED&&FEED.dormentes)?FEED.dormentes:[]).filter(d=>d&&d.id&&!pautaById(d.id)&&htNotCasa(d,k)>0).slice(0,8)}
/* ---- posts, stories e comentários que eu posso ver ---- */
function htPubs(){try{return pubVisiveis().filter(x=>x&&x.texto)}catch(e){return []}}
function htCmts(){const out=[],pids=new Set(Object.keys(S.cmts||{}));try{if(typeof PS!=="undefined"&&PS.on)Object.keys(PS.cm||{}).forEach(id=>pids.add("u:"+id))}catch(e){}
  pids.forEach(pid=>{let cm=[];try{cm=socialOf(pid).cm||[]}catch(e){}cm.forEach(c=>{if(c&&typeof c.texto==="string"&&c.texto.indexOf("#")>=0)out.push({...c,pid})})});return out}
function htIndice(){const M=new Map(),now=Date.now();const pega=(k,tag)=>{let o=M.get(k);if(!o){o={k,tag,not:0,pos:0,cm:0,amg:0,eu:0,euAt:0,amgAt:0,alta:0,quem:new Set(),formas:{}};M.set(k,o)}return o};
  (FEED&&FEED.pautas||[]).forEach(p=>htDaPauta(p).forEach(t=>{const o=pega(htChave(t),t);o.not++;if(!o.oficial)o.oficial=t}));
  const usa=(tx,u,at,campo)=>htExtrai(tx).forEach(({tag,k})=>{const o=pega(k,tag);o[campo]++;o.formas[tag]=(o.formas[tag]||0)+1;at=+at||0;
    if(u===S.uid){o.eu++;o.euAt=Math.max(o.euAt,at)}else{o.amg++;o.amgAt=Math.max(o.amgAt,at);if(now-at<48*3600e3){o.alta++;o.quem.add(u)}}});
  htPubs().forEach(x=>usa(x.texto,x.autor,x.at,"pos"));htCmts().forEach(c=>usa(c.texto,c.uid,c.at,"cm"));
  M.forEach(o=>{o.tag=o.oficial||(Object.entries(o.formas).sort((a,b)=>b[1]-a[1])[0]||[o.tag])[0]});return M}
function htPostsCom(k){return htPubs().filter(x=>htExtrai(x.texto).some(t=>t.k===k)).sort((a,b)=>(+b.at||0)-(+a.at||0))}
function htCmtsCom(k){return htCmts().filter(c=>htExtrai(c.texto).some(t=>t.k===k)).sort((a,b)=>(+b.at||0)-(+a.at||0)).slice(0,20)}
function htEmAlta(){return [...htIndice().values()].filter(o=>o.alta>0).sort((a,b)=>b.alta-a.alta||b.quem.size-a.quem.size||b.amgAt-a.amgAt).slice(0,5)}
/* ---- seguir ---- */
function htSeguidas(){const m=PREF.hashtags;return m&&typeof m==="object"&&!Array.isArray(m)?m:{}}
function htSegue(t,on){const x=htLimpa(t);if(!x)return;const k=htChave(x);if(!PREF.hashtags||typeof PREF.hashtags!=="object"||Array.isArray(PREF.hashtags))PREF.hashtags={};
  if(on)PREF.hashtags[k]=x;else delete PREF.hashtags[k];salvarPrefs();uso(on?"seguir_hashtag":"deixar_hashtag")}
function htSeguidaDe(p){const sg=htSeguidas();for(const k of Object.keys(sg))if(htNotCasa(p,k)>=2)return sg[k];return null}
function htSeguidaDePost(x){const sg=htSeguidas();const l=htExtrai(x&&x.texto);for(const t of l)if(sg[t.k])return sg[t.k];return null}
/* ---- # vira toque nos textos dos membros (feito no DOM: o texto nunca vira HTML) ---- */
const HT_ALVO=".up-leg,.up-tx,.us-tx,.up-tudo,.cn102-ex,.clist li,.cmt,.fc107-tq~p,.ht-cm-tx";
const HT_FEITO=new WeakSet();
function htLinka(el){if(!el||!el.isConnected||(el.closest&&el.closest("textarea,input,[contenteditable]")))return;
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>{if(HT_FEITO.has(n)||n.nodeValue.indexOf("#")<0)return NodeFilter.FILTER_REJECT;const p=n.parentElement;
    return !p||p.closest("a,button,textarea,input,script,style,svg,.ht-a,[contenteditable]")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
  const ns=[];let n;while((n=w.nextNode()))ns.push(n);let cont=+(el.dataset.htn||0);
  ns.forEach(t=>{const s=t.nodeValue,re=htRe(),fr=document.createDocumentFragment();let m,last=0,mud=false;
    while((m=re.exec(s))){const b=m[2];if(!HT_LETRA.test(b))continue;if(cont>=HT_MAX)break;const ini=m.index+m[1].length;
      if(ini>last)fr.appendChild(document.createTextNode(s.slice(last,ini)));const a=document.createElement("button");a.type="button";a.className="ht-a";a.dataset.ht="#"+b;a.textContent="#"+b;fr.appendChild(a);last=ini+1+b.length;cont++;mud=true}
    if(!mud){HT_FEITO.add(t);return}if(last<s.length)fr.appendChild(document.createTextNode(s.slice(last)));fr.childNodes.forEach(c=>{if(c.nodeType===3)HT_FEITO.add(c)});t.parentNode.replaceChild(fr,t)});
  el.dataset.htn=cont}
const HT_FILA=new Set();let HT_AGEND=false;
function htVarre(){HT_AGEND=false;const l=[...HT_FILA];HT_FILA.clear();l.forEach(n=>{try{if(!n.isConnected)return;if(n.nodeType===3){const c=n.parentElement&&n.parentElement.closest(HT_ALVO);if(c)htLinka(c);return}
  const c=n.closest(HT_ALVO);if(c){htLinka(c);return}if((n.textContent||"").indexOf("#")>=0)n.querySelectorAll(HT_ALVO).forEach(htLinka)}catch(e){}})}
try{new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1?!n.classList.contains("ht-a"):(n.nodeType===3&&!HT_FEITO.has(n)&&n.nodeValue.indexOf("#")>=0))HT_FILA.add(n)}));
  if(HT_FILA.size&&!HT_AGEND){HT_AGEND=true;Promise.resolve().then(htVarre)}}).observe(document.body,{childList:true,subtree:true});document.querySelectorAll(HT_ALVO).forEach(htLinka)}catch(e){}
/* ---- sugestões ao digitar # (no mesmo lugar das sugestões de @) ---- */
function htFecha(){if(HT_BOX)HT_BOX.remove();HT_BOX=null;HT_INP=null}
function htToken(i){const v=String(i.value||"").slice(0,i.selectionStart??String(i.value||"").length);const m=v.match(new RegExp(HT_ANTES+"#("+HT_CORPO+"{0,30})$","u"));return m?{q:m[2],ini:v.length-m[2].length-1}:null}
function htSugestoes(q){const n=htChave(q),I=htIndice(),out=[],ja=new Set();const add=(o,d)=>{if(ja.has(o.k)||(n&&!o.k.startsWith(n)))return;ja.add(o.k);out.push({tag:o.tag,d})};
  (typeof ordenadas==="function"?ordenadas(FEED&&FEED.pautas||[]):(FEED&&FEED.pautas||[])).forEach(p=>htDaPauta(p).forEach(t=>{const o=I.get(htChave(t));if(o)add(o,"Nas notícias")}));
  [...I.values()].filter(o=>o.amg>0).sort((a,b)=>b.amg-a.amg||b.amgAt-a.amgAt).forEach(o=>add(o,"Amigos usam"));
  [...I.values()].filter(o=>o.eu>0).sort((a,b)=>b.euAt-a.euAt).forEach(o=>add(o,"Você usou"));return out.slice(0,6)}
function htSugere(i){const tk=htToken(i);if(!tk){if(HT_INP===i||!i)htFecha();return}const l=htSugestoes(tk.q);if(!l.length){htFecha();return}try{menFecha()}catch(e){}
  if(!HT_BOX){HT_BOX=document.createElement("div");HT_BOX.className="men-box ht-box";HT_BOX.setAttribute("role","listbox");HT_BOX.setAttribute("aria-label","Hashtags");document.body.appendChild(HT_BOX)}HT_INP=i;
  HT_BOX.innerHTML=l.map(s=>`<button type="button" role="option" data-htsug="${esc(s.tag)}"><b>${esc(s.tag)}</b><small>${esc(s.d)}</small></button>`).join("");
  const r=i.getBoundingClientRect();HT_BOX.style.left=Math.max(8,r.left)+"px";HT_BOX.style.width=Math.min(innerWidth-16,Math.max(220,r.width))+"px";HT_BOX.style.top="";HT_BOX.style.bottom=(innerHeight-r.top+6)+"px";
  const b=HT_BOX.getBoundingClientRect();if(b.top<8){HT_BOX.style.bottom="auto";HT_BOX.style.top=(r.bottom+6)+"px"}}
{const _ms111=menSugere;menSugere=function(i){const r=_ms111.apply(this,arguments);try{htSugere(i)}catch(e){}return r}}
document.addEventListener("pointerdown",e=>{const b=e.target.closest&&e.target.closest(".ht-box [data-htsug]");if(!b||!HT_INP)return;e.preventDefault();const i=HT_INP,tk=htToken(i);if(!tk)return;
  const tag=b.dataset.htsug,pos=i.selectionStart??i.value.length;i.value=i.value.slice(0,tk.ini)+tag+" "+i.value.slice(pos);const np=tk.ini+tag.length+1;try{i.setSelectionRange(np,np)}catch(_){}
  htFecha();i.dispatchEvent(new Event("input",{bubbles:true}));htFecha();i.focus()},true);
document.addEventListener("focusout",e=>{if(e.target===HT_INP)setTimeout(()=>{if(document.activeElement!==HT_INP)htFecha()},150)});
document.addEventListener("submit",()=>htFecha(),true);
/* ---- página da hashtag ---- */
function htOrigem(){const o={};const pg=$("#layer .pfv-ht");if(pg)o.ht=pg.dataset.tag;if($("#layer .mat")&&MAT_PID){o.mat=MAT_PID;o.matVolta=HT_MAT_VOLTA}
  if($("#cform")&&typeof CMT_PID!=="undefined"&&CMT_PID)o.cmt=CMT_PID;return o.ht||o.mat||o.cmt?o:null}
function htRestaura(o){if(!o)return;if(o.ht)abrirHashtag(o.ht,{reabre:true});else if(o.mat&&pautaById(o.mat)){HT_MAT_VOLTA=o.matVolta||null;abrirMateria(o.mat)}if(o.cmt)openComments(o.cmt)}
function abrirHashtag(t,op){op=op||{};const tag=htLimpa(t);if(!tag){toast("Hashtag inválida.");return}const k=htChave(tag);
  const cur=$("#layer .pfv-ht");if(cur&&cur.dataset.k===k){if($("#layer2")?.innerHTML)closeLayer();return}
  uso("hashtag");if(!op.reabre)HT_PILHA.push(htOrigem());
  HT_FECHANDO=true;try{let g=0;while(($("#layer2")?.innerHTML||$("#layer").innerHTML)&&g++<4)closeLayer()}finally{HT_FECHANDO=false}
  htFecha();try{menFecha()}catch(e){}
  $("#layer").innerHTML=`<div class="pfv pfv-ht" role="dialog" aria-modal="true" aria-label="${esc(tag)}" data-k="${esc(k)}" data-tag="${esc(tag)}"></div>`;if(pushH())HST++;htDesenha()}
const htPl=(n,um,muitos)=>n+" "+(n===1?um:muitos);
function htSegBtn(tag,k){const on=!!htSeguidas()[k];return `<button type="button" class="ht-seg${on?" on":""}" data-htseg="${esc(tag)}" aria-pressed="${on}">${on?"Seguindo":"Seguir"}</button>`}
function htDesenha(){const el=$("#layer .pfv-ht");if(!el)return;const k=el.dataset.k,I=htIndice(),tag=(I.get(k)||{}).tag||el.dataset.tag;
  const nots=htNoticias(k),dors=htDormentes(k),posts=htPostsCom(k),cms=htCmtsCom(k);
  const sub=[nots.length+dors.length?htPl(nots.length+dors.length,"notícia","notícias"):"",posts.length?htPl(posts.length,"post","posts"):"",cms.length?htPl(cms.length,"comentário","comentários"):""].filter(Boolean).join(" · ")||"Nada com esta hashtag ainda";
  const nt=p=>`<li><button type="button" data-htnot="${esc(p.id)}"><span class="as-t">${typeof cobStatus==="function"?cobStatus(p):""}<b>${esc(versao(p,lente()).titulo)}</b></span><small><i class="secdot" style="background:${secCor(secOf(p))}"></i>${esc(secNome(secOf(p)))} · ${esc(quando(ultimaAtualizacao(p)||p.hora))}${htDaPauta(p).length?" · "+esc(htDaPauta(p).join(" ")):""}</small></button></li>`;
  const dr=d=>`<li><button type="button" data-htdorm="${esc(d.id)}"><span class="as-t"><b>${esc(d.titulo)}</b></span><small>${esc(secNome(d.secao||"politica"))} · cobertura anterior${d.ultima?" · "+esc(quando(d.ultima)):""}</small></button></li>`;
  const onde=c=>{const pid=String(c.pid||"");if(pid.indexOf("u:")===0){const x=pubDe(pid.slice(2));return x?"no post de "+(x.autor===S.uid?"você":nomeDe(x.autor)):"num post"}const p=pautaById(pid)||(typeof snapById==="function"?snapById(pid):null);return p?"em "+((p.neutro||{}).titulo||p.titulo||"notícia"):"numa notícia"};
  const cm=c=>`<li>${avatar(c.uid)}<div><p><b>${esc(c.uid===S.uid?"Você":nomeDe(c.uid))}</b> <span class="ht-cm-tx">${esc(c.texto)}</span></p><button type="button" class="ht-cm-em" data-htcm="${esc(c.pid)}">${esc(onde(c))} · ${esc(quando(c.at))}</button></div></li>`;
  el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-htvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>${esc(tag)}<small>${esc(sub)}</small></b><span class="sp"></span>${htSegBtn(tag,k)}</div>
  <div class="pfv-sc ht-pg">
    <h4 class="as-h">Notícias do Prumo</h4>${nots.length||dors.length?`<ul class="as-l ht-nots">${nots.map(nt).join("")}${dors.map(dr).join("")}</ul>`:`<p class="hint ht-vazio">Nenhuma notícia com ${esc(tag)} nesta edição.</p>`}
    <h4 class="as-h">Posts dos amigos</h4>${posts.length?`<div class="ht-posts" id="ht-posts">${posts.map(x=>{try{return pubPostHTML(x)}catch(e){return ""}}).join("")}</div>`:`<p class="hint ht-vazio">Ninguém postou com ${esc(tag)} ainda. Use a hashtag no seu post para aparecer aqui.</p>`}
    ${cms.length?`<h4 class="as-h">Comentários</h4><ul class="ht-cms">${cms.map(cm).join("")}</ul>`:""}
  </div>`;
  if(posts.length){try{pfIdsTroca(posts)}catch(e){}const sc=el.querySelector(".ht-posts");try{wireTracks(sc)}catch(e){}posts.forEach(x=>{try{updateSocial("u:"+x.id)}catch(e){}})}}
/* volta: a página da hashtag e a matéria aberta por ela devolvem o leitor para onde estava */
{const _cl111=closeLayer;closeLayer=function(fromPop){const l2=!!($("#layer2")&&$("#layer2").innerHTML);const eraHt=!l2&&!!$("#layer .pfv-ht"),eraMat=!l2&&!!$("#layer .mat");
  const r=_cl111.apply(this,arguments);
  try{if(!$("#layer").innerHTML&&(eraHt||eraMat)){const user=fromPop===true||Date.now()-HT_CLK<800;
    if(eraHt){try{pfIdsVolta()}catch(e){}if(!HT_FECHANDO){const o=HT_PILHA.pop();if(user)htRestaura(o);else HT_PILHA=[]}}
    else if(HT_MAT_VOLTA){const v=HT_MAT_VOLTA;HT_MAT_VOLTA=null;if(!HT_FECHANDO&&user)abrirHashtag(v,{reabre:true})}}}catch(e){}return r}}
{const _go111=go;go=function(){HT_PILHA=[];HT_MAT_VOLTA=null;htFecha();return _go111.apply(this,arguments)}}
/* ---- hashtags nas notícias: matéria e cartão do Feed ---- */
function htLinhaNot(p,cls){const l=htDaPauta(p);return l.length?`<p class="${cls}">${l.map(t=>`<button type="button" class="ht-n" data-ht="${esc(t)}">${esc(t)}</button>`).join("")}</p>`:""}
function htNaMateria(pid){const p=pautaById(pid),m=$("#layer .mat .mat-c");if(!p||!m)return;if(!m.querySelector(".ht-mat")){const h=htLinhaNot(p,"ht-mat");if(h){const h1=m.querySelector("h1");if(h1)h1.insertAdjacentHTML("beforebegin",h);else m.insertAdjacentHTML("afterbegin",h)}}
  if(HT_MAT_VOLTA){const b=$("#layer .mat-v");if(b){b.textContent="‹ "+HT_MAT_VOLTA;b.setAttribute("aria-label","Voltar para "+HT_MAT_VOLTA)}}}
{const _am111=abrirMateria;abrirMateria=function(pid){const r=_am111.apply(this,arguments);try{htNaMateria(pid)}catch(e){}return r}}
{const _ps111=postSeguro;postSeguro=function(p){let h=_ps111.apply(this,arguments);try{if(typeof h!=="string"||!h||!p||p.__fc107)return h;
    let sg=null;if(p.__pub)sg=htSeguidaDePost(p.__pub);else{const pp=pautaById(p.id)||p;const ln=htLinhaNot(pp,"ht-nl");if(ln&&h.indexOf('class="ht-nl')<0){const i=h.indexOf('<div class="pollbox"');if(i>0)h=h.slice(0,i)+ln+h.slice(i)}sg=htSeguidaDe(pp)}
    if(sg)h=h.replace(/^(\s*<article\b[^>]*>)/,`$1<p class="ht-por gut">Por seguir <b>${esc(sg)}</b></p>`)}catch(e){}return h}}
/* ---- Feed: o que tem hashtag seguida sobe ---- */
{const _lf111=listaFeed;listaFeed=function(){const l=_lf111.apply(this,arguments);try{if(FILTRO!=="tudo"||!Array.isArray(l)||l.length<3||!Object.keys(htSeguidas()).length)return l;
    const mov=[];for(let i=1;i<l.length&&mov.length<3;i++){const p=l[i];if(p&&!p.__pub&&!p.__fc107&&!LIDAS.has(p.id)&&htSeguidaDe(p))mov.push(p)}if(!mov.length)return l;
    const out=l.filter(p=>!mov.includes(p));out.splice(1,0,...mov);return out}catch(e){return l}}}
{const _pm111=pubMistura;pubMistura=function(lista){const out=_pm111.apply(this,arguments);try{if(!Array.isArray(out)||!Object.keys(htSeguidas()).length)return out;
    const ps=out.filter(x=>x&&x.__pub&&Date.now()-(+x.__pub.at||0)<7*864e5&&htSeguidaDePost(x.__pub)).slice(0,2);
    ps.forEach((x,j)=>{const i=out.indexOf(x);if(i>1+j){out.splice(i,1);out.splice(1+j,0,x)}})}catch(e){}return out}}
/* ---- Buscar: "#tag", hashtags seguidas e em alta ---- */
function htResultado(o,I){const nn=htNoticias(o.k).length+htDormentes(o.k).length,np=htPostsCom(o.k).length,nc=htCmtsCom(o.k).length;
  const d=[nn?htPl(nn,"notícia","notícias"):"",np?htPl(np,"post","posts"):"",nc?htPl(nc,"comentário","comentários"):""].filter(Boolean).join(" · ")||"Nada ainda";
  return {tag:o.tag,k:o.k,d:d+(htSeguidas()[o.k]?" · seguindo":""),n:nn+np+nc}}
{const _br111=buscaRes;buscaRes=function(q){const s=String(q||"").trim();if(s.charAt(0)!=="#")return _br111.apply(this,arguments);
  const n=htChave(s),I=htIndice();let l=[...I.values()].filter(o=>!n||o.k.startsWith(n)).map(o=>htResultado(o,I));
  const exato=htLimpa(s);if(exato&&!l.some(x=>x.k===n))l.push(htResultado({tag:exato,k:n},I));
  l.sort((a,b)=>(b.k===n)-(a.k===n)||b.n-a.n).splice(12);
  let h=l.length?`<h3 class="ht-gh">Hashtags</h3><ul class="sres ht-res">${l.map(x=>`<li><button type="button" data-ht="${esc(x.tag)}"><b>${esc(x.tag)}</b><span>${esc(x.d)}</span></button></li>`).join("")}</ul>`:"";
  if(n.length>=2){const r=_br111.call(this,n);if(r.indexOf('class="hint"')<0)h+=`<h3 class="ht-gh">Notícias</h3>`+r}
  return h||`<p class="hint">Nada encontrado para “${esc(s)}”.</p>`}}
{const _bt111=buscaTemas;buscaTemas=function(){const r=_bt111.apply(this,arguments);try{if(!FEED)return r;let h="";const seg=Object.values(htSeguidas()).map(htLimpa).filter(Boolean);
    if(seg.length)h+=`<div class="bv-sec ht-bv"><h3>Hashtags que você segue</h3><div class="bv-chips">${seg.map(t=>`<button type="button" class="chipb ht-chip" data-ht="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>`;
    const al=htEmAlta();if(al.length)h+=`<div class="bv-sec ht-bv"><h3>Em alta entre amigos</h3><ol class="ht-alta">${al.map(o=>`<li><button type="button" data-ht="${esc(o.tag)}"><b>${esc(o.tag)}</b><span>${esc(htPl(o.alta,"uso","usos"))} · ${esc(htPl(o.quem.size,"amigo","amigos"))}</span></button></li>`).join("")}</ol><p class="hint">Nas últimas 48 horas.</p></div>`;
    return h+r}catch(e){return r}}}
/* ---- toques ---- */
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(t.closest("[data-close],.mat-v")||(t.matches&&t.matches("[data-scrim]")))HT_CLK=Date.now();
  if(b=t.closest("[data-ht]")){pare();abrirHashtag(b.dataset.ht);return}
  if(!t.closest("#layer .pfv-ht")&&!t.closest("[data-htcm]"))return;
  if(t.closest("[data-htvolta]")){pare();if(HST>0)history.back();else closeLayer();return}
  if(b=t.closest("[data-htseg]")){pare();const tag=b.dataset.htseg,k=htChave(tag),on=!htSeguidas()[k];htSegue(tag,on);b.outerHTML=htSegBtn(tag,k);toast(on?`Você segue ${tag}. Notícias e posts com ela sobem no Feed.`:`Você deixou de seguir ${tag}.`);return}
  if(b=t.closest("[data-htnot]")){pare();const pid=b.dataset.htnot,tag=$("#layer .pfv-ht").dataset.tag;if(!pautaById(pid))return;HT_FECHANDO=true;try{closeLayer()}finally{HT_FECHANDO=false}HT_MAT_VOLTA=tag;abrirMateria(pid);return}
  if(b=t.closest("[data-htdorm]")){pare();abrirDormente(b.dataset.htdorm);return}
  if(b=t.closest("[data-htcm]")){pare();openComments(b.dataset.htcm);return}},true);
