// App com o SQL v9: perfil aberto, seguir, público "Seguidores e amigos", Feed com quem você segue, Atividade,
// e a coluna (criar, ler, curtir, comentar, voltar). Visual novo e foco em notícia ligados, como em produção.
// Capturas em qa/colunas/ (390 × 844; escuro; 360 px).
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8742, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'colunas'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const clk0 = (p, sel) => p.$eval(sel, e => e.click()); // dentro da camada (sem rolar a página de baixo)
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const CORPO = [
  'A reforma tributária entrou na reta final no Congresso, e o que parecia um debate técnico virou uma disputa sobre quem paga a conta. Os números mostram que a mudança é menos radical do que se diz.',
  'O ponto central é simples: o imposto passa a ser cobrado no destino, onde o produto é consumido, e não mais na origem. Isso tira dos estados produtores uma vantagem que eles usaram por décadas na guerra fiscal.',
  '## O que muda para quem compra',
  'Para o consumidor, a promessa é de **transparência**: o imposto aparece separado na nota. Hoje, ninguém sabe ao certo quanto paga de tributo num quilo de arroz ou numa conta de luz.',
  '> Imposto que ninguém vê é imposto que ninguém cobra de volta.',
  'Os detalhes estão no [relatório da Câmara](https://www.camara.leg.br/reforma) e no estudo do *Ipea*, que vale a leitura inteira.',
  '## E para os estados',
  'Os governadores pediram um fundo de compensação maior. A conta final depende de como o Senado vai calibrar a transição, que deve levar sete anos.',
  'A lição dos últimos meses é que reforma boa é a que sobrevive ao primeiro orçamento. Vamos acompanhar.'
].join('\n');
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456'), d = await H.criarConta('d@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Dani Lima','membro')`, [a, b, d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [a, b]); // Pedro–Bia amigos; Dani não conhece ninguém
  const br = await U.navegador();
  const abrir = async (uid, email, nome, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: uid, email } }, ...o }), nome);
    await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-foco', '1'); localStorage.setItem('prumo-teste-visual', '1') } catch (e) { } });
    await p.goto(BASE); await esperar(p, () => S.membro && S.amigosOk && typeof V9 !== 'undefined' && V9.on === true, null, 15000); return p };
  const fecha = p => ev(p, () => { let n = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && n++ < 6) closeLayer() });
  const B = await abrir(b, 'b@x', 'B'), D = await abrir(d, 'd@x', 'D');
  ok(await ev(B, () => V9.on === true && VISUAL_NOVO === true), 'detecta o SQL v9 (visual novo ligado)');

  /* ---------- 1. Perfil aberto ---------- */
  await ev(B, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(500);
  ok(await esperar(B, () => !!document.querySelector('#v-me .cs123-cfg [data-cs123aberto]')), 'Conta: chave "Perfil aberto"');
  ok(/Quem não é seu amigo pode seguir e ver o que você publicar para seguidores/.test(await ev(B, () => document.querySelector('#v-me .cs123-cfg').textContent)), 'Conta: a explicação da chave');
  await clk(B, '#v-me [data-cs123aberto]'); await sleep(700);
  ok((await H.sql(`select perfil_aberto from membros where uid=$1`, [b]))[0].perfil_aberto === true, 'perfil aberto: gravado no banco');
  ok(await esperar(B, () => CS123.aberto === true && !!document.querySelector('#v-me .cs123-cfg [data-cs123aberto]:checked')), 'perfil aberto: a chave fica ligada');

  /* ---------- 2. criar a coluna ---------- */
  await ev(B, () => { go('feed'); criarAbrir('post') }); await sleep(500);
  ok(await ev(B, () => !!document.querySelector('#layer [data-cs123ini]') && document.querySelectorAll('#layer [data-cn102ini]').length === 4), '"O que você quer publicar?": cartão "Escrever coluna" junto dos outros quatro');
  await semToast(B); await B.screenshot({ path: path.join(QA, 'col-0-o-que-publicar.png') });
  await clk(B, '#layer [data-cs123ini]'); await sleep(400);
  /* editor novo (132): título, linha fina, texto em blocos; público, hashtags e publicar em "Antes de publicar" */
  ok(await esperar(B, () => !!document.querySelector('#layer > .ed132 #ed132-tit') && !ED), 'abre o editor da coluna (e fecha o criador de post)');
  await B.fill('#ed132-tit', 'A reforma tributária é menos radical do que parece');
  await B.fill('#ed132-lin', 'Cobrar o imposto no destino muda a guerra fiscal, mas a conta do consumidor depende da transição');
  await ev(B, c => { const cp = $('#ed132-corpo'); cp.innerHTML = ed132ParaEditor(ed132DeMarkdown(c)); cp.dispatchEvent(new Event('input', { bubbles: true })) }, CORPO); await sleep(300);
  ok(await ev(B, () => /\d+ palavras · \d+ min de leitura/.test(document.querySelector('[data-ed132cont]').textContent)), 'editor: contador de palavras e o tempo de leitura');
  // formatação: negrito pela barra
  await ev(B, () => { const cp = $('#ed132-corpo'), p = cp.lastElementChild; cp.focus(); const r = document.createRange(); r.selectNodeContents(p); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r) });
  await clk0(B, '[data-ed132cmd="b"]'); await B.keyboard.type('negrito'); ok(await ev(B, () => /<strong>negrito<\/strong><\/p>$/.test(ed132Le().html)), 'editor: o botão N põe negrito');
  await ev(B, () => { [...$('#ed132-corpo').querySelectorAll('strong,b')].filter(e => e.textContent === 'negrito').forEach(e => e.remove()); $('#ed132-corpo').dispatchEvent(new Event('input', { bubbles: true })) });
  // capa
  const png = await ev(B, () => { const c = document.createElement('canvas'); c.width = 1200; c.height = 700; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 1200, 700); gr.addColorStop(0, '#2c3e50'); gr.addColorStop(1, '#8a5a17'); g.fillStyle = gr; g.fillRect(0, 0, 1200, 700);
    g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 9; i++) g.fillRect(120 + i * 110, 560 - i * 45, 70, 140 + i * 45); return c.toDataURL('image/png').split(',')[1] });
  const [fc] = await Promise.all([B.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), clk0(B, '[data-ed132capa]')]);
  if (fc) await fc.setFiles({ name: 'capa.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  ok(!!fc && await esperar(B, () => !!document.querySelector('#layer > .ed132 .ed132-cpi img'), null, 6000), 'editor: foto de capa');
  await ev(B, () => $('#layer .ed132-sc').scrollTop = 0); await semToast(B); await B.screenshot({ path: path.join(QA, 'col-1-editor.png') });
  // rascunho
  await sleep(2600); ok(await ev(B, () => cs123RascLe().length === 1 && /menos radical/.test(cs123RascLe()[0].tit)), 'rascunho: guardado sozinho enquanto escreve');
  // ver como leitor
  await clk0(B, '[data-ed132modo="ver"]'); await sleep(300);
  ok(await ev(B, () => !!document.querySelector('#layer > .ed132 .ed132-ver .cs123-art h1') && !!document.querySelector('#layer > .ed132 .ed132-ver .cs123-fig img')), 'prévia: a página de leitura (com a capa) no editor');
  await semToast(B); await B.screenshot({ path: path.join(QA, 'col-2-previa.png') });
  await clk0(B, '[data-ed132modo="ed"]'); await sleep(200);
  // antes de publicar: público
  await clk0(B, '#layer > .ed132 [data-ed132painel]'); await sleep(300);
  ok(await ev(B, () => !!document.querySelector('#layer .ed132-pp [data-ed132pubv="seguidores"]')), 'editor: público "Seguidores e amigos" (perfil aberto)');
  await clk0(B, '[data-ed132pubv="seguidores"]'); await sleep(200); await B.fill('#ed132-tags', '#ReformaTributária economia');
  ok(await ev(B, () => document.querySelector('[data-ed132pubv="seguidores"]').getAttribute('aria-checked') === 'true' && $('#ed132-tit').value.length > 10), 'editor: escolhe seguidores sem perder o texto');
  await ev(B, () => { const s = $('#layer .ed132-pps'); s.scrollTop = s.scrollHeight }); await semToast(B); await B.screenshot({ path: path.join(QA, 'col-1b-editor-publico.png') });
  await ev(B, () => history.back()); await sleep(500);
  ok(await ev(B, () => !document.querySelector('#layer .ed132-pp') && !!document.querySelector('#layer > .ed132 #ed132-tit')), 'o voltar do celular fecha "Antes de publicar" e volta ao editor');
  await clk0(B, '#layer > .ed132 [data-ed132painel]'); await sleep(300); await clk0(B, '#layer .ed132-pp [data-ed132pub]');
  ok(await esperar(B, () => !ED132.E && !$('#layer').innerHTML, null, 8000), 'publicar: fecha o editor');
  const row = (await H.sql(`select * from publicacoes where autor=$1 order by at desc limit 1`, [b]))[0];
  ok(row && row.estilo.coluna && row.estilo.coluna.tit === 'A reforma tributária é menos radical do que parece' && !row.estilo.coluna.corpo && /O ponto central/.test(row.corpo), 'publicar: título no estilo e o texto longo na coluna "corpo"', row && row.estilo);
  ok(row.publico === 'seguidores' && row.fotos.length === 1 && row.fotos[0].indexOf(b + '/') === 0, 'publicar: para seguidores, com a capa na pasta da Bia');
  ok(/^A reforma tributária é menos radical do que parece\n\nCobrar o imposto/.test(row.texto) && /#ReformaTributária #economia$/.test(row.texto), 'publicar: texto do post = título, linha fina e hashtags', row.texto);
  ok(await ev(B, () => cs123RascLe().length === 0), 'publicar: o rascunho sai');
  const cid = row.id;

  /* ---------- 3. Dani acha a Bia na Busca e segue ---------- */
  await ev(D, () => { go('feed'); abrirBusca() }); await sleep(300); await D.fill('#btext', 'bia');
  ok(await esperar(D, () => !!document.querySelector('#sres .cs123-bus [data-cs123perfil]'), null, 5000), 'Busca: "Perfis abertos" com a Bia');
  ok(await ev(D, () => !!document.querySelector('#sres .cs123-bus [data-cs123seg]')), 'Busca: botão Seguir na linha');
  await clk(D, '#sres .cs123-bus [data-cs123perfil]'); await sleep(800);
  ok(await esperar(D, u => !!document.querySelector(`#layer .pfv [data-cs123seg="${u}"]`), b, 6000), 'perfil aberto de quem não é amigo: botão Seguir');
  ok(await esperar(D, () => /0\s*seguidores/.test(document.querySelector('#layer .pfv .cs123-num')?.textContent || '')), 'perfil: os números (0 seguidores · 0 seguindo)');
  ok(await ev(D, () => /Bia Souza/.test(document.querySelector('#layer .pfv').textContent) && /Siga Bia/.test(document.querySelector('#layer .pfv').textContent)), 'perfil: nome da Bia e "Siga Bia para ver…"');
  await semToast(D); await D.screenshot({ path: path.join(QA, 'col-3-perfil-aberto-seguir.png') });
  await clk(D, `#layer .pfv [data-cs123seg="${b}"]`);
  ok(await esperar(D, u => document.querySelector(`#layer .pfv [data-cs123seg="${u}"]`)?.textContent === 'Seguindo', b, 6000), 'Seguir: o botão vira "Seguindo"');
  ok((await H.sql(`select count(*) n from seguidores where seguidor=$1 and seguido=$2`, [d, b]))[0].n == 1, 'Seguir: gravado no banco');
  ok(await esperar(D, () => /1\s*seguidor(?!e)/.test(document.querySelector('#layer .pfv .cs123-num')?.textContent || '')), 'perfil: 1 seguidor');
  ok(await esperar(D, id => !!document.querySelector(`#layer .pfv [id="p-u:${id}"] .cs123-card`) || !!document.querySelector('#layer .pfv .pf-t .cs123-pfk'), cid, 6000), 'perfil: a coluna aparece para quem segue');
  await semToast(D); await D.screenshot({ path: path.join(QA, 'col-3b-perfil-seguindo.png') });
  await fecha(D);

  /* ---------- 4. a coluna no Feed da Dani ---------- */
  await ev(D, id => { go('feed'); FILTRO = 'tudo'; renderPosts(); garantirPost('u:' + id) }, cid); await sleep(500);
  ok(await esperar(D, id => !!document.querySelector(`#posts [id="p-u:${id}"] .cs123-card`), cid, 6000), 'Feed: a coluna de quem a Dani segue');
  const card = await ev(D, id => { const a = document.querySelector(`#posts [id="p-u:${id}"]`); const ph = a.querySelector('.ph'), c = a.querySelector('.cs123-card');
    return { nome: ph && ph.textContent, antes: !!(ph && c && (ph.compareDocumentPosition(c) & 4)), k: c.querySelector('.cs123-k').textContent, t: c.querySelector('.cs123-t').textContent, l: !!c.querySelector('.cs123-l'), img: !!c.querySelector('.cs123-capa img'), x: c.querySelector('.cs123-x')?.textContent || '', min: c.querySelector('.cs123-min').textContent, lb: c.querySelector('.cs123-lb').textContent, serif: getComputedStyle(c.querySelector('.cs123-t')).fontFamily, car: !!a.querySelector(':scope>.car') } }, cid);
  ok(/Bia Souza/.test(card.nome) && card.antes, 'Feed: o nome primeiro, depois o cartão da coluna', card);
  ok(/coluna/i.test(card.k) && /menos radical/.test(card.t) && card.l && card.img && /Newsreader/.test(card.serif), 'Feed: chapéu COLUNA, título em serifa, linha fina e capa', card);
  ok(/^A reforma tributária entrou na reta final/.test(card.x) && card.x.length <= 241 && /\d+ min de leitura/.test(card.min) && /Ler a coluna/.test(card.lb) && !card.car, 'Feed: uma ou duas frases, tempo de leitura e "Ler a coluna ›"', card);
  ok(await ev(D, id => /seguidores/.test(document.querySelector(`#posts [id="p-u:${id}"] .ph-sub`)?.textContent || ''), cid), 'Feed: marca "· seguidores" no cabeçalho');
  await ev(D, id => { const el = document.getElementById('p-u:' + id); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60) }, cid); await sleep(400);
  await semToast(D); await D.screenshot({ path: path.join(QA, 'col-4-coluna-no-feed.png') });
  const y0 = await ev(D, id => Math.round(document.getElementById('p-u:' + id).getBoundingClientRect().top), cid);

  /* ---------- 5. ler, curtir, comentar e voltar ---------- */
  await clk0(D, `#posts [id="p-u:${cid}"] .cs123-lb`);
  ok(await esperar(D, () => !!document.querySelector('#layer > .cs123-ler h1')), 'Ler a coluna: abre a página de leitura');
  const ler = await ev(D, () => { const r = $('#layer .cs123-ler'); return { h1: r.querySelector('h1').textContent, by: r.querySelector('.cs123-by').textContent, h2: r.querySelectorAll('.cs123-corpo h2').length, q: r.querySelector('.cs123-corpo blockquote')?.textContent, b: r.querySelector('.cs123-corpo strong')?.textContent, a: r.querySelector('.cs123-corpo a.cs123-a')?.getAttribute('href'), dom: r.querySelector('.cs123-dom')?.textContent, em: r.querySelector('.cs123-corpo em')?.textContent, fig: !!r.querySelector('.cs123-fig img'), ht: [...r.querySelectorAll('.cs123-ht')].map(x => x.textContent).join(' '), font: getComputedStyle(r.querySelector('.cs123-corpo p')).fontFamily, raw: /##|\*\*|\]\(/.test(r.querySelector('.cs123-corpo').textContent) } });
  ok(/menos radical/.test(ler.h1) && /Bia Souza/.test(ler.by) && /de \w+ de 20\d\d · \d+ min de leitura/.test(ler.by) && ler.fig, 'leitura: título, assinatura com avatar, data e tempo, capa', ler);
  ok(ler.h2 === 2 && /ninguém vê/.test(ler.q || '') && ler.b === 'transparência' && ler.em === 'Ipea' && !ler.raw, 'leitura: intertítulos, citação, negrito e itálico (sem marcação crua)', ler);
  ok(ler.a === 'https://www.camara.leg.br/reforma' && /camara\.leg\.br/.test(ler.dom || ''), 'leitura: link com o domínio ao lado', ler);
  ok(/#ReformaTributária/.test(ler.ht) && /Newsreader/.test(ler.font), 'leitura: hashtags no fim e texto em serifa', ler);
  await semToast(D); await D.screenshot({ path: path.join(QA, 'col-5-leitura-topo.png') });
  await ev(D, () => { const s = $('#layer .cs123-sc'); s.scrollTop = (s.scrollHeight - s.clientHeight) * .5; s.dispatchEvent(new Event('scroll')) }); await sleep(300);
  const pg = await ev(D, () => parseFloat(document.querySelector('#layer .cs123-pg b').style.width));
  ok(pg > 30 && pg < 70, 'leitura: barra de progresso acompanha a rolagem', pg);
  await semToast(D); await D.screenshot({ path: path.join(QA, 'col-6-leitura-meio.png') });
  await ev(D, () => { const s = $('#layer .cs123-sc'); s.scrollTop = s.scrollHeight }); await sleep(200);
  await clk0(D, '#layer .cs123-fim [data-a="like"]'); await sleep(900);
  ok(+(await H.sql(`select count(*) n from pub_reacoes where pub=$1 and uid=$2 and tipo='curtida'`, [cid, d]))[0].n === 1, 'leitura: Gostei no fim grava a curtida do post');
  ok(await esperar(D, () => document.querySelector('#layer .cs123-fim [data-a="like"]')?.classList.contains('on')), 'leitura: Gostei marcado');
  await clk0(D, '#layer .cs123-fim .addc'); await sleep(400);
  ok(await esperar(D, () => !!document.querySelector('#layer2 #ctext') && !!document.querySelector('#layer > .cs123-ler')), 'comentar: abre por cima da coluna');
  await D.fill('#ctext', 'Ótima explicação sobre a transição'); await clk0(D, '#cform .sendc'); await sleep(1000);
  ok(+(await H.sql(`select count(*) n from pub_reacoes where pub=$1 and uid=$2 and tipo='comentario'`, [cid, d]))[0].n === 1, 'comentar: comentário gravado no post');
  await ev(D, () => history.back()); await sleep(500);
  ok(await esperar(D, () => !$('#layer2')?.innerHTML && !!document.querySelector('#layer > .cs123-ler') && /Ótima explicação/.test(document.querySelector('#layer .cs123-fim').textContent)), 'comentar: voltar fecha só a folha e o comentário aparece no fim da coluna');
  await semToast(D); await D.screenshot({ path: path.join(QA, 'col-7-leitura-fim.png') });
  await clk0(D, '#layer [data-cs123fecha]'); await sleep(600);
  ok(await esperar(D, () => !$('#layer').innerHTML), 'Voltar: fecha a coluna');
  { const y1 = await ev(D, id => Math.round(document.getElementById('p-u:' + id).getBoundingClientRect().top), cid); ok(Math.abs(y1 - y0) < 40, 'Voltar: o Feed continua onde estava (a coluna no mesmo lugar da tela)', [y0, y1]) }
  // da grade do perfil: voltar leva ao perfil
  await ev(D, u => abrirPerfil(u), b); await sleep(700);
  await ev(D, id => { const c = document.querySelector(`#layer .pfv [id^="p-u:${id}"] .cs123-lb`); c.scrollIntoView({ block: 'center' }); c.click() }, cid); await sleep(500);
  ok(await esperar(D, () => !!document.querySelector('#layer > .cs123-ler') && !document.querySelector('#layer .pfv')), 'perfil › coluna: abre a leitura');
  await ev(D, () => history.back()); await sleep(600);
  ok(await esperar(D, u => !!document.querySelector('#layer .pfv') && PFV && PFV.u === u, b), 'perfil › coluna › voltar: volta ao perfil da Bia');
  await ev(D, () => history.back()); await sleep(500); ok(await ev(D, () => !$('#layer').innerHTML), 'e voltar de novo fecha o perfil');

  /* ---------- 6. Bia: Atividade e seguidores ---------- */
  await ev(B, () => cs123Carregar()); await sleep(400); await ev(B, () => { AT.t = 0; return atCarregar() }); await ev(B, () => abrirAtividade()); await sleep(700);
  const atx = await ev(B, () => document.querySelector('#layer .pfv-at')?.textContent || '');
  ok(/Dani Lima começou a seguir você/.test(atx), 'Atividade: "Dani começou a seguir você"', atx.slice(0, 200));
  await fecha(B); await ev(B, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(500);
  ok(await esperar(B, () => /1\s*seguidor(?!e)/.test(document.querySelector('#v-me .cs123-num')?.textContent || '')), 'perfil da Bia: 1 seguidor');
  await clk(B, '#v-me [data-cs123lista="seguidores"]');
  ok(await esperar(B, () => /Dani Lima/.test(document.querySelector('#cs123-lb')?.textContent || '') && !!document.querySelector('#cs123-lb [data-cs123tira]')), 'lista de seguidores com o nome e "Remover"');
  await fecha(B);

  /* ---------- 7. post comum para seguidores (seletor de público) ---------- */
  await ev(B, () => { go('feed'); criarAbrir('post') }); await sleep(400); await clk(B, '#layer [data-edsotexto]'); await sleep(400);
  await ev(B, () => { const t = $('#ce-leg') || $('#layer textarea'); t.value = 'Alguém mais viu o debate de ontem?'; t.dispatchEvent(new Event('input', { bubbles: true })) }); await sleep(200);
  ok(await esperar(B, () => !!document.querySelector('#layer [data-cfppub]')), 'post: linha "Público"');
  await clk(B, '#layer [data-cfppub]'); await sleep(300);
  ok(await ev(B, () => !!document.querySelector('#layer .ce-sel [data-cfppubv="seguidores"]') && !!document.querySelector('#layer .ce-sel [data-cfppubv="proximos"]')), 'seletor de público: Amigos, Seguidores e amigos e Melhores amigos');
  await clk(B, '#layer .ce-sel [data-cfppubv="seguidores"]'); await sleep(300);
  await clk(B, '#layer [data-cfppub]'); await sleep(300); await semToast(B); await B.screenshot({ path: path.join(QA, 'col-8-seletor-de-publico.png') });
  await clk(B, '#layer .ce-sel [data-edselx]'); await sleep(200);
  ok(await ev(B, () => /Seguidores e amigos/.test(document.querySelector('#layer [data-cfppub] em')?.textContent || '')), 'seletor: a linha mostra "Seguidores e amigos"');
  await clk(B, '#layer [data-edpubpo]'); await sleep(1500);
  const p2 = (await H.sql(`select id, publico from publicacoes where autor=$1 and texto like 'Alguém mais%'`, [b]))[0];
  ok(p2 && p2.publico === 'seguidores', 'post comum publicado para seguidores', p2);
  await ev(D, () => { PUB.sig = ''; return pubCarregar() }); await sleep(400);
  ok(await ev(D, id => pubVisiveis().some(x => x.id === id), p2 && p2.id), 'Dani vê o post para seguidores no Feed');

  /* ---------- 8. escuro e 360 px ---------- */
  const Dk = await abrir(d, 'd@x', 'Dk', { dark: true });
  await ev(Dk, id => { go('feed'); FILTRO = 'tudo'; renderPosts(); garantirPost('u:' + id); const el = document.getElementById('p-u:' + id); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60) }, cid); await sleep(600);
  await semToast(Dk); await Dk.screenshot({ path: path.join(QA, 'col-9-feed-escuro.png') });
  await ev(Dk, id => cs123Abrir(id), cid); await sleep(500);
  ok(await ev(Dk, () => { const bg = getComputedStyle($('#layer .cs123-ler')).backgroundColor, c = getComputedStyle($('#layer .cs123-ler h1')).color; return bg !== 'rgb(255, 255, 255)' && bg !== 'rgb(243, 244, 246)' && c !== 'rgb(20, 33, 58)' }), 'escuro: fundo e texto da coluna no tema escuro');
  await semToast(Dk); await Dk.screenshot({ path: path.join(QA, 'col-10-leitura-escuro.png') });
  await Dk.close();
  const D3 = await abrir(d, 'd@x', 'D3', { viewport: { width: 360, height: 760 } });
  await ev(D3, id => { go('feed'); FILTRO = 'tudo'; renderPosts(); garantirPost('u:' + id); const el = document.getElementById('p-u:' + id); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60) }, cid); await sleep(500);
  const larg = await ev(D3, id => { const a = document.getElementById('p-u:' + id), r = a.querySelector('.cs123-r'), lb = a.querySelector('.cs123-lb'); return { doc: document.scrollingElement.scrollWidth, lbR: lb.getBoundingClientRect().right, lbW: lb.scrollWidth - lb.clientWidth } }, cid);
  ok(larg.doc <= 360 && larg.lbR <= 360 && larg.lbW <= 1, '360 px: o cartão cabe (sem rolagem para o lado)', larg);
  await semToast(D3); await D3.screenshot({ path: path.join(QA, 'col-11-feed-360.png') });
  await ev(D3, id => cs123Abrir(id), cid); await sleep(400);
  ok(await ev(D3, () => { const s = $('#layer .cs123-sc'); return s.scrollWidth <= s.clientWidth + 1 }), '360 px: a página de leitura cabe');
  await D3.close();

  /* ---------- 9. deixar de seguir ---------- */
  await ev(D, u => abrirPerfil(u), b); await sleep(600);
  await clk(D, `#layer .pfv [data-cs123seg="${b}"]`); await sleep(300);
  ok(await esperar(D, () => !!document.querySelector('#layer2 [data-cs123deixa]')), 'Seguindo › "Deixar de seguir"');
  await clk(D, '#layer2 [data-cs123deixa]'); await sleep(900);
  ok((await H.sql(`select count(*) n from seguidores where seguidor=$1`, [d]))[0].n == 0, 'deixar de seguir: sai do banco');
  ok(await ev(D, id => !pubVisiveis().some(x => x.id === id), cid), 'deixar de seguir: a coluna sai do Feed da Dani');
  await fecha(D);

  ok(!B._erros.length && !D._erros.length, 'sem erros na página', B._erros.concat(D._erros).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_v9_app: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
