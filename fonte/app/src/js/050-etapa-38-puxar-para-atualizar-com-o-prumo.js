/* ---------- Etapa 38: puxar para atualizar com o prumo ---------- */
window.PTR_NOVO=1;
(()=>{const app=document.querySelector(".app");if(!app)return;
  const ind=document.createElement("div");ind.className="ptr2";ind.setAttribute("aria-hidden","true");
  ind.innerHTML='<span class="ptr2-p"><svg viewBox="0 0 64 112"><rect x="14" y="0" width="36" height="7" rx="1.5"/><rect x="29.5" y="6" width="5" height="46"/><path d="M18 60H46L52 74L32 112L12 74Z"/></svg></span><span class="ptr2-t"></span>';document.body.appendChild(ind);
  const txt=ind.querySelector(".ptr2-t");let y0=null,x0=0,r=0,pronto=false,ocupado=false,raf=0,ult=null;
  const LIM=76,SEG=70;
  const pinta=()=>{raf=0;if(!ult)return;const {r,dx}=ult;app.style.transform=`translate3d(0,${r}px,0)`;ind.style.opacity=String(Math.min(1,r/38));
    ind.style.transform=`translate3d(-50%,${Math.min(r,LIM+20)-52}px,0) rotate(${Math.max(-10,Math.min(10,dx*.06))}deg)`};
  const volta=()=>{app.classList.add("ptr-volta");ind.classList.add("ptr-volta");app.style.transform="";ind.style.opacity="0";ind.style.transform="";
    setTimeout(()=>{app.classList.remove("ptr-volta");ind.classList.remove("ptr-volta","pronto","balanca","feito");txt.textContent=""},420)};
  const pode=e=>!ocupado&&(VIEW==="feed"||VIEW==="capa")&&scrollY<=1&&!temJanela()&&e.touches.length===1&&!e.target.closest(".track,.secs,#secs,.tk-vp,.ag-vp,.segs,input,textarea,.gr-box");
  addEventListener("touchstart",e=>{y0=null;if(!pode(e))return;y0=e.touches[0].clientY;x0=e.touches[0].clientX;r=0;pronto=false},{passive:true});
  addEventListener("touchmove",e=>{if(y0==null)return;const t=e.touches[0],dy=t.clientY-y0,dx=t.clientX-x0;
    if(r===0&&(dy<=0||Math.abs(dx)>Math.abs(dy))){if(Math.abs(dx)>10||dy<-6)y0=null;return}
    if(scrollY>1){y0=null;volta();return}
    r=Math.max(0,140*(1-Math.exp(-Math.max(0,dy)/260)));const p=r>=LIM;
    if(p!==pronto){pronto=p;ind.classList.toggle("pronto",p);txt.textContent=p?"Solte para atualizar":"";if(p)try{vibrar(6)}catch(_){}}
    ult={r,dx};if(!raf)raf=requestAnimationFrame(pinta)},{passive:true});
  const solta=async()=>{if(y0==null)return;y0=null;cancelAnimationFrame(raf);raf=0;if(!pronto){volta();return}
    ocupado=true;app.classList.add("ptr-volta");ind.classList.add("ptr-volta","balanca");app.style.transform=`translate3d(0,${SEG}px,0)`;ind.style.opacity="1";ind.style.transform=`translate3d(-50%,${SEG-52}px,0)`;txt.textContent="Atualizando…";
    setTimeout(()=>{app.classList.remove("ptr-volta");ind.classList.remove("ptr-volta")},420);
    const t0=Date.now();let novaVer=false;
    try{await Promise.all([Promise.resolve(checarFeed(true)).catch(()=>{}),Promise.resolve(typeof checarVersao==="function"?checarVersao():0).catch(()=>{})]);novaVer=!!VERSAO_NOVA}catch(_){}
    await new Promise(z=>setTimeout(z,Math.max(0,900-(Date.now()-t0))));
    if(novaVer){txt.textContent="Nova versão…";try{sessionStorage.setItem("prumo-recarregou",VERSAO_NOVA)}catch(_){}location.reload();return}
    ind.classList.remove("balanca");ind.classList.add("feito");txt.textContent="Em dia";await new Promise(z=>setTimeout(z,450));volta();setTimeout(()=>{ocupado=false},430)};
  addEventListener("touchend",solta,{passive:true});addEventListener("touchcancel",solta,{passive:true});
})();

