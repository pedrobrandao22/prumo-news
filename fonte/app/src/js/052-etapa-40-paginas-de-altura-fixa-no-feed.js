/* ---------- Etapa 40: páginas de altura fixa no Feed ---------- */
function pgCabe(pg,H){return pg.scrollHeight<=H+1}
var PG_RE=null;function pgFrases(t){if(PG_RE===null){try{PG_RE=new RegExp("(?"+"<=[.!?;:])\\s+")}catch(e){PG_RE=false}}
  if(PG_RE)return t.split(PG_RE);const out=[];let ini=0;const re=/[.!?;:]\s+/g;let m;while((m=re.exec(t))){out.push(t.slice(ini,m.index+1));ini=m.index+m[0].length}out.push(t.slice(ini));return out}
/* move o conteúdo de src (fora da tela) para dst (dentro da página) até não caber; true = moveu tudo */
function pgEncher(src,dst,pg,H){
  while(src.firstChild){const n=src.firstChild;
    if(n.nodeType===3){const ps=pgFrases(n.data);n.remove();let i=0;
      for(;i<ps.length;i++){const tn=document.createTextNode((i&&ps[i]?" ":"")+ps[i]);dst.appendChild(tn);if(!pgCabe(pg,H)){tn.remove();break}}
      if(i<ps.length){let resto=ps.slice(i).join(" ");
        const ws=ps[i].split(/\s+/);let j=0,acc="";for(;j<ws.length;j++){const tn=document.createTextNode((i||j?" ":"")+acc+ws[j]);dst.appendChild(tn);const ok=pgCabe(pg,H);tn.remove();if(!ok)break;acc+=ws[j]+" "}
        if(j>0){dst.appendChild(document.createTextNode((i?" ":"")+acc.trim()));resto=[ws.slice(j).join(" "),...ps.slice(i+1)].join(" ")}
        src.insertBefore(document.createTextNode(resto),src.firstChild);return false}
      continue}
    dst.appendChild(n);if(pgCabe(pg,H))continue;n.remove();
    if(n.nodeType!==1||n.matches("button,a,svg,img,time,canvas,figure,table,.gr,.gr-box,.nums")||(n.textContent||"").trim().length<50){src.insertBefore(n,src.firstChild);return false}
    const cl=n.cloneNode(false);dst.appendChild(cl);const tudo=pgEncher(n,cl,pg,H);if(!cl.firstChild||!cl.textContent.trim())cl.remove();
    if(!tudo){src.insertBefore(n,src.firstChild);return false}}
  return true}
function paginarTrack(t){try{const H=parseInt(getComputedStyle(t).getPropertyValue("--slh"));if(!H||t.dataset.pag===String(H))return;
  let mudou=false;
  [...t.children].forEach(sl=>{if(!sl.classList.contains("txs")||sl.classList.contains("pag"))return;
    sl.classList.remove("aberto");const nat=(()=>{sl.style.maxHeight="none";sl.style.minHeight="0";const h=sl.scrollHeight;sl.style.maxHeight="";sl.style.minHeight="";return h})();
    if(nat<=H+1){sl.classList.remove("ovf");return}
    const lbl=sl.querySelector(":scope > .lbl"),lab=lbl?lbl.textContent.trim():"";
    const src=sl.cloneNode(true);src.querySelectorAll(":scope > .lermais").forEach(x=>x.remove());
    let n=0;while(src.firstChild&&n++<14){const pg=sl.cloneNode(false);pg.classList.remove("ovf","aberto");pg.classList.add("pag");
      if(n>1&&lab)pg.insertAdjacentHTML("beforeend",`<span class="lbl">${esc(lab)} <em>· continua</em></span>`);
      t.insertBefore(pg,sl);const base=pg.childNodes.length;const tudo=pgEncher(src,pg,pg,H);
      if(!tudo&&pg.childNodes.length===base&&src.firstChild)pg.appendChild(src.firstChild);
      if(tudo)break}
    sl.remove();mudou=true});
  t.dataset.pag=String(H);
  if(mudou){const post=t.closest(".post");if(post){const k=t.children.length;let d=post.querySelector(".pdots");
    if(!d&&k>1){const sv=post.querySelector('.acts [data-a="save"]');if(sv){sv.insertAdjacentHTML("beforebegin",`<div class="prog pdots" aria-hidden="true"></div>`);d=post.querySelector(".pdots")}}
    if(d){const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth));d.innerHTML=Array.from({length:k},(_,j)=>`<i class="${j<=i?"on":""}"></i>`).join("")+`<span class="pg">${i+1}/${k}</span>`;pgDots(t)}}
    const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth)),s0=t.children[i];if(s0&&s0.offsetHeight)t.style.height=s0.offsetHeight+"px"}}catch(e){}}
/* pontinhos no estilo Instagram: no máximo 5 à vista, os da ponta menores */
function pgDots(t){const post=t.closest(".post");const d=post&&post.querySelector(".pdots");if(!d)return;const ds=[...d.querySelectorAll("i")],k=ds.length;d.classList.toggle("muitos",k>5);if(k<=5)return;
  const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth));let a=Math.max(0,Math.min(i-2,k-5));ds.forEach((x,j)=>{const v=j>=a&&j<a+5;x.classList.toggle("dv",v);x.classList.toggle("dpq",v&&((j===a&&a>0)||(j===a+4&&a+5<k)))})}
document.addEventListener("scroll",e=>{const t=e.target;if(t&&t.classList&&t.classList.contains("track")&&t.closest(".post"))requestAnimationFrame(()=>pgDots(t))},true);
{const _ft=fitTrack;fitTrack=function(t){const r=_ft.apply(this,arguments);if(t&&t.closest&&t.closest(".post")){if(document.fonts&&document.fonts.status!=="loaded")document.fonts.ready.then(()=>paginarTrack(t));else paginarTrack(t)}return r}}

