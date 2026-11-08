/* ---------- 133: importar e exportar colunas (fase 2 do editor) ----------
   IMPORTAR (editor: botão "Importar" e menu "…"):
   - arquivo .docx (lido aqui mesmo: o .docx é um zip; DecompressionStream("deflate-raw") abre; sem ele, aviso claro),
     .md/.markdown, .html/.htm (passa pela lista branca do 132) e .txt; ou colar numa caixa (Docs, Word, Substack, Medium, Notion).
   - Fotos embutidas no .docx sobem pelo Storage dos posts (até 10 por coluna); imagens de fora não vêm (aviso com a contagem).
   - Prévia "Vai entrar: N parágrafos, N títulos, N fotos" e a escolha: substituir o texto ou acrescentar no fim.
     Título da coluna vazio = o primeiro título do arquivo.
   - Colar direto no editor: Word (listas "mso-list") vira lista de verdade; imagens que não vêm geram aviso.
   EXPORTAR (página da coluna, só para a autora, e menu "…" do editor): folha "Exportar coluna" com e-mail (HTML formatado e
   .html), LinkedIn (post até 3.000 e artigo), X (fio de até 280 por post, numerado e editável), Instagram (carrossel 1080×1350
   e legenda), Facebook, WhatsApp (*negrito* e _itálico_), PDF (impressão) e Markdown. Tudo termina com
   "— Nome, publicado originalmente no Prumo" (sem link: por enquanto as colunas ficam só dentro do Prumo).
   Fotos e gráficos do texto ficam só no Prumo (menos no PDF). Nomes globais com o prefixo ex133 / EX133. */

var EX133={imp:null,F:null,dest:"",li:"post",fb:"t",wa:"t",x:[],ig:[],igb:[],igU:[],ult:null,igT:0};
const EX133_ASS=n=>`— ${String(n||"").trim()||"Autora"}, publicado originalmente no Prumo`;
const EX133_COMPLETA="A coluna completa está no Prumo.";
const EX133_IC={
  arq:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 17v-6M9 14l3 3 3-3"/>',
  exp:'<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
  doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  img:'<rect x="3.5" y="4" width="13" height="16" rx="2"/><path d="M19.5 7v11a2 2 0 0 1-2 2"/><path d="M6 15l3-3 2.5 2.5L13 13l2 2"/>',
  bal:'<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
  imp:'<path d="M6 9V3h12v6"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  md:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 15V9l2.5 3L11 9v6M16 9v6M14 13l2 2 2-2"/>',
  txt:'<path d="M5 6h14M5 10h14M5 14h9M5 18h6"/>',x:'<path d="M5 5l14 14M19 5L5 19"/>',
  feed:'<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7.5 8.5h9M7.5 12h9M7.5 15.5h5"/>'};
const EX133_DEST=[["email","E-mail","Copiar formatado para o Gmail ou Outlook, ou baixar .html","mail"],["linkedin","LinkedIn","Post de até 3.000 caracteres ou artigo completo","txt"],
  ["x","X","Fio numerado, até 280 caracteres por post","x"],["ig","Instagram","Carrossel de imagens 1080×1350 e legenda","img"],["fb","Facebook","Chamada e trecho, ou o texto inteiro","feed"],
  ["wa","WhatsApp","Com *negrito* e _itálico_ do próprio WhatsApp","bal"],["pdf","PDF","Versão para imprimir ou salvar em PDF","imp"],["md","Markdown","Baixar .md ou copiar","md"]];
const ex133Pl=(n,a,b)=>`${typeof cs123Num==="function"?cs123Num(n):n} ${n===1?a:b}`;
const ex133Tpl=h=>{const tp=document.createElement("template");tp.innerHTML=String(h||"");return tp};
const ex133AvisoImg=n=>n===1?"1 imagem não foi trazida; adicione pelo botão de foto.":`${n} imagens não foram trazidas; adicione pelo botão de foto.`;
const ex133Slug=s=>norm(s).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)||"coluna";
/* folha por cima do editor ou da página da coluna: se já há uma folha aberta, troca o conteúdo dela (não o da camada de baixo) */
function ex133Folha(t,b,f,o){const l2=$("#layer2");if(l2&&l2.innerHTML){const r0=document.querySelector("#layer > .ed132, #layer > .ed132-hubr, #layer > .cs123-ler, #layer > .cs123-ed");
  if(r0){r0.classList.add("cria");try{return sheet(t,b,f,o)}finally{r0.classList.remove("cria")}}}return sheet(t,b,f,o)}
function ex133Corta(s,n){s=String(s||"");if(s.length<=n)return s;const c=s.slice(0,Math.max(1,n-1)),k=c.lastIndexOf(" ");return (k>n*.6?c.slice(0,k):c).replace(/[\s,;:.–—-]+$/,"")+"…"}
/* frases: corta depois de . ! ? … seguido de espaço (não quebra "1.000" nem "2,5%"); nada do texto se perde */
function ex133Frases(s){s=String(s||"");const out=[],poe=f=>{f=f.trim();if(f)out.push(f)};let ini=0;
  for(let i=0;i<s.length;i++){const ch=s[i];if(ch==="\n"){poe(s.slice(ini,i));ini=i+1;continue}
    if(".!?…".indexOf(ch)>=0){let j=i+1;while(j<s.length&&".!?…\"'”’»)]".indexOf(s[j])>=0)j++;if(j>=s.length||/\s/.test(s[j])){poe(s.slice(ini,j));ini=j;i=j-1}}}
  poe(s.slice(ini));return out}

/* ===== 1. Word colado ou .html do Word: listas "mso-list" viram listas de verdade (antes da lista branca do 132) ===== */
function ex133Pre(h){h=String(h||"");if(!/mso-|<o:p|class="?Mso/i.test(h))return h;
  const tp=ex133Tpl(h.replace(/<!--[\s\S]*?-->/g,"").replace(/<!\[(?:if|endif)[^\]]*\]>/gi,""));const C=tp.content;
  C.querySelectorAll("p").forEach(p=>{const cl=String(p.className||"");if(/^MsoTitle|^MsoSubtitle/i.test(cl)){const h1=document.createElement(/Subtitle/i.test(cl)?"h3":"h1");h1.innerHTML=p.innerHTML;p.replaceWith(h1)}
    else if(/^Mso(?:Intense)?Quote/i.test(cl)){const q=document.createElement("blockquote");q.innerHTML=`<p>${p.innerHTML}</p>`;p.replaceWith(q)}});
  const lis=[...C.querySelectorAll("p")].filter(p=>/mso-list:\s*l\d/i.test(p.getAttribute("style")||"")||/^MsoListParagraph/i.test(p.className||""));
  lis.forEach(p=>{const ig=[...p.querySelectorAll("span")].filter(s=>/mso-list:\s*ignore/i.test(s.getAttribute("style")||""));const mk=ig.map(s=>s.textContent).join("").replace(/\s+/g,"");
    ig.forEach(s=>s.remove());p.setAttribute("data-ex133l",/^[0-9a-z]{1,4}[.)]$/i.test(mk)?"ol":"ul")});
  const feitos=new Set();
  lis.forEach(p=>{if(feitos.has(p))return;const t=p.getAttribute("data-ex133l"),l=document.createElement(t);p.before(l);let c=p;
    while(c){let nx=c.nextSibling;while(nx&&nx.nodeType===3&&!String(nx.nodeValue).trim())nx=nx.nextSibling;feitos.add(c);const li=document.createElement("li");li.innerHTML=c.innerHTML;l.appendChild(li);c.remove();
      c=nx&&nx.nodeType===1&&nx.getAttribute("data-ex133l")===t?nx:null}});
  return tp.innerHTML}
{const _l=ed132Limpa;ed132Limpa=function(h,o){return _l(ex133Pre(h),o)}}
function ex133ContaImg(h){if(!h||!/<img/i.test(h))return 0;const tp=ex133Tpl(h);return [...tp.content.querySelectorAll("img")].filter(i=>!i.closest("figure[data-f]")&&!i.closest(".ed132-fe")).length}
/* colar direto no editor: o 132 limpa; aqui só o aviso das imagens que ficaram de fora */
document.addEventListener("paste",e=>{const cp=e.target&&e.target.closest&&e.target.closest("#ed132-corpo");if(!cp||!e.clipboardData)return;let n=0;try{n=ex133ContaImg(e.clipboardData.getData("text/html"))}catch(_){}
  if(n)setTimeout(()=>toast(ex133AvisoImg(n)),40)},true);

