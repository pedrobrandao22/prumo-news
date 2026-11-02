/* ---------- áudio ---------- */
let falando=false;
function ouvir(){
  if(!("speechSynthesis" in window)){toast("Este navegador não lê texto em voz alta.");return}
  if(AUD.on){pararAudio();return}
  const top=ordenadas(visiveis()).slice(0,6);
  falarItens([{txt:`Prumo News. ${FEED.edicao||""}. As principais notícias.`,tit:"As principais"},...top.map((p,i)=>({pid:p.id,tit:p.neutro?.titulo,txt:`${i+1}. ${secNome(secOf(p))}. ${p.neutro?.titulo}. ${p.neutro?.texto}`})),{txt:"Fim do resumo.",tit:"Fim"}]);
}

