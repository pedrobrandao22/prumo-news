/* ---------- 121 (Fase 4, 18/11): a manchete antes do resto do app ----------
   Na primeira visita em rede lenta, o feed-leve.json (pré-carga do 000) chega bem antes do resto da página (~2 s contra ~5 s
   em 3G), mas a Capa só era desenhada quando todo o código chegava e rodava. Este trecho, que roda logo depois do esqueleto
   do 120, desenha o alto da Capa (cabeçalho, faixa "Agora", "Ao vivo" e a manchete) assim que o feed-leve chega, com a
   MESMA marcação de renderCapa (200) — a troca para a Capa de verdade não mexe em nada de lugar. A arte da manchete sai sem
   o desenho (só o papel); o desenho entra com a Capa de verdade.
   Só na primeira visita, sem nada guardado no aparelho (sem edição guardada, sem preferências): aí não há lida, "Novo",
   lente, seção escondida nem foto de arquivo, e o desenho depende só do feed. Com urgentes ou manchete com foto própria,
   não desenha (fica o esqueleto).
   As funções abaixo são CÓPIAS das do app (nomes locais, nada global além de window.__f4): renderCapa, cpItem, capaArte,
   capaSub, capaChapeu, capaEdicao, cobStatus, atualizadoTxt/horaDia, agoraItens/agoraHTML (035) e dt185Rel (185).
   Mudou uma delas? O teste review2/t_pre_capa.js compara o alto desenhado aqui com o da Capa pronta e avisa. */