/* ===== 2. ler os arquivos ===== */
function ex133Dec(buf){try{return new TextDecoder("utf-8",{fatal:true}).decode(buf).replace(/^\uFEFF/,"")}catch(e){try{return new TextDecoder("windows-1252").decode(buf)}catch(_){return ""}}}
/* Markdown: títulos, ênfase, listas, citações, links, separador (imagens não vêm) */
function ex133MdIn(s){let n=0;s=esc(s);
  s=s.replace(/!\[[^\]]*\]\([^)]*\)/g,()=>{n++;return ""});
  s=s.replace(/`([^`]+)`/g,"$1");
  s=s.replace(/\[([^\]]+)\]\((\S+?)(?:\s+&quot;[^&]*&quot;)?\)/g,(m,t,u)=>{const ok=edUrlOk(u.replace(/&amp;/g,"&"));return ok?`<a href="${esc(ok)}">${t}</a>`:t});
  s=s.replace(/&lt;(https:\/\/[^\s&]+)&gt;/g,(m,u)=>`<a href="${u}">${u}</a>`);
  s=s.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g,(m,a,b)=>`<strong>${a||b}</strong>`);
  s=s.replace(/(^|[^\w*\\])\*([^*\s](?:[^*]*[^*\s\\])?)\*(?=[^\w*]|$)/g,"$1<em>$2</em>");
  s=s.replace(/(^|[^\w\\])_([^_\s](?:[^_]*[^_\s\\])?)_(?=[^\w]|$)/g,"$1<em>$2</em>");
  s=s.replace(/\\([\\`*_{}[\]()#+\-.!>])/g,"$1");return {h:s,n}}
