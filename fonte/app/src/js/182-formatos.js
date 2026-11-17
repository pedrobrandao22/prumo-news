/* ---------- 182: formatos (Fase 1, decisões do Pedro de 17/11) ----------
   1. Esconder por ora, atrás de UM interruptor (FT182_ESCONDE): Quiz, Enquete, Número, De perto e a CRIAÇÃO de Giros pelo
      usuário. O código continua; para religar um formato, tire o nome da lista. Somem da caixa de criar, dos atalhos, do
      Perfil, da Capa, do Feed, da ajuda e dos textos que citavam esses formatos.
      - "quiz": o Quiz do dia some (a edição chega sem quiz; a tela "Quiz e enquetes" não abre mais).
      - "enquete": somem as enquetes das notícias e a Enquete da caixa; post antigo de enquete vira post de texto.
      - "numero" e "deperto": somem da caixa; post antigo vira post comum (texto e fotos continuam).
      - "giro": some tudo o que cria giro (caixa, "Seu giro" vazio, "+" do perfil, "Adicionar ao giro", "+ Novo"...).
        Os giros de notícia do app continuam, e o giro de quem já postou continua abrindo.
   2. "Em 5 min" e "Em 30 segundos" viram um só "Em 1 min": até 5 tópicos curtos no alto da Capa (resumo_dia da edição; sem
      ele, os títulos das mais importantes). Sai a bolinha "Em 5 min" do Feed e o botão "Ler as principais em 5 minutos";
      o resumo de cada notícia passa a se chamar só "Resumo".
   3. "Quem noticiou": na matéria, uma linha "Noticiado por 7 veículos · da esquerda à direita" que abre a lista completa;
      a barra de espectro sai do cartão do Feed e fica só na folha aberta pela matéria.
   Nomes com o prefixo ft182. */
var FT182_ESCONDE=["quiz","enquete","numero","deperto","giro"];
/* "Em 1 min" no lugar de "Em 5 min"/"Em 30 segundos" (false volta ao jeito antigo) */
var FT182_EM1MIN=true;
/* só nos testes automáticos (navegador controlado): religa tudo para testar o código que ficou guardado */
try{if(navigator.webdriver&&localStorage.getItem("prumo-teste-formatos")==="todos"){FT182_ESCONDE=[];FT182_EM1MIN=false}}catch(e){}
function ft182Esc(k){return FT182_ESCONDE.indexOf(k)>=0}
FT182_ESCONDE.forEach(k=>document.documentElement.classList.add("ft182-sem-"+k));if(FT182_EM1MIN)document.documentElement.classList.add("ft182-em1min");
const FT182_CN={enq:"enquete",ana:"numero",rel:"deperto"};

/* ===== 1a. dados da edição: sem quiz e sem enquete ===== */
function ft182Limpa(f){try{if(!f||typeof f!=="object")return f;if(ft182Esc("quiz"))f.quiz=[];
  if(ft182Esc("enquete")&&Array.isArray(f.pautas))f.pautas.forEach(p=>{if(p&&p.enquete)delete p.enquete})}catch(e){}return f}
{const _sa182=sanear;sanear=function(){const r=_sa182.apply(this,arguments);return r?ft182Limpa(r):r}}
if(typeof FEED!=="undefined"&&FEED){ft182Limpa(FEED);try{derivaQuiz();updatePlayBadge()}catch(e){}}
/* a tela "Quiz e enquetes" não abre */
{const _go182=go;go=function(v){const a=[...arguments];if(v==="play"&&ft182Esc("quiz")&&ft182Esc("enquete"))a[0]="capa";return _go182.apply(this,a)}}

/* ===== 1b. posts antigos de Enquete, Número e De perto: viram post comum ===== */
{const _de182=cn102De;cn102De=function(){const c=_de182.apply(this,arguments);return c&&FT182_CN[c.k]&&ft182Esc(FT182_CN[c.k])?null:c}}

