// Etapa 54: publicações (post e story) com 2 usuários pelo harness
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8768/index.html'; const FOTO = __dirname + '/etapa13/foto.jpg';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8768); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await sleep(1200);
  ok(await ev(A, () => !document.getElementById('b-criar').hidden && !!document.querySelector('#secs [data-meustory]')), 'com o banco pronto: botão + no topo e círculo Seu story');
  await A.screenshot({ path: __dirname + '/../review3/var/pub-topo.png', clip: { x: 0, y: 0, width: 390, height: 260 } });
  // post no estilo Instagram: fotos → filtros → detalhes
  await clk(A, '#b-criar'); await sleep(400); ok(await ev(A, () => !!document.querySelector('#layer .ce.ce-post .ce-big')), '+ abre direto o criador (POST)');
  await A.setInputFiles('#ce-pfile', [FOTO, FOTO]); await esperar(A, () => document.querySelectorAll('#layer .ce-tb img').length === 2, null, 5000);
  { const r = await ev(A, () => { const b = document.querySelector('#ce-pv').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }); await A.mouse.move(r.x, r.y); await A.mouse.down(); await A.mouse.move(r.x + 40, r.y + 30, { steps: 5 }); await A.mouse.up() }
  ok(await ev(A, () => { const f = ED.po.fotos[ED.po.cur]; return f.ox !== 0 || f.oy !== 0 }), 'arrastar enquadra a foto');
  await clk(A, '[data-edar]'); await sleep(100); ok(await ev(A, () => ED.po.ar === '1:1'), 'troca o formato para 1:1');
  await A.screenshot({ path: __dirname + '/../review3/var/ce-post1.png' });
  await clk(A, '[data-edav]'); await sleep(300); await clk(A, '[data-edflt="juno"]'); await sleep(200); await A.screenshot({ path: __dirname + '/../review3/var/ce-post2.png' });
  await clk(A, '[data-edaba="editar"]'); await sleep(200); await ev(A, () => { const r = document.querySelector('[data-edaj2="b"]'); r.value = 20; r.dispatchEvent(new Event('input', { bubbles: true })) }); await sleep(100);
  ok(await ev(A, () => { const f = ED.po.fotos[ED.po.cur]; return f.f === 'juno' && f.aj.b === 20 }), 'filtro e ajuste aplicados');
  await clk(A, '[data-edav]'); await sleep(300); await A.fill('#ce-leg', 'Domingo de leitura com @Bia Souza'); await A.fill('#ce-local', 'Curitiba');
  await clk(A, '[data-edtags]'); await sleep(300); { const r = await ev(A, () => { const b = document.querySelector('#ce-tgb').getBoundingClientRect(); return { x: b.x + b.width * .4, y: b.y + b.height * .6 } }); await A.mouse.click(r.x, r.y) } await sleep(300); await clk(A, '[data-edtagu]'); await sleep(300);
  ok(await ev(A, () => ED.po.tags.length === 1 && !!document.querySelector('.ce-tg')), 'marcar a Bia tocando na foto'); await A.screenshot({ path: __dirname + '/../review3/var/ce-tags.png' }); await clk(A, '[data-edtagok]'); await sleep(200);
  await A.screenshot({ path: __dirname + '/../review3/var/ce-post3.png' });
  await clk(A, '[data-edpubpo]'); await sleep(1800);
  ok(await ev(A, () => PUB.itens.filter(x => x.tipo === 'post').length === 1 && PUB.itens[0].fotos.length === 2 && !!document.querySelector('#posts .upost .up-img')), 'post com 2 fotos publicado e no Feed');
  ok(await ev(A, () => { const p = document.querySelector('#posts .upost'); return /Curitiba/.test(p.textContent) && /com Bia/.test(p.textContent) }), 'Feed mostra local e "com Bia"');
  // post só texto com notícia
  await clk(A, '#b-criar'); await sleep(300); await clk(A, '[data-edsont]'); await sleep(300); await clk(A, '[data-edpnt]'); await sleep(300); await A.fill('#ce-leg', 'Essa é importante'); await clk(A, '[data-edpubpo]'); await sleep(1500);
  ok(await ev(A, () => PUB.itens.filter(x => x.tipo === 'post').length === 2 && !!PUB.itens[0].pid), 'post com notícia publicado');
  // Seu story: sem story, tocar no rosto cria
  await ev(A, () => scrollTo(0, 0)); await sleep(300); await clk(A, '#secs [data-meustory] .ig-r'); await sleep(500); ok(await ev(A, () => !!document.querySelector('#layer .ce.ce-story.t-cam')), 'rosto sem story abre a câmera do story');
  // modo Criar: fundo colorido e texto
  await clk(A, '[data-edcriar]'); await sleep(400); await A.fill('#ce-txa', 'Bom domingo!'); await clk(A, '[data-edtxf="neon"]'); await clk(A, '[data-edtxcor="#ff66c4"]'); await clk(A, '[data-edtxok]'); await sleep(200);
  // enquete
  await clk(A, '.ce-top [data-edfig]'); await sleep(200); await clk(A, '.ce-fig [data-edfig="enq"]'); await sleep(200); await A.fill('#ce-eq', 'Vai ler hoje?'); await clk(A, '[data-edenqok]'); await sleep(200);
  // menção + emoji
  await clk(A, '.ce-top [data-edfig]'); await sleep(200); await clk(A, '.ce-fig [data-edfig="men"]'); await sleep(200); await clk(A, '[data-edmensel]'); await sleep(200);
  await clk(A, '.ce-top [data-edfig]'); await sleep(200); await clk(A, '[data-edemo="☕"]'); await sleep(200);
  // caneta
  await clk(A, '[data-edcaneta]'); await sleep(200);
  { const r = await ev(A, () => { const b = document.querySelector('#ce-cv').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }); await A.mouse.move(r.x + r.w * .2, r.y + r.h * .8); await A.mouse.down(); await A.mouse.move(r.x + r.w * .7, r.y + r.h * .85, { steps: 8 }); await A.mouse.up() }
  await clk(A, '[data-edcnok]'); await sleep(200);
  // arrastar o texto
  { const r = await ev(A, () => { const e = [...document.querySelectorAll('#ce-els .ce-el')].find(x => x.querySelector('.ce-t')).getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height / 2 } }); await A.mouse.move(r.x, r.y); await A.mouse.down(); await A.mouse.move(r.x, r.y - 60, { steps: 5 }); await A.mouse.up() }
  ok(await ev(A, () => { const t = ED.st.els.find(e => e.t === 'texto'); return ED.st.els.length === 4 && t.y < .4 && ED.st.tracos.length === 1 }), 'story com texto, enquete, menção, emoji e desenho; texto arrastado');
  await A.screenshot({ path: __dirname + '/../review3/var/ce-story.png' });
  await clk(A, "[data-edpubst='amigos']"); await sleep(2000);
  ok(await ev(A, () => { const x = pubStoriesDe(S.uid)[0]; return x && x.estilo.v === 2 && x.fotos.length === 1 && x.estilo.itens.length === 2 }), 'story publicado como imagem com enquete e menção tocáveis');
  // B vê
  await ev(B, () => go('feed')); await sleep(500); await ev(B, () => pubCarregar()); await sleep(1500);
  ok(await ev(B, () => document.querySelectorAll('#posts .upost').length === 2 && !!document.querySelector('#secs [data-ustory]')), 'amiga vê os 2 posts no Feed e o story de Pedro na fileira');
  await ev(B, () => { const p = document.querySelector('#posts .upost'); p.scrollIntoView({ block: 'start' }) }); await sleep(800); await B.screenshot({ path: __dirname + '/../review3/var/pub-feedB.png' });
  await ev(B, () => scrollTo(0, 0)); await sleep(300); await B.screenshot({ path: __dirname + '/../review3/var/pub-rowB.png', clip: { x: 0, y: 0, width: 390, height: 260 } });
  await clk(B, '#secs [data-ustory]'); await sleep(1200); await B.screenshot({ path: __dirname + '/../review3/var/pub-storyB.png' });
  ok(await ev(B, () => !!document.querySelector('#layer .us2-img') && !!document.querySelector('#layer .us-enq')), 'amiga vê o story novo com a enquete');
  await B.click('#layer [data-usvoto][data-i="0"]'); await sleep(600); ok(await ev(B, () => !!document.querySelector('#layer .us-enq.res') && /100%/.test(document.querySelector('#layer .us-enq').textContent)), 'votar na enquete mostra o resultado');
  await B.screenshot({ path: __dirname + '/../review3/var/pub-storyB2.png' });
  await B.fill('#layer .us-rp input', 'Bom domingo pra você!'); await B.evaluate(() => document.querySelector('#layer .us-rp').requestSubmit()); await sleep(800);
  await clk(B, '#layer [data-uscurtir]'); await sleep(800);
  await ev(B, () => closeLayer()); await sleep(500);
  // A: visto por e DM
  await ev(A, () => igAbrirUser(S.uid)); await sleep(1500); ok(await ev(A, () => /Visto por 1/.test(document.querySelector('[data-usvistos] span')?.textContent || '')), 'Pedro vê "Visto por 1"'); await A.screenshot({ path: __dirname + '/../review3/var/pub-storyA.png' });
  await ev(A, () => closeLayer()); await sleep(300); await ev(A, () => go('msgs')); await sleep(800); ok(await ev(A, () => S.msgsIn.some(m => m.tipo === 'resp_story' && /Bom domingo pra você/.test(m.texto)) && S.msgsIn.some(m => m.tipo === 'curtiu_story')), 'resposta e curtida do story chegam como mensagem');
  // B recebeu menção
  await ev(B, () => go('msgs')); await sleep(800); ok(await ev(B, () => S.msgsIn.some(m => m.tipo === 'mencao' && /^u:/.test(m.pid))), '@ na legenda avisa a amiga por mensagem');
  ok(await ev(B, () => S.msgsIn.some(m => m.tipo === 'mencao' && m.snap && m.snap.story)), 'menção no story avisa a amiga');
  // A apaga post
  await ev(A, () => go('feed')); await sleep(500); const id = await ev(A, () => PUB.itens.find(x => x.tipo === 'post').id); await ev(A, i => pubApagar(i), id); await sleep(800); ok(await ev(A, () => PUB.itens.filter(x => x.tipo === 'post').length === 1), 'apagar post');
  await ev(A, () => scrollTo(0, 0)); await sleep(300); await clk(A, '#secs [data-meustory] .up-mais'); await sleep(500); ok(await ev(A, () => !!document.querySelector('#layer .ce.ce-story.t-cam')), 'o + do Seu story cria outro story'); await ev(A, () => closeLayer()); await sleep(300);
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa54: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
