/* ---------- áudio com voz, velocidade e seção ---------- */
function abrirAudio(){uso("audio");
  if(!("speechSynthesis" in window)){toast("Este navegador não lê texto em voz alta.");return}
  const vozes=speechSynthesis.getVoices().filter(v=>/^pt/i.test(v.lang));
  const A=PREF.audio||(PREF.audio={rate:1,voz:""});
  sheet("Ouvir",`<div class="opt">${[{id:"top",nome:"As 6 principais"},...SECS().filter(s=>pautasDa(s.id).length)].map(s=>`<button type="button" data-ouvir="${esc(s.id)}">${esc(s.id==="top"?s.nome:"Só "+s.nome)}<span>${s.id==="top"?"":pautasDa(s.id).length+" notícias"}</span></button>`).join("")}</div>
    <div class="card"><b>Velocidade</b><div class="fzrow"><button type="button" data-rate="-1">−</button><span id="rateval">${A.rate.toFixed(1).replace(".",",")}×</span><button type="button" data-rate="1">+</button></div>
    ${vozes.length?`<b>Voz</b><select id="voz" class="field">${vozes.map(v=>`<option value="${esc(v.name)}" ${v.name===A.voz?"selected":""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select>`:`<p class="hint">As vozes disponíveis dependem do seu celular.</p>`}</div>
    ${falando?`<button type="button" class="btn" data-ouvir="stop">Parar a leitura</button>`:""}`);
  $("#voz")?.addEventListener("change",e=>{A.voz=e.target.value;salvarPrefs()});
  if(!vozes.length&&!abrirAudio._esp){abrirAudio._esp=true;try{speechSynthesis.addEventListener("voiceschanged",()=>{abrirAudio._esp=false;if($("#rateval")&&!$("#voz")&&speechSynthesis.getVoices().some(v=>/^pt/i.test(v.lang)))abrirAudio()},{once:true})}catch(e){}}
}
function ouvirLista(qual){
  if(qual==="stop"){pararAudio();return}
  const lista=qual==="top"?ordenadas(visiveis()).slice(0,6):pautasDa(qual);
  falarItens([{txt:`Prumo News. ${qual==="top"?"As principais notícias":secNome(qual)}. ${FEED.edicao||""}.`,tit:qual==="top"?"As principais":secNome(qual)},...lista.map((p,i)=>({pid:p.id,tit:p.neutro?.titulo,txt:`${i+1}. ${p.neutro?.titulo}. ${p.neutro?.texto}`})),{txt:"Fim.",tit:"Fim"}]);
}