(function(){try{
  var v=document.getElementById("v-capa");if(!v||!v.querySelector(".cp-sk.ab141-sk")||!window.FL119_PRE)return;
  var ls=function(k){try{return localStorage.getItem(k)}catch(e){return "x"}};
  if(ls("radar-feed")||ls("radar-prefs"))return;
  /* 20/11 (testador): quem abre um link de notícia (#m=, /m/...) via a Capa com outra manchete por ~4 s antes da matéria;
     nesse caso não desenha a manchete (fica o esqueleto até a matéria abrir) */
  if(/(^|[#&])m=/.test(location.hash.slice(1))||/[?&]m=/.test(location.search)||/\/m\//.test(location.pathname)||document.referrer.indexOf("/m/")>=0&&location.hash.length>1)return;
  var NV=null,nvOk=false;try{if(ab141Pre.novid)ab141Pre.novid.then(function(d){NV=d;nvOk=true})}catch(e){}
  FL119_PRE.then(function(txt){if(!txt)return;var F;try{F=JSON.parse(txt)}catch(e){return}if(!F||!Array.isArray(F.pautas))return;
    var feito=false,vai=function(){if(feito)return;feito=true;try{desenha(F,nvOk?NV:null)}catch(e){}};
    if(nvOk||!ab141Pre.novid)vai();else{ab141Pre.novid.then(vai,vai);setTimeout(vai,400)}},function(){});

  function desenha(F,NV){
    if(typeof renderCapa==="function")return;  /* o app já rodou: ele desenha */
    if(!v.querySelector(".cp-sk.ab141-sk")||v.querySelector(".cpi"))return;
    var esc=function(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")};
    var tms=function(x){var t=Date.parse(x||"");return isNaN(t)?0:t};
    var secOf=function(p){return p.secao||"politica"};
    var safeId=function(s){return String(s||"x").replace(/[^A-Za-z0-9_\-.~:@+]/g,"-").slice(0,120)||"x"};
    var secCor=function(id){return "var(--s-"+safeId(id)+",var(--accent))"};
    var secs=F.secoes&&F.secoes.length?F.secoes:[{id:"politica",nome:"Política"}];
    var secNome=function(id){for(var i=0;i<secs.length;i++)if(secs[i].id===id)return secs[i].nome||id;return id};
    var temaDe=function(p){return p.tema||p.tag||""};
    var FD=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}),FH=new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"});
    var dataSP=function(iso){var t=new Date(iso||Date.now());return FD.format(isNaN(t)?new Date():t)};
    var hojeSP=function(){return FD.format(new Date())};
    var hhmm=function(iso){var d=new Date(iso);return isNaN(d)?"":FH.format(d).replace(":","h")};
    var somaDias=function(iso,n){var d=new Date(iso+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
    var quando=function(iso){var d=new Date(iso);if(isNaN(d))return "";var m=(Date.now()-d.getTime())/6e4;if(m<1)return "agora";if(m<60)return "há "+Math.floor(m)+" min";if(m<1440)return "há "+Math.floor(m/60)+" h";if(m<10080)return "há "+Math.floor(m/1440)+" d";return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})};
    var horaDia=function(iso){var d=new Date(iso);if(isNaN(d))return "";var dia=dataSP(iso),hoje=hojeSP();if(dia===hoje)return hhmm(iso);
      if(dia===somaDias(hoje,-1))return "ontem, "+hhmm(iso);var w=d.toLocaleDateString("pt-BR",{weekday:"short",timeZone:"America/Sao_Paulo"}).replace(".","");return w+" ("+(+dia.slice(8,10))+"), "+hhmm(iso)};
    var atualizadoTxt=function(iso){var t=horaDia(iso);if(!t)return "Atualizado";return dataSP(iso)===hojeSP()?"Atualizado às "+t:"Atualizado "+t.replace(/, /,", às ")};
    var ultimaAtualizacao=function(p){return [].concat(p.atualizacoes||[],p.correcoes||[],Array.isArray(p.titulos)?p.titulos.slice(1):[]).map(function(u){return u&&u.hora}).filter(Boolean).sort(function(a,b){return tms(a)-tms(b)}).pop()||""};
    var capaFrase=function(t,n){t=String(t||"").trim();if(t.length<=n)return t;var fr=t.replace(/([.!?])\s+/g,"$1\u0001").split("\u0001"),o="";for(var i=0;i<fr.length;i++){if((o+" "+fr[i]).trim().length>n)break;o=(o+" "+fr[i]).trim()}return o||t.slice(0,n).replace(/\s+\S*$/,"")+"…"};
    var capaChapeu=function(p){return (/^Outros/.test(p.subtema||"")?"":p.subtema)||p.tag||secNome(secOf(p))};
    var cobStatus=function(p){var st=p&&p.status;if(st==="ao_vivo")return '<span class="cst vivo"><i></i>Ao vivo</span>';if(st==="encerrada")return '<span class="cst enc">Encerrada</span>';return ""};
    var titulo=function(p){return (p.neutro||{}).titulo};
    var corRecente=function(p){var c=(p&&p.correcoes||[]).filter(function(x){return x&&x.texto});if(!c.length)return false;c=c.reduce(function(a,b){return tms(b.hora)>tms(a.hora)?b:a});return !!(c&&c.hora&&Date.now()-tms(c.hora)<48*3600e3)};
    /* datas relativas (cópia de dt185Rel, 185): "quarta (18)" lido na quarta vira "hoje" */
    var SEM=["domingo","segunda","terça","quarta","quinta","sexta","sábado"],
      RX=/(^|[^A-Za-zÀ-ÿ])(?:(n[ao]\s+(noite|tarde|manhã|madrugada)\s+d[eao]\s+)|((?:antes|depois)\s+d[eao]\s+)|((até|desde|para)\s+(?:[ao]\s+)?)|((?:n[ao]|nest[ae]|d[ao]|dest[ae]|de|[ao])\s+))?(segunda|terça|quarta|quinta|sexta|sábado|domingo)(?:-feira)?\s*\((\d{1,2})(?:\/(\d{1,2}))?\)/gi,
      PASSADO=/(?:^|[^A-Za-zÀ-ÿ])(?:[a-zà-ÿ]{2,}(?:ou|eu|iu|aram|eram|iram)|foi|fez|disse|teve|houve|deu|veio|pôs|quis|trouxe|soube|foram|fizeram|disseram|tiveram|deram|vieram)(?:-(?:se|o|a|os|as|lhe))?(?=[^A-Za-zÀ-ÿ]|$)/i,
      TEM=/\(\d{1,2}(?:\/\d{1,2})?\)/,HOJE=hojeSP();
    var qual=function(nome,dia,mes){var wd=SEM.indexOf(String(nome).toLowerCase());if(wd<0)return "";var R=["ontem","hoje","amanhã"];
      for(var k=-1;k<=1;k++){var x=new Date(somaDias(HOJE,k)+"T12:00:00Z");if(x.getUTCDate()===+dia&&x.getUTCDay()===wd&&(!mes||x.getUTCMonth()+1===+mes))return R[k+1]}return ""};
    var rel=function(s){s=String(s==null?"":s);if(!TEM.test(s))return s;
      return s.replace(RX,function(m0,a,per,perNome,antesDepois,prepTudo,prep,art,nome,dia,mes){var r=qual(nome,dia,mes);if(!r||antesDepois)return m0;
        if(r==="ontem"){if(prepTudo&&/^para/i.test(prepTudo))return m0;
          if(!(prepTudo&&/^(até|desde)/i.test(prepTudo))&&!(art&&/^d/i.test(art))){var o=arguments[arguments.length-2],tx=arguments[arguments.length-1];
            var fr=tx.slice(0,o).split(/[.!?;:,]\s|\s(?:e|mas|que|quando|onde)\s/).pop().trim().split(/\s+/).slice(-4).join(" ");if(!PASSADO.test(fr))return m0}}
        var ini=m0.slice(a.length),n;
        if(per){var pn=perNome.toLowerCase();n=r+(pn==="noite"?" à noite":pn==="tarde"?" à tarde":pn==="manhã"?" de manhã":" de madrugada")}
        else if(prep)n=prep.toLowerCase()+" "+r;else if(art&&/^d/i.test(art))n="de "+r;else n=r;
        if(/^[A-ZÀ-Ý]/.test(ini))n=n[0].toUpperCase()+n.slice(1);return a+n})};
    var et=function(s){return esc(rel(s))};
    /* urgentes (até 3 h): não desenha, fica o esqueleto */
    var ag=Date.now();if((F.breves||[]).some(function(b){return b&&b.urgente&&tms(b.hora)&&ag-tms(b.hora)<3*3600e3}))return;
    /* manchete (capaEscolha) */
    var ps=F.pautas.filter(function(p){return p&&typeof p==="object"}),by=function(id){for(var i=0;i<ps.length;i++)if(ps[i].id===id)return ps[i];return null};
    var pr=function(p){return typeof p.prioridade==="number"?p.prioridade:0};
    var ord=ps.slice().sort(function(a,b){return pr(b)-pr(a)||String(b.hora).localeCompare(String(a.hora))});
    var c=F.capa||{},man=by(c.manchete)||ord[0];if(!man||!titulo(man))return;
    var linha=c.manchete===man.id?c.linha_fina:"";
    /* cabeçalho (capaEdicao) */
    /* hora da edição = horaEdicaoMs (200): o feed ou, depois dele, a notícia mais nova de "Acabou de sair" (ac208Itens) ou da
       faixa "Agora" (agoraItens), com os mesmos filtros; antes daqui saía só a hora do feed e a Capa nascia com a hora velha */
    var edMs=(function(){var m=Date.parse(F.atualizado_em||"");if(!isFinite(m)||!NV)return m;var ag2=Date.now(),lim=ag2+60e3,g=Date.parse(NV.gerado||"");
      var LX=/^\s*(?:v[íi]deos?|assista|ou[çc]a|podcast|ao vivo|programa)\b|jornal d[aoe]s?\s|\bedi[çc][ãa]o d[aoe]\b|\bde (?:segunda|ter[çc]a|quarta|quinta|sexta)-feira,\s*\d|\bpodcast\b|\bepis[óo]dio\b|\s#\d{2,}\s*$/i;
      var hM=function(x){var r=typeof x==="string"&&x.match(/^(\d{2})\/(\d{2}) (\d{2})h(\d{2})$/);if(!r)return 0;var ano=new Date().getFullYear();var t=Date.parse(ano+"-"+r[2]+"-"+r[1]+"T"+r[3]+":"+r[4]+":00-03:00");if(t>Date.now()+864e5)t=Date.parse((ano-1)+"-"+r[2]+"-"+r[1]+"T"+r[3]+":"+r[4]+":00-03:00");return t||0};
      var cu=function(t){var s=String(t||"").replace(/\s+/g," ").trim();s=s.replace(/[;,.:–-]?\s*\b(veja|entenda|saiba|confira|assista|ao vivo)\b.*$/i,"").trim();s=s.replace(/[\s;,:–-]+$/,"");if(s.length>170){s=s.slice(0,170).replace(/\s+\S*$/,"")+"…"}return s};
      var tOk=function(l){for(var i=0;i<l.length;i++){var c=cu(l[i]);if(c&&c.replace("…","").length>=24)return c}return ""};
      var po=function(h){if(h>m&&h<=lim)m=h};
      var mx=function(ms){var hs=(Array.isArray(ms)?ms:[]).map(function(x){return hM(x&&x.hora)}).filter(Boolean);return hs.length?Math.max.apply(null,hs):0};
      var nv=Array.isArray(NV.novos)?NV.novos:[];
      if(!(g&&ag2-g>8*3600e3))nv.forEach(function(n){if(!n||!n.assunto||n.ja_e_breve||!n.relevante||(n.n_fontes||0)<2)return;  /* ac208Itens */
        var ms=(Array.isArray(n.manchetes)?n.manchetes:[]).filter(function(x){return x&&x.titulo&&!LX.test(x.titulo)});if(!ms.length)return;var h=mx(ms);if(!h||ag2-h>6*3600e3)return;
        var t=tOk([n.assunto].concat(ms.map(function(x){return x.titulo})));if(!t||LX.test(t))return;po(h)});
      if(!(g&&ag2-g>4*3600e3)){nv.forEach(function(n){if(!n||!n.assunto||!(n.relevante||(n.n_fontes||0)>=2))return;var h=mx(n.manchetes);if(!h||ag2-h>3*3600e3)return;  /* agoraItens */
          var t=tOk([n.assunto].concat(Array.isArray(n.manchetes)?n.manchetes.map(function(x){return x&&x.titulo}):[]));if(!t||LX.test(t)||LX.test(String(n.assunto)))return;po(h)});
        var ep=NV.em_pautas&&typeof NV.em_pautas==="object"&&!Array.isArray(NV.em_pautas)?NV.em_pautas:{};
        Object.keys(ep).forEach(function(pid){var x=ep[pid];if(!by(pid)||!x)return;var n=x.n_fontes||(Array.isArray(x.fontes)?x.fontes.length:0);if(n<3)return;var h=mx(x.manchetes);if(h&&ag2-h<=3*3600e3)po(h)})}
      return m})();
    var ed=(function(){var d=new Date(edMs);if(isNaN(d))return "";
      var hm=function(){return d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"America/Sao_Paulo"}).split(":")},
        dia=function(){return d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short",timeZone:"America/Sao_Paulo"}).replace(/\./g,"")};
      try{var p=hm();return "Atualizada às "+(+p[0])+"h"+p[1]+" · "+dia()}catch(e){var q=hm(),m=(+q[0])*60+(+q[1]);return (m>=390&&m<1050?"Edição da manhã":"Edição da noite")+" · "+dia()}})();
    var h='<div class="gut cp"><header class="cp-top"><span class="word">prumo<small>NEWS</small></span><span class="cp-ed">'+esc(ed)+(F.contagem?" · "+esc(F.contagem):"")+'</span></header>';
    /* faixa "Agora" (agoraItens/agoraHTML, 035) */
    h+=(function(){var d=NV;if(!d)return "";var g=Date.parse(d.gerado||"");if(g&&Date.now()-g>4*3600e3)return "";var out=[],vistos={};
      var hMs=function(x){var m=typeof x==="string"&&x.match(/^(\d{2})\/(\d{2}) (\d{2})h(\d{2})$/);if(!m)return 0;var ano=new Date().getFullYear();var t=Date.parse(ano+"-"+m[2]+"-"+m[1]+"T"+m[3]+":"+m[4]+":00-03:00");if(t>Date.now()+864e5)t=Date.parse((ano-1)+"-"+m[2]+"-"+m[1]+"T"+m[3]+":"+m[4]+":00-03:00");return t||0};
      var curto=function(t){var s=String(t||"").replace(/\s+/g," ").trim();s=s.replace(/[;,.:–-]?\s*\b(veja|entenda|saiba|confira|assista|ao vivo)\b.*$/i,"").trim();s=s.replace(/[\s;,:–-]+$/,"");if(s.length>170){s=s.slice(0,170).replace(/\s+\S*$/,"")+"…"}return s};
      var LIXO=/^\s*(?:v[íi]deos?|assista|ou[çc]a|podcast|ao vivo|programa)\b|jornal d[aoe]s?\s|\bedi[çc][ãa]o d[aoe]\b|\bde (?:segunda|ter[çc]a|quarta|quinta|sexta)-feira,\s*\d/i;
      var hMax=function(ms){var hs=(Array.isArray(ms)?ms:[]).map(function(m){return hMs(m&&m.hora)}).filter(Boolean);return hs.length?Math.max.apply(null,hs):0};
      (Array.isArray(d.novos)?d.novos:[]).forEach(function(n){if(!n||!n.assunto)return;if(!(n.relevante||(n.n_fontes||0)>=2))return;var hh=hMax(n.manchetes);if(!hh||ag-hh>3*3600e3)return;
        var t=[n.assunto].concat(Array.isArray(n.manchetes)?n.manchetes.map(function(m){return m&&m.titulo}):[]).map(curto).filter(function(x){return x&&x.replace("…","").length>=24})[0];
        if(!t||vistos[t]||LIXO.test(t)||LIXO.test(String(n.assunto)))return;vistos[t]=1;out.push({t:t,h:hh,peso:(n.relevante?10:0)+(n.n_fontes||0)+(["politica","economia"].indexOf(n.secao)>=0?3:0)})});
      var ep=d.em_pautas&&typeof d.em_pautas==="object"&&!Array.isArray(d.em_pautas)?d.em_pautas:{};
      Object.keys(ep).forEach(function(pid){var p=by(pid),x=ep[pid];if(!p||!x)return;var n=x.n_fontes||(Array.isArray(x.fontes)?x.fontes.length:0);if(n<3)return;var hh=hMax(x.manchetes);if(!hh||ag-hh>3*3600e3)return;
        var ms=(Array.isArray(x.manchetes)?x.manchetes:[]).filter(function(m){return m&&m.titulo&&!LIXO.test(m.titulo)}).sort(function(a,b){return hMs(b.hora)-hMs(a.hora)});
        var tt=ms.map(function(m){return curto(m.titulo)}).filter(function(t){return t&&t.replace("…","").length>=24})[0];
        out.push({t:tt||temaDe(p)||titulo(p),h:hh,pid:pid,peso:8+n})});
      var l=out.sort(function(a,b){return b.peso-a.peso||b.h-a.h}).slice(0,4);if(!l.length)return "";
      var um=l.map(function(x,i){return '<span class="ag-i" data-agi="'+i+'" data-agstrip="'+esc(x.pid||"")+'"><time>'+esc(quando(new Date(x.h).toISOString()).replace("há ",""))+'</time>'+esc(x.t)+'</span><i class="ag-sep" aria-hidden="true"></i>'}).join("");
      var nn=l.reduce(function(a,x){return a+x.t.length+12},0);
      return '<div class="cp-agora" role="region" aria-label="Agora: '+esc(l.map(function(x){return x.t}).join("; "))+'"><button type="button" class="ag-lbl" data-agora><i></i>Agora</button><div class="ag-vp"><div class="ag-run" style="animation-duration:'+Math.max(18,Math.round(nn*.17))+'s">'+um+um+'</div></div></div>'})();
    /* ao vivo */
    var vivo=ps.filter(function(p){return p.status==="ao_vivo"});
    if(vivo.length)h+='<div class="cp-vivo"><b><i></i>Ao vivo</b>'+vivo.map(function(p){return '<button type="button" data-cobpag="'+esc(p.id)+'">'+et(capaChapeu(p)+": "+titulo(p)+" ›")+'</button>'}).join("")+'</div>';
    /* o mesmo texto alternativo do illAlt (161): ilustração genérica sem tema vira "jornal" (cópia do gen161Tema; o teste compara) */
    function altArte(im){var a=im.alt||"Ilustração";try{var gen=im.modelo==="generica"||!im.modelo||(typeof ILL!=="undefined"&&!ILL[im.modelo]);if(!gen)return a;
      var r=(String((im.dados&&im.dados.rotulo)||"")+" "+String(im.alt||"")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if(/futebol|\bbola\b|gramado|brasileirao|serie [ab]\b|selecao|sul-americana|libertadores|copa do|rodada|amistoso|playoff/.test(r)||/aviao|\bvoos?\b|decolag|aeroport|viagem|aereo/.test(r)||/floresta|clima|\bcop\s?\d|ambient|desmat|amazonia|folhas/.test(r)||/tecnolog|servidor|\bchips?\b|nvidia|microsoft|big tech|digita|internet|\bia\b|intelig.ncia artificial|software|apple|google|meta\b/.test(r)||/cupula|bandeira|china|\beua\b|estados unidos|russia|mundo|globo|internacional|guerra|otan|\bonu\b|apec|g20|europa/.test(r)||/congresso|camara|senado|planalto|esplanada|ministerio|brasilia|governo|stf|plenario|deputad|senador/.test(r))return a;
      return "Ilustração: jornal (sem foto desta notícia)"}catch(e){return a}}
    /* a manchete (cpItem com tam "man") */
    var p=man,u=ultimaAtualizacao(p)||p.hora;
    var meta='<span class="cp-meta">'+cobStatus(p)+(u?'<span>'+esc(atualizadoTxt(u))+'</span>':"")+'</span>';
    var k='<span class="cp-k" style="color:'+secCor(secOf(p))+'">'+et(capaChapeu(p)+(p.status==="ao_vivo"?" · ao vivo":p.status==="encerrada"?" · encerrada":""))+(corRecente(p)?'<span class="cp-corr"> · corrigida</span>':"")+'</span>';
    var sub=linha||(typeof p.subtitulo==="string"&&p.subtitulo)||p.por_que||capaFrase(p.neutro&&p.neutro.texto,170);
    var im=p.imagem||{},svg='<svg viewBox="0 0 400 240" role="img" aria-label="'+esc(altArte(im))+'"><rect class="ib" width="400" height="240"/></svg>';
    /* foto própria da manchete: a escolha do app é longa (faValida, 157, 169, mapa do acervo); aí fica o esqueleto */
    if(p.foto&&typeof p.foto==="object")return;
    var arte='<span class="art paper" data-sec="'+esc(secOf(p))+'">'+svg+'</span>';
    h+='<article class="cpi cpi-man" id="cpi-'+esc(p.id)+'"><button type="button" class="cpi-b" data-cpx="'+esc(p.id)+'" aria-expanded="false">'+arte+'<span class="tx">'+k+'<b class="cp-t">'+et(titulo(p))+'</b><span class="cp-sub">'+et(sub)+'</span>'+meta+'</span></button></article></div>';
    v.innerHTML=h;v.firstElementChild.classList.add("f4-pre");
    window.__f4={t:Math.round(performance.now()),html:h}}
}catch(e){}})();
