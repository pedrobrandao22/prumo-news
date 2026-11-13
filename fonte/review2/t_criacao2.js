// Criação rodada 2: figurinhas sem sobreposição, fundo da foto inteira em degradê, story com miniatura nas Conversas, menção digitada
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8970/index.html'; const PAIS = __dirname + '/ig3/paisagem.jpg', RET = __dirname + '/ig3/retrato.jpg';
const SH = __dirname + '/../shots-ig7/'; require('fs').mkdirSync(SH, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
let N = 0; const shot = async (p, nome) => { await sleep(250); await p.screenshot({ path: SH + String(++N).padStart(2, '0') + '-' + nome + '.png' }) };
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const chip = async (p, k) => { await clk(p, '.ce-top [data-edfig]'); await sleep(250); await clk(p, `.ce-fig [data-edfig="${k}"]`); await sleep(250) };
// pares de figurinhas que se cobrem (caixas na tela, com 2px de folga)
const sobrepostas = p => ev(p, () => { const r = [...document.querySelectorAll('#ce-els > [data-eid]')].map(n => [n.dataset.eid, n.getBoundingClientRect()]); const o = [];
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { const a = r[i][1], b = r[j][1]; if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) o.push(ED.st.els.find(e => e.id === r[i][0]).t + '×' + ED.st.els.find(e => e.id === r[j][0]).t) } return o });
async function publica(p) { const n0 = await ev(p, () => pubStoriesDe(S.uid).length); await clk(p, "[data-edpubst='amigos']"); await esperar(p, n => !ED && !PQ.atual && pubStoriesDe(S.uid).length === n + 1, n0, 20000); await sleep(400) }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8970); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid), uidA = await ev(A, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await sleep(500);

  // ===== 1. figurinhas novas não cobrem as que já estão no story
  await ev(A, () => criarAbrir('story')); await sleep(400); await clk(A, '[data-edcriar]'); await sleep(300);
  await A.fill('#ce-txa', 'Pergunta do dia'); await clk(A, '[data-edtxok]'); await sleep(200);
  await chip(A, 'enq'); await A.fill('#ce-eq', 'Onde vamos no domingo?'); await A.fill('#fe-o0', 'Praia'); await A.fill('#fe-o1', 'Serra'); await clk(A, '[data-edfok]'); await sleep(350);
  await chip(A, 'local'); await A.fill('#fq', 'Curitiba'); await clk(A, '[data-edfok]'); await sleep(350);
  await chip(A, 'perg'); await A.fill('#fq', 'Que notícia te chamou atenção?'); await clk(A, '[data-edfok]'); await sleep(350);
  for (let i = 0; i < 3; i++) { await chip(A, 'hora'); await sleep(200) }
  let ov = await sobrepostas(A); ok(ov.length === 0, 'texto + enquete + local + pergunta + 3 horas: nenhuma figurinha cobre outra ' + JSON.stringify(ov));
  ok(await ev(A, () => ED.st.els.every(e => e.x > .02 && e.x < .98 && e.y > .06 && e.y < .9)), 'todas dentro da área segura do story');
  ok(await ev(A, () => { const e = ED.st.els.find(x => x.t === 'enq'); return Math.abs(e.x - .5) < .08 }), 'a primeira figurinha fica perto do centro');
  await shot(A, 'figurinhas-sem-sobrepor');
  // story cheio: ainda dá para pôr mais (aceita sobrepor pouco)
  for (let i = 0; i < 4; i++) { await chip(A, 'hora'); await sleep(150) }
  ok(await ev(A, () => ED.st.els.filter(e => e.t === 'hora').length === 7 && new Set(ED.st.els.map(e => e.x + ',' + e.y)).size === ED.st.els.length), 'com o story cheio ainda entra figurinha, cada uma num lugar');
  await shot(A, 'figurinhas-story-cheio');
  await ev(A, () => { ED.st.els = ED.st.els.filter(e => e.t !== 'hora'); edDesenha() }); await sleep(200);

  // ===== 2. menção digitada com "@"
  await chip(A, 'men');
  ok(await ev(A, () => !!document.querySelector('#layer .ca100-men') && document.activeElement.id === 'ca100-mq' && !document.querySelector('#layer .ce-sel') && document.querySelectorAll('.ca100-sug [data-ca100mu]').length >= 1), 'menção abre no próprio story com o cursor no @ e sugestões de amigos (sem a folha de lista)');
  await shot(A, 'mencao-vazia');
  await A.keyboard.type('@bi'); await sleep(150);
  ok(await ev(A, u => document.querySelector('#ca100-mq').value === 'bi' && document.querySelector('.ca100-sug [data-ca100mu]').dataset.ca100mu === u && document.querySelector('.ca100-sug button.on'), uidB), 'digitar "@bi" sugere a Bia em destaque');
  await shot(A, 'mencao-digitando');
  await A.keyboard.type('zz'); await sleep(100); ok(await ev(A, () => !!document.querySelector('.ca100-nada')), 'nome sem amigo: avisa');
  await A.keyboard.press('Backspace'); await A.keyboard.press('Backspace'); await A.keyboard.press('Enter'); await sleep(350);
  ok(await ev(A, u => { const e = ED.st.els.find(x => x.t === 'men'); return e && e.uid === u && !document.querySelector('.ca100-men') && !!document.querySelector('#ce-els .ce-men') }, uidB), 'Enter escolhe a Bia: figurinha {t:"men",uid} igual à de antes');
  ov = await sobrepostas(A); ok(ov.length === 0, 'a menção também não cobre nada ' + JSON.stringify(ov));
  const eidM = await ev(A, () => ED.st.els.find(x => x.t === 'men').id);
  await ev(A, id => edToqueEl(ED.st.els.find(x => x.id === id)), eidM); await sleep(200);
  ok(await ev(A, () => /Bia/.test(document.querySelector('#ca100-mq')?.value || '')), 'tocar na menção reabre com o nome para trocar');
  await ev(A, () => history.back()); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer .ce') && !document.querySelector('.ca100-men') && ED.st.els.some(x => x.t === 'men')), 'voltar do celular fecha a menção e fica no editor');
  await shot(A, 'story-com-mencao');
  await publica(A);
  const stId = await ev(A, () => pubStoriesDe(S.uid).slice(-1)[0].id);
  ok(await ev(A, () => { const x = pubStoriesDe(S.uid).slice(-1)[0]; return x.estilo.itens.some(i => i.t === 'men' && typeof i.uid === 'string') }), 'menção publicada no formato de sempre');

  // ===== 3. Bia vê: responde e curte (o slider saiu com o foco, 105)
  await ev(B, () => go('feed')); await esperar(B, () => PUB.on === true, null, 8000); await ev(B, () => pubCarregar()); await esperar(B, id => !!pubDe(id), stId, 8000);
  await ev(B, id => stLista([pubDe(id)], 0, 'Pedro', 'x'), stId); await sleep(1300);
  await shot(B, 'bia-ve-story');
  await ev(B, () => { const i = document.querySelector('#layer .us-rp input'); i.value = 'Praia, claro!'; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#layer .us-rp').requestSubmit() }); await sleep(600);
  await clk(B, '#layer [data-uscurtir]'); await sleep(600);
  ok(await ev(B, () => S.msgsOut.filter(m => /story/.test(m.tipo)).every(m => m.snap && m.snap.sth && m.snap.sth.id && /\//.test(m.snap.sth.p || ''))), 'resposta e curtida levam a miniatura do story (caminho da foto do autor)');
  await ev(B, () => closeLayer()); await sleep(300);

  // ===== 4. Pedro vê nas Conversas com a miniatura; tocar abre o story
  await ev(A, () => { go('msgs') }); await sleep(300); await ev(A, u => abrirConversa(u), uidB); await esperar(A, () => document.querySelectorAll('#v-msgs .ca100-st').length >= 2, null, 8000);
  await esperar(A, () => [...document.querySelectorAll('#v-msgs .ca100-st img')].every(i => i.complete && i.naturalWidth > 0), null, 8000).catch(() => {});
  ok(await ev(A, () => { const s = [...document.querySelectorAll('#v-msgs .ca100-sq')]; return s.length === 2 && /Respondeu ao seu story/.test(s[0].textContent) && /Curtiu seu story/.test(s[1].textContent) && [...document.querySelectorAll('#v-msgs .ca100-st img')].every(i => i.naturalWidth > 0) }), 'Conversas: "Respondeu ao seu story" e "Curtiu seu story" com miniatura carregada');
  ok(await ev(A, () => { const r = document.querySelector('#v-msgs .ca100-st').getBoundingClientRect(); return Math.abs(r.height / r.width - 16 / 9) < .05 }), 'miniatura em 9:16');
  await shot(A, 'conversa-com-miniatura');
  await clk(A, '#v-msgs [data-ca100st]'); await sleep(900);
  ok(await ev(A, id => !!document.querySelector('#layer .story') && ST.itens[ST.i].id === id, stId), 'tocar na miniatura abre o story');
  await ev(A, () => closeLayer()); await sleep(300);
  // mensagens antigas (sem sth) continuam como antes
  ok(await ev(A, () => { const m = { id: 'velha1', de: Object.keys(S.membros).find(u => u !== S.uid), para: S.uid, at: Date.now(), tipo: 'curtiu_story', texto: '❤️', snap: { story: { id: 'x', t: 'Antigo', foto: true } } }; S.msgsIn.push(m); renderMsgs(); const ok = /curtiu seu story · “Antigo”/.test(document.querySelector('#v-msgs').textContent); S.msgsIn = S.msgsIn.filter(x => x !== m); renderMsgs(); return ok }), 'curtida antiga sem miniatura continua como linha de evento');
  // story que já acabou: avisa
  await ev(A, id => { pubDe(id).expira = Date.now() - 1 }, stId); await clk(A, '#v-msgs [data-ca100st]'); await sleep(200);
  ok(await ev(A, () => !document.querySelector('#layer .story') && /não está mais disponível/.test(document.querySelector('.toast')?.textContent || '')), 'story vencido: avisa em vez de abrir');
  await ev(A, () => go('feed')); await sleep(300);

  // ===== 5. foto inteira: degradê contínuo (sem faixas), igual no editor e na imagem final
  await ev(A, () => criarAbrir('story')); await sleep(600); await A.setInputFiles('#ce-file', [PAIS]); await esperar(A, () => ED.tela === 'edit', null, 6000); await sleep(600);
  ok(await ev(A, () => { const bg = document.querySelector('#ce-cv .ce-bg').style.background; return ED.st.bg.cont && (bg.match(/rgb\(/g) || []).length >= 8 }), 'fundo com várias paradas tiradas da foto');
  await shot(A, 'foto-inteira-degrade');
  const sem = await ev(A, async () => { const bl = await edExportaStory(); const im = await createImageBitmap(bl), c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(540, 0, 1, 1920).data;
    const [iw, ih] = edWH(ED.st.bg.img), h = ih * 1080 / iw, top = Math.round((1920 - h) / 2), bot = Math.round((1920 + h) / 2); let mx = 0;
    for (let y = 2; y < top - 3; y++) { const i = y * 4, j = (y - 1) * 4; mx = Math.max(mx, Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2])) }
    for (let y = bot + 4; y < 1918; y++) { const i = y * 4, j = (y - 1) * 4; mx = Math.max(mx, Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2])) }
    const e = (y) => [d[y * 4], d[y * 4 + 1], d[y * 4 + 2]]; const a = e(top - 4), z = e(top + 4); return { mx, top, borda: Math.abs(a[0] - z[0]) + Math.abs(a[1] - z[1]) + Math.abs(a[2] - z[2]) } });
  ok(sem.mx <= 10, 'imagem final: o fundo muda aos poucos, sem faixa nem emenda (maior salto entre linhas ' + sem.mx + ', borda da foto ' + sem.borda + ')');
  // editor × final
  const dif = await ev(A, async () => { const cv = document.querySelector('#ce-cv'), w = cv.clientWidth, h = cv.clientHeight; const bl = await edExportaStory(), im = await createImageBitmap(bl); const c = document.createElement('canvas'); c.width = 9; c.height = 16; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 9, 16);
    const t = document.createElement('canvas'); t.width = w; t.height = h; const tg = t.getContext('2d'); const st = ED.st.bg; const gr = tg.createLinearGradient(0, 0, 0, h); ca100Paradas(st, w, h).forEach(([p, c]) => gr.addColorStop(p, c)); tg.fillStyle = gr; tg.fillRect(0, 0, w, h);
    const s = document.createElement('canvas'); s.width = 9; s.height = 16; s.getContext('2d').drawImage(t, 0, 0, 9, 16); const a = g.getImageData(0, 0, 9, 1).data, z = s.getContext('2d').getImageData(0, 0, 9, 1).data; let m = 0; for (let i = 0; i < a.length; i += 4) m = Math.max(m, Math.abs(a[i] - z[i])); return m });
  ok(dif < 12, 'o topo do fundo no editor bate com a imagem final (dif ' + dif + ')');
  await ev(A, () => { ED.st.bg.z = 1.4; ED.st.bg.oy = .05; edBgPos() }); await sleep(200);
  ok(await ev(A, () => document.querySelector('#ce-cv .ce-bg').style.background !== '' && /gradient/.test(document.querySelector('#ce-cv .ce-bg').style.background)), 'mover/ampliar a foto refaz o degradê na hora');
  await shot(A, 'foto-inteira-zoom');
  await ev(A, () => { ED.st.bg.z = 1; ED.st.bg.oy = 0; edBgPos() });
  await A.setInputFiles('#ce-file', [RET]).catch(() => {}); await sleep(300);
  await publica(A);
  await ev(A, () => stLista(pubStoriesDe(S.uid).slice(-1), 0, 'Pedro', 'eu')); await sleep(1300); await shot(A, 'foto-inteira-publicada'); await ev(A, () => closeLayer()); await sleep(200);

  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).slice(0, 4).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_criacao2: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); process.exit(2) });
