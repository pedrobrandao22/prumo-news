/* ===== 25/11: notícia ao vivo (item 1 do balanço semanal) =====
   Entre uma rodada e outra o texto da manhã ficava no ar depois de o fato acontecer ("decidem a Sul-Americana às 20h de
   hoje" às 22h; "Novo Focus sai hoje" com o Focus já no Acabou de sair; COP31 "passa do prazo" com o Agora dizendo que
   acabou). Sem esperar a rodada, o app agora:
   1. lê a Agenda da edição (data, hora e pauta de cada evento): passou a hora e a notícia não foi atualizada depois,
      a linha de baixo do título diz que o evento começou (ou já foi) e que o resultado entra na próxima atualização;
      a matéria ganha a mesma faixa e some a pergunta "Quando é…?";
   2. lê o robô de manchetes (novidades.json, a cada 10 min): 3+ veículos com fato novo de uma pauta depois da última
      atualização dela = a notícia ganha a linha "Agora: «manchete» (veículos, há X)" no lugar do subtítulo e na matéria;
   3. limpa o "Acabou de sair" e a faixa Agora: junta o mesmo fato contado com títulos diferentes (Bolsonaro na UTI,
      Paredes), tira nota de beleza e celebridade, palavra dobrada ("na na"), país estrangeiro em Brasil e o que já é
      notícia da edição (iFood três vezes, Busca "ainda em apuração"). */

