/* ---------- Envios para fora do Prumo (WhatsApp e outros apps): texto bem formatado + link com prévia ---------- */
const ENV_WA='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z"/><path d="M8.9 8.3c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .5.5.9 1.3 1.7 2.3 2.2.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5 0 .6-.3 1.3-.9 1.6-.6.3-1.4.4-2.6-.1-2-.8-3.6-2.5-4.3-4.3-.4-1.1-.3-2.1.2-2.6z"/></svg>';
/* o que aparece na conversa: *negrito* do WhatsApp vira negrito na prévia */
function envPrevia(t){return esc(t).replace(/\*([^*\n]{1,200})\*/g,"<b>$1</b>").replace(/(^|\s)_([^_\n]{1,120})_(?=\s|$)/g,"$1<i>$2</i>").replace(/(https?:\/\/[^\s<]+)/g,'<span class="env-ln">$1</span>').replace(/\n/g,"<br>")}
function envLimpa(s){return String(s||"").replace(/\s+/g," ").trim()}
async function envCopiar(txt){try{await navigator.clipboard.writeText(txt);toast("Copiado. É só colar na conversa.");return true}catch(e){return false}}
/* o painel de envio: WhatsApp, outros apps, copiar e (quando houver) a imagem */
function abrirEnvioFora(o){const texto=o.texto,url=o.url||"";uso("enviar_fora");
  const temShare=!!navigator.share;ENV_ATUAL=o;
  sheet(o.titulo||"Mandar",`<div class="env"><div class="env-bolha">${envPrevia(texto)}</div>
    <div class="env-bts"><a class="env-b env-wa" href="https://wa.me/?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener" data-envwa>${ENV_WA}<span>WhatsApp</span></a>
    ${temShare?`<button type="button" class="env-b" data-envmais><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg><span>Outros apps</span></button>`:""}
    <button type="button" class="env-b" data-envcopia><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg><span>Copiar texto</span></button>
    ${o.imagem?`<button type="button" class="env-b" data-envimg><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg><span>Como imagem</span></button>`:""}</div>
    ${url?`<p class="hint env-h">O link abre a notícia no Prumo, com título e foto na prévia da conversa.</p>`:""}</div>`)}
var ENV_ATUAL=null;
document.addEventListener("click",async e=>{const t=e.target;if(!t||!t.closest)return;const o=ENV_ATUAL;
  if(t.closest("[data-envwa]")){uso("enviar_whatsapp");setTimeout(()=>{if($(".sheet .env"))closeLayer()},400);return}
  if(t.closest("[data-envmais]")&&o){e.preventDefault();try{const corpo=o.url?o.texto.replace(o.url,"").replace(/\n+$/,""):o.texto;await navigator.share(o.url?{title:o.titulo||"Prumo News",text:corpo,url:o.url}:{title:o.titulo||"Prumo News",text:o.texto});closeLayer()}catch(err){if(!(err&&err.name==="AbortError"))envCopiar(o.texto)}return}
  if(t.closest("[data-envcopia]")&&o){e.preventDefault();if(await envCopiar(o.texto))closeLayer();else{const b=$(".sheet .env-bolha");if(b){const r=document.createRange();r.selectNodeContents(b);const s=getSelection();s.removeAllRanges();s.addRange(r)}toast("Selecionei o texto: toque em Copiar.")}return}
  if(t.closest("[data-envimg]")&&o&&o.imagem){e.preventDefault();try{await o.imagem()}catch(err){}return}},true);
/* notícia: título, subtítulo e o link (a página do link mostra a foto e o título na prévia do WhatsApp) */
compartilhar=async function(pid){uso("compartilhar");evento("compartilhar",pid);const p=pautaById(pid),s=snapById(pid);
  const tit=envLimpa((p?(p.neutro||{}).titulo:s&&s.titulo)||"Prumo News");const url=linkMateria(pid);
  let sub="";try{if(p)sub=envLimpa((typeof p.subtitulo==="string"&&p.subtitulo)||capaFrase((p.neutro||{}).texto||"",170))}catch(e){}
  const texto=`*${tit}*${sub&&sub!==tit?"\n"+sub:""}\n\nLeia no Prumo News: ${url}`;
  abrirEnvioFora({titulo:"Mandar notícia",texto,url})};
/* O dia em 1 minuto: em texto, numerado, com o link do Prumo (a imagem continua como opção) */
mandarResumo=async function(){uso("capa_1min_mandar");const its=(FEED&&FEED.resumo_dia&&Array.isArray(FEED.resumo_dia.itens)?FEED.resumo_dia.itens:[]).filter(x=>x&&x.texto).slice(0,6);
  if(!its.length){toast("Sem resumo nesta edição.");return}
  const url="https://prumonews.com.br";
  const texto=`*${resumoTitulo()}* · Prumo News\n_${envLimpa(capaEdicao())}_\n\n${its.map((x,i)=>`${i+1}. ${envLimpa(x.texto)}`).join("\n")}\n\nTodas as notícias, sem viés: ${url}`;
  abrirEnvioFora({titulo:resumoTitulo(),texto,url,imagem:async()=>{const file=await prepararResumo();RES_P=null;RES_ARQ=null;if(!file)return;
    try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});closeLayer();return}}catch(e){if(e&&e.name==="AbortError")return}
    const a=document.createElement("a");a.href=URL.createObjectURL(file);a.download="prumo-1-minuto.png";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);toast("Imagem salva no aparelho.")}})};
/* convite: mesmo painel, com o texto do convite */
enviarConvite=async function(){const l=S._cvlink;if(!l)return;
  abrirEnvioFora({titulo:"Mandar convite",texto:`Entre no *Prumo News* com o meu convite: as notícias do dia, curtas e sem viés, e a gente conversa sobre elas por lá.\n\n${l}`,url:l})};
