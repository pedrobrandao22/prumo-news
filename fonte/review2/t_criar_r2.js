// Criar, 2ª rodada (166 e 164 revisto, 16/11 noite): foto + notícia publica com a foto; miniatura abre Cortar/Filtros/Editar
// com Concluir e sem Galeria/POST-GIRO; "Local e pessoas" é uma folha na caixa; Enquete/Número/De perto apagados com foto;
// avisos junto do campo; enquete sem opções iguais; toque duplo em Publicar não abre o cabeçalho; sem rede uma mensagem só;
// coluna sem título não abre "Antes de publicar"; menu do giro dentro do cartão; dólar com a mesma data no fim da linha.
// Portas 8710–8711. Fotos em iPhone 13 (390×844) e iPhone SE (375×667).
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8710/index.html', FOTO = __dirname + '/etapa13/foto.jpg';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const escolhe = async (A, fotos) => { const [fch] = await Promise.all([A.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), clk(A, '#layer > .cp152 [data-cp152ax="foto"]')]); if (fch) await fch.setFiles(fotos); return !!fch };
const fecha = A => ev(A, () => { try { camDesliga() } catch (e) { } ED = null; CP152.ed = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false; try { cr155Limpa() } catch (e) { } });
const visivel = (A, sel) => ev(A, s => { const e = document.querySelector(s); return !!e && !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' }, sel);
const toasts = A => ev(A, () => [...document.querySelectorAll('.toast')].map(t => t.textContent).join('|'));
async function caixaComFoto(A, tx) { await ev(A, () => criarMenu()); await sleep(400); await A.fill('#cp152-tx', tx); await escolhe(A, [FOTO]); return esperar(A, () => document.querySelectorAll('#layer > .cp152 .fc164 img').length === 1, null, 5000) }

async function rodada(b, H, vp, tag, email) {
  const A = U.erros(await H.pagina(b, { viewport: vp, dark: true }), tag);
  await criar(A, { nome: 'Pedro', email }); await U.foto(A, `criar-r2-${tag}-0-entrou`); await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000);
  const sh = n => U.foto(A, `criar-r2-${tag}-${n}`);

  // 1. Foto + Notícia: a notícia é escolhida na caixa e publica junto com a foto
  ok(await caixaComFoto(A, 'Fim de tarde no Aterro'), `[${tag}] foto na caixa`);
  ok(await ev(A, () => ['enq', 'ana', 'rel'].every(k => document.querySelector(`#layer [data-cp152ax="${k}"]`).classList.contains('fc164-off')) && !document.querySelector('#layer [data-cp152ax="nt"]').classList.contains('fc164-off')), `[${tag}] com foto: Enquete, Número e De perto apagados; Notícia não`);
  await sh('1-caixa-foto');
  await clk(A, '#layer > .cp152 [data-cp152ax="enq"]'); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152') && !document.querySelector('#layer .ce') && /Enquete não vai junto com foto/.test(document.querySelector('#layer .fc164-nota')?.textContent || '')), `[${tag}] Enquete com foto: aviso embaixo dos botões e fica na caixa`);
  ok(await ev(A, () => { const n = document.querySelector('#layer .fc164-nota').getBoundingClientRect(), a = document.querySelector('#layer .cp152-ax').getBoundingClientRect(); return n.top >= a.bottom - 1 }), `[${tag}] o aviso não cobre os botões`);
  await sh('2-enquete-com-foto');
  await clk(A, '#layer > .cp152 [data-cp152ax="nt"]'); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152 .cn102-ntl') && !document.querySelector('#layer .ce')), `[${tag}] Notícia com foto: a lista abre por cima da caixa`);
  ok(!/Tire as fotos/.test(await toasts(A)), `[${tag}] sem o aviso "Tire as fotos" na Notícia`, await toasts(A));
  await sh('3-lista-noticias');
  const pid = await ev(A, () => { const b = document.querySelector('#layer .cn102-ntl [data-fc164nt]'); const id = b.dataset.fc164nt; b.click(); return id }); await sleep(400);
  ok(await ev(A, pid => !!document.querySelector('#layer > .cp152 .cr155-nt') && document.querySelectorAll('#layer > .cp152 .fc164 img').length === 1 && document.getElementById('cp152-tx').value === 'Fim de tarde no Aterro' && CR155.pid === pid, pid), `[${tag}] de volta à caixa: foto, texto e notícia juntos`);
  await sh('4-caixa-foto-noticia');

  // 2. miniatura: Filtros/Editar com Concluir, aba Cortar, sem Galeria nem POST/GIRO
  await clk(A, '#layer > .cp152 [data-fc164ed="0"]'); await sleep(500);
  ok(await ev(A, () => ED && ED.po.passo === 'filtros' && /Concluir/.test(document.querySelector('#layer .ce [data-edav]').textContent) && [...document.querySelectorAll('#layer .ce [data-fc164aba]')].map(b => b.textContent).join('|') === 'Cortar|Filtros|Editar'), `[${tag}] miniatura abre Filtros com Concluir e as abas Cortar/Filtros/Editar`);
  ok(!(await visivel(A, '#layer .ce .ce-modos')) && !(await visivel(A, '#layer .ce .cfp-grade')), `[${tag}] sem Galeria e sem POST/GIRO`);
  await sh('5-miniatura-filtros');
  await clk(A, '#layer .ce [data-fc164aba="cortar"]'); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer .ce.fc164-corte #ce-pv') && /Concluir/.test(document.querySelector('#layer .ce [data-edav]').textContent)), `[${tag}] Cortar: a foto com o corte e Concluir`);
  ok(!(await visivel(A, '#layer .ce .ce-modos')) && !(await visivel(A, '#layer .ce .cfp-grade')) && !(await visivel(A, '#layer .ce .cfp-gh')), `[${tag}] Cortar sem Galeria e sem POST/GIRO`);
  await sh('6-cortar');
  await clk(A, '#layer .ce [data-edar]'); await sleep(150);
  await clk(A, '#layer .ce [data-fc164aba="filtros"]'); await sleep(300);
  await clk(A, '#layer .ce [data-edflt="clarendon"]'); await sleep(200); await clk(A, '#layer .ce [data-edav]'); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152') && CP152.ed.po.fotos[0].f === 'clarendon' && CP152.ed.po.ar !== '4:5' && !!document.querySelector('#layer > .cp152 .cr155-nt')), `[${tag}] Concluir volta para a caixa com o corte, o filtro e a notícia`);
  await clk(A, '#layer > .cp152 [data-fc164ed="0"]'); await sleep(400); await clk(A, '#layer .ce [data-edvolta], #layer .ce [data-edfechar]'); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152') && document.querySelectorAll('#layer > .cp152 .fc164 img').length === 1), `[${tag}] o × do editor volta para a caixa`);

  // 3. Local e pessoas: folha na caixa
  await clk(A, '#layer > .cp152 [data-fc164det]'); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152 .fc164-dsh #fc164-local') && !document.querySelector('#layer .ce') && !/Compartilhar|Anexar notícia|Configurações avançadas/.test(document.querySelector('#layer').innerText)), `[${tag}] "Local e pessoas" abre uma folha pequena, sem outra tela de publicar`);
  await sh('7-local-pessoas');
  await A.fill('#fc164-local', 'Aterro do Flamengo'); await A.fill('#layer [data-fc164alt="0"]', 'Pôr do sol no Aterro'); await clk(A, '#layer [data-fc164detok]'); await sleep(300);
  ok(await ev(A, () => !document.querySelector('#layer .fc164-dsh') && /Aterro do Flamengo/.test(document.querySelector('#layer [data-fc164det]').textContent) && document.getElementById('cp152-tx').value === 'Fim de tarde no Aterro'), `[${tag}] Pronto volta para a caixa com o local no resumo`);

  // 4. publicar: texto + foto + notícia + local; o post aparece na tela; toque duplo não abre o cabeçalho
  const r = await ev(A, () => { const b = document.querySelector('#layer [data-cp152pub]').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2] });
  await A.mouse.click(r[0], r[1]); await sleep(90); await A.mouse.click(r[0], r[1]);
  ok(await esperar(A, pid => PUB.itens.some(x => x.tipo === 'post' && x.fotos.length === 1 && x.pid === pid && /Fim de tarde no Aterro/.test(x.texto || '') && x.estilo && x.estilo.local === 'Aterro do Flamengo'), pid, 9000), `[${tag}] Publicar sai com texto, foto, notícia e local`);
  await sleep(600);
  ok(await ev(A, () => VIEW === 'feed' && !document.querySelector('#layer').innerHTML.trim() && !document.querySelector('#layer2')?.innerHTML.trim()), `[${tag}] toque duplo em Publicar não abre outra tela`, await ev(A, () => VIEW + '|' + document.querySelector('#layer').innerHTML.slice(0, 80)));
  ok(await esperar(A, () => { const x = PUB.itens.find(x => x.autor === S.uid && x.fotos && x.fotos.length); const el = x && document.getElementById('p-u:' + x.id); if (!el) return false; const q = el.getBoundingClientRect(); return q.top < innerHeight * .7 && q.bottom > 0 }, null, 6000), `[${tag}] o post com foto aparece na tela do Feed`);
  await sh('8-feed-depois');

  // 5. enquete: aviso junto das opções; opções iguais não publicam
  await ev(A, () => criarMenu()); await sleep(300); await A.fill('#cp152-tx', 'Teste do testador para ajuste'); await clk(A, '#layer > .cp152 [data-cp152ax="enq"]'); await sleep(500);
  const pubForm = () => ev(A, () => edPublicaPost());
  await pubForm(); await sleep(300);
  ok(await ev(A, () => { const e = document.querySelector('#layer .cr166-er'), t = document.querySelector('#cn102-tit'); if (!e || !t) return false; return /opç/i.test(e.textContent) && e.getBoundingClientRect().top >= t.getBoundingClientRect().bottom }), `[${tag}] enquete sem opções: aviso embaixo das opções, sem cobrir a pergunta`);
  ok(!/opç/i.test(await toasts(A)), `[${tag}] sem o aviso no alto`, await toasts(A));
  await sh('9-enquete-aviso');
  await A.fill('#layer input[data-cn102o="0"]', 'Sim'); await A.fill('#layer input[data-cn102o="1"]', 'sim '); await sleep(100);
  ok(await ev(A, () => !document.querySelector('#layer .cr166-er')), `[${tag}] escrever apaga o aviso`);
  const n0 = await ev(A, () => PUB.itens.length); await pubForm(); await sleep(500);
  ok(await ev(A, n0 => PUB.itens.length === n0 && /iguais/.test(document.querySelector('#layer .cr166-er')?.textContent || '') && !!document.querySelector('#layer .cn102-op.cr166-erc'), n0), `[${tag}] "Sim" e "sim " não publicam: "Duas opções estão iguais"`);
  await sh('10-enquete-iguais');
  await A.fill('#layer input[data-cn102o="1"]', 'Não'); await pubForm();
  ok(await esperar(A, () => PUB.itens.some(x => x.estilo && x.estilo.cn && x.estilo.cn.k === 'enq' && x.estilo.cn.o.join('|') === 'Sim|Não'), null, 8000), `[${tag}] com opções diferentes publica`);
  await sleep(500); await fecha(A); await sleep(200);

  // 6. De perto: aviso junto do título
  await ev(A, () => criarMenu()); await sleep(300); await clk(A, '#layer > .cp152 [data-cp152ax="rel"]'); await sleep(500);
  await ev(A, () => { const f = document.getElementById('ce-pfile'); f && f.dispatchEvent(new Event('cancel')) }); await sleep(200);
  if (await ev(A, () => !!(ED && ED.po && ED.po.cn && ED.po.cn.k === 'rel'))) {
    await pubForm(); await sleep(300);
    ok(await ev(A, () => { const e = document.querySelector('#layer .cr166-er'); return !!e && /título/.test(e.textContent) && document.querySelector('#cn102-tit').classList.contains('cr166-erc') }), `[${tag}] De perto sem título: aviso embaixo do título`);
  }
  await fecha(A); await sleep(200);

  // 7. sem rede: uma mensagem só
  await ev(A, () => { window.__on = true; Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => window.__on !== false }); const o0 = window.__sb; window.__sb = function () { if (window.__on === false) return Promise.reject(new TypeError('Failed to fetch')); return o0.apply(this, arguments) } });
  await ev(A, () => criarMenu()); await sleep(300); await A.fill('#cp152-tx', 'Post sem rede'); await ev(A, () => { window.__on = false; dispatchEvent(new Event('offline')) });
  await clk(A, '#layer [data-cp152pub]');
  ok(await esperar(A, () => PQ.jobs.some(j => j.estado === 'erro'), null, 8000), `[${tag}] sem rede: o post fica na fila`);
  await sleep(300);
  ok(!/Tente de novo/.test(await toasts(A)), `[${tag}] sem rede: sem o aviso "Tente de novo"`, await toasts(A));
  ok(await ev(A, () => { const row = document.querySelector('#pq .pq-row.erro'); return !!row && /Sem conexão/.test(row.textContent) && !row.querySelector('[data-pqtenta]') && !!row.querySelector('[data-pqdesc]') }), `[${tag}] sem rede: o cartão diz que publica sozinho e só oferece Descartar`);
  await ev(A, () => document.getElementById('pq').scrollIntoView({ block: 'center' })); await sh('11-sem-rede');
  await ev(A, () => { window.__on = true; dispatchEvent(new Event('online')) });
  ok(await esperar(A, () => PUB.itens.some(x => x.texto === 'Post sem rede'), null, 12000), `[${tag}] a internet volta e publica sozinho`);

  // 8. coluna: ajuda do + e título obrigatório
  await ev(A, () => criarMenu()); await sleep(300); await clk(A, '[data-cp152aba="coluna"]'); await clk(A, '[data-cp152nova]'); await sleep(600);
  ok(await ev(A, () => /Toque no texto e depois em \+/.test(cr137Cp().getAttribute('data-ph'))), `[${tag}] coluna: a ajuda diz "Toque no texto e depois em +"`);
  await clk(A, '#layer > .ed132 [data-ed132painel]'); await sleep(400);
  ok(await ev(A, () => !document.querySelector('#layer .ed132-pp') && /título/.test(document.querySelector('#layer > .ed132 .cr166-er')?.textContent || '') && document.activeElement && document.activeElement.id === 'ed132-tit'), `[${tag}] coluna sem título: Publicar marca o Título e põe o cursor nele`);
  await sh('12-coluna-sem-titulo');
  await A.fill('#ed132-tit', 'Minha coluna'); await sleep(100);
  ok(await ev(A, () => !document.querySelector('#layer > .ed132 .cr166-er')), `[${tag}] escrever o título tira o aviso`);
  await clk(A, '#layer > .ed132 [data-ed132painel]'); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer .ed132-pp')), `[${tag}] com título, Publicar abre "Antes de publicar"`);
  await ev(A, () => { ED132.E = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);
  return A;
}