function ex133DeMd(txt){const L=String(txt||"").replace(/\r\n?/g,"\n").replace(/^\uFEFF/,"").split("\n");const out=[];let par=[],sem=0,i=0;
  const inl=s=>{const r=ex133MdIn(s);sem+=r.n;return r.h};
  const fp=()=>{if(par.length){const h=par.map((l,k)=>inl(l.trim().replace(/\\$/,""))+(k<par.length-1?(/ {2,}$|\\$/.test(l)?"<br>":" "):"")).join("");if(h.trim())out.push(`<p>${h}</p>`);par=[]}};
  const cab=(nv,s)=>{const h=inl(s);if(h.trim())out.push(nv<=2?`<h2>${h}</h2>`:`<h3>${h}</h3>`)};
  while(i<L.length){const l=L[i],t=l.trim();let m;
    if(!t){fp();i++;continue}
    if(/^(?:```|~~~)/.test(t)){fp();const f=t.slice(0,3);i++;while(i<L.length&&L[i].trim().slice(0,3)!==f){if(L[i].trim())out.push(`<p>${esc(L[i].trim())}</p>`);i++}i++;continue}
    if((m=/^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(t))){fp();cab(m[1].length,m[2]);i++;continue}
    if(/^=+$/.test(t)&&par.length){const s=par.join(" ");par=[];cab(1,s);i++;continue}
    if(/^-+$/.test(t)&&par.length){const s=par.join(" ");par=[];cab(2,s);i++;continue}
    if(/^(?:[-*_]\s*){3,}$/.test(t)){fp();out.push("<hr>");i++;continue}
    if(/^>/.test(t)){fp();const q=[];while(i<L.length&&/^\s*>/.test(L[i])){q.push(L[i].replace(/^\s*>\s?/,""));i++}const r=ex133DeMd(q.join("\n"));sem+=r.sem;if(r.html)out.push(`<blockquote>${r.html}</blockquote>`);continue}
    if((m=/^\s*([-*+]|\d+[.)])\s+/.exec(l))){fp();const ord=/\d/.test(m[1]),its=[];
      while(i<L.length){const mm=/^\s*([-*+]|\d+[.)])\s+(.*)$/.exec(L[i]);if(mm){its.push(mm[2]);i++;continue}if(L[i].trim()&&/^\s{2,}/.test(L[i])&&its.length){its[its.length-1]+=" "+L[i].trim();i++;continue}break}
      out.push(`<${ord?"ol":"ul"}>${its.map(x=>`<li>${inl(x)}</li>`).join("")}</${ord?"ol":"ul"}>`);continue}
    par.push(l);i++}
  fp();return {html:out.join(""),sem}}
function ex133DeHtml(txt){let d;try{d=new DOMParser().parseFromString(String(txt||""),"text/html")}catch(e){return {html:"",sem:0,tit:""}}
  const b=d.body||d.documentElement,sem=ex133ContaImg(b.innerHTML),h1=b.querySelector("h1,h2");
  return {html:b.innerHTML,sem,tit:String(h1?h1.textContent:d.title||"").replace(/\s+/g," ").trim()}}
function ex133DeTxt(t){t=String(t||"").replace(/\r\n?/g,"\n").replace(/^\uFEFF/,"");const bl=t.split(/\n[ \t]*\n/).map(s=>s.trim()).filter(Boolean);
  const ps=bl.length<=1?t.split("\n").map(s=>s.trim()).filter(Boolean):bl.map(s=>s.split("\n").map(x=>x.trim()).join(" "));return {html:ps.map(s=>`<p>${esc(s)}</p>`).join(""),sem:0}}

/* zip (para o .docx): lê o diretório central; "deflate" pelo DecompressionStream do navegador */
async function ex133Unzip(buf){const u=new Uint8Array(buf),dv=new DataView(buf);let e=-1;
  for(let i=u.length-22;i>=Math.max(0,u.length-65557);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}if(e<0)throw new Error("zip");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const dec=new TextDecoder(),m=new Map();
  for(let k=0;k<n&&p+46<=u.length;k++){if(dv.getUint32(p,true)!==0x02014b50)break;const met=dv.getUint16(p+10,true),cz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);
    m.set(dec.decode(u.subarray(p+46,p+46+nl)),{met,cz,lo});p+=46+nl+xl+cl}
  const le=async nome=>{const z=m.get(nome);if(!z)return null;const l=z.lo,ini=l+30+dv.getUint16(l+26,true)+dv.getUint16(l+28,true),d=u.subarray(ini,ini+z.cz);
    if(z.met===0)return d.slice();if(z.met!==8)throw new Error("metodo");if(typeof DecompressionStream==="undefined")throw new Error("sem-ds");
    const s=new Blob([d]).stream().pipeThrough(new DecompressionStream("deflate-raw"));return new Uint8Array(await new Response(s).arrayBuffer())};
  return {nomes:[...m.keys()],le,txt:async nome=>{const d=await le(nome);return d?dec.decode(d):null}}}
/* .docx: parágrafos, Heading 1–3 (e Título), negrito/itálico, listas, links, citações, tabelas e fotos embutidas */
async function ex133Docx(ab){const z=await ex133Unzip(ab);const doc=await z.txt("word/document.xml");if(!doc)throw new Error("docx");
  const DP=new DOMParser(),xml=s=>s?DP.parseFromString(s,"application/xml"):null;
  const D=xml(doc),R=xml(await z.txt("word/_rels/document.xml.rels")),St=xml(await z.txt("word/styles.xml")),Nu=xml(await z.txt("word/numbering.xml"));
  const kids=(el,nm)=>el?[...el.children].filter(c=>c.localName===nm):[],kid=(el,nm)=>kids(el,nm)[0]||null,at=(el,nm)=>{if(!el)return null;for(const a of el.attributes)if(a.localName===nm)return a.value;return null};
  const tudo=(el,nm)=>el?[...el.getElementsByTagName("*")].filter(c=>c.localName===nm):[];
  const rel=new Map();tudo(R&&R.documentElement,"Relationship").forEach(r=>rel.set(r.getAttribute("Id"),{t:r.getAttribute("Target")||"",ext:r.getAttribute("TargetMode")==="External"}));
  const est=new Map();tudo(St&&St.documentElement,"style").forEach(s=>{const id=at(s,"styleId")||"",nm=norm(at(kid(s,"name"),"val")||"");let h=0;const m=/^(?:heading|titulo) ?([1-6])$/.exec(nm)||/^heading([1-6])$/i.exec(id);if(m)h=+m[1];
    const ol=kid(kid(s,"pPr"),"outlineLvl");if(!h&&ol){const v=+at(ol,"val");if(v>=0&&v<6)h=v+1}est.set(id,{h,tit:nm==="title"||nm==="titulo",sub:nm==="subtitle"||nm==="subtitulo",q:/quote|citacao/.test(nm)})});
  const abs=new Map(),num=new Map();if(Nu)[...Nu.documentElement.children].forEach(e=>{if(e.localName==="abstractNum"){const lv={};kids(e,"lvl").forEach(l=>{lv[at(l,"ilvl")]=at(kid(l,"numFmt"),"val")||""});abs.set(at(e,"abstractNumId"),lv)}else if(e.localName==="num")num.set(at(e,"numId"),at(kid(e,"abstractNumId"),"val"))});
  const fmt=(id,il)=>{const lv=abs.get(num.get(id))||{};return lv[il]||lv["0"]||"bullet"};
  const inl=(el,ims)=>{let h="";for(const c of el.children){const ln=c.localName;
    if(ln==="r"){const rp=kid(c,"rPr"),on=nm=>{const e=kid(rp,nm);if(!e)return false;const v=at(e,"val");return v===null||!/^(?:0|false|off|none)$/i.test(v)},rs=norm(at(kid(rp,"rStyle"),"val")||"");let s="";
      for(const k of c.children){const n=k.localName;if(n==="t")s+=esc(k.textContent);else if(n==="tab")s+=" ";else if(n==="br"||n==="cr")s+="<br>";else if(n==="noBreakHyphen")s+="-";
        else if(n==="drawing"||n==="pict"||n==="object"||n==="AlternateContent"){tudo(k,"blip").forEach(b=>{const id=at(b,"embed");if(id)ims.push(id)});tudo(k,"imagedata").forEach(b=>{const id=at(b,"id");if(id)ims.push(id)})}}
      if(s.replace(/<br>/g,"").trim()){if(on("b")||/strong|forte/.test(rs))s=`<strong>${s}</strong>`;if(on("i")||/emphasis|enfase/.test(rs))s=`<em>${s}</em>`}h+=s}
    else if(ln==="hyperlink"){const r=rel.get(at(c,"id")),inner=inl(c,ims),u=r&&r.ext?edUrlOk(r.t):"";h+=u?`<a href="${esc(u)}">${inner}</a>`:inner}
    else if(ln==="sdt")h+=inl(kid(c,"sdtContent")||c,ims);
    else if(/^(?:ins|smartTag|sdtContent|fldSimple|customXml|AlternateContent|Choice)$/.test(ln))h+=inl(c,ims)}
    return h};
  const partes=[];let buf=[],lista=null;const ids=[];
  const fechaL=()=>{if(lista){buf.push(`<${lista.t}>${lista.its.map(i=>`<li>${i}</li>`).join("")}</${lista.t}>`);lista=null}};
  const fluxo=()=>{fechaL();if(buf.length){partes.push({html:buf.join("")});buf=[]}};
  const par=p=>{const pp=kid(p,"pPr"),sid=at(kid(pp,"pStyle"),"val")||"",st=est.get(sid)||{h:/^Heading[1-6]$/i.test(sid)?+sid.slice(-1):0},np=kid(pp,"numPr"),ims=[];
    const h=inl(p,ims).replace(/^(?:\s|<br>)+/,"").replace(/(?:\s|<br>)+$/,"");let hv=st.h||0;const ol=kid(pp,"outlineLvl");if(!hv&&ol){const v=+at(ol,"val");if(v>=0&&v<6)hv=v+1}
    if(!ed132Vazio(h)){const nid=np?at(kid(np,"numId"),"val"):null;
      if(st.tit||hv&&hv<=2){fechaL();buf.push(`<h2>${h}</h2>`)}else if(st.sub||hv){fechaL();buf.push(`<h3>${h}</h3>`)}
      else if(nid&&nid!=="0"){const f=fmt(nid,at(kid(np,"ilvl"),"val")||"0"),t=f==="bullet"||f==="none"?"ul":"ol";if(lista&&lista.t!==t)fechaL();lista=lista||{t,its:[]};lista.its.push(h)}
      else if(st.q){fechaL();buf.push(`<blockquote><p>${h}</p></blockquote>`)}else{fechaL();buf.push(`<p>${h}</p>`)}}
    if(ims.length){fluxo();ims.forEach(id=>{partes.push({rid:id});ids.push(id)})}};
  const corpo=el=>{for(const c of el.children){const ln=c.localName;if(ln==="p")par(c);else if(ln==="tbl"){fechaL();kids(c,"tr").forEach(tr=>{const cs=kids(tr,"tc").map(tc=>kids(tc,"p").map(p=>inl(p,[])).join(" ").trim()).filter(s=>!ed132Vazio(s));if(cs.length)buf.push(`<p>${cs.join(" · ")}</p>`)})}
    else if(ln==="sdt")corpo(kid(c,"sdtContent")||c);else if(ln==="customXml"||ln==="ins")corpo(c)}};
  const body=tudo(D&&D.documentElement,"body")[0];if(!body)throw new Error("docx");corpo(body);fluxo();
  /* fotos: só os tipos que o navegador abre */
  const tipos={png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",bmp:"image/bmp"};let sem=0;const out=[];
  for(const p of partes){if(p.html){out.push(p);continue}const r=rel.get(p.rid);let ok=false;
    if(r&&!r.ext){let caminho=r.t.charAt(0)==="/"?r.t.slice(1):"word/"+r.t;const seg=[];caminho.split("/").forEach(s=>{if(s==="..")seg.pop();else if(s&&s!==".")seg.push(s)});caminho=seg.join("/");
      const ext=(caminho.split(".").pop()||"").toLowerCase();if(tipos[ext]){try{const d=await z.le(caminho);if(d&&d.length){out.push({img:new Blob([d],{type:tipos[ext]})});ok=true}}catch(e){}}}
    if(!ok)sem++}
  return {partes:out,sem}}

/* ===== 3. importar: arquivo ou colado → prévia → substituir ou acrescentar ===== */
function ex133PodeFoto(){return typeof SB!=="undefined"&&!!SB&&!!S.uid}
function ex133Prepara(r,nome){/* r: {html|partes, sem, tit?} */const E=ED132.E;if(!E)return null;
  let partes=(r.partes||[{html:r.html||""}]).map(p=>p.html!==undefined?{html:ed132Limpa(p.html,{dono:S.uid})}:p).filter(p=>p.img||!ed132Vazio(p.html)||/<hr>/.test(p.html));let sem=r.sem||0;
  if(!ex133PodeFoto()){const n=partes.filter(p=>p.img).length;sem+=n;partes=partes.filter(p=>!p.img)}
  /* título: o primeiro título do arquivo, quando a coluna ainda não tem */
  let tit="";const ph=partes.find(p=>p.html);if(ph){const tp=ex133Tpl(ph.html),h=tp.content.querySelector("h2,h3");if(h)tit=h.textContent.replace(/\s+/g," ").trim()}if(!tit&&r.tit)tit=String(r.tit).trim();
  let titCol="";ed132Le();if(!E.tit.trim()&&tit){titCol=tit.slice(0,90);const i=partes.indexOf(ph);if(ph&&i===0){const tp=ex133Tpl(ph.html),f=tp.content.firstElementChild;
    if(f&&/^H[23]$/.test(f.tagName)&&norm(f.textContent.replace(/\s+/g," ").trim())===norm(tit)){f.remove();partes[0]={html:tp.innerHTML}}}}
  return {partes,sem,titCol,nome:nome||""}}
function ex133Conta(R){const tp=ex133Tpl(R.partes.filter(p=>p.html).map(p=>p.html).join(""));return {par:tp.content.querySelectorAll("p,li").length,tit:tp.content.querySelectorAll("h2,h3").length,fot:R.partes.filter(p=>p.img).length}}
function ex133Importar(){const E=ED132.E;if(!E)return;EX133.imp=null;
  ex133Folha("Importar texto",`<div class="ex133-imp">
    <button type="button" class="ex133-arq" data-ex133arq>${ed132Svg(EX133_IC.arq)}<span><b>Escolher arquivo</b><small>.docx (Word ou Google Docs), .md, .html ou .txt</small></span></button>
    <p class="ex133-ou"><span>ou</span></p>
    <div id="ex133-cola" class="ex133-cola" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Cole aqui o texto" data-ph="Cole aqui o texto do Google Docs, Word, Substack, Medium ou Notion"></div>
    <p class="hint">Fica só a formatação que o Prumo usa: títulos, negrito, itálico, links, listas e citações. Antes de entrar no texto, você vê o que vai entrar.</p></div>`)}
function ex133Arquivo(){const root=$("#layer > .ed132");if(!root)return;$("#ex133-file")?.remove();const inp=document.createElement("input");inp.type="file";inp.id="ex133-file";inp.hidden=true;
  inp.accept=".docx,.md,.markdown,.html,.htm,.txt,text/plain,text/markdown,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document";root.appendChild(inp);
  inp.addEventListener("change",()=>{const f=inp.files&&inp.files[0];inp.remove();if(f)ex133LeArq(f)});try{inp.click()}catch(e){}}
async function ex133LeArq(f){const ext=(String(f.name||"").split(".").pop()||"").toLowerCase();
  if(f.size>15e6){toast("Arquivo grande demais (até 15 MB).");return}
  if(ext==="doc"){toast("Arquivos .doc antigos não abrem aqui. Salve como .docx ou copie o texto e cole.");return}
  let r=null;
  try{const buf=await f.arrayBuffer();
    if(ext==="docx")r=await ex133Docx(buf);
    else if(ext==="md"||ext==="markdown")r=ex133DeMd(ex133Dec(buf));
    else if(ext==="html"||ext==="htm"||/html/.test(f.type||""))r=ex133DeHtml(ex133Dec(buf));
    else if(ext==="txt"||/^text\//.test(f.type||""))r=ex133DeTxt(ex133Dec(buf));
    else{toast("Use um arquivo .docx, .md, .html ou .txt.");return}}
  catch(e){toast(String(e&&e.message)==="sem-ds"?"Este navegador não abre .docx. Abra o arquivo no Word ou no Google Docs, copie o texto e cole aqui.":"Não deu para ler este arquivo. Tente abrir, copiar o texto e colar.");return}
  ex133Previa(r,f.name)}
function ex133Previa(r,nome){const E=ED132.E;if(!E)return;const R=ex133Prepara(r,nome);if(!R)return;const k=ex133Conta(R);
  if(!k.par&&!k.tit&&!k.fot){toast(R.sem?ex133AvisoImg(R.sem):"Não achei texto para trazer.");return}
  EX133.imp=R;const vazio=ed132Vazio(E.html)&&!ed132FotosDo(E.html).length,pal=ed132Palavras(ed132Plano(E.html));
  const pv=R.partes.map(p=>p.img?`<p class="ex133-fi">Foto do arquivo</p>`:p.html).join("");
  ex133Folha("Importar texto",`${nome?`<p class="ex133-nm">${esc(nome)}</p>`:""}<p class="ex133-vai" data-ex133vai><b>Vai entrar:</b> ${ex133Pl(k.par,"parágrafo","parágrafos")}, ${ex133Pl(k.tit,"título","títulos")}, ${ex133Pl(k.fot,"foto","fotos")}</p>
    ${R.titCol?`<p class="hint">Título da coluna: <b>“${esc(R.titCol)}”</b></p>`:""}${R.sem?`<p class="ex133-av" role="status">${esc(ex133AvisoImg(R.sem))}</p>`:""}
    <div class="ex133-pvi" inert><div class="cs123-corpo">${pv}</div></div>
    ${vazio?"":`<p class="hint">Seu texto atual tem ${ex133Pl(pal,"palavra","palavras")}. Substituir ou acrescentar no fim?</p>`}`,
    `<div class="ex133-bts">${vazio?`<button type="button" class="btn" data-ex133ap="sub">Pôr no texto</button>`:`<button type="button" class="btn ghost" data-ex133ap="sub">Substituir o texto</button><button type="button" class="btn" data-ex133ap="add">Acrescentar no fim</button>`}</div>`)}
async function ex133Aplica(modo){const R=EX133.imp,E=ED132.E;if(!R||!E)return;EX133.imp=null;closeLayer();
  const nf=R.partes.filter(p=>p.img).length;let vagas=10-(modo==="sub"?0:ed132FotosDo(E.html).length)-(E.capa?1:0),sem=R.sem,sub=0;const hs=[];
  if(nf){toast(nf===1?"Enviando a foto…":`Enviando ${nf} fotos…`);E.subindo++}
  try{for(const p of R.partes){if(p.html!==undefined){hs.push(p.html);continue}if(vagas<=0){sem++;continue}
      try{const b=await pubComprime(p.img,1600),u=URL.createObjectURL(b),ph=await pubSobe(b);ED132.urls[ph]=u;PUB.urls[ph]={u,exp:Date.now()+3600e3};hs.push(`<figure data-f="${esc(ph)}"><figcaption></figcaption></figure>`);vagas--;sub++}catch(e){sem++}}}
  finally{if(nf)E.subindo=Math.max(0,E.subindo-1)}
  if(ED132.E!==E)return;ed132Le();const novo=ed132Limpa(hs.join(""),{dono:S.uid});
  if(R.titCol&&!E.tit.trim())E.tit=R.titCol;
  E.html=modo==="sub"||ed132Vazio(E.html)&&!ed132FotosDo(E.html).length?novo:E.html+novo;E.ver=false;
  ed132Desenha();ed132EdFotos();ed132Mudou();document.querySelectorAll(".toast").forEach(t=>t.remove());
  toast((modo==="sub"?"Texto substituído":"Texto importado")+(sem?". "+ex133AvisoImg(sem):""));try{uso("coluna_importada")}catch(e){}}

/* ===== 4. o texto da coluna em cada formato ===== */
function ex133In(n,m){if(n.nodeType===3){const s=String(n.nodeValue||"").replace(/\s+/g," ");return m==="md"?s.replace(/([\\`*_[\]])/g,"\\$1"):s}if(n.nodeType!==1)return "";const t=n.tagName;if(t==="BR")return "\n";
  let s="";n.childNodes.forEach(c=>{s+=ex133In(c,m)});if(!s.trim())return s;
  const pad=(a,z)=>{const mm=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);return mm[1]+a+mm[2]+z+mm[3]};
  if(t==="STRONG"||t==="B")return m==="md"?pad("**","**"):m==="wa"?pad("*","*"):s;
  if(t==="EM"||t==="I")return m==="md"?pad("*","*"):m==="wa"?pad("_","_"):s;
  if(t==="A"){const u=n.getAttribute("href")||"";if(!u)return s;if(m==="md")return `[${s.trim()}](${u})`;const d=s.trim();return d===u||d+"/"===u||norm(d)===norm(edDom(u))?u:`${s} (${u})`}
  return s}
