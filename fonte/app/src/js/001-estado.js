/* ---------- estado ---------- */
let VISITA0=(lsGet("radar-prefs",{})||{}).visitaAtual||null;let NOVID=[];
const ssGet=(k,d)=>{try{const v=sessionStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};const ssSet=(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let FEED=null, VIEW="feed", THREAD=null, FILTRO=typeof ssGet("radar-filtro","tudo")==="string"?ssGet("radar-filtro","tudo"):"tudo";
const SEEN=new Set(lsArr("radar-vistos"));
const TAB={};const SLV=new Set();
const S={db:null,user:null,uid:null,email:"",membro:false,membros:{},amigos:new Set(),amigosOk:false,pedidosIn:[],pedidosOut:[],raw:{curtidas:{},votos:{},juntos:{},listas:{}},soc:{curtidas:{},votos:{},juntos:{}},msgsIn:[],msgsOut:[],salvos:{},leituras:{},cmts:{},_cmtDocs:[],quizDocs:{},quiz:{},quizDias:{},juntos:{},listas:{},lista:{},erros:[],errosResp:{},rodadas:{}};
const ehVisivel=u=>!!u&&(u===S.uid||S.amigos.has(u));
const amigosL=()=>[...S.amigos].filter(u=>u!==S.uid).sort((a,b)=>nomeDe(a).localeCompare(nomeDe(b),"pt-BR"));
const temAmigos=()=>amigosL().length>0;
const PREF=Object.assign({ordem:[],ocultas:[],ajuste:{sec:{},tag:{}},fonte:1,conhecidas:{}},lsObj("radar-prefs"));
function normPrefs(){if(!Array.isArray(PREF.ordem2))PREF.ordem2=[];if(!Array.isArray(PREF.ocultas))PREF.ocultas=[];if(!PREF.ajuste||typeof PREF.ajuste!=="object")PREF.ajuste={};if(!PREF.ajuste.sec||typeof PREF.ajuste.sec!=="object")PREF.ajuste.sec={};if(!PREF.ajuste.tag||typeof PREF.ajuste.tag!=="object")PREF.ajuste.tag={};if(!PREF.conhecidas||typeof PREF.conhecidas!=="object")PREF.conhecidas={};if(typeof PREF.fonte!=="number")PREF.fonte=1}normPrefs();
let NOVAS=new Set(), ATUALIZADAS=new Set(), LIDAS=new Map(Object.entries(lsObj("radar-lidas2")).filter(([,v])=>typeof v==="string"));
const ICON={
  like:`<svg class="ico" viewBox="0 0 24 24"><path class="dotc" d="M7.5 5.5h9l3 5.2-7.5 9.8-7.5-9.8z"/></svg>`,
  cmt:`<svg class="ico" viewBox="0 0 24 24"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/><path d="M8 8.5h8M8 11.5h5"/></svg>`,
  send:`<svg class="ico" viewBox="0 0 24 24"><path d="M21 3 10 14"/><path d="M21 3l-7 18-4-7-7-4z"/></svg>`,
  save:`<svg class="ico" viewBox="0 0 24 24"><path d="M9 3h6l-1 6 4 4H6l4-4z"/><path d="M12 13v8"/></svg>`,
  close:`<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  back:`<svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>`,
  dupla:`<svg class="ico jic" viewBox="0 0 24 24"><circle cx="8.5" cy="8" r="3"/><circle cx="16" cy="9" r="2.5"/><path d="M3 19c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5"/><path d="M14.5 14.2c.5-.1 1-.2 1.5-.2 2.3 0 4.2 1.6 4.6 4.5"/></svg>`,
  filtro:`<svg class="ico" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>`,
  dots:`<svg class="ico" viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/></svg>`,
  check:`<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  prumo:`<svg viewBox="0 0 24 24"><path d="M7 3h10"/><path d="M12 3v8"/><path d="M8.5 12.5h7l1.5 3-5 6-5-6z"/></svg>`,
  warn:`<svg viewBox="0 0 24 24"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.2"/></svg>`,
  ok:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>`
};
const COLORS=["#24406b","#8a5a17","#24533c","#7a2b37","#46337a","#5b6b7f"];
function corDe(uid){let h=0;for(const c of String(uid))h=(h*31+c.charCodeAt(0))>>>0;return COLORS[h%COLORS.length]}
const nomeDe=uid=>S.membros[uid]?.nome||S.achados?.[uid]||(uid===S.uid||uid==="eu"?"Você":"Alguém");
const avatar=uid=>`<span class="av" style="background:${corDe(uid)}">${esc((nomeDe(uid)[0]||"?").toUpperCase())}</span>`;
const avatares=us=>`<span class="avs">${us.slice(0,3).map(avatar).join("")}</span>`;
const nomeFonte=k=>FEED?.fontes?.[k]||k;
const ALLSECS=()=>FEED?.secoes?.length?FEED.secoes:[{id:"politica",nome:"Política"}];
const SECS=()=>{const all=ALLSECS(),ord=PREF.ordem2||[];const sorted=[...all].sort((a,b)=>{const ia=ord.indexOf(a.id),ib=ord.indexOf(b.id);return (ia<0?99+all.indexOf(a):ia)-(ib<0?99+all.indexOf(b):ib)});return sorted.filter(s=>!(PREF.ocultas||[]).includes(s.id))};
const secOf=p=>p.secao||"politica";
const secNome=id=>ALLSECS().find(s=>s.id===id)?.nome||id;
const secCor=id=>`var(--s-${safeId(id)},var(--accent))`;
const REGUA=()=>FEED?.regua||Object.keys(FEED?.fontes||{}).slice(0,10);
const temaDe=p=>p.tema||p.tag||"";
const visiveis=()=>(FEED?.pautas||[]).filter(p=>!(PREF.ocultas||[]).includes(secOf(p))&&!silenciado(p));
const prio=p=>(typeof p.prioridade==="number"?p.prioridade:(p.fontes||[]).length*8)+6*(PREF.ajuste?.sec?.[secOf(p)]||0)+5*(PREF.ajuste?.tag?.[norm(temaDe(p))]||0)+(ATUALIZADAS.has(p.id)?4:0)+(seguido(p)?25:0)-(lidaAtual(p)?70:0)+4*(AUTO[secOf(p)]||0);
const ordenadas=list=>PREF.feedModo==="recentes"?[...list].sort((a,b)=>versaoP(b).localeCompare(versaoP(a))):[...list].sort((a,b)=>prio(b)-prio(a)||String(b.hora).localeCompare(String(a.hora)));
const pautaById=id=>(FEED?.pautas||[]).find(p=>p.id===id);
function listaFeed(){if(!FEED)return [];
  if(FILTRO==="_leu")FILTRO="tudo";
  if(FILTRO==="_gostou")return ordenadas(visiveis().filter(p=>socialOf(p.id).likes.some(u=>u!==S.uid)));
  return FILTRO==="tudo"?ordenadas(visiveis().filter(meusTemasOk)):secLista()}
function secLista(){const l=pautasDa(FILTRO).filter(secFiltroOk);if(!l.length&&SECF&&SECF.sec===FILTRO&&(SECF.sub||SECF.uf)){SECF={sec:FILTRO,sub:"",uf:""};return pautasDa(FILTRO)}return l}
function nomeFiltro(f){if(f==="_leu")return "Lidas por amigos";if(f==="_gostou")return "Amigos gostaram";if(f==="tudo")return "Tudo";return secNome(f)}
const pautasDa=sec=>ordenadas((FEED?.pautas||[]).filter(p=>secOf(p)===sec&&!silenciado(p)));
const versaoP=p=>{const u=(p.atualizacoes||[]).map(x=>String(x.hora||"")).sort().pop();return u||String(p.hora||"")};
const seenKey=p=>p.id+"|"+versaoP(p);
const edId=()=>safeId(FEED?.atualizado_em||"x");
const _FDSP=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}),_FHSP=new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"});
const dataSP=iso=>{const t=new Date(iso||Date.now());return _FDSP.format(isNaN(t)?new Date():t)};
const leitId=()=>"d"+dataSP(FEED?.atualizado_em);
function quizId(){const q=JSON.stringify((FEED?.quiz||[]).map(x=>x.pergunta||""));let h=0;for(let i=0;i<q.length;i++)h=(h*31+q.charCodeAt(i))|0;return "d"+dataSP(FEED?.atualizado_em)+"-"+(h>>>0).toString(36)}
const tms=x=>{const t=Date.parse(x||"");return isNaN(t)?0:t};
const ultimaAtualizacao=p=>[...(p.atualizacoes||[]),...(p.correcoes||[]),...(Array.isArray(p.titulos)?p.titulos.slice(1):[])].map(u=>u&&u.hora).filter(Boolean).sort((a,b)=>tms(a)-tms(b)).pop()||"";

function quando(iso){const d=new Date(iso);if(isNaN(d))return "";const m=(Date.now()-d.getTime())/6e4;if(m<1)return "agora";if(m<60)return "há "+Math.floor(m)+" min";if(m<1440)return "há "+Math.floor(m/60)+" h";if(m<10080)return "há "+Math.floor(m/1440)+" d";return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
const diaHora=iso=>{const d=new Date(iso);if(isNaN(d))return "";const hj=dataSP(),dd=dataSP(iso);const dia=dd===hj?"hoje":d.toLocaleDateString("pt-BR",{weekday:"long",timeZone:"America/Sao_Paulo"});return dia+" às "+hhmm(iso)};
const hhmm=iso=>{const d=new Date(iso);return isNaN(d)?"":_FHSP.format(d).replace(":","h")};
function toast(t,acao,fn){document.querySelectorAll(".toast").forEach(x=>x.remove());const el=document.createElement("div");el.className="toast";el.setAttribute("role","status");const sp=document.createElement("span");sp.textContent=t;el.appendChild(sp);if(acao&&fn){const b=document.createElement("button");b.type="button";b.className="toast-a";b.textContent=acao;b.addEventListener("click",ev=>{ev.stopPropagation();el.remove();fn()});el.appendChild(b)}document.body.appendChild(el);setTimeout(()=>el.remove(),acao?4200:2600)}
function precisaConta(){if(!S.db||!S.uid){abrirLogin();return true}if(!S.membro){abrirFaltaConvite();return true}return false}
function snapOf(p){return {id:p.id,secao:secOf(p),tag:p.tag||"",titulo:p.neutro?.titulo||"",texto:p.neutro?.texto||"",imagem:p.imagem||null,fontes:p.fontes||[],links:(p.links||[]).slice(0,6),hora:p.hora||""}}
const snapById=id=>{const p=pautaById(id);if(p)return snapOf(p);const h=(typeof HIST!=="undefined"&&HIST[id])||null;
  return snapSocial(id)||S.salvos[id]?.snap||(S.lista||{})[id]?.snap||[...S.msgsIn,...S.msgsOut].find(m=>m.pid===id&&m.snap&&m.snap.titulo)?.snap||(typeof todosComentarios==="function"?todosComentarios().find(c=>c.pid===id&&c.snap&&c.snap.titulo)?.snap:null)||(h?{id,titulo:h.titulo,secao:h.secao,tag:h.tag,imagem:h.imagem,links:h.link?[h.link]:[]}:null)||null};