/* ===== 1c. caixa de criar ===== */
for(let i=CP152_ANEXOS.length-1;i>=0;i--){const k=FT182_CN[CP152_ANEXOS[i][0]];if(k&&ft182Esc(k))CP152_ANEXOS.splice(i,1)}
function ft182Dica(){const d={nt:"Notícia comenta uma notícia da edição",enq:"Enquete pergunta aos amigos",ana:"Número junta um indicador ou gráfico",rel:"De perto conta o que você viu, com local e hora"};
  const l=CP152_ANEXOS.map(a=>d[a[0]]).filter(Boolean);return (l.length?l.join("; ")+". ":"")+"Use @ para marcar alguém."}
{const _ch182=cp152HTML;cp152HTML=function(){let h=_ch182.apply(this,arguments);try{
    if(ft182Esc("giro"))h=h.replace(/<button type="button" role="tab" data-cp152aba="giro"[^>]*>[^<]*<\/button>/,"");
    if(CP152_ANEXOS.length<5)h=h.replace(/(<p class="cp152-dica">)Notícia comenta[^<]*(<\/p>)/,"$1"+ft182Dica()+"$2")}catch(e){}return h}}
/* criar giro: nenhum caminho abre o editor de giro (giro de notícia e giro já postado continuam) */
{const _ca182=criarAbrir;criarAbrir=function(m){if(m==="story"&&ft182Esc("giro"))return;return _ca182.apply(this,arguments)}}
window.addEventListener("click",e=>{if(!ft182Esc("giro"))return;const t=e.target;if(!t||!t.closest)return;
  const b=t.closest('[data-criarde="story"],[data-upstory],[data-usadd],#layer [data-edmodo="story"],#layer [data-crtipo="story"]');
  const vazio=!b&&t.closest("#secs [data-meustory]")&&!(typeof pubStoriesDe==="function"&&pubStoriesDe(S.uid).length);
  if(b||vazio){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()}},true);
/* Perfil: a foto sem giro não tem "+" (nem abre a criação) */
{const _pc182=pfCab;pfCab=function(u){const h=_pc182.apply(this,arguments);if(!ft182Esc("giro")||typeof h!=="string")return h;
  return h.replace(' data-criarde="story"',"").replace('<i class="pf-mais" aria-hidden="true">+</i>',"")}}
/* textos que citavam os formatos escondidos */
{const _pt182=pfTiles;pfTiles=function(){const h=_pt182.apply(this,arguments);return typeof h==="string"&&ft182Esc("deperto")?h.replace("Comente uma notícia ou conte o que aconteceu perto de você.","Comente uma notícia ou escreva o que você pensa."):h}}
function ft182Tour(t){if(typeof t!=="string")return t;if(ft182Esc("enquete"))t=t.replace(/, vote nas enquetes/g,"").replace("curtir, comentar, votar e conversar","curtir, comentar e conversar");
  if(ft182Esc("deperto"))t=t.replace(": comentários, relatos do que viram e análises.",": comentários e opiniões.");return t}
{const _tt182=tourTelas;tourTelas=function(){const l=_tt182.apply(this,arguments);try{l.forEach(s=>{s.p=ft182Tour(s.p)})}catch(e){}return l}}
{const _tv182=sr150TelasVisitante;sr150TelasVisitante=function(){const l=_tv182.apply(this,arguments);try{l.forEach(s=>{if(s)s.p=ft182Tour(s.p)})}catch(e){}return l}}
{const _fb182=fc107Barra;fc107Barra=function(){const r=_fb182.apply(this,arguments);try{const b=$("#cn102-bar .fc107-bmais");if(b)b.setAttribute("aria-label","Nova publicação")}catch(e){}return r}}
try{if(ft182Esc("giro")){const c=NT124_TIPOS.find(t=>t[0]==="curtidas");if(c)c[2]="Nos seus posts e comentários (agrupadas)"}}catch(e){}

/* ===== 2. "Em 1 min" no alto da Capa ===== */
function ft182Um(){if(!FEED)return "";let ps=[];try{ps=capaEscolha().ps}catch(e){ps=FEED.pautas||[]}
  const rd=FEED.resumo_dia&&Array.isArray(FEED.resumo_dia.itens)?FEED.resumo_dia.itens.filter(x=>x&&typeof x.texto==="string"&&x.texto.trim()):[];
  let it=rd.filter(x=>!x.pid||ps.some(p=>p.id===x.pid)).slice(0,5);
  if(!it.length){const pr=p=>typeof p.prioridade==="number"?p.prioridade:0;it=[...ps].sort((a,b)=>pr(b)-pr(a)).slice(0,5).map(p=>({pid:p.id,texto:versao(p,lente()).titulo||""})).filter(x=>x.texto)}
  if(!it.length)return "";
  return `<section class="cp-1m ft182-1m" aria-label="Em 1 min"><h3><span>Em 1 min</span><button type="button" class="cp-1m-sh" data-1mshare aria-label="Mandar o resumo">${ICON.send}<span>Mandar</span></button></h3><ol>${it.map(x=>`<li>${x.pid?`<button type="button" data-cp1m="${esc(x.pid)}">${esc(x.texto)}</button>`:`<span>${esc(x.texto)}</span>`}</li>`).join("")}</ol></section>`}
