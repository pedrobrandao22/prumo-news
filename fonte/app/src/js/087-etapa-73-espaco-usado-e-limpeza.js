/* ---------- Etapa 73: espaço usado e limpeza ---------- */
/* cada pessoa apaga os próprios stories com mais de 30 dias (menos os de destaques), no máximo a cada 6 horas */
{const _lm73=pubLimparMeus;pubLimparMeus=async function(){if(V5.on===null)await v5Testa();if(!V5.on)return _lm73.apply(this,arguments);
  try{const k="prumo-limpa:"+S.uid,ult=+localStorage.getItem(k)||0;if(Date.now()-ult<6*3600e3)return;localStorage.setItem(k,String(Date.now()))}catch(e){}
  try{const lim=Date.now()-30*864e5;const r=await SB.from("publicacoes").select("id,fotos,estilo").eq("autor",S.uid).eq("tipo","story").lt("expira",lim).limit(100);if(r.error||!(r.data||[]).length)return;
    if(!DEST[S.uid])await destCarregar(S.uid);const emDest=new Set((DEST[S.uid]||[]).flatMap(d=>d.itens||[]));const velhos=r.data.filter(x=>!emDest.has(x.id));if(!velhos.length)return;
    const ids=velhos.map(x=>x.id);const d=await SB.from("publicacoes").delete().in("id",ids);if(d&&d.error)return;
    const fs=velhos.flatMap(x=>Array.isArray(x.fotos)?x.fotos:[]),vs=velhos.map(x=>x.estilo&&x.estilo.video).filter(v=>typeof v==="string");
    try{if(fs.length)await SB.storage.from("fotos").remove(fs);if(vs.length)await SB.storage.from("videos").remove(vs)}catch(e){}
    PUB.itens=PUB.itens.filter(x=>!ids.includes(x.id));if(ARQ)ARQ=ARQ.filter(x=>!ids.includes(x.id))}catch(e){}}}
/* Admin › Uso: espaço ocupado, limites do plano grátis e botão de limpeza */
const ESP_LIM={db:500*1048576,arq:1024*1048576};
function espMB(b){b=+b||0;return b>=1073741824?(b/1073741824).toLocaleString("pt-BR",{maximumFractionDigits:2})+" GB":b>=1048576?(b/1048576).toLocaleString("pt-BR",{maximumFractionDigits:1})+" MB":Math.max(0,Math.round(b/1024))+" KB"}
const ESP_NOMES={publicacoes:"Posts e stories",pub_reacoes:"Curtidas, comentários e votos em posts",mensagens:"Mensagens",docs:"Curtidas, votos e comentários nas notícias",membros:"Pessoas",amizades:"Amizades",eventos:"Contagem de uso",erros:"Erros",pub_vistos:"Quem viu os stories",destaques:"Destaques",convites:"Convites",denuncias:"Denúncias",melhores_amigos:"Melhores amigos",bloqueios:"Bloqueios",config_app:"Configuração"};
async function espCarregar(){try{S.adm.esp=await S.db.rpc("admin_espaco")}catch(e){S.adm.esp={erro:String(e&&(e.message||e.code)||"")}}espDesenhar()}
function espBarra(rot,usado,lim){const p=Math.min(100,usado/lim*100);return `<div class="esp-b${p>80?" alto":""}"><span><b>${esc(rot)}</b>${esc(espMB(usado))} de ${esc(espMB(lim))}</span><i><em style="width:${Math.max(1,p).toFixed(1)}%"></em></i></div>`}
function espDesenhar(){const b=$("#uso-esp");if(!b)return;const d=S.adm.esp;
  if(!d){b.innerHTML=`<b class="cm-h">Espaço e custo</b><p class="hint">Carregando…</p>`;return}
  if(d.erro){b.innerHTML=`<b class="cm-h">Espaço e custo</b>`+(/admin_espaco|PGRST202|42883|function/i.test(d.erro)?`<p class="hint">Para ver o espaço ocupado e limpar arquivos velhos, rode uma vez o arquivo <b>publicacoes-v6.sql</b> no Supabase (SQL Editor › New query › colar › Run).</p>`:`<p class="erro-t">Não deu para carregar o espaço agora.</p>`);return}
  const bk=Array.isArray(d.buckets)?d.buckets:[],arq=bk.reduce((a,x)=>a+(+x.bytes||0),0),tb=(Array.isArray(d.tabelas)?d.tabelas:[]).slice(0,6),orf=d.orfas||{},sv=+d.stories_velhos||0;
  const nb=x=>x.bucket==="fotos"?"Fotos":x.bucket==="videos"?"Vídeos":x.bucket;
  let h=`<b class="cm-h">Espaço e custo</b>${espBarra("Banco de dados",+d.db_bytes||0,ESP_LIM.db)}${espBarra("Fotos e vídeos",arq,ESP_LIM.arq)}`;
  if(bk.length)h+=`<p class="hint">${bk.map(x=>`${esc(nb(x))}: ${(+x.arquivos||0).toLocaleString("pt-BR")} ${+x.arquivos===1?"arquivo":"arquivos"} · ${esc(espMB(x.bytes))}`).join(" — ")}</p>`;
  if(tb.length)h+=`<b class="cm-h">O que mais ocupa no banco</b><ul class="uso-b esp-t">${tb.map(t=>`<li><span>${esc(ESP_NOMES[t.nome]||t.nome)}</span><i style="width:${(Math.max(1,(+t.bytes||0)/(+tb[0].bytes||1)*100)).toFixed(1)}%"></i><b>${esc(espMB(t.bytes))}</b></li>`).join("")}</ul>`;
  const temLixo=sv||+orf.arquivos;
  h+=`<div class="esp-l"><b>Limpeza</b><p class="hint">${temLixo?`${sv?`${sv} ${sv===1?"story com mais de 30 dias":"stories com mais de 30 dias"} fora de destaques`:""}${sv&&+orf.arquivos?" e ":""}${+orf.arquivos?`${orf.arquivos} ${+orf.arquivos===1?"arquivo":"arquivos"} sem uso (${esc(espMB(orf.bytes))})`:""}.`:"Nada para limpar agora."} Cada pessoa também apaga os próprios stories velhos quando abre o app.</p>${temLixo?`<button type="button" class="btn ghost" data-esplimpar>Limpar agora</button>`:""}</div>`;
  h+=`<p class="hint">Plano grátis do Supabase: 500 MB de banco, 1 GB de fotos e vídeos e 5 GB de tráfego por mês. O projeto pausa depois de 1 semana sem ninguém usar. O tráfego aparece só no painel do Supabase (Usage).</p>`;
  b.innerHTML=h}
