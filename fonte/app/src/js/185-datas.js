/* ===== 185. Datas relativas na hora de mostrar (Fase 2, 18/11) =====
   As rodadas gravam o dia com o número ("na terça (17)", "quarta (18/11)"): é a data absoluta do fato e nunca envelhece.
   O app troca por "hoje", "ontem" ou "amanhã" pela data de HOJE do leitor (fuso de São Paulo), na hora de mostrar:
   "na terça (17)" lido na terça → "hoje"; na quarta → "ontem". Fora de ontem/hoje/amanhã o texto fica como está.
   Um lugar só: um observador troca os nós de texto que entram na tela (título, linha fina, pontos, social, resumo do dia,
   breves, agenda, atualizações, FAQ…), menos o que o leitor escreveu (posts, comentários, conversas) e campos de edição.
   O dia da semana tem de bater com o número (e com o mês, quando vier "17/11"); senão nada muda.
   Na virada do dia (app aberto de um dia para o outro), refaz a partir do texto original guardado.
   As páginas de compartilhamento (m/) são estáticas e continuam com a data absoluta; o texto que sai do app (a bolha
   de "Mandar notícia", que é o que vai para o WhatsApp) também (18/11). */
var DT185_SEM=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
var DT185_RX=/(^|[^A-Za-zÀ-ÿ])(?:(n[ao]\s+(noite|tarde|manhã|madrugada)\s+d[eao]\s+)|((?:antes|depois)\s+d[eao]\s+)|((até|desde|para)\s+(?:[ao]\s+)?)|((?:n[ao]|nest[ae]|d[ao]|dest[ae]|de|[ao])\s+))?(segunda|terça|quarta|quinta|sexta|sábado|domingo)(?:-feira)?\s*\((\d{1,2})(?:\/(\d{1,2}))?\)/gi;
/* verbo no passado (pretérito perfeito, 3ª pessoa): aprovou, votou, subiu, bateu, fez, disse, foi, teve, foram… */
var DT185_PASSADO=/(?:^|[^A-Za-zÀ-ÿ])(?:[a-zà-ÿ]{2,}(?:ou|eu|iu|aram|eram|iram)|foi|fez|disse|teve|houve|deu|veio|pôs|quis|trouxe|soube|foram|fizeram|disseram|tiveram|deram|vieram)(?:-(?:se|o|a|os|as|lhe))?(?=[^A-Za-zÀ-ÿ]|$)/i;
/* 19/11 (corretor, causa "hoje depois da meia-noite"): verbo no presente/futuro na oração ("jogam", "vai", "está", "fica"):
   com ele, "de ontem"/"até ontem" fica errado ("jogam às 20h30 de ontem", "vai até ontem", "não está na pauta de ontem") */
var DT185_PRESENTE=/(?:^|[^A-Za-zÀ-ÿ])(?:é|são|está|estão|fica|ficam|vai|vão|tem|têm|segue|seguem|deve|devem|pode|podem|será|serão|vota|joga|enfrenta|decide|retoma|começa|termina|acontece|recebe|[a-zà-ÿ]{2,}(?:am|em))(?=[^A-Za-zÀ-ÿ]|$)/i;
function dt185Oracao(tx,o,n){return tx.slice(0,o).split(/[.!?;:,]\s|\s(?:e|mas|que|quando|onde)\s/).pop().trim().split(/\s+/).slice(-(n||4)).join(" ")}
/* "de ontem"/"até ontem" só sem verbo no presente na oração (o passado vale) */
function dt185PresenteSem(fr){return DT185_PRESENTE.test(fr)&&!DT185_PASSADO.test(fr)}
var DT185_TEM=/\(\d{1,2}(?:\/\d{1,2})?\)|\d\/\d/;
/* 18/11 (corretor): o dia só com número e mês, sem o nome da semana ("fica fora da pauta em 18/11", "Em 15/11, Kassio
   sinalizou", "até 20/11"): só com "em", "até" ou "desde" antes, e nunca seguido de outra barra ou dígito (ano, faixa) */
var DT185_DM=/(^|[^A-Za-zÀ-ÿ0-9\/])(em|até|desde)\s+(\d{1,2})\/(\d{1,2})(?![\d\/]|\s*(?:a|e|até)\s+\d)/gi;
var DT185_PREP_FORA=/(?:^|[^A-Za-zÀ-ÿ])(?:n[ao]|nest[ae]|d[ao]|dest[ae]|de|[ao]|até|desde|para|antes|depois)\s*$/i;
/* nada do que o leitor escreve (as mesmas caixas em que o app liga #hashtags) nem campos de edição */
var DT185_FORA="textarea,input,script,style,[contenteditable],.up-leg,.up-tx,.us-tx,.up-tudo,.cn102-ex,.clist li,.cmt,.fc107-tq~p,.ht-cm-tx,.dm-utx,.cs123-corpo,.ed132,.env-bolha,[data-dt185-nao]";
var DT185={dia:"",m:new WeakMap(),nos:new Set(),fila:new Set(),ag:false};