function ex133Partes(html,m){const tp=ex133Tpl(html),out=[];const lim=s=>s.replace(/[ \t]+\n/g,"\n").replace(/\n[ \t]+/g,"\n").trim();
  tp.content.childNodes.forEach(n=>{if(n.nodeType!==1)return;const t=n.tagName;
    if(t==="P"){const s=lim(ex133In(n,m));if(s)out.push({t:"p",s});return}
    if(t==="H2"||t==="H3"){const s=lim(ex133In(n,"tx"));if(s)out.push({t:t.toLowerCase(),s});return}
    if(t==="BLOCKQUOTE"){let ps=[...n.querySelectorAll("p")].map(p=>lim(ex133In(p,m))).filter(Boolean);if(!ps.length){const s=lim(ex133In(n,m));if(s)ps=[s]}if(ps.length)out.push({t:"q",ps});return}
    if(t==="UL"||t==="OL"){const its=[...n.querySelectorAll("li")].map(li=>lim(ex133In(li,m))).filter(Boolean);if(its.length)out.push({t:t.toLowerCase(),its});return}
    if(t==="HR"){out.push({t:"hr"});return}
    if(t==="FIGURE")out.push({t:"fig"})});
  return out}
function ex133Bl(b,k){/* k: li (LinkedIn), wa (WhatsApp), tx (texto) */
  if(b.t==="p")return b.s;
  if(b.t==="h2")return k==="wa"?`*${b.s}*`:k==="li"?b.s.toLocaleUpperCase("pt-BR"):b.s;
  if(b.t==="h3")return k==="wa"?`*${b.s}*`:k==="li"?"▸ "+b.s:b.s;
  if(b.t==="q")return b.ps.map(p=>k==="wa"?"> "+p:`“${p}”`).join("\n");
  if(b.t==="ul")return b.its.map(i=>"• "+i).join("\n");
  if(b.t==="ol")return b.its.map((i,j)=>`${j+1}. ${i}`).join("\n");
  if(b.t==="hr")return "———";return ""}
function ex133Cab(F,k){return k==="wa"?[`*${F.tit}*`,F.linha?`_${F.linha}_`:""]:[F.tit,F.linha]}
/* texto inteiro */
function ex133Inteiro(F,k){return [...ex133Cab(F,k),...ex133Partes(F.html,k==="wa"?"wa":"tx").map(b=>ex133Bl(b,k)),EX133_ASS(F.nome)].filter(Boolean).join("\n\n")}
/* chamada + trecho (primeiros parágrafos), cabendo em max */
function ex133Trecho(F,k,nPar,max){const P=ex133Partes(F.html,k==="wa"?"wa":"tx");const cab=ex133Cab(F,k).filter(Boolean),ch=F.chamX?[k==="wa"?`_${F.chamX}_`:F.chamX]:[];
  const fim=[EX133_COMPLETA,EX133_ASS(F.nome)];const ps=P.filter(b=>b.t==="p"||b.t==="q").slice(0,nPar).map(b=>ex133Bl(b,k));
  const base=[...cab,...ch,...fim].join("\n\n").length;let resto=max-base;const usa=[];
  for(const p of ps){const c=p.length+2;if(c<=resto){usa.push(p);resto-=c}else{if(resto>80)usa.push(ex133Corta(p,resto-2));break}}
  const mais=P.filter(b=>b.t!=="fig").length>usa.length;return [...cab,...ch,...usa,...(mais?fim:fim.slice(1))].join("\n\n")}
