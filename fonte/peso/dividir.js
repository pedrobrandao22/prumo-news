// Peso: divide o script principal do index.html em até 3 partes (20/11).
//  parte 1 (núcleo, no index.html): o que a Capa precisa para abrir, mais as notificações e o que roda sozinho depois
//  parte 2 (parte2.<hash>.js): Feed, matéria, busca e giro, baixada assim que a Capa aparece
//  parte 3 (parte3.<hash>.js): o resto (criar, editores, administração, telas raras), baixada depois da parte 2
// A lista vem de peso/frias.json (medida pelo peso/cobertura.js). No lugar de cada função que sai fica um "apelido" de uma
// linha que chama a original; se ele for chamado antes de a parte chegar, a parte é buscada na hora (pedido síncrono) e a
// chamada segue igual. Função nova ou mudada desde a medição fica no núcleo (a chave é o resumo do texto).
// Uso: node peso/dividir.js <pasta-do-site>   (o build.py chama, antes de compactar)
const fs = require('fs'), path = require('path');
const acorn = require('acorn'); const { unidades, resumo } = require('./unidades');
const PASTA = process.argv[2], ARQ = path.join(PASTA, 'index.html');
const FR = JSON.parse(fs.readFileSync(path.join(__dirname, 'frias.json'), 'utf8'));
if (!FR.partes) { console.log('dividir: frias.json no formato antigo; nada dividido'); process.exit(0) }
const parteDe = new Map(); for (const n of Object.keys(FR.partes)) for (const k of FR.partes[n]) parteDe.set(k, +n);
// sempre no núcleo, mesmo que a medição não as tenha visto rodar: a abertura depende delas em caminhos que variam com a
// rede e com os dados do dia (feed leve chegando antes do completo, rodada nova, faixa Agora, ilustração da manchete)
const NUCLEO_FIXO = /^(fl119|ta120|pc121|gen161Tema$|illAlt$|atualizarAgora$|carregarAgora$|dt185Antes$|rodadaRecenteMin$|co160ConfereCampo$|co160Motivo$|dataCurta$|dicaVoto$|acvPeriodo$|mb138Vv$|ft140Aplica$|ft187Confirma$|rs204Base$|pgEncher$|secLista$|fc107AtPid$|abrirTour$|abrirFaltaConvite$|sheet$|acvLinha$|dmPrevia$|renderMe$|abrirMateria$|co160Recupera$|co160PostPrevia$|mt158Pagina$|mc1111Toques$|travarFundo$|goTroca$|abrirRodadas$|qc127HasSync$|nt124RotaTenta$|checarFeed$|av8Assina$|fd204CmtHTML$|cr166Rail$|secsStory$|ft187Nomes$|acvRotData$|acvTicks$)/;
// idem para funções sem nome (passadas numa chamada no topo), pela chave; achadas na bateria em modo de medição (20/11)
const CHAVES_FIXAS = new Set(['ae5c9fbf1c#1', 'd65ed049f4#1', 'c07c7e4c02#1', 'ac336828c5#1', 'fae12d6aa1#1', '6f73b3ca7e#1']);  // 2 últimas: registro de erro de promessa e ajuste ao girar a tela
const h = fs.readFileSync(ARQ, 'utf8');
let melhor = null; const re = /<script>([\s\S]*?)<\/script>/g; let m;  // o script principal é o maior <script> sem atributos
while ((m = re.exec(h))) if (!melhor || m[1].length > melhor.txt.length) melhor = { ini: m.index + 8, txt: m[1] };
const src = melhor.txt, ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
const trocas = [], partes = { 2: [], 3: [] }, mapa = { 2: [], 3: [] };
for (const u of unidades(src, ast)) {
  const n = parteDe.get(u.chave); if (!n || NUCLEO_FIXO.test(u.nome) || CHAVES_FIXAS.has(u.chave)) continue;
  const k = partes[n].length, fn = u.fn;
  // o texto da função como expressão (declaração vira "function(params){corpo}"; seta continua seta)
  const expr = u.tipo === 'decl' ? (fn.async ? 'async ' : '') + 'function' + src.slice(fn.id.end, fn.end) : u.txt;
  partes[n].push(`F[${k}]=${expr};`); mapa[n].push(u.chave + (u.nome ? ' ' + u.nome : ''));
  const ap = `function(){return __p${n}(${k},this,arguments)}`;
  trocas.push({ ini: u.ini, fim: u.fim, por: u.tipo === 'decl' ? ap.replace('function(', `function ${u.nome}(`) : ap });
}
if (!trocas.length) { console.log('dividir: nada para dividir'); process.exit(0) }
trocas.sort((a, b) => a.ini - b.ini);
let novo = '', pos = 0; for (const t of trocas) { novo += src.slice(pos, t.ini) + t.por; pos = t.fim } novo += src.slice(pos);
const nomes = {};
for (const n of [2, 3]) {
  if (!partes[n].length) continue;
  const txt = `/* Prumo News, parte ${n} (o núcleo chama estas funções pelos apelidos) */\n(function(){var P=window.__PF=window.__PF||{};if(P[${n}])return;var F={};\n${partes[n].join('\n')}\nP[${n}]=F;try{dispatchEvent(new Event("prumo:parte${n}"))}catch(e){}})();\n`;
  nomes[n] = `parte${n}.${resumo(txt)}.js`; fs.writeFileSync(path.join(PASTA, nomes[n]), txt);
}
// modo de medição (PRUMO_P2_CAPTURA): marca no log do servidor cada apelido chamado antes de a parte dele chegar
const CAPTURA = process.env.PRUMO_P2_CAPTURA ? 'try{if(!P[n]){var v=window.__pcv||(window.__pcv={});if(!v[n+"/"+k]){v[n+"/"+k]=1;new Image().src="__p2uso/"+n+"/"+k}}}catch(e){}' : '';
const nucleo = `var __PURL=${JSON.stringify(nomes)},__PF=window.__PF=window.__PF||{};
function __pN(n,k,t,a){var P=window.__PF;${CAPTURA}if(!P[n])__pSinc(n);var f=P[n]&&P[n][k];if(!f){try{console.warn("Prumo: parte "+n+" indisponível ("+k+")")}catch(e){}return}return f.apply(t,a)}
function __p2(k,t,a){return __pN(2,k,t,a)}
function __p3(k,t,a){return __pN(3,k,t,a)}
function __pSinc(n){if(!__PURL[n])return;try{(window.__psinc=window.__psinc||[]).push(n);var x=new XMLHttpRequest();x.open("GET",__PURL[n],false);x.send(null);if(x.status===200&&x.responseText){var s=document.createElement("script");s.text=x.responseText;document.head.appendChild(s)}}catch(e){}}
function __pCarrega(n){if(!__PURL[n]||window.__PF[n]||(window.__pini=window.__pini||{})[n])return;window.__pini[n]=1;var s=document.createElement("script");s.src=__PURL[n];s.async=true;document.head.appendChild(s)}
function __pDepois(n,f){if(window.__PF[n]||!__PURL[n]){f();return}addEventListener("prumo:parte"+n,function(){f()},{once:true});__pCarrega(n)}
(function(){var ini=Date.now(),vai3=function(){__pDepois(2,function(){var g=function(){__pCarrega(3)};window.requestIdleCallback?requestIdleCallback(g,{timeout:2500}):setTimeout(g,300)})};
  /* parte 2 assim que a Capa estiver desenhada (ou já, se o app não abriu na Capa: link de matéria, outra aba); parte 3 depois dela */
  if(location.hash.length>1||/[?&]\\w+=/.test(location.search)||(typeof abreNaCapa==="function"&&!abreNaCapa())){__pCarrega(2);__pCarrega(3)}
  var olha=function(){var c=document.querySelector("#v-capa .cpi");
    if((c&&c.getBoundingClientRect().height>0)||(typeof abreNaCapa==="function"&&!abreNaCapa())||Date.now()-ini>2500){__pCarrega(2);vai3();return}setTimeout(olha,50)};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",olha);else olha();
  setTimeout(function(){__pCarrega(2);vai3()},5000)})();
try{navigator.serviceWorker&&navigator.serviceWorker.ready.then(function(){setTimeout(function(){for(var n in __PURL)fetch(__PURL[n]).catch(function(){})},4000)})}catch(e){}
`;
const saida = h.slice(0, melhor.ini) + nucleo + novo + h.slice(melhor.ini + src.length);
fs.writeFileSync(ARQ, saida);
fs.writeFileSync(path.join(PASTA, 'partes-mapa.json'), JSON.stringify(mapa));  // só para diagnóstico (não vai para o ar)
const kb = n => partes[n].length ? (fs.statSync(path.join(PASTA, nomes[n])).size / 1e3).toFixed(0) + ' KB' : '-';
console.log(`dividir: parte 2 ${partes[2].length} funções (${nomes[2] || '-'}, ${kb(2)}); parte 3 ${partes[3].length} funções (${nomes[3] || '-'}, ${kb(3)}); núcleo ${(src.length / 1e3).toFixed(0)} → ${((nucleo.length + novo.length) / 1e3).toFixed(0)} KB`);
