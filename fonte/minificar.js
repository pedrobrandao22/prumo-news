// lê o index.html montado e devolve a versão compacta (scripts e estilos), sem mudar nomes globais
const fs = require('fs'); const e = require('esbuild');
const arq = process.argv[2]; let h = fs.readFileSync(arq, 'utf8');
h = h.replace(/<script>([\s\S]*?)<\/script>/g, (m, c) => '<script>' + e.transformSync(c, { minify: true, loader: 'js', target: 'es2019', legalComments: 'none' }).code.replace(/<\/script/gi, '<\\/script') + '</script>');
h = h.replace(/<style>([\s\S]*?)<\/style>/g, (m, c) => '<style>' + e.transformSync(c, { minify: true, loader: 'css' }).code + '</style>');
h = h.split('"(?<=').join('"(?"+"<=');  // sem lookbehind literal no arquivo (iOS antigo); o código já testa com try
fs.writeFileSync(arq, h);
