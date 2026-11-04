/* ---------- 128: melhoria contínua 04/11/2026 — editar a coluna ----------
   Antes, para mudar uma coluna era preciso apagar e publicar de novo (perdendo curtidas e comentários).
   Agora o menu "…" da sua coluna tem "Editar a coluna": abre o mesmo editor, já preenchido, e "Salvar" atualiza o post.
   - Muda título, linha fina, hashtags e o texto. A foto de capa e quem pode ler ficam como estão (o servidor não deixa trocar).
   - Título, linha fina e hashtags vão em publicacoes.texto/estilo (já liberados para o autor).
   - O texto longo: se a coluna o guarda em estilo.coluna.corpo (antes da v9), continua lá; se guarda na coluna publicacoes.corpo,
     o servidor precisa liberar a edição dessa coluna (sql/proposta-2026-11-04.sql). Sem isso, avisa e salva só o resto.
   - O estilo salvo é o que está no servidor (lido na hora), só com a parte "coluna" trocada. Editar não cria rascunho. */

/* menu "…" da sua coluna: "Editar a coluna" (o 123 tira "Editar legenda" no mesmo toque) */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-umenu]");if(!b)return;const x=pubDe(b.dataset.umenu);
  if(!x||x.autor!==S.uid||!cs123Col(x)||PUB.on===false)return;
  setTimeout(()=>{const o=document.querySelector(".sheet .opt");if(!o||o.querySelector("[data-mc1104ed]"))return;
    o.insertAdjacentHTML("afterbegin",`<button type="button" data-mc1104ed="${esc(x.id)}">Editar a coluna<span>título, linha fina, texto e hashtags</span></button>`)},0)},true);

