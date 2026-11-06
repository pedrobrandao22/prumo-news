/* ---------- 131: Melhoria contínua 06/11 — infográfico da capa do post quando a foto não carrega ----------
   Notícia com infográfico ("dinheiro", "indicador", "pesquisa", "plenario" ou etiqueta "Infográfico") e foto de arquivo:
   o cartão desenha a ilustração recortada em 4:5 por baixo da foto. Se a foto não carrega (sem internet, fonte fora do ar),
   a foto sai e sobrava a ilustração recortada: os números da direita ("80%", "20%", "4/11") ficavam fora do cartão.
   Agora, quando a foto falha num cartão desses, ele vira o cartão de infográfico normal (ilustração inteira em 5:3, como
   quando a notícia não tem foto). O crédito da foto que não apareceu continua escondido (.cover .fcv-c some sem .fcv).
   Nomes globais com o prefixo mc1106. */
function mc1106Info(p){const im=p&&p.imagem;if(!im)return false;
  return String(im.etiqueta||"").toLowerCase()==="infográfico"||["pesquisa","indicador","dinheiro","plenario"].includes(im.modelo)}
function mc1106Pauta(id){if(!id)return null;try{return ((FEED&&FEED.pautas)||[]).find(x=>x&&x.id===id)||null}catch(e){return null}}
function mc1106Conserta(c){try{
  if(!c||!c.classList||!c.classList.contains("cover")||c.classList.contains("fcv")||c.classList.contains("info"))return false;
  if(c.querySelector(":scope > img"))return false;
  const a=c.closest("[data-pid]"),p=mc1106Pauta(a&&a.getAttribute("data-pid"));if(!mc1106Info(p))return false;
  const sv=c.querySelector(":scope > svg");if(!sv)return false;
  const t=document.createElement("template");t.innerHTML=svgOf(p.imagem);const novo=t.content.firstElementChild;if(!novo)return false;
  sv.replaceWith(novo);c.classList.add("info");
  return true}catch(e){return false}}
const mc1106FotoErro0=fotoErro;
fotoErro=function(img,feed){const c=img&&img.parentNode;const r=mc1106FotoErro0.apply(this,arguments);
  if(feed&&c&&img.parentNode!==c)mc1106Conserta(c);return r};