async function espLimpar(btn){if(!btn.classList.contains("conf")){btn.classList.add("conf");btn.textContent="Toque de novo para limpar";return}btn.disabled=true;btn.textContent="Limpando…";let n=0,arqs=0;
  try{n=await S.db.rpc("admin_limpar_stories")||0;for(let v=0;v<5;v++){const l=await S.db.rpc("admin_midias_orfas",{p_lim:300});if(!Array.isArray(l)||!l.length)break;
      for(const bk of ["fotos","videos"]){const ns=l.filter(x=>x.bucket===bk).map(x=>x.nome);for(let i=0;i<ns.length;i+=100){const r=await SB.storage.from(bk).remove(ns.slice(i,i+100));if(r&&r.error)throw r.error;const k=Array.isArray(r&&r.data)?r.data.length:0;arqs+=k;if(!k)throw new Error("nada apagado")}}if(l.length<300)break}
    toast(`Limpeza feita: ${n} ${n===1?"story":"stories"} e ${arqs} ${arqs===1?"arquivo":"arquivos"}.`)}catch(e){toast(arqs||n?`Limpeza parcial: ${n} ${n===1?"story":"stories"} e ${arqs} ${arqs===1?"arquivo":"arquivos"}. O resto não saiu; confira se o SQL v6 está atualizado.`:"Nenhum arquivo foi apagado. Confira se o SQL v6 está atualizado e tente de novo.")}
  S.adm.esp=null;espDesenhar();espCarregar()}
{const _ud73=usoDesenhar;usoDesenhar=function(){const r=_ud73.apply(this,arguments);try{const b=$("#admbox");if(b&&S._admAba==="uso"&&!$("#uso-esp")){b.insertAdjacentHTML("beforeend",`<div id="uso-esp"></div>`);if(S.adm.esp)espDesenhar();else espCarregar()}}catch(e){}return r}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-esplimpar]");if(b){e.stopPropagation();espLimpar(b)}},true);