/* "ontem", "hoje", "amanhã" ou "" para o dia escrito (nome da semana, número, mês opcional) visto no dia hoje (AAAA-MM-DD) */
function dt185Qual(nome,dia,mes,hoje){const wd=DT185_SEM.indexOf(String(nome).toLowerCase());if(wd<0||!hoje)return "";
  const R=["ontem","hoje","amanhã"];for(let k=-1;k<=1;k++){const d=somaDias(hoje,k),x=new Date(d+"T12:00:00Z");
    if(x.getUTCDate()===+dia&&x.getUTCDay()===wd&&(!mes||x.getUTCMonth()+1===+mes))return R[k+1]}return ""}

/* o mesmo para "18/11" (dia e mês, sem a semana) */
function dt185QualDM(dia,mes,hoje){if(!hoje)return "";const R=["ontem","hoje","amanhã"];
  for(let k=-1;k<=1;k++){const x=new Date(somaDias(hoje,k)+"T12:00:00Z");if(x.getUTCDate()===+dia&&x.getUTCMonth()+1===+mes)return R[k+1]}return ""}

/* a troca em si, num texto (função pura: o teste e outros arquivos podem chamar) */
function dt185Rel(s,hoje){s=String(s??"");if(!DT185_TEM.test(s))return s;hoje=hoje||hojeSP();
  if(s.indexOf("/")>=0)s=s.replace(DT185_DM,function(m0,a,prep,dia,mes,o,tx){
    const rel=dt185QualDM(dia,mes,hoje);if(!rel)return m0;const p=prep.toLowerCase();
    if(rel==="ontem"&&p==="em"){const fr=tx.slice(0,o).split(/[.!?;:,]\s|\s(?:e|mas|que|quando|onde)\s/).pop().trim().split(/\s+/).slice(-4).join(" ");
      /* "Em 15/11, Kassio sinalizou": no começo da frase, o verbo vem depois */
      const dep=tx.slice(o+m0.length).split(/[.!?;]/)[0].trim().split(/\s+/).slice(0,4).join(" ");
      if(!DT185_PASSADO.test(fr)&&!(/^[,\s]*$/.test(fr)&&DT185_PASSADO.test(dep)))return m0}
    if(rel==="ontem"&&p==="até"&&dt185PresenteSem(dt185Oracao(tx,o,7)))return m0;
    const ini=m0.slice(a.length);let n=p==="em"?rel:p+" "+rel;
    if(/^[A-ZÀ-Ý]/.test(ini))n=n[0].toUpperCase()+n.slice(1);return a+n});
  return s.replace(DT185_RX,function(m0,a,per,perNome,antesDepois,prepTudo,prep,art,nome,dia,mes){
    const rel=dt185Qual(nome,dia,mes,hoje);if(!rel||antesDepois)return m0; /* "antes de ontem"/"depois de amanhã" mudariam o sentido */
    /* "ontem" só quando a frase já está no passado (18/11): "O Senado vota na terça (17)" lido na quarta viraria "vota
       ontem"; sem verbo no passado antes da data na mesma frase, fica a data por extenso. "desde/até" e "de ontem" valem. */
    if(rel==="ontem"){if(prepTudo&&/^para/i.test(prepTudo))return m0; /* "prevista para ontem" não serve */
      if((prepTudo&&/^até/i.test(prepTudo))||(art&&/^d/i.test(art))){const o=arguments[arguments.length-2],tx=arguments[arguments.length-1];
        if(dt185PresenteSem(dt185Oracao(tx,o,7)))return m0}
      if(!(prepTudo&&/^(até|desde)/i.test(prepTudo))&&!(art&&/^d/i.test(art))){const o=arguments[arguments.length-2],tx=arguments[arguments.length-1];
        /* só a última oração antes da data conta: "A Nvidia perdeu 3% e divulga na quarta (17)" fica com a data */
        /* e o verbo no passado tem de estar colado à data (até 4 palavras antes): "Quem foi pré-selecionado valida a
           inscrição na terça (17)" fica com a data */
        const fr=tx.slice(0,o).split(/[.!?;:,]\s|\s(?:e|mas|que|quando|onde)\s/).pop().trim().split(/\s+/).slice(-4).join(" ");if(!DT185_PASSADO.test(fr))return m0}}
    const ini=m0.slice(a.length);let n;
    if(per){const pn=perNome.toLowerCase();n=rel+(pn==="noite"?" à noite":pn==="tarde"?" à tarde":pn==="manhã"?" de manhã":" de madrugada")}
    else if(prep)n=prep.toLowerCase()+" "+rel;
    else if(art&&/^d/i.test(art))n="de "+rel;
    else n=rel;
    if(/^[A-ZÀ-Ý]/.test(ini))n=n[0].toUpperCase()+n.slice(1);
    return a+n})}

