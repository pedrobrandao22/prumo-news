/* ---------- 184: Indicadores num card só + uso por recurso (Fase 1, decisões do Pedro de 17/11). Prefixo ui184/UI184. ----------
   1. Indicadores: UM card compacto na Capa com dólar, Selic, IPCA 12 meses e Ibovespa (variação do dia só no dólar e no
      Ibovespa), com a legenda "Atualizado em 16/11 às 18h07" (hora das cotações: indicadores.json › dados_em, gravado
      pelo tools/indicadores.py depois do fechamento). Sem página própria: saem o gráfico, os "outros indicadores", o
      painel da Economia e o atalho da Busca; tocar no card abre só uma explicação curta.
   2. Uso por recurso: Administração › App › Uso ganha o bloco "Por recurso", que soma no app as contagens que o painel já
      recebe (tl142_admin_uso) nos 23 recursos que o Pedro quer medir, com os menos usados destacados. Sem SQL novo.
      Contagens novas: indicadores (toque no card), indicadores_visto (o card apareceu na tela, 1 vez por abertura),
      publicar_cn_<tipo> (notícia comentada e os outros formatos, antes contados como publicar_post) e capa (abertura do
      app já na Capa, que acontecia antes de a telemetria ligar). */

/* ===== 1. card dos indicadores ===== */
var UI184_IDS=["dolar","selic","ipca12m","ibovespa"];
var UI184_NOME={dolar:"Dólar",selic:"Selic",ipca12m:"IPCA 12 meses",ibovespa:"Ibovespa"};
var UI184_MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
function ui184Itens(){const m={};try{indItens().forEach(x=>{if(x&&x.id&&x.valor)m[x.id]=x})}catch(e){}return UI184_IDS.map(id=>m[id]).filter(Boolean)}
/* "AAAA-MM-DDTHH:MM…" (hora de Brasília, como o robô grava) → {d:"16/11", h:"18h07"} */
function ui184Hora(s){const m=/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(s||""));if(!m)return null;return {d:m[3]+"/"+m[2],h:m[4]?(+m[4])+"h"+m[5]:""}}
function ui184Legenda(it){let s="";try{s=(IND_AUTO&&IND_AUTO.dados_em)||""}catch(e){}
  if(!s){const hs=it.filter(x=>/^(dolar|ibovespa)$/.test(x.id)&&x.hora).map(x=>String(x.hora)).sort();s=hs.pop()||""}
  if(!s){try{s=(IND_AUTO&&IND_AUTO.atualizado)||""}catch(e){}}
  if(!s){const ds=it.map(x=>String(x.data||"")).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort();s=ds.pop()||""}
  const q=ui184Hora(s);return q?"Atualizado em "+q.d+(q.h?" às "+q.h:""):""}
function ui184Sub(x){
  if(x.id==="dolar"||x.id==="ibovespa"){const v=String(x.variacao||"").trim();if(!v)return "";const d=/^(sobe|desce|estavel)$/.test(x.dir||"")?x.dir:"estavel";
    return `<em class="${d}">${{sobe:"▲",desce:"▼",estavel:"="}[d]} ${esc(v.replace(/^\+/,""))}</em>`}
  if(x.id==="selic")return `<small>meta do Copom</small>`;
  const m=/^\d{4}-(\d{2})$/.exec(String(x.ref||""));return `<small>${m?"até "+UI184_MES[+m[1]-1]:"IBGE"}</small>`}
function ui184Card(){const it=ui184Itens();if(!it.length)return "";const leg=ui184Legenda(it);
  return `<section class="ui184" aria-label="Indicadores"><button type="button" class="ui184-b" data-ui184 aria-label="Indicadores: ${esc(it.map(x=>UI184_NOME[x.id]+" "+x.valor).join(", "))}. ${esc(leg)}. Toque para saber o que é cada um">`+
    `<span class="ui184-h">Indicadores</span><span class="ui184-g">${it.map(x=>`<span class="ui184-c" data-ui184id="${esc(x.id)}"><span class="ui184-n">${esc(UI184_NOME[x.id])}</span><b>${esc(x.valor)}</b>${ui184Sub(x)}</span>`).join("")}</span>`+
    (leg?`<span class="ui184-at">${esc(leg)}</span>`:"")+`</button></section>`}
