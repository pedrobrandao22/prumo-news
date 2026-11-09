/* ---------- 141: abertura estável (a Capa não pisca ao abrir o app) ----------
   O Pedro: "o app pisca muito quando abrimos ele". Na abertura, a Capa era trocada inteira (innerHTML do #v-capa) 3 a 5 vezes:
   esqueleto de novo, o leve, o indicadores.json, o fotos-arquivo.json e o Feed adiado (RF_REAL). A cada troca as fotos eram
   criadas de novo (voltavam a opacidade 0 e entravam com fade), a faixa "Agora" recomeçava e o que mudava de tamanho pulava.
   Agora o primeiro desenho com conteúdo continua sendo a troca do esqueleto pela Capa; os seguintes viram atualização no lugar:
   renderCapa monta a Capa nova como sempre (com todos os complementos), e ela é comparada com a que está na tela, nó a nó:
   - o que não mudou desde o último desenho fica como está (inclusive o que mudou depois dele, como a foto já carregada);
   - foto com o mesmo endereço do desenho anterior fica (não baixa nem esmaece de novo);
   - atributos e textos que mudaram são trocados; blocos novos entram e os que saíram saem.
   Também (031): renderCapa sem edição com o esqueleto já na tela não refaz o esqueleto; "ab141-abrindo" sai quando a Capa assenta. */
var ab141Base=null,ab141Orig=new WeakMap();
function ab141Chave(n){if(n.nodeType!==1)return "#"+n.nodeType;const g=a=>n.getAttribute(a)||"";
  return n.tagName+"|"+(n.id||g("data-capmat")||g("data-cpmat")||g("data-cpx")||g("data-capair")||g("data-cobpag")||g("data-capasec")||g("data-agi"))+"|"+g("class").split(" ")[0]}
function ab141Marca(raiz){if(!raiz||raiz.nodeType!==1)return;(raiz.tagName==="IMG"?[raiz]:raiz.querySelectorAll("img")).forEach(i=>{if(!ab141Orig.has(i))ab141Orig.set(i,i.getAttribute("src"))})}
/* vivo: o nó da tela; base: o mesmo nó no desenho anterior (como saiu do renderCapa); novo: o do desenho de agora */
function ab141Mescla(vivo,base,novo){
  if(base&&base.isEqualNode(novo))return;
  if(vivo.nodeType!==1){if(vivo.nodeValue!==novo.nodeValue)vivo.nodeValue=novo.nodeValue;return}
  if(vivo.tagName==="IMG"){const o=ab141Orig.has(vivo)?ab141Orig.get(vivo):base?base.getAttribute("src"):vivo.getAttribute("src");
    if(o===novo.getAttribute("src"))return;vivo.replaceWith(novo);ab141Marca(novo);return}
  for(const a of [...novo.attributes]){if(vivo.getAttribute(a.name)===a.value)continue;if(base&&base.getAttribute(a.name)===a.value)continue;vivo.setAttribute(a.name,a.value)}
  for(const a of [...vivo.attributes]){if(novo.hasAttribute(a.name)||(base&&!base.hasAttribute(a.name)))continue;vivo.removeAttribute(a.name)}
  ab141Filhos(vivo,base,novo)}
function ab141Filhos(vivo,base,novo){const fila=new Map();
  if(base)for(let c=base.firstChild;c;c=c.nextSibling){const k=ab141Chave(c);if(!fila.has(k))fila.set(k,[]);fila.get(k).push(c)}
  let i=vivo.firstChild,j=novo.firstChild;
  while(j){const nj=j.nextSibling,k=ab141Chave(j);let m=i,n=0;while(m&&n<12&&ab141Chave(m)!==k){m=m.nextSibling;n++}
    const b=(fila.get(k)||[]).shift()||null;
    if(m&&ab141Chave(m)===k){while(i!==m){const x=i.nextSibling;vivo.removeChild(i);i=x}const nx=m.nextSibling;ab141Mescla(m,b,j);i=nx}
    else{vivo.insertBefore(j,i);ab141Marca(j)}
    j=nj}
  while(i){const x=i.nextSibling;vivo.removeChild(i);i=x}}
function ab141Raiz(v){const r=v&&v.childElementCount===1?v.firstElementChild:null;return r&&r.classList.contains("cp")&&r.querySelector(".cpi")?r:null}
{const _rc141=renderCapa;renderCapa=function(){const v=document.getElementById("v-capa");if(!v)return _rc141.apply(this,arguments);
  const vivo=ab141Raiz(v),r=_rc141.apply(this,arguments),novo=ab141Raiz(v);
  if(!novo)return r;
  if(vivo&&novo!==vivo&&ab141Chave(vivo)===ab141Chave(novo)){const base=ab141Base;ab141Base=novo.cloneNode(true);
    try{ab141Mescla(vivo,base,novo);v.replaceChild(vivo,novo)}catch(e){ab141Base=novo.cloneNode(true);if(vivo.parentNode!==v&&novo.parentNode!==v)v.appendChild(novo)}
    try{if(typeof capaObservar==="function")capaObservar()}catch(e){}}
  else if(novo!==vivo){ab141Base=novo.cloneNode(true);ab141Marca(novo)}
  return r}}
/* a Capa que já estava desenhada (edição guardada no aparelho, antes destes complementos) vira a base da comparação */
{const r=ab141Raiz(document.getElementById("v-capa"));if(r){ab141Base=r.cloneNode(true);ab141Marca(r)}}
/* fim da abertura: as transições da barra de abas voltam quando a Capa já tem conteúdo (ou depois de 8 s, em último caso) */
(function(){const fim=()=>{document.documentElement.classList.remove("ab141-abrindo")};let n=0;
  const olha=()=>{if(document.querySelector("#v-capa .cpi,#posts .post")||VIEW!=="capa"||++n>80){requestAnimationFrame(()=>requestAnimationFrame(fim));return}setTimeout(olha,100)};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",olha,{once:true});else olha()})();
