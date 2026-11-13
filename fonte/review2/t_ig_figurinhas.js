// Criação no estilo Instagram: bandeja com busca, figurinhas editadas no próprio story, figurinha de foto, caneta nova
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8920/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../shots-ig2/'; require('fs').mkdirSync(SH, { recursive: true });
const foto = (p, n) => p.screenshot({ path: SH + n + '.png' });
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const bandeja = async p => { await clk(p, '.ce-top [data-edfig]'); await sleep(250) };
const chip = async (p, k) => { await bandeja(p); await clk(p, `.ce-fig [data-edfig="${k}"]`); await sleep(250) };
const toque = async (p, sel) => { const r = await ev(p, s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }, sel); await p.mouse.click(r.x, r.y); await sleep(300) };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8920); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await sleep(500);
  await ev(A, () => criarAbrir('story')); await sleep(400); await clk(A, '[data-edcriar]'); await sleep(300); await ev(A, () => edTextoOk()); await sleep(100);

  // 1. bandeja: busca, chips com ícone, Foto (os emojis saíram com o foco, 105)
  await bandeja(A); await foto(A, '01-bandeja');
  ok(await ev(A, () => { const ks = [...document.querySelectorAll('.ce-fig [data-edfig]')].map(b => b.dataset.edfig); return ['local', 'men', 'hora', 'foto', 'perg', 'enq', 'quiz', 'cont', 'link', 'nt'].every(k => ks.includes(k)) && !['slid', 'add', 'hash', 'selfie'].some(k => ks.includes(k)) && !document.querySelector('.ce-fig [data-edemo]') && document.querySelectorAll('.ce-fig .fg2-c svg').length === ks.length && !!document.querySelector('#ce-figq') }), 'bandeja: busca e chips com ícone (inclui Foto), sem emojis nem figurinhas de brincadeira');
  await A.fill('#ce-figq', 'votação'); await sleep(150);
  ok(await ev(A, () => { const v = [...document.querySelectorAll('.ce-fig [data-edfig]')].filter(b => !b.hidden).map(b => b.dataset.edfig); return v.join() === 'enq' }), 'busca "votação" acha só a Enquete');
  await A.fill('#ce-figq', 'zzzz'); await sleep(100); ok(await ev(A, () => !document.querySelector('#fg2-nada').hidden), 'busca sem resultado avisa');
  await ev(A, () => document.querySelector('.ce-fig').remove());

  // 2. enquete: digita no próprio adesivo, + adicionar, cor
  await chip(A, 'enq');
  ok(await ev(A, () => !!document.querySelector('.ce-fe .ce-enq #ce-eq') && document.activeElement.id === 'ce-eq' && !document.querySelector('.ce-sel') && document.querySelector('.ce').classList.contains('fe-on')), 'enquete abre direto no story, em edição, com o cursor na pergunta');
  await foto(A, '03-enquete-nova');
  await A.fill('#ce-eq', 'Onde vamos no domingo?'); await A.fill('#fe-o0', 'Praia'); await A.fill('#fe-o1', 'Serra'); await clk(A, '[data-feadd]'); await sleep(100);
  await A.fill('#fe-o2', 'Ficar em casa'); await clk(A, '[data-fecor]'); await clk(A, '[data-fecor]'); await sleep(100);
  ok(await ev(A, () => document.querySelector('.ce-fe .ce-enq').classList.contains('fgc-2') && document.querySelectorAll('.ce-fe .fe-eo').length === 3), '+ adicionar e troca de cor no adesivo');
  await foto(A, '04-enquete-editando');
  await clk(A, '[data-edfok]'); await sleep(200);
  ok(await ev(A, () => { const e = ED.st.els.find(x => x.t === 'enq'); return e && e.q === 'Onde vamos no domingo?' && e.o.join() === 'Praia,Serra,Ficar em casa' && e.cor === 2 && !document.querySelector('.ce-fe') && !!document.querySelector('#ce-els .ce-enq.fgc-2') }), 'Concluído: enquete com 3 opções e cor no story');

  // 3. quiz: opção nova aparece ao digitar; tocar na letra marca a certa
  await chip(A, 'quiz'); await A.fill('#fq', 'Capital do Paraná?'); await A.fill('#fo0', 'Londrina'); await A.fill('#fo1', 'Maringá');
  ok(await ev(A, () => !!document.querySelector('#fo2') && !document.querySelector('#fo3')), 'quiz: a opção C aparece ao preencher a B');
  await A.fill('#fo2', 'Curitiba'); await clk(A, '[data-fqc="2"]'); await sleep(100); await foto(A, '05-quiz');
  ok(await ev(A, () => document.querySelector('.fe-qo[data-i="2"]').classList.contains('certa')), 'quiz: letra tocada fica verde');
  await clk(A, '[data-edfok]'); await sleep(200);
  ok(await ev(A, () => { const e = ED.st.els.find(x => x.t === 'quiz'); return e && e.c === 2 && e.o.length === 3 }), 'quiz salvo com a resposta certa (C) e sem opção vazia');

  // 4. contagem
  await chip(A, 'cont'); await A.fill('#fq', 'Debate na TV');
  await ev(A, () => { const d = new Date(Date.now() + 3 * 864e5); const i = document.querySelector('#fd'); i.value = d.toISOString().slice(0, 10); i.dispatchEvent(new Event('change', { bubbles: true })) }); await sleep(150);
  ok(await ev(A, () => /^0[23]/.test(document.querySelector('.ce-fe .fg-cd b').textContent)), 'contagem: os números mudam com a data');
  await foto(A, '07-contagem'); await clk(A, '[data-edfok]'); await sleep(200);
  ok(await ev(A, () => ED.st.els.map(e => e.t).join() === 'enq,quiz,cont'), 'contagem no story');

  // 5. vazia é descartada; voltar do celular conclui
  await chip(A, 'perg'); await clk(A, '[data-edfok]'); await sleep(200);
  ok(await ev(A, () => ED.st.els.length === 4 && !document.querySelector('.ce-fe')), 'figurinha vazia é descartada');
  await chip(A, 'perg'); await A.fill('#fq', 'Qual notícia te chamou atenção?'); await ev(A, () => history.back()); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer .ce') && !document.querySelector('.ce-fe') && ED.st.els.some(e => e.t === 'perg')), 'voltar do celular conclui a figurinha e fica no editor');
  // espalha
  await ev(A, () => { const pos = { enq: [.5, .2, .9], quiz: [.5, .47, .8], slid: [.28, .74, .62], cont: [.73, .74, .6], perg: [.5, .92, .6] }; ED.st.els.forEach(e => { const p = pos[e.t]; if (p) { e.x = p[0]; e.y = p[1]; e.s = p[2] } }); edDesenha() }); await sleep(200);

  // 6. tocar numa figurinha volta a editar
  const eidEnq = await ev(A, () => ED.st.els.find(e => e.t === 'enq').id);
  await toque(A, `#ce-els [data-eid="${eidEnq}"] b`);
  ok(await ev(A, () => document.querySelector('#ce-eq')?.value === 'Onde vamos no domingo?' && document.querySelector('#fe-o2')?.value === 'Ficar em casa' && document.querySelector(`#ce-els .editando`)), 'tocar na enquete reabre a edição com o texto');
  await A.fill('#ce-eq', 'Domingo: onde?'); await clk(A, '[data-fedel="2"]'); await sleep(100); await clk(A, '[data-edfok]'); await sleep(200);
  ok(await ev(A, () => { const e = ED.st.els.find(x => x.t === 'enq'); return e.q === 'Domingo: onde?' && e.o.length === 2 && e.cor === 2 }), 'edição salva (pergunta nova, opção tirada, cor mantida)');

  // 7. figurinha de foto: escolhe na galeria, toque troca o formato, vai gravada na imagem
  const png = await ev(A, () => { const c = document.createElement('canvas'); c.width = 300; c.height = 200; const g = c.getContext('2d'); g.fillStyle = '#00c853'; g.fillRect(0, 0, 300, 200); g.fillStyle = '#fff'; g.font = 'bold 60px sans-serif'; g.fillText('oi', 120, 120); return c.toDataURL('image/png').split(',')[1] });
  await chip(A, 'foto'); await A.setInputFiles('#ce-figfoto', { name: 'f.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await esperar(A, () => ED.st.els.some(e => e.t === 'img' && e.ft && e._img), null, 5000);
  ok(await ev(A, () => { const e = ED.st.els.find(x => x.t === 'img'); return e.forma === 'rr' && Math.abs(e.ar - 1.5) < .01 && !!document.querySelector('#ce-els .fgi-rr img') }), 'Foto: entra como figurinha de cantos arredondados');
  await ev(A, () => { const e = ED.st.els.find(x => x.t === 'img'); e.x = .7; e.y = .35; e.s = .8; edEls() }); await sleep(150);
  const eidImg = await ev(A, () => ED.st.els.find(e => e.t === 'img').id);
  await toque(A, `#ce-els [data-eid="${eidImg}"]`); ok(await ev(A, () => ED.st.els.find(e => e.t === 'img').forma === 'circ' && !!document.querySelector('#ce-els .fgi-circ')), 'toque na foto: círculo');
  await sleep(400); await toque(A, `#ce-els [data-eid="${eidImg}"]`); ok(await ev(A, () => ED.st.els.find(e => e.t === 'img').forma === 'coracao' && /svg/.test(getComputedStyle(document.querySelector('#ce-els .fgi-coracao img')).webkitMaskImage || getComputedStyle(document.querySelector('#ce-els .fgi-coracao img')).maskImage)), 'toque de novo: coração');
  ok(await ev(A, async () => { const bl = await edExportaStory(ED.st); const im = await createImageBitmap(bl); const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const e = ED.st.els.find(x => x.t === 'img'); const d = g.getImageData(Math.round(e.x * 1080 - 60), Math.round(e.y * 1920 - 40), 1, 1).data; return d[1] > 150 && d[0] < 90 && d[2] < 140 }), 'a foto vai gravada na imagem exportada do story');
  // hora: toque troca para a data
  await bandeja(A); await clk(A, '.ce-fig [data-edfig="hora"]'); await sleep(200);
  await ev(A, () => { const e = ED.st.els.find(x => x.t === 'hora'); e.x = .25; e.y = .36; edEls() }); await sleep(100);
  const eidH = await ev(A, () => ED.st.els.find(e => e.t === 'hora').id); await toque(A, `#ce-els [data-eid="${eidH}"]`);
  ok(await ev(A, () => { const e = ED.st.els.find(x => x.t === 'hora'); return e.fmt === 1 && /[A-Z]{3}/.test(e.tx) }), 'toque na hora: vira a data');
  await foto(A, '08-editor-figurinhas');

  // 8. caneta: ícones, tamanho com prévia, segurar pinta o fundo, desfazer
  await clk(A, '[data-edcaneta]'); await sleep(250); await foto(A, '09-caneta');
  ok(await ev(A, () => document.querySelectorAll('.ce-cn [data-edcnt] svg').length === 4 && !!document.querySelector('#cn2-tam') && document.querySelectorAll('.ce-cn [data-edcncor]').length >= 8), 'caneta: 4 pincéis com ícone, espessura vertical e cores');
  await clk(A, '[data-edcnt="neon"]'); await clk(A, '[data-edcncor="#ff66c4"]');
  { const r = await ev(A, () => { const b = document.querySelector('#cn2-tam').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y, h: b.height } }); await A.mouse.move(r.x, r.y + r.h * .7); await A.mouse.down(); await A.mouse.move(r.x, r.y + r.h * .15, { steps: 5 }); await foto(A, '10-caneta-tamanho');
    ok(await ev(A, () => ED.st.caneta.w > .03 && !document.querySelector('#cn2-dot').hidden && ED.st.caneta.neon), 'arrastar a espessura mostra a bolinha com o tamanho'); await A.mouse.up(); await sleep(600) }
  { const r = await ev(A, () => { const b = document.querySelector('#ce-cv').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }); await A.mouse.move(r.x + r.w * .15, r.y + r.h * .58); await A.mouse.down(); for (let i = 1; i <= 8; i++) await A.mouse.move(r.x + r.w * (.15 + i * .08), r.y + r.h * (.58 + Math.sin(i) * .04)); await A.mouse.up(); await sleep(150);
    ok(await ev(A, () => ED.st.tracos.length === 1 && ED.st.tracos[0].neon && ED.st.tracos[0].pts.length > 5), 'traço neon desenhado');
    await clk(A, '[data-edcnt="mk"]'); await clk(A, '[data-edcncor="#ffd23f"]'); await A.mouse.move(r.x + r.w * .5, r.y + r.h * .1); await A.mouse.down(); await sleep(900); await A.mouse.up(); await sleep(150);
    ok(await ev(A, () => { const t = ED.st.tracos[1]; return ED.st.tracos.length === 2 && t.w === 3 && t.mk && t.cor === '#ffd23f' }), 'segurar parado com o marcador pinta o fundo (translúcido)');
    await foto(A, '11-caneta-fundo');
    await clk(A, '[data-edcndesf]'); ok(await ev(A, () => ED.st.tracos.length === 1), 'desfazer tira o fundo pintado');
    await clk(A, '[data-edcnt="bor"]'); ok(await ev(A, () => ED.st.caneta.bor && !ED.st.caneta.mk && document.querySelector('.ce-cn').classList.contains('bor')), 'borracha selecionada'); await clk(A, '[data-edcnt="caneta"]') }
  await clk(A, '[data-edcnok]'); await sleep(250);
  ok(await ev(A, () => !document.querySelector('.ce-cn') && ED.st.ferr === null), 'Concluído sai da caneta');
  await foto(A, '12-editor-final');

  // 9. publica; amiga vê enquete colorida, quiz e foto na imagem
  await clk(A, "[data-edpubst='amigos']"); await esperar(A, () => !ED, null, 10000); await sleep(600);
  ok(await ev(A, () => { const x = pubStoriesDe(S.uid)[0]; const it = x && x.estilo.itens; const q = it.find(i => i.t === 'quiz'), e = it.find(i => i.t === 'enq'); return it.map(i => i.t).sort().join() === 'cont,enq,perg,quiz' && q.c === 2 && e.cor === 2 && e.o.length === 2 }), 'publicado: formato antigo + cor');
  await ev(B, () => go('feed')); await sleep(300); await ev(B, () => pubCarregar()); await sleep(1500);
  await clk(B, '#secs [data-ustory]'); await sleep(1500);
  ok(await ev(B, () => !!document.querySelector('#layer .us-enq.fgc-2') && document.querySelectorAll('#layer .us-enq button').length === 2 && document.querySelectorAll('#layer .us-fg').length === 4), 'amiga vê a enquete com a cor e as outras figurinhas');
  await B.click('#layer [data-usvoto][data-i="1"]'); await sleep(700);
  ok(await ev(B, () => /100%/.test(document.querySelector('#layer .us-enq button[data-i="1"]').textContent)), 'voto na enquete colorida');
  await ev(B, () => typeof igPausa === 'function' && igPausa()); await foto(B, '13-B-story');
  // enquete antiga (sem cor, 2 opções) e enquete nova com 4 opções no visualizador
  const sid = await ev(A, async () => { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', texto: '', fotos: [], estilo: { v: 2, fundo: 1, itens: [{ t: 'enq', x: .5, y: .25, q: 'Antiga?', o: ['Sim', 'Não'] }, { t: 'enq', x: .5, y: .62, q: 'Qual dia?', o: ['Sáb', 'Dom', 'Seg', 'Ter'], cor: 3 }] } }).select('id'); return r.data[0].id });
  await ev(B, () => closeLayer()); await sleep(300); await ev(B, () => pubCarregar()); await sleep(1500);
  await ev(B, id => { const x = pubDe(id); stLista([x], 0, 'Pedro', 'tx' + id) }, sid); await sleep(1200);
  ok(await ev(B, () => { const e = [...document.querySelectorAll('#layer .us-enq')]; return e.length === 2 && !e[0].className.includes('fgc-') && e[1].classList.contains('fgc-3') && e[1].querySelectorAll('button').length === 4 }), 'visualizador: enquete antiga igual e nova com 4 opções');
  await B.click('#layer .us-enq.fgc-3 [data-i="3"]'); await sleep(600);
  ok(await ev(B, id => meuVoto('us:' + id + '#e1') === 3 && meuVoto('us:' + id) == null, sid), 'voto na 4ª opção usa a chave da 2ª enquete');
  await ev(B, () => typeof igPausa === 'function' && igPausa()); await foto(B, '14-B-enquete-4');

  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_ig_figurinhas: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