/* LinkedIn: post (até 3.000) */
function ex133Li(F){const t=ex133Inteiro(F,"li");if(t.length<=3000)return {t,curta:false,n:t.length};const s=ex133Trecho({...F,chamX:F.chamX||F.linha,linha:F.chamX?F.linha:""},"li",3,3000);return {t:s,curta:true,n:t.length}}
/* X: fio de posts até 280, quebrados em frase e numerados "1/9" no começo */
function ex133Fio(F){const P=ex133Partes(F.html,"tx");const un=[{s:F.tit,h:true}];if(F.linha)un.push({s:F.linha});
  P.forEach(b=>{if(b.t==="p")un.push({s:b.s});else if(b.t==="h2"||b.t==="h3")un.push({s:b.s,h:true});else if(b.t==="q")b.ps.forEach(p=>un.push({s:`“${p}”`}));else if(b.t==="ul"||b.t==="ol")un.push({s:ex133Bl(b,"tx"),l:true})});
  un.push({s:EX133_ASS(F.nome),fim:true});
  const monta=B=>{const posts=[];let cur="";const poe=(tx,sep)=>{if(!cur){cur=tx;return}if((cur+sep+tx).length<=B)cur+=sep+tx;else{posts.push(cur);cur=tx}};
    const pedaco=s=>{if(s.length<=B)return [s];const out=[];let c="";s.split(/\s+/).forEach(w=>{while(w.length>B){if(c){out.push(c);c=""}out.push(w.slice(0,B));w=w.slice(B)}if(!w)return;if(!c)c=w;else if((c+" "+w).length<=B)c+=" "+w;else{out.push(c);c=w}});if(c)out.push(c);return out};
    un.forEach(u=>{if(u.h){if(cur)posts.push(cur);cur=u.s;return}const fr=u.l?u.s.split("\n"):u.fim?[u.s]:ex133Frases(u.s);const sj=u.l?"\n":" ";
      fr.forEach((f,i)=>pedaco(f).forEach((q,j)=>poe(q,i===0&&j===0?"\n\n":sj)))});
    if(cur)posts.push(cur);return posts};
  let B=280-6,posts=monta(B);for(let k=0;k<3;k++){const lab=`${posts.length}/${posts.length} `.length;if(280-lab>=B)break;B=280-lab;posts=monta(B)}
  const N=posts.length;return posts.map((p,i)=>`${i+1}/${N} ${p}`)}
/* Markdown */
function ex133Md(F){const L=[`# ${F.tit.replace(/\s+/g," ")}`];if(F.linha)L.push(`*${F.linha}*`);L.push(`Por ${F.nome}`);
  ex133Partes(F.html,"md").forEach(b=>{if(b.t==="p")L.push(b.s.replace(/\n/g,"  \n"));else if(b.t==="h2")L.push("## "+b.s);else if(b.t==="h3")L.push("### "+b.s);else if(b.t==="q")L.push(b.ps.map(p=>"> "+p).join("\n>\n"));
    else if(b.t==="ul")L.push(b.its.map(i=>"- "+i).join("\n"));else if(b.t==="ol")L.push(b.its.map((i,j)=>`${j+1}. ${i}`).join("\n"));else if(b.t==="hr")L.push("---")});
  L.push("---",EX133_ASS(F.nome));return L.join("\n\n")+"\n"}
/* e-mail: HTML com estilo inline simples (fotos e gráficos ficam no Prumo) */
function ex133Email(F,doc){const tp=ex133Tpl(F.html),C=tp.content,sty=(sel,s)=>C.querySelectorAll(sel).forEach(e=>e.setAttribute("style",s));
  C.querySelectorAll("figure").forEach(f=>f.remove());
  sty("p","margin:0 0 16px;font-size:17px;line-height:1.6;color:#1f2937");
  sty("h2","margin:28px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.25;color:#14213a");
  sty("h3","margin:22px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.3;color:#14213a");
  sty("blockquote","margin:20px 0;padding:4px 0 4px 16px;border-left:3px solid #c9822b;font-style:italic;color:#374151");
  sty("blockquote p","margin:0 0 8px;font-size:19px;line-height:1.5;color:#374151");
  sty("ul,ol","margin:0 0 16px;padding-left:24px;font-size:17px;line-height:1.6;color:#1f2937");sty("li","margin:0 0 6px");
  sty("a","color:#24406b;text-decoration:underline");sty("hr","border:0;border-top:1px solid #d1d5db;margin:28px auto;width:40%");
  C.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(a=>{if(!/^(?:style|href)$/.test(a.name))e.removeAttribute(a.name)})});
  const art=`<div style="max-width:640px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;color:#1f2937"><p style="margin:0 0 6px;font:700 12px Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8a5a17">Coluna</p><h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:#14213a">${esc(F.tit)}</h1>${F.linha?`<p style="margin:0 0 14px;font-size:19px;line-height:1.45;color:#4b5563">${esc(F.linha)}</p>`:""}<p style="margin:0 0 24px;font:600 14px Arial,Helvetica,sans-serif;color:#6b7280">Por ${esc(F.nome)}</p>${tp.innerHTML}<p style="margin:28px 0 0;padding-top:14px;border-top:1px solid #e5e7eb;font-style:italic;font-size:16px;color:#4b5563">${esc(EX133_ASS(F.nome))}</p></div>`;
  return doc?`<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(F.tit)}</title></head><body style="margin:0;padding:24px 16px;background:#ffffff">${art}</body></html>\n`:art}

/* ===== 5. Instagram: carrossel 1080×1350 no canvas ===== */
function ex133Trechos(F){const tp=ex133Tpl(F.html),c=[];let i=0;const tx=s=>String(s||"").replace(/\s+/g," ").trim();
  tp.content.childNodes.forEach(n=>{if(n.nodeType!==1)return;i++;const t=n.tagName;
    if(t==="BLOCKQUOTE"){const s=tx(n.textContent);if(s.length>=20)c.push({s,p:3,i})}
    else if(t==="P"){const fr=ex133Frases(tx(n.textContent));/* negrito: a frase inteira em que ele está (ou o trecho, com maiúscula) */
      n.querySelectorAll("strong").forEach(b=>{let s=tx(b.textContent);if(s.length<40)return;const f=fr.find(x=>x.indexOf(s)>=0);s=f&&f.length<=260?f:s.charAt(0).toLocaleUpperCase("pt-BR")+s.slice(1);c.push({s,p:2,i})});const boa=fr.filter(f=>f.length>=50&&f.length<=260);if(boa.length)c.push({s:boa[0],p:1,i})}});
  const vis=[],sel=[];[...c.filter(x=>x.p>1),...c.filter(x=>x.p===1)].forEach(x=>{if(sel.length>=6)return;const k=norm(x.s);if(vis.some(v=>v.indexOf(k.slice(0,40))>=0||k.indexOf(v.slice(0,40))>=0))return;vis.push(k);sel.push(x)});
  const l=sel.sort((a,b)=>a.i-b.i).map(x=>ex133Corta(x.s,300));if(!l.length&&(F.cham||F.linha))l.push(ex133Corta(F.cham||F.linha,300));return l}
const EX133_SERIF='"Newsreader", Georgia, "Times New Roman", serif',EX133_UI='"Public Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
function ex133Quebra(g,s,w){const out=[];String(s).split("\n").forEach(par=>{let l="";par.split(/\s+/).filter(Boolean).forEach(p=>{const t=l?l+" "+p:p;if(!l||g.measureText(t).width<=w)l=t;else{out.push(l);l=p}});if(l)out.push(l)});return out}
function ex133Cabe(g,s,o){let sz=o.max,ls=[];for(;sz>=o.min;sz-=2){g.font=`${o.peso} ${sz}px ${o.fam}`;ls=ex133Quebra(g,s,o.w);if(ls.length*sz*o.lh<=o.h)break}
  if(sz<o.min){sz=o.min;g.font=`${o.peso} ${sz}px ${o.fam}`;ls=ex133Quebra(g,s,o.w);const cab=Math.max(1,Math.floor(o.h/(sz*o.lh)));if(ls.length>cab){ls=ls.slice(0,cab);ls[cab-1]=ls[cab-1].replace(/\s*\S*$/,"")+"…"}}
  g.fillStyle=o.cor;g.textBaseline="top";ls.forEach((l,i)=>g.fillText(l,o.x,o.y+i*sz*o.lh));return o.y+ls.length*sz*o.lh}
