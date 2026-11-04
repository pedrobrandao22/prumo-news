// QA da noite (A): colunas, seguir, reposts e "De perto" usados por 5 pessoas em vários "dias", como em produção
// (foco, visual novo com o cartão A, sem reels, fase 2). Pedro, Bia e Carla são amigos; Dani e Edu são amigos entre si e
// não conhecem os outros. Bia abre o perfil e escreve; Dani segue a Bia; Edu nunca segue ninguém.
// Confere também a privacidade direto no banco (como cada pessoa) e o app com o banco ANTES da v9 (6.000 caracteres).
// Portas 8760–8761. Capturas em qa/noite-a/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8760, PORTA2 = 8761, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'noite-a'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const clk0 = (p, sel) => p.$eval(sel, e => e.click());
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
const shot = async (p, n) => { await semToast(p); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const CORPO = ['Toda segunda-feira eu passo na feira da Tijuca, e nos últimos meses a conversa mudou. O preço do tomate virou assunto de política.',
  'Os feirantes contam que o custo do frete subiu, e o cliente já não leva o mesmo. **Isso aparece nos números** do IPCA, mas a feira mostra antes.',
  '## O que dizem os feirantes', '> A gente sente o aumento antes do jornal.', 'Seu Antônio vende ali há 30 anos. Para ele, *o pior foi o diesel*. Os dados estão no [IBGE](https://www.ibge.gov.br/ipca) e em https://www.bcb.gov.br/.',
  ...Array.from({ length: 14 }, (_, i) => `Parágrafo ${i + 1}: a conta do mês fecha cada vez mais apertada, e quem vende sente primeiro. A banca do lado trocou o tomate italiano pelo comum, e o cliente nem reclamou.`),
  '## E agora?', 'A expectativa é de alívio no segundo semestre, mas ninguém na feira aposta nisso. Vamos acompanhar.'].join('\n');
let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c', 'd', 'e']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro'),($5,'Edu Lima','membro')`, [ids.a, ids.b, ids.c, ids.d, ids.e]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita'),($2,$3,'aceita'),($4,$5,'aceita')`, [ids.a, ids.b, ids.c, ids.d, ids.e]);
  // aparelhos inscritos nos avisos de comentário (para conferir a fila de push da v10)
  for (const k of ['a', 'b', 'd']) await H.sql(`insert into public.push_inscricoes(uid,endpoint,p256dh,auth,prefs) values ($1,$2,$3,$4,$5)`, [ids[k], 'https://push.exemplo.com/' + k + '-0123456789', 'p'.repeat(40), 'a'.repeat(16), { comentarios: true, curtidas: true }]);
  const como = (k, q, p) => H.comoUsuario(ids[k], () => H.db.query(q, p || [])).then(r => r.rows);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids[k], email: k + '@x' } }, dark: o.dark, viewport: o.vp }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(o.base || BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null, null, 15000); await sleep(500); await fecha(p); return p };
  const recarrega = P => ev(P, async () => { PUB.sig = ''; try { VN112_Q.clear() } catch (e) { } CS123.t = 0; await cs123Carregar(); await pubCarregar(); try { PS.t = 0; await psCarregar() } catch (e) { } });
  const feed = async P => { await fecha(P); await recarrega(P); await ev(P, () => { FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 14; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) }); await sleep(400) };
  const pinta = P => ev(P, () => { const cv = document.createElement('canvas'); cv.width = 800; cv.height = 600; const g = cv.getContext('2d');
    PUB.itens.forEach(x => x.fotos.forEach((f, i) => { if (PUB.urls[f] && PUB.urls[f].u && /^data:/.test(PUB.urls[f].u)) return; g.fillStyle = ['#2f7d5b', '#36589a', '#a3562a'][i % 3]; g.fillRect(0, 0, 800, 600); g.fillStyle = '#fff'; g.font = '700 64px sans-serif'; g.textAlign = 'center'; g.fillText('Foto ' + (i + 1), 400, 320); PUB.urls[f] = { u: cv.toDataURL('image/jpeg', .7), exp: Date.now() + 9e9 } })) });
  const mostra = async (P, id, n, dy = 64) => { await ev(P, ([id, dy]) => { const e = document.getElementById('p-u:' + id); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - dy) }, [id, dy]); await sleep(300); await shot(P, n) };
  const tem = (P, id) => ev(P, id => document.querySelectorAll(`#posts [id="p-u:${id}"]`).length, id);

  const B = await abrir('b'), D = await abrir('d'), A = await abrir('a'), E = await abrir('e'), C = await abrir('c');
  ok(await ev(B, () => V9.on === true && document.documentElement.classList.contains('dc122') && typeof qa125VeReac === 'function'), 'estado de produção, SQL v9 e o 125 carregados');

  /* ================= dia 1: Bia abre o perfil e escreve ================= */
  await ev(B, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(400);
  await clk(B, '#v-me [data-cs123aberto]'); await sleep(600);
  ok((await H.sql(`select perfil_aberto from membros where uid=$1`, [ids.b]))[0].perfil_aberto === true, 'dia 1: Bia liga "Perfil aberto"');
  await ev(B, () => { PF_ABA = 'posts'; go('feed'); criarAbrir('post') }); await sleep(500); await clk(B, '#layer [data-cs123ini]'); await sleep(400);
  await B.fill('#cs123-tit', 'O preço do tomate virou política'); await B.fill('#cs123-linha', 'Na feira da Tijuca, a inflação chega antes dos números');
  await B.fill('#cs123-corpo', CORPO); await B.fill('#cs123-tags', '#Inflação economia');
  const png = await ev(B, () => { const c = document.createElement('canvas'); c.width = 1200; c.height = 700; const g = c.getContext('2d'); g.fillStyle = '#8a5a17'; g.fillRect(0, 0, 1200, 700); g.fillStyle = '#c0392b'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(100 + i * 95, 350 + (i % 3) * 60, 42, 0, 7); g.fill() } return c.toDataURL('image/png').split(',')[1] });
  const [fc] = await Promise.all([B.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), clk(B, '[data-cs123capa]')]);
  if (fc) await fc.setFiles({ name: 'capa.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  ok(!!fc && await esperar(B, () => !!document.querySelector('.cs123-capaed img')), 'dia 1: capa escolhida');
  await sleep(900); await ev(B, () => history.back()); await sleep(600);
  ok(await ev(B, () => !$('#layer').innerHTML && cs123RascLe().length === 1 && cs123RascLe()[0].tags === '#Inflação economia'), 'rascunho: fechar o editor guarda o rascunho (com as hashtags)');
  await ev(B, () => criarAbrir('post')); await sleep(400);
  ok(/1 rascunho guardado/.test(await ev(B, () => $('#layer [data-cs123ini]')?.textContent || '')), 'rascunho: "Escrever coluna · 1 rascunho guardado"');
  await clk(B, '#layer [data-cs123ini]'); await sleep(300); await shot(B, '01-editor-rascunhos');
  await clk(B, '#layer [data-cs123rabre]'); await sleep(300);
  ok(await ev(B, () => $('#cs123-tit').value === 'O preço do tomate virou política' && $('#cs123-corpo').value.length > 2000 && $('#cs123-tags').value === '#Inflação economia'), 'rascunho: reabre com título, texto e hashtags');
  await clk(B, '[data-cs123pubv="seguidores"]'); await sleep(200);
  ok(await ev(B, () => /Quem segue você e seus amigos podem ler/.test($('#layer .cs123-ed').textContent)), 'editor: público "Seguidores e amigos" explicado');
  await clk(B, '[data-cs123prev]'); await sleep(400); await shot(B, '02-previa');
  ok(await ev(B, () => /#Inflação/.test($('#layer .cs123-prev .cs123-hts')?.textContent || '') && $('#layer .cs123-prev .cs123-corpo h2')?.textContent === 'O que dizem os feirantes'), 'prévia: intertítulos e hashtags');
  await clk0(B, '#layer .cs123-prev [data-cs123pub]');
  ok(await esperar(B, () => !CS123.ed && !$('#layer').innerHTML, null, 8000), 'publica da prévia');
  const col = (await H.sql(`select * from publicacoes where autor=$1 order by at desc limit 1`, [ids.b]))[0];
  ok(col && col.publico === 'seguidores' && col.fotos.length === 1 && /Parágrafo 14/.test(col.corpo || ''), 'coluna gravada para seguidores, com capa e o texto longo');
  ok(await ev(B, () => cs123RascLe().length === 0), 'o rascunho sai depois de publicar');
  // outros posts da Bia (como se tivessem sido feitos pelo app)
  const ins = (P, r) => ev(P, async r => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], ...r }).select('id'); if (q.error) throw new Error(q.error.message); return q.data[0].id }, r);
  const P = {};
  P.dp = await ins(B, { texto: 'Fila no posto\n\nA fila dobrava o quarteirão desde as 7h.', fotos: [ids.b + '/dp-0.jpg', ids.b + '/dp-1.jpg'], publico: 'seguidores', estilo: { v: 2, local: 'Tijuca, Rio de Janeiro', cn: { v: 1, k: 'rel', tit: 'Fila no posto' } } });
  P.enq = await ins(B, { texto: 'O que vocês acham?', publico: 'seguidores', estilo: { v: 2, cn: { v: 1, k: 'enq', tit: 'O preço da feira subiu para você?', o: ['Sim', 'Não'] } } });
  P.ana = await ins(B, { texto: 'Juros altos por mais tempo\n\nCom a Selic alta, o crédito fica caro. #Copom', publico: 'seguidores', estilo: { v: 2, cn: { v: 1, k: 'ana', tit: 'Juros altos por mais tempo', fu: 'bcb.gov.br' } } });
  P.fio = await ins(B, { texto: 'Três pontos sobre a feira.', publico: 'seguidores', estilo: { v: 2, fio: ['Segundo: o frete.', 'Terceiro: o diesel.'] } });
  P.am = await ins(B, { texto: 'Só para os amigos: churrasco no sábado?', publico: 'amigos', estilo: { v: 2 } });
  P.ma = await ins(B, { texto: 'Só para os melhores amigos.', publico: 'proximos', estilo: { v: 2 } });
  P.stB = await ins(B, { tipo: 'story', texto: 'Story da Bia', publico: 'seguidores', expira: Date.now() + 864e5, estilo: { v: 2 } }).catch(e => 'erro:' + e.message);

  // Análise pelo formulário, para "Seguidores e amigos"
  await ev(B, () => { go('feed'); cn102Comeca('ana') }); await sleep(700);
  await ev(B, () => { ED.po.cn.tit = 'O frete explica a feira'; ED.po.cn.corpo = 'O diesel subiu 12% no ano e o frete foi junto. Quem vende na feira repassa.'; ED.po.cn.fu = 'cnt.org.br'; edDesenha() }); await sleep(300);
  const temPub = await ev(B, () => !!document.querySelector('#layer [data-cfppub]'));
  if (temPub) { await clk(B, '#layer [data-cfppub]'); await sleep(300) }
  const opc = await ev(B, () => [...document.querySelectorAll('#layer [data-cfppubv]')].map(b => b.dataset.cfppubv));
  ok(temPub && opc.includes('seguidores'), 'Análise (formulário): público com "Seguidores e amigos"', { temPub, opc });
  if (opc.includes('seguidores')) { await clk(B, '#layer [data-cfppubv="seguidores"]'); await sleep(200); await ev(B, () => document.querySelector('#layer .ce-sel [data-edselx]')?.click()); await sleep(300) }
  const em = await ev(B, () => document.querySelector('#layer [data-cfppub] em')?.textContent || '');
  ok(/Seguidores e amigos/.test(em), 'Análise (formulário): a linha "Público" mostra "Seguidores e amigos"', em);
  await shot(B, '02b-analise-publico');
  await clk(B, '#layer [data-edpubpo]'); await sleep(1500); 
  const anaF = (await H.sql(`select publico, estilo from publicacoes where autor=$1 and texto like 'O frete explica%'`, [ids.b]))[0];
  ok(anaF && anaF.publico === 'seguidores' && anaF.estilo.cn && anaF.estilo.cn.k === 'ana', 'Análise (formulário) publicada para seguidores', anaF);
  await fecha(B);
  /* ================= dia 2: Dani acha a Bia e segue ================= */
  await ev(D, () => document.querySelector('#b-busca') ? document.querySelector('#b-busca').click() : go('busca')); await sleep(400);
  ok(await ev(D, () => VIEW === 'busca' && !!$('#bvq')), 'a lupa abre a aba Buscar');
  await D.fill('#bvq', 'Bia');
  ok(await esperar(D, () => /Perfis abertos/.test(document.querySelector('#bvres .cs123-bus')?.textContent || '') && !!document.querySelector('#bvres .cs123-bus [data-cs123seg]'), null, 5000), 'aba Buscar: "Perfis abertos" com a Bia e o botão Seguir (antes só na busca antiga)');
  ok(await ev(D, () => getComputedStyle(document.querySelector('#bvres .cs123-bus .amg-n b')).fontFamily === getComputedStyle(document.querySelector('#bvq')).fontFamily || !/Newsreader/.test(getComputedStyle(document.querySelector('#bvres .cs123-bus .amg-n b')).fontFamily)), 'lista de perfis com a letra das listas (não a serifa da coluna)');
  await shot(D, '03-busca-perfis-abertos');
  await clk(D, '#bvres .cs123-bus [data-cs123perfil]'); await sleep(800);
  ok(await esperar(D, u => !!document.querySelector(`#layer .pfv [data-cs123seg="${u}"]`), ids.b, 6000), 'perfil aberto: botão Seguir');
  await clk(D, `#layer .pfv [data-cs123seg="${ids.b}"]`);
  ok(await esperar(D, u => document.querySelector(`#layer .pfv [data-cs123seg="${u}"]`)?.textContent === 'Seguindo', ids.b, 6000), 'Seguir → "Seguindo"');
  await ev(D, () => { const s = $('#layer .pfv-sc'); if (s) s.scrollTop = 0 }); await sleep(500); await shot(D, '04-perfil-seguindo');
  const pfD = await ev(D, P => { const t = $('#layer .pfv').innerHTML; return { am: t.includes(P.am), ma: t.includes(P.ma), dp: t.includes(P.dp) } }, P);
  ok(!pfD.am && !pfD.ma, 'perfil da Bia visto pela Dani: sem o post só para amigos e sem o de Melhores amigos', pfD);
  await ev(D, () => history.back()); await sleep(700);
  const bv = await ev(D, () => ({ L: $('#layer').innerHTML.slice(0, 120), v: VIEW, q: $('#bvq')?.value, bus: !!document.querySelector('#bvres .cs123-bus') }));
  ok(!bv.L && bv.v === 'busca' && bv.q === 'Bia' && bv.bus, 'Busca › perfil › Voltar: volta à Busca com "Bia" e os perfis abertos', bv);
  await fecha(D);
  // banco como a Dani
  const vD = (await como('d', `select id, publico, tipo from publicacoes where autor=$1`, [ids.b]));
  ok(vD.length && vD.every(r => r.publico === 'seguidores' && r.tipo === 'post'), 'banco (Dani): só os posts "para seguidores" da Bia (nada para amigos, Melhores amigos ou story)', vD.map(r => r.publico + ':' + r.tipo));
  ok((await como('d', `select nome from membros`)).every(r => /Dani|Edu/.test(r.nome)), 'banco (Dani): seguir não abre a linha da Bia nem a dos amigos dela em "membros" (o nome vem só das funções)');
  ok((await como('e', `select id from publicacoes where autor=$1`, [ids.b])).length === 0, 'banco (Edu, que não segue): nada da Bia');

  /* ---------- Feed da Dani: nome primeiro em tudo ---------- */
  await feed(D); await pinta(D); await ev(D, () => { renderPosts(); for (let i = 0; i < 14; i++) try { carregarMais(true) } catch (e) { } }); await sleep(300);
  const hf = await ev(D, P => Object.fromEntries(['dp', 'enq', 'ana', 'fio'].map(k => { const a = document.getElementById('p-u:' + P[k]); if (!a) return [k, null]; const kids = [...a.children].filter(e => !e.matches('.fc107-gh,.dc122-rpl'));
    return [k, { hf: a.classList.contains('dc122-hf') || a.classList.contains('ac117-rel'), ph: kids[0] && kids[0].matches('.ph'), nome: (a.querySelector('.ph-nm>b') || {}).textContent, seg: /seguidores/.test((a.querySelector('.ph-sub') || {}).textContent || ''), rel: /\bRelato\b|não checad/i.test(a.innerText) }] })), P);
  ok(Object.values(hf).every(o => o && o.hf && o.ph && o.nome === 'Bia Souza' && o.seg && !o.rel), 'Feed da Dani: De perto com fotos, Pergunta, Análise e fio da Bia com o nome primeiro e a marca "seguidores" (sem "Relato")', hf);
  const cc = await ev(D, id => { const a = document.getElementById('p-u:' + id); if (!a) return null; const kids = [...a.children]; return { ph: kids[0] && kids[0].matches('.ph'), card: kids[1] && kids[1].matches('.cs123-card'), img: !!a.querySelector('.cs123-capa img') } }, col.id);
  ok(cc && cc.ph && cc.card && cc.img, 'Feed da Dani: coluna com o nome primeiro e a capa', cc);
  await mostra(D, P.dp, '05-dani-de-perto'); await mostra(D, col.id, '06-dani-coluna-feed');

  /* ---------- Dani lê, curte, comenta, guarda, vota ---------- */
  await clk0(D, `#posts [id="p-u:${col.id}"] .cs123-lb`); await sleep(400);
  ok(await esperar(D, () => !!$('#layer > .cs123-ler .cs123-fig img')), 'lê a coluna (com a capa)');
  await ev(D, () => { const s = $('#layer .cs123-sc'); s.scrollTop = (s.scrollHeight - s.clientHeight) * .5; s.dispatchEvent(new Event('scroll')) }); await sleep(200);
  const pg = await ev(D, () => parseFloat($('#layer .cs123-pg b').style.width)); ok(pg > 30 && pg < 70, 'barra de progresso no meio', pg);
  await ev(D, () => { const s = $('#layer .cs123-sc'); s.scrollTop = s.scrollHeight }); await sleep(200);
  await clk0(D, '#layer .cs123-fim [data-a="like"]'); await sleep(1200);
  await clk0(D, '#layer .cs123-fim .addc'); await sleep(400);
  if (!await esperar(D, () => !!document.querySelector('#ctext'), null, 3000)) { await shot(D, 'erro-comentar'); console.log('DBG', await ev(D, () => ($('#layer').innerHTML.slice(0, 300) + ' || L2 ' + ($('#layer2')?.innerHTML || '').slice(0, 300)))) }
  await D.fill('#ctext', 'Na minha feira também, Bia!'); await clk0(D, '#cform .sendc'); await sleep(800);
  await ev(D, () => history.back()); await sleep(400);
  await clk0(D, '#layer .cs123-fim [data-a="save"]'); await sleep(500);
  ok(await ev(D, () => /Guardada/.test($('#layer .cs123-fim').textContent)), 'guarda a coluna');
  await ev(D, () => history.back()); await sleep(500); ok(await ev(D, () => !$('#layer').innerHTML), 'Voltar fecha a coluna');
  await ev(D, id => { const b = document.querySelector(`[id="p-u:${id}"] [data-cn102voto]`); if (b) { b.scrollIntoView({ block: 'center' }); b.click() } }, P.enq); await sleep(700);
  ok(+(await H.sql(`select count(*) n from pub_reacoes where pub=$1 and uid=$2 and tipo='voto'`, [P.enq, ids.d]))[0].n === 1, 'Dani vota na Pergunta da Bia');

  /* ---------- Dani reposta e cita ---------- */
  await ev(D, id => vn112Menu('pub', id), col.id); await sleep(300);
  const rph = await ev(D, () => document.querySelector('[data-vnrpja]')?.textContent || '');
  ok(/Só aparece para quem também pode ver o post de Bia/.test(rph), 'Repostar post para seguidores: avisa quem vai ver', rph);
  await clk0(D, '[data-vnrpja]'); await sleep(900);
  await ev(D, id => vn112Publica('pub', id, 'Leiam essa, vale a pena'), col.id); await sleep(500);
  const rpD = (await H.sql(`select id, texto from publicacoes where autor=$1 order by at`, [ids.d]));
  ok(rpD.length === 2, 'repost e citação da Dani gravados');
  P.rpD = rpD.find(r => !r.texto).id; P.qD = rpD.find(r => r.texto).id;
  await feed(D);
  const dl = await ev(D, ([c, rp, q]) => ({ col: document.querySelectorAll(`#posts [id="p-u:${c}"]`).length, rp: document.querySelectorAll(`#posts [id="p-u:${rp}"]`).length, linha: document.querySelector(`#posts [id="p-u:${c}"] .dc122-rpl`)?.textContent,
    q: (document.getElementById('p-u:' + q) || {}).innerText || '' }), [col.id, P.rpD, P.qD]);
  ok(dl.col === 1 && dl.rp === 0 && dl.linha === 'Você repostou', 'Feed da Dani: a coluna uma vez, com "Você repostou" (antes: original + repost "indisponível")', dl);
  ok(/Leiam essa/.test(dl.q) && /preço do tomate/.test(dl.q) && !/indisponível/.test(dl.q), 'Feed da Dani: a citação dela mostra a coluna citada', dl.q.slice(0, 200));
  const qc = await ev(D, q => { const c = document.querySelector(`[id="p-u:${q}"] .vn-q`); return c ? { k: (c.querySelector('.vn-q-k') || {}).textContent, t: (c.querySelector('.vn-q-t') || {}).textContent, ler: c.dataset.cs123ler || '', hash: /#Inflação/.test(c.textContent) } : null }, P.qD);
  ok(qc && qc.k === 'Coluna' && qc.t === 'O preço do tomate virou política' && qc.ler === col.id && !qc.hash, 'citação de coluna: "Coluna", título e linha fina (sem as hashtags cruas); tocar abre a leitura', qc);
  await mostra(D, P.qD, '07-dani-citacao');
  await ev(D, q => document.querySelector(`[id="p-u:${q}"] .vn-q`).click(), P.qD); await sleep(400);
  ok(await ev(D, () => !!$('#layer > .cs123-ler')), 'citação › abre a coluna'); await ev(D, () => history.back()); await sleep(400);

  /* ================= dia 3: Bia vê as reações de quem segue ================= */
  await feed(B);
  await ev(B, id => cs123Abrir(id), col.id); await sleep(500);
  const bf = await ev(B, () => $('#layer .cs123-fim').innerText);
  ok(/Gostei · 1/.test(bf) && /Dani Rocha/.test(bf) && /Na minha feira também/.test(bf), 'Bia (autora) vê a curtida e o comentário de quem a segue', bf);
  await shot(B, '08-bia-fim-coluna');
  await clk0(B, '#layer .cs123-fim .addc'); await sleep(400); await B.fill('#ctext', 'Obrigada, Dani! Qual feira?'); await clk0(B, '#cform .sendc'); await sleep(800);
  await ev(B, () => history.back()); await sleep(300); await fecha(B);
  await ev(B, () => { AT.t = 0; return atCarregar() }); await sleep(400);
  const atB = await ev(B, () => atItens().map(x => x.txt.replace(/<[^>]+>/g, '')));
  await feed(B); const vB = await ev(B, id => (document.querySelector(`[id="p-u:${id}"] .cn102-enq`)?.textContent || 'NADA:' + (document.getElementById('p-u:' + id) ? 'tem' : 'sem')), P.enq);
  ok(/1 voto/.test(vB), 'Pergunta: a Bia vê o voto de quem a segue', vB);
  ok(atB.some(t => /^Dani Rocha começou a seguir você$/.test(t)) && atB.some(t => /^Dani Rocha comentou: “Na minha feira/.test(t)) && atB.some(t => /Dani Rocha.*(curtiu|gostou)/.test(t)) && atB.some(t => /Dani Rocha votou na sua pergunta/.test(t)), 'Atividade da Bia: seguiu, comentou, curtiu e votou (de quem a segue)', atB);
  ok(atB.some(t => /curtiu sua coluna “O preço do tomate virou política”/.test(t)), 'Atividade: "curtiu sua coluna “…”"', atB);
  await ev(B, () => abrirAtividade()); await sleep(600); await shot(B, '09-bia-atividade');
  const chips = await ev(B, () => $('#layer').innerText);
  ok(/1 seguidor novo/.test(chips) && !/novidade/.test(chips), 'Atividade: o resumo conta "1 seguidor novo" (não "1 novidade")', chips.slice(0, 200)); await fecha(B);
  // Pedro (amigo da Bia) comenta; não vê a Dani; a Dani não vê o Pedro
  await feed(A); await ev(A, id => cs123Abrir(id), col.id); await sleep(400);
  const af = await ev(A, () => $('#layer .cs123-fim').innerText);
  ok(!/Dani Rocha|Na minha feira/.test(af) && /Obrigada, Dani/.test(af), 'Pedro (amigo da Bia, não conhece a Dani): vê a resposta da Bia, não o comentário nem o nome da Dani', af);
  await clk0(A, '#layer .cs123-fim .addc'); await sleep(400); await A.fill('#ctext', 'Belo texto, Bia'); await clk0(A, '#cform .sendc'); await sleep(800); await fecha(A);
  await feed(D); await ev(D, id => cs123Abrir(id), col.id); await sleep(400);
  const df = await ev(D, () => $('#layer .cs123-fim').innerText);
  ok(/Obrigada, Dani/.test(df) && /Bia Souza/.test(df) && !/Pedro|Belo texto/.test(df), 'Dani: vê a resposta da Bia (autora), não o comentário do Pedro', df);
  await shot(D, '10-dani-resposta-da-bia'); await fecha(D);
  ok((await como('d', `select nome from membros where uid=$1`, [ids.a])).length === 0, 'banco (Dani): o nome do Pedro continua fechado');
  const fila = (para, de) => H.sql(`select titulo, corpo from push_fila where para=$1 and de=$2`, [ids[para], ids[de]]);
  const fDP = await fila('d', 'a'), fAD = await fila('a', 'd'), fDB = await fila('d', 'b'), fBD = await fila('b', 'd');
  ok(!fDP.length && !fAD.length, 'push (v10): quem só segue não recebe "Pedro também comentou…" e o Pedro não recebe o nome nem o texto da Dani', { fDP, fAD });
  ok(fDB.some(r => /Bia Souza também comentou/.test(r.titulo)) && fBD.some(r => /Dani Rocha comentou/.test(r.titulo)), 'push (v10): a Dani recebe a resposta da autora e a Bia o comentário de quem a segue', { fDB, fBD });

  /* ================= dia 4: reposts juntos, Edu, hashtag e conversa ================= */
  await ev(C, id => vn112Publica('pub', id, ''), col.id); await ev(A, id => vn112Publica('pub', id, ''), col.id); await sleep(400);
  await feed(B); const lb = await ev(B, id => document.querySelector(`#posts [id="p-u:${id}"] .dc122-rpl`)?.textContent, col.id);
  ok(lb === 'Pedro e Carla repostaram', 'Feed da Bia: "Pedro e Carla repostaram" (o repost da Dani, que ela não… conhece pelo Feed, fica de fora da linha)', lb);
  await feed(A); const la = await ev(A, id => document.querySelector(`#posts [id="p-u:${id}"] .dc122-rpl`)?.textContent, col.id);
  ok(la === 'Você e Carla repostaram', 'Feed do Pedro: "Você e Carla repostaram"', la);
  await mostra(A, col.id, '11-pedro-voce-e-carla');
  await feed(E);
  const ef = await ev(E, ([rp, q]) => ({ rp: document.querySelectorAll(`#posts [id="p-u:${rp}"]`).length, q: (document.getElementById('p-u:' + q) || {}).innerText || '' }), [P.rpD, P.qD]);
  ok(ef.rp === 0 && /Leiam essa/.test(ef.q) && /indisponível/.test(ef.q) && !/tomate|Bia/.test(ef.q), 'Edu (amigo da Dani, não segue a Bia): o repost simples some; a citação aparece com "Publicação indisponível", sem título nem nome da Bia', ef);
  await mostra(E, P.qD, '12-edu-citacao-indisponivel');
  ok((await como('e', `select count(*)::int n from pub_reacoes r join publicacoes p on p.id=r.pub where p.autor=$1`, [ids.b]))[0].n === 0, 'banco (Edu): nenhuma reação dos posts da Bia');
  // hashtag › coluna › voltar
  await ev(A, () => { go('feed'); abrirHashtag('#Inflação') }); await sleep(600);
  ok(await ev(A, () => !!$('#layer .pfv-ht .cs123-card')), 'página da #Inflação com a coluna');
  await ev(A, () => $('#layer .pfv-ht .cs123-lb').click()); await sleep(400);
  ok(await ev(A, () => !!$('#layer > .cs123-ler')), 'hashtag › Ler a coluna');
  await ev(A, () => history.back()); await sleep(800);
  ok(await esperar(A, () => !!$('#layer .pfv-ht') && !$('#layer .cs123-ler')), 'hashtag › coluna › Voltar: volta à página da hashtag');
  await ev(A, () => history.back()); await sleep(600); ok(await ev(A, () => !$('#layer').innerHTML), 'e Voltar de novo fecha a hashtag');
  // conversa
  await ev(B, id => pubEnviar(pubDe(id)), col.id); await sleep(300);
  ok(/Seus amigos e quem segue você conseguem abrir/.test(await ev(B, () => document.querySelector('.sheet .hint')?.textContent || '')), 'Enviar coluna para seguidores: a dica fala de amigos e seguidores');
  await ev(B, u => { document.querySelector(`[data-pick="${u}"]`).click(); document.querySelector('#sform').requestSubmit() }, ids.a); await sleep(1200);
  await ev(A, u => abrirConversa(u), ids.b); await sleep(1000);
  const dm = await ev(A, () => { const c = document.querySelector('#v-msgs .dm-ucard'); return c ? c.innerText : '' });
  ok(/Coluna/.test(dm) && /O preço do tomate virou política/.test(dm) && !/#Inflação/.test(dm), 'Conversa: o cartão diz "Coluna" e mostra o título', dm);
  await shot(A, '13-pedro-conversa-coluna');
  await ev(A, () => document.querySelector('#v-msgs .dm-ucard').click()); await sleep(600);
  await ev(A, () => document.querySelector('#layer .pfv .cs123-lb')?.click()); await sleep(500);
  ok(await ev(A, () => !!$('#layer > .cs123-ler')), 'Conversa › post › Ler a coluna');
  await ev(A, () => history.back()); await sleep(600); ok(await esperar(A, () => !!$('#layer .pfv') && !$('#layer .cs123-ler')), 'Voltar: volta ao post aberto da conversa');
  await ev(A, () => history.back()); await sleep(600); ok(await ev(A, u => !$('#layer').innerHTML && VIEW === 'msgs' && THREAD === u, ids.b), 'Voltar de novo: a conversa com a Bia');
  await ev(A, () => go('feed'));

  /* ================= dia 5: perfil fechado, remover seguidor, bloqueio ================= */
  await ev(B, () => cs123MudaAberto(false)); await sleep(300);
  ok((await como('d', `select id from publicacoes where autor=$1`, [ids.b])).length === 0, 'perfil fechado: no banco a Dani não vê mais nada da Bia');
  await feed(D);
  ok(await ev(D, id => !pubVisiveis().some(x => x.autor === id) && !vp99ListaSalvos().some(x => x.autor === id), ids.b), 'perfil fechado: some do Feed e das Guardadas da Dani');
  ok((await como('d', `select * from perfis_abertos('')`)).length === 0 && (await como('d', `select seg_contagem($1) r`, [ids.b]))[0].r.ok === false, 'perfil fechado: sai de "Perfis abertos" e os números não abrem');
  await ev(B, () => cs123MudaAberto(true)); await sleep(300); await feed(D);
  ok(await ev(D, id => pubVisiveis().some(x => x.id === id), col.id), 'perfil reaberto: quem já seguia volta a ver');
  // remover seguidor
  await ev(B, () => { CS123.t = 0; return cs123Carregar() }); await ev(B, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(500);
  await clk(B, '#v-me [data-cs123lista="seguidores"]'); await sleep(600);
  ok(await esperar(B, () => /Dani Rocha/.test(document.querySelector('#cs123-lb')?.textContent || '')), 'lista de seguidores: Dani');
  await shot(B, '14-bia-seguidores');
  await clk0(B, '#cs123-lb [data-cs123tira]'); await sleep(700);
  ok((await H.sql(`select count(*)::int n from seguidores where seguido=$1`, [ids.b]))[0].n === 0, 'Remover: a Dani deixa de seguir');
  await fecha(B); await feed(D);
  ok(await ev(D, id => !pubVisiveis().some(x => x.autor === id) && !CS123.sigo.has(id), ids.b), 'removida: a Dani não vê mais os posts para seguidores');
  // segue de novo e é bloqueada
  await ev(D, u => cs123Seguir(u), ids.b); await sleep(800);
  ok((await H.sql(`select count(*)::int n from seguidores where seguidor=$1`, [ids.d]))[0].n === 1, 'Dani segue de novo');
  await ev(B, u => bloquear(u, true), ids.d); await sleep(700);
  ok((await H.sql(`select count(*)::int n from seguidores where seguidor=$1 or seguido=$1`, [ids.d]))[0].n === 0, 'bloqueio: o seguir some dos dois lados');
  ok((await como('d', `select id from publicacoes where autor=$1`, [ids.b])).length === 0 && (await como('d', `select * from perfis_abertos('Bia')`)).length === 0, 'bloqueio: a Dani não vê os posts nem acha a Bia');
  await feed(D);
  ok(await ev(D, id => !pubVisiveis().some(x => x.autor === id), ids.b), 'bloqueio: some do Feed da Dani');
  const rs = await ev(D, async u => { const r = await SB.rpc('seguir', { p_uid: u }); return r.error ? r.error.code : 'ok' }, ids.b);
  ok(rs === '42501', 'bloqueio: seguir de novo é recusado pelo banco', rs);
  // a Bia não vê mais a Dani na Atividade como seguidora
  await ev(B, () => { CS123.t = 0; return cs123Carregar() }); await ev(B, () => { AT.t = 0; return atCarregar() }); await sleep(300);
  ok(await ev(B, () => !atItens().some(x => /começou a seguir/.test(x.txt))), 'bloqueio: "começou a seguir você" sai da Atividade da Bia');

  /* ================= larguras, tema e desempenho ================= */
  await ev(B, u => desbloquear(u), ids.d).catch(() => { }); await sleep(300); await fecha(B);
  await feed(A); await pinta(A); await ev(A, () => { renderPosts(); for (let i = 0; i < 14; i++) try { carregarMais(true) } catch (e) { } }); await sleep(300);
  for (const w of [360, 390, 430]) {
    await A.setViewportSize({ width: w, height: 800 }); await sleep(300);
    const l = await ev(A, () => ({ vz: document.scrollingElement.scrollWidth - innerWidth, fora: [...document.querySelectorAll('#posts .upost')].filter(a => { const ar = a.getBoundingClientRect(); return [...a.querySelectorAll('*')].some(e => { const r = e.getBoundingClientRect(); return r.width && r.height && (r.right > ar.right + 1.5 || r.left < ar.left - 1.5) && !e.closest('.track,.car,.fs2-fio,.ht-posts') }) }).map(a => a.id) }));
    ok(l.vz <= 0 && !l.fora.length, `${w}px: sem rolagem para o lado no Feed`, l);
    await ev(A, id => cs123Abrir(id), col.id); await sleep(300);
    ok(await ev(A, () => { const s = $('#layer .cs123-sc'); return s.scrollWidth <= s.clientWidth + 1 && document.scrollingElement.scrollWidth <= innerWidth }), `${w}px: a coluna cabe`);
    if (w === 360) await shot(A, '15-coluna-360');
    await fecha(A);
  }
  await A.setViewportSize({ width: 390, height: 844 });
  const Ak = await abrir('a', { dark: true, n: 'k' }); await feed(Ak); await pinta(Ak); await ev(Ak, () => renderPosts()); await sleep(300);
  await mostra(Ak, col.id, '16-escuro-feed-coluna');
  await ev(Ak, id => cs123Abrir(id), col.id); await sleep(400); await shot(Ak, '17-escuro-leitura');
  ok(await ev(Ak, () => { const lum = s => { const v = s.match(/[\d.]+/g).slice(0, 3).map(Number); return (v[0] * 299 + v[1] * 587 + v[2] * 114) / 1000 }; return lum(getComputedStyle($('#layer .cs123-ler')).backgroundColor) < 80 && lum(getComputedStyle($('#layer .cs123-corpo p')).color) > 150 }), 'escuro: leitura com fundo escuro e texto claro');
  await Ak.close();
  // 4× CPU: abrir a coluna e voltar
  const cdp = await A.context().newCDPSession(A); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const t0 = Date.now(); await ev(A, id => cs123Abrir(id), col.id); await esperar(A, () => !!$('#layer .cs123-corpo p')); const t1 = Date.now() - t0;
  await ev(A, () => history.back()); await sleep(400); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  ok(t1 < 1500, '4× CPU: a coluna abre rápido', t1);

  const errs = [A, B, C, D, E].flatMap(p => p._erros);
  ok(!errs.length, 'sem erros no console (banco v9)', JSON.stringify(errs.slice(0, 5)));
  await br.close();

  /* ================= banco ANTES da v9 (como em produção hoje) ================= */
  const H2 = await require('../harness').criar({ sql: __dirname + '/../prumo-supabase.antes-v9.sql' });
  const i2 = {}; for (const k of ['a', 'b', 'd']) i2[k] = await H2.criarConta(k + '@x', '123456');
  await H2.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Dani Rocha','membro')`, [i2.a, i2.b, i2.d]);
  await H2.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [i2.a, i2.b]);
  const br2 = await U.navegador();
  const abrir2 = async k => { const p = U.erros(await H2.pagina(br2, { sessao: { user: { id: i2[k], email: k + '@x' } } }), k.toUpperCase() + '9');
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(BASE2); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on === false, null, 15000); await sleep(400); return p };
  const B9 = await abrir2('b'), A9 = await abrir2('a'), D9 = await abrir2('d');
  ok(await ev(B9, () => V9.on === false), 'antes da v9: detectado');
  await ev(B9, () => { go('feed'); criarAbrir('post') }); await sleep(400); await clk(B9, '#layer [data-cs123ini]'); await sleep(300);
  await B9.fill('#cs123-tit', 'Coluna comprida demais'); await B9.fill('#cs123-corpo', 'Texto da coluna que passa do limite antigo. '.repeat(160));
  const cont = await ev(B9, () => $('[data-cs123n="corpo"]').textContent);
  ok(/de 6\.000/.test(cont) && /por enquanto, o limite é 6\.000/.test(cont), 'antes da v9: contador "de 6.000 (por enquanto…)"', cont);
  ok(await ev(B9, () => $('#cs123-corpo').value.length <= 6000), 'antes da v9: o campo não aceita mais de 6.000');
  await ev(B9, () => { CS123.ed.corpo = 'Texto longo demais. '.repeat(400) }); await ev(B9, () => cs123Publicar()); await sleep(300);
  ok(await ev(B9, () => /até 6\.000 caracteres/.test(document.querySelector('.toast')?.textContent || '') && !!CS123.ed), 'antes da v9: passou de 6.000 → "Por enquanto, a coluna pode ter até 6.000 caracteres"');
  await ev(B9, () => { CS123.ed.corpo = CS123.ed.corpo.slice(0, 3000); $('#cs123-corpo').value = CS123.ed.corpo }); await ev(B9, () => cs123Publicar()); await sleep(1200);
  const c9 = (await H2.sql(`select id, estilo, publico from publicacoes where autor=$1`, [i2.b]))[0];
  ok(c9 && c9.publico === 'amigos' && c9.estilo.coluna.corpo.length >= 2900, 'antes da v9: publica para amigos com o texto no estilo');
  await ev(A9, () => { PUB.sig = ''; return pubCarregar() }); await ev(A9, id => cs123Abrir(id), c9.id); await sleep(300);
  await clk0(A9, '#layer .cs123-fim [data-a="like"]'); await sleep(500); await ev(A9, () => history.back()); await sleep(300);
  await ev(B9, () => { PS.t = 0; return psCarregar() }); await ev(B9, id => cs123Abrir(id), c9.id); await sleep(300);
  ok(/Gostei · 1/.test(await ev(B9, () => $('#layer .cs123-fim').innerText)), 'antes da v9: a amiga curte e a autora vê');
  await ev(D9, u => abrirPerfil(u), i2.b); await sleep(500);
  ok(await ev(D9, () => !document.querySelector('[data-cs123seg],.cs123-num')), 'antes da v9: sem Seguir nem números');
  const errs2 = [A9, B9, D9].flatMap(p => p._erros);
  ok(!errs2.length, 'sem erros no console (banco antes da v9)', JSON.stringify(errs2.slice(0, 5)));
  await br2.close();

  const r = U.resumo(); r.RES.filter(x => /^FAIL/.test(x)).forEach(x => console.log(x.slice(0, 900))); console.log(`\nRESUMO t_qa_noite_a: ${r.OKS} ok, ${r.FALHAS} falhas`);
  srv.kill(); srv2.kill(); process.exit(r.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); if (srv) srv.kill(); if (srv2) srv2.kill(); process.exit(1) });
