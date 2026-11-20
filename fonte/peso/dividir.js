// Peso (20/11): divide o script principal do index.html em duas partes.
// As funções de topo que não rodam numa visita comum (peso/frias.json, medido pelo peso/cobertura.js) vão para
// parte2.<hash>.js; no lugar de cada uma fica um "apelido" de uma linha com o mesmo nome, que chama a original.
// A parte 2 é baixada sozinha logo depois que a página carrega; se um apelido for chamado antes, ela é buscada na hora
// (pedido síncrono) e a chamada segue normal. Nada muda de comportamento: só o que chega primeiro.
// Só divide função cujo texto é igual ao medido (o hash confere); função nova ou mudada fica no núcleo.
// Uso: node peso/dividir.js <pasta-do-site>   (o build.py chama, antes de compactar)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const acorn = require('acorn');
const PASTA = process.argv[2], ARQ = path.join(PASTA, 'index.html');
const FR = JSON.parse(fs.readFileSync(path.join(__dirname, 'frias.json'), 'utf8'));
const frias = new Map(FR.funcoes.map(x => [x[0] + '#' + x[1], x[2] || null]));
const h = fs.readFileSync(ARQ, 'utf8');
// o script principal é o maior <script> sem atributos
let melhor = null; const re = /<script>([\s\S]*?)<\/script>/g; let m;
while ((m = re.exec(h))) if (!melhor || m[1].length > melhor.txt.length) melhor = { ini: m.index + 8, txt: m[1] };
const src = melhor.txt;
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
const novos = new Set();
(function anda(n) { if (!n || typeof n.type !== 'string') return; if (n.type === 'NewExpression' && n.callee.type === 'Identifier') novos.add(n.callee.name); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(anda); else if (v && typeof v.type === 'string') anda(v) } })(ast);
const hash = t => crypto.createHash('sha1').update(t).digest('hex').slice(0, 10);
const vistos = {}, trocas = [], partes = [], nomes = []; let k = 0;
for (const s of ast.body) {
  if (s.type !== 'FunctionDeclaration' || !s.id) continue;
  const nm = s.id.name, i = vistos[nm] = (vistos[nm] || 0) + 1, chave = nm + '#' + i;
  if (!frias.has(chave)) continue;
  const txt = src.slice(s.start, s.end);
  const esperado = frias.get(chave); if (esperado && esperado !== hash(txt)) continue;  // mudou desde a medição: fica no núcleo
  if (s.generator || novos.has(nm) || txt.length < 160 || /new\.target|arguments\.callee/.test(txt)) continue;
  const resto = src.slice(s.id.end, s.end);  // "(params){corpo}"
  partes.push(`F[${k}]=${s.async ? 'async ' : ''}function${resto};`);
  trocas.push({ ini: s.start, fim: s.end, por: `function ${nm}(){return __p2(${k},this,arguments)}` }); nomes.push(nm);
  k++;
}
if (!k) { console.log('dividir: nada para dividir'); process.exit(0) }
let novo = '', pos = 0; for (const t of trocas) { novo += src.slice(pos, t.ini) + t.por; pos = t.fim } novo += src.slice(pos);
const p2 = `/* Prumo News, parte 2 (funções que não rodam numa visita comum; o núcleo chama pelos apelidos) */\n(function(){if(window.__P2F)return;var F={};\n${partes.join('\n')}\nwindow.__P2F=F})();\n`;
const nomeP2 = `parte2.${hash(p2)}.js`;
const nucleo = `var __P2_URL=${JSON.stringify(nomeP2)};window.__P2F=window.__P2F||null;
function __p2(k,t,a){if(!window.__P2F)__p2Sinc(k);var f=window.__P2F&&window.__P2F[k];if(!f)throw new Error("Prumo: parte 2 indisponível ("+k+")");return f.apply(t,a)}
function __p2Sinc(k){try{(window.__p2sinc=window.__p2sinc||[]).push(k);var x=new XMLHttpRequest();x.open("GET",__P2_URL,false);x.send(null);if(x.status===200&&x.responseText){var s=document.createElement("script");s.text=x.responseText;document.head.appendChild(s)}}catch(e){}}
function __p2Carrega(){if(window.__P2F||window.__p2ini)return;window.__p2ini=1;var s=document.createElement("script");s.src=__P2_URL;s.async=true;document.head.appendChild(s)}
addEventListener("load",function(){setTimeout(__p2Carrega,200)});setTimeout(__p2Carrega,4000);
try{navigator.serviceWorker&&navigator.serviceWorker.ready.then(function(){setTimeout(function(){fetch(__P2_URL).catch(function(){})},1500)})}catch(e){}
`;
const saida = h.slice(0, melhor.ini) + nucleo + novo + h.slice(melhor.ini + src.length);
fs.writeFileSync(ARQ, saida); fs.writeFileSync(path.join(PASTA, nomeP2), p2);
fs.writeFileSync(path.join(PASTA, 'parte2-mapa.json'), JSON.stringify(nomes));  // só para diagnóstico (não vai para o ar)
console.log(`dividir: ${k} funções para ${nomeP2} (${(p2.length / 1e3).toFixed(0)} KB); núcleo ${(src.length / 1e3).toFixed(0)} → ${((nucleo.length + novo.length) / 1e3).toFixed(0)} KB`);