function ui184Explica(){try{uso("indicadores")}catch(e){}
  sheet("Indicadores",`<div class="ui184-ex"><p><b>Dólar</b>: cotação comercial no fechamento do dia, com a variação sobre o fechamento anterior.</p>`+
    `<p><b>Selic</b>: a taxa básica de juros, definida pelo Copom do Banco Central.</p><p><b>IPCA 12 meses</b>: a inflação oficial acumulada em 12 meses, medida pelo IBGE (sai uma vez por mês).</p>`+
    `<p><b>Ibovespa</b>: o principal índice da bolsa brasileira (B3) no fechamento, com a variação do dia.</p>`+
    `<p class="hint">Os números são atualizados uma vez por dia útil, depois do fechamento dos mercados. Fontes: Banco Central, IBGE e B3.</p></div>`)}
capaIndicadores=ui184Card;
/* sem página própria nem outros atalhos: Economia e Busca sem indicadores; qualquer toque antigo em indicador explica */
indPainel=function(){return ""};
if(typeof cm168IndBusca==="function")cm168IndBusca=function(){return ""};
addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const b=t.closest("[data-ui184],[data-indg]");if(!b)return;
  e.stopPropagation();e.preventDefault();ui184Explica()},true);
/* o card apareceu na tela: conta uma vez por abertura do app (o uso de um card que só se lê é vê-lo) */
var UI184_VISTO=false,UI184_OBS=null;
function ui184Observa(){if(UI184_VISTO||typeof IntersectionObserver!=="function")return;const el=document.querySelector("#v-capa .ui184");if(!el)return;
  if(!UI184_OBS)UI184_OBS=new IntersectionObserver(es=>{if(UI184_VISTO)return;if(es.some(x=>x.isIntersecting)){UI184_VISTO=true;try{tl142Conta("indicadores_visto")}catch(e){}UI184_OBS.disconnect()}},{threshold:.6});
  UI184_OBS.disconnect();UI184_OBS.observe(el)}
/* tela larga (Capa em 2 colunas, 033): o card vai para a coluna do lado, como os indicadores antigos */
function ui184Lado(){const sd=document.querySelector("#v-capa .cp-side"),c=document.querySelector("#v-capa .cp-main .ui184");if(sd&&c)sd.insertBefore(c,sd.querySelector(".cp-h")||null)}
{const _rc184=renderCapa;renderCapa=function(){const r=_rc184.apply(this,arguments);try{ui184Lado();ui184Observa()}catch(e){}return r}}

/* ===== 2. contagens que faltavam ===== */
/* notícia comentada (e os outros formatos) e repost eram todos "publicar_post": cada um ganha o seu nome */
{const _ci184=tl142ContaIns;tl142ContaIns=function(t,row){if(t!=="publicacoes")return _ci184.apply(this,arguments);
  const resto=[];(Array.isArray(row)?row:[row]).forEach(x=>{const es=x&&typeof x==="object"&&x.estilo&&typeof x.estilo==="object"?x.estilo:null;
    const k=es&&es.cn&&typeof es.cn==="object"&&/^[a-z]{2,8}$/.test(String(es.cn.k||""))?String(es.cn.k):"";
    if(k)tl142Conta("publicar_cn_"+k);else if(es&&es.rp&&typeof es.rp==="object"){/* o repost já conta como vn_repostar/vn_citar (112) */}else resto.push(x)});
  return resto.length?_ci184.call(this,t,resto):undefined}}
/* abertura do app já na Capa: o go("capa") da abertura roda antes de a telemetria existir */
{let _ui184c=false;const conta=()=>{if(_ui184c)return;_ui184c=true;try{if(VIEW==="capa")tl142Conta("capa")}catch(e){}};
  if(typeof VIEW==="string"&&VIEW==="capa")conta();else setTimeout(conta,0)}