function ex133Linha1(g,s,x,y,w,font,cor){g.font=font;g.fillStyle=cor;g.textBaseline="alphabetic";let t=String(s||"");if(g.measureText(t).width>w){while(t.length>1&&g.measureText(t+"…").width>w)t=t.slice(0,-1);t=t.trimEnd()+"…"}g.fillText(t,x,y)}
function ex133Marca(g,cor,x,y){g.font=`600 50px ${EX133_SERIF}`;g.fillStyle=cor;g.textBaseline="alphabetic";g.textAlign="right";g.fillText("Prumo",x,y);g.textAlign="left"}
function ex133Quadro(tipo,F,i,n,t){const c=document.createElement("canvas");c.width=1080;c.height=1350;const g=c.getContext("2d");if(!g)return c;
  const W=1080,H=1350,M=90,num=(cor)=>{g.font=`600 28px ${EX133_UI}`;g.fillStyle=cor;g.textAlign="right";g.textBaseline="alphabetic";g.fillText(`${i}/${n}`,W-M,110);g.textAlign="left"};
  if(tipo==="capa"){g.fillStyle="#14213a";g.fillRect(0,0,W,H);g.fillStyle="#c9822b";g.fillRect(M,150,120,8);
    g.font=`800 30px ${EX133_UI}`;g.fillStyle="#e6b673";g.textBaseline="alphabetic";try{g.letterSpacing="5px"}catch(e){}g.fillText(F.serie?`COLUNA · ${String(F.serie).toLocaleUpperCase("pt-BR")}`.slice(0,40):"COLUNA",M,225);try{g.letterSpacing="0px"}catch(e){}
    const y=ex133Cabe(g,F.tit,{x:M,y:280,w:W-2*M,h:600,max:104,min:52,peso:600,fam:EX133_SERIF,lh:1.1,cor:"#ffffff"});
    if(F.linha)ex133Cabe(g,F.linha,{x:M,y:y+36,w:W-2*M,h:Math.max(60,1080-y-36),max:42,min:28,peso:400,fam:EX133_SERIF,lh:1.3,cor:"#c5cdd9"});
    g.fillStyle="rgba(255,255,255,.18)";g.fillRect(M,1150,W-2*M,2);ex133Linha1(g,"por "+F.nome,M,1235,W-2*M-220,`700 36px ${EX133_UI}`,"#ffffff");ex133Marca(g,"#e6b673",W-M,1235);num("#93a0b2")}
  else if(tipo==="trecho"){g.fillStyle="#f6f1e7";g.fillRect(0,0,W,H);g.fillStyle="#c9822b";g.fillRect(0,0,W,14);
    g.font=`600 260px ${EX133_SERIF}`;g.fillStyle="#c9822b";g.textBaseline="alphabetic";g.fillText("“",M-10,380);
    ex133Cabe(g,t,{x:M,y:400,w:W-2*M,h:660,max:70,min:36,peso:500,fam:EX133_SERIF,lh:1.28,cor:"#14213a"});
    g.fillStyle="rgba(20,33,58,.15)";g.fillRect(M,1150,W-2*M,2);ex133Linha1(g,F.tit,M,1215,W-2*M-220,`700 28px ${EX133_UI}`,"#14213a");ex133Linha1(g,F.nome,M,1260,W-2*M-220,`500 28px ${EX133_UI}`,"#4b5563");
    ex133Marca(g,"#24406b",W-M,1250);num("#6b7280")}
  else{g.fillStyle="#24406b";g.fillRect(0,0,W,H);g.fillStyle="#c9822b";g.fillRect(M,300,120,8);
    const y=ex133Cabe(g,"Leia a coluna inteira no Prumo",{x:M,y:360,w:W-2*M,h:340,max:96,min:56,peso:600,fam:EX133_SERIF,lh:1.1,cor:"#ffffff"});
    const y2=ex133Cabe(g,`“${F.tit}”`,{x:M,y:y+40,w:W-2*M,h:300,max:46,min:30,peso:400,fam:EX133_SERIF,lh:1.3,cor:"#e3e8f0"});
    ex133Linha1(g,"— "+F.nome,M,Math.min(1080,y2+80),W-2*M,`700 36px ${EX133_UI}`,"#e6b673");ex133Marca(g,"#ffffff",W-M,1235);num("#c5cdd9")}
  return c}
async function ex133Ig(F){const tr=ex133Trechos(F),n=tr.length+2;
  try{if(document.fonts&&document.fonts.load)await Promise.race([Promise.all([document.fonts.load(`600 64px "Newsreader"`),document.fonts.load(`800 30px "Public Sans"`)]),new Promise(r=>setTimeout(r,1500))])}catch(e){}
  const qs=[ex133Quadro("capa",F,1,n)];tr.forEach((t,k)=>qs.push(ex133Quadro("trecho",F,k+2,n,t)));qs.push(ex133Quadro("fim",F,n,n));return qs}
const ex133Blob=c=>new Promise(ok=>{try{c.toBlob(b=>ok(b),"image/png")}catch(e){ok(null)}});
function ex133Legenda(F){return [F.tit,F.cham||F.linha,EX133_COMPLETA,(F.tags||[]).join(" "),EX133_ASS(F.nome)].filter(Boolean).join("\n\n")}

/* zip simples (sem compressão) para baixar o carrossel de uma vez */
const EX133_CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function ex133Crc(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=EX133_CRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
async function ex133Zip(arqs){const enc=new TextEncoder(),pt=[],cd=[];let off=0;
  for(const a of arqs){const d=new Uint8Array(await a.blob.arrayBuffer()),nm=enc.encode(a.nome),crc=ex133Crc(d);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nm.length,true);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    pt.push(h.buffer,nm,d);cd.push(c.buffer,nm);off+=30+nm.length+d.length}
  const cs=cd.reduce((s,b)=>s+b.byteLength,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,arqs.length,true);e.setUint16(10,arqs.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  return new Blob([...pt,...cd,e.buffer],{type:"application/zip"})}

/* ===== 6. copiar, baixar, compartilhar ===== */
async function ex133Copia(txt,html,btn){EX133.ult={txt,html:html||null};let ok=false;
  try{if(html&&navigator.clipboard&&navigator.clipboard.write&&typeof ClipboardItem!=="undefined"){await navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([html],{type:"text/html"}),"text/plain":new Blob([txt],{type:"text/plain"})})]);ok=true}}catch(e){}
  if(!ok&&!html)try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(txt);ok=true}}catch(e){}
  if(!ok)try{const f=ev=>{ev.preventDefault();ev.clipboardData.setData("text/plain",txt);if(html)ev.clipboardData.setData("text/html",html)};document.addEventListener("copy",f,true);try{ok=document.execCommand("copy")}finally{document.removeEventListener("copy",f,true)}}catch(e){}
  if(ok){if(btn&&btn.isConnected){const t0=btn.dataset.ex133t0||btn.textContent;btn.dataset.ex133t0=t0;btn.textContent="Copiado";btn.classList.add("ex133-ok");setTimeout(()=>{if(btn.isConnected){btn.textContent=t0;btn.classList.remove("ex133-ok")}},1800)}toast("Copiado")}
  else toast("Não deu para copiar. Selecione o texto na prévia e copie.");return ok}
function ex133Baixa(blob,nome){try{const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=nome;a.rel="noopener";a.hidden=true;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60e3);return true}catch(e){toast("Não deu para baixar agora.");return false}}
async function ex133Comp(o){if(!navigator.share)return false;try{await navigator.share(o);return true}catch(e){if(e&&e.name!=="AbortError")toast("Não deu para compartilhar. Use Copiar.");return false}}
function ex133Imprime(F){document.getElementById("ex133-print")?.remove();let corpo="";try{corpo=ed132CorpoHTML(F.html,F.x||null,{prev:true})}catch(e){corpo=""}
  if(!corpo){const tp=ex133Tpl(F.html);tp.content.querySelectorAll("figure").forEach(f=>f.remove());corpo=tp.innerHTML}
  const d=document.createElement("div");d.id="ex133-print";d.className="ex133-print";
  d.innerHTML=`<article><p class="ex133-pk">Coluna</p><h1>${esc(F.tit)}</h1>${F.linha?`<p class="ex133-pl">${esc(F.linha)}</p>`:""}<p class="ex133-pb">Por ${esc(F.nome)}</p><div class="ex133-pc">${corpo}</div><p class="ex133-pa">${esc(EX133_ASS(F.nome))}</p></article>`;
  d.querySelectorAll(".cs123-dom,button").forEach(e=>e.remove());document.body.appendChild(d);document.documentElement.classList.add("ex133-imp");
  const fim=()=>{document.documentElement.classList.remove("ex133-imp");document.getElementById("ex133-print")?.remove();removeEventListener("afterprint",fim)};addEventListener("afterprint",fim);
  setTimeout(()=>{try{window.print()}catch(e){toast("Este navegador não imprime daqui.")}setTimeout(fim,1500)},60)}

