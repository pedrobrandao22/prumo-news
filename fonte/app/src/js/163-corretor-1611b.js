/* 163 (corretor 16/11, tarde, achados do testador)
   (1) Notas da redação para ela mesma ("atualização duplicada de 14/11 removida", "Tema passa a …", "nesta rodada")
       apareciam como manchete nas Últimas da Capa e nos resumos de coberturas antigas. Ao carregar a edição, essas
       partes saem dos textos de leitor (mudanças, atualizações e coberturas anteriores); "nesta rodada" vira "até agora".
   (2) Feed: a linha da cobertura dizia só "Cobertura completa ›" (sem dizer qual). Agora traz o nome da cobertura, o
       mesmo título da folha que abre, e a etapa atual quando houver ("Enem 2026 · cobertura completa ›",
       "Ajuste fiscal · Câmara ›").
   (3) Capa: tocar na manchete abria o "Em 30 segundos" atrás da barra de baixo e um segundo toque logo depois fechava.
       Agora a tela rola até o texto aberto e um toque repetido no mesmo cartão em menos de 0,8 s é ignorado.
   Prefixo cr163. */

/* ---- (1) texto de leitor sem bastidor ----
   20/11 (corretor, causa notas-internas): também os recados do robô ("proximo e faq trazem…", "contagem vencida trocada
   por linha do tempo", "etapa avança para Câmara", "ficam para a próxima", "página que confirmasse"). A MESMA lista está
   em tools/validar.py (BASTIDOR_SEMPRE), que dá ERRO antes de publicar; aqui é a rede de segurança das edições já no ar. */
var CR163_BASTIDOR=/atualiza[çc][ãa]o (duplicada|repetida)|\bduplicad[ao]s?\b[^;.]{0,40}\bremovid[ao]s?\b|\bremovid[ao]s? (da|do) (feed|edi[çc][ãa]o|lista)\b|^\s*tema passa a\b|\bnota interna\b|\b(proximo|faq)\b|contagem vencida|trocad[ao]s? por (uma |a )?linha do tempo|\betapa avan[çc]a para\b|\bficam? para a pr[óo]xima(\s*[.;,]|\s*$| rodada| r[áa]pida| atualiza)|(p[áa]gina|fonte)s?( lida)? que (o )?confirm|nenhuma p[áa]gina lida|falta de (p[áa]gina|fonte)|\bj[áa] (est[áa]|est[ãa]o|estava|estavam) no feed\b|\bacionaram\b/i;
function cr163Limpa(s){if(typeof s!=="string"||!s.trim())return s;
  let partes=s.split(/\s*;\s*/);const ok=partes.filter(x=>x&&!CR163_BASTIDOR.test(x));
  if(!ok.length)return "";
  let t=ok.join("; ").replace(/\s+nesta rodada\b/gi," até agora").replace(/\s+na rodada (r[áa]pida|completa)\b/gi,"").trim();
  if(t!==s.trim()){t=t.charAt(0).toUpperCase()+t.slice(1)}
  return t}
function cr163LimpaFeed(f){try{if(!f||typeof f!=="object")return f;
  const m=f.mudancas;if(m&&Array.isArray(m.itens))m.itens=m.itens.filter(i=>{if(!i||typeof i.texto!=="string")return true;i.texto=cr163Limpa(i.texto);return !!i.texto});
  (Array.isArray(f.pautas)?f.pautas:[]).forEach(p=>{if(p&&Array.isArray(p.atualizacoes))p.atualizacoes=p.atualizacoes.filter(u=>{if(!u||typeof u.texto!=="string")return true;u.texto=cr163Limpa(u.texto);return !!u.texto})});
  (Array.isArray(f.dormentes)?f.dormentes:[]).forEach(d=>{if(d&&typeof d.resumo==="string"){const r=cr163Limpa(d.resumo);if(r)d.resumo=r}});
  }catch(e){}return f}
{const _sn163=sanear;sanear=function(f){return cr163LimpaFeed(_sn163.apply(this,arguments))}}

/* ---- (2) linha da cobertura com o nome ---- */
function cr163NomeCob(p){const ad=typeof FD156_ANUNCIO!=="undefined"?FD156_ANUNCIO:/^$/;
  for(const c of [p.tema,p.tag,p.subtema]){const s=String(c||"").trim();if(s&&!ad.test(s)&&!/^Outros/.test(s))return s}return ""}
{const _cb163=cobBarra;cobBarra=function(p){const h=_cb163.apply(this,arguments);if(!h||!p)return h;try{const nm=cr163NomeCob(p);if(!nm)return h;
  const et=cobEtapaAtual(p)||"",ad=typeof FD156_ANUNCIO!=="undefined"?FD156_ANUNCIO:/^$/,cauda=et&&!ad.test(et)&&norm(et)!==norm(nm)?et:"cobertura completa";
  return h.replace(/<span class="cb-t">[\s\S]*?<\/span>/,`<span class="cb-t"><b>${esc(nm)}</b> · ${esc(cauda)}</span>`)}catch(e){return h}}}

/* ---- (3) manchete da Capa: o texto aberto aparece na tela; toque repetido não fecha ---- */
var CR163_ABRIU={pid:"",t:0};
function cr163MostraAberto(el){try{const x=el.querySelector(":scope > .cpx");if(!x)return false;const nav=document.querySelector(".nav");
  const baixo=innerHeight-((nav&&nav.offsetHeight)||0)-16,r=x.getBoundingClientRect(),quer=Math.min(r.height,Math.max(120,(baixo-80)*.6));
  if(r.top+quer<=baixo)return true;
  const dy=Math.max(0,Math.min(r.top+quer-baixo,r.top-80));if(dy>4){window.PULA_SCROLL=Date.now()+600;window.scrollTo({top:scrollY+dy,behavior:"smooth"})}return true}catch(e){return false}}
{const _mi163=mostrarInteiro;mostrarInteiro=function(el){try{if(el&&el.classList&&el.classList.contains("cpi")&&el.classList.contains("aberto")){
    const r=el.getBoundingClientRect(),nav=document.querySelector(".nav"),baixo=innerHeight-((nav&&nav.offsetHeight)||0)-24;
    if(r.bottom>baixo&&cr163MostraAberto(el))return}}catch(e){}return _mi163.apply(this,arguments)}}
window.addEventListener("click",e=>{try{const b=e.target&&e.target.closest&&e.target.closest(".cpi-b[data-cpx]");if(!b)return;const pid=b.dataset.cpx;
  if(CR163_ABRIU.pid===pid&&Date.now()-CR163_ABRIU.t<800&&typeof CP_AB!=="undefined"&&CP_AB===pid){e.stopImmediatePropagation();e.preventDefault();return}
  if(typeof CP_AB==="undefined"||CP_AB!==pid)CR163_ABRIU={pid,t:Date.now()};else CR163_ABRIU={pid:"",t:0}}catch(_){}},true);
