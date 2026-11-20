// Peso (20/11, 3 partes): as "unidades" do script principal que podem ir para uma parte carregada depois.
// Uma unidade é uma função de topo que só enxerga nomes globais (então pode ser escrita em outro arquivo):
//  - declaração de função no topo:            function x(){...}
//  - função atribuída no topo:                x = function(){...}   /   window.x = () => {...}
//  - função passada numa chamada no topo:     addEventListener("click", e => {...})
//  - função como valor de var/let/const:      const x = () => {...}
// Funções dentro de blocos { } ou de outras funções ficam onde estão (podem usar nomes locais).
// A chave de cada unidade é o resumo do texto da função + a ordem entre as de texto igual: função mudada
// ganha chave nova e fica no núcleo até a próxima medição.
const crypto = require('crypto');
const resumo = t => crypto.createHash('sha1').update(t).digest('hex').slice(0, 10);
const ehFn = n => n && (n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression');

function unidades(src, ast) {
  const novos = new Set();  // nomes usados com "new": ficam no núcleo (o apelido não serve de construtor)
  (function anda(n) { if (!n || typeof n.type !== 'string') return; if (n.type === 'NewExpression' && n.callee.type === 'Identifier') novos.add(n.callee.name); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(anda); else if (v && typeof v.type === 'string') anda(v) } })(ast);
  const out = [], vezes = {};
  const add = (fn, tipo, nome) => {
    const txt = src.slice(fn.start, fn.end);
    if (fn.generator || txt.length < 160 || /new\.target|arguments\.callee|\bsuper\b/.test(txt)) return;
    if (nome && novos.has(nome)) return;
    if (fn.type === 'ArrowFunctionExpression' && /\barguments\b/.test(txt)) return;  // seta usa o arguments de fora
    const h = resumo(txt), i = vezes[h] = (vezes[h] || 0) + 1;
    out.push({ chave: h + '#' + i, tipo, nome: nome || '', ini: fn.start, fim: fn.end, corpo: fn.body.start, fn, txt });
  };
  for (const s of ast.body) {
    if (s.type === 'FunctionDeclaration' && s.id) { add(s, 'decl', s.id.name); continue }
    if (s.type === 'VariableDeclaration') { for (const d of s.declarations) if (ehFn(d.init) && d.id.type === 'Identifier') add(d.init, 'expr', d.id.name); continue }
    if (s.type !== 'ExpressionStatement') continue;
    const e = s.expression;
    if (e.type === 'AssignmentExpression' && e.operator === '=' && ehFn(e.right)) { add(e.right, 'expr', e.left.type === 'Identifier' ? e.left.name : ''); continue }
    if (e.type === 'CallExpression' && !ehFn(e.callee)) for (const a of e.arguments) if (ehFn(a)) add(a, 'expr', '');
  }
  return out;
}
module.exports = { unidades, resumo };
