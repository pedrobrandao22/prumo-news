/* ---------- Etapa 74: correções da revisão ---------- */
/* v5: só conclui "não tem" quando a tabela não existe; erro de rede deixa em aberto e tenta de novo depois */
v5Testa=async function(){if(V5.on!==null||!SB||!S.uid)return V5.on;try{const r=await SB.from("destaques").select("id").limit(1);
  if(!r.error)V5.on=true;else if(/does not exist|PGRST205|PGRST106|42P01|Could not find the table|schema cache/i.test(String(r.error.message||"")+" "+String(r.error.code||"")))V5.on=false}catch(e){}return V5.on};
/* limpeza dos próprios stories: nunca roda sem saber se há destaques; nunca apaga se a leitura dos destaques falhar */
{const _lm74=pubLimparMeus;pubLimparMeus=async function(){await v5Testa();if(V5.on===null)return;if(V5.on===false)return _lm74.apply(this,arguments);
  try{const k="prumo-limpa:"+S.uid,ult=+localStorage.getItem(k)||0;if(Date.now()-ult<6*3600e3)return}catch(e){}
  try{const dr=await SB.from("destaques").select("itens").eq("dono",S.uid);if(dr.error||!Array.isArray(dr.data))return;const emDest=new Set(dr.data.flatMap(d=>Array.isArray(d.itens)?d.itens:[]));
    const lim=Date.now()-30*864e5;const r=await SB.from("publicacoes").select("id,fotos,estilo").eq("autor",S.uid).eq("tipo","story").lt("expira",lim).order("expira",{ascending:true}).limit(300);if(r.error)return;
    try{localStorage.setItem("prumo-limpa:"+S.uid,String(Date.now()))}catch(e){}
    const velhos=(r.data||[]).filter(x=>!emDest.has(x.id)).slice(0,100);if(!velhos.length)return;const ids=velhos.map(x=>x.id);
    const d=await SB.from("publicacoes").delete().in("id",ids);if(d&&d.error)return;
    const fs=velhos.flatMap(x=>Array.isArray(x.fotos)?x.fotos:[]),vs=velhos.map(x=>x.estilo&&x.estilo.video).filter(v=>typeof v==="string");
    try{if(fs.length)await SB.storage.from("fotos").remove(fs);if(vs.length)await SB.storage.from("videos").remove(vs)}catch(e){}
    PUB.itens=PUB.itens.filter(x=>!ids.includes(x.id));if(ARQ)ARQ=ARQ.filter(x=>!ids.includes(x.id))}catch(e){}}}
/* apagar um story que está em destaque: tira dos destaques antes (o servidor recusa apagar story em destaque) */
{const _pa74=pubApagar;pubApagar=async function(id,quieto){const x=pubDe(id);
  if(x&&x.tipo==="story"&&x.autor===S.uid&&V5.on){try{const dr=await SB.from("destaques").select("id,itens").eq("dono",S.uid);if(dr.error)throw dr.error;
      for(const d of (dr.data||[]).filter(d=>(d.itens||[]).includes(id))){const it=d.itens.filter(i=>i!==id);const q=it.length?await SB.from("destaques").update({itens:it}).eq("id",d.id):await SB.from("destaques").delete().eq("id",d.id);if(q&&q.error)throw q.error}
      if(DEST[S.uid])await destCarregar(S.uid)}catch(e){if(!quieto)toast("Não deu para tirar o story do destaque agora.");return false}}
  return _pa74.apply(this,arguments)}}
/* Atividade: a "primeira vez" só é registrada com amigos e notícias carregados, e nada é esquecido por sumir um instante */
atPrimeiraVez=function(chaves){let l=atLed();if(!S.amigosOk||!FEED)return l||{};const agora=Date.now();l=l||{_t0:agora};if(!l._t0)l._t0=agora-864e5;const base=agora-l._t0<90e3;
  chaves.forEach(k=>{if(!(k in l))l[k]=base?0:agora});const ks=Object.keys(l).filter(k=>!/^_/.test(k));if(ks.length>600)ks.sort((a,b)=>l[a]-l[b]).slice(0,ks.length-600).forEach(k=>delete l[k]);
  l._b=1;atLedSalva(l);return l};
