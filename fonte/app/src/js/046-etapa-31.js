/* ---------- Etapa 31 ---------- */
/* cartão do resumo (imagem) para mandar no WhatsApp */
function quebraLinhas(ctx,t,w){const ps=String(t).split(/\s+/),L=[];let l="";ps.forEach(p=>{const x=l?l+" "+p:p;if(ctx.measureText(x).width>w&&l){L.push(l);l=p}else l=x});if(l)L.push(l);return L}
function cartaoResumo(){const its=(FEED&&FEED.resumo_dia&&Array.isArray(FEED.resumo_dia.itens)?FEED.resumo_dia.itens:[]).filter(x=>x&&x.texto).slice(0,6);if(!its.length)return null;
  const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  const SER='Georgia,"Times New Roman",serif',SAN='-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  g.fillStyle="#f3f4f6";g.fillRect(0,0,W,H);g.fillStyle="#ffffff";g.beginPath();g.roundRect?g.roundRect(48,250,W-96,H-380,36):g.rect(48,250,W-96,H-380);g.fill();
  g.fillStyle="#0f1522";g.font=`700 104px ${SER}`;g.textAlign="center";const wm="prumo";const ww=g.measureText(wm).width;g.fillText(wm,W/2-40,140);
  g.fillStyle="#b07a2a";g.font=`800 30px ${SAN}`;g.textAlign="left";g.fillText("NEWS",W/2-40+ww/2+12,140);
  g.textAlign="center";g.fillStyle="#5b6472";g.font=`700 30px ${SAN}`;g.fillText(capaEdicao().toUpperCase(),W/2,200);
  g.fillStyle="#0f1522";g.fillRect(96,222,W-192,4);
  g.textAlign="left";g.fillStyle="#9a6a1f";g.font=`800 32px ${SAN}`;g.fillText(resumoTitulo().toUpperCase(),100,320);
  let fs=44,lin;const corta=(l,n)=>l.length>n?[...l.slice(0,n-1),l[n-1].replace(/\s*\S*$/,"")+"…"]:l;for(;fs>=30;fs-=2){g.font=`600 ${fs}px ${SAN}`;lin=its.map(x=>corta(quebraLinhas(g,x.texto,W-300),3));const tot=lin.reduce((a,l)=>a+l.length,0)*fs*1.28+its.length*fs*0.9;if(tot<H-560)break}if(fs<30){fs=30;g.font=`600 30px ${SAN}`;for(const mx of [3,2,1]){lin=its.map(x=>corta(quebraLinhas(g,x.texto,W-300),mx));if(lin.reduce((a,l)=>a+l.length,0)*fs*1.28+its.length*fs*0.9<H-560)break}}
  let y=400;its.forEach((x,i)=>{g.fillStyle="#b07a2a";g.font=`700 ${fs+6}px ${SER}`;g.fillText(String(i+1),100,y);g.fillStyle="#0f1522";g.font=`600 ${fs}px ${SAN}`;
    lin[i].forEach((l,j)=>{g.fillText(l,170,y+j*fs*1.28)});y+=lin[i].length*fs*1.28+fs*0.9;if(i<its.length-1){g.fillStyle="#e5e7eb";g.fillRect(170,y-fs*0.95,W-270,2)}});
  g.textAlign="center";g.fillStyle="#0f1522";g.font=`800 36px ${SAN}`;g.fillText("prumonews.com.br",W/2,H-60);
  return c}
var RES_ARQ=null,RES_P=null;
function prepararResumo(){if(RES_P)return RES_P;const c=cartaoResumo();if(!c)return Promise.resolve(null);RES_P=new Promise(r=>c.toBlob(b=>{RES_ARQ=b?new File([b],"prumo-1-minuto.png",{type:"image/png"}):null;r(RES_ARQ)},"image/png"));return RES_P}
document.addEventListener("pointerdown",e=>{if(e.target&&e.target.closest&&e.target.closest("[data-1mshare]"))prepararResumo()},true);
async function mandarResumo(){uso("capa_1min_mandar");const file=RES_ARQ||await prepararResumo();RES_P=null;RES_ARQ=null;if(!file){toast("Sem resumo nesta edição.");return}const blob=file;
  const texto=`${resumoTitulo()} · Prumo News\nhttps://prumonews.com.br`;
  try{if(navigator.canShare&&navigator.canShare({files:[file],text:texto})){await navigator.share({files:[file],text:texto});return}}catch(e){if(e&&e.name==="AbortError")return}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="prumo-1-minuto.png";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);toast("Imagem salva: é só mandar no WhatsApp.")}
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-1mshare]");if(!b)return;e.stopPropagation();e.preventDefault();mandarResumo()},true);

/* página da pessoa: foto de arquivo, quem é e as notícias em que aparece */
function pessoaArq(k){const A=FOTOS_ARQ&&FOTOS_ARQ.pessoas;if(!A)return null;if(A[k])return A[k];return Object.values(A).find(x=>x&&Array.isArray(x.chaves)&&x.chaves.includes(k))||null}
function pautasDaPessoa(k){const A=pessoaArq(k),ch=[k,...((A&&A.chaves)||[])].filter(x=>typeof x==="string"&&x.length>=3);
  const pr=p=>typeof p.prioridade==="number"?p.prioridade:0;
  return (FEED.pautas||[]).filter(p=>{const n=p.neutro||{},t=[n.titulo,n.texto,p.subtitulo,...(n.pontos||[])].join(" ");return ch.some(c=>posPalavra(t,c)>=0)}).sort((a,b)=>tms(ultimaAtualizacao(b)||b.hora)-tms(ultimaAtualizacao(a)||a.hora)||pr(b)-pr(a))}
function abrirPessoa(k){const d=FEED.pessoas?.[k],A=pessoaArq(k),f=A&&Array.isArray(A.fotos)&&A.fotos.find(faValida),L=lente(),ps=pautasDaPessoa(k);
  sheet("Quem é",`<div class="pes">${f?`<div class="pes-f"><img src="${escU(fotoMini(f.url))}" alt="${esc(k)}" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></div>`:""}<div><b class="pes-n">${esc(k)}</b>${d?`<p class="pes-d">${esc(d)}</p>`:""}${f?`<small class="pes-c">${esc(creditoCurto(f.credito||""))}</small>`:""}</div></div>
  ${ps.length?`<h4 class="pes-h">Nas notícias (${ps.length})</h4><ul class="mud-l">${ps.slice(0,12).map(p=>`<li><button type="button" data-cpnovir="${esc(p.id)}"><b class="mud-k" style="color:${secCor(secOf(p))};background:none;border:1px solid currentColor">${esc(capaChapeu(p))}</b><span class="mud-t">${esc(versao(p,L).titulo)}</span><span class="mud-x">${esc(quando(ultimaAtualizacao(p)||p.hora))}</span></button></li>`).join("")}</ul>`:""}`)}

/* coberturas encerradas: como terminou, no topo da matéria */
function matDesfecho(p){if(p.status!=="encerrada")return "";const ups=(p.atualizacoes||[]).filter(u=>u&&u.texto);const u=ups.length?ups.reduce((a,b)=>tms(b.hora)>tms(a.hora)?b:a):null;
  const t=typeof p.desfecho==="string"&&p.desfecho.trim()?p.desfecho.trim():u?u.texto:"";if(!t)return "";return `<div class="mat-fim"><b>Como terminou</b><p>${esc(t)}</p></div>`}