/* ===== 3. painel de Uso: "Por recurso" ===== */
/* cada recurso = a soma das telas/ações dele (o primeiro que casa leva o evento) */
var UI184_REC=[
  ["Capa",/^(capa|capa_abre|capa_mais|capa_desde|ultimas|faixa|urgente|o_que_mudou)$/],
  ["Matéria",/^(materia|ler_mais|entenda|letra_materia|foto_zoom|previa)$/],
  ["Agenda",/^agenda/],
  ["Balança",/^lente_/],
  ["Busca",/^(busca|aba_busca)$/],
  ["Guardar",/^(guardar|salvar_post|tela_saved|pasta|arquivados)$/],
  ["Histórico",/^historico/],
  ["Feed",/^(tela_feed|filtro|filtro_sheet|secsub|secuf|feed_legenda)$/],
  ["Post",/^(publicar_post|criar_post|criar_caixa|menu_post|post_link)$/],
  ["Notícia comentada",/^(publicar_cn_nt|criar_nt|barra_sugestao)$/],
  ["Colunas",/^(coluna_|criar_coluna|publicar_coluna)/],
  ["Conversas",/^(tela_msgs|enviar|reagir_msg)$/],
  ["Repostar",/^(vn_repostar|vn_citar|repost)/],
  ["Curtir/comentar",/^(curtir|curtir_post|comentar|comentarios|reagir_post)$/],
  ["Seguir pessoas",/^(seguir|deixar_de_seguir|deixar_seguir|amizade|amigo_)/],
  ["Atividade",/^atividade/],
  ["Avisos",/^(notificacoes|notif_ativar|avisos)/],
  ["Hashtags",/^hashtag/],
  ["Em 1 min",/^(capa_1min|em1min|em_1min|um_min|5min)/],
  ["Quem noticiou",/^(cobertura|fontes|quem_noticiou|veiculos)$/],
  ["Coberturas",/^(pag_cobertura|coberturas_seguidas|deixar_cob|cob_)/],
  ["Indicadores",/^(indicadores|grafico)/],
  ["Giros de notícia",/^(story|story_materia|story_comentario|destaque)$/]];
function ui184Recurso(ev){for(const [n,re] of UI184_REC)if(re.test(ev))return n;return ""}
/* [[nome, total, [eventos]]] do maior para o menor, com os 23 recursos sempre presentes (zero também conta) */
function ui184PorRecurso(L){const tot={},evs={};UI184_REC.forEach(([n])=>{tot[n]=0;evs[n]=new Set()});
  (L||[]).forEach(x=>{const e=String(x&&x.evento||"");if(!e||(typeof TL142_ESTADO!=="undefined"&&TL142_ESTADO.has(e)))return;const n=ui184Recurso(e);if(!n)return;tot[n]+=+x.n||0;evs[n].add(e)});
  return UI184_REC.map(([n],i)=>[n,tot[n],[...evs[n]].sort(),i]).sort((a,b)=>b[1]-a[1]||a[3]-b[3])}
function ui184RecursoHTML(){const A=TL142.adm,l=ui184PorRecurso(A.uso);const mx=Math.max(1,...l.map(x=>x[1]));
  /* menos usados: os 5 de baixo entre os que tiveram uso, e todo recurso sem nenhum uso */
  const com=l.filter(x=>x[1]>0),zero=l.filter(x=>x[1]===0).map(x=>x[0]),baixo=com.slice(Math.max(0,com.length-5)).map(x=>x[0]).reverse();
  const pouco=new Set([...zero,...baixo]);
  const txt=[zero.length?"Sem uso: "+zero.join(", ")+".":"",baixo.length?"Menos usados: "+baixo.join(", ")+".":""].filter(Boolean).join(" ");
  return `<b class="cm-h">Por recurso</b><p class="hint ui184-ph">Últimos ${A.dias} dias. ${esc(txt)}</p>`+
    `<ul class="uso-b ui184-rec">${l.map(([n,v,e])=>`<li class="${pouco.has(n)?"ui184-pouco":""}" title="${esc(e.join(", ")||"sem registro")}"><span>${esc(n)}</span><i style="width:${(v*100/mx).toFixed(1)}%"></i><b>${v.toLocaleString("pt-BR")}</b></li>`).join("")}</ul>`}
{const _uh184=tl142UsoHTML;tl142UsoHTML=function(){let h=_uh184.apply(this,arguments);try{const r=ui184RecursoHTML(),k='<b class="cm-h">Telas e ações</b>';h=h.indexOf(k)>=0?h.replace(k,r+k):h+r}catch(e){}return h}}
try{Object.assign(TL142_NOMES,{indicadores:"Indicadores: explicação",indicadores_visto:"Indicadores: card visto",capa:"Capa",publicar_cn_nt:"Publicar notícia comentada",
  vn_repostar:"Repostar",vn_citar:"Repostar com comentário",cobertura:"Quem noticiou",pag_cobertura:"Coberturas: página",lente_menu:"Balança"})}catch(e){}
