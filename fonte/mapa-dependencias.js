// Mapa de dependências entre os arquivos de app/src/js (fase 3). Precisa de: npm i --no-save acorn@8.12.1 acorn-walk@8.3.4
// Uso: node mapa-dependencias.js  → grava deps.json (o que cada arquivo define, usa no carregamento, usa em funções e remenda)
const acorn = require('acorn'), walk = require('acorn-walk'), fs = require('fs'), path = require('path');
const D = require('path').join(__dirname, 'app', 'src', 'js'); const files = fs.readdirSync(D).filter(f => f.endsWith('.js')).sort();
const info = {};
for (const f of files) {
  const src = fs.readFileSync(path.join(D, f), 'utf8'); let ast;
  try { ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script', allowReturnOutsideFunction: true }) } catch (e) { info[f] = { erro: e.message }; continue }
  const defs = new Set(), topRefs = new Set(), allRefs = new Set(), assigns = new Set(); let efeitos = 0;
  for (const st of ast.body) {
    if (st.type === 'FunctionDeclaration') { defs.add(st.id.name); continue }
    if (st.type === 'VariableDeclaration') st.declarations.forEach(d => { if (d.id.type === 'Identifier') defs.add(d.id.name) });
    if (st.type === 'ClassDeclaration') defs.add(st.id.name);
    // referências executadas no carregamento: tudo fora de corpos de função
    walk.recursive(st, null, { Function() { }, Identifier(n) { topRefs.add(n.name) }, AssignmentExpression(n, s, c) { if (n.left.type === 'Identifier') assigns.add(n.left.name); c(n.left); c(n.right) } });
  }
  walk.full(ast, n => { if (n.type === 'Identifier') allRefs.add(n.name) });
  info[f] = { defs: [...defs], topRefs: [...topRefs], allRefs: [...allRefs], assigns: [...assigns], tam: src.length };
}
fs.writeFileSync(require('path').join(__dirname, 'deps.json'), JSON.stringify(info));
const err = Object.entries(info).filter(([f, x]) => x.erro); console.log('erros de parse', err.map(([f, x]) => f + ': ' + x.erro));
