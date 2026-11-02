const $=s=>document.querySelector(s);
var RAIZ="feed",JUMPS=[],FST=0,PUSHQ=0,HST=0,VST=0,TST=0,IGN=0,NOVO=null,BACKN=0,BACKT=0,VIRA_T=0,FEED_Y=0;
const arrL=x=>Array.isArray(x)?x.filter(l=>l&&typeof l==="object"):[];
const escU=u=>{const t=String(u??"").trim();return /^https?:\/\//i.test(t)?esc(t):"#"};
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const lsArr=(k)=>{const v=lsGet(k,[]);return Array.isArray(v)?v:[]};
const lsObj=(k)=>{const v=lsGet(k,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{}};
const clone=x=>{try{return structuredClone(x)}catch(e){try{return JSON.parse(JSON.stringify(x))}catch(_){return x}}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const safeId=s=>String(s||"x").replace(/[^A-Za-z0-9_\-.~:@+]/g,"-").slice(0,120)||"x";
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();

%%ILL%%
function sceneOf(img){const f=ILL[img?.modelo]||ILL.generica;try{return f(img?.dados||{})}catch(e){return ILL.generica({})}}
const svgOf=img=>`<svg viewBox="0 0 400 240" role="img" aria-label="${esc(img?.alt||"Ilustração")}"><rect class="ib" width="400" height="240"/>${sceneOf(img)}</svg>`;
const coverSvg=img=>`<svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMin slice" role="img" aria-label="${esc(img?.alt||"Ilustração")}"><rect class="ib" width="400" height="320"/><g transform="translate(0,6)">${sceneOf(img)}</g></svg>`;