/* ===== 7. folha "Exportar coluna" ===== */
function ex133DaPub(id){const x=ed132Pub(id),c=x&&cs123Col(x);if(!x||!c)return null;const html=c.html?ed132Limpa(c.html):ed132DeMarkdown(c.corpo);
  return {tit:c.tit,linha:c.linha||"",chamX:c.cham||"",cham:c.cham||cs123Teaser(c.corpo)||c.linha||"",html,nome:nomeDe(x.autor),tags:cs123Tags(ed132Tags(x)),serie:c.serie||"",x}}
function ex133DoEditor(){const E=ed132Le();if(!E)return null;try{ed132LePainel()}catch(e){}const pl=ed132Plano(E.html),ch=String(E.cham||"").trim();
  return {tit:E.tit.trim(),linha:E.linha.trim(),chamX:ch,cham:ch||cs123Teaser(pl)||E.linha.trim(),html:E.html,nome:nomeDe(S.uid),tags:cs123Tags(E.tags),serie:String(E.serie||"").trim(),x:null}}
function ex133Exportar(F){if(!F)return;if(!F.tit){toast("Dê um título à coluna antes de exportar.");return}if(ed132Vazio(F.html)){toast("Escreva o texto da coluna antes de exportar.");return}
  EX133.F=F;EX133.dest="";EX133.x=[];EX133.ig=[];EX133.igb=[];ex133LimpaIg();ex133Lista();try{uso("coluna_exportar")}catch(e){}}
function ex133Lista(){EX133.dest="";ex133Folha("Exportar coluna",`<p class="hint ex133-int">Tudo sai pronto para colar, salvar ou compartilhar, com a assinatura “publicado originalmente no Prumo”. As redes não deixam publicar direto daqui.</p>
  <div class="ex133-l">${EX133_DEST.map(([k,t,d,ic])=>`<button type="button" data-ex133d="${k}"><span class="ex133-li">${ed132Svg(EX133_IC[ic])}</span><span class="ex133-lt"><b>${t}</b><small>${esc(d)}</small></span><i aria-hidden="true">›</i></button>`).join("")}</div>`)}
const ex133Volta=()=>`<button type="button" class="ex133-vl" data-ex133lista>‹ Todos os destinos</button>`;
const ex133Seg=(k,ops,v)=>`<div class="ex133-seg" role="tablist">${ops.map(([o,t])=>`<button type="button" role="tab" data-ex133seg="${k}" data-v="${o}" aria-selected="${o===v}">${t}</button>`).join("")}</div>`;
const ex133Pre_=(t,id)=>`<pre class="ex133-tx"${id?` id="${id}"`:""}>${esc(t)}</pre>`;
function ex133LimpaIg(){(EX133.igU||[]).forEach(u=>{try{URL.revokeObjectURL(u)}catch(e){}});EX133.igU=[]}
function ex133Dest(k){const F=EX133.F;if(!F)return;EX133.dest=k;const nm=(EX133_DEST.find(d=>d[0]===k)||[])[1]||"Exportar";let b="",f="";
  if(k==="email"){b=`<p class="hint">Cole no Gmail ou no Outlook: vai com títulos, negrito, links e citações. Fotos e gráficos ficam só no Prumo.</p><div class="ex133-mail" inert>${ex133Email(F,false)}</div>`;
    f=`<button type="button" class="btn ghost" data-ex133a="emailhtml">Baixar .html</button><button type="button" class="btn" data-ex133a="emailcp">Copiar</button>`}
  else if(k==="linkedin"){const L=ex133Li(F),art=EX133.li==="art",t=art?ex133Inteiro(F,"li"):L.t;
    b=`${ex133Seg("li",[["post","Post"],["art","Artigo"]],art?"art":"post")}
      ${art?`<p class="hint">Para um artigo no LinkedIn (Escrever artigo): copia o texto inteiro, com títulos e links. O post comum aceita até 3.000 caracteres.</p>`
        :L.curta?`<p class="ex133-av" role="status">O texto inteiro tem ${cs123Num(L.n)} caracteres e o post do LinkedIn aceita até 3.000. Esta é a versão curta: chamada e os 3 primeiros parágrafos. Para o texto inteiro, use “Artigo”.</p>`:`<p class="hint">Títulos em maiúsculas e listas com “•”, porque o LinkedIn não tem formatação no post.</p>`}
      ${ex133Pre_(t,"ex133-lit")}<p class="ex133-cc" data-ex133n="${t.length}">${cs123Num(t.length)}${art?"":" / 3.000"} caracteres</p>`;
    f=`<button type="button" class="btn" data-ex133a="licp">Copiar</button>`}
  else if(k==="x"){if(!EX133.x.length)EX133.x=ex133Fio(F);
    b=`<p class="hint">${EX133.x.length} posts de até 280 caracteres, quebrados nas frases. Dá para mexer em cada um antes de copiar.</p><ol class="ex133-xl">${EX133.x.map((p,i)=>`<li><textarea data-ex133xt="${i}" rows="5" aria-label="Post ${i+1}">${esc(p)}</textarea><span class="ex133-xr"><small data-ex133xc="${i}" class="${p.length>280?"ex133-mx":""}">${p.length}/280</small><button type="button" class="btn ghost" data-ex133xcp="${i}">Copiar</button></span></li>`).join("")}</ol>`;
    f=`<button type="button" class="btn ghost" data-ex133a="xrefaz">Refazer o fio</button><button type="button" class="btn" data-ex133a="xcp">Copiar tudo</button>`}
  else if(k==="ig"){const cap=ex133Legenda(F),fs=typeof navigator.canShare==="function"&&typeof File!=="undefined";
    b=`<p class="hint">Capa com título e autora, um trecho forte por quadro e, no fim, “Leia no Prumo”. Imagens de 1080×1350 (retrato).</p>
      <div class="ex133-ig" data-ex133ig aria-live="polite"><p class="hint">Montando as imagens…</p></div>
      <div class="ex133-bts ex133-bts2"><button type="button" class="btn ghost" data-ex133a="igum">Baixar uma por vez</button>${fs?`<button type="button" class="btn ghost" data-ex133a="igsh" hidden>Compartilhar</button>`:""}</div>
      <h4 class="ex133-h4">Legenda</h4>${ex133Pre_(cap,"ex133-igc")}<div class="ex133-bts ex133-bts2"><button type="button" class="btn ghost" data-ex133a="igcap">Copiar legenda</button></div>`;
    f=`<button type="button" class="btn" data-ex133a="igzip">Baixar todas (.zip)</button>`}
  else if(k==="fb"||k==="wa"){const tudo=EX133[k]==="i",t=tudo?ex133Inteiro(F,k==="wa"?"wa":"tx"):ex133Trecho(F,k==="wa"?"wa":"tx",3,k==="wa"?1200:1500);
    b=`${ex133Seg(k,[["t","Chamada e trecho"],["i","Texto inteiro"]],tudo?"i":"t")}<p class="hint">${k==="wa"?"Com *negrito* e _itálico_ do WhatsApp. ":""}${navigator.share?"Compartilhar abre a lista de apps do aparelho.":"Copie e cole no "+(k==="wa"?"WhatsApp":"Facebook")+"."}</p>${ex133Pre_(t,"ex133-"+k+"t")}`;
    f=`${k==="wa"?`<a class="btn ghost" data-ex133wa href="https://wa.me/?text=${encodeURIComponent(t)}" target="_blank" rel="noopener">Abrir no WhatsApp</a>`:""}${navigator.share?`<button type="button" class="btn ghost" data-ex133a="${k}sh">Compartilhar</button>`:""}<button type="button" class="btn" data-ex133a="${k}cp">Copiar</button>`}
  else if(k==="pdf"){b=`<p class="hint">Abre a impressão com a coluna numa folha limpa (título, autora, texto, fotos e gráficos). Para PDF, escolha “Salvar como PDF” no destino da impressão.</p>
      <div class="ex133-mail ex133-pdfp" inert>${ex133Email(F,false)}</div>`;f=`<button type="button" class="btn" data-ex133a="pdf">Imprimir ou salvar em PDF</button>`}
  else if(k==="md"){const t=ex133Md(F);b=`<p class="hint">Para Substack, Medium, Notion, GitHub ou qualquer editor que aceite Markdown.</p>${ex133Pre_(t,"ex133-mdt")}`;
    f=`<button type="button" class="btn ghost" data-ex133a="mdbx">Baixar .md</button><button type="button" class="btn" data-ex133a="mdcp">Copiar</button>`}
  ex133Folha("Exportar coluna",`${ex133Volta()}<h3 class="ex133-dt">${esc(nm)}</h3>${b}`,`<div class="ex133-bts">${f}</div>`);
  if(k==="ig")ex133IgDesenha()}