/* Atividade: comentário com @menção no meu post não aparece duas vezes */
{const _ai74=atItens;atItens=function(){const it=_ai74.apply(this,arguments);const cm=new Set(it.filter(x=>x.acao==="cmt").map(x=>x.us[0]+"|"+x.pub));
  return it.filter(x=>!(x.acao==="men"&&x.msg&&/^u:/.test(String(x.msg.pid||""))&&cm.has(x.msg.de+"|"+String(x.msg.pid).slice(2))))}}
/* editar legenda: confere que salvou e avisa só quem foi mencionado agora */
pubEditar=async function(id,txt){const x=pubDe(id);if(!x||x.autor!==S.uid)return;const men=t=>typeof mencionados==="function"?mencionados(t||""):[];const antes=men(x.texto);
  let r;try{r=await SB.from("publicacoes").update({texto:txt}).eq("id",id).select("id")}catch(e){r={error:e}}
  if(!r||r.error||!Array.isArray(r.data)||!r.data.length){toast("Não deu para salvar agora.");return}
  x.texto=txt;x.editado=Date.now();toast("Legenda atualizada");
  const el=document.getElementById("p-u:"+id);if(el){try{el.outerHTML=pubPostHTML(x);const n=document.getElementById("p-u:"+id);if(n){wireTracks(n);updateSocial("u:"+id)}}catch(e){}}
  const novos=men(txt).filter(u=>!antes.includes(u));if(novos.length){const snap={titulo:"Post de "+nomeDe(S.uid)+": "+String(txt).slice(0,90),upub:id};
    Promise.all(novos.map(u=>dmEnviar(u,{texto:String(txt).slice(0,1000),pid:"u:"+id,snap,tipo:"mencao"},true))).catch(()=>{})}};
/* "Sua semana": a semana começa na sexta, para o círculo visto na sexta continuar visto no fim de semana */
semChave=function(){const sp=new Date(_FDSP.format(new Date())+"T12:00:00Z");const dw=sp.getUTCDay();sp.setUTCDate(sp.getUTCDate()-((dw+2)%7));return sp.toISOString().slice(0,10)};
/* capa do destaque de texto usa o fundo do próprio story */
destCapa=function(d){const x=(d.capa&&d.stories.find(s=>s.id===d.capa))||d.stories[0];const f=x&&x.fotos[0]&&pubUrl(x.fotos[0]);return f?`<img src="${pubSrc(f)}" alt="">`:`<span style="background:${pubFundo(x&&x.estilo&&x.estilo.fundo)}"></span>`};
/* figurinha de post antigo (fora dos últimos carregados): busca o post para quem pode vê-lo */
var PUB_BUSCA={};
async function pubBuscaUm(id){if(PUB_BUSCA[id]||!SB||!S.uid)return;PUB_BUSCA[id]=1;try{const r=await SB.from("publicacoes").select("*").eq("id",id).limit(1);const x=r&&!r.error&&r.data&&r.data[0];if(!x||pubDe(id)||x.tipo!=="post")return;
  pubNorm(x);await pubAssinaLista([x]);PUB.itens.push(x);const st=ST&&ST.itens&&ST.itens[ST.i];const b=$("#layer .us2-its");if(b&&st&&st.estilo&&$("#layer .story"))b.innerHTML=usItensHTML(st);if(ED&&$("#layer .ce")&&typeof edEls==="function")edEls()}catch(e){}}
{const _pf74=pubFigHTML;pubFigHTML=function(e){if(e&&e.ref&&!pubDe(e.ref))pubBuscaUm(e.ref);return _pf74.apply(this,arguments)}}


