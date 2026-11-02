/* ---------- preferências ---------- */
function aplicarFonte(){document.documentElement.style.setProperty("--fz",String(PREF.fonte||1));document.documentElement.classList.toggle("fzg",(PREF.fonte||1)>=1.2);aplicarTema()}
function aplicarTema(){const t=PREF.tema||"auto",r=document.documentElement;if(t==="auto")r.removeAttribute("data-aparencia");else r.setAttribute("data-aparencia",t);r.removeAttribute("data-tema");const esc2=t==="escuro"||(t==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",esc2?"#000000":"#f3f4f6")}
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",aplicarTema)}catch(e){}
let prefTimer=null;
function salvarPrefs(){PREF.mod=Date.now();lsSet("radar-prefs",PREF);clearTimeout(prefTimer);if(!S.db||!S.uid||!S.membro)return;prefTimer=setTimeout(async()=>{try{await S.db.doc(`data/users/${S.uid}/prefs`).set(JSON.parse(JSON.stringify(PREF)))}catch(e){}},1500)}