(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8710); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = await rodada(b, H, { width: 390, height: 844 }, 'i13', 'a@x.com');

  // 9. dólar: a linha termina no dia do título
  const d = await ev(A, () => cn102IndDado({ id: 'dolar', nome: 'Dólar', valor: 'R$ 5,69', variacao: '+0,42%', dir: 'sobe', data: '2026-11-16', serie: [5.51, 5.6, 5.65], rotulos: ['2026-11-11', '2026-11-12', '2026-11-13'] }));
  ok(d.r[d.r.length - 1] === '2026-11-16' && d.s[d.s.length - 1] === 5.69 && d.dt === '2026-11-16', 'dólar: o valor do dia entra como último ponto', d);
  const d2 = await ev(A, () => cn102IndDado({ id: 'ibovespa', nome: 'Ibovespa', valor: '172.458', data: '2026-11-13', serie: [1, 2, 172458], rotulos: ['2026-11-11', '2026-11-12', '2026-11-13'] }));
  ok(d2.r.length === 3, 'série que já termina no dia fica igual');
  const d3 = await ev(A, () => cn102IndDado({ id: 'selic', nome: 'Selic', valor: '13,75%', data: '2026-09-17', serie: [13, 13.75], rotulos: ['2026-10', '2026-11'] }));
  ok(d3.r.length === 2, 'série mensal fica igual');
  await ev(A, () => criarMenu()); await sleep(300); await clk(A, '#layer > .cp152 [data-cp152ax="ana"]'); await sleep(600);
  if (await ev(A, () => cn102Inds().some(x => x.id === 'dolar'))) {
    await ev(A, () => document.querySelector('#layer [data-cn102dab="ind"]')?.click()); await sleep(200); await ev(A, () => document.querySelector('#layer [data-cn102ind="dolar"]')?.click()); await sleep(300);
    await U.foto(A, 'criar-r2-i13-13-dolar');
  }
  await fecha(A);

  // 10. giro: menu dentro do cartão (iPhone 13 com a barra do Safari: 390×664)
  await A.setViewportSize({ width: 390, height: 664 }); await sleep(300);
  await ev(A, () => criarMenu()); await sleep(300); await clk(A, '[data-cp152aba="giro"]'); await sleep(1200);
  ok(await ev(A, () => { const cv = document.querySelector('#layer #ce-cv').getBoundingClientRect(), b = document.querySelector('#layer .ce-rail button').getBoundingClientRect(); return b.left >= cv.left + 6 }), 'giro: os ícones do menu ficam dentro do cartão', await ev(A, () => [document.querySelector('#layer #ce-cv').getBoundingClientRect().left, document.querySelector('#layer .ce-rail button').getBoundingClientRect().left]));
  await U.foto(A, 'criar-r2-i13-14-giro'); await fecha(A);
  ok(!A._erros.length, 'sem erros (iPhone 13) ' + A._erros.join('|'));

  const H2 = await require('../harness').criar(); const B = await rodada(b, H2, { width: 375, height: 667 }, 'se', 'a@x.com');
  ok(!B._erros.length, 'sem erros (iPhone SE) ' + B._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_criar_r2: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
