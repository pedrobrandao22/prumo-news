// Colunas, fase 2 (133): importar .md, .html sujo, .txt e .docx (montado aqui, sem libs) com prévia e substituir/acrescentar;
// colar do Google Docs, Word, Substack, Medium e Notion; exportar para e-mail, LinkedIn, X, Instagram, Facebook, WhatsApp,
// PDF e Markdown (conteúdo de cada um); 360/390 px sem rolagem lateral, modo escuro e sem erros no console.
// Portas 8796–8797. Capturas em qa/colunas-exportar/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path'), zlib = require('zlib');
const PORTA = 8796, PORTA2 = 8797, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'colunas-exportar'); fs.mkdirSync(QA, { recursive: true });
const SITE = path.join(__dirname, '..', 'site'), SERIES = path.join(U.REPO, 'series'), FOTO = path.join(U.REPO, 'icon-192.png');
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } ED132.E = null });
const shot = async (p, n) => { await semToast(p); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const toastTx = P => ev(P, () => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
const semLateral = P => ev(P, () => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('#layer2 .sheet *, #layer > .ed132 *, #layer .cs123-ler *')].every(e => { const r = e.getBoundingClientRect(); return !r.width || r.right <= innerWidth + 1 || e.closest('.ed132-bar,.ex133-ig,.ex133-tx,.ex133-mail,.ex133-pvi,.cs123-hts,.acv,.gn') }));
const ASS = 'Bia Souza, publicado originalmente no Prumo';

/* ---- .docx montado aqui: zip com deflate (zlib do Node) ---- */
function zip(arqs) { const loc = [], cen = []; let off = 0;
  for (const a of arqs) { const nm = Buffer.from(a.nome, 'utf8'), raw = Buffer.isBuffer(a.dados) ? a.dados : Buffer.from(a.dados, 'utf8'), d = a.guardar ? raw : zlib.deflateRawSync(raw), crc = zlib.crc32(raw);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(a.guardar ? 0 : 8, 8); h.writeUInt16LE(0x21, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(d.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(nm.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(a.guardar ? 0 : 8, 10); c.writeUInt16LE(0x21, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(d.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(nm.length, 28); c.writeUInt32LE(off, 42);
    loc.push(h, nm, d); cen.push(c, nm); off += 30 + nm.length + d.length }
  const cs = cen.reduce((s, b) => s + b.length, 0), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(arqs.length, 8); e.writeUInt16LE(arqs.length, 10); e.writeUInt32LE(cs, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...loc, ...cen, e]) }
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const run = (t, rp = '') => `<w:r>${rp ? `<w:rPr>${rp}</w:rPr>` : ''}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const para = (inner, ppr = '') => `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ''}${inner}</w:p>`;
const lst = (id, t) => para(run(t), `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${id}"/></w:numPr>`);
const DOCX = zip([
  { nome: '[Content_Types].xml', dados: '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="png" ContentType="image/png"/></Types>' },
  { nome: 'word/document.xml', dados: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W} xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>
    ${para(run('Título do Word'), '<w:pStyle w:val="Ttulo1"/>')}
    ${para(run('Parágrafo com ') + run('negrito', '<w:b/>') + run(' e ') + run('itálico', '<w:i/>') + run(' e ') + '<w:hyperlink r:id="rId9">' + run('um link') + '</w:hyperlink>' + run('.', '<w:b w:val="0"/>'))}
    ${lst(1, 'Marcador um')}${lst(1, 'Marcador dois')}${lst(2, 'Número um')}
    ${para(run('Subtítulo do Word'), '<w:pStyle w:val="Heading2"/>')}
    ${para(run('Uma citação do Word.'), '<w:pStyle w:val="Quote"/>')}
    ${para('<w:r><w:drawing><wp:inline><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rId5"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>')}
    <w:tbl><w:tr><w:tc>${para(run('Célula A'))}</w:tc><w:tc>${para(run('Célula B'))}</w:tc></w:tr></w:tbl>
    ${para(run('Último parágrafo do Word.'))}<w:sectPr/></w:body></w:document>` },
  { nome: 'word/styles.xml', dados: `<?xml version="1.0"?><w:styles ${W}><w:style w:type="paragraph" w:styleId="Ttulo1"><w:name w:val="heading 1"/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style><w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/></w:style></w:styles>` },
  { nome: 'word/numbering.xml', dados: `<?xml version="1.0"?><w:numbering ${W}><w:abstractNum w:abstractNumId="10"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="11"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="11"/></w:num></w:numbering>` },
  { nome: 'word/_rels/document.xml.rels', dados: `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://www.camara.leg.br/" TargetMode="External"/></Relationships>` },
  { nome: 'word/media/image1.png', dados: fs.readFileSync(FOTO), guardar: true }]);
const MD = `# O teto de gastos em 2027

Primeiro parágrafo com **negrito** e *itálico* e um [link](https://www.gov.br/fazenda).
Continua na mesma linha.

## O que muda

- Item um
- Item dois

1. Primeiro
2. Segundo

> Uma citação forte do texto.

---

Último parágrafo com ![foto](https://exemplo.com/a.png) imagem externa.
`;
const HTML_SUJO = `<html><head><title>Página suja</title><style>body{display:none}</style><script>window.__sujo=1</script></head><body onload="window.__sujo=2">
<h1 onclick="window.__sujo=3">Título do HTML</h1><p style="color:red">Texto <b>forte</b> e <a href="javascript:alert(1)">perigoso</a> e <a href="https://www.bcb.gov.br/">seguro</a>.</p>
<p class=MsoListParagraphCxSpFirst style='mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span>&nbsp;</span></span><![endif]>lista do Word um<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span>&nbsp;</span></span><![endif]>lista do Word dois<o:p></o:p></p>
<iframe src="https://mal.example"></iframe><img src="https://exemplo.com/x.png" onerror="window.__sujo=4"><img src="https://exemplo.com/y.png"></body></html>`;
const TXT = 'Linha de abertura do texto simples.\nainda o mesmo parágrafo.\n\nSegundo parágrafo do txt.\n\nTerceiro parágrafo do txt.';
const COLA = {
  docs: { h: `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1a2b"><h1 dir="ltr"><span style="font-size:20pt">Título Docs</span></h1><p dir="ltr"><span style="font-weight:700">forte</span><span> e </span><span style="font-style:italic">leve</span> <a href="https://exemplo.com.br/a"><span>link</span></a></p><ul><li dir="ltr"><p dir="ltr"><span>item docs</span></p></li></ul><p><span><img src="https://lh3.googleusercontent.com/x" width="100"></span></p></b>`, img: 1, lista: '<ul><li>item docs</li></ul>' },
  word: { h: `<html xmlns:o="urn:schemas-microsoft-com:office:office"><body><!--StartFragment--><h1>Título Word</h1><p class=MsoNormal><b>forte</b> e <i>leve</i> <a href="https://exemplo.com.br/w">link</a><o:p></o:p></p><p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol;mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span><![endif]>item word um<o:p></o:p></p><p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span>&nbsp; </span></span><![endif]>item word dois<o:p></o:p></p><p class=MsoListParagraph style='mso-list:l1 level1 lfo2'><span style='mso-list:Ignore'>1.<span> </span></span>numerado word</p><!--EndFragment--></body></html>`, img: 0, lista: '<ul><li>item word um</li><li>item word dois</li></ul><ol><li>numerado word</li></ol>' },
  substack: { h: `<h2 class="header-anchor-post">Título Substack</h2><p>Texto <strong>forte</strong> e <em>leve</em> e <a href="https://exemplo.substack.com/p/x">link</a>.</p><div class="captioned-image-container"><figure><a class="image-link" href="https://substackcdn.com/x.jpg"><img src="https://substackcdn.com/x.jpg"></a><figcaption>legenda</figcaption></figure></div><blockquote><p>Citação substack.</p></blockquote>`, img: 1, lista: '<blockquote><p>Citação substack.</p></blockquote>' },
  medium: { h: `<h1 class="pw-post-title">Título Medium</h1><p class="pw-post-body-paragraph"><strong class="mh">forte</strong> com <em>leve</em> e <a href="https://medium.com/x" rel="noopener">link</a>.</p><figure><div><picture><source srcset="x.webp"><img src="https://miro.medium.com/x.png"></picture></div></figure><blockquote><p>Citação medium.</p></blockquote><ol><li>um</li><li>dois</li></ol>`, img: 1, lista: '<ol><li>um</li><li>dois</li></ol>' },
  notion: { h: `<meta charset="utf-8"><h1>Título Notion</h1><p>Texto <strong>forte</strong> e <em>leve</em> e <a href="https://www.notion.so/x">link</a></p><ul><li>a</li><li>b</li></ul><blockquote>Citação notion</blockquote><img src="https://www.notion.so/image/x.png"><img src="https://www.notion.so/image/y.png">`, img: 2, lista: '<ul><li>a</li><li>b</li></ul><blockquote><p>Citação notion</p></blockquote>' }
};
const PARS = [
  'O orçamento de 2027 chega ao Congresso com uma conta que não fecha, e quem anda pelos corredores percebe que a conversa mudou: em vez de discutir onde gastar, os líderes discutem o que cortar primeiro, e cada bancada tenta proteger o seu pedaço.',
  'A equipe econômica insiste que a meta de resultado primário continua de pé. Os números do Tesouro mostram, porém, uma diferença de R$ 1.000 bilhões entre o que se promete e o que se arrecada em dez anos, algo como 2,5% do PIB por ano.',
  'No plenário, a leitura é outra. Deputados do centro dizem que o corte nas emendas é inegociável em ano pré-eleitoral, e a oposição aproveita para cobrar a revisão dos gastos tributários, que somam mais de meio trilhão por ano.',
  'O relator prometeu apresentar o parecer até o fim do mês. Até lá, a comissão mista deve ouvir o ministro da Fazenda e o presidente do Banco Central, que vai falar sobre o efeito dos juros na dívida.',
  'Há quem veja no impasse uma oportunidade. Economistas ouvidos pela coluna lembram que o país já passou por apertos parecidos e saiu deles com reformas que pareciam impossíveis meses antes.',
  'Outros são menos otimistas e lembram que a confiança dos investidores depende de sinais claros, que até agora não vieram. O dólar reage a cada declaração, e os juros futuros sobem a cada rumor de mudança na meta.',
  'Para o leitor, o que importa é entender que as escolhas feitas agora vão definir o tamanho do Estado nos próximos anos: quanto vai para a saúde, para a educação e para os investimentos que o país adia há tempo.',
  'A coluna volta ao tema na semana que vem, com os números finais da comissão e o que cada partido levou para casa. Até lá, vale acompanhar as votações e os discursos, que dizem muito sobre o que vem pela frente.'];
const CORPO = `<p>${PARS[0]} Isso pesa <strong>como uma decisão que define a legislatura inteira, e todos sabem</strong> e <em>muito</em>, segundo <a href="https://www.ibge.gov.br/">o IBGE</a>.</p><h2>O que muda</h2>${PARS.slice(1, 4).map(p => `<p>${p}</p>`).join('')}<ul><li>Emendas de bancada</li><li>Piso da saúde</li></ul><blockquote><p>A conta não fecha sem cortar emendas, disse o relator.</p></blockquote><h3>Nos bastidores</h3>${PARS.slice(4).map(p => `<p>${p}</p>`).join('')}<hr>${PARS.map(p => `<p>Em outra frente, ${p.charAt(0).toLowerCase() + p.slice(1)}</p>`).join('')}<p>Fim da coluna.</p>`;

let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); fs.cpSync(SERIES, path.join(SITE, 'series'), { recursive: true });
  srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  const como = (k, q, p) => H.comoUsuario(ids[k], () => H.db.query(q, p || [])).then(r => r.rows);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids[k], email: k + '@x' } }, dark: o.dark, viewport: o.vp }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(o.base || BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null && ED132.v12.ag !== null && ED132.v12.ra !== null && ED132.v12.ve !== null, null, 20000); await sleep(400); await fecha(p);
    await ev(p, () => { window.__cb = []; const cb = { write: async items => { for (const it of items) { const o = {}; for (const t of it.types) o[t] = await (await it.getType(t)).text(); window.__cb.push(o) } }, writeText: async t => { window.__cb.push({ 'text/plain': t }) } }; Object.defineProperty(navigator, 'clipboard', { value: cb, configurable: true }) });
    return p };
  const recarrega = P => ev(P, async () => { PUB.sig = ''; try { VN112_Q.clear() } catch (e) { } await pubCarregar() });
  const novaColuna = async P => { await fecha(P); await ev(P, () => ed132Abre(ed132Novo({}))); await sleep(400) };
  const html = P => ev(P, () => ed132Le().html);
  const importa = async (P, arq) => { await ev(P, () => { closeLayer._ok = false; if ($('#layer2')?.innerHTML) closeLayer() }); await sleep(100);
    await ev(P, () => document.querySelector('#layer > .ed132 .ed132-m [data-ex133imp]').click()); await sleep(300);
    const [fc] = await Promise.all([P.waitForEvent('filechooser'), ev(P, () => document.querySelector('[data-ex133arq]').click())]); await fc.setFiles(arq);
    await esperar(P, () => !!document.querySelector('[data-ex133vai]'), null, 8000); await sleep(100);
    return ev(P, () => ({ vai: $('[data-ex133vai]').textContent.replace(/\s+/g, ' ').trim(), sheet: $('#layer2 .sheet').textContent.replace(/\s+/g, ' '), bts: [...document.querySelectorAll('[data-ex133ap]')].map(b => b.dataset.ex133ap + ':' + b.textContent) })) };
  const aplica = async (P, m) => { await ev(P, m => document.querySelector(`[data-ex133ap="${m}"]`).click(), m); await esperar(P, () => !$('#layer2')?.innerHTML && !ED132.E.subindo, null, 8000); await sleep(300) };

  const B = await abrir('b'), A = await abrir('a');

  /* ================= 1. importar .md ================= */
  await novaColuna(B);
  ok(await ev(B, () => !!document.querySelector('#layer > .ed132 .ed132-m [data-ex133imp]')), 'editor: botão "Importar"');
  let r = await importa(B, { name: 'coluna.md', mimeType: 'text/markdown', buffer: Buffer.from(MD) });
  ok(r.vai === 'Vai entrar: 7 parágrafos, 1 título, 0 fotos', '.md: prévia "Vai entrar: 7 parágrafos, 1 título, 0 fotos"', r.vai);
  ok(/Título da coluna: “O teto de gastos em 2027”/.test(r.sheet) && /1 imagem não foi trazida; adicione pelo botão de foto/.test(r.sheet), '.md: título da coluna vem do arquivo e aviso da imagem externa', r.sheet.slice(0, 300));
  ok(r.bts.length === 1 && /Pôr no texto/.test(r.bts[0]), 'editor vazio: um botão só ("Pôr no texto")', r.bts);
  await shot(B, '01-importar-previa');
  ok(await semLateral(B), '390 px: prévia de importar sem rolagem lateral');
  await aplica(B, 'sub');
  let h = await html(B);
  ok(await ev(B, () => $('#ed132-tit').value) === 'O teto de gastos em 2027' && !/<h2>O teto/.test(h), '.md: o título vira o título da coluna (e sai do texto)');
  ok(/<strong>negrito<\/strong> e <em>itálico<\/em> e um <a href="https:\/\/www\.gov\.br\/fazenda">link<\/a>\. Continua na mesma linha\./.test(h), '.md: negrito, itálico, link e linhas do mesmo parágrafo', h.slice(0, 260));
  ok(/<h2>O que muda<\/h2><ul><li>Item um<\/li><li>Item dois<\/li><\/ul><ol><li>Primeiro<\/li><li>Segundo<\/li><\/ol><blockquote><p>Uma citação forte do texto\.<\/p><\/blockquote><hr><p>Último parágrafo com\s+imagem externa\.<\/p>$/.test(h), '.md: título, listas, citação, separador; a imagem não vem', h.slice(200));

  /* ================= 2. importar .html sujo e acrescentar ================= */
  r = await importa(B, { name: 'pagina.html', mimeType: 'text/html', buffer: Buffer.from(HTML_SUJO) });
  ok(/Vai entrar: 3 parágrafos, 1 título, 0 fotos/.test(r.vai) && /2 imagens não foram trazidas/.test(r.sheet), '.html: prévia (3 parágrafos, 1 título) e "2 imagens não foram trazidas"', r);
  ok(r.bts.join() === 'sub:Substituir o texto,add:Acrescentar no fim', 'texto já existe: pergunta substituir ou acrescentar no fim', r.bts);
  await aplica(B, 'add'); h = await html(B);
  ok(/^<p>Primeiro parágrafo/.test(h) && /<p>Último parágrafo com\s+imagem externa\.<\/p><h2>Título do HTML<\/h2>/.test(h), '"Acrescentar no fim": o texto antigo fica e o novo entra depois', h.slice(-500));
  ok(/<p>Texto <strong>forte<\/strong> e perigoso e <a href="https:\/\/www\.bcb\.gov\.br\/">seguro<\/a>\.<\/p><ul><li>lista do Word um<\/li><li>lista do Word dois<\/li><\/ul>$/.test(h), '.html: limpo (link javascript: sai) e a lista do Word vira lista', h.slice(-260));
  const sujo = await ev(B, () => ({ s: window.__sujo, ed: $('#ed132-corpo').innerHTML, vis: getComputedStyle(document.body).display }));
  ok(sujo.s === undefined && !/<script|<style|<iframe|onclick|onerror|javascript:|style=/i.test(sujo.ed) && sujo.vis !== 'none', '.html: nada de script, style, iframe, on* nem imagem de fora', sujo.ed.slice(-300));
  ok(await ev(B, () => $('#ed132-tit').value) === 'O teto de gastos em 2027', 'acrescentar não troca o título que já existe');

  /* ================= 3. importar .txt e substituir ================= */
  r = await importa(B, { name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from(TXT) });
  ok(/Vai entrar: 3 parágrafos, 0 títulos, 0 fotos/.test(r.vai), '.txt: prévia com 3 parágrafos', r.vai);
  await aplica(B, 'sub'); h = await html(B);
  ok(h === '<p>Linha de abertura do texto simples. ainda o mesmo parágrafo.</p><p>Segundo parágrafo do txt.</p><p>Terceiro parágrafo do txt.</p>', '"Substituir o texto": só o .txt fica', h);

  /* ================= 4. importar .docx (com foto embutida) ================= */
  await B.fill('#ed132-tit', ''); await ev(B, () => { ed132Le() });
  r = await importa(B, { name: 'coluna-word.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: DOCX });
  ok(r.vai === 'Vai entrar: 7 parágrafos, 1 título, 1 foto' && /Título da coluna: “Título do Word”/.test(r.sheet), '.docx: prévia "7 parágrafos, 1 título, 1 foto" e título do arquivo', r);
  await shot(B, '02-importar-docx');
  await aplica(B, 'sub'); h = await html(B);
  ok(await ev(B, () => $('#ed132-tit').value) === 'Título do Word', '.docx: Heading 1 (estilo em português "Ttulo1") vira o título da coluna');
  ok(/^<p>Parágrafo com <strong>negrito<\/strong> e <em>itálico<\/em> e <a href="https:\/\/www\.camara\.leg\.br\/">um link<\/a>\.<\/p><ul><li>Marcador um<\/li><li>Marcador dois<\/li><\/ul><ol><li>Número um<\/li><\/ol><h2>Subtítulo do Word<\/h2><blockquote><p>Uma citação do Word\.<\/p><\/blockquote>/.test(h), '.docx: negrito, itálico, link, listas (marcador e número), Heading 2 e citação', h.slice(0, 400));
  ok(new RegExp(`<figure data-f="${ids.b}/[^"]+\\.jpg"><figcaption></figcaption></figure><p>Célula A · Célula B</p><p>Último parágrafo do Word\\.</p>$`).test(h) && await esperar(B, () => !!document.querySelector('#ed132-corpo figure[data-f] img'), null, 5000), '.docx: a foto embutida sobe pelo Storage e entra no texto; tabela vira parágrafo', h.slice(-260));

  /* ================= 5. colar: Google Docs, Word, Substack, Medium, Notion ================= */
  for (const [nome, c] of Object.entries(COLA)) {
    await ev(B, () => { const cp = $('#ed132-corpo'); cp.innerHTML = '<p><br></p>'; ed132CaretFim(cp.firstChild); document.querySelectorAll('.toast').forEach(t => t.remove()) });
    await ev(B, c => { const dt = new DataTransfer(); dt.setData('text/html', c.h); dt.setData('text/plain', 'x'); $('#ed132-corpo').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })) }, c); await sleep(250);
    const hc = await html(B), tt = await toastTx(B), tn = nome.charAt(0).toUpperCase() + nome.slice(1);
    ok(new RegExp(`<h2>Título ${tn}</h2>`).test(hc) && /<strong>forte<\/strong>/.test(hc) && /<em>leve<\/em>/.test(hc) && /<a href="https:\/\/[^"]+">link<\/a>/.test(hc) && hc.indexOf(c.lista) >= 0 && !/<img|style=|class=/.test(hc), `colar do ${tn}: título, negrito, itálico, link e ${/ol|ul/.test(c.lista) ? 'lista' : 'citação'}`, hc);
    ok(c.img ? tt.indexOf(c.img === 1 ? '1 imagem não foi trazida; adicione pelo botão de foto.' : `${c.img} imagens não foram trazidas; adicione pelo botão de foto.`) >= 0 : !/imagem/.test(tt), `colar do ${tn}: ${c.img ? 'aviso das imagens que não vieram' : 'sem aviso de imagem'}`, tt) }
  /* caixa de colar do "Importar" (com prévia) */
  await ev(B, () => document.querySelector('#layer > .ed132 .ed132-m [data-ex133imp]').click()); await sleep(300);
  await ev(B, c => { const dt = new DataTransfer(); dt.setData('text/html', c.h); $('#ex133-cola').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })) }, COLA.notion);
  ok(await esperar(B, () => /Vai entrar: 4 parágrafos, 1 título, 0 fotos/.test($('[data-ex133vai]')?.textContent || '') && /2 imagens não foram trazidas/.test($('#layer2').textContent), null, 4000), 'caixa "Cole aqui": prévia do colado e aviso das imagens');
  await ev(B, () => closeLayer()); await sleep(200);
  ok(await ev(B, () => /Importar texto/.test((ed132Mais(), $('#layer2 .sheet').textContent)) && !!document.querySelector('#layer2 [data-ex133expe]')), 'menu "…" do editor: "Importar texto" e "Exportar"');
  await ev(B, () => document.querySelector('#layer2 [data-ex133expe]').click()); await sleep(300);
  ok(await ev(B, () => /Exportar coluna/.test($('#layer2 .sheet').textContent) && document.querySelectorAll('[data-ex133d]').length === 8), 'editor › Exportar: abre a folha com os 8 destinos');
  await fecha(B);

  /* ================= 6. exportar da página da coluna (só a autora) ================= */
  const col = { v: 2, coluna: { v: 1, f: 'h', tit: 'O orçamento de 2027 no corredor', linha: 'O que se ouve no Congresso antes da votação', min: 4, capa: false } };
  const [p1] = await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo) values ($1,'post',$2,'[]',$3,'amigos',$4) returning id`, [ids.b, 'O orçamento de 2027 no corredor\n\nO que se ouve no Congresso antes da votação\n\n#Orçamento #Economia', col, CORPO]);
  await recarrega(A); await ev(A, id => cs123Abrir(id), p1.id); await sleep(500);
  ok(await ev(A, () => !!$('#layer .cs123-ler') && !document.querySelector('#layer [data-ex133exp]')), 'página da coluna: o Pedro (leitor) não vê "Exportar"');
  await fecha(A);
  await recarrega(B); await ev(B, id => cs123Abrir(id), p1.id); await sleep(500);
  ok(await ev(B, () => /Exportar/.test(document.querySelector('#layer .cs123-top [data-ex133exp]')?.textContent || '')), 'página da coluna: a autora vê "Exportar"');
  await shot(B, '03-pagina-exportar'); ok(await semLateral(B), '390 px: página da coluna com "Exportar" sem rolagem lateral');
  await ev(B, () => document.querySelector('#layer [data-ex133exp]').click()); await sleep(300);
  ok(await ev(B, () => [...document.querySelectorAll('[data-ex133d]')].map(b => b.querySelector('b').textContent).join(',')) === 'E-mail,LinkedIn,X,Instagram,Facebook,WhatsApp,PDF,Markdown', 'folha "Exportar coluna": e-mail, LinkedIn, X, Instagram, Facebook, WhatsApp, PDF, Markdown');
  await shot(B, '04-exportar-lista'); ok(await semLateral(B), '390 px: folha de exportar sem rolagem lateral');
  const dest = async k => { await ev(B, k => { const v = document.querySelector('[data-ex133lista]'); if (v) v.click() }, k); await sleep(100); await ev(B, k => document.querySelector(`[data-ex133d="${k}"]`).click(), k); await sleep(250) };
  const cb = async (sel, P = B) => { await ev(P, () => { window.__cb = []; document.querySelectorAll('.toast').forEach(t => t.remove()) }); await ev(P, s => document.querySelector(s).click(), sel); await sleep(250); return ev(P, () => ({ cb: window.__cb.slice(), ult: EX133.ult, bt: [...document.querySelectorAll('.ex133-ok')].map(b => b.textContent).join(), toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join() })) };
  const termina = t => t.trim().endsWith('— ' + ASS);
  const baixa = async sel => { const [d] = await Promise.all([B.waitForEvent('download'), ev(B, s => document.querySelector(s).click(), sel)]); const f = await d.path(); return { nome: d.suggestedFilename(), dados: fs.readFileSync(f) } };

  /* e-mail */
  await dest('email'); let c = await cb('[data-ex133a="emailcp"]');
  ok(c.cb.length === 1 && c.cb[0]['text/html'] && c.cb[0]['text/plain'] && c.bt === 'Copiado' && /Copiado/.test(c.toast), 'e-mail: copia como HTML e texto (ClipboardItem) e confirma "Copiado"', c);
  const em = c.cb[0]['text/html'] || '';
  ok(!/<script|onerror|onclick|javascript:/i.test(em) && /<h2 style="[^"]+">O que muda<\/h2>/.test(em) && /<strong[^>]*>como uma decisão/.test(em) && /<a style="[^"]+" href="https:\/\/www\.ibge\.gov\.br\/">o IBGE<\/a>|<a href="https:\/\/www\.ibge\.gov\.br\/" style="[^"]+">o IBGE<\/a>/.test(em) && /<blockquote style=/.test(em) && em.indexOf('— ' + ASS) > 0, 'e-mail: HTML com estilo inline, títulos, negrito, link, citação e assinatura, sem script', em.slice(0, 400));
  ok(termina(c.cb[0]['text/plain']), 'e-mail: o texto simples termina com a assinatura');
  await shot(B, '05-email');
  let dl = await baixa('[data-ex133a="emailhtml"]'); const dh = dl.dados.toString('utf8');
  ok(/\.html$/.test(dl.nome) && /^<!doctype html>/.test(dh) && /<meta charset="utf-8">/.test(dh) && !/<script/i.test(dh) && dh.indexOf(ASS) > 0, 'e-mail: "Baixar .html" (documento completo, sem script)', dl.nome);

  /* LinkedIn */
  await dest('linkedin'); c = await cb('[data-ex133a="licp"]'); let t = c.cb[0]['text/plain'];
  ok(t.length <= 3000 && /versão curta/.test(await ev(B, () => $('#layer2').textContent)) && termina(t) && t.startsWith('O orçamento de 2027 no corredor\n\nO que se ouve no Congresso'), 'LinkedIn: texto > 3.000 avisa e o post vai na versão curta (≤ 3.000), com a assinatura', [t.length, t.slice(0, 120)]);
  ok(t.indexOf(PARS[0].slice(0, 40)) > 0 && t.indexOf(PARS[1].slice(0, 40)) > 0 && t.indexOf(PARS[2].slice(0, 40)) > 0 && t.indexOf(PARS[3].slice(0, 40)) < 0 && /A coluna completa está no Prumo\./.test(t), 'LinkedIn curta: chamada e os 3 primeiros parágrafos');
  await shot(B, '06-linkedin');
  await ev(B, () => document.querySelector('[data-ex133seg="li"][data-v="art"]').click()); await sleep(200); c = await cb('[data-ex133a="licp"]'); t = c.cb[0]['text/plain'];
  ok(t.length > 3000 && /\n\nO QUE MUDA\n\n/.test(t) && /\n\n▸ Nos bastidores\n\n/.test(t) && /• Emendas de bancada\n• Piso da saúde/.test(t) && /“A conta não fecha/.test(t) && /o IBGE \(https:\/\/www\.ibge\.gov\.br\/\)/.test(t) && termina(t) && !!c.cb[0]['text/html'], 'LinkedIn artigo: texto inteiro, títulos em maiúsculas/marcador, listas com "•", links, assinatura (e HTML)', t.slice(0, 200));

  /* X */
  await dest('x'); const fio = await ev(B, () => EX133.x.slice()); const N = fio.length;
  ok(N >= 6 && fio.every(p => p.length <= 280) && fio.every((p, i) => p.startsWith(`${i + 1}/${N} `)), `X: fio de ${N} posts, todos ≤ 280 e numerados "1/${N}"`, fio.map(p => p.length));
  ok(fio[0].indexOf('O orçamento de 2027 no corredor') > 0 && termina(fio[N - 1]) && /R\$ 1\.000 bilhões/.test(fio.join(' ')) && /2,5% do PIB/.test(fio.join(' ')), 'X: começa pelo título, quebra nas frases (sem partir "1.000") e o último post tem a assinatura', [fio[0], fio[N - 1]]);
  ok(await ev(B, () => document.querySelectorAll('[data-ex133xt]').length) === N, 'X: cada post editável na prévia');
  await B.fill('[data-ex133xt="1"]', fio[1] + ' editado'); c = await cb('[data-ex133xcp="1"]');
  ok(c.cb[0]['text/plain'] === fio[1] + ' editado' && await ev(B, n => $('[data-ex133xc="1"]').textContent === `${n}/280`, (fio[1] + ' editado').length), 'X: editar um post (contador ao vivo) e copiar só ele');
  c = await cb('[data-ex133a="xcp"]'); ok(c.cb[0]['text/plain'].split('\n\n').filter(s => /^\d+\/\d+ /.test(s)).length === N && termina(c.cb[0]['text/plain']), 'X: "Copiar tudo"');
  await ev(B, () => $('#layer2 .sh-b').scrollTop = 0); await shot(B, '07-x'); ok(await semLateral(B), '390 px: fio do X sem rolagem lateral');

  /* Instagram */
  await dest('ig'); ok(await esperar(B, () => document.querySelectorAll('[data-ex133ig] img').length >= 3, null, 10000), 'Instagram: carrossel montado');
  const ig = await ev(B, () => ({ n: EX133.ig.length, tam: EX133.ig.every(c => c.width === 1080 && c.height === 1350), imgs: document.querySelectorAll('[data-ex133ig] img').length, cap: $('#ex133-igc').textContent }));
  ok(ig.n >= 4 && ig.n <= 8 && ig.tam && ig.imgs === ig.n, `Instagram: ${ig.n} imagens de 1080×1350 (capa, trechos e "Leia no Prumo")`, ig);
  const cor = await ev(B, () => EX133.ig.map(c => Array.from(c.getContext('2d').getImageData(540, 5, 1, 1).data.slice(0, 3)).join(',')));
  ok(cor[0] === '20,33,58' && cor[cor.length - 1] === '36,64,107' && cor.slice(1, -1).every(x => x === '201,130,43'), 'Instagram: capa na tinta do Prumo, trechos no papel (faixa bronze), último em azul', cor);
  ok(/O orçamento de 2027 no corredor/.test(ig.cap) && /#Orçamento #Economia/.test(ig.cap) && termina(ig.cap), 'Instagram: legenda com título, hashtags e assinatura');
  c = await cb('[data-ex133a="igcap"]'); ok(c.cb[0]['text/plain'] === ig.cap, 'Instagram: "Copiar legenda"');
  dl = await baixa('[data-ex133a="igzip"]'); const zb = dl.dados, eo = zb.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  ok(/\.zip$/.test(dl.nome) && zb.readUInt32LE(0) === 0x04034b50 && zb.readUInt16LE(eo + 10) === ig.n && zb.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47])) > 0, `Instagram: "Baixar todas" gera um .zip com as ${ig.n} imagens`, [dl.nome, zb.readUInt16LE(eo + 10)]);
  dl = await baixa('[data-ex133igq="0"]'); ok(/-01\.png$/.test(dl.nome) && dl.dados.readUInt32BE(16) === 1080 && dl.dados.readUInt32BE(20) === 1350, 'Instagram: tocar num quadro baixa só ele (PNG 1080×1350)', dl.nome);
  await shot(B, '08-instagram'); ok(await semLateral(B), '390 px: Instagram sem rolagem lateral');
  fs.writeFileSync(path.join(QA, '09-quadro-capa.png'), Buffer.from((await ev(B, () => EX133.ig[0].toDataURL('image/png'))).split(',')[1], 'base64'));
  fs.writeFileSync(path.join(QA, '10-quadro-trecho.png'), Buffer.from((await ev(B, () => EX133.ig[1].toDataURL('image/png'))).split(',')[1], 'base64'));

  /* Facebook e WhatsApp */
  await dest('fb'); c = await cb('[data-ex133a="fbcp"]'); t = c.cb[0]['text/plain'];
  ok(t.startsWith('O orçamento de 2027 no corredor') && t.indexOf(PARS[0].slice(0, 40)) > 0 && t.length < 1600 && termina(t) && !/\*/.test(t), 'Facebook: chamada e trecho, com assinatura', t.length);
  await ev(B, () => document.querySelector('[data-ex133seg="fb"][data-v="i"]').click()); await sleep(150); c = await cb('[data-ex133a="fbcp"]');
  ok(c.cb[0]['text/plain'].indexOf(PARS[7].slice(0, 40)) > 0 && termina(c.cb[0]['text/plain']), 'Facebook: "Texto inteiro"');
  await dest('wa'); c = await cb('[data-ex133a="wacp"]'); t = c.cb[0]['text/plain'];
  ok(/^\*O orçamento de 2027 no corredor\*\n_O que se ouve|^\*O orçamento de 2027 no corredor\*\n\n_O que se ouve/.test(t) && /\*como uma decisão que define a legislatura inteira, e todos sabem\*/.test(t) && /_muito_/.test(t) && termina(t), 'WhatsApp: *negrito* e _itálico_ do WhatsApp, assinatura', t.slice(0, 300));
  ok(await ev(B, () => /^https:\/\/wa\.me\/\?text=/.test(document.querySelector('[data-ex133wa]')?.getAttribute('href') || '')), 'WhatsApp: "Abrir no WhatsApp" (wa.me com o texto)');
  await ev(B, () => document.querySelector('[data-ex133seg="wa"][data-v="i"]').click()); await sleep(150); c = await cb('[data-ex133a="wacp"]'); t = c.cb[0]['text/plain'];
  ok(/\n\n\*O que muda\*\n\n/.test(t) && /> A conta não fecha/.test(t) && /• Emendas de bancada/.test(t) && termina(t), 'WhatsApp inteiro: títulos em *negrito*, citação com ">" e listas');
  await shot(B, '11-whatsapp');
  /* navigator.share quando existe */
  await ev(B, () => { window.__sh = null; navigator.share = async o => { window.__sh = o } }); await dest('wa');
  await ev(B, () => document.querySelector('[data-ex133a="wash"]').click()); await sleep(200);
  ok(await ev(B, () => !!window.__sh && /\*O orçamento de 2027/.test(window.__sh.text) && window.__sh.text.trim().endsWith('publicado originalmente no Prumo')), 'WhatsApp: "Compartilhar" usa navigator.share quando existe');

  /* PDF */
  await dest('pdf'); await ev(B, () => { window.__imp = null; window.print = () => { const d = document.querySelector('#ex133-print'); window.__imp = { tx: d && d.innerText, cl: document.documentElement.classList.contains('ex133-imp'), css: [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => r.media && /print/.test(r.media.mediaText) && /ex133-imp/.test(r.cssText)) } catch (e) { return false } }) } } });
  await ev(B, () => document.querySelector('[data-ex133a="pdf"]').click()); await esperar(B, () => !!window.__imp, null, 3000);
  const imp = await ev(B, () => window.__imp);
  ok(!!imp && imp.cl && imp.css && /O orçamento de 2027 no corredor/.test(imp.tx) && /O que muda/.test(imp.tx) && imp.tx.trim().endsWith('— ' + ASS), 'PDF: folha de impressão própria (@media print) e window.print(), com título, texto e assinatura', imp);
  await sleep(1700); ok(await ev(B, () => !document.querySelector('#ex133-print') && !document.documentElement.classList.contains('ex133-imp')), 'PDF: depois de imprimir, a folha de impressão sai');

  /* Markdown */
  await dest('md'); c = await cb('[data-ex133a="mdcp"]'); t = c.cb[0]['text/plain'];
  ok(/^# O orçamento de 2027 no corredor\n\n\*O que se ouve no Congresso antes da votação\*\n\nPor Bia Souza\n\n/.test(t) && /\n## O que muda\n/.test(t) && /\n### Nos bastidores\n/.test(t) && /\*\*como uma decisão[^*]+\*\*/.test(t) && /\*muito\*/.test(t) && /\[o IBGE\]\(https:\/\/www\.ibge\.gov\.br\/\)/.test(t) && /\n- Emendas de bancada\n- Piso da saúde\n/.test(t) && /\n> A conta não fecha/.test(t) && /\n---\n/.test(t) && termina(t), 'Markdown: títulos, negrito, itálico, link, lista, citação, separador e assinatura', t.slice(0, 300));
  dl = await baixa('[data-ex133a="mdbx"]'); ok(/\.md$/.test(dl.nome) && dl.dados.toString('utf8') === t, 'Markdown: "Baixar .md"', dl.nome);
  await shot(B, '12-markdown'); await fecha(B);

  /* ================= 7. 360 px e modo escuro ================= */
  const P3 = await abrir('b', { vp: { width: 360, height: 740 }, n: '360' });
  await recarrega(P3); await ev(P3, id => cs123Abrir(id), p1.id); await sleep(400);
  ok(await semLateral(P3), '360 px: página da coluna com "Exportar" sem rolagem lateral');
  await ev(P3, () => document.querySelector('#layer [data-ex133exp]').click()); await sleep(300); ok(await semLateral(P3), '360 px: lista de destinos sem rolagem lateral');
  for (const k of ['email', 'linkedin', 'x', 'ig', 'wa', 'md']) { await ev(P3, () => document.querySelector('[data-ex133lista]')?.click()); await sleep(80); await ev(P3, k => document.querySelector(`[data-ex133d="${k}"]`).click(), k); await sleep(k === 'ig' ? 1500 : 200);
    ok(await semLateral(P3), `360 px: exportar › ${k} sem rolagem lateral`) }
  await shot(P3, '13-instagram-360'); await fecha(P3);
  await ev(P3, () => ed132Abre(ed132Novo({}))); await sleep(400);
  ok(await semLateral(P3), '360 px: editor com "Importar" sem rolagem lateral');
  const [fc3] = await Promise.all([P3.waitForEvent('filechooser'), ev(P3, () => { document.querySelector('[data-ex133imp]').click(); setTimeout(() => document.querySelector('[data-ex133arq]').click(), 200) })]);
  await fc3.setFiles({ name: 'coluna.md', mimeType: 'text/markdown', buffer: Buffer.from(MD) }); await esperar(P3, () => !!document.querySelector('[data-ex133vai]'), null, 5000);
  ok(await semLateral(P3), '360 px: prévia de importar sem rolagem lateral'); await shot(P3, '14-importar-360'); await fecha(P3);
  const BD = await abrir('b', { dark: true, n: 'd', base: BASE2 });
  await recarrega(BD); await ev(BD, id => cs123Abrir(id), p1.id); await sleep(400); await ev(BD, () => document.querySelector('#layer [data-ex133exp]').click()); await sleep(300);
  const esc = await ev(BD, () => { const rgb = cor => { const k = document.createElement('canvas').getContext('2d'); k.fillStyle = '#808080'; k.fillStyle = cor; k.fillRect(0, 0, 1, 1); const d = k.getImageData(0, 0, 1, 1).data; return d[0] + d[1] + d[2] }; return { fundo: rgb(getComputedStyle($('#layer2 .sheet')).backgroundColor), texto: rgb(getComputedStyle(document.querySelector('.ex133-lt b')).color) } });
  ok(esc.fundo < 200 && esc.texto > 450, 'modo escuro: folha de exportar escura com texto claro', esc); await shot(BD, '15-exportar-escuro');
  await ev(BD, () => document.querySelector('[data-ex133d="x"]').click()); await sleep(200); await shot(BD, '16-x-escuro');
  const ta = await ev(BD, () => { const c = getComputedStyle(document.querySelector('[data-ex133xt]')); return [c.backgroundColor, c.color] });
  ok(ta[0] !== 'rgb(255, 255, 255)' && /rgb\(2[0-9]{2}/.test(ta[1]), 'modo escuro: posts do X legíveis', ta);

  for (const P of [A, B, P3, BD]) ok(!(P._erros || []).length, 'sem erros no console', P._erros);
  const R = U.resumo(); console.log(`\nRESUMO t_colunas_exportar: ${R.OKS} ok, ${R.FALHAS} falhas`);
  fs.rmSync(path.join(SITE, 'series'), { recursive: true, force: true });
  await br.close(); srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { fs.rmSync(path.join(SITE, 'series'), { recursive: true, force: true }); srv && srv.kill(); srv2 && srv2.kill() } catch (_) { } process.exit(1) });