async function ex133IgDesenha(){const F=EX133.F,T=++EX133.igT;let qs=EX133.ig;if(!qs.length){qs=await ex133Ig(F);if(T!==EX133.igT)return;EX133.ig=qs;EX133.igb=await Promise.all(qs.map(ex133Blob))}
  if(T!==EX133.igT||EX133.dest!=="ig")return;const el=document.querySelector("[data-ex133ig]");if(!el)return;ex133LimpaIg();
  el.innerHTML=EX133.igb.map((b,i)=>{let u="";try{u=b?URL.createObjectURL(b):qs[i].toDataURL("image/png")}catch(e){}if(b)EX133.igU.push(u);return `<button type="button" class="ex133-igq" data-ex133igq="${i}" aria-label="Baixar a imagem ${i+1}"><img src="${u}" alt="Quadro ${i+1} de ${qs.length}" width="1080" height="1350"></button>`}).join("");
  const sh=document.querySelector('[data-ex133a="igsh"]');if(sh)try{const fs=ex133IgArqs().map(a=>new File([a.blob],a.nome,{type:"image/png"}));if(navigator.canShare({files:fs}))sh.hidden=false}catch(e){}}
function ex133IgArqs(){const s=ex133Slug(EX133.F&&EX133.F.tit);return EX133.igb.map((b,i)=>b?{nome:`${s}-${String(i+1).padStart(2,"0")}.png`,blob:b}:null).filter(Boolean)}

/* ===== 8. botões: na página da coluna (só a autora), no editor e na folha ===== */
{const _l=cs123LerHTML;cs123LerHTML=function(x,c,o){const h=_l.apply(this,arguments);try{if(!(o&&o.prev)&&x&&S.uid&&x.autor===S.uid&&c)return h.replace(/(<span class="cs123-tk">[^<]*<\/span>)/,`$1<button type="button" class="ex133-eb" data-ex133exp="${esc(x.id)}" aria-label="Exportar a coluna">${ed132Svg(EX133_IC.exp)}<span>Exportar</span></button>`)}catch(e){}return h}}
{const _d=ed132Desenha;ed132Desenha=function(){const r=_d.apply(this,arguments);try{const m=$("#layer > .ed132 .ed132-m");if(m&&!m.querySelector("[data-ex133imp]"))m.querySelector(".ed132-seg")?.insertAdjacentHTML("afterend",`<button type="button" class="ex133-ib" data-ex133imp>${ed132Svg(EX133_IC.arq)}<span>Importar</span></button>`)}catch(e){}return r}}
{const _m=ed132Mais;ed132Mais=function(){const r=_m.apply(this,arguments);try{const o=document.querySelector("#layer2 .sheet .opt")||document.querySelector(".sheet .opt");
  if(o&&!o.querySelector("[data-ex133imp]"))o.insertAdjacentHTML("afterbegin",`<button type="button" data-ex133imp>Importar texto<span>de um arquivo .docx, .md, .html ou .txt, ou colado</span></button><button type="button" data-ex133expe>Exportar<span>e-mail, LinkedIn, X, Instagram, WhatsApp, PDF…</span></button>`)}catch(e){}return r}}
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(b=t.closest("[data-ex133exp]")){pare();ex133Exportar(ex133DaPub(b.dataset.ex133exp));return}
  if(t.closest("[data-ex133imp]")){pare();if(!ED132.E)return;if($("#layer2")?.innerHTML){closeLayer();setTimeout(ex133Importar,60)}else ex133Importar();return}
  if(t.closest("[data-ex133expe]")){pare();closeLayer();setTimeout(()=>ex133Exportar(ex133DoEditor()),60);return}
  if(t.closest("[data-ex133arq]")){pare();ex133Arquivo();return}
  if(b=t.closest("[data-ex133ap]")){pare();ex133Aplica(b.dataset.ex133ap==="add"?"add":"sub");return}
  if(!EX133.F)return;
  if(t.closest("[data-ex133lista]")){pare();ex133Lista();return}
  if(b=t.closest("[data-ex133d]")){pare();ex133Dest(b.dataset.ex133d);return}
  if(b=t.closest("[data-ex133seg]")){pare();EX133[b.dataset.ex133seg]=b.dataset.v;ex133Dest(EX133.dest);return}
  if(b=t.closest("[data-ex133xcp]")){pare();const i=+b.dataset.ex133xcp;ex133Copia(EX133.x[i]||"",null,b);return}
  if(b=t.closest("[data-ex133igq]")){pare();const a=ex133IgArqs()[+b.dataset.ex133igq];if(a)ex133Baixa(a.blob,a.nome);return}
  if(t.closest("[data-ex133wa]")){try{uso("coluna_exportada_wa")}catch(_){}return}
  if(!(b=t.closest("[data-ex133a]")))return;pare();const F=EX133.F,a=b.dataset.ex133a,s=ex133Slug(F.tit);
  if(a==="emailcp")ex133Copia(ex133Inteiro(F,"tx"),ex133Email(F,false),b);
  else if(a==="emailhtml")ex133Baixa(new Blob([ex133Email(F,true)],{type:"text/html;charset=utf-8"}),s+".html");
  else if(a==="licp"){if(EX133.li==="art")ex133Copia(ex133Inteiro(F,"li"),ex133Email(F,false),b);else ex133Copia(ex133Li(F).t,null,b)}
  else if(a==="xcp")ex133Copia(EX133.x.join("\n\n"),null,b);
  else if(a==="xrefaz"){EX133.x=ex133Fio(F);ex133Dest("x")}
  else if(a==="igcap")ex133Copia(ex133Legenda(F),null,b);
  else if(a==="igzip"){const l=ex133IgArqs();if(!l.length){toast("Espere as imagens ficarem prontas.");return}ex133Zip(l).then(z=>ex133Baixa(z,s+"-instagram.zip"))}
  else if(a==="igum"){const l=ex133IgArqs();if(!l.length){toast("Espere as imagens ficarem prontas.");return}l.forEach((x,i)=>setTimeout(()=>ex133Baixa(x.blob,x.nome),i*450))}
  else if(a==="igsh"){const fs=ex133IgArqs().map(x=>new File([x.blob],x.nome,{type:"image/png"}));ex133Comp({files:fs,title:F.tit,text:ex133Legenda(F)})}
  else if(a==="fbcp"||a==="wacp"||a==="fbsh"||a==="wash"){const k=a.slice(0,2),t=EX133[k]==="i"?ex133Inteiro(F,k==="wa"?"wa":"tx"):ex133Trecho(F,k==="wa"?"wa":"tx",3,k==="wa"?1200:1500);
    if(/sh$/.test(a))ex133Comp({title:F.tit,text:t});else ex133Copia(t,null,b)}
  else if(a==="pdf")ex133Imprime(F);
  else if(a==="mdcp")ex133Copia(ex133Md(F),null,b);
  else if(a==="mdbx")ex133Baixa(new Blob([ex133Md(F)],{type:"text/markdown;charset=utf-8"}),s+".md")},true);
/* fio do X editável */
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.dataset||t.dataset.ex133xt===undefined)return;const i=+t.dataset.ex133xt;EX133.x[i]=t.value;const c=document.querySelector(`[data-ex133xc="${i}"]`);
  if(c){c.textContent=`${t.value.length}/280`;c.classList.toggle("ex133-mx",t.value.length>280)}});
/* colar na caixa de importar */
document.addEventListener("paste",e=>{const cx=e.target&&e.target.closest&&e.target.closest("#ex133-cola");if(!cx)return;e.preventDefault();e.stopPropagation();const dt=e.clipboardData;if(!dt||!ED132.E)return;
  const h=dt.getData("text/html"),t=dt.getData("text/plain");const r=h?{html:h,sem:ex133ContaImg(h)}:t?ex133DeTxt(t):null;if(!r)return;closeLayer();setTimeout(()=>ex133Previa(r,""),60)},true);
