// App com o SQL v8: foto de perfil vista pelo amigo, arquivar/mostrar post, curtir comentário (post e notícia) com Atividade,
// e mensagem apagada levando a reação (C25). Capturas em qa/v8/ (claro, 390 px, com o foco em notícia ligado, como em produção).
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8991, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'v8'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [a, b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [a, b]);
  const br = await U.navegador();
  const abrir = async (uid, email, nome) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: uid, email } } }), nome); await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-foco', '1') } catch (e) { } });
    await p.goto(BASE); await esperar(p, () => S.membro && S.amigosOk && typeof V8 !== 'undefined' && V8.on === true, null, 15000); return p };
  const A = await abrir(a, 'a@x', 'A'), B = await abrir(b, 'b@x', 'B');
  ok(await ev(A, () => V8.on === true) && await ev(B, () => V8.on === true), 'detecta o SQL v8');
  const fecha = p => ev(p, () => { while ($('#layer2')?.innerHTML || $('#layer').innerHTML) closeLayer() });

  /* ---------- 1. foto de perfil ---------- */
  await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(500);
  ok(!!(await A.$('#v-me [data-fp8]')), 'perfil: botão "Editar foto"');
  await clk(A, '#v-me [data-fp8]'); await sleep(300);
  const png = await ev(A, () => { const c = document.createElement('canvas'); c.width = 900; c.height = 600; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 900, 600); gr.addColorStop(0, '#5f7a8c'); gr.addColorStop(1, '#2c3e50'); g.fillStyle = gr; g.fillRect(0, 0, 900, 600);
    g.fillStyle = '#e8c9a8'; g.beginPath(); g.arc(450, 250, 110, 0, 7); g.fill(); g.fillStyle = '#1f2a36'; g.beginPath(); g.ellipse(450, 600, 230, 180, 0, 0, 7); g.fill();
    g.fillStyle = '#3b2a20'; g.beginPath(); g.arc(450, 205, 112, Math.PI, 0); g.fill(); return c.toDataURL('image/png').split(',')[1] });
  await A.setInputFiles('#fp8-file', { name: 'eu.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  ok(await esperar(A, () => !!document.querySelector('.sheet .fp8-cx img') && !!document.querySelector('[data-fp8ok]')), 'foto: abre o recorte quadrado');
  const bx = await (await A.$('.sheet .fp8-cx')).boundingBox(); await A.mouse.move(bx.x + 120, bx.y + 120); await A.mouse.down(); await A.mouse.move(bx.x + 60, bx.y + 110, { steps: 4 }); await A.mouse.up();
  await A.$eval('#fp8-z', e => { e.value = '1.3'; e.dispatchEvent(new Event('input')) });
  await A.screenshot({ path: path.join(QA, 'v8-1-foto-recorte.png') });
  await clk(A, '[data-fp8ok]');
  ok(await esperar(A, () => !$('#layer2')?.innerHTML && !$('#layer').innerHTML && !!(S.membros[S.uid] || {}).foto, null, 8000), 'foto: salva e fecha');
  const foto = (await H.sql(`select foto from membros where uid=$1`, [a]))[0].foto;
  ok(foto && foto.indexOf(a + '/') === 0 && H.ST.has('fotos/' + foto), 'foto: arquivo na pasta do Pedro e caminho gravado no banco', foto);
  const tam = await ev(A, async f => { const r = await SB.storage.from('fotos').createSignedUrls([f], 60); const im = new Image(); im.src = r.data[0].signedUrl; await im.decode(); return [im.naturalWidth, im.naturalHeight] }, foto);
  ok(tam[0] === 400 && tam[1] === 400, 'foto: quadrada e pequena (400 × 400)', tam);
  ok(await esperar(A, () => !!document.querySelector('#v-me .pf-avi .av.av8 img')), 'foto: aparece no próprio perfil');
  // troca: o arquivo antigo sai do Storage
  await clk(A, '#v-me [data-fp8]'); await sleep(250); await A.setInputFiles('#fp8-file', { name: 'eu2.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await esperar(A, () => !!document.querySelector('[data-fp8ok]')); await clk(A, '[data-fp8ok]'); await esperar(A, f => (S.membros[S.uid] || {}).foto && S.membros[S.uid].foto !== f, foto, 8000);
  const foto2 = (await H.sql(`select foto from membros where uid=$1`, [a]))[0].foto;
  ok(foto2 !== foto && H.ST.has('fotos/' + foto2) && !H.ST.has('fotos/' + foto), 'foto: trocar apaga o arquivo antigo');

  /* ---------- 2. Bia vê a foto e o post; Pedro arquiva ---------- */
  const id = await ev(A, async () => { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Votação da reforma tributária fica para a semana que vem, diz relator', fotos: [], estilo: { v: 2 } }).select('id'); await pubCarregar(); return r.data[0].id });
  await B.goto(BASE); await esperar(B, () => S.membro && S.amigosOk && V8.on === true, null, 15000);
  await ev(B, () => pubCarregar()); await sleep(600);
  ok(await ev(B, u => (S.membros[u] || {}).foto && S.membros[u].foto.indexOf(u + '/') === 0, a), 'amiga: recebe o caminho da foto do Pedro');
  await ev(B, id => { closeLayer(); go('feed'); FILTRO = 'tudo'; renderPosts(); garantirPost('u:' + id) }, id); await sleep(400);
  ok(await esperar(B, id => !!document.querySelector(`.upost[data-pid="u:${id}"] .up-au .av.av8 img[src^="data:image"]`), id, 6000), 'amiga: vê a foto do Pedro no post (no lugar das iniciais)');
  ok(await ev(B, u => { const h = avatar(u); return /av8/.test(h) || /data-avf/.test(h) }, a) && await ev(B, u => !/av8|data-avf/.test(avatar(u)), b), 'avatar: com foto usa a foto; sem foto, as iniciais');
  await ev(B, id => document.getElementById('p-u:' + id).scrollIntoView({ block: 'start' }), id); await sleep(300);
  await B.screenshot({ path: path.join(QA, 'v8-2-foto-vista-pela-amiga.png') });
  // Pedro arquiva pelo menu ⋯
  await ev(A, id => { closeLayer(); go('feed'); FILTRO = 'tudo'; renderPosts(); garantirPost('u:' + id); document.querySelector(`[data-umenu="${id}"]`).click() }, id); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('.sheet [data-u8arq][data-on="1"]') && !!document.querySelector('.sheet [data-uapagar]')), 'menu ⋯ do próprio post: "Arquivar" antes de "Apagar post"');
  await A.screenshot({ path: path.join(QA, 'v8-3-arquivar-menu.png') });
  await clk(A, '.sheet [data-u8arq]'); await sleep(900);
  ok((await H.sql(`select arquivado from publicacoes where id=$1`, [id]))[0].arquivado === true, 'arquivar: gravado no banco');
  ok(await ev(A, id => !document.querySelector(`#posts .upost[data-pid="u:${id}"]`) && !pubVisiveis().some(x => x.id === id), id), 'arquivar: some do Feed e da grade do Pedro');
  await ev(B, () => { PUB.sig = ''; return pubCarregar() }); await sleep(500);
  ok(await ev(B, id => !pubDe(id) && !document.querySelector(`.upost[data-pid="u:${id}"]`), id), 'arquivar: some para a Bia (o servidor não entrega)');
  // Conta › Posts arquivados › Mostrar no perfil
  await ev(A, () => { closeLayer(); go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(400);
  ok(!!(await A.$('#v-me [data-arq8]')), 'Conta: "Posts arquivados" junto do Arquivo de stories');
  await clk(A, '#v-me [data-arq8]');
  ok(await esperar(A, () => !!document.querySelector('#layer .pfv-arq8 [data-arq8i]')), 'Posts arquivados: o post aparece');
  await A.screenshot({ path: path.join(QA, 'v8-4-posts-arquivados.png') });
  await clk(A, '#layer [data-arq8i="0"]'); await sleep(400);
  ok(await esperar(A, () => !!document.querySelector('#layer .pfv .arq8-bar [data-u8arq]')), 'aberto: faixa "Mostrar no perfil"');
  await clk(A, '#layer .arq8-bar [data-u8arq]'); await sleep(900);
  ok((await H.sql(`select arquivado from publicacoes where id=$1`, [id]))[0].arquivado === false, 'mostrar no perfil: gravado no banco');
  await ev(B, () => { PUB.sig = ''; return pubCarregar() }); await sleep(500);
  ok(await ev(B, id => !!pubDe(id), id), 'mostrar no perfil: volta para a Bia');
  await fecha(A); await ev(A, () => { go('feed') });

  /* ---------- 3. curtir comentário ---------- */
  await ev(B, id => { closeLayer(); openComments('u:' + id) }, id); await sleep(300);
  await B.fill('#ctext', 'Relator já tinha avisado na terça'); await clk(B, '#cform .sendc'); await sleep(900);
  const cid = (await H.sql(`select chave from pub_reacoes where pub=$1 and tipo='comentario'`, [id]))[0]?.chave;
  ok(!!cid, 'Bia comentou no post do Pedro');
  await ev(B, () => closeLayer()); await sleep(200);
  await ev(A, () => { PS.t = 0; return psCarregar() }); await sleep(300);
  await ev(A, id => openComments('u:' + id), id);
  ok(await esperar(A, () => !!document.querySelector('#cbox .clist li .cc8')), 'comentário: botão de curtir em cada comentário');
  await clk(A, '#cbox .cc8'); await sleep(800);
  ok(+(await H.sql(`select count(*) n from com_curtidas where autor=$1 and cid=$2 and uid=$3 and pub=$4`, [b, cid, a, id]))[0].n === 1, 'comentário: curtida gravada (autor, comentário, post)');
  ok(await ev(A, () => { const x = document.querySelector('#cbox .cc8'); return x.classList.contains('on') && x.getAttribute('aria-pressed') === 'true' && x.querySelector('em').textContent === '1' }), 'comentário: marcado, com 1');
  await A.screenshot({ path: path.join(QA, 'v8-5-curtir-comentario.png') });
  // Bia vê o número e a Atividade
  await ev(B, id => openComments('u:' + id), id);
  ok(await esperar(B, () => (document.querySelector('#cbox .cc8 em') || {}).textContent === '1'), 'a autora vê "1" no próprio comentário');
  await ev(B, () => closeLayer()); await ev(B, () => { AT.t = 0; return atCarregar() }); await sleep(400);
  await ev(B, () => abrirAtividade()); await sleep(700);
  const atx = await ev(B, () => document.querySelector('#layer .pfv-at')?.textContent || '');
  ok(/Pedro Brandão curtiu seu comentário: “Relator já tinha avisado na terça”/.test(atx), 'Atividade: "Pedro curtiu seu comentário: “…”"', atx.slice(0, 200));
  await B.screenshot({ path: path.join(QA, 'v8-6-atividade-comentario.png') });
  // tocar na linha abre os comentários do post
  await ev(B, () => { const i = AT._l.findIndex(x => x.acao === 'cc8'); document.querySelector(`#layer [data-ati="${i}"]`).click() }); await sleep(700);
  ok(await esperar(B, () => !!document.querySelector('#cbox .cc8')), 'Atividade: tocar abre os comentários');
  await fecha(B);
  // descurtir
  await clk(A, '#cbox .cc8'); await sleep(700);
  ok(+(await H.sql(`select count(*) n from com_curtidas where cid=$1`, [cid]))[0].n === 0 && await ev(A, () => !document.querySelector('#cbox .cc8').classList.contains('on')), 'comentário: tocar de novo tira a curtida');
  await fecha(A);
  // comentário de notícia: o mesmo botão, gravado sem post
  const pid = await ev(B, () => FEED.pautas[0].id);
  await ev(B, p => openComments(p), pid); await sleep(300); await B.fill('#ctext', 'Boa explicação'); await clk(B, '#cform .sendc'); await sleep(1200); await fecha(B);
  await sleep(500); await ev(A, p => openComments(p), pid);
  ok(await esperar(A, () => [...document.querySelectorAll('#cbox .clist li')].some(li => /Boa explicação/.test(li.textContent) && li.querySelector('.cc8')), null, 6000), 'notícia: comentário da Bia com o botão de curtir');
  await ev(A, () => [...document.querySelectorAll('#cbox .clist li')].find(li => /Boa explicação/.test(li.textContent)).querySelector('.cc8').click()); await sleep(800);
  ok(+(await H.sql(`select count(*) n from com_curtidas where autor=$1 and uid=$2 and pub is null`, [b, a]))[0].n === 1, 'notícia: curtida gravada (sem post)');
  await fecha(A);
  // a Bia apaga o comentário da notícia: a curtida vai junto
  await ev(B, p => openComments(p), pid); await sleep(300);
  await ev(B, () => { const li = [...document.querySelectorAll('#cbox .clist li')].find(li => /Boa explicação/.test(li.textContent)); const x = li.querySelector('[data-apagar]'); x.click(); x.click() }); await sleep(1200);
  ok(+(await H.sql(`select count(*) n from com_curtidas where autor=$1 and pub is null`, [b]))[0].n === 0, 'notícia: apagar o comentário apaga a curtida');
  await fecha(B);

  /* ---------- 4. mensagem apagada leva a reação (C25) ---------- */
  await ev(A, u => dmEnviar(u, { texto: 'Me liga depois' }, true), b); await sleep(800);
  const mid = (await H.sql(`select id from mensagens where de=$1 and texto='Me liga depois'`, [a]))[0].id;
  await ev(B, ([u, m]) => dmEnviar(u, { texto: '❤️', tipo: 'reacao_msg', snap: { ref: m } }, true), [a, mid]); await sleep(800);
  ok(+(await H.sql(`select count(*) n from mensagens where tipo='reacao_msg' and snap->>'ref'=$1`, [mid]))[0].n === 1, 'mensagem com uma reação da Bia');
  await ev(A, async m => { if (typeof dmCarregar === 'function') { } await dmApagar(m) }, mid); await sleep(900);
  ok(+(await H.sql(`select count(*) n from mensagens where id::text=$1 or (tipo='reacao_msg' and snap->>'ref'=$1)`, [mid]))[0].n === 0, 'C25: Pedro apaga a mensagem e a reação da Bia sai do banco');

  ok(!A._erros.length && !B._erros.length, 'sem erros na página', A._erros.concat(B._erros).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_v8_app: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