var AV212_STOP=new Set("a o as os um uma de da do das dos em na no nas nos e que com por para pra se sem ao aos à às é foi ser são diz após apos sobre mais menos seu sua seus suas pelo pela pelos pelas ter tem até ate como já ja ainda novo nova".split(" "));
function av212N(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
function av212Tk(s){return new Set(av212N(s).split(/[^a-z0-9º]+/).filter(w=>w.length>=3&&!AV212_STOP.has(w)))}
function av212Parecido(a,b){let n=0;a.forEach(w=>{if(b.has(w))n++});return n>=3||(n>=2&&n/Math.max(1,Math.min(a.size,b.size))>=.5)}

/* ---- 3. Acabou de sair / Agora ---- */
var AV212_LIXO=/\bbeleza\b|maquiag|\bmake (delicada|leve|natural|glow)|\blooks?\b|\bcoque\b|fofoca|vestido de noiva|\bbridal\b|\bmusa\b|\bboa forma\b|\bse casa com\b|\bde biquini\b/;
var AV212_PAIS=/\b(indonesia|filipinas|tailandia|vietna|malasia|singapura|australia|nova zelandia|nigeria|egito|marrocos|quenia|etiopia|sudao|congo|mocambique|angola|finlandia|suecia|noruega|dinamarca|holanda|belgica|espanha|portugal|italia|grecia|polonia|hungria|austria|suica|irlanda|escocia|paquistao|afeganistao|bangladesh|nepal|taiwan|libia|iraque|jordania|catar|emirados|dubai|haiti|nicaragua|honduras|guatemala|panama|japao|china|india|russia|ucrania|israel|gaza|eua|estados unidos|mexico|argentina|chile|peru|colombia|venezuela|bolivia|paraguai|uruguai|equador|cuba|canada|alemanha|franca|reino unido|turquia|coreia)\b/;
function av212Dobrada(t){return String(t||"").replace(/\b(na|no|de|da|do|em|o|a|e|que|para|com)\s+\1\b/gi,"$1")}
function av212PautaTk(){const F=typeof FEED!=="undefined"&&FEED;if(!F||!Array.isArray(F.pautas))return [];if(F._av212tk)return F._av212tk;
  const urls=new Set();const l=F.pautas.map(p=>{(p.links||[]).forEach(x=>{const u=x&&(x.url||x.link);if(u)urls.add(String(u).split("?")[0])});return {id:p.id,tk:av212Tk((p.neutro||{}).titulo),u:av212UltMs(p)}});
  l.urls=urls;try{Object.defineProperty(F,"_av212tk",{value:l,enumerable:false,configurable:true})}catch(e){}return l}
function av212Limpa(d){if(!d||typeof d!=="object"||!Array.isArray(d.novos)||d._av212)return d;
  try{const P=av212PautaTk(),out=[];
    d.novos.forEach(n0=>{if(!n0||!n0.assunto)return;const n=Object.assign({},n0);n.assunto=av212Dobrada(n.assunto);
      const ms0=Array.isArray(n.manchetes)?n.manchetes:[];
      n.manchetes=ms0.filter(m=>m&&!(m.titulo&&AV212_LIXO.test(av212N(m.titulo)))).map(m=>m.titulo?Object.assign({},m,{titulo:av212Dobrada(m.titulo)}):m);
      if(AV212_LIXO.test(av212N(n.assunto))||(ms0.length&&!n.manchetes.length))return;
      const txt=av212N([n.assunto].concat(n.manchetes.map(m=>m.titulo||"")).join(" "));
      if(n.secao==="brasil"&&AV212_PAIS.test(txt)&&!/\bbrasil(eir[oa]s?)?\b/.test(av212N(n.assunto)))n.secao="mundo";
      /* já é notícia da edição (o mesmo link ou o mesmo fato no título): fica de fora (a pauta mostra a novidade) */
      if(P.urls&&n.manchetes.some(m=>m.url&&P.urls.has(String(m.url).split("?")[0])))return;
      const tk=av212Tk(n.assunto),hn=Math.max(0,...n.manchetes.map(m=>av212HoraNv(m.hora)));
      if(hn&&P.some(p=>p.u>=hn&&av212Parecido(tk,p.tk)&&[...tk].filter(w=>p.tk.has(w)).length>=3))return;
      n._tk=tk;const ig=out.find(o=>av212Parecido(o._tk,tk));
      if(ig){const vs=new Set(ig.manchetes.map(m=>m.veiculo));n.manchetes.forEach(m=>{if(!m.veiculo||!vs.has(m.veiculo))ig.manchetes.push(m)});
        ig.n_fontes=Math.max(ig.n_fontes||0,n.n_fontes||0,new Set(ig.manchetes.map(m=>m.veiculo)).size);ig.relevante=ig.relevante||n.relevante;return}
      out.push(n)});
    out.forEach(n=>{try{delete n._tk}catch(e){}});d.novos=out;try{Object.defineProperty(d,"_av212",{value:1,enumerable:false})}catch(e){}}catch(e){}return d}
{const _ai212=agoraItens;agoraItens=function(){try{if(typeof NOVID_AG!=="undefined")av212Limpa(NOVID_AG)}catch(e){}return _ai212.apply(this,arguments)}}
if(typeof ac208Itens==="function"){const _ac212=ac208Itens;ac208Itens=function(){try{if(typeof NOVID_AG!=="undefined")av212Limpa(NOVID_AG)}catch(e){}return _ac212.apply(this,arguments)}}

/* ---- 1. agenda: evento de hoje com a hora vencida ---- */
function av212HoraMs(dia,hora){const m=/^(\d{1,2})h(\d{2})?$/.exec(String(hora||"").trim());if(!m||!/^\d{4}-\d{2}-\d{2}$/.test(dia||""))return 0;
  return Date.parse(`${dia}T${String(m[1]).padStart(2,"0")}:${m[2]||"00"}:00-03:00`)||0}
function av212HoraTxt(h){const m=/^(\d{1,2})h(\d{2})?$/.exec(String(h||""));return m?(m[2]&&m[2]!=="00"?`${+m[1]}h${m[2]}`:`${+m[1]}h`):String(h||"")}
function av212Eventos(F,agora){const hoje=typeof hojeSP==="function"?hojeSP():"",out={};
  (Array.isArray(F.agenda)?F.agenda:[]).forEach(a=>{if(!a||!a.pid||a.data!==hoje)return;const t=av212HoraMs(a.data,a.hora);if(!t||agora<t)return;
    if(!out[a.pid]||out[a.pid].t<t)out[a.pid]={t,hora:av212HoraTxt(a.hora),texto:String(a.texto||"")}});return out}
function av212UltMs(p){try{const u=(typeof ultimaAtualizacao==="function"&&ultimaAtualizacao(p))||p.hora;return Date.parse(u)||0}catch(e){return 0}}
function av212Nota(ev,agora){const jogo=/ x |\bjogo\b|\bfinal\b|rodada|partida|playoff/i.test(ev.texto),cedo=agora-ev.t<150*60e3;
  if(jogo)return cedo?`O jogo começou às ${ev.hora}; o resultado entra na próxima atualização.`:`O jogo foi às ${ev.hora}; o resultado ainda não entrou nesta notícia.`;
  return cedo?`Marcado para as ${ev.hora}; o que acontecer entra na próxima atualização.`:`Era às ${ev.hora}; o resultado ainda não entrou nesta notícia.`}
var AV212_FAQ=/^\s*(quando (é|será|sai|vai ser|começa|acontece)|que horas|a que horas|qual (o )?hor[aá]rio|onde (vai ser|será|assistir|passa))/i;
function av212Passa(F){if(!F||!Array.isArray(F.pautas))return F;const agora=Date.now(),evs=av212Eventos(F,agora);
  F.pautas.forEach(p=>{if(!p||!p.id)return;if(p._av212s!==undefined){p.subtitulo=p._av212s;delete p._av212s}if(p._av212f){p.faq=p._av212f;delete p._av212f}delete p._av212;
    const ev=evs[p.id];if(!ev||p.status==="encerrada")return;if(av212UltMs(p)>=ev.t)return;
    const nota=av212Nota(ev,agora);p._av212={tipo:"hora",nota,t:ev.t};
    p._av212s=p.subtitulo;p.subtitulo=nota+(typeof p.subtitulo==="string"&&p.subtitulo?" "+p.subtitulo:"");
    if(Array.isArray(p.faq)&&p.faq.some(q=>q&&AV212_FAQ.test(q.p||""))){p._av212f=p.faq;p.faq=p.faq.filter(q=>!(q&&AV212_FAQ.test(q.p||"")))}});
  return F}
{const _sn212=sanear;sanear=function(){const r=_sn212.apply(this,arguments);try{av212Passa(r)}catch(e){}return r}}

/* ---- 2. novidade do robô de manchetes numa pauta ---- */
function av212HoraNv(h){try{return typeof agHoraMs==="function"?agHoraMs(h):0}catch(e){return 0}}
function av212Novid(){const d=typeof NOVID_AG!=="undefined"&&NOVID_AG,F=typeof FEED!=="undefined"&&FEED;if(!d||!F||!Array.isArray(F.pautas))return;
  const g=Date.parse(d.gerado||"");if(g&&Date.now()-g>3*3600e3)return;
  (Array.isArray(d.acionar_itens)?d.acionar_itens:[]).forEach(it=>{if(!it||it.tipo!=="pauta"||!it.pid)return;const p=pautaById(it.pid);if(!p||p.status==="encerrada")return;
    const ms=(Array.isArray(it.manchetes)?it.manchetes:[]).filter(m=>m&&m.titulo&&!AV212_LIXO.test(av212N(m.titulo)));const u=av212UltMs(p);
    const novas=ms.filter(m=>av212HoraNv(m.hora)>u);if(new Set(novas.map(m=>m.veiculo)).size<3)return;
    const h=Math.max(...novas.map(m=>av212HoraNv(m.hora)));if(Date.now()-h>4*3600e3)return;
    const vs=[...new Set(novas.map(m=>m.veiculo).filter(Boolean))];const t=av212Dobrada(novas.sort((a,b)=>av212HoraNv(b.hora)-av212HoraNv(a.hora))[0].titulo);
    const vtx=vs.length>3?vs.slice(0,3).join(", ")+" e mais "+(vs.length-3):vs.length>1?vs.slice(0,-1).join(", ")+" e "+vs[vs.length-1]:vs[0];
    const nota=`Agora: «${t}» (${vtx}). O texto abaixo ainda não traz isso.`;
    if(p._av212&&p._av212.tipo==="novid"&&p._av212.nota===nota)return;
    if(p._av212s===undefined)p._av212s=p.subtitulo;p._av212={tipo:"novid",nota,t:h};p.subtitulo=`Agora: «${t}» (${vtx}).`})}
if(typeof atualizarAgora==="function"){const _aa212=atualizarAgora;atualizarAgora=function(){try{av212Novid()}catch(e){}return _aa212.apply(this,arguments)}}

/* matéria: a faixa no alto do texto */
(function(){const ob=()=>{const L=document.getElementById("layer");if(!L)return false;
  new MutationObserver(()=>{const m=L.querySelector(".mat:not(.av212-ok)");if(!m)return;m.classList.add("av212-ok");try{av212Novid()}catch(e){}
    const p=typeof MAT_PID!=="undefined"&&MAT_PID&&pautaById(MAT_PID);if(!p||!p._av212)return;const meta=m.querySelector(".mat-meta");if(!meta)return;
    const sub=m.querySelector(".mat-sub"),orig=typeof p._av212s==="string"?p._av212s:"";
    if(sub&&(sub.textContent.indexOf(p._av212.nota.slice(0,30))===0||/^Agora: «/.test(sub.textContent))){if(orig)sub.textContent=orig;else sub.remove()}
    const b=document.createElement("p");b.className="av212-faixa"+(p._av212.tipo==="novid"?" nv":"");b.setAttribute("role","note");b.textContent=p._av212.nota;meta.after(b)}).observe(L,{childList:true,subtree:true});return true};
  if(!ob())document.addEventListener("DOMContentLoaded",ob)})();
/* o relógio anda com o app aberto: a cada 5 min (e ao voltar para a aba) a nota da agenda é refeita */
setInterval(()=>{try{if(typeof FEED!=="undefined"&&FEED)av212Passa(FEED);av212Novid()}catch(e){}},300e3);
document.addEventListener("visibilitychange",()=>{try{if(!document.hidden&&typeof FEED!=="undefined"&&FEED){av212Passa(FEED);av212Novid()}}catch(e){}});
/* a edição em cache é saneada antes deste módulo carregar: passa uma vez agora (o 999 redesenha em seguida) */
try{if(typeof FEED!=="undefined"&&FEED){av212Passa(FEED);av212Novid()}}catch(e){}
