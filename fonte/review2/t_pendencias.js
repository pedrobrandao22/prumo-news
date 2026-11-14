// Pendências do QA de 02/11: histórico longo nas Conversas, redesenho incremental, citação apagada, envio de post,
// denúncia do administrador, Atividade com pedido aceito, aviso sobre folha, comentário que cresce, opção da pergunta,
// "Aa" e voltar, visitante e Guardar, "Atualizado às", Dólar com data, cobertura numa linha, Em 5 min sem "1 de 5", stories.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8950, BASE = `http://localhost:${PORTA}/index.html`;
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../qa/s/'; require('fs').mkdirSync(SH, { recursive: true });
const foto = (p, n) => p.screenshot({ path: SH + n + '.png' });
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
async function convite(A) { await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); await sleep(200); return l }
async function toque(p, sel) { const h = await p.$(sel); await h.scrollIntoViewIfNeeded(); const b = await h.boundingBox(); await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2) }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B'), C = U.erros(await H.pagina(b), 'C');
  for (const p of [A, B, C]) await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-semreels', '1') } catch (e) { } });
  await criar(A, { nome: 'Pedro', email: 'a@x.com' }); const uidA = await ev(A, () => S.uid);
  await H.sql(`update membros set papel='admin' where uid=$1`, [uidA]);
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  await criar(C, { url: await convite(A), nome: 'Carla Lima', email: 'c@x.com' }); const uidC = await ev(C, () => S.uid);
  await esperar(A, ([b, c]) => S.amigos.has(b) && S.amigos.has(c), [uidB, uidC]);

  // ===== F25: Carla pede amizade à Bia (sem nunca ter aberto a Atividade); Bia aceita; Carla vê na Atividade
  await ev(C, u => pedirAmizade(u), uidB); await sleep(1500);
  await esperar(B, u => (S.pedidosIn || []).includes(u), uidC, 6000);
  await ev(B, u => responderAmizade(u, true), uidC); await sleep(2000);
  await esperar(C, u => S.amigos.has(u), uidB, 6000); await sleep(400);
  ok(await ev(C, () => atItens().some(x => /Você e <b>Bia Souza<\/b> agora são amigos/.test(x.txt))), 'F25: quem pediu vê na Atividade que o pedido foi aceito');
  await ev(C, () => abrirAtividade()); await sleep(900); await foto(C, 'f25-C-atividade');
  ok(await ev(C, () => /agora são amigos/.test(document.querySelector('#layer .pfv-at')?.textContent || '')), 'F25: aparece na tela da Atividade');
  await ev(C, () => closeLayer()); await sleep(300);

  // ===== C21: conversa com mais de 300 mensagens de cada lado
  const t0 = Date.now() - 2 * 864e5;
  await H.sql(`alter table mensagens disable trigger msg_normaliza`);
  await H.sql(`insert into mensagens(de,para,at,texto,lida) select $1::uuid,$2::uuid,$3::bigint+g*60000,'Pedro '||g,true from generate_series(1,350) g`, [uidA, uidB, t0]);
  await H.sql(`insert into mensagens(de,para,at,texto,lida) select $2::uuid,$1::uuid,$3::bigint+g*60000+30000,'Bia '||g,true from generate_series(1,350) g`, [uidA, uidB, t0]);
  const idB10 = (await H.sql(`select id from mensagens where texto='Bia 10'`))[0].id;
  await H.sql(`insert into mensagens(de,para,at,texto,tipo,snap,lida) values ($1,$2,$3,'Lembra disso?','resposta',$4,true)`, [uidA, uidB, t0 + 351 * 60000, JSON.stringify({ q: { id: idB10, de: uidB, t: 'Bia 10' } })]);
  await H.sql(`alter table mensagens enable trigger msg_normaliza`);
  await B.reload(); await esperar(B, () => S.membro && S.amigosOk && S.msgsIn.length >= 300, null, 10000); await sleep(800);
  await ev(B, u => { go('msgs'); abrirConversa(u) }, uidA); await sleep(1200);
  const n0 = await ev(B, () => document.querySelectorAll('#v-msgs .dm-m').length);
  await ev(B, () => [...document.querySelectorAll('#v-msgs .dm-m div.dm-q')].pop().click()); await sleep(300);
  ok(/A original é mais antiga/.test(await ev(B, () => document.querySelector('.toast')?.textContent || '')), 'C24: citação de mensagem ainda não carregada não diz que foi apagada');
  await ev(B, () => document.querySelectorAll('.toast').forEach(t => t.remove()));
  ok(n0 === 600 && await ev(B, () => !!document.querySelector('[data-dm106mais]')), 'C21: 600 mensagens na tela e o botão "Carregar mensagens antigas"', n0);
  await ev(B, () => scrollTo(0, 0)); await sleep(300); await foto(B, 'c21-B-topo-antes');
  const ref = await ev(B, () => { const m = document.querySelector('#v-msgs .dm-m'); return { id: m.dataset.mid, y: m.getBoundingClientRect().top } });
  await toque(B, '[data-dm106mais]'); await sleep(1500);
  const n1 = await ev(B, () => document.querySelectorAll('#v-msgs .dm-m').length);
  const y1 = await ev(B, id => document.querySelector(`#v-msgs [data-mid="${id}"]`).getBoundingClientRect().top, ref.id);
  ok(n1 === 701, 'C21: carregou as 100 mais antigas (701 no total)', n1);
  ok(Math.abs(y1 - ref.y) < 3, 'C21: a tela fica no mesmo lugar depois de carregar', [ref.y, y1]);
  ok(await ev(B, () => !document.querySelector('[data-dm106mais]') && /^Pedro 1$/.test(document.querySelector('#v-msgs .dm-m .bub')?.textContent || '')), 'C21: chegou ao começo: sem botão e a primeira mensagem é "Pedro 1"');
  await ev(B, () => scrollTo(0, 0)); await sleep(200); await foto(B, 'c21-B-topo-depois');
  await ev(B, () => [...document.querySelectorAll('#v-msgs .dm-m div.dm-q')].pop().click()); await sleep(900);
  ok(await ev(B, () => { const el = [...document.querySelectorAll('#v-msgs .dm-m')].find(m => m.textContent === 'Bia 10'); const r = el && el.getBoundingClientRect(); return !!r && r.top > 40 && r.bottom < innerHeight - 60 }), 'C21: depois de carregar, tocar na citação leva à original antiga');


  // ===== C22: mensagem nova não redesenha a conversa inteira
  await ev(B, () => { scrollTo(0, 1e6); document.querySelectorAll('#v-msgs .dm-m').forEach(m => m._velho = 1) });
  await ev(A, u => { go('msgs'); abrirConversa(u) }, uidB); await sleep(800);
  await A.fill('#mtext', 'Mensagem nova do Pedro'); await clk(A, '#mform .send'); await sleep(1800);
  const inc = await ev(B, () => { const ms = [...document.querySelectorAll('#v-msgs .dm-m')]; return { n: ms.length, velhos: ms.filter(m => m._velho).length, ult: ms[ms.length - 1].textContent } });
  ok(inc.n === 702 && inc.velhos >= 695 && /Mensagem nova do Pedro/.test(inc.ult), 'C22: só a mensagem nova (e a vizinha) entram; as outras continuam as mesmas', inc);
  await foto(B, 'c22-B-nova');

  // ===== C24: resposta a uma mensagem apagada (conversa curta: Pedro e Carla)
  await ev(A, u => { THREAD = null; abrirConversa(u) }, uidC); await sleep(600);
  await A.fill('#mtext', 'Texto que vou apagar'); await clk(A, '#mform .send'); await sleep(1500);
  await ev(C, u => { go('msgs'); abrirConversa(u) }, uidA); await sleep(1000);
  const mid = await ev(C, () => [...document.querySelectorAll('.dm-m.theirs')].pop().dataset.mid);
  await ev(C, id => dmResponder(id), mid); await sleep(300); await C.fill('#mtext', 'Respondi isso'); await clk(C, '#mform .send'); await sleep(1500);
  await ev(A, id => dmApagar(id), mid); await sleep(1200);
  await C.reload(); await esperar(C, () => S.membro && S.amigosOk, null, 8000); await sleep(800);
  await ev(C, u => { go('msgs'); abrirConversa(u) }, uidA); await sleep(1000);
  const q = await ev(C, () => document.querySelector('.dm-m .dm-q')?.textContent || '');
  ok(/Mensagem apagada/.test(q) && !/Texto que vou apagar/.test(q), 'C24: citação de mensagem apagada diz "Mensagem apagada"', q);
  await foto(C, 'c24-C-citacao-apagada');
  await ev(C, () => { THREAD = null; go('feed') }); await sleep(300);

  // ===== C23/F24: Bia envia o post do Pedro: Pedro não aparece na lista; "Enviar para 2"; aviso com nomes
  const nD = 'Dani Reis';
  const D = U.erros(await H.pagina(b), 'D'); await criar(D, { url: await convite(B), nome: nD, email: 'd@x.com' }); const uidD = await ev(D, () => S.uid);
  await esperar(B, u => S.amigos.has(u), uidD, 6000);
  await ev(A, async () => { await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Post do Pedro sobre a PEC', fotos: [], estilo: { v: 2 } }); await pubCarregar() }); await sleep(800);
  await ev(B, () => pubCarregar()); await sleep(1500);
  const pubId = await ev(B, a => (PUB.itens || []).find(x => x.autor === a && x.tipo === 'post').id, uidA);
  await ev(B, id => { go('feed'); pubEnviar(pubDe(id)) }, pubId); await sleep(500);
  const lista = await ev(B, () => [...document.querySelectorAll('#pick [data-pick]')].map(x => x.textContent.trim()));
  ok(lista.length === 2 && !lista.some(n => /Pedro/.test(n)), 'C23/F24: o autor do post não aparece entre os destinatários', lista);
  await ev(B, () => document.querySelectorAll('#pick [data-pick]').forEach(x => x.click())); await sleep(200);
  ok(await ev(B, () => document.querySelector('#sbtn').textContent === 'Enviar para 2'), 'C23: botão diz "Enviar para 2"');
  await foto(B, 'c23-B-enviar-post');
  await clk(B, '#sbtn'); await sleep(400);
  const tst = await ev(B, () => document.querySelector('.toast')?.textContent || '');
  ok(/^Enviado para (Carla Lima e Dani Reis|Dani Reis e Carla Lima)$/.test(tst), 'C23: aviso diz para quem foi', tst);
  await sleep(2600);
  // Pedro enviando o próprio post: dica certa
  await ev(A, id => { THREAD = null; go('feed'); pubEnviar(pubDe(id)) }, pubId); await sleep(500);
  ok(await ev(A, () => /^Seus amigos conseguem abrir o post\.$/.test(document.querySelector('.sheet .hint')?.textContent || '')), 'F24: o autor enviando o próprio post vê "Seus amigos conseguem abrir o post."');
  await ev(A, () => closeLayer()); await sleep(300);

  // ===== F23: denúncia feita pelo administrador
  await ev(A, u => abrirDenuncia('pessoa', u), uidB); await sleep(400);
  const dA = await ev(A, () => document.querySelector('.sheet p')?.textContent || '');
  ok(/fica na sua lista de denúncias, na Administração/.test(dA) && !/vai para o Pedro/.test(dA), 'F23: administrador não lê "vai para o Pedro"', dA);
  await foto(A, 'f23-A-denunciar'); await ev(A, () => closeLayer()); await sleep(300);
  await ev(B, u => abrirDenuncia('pessoa', u), uidD); await sleep(400);
  ok(/vai para o Pedro, que analisa/.test(await ev(B, () => document.querySelector('.sheet p')?.textContent || '')), 'F23: os outros continuam lendo "vai para o Pedro"');
  await ev(B, () => closeLayer()); await sleep(300);

  // ===== F27: aviso que já estava na tela some quando uma folha abre
  await ev(B, () => toast('Seus amigos votam e veem o resultado')); await sleep(700);
  await ev(B, u => abrirDenuncia('pessoa', u), uidD); await sleep(300);
  ok(await ev(B, () => !document.querySelector('.toast')), 'F27: o aviso não fica por cima da folha');
  await ev(B, () => closeLayer()); await sleep(300);

  // ===== F21: comentário que cresce (360 px)
  await B.setViewportSize({ width: 360, height: 740 });
  const pid0 = await ev(B, () => FEED.pautas[0].id);
  await ev(B, p => openComments(p), pid0); await sleep(500);
  ok(await ev(B, () => document.querySelector('#ctext')?.tagName === 'TEXTAREA'), 'F21: campo de comentário é uma caixa de várias linhas');
  const h0 = await ev(B, () => document.querySelector('#ctext').getBoundingClientRect().height);
  await B.click('#ctext'); await B.keyboard.type('Comentário comprido para ver se a caixa cresce junto com o texto enquanto a pessoa digita no celular');
  await sleep(200); const h1 = await ev(B, () => document.querySelector('#ctext').getBoundingClientRect().height);
  ok(h1 > h0 + 15, 'F21: a caixa cresce com o texto', [h0, h1]);
  await foto(B, 'f21-B360-comentario');
  await B.keyboard.press('Enter'); await sleep(1500);
  ok(await ev(B, () => document.querySelector('#ctext').value === '' && /Comentário comprido/.test(document.querySelector('#cbox').textContent)), 'F21: Enter publica, como antes');
  const h2 = await ev(B, () => document.querySelector('#ctext').getBoundingClientRect().height);
  ok(Math.abs(h2 - h0) < 3, 'F21: depois de publicar a caixa volta ao tamanho de uma linha', [h0, h2]);
  await ev(B, () => closeLayer()); await sleep(300); await B.setViewportSize({ width: 390, height: 844 });

  // ===== F20: opção da pergunta mostra quantas letras faltam
  await ev(B, () => cn102AbreInicio('enq')); await sleep(800);
  const temOp = await ev(B, () => !!document.querySelector('[data-cn102o="0"]'));
  if (temOp) {
    await B.click('[data-cn102o="0"]'); await B.keyboard.type('Sim, ajuda as empresas a contratar mais');
    await sleep(200);
    ok(await ev(B, () => document.querySelector('[data-cn102o="0"]').closest('.cn102-op').dataset.falta === '1'), 'F20: perto do limite mostra quantas letras faltam', await ev(B, () => document.querySelector('[data-cn102o="0"]').closest('.cn102-op').dataset.falta));
    await B.keyboard.type('xyz'); await sleep(100);
    ok(await ev(B, () => document.querySelector('[data-cn102o="0"]').closest('.cn102-op').dataset.falta === '0'), 'F20: no limite mostra "máx."');
    await foto(B, 'f20-B-opcao');
  } else ok(false, 'F20: editor da pergunta abriu');
  await ev(B, () => { closeLayer._ok = 1; while ($('#layer').innerHTML) { closeLayer(); if ($('#layer .ce')) { ED = null; $('#layer').innerHTML = '' } } }); await sleep(400);

  // ===== L18: "Aa" e voltar
  const pidM = await ev(A, () => FEED.pautas.find(p => p.neutro).id);
  await ev(A, p => { go('capa'); abrirMateria(p) }, pidM); await sleep(900);
  await clk(A, '#layer [data-mataa]'); await sleep(300); await foto(A, 'l18-A-aa-aberto');
  await ev(A, () => history.back()); await sleep(700);
  ok(await ev(A, () => !!document.querySelector('#layer .mat') && !document.querySelector('#layer .mat-aap')), 'L18: voltar com o "Aa" aberto fecha só o menu');
  await foto(A, 'l18-A-depois-voltar');
  // L20: "Atualizado às" na matéria
  const meta = await ev(A, () => document.querySelector('#layer .mat-meta')?.textContent || '');
  ok(!/Atualizado há/.test(meta), 'L20: a matéria usa o mesmo "Atualizado às…" da Capa', meta);
  await ev(A, () => history.back()); await sleep(800);
  ok(await ev(A, () => !document.querySelector('#layer .mat')), 'L18: o segundo voltar fecha a matéria');

  // ===== L22: Dólar de hoje com data embaixo
  ok(await ev(A, () => /<small class="ind-d">hoje(, \d{1,2}h\d{2})?<\/small>/.test(indTile({ id: 'dolar', nome: 'Dólar', valor: 'R$ 5,44', data: hojeSP() }))), 'L22: indicador de hoje mostra "hoje" como os outros mostram a data');

  // ===== L24: "Seguir cobertura" numa linha
  const pidCob = await ev(A, () => (FEED.pautas.find(p => temaDe(p)) || {}).id);
  await ev(A, p => abrirPagCob(p), pidCob); await sleep(600);
  const bt = await ev(A, () => { const b = document.querySelector('[data-cobseg]'); return b ? { h: b.getBoundingClientRect().height, t: b.textContent } : null });
  ok(bt && bt.h < 50 && bt.t === 'Seguir cobertura', 'L24: botão de seguir numa linha só', bt);
  await foto(A, 'l24-A-cobertura'); await ev(A, () => closeLayer()); await sleep(300);

  // ===== P03: Em 5 min sem "1 de 5"
  await ev(A, () => { go('feed'); openSecStory('_5min') }); await sleep(900);
  const cab = await ev(A, () => document.querySelector('#layer .story .s-h')?.textContent || '');
  ok(/Em 5 min/.test(cab) && !/\d+ de \d+/.test(cab), 'P03: o cabeçalho do Em 5 min não mostra mais "1 de 5"', cab);
  await foto(A, 'p03-A-5min');
  await ev(A, () => closeLayer()); await sleep(400);

  // ===== L19: visitante toca em Guardar
  const V = U.erros(await H.pagina(b), 'V'); await V.goto(BASE); await esperar(V, () => !!FEED, null, 8000); await sleep(800);
  await ev(V, p => abrirMateria(p), pidM); await sleep(800);
  await clk(V, '#layer [data-matsalvar]'); await sleep(500);
  const vis = await ev(V, () => document.querySelector('.sheet .pc106')?.textContent || '');
  ok(/Para guardar notícias e ler depois, entre na sua conta\./.test(vis), 'L19: tela de entrar explica por que apareceu', vis);
  await foto(V, 'l19-V-guardar');
  await clk(V, '[data-laba="criar"]'); await sleep(300);
  ok(await ev(V, () => !!document.querySelector('.sheet .pc106')), 'L19: a explicação continua ao trocar para "Criar conta"');
  await V.close();

  // ===== P05/P01: "Adicione o seu" no story da amiga
  await ev(B, async () => { await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', texto: '', fotos: [], estilo: { v: 2, fundo: 2, itens: [{ t: 'add', q: 'Mostre seu café', x: .5, y: .5, s: 1, r: 0 }] } }); await pubCarregar() }); await sleep(800);
  await ev(A, () => { go('feed'); pubCarregar() }); await sleep(1500);
  const sid = await ev(A, u => (pubStoriesDe(u)[0] || {}).id, uidB);
  await ev(A, ([u, id]) => igAbrirUser(u, id), [uidB, sid]); await sleep(1300);
  await foto(A, 'p05-A-story-add');
  const c0 = await A.$('#layer .fg-add small'); if (c0) { const bb = await c0.boundingBox(); await A.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2) } await sleep(1000);
  ok(await ev(A, () => !!ED && ED.st.els.some(e => e.t === 'add')), 'P05: tocar no corpo do cartão "Adicione o seu" abre a câmera para participar');
  await foto(A, 'p01-A-camera');
  await ev(A, () => history.back()); await sleep(900);
  if (await ev(A, () => !!document.querySelector('#layer .ce'))) { await ev(A, () => history.back()); await sleep(900) }
  const volta = await ev(A, () => ({ story: !!document.querySelector('#layer .story'), ce: !!document.querySelector('#layer .ce'), sheet: document.querySelector('.sheet')?.textContent?.slice(0, 80) || '' }));
  if (!volta.story && volta.sheet) { await ev(A, () => { const b = [...document.querySelectorAll('.sheet button')].find(x => /Descartar|Sair|Apagar/.test(x.textContent)); b && b.click() }); await sleep(900) }
  ok(await ev(A, () => !!document.querySelector('#layer .story') && !document.querySelector('#layer .ce')), 'P01: fechar a câmera sem publicar volta para o story da amiga', volta);
  await foto(A, 'p01-A-voltou-story');

  // ===== P02: tocar no ✕ durante a troca de grupo fecha
  await ev(A, () => { closeLayer(); }); await sleep(500);
  await ev(A, () => { try { localStorage.setItem('prumo-teste-anim', '1') } catch (e) { } });
  await A.reload(); await esperar(A, () => S.membro && S.amigosOk && !!FEED, null, 8000); await sleep(800);
  await ev(A, () => { go('feed'); openSecStory('_5min') }); await sleep(1200);
  const px = await ev(A, () => { const r = document.querySelector('#layer .story .s-h [data-close]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] });
  await ev(A, () => storySec(1)); await sleep(60);
  const vir = await ev(A, () => VIRANDO && !!document.querySelector('#layer .story.sg-cubo'));
  await A.touchscreen.tap(px[0], px[1]); await sleep(900);
  ok(vir, 'P02: troca de grupo (cubo) em andamento ao tocar no ✕', vir);
  ok(await ev(A, () => !document.querySelector('#layer .story')), 'P02: tocar no ✕ durante a troca de grupo fecha o story');
  await ev(A, () => { try { localStorage.removeItem('prumo-teste-anim') } catch (e) { } });

  ok(!A._erros.length && !B._erros.length && !C._erros.length && !D._erros.length, 'sem erros ' + A._erros.concat(B._erros, C._erros, D._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_pendencias: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