if(FT182_EM1MIN){
/* entra logo depois do "Urgente" (urgHTML sem argumento só é chamado pela Capa); o do meio da Capa sai */
{const _ur182=urgHTML;urgHTML=function(){const h=_ur182.apply(this,arguments);if(arguments.length)return h;let u="";try{u=ft182Um()}catch(e){}return h+u}}
dia1min=function(){return ""};
/* sem "Em 5 min": a bolinha some (CSS) e a lista vazia tira o "Em 5 min" da sequência dos giros de notícia */
cincoLista=function(){return []};
abrir5min=function(){try{if($("#layer").innerHTML)closeLayer()}catch(e){}go("capa");try{scrollTo({top:0,behavior:"smooth"})}catch(e){}};
{const _ia182=igAbrir;igAbrir=function(sec){if(sec==="_5min"){abrir5min();return}return _ia182.apply(this,arguments)}}
/* o resumo de cada notícia ("Em 30 segundos") vira só "Resumo" */
{const _ab182=cpAberta;cpAberta=function(){const h=_ab182.apply(this,arguments);return typeof h==="string"?h.replace("<b>Em 30 segundos</b>","<b>Resumo</b>"):h}}
}

/* ===== 3. Quem noticiou: uma linha ===== */
const ft182Esp0=espectroHTML;
espectroHTML=function(){return ""};
function ft182Faixa(es){const pos={esquerda:0,centro:1,publica:1,direita:2};const v=es.filter(e=>e in pos);if(v.length<2)return "";
  const ns=v.map(e=>pos[e]),a=Math.min.apply(null,ns),b=Math.max.apply(null,ns);
  if(a===b)return a===0?"só da esquerda":a===2?"só da direita":v.every(e=>e==="publica")?"só veículos públicos":"só do centro";
  return (a===0?"da esquerda ":"do centro ")+(b===1?"ao centro":"à direita")}
function ft182Linha(p){let l=[];try{l=mt158Lista(p)}catch(e){l=(p.fontes||[]).map(k=>({k}))}const n=l.length;if(!n)return "";
  let es=[];try{es=l.map(v=>mt158Esp(v.k)).filter(Boolean)}catch(e){}const f=ft182Faixa(es);
  return `Noticiado por ${n} ${n===1?"veículo":"veículos"}${f?" · "+f:""}`}
coberturaTxt=function(p){return ft182Linha(p)||"Quem noticiou"};
{const _am182=abrirMateria;abrirMateria=function(pid){const r=_am182.apply(this,arguments);try{const p=pautaById(pid),m=$("#layer .mat");
    if(p&&m){const b30=m.querySelector(".mat-30>b");if(b30&&FT182_EM1MIN&&/^Em 30 segundos$/.test(b30.textContent))b30.textContent="Resumo";
      m.querySelectorAll(".mat-rod [data-cpfontes]").forEach(b=>b.remove());const tx=ft182Linha(p),meta=m.querySelector(".mat-meta");
      if(tx&&meta&&!m.querySelector(".ft182-qn"))meta.insertAdjacentHTML("afterend",`<button type="button" class="ft182-qn" data-cpfontes="${esc(p.id)}" aria-haspopup="dialog">${esc(tx)}<i aria-hidden="true">›</i></button>`)}}catch(e){}return r}}
/* a barra do espectro fica na folha com a lista completa */
{const _ac182=abrirCobertura;abrirCobertura=function(pid){const r=_ac182.apply(this,arguments);try{const p=pautaById(pid),h=document.querySelector(".sheet h4.cv-t");
    if(p&&h&&!document.querySelector(".sheet .ft182-sp")){const s=ft182Esp0(p);if(s)h.insertAdjacentHTML("beforebegin",`<div class="ft182-sp">${s}</div>`)}}catch(e){}return r}}
