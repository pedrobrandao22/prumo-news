// lê o index.html montado e devolve a versão compacta (scripts e estilos), sem mudar nomes globais
const fs = require('fs'); const e = require('esbuild');
const arq = process.argv[2]; let h = fs.readFileSync(arq, 'utf8');
h = h.replace(/<script>([\s\S]*?)<\/script>/g, (m, c) => '<script>' + e.transformSync(c, { minify: true, loader: 'js', target: 'es2019', legalComments: 'none' }).code.replace(/<\/script/gi, '<\\/script') + '</script>');
h = h.replace(/<style>([\s\S]*?)<\/style>/g, (m, c) => '<style>' + e.transformSync(c, { minify: true, loader: 'css' }).code + '</style>');
h = h.split('"(?<=').join('"(?"+"<=');  // sem lookbehind literal no arquivo (iOS antigo); o código já testa com try
fs.writeFileSync(arq, h);
// parte 2 (peso/dividir.js): mesma compactação
const path = require('path'); for (const f of fs.readdirSync(path.dirname(arq)).filter(f => /^parte2\.[0-9a-f]+\.js$/.test(f))) {
  const p = path.join(path.dirname(arq), f); fs.writeFileSync(p, e.transformSync(fs.readFileSync(p, 'utf8'), { minify: true, loader: 'js', target: 'es2019', legalComments: 'none' }).code.split('"(?<=').join('"(?"+"<=')) }