/* texto anterior ao nó, no mesmo bloco (para não deixar "na hoje" quando o dia vem num <b> separado do "na") */
function dt185Antes(t){let n=t,txt="";for(let i=0;i<2&&n&&!txt;i++){let p=n.previousSibling;while(p&&!txt){txt=(p.textContent||"");p=p.previousSibling}n=n.parentNode}return txt}

/* 22/11 (corretor): texto com data própria (entrada da linha do tempo, atualização, manchete antiga) só ganha
   "hoje/ontem/amanhã" quando a própria entrada é de hoje; de outro dia, a data fica escrita ("sábado (21)"), senão
   "final de hoje" numa entrada de 17/11 parece que a final foi dia 17. A data vem de [data-dt185-ref] (AAAA-MM-DD) ou
   do <time datetime> da própria <li>. */
function dt185Ref(el){try{if(!el||!el.closest)return "";const a=el.closest("[data-dt185-ref]");if(a)return String(a.getAttribute("data-dt185-ref")||"").slice(0,10);
  const li=el.closest("li");if(li){const tm=[...li.children].find(c=>c.tagName==="TIME"&&c.getAttribute("datetime"));if(tm)return String(tm.getAttribute("datetime")).slice(0,10)}}catch(e){}return ""}
function dt185No(t){const v=t.nodeValue||"",r=DT185.m.get(t);if(!r&&!DT185_TEM.test(v))return;
  const o=r&&r.v===v?r.o:v;const ref=dt185Ref(t.parentElement);let n=ref&&/^\d{4}-\d{2}-\d{2}$/.test(ref)&&ref!==DT185.dia?o:dt185Rel(o,DT185.dia);
  if(n!==o){DT185_RX.lastIndex=0;const m=DT185_RX.exec(o);DT185_RX.lastIndex=0;
    if(m&&m.index===0&&!/\S/.test(m[1])&&!m[2]&&!m[4]&&!m[5]&&!m[7]&&DT185_PREP_FORA.test(dt185Antes(t)))n=o}
  if(n!==v)t.nodeValue=n;if(n!==o||r){DT185.m.set(t,{o,v:n});DT185.nos.add(t)}}

function dt185Fora(el){try{return !!(el&&el.closest&&el.closest(DT185_FORA))}catch(e){return false}}
function dt185Varre(no){if(!no)return;
  if(no.nodeType===3){if(DT185_TEM.test(no.nodeValue||"")||DT185.m.has(no)){if(!dt185Fora(no.parentElement))dt185No(no)}return}
  if(no.nodeType!==1&&no.nodeType!==11)return;if(!DT185_TEM.test(no.textContent||""))return;if(no.nodeType===1&&dt185Fora(no))return;
  const w=document.createTreeWalker(no,NodeFilter.SHOW_TEXT,null);let t;const l=[];while((t=w.nextNode()))if(DT185_TEM.test(t.nodeValue||""))l.push(t);
  l.forEach(t=>{if(!dt185Fora(t.parentElement))dt185No(t)})}

function dt185Fila(){DT185.ag=false;const l=[...DT185.fila];DT185.fila.clear();l.forEach(n=>{try{if(n.isConnected)dt185Varre(n)}catch(e){}})}
/* virada do dia com o app aberto: refaz todos os textos trocados a partir do original */
function dt185Dia(){const h=hojeSP();if(h===DT185.dia)return;DT185.dia=h;
  DT185.nos.forEach(t=>{if(!t.isConnected){DT185.nos.delete(t);return}try{dt185No(t)}catch(e){}});
  try{dt185Varre(document.body)}catch(e){}}
function dt185Liga(){DT185.dia=hojeSP();try{dt185Varre(document.body)}catch(e){}
  try{new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)DT185.fila.add(n)}));
    if(DT185.nos.size>3000)DT185.nos.forEach(t=>{if(!t.isConnected)DT185.nos.delete(t)});
    if(DT185.fila.size&&!DT185.ag){DT185.ag=true;Promise.resolve().then(dt185Fila)}}).observe(document.body,{childList:true,subtree:true})}catch(e){}
  setInterval(dt185Dia,60000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)dt185Dia()})}
if(document.body)dt185Liga();else document.addEventListener("DOMContentLoaded",dt185Liga);