function mc1104Tags(x){const t=String(x.texto||""),i=t.indexOf("\n\n");if(i<0)return "";const ult=t.split("\n\n").pop();return /^#/.test(ult)?ult:""}
function mc1104Abre(id){const x=pubDe(id),c=x&&cs123Col(x);if(!x||!c||x.autor!==S.uid){toast("Esta coluna não está disponível para editar.");return}
  if(typeof ED!=="undefined"&&ED){ED=null}
  const L=$("#layer");if(L.innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}
  const f=x.fotos&&x.fotos[0],u=f&&pubUrl(f);
  CS123.ed=cs123EdNovo({tit:c.tit,linha:c.linha,corpo:c.corpo,tags:mc1104Tags(x),pub:x.publico==="seguidores"?"seguidores":"amigos",capa:u?{url:u}:null,deRasc:true,
    mc1104:{id:x.id,tit:c.tit,linha:c.linha,corpo:c.corpo,tags:mc1104Tags(x),temFoto:!!f}});
  L.innerHTML=`<div class="cs123-ed" role="dialog" aria-modal="true" aria-label="Editar coluna"></div>`;if(pushH())HST++;cs123EdDesenha();
  setTimeout(()=>{const i=$("#cs123-corpo");if(i)try{i.focus({preventScroll:true});i.setSelectionRange(0,0);i.scrollTop=0}catch(e){}},80)}

/* o editor em modo "editar": sem rascunhos, sem trocar capa nem público, botão "Salvar" */
{const _ed=cs123EdDesenha;cs123EdDesenha=function(){const r=_ed.apply(this,arguments);try{const E=CS123.ed,el=$("#layer .cs123-ed");if(!E||!E.mc1104||!el)return r;
  const h=el.querySelector(".cs123-edh b");if(h)h.textContent="Editar coluna";
  el.querySelectorAll(".cs123-rs,[data-cs123rasc],.cs123-pub").forEach(n=>n.remove());
  const cp=el.querySelector(".cs123-capaed");if(cp){if(E.mc1104.temFoto&&E.capa)cp.innerHTML=`<img src="${pubSrc(E.capa.url)}" alt=""><p class="hint mc1104-nota" style="margin:6px 0 0">A foto de capa fica como está.</p>`;else cp.remove()}
  const av=el.querySelector(".cs123-aviso");if(av)av.textContent=`Quem já podia ler continua podendo (${E.pub==="seguidores"?"seguidores e amigos":"seus amigos no Prumo"}). Curtidas e comentários ficam.`;
  const pb=el.querySelector(".cs123-edf [data-cs123pub]");if(pb)pb.textContent=E.env?"Salvando…":"Salvar";
  const pv=document.querySelector("#layer .cs123-prev [data-cs123pub]");if(pv)pv.textContent="Salvar"}catch(e){}return r}}
{const _pv=cs123Previa;cs123Previa=function(){const r=_pv.apply(this,arguments);try{const E=CS123.ed;if(E&&E.mc1104){const b=document.querySelector("#layer .cs123-prev [data-cs123pub]");if(b)b.textContent="Salvar"}}catch(e){}return r}}
{const _rg=cs123RascGuarda;cs123RascGuarda=function(){const E=CS123.ed;if(E&&E.mc1104)return;return _rg.apply(this,arguments)}}
{const _pu=cs123Publicar;cs123Publicar=function(){const E=CS123.ed;if(E&&E.mc1104)return mc1104Salvar();return _pu.apply(this,arguments)}}
/* capa, público e rascunhos não aparecem no modo editar (os botões saem em cs123EdDesenha) */

async function mc1104Salvar(){const E=CS123.ed;if(!E||!E.mc1104||E.env||!SB)return;const M=E.mc1104,x=pubDe(M.id);if(!x){toast("Esta coluna já foi apagada.");return}
  const er=cs123Valida(E);if(er){toast(er);return}
  const tags=cs123Tags(E.tags),tit=E.tit.trim().slice(0,90),linha=E.linha.trim().slice(0,160),corpo=E.corpo.replace(/\r/g,"").trim();
  const texto=(tit+(linha?"\n\n"+linha:"")+(tags.length?"\n\n"+tags.join(" "):"")).slice(0,2200);
  E.env=true;$("#layer .cs123-prev")?.remove();cs123EdDesenha();
  const falha=m=>{E.env=false;if(CS123.ed===E)cs123EdDesenha();toast(m)};
  try{const q=await SB.from("publicacoes").select("estilo,corpo").eq("id",M.id).limit(1);if(q.error)throw q.error;const raw=q.data&&q.data[0];
    if(!raw){falha("Esta coluna já foi apagada.");return}
    const es0=raw.estilo&&typeof raw.estilo==="object"&&!Array.isArray(raw.estilo)?raw.estilo:{},c0=es0.coluna&&typeof es0.coluna==="object"?es0.coluna:{};
    const naColuna=typeof raw.corpo==="string"&&raw.corpo.length>0,velho=naColuna?raw.corpo:String(c0.corpo||"");
    const col={...c0,v:1,tit,linha,min:cs123Min(corpo)};const upd={texto,estilo:{...es0,coluna:col}};
    if(naColuna){delete col.corpo;if(corpo!==velho)upd.corpo=corpo}
    else{if(corpo.length>CS123_LIM_V8){falha("Por enquanto, esta coluna pode ter até 6.000 caracteres. Encurte um pouco o texto.");return}col.corpo=corpo}
    let n=0;try{n=new TextEncoder().encode(JSON.stringify(upd.estilo)).length}catch(e){n=JSON.stringify(upd.estilo).length*2}
    if(n>7600){falha("Por enquanto, esta coluna precisa ser um pouco menor (o limite é de cerca de 6.000 caracteres). Encurte o texto.");return}
    let r=await SB.from("publicacoes").update(upd).eq("id",M.id).select("id");let semCorpo=false;
    if(r.error&&upd.corpo!==undefined&&/42501|permission|privileg/i.test(String(r.error.code||"")+" "+String(r.error.message||""))){
      /* o servidor ainda não deixa mudar o texto longo: salva título, linha fina e hashtags e avisa */
      if(tit===M.tit&&linha===M.linha&&texto===x.texto){falha("Mudar o texto da coluna ainda não está ligado no servidor. Por enquanto, dá para mudar o título, a linha fina e as hashtags.");return}
      delete upd.corpo;semCorpo=true;r=await SB.from("publicacoes").update(upd).eq("id",M.id).select("id")}
    if(r.error)throw r.error;if(!(r.data||[]).length){falha("Não deu para salvar agora. O texto continua aqui.");return}
    x.texto=texto;x.editado=Date.now();if(x.estilo&&typeof x.estilo==="object"){x.estilo.coluna={...col}}if(upd.corpo!==undefined)x.corpo=corpo;
    CS123.ed=null;if($("#layer > .cs123-ed")){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}
    toast(semCorpo?"Título e linha fina salvos. Mudar o texto da coluna ainda não está ligado no servidor.":"Coluna atualizada");uso("coluna_editada");
    try{VN112_Q&&VN112_Q.delete&&VN112_Q.delete(x.id)}catch(e){}try{pubRedesenha()}catch(e){}try{if(VIEW==="me")renderMe()}catch(e){}}
  catch(e){const m=String((e&&(e.code||""))+" "+(e&&e.message||""));falha(/estilo|corpo|tamanho|23514|22023|check/i.test(m)?"A coluna passou do limite de tamanho do servidor. Encurte o texto e tente de novo.":"Não deu para salvar agora. O texto continua aqui.")}}

document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-mc1104ed]");if(!b)return;e.stopPropagation();e.preventDefault();const id=b.dataset.mc1104ed;
  closeLayer();setTimeout(()=>mc1104Abre(id),60)},true);
